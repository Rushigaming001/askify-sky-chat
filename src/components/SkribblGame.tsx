import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Clock, Play, UserX, Crown, Eraser, Settings, LogOut } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface Player {
  id: string;
  player_name: string;
  avatar_color: string;
  score: number;
  has_guessed: boolean;
  is_connected: boolean;
  user_id: string;
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
  'umbrella', 'hat', 'shoe', 'glasses', 'watch', 'key', 'door', 'window', 'chair',
  'table', 'lamp', 'clock', 'bottle', 'cup', 'plate', 'spoon', 'knife', 'fork'
];

export const SkribblGame = ({ roomId, onLeave }: { roomId: string; onLeave: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [guesses, setGuesses] = useState<any[]>([]);
  const [guessInput, setGuessInput] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [gameState, setGameState] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(80);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [showWordChoice, setShowWordChoice] = useState(false);
  const [hint, setHint] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [revealedWord, setRevealedWord] = useState('');
  const [guessOrder, setGuessOrder] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const colors = [
    '#000000', '#FFFFFF', '#C0C0C0', '#808080', '#FF0000', '#800000',
    '#FFFF00', '#808000', '#00FF00', '#008000', '#00FFFF', '#008080',
    '#0000FF', '#000080', '#FF00FF', '#800080', '#FFA500', '#A52A2A'
  ];

  useEffect(() => {
    loadGameData();
    subscribeToRealtime();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomId]);

  useEffect(() => {
    if (gameState?.status === 'playing' && gameState?.current_drawer_id && !gameState?.current_word) {
      const drawer = players.find(p => p.id === gameState.current_drawer_id);
      if (drawer?.user_id === user?.id) {
        const choices = getRandomWords(3);
        setWordChoices(choices);
        setShowWordChoice(true);
      }
    }
  }, [gameState, players, user]);

  useEffect(() => {
    if (gameState?.current_word && gameState?.status === 'playing') {
      setHint(generateInitialHint(gameState.current_word));
      setGuessOrder([]);
    }
  }, [gameState?.current_word, gameState?.status]);

  useEffect(() => {
    if (gameState?.status === 'playing' && gameState?.current_word && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          // Reveal letters as time passes
          if (gameState?.current_word) {
            const totalTime = gameState?.round_time || 80;
            const elapsed = totalTime - newTime;
            const revealInterval = Math.floor(totalTime / (gameState.current_word.length - 2));
            
            if (elapsed > 0 && elapsed % revealInterval === 0) {
              setHint(revealNextLetter(gameState.current_word, hint));
            }
          }
          
          if (newTime <= 0) {
            endRound();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState?.status, gameState?.current_word, timeLeft, hint]);

  const getRandomWords = (count: number) => {
    const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const generateInitialHint = (word: string) => {
    if (!word) return '';
    return word.split('').map(() => '_').join(' ');
  };

  const revealNextLetter = (word: string, currentHint: string) => {
    const hintArray = currentHint.split(' ');
    const wordArray = word.split('');
    
    // Find unrevealed positions (excluding first and last which are always revealed at end)
    const unrevealedIndices = wordArray
      .map((_, idx) => idx)
      .filter(idx => hintArray[idx] === '_' && idx !== 0 && idx !== wordArray.length - 1);
    
    if (unrevealedIndices.length > 0) {
      const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      hintArray[randomIndex] = wordArray[randomIndex];
    }
    
    return hintArray.join(' ');
  };

  const selectWord = async (word: string) => {
    await supabase
      .from('skribbl_rooms')
      .update({ current_word: word })
      .eq('id', roomId);
    
    setShowWordChoice(false);
    setTimeLeft(gameState?.round_time || 80);
  };

  const startGame = async () => {
    if (gameState?.host_id !== user?.id) {
      toast({ title: 'Only the host can start the game', variant: 'destructive' });
      return;
    }

    if (players.length < 2) {
      toast({ title: 'Need at least 2 players to start', variant: 'destructive' });
      return;
    }

    try {
      await supabase
        .from('skribbl_rooms')
        .update({
          status: 'playing',
          current_round: 1,
          current_drawer_id: players[0]?.id
        })
        .eq('id', roomId);

      toast({ title: 'Game started!', description: 'Let the drawing begin!' });
    } catch (error) {
      console.error('Error starting game:', error);
      toast({ title: 'Failed to start game', variant: 'destructive' });
    }
  };

  const endRound = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setRevealedWord(gameState?.current_word || '');
    
    // Award points based on guess order: 500, 400, 300, 50, 0
    const pointsMap = [500, 400, 300];
    
    for (let i = 0; i < guessOrder.length; i++) {
      const playerId = guessOrder[i];
      const { data: player } = await supabase
        .from('skribbl_players')
        .select('score')
        .eq('id', playerId)
        .single();
      
      if (player) {
        let points = 50; // Default for 4th place and beyond
        if (i < 3) {
          points = pointsMap[i];
        }
        
        await supabase
          .from('skribbl_players')
          .update({ score: player.score + points })
          .eq('id', playerId);
      }
    }

    // Award drawer bonus if someone guessed
    if (guessOrder.length > 0 && gameState?.current_drawer_id) {
      const { data: drawer } = await supabase
        .from('skribbl_players')
        .select('score')
        .eq('id', gameState.current_drawer_id)
        .single();
      
      if (drawer) {
        await supabase
          .from('skribbl_players')
          .update({ score: drawer.score + 100 })
          .eq('id', gameState.current_drawer_id);
      }
    }

    // Show word reveal for 3 seconds
    setTimeout(async () => {
      setRevealedWord('');
      
      // Move to next round or end game
      if (gameState?.current_round >= gameState?.max_rounds) {
        await supabase
          .from('skribbl_rooms')
          .update({ status: 'finished' })
          .eq('id', roomId);
        
        toast({ title: 'Game Over!', description: 'Final scores calculated!' });
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
    }, 3000);
  };

  const kickPlayer = async (playerId: string, playerName: string) => {
    if (gameState?.host_id !== user?.id) {
      toast({ title: 'Only the host can kick players', variant: 'destructive' });
      return;
    }

    if (!confirm(`Kick ${playerName} from the game?`)) return;

    try {
      await supabase
        .from('skribbl_players')
        .delete()
        .eq('id', playerId);

      toast({ title: `${playerName} has been kicked` });
    } catch (error) {
      console.error('Error kicking player:', error);
      toast({ title: 'Failed to kick player', variant: 'destructive' });
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

    if (playerData) {
      setPlayers(playerData);
      const myPlayer = playerData.find(p => p.user_id === user?.id);
      setCurrentPlayer(myPlayer || null);
    }

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
      .on('broadcast', { event: 'clear' }, () => {
        clearCanvas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const drawer = players.find(p => p.id === gameState?.current_drawer_id);
    if (drawer?.user_id !== user?.id || gameState?.status !== 'playing') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    broadcastDraw({ x, y, type: 'start', color: currentColor, width: brushSize });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const drawer = players.find(p => p.id === gameState?.current_drawer_id);
    if (!isDrawing || drawer?.user_id !== user?.id) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    broadcastDraw({ x, y, type: 'draw', color: currentColor, width: brushSize });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const drawer = players.find(p => p.id === gameState?.current_drawer_id);
    if (drawer?.user_id === user?.id) {
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
      ctx.lineJoin = 'round';
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

  const broadcastClear = async () => {
    const channel = supabase.channel(`skribbl-${roomId}`);
    await channel.send({
      type: 'broadcast',
      event: 'clear',
      payload: {},
    });
    clearCanvas();
  };

  const handleGuess = async () => {
    if (!guessInput.trim()) return;

    const drawer = players.find(p => p.id === gameState?.current_drawer_id);
    if (drawer?.user_id === user?.id) {
      toast({ title: "You're drawing!", variant: 'default' });
      setGuessInput('');
      return;
    }

    if (currentPlayer?.has_guessed) {
      toast({ title: 'You already guessed correctly!', variant: 'default' });
      setGuessInput('');
      return;
    }

    const isCorrect = guessInput.toLowerCase().trim() === gameState?.current_word?.toLowerCase();

    await supabase.from('skribbl_guesses').insert({
      room_id: roomId,
      player_id: currentPlayer?.id,
      guess: guessInput,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      // Add to guess order for scoring
      setGuessOrder(prev => [...prev, currentPlayer?.id || '']);
      
      await supabase
        .from('skribbl_players')
        .update({ has_guessed: true })
        .eq('id', currentPlayer?.id);
      
      toast({ title: '✓ Correct!', description: 'You guessed the word!' });
    }

    setGuessInput('');
  };

  const isHost = gameState?.host_id === user?.id;
  const drawer = players.find(p => p.id === gameState?.current_drawer_id);
  const isDrawer = drawer?.user_id === user?.id;

  return (
    <div className="h-screen w-full bg-[#5089EC] flex flex-col relative overflow-hidden">
      {/* Blue Doodle Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="doodles" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M50,50 Q60,30 70,50" stroke="white" fill="none" strokeWidth="2"/>
              <circle cx="150" cy="50" r="15" stroke="white" fill="none" strokeWidth="2"/>
              <path d="M30,150 L50,130 L70,150 L50,170 Z" stroke="white" fill="none" strokeWidth="2"/>
              <path d="M130,130 Q140,110 150,130 Q160,150 150,170 Q140,150 130,130" stroke="white" fill="none" strokeWidth="2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#doodles)"/>
        </svg>
      </div>

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

      {/* Word Reveal Modal */}
      {revealedWord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-8 max-w-md text-center">
            <h2 className="text-xl mb-4 text-muted-foreground">The word was:</h2>
            <p className="text-4xl font-bold text-primary">{revealedWord}</p>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-md p-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold" style={{ color: '#5B6DCD' }}>skribbl.io</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">Round {gameState?.current_round || 1}/{gameState?.max_rounds || 3}</span>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          {gameState?.status === 'waiting' ? (
            <span className="text-lg text-muted-foreground">Waiting to start...</span>
          ) : !gameState?.current_word ? (
            <span className="text-lg text-muted-foreground">{drawer?.player_name} is choosing a word...</span>
          ) : isDrawer ? (
            <span className="text-2xl font-bold text-green-600">{gameState?.current_word}</span>
          ) : (
            <span className="text-2xl font-bold tracking-[0.5em] text-blue-600">{hint}</span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {gameState?.status === 'playing' && gameState?.current_word && (
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
              <Clock className="h-5 w-5" />
              <span className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-600' : ''}`}>{timeLeft}</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={onLeave}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex gap-3 p-3 relative z-10 min-h-0">
        {/* Left Sidebar - Players */}
        <Card className="w-64 p-4 overflow-y-auto flex flex-col">
          {gameState?.status === 'waiting' && isHost && (
            <Button onClick={startGame} className="mb-4 gap-2">
              <Play className="h-4 w-4" />
              Start Game
            </Button>
          )}
          
          {gameState?.status === 'finished' && (
            <div className="mb-4 p-3 bg-green-500/20 rounded-lg text-sm text-center font-bold">
              🏆 Game Over!
            </div>
          )}

          <div className="space-y-2">
            {players.map((player, idx) => (
              <div
                key={player.id}
                className={`flex items-center gap-2 p-2 rounded transition-colors ${
                  player.has_guessed ? 'bg-green-100' : 'bg-gray-50'
                } ${gameState?.current_drawer_id === player.id ? 'ring-2 ring-yellow-400' : ''}`}
              >
                <div className="text-sm font-bold text-gray-500">#{idx + 1}</div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: player.avatar_color }}
                >
                  {gameState?.current_drawer_id === player.id && '✏️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate flex items-center gap-1">
                    {player.player_name}
                    {gameState?.host_id === player.user_id && (
                      <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-gray-600 font-bold">{player.score} points</div>
                </div>
                {isHost && player.user_id !== user?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => kickPlayer(player.id, player.player_name)}
                  >
                    <UserX className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Center - Drawing Canvas */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Drawing Tools */}
          {isDrawer && gameState?.status === 'playing' && gameState?.current_word && (
            <Card className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {colors.map(color => (
                    <button
                      key={color}
                      className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${
                        currentColor === color ? 'border-black ring-2 ring-black scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setCurrentColor(color)}
                    />
                  ))}
                </div>
                <div className="h-8 w-px bg-gray-300" />
                <Button variant="outline" size="sm" onClick={broadcastClear}>
                  <Eraser className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm font-medium">Size:</span>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm font-bold w-8">{brushSize}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Canvas */}
          <Card className="flex-1 p-3 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={1000}
              height={600}
              className={`bg-white rounded shadow-inner ${
                isDrawer && gameState?.status === 'playing' && gameState?.current_word ? 'cursor-crosshair' : 'cursor-default'
              }`}
              style={{ maxWidth: '100%', maxHeight: '100%' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </Card>
        </div>

        {/* Right Sidebar - Chat */}
        <Card className="w-80 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">Chat</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 mb-3 min-h-0 bg-gray-50 rounded p-2">
            {guesses.map((guess) => (
              <div 
                key={guess.id} 
                className={`text-sm p-1 rounded ${guess.is_correct ? 'bg-green-100 text-green-700 font-semibold' : ''}`}
              >
                <span className="font-medium">{guess.skribbl_players?.player_name}:</span>{' '}
                {guess.is_correct ? '✓ guessed the word!' : guess.guess}
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder={gameState?.status !== 'playing' ? 'Game not started' : isDrawer ? "You're drawing!" : 'Type your guess...'}
              onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
              disabled={isDrawer || gameState?.status !== 'playing' || !gameState?.current_word}
              className="flex-1"
            />
            <Button 
              onClick={handleGuess} 
              disabled={isDrawer || gameState?.status !== 'playing' || !gameState?.current_word}
            >
              Send
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
