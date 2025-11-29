import { useMemo } from 'react';
import * as THREE from 'three';

export function GameArena() {
  const wallPositions = useMemo(() => [
    { pos: [0, 2, -30], size: [60, 4, 0.5] }, // Back wall
    { pos: [0, 2, 30], size: [60, 4, 0.5] },  // Front wall
    { pos: [-30, 2, 0], size: [0.5, 4, 60] }, // Left wall
    { pos: [30, 2, 0], size: [0.5, 4, 60] },  // Right wall
  ], []);

  // Urban buildings and structures
  const buildings = useMemo(() => [
    // Main central buildings
    { pos: [-18, 3, -15], size: [8, 6, 8], color: '#6b7280' },
    { pos: [18, 2.5, -15], size: [6, 5, 6], color: '#737373' },
    { pos: [-18, 2, 15], size: [7, 4, 7], color: '#71717a' },
    { pos: [18, 3.5, 15], size: [9, 7, 9], color: '#6b7280' },
    
    // Side buildings
    { pos: [0, 2.5, -20], size: [12, 5, 5], color: '#737373' },
    { pos: [0, 2, 20], size: [10, 4, 6], color: '#71717a' },
  ], []);

  // Wooden crates and cover
  const woodenCrates = useMemo(() => [
    { pos: [5, 0.75, 5], size: [1.5, 1.5, 1.5] },
    { pos: [-5, 0.75, 5], size: [1.5, 1.5, 1.5] },
    { pos: [5, 0.75, -5], size: [1.5, 1.5, 1.5] },
    { pos: [-5, 0.75, -5], size: [1.5, 1.5, 1.5] },
    { pos: [10, 0.75, 0], size: [1.5, 1.5, 1.5] },
    { pos: [-10, 0.75, 0], size: [1.5, 1.5, 1.5] },
    { pos: [0, 0.75, 10], size: [1.5, 1.5, 1.5] },
    { pos: [0, 0.75, -10], size: [1.5, 1.5, 1.5] },
    { pos: [15, 0.75, 10], size: [1.5, 1.5, 1.5] },
    { pos: [-15, 0.75, 10], size: [1.5, 1.5, 1.5] },
  ], []);

  // Concrete barriers
  const concreteBarriers = useMemo(() => [
    { pos: [8, 0.5, 0], size: [0.5, 1, 4] },
    { pos: [-8, 0.5, 0], size: [0.5, 1, 4] },
    { pos: [0, 0.5, 8], size: [4, 1, 0.5] },
    { pos: [0, 0.5, -8], size: [4, 1, 0.5] },
    { pos: [12, 0.5, 12], size: [0.5, 1, 3] },
    { pos: [-12, 0.5, 12], size: [0.5, 1, 3] },
    { pos: [12, 0.5, -12], size: [0.5, 1, 3] },
    { pos: [-12, 0.5, -12], size: [0.5, 1, 3] },
  ], []);

  return (
    <group>
      {/* Ground - Urban concrete floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial 
          color="#52525b" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Ground grid pattern */}
      <gridHelper args={[60, 30, '#71717a', '#3f3f46']} position={[0, 0.02, 0]} />

      {/* Boundary Walls */}
      {wallPositions.map((wall, i) => (
        <mesh key={`wall-${i}`} position={wall.pos as [number, number, number]}>
          <boxGeometry args={wall.size as [number, number, number]} />
          <meshStandardMaterial 
            color="#3f3f46" 
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* Urban Buildings */}
      {buildings.map((building, i) => (
        <mesh key={`building-${i}`} position={building.pos as [number, number, number]}>
          <boxGeometry args={building.size as [number, number, number]} />
          <meshStandardMaterial 
            color={building.color}
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
      ))}

      {/* Wooden Crates */}
      {woodenCrates.map((crate, i) => (
        <mesh key={`crate-${i}`} position={crate.pos as [number, number, number]}>
          <boxGeometry args={crate.size as [number, number, number]} />
          <meshStandardMaterial 
            color="#78350f" 
            roughness={0.7}
          />
        </mesh>
      ))}

      {/* Concrete Barriers */}
      {concreteBarriers.map((barrier, i) => (
        <mesh key={`barrier-${i}`} position={barrier.pos as [number, number, number]}>
          <boxGeometry args={barrier.size as [number, number, number]} />
          <meshStandardMaterial 
            color="#52525b" 
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* Spawn point markers */}
      {[
        [8, 0.1, 8],
        [-8, 0.1, 8],
        [8, 0.1, -8],
        [-8, 0.1, -8],
      ].map((pos, i) => (
        <mesh key={`spawn-${i}`} position={pos as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.8, 16]} />
          <meshBasicMaterial color="#22c55e" opacity={0.6} transparent />
        </mesh>
      ))}

      {/* Enhanced lighting for better visibility */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[20, 30, 20]} intensity={1.2} castShadow />
      <directionalLight position={[-20, 20, -20]} intensity={0.5} />
      <hemisphereLight args={['#87ceeb', '#52525b', 0.4]} />
    </group>
  );
}
