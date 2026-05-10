using Booking.Domain.Enums;

namespace Booking.Domain.Entities;

public sealed class Booking
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid TourId { get; private set; }
    public string TourName { get; private set; }
    public string CustomerEmail { get; private set; }
    public decimal TotalPrice { get; private set; }
    public DateTime? DepartureDate { get; private set; }
    public BookingStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private Booking()
    {
        TourName = string.Empty;
        CustomerEmail = string.Empty;
    }

    public Booking(
        Guid id,
        Guid userId,
        Guid tourId,
        string tourName,
        string customerEmail,
        decimal totalPrice,
        DateTime? departureDate,
        BookingStatus status,
        DateTime createdAtUtc)
    {
        Id = id;
        UserId = userId;
        TourId = tourId;
        TourName = tourName;
        CustomerEmail = customerEmail;
        TotalPrice = totalPrice;
        DepartureDate = departureDate;
        Status = status;
        CreatedAtUtc = createdAtUtc;
    }

    public void UpdateStatus(BookingStatus status)
    {
        Status = status;
    }
}
