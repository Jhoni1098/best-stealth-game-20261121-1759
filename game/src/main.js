// Emberlight Heist — game orchestration: states, the loop, pebble tosses,
// footstep traces, win/lose, and the staged ?shot= scenes screenshots use.
import { WORLD, LEVEL, PLAYER, GUARD } from './config.js';
import { buildLevel, sightBlockers, pointInRect } from './level.js';
import { pointInEllipse, pointInCircle } from './vision.js';
import { Guard, updateGuards } from './guards.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { drawScene } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const input = new Input(canvas);
const sounds = new SoundBank();

function freshGame() {
  const level = buildLevel();
  return {
    level,
    player: new Player(level.spawn),
    guards: level.patrols.map((p) => new Guard(p)),
    blockers: sightBlockers(level),
    solids: [...level.walls, ...level.crates],
    state: 'title',
    timeMs: 0,
    alert: 0,
    timesSpotted: 0,
    exitOpen: false,
    playerHidden: false,
    inShadow: false,
    message: '',
    messageUntil: 0,
    particles: [],
    ripples: [],
    frozen: false,
    stepMs: 0,
    alarmSounded: false,
  };
}

let game = freshGame();

function showMessage(text, ms = 2600) {
  game.message = text;
  game.messageUntil = performance.now() + ms;
}

function playerCover() {
  const p = game.player;
  game.playerHidden = game.level.bushes.some((b) => pointInCircle(p.x, p.y, b));
  game.inShadow = game.level.shadows.some((s) => pointInEllipse(p.x, p.y, s));
}

function guardContext() {
  return {
    blockers: game.blockers,
    solids: game.solids,
    onAlarm: (guard) => {
      game.timesSpotted += 1;
      sounds.alarm();
      showMessage(`${guard.name} raised the alarm! Break line of sight!`, 3000);
      statusEl.textContent = 'Alarm! A warden is chasing you.';
    },
  };
}

function tossPebbleAt(point) {
  const now = performance.now();
  if (!game.player.canThrowPebble(now)) return;
  game.player.throwPebble(now);
  sounds.pebble();
  game.ripples.push({ x: point.x, y: point.y, r: 6, maxR: 46, life: 600, maxLife: 600 });
  let lured = 0;
  for (const g of game.guards) {
    if (Math.hypot(g.x - point.x, g.y - point.y) < PLAYER.pebbleLureRadius) {
      g.lureTo(point);
      lured += 1;
    }
  }
  showMessage(lured > 0 ? 'Tink! A warden goes to look.' : 'Tink… nobody heard it.', 1800);
}

function checkWinLose() {
  const p = game.player;
  if (game.state !== 'playing') return;
  if (p.atExit(game.level.exit) && game.exitOpen) {
    game.state = 'won';
    sounds.win();
    statusEl.textContent = 'Escaped! You stole the ember shards.';
    return;
  }
  if (p.atExit(game.level.exit) && !game.exitOpen) {
    showMessage(`The moon gate is locked — steal ${LEVEL.shardsNeeded - p.shards} more shard(s) first.`, 2000);
  }
  for (const g of game.guards) {
    if (g.caughtPlayer(p)) {
      game.state = 'caught';
      sounds.caught();
      statusEl.textContent = 'Caught by a warden.';
      return;
    }
  }
}

function step(dt) {
  const now = performance.now();
  if (game.message && now > game.messageUntil) game.message = '';

  if (game.state === 'title') {
    if (input.consumePressed('enter') || input.takeClicks().length > 0) {
      game.state = 'playing';
      sounds.ensure();
      statusEl.textContent = 'Sneaking. Steal three ember shards, then reach the moon gate.';
    }
    input.endFrame();
    return;
  }
  if (input.consumePressed('r')) {
    game = freshGame();
    game.state = 'playing';
    input.endFrame();
    return;
  }
  if (input.consumePressed('p') && (game.state === 'playing' || game.state === 'paused')) {
    game.state = game.state === 'playing' ? 'paused' : 'playing';
  }
  if (game.state !== 'playing' || game.frozen) {
    input.endFrame();
    return;
  }

  game.timeMs += dt * 1000;
  game.player.update(dt, input, game.solids);
  playerCover();

  for (const click of input.takeClicks()) tossPebbleAt(click);

  const ctxGuard = guardContext();
  ctxGuard.inShadow = game.inShadow;
  ctxGuard.inBush = game.playerHidden;
  // visionCheck reads inShadow/inBush off the shared context object.
  game.alert = updateGuards(game.guards, dt, game.player, ctxGuard);

  // Footstep traces: wardens leave faint puffs as they walk, so you can
  // read where a patrol has been — and where it is heading.
  game.stepMs += dt * 1000;
  if (game.stepMs > 320) {
    game.stepMs = 0;
    for (const g of game.guards) {
      if (g.state === 'patrol' || g.state === 'chase') {
        game.particles.push({ x: g.x, y: g.y + 12, r: 3, life: 900, maxLife: 900, color: '#8a94c2' });
      }
    }
    if (game.player.moving && !game.player.sneaking) {
      game.particles.push({ x: game.player.x, y: game.player.y + 10, r: 3, life: 700, maxLife: 700, color: '#ffd479' });
    }
  }
  for (const p of game.particles) p.life -= dt * 1000;
  game.particles = game.particles.filter((p) => p.life > 0);
  for (const r of game.ripples) {
    r.life -= dt * 1000;
    r.r += dt * 60;
  }
  game.ripples = game.ripples.filter((r) => r.life > 0);

  const shard = game.player.collectShards(game.level.shards);
  if (shard) {
    sounds.pickup();
    if (game.player.shards >= LEVEL.shardsNeeded) {
      game.exitOpen = true;
      sounds.unlock();
      showMessage('All shards stolen — the moon gate is open!', 3200);
      statusEl.textContent = 'All shards stolen. Reach the moon gate.';
    } else {
      showMessage(`Ember shard stolen (${game.player.shards}/${LEVEL.shardsNeeded})`, 2000);
    }
  }
  checkWinLose();
  input.endFrame();
}

let last = performance.now();
let frames = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  step(dt);
  drawScene(ctx, game, now / 1000);
  frames += 1;
  if (frames === 2 && window.__shotPending) window.__shotReady = true;
  requestAnimationFrame(loop);
}

// --- Staged scenes for screenshots (?shot=cover|patrol|alarm|win) ---------
function placeGuard(i, x, y, facingDeg, suspicion, state) {
  const g = game.guards[i];
  g.x = x;
  g.y = y;
  g.facing = (facingDeg * Math.PI) / 180;
  g.suspicion = suspicion;
  if (state) {
    g.state = state;
    g.stateMs = 0;
  }
  return g;
}

function applyShot(shot) {
  game.frozen = true;
  game.state = 'playing';
  const p = game.player;
  if (shot === 'cover') {
    // The money shot: Pip crouched behind a crate, a warden's cone
    // sweeping past, bushes, shadow and the moon gate all in frame.
    p.x = 350; p.y = 330; p.sneaking = true; p.facing = -Math.PI * 0.75;
    p.shards = 1;
    game.level.shards[0].taken = true;
    placeGuard(0, 470, 200, 135, 32, 'suspicious');
    placeGuard(1, 800, 300, 180, 8, 'patrol');
    placeGuard(2, 150, 400, 0, 0, 'patrol');
    placeGuard(3, 640, 540, 90, 0, 'patrol');
    game.alert = 32;
    showMessage('Stay out of the light — the wardens are watching.', 60000);
  } else if (shot === 'patrol') {
    // Hidden in a bush while a suspicious warden stares at your last spot.
    p.x = 480; p.y = 300; p.sneaking = true;
    game.playerHidden = true;
    placeGuard(0, 560, 250, 200, 68, 'suspicious');
    placeGuard(1, 820, 380, 160, 0, 'patrol');
    placeGuard(2, 200, 300, 20, 0, 'patrol');
    placeGuard(3, 560, 560, 270, 0, 'patrol');
    game.alert = 68;
    showMessage('Hidden in the bush — hold still until the warden looks away.', 60000);
  } else if (shot === 'alarm') {
    // Full chase: alarm up, warden closing in, Pip diving for the shadows.
    p.x = 700; p.y = 500; p.shards = 2;
    game.level.shards[0].taken = true;
    game.level.shards[1].taken = true;
    placeGuard(0, 600, 420, 55, 100, 'chase');
    game.guards[0].lastSeen = { x: p.x, y: p.y };
    placeGuard(1, 880, 300, 200, 40, 'suspicious');
    placeGuard(2, 260, 380, 0, 0, 'patrol');
    placeGuard(3, 500, 590, 0, 0, 'patrol');
    game.alert = 100;
    game.timesSpotted = 1;
    showMessage('ALARM! Break line of sight — dive into shadow!', 60000);
  } else if (shot === 'win') {
    p.x = 900; p.y = 75; p.shards = 3;
    for (const s of game.level.shards) s.taken = true;
    game.exitOpen = true;
    game.state = 'won';
    game.timeMs = 142000;
    game.timesSpotted = 1;
    placeGuard(0, 520, 300, 0, 0, 'patrol');
    placeGuard(1, 780, 420, 90, 0, 'patrol');
    placeGuard(2, 200, 300, 0, 0, 'patrol');
    placeGuard(3, 640, 560, 0, 0, 'patrol');
  }
  playerCover();
  window.__shotPending = true;
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) applyShot(shot);

// Test hooks: headless playtests drive the game through these.
window.__game = {
  get state() { return game.state; },
  get alert() { return game.alert; },
  get timeMs() { return game.timeMs; },
  get player() { return game.player; },
  get guards() { return game.guards; },
  get exitOpen() { return game.exitOpen; },
  get level() { return game.level; },
  start() { game.state = 'playing'; },
  restart() { game = freshGame(); game.state = 'playing'; },
  teleport(x, y) { game.player.x = x; game.player.y = y; },
};

requestAnimationFrame(loop);
