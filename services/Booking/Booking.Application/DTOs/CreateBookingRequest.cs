namespace Booking.Application.DTOs;

public sealed record CreateBookingRequest(Guid UserId, Guid TourId);
