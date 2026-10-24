// Docs: docs/testing.md
// Tests only (TEST_SPEED=N on a throwaway server, never live): the whole game runs N× faster than real
// time. Nothing in the game changes: the sim still takes one 1/60 s step per tick, cooldowns are still
// so many ms. Only the clocks run fast: performance.now, Date.now, setTimeout / setInterval and
// requestAnimationFrame's timestamp, so the server ticks N×60 times a real second and every timer
// (boss moves, buffs, respawns) keeps step with it. The server installs it at startup; a client gets
// `speed` (and the server's sped-up Date.now) in `welcome` and installs the same, so a headless test
// browser keeps up with the server without any change to the test script beyond shorter waits.

export let speed = 1;

export function installSpeed(n, dateNow) {
  n = Number(n);
  if (!(n > 1) || speed !== 1) return; // once only (a reconnect sends welcome again)
  speed = n;
  const g = globalThis;
  const perf = g.performance.now.bind(g.performance), date = Date.now;
  const p0 = perf(), d0 = date(), dBase = dateNow ?? d0;
  g.performance.now = () => p0 + (perf() - p0) * n;
  Date.now = () => dBase + (date() - d0) * n;
  const st = g.setTimeout.bind(g), si = g.setInterval.bind(g);
  g.setTimeout = (f, ms = 0, ...a) => st(f, ms / n, ...a);
  g.setInterval = (f, ms = 0, ...a) => si(f, ms / n, ...a);
  if (g.requestAnimationFrame) {
    const raf = g.requestAnimationFrame.bind(g);
    g.requestAnimationFrame = (f) => raf(() => f(g.performance.now()));
  }
}

// The server: install before any other module starts a timer (server/index.js imports this first).
if (typeof process !== 'undefined' && process.env?.TEST_SPEED) installSpeed(process.env.TEST_SPEED);
