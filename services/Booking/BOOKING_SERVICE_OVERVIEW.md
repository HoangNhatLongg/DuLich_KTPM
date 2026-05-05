# BookingService Overview

## 1. Muc tieu cua BookingService

`BookingService` la microservice phu trach:

- Dat tour
- Kiem tra so cho con trong bang cach goi `TourService`
- Quan ly trang thai booking
- Phat event `BookingCreated`
- Nhan event `PaymentCompleted` de cap nhat booking

Cong nghe dang dung:

- ASP.NET Core Web API (.NET 9)
- Clean Architecture
- PostgreSQL
- Entity Framework Core
- REST API client
- RabbitMQ
- FluentValidation
- Polly retry
- Swagger / OpenAPI
- Docker

---

## 2. Cau truc project

Thu muc hien tai:

- `Booking.API`
- `Booking.Application`
- `Booking.Domain`
- `Booking.Infrastructure`
- `Booking.Tests`

Moi project co vai tro rieng, tuan theo huong phu thuoc:

- `Booking.API` phu thuoc `Application` va `Infrastructure`
- `Booking.Application` phu thuoc `Domain`
- `Booking.Infrastructure` phu thuoc `Application` va `Domain`
- `Booking.Domain` khong phu thuoc layer nao khac
- `Booking.Tests` dang test logic validator cua `Application`

---

## 3. Chuc nang tung project

### 3.1 `Booking.Domain`

Day la lop nghiep vu co ban nhat, chua:

- Entity nghiep vu
- Enum trang thai
- Interface repository

File chinh:

- [Booking.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Domain/Entities/Booking.cs)
- [BookingStatus.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Domain/Enums/BookingStatus.cs)
- [IBookingRepository.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Domain/Interfaces/IBookingRepository.cs)

Nhiem vu chinh:

- Dinh nghia `Booking`
- Dinh nghia 3 trang thai:
  - `Pending`
  - `Paid`
  - `Cancelled`
- Khai bao contract truy cap du lieu booking

`Domain` khong chua EF Core, Controller hay logic HTTP.

### 3.2 `Booking.Application`

Day la lop xu ly use case.

File chinh:

- [BookingService.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Application/Services/BookingService.cs)
- [IBookingService.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Application/Interfaces/IBookingService.cs)
- [IBookingEventPublisher.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Application/Interfaces/IBookingEventPublisher.cs)
- [ITourAvailabilityClient.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Application/Interfaces/ITourAvailabilityClient.cs)
- thu muc `DTOs`
- thu muc `Events`
- thu muc `Validators`
- thu muc `Common/Exceptions`

Nhiem vu chinh:

- Tao booking moi
- Goi `TourService` de kiem tra slot con trong
- Quan ly trang thai booking
- Publish event `BookingCreated`
- Xu ly event `PaymentCompleted`
- Validation request bang FluentValidation
- Nem exception nghiep vu nhu:
  - `BadRequestException`
  - `NotFoundException`
  - `DependencyUnavailableException`

`Application` khong truy cap truc tiep database hay RabbitMQ. Layer nay chi goi qua interface.

### 3.3 `Booking.Infrastructure`

Day la lop ha tang, implement repository, HTTP client va RabbitMQ integration.

File chinh:

- [BookingDbContext.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/Persistence/BookingDbContext.cs)
- [BookingRepository.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/Repositories/BookingRepository.cs)
- [TourAvailabilityClient.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/Http/TourAvailabilityClient.cs)
- [RabbitMqBookingEventPublisher.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/Messaging/RabbitMqBookingEventPublisher.cs)
- [PaymentCompletedConsumerService.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/Messaging/PaymentCompletedConsumerService.cs)
- [DesignTimeDbContextFactory.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/Persistence/DesignTimeDbContextFactory.cs)
- thu muc `Persistence/Migrations`
- thu muc `Options`

Nhiem vu chinh:

- Ket noi PostgreSQL qua EF Core
- Mapping bang `bookings`
- Goi REST API toi `TourService`
- Publish event vao RabbitMQ
- Consume event tu RabbitMQ
- Cau hinh retry cho HTTP va messaging
- Chua migration EF Core

### 3.4 `Booking.API`

Day la layer giao tiep HTTP.

File chinh:

- [Program.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.API/Program.cs)
- [BookingsController.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.API/Controllers/BookingsController.cs)
- [ExceptionHandlingMiddleware.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.API/Middleware/ExceptionHandlingMiddleware.cs)
- [ApiResponse.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.API/Models/ApiResponse.cs)
- [appsettings.json](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.API/appsettings.json)
- [Dockerfile](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.API/Dockerfile)

Nhiem vu chinh:

- Khoi tao DI container
- Cau hinh controller va Swagger
- Dinh nghia REST API cho booking
- Dang ky hosted consumer cho RabbitMQ
- Chuan hoa response JSON
- Bat va chuan hoa loi qua middleware
- Chay migrate luc startup

### 3.5 `Booking.Tests`

Day la project test.

File chinh:

- [UnitTest1.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Tests/UnitTest1.cs)

Nhiem vu chinh:

- Test validation request trong `Application`
- Hien tai dang co test cho truong hop `UserId` rong khi tao booking

---

## 4. Entity chinh

### 4.1 `Booking`

Thuoc tinh:

- `Id`
- `UserId`
- `TourId`
- `Status`
- `CreatedAtUtc`

### 4.2 `BookingStatus`

Gia tri hop le:

- `Pending`
- `Paid`
- `Cancelled`

---

## 5. API chinh

`BookingsController` hien cung cap cac endpoint:

- `GET /api/bookings`
- `GET /api/bookings/{id}`
- `POST /api/bookings`
- `PATCH /api/bookings/{id}/status`

Trong do:

- `POST /api/bookings` se goi sang `TourService` de kiem tra slot
- `PATCH /api/bookings/{id}/status` cho phep cap nhat trang thai booking thu cong

---

## 6. Luong hoat dong tong quan

### 6.1 Tao booking

Luot di:

1. Client goi `POST /api/bookings`
2. `BookingsController` nhan request
3. Controller goi `IBookingService.CreateAsync(...)`
4. `CreateBookingRequestValidator` kiem tra du lieu dau vao
5. `BookingService` goi `ITourAvailabilityClient`
6. `TourAvailabilityClient` goi `GET /api/tours/{id}/slots/availability?requestedSlots=1`
7. Neu tour khong con cho thi nem `BadRequestException`
8. Neu `TourService` loi hoac khong reachable thi nem `DependencyUnavailableException`
9. `BookingService` tao `Booking` voi trang thai `Pending`
10. `IBookingRepository` luu xuong PostgreSQL
11. `IBookingEventPublisher` publish event `BookingCreated`
12. API tra ve booking vua tao

### 6.2 Cap nhat trang thai booking

Luot di:

1. Client goi `PATCH /api/bookings/{id}/status`
2. `BookingService` tim booking theo `Id`
3. Validator kiem tra `Status`
4. Neu khong ton tai thi nem `NotFoundException`
5. Service parse trang thai moi
6. Repository luu thay doi vao DB

### 6.3 Xu ly `PaymentCompleted`

Luot di:

1. `PaymentCompletedConsumerService` lang nghe queue RabbitMQ
2. Khi nhan event `PaymentCompleted`
3. Consumer deserialize payload JSON
4. Consumer goi `IBookingService.HandlePaymentCompletedAsync(...)`
5. `BookingService` tim booking theo `BookingId`
6. Cap nhat trang thai thanh `Paid`
7. Luu thay doi vao PostgreSQL
8. Consumer `ack` message neu xu ly thanh cong

### 6.4 Publish `BookingCreated`

Luot di:

1. Booking tao thanh cong trong DB
2. `RabbitMqBookingEventPublisher` serialize event
3. Event duoc publish vao exchange `travel.events`
4. Routing key mac dinh la `booking.created`
5. Co retry logic neu publish that bai tam thoi

---

## 7. Tich hop voi TourService

`BookingService` khong tu quan ly slot.

No goi sang `TourService` thong qua:

- [TourAvailabilityClient.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/Http/TourAvailabilityClient.cs)

Endpoint duoc goi:

- `GET /api/tours/{id}/slots/availability?requestedSlots=1`

Muc dich:

- Kiem tra tour co ton tai khong
- Kiem tra so cho con trong truoc khi tao booking

Base URL cua `TourService` duoc cau hinh trong:

- [appsettings.json](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.API/appsettings.json)

---

## 8. RabbitMQ integration

`BookingService` co 2 huong RabbitMQ:

### 8.1 Publish

Event duoc publish:

- `BookingCreated`

Publisher:

- [RabbitMqBookingEventPublisher.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/Messaging/RabbitMqBookingEventPublisher.cs)

### 8.2 Consume

Event duoc consume:

- `PaymentCompleted`

Consumer:

- [PaymentCompletedConsumerService.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/Messaging/PaymentCompletedConsumerService.cs)

Config RabbitMQ hien co:

- `ExchangeName`
- `BookingCreatedRoutingKey`
- `PaymentCompletedRoutingKey`
- `PaymentCompletedQueue`

Noi cau hinh:

- [RabbitMqOptions.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/Options/RabbitMqOptions.cs)
- [appsettings.json](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.API/appsettings.json)

---

## 9. Retry logic

`BookingService` hien co retry o 2 diem:

- HTTP call sang `TourService` dung `Polly`
- RabbitMQ publish / consume dung retry theo exponential backoff

Muc dich:

- Giam loi do network tam thoi
- Giam loi khi service phu thuoc chua san sang ngay

File chinh:

- [DependencyInjection.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/DependencyInjection.cs)
- [RabbitMqBookingEventPublisher.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/Messaging/RabbitMqBookingEventPublisher.cs)
- [PaymentCompletedConsumerService.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/Messaging/PaymentCompletedConsumerService.cs)

---

## 10. Database

`BookingService` su dung PostgreSQL voi bang chinh:

- `bookings`

Rang buoc va index hien co:

- khoa chinh `Id`
- index theo `UserId`
- index theo `TourId`
- index theo `Status`

Migration hien co:

- [20260425010100_InitialCreate.cs](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.Infrastructure/Persistence/Migrations/20260425010100_InitialCreate.cs)

---

## 11. Validation

FluentValidation dang duoc dung cho:

- `CreateBookingRequest`
- `UpdateBookingStatusRequest`

Rule chinh:

- `UserId` bat buoc
- `TourId` bat buoc
- `Status` phai nam trong:
  - `Pending`
  - `Paid`
  - `Cancelled`

---

## 12. Van hanh

Build da duoc xac minh:

- `dotnet build services\Booking\Booking.API\Booking.API.csproj --no-restore`

Test da duoc xac minh:

- `dotnet test services\Booking\Booking.Tests\Booking.Tests.csproj --no-restore`

Dockerfile:

- [Dockerfile](D:/KienTrucPhanMem/TieuLuan/services/Booking/Booking.API/Dockerfile)

Luu y:

- Build hien van con 1 warning `MSB3277` lien quan version `Microsoft.EntityFrameworkCore.Relational`
- Warning nay khong chan compile va test

---

## 13. Tom tat ngan

`BookingService` hien da san sang cho luong dat tour co event-driven integration:

- Tao booking
- Kiem tra slot qua `TourService`
- Quan ly trang thai booking
- Publish `BookingCreated`
- Consume `PaymentCompleted`
- Tich hop RabbitMQ
- Co retry logic, PostgreSQL, migration va Dockerfile
