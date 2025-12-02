import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SkribblGame } from '@/components/SkribblGame';
import { Users, Crown, Trash2 } from 'lucide-react';
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
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      checkOwnerStatus();
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

  const checkOwnerStatus = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .single();
    
    setIsOwner(data?.role === 'owner');
  };

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

  const deleteRoom = async (roomId: string, roomCode: string) => {
    if (!isOwner) {
      toast({ title: 'Only owners can delete rooms', variant: 'destructive' });
      return;
    }

    if (!confirm(`Delete room ${roomCode}?`)) return;

    try {
      await supabase.from('skribbl_rooms').delete().eq('id', roomId);
      toast({ title: 'Room deleted successfully' });
      loadAvailableRooms();
    } catch (error) {
      toast({ title: 'Failed to delete room', variant: 'destructive' });
    }
  };

  if (!user) return null;

  if (currentRoomId) {
    return <SkribblGame roomId={currentRoomId} onLeave={() => setCurrentRoomId(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#5089EC] flex items-center justify-center p-4 relative overflow-hidden">
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

      <Card className="max-w-4xl w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold" style={{ color: '#5B6DCD', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
            skribbl.io
          </h1>
          <p className="text-muted-foreground text-lg">Free multiplayer drawing and guessing game</p>
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
                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <Button 
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRoom(room.id, room.room_code);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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