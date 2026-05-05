using FluentValidation;
using Tour.Application.DTOs;

namespace Tour.Application.Validators;

public sealed class UpdateTourRequestValidator : AbstractValidator<UpdateTourRequest>
{
    public UpdateTourRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Description)
            .NotEmpty()
            .MaximumLength(2000);

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0);

        RuleFor(x => x.AvailableSlots)
            .GreaterThanOrEqualTo(0);
    }
}
