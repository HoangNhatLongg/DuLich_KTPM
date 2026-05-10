namespace Notification.Application;

/// <summary>
/// Interface cho Notification Service — định nghĩa contract gửi thông báo.
/// Hiện tại chỉ mock qua logging trong Worker.cs.
/// Có thể mở rộng để gửi email thực (SMTP), SMS, hoặc push notification.
/// </summary>
public interface INotificationService
{
    /// <summary>Gửi email xác nhận khi booking được tạo mới.</summary>
    Task SendBookingConfirmationAsync(Guid bookingId, string customerEmail, string tourName, decimal totalPrice, CancellationToken cancellationToken = default);

    /// <summary>Gửi email xác nhận khi thanh toán thành công.</summary>
    Task SendPaymentConfirmationAsync(Guid paymentId, Guid bookingId, decimal amount, CancellationToken cancellationToken = default);
}
