using System.ComponentModel.DataAnnotations;

namespace UserService.Application.DTOs.Auth;

public sealed class RevokeRefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; init; } = string.Empty;
}
