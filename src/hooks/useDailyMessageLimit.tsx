import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_DAILY_MESSAGE_LIMIT = 20;

export function useDailyMessageLimit() {
  const { user } = useAuth();
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customLimit, setCustomLimit] = useState<number | null>(null);

  const fetchCustomLimit = async () => {
    if (!user) return DEFAULT_DAILY_MESSAGE_LIMIT;

    try {
      const { data, error } = await supabase
        .from('user_message_limits')
        .select('daily_limit')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.daily_limit || DEFAULT_DAILY_MESSAGE_LIMIT;
    } catch (error) {
      console.error('Error fetching custom limit:', error);
      return DEFAULT_DAILY_MESSAGE_LIMIT;
    }
  };

  const fetchUsageCount = async () => {
    if (!user) {
      setUsed(0);
      setLoading(false);
      return;
    }

    try {
      // Fetch custom limit first
      const limit = await fetchCustomLimit();
      setCustomLimit(limit);

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

  const totalLimit = customLimit !== null ? customLimit : DEFAULT_DAILY_MESSAGE_LIMIT;
  const remaining = Math.max(0, totalLimit - used);
  const canSend = remaining > 0;

  return {
    used,
    remaining,
    total: totalLimit,
    canSend,
    loading,
    refresh: fetchUsageCount
  };
}