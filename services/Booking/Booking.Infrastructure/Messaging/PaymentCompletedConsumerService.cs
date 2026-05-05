using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Booking.Application.Events;
using Booking.Application.Interfaces;
using Booking.Infrastructure.Options;

namespace Booking.Infrastructure.Messaging;

public sealed class PaymentCompletedConsumerService(
    IServiceScopeFactory serviceScopeFactory,
    IOptions<RabbitMqOptions> options,
    ILogger<PaymentCompletedConsumerService> logger) : BackgroundService
{
    private static readonly JsonSerializerOptions JsonSerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly RabbitMqOptions _options = options.Value;
    private IConnection? _connection;
    private IModel? _channel;

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        InitializeRabbitMq();

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.Received += async (_, eventArgs) =>
        {
            var retryPolicy = Policy
                .Handle<Exception>()
                .WaitAndRetryAsync(
                    3,
                    retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                    (exception, delay, retryAttempt, _) =>
                    {
                        logger.LogWarning(
                            exception,
                            "Retry {RetryAttempt} while handling PaymentCompleted. Waiting {Delay}.",
                            retryAttempt,
                            delay);
                    });

            try
            {
                await retryPolicy.ExecuteAsync(async _ =>
                {
                    var json = Encoding.UTF8.GetString(eventArgs.Body.ToArray());
                    var paymentCompletedEvent = JsonSerializer.Deserialize<PaymentCompletedEvent>(json, JsonSerializerOptions)
                        ?? throw new InvalidOperationException("PaymentCompleted payload is invalid.");

                    await using var scope = serviceScopeFactory.CreateAsyncScope();
                    var bookingService = scope.ServiceProvider.GetRequiredService<IBookingService>();
                    await bookingService.HandlePaymentCompletedAsync(paymentCompletedEvent, stoppingToken);
                }, stoppingToken);

                _channel!.BasicAck(eventArgs.DeliveryTag, multiple: false);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to process PaymentCompleted event.");
                _channel!.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: false);
            }
        };

        _channel!.BasicConsume(
            queue: _options.PaymentCompletedQueue,
            autoAck: false,
            consumer: consumer);

        return WaitForShutdownAsync(stoppingToken);
    }

    public override void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        base.Dispose();
    }

    private void InitializeRabbitMq()
    {
        var factory = new ConnectionFactory
        {
            HostName = _options.HostName,
            Port = _options.Port,
            UserName = _options.UserName,
            Password = _options.Password,
            DispatchConsumersAsync = true
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();

        _channel.ExchangeDeclare(_options.ExchangeName, ExchangeType.Topic, durable: true);
        _channel.QueueDeclare(_options.PaymentCompletedQueue, durable: true, exclusive: false, autoDelete: false);
        _channel.QueueBind(_options.PaymentCompletedQueue, _options.ExchangeName, _options.PaymentCompletedRoutingKey);
    }

    private static async Task WaitForShutdownAsync(CancellationToken stoppingToken)
    {
        try
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken);
        }
        catch (OperationCanceledException)
        {
        }
    }
}
