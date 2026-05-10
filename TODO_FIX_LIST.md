# 📋 DANH SÁCH CÁC PHẦN CẦN SỬA & CẢI THIỆN

> **Dự án**: Travel Company Microservices  
> **Ngày kiểm tra**: 05/05/2026  
> **Cập nhật lần cuối**: 06/05/2026  
> **Tổng số vấn đề**: 17 (4 Critical · 7 Medium · 6 Minor) — **Tất cả đã fix ✅**

---

## 🔴 P0 — PHẢI SỬA NGAY (Critical)

> Các lỗi này khiến hệ thống **KHÔNG HOẠT ĐỘNG** khi deploy.

### 1. ✅ Đồng bộ JWT Configuration

**Vấn đề**: User Service dùng JWT config hoàn toàn khác so với tất cả service còn lại + API Gateway → Token do User Service phát hành sẽ bị reject bởi mọi service khác.

**File cần sửa**:
- `services/User/User.API/appsettings.json`
- `services/User/User.Infrastructure/Settings/JwtOptions.cs`

**Chi tiết sửa**:

| Config | Hiện tại (User Service) | Cần đổi thành |
|---|---|---|
| Section name | `Jwt` | `JwtSettings` |
| Issuer | `TravelCompanySystem` | `TravelCompany_ApiGateway` |
| Audience | `TravelCompanyClients` | `TravelCompany_Users` |
| SecretKey | `super-secret-jwt-key-change-this-in-production-2026` | `ThisIsAVerySecretKeyForJwtAuthenticationInTravelCompany!` |
| DB Password | `123456` | `postgres` |

**Cách sửa**:
```diff
# services/User/User.API/appsettings.json
- "Jwt": {
-   "Issuer": "TravelCompanySystem",
-   "Audience": "TravelCompanyClients",
-   "SecretKey": "super-secret-jwt-key-change-this-in-production-2026",
+ "JwtSettings": {
+   "Issuer": "TravelCompany_ApiGateway",
+   "Audience": "TravelCompany_Users",
+   "SecretKey": "ThisIsAVerySecretKeyForJwtAuthenticationInTravelCompany!",
    "AccessTokenMinutes": 60,
    "RefreshTokenDays": 7
  }

# services/User/User.Infrastructure/Settings/JwtOptions.cs
- public const string SectionName = "Jwt";
+ public const string SectionName = "JwtSettings";

# services/User/User.API/appsettings.json — ConnectionString
- "PostgreSQL": "Host=localhost;Port=5432;Database=UserServiceDb;Username=postgres;Password=123456"
+ "PostgreSQL": "Host=localhost;Port=5432;Database=UserServiceDb;Username=postgres;Password=postgres"
```

**Cập nhật docker-compose.yml** (đổi env key cho nhất quán):
```diff
  user-service:
    environment:
-     Jwt__Issuer: "TravelCompany_ApiGateway"
-     Jwt__Audience: "TravelCompany_Users"
-     Jwt__SecretKey: "ThisIsAVerySecretKeyForJwtAuthenticationInTravelCompany!"
+     JwtSettings__Issuer: "TravelCompany_ApiGateway"
+     JwtSettings__Audience: "TravelCompany_Users"
+     JwtSettings__SecretKey: "ThisIsAVerySecretKeyForJwtAuthenticationInTravelCompany!"
```

---

### 2. ✅ Đồng bộ RabbitMQ Exchange & Routing Key

**Vấn đề**: Booking Service dùng exchange `travel.events` + routing key `booking.created`, còn Payment/Notification/Report dùng exchange `travel_event_bus` + routing key `BookingCreatedEvent` → Message không bao giờ được deliver.

**Quyết định**: Thống nhất dùng **`travel_event_bus`** (exchange) + **`BookingCreatedEvent`** / **`PaymentCompletedEvent`** (routing key) — vì 3 service (Payment, Notification, Report) đã dùng convention này.

**File cần sửa**:
- `services/Booking/Booking.API/appsettings.json`
- `services/Booking/Booking.Infrastructure/Options/RabbitMqOptions.cs`

**Cách sửa**:
```diff
# services/Booking/Booking.API/appsettings.json
  "RabbitMq": {
    "HostName": "localhost",
    "Port": 5672,
    "UserName": "guest",
    "Password": "guest",
-   "ExchangeName": "travel.events",
-   "BookingCreatedRoutingKey": "booking.created",
-   "PaymentCompletedRoutingKey": "payment.completed",
+   "ExchangeName": "travel_event_bus",
+   "BookingCreatedRoutingKey": "BookingCreatedEvent",
+   "PaymentCompletedRoutingKey": "PaymentCompletedEvent",
    "PaymentCompletedQueue": "bookingservice.payment.completed"
  }

# services/Booking/Booking.Infrastructure/Options/RabbitMqOptions.cs
- public string ExchangeName { get; set; } = "travel.events";
- public string BookingCreatedRoutingKey { get; set; } = "booking.created";
- public string PaymentCompletedRoutingKey { get; set; } = "payment.completed";
+ public string ExchangeName { get; set; } = "travel_event_bus";
+ public string BookingCreatedRoutingKey { get; set; } = "BookingCreatedEvent";
+ public string PaymentCompletedRoutingKey { get; set; } = "PaymentCompletedEvent";
```

---

### 3. ✅ Đồng bộ BookingCreatedEvent schema

**Vấn đề**: Có 3 nơi định nghĩa `BookingCreatedEvent` với schema khác nhau. Booking Service publish thiếu `CustomerEmail`, `TourName`, `TotalPrice` → Notification và Report nhận data rỗng.

**Quyết định**: Booking Service nên dùng chung `BuildingBlocks.Events.BookingCreatedEvent` (đã có đủ field).

**File cần sửa**:
- `services/Booking/Booking.Application/Events/BookingCreatedEvent.cs` — Xóa hoặc cập nhật
- `services/Booking/Booking.Infrastructure/Messaging/RabbitMqBookingEventPublisher.cs` — Dùng BuildingBlocks event
- `services/Booking/Booking.Application/Interfaces/IBookingEventPublisher.cs` — Cập nhật parameter type
- `services/Booking/Booking.Application/Services/*` — Cập nhật nơi tạo event, bổ sung lấy `CustomerEmail`, `TourName`, `TotalPrice` từ Tour Service

**Cách sửa**:
```diff
# services/Booking/Booking.Application/Events/BookingCreatedEvent.cs
- namespace Booking.Application.Events;
- public sealed record BookingCreatedEvent(
-     Guid BookingId, Guid UserId, Guid TourId,
-     string Status, DateTime CreatedAtUtc);

# Thay bằng dùng trực tiếp BuildingBlocks.Events.BookingCreatedEvent
# hoặc cập nhật local event cho match:
+ namespace Booking.Application.Events;
+ public sealed record BookingCreatedEvent(
+     Guid BookingId, Guid TourId, string TourName,
+     string CustomerEmail, decimal TotalPrice, string Status);
```

**Lưu ý**: Cần cập nhật logic tạo event trong BookingService để query thêm `TourName` + `Price` từ Tour Service (qua HTTP) và `CustomerEmail` từ User data (có thể truyền qua CreateBookingRequest).

---

### 4. ✅ Sửa init.sql — Tên database không khớp

**Vấn đề**: `init.sql` tạo `TourDb` và `BookingDb`, nhưng connection string khai báo `TourServiceDb` và `BookingServiceDb`.

**File cần sửa**:
- `docker/postgres/init.sql`

**Cách sửa**:
```diff
# docker/postgres/init.sql
  CREATE DATABASE "UserServiceDb";
- CREATE DATABASE "TourDb";
- CREATE DATABASE "BookingDb";
+ CREATE DATABASE "TourServiceDb";
+ CREATE DATABASE "BookingServiceDb";
  CREATE DATABASE "PaymentDb";
  CREATE DATABASE "StaffDb";
  CREATE DATABASE "ReportDb";
```

---

## 🟡 P1 — NÊN SỬA SỚM (Medium)

### 5. ✅ Thêm route API Gateway cho Auth, Payment, Staff, Report

**Vấn đề**: Gateway chỉ route 3 service (User, Tour, Booking). Thiếu hoàn toàn route cho Auth endpoints, Payment, Staff, Report.

**File cần sửa**:
- `services/ApiGateway/appsettings.json`
- `docker-compose.yml` (thêm cluster destinations + depends_on)

**Cần thêm vào `appsettings.json` → `ReverseProxy.Routes`**:
```json
"authRoute": {
  "ClusterId": "userCluster",
  "RateLimiterPolicy": "fixed",
  "Match": { "Path": "/api/auth/{**catch-all}" }
},
"paymentRoute": {
  "ClusterId": "paymentCluster",
  "AuthorizationPolicy": "Authenticated",
  "RateLimiterPolicy": "fixed",
  "Match": { "Path": "/api/payments/{**catch-all}" }
},
"staffRoute": {
  "ClusterId": "staffCluster",
  "AuthorizationPolicy": "Authenticated",
  "RateLimiterPolicy": "fixed",
  "Match": { "Path": "/api/staff/{**catch-all}" }
},
"reportRoute": {
  "ClusterId": "reportCluster",
  "AuthorizationPolicy": "Authenticated",
  "RateLimiterPolicy": "fixed",
  "Match": { "Path": "/api/reports/{**catch-all}" }
}
```

**Cần thêm vào `ReverseProxy.Clusters`**:
```json
"paymentCluster": {
  "Destinations": {
    "destination1": { "Address": "http://localhost:5004" }
  }
},
"staffCluster": {
  "Destinations": {
    "destination1": { "Address": "http://localhost:5005" }
  }
},
"reportCluster": {
  "Destinations": {
    "destination1": { "Address": "http://localhost:5006" }
  }
}
```

**Cần thêm vào `docker-compose.yml` → `api-gateway.environment`**:
```yaml
ReverseProxy__Clusters__paymentCluster__Destinations__destination1__Address: "http://payment-service:8080"
ReverseProxy__Clusters__staffCluster__Destinations__destination1__Address: "http://staff-service:8080"
ReverseProxy__Clusters__reportCluster__Destinations__destination1__Address: "http://report-service:8080"
```

---

### 6. ✅ Thêm JWT Authentication cho Tour Service

**Vấn đề**: Tour CRUD hoàn toàn public — bất kỳ ai cũng có thể tạo/sửa/xóa tour.

**File cần sửa**:
- `services/Tour/Tour.API/Program.cs`
- `services/Tour/Tour.API/Tour.API.csproj` (thêm JWT package nếu chưa có)
- `services/Tour/Tour.API/appsettings.json` (thêm JwtSettings section)
- `services/Tour/Tour.API/Controllers/ToursController.cs` (thêm `[Authorize]` cho CUD)

**Cần thêm vào Program.cs**:
- JWT Authentication config (giống Staff/Report)
- `app.UseAuthentication()` + `app.UseAuthorization()` trước `app.MapControllers()`

**Controller**:
- GET endpoints: `[AllowAnonymous]` (public cho xem tour)
- POST/PUT/DELETE: `[Authorize(Roles = "Admin")]`

---

### 7. ✅ Thêm JWT Authentication cho Booking Service

**Vấn đề**: Tương tự Tour — Booking endpoints hoàn toàn public.

**File cần sửa**:
- `services/Booking/Booking.API/Program.cs`
- `services/Booking/Booking.API/appsettings.json`
- `services/Booking/Booking.API/Controllers/BookingsController.cs`

**Controller**:
- `[Authorize]` cho tất cả endpoints (chỉ user đã login mới được đặt tour)

---

### 8. ✅ Thêm JWT Authentication + CORS + Middleware cho Payment Service

**File cần sửa**:
- `services/Payment/Payment.API/Program.cs`

**Cần thêm**:
```csharp
// CORS
builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// JWT Auth (giống Staff/Report)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* ... */ });

// Pipeline
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
```

---

### 9. ✅ Thêm CORS cho Staff Service

**File cần sửa**: `services/Staff/Staff.API/Program.cs`

**Cần thêm**:
```csharp
builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});
// ...
app.UseCors();
```

---

### 10. ✅ Thêm CORS cho Report Service

**File cần sửa**: `services/Report/Report.API/Program.cs`

**Thêm tương tự Staff Service.**

---

### 11. ✅ Sửa Front-end API URLs

**Vấn đề**: Front-end trỏ sai port và gọi trực tiếp service thay vì qua Gateway.

**File cần sửa**: `front-end/shared.js`

**Cách sửa (dùng Gateway)**:
```diff
  const API_CONFIG = Object.freeze({
-   userServiceUrl: 'http://localhost:5080',
-   tourServiceUrl: 'http://localhost:5088',
-   bookingServiceUrl: 'http://localhost:5142'
+   userServiceUrl: 'http://localhost:5000',
+   tourServiceUrl: 'http://localhost:5000',
+   bookingServiceUrl: 'http://localhost:5000'
  });
```

Hoặc nếu muốn gọi trực tiếp service (bypass Gateway):
```diff
-   userServiceUrl: 'http://localhost:5080',
-   tourServiceUrl: 'http://localhost:5088',
-   bookingServiceUrl: 'http://localhost:5142'
+   userServiceUrl: 'http://localhost:5001',
+   tourServiceUrl: 'http://localhost:5002',
+   bookingServiceUrl: 'http://localhost:5003'
```

---

## 🟠 P2 — CẢI THIỆN (Minor)

### 12. ✅ Sửa Booking → Tour Service BaseUrl

**File**: `services/Booking/Booking.API/appsettings.json`

```diff
  "TourService": {
-   "BaseUrl": "http://localhost:8080"
+   "BaseUrl": "http://localhost:5002"
  }
```

---

### 13. ✅ Thống nhất ApiResponse wrapper cho Payment, Staff, Report

**Vấn đề**: User, Tour, Booking dùng `ApiResponse<T>` wrapper chuẩn. Payment, Staff, Report trả raw object.

**Cần tạo**:
- Thêm `Models/ApiResponse.cs` vào Payment.API, Staff.API, Report.API (hoặc dùng chung từ BuildingBlocks)
- Cập nhật tất cả controller actions để wrap response

---

### 14. ✅ Thêm ExceptionHandlingMiddleware cho Payment, Staff, Report

**Vấn đề**: Lỗi sẽ trả raw 500 thay vì JSON format chuẩn.

**Cần tạo**: Middleware tương tự User/Tour/Booking, hoặc tạo chung trong BuildingBlocks.

---

### 15. ✅ Fix DDD Encapsulation cho Payment + Staff entities

**File cần sửa**:
- `services/Payment/Payment.Domain/Entities/PaymentTransaction.cs`
- `services/Staff/Staff.Domain/Entities/StaffMember.cs`

**Cách sửa**: Đổi `{ get; set; }` → `{ get; private set; }` + thêm factory method/constructor.

---

### 16. ✅ Thêm RabbitMQ retry cho Notification + Report

**Vấn đề**: Notification Worker và Report Consumer connect RabbitMQ trong constructor — nếu RabbitMQ chưa sẵn sàng → crash, không retry.

**File cần sửa**:
- `services/Notification/Notification.Service/Worker.cs`
- `services/Report/Report.Infrastructure/Consumers/ReportEventConsumer.cs`

**Cách sửa**: Dùng Polly retry hoặc loop retry trong `ExecuteAsync` thay vì `InitializeRabbitMQ()` trong constructor.

---

### 17. ✅ Dọn dẹp Notification.Application

**File**: `services/Notification/Notification.Application/Class1.cs` — Xóa placeholder hoặc implement logic.

---

## 📊 THỨ TỰ THỰC HIỆN KHUYẾN NGHỊ

```
P0 (Bắt buộc — Hệ thống không chạy nếu thiếu):
  #1 JWT Config       → 30 phút
  #2 RabbitMQ Sync    → 20 phút
  #3 Event Schema     → 45 phút
  #4 init.sql DB name → 5 phút

P1 (Quan trọng — Bảo mật + Kết nối):
  #5  Gateway Routes  → 30 phút
  #6  Tour JWT        → 30 phút
  #7  Booking JWT     → 30 phút
  #8  Payment full    → 45 phút
  #9  Staff CORS      → 10 phút
  #10 Report CORS     → 10 phút
  #11 Frontend URLs   → 5 phút

P2 (Cải thiện — Code quality):
  #12 Tour BaseUrl    → 5 phút
  #13 ApiResponse     → 60 phút
  #14 Middleware      → 45 phút
  #15 DDD Entity      → 30 phút
  #16 RabbitMQ retry  → 45 phút
  #17 Cleanup         → 5 phút

Tổng ước tính: ~7.5 giờ
```
