using Booking.Application.DTOs;
using Booking.Application.Validators;

namespace Booking.Tests;

public sealed class BookingValidationTests
{
    [Fact]
    public async Task CreateBookingRequestValidator_Should_Fail_When_UserId_Is_Empty()
    {
        var validator = new CreateBookingRequestValidator();
        var request = new CreateBookingRequest(Guid.Empty, Guid.NewGuid(), "test@example.com", "Test Tour", 1000m);
        var result = await validator.ValidateAsync(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == "UserId");
    }
}
