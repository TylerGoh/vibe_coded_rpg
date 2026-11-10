// Docs: docs/combat/challenges.md
// Boss challenges, the client's side (story/tricky-plan.md): a boss's challenge events become hazards (judged in
// src/rpg.js hazardHits like every boss hazard: the snare and its cousins, the cage, the gaps' ice, the shield bash),
// a trap's combo is taken from the bound walk / jump / drop keys (or the arrow pad on touch) and sent as {t:'free'}
// (a friend's cage too, standing at it), the moving arena's ledges are sunk and raised by predicted edits ({t:'pf'}),
// and the rest is drawn: roots, fetters or a cage round whoever is caught, a swap sign, tethers, the Hunt's marks, the
// dark, the combo over your head, G2's first-time banner.
import { CHALLENGES, ARROWS, ARROW_GLYPH, TRAP_HOLD, SNARE_TICKS, SWAP_TICKS, PUNISH_KEEP_S, seedFor, comboFor, RHYTHM_TICKS, RHYTHM_BEAT, RHYTHM_WINDOW, CAGE_S, RESCUE_R, GAP_GRACE, gapX, TETHER_R, PARRY_MS, PARRY_LATE_MS, DARK_R } from './shared/challenge.js';
import { text } from './village.js';
import { audio } from './audio.js';
import { TOUCH } from './touch.js';
import { TAU } from './util.js';

const BANNER_S = 4.5; // G2's line stays this long
const KEY_DIR = { left: 0, right: 1, jump: 2, down: 3 }; // the key actions (src/shared/keys.js) that enter each arrow
const TRAP_MAXT = { snare: SNARE_TICKS, rhythm: RHYTHM_TICKS, lock: SNARE_TICKS }; // (each trap's whole time, for its bar)

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
    this.style = 'root'; // how the latest snare looks (a fetter in Fenrir's den)
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
    if (m.type === 'snare' || m.type === 'rhythm' || m.type === 'lock') {
      this.style = m.style ?? 'root';
      for (const [x, d] of m.list) {
        const at = now + d + m.warn;
        add({ type: 'snare', ch: m.type, style: m.style, x, y: m.y, r: m.r, warnAt: now + d, at, dur: m.dur, end: at + m.dur + 0.5, len: m.len, seed: m.seed });
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
      add({ type: 'gaps', ch: 'gaps', x0: m.x0, v: m.v, w: m.w, from: now, warnAt: now, at: now + m.warn, dur: m.dur, end: now + m.warn + m.dur + 0.4, style: m.style });
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
      this.dark = { at: now, until: now + m.dur, mob: m.id };
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
      if (t < h.at + h.dur && Math.abs(me.x - gapX(h, t)) > h.w / 2 - GAP_GRACE) return ouch('gaps');
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

  // We attacked (a slap or a skill: src/main.js): a parry's timing
  swung() {
    this.swungAt = this.time;
  }

  // One of ours caught us (src/rpg.js step, on a fresh step): → the predicted edit ({tr} or {cs}), and the combo starts
  hit(ouch) {
    const h = ouch.trap;
    delete ouch.trap;
    const k = ouch.kind;
    if (k === 'snare' || k === 'rhythm' || k === 'lock') {
      const seed = k === 'lock' ? h.seed : seedFor(h.seed, this.myId); // (a lock: everyone the same arrows)
      this.combo = { arrows: comboFor(seed, h.len), i: 0, wrongAt: -9, at: this.time, kind: k, max: TRAP_MAXT[k] };
      audio.sfx('block');
      return { tr: TRAP_MAXT[k] };
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
      return true;
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
    // all in: free at the newest input (the server checks the order and frees us there too)
    this.rpg.send({ t: 'free', s: net.seq, k: c.arrows });
    net.free(net.seq);
    this.combo = null;
    this.bursts.push([net.me.x, net.me.y, t]);
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
    if (this.dark) this.drawDark(ctx, list, t);
    if (this.tethers && t >= this.tethers.at) this.drawTethers(ctx, t);
    if (this.hunt) this.drawHunt(ctx, t);
    for (const [s, tr, cs] of list) {
      if (tr >= TRAP_HOLD) drawCage(ctx, s.x, s.y, t);
      else if (tr > 0) (this.style === 'fetter' ? drawFetters : drawRoots)(ctx, s.x, s.y, s.h ?? 40, t, tr / SNARE_TICKS);
      if (cs > 0) drawSwapSign(ctx, s.x, s.y - (s.h ?? 40) - (s === mine && this.combo ? 80 : 30), t, cs / SWAP_TICKS);
    }
    for (const [x, y, at] of this.bursts) drawBurst(ctx, x, y, (t - at) / 0.6);
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
    if (c && mine) drawCombo(ctx, mine.x, mine.y - (mine.h ?? 40) - 34, c, t, (me.tr | 0) / (c.max || SNARE_TICKS), c.kind === 'rhythm' ? c.at : null);
    // in a cage: the time left (a friend opens it)
    if (this.caged && mine) drawCageClock(ctx, mine.x, mine.y - (mine.h ?? 40) - 40, (this.caged.until - t) / CAGE_S, t);
    // a friend's cage we're standing at: its arrows over it, ours to enter
    const who = this.near(me);
    if (who !== null) {
      const s = this.rpg.slimeOf(who), cage = this.cages.get(who), r = this.rescue?.who === who ? this.rescue : { i: 0, wrongAt: -9 };
      if (s && cage) drawCombo(ctx, s.x, s.y - (s.h ?? 40) - 40, { arrows: cage.arrows, i: r.i, wrongAt: r.wrongAt }, t, (cage.until - t) / CAGE_S, null);
    }
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
    if (b) hole(b.x, b.y - 120, 70); // (its eyes)
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
function drawCombo(ctx, x, y, c, t, left, beatAt = null) {
  const n = c.arrows.length, S = 26, G = 5, w = n * S + (n - 1) * G;
  const shake = t - c.wrongAt < 0.25 ? Math.sin(t * 90) * 5 * (1 - (t - c.wrongAt) / 0.25) : 0;
  const x0 = x - w / 2 + shake;
  ctx.save();
  ctx.fillStyle = 'rgba(48,30,56,0.78)';
  ctx.beginPath();
  ctx.roundRect(x0 - 8, y - S / 2 - 8, w + 16, S + 24, 12);
  ctx.fill();
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
    arrow(ctx, bx + S / 2, y, d, 9);
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

// Roots snapping apart (broke free)
function drawBurst(ctx, x, y, k) {
  if (k > 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - k;
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI * (i / 7), d = 10 + 40 * k;
    ctx.fillStyle = i % 2 ? '#8fc06a' : '#9a7652';
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
  const W = 1500, G = 450, gx = gapX(h, now), a = gx - h.w / 2, b = gx + h.w / 2;
  ctx.save();
  if (now < h.at) {
    const k = Math.max(0, Math.min(1, (now - h.warnAt) / Math.max(0.05, h.at - h.warnAt))), pulse = 0.5 + 0.5 * Math.sin(now * (8 + 12 * k));
    ctx.fillStyle = `rgba(150,200,255,${0.06 + 0.1 * k})`;
    ctx.fillRect(0, 0, a, G);
    ctx.fillRect(b, 0, W - b, G);
    ctx.strokeStyle = `rgba(140,255,190,${0.6 + 0.35 * pulse})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(a, 40, b - a, G - 40);
    ctx.setLineDash([]);
    // icicles hanging off the roof, shivering
    ctx.fillStyle = 'rgba(210,235,255,0.85)';
    for (let x = 20; x < W; x += 46) {
      if (x > a - 10 && x < b + 10) continue;
      const len = 14 + ((x * 7) % 18) + k * 10, sh = Math.sin(now * 30 + x) * k * 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 7 + sh, 0);
      ctx.lineTo(x + 7 + sh, 0);
      ctx.lineTo(x + sh, len);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    const k = (now - h.at) / Math.max(0.05, h.dur);
    if (k > 1.4) return ctx.restore();
    ctx.fillStyle = 'rgba(225,242,255,0.95)';
    ctx.strokeStyle = 'rgba(120,170,230,0.9)';
    ctx.lineWidth = 1.5;
    for (let x = 14; x < W; x += 23) {
      if (x > a - 6 && x < b + 6) continue;
      const y = ((k * 1.6 + ((x * 13) % 7) / 7) % 1) * (G + 40) - 30;
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 18);
      ctx.lineTo(x + 5, y - 18);
      ctx.lineTo(x, y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(200,230,255,0.25)';
    ctx.fillRect(0, G - 8, a, 10);
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
