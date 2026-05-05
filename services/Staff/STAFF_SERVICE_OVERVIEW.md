# StaffService Overview

## 1. Mục tiêu của StaffService

`StaffService` là microservice phụ trách:

- Quản lý thông tin nhân viên trong công ty du lịch
- Thêm, sửa, xoá và truy vấn nhân viên
- Tìm kiếm nhân viên theo tên hoặc email
- Lọc nhân viên theo trạng thái (Active / Inactive)
- Phân quyền: chỉ Admin mới được thao tác

Công nghệ đang dùng:

- ASP.NET Core Web API (.NET 8)
- Clean Architecture
- PostgreSQL
- Entity Framework Core
- FluentValidation
- JWT Bearer Authentication (Role-based: Admin)

---

## 2. Cấu trúc project

Thư mục hiện tại:

- `Staff.API`
- `Staff.Application`
- `Staff.Domain`
- `Staff.Infrastructure`
- `Staff.Tests`

Mỗi project có vai trò riêng, tuân theo hướng phụ thuộc của Clean Architecture:

- `Staff.API` phụ thuộc `Application` và `Infrastructure`
- `Staff.Application` phụ thuộc `Domain`
- `Staff.Infrastructure` phụ thuộc `Domain` và `Application`
- `Staff.Domain` không phụ thuộc layer nào khác

---

## 3. Chức năng từng project

### 3.1 `Staff.Domain`

Đây là lớp nghiệp vụ cơ bản nhất, chứa:

- Entity nghiệp vụ
- Enum trạng thái nhân viên
- Enum vị trí nhân viên

File chính:

- `Entities/StaffMember.cs`: Entity chứa toàn bộ thông tin nhân viên
- `Enums/StaffPosition.cs`: Enum vị trí (Manager, Sales, Support)
- `Enums/StaffStatus.cs`: Enum trạng thái (Active, Inactive)

Nhiệm vụ chính:

- Định nghĩa `StaffMember` với các thuộc tính: `Id`, `FullName`, `Email`, `Phone`, `Position`, `Status`, `CreatedAt`
- `Domain` không chứa EF Core, Controller hay logic HTTP

### 3.2 `Staff.Application`

Đây là lớp xử lý use case.

File chính:

- `Services/StaffManager.cs`: Implementation của `IStaffService`
- `Interfaces/IStaffService.cs`: Khai báo contract nghiệp vụ
- `Interfaces/IStaffRepository.cs`: Khai báo contract truy cập dữ liệu
- Thư mục `DTOs/`: `StaffDto`, `CreateStaffDto`, `UpdateStaffDto`
- Thư mục `Validators/`: `CreateStaffDtoValidator`, `UpdateStaffDtoValidator`

Nhiệm vụ chính:

- Xử lý toàn bộ logic tạo mới, cập nhật, xoá, tìm kiếm nhân viên
- Tìm kiếm theo `keyword` (tên hoặc email), lọc theo `StaffStatus`
- Validate dữ liệu đầu vào bằng FluentValidation trước khi xử lý
- Ném exception nghiệp vụ nếu không tìm thấy dữ liệu
- `Application` không truy cập trực tiếp database, chỉ gọi qua `IStaffRepository`

### 3.3 `Staff.Infrastructure`

Đây là lớp hạ tầng, implement các interface trong `Application` và kết nối công nghệ thực tế.

File chính:

- `Data/StaffDbContext.cs`: DbContext của EF Core
- `Repositories/StaffRepository.cs`: Implementation query CSDL với hỗ trợ filter và search

Nhiệm vụ chính:

- Kết nối PostgreSQL qua EF Core
- Mapping bảng `StaffMembers` với cột `Email` có unique index
- Triển khai truy vấn LINQ có hỗ trợ tìm kiếm bằng `ToLower()` và lọc `Status`
- Lưu, đọc, cập nhật, xoá `StaffMember` bất đồng bộ (async/await)
- Chứa Migration EF Core

### 3.4 `Staff.API`

Đây là layer giao tiếp HTTP.

File chính:

- `Program.cs`: Khởi tạo DI, JWT Auth, FluentValidation, Swagger có JWT Lock
- `Controllers/StaffController.cs`: Controller duy nhất expose CRUD API
- `appsettings.json`: Cấu hình PostgreSQL connection và JwtSettings
- `Dockerfile`: Script container hóa .NET 8

Nhiệm vụ chính:

- Khởi tạo DI container (DbContext, Repository, Service, Validator)
- Cấu hình JWT Authentication với Issuer/Audience/SecretKey
- Mở Swagger UI có hỗ trợ nhập Bearer Token để test
- Tự động chạy `db.Database.Migrate()` khi ứng dụng khởi động
- Gán `[Authorize(Roles = "Admin")]` trên toàn bộ controller

---

## 4. Luồng hoạt động tổng quan

### 4.1 Lấy danh sách nhân viên (GET + Filter)

Lượt đi:

1. Client gọi `GET /api/staff?searchKeyword=nguyen&status=1`
2. JWT Middleware xác thực token và kiểm tra Role = Admin
3. `StaffController` nhận query params và gọi `IStaffService.GetAllStaffAsync(...)`
4. `StaffManager` gọi `IStaffRepository.GetAllAsync(keyword, status)`
5. `StaffRepository` tạo LINQ query, áp dụng filter theo keyword/status
6. Kết quả trả về dạng `IEnumerable<StaffDto>` qua Controller

### 4.2 Tạo nhân viên mới (POST)

Lượt đi:

1. Client gọi `POST /api/staff` với body JSON
2. FluentValidation tự động chạy `CreateStaffDtoValidator` kiểm tra dữ liệu
3. Nếu validation lỗi → trả về `400 Bad Request` với chi tiết lỗi
4. Nếu hợp lệ → `StaffController` gọi `IStaffService.CreateStaffAsync(dto)`
5. `StaffManager` tạo entity `StaffMember` mới với `CreatedAt = UtcNow`, `Status = Active`
6. `IStaffRepository.AddAsync` lưu xuống PostgreSQL
7. API trả về `201 Created` kèm resource mới

### 4.3 Cập nhật nhân viên (PUT)

Lượt đi:

1. Client gọi `PUT /api/staff/{id}` với body JSON
2. FluentValidation chạy `UpdateStaffDtoValidator`
3. `StaffManager` tìm entity theo Id
4. Nếu không tìm thấy → trả về `false` → Controller trả `404 Not Found`
5. Nếu tìm thấy → cập nhật các trường và gọi `UpdateAsync`
6. API trả về `204 No Content`

### 4.4 Xoá nhân viên (DELETE)

Lượt đi:

1. Client gọi `DELETE /api/staff/{id}`
2. `StaffManager` kiểm tra tồn tại theo Id
3. Nếu không có → `404 Not Found`
4. Nếu có → `DeleteAsync` xoá khỏi DB
5. API trả về `204 No Content`

---

## 5. Dữ liệu được lưu ở đâu

PostgreSQL đang lưu:

- Bảng `StaffMembers`

Cấu hình đặc biệt:

- Cột `FullName`: Required, MaxLength 255
- Cột `Email`: Required, MaxLength 255, **Unique Index**

Migration hiện tại:

- `InitialCreate` - Tạo bảng `StaffMembers` với toàn bộ mapping

---

## 6. Các endpoint hiện có

Base URL local:

- `http://localhost:<port>`

Swagger:

- `http://localhost:<port>/swagger`

> Lưu ý: Tất cả endpoints đều yêu cầu **JWT Token với Role = Admin** trong Header:
> `Authorization: Bearer <accessToken>`

### 6.1 Lấy danh sách nhân viên

`GET /api/staff`

Query Params (tuỳ chọn):

```
?searchKeyword=nguyen&status=1
```

*(status: 1 = Active, 2 = Inactive)*

Tác dụng:

- Lấy toàn bộ danh sách
- Lọc theo keyword (tên hoặc email)
- Lọc theo trạng thái

### 6.2 Lấy chi tiết nhân viên

`GET /api/staff/{id}`

Tác dụng:

- Trả về thông tin chi tiết 1 nhân viên theo Guid

### 6.3 Tạo nhân viên

`POST /api/staff`

Body:

```json
{
  "fullName": "Nguyen Van A",
  "email": "nguyenvana@company.com",
  "phone": "0901234567",
  "position": 1
}
```

*(position: 1 = Manager, 2 = Sales, 3 = Support)*

Tác dụng:

- Tạo mới nhân viên với Status = Active mặc định
- Validate FullName, Email format, Phone bắt buộc

### 6.4 Cập nhật nhân viên

`PUT /api/staff/{id}`

Body:

```json
{
  "fullName": "Nguyen Van B",
  "email": "nguyenvanb@company.com",
  "phone": "0907654321",
  "position": 2,
  "status": 2
}
```

Tác dụng:

- Cập nhật toàn bộ thông tin nhân viên kể cả Status

### 6.5 Xoá nhân viên

`DELETE /api/staff/{id}`

Tác dụng:

- Xoá cứng (hard delete) nhân viên khỏi database

---

## 7. Cách chạy service để test

### 7.1 Apply migration thủ công (nếu cần)

```powershell
dotnet ef database update --project services\Staff\Staff.Infrastructure\Staff.Infrastructure.csproj --startup-project services\Staff\Staff.API\Staff.API.csproj
```

### 7.2 Chạy API

```powershell
dotnet run --project services\Staff\Staff.API\Staff.API.csproj
```

### 7.3 Test bằng Swagger

1. Mở `http://localhost:<port>/swagger`
2. Lấy JWT Token từ `UserService` đã login với tài khoản có Role `Admin`
3. Bấm **Authorize**, nhập `Bearer <accessToken>`
4. Thực hiện các endpoint CRUD

### 7.4 Kiểm tra dữ liệu trong database

```powershell
docker exec -it <postgres_container> psql -U postgres -d StaffDb -c "select \"Id\", \"FullName\", \"Email\", \"Position\", \"Status\" from \"StaffMembers\";"
```

---

## 8. Tóm tắt nhanh

- `Staff.Domain`: Định nghĩa `StaffMember`, `StaffPosition`, `StaffStatus`
- `Staff.Application`: Xử lý use case CRUD, tìm kiếm, lọc; Validation với FluentValidation
- `Staff.Infrastructure`: Kết nối PostgreSQL, Repository pattern với LINQ query
- `Staff.API`: Expose endpoint HTTP, gán `[Authorize(Roles = "Admin")]`, Swagger + JWT

Luồng chính:

- Client gọi API với JWT Token Role Admin
- Controller nhận request (không xử lý logic)
- `Application` xử lý use case và gọi Repository
- `Infrastructure` tương tác với PostgreSQL
- Trả về DTO cho Client
