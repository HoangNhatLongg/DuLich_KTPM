using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Report.Domain.ReadModels;

namespace Report.Application.Interfaces;

public interface IReportRepository
{
    Task<IEnumerable<RevenueReport>> GetRevenueReportAsync(DateTime fromDate, DateTime toDate);
    Task<int> GetTotalBookingsAsync();
    Task<IEnumerable<TopTourReport>> GetTopToursAsync(int topN = 10);
    Task SaveBookingSnapshotAsync(BookingSnapshot snapshot);
    Task MarkSnapshotAsPaidAsync(Guid bookingId);
}
