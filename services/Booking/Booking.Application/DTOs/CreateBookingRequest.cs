namespace Booking.Application.DTOs;

public sealed record CreateBookingRequest(
    Guid UserId,
    Guid TourId,
    string CustomerEmail,
    string TourName,
    decimal TotalPrice,
    DateTime? DepartureDate = null);
