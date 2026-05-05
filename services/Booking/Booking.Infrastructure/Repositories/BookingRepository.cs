using Microsoft.EntityFrameworkCore;
using Booking.Domain.Interfaces;
using Booking.Infrastructure.Persistence;
using BookingEntity = Booking.Domain.Entities.Booking;

namespace Booking.Infrastructure.Repositories;

public sealed class BookingRepository(BookingDbContext dbContext) : IBookingRepository
{
    public async Task<IReadOnlyList<BookingEntity>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Bookings
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<BookingEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Bookings.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task AddAsync(BookingEntity booking, CancellationToken cancellationToken)
    {
        await dbContext.Bookings.AddAsync(booking, cancellationToken);
    }

    public void Update(BookingEntity booking)
    {
        dbContext.Bookings.Update(booking);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
