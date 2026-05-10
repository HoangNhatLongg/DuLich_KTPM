using Booking.Domain.Entities;

namespace Booking.Domain.Interfaces;

public interface IFavoriteTourRepository
{
    Task<IReadOnlyList<FavoriteTour>> GetAllAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<FavoriteTour>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task<FavoriteTour?> GetByUserIdAndTourIdAsync(Guid userId, Guid tourId, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(Guid userId, Guid tourId, CancellationToken cancellationToken);
    Task AddAsync(FavoriteTour favoriteTour, CancellationToken cancellationToken);
    Task DeleteAsync(Guid userId, Guid tourId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
