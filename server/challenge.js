// Docs: docs/combat/challenges.md
// Boss challenges, the server's side (story/tricky-plan.md): starting them on a boss, judging the claims, ending
// them. A boss's live challenges are `m.ch` ([{ type, seed, len, until, … }]); a slime's are on the player: `p.snare`
// (the trap it's in: { type, seed, len, mob, room, at, until? }) and `p.punish` (a failed trap: the boss's next hit does
// more). Hits are client-decided like every boss hazard (an 'ouch' whose kind maps to a type: KIND below), and the
// physics edit (`tr`, `cs`: sim.js) is made at that input on both sides. Escaping is {t:'free', s, k} (your own arrows)
// or {t:'free', s, k, who} (a friend's cage), checked against the trap's seed (the order, not the timing, but for the
// rhythm lock's overall length). Tethers are judged here from positions; the moving arena's ledges ({t:'pf'}) are the
// client's predicted edits, checked against what's sunk; the tilting floor's lean ({t:'pf', s, tl}) likewise. T1b: the
// chip of Brenna's tooth is a server-owned object (picked up with the loot key, thrown with an attack: pick, throw), and
// Rewind snaps everyone back to where they stood ({t:'rw'}, a predicted edit checked against where the server had them)
// while the boss's attacks of those seconds come again (recorded by bossEvent in server/rpg.js: m.rec).
import {
  CHALLENGES, TRAP_HOLD, SNARE_TICKS, SNARE_WARN, SNARE_LIVE, SNARE_R, SNARE_PUNISH, PUNISH_KEEP_S, snareLen, SWAP_TICKS, SWAP_SPEED, SWAP_R, CLAIM_SLACK_MS,
  seedFor, comboFor, sameCombo, RHYTHM_TICKS, RHYTHM_BEAT, RHYTHM_SLACK_MS, rhythmLen, CAGE_WARN, CAGE_R, CAGE_S, RESCUE_R, GAPS_WARN, GAPS_LIVE, GAP_W, GAP_SLIDE,
  ARENA_WARN, ARENA_S, ARENA_SINK, ARENA_GRID_AT, DARK_S, TETHER_S, TETHER_R, TETHER_HP, TETHER_WARN, BASH_WARN, BASH_REACH, BASH_H, PARRY_STAGGER_S, PARRY_REFLECT,
  LOCK_WARN, LOCK_S, LOCK_R, LASER_COLS, LASER_BEAT, LASER_BEATS, LASER_WARN, LATE_WIND, LATE_TELL, LATE_R, TILT_WARN, TILT_S, TILT_EDGE, TILT_HP, TILT_TICK,
  tiltOf, CARRY_S, CARRY_R, CARRY_FAR, THROW_RANGE, CARRY_HIT, CARRY_STAGGER_S, CARRY_BURST_R, CARRY_BURST_HP, REWIND_S, REWIND_SLACK,
  MASH_N, MASH_TICKS, MASH_GAP_MS, RINGS_N, RING_ORBS, RING_GAP, RING_TURN, RING_EVERY, RING_SPEED, RING_R, FLOOD_SEGS, FLOOD_GAP, FLOOD_WARN, FLOOD_HOT,
  FLOOD_PASSES, JOB_N, JOB_S, AIRWEAK_H, AIRWEAK_HIT, AIRWEAK_STAGGER_S, AIRWEAK_S,
} from '../src/shared/challenge.js';
import { roomDef } from '../src/shared/sim.js';

// an ouch's kind → the challenge type it claims (the kinds the client sends: src/rpg.js hazardHits, src/challenge.js)
export const KIND = { snare: 'snare', swap: 'swap', rhythm: 'rhythm', cage: 'rescue', lock: 'lock', gaps: 'gaps', bash: 'parry', mirror: 'mirror', laser: 'grid', late: 'late', mash: 'mash', flood: 'lava' };
const TEACH_AT_START = new Set(['rescue', 'gaps', 'arena', 'dark', 'tether', 'parry', 'lock', 'grid', 'late', 'feint', 'tilt', 'carry', 'rewind', 'rings', 'lava', 'jobs', 'airweak']);
const FLOOR = 450; // (every den's floor: FIELD_GROUND)
const ONE_AT_A_TIME = new Set(['carry', 'tilt', 'rewind']); // (G2's line as it starts, not on a hit)
const SLACK = 60; // px: a rescuer's or a parrier's distance, as the client saw it a moment ago

// deps: now(), MOBS, bossEvent(m, a, extra), send(ws, msg), toRoom(room)(msg), inRoom(room) → [[id, p]], mobById(id),
// faint(id, p, by), hurtFlat(id, p, share, m) (a share of max HP, no knockback), stagger(m, s), damage(m, n, id, p, dir),
// lockBroken(m) (A23 done: the barrier breaks), later(m, ms, fn) (a timed follow-up on the boss), addAdd(m, kind, x) (a
// minion of kind at x: the Hatchkeeper's hatchlings, T2) → the mob
export function createChallenges({ now, MOBS, bossEvent, send, toRoom, inRoom, mobById, faint, hurtFlat, stagger, damage, lockBroken, later, addAdd }) {
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
    if (ONE_AT_A_TIME.has(type) && live(m).some((c) => c.type === type && !c.over && !c.snapped && c.until > now())) return false; // (a chip, a lean, a Rewind: one going at once)
    const t = now(), seed = newSeed(), stage = opts.stage ?? m.stage ?? 0, style = opts.style ?? k.looks?.snare;
    if (type === 'snare' || type === 'rhythm' || type === 'mirror' || type === 'mash') {
      // roots (or fetters, or iron) under each target, a little apart in time, so a crowd can't all be caught by one jump.
      // A4's mirror: the arrows are drawn flipped (flip), the combo the same
      const list = opts.marks ?? here.map(([, q], i) => [Math.round(q.state.x), +(i * 0.25).toFixed(2)]);
      const len = type === 'rhythm' ? rhythmLen(k.lvl) : type === 'mash' ? MASH_N : snareLen(k.lvl);
      const last = Math.max(...list.map((a) => a[1]));
      const flip = type === 'mirror' ? (Math.random() < 0.5 ? 'h' : 'v') : undefined;
      live(m).push({ type, seed, len, until: t + (last + SNARE_WARN + SNARE_LIVE) * 1000 + CLAIM_SLACK_MS });
      bossEvent(m, 'chal', { type, list, warn: SNARE_WARN, dur: SNARE_LIVE, r: SNARE_R, y: m.sp.y, len, seed, style, flip });
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
    } else if (type === 'grid') {
      // A7: the pistons' beams, on and off by the beat. A safe lane two beams wide steps at most one a beat; the rest
      // are on at random (fewer off as the boss's phase climbs)
      const n = LASER_BEATS[Math.min(LASER_BEATS.length - 1, stage)], masks = [];
      let lane = Math.floor(Math.random() * (LASER_COLS - 1));
      for (let b = 0; b < n; b++) {
        if (b) lane = Math.max(0, Math.min(LASER_COLS - 2, lane + Math.floor(Math.random() * 3) - 1));
        let mask = 0;
        for (let c = 0; c < LASER_COLS; c++) if (c !== lane && c !== lane + 1 && Math.random() < 0.6 + 0.1 * stage) mask |= 1 << c;
        masks.push(mask);
      }
      live(m).push({ type, seed, until: t + (LASER_WARN + n * LASER_BEAT) * 1000 + CLAIM_SLACK_MS });
      bossEvent(m, 'chal', { type, masks, beat: LASER_BEAT, warn: LASER_WARN, style: k.looks?.laser ?? 'piston' });
    } else if (type === 'late') {
      // A10: the hands come down where everyone stands now, LATE_WIND from now; their marks show only LATE_TELL first
      const list = here.map(([, q]) => Math.round(q.state.x));
      live(m).push({ type, seed, until: t + (LATE_WIND + 0.4) * 1000 + CLAIM_SLACK_MS });
      bossEvent(m, 'chal', { type, list, wind: LATE_WIND, tell: LATE_TELL, r: LATE_R });
    } else if (type === 'feint') {
      // A11: rearing for a slam and ticking (the brain brings it down: server/rpg.js newMove); this is its warning ring
      live(m).push({ type, seed, until: t + 4000 });
      bossEvent(m, 'chal', { type, r: opts.r ?? 300, beat: opts.beat });
    } else if (type === 'tilt') {
      // A15's cousin: the floor leans one way (downhill: dir) for TILT_S, after TILT_WARN
      const dir = opts.dir ?? (Math.random() < 0.5 ? -1 : 1), tl = tiltOf(dir, stage);
      live(m).push({ type, seed, tl, dir, from: t + TILT_WARN * 1000, until: t + (TILT_WARN + TILT_S) * 1000, tickAt: 0 });
      bossEvent(m, 'chal', { type, tl, dir, warn: TILT_WARN, dur: TILT_S, edge: TILT_EDGE });
    } else if (type === 'carry') {
      // A22: a chip of the tooth, knocked off to one side of her (the side with more room)
      const W = roomDef(m.room).width, far = CARRY_FAR[0] + Math.random() * (CARRY_FAR[1] - CARRY_FAR[0]);
      const side = m.x + far > W - 80 ? -1 : m.x - far < 80 ? 1 : Math.random() < 0.5 ? -1 : 1;
      const x = Math.round(Math.max(80, Math.min(W - 80, m.x + side * far)));
      live(m).push({ type, seed, x, holder: 0, until: t + CARRY_S * 1000, over: false });
      bossEvent(m, 'chal', { type, x, ms: CARRY_S * 1000, seed, style: k.looks?.carry ?? 'tooth' });
    } else if (type === 'rewind') {
      // Rewind: everyone's ghost stays where they stand; REWIND_S later they're snapped back to it and the boss's attacks
      // since come again (its events are recorded meanwhile: m.rec, server/rpg.js bossEvent)
      const anchors = new Map(here.map(([id, q]) => [id, [q.state.x, q.state.y]]));
      live(m).push({ type, seed, anchors, snapAt: t + REWIND_S * 1000, snapped: false, used: new Set(), until: t + REWIND_S * 1000 + CLAIM_SLACK_MS });
      m.rec = { at: t, list: [] };
      bossEvent(m, 'chal', { type, ghosts: here.map(([id, q]) => [id, Math.round(q.state.x), Math.round(q.state.y)]), dur: REWIND_S, seed });
    } else if (type === 'dark') {
      const dur = opts.dur ?? DARK_S; // (the Knotmole's burrow: shorter, and she's no light of her own: noBoss)
      live(m).push({ type, seed, until: t + dur * 1000 });
      bossEvent(m, 'chal', { type, dur, noBoss: opts.noBoss ? 1 : 0 });
    } else if (type === 'rings') {
      // A8: rings of orbs from its chest, a gap in each, turning ring to ring (ordinary shots: the client judges them)
      const n = RINGS_N[Math.min(RINGS_N.length - 1, stage)], y0 = Math.round(m.y - k.h * 0.55), g0 = Math.floor(Math.random() * RING_ORBS), spin = Math.random() < 0.5 ? 1 : -1, shots = [];
      for (let r = 0; r < n; r++) {
        const gap = g0 + spin * r * RING_TURN;
        for (let i = 0; i < RING_ORBS; i++) {
          if ((((i - gap) % RING_ORBS) + RING_ORBS) % RING_ORBS < RING_GAP) continue;
          const a = (i / RING_ORBS) * Math.PI * 2;
          shots.push([Math.round(m.x), y0, Math.round(Math.cos(a) * RING_SPEED), Math.round(Math.sin(a) * RING_SPEED), 0, RING_R, +(0.4 + r * RING_EVERY).toFixed(2)]);
        }
      }
      live(m).push({ type, seed, until: t + (n * RING_EVERY + 4) * 1000 });
      bossEvent(m, 'shots', { style: opts.style ?? k.looks?.rings ?? 'star', shots });
    } else if (type === 'lava') {
      // A12 in a den: the floor floods strip by strip from one end (and back, from its phase 2)
      const dir = Math.random() < 0.5 ? 1 : -1, passes = FLOOD_PASSES[Math.min(FLOOD_PASSES.length - 1, stage)];
      const span = (passes * FLOOD_SEGS - (passes > 1 && stage >= 2 ? FLOOD_SEGS / 2 : 0)) * FLOOD_GAP + FLOOD_WARN + FLOOD_HOT;
      live(m).push({ type, seed, until: t + span * 1000 + CLAIM_SLACK_MS });
      bossEvent(m, 'chal', { type, dir, passes, back: stage >= 2 ? FLOOD_SEGS / 2 : 0, segs: FLOOD_SEGS, gap: FLOOD_GAP, warn: FLOOD_WARN, hot: FLOOD_HOT, style: opts.style ?? k.looks?.flood ?? 'tide' });
    } else if (type === 'jobs') {
      // A14: hatchlings dig out round the boss; any still alive after JOB_S grows into its `grows` kind
      const n = JOB_N[Math.min(JOB_N.length - 1, stage)], W = roomDef(m.room).width, ids = [];
      for (let i = 0; i < n; i++) {
        const x = Math.round(Math.max(100, Math.min(W - 100, m.x + (i % 2 ? 1 : -1) * (160 + 90 * Math.floor(i / 2) + Math.random() * 60))));
        const q = addAdd(m, k.jobAdd ?? k.minion, x);
        if (q) ids.push(q.id);
      }
      if (!ids.length) return false;
      live(m).push({ type, seed, ids, growAt: t + JOB_S * 1000, until: t + JOB_S * 1000 + 500, grown: false });
      bossEvent(m, 'chal', { type, ids, ms: JOB_S * 1000 });
    } else if (type === 'airweak') {
      // A21: its weak spot opens up high for dur (the brain: the leap's time in the air)
      live(m).push({ type, seed, until: t + (opts.dur ?? AIRWEAK_S) * 1000, used: false });
      bossEvent(m, 'chal', { type, dur: opts.dur ?? AIRWEAK_S, h: AIRWEAK_H });
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
    if (c.type === 'snare' || c.type === 'mirror') {
      s.tr = SNARE_TICKS;
      p.snare = { type: c.type, seed: seedFor(c.seed, id), len: c.len, mob: m.id, room: s.room, at: t };
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
    } else if (c.type === 'mash') {
      s.tr = MASH_TICKS;
      p.snare = { type: 'mash', seed: c.seed, len: c.len, mob: m.id, room: s.room, at: t };
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
    if (sn.type === 'mash') { // (A2: the count, and not faster than a quick thumb)
      if (!((m.k | 0) >= sn.len) || t - sn.at < sn.len * MASH_GAP_MS) return;
    } else if (!sameCombo(m.k, comboFor(sn.seed, sn.len))) return;
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
  let masks = new Map(), tilts = new Map(); // room → what's sunk there now; room → the floor's lean there now (rebuilt every tick)
  const arenaMask = (room) => masks.get(room) ?? 0;
  function platforms(id, p, m) {
    if (m.tl !== undefined) { // (the tilting floor: only the lean a boss there has going, or level)
      const tl = m.tl | 0;
      if (!tl || tl === tilts.get(p.state.room)) p.state.tl = tl;
    }
    if (m.pf === undefined) return;
    const pf = (m.pf | 0) & 255;
    if (pf & ~arenaMask(p.state.room)) return; // (only what a boss there has sunk)
    p.state.pf = pf;
  }

  // ——— A22: the chip of the tooth ———
  // the loot key near a chip lying in p's room: p carries it → true (the loot itself waits)
  function pick(id, p) {
    if (p.faintUntil || p.state.tr) return false;
    for (const [m, c] of carries(p.state.room)) {
      if (c.holder || c.over || Math.abs(c.x - p.state.x) > CARRY_R + SLACK || p.state.y < FLOOR - 140) continue;
      c.holder = id;
      bossEvent(m, 'chal', { type: 'carried', by: id });
      return true;
    }
    return false;
  }
  // {t:'carry', a:'throw', dir}: thrown along dir. Her body within THROW_RANGE that way: it strikes her (from behind,
  // the strap: twice); else it lands short and lies there again
  function toss(id, p, msg) {
    const dir = Math.sign(msg.dir) || p.state.facing || 1;
    for (const [m, c] of carries(p.state.room)) {
      if (c.holder !== id) continue;
      const k = MOBS[m.kind], x = p.state.x, gap = (m.x - x) * dir - k.w / 2;
      if (!m.dead && gap <= THROW_RANGE && (m.x - x) * dir > -k.w / 2) {
        const back = (x - m.x) * m.dir < 0; // (thrown from behind her: the buckle where the straps cross)
        c.over = true;
        c.holder = 0;
        bossEvent(m, 'chal', { type: 'thrown', by: id, x0: Math.round(x), x1: Math.round(m.x), hit: 1, back: back ? 1 : 0 });
        firstTime(p, 'carry');
        damage(m, Math.round(m.maxHp * CARRY_HIT * (back ? 2 : 1)), id, p, dir);
        stagger(m, CARRY_STAGGER_S * (back ? 2 : 1));
      } else {
        const W = roomDef(m.room).width;
        c.x = Math.round(Math.max(80, Math.min(W - 80, x + dir * THROW_RANGE * 0.6)));
        c.holder = 0;
        bossEvent(m, 'chal', { type: 'thrown', by: id, x0: Math.round(x), x1: c.x, hit: 0 });
      }
      return;
    }
  }
  // every chip lying (or carried) in a room: [[boss, its record]]
  function carries(room) {
    const out = [];
    for (const m of bossesIn(room)) for (const c of live(m)) if (c.type === 'carry' && !c.over) out.push([m, c]);
    return out;
  }
  let lastMobs = [];
  const bossesIn = (room) => lastMobs.filter((m) => m.room === room && m.ch?.length);

  // ——— A21: a hit on boss m from p (server/rpg.js applyHits): from high up while its weak spot is open, the bark cracks ———
  function hitLanded(m, id, p) {
    if (!m.ch?.length || m.dead) return;
    const c = live(m).find((q) => q.type === 'airweak' && !q.used && q.until > now());
    if (!c || p.state.y > FLOOR - AIRWEAK_H) return;
    c.used = true;
    bossEvent(m, 'chal', { type: 'airHit', by: id });
    firstTime(p, 'airweak');
    damage(m, Math.round(m.maxHp * AIRWEAK_HIT), id, p, Math.sign(m.x - p.state.x) || 1);
    stagger(m, AIRWEAK_STAGGER_S);
  }

  // ——— Rewind: {t:'rw', s, x, y}: snapped back to your ghost at this input (as your client predicted it) ———
  function rewind(id, p, msg) {
    if (p.faintUntil) return;
    for (const m of bossesIn(p.state.room)) {
      const c = live(m).find((q) => q.type === 'rewind' && q.snapped && q.until > now() && q.anchors.has(id) && !q.used.has(id));
      if (!c) continue;
      const [ax, ay] = c.anchors.get(id), x = +msg.x, y = +msg.y;
      if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x - ax) > REWIND_SLACK || Math.abs(y - ay) > REWIND_SLACK) return;
      c.used.add(id);
      Object.assign(p.state, { x, y, vx: 0, vy: 0, dt: 0, hk: 0, sl: false });
      return;
    }
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
    tilts = new Map();
    lastMobs = mobs;
    for (const m of mobs) {
      if (!m.ch?.length) continue;
      for (const c of m.ch) {
        if (c.type === 'arena' && c.until > t && !m.dead) masks.set(m.room, (masks.get(m.room) ?? 0) | c.mask);
        if (c.type === 'tilt' && c.until > t && !m.dead) {
          if (t >= c.from - 500) tilts.set(m.room, c.tl); // (a client a little ahead of the server leans a moment early)
          if (t >= c.from && t >= c.tickAt) grind(m, c, players, t);
        }
        if (c.type === 'carry' && !c.over) carryTick(m, c, players, t);
        if (c.type === 'jobs' && !c.grown && t >= c.growAt) grow(m, c);
        if (c.type === 'rewind' && !c.snapped && t >= c.snapAt) snap(m, c);
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
      if (p.state?.tl && tilts.get(p.state.room) !== p.state.tl) p.state.tl = 0; // (the floor's level again)
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
  // the tilting floor: the hoist's chain grinds anyone on the floor at the low end
  function grind(m, c, players, t) {
    c.tickAt = t + TILT_TICK * 1000;
    const W = roomDef(m.room).width;
    for (const [id, p] of players) {
      const s = p.state;
      if (!p.joined || p.faintUntil || s.room !== m.room || s.y < FLOOR - 6) continue;
      if (c.dir < 0 ? s.x < TILT_EDGE : s.x > W - TILT_EDGE) hurtFlat(id, p, TILT_HP, m);
    }
  }
  // A22: the one carrying it went down or away (it drops where they were), or its time ran out (it bursts)
  function carryTick(m, c, players, t) {
    const h = c.holder ? players.get(c.holder) : null;
    if (c.holder && (!h || !h.joined || h.faintUntil || h.state.room !== m.room)) {
      if (h?.joined && h.state.room === m.room) c.x = Math.round(h.state.x);
      c.holder = 0;
      bossEvent(m, 'chal', { type: 'dropped', x: c.x });
    }
    if (t < c.until && !m.dead) return;
    c.over = true;
    const x = h && c.holder ? h.state.x : c.x;
    bossEvent(m, 'chal', { type: 'carryBurst', x: Math.round(x) });
    if (m.dead) return;
    for (const [id, p] of players) {
      if (p.joined && !p.faintUntil && p.state.room === m.room && Math.abs(p.state.x - x) <= CARRY_BURST_R && p.state.y > FLOOR - 200) hurtFlat(id, p, CARRY_BURST_HP, m);
    }
  }
  // A14: the hatchlings still alive grow into the boss's `grows` kind where they stand
  function grow(m, c) {
    c.grown = true;
    const k = MOBS[m.kind], grown = [];
    for (const id of c.ids) {
      const q = mobById(id);
      if (!q || q.dead || m.dead || !k.grows) continue; // (a boss with nothing to grow into, the sandbox's: they stay as they are)
      q.dead = q.gone = true;
      const g = addAdd(m, k.grows, Math.round(q.x));
      if (g) grown.push(g.id);
    }
    if (grown.length) bossEvent(m, 'chal', { type: 'grow', ids: grown });
  }
  // Rewind's moment: everyone's told (each client snaps itself back: {t:'rw'}), and the recorded attacks come again
  function snap(m, c) {
    c.snapped = true;
    const rec = m.rec;
    m.rec = null;
    if (m.dead) return;
    bossEvent(m, 'chal', { type: 'rewindGo' });
    for (const [dt, a, extra] of rec?.list ?? []) later(m, Math.max(0, dt), () => !m.dead && bossEvent(m, a, { ...extra, replay: 1 }));
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
    m.rec = null;
  };

  return { start, claim, apply, free, parry, platforms, punish, tick, clear, seen, pick, toss, rewind, hitLanded, firstTime };
}
