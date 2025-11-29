import { useRef } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface PlayerProps {
  position: [number, number, number];
  rotation: number;
  team: 'red' | 'blue';
  name: string;
  health: number;
  isAlive: boolean;
  currentWeapon: string;
}

export function Player({ position, rotation, team, name, health, isAlive, currentWeapon }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const teamColor = team === 'red' ? '#ff2222' : '#2222ff';

  if (!isAlive) {
    return null;
  }

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Player body (capsule shape) with team color */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
        <meshStandardMaterial color={teamColor} emissive={teamColor} emissiveIntensity={0.3} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={teamColor} emissive={teamColor} emissiveIntensity={0.3} />
      </mesh>

      {/* Team indicator ring */}
      <mesh position={[0, 1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.4, 16]} />
        <meshBasicMaterial color={teamColor} transparent opacity={0.8} />
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
