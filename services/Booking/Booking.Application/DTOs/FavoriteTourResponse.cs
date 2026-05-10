namespace Booking.Application.DTOs;

public sealed record FavoriteTourResponse(
    Guid Id,
    Guid UserId,
    Guid TourId,
    DateTime CreatedAtUtc);
