using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Polly;
using Polly.Extensions.Http;
using Booking.Application.Interfaces;
using Booking.Domain.Interfaces;
using Booking.Infrastructure.Http;
using Booking.Infrastructure.Messaging;
using Booking.Infrastructure.Options;
using Booking.Infrastructure.Persistence;
using Booking.Infrastructure.Repositories;

namespace Booking.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<TourServiceOptions>(configuration.GetSection(TourServiceOptions.SectionName));
        services.Configure<RabbitMqOptions>(configuration.GetSection(RabbitMqOptions.SectionName));

        services.AddDbContext<BookingDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("PostgreSQL")));

        services.AddHttpClient<ITourAvailabilityClient, TourAvailabilityClient>((serviceProvider, client) =>
            {
                var options = serviceProvider.GetRequiredService<IOptions<TourServiceOptions>>().Value;
                client.BaseAddress = new Uri(options.BaseUrl);
                client.Timeout = TimeSpan.FromSeconds(10);
            })
            .AddPolicyHandler(GetHttpRetryPolicy());

        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<IBookingEventPublisher, RabbitMqBookingEventPublisher>();
        services.AddHostedService<PaymentCompletedConsumerService>();

        return services;
    }

    private static IAsyncPolicy<HttpResponseMessage> GetHttpRetryPolicy()
    {
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .OrResult(response => response.StatusCode == HttpStatusCode.RequestTimeout)
            .WaitAndRetryAsync(
                3,
                retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
    }
}
