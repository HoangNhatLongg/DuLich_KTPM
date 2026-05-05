FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["services/Report/Report.API/Report.API.csproj", "services/Report/Report.API/"]
COPY ["services/Report/Report.Application/Report.Application.csproj", "services/Report/Report.Application/"]
COPY ["services/Report/Report.Domain/Report.Domain.csproj", "services/Report/Report.Domain/"]
COPY ["services/Report/Report.Infrastructure/Report.Infrastructure.csproj", "services/Report/Report.Infrastructure/"]
RUN dotnet restore "services/Report/Report.API/Report.API.csproj"

COPY . .
WORKDIR "/src/services/Report/Report.API"
RUN dotnet build "Report.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Report.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Report.API.dll"]
