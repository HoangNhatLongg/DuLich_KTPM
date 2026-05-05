namespace Tour.Domain.Entities;

public sealed class Tour
{
    private readonly List<Itinerary> _itineraries = [];

    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public int AvailableSlots { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }
    public IReadOnlyCollection<Itinerary> Itineraries => _itineraries.AsReadOnly();

    private Tour()
    {
    }

    public Tour(Guid id, string name, string description, decimal price, int availableSlots, DateTime createdAtUtc)
    {
        Id = id;
        Name = name;
        Description = description;
        Price = price;
        AvailableSlots = availableSlots;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
    }

    public void Update(string name, string description, decimal price, int availableSlots, DateTime updatedAtUtc)
    {
        Name = name;
        Description = description;
        Price = price;
        AvailableSlots = availableSlots;
        UpdatedAtUtc = updatedAtUtc;
    }

    public void AddItinerary(Itinerary itinerary)
    {
        _itineraries.Add(itinerary);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void RemoveItinerary(Itinerary itinerary)
    {
        _itineraries.Remove(itinerary);
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
