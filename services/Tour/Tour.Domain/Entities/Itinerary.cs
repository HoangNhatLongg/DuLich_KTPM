namespace Tour.Domain.Entities;

public sealed class Itinerary
{
    public Guid Id { get; private set; }
    public Guid TourId { get; private set; }
    public int DayNumber { get; private set; }
    public string? Morning { get; private set; }
    public string? Noon { get; private set; }
    public string? Afternoon { get; private set; }
    public string? Evening { get; private set; }

    private Itinerary()
    {
    }

    public Itinerary(Guid id, Guid tourId, int dayNumber, string? morning, string? noon, string? afternoon, string? evening)
    {
        Id = id;
        TourId = tourId;
        DayNumber = dayNumber;
        Morning = morning;
        Noon = noon;
        Afternoon = afternoon;
        Evening = evening;
    }

    public void Update(int dayNumber, string? morning, string? noon, string? afternoon, string? evening)
    {
        DayNumber = dayNumber;
        Morning = morning;
        Noon = noon;
        Afternoon = afternoon;
        Evening = evening;
    }
}
