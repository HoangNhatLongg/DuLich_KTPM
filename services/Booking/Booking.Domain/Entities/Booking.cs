using Booking.Domain.Enums;

namespace Booking.Domain.Entities;

public sealed class Booking
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid TourId { get; private set; }
    public BookingStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private Booking()
    {
    }

    public Booking(Guid id, Guid userId, Guid tourId, BookingStatus status, DateTime createdAtUtc)
    {
        Id = id;
        UserId = userId;
        TourId = tourId;
        Status = status;
        CreatedAtUtc = createdAtUtc;
    }

    public void UpdateStatus(BookingStatus status)
    {
        Status = status;
    }
}
