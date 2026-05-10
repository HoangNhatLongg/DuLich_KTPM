using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Report.API.Middleware;
using Report.Application.Interfaces;
using Report.Application.Services;
using Report.Infrastructure.Consumers;
using Report.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});
builder.Services.AddEndpointsApiExplorer();

// Swagger with JWT
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Report.API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// DI - Repository using Dapper (pass connection string directly)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
builder.Services.AddScoped<IReportRepository>(_ => new ReportRepository(connectionString));
builder.Services.AddScoped<IReportService, ReportManager>();

// RabbitMQ Consumer (Background Service)
builder.Services.AddHostedService<ReportEventConsumer>();

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"] ?? ""))
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

// Seed / Init table (idempotent)
await EnsureTableCreatedAsync(connectionString);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

// -----------------------------------------------
// Helper: create table if not exists (Dapper / raw SQL)
// -----------------------------------------------
static async Task EnsureTableCreatedAsync(string connectionString)
{
    const string sql = """
        CREATE TABLE IF NOT EXISTS "BookingSnapshots" (
            "Id"            UUID        PRIMARY KEY,
            "BookingId"     UUID        NOT NULL UNIQUE,
            "TourId"        UUID        NOT NULL,
            "TourName"      VARCHAR(255) NOT NULL,
            "CustomerEmail" VARCHAR(255) NOT NULL,
            "Amount"        DECIMAL(18,2) NOT NULL,
            "IsPaid"        BOOLEAN     NOT NULL DEFAULT false,
            "CreatedAt"     TIMESTAMP   NOT NULL
        );
        """;

    using var conn = new Npgsql.NpgsqlConnection(connectionString);
    await conn.OpenAsync();
    using var cmd = conn.CreateCommand();
    cmd.CommandText = sql;
    await cmd.ExecuteNonQueryAsync();
}
