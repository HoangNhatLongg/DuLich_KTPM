using System;

namespace Payment.Application.DTOs;

public class PaymentResponseDto
{
    public Guid PaymentId { get; set; }
    public Guid BookingId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentUrlOrQrCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
