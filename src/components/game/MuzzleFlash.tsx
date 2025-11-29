import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface MuzzleFlashProps {
  position: [number, number, number];
  direction: [number, number, number];
}

export function MuzzleFlash({ position, direction }: MuzzleFlashProps) {
  const lightRef = useRef<THREE.PointLight>(null);
  const particlesRef = useRef<THREE.Points>(null);

  useEffect(() => {
    // Flash duration
    const timer = setTimeout(() => {
      if (lightRef.current) {
        lightRef.current.intensity = 0;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <group position={position}>
      {/* Bright flash light */}
      <pointLight 
        ref={lightRef}
        color="#ffaa00"
        intensity={5}
        distance={5}
        decay={2}
      />
      
      {/* Flash sprite */}
      <sprite scale={[0.3, 0.3, 0.3]}>
        <spriteMaterial 
          color="#ffcc00" 
          transparent 
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      
      {/* Secondary glow */}
      <sprite scale={[0.5, 0.5, 0.5]}>
        <spriteMaterial 
          color="#ff6600" 
          transparent 
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  );
}
