# NotificationService Overview

## 1. Mục tiêu của NotificationService

`NotificationService` là microservice phụ trách:

- Lắng nghe Message thụ động (Event Driven / Messaging) từ Message Broker.
- Mô phỏng hành động cảnh báo / cập nhật thông tin tới Client sau khi một giao dịch hoặc thao tác hoàn tất trên kiến trúc phân tán.
- Trả log ra môi trường tự động mà không cần can thiệp logic ở Controller.

Công nghệ đang dùng:

- ASP.NET Core Worker Service (.NET 9)
- RabbitMQ & Event-Driven Architecture (RabbitMQ.Client)
- Json Serialization

---

## 2. Cấu trúc project

Khác với các Service làm API theo cấu trúc Clean Architecture. `NotificationService` là một project **Stand-alone Worker**. Nó không nhận request từ người dùng (HTTP) bằng các API.

File chứa logic lõi: `Worker.cs`

Module này tham chiếu (Reference) tới thư viện chung là `BuildingBlocks` nằm ở thư mục root để đọc định dạng của các Messages/Events hợp lệ có trên Queue.

---

## 3. Cơ chế hoạt động của Worker Service

Một `Worker Service` hay Background Service luôn tuân thủ nguyên tắc vòng đời của `ExecuteAsync(CancellationToken)`. 

### 3.1 Giai đoạn thiết lập (Initialize)
Ngay lúc Server chạy lên, lớp `Worker` sẽ tự động:
1. Đọc Appsettings lấy tài khoản cấu hình RabbitMQ (Guest/Guest/Localhost).
2. Kết nối tới TCP Socket của Máy chủ RabbitMQ.
3. Tạo ra và giữ lại một Queue với tên `notification_queue`.
4. Trói chặt (Bind) Queue đó vào hệ thống Event Bus `travel_event_bus` thông qua 2 mã định danh đường đi (Routing Key) là `PaymentCompletedEvent` và `BookingCreatedEvent`.

### 3.2 Giai đoạn Lắng nghe (Execution)
Worker sẽ khởi động một instance của lớp `EventingBasicConsumer`. Khách hàng của vòng lặp này chờ đợi sự kiện `.Received` kích hoạt từ Driver của RabbitMQ.
Ngay khi có bytes gửi đến máy:
- Dịch byte thành JSON.
- Đọc `RoutingKey` từ Message Attributes.
  - Nếu key là thanh toán -> Parse JSON về `PaymentCompletedEvent`. In ra mail gửi trạng thái thanh toán.
  - Nếu key là đặt phòng -> Parse JSON về `BookingCreatedEvent`. In ra mail gửi thông tin hoá đơn tổng giá (TotalPrice).
- Báo cáo cho RabbitMQ biết (Ack) là tôi đã giải quyết xong tin nhắn này.

---

## 4. Dữ liệu được lưu ở đâu

Service này hoàn toàn **Stateless** (Không trạng thái). Nó không có database PostgreSQL nào bên dưới. Nhiệm vụ của nó không phải là lưu trữ. Dữ liệu của nó lấy trực tiếp từ luồng RAM từ Queue RabbitMQ. Tất cả đều xử lý In-Memory rồi Garbage Collection. 

Sự trong sạch này hoàn toàn độc lập giúp module Notify chạy với tốc độ cực kì nhanh. Mọi lỗi nếu sinh ra được đưa vào Re-queue (do thiết lập cơ chế ACK thủ công).

---

## 5. Event/Routing key hiện tại

Hệ thống đang cấu hình sẵn 2 sự kiện:
- `PaymentCompletedEvent`: 
  Payload bắt vào gồm PaymentId, BookingId, Amount, Status. Sinh ra từ `PaymentService` mỗi khi Client quét mã QR thanh toán / Webhook thành công.
- `BookingCreatedEvent`: 
  Payload bắt vào gồm BookingId, CustomerEmail, TourName, TotalPrice, Status. Sinh ra (hoặc giả định) từ `BookingService` mỗi khi khách hàng xác nhận book 1 vé đi du lịch mới.

---

## 6. Cách gọi / Test nhanh Module Lắng nghe này

Để trải nghiệm luồng chạy nền, bạn thao tác như sau:
1. Đảm bảo chạy Docker Desktop để Server RabbitMQ đã online ở cổng 5672 (hoặc thiết lập Host của bạn trong `appsettings.json`).
2. Mở cửa sổ Terminal và chạy Worker này lên:
   ```powershell
   dotnet run --project services\Notification\Notification.Service\Notification.Service.csproj
   ```
3. Cửa sổ PowerShell này sẽ báo là *Listening to travel_event_bus* và treo ở đó mãi mãi.
4. Mở thêm 1 thư mục Terminal thứ hai, chạy `Payment.API`:
   ```powershell
   dotnet run --project services\Payment\Payment.API\Payment.API.csproj
   ```
5. Mở Postman hoặc Swagger của Payment, tiến hành gọi lệnh POST `/api/payments/simulate/d33f2...` để giả định 1 request đã xử lý thành công.
6. Mở ngược lại màn hình Terminal của bước số 3, bạn sẽ thấy Logs chớp lên **[EMAIL SENT] MOCK GỬI EMAIL THÀNH CÔNG** gửi về `system_auto_payer@travel.com`.

---

## 7. Tóm tắt nhanh

- `Dockerfile`: Sử dụng nền `dotnet/runtime` siêu tối ưu hoá do không dùng thư viện ASP.NET.
- Không Controller, Không Entity, Không Request/Response Model mà mọi thứ làm việc dựa trên Event Model của hệ thống.
- Là 1 mắt xích thiết yếu để giữ trải nghiệm người dùng phản hồi cao theo mô hình Event-Driven Microservices.
