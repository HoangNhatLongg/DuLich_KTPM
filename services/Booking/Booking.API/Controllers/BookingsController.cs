using Microsoft.AspNetCore.Mvc;
using Booking.API.Models;
using Booking.Application.DTOs;
using Booking.Application.Interfaces;

namespace Booking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class BookingsController(IBookingService bookingService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<BookingResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var response = await bookingService.GetAllAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<BookingResponse>>.Ok(response, "Bookings retrieved successfully."));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<BookingResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await bookingService.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<BookingResponse>.Ok(response, "Booking retrieved successfully."));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<BookingResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest request, CancellationToken cancellationToken)
    {
        var response = await bookingService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, ApiResponse<BookingResponse>.Ok(response, "Booking created successfully."));
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<BookingResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateBookingStatusRequest request, CancellationToken cancellationToken)
    {
        var response = await bookingService.UpdateStatusAsync(id, request, cancellationToken);
        return Ok(ApiResponse<BookingResponse>.Ok(response, "Booking status updated successfully."));
    }
}
