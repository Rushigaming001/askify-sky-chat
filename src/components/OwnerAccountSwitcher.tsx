import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, Search, MessageSquare, Users, ArrowLeft, Mail, X } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

interface AIChat {
  id: string;
  title: string;
  model: string;
  mode: string;
  created_at: string;
  updated_at: string;
}

interface DirectMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender_name?: string;
  receiver_name?: string;
}

export function OwnerAccountSwitcher() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingUser, setViewingUser] = useState<Profile | null>(null);
  const [userAIChats, setUserAIChats] = useState<AIChat[]>([]);
  const [userDMs, setUserDMs] = useState<DirectMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = profiles.filter(
        p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             p.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProfiles(filtered);
    } else {
      setFilteredProfiles(profiles);
    }
  }, [searchQuery, profiles]);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url')
        .order('name');
      
      if (error) throw error;
      setProfiles(data || []);
      setFilteredProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const viewUserActivity = async (user: Profile) => {
    setViewingUser(user);
    setLoadingActivity(true);
    setSelectedChat(null);
    setChatMessages([]);

    try {
      // Load AI chats
      const { data: chats, error: chatsError } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (chatsError) throw chatsError;
      setUserAIChats(chats || []);

      // Load DMs (sent and received)
      const { data: sentDMs, error: sentError } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: receivedDMs, error: receivedError } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (sentError || receivedError) throw sentError || receivedError;

      // Combine and sort DMs
      const allDMs = [...(sentDMs || []), ...(receivedDMs || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Get unique user IDs from DMs
      const userIds = [...new Set([
        ...allDMs.map(dm => dm.sender_id),
        ...allDMs.map(dm => dm.receiver_id)
      ])];

      // Fetch profile names
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        const profileMap = new Map(profilesData?.map(p => [p.id, p.name]) || []);

        const dmsWithNames = allDMs.map(dm => ({
          ...dm,
          sender_name: profileMap.get(dm.sender_id) || 'Unknown',
          receiver_name: profileMap.get(dm.receiver_id) || 'Unknown'
        }));

        setUserDMs(dmsWithNames);
      } else {
        setUserDMs([]);
      }
    } catch (error) {
      console.error('Error loading user activity:', error);
      toast.error('Failed to load user activity');
    } finally {
      setLoadingActivity(false);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    setSelectedChat(chatId);
    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setChatMessages(data || []);
    } catch (error) {
      console.error('Error loading chat messages:', error);
      toast.error('Failed to load chat messages');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          View User Activity
        </CardTitle>
        <CardDescription>
          Switch to any user's account to view their AI chats and DMs (Owner Only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Users List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
                    <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-sm text-muted-foreground">{profile.email}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewUserActivity(profile)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Activity
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User Activity Dialog */}
        <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {viewingUser && (
                  <>
                    <Avatar className="h-8 w-8">
                      {viewingUser.avatar_url && <AvatarImage src={viewingUser.avatar_url} />}
                      <AvatarFallback>{getInitials(viewingUser.name)}</AvatarFallback>
                    </Avatar>
                    <span>{viewingUser.name}'s Activity</span>
                    <Badge variant="outline">{viewingUser.email}</Badge>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            {loadingActivity ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Tabs defaultValue="ai-chats" className="flex-1">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ai-chats" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    AI Chats ({userAIChats.length})
                  </TabsTrigger>
                  <TabsTrigger value="dms" className="gap-2">
                    <Mail className="h-4 w-4" />
                    DMs ({userDMs.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ai-chats" className="mt-4">
                  <div className="flex gap-4 h-[400px]">
                    {/* Chat List */}
                    <ScrollArea className="w-1/3 border rounded-lg p-2">
                      {userAIChats.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No AI chats found
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {userAIChats.map((chat) => (
                            <div
                              key={chat.id}
                              className={`p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedChat === chat.id 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-accent'
                              }`}
                              onClick={() => loadChatMessages(chat.id)}
                            >
                              <div className="font-medium text-sm truncate">{chat.title}</div>
                              <div className="text-xs opacity-70">
                                {chat.model} • {formatDate(chat.updated_at)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Messages View */}
                    <ScrollArea className="flex-1 border rounded-lg p-3">
                      {!selectedChat ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Select a chat to view messages
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-2 rounded-lg ${
                                msg.role === 'user' 
                                  ? 'bg-primary/10 ml-8' 
                                  : 'bg-muted mr-8'
                              }`}
                            >
                              <div className="text-xs font-medium mb-1 text-muted-foreground">
                                {msg.role === 'user' ? 'User' : 'AI'}
                              </div>
                              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="dms" className="mt-4">
                  <ScrollArea className="h-[400px] border rounded-lg p-3">
                    {userDMs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No direct messages found
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userDMs.map((dm) => {
                          const isSender = dm.sender_id === viewingUser?.id;
                          return (
                            <div
                              key={dm.id}
                              className={`p-3 rounded-lg ${isSender ? 'bg-primary/10' : 'bg-muted'}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">
                                  {isSender ? `To: ${dm.receiver_name}` : `From: ${dm.sender_name}`}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(dm.created_at)}
                                </span>
                              </div>
                              <p className="text-sm">{dm.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default OwnerAccountSwitcher;
