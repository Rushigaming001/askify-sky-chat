import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DAILY_MESSAGE_LIMIT = 20;

export function useDailyMessageLimit() {
  const { user } = useAuth();
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsageCount = async () => {
    if (!user) {
      setUsed(0);
      setLoading(false);
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (error) throw error;
      setUsed(count || 0);
    } catch (error) {
      console.error('Error fetching usage count:', error);
      setUsed(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageCount();
  }, [user]);

  const remaining = Math.max(0, DAILY_MESSAGE_LIMIT - used);
  const canSend = remaining > 0;

  return {
    used,
    remaining,
    total: DAILY_MESSAGE_LIMIT,
    canSend,
    loading,
    refresh: fetchUsageCount
  };
}
