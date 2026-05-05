using Booking.Application.DTOs;

namespace Booking.Application.Interfaces;

public interface ITourAvailabilityClient
{
    Task<TourSlotAvailabilityResponse> CheckAvailabilityAsync(Guid tourId, int requestedSlots, CancellationToken cancellationToken);
}
