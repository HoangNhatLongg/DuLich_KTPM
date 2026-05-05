using BuildingBlocks.Events;

namespace Payment.Application.Interfaces;

public interface IRabbitMQProducer
{
    void PublishEvent<T>(T @event) where T : IEvent;
}
