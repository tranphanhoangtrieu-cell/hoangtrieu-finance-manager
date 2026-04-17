import { Navigate } from 'react-router-dom';

import { useAuth } from '../../app/auth';

export function RedirectIfAuthed(props: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return props.children;
}

