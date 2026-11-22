// Emberlight Heist — entrypoint for the best-stealth-game bounty.
//
// This program hands the game in. It takes the repository's own static
// game (game/, plain files a desktop browser plays offline) and the
// screenshots of that game (screenshots/), copies both into the output
// directory, and writes dossier.json there with the vendored make.fun
// dossier builder. Run it with Node 22 or newer:
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Inside the grader the output directory is /output instead; the
// environment variable is only the local stand-in for it.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const destination = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

function fail(message) {
  throw new Error(`Emberlight Heist hand-in refused: ${message}`);
}

function countEntries(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    total += 1;
    if (statSync(path).isDirectory()) total += countEntries(path);
  }
  return total;
}

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(gameDir)) fail('game/ is missing from the repository');
if (!existsSync(join(gameDir, 'index.html'))) fail('game/index.html is missing');
if (countEntries(gameDir) > 993) fail('game/ holds more than 993 entries');

mkdirSync(destination, { recursive: true });
mkdirSync(join(destination, 'screenshots'), { recursive: true });

cpSync(gameDir, join(destination, 'game'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(destination, 'screenshots'), { recursive: true });
}

const shotFiles = readdirSync(join(destination, 'screenshots')).filter((n) => !n.startsWith('.'));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  fail(`expected 3 or 4 screenshots, found ${shotFiles.length}`);
}

writeFileSync(
  join(destination, 'dossier.json'),
  buildDossier(destination, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Emberlight Heist handed in to ${destination} (${shotFiles.length} screenshots).`);
