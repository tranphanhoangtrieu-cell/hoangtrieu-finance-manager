import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { authService, type User } from '../services/auth.service';

type AuthContextValue = {
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());

  useEffect(() => {
    return authService.subscribe(() => setUser(authService.getCurrentUser()));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user }), [user]);
  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

