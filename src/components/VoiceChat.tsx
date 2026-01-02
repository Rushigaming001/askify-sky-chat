import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Phone, PhoneOff, Music, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MusicPlayer } from '@/components/MusicPlayer';

type VoiceType = 'male' | 'female';

export function VoiceChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [musicStream, setMusicStream] = useState<MediaStream | null>(null);
  const [voiceType, setVoiceType] = useState<VoiceType>('female');
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const isConnectedRef = useRef(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        // Auto-select a good voice based on preference
        updateSelectedVoice(voices, voiceType);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Update voice when preference changes
  useEffect(() => {
    if (availableVoices.length > 0) {
      updateSelectedVoice(availableVoices, voiceType);
    }
  }, [voiceType, availableVoices]);

  const updateSelectedVoice = (voices: SpeechSynthesisVoice[], type: VoiceType) => {
    // Preferred voices for natural sound
    const femaleVoices = [
      'Google UK English Female',
      'Microsoft Zira',
      'Samantha',
      'Karen',
      'Victoria',
      'Moira',
      'Tessa'
    ];
    
    const maleVoices = [
      'Google UK English Male',
      'Microsoft David',
      'Daniel',
      'Alex',
      'Fred',
      'Thomas'
    ];

    const preferredNames = type === 'female' ? femaleVoices : maleVoices;
    
    // Try to find preferred voice
    for (const name of preferredNames) {
      const found = voices.find(v => v.name.includes(name));
      if (found) {
        setSelectedVoice(found);
        return;
      }
    }

    // Fallback: find any voice that matches gender preference by name hints
    const genderHints = type === 'female' 
      ? ['female', 'woman', 'girl', 'zira', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona']
      : ['male', 'man', 'david', 'daniel', 'alex', 'fred', 'thomas', 'james'];
    
    const fallback = voices.find(v => 
      genderHints.some(hint => v.name.toLowerCase().includes(hint))
    );
    
    if (fallback) {
      setSelectedVoice(fallback);
    } else {
      // Last resort: just pick the first available voice
      setSelectedVoice(voices[0] || null);
    }
  };

  // Keep ref in sync with state
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  const speakResponse = useCallback((text: string) => {
    if (!synthesisRef.current || !text) return;

    // Cancel any ongoing speech
    synthesisRef.current.cancel();
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceRef.current = utterance;
    
    // Apply selected voice
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Natural speaking parameters
    utterance.rate = 1.0;
    utterance.pitch = voiceType === 'female' ? 1.1 : 0.9;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      
      // Immediately restart listening for continuous conversation
      if (isConnectedRef.current && recognitionRef.current) {
        setIsListening(true);
        try { 
          recognitionRef.current.start(); 
        } catch (e) {
          console.log('Recognition already started');
        }
      }
    };
    
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };
    
    synthesisRef.current.speak(utterance);
  }, [selectedVoice, voiceType]);

  const processUserSpeech = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;
    
    console.log('You said:', transcript);
    setIsListening(false);
    setIsProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: 'Not Authenticated',
          description: 'Please log in to use voice chat',
          variant: 'destructive'
        });
        setIsProcessing(false);
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: transcript }],
          model: 'grok',
          mode: 'normal'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }
      
      const data = await response.json();
      const fullResponse = data.reply || '';
      
      setIsProcessing(false);
      
      if (fullResponse) {
        speakResponse(fullResponse);
      } else {
        // Resume listening if no response
        if (isConnectedRef.current && recognitionRef.current) {
          setIsListening(true);
          try { recognitionRef.current.start(); } catch {}
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsProcessing(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get AI response',
        variant: 'destructive'
      });
      
      // Resume listening after error
      if (isConnectedRef.current && recognitionRef.current) {
        setIsListening(true);
        try { recognitionRef.current.start(); } catch {}
      }
    }
  }, [speakResponse, toast]);

  const startVoiceChat = async () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast({
          title: 'Not Supported',
          description: 'Speech recognition is not supported in this browser',
          variant: 'destructive'
        });
        return;
      }

      // Initialize speech recognition with optimal settings
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true; // Enable for faster response
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

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

      let finalTranscript = '';
      let silenceTimeout: NodeJS.Timeout | null = null;

      recognitionRef.current.onresult = (event: any) => {
        // Clear existing silence timeout
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
        }

        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // If we have a final result, process it immediately
        if (finalTranscript.trim()) {
          const toProcess = finalTranscript.trim();
          finalTranscript = '';
          recognitionRef.current?.stop();
          processUserSpeech(toProcess);
        } else if (interimTranscript.trim()) {
          // Wait for silence to process interim (for faster response)
          silenceTimeout = setTimeout(() => {
            if (interimTranscript.trim() && isConnectedRef.current) {
              const toProcess = interimTranscript.trim();
              recognitionRef.current?.stop();
              processUserSpeech(toProcess);
            }
          }, 1500); // Wait 1.5s of silence before processing
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast({
            title: 'Recognition Error',
            description: `Error: ${event.error}`,
            variant: 'destructive'
          });
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if still connected and not speaking/processing
        if (isConnectedRef.current && !isSpeaking && !isProcessing) {
          setTimeout(() => {
            if (isConnectedRef.current && recognitionRef.current) {
              try { 
                recognitionRef.current.start();
                setIsListening(true);
              } catch {}
            }
          }, 100);
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
    isConnectedRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      synthesisRef.current = null;
    }
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
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
        {/* Voice Selection */}
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Voice:</span>
          <Select value={voiceType} onValueChange={(v) => setVoiceType(v as VoiceType)} disabled={isConnected}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
            isConnected 
              ? isProcessing
                ? 'bg-yellow-500/20'
                : isSpeaking
                  ? 'bg-green-500/20'
                  : 'bg-primary/20 animate-pulse' 
              : 'bg-muted'
          }`}>
            <div className={`absolute inset-0 rounded-full ${
              isSpeaking 
                ? 'bg-green-500/30 animate-ping' 
                : isProcessing
                  ? 'bg-yellow-500/30 animate-pulse'
                  : ''
            }`}></div>
            <div className={`relative z-10 p-6 rounded-full ${
              isConnected 
                ? isProcessing
                  ? 'bg-yellow-500'
                  : isSpeaking
                    ? 'bg-green-500'
                    : 'bg-primary'
                : 'bg-muted-foreground'
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
                ? isProcessing
                  ? 'Processing...'
                  : isSpeaking 
                    ? 'AI is speaking...' 
                    : 'Listening...'
                : 'Not connected'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isConnected 
                ? 'Speak naturally, the AI will respond' 
                : 'Click to start voice chat'}
            </p>
            {selectedVoice && (
              <p className="text-xs text-muted-foreground">
                Using: {selectedVoice.name}
              </p>
            )}
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
            <li>• Choose male or female voice</li>
            <li>• Natural language understanding</li>
            <li>• Instant AI responses</li>
            <li>• Hands-free interaction</li>
          </ul>
        </div>

        {/* Music Player Toggle */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowMusicPlayer(!showMusicPlayer)}
        >
          <Music className="h-4 w-4 mr-2" />
          {showMusicPlayer ? 'Hide Music Player' : 'Show Music Player'}
        </Button>

        {showMusicPlayer && (
          <MusicPlayer 
            onAudioStream={setMusicStream}
            compact={false}
          />
        )}
      </CardContent>
    </Card>
  );
}
