namespace SkinScan.Api.Models;

public sealed class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class Scan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }

    /// <summary>Class code predicted after decision multipliers (akiec, bcc, bkl, df, mel, nv, vasc).</summary>
    public string PredictedCode { get; set; } = "";
    public double Confidence { get; set; }

    /// <summary>Adjusted probabilities in labels.json class order (7 values, sum to 1).</summary>
    public double[] Probabilities { get; set; } = [];

    /// <summary>Optional small JPEG data URL (center-cropped thumbnail) chosen by the user.</summary>
    public string? Thumbnail { get; set; }

    public string? BodySite { get; set; }
    public string? Note { get; set; }
    public string ModelVersion { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
