export type WeaponType = 'smg' | 'sniper' | 'rifle' | 'shotgun' | 'special';

export interface WeaponStats {
  name: string;
  damage: number;
  fireRate: number; // shots per second
  range: number;
  bulletSpeed: number;
  bulletCount: number; // for shotgun
  spread: number; // bullet spread angle
  color: string;
}

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  smg: {
    name: 'SMG',
    damage: 15,
    fireRate: 10,
    range: 30,
    bulletSpeed: 60,
    bulletCount: 1,
    spread: 0.05,
    color: '#ffaa00'
  },
  rifle: {
    name: 'Rifle',
    damage: 25,
    fireRate: 6,
    range: 50,
    bulletSpeed: 80,
    bulletCount: 1,
    spread: 0.02,
    color: '#ff6600'
  },
  sniper: {
    name: 'Sniper',
    damage: 100,
    fireRate: 1,
    range: 100,
    bulletSpeed: 120,
    bulletCount: 1,
    spread: 0,
    color: '#00ffff'
  },
  shotgun: {
    name: 'Shotgun',
    damage: 20,
    fireRate: 2,
    range: 20,
    bulletSpeed: 50,
    bulletCount: 8,
    spread: 0.15,
    color: '#ff0000'
  },
  special: {
    name: 'Plasma Gun',
    damage: 50,
    fireRate: 4,
    range: 60,
    bulletSpeed: 70,
    bulletCount: 1,
    spread: 0,
    color: '#00ff00'
  }
};
