using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    public async Task<IActionResult> GetRevenue(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate)
    {
        if (fromDate > toDate)
            return BadRequest(new { Message = "fromDate must be before toDate." });

        var data = await _reportService.GetRevenueAsync(fromDate, toDate);
        return Ok(data);
    }

    /// <summary>
    /// Tổng số booking trong hệ thống
    /// </summary>
    [HttpGet("bookings")]
    public async Task<IActionResult> GetBookingSummary()
    {
        var summary = await _reportService.GetBookingSummaryAsync();
        return Ok(summary);
    }

    /// <summary>
    /// Top 10 tour được đặt nhiều nhất
    /// </summary>
    [HttpGet("top-tours")]
    public async Task<IActionResult> GetTopTours()
    {
        var tours = await _reportService.GetTopToursAsync();
        return Ok(tours);
    }
}
