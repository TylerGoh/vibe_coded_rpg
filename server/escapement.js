// Docs: docs/places/escapement.md, docs/combat/bosses.md
// The Escapement's brain (the Citadel's C6 (c), story/c6-plan.md), the final-boss engine's 'catch' brain (server/final.js
// picks it from FINAL.escapement.brain): the same four written loops, enrage and S5 hookup as the other final bosses', with
// its own mechanics: the Beat (the pendulum swinging across the den on a fixed period, its low band hurting whoever's on
// the floor under it; wider every loop of phase 3, stopped in phase 4), the Tick (both pallets struck within one tick: a
// stagger and an open window, hold()), the pawls jamming the pallets (son(): their brain), the Stopping in phase 4 (still
// on the beat: the rhythm lock), Rewound and the Drop, and three ultimates. Constants: src/shared/escapement.js.
// → the room: {t:'final', fb:'escapement', id, ph, enr, po: its pose, bp: the beat's phase now (0..1), bs: the beat's period
// (s), ba: the bob's amplitude (px), sw: phase 3's swing steps, hl: the haul (0 none, ±1 the bob held up at that end, 2
// stopped in the middle), pl: [[jammed 0|1, struck ms ago (-1 never), jamming %]] (the two pallets), op: ms of the Tick's
// open window left, tk: Ticks made}
import { FINAL, finalPhase, FINAL_ENRAGE_MIN, FINAL_ULT_WARN, FINAL_GAP_S, FIN_W, FIN_FLOOR, headReach } from '../src/shared/final.js';
import {
  ESC_MID, BEAT_S, BEAT_RAGE, SWING_STEPS, ampOf, bobX, beatHits, BEAT_HP, BEAT_HIT_CD, PALLETS, TICK_WINDOW, TICK_STAGGER_S, TICK_OPEN_S, TICK_OPEN_MULT, TICK_CD,
  PAWLS_EVERY, PAWLS_BASE, PAWLS_PER_TICK, JAM_S, STOP_CD, STILL_V, COUNT_S, STRIKE_WARN, STRIKE_R, STRIKE_LATE, STRIKE_REST, SNARE_OFF, TEETH_N, TEETH_GAP, TEETH_WARN,
  REWOUND_S, REWOUND_WEAK, DROP_HP, ENRAGE_TOCK_S, COUNTER_SPEED, palletSpot,
} from '../src/shared/escapement.js';
import { SNARE_R } from '../src/shared/challenge.js';

const ENRAGE_MS = (Number(process.env.TEST_ENRAGE_MIN) || FINAL_ENRAGE_MIN) * 60_000; // (tests only: sooner)
const SLACK = 60;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clampX = (x) => Math.max(60, Math.min(FIN_W - 60, x));
const PAWL = 'catch_pawl'; // (its pawls' kind)

// d: what it needs from server/rpg.js's closure (all lazy, called at tick time)
export function createCatch(d) {
  const { now } = d;

  function init() {
    return {
      ph: 0, loop: 0, step: 0, at: 0, gap: true, start: 0, enrAt: 0, enr: false, sentAt: 0, dirty: true, ultN: 0, nextUlt: 0,
      pulseSeen: 0, shieldAlt: 0, tockAt: 0, pose: 'hold', rew: null,
      // the Beat: its phase (0..1) carried as the period changes, the amplitude eased toward its steps
      bp: 0, bpAt: 0, amp: ampOf(0), swing: 0, haul: 0, hit: new Map(),
      pal: PALLETS.map(() => ({ jam: 0, struck: 0 })), openUntil: 0, cdUntil: 0, ticks: 0, pawlAt: 0, stopAt: 0, stopped: new Map(),
    };
  }
  const period = (f) => BEAT_S * (f.enr ? BEAT_RAGE : 1);
  // → the room
  function send(m) {
    const f = m.fin, t = now();
    f.sentAt = t;
    f.dirty = false;
    const jams = jamming(m);
    d.toRoom(m.room)({
      t: 'final', fb: 'escapement', id: m.id, ph: f.ph, enr: f.enr ? 1 : 0, po: f.pose, bp: +f.bp.toFixed(4), bs: period(f), ba: Math.round(f.amp), sw: f.swing, hl: f.haul,
      pl: f.pal.map((p, i) => [p.jam ? 1 : 0, p.struck ? Math.round(t - p.struck) : -1, Math.round((jams[i] ?? 0) * 100)]),
      op: f.openUntil > t ? Math.round(f.openUntil - t) : 0, tk: f.ticks,
    });
  }
  const pose = (f, p) => {
    if (f.pose !== p) [f.pose, f.dirty] = [p, true];
  };
  // the Tick's open window: every hit on its body does more (server/rpg.js applyHits, as the Wickmother's Hold does less)
  const hold = (m) => (m.fin && m.fin.openUntil > now() ? TICK_OPEN_MULT : 1);
  // can pallet slot be struck now? (not jammed, not in the window or its cooldown, never once enraged or freed)
  const strikeable = (m, slot) => {
    const f = m.fin;
    return !!f && !f.enr && !m.dead && slot >= 0 && slot < f.pal.length && !f.pal[slot].jam && now() >= f.cdUntil;
  };
  // how far each pawl at a pallet has got jamming it (0..1)
  function jamming(m) {
    const out = [0, 0], t = now();
    for (const q of d.mobsIn?.(m.room) ?? []) if (q.kind === PAWL && !q.dead && q.jam) out[q.jam.i] = Math.max(out[q.jam.i], Math.min(1, (t - q.jam.at) / (JAM_S * 1000)));
    return out;
  }
  function enterPhase(m, k, ph, t) {
    const f = m.fin;
    f.ph = ph;
    f.loop = f.step = 0;
    m.stage = Math.min(2, ph);
    f.nextUlt = Math.max(f.nextUlt, t + 8000);
    if (ph >= 1 && !f.pawlAt) f.pawlAt = t + PAWLS_EVERY * 400;
    if (ph === 2) f.swing = 1; // (the pendulum swings wider)
    if (ph === 3) {
      // the Stopped Hour: the pendulum stops high in the middle, and the den stops on the beat
      f.swing = 0;
      f.haul = 2;
      f.stopAt = t + period(f) * 1000;
      d.bossEvent(m, 'stopping');
    }
    f.dirty = true;
    d.bossEvent(m, 'phase', { n: ph + 1 });
    d.bossSays(m, k.lines?.phase?.[ph - 1]);
  }
  function enrage(m, t) {
    const f = m.fin;
    f.enr = true;
    m.enraged = true;
    f.tockAt = t + ENRAGE_TOCK_S * 1000;
    f.openUntil = 0;
    f.dirty = true;
    d.bossEvent(m, 'finalRage');
  }
  // phase 3's swing a step wider (+1: a loop came round) or back (-1: a Tick)
  function swingStep(m, n) {
    const f = m.fin;
    if (f.ph !== 2 || f.enr) return;
    const was = f.swing;
    f.swing = Math.max(0, Math.min(SWING_STEPS, f.swing + n));
    if (f.swing !== was) {
      f.dirty = true;
      d.bossEvent(m, 'swingStep', { n: f.swing, dir: Math.sign(f.swing - was) });
    }
  }
  const watched = (m) => (m.focus && m.focus.until > now() ? m.focus.p : null);
  const fighters = (m, here) => here.filter(([, q]) => !q.faintUntil);
  const seenBy = (list, type) => {
    for (const [, q] of list) d.chalSeen(q, type);
  };

  // Pallet Strike at q: the pallet on q's side swings down and slams the floor at the mark → how long it takes. Some land
  // a tick late (the creak comes, nothing; then it falls).
  function strike(m, q, list, t) {
    const f = m.fin, tx = Math.round(clampX(q.state.x)), side = tx < ESC_MID ? -1 : 1, warn = STRIKE_WARN[f.ph];
    const late = Math.random() < STRIKE_LATE[f.ph] && !f.enr, extra = late ? period(f) / 2 : 0;
    pose(f, side < 0 ? 'strikeW' : 'strikeE');
    d.bossEvent(m, 'strike', { tx, side, dur: warn, r: STRIKE_R });
    if (late) {
      seenBy(list, 'late');
      d.later(m, warn * 1000, () => !m.dead && d.bossEvent(m, 'strikeLate', { tx, dur: extra }));
    }
    d.later(m, (warn + extra) * 1000, () => {
      if (m.dead) return;
      pose(f, side < 0 ? 'downW' : 'downE');
      d.bossEvent(m, 'strikeHit', { tx, side, r: STRIKE_R });
      // its chain: a snare either side of where it landed (a slime that dodged by a hair is caught)
      const marks = [-1, 1].map((s) => tx + s * (STRIKE_R + SNARE_R + SNARE_OFF)).filter((x) => x > 60 && x < FIN_W - 60).map((x) => [Math.round(x), 0]);
      if (marks.length && Math.random() < 0.55) d.challenge(m, 'snare', { marks });
      d.later(m, STRIKE_REST * 1000, () => !m.dead && (f.pose === 'downW' || f.pose === 'downE') && pose(f, idle(f)));
    });
    return warn + extra + STRIKE_REST + 0.4;
  }

  // one move of the loop → how long it takes (s)
  function move(m, k, here, name, t) {
    const f = m.fin, ph = f.ph, w = watched(m), list = fighters(m, here);
    const aim = w ?? m.target ?? (list.length ? pick(list)[1] : null);
    if (name === 'count') {
      if (!list.length) return 0.5;
      if (!(m.tauntUntil > t && m.focus)) { // (a Knight's taunt holds it)
        const others = list.filter(([, q]) => q !== m.focusLast);
        const [id, p] = pick(others.length ? others : list);
        m.focus = { p, id, until: t + COUNT_S * 1000 };
        m.focusLast = p;
        d.sendParty(m);
      }
      pose(f, 'count');
      d.bossEvent(m, 'watch', { to: m.focus.id });
      return 1.4;
    }
    if (name === 'strike') return aim ? strike(m, aim, list, t) : 0.3;
    if (name === 'tock') {
      pose(f, 'tock');
      m.pulseAt = t; // (partyTick warns and lands it: the pulse, looks.pulse 'tock')
      return d.PULSE_WARN + 0.8;
    }
    if (name === 'locked' || name === 'brake' || name === 'both' || name === 'shield') {
      const kind = name === 'locked' ? 'armour' : name === 'brake' ? 'barrier' : name === 'both' ? 'both' : (f.shieldAlt++ % 2 ? 'barrier' : 'armour');
      pose(f, kind === 'barrier' ? 'brake' : 'locked');
      if (!m.shield) d.shieldUp(m, k, kind, t);
      return 1.6;
    }
    if (name === 'teeth') {
      if (!aim) return 0.3;
      // the Wheel's teeth drive down in a line toward the counted slime, three to a tick, and one right on it
      const dir = Math.sign(aim.state.x - ESC_MID) || (Math.random() < 0.5 ? -1 : 1), x0 = Math.round(clampX(aim.state.x - dir * TEETH_GAP * (TEETH_N - 1)));
      const xs = [];
      for (let i = 0; i < TEETH_N; i++) xs.push(Math.round(clampX(x0 + dir * i * TEETH_GAP)));
      xs.push(Math.round(clampX(aim.state.x)));
      const groups = [xs.slice(0, 3), xs.slice(3)], gapMs = (period(f) / 2) * 1000;
      pose(f, 'teeth');
      groups.forEach((marks, g) => d.later(m, g * gapMs, () => {
        if (m.dead) return;
        d.bossEvent(m, 'rain', { marks, dur: TEETH_WARN, style: 'teeth' });
        d.later(m, TEETH_WARN * 1000, () => !m.dead && d.bossEvent(m, 'rainHit', { marks, style: 'teeth' }));
      }));
      return TEETH_WARN + gapMs / 1000 + 0.8;
    }
    if (name === 'rewound') {
      // the bob drawn all the way up and back, the arbor open: the shard is the weak point
      pose(f, 'rewound');
      f.haul = aim && aim.state.x < ESC_MID ? 1 : -1; // (hauled up away from the counted slime)
      f.rew = { until: t + REWOUND_S * 1000 };
      m.weak = { at: t, until: f.rew.until, fill: 0, max: Math.max(1, Math.round(k.hp * d.TEST_BOSS_HP * d.weakHpOf(k) * REWOUND_WEAK)), gaze: true };
      f.rew.w = m.weak;
      f.dirty = true;
      d.bossEvent(m, 'rewound', { dur: REWOUND_S, side: f.haul });
      d.bossEvent(m, 'weakOpen');
      d.sendParty(m);
      return REWOUND_S + 1;
    }
    // ——— its challenges (docs/combat/challenges.md) ———
    if (name === 'late') {
      pose(f, 'count');
      return d.challenge(m, 'late', { stage: ph }) ? 2.4 : 0.2;
    }
    if (name === 'tether') {
      pose(f, 'teeth');
      return d.challenge(m, 'tether', { stage: ph }) ? 1.4 : 0.2;
    }
    if (name === 'rings') {
      pose(f, 'tock');
      return d.challenge(m, 'rings', { stage: ph }) ? 3.2 : 0.2;
    }
    if (name === 'rescue') {
      pose(f, 'count');
      return d.challenge(m, 'rescue', { stage: ph }) ? 1.6 : 0.2;
    }
    if (name === 'swap') {
      pose(f, 'tock');
      return d.challenge(m, 'swap', { stage: ph }) ? 1.6 : 0.2;
    }
    if (name === 'ult') return ult(m, k, t);
    return 0.2;
  }
  // an ultimate: Hold (phases 1–2; by turns with Counter-Swing in phase 3), Counter-Swing, The Stopped Hour (by turns with
  // Counter-Swing in phase 4). u.side: the end it hauls the bob up to (Hold, Counter-Swing); u.dir: the way it swings
  function ult(m, k, t) {
    const f = m.fin, row = FINAL.escapement;
    const pin = m.forceUlt; // (the sandbox's Ultimate now: that one)
    m.forceUlt = null;
    const turn = f.ultN++ % 2;
    const which = (pin != null && row.ults[pin]) || (f.ph < 2 ? row.ults[0] : f.ph === 2 ? row.ults[turn] : row.ults[turn ? 2 : 1]);
    const u = { ...which, dur: FINAL_ULT_WARN };
    if (u.kind === 'hold' || u.kind === 'counter') {
      u.side = Math.random() < 0.5 ? 1 : -1;
      f.haul = u.side;
    }
    if (u.kind === 'counter') {
      u.dir = -u.side; // (it swings away from the end it was hauled to)
      u.x0 = Math.round(ESC_MID + u.side * (FIN_W / 2));
      u.speed = COUNTER_SPEED;
    }
    if (u.kind === 'stopped') f.haul = 2;
    pose(f, u.kind === 'stopped' ? 'stopped' : 'haul');
    m.act = 'ult';
    m.phase = 'warn';
    f.nextUlt = t + (row.ultEvery[f.ph] || 60) * 1000;
    f.dirty = true;
    d.startUlt(m, k, t, u);
    return 99; // (ends when the ultimate does: tick watches m.act)
  }

  // the Beat: the bob's phase moves on (the period quickens once enraged), and whoever's on the floor under it is hit
  function beat(m, here, dt, t) {
    const f = m.fin, list = fighters(m, here);
    f.bp = (f.bp + dt / period(f)) % 1;
    const want = ampOf(f.ph === 2 ? f.swing : 0);
    if (Math.abs(want - f.amp) > 0.5) f.amp += Math.sign(want - f.amp) * Math.min(Math.abs(want - f.amp), 60 * dt);
    if (f.haul || m.dead) return;
    const bx = bobX(f.bp, f.amp);
    for (const [qid, q] of list) {
      if (q.state.room !== m.room || !beatHits(bx, f.amp, q.state.x, q.state.y, q.state.onPlat)) continue;
      if (t - (f.hit.get(qid) ?? 0) < BEAT_HIT_CD * 1000) continue;
      f.hit.set(qid, t);
      d.hurt(qid, q, d.stats(q).maxHp * BEAT_HP, q.state.x, undefined, 0, false, m, 'dot');
    }
  }
  // the room's own clocks: the pawls, the jams coming free, the Tick's window closing, the Stopping
  function room(m, k, here, dt, t) {
    const f = m.fin, list = fighters(m, here);
    // a pawl killed: its pallet comes free
    for (const [i, p] of f.pal.entries()) {
      if (p.jam && !d.alive(p.jam)) {
        p.jam = 0;
        f.dirty = true;
        d.bossEvent(m, 'unjam', { i });
      }
    }
    // the pawls: down out of the teeth, more the more Ticks the party has made
    if (f.ph >= 1 && f.pawlAt && t >= f.pawlAt && m.act !== 'ult' && !f.enr) {
      f.pawlAt = t + PAWLS_EVERY * 1000;
      const n = Math.min(PAWLS_BASE + Math.floor(f.ticks / PAWLS_PER_TICK), d.addsCap(m) - d.minionsOf(m, PAWL));
      for (let j = 0; j < n; j++) {
        const x = Math.round(clampX(ESC_MID + (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 260)));
        if (d.addAdd(m, PAWL, x)) d.bossEvent(m, 'pawls', { px: x });
      }
    }
    if (f.openUntil && t >= f.openUntil) {
      f.openUntil = 0;
      f.dirty = true;
      d.bossEvent(m, 'bite');
    }
    // phase 4: the Stopping. On every beat (every tick once enraged) whoever's standing still is stopped
    if (f.ph >= 3 && f.stopAt && t >= f.stopAt) {
      f.stopAt = t + period(f) * (f.enr ? 0.5 : 1) * 1000;
      const still = list.filter(([qid, q]) => q.state.room === m.room && !q.state.tr && q.state.grounded && Math.abs(q.state.vx) < STILL_V && t - (f.stopped.get(qid) ?? 0) >= (f.enr ? 0 : STOP_CD * 1000));
      d.bossEvent(m, 'tickBeat');
      if (still.length && m.act !== 'ult') {
        for (const [qid] of still) f.stopped.set(qid, t);
        d.challenge(m, 'rhythm', { at: still, marks: still.map(([, q]) => [Math.round(q.state.x), 0]) });
      }
    }
  }

  // every tick for a final boss (instead of bossBrain) → how fast it walks (it never does: it hangs off the hub)
  function tick(m, k, here, dt, t) {
    const f = (m.fin ??= init()), row = FINAL[k.final];
    if (!f.start) {
      f.start = t;
      f.enrAt = t + (m.enrLeft ?? ENRAGE_MS); // (m.enrLeft: its enrage clock from before a restart, server/rpg.js restoreBosses)
      m.enrLeft = undefined;
      f.pulseSeen = m.pulseN | 0;
      f.at = t + 3000; // (the title card's up; the pendulum's already swinging)
      m.x = ESC_MID;
    }
    m.x = ESC_MID;
    m.vx = 0;
    const ph = finalPhase(row, m.hp / m.maxHp);
    if (ph > f.ph) enterPhase(m, k, ph, t);
    if (!f.enr && t >= f.enrAt) enrage(m, t);
    if (!m.ultArmed && m.hp / m.maxHp < d.ULT_FIRST) [m.ultArmed, f.nextUlt] = [true, Math.max(f.nextUlt, t + 3000)];
    if ((m.pulseN | 0) !== f.pulseSeen) f.pulseSeen = m.pulseN | 0;
    // Rewound: the shard filled (the weak point gone before its time: the long stagger, the bob let down gently), or the Drop
    if (f.rew) {
      if (t >= f.rew.until) {
        f.rew = null;
        if (m.weak?.gaze) [m.weak, m.partyDirty] = [null, true];
        f.haul = f.ph >= 3 ? 2 : 0;
        pose(f, 'drop');
        d.bossEvent(m, 'drop');
        for (const [qid, q] of fighters(m, here)) if (q.state.room === m.room && !q.state.onPlat) d.hurt(qid, q, d.stats(q).maxHp * DROP_HP, q.state.x, undefined, 0, false, m, 'dot');
        f.dirty = true;
      } else if (m.weak !== f.rew.w) {
        f.rew = null;
        f.haul = f.ph >= 3 ? 2 : 0;
        pose(f, 'stag');
        d.bossEvent(m, 'rewoundBroken');
        f.dirty = true;
        if (!f.gap) f.at = Math.min(f.at, t);
      }
    }
    if (f.enr && t >= f.tockAt && !m.pulseHit && m.act !== 'ult') {
      f.tockAt = t + ENRAGE_TOCK_S * 1000;
      m.pulseAt = t; // (twice as often as the loop's own)
    }
    beat(m, here, dt, t);
    room(m, k, here, dt, t);
    if (f.dirty && t - f.sentAt > 120) send(m);
    else if (t - f.sentAt > 1000) send(m);
    // the loop
    if (m.act === 'ult') {
      m.timer -= dt;
      if (m.phase === 'warn' && m.timer <= 0) {
        m.phase = 'act';
        d.ultGoesOff(m, k, t);
        if (m.ult?.kind === 'counter') f.haul = 0; // (let go: it swings)
        f.dirty = true;
      } else if (m.phase === 'act' && m.timer <= 0) {
        [m.act, m.ult, m.phase, f.gap, f.at] = [null, null, 'walk', true, t + FINAL_GAP_S[f.ph] * 1000];
        f.haul = f.ph >= 3 ? 2 : 0;
        f.dirty = true;
        pose(f, idle(f));
      }
      return 0;
    }
    if (!f.gap && f.at === Infinity) { // (an ultimate was interrupted: interruptUlt dropped it)
      [f.gap, f.at] = [true, t + 1000];
      f.haul = f.ph >= 3 ? 2 : 0;
      f.dirty = true;
      pose(f, 'stag');
    }
    if (m.staggerUntil > t) {
      pose(f, 'stag');
      return 0;
    }
    if (t < f.at) return 0;
    if (!f.gap) {
      // the move's time is up: its opening
      m.phase = 'walk';
      m.act = null;
      f.gap = true;
      f.at = t + FINAL_GAP_S[f.ph] * (f.enr ? 0.7 : 1) * 1000;
      if (!['downW', 'downE'].includes(f.pose)) pose(f, idle(f));
      return 0;
    }
    if (!fighters(m, here).length) return 0;
    // the next move: an ultimate due (phases 1–3), else the loop's next step
    let name;
    if ((f.ph < 3 || m.forceUlt != null) && m.ultArmed && t >= f.nextUlt) name = 'ult';
    else {
      const loop = row.loops[f.ph];
      name = loop[f.step % loop.length];
      if (++f.step % loop.length === 0) {
        f.loop++;
        swingStep(m, 1); // (phase 3: every loop the swing widens a step)
      }
      const [base, every] = name.split(':');
      if (every && f.loop % Number(every) !== 0) name = null;
      else name = base;
    }
    if (!name) return 0;
    f.gap = false;
    m.phase = 'act';
    m.act = name;
    const s = move(m, k, here, name, t);
    f.at = name === 'ult' ? Infinity : t + s * 1000;
    return 0;
  }
  const idle = (f) => (f.ph >= 3 ? 'stopped' : 'hold');

  // ——— hits ———
  // what a hit from p with flag code (h[4]: 1 the shard, 2 + slot a pallet) can be on → { weak } | { prop: slot } | 'body' |
  // null. Arrows and spells reach a pallet at any height; anything else needs the body near its height (a jump, a ledge).
  function part(m, p, code, arrow, range, magic = false) {
    const f = m.fin, k = d.MOBS[m.kind], x = p.state.x, y = p.state.y;
    if (f && code === 1 && m.weak) {
      const s = d.weakOf(k, m.x, m.y, m.dir);
      if (headReach(s, x, y, range, arrow, SLACK)) return { weak: true };
    }
    if (f && code >= 2 && strikeable(m, code - 2) && headReach(palletSpot(code - 2), x, y, range, arrow || magic, SLACK)) return { prop: code - 2 };
    return Math.abs(m.x - x) <= range + k.w / 2 + SLACK ? 'body' : null;
  }
  // a hit landed on a pallet (part()'s { prop }): struck. Both struck within one tick: the Tick
  function hitHead(m, pt, dmg, id) {
    const f = m.fin, i = pt.prop, t = now();
    if (!f || i === undefined || !strikeable(m, i)) return;
    const was = f.pal[i].struck;
    f.pal[i].struck = t;
    f.dirty = true;
    if (t - was > 300) d.bossEvent(m, 'struck', { i, who: id });
    const other = f.pal[1 - i];
    if (other.struck && t - other.struck <= TICK_WINDOW * 1000) {
      // one tooth let go: a stagger and an open window; phase 3's swing back a step
      for (const p of f.pal) p.struck = 0;
      f.ticks++;
      f.openUntil = t + TICK_OPEN_S * 1000;
      f.cdUntil = f.openUntil + TICK_CD * 1000;
      d.stagger(m, TICK_STAGGER_S);
      swingStep(m, -1);
      d.bossEvent(m, 'tick', { n: f.ticks, dur: TICK_OPEN_S, who: id });
    }
  }

  // its pawls (stepMob runs this for a mob with `son: 'pawl'`) → how fast it walks: to the nearest pallet that isn't
  // jammed (no other pawl after it if it can help it), then it sits there jamming it for JAM_S unless something stops it
  function son(m, k, here, dt, t) {
    const b = d.mobById(m.by), f = b?.fin;
    if (!f || b.dead) return 0;
    if (m.jam) {
      const at = m.jam.at, stopped = m.frozenUntil > at || m.stunUntil > at || m.snareUntil > at || (m.knockAt ?? 0) > at;
      const p = f.pal[m.jam.i];
      if (stopped || Math.abs(m.x - PALLETS[m.jam.i].x) > 40) {
        if (stopped && !p.jam) d.bossEvent(b, 'jamStopped', { i: m.jam.i });
        if (p.jam === m.id) [p.jam, f.dirty] = [0, true];
        m.jam = null;
        m.restUntil = t + 1200;
        return 0;
      }
      if (!p.jam && t >= m.jam.at + JAM_S * 1000) {
        p.jam = m.id;
        f.dirty = true;
        d.bossEvent(b, 'jam', { i: m.jam.i, sid: m.id });
      }
      return 0;
    }
    if (m.restUntil > t) return 0;
    const pawls = (d.mobsIn?.(m.room) ?? []).filter((q) => q !== m && q.kind === PAWL && !q.dead);
    const taken = new Set(pawls.map((q) => q.jam?.i ?? q.goal));
    const free = PALLETS.map((P, i) => i).filter((i) => !f.pal[i].jam).sort((a, c) => (taken.has(a) ? 1 : 0) - (taken.has(c) ? 1 : 0) || Math.abs(PALLETS[a].x - m.x) - Math.abs(PALLETS[c].x - m.x));
    if (!free.length) {
      const q = m.target; // (both jammed: it harries the slimes)
      return q ? (Math.abs(q.state.x - m.x) > 10 ? Math.sign(q.state.x - m.x) * k.speed * 0.8 : 0) : 0;
    }
    const i = free[0], dx = PALLETS[i].x - m.x;
    m.goal = i;
    if (Math.abs(dx) < 14) {
      m.jam = { i, at: t };
      m.vx = 0;
      d.bossEvent(b, 'jamming', { i, sid: m.id, dur: JAM_S });
      return 0;
    }
    return Math.sign(dx) * k.speed;
  }
  return { tick, part, hitHead, send, son, hold };
}
