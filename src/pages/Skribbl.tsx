import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SkribblGame } from '@/components/SkribblGame';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Skribbl = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async () => {
    if (!playerName.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' });
      return;
    }

    const code = generateRoomCode();
    const { data: room, error } = await supabase
      .from('skribbl_rooms')
      .insert({
        room_code: code,
        host_id: user?.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Failed to create room', variant: 'destructive' });
      return;
    }

    await joinRoomWithCode(code);
  };

  const joinRoom = async () => {
    if (!roomCode.trim() || !playerName.trim()) {
      toast({ title: 'Please enter room code and name', variant: 'destructive' });
      return;
    }

    await joinRoomWithCode(roomCode.toUpperCase());
  };

  const joinRoomWithCode = async (code: string) => {
    const { data: room } = await supabase
      .from('skribbl_rooms')
      .select('*')
      .eq('room_code', code)
      .single();

    if (!room) {
      toast({ title: 'Room not found', variant: 'destructive' });
      return;
    }

    const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const { error } = await supabase.from('skribbl_players').insert({
      room_id: room.id,
      user_id: user?.id,
      player_name: playerName,
      avatar_color: randomColor,
    });

    if (error) {
      toast({ title: 'Failed to join room', variant: 'destructive' });
      return;
    }

    setCurrentRoomId(room.id);
    toast({ title: 'Joined room successfully!' });
  };

  if (!user) return null;

  if (currentRoomId) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setCurrentRoomId(null);
            navigate('/');
          }}
          className="absolute top-4 left-4 z-50 bg-background/80 backdrop-blur-sm hover:bg-background/90"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <SkribblGame roomId={currentRoomId} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-50 bg-background/80 backdrop-blur-sm hover:bg-background/90"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <Card className="max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            skribbl.io
          </h1>
          <p className="text-muted-foreground">Free multiplayer drawing and guessing game</p>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <Button onClick={createRoom} className="w-full" size="lg">
            Create Private Room
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or join existing</span>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
            />
            <Button onClick={joinRoom} className="w-full" variant="secondary">
              Join Room
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Skribbl;