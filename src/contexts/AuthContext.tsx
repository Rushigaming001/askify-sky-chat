import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const clearCorruptedSession = async () => {
      // Clear all Supabase auth data from localStorage
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || key.includes('supabase')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      try {
        await supabase.auth.signOut();
      } catch {}
    };

    const validateSession = (session: Session | null): boolean => {
      if (!session) return false;
      if (!session.user?.id) return false;
      if (!session.access_token) return false;
      
      // Check if token has required claims by decoding JWT payload
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        if (!payload.sub) return false;
        // Check if token is expired
        if (payload.exp && payload.exp * 1000 < Date.now()) return false;
      } catch {
        return false;
      }
      
      return true;
    };

    const initAuth = async () => {
      try {
        // First, try to get the existing session
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        // If there's an error or invalid session, clear it completely
        if (error || !validateSession(existingSession)) {
          console.log('Clearing invalid/corrupted session...');
          await clearCorruptedSession();
          if (mounted) {
            setSession(null);
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        if (mounted && existingSession?.user) {
          setSession(existingSession);
          setUser({
            id: existingSession.user.id,
            email: existingSession.user.email || '',
            name: existingSession.user.user_metadata?.name || 'User'
          });
          // Load full profile
          loadUserProfile(existingSession.user);
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        // Clear potentially corrupted auth state
        await clearCorruptedSession();
        if (mounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;

        // Avoid noisy logs + rerenders on frequent token refresh events
        if (event !== 'TOKEN_REFRESHED') {
          console.log('Auth state change:', event);
        }

        if (event === 'SIGNED_OUT' || !newSession) {
          setSession(null);
          setUser(null);
          return;
        }

        // Always update session reference (tokens can rotate)
        setSession(newSession);

        if (newSession.user) {
          const nextUser: User = {
            id: newSession.user.id,
            email: newSession.user.email || '',
            name: newSession.user.user_metadata?.name || 'User',
          };

          // Prevent rerender loops (e.g., TOKEN_REFRESHED creating a new object each time)
          setUser((prev) => {
            if (
              prev &&
              prev.id === nextUser.id &&
              prev.email === nextUser.email &&
              prev.name === nextUser.name
            ) {
              return prev;
            }
            return nextUser;
          });

          // Only load profile on sign-in to avoid repeated fetches
          if (event === 'SIGNED_IN') {
            setTimeout(() => {
              if (mounted) loadUserProfile(newSession.user);
            }, 0);
          }
        }
      }
    );

    // Then initialize
    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      // If email auto-confirm is enabled, a session may be returned immediately
      if (data.session?.user) {
        setSession(data.session);
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name || 'User'
        });

        setTimeout(() => {
          loadUserProfile(data.session!.user);
        }, 0);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.session?.user) {
        // Set state immediately to avoid redirect race conditions
        setSession(data.session);
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name || 'User'
        });

        setTimeout(() => {
          loadUserProfile(data.session!.user);
        }, 0);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    // Clear sensitive data from localStorage on logout
    const email = user?.email;
    if (email) {
      localStorage.removeItem(`askify_chats_${email}`);
    }
    // Clear other app-specific localStorage items
    localStorage.removeItem('musicPlayerTracks');
    localStorage.removeItem('language-learning-progress');
    localStorage.removeItem('capcut-project');
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ name: updates.name })
      .eq('id', user.id);

    if (!error) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
