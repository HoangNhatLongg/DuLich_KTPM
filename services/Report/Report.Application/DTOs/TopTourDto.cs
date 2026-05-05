using System;

namespace Report.Application.DTOs;

public class TopTourDto
{
    public Guid TourId { get; set; }
    public string TourName { get; set; } = string.Empty;
    public int BookingCount { get; set; }
}
