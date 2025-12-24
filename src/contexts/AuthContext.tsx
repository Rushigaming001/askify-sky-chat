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

    const mapUser = (u: SupabaseUser): User => ({
      id: u.id,
      email: u.email || "",
      name: (u.user_metadata as any)?.name || "User",
    });

    const setUserIfChanged = (next: User | null) => {
      setUser((prev) => {
        if (!prev && !next) return prev;
        if (
          prev &&
          next &&
          prev.id === next.id &&
          prev.email === next.email &&
          prev.name === next.name
        ) {
          return prev;
        }
        return next;
      });
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      // Avoid noisy logs on frequent token refresh events
      if (event !== "TOKEN_REFRESHED") {
        console.log("Auth state change:", event);
      }

      setSession(newSession);
      setUserIfChanged(newSession?.user ? mapUser(newSession.user) : null);

      // Load profile on sign-in only (defer Supabase calls)
      if (event === "SIGNED_IN" && newSession?.user) {
        setTimeout(() => {
          if (mounted) loadUserProfile(newSession.user);
        }, 0);
      }
    });

    // THEN hydrate from existing session (lets the SDK handle refresh)
    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession } }) => {
        if (!mounted) return;

        setSession(existingSession);
        setUserIfChanged(existingSession?.user ? mapUser(existingSession.user) : null);

        if (existingSession?.user) {
          setTimeout(() => {
            if (mounted) loadUserProfile(existingSession.user);
          }, 0);
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });


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
