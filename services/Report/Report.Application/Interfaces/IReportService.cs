using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Report.Application.DTOs;

namespace Report.Application.Interfaces;

public interface IReportService
{
    Task<IEnumerable<RevenueReportDto>> GetRevenueAsync(DateTime fromDate, DateTime toDate);
    Task<BookingSummaryDto> GetBookingSummaryAsync();
    Task<IEnumerable<TopTourDto>> GetTopToursAsync();
}
