import { useMemo } from 'react';
import * as THREE from 'three';

export function GameArena() {
  // Boundary walls
  const wallPositions = useMemo(() => [
    { pos: [0, 3, -30], size: [60, 6, 1], color: '#5a5a5a' }, // Back
    { pos: [0, 3, 30], size: [60, 6, 1], color: '#5a5a5a' },  // Front
    { pos: [-30, 3, 0], size: [1, 6, 60], color: '#5a5a5a' }, // Left
    { pos: [30, 3, 0], size: [1, 6, 60], color: '#5a5a5a' },  // Right
  ], []);

  // Large concrete buildings
  const buildings = useMemo(() => [
    // Main structures with windows
    { pos: [-20, 4, -18], size: [10, 8, 10], color: '#6b7280', windows: true },
    { pos: [20, 5, -18], size: [12, 10, 12], color: '#71717a', windows: true },
    { pos: [-20, 3.5, 18], size: [9, 7, 9], color: '#737373', windows: true },
    { pos: [20, 4.5, 18], size: [11, 9, 11], color: '#6b7280', windows: true },
    
    // Mid-size buildings
    { pos: [0, 3, -22], size: [14, 6, 6], color: '#78716c', windows: true },
    { pos: [0, 2.5, 22], size: [12, 5, 7], color: '#737373', windows: true },
    { pos: [-15, 2, 0], size: [8, 4, 8], color: '#71717a', windows: false },
    { pos: [15, 2, 0], size: [8, 4, 8], color: '#6b7280', windows: false },
  ], []);

  // Wooden structures and platforms
  const woodenStructures = useMemo(() => [
    { pos: [10, 1.5, 10], size: [6, 3, 4], color: '#92400e' },
    { pos: [-10, 1.5, 10], size: [6, 3, 4], color: '#92400e' },
    { pos: [10, 1.5, -10], size: [5, 3, 5], color: '#78350f' },
    { pos: [-10, 1.5, -10], size: [5, 3, 5], color: '#78350f' },
  ], []);

  // Crates scattered around
  const crates = useMemo(() => [
    { pos: [5, 0.75, 5], size: [1.5, 1.5, 1.5] },
    { pos: [-5, 0.75, 5], size: [1.5, 1.5, 1.5] },
    { pos: [5, 0.75, -5], size: [1.5, 1.5, 1.5] },
    { pos: [-5, 0.75, -5], size: [1.5, 1.5, 1.5] },
    { pos: [12, 0.75, 3], size: [1.5, 1.5, 1.5] },
    { pos: [-12, 0.75, 3], size: [1.5, 1.5, 1.5] },
    { pos: [3, 0.75, 12], size: [1.5, 1.5, 1.5] },
    { pos: [3, 0.75, -12], size: [1.5, 1.5, 1.5] },
    { pos: [18, 0.75, 8], size: [1.5, 1.5, 1.5] },
    { pos: [-18, 0.75, 8], size: [1.5, 1.5, 1.5] },
    { pos: [8, 0.75, 18], size: [1.5, 1.5, 1.5] },
    { pos: [-8, 0.75, -18], size: [1.5, 1.5, 1.5] },
  ], []);

  // Concrete barriers
  const barriers = useMemo(() => [
    { pos: [7, 0.6, 0], size: [0.4, 1.2, 5] },
    { pos: [-7, 0.6, 0], size: [0.4, 1.2, 5] },
    { pos: [0, 0.6, 7], size: [5, 1.2, 0.4] },
    { pos: [0, 0.6, -7], size: [5, 1.2, 0.4] },
    { pos: [14, 0.6, 14], size: [0.4, 1.2, 4] },
    { pos: [-14, 0.6, 14], size: [0.4, 1.2, 4] },
    { pos: [14, 0.6, -14], size: [0.4, 1.2, 4] },
    { pos: [-14, 0.6, -14], size: [0.4, 1.2, 4] },
  ], []);

  // Vegetation patches
  const vegetation = useMemo(() => [
    { pos: [8, 0.3, 15], size: [3, 0.6, 3] },
    { pos: [-8, 0.3, 15], size: [3, 0.6, 3] },
    { pos: [8, 0.3, -15], size: [3, 0.6, 3] },
    { pos: [-8, 0.3, -15], size: [3, 0.6, 3] },
    { pos: [22, 0.3, 0], size: [2, 0.6, 2] },
    { pos: [-22, 0.3, 0], size: [2, 0.6, 2] },
  ], []);

  return (
    <group>
      {/* Outdoor ground with texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial 
          color="#6b7c4a" 
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* Subtle grid for tactical feel */}
      <gridHelper args={[60, 60, '#5a6b3e', '#4a5b2e']} position={[0, 0.01, 0]} />

      {/* Boundary Walls */}
      {wallPositions.map((wall, i) => (
        <mesh key={`wall-${i}`} position={wall.pos as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={wall.size as [number, number, number]} />
          <meshStandardMaterial 
            color={wall.color}
            roughness={0.85}
            metalness={0.15}
          />
        </mesh>
      ))}

      {/* Large Buildings with detail */}
      {buildings.map((building, i) => (
        <group key={`building-${i}`}>
          <mesh position={building.pos as [number, number, number]} castShadow receiveShadow>
            <boxGeometry args={building.size as [number, number, number]} />
            <meshStandardMaterial 
              color={building.color}
              roughness={0.8}
              metalness={0.2}
            />
          </mesh>
          {/* Window details */}
          {building.windows && [0.6, -0.6].map((offset, idx) => (
            <mesh 
              key={`window-${i}-${idx}`}
              position={[
                (building.pos as number[])[0] + (building.size as number[])[0] / 2 + 0.1,
                (building.pos as number[])[1] + offset,
                (building.pos as number[])[2]
              ]}
            >
              <boxGeometry args={[0.1, 1, 1]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Wooden Structures */}
      {woodenStructures.map((structure, i) => (
        <mesh key={`wood-${i}`} position={structure.pos as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={structure.size as [number, number, number]} />
          <meshStandardMaterial 
            color={structure.color}
            roughness={0.75}
          />
        </mesh>
      ))}

      {/* Crates */}
      {crates.map((crate, i) => (
        <mesh key={`crate-${i}`} position={crate.pos as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={crate.size as [number, number, number]} />
          <meshStandardMaterial 
            color="#7c3f1e" 
            roughness={0.8}
          />
        </mesh>
      ))}

      {/* Concrete Barriers */}
      {barriers.map((barrier, i) => (
        <mesh key={`barrier-${i}`} position={barrier.pos as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={barrier.size as [number, number, number]} />
          <meshStandardMaterial 
            color="#4a5568" 
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* Vegetation patches */}
      {vegetation.map((veg, i) => (
        <mesh key={`veg-${i}`} position={veg.pos as [number, number, number]}>
          <boxGeometry args={veg.size as [number, number, number]} />
          <meshStandardMaterial 
            color="#4a7c2d" 
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* Spawn markers */}
      {[
        [10, 0.05, 10],
        [-10, 0.05, 10],
        [10, 0.05, -10],
        [-10, 0.05, -10],
      ].map((pos, i) => (
        <mesh key={`spawn-${i}`} position={pos as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial color="#22c55e" opacity={0.7} transparent />
        </mesh>
      ))}

      {/* Enhanced outdoor lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[30, 40, 30]} 
        intensity={1.5} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-20, 25, -20]} intensity={0.7} />
      <hemisphereLight args={['#87ceeb', '#6b7c4a', 0.6]} />
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#b8c9d9', 30, 70]} />
    </group>
  );
}
