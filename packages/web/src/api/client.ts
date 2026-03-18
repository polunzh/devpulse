const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  posts: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/posts${qs}`);
    },
    markAsRead: (id: string) =>
      request(`/posts/${id}/read`, { method: 'POST' }),
  },
  sites: {
    list: () => request<any[]>('/sites'),
    create: (body: any) => request('/sites', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request(`/sites/${id}`, { method: 'DELETE' }),
    getConfig: (id: string) => request<Record<string, string>>(`/sites/${id}/config`),
    updateConfig: (id: string, body: any) => request(`/sites/${id}/config`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  interests: {
    list: () => request<any[]>('/interests'),
    add: (keyword: string) => request('/interests', { method: 'POST', body: JSON.stringify({ keyword }) }),
    remove: (id: string) => request(`/interests/${id}`, { method: 'DELETE' }),
  },
  fetch: {
    trigger: (siteId?: string) =>
      request('/fetch', { method: 'POST', body: JSON.stringify({ siteId }) }),
  },
};
