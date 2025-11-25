import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Sidebar } from '@/components/Sidebar';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { callAI } from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

const Chat = () => {
  const { user } = useAuth();
  const { currentChat, addMessage, updateChatSettings, createNewChat } = useChat();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'gpt' | 'askify' | 'gpt-mini' | 'gpt-nano' | 'gemini-3'>('gemini');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [currentChat?.messages, isLoading]);

  useEffect(() => {
    if (!currentChat) {
      createNewChat();
    }
  }, []);

  const handleSendMessage = async (content: string, image?: string) => {
    if (!currentChat) return;

    addMessage({ role: 'user', content, image });
    setIsLoading(true);

    try {
      const messages = [
        ...currentChat.messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content }
      ];

      const response = await callAI(messages, selectedModel, currentChat.mode);
      addMessage({ role: 'assistant', content: response });
    } catch (error) {
      console.error('Error calling AI:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response from AI. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (mode: 'normal' | 'deepthink' | 'search') => {
    if (currentChat) {
      updateChatSettings(selectedModel, mode);
    }
  };

  const handleModelChange = (model: 'gemini' | 'gpt' | 'askify' | 'gpt-mini' | 'gpt-nano' | 'gemini-3') => {
    setSelectedModel(model);
    if (currentChat) {
      updateChatSettings(model, currentChat.mode);
    }
  };

  if (!user) return null;

  const showWelcome = !currentChat || currentChat.messages.length === 0;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border p-4 flex items-center justify-between gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wider bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent whitespace-nowrap">
              ASKIFY
            </h1>
          </div>
          <Select value={selectedModel} onValueChange={(v: 'gemini' | 'gpt' | 'askify' | 'gpt-mini' | 'gpt-nano' | 'gemini-3') => handleModelChange(v)}>
            <SelectTrigger className="w-[160px] sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">Gemini Flash</SelectItem>
              <SelectItem value="gpt">GPT-5</SelectItem>
              <SelectItem value="gpt-mini">GPT-5 Mini</SelectItem>
              <SelectItem value="gpt-nano">GPT-5 Nano</SelectItem>
              <SelectItem value="gemini-3">Gemini 3 Pro</SelectItem>
              <SelectItem value="askify">
                <span className="font-semibold tracking-wide">ASKIFY PRO</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </header>

        <ScrollArea className="flex-1 chat-scroll" ref={scrollRef}>
          {showWelcome ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <img src={logo} alt="Askify" className="h-20 w-20 mb-6" />
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                How can I help you?
              </h1>
              <p className="text-muted-foreground max-w-md">
                Ask me anything. I'm powered by advanced AI models to assist you with your questions.
              </p>
            </div>
          ) : (
            <div>
              {currentChat?.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <ChatInput
          onSendMessage={handleSendMessage}
          onModeChange={handleModeChange}
          mode={currentChat?.mode || 'normal'}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default Chat;
