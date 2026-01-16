import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Users, Video, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GroupMembersDialog } from './GroupMembersDialog';
import { ChatMediaInput } from './ChatMediaInput';

interface GroupMessage {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  profiles: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

interface GroupChatProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
  onVideoCall?: () => void;
  onVoiceCall?: () => void;
}

export function GroupChat({ groupId, groupName, onClose, onVideoCall, onVoiceCall }: GroupChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !groupId) return;

    loadMessages();
    checkAdminStatus();

    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', payload.new.user_id)
            .single();

          if (profile) {
            setMessages(prev => [...prev, {
              ...payload.new as any,
              profiles: profile
            }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, groupId]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    setIsAdmin(membership?.role === 'admin');
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('group_messages')
      .select(`
        *,
        profiles!group_messages_user_id_fkey (
          name,
          email,
          avatar_url
        )
      `)
      .eq('group_id', groupId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data as GroupMessage[]);
  };

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    if ((!content.trim() && !imageUrl) || !user || isLoading) return;

    setIsLoading(true);

    const { error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        user_id: user.id,
        content: content || '',
        image_url: imageUrl
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }

    setIsLoading(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{groupName}</h3>
            <p className="text-xs text-muted-foreground">Group Chat</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowMembers(true)} title="View members">
            <Users className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onVideoCall}>
            <Video className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onVoiceCall}>
            <Phone className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-muted-foreground">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.user_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {message.profiles?.avatar_url ? (
                      <AvatarImage src={message.profiles.avatar_url} />
                    ) : null}
                    <AvatarFallback className="text-xs bg-muted">
                      {message.profiles ? getInitials(message.profiles.name) : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {isOwnMessage ? 'You' : (message.profiles?.name || 'Anonymous')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {message.image_url && (
                        <img src={message.image_url} alt="Shared" className="max-w-[200px] max-h-[200px] rounded-lg mb-2" />
                      )}
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4 bg-background">
        <ChatMediaInput 
          onSend={handleSendMessage}
          placeholder="Type a message..."
          disabled={isLoading}
          userId={user?.id}
        />
      </div>

      <GroupMembersDialog
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        groupId={groupId}
        groupName={groupName}
        isAdmin={isAdmin}
      />
    </div>
  );
}
