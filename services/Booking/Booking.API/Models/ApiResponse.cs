namespace Booking.API.Models;

public sealed record ApiResponse<T>(bool Success, string Message, T? Data)
{
    public static ApiResponse<T> Ok(T? data, string message = "Request succeeded.")
    {
        return new ApiResponse<T>(true, message, data);
    }

    public static ApiResponse<T> Fail(string message)
    {
        return new ApiResponse<T>(false, message, default);
    }
}
