namespace Tour.Domain.Entities;

public sealed class Itinerary
{
    public Guid Id { get; private set; }
    public Guid TourId { get; private set; }
    public int DayNumber { get; private set; }
    public string Description { get; private set; } = string.Empty;

    private Itinerary()
    {
    }

    public Itinerary(Guid id, Guid tourId, int dayNumber, string description)
    {
        Id = id;
        TourId = tourId;
        DayNumber = dayNumber;
        Description = description;
    }

    public void Update(int dayNumber, string description)
    {
        DayNumber = dayNumber;
        Description = description;
    }
}
