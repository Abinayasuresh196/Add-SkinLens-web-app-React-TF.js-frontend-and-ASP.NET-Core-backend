using SkinScan.Api.Models;

namespace SkinScan.Api.Endpoints;

public static class MetaEndpoints
{
    public static void MapMetaEndpoints(this IEndpointRouteBuilder app, IConfiguration config, IWebHostEnvironment env)
    {
        var meta = app.MapGroup("/api").WithTags("Meta");

        meta.MapGet("/health", () => Results.Ok(new { status = "ok", time = DateTimeOffset.UtcNow }));

        // Returns labels.json (classes, multipliers, metrics) so any client can read model details.
        meta.MapGet("/model-info", () =>
        {
            // Dev: repo-root labels.json. Published: the copy bundled in wwwroot/model.
            var path = new[]
                {
                    Path.Combine(env.ContentRootPath, config["Model:LabelsPath"] ?? "labels.json"),
                    Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "model", "labels.json"),
                }
                .Select(Path.GetFullPath)
                .FirstOrDefault(File.Exists);

            return path is not null
                ? Results.File(path, "application/json")
                : Results.Ok(new { classes = ClassCatalog.All });
        });
    }
}
