using Microsoft.EntityFrameworkCore;
using Tour.Domain.Entities;
using Tour.Domain.Interfaces;
using Tour.Infrastructure.Persistence;

namespace Tour.Infrastructure.Repositories;

public sealed class TourRepository(TourDbContext dbContext) : ITourRepository
{
    public async Task<IReadOnlyList<Tour.Domain.Entities.Tour>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Tours
            .Include(x => x.Itineraries)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Tour.Domain.Entities.Tour?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Tours
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<Tour.Domain.Entities.Tour?> GetByIdWithItinerariesAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Tours
            .Include(x => x.Itineraries)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<Itinerary?> GetItineraryAsync(Guid tourId, Guid itineraryId, CancellationToken cancellationToken)
    {
        return await dbContext.Itineraries
            .FirstOrDefaultAsync(x => x.TourId == tourId && x.Id == itineraryId, cancellationToken);
    }

    public async Task AddAsync(Tour.Domain.Entities.Tour tour, CancellationToken cancellationToken)
    {
        await dbContext.Tours.AddAsync(tour, cancellationToken);
    }

    public void Update(Tour.Domain.Entities.Tour tour)
    {
        dbContext.Tours.Update(tour);
    }

    public void Remove(Tour.Domain.Entities.Tour tour)
    {
        dbContext.Tours.Remove(tour);
    }

    public async Task<bool> HasConflictingDayNumberAsync(Guid tourId, int dayNumber, Guid? itineraryId, CancellationToken cancellationToken)
    {
        return await dbContext.Itineraries.AnyAsync(
            x => x.TourId == tourId &&
                 x.DayNumber == dayNumber &&
                 (!itineraryId.HasValue || x.Id != itineraryId.Value),
            cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
