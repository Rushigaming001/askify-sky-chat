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
import { Target, Users, Play, StopCircle, Trophy, Crosshair, Trash2, Maximize } from 'lucide-react';
import * as THREE from 'three';
import { Player } from './game/Player';
import { Bullet } from './game/Bullet';
import { GameArena } from './game/GameArena';
import { FirstPersonCamera } from './game/FirstPersonCamera';
import { GameHUD } from './game/GameHUD';
import { WeaponType, WEAPONS } from './game/WeaponSystem';
import { WeaponViewModel } from './game/WeaponViewModel';
import { MuzzleFlash } from './game/MuzzleFlash';

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
  team: 'red' | 'blue';
  current_weapon: WeaponType;
}

interface BulletData {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  ownerId: string;
  ownerTeam: 'red' | 'blue';
  damage: number;
  color: string;
}

export function MultiplayerShooter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<'menu' | 'lobby' | 'game'>('menu');
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [bullets, setBullets] = useState<BulletData[]>([]);
  const [crosshairVisible, setCrosshairVisible] = useState(false);
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0 });
  const [inGameCall, setInGameCall] = useState(false);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('rifle');
  const [gameTime, setGameTime] = useState(300);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<'red' | 'blue'>('red');
  const [touchControls, setTouchControls] = useState({ moveX: 0, moveY: 0, lookX: 0, lookY: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  
  const moveSpeed = 0.35; // Much faster movement
  const sprintMultiplier = 1.5; // Sprint speed
  const rotationSpeed = 0.003;
  const keysPressed = useRef<Set<string>>(new Set());
  const mouseMovement = useRef({ x: 0, y: 0 });
  const lastSyncTime = useRef(Date.now());
  const lastShotTime = useRef(0);
  const velocity = useRef({ x: 0, z: 0 });
  const isSprinting = useRef(false);

  useEffect(() => {
    // Detect mobile
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (currentRoom) {
      loadParticipants();
      
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

      const gameChannel = supabase
        .channel(`game-${currentRoom.id}`)
        .on('broadcast', { event: 'player-move' }, ({ payload }) => {
          setParticipants(prev => prev.map(p => 
            p.user_id === payload.user_id 
              ? { ...p, position_x: payload.x, position_y: payload.y, position_z: payload.z, rotation_y: payload.rotation }
              : p
          ));
        })
        .on('broadcast', { event: 'player-shoot' }, ({ payload }) => {
          setBullets(prev => [...prev, {
            id: `bullet-${Date.now()}-${Math.random()}`,
            position: payload.position,
            velocity: payload.velocity,
            ownerId: payload.ownerId,
            ownerTeam: payload.team,
            damage: payload.damage,
            color: payload.color
          }]);
        })
        .on('broadcast', { event: 'player-hit' }, ({ payload }) => {
          if (payload.hitUserId === user?.id) {
            toast({
              title: '💥 Hit!',
              description: `${payload.damage} damage from ${payload.shooterName}`,
              variant: 'destructive'
            });
          }
          updatePlayerHealth(payload.hitUserId, payload.damage, payload.shooterId);
        })
        .on('broadcast', { event: 'weapon-change' }, ({ payload }) => {
          setParticipants(prev => prev.map(p =>
            p.user_id === payload.user_id
              ? { ...p, current_weapon: payload.weapon }
              : p
          ));
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
        const key = e.key.toLowerCase();
        keysPressed.current.add(key);
        // Also add uppercase for compatibility
        keysPressed.current.add(e.key.toUpperCase());
        
        // Weapon switching with number keys
        if (key >= '1' && key <= '5') {
          const weapons: WeaponType[] = ['smg', 'rifle', 'sniper', 'shotgun', 'special'];
          const newWeapon = weapons[parseInt(key) - 1];
          changeWeapon(newWeapon);
        }

        // Escape to exit
        if (key === 'escape' && document.pointerLockElement) {
          document.exitPointerLock();
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        keysPressed.current.delete(key);
        keysPressed.current.delete(e.key.toUpperCase());
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
        setCrosshairVisible(!!document.pointerLockElement || isMobile);
      });

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleClick);
      };
    }
  }, [view, currentRoom, participants, currentWeapon]);

  useEffect(() => {
    if (view === 'game' && currentRoom) {
      const gameLoop = setInterval(() => {
        updatePlayerPosition();
        updateBullets();
      }, 1000 / 60);

      // Mobile crosshair always visible
      if (isMobile) {
        setCrosshairVisible(true);
      }

      return () => clearInterval(gameLoop);
    }
  }, [view, currentRoom, participants, isMobile]);

  useEffect(() => {
    if (view === 'game' && currentRoom?.status === 'playing') {
      const timer = setInterval(() => {
        setGameTime(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [view, currentRoom]);

  const ensureGlobalRoom = async () => {
    if (!user) return null;

    // Check if any waiting lobby exists
    const { data: existingRooms } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('name', 'GLOBAL_LOBBY')
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
      .limit(1);

    if (existingRooms && existingRooms.length > 0) {
      return existingRooms[0];
    }

    // Only create if no waiting room exists
    const { data: newRoom, error } = await supabase
      .from('game_rooms')
      .insert({
        name: 'GLOBAL_LOBBY',
        owner_id: user.id,
        status: 'waiting'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create global lobby:', error);
      return null;
    }

    return newRoom;
  };

  const loadParticipants = async () => {
    if (!currentRoom) return;

    const { data, error } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', currentRoom.id);

    if (!error && data) {
      setParticipants(data as RoomParticipant[]);
    }
  };

  const joinGlobalLobby = async () => {
    if (!user) return;

    setIsJoining(true);

    // Try to find an existing waiting lobby first
    const { data: rooms } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('name', 'GLOBAL_LOBBY')
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
      .limit(1);

    let room = rooms && rooms.length > 0 ? rooms[0] : null;

    // If no room exists, create one
    if (!room) {
      room = await ensureGlobalRoom();
      if (!room) {
        toast({
          title: 'Error',
          description: 'Failed to create lobby',
          variant: 'destructive'
        });
        setIsJoining(false);
        return;
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const { error } = await supabase
      .from('room_participants')
      .insert({
        room_id: room.id,
        user_id: user.id,
        player_name: profile?.name || 'Player',
        team: selectedTeam,
        position_x: Math.random() * 40 - 20,
        position_y: 0.5,
        position_z: Math.random() * 40 - 20
      });

    if (error && error.code !== '23505') {
      toast({
        title: 'Error',
        description: 'Failed to join lobby',
        variant: 'destructive'
      });
      setIsJoining(false);
      return;
    }

    setCurrentRoom(room);
    setView('lobby');
    setIsJoining(false);
    toast({
      title: `Joined ${selectedTeam.toUpperCase()} Team!`,
      description: 'Waiting for game to start...'
    });
  };

  const leaveLobby = async () => {
    if (!currentRoom || !user) return;

    await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', currentRoom.id)
      .eq('user_id', user.id);

    setCurrentRoom(null);
    setView('menu');
    setInGameCall(false);
  };

  const startGame = async () => {
    if (!currentRoom || !user) return;

    // Check if user is owner/admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isOwnerOrAdmin = userRole?.role === 'owner' || userRole?.role === 'admin';

    if (!isOwnerOrAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only owner/admin can start the game',
        variant: 'destructive'
      });
      return;
    }

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
      setGameTime(300);
      toast({
        title: '🎮 Game Started!',
        description: 'Click to lock mouse and shoot! WASD to move, 1-5 to switch weapons.'
      });
    }
  };

  const endGame = async () => {
    if (!currentRoom || !user) return;

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isOwnerOrAdmin = userRole?.role === 'owner' || userRole?.role === 'admin';

    if (!isOwnerOrAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only owner/admin can end the game',
        variant: 'destructive'
      });
      return;
    }

    const { error } = await supabase
      .from('game_rooms')
      .update({ 
        status: 'waiting',
        ended_at: new Date().toISOString()
      })
      .eq('id', currentRoom.id);

    if (!error) {
      setInGameCall(false);
      setView('lobby');
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const changeWeapon = async (weapon: WeaponType) => {
    if (!currentRoom || !user) return;

    setCurrentWeapon(weapon);

    const myParticipant = participants.find(p => p.user_id === user.id);
    if (!myParticipant) return;

    await supabase
      .from('room_participants')
      .update({ current_weapon: weapon })
      .eq('id', myParticipant.id);

    const channel = supabase.channel(`game-${currentRoom.id}`);
    channel.send({
      type: 'broadcast',
      event: 'weapon-change',
      payload: {
        user_id: user.id,
        weapon
      }
    });
  };

  const updatePlayerPosition = async () => {
    if (!currentRoom || !user) return;

    const myParticipant = participants.find(p => p.user_id === user.id);
    if (!myParticipant) return;

    let targetVelX = 0;
    let targetVelZ = 0;
    let rotationChanged = false;
    let newRotation = myParticipant.rotation_y;

    // Check for sprint (Shift key)
    const hasShift = keysPressed.current.has('shift') || keysPressed.current.has('Shift');
    isSprinting.current = hasShift;

    // Desktop controls - check for both lowercase and uppercase
    const hasW = keysPressed.current.has('w') || keysPressed.current.has('W');
    const hasS = keysPressed.current.has('s') || keysPressed.current.has('S');
    const hasA = keysPressed.current.has('a') || keysPressed.current.has('A');
    const hasD = keysPressed.current.has('d') || keysPressed.current.has('D');

    if (hasW) targetVelZ -= 1;
    if (hasS) targetVelZ += 1;
    if (hasA) targetVelX -= 1;
    if (hasD) targetVelX += 1;

    // Normalize diagonal movement
    if (targetVelX !== 0 && targetVelZ !== 0) {
      const magnitude = Math.sqrt(targetVelX * targetVelX + targetVelZ * targetVelZ);
      targetVelX /= magnitude;
      targetVelZ /= magnitude;
    }

    // Mobile touch controls
    if (isMobile && (touchControls.moveX !== 0 || touchControls.moveY !== 0)) {
      targetVelX = touchControls.moveX;
      targetVelZ = touchControls.moveY;
    }

    // Faster acceleration
    const acceleration = 0.5;
    velocity.current.x += (targetVelX - velocity.current.x) * acceleration;
    velocity.current.z += (targetVelZ - velocity.current.z) * acceleration;

    // Stop completely when very small
    if (Math.abs(velocity.current.x) < 0.01) velocity.current.x = 0;
    if (Math.abs(velocity.current.z) < 0.01) velocity.current.z = 0;

    if (Math.abs(mouseMovement.current.x) > 0 || Math.abs(mouseMovement.current.y) > 0) {
      newRotation = cameraRotation.y;
      mouseMovement.current.x = 0;
      mouseMovement.current.y = 0;
      rotationChanged = true;
    }

    if (velocity.current.x !== 0 || velocity.current.z !== 0 || rotationChanged) {
      const currentSpeed = moveSpeed * (isSprinting.current ? sprintMultiplier : 1);
      const cos = Math.cos(newRotation);
      const sin = Math.sin(newRotation);
      const rotatedDx = velocity.current.x * currentSpeed * cos - velocity.current.z * currentSpeed * sin;
      const rotatedDz = velocity.current.x * currentSpeed * sin + velocity.current.z * currentSpeed * cos;

      let newX = myParticipant.position_x + rotatedDx;
      let newZ = myParticipant.position_z + rotatedDz;

      // Collision detection with map boundaries
      const playerRadius = 0.5;
      newX = Math.max(-28 + playerRadius, Math.min(28 - playerRadius, newX));
      newZ = Math.max(-28 + playerRadius, Math.min(28 - playerRadius, newZ));

      // Collision with buildings (simplified AABB collision)
      const buildings = [
        { x: -20, z: -18, w: 10, d: 10 },
        { x: 20, z: -18, w: 12, d: 12 },
        { x: -20, z: 18, w: 9, d: 9 },
        { x: 20, z: 18, w: 11, d: 11 },
        { x: 0, z: -22, w: 14, d: 6 },
        { x: 0, z: 22, w: 12, d: 7 },
        { x: -15, z: 0, w: 8, d: 8 },
        { x: 15, z: 0, w: 8, d: 8 },
      ];

      for (const building of buildings) {
        const halfW = building.w / 2 + playerRadius;
        const halfD = building.d / 2 + playerRadius;
        
        if (Math.abs(newX - building.x) < halfW && Math.abs(newZ - building.z) < halfD) {
          // Collision detected, prevent movement
          const prevX = myParticipant.position_x;
          const prevZ = myParticipant.position_z;
          
          // Try sliding along walls
          if (Math.abs(newX - building.x) < halfW) {
            newX = prevX;
          }
          if (Math.abs(newZ - building.z) < halfD) {
            newZ = prevZ;
          }
        }
      }

      const now = Date.now();
      if (now - lastSyncTime.current > 150) {
        await supabase
          .from('room_participants')
          .update({
            position_x: newX,
            position_z: newZ,
            rotation_y: newRotation
          })
          .eq('id', myParticipant.id);

        const channel = supabase.channel(`game-${currentRoom.id}`);
        channel.send({
          type: 'broadcast',
          event: 'player-move',
          payload: {
            user_id: user.id,
            x: newX,
            y: myParticipant.position_y,
            z: newZ,
            rotation: newRotation
          }
        });

        lastSyncTime.current = now;
      }

      setParticipants(prev => prev.map(p =>
        p.user_id === user.id
          ? { ...p, position_x: newX, position_z: newZ, rotation_y: newRotation }
          : p
      ));
    }
  };

  const shoot = async () => {
    if (!currentRoom || !user) return;

    const myParticipant = participants.find(p => p.user_id === user.id);
    if (!myParticipant || !myParticipant.is_alive) return;

    const weaponStats = WEAPONS[currentWeapon];
    const now = Date.now();
    const fireDelay = 1000 / weaponStats.fireRate;

    if (now - lastShotTime.current < fireDelay) return;
    lastShotTime.current = now;

    // Trigger shooting animation
    setIsShooting(true);
    setTimeout(() => setIsShooting(false), 100);

    // Create bullets based on weapon stats
    for (let i = 0; i < weaponStats.bulletCount; i++) {
      const bulletId = `bullet-${Date.now()}-${Math.random()}`;
      const spread = weaponStats.spread;
      
      const spreadX = (Math.random() - 0.5) * spread;
      const spreadY = (Math.random() - 0.5) * spread;
      
      const direction = new THREE.Vector3(
        -Math.sin(cameraRotation.y + spreadX) * Math.cos(cameraRotation.x + spreadY),
        Math.sin(cameraRotation.x + spreadY),
        -Math.cos(cameraRotation.y + spreadX) * Math.cos(cameraRotation.x + spreadY)
      ).normalize();

      const startPos: [number, number, number] = [
        myParticipant.position_x + direction.x * 0.5,
        myParticipant.position_y + 1.5 + direction.y * 0.5,
        myParticipant.position_z + direction.z * 0.5
      ];

      const speed = weaponStats.bulletSpeed / 50;
      const velocity: [number, number, number] = [
        direction.x * speed,
        direction.y * speed,
        direction.z * speed
      ];

      const bulletData: BulletData = {
        id: bulletId,
        position: startPos,
        velocity,
        ownerId: user.id,
        ownerTeam: myParticipant.team,
        damage: weaponStats.damage,
        color: weaponStats.color
      };

      setBullets(prev => [...prev, bulletData]);

      const channel = supabase.channel(`game-${currentRoom.id}`);
      channel.send({
        type: 'broadcast',
        event: 'player-shoot',
        payload: {
          ownerId: user.id,
          team: myParticipant.team,
          position: startPos,
          velocity,
          damage: weaponStats.damage,
          color: weaponStats.color
        }
      });
    }
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
          return Math.abs(x) < 30 && Math.abs(z) < 30 && y > -1 && y < 10;
        });

      updated.forEach(bullet => {
        participants.forEach(p => {
          if (p.user_id !== bullet.ownerId && p.is_alive && p.team !== bullet.ownerTeam) {
            const dist = Math.sqrt(
              Math.pow(bullet.position[0] - p.position_x, 2) +
              Math.pow(bullet.position[1] - (p.position_y + 1.0), 2) +
              Math.pow(bullet.position[2] - p.position_z, 2)
            );
            
            if (dist < 0.8) {
              handlePlayerHit(bullet.ownerId, p.user_id, bullet.damage);
              bullet.position = [-1000, -1000, -1000]; // Remove bullet
            }
          }
        });
      });

      return updated.filter(b => b.position[0] > -999);
    });
  };

  const handlePlayerHit = async (shooterId: string, hitUserId: string, damage: number) => {
    if (!currentRoom) return;

    const shooter = participants.find(p => p.user_id === shooterId);
    
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

  const updatePlayerHealth = async (userId: string, damage: number, shooterId?: string) => {
    const participant = participants.find(p => p.user_id === userId);
    if (!participant) return;

    const newHealth = Math.max(0, participant.health - damage);
    const isDead = newHealth <= 0;

    const shooter = participants.find(p => p.user_id === shooterId);

    await supabase
      .from('room_participants')
      .update({
        health: newHealth,
        is_alive: !isDead,
        deaths: isDead ? participant.deaths + 1 : participant.deaths
      })
      .eq('id', participant.id);

    if (isDead && shooterId && shooter) {
      await supabase
        .from('room_participants')
        .update({
          kills: shooter.kills + 1,
          score: shooter.score + 100
        })
        .eq('id', shooter.id);
    }

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

  const myParticipant = participants.find(p => p.user_id === user?.id);
  const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(false);
  
  const redTeam = participants.filter(p => p.team === 'red');
  const blueTeam = participants.filter(p => p.team === 'blue');
  const redScore = redTeam.reduce((sum, p) => sum + p.kills, 0);
  const blueScore = blueTeam.reduce((sum, p) => sum + p.kills, 0);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      setIsOwnerOrAdmin(data?.role === 'owner' || data?.role === 'admin');
    };
    checkRole();
  }, [user]);

  return (
    <div className="w-full h-full">
      {view === 'menu' && (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold text-white tracking-wider">DEADSHOT</h1>
              <p className="text-xl text-gray-400">Team-Based Multiplayer FPS</p>
            </div>

            <div className="space-y-4">
              <p className="text-lg font-semibold text-gray-300">Choose Your Team</p>
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => setSelectedTeam('red')}
                  className={`px-8 py-6 text-xl font-bold transition-all transform hover:scale-105 ${
                    selectedTeam === 'red' 
                      ? 'bg-red-600 hover:bg-red-700 border-2 border-red-400' 
                      : 'bg-red-900/30 hover:bg-red-800/50 border border-red-700'
                  }`}
                >
                  🔴 RED TEAM
                </Button>
                <Button
                  size="lg"
                  onClick={() => setSelectedTeam('blue')}
                  className={`px-8 py-6 text-xl font-bold transition-all transform hover:scale-105 ${
                    selectedTeam === 'blue' 
                      ? 'bg-blue-600 hover:bg-blue-700 border-2 border-blue-400' 
                      : 'bg-blue-900/30 hover:bg-blue-800/50 border border-blue-700'
                  }`}
                >
                  🔵 BLUE TEAM
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={joinGlobalLobby}
              disabled={isJoining}
              className="px-16 py-8 text-3xl font-bold bg-green-600 hover:bg-green-700 transition-all transform hover:scale-105"
            >
              {isJoining ? 'JOINING...' : 'PLAY'}
            </Button>

            <div className="flex items-center justify-center gap-4 text-gray-400">
              <Users className="w-5 h-5" />
              <span>{participants.length} Players Online</span>
            </div>
          </div>
        </div>
      )}

      {view === 'lobby' && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Waiting Lobby</h2>
              <Badge variant="secondary" className="mt-2">
                {currentRoom?.status === 'playing' ? 'Game in Progress' : 'Waiting for start...'}
              </Badge>
            </div>
            <div className="flex gap-2">
              {isOwnerOrAdmin && (
                <Button onClick={startGame} className="gap-2" size="lg">
                  <Play className="w-5 h-5" />
                  Start Match
                </Button>
              )}
              <Button variant="outline" onClick={leaveLobby}>
                Leave Lobby
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 border-[#ff2222] border-2">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#ff2222]" />
                Red Team ({redTeam.length})
              </h3>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {redTeam.map(p => (
                    <div key={p.id} className="p-2 bg-muted rounded">
                      <div className="font-bold">{p.player_name}</div>
                      <div className="text-sm text-muted-foreground">
                        K: {p.kills} / D: {p.deaths}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            <Card className="p-4 border-[#2222ff] border-2">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#2222ff]" />
                Blue Team ({blueTeam.length})
              </h3>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {blueTeam.map(p => (
                    <div key={p.id} className="p-2 bg-muted rounded">
                      <div className="font-bold">{p.player_name}</div>
                      <div className="text-sm text-muted-foreground">
                        K: {p.kills} / D: {p.deaths}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      )}

      {view === 'game' && (
        <div className="w-full h-screen relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-50 bg-black/50 hover:bg-black/70"
            onClick={toggleFullscreen}
          >
            <Maximize className="w-6 h-6 text-white" />
          </Button>

          {isOwnerOrAdmin && (
            <Button
              variant="destructive"
              className="absolute top-4 right-4 z-50"
              onClick={endGame}
            >
              <StopCircle className="w-4 h-4 mr-2" />
              End Game
            </Button>
          )}

          {/* Mobile Touch Controls */}
          {isMobile && (
            <>
              {/* Movement Joystick - Left Side */}
              <div className="fixed bottom-20 left-4 z-50 w-32 h-32 bg-black/30 rounded-full border-2 border-white/50">
                <div 
                  className="w-full h-full relative"
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    const rect = e.currentTarget.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const deltaX = (touch.clientX - centerX) / (rect.width / 2);
                    const deltaY = (touch.clientY - centerY) / (rect.height / 2);
                    setTouchControls(prev => ({ ...prev, moveX: deltaX, moveY: deltaY }));
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    const rect = e.currentTarget.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const deltaX = Math.max(-1, Math.min(1, (touch.clientX - centerX) / (rect.width / 2)));
                    const deltaY = Math.max(-1, Math.min(1, (touch.clientY - centerY) / (rect.height / 2)));
                    setTouchControls(prev => ({ ...prev, moveX: deltaX, moveY: deltaY }));
                  }}
                  onTouchEnd={() => {
                    setTouchControls(prev => ({ ...prev, moveX: 0, moveY: 0 }));
                  }}
                >
                  <div 
                    className="absolute w-12 h-12 bg-white/70 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{
                      transform: `translate(calc(-50% + ${touchControls.moveX * 30}px), calc(-50% + ${touchControls.moveY * 30}px))`
                    }}
                  />
                </div>
              </div>

              {/* Shoot Button - Right Side */}
              <Button
                className="fixed bottom-20 right-4 z-50 w-24 h-24 rounded-full bg-red-600 hover:bg-red-700 text-white"
                onTouchStart={shoot}
              >
                SHOOT
              </Button>

              {/* Look Control - Right Middle */}
              <div 
                className="fixed top-20 right-4 z-50 w-32 h-32 bg-black/30 rounded-full border-2 border-white/50"
                onTouchMove={(e) => {
                  if (e.touches.length > 0) {
                    const touch = e.touches[0];
                    const rect = e.currentTarget.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const deltaX = (touch.clientX - centerX) * 0.01;
                    const deltaY = (touch.clientY - centerY) * 0.01;
                    
                    setCameraRotation(prev => ({
                      x: Math.max(-Math.PI / 3, Math.min(Math.PI / 3, prev.x - deltaY)),
                      y: prev.y - deltaX
                    }));
                  }
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                  LOOK
                </div>
              </div>
            </>
          )}

          <Canvas
            shadows
            gl={{ 
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance'
            }}
            camera={{ fov: 75, position: [0, 2, 5] }}
            performance={{ min: 0.5 }}
            dpr={isMobile ? [0.7, 1.2] : [1, 2]}
          >
            <FirstPersonCamera
              position={[
                myParticipant?.position_x || 0,
                myParticipant?.position_y || 0,
                myParticipant?.position_z || 0
              ]}
              rotation={cameraRotation}
            />
            
            {/* Outdoor sky */}
            <Sky 
              distance={450000}
              sunPosition={[100, 50, 100]}
              inclination={0.6}
              azimuth={0.25}
            />
            <GameArena />

            {participants.map((participant) => (
              participant.user_id !== user?.id && (
                <Player
                  key={participant.id}
                  position={[participant.position_x, participant.position_y, participant.position_z]}
                  rotation={participant.rotation_y}
                  team={participant.team}
                  name={participant.player_name}
                  health={participant.health}
                  isAlive={participant.is_alive}
                  currentWeapon={participant.current_weapon}
                />
              )
            ))}

            {/* Limit bullets rendered for performance */}
            {bullets.slice(0, 50).map((bullet) => (
              <Bullet key={bullet.id} position={bullet.position} color={bullet.color} />
            ))}

            {/* First-person weapon viewmodel */}
            {myParticipant && (
              <WeaponViewModel 
                weaponType={currentWeapon}
                isShooting={isShooting}
                isReloading={isReloading}
              />
            )}
          </Canvas>

          {myParticipant && (
            <GameHUD
              health={myParticipant.health}
              kills={myParticipant.kills}
              deaths={myParticipant.deaths}
              currentWeapon={currentWeapon}
              team={myParticipant.team}
              timeLeft={gameTime}
              redScore={redScore}
              blueScore={blueScore}
              onWeaponChange={changeWeapon}
            />
          )}

          {/* Crosshair */}
          {crosshairVisible && (
            <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-30">
              <div className="relative">
                <div className="absolute w-6 h-0.5 bg-white -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute h-6 w-0.5 bg-white -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute w-2 h-2 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* In-game voice/video chat placeholder */}
          {inGameCall && (
            <div className="fixed bottom-20 right-4 z-40 bg-black/70 p-3 rounded-lg text-white text-sm">
              Voice & Video Chat Active
            </div>
          )}
        </div>
      )}
    </div>
  );
}
