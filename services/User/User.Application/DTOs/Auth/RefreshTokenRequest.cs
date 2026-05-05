using System.ComponentModel.DataAnnotations;

namespace UserService.Application.DTOs.Auth;

public sealed class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; init; } = string.Empty;
}
