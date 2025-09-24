import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  id: string;
  action: string;
  table_name: string;
  created_at: string;
}

interface SecurityMonitoring {
  recentActivity: SecurityEvent[];
  loading: boolean;
  error: string | null;
  checkRateLimit: (action: string, maxAttempts?: number, windowMinutes?: number) => Promise<boolean>;
}

export const useSecurityMonitoring = (): SecurityMonitoring => {
  const { user } = useAuth();
  const [recentActivity, setRecentActivity] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentActivity = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('id, action, table_name, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentActivity(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching security activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkRateLimit = async (
    action: string, 
    maxAttempts: number = 5, 
    windowMinutes: number = 60
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        _user_id: user.id,
        _action: action,
        _max_attempts: maxAttempts,
        _window_minutes: windowMinutes
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Rate limit check failed:', err);
      return false; // Fail safely - assume rate limited
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, [user]);

  return {
    recentActivity,
    loading,
    error,
    checkRateLimit
  };
};