using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Booking.Domain.Enums;
using BookingEntity = Booking.Domain.Entities.Booking;

namespace Booking.Infrastructure.Persistence.Configurations;

public sealed class BookingConfiguration : IEntityTypeConfiguration<BookingEntity>
{
    public void Configure(EntityTypeBuilder<BookingEntity> builder)
    {
        builder.ToTable("bookings");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId)
            .IsRequired();

        builder.Property(x => x.TourId)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasConversion(
                status => status.ToString(),
                value => Enum.Parse<BookingStatus>(value))
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.TourId);
        builder.HasIndex(x => x.Status);
    }
}
