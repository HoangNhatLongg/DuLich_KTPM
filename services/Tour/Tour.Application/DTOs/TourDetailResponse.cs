namespace Tour.Application.DTOs;

public sealed record TourDetailResponse(
    Guid Id,
    string Name,
    string Description,
    decimal Price,
    int AvailableSlots,
    IReadOnlyCollection<ItineraryResponse> Itineraries);
