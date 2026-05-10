using Booking.Application.DTOs;
using Booking.Application.Interfaces;
using Booking.Domain.Entities;
using Booking.Domain.Interfaces;

namespace Booking.Application.Services;

public sealed class FavoriteTourService(IFavoriteTourRepository favoriteRepository) : IFavoriteTourService
{
    public async Task<IReadOnlyList<FavoriteTourResponse>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        var favorites = await favoriteRepository.GetByUserIdAsync(userId, cancellationToken);
        return favorites.Select(MapResponse).ToList();
    }

    public async Task<bool> IsFavoriteAsync(Guid userId, Guid tourId, CancellationToken cancellationToken)
    {
        return await favoriteRepository.ExistsAsync(userId, tourId, cancellationToken);
    }

    public async Task<FavoriteTourResponse> AddAsync(Guid userId, Guid tourId, CancellationToken cancellationToken)
    {
        var exists = await favoriteRepository.ExistsAsync(userId, tourId, cancellationToken);
        if (exists)
        {
            var existing = await favoriteRepository.GetByUserIdAndTourIdAsync(userId, tourId, cancellationToken);
            if (existing != null)
            {
                return MapResponse(existing);
            }
        }

        var favorite = new FavoriteTour(Guid.NewGuid(), userId, tourId, DateTime.UtcNow);
        await favoriteRepository.AddAsync(favorite, cancellationToken);
        await favoriteRepository.SaveChangesAsync(cancellationToken);

        return MapResponse(favorite);
    }

    public async Task RemoveAsync(Guid userId, Guid tourId, CancellationToken cancellationToken)
    {
        await favoriteRepository.DeleteAsync(userId, tourId, cancellationToken);
        await favoriteRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task ToggleAsync(Guid userId, Guid tourId, CancellationToken cancellationToken)
    {
        var exists = await favoriteRepository.ExistsAsync(userId, tourId, cancellationToken);
        if (exists)
        {
            await RemoveAsync(userId, tourId, cancellationToken);
        }
        else
        {
            await AddAsync(userId, tourId, cancellationToken);
        }
    }

    private static FavoriteTourResponse MapResponse(FavoriteTour favorite)
    {
        return new FavoriteTourResponse(
            favorite.Id,
            favorite.UserId,
            favorite.TourId,
            favorite.CreatedAtUtc);
    }
}
