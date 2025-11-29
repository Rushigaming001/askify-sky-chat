import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WeaponType } from './WeaponSystem';

interface WeaponViewModelProps {
  weaponType: WeaponType;
  isShooting: boolean;
  isReloading: boolean;
}

export function WeaponViewModel({ weaponType, isShooting, isReloading }: WeaponViewModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const recoilRef = useRef({ x: 0, y: 0, z: 0 });
  const [shootTime, setShootTime] = useState(0);

  useEffect(() => {
    if (isShooting) {
      setShootTime(Date.now());
      // Add recoil
      recoilRef.current.y = -0.05;
      recoilRef.current.z = 0.1;
    }
  }, [isShooting]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Weapon sway
    const time = state.clock.getElapsedTime();
    groupRef.current.position.x = Math.sin(time * 1.5) * 0.002;
    groupRef.current.position.y = Math.cos(time * 3) * 0.002 - 0.3;
    
    // Recoil recovery
    recoilRef.current.y = THREE.MathUtils.lerp(recoilRef.current.y, 0, delta * 10);
    recoilRef.current.z = THREE.MathUtils.lerp(recoilRef.current.z, 0, delta * 10);
    
    groupRef.current.rotation.x = recoilRef.current.y;
    groupRef.current.position.z = 0.3 + recoilRef.current.z;

    // Reload animation
    if (isReloading) {
      const reloadProgress = (Date.now() % 2000) / 2000;
      groupRef.current.rotation.z = Math.sin(reloadProgress * Math.PI) * 0.5;
      groupRef.current.position.y = -0.3 - Math.sin(reloadProgress * Math.PI) * 0.1;
    }
  });

  // Get weapon dimensions based on type
  const getWeaponGeometry = () => {
    switch (weaponType) {
      case 'sniper':
        return { length: 0.5, width: 0.03, height: 0.05 };
      case 'shotgun':
        return { length: 0.4, width: 0.04, height: 0.06 };
      case 'smg':
        return { length: 0.25, width: 0.03, height: 0.04 };
      case 'special':
        return { length: 0.35, width: 0.05, height: 0.05 };
      default: // rifle
        return { length: 0.4, width: 0.03, height: 0.05 };
    }
  };

  const { length, width, height } = getWeaponGeometry();
  const weaponColor = weaponType === 'special' ? '#00ff88' : '#1a1a1a';

  return (
    <group ref={groupRef} position={[0.15, -0.3, 0.3]}>
      {/* Main weapon body */}
      <mesh position={[0, 0, -length / 2]}>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial 
          color={weaponColor}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Barrel */}
      <mesh position={[0, 0, -length - 0.05]}>
        <cylinderGeometry args={[width / 2, width / 2, 0.1, 8]} />
        <meshStandardMaterial 
          color="#0a0a0a"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Grip */}
      <mesh position={[0, -height, 0]}>
        <boxGeometry args={[width * 1.2, height * 1.5, width * 2]} />
        <meshStandardMaterial 
          color="#2a2a2a"
          roughness={0.6}
        />
      </mesh>

      {/* Scope for sniper */}
      {weaponType === 'sniper' && (
        <mesh position={[0, height * 1.5, -length / 3]}>
          <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
          <meshStandardMaterial 
            color="#1a1a1a"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      )}

      {/* Muzzle flash during shooting */}
      {Date.now() - shootTime < 50 && (
        <>
          <pointLight 
            position={[0, 0, -length - 0.1]}
            color="#ffaa00"
            intensity={3}
            distance={2}
          />
          <sprite position={[0, 0, -length - 0.1]} scale={[0.1, 0.1, 0.1]}>
            <spriteMaterial 
              color="#ffcc00" 
              transparent 
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        </>
      )}
    </group>
  );
}
