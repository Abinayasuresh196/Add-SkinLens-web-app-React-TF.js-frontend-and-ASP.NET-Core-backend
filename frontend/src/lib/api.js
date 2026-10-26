// Small fetch wrapper for the C# backend. Base URL is same-origin by default
// (Vite proxies /api in dev; the backend serves the built app in production).
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'skinlens.token';

export const tokenStore = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
  },
};

export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('Cannot reach the server. Check that the backend is running.', 0);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (res.ok) return data;

  if (res.status === 401 && token) tokenStore.set(null);
  const fields = Object.fromEntries(Object.entries(data?.errors ?? {}).map(([k, v]) => [k, v[0]]));
  const message =
    data?.detail ||
    Object.values(fields)[0] ||
    (res.status === 429 ? 'Too many attempts. Wait a minute and try again.' : `Request failed (${res.status}).`);
  throw new ApiError(message, res.status, fields);
}

export const api = {
  register: (name, email, password) => request('/api/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/api/auth/me'),
  listScans: () => request('/api/scans'),
  getScan: (id) => request(`/api/scans/${id}`),
  stats: () => request('/api/scans/stats'),
  saveScan: (scan) => request('/api/scans', { method: 'POST', body: scan }),
  deleteScan: (id) => request(`/api/scans/${id}`, { method: 'DELETE' }),
};
