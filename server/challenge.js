// Docs: docs/combat/challenges.md
// Boss challenges, the server's side (story/tricky-plan.md): starting them on a boss, judging the claims, ending
// them. A boss's live challenges are `m.ch` ([{ type, seed, len, until, … }]); a slime's are on the player: `p.snare`
// (the trap it's in: { type, seed, len, mob, room, at, until? }) and `p.punish` (a failed trap: the boss's next hit does
// more). Hits are client-decided like every boss hazard (an 'ouch' whose kind maps to a type: KIND below), and the
// physics edit (`tr`, `cs`: sim.js) is made at that input on both sides. Escaping is {t:'free', s, k} (your own arrows)
// or {t:'free', s, k, who} (a friend's cage), checked against the trap's seed (the order, not the timing, but for the
// rhythm lock's overall length). Tethers are judged here from positions; the moving arena's ledges ({t:'pf'}) are the
// client's predicted edits, checked against what's sunk.
import {
  CHALLENGES, TRAP_HOLD, SNARE_TICKS, SNARE_WARN, SNARE_LIVE, SNARE_R, SNARE_PUNISH, PUNISH_KEEP_S, snareLen, SWAP_TICKS, SWAP_SPEED, SWAP_R, CLAIM_SLACK_MS,
  seedFor, comboFor, sameCombo, RHYTHM_TICKS, RHYTHM_BEAT, RHYTHM_SLACK_MS, rhythmLen, CAGE_WARN, CAGE_R, CAGE_S, RESCUE_R, GAPS_WARN, GAPS_LIVE, GAP_W, GAP_SLIDE,
  ARENA_WARN, ARENA_S, ARENA_SINK, ARENA_GRID_AT, DARK_S, TETHER_S, TETHER_R, TETHER_HP, TETHER_WARN, BASH_WARN, BASH_REACH, BASH_H, PARRY_STAGGER_S, PARRY_REFLECT,
  LOCK_WARN, LOCK_S, LOCK_R,
} from '../src/shared/challenge.js';
import { roomDef } from '../src/shared/sim.js';

// an ouch's kind → the challenge type it claims (the kinds the client sends: src/rpg.js hazardHits, src/challenge.js)
export const KIND = { snare: 'snare', swap: 'swap', rhythm: 'rhythm', cage: 'rescue', lock: 'lock', gaps: 'gaps', bash: 'parry' };
const TEACH_AT_START = new Set(['rescue', 'gaps', 'arena', 'dark', 'tether', 'parry', 'lock']); // (G2's line as it starts, not on a hit)
const SLACK = 60; // px: a rescuer's or a parrier's distance, as the client saw it a moment ago

// deps: now(), MOBS, bossEvent(m, a, extra), send(ws, msg), toRoom(room)(msg), inRoom(room) → [[id, p]], mobById(id),
// faint(id, p, by), hurtFlat(id, p, share, m) (a share of max HP, no knockback), stagger(m, s), damage(m, n, id, p, dir),
// lockBroken(m) (A23 done: the barrier breaks)
export function createChallenges({ now, MOBS, bossEvent, send, toRoom, inRoom, mobById, faint, hurtFlat, stagger, damage, lockBroken }) {
  const live = (m) => (m.ch ??= []);
  const newSeed = () => (Math.random() * 4294967296) >>> 0;
  const standing = (list) => list.filter(([, q]) => !q.faintUntil);

  // Start challenge `type` on boss m. opts.at: the slimes it's aimed at ([[id, p]]; default everyone in its room
  // standing); opts.stage: the boss's phase (0…) for the types that grow with it; opts.marks: [[x, delay]] for a snare
  // or rhythm lock that springs at set places instead of under each target; opts.style: how its roots look; opts.force:
  // even below its `min` fighters (the sandbox: a cage alone just crushes you, a tether alone chains you to the boss).
  // Only built types, and only with enough fighters (`min`). → started?
  function start(m, type, opts = {}) {
    const row = CHALLENGES[type], k = MOBS[m.kind];
    if (!row?.built || m.dead) return false;
    const here = standing(opts.at ?? inRoom(m.room));
    const fighters = opts.at ? standing(inRoom(m.room)).length : here.length;
    if (!here.length || (fighters < row.min && !opts.force)) return false;
    const t = now(), seed = newSeed(), stage = opts.stage ?? m.stage ?? 0, style = opts.style ?? k.looks?.snare;
    if (type === 'snare' || type === 'rhythm') {
      // roots (or fetters) under each target, a little apart in time, so a crowd can't all be caught by one jump
      const list = opts.marks ?? here.map(([, q], i) => [Math.round(q.state.x), +(i * 0.25).toFixed(2)]);
      const len = type === 'rhythm' ? rhythmLen(k.lvl) : snareLen(k.lvl);
      const last = Math.max(...list.map((a) => a[1]));
      live(m).push({ type, seed, len, until: t + (last + SNARE_WARN + SNARE_LIVE) * 1000 + CLAIM_SLACK_MS });
      bossEvent(m, 'chal', { type, list, warn: SNARE_WARN, dur: SNARE_LIVE, r: SNARE_R, y: m.sp.y, len, seed, style });
    } else if (type === 'swap') {
      // a slow orb at each target, from the boss's chest
      const y0 = m.y - k.h * 0.6, shots = [];
      here.forEach(([, q], i) => {
        const dx = q.state.x - m.x, dy = q.state.y - 22 - y0, d = Math.hypot(dx, dy) || 1;
        shots.push([Math.round(m.x), Math.round(y0), Math.round((dx / d) * SWAP_SPEED), Math.round((dy / d) * SWAP_SPEED), 0, SWAP_R, +(0.5 + i * 0.3).toFixed(2)]);
      });
      const last = shots[shots.length - 1][6];
      live(m).push({ type, seed, until: t + (last + 4) * 1000 + CLAIM_SLACK_MS });
      bossEvent(m, 'chal', { type, shots });
    } else if (type === 'lock') {
      // A23: roots seize everyone at once; everyone caught gets the same arrows (the seed itself, not mixed per slime)
      const list = here.map(([, q]) => [Math.round(q.state.x), 0]);
      const len = snareLen(k.lvl);
      live(m).push({ type, seed, len, until: t + (LOCK_WARN + SNARE_LIVE) * 1000 + CLAIM_SLACK_MS, keep: t + (LOCK_WARN + SNARE_LIVE + 5) * 1000, caught: new Set(), freed: new Map(), over: false });
      bossEvent(m, 'chal', { type, list, warn: LOCK_WARN, dur: SNARE_LIVE, r: LOCK_R, y: m.sp.y, len, seed, style });
    } else if (type === 'rescue') {
      // A5: a cage over one slime (not the one it's watching, if it can help it)
      const pool = here.filter(([, q]) => q !== m.focus?.p), [id, q] = (pool.length ? pool : here)[Math.floor(Math.random() * (pool.length || here.length))];
      const len = snareLen(k.lvl);
      live(m).push({ type, seed, len, target: id, until: t + (CAGE_WARN + SNARE_LIVE) * 1000 + CLAIM_SLACK_MS });
      bossEvent(m, 'chal', { type, x: Math.round(q.state.x), y: Math.round(q.state.y), target: id, warn: CAGE_WARN, dur: SNARE_LIVE, r: CAGE_R, len, seed, style });
    } else if (type === 'gaps') {
      // A6: ice along the whole den but one gap; from the boss's phase 4 (stage 3) it slides
      const W = roomDef(m.room).width, slide = stage >= 3 ? GAP_SLIDE * (Math.random() < 0.5 ? -1 : 1) : 0, span = GAPS_WARN + GAPS_LIVE;
      const lo = 120 + Math.max(0, -slide * span), hi = W - 120 - Math.max(0, slide * span);
      const x0 = Math.round(lo + Math.random() * Math.max(1, hi - lo));
      live(m).push({ type, seed, until: t + span * 1000 + CLAIM_SLACK_MS });
      bossEvent(m, 'chal', { type, x0, v: slide, w: GAP_W, warn: GAPS_WARN, dur: GAPS_LIVE, style });
    } else if (type === 'arena') {
      // A15: ledges sink for ARENA_S; from its phase 2 the floor's roots strike while they're down
      const n = roomDef(m.room).platforms.length;
      if (!n) return false;
      const all = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);
      const down = opts.down ?? all.slice(0, Math.max(1, Math.min(n - 1, stage + 1)));
      const mask = down.reduce((a, i) => a | (1 << i), 0);
      live(m).push({ type, seed, mask, until: t + (ARENA_WARN + ARENA_S + 1) * 1000 });
      bossEvent(m, 'chal', { type, down, warn: ARENA_WARN, dur: ARENA_S, sink: ARENA_SINK });
      if (stage >= 1) {
        const odd = Math.random() < 0.5, tiles = Array.from({ length: 10 }, (_, i) => i).filter((i) => stage >= 2 || i % 2 === (odd ? 1 : 0));
        bossEvent(m, 'grid', { style: k.looks?.grid ?? 'root', tiles, warn: ARENA_WARN + ARENA_SINK + ARENA_GRID_AT, dur: 0.45, tall: false });
      }
    } else if (type === 'dark') {
      live(m).push({ type, seed, until: t + DARK_S * 1000 });
      bossEvent(m, 'chal', { type, dur: DARK_S });
    } else if (type === 'tether') {
      // A18: pairs of fighters, chosen at random; an odd one out is chained to the boss (b: 0)
      const ids = here.map(([id]) => id).sort(() => Math.random() - 0.5), pairs = [];
      for (let i = 0; i < ids.length; i += 2) pairs.push([ids[i], ids[i + 1] ?? 0]);
      live(m).push({ type, seed, pairs, from: t + TETHER_WARN * 1000, until: t + (TETHER_WARN + TETHER_S) * 1000 });
      bossEvent(m, 'chal', { type, pairs, warn: TETHER_WARN, dur: TETHER_S, r: TETHER_R });
    } else if (type === 'parry') {
      // A20: the shield bash, at whoever it's after (it turns to them first)
      const q = m.target ?? here[0][1];
      m.dir = Math.sign(q.state.x - m.x) || m.dir;
      const warn = BASH_WARN[Math.min(BASH_WARN.length - 1, stage)];
      live(m).push({ type, seed, x: m.x, dir: m.dir, at: t + warn * 1000, until: t + warn * 1000 + CLAIM_SLACK_MS, parried: false });
      bossEvent(m, 'chal', { type, x: Math.round(m.x), dir: m.dir, w: Math.round(k.w / 2), reach: BASH_REACH, h: BASH_H, warn });
    } else return false;
    // G2: the types you learn by seeing them (no hit to wait for) show their line to everyone fighting as they start
    if (TEACH_AT_START.has(type)) for (const [, q] of standing(inRoom(m.room))) firstTime(q, type);
    return true;
  }

  // An ouch of a challenge kind (KIND) from mob m: the live challenge it claims, or null (nothing of that kind going on)
  function claim(m, kind) {
    const t = now(), type = KIND[kind];
    return type ? live(m).find((c) => c.type === type && c.until > t) ?? null : null;
  }

  // G2: one banner line the first time this character meets the type (saved: c.seen)
  function firstTime(p, type) {
    const seen = (p.rpg.seen ??= []);
    if (seen.includes(type)) return;
    seen.push(type);
    p.dirty = true;
    send(p.ws, { t: 'chal', a: 'first', type });
  }
  const seen = (p, type) => CHALLENGES[type] && firstTime(p, type); // (for the loop-only types: Head Swap, the Hunt…)

  // The hit landed (after hurt(), the slime still up): the physics edit at this input, as the client predicted it
  function apply(id, p, c, m) {
    const s = p.state, t = now();
    if (c.type === 'snare') {
      s.tr = SNARE_TICKS;
      p.snare = { type: 'snare', seed: seedFor(c.seed, id), len: c.len, mob: m.id, room: s.room, at: t };
    } else if (c.type === 'rhythm') {
      s.tr = RHYTHM_TICKS;
      p.snare = { type: 'rhythm', seed: seedFor(c.seed, id), len: c.len, mob: m.id, room: s.room, at: t };
    } else if (c.type === 'lock') {
      s.tr = SNARE_TICKS;
      c.caught.add(id);
      p.snare = { type: 'lock', seed: c.seed, len: c.len, mob: m.id, room: s.room, at: t, lock: c.seed };
    } else if (c.type === 'rescue') {
      s.tr = TRAP_HOLD;
      p.snare = { type: 'rescue', seed: seedFor(c.seed, id), len: c.len, mob: m.id, room: s.room, at: t, until: t + CAGE_S * 1000 };
      toRoom(s.room)({ t: 'chal', a: 'caged', id, seed: p.snare.seed, len: c.len, ms: CAGE_S * 1000 }); // (everyone else sees its arrows)
    } else if (c.type === 'swap') s.cs = SWAP_TICKS;
    firstTime(p, c.type);
  }

  // {t:'free', s, k, who?}: the arrows entered (run at input s, like an ouch). Your own trap: free at this input; a
  // friend's cage (who): it's opened, if you're standing at it. Wrong: nothing (the client's prediction snaps back)
  function free(id, p, m) {
    if (p.faintUntil) return;
    const t = now();
    if (m.who !== undefined && m.who !== id) {
      const q = inRoom(p.state.room).find(([qid]) => qid === m.who)?.[1];
      if (!q || q.snare?.type !== 'rescue' || !q.state.tr || q.faintUntil || p.state.tr) return;
      if (Math.abs(q.state.x - p.state.x) > RESCUE_R + SLACK || Math.abs(q.state.y - p.state.y) > 130) return;
      if (!sameCombo(m.k, comboFor(q.snare.seed, q.snare.len))) return;
      q.state.tr = 0; // (held, the slime hasn't moved: clearing it on the server's side doesn't jerk its prediction)
      q.snare = null;
      toRoom(p.state.room)({ t: 'chal', a: 'freed', id: m.who, by: id });
      return;
    }
    const sn = p.snare;
    if (!sn || !p.state.tr || sn.type === 'rescue') return;
    if (!sameCombo(m.k, comboFor(sn.seed, sn.len))) return;
    if (sn.type === 'rhythm' && t - sn.at < (sn.len - 1) * RHYTHM_BEAT * 1000 - RHYTHM_SLACK_MS) return; // (faster than the beat allows)
    p.state.tr = 0;
    p.snare = null;
    toRoom(p.state.room)({ t: 'chal', a: 'freed', id });
    if (sn.type === 'lock') lockFreed(sn, id, t);
  }

  // ——— A23: the group key-lock ———
  const lockOf = (sn) => {
    const m = mobById(sn.mob);
    return m && !m.dead ? [m, live(m).find((c) => c.type === 'lock' && c.seed === sn.lock && !c.over)] : [m, null];
  };
  function lockFreed(sn, id, t) {
    const [m, c] = lockOf(sn);
    if (!c) return;
    c.freed.set(id, t);
    lockCheck(m, c);
  }
  // everyone caught is free (or down, or gone): in step? → the barrier breaks; out of step → it holds
  function lockCheck(m, c) {
    const here = new Map(inRoom(m.room));
    const left = [...c.caught].filter((id) => !c.freed.has(id) && here.get(id) && !here.get(id).faintUntil);
    if (left.length || c.over) return;
    c.over = true;
    const times = [...c.freed.values()];
    if (times.length >= CHALLENGES.lock.min && Math.max(...times) - Math.min(...times) <= LOCK_S * 1000) {
      bossEvent(m, 'chal', { type: 'lockDone', ok: 1 });
      lockBroken(m);
    } else bossEvent(m, 'chal', { type: 'lockDone', ok: 0 });
  }
  function lockFailed(sn) {
    const [m, c] = lockOf(sn);
    if (!c) return;
    c.over = true;
    bossEvent(m, 'chal', { type: 'lockDone', ok: 0 });
  }

  // ——— A20: a parry ({t:'ouch', kind:'parry'}): the bash was live and p stood in front of it ———
  function parry(id, p, m) {
    const c = live(m).find((q) => q.type === 'parry' && q.until > now());
    if (!c || p.faintUntil) return;
    const k = MOBS[m.kind], front = (p.state.x - c.x) * c.dir;
    if (front < -SLACK || front > k.w / 2 + BASH_REACH + SLACK) return;
    bossEvent(m, 'chal', { type: 'parried', by: id });
    firstTime(p, 'parry');
    damage(m, Math.round(m.maxHp * PARRY_REFLECT), id, p, c.dir);
    if (!c.parried) {
      c.parried = true;
      stagger(m, PARRY_STAGGER_S);
    }
  }

  // ——— A15: {t:'pf', s, pf}: the platforms sunk for p as its client's clock passed the boss's schedule ———
  let masks = new Map(); // room → what's sunk there now (rebuilt every tick)
  const arenaMask = (room) => masks.get(room) ?? 0;
  function platforms(id, p, m) {
    const pf = (m.pf | 0) & 255;
    if (pf & ~arenaMask(p.state.room)) return; // (only what a boss there has sunk)
    p.state.pf = pf;
  }

  // A boss's hit on p: × SNARE_PUNISH if p failed a trap lately (used up by this hit)
  function punish(p, mob) {
    if (!p.punish || !(MOBS[mob.kind].boss || MOBS[mob.kind].field)) return 1;
    const on = p.punish.until > now();
    p.punish = null;
    return on ? SNARE_PUNISH : 1;
  }

  // Every tick: traps that ran out (failed: the punish waits for the boss's next hit; a cage left shut: knocked out),
  // tethers stretched too far, ledges back up, old challenges dropped
  function tick(players, mobs) {
    const t = now();
    masks = new Map();
    for (const m of mobs) {
      if (!m.ch?.length) continue;
      for (const c of m.ch) {
        if (c.type === 'arena' && c.until > t && !m.dead) masks.set(m.room, (masks.get(m.room) ?? 0) | c.mask);
        if (c.type === 'tether' && c.until > t && t >= c.from && !m.dead) tethers(m, c, players);
        if (c.type === 'lock' && !c.over && t > c.until) {
          if (!c.caught.size) c.over = true; // (it caught nobody)
          else lockCheck(m, c);
        }
      }
      m.ch = m.ch.filter((c) => (c.keep ?? c.until) > t);
    }
    for (const [id, p] of players) {
      if (p.state?.pf && !(arenaMask(p.state.room) & p.state.pf)) p.state.pf = 0; // (its boss gone or the arena over: back up)
      const sn = p.snare;
      if (!sn) continue;
      if (p.faintUntil || !p.joined || p.state.room !== sn.room) { // (knocked out or gone: no punish)
        p.snare = null;
        if (p.joined) p.state.tr = 0;
        if (sn.type === 'lock') lockFailed(sn);
      } else if (sn.type === 'rescue') {
        if (t >= sn.until) {
          p.snare = null;
          p.state.tr = 0;
          toRoom(p.state.room)({ t: 'chal', a: 'crushed', id });
          faint(id, p, MOBS[mobById(sn.mob)?.kind]?.name);
        }
      } else if (!p.state.tr) {
        p.snare = null;
        p.punish = { until: t + PUNISH_KEEP_S * 1000 };
        if (sn.type === 'lock') lockFailed(sn);
      }
    }
  }
  // A18: a pair past TETHER_R snaps (both hurt), or a slime gone or down lets go
  function tethers(m, c, players) {
    c.pairs = c.pairs.filter(([a, b]) => {
      const p = players.get(a), q = b ? players.get(b) : null;
      const ok = (s) => s && s.joined && !s.faintUntil && s.state.room === m.room;
      if (!ok(p) || (b && !ok(q))) return false;
      const qx = q ? q.state.x : m.x, qy = q ? q.state.y : p.state.y;
      if (Math.hypot(p.state.x - qx, p.state.y - qy) <= TETHER_R) return true;
      hurtFlat(a, p, TETHER_HP, m);
      if (q) hurtFlat(b, q, TETHER_HP, m);
      bossEvent(m, 'chal', { type: 'snap', a, b });
      return false;
    });
  }

  // A boss starting over (reset, death): its challenges go
  const clear = (m) => {
    m.ch = [];
  };

  return { start, claim, apply, free, parry, platforms, punish, tick, clear, seen };
}
