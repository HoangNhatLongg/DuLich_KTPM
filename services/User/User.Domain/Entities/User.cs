using UserService.Domain.Constants;

namespace UserService.Domain.Entities;

public class User
{
    private readonly List<RefreshToken> _refreshTokens = [];

    private User()
    {
    }

    private User(Guid id, string email, string passwordHash, string role, DateTime createdAt)
    {
        Id = id;
        Email = email;
        PasswordHash = passwordHash;
        Role = role;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string Role { get; private set; } = SystemRoles.Customer;
    public DateTime CreatedAt { get; private set; }
    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();

    public static User Create(string email, string passwordHash, string role, DateTime createdAt)
    {
        return new User(
            Guid.NewGuid(),
            NormalizeEmail(email),
            passwordHash,
            SystemRoles.Normalize(role),
            createdAt);
    }

    public void AddRefreshToken(RefreshToken refreshToken)
    {
        _refreshTokens.Add(refreshToken);
    }

    public RefreshToken? GetRefreshToken(string token)
    {
        return _refreshTokens.SingleOrDefault(x => x.Token == token);
    }

    public static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}
