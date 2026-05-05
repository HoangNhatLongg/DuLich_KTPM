using FluentValidation;
using Tour.Application.DTOs;

namespace Tour.Application.Validators;

public sealed class CreateTourRequestValidator : AbstractValidator<CreateTourRequest>
{
    public CreateTourRequestValidator()
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

        RuleFor(x => x.Itineraries)
            .NotNull();

        RuleForEach(x => x.Itineraries)
            .SetValidator(new CreateItineraryRequestValidator());

        RuleFor(x => x.Itineraries)
            .Must(HaveUniqueDayNumbers)
            .WithMessage("Itinerary day numbers must be unique.");
    }

    private static bool HaveUniqueDayNumbers(IReadOnlyCollection<CreateItineraryRequest> itineraries)
    {
        return itineraries.Count == itineraries.Select(x => x.DayNumber).Distinct().Count();
    }
}
