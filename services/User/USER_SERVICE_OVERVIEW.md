# UserService Overview

## 1. Muc tieu cua UserService

`UserService` la microservice phu trach:

- Dang ky tai khoan
- Dang nhap
- Sinh `JWT access token`
- Sinh va luu `refresh token`
- Phan quyen theo `role`
- Quan ly thong tin nguoi dung

Cong nghe dang dung:

- ASP.NET Core Web API (.NET 8)
- Clean Architecture
- PostgreSQL
- Entity Framework Core
- BCrypt
- JWT Bearer Authentication

---

## 2. Cau truc project

Thu muc hien tai:

- `User.API`
- `User.Application`
- `User.Domain`
- `User.Infrastructure`
- `User.Tests`

Moi project co vai tro rieng, tuan theo huong phu thuoc:

- `User.API` phu thuoc `Application` va `Infrastructure`
- `User.Application` phu thuoc `Domain`
- `User.Infrastructure` phu thuoc `Domain` va `Application`
- `User.Domain` khong phu thuoc layer nao khac
- `User.Tests` dang test logic cua `Application`

---

## 3. Chuc nang tung project

### 3.1 `User.Domain`

Day la lop nghiep vu co ban nhat, chua:

- Entity nghiep vu
- Interface truu tuong
- Hang so role
- Model token

File chinh:

- [User.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Domain/Entities/User.cs)
- [RefreshToken.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Domain/Entities/RefreshToken.cs)
- [SystemRoles.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Domain/Constants/SystemRoles.cs)
- [IUserRepository.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Domain/Interfaces/IUserRepository.cs)
- [IPasswordHasher.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Domain/Interfaces/IPasswordHasher.cs)
- [ITokenProvider.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Domain/Interfaces/ITokenProvider.cs)

Nhiem vu chinh:

- Dinh nghia `User`
- Dinh nghia `RefreshToken`
- Quan ly cac role he thong: `Admin`, `Staff`, `Customer`
- Khai bao contract de cac layer khac implement

`Domain` khong chua EF Core, Controller hay logic HTTP.

### 3.2 `User.Application`

Day la lop xu ly use case.

File chinh:

- [AuthService.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Application/Services/AuthService.cs)
- [IAuthService.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Application/Interfaces/IAuthService.cs)
- thu muc `DTOs/Auth`
- thu muc `Common/Exceptions`

Nhiem vu chinh:

- Xu ly `register`
- Xu ly `login`
- Xu ly `refresh token`
- Xu ly `revoke refresh token`
- Lay thong tin user hien tai
- Lay danh sach user
- Kiem tra role hop le
- Nem exception nghiep vu nhu:
  - `ConflictException`
  - `UnauthorizedException`
  - `NotFoundException`
  - `BadRequestException`

`Application` khong truy cap truc tiep database. Layer nay chi goi qua interface nhu `IUserRepository`, `IPasswordHasher`, `ITokenProvider`.

### 3.3 `User.Infrastructure`

Day la lop ha tang, implement cac interface trong `Domain` va ket noi cong nghe thuc te.

File chinh:

- [UserDbContext.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Infrastructure/Persistence/UserDbContext.cs)
- [UserRepository.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Infrastructure/Repositories/UserRepository.cs)
- [BcryptPasswordHasher.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Infrastructure/Security/BcryptPasswordHasher.cs)
- [JwtTokenProvider.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Infrastructure/Security/JwtTokenProvider.cs)
- [DesignTimeDbContextFactory.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Infrastructure/Persistence/DesignTimeDbContextFactory.cs)
- thu muc `Persistence/Migrations`

Nhiem vu chinh:

- Ket noi PostgreSQL qua EF Core
- Mapping bang `users` va `refresh_tokens`
- Luu doc cap nhat user
- Bam mat khau bang BCrypt
- Tao JWT access token
- Tao refresh token
- Chua migration EF Core

### 3.4 `User.API`

Day la layer giao tiep HTTP.

File chinh:

- [Program.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.API/Program.cs)
- [AuthController.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.API/Controllers/AuthController.cs)
- [UsersController.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.API/Controllers/UsersController.cs)
- [ExceptionHandlingMiddleware.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.API/Middleware/ExceptionHandlingMiddleware.cs)
- [appsettings.json](D:/KienTrucPhanMem/TieuLuan/services/User/User.API/appsettings.json)
- [appsettings.Development.json](D:/KienTrucPhanMem/TieuLuan/services/User/User.API/appsettings.Development.json)

Nhiem vu chinh:

- Khoi tao DI container
- Cau hinh JWT Authentication
- Cau hinh Authorization
- Mo Swagger
- Dinh nghia API endpoint
- Tra ve response JSON
- Bat va chuan hoa loi qua middleware

### 3.5 `User.Tests`

Day la project test.

File chinh:

- [AuthServiceTests.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Tests/AuthServiceTests.cs)

Nhiem vu chinh:

- Test logic nghiep vu trong `AuthService`
- Test hanh vi dang ky
- Test hanh vi dang nhap
- Dung fake repository, fake token provider, fake password hasher

Hien tai test dang tap trung vao `Application`, chua co integration test voi PostgreSQL that.

---

## 4. Luong hoat dong tong quan

### 4.1 Dang ky

Luot di:

1. Client goi `POST /api/auth/register`
2. `AuthController` nhan request
3. Controller goi `IAuthService.RegisterAsync(...)`
4. `AuthService` kiem tra email da ton tai chua
5. `AuthService` bam mat khau bang `IPasswordHasher`
6. `AuthService` tao `User`
7. `AuthService` tao `access token` va `refresh token`
8. `AuthService` them `RefreshToken` vao `User`
9. `IUserRepository` luu xuong PostgreSQL
10. API tra ve token va thong tin user

### 4.2 Dang nhap

Luot di:

1. Client goi `POST /api/auth/login`
2. `AuthService` tim user theo email
3. `AuthService` verify password bang BCrypt
4. Neu hop le thi sinh access token moi
5. Sinh refresh token moi va luu DB
6. Tra ve token cho client

### 4.3 Refresh token

Luot di:

1. Client goi `POST /api/auth/refresh`
2. `AuthService` tim user theo refresh token
3. Kiem tra refresh token con han va chua bi revoke
4. Revoke token cu
5. Tao cap token moi
6. Luu refresh token moi vao DB
7. Tra ve token moi

### 4.4 Lay thong tin user hien tai

Luot di:

1. Client goi `GET /api/auth/me`
2. Header phai co `Authorization: Bearer <accessToken>`
3. JWT middleware xac thuc token
4. Controller doc `ClaimTypes.NameIdentifier`
5. `AuthService` lay user theo `Id`
6. API tra ve thong tin user hien tai

### 4.5 Lay danh sach user

Luot di:

1. Client goi `GET /api/users`
2. JWT middleware kiem tra token
3. Authorization kiem tra role phai la `Admin`
4. `AuthService` lay danh sach user
5. API tra ve danh sach

---

## 5. Du lieu duoc luu o dau

PostgreSQL dang luu:

- bang `users`
- bang `refresh_tokens`

Mapping duoc cau hinh tai:

- [UserConfiguration.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Infrastructure/Persistence/Configurations/UserConfiguration.cs)
- [RefreshTokenConfiguration.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Infrastructure/Persistence/Configurations/RefreshTokenConfiguration.cs)

Migration hien tai:

- [20260421085601_InitialCreate.cs](D:/KienTrucPhanMem/TieuLuan/services/User/User.Infrastructure/Persistence/Migrations/20260421085601_InitialCreate.cs)

---

## 6. Cac endpoint hien co

Base URL local:

- `http://localhost:5080`

Swagger:

- `http://localhost:5080/swagger`

### 6.1 Register

`POST /api/auth/register`

Body:

```json
{
  "email": "admin@example.com",
  "password": "Admin@123",
  "role": "Admin"
}
```

Tac dung:

- Tao user moi
- Bam password
- Tao access token + refresh token
- Luu user va refresh token vao DB

### 6.2 Login

`POST /api/auth/login`

Body:

```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

Tac dung:

- Dang nhap
- Tao access token + refresh token moi

### 6.3 Refresh token

`POST /api/auth/refresh`

Body:

```json
{
  "refreshToken": "your-refresh-token"
}
```

Tac dung:

- Huy refresh token cu
- Cap access token va refresh token moi

### 6.4 Revoke refresh token

`POST /api/auth/revoke`

Header:

```text
Authorization: Bearer <accessToken>
```

Body:

```json
{
  "refreshToken": "your-refresh-token"
}
```

Tac dung:

- Thu hoi refresh token

### 6.5 Thong tin user hien tai

`GET /api/auth/me`

Header:

```text
Authorization: Bearer <accessToken>
```

Tac dung:

- Lay thong tin user tu token dang dang nhap

### 6.6 Danh sach user

`GET /api/users`

Header:

```text
Authorization: Bearer <accessToken>
```

Dieu kien:

- Access token phai thuoc user co role `Admin`

---

## 7. Cach goi API de test nhanh

### 7.1 Chay PostgreSQL bang Docker

Tai root solution:

```powershell
docker compose up -d
```

### 7.2 Apply migration

Neu can truyen connection string truc tiep:

```powershell
dotnet ef database update --no-build --connection "Host=localhost;Port=5432;Database=UserServiceDb;Username=postgres;Password=123456" --project services\User\User.Infrastructure\User.Infrastructure.csproj --startup-project services\User\User.API\User.API.csproj
```

### 7.3 Chay API

```powershell
dotnet run --project services\User\User.API\User.API.csproj
```

### 7.4 Test bang file HTTP

File test nhanh:

- [User.API.http](D:/KienTrucPhanMem/TieuLuan/services/User/User.API/User.API.http)

Thu tu test nen dung:

1. `register`
2. `login`
3. copy `accessToken`
4. goi `me`
5. goi `users` neu user la `Admin`
6. goi `refresh`
7. goi `revoke`

### 7.5 Test bang Swagger

1. Mo `http://localhost:5080/swagger`
2. Goi `register`
3. Goi `login`
4. Copy `accessToken`
5. Bam `Authorize`
6. Nhap `Bearer <accessToken>`
7. Goi `me`, `users`, `revoke`

---

## 8. Kiem tra du lieu trong database

### 8.1 Kiem tra bang

```powershell
docker exec -it userservice_postgres psql -U postgres -d UserServiceDb -c "\dt"
```

### 8.2 Xem user da luu chua

```powershell
docker exec -it userservice_postgres psql -U postgres -d UserServiceDb -c "select \"Id\", \"Email\", \"Role\", \"CreatedAt\" from users;"
```

### 8.3 Xem refresh token

```powershell
docker exec -it userservice_postgres psql -U postgres -d UserServiceDb -c "select \"Id\", \"UserId\", \"Token\", \"ExpiresAt\", \"RevokedAt\" from refresh_tokens;"
```

---

## 9. Tom tat nhanh

- `User.Domain`: mo ta nghiep vu va contract
- `User.Application`: xu ly use case auth
- `User.Infrastructure`: ket noi DB, BCrypt, JWT, repository
- `User.API`: mo endpoint HTTP, auth, swagger, middleware
- `User.Tests`: test logic nghiep vu

Luong chinh:

- Client goi API
- Controller nhan request
- `Application` xu ly logic
- `Infrastructure` luu doc database va tao token
- `Domain` giu model nghiep vu
- API tra response JSON cho client
