using System.Text;
using System.Text.Json;
using BuildingBlocks.Events;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Notification.Service;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IConfiguration _configuration;

    // RabbitMQ resources — initialized lazily inside ExecuteAsync with retry
    private IConnection? _connection;
    private IModel? _channel;

    public Worker(ILogger<Worker> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
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

            // Declare Exchange
            _channel.ExchangeDeclare(exchange: "travel_event_bus", type: ExchangeType.Topic, durable: true);

            // Declare Queue
            var queueName = "notification_queue";
            _channel.QueueDeclare(queue: queueName, durable: true, exclusive: false, autoDelete: false, arguments: null);

            // Bind Queue to Exchange with Routing Keys
            _channel.QueueBind(queue: queueName, exchange: "travel_event_bus", routingKey: nameof(PaymentCompletedEvent));
            _channel.QueueBind(queue: queueName, exchange: "travel_event_bus", routingKey: nameof(BookingCreatedEvent));

            _logger.LogInformation("RabbitMQ Connection and Queue '{QueueName}' initialized successfully. Listening to travel_event_bus...", queueName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not connect to RabbitMQ. Will retry...");
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

            _logger.LogInformation("RabbitMQ retry attempt {Attempt}/{Max}. Waiting {Delay}s...", attempt, maxRetries, retryDelaySeconds);
            await Task.Delay(TimeSpan.FromSeconds(retryDelaySeconds), stoppingToken);
        }

        if (_channel == null)
        {
            _logger.LogError("Failed to connect to RabbitMQ after all retries. Notification Worker will not process messages.");
            return;
        }

        var consumer = new EventingBasicConsumer(_channel);
        consumer.Received += (ch, ea) =>
        {
            try
            {
                var body = ea.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);
                var routingKey = ea.RoutingKey;

                _logger.LogInformation("Nhận được message từ RoutingKey: {RoutingKey}", routingKey);

                if (routingKey == nameof(PaymentCompletedEvent))
                {
                    var paymentEvent = JsonSerializer.Deserialize<PaymentCompletedEvent>(message);
                    if (paymentEvent != null)
                    {
                        // Mock send email
                        _logger.LogInformation("--------------------------------------------------");
                        _logger.LogInformation("[EMAIL SENT] MOCK GỬI EMAIL THÀNH CÔNG");
                        _logger.LogInformation("To: system_auto_payer@travel.com");
                        _logger.LogInformation("Subject: Hệ thống xác nhận thanh toán");
                        _logger.LogInformation("Body: Giao dịch thanh toán ID '{PaymentId}' cho Booking '{BookingId}' đã có trạng thái: {Status}", paymentEvent.PaymentId, paymentEvent.BookingId, paymentEvent.Status);
                        _logger.LogInformation("--------------------------------------------------");
                    }
                }
                else if (routingKey == nameof(BookingCreatedEvent))
                {
                    var bookingEvent = JsonSerializer.Deserialize<BookingCreatedEvent>(message);
                    if (bookingEvent != null)
                    {
                        // Mock send email
                        _logger.LogInformation("--------------------------------------------------");
                        _logger.LogInformation("[EMAIL SENT] MOCK GỬI EMAIL THÀNH CÔNG");
                        _logger.LogInformation("To: {CustomerEmail}", bookingEvent.CustomerEmail);
                        _logger.LogInformation("Subject: Xác nhận tạo mới Booking");
                        _logger.LogInformation("Body: Cảm ơn bạn đã đặt tour '{TourName}'. Booking Id của bạn là '{BookingId}'. Vui lòng thanh toán số tiền {TotalPrice} VND.", bookingEvent.TourName, bookingEvent.BookingId, bookingEvent.TotalPrice);
                        _logger.LogInformation("--------------------------------------------------");
                    }
                }

                // Acknowledge message has been processed
                _channel.BasicAck(ea.DeliveryTag, false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong quá trình xử lý message từ Event Bus.");
            }
        };

        _channel.BasicConsume(queue: "notification_queue", autoAck: false, consumer: consumer);

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
