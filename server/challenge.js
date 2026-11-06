// Docs: docs/combat/challenges.md
// Boss challenges, the server's side (story/tricky-plan.md): starting them on a boss, judging the claims, ending
// them. A boss's live challenges are `m.ch` ([{ type, seed, len, until }]); a slime's are on the player: `p.snare`
// (the combo it owes: { seed, len, mob, room }) and `p.punish` (a failed snare: the boss's next hit does more).
// Hits are client-decided like every boss hazard (an 'ouch' of kind 'snare' / 'swap', server/rpg.js ouch), and the
// physics edit (`tr`, `cs`: sim.js) is made at that input on both sides. Escaping is {t:'free', s, k}: the arrows the
// client entered, checked against the combo's seed (the order, not the timing).
import { CHALLENGES, SNARE_TICKS, SNARE_WARN, SNARE_LIVE, SNARE_R, SNARE_PUNISH, PUNISH_KEEP_S, snareLen, SWAP_TICKS, SWAP_SPEED, SWAP_R, CLAIM_SLACK_MS, seedFor, comboFor, sameCombo } from '../src/shared/challenge.js';

// deps: now(), MOBS, bossEvent(m, a, extra), send(ws, msg), toRoom(room)(msg), inRoom(room) → [[id, p]]
export function createChallenges({ now, MOBS, bossEvent, send, toRoom, inRoom }) {
  const live = (m) => (m.ch ??= []);
  const newSeed = () => (Math.random() * 4294967296) >>> 0;

  // Start challenge `type` on boss m. opts.at: the slimes it's aimed at ([[id, p]]; default everyone in its room
  // standing). Only built types (CHALLENGES[type].built) and only with enough fighters (`min`).
  function start(m, type, opts = {}) {
    const row = CHALLENGES[type], k = MOBS[m.kind];
    if (!row?.built || m.dead) return false;
    const here = (opts.at ?? inRoom(m.room)).filter(([, q]) => !q.faintUntil);
    if (!here.length || here.length < row.min) return false;
    const t = now(), seed = newSeed();
    if (type === 'snare') {
      // roots under each target, a little apart in time, so a crowd can't all be caught by one jump
      const list = here.map(([, q], i) => [Math.round(q.state.x), +(i * 0.25).toFixed(2)]);
      const len = snareLen(k.lvl);
      const last = list[list.length - 1][1];
      live(m).push({ type, seed, len, until: t + (last + SNARE_WARN + SNARE_LIVE) * 1000 + CLAIM_SLACK_MS });
      bossEvent(m, 'chal', { type, list, warn: SNARE_WARN, dur: SNARE_LIVE, r: SNARE_R, y: m.sp.y, len, seed });
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
    }
    return true;
  }

  // An ouch of a challenge kind from mob m: the live challenge it claims, or null (nothing of that kind going on)
  function claim(m, kind) {
    const t = now();
    return live(m).find((c) => c.type === kind && c.until > t) ?? null;
  }

  // The hit landed (after hurt(), the slime still up): the physics edit at this input, as the client predicted it
  function apply(id, p, c, m) {
    const s = p.state;
    if (c.type === 'snare') {
      s.tr = SNARE_TICKS;
      p.snare = { seed: seedFor(c.seed, id), len: c.len, mob: m.id, room: s.room };
    } else if (c.type === 'swap') s.cs = SWAP_TICKS;
    // G2: one banner line the first time this character meets the type (saved: c.seen)
    const seen = (p.rpg.seen ??= []);
    if (!seen.includes(c.type)) {
      seen.push(c.type);
      p.dirty = true;
      send(p.ws, { t: 'chal', a: 'first', type: c.type });
    }
  }

  // {t:'free', s, k}: the arrows entered (run at input s, like an ouch). Right: free at this input; wrong: nothing
  // (the client's prediction snaps back to trapped)
  function free(id, p, m) {
    if (!p.snare || !p.state.tr || p.faintUntil) return;
    if (!sameCombo(m.k, comboFor(p.snare.seed, p.snare.len))) return;
    p.state.tr = 0;
    p.snare = null;
    toRoom(p.state.room)({ t: 'chal', a: 'freed', id });
  }

  // A boss's hit on p: × SNARE_PUNISH if p failed a snare lately (used up by this hit)
  function punish(p, mob) {
    if (!p.punish || !(MOBS[mob.kind].boss || MOBS[mob.kind].field)) return 1;
    const on = p.punish.until > now();
    p.punish = null;
    return on ? SNARE_PUNISH : 1;
  }

  // Every tick: snares that ran out (failed: the punish waits for the boss's next hit), and old challenges dropped
  function tick(players, mobs) {
    const t = now();
    for (const [, p] of players) {
      if (!p.snare) continue;
      if (p.faintUntil || !p.joined || p.state.room !== p.snare.room) p.snare = null; // (knocked out or gone: no punish)
      else if (!p.state.tr) {
        p.snare = null;
        p.punish = { until: t + PUNISH_KEEP_S * 1000 };
      }
    }
    for (const m of mobs) if (m.ch?.length) m.ch = m.ch.filter((c) => c.until > t);
  }

  // A boss starting over (reset, death): its challenges go
  const clear = (m) => {
    m.ch = [];
  };

  return { start, claim, apply, free, punish, tick, clear };
}
