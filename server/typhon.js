// Docs: docs/places/typhon.md, docs/combat/bosses.md
// Typhon's brain (E5 (c), story/e5-plan.md), the final-boss engine's 'fire' brain (server/final.js picks it from
// FINAL.typhon.brain): the same four written loops, enrage and S5 hookup as Ladon's and Fenrir's, with its own mechanics:
// the eight floor plates (cold / glowing / molten / crusted; molten hurts, frost crusts), the pressure (one number; its
// moves and time add to it, a Bellows and the four vents let it out; full, the hearth erupts), the Pour (phase 3: the
// iron's height is the pressure), its coils (Coil Burst, Coil Sweep), the Inhale (the tooth) and the brood. It's rooted
// at the hearth in phases 1–3 and moves along the den on its coils in phase 4. Constants: src/shared/typhon.js.
// → the room: {t:'final', fb:'typhon', id, ph, enr, pr: the pressure 0–100, po: its pose, pl: [[state 'c'|'g'|'m'|'k',
// ring %, ms left]] (the plates), vn: [[state 'r'|'o'|'s'|'j', ring %, ms left]] (the vents)}
import { FINAL, finalPhase, FINAL_ENRAGE_MIN, FINAL_ULT_WARN, FINAL_GAP_S, ENRAGE_BREATH_S, FIN_W, FIN_FLOOR, headReach } from '../src/shared/final.js';
import {
  TY_MID, PLATES, PLATE_W, plateAt, plateMid, GLOW_S, PLATE_COOL_S, CRUST_S, MOLTEN_HP, PLATE_TICK_S, PLATE_RING, PRESS_MAX, PRESS_RATE, PRESS_HAMMER,
  PRESS_BURST, BELLOWS_LET, POUR_ADD, VENT_DROP, ERUPT_LET, PRESS_AFTER, VENTS, VENT_RING, VENT_DELAY, VENT_BLAST_S, VENT_LEN, VENT_SHUT_S, VENT_LOW_BAND, VENT_HIGH_BAND,
  floodN, plateHot, ledgesFlooded, onLowLedge, onFloor, GLARE_S, HAMMER_WARN, HAMMER_R, HAMMER_REST, BURST_N, BURST_WARN, BURST_GAP, BREATH_WARN,
  BREATH_FLOOR, BREATH_LEDGE, SWEEP_WARN, SWEEP_SPEED, INHALE_S, INHALE_WEAK, BODY_EDGE, BROOD_EVERY, BROOD_BASE, BROOD_PER, UNBURIED_GLOW, ENRAGE_PLATE_S,
  ERUPT_DARK, POUR_SPEED, PLATE_SLOT, tySpot,
} from '../src/shared/typhon.js';

const ENRAGE_MS = (Number(process.env.TEST_ENRAGE_MIN) || FINAL_ENRAGE_MIN) * 60_000; // (tests only: sooner)
const SLACK = 60;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clampX = (x) => Math.max(60, Math.min(FIN_W - 60, x));
const PLATE_REACH = 40; // (slack past a plate ring's radius for a hit from beside it)

// d: what it needs from server/rpg.js's closure (all lazy, called at tick time)
export function createTyphon(d) {
  const { now } = d;
  const ringOf = (k, share) => Math.max(1, Math.round(k.hp * d.TEST_BOSS_HP * share));

  function init(m, k) {
    return {
      row: k.final, ph: 0, loop: 0, step: 0, at: 0, gap: true, start: 0, enrAt: 0, enr: false, sentAt: 0, dirty: true, ultN: 0, nextUlt: 0,
      pulseSeen: m.pulseN | 0, shieldAlt: 0, bellowsAt: 0, pose: 'sunk', mv: null, inhale: null, pulse2: false, full: false,
      press: 10, pressSent: 10, tickAt: 0, broodAt: 0, rageAt: 0, stuck: new Set(),
      plates: Array.from({ length: PLATES }, () => ({ st: 'c', fill: 0, max: ringOf(k, PLATE_RING), until: 0 })),
      vents: VENTS.map(() => ({ st: 'r', fill: 0, max: ringOf(k, VENT_RING), until: 0 })),
    };
  }
  // → the room
  function send(m) {
    const f = m.fin, t = now();
    f.sentAt = t;
    f.dirty = false;
    f.pressSent = Math.round(f.press);
    const left = (q) => (q.until > t ? Math.round(q.until - t) : 0);
    d.toRoom(m.room)({
      t: 'final', fb: 'typhon', id: m.id, ph: f.ph, enr: f.enr ? 1 : 0, pr: Math.round(f.press), po: f.pose,
      pl: f.plates.map((p) => [p.st, Math.round((p.fill / p.max) * 100), left(p)]),
      vn: f.vents.map((v) => [v.st, Math.round((v.fill / v.max) * 100), left(v)]),
    });
  }
  const pose = (f, p) => {
    if (f.pose !== p) [f.pose, f.dirty] = [p, true];
  };
  const addPress = (m, n) => {
    const f = m.fin;
    f.press = Math.max(0, Math.min(PRESS_MAX, f.press + n));
    if (Math.abs(Math.round(f.press) - f.pressSent) >= 1) f.dirty = true;
  };
  const flood = (f) => floodN(f.ph, f.press);
  const hot = (f, i) => plateHot(f.plates[i].st, i, flood(f));
  // a plate set to st for s seconds (0: no timer)
  const setPlate = (m, i, st, s) => {
    const p = m.fin.plates[i];
    Object.assign(p, { st, fill: 0, until: s ? now() + s * 1000 : 0 });
    m.fin.dirty = true;
  };
  // a move melts plate i: cold or crusted → glowing (then molten); molten stays molten a while longer. now: straight to molten
  function melt(m, i, nowMolten = false) {
    const f = m.fin, p = f.plates[i];
    if (!p || f.stuck.has(i)) return;
    if (nowMolten || p.st === 'm') setPlate(m, i, 'm', PLATE_COOL_S);
    else if (p.st !== 'g') setPlate(m, i, 'g', GLOW_S);
  }
  // frost crusts plate i (by: who; `ring`: its ring filled, the poor answer)
  function crust(m, i, by, how) {
    const f = m.fin;
    if (f.enr || f.stuck.has(i) || !hot(f, i)) return false;
    setPlate(m, i, 'k', CRUST_S);
    d.bossEvent(m, 'crust', { i, by: how, who: by });
    return true;
  }
  // slide the body from where it is to x over ms (phase 4: a sweep)
  const slide = (m, x, ms) => (m.fin.mv = { x0: m.x, x1: x, at: now(), ms });
  function enterPhase(m, k, ph, t) {
    const f = m.fin;
    f.ph = ph;
    f.loop = f.step = 0;
    m.stage = Math.min(2, ph);
    if (ph === 2) { // the Pour: it tips the great ladle, the iron runs into the mould and over
      addPress(m, POUR_ADD);
      d.bossEvent(m, 'ladle', { tip: 1 });
    }
    if (ph === 3) { // unburied: the iron drains, the coils come up through the plates
      const order = [...Array(PLATES).keys()].sort(() => Math.random() - 0.5).slice(0, UNBURIED_GLOW);
      for (const i of order) if (f.plates[i].st !== 'k') melt(m, i);
      d.bossEvent(m, 'unburied');
    }
    pose(f, 'idle');
    f.nextUlt = Math.max(f.nextUlt, t + 8000);
    if (ph >= 1 && !f.broodAt) f.broodAt = t + BROOD_EVERY * 500;
    f.dirty = true;
    d.bossEvent(m, 'phase', { n: ph + 1 });
    d.bossSays(m, k.lines?.phase?.[ph - 1]);
  }
  function enrage(m, t) {
    const f = m.fin;
    f.enr = true;
    m.enraged = true;
    f.bellowsAt = t + ENRAGE_BREATH_S * 1000;
    f.rageAt = t;
    for (const v of f.vents) Object.assign(v, { st: 'j', fill: 0, until: 0 });
    for (const [i, p] of f.plates.entries()) if (p.st === 'k') setPlate(m, i, 'c', 0);
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
    if (name === 'glare') {
      if (!list.length) return 0.5;
      pose(f, 'glare');
      if (!(m.tauntUntil > t && m.focus)) { // (a Knight's taunt holds it)
        const others = list.filter(([, q]) => q !== m.focusLast);
        const [id, p] = pick(others.length ? others : list);
        m.focus = { p, id, until: t + GLARE_S * 1000 };
        m.focusLast = p;
        d.sendParty(m);
      }
      d.bossEvent(m, 'watch', { to: m.focus.id });
      return 1.4;
    }
    if (name === 'hammer') {
      if (!aim) return 0.3;
      const tx = Math.round(clampX(aim.state.x)), warn = HAMMER_WARN[ph], side = face(m, tx);
      pose(f, side < 0 ? 'hammerL' : 'hammerR');
      d.bossEvent(m, 'hammer', { tx, dur: warn, r: HAMMER_R, side });
      d.later(m, warn * 1000, () => {
        if (m.dead) return;
        pose(f, side < 0 ? 'restL' : 'restR');
        d.bossEvent(m, 'hammerHit', { tx, r: HAMMER_R });
        melt(m, plateAt(tx));
        addPress(m, PRESS_HAMMER);
      });
      return warn + 0.3 + HAMMER_REST * (f.enr ? 0.7 : 1);
    }
    if (name === 'burst') {
      const ax = aim ? aim.state.x : m.x;
      const order = [...Array(PLATES).keys()].sort((a, b) => Math.abs(plateMid(a) - ax) - Math.abs(plateMid(b) - ax)).slice(0, BURST_N);
      pose(f, 'coil');
      order.forEach((i, j) => d.later(m, j * BURST_GAP * 1000, () => {
        if (m.dead) return;
        d.bossEvent(m, 'bulge', { i, dur: BURST_WARN });
        d.later(m, BURST_WARN * 1000, () => {
          if (m.dead) return;
          d.bossEvent(m, 'burst', { i });
          melt(m, i, true);
          addPress(m, PRESS_BURST / BURST_N);
        });
      }));
      return BURST_N * BURST_GAP + BURST_WARN + 0.6;
    }
    if (name === 'bellows') {
      pose(f, 'bellows');
      m.pulseAt = t; // (partyTick warns and lands it: the pulse, looks.pulse 'bellows'; each landing lets BELLOWS_LET out)
      return d.PULSE_WARN + 0.8;
    }
    if (name === 'breath') {
      if (aim) face(m, aim.state.x);
      const high = aim ? aim.state.y < FIN_FLOOR - 60 !== Math.random() < 0.25 : Math.random() < 0.5; // (mostly at the watched slime's height)
      const band = high ? BREATH_LEDGE : BREATH_FLOOR;
      pose(f, 'breath');
      d.bossEvent(m, 'beam', { style: 'hearth', bx: Math.round(m.x + m.dir * 120), dir: m.dir, y0: band[0], y1: band[1], len: FIN_W, warn: BREATH_WARN, dur: 0.7 });
      return BREATH_WARN + 1;
    }
    if (name === 'crust' || name === 'haze' || name === 'both' || name === 'shield') {
      const kind = name === 'crust' ? 'armour' : name === 'haze' ? 'barrier' : name === 'both' ? 'both' : (f.shieldAlt++ % 2 ? 'barrier' : 'armour');
      pose(f, 'idle');
      if (!m.shield) d.shieldUp(m, k, kind, t);
      return 1.6;
    }
    if (name === 'pour') { // (phase 3: it tips the ladle again, the level tops up)
      pose(f, 'pour');
      addPress(m, POUR_ADD);
      d.bossEvent(m, 'ladle', { tip: 0 });
      return 2.2;
    }
    if (name === 'sweep') {
      if (!aim) return 0.3;
      let dir = Math.sign(aim.state.x - m.x) || m.dir || 1;
      let x1 = dir > 0 ? FIN_W - BODY_EDGE : BODY_EDGE;
      if (Math.abs(x1 - m.x) < 240) [dir, x1] = [-dir, dir > 0 ? BODY_EDGE : FIN_W - BODY_EDGE]; // (already at that end: back the other way)
      const x0 = Math.round(m.x), dur = Math.abs(x1 - x0) / SWEEP_SPEED;
      face(m, x1);
      pose(f, 'coil');
      d.bossEvent(m, 'sweep', { x0, x1, warn: SWEEP_WARN, dur: Math.round(dur * 1000) / 1000 });
      d.later(m, SWEEP_WARN * 1000, () => {
        if (m.dead) return;
        pose(f, 'sweep');
        slide(m, x1, dur * 1000);
        // every plate it crosses melts as its coils go over
        for (let i = 0; i < PLATES; i++) {
          const mid = plateMid(i);
          if ((mid - x0) * (mid - x1) > 0 && plateAt(x0) !== i) continue;
          d.later(m, (Math.abs(mid - x0) / SWEEP_SPEED) * 1000, () => !m.dead && melt(m, i));
        }
      });
      return SWEEP_WARN + dur + 0.8;
    }
    if (name === 'inhale') {
      pose(f, 'inhale');
      if (aim) face(m, aim.state.x);
      f.inhale = { until: t + INHALE_S * 1000 };
      m.weak = { at: t, until: f.inhale.until, fill: 0, max: Math.max(1, Math.round(k.hp * d.TEST_BOSS_HP * d.weakHpOf(k) * INHALE_WEAK)), gaze: true };
      f.inhale.w = m.weak;
      d.bossEvent(m, 'inhale', { dur: INHALE_S });
      d.bossEvent(m, 'weakOpen');
      d.sendParty(m);
      return INHALE_S + 1;
    }
    if (name === 'ult') return ult(m, k, t);
    return 0.2;
  }
  // an ultimate: Eruption (u.dark: the two plates the wind-up leaves dark; u.noFreeze: a full-pressure one) or the Last
  // Pour (u.dir: the way the iron runs)
  function ult(m, k, t, full = false) {
    const f = m.fin, row = FINAL[f.row];
    const pin = m.forceUlt; // (the sandbox's Ultimate now: that one)
    m.forceUlt = null;
    const which = full ? row.ults[0] : (pin != null && row.ults[pin]) || (f.ph >= row.alternateFrom ? row.ults[f.ultN++ % row.ults.length] : row.ults[0]);
    const u = { ...which, dur: FINAL_ULT_WARN };
    if (u.kind === 'eruption') {
      // the two it leaves dark: cold plates first (never two side by side if it can help it)
      const order = [...Array(PLATES).keys()].sort((a, b) => (f.plates[a].st === 'c' ? 0 : 1) - (f.plates[b].st === 'c' ? 0 : 1) || Math.random() - 0.5);
      const dark = [order[0]];
      for (const i of order.slice(1)) if (dark.length < ERUPT_DARK && Math.abs(i - dark[0]) > 1) dark.push(i);
      for (const i of order) if (dark.length < ERUPT_DARK && !dark.includes(i)) dark.push(i);
      u.dark = dark.sort((a, b) => a - b);
      if (full) [u.noFreeze, u.full] = [true, 1];
    } else {
      u.dir = Math.random() < 0.5 ? 1 : -1;
      u.x0 = u.dir > 0 ? 0 : FIN_W;
      u.speed = POUR_SPEED;
    }
    pose(f, u.kind === 'eruption' ? 'sink' : 'pour');
    m.act = 'ult';
    m.phase = 'warn';
    if (!full) f.nextUlt = t + (row.ultEvery[f.ph] || 60) * 1000;
    d.startUlt(m, k, t, u);
    return 99; // (ends when the ultimate does: tick watches m.act)
  }
  // the ultimate goes off: which plates are safe (crusted now, or left dark), then the rest are left molten
  function ultLands(m, k, t) {
    const f = m.fin, u = m.ult;
    const crusted = f.plates.map((p, i) => (p.st === 'k' && !f.enr ? i : -1)).filter((i) => i >= 0);
    u.safe = u.kind === 'eruption' ? [...new Set([...crusted, ...u.dark])].sort((a, b) => a - b) : crusted;
    d.ultGoesOff(m, k, t);
    for (let i = 0; i < PLATES; i++) if (!u.safe.includes(i)) melt(m, i, true);
    if (u.kind === 'eruption') f.press = u.full ? Math.min(f.press, PRESS_AFTER) : Math.max(0, f.press - ERUPT_LET);
    f.full = false;
    f.dirty = true;
  }

  // the room's own clocks: the plates' timers and their heat, the vents, the pressure, the brood, the enrage's plates
  function room(m, k, here, dt, t) {
    const f = m.fin, list = fighters(m, here);
    for (const [i, p] of f.plates.entries()) {
      if (p.st === 'g' && t >= p.until) setPlate(m, i, 'm', PLATE_COOL_S);
      else if (p.st === 'm' && p.until && t >= p.until && !f.stuck.has(i)) setPlate(m, i, 'c', 0);
      else if (p.st === 'k' && t >= p.until) setPlate(m, i, 'c', 0);
    }
    for (const v of f.vents) {
      if (v.st === 'o' && t >= v.until) Object.assign(v, { st: 's', until: t + VENT_SHUT_S * 1000 });
      else if (v.st === 's' && t >= v.until && !f.enr) Object.assign(v, { st: 'r', fill: 0, until: 0 });
      else continue;
      f.dirty = true;
    }
    // the pressure climbs (not while an ultimate is going off)
    if (m.act !== 'ult') addPress(m, PRESS_RATE[f.ph] * dt);
    // the heat: every PLATE_TICK_S, anyone on the floor over a hot plate (or on a low ledge under the iron)
    if (t >= f.tickAt) {
      f.tickAt = t + PLATE_TICK_S * 1000;
      const n = flood(f), ledges = ledgesFlooded(f.ph, f.press);
      for (const [qid, q] of list) {
        if (q.state.room !== m.room) continue;
        const x = q.state.x, y = q.state.y;
        if ((onFloor(y) && plateHot(f.plates[plateAt(x)].st, plateAt(x), n)) || (ledges && onLowLedge(x, y))) d.hurt(qid, q, d.stats(q).maxHp * MOLTEN_HP, x, undefined, 0, false, m, 'dot');
      }
    }
    // the brood: cinder whelps out of the hot plates
    if (f.ph >= 1 && f.broodAt && t >= f.broodAt && m.act !== 'ult') {
      f.broodAt = t + BROOD_EVERY * 1000;
      const hots = [...Array(PLATES).keys()].filter((i) => hot(f, i));
      const n = Math.min(BROOD_BASE + Math.floor(hots.length / BROOD_PER), d.addsCap(m) - d.minionsOf(m, k.minion));
      for (let j = 0; j < n && hots.length; j++) {
        const i = pick(hots), x = Math.round(plateMid(i) + rand(-PLATE_W * 0.3, PLATE_W * 0.3));
        d.addMinion(m, x);
        d.bossEvent(m, 'brood', { px: x });
      }
    }
    // the enrage: one more plate molten for good every ENRAGE_PLATE_S
    if (f.enr && t >= f.rageAt) {
      f.rageAt = t + ENRAGE_PLATE_S * 1000;
      const left = [...Array(PLATES).keys()].filter((i) => !f.stuck.has(i));
      if (left.length) {
        const i = pick(left);
        f.stuck.add(i);
        setPlate(m, i, 'm', 0);
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
      f.at = t + 3000; // (it rises out of the hearth while the title card is up)
      f.tickAt = t + 1000;
      m.x = TY_MID;
    }
    const ph = finalPhase(row, m.hp / m.maxHp);
    if (ph > f.ph) enterPhase(m, k, ph, t);
    if (!f.enr && t >= f.enrAt) enrage(m, t);
    if (!m.ultArmed && m.hp / m.maxHp < d.ULT_FIRST) [m.ultArmed, f.nextUlt] = [true, Math.max(f.nextUlt, t + 3000)];
    // a Bellows landed: a little pressure out (and an unfilled Inhale's second breath out comes after it)
    if ((m.pulseN | 0) !== f.pulseSeen) {
      f.pulseSeen = m.pulseN | 0;
      addPress(m, -BELLOWS_LET);
      if (f.pulse2) [f.pulse2, m.pulseAt] = [false, t + 600];
    }
    // the Inhale: the tooth filled (the weak point gone before its time: the long stagger, all the pressure out), or the
    // breath out comes (a double Bellows, every plate glowing)
    if (f.inhale) {
      if (t >= f.inhale.until) {
        f.inhale = null;
        if (m.weak?.gaze) [m.weak, m.partyDirty] = [null, true];
        pose(f, 'bellows');
        m.pulseAt = t;
        f.pulse2 = true;
        for (let i = 0; i < PLATES; i++) if (f.plates[i].st !== 'k') melt(m, i);
        d.bossEvent(m, 'inhaleOut');
      } else if (m.weak !== f.inhale.w) {
        f.inhale = null;
        f.press = 0;
        f.dirty = true;
        pose(f, 'stag');
        d.bossEvent(m, 'inhaleBroken');
        if (!f.gap) f.at = Math.min(f.at, t);
      }
    }
    if (f.enr && t >= f.bellowsAt && !m.pulseHit && m.act !== 'ult') {
      f.bellowsAt = t + ENRAGE_BREATH_S * 1000;
      m.pulseAt = t; // (twice as often as the loop's own)
    }
    room(m, k, here, dt, t);
    if (f.dirty && t - f.sentAt > 120) send(m);
    else if (t - f.sentAt > 1000) send(m);
    // a sweep in progress: its body goes where the coils take it
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
        ultLands(m, k, t);
      } else if (m.phase === 'act' && m.timer <= 0) {
        [m.act, m.ult, m.phase, f.gap, f.at] = [null, null, 'walk', true, t + FINAL_GAP_S[f.ph] * 1000];
        pose(f, 'idle');
      }
      return 0;
    }
    if (!f.gap && f.at === Infinity) { // (an ultimate was interrupted: interruptUlt dropped it)
      [f.gap, f.at, f.full] = [true, t + 1000, false];
      pose(f, 'stag');
    }
    if (m.staggerUntil > t) {
      pose(f, 'stag');
      return 0;
    }
    if (t < f.at) return f.gap && f.ph >= 3 ? walk(m, k) : 0;
    if (!f.gap) {
      // the move's time is up: its opening
      m.phase = 'walk';
      m.act = null;
      f.gap = true;
      f.at = t + FINAL_GAP_S[f.ph] * (f.enr ? 0.7 : 1) * 1000;
      pose(f, 'idle');
      return 0;
    }
    if (!fighters(m, here).length) return 0;
    // the next move: full pressure (the hearth goes up, no wind-up a freeze can stop), an ultimate due (phases 1–3), else
    // the loop's next step
    let name, full = false;
    if (f.press >= PRESS_MAX && !f.enr) [name, full] = ['ult', true];
    else if ((f.ph < 3 || m.forceUlt != null) && m.ultArmed && t >= f.nextUlt) name = 'ult';
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
    f.full = full;
    const s = name === 'ult' ? ult(m, k, t, full) : move(m, k, here, name, t);
    f.at = name === 'ult' ? Infinity : t + s * 1000;
    return 0;
  }
  // phase 4, in an opening: it hauls itself after the watched slime (or its target) on its coils
  function walk(m, k) {
    const q = watched(m) ?? m.target;
    if (!q) return 0;
    const want = Math.max(BODY_EDGE, Math.min(FIN_W - BODY_EDGE, q.state.x - Math.sign(q.state.x - m.x) * 160));
    return Math.abs(want - m.x) > 20 ? Math.sign(want - m.x) * k.speed : 0;
  }

  // ——— hits ———
  const targetable = (f, slot) => (slot < PLATE_SLOT ? f.vents[slot]?.st === 'r' : slot - PLATE_SLOT < PLATES && !f.enr && hot(f, slot - PLATE_SLOT));
  // what a hit from p with flag code (h[4]: 1 the tooth, 2 + slot a vent or a plate's ring) can be on → { weak } |
  // { prop: slot } | 'body' | null. Arrows and spells reach a vent at any height; a plate's ring only from beside it
  // (on the floor, in reach): the far answer to a hot plate is frost (frost()).
  function part(m, p, code, arrow, range, magic = false) {
    const f = m.fin, k = d.MOBS[m.kind], x = p.state.x, y = p.state.y;
    if (f && code === 1 && m.weak) {
      const s = d.weakOf(k, m.x, m.y, m.dir);
      if (headReach(s, x, y, range, arrow, SLACK)) return { weak: true };
    }
    if (f && code >= 2 && targetable(f, code - 2)) {
      const slot = code - 2, s = tySpot(slot), vent = slot < PLATE_SLOT;
      if (vent ? headReach(s, x, y, range, arrow || magic, SLACK) : headReach(s, x, y, Math.min(range, s.r + PLATE_REACH + 60), false, SLACK)) return { prop: slot };
    }
    return Math.abs(m.x - x) <= range + k.w / 2 + SLACK ? 'body' : null;
  }
  // a hit for dmg landed on a vent or a plate's ring (part()'s { prop }): fills its ring; a frost hit on a hot plate
  // crusts it at once
  function hitHead(m, pt, dmg, id, p, { frost = false } = {}) {
    const f = m.fin, slot = pt.prop;
    if (!f || slot === undefined || !targetable(f, slot)) return;
    if (slot < PLATE_SLOT) {
      const v = f.vents[slot];
      v.fill += dmg;
      f.dirty = true;
      if (v.fill >= v.max) {
        // it opens: the pressure drops a big step, and fire roars out of it a moment later
        const V = VENTS[slot], band = V.low ? VENT_LOW_BAND : VENT_HIGH_BAND;
        Object.assign(v, { st: 'o', fill: 0, until: now() + (VENT_DELAY + VENT_BLAST_S) * 1000 });
        addPress(m, -VENT_DROP);
        d.bossEvent(m, 'ventOpen', { slot, by: id });
        d.bossEvent(m, 'beam', { style: 'vent', bx: V.x, dir: -V.side, y0: band[0], y1: band[1], len: VENT_LEN, warn: VENT_DELAY, dur: VENT_BLAST_S });
      }
      return;
    }
    const i = slot - PLATE_SLOT, pl = f.plates[i];
    if (frost) return void crust(m, i, id, 'frost');
    pl.fill += dmg;
    f.dirty = true;
    if (pl.fill >= pl.max) crust(m, i, id, 'ring');
  }
  // a frost hit by p landed on something in the den (server/rpg.js applyHits): every hot plate in its reach crusts at once
  // (the plate under the caster, and those from it toward dir out to range)
  function frost(m, p, dir, range) {
    const f = m.fin;
    if (!f || f.enr) return;
    const x = p.state.x, a = Math.min(x, x + dir * range), b = Math.max(x, x + dir * range);
    for (let i = 0; i < PLATES; i++) {
      const lo = i * PLATE_W, hi = lo + PLATE_W;
      if ((hi > a && lo < b) || i === plateAt(x)) crust(m, i, null, 'frost');
    }
  }
  return { tick, part, hitHead, send, frost };
}
