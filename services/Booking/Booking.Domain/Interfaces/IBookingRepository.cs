using BookingEntity = Booking.Domain.Entities.Booking;

namespace Booking.Domain.Interfaces;

public interface IBookingRepository
{
    Task<IReadOnlyList<BookingEntity>> GetAllAsync(CancellationToken cancellationToken);
    Task<BookingEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(BookingEntity booking, CancellationToken cancellationToken);
    void Update(BookingEntity booking);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
