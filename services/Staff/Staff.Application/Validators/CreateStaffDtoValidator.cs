using FluentValidation;
using Staff.Application.DTOs;

namespace Staff.Application.Validators;

public class CreateStaffDtoValidator : AbstractValidator<CreateStaffDto>
{
    public CreateStaffDtoValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().WithMessage("FullName is required.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid Email is required.");
        RuleFor(x => x.Phone).NotEmpty().WithMessage("Phone is required.");
        RuleFor(x => x.Position).IsInEnum().WithMessage("Invalid position.");
    }
}
