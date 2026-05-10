using Payment.Domain.Enums;

namespace Payment.Domain.Entities;

public class PaymentTransaction
{
    // EF Core requires a parameterless constructor (private is fine)
    private PaymentTransaction() { }

    public Guid Id { get; private set; }
    public Guid BookingId { get; private set; }
    public decimal Amount { get; private set; }
    public PaymentStatus Status { get; private set; }
    public PaymentMethod Method { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? ProcessedAt { get; private set; }

    // For storing payment details (e.g., QR, Bank Account info, or Gateway response)
    public string? PaymentDetails { get; private set; }

    /// <summary>Factory method to create a new pending payment transaction.</summary>
    public static PaymentTransaction Create(Guid bookingId, decimal amount, PaymentMethod method, string? paymentDetails = null)
    {
        return new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            Amount = amount,
            Status = PaymentStatus.Pending,
            Method = method,
            CreatedAt = DateTime.UtcNow,
            PaymentDetails = paymentDetails
        };
    }

    /// <summary>Marks this transaction as successfully processed.</summary>
    public void MarkAsCompleted()
    {
        Status = PaymentStatus.Success;
        ProcessedAt = DateTime.UtcNow;
    }

    /// <summary>Marks this transaction as failed.</summary>
    public void MarkAsFailed()
    {
        Status = PaymentStatus.Failed;
        ProcessedAt = DateTime.UtcNow;
    }
}
