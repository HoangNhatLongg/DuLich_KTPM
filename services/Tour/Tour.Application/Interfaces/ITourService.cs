using Tour.Application.DTOs;

namespace Tour.Application.Interfaces;

public interface ITourService
{
    Task<IReadOnlyList<TourSummaryResponse>> GetAllAsync(CancellationToken cancellationToken);
    Task<TourDetailResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<TourDetailResponse> CreateAsync(CreateTourRequest request, CancellationToken cancellationToken);
    Task<TourDetailResponse> UpdateAsync(Guid id, UpdateTourRequest request, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<ItineraryResponse>> GetItinerariesAsync(Guid tourId, CancellationToken cancellationToken);
    Task<ItineraryResponse> AddItineraryAsync(Guid tourId, CreateItineraryRequest request, CancellationToken cancellationToken);
    Task<ItineraryResponse> UpdateItineraryAsync(Guid tourId, Guid itineraryId, UpdateItineraryRequest request, CancellationToken cancellationToken);
    Task DeleteItineraryAsync(Guid tourId, Guid itineraryId, CancellationToken cancellationToken);
    Task<SlotAvailabilityResponse> CheckAvailabilityAsync(Guid tourId, int requestedSlots, CancellationToken cancellationToken);
}
