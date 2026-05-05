namespace Booking.Application.DTOs;

public sealed record TourSlotAvailabilityResponse(Guid TourId, int RequestedSlots, int AvailableSlots, bool IsAvailable);
