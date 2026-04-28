export type Totals = { income: number; expense: number; balance: number };
export type DayStat = { label: string; income: number; expense: number };
export type RangeKey = 'today' | 'week' | 'month' | 'year';

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

export const dashboardService = {
  async getTotals(): Promise<Totals> {
    return api<Totals>('/dashboard/totals', { method: 'GET' });
  },

  async getStats(range: RangeKey): Promise<DayStat[]> {
    const payload = await api<{ items: DayStat[] }>(`/dashboard/stats?range=${encodeURIComponent(range)}`, { method: 'GET' });
    return payload.items;
  },

  async getStatsBetween(fromYyyyMmDd: string, toYyyyMmDd: string): Promise<DayStat[]> {
    const payload = await api<{ items: DayStat[] }>(
      `/dashboard/stats-between?from=${encodeURIComponent(fromYyyyMmDd)}&to=${encodeURIComponent(toYyyyMmDd)}`,
      { method: 'GET' },
    );
    return payload.items;
  },
};

