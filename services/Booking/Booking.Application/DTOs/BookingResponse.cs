namespace Booking.Application.DTOs;

public sealed record BookingResponse(Guid Id, Guid UserId, Guid TourId, string Status, DateTime CreatedAtUtc);
