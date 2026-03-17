const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  sites: {
    list: () => request<any[]>('/api/sites'),
    create: (body: { name: string; adapter: string }) =>
      request<any>('/api/sites', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { enabled: number }) =>
      request<any>(`/api/sites/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<void>(`/api/sites/${id}`, { method: 'DELETE' }),
  },
  interests: {
    list: () => request<any[]>('/api/interests'),
    add: (keyword: string) =>
      request<any>('/api/interests', { method: 'POST', body: JSON.stringify({ keyword }) }),
    remove: (id: string) =>
      request<void>(`/api/interests/${id}`, { method: 'DELETE' }),
  },
};
