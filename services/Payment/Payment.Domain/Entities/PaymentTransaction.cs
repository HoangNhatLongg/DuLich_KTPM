using System;
using Payment.Domain.Enums;

namespace Payment.Domain.Entities;

public class PaymentTransaction
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; }
    public PaymentMethod Method { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    
    // For storing payment details (e.g., QR, Bank Account info, or Gateway response)
    public string? PaymentDetails { get; set; } 
}
