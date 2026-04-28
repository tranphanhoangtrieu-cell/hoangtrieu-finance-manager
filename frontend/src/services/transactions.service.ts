import type { Transaction, TransactionType } from '../features/transactions/types';
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

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export const transactionsService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async list(): Promise<Transaction[]> {
    const payload = await api<{ items: Transaction[] }>('/transactions', { method: 'GET' });
    return payload.items;
  },

  async create(input: {
    type: TransactionType;
    amount: number;
    categoryId: string;
    note: string;
    createdAt?: string; // yyyy-mm-dd
  }): Promise<Transaction> {
    const payload = await api<{ item: Transaction }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    emit();
    return payload.item;
  },

  async update(
    id: string,
    patch: {
      type?: TransactionType;
      amount?: number;
      categoryId?: string;
      note?: string;
      createdAt?: string; // yyyy-mm-dd
    },
  ): Promise<Transaction> {
    const payload = await api<{ item: Transaction }>(`/transactions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
    emit();
    return payload.item;
  },

  async remove(id: string): Promise<void> {
    await api<null>(`/transactions/${encodeURIComponent(id)}`, { method: 'DELETE' });
    emit();
  },
};

