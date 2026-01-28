import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/wallet';

export interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  authUser: any | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    isLoading: true,
    user: null,
    authUser: null,
  });

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setState({
          isLoggedIn: true,
          isLoading: false,
          authUser: session.user,
          user: {
            id: session.user.id,
            name: session.user.user_metadata?.name || 'User',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
            email: session.user.email,
          },
        });
      } else {
        setState({
          isLoggedIn: false,
          isLoading: false,
          user: null,
          authUser: null,
        });
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState({
          isLoggedIn: true,
          isLoading: false,
          authUser: session.user,
          user: {
            id: session.user.id,
            name: session.user.user_metadata?.name || 'User',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
            email: session.user.email,
          },
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  }, []);

  return {
    ...state,
    signOut,
    updateUser,
  };
}
