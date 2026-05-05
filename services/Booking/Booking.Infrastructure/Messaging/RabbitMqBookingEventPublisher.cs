using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;
using RabbitMQ.Client;
using Booking.Application.Events;
using Booking.Application.Interfaces;
using Booking.Infrastructure.Options;

namespace Booking.Infrastructure.Messaging;

public sealed class RabbitMqBookingEventPublisher(
    IOptions<RabbitMqOptions> options,
    ILogger<RabbitMqBookingEventPublisher> logger) : IBookingEventPublisher
{
    private static readonly JsonSerializerOptions JsonSerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly RabbitMqOptions _options = options.Value;

    public async Task PublishBookingCreatedAsync(BookingCreatedEvent bookingCreatedEvent, CancellationToken cancellationToken)
    {
        var payload = JsonSerializer.Serialize(bookingCreatedEvent, JsonSerializerOptions);
        var body = Encoding.UTF8.GetBytes(payload);

        var retryPolicy = Policy
            .Handle<Exception>()
            .WaitAndRetryAsync(
                3,
                retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                (exception, delay, retryAttempt, _) =>
                {
                    logger.LogWarning(
                        exception,
                        "Retry {RetryAttempt} while publishing BookingCreated. Waiting {Delay} before next attempt.",
                        retryAttempt,
                        delay);
                });

        await retryPolicy.ExecuteAsync(_ =>
        {
            cancellationToken.ThrowIfCancellationRequested();

            var factory = new ConnectionFactory
            {
                HostName = _options.HostName,
                Port = _options.Port,
                UserName = _options.UserName,
                Password = _options.Password,
                DispatchConsumersAsync = true
            };

            using var connection = factory.CreateConnection();
            using var channel = connection.CreateModel();

            channel.ExchangeDeclare(_options.ExchangeName, ExchangeType.Topic, durable: true);

            var properties = channel.CreateBasicProperties();
            properties.Persistent = true;
            properties.ContentType = "application/json";

            channel.BasicPublish(
                exchange: _options.ExchangeName,
                routingKey: _options.BookingCreatedRoutingKey,
                basicProperties: properties,
                body: body);

            logger.LogInformation("Published BookingCreated event for booking {BookingId}", bookingCreatedEvent.BookingId);
            return Task.CompletedTask;
        }, cancellationToken);
    }
}
