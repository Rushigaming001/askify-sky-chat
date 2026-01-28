import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingIndicatorProps {
  channelId: string;
  currentUserId?: string;
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

export function TypingIndicator({ channelId, currentUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`typing:${channelId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: TypingUser[] = [];
        
        Object.entries(state).forEach(([, presences]) => {
          (presences as any[]).forEach(presence => {
            if (presence.userId !== currentUserId && presence.typing) {
              users.push({
                userId: presence.userId,
                userName: presence.userName,
                timestamp: presence.timestamp
              });
            }
          });
        });

        // Filter out stale typing indicators (older than 3 seconds)
        const now = Date.now();
        const activeUsers = users.filter(u => now - u.timestamp < 3000);
        setTypingUsers(activeUsers);
      })
      .subscribe();

    // Cleanup stale indicators periodically
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => prev.filter(u => now - u.timestamp < 3000));
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [channelId, currentUserId]);

  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing`;
    } else {
      return `${typingUsers.length} people are typing`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-muted-foreground animate-fade-in">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
}

// Hook for sending typing status
export function useTypingIndicator(channelId: string, userId?: string, userName?: string) {
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!userId || !userName) return;

    const ch = supabase.channel(`typing:${channelId}`);
    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setChannel(ch);
      }
    });

    return () => {
      if (ch) {
        supabase.removeChannel(ch);
      }
    };
  }, [channelId, userId, userName]);

  const sendTyping = async () => {
    if (!channel || !userId || !userName) return;

    try {
      await channel.track({
        userId,
        userName,
        typing: true,
        timestamp: Date.now()
      });

      // Stop typing after 2 seconds
      setTimeout(async () => {
        try {
          await channel.untrack();
        } catch {}
      }, 2000);
    } catch (err) {
      console.error('Error sending typing indicator:', err);
    }
  };

  return { sendTyping };
}
