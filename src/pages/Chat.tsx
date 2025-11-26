import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Sidebar } from '@/components/Sidebar';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { MathSolver } from '@/components/MathSolver';
import { LiveVideoCall } from '@/components/LiveVideoCall';
import { VideoGenerator } from '@/components/VideoGenerator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { callAI } from '@/services/chatService';
import { canAccessModel } from '@/services/modelPermissionService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calculator, Lock, Video, Film } from 'lucide-react';
import logo from '@/assets/logo.png';

const Chat = () => {
  const { user } = useAuth();
  const { currentChat, addMessage, updateChatSettings, createNewChat } = useChat();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'gpt' | 'askify' | 'gpt-mini' | 'gpt-nano' | 'gemini-3'>('gemini');
  const [modelAccess, setModelAccess] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      // Check model access permissions
      checkModelAccess();
    }
  }, [user, navigate]);

  const checkModelAccess = async () => {
    const modelMap: Record<string, string> = {
      'gemini': 'google/gemini-2.5-flash',
      'gpt': 'openai/gpt-5',
      'gpt-mini': 'openai/gpt-5-mini',
      'gpt-nano': 'openai/gpt-5-nano',
      'gemini-3': 'google/gemini-3-pro-preview',
      'askify': 'google/gemini-2.5-pro'
    };

    const access: Record<string, boolean> = {};
    for (const [key, modelId] of Object.entries(modelMap)) {
      access[key] = await canAccessModel(modelId);
    }
    setModelAccess(access);
  };

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

  const handleModeChange = (mode: 'normal' | 'deepthink' | 'search' | 'reasoning') => {
    if (currentChat) {
      updateChatSettings(selectedModel, mode);
    }
  };

  const handleModelChange = (model: 'gemini' | 'gpt' | 'askify' | 'gpt-mini' | 'gpt-nano' | 'gemini-3') => {
    if (!modelAccess[model]) {
      toast({
        title: 'Access Denied',
        description: 'You don\'t have access to this model. Please upgrade your account.',
        variant: 'destructive'
      });
      return;
    }
    
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
        <header className="border-b border-border px-3 py-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-50">
          <div className="flex items-center gap-2 min-w-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              <span className="text-2xl">☰</span>
            </Button>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-wider bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent whitespace-nowrap">
              ASKIFY
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-9 w-9"
                  title="Math Solver"
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Math Problem Solver</DialogTitle>
                </DialogHeader>
                <MathSolver />
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-9 w-9"
                  title="Live Video Call with AI"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Live Video Call with AI</DialogTitle>
                </DialogHeader>
                <LiveVideoCall />
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-9 w-9"
                  title="AI Video Generator"
                >
                  <Film className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>AI Video Generator</DialogTitle>
                </DialogHeader>
                <VideoGenerator />
              </DialogContent>
            </Dialog>
            <Select value={selectedModel} onValueChange={(v: 'gemini' | 'gpt' | 'askify' | 'gpt-mini' | 'gpt-nano' | 'gemini-3') => handleModelChange(v)}>
              <SelectTrigger className="w-[130px] sm:w-[160px] md:w-[200px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini" disabled={!modelAccess.gemini}>
                  <div className="flex items-center gap-2">
                    {!modelAccess.gemini && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <span>Gemini Flash</span>
                  </div>
                </SelectItem>
                <SelectItem value="gpt" disabled={!modelAccess.gpt}>
                  <div className="flex items-center gap-2">
                    {!modelAccess.gpt && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <span>GPT-5</span>
                  </div>
                </SelectItem>
                <SelectItem value="gpt-mini" disabled={!modelAccess['gpt-mini']}>
                  <div className="flex items-center gap-2">
                    {!modelAccess['gpt-mini'] && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <span>GPT-5 Mini</span>
                  </div>
                </SelectItem>
                <SelectItem value="gpt-nano" disabled={!modelAccess['gpt-nano']}>
                  <div className="flex items-center gap-2">
                    {!modelAccess['gpt-nano'] && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <span>GPT-5 Nano</span>
                  </div>
                </SelectItem>
                <SelectItem value="gemini-3" disabled={!modelAccess['gemini-3']}>
                  <div className="flex items-center gap-2">
                    {!modelAccess['gemini-3'] && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <span>Gemini 3 Pro</span>
                  </div>
                </SelectItem>
                <SelectItem value="askify" disabled={!modelAccess.askify}>
                  <div className="flex items-center gap-2">
                    {!modelAccess.askify && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <span className="font-semibold tracking-wide">ASKIFY PRO</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <ScrollArea className="flex-1 chat-scroll" ref={scrollRef}>
          {showWelcome ? (
            <div className="h-full flex flex-col items-center justify-center p-4 sm:p-8 text-center">
              <img src={logo} alt="Askify" className="h-16 w-16 sm:h-20 sm:w-20 mb-4 sm:mb-6" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent px-4">
                How can I help you?
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md px-4">
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
