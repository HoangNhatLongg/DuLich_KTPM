FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["services/User/User.API/User.API.csproj", "services/User/User.API/"]
COPY ["services/User/User.Application/User.Application.csproj", "services/User/User.Application/"]
COPY ["services/User/User.Domain/User.Domain.csproj", "services/User/User.Domain/"]
COPY ["services/User/User.Infrastructure/User.Infrastructure.csproj", "services/User/User.Infrastructure/"]

RUN dotnet restore "services/User/User.API/User.API.csproj"

COPY . .
WORKDIR "/src/services/User/User.API"
RUN dotnet publish "User.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "UserService.API.dll"]
