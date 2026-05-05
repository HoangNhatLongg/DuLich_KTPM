namespace Booking.Application.Common.Exceptions;

public sealed class DependencyUnavailableException(string message) : AppException(message);
