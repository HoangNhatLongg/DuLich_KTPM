using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Booking.Domain.Entities;

namespace Booking.Infrastructure.Persistence.Configurations;

public sealed class FavoriteTourConfiguration : IEntityTypeConfiguration<FavoriteTour>
{
    public void Configure(EntityTypeBuilder<FavoriteTour> builder)
    {
        builder.ToTable("favorite_tours");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId)
            .IsRequired();

        builder.Property(x => x.TourId)
            .IsRequired();

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(x => new { x.UserId, x.TourId }).IsUnique();
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.TourId);
    }
}
