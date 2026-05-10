namespace Tour.Application.DTOs;

public sealed record UpdateItineraryRequest(int DayNumber, string? Morning, string? Noon, string? Afternoon, string? Evening);
