using Tour.Domain.Entities;

namespace Tour.Domain.Interfaces;

public interface ITourRepository
{
    Task<IReadOnlyList<Entities.Tour>> GetAllAsync(CancellationToken cancellationToken);
    Task<Entities.Tour?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<Entities.Tour?> GetByIdWithItinerariesAsync(Guid id, CancellationToken cancellationToken);
    Task<Itinerary?> GetItineraryAsync(Guid tourId, Guid itineraryId, CancellationToken cancellationToken);
    Task AddAsync(Entities.Tour tour, CancellationToken cancellationToken);
    void Update(Entities.Tour tour);
    void Remove(Entities.Tour tour);
    Task<bool> HasConflictingDayNumberAsync(Guid tourId, int dayNumber, Guid? itineraryId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
