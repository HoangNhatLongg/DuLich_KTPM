using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Booking.Application.Interfaces;
using Booking.Application.Services;

namespace Booking.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IFavoriteTourService, FavoriteTourService>();

        return services;
    }
}
