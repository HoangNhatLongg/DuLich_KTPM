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

        RuleFor(x => x.CustomerEmail)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.TourName)
            .NotEmpty();

        RuleFor(x => x.TotalPrice)
            .GreaterThanOrEqualTo(0);
    }
}
