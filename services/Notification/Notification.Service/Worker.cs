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
    private IConnection _connection = null!;
    private IModel _channel = null!;

    public Worker(ILogger<Worker> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        InitializeRabbitMQ();
    }

    private void InitializeRabbitMQ()
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

            // Khai bao Exchange
            _channel.ExchangeDeclare(exchange: "travel_event_bus", type: ExchangeType.Topic, durable: true);

            // Khai bao Queue
            var queueName = "notification_queue";
            _channel.QueueDeclare(queue: queueName, durable: true, exclusive: false, autoDelete: false, arguments: null);

            // Bind Queue vao Exchange voi Routing Keys
            _channel.QueueBind(queue: queueName, exchange: "travel_event_bus", routingKey: nameof(PaymentCompletedEvent));
            _channel.QueueBind(queue: queueName, exchange: "travel_event_bus", routingKey: nameof(BookingCreatedEvent));
            
            _logger.LogInformation("RabbitMQ Connection and Queue '{QueueName}' initialized successfully. Listening to travel_event_bus...", queueName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not initialize RabbitMQ connection");
        }
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        stoppingToken.ThrowIfCancellationRequested();

        if (_channel == null)
            return Task.CompletedTask;

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

                // Xac nhan message da den noi va da duoc xu ly
                _channel.BasicAck(ea.DeliveryTag, false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong quá trình xử lý message từ Event Bus.");
            }
        };

        _channel.BasicConsume(queue: "notification_queue", autoAck: false, consumer: consumer);

        return Task.CompletedTask;
    }

    public override void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        base.Dispose();
    }
}
