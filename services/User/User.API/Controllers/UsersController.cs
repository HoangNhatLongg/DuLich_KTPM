using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.API.Models;
using UserService.Application.DTOs.Auth;
using UserService.Application.Interfaces;
using UserService.Domain.Constants;

namespace UserService.API.Controllers;

[ApiController]
[Authorize(Roles = SystemRoles.Admin)]
[Route("api/[controller]")]
public sealed class UsersController(IAuthService authService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<UserResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var users = await authService.GetAllAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<UserResponse>>.Ok(users, "Users loaded successfully."));
    }
}
