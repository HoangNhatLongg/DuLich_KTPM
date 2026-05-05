namespace Tour.Application.DTOs;

public sealed record CreateTourRequest(
    string Name,
    string Description,
    decimal Price,
    int AvailableSlots,
    IReadOnlyCollection<CreateItineraryRequest> Itineraries);
