import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function VoiceChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  const startVoiceChat = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Connect to voice chat endpoint
      const projectRef = window.location.hostname.includes('lovable.app') 
        ? window.location.hostname.split('.')[0]
        : 'wexmklgizitrjitkalry';
      
      wsRef.current = new WebSocket(
        `wss://${projectRef}.supabase.co/functions/v1/voice-chat`
      );

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setIsListening(true);
        toast({
          title: 'Connected',
          description: 'Voice chat is now active. Start speaking!'
        });
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'audio') {
          // Play received audio
          setIsSpeaking(true);
          playAudio(data.audio);
        } else if (data.type === 'transcript') {
          console.log('AI:', data.text);
        }
      };

      wsRef.current.onerror = () => {
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to voice chat',
          variant: 'destructive'
        });
        stopVoiceChat();
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setIsListening(false);
      };

    } catch (error) {
      console.error('Error starting voice chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to access microphone or start voice chat',
        variant: 'destructive'
      });
    }
  };

  const stopVoiceChat = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  };

  const playAudio = async (base64Audio: string) => {
    if (!audioContextRef.current) return;
    
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsSpeaking(false);
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
    }
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
