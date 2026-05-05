# PaymentService Overview

## 1. Mục tiêu của PaymentService

`PaymentService` là microservice phụ trách:

- Khởi tạo giao dịch thanh toán
- Mô phỏng quá trình xử lý thanh toán (tạo QR Code, đường dẫn URL thanh toán ví điện tử)
- Xác nhận trạng thái giao dịch khi nhận được kết quả (webhook)
- Gửi thông báo sự kiện (Publish Events) tới hệ thống Message Broker (RabbitMQ) sau khi thanh toán thành công để các dịch vụ khác (như `BookingService`, `NotificationService`) lắng nghe và xử lý.

Công nghệ đang dùng:

- ASP.NET Core Web API (.NET 9)
- Clean Architecture
- PostgreSQL
- Entity Framework Core
- RabbitMQ
- Event-Driven Architecture

---

## 2. Cấu trúc project

Thư mục hiện tại:

- `Payment.API`
- `Payment.Application`
- `Payment.Domain`
- `Payment.Infrastructure`
- `Payment.Tests` (Sẽ được bổ sung nếu viết Test)

Mỗi project có vai trò riêng, tuân theo hướng phụ thuộc của Clean Architecture:

- `Payment.API` phụ thuộc `Application` và `Infrastructure`.
- `Payment.Application` phụ thuộc `Domain` và `BuildingBlocks` (nơi định nghĩa Event chung).
- `Payment.Infrastructure` phụ thuộc `Domain` và `Application`.
- `Payment.Domain` không phụ thuộc layer nào khác.

---

## 3. Chức năng từng project

### 3.1 `Payment.Domain`

Đây là lớp nghiệp vụ cơ bản nhất, chứa:

- Entity nghiệp vụ
- Enum trạng thái và phương thức thanh toán

File chính:

- `PaymentTransaction.cs`: Thực thể lưu trữ Id, BookingId, Amount, Status, Method, thông tin chi tiết thanh toán,...
- `PaymentStatus.cs`: Enum chứa các trạng thái `Pending`, `Success`, `Failed`.
- `PaymentMethod.cs`: Enum chứa các phương thức như `BankTransfer`, `VNPay`, `Momo`.

Nhiệm vụ chính:

- Định nghĩa đối tượng giao dịch cốt lõi `PaymentTransaction`.
- Khai báo các hằng số hoặc quy tắc độc lập hoàn toàn với Framework/Database.
- Lớp `Domain` không chứa EF Core, Controller hay logic HTTP.

### 3.2 `Payment.Application`

Đây là lớp xử lý use case.

File chính:

- `PaymentManager.cs` (Implementation của IPaymentService)
- `IPaymentService.cs`, `IPaymentRepository.cs`, `IRabbitMQProducer.cs`
- Thư mục `DTOs`: `PaymentRequestDto`, `PaymentResponseDto`

Nhiệm vụ chính:

- Xử lý tạo thông tin thanh toán (`ProcessPaymentAsync`) bao gồm sinh mã QR, URL ứng với phương thức được chọn.
- Xử lý xác nhận thanh toán (`ConfirmPaymentAsync`).
- Xử lý Logic để thiết lập Event `PaymentCompletedEvent` (thuộc thư mục `BuildingBlocks`).
- Gọi sang `IRabbitMQProducer` để bắn tín hiệu Event sau khi Update database thành công.

`Application` không truy cập trực tiếp database hay RabbitMQ. Layer này chỉ thiết lập business logic và gọi qua interface như `IPaymentRepository`, `IRabbitMQProducer`.

### 3.3 `Payment.Infrastructure`

Đây là lớp hạ tầng, implement các interface trong `Application` và kết nối công nghệ thực tế.

File chính:

- `PaymentDbContext.cs`: DbContext của EF Core
- `PaymentRepository.cs`: Implementation để thêm, sửa, lấy Payment
- `RabbitMQProducer.cs`: Logic kết nối RabbitMQ và trigger sự kiện

Nhiệm vụ chính:

- Kết nối PostgreSQL qua EF Core
- Cấu hình Mapping cấu trúc bảng `PaymentTransactions`
- Lưu, đọc, cập nhật entity `PaymentTransaction` xuống CSDL thực
- Mở liên kết TCP với RabbitMQ Host để Publish messages lên Topic/Exchange `travel_event_bus`.

### 3.4 `Payment.API`

Đây là layer giao tiếp HTTP REST/Gateway.

File chính:

- `Program.cs`: Nơi setup DI, Cấu hình OpenApi(Swagger), DbContext auto migration
- `PaymentsController.cs`: Chứa các endpoint liên quan
- `appsettings.json`: Chứa connection strings PostgreSQL và RabbitMQ configs
- `Dockerfile`: Script container hóa.

Nhiệm vụ chính:

- Khởi tạo Dependency Injection container (DI)
- Mở Swagger UI để test dễ dàng
- Định nghĩa API endpoint `/api/payments/...`
- Gọi Database Migrate tự động khi run App.

---

## 4. Luồng hoạt động tổng quan

### 4.1 Khởi tạo quy trình thanh toán (Process)

Lượt đi:

1. Client (hoặc service khác gọi nội bộ qua api) gọi `POST /api/payments/process` với payload gồm BookingId, Amount và PaymentMethod.
2. `PaymentsController` nhận request và forward payload dạng DTO sang `PaymentManager`.
3. `PaymentManager`:
   - Tạo đối tượng Domain `PaymentTransaction` mới có trạng thái `Pending`.
   - Sinh thông tin mô phỏng (ví dụ: chuỗi nạp thẻ, QR Momo hoặc VNPay URL).
4. `PaymentManager` gọi `IPaymentRepository.AddAsync` để lưu record vào DB.
5. API Controller trả về HTTP 200 kèm DTO `PaymentResponseDto` (chứa URL/Mã QR).

### 4.2 Xác nhận thanh toán từ đối tác (Webhook / Confirm)

Thông thường khi người dùng quét QR trả tiền ở ứng dụng banking thành công, Webhook của VNPay hoặc Momo sẽ gọi lại Endpoint này của chúng ta.

Lượt đi:

1. Webhook gọi `POST /api/payments/confirm/{paymentId}`.
2. Controller nhận PaymentId và gọi sang `ConfirmPaymentAsync` của `PaymentManager`.
3. `PaymentManager`:
   - Fetch giao dịch từ DB lên (`IPaymentRepository.GetByIdAsync`).
   - Kiểm tra nếu Payment đã thanh toán (`Success`) thì bypass.
   - Nếu đang `Pending`, đổi thành `Success` và lưu cập nhật xuống thẻ.
4. Ngay khi DB thao tác thành công, `PaymentManager` khởi tạo `PaymentCompletedEvent`.
5. Đẩy cho `IRabbitMQProducer.PublishEvent(paymentEvent)`. Mảnh thông tin biến thành byte stream và du hành trên RabbitMQ Queue.
6. Controllers trả 200 về Webhook.

### 4.3 Endpoint Chạy Giả lập (Simulate)

Trong môi trường local khi không cắm webhook thật:
- Client gọi `POST /api/payments/simulate/{paymentId}`.
- Nó kích hoạt ngầm `ConfirmPaymentAsync` để đổi System State, kiểm tra luồng Publish RabbitMQ mượt mà.

---

## 5. Dữ liệu được lưu ở đâu

PostgreSQL đang lưu:

- Bảng `PaymentTransactions` (Ánh xạ từ Entity)

Mapping được cấu hình tại:

- `PaymentDbContext.cs` qua Data Annotations / Fluent API.

Tự động Migrate:
Service có logic tự áp dụng Migration "InitialCreate" khi `Program.cs` bắt đầu chạy. Không cần phải update tay.

---

## 6. Các endpoint hiện có

Swagger thường được chạy tự do ở:
- `http://localhost:<port>/swagger`

### 6.1 Process Payment

`POST /api/payments/process`

Body:

```json
{
  "bookingId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 500000,
  "method": 1
}
```
*(Method: 1 = BankTransfer, 2 = VNPay, 3 = Momo)*

Tác dụng:
- Xử lý mock và trả về payload hướng dẫn thanh toán QR/URL.

### 6.2 Confirm Payment / Webhook

`POST /api/payments/confirm/{paymentId}`

Tác dụng:
- Đổi status thành 2 (Success). (Phương thức POST, không cần body payload vì mockup đơn giản).

### 6.3 Giả lập thanh toán nhanh (Simulate)

`POST /api/payments/simulate/{paymentId}`

Tác dụng:
- Kịch bản tương tự như Confirm nhưng sinh riêng cho FE / Developer kiểm tra quy trình RabbitMQ Event bắn sang `NotificationService` hay `BookingService`.

---

## 7. Cách kiểm tra dữ liệu bằng Docker PostgreSQL

Bạn có thể chạy câu lệnh sau trên Docker/Powershell của bạn nếu DB đang chạy trên Postgres container:

```powershell
# Ví dụ thay psql -U theo thông tin cài đặt DB
docker exec -it <postgres_container_name> psql -U postgres -d PaymentDb -c "select \"Id\", \"BookingId\", \"Amount\", \"Status\" from \"PaymentTransactions\";"
```

## 8. Tóm tắt nhanh

- `Payment.Domain`: Khai báo PaymentTransaction, trạng thái Giao dịch
- `Payment.Application`: Core của PaymentService, xử lý Request, tạo QR, Update DB và Publish Event.
- `Payment.Infrastructure`: Triển khai kết nối PostgreSQL (EF Core) và RabbitMQ Node.
- `Payment.API`: Http Endpoint, Dependency Injection, System Boot.
- `BuildingBlocks`: Không gian chứa chuẩn chung như `PaymentCompletedEvent` dùng để định nghĩa Message Schema sẽ nằm trên Queue.
