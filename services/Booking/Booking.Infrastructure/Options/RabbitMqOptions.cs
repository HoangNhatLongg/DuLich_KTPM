namespace Booking.Infrastructure.Options;

public sealed class RabbitMqOptions
{
    public const string SectionName = "RabbitMq";

    public string HostName { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string UserName { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string ExchangeName { get; set; } = "travel.events";
    public string BookingCreatedRoutingKey { get; set; } = "booking.created";
    public string PaymentCompletedRoutingKey { get; set; } = "payment.completed";
    public string PaymentCompletedQueue { get; set; } = "bookingservice.payment.completed";
}
