using Booking.Application.Events;

namespace Booking.Application.Interfaces;

public interface IBookingEventPublisher
{
    Task PublishBookingCreatedAsync(BookingCreatedEvent bookingCreatedEvent, CancellationToken cancellationToken);
}
