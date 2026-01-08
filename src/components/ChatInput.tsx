import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Paperclip, Smile, Brain, Search, Sparkles, Lightbulb, Camera, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { MemoryDialog } from '@/components/MemoryDialog';

interface ChatInputProps {
  onSendMessage: (message: string, images?: string[]) => void;
  onModeChange: (mode: 'normal' | 'deepthink' | 'search' | 'reasoning') => void;
  mode: 'normal' | 'deepthink' | 'search' | 'reasoning';
  disabled?: boolean;
  centered?: boolean;
}

export function ChatInput({ onSendMessage, onModeChange, mode, disabled, centered = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const MAX_IMAGES = 100;

  // Handle Ctrl+V paste for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const processImageFile = (file: File) => {
    if (attachedImages.length >= MAX_IMAGES) {
      toast({
        title: 'Maximum images reached',
        description: `You can attach up to ${MAX_IMAGES} images`,
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: 'File too large',
        description: 'Please select an image under 10MB',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImages(prev => [...prev, reader.result as string]);
      toast({
        title: 'Image attached',
        description: `${file.name || 'Screenshot'} added (${attachedImages.length + 1}/${MAX_IMAGES})`
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((message.trim() || attachedImages.length > 0) && !disabled) {
      // Smart image message handling - add context if only images are sent
      let finalMessage = message;
      if (!message.trim() && attachedImages.length > 0) {
        finalMessage = attachedImages.length === 1 
          ? "Please analyze this image and provide a helpful response."
          : `Please analyze these ${attachedImages.length} images and provide a helpful response.`;
      }
      onSendMessage(finalMessage, attachedImages.length > 0 ? attachedImages : undefined);
      setMessage('');
      setAttachedImages([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          processImageFile(file);
        } else {
          toast({
            title: 'Invalid file',
            description: 'Please select image files only',
            variant: 'destructive'
          });
        }
      });
    }
    e.target.value = '';
  };

  return (
    <div className={`${centered ? '' : 'border-t border-border'} bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-fade-in`}>
      <div className={`max-w-3xl mx-auto ${centered ? 'px-4' : 'p-3 sm:p-4'} space-y-3`}>
        
        {/* Mode toggles row - Only visible when input is at bottom (not centered) */}
        {!centered && (
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <Toggle
                pressed={mode === 'deepthink'}
                onPressedChange={(pressed) => onModeChange(pressed ? 'deepthink' : 'normal')}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs h-7 px-2 hover:scale-105 transition-all duration-200"
              >
                <Brain className="h-3 w-3 mr-1" />
                DeepThink
              </Toggle>
              <Toggle
                pressed={mode === 'reasoning'}
                onPressedChange={(pressed) => onModeChange(pressed ? 'reasoning' : 'normal')}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs h-7 px-2 hover:scale-105 transition-all duration-200"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Reasoning
              </Toggle>
              <Toggle
                pressed={mode === 'search'}
                onPressedChange={(pressed) => onModeChange(pressed ? 'search' : 'normal')}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs h-7 px-2 hover:scale-105 transition-all duration-200"
              >
                <Search className="h-3 w-3 mr-1" />
                Search
              </Toggle>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <MemoryDialog />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/ai-features')}
                className="h-7 px-2 text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                AI Features
              </Button>
            </div>
          </div>
        )}

        {/* Image previews */}
        {attachedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2">
            {attachedImages.map((img, index) => (
              <div key={index} className="relative animate-scale-in">
                <img 
                  src={img} 
                  alt={`Attached ${index + 1}`} 
                  className="h-16 w-16 object-cover rounded-lg border border-border"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-1.5 -right-1.5 bg-black/80 text-white rounded-full w-5 h-5 flex items-center justify-center hover:scale-110 transition-all duration-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-center gap-1 sm:gap-2 p-2 rounded-2xl border border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300">
          {/* Plus button for attachments */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 hover:scale-110 transition-all duration-200">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-auto p-2 animate-scale-in">
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="sm" onClick={handleFileUpload} className="justify-start gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attach Images
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCameraCapture} className="justify-start gap-2 sm:hidden">
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
            multiple
          />
          <input
            ref={cameraInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
          />

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Askify..."
            className="min-h-[40px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm sm:text-base transition-all flex-1"
            disabled={disabled}
            rows={1}
          />

          <Popover open={showEmoji} onOpenChange={setShowEmoji}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 hover:scale-110 transition-all duration-200">
                <Smile className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-auto p-0 border-0 animate-scale-in">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </PopoverContent>
          </Popover>

          <Button
            onClick={handleSend}
            disabled={(!message.trim() && attachedImages.length === 0) || disabled}
            size="icon"
            className="flex-shrink-0 rounded-full h-9 w-9 sm:h-10 sm:w-10 hover:scale-110 transition-all duration-200 disabled:hover:scale-100"
          >
            <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
