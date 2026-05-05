using UserService.Application.Common.Exceptions;
using UserService.Application.DTOs.Auth;
using UserService.Application.Services;
using UserService.Domain.Entities;
using UserService.Domain.Interfaces;
using UserService.Domain.Models;

namespace UserService.Tests;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task RegisterAsync_Should_DefaultRoleToCustomer()
    {
        var repository = new InMemoryUserRepository();
        var service = new AuthService(
            repository,
            new FakePasswordHasher(),
            new FakeTokenProvider(),
            new FakeDateTimeProvider());

        var response = await service.RegisterAsync(new RegisterRequest
        {
            Email = "customer@example.com",
            Password = "secret123"
        });

        Assert.Equal("Customer", response.User.Role);
        Assert.Single(repository.Users);
    }

    [Fact]
    public async Task LoginAsync_Should_Throw_WhenPasswordIsInvalid()
    {
        var repository = new InMemoryUserRepository();
        var user = User.Create("admin@example.com", "hashed:right-password", "Admin", DateTime.UtcNow);
        await repository.AddAsync(user);

        var service = new AuthService(
            repository,
            new FakePasswordHasher(),
            new FakeTokenProvider(),
            new FakeDateTimeProvider());

        await Assert.ThrowsAsync<UnauthorizedException>(() => service.LoginAsync(new LoginRequest
        {
            Email = "admin@example.com",
            Password = "wrong-password"
        }));
    }

    private sealed class InMemoryUserRepository : IUserRepository
    {
        public List<User> Users { get; } = [];

        public Task<User?> GetByIdAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(Users.SingleOrDefault(x => x.Id == userId));
        }

        public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(Users.SingleOrDefault(x => x.Email == email));
        }

        public Task<User?> GetByRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(
                Users.SingleOrDefault(x => x.RefreshTokens.Any(token => token.Token == refreshToken)));
        }

        public Task<IReadOnlyList<User>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult((IReadOnlyList<User>)Users);
        }

        public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(Users.Any(x => x.Email == email));
        }

        public Task AddAsync(User user, CancellationToken cancellationToken = default)
        {
            Users.Add(user);
            return Task.CompletedTask;
        }

        public void Update(User user)
        {
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }
    }

    private sealed class FakePasswordHasher : IPasswordHasher
    {
        public string HashPassword(string password)
        {
            return $"hashed:{password}";
        }

        public bool VerifyPassword(string password, string passwordHash)
        {
            return passwordHash == $"hashed:{password}";
        }
    }

    private sealed class FakeTokenProvider : ITokenProvider
    {
        public TokenResult GenerateTokens(User user)
        {
            return new TokenResult(
                "access-token",
                DateTime.UtcNow.AddMinutes(60),
                "refresh-token",
                DateTime.UtcNow.AddDays(7));
        }
    }

    private sealed class FakeDateTimeProvider : IDateTimeProvider
    {
        public DateTime UtcNow => new(2026, 4, 21, 0, 0, 0, DateTimeKind.Utc);
    }
}
