import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string, isTasker?: boolean, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, loginContext?: 'client' | 'tasker') => Promise<{ error: any }>;
  signInWithGoogle: (isProvider?: boolean, loginContext?: 'client' | 'tasker') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh session every 9 minutes to prevent token expiration
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.refreshSession();
      }
    }, 9 * 60 * 1000); // Refresh every 9 minutes (Supabase session lasts 60 minutes)

    return () => clearInterval(refreshInterval);
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone?: string, isTasker?: boolean, role?: string) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: phone,
          is_tasker: isTasker || false,
          role: role || 'client'
        }
      }
    });

    if (!error && data.user && !data.session) {
      // User needs to confirm email
      return { error: null };
    }

    return { error };
  };

  const signIn = async (email: string, password: string, loginContext?: 'client' | 'tasker') => {
    // Store login context before authentication
    if (loginContext) {
      sessionStorage.setItem('login_context', loginContext);
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signInWithGoogle = async (isProvider: boolean = false, loginContext?: 'client' | 'tasker') => {
    // Store login context before OAuth redirect
    if (loginContext) {
      sessionStorage.setItem('login_context', loginContext);
    }
    
    // Store role preference before OAuth redirect
    if (isProvider) {
      sessionStorage.setItem('pending_role', 'provider');
    } else {
      sessionStorage.setItem('pending_role', 'client');
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    return { error };
  };

  const signOut = async () => {
    try {
      // Attempt to sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      // Even if the API call fails, we should clear local state
      console.error('Error during sign out:', error);
    } finally {
      // Always clear local state regardless of API response
      setSession(null);
      setUser(null);
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?reset=true`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};