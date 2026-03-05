import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  messageType: 'public' | 'dm' | 'friends' | 'group';
}

export function MessageReactions({ messageId, messageType }: MessageReactionsProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadReactions();
  }, [messageId]);

  const loadReactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId)
      .eq('message_type', messageType);

    if (data) {
      const emojiMap = new Map<string, { count: number; userReacted: boolean }>();
      data.forEach(r => {
        const existing = emojiMap.get(r.emoji) || { count: 0, userReacted: false };
        existing.count++;
        if (r.user_id === user.id) existing.userReacted = true;
        emojiMap.set(r.emoji, existing);
      });
      setReactions(Array.from(emojiMap.entries()).map(([emoji, data]) => ({ emoji, ...data })));
    }
  };

  const toggleReaction = async (emoji: string) => {
    if (!user) return;
    const existing = reactions.find(r => r.emoji === emoji && r.userReacted);
    
    if (existing) {
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);
    } else {
      await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, message_type: messageType, user_id: user.id, emoji });
    }
    
    loadReactions();
    setShowPicker(false);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap mt-0.5">
      {reactions.map(r => (
        <button
          key={r.emoji}
          onClick={() => toggleReaction(r.emoji)}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
            r.userReacted
              ? 'bg-primary/20 border border-primary/40'
              : 'bg-muted/50 border border-border hover:bg-muted'
          }`}
        >
          <span>{r.emoji}</span>
          <span className="text-[10px] font-medium">{r.count}</span>
        </button>
      ))}
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
            <SmilePlus className="h-3 w-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top" align="start">
          <div className="flex gap-1">
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className="text-lg hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
