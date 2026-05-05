using FluentValidation;
using Staff.Application.DTOs;

namespace Staff.Application.Validators;

public class UpdateStaffDtoValidator : AbstractValidator<UpdateStaffDto>
{
    public UpdateStaffDtoValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().WithMessage("FullName is required.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid Email is required.");
        RuleFor(x => x.Phone).NotEmpty().WithMessage("Phone is required.");
        RuleFor(x => x.Position).IsInEnum().WithMessage("Invalid position.");
        RuleFor(x => x.Status).IsInEnum().WithMessage("Invalid status.");
    }
}
