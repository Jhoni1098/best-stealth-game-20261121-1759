// Emberlight Heist — vision: cone test, line of sight, and how fast a
// warden's suspicion grows. Cover, shadow and sneaking all feed in here.
import { GUARD } from './config.js';

// Does segment a-b cross rectangle r? (slab test, segment clipped to rect)
function segmentHitsRect(ax, ay, bx, by, r) {
  const dx = bx - ax;
  const dy = by - ay;
  let t0 = 0;
  let t1 = 1;
  const tests = [
    [-dx, ax - r.x],
    [dx, r.x + r.w - ax],
    [-dy, ay - r.y],
    [dy, r.y + r.h - ay],
  ];
  for (const [p, q] of tests) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

export function lineOfSight(ax, ay, bx, by, blockers) {
  for (const r of blockers) {
    if (segmentHitsRect(ax, ay, bx, by, r)) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// How "visible" the player is to this guard right now: 0 = unseen.
// Returns { visible, gain } where gain is suspicion per second.
export function visionCheck(guard, player, context) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  let range = GUARD.visionRange;
  let gainFactor = 1;

  if (context.inShadow) {
    range *= GUARD.shadowRangeFactor;
    gainFactor *= GUARD.shadowGainFactor;
  }
  if (player.sneaking) gainFactor *= GUARD.sneakGainFactor;
  if (context.inBush) {
    // Hidden in a bush unless the warden is almost on top of you.
    if (dist > GUARD.bushSpotRadius) return { visible: false, gain: 0, dist };
  }
  if (dist > range) return { visible: false, gain: 0, dist };

  const toPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toPlayer, guard.facing)) > GUARD.visionHalfAngle) {
    return { visible: false, gain: 0, dist };
  }
  if (!lineOfSight(guard.x, guard.y, player.x, player.y, context.blockers)) {
    return { visible: false, gain: 0, dist };
  }
  const close = dist < range * 0.5;
  const gain = (close ? GUARD.suspicionRiseClosePerSec : GUARD.suspicionRisePerSec) * gainFactor;
  return { visible: true, gain, dist };
}

export function pointInEllipse(px, py, e) {
  const dx = (px - e.x) / e.rx;
  const dy = (py - e.y) / e.ry;
  return dx * dx + dy * dy <= 1;
}

export function pointInCircle(px, py, c) {
  const dx = px - c.x;
  const dy = py - c.y;
  return dx * dx + dy * dy <= c.r * c.r;
}
