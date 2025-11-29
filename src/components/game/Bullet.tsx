import { useRef } from 'react';
import * as THREE from 'three';

interface BulletProps {
  position: [number, number, number];
}

export function Bullet({ position }: BulletProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial 
        color="#ffff00" 
        emissive="#ff8800"
        emissiveIntensity={2}
      />
      <pointLight color="#ff8800" intensity={2} distance={2} />
    </mesh>
  );
}
