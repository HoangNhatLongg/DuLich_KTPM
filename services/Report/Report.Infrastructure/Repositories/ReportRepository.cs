using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using Npgsql;
using Report.Application.Interfaces;
using Report.Domain.ReadModels;

namespace Report.Infrastructure.Repositories;

public class ReportRepository : IReportRepository
{
    private readonly string _connectionString;

    public ReportRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    private IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    public async Task<IEnumerable<RevenueReport>> GetRevenueReportAsync(DateTime fromDate, DateTime toDate)
    {
        const string sql = """
            SELECT 
                DATE_TRUNC('day', "CreatedAt") AS "Date",
                SUM("Amount") AS "TotalRevenue",
                COUNT(*) AS "TotalBookings"
            FROM "BookingSnapshots"
            WHERE "IsPaid" = true
              AND "CreatedAt" >= @FromDate
              AND "CreatedAt" <= @ToDate
            GROUP BY DATE_TRUNC('day', "CreatedAt")
            ORDER BY "Date";
            """;

        using var conn = CreateConnection();
        return await conn.QueryAsync<RevenueReport>(sql, new { FromDate = fromDate, ToDate = toDate });
    }

    public async Task<int> GetTotalBookingsAsync()
    {
        const string sql = """SELECT COUNT(*) FROM "BookingSnapshots";""";
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(sql);
    }

    public async Task<IEnumerable<TopTourReport>> GetTopToursAsync(int topN = 10)
    {
        const string sql = """
            SELECT 
                "TourId",
                "TourName",
                COUNT(*) AS "BookingCount"
            FROM "BookingSnapshots"
            GROUP BY "TourId", "TourName"
            ORDER BY "BookingCount" DESC
            LIMIT @TopN;
            """;

        using var conn = CreateConnection();
        return await conn.QueryAsync<TopTourReport>(sql, new { TopN = topN });
    }

    public async Task SaveBookingSnapshotAsync(BookingSnapshot snapshot)
    {
        const string sql = """
            INSERT INTO "BookingSnapshots" 
                ("Id", "BookingId", "TourId", "TourName", "CustomerEmail", "Amount", "IsPaid", "CreatedAt")
            VALUES 
                (@Id, @BookingId, @TourId, @TourName, @CustomerEmail, @Amount, @IsPaid, @CreatedAt)
            ON CONFLICT ("BookingId") DO NOTHING;
            """;

        using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, snapshot);
    }

    public async Task MarkSnapshotAsPaidAsync(Guid bookingId)
    {
        const string sql = """
            UPDATE "BookingSnapshots" 
            SET "IsPaid" = true 
            WHERE "BookingId" = @BookingId;
            """;

        using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, new { BookingId = bookingId });
    }
}
