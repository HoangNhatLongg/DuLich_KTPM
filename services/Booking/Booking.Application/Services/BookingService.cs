using FluentValidation;
using Booking.Application.Common.Exceptions;
using Booking.Application.DTOs;
using Booking.Application.Events;
using Booking.Application.Interfaces;
using Booking.Domain.Entities;
using Booking.Domain.Enums;
using Booking.Domain.Interfaces;

namespace Booking.Application.Services;

public sealed class BookingService(
    IBookingRepository bookingRepository,
    ITourAvailabilityClient tourAvailabilityClient,
    IBookingEventPublisher bookingEventPublisher,
    IValidator<CreateBookingRequest> createBookingValidator,
    IValidator<UpdateBookingStatusRequest> updateBookingStatusValidator) : IBookingService
{
    public async Task<IReadOnlyList<BookingResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        var bookings = await bookingRepository.GetAllAsync(cancellationToken);
        return bookings.Select(MapResponse).ToList();
    }

    public async Task<IReadOnlyList<BookingResponse>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        var bookings = await bookingRepository.GetByUserIdAsync(userId, cancellationToken);
        return bookings.Select(MapResponse).ToList();
    }

    public async Task<BookingResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var booking = await GetBookingAsync(id, cancellationToken);
        return MapResponse(booking);
    }

    public async Task<BookingResponse> CreateAsync(CreateBookingRequest request, CancellationToken cancellationToken)
    {
        await createBookingValidator.ValidateAndThrowAsync(request, cancellationToken);

        TourSlotAvailabilityResponse availability;
        try
        {
            availability = await tourAvailabilityClient.CheckAvailabilityAsync(request.TourId, 1, cancellationToken);
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            throw new DependencyUnavailableException("TourService is unavailable.");
        }

        if (!availability.IsAvailable)
        {
            throw new BadRequestException("The selected tour has no available slots.");
        }

        var booking = new Booking.Domain.Entities.Booking(
            Guid.NewGuid(),
            request.UserId,
            request.TourId,
            request.TourName,
            request.CustomerEmail,
            request.TotalPrice,
            request.DepartureDate,
            BookingStatus.Pending,
            DateTime.UtcNow);

        await bookingRepository.AddAsync(booking, cancellationToken);
        await bookingRepository.SaveChangesAsync(cancellationToken);

        await bookingEventPublisher.PublishBookingCreatedAsync(
            new BookingCreatedEvent(
                booking.Id,
                booking.TourId,
                request.TourName,
                request.CustomerEmail,
                request.TotalPrice,
                booking.Status.ToString()),
            cancellationToken);

        return MapResponse(booking);
    }

    public async Task<BookingResponse> UpdateStatusAsync(Guid id, UpdateBookingStatusRequest request, CancellationToken cancellationToken)
    {
        await updateBookingStatusValidator.ValidateAndThrowAsync(request, cancellationToken);

        var booking = await GetBookingAsync(id, cancellationToken);
        var status = ParseStatus(request.Status);

        booking.UpdateStatus(status);
        bookingRepository.Update(booking);
        await bookingRepository.SaveChangesAsync(cancellationToken);

        return MapResponse(booking);
    }

    public async Task HandlePaymentCompletedAsync(PaymentCompletedEvent paymentCompletedEvent, CancellationToken cancellationToken)
    {
        var booking = await GetBookingAsync(paymentCompletedEvent.BookingId, cancellationToken);
        if (booking.Status == BookingStatus.Paid)
        {
            return;
        }

        booking.UpdateStatus(BookingStatus.Paid);
        bookingRepository.Update(booking);
        await bookingRepository.SaveChangesAsync(cancellationToken);
    }

    private async Task<Booking.Domain.Entities.Booking> GetBookingAsync(Guid id, CancellationToken cancellationToken)
    {
        return await bookingRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Booking '{id}' was not found.");
    }

    private static BookingStatus ParseStatus(string status)
    {
        if (!Enum.TryParse<BookingStatus>(status, true, out var parsedStatus))
        {
            throw new BadRequestException("Invalid booking status.");
        }

        return parsedStatus;
    }

    private static BookingResponse MapResponse(Booking.Domain.Entities.Booking booking)
    {
        return new BookingResponse(
            booking.Id,
            booking.UserId,
            booking.TourId,
            booking.TourName,
            booking.CustomerEmail,
            booking.TotalPrice,
            booking.DepartureDate,
            booking.Status.ToString(),
            booking.CreatedAtUtc);
    }
}
