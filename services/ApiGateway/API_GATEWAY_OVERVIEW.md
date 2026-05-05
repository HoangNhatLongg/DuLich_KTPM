# ApiGateway Overview

## 1. Mục tiêu của ApiGateway

`ApiGateway` đóng vai trò là cửa ngõ (Single Entry Point) duy nhất tiếp nhận toàn bộ các request từ ứng dụng Client (Web, Mobile App) và điều hướng chúng (Reverse Proxy) tới các Microservices nội bộ ở mạng backend (.NET / Docker).

Vai trò chính:

- Quản lý **Routing**: Điều hướng `/api/users` tới UserService, `/api/tours` tới TourService,...
- Xử lý xác thực tập trung **(Authentication)**: Chặn tất cả thay vì để từng microservice tự xử lý phân giải JWT header trừ những Public API.
- Ngăn chặn Spam **(Rate Limiting)**: Giới hạn tần suất gọi API, chống lại tấn công DDOS dạng spam phổ thông.

Công nghệ đang dùng:

- ASP.NET Core Web API (.NET 9)
- YARP (Yet Another Reverse Proxy - thư viện của Microsoft)
- JWT Bearer Authentication
- Fixed Window Rate Limiting

---

## 2. Cấu trúc project

Thư mục hiện tại:

- `d:\KienTrucPhanMem\TieuLuan\services\ApiGateway`

Dự án này là dạng dự án đơn lẻ (Monolithic/Stand-alone Web API) không cần chia Clean Architecture thành các sub-project vì nó hoàn toàn KHÔNG thao tác với Business Logic nào. Nó chỉ làm đúng nghĩa vụ Network Switcher và Security Filter.

File chính cần quan tâm:
- `Program.cs`: Nơi setup Middleware liên quan tới bảo mật và khai báo khởi tạo YARP Engine.
- `appsettings.json`: Nơi khai báo luật Routing (Tuyển đường) và cấu hình địa chỉ Cluster (Cụm máy chủ đích).

---

## 3. Hoạt động của Yarp Reverse Proxy (appsettings.json)

Không cần tạo bất kỳ một `Controller` nào trong API Gateway. Toàn bộ logic diễn ra quanh cấu hình YARP.

File cấu hình này bao gồm 2 phần lõi: `Routes` và `Clusters`.

- **Routes**: Tiếp nhận điều kiện. Ví dụ nếu request là `/api/users/*`, kiểm tra Policy Authentication, kiểm tra Policy Rate Limiter. Nếu thoả mãn, trỏ thẳng tới cụm `userCluster`.
- **Clusters**: Định nghĩa địa chỉ IP nội bộ thật sự cài đặt các service. Ví dụ `userCluster` trỏ tới `http://localhost:5001`. Nếu hệ thống nằm trên Docker, cái này có thể đổi thành `http://userservice:80`.

---

## 4. Hệ thống Security

### 4.1 JWT Authentication
Mọi luồng đi qua Gateway phải khớp thông tin cài đặt:
- Issuer: `TravelCompany_ApiGateway`
- Audience: `TravelCompany_Users`
- Secret Key

Nếu sai chữ ký, Client sẽ báo lỗi HTTP `401 Unauthorized`. Backend Service không bao giờ thấy request giả mạo này.

### 4.2 Rate Limiting
Trong hệ thống đang áp dụng **Fixed Window Limiter**.
- Một client IP (hoặc Token) chỉ được phép phát ra 100 requests / 60 giây.
- Vượt qua số giới hạn thì các requests tiếp theo nhận lỗi HTTP `429 Too Many Requests`.

---

## 5. Dữ liệu được lưu ở đâu

Do chỉ là "Công tắc mạng" nên ApiGateway **không có** Entity hay Database riêng rẽ. Không có sự tồn tại của DbContext hay PostgreSQL trong module này. Mọi thứ chỉ lưu trữ qua file cấu hình tĩnh `appsettings.json`.

---

## 6. Các endpoint đại diện (Routes)

Gateway sẽ chặn và điều phối các cụm URL sau:

- Dành cho Authentication & Users:
  `http://localhost:<gateway-port>/api/users/...` -> *Chuyển tới `UserService`*
  
- Dành cho Quản trị và Lấy thông tin Toud:
  `http://localhost:<gateway-port>/api/tours/...` -> *Chuyển tới `TourService`*

- Dành cho Giao dịch Đặt chỗ Tour:
  `http://localhost:<gateway-port>/api/bookings/...` -> *Chuyển tới `BookingService`*

---

## 7. Cách chạy API Gateway

### 7.1 Chạy trực tiếp

Vào vị trí thư mục và chạy:
```powershell
dotnet run --project services\ApiGateway\ApiGateway.csproj
```

### 7.2 Docker
Image sẽ được build bằng `Dockerfile` tạo sẵn theo multi-stage. Base Runtime sẽ là `mcr.microsoft.com/dotnet/aspnet:9.0`.

## 8. Tóm tắt

ApiGateway là chốt gác bảo vệ cho hệ thống kiến trúc Microservice. YARP giúp việc bảo dưỡng quy tắc Route đơn giản hơn thông qua file json. Bạn không cần update code, chỉ cần update chuỗi JSON Config nếu muốn thêm 1 Microservice thứ 4 vào mô hình hệ thống sau này!
