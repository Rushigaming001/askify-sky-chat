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

  // Enhanced realistic buildings
  const buildings = useMemo(() => [
    // Tall skyscraper structures
    { pos: [-20, 10, -18], size: [12, 20, 12], color: '#5a6a72', windows: true, floors: 8 },
    { pos: [22, 8, -15], size: [10, 16, 10], color: '#6b7c84', windows: true, floors: 6 },
    { pos: [-18, 6, 20], size: [10, 12, 10], color: '#707a82', windows: true, floors: 5 },
    { pos: [20, 9, 20], size: [14, 18, 14], color: '#5f6f77', windows: true, floors: 7 },
    
    // Mid-height office buildings
    { pos: [0, 4, -24], size: [16, 8, 8], color: '#78828a', windows: true, floors: 3 },
    { pos: [0, 3.5, 24], size: [14, 7, 8], color: '#7a848c', windows: true, floors: 3 },
    
    // Small warehouse structures
    { pos: [-15, 2.5, 0], size: [10, 5, 10], color: '#8a7260', windows: false },
    { pos: [15, 2.5, 0], size: [10, 5, 10], color: '#7a6250', windows: false },
    
    // Additional corner buildings
    { pos: [-24, 3, -24], size: [8, 6, 8], color: '#6a7478', windows: true, floors: 2 },
    { pos: [24, 3, -24], size: [8, 6, 8], color: '#6c7680', windows: true, floors: 2 },
    { pos: [-24, 3, 24], size: [8, 6, 8], color: '#68727a', windows: true, floors: 2 },
    { pos: [24, 3, 24], size: [8, 6, 8], color: '#6e7882', windows: true, floors: 2 },
  ], []);

  // Wooden structures and platforms  
  const woodenStructures = useMemo(() => [
    { pos: [10, 1.5, 10], size: [6, 3, 4], color: '#92400e' },
    { pos: [-10, 1.5, 10], size: [6, 3, 4], color: '#92400e' },
    { pos: [10, 1.5, -10], size: [5, 3, 5], color: '#78350f' },
    { pos: [-10, 1.5, -10], size: [5, 3, 5], color: '#78350f' },
    { pos: [6, 1, 6], size: [4, 2, 3], color: '#a0522d' },
    { pos: [-6, 1, -6], size: [4, 2, 3], color: '#8b4513' },
  ], []);

  // Crates scattered around for cover
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
    { pos: [16, 0.75, -6], size: [1.5, 1.5, 1.5] },
    { pos: [-16, 0.75, -6], size: [1.5, 1.5, 1.5] },
    { pos: [7, 0.75, -15], size: [1.5, 1.5, 1.5] },
    { pos: [-7, 0.75, 15], size: [1.5, 1.5, 1.5] },
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
      {/* Enhanced outdoor ground with realistic texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60, 32, 32]} />
        <meshStandardMaterial 
          color="#5a6b3e" 
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>

      {/* Roads/paths for urban feel */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[6, 60]} />
        <meshStandardMaterial 
          color="#3a3a3a" 
          roughness={0.85}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[60, 6]} />
        <meshStandardMaterial 
          color="#3a3a3a" 
          roughness={0.85}
        />
      </mesh>

      {/* Tactical grid overlay */}
      <gridHelper args={[60, 60, '#4a5b3e', '#3a4b2e']} position={[0, 0.01, 0]} />

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

      {/* Enhanced Buildings with realistic details */}
      {buildings.map((building, i) => (
        <group key={`building-${i}`}>
          <mesh position={building.pos as [number, number, number]} castShadow receiveShadow>
            <boxGeometry args={building.size as [number, number, number]} />
            <meshStandardMaterial 
              color={building.color}
              roughness={0.75}
              metalness={0.25}
            />
          </mesh>
          {/* Multi-floor window grid */}
          {building.windows && (building.floors || 2) > 0 && (() => {
            const windows = [];
            const floors = building.floors || 2;
            const floorHeight = (building.size as number[])[1] / floors;
            for (let floor = 0; floor < floors; floor++) {
              for (let windowX = -1; windowX <= 1; windowX += 1) {
                windows.push(
                  <mesh 
                    key={`window-${i}-${floor}-${windowX}`}
                    position={[
                      (building.pos as number[])[0] + (building.size as number[])[0] / 2 + 0.05,
                      (building.pos as number[])[1] - (building.size as number[])[1] / 2 + floorHeight * (floor + 0.5),
                      (building.pos as number[])[2] + windowX * 2
                    ]}
                  >
                    <boxGeometry args={[0.08, 1.2, 1.2]} />
                    <meshStandardMaterial 
                      color="#1a2530" 
                      roughness={0.2} 
                      metalness={0.9}
                      emissive="#4a90e2"
                      emissiveIntensity={0.3}
                    />
                  </mesh>
                );
              }
            }
            return windows;
          })()}
          {/* Rooftop details */}
          <mesh position={[
            (building.pos as number[])[0],
            (building.pos as number[])[1] + (building.size as number[])[1] / 2 + 0.3,
            (building.pos as number[])[2]
          ]}>
            <boxGeometry args={[
              (building.size as number[])[0] * 0.6,
              0.6,
              (building.size as number[])[2] * 0.6
            ]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
          </mesh>
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

      {/* Enhanced cinematic lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[40, 50, 40]} 
        intensity={1.8} 
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <directionalLight position={[-30, 30, -30]} intensity={0.8} color="#e8f4ff" />
      <pointLight position={[0, 15, 0]} intensity={0.5} distance={60} color="#ffaa66" />
      <hemisphereLight args={['#87ceeb', '#5a6b3e', 0.7]} />
      
      {/* Realistic atmospheric fog */}
      <fog attach="fog" args={['#a8b8c8', 35, 75]} />
    </group>
  );
}
