# ReportService Overview

## 1. Mục tiêu của ReportService

`ReportService` là microservice phụ trách:

- Cung cấp báo cáo và thống kê cho hệ thống quản lý du lịch
- Lắng nghe sự kiện từ RabbitMQ để tích lũy dữ liệu vào Read Model riêng
- Phục vụ Dashboard Admin với các chỉ số kinh doanh quan trọng

Công nghệ đang dùng:

- ASP.NET Core Web API (.NET 8)
- Clean Architecture
- PostgreSQL (Read Model DB)
- **Dapper** (truy vấn tối ưu, thay thế EF Core cho report)
- **RabbitMQ** (Consumer nhận event từ BookingService / PaymentService)
- JWT Bearer Authentication (Admin only)

---

## 2. Kiến trúc đặc biệt: CQRS Read Model

`ReportService` không truy cập trực tiếp database của BookingService hay PaymentService. Thay vào đó, nó duy trì một **Read Model riêng** (bảng `BookingSnapshots`) được xây dựng từ các event nhận được qua RabbitMQ.

Đây là triển khai **CQRS (Command Query Responsibility Segregation)** ở tầng service:

- **Write side**: RabbitMQ Consumer nhận event → lưu vào `BookingSnapshots`
- **Read side**: Dapper query tối ưu từ `BookingSnapshots` để phục vụ API báo cáo

---

## 3. Cấu trúc project

Thư mục hiện tại:

- `Report.API`
- `Report.Application`
- `Report.Domain`
- `Report.Infrastructure`

Phụ thuộc:

- `Report.API` → `Application` + `Infrastructure`
- `Report.Application` → `Domain`
- `Report.Infrastructure` → `Domain` + `Application`
- `Report.Domain` không phụ thuộc layer nào

---

## 4. Chức năng từng project

### 4.1 `Report.Domain`

Lớp mô tả các Read Model (không phải Entity có EF Core định nghĩa, mà là POCO đơn giản dùng cho Dapper mapping).

File chính:

- `ReadModels/RevenueReport.cs`: Thống kê doanh thu theo ngày (Date, TotalRevenue, TotalBookings)
- `ReadModels/TopTourReport.cs`: Thông tin tour phổ biến (TourId, TourName, BookingCount)
- `ReadModels/BookingSnapshot.cs`: Bảng read model lưu từng booking event (Id, BookingId, TourId, Amount, IsPaid, CreatedAt...)

### 4.2 `Report.Application`

Lớp xử lý use case và định nghĩa interfaces.

File chính:

- `Interfaces/IReportRepository.cs`: Contract cho query và write snapshot
- `Interfaces/IReportService.cs`: Contract cho business logic lớp API
- `DTOs/`: `RevenueReportDto`, `BookingSummaryDto`, `TopTourDto`
- `Services/ReportManager.cs`: Triển khai `IReportService`, chuyển đổi Domain model sang DTO

### 4.3 `Report.Infrastructure`

Lớp hạ tầng với 2 thành phần chính:

**1. ReportRepository** - truy vấn Dapper thuần SQL:
- `GetRevenueReportAsync`: GROUP BY DATE_TRUNC theo ngày, lọc theo khoảng thời gian, chỉ tính booking đã thanh toán
- `GetTotalBookingsAsync`: COUNT đơn giản
- `GetTopToursAsync`: GROUP BY TourId, ORDER BY COUNT DESC với LIMIT
- `SaveBookingSnapshotAsync`: INSERT với ON CONFLICT DO NOTHING (idempotent)
- `MarkSnapshotAsPaidAsync`: UPDATE IsPaid = true

**2. ReportEventConsumer** - BackgroundService lắng nghe RabbitMQ:
- Bind queue `report_queue` vào exchange `travel_event_bus`
- Routing key: `BookingCreatedEvent` và `PaymentCompletedEvent`
- Deserialize payload và gọi Repository để cập nhật Read Model

### 4.4 `Report.API`

Lớp HTTP và setup.

File chính:

- `Controllers/ReportsController.cs`: 3 endpoint, bảo vệ bằng `[Authorize(Roles = "Admin")]`
- `Program.cs`: DI setup, JWT Auth, Swagger, và **tạo bảng tự động** (EnsureTableCreatedAsync) khi khởi động
- `appsettings.json`: Connection String, JWT Settings, RabbitMQ config
- `Dockerfile`: Multi-stage build với .NET 8

---

## 5. Luồng hoạt động

### 5.1 Thu thập dữ liệu qua Event (Write side)

```
BookingService ──publish──► RabbitMQ [travel_event_bus]
                                        │
                             routing: BookingCreatedEvent
                                        │
                             ReportEventConsumer.Received
                                        │
                             SaveBookingSnapshotAsync
                                        │
                             BookingSnapshots (PostgreSQL)
```

```
PaymentService ──publish──► RabbitMQ [travel_event_bus]
                                        │
                            routing: PaymentCompletedEvent
                                        │
                            ReportEventConsumer.Received
                                        │
                            MarkSnapshotAsPaidAsync (IsPaid = true)
                                        │
                            BookingSnapshots updated
```

### 5.2 Truy vấn báo cáo qua API (Read side)

```
Admin Client
    │
    ├─► GET /api/reports/revenue?fromDate=&toDate=
    │       → GROUP BY DATE_TRUNC, SUM(Amount) WHERE IsPaid = true
    │
    ├─► GET /api/reports/bookings
    │       → COUNT(*) FROM BookingSnapshots
    │
    └─► GET /api/reports/top-tours
            → GROUP BY TourId ORDER BY COUNT DESC LIMIT 10
```

---

## 6. Dữ liệu được lưu ở đâu

PostgreSQL `ReportDb` lưu một bảng duy nhất:

- Bảng `BookingSnapshots`

Schema tạo tự động khi service khởi động:

```sql
CREATE TABLE IF NOT EXISTS "BookingSnapshots" (
    "Id"            UUID          PRIMARY KEY,
    "BookingId"     UUID          NOT NULL UNIQUE,
    "TourId"        UUID          NOT NULL,
    "TourName"      VARCHAR(255)  NOT NULL,
    "CustomerEmail" VARCHAR(255)  NOT NULL,
    "Amount"        DECIMAL(18,2) NOT NULL,
    "IsPaid"        BOOLEAN       NOT NULL DEFAULT false,
    "CreatedAt"     TIMESTAMP     NOT NULL
);
```

> Không dùng EF Core Migration. Bảng được tạo bằng raw SQL trong `Program.cs` (EnsureTableCreatedAsync) – phù hợp với kiến trúc Dapper.

---

## 7. Các endpoint hiện có

Base URL local: `http://localhost:<port>`

Swagger: `http://localhost:<port>/swagger`

> Tất cả endpoint yêu cầu **JWT Token với Role = Admin**
> `Authorization: Bearer <accessToken>`

### 7.1 Thống kê doanh thu

`GET /api/reports/revenue`

Query params:

```
?fromDate=2026-01-01&toDate=2026-12-31
```

Response mẫu:

```json
[
  { "date": "2026-04-01T00:00:00Z", "totalRevenue": 15000000, "totalBookings": 12 },
  { "date": "2026-04-02T00:00:00Z", "totalRevenue": 8000000,  "totalBookings": 7  }
]
```

### 7.2 Tổng số booking

`GET /api/reports/bookings`

Response mẫu:

```json
{ "totalBookings": 248 }
```

### 7.3 Top tour phổ biến

`GET /api/reports/top-tours`

Response mẫu:

```json
[
  { "tourId": "abc-...", "tourName": "Tour Đà Nẵng 4N3Đ", "bookingCount": 58 },
  { "tourId": "def-...", "tourName": "Tour Phú Quốc 5N4Đ", "bookingCount": 45 }
]
```

---

## 8. Cách chạy nhanh

### 8.1 Chạy API

```powershell
dotnet run --project services\Report\Report.API\Report.API.csproj
```

Service sẽ:
1. Tự tạo bảng `BookingSnapshots` nếu chưa có
2. Khởi động ReportEventConsumer lắng nghe RabbitMQ
3. Mở Swagger UI

### 8.2 Kiểm tra dữ liệu

```powershell
docker exec -it <postgres_container> psql -U postgres -d ReportDb -c 'SELECT "BookingId", "TourName", "Amount", "IsPaid" FROM "BookingSnapshots";'
```

---

## 9. Tóm tắt nhanh

| Layer | Vai trò |
|-------|---------|
| `Report.Domain` | POCO Read Models: `RevenueReport`, `TopTourReport`, `BookingSnapshot` |
| `Report.Application` | Use cases, Interfaces (IReportRepository, IReportService), DTOs, ReportManager |
| `Report.Infrastructure` | Dapper queries tối ưu + RabbitMQ BackgroundService Consumer |
| `Report.API` | REST API (3 endpoints), JWT Auth, Swagger, auto-create table |

Luồng chính:

- Events từ RabbitMQ → Consumer → lưu/cập nhật `BookingSnapshots`
- Admin gọi API → Dapper SQL → tổng hợp từ `BookingSnapshots` → trả về báo cáo
