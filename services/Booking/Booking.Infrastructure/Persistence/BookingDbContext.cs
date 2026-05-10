using Microsoft.EntityFrameworkCore;
using BookingEntity = Booking.Domain.Entities.Booking;
using Booking.Domain.Entities;

namespace Booking.Infrastructure.Persistence;

public sealed class BookingDbContext(DbContextOptions<BookingDbContext> options) : DbContext(options)
{
    public DbSet<BookingEntity> Bookings => Set<BookingEntity>();
    public DbSet<FavoriteTour> FavoriteTours => Set<FavoriteTour>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BookingDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
