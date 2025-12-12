import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, Users, MoreVertical, Edit2, Trash2, UserCircle, Video, Phone } from 'lucide-react';
import { WebRTCCall } from '@/components/WebRTCCall';
import { GroupsList } from '@/components/GroupsList';
import { GroupChat } from '@/components/GroupChat';
import { useToast } from '@/hooks/use-toast';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { UsersList } from '@/components/UsersList';
import { DirectMessageChat } from '@/components/DirectMessageChat';

interface PublicMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  deleted_by?: string;
  edit_history?: any[];
  profiles: {
    name: string;
    email: string;
  };
}

const PublicChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showUsersList, setShowUsersList] = useState(false);
  const [showGroupsList, setShowGroupsList] = useState(false);
  const [activeDM, setActiveDM] = useState<{ userId: string; userName: string } | null>(null);
  const [activeGroup, setActiveGroup] = useState<{ groupId: string; groupName: string } | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user is owner or admin
    const checkAdminStatus = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin'])
        .single();
      
      setIsAdmin(!!data);
    };

    checkAdminStatus();
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('public-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'public_messages'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
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
  }, [user, navigate]);

  useEffect(() => {
    // Auto-scroll to bottom
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('public_messages')
      .select(`
        *,
        profiles!public_messages_user_id_fkey (
          name,
          email
        )
      `)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      });
    } else {
      setMessages(data as PublicMessage[]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isLoading) return;

    setIsLoading(true);
    const content = newMessage.trim();

    // Check for /askify command
    if (content.startsWith('/askify ')) {
      const question = content.substring(8);
      
      const { error } = await supabase.functions.invoke('askify-chat', {
        body: { question, messageId: user.id }
      });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to get AI response',
          variant: 'destructive'
        });
      }
      setNewMessage('');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from('public_messages')
      .insert({
        user_id: user.id,
        content
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } else {
      setNewMessage('');
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
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    const message = messages.find(m => m.id === editingMessage);
    if (!message) return;

    const editHistory = message.edit_history || [];
    editHistory.push({
      content: message.content,
      edited_at: new Date().toISOString()
    });

    const { error } = await supabase
      .from('public_messages')
      .update({
        content: editContent.trim(),
        edited_at: new Date().toISOString(),
        edit_history: editHistory
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
      .from('public_messages')
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

  const renderMessageContent = (content: string) => {
    // Parse @mentions and highlight them
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-primary font-semibold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <header className="border-b border-border p-2 sm:p-3 md:p-4 bg-background backdrop-blur supports-[backdrop-filter]:bg-background/95">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate">Public Chat</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Chat with everyone</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVideoCall(true)}
                title="Start video call"
                className="h-7 w-7 sm:h-8 sm:w-8"
              >
                <Video className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVoiceCall(true)}
                title="Start voice call"
                className="h-7 w-7 sm:h-8 sm:w-8"
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGroupsList(true)}
                title="View groups"
                className="h-7 w-7 sm:h-8 sm:w-8"
              >
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUsersList(true)}
                title="View users"
                className="h-7 w-7 sm:h-8 sm:w-8"
              >
                <UserCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1 chat-scroll" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-muted-foreground">Be the first to say hello!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.user_id === user?.id;
                const isDeleted = !!message.deleted_at;
                const canSeeDeleted = isAdmin || isOwnMessage;
                
                // Skip deleted messages for non-admin users who don't own them
                if (isDeleted && !canSeeDeleted) {
                  return null;
                }

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} ${isDeleted ? 'opacity-50' : ''}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
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
                        {message.edited_at && (
                          <span className="text-xs text-muted-foreground italic">
                            (edited)
                          </span>
                        )}
                      </div>
                      <div className="flex items-start gap-2">
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isDeleted 
                              ? 'bg-destructive/20 text-destructive line-through'
                              : isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {isDeleted ? (
                              isAdmin ? (
                                <>
                                  [Deleted by {message.deleted_by === message.user_id ? 'user' : 'admin'}] {message.content}
                                </>
                              ) : (
                                '[Message deleted]'
                              )
                            ) : (
                              renderMessageContent(message.content)
                            )}
                          </p>
                        </div>
                        {!isDeleted && isOwnMessage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingMessage(message.id);
                                  setEditContent(message.content);
                                }}
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteMessage(message.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
          <div className="mb-2 text-xs text-muted-foreground">
            Tip: Use @username to mention someone or /askify your question to get AI help
          </div>
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
              <Button variant="outline" onClick={() => setEditingMessage(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditMessage}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet open={showUsersList} onOpenChange={setShowUsersList}>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Users</SheetTitle>
            </SheetHeader>
            <UsersList
              onOpenDM={(userId, userName) => {
                setActiveDM({ userId, userName });
                setShowUsersList(false);
              }}
            />
          </SheetContent>
        </Sheet>

        <Sheet open={showGroupsList} onOpenChange={setShowGroupsList}>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Groups</SheetTitle>
            </SheetHeader>
            <GroupsList
              onOpenGroupChat={(groupId, groupName) => {
                setActiveGroup({ groupId, groupName });
                setShowGroupsList(false);
              }}
            />
          </SheetContent>
        </Sheet>

        {activeDM && (
          <>
            {/* Desktop: side panel */}
            <div className="fixed inset-y-0 right-0 w-96 z-50 hidden md:block">
              <DirectMessageChat
                recipientId={activeDM.userId}
                recipientName={activeDM.userName}
                onClose={() => setActiveDM(null)}
              />
            </div>
            {/* Mobile: full screen dialog */}
            <Dialog open={!!activeDM} onOpenChange={() => setActiveDM(null)}>
              <DialogContent className="md:hidden max-w-full w-full h-full max-h-screen p-0 gap-0">
                <DirectMessageChat
                  recipientId={activeDM.userId}
                  recipientName={activeDM.userName}
                  onClose={() => setActiveDM(null)}
                />
              </DialogContent>
            </Dialog>
          </>
        )}

        {activeGroup && (
          <>
            {/* Desktop: side panel */}
            <div className="fixed inset-y-0 right-0 w-96 z-50 hidden md:block">
              <GroupChat
                groupId={activeGroup.groupId}
                groupName={activeGroup.groupName}
                onClose={() => setActiveGroup(null)}
                onVideoCall={() => setShowVideoCall(true)}
                onVoiceCall={() => setShowVoiceCall(true)}
              />
            </div>
            {/* Mobile: full screen dialog */}
            <Dialog open={!!activeGroup} onOpenChange={() => setActiveGroup(null)}>
              <DialogContent className="md:hidden max-w-full w-full h-full max-h-screen p-0 gap-0">
                <GroupChat
                  groupId={activeGroup.groupId}
                  groupName={activeGroup.groupName}
                  onClose={() => setActiveGroup(null)}
                  onVideoCall={() => setShowVideoCall(true)}
                  onVoiceCall={() => setShowVoiceCall(true)}
                />
              </DialogContent>
            </Dialog>
          </>
        )}

        <WebRTCCall
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          callType="video"
          recipientName="Public Chat"
          recipientId="public"
          isInitiator={true}
        />

        <WebRTCCall
          isOpen={showVoiceCall}
          onClose={() => setShowVoiceCall(false)}
          callType="voice"
          recipientName="Public Chat"
          recipientId="public"
          isInitiator={true}
        />
      </div>
    </div>
  );
};

export default PublicChat;
