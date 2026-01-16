import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Paperclip, Smile, Image, X, Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ChatMediaInputProps {
  onSend: (content: string, imageUrl?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  userId?: string;
}

// Popular GIF categories
const GIF_CATEGORIES = ['trending', 'happy', 'sad', 'love', 'laugh', 'excited', 'angry', 'thumbs up'];

export function ChatMediaInput({ onSend, placeholder = "Type a message...", disabled, userId }: ChatMediaInputProps) {
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState<string[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 10MB', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !userId) return null;
    
    setIsUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `chat/${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, imageFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && !imagePreview) || disabled || isUploading) return;

    let imageUrl: string | undefined;
    
    if (imageFile) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    } else if (imagePreview && imagePreview.startsWith('http')) {
      // It's a GIF URL
      imageUrl = imagePreview;
    }

    onSend(message.trim(), imageUrl);
    setMessage('');
    removeImage();
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const searchGifs = async (query: string) => {
    setLoadingGifs(true);
    try {
      // Using Tenor API (free tier)
      const searchTerm = query || 'trending';
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=AIzaSyDDAk-l5fBM4FhWnhLmLqF7mLwdMI2NnC8&limit=20&media_filter=gif`
      );
      const data = await response.json();
      const gifUrls = data.results?.map((r: any) => r.media_formats?.gif?.url || r.media_formats?.tinygif?.url).filter(Boolean) || [];
      setGifs(gifUrls);
    } catch (error) {
      console.error('GIF search error:', error);
      // Fallback to simple placeholder GIFs
      setGifs([]);
    } finally {
      setLoadingGifs(false);
    }
  };

  const selectGif = (gifUrl: string) => {
    setImagePreview(gifUrl);
    setShowGifPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-2">
      {/* Image Preview */}
      {imagePreview && (
        <div className="relative inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="max-h-32 rounded-lg border border-border"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Attachment Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
              <Paperclip className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="h-4 w-4" />
                Upload Image
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowGifPicker(true);
                  searchGifs('trending');
                }}
              >
                <span className="text-sm">GIF</span>
                Search GIFs
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Message Input */}
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className="flex-1"
        />

        {/* Emoji Picker */}
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end" side="top">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </PopoverContent>
        </Popover>

        {/* Send Button */}
        <Button 
          onClick={handleSend}
          size="icon"
          disabled={(!message.trim() && !imagePreview) || disabled || isUploading}
          className="h-9 w-9 flex-shrink-0"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* GIF Picker Modal */}
      {showGifPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md max-h-[70vh] flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Search GIFs</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowGifPicker(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={gifSearch}
                  onChange={(e) => setGifSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchGifs(gifSearch)}
                  placeholder="Search for GIFs..."
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {GIF_CATEGORIES.map(cat => (
                  <Button
                    key={cat}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setGifSearch(cat);
                      searchGifs(cat);
                    }}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1 p-3">
              {loadingGifs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : gifs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No GIFs found. Try searching for something!
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {gifs.map((gif, i) => (
                    <img
                      key={i}
                      src={gif}
                      alt="GIF"
                      className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => selectGif(gif)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}