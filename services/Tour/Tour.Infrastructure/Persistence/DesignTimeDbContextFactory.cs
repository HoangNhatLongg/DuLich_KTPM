using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Tour.Infrastructure.Persistence;

public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<TourDbContext>
{
    public TourDbContext CreateDbContext(string[] args)
    {
        var apiProjectPath = ResolveApiProjectPath();

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiProjectPath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("PostgreSQL")
            ?? "Host=localhost;Port=5432;Database=TourServiceDb;Username=postgres;Password=123456";

        var optionsBuilder = new DbContextOptionsBuilder<TourDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new TourDbContext(optionsBuilder.Options);
    }

    private static string ResolveApiProjectPath()
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        var appBaseDirectory = AppContext.BaseDirectory;

        var candidates = new[]
        {
            Path.GetFullPath(Path.Combine(currentDirectory, "..", "Tour.API")),
            Path.GetFullPath(Path.Combine(currentDirectory, "services", "Tour", "Tour.API")),
            Path.GetFullPath(Path.Combine(appBaseDirectory, "..", "..", "..", "..", "Tour.API")),
            Path.GetFullPath(Path.Combine(appBaseDirectory, "..", "..", "..", "..", "..", "services", "Tour", "Tour.API"))
        };

        return candidates.FirstOrDefault(Directory.Exists)
            ?? currentDirectory;
    }
}
