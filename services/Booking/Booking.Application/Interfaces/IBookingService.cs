using Booking.Application.DTOs;
using Booking.Application.Events;

namespace Booking.Application.Interfaces;

public interface IBookingService
{
    Task<IReadOnlyList<BookingResponse>> GetAllAsync(CancellationToken cancellationToken);
    Task<BookingResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<BookingResponse> CreateAsync(CreateBookingRequest request, CancellationToken cancellationToken);
    Task<BookingResponse> UpdateStatusAsync(Guid id, UpdateBookingStatusRequest request, CancellationToken cancellationToken);
    Task HandlePaymentCompletedAsync(PaymentCompletedEvent paymentCompletedEvent, CancellationToken cancellationToken);
}
