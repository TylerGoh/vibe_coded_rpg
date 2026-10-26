// Docs: docs/combat/bosses.md, docs/places/ladon.md
// The final bosses' brain (FB1 (c); data in FINAL, src/shared/final.js): four phases, each a written loop of moves
// run in order (never a random pick), the heads (several targets on one boss, each with a ring; cut, two regrow
// unless fire seals the stump), the phase 3 coils (a server-timed hazard: it hurts, it never blocks), the enrage.
// server/rpg.js runs it instead of bossBrain for a boss with `final` (stepMob), and asks it about hits on a head
// (applyHits → part / hitHead). S5's engine (partyTick) still runs the focus, pulse, curse, shields and weak point;
// for a final boss it starts none of them by itself: the loop does (watch, breath, bark / ward / both, gaze).
// → the room: {t:'final', id, ph, hd: [[slot, state, ring filled 0–100, ms left in that state, x]], act: the slot
// that's acting (-1: none), cw: the coils' reach from each end (px), enr: 1 once enraged, cu: the Coil's ms left}
import { FINAL, finalPhase, FINAL_ENRAGE_MIN, COIL_ENRAGE_S, ENRAGE_BREATH_S, FINAL_ULT_WARN, FINAL_GAP_S, LADON_SLOTS, HEAD_MAX, HEAD_RING, HEAD_CHUNK, HEAD_ADDS, REGROW_S, WATCH_S, BITE_WARN, BITE_STUCK_S, LASH_WARN, LASH_FLOOR, LASH_ARCH, COIL_S, GAZE_S, GAZE_HP, GAZE_WEAK, COIL_STEP, COIL_STEPS, HUNDRED_GAPS, HUNDRED_GAP_W, FIN_W, headSpot, headReach, headTarget, throatOpen, isStump } from '../src/shared/final.js';

const ENRAGE_MS = (Number(process.env.TEST_ENRAGE_MIN) || FINAL_ENRAGE_MIN) * 60_000; // (tests only: sooner)
const SLACK = 60;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// d: what it needs from server/rpg.js's closure (all lazy, called at tick time)
export function createFinal(d) {
  const { now } = d;
  const ring = (k) => Math.max(1, Math.round(k.hp * d.TEST_BOSS_HP * HEAD_RING));
  const head = (k, slot, st = 'up') => ({ slot, st, fill: 0, max: ring(k), until: 0, x: LADON_SLOTS[slot].x });
  const sides = (f) => f.heads.filter((h) => h.slot !== 0);
  const live = (f) => sides(f).filter((h) => !isStump(h.st));
  const freeSlot = (f) => [1, 2, 3, 4, 5, 6, 7].find((s) => !f.heads.some((h) => h.slot === s));
  const cap = (f) => (f.ph >= FINAL[f.row].first ? HEAD_MAX - 1 : HEAD_MAX); // (side heads; the first head makes seven)

  function init(m, k) {
    const row = FINAL[k.final];
    const f = { row: k.final, ph: 0, loop: 0, step: 0, at: 0, gap: true, heads: [], turn: 0, act: -1, cw: 0, coil: 0, start: 0, enrAt: 0, enr: false,
      coilUntil: 0, sentAt: 0, dirty: true, ultN: 0, nextUlt: 0, gazeUntil: 0, gazeTick: 0, pulseSeen: m.pulseN | 0, stagSeen: 0, shieldAlt: 0, breathAt: 0, enrCoilAt: 0 };
    f.heads.push(head(k, 0, 'eyes'));
    for (let i = 0; i < row.heads[0]; i++) f.heads.push(head(k, i + 1));
    return f;
  }
  // → the room
  function send(m) {
    const f = m.fin, t = now();
    f.sentAt = t;
    f.dirty = false;
    d.toRoom(m.room)({
      t: 'final', id: m.id, ph: f.ph, act: f.act, cw: Math.round(f.cw), enr: f.enr ? 1 : 0, cu: f.coilUntil > t ? Math.round(f.coilUntil - t) : 0,
      hd: f.heads.map((h) => [h.slot, h.st, Math.round((h.fill / h.max) * 100), Math.max(0, Math.round(h.until - t)), Math.round(h.x)]),
    });
  }
  // the coils step in (+1: a Breath landed) or back (-1: a head cut, a stagger); phase 3 on, never past COIL_STEPS
  function coilStep(m, n) {
    const f = m.fin;
    if (f.ph < 2 || f.enr) return;
    const was = f.coil;
    f.coil = Math.max(0, Math.min(COIL_STEPS, f.coil + n));
    if (f.coil !== was) {
      f.dirty = true;
      d.bossEvent(m, 'coilStep', { n: f.coil, dir: Math.sign(f.coil - was) });
    }
  }
  function enterPhase(m, k, ph, t) {
    const f = m.fin, row = FINAL[f.row];
    f.ph = ph;
    f.loop = f.step = 0;
    m.stage = Math.min(2, ph);
    // the necks push through again: every stump (sealed ones too) is a head, then more up to the phase's count
    for (const h of sides(f)) if (isStump(h.st)) Object.assign(h, { st: 'up', fill: 0, max: ring(k), until: 0 });
    while (sides(f).length < Math.min(cap(f), row.heads[ph])) f.heads.push(head(k, freeSlot(f)));
    if (ph >= row.first) Object.assign(f.heads[0], { st: 'up', until: 0 });
    f.nextUlt = Math.max(f.nextUlt, t + 8000);
    f.dirty = true;
    d.bossEvent(m, 'phase', { n: ph + 1 });
    d.bossSays(m, k.lines?.phase?.[ph - 1]);
  }
  function enrage(m, t) {
    const f = m.fin;
    f.enr = true;
    m.enraged = true;
    f.enrCoilAt = t;
    f.breathAt = t + ENRAGE_BREATH_S * 1000;
    for (const h of sides(f)) if (isStump(h.st)) h.until = t; // (every stump at once, and nothing seals them now)
    f.dirty = true;
    d.bossEvent(m, 'finalRage');
  }
  // a head fell (its ring full): a chunk off the boss, briarlings, a stump
  function fall(m, k, h, id, p, t) {
    const f = m.fin;
    Object.assign(h, { st: 'stump', fill: 0, until: t + (f.enr ? 1500 : REGROW_S * 1000) });
    if (f.act === h.slot) f.act = -1;
    f.dirty = true;
    const spot = headSpot(h);
    d.bossEvent(m, 'headFall', { slot: h.slot, hx: Math.round(spot.x), hy: Math.round(spot.y) });
    d.damage(m, Math.round(m.maxHp * HEAD_CHUNK), false, id, p, 0, 0);
    if (m.dead) return;
    const room = d.addsCap(m) - d.minionsIn(m.room);
    for (let i = 0; i < Math.min(HEAD_ADDS, room); i++) d.addMinion(m, Math.max(120, Math.min(FIN_W - 120, spot.x + rand(-60, 60))));
    coilStep(m, -1);
  }
  // a stump grows back as two heads (one if there's no room)
  function regrow(m, k, h, t) {
    const f = m.fin;
    Object.assign(h, { st: 'up', fill: 0, max: ring(k), until: 0 });
    const extra = sides(f).length < cap(f) ? freeSlot(f) : undefined;
    if (extra !== undefined) f.heads.push(head(k, extra));
    f.dirty = true;
    d.bossEvent(m, 'regrow', { slot: h.slot, also: extra });
  }
  // the next head to act, in turn (the eyes of the acting head light first, on the client)
  function nextHead(f) {
    const list = live(f).filter((h) => h.st === 'up').sort((a, b) => a.slot - b.slot);
    if (!list.length) return null;
    f.turn = (f.turn + 1) % 64;
    return list[f.turn % list.length];
  }
  const watched = (m) => (m.focus && m.focus.until > now() ? m.focus.p : null);
  const fighters = (m, here) => here.filter(([, q]) => !q.faintUntil);

  // one move of the loop → how long it takes (s)
  function move(m, k, here, name, t) {
    const f = m.fin, ph = f.ph, w = watched(m), list = fighters(m, here);
    const aim = w ?? m.target ?? (list.length ? pick(list)[1] : null);
    if (name === 'watch') {
      if (!list.length) return 0.5;
      if (!(m.tauntUntil > t && m.focus)) { // (a Knight's taunt holds it)
        const others = list.filter(([, q]) => q !== m.focusLast);
        const [id, p] = pick(others.length ? others : list);
        m.focus = { p, id, until: t + WATCH_S * 1000 };
        m.focusLast = p;
        d.sendParty(m);
      }
      d.bossEvent(m, 'watch', { to: m.focus.id });
      return 1.4;
    }
    if (name === 'bite') {
      const h = nextHead(f);
      if (!h || !aim) return 0.3;
      const tx = Math.round(Math.max(60, Math.min(FIN_W - 60, aim.state.x))), warn = BITE_WARN[ph];
      Object.assign(h, { st: 'rear', until: t + warn * 1000, x: tx });
      f.act = h.slot;
      f.dirty = true;
      d.bossEvent(m, 'bite', { slot: h.slot, tx, dur: warn });
      d.later(m, warn * 1000, () => {
        if (m.dead || h.st !== 'rear') return;
        Object.assign(h, { st: 'bite', until: now() + BITE_STUCK_S * 1000 });
        if (f.act === h.slot) f.act = -1;
        f.dirty = true;
        d.bossEvent(m, 'biteHit', { slot: h.slot, tx });
      });
      return warn + 0.35;
    }
    if (name === 'lash') {
      const h = nextHead(f), s = LADON_SLOTS[h?.slot ?? 1], dir = s.rx < FIN_W / 2 ? 1 : -1, low = Math.random() < 0.5;
      if (h) [f.act, f.dirty] = [h.slot, true];
      const bands = [{ y: low ? LASH_FLOOR : LASH_ARCH, delay: 0 }];
      if (ph >= 2) bands.push({ y: low ? LASH_ARCH : LASH_FLOOR, delay: 1.4 });
      for (const b of bands) d.bossEvent(m, 'beam', { style: 'briar', bx: dir > 0 ? 0 : FIN_W, dir, y0: b.y[0], y1: b.y[1], len: FIN_W, warn: LASH_WARN + b.delay, dur: 0.5 });
      d.later(m, (LASH_WARN + 0.6 + (ph >= 2 ? 1.4 : 0)) * 1000, () => f.act === h?.slot && ((f.act = -1), (f.dirty = true)));
      return LASH_WARN + 0.8 + (ph >= 2 ? 1.4 : 0);
    }
    if (name === 'bark' || name === 'ward' || name === 'both' || name === 'shield') {
      const kind = name === 'bark' ? 'armour' : name === 'ward' ? 'barrier' : name === 'both' ? 'both' : (f.shieldAlt++ % 2 ? 'barrier' : 'armour');
      if (!m.shield) d.shieldUp(m, k, kind, t);
      return 1.6;
    }
    if (name === 'coil') {
      f.coilUntil = t + COIL_S * 1000;
      f.dirty = true;
      d.bossEvent(m, 'coil', { dur: COIL_S });
      return COIL_S + 0.3;
    }
    if (name === 'rows') {
      const odd = Math.random() < 0.5, tiles = (p) => Array.from({ length: 10 }, (_, i) => i).filter(p);
      d.bossEvent(m, 'grid', { style: 'briar', tiles: tiles((i) => i % 2 === (odd ? 1 : 0)), warn: 1.2, dur: 0.45, tall: false });
      d.bossEvent(m, 'grid', { style: 'briar', tiles: tiles((i) => i % 2 === (odd ? 0 : 1)), warn: 2.2, dur: 0.45, tall: false });
      return 2.6;
    }
    if (name === 'breath') {
      m.pulseAt = t; // (partyTick warns and lands it: the pulse, looks.pulse 'thorn')
      return d.PULSE_WARN + 0.8;
    }
    if (name === 'storm') {
      // every head spits a fan of thorns at the watched slime, then at someone else
      const shots = [], heads = live(f).filter((h) => h.st === 'up');
      const second = list.filter(([, q]) => q !== aim).map(([, q]) => q);
      [aim, second.length ? pick(second) : aim].forEach((q, wave) => {
        if (!q) return;
        for (const h of heads) {
          const s = headSpot(h), base = Math.atan2(q.state.y - 20 - s.y, q.state.x - s.x);
          for (let i = 0; i < 5; i++) {
            const a = base + (i / 4 - 0.5) * 0.7;
            shots.push([Math.round(s.x), Math.round(s.y), Math.round(Math.cos(a) * 380), Math.round(Math.sin(a) * 380), 0, 12, wave * 1.1 + 0.4]);
          }
        }
      });
      d.bossEvent(m, 'shots', { style: 'thorn', shots });
      return 2.6;
    }
    if (name === 'gaze') {
      const fh = f.heads[0];
      if (fh.st !== 'up') return 0.3;
      Object.assign(fh, { st: 'gaze', until: t + GAZE_S * 1000 });
      f.gazeUntil = fh.until;
      f.gazeTick = t + 1000;
      f.act = 0;
      m.weak = { at: t, until: fh.until, fill: 0, max: Math.max(1, Math.round(k.hp * d.TEST_BOSS_HP * d.weakHpOf(k) * GAZE_WEAK)), gaze: true };
      f.dirty = true;
      d.bossEvent(m, 'gaze', { dur: GAZE_S });
      d.bossEvent(m, 'weakOpen');
      d.sendParty(m);
      return GAZE_S + 0.6;
    }
    if (name === 'ult') return ult(m, k, t);
    return 0.2;
  }
  // an ultimate: Hundred Heads (necks strike everywhere but the gaps) or Strangle (the coils surge; only the high arch)
  function ult(m, k, t) {
    const f = m.fin, row = FINAL[f.row];
    const which = f.ph >= row.alternateFrom ? row.ults[f.ultN++ % row.ults.length] : row.ults[0];
    const u = { ...which, dur: FINAL_ULT_WARN };
    if (u.kind === 'heads') {
      // HUNDRED_GAPS safe gaps, spread out across the open floor between the coils
      const lo = Math.min(f.cw + 40, FIN_W / 2 - 200), hi = Math.max(FIN_W - f.cw - 40 - HUNDRED_GAP_W, FIN_W / 2 + 200 - HUNDRED_GAP_W), span = (hi - lo) / HUNDRED_GAPS; // (never squeezed shut: the enrage's coils kill anyway)
      u.gaps = Array.from({ length: HUNDRED_GAPS }, (_, i) => {
        const x = Math.round(lo + span * i + rand(0, Math.max(0, span - HUNDRED_GAP_W)));
        return [x, x + HUNDRED_GAP_W];
      });
    }
    m.act = 'ult';
    m.phase = 'warn';
    f.nextUlt = t + (row.ultEvery[f.ph] || 60) * 1000;
    d.startUlt(m, k, t, u);
    return 99; // (ends when the ultimate does: tick watches m.act)
  }

  // every tick for a final boss (instead of bossBrain) → how fast it walks (never: it's rooted)
  function tick(m, k, here, dt, t) {
    const f = (m.fin ??= init(m, k)), row = FINAL[f.row];
    if (!f.start) {
      f.start = t;
      f.enrAt = t + ENRAGE_MS;
      f.at = t + 2500; // (a breath before the first move: the title card)
    }
    const ph = finalPhase(row, m.hp / m.maxHp);
    if (ph > f.ph) enterPhase(m, k, ph, t);
    if (!f.enr && t >= f.enrAt) enrage(m, t);
    if (!m.ultArmed && m.hp / m.maxHp < d.ULT_FIRST) [m.ultArmed, f.nextUlt] = [true, Math.max(f.nextUlt, t + 3000)];
    // the heads' own timers
    for (const h of f.heads) {
      if (h.st === 'bite' && t >= h.until) [h.st, h.x, f.dirty] = ['up', LADON_SLOTS[h.slot].x, true];
      if (h.st === 'stump' && t >= h.until) regrow(m, k, h, t);
      if (h.st === 'gaze' && t >= h.until) {
        [h.st, f.dirty] = ['up', true];
        if (f.act === 0) f.act = -1;
        if (m.weak?.gaze) [m.weak, m.partyDirty] = [null, true];
      }
    }
    // the Gaze: the watched slime burns while it stares
    if (f.gazeUntil > t && t >= f.gazeTick) {
      f.gazeTick += 1000;
      const w = watched(m);
      if (w && !w.faintUntil && w.state.room === m.room) d.hurt(m.focus.id, w, d.stats(w).maxHp * GAZE_HP, m.x, undefined, 0, false, m, true);
    }
    // the coils: a Breath landing steps them in; a stagger steps them back
    if ((m.pulseN | 0) !== f.pulseSeen) {
      f.pulseSeen = m.pulseN | 0;
      coilStep(m, 1);
    }
    if (m.staggerUntil > t && m.staggerUntil !== f.stagSeen) {
      f.stagSeen = m.staggerUntil;
      coilStep(m, -1);
    }
    const want = f.enr ? FIN_W / 2 * Math.min(1, (t - f.enrCoilAt) / (COIL_ENRAGE_S * 1000)) : f.coil * COIL_STEP;
    if (f.enr || f.ph >= 2) {
      const was = f.cw;
      f.cw += Math.sign(want - f.cw) * Math.min(Math.abs(want - f.cw), (f.enr ? 30 : 240) * dt);
      if (f.enr) f.cw = Math.max(f.cw, want);
      if (Math.abs(f.cw - was) > 0 && t - f.sentAt > 250) f.dirty = true;
    }
    if (f.enr && t >= f.breathAt && !m.pulseHit && m.act !== 'ult') {
      f.breathAt = t + ENRAGE_BREATH_S * 1000;
      m.pulseAt = t; // (twice as often as the loop's own)
    }
    if (f.dirty && t - f.sentAt > 120) send(m);
    else if (t - f.sentAt > 1000) send(m);
    // the loop
    if (m.act === 'ult') {
      m.timer -= dt;
      if (m.phase === 'warn' && m.timer <= 0) {
        m.phase = 'act';
        d.ultGoesOff(m, k, t);
      } else if (m.phase === 'act' && m.timer <= 0) [m.act, m.ult, m.phase, f.gap, f.at] = [null, null, 'walk', true, t + FINAL_GAP_S[f.ph] * 1000];
      return 0;
    }
    if (!f.gap && f.at === Infinity) [f.gap, f.at] = [true, t + 1000]; // (an ultimate was interrupted: interruptUlt dropped it)
    if (m.staggerUntil > t) return 0; // (dazed: no moves)
    if (t < f.at) return 0;
    if (!f.gap) {
      // the move's time is up: its opening
      m.phase = 'walk';
      m.act = null;
      f.gap = true;
      f.at = t + FINAL_GAP_S[f.ph] * (f.enr ? 0.7 : 1) * 1000;
      return 0;
    }
    if (!fighters(m, here).length) return 0;
    // the next move: an ultimate due (phases 1–3), else the loop's next step
    let name;
    if (f.ph < 3 && m.ultArmed && t >= f.nextUlt) name = 'ult';
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

  // ——— hits ———
  // what a hit from p with flag code (h[4]: 1 the weak point, 2 + slot a head or its stump) can be on → { weak } |
  // { head, throat } | { stump } | 'body' | null (out of reach of anything)
  function part(m, p, code, arrow, range, magic = false) {
    const f = m.fin, k = d.MOBS[m.kind], x = p.state.x, y = p.state.y;
    if (f && code === 1 && m.weak) {
      const s = d.weakOf(k, m.x, m.y, m.dir);
      if (headReach(s, x, y, range, arrow, SLACK)) return { weak: true };
    }
    if (f && code >= 2) {
      const h = f.heads.find((q) => q.slot === code - 2);
      if (h && headTarget(h) && headReach(headSpot(h), x, y, range, arrow || (magic && h.st === 'stump'), SLACK)) {
        if (h.st === 'stump') return { stump: h };
        const w = watched(m);
        return { head: h, throat: f.coilUntil > now() - 300 && !!w && throatOpen(h, w.state.x, x) };
      }
    }
    return Math.abs(m.x - x) <= range + k.w / 2 + SLACK ? 'body' : null;
  }
  // a hit for dmg landed on part pt (from part()): fills the head's ring (THROAT_FILL × on its throat); fire on a
  // stump seals it
  function hitHead(m, pt, dmg, id, p, { fire = false, throatFill = 1 } = {}) {
    const f = m.fin, k = d.MOBS[m.kind], t = now();
    if (pt.stump) {
      if (fire && !f.enr && pt.stump.st === 'stump') {
        pt.stump.st = 'sealed';
        f.dirty = true;
        d.bossEvent(m, 'seal', { slot: pt.stump.slot });
      }
      return;
    }
    const h = pt.head;
    if (!h || isStump(h.st)) return;
    h.fill += dmg * (pt.throat ? throatFill : 1);
    f.dirty = true;
    if (h.fill >= h.max) fall(m, k, h, id, p, t);
  }
  return { tick, part, hitHead, send };
}
