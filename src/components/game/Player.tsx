import { useRef } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface PlayerProps {
  position: [number, number, number];
  rotation: number;
  color: string;
  name: string;
  health: number;
  isAlive: boolean;
}

export function Player({ position, rotation, color, name, health, isAlive }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);

  if (!isAlive) {
    return null;
  }

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Player body (capsule shape) */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Gun */}
      <group position={[0.2, 0.8, -0.4]}>
        {/* Gun body */}
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.1, 0.6]} />
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Gun barrel */}
        <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
          <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Player name tag */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {name}
      </Text>

      {/* Health bar */}
      <group position={[0, 1.8, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1, 0.1]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
        <mesh position={[-(1 - health / 100) / 2, 0, 0.01]} scale={[health / 100, 1, 1]}>
          <planeGeometry args={[1, 0.1]} />
          <meshBasicMaterial color={health > 50 ? "#00ff00" : health > 25 ? "#ffff00" : "#ff0000"} />
        </mesh>
      </group>
    </group>
  );
}
