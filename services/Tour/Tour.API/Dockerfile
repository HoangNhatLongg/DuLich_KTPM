FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["services/Tour/Tour.API/Tour.API.csproj", "services/Tour/Tour.API/"]
COPY ["services/Tour/Tour.Application/Tour.Application.csproj", "services/Tour/Tour.Application/"]
COPY ["services/Tour/Tour.Domain/Tour.Domain.csproj", "services/Tour/Tour.Domain/"]
COPY ["services/Tour/Tour.Infrastructure/Tour.Infrastructure.csproj", "services/Tour/Tour.Infrastructure/"]
COPY ["building-blocks/BuildingBlocks/BuildingBlocks.csproj", "building-blocks/BuildingBlocks/"]

RUN dotnet restore "services/Tour/Tour.API/Tour.API.csproj"

COPY . .
WORKDIR "/src/services/Tour/Tour.API"
RUN dotnet publish "Tour.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Tour.API.dll"]
