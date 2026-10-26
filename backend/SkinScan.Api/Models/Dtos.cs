namespace SkinScan.Api.Models;

public sealed record RegisterRequest(string Name, string Email, string Password);
public sealed record LoginRequest(string Email, string Password);
public sealed record UserResponse(Guid Id, string Name, string Email, DateTimeOffset CreatedAt);

public sealed record CreateScanRequest(
    string PredictedCode,
    double Confidence,
    double[] Probabilities,
    string? Thumbnail,
    string? BodySite,
    string? Note,
    string? ModelVersion);

public sealed record ScanResponse(
    Guid Id,
    string PredictedCode,
    string PredictedName,
    string Risk,
    bool NeedsReview,
    double Confidence,
    double[] Probabilities,
    string? Thumbnail,
    string? BodySite,
    string? Note,
    string ModelVersion,
    DateTimeOffset CreatedAt)
{
    public static ScanResponse From(Scan s)
    {
        var c = ClassCatalog.Find(s.PredictedCode);
        return new(s.Id, s.PredictedCode, c?.Name ?? s.PredictedCode, c?.Risk.ToString() ?? "Unknown",
            ClassCatalog.NeedsReview(s.PredictedCode), s.Confidence, s.Probabilities, s.Thumbnail,
            s.BodySite, s.Note, s.ModelVersion, s.CreatedAt);
    }
}

public sealed record ScanStats(int Total, int NeedsReview, IReadOnlyDictionary<string, int> ByClass, DateTimeOffset? LastScanAt);
