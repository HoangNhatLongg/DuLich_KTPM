using Microsoft.EntityFrameworkCore;
using Booking.Domain.Entities;
using Booking.Domain.Interfaces;
using Booking.Infrastructure.Persistence;

namespace Booking.Infrastructure.Repositories;

public sealed class FavoriteTourRepository : IFavoriteTourRepository
{
    private readonly BookingDbContext _context;

    public FavoriteTourRepository(BookingDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<FavoriteTour>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.FavoriteTours
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<FavoriteTour>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _context.FavoriteTours
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<FavoriteTour?> GetByUserIdAndTourIdAsync(Guid userId, Guid tourId, CancellationToken cancellationToken)
    {
        return await _context.FavoriteTours
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.UserId == userId && f.TourId == tourId, cancellationToken);
    }

    public async Task<bool> ExistsAsync(Guid userId, Guid tourId, CancellationToken cancellationToken)
    {
        return await _context.FavoriteTours
            .AnyAsync(f => f.UserId == userId && f.TourId == tourId, cancellationToken);
    }

    public async Task AddAsync(FavoriteTour favoriteTour, CancellationToken cancellationToken)
    {
        await _context.FavoriteTours.AddAsync(favoriteTour, cancellationToken);
    }

    public async Task DeleteAsync(Guid userId, Guid tourId, CancellationToken cancellationToken)
    {
        var favorite = await _context.FavoriteTours
            .FirstOrDefaultAsync(f => f.UserId == userId && f.TourId == tourId, cancellationToken);

        if (favorite != null)
        {
            _context.FavoriteTours.Remove(favorite);
        }
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
