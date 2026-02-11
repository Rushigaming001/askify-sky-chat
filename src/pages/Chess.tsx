import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Crown, RotateCcw, Copy, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Chess piece types
type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
type PieceColor = 'w' | 'b';
interface Piece { type: PieceType; color: PieceColor; }
type Board = (Piece | null)[][];

const PIECE_SYMBOLS: Record<string, string> = {
  'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
  'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟',
};

function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  const backRow: PieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: backRow[i], color: 'b' };
    board[1][i] = { type: 'P', color: 'b' };
    board[6][i] = { type: 'P', color: 'w' };
    board[7][i] = { type: backRow[i], color: 'w' };
  }
  return board;
}

function isValidMove(board: Board, fromR: number, fromC: number, toR: number, toC: number, turn: PieceColor): boolean {
  const piece = board[fromR][fromC];
  if (!piece || piece.color !== turn) return false;
  const target = board[toR][toC];
  if (target && target.color === turn) return false;
  const dr = toR - fromR, dc = toC - fromC;
  const adr = Math.abs(dr), adc = Math.abs(dc);

  const pathClear = (rDir: number, cDir: number, steps: number) => {
    for (let s = 1; s < steps; s++) {
      if (board[fromR + rDir * s][fromC + cDir * s]) return false;
    }
    return true;
  };

  switch (piece.type) {
    case 'P': {
      const dir = piece.color === 'w' ? -1 : 1;
      const startRow = piece.color === 'w' ? 6 : 1;
      if (dc === 0 && !target) {
        if (dr === dir) return true;
        if (dr === 2 * dir && fromR === startRow && !board[fromR + dir][fromC]) return true;
      }
      if (adc === 1 && dr === dir && target) return true;
      return false;
    }
    case 'R': return (dr === 0 || dc === 0) && pathClear(Math.sign(dr), Math.sign(dc), Math.max(adr, adc));
    case 'B': return adr === adc && adr > 0 && pathClear(Math.sign(dr), Math.sign(dc), adr);
    case 'Q': return ((dr === 0 || dc === 0) || (adr === adc)) && adr + adc > 0 && pathClear(Math.sign(dr), Math.sign(dc), Math.max(adr, adc));
    case 'N': return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
    case 'K': return adr <= 1 && adc <= 1 && (adr + adc > 0);
    default: return false;
  }
}

const Chess = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>(createInitialBoard());
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [myColor, setMyColor] = useState<PieceColor | null>(null);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [channelRef, setChannelRef] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth', { replace: true });
  }, [authLoading, user, navigate]);

  const createRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    setMyColor('w');
    setGameStarted(false);
    setOpponentJoined(false);
    joinChannel(code, 'w');
    toast.success(`Room created! Code: ${code}`);
  };

  const joinRoom = () => {
    if (!joinCode.trim()) { toast.error('Enter a room code'); return; }
    setRoomCode(joinCode.toUpperCase());
    setMyColor('b');
    joinChannel(joinCode.toUpperCase(), 'b');
  };

  const joinChannel = (code: string, color: PieceColor) => {
    if (channelRef) supabase.removeChannel(channelRef);
    
    const channel = supabase.channel(`chess-${code}`);
    channel
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        setBoard(payload.board);
        setTurn(payload.turn);
      })
      .on('broadcast', { event: 'player-joined' }, () => {
        setOpponentJoined(true);
        setGameStarted(true);
        toast.success('Opponent joined!');
      })
      .on('broadcast', { event: 'reset' }, () => {
        setBoard(createInitialBoard());
        setTurn('w');
        setSelected(null);
        toast.info('Game reset by opponent');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (color === 'b') {
            channel.send({ type: 'broadcast', event: 'player-joined', payload: {} });
            setOpponentJoined(true);
            setGameStarted(true);
          }
        }
      });
    setChannelRef(channel);
  };

  useEffect(() => () => { if (channelRef) supabase.removeChannel(channelRef); }, [channelRef]);

  const handleCellClick = (r: number, c: number) => {
    if (!gameStarted || turn !== myColor) return;
    if (selected) {
      const [sr, sc] = selected;
      if (isValidMove(board, sr, sc, r, c, turn)) {
        const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
        newBoard[r][c] = newBoard[sr][sc];
        newBoard[sr][sc] = null;
        // Pawn promotion
        if (newBoard[r][c]?.type === 'P' && (r === 0 || r === 7)) {
          newBoard[r][c] = { type: 'Q', color: turn };
        }
        const newTurn: PieceColor = turn === 'w' ? 'b' : 'w';
        setBoard(newBoard);
        setTurn(newTurn);
        setSelected(null);
        channelRef?.send({ type: 'broadcast', event: 'move', payload: { board: newBoard, turn: newTurn } });
      } else {
        setSelected(board[r][c]?.color === myColor ? [r, c] : null);
      }
    } else {
      if (board[r][c]?.color === myColor) setSelected([r, c]);
    }
  };

  const resetGame = () => {
    setBoard(createInitialBoard());
    setTurn('w');
    setSelected(null);
    channelRef?.send({ type: 'broadcast', event: 'reset', payload: {} });
  };

  if (authLoading || !user) return null;

  // Display board flipped for black
  const displayBoard = myColor === 'b' ? [...board].reverse().map(row => [...row].reverse()) : board;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Crown className="h-6 w-6 text-amber-600" />
          <h1 className="text-2xl font-bold text-slate-800">Online Chess</h1>
        </div>

        {!roomCode ? (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Create or Join a Game</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={createRoom} className="w-full bg-amber-600 hover:bg-amber-700">
                  <Users className="h-4 w-4 mr-2" /> Create Room
                </Button>
                <div className="flex gap-2">
                  <Input placeholder="Enter room code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="uppercase" />
                  <Button onClick={joinRoom} variant="outline">Join</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white/80 backdrop-blur rounded-xl p-3 border border-amber-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Room:</span>
                <span className="font-mono font-bold text-amber-700">{roomCode}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(roomCode); toast.success('Copied!'); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${opponentJoined ? 'text-green-600' : 'text-orange-500'}`}>
                  {opponentJoined ? '● Opponent connected' : '○ Waiting for opponent...'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium">
                You: <span className={myColor === 'w' ? 'text-amber-700' : 'text-slate-800'}>{myColor === 'w' ? '♔ White' : '♚ Black'}</span>
              </span>
              <span className={`text-sm font-bold ${turn === myColor ? 'text-green-600' : 'text-slate-400'}`}>
                {turn === myColor ? 'Your turn' : "Opponent's turn"}
              </span>
            </div>

            {/* Chess Board */}
            <div className="aspect-square max-w-lg mx-auto">
              <div className="grid grid-cols-8 border-2 border-amber-800 rounded-lg overflow-hidden shadow-xl">
                {displayBoard.map((row, ri) =>
                  row.map((piece, ci) => {
                    const actualR = myColor === 'b' ? 7 - ri : ri;
                    const actualC = myColor === 'b' ? 7 - ci : ci;
                    const isLight = (ri + ci) % 2 === 0;
                    const isSelected = selected && selected[0] === actualR && selected[1] === actualC;
                    const canMove = selected && isValidMove(board, selected[0], selected[1], actualR, actualC, turn) && turn === myColor;

                    return (
                      <button
                        key={`${ri}-${ci}`}
                        className={`aspect-square flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-normal transition-all duration-150 relative
                          ${isLight ? 'bg-amber-100' : 'bg-amber-700'}
                          ${isSelected ? 'ring-4 ring-blue-400 ring-inset z-10' : ''}
                          ${canMove ? 'after:absolute after:w-3 after:h-3 after:rounded-full after:bg-blue-400/50' : ''}
                          ${turn === myColor ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}
                        `}
                        onClick={() => handleCellClick(actualR, actualC)}
                      >
                        {piece && PIECE_SYMBOLS[`${piece.color}${piece.type}`]}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={resetGame}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
              <Button variant="outline" size="sm" onClick={() => { if (channelRef) supabase.removeChannel(channelRef); setRoomCode(''); setGameStarted(false); }}>
                Leave Room
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chess;
