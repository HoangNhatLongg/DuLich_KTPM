namespace UserService.Application.DTOs.Auth;

public sealed record UserResponse(
    Guid Id,
    string Email,
    string Role,
    DateTime CreatedAt);
