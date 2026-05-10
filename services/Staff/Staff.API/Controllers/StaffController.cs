using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Staff.API.Models;
using Staff.Application.DTOs;
using Staff.Application.Interfaces;
using Staff.Domain.Enums;

namespace Staff.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllStaff([FromQuery] string? searchKeyword, [FromQuery] StaffStatus? status)
    {
        var staff = await _staffService.GetAllStaffAsync(searchKeyword, status);
        return Ok(ApiResponse<object>.Ok(staff, "Staff list retrieved successfully."));
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStaffById(Guid id)
    {
        var staff = await _staffService.GetStaffByIdAsync(id);
        if (staff == null)
            return NotFound(ApiResponse<object>.Fail($"Staff member with ID '{id}' not found."));

        return Ok(ApiResponse<object>.Ok(staff, "Staff member retrieved successfully."));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffDto dto)
    {
        var staff = await _staffService.CreateStaffAsync(dto);
        return CreatedAtAction(
            nameof(GetStaffById),
            new { id = staff.Id },
            ApiResponse<object>.Ok(staff, "Staff member created successfully."));
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStaff(Guid id, [FromBody] UpdateStaffDto dto)
    {
        var result = await _staffService.UpdateStaffAsync(id, dto);
        if (!result)
            return NotFound(ApiResponse<object>.Fail($"Staff member with ID '{id}' not found."));

        return Ok(ApiResponse<object>.Ok(null, "Staff member updated successfully."));
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStaff(Guid id)
    {
        var result = await _staffService.DeleteStaffAsync(id);
        if (!result)
            return NotFound(ApiResponse<object>.Fail($"Staff member with ID '{id}' not found."));

        return Ok(ApiResponse<object>.Ok(null, "Staff member deleted successfully."));
    }
}
