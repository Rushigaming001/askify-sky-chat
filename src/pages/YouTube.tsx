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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Play, Clock, ThumbsUp, Eye, Menu, Home, Flame, Smartphone, Film, Music, Gamepad2, Newspaper, Trophy, Lightbulb, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  views: string;
  duration: string;
  uploadedAt: string;
  isShort?: boolean;
}

// Sample video data - in production you'd use YouTube Data API
const sampleVideos: Video[] = [
  { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', channel: 'Rick Astley', views: '1.5B', duration: '3:33', uploadedAt: '14 years ago' },
  { id: 'jNQXAC9IVRw', title: 'Me at the zoo', thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg', channel: 'jawed', views: '300M', duration: '0:19', uploadedAt: '19 years ago' },
  { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE', thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg', channel: 'officialpsy', views: '5B', duration: '4:13', uploadedAt: '12 years ago' },
  { id: 'kJQP7kiw5Fk', title: 'Despacito', thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg', channel: 'Luis Fonsi', views: '8.3B', duration: '4:42', uploadedAt: '8 years ago' },
  { id: 'JGwWNGJdvx8', title: 'Shape of You', thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg', channel: 'Ed Sheeran', views: '6.2B', duration: '4:24', uploadedAt: '8 years ago' },
  { id: 'RgKAFK5djSk', title: 'See You Again', thumbnail: 'https://img.youtube.com/vi/RgKAFK5djSk/maxresdefault.jpg', channel: 'Wiz Khalifa', views: '5.9B', duration: '3:58', uploadedAt: '10 years ago' },
];

const sampleShorts: Video[] = [
  { id: 'short1', title: 'Amazing Magic Trick! 🎩', thumbnail: 'https://picsum.photos/seed/short1/400/700', channel: 'Magic Channel', views: '15M', duration: '0:30', uploadedAt: '2 days ago', isShort: true },
  { id: 'short2', title: 'Cat does funny thing 😹', thumbnail: 'https://picsum.photos/seed/short2/400/700', channel: 'Funny Cats', views: '8M', duration: '0:15', uploadedAt: '1 day ago', isShort: true },
  { id: 'short3', title: 'Cooking hack you need!', thumbnail: 'https://picsum.photos/seed/short3/400/700', channel: 'Quick Recipes', views: '3M', duration: '0:45', uploadedAt: '5 hours ago', isShort: true },
  { id: 'short4', title: 'Satisfying slime ASMR', thumbnail: 'https://picsum.photos/seed/short4/400/700', channel: 'ASMR World', views: '22M', duration: '0:58', uploadedAt: '3 days ago', isShort: true },
  { id: 'short5', title: 'Dance tutorial 💃', thumbnail: 'https://picsum.photos/seed/short5/400/700', channel: 'Dance With Me', views: '5M', duration: '0:40', uploadedAt: '1 week ago', isShort: true },
  { id: 'short6', title: 'Mind-blowing science!', thumbnail: 'https://picsum.photos/seed/short6/400/700', channel: 'Science Fun', views: '12M', duration: '0:55', uploadedAt: '4 days ago', isShort: true },
];

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

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: 'Searching...',
        description: `Searching for "${searchQuery}"`
      });
      // In production, this would call YouTube Data API
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
    setCurrentShortIndex((prev) => (prev + 1) % sampleShorts.length);
  };

  const prevShort = () => {
    setCurrentShortIndex((prev) => (prev - 1 + sampleShorts.length) % sampleShorts.length);
  };

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
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
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
                <h2 className="text-xl font-bold mb-4">Recommended Videos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sampleVideos.map((video) => (
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
                        <Badge className="absolute bottom-2 right-2 bg-black/80 text-white">
                          {video.duration}
                        </Badge>
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
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {video.views}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {video.uploadedAt}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="shorts">
                <h2 className="text-xl font-bold mb-4">Shorts</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {sampleShorts.map((short, index) => (
                    <div 
                      key={short.id}
                      className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group"
                      onClick={() => playShort(index)}
                    >
                      <img 
                        src={short.thumbnail}
                        alt={short.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-medium line-clamp-2">{short.title}</p>
                        <p className="text-white/70 text-xs mt-1">{short.views} views</p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <Play className="h-10 w-10 text-white fill-white" />
                      </div>
                    </div>
                  ))}
                </div>
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
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {selectedVideo?.views}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                Like
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shorts Player */}
      <Dialog open={showShortPlayer} onOpenChange={setShowShortPlayer}>
        <DialogContent className="max-w-sm p-0 bg-black border-0">
          <div className="relative aspect-[9/16] w-full bg-black rounded-lg overflow-hidden">
            <img 
              src={sampleShorts[currentShortIndex]?.thumbnail}
              alt={sampleShorts[currentShortIndex]?.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
              onClick={() => setShowShortPlayer(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white font-bold">{sampleShorts[currentShortIndex]?.title}</p>
              <p className="text-white/70 text-sm">{sampleShorts[currentShortIndex]?.channel}</p>
              <div className="flex items-center gap-4 mt-2 text-white/70 text-xs">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  Like
                </span>
                <span>{sampleShorts[currentShortIndex]?.views} views</span>
              </div>
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
