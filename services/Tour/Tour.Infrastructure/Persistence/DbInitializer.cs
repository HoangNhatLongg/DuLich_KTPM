using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Tour.Domain.Entities;

namespace Tour.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task InitializeTourDatabaseAsync(this IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TourDbContext>();

        await dbContext.Database.MigrateAsync();

        if (await dbContext.Tours.AnyAsync())
        {
            return;
        }

        var tours = SeedData.CreateTours();
        await dbContext.Tours.AddRangeAsync(tours);
        await dbContext.SaveChangesAsync();
    }

    private static class SeedData
    {
        public static IReadOnlyList<Tour.Domain.Entities.Tour> CreateTours()
        {
            var createdAt = new DateTime(2026, 4, 25, 0, 0, 0, DateTimeKind.Utc);

            var haLong = new Tour.Domain.Entities.Tour(
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                "Ha Long Bay Escape",
                "2 days discovering caves, cruises, and seafood in Ha Long Bay.",
                199.99m,
                20,
                createdAt);

            haLong.AddItinerary(new Itinerary(
                Guid.Parse("11111111-1111-1111-1111-111111111201"),
                haLong.Id,
                1,
                "Transfer to Ha Long, check in on the cruise, and sunset dinner."));
            haLong.AddItinerary(new Itinerary(
                Guid.Parse("11111111-1111-1111-1111-111111111202"),
                haLong.Id,
                2,
                "Morning kayaking, cave visit, and return to Hanoi."));

            var daNang = new Tour.Domain.Entities.Tour(
                Guid.Parse("22222222-2222-2222-2222-222222222222"),
                "Da Nang And Hoi An Highlights",
                "3-day central Vietnam package covering beaches, Ba Na Hills, and Hoi An ancient town.",
                329.50m,
                15,
                createdAt);

            daNang.AddItinerary(new Itinerary(
                Guid.Parse("22222222-2222-2222-2222-222222222201"),
                daNang.Id,
                1,
                "Airport pickup, My Khe Beach, and Han River evening walk."));
            daNang.AddItinerary(new Itinerary(
                Guid.Parse("22222222-2222-2222-2222-222222222202"),
                daNang.Id,
                2,
                "Full-day Ba Na Hills visit with cable car and Golden Bridge."));
            daNang.AddItinerary(new Itinerary(
                Guid.Parse("22222222-2222-2222-2222-222222222203"),
                daNang.Id,
                3,
                "Marble Mountains and Hoi An lantern night experience."));

            return [haLong, daNang];
        }
    }
}
