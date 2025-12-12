import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function VoiceChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  const startVoiceChat = async () => {
    try {
      // Check if browser supports speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast({
          title: 'Not Supported',
          description: 'Speech recognition is not supported in this browser',
          variant: 'destructive'
        });
        return;
      }

      // Initialize speech recognition
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      // Initialize speech synthesis
      synthesisRef.current = window.speechSynthesis;

      recognitionRef.current.onstart = () => {
        setIsConnected(true);
        setIsListening(true);
        toast({
          title: 'Voice Chat Started',
          description: 'Start speaking to the AI!'
        });
      };

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log('You said:', transcript);
        
        setIsListening(false);
        
        // Send to AI using streaming endpoint
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
            },
            body: JSON.stringify({ 
              messages: [{ role: 'user', content: transcript }],
              model: 'grok',
              mode: 'normal'
            })
          });

          if (!response.ok) throw new Error('Failed to get response');
          
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullResponse = '';
          
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                  try {
                    const json = JSON.parse(line.slice(6));
                    const content = json.choices?.[0]?.delta?.content;
                    if (content) fullResponse += content;
                  } catch {}
                }
              }
            }
          }
          
          if (fullResponse) {
            // Speak the AI response
            setIsSpeaking(true);
            const utterance = new SpeechSynthesisUtterance(fullResponse);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.onend = () => {
              setIsSpeaking(false);
              setIsListening(true);
              // Restart recognition
              if (recognitionRef.current && isConnected) {
                try { recognitionRef.current.start(); } catch {}
              }
            };
            synthesisRef.current?.speak(utterance);
          } else {
            setIsListening(true);
          }
        } catch (error) {
          console.error('Error getting AI response:', error);
          toast({
            title: 'Error',
            description: 'Failed to get AI response',
            variant: 'destructive'
          });
          setIsListening(true);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          toast({
            title: 'Recognition Error',
            description: `Error: ${event.error}`,
            variant: 'destructive'
          });
        }
      };

      recognitionRef.current.onend = () => {
        if (isConnected) {
          recognitionRef.current?.start();
        }
      };

      recognitionRef.current.start();

    } catch (error) {
      console.error('Error starting voice chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to start voice chat',
        variant: 'destructive'
      });
    }
  };

  const stopVoiceChat = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      synthesisRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => {
      stopVoiceChat();
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Voice Chat with AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-6">
          <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
            isConnected 
              ? 'bg-primary/20 animate-pulse' 
              : 'bg-muted'
          }`}>
            <div className={`absolute inset-0 rounded-full ${
              isSpeaking 
                ? 'bg-primary/30 animate-ping' 
                : ''
            }`}></div>
            <div className={`relative z-10 p-6 rounded-full ${
              isConnected ? 'bg-primary' : 'bg-muted-foreground'
            }`}>
              {isListening ? (
                <Mic className="h-12 w-12 text-white" />
              ) : (
                <MicOff className="h-12 w-12 text-white" />
              )}
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-lg font-medium">
              {isConnected 
                ? isSpeaking 
                  ? 'AI is speaking...' 
                  : 'Listening...'
                : 'Not connected'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isConnected 
                ? 'Speak naturally, the AI will respond' 
                : 'Click to start voice chat'}
            </p>
          </div>

          {!isConnected ? (
            <Button 
              onClick={startVoiceChat} 
              size="lg"
              className="w-full"
            >
              <Phone className="mr-2 h-5 w-5" />
              Start Voice Chat
            </Button>
          ) : (
            <Button 
              onClick={stopVoiceChat} 
              variant="destructive"
              size="lg"
              className="w-full"
            >
              <PhoneOff className="mr-2 h-5 w-5" />
              End Voice Chat
            </Button>
          )}
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm">
          <p className="font-medium mb-2">Features:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Real-time voice conversation</li>
            <li>• Natural language understanding</li>
            <li>• Instant AI responses</li>
            <li>• Hands-free interaction</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
