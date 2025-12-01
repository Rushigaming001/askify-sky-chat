import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Mic, MicOff, Video, VideoOff, Eraser, Trash2 } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface Player {
  id: string;
  player_name: string;
  avatar_color: string;
  score: number;
  has_guessed: boolean;
  is_connected: boolean;
}

interface DrawEvent {
  x: number;
  y: number;
  type: 'start' | 'draw' | 'end';
  color: string;
  width: number;
}

export const SkribblGame = ({ roomId }: { roomId: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [guesses, setGuesses] = useState<any[]>([]);
  const [guessInput, setGuessInput] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(80);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];

  useEffect(() => {
    loadGameData();
    subscribeToRealtime();

    return () => {
      stopMediaStreams();
    };
  }, [roomId]);

  const loadGameData = async () => {
    const { data: room } = await supabase
      .from('skribbl_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    setGameState(room);

    const { data: playerData } = await supabase
      .from('skribbl_players')
      .select('*')
      .eq('room_id', roomId)
      .order('score', { ascending: false });

    if (playerData) setPlayers(playerData);

    const { data: guessData } = await supabase
      .from('skribbl_guesses')
      .select('*, skribbl_players(player_name)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (guessData) setGuesses(guessData);
  };

  const subscribeToRealtime = () => {
    const channel = supabase
      .channel(`skribbl-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skribbl_players', filter: `room_id=eq.${roomId}` }, () => loadGameData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'skribbl_guesses', filter: `room_id=eq.${roomId}` }, () => loadGameData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'skribbl_rooms', filter: `id=eq.${roomId}` }, () => loadGameData())
      .on('broadcast', { event: 'draw' }, ({ payload }) => {
        drawOnCanvas(payload as DrawEvent);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    broadcastDraw({ x, y, type: 'start', color: currentColor, width: brushSize });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    broadcastDraw({ x, y, type: 'draw', color: currentColor, width: brushSize });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    broadcastDraw({ x: 0, y: 0, type: 'end', color: currentColor, width: brushSize });
  };

  const drawOnCanvas = (event: DrawEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (event.type === 'start') {
      ctx.beginPath();
      ctx.moveTo(event.x, event.y);
    } else if (event.type === 'draw') {
      ctx.strokeStyle = event.color;
      ctx.lineWidth = event.width;
      ctx.lineCap = 'round';
      ctx.lineTo(event.x, event.y);
      ctx.stroke();
    }
  };

  const broadcastDraw = async (event: DrawEvent) => {
    const channel = supabase.channel(`skribbl-${roomId}`);
    await channel.send({
      type: 'broadcast',
      event: 'draw',
      payload: event,
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleGuess = async () => {
    if (!guessInput.trim()) return;

    await supabase.from('skribbl_guesses').insert({
      room_id: roomId,
      player_id: players.find(p => p.id === user?.id)?.id,
      guess: guessInput,
      is_correct: guessInput.toLowerCase() === gameState?.current_word?.toLowerCase(),
    });

    setGuessInput('');
  };

  const toggleVoice = async () => {
    if (!isVoiceEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        audioContextRef.current = new AudioContext();
        setIsVoiceEnabled(true);
        toast({ title: 'Voice chat enabled' });
      } catch (error) {
        toast({ title: 'Failed to enable voice', variant: 'destructive' });
      }
    } else {
      stopMediaStreams();
      setIsVoiceEnabled(false);
      toast({ title: 'Voice chat disabled' });
    }
  };

  const toggleCamera = async () => {
    if (!isCameraEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        if (!mediaStreamRef.current) {
          mediaStreamRef.current = stream;
        } else {
          stream.getVideoTracks().forEach(track => mediaStreamRef.current?.addTrack(track));
        }
        setIsCameraEnabled(true);
        toast({ title: 'Camera enabled' });
      } catch (error) {
        toast({ title: 'Failed to enable camera', variant: 'destructive' });
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getVideoTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraEnabled(false);
      toast({ title: 'Camera disabled' });
    }
  };

  const stopMediaStreams = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-4 flex gap-4">
      {/* Players List */}
      <Card className="w-64 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold">Round {gameState?.current_round}/{gameState?.max_rounds}</div>
          <div className="text-xl font-bold">{timeLeft}s</div>
        </div>
        <div className="space-y-2">
          {players.map((player, idx) => (
            <div
              key={player.id}
              className={`flex items-center gap-2 p-2 rounded ${
                player.has_guessed ? 'bg-green-100' : 'bg-background'
              }`}
            >
              <div className="text-sm font-bold">#{idx + 1}</div>
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: player.avatar_color }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{player.player_name}</div>
                <div className="text-xs text-muted-foreground">{player.score} points</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Drawing Canvas */}
      <div className="flex-1 flex flex-col gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-bold">
              {gameState?.current_drawer_id === user?.id ? (
                <span>Draw: {gameState?.current_word}</span>
              ) : (
                <span>GUESS THIS</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={isVoiceEnabled ? 'default' : 'outline'}
                size="icon"
                onClick={toggleVoice}
              >
                {isVoiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button
                variant={isCameraEnabled ? 'default' : 'outline'}
                size="icon"
                onClick={toggleCamera}
              >
                {isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {colors.map(color => (
              <button
                key={color}
                className={`w-8 h-8 rounded-full border-2 ${
                  currentColor === color ? 'border-primary' : 'border-border'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
            <Button variant="outline" size="icon" onClick={clearCanvas}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm">{brushSize}px</span>
          </div>

          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full bg-white rounded border-2 border-border cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </Card>

        {isCameraEnabled && (
          <Card className="p-4">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-48 h-36 rounded border-2 border-border"
            />
          </Card>
        )}
      </div>

      {/* Chat/Guesses */}
      <Card className="w-80 p-4 flex flex-col">
        <div className="text-lg font-bold mb-4">Chat</div>
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {guesses.map((guess) => (
            <div key={guess.id} className={guess.is_correct ? 'text-green-600 font-bold' : ''}>
              <span className="font-medium">{guess.skribbl_players?.player_name}:</span> {guess.guess}
              {guess.is_correct && ' ✓'}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="Type your guess here..."
            onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
          />
          <Button onClick={handleGuess}>Send</Button>
        </div>
      </Card>
    </div>
  );
};