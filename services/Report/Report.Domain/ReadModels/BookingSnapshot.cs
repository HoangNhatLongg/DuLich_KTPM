using System;

namespace Report.Domain.ReadModels;

/// <summary>
/// Bảng snapshot lưu từng sự kiện booking/payment nhận từ RabbitMQ.
/// Dùng để tổng hợp báo cáo bằng Dapper SQL.
/// </summary>
public class BookingSnapshot
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Guid TourId { get; set; }
    public string TourName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool IsPaid { get; set; }
    public DateTime CreatedAt { get; set; }
}
