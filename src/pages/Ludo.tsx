import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Copy, Users, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const COLORS = ['red', 'blue', 'green', 'yellow'] as const;
type LudoColor = typeof COLORS[number];
const COLOR_CLASSES: Record<LudoColor, string> = {
  red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500', yellow: 'bg-yellow-500',
};
const COLOR_LIGHT: Record<LudoColor, string> = {
  red: 'bg-red-100', blue: 'bg-blue-100', green: 'bg-green-100', yellow: 'bg-yellow-100',
};
const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

interface PlayerState {
  userId: string;
  name: string;
  color: LudoColor;
  pieces: number[]; // positions 0=home, 1-56=board, 57=finished
}

const Ludo = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [myColorIndex, setMyColorIndex] = useState(-1);
  const [gameStarted, setGameStarted] = useState(false);
  const [channelRef, setChannelRef] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth', { replace: true });
  }, [authLoading, user, navigate]);

  const createRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    const me: PlayerState = { userId: user!.id, name: user!.name || 'Player 1', color: 'red', pieces: [0, 0, 0, 0] };
    setPlayers([me]);
    setMyColorIndex(0);
    joinChannel(code, [me], 0);
    toast.success(`Room created! Code: ${code}`);
  };

  const joinRoom = () => {
    if (!joinCode.trim()) { toast.error('Enter a room code'); return; }
    setRoomCode(joinCode.toUpperCase());
    joinChannel(joinCode.toUpperCase(), [], -1);
  };

  const joinChannel = (code: string, initialPlayers: PlayerState[], colorIdx: number) => {
    if (channelRef) supabase.removeChannel(channelRef);
    const channel = supabase.channel(`ludo-${code}`);
    channel
      .on('broadcast', { event: 'state-sync' }, ({ payload }) => {
        setPlayers(payload.players);
        setCurrentTurn(payload.currentTurn);
        setDiceValue(payload.diceValue);
        setGameStarted(payload.gameStarted);
        // Find my index
        const idx = payload.players.findIndex((p: PlayerState) => p.userId === user?.id);
        if (idx >= 0) setMyColorIndex(idx);
      })
      .on('broadcast', { event: 'player-joined' }, ({ payload }) => {
        setPlayers(prev => {
          if (prev.find(p => p.userId === payload.player.userId)) return prev;
          const updated = [...prev, payload.player];
          return updated;
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && colorIdx === -1) {
          // Joining player requests state
          channel.send({ type: 'broadcast', event: 'request-join', payload: { userId: user!.id, name: user!.name || 'Player' } });
        }
      });

    channel.on('broadcast', { event: 'request-join' }, ({ payload }) => {
      setPlayers(prev => {
        if (prev.length >= 4) return prev;
        if (prev.find(p => p.userId === payload.userId)) return prev;
        const newPlayer: PlayerState = { userId: payload.userId, name: payload.name, color: COLORS[prev.length], pieces: [0, 0, 0, 0] };
        const updated = [...prev, newPlayer];
        // Broadcast updated state
        setTimeout(() => {
          channel.send({ type: 'broadcast', event: 'state-sync', payload: { players: updated, currentTurn, diceValue, gameStarted } });
        }, 100);
        toast.success(`${payload.name} joined!`);
        return updated;
      });
    });

    setChannelRef(channel);
  };

  useEffect(() => () => { if (channelRef) supabase.removeChannel(channelRef); }, [channelRef]);

  const rollDice = () => {
    if (currentTurn !== myColorIndex || isRolling) return;
    setIsRolling(true);
    setTimeout(() => {
      const value = Math.floor(Math.random() * 6) + 1;
      setDiceValue(value);
      setIsRolling(false);
      
      // Auto-advance turn if no valid moves (simplified: just advance)
      const myPieces = players[myColorIndex]?.pieces || [];
      const canMove = myPieces.some(p => {
        if (p === 0 && value === 6) return true;
        if (p > 0 && p < 57 && p + value <= 57) return true;
        return false;
      });
      
      if (!canMove) {
        const nextTurn = (currentTurn + 1) % players.length;
        setCurrentTurn(nextTurn);
        setDiceValue(null);
        channelRef?.send({ type: 'broadcast', event: 'state-sync', payload: { players, currentTurn: nextTurn, diceValue: null, gameStarted } });
      }
    }, 600);
  };

  const movePiece = (pieceIndex: number) => {
    if (currentTurn !== myColorIndex || !diceValue) return;
    const updatedPlayers = [...players];
    const me = { ...updatedPlayers[myColorIndex] };
    const pos = me.pieces[pieceIndex];
    
    if (pos === 0 && diceValue === 6) {
      me.pieces = [...me.pieces];
      me.pieces[pieceIndex] = 1;
    } else if (pos > 0 && pos + diceValue <= 57) {
      me.pieces = [...me.pieces];
      me.pieces[pieceIndex] = pos + diceValue;
    } else {
      return; // Invalid move
    }
    
    updatedPlayers[myColorIndex] = me;
    const nextTurn = diceValue === 6 ? currentTurn : (currentTurn + 1) % players.length;
    setPlayers(updatedPlayers);
    setCurrentTurn(nextTurn);
    setDiceValue(diceValue === 6 ? null : null);
    channelRef?.send({ type: 'broadcast', event: 'state-sync', payload: { players: updatedPlayers, currentTurn: nextTurn, diceValue: null, gameStarted } });
  };

  const startGame = () => {
    if (players.length < 2) { toast.error('Need at least 2 players'); return; }
    setGameStarted(true);
    channelRef?.send({ type: 'broadcast', event: 'state-sync', payload: { players, currentTurn: 0, diceValue: null, gameStarted: true } });
  };

  if (authLoading || !user) return null;

  const DiceIcon = diceValue ? DICE_ICONS[diceValue - 1] : Dice1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">🎲 Online Ludo</h1>
        </div>

        {!roomCode ? (
          <Card>
            <CardHeader><CardTitle>Create or Join a Game</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={createRoom} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Users className="h-4 w-4 mr-2" /> Create Room (up to 4 players)
              </Button>
              <div className="flex gap-2">
                <Input placeholder="Enter room code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="uppercase" />
                <Button onClick={joinRoom} variant="outline">Join</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Room info */}
            <div className="flex items-center justify-between bg-white/80 backdrop-blur rounded-xl p-3 border border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Room:</span>
                <span className="font-mono font-bold text-emerald-700">{roomCode}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(roomCode); toast.success('Copied!'); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              {!gameStarted && myColorIndex === 0 && (
                <Button size="sm" onClick={startGame} className="bg-emerald-600 hover:bg-emerald-700">Start Game</Button>
              )}
            </div>

            {/* Players */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {players.map((p, i) => (
                <div key={p.userId} className={`p-3 rounded-xl border-2 ${currentTurn === i ? 'border-emerald-500 shadow-lg' : 'border-slate-200'} bg-white`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full ${COLOR_CLASSES[p.color]}`} />
                    <span className="text-sm font-medium truncate">{p.userId === user.id ? 'You' : p.name}</span>
                  </div>
                  <div className="flex gap-1">
                    {p.pieces.map((pos, pi) => (
                      <button
                        key={pi}
                        onClick={() => { if (currentTurn === myColorIndex && i === myColorIndex && diceValue) movePiece(pi); }}
                        className={`w-8 h-8 rounded-full ${COLOR_CLASSES[p.color]} text-white text-xs font-bold flex items-center justify-center transition-transform ${
                          currentTurn === myColorIndex && i === myColorIndex && diceValue ? 'hover:scale-125 cursor-pointer' : 'cursor-default'
                        } ${pos === 57 ? 'opacity-50' : ''}`}
                        title={pos === 0 ? 'Home' : pos === 57 ? 'Finished' : `Position ${pos}`}
                      >
                        {pos === 0 ? '⌂' : pos === 57 ? '★' : pos}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {Array(4 - players.length).fill(null).map((_, i) => (
                <div key={`empty-${i}`} className="p-3 rounded-xl border-2 border-dashed border-slate-200 bg-white/50 flex items-center justify-center text-slate-300 text-sm">
                  Waiting...
                </div>
              ))}
            </div>

            {/* Dice */}
            {gameStarted && (
              <div className="flex flex-col items-center gap-4 py-4">
                <button
                  onClick={rollDice}
                  disabled={currentTurn !== myColorIndex || isRolling}
                  className={`w-20 h-20 rounded-2xl bg-white border-2 border-slate-200 shadow-lg flex items-center justify-center transition-all ${
                    currentTurn === myColorIndex && !isRolling ? 'hover:scale-110 hover:shadow-xl cursor-pointer' : 'opacity-60 cursor-default'
                  } ${isRolling ? 'animate-spin' : ''}`}
                >
                  <DiceIcon className="h-12 w-12 text-emerald-700" />
                </button>
                <p className="text-sm text-slate-500">
                  {currentTurn === myColorIndex 
                    ? (diceValue ? `You rolled ${diceValue}! Click a piece to move.` : 'Click dice to roll')
                    : `${players[currentTurn]?.name || 'Opponent'}'s turn`}
                </p>
              </div>
            )}

            {/* Simple board visualization */}
            {gameStarted && (
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Board Progress</h3>
                <div className="space-y-2">
                  {players.map((p) => (
                    <div key={p.userId} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${COLOR_CLASSES[p.color]}`} />
                      <span className="text-sm w-20 truncate">{p.userId === user.id ? 'You' : p.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        {p.pieces.map((pos, pi) => (
                          <div key={pi} className={`inline-block h-3 ${COLOR_CLASSES[p.color]} opacity-70`} style={{ width: `${(pos / 57) * 25}%`, marginLeft: pi > 0 ? '1px' : 0 }} />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">{p.pieces.filter(pos => pos === 57).length}/4 done</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => { if (channelRef) supabase.removeChannel(channelRef); setRoomCode(''); setGameStarted(false); setPlayers([]); }}>
                Leave Room
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ludo;
