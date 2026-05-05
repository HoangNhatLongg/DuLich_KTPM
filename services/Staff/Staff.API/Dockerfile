FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["services/Staff/Staff.API/Staff.API.csproj", "services/Staff/Staff.API/"]
COPY ["services/Staff/Staff.Application/Staff.Application.csproj", "services/Staff/Staff.Application/"]
COPY ["services/Staff/Staff.Domain/Staff.Domain.csproj", "services/Staff/Staff.Domain/"]
COPY ["services/Staff/Staff.Infrastructure/Staff.Infrastructure.csproj", "services/Staff/Staff.Infrastructure/"]
RUN dotnet restore "services/Staff/Staff.API/Staff.API.csproj"

COPY . .
WORKDIR "/src/services/Staff/Staff.API"
RUN dotnet build "Staff.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Staff.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Staff.API.dll"]
