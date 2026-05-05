using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Tour.Application.Interfaces;
using Tour.Application.Services;

namespace Tour.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddScoped<ITourService, TourService>();

        return services;
    }
}
