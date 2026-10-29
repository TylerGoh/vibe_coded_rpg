// Docs: docs/places/fenrir.md, docs/combat/bosses.md
// Fenrir's brain (FB2 (c), story/fb2-plan.md), the final-boss engine's 'wolf' brain (server/final.js picks it from
// FINAL.fenrir.brain): the same four written loops, enrage and S5 hookup as Ladon's 'hydra' brain, with its own
// mechanics instead of heads and coils: the reach (how much fetter it has: it walks and strikes only inside it), the
// four anchors (Strain: fill the far one's ring and the reach shrinks), the six lanterns (lit / dark / relighting; the
// dark hurts) and Skoll and Hati (two named adds that swallow lanterns: son()). Constants: src/shared/fenrir.js.
// → the room: {t:'final', fb:'fenrir', id, ph, enr, rc: the reach (px from the middle), po: its pose, an: [[state
// 'h' | 'c' | 's', ring %, ms left]] (the anchors), ln: [[lit 1 | 0, ring %]] (the lanterns)}
import { FINAL, finalPhase, FINAL_ENRAGE_MIN, FINAL_ULT_WARN, FINAL_GAP_S, FIN_W, FIN_FLOOR, GAZE_STAGGER_S, headReach } from '../src/shared/final.js';
import {
  FEN_MID, REACH_START, REACH_MIN, REACH_MAX, REACH_STEP, REACH_JAW, bodyRange, reachClamp, ANCHORS, SNAP_ORDER, STRAIN_S, ANCHOR_RING, LANTERN_X, LANTERN_RING,
  DARK_HP, DARK_RAGE_MIN, inLight, LUNGE_WARN, LUNGE_FLY, PANT_S, CLAW_WARN, CLAW_W, BREATH_WARN, BREATH_FLOOR, BREATH_LEDGE, POUNCE_N, POUNCE_MARK, POUNCE_FLY,
  POUNCE_MAX, ICE_N, ICE_WARN, REAR_S, REAR_WEAK, REAR_R, FEN_WATCH_S, PACK_EVERY, PACK_BASE, PACK_PER_DARK, SONS, SWALLOW_S, SONS_BACK_S, ENRAGE_HOWL_S,
  LANTERN_SLOT, fenSpot,
} from '../src/shared/fenrir.js';

const ENRAGE_MS = (Number(process.env.TEST_ENRAGE_MIN) || FINAL_ENRAGE_MIN) * 60_000; // (tests only: sooner)
const SLACK = 60;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clampX = (x) => Math.max(60, Math.min(FIN_W - 60, x));

// d: what it needs from server/rpg.js's closure (all lazy, called at tick time)
export function createWolf(d) {
  const { now } = d;
  const ringOf = (k, share) => Math.max(1, Math.round(k.hp * d.TEST_BOSS_HP * share));

  function init(m, k) {
    const f = {
      row: k.final, ph: 0, loop: 0, step: 0, at: 0, gap: true, start: 0, enrAt: 0, enr: false, sentAt: 0, dirty: true, ultN: 0, nextUlt: 0,
      pulseSeen: m.pulseN | 0, shieldAlt: 0, howlAt: 0, rc: REACH_START[0], pose: 'lie', mv: null, strain: null, rear: null,
      anchors: ANCHORS.map(() => ({ st: 'h', fill: 0, max: ringOf(k, ANCHOR_RING), until: 0 })),
      lit: LANTERN_X.map(() => true), lfill: LANTERN_X.map(() => 0), lmax: ringOf(k, LANTERN_RING),
      sons: {}, packAt: 0, darkAt: 0,
    };
    return f;
  }
  // → the room
  function send(m) {
    const f = m.fin, t = now();
    f.sentAt = t;
    f.dirty = false;
    d.toRoom(m.room)({
      t: 'final', fb: 'fenrir', id: m.id, ph: f.ph, enr: f.enr ? 1 : 0, rc: Math.round(f.rc), po: f.pose,
      an: f.anchors.map((a) => [a.st, Math.round((a.fill / a.max) * 100), a.st === 'c' ? Math.max(0, Math.round(a.until - t)) : 0]),
      ln: f.lit.map((on, i) => [on ? 1 : 0, Math.round((f.lfill[i] / f.lmax) * 100)]),
    });
  }
  const pose = (f, p) => {
    if (f.pose !== p) [f.pose, f.dirty] = [p, true];
  };
  const setReach = (m, rc) => {
    const f = m.fin, was = f.rc;
    f.rc = Math.max(REACH_MIN[f.ph], Math.min(REACH_MAX[f.ph], rc));
    if (f.rc !== was) {
      f.dirty = true;
      d.bossEvent(m, 'reach', { rc: f.rc, dir: Math.sign(f.rc - was) });
    }
  };
  // a lantern goes out (by: 'howl' | 'son' | 'ult' | 'rage') or comes back (by: 'fire' | 'ring' | 'freed')
  function lantern(m, i, on, by, extra = {}) {
    const f = m.fin;
    if (f.lit[i] === on) return;
    f.lit[i] = on;
    f.lfill[i] = 0;
    f.dirty = true;
    d.bossEvent(m, on ? 'lanternLit' : 'lanternOut', { i, by, ...extra });
  }
  // slide the body from where it is to x over ms (a lunge, a bound, a strain)
  const slide = (m, x, ms) => (m.fin.mv = { x0: m.x, x1: x, at: now(), ms });
  function enterPhase(m, k, ph, t) {
    const f = m.fin;
    f.ph = ph;
    f.loop = f.step = 0;
    m.stage = Math.min(2, ph);
    // a fetter snaps for good: its anchor's stone splits; the reach takes a big step
    const snap = SNAP_ORDER[ph - 1];
    if (snap !== undefined && f.anchors[snap].st !== 's') {
      Object.assign(f.anchors[snap], { st: 's', fill: 0, until: 0 });
      d.bossEvent(m, 'snap', { slot: snap });
    }
    if (f.strain && f.anchors[f.strain.slot].st !== 's') f.anchors[f.strain.slot].st = 'h';
    f.strain = null;
    f.rc = REACH_START[ph];
    f.nextUlt = Math.max(f.nextUlt, t + 8000);
    if (ph >= 1 && !f.packAt) f.packAt = t + PACK_EVERY * 500;
    f.dirty = true;
    d.bossEvent(m, 'phase', { n: ph + 1 });
    d.bossSays(m, k.lines?.phase?.[ph - 1]);
  }
  function enrage(m, t) {
    const f = m.fin;
    f.enr = true;
    m.enraged = true;
    f.howlAt = t + ENRAGE_HOWL_S * 1000;
    for (let i = 0; i < f.lit.length; i++) lantern(m, i, false, 'rage');
    f.dirty = true;
    d.bossEvent(m, 'finalRage');
  }
  const watched = (m) => (m.focus && m.focus.until > now() ? m.focus.p : null);
  const fighters = (m, here) => here.filter(([, q]) => !q.faintUntil);
  const face = (m, x) => (m.dir = Math.sign(x - m.x) || m.dir);

  // one move of the loop → how long it takes (s)
  function move(m, k, here, name, t) {
    const f = m.fin, ph = f.ph, w = watched(m), list = fighters(m, here);
    const aim = w ?? m.target ?? (list.length ? pick(list)[1] : null);
    const [lo, hi] = bodyRange(f.rc);
    if (name === 'watch') {
      if (!list.length) return 0.5;
      pose(f, 'stand');
      if (!(m.tauntUntil > t && m.focus)) { // (a Knight's taunt holds it)
        const others = list.filter(([, q]) => q !== m.focusLast);
        const [id, p] = pick(others.length ? others : list);
        m.focus = { p, id, until: t + FEN_WATCH_S * 1000 };
        m.focusLast = p;
        d.sendParty(m);
      }
      d.bossEvent(m, 'watch', { to: m.focus.id });
      return 1.4;
    }
    if (name === 'lunge') {
      if (!aim) return 0.3;
      const tx = Math.round(reachClamp(f.rc, aim.state.x)), dir = face(m, tx), warn = LUNGE_WARN[ph];
      const bx = Math.max(lo, Math.min(hi, tx - dir * REACH_JAW * 0.8));
      pose(f, 'crouch');
      d.bossEvent(m, 'lunge', { tx, dur: warn, rc: Math.round(f.rc) });
      d.later(m, warn * 1000, () => {
        if (m.dead || f.pose !== 'crouch') return;
        pose(f, 'lunge');
        slide(m, bx, LUNGE_FLY * 1000);
        d.later(m, LUNGE_FLY * 1000, () => {
          if (m.dead) return;
          pose(f, 'pant');
          d.bossEvent(m, 'lungeHit', { tx });
        });
      });
      return warn + LUNGE_FLY + PANT_S;
    }
    if (name === 'claw') {
      if (aim) face(m, aim.state.x);
      const a = Math.round(reachClamp(f.rc, m.x)), b = Math.round(reachClamp(f.rc, m.x + m.dir * CLAW_W));
      const x0 = Math.min(a, b), x1 = Math.max(a, b);
      pose(f, 'claw');
      d.bossEvent(m, 'claw', { x0, x1, dur: CLAW_WARN });
      d.later(m, CLAW_WARN * 1000, () => !m.dead && d.bossEvent(m, 'clawHit', { x0, x1 }));
      return CLAW_WARN + 0.5;
    }
    if (name === 'strain') {
      if (!aim) return 0.3;
      const s = Math.sign(aim.state.x - FEN_MID) || 1, held = (side) => [0, 2, 1, 3].filter((i) => f.anchors[i].st === 'h' && ANCHORS[i].side === side);
      const slot = held(-s)[0] ?? held(s)[0];
      if (slot === undefined) return 0.3;
      face(m, aim.state.x);
      Object.assign(f.anchors[slot], { st: 'c', fill: 0, until: t + STRAIN_S * 1000 });
      f.strain = { slot, dir: s };
      pose(f, 'strain');
      slide(m, s > 0 ? hi : lo, 500);
      f.dirty = true;
      d.bossEvent(m, 'strain', { slot, dur: STRAIN_S, dir: s });
      return STRAIN_S + 0.3;
    }
    if (name === 'rime' || name === 'ward' || name === 'both' || name === 'shield') {
      const kind = name === 'rime' ? 'armour' : name === 'ward' ? 'barrier' : name === 'both' ? 'both' : (f.shieldAlt++ % 2 ? 'barrier' : 'armour');
      pose(f, 'stand');
      if (!m.shield) d.shieldUp(m, k, kind, t);
      return 1.6;
    }
    if (name === 'howl') {
      pose(f, 'howl');
      m.pulseAt = t; // (partyTick warns and lands it: the pulse, looks.pulse 'howl'; each landing puts out a lantern)
      return d.PULSE_WARN + 0.8;
    }
    if (name === 'breath') {
      if (aim) face(m, aim.state.x);
      const high = aim ? aim.state.y < FIN_FLOOR - 60 !== Math.random() < 0.25 : Math.random() < 0.5; // (mostly at the watched slime's height)
      const band = high ? BREATH_LEDGE : BREATH_FLOOR;
      pose(f, 'breath');
      d.bossEvent(m, 'beam', { style: 'rime', bx: Math.round(m.x + m.dir * 110), dir: m.dir, y0: band[0], y1: band[1], len: FIN_W, warn: BREATH_WARN, dur: 0.6 });
      return BREATH_WARN + 0.9;
    }
    if (name === 'pounce') {
      pose(f, 'crouch');
      const step = POUNCE_MARK + 0.3;
      for (let i = 0; i < POUNCE_N; i++) {
        d.later(m, (0.5 + i * step) * 1000, () => {
          if (m.dead) return;
          const q = watched(m) ?? m.target ?? aim;
          const want = q ? q.state.x : m.x + m.dir * 300;
          const tx = Math.round(clampX(m.x + Math.max(-POUNCE_MAX, Math.min(POUNCE_MAX, want - m.x))));
          d.bossEvent(m, 'pounce', { tx, dur: POUNCE_MARK, n: i });
          d.later(m, (POUNCE_MARK - POUNCE_FLY) * 1000, () => {
            if (m.dead) return;
            const dir = face(m, tx);
            pose(f, 'lunge');
            slide(m, Math.max(lo, Math.min(hi, tx - dir * 60)), POUNCE_FLY * 1000);
            d.later(m, POUNCE_FLY * 1000, () => {
              if (m.dead) return;
              pose(f, i === POUNCE_N - 1 ? 'pant' : 'crouch');
              d.bossEvent(m, 'pounceHit', { tx });
            });
          });
        });
      }
      return 0.5 + POUNCE_N * step + 1.2;
    }
    if (name === 'ice') {
      pose(f, 'howl');
      const marks = Array.from({ length: ICE_N }, (_, i) => Math.round(80 + (i + rand(0.1, 0.9)) * ((FIN_W - 160) / ICE_N)));
      for (const [, q] of list) marks.push(Math.round(clampX(q.state.x)));
      d.bossEvent(m, 'rain', { marks, dur: ICE_WARN });
      d.later(m, ICE_WARN * 1000, () => !m.dead && d.bossEvent(m, 'rainHit', { marks }));
      return ICE_WARN + 0.8;
    }
    if (name === 'rear') {
      if (!aim) return 0.3;
      const tx = Math.round(clampX(aim.state.x));
      face(m, tx);
      pose(f, 'rear');
      f.rear = { tx, until: t + REAR_S * 1000 };
      m.weak = { at: t, until: f.rear.until, fill: 0, max: Math.max(1, Math.round(k.hp * d.TEST_BOSS_HP * d.weakHpOf(k) * REAR_WEAK)), gaze: true };
      f.rear.w = m.weak;
      d.bossEvent(m, 'rear', { tx, dur: REAR_S, r: REAR_R });
      d.bossEvent(m, 'weakOpen');
      d.sendParty(m);
      return REAR_S + 1.2;
    }
    if (name === 'ult') return ult(m, k, t);
    return 0.2;
  }
  // an ultimate: Swallow the Light (u.keep: the two lanterns it leaves) or Fimbulwinter (u.dir: the way the wind blows)
  function ult(m, k, t) {
    const f = m.fin, row = FINAL[f.row];
    const pin = m.forceUlt; // (the sandbox's Ultimate now: that one)
    m.forceUlt = null;
    const which = (pin != null && row.ults[pin]) || (f.ph >= row.alternateFrom ? row.ults[f.ultN++ % row.ults.length] : row.ults[0]);
    const u = { ...which, dur: FINAL_ULT_WARN };
    if (u.kind === 'swallow') {
      const lit = f.lit.map((on, i) => (on ? i : -1)).filter((i) => i >= 0), dark = f.lit.map((on, i) => (on ? -1 : i)).filter((i) => i >= 0);
      const pool = [...lit.sort(() => Math.random() - 0.5), ...dark.sort(() => Math.random() - 0.5)];
      u.keep = pool.slice(0, 2).sort((a, b) => a - b);
    } else u.dir = Math.random() < 0.5 ? 1 : -1;
    pose(f, 'ult');
    m.act = 'ult';
    m.phase = 'warn';
    f.nextUlt = t + (row.ultEvery[f.ph] || 60) * 1000;
    d.startUlt(m, k, t, u);
    return 99; // (ends when the ultimate does: tick watches m.act)
  }

  // the pack and the sons, the dark's cold
  function room(m, k, here, t) {
    const f = m.fin, list = fighters(m, here);
    // the dark hurts: every second, everyone outside every lit lantern's pool
    if (t >= f.darkAt) {
      f.darkAt = t + 1000;
      const share = DARK_HP + (f.enr ? DARK_RAGE_MIN * Math.max(0, (t - f.enrAt) / 60_000) : 0);
      for (const [qid, q] of list) if (q.state.room === m.room && !inLight(f.lit, q.state.x)) d.hurt(qid, q, d.stats(q).maxHp * share, q.state.x, undefined, 0, false, m, 'dot');
    }
    // the pack: out of the darker end, more the more lanterns are out
    if (f.ph >= 1 && f.packAt && t >= f.packAt && m.act !== 'ult') {
      f.packAt = t + PACK_EVERY * 1000;
      const out = f.lit.filter((on) => !on).length, n = PACK_BASE + Math.floor(out / PACK_PER_DARK);
      const wolves = d.minionsOf(m, k.minion), space = d.addsCap(m) - wolves;
      const westDark = f.lit.slice(0, 3).filter((on) => !on).length, eastDark = f.lit.slice(3).filter((on) => !on).length;
      const x = westDark > eastDark ? 60 : eastDark > westDark ? FIN_W - 60 : pick([60, FIN_W - 60]);
      for (let i = 0; i < Math.min(n, space); i++) d.addMinion(m, x + rand(-30, 30));
      if (Math.min(n, space) > 0) d.bossEvent(m, 'pack', { px: x });
    }
    // Skoll and Hati: out of the dark from phase 3; each comes back SONS_BACK_S after it's killed
    if (f.ph >= 2) for (const [i, name] of SONS.entries()) {
      const s = (f.sons[name] ??= { id: 0, back: t + i * 4000 });
      if (s.id && !d.alive(s.id)) {
        s.id = 0;
        s.back = t + SONS_BACK_S * 1000;
        d.bossEvent(m, 'sonDown', { son: name });
      }
      if (!s.id && t >= s.back && list.length) {
        const x = i ? FIN_W - 60 : 60, q = d.addAdd(m, name, x);
        s.id = q.id;
        d.bossEvent(m, 'sonUp', { son: name, sx: x });
      }
    }
  }

  // every tick for a final boss (instead of bossBrain) → how fast it walks
  function tick(m, k, here, dt, t) {
    const f = (m.fin ??= init(m, k)), row = FINAL[f.row];
    if (!f.start) {
      f.start = t;
      f.enrAt = t + (m.enrLeft ?? ENRAGE_MS); // (m.enrLeft: its enrage clock from before a restart, server/rpg.js restoreBosses)
      m.enrLeft = undefined;
      f.at = t + 3500; // (it's lying down when you come in, and gets up slowly: the title card)
      f.darkAt = t + 1000;
    }
    const ph = finalPhase(row, m.hp / m.maxHp);
    if (ph > f.ph) enterPhase(m, k, ph, t);
    if (!f.enr && t >= f.enrAt) enrage(m, t);
    if (!m.ultArmed && m.hp / m.maxHp < d.ULT_FIRST) [m.ultArmed, f.nextUlt] = [true, Math.max(f.nextUlt, t + 3000)];
    // a Howl landed: from phase 2 it swallows a lantern (the one nearest it)
    if ((m.pulseN | 0) !== f.pulseSeen) {
      f.pulseSeen = m.pulseN | 0;
      if (f.ph >= 1) {
        const lit = f.lit.map((on, i) => (on ? i : -1)).filter((i) => i >= 0).sort((a, b) => Math.abs(LANTERN_X[a] - m.x) - Math.abs(LANTERN_X[b] - m.x));
        if (lit.length) lantern(m, lit[0], false, 'howl');
      }
    }
    // Strain: the far anchor's crack ran (unanswered: the reach grows a step)
    if (f.strain) {
      const a = f.anchors[f.strain.slot];
      if (a.st === 'c' && t >= a.until) {
        Object.assign(a, { st: 'h', fill: 0 });
        d.bossEvent(m, 'anchorSlip', { slot: f.strain.slot });
        f.strain = null;
        setReach(m, f.rc + REACH_STEP);
        f.dirty = true;
      }
    }
    // Rearing: the shard filled (the weak point gone before its time: a long stagger, no landing), or it comes down
    if (f.rear) {
      if (t >= f.rear.until) {
        const tx = f.rear.tx, [lo, hi] = bodyRange(f.rc);
        f.rear = null;
        if (m.weak?.gaze) [m.weak, m.partyDirty] = [null, true];
        pose(f, 'pant');
        slide(m, Math.max(lo, Math.min(hi, tx - m.dir * 70)), 250);
        d.bossEvent(m, 'rearHit', { tx, r: REAR_R });
      } else if (m.weak !== f.rear.w) {
        f.rear = null;
        pose(f, 'stag');
        d.bossEvent(m, 'rearBroken');
        if (!f.gap) f.at = Math.min(f.at, t);
      }
    }
    if (f.enr && t >= f.howlAt && !m.pulseHit && m.act !== 'ult') {
      f.howlAt = t + ENRAGE_HOWL_S * 1000;
      m.pulseAt = t; // (twice as often as the loop's own)
    }
    room(m, k, here, t);
    if (f.dirty && t - f.sentAt > 120) send(m);
    else if (t - f.sentAt > 1000) send(m);
    // a slide in progress (a lunge, a bound, a strain): its body goes where the move takes it
    if (f.mv) {
      const g = Math.min(1, (t - f.mv.at) / Math.max(1, f.mv.ms));
      m.x = f.mv.x0 + (f.mv.x1 - f.mv.x0) * g;
      m.vx = 0;
      if (g >= 1) f.mv = null;
      return 0;
    }
    // the loop
    if (m.act === 'ult') {
      m.timer -= dt;
      if (m.phase === 'warn' && m.timer <= 0) {
        m.phase = 'act';
        d.ultGoesOff(m, k, t);
        if (m.ult?.kind === 'swallow') for (let i = 0; i < f.lit.length; i++) lantern(m, i, !f.enr && m.ult.keep.includes(i), 'ult');
      } else if (m.phase === 'act' && m.timer <= 0) {
        [m.act, m.ult, m.phase, f.gap, f.at] = [null, null, 'walk', true, t + FINAL_GAP_S[f.ph] * 1000];
        pose(f, 'stand');
      }
      return 0;
    }
    if (!f.gap && f.at === Infinity) [f.gap, f.at] = [true, t + 1000]; // (an ultimate was interrupted: interruptUlt dropped it)
    if (m.staggerUntil > t) {
      pose(f, 'stag');
      return 0;
    }
    if (t < f.at) return f.gap && f.pose !== 'lie' ? walk(m, k, f) : 0;
    if (!f.gap) {
      // the move's time is up: its opening
      m.phase = 'walk';
      m.act = null;
      f.gap = true;
      f.at = t + FINAL_GAP_S[f.ph] * (f.enr ? 0.7 : 1) * 1000;
      if (f.strain) { // (the move ended early: the anchor was set)
        Object.assign(f.anchors[f.strain.slot], { st: 'h', fill: 0 });
        f.strain = null;
      }
      pose(f, 'stand');
      return 0;
    }
    if (!fighters(m, here).length) return 0;
    // the next move: an ultimate due (phases 1–3), else the loop's next step
    let name;
    if ((f.ph < 3 || m.forceUlt != null) && m.ultArmed && t >= f.nextUlt) name = 'ult';
    else {
      const loop = row.loops[f.ph];
      name = loop[f.step % loop.length];
      if (++f.step % loop.length === 0) f.loop++;
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
  // in an opening it pads after the watched slime (or its target), inside its reach
  function walk(m, k, f) {
    const q = watched(m) ?? m.target;
    if (!q) return 0;
    const [lo, hi] = bodyRange(f.rc), want = Math.max(lo, Math.min(hi, q.state.x - Math.sign(q.state.x - m.x) * 140));
    if (m.x < lo || m.x > hi) return Math.sign((lo + hi) / 2 - m.x) * k.speed;
    return Math.abs(want - m.x) > 20 ? Math.sign(want - m.x) * k.speed : 0;
  }

  // ——— hits ———
  const targetable = (f, slot) => (slot < LANTERN_SLOT ? f.anchors[slot]?.st === 'c' : slot - LANTERN_SLOT < f.lit.length && !f.lit[slot - LANTERN_SLOT] && !f.enr);
  // what a hit from p with flag code (h[4]: 1 the shard, 2 + slot an anchor or a lantern) can be on → { weak } |
  // { prop: slot } | 'body' | null
  function part(m, p, code, arrow, range, magic = false) {
    const f = m.fin, k = d.MOBS[m.kind], x = p.state.x, y = p.state.y;
    if (f && code === 1 && m.weak) {
      const s = d.weakOf(k, m.x, m.y, m.dir);
      if (headReach(s, x, y, range, arrow, SLACK)) return { weak: true };
    }
    if (f && code >= 2 && targetable(f, code - 2) && headReach(fenSpot(code - 2), x, y, range, arrow || magic, SLACK)) return { prop: code - 2 };
    return Math.abs(m.x - x) <= range + k.w / 2 + SLACK ? 'body' : null;
  }
  // a hit for dmg landed on an anchor or a lantern (part()'s { prop }): fills its ring; fire or holy light relights a
  // lantern at once
  function hitHead(m, pt, dmg, id, p, { fire = false } = {}) {
    const f = m.fin, slot = pt.prop;
    if (!f || slot === undefined || !targetable(f, slot)) return;
    if (slot < LANTERN_SLOT) {
      const a = f.anchors[slot];
      a.fill += dmg;
      f.dirty = true;
      if (a.fill >= a.max) {
        // set: the fetter snaps tight, it's yanked back off its feet, and the reach shrinks a step
        Object.assign(a, { st: 'h', fill: 0 });
        f.strain = null;
        d.bossEvent(m, 'anchorSet', { slot, by: id });
        setReach(m, f.rc - REACH_STEP);
        d.stagger(m);
        if (!f.gap) f.at = Math.min(f.at, now());
      }
      return;
    }
    const i = slot - LANTERN_SLOT;
    if (fire) return lantern(m, i, true, 'fire', { who: id });
    f.lfill[i] += dmg;
    f.dirty = true;
    if (f.lfill[i] >= f.lmax) lantern(m, i, true, 'ring', { who: id });
  }

  // Skoll and Hati (stepMob runs this for a mob with `son`) → how fast it runs: to the nearest lit lantern no brother
  // is after, then it swallows it in SWALLOW_S unless something stops it there; with none lit it harries the slimes
  function son(m, k, here, dt, t) {
    const b = d.mobById(m.by), f = b?.fin;
    if (!f || b.dead) return 0;
    if (m.sw) {
      const at = m.sw.at, stopped = m.frozenUntil > at || m.stunUntil > at || m.snareUntil > at || (m.knockAt ?? 0) > at;
      if (stopped || !f.lit[m.sw.i] || f.enr) {
        if (stopped) d.bossEvent(b, 'sonStopped', { i: m.sw.i, son: m.kind });
        m.sw = null;
        m.restUntil = t + 1200;
        return 0;
      }
      if (t >= m.sw.until) {
        const i = m.sw.i;
        m.sw = null;
        lantern(b, i, false, 'son', { son: m.kind });
      }
      return 0;
    }
    if (m.restUntil > t) return 0;
    const taken = new Set(SONS.map((n) => d.mobById(f.sons[n]?.id)).filter((q) => q && q !== m && !q.dead).map((q) => q.sw?.i ?? q.goal));
    let best = -1, bd = Infinity;
    for (const [i, lx] of LANTERN_X.entries()) if (f.lit[i] && !taken.has(i) && Math.abs(lx - m.x) < bd) [best, bd] = [i, Math.abs(lx - m.x)];
    if (best < 0 && !taken.size) for (const [i, lx] of LANTERN_X.entries()) if (f.lit[i] && Math.abs(lx - m.x) < bd) [best, bd] = [i, Math.abs(lx - m.x)];
    m.goal = best;
    if (best < 0) {
      const q = m.target;
      return q ? (Math.abs(q.state.x - m.x) > 10 ? Math.sign(q.state.x - m.x) * k.speed * 0.8 : 0) : 0;
    }
    const dx = LANTERN_X[best] - m.x;
    if (Math.abs(dx) < 12) {
      m.sw = { i: best, at: t, until: t + SWALLOW_S * 1000 };
      m.vx = 0;
      m.dir = m.dir || 1;
      d.bossEvent(b, 'sonSwallow', { i: best, son: m.kind, sid: m.id, dur: SWALLOW_S });
      return 0;
    }
    return Math.sign(dx) * k.speed;
  }
  return { tick, part, hitHead, send, son };
}
