import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Users, MoreVertical, Edit2, Trash2, Reply, X, Lock, Video, Phone } from 'lucide-react';
import { WebRTCCall } from '@/components/WebRTCCall';
import { useToast } from '@/hooks/use-toast';
import { ChatMediaInput } from '@/components/ChatMediaInput';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface FriendsMessage {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  reply_to?: string;
  profiles: {
    name: string;
    avatar_url?: string;
  };
  user_role?: string;
}

const FriendsChat = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<FriendsMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFriendRole, setHasFriendRole] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<FriendsMessage | null>(null);
  const [viewingProfile, setViewingProfile] = useState<{ userId: string; userName: string } | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    const checkAccess = async () => {
      // Check if user has friend role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const userRoles = roles?.map(r => r.role) || [];
      const isFriend = userRoles.includes('friend');
      const hasOwnerRole = userRoles.includes('owner');
      const isAdminOrOwner = userRoles.some(r => ['owner', 'admin', 'ceo', 'founder', 'co_founder'].includes(r));

      setHasFriendRole(isFriend || isAdminOrOwner);
      setIsAdmin(isAdminOrOwner || hasOwnerRole);

      if (!isFriend && !isAdminOrOwner) {
        toast({
          title: 'Access Denied',
          description: 'Only users with Friend role can access this chat',
          variant: 'destructive'
        });
        navigate('/public-chat');
        return;
      }

      loadMessages();
    };

    checkAccess();

    // Subscribe to new messages
    const channel = supabase
      .channel('friends-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends_chat_messages'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            if (profile) {
              setMessages(prev => [...prev, {
                ...payload.new as any,
                profiles: profile
              }]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, ...payload.new as any }
                : msg
            ));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, user?.id, navigate]);

  useEffect(() => {
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('friends_chat_messages')
      .select(`
        *,
        profiles!friends_chat_messages_user_id_fkey (
          name,
          avatar_url
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages((data || []).reverse() as FriendsMessage[]);
  };

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    if ((!content.trim() && !imageUrl) || !user || isLoading) return;

    setIsLoading(true);

    const { error } = await supabase
      .from('friends_chat_messages')
      .insert({
        user_id: user.id,
        content: content || '',
        image_url: imageUrl,
        reply_to: replyingTo?.id || null
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } else {
      setReplyingTo(null);
    }

    setIsLoading(false);
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    const { error } = await supabase
      .from('friends_chat_messages')
      .update({
        content: editContent.trim(),
        edited_at: new Date().toISOString()
      })
      .eq('id', editingMessage);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to edit message',
        variant: 'destructive'
      });
    } else {
      setEditingMessage(null);
      setEditContent('');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('friends_chat_messages')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id
      })
      .eq('id', messageId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive'
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  const getReplyMessage = (replyId: string) => {
    return messages.find(m => m.id === replyId);
  };

  if (!hasFriendRole) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Lock className="h-16 w-16 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">Friends Only</h2>
          <p className="text-muted-foreground">This chat is only for users with Friend role</p>
          <Button onClick={() => navigate('/public-chat')}>Go to Public Chat</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="flex-1 flex flex-col w-full relative bg-card border-0 md:border-x border-border">
        <header className="border-b border-border p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/public-chat')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  Boys Chat 
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">
                    🔒 Friends Only
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground">Exclusive chat for friends</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVideoCall(true)}
                title="Start video call"
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVoiceCall(true)}
                title="Start voice call"
              >
                <Phone className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Users className="h-16 w-16 text-blue-500/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Welcome to Boys Chat!</h3>
                <p className="text-muted-foreground">Start chatting with your friends 🔒</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.user_id === user?.id;
                const replyMessage = message.reply_to ? getReplyMessage(message.reply_to) : null;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar 
                      className="h-8 w-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                      onClick={() => setViewingProfile({ userId: message.user_id, userName: message.profiles?.name || 'User' })}
                    >
                      {message.profiles?.avatar_url ? (
                        <AvatarImage src={message.profiles.avatar_url} />
                      ) : null}
                      <AvatarFallback className="text-xs bg-blue-500/20">
                        {message.profiles ? getInitials(message.profiles.name) : '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {isOwnMessage ? 'You' : (message.profiles?.name || 'Anonymous')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.created_at)}
                        </span>
                        {message.edited_at && (
                          <span className="text-xs text-muted-foreground italic">(edited)</span>
                        )}
                      </div>
                      {replyMessage && (
                        <div className={`text-xs text-muted-foreground mb-1 px-2 py-1 rounded bg-muted/50 border-l-2 border-blue-500`}>
                          <span className="font-medium">↩ {replyMessage.profiles?.name}: </span>
                          <span className="truncate">{replyMessage.content.substring(0, 50)}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {message.image_url && (
                            <img 
                              src={message.image_url} 
                              alt="Shared" 
                              className="max-w-[200px] max-h-[200px] rounded-lg mb-2"
                            />
                          )}
                          {message.content && (
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          )}
                        </div>
                        {(isOwnMessage || isAdmin) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setReplyingTo(message)}>
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              {isOwnMessage && (
                                <DropdownMenuItem onClick={() => {
                                  setEditingMessage(message.id);
                                  setEditContent(message.content);
                                }}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {!isOwnMessage && !isAdmin && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(message)}>
                            <Reply className="h-4 w-4" />
                          </Button>
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
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 text-xs bg-blue-500/10 p-2 rounded border-l-2 border-blue-500">
              <Reply className="h-3 w-3" />
              <span className="text-muted-foreground">Replying to</span>
              <span className="font-medium">{replyingTo.profiles?.name}</span>
              <Button variant="ghost" size="icon" className="h-4 w-4 ml-auto" onClick={() => setReplyingTo(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <ChatMediaInput 
            onSend={handleSendMessage}
            placeholder={replyingTo ? `Reply to ${replyingTo.profiles?.name}...` : "Type a message..."}
            disabled={isLoading}
            userId={user?.id}
          />
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Message</DialogTitle>
            </DialogHeader>
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your message..."
              className="mt-4"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMessage(null)}>Cancel</Button>
              <Button onClick={handleEditMessage}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Profile Dialog */}
        {viewingProfile && (
          <UserProfileDialog
            open={!!viewingProfile}
            onOpenChange={(open) => !open && setViewingProfile(null)}
            userId={viewingProfile.userId}
            userName={viewingProfile.userName}
          />
        )}

        {/* Video/Voice Calls */}
        <WebRTCCall
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          callType="video"
          recipientName="Boys Chat"
          recipientId="friends-chat"
          isInitiator={true}
        />

        <WebRTCCall
          isOpen={showVoiceCall}
          onClose={() => setShowVoiceCall(false)}
          callType="voice"
          recipientName="Boys Chat"
          recipientId="friends-chat"
          isInitiator={true}
        />
      </div>
    </div>
  );
};

export default FriendsChat;