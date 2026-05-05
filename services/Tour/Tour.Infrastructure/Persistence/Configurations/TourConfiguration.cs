using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Tour.Infrastructure.Persistence.Configurations;

public sealed class TourConfiguration : IEntityTypeConfiguration<Tour.Domain.Entities.Tour>
{
    public void Configure(EntityTypeBuilder<Tour.Domain.Entities.Tour> builder)
    {
        builder.ToTable("tours");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(x => x.Price)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(x => x.AvailableSlots)
            .IsRequired();

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.Property(x => x.UpdatedAtUtc)
            .IsRequired();

        builder.Metadata.FindNavigation(nameof(Tour.Domain.Entities.Tour.Itineraries))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);
    }
}
