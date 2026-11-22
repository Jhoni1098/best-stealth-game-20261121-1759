// Emberlight Heist — the Lantern Wardens: patrol, grow suspicious, give
// chase, search the last seen spot, then return to their rounds. A guard
// never catches you the instant it sees you: suspicion is the warning.
import { GUARD } from './config.js';
import { visionCheck } from './vision.js';
import { circleHitsRect } from './level.js';

export const GUARD_STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  CHASE: 'chase',
  SEARCH: 'search',
  RETURN: 'return',
  INVESTIGATE: 'investigate',
};

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.waypoints = def.waypoints;
    this.x = def.waypoints[0].x;
    this.y = def.waypoints[0].y;
    this.wpIndex = 1 % def.waypoints.length;
    this.facing = 0;
    this.state = GUARD_STATE.PATROL;
    this.suspicion = 0;
    this.lastSeen = null;
    this.stateMs = 0;
    this.loseSightMs = 0;
    this.pauseMs = 0;
    this.investigateTarget = null;
  }

  get alerted() {
    return this.state === GUARD_STATE.CHASE;
  }

  moveToward(tx, ty, speed, dt, solids) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) return true;
    const step = Math.min(d, speed * dt);
    const nx = this.x + (dx / d) * step;
    const ny = this.y + (dy / d) * step;
    this.facing = Math.atan2(dy, dx);
    if (!solids.some((r) => circleHitsRect(nx, this.y, GUARD.radius, r))) this.x = nx;
    if (!solids.some((r) => circleHitsRect(this.x, ny, GUARD.radius, r))) this.y = ny;
    return d <= step + 1;
  }

  update(dt, player, context) {
    const seen = visionCheck(this, player, context);
    this.stateMs += dt * 1000;

    if (seen.visible) {
      this.lastSeen = { x: player.x, y: player.y };
      this.loseSightMs = 0;
      this.suspicion = Math.min(100, this.suspicion + seen.gain * dt);
      this.facing = Math.atan2(player.y - this.y, player.x - this.x);
    } else {
      this.loseSightMs += dt * 1000;
      if (this.state !== GUARD_STATE.CHASE && this.state !== GUARD_STATE.SEARCH) {
        this.suspicion = Math.max(0, this.suspicion - GUARD.suspicionDecayPerSec * dt);
      }
    }

    if (this.suspicion >= GUARD.alarmAt && this.state !== GUARD_STATE.CHASE) {
      this.state = GUARD_STATE.CHASE;
      this.stateMs = 0;
      context.onAlarm?.(this);
    }

    switch (this.state) {
      case GUARD_STATE.PATROL: {
        if (this.suspicion >= GUARD.suspiciousAt) {
          this.state = GUARD_STATE.SUSPICIOUS;
          this.stateMs = 0;
          break;
        }
        const wp = this.waypoints[this.wpIndex];
        if (this.moveToward(wp.x, wp.y, GUARD.patrolSpeed, dt, context.solids)) {
          this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
          this.pauseMs = 900; // glance around at each waypoint
        }
        if (this.pauseMs > 0) {
          this.pauseMs -= dt * 1000;
          this.facing += dt * 0.9; // slow scan while paused
        }
        break;
      }
      case GUARD_STATE.SUSPICIOUS: {
        // Freeze, stare at the last seen spot, then shrug it off.
        if (this.lastSeen) this.facing = Math.atan2(this.lastSeen.y - this.y, this.lastSeen.x - this.x);
        if (this.suspicion < GUARD.suspiciousAt * 0.5 || this.stateMs > 2200) {
          this.state = GUARD_STATE.RETURN;
          this.stateMs = 0;
        }
        break;
      }
      case GUARD_STATE.CHASE: {
        const target = this.lastSeen ?? { x: player.x, y: player.y };
        this.moveToward(target.x, target.y, GUARD.chaseSpeed, dt, context.solids);
        if (!seen.visible && this.loseSightMs > GUARD.loseSightChaseMs) {
          this.state = GUARD_STATE.SEARCH;
          this.stateMs = 0;
        }
        break;
      }
      case GUARD_STATE.SEARCH: {
        if (this.lastSeen) {
          const arrived = this.moveToward(this.lastSeen.x, this.lastSeen.y, GUARD.searchSpeed, dt, context.solids);
          if (arrived) this.facing += dt * 2.2; // look around the spot
        }
        if (this.stateMs > GUARD.searchMs) {
          this.suspicion = Math.max(0, this.suspicion - 45);
          this.state = GUARD_STATE.RETURN;
          this.stateMs = 0;
        }
        break;
      }
      case GUARD_STATE.INVESTIGATE: {
        if (this.investigateTarget) {
          const arrived = this.moveToward(this.investigateTarget.x, this.investigateTarget.y, GUARD.searchSpeed, dt, context.solids);
          if (arrived || this.stateMs > 6000) {
            this.investigateTarget = null;
            this.state = GUARD_STATE.RETURN;
            this.stateMs = 0;
          }
        }
        break;
      }
      case GUARD_STATE.RETURN: {
        const wp = this.waypoints[this.wpIndex];
        if (this.moveToward(wp.x, wp.y, GUARD.returnSpeed, dt, context.solids)) {
          this.state = GUARD_STATE.PATROL;
          this.stateMs = 0;
        }
        break;
      }
    }
  }

  lureTo(point) {
    if (this.state === GUARD_STATE.CHASE) return; // a chasing warden ignores pebbles
    this.investigateTarget = { x: point.x, y: point.y };
    this.state = GUARD_STATE.INVESTIGATE;
    this.stateMs = 0;
    this.suspicion = Math.max(this.suspicion, 30);
  }

  caughtPlayer(player) {
    const d = Math.hypot(player.x - this.x, player.y - this.y);
    return this.state === GUARD_STATE.CHASE && d < GUARD.catchRadius;
  }
}

export function updateGuards(guards, dt, player, context) {
  for (const g of guards) g.update(dt, player, context);
  return Math.max(0, ...guards.map((g) => g.suspicion));
}
