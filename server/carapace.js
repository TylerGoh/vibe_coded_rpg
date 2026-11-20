// Docs: docs/places/carapace.md, docs/combat/bosses.md
// Old Carapace's brain (atlas Phase 9, A5 (c), story/a5-plan.md), the final-boss engine's 'shell' brain (server/final.js
// picks it from FINAL.old_carapace.brain): the same four written loops, enrage and S5 hookup as the other final bosses', with
// its own mechanics: the Stride (his footfalls on a fixed period, each jolting its half of the shell's floor; quicker every
// loop of phase 3 unless the town drinks, quick in phase 4), the Well (waterskins dropped off the tents, carried and thrown
// into the dry well: A22's carry with a target, server/challenge.js; WELL_N in and the town drinks: he stops walking,
// staggers and softens, hold()), the mirages drinking it back (son(): their brain), Lie Down in phase 4 (the shard open in
// the well; unfilled, the Trample) and two ultimates on the shared `wave` and `nova`. Constants: src/shared/carapace.js.
// → the room: {t:'final', fb:'old_carapace', id, ph, enr, po: its pose, sp: the stride's phase now (0..1), ss: its period (s),
// wl: the well (0..WELL_N), op: ms of the drink's window left, dr: drinks the town has had, st: phase 3's quickening steps}
import { FINAL, finalPhase, FINAL_ENRAGE_MIN, FINAL_ULT_WARN, FINAL_GAP_S, FIN_W, headReach } from '../src/shared/final.js';
import {
  HEAD_X, WELL_X, STRIDE_S, STRIDE_HP, STRIDE_STEPS, STORM_STEPS, strideOf, strideHits, WATER_EVERY, WELL_N, SLAKE_S, SLAKE_STAGGER_S, SLAKE_MULT, SKIN_X,
  MIRAGE_EVERY, MIRAGE_BASE, MIRAGE_PER, DRINK_S, MIRAGE_X, LOOK_S, SNAP_WARN, SNAP_R, SNAP_LATE, SNAP_REST, STONES_N, STONES_GAP, STONES_WARN,
  REST_S, REST_WEAK, TRAMPLE_HP, ENRAGE_STAMP_S,
} from '../src/shared/carapace.js';

const ENRAGE_MS = (Number(process.env.TEST_ENRAGE_MIN) || FINAL_ENRAGE_MIN) * 60_000; // (tests only: sooner)
const SLACK = 60;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clampX = (x) => Math.max(60, Math.min(FIN_W - 60, x));
const MIRAGE = 'thirst_mirage'; // (its adds' kind)

// d: what it needs from server/rpg.js's closure (all lazy, called at tick time)
export function createShell(d) {
  const { now } = d;

  function init() {
    return {
      ph: 0, loop: 0, step: 0, at: 0, gap: true, start: 0, enrAt: 0, enr: false, sentAt: 0, dirty: true, ultN: 0, nextUlt: 0,
      pulseSeen: 0, shieldAlt: 0, stampAt: 0, pose: 'walk', rest: null,
      // the Stride: its phase (0..1, the hind foot lands at 0, the fore at 0.5), phase 3's steps
      sp: 0, steps: 0,
      // the Well
      wl: 0, slakeUntil: 0, drinks: 0, waterAt: 0, mirageAt: 0,
    };
  }
  // the stride's period now: phase 3 quickens a step a loop; phase 4 (into the storm) at STORM_STEPS; enraged, its quickest
  const period = (f) => strideOf(f.enr ? STRIDE_STEPS : f.ph >= 3 ? Math.max(STORM_STEPS, f.steps) : f.ph === 2 ? f.steps : 0);
  const slaked = (f) => f.slakeUntil > now();
  // → the room
  function send(m) {
    const f = m.fin, t = now();
    f.sentAt = t;
    f.dirty = false;
    d.toRoom(m.room)({
      t: 'final', fb: 'old_carapace', id: m.id, ph: f.ph, enr: f.enr ? 1 : 0, po: f.pose, sp: +f.sp.toFixed(4), ss: +period(f).toFixed(3),
      wl: f.wl, op: f.slakeUntil > t ? Math.round(f.slakeUntil - t) : 0, dr: f.drinks, st: f.steps,
    });
  }
  const pose = (f, p) => {
    if (f.pose !== p) [f.pose, f.dirty] = [p, true];
  };
  // the drink's window: every hit on him does more (server/rpg.js applyHits, as the Escapement's Tick)
  const hold = (m) => (m.fin && m.fin.slakeUntil > now() ? SLAKE_MULT : 1);
  function enterPhase(m, k, ph, t) {
    const f = m.fin;
    f.ph = ph;
    f.loop = f.step = 0;
    m.stage = Math.min(2, ph);
    f.nextUlt = Math.max(f.nextUlt, t + 8000);
    if (ph >= 1 && !f.mirageAt) f.mirageAt = t + MIRAGE_EVERY * 400;
    if (ph === 2) f.steps = 1; // (the Long Walk: he walks faster)
    if (ph === 3) d.bossEvent(m, 'storm'); // (into the storm: the sky goes red over the shell)
    f.dirty = true;
    d.bossEvent(m, 'phase', { n: ph + 1 });
    d.bossSays(m, k.lines?.phase?.[ph - 1]);
  }
  function enrage(m, t) {
    const f = m.fin;
    f.enr = true;
    m.enraged = true;
    f.stampAt = t + ENRAGE_STAMP_S * 1000;
    f.slakeUntil = 0;
    f.wl = 0;
    f.dirty = true;
    d.bossEvent(m, 'finalRage');
  }
  // phase 3's walk a step quicker (+1: a loop came round) or slower (-1: the town drank)
  function walkStep(m, n) {
    const f = m.fin;
    if (f.ph !== 2 || f.enr) return;
    const was = f.steps;
    f.steps = Math.max(0, Math.min(STRIDE_STEPS, f.steps + n));
    if (f.steps !== was) {
      f.dirty = true;
      d.bossEvent(m, 'walkStep', { n: f.steps, dir: Math.sign(f.steps - was) });
    }
  }
  const watched = (m) => (m.focus && m.focus.until > now() ? m.focus.p : null);
  const fighters = (m, here) => here.filter(([, q]) => !q.faintUntil);
  const seenBy = (list, type) => {
    for (const [, q] of list) d.chalSeen(q, type);
  };

  // Snap at q: his head swings back over the shell and bites down at the mark → how long it takes. Some come a beat late
  // (the head draws back, holds; then it falls)
  function snap(m, q, list, t) {
    const f = m.fin, tx = Math.round(clampX(q.state.x)), warn = SNAP_WARN[f.ph];
    const late = Math.random() < SNAP_LATE[f.ph] && !f.enr, extra = late ? period(f) / 4 : 0;
    pose(f, 'snap');
    d.bossEvent(m, 'snap', { tx, dur: warn, r: SNAP_R });
    if (late) {
      seenBy(list, 'late');
      d.later(m, warn * 1000, () => !m.dead && d.bossEvent(m, 'snapLate', { tx, dur: extra }));
    }
    d.later(m, (warn + extra) * 1000, () => {
      if (m.dead) return;
      pose(f, 'bite');
      d.bossEvent(m, 'snapHit', { tx, r: SNAP_R });
      d.later(m, SNAP_REST * 1000, () => !m.dead && f.pose === 'bite' && pose(f, 'walk'));
    });
    return warn + extra + SNAP_REST + 0.4;
  }

  // one move of the loop → how long it takes (s)
  function move(m, k, here, name, t) {
    const f = m.fin, ph = f.ph, w = watched(m), list = fighters(m, here);
    const aim = w ?? m.target ?? (list.length ? pick(list)[1] : null);
    if (name === 'look') {
      if (!list.length) return 0.5;
      if (!(m.tauntUntil > t && m.focus)) { // (a Knight's taunt holds it)
        const others = list.filter(([, q]) => q !== m.focusLast);
        const [id, p] = pick(others.length ? others : list);
        m.focus = { p, id, until: t + LOOK_S * 1000 };
        m.focusLast = p;
        d.sendParty(m);
      }
      pose(f, 'look');
      d.bossEvent(m, 'watch', { to: m.focus.id });
      return 1.4;
    }
    if (name === 'snap') return aim ? snap(m, aim, list, t) : 0.3;
    if (name === 'stamp') {
      pose(f, 'stamp');
      m.pulseAt = t; // (partyTick warns and lands it: the pulse, looks.pulse 'stamp')
      return d.PULSE_WARN + 0.8;
    }
    if (name === 'drawn' || name === 'dust' || name === 'both' || name === 'shield') {
      const kind = name === 'drawn' ? 'armour' : name === 'dust' ? 'barrier' : name === 'both' ? 'both' : (f.shieldAlt++ % 2 ? 'barrier' : 'armour');
      pose(f, kind === 'barrier' ? 'dust' : 'drawn');
      if (!m.shield) d.shieldUp(m, k, kind, t);
      return 1.6;
    }
    if (name === 'stones') {
      if (!aim) return 0.3;
      // stones kicked up by his feet come down in a line toward the looked-at slime, three a stride, and one right on it
      const dir = Math.sign(aim.state.x - HEAD_X) || -1, x0 = Math.round(clampX(aim.state.x - dir * STONES_GAP * (STONES_N - 1)));
      const xs = [];
      for (let i = 0; i < STONES_N; i++) xs.push(Math.round(clampX(x0 + dir * i * STONES_GAP)));
      xs.push(Math.round(clampX(aim.state.x)));
      const groups = [xs.slice(0, 3), xs.slice(3)], gapMs = (period(f) / 2) * 1000;
      pose(f, 'stamp');
      groups.forEach((marks, g) => d.later(m, g * gapMs, () => {
        if (m.dead) return;
        d.bossEvent(m, 'rain', { marks, dur: STONES_WARN, style: 'stones' });
        d.later(m, STONES_WARN * 1000, () => !m.dead && d.bossEvent(m, 'rainHit', { marks, style: 'stones' }));
      }));
      return STONES_WARN + gapMs / 1000 + 0.8;
    }
    if (name === 'rest') {
      // Lie Down: he lowers himself, so tired, and the well's floor falls open: the shard is the weak point
      pose(f, 'rest');
      f.rest = { until: t + REST_S * 1000 };
      m.weak = { at: t, until: f.rest.until, fill: 0, max: Math.max(1, Math.round(k.hp * d.TEST_BOSS_HP * d.weakHpOf(k) * REST_WEAK)), gaze: true };
      f.rest.w = m.weak;
      f.dirty = true;
      d.bossEvent(m, 'rest', { dur: REST_S });
      d.bossEvent(m, 'weakOpen');
      d.sendParty(m);
      return REST_S + 1;
    }
    // ——— its challenges (docs/combat/challenges.md) ———
    if (name === 'gaps' || name === 'mash' || name === 'rings' || name === 'rescue' || name === 'dark' || name === 'swap') {
      pose(f, name === 'rings' ? 'stamp' : 'look');
      const took = { gaps: 2.6, mash: 1.8, rings: 3.2, rescue: 1.6, dark: 1.6, swap: 1.6 }[name];
      return d.challenge(m, name, { stage: ph }) ? took : 0.2;
    }
    if (name === 'ult') return ult(m, k, t);
    return 0.2;
  }
  // an ultimate: The Long Road (phases 1–2), The Long Road and Earthshaker by turns from phase 3
  function ult(m, k, t) {
    const f = m.fin, row = FINAL.old_carapace;
    const pin = m.forceUlt; // (the sandbox's Ultimate now: that one)
    m.forceUlt = null;
    const turn = f.ultN++ % 2;
    const which = (pin != null && row.ults[pin]) || (f.ph < 2 ? row.ults[0] : row.ults[turn]);
    const u = { ...which, dur: FINAL_ULT_WARN };
    pose(f, which.kind === 'nova' ? 'rear' : 'haul');
    m.act = 'ult';
    m.phase = 'warn';
    f.nextUlt = t + (row.ultEvery[f.ph] || 60) * 1000;
    f.dirty = true;
    d.startUlt(m, k, t, u);
    return 99; // (ends when the ultimate does: tick watches m.act)
  }

  // the Stride: its phase moves on (stopped while the town drinks); each footfall hits whoever's on the floor over that foot
  function stride(m, here, dt, t) {
    const f = m.fin;
    if (slaked(f) || m.dead) return;
    const before = f.sp;
    f.sp = (f.sp + dt / period(f)) % 1;
    const landed = before > f.sp ? 0 : before < 0.5 && f.sp >= 0.5 ? 1 : -1; // (the hind foot at 0, the fore at 0.5)
    if (landed < 0) return;
    d.bossEvent(m, 'foot', { i: landed });
    if (m.act === 'ult' && m.phase === 'act') return; // (the ultimate's own hit is enough)
    for (const [qid, q] of fighters(m, here)) {
      if (q.state.room !== m.room || !strideHits(landed, q.state.x, q.state.y, q.state.onPlat)) continue;
      d.hurt(qid, q, d.stats(q).maxHp * STRIDE_HP, q.state.x, undefined, 0, false, m, 'dot');
    }
  }
  // the room's own clocks: the waterskins, the mirages, the drink's window closing
  function room(m, k, here, t) {
    const f = m.fin;
    // a waterskin drops off a tent at one end of the town (one at a time: the carry is ONE_AT_A_TIME)
    if (!f.enr && t >= f.waterAt) {
      const x = pick(SKIN_X) + Math.round((Math.random() - 0.5) * 80);
      f.waterAt = t + (d.challenge(m, 'carry', { x, target: { x: WELL_X }, style: 'skin' }) ? WATER_EVERY * 1000 : 3000);
    }
    // the mirages: up off the road at the east end, more the more the town has drunk
    if (f.ph >= 1 && f.mirageAt && t >= f.mirageAt && m.act !== 'ult' && !f.enr) {
      f.mirageAt = t + MIRAGE_EVERY * 1000;
      const n = Math.min(MIRAGE_BASE + Math.floor(f.drinks / MIRAGE_PER), d.addsCap(m) - d.minionsOf(m, MIRAGE));
      for (let j = 0; j < n; j++) {
        const x = Math.round(clampX(MIRAGE_X - j * 70));
        if (d.addAdd(m, MIRAGE, x)) d.bossEvent(m, 'mirages', { px: x });
      }
    }
    if (f.slakeUntil && t >= f.slakeUntil) {
      f.slakeUntil = 0;
      f.dirty = true;
      d.bossEvent(m, 'drained');
      pose(f, 'walk');
    }
  }
  // a waterskin thrown into the well (server/challenge.js toss, through server/final.js poured): one step fuller; WELL_N
  // and the town drinks
  function poured(m, id) {
    const f = m.fin, t = now();
    if (!f || m.dead) return;
    f.wl = Math.min(WELL_N, f.wl + 1);
    f.dirty = true;
    d.bossEvent(m, 'pour', { wl: f.wl, who: id });
    f.waterAt = Math.min(f.waterAt, t + 2500); // (the next skin soon after)
    if (f.wl < WELL_N || f.enr) return;
    f.wl = 0;
    f.drinks++;
    f.slakeUntil = t + SLAKE_S * 1000;
    d.stagger(m, SLAKE_STAGGER_S);
    walkStep(m, -1);
    pose(f, 'drink');
    d.bossEvent(m, 'drink', { n: f.drinks, dur: SLAKE_S, who: id });
  }

  // every tick for a final boss (instead of bossBrain) → how fast it walks (it never does: it walks the desert, not the den)
  function tick(m, k, here, dt, t) {
    const f = (m.fin ??= init()), row = FINAL[k.final];
    if (!f.start) {
      f.start = t;
      f.enrAt = t + (m.enrLeft ?? ENRAGE_MS); // (m.enrLeft: its enrage clock from before a restart, server/rpg.js restoreBosses)
      m.enrLeft = undefined;
      f.pulseSeen = m.pulseN | 0;
      f.at = t + 3000; // (the title card's up; he's already walking)
      f.waterAt = t + 6000;
    }
    m.x = HEAD_X;
    m.vx = 0;
    m.dir = 1; // (he looks ahead, east, always)
    const ph = finalPhase(row, m.hp / m.maxHp);
    if (ph > f.ph) enterPhase(m, k, ph, t);
    if (!f.enr && t >= f.enrAt) enrage(m, t);
    if (!m.ultArmed && m.hp / m.maxHp < d.ULT_FIRST) [m.ultArmed, f.nextUlt] = [true, Math.max(f.nextUlt, t + 3000)];
    if ((m.pulseN | 0) !== f.pulseSeen) f.pulseSeen = m.pulseN | 0;
    // Lie Down: the shard filled (the weak point gone before its time: the long stagger), or he gets up, the Trample
    if (f.rest) {
      if (t >= f.rest.until) {
        f.rest = null;
        if (m.weak?.gaze) [m.weak, m.partyDirty] = [null, true];
        pose(f, 'trample');
        d.bossEvent(m, 'trample');
        for (const [qid, q] of fighters(m, here)) if (q.state.room === m.room && !q.state.onPlat) d.hurt(qid, q, d.stats(q).maxHp * TRAMPLE_HP, q.state.x, undefined, 0, false, m, 'dot');
        f.dirty = true;
      } else if (m.weak !== f.rest.w) {
        f.rest = null;
        pose(f, 'stag');
        d.bossEvent(m, 'restBroken');
        f.dirty = true;
        if (!f.gap) f.at = Math.min(f.at, t);
      }
    }
    if (f.enr && t >= f.stampAt && !m.pulseHit && m.act !== 'ult') {
      f.stampAt = t + ENRAGE_STAMP_S * 1000;
      m.pulseAt = t; // (besides the loop's own)
    }
    if (!f.rest) stride(m, here, dt, t);
    room(m, k, here, t);
    if (f.dirty && t - f.sentAt > 120) send(m);
    else if (t - f.sentAt > 1000) send(m);
    // the loop
    if (m.act === 'ult') {
      m.timer -= dt;
      if (m.phase === 'warn' && m.timer <= 0) {
        m.phase = 'act';
        d.ultGoesOff(m, k, t);
        f.dirty = true;
      } else if (m.phase === 'act' && m.timer <= 0) {
        [m.act, m.ult, m.phase, f.gap, f.at] = [null, null, 'walk', true, t + FINAL_GAP_S[f.ph] * 1000];
        f.dirty = true;
        pose(f, 'walk');
      }
      return 0;
    }
    if (!f.gap && f.at === Infinity) { // (an ultimate was interrupted: interruptUlt dropped it)
      [f.gap, f.at] = [true, t + 1000];
      f.dirty = true;
      pose(f, 'stag');
    }
    if (m.staggerUntil > t) {
      if (!slaked(f)) pose(f, 'stag');
      return 0;
    }
    if (t < f.at) return 0;
    if (!f.gap) {
      // the move's time is up: its opening
      m.phase = 'walk';
      m.act = null;
      f.gap = true;
      f.at = t + FINAL_GAP_S[f.ph] * (f.enr ? 0.7 : 1) * 1000;
      if (f.pose !== 'bite' && !slaked(f)) pose(f, 'walk');
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
        walkStep(m, 1); // (phase 3: every loop he walks a step faster)
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

  // ——— hits ———
  // what a hit from p with flag code (h[4]: 1 the shard) can be on → { weak } | 'body' | null. His body is the head and
  // neck at the east end (anything in reach of it); the shard at the bottom of the well while he lies down
  function part(m, p, code, arrow, range) {
    const f = m.fin, k = d.MOBS[m.kind], x = p.state.x, y = p.state.y;
    if (f && code === 1 && m.weak) {
      const s = d.weakOf(k, m.x, m.y, m.dir);
      if (headReach(s, x, y, range, arrow, SLACK)) return { weak: true };
    }
    return Math.abs(m.x - x) <= range + k.w / 2 + SLACK ? 'body' : null;
  }
  const hitHead = () => {}; // (no props: nothing to strike but him)

  // its mirages (stepMob runs this for a mob with `son: 'mirage'`) → how fast it drifts: west to the well, then it sits there
  // drinking (a skin's worth every DRINK_S) unless something stops it
  function son(m, k, here, dt, t) {
    const b = d.mobById(m.by), f = b?.fin;
    if (!f || b.dead) return 0;
    const stopped = (q) => q.frozenUntil > t || q.stunUntil > t || q.snareUntil > t;
    if (m.drink) {
      if (stopped(m) || (m.knockAt ?? 0) > m.drink.at || Math.abs(m.x - WELL_X) > 50) {
        m.drink = null;
        m.restUntil = t + 1200;
        return 0;
      }
      if (t >= m.drink.at + DRINK_S * 1000) {
        m.drink.at = t;
        if (f.wl > 0) {
          f.wl--;
          f.dirty = true;
          d.bossEvent(b, 'sip', { wl: f.wl, sid: m.id });
        }
      }
      return 0;
    }
    if (m.restUntil > t || stopped(m)) return 0;
    const dx = WELL_X - m.x;
    if (Math.abs(dx) < 16) {
      m.drink = { at: t };
      m.vx = 0;
      d.bossEvent(b, 'drinking', { sid: m.id });
      return 0;
    }
    return Math.sign(dx) * k.speed;
  }
  return { tick, part, hitHead, send, son, hold, poured };
}
