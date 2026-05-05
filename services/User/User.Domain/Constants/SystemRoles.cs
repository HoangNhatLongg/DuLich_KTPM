namespace UserService.Domain.Constants;

public static class SystemRoles
{
    public const string Admin = "Admin";
    public const string Staff = "Staff";
    public const string Customer = "Customer";

    public static readonly string[] All = [Admin, Staff, Customer];

    public static bool IsValid(string? role)
    {
        return role is not null && All.Contains(role, StringComparer.OrdinalIgnoreCase);
    }

    public static string Normalize(string? role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return Customer;
        }

        return All.FirstOrDefault(value => value.Equals(role, StringComparison.OrdinalIgnoreCase))
            ?? Customer;
    }
}
