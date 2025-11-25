import { Message } from '@/contexts/ChatContext';
import { User, Sparkles } from 'lucide-react';

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 p-6 ${isUser ? 'bg-background' : 'bg-muted/30'}`}>
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-primary text-primary-foreground' : 'bg-accent text-primary'
      }`}>
        {isUser ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </div>
      <div className="flex-1 space-y-2">
        <div className="text-sm font-medium text-muted-foreground">
          {isUser ? 'You' : 'Askify'}
        </div>
        {message.image && (
          <img 
            src={message.image} 
            alt="Attached" 
            className="max-w-xs max-h-64 object-contain rounded-lg border border-border shadow-sm"
          />
        )}
        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  );
}
