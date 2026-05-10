using Booking.Application.DTOs;

namespace Booking.Application.Interfaces;

public interface IFavoriteTourService
{
    Task<IReadOnlyList<FavoriteTourResponse>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task<bool> IsFavoriteAsync(Guid userId, Guid tourId, CancellationToken cancellationToken);
    Task<FavoriteTourResponse> AddAsync(Guid userId, Guid tourId, CancellationToken cancellationToken);
    Task RemoveAsync(Guid userId, Guid tourId, CancellationToken cancellationToken);
    Task ToggleAsync(Guid userId, Guid tourId, CancellationToken cancellationToken);
}
