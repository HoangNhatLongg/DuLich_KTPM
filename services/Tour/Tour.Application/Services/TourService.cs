using FluentValidation;
using Tour.Application.Common.Exceptions;
using Tour.Application.DTOs;
using Tour.Application.Interfaces;
using Tour.Domain.Entities;
using Tour.Domain.Interfaces;

namespace Tour.Application.Services;

public sealed class TourService(
    ITourRepository tourRepository,
    IValidator<CreateTourRequest> createTourValidator,
    IValidator<UpdateTourRequest> updateTourValidator,
    IValidator<CreateItineraryRequest> createItineraryValidator,
    IValidator<UpdateItineraryRequest> updateItineraryValidator) : ITourService
{
    public async Task<IReadOnlyList<TourSummaryResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        var tours = await tourRepository.GetAllAsync(cancellationToken);

        return tours
            .Select(MapSummary)
            .ToList();
    }

    public async Task<TourDetailResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var tour = await GetTourWithItinerariesAsync(id, cancellationToken);
        return MapDetail(tour);
    }

    public async Task<TourDetailResponse> CreateAsync(CreateTourRequest request, CancellationToken cancellationToken)
    {
        await createTourValidator.ValidateAndThrowAsync(request, cancellationToken);

        var now = DateTime.UtcNow;
        var tour = new Tour.Domain.Entities.Tour(
            Guid.NewGuid(),
            request.Name.Trim(),
            request.Description.Trim(),
            request.Price,
            request.AvailableSlots,
            now);

        foreach (var itineraryRequest in request.Itineraries.OrderBy(x => x.DayNumber))
        {
            var itinerary = new Itinerary(
                Guid.NewGuid(),
                tour.Id,
                itineraryRequest.DayNumber,
                itineraryRequest.Morning?.Trim(),
                itineraryRequest.Noon?.Trim(),
                itineraryRequest.Afternoon?.Trim(),
                itineraryRequest.Evening?.Trim());

            tour.AddItinerary(itinerary);
        }

        await tourRepository.AddAsync(tour, cancellationToken);
        await tourRepository.SaveChangesAsync(cancellationToken);

        return MapDetail(tour);
    }

    public async Task<TourDetailResponse> UpdateAsync(Guid id, UpdateTourRequest request, CancellationToken cancellationToken)
    {
        await updateTourValidator.ValidateAndThrowAsync(request, cancellationToken);

        var tour = await GetTourWithItinerariesAsync(id, cancellationToken);
        tour.Update(
            request.Name.Trim(),
            request.Description.Trim(),
            request.Price,
            request.AvailableSlots,
            DateTime.UtcNow);

        tourRepository.Update(tour);
        await tourRepository.SaveChangesAsync(cancellationToken);

        return MapDetail(tour);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var tour = await GetTourWithItinerariesAsync(id, cancellationToken);
        tourRepository.Remove(tour);
        await tourRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ItineraryResponse>> GetItinerariesAsync(Guid tourId, CancellationToken cancellationToken)
    {
        var tour = await GetTourWithItinerariesAsync(tourId, cancellationToken);
        return tour.Itineraries
            .OrderBy(x => x.DayNumber)
            .Select(MapItinerary)
            .ToList();
    }

    public async Task<ItineraryResponse> AddItineraryAsync(Guid tourId, CreateItineraryRequest request, CancellationToken cancellationToken)
    {
        await createItineraryValidator.ValidateAndThrowAsync(request, cancellationToken);

        var tour = await GetTourWithItinerariesAsync(tourId, cancellationToken);
        await EnsureDayNumberUniqueAsync(tourId, request.DayNumber, null, cancellationToken);

        var itinerary = new Itinerary(Guid.NewGuid(), tourId, request.DayNumber, request.Morning?.Trim(), request.Noon?.Trim(), request.Afternoon?.Trim(), request.Evening?.Trim());
        tour.AddItinerary(itinerary);

        tourRepository.Update(tour);
        await tourRepository.SaveChangesAsync(cancellationToken);

        return MapItinerary(itinerary);
    }

    public async Task<ItineraryResponse> UpdateItineraryAsync(Guid tourId, Guid itineraryId, UpdateItineraryRequest request, CancellationToken cancellationToken)
    {
        await updateItineraryValidator.ValidateAndThrowAsync(request, cancellationToken);

        await GetTourWithItinerariesAsync(tourId, cancellationToken);
        var itinerary = await tourRepository.GetItineraryAsync(tourId, itineraryId, cancellationToken)
            ?? throw new NotFoundException($"Itinerary '{itineraryId}' was not found for tour '{tourId}'.");

        await EnsureDayNumberUniqueAsync(tourId, request.DayNumber, itineraryId, cancellationToken);

        itinerary.Update(request.DayNumber, request.Morning?.Trim(), request.Noon?.Trim(), request.Afternoon?.Trim(), request.Evening?.Trim());
        await tourRepository.SaveChangesAsync(cancellationToken);

        return MapItinerary(itinerary);
    }

    public async Task DeleteItineraryAsync(Guid tourId, Guid itineraryId, CancellationToken cancellationToken)
    {
        var tour = await GetTourWithItinerariesAsync(tourId, cancellationToken);
        var itinerary = tour.Itineraries.FirstOrDefault(x => x.Id == itineraryId)
            ?? throw new NotFoundException($"Itinerary '{itineraryId}' was not found for tour '{tourId}'.");

        tour.RemoveItinerary(itinerary);
        tourRepository.Update(tour);
        await tourRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<SlotAvailabilityResponse> CheckAvailabilityAsync(Guid tourId, int requestedSlots, CancellationToken cancellationToken)
    {
        if (requestedSlots <= 0)
        {
            throw new BadRequestException("Requested slots must be greater than zero.");
        }

        var tour = await GetTourWithItinerariesAsync(tourId, cancellationToken);

        return new SlotAvailabilityResponse(
            tour.Id,
            requestedSlots,
            tour.AvailableSlots,
            tour.AvailableSlots >= requestedSlots);
    }

    private async Task<Tour.Domain.Entities.Tour> GetTourWithItinerariesAsync(Guid id, CancellationToken cancellationToken)
    {
        return await tourRepository.GetByIdWithItinerariesAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Tour '{id}' was not found.");
    }

    private async Task EnsureDayNumberUniqueAsync(Guid tourId, int dayNumber, Guid? itineraryId, CancellationToken cancellationToken)
    {
        var hasConflict = await tourRepository.HasConflictingDayNumberAsync(tourId, dayNumber, itineraryId, cancellationToken);
        if (hasConflict)
        {
            throw new BadRequestException($"Day number '{dayNumber}' already exists for tour '{tourId}'.");
        }
    }

    private static TourSummaryResponse MapSummary(Tour.Domain.Entities.Tour tour)
    {
        return new TourSummaryResponse(
            tour.Id,
            tour.Name,
            tour.Description,
            tour.Price,
            tour.AvailableSlots,
            tour.Itineraries.Count,
            tour.CreatedAtUtc,
            tour.UpdatedAtUtc);
    }

    private static TourDetailResponse MapDetail(Tour.Domain.Entities.Tour tour)
    {
        return new TourDetailResponse(
            tour.Id,
            tour.Name,
            tour.Description,
            tour.Price,
            tour.AvailableSlots,
            tour.Itineraries
                .OrderBy(x => x.DayNumber)
                .Select(MapItinerary)
                .ToList());
    }

    private static ItineraryResponse MapItinerary(Itinerary itinerary)
    {
        return new ItineraryResponse(itinerary.Id, itinerary.DayNumber, itinerary.Morning, itinerary.Noon, itinerary.Afternoon, itinerary.Evening);
    }
}
