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

export type NlpParseResult = {
  type: 'income' | 'expense';
  amount: number | null;
  createdAt: string | null; // yyyy-mm-dd
  categoryId: string | null;
  note: string;
  confidence: 'low' | 'medium' | 'high';
};

export const nlpService = {
  async parse(text: string): Promise<{ results: NlpParseResult[]; categories: Array<{ id: string; name: string }> }> {
    return api('/nlp/parse', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },
};

