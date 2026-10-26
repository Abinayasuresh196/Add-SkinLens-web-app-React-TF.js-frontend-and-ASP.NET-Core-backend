using System.Security.Claims;
using SkinScan.Api.Data;
using SkinScan.Api.Models;

namespace SkinScan.Api.Endpoints;

public static class ScanEndpoints
{
    private const int MaxThumbnailChars = 120_000; // ~90 KB image; the frontend sends ~10 KB

    public static void MapScanEndpoints(this IEndpointRouteBuilder app)
    {
        var scans = app.MapGroup("/api/scans").WithTags("Scans").RequireAuthorization();

        scans.MapGet("/", async (ClaimsPrincipal user, IAppStore store) =>
            Results.Ok((await store.ListScansAsync(user.UserId())).Select(ScanResponse.From)));

        scans.MapGet("/stats", async (ClaimsPrincipal user, IAppStore store) =>
        {
            var list = await store.ListScansAsync(user.UserId());
            var byClass = ClassCatalog.All.ToDictionary(c => c.Code, c => list.Count(s => s.PredictedCode == c.Code));
            return Results.Ok(new ScanStats(list.Count, list.Count(s => ClassCatalog.NeedsReview(s.PredictedCode)),
                byClass, list.FirstOrDefault()?.CreatedAt));
        });

        scans.MapGet("/{id:guid}", async (Guid id, ClaimsPrincipal user, IAppStore store) =>
            await store.GetScanAsync(user.UserId(), id) is { } scan
                ? Results.Ok(ScanResponse.From(scan))
                : Results.Problem("Scan not found.", statusCode: StatusCodes.Status404NotFound));

        scans.MapPost("/", async (CreateScanRequest req, ClaimsPrincipal user, IAppStore store) =>
        {
            var errors = Validate(req);
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var scan = new Scan
            {
                UserId = user.UserId(),
                PredictedCode = req.PredictedCode.ToLowerInvariant(),
                Confidence = req.Confidence,
                Probabilities = req.Probabilities,
                Thumbnail = string.IsNullOrWhiteSpace(req.Thumbnail) ? null : req.Thumbnail,
                BodySite = Clean(req.BodySite),
                Note = Clean(req.Note),
                ModelVersion = Clean(req.ModelVersion) ?? "efficientnetb3-ham10000",
            };
            await store.AddScanAsync(scan);
            return Results.Created($"/api/scans/{scan.Id}", ScanResponse.From(scan));
        });

        scans.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal user, IAppStore store) =>
            await store.DeleteScanAsync(user.UserId(), id)
                ? Results.NoContent()
                : Results.Problem("Scan not found.", statusCode: StatusCodes.Status404NotFound));
    }

    private static Dictionary<string, string[]> Validate(CreateScanRequest req)
    {
        var errors = new Dictionary<string, string[]>();
        var cls = ClassCatalog.Find(req.PredictedCode ?? "");
        var p = req.Probabilities ?? [];

        if (cls is null) errors["predictedCode"] = ["Unknown class code."];

        if (p.Length != ClassCatalog.All.Count || p.Any(v => double.IsNaN(v) || v < 0 || v > 1))
            errors["probabilities"] = ["Send 7 probabilities between 0 and 1 in labels.json order."];
        else if (Math.Abs(p.Sum() - 1) > 0.02)
            errors["probabilities"] = ["Probabilities must add up to 1."];
        else if (cls is not null && Array.IndexOf(p, p.Max()) != cls.Index)
            errors["predictedCode"] = ["Predicted class must be the highest probability."];

        if (req.Confidence is < 0 or > 1 || double.IsNaN(req.Confidence))
            errors["confidence"] = ["Confidence must be between 0 and 1."];

        if (req.Thumbnail is { Length: > 0 } t &&
            (t.Length > MaxThumbnailChars || !(t.StartsWith("data:image/jpeg;base64,") || t.StartsWith("data:image/png;base64,"))))
            errors["thumbnail"] = ["Thumbnail must be a JPEG or PNG data URL under 90 KB."];

        if (req.BodySite?.Length > 60) errors["bodySite"] = ["Keep body site under 60 characters."];
        if (req.Note?.Length > 500) errors["note"] = ["Keep the note under 500 characters."];
        return errors;
    }

    private static string? Clean(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();
}
