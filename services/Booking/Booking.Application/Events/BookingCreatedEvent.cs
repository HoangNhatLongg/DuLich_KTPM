namespace Booking.Application.Events;

public sealed record BookingCreatedEvent(
    Guid BookingId,
    Guid UserId,
    Guid TourId,
    string Status,
    DateTime CreatedAtUtc);
