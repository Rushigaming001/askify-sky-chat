import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Paperclip, Smile, Brain, Search, Sparkles, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (message: string, image?: string) => void;
  onModeChange: (mode: 'normal' | 'deepthink' | 'search' | 'reasoning') => void;
  mode: 'normal' | 'deepthink' | 'search' | 'reasoning';
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, onModeChange, mode, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSend = () => {
    if ((message.trim() || attachedImage) && !disabled) {
      onSendMessage(message, attachedImage || undefined);
      setMessage('');
      setAttachedImage(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
        toast({
          title: 'Image attached',
          description: `${file.name} is ready to send`
        });
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive'
      });
    }
    e.target.value = '';
  };

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Toggle
            pressed={mode === 'deepthink'}
            onPressedChange={(pressed) => onModeChange(pressed ? 'deepthink' : 'normal')}
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs sm:text-sm h-8 px-2 sm:px-3"
          >
            <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">DeepThink</span>
            <span className="sm:hidden">Deep</span>
          </Toggle>
          <Toggle
            pressed={mode === 'reasoning'}
            onPressedChange={(pressed) => onModeChange(pressed ? 'reasoning' : 'normal')}
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs sm:text-sm h-8 px-2 sm:px-3"
          >
            <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Reasoning</span>
            <span className="sm:hidden">Reason</span>
          </Toggle>
          <Toggle
            pressed={mode === 'search'}
            onPressedChange={(pressed) => onModeChange(pressed ? 'search' : 'normal')}
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs sm:text-sm h-8 px-2 sm:px-3"
          >
            <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Search
          </Toggle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/ai-features')}
            className="ml-auto text-xs sm:text-sm h-8 px-2 sm:px-3"
          >
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">AI Features</span>
            <span className="sm:hidden">AI</span>
          </Button>
        </div>

        <div className="relative flex items-end gap-1 sm:gap-2 p-2 rounded-2xl border border-border bg-background shadow-lg">
          <Popover open={showEmoji} onOpenChange={setShowEmoji}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-auto p-0 border-0">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </PopoverContent>
          </Popover>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
          />
          <Button variant="ghost" size="icon" onClick={handleFileUpload} className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
            <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="flex-1 space-y-2">
            {attachedImage && (
              <div className="relative inline-block">
                <img 
                  src={attachedImage} 
                  alt="Attached" 
                  className="h-20 rounded-lg border border-border"
                />
                <button
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                >
                  ×
                </button>
              </div>
            )}
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Askify..."
              className="min-h-[50px] sm:min-h-[60px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm sm:text-base"
              disabled={disabled}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={(!message.trim() && !attachedImage) || disabled}
            size="icon"
            className="flex-shrink-0 rounded-xl h-9 w-9 sm:h-10 sm:w-10"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
