-- Add team assignment to room participants
ALTER TABLE room_participants ADD COLUMN IF NOT EXISTS team text DEFAULT 'red' CHECK (team IN ('red', 'blue'));

-- Add weapon type tracking
ALTER TABLE room_participants ADD COLUMN IF NOT EXISTS current_weapon text DEFAULT 'rifle' CHECK (current_weapon IN ('smg', 'sniper', 'rifle', 'shotgun', 'special'));