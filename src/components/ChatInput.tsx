import { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Brain, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onModeChange: (mode: 'normal' | 'deepthink' | 'search') => void;
  mode: 'normal' | 'deepthink' | 'search';
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, onModeChange, mode, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
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
    const files = e.target.files;
    if (files && files.length > 0) {
      toast({
        title: 'File uploaded',
        description: `${files[0].name} has been attached`
      });
    }
  };

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Toggle
            pressed={mode === 'deepthink'}
            onPressedChange={(pressed) => onModeChange(pressed ? 'deepthink' : 'normal')}
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Brain className="h-4 w-4 mr-2" />
            DeepThink
          </Toggle>
          <Toggle
            pressed={mode === 'search'}
            onPressedChange={(pressed) => onModeChange(pressed ? 'search' : 'normal')}
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Toggle>
        </div>

        <div className="relative flex items-end gap-2 p-2 rounded-2xl border border-border bg-background shadow-lg">
          <Popover open={showEmoji} onOpenChange={setShowEmoji}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <Smile className="h-5 w-5" />
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
            accept="*/*"
          />
          <Button variant="ghost" size="icon" onClick={handleFileUpload} className="flex-shrink-0">
            <Paperclip className="h-5 w-5" />
          </Button>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Askify..."
            className="min-h-[60px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            disabled={disabled}
          />

          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="icon"
            className="flex-shrink-0 rounded-xl h-10 w-10"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
