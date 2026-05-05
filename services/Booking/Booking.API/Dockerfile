FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["services/Booking/Booking.API/Booking.API.csproj", "services/Booking/Booking.API/"]
COPY ["services/Booking/Booking.Application/Booking.Application.csproj", "services/Booking/Booking.Application/"]
COPY ["services/Booking/Booking.Domain/Booking.Domain.csproj", "services/Booking/Booking.Domain/"]
COPY ["services/Booking/Booking.Infrastructure/Booking.Infrastructure.csproj", "services/Booking/Booking.Infrastructure/"]
COPY ["building-blocks/BuildingBlocks/BuildingBlocks.csproj", "building-blocks/BuildingBlocks/"]

RUN dotnet restore "services/Booking/Booking.API/Booking.API.csproj"

COPY . .
WORKDIR "/src/services/Booking/Booking.API"
RUN dotnet publish "Booking.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Booking.API.dll"]
