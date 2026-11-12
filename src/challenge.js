// Docs: docs/combat/challenges.md
// Boss challenges, the client's side (story/tricky-plan.md): a boss's challenge events become hazards (judged in
// src/rpg.js hazardHits like every boss hazard: the snare and its cousins, the cage, the gaps' ice, the shield bash),
// a trap's combo is taken from the bound walk / jump / drop keys (or the arrow pad on touch) and sent as {t:'free'}
// (a friend's cage too, standing at it), the moving arena's ledges are sunk and raised by predicted edits ({t:'pf'}),
// and the rest is drawn: roots, fetters or a cage round whoever is caught, a swap sign, tethers, the Hunt's marks, the
// dark, the combo over your head, G2's first-time banner. T1b: the mirror trap's flipped arrows, the laser grid, the late
// tells and the stopped hour, the fake-out's ticking ring, the tilting floor (predicted edits of `tl`, like the arena's),
// the chip of Brenna's tooth (picked up with the loot key, thrown with an attack: carrying(), throw()) and Rewind's
// ghosts (snapped back by a predicted edit, {t:'rw'}).
import {
  CHALLENGES, ARROWS, ARROW_GLYPH, TRAP_HOLD, SNARE_TICKS, SWAP_TICKS, PUNISH_KEEP_S, seedFor, comboFor, RHYTHM_TICKS, RHYTHM_BEAT, RHYTHM_WINDOW, CAGE_S, RESCUE_R, GAP_GRACE, gapX, TETHER_R, PARRY_MS, PARRY_LATE_MS, DARK_R,
  MIRROR, LASER_COLS, LASER_W, laserX, tiltV, CARRY_S, CARRY_R, THROW_RANGE, CARRY_BURST_R, REWIND_S,
  MASH_TICKS, MASH_GAP_MS, zoneX, DEFLECT_REST,
} from './shared/challenge.js';
import { text } from './village.js';
import { audio } from './audio.js';
import { TOUCH } from './touch.js';
import { TAU } from './util.js';

const BANNER_S = 4.5; // G2's line stays this long
const KEY_DIR = { left: 0, right: 1, jump: 2, down: 3 }; // the key actions (src/shared/keys.js) that enter each arrow
const TRAP_MAXT = { snare: SNARE_TICKS, rhythm: RHYTHM_TICKS, lock: SNARE_TICKS, mirror: SNARE_TICKS, mash: MASH_TICKS }; // (each trap's whole time, for its bar)

// The moving arena's ledges as drawn (the dens' art asks, drawSunk): platform index → how far sunk, 0 (up) to 1 (gone
// into the floor); shaking: about to go
const sinkNow = new Map(), shakeNow = new Set();
const FLOOR_Y = 450; // (FIELD_GROUND: every den's floor)
// Draw ledge p (platform i) with draw(), sunk or shaking as the arena has it: it slides down into the floor (clipped there)
export function drawSunk(ctx, p, i, draw) {
  const k = sinkNow.get(i) ?? 0, sh = shakeNow.has(i);
  if (!k && !sh) return draw();
  if (k >= 1) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x - 300, -200, p.w + 600, FLOOR_Y + 200);
  ctx.clip();
  ctx.translate(sh ? Math.sin(performance.now() / 18) * 2.5 : 0, k * (FLOOR_Y - p.y + 40));
  draw();
  ctx.restore();
}

export class Challenges {
  // rpg: src/rpg.js (its net, send, time, pop); keys: src/keys.js
  constructor(rpg, keys) {
    this.rpg = rpg;
    this.keys = keys;
    this.combo = null; // { arrows, i, wrongAt, at, kind, max }: the trap we're in (our own arrows)
    this.caged = null; // { until }: we're in a cage (a friend has to open it)
    this.cages = new Map(); // slime id → { seed, len, until, arrows }: friends in cages (their arrows show to us)
    this.rescue = null; // { who, i, wrongAt }: the cage we're opening
    this.banner = null; // { text, at }
    this.punishUntil = -1; // (rpg.time) a trap failed: the boss's next hit does more
    this.bursts = []; // [x, y, at, kind]: roots breaking apart
    this.arena = null; // { mask, sinkAt, upAt, sink, room, done: 0 | 1 | 2 }: ledges a boss is sinking
    this.dark = null; // { until, mob, at }
    this.tethers = null; // { pairs, from, until, r, mob }
    this.hunt = null; // { pairs: [[son id, slime id]], until }
    this.swungAt = -9; // (rpg.time) we last attacked: a parry's timing
    this.prevSwungAt = -9; // (and the time before: knocking a block back wants a rest before the swing, T3)
    this.style = 'root'; // how the latest snare looks (a fetter in Fenrir's den, iron in Typhon's)
    this.tilt = null; // { tl, dir, warnAt, from, until, room, done: 0 | 1 | 2, edge }: the floor leaning
    this.tooth = null; // { x, holder, until, mob, fly: { x0, x1, at, hit } }: a chip of Brenna's tooth
    this.rewind = null; // { ghosts: Map(id → [x, y]), at, snapAt, mob }: where everyone goes back to
    this.stopped = null; // { at, until, mob }: the stopped hour (A10's wind-up: the room greys)
    this.feint = null; // the fake-out's ring (a hazard), while it ticks
    this.flashAt = -9; // (Rewind's snap: a white flash)
    this.jobs = null; // { ids, until }: hatchlings growing (T2)
    this.airweak = null; // { mob, until, h }: a weak spot up high (T2)
    this.tusk = null; // { mob, until }: the Narwhal's tusk glinting (T2)
    this.mounds = null; // [[x, popAt, popped]]: the Knotmole's mounds (T2); the last to pop is her
    this.zone = null; // { x0, x1, r, at, dur }: Pyra's ring of cool air (T2)
    this.pad = TOUCH ? this.buildPad() : null;
  }

  get time() {
    return this.rpg.time;
  }
  get myId() {
    return this.rpg.net.id;
  }

  // ——— the boss's event → hazards (src/rpg.js hazardEvent) ———
  event(m, add) {
    const now = this.time;
    if (m.type === 'snare' || m.type === 'rhythm' || m.type === 'lock' || m.type === 'mirror' || m.type === 'mash') {
      this.style = m.style ?? 'root';
      for (const [x, d] of m.list) {
        const at = now + d + m.warn;
        add({ type: 'snare', ch: m.type, style: m.style, x, y: m.y, r: m.r, warnAt: now + d, at, dur: m.dur, end: at + m.dur + 0.5, len: m.len, seed: m.seed, flip: m.flip });
        this.rpg.later(at - now, () => audio.sfx('thornRain', { vol: 0.5 }));
      }
      audio.sfx('slashWarn', { vol: 0.5 });
    } else if (m.type === 'swap') {
      for (const [x, y, vx, vy, g, r, delay] of m.shots) add({ type: 'shot', style: 'swap', ch: 'swap', x, y, vx, vy, g, r, at: now + delay, end: now + delay + 4, pos: null });
      audio.sfx('fireball', { vol: 0.5 });
    } else if (m.type === 'rescue') {
      add({ type: 'cage', ch: 'cage', x: m.x, y: m.y, r: m.r, target: m.target, warnAt: now, at: now + m.warn, dur: m.dur, end: now + m.warn + m.dur + 0.3, len: m.len, seed: m.seed });
      audio.sfx('bossWarn', { vol: 0.5 });
      this.rpg.later(m.warn, () => audio.sfx('shellBlock', { vol: 0.7 }));
    } else if (m.type === 'gaps') {
      add({ type: 'gaps', ch: 'gaps', x0: m.x0, v: m.v, w: m.w, from: now, warnAt: now, at: now + m.warn, dur: m.dur, end: now + m.warn + m.dur + 0.4, style: m.style, a: m.a, b: m.b }); // (a, b: only that stretch, a field boss's)
      audio.sfx('bossRoar', { vol: 0.5 });
      this.rpg.later(m.warn, () => audio.sfx('thornRain', { vol: 0.8 }));
    } else if (m.type === 'parry') {
      add({ type: 'bash', ch: 'bash', x: m.x, dir: m.dir, w: m.w, reach: m.reach, h: m.h, warnAt: now, at: now + m.warn, end: now + m.warn + 0.4 });
      audio.sfx('laserCharge', { vol: 0.5 });
      this.rpg.later(m.warn, () => audio.sfx('bossSlam', { vol: 0.7 }));
    } else if (m.type === 'arena') {
      this.arena = { mask: m.down.reduce((a, i) => a | (1 << i), 0), warnAt: now, sinkAt: now + m.warn, upAt: now + m.warn + m.dur, sink: m.sink, room: this.rpg.room, done: 0 };
      audio.sfx('bossRoar', { vol: 0.4 });
    } else if (m.type === 'dark') {
      this.dark = { at: now, until: now + m.dur, mob: m.noBoss ? null : m.id };
      audio.sfx('phaseOut', { vol: 0.6 });
    } else if (m.type === 'tether') {
      this.tethers = { pairs: m.pairs, from: now + m.warn, until: now + m.warn + m.dur, r: m.r, mob: m.id, at: now };
      audio.sfx('shellBlock', { vol: 0.5 });
    } else if (m.type === 'snap') {
      if (this.tethers) this.tethers.pairs = this.tethers.pairs.filter(([a, b]) => !(a === m.a && b === m.b));
      for (const id of [m.a, m.b]) {
        const s = this.at(id);
        if (s) this.rpg.pop(s.x, s.y - 70, 'SNAP!', '#bfe6ff', 18);
      }
      audio.sfx('eggBreak', { vol: 0.7 });
    } else if (m.type === 'parried') {
      const s = this.at(m.by);
      if (s) this.rpg.pop(s.x, s.y - 80, 'PARRY!', '#fff4a8', 22);
      audio.sfx('block');
    } else if (m.type === 'lockDone') {
      const s = this.at(this.myId);
      if (s) this.rpg.pop(s.x, s.y - 90, m.ok ? 'UNLOCKED!' : 'OUT OF STEP', m.ok ? '#ffe28a' : '#ff8fa3', 20);
      audio.sfx(m.ok ? 'bubblePop' : 'error', { vol: 0.6 });
    } else if (m.type === 'hunt') {
      this.hunt = { pairs: m.pairs, until: now + m.dur };
      audio.sfx('bossRoar', { vol: 0.6 });
    } else if (m.type === 'clash') {
      if (this.hunt) this.hunt.until = now;
      this.rpg.pop(m.x, 300, 'CLASH!', '#ffe28a', 22);
      audio.sfx('bossSlam', { vol: 0.8 });
    } else if (m.type === 'headswap') this.rpg.final.here?.()?.headSwap?.(m);
    // ——— T1b's ———
    else if (m.type === 'grid') {
      add({ type: 'lasers', ch: 'laser', masks: m.masks, beat: m.beat, style: m.style, warnAt: now, at: now + m.warn, end: now + m.warn + m.masks.length * m.beat + 0.3 });
      audio.sfx('laserCharge', { vol: 0.5 });
    } else if (m.type === 'late') {
      this.stopped = { at: now, until: now + m.wind, mob: m.id };
      for (const x of m.list) add({ type: 'late', ch: 'late', x, r: m.r, warnAt: now + m.wind - m.tell, at: now + m.wind, dur: 0.25, end: now + m.wind + 0.6 });
      audio.sfx('timeStop', { vol: 0.6 });
      this.rpg.later(m.wind, () => audio.sfx('slash', { vol: 0.8 }));
    } else if (m.type === 'feint') {
      this.feint = add({ type: 'feint', x: m.x, r: m.r, beat: m.beat, warnAt: now, at: now + 99, end: now + 8, tick: 0 });
      audio.sfx('bossWarn', { vol: 0.5 });
    } else if (m.type === 'feintGo' || m.type === 'feintOff') {
      // up it goes (its ring and its ticks go on until it lands), or it thinks better of it
      if (this.feint) this.feint.end = now + (m.type === 'feintGo' ? (m.air ?? 0.6) + 0.1 : 0);
      if (this.feint) this.feint.go = now;
      audio.sfx(m.type === 'feintGo' ? 'leap' : 'reset', { vol: 0.6 });
    } else if (m.type === 'tilt') {
      this.tilt = { tl: m.tl, dir: m.dir, warnAt: now, from: now + m.warn, until: now + m.warn + m.dur, room: this.rpg.room, done: 0, edge: m.edge };
      audio.sfx('bossRoar', { vol: 0.4 });
    } else if (m.type === 'carry') {
      this.tooth = { x: m.x, holder: 0, at: now, until: now + m.ms / 1000, mob: m.id, fly: null, style: m.style };
      audio.sfx('eggBreak', { vol: 0.6 });
    } else if (m.type === 'carried') {
      if (this.tooth) this.tooth.holder = m.by;
      if (m.by === this.myId) audio.sfx('pickup');
    } else if (m.type === 'thrown') {
      if (this.tooth) {
        this.tooth.fly = { x0: m.x0, x1: m.x1, at: now, hit: m.hit };
        this.tooth.holder = 0;
        this.tooth.x = m.x1;
        if (m.hit) this.tooth.until = now + 0.45;
      }
      audio.sfx('dash', { vol: 0.6 });
      if (m.hit) this.rpg.later(0.4, () => {
        this.rpg.pop(m.x1, 260, m.back ? (this.tooth?.style === 'tooth' || !this.tooth?.style ? 'THE STRAP!' : 'FROM BEHIND!') : 'HIT!', '#ffe28a', m.back ? 24 : 20);
        audio.sfx('bossSlam', { vol: 0.8 });
      });
    } else if (m.type === 'dropped') {
      if (this.tooth) [this.tooth.holder, this.tooth.x] = [0, m.x];
    } else if (m.type === 'carryBurst') {
      this.tooth = null;
      this.bursts.push([m.x, 450, this.time, 'ember']);
      this.rpg.fx?.spawn?.('nova', { x: m.x, y: 430, radius: CARRY_BURST_R, tint: 'fire' });
      audio.sfx('bombBoom', { vol: 0.8 });
    } else if (m.type === 'rewind') {
      const me = this.rpg.net.me, ghosts = new Map(m.ghosts.map(([id, x, y]) => [id, [x, y]]));
      if (ghosts.has(this.myId) && me) ghosts.set(this.myId, [me.x, me.y]); // (ours: where we stand in our own predicted world)
      this.rewind = { ghosts, at: now, snapAt: now + m.dur, mob: m.id };
      audio.sfx('timeStop', { vol: 0.5 });
    }
    // ——— T2's ———
    else if (m.type === 'lava') {
      add({ type: 'flood', ch: 'flood', dir: m.dir, passes: m.passes, back: m.back, segs: m.segs, gap: m.gap, warn: m.warn, hot: m.hot, style: m.style, warnAt: now, at: now, end: now + floodSpan(m) + 0.4 });
      audio.sfx(m.style === 'magma' ? 'magmaRise' : 'bossRoar', { vol: 0.5 });
    } else if (m.type === 'jobs') {
      this.jobs = { ids: m.ids, at: now, until: now + m.ms / 1000 };
      audio.sfx('summon', { vol: 0.6 });
    } else if (m.type === 'grow') {
      this.jobs = null;
      for (const id of m.ids) {
        const v = this.rpg.views.get(id);
        if (v) this.rpg.pop(v.x, v.y - 60, 'GROWN!', '#ff8fa3', 18);
      }
      audio.sfx('bossRoar', { vol: 0.5 });
    } else if (m.type === 'airweak') {
      this.airweak = { mob: m.id, until: now + m.dur, h: m.h };
    } else if (m.type === 'airHit') {
      const b = this.rpg.views.get(m.id);
      if (b) this.rpg.pop(b.x, b.y - 150, 'CRACKED!', '#ffe28a', 22);
      if (this.airweak) this.airweak.until = now;
      audio.sfx('crit');
    } else if (m.type === 'tusk') {
      this.tusk = { mob: m.id, at: now, until: now + m.dur + 0.4 };
      audio.sfx('laserCharge', { vol: 0.4 });
    } else if (m.type === 'mounds') {
      this.mounds = m.list.map(([x, d]) => [x, now + d, false]);
      audio.sfx('magmaRise', { vol: 0.4 });
    } else if (m.type === 'punish') {
      const b = this.rpg.views.get(m.id);
      if (b) this.rpg.pop(b.x, b.y - 170, 'OPENING!', '#9ff0b4', 22);
      audio.sfx('bubblePop', { vol: 0.7 });
    }
    // ——— T3's (the field bosses) ———
    else if (m.type === 'pullup') audio.sfx('reset', { vol: 0.6 }); // (a dive that was a feint: it marks again)
    else if (m.type === 'feintThrow') { // (an empty swing: the real throw comes after)
      this.bursts.push([m.x, m.y + 12, now, m.style === 'ice' ? 'ice' : 'ember']);
      audio.sfx('dash', { vol: 0.6 });
    } else if (m.type === 'deflected') {
      if (m.by !== this.myId) {
        this.rpg.pop(m.x, m.y - 50, 'PARRY!', '#fff4a8', 20);
        audio.sfx('block', { vol: 0.6 });
      }
    } else if (m.type === 'rewindGo') {
      const r = this.rewind, net = this.rpg.net, mine = r?.ghosts.get(this.myId);
      if (mine && net.seq) {
        const [x, y] = mine;
        this.rpg.send({ t: 'rw', s: net.seq, x, y });
        net.edit(net.seq, { x, y, vx: 0, vy: 0, dt: 0, hk: 0, sl: false });
      }
      this.rewind = null;
      this.flashAt = now;
      audio.sfx('timeResume', { vol: 0.8 });
    }
  }

  // where slime id is now (us: the predicted state)
  at(id) {
    return id === this.myId ? this.rpg.net.me : this.rpg.slimeOf(id);
  }

  // A hazard of ours on us this step (src/rpg.js hazardHits) → an ouch, null, or 'parried' (sent here already)
  judge(h, me, t, ouch) {
    if (h.type === 'cage') {
      if (t < h.at + h.dur && Math.abs(me.x - h.x) < h.r + 8 && Math.abs(me.y - h.y) < 70) {
        h.done = true;
        return { ...ouch('cage'), mx: h.x, trap: { seed: h.seed, len: h.len, kind: 'rescue' } };
      }
    } else if (h.type === 'gaps') {
      // (not marked done: a Dash's i-frames skip a moment of it, not the whole fall; the hit's invulnerability does the rest)
      if (h.a !== undefined && (me.x < h.a || me.x > h.b)) return null; // (outside its stretch: a field boss's wall, T3)
      if (t < h.at + h.dur && Math.abs(me.x - gapX(h, t)) > h.w / 2 - GAP_GRACE) return ouch('gaps');
    } else if (h.type === 'lasers') {
      // A7: the beam over us is on this beat (any height: they come from the roof). Not marked done: each beat can hit
      const b = Math.floor((t - h.at) / h.beat), c = Math.round((me.x - laserX(0)) / (laserX(1) - laserX(0)));
      if (b < h.masks.length && c >= 0 && c < LASER_COLS && h.masks[b] & (1 << c) && Math.abs(me.x - laserX(c)) < LASER_W / 2 + 6) return ouch('laser');
    } else if (h.type === 'flood') {
      // the den's floor flooding strip by strip: on the floor (not a ledge, not in the air) in a strip that's up
      if (me.grounded && !me.onPlat && floodHot(h, Math.floor(me.x / (1500 / h.segs)), t)) return ouch('flood');
    } else if (h.type === 'late') {
      if (t < h.at + h.dur && Math.abs(me.x - h.x) < h.r + 6) {
        h.done = true;
        return { ...ouch('late'), mx: h.x };
      }
    } else if (h.type === 'bash') {
      // judged once, PARRY_LATE_MS after it lands: in its reach then, you either swung in time (parried) or it hits
      if (t < h.at + PARRY_LATE_MS / 1000) return null;
      h.done = true;
      const a = h.dir > 0 ? h.x : h.x - h.w - h.reach, b = h.dir > 0 ? h.x + h.w + h.reach : h.x;
      if (me.x < a - 10 || me.x > b + 10 || me.y < 450 - h.h) return null;
      if (this.swungAt >= h.at - PARRY_MS / 1000 && this.swungAt <= h.at + PARRY_LATE_MS / 1000) {
        this.rpg.send({ t: 'ouch', s: this.rpg.net.seq, mob: h.mob, kind: 'parry', mx: h.x });
        this.rpg.pop(me.x, me.y - 80, 'PARRY!', '#fff4a8', 22);
        this.rpg.fx?.spawn?.('nova', { x: me.x + h.dir * -20, y: me.y - 20, radius: 50, tint: 'holy' });
        audio.sfx('block');
        return null;
      }
      return { ...ouch('bash'), mx: h.x };
    }
    return null;
  }

  // T3, A20 on a thrown block (the Hall Troll's, `pr`), as it reaches us (src/rpg.js hazardHits): we attacked within
  // PARRY_MS, after holding off DEFLECT_REST? → knocked back (told to the server, flying home): true; else it hits
  deflect(h, me) {
    const t = this.time;
    if (!(t - this.swungAt <= PARRY_MS / 1000 && this.swungAt - this.prevSwungAt >= DEFLECT_REST)) return false;
    this.rpg.send({ t: 'ouch', s: this.rpg.net.seq, mob: h.mob, kind: 'deflect', mx: Math.round(h.pos.x) });
    this.rpg.pop(me.x, me.y - 80, 'PARRY!', '#fff4a8', 22);
    this.rpg.fx?.spawn?.('nova', { x: h.pos.x, y: h.pos.y, radius: 44, tint: 'holy' });
    const b = this.rpg.views.get(h.mob), tx = b?.x ?? h.x, ty = b ? b.y - 60 : h.y, T = 0.6, g = 900;
    this.rpg.hz.push({ type: 'shot', style: h.style, mob: h.mob, back: true, x: h.pos.x, y: h.pos.y, vx: (tx - h.pos.x) / T, vy: (ty - h.pos.y - 0.5 * g * T * T) / T, g, r: h.r, warnAt: t, at: t, end: t + T, pos: null });
    audio.sfx('block');
    return true;
  }

  // We attacked (a slap or a skill: src/main.js): a parry's timing
  swung() {
    this.prevSwungAt = this.swungAt;
    this.swungAt = this.time;
  }

  // One of ours caught us (src/rpg.js step, on a fresh step): → the predicted edit ({tr} or {cs}), and the combo starts
  hit(ouch) {
    const h = ouch.trap;
    delete ouch.trap;
    const k = ouch.kind;
    if (k === 'snare' || k === 'rhythm' || k === 'lock' || k === 'mirror') {
      const seed = k === 'lock' ? h.seed : seedFor(h.seed, this.myId); // (a lock: everyone the same arrows)
      this.combo = { arrows: comboFor(seed, h.len), i: 0, wrongAt: -9, at: this.time, kind: k, max: TRAP_MAXT[k], flip: k === 'mirror' ? h.flip : null };
      audio.sfx('block');
      return { tr: TRAP_MAXT[k] };
    }
    if (k === 'mash') {
      this.combo = { arrows: null, n: h.len, i: 0, wrongAt: -9, at: this.time, kind: k, max: MASH_TICKS };
      audio.sfx('block');
      return { tr: MASH_TICKS };
    }
    if (k === 'cage') {
      this.caged = { until: this.time + CAGE_S, at: this.time };
      audio.sfx('shellBlock');
      return { tr: TRAP_HOLD };
    }
    if (k === 'swap') {
      audio.sfx('zap', { vol: 0.6 });
      return { cs: SWAP_TICKS };
    }
    return null;
  }

  // {t:'chal'} from the server
  receive(m) {
    if (m.a === 'first' && CHALLENGES[m.type]) this.banner = { text: CHALLENGES[m.type].banner, at: this.time };
    else if (m.a === 'caged') {
      if (m.id !== this.myId) this.cages.set(m.id, { seed: m.seed, len: m.len, at: this.time, until: this.time + m.ms / 1000, arrows: comboFor(m.seed, m.len) });
    } else if (m.a === 'freed') {
      this.cages.delete(m.id);
      if (this.rescue?.who === m.id) this.rescue = null;
      if (m.id === this.myId) this.caged = null;
      if (m.id !== this.myId || m.by) {
        const s = this.at(m.id);
        if (s) this.bursts.push([s.x, s.y, this.time]);
      }
      if (m.by === this.myId) audio.sfx('bubblePop');
    } else if (m.a === 'crushed') {
      this.cages.delete(m.id);
      if (m.id === this.myId) this.caged = null;
    }
  }

  // Every frame: a trap that ran out before the combo was in failed (or the server never agreed it caught us); the
  // arena's ledges as our clock passes its schedule
  update(me) {
    const t = this.time, net = this.rpg.net;
    if (this.combo && !(me?.tr > 0)) {
      this.combo = null;
      if (me) {
        this.punishUntil = t + PUNISH_KEEP_S;
        this.rpg.pop(me.x, me.y - 80, 'TOO SLOW', '#ff6f91', 16);
        audio.sfx('shellBlock', { vol: 0.6 });
      }
    }
    if (this.caged && (!(me?.tr > 0) || t > this.caged.until + 3)) this.caged = null;
    for (const [id, c] of this.cages) if (t > c.until + 1 || (t - c.at > 0.6 && !(this.rpg.slimeOf(id)?.tr > 0))) this.cages.delete(id); // (others are drawn a moment behind)
    if (this.rescue && !this.cages.has(this.rescue.who)) this.rescue = null;
    // the moving arena: sink, then raise, each a predicted edit at the newest input (the server checks what's sunk)
    const a = this.arena;
    sinkNow.clear();
    shakeNow.clear();
    if (a && a.room !== this.rpg.room) this.arena = null;
    else if (a) {
      if (a.done === 0 && t >= a.sinkAt) this.ledges((net.me.pf | 0) | a.mask, (a.done = 1));
      if (a.done === 1 && t >= a.upAt) this.ledges((net.me.pf | 0) & ~a.mask, (a.done = 2));
      const k = t < a.sinkAt ? 0 : t < a.upAt ? Math.min(1, (t - a.sinkAt) / a.sink) : 1 - Math.min(1, (t - a.upAt) / a.sink);
      for (let i = 0; i < 8; i++) if (a.mask & (1 << i)) sinkNow.set(i, k);
      for (let i = 0; i < 8; i++) if (a.mask & (1 << i) && t < a.sinkAt) shakeNow.add(i);
      if (t > a.upAt + a.sink) this.arena = null;
    }
    // the tilting floor: lean, then level again, each a predicted edit at the newest input (the server checks the lean)
    const tl = this.tilt;
    if (tl && tl.room !== this.rpg.room) this.tilt = null;
    else if (tl) {
      if (tl.done === 0 && t >= tl.from) this.lean(tl.tl, (tl.done = 1));
      if (tl.done === 1 && t >= tl.until) this.lean(0, (tl.done = 2));
      if (t > tl.until + 0.5) this.tilt = null;
    }
    // the fake-out ticks on its beat (it lands half a beat after one)
    const f = this.feint;
    if (f && t > f.end) this.feint = null;
    else if (f && t - f.warnAt >= (f.tick + 1) * f.beat) {
      f.tick++;
      audio.sfx('bombTick', { vol: 0.7 });
    }
    // a mash done but faster than the server allows: it goes when the time's up
    const c = this.combo;
    if (c?.kind === 'mash' && c.i >= c.n && t - c.at >= (c.n * MASH_GAP_MS) / 1000 + 0.05) this.freeOwn();
    if (this.jobs && t > this.jobs.until + 0.5) this.jobs = null;
    if (this.airweak && t > this.airweak.until + 0.3) this.airweak = null;
    if (this.tusk && t > this.tusk.until) this.tusk = null;
    if (this.mounds) {
      for (const md of this.mounds) if (!md[2] && t >= md[1]) {
        md[2] = true;
        this.bursts.push([md[0], FLOOR_Y, t, 'dirt']);
      }
      if (this.mounds.every((md) => md[2])) this.mounds = null;
    }
    if (this.zone && t > this.zone.at + this.zone.dur + 0.5) this.zone = null;
    if (this.tooth && t > this.tooth.until + 0.5) this.tooth = null;
    if (this.rewind && t > this.rewind.snapAt + 2) this.rewind = null;
    if (this.stopped && t > this.stopped.until + 0.3) this.stopped = null;
    if (this.pad) this.pad.hidden = !this.combo && !this.near(me);
    this.bursts = this.bursts.filter((b) => t - b[2] < 0.6);
    if (this.dark && t > this.dark.until + 0.6) this.dark = null;
    if (this.tethers && t > this.tethers.until) this.tethers = null;
    if (this.hunt && t > this.hunt.until) this.hunt = null;
  }
  ledges(pf) {
    const net = this.rpg.net;
    if (!net.seq) return;
    this.rpg.send({ t: 'pf', s: net.seq, pf });
    net.edit(net.seq, { pf });
  }
  lean(tl) {
    const net = this.rpg.net;
    if (!net.seq) return;
    this.rpg.send({ t: 'pf', s: net.seq, tl });
    net.edit(net.seq, { tl });
  }

  // ——— A22: the chip of Brenna's tooth ———
  // are we carrying it? (no attacking or casting meanwhile: an attack throws it, src/main.js)
  carrying() {
    return !!this.tooth && this.tooth.holder === this.myId && !this.tooth.fly;
  }
  // a chip lying within reach of us (the loot key picks it up before any loot)
  toothNear(me) {
    const T = this.tooth;
    return !!T && !T.holder && !T.fly && !!me && Math.abs(T.x - me.x) <= CARRY_R && me.y > FLOOR_Y - 140;
  }
  // an attack while carrying: thrown the way we face (the server judges whether it reaches her)
  throw(dir) {
    const net = this.rpg.net;
    this.rpg.send({ t: 'carry', s: net.seq, a: 'throw', dir });
    const x1 = Math.max(80, Math.min(1420, net.me.x + dir * THROW_RANGE * 0.6));
    this.tooth.fly = { x0: net.me.x, x1, at: this.time, hit: 0 }; // (the server's 'thrown' corrects it)
    [this.tooth.holder, this.tooth.x] = [0, x1];
  }

  // the caged friend we're standing at (a rescue's arrows go to it), or null
  near(me) {
    if (!me || me.tr > 0 || !this.cages.size) return null;
    let best = null, bd = RESCUE_R;
    for (const [id] of this.cages) {
      const s = this.rpg.slimeOf(id);
      if (!s) continue;
      const d = Math.abs(s.x - me.x);
      if (d <= bd && Math.abs(s.y - me.y) < 110) [best, bd] = [id, d];
    }
    return best;
  }

  // A key press (src/main.js, before movement): true if it went into our own combo (movement ignores it meanwhile); a
  // friend's cage takes the arrows too, but you still move (false)
  key(e) {
    if (e.repeat) return false;
    const id = this.keys.of(e), dir = KEY_DIR[id];
    if (dir === undefined) return false;
    if (this.combo) {
      this.press(dir);
      return true; // (a mash: every movement key is held off; only Jump counts)
    }
    if (this.near(this.rpg.net.me) !== null) this.press(dir);
    return false;
  }

  press(dir) {
    const net = this.rpg.net;
    if (this.combo) return this.pressOwn(dir);
    const who = this.near(net.me);
    if (who === null) return;
    const cage = this.cages.get(who);
    if (this.rescue?.who !== who) this.rescue = { who, i: 0, wrongAt: -9 };
    const r = this.rescue;
    if (cage.arrows[r.i] !== dir) {
      r.i = 0;
      r.wrongAt = this.time;
      audio.sfx('error', { vol: 0.4 });
      return;
    }
    r.i++;
    audio.sfx('pickup', { vol: 0.4 });
    if (r.i < cage.arrows.length) return;
    this.rpg.send({ t: 'free', s: net.seq, k: cage.arrows, who });
    this.rescue = null;
  }

  pressOwn(dir) {
    const c = this.combo, net = this.rpg.net, t = this.time;
    if (!(net.me.tr > 0)) return;
    if (c.kind === 'mash') { // (A2: Jump, again and again)
      if (dir !== 2 || c.i >= c.n) return;
      c.i++;
      c.hitAt = t;
      audio.sfx('pickup', { vol: 0.25 });
      return;
    }
    // the rhythm lock: only on the beat (counted from when it caught us)
    const off = c.kind === 'rhythm' ? Math.abs(((t - c.at + RHYTHM_BEAT / 2) % RHYTHM_BEAT) - RHYTHM_BEAT / 2) : 0;
    if (c.arrows[c.i] !== dir || off > RHYTHM_WINDOW) {
      c.i = 0; // a wrong key (or off the beat) starts it over
      c.wrongAt = t;
      audio.sfx('error', { vol: 0.5 });
      return;
    }
    c.i++;
    audio.sfx('pickup', { vol: 0.4 });
    if (c.i < c.arrows.length) return;
    this.freeOwn();
  }
  // all in: free at the newest input (the server checks the order, or a mash's count, and frees us there too)
  freeOwn() {
    const c = this.combo, net = this.rpg.net;
    this.rpg.send({ t: 'free', s: net.seq, k: c.kind === 'mash' ? c.i : c.arrows });
    net.free(net.seq);
    this.combo = null;
    this.bursts.push([net.me.x, net.me.y, this.time]);
    audio.sfx('bubblePop');
  }

  // A boss's hit on us after a failed snare: the client only shows it (the server doubles it), so it lapses here too
  hurtByBoss() {
    this.punishUntil = -1;
  }

  // ——— drawing ———
  // Over the slimes (world space): list = [[slime, tr, cs], …] for everyone shown, our own last
  drawOver(ctx, list, mine) {
    const t = this.time;
    if (this.stopped) this.drawStopped(ctx, t);
    if (this.tilt) this.drawTilt(ctx, t);
    if (this.rewind) this.drawGhosts(ctx, t);
    if (this.tooth) this.drawTooth(ctx, t);
    if (this.dark) this.drawDark(ctx, list, t);
    if (this.mounds) for (const [x, at, popped] of this.mounds) if (!popped) drawMound(ctx, x, t, at - t);
    if (this.zone) this.drawZone(ctx, t);
    if (this.jobs) this.drawJobs(ctx, t);
    if (this.airweak) this.drawAirweak(ctx, t);
    if (this.tusk) this.drawTusk(ctx, t);
    if (this.tethers && t >= this.tethers.at) this.drawTethers(ctx, t);
    if (this.hunt) this.drawHunt(ctx, t);
    for (const [s, tr, cs] of list) {
      if (tr >= TRAP_HOLD) drawCage(ctx, s.x, s.y, t);
      else if (tr > 0) (this.style === 'fetter' ? drawFetters : PAL[this.style] ? drawIron : drawRoots)(ctx, s.x, s.y, s.h ?? 40, t, tr / SNARE_TICKS, this.style);
      if (cs > 0) drawSwapSign(ctx, s.x, s.y - (s.h ?? 40) - (s === mine && this.combo ? 80 : 30), t, cs / SWAP_TICKS);
    }
    for (const [x, y, at, kind] of this.bursts) drawBurst(ctx, x, y, (t - at) / 0.6, kind ?? this.style);
    if (t - this.flashAt < 0.35) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 0.7 * (1 - (t - this.flashAt) / 0.35);
      ctx.fillStyle = '#fff8e6';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
    if (mine && this.punishUntil > t) {
      const p = 0.5 + 0.5 * Math.sin(t * 9);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.35 * p;
      ctx.strokeStyle = '#ff5a7a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(mine.x, mine.y - (mine.h ?? 40) / 2, 34, (mine.h ?? 40) / 2 + 10, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    const c = this.combo, me = this.rpg.net.me;
    if (c && mine && c.kind === 'mash') drawMash(ctx, mine.x, mine.y - (mine.h ?? 40) - 34, c, t, (me.tr | 0) / MASH_TICKS);
    else if (c && mine) drawCombo(ctx, mine.x, mine.y - (mine.h ?? 40) - 34, c, t, (me.tr | 0) / (c.max || SNARE_TICKS), c.kind === 'rhythm' ? c.at : null, c.flip);
    // in a cage: the time left (a friend opens it)
    if (this.caged && mine) drawCageClock(ctx, mine.x, mine.y - (mine.h ?? 40) - 40, (this.caged.until - t) / CAGE_S, t);
    // a friend's cage we're standing at: its arrows over it, ours to enter
    const who = this.near(me);
    if (who !== null) {
      const s = this.rpg.slimeOf(who), cage = this.cages.get(who), r = this.rescue?.who === who ? this.rescue : { i: 0, wrongAt: -9 };
      if (s && cage) drawCombo(ctx, s.x, s.y - (s.h ?? 40) - 40, { arrows: cage.arrows, i: r.i, wrongAt: r.wrongAt }, t, (cage.until - t) / CAGE_S, null);
    }
  }

  // ——— T2's art ———
  // Pyra's ring of cool air drifting across the den while her Rebirth gathers
  drawZone(ctx, t) {
    const z = this.zone, k = (t - z.at) / z.dur, x = zoneX(z, k);
    ctx.save();
    ctx.fillStyle = 'rgba(170,230,255,0.18)';
    ctx.strokeStyle = `rgba(190,240,255,${0.6 + 0.3 * Math.sin(t * 8)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, FLOOR_Y + 1, z.r, 14, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const px = x - z.r * 0.7 + i * z.r * 0.35, py = FLOOR_Y - ((t * 60 + i * 37) % 120);
      ctx.fillStyle = 'rgba(220,245,255,0.6)';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  // a hatchling's time left before it grows: a ring over it closing
  drawJobs(ctx, t) {
    const J = this.jobs, k = Math.max(0, Math.min(1, (J.until - t) / (J.until - J.at)));
    for (const id of J.ids) {
      const v = this.rpg.views.get(id);
      if (!v || v.dead) continue;
      ctx.save();
      ctx.strokeStyle = k > 0.3 ? '#ffd06a' : `rgba(255,111,145,${0.6 + 0.4 * Math.sin(t * 14)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(v.x, v.y - 70, 11, -Math.PI / 2, -Math.PI / 2 + TAU * k);
      ctx.stroke();
      ctx.restore();
    }
  }
  // the weak spot on its back while it's up there, and the height you need (a dashed line)
  drawAirweak(ctx, t) {
    const A = this.airweak, b = this.rpg.views.get(A.mob);
    if (!b || t > A.until) return;
    const x = b.x - (b.dir ?? 1) * 40, y = b.y - 110, p = 0.5 + 0.5 * Math.sin(t * 16);
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 2, x, y, 30);
    g.addColorStop(0, `rgba(255,236,150,${0.7 + 0.3 * p})`);
    g.addColorStop(1, 'rgba(255,200,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 30, y - 30, 60, 60);
    ctx.strokeStyle = 'rgba(255,226,140,0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(b.x - 260, FLOOR_Y - A.h);
    ctx.lineTo(b.x + 260, FLOOR_Y - A.h);
    ctx.stroke();
    ctx.restore();
  }
  // the Old Narwhal's tusk glinting as it lowers (the only tell of its late charge)
  drawTusk(ctx, t) {
    const T = this.tusk, b = this.rpg.views.get(T.mob);
    if (!b) return;
    const x = b.x + (b.dir ?? 1) * 150, y = b.y - 70, k = Math.min(1, (t - T.at) / 0.4), r = 6 + 10 * k * (0.6 + 0.4 * Math.sin(t * 20));
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.translate(x, y);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(2, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-2, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // ——— T1b's art ———
  // A10's stopped hour: the room greys while he gathers himself, a glow at him (the real tell)
  drawStopped(ctx, t) {
    const d = this.stopped, k = Math.min(1, (t - d.at) / 0.2, Math.max(0, (d.until + 0.3 - t) / 0.3));
    if (k <= 0) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.28 * k;
    ctx.fillStyle = '#c9b48a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
    const b = this.rpg.views.get(d.mob);
    if (!b) return;
    const g = ctx.createRadialGradient(b.x, b.y - 100, 10, b.x, b.y - 100, 150);
    g.addColorStop(0, `rgba(255,236,170,${0.75 * k})`);
    g.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(b.x - 150, b.y - 250, 300, 300);
    ctx.restore();
  }

  // the tilting floor: chevrons along the floor pointing downhill, the chain grinding at the low end
  drawTilt(ctx, t) {
    const T = this.tilt, live = t >= T.from && t < T.until, W = 1500, y = FLOOR_Y;
    const k = t < T.from ? 0.35 + 0.35 * Math.sin(t * 12) : t < T.until ? 1 : Math.max(0, 1 - (t - T.until) / 0.5);
    ctx.save();
    ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(255,190,120,0.75)';
    const step = 90, off = live ? ((t * Math.abs(tiltV(T.tl)) * 0.8) % step) * T.dir : 0;
    for (let x = -step; x < W + step; x += step) {
      const cx = x + off;
      ctx.beginPath();
      ctx.moveTo(cx + T.dir * 10, y - 9);
      ctx.lineTo(cx - T.dir * 6, y - 17);
      ctx.lineTo(cx - T.dir * 6, y - 1);
      ctx.closePath();
      ctx.fill();
    }
    // the low end: the hoist's chain grinding
    const a = T.dir < 0 ? 0 : W - T.edge;
    const g = ctx.createLinearGradient(T.dir < 0 ? 0 : W, 0, T.dir < 0 ? T.edge : W - T.edge, 0);
    g.addColorStop(0, `rgba(255,90,60,${live ? 0.45 : 0.2})`);
    g.addColorStop(1, 'rgba(255,90,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(a, y - 120, T.edge, 122);
    ctx.strokeStyle = '#4a3a34';
    ctx.lineWidth = 5;
    ctx.setLineDash([12, 6]);
    ctx.lineDashOffset = live ? t * 160 * T.dir : 0;
    ctx.beginPath();
    ctx.moveTo(a, y - 3);
    ctx.lineTo(a + T.edge, y - 3);
    ctx.stroke();
    ctx.restore();
  }

  // Rewind: a ghost of each slime where it'll go back to, a clock hand sweeping round it, a thread to the slime
  drawGhosts(ctx, t) {
    const R = this.rewind, k = Math.max(0, Math.min(1, (R.snapAt - t) / REWIND_S));
    ctx.save();
    for (const [id, [x, y]] of R.ghosts) {
      const s = this.at(id);
      if (!s) continue;
      ctx.strokeStyle = 'rgba(255,226,150,0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 20);
      ctx.lineTo(x, y - 20);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = 'rgba(255,240,200,0.35)';
      ctx.strokeStyle = 'rgba(255,226,150,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y - 19, 24, 19, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ffd06a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 19, 30, -Math.PI / 2, -Math.PI / 2 - TAU * k, true);
      ctx.stroke();
      const a = -Math.PI / 2 - TAU * k;
      ctx.strokeStyle = '#fff4d6';
      ctx.beginPath();
      ctx.moveTo(x, y - 19);
      ctx.lineTo(x + Math.cos(a) * 16, y - 19 + Math.sin(a) * 16);
      ctx.stroke();
    }
    ctx.restore();
  }

  // A22: the chip on the floor (glowing, its time running out), over whoever carries it, or flying
  drawTooth(ctx, t) {
    const T = this.tooth;
    let x = T.x, y = FLOOR_Y - 14, ang = Math.sin(t * 3) * 0.2;
    if (T.fly) {
      const f = Math.min(1, (t - T.fly.at) / 0.4);
      x = T.fly.x0 + (T.fly.x1 - T.fly.x0) * f;
      y = FLOOR_Y - 60 - Math.sin(f * Math.PI) * 120 + (T.fly.hit ? -80 * f : 46 * f);
      ang = t * 14;
      if (f >= 1 && !T.fly.hit) T.fly = null;
      if (f >= 1 && T.fly?.hit) return;
    } else if (T.holder) {
      const s = this.at(T.holder);
      if (!s) return;
      [x, y, ang] = [s.x, s.y - (s.h ?? 40) - 30 + Math.sin(t * 5) * 2, 0.15];
    } else {
      // a ring for the pickup reach and the time left
      const left = Math.max(0, Math.min(1, (T.until - t) / CARRY_S));
      ctx.save();
      ctx.strokeStyle = left > 0.3 ? 'rgba(255,208,106,0.7)' : `rgba(255,111,145,${0.6 + 0.4 * Math.sin(t * 14)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(x, FLOOR_Y + 1, CARRY_R * 0.7, 8, 0, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - 36, 9, -Math.PI / 2, -Math.PI / 2 + TAU * left);
      ctx.stroke();
      ctx.restore();
    }
    drawChip(ctx, x, y, ang, t, T.style);
  }

  // A16: black but a light round each slime and the boss (one offscreen layer, holes cut in it)
  drawDark(ctx, list, t) {
    const d = this.dark, k = Math.min(1, (t - d.at) / 0.6, (d.until + 0.6 - t) / 0.6);
    if (k <= 0) return;
    const c = ctx.canvas, T = ctx.getTransform();
    const off = (this.darkLayer ??= document.createElement('canvas'));
    if (off.width !== c.width || off.height !== c.height) [off.width, off.height] = [c.width, c.height];
    const o = off.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.globalCompositeOperation = 'source-over';
    o.clearRect(0, 0, off.width, off.height);
    o.fillStyle = 'rgba(6,8,18,0.96)';
    o.fillRect(0, 0, off.width, off.height);
    o.setTransform(T);
    o.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => {
      const g = o.createRadialGradient(x, y, r * 0.35, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      o.fillStyle = g;
      o.fillRect(x - r, y - r, r * 2, r * 2);
    };
    for (const [s] of list) hole(s.x, s.y - 20, DARK_R);
    const b = this.rpg.views.get(d.mob);
    if (b && d.mob) hole(b.x, b.y - 120, 70); // (its eyes; the Knotmole underground has none)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = k;
    ctx.drawImage(off, 0, 0);
    ctx.restore();
  }

  // A18: a chain of old ice between each pair (or a slime and the boss), paling to red as it nears TETHER_R
  drawTethers(ctx, t) {
    const T = this.tethers, live = t >= T.from;
    for (const [a, b] of T.pairs) {
      const p = this.at(a), q = b ? this.at(b) : this.rpg.views.get(T.mob);
      if (!p || !q) continue;
      const x0 = p.x, y0 = p.y - 20, x1 = q.x, y1 = b ? q.y - 20 : q.y - 80, d = Math.hypot(x1 - x0, y1 - y0), k = Math.min(1, d / (T.r ?? TETHER_R));
      ctx.save();
      ctx.globalAlpha = live ? 1 : 0.45 + 0.3 * Math.sin(t * 14);
      ctx.strokeStyle = k > 0.8 ? `rgba(255,${Math.round(120 - 80 * (k - 0.8) * 5)},130,0.95)` : 'rgba(190,230,255,0.9)';
      ctx.lineWidth = 3 + (k > 0.8 ? Math.sin(t * 30) * 1.5 : 0);
      ctx.setLineDash([9, 6]);
      ctx.lineDashOffset = -t * 40;
      ctx.beginPath();
      const sag = Math.max(0, 1 - k) * 40;
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);
      for (const [x, y] of [[x0, y0], [x1, y1]]) {
        ctx.fillStyle = '#e8f6ff';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // the Hunt: a red mark over each hunted slime and a dashed line from its hunter
  drawHunt(ctx, t) {
    for (const [sid, id] of this.hunt.pairs) {
      const v = this.rpg.views.get(sid), s = this.at(id);
      if (!s) continue;
      ctx.save();
      if (v) {
        ctx.strokeStyle = 'rgba(255,90,100,0.55)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -t * 80;
        ctx.beginPath();
        ctx.moveTo(v.x, v.y - 30);
        ctx.lineTo(s.x, s.y - 20);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const y = s.y - (s.h ?? 40) - 26 + Math.sin(t * 8) * 2;
      ctx.fillStyle = '#ff5a6a';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, y + 10);
      ctx.lineTo(s.x - 9, y - 4);
      ctx.lineTo(s.x + 9, y - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // G2's banner (screen space, over the HUD)
  drawHud(ctx) {
    const b = this.banner;
    if (!b) return;
    const k = (this.time - b.at) / BANNER_S;
    if (k > 1) return (this.banner = null);
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 8, (1 - k) * 5);
    ctx.font = "700 17px Fredoka, 'Trebuchet MS', sans-serif";
    const w = ctx.measureText(b.text).width + 44, cy = 222;
    ctx.fillStyle = 'rgba(58,34,64,0.88)';
    ctx.strokeStyle = '#ffd06a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(480 - w / 2, cy - 19, w, 38, 19);
    ctx.fill();
    ctx.stroke();
    text(ctx, b.text, 480, cy + 1, 17, '#fff4d6');
    ctx.restore();
  }

  // ——— the arrow pad (touch): four big buttons over the game while trapped, or standing at a friend's cage ———
  buildPad() {
    const pad = document.createElement('div');
    pad.id = 'chpad';
    pad.hidden = true;
    ARROWS.forEach((name, dir) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `chpad-${name}`;
      b.textContent = ARROW_GLYPH[dir];
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.press(dir);
      });
      pad.append(b);
    });
    document.getElementById('stage').append(pad);
    return pad;
  }
}

// An arrow (a rounded triangle) pointing dir (0 left, 1 right, 2 up, 3 down), centred on x, y
function arrow(ctx, x, y, dir, size) {
  const a = [Math.PI, 0, -Math.PI / 2, Math.PI / 2][dir];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(size * 0.62, 0);
  ctx.lineTo(-size * 0.42, -size * 0.55);
  ctx.lineTo(-size * 0.42, size * 0.55);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.22;
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

// The combo over your head: a row of arrow keys (done ones green), the one to press glowing, a bar for the time left.
// beatAt: a rhythm lock's first beat (rings close in on the key to press, landing on each beat)
// flip: A4's mirror trap: each arrow drawn as MIRROR[flip] has it (enter what it means), in a silvered frame
function drawCombo(ctx, x, y, c, t, left, beatAt = null, flip = null) {
  const n = c.arrows.length, S = 26, G = 5, w = n * S + (n - 1) * G;
  const shake = t - c.wrongAt < 0.25 ? Math.sin(t * 90) * 5 * (1 - (t - c.wrongAt) / 0.25) : 0;
  const x0 = x - w / 2 + shake;
  ctx.save();
  ctx.fillStyle = flip ? 'rgba(70,82,104,0.85)' : 'rgba(48,30,56,0.78)';
  ctx.beginPath();
  ctx.roundRect(x0 - 8, y - S / 2 - 8, w + 16, S + 24, 12);
  ctx.fill();
  if (flip) {
    // the mirror: a silver frame and a glint sweeping across it, and the axis it flips on
    ctx.strokeStyle = '#d8e4f2';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    const gx = x0 - 8 + ((t * 0.7) % 1) * (w + 16);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(gx - 6, y - S / 2 - 8, 12, S + 24);
    ctx.strokeStyle = 'rgba(216,228,242,0.55)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    if (flip === 'h') {
      ctx.moveTo(x, y - S / 2 - 6);
      ctx.lineTo(x, y + S / 2 + 6);
    } else {
      ctx.moveTo(x0 - 6, y);
      ctx.lineTo(x0 + w + 6, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  c.arrows.forEach((d, i) => {
    const bx = x0 + i * (S + G), done = i < c.i, now = i === c.i;
    const wrong = t - c.wrongAt < 0.25;
    ctx.fillStyle = done ? '#7fd88f' : now ? (wrong ? '#ff8fa3' : '#fff4d6') : 'rgba(255,255,255,0.22)';
    ctx.strokeStyle = now ? `rgba(255,208,106,${0.6 + 0.4 * Math.sin(t * 12)})` : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = now ? 3 : 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, y - S / 2, S, S, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle = done ? '#2e6b3a' : now ? '#5b3a6b' : 'rgba(255,255,255,0.85)';
    arrow(ctx, bx + S / 2, y, flip ? MIRROR[flip][d] : d, 9);
    if (now && beatAt !== null) {
      // the beat: a ring closing in, landing as the beat does (a flash on it)
      const ph = ((t - beatAt) % RHYTHM_BEAT) / RHYTHM_BEAT, on = Math.min(ph, 1 - ph) * RHYTHM_BEAT < RHYTHM_WINDOW;
      ctx.strokeStyle = on ? 'rgba(150,255,190,0.95)' : 'rgba(190,220,255,0.75)';
      ctx.lineWidth = on ? 3.5 : 2;
      ctx.beginPath();
      ctx.arc(bx + S / 2, y, S * 0.55 + (1 - ph) * 22, 0, TAU);
      ctx.stroke();
    }
  });
  // the time left
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x0, y + S / 2 + 6, w, 4);
  ctx.fillStyle = left > 0.35 ? '#ffd06a' : '#ff6f91';
  ctx.fillRect(x0, y + S / 2 + 6, w * Math.max(0, Math.min(1, left)), 4);
  ctx.restore();
}

// Roots wrapped round a snared slime (x, y: its feet), loosening as the time runs out
function drawRoots(ctx, x, y, h, t, left) {
  const W = 30, sway = Math.sin(t * 3) * 1.5;
  ctx.save();
  ctx.lineCap = 'round';
  // the gnarled base
  ctx.fillStyle = '#7a5a3e';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, W + 8, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#9a7652';
  ctx.beginPath();
  ctx.ellipse(x - 4, y - 1, W, 4, 0, 0, TAU);
  ctx.fill();
  // vines winding up and round the body
  const reach = h * (0.55 + 0.25 * Math.min(1, left * 1.5));
  for (let i = 0; i < 4; i++) {
    const s = i % 2 ? 1 : -1, x0 = x + (i - 1.5) * 14;
    ctx.strokeStyle = '#4f7d43';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.bezierCurveTo(x0 + s * 30, y - reach * 0.3, x - s * 34 + sway, y - reach * 0.6, x + s * 10, y - reach);
    ctx.stroke();
    ctx.strokeStyle = '#8fc06a';
    ctx.lineWidth = 2;
    ctx.stroke();
    // a thorn or two along it
    ctx.fillStyle = '#efe2b4';
    for (const f of [0.35, 0.7]) {
      const px = x0 + (x + s * 10 - x0) * f + s * 18 * Math.sin(f * Math.PI), py = y - reach * f;
      ctx.beginPath();
      ctx.moveTo(px - 3, py);
      ctx.lineTo(px + s * 6, py - 4);
      ctx.lineTo(px + 1, py + 3);
      ctx.closePath();
      ctx.fill();
    }
  }
  // a little leaf on top
  ctx.fillStyle = '#9fd47a';
  ctx.beginPath();
  ctx.ellipse(x + 6, y - reach - 3, 7, 4, -0.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// Turned round: a sign over the slime with two arrows trading places, and a ring for the time left
function drawSwapSign(ctx, x, y, t, left) {
  const bob = Math.sin(t * 6) * 2, R = 20;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = 'rgba(150,104,214,0.92)';
  ctx.strokeStyle = '#fff4fb';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ffd06a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 0, R + 4, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, Math.min(1, left)));
  ctx.stroke();
  // two curved arrows chasing each other round
  ctx.rotate(t * 2.2);
  ctx.strokeStyle = ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 3;
  for (const a of [0, Math.PI]) {
    ctx.beginPath();
    ctx.arc(0, 0, 10, a + 0.3, a + 2.5);
    ctx.stroke();
    const hx = Math.cos(a + 2.5) * 10, hy = Math.sin(a + 2.5) * 10, d = a + 2.5 + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(hx + Math.cos(d) * 5, hy + Math.sin(d) * 5);
    ctx.lineTo(hx + Math.cos(d + 2.3) * 5, hy + Math.sin(d + 2.3) * 5);
    ctx.lineTo(hx + Math.cos(d - 2.3) * 5, hy + Math.sin(d - 2.3) * 5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// Roots snapping apart (broke free); iron cracking off (kind 'iron'), embers (a chip of the tooth bursting)
function drawBurst(ctx, x, y, k, kind = 'root') {
  if (k > 1) return;
  const cols = PAL[kind] ? [PAL[kind].body, PAL[kind].crack] : kind === 'ember' ? ['#ffb347', '#ff6a3a'] : kind === 'fetter' ? ['#e8f2ff', '#9ab0d8'] : kind === 'dirt' ? ['#7a5a3e', '#a07a52'] : ['#8fc06a', '#9a7652'];
  ctx.save();
  ctx.globalAlpha = 1 - k;
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI * (i / 7), d = 10 + 40 * k;
    ctx.fillStyle = cols[i % 2];
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * d, y - 12 + Math.sin(a) * d + 30 * k * k, 6, 3, a, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// The snare hazard on the floor (src/hazards.js DRAW): a ring of roots twitching under the mark, then springing up
export function drawSnareHz(ctx, h, now) {
  const x = h.x, y = h.y ?? 450, r = h.r;
  if (h.style === 'fetter') return drawFetterHz(ctx, h, now);
  if (PAL[h.style]) return drawIronHz(ctx, h, now);
  if (h.ch === 'lock' && now < h.at) {
    // the group lock: a golden ring of the Keepers' rune under each, so the party sees it's the one lock
    ctx.strokeStyle = `rgba(255,214,110,${0.4 + 0.3 * Math.sin(now * 10)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r + 10, 12, 0, 0, TAU);
    ctx.stroke();
  }
  if (now < h.at) {
    const k = Math.max(0, Math.min(1, (now - h.warnAt) / Math.max(0.05, h.at - h.warnAt)));
    const pulse = 0.5 + 0.5 * Math.sin(now * (8 + 12 * k));
    ctx.fillStyle = `rgba(122,90,62,${0.25 + 0.35 * k})`;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r, 8, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,84,112,${0.35 + 0.5 * k * pulse})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = now * 30;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r, 8, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    // root tips poking up, more as it nears
    ctx.strokeStyle = '#5f8f4e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const px = x - r * 0.8 + (i / 5) * r * 1.6, up = (4 + 10 * k) * (0.6 + 0.4 * Math.sin(now * 14 + i * 2));
      ctx.beginPath();
      ctx.moveTo(px, y + 2);
      ctx.quadraticCurveTo(px + 4, y - up / 2, px + (i % 2 ? 3 : -3), y - up);
      ctx.stroke();
    }
    return;
  }
  // sprung: a clump of roots shooting up, then sinking back
  const live = h.at + h.dur, f = now > live ? Math.min(1, (now - live) / Math.max(0.05, h.end - live)) : 0;
  const rise = Math.min(1, (now - h.at) / 0.1) * (1 - f);
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const px = x - r * 0.9 + (i / 6) * r * 1.8, tall = (36 + 22 * Math.sin(i * 2.3 + 1)) * rise, s = i % 2 ? 1 : -1;
    ctx.strokeStyle = '#4f7d43';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(px, y + 2);
    ctx.quadraticCurveTo(px + s * 12, y - tall * 0.6, px - s * 4, y - tall);
    ctx.stroke();
    ctx.strokeStyle = '#8fc06a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.fillStyle = '#7a5a3e';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, r + 6, 7, 0, 0, TAU);
  ctx.fill();
}

// ——— T1a's art ———
// Fenrir's fetters (Gleipnir: a ribbon thin as silk) wound round a held slime, loosening as the time runs out
function drawFetters(ctx, x, y, h, t, left) {
  ctx.save();
  ctx.lineCap = 'round';
  const reach = h * (0.6 + 0.3 * Math.min(1, left * 1.5));
  for (let i = 0; i < 3; i++) {
    const yy = y - reach * (0.25 + i * 0.28), w = 26 - i * 3, tw = Math.sin(t * 3 + i) * 3;
    ctx.strokeStyle = 'rgba(220,235,255,0.95)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(x, yy + tw * 0.3, w, 6, 0.1 * (i - 1), 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(160,190,255,0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  // the loose ends trailing to the floor, where it's pinned
  ctx.strokeStyle = 'rgba(220,235,255,0.8)';
  ctx.lineWidth = 2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + s * 20, y - reach * 0.3);
    ctx.quadraticCurveTo(x + s * 40, y - 6 + Math.sin(t * 4 + s) * 3, x + s * 52, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#9aa6c2';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + s * 52, y, 6, 3, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
// the fetters' hazard: a ribbon snaking on the floor under the mark, then lashing up
function drawFetterHz(ctx, h, now) {
  const x = h.x, y = h.y ?? 450, r = h.r;
  ctx.save();
  ctx.lineCap = 'round';
  if (now < h.at) {
    const k = Math.max(0, Math.min(1, (now - h.warnAt) / Math.max(0.05, h.at - h.warnAt)));
    ctx.strokeStyle = `rgba(200,220,255,${0.3 + 0.5 * k})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const px = x - r + (i / 24) * r * 2, py = y - 2 + Math.sin(i * 1.1 + now * 9) * (2 + 4 * k);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.strokeStyle = `rgba(150,180,255,${0.35 + 0.5 * k * (0.5 + 0.5 * Math.sin(now * 16))})`;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = now * 30;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r, 8, 0, 0, TAU);
    ctx.stroke();
  } else {
    const live = h.at + h.dur, f = now > live ? Math.min(1, (now - live) / Math.max(0.05, h.end - live)) : 0;
    const rise = Math.min(1, (now - h.at) / 0.1) * (1 - f);
    ctx.strokeStyle = 'rgba(225,238,255,0.95)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const px = x - r * 0.8 + (i / 3) * r * 1.6, tall = (40 + 16 * Math.sin(i * 2.1)) * rise;
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.bezierCurveTo(px + 14, y - tall * 0.3, px - 14, y - tall * 0.7, px + 4, y - tall);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// A5: a cage of the boss's stuff (roots or old ice) over a held slime
function drawCage(ctx, x, y, t) {
  const W = 34, H = 62;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(60,50,70,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, W + 6, 6, 0, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    const bx = x - W + (i / 5) * W * 2, bow = (i - 2.5) * 2.4;
    ctx.strokeStyle = '#6e5a46';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(bx, y);
    ctx.quadraticCurveTo(bx + bow, y - H * 0.6, x + (bx - x) * 0.25, y - H);
    ctx.stroke();
    ctx.strokeStyle = '#b39572';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
  ctx.strokeStyle = '#7d6650';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x, y - H * 0.45, W * 0.92, 5, 0, 0, TAU);
  ctx.stroke();
  // the lock: a little rune that pulses
  const p = 0.5 + 0.5 * Math.sin(t * 6);
  ctx.fillStyle = `rgba(255,214,110,${0.6 + 0.4 * p})`;
  ctx.beginPath();
  ctx.roundRect(x - 7, y - H * 0.45 - 7, 14, 14, 4);
  ctx.fill();
  ctx.restore();
}
// over a caged slime (our own): how long until it crushes
function drawCageClock(ctx, x, y, left, t) {
  const k = Math.max(0, Math.min(1, left)), R = 15;
  ctx.save();
  ctx.fillStyle = 'rgba(48,30,56,0.8)';
  ctx.beginPath();
  ctx.arc(x, y, R + 5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = k > 0.3 ? '#ffd06a' : `rgba(255,111,145,${0.6 + 0.4 * Math.sin(t * 14)})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, R, -Math.PI / 2, -Math.PI / 2 + TAU * k);
  ctx.stroke();
  ctx.fillStyle = '#fff4d6';
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 2, 10, 8, 2);
  ctx.fill();
  ctx.strokeStyle = '#fff4d6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 3, 4, Math.PI, 0);
  ctx.stroke();
  ctx.restore();
}
// the cage's hazard: a shadow and a ring on the floor, the cage dropping from above as it lands
export function drawCageHz(ctx, h, now) {
  const k = Math.max(0, Math.min(1, (now - h.warnAt) / Math.max(0.05, h.at - h.warnAt)));
  ctx.save();
  ctx.fillStyle = `rgba(40,30,50,${0.15 + 0.3 * k})`;
  ctx.beginPath();
  ctx.ellipse(h.x, h.y + 1, h.r * (0.6 + 0.4 * k), 9, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,190,90,${0.4 + 0.5 * k * (0.5 + 0.5 * Math.sin(now * 14))})`;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 6]);
  ctx.lineDashOffset = now * 40;
  ctx.beginPath();
  ctx.ellipse(h.x, h.y + 1, h.r, 9, 0, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  if (now < h.at + 0.15) drawCage(ctx, h.x, h.y - Math.max(0, 1 - k) * 320, now);
  ctx.restore();
}

// A6: ice down the whole den but the gap. Warning: the roof cracks and a red wash everywhere but the gap (sliding as it
// will); live: icicles falling
export function drawGapsHz(ctx, h, now) {
  // (a, b: a field boss's wall covers only that stretch, T3; a den's, the whole den)
  const X0 = h.a ?? 0, W = h.b ?? 1500, G = 450, gx = gapX(h, now), a = gx - h.w / 2, b = gx + h.w / 2, cinder = h.style === 'cinder';
  ctx.save();
  if (now < h.at) {
    const k = Math.max(0, Math.min(1, (now - h.warnAt) / Math.max(0.05, h.at - h.warnAt))), pulse = 0.5 + 0.5 * Math.sin(now * (8 + 12 * k));
    ctx.fillStyle = cinder ? `rgba(255,140,60,${0.05 + 0.09 * k})` : `rgba(150,200,255,${0.06 + 0.1 * k})`;
    ctx.fillRect(X0, 0, a - X0, G);
    ctx.fillRect(b, 0, W - b, G);
    ctx.strokeStyle = `rgba(140,255,190,${0.6 + 0.35 * pulse})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(a, 40, b - a, G - 40);
    ctx.setLineDash([]);
    if (cinder) {
      // (the Bellower's boom: a dark cloud of ash gathering high over the sand, glowing underneath)
      for (let x = X0 + 30; x < W; x += 60) {
        if (x > a - 20 && x < b + 20) continue;
        ctx.fillStyle = `rgba(60,48,46,${0.35 + 0.35 * k})`;
        ctx.beginPath();
        ctx.ellipse(x + Math.sin(now * 3 + x) * 4, 30 + ((x * 7) % 20), 34, 16 + 6 * k, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = `rgba(255,130,60,${0.15 + 0.25 * k * pulse})`;
        ctx.fillRect(x - 20, 44 + ((x * 7) % 20), 40, 3);
      }
    } else {
      // icicles hanging off the roof, shivering
      ctx.fillStyle = 'rgba(210,235,255,0.85)';
      for (let x = X0 + 20; x < W; x += 46) {
        if (x > a - 10 && x < b + 10) continue;
        const len = 14 + ((x * 7) % 18) + k * 10, sh = Math.sin(now * 30 + x) * k * 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 7 + sh, 0);
        ctx.lineTo(x + 7 + sh, 0);
        ctx.lineTo(x + sh, len);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else {
    const k = (now - h.at) / Math.max(0.05, h.dur);
    if (k > 1.4) return ctx.restore();
    ctx.fillStyle = 'rgba(225,242,255,0.95)';
    ctx.strokeStyle = 'rgba(120,170,230,0.9)';
    ctx.lineWidth = 1.5;
    for (let x = X0 + 14; x < W; x += 23) {
      if (x > a - 6 && x < b + 6) continue;
      const y = ((k * 1.6 + ((x * 13) % 7) / 7) % 1) * (G + 40) - 30;
      if (h.style === 'bubble') { // (the Tidemother's wall of bubbles, rising)
        ctx.beginPath();
        ctx.arc(x, G - y, 8, 0, TAU);
        ctx.fillStyle = 'rgba(190,235,255,0.55)';
        ctx.fill();
        ctx.stroke();
        continue;
      }
      if (cinder) { // (the Bellower's cinders: dark lumps, a hot core, a short streak above)
        ctx.fillStyle = 'rgba(255,140,60,0.35)';
        ctx.fillRect(x - 1.5, y - 26, 3, 20);
        ctx.fillStyle = '#2e2628';
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ff9a4a';
        ctx.beginPath();
        ctx.arc(x + 1, y + 1, 3, 0, TAU);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 18);
      ctx.lineTo(x + 5, y - 18);
      ctx.lineTo(x, y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = cinder ? 'rgba(80,60,56,0.35)' : 'rgba(200,230,255,0.25)';
    ctx.fillRect(X0, G - 8, a - X0, 10);
    ctx.fillRect(b, G - 8, W - b, 10);
  }
  ctx.restore();
}

// A20: the shield bash: the shield glowing brighter (a ring closing in on the moment), the reach on the floor; then a
// burst of cold light across it
export function drawBashHz(ctx, h, now) {
  const a = h.dir > 0 ? h.x + h.w : h.x - h.w - h.reach, top = 450 - h.h;
  ctx.save();
  if (now < h.at) {
    const k = Math.max(0, Math.min(1, (now - h.warnAt) / Math.max(0.05, h.at - h.warnAt)));
    ctx.fillStyle = `rgba(255,240,170,${0.05 + 0.12 * k})`;
    ctx.fillRect(a, top, h.reach, h.h);
    ctx.strokeStyle = `rgba(255,236,150,${0.4 + 0.5 * k})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 7]);
    ctx.lineDashOffset = -now * 50 * h.dir;
    ctx.strokeRect(a, top, h.reach, h.h);
    ctx.setLineDash([]);
    // the glow on the shield, and the ring that lands as it strikes (attack then)
    const sx = h.x + h.dir * h.w * 0.7, sy = 450 - 90;
    const g = ctx.createRadialGradient(sx, sy, 4, sx, sy, 40 + 30 * k);
    g.addColorStop(0, `rgba(255,250,210,${0.5 + 0.5 * k})`);
    g.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx - 80, sy - 80, 160, 160);
    ctx.strokeStyle = `rgba(255,255,230,${0.5 + 0.5 * k})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, sy, 16 + (1 - k) * 70, 0, TAU);
    ctx.stroke();
  } else {
    const k = Math.min(1, (now - h.at) / 0.35);
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = 'rgba(230,245,255,0.8)';
    ctx.fillRect(a, top + h.h * 0.2, h.reach, h.h * 0.8);
  }
  ctx.restore();
}

// ——— T1b's art ———
// Typhon's iron setting round a held slime: a dark crust up the body, cracks glowing orange, cooling darker as time runs
// (T2: the same crust as an ice coffin or a heap of hot sand: PAL)
const PAL = {
  iron: { body: '#3e3836', crack: '#ff9a4a', glow: [255, 120, 60], pool: '255,170,70' },
  ice: { body: 'rgba(200,232,255,0.92)', crack: '#7ab8e8', glow: [120, 190, 255], pool: '180,225,255' },
  sand: { body: '#c8a46a', crack: '#ff9a4a', glow: [255, 150, 70], pool: '230,190,120' },
  wax: { body: 'rgba(242,190,80,0.92)', crack: '#a8701c', glow: [255, 200, 80], pool: '255,214,110' }, // (the Hornet Queen's wax cell, T3)
  gullet: { body: '#2a2832', crack: '#ffd696', glow: [255, 214, 150], pool: '42,40,50' }, // (Old Gullet's jaws round you, the lights inside showing through: atlas Phase 8 L2)
  mire: { body: '#3a4626', crack: '#c8d8a0', glow: [200, 214, 130], pool: '58,70,38' }, // (Grandfather Mire's toads' chorus: weed and spawn wound round you on the beat, atlas Phase 8 L4)
  peat: { body: '#3a2c20', crack: '#c8a060', glow: [200, 160, 96], pool: '58,44,32' }, // (the Sleeper in the Peat pulls you down into the peat with it: atlas Phase 8 L3)
  silk: { body: 'rgba(236,228,242,0.94)', crack: '#a898bc', glow: [255, 214, 150], pool: '226,218,236' }, // (the Wickmother's moth-silk wound round you: the Stoop's strand, the cocoon, L5)
};
function drawIron(ctx, x, y, h, t, left, style = 'iron') {
  const H = h * (0.45 + 0.2 * Math.min(1, left * 1.5)) * (style === 'ice' ? 1.6 : 1), W = 30, heat = Math.max(0, Math.min(1, left)), P = PAL[style] ?? PAL.iron;
  ctx.save();
  ctx.fillStyle = P.body;
  ctx.beginPath();
  ctx.moveTo(x - W - 6, y + 2);
  for (let i = 0; i <= 8; i++) {
    const px = x - W + (i / 8) * W * 2, py = y - H + Math.sin(i * 2.7) * 5 + (i % 2 ? 6 : 0);
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x + W + 6, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${P.glow[0]},${P.glow[1] + Math.round(60 * heat * (style === 'ice' ? 0 : 1))},${P.glow[2]},${0.35 + 0.55 * heat})`;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const px = x - W * 0.7 + i * W * 0.47;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px + 4, y - H * 0.4);
    ctx.lineTo(px - 2, y - H * 0.7 + Math.sin(t * 2 + i));
    ctx.stroke();
  }
  ctx.restore();
}
// its hazard: the iron pooling under the mark (glowing, bubbling), then setting in jagged spikes
function drawIronHz(ctx, h, now) {
  const x = h.x, y = h.y ?? 450, r = h.r, P = PAL[h.style] ?? PAL.iron;
  ctx.save();
  if (now < h.at) {
    const k = Math.max(0, Math.min(1, (now - h.warnAt) / Math.max(0.05, h.at - h.warnAt)));
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, `rgba(${P.pool},${0.4 + 0.4 * k})`);
    g.addColorStop(1, `rgba(${P.pool},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r * (0.5 + 0.5 * k), 9, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,84,112,${0.35 + 0.5 * k * (0.5 + 0.5 * Math.sin(now * 16))})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = now * 30;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r, 8, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffd08a';
    for (let i = 0; i < 4; i++) {
      const bx = x + Math.sin(i * 2.1 + now * 3) * r * 0.6, b = (now * 2 + i * 0.25) % 1;
      ctx.beginPath();
      ctx.arc(bx, y - b * 8, 2 + 2 * (1 - b), 0, TAU);
      ctx.fill();
    }
  } else {
    const live = h.at + h.dur, f = now > live ? Math.min(1, (now - live) / Math.max(0.05, h.end - live)) : 0;
    const rise = Math.min(1, (now - h.at) / 0.1) * (1 - f);
    for (let i = 0; i < 7; i++) {
      const px = x - r * 0.9 + (i / 6) * r * 1.8, tall = (30 + 18 * Math.sin(i * 2.3 + 1)) * rise;
      ctx.fillStyle = P.body;
      ctx.beginPath();
      ctx.moveTo(px - 7, y + 2);
      ctx.lineTo(px + (i % 2 ? 3 : -3), y - tall);
      ctx.lineTo(px + 7, y + 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = P.crack;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  ctx.restore();
}

// A chip of Brenna's tooth: a shard of old gear-tooth (bronze, a sliver of the shard's light in it)
function drawChip(ctx, x, y, ang, t, style) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  if (style === 'slag') { // (Old Crucible's, T3: a gobbet of slag, black crust cracked over orange)
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 32);
    g.addColorStop(0, `rgba(255,150,60,${0.35 + 0.2 * Math.sin(t * 6)})`);
    g.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-32, -32, 64, 64);
    ctx.fillStyle = '#2a2224';
    ctx.strokeStyle = '#ff8a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 11, -0.2, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,190,90,${0.7 + 0.3 * Math.sin(t * 9)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-9, -3);
    ctx.lineTo(-2, 2);
    ctx.lineTo(5, -4);
    ctx.lineTo(10, 3);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (style === 'rock') { // (Ignis's: a lump of cooled basalt, frost-blue in its cracks)
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 32);
    g.addColorStop(0, `rgba(150,210,255,${0.4 + 0.2 * Math.sin(t * 6)})`);
    g.addColorStop(1, 'rgba(150,210,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-32, -32, 64, 64);
    ctx.fillStyle = '#3a3a44';
    ctx.strokeStyle = '#9ad4ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 12, 0.3, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
  g.addColorStop(0, `rgba(255,214,140,${0.45 + 0.2 * Math.sin(t * 6)})`);
  g.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-34, -34, 68, 68);
  ctx.fillStyle = '#9a6a3c';
  ctx.strokeStyle = '#5a3a22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, 10);
  ctx.lineTo(-10, -8);
  ctx.lineTo(-4, -14);
  ctx.lineTo(6, -14);
  ctx.lineTo(12, -6);
  ctx.lineTo(15, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe6a8';
  ctx.beginPath();
  ctx.moveTo(-2, -9);
  ctx.lineTo(4, -9);
  ctx.lineTo(2, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// A7: the pistons along the roof and their beams. This beat's beams burn bright; next beat's glow faintly (a beat ahead)
export function drawLasersHz(ctx, h, now) {
  const b = Math.floor((now - h.at) / h.beat), on = b >= 0 ? h.masks[b] ?? 0 : 0, next = h.masks[Math.max(0, b + 1)] ?? 0, top = 30, G = 450;
  const f = b >= 0 ? ((now - h.at) / h.beat) % 1 : 0;
  ctx.save();
  for (let c = 0; c < LASER_COLS; c++) {
    const x = laserX(c), lit = !!(on & (1 << c)), soon = !!(next & (1 << c)) && (b < 0 ? true : f > 0.25);
    // the piston
    ctx.fillStyle = '#6b5a3e';
    ctx.fillRect(x - 16, 0, 32, top - 4);
    ctx.fillStyle = lit ? '#bff6ff' : soon ? `rgba(160,230,255,${0.5 + 0.4 * Math.sin(now * 20)})` : '#3d4a52';
    ctx.beginPath();
    ctx.roundRect(x - 10, top - 8, 20, 12, 4);
    ctx.fill();
    if (lit) {
      const g = ctx.createLinearGradient(x - LASER_W / 2, 0, x + LASER_W / 2, 0);
      g.addColorStop(0, 'rgba(120,230,255,0)');
      g.addColorStop(0.35, 'rgba(150,240,255,0.75)');
      g.addColorStop(0.5, 'rgba(240,255,255,0.95)');
      g.addColorStop(0.65, 'rgba(150,240,255,0.75)');
      g.addColorStop(1, 'rgba(120,230,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - LASER_W / 2, top, LASER_W, G - top);
    } else if (soon) {
      ctx.strokeStyle = 'rgba(150,230,255,0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -now * 60;
      ctx.strokeRect(x - LASER_W / 2, top, LASER_W, G - top);
      ctx.setLineDash([]);
    }
  }
  ctx.restore();
}

// A10: the hands of the clock: nothing until LATE_TELL before (a thin gold line flickering), then a blade of light
export function drawLateHz(ctx, h, now) {
  ctx.save();
  if (now < h.at) {
    ctx.strokeStyle = `rgba(255,226,140,${0.5 + 0.5 * Math.sin(now * 40)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(h.x, 0);
    ctx.lineTo(h.x, 450);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,226,140,0.12)';
    ctx.fillRect(h.x - h.r, 0, h.r * 2, 450);
  } else {
    const k = Math.min(1, (now - h.at) / 0.5);
    ctx.globalAlpha = 1 - k;
    const g = ctx.createLinearGradient(h.x - h.r, 0, h.x + h.r, 0);
    g.addColorStop(0, 'rgba(255,236,170,0)');
    g.addColorStop(0.5, 'rgba(255,250,225,0.95)');
    g.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(h.x - h.r, 0, h.r * 2, 450);
  }
  ctx.restore();
}

// A11: the fake-out: the slam's ring held with no countdown, a pip lighting at each tick (it lands between two)
export function drawFeintHz(ctx, h, now) {
  const p = 0.5 + 0.5 * Math.sin(now * 10);
  ctx.save();
  ctx.strokeStyle = `rgba(255,110,90,${0.35 + 0.35 * p})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.lineDashOffset = now * 40;
  ctx.beginPath();
  ctx.ellipse(h.x, 451, h.r, 14, 0, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  const n = (h.tick | 0) + 1;
  for (let i = 0; i < n; i++) {
    const lit = i < (h.tick | 0);
    ctx.fillStyle = lit ? '#ffe28a' : 'rgba(255,226,138,0.3)';
    ctx.beginPath();
    ctx.arc(h.x - (n - 1) * 9 + i * 18, 470, 5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ——— T2's art and helpers ———
// A2's mash: one big ▲ key cap with the count, shaking with each press, and the time left
function drawMash(ctx, x, y, c, t, left) {
  const S = 34, kick = c.hitAt && t - c.hitAt < 0.1 ? 3 : 0;
  ctx.save();
  ctx.fillStyle = 'rgba(48,30,56,0.8)';
  ctx.beginPath();
  ctx.roundRect(x - 52, y - S / 2 - 8, 104, S + 22, 12);
  ctx.fill();
  ctx.fillStyle = '#fff4d6';
  ctx.strokeStyle = `rgba(255,208,106,${0.6 + 0.4 * Math.sin(t * 20)})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 44, y - S / 2 + kick, S, S, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ctx.strokeStyle = '#5b3a6b';
  arrow(ctx, x - 44 + S / 2, y + kick, 2, 12);
  text(ctx, `${Math.min(c.i, c.n)} / ${c.n}`, x + 18, y + 1, 16, '#fff4d6');
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x - 44, y + S / 2 + 5, 88, 4);
  ctx.fillStyle = '#7fd88f';
  ctx.fillRect(x - 44, y + S / 2 + 5, 88 * Math.min(1, c.i / c.n), 4);
  ctx.fillStyle = left > 0.35 ? '#ffd06a' : '#ff6f91';
  ctx.fillRect(x - 44, y + S / 2 + 10, 88 * Math.max(0, Math.min(1, left)), 3);
  ctx.restore();
}

// the Knotmole's mound of dirt bulging (all alike: the last to pop is her)
function drawMound(ctx, x, t, left) {
  const k = Math.max(0, Math.min(1, 1 - left / 4)), sh = Math.sin(t * (14 + 20 * k)) * (1 + 2 * k);
  ctx.save();
  ctx.fillStyle = '#6e4e34';
  ctx.beginPath();
  ctx.ellipse(x + sh, FLOOR_Y, 40 + 10 * k, 12 + 12 * k, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#8a6646';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(x - 24 + i * 16 + sh, FLOOR_Y - 8 - 6 * k - (i % 2) * 4, 4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// A12 in a den: when each strip floods (strip i, pass p) and whether it's up at t
function floodWindows(h, i) {
  const out = [];
  for (let p = 0; p < h.passes; p++) {
    const d = p % 2 ? -h.dir : h.dir, j = d > 0 ? i : h.segs - 1 - i, from = p * (h.segs - h.back) * h.gap + j * h.gap;
    out.push([from, from + h.warn, from + h.warn + h.hot]); // (warning from, up from, down at), from the event
  }
  return out;
}
function floodHot(h, i, t) {
  if (i < 0 || i >= h.segs) return false;
  return floodWindows(h, i).some(([, a, b]) => t - h.at >= a && t - h.at < b);
}
function floodSpan(m) {
  return (m.passes * m.segs - (m.passes > 1 ? m.back : 0)) * m.gap + m.warn + m.hot;
}
const FLOOD_LOOK = {
  tide: { warn: '120,200,230', fill: 'rgba(90,170,210,0.75)', top: 'rgba(220,245,255,0.9)' },
  floe: { warn: '170,215,240', fill: 'rgba(60,110,160,0.8)', top: 'rgba(235,248,255,0.95)' },
  magma: { warn: '255,140,70', fill: 'rgba(230,90,40,0.85)', top: 'rgba(255,220,120,0.95)' },
  mire: { warn: '190,200,170', fill: 'rgba(46,52,40,0.85)', top: 'rgba(200,214,190,0.8)' }, // (Long-Neck's: the mere coming up black through the den)
};
export function drawFloodHz(ctx, h, now) {
  const L = FLOOD_LOOK[h.style] ?? FLOOD_LOOK.tide, w = 1500 / h.segs, t = now - h.at;
  ctx.save();
  for (let i = 0; i < h.segs; i++) {
    const x = i * w;
    for (const [w0, a, b] of floodWindows(h, i)) {
      if (t >= w0 && t < a) {
        const k = (t - w0) / (a - w0);
        ctx.strokeStyle = `rgba(${L.warn},${0.35 + 0.5 * k * (0.5 + 0.5 * Math.sin(now * 16))})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(x + 3, FLOOR_Y - 22, w - 6, 22);
        ctx.setLineDash([]);
      } else if (t >= a && t < b + 0.3) {
        const rise = Math.min(1, (t - a) / 0.15) * Math.min(1, (b + 0.3 - t) / 0.3), H = 22 * rise;
        ctx.fillStyle = L.fill;
        ctx.fillRect(x, FLOOR_Y - H, w, H + 2);
        ctx.fillStyle = L.top;
        for (let j = 0; j < 4; j++) {
          const px = x + ((j * 37 + now * 40) % w);
          ctx.beginPath();
          ctx.ellipse(px, FLOOR_Y - H, h.style === 'floe' ? 14 : 6, 2.5, 0, 0, TAU);
          ctx.fill();
        }
      }
    }
  }
  ctx.restore();
}
