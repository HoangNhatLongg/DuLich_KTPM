using System;

namespace Report.Domain.ReadModels;

public class TopTourReport
{
    public Guid TourId { get; set; }
    public string TourName { get; set; } = string.Empty;
    public int BookingCount { get; set; }
}
