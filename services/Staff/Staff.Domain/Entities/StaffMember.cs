using Staff.Domain.Enums;

namespace Staff.Domain.Entities;

public class StaffMember
{
    // EF Core requires a parameterless constructor (private is fine)
    private StaffMember() { }

    public Guid Id { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public StaffPosition Position { get; private set; }
    public StaffStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }

    /// <summary>Factory method to create a new staff member.</summary>
    public static StaffMember Create(string fullName, string email, string phone, StaffPosition position)
    {
        return new StaffMember
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            Email = email,
            Phone = phone,
            Position = position,
            Status = StaffStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>Updates the mutable profile fields of this staff member.</summary>
    public void UpdateProfile(string fullName, string email, string phone, StaffPosition position)
    {
        FullName = fullName;
        Email = email;
        Phone = phone;
        Position = position;
    }

    /// <summary>Changes the status of this staff member.</summary>
    public void ChangeStatus(StaffStatus newStatus)
    {
        Status = newStatus;
    }
}
