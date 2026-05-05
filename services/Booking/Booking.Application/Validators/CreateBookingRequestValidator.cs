using FluentValidation;
using Booking.Application.DTOs;

namespace Booking.Application.Validators;

public sealed class CreateBookingRequestValidator : AbstractValidator<CreateBookingRequest>
{
    public CreateBookingRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty();

        RuleFor(x => x.TourId)
            .NotEmpty();
    }
}
