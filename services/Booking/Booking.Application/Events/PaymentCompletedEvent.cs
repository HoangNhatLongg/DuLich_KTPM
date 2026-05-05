namespace Booking.Application.Events;

public sealed record PaymentCompletedEvent(Guid BookingId, DateTime CompletedAtUtc);
