using System;

namespace BuildingBlocks.Events;

public interface IEvent
{
    Guid EventId { get; }
    DateTime CreationDate { get; }
}

public abstract class BaseEvent : IEvent
{
    public Guid EventId { get; private set; }
    public DateTime CreationDate { get; private set; }

    protected BaseEvent()
    {
        EventId = Guid.NewGuid();
        CreationDate = DateTime.UtcNow;
    }
}

public class PaymentCompletedEvent : BaseEvent
{
    public Guid PaymentId { get; set; }
    public Guid BookingId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
}
