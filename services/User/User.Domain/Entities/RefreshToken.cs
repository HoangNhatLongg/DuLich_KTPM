namespace UserService.Domain.Entities;

public class RefreshToken
{
    private RefreshToken()
    {
    }

    private RefreshToken(Guid id, Guid userId, string token, DateTime expiresAt, DateTime createdAt)
    {
        Id = id;
        UserId = userId;
        Token = token;
        ExpiresAt = expiresAt;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Token { get; private set; } = string.Empty;
    public DateTime ExpiresAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public User? User { get; private set; }

    public bool IsActive(DateTime nowUtc)
    {
        return RevokedAt is null && ExpiresAt > nowUtc;
    }

    public void Revoke(DateTime revokedAt)
    {
        RevokedAt = revokedAt;
    }

    public static RefreshToken Create(Guid userId, string token, DateTime expiresAt, DateTime createdAt)
    {
        return new RefreshToken(Guid.NewGuid(), userId, token, expiresAt, createdAt);
    }
}
