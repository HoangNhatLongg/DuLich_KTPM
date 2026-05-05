using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace UserService.Infrastructure.Persistence;

public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<UserDbContext>
{
    public UserDbContext CreateDbContext(string[] args)
    {
        var apiProjectPath = ResolveApiProjectPath();

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiProjectPath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("PostgreSQL")
            ?? "Host=localhost;Port=5432;Database=UserServiceDb;Username=postgres;Password=123456";

        var optionsBuilder = new DbContextOptionsBuilder<UserDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new UserDbContext(optionsBuilder.Options);
    }

    private static string ResolveApiProjectPath()
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        var appBaseDirectory = AppContext.BaseDirectory;

        var candidates = new[]
        {
            Path.GetFullPath(Path.Combine(currentDirectory, "..", "User.API")),
            Path.GetFullPath(Path.Combine(currentDirectory, "services", "User", "User.API")),
            Path.GetFullPath(Path.Combine(appBaseDirectory, "..", "..", "..", "..", "User.API")),
            Path.GetFullPath(Path.Combine(appBaseDirectory, "..", "..", "..", "..", "..", "services", "User", "User.API"))
        };

        return candidates.FirstOrDefault(Directory.Exists)
            ?? currentDirectory;
    }
}
