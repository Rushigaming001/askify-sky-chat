import { useMemo } from 'react';
import * as THREE from 'three';

export function GameArena() {
  const wallPositions = useMemo(() => [
    { pos: [0, 1.5, -25], size: [50, 3, 0.5] }, // Back wall
    { pos: [0, 1.5, 25], size: [50, 3, 0.5] },  // Front wall
    { pos: [-25, 1.5, 0], size: [0.5, 3, 50] }, // Left wall
    { pos: [25, 1.5, 0], size: [0.5, 3, 50] },  // Right wall
  ], []);

  const obstaclePositions = useMemo(() => [
    [5, 0.75, 5],
    [-5, 0.75, 5],
    [5, 0.75, -5],
    [-5, 0.75, -5],
    [10, 0.75, 0],
    [-10, 0.75, 0],
    [0, 0.75, 10],
    [0, 0.75, -10],
  ], []);

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial 
          color="#2d5016" 
          roughness={0.8}
        />
      </mesh>

      {/* Grid pattern on ground */}
      <gridHelper args={[50, 50, '#4a7c2f', '#3d6625']} position={[0, 0.01, 0]} />

      {/* Walls */}
      {wallPositions.map((wall, i) => (
        <mesh key={i} position={wall.pos as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={wall.size as [number, number, number]} />
          <meshStandardMaterial color="#8b7355" roughness={0.9} />
        </mesh>
      ))}

      {/* Obstacles/Cover */}
      {obstaclePositions.map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.7} metalness={0.3} />
        </mesh>
      ))}

      {/* Spawn points markers */}
      {[
        [8, 0.1, 8],
        [-8, 0.1, 8],
        [8, 0.1, -8],
        [-8, 0.1, -8],
      ].map((pos, i) => (
        <mesh key={`spawn-${i}`} position={pos as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.8, 32]} />
          <meshBasicMaterial color="#00ff00" opacity={0.3} transparent />
        </mesh>
      ))}
    </group>
  );
}
