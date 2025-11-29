import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Target, Users, Play, StopCircle, Trophy, Crosshair, Trash2 } from 'lucide-react';
import * as THREE from 'three';
import { Player } from './game/Player';
import { Bullet } from './game/Bullet';
import { GameArena } from './game/GameArena';
import { WebRTCCall } from './WebRTCCall';
import { FirstPersonCamera } from './game/FirstPersonCamera';

interface GameRoom {
  id: string;
  name: string;
  owner_id: string;
  status: string;
  max_players: number;
  created_at: string;
}

interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  player_name: string;
  score: number;
  kills: number;
  deaths: number;
  is_alive: boolean;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_y: number;
  health: number;
}

interface Bullet {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  ownerId: string;
}

export function MultiplayerShooter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<'lobby' | 'room' | 'game'>('lobby');
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [crosshairVisible, setCrosshairVisible] = useState(false);
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0 });
  const [inGameCall, setInGameCall] = useState(false);
  
  const moveSpeed = 0.15;
  const rotationSpeed = 0.002;
  const keysPressed = useRef<Set<string>>(new Set());
  const mouseMovement = useRef({ x: 0, y: 0 });
  const lastSyncTime = useRef(Date.now());

  useEffect(() => {
    loadRooms();
    
    // Subscribe to rooms updates
    const roomsChannel = supabase
      .channel('game-rooms-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_rooms'
      }, () => {
        loadRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
    };
  }, []);

  useEffect(() => {
    if (currentRoom) {
      loadParticipants();
      
      // Subscribe to participants updates
      const participantsChannel = supabase
        .channel(`room-${currentRoom.id}-participants`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${currentRoom.id}`
        }, () => {
          loadParticipants();
        })
        .subscribe();

      // Subscribe to realtime game state
      const gameChannel = supabase
        .channel(`game-${currentRoom.id}`)
        .on('broadcast', { event: 'player-move' }, ({ payload }) => {
          // Update other players' positions
          setParticipants(prev => prev.map(p => 
            p.user_id === payload.user_id 
              ? { ...p, position_x: payload.x, position_y: payload.y, position_z: payload.z, rotation_y: payload.rotation }
              : p
          ));
        })
        .on('broadcast', { event: 'player-shoot' }, ({ payload }) => {
          // Add bullet from other player
          setBullets(prev => [...prev, {
            id: `bullet-${Date.now()}-${Math.random()}`,
            position: payload.position,
            velocity: payload.velocity,
            ownerId: payload.ownerId
          }]);
        })
        .on('broadcast', { event: 'player-hit' }, ({ payload }) => {
          // Handle player hit
          if (payload.hitUserId === user?.id) {
            toast({
              title: '💥 Hit!',
              description: `You were hit by ${payload.shooterName}`,
              variant: 'destructive'
            });
          }
          updatePlayerHealth(payload.hitUserId, payload.damage);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(participantsChannel);
        supabase.removeChannel(gameChannel);
      };
    }
  }, [currentRoom]);

  useEffect(() => {
    if (view === 'game') {
      const handleKeyDown = (e: KeyboardEvent) => {
        keysPressed.current.add(e.key.toLowerCase());
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        keysPressed.current.delete(e.key.toLowerCase());
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (document.pointerLockElement) {
          mouseMovement.current.x += e.movementX;
          mouseMovement.current.y += e.movementY;
          
          setCameraRotation(prev => ({
            x: Math.max(-Math.PI / 3, Math.min(Math.PI / 3, prev.x - e.movementY * rotationSpeed)),
            y: prev.y - e.movementX * rotationSpeed
          }));
        }
      };

      const handleClick = () => {
        if (!document.pointerLockElement) {
          document.body.requestPointerLock();
        } else {
          shoot();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('click', handleClick);

      document.addEventListener('pointerlockchange', () => {
        setCrosshairVisible(!!document.pointerLockElement);
      });

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleClick);
      };
    }
  }, [view, currentRoom, participants]);

  useEffect(() => {
    if (view === 'game' && currentRoom) {
      const gameLoop = setInterval(() => {
        updatePlayerPosition();
        updateBullets();
      }, 1000 / 60); // 60 FPS

      return () => clearInterval(gameLoop);
    }
  }, [view, currentRoom, participants]);

  const loadRooms = async () => {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRooms(data);
    }
  };

  const loadParticipants = async () => {
    if (!currentRoom) return;

    const { data, error } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', currentRoom.id);

    if (!error && data) {
      setParticipants(data);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !user) return;

    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        name: newRoomName,
        owner_id: user.id,
        status: 'waiting'
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create room',
        variant: 'destructive'
      });
    } else {
      setNewRoomName('');
      toast({
        title: 'Room Created',
        description: `${newRoomName} is ready!`
      });
    }
  };

  const joinRoom = async (room: GameRoom) => {
    if (!user || !playerName.trim()) {
      toast({
        title: 'Enter Your Name',
        description: 'Please enter a player name first',
        variant: 'destructive'
      });
      return;
    }

    const { error } = await supabase
      .from('room_participants')
      .insert({
        room_id: room.id,
        user_id: user.id,
        player_name: playerName,
        position_x: Math.random() * 40 - 20, // Spread out in larger arena
        position_y: 0.5,
        position_z: Math.random() * 40 - 20
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: 'Already Joined',
          description: 'You are already in this room'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to join room',
          variant: 'destructive'
        });
      }
    } else {
      setCurrentRoom(room);
      setView('room');
    }
  };

  const deleteRoom = async (roomId: string) => {
    const { error } = await supabase
      .from('game_rooms')
      .delete()
      .eq('id', roomId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete room',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Room Deleted',
        description: 'Room has been deleted successfully'
      });
      loadRooms();
    }
  };

  const leaveRoom = async () => {
    if (!currentRoom || !user) return;

    await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', currentRoom.id)
      .eq('user_id', user.id);

    setCurrentRoom(null);
    setView('lobby');
  };

  const startGame = async () => {
    if (!currentRoom || !user || currentRoom.owner_id !== user.id) return;

    const { error } = await supabase
      .from('game_rooms')
      .update({ 
        status: 'playing',
        started_at: new Date().toISOString()
      })
      .eq('id', currentRoom.id);

    if (!error) {
      setView('game');
      setInGameCall(true);
      toast({
        title: '🎮 Game Started!',
        description: 'Click to lock mouse and shoot! WASD to move, mouse to aim.'
      });
    }
  };

  const endGame = async () => {
    if (!currentRoom || !user || currentRoom.owner_id !== user.id) return;

    const { error } = await supabase
      .from('game_rooms')
      .update({ 
        status: 'finished',
        ended_at: new Date().toISOString()
      })
      .eq('id', currentRoom.id);

    if (!error) {
      setInGameCall(false);
      setView('room');
    }
  };

  const updatePlayerPosition = async () => {
    if (!currentRoom || !user) return;

    const myParticipant = participants.find(p => p.user_id === user.id);
    if (!myParticipant) return;

    let dx = 0;
    let dz = 0;
    let rotationChanged = false;
    let newRotation = myParticipant.rotation_y;

    // Movement
    if (keysPressed.current.has('w')) dz -= moveSpeed;
    if (keysPressed.current.has('s')) dz += moveSpeed;
    if (keysPressed.current.has('a')) dx -= moveSpeed;
    if (keysPressed.current.has('d')) dx += moveSpeed;

    // Rotation from mouse
    if (Math.abs(mouseMovement.current.x) > 0 || Math.abs(mouseMovement.current.y) > 0) {
      newRotation = cameraRotation.y;
      mouseMovement.current.x = 0;
      mouseMovement.current.y = 0;
      rotationChanged = true;
    }

    if (dx !== 0 || dz !== 0 || rotationChanged) {
      // Rotate movement based on player rotation
      const cos = Math.cos(newRotation);
      const sin = Math.sin(newRotation);
      const rotatedDx = dx * cos - dz * sin;
      const rotatedDz = dx * sin + dz * cos;

      const newX = myParticipant.position_x + rotatedDx;
      const newZ = myParticipant.position_z + rotatedDz;

      // Boundary check (larger arena)
      const boundedX = Math.max(-30, Math.min(30, newX));
      const boundedZ = Math.max(-30, Math.min(30, newZ));

      // Update in database periodically (every 100ms)
      const now = Date.now();
      if (now - lastSyncTime.current > 100) {
        await supabase
          .from('room_participants')
          .update({
            position_x: boundedX,
            position_z: boundedZ,
            rotation_y: newRotation
          })
          .eq('id', myParticipant.id);

        // Broadcast to other players
        const channel = supabase.channel(`game-${currentRoom.id}`);
        channel.send({
          type: 'broadcast',
          event: 'player-move',
          payload: {
            user_id: user.id,
            x: boundedX,
            y: myParticipant.position_y,
            z: boundedZ,
            rotation: newRotation
          }
        });

        lastSyncTime.current = now;
      }

      // Update local state immediately
      setParticipants(prev => prev.map(p =>
        p.user_id === user.id
          ? { ...p, position_x: boundedX, position_z: boundedZ, rotation_y: newRotation }
          : p
      ));
    }
  };

  const shoot = async () => {
    if (!currentRoom || !user) return;

    const myParticipant = participants.find(p => p.user_id === user.id);
    if (!myParticipant || !myParticipant.is_alive) return;

    const bulletId = `bullet-${Date.now()}-${Math.random()}`;
    const speed = 1.2;
    
    // Use camera rotation for shooting direction (first-person)
    const direction = new THREE.Vector3(
      -Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x),
      Math.sin(cameraRotation.x),
      -Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x)
    ).normalize();

    const startPos: [number, number, number] = [
      myParticipant.position_x + direction.x * 0.5,
      myParticipant.position_y + 1.5 + direction.y * 0.5, // Eye level
      myParticipant.position_z + direction.z * 0.5
    ];

    const velocity: [number, number, number] = [
      direction.x * speed,
      direction.y * speed,
      direction.z * speed
    ];

    // Add bullet locally
    setBullets(prev => [...prev, {
      id: bulletId,
      position: startPos,
      velocity,
      ownerId: user.id
    }]);

    // Broadcast shoot event
    const channel = supabase.channel(`game-${currentRoom.id}`);
    channel.send({
      type: 'broadcast',
      event: 'player-shoot',
      payload: {
        ownerId: user.id,
        position: startPos,
        velocity
      }
    });
  };

  const updateBullets = () => {
    setBullets(prev => {
      const updated = prev
        .map(bullet => ({
          ...bullet,
          position: [
            bullet.position[0] + bullet.velocity[0],
            bullet.position[1] + bullet.velocity[1],
            bullet.position[2] + bullet.velocity[2]
          ] as [number, number, number]
        }))
        .filter(bullet => {
          const [x, y, z] = bullet.position;
          return Math.abs(x) < 30 && Math.abs(z) < 30 && y > -1;
        });

      // Check for hits
      updated.forEach(bullet => {
        participants.forEach(p => {
          if (p.user_id !== bullet.ownerId && p.is_alive) {
            // Check 3D distance including Y coordinate (height)
            const dist = Math.sqrt(
              Math.pow(bullet.position[0] - p.position_x, 2) +
              Math.pow(bullet.position[1] - (p.position_y + 1.0), 2) + // Center of mass
              Math.pow(bullet.position[2] - p.position_z, 2)
            );
            
            if (dist < 0.8) { // Hit radius
              handlePlayerHit(bullet.ownerId, p.user_id);
            }
          }
        });
      });

      return updated;
    });
  };

  const handlePlayerHit = async (shooterId: string, hitUserId: string) => {
    if (!currentRoom) return;

    const damage = 25;
    const shooter = participants.find(p => p.user_id === shooterId);
    
    // Broadcast hit event
    const channel = supabase.channel(`game-${currentRoom.id}`);
    channel.send({
      type: 'broadcast',
      event: 'player-hit',
      payload: {
        shooterId,
        shooterName: shooter?.player_name || 'Someone',
        hitUserId,
        damage
      }
    });
  };

  const updatePlayerHealth = async (userId: string, damage: number) => {
    const participant = participants.find(p => p.user_id === userId);
    if (!participant) return;

    const newHealth = Math.max(0, participant.health - damage);
    const isDead = newHealth <= 0;

    await supabase
      .from('room_participants')
      .update({
        health: newHealth,
        is_alive: !isDead,
        deaths: isDead ? participant.deaths + 1 : participant.deaths
      })
      .eq('id', participant.id);

    if (isDead && userId === user?.id) {
      toast({
        title: '☠️ You Died!',
        description: 'Respawning in 3 seconds...'
      });

      setTimeout(async () => {
        await supabase
          .from('room_participants')
          .update({
            health: 100,
            is_alive: true,
            position_x: Math.random() * 40 - 20,
            position_z: Math.random() * 40 - 20
          })
          .eq('id', participant.id);
      }, 3000);
    }
  };

  const isOwner = currentRoom && user && currentRoom.owner_id === user.id;

  return (
    <div className="w-full h-full">
      {view === 'lobby' && (
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold">Multiplayer Shooter</h2>
          </div>

          <Card className="p-4 space-y-4">
            <h3 className="text-xl font-semibold">Create New Room</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your player name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createRoom} disabled={!newRoomName.trim() || !playerName.trim()}>
                Create Room
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Available Rooms</h3>
            <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {rooms.map(room => {
                    const isRoomOwner = user && room.owner_id === user.id;
                    return (
                      <Card key={room.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{room.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={room.status === 'waiting' ? 'default' : room.status === 'playing' ? 'secondary' : 'outline'}>
                                {room.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {participants.filter(p => p.room_id === room.id).length}/{room.max_players}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => joinRoom(room)}
                              disabled={room.status !== 'waiting' || !playerName.trim()}
                              size="sm"
                            >
                              Join
                            </Button>
                            {isRoomOwner && room.status === 'waiting' && (
                              <Button 
                                onClick={() => deleteRoom(room.id)}
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                {rooms.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No rooms available. Create one!
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {view === 'room' && currentRoom && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">{currentRoom.name}</h2>
              <Badge className="mt-2">{currentRoom.status}</Badge>
            </div>
            <div className="flex gap-2">
              {isOwner && (
                <Button onClick={startGame} disabled={participants.length < 2}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Game
                </Button>
              )}
              <Button variant="outline" onClick={leaveRoom}>
                Leave Room
              </Button>
            </div>
          </div>

          <Card className="p-4">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players ({participants.length}/{currentRoom.max_players})
            </h3>
            <div className="space-y-2">
              {participants.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded bg-muted">
                  <span className="font-medium">{p.player_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {p.score}
                    </span>
                    {p.user_id === currentRoom.owner_id && (
                      <Badge variant="secondary">Owner</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {!isOwner && (
            <Card className="p-4 bg-amber-500/10 border-amber-500/50">
              <p className="text-sm">Waiting for room owner to start the game...</p>
            </Card>
          )}
        </div>
      )}

      {view === 'game' && currentRoom && (
        <div className="relative w-full h-screen bg-black">
          {crosshairVisible && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="relative">
                <Crosshair className="h-6 w-6 text-red-500" strokeWidth={2} />
                <div className="absolute inset-0 animate-ping">
                  <Crosshair className="h-6 w-6 text-red-500/50" strokeWidth={2} />
                </div>
              </div>
            </div>
          )}

          <div className="absolute top-4 left-4 z-50 space-y-2">
            {participants.find(p => p.user_id === user?.id) && (
              <Card className="p-3 bg-background/80 backdrop-blur">
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Health:</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${participants.find(p => p.user_id === user?.id)?.health || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Kills: {participants.find(p => p.user_id === user?.id)?.kills || 0}</span>
                    <span>Deaths: {participants.find(p => p.user_id === user?.id)?.deaths || 0}</span>
                  </div>
                </div>
              </Card>
            )}

            {isOwner && (
              <Button variant="destructive" size="sm" onClick={endGame}>
                <StopCircle className="mr-2 h-4 w-4" />
                End Game
              </Button>
            )}
          </div>

          <div className="absolute top-4 right-4 z-50">
            <Card className="p-3 bg-background/80 backdrop-blur">
              <h4 className="font-semibold text-sm mb-2">Leaderboard</h4>
              <div className="space-y-1 text-xs">
                {[...participants]
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 5)
                  .map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between gap-3">
                      <span className="font-medium">#{i + 1} {p.player_name}</span>
                      <span className="text-muted-foreground">{p.score}</span>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <Card className="px-4 py-2 bg-black/80 backdrop-blur text-xs font-semibold text-white border-primary">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1">
                  <span className="text-primary">W/A/S/D:</span> Move
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-primary">Mouse:</span> Look Around
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-primary">Click:</span> Shoot
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-primary">ESC:</span> Unlock Mouse
                </span>
              </div>
            </Card>
          </div>

          <Canvas camera={{ position: [0, 1.6, 0], fov: 75 }}>
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
            <pointLight position={[0, 5, 0]} intensity={0.3} />
            
            <GameArena />
            
            {/* Render other players (not yourself) */}
            {participants.filter(p => p.user_id !== user?.id).map(participant => (
              <Player
                key={participant.id}
                position={[participant.position_x, participant.position_y, participant.position_z]}
                rotation={participant.rotation_y}
                color="#ff4444"
                name={participant.player_name}
                health={participant.health}
                isAlive={participant.is_alive}
              />
            ))}

            {bullets.map(bullet => (
              <Bullet key={bullet.id} position={bullet.position} />
            ))}

            {/* First-person camera controller */}
            {participants.find(p => p.user_id === user?.id) && (
              <FirstPersonCamera
                position={[
                  participants.find(p => p.user_id === user?.id)!.position_x,
                  participants.find(p => p.user_id === user?.id)!.position_y,
                  participants.find(p => p.user_id === user?.id)!.position_z
                ]}
                rotation={cameraRotation}
              />
            )}
          </Canvas>

          {/* In-game voice and video chat */}
          {inGameCall && currentRoom && (
            <WebRTCCall
              isOpen={inGameCall}
              onClose={() => setInGameCall(false)}
              callType="video"
              recipientName={currentRoom.name}
              recipientId="public"
              isInitiator={true}
            />
          )}
        </div>
      )}
    </div>
  );
}
