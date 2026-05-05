# TourService Overview

## 1. Muc tieu cua TourService

`TourService` la microservice phu trach:

- Quan ly `Tour`
- Quan ly `Itinerary`
- Cung cap API kiem tra `AvailableSlots` cho `BookingService`
- Seed du lieu mau khi khoi tao database

Cong nghe dang dung:

- ASP.NET Core Web API (.NET 9)
- Clean Architecture
- PostgreSQL
- Entity Framework Core
- FluentValidation
- Swagger / OpenAPI
- Docker

---

## 2. Cau truc project

Thu muc hien tai:

- `Tour.API`
- `Tour.Application`
- `Tour.Domain`
- `Tour.Infrastructure`
- `Tour.Tests`

Moi project co vai tro rieng, tuan theo huong phu thuoc:

- `Tour.API` phu thuoc `Application` va `Infrastructure`
- `Tour.Application` phu thuoc `Domain`
- `Tour.Infrastructure` phu thuoc `Domain`
- `Tour.Domain` khong phu thuoc layer nao khac
- `Tour.Tests` dang test logic validator cua `Application`

---

## 3. Chuc nang tung project

### 3.1 `Tour.Domain`

Day la lop nghiep vu co ban nhat, chua:

- Entity nghiep vu
- Interface repository

File chinh:

- [Tour.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.Domain/Entities/Tour.cs)
- [Itinerary.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.Domain/Entities/Itinerary.cs)
- [ITourRepository.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.Domain/Interfaces/ITourRepository.cs)

Nhiem vu chinh:

- Dinh nghia `Tour`
- Dinh nghia `Itinerary`
- Khai bao contract truy cap du lieu cho tour va lich trinh

`Domain` khong chua EF Core, Controller hay logic HTTP.

### 3.2 `Tour.Application`

Day la lop xu ly use case.

File chinh:

- [TourService.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.Application/Services/TourService.cs)
- [ITourService.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.Application/Interfaces/ITourService.cs)
- thu muc `DTOs`
- thu muc `Validators`
- thu muc `Common/Exceptions`

Nhiem vu chinh:

- Xu ly CRUD `Tour`
- Xu ly CRUD `Itinerary`
- Kiem tra trung `DayNumber` trong cung mot tour
- Kiem tra so slot con trong cho `BookingService`
- Validation request bang FluentValidation
- Nem exception nghiep vu nhu:
  - `BadRequestException`
  - `NotFoundException`

`Application` khong truy cap truc tiep database. Layer nay chi goi qua `ITourRepository`.

### 3.3 `Tour.Infrastructure`

Day la lop ha tang, implement repository va ket noi cong nghe thuc te.

File chinh:

- [TourDbContext.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.Infrastructure/Persistence/TourDbContext.cs)
- [TourRepository.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.Infrastructure/Repositories/TourRepository.cs)
- [DesignTimeDbContextFactory.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.Infrastructure/Persistence/DesignTimeDbContextFactory.cs)
- [DbInitializer.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.Infrastructure/Persistence/DbInitializer.cs)
- thu muc `Persistence/Configurations`
- thu muc `Persistence/Migrations`

Nhiem vu chinh:

- Ket noi PostgreSQL qua EF Core
- Mapping bang `tours` va `itineraries`
- Luu, doc, cap nhat, xoa `Tour`
- Luu, doc, cap nhat, xoa `Itinerary`
- Chua migration EF Core
- Tu dong migrate va seed du lieu mau khi app khoi dong

### 3.4 `Tour.API`

Day la layer giao tiep HTTP.

File chinh:

- [Program.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.API/Program.cs)
- [ToursController.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.API/Controllers/ToursController.cs)
- [ExceptionHandlingMiddleware.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.API/Middleware/ExceptionHandlingMiddleware.cs)
- [ApiResponse.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.API/Models/ApiResponse.cs)
- [appsettings.json](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.API/appsettings.json)
- [Dockerfile](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.API/Dockerfile)

Nhiem vu chinh:

- Khoi tao DI container
- Cau hinh controller va Swagger
- Dinh nghia REST API cho tour va itinerary
- Chuan hoa response JSON
- Bat va chuan hoa loi qua middleware
- Chay migrate + seed luc startup

### 3.5 `Tour.Tests`

Day la project test.

File chinh:

- [UnitTest1.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.Tests/UnitTest1.cs)

Nhiem vu chinh:

- Test validation request trong `Application`
- Hien tai dang co test cho truong hop trung `DayNumber` trong itinerary

---

## 4. Entity chinh

### 4.1 `Tour`

Thuoc tinh:

- `Id`
- `Name`
- `Description`
- `Price`
- `AvailableSlots`
- `CreatedAtUtc`
- `UpdatedAtUtc`
- `Itineraries`

### 4.2 `Itinerary`

Thuoc tinh:

- `Id`
- `TourId`
- `DayNumber`
- `Description`

---

## 5. API chinh

`ToursController` hien cung cap cac endpoint:

- `GET /api/tours`
- `GET /api/tours/{id}`
- `POST /api/tours`
- `PUT /api/tours/{id}`
- `DELETE /api/tours/{id}`
- `GET /api/tours/{id}/itineraries`
- `POST /api/tours/{id}/itineraries`
- `PUT /api/tours/{tourId}/itineraries/{itineraryId}`
- `DELETE /api/tours/{tourId}/itineraries/{itineraryId}`
- `GET /api/tours/{id}/slots/availability?requestedSlots=2`

Endpoint cuoi cung duoc dung de `BookingService` goi sang kiem tra slot con trong.

---

## 6. Luong hoat dong tong quan

### 6.1 Tao tour

Luot di:

1. Client goi `POST /api/tours`
2. `ToursController` nhan request
3. Controller goi `ITourService.CreateAsync(...)`
4. `CreateTourRequestValidator` kiem tra du lieu dau vao
5. `TourService` tao `Tour`
6. `TourService` tao danh sach `Itinerary` neu request co du lieu lich trinh
7. `ITourRepository` luu xuong PostgreSQL
8. API tra ve tour vua tao

### 6.2 Cap nhat tour

Luot di:

1. Client goi `PUT /api/tours/{id}`
2. `TourService` tim tour theo `Id`
3. Neu khong ton tai thi nem `NotFoundException`
4. Validator kiem tra request
5. Service cap nhat thong tin tour
6. Repository luu thay doi vao DB

### 6.3 Them itinerary

Luot di:

1. Client goi `POST /api/tours/{id}/itineraries`
2. Service tim `Tour`
3. Validator kiem tra `DayNumber` va `Description`
4. Service kiem tra `DayNumber` da ton tai trong tour chua
5. Neu bi trung thi nem `BadRequestException`
6. Tao `Itinerary` moi
7. Repository luu DB

### 6.4 Kiem tra slot

Luot di:

1. Service khac goi `GET /api/tours/{id}/slots/availability?requestedSlots=n`
2. `TourService` tim tour theo `Id`
3. Kiem tra `requestedSlots > 0`
4. So sanh `AvailableSlots` voi `requestedSlots`
5. Tra ve:
   - `TourId`
   - `RequestedSlots`
   - `AvailableSlots`
   - `IsAvailable`

---

## 7. Database

`TourService` su dung PostgreSQL voi 2 bang chinh:

- `tours`
- `itineraries`

Rang buoc quan trong:

- `itineraries` co khoa ngoai toi `tours`
- `TourId + DayNumber` la unique de tranh trung ngay trong cung mot tour
- Xoa `Tour` se cascade xoa `Itinerary`

Migration hien co:

- [20260425000100_InitialCreate.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.Infrastructure/Persistence/Migrations/20260425000100_InitialCreate.cs)

---

## 8. Seed data

Khi khoi dong app, `DbInitializer` se:

- Chay `Database.MigrateAsync()`
- Kiem tra database da co du lieu chua
- Neu chua thi seed 2 tour mau:
  - `Ha Long Bay Escape`
  - `Da Nang And Hoi An Highlights`

File chinh:

- [DbInitializer.cs](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.Infrastructure/Persistence/DbInitializer.cs)

---

## 9. Validation

FluentValidation dang duoc dung cho:

- `CreateTourRequest`
- `UpdateTourRequest`
- `CreateItineraryRequest`
- `UpdateItineraryRequest`

Rule chinh:

- `Name` bat buoc, toi da 200 ky tu
- `Description` bat buoc
- `Price >= 0`
- `AvailableSlots >= 0`
- `DayNumber > 0`
- `Description` cua itinerary toi da 1000 ky tu
- Danh sach itinerary khi tao tour khong duoc trung `DayNumber`

---

## 10. Van hanh

Build da duoc xac minh:

- `dotnet build services\Tour\Tour.API\Tour.API.csproj --no-restore`

Test da duoc xac minh:

- `dotnet test services\Tour\Tour.Tests\Tour.Tests.csproj --no-restore`

Dockerfile:

- [Dockerfile](D:/KienTrucPhanMem/TieuLuan/services/Tour/Tour.API/Dockerfile)

---

## 11. Tom tat ngan

`TourService` hien da san sang cho cac nhu cau co ban cua he thong dat tour:

- Quan ly danh sach tour
- Quan ly lich trinh theo tung tour
- Luu tru PostgreSQL qua EF Core
- Validation request ro rang
- Ho tro service khac kiem tra slot
- Co seed data, migration va Dockerfile de trien khai
