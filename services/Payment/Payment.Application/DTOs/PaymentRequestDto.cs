using System;
using Payment.Domain.Enums;

namespace Payment.Application.DTOs;

public class PaymentRequestDto
{
    public Guid BookingId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; }
}
