using System.Net;
using System.Text.Json;
using Booking.Application.Common.Exceptions;
using Booking.Application.DTOs;
using Booking.Application.Interfaces;

namespace Booking.Infrastructure.Http;

public sealed class TourAvailabilityClient(HttpClient httpClient) : ITourAvailabilityClient
{
    private static readonly JsonSerializerOptions JsonSerializerOptions = new(JsonSerializerDefaults.Web);

    public async Task<TourSlotAvailabilityResponse> CheckAvailabilityAsync(Guid tourId, int requestedSlots, CancellationToken cancellationToken)
    {
        using var response = await httpClient.GetAsync($"/api/tours/{tourId}/slots/availability?requestedSlots={requestedSlots}", cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            throw new NotFoundException($"Tour '{tourId}' was not found.");
        }

        response.EnsureSuccessStatusCode();

        await using var contentStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var envelope = await JsonSerializer.DeserializeAsync<TourApiResponse<TourSlotAvailabilityResponse>>(contentStream, JsonSerializerOptions, cancellationToken);

        if (envelope?.Data is null)
        {
            throw new InvalidOperationException("TourService returned an invalid slot availability response.");
        }

        return envelope.Data;
    }

    private sealed record TourApiResponse<T>(bool Success, string Message, T? Data);
}
