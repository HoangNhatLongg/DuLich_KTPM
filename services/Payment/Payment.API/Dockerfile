# Use the official .NET ASP.NET runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Use the official .NET SDK image for build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["services/Payment/Payment.API/Payment.API.csproj", "services/Payment/Payment.API/"]
COPY ["services/Payment/Payment.Application/Payment.Application.csproj", "services/Payment/Payment.Application/"]
COPY ["services/Payment/Payment.Domain/Payment.Domain.csproj", "services/Payment/Payment.Domain/"]
COPY ["services/Payment/Payment.Infrastructure/Payment.Infrastructure.csproj", "services/Payment/Payment.Infrastructure/"]
COPY ["building-blocks/BuildingBlocks/BuildingBlocks.csproj", "building-blocks/BuildingBlocks/"]
RUN dotnet restore "services/Payment/Payment.API/Payment.API.csproj"

# Copy everything else and build an app
COPY . .
WORKDIR "/src/services/Payment/Payment.API"
RUN dotnet build "Payment.API.csproj" -c Release -o /app/build

# Publish the app
FROM build AS publish
RUN dotnet publish "Payment.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage/image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Payment.API.dll"]
