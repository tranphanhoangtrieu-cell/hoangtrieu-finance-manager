export type User = {
  id: string;
  name: string;
  email: string;
};

const STORAGE_USER_KEY = 'finance_manager_user';
const STORAGE_TOKEN_KEY = 'finance_manager_token';
const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:8000/api';

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function saveUser(user: User | null) {
  try {
    if (!user) localStorage.removeItem(STORAGE_USER_KEY);
    else localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

function loadToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem(STORAGE_TOKEN_KEY);
    else localStorage.setItem(STORAGE_TOKEN_KEY, token);
  } catch {
    // ignore storage errors
  }
}

let currentUser: User | null = loadUser();
let currentToken: string | null = loadToken();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

async function api<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
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

export const authService = {
  getCurrentUser(): User | null {
    return currentUser;
  },

  getAccessToken(): string | null {
    return currentToken;
  },

  async login(input: { email: string; password: string }): Promise<User> {
    const payload = await api<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: input.email, password: input.password }),
    });

    currentUser = payload.user;
    currentToken = payload.accessToken;
    saveUser(currentUser);
    saveToken(currentToken);
    emit();
    return currentUser;
  },

  async register(input: { name: string; email: string; password: string }): Promise<User> {
    const payload = await api<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: input.name, email: input.email, password: input.password }),
    });

    currentUser = payload.user;
    currentToken = payload.accessToken;
    saveUser(currentUser);
    saveToken(currentToken);
    emit();
    return currentUser;
  },

  logout(): void {
    currentUser = null;
    currentToken = null;
    saveUser(null);
    saveToken(null);
    emit();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

