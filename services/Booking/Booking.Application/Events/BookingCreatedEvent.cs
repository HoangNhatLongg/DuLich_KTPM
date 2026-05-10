namespace Booking.Application.Events;

public sealed record BookingCreatedEvent(
    Guid BookingId,
    Guid TourId,
    string TourName,
    string CustomerEmail,
    decimal TotalPrice,
    string Status);
