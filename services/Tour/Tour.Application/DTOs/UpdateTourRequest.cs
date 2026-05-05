namespace Tour.Application.DTOs;

public sealed record UpdateTourRequest(
    string Name,
    string Description,
    decimal Price,
    int AvailableSlots);
