// Emberlight Heist — the vault garden level: walls, crates, bushes,
// shadow pools, ember shards, the moon gate exit, and warden patrols.
// Everything is hand-placed so patrols cross the shard routes and the
// cover forms a readable sneaking path from spawn to exit.
import { WORLD } from './config.js';

export function buildLevel() {
  const W = WORLD.width;
  const H = WORLD.height;
  const wall = (x, y, w, h) => ({ x, y, w, h });
  const crate = (x, y, w, h) => ({ x, y, w, h });
  const bush = (x, y, r) => ({ x, y, r });
  const shadow = (x, y, rx, ry) => ({ x, y, rx, ry });

  return {
    // Solid rectangles the player and wardens cannot cross; they also block sight.
    walls: [
      wall(0, 0, W, 18), wall(0, H - 18, W, 18),
      wall(0, 0, 18, H), wall(W - 18, 0, 18, H),
      wall(210, 90, 16, 110),           // west hall divider
      wall(210, 330, 16, 150),          // west hall divider, lower
      wall(430, 150, 16, 190),          // central pillar wall
      wall(640, 90, 16, 150),           // east hall divider
      wall(640, 360, 16, 150),          // east hall divider, lower
      wall(430, 470, 190, 16),          // south-east shelf
      wall(300, 60, 150, 14),           // north ledge
    ],
    // Crates block movement and sight: the classic cover to duck behind.
    crates: [
      crate(120, 300, 52, 52),
      crate(300, 250, 56, 56),
      crate(520, 58, 52, 52),
      crate(520, 420, 56, 56),
      crate(730, 250, 52, 52),
      crate(860, 540, 52, 52),
      crate(120, 500, 52, 52),
    ],
    // Bushes hide you completely while you stand inside one (unless a
    // warden walks almost on top of you). They do not block movement.
    bushes: [
      bush(90, 150, 34),
      bush(330, 420, 36),
      bush(480, 300, 34),
      bush(700, 150, 34),
      bush(860, 380, 36),
      bush(180, 580, 32),
      bush(560, 560, 34),
    ],
    // Shadow pools shrink a warden's vision range while you stand in one.
    shadows: [
      shadow(270, 130, 74, 44),
      shadow(560, 250, 80, 46),
      shadow(180, 430, 76, 46),
      shadow(760, 540, 84, 44),
      shadow(880, 130, 62, 52),
    ],
    shards: [
      { x: 330, y: 110, taken: false },
      { x: 880, y: 300, taken: false },
      { x: 90, y: 560, taken: false },
    ],
    exit: { x: 886, y: 52, w: 56, h: 46 }, // moon gate, top-right
    spawn: { x: 70, y: 580 },
    patrols: [
      { waypoints: [{ x: 280, y: 130 }, { x: 610, y: 130 }, { x: 610, y: 400 }, { x: 280, y: 400 }], name: 'Warden Brin' },
      { waypoints: [{ x: 700, y: 340 }, { x: 900, y: 340 }, { x: 900, y: 440 }, { x: 700, y: 440 }], name: 'Warden Odo' },
      { waypoints: [{ x: 110, y: 210 }, { x: 90, y: 280 }, { x: 280, y: 280 }], name: 'Warden Pell' },
      { waypoints: [{ x: 500, y: 535 }, { x: 800, y: 535 }, { x: 800, y: 590 }, { x: 500, y: 590 }], name: 'Warden Sable' },
    ],
  };
}

// Rectangles that block both movement and line of sight.
export function sightBlockers(level) {
  return [...level.walls, ...level.crates];
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function circleHitsRect(cx, cy, radius, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < radius * radius;
}
