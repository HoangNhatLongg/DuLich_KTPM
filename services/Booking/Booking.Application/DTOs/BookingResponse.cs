namespace Booking.Application.DTOs;

public sealed record BookingResponse(
    Guid Id,
    Guid UserId,
    Guid TourId,
    string TourName,
    string CustomerEmail,
    decimal TotalPrice,
    DateTime? DepartureDate,
    string Status,
    DateTime CreatedAtUtc);
