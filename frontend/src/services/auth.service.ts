export type User = {
  id: string;
  name: string;
  email: string;
};

const STORAGE_KEY = 'finance_manager_user';

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function saveUser(user: User | null) {
  try {
    if (!user) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

let currentUser: User | null = loadUser();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export const authService = {
  getCurrentUser(): User | null {
    return currentUser;
  },

  login(_input: { email: string; password: string }): User {
    currentUser = { id: 'u1', name: 'Trần Phan Hoàng Triều', email: _input.email };
    saveUser(currentUser);
    emit();
    return currentUser;
  },

  register(input: { name: string; email: string; password: string }): User {
    currentUser = { id: 'u1', name: input.name, email: input.email };
    saveUser(currentUser);
    emit();
    return currentUser;
  },

  logout(): void {
    currentUser = null;
    saveUser(null);
    emit();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

