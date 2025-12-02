import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkribblGame } from '@/components/SkribblGame';
import { Users, Crown, Trash2, Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
      const channel = supabase
        .channel('skribbl_rooms_list')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'skribbl_rooms' }, () => loadAvailableRooms())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, navigate]);

  const checkOwnerStatus = async () => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', user?.id).single();
    setIsOwner(data?.role === 'owner');
  };

  const loadAvailableRooms = async () => {
    const { data: rooms } = await supabase.from('skribbl_rooms').select('*').eq('status', 'waiting').order('created_at', { ascending: false });
    if (rooms) {
      const roomsWithCount = await Promise.all(
        rooms.map(async (room) => {
          const { count } = await supabase.from('skribbl_players').select('*', { count: 'exact', head: true }).eq('room_id', room.id).eq('is_connected', true);
          return { ...room, player_count: count || 0 };
        })
      );
      setAvailableRooms(roomsWithCount);
    }
  };

  const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const createRoom = async () => {
    if (!playerName.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' });
      return;
    }
    const code = generateRoomCode();
    const { error } = await supabase.from('skribbl_rooms').insert({ room_code: code, host_id: user?.id });
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
    const { data: room } = await supabase.from('skribbl_rooms').select('*').eq('room_code', code).single();
    if (!room) {
      toast({ title: 'Room not found', variant: 'destructive' });
      return;
    }
    const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6'];
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
  };

  const deleteRoom = async (roomId: string, roomCode: string) => {
    if (!isOwner) return;
    if (!confirm(`Delete room ${roomCode}?`)) return;
    await supabase.from('skribbl_rooms').delete().eq('id', roomId);
    loadAvailableRooms();
  };

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Room code copied!' });
  };

  if (!user) return null;
  if (currentRoomId) return <SkribblGame roomId={currentRoomId} onLeave={() => setCurrentRoomId(null)} />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #6B8DD6 0%, #8E37D7 100%)' }}>
      <div className="max-w-4xl w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/skribbl/logo.gif" alt="skribbl.io" className="h-24 mx-auto mb-4" />
          <p className="text-white/80 text-lg">Free Multiplayer Drawing & Guessing Game</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Panel - Create/Join */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <h2 className="text-xl font-black text-gray-800 mb-4">Play!</h2>
            
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">Your Name</label>
              <Input
                placeholder="Enter your nickname"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <Button onClick={createRoom} className="w-full h-14 text-lg font-bold bg-green-500 hover:bg-green-600">
              Create Private Room
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-500">or join with code</span></div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="h-12 text-lg font-mono uppercase"
              />
              <Button onClick={joinRoom} className="h-12 px-6 bg-blue-500 hover:bg-blue-600">
                Join
              </Button>
            </div>
          </div>

          {/* Right Panel - Available Rooms */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-800">Available Rooms</h2>
              <Button variant="ghost" size="sm" onClick={loadAvailableRooms} className="gap-1">
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {availableRooms.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-lg">No rooms available</p>
                  <p className="text-sm">Create one to start playing!</p>
                </div>
              ) : (
                availableRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Crown className="h-4 w-4" />
                      </div>
                      <span className="font-mono font-bold text-lg">{room.room_code}</span>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <Users className="h-4 w-4" />
                        <span>{room.player_count}/{room.max_players}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => copyRoomCode(room.room_code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      {isOwner && (
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => deleteRoom(room.id, room.room_code)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => {
                          if (!playerName.trim()) {
                            toast({ title: 'Enter your name first', variant: 'destructive' });
                            return;
                          }
                          joinRoomWithCode(room.room_code);
                        }}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          Draw, guess, and have fun with friends!
        </p>
      </div>
    </div>
  );
};

export default Skribbl;