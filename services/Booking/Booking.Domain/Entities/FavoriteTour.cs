namespace Booking.Domain.Entities;

public sealed class FavoriteTour
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid TourId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private FavoriteTour()
    {
    }

    public FavoriteTour(Guid id, Guid userId, Guid tourId, DateTime createdAtUtc)
    {
        Id = id;
        UserId = userId;
        TourId = tourId;
        CreatedAtUtc = createdAtUtc;
    }
}
