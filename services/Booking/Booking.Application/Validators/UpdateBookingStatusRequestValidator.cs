using FluentValidation;
using Booking.Application.DTOs;
using Booking.Domain.Enums;

namespace Booking.Application.Validators;

public sealed class UpdateBookingStatusRequestValidator : AbstractValidator<UpdateBookingStatusRequest>
{
    public UpdateBookingStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(BeValidStatus)
            .WithMessage("Status must be Pending, Paid, or Cancelled.");
    }

    private static bool BeValidStatus(string status)
    {
        return Enum.TryParse<BookingStatus>(status, true, out _);
    }
}
