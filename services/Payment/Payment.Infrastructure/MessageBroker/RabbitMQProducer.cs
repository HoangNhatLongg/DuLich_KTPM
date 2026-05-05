using System;
using System.Text;
using System.Text.Json;
using BuildingBlocks.Events;
using Microsoft.Extensions.Configuration;
using Payment.Application.Interfaces;
using RabbitMQ.Client;

namespace Payment.Infrastructure.MessageBroker;

public class RabbitMQProducer : IRabbitMQProducer
{
    private readonly IConfiguration _configuration;

    public RabbitMQProducer(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public void PublishEvent<T>(T @event) where T : IEvent
    {
        var factory = new ConnectionFactory
        {
            HostName = _configuration["RabbitMQ:HostName"] ?? "localhost",
            UserName = _configuration["RabbitMQ:UserName"] ?? "guest",
            Password = _configuration["RabbitMQ:Password"] ?? "guest"
        };
        
        using var connection = factory.CreateConnection();
        using var channel = connection.CreateModel();

        var eventName = @event.GetType().Name;

        channel.ExchangeDeclare(exchange: "travel_event_bus", type: ExchangeType.Topic, durable: true);

        var message = JsonSerializer.Serialize(@event);
        var body = Encoding.UTF8.GetBytes(message);

        var properties = channel.CreateBasicProperties();
        properties.Persistent = true;

        channel.BasicPublish(
            exchange: "travel_event_bus",
            routingKey: eventName,
            basicProperties: properties,
            body: body
        );
    }
}
