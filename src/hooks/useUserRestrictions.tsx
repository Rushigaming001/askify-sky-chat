import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserRestrictions {
  banned_from_public_chat: boolean;
  banned_from_direct_messages: boolean;
  banned_from_groups: boolean;
  image_generation_disabled: boolean;
  video_generation_disabled: boolean;
  math_solver_disabled: boolean;
  live_video_call_disabled: boolean;
  minecraft_plugin_disabled: boolean;
  voice_chat_disabled: boolean;
  ai_chat_disabled: boolean;
}

const defaultRestrictions: UserRestrictions = {
  banned_from_public_chat: false,
  banned_from_direct_messages: false,
  banned_from_groups: false,
  image_generation_disabled: false,
  video_generation_disabled: false,
  math_solver_disabled: false,
  live_video_call_disabled: false,
  minecraft_plugin_disabled: false,
  voice_chat_disabled: false,
  ai_chat_disabled: false,
};

export function useUserRestrictions() {
  const { user } = useAuth();
  const [restrictions, setRestrictions] = useState<UserRestrictions>(defaultRestrictions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRestrictions(defaultRestrictions);
      setLoading(false);
      return;
    }

    loadRestrictions();

    // Subscribe to changes
    const channel = supabase
      .channel('user-restrictions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_restrictions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadRestrictions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadRestrictions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_restrictions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRestrictions({
          banned_from_public_chat: data.banned_from_public_chat || false,
          banned_from_direct_messages: data.banned_from_direct_messages || false,
          banned_from_groups: data.banned_from_groups || false,
          image_generation_disabled: data.image_generation_disabled || false,
          video_generation_disabled: data.video_generation_disabled || false,
          math_solver_disabled: data.math_solver_disabled || false,
          live_video_call_disabled: data.live_video_call_disabled || false,
          minecraft_plugin_disabled: data.minecraft_plugin_disabled || false,
          voice_chat_disabled: data.voice_chat_disabled || false,
          ai_chat_disabled: data.ai_chat_disabled || false,
        });
      } else {
        setRestrictions(defaultRestrictions);
      }
    } catch (error) {
      console.error('Error loading restrictions:', error);
      setRestrictions(defaultRestrictions);
    } finally {
      setLoading(false);
    }
  };

  return { restrictions, loading };
}
