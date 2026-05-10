namespace Tour.Application.DTOs;

public sealed record ItineraryResponse(Guid Id, int DayNumber, string? Morning, string? Noon, string? Afternoon, string? Evening);
