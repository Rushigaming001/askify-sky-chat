import { useMemo } from 'react';
import * as THREE from 'three';

export function GameArena() {
  const wallPositions = useMemo(() => [
    { pos: [0, 2, -30], size: [60, 4, 0.5] }, // Back wall
    { pos: [0, 2, 30], size: [60, 4, 0.5] },  // Front wall
    { pos: [-30, 2, 0], size: [0.5, 4, 60] }, // Left wall
    { pos: [30, 2, 0], size: [0.5, 4, 60] },  // Right wall
  ], []);

  const largeObstacles = useMemo(() => [
    // Large cover boxes
    { pos: [8, 1, 8], size: [3, 2, 3] },
    { pos: [-8, 1, 8], size: [3, 2, 3] },
    { pos: [8, 1, -8], size: [3, 2, 3] },
    { pos: [-8, 1, -8], size: [3, 2, 3] },
    // Central structure
    { pos: [0, 1.5, 0], size: [4, 3, 4] },
    // Mid-range cover
    { pos: [15, 0.75, 0], size: [2, 1.5, 5] },
    { pos: [-15, 0.75, 0], size: [2, 1.5, 5] },
    { pos: [0, 0.75, 15], size: [5, 1.5, 2] },
    { pos: [0, 0.75, -15], size: [5, 1.5, 2] },
  ], []);

  const smallObstacles = useMemo(() => [
    // Small cover crates
    { pos: [12, 0.5, 12], size: [1, 1, 1] },
    { pos: [-12, 0.5, 12], size: [1, 1, 1] },
    { pos: [12, 0.5, -12], size: [1, 1, 1] },
    { pos: [-12, 0.5, -12], size: [1, 1, 1] },
    { pos: [18, 0.5, 8], size: [1, 1, 1] },
    { pos: [-18, 0.5, 8], size: [1, 1, 1] },
    { pos: [18, 0.5, -8], size: [1, 1, 1] },
    { pos: [-18, 0.5, -8], size: [1, 1, 1] },
  ], []);

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Grid pattern on ground */}
      <gridHelper args={[60, 60, '#333333', '#222222']} position={[0, 0.01, 0]} />

      {/* Walls */}
      {wallPositions.map((wall, i) => (
        <mesh key={`wall-${i}`} position={wall.pos as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={wall.size as [number, number, number]} />
          <meshStandardMaterial 
            color="#2a2a2a" 
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
      ))}

      {/* Large Obstacles/Cover */}
      {largeObstacles.map((obstacle, i) => (
        <mesh key={`large-${i}`} position={obstacle.pos as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={obstacle.size as [number, number, number]} />
          <meshStandardMaterial 
            color="#444444" 
            roughness={0.6} 
            metalness={0.4}
          />
        </mesh>
      ))}

      {/* Small Obstacles/Crates */}
      {smallObstacles.map((obstacle, i) => (
        <mesh key={`small-${i}`} position={obstacle.pos as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={obstacle.size as [number, number, number]} />
          <meshStandardMaterial 
            color="#666666" 
            roughness={0.7} 
            metalness={0.3}
          />
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
