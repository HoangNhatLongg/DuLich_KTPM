using System;
using Staff.Domain.Enums;

namespace Staff.Domain.Entities;

public class StaffMember
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public StaffPosition Position { get; set; }
    public StaffStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
