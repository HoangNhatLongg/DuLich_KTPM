using System;

namespace Report.Application.DTOs;

public class RevenueReportDto
{
    public DateTime Date { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalBookings { get; set; }
}
