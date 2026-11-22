// Emberlight Heist — all canvas drawing: the moonlit floor, cover you can
// read at a glance, vision cones that change colour with suspicion, the
// wardens, Pip the thief, and the HUD.
import { COLORS, GUARD, WORLD, LEVEL } from './config.js';
import { GUARD_STATE } from './guards.js';

function coneColor(guard) {
  if (guard.state === GUARD_STATE.CHASE) return COLORS.guardConeAlert;
  if (guard.suspicion >= GUARD.suspiciousAt || guard.state === GUARD_STATE.SUSPICIOUS) return COLORS.guardConeSuspicious;
  return COLORS.guardCone;
}

function drawFloor(ctx, t) {
  const tile = 80;
  for (let y = 0; y < WORLD.height; y += tile) {
    for (let x = 0; x < WORLD.width; x += tile) {
      ctx.fillStyle = (x / tile + y / tile) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD.width; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.height); ctx.stroke();
  }
  for (let y = 0; y <= WORLD.height; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); ctx.stroke();
  }
  // Faint moonlight dapples drifting slowly across the floor.
  ctx.fillStyle = 'rgba(255, 240, 190, 0.03)';
  for (let i = 0; i < 6; i++) {
    const x = ((i * 173 + t * 6) % (WORLD.width + 120)) - 60;
    const y = 60 + i * 97;
    ctx.beginPath(); ctx.ellipse(x, y, 90, 34, 0.4, 0, Math.PI * 2); ctx.fill();
  }
}

function drawShadowsAndBushes(ctx, level) {
  for (const s of level.shadows) {
    ctx.fillStyle = COLORS.shadow;
    ctx.beginPath(); ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(120, 150, 255, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2); ctx.stroke();
  }
  for (const b of level.bushes) {
    ctx.fillStyle = COLORS.bush;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.bushLeaf;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(b.x + Math.cos(a) * b.r * 0.55, b.y + Math.sin(a) * b.r * 0.55, b.r * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawStructures(ctx, level) {
  for (const c of level.crates) {
    ctx.fillStyle = COLORS.crate;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = COLORS.crateTop;
    ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    ctx.beginPath();
    ctx.moveTo(c.x + 4, c.y + 4); ctx.lineTo(c.x + c.w - 4, c.y + c.h - 4);
    ctx.moveTo(c.x + c.w - 4, c.y + 4); ctx.lineTo(c.x + 4, c.y + c.h - 4);
    ctx.stroke();
  }
  for (const w of level.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    if (w.w >= w.h) ctx.fillRect(w.x, w.y, w.w, 4);
    else ctx.fillRect(w.x, w.y, 4, w.h);
  }
}

function drawShardsAndExit(ctx, level, shardsGot, exitOpen, t) {
  for (const s of level.shards) {
    if (s.taken) continue;
    const pulse = 1 + Math.sin(t * 3 + s.x) * 0.12;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = COLORS.shardGlow;
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.shard;
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(8, 0); ctx.lineTo(0, 11); ctx.lineTo(-8, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  const e = level.exit;
  ctx.fillStyle = exitOpen ? COLORS.exitOpen : COLORS.exitLocked;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = '#0b0e1a';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#0b0e1a';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(exitOpen ? 'EXIT' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2 + 5);
  if (exitOpen) {
    ctx.strokeStyle = `rgba(125, 255, 176, ${0.5 + Math.sin(t * 4) * 0.3})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(e.x - 4, e.y - 4, e.w + 8, e.h + 8);
  }
  ctx.textAlign = 'left';
}

function drawVisionCone(ctx, guard) {
  const range = GUARD.visionRange;
  ctx.fillStyle = coneColor(guard);
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.facing - GUARD.visionHalfAngle, guard.facing + GUARD.visionHalfAngle);
  ctx.closePath();
  ctx.fill();
}

function drawGuard(ctx, guard, t) {
  drawVisionCone(ctx, guard);
  // Lantern glow around the warden.
  const glow = ctx.createRadialGradient(guard.x, guard.y, 4, guard.x, guard.y, 46);
  glow.addColorStop(0, 'rgba(255, 210, 110, 0.35)');
  glow.addColorStop(1, 'rgba(255, 210, 110, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(guard.x, guard.y, 46, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#20264a';
  ctx.beginPath(); ctx.arc(guard.x, guard.y, GUARD.radius + 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath(); ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2); ctx.fill();
  // Facing tick + little lantern.
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * 20, guard.y + Math.sin(guard.facing) * 20);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.facing) * 20, guard.y + Math.sin(guard.facing) * 20, 4, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion / alarm mark above the head.
  const mark = guard.state === GUARD_STATE.CHASE ? '!' : guard.suspicion >= GUARD.suspiciousAt ? '?' : null;
  if (mark) {
    const bob = Math.sin(t * 6) * 2;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = mark === '!' ? '#ff4040' : '#ffb347';
    ctx.fillText(mark, guard.x, guard.y - GUARD.radius - 10 + bob);
    ctx.textAlign = 'left';
  }
  // Thin suspicion arc under the warden.
  if (guard.suspicion > 1) {
    ctx.strokeStyle = guard.suspicion >= GUARD.alarmAt ? '#ff4040' : '#ffb347';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius + 8, -Math.PI / 2, -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlayer(ctx, player, hidden, t) {
  if (hidden) {
    // Rustling bush: only a faint outline shows you are in there.
    ctx.strokeStyle = 'rgba(255, 212, 121, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  ctx.globalAlpha = player.sneaking ? 0.85 : 1;
  ctx.fillStyle = '#20264a';
  ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = player.sneaking ? COLORS.playerSneak : COLORS.player;
  ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill();
  // Hood point + facing tick.
  ctx.fillStyle = '#7a5c1e';
  ctx.beginPath();
  ctx.moveTo(player.x + Math.cos(player.facing) * 18, player.y + Math.sin(player.facing) * 18);
  ctx.lineTo(player.x + Math.cos(player.facing + 2.5) * 9, player.y + Math.sin(player.facing + 2.5) * 9);
  ctx.lineTo(player.x + Math.cos(player.facing - 2.5) * 9, player.y + Math.sin(player.facing - 2.5) * 9);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  // Sneak = crouched ring.
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(255, 212, 121, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 6, 0, Math.PI * 2); ctx.stroke();
  }
  void t;
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * 0.5;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, game) {
  const { player, alert } = game;
  const shardsNeeded = LEVEL.shardsNeeded;
  ctx.fillStyle = 'rgba(5, 8, 20, 0.72)';
  ctx.fillRect(0, 0, WORLD.width, 44);

  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillStyle = '#ffd479';
  ctx.textAlign = 'left';
  ctx.fillText('EMBERLIGHT HEIST', 14, 28);

  // Objective + shards.
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#cdd6f4';
  const objective = player.shards >= shardsNeeded
    ? 'All shards stolen — reach the moon gate!'
    : `Steal the ember shards: ${player.shards}/${shardsNeeded}`;
  ctx.fillText(objective, 210, 28);

  // Suspicion meter.
  const mx = 620;
  ctx.fillStyle = '#2a3358';
  ctx.fillRect(mx, 14, 150, 16);
  ctx.fillStyle = alert >= 100 ? '#ff4040' : alert >= 55 ? '#ffb347' : '#7dffb0';
  ctx.fillRect(mx, 14, 150 * (alert / 100), 16);
  ctx.strokeStyle = '#cdd6f4';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx, 14, 150, 16);
  ctx.fillStyle = '#cdd6f4';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(alert >= 100 ? 'ALARM!' : alert >= 55 ? 'SUSPICIOUS' : 'UNSEEN', mx + 158, 27);

  // Pebbles.
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#cdd6f4';
  ctx.fillText(`Pebbles: ${'●'.repeat(player.pebbles)}${'○'.repeat(3 - player.pebbles)}`, 14, 62);

  // Timer.
  const secs = Math.floor(game.timeMs / 1000);
  ctx.fillText(`Time ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}  ·  Spotted ${game.timesSpotted}x`, 780, 62);

  if (game.message) {
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(game.message, WORLD.width / 2, 84);
    ctx.textAlign = 'left';
  }
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5, 8, 20, 0.78)';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(title, WORLD.width / 2, 250);
  ctx.fillStyle = '#e6ecff';
  ctx.font = '18px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, WORLD.width / 2, 300 + i * 30));
  ctx.textAlign = 'left';
}

export function drawScene(ctx, game, t) {
  const { level, player, guards } = game;
  drawFloor(ctx, t);
  drawShadowsAndBushes(ctx, level);
  drawShardsAndExit(ctx, level, player.shards, game.exitOpen, t);
  drawStructures(ctx, level);
  for (const g of guards) drawGuard(ctx, g, t);
  drawParticles(ctx, game.particles);
  drawPlayer(ctx, player, game.playerHidden, t);
  drawHud(ctx, game);

  if (game.state === 'title') {
    drawOverlay(ctx, 'EMBERLIGHT HEIST', [
      'Pip the firefly-thief is after three ember shards in the vault garden.',
      'Slip past the Lantern Wardens, hide in bushes and shadows,',
      'then vanish through the moon gate — unseen.',
      '',
      'Press Enter or click to begin.  WASD move · Shift sneak · Click tosses a pebble.',
    ], '#ffd479');
  } else if (game.state === 'caught') {
    drawOverlay(ctx, 'CAUGHT!', [
      'A warden grabbed Pip under the lamplight.',
      `Shards stolen: ${player.shards}/${LEVEL.shardsNeeded}   ·   Time: ${Math.floor(game.timeMs / 1000)}s`,
      'Press R to try again — slower this time.',
    ], '#ff5d73');
  } else if (game.state === 'won') {
    drawOverlay(ctx, 'ESCAPED!', [
      'Three shards, zero alarms raised that mattered. The moon gate closes behind you.',
      `Time: ${Math.floor(game.timeMs / 1000)}s   ·   Times spotted: ${game.timesSpotted}   ·   Pebbles left: ${player.pebbles}`,
      'Press R to run the garden again.',
    ], '#7dffb0');
  } else if (game.state === 'paused') {
    drawOverlay(ctx, 'PAUSED', ['Press P to keep sneaking.'], '#cdd6f4');
  }
}
