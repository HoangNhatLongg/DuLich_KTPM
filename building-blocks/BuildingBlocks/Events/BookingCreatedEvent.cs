using System;

namespace BuildingBlocks.Events;

public class BookingCreatedEvent : BaseEvent
{
    public Guid BookingId { get; set; }
    public Guid TourId { get; set; }
    public string CustomerEmail { get; set; } = string.Empty;
    public string TourName { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
}
