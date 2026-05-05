namespace UserService.Domain.Interfaces;

public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}
