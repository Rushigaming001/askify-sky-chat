import { Message } from '@/contexts/ChatContext';
import { User } from 'lucide-react';
import logo from '@/assets/logo.png';

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 p-6 ${isUser ? 'bg-background' : 'bg-muted/30'}`}>
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
        isUser ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-primary/20 to-accent'
      }`}>
        {isUser ? <User className="h-5 w-5" /> : <img src={logo} alt="Askify" className="h-6 w-6 object-contain" />}
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
