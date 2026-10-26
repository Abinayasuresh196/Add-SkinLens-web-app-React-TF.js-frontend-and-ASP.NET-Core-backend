using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using SkinScan.Api.Data;
using SkinScan.Api.Endpoints;
using SkinScan.Api.Models;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;
var dataDir = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, config["Storage:DataDirectory"] ?? "data"));

// Storage (JSON file by default - swap for EF Core later via IAppStore)
builder.Services.AddSingleton<IAppStore>(_ => new JsonFileStore(Path.Combine(dataDir, "skinscan-db.json")));
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();

// Keep token-signing keys on disk so sign-ins survive restarts
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(dataDir, "keys")))
    .SetApplicationName("SkinScan");

// Built-in bearer tokens (no JWT package needed)
builder.Services.AddAuthentication(BearerTokenDefaults.AuthenticationScheme)
    .AddBearerToken(o => o.BearerTokenExpiration = TimeSpan.FromDays(7));
builder.Services.AddAuthorization();

// Slow down password guessing: 10 auth requests per minute per IP
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("auth", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
});

var origins = config.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.PropertyNameCaseInsensitive = true);

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Serve the built React app from wwwroot (single deployment). Model files live in wwwroot/model.
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapMetaEndpoints(config, app.Environment);
app.MapAuthEndpoints();
app.MapScanEndpoints();

// Unknown /api routes -> 404 JSON; everything else -> React router
app.MapFallback("/api/{**path}", () => Results.Problem("Endpoint not found.", statusCode: StatusCodes.Status404NotFound));
if (File.Exists(Path.Combine(app.Environment.WebRootPath ?? "wwwroot", "index.html")))
    app.MapFallbackToFile("index.html");

app.Run();
