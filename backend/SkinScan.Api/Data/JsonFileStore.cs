using System.Text.Json;
using SkinScan.Api.Models;

namespace SkinScan.Api.Data;

/// <summary>
/// Thread-safe JSON file store. Keeps everything in memory and writes the whole file
/// atomically (temp file + rename) after every change. Good for demos and single-server deployments.
/// </summary>
public sealed class JsonFileStore : IAppStore
{
    private sealed class StoreData
    {
        public List<User> Users { get; set; } = [];
        public List<Scan> Scans { get; set; } = [];
    }

    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    private readonly string _path;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private readonly StoreData _data;

    public JsonFileStore(string path)
    {
        _path = Path.GetFullPath(path);
        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        _data = File.Exists(_path)
            ? JsonSerializer.Deserialize<StoreData>(File.ReadAllText(_path), JsonOptions) ?? new StoreData()
            : new StoreData();
    }

    public Task<User?> FindUserByEmailAsync(string email) =>
        ReadAsync(d => d.Users.FirstOrDefault(u => string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase)));

    public Task<User?> GetUserAsync(Guid id) => ReadAsync(d => d.Users.FirstOrDefault(u => u.Id == id));

    public Task<bool> TryAddUserAsync(User user) => WriteAsync(d =>
    {
        if (d.Users.Any(u => string.Equals(u.Email, user.Email, StringComparison.OrdinalIgnoreCase)))
            return false;
        d.Users.Add(user);
        return true;
    });

    public Task<IReadOnlyList<Scan>> ListScansAsync(Guid userId) => ReadAsync<IReadOnlyList<Scan>>(d =>
        d.Scans.Where(s => s.UserId == userId).OrderByDescending(s => s.CreatedAt).ToList());

    public Task<Scan?> GetScanAsync(Guid userId, Guid scanId) =>
        ReadAsync(d => d.Scans.FirstOrDefault(s => s.UserId == userId && s.Id == scanId));

    public Task AddScanAsync(Scan scan) => WriteAsync(d => { d.Scans.Add(scan); return true; });

    public Task<bool> DeleteScanAsync(Guid userId, Guid scanId) =>
        WriteAsync(d => d.Scans.RemoveAll(s => s.UserId == userId && s.Id == scanId) > 0);

    private async Task<T> ReadAsync<T>(Func<StoreData, T> read)
    {
        await _lock.WaitAsync();
        try { return read(_data); }
        finally { _lock.Release(); }
    }

    private async Task<bool> WriteAsync(Func<StoreData, bool> change)
    {
        await _lock.WaitAsync();
        try
        {
            if (!change(_data)) return false;
            var tmp = _path + ".tmp";
            await File.WriteAllTextAsync(tmp, JsonSerializer.Serialize(_data, JsonOptions));
            File.Move(tmp, _path, overwrite: true);
            return true;
        }
        finally { _lock.Release(); }
    }
}
