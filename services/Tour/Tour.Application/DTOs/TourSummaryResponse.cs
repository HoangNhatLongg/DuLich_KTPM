namespace Tour.Application.DTOs;

public sealed record TourSummaryResponse(
    Guid Id,
    string Name,
    string Description,
    decimal Price,
    int AvailableSlots,
    int TotalDays,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);
