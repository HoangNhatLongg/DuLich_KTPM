namespace Tour.Application.DTOs;

public sealed record SlotAvailabilityResponse(Guid TourId, int RequestedSlots, int AvailableSlots, bool IsAvailable);
