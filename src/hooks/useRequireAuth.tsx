import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function useRequireAuth(redirectTo: string = '/auth') {
  const { user, session, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!session?.user && !user) {
      navigate(redirectTo, { replace: true });
    }
  }, [isLoading, session?.user?.id, user?.id, navigate, redirectTo]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!(session?.user || user),
  };
}
