using System.Net.Mail;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Identity;
using SkinScan.Api.Data;
using SkinScan.Api.Models;

namespace SkinScan.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/auth").WithTags("Auth");

        auth.MapPost("/register", async (RegisterRequest req, IAppStore store, IPasswordHasher<User> hasher) =>
        {
            var errors = new Dictionary<string, string[]>();
            var name = req.Name?.Trim() ?? "";
            var email = req.Email?.Trim().ToLowerInvariant() ?? "";

            if (name.Length is < 2 or > 60) errors["name"] = ["Enter a name between 2 and 60 characters."];
            if (!IsValidEmail(email)) errors["email"] = ["Enter a valid email address."];
            if ((req.Password ?? "").Length < 8) errors["password"] = ["Use at least 8 characters."];
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var user = new User { Name = name, Email = email };
            user.PasswordHash = hasher.HashPassword(user, req.Password!);

            if (!await store.TryAddUserAsync(user))
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["email"] = ["An account with this email already exists. Sign in instead."]
                });

            return SignIn(user);
        }).RequireRateLimiting("auth");

        auth.MapPost("/login", async (LoginRequest req, IAppStore store, IPasswordHasher<User> hasher) =>
        {
            var user = await store.FindUserByEmailAsync(req.Email?.Trim() ?? "");
            if (user is null ||
                hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password ?? "") == PasswordVerificationResult.Failed)
            {
                return Results.Problem("Email or password is incorrect.", statusCode: StatusCodes.Status401Unauthorized);
            }
            return SignIn(user);
        }).RequireRateLimiting("auth");

        auth.MapGet("/me", async (ClaimsPrincipal principal, IAppStore store) =>
        {
            var user = await store.GetUserAsync(principal.UserId());
            return user is null
                ? Results.Unauthorized()
                : Results.Ok(new UserResponse(user.Id, user.Name, user.Email, user.CreatedAt));
        }).RequireAuthorization();
    }

    /// <summary>Issues a bearer token. Response body: { tokenType, accessToken, expiresIn, refreshToken }.</summary>
    private static IResult SignIn(User user)
    {
        var identity = new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
        ], BearerTokenDefaults.AuthenticationScheme);

        return Results.SignIn(new ClaimsPrincipal(identity), authenticationScheme: BearerTokenDefaults.AuthenticationScheme);
    }

    private static bool IsValidEmail(string email) =>
        email.Length <= 120 && MailAddress.TryCreate(email, out var addr) && addr.Address == email;

    public static Guid UserId(this ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : Guid.Empty;
}
