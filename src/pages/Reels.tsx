import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, MoreVertical, Plus, Loader2, Camera, ChevronUp, ChevronDown, MessageSquare, Users, Phone, Pencil } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption?: string | null;
  created_at: string;
  view_count: number;
  profiles?: { name: string; avatar_url?: string | null } | null;
}

interface Channel {
  id: string;
  name: string;
  avatar_url?: string | null;
  follower_count: number;
  verified?: boolean;
}

const Reels = () => {
  useRequireAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [myStory, setMyStory] = useState<Story | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'chats' | 'updates' | 'communities' | 'calls'>('updates');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load stories (recent updates)
      const { data: storiesData } = await supabase
        .from('stories')
        .select('*, profiles!stories_user_id_fkey(name, avatar_url)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      const otherStories = (storiesData || []).filter(s => s.user_id !== user.id);
      const userStory = (storiesData || []).find(s => s.user_id === user.id);
      setStories(otherStories);
      setMyStory(userStory || null);

      // Load follows for channels
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      setFollowing(new Set(followData?.map(f => f.following_id) || []));

      // Load suggested channels (top users with most followers)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .limit(10);

      // Get follower counts
      const channelData: Channel[] = [];
      for (const profile of profilesData || []) {
        if (profile.id === user.id) continue;
        const { count } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id);
        channelData.push({
          id: profile.id,
          name: profile.name,
          avatar_url: profile.avatar_url,
          follower_count: count || 0,
          verified: (count || 0) > 100,
        });
      }
      channelData.sort((a, b) => b.follower_count - a.follower_count);
      setChannels(channelData.slice(0, 8));
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 15MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('stories').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(fileName);
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

      await supabase.from('stories').insert({
        user_id: user.id,
        media_url: publicUrl,
        media_type: mediaType,
      });

      toast({ title: 'Status posted! ✨' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    try {
      if (following.has(targetId)) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
        setFollowing(prev => { const n = new Set(prev); n.delete(targetId); return n; });
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
        setFollowing(prev => new Set(prev).add(targetId));
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${Math.round(count / 1000)}K`;
    return count.toString();
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background px-4 py-3 flex items-center justify-between border-b border-border">
        <h1 className="text-2xl font-bold">Updates</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="pb-24">
          {/* Status Section */}
          <div className="px-4 pt-4">
            <h2 className="text-lg font-semibold mb-3">Status</h2>
            
            {/* My Status */}
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <div className="relative">
                <Avatar className="h-14 w-14 bg-primary/10">
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    {user?.email?.[0].toUpperCase() || 'Y'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                  {uploading ? (
                    <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-primary-foreground" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium">Add status</p>
                <p className="text-sm text-muted-foreground">Disappears after 24 hours</p>
              </div>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>

            {/* Recent Updates */}
            {stories.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground mb-3">Recent updates</p>
                <div className="space-y-3">
                  {stories.map(story => (
                    <div
                      key={story.id}
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => navigate(`/status/${story.id}`)}
                    >
                      <div className="relative">
                        <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary via-primary/80 to-primary/60">
                          <Avatar className="h-12 w-12 border-2 border-background">
                            {story.profiles?.avatar_url ? (
                              <AvatarImage src={story.profiles.avatar_url} />
                            ) : null}
                            <AvatarFallback>{getInitials(story.profiles?.name || 'U')}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{story.profiles?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Channels Section */}
          <div className="px-4 pt-8">
            <h2 className="text-lg font-semibold mb-1">Channels</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Stay updated on topics that matter to you. Find channels to follow below.
            </p>

            {/* Find Channels Header */}
            <button
              onClick={() => setChannelsExpanded(!channelsExpanded)}
              className="w-full flex items-center justify-between py-3 text-sm text-muted-foreground"
            >
              <span>Find channels to follow</span>
              {channelsExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {/* Channel List */}
            {channelsExpanded && (
              <div className="space-y-1">
                {channels.map(channel => (
                  <div key={channel.id} className="flex items-center gap-3 py-3">
                    <Avatar className="h-12 w-12">
                      {channel.avatar_url ? <AvatarImage src={channel.avatar_url} /> : null}
                      <AvatarFallback className="bg-muted">{getInitials(channel.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-medium truncate">{channel.name}</p>
                        {channel.verified && (
                          <svg className="h-4 w-4 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{formatCount(channel.follower_count)} followers</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`rounded-full px-4 ${following.has(channel.id) ? 'bg-muted' : 'text-primary border-primary hover:bg-primary/10'}`}
                      onClick={() => handleFollow(channel.id)}
                    >
                      {following.has(channel.id) ? 'Following' : 'Follow'}
                    </Button>
                  </div>
                ))}
                {channels.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No channels to show</p>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Floating Action Buttons */}
      <div className="fixed right-4 bottom-24 flex flex-col gap-3">
        <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full shadow-lg">
          <Pencil className="h-5 w-5" />
        </Button>
        <label>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary/90 transition-colors">
            <Camera className="h-6 w-6 text-primary-foreground" />
          </div>
        </label>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border flex items-center justify-around py-2 z-20">
        <button
          onClick={() => navigate('/public-chat')}
          className={`flex flex-col items-center gap-1 px-4 py-2 ${activeTab === 'chats' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">3</span>
          </div>
          <span className="text-xs">Chats</span>
        </button>

        <button
          onClick={() => {}}
          className={`flex flex-col items-center gap-1 px-4 py-2 ${activeTab === 'updates' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <div className="bg-primary/10 rounded-full p-1.5">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <span className="text-xs font-medium">Updates</span>
        </button>

        <button
          onClick={() => navigate('/friends-chat')}
          className={`flex flex-col items-center gap-1 px-4 py-2 ${activeTab === 'communities' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Users className="h-6 w-6" />
          <span className="text-xs">Communities</span>
        </button>

        <button
          onClick={() => {}}
          className={`flex flex-col items-center gap-1 px-4 py-2 ${activeTab === 'calls' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Phone className="h-6 w-6" />
          <span className="text-xs">Calls</span>
        </button>
      </nav>
    </div>
  );
};

export default Reels;