import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, Play, Clock, ThumbsUp, Eye, Menu, Home, Flame, Smartphone, Film, Music, Gamepad2, Newspaper, Trophy, Lightbulb, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  channelId?: string;
  views: string;
  viewCount?: string;
  duration?: string;
  uploadedAt: string;
  description?: string;
  isShort?: boolean;
}

const categories = [
  { id: 'all', label: 'All', icon: Home },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'learning', label: 'Learning', icon: Lightbulb },
  { id: 'movies', label: 'Movies', icon: Film },
];

const YouTube = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activeTab, setActiveTab] = useState('videos');
  const [currentShortIndex, setCurrentShortIndex] = useState(0);
  const [showShortPlayer, setShowShortPlayer] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchTrendingVideos();
    fetchShorts();
  }, []);

  useEffect(() => {
    if (selectedCategory !== 'all') {
      searchVideos(selectedCategory);
    } else {
      fetchTrendingVideos();
    }
  }, [selectedCategory]);

  const fetchTrendingVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-api', {
        body: { action: 'trending', maxResults: 24 }
      });

      if (error) throw error;
      if (data.success && data.data) {
        setVideos(data.data);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load videos. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchShorts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('youtube-api', {
        body: { action: 'shorts', maxResults: 12 }
      });

      if (error) throw error;
      if (data.success && data.data) {
        setShorts(data.data.map((v: Video) => ({ ...v, isShort: true })));
      }
    } catch (error) {
      console.error('Error fetching shorts:', error);
    }
  };

  const searchVideos = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-api', {
        body: { action: 'search', query, maxResults: 24 }
      });

      if (error) throw error;
      if (data.success && data.data) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Error searching videos:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search videos.',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await searchVideos(searchQuery);
      toast({
        title: 'Search Results',
        description: `Found videos for "${searchQuery}"`
      });
    }
  };

  const playVideo = (video: Video) => {
    setSelectedVideo(video);
  };

  const playShort = (index: number) => {
    setCurrentShortIndex(index);
    setShowShortPlayer(true);
  };

  const nextShort = () => {
    setCurrentShortIndex((prev) => (prev + 1) % shorts.length);
  };

  const prevShort = () => {
    setCurrentShortIndex((prev) => (prev - 1 + shorts.length) % shorts.length);
  };

  const displayVideos = searchResults.length > 0 ? searchResults : videos;

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-border px-4 py-3 flex items-center gap-4 bg-background/95 backdrop-blur">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-1.5 rounded-lg">
              <Play className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold hidden sm:block">YouTube</span>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-secondary/50"
              />
            </div>
            <Button type="submit" variant="secondary" disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>
        </header>

        {/* Category Tabs */}
        <div className="border-b border-border px-4 py-2 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'secondary'}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <cat.icon className="h-4 w-4 mr-1" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="videos" className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  Videos
                </TabsTrigger>
                <TabsTrigger value="shorts" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Shorts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="videos">
                <h2 className="text-xl font-bold mb-4">
                  {searchResults.length > 0 ? `Search Results for "${searchQuery}"` : 'Trending Videos'}
                </h2>
                
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayVideos.map((video) => (
                      <Card 
                        key={video.id} 
                        className="cursor-pointer group hover:shadow-lg transition-all duration-300 overflow-hidden"
                        onClick={() => playVideo(video)}
                      >
                        <div className="relative aspect-video overflow-hidden">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${video.id}/640/360`;
                            }}
                          />
                          {video.duration && (
                            <Badge className="absolute bottom-2 right-2 bg-black/80 text-white">
                              {video.duration}
                            </Badge>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-semibold line-clamp-2 text-sm mb-1 group-hover:text-primary transition-colors">
                            {video.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">{video.channel}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            {video.views && (
                              <>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {video.views}
                                </span>
                                <span>•</span>
                              </>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {video.uploadedAt}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shorts">
                <h2 className="text-xl font-bold mb-4">Shorts</h2>
                {shorts.length === 0 ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {shorts.map((short, index) => (
                      <div 
                        key={short.id}
                        className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group"
                        onClick={() => playShort(index)}
                      >
                        <img 
                          src={short.thumbnail}
                          alt={short.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${short.id}/400/700`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-xs font-medium line-clamp-2">{short.title}</p>
                          <p className="text-white/70 text-xs mt-1">{short.channel}</p>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                          <Play className="h-10 w-10 text-white fill-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-0">
          <div className="aspect-video w-full bg-black">
            {selectedVideo && (
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          <div className="p-4">
            <h2 className="text-lg font-bold">{selectedVideo?.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{selectedVideo?.channel}</span>
              {selectedVideo?.views && (
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {selectedVideo.views}
                </span>
              )}
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                Like
              </span>
            </div>
            {selectedVideo?.description && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                {selectedVideo.description}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Shorts Player */}
      <Dialog open={showShortPlayer} onOpenChange={setShowShortPlayer}>
        <DialogContent className="max-w-sm p-0 bg-black border-0">
          <div className="relative aspect-[9/16] w-full bg-black rounded-lg overflow-hidden">
            {shorts[currentShortIndex] && (
              <iframe
                src={`https://www.youtube.com/embed/${shorts[currentShortIndex].id}?autoplay=1&loop=1`}
                title={shorts[currentShortIndex].title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20 z-10"
              onClick={() => setShowShortPlayer(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
              <p className="text-white font-bold">{shorts[currentShortIndex]?.title}</p>
              <p className="text-white/70 text-sm">{shorts[currentShortIndex]?.channel}</p>
            </div>

            {/* Navigation */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 pointer-events-auto"
                onClick={prevShort}
              >
                ←
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 pointer-events-auto"
                onClick={nextShort}
              >
                →
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default YouTube;
