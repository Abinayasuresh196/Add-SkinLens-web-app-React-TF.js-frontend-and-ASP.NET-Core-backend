using SkinScan.Api.Models;

namespace SkinScan.Api.Data;

/// <summary>
/// Storage abstraction. The default implementation is a JSON file (zero setup).
/// Swap in an EF Core / SQL Server implementation later without touching the endpoints.
/// </summary>
public interface IAppStore
{
    Task<User?> FindUserByEmailAsync(string email);
    Task<User?> GetUserAsync(Guid id);
    Task<bool> TryAddUserAsync(User user);

    Task<IReadOnlyList<Scan>> ListScansAsync(Guid userId);
    Task<Scan?> GetScanAsync(Guid userId, Guid scanId);
    Task AddScanAsync(Scan scan);
    Task<bool> DeleteScanAsync(Guid userId, Guid scanId);
}
