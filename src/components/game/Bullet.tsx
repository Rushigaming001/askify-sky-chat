import { useRef } from 'react';
import * as THREE from 'three';

interface BulletProps {
  position: [number, number, number];
  color?: string;
}

export function Bullet({ position, color = '#ffff00' }: BulletProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color}
        emissiveIntensity={2}
      />
      <pointLight color={color} intensity={2} distance={2} />
    </mesh>
  );
}
