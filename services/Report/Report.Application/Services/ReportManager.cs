using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Report.Application.DTOs;
using Report.Application.Interfaces;

namespace Report.Application.Services;

public class ReportManager : IReportService
{
    private readonly IReportRepository _repository;

    public ReportManager(IReportRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<RevenueReportDto>> GetRevenueAsync(DateTime fromDate, DateTime toDate)
    {
        var data = await _repository.GetRevenueReportAsync(fromDate, toDate);
        return data.Select(r => new RevenueReportDto
        {
            Date = r.Date,
            TotalRevenue = r.TotalRevenue,
            TotalBookings = r.TotalBookings
        });
    }

    public async Task<BookingSummaryDto> GetBookingSummaryAsync()
    {
        var total = await _repository.GetTotalBookingsAsync();
        return new BookingSummaryDto { TotalBookings = total };
    }

    public async Task<IEnumerable<TopTourDto>> GetTopToursAsync()
    {
        var data = await _repository.GetTopToursAsync(10);
        return data.Select(t => new TopTourDto
        {
            TourId = t.TourId,
            TourName = t.TourName,
            BookingCount = t.BookingCount
        });
    }
}
