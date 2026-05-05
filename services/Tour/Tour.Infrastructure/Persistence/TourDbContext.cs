using Microsoft.EntityFrameworkCore;
using Tour.Domain.Entities;

namespace Tour.Infrastructure.Persistence;

public sealed class TourDbContext(DbContextOptions<TourDbContext> options) : DbContext(options)
{
    public DbSet<Tour.Domain.Entities.Tour> Tours => Set<Tour.Domain.Entities.Tour>();
    public DbSet<Itinerary> Itineraries => Set<Itinerary>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TourDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
