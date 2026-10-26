namespace SkinScan.Api.Models;

public enum RiskLevel { Benign, PreCancerous, Malignant, HighMalignant }

public sealed record LesionClass(int Index, string Code, string Name, RiskLevel Risk);

/// <summary>The 7 HAM10000 classes in the exact index order the model outputs them.</summary>
public static class ClassCatalog
{
    public static readonly IReadOnlyList<LesionClass> All =
    [
        new(0, "akiec", "Actinic keratoses", RiskLevel.PreCancerous),
        new(1, "bcc", "Basal cell carcinoma", RiskLevel.Malignant),
        new(2, "bkl", "Benign keratosis-like lesions", RiskLevel.Benign),
        new(3, "df", "Dermatofibroma", RiskLevel.Benign),
        new(4, "mel", "Melanoma", RiskLevel.HighMalignant),
        new(5, "nv", "Melanocytic nevi", RiskLevel.Benign),
        new(6, "vasc", "Vascular lesions", RiskLevel.Benign),
    ];

    public static LesionClass? Find(string code) =>
        All.FirstOrDefault(c => string.Equals(c.Code, code, StringComparison.OrdinalIgnoreCase));

    public static bool NeedsReview(string code) => Find(code)?.Risk is not RiskLevel.Benign;
}
