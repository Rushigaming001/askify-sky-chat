import { WeaponType, WEAPONS } from './WeaponSystem';

interface GameHUDProps {
  health: number;
  kills: number;
  deaths: number;
  currentWeapon: WeaponType;
  team: 'red' | 'blue';
  timeLeft: number;
  redScore: number;
  blueScore: number;
  onWeaponChange: (weapon: WeaponType) => void;
}

export function GameHUD({
  health,
  kills,
  deaths,
  currentWeapon,
  team,
  timeLeft,
  redScore,
  blueScore,
  onWeaponChange
}: GameHUDProps) {
  const teamColor = team === 'red' ? '#ff2222' : '#2222ff';
  const weaponStats = WEAPONS[currentWeapon];

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-8 h-8">
          <div className="absolute top-1/2 left-0 w-3 h-0.5 bg-white -translate-y-1/2" />
          <div className="absolute top-1/2 right-0 w-3 h-0.5 bg-white -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 w-0.5 h-3 bg-white -translate-x-1/2" />
          <div className="absolute left-1/2 bottom-0 w-0.5 h-3 bg-white -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Top HUD - Score and Timer */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 px-6 py-3 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff2222]" />
          <span className="text-white font-bold text-xl">{redScore}</span>
        </div>
        <div className="text-white font-bold text-2xl">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-xl">{blueScore}</span>
          <div className="w-3 h-3 rounded-full bg-[#2222ff]" />
        </div>
      </div>

      {/* Bottom Left - Health and Stats */}
      <div className="absolute bottom-4 left-4 space-y-2">
        {/* Health Bar */}
        <div className="bg-black/70 p-3 rounded-lg">
          <div className="text-white text-sm mb-1">HEALTH</div>
          <div className="w-48 h-6 bg-gray-800 rounded overflow-hidden">
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${health}%`,
                backgroundColor: health > 50 ? '#00ff00' : health > 25 ? '#ffff00' : '#ff0000'
              }}
            />
          </div>
          <div className="text-white font-bold text-xl mt-1">{health} HP</div>
        </div>

        {/* K/D */}
        <div className="bg-black/70 p-3 rounded-lg">
          <div className="text-white font-bold">
            <span className="text-green-400">{kills}</span> / <span className="text-red-400">{deaths}</span>
          </div>
        </div>

        {/* Team Indicator */}
        <div className="bg-black/70 p-3 rounded-lg flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: teamColor }} />
          <span className="text-white font-bold uppercase">{team} Team</span>
        </div>
      </div>

      {/* Bottom Right - Weapon Info */}
      <div className="absolute bottom-4 right-4 space-y-2">
        {/* Current Weapon */}
        <div className="bg-black/70 p-4 rounded-lg">
          <div className="text-white text-2xl font-bold mb-2">{weaponStats.name}</div>
          <div className="text-white/70 text-sm">UNLIMITED AMMO</div>
        </div>

        {/* Weapon Selector - pointer events enabled */}
        <div className="grid grid-cols-5 gap-2 pointer-events-auto">
          {(Object.keys(WEAPONS) as WeaponType[]).map((weapon, index) => (
            <button
              key={weapon}
              onClick={() => onWeaponChange(weapon)}
              className={`p-2 rounded transition-all ${
                currentWeapon === weapon 
                  ? 'bg-white text-black scale-110' 
                  : 'bg-black/70 text-white hover:bg-white/20'
              }`}
              title={WEAPONS[weapon].name}
            >
              <div className="font-bold text-xs">{index + 1}</div>
              <div className="text-[10px]">{WEAPONS[weapon].name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 bg-black/70 p-3 rounded-lg text-white text-xs space-y-1">
        <div>WASD - Move</div>
        <div>Mouse - Aim</div>
        <div>Click - Shoot</div>
        <div>1-5 - Switch Weapon</div>
        <div>F11 - Fullscreen</div>
        <div>ESC - Exit</div>
      </div>
    </div>
  );
}
