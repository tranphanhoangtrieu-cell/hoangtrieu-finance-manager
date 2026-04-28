import type { Category } from '../features/categories/types';
import { authService } from './auth.service';

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:8000/api';

async function api<T>(path: string, init: RequestInit): Promise<T> {
  const token = authService.getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as any) : null;

  if (!res.ok) {
    const message = typeof data?.message === 'string' ? data.message : 'Có lỗi xảy ra.';
    throw new Error(message);
  }

  return data as T;
}

export const categoriesService = {
  async list(): Promise<Category[]> {
    const payload = await api<{ items: Category[] }>('/categories', { method: 'GET' });
    return payload.items;
  },

  async create(input: { name: string; color: string }): Promise<Category> {
    const payload = await api<{ item: Category }>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name: input.name, color: input.color }),
    });
    return payload.item;
  },

  async update(id: string, patch: { name?: string; color?: string }): Promise<Category> {
    const payload = await api<{ item: Category }>(`/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
    return payload.item;
  },

  async remove(id: string): Promise<void> {
    await api<null>(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

