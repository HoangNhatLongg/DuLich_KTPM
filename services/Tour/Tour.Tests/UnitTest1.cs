using Tour.Application.DTOs;
using Tour.Application.Validators;

namespace Tour.Tests;

public sealed class TourValidationTests
{
    [Fact]
    public async Task CreateTourRequestValidator_Should_Fail_When_ItineraryHasDuplicateDayNumber()
    {
        var validator = new CreateTourRequestValidator();
        var request = new CreateTourRequest(
            "Da Nang Discovery",
            "3-day city break",
            250m,
            12,
            [
                new CreateItineraryRequest(1, "Arrival"),
                new CreateItineraryRequest(1, "Beach")
            ]);

        var result = await validator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == "Itineraries");
    }
}
