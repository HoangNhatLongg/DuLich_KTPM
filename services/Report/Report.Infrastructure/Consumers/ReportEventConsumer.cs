using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Report.Application.Interfaces;
using Report.Domain.ReadModels;

namespace Report.Infrastructure.Consumers;

/// <summary>
/// Internal event payloads - defined locally to avoid BuildingBlocks coupling
/// </summary>
public record BookingCreatedPayload(Guid BookingId, Guid TourId, string TourName, string CustomerEmail, decimal TotalPrice);
public record PaymentCompletedPayload(Guid PaymentId, Guid BookingId, decimal Amount, string Status);

public class ReportEventConsumer : BackgroundService
{
    private readonly ILogger<ReportEventConsumer> _logger;
    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;

    // RabbitMQ resources — initialized lazily in ExecuteAsync with retry
    private IConnection? _connection;
    private IModel? _channel;

    public ReportEventConsumer(
        ILogger<ReportEventConsumer> logger,
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _configuration = configuration;
        _scopeFactory = scopeFactory;
        // NOTE: Do NOT call InitializeRabbitMQ() here — RabbitMQ may not be ready at startup.
    }

    private bool TryInitializeRabbitMQ()
    {
        var factory = new ConnectionFactory
        {
            HostName = _configuration["RabbitMQ:HostName"] ?? "localhost",
            UserName = _configuration["RabbitMQ:UserName"] ?? "guest",
            Password = _configuration["RabbitMQ:Password"] ?? "guest"
        };

        try
        {
            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();

            _channel.ExchangeDeclare(exchange: "travel_event_bus", type: ExchangeType.Topic, durable: true);

            var queueName = "report_queue";
            _channel.QueueDeclare(queue: queueName, durable: true, exclusive: false, autoDelete: false, arguments: null);
            _channel.QueueBind(queue: queueName, exchange: "travel_event_bus", routingKey: "BookingCreatedEvent");
            _channel.QueueBind(queue: queueName, exchange: "travel_event_bus", routingKey: "PaymentCompletedEvent");

            _logger.LogInformation("[ReportService] Connected to RabbitMQ. Listening on 'report_queue'...");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[ReportService] Failed to connect to RabbitMQ. Will retry...");
            return false;
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Retry loop — wait until RabbitMQ is available
        const int maxRetries = 10;
        const int retryDelaySeconds = 5;

        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            if (stoppingToken.IsCancellationRequested)
                return;

            if (TryInitializeRabbitMQ())
                break;

            _logger.LogInformation("[ReportService] RabbitMQ retry attempt {Attempt}/{Max}. Waiting {Delay}s...", attempt, maxRetries, retryDelaySeconds);
            await Task.Delay(TimeSpan.FromSeconds(retryDelaySeconds), stoppingToken);
        }

        if (_channel == null)
        {
            _logger.LogError("[ReportService] Failed to connect to RabbitMQ after all retries. Report Consumer will not process events.");
            return;
        }

        var consumer = new EventingBasicConsumer(_channel);
        consumer.Received += async (_, ea) =>
        {
            try
            {
                var body = Encoding.UTF8.GetString(ea.Body.ToArray());
                var routingKey = ea.RoutingKey;

                _logger.LogInformation("[ReportService] Received event: {RoutingKey}", routingKey);

                using var scope = _scopeFactory.CreateScope();
                var repository = scope.ServiceProvider.GetRequiredService<IReportRepository>();

                if (routingKey == "BookingCreatedEvent")
                {
                    var payload = JsonSerializer.Deserialize<BookingCreatedPayload>(body);
                    if (payload != null)
                    {
                        var snapshot = new BookingSnapshot
                        {
                            Id = Guid.NewGuid(),
                            BookingId = payload.BookingId,
                            TourId = payload.TourId,
                            TourName = payload.TourName,
                            CustomerEmail = payload.CustomerEmail,
                            Amount = payload.TotalPrice,
                            IsPaid = false,
                            CreatedAt = DateTime.UtcNow
                        };
                        await repository.SaveBookingSnapshotAsync(snapshot);
                        _logger.LogInformation("[ReportService] Saved BookingSnapshot for BookingId={BookingId}", payload.BookingId);
                    }
                }
                else if (routingKey == "PaymentCompletedEvent")
                {
                    var payload = JsonSerializer.Deserialize<PaymentCompletedPayload>(body);
                    if (payload != null && payload.Status == "Success")
                    {
                        await repository.MarkSnapshotAsPaidAsync(payload.BookingId);
                        _logger.LogInformation("[ReportService] Marked BookingId={BookingId} as Paid", payload.BookingId);
                    }
                }

                _channel.BasicAck(ea.DeliveryTag, false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ReportService] Error processing event.");
            }
        };

        _channel.BasicConsume(queue: "report_queue", autoAck: false, consumer: consumer);

        // Keep the worker alive until cancellation
        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    public override void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        base.Dispose();
    }
}
