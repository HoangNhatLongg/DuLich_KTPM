namespace Booking.Infrastructure.Options;

public sealed class TourServiceOptions
{
    public const string SectionName = "TourService";

    public string BaseUrl { get; set; } = "http://localhost:8080";
}
