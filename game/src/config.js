// Emberlight Heist — tuning constants. One place for every number the
// rest of the game balances against, so difficulty can be tuned without
// touching movement, vision or guard logic.
export const WORLD = { width: 960, height: 640 };

export const PLAYER = {
  radius: 13,
  walkSpeed: 178,
  sneakSpeed: 96,
  pebbles: 3,
  pebbleCooldownMs: 7000,
  pebbleLureRadius: 270,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  chaseSpeed: 148,
  searchSpeed: 96,
  returnSpeed: 80,
  visionRange: 205,
  visionHalfAngle: 0.66, // ~38 degrees each side
  catchRadius: 26,
  suspicionRisePerSec: 62,
  suspicionRiseClosePerSec: 105, // inside half range
  suspicionDecayPerSec: 20,
  suspiciousAt: 55, // pause and stare
  alarmAt: 100, // chase
  loseSightChaseMs: 3400,
  searchMs: 4200,
  bushSpotRadius: 58, // a guard this close sees you even in a bush
  shadowRangeFactor: 0.55,
  shadowGainFactor: 0.6,
  sneakGainFactor: 0.6,
};

export const LEVEL = {
  shardsNeeded: 3,
  alarmDecayPerSec: 14,
};

export const COLORS = {
  floorA: '#1a2140',
  floorB: '#171d38',
  floorLine: '#232c52',
  wall: '#3a4470',
  wallTop: '#4d5890',
  crate: '#6b4f2a',
  crateTop: '#8a6a38',
  bush: '#1e4d2e',
  bushLeaf: '#2f7a44',
  shadow: 'rgba(4,6,16,0.55)',
  shard: '#ffb347',
  shardGlow: '#ffdd88',
  exitLocked: '#5a6b8c',
  exitOpen: '#7dffb0',
  player: '#ffd479',
  playerSneak: '#e8b95a',
  guard: '#ff5d73',
  guardCone: 'rgba(255, 214, 90, 0.20)',
  guardConeAlert: 'rgba(255, 80, 80, 0.30)',
  guardConeSuspicious: 'rgba(255, 170, 60, 0.28)',
};
