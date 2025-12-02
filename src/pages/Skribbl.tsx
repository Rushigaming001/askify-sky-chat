import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SkribblGame } from '@/components/SkribblGame';
import { ArrowLeft, Users, Crown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface Room {
  id: string;
  room_code: string;
  host_id: string;
  status: string;
  player_count?: number;
  max_players: number;
}

const Skribbl = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      loadAvailableRooms();
      
      // Subscribe to room changes
      const channel = supabase
        .channel('skribbl_rooms_list')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'skribbl_rooms' 
        }, () => {
          loadAvailableRooms();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, navigate]);

  const loadAvailableRooms = async () => {
    const { data: rooms } = await supabase
      .from('skribbl_rooms')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });

    if (rooms) {
      // Get player count for each room
      const roomsWithCount = await Promise.all(
        rooms.map(async (room) => {
          const { count } = await supabase
            .from('skribbl_players')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('is_connected', true);
          
          return {
            ...room,
            player_count: count || 0,
          };
        })
      );
      
      setAvailableRooms(roomsWithCount);
    }
  };

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

      <Card className="max-w-4xl w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            skribbl.io
          </h1>
          <p className="text-muted-foreground">Free multiplayer drawing and guessing game</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create/Join Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Create or Join</h2>
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
                <span className="bg-background px-2 text-muted-foreground">Or use room code</span>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
              <Button onClick={joinRoom} className="w-full" variant="secondary">
                Join with Code
              </Button>
            </div>
          </div>

          {/* Available Rooms Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Available Rooms</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadAvailableRooms}
                className="h-8"
              >
                Refresh
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {availableRooms.length === 0 ? (
                <Card className="p-4 text-center text-muted-foreground">
                  No rooms available. Create one!
                </Card>
              ) : (
                availableRooms.map((room) => (
                  <Card 
                    key={room.id} 
                    className="p-4 hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => {
                      if (!playerName.trim()) {
                        toast({ title: 'Please enter your name first', variant: 'destructive' });
                        return;
                      }
                      joinRoomWithCode(room.room_code);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          <span className="font-mono font-bold text-lg">{room.room_code}</span>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {room.player_count}/{room.max_players}
                        </Badge>
                      </div>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!playerName.trim()) {
                            toast({ title: 'Please enter your name first', variant: 'destructive' });
                            return;
                          }
                          joinRoomWithCode(room.room_code);
                        }}
                      >
                        Join
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Skribbl;