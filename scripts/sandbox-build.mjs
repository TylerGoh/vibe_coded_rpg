// Docs: docs/sandbox.md
// Builds the dev sandbox's client (deploy/rpg-dev.service runs it before every start), but only when the code changed,
// so a cold start after the sandbox has been idle stays quick. It hashes everything the client build reads (src/,
// public/, index.html, vite.config.js, package-lock.json, and RPG_BASE) and keeps the hash in DIST/.sandbox-stamp; a
// different hash (or no build yet) runs `vite build` into DIST with RPG_BASE.
//
//   DIST=~/.cache/rpg-dev/dist RPG_BASE=/rpg_dev/ node scripts/sandbox-build.mjs [--force]
//
// DIST is required: building into the repo's own dist/ is what the LIVE site serves (Agent.md).
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = process.env.DIST ? resolve(process.env.DIST) : null;
const BASE = process.env.RPG_BASE || '/rpg_dev/';
if (!DIST || DIST === join(ROOT, 'dist') || DIST === resolve(process.env.HOME ?? '/', 'rpg', 'dist')) {
  console.error('sandbox-build: set DIST to the sandbox\'s own build folder (never a dist/ the live site serves)');
  process.exit(1);
}

const walk = (dir) => (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])) : []);
const files = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'public')), ...['index.html', 'vite.config.js', 'package-lock.json'].map((f) => join(ROOT, f)).filter(existsSync)].sort();
const hash = createHash('sha256').update(`base ${BASE}\n`);
for (const f of files) hash.update(`${relative(ROOT, f)}\n`).update(readFileSync(f));
const want = hash.digest('hex');
const STAMP = join(DIST, '.sandbox-stamp');
const have = existsSync(STAMP) && existsSync(join(DIST, 'index.html')) ? readFileSync(STAMP, 'utf8').trim() : '';
if (have === want && !process.argv.includes('--force')) {
  console.log('sandbox-build: the client is up to date');
  process.exit(0);
}
console.log(`sandbox-build: building the client into ${DIST} (base ${BASE})`);
const t = Date.now();
const r = spawnSync(process.execPath, [join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--outDir', DIST, '--emptyOutDir'], { cwd: ROOT, env: { ...process.env, RPG_BASE: BASE }, stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status ?? 1);
writeFileSync(STAMP, `${want}\n`);
console.log(`sandbox-build: done in ${((Date.now() - t) / 1000).toFixed(1)} s`);
statSync(join(DIST, 'index.html')); // (throws if the build left no page)
