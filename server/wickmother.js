// Docs: docs/places/wickmother.md, docs/combat/bosses.md
// The Wickmother's brain (L5 (c), story/l5-plan.md), the final-boss engine's 'moth' brain (server/final.js picks it from
// FINAL.wickmother.brain): the same four written loops, enrage and S5 hookup as Ladon's, Fenrir's and Typhon's, with her
// own mechanics: the eight hall lanterns (lit / out / party-lit) and the Hold (every lit one takes a share off each hit on
// her: hold()), Kindle and her moths relighting them (son(): the moths' brain), the silk walls closing in phase 3, and
// phase 4's dark with her own light the only light but the lanterns the party lights. Constants: src/shared/wickmother.js.
// → the room: {t:'final', fb:'wickmother', id, ph, enr, po: her pose, sw: the silk walls' reach from each end (px), lp:
// [[state 'l'|'o'|'p', ring %, ms left]] (the hall lanterns), kd: the lantern she's kindling (-1: none)}
import { FINAL, finalPhase, FINAL_ENRAGE_MIN, FINAL_ULT_WARN, FINAL_GAP_S, FIN_W, FIN_FLOOR, headReach } from '../src/shared/final.js';
import {
  WM_MID, HALL_LAMPS, LAMP_RING, holdMult, KINDLE_WARN, MOTHS_EVERY, MOTHS_BASE, MOTHS_PER_DARK, RELIGHT_S, SILK_STEP, SILK_STEPS, SILK_HP, SILK_TICK_S, inSilk,
  DARK_HP, DARK_RAGE_MIN, ROOM_LIGHT_S, inLightP4, MOTHER_LIGHT_R, EYES_S, STOOP_WARN, STOOP_FALL, STOOP_REST, FEINT_CHANCE, FEINT_AGAIN, SNARE_OFF, STOOP_R,
  LINE_WARN, LINE_FLOOR, LINE_LEDGE, RAIN_N, RAIN_GAP, RAIN_WARN, DRAW_S, DRAW_WEAK, BODY_EDGE, RIB_RANGE, ENRAGE_HUSH_S, SOULS_DARK, NIGHT_SPEED, wickSpot,
} from '../src/shared/wickmother.js';
import { SNARE_R } from '../src/shared/challenge.js';

const ENRAGE_MS = (Number(process.env.TEST_ENRAGE_MIN) || FINAL_ENRAGE_MIN) * 60_000; // (tests only: sooner)
const SLACK = 60;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clampX = (x) => Math.max(60, Math.min(FIN_W - 60, x));
const MOTH = 'hall_moth', MOTH_HARRY = 62; // (her moths' kind, and the height they hang at when there's nothing to light)

// d: what it needs from server/rpg.js's closure (all lazy, called at tick time)
export function createMoth(d) {
  const { now } = d;
  const ringOf = (k, share) => Math.max(1, Math.round(k.hp * d.TEST_BOSS_HP * share));

  function init(m, k) {
    return {
      row: k.final, ph: 0, loop: 0, step: 0, at: 0, gap: true, start: 0, enrAt: 0, enr: false, sentAt: 0, dirty: true, ultN: 0, nextUlt: 0,
      pulseSeen: m.pulseN | 0, shieldAlt: 0, hushAt: 0, pose: 'crown', mv: null, kindle: null, draw: null, pulse2: false,
      lamps: HALL_LAMPS.map(() => ({ st: 'l', fill: 0, max: ringOf(k, LAMP_RING), until: 0 })),
      silk: 0, sw: 0, silkAt: 0, darkAt: 0, mothAt: 0, home: WM_MID,
    };
  }
  // → the room
  function send(m) {
    const f = m.fin, t = now();
    f.sentAt = t;
    f.dirty = false;
    d.toRoom(m.room)({
      t: 'final', fb: 'wickmother', id: m.id, ph: f.ph, enr: f.enr ? 1 : 0, po: f.pose, sw: Math.round(f.sw), kd: f.kindle ? f.kindle.i : -1,
      lp: f.lamps.map((l) => [l.st, Math.round((l.fill / l.max) * 100), l.until > t ? Math.round(l.until - t) : 0]),
    });
  }
  const pose = (f, p) => {
    if (f.pose !== p) [f.pose, f.dirty] = [p, true];
  };
  const lit = (f) => f.lamps.filter((l) => l.st === 'l').length;
  // the Hold (server/rpg.js applyHits, on hits on her body): every lit lantern takes a share off
  const hold = (m) => (m.fin ? holdMult(lit(m.fin)) : 1);
  // a lantern changes: 'l' lit (by 'kindle' | 'moth' | 'rage'), 'o' out (by 'ring' | 'holy' | 'frost' | 'phase' | 'draw'
  // | 'dim': a party light burning down), 'p' party-lit (phase 4, by 'fire' | 'ring')
  function setLamp(m, i, st, by, extra = {}) {
    const f = m.fin, l = f.lamps[i];
    if (!l || l.st === st) return false;
    Object.assign(l, { st, fill: 0, until: st === 'p' ? now() + ROOM_LIGHT_S * 1000 : 0 });
    f.dirty = true;
    d.bossEvent(m, st === 'o' ? 'lampOut' : 'lampLit', { i, by, party: st === 'p' ? 1 : 0, ...extra });
    // phase 3: a light let go burns a hole through the silk (the walls back a step); one relit lets them on a step
    if (f.ph === 2 && st === 'o' && (by === 'ring' || by === 'holy' || by === 'frost')) silkStep(m, -1);
    return true;
  }
  function silkStep(m, n) {
    const f = m.fin;
    if (f.ph !== 2 || f.enr) return;
    const was = f.silk;
    f.silk = Math.max(0, Math.min(SILK_STEPS, f.silk + n));
    if (f.silk !== was) {
      f.dirty = true;
      d.bossEvent(m, 'silkStep', { n: f.silk, dir: Math.sign(f.silk - was) });
    }
  }
  // slide her body from where it is to x over ms (a stoop, the climb back, a drift along the ribs)
  const slide = (m, x, ms) => (m.fin.mv = { x0: m.x, x1: x, at: now(), ms });
  const homeX = (f) => (f.ph >= 3 ? null : f.ph === 0 ? WM_MID : f.home);
  function enterPhase(m, k, ph, t) {
    const f = m.fin;
    f.ph = ph;
    f.loop = f.step = 0;
    m.stage = Math.min(2, ph);
    f.nextUlt = Math.max(f.nextUlt, t + 8000);
    if (ph >= 1 && !f.mothAt) f.mothAt = t + MOTHS_EVERY * 500;
    if (ph === 2) [f.silk, f.silkAt] = [1, t + 1000]; // (the silk comes down off the roof and starts wrapping the Hall)
    if (ph === 3) {
      // the Last Light: she takes every light into herself; the silk falls away
      f.silk = 0;
      f.kindle = null;
      for (let i = 0; i < f.lamps.length; i++) setLamp(m, i, 'o', 'phase');
      f.darkAt = t + 1500;
      d.bossEvent(m, 'lastLight');
    }
    f.dirty = true;
    d.bossEvent(m, 'phase', { n: ph + 1 });
    d.bossSays(m, k.lines?.phase?.[ph - 1]);
  }
  function enrage(m, t) {
    const f = m.fin;
    f.enr = true;
    m.enraged = true;
    f.hushAt = t + ENRAGE_HUSH_S * 1000;
    for (let i = 0; i < f.lamps.length; i++) if (f.lamps[i].st !== 'p') setLamp(m, i, 'l', 'rage');
    f.dirty = true;
    d.bossEvent(m, 'finalRage');
  }
  const watched = (m) => (m.focus && m.focus.until > now() ? m.focus.p : null);
  const fighters = (m, here) => here.filter(([, q]) => !q.faintUntil);
  const face = (m, x) => (m.dir = Math.sign(x - m.x) || m.dir);
  const seenBy = (list, type) => {
    for (const [, q] of list) d.chalSeen(q, type);
  };

  // A Stoop at q (tx: where, warn: its wind-up) → how long it takes. A fake-out pulls up short and stoops again where q went.
  function stoop(m, q, warn, list, t, again = false) {
    const f = m.fin, tx = Math.round(clampX(q.state.x)), feint = !again && Math.random() < FEINT_CHANCE[f.ph];
    face(m, tx);
    pose(f, 'rise');
    d.bossEvent(m, 'stoop', { tx, dur: warn, r: STOOP_R });
    if (feint) {
      seenBy(list, 'feint');
      d.later(m, warn * 0.6 * 1000, () => {
        if (m.dead || f.pose !== 'rise') return;
        d.bossEvent(m, 'stoopFeint', { tx });
        d.later(m, 150, () => !m.dead && f.pose === 'rise' && stoop(m, watched(m) ?? q, FEINT_AGAIN + STOOP_FALL, list, now(), true));
      });
      return warn * 0.6 + 0.15 + FEINT_AGAIN + STOOP_FALL + STOOP_REST + 1;
    }
    const bx = Math.max(BODY_EDGE - 90, Math.min(FIN_W - BODY_EDGE + 90, tx));
    d.later(m, (warn - STOOP_FALL) * 1000, () => {
      if (m.dead || f.pose !== 'rise') return;
      pose(f, 'stoop');
      slide(m, bx, STOOP_FALL * 1000);
      d.later(m, STOOP_FALL * 1000, () => {
        if (m.dead) return;
        pose(f, 'spread');
        d.bossEvent(m, 'stoopHit', { tx, r: STOOP_R });
        // the strand: a snare either side of where she landed (a slime that dodged by a hair is caught)
        const marks = [-1, 1].map((s) => tx + s * (STOOP_R + SNARE_R + SNARE_OFF)).filter((x) => x > 60 && x < FIN_W - 60).map((x) => [Math.round(x), 0]);
        if (marks.length && Math.random() < 0.6) d.challenge(m, 'snare', { marks });
        // she lies there with her wings spread, then climbs back to the Crown (phases 1–3)
        d.later(m, STOOP_REST * 1000, () => {
          if (m.dead || f.pose !== 'spread') return;
          const h = homeX(f);
          if (h === null) return pose(f, 'walk');
          pose(f, 'climb');
          slide(m, h, 900);
          d.later(m, 900, () => !m.dead && f.pose === 'climb' && pose(f, f.ph === 0 ? 'crown' : 'ribs'));
        });
      });
    });
    return warn + STOOP_REST + (f.ph >= 3 ? 0.3 : 1.1);
  }

  // one move of the loop → how long it takes (s)
  function move(m, k, here, name, t) {
    const f = m.fin, ph = f.ph, w = watched(m), list = fighters(m, here);
    const aim = w ?? m.target ?? (list.length ? pick(list)[1] : null);
    if (name === 'eyes') {
      if (!list.length) return 0.5;
      if (!(m.tauntUntil > t && m.focus)) { // (a Knight's taunt holds it)
        const others = list.filter(([, q]) => q !== m.focusLast);
        const [id, p] = pick(others.length ? others : list);
        m.focus = { p, id, until: t + EYES_S * 1000 };
        m.focusLast = p;
        d.sendParty(m);
      }
      d.bossEvent(m, 'watch', { to: m.focus.id });
      return 1.4;
    }
    if (name === 'stoop') return aim ? stoop(m, aim, STOOP_WARN[ph], list, t) : 0.3;
    if (name === 'kindle') {
      // the out lantern nearest her (a beat early: its wick glows first); none out: nothing to do
      const outs = f.lamps.map((l, i) => (l.st === 'o' ? i : -1)).filter((i) => i >= 0).sort((a, b) => Math.abs(HALL_LAMPS[a].x - m.x) - Math.abs(HALL_LAMPS[b].x - m.x));
      if (!outs.length || f.enr || ph >= 3) return 0.3;
      const i = outs[0];
      face(m, HALL_LAMPS[i].x);
      pose(f, 'kindle');
      f.kindle = { i, at: t, until: t + KINDLE_WARN * 1000 };
      f.dirty = true;
      d.bossEvent(m, 'kindle', { i, dur: KINDLE_WARN });
      return KINDLE_WARN + 0.6;
    }
    if (name === 'hush') {
      pose(f, 'hush');
      m.pulseAt = t; // (partyTick warns and lands it: the pulse, looks.pulse 'hush')
      return d.PULSE_WARN + 0.8;
    }
    if (name === 'wings' || name === 'cocoon' || name === 'both' || name === 'shield') {
      const kind = name === 'wings' ? 'armour' : name === 'cocoon' ? 'barrier' : name === 'both' ? 'both' : (f.shieldAlt++ % 2 ? 'barrier' : 'armour');
      pose(f, kind === 'barrier' ? 'cocoon' : 'fold');
      if (!m.shield) d.shieldUp(m, k, kind, t);
      return 1.6;
    }
    if (name === 'line') {
      if (aim) face(m, aim.state.x);
      const high = aim ? aim.state.y < FIN_FLOOR - 60 !== Math.random() < 0.25 : Math.random() < 0.5; // (mostly at the watched slime's height)
      const band = high ? LINE_LEDGE : LINE_FLOOR, bx = m.dir > 0 ? 0 : FIN_W; // (drawn across from the wall behind her)
      pose(f, 'line');
      d.bossEvent(m, 'beam', { style: 'silk', bx, dir: m.dir, y0: band[0], y1: band[1], len: FIN_W, warn: LINE_WARN, dur: 0.6 });
      return LINE_WARN + 0.9;
    }
    if (name === 'rain') {
      if (!aim) return 0.3;
      // little lanterns fall in a line from under her toward the watched slime (and one right on them)
      const dir = Math.sign(aim.state.x - m.x) || m.dir, marks = [];
      for (let i = 1; i <= RAIN_N; i++) {
        const x = m.x + dir * i * RAIN_GAP * 0.9;
        if (x > 40 && x < FIN_W - 40) marks.push(Math.round(x));
      }
      marks.push(Math.round(clampX(aim.state.x)));
      for (const [, q] of list) if (q !== aim && Math.random() < 0.5) marks.push(Math.round(clampX(q.state.x)));
      pose(f, 'rain');
      d.bossEvent(m, 'rain', { marks, dur: RAIN_WARN });
      d.later(m, RAIN_WARN * 1000, () => !m.dead && d.bossEvent(m, 'rainHit', { marks }));
      return RAIN_WARN + 0.8;
    }
    if (name === 'draw') {
      // Drawing the Light: the shard in her thorax is open while she pulls the light out of the lanterns
      pose(f, 'draw');
      f.draw = { until: t + DRAW_S * 1000 };
      m.weak = { at: t, until: f.draw.until, fill: 0, max: Math.max(1, Math.round(k.hp * d.TEST_BOSS_HP * d.weakHpOf(k) * DRAW_WEAK)), gaze: true };
      f.draw.w = m.weak;
      d.bossEvent(m, 'draw', { dur: DRAW_S });
      d.bossEvent(m, 'weakOpen');
      d.sendParty(m);
      return DRAW_S + 1;
    }
    // ——— her challenges (docs/combat/challenges.md) ———
    if (name === 'tether') {
      pose(f, 'line');
      return d.challenge(m, 'tether', { stage: ph }) ? 1.4 : 0.2;
    }
    if (name === 'rings') {
      pose(f, 'hush');
      return d.challenge(m, 'rings', { stage: ph }) ? 3.2 : 0.2;
    }
    if (name === 'rescue') {
      pose(f, 'line');
      return d.challenge(m, 'rescue', { stage: ph }) ? 1.6 : 0.2;
    }
    if (name === 'dark') {
      d.challenge(m, 'dark', { stage: ph });
      return 0.9;
    }
    if (name === 'ult') return ult(m, k, t);
    return 0.2;
  }
  // an ultimate: All Souls' Night (u.dark: the lanterns the wind-up leaves dark) or The Long Night (u.dir: the way the
  // silk rolls)
  function ult(m, k, t) {
    const f = m.fin, row = FINAL[f.row];
    const pin = m.forceUlt; // (the sandbox's Ultimate now: that one)
    m.forceUlt = null;
    const which = (pin != null && row.ults[pin]) || (f.ph >= row.alternateFrom ? row.ults[f.ultN++ % row.ults.length] : row.ults[0]);
    const u = { ...which, dur: FINAL_ULT_WARN };
    if (u.kind === 'souls') {
      // the two it leaves dark: lit ones first (so there's always somewhere), never side by side if it can help it
      const order = [...HALL_LAMPS.keys()].sort((a, b) => (f.lamps[a].st !== 'o' ? 0 : 1) - (f.lamps[b].st !== 'o' ? 0 : 1) || Math.random() - 0.5);
      const dark = [order[0]];
      for (const i of order.slice(1)) if (dark.length < SOULS_DARK && Math.abs(i - dark[0]) > 1) dark.push(i);
      for (const i of order) if (dark.length < SOULS_DARK && !dark.includes(i)) dark.push(i);
      u.dark = dark.sort((a, b) => a - b);
    } else {
      u.dir = Math.random() < 0.5 ? 1 : -1;
      u.x0 = u.dir > 0 ? 0 : FIN_W;
      u.speed = NIGHT_SPEED;
    }
    pose(f, u.kind === 'souls' ? 'open' : 'pull');
    m.act = 'ult';
    m.phase = 'warn';
    f.nextUlt = t + (row.ultEvery[f.ph] || 60) * 1000;
    d.startUlt(m, k, t, u);
    return 99; // (ends when the ultimate does: tick watches m.act)
  }
  // the ultimate goes off: All Souls' Night burns every strip whose lantern is lit (hers or the party's) and wasn't left
  // dark, and in phase 4 everything in her own light too; u.safe: the strips that are spared
  function ultLands(m, k, t) {
    const f = m.fin, u = m.ult;
    if (u.kind === 'souls') u.safe = HALL_LAMPS.map((l, i) => i).filter((i) => (f.lamps[i].st === 'o' || u.dark.includes(i)) && !(f.ph >= 3 && Math.abs(HALL_LAMPS[i].x - m.x) < MOTHER_LIGHT_R));
    d.ultGoesOff(m, k, t);
    f.dirty = true;
  }

  // the room's own clocks: the party's lights burning down, Kindle, the moths, the silk walls, the dark
  function room(m, k, here, dt, t) {
    const f = m.fin, list = fighters(m, here);
    for (const [i, l] of f.lamps.entries()) if (l.st === 'p' && t >= l.until) setLamp(m, i, 'o', 'dim');
    // Kindle: her wing tip reaches the lantern (frozen, stunned or dazed meanwhile: it doesn't happen)
    if (f.kindle && t >= f.kindle.until) {
      const kd = f.kindle, stopped = m.frozenUntil > kd.at || m.stunUntil > kd.at || m.staggerUntil > kd.at;
      f.kindle = null;
      f.dirty = true;
      if (stopped) d.bossEvent(m, 'kindleStopped', { i: kd.i });
      else if (f.lamps[kd.i].st === 'o' && setLamp(m, kd.i, 'l', 'kindle')) silkStep(m, 1);
    }
    // the moths: down out of the roof, more the more lanterns are out
    if (f.ph >= 1 && f.ph < 3 && f.mothAt && t >= f.mothAt && m.act !== 'ult') {
      f.mothAt = t + MOTHS_EVERY * 1000;
      const out = f.lamps.map((l, i) => (l.st === 'o' ? i : -1)).filter((i) => i >= 0);
      const n = Math.min(MOTHS_BASE + Math.floor(out.length / MOTHS_PER_DARK), d.addsCap(m) - d.minionsOf(m, MOTH));
      for (let j = 0; j < n; j++) {
        const x = Math.round(clampX((out.length ? HALL_LAMPS[pick(out)].x : rand(200, FIN_W - 200)) + rand(-80, 80)));
        const q = d.addAdd(m, MOTH, x);
        if (q) d.bossEvent(m, 'moths', { px: x });
      }
    }
    // the silk walls (phase 3): ease toward their step, and anyone inside them hurts
    const want = f.ph === 2 && !m.dead ? f.silk * SILK_STEP : 0;
    if (f.sw !== want) {
      const was = f.sw;
      f.sw += Math.sign(want - f.sw) * Math.min(Math.abs(want - f.sw), (want > f.sw ? 110 : 260) * dt);
      if (Math.round(was) !== Math.round(f.sw) && t - f.sentAt > 250) f.dirty = true;
    }
    if (f.sw > 1 && t >= f.silkAt) {
      f.silkAt = t + SILK_TICK_S * 1000;
      for (const [qid, q] of list) if (q.state.room === m.room && inSilk(f.sw, q.state.x)) d.hurt(qid, q, d.stats(q).maxHp * SILK_HP, q.state.x, undefined, 0, false, m, 'dot');
    }
    // phase 4: the dark's cold, everywhere outside her light and the party's lanterns
    if (f.ph >= 3 && t >= f.darkAt) {
      f.darkAt = t + 1000;
      const share = DARK_HP + (f.enr ? DARK_RAGE_MIN * Math.max(0, (t - f.enrAt) / 60_000) : 0), sts = f.lamps.map((l) => l.st);
      for (const [qid, q] of list) if (q.state.room === m.room && !inLightP4(m.x, sts, q.state.x)) d.hurt(qid, q, d.stats(q).maxHp * share, q.state.x, undefined, 0, false, m, 'dot');
    }
  }

  // every tick for a final boss (instead of bossBrain) → how fast it walks
  function tick(m, k, here, dt, t) {
    const f = (m.fin ??= init(m, k)), row = FINAL[f.row];
    if (!f.start) {
      f.start = t;
      f.enrAt = t + (m.enrLeft ?? ENRAGE_MS); // (m.enrLeft: its enrage clock from before a restart, server/rpg.js restoreBosses)
      m.enrLeft = undefined;
      f.at = t + 3000; // (she unfolds round the Crown while the title card is up)
      m.x = WM_MID;
    }
    const ph = finalPhase(row, m.hp / m.maxHp);
    if (ph > f.ph) enterPhase(m, k, ph, t);
    if (!f.enr && t >= f.enrAt) enrage(m, t);
    if (!m.ultArmed && m.hp / m.maxHp < d.ULT_FIRST) [m.ultArmed, f.nextUlt] = [true, Math.max(f.nextUlt, t + 3000)];
    // a Hush landed: in phase 3 the silk comes on a step; an unfilled Drawing's second Hush comes after it
    if ((m.pulseN | 0) !== f.pulseSeen) {
      f.pulseSeen = m.pulseN | 0;
      silkStep(m, 1);
      if (f.pulse2) [f.pulse2, m.pulseAt] = [false, t + 600];
    }
    // Drawing the Light: the shard filled (the weak point gone before its time: the long stagger, the lanterns stay lit),
    // or she has it all (a double Hush, every lantern out)
    if (f.draw) {
      if (t >= f.draw.until) {
        f.draw = null;
        if (m.weak?.gaze) [m.weak, m.partyDirty] = [null, true];
        pose(f, 'hush');
        m.pulseAt = t;
        f.pulse2 = true;
        for (let i = 0; i < f.lamps.length; i++) setLamp(m, i, 'o', 'draw');
        d.bossEvent(m, 'drawn');
      } else if (m.weak !== f.draw.w) {
        f.draw = null;
        pose(f, 'stag');
        d.bossEvent(m, 'drawBroken');
        if (!f.gap) f.at = Math.min(f.at, t);
      }
    }
    if (f.enr && t >= f.hushAt && !m.pulseHit && m.act !== 'ult') {
      f.hushAt = t + ENRAGE_HUSH_S * 1000;
      m.pulseAt = t; // (twice as often as the loop's own)
    }
    room(m, k, here, dt, t);
    if (f.dirty && t - f.sentAt > 120) send(m);
    else if (t - f.sentAt > 1000) send(m);
    // a slide in progress (a stoop, the climb back, a drift): her body goes where the move takes it
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
        pose(f, idle(f));
      }
      return 0;
    }
    if (!f.gap && f.at === Infinity) { // (an ultimate was interrupted: interruptUlt dropped it)
      [f.gap, f.at] = [true, t + 1000];
      pose(f, 'stag');
    }
    if (m.staggerUntil > t) {
      pose(f, 'stag');
      if (f.kindle) {
        d.bossEvent(m, 'kindleStopped', { i: f.kindle.i });
        [f.kindle, f.dirty] = [null, true];
      }
      return 0;
    }
    if (t < f.at) return f.gap ? walk(m, k, f) : 0;
    if (!f.gap) {
      // the move's time is up: its opening
      m.phase = 'walk';
      m.act = null;
      f.gap = true;
      f.at = t + FINAL_GAP_S[f.ph] * (f.enr ? 0.7 : 1) * 1000;
      if (f.pose !== 'spread' && f.pose !== 'climb') pose(f, idle(f));
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
  const idle = (f) => (f.ph === 0 ? 'crown' : f.ph >= 3 ? 'walk' : 'ribs');
  // in an opening: phase 2–3 she drifts along the ribs toward the watched slime (within RIB_RANGE of the middle); phase 4
  // she walks the floor after it
  function walk(m, k, f) {
    const q = watched(m) ?? m.target;
    if (!q || f.ph === 0 || f.pose === 'spread' || f.pose === 'climb') return 0;
    if (f.ph < 3) {
      const want = Math.max(WM_MID - RIB_RANGE, Math.min(WM_MID + RIB_RANGE, q.state.x));
      f.home = m.x;
      return Math.abs(want - m.x) > 30 ? Math.sign(want - m.x) * k.speed * 0.6 : 0;
    }
    const want = Math.max(BODY_EDGE, Math.min(FIN_W - BODY_EDGE, q.state.x - Math.sign(q.state.x - m.x) * 150));
    return Math.abs(want - m.x) > 20 ? Math.sign(want - m.x) * k.speed : 0;
  }

  // ——— hits ———
  // can lantern slot be hit now? phases 1–3 a lit one (to let it go); phase 4 an out one (to light it); never once enraged
  const targetable = (f, slot) => !f.enr && slot >= 0 && slot < f.lamps.length && f.lamps[slot].st === (f.ph >= 3 ? 'o' : 'l');
  // what a hit from p with flag code (h[4]: 1 the shard, 2 + slot a hall lantern) can be on → { weak } | { prop: slot } |
  // 'body' | null. Arrows and spells reach a lantern at any height; anything else needs the body near its height.
  function part(m, p, code, arrow, range, magic = false) {
    const f = m.fin, k = d.MOBS[m.kind], x = p.state.x, y = p.state.y;
    if (f && code === 1 && m.weak) {
      const s = d.weakOf(k, m.x, m.y, m.dir);
      if (headReach(s, x, y, range, arrow, SLACK)) return { weak: true };
    }
    if (f && code >= 2 && targetable(f, code - 2) && headReach(wickSpot(code - 2), x, y, range, arrow || magic, SLACK)) return { prop: code - 2 };
    return Math.abs(m.x - x) <= range + k.w / 2 + SLACK ? 'body' : null;
  }
  // a hit for dmg landed on a hall lantern (part()'s { prop }): phases 1–3, a holy or frost hit lets it go at once, any
  // other fills its ring; phase 4, a fire or holy hit lights it at once, any other fills its ring
  function hitHead(m, pt, dmg, id, p, { fire = false, frost = false, holy = false } = {}) {
    const f = m.fin, i = pt.prop;
    if (!f || i === undefined || !targetable(f, i)) return;
    const l = f.lamps[i];
    if (f.ph >= 3) {
      if (fire) return void setLamp(m, i, 'p', 'fire', { who: id });
      l.fill += dmg;
      f.dirty = true;
      if (l.fill >= l.max) setLamp(m, i, 'p', 'ring', { who: id });
      return;
    }
    if (holy || frost) return void setLamp(m, i, 'o', holy ? 'holy' : 'frost', { who: id });
    l.fill += dmg;
    f.dirty = true;
    if (l.fill >= l.max) setLamp(m, i, 'o', 'ring', { who: id });
  }

  // her moths (stepMob runs this for a mob with `son: 'moth'`) → how fast it flies: to the nearest out lantern no other
  // moth is after, up to its height, then it relights it in RELIGHT_S unless something stops it there; with none out it
  // harries the slimes
  function son(m, k, here, dt, t) {
    const b = d.mobById(m.by), f = b?.fin;
    if (!f || b.dead) return 0;
    if (m.sw) {
      const at = m.sw.at, stopped = m.frozenUntil > at || m.stunUntil > at || m.snareUntil > at || (m.knockAt ?? 0) > at;
      if (stopped || f.lamps[m.sw.i].st !== 'o' || f.enr || f.ph >= 3) {
        if (stopped) d.bossEvent(b, 'mothStopped', { i: m.sw.i });
        m.sw = null;
        m.restUntil = t + 1500;
        return 0;
      }
      if (t >= m.sw.until) {
        const i = m.sw.i;
        m.sw = null;
        setLamp(b, i, 'l', 'moth');
      }
      return 0;
    }
    if (m.restUntil > t) return 0;
    const moths = (d.mobsIn?.(m.room) ?? []).filter((q) => q !== m && q.kind === MOTH && !q.dead);
    const taken = new Set(moths.map((q) => q.sw?.i ?? q.goal));
    let best = -1, bd = Infinity;
    if (f.ph < 3) for (const [i, l] of HALL_LAMPS.entries()) if (f.lamps[i].st === 'o' && !taken.has(i) && Math.abs(l.x - m.x) < bd) [best, bd] = [i, Math.abs(l.x - m.x)];
    m.goal = best;
    if (best < 0) {
      m.hover = MOTH_HARRY;
      const q = m.target;
      return q ? (Math.abs(q.state.x - m.x) > 10 ? Math.sign(q.state.x - m.x) * k.speed * 0.8 : 0) : 0;
    }
    const L = HALL_LAMPS[best];
    m.hover = Math.max(20, FIN_FLOOR - L.y - 10); // (up to the lantern's height)
    const dx = L.x - m.x;
    if (Math.abs(dx) < 14) {
      m.sw = { i: best, at: t, until: t + RELIGHT_S * 1000 };
      m.vx = 0;
      d.bossEvent(b, 'mothRelight', { i: best, sid: m.id, dur: RELIGHT_S });
      return 0;
    }
    return Math.sign(dx) * k.speed;
  }
  return { tick, part, hitHead, send, son, hold };
}
