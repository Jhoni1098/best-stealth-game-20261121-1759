# Emberlight Heist

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Jhoni1098/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Jhoni1098/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

An original top-down stealth game for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759).

You are Pip, a firefly-thief after three ember shards in a moonlit vault
garden. Four Lantern Wardens patrol the grounds with visible vision cones.
Duck behind crates, hide in bushes, slip through shadow pools, and reach
the moon gate unseen.

## How to play

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, quieter, harder to spot)
- **Click** — toss a pebble to lure a nearby warden away (3 pebbles)
- **R** — restart · **P** — pause · **Enter** — start

A warden who glimpses you grows suspicious (amber `?`, it stops and
stares); a full meter raises the alarm (red `!`, it chases). Break line of
sight and the chase cools into a search, then the warden returns to its
rounds. Get caught and the run ends. Steal all three shards to unlock the
moon gate, then slip out.

## Play it

Serve `game/` with any static server — no build step, no network requests:

```sh
node serve.ts   # http://localhost:8080
```

## Layout

- `game/index.html` — page and canvas
- `game/src/config.js` — tuning constants
- `game/src/level.js` — the vault garden: walls, crates, bushes, shadows, patrols
- `game/src/vision.js` — vision cones, line of sight, suspicion gain
- `game/src/guards.js` — warden patrol / suspicious / chase / search states
- `game/src/player.js` — Pip: movement, sneaking, pebbles, shard pickups
- `game/src/audio.js` — synthesized Web Audio sounds (no audio files)
- `game/src/render.js` — all canvas drawing and the HUD
- `game/src/main.js` — game states, the loop, win/lose, screenshot scenes
- `main.ts` — hands the entry in (copies `game/` + `screenshots/`, writes `dossier.json`)

MIT licensed. All art, names and sounds are original.
