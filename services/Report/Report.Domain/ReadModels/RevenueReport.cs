using System;

namespace Report.Domain.ReadModels;

public class RevenueReport
{
    public DateTime Date { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalBookings { get; set; }
}
