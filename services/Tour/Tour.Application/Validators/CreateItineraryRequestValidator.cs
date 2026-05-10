using FluentValidation;
using Tour.Application.DTOs;

namespace Tour.Application.Validators;

public sealed class CreateItineraryRequestValidator : AbstractValidator<CreateItineraryRequest>
{
    public CreateItineraryRequestValidator()
    {
        RuleFor(x => x.DayNumber)
            .GreaterThan(0);

        RuleFor(x => x.Morning)
            .MaximumLength(500);

        RuleFor(x => x.Noon)
            .MaximumLength(500);

        RuleFor(x => x.Afternoon)
            .MaximumLength(500);

        RuleFor(x => x.Evening)
            .MaximumLength(500);
    }
}
