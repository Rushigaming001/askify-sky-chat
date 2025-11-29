import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FirstPersonCameraProps {
  position: [number, number, number];
  rotation: { x: number; y: number };
}

export function FirstPersonCamera({ position, rotation }: FirstPersonCameraProps) {
  const { camera } = useThree();
  const targetRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    targetRotation.current = rotation;
  }, [rotation]);

  useFrame(() => {
    // Update camera position (first-person view at eye level)
    camera.position.set(
      position[0],
      position[1] + 1.5, // Eye level
      position[2]
    );

    // Apply rotation smoothly
    camera.rotation.x = targetRotation.current.x;
    camera.rotation.y = targetRotation.current.y;
    camera.rotation.order = 'YXZ'; // Prevent camera roll
  });

  return null;
}
