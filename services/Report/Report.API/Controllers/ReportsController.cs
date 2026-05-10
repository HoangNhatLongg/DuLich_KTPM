using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Report.API.Models;
using Report.Application.Interfaces;

namespace Report.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Thống kê doanh thu theo khoảng thời gian
    /// </summary>
    [HttpGet("revenue")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetRevenue(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate)
    {
        if (fromDate > toDate)
            return BadRequest(ApiResponse<object>.Fail("fromDate must be before toDate."));

        var data = await _reportService.GetRevenueAsync(fromDate, toDate);
        return Ok(ApiResponse<object>.Ok(data, "Revenue data retrieved successfully."));
    }

    /// <summary>
    /// Tổng số booking trong hệ thống
    /// </summary>
    [HttpGet("bookings")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBookingSummary()
    {
        var summary = await _reportService.GetBookingSummaryAsync();
        return Ok(ApiResponse<object>.Ok(summary, "Booking summary retrieved successfully."));
    }

    /// <summary>
    /// Top 10 tour được đặt nhiều nhất
    /// </summary>
    [HttpGet("top-tours")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopTours()
    {
        var tours = await _reportService.GetTopToursAsync();
        return Ok(ApiResponse<object>.Ok(tours, "Top tours retrieved successfully."));
    }
}
