import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Mic, MicOff, Video, VideoOff, Trash2, Clock } from 'lucide-react';
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

const WORD_BANK = [
  'cat', 'dog', 'house', 'tree', 'car', 'sun', 'moon', 'star', 'flower', 'book',
  'phone', 'computer', 'pizza', 'apple', 'banana', 'guitar', 'piano', 'drum',
  'camera', 'mountain', 'ocean', 'beach', 'forest', 'rainbow', 'cloud', 'bird',
  'fish', 'butterfly', 'elephant', 'lion', 'tiger', 'bear', 'rabbit', 'snake',
  'umbrella', 'hat', 'shoe', 'glasses', 'watch', 'key', 'door', 'window', 'chair'
];

const POINTS_FOR_CORRECT = 100;
const POINTS_FOR_DRAWER = 50;

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
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [showWordChoice, setShowWordChoice] = useState(false);
  const [hint, setHint] = useState('');
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];

  useEffect(() => {
    loadGameData();
    subscribeToRealtime();

    return () => {
      stopMediaStreams();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomId]);

  useEffect(() => {
    if (gameState?.status === 'playing' && gameState?.current_drawer_id === user?.id && !gameState?.current_word) {
      // Show word choices to drawer
      const choices = getRandomWords(3);
      setWordChoices(choices);
      setShowWordChoice(true);
    }
  }, [gameState, user]);

  useEffect(() => {
    if (gameState?.current_word) {
      setHint(generateHint(gameState.current_word));
    }
  }, [gameState?.current_word]);

  useEffect(() => {
    // Timer countdown
    if (gameState?.status === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endRound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState?.status, timeLeft]);

  const getRandomWords = (count: number) => {
    const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const generateHint = (word: string) => {
    if (!word) return '';
    return word.split('').map((char, idx) => idx === 0 || idx === word.length - 1 ? char : '_').join(' ');
  };

  const selectWord = async (word: string) => {
    await supabase
      .from('skribbl_rooms')
      .update({ current_word: word })
      .eq('id', roomId);
    
    setShowWordChoice(false);
    setTimeLeft(gameState?.round_time || 80);
  };

  const endRound = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Award points to players who guessed correctly
    const correctGuessers = guesses.filter(g => g.is_correct);
    for (const guess of correctGuessers) {
      const { data: player } = await supabase
        .from('skribbl_players')
        .select('score')
        .eq('id', guess.player_id)
        .single();
      
      if (player) {
        await supabase
          .from('skribbl_players')
          .update({ score: player.score + POINTS_FOR_CORRECT })
          .eq('id', guess.player_id);
      }
    }

    // Award points to drawer if someone guessed
    if (correctGuessers.length > 0 && gameState?.current_drawer_id) {
      const { data: drawer } = await supabase
        .from('skribbl_players')
        .select('score')
        .eq('id', gameState.current_drawer_id)
        .single();
      
      if (drawer) {
        await supabase
          .from('skribbl_players')
          .update({ score: drawer.score + POINTS_FOR_DRAWER })
          .eq('id', gameState.current_drawer_id);
      }
    }

    // Move to next round or end game
    if (gameState?.current_round >= gameState?.max_rounds) {
      await supabase
        .from('skribbl_rooms')
        .update({ status: 'finished' })
        .eq('id', roomId);
      
      toast({ title: 'Game Over!', description: 'Thanks for playing!' });
    } else {
      // Next round
      const nextDrawerIndex = (players.findIndex(p => p.id === gameState.current_drawer_id) + 1) % players.length;
      await supabase
        .from('skribbl_rooms')
        .update({
          current_round: gameState.current_round + 1,
          current_drawer_id: players[nextDrawerIndex]?.id,
          current_word: null
        })
        .eq('id', roomId);
      
      // Reset has_guessed for all players
      await supabase
        .from('skribbl_players')
        .update({ has_guessed: false })
        .eq('room_id', roomId);
      
      clearCanvas();
      setTimeLeft(gameState?.round_time || 80);
    }
  };

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
    if (gameState?.current_drawer_id !== user?.id) return;
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
    if (!isDrawing || gameState?.current_drawer_id !== user?.id) return;

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
    if (gameState?.current_drawer_id === user?.id) {
      broadcastDraw({ x: 0, y: 0, type: 'end', color: currentColor, width: brushSize });
    }
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

    const currentPlayer = players.find(p => p.id === user?.id);
    if (currentPlayer?.has_guessed) {
      toast({ title: 'You already guessed correctly!', variant: 'default' });
      setGuessInput('');
      return;
    }

    const isCorrect = guessInput.toLowerCase() === gameState?.current_word?.toLowerCase();

    await supabase.from('skribbl_guesses').insert({
      room_id: roomId,
      player_id: currentPlayer?.id,
      guess: guessInput,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      await supabase
        .from('skribbl_players')
        .update({ 
          has_guessed: true,
          score: (currentPlayer?.score || 0) + POINTS_FOR_CORRECT
        })
        .eq('id', currentPlayer?.id);
      
      toast({ title: 'Correct!', description: `+${POINTS_FOR_CORRECT} points` });
    }

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
      {/* Word Choice Modal */}
      {showWordChoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-8 max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Choose a word to draw</h2>
            <div className="space-y-3">
              {wordChoices.map((word) => (
                <Button
                  key={word}
                  onClick={() => selectWord(word)}
                  className="w-full text-lg h-14"
                  size="lg"
                >
                  {word}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Players List */}
      <Card className="w-64 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-bold">Round {gameState?.current_round || 1}/{gameState?.max_rounds || 3}</div>
        </div>
        <div className="space-y-2">
          {players.map((player, idx) => (
            <div
              key={player.id}
              className={`flex items-center gap-2 p-2 rounded ${
                player.has_guessed ? 'bg-green-100' : 'bg-background'
              } ${gameState?.current_drawer_id === player.id ? 'border-2 border-yellow-400' : ''}`}
            >
              <div className="text-sm font-bold">#{idx + 1}</div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: player.avatar_color }}
              >
                {gameState?.current_drawer_id === player.id && '✏️'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{player.player_name}</div>
                <div className="text-xs text-muted-foreground">{player.score} pts</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Drawing Canvas */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Top Bar with Hint and Timer */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold">
                {gameState?.current_drawer_id === user?.id ? (
                  <span className="text-green-600">Draw: {gameState?.current_word}</span>
                ) : (
                  <span className="text-blue-600 tracking-widest">{hint || 'Waiting...'}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-2xl font-bold">
                <Clock className="h-6 w-6" />
                <span className={timeLeft <= 10 ? 'text-red-600' : ''}>{timeLeft}s</span>
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
          </div>
        </Card>

        {/* Drawing Tools and Canvas */}
        <Card className="p-4 flex-1">
          {gameState?.current_drawer_id === user?.id && (
            <>
              <div className="flex gap-2 mb-4">
                {colors.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      currentColor === color ? 'border-primary ring-2 ring-primary' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentColor(color)}
                  />
                ))}
                <Button variant="outline" size="icon" onClick={clearCanvas}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2 mb-4 items-center">
                <span className="text-sm font-medium">Brush Size:</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-bold">{brushSize}px</span>
              </div>
            </>
          )}

          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className={`w-full bg-white rounded border-2 border-border ${
              gameState?.current_drawer_id === user?.id ? 'cursor-crosshair' : 'cursor-default'
            }`}
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
        <div className="text-lg font-bold mb-4">Chat & Guesses</div>
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-0">
          {guesses.map((guess) => (
            <div key={guess.id} className={`text-sm ${guess.is_correct ? 'text-green-600 font-bold' : ''}`}>
              <span className="font-medium">{guess.skribbl_players?.player_name}:</span> {guess.guess}
              {guess.is_correct && ' ✓ Correct!'}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="Type your guess..."
            onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
            disabled={gameState?.current_drawer_id === user?.id}
          />
          <Button onClick={handleGuess} disabled={gameState?.current_drawer_id === user?.id}>
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
};