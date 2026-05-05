using UserService.Application.Common.Exceptions;
using UserService.Application.DTOs.Auth;
using UserService.Application.Interfaces;
using UserService.Domain.Constants;
using UserService.Domain.Entities;
using UserService.Domain.Interfaces;

namespace UserService.Application.Services;

public sealed class AuthService(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ITokenProvider tokenProvider,
    IDateTimeProvider dateTimeProvider) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = User.NormalizeEmail(request.Email);

        if (await userRepository.EmailExistsAsync(normalizedEmail, cancellationToken))
        {
            throw new ConflictException("Email is already registered.");
        }

        var now = dateTimeProvider.UtcNow;
        var user = User.Create(
            normalizedEmail,
            passwordHasher.HashPassword(request.Password),
            ResolveRole(request.Role),
            now);

        var tokens = tokenProvider.GenerateTokens(user);
        user.AddRefreshToken(RefreshToken.Create(user.Id, tokens.RefreshToken, tokens.RefreshTokenExpiresAt, now));

        await userRepository.AddAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);

        return MapAuthResponse(user, tokens);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByEmailAsync(User.NormalizeEmail(request.Email), cancellationToken);

        if (user is null || !passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        var now = dateTimeProvider.UtcNow;
        var tokens = tokenProvider.GenerateTokens(user);
        user.AddRefreshToken(RefreshToken.Create(user.Id, tokens.RefreshToken, tokens.RefreshTokenExpiresAt, now));

        await userRepository.SaveChangesAsync(cancellationToken);

        return MapAuthResponse(user, tokens);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByRefreshTokenAsync(request.RefreshToken, cancellationToken)
            ?? throw new UnauthorizedException("Invalid refresh token.");

        var currentToken = user.GetRefreshToken(request.RefreshToken);
        var now = dateTimeProvider.UtcNow;

        if (currentToken is null || !currentToken.IsActive(now))
        {
            throw new UnauthorizedException("Refresh token is expired or revoked.");
        }

        currentToken.Revoke(now);

        var newTokens = tokenProvider.GenerateTokens(user);
        user.AddRefreshToken(RefreshToken.Create(user.Id, newTokens.RefreshToken, newTokens.RefreshTokenExpiresAt, now));

        await userRepository.SaveChangesAsync(cancellationToken);

        return MapAuthResponse(user, newTokens);
    }

    public async Task RevokeRefreshTokenAsync(RevokeRefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByRefreshTokenAsync(request.RefreshToken, cancellationToken)
            ?? throw new NotFoundException("Refresh token was not found.");

        var token = user.GetRefreshToken(request.RefreshToken)
            ?? throw new NotFoundException("Refresh token was not found.");

        if (!token.IsActive(dateTimeProvider.UtcNow))
        {
            throw new BadRequestException("Refresh token is already expired or revoked.");
        }

        token.Revoke(dateTimeProvider.UtcNow);
        await userRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<UserResponse> GetByIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User was not found.");

        return MapUser(user);
    }

    public async Task<IReadOnlyList<UserResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var users = await userRepository.GetAllAsync(cancellationToken);
        return users.Select(MapUser).ToArray();
    }

    private static string ResolveRole(string? role)
    {
        return string.IsNullOrWhiteSpace(role)
            ? SystemRoles.Customer
            : SystemRoles.IsValid(role)
                ? SystemRoles.Normalize(role)
                : throw new BadRequestException($"Role must be one of: {string.Join(", ", SystemRoles.All)}.");
    }

    private static AuthResponse MapAuthResponse(User user, Domain.Models.TokenResult tokens)
    {
        return new AuthResponse(
            tokens.AccessToken,
            tokens.AccessTokenExpiresAt,
            tokens.RefreshToken,
            tokens.RefreshTokenExpiresAt,
            MapUser(user));
    }

    private static UserResponse MapUser(User user)
    {
        return new UserResponse(user.Id, user.Email, user.Role, user.CreatedAt);
    }
}
