// Emberlight Heist — the thief Pip: movement with wall sliding, sneaking,
// pebble tosses, and shard pickups.
import { PLAYER } from './config.js';
import { circleHitsRect, pointInRect } from './level.js';

export class Player {
  constructor(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.radius = PLAYER.radius;
    this.sneaking = false;
    this.moving = false;
    this.facing = -Math.PI / 2;
    this.pebbles = PLAYER.pebbles;
    this.pebbleCooldownUntil = 0;
    this.shards = 0;
  }

  get speed() {
    return this.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  }

  update(dt, input, solids) {
    const v = input.moveVector();
    this.sneaking = input.sneaking;
    this.moving = v.x !== 0 || v.y !== 0;
    if (this.moving) {
      this.facing = Math.atan2(v.y, v.x);
      const nx = this.x + v.x * this.speed * dt;
      const ny = this.y + v.y * this.speed * dt;
      if (!solids.some((r) => circleHitsRect(nx, this.y, this.radius, r))) this.x = nx;
      if (!solids.some((r) => circleHitsRect(this.x, ny, this.radius, r))) this.y = ny;
    }
  }

  canThrowPebble(nowMs) {
    return this.pebbles > 0 && nowMs >= this.pebbleCooldownUntil;
  }

  throwPebble(nowMs) {
    if (!this.canThrowPebble(nowMs)) return false;
    this.pebbles -= 1;
    this.pebbleCooldownUntil = nowMs + PLAYER.pebbleCooldownMs;
    return true;
  }

  pebbleCooldownLeft(nowMs) {
    return Math.max(0, this.pebbleCooldownUntil - nowMs);
  }

  // Grab any shard within reach; returns the shard taken, or null.
  collectShards(shards) {
    for (const s of shards) {
      if (!s.taken && Math.hypot(s.x - this.x, s.y - this.y) < this.radius + 20) {
        s.taken = true;
        this.shards += 1;
        return s;
      }
    }
    return null;
  }

  atExit(exit) {
    return pointInRect(this.x, this.y, exit);
  }
}
