import { Navigate } from 'react-router-dom';

import { useAuth } from '../../app/auth';

export function ProtectedRoute(props: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return props.children;
}

