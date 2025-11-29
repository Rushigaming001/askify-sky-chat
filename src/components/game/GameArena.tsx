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
      {/* Ground - Bright visible floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial 
          color="#556677" 
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Grid pattern on ground - More visible */}
      <gridHelper args={[60, 30, '#88aacc', '#445566']} position={[0, 0.01, 0]} />

      {/* Walls - Visible concrete color */}
      {wallPositions.map((wall, i) => (
        <mesh key={`wall-${i}`} position={wall.pos as [number, number, number]}>
          <boxGeometry args={wall.size as [number, number, number]} />
          <meshStandardMaterial 
            color="#708090" 
            roughness={0.8}
          />
        </mesh>
      ))}

      {/* Large Obstacles/Cover - Orange crates */}
      {largeObstacles.map((obstacle, i) => (
        <mesh key={`large-${i}`} position={obstacle.pos as [number, number, number]}>
          <boxGeometry args={obstacle.size as [number, number, number]} />
          <meshStandardMaterial 
            color="#d97706" 
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* Small Obstacles/Crates - Wooden boxes */}
      {smallObstacles.map((obstacle, i) => (
        <mesh key={`small-${i}`} position={obstacle.pos as [number, number, number]}>
          <boxGeometry args={obstacle.size as [number, number, number]} />
          <meshStandardMaterial 
            color="#92400e" 
            roughness={0.7}
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
          <circleGeometry args={[0.8, 16]} />
          <meshBasicMaterial color="#22c55e" opacity={0.5} transparent />
        </mesh>
      ))}

      {/* Ambient lighting for visibility */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
    </group>
  );
}
