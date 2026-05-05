namespace UserService.Application.Common.Exceptions;

public sealed class BadRequestException(string message) : AppException(message);
