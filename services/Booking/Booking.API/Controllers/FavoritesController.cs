using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Booking.API.Models;
using Booking.Application.DTOs;
using Booking.Application.Interfaces;

namespace Booking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class FavoritesController(IFavoriteTourService favoriteService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<FavoriteTourResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyFavorites(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var favorites = await favoriteService.GetByUserIdAsync(userId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<FavoriteTourResponse>>.Ok(favorites, "Favorites retrieved successfully."));
    }

    [HttpPost("{tourId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<FavoriteTourResponse>), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddFavorite(Guid tourId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var favorite = await favoriteService.AddAsync(userId, tourId, cancellationToken);
        return CreatedAtAction(nameof(GetMyFavorites), ApiResponse<FavoriteTourResponse>.Ok(favorite, "Tour added to favorites."));
    }

    [HttpDelete("{tourId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveFavorite(Guid tourId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await favoriteService.RemoveAsync(userId, tourId, cancellationToken);
        return Ok(ApiResponse<object>.Ok(null, "Tour removed from favorites."));
    }

    [HttpPost("{tourId:guid}/toggle")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleFavorite(Guid tourId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await favoriteService.ToggleAsync(userId, tourId, cancellationToken);
        return Ok(ApiResponse<object>.Ok(null, "Favorite toggled successfully."));
    }

    [HttpGet("{tourId:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckFavoriteStatus(Guid tourId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var isFavorite = await favoriteService.IsFavoriteAsync(userId, tourId, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { isFavorite }, "Favorite status retrieved."));
    }

    private Guid GetCurrentUserId()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User identifier claim is missing.");

        return Guid.Parse(userId);
    }
}
