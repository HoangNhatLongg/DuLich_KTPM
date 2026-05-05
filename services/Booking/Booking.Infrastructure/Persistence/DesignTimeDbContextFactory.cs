using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Booking.Infrastructure.Persistence;

public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<BookingDbContext>
{
    public BookingDbContext CreateDbContext(string[] args)
    {
        var apiProjectPath = ResolveApiProjectPath();

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiProjectPath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("PostgreSQL")
            ?? "Host=localhost;Port=5432;Database=BookingServiceDb;Username=postgres;Password=123456";

        var optionsBuilder = new DbContextOptionsBuilder<BookingDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new BookingDbContext(optionsBuilder.Options);
    }

    private static string ResolveApiProjectPath()
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        var appBaseDirectory = AppContext.BaseDirectory;

        var candidates = new[]
        {
            Path.GetFullPath(Path.Combine(currentDirectory, "..", "Booking.API")),
            Path.GetFullPath(Path.Combine(currentDirectory, "services", "Booking", "Booking.API")),
            Path.GetFullPath(Path.Combine(appBaseDirectory, "..", "..", "..", "..", "Booking.API")),
            Path.GetFullPath(Path.Combine(appBaseDirectory, "..", "..", "..", "..", "..", "services", "Booking", "Booking.API"))
        };

        return candidates.FirstOrDefault(Directory.Exists)
            ?? currentDirectory;
    }
}
