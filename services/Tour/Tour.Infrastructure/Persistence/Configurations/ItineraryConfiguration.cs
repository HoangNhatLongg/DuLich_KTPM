using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tour.Domain.Entities;

namespace Tour.Infrastructure.Persistence.Configurations;

public sealed class ItineraryConfiguration : IEntityTypeConfiguration<Itinerary>
{
    public void Configure(EntityTypeBuilder<Itinerary> builder)
    {
        builder.ToTable("itineraries");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.DayNumber)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(1000)
            .IsRequired();

        builder.HasIndex(x => new { x.TourId, x.DayNumber })
            .IsUnique();

        builder.HasOne<Tour.Domain.Entities.Tour>()
            .WithMany(nameof(Tour.Domain.Entities.Tour.Itineraries))
            .HasForeignKey(x => x.TourId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
