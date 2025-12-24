import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Video, Phone } from 'lucide-react';
import { WebRTCCall } from './WebRTCCall';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  edited_at?: string;
  read_at?: string;
}

interface DirectMessageChatProps {
  recipientId: string;
  recipientName: string;
  onClose: () => void;
}

export function DirectMessageChat({ recipientId, recipientName, onClose }: DirectMessageChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendNotification } = usePushNotifications();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`dm-${user.id}-${recipientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${recipientId},receiver_id=eq.${user.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as DirectMessage]);
          markAsRead(payload.new.id);
        }
      )
      .subscribe();

    // Mark existing unread messages as read
    markUnreadMessages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId]);

  useEffect(() => {
    // Auto-scroll to bottom
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      });
    } else {
      setMessages(data || []);
    }
  };

  const markUnreadMessages = async () => {
    if (!user) return;

    await supabase
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', recipientId)
      .eq('receiver_id', user.id)
      .is('read_at', null);
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isLoading) return;

    setIsLoading(true);

    const messageContent = newMessage.trim();
    const { error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        receiver_id: recipientId,
        content: messageContent
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } else {
      setNewMessage('');
      loadMessages();
      
      // Send push notification to recipient
      sendNotification(
        recipientId,
        `New message from ${user.name || 'Someone'}`,
        messageContent.length > 100 ? messageContent.substring(0, 100) + '...' : messageContent,
        { type: 'direct_message', senderId: user.id, senderName: user.name }
      );
    }

    setIsLoading(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold">DM with {recipientName}</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowVideoCall(true)}>
            <Video className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowVoiceCall(true)}>
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs opacity-70">
                        {formatTime(message.created_at)}
                      </span>
                      {isOwnMessage && message.read_at && (
                        <span className="text-xs opacity-70">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!newMessage.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <WebRTCCall
        isOpen={showVideoCall}
        onClose={() => setShowVideoCall(false)}
        callType="video"
        recipientName={recipientName}
        recipientId={recipientId}
        isInitiator={true}
      />

      <WebRTCCall
        isOpen={showVoiceCall}
        onClose={() => setShowVoiceCall(false)}
        callType="voice"
        recipientName={recipientName}
        recipientId={recipientId}
        isInitiator={true}
      />
    </div>
  );
}