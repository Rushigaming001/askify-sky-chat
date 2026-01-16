import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Search, Loader2 } from 'lucide-react';

interface GifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (gifUrl: string) => void;
}

const GIF_CATEGORIES = [
  'trending', 'reactions', 'happy', 'sad', 'love', 'laugh', 
  'excited', 'angry', 'dance', 'celebrate', 'thank you', 'hello',
  'bye', 'yes', 'no', 'omg', 'wow', 'cool', 'cute', 'funny'
];

// Tenor API key (public, rate-limited)
const TENOR_API_KEY = 'AIzaSyDDAk-l5fBM4FhWnhLmLqF7mLwdMI2NnC8';

export function GifPicker({ isOpen, onClose, onSelect }: GifPickerProps) {
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      searchGifs('trending');
    }
  }, [isOpen]);

  const searchGifs = async (query: string) => {
    setLoading(true);
    try {
      const searchTerm = query || 'trending';
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${TENOR_API_KEY}&limit=30&media_filter=gif,tinygif`
      );
      const data = await response.json();
      
      const gifUrls = data.results?.map((r: any) => 
        r.media_formats?.gif?.url || r.media_formats?.tinygif?.url
      ).filter(Boolean) || [];
      
      setGifs(gifUrls);
    } catch (error) {
      console.error('GIF search error:', error);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      searchGifs(search);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h3 className="font-bold text-lg">🎬 Search GIFs</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for GIFs..."
              className="pl-10 pr-20"
            />
            <Button 
              type="submit" 
              size="sm" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
            >
              Search
            </Button>
          </form>
          
          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            {GIF_CATEGORIES.slice(0, 12).map(cat => (
              <Button
                key={cat}
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => {
                  setSearch(cat);
                  searchGifs(cat);
                }}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* GIF Grid */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : gifs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No GIFs found</p>
              <p className="text-sm">Try searching for something else!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gifs.map((gif, i) => (
                <button
                  key={`${gif}-${i}`}
                  className="relative aspect-video rounded-lg overflow-hidden border border-border hover:border-primary hover:ring-2 hover:ring-primary/50 transition-all group"
                  onClick={() => {
                    onSelect(gif);
                    onClose();
                  }}
                >
                  <img
                    src={gif}
                    alt="GIF"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-border text-center text-xs text-muted-foreground bg-muted/30">
          Powered by Tenor
        </div>
      </div>
    </div>
  );
}