using Microsoft.AspNetCore.Mvc;
using Tour.API.Models;
using Tour.Application.DTOs;
using Tour.Application.Interfaces;

namespace Tour.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ToursController(ITourService tourService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<TourSummaryResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var response = await tourService.GetAllAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<TourSummaryResponse>>.Ok(response, "Tours retrieved successfully."));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<TourDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await tourService.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<TourDetailResponse>.Ok(response, "Tour retrieved successfully."));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<TourDetailResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateTourRequest request, CancellationToken cancellationToken)
    {
        var response = await tourService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, ApiResponse<TourDetailResponse>.Ok(response, "Tour created successfully."));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<TourDetailResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTourRequest request, CancellationToken cancellationToken)
    {
        var response = await tourService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<TourDetailResponse>.Ok(response, "Tour updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await tourService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse<object>.Ok(null, "Tour deleted successfully."));
    }

    [HttpGet("{id:guid}/itineraries")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ItineraryResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetItineraries(Guid id, CancellationToken cancellationToken)
    {
        var response = await tourService.GetItinerariesAsync(id, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ItineraryResponse>>.Ok(response, "Itineraries retrieved successfully."));
    }

    [HttpPost("{id:guid}/itineraries")]
    [ProducesResponseType(typeof(ApiResponse<ItineraryResponse>), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddItinerary(Guid id, [FromBody] CreateItineraryRequest request, CancellationToken cancellationToken)
    {
        var response = await tourService.AddItineraryAsync(id, request, cancellationToken);
        return CreatedAtAction(nameof(GetItineraries), new { id }, ApiResponse<ItineraryResponse>.Ok(response, "Itinerary created successfully."));
    }

    [HttpPut("{tourId:guid}/itineraries/{itineraryId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ItineraryResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateItinerary(Guid tourId, Guid itineraryId, [FromBody] UpdateItineraryRequest request, CancellationToken cancellationToken)
    {
        var response = await tourService.UpdateItineraryAsync(tourId, itineraryId, request, cancellationToken);
        return Ok(ApiResponse<ItineraryResponse>.Ok(response, "Itinerary updated successfully."));
    }

    [HttpDelete("{tourId:guid}/itineraries/{itineraryId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteItinerary(Guid tourId, Guid itineraryId, CancellationToken cancellationToken)
    {
        await tourService.DeleteItineraryAsync(tourId, itineraryId, cancellationToken);
        return Ok(ApiResponse<object>.Ok(null, "Itinerary deleted successfully."));
    }

    [HttpGet("{id:guid}/slots/availability")]
    [ProducesResponseType(typeof(ApiResponse<SlotAvailabilityResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckAvailability(Guid id, [FromQuery] int requestedSlots, CancellationToken cancellationToken)
    {
        var response = await tourService.CheckAvailabilityAsync(id, requestedSlots, cancellationToken);
        return Ok(ApiResponse<SlotAvailabilityResponse>.Ok(response, "Slot availability checked successfully."));
    }
}
