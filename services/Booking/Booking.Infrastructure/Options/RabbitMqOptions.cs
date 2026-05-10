namespace Booking.Infrastructure.Options;

public sealed class RabbitMqOptions
{
    public const string SectionName = "RabbitMq";

    public string HostName { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string UserName { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string ExchangeName { get; set; } = "travel_event_bus";
    public string BookingCreatedRoutingKey { get; set; } = "BookingCreatedEvent";
    public string PaymentCompletedRoutingKey { get; set; } = "PaymentCompletedEvent";
    public string PaymentCompletedQueue { get; set; } = "bookingservice.payment.completed";
}
