using Staff.Domain.Enums;

namespace Staff.Application.DTOs;

public class CreateStaffDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public StaffPosition Position { get; set; }
}
