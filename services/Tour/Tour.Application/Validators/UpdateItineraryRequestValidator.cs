using FluentValidation;
using Tour.Application.DTOs;

namespace Tour.Application.Validators;

public sealed class UpdateItineraryRequestValidator : AbstractValidator<UpdateItineraryRequest>
{
    public UpdateItineraryRequestValidator()
    {
        RuleFor(x => x.DayNumber)
            .GreaterThan(0);

        RuleFor(x => x.Description)
            .NotEmpty()
            .MaximumLength(1000);
    }
}
