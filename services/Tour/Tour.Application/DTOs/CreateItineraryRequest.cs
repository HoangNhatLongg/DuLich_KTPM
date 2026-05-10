namespace Tour.Application.DTOs;

public sealed record CreateItineraryRequest(int DayNumber, string? Morning, string? Noon, string? Afternoon, string? Evening);
