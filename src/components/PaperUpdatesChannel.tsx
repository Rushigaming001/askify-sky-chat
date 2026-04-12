import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Trash2, Megaphone, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaperUpdate {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  profiles?: {
    name: string;
    avatar_url?: string;
  };
}

interface PaperUpdatesChannelProps {
  compact?: boolean;
}

export function PaperUpdatesChannel({ compact = false }: PaperUpdatesChannelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [updates, setUpdates] = useState<PaperUpdate[]>([]);
  const [newUpdate, setNewUpdate] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;

    const checkOwner = async () => {
      const { data } = await supabase.rpc('is_owner', { _user_id: user.id });
      setIsOwner(!!data);
    };

    checkOwner();
    loadUpdates();

    const channel = supabase
      .channel('paper-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'paper_updates'
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();
          setUpdates(prev => [...prev, { ...payload.new as any, profiles: profile }]);
        } else if (payload.eventType === 'DELETE') {
          setUpdates(prev => prev.filter(u => u.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (el) el.scrollTop = el.scrollHeight;
  }, [updates]);

  const loadUpdates = async () => {
    const { data } = await supabase
      .from('paper_updates')
      .select('*, profiles!paper_updates_user_id_fkey(name, avatar_url)')
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      // Fallback: if join fails, load profiles separately
      const needsProfile = data.filter((d: any) => !d.profiles);
      if (needsProfile.length > 0) {
        const userIds = [...new Set(needsProfile.map((d: any) => d.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds);
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        setUpdates(data.map((d: any) => ({
          ...d,
          profiles: d.profiles || profileMap.get(d.user_id) || { name: 'Owner' }
        })));
      } else {
        setUpdates(data as PaperUpdate[]);
      }
    }
  };

  const handleSend = async () => {
    if (!newUpdate.trim() || !user || sending) return;
    setSending(true);

    const { error } = await supabase.from('paper_updates').insert({
      user_id: user.id,
      content: newUpdate.trim()
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to send update', variant: 'destructive' });
    } else {
      setNewUpdate('');
    }
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('paper_updates').delete().eq('id', id);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className={compact ? 'border-0 shadow-none' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="h-5 w-5 text-primary" />
          Paper Updates
          <Badge variant="outline" className="text-xs">Owner Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={compact ? 'h-[250px]' : 'h-[350px]'} ref={scrollRef}>
          <div className="space-y-3 p-4">
            {updates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No paper updates yet</p>
              </div>
            ) : (
              updates.map((update) => (
                <div key={update.id} className="flex gap-3 group">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {update.profiles?.avatar_url && <AvatarImage src={update.profiles.avatar_url} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {update.profiles?.name?.[0] || 'O'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{update.profiles?.name || 'Owner'}</span>
                      <Badge className="text-[10px] px-1 py-0 bg-amber-500/20 text-amber-600 border-amber-500/30">OWNER</Badge>
                      <span className="text-xs text-muted-foreground">{formatTime(update.created_at)}</span>
                      {isOwner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => handleDelete(update.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-1 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
                      {update.image_url && (
                        <img src={update.image_url} alt="Update" className="max-w-[200px] rounded-lg mb-2" />
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{update.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {isOwner && (
          <div className="border-t border-border p-3 flex gap-2">
            <Textarea
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              placeholder="Post a paper update..."
              className="min-h-[40px] max-h-[100px] resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button size="sm" onClick={handleSend} disabled={sending || !newUpdate.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
