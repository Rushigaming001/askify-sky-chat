import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, Users, MoreVertical, Edit2, Trash2, UserCircle, Video, Phone, Reply, X, Music, Shield } from 'lucide-react';
import { WebRTCCall } from '@/components/WebRTCCall';
import { GroupsList } from '@/components/GroupsList';
import { GroupChat } from '@/components/GroupChat';
import { useToast } from '@/hooks/use-toast';
import { PublicChatMusicPlayer } from '@/components/PublicChatMusicPlayer';
import { UserModerationDialog } from '@/components/UserModerationDialog';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useUserRestrictions } from '@/hooks/useUserRestrictions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  reply_to?: string;
  profiles: {
    name: string;
    email: string;
  };
  user_role?: string;
}

interface MusicTrack {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelTitle: string;
  videoId: string;
}

const PublicChat = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sendNotification } = usePushNotifications();
  const { restrictions } = useUserRestrictions();
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showUsersList, setShowUsersList] = useState(false);
  const [showGroupsList, setShowGroupsList] = useState(false);
  const [activeDM, setActiveDM] = useState<{ userId: string; userName: string } | null>(null);
  const [activeGroup, setActiveGroup] = useState<{ groupId: string; groupName: string } | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [replyingTo, setReplyingTo] = useState<PublicMessage | null>(null);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [musicQueue, setMusicQueue] = useState<MusicTrack[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [moderatingUser, setModeratingUser] = useState<{ userId: string; userName: string } | null>(null);
  const [userRestrictionData, setUserRestrictionData] = useState<any>(null);
  const [allProfiles, setAllProfiles] = useState<{ id: string; name: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    // Check if user is banned
    if (restrictions.banned_from_public_chat) {
      toast({
        title: 'Access Denied',
        description: 'You are banned from public chat',
        variant: 'destructive'
      });
      navigate('/');
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
      setIsOwner(data?.role === 'owner');
    };

    // Load all profiles for @mention lookup
    const loadProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name');
      if (data) {
        setAllProfiles(data);
      }
    };

    checkAdminStatus();
    loadMessages();
    loadProfiles();

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

            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', payload.new.user_id)
              .single();

            if (profile) {
              setMessages(prev => [...prev, {
                ...payload.new as any,
                profiles: profile,
                user_role: roleData?.role || 'user'
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
  }, [authLoading, user?.id, navigate, restrictions.banned_from_public_chat]);

  // Load user restriction data when moderating
  useEffect(() => {
    if (moderatingUser) {
      const loadUserRestriction = async () => {
        const { data } = await supabase
          .from('user_restrictions')
          .select('*')
          .eq('user_id', moderatingUser.userId)
          .maybeSingle();
        setUserRestrictionData(data);
      };
      loadUserRestriction();
    }
  }, [moderatingUser]);

  useEffect(() => {
    // Auto-scroll to bottom
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    // Load messages in batches for faster initial load
    const { data, error } = await supabase
      .from('public_messages')
      .select(`
        *,
        profiles!public_messages_user_id_fkey (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      });
    } else {
      // Get unique user IDs
      const userIds = [...new Set((data || []).map((msg: any) => msg.user_id))];
      
      // Batch fetch all user roles at once
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
      
      // Create a map for quick lookup
      const roleMap = new Map((rolesData || []).map(r => [r.user_id, r.role]));
      
      // Map roles to messages
      const messagesWithRoles = (data || []).map((msg: any) => ({
        ...msg,
        user_role: roleMap.get(msg.user_id) || 'user'
      })).reverse(); // Reverse to show oldest first
      
      setMessages(messagesWithRoles as PublicMessage[]);
    }
  };

  const searchAndPlayMusic = async (query: string) => {
    setIsSearchingMusic(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-api', {
        body: { action: 'search', query: `${query} music audio`, maxResults: 1 }
      });

      if (error || !data?.success || !data?.data?.length) {
        toast({
          title: 'Not Found',
          description: `Could not find "${query}"`,
          variant: 'destructive'
        });
        return null;
      }

      const video = data.data[0];
      const track: MusicTrack = {
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        duration: video.duration || '0:00',
        channelTitle: video.channelTitle,
        videoId: video.id
      };

      return track;
    } catch (err) {
      console.error('Music search error:', err);
      toast({
        title: 'Error',
        description: 'Failed to search for music',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsSearchingMusic(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isLoading) return;

    setIsLoading(true);
    const content = newMessage.trim();

    // Check for /play command
    if (content.startsWith('/play ')) {
      const songQuery = content.substring(6);
      
      // Post the command message
      await supabase
        .from('public_messages')
        .insert({
          user_id: user.id,
          content: `🎵 Requested: ${songQuery}`,
          reply_to: null
        });

      const track = await searchAndPlayMusic(songQuery);
      if (track) {
        if (!currentTrack) {
          setCurrentTrack(track);
        } else {
          setMusicQueue(prev => [...prev, track]);
        }
        setShowMusicPlayer(true);
        toast({
          title: 'Added to queue',
          description: track.title
        });
      }
      
      setNewMessage('');
      setIsLoading(false);
      return;
    }

    // Check for /askify command
    if (content.startsWith('/askify ')) {
      const question = content.substring(8);
      
      // First post the user's question
      const { data: userMsg, error: userMsgError } = await supabase
        .from('public_messages')
        .insert({
          user_id: user.id,
          content: content,
          reply_to: replyingTo?.id || null
        })
        .select()
        .single();

      if (userMsgError) {
        toast({
          title: 'Error',
          description: 'Failed to send message',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      // Then call the AI
      await supabase.functions.invoke('askify-chat', {
        body: { question, originalMessageId: userMsg.id, userId: user.id }
      });

      setNewMessage('');
      setReplyingTo(null);
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from('public_messages')
      .insert({
        user_id: user.id,
        content,
        reply_to: replyingTo?.id || null
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } else {
      setNewMessage('');
      setReplyingTo(null);

      // Send push notifications to mentioned users
      const mentionMatches = content.match(/@(\w+)/g);
      if (mentionMatches) {
        for (const mention of mentionMatches) {
          const mentionedName = mention.substring(1).toLowerCase();
          const mentionedUser = allProfiles.find(
            p => p.name.toLowerCase().replace(/\s+/g, '') === mentionedName ||
                 p.name.toLowerCase().split(' ')[0] === mentionedName
          );
          if (mentionedUser && mentionedUser.id !== user.id) {
            sendNotification(
              mentionedUser.id,
              `${user.name || 'Someone'} mentioned you`,
              content.length > 100 ? content.substring(0, 100) + '...' : content,
              { type: 'public_message', senderId: user.id, senderName: user.name }
            );
          }
        }
      }

      // Also notify if replying to someone
      if (replyingTo && replyingTo.user_id !== user.id) {
        sendNotification(
          replyingTo.user_id,
          `${user.name || 'Someone'} replied to your message`,
          content.length > 100 ? content.substring(0, 100) + '...' : content,
          { type: 'public_message', senderId: user.id, senderName: user.name }
        );
      }
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

  const handleDeleteMessage = async (messageId: string, isOwnerDelete: boolean = false) => {
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

  const handleDismissDeletedMessage = async (messageId: string) => {
    // Permanently remove the message from database (owner only)
    const { error } = await supabase
      .from('public_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to dismiss message',
        variant: 'destructive'
      });
    } else {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast({
        title: 'Dismissed',
        description: 'Message permanently removed'
      });
    }
  };

  const handleOwnerEditMessage = async (message: PublicMessage) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const getReplyMessage = (replyId: string) => {
    return messages.find(m => m.id === replyId);
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
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full relative">
        <header className="border-b border-border p-2 sm:p-3 md:p-4 bg-background backdrop-blur supports-[backdrop-filter]:bg-background/95 sticky top-0 z-50">
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
              <Button
                variant={showMusicPlayer ? "default" : "ghost"}
                size="icon"
                onClick={() => setShowMusicPlayer(!showMusicPlayer)}
                title="Music Player"
                className="h-7 w-7 sm:h-8 sm:w-8"
              >
                <Music className="h-4 w-4 sm:h-5 sm:w-5" />
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
                const canSeeDeleted = isAdmin;
                const replyMessage = message.reply_to ? getReplyMessage(message.reply_to) : null;
                
                // Hide deleted messages completely for non-admin users
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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium">
                          {isOwnMessage ? 'You' : (message.profiles?.name || 'Anonymous')}
                        </span>
                        {message.user_role && message.user_role !== 'user' && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border shadow-sm ${
                            // Owner/Founder tier - Gold/Yellow prestigious
                            message.user_role === 'owner' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-yellow-300 shadow-yellow-500/30' :
                            message.user_role === 'founder' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-300 shadow-amber-500/30' :
                            message.user_role === 'co_founder' ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white border-orange-300 shadow-orange-500/30' :
                            message.user_role === 'ceo' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-300 shadow-purple-500/30' :
                            // Staff tier
                            message.user_role === 'admin' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-300 shadow-red-500/30' :
                            message.user_role === 'moderator' ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-300 shadow-orange-500/30' :
                            message.user_role === 'friend' ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white border-pink-300 shadow-pink-500/30' :
                            // VIP Tier - Most premium looking
                            message.user_role === 'vip' ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-black border-yellow-200 shadow-yellow-500/40 animate-pulse' :
                            // Premium tier
                            message.user_role === 'premium' ? 'bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white border-fuchsia-300 shadow-fuchsia-500/30' :
                            // Platinum tier - Silver-blue elegant
                            message.user_role === 'platinum' ? 'bg-gradient-to-r from-slate-300 via-cyan-200 to-slate-400 text-slate-800 border-cyan-200 shadow-cyan-500/30' :
                            // Gold tier
                            message.user_role === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-yellow-300 shadow-yellow-500/30' :
                            // Silver tier
                            message.user_role === 'silver' ? 'bg-gradient-to-r from-slate-300 to-gray-400 text-slate-700 border-slate-200 shadow-slate-500/20' :
                            // Elite tier - Deep purple
                            message.user_role === 'elite' ? 'bg-gradient-to-r from-violet-600 to-purple-700 text-white border-violet-400 shadow-violet-500/30' :
                            // Pro tier - Blue professional
                            message.user_role === 'pro' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-300 shadow-blue-500/30' :
                            // Plus tier - Cyan fresh
                            message.user_role === 'plus' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-cyan-300 shadow-cyan-500/30' :
                            // Basic tier - Green starter
                            message.user_role === 'basic' ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white border-emerald-300 shadow-emerald-500/30' :
                            'bg-muted text-muted-foreground border-border'
                          }`}>
                            {message.user_role === 'co_founder' ? '✦ CO-FOUNDER' : 
                             message.user_role === 'owner' ? '👑 OWNER' :
                             message.user_role === 'founder' ? '⭐ FOUNDER' :
                             message.user_role === 'ceo' ? '💎 CEO' :
                             message.user_role === 'admin' ? '🛡️ ADMIN' :
                             message.user_role === 'vip' ? '✨ VIP' :
                             message.user_role === 'premium' ? '💫 PREMIUM' :
                             message.user_role === 'platinum' ? '🏆 PLATINUM' :
                             message.user_role === 'gold' ? '🥇 GOLD' :
                             message.user_role === 'silver' ? '🥈 SILVER' :
                             message.user_role === 'elite' ? '🔥 ELITE' :
                             message.user_role === 'pro' ? '⚡ PRO' :
                             message.user_role === 'plus' ? '➕ PLUS' :
                             message.user_role === 'basic' ? '✓ BASIC' :
                             message.user_role.toUpperCase()}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.created_at)}
                        </span>
                        {message.edited_at && (
                          <span className="text-xs text-muted-foreground italic">
                            (edited)
                          </span>
                        )}
                      </div>
                      {/* Reply indicator */}
                      {replyMessage && (
                        <div className={`text-xs text-muted-foreground mb-1 px-2 py-1 rounded bg-muted/50 border-l-2 border-primary ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                          <span className="font-medium">↩ {replyMessage.profiles?.name || 'Unknown'}: </span>
                          <span className="truncate max-w-[150px] inline-block align-bottom">
                            {replyMessage.content.substring(0, 50)}{replyMessage.content.length > 50 ? '...' : ''}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isDeleted 
                              ? 'bg-destructive/20 text-destructive'
                              : isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {isDeleted && isAdmin ? (
                              <>
                                <span className="text-destructive font-medium">[Deleted by {message.deleted_by === message.user_id ? 'user' : 'admin'}]</span>
                                <br />
                                <span className="line-through">{message.content}</span>
                              </>
                            ) : (
                              renderMessageContent(message.content)
                            )}
                          </p>
                        </div>
                        {/* Dismiss button for deleted messages (owner only) */}
                        {isDeleted && isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleDismissDeletedMessage(message.id)}
                            title="Permanently remove"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Show dropdown for own messages OR admin/owner */}
                        {!isDeleted && (isOwnMessage || isAdmin) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setReplyingTo(message)}
                              >
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              {(isOwnMessage || isAdmin) && (
                                <DropdownMenuItem
                                  onClick={() => handleOwnerEditMessage(message)}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {(isOwnMessage || isAdmin) && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMessage(message.id, isAdmin && !isOwnMessage)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                              {isAdmin && !isOwnMessage && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setModeratingUser({ 
                                      userId: message.user_id, 
                                      userName: message.profiles?.name || 'User' 
                                    })}
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Moderate User
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {/* Reply button for non-deleted messages for all users */}
                        {!isDeleted && !isOwnMessage && !isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => setReplyingTo(message)}
                          >
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
            <div className="mb-2 flex items-center gap-2 text-xs bg-muted/50 p-2 rounded border-l-2 border-primary">
              <Reply className="h-3 w-3" />
              <span className="text-muted-foreground">Replying to</span>
              <span className="font-medium">{replyingTo.profiles?.name}</span>
              <span className="text-muted-foreground truncate max-w-[200px]">
                {replyingTo.content.substring(0, 30)}{replyingTo.content.length > 30 ? '...' : ''}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-auto"
                onClick={() => setReplyingTo(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="mb-2 text-xs text-muted-foreground">
            Tip: /play [song] to play music • /askify [question] for AI help • @username to mention
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={replyingTo ? `Reply to ${replyingTo.profiles?.name}...` : "Type a message..."}
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
        <PublicChatMusicPlayer
          isVisible={showMusicPlayer}
          onClose={() => setShowMusicPlayer(false)}
          currentTrack={currentTrack}
          queue={musicQueue}
          onQueueUpdate={(newQueue) => {
            if (newQueue.length < musicQueue.length && currentTrack && newQueue.length === musicQueue.length - 1) {
              // Track was removed, play the next one
              const removedIndex = musicQueue.findIndex((t, i) => !newQueue[i] || newQueue[i].id !== t.id);
              if (removedIndex === -1) {
                // First track played
                const [next, ...rest] = musicQueue;
                setCurrentTrack(next || null);
                setMusicQueue(rest);
              }
            }
            setMusicQueue(newQueue);
          }}
        />

        {/* User Moderation Dialog */}
        {moderatingUser && (
          <UserModerationDialog
            isOpen={!!moderatingUser}
            onClose={() => {
              setModeratingUser(null);
              setUserRestrictionData(null);
            }}
            userId={moderatingUser.userId}
            userName={moderatingUser.userName}
            currentlyBanned={userRestrictionData?.banned_from_public_chat}
            currentTimeout={userRestrictionData?.public_chat_timeout_until}
          />
        )}
      </div>
    </div>
  );
};

export default PublicChat;
