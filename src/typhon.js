// Docs: docs/places/typhon.md, docs/combat/bosses.md
// Typhon on the client (E5 (c); the brain is server/typhon.js, the numbers src/shared/typhon.js): what its 'final'
// message says (the phase, the pressure, its pose, the plates, the vents), drawn over the den (the plates and the iron,
// the vents and their rings, the ladle, the pressure dial, the marks of its moves), which target a hit of ours is on (a
// vent, a hot plate's ring, the tooth or the body: v.part, read by Party.mod), the moves it judges itself (the Hammer,
// Coil Burst, Coil Sweep, both ultimates) and the title card on walking in. The plates' heat is the server's. No hint
// names an answer (owner, 2026-10-26): telegraphs and pops only.
import { W, clamp } from './util.js';
import { audio } from './audio.js';
import { MOBS, TYPHON_DEN, finalTag, EMBER_TOP, weakOf } from './shared/rpg.js';
import { FIN_W, FIN_FLOOR, HEAD_REACH } from './shared/final.js';
import {
  TY_MID, PLATES, PLATE_W, plateAt, plateMid, VENTS, PLATE_SLOT, HAMMER_H, SWEEP_H, floodN, ledgesFlooded, plateHot, pourSafe, tyLedgeAt, tySpot,
} from './shared/typhon.js';
import { drawRing } from './dens-ladon.js';
import { drawPlates, drawIron, drawVent, setTyphonLook, stepTyphonLook, typhonLook, glow, HOT } from './dens-typhon.js';

const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const CARD_S = 5; // the title card's seconds (you can move all the while)
const HURT_S = 0.25; // a ring's flash when a hit fills it
const PLATE_NEAR = 150; // a plate's ring is a target only from this near its middle (you stand by it to beat a crust on)
const BURST_H = 80; // a coil heaving up through a plate hits anyone this near the floor over it
const LADLE_X = TY_MID + 190, LADLE_Y = 150;
const DIAL_X = TY_MID - 236, DIAL_Y = 196;

export class TyphonFinal {
  constructor(rpg) {
    this.rpg = rpg;
    this.st = null; // { id, ph, enr, pr, po, pl: [{ st, fill, until }], vn: [{ st, fill, until }] }
    this.cardAt = -99;
    this.inDen = false;
    this.prShown = 0;
    this.marks = []; // { kind: 'hammer' | 'sweep', x, r, x0, x1, at, end }
    this.bulge = new Map(); // plate → { at, end }
    this.hurt = new Map(); // slot → rpg.time its ring last filled
    this.sweep = null; // { mob, x0, x1, at, end, front }: Coil Sweep's coils going along the floor
    this.wave = null; // { mob, dir, x0, speed, at, front }: the Last Pour's iron
    this.tipAt = -99; // the ladle tipped (the Pour)
    this.freed = null; // { at, x }
  }
  clear() {
    this.st = null;
    this.freed = null;
    this.marks = [];
    this.bulge.clear();
    this.hurt.clear();
    this.sweep = this.wave = null;
    setTyphonLook({ po: 'sunk', ph: 0, pr: 0, enr: false, plates: Array(PLATES).fill('c') });
  }
  // {t:'final', fb:'typhon', id, ph, enr, pr, po, pl: [[st, fill%, ms]], vn: [[st, fill%, ms]]}
  receive(m) {
    const t = this.rpg.time, old = this.st;
    const pl = m.pl.map(([st, fill, ms]) => ({ st, fill: fill / 100, until: t + ms / 1000 }));
    const vn = m.vn.map(([st, fill, ms]) => ({ st, fill: fill / 100, until: t + ms / 1000 }));
    vn.forEach((v, i) => old && v.fill > (old.vn[i]?.fill ?? 0) + 0.001 && this.hurt.set(i, t));
    pl.forEach((p, i) => old && p.fill > (old.pl[i]?.fill ?? 0) + 0.001 && this.hurt.set(PLATE_SLOT + i, t));
    if (!old) this.prShown = m.pr;
    this.freed = null;
    this.st = { id: m.id, ph: m.ph, enr: !!m.enr, pr: m.pr, po: m.po, pl, vn };
    setTyphonLook({ po: m.po, ph: m.ph, pr: m.pr, enr: !!m.enr, plates: pl.map((p) => p.st) });
  }
  mine(v) {
    return !!this.st && v?.id === this.st.id;
  }
  flood() {
    return this.st ? floodN(this.st.ph, this.st.pr) : 0;
  }
  hot(i) {
    return !!this.st && plateHot(this.st.pl[i].st, i, this.flood());
  }
  // can slot be hit now? (a ready vent; a hot plate's ring, until the enrage)
  open(slot) {
    const st = this.st;
    if (!st) return false;
    if (slot < PLATE_SLOT) return st.vn[slot]?.st === 'r';
    return !st.enr && this.hot(slot - PLATE_SLOT);
  }

  // ——— which target of boss view v a hit of ours is on ———
  // ahead of (x, feet y) toward dir, reach px out (back px behind); arrow: arrows (and spells, bolts) reach a vent at any
  // height; a plate's ring only from beside it → { slot, x, y, prop } | { weak, x, y } (the tooth) | 'body' | null
  reach(v, x, y, dir, reach, back, arrow) {
    const k = MOBS[v.kind], t = this.rpg.time, b = this.rpg.party.bosses.get(v.id), far = arrow || this.rpg.aimMagic;
    const ahead = (sx, r) => {
      const d = (sx - x) * dir;
      return d >= -back - r && d <= reach + r ? Math.abs(d) : -1;
    };
    if (b?.wk && b.wk.until > t) {
      const s = weakOf(k, v.x, v.y, v.facing);
      if (ahead(s.x, s.r) >= 0 && (arrow || Math.abs(y - 20 - s.y) < s.r + HEAD_REACH)) return { weak: true, x: s.x, y: s.y };
    }
    let best = null, bestD = Infinity;
    for (let slot = 0; slot < PLATE_SLOT + PLATES; slot++) {
      if (!this.open(slot)) continue;
      const s = tySpot(slot), d = ahead(s.x, s.r), plate = slot >= PLATE_SLOT;
      if (d < 0 || d >= bestD) continue;
      if (plate ? Math.abs(s.x - x) > PLATE_NEAR || Math.abs(y - 20 - s.y) > s.r + HEAD_REACH : !far && Math.abs(y - 20 - s.y) > s.r + HEAD_REACH) continue;
      [best, bestD] = [{ slot, x: s.x, y: s.y, prop: true }, d];
    }
    const bd = ahead(v.x, k.w / 2), body = bd >= 0 && Math.abs((v.y - k.h / 2) - (y - 20)) <= 40 + k.h / 2;
    if (best && (!body || bestD <= Math.max(0, bd - k.w / 2))) return best;
    return body ? 'body' : best;
  }
  // an area hit round (x, feet y), radius r → the same
  reachAround(v, x, y, r) {
    const k = MOBS[v.kind], t = this.rpg.time, b = this.rpg.party.bosses.get(v.id);
    if (b?.wk && b.wk.until > t) {
      const s = weakOf(k, v.x, v.y, v.facing);
      if (Math.abs(s.x - x) < r + s.r && Math.abs(y - 20 - s.y) < s.r + HEAD_REACH) return { weak: true, x: s.x, y: s.y };
    }
    let best = null, bestD = Infinity;
    for (let slot = 0; slot < PLATE_SLOT + PLATES; slot++) {
      if (!this.open(slot)) continue;
      const s = tySpot(slot), d = Math.abs(s.x - x);
      if (d > r + s.r || Math.abs(y - 20 - s.y) > s.r + HEAD_REACH || d >= bestD) continue;
      [best, bestD] = [{ slot, x: s.x, y: s.y, prop: true }, d];
    }
    const body = Math.abs(v.x - x) < r + k.w / 2;
    if (best && (!body || bestD <= Math.max(0, Math.abs(v.x - x) - k.w / 2))) return best;
    return body ? 'body' : best;
  }

  // ——— its events → true if handled ———
  event(m, pan, me) {
    const r = this.rpg, t = r.time;
    if (m.a === 'die') {
      this.freed = { at: t, x: m.x };
      this.st = null;
      this.marks = [];
      this.bulge.clear();
      this.sweep = this.wave = null;
      setTyphonLook({ po: 'freed', enr: false, pr: 0, plates: Array(PLATES).fill('c') });
      return false; // (the usual death runs too)
    }
    if (m.a === 'watch') {
      audio.sfx('bossWarn', { pan, vol: m.to === r.myId ? 0.7 : 0.35 });
    } else if (m.a === 'hammer') {
      this.marks.push({ kind: 'hammer', x: m.tx, r: m.r, at: t, end: t + m.dur + 0.3 });
      setTyphonLook({ hx: m.tx }); // (the fist comes down on the mark and lies there: src/dens-typhon.js)
      audio.sfx('bossWarn', { pan, vol: 0.5 });
    } else if (m.a === 'hammerHit') {
      this.marks = this.marks.filter((q) => !(q.kind === 'hammer' && q.x === m.tx));
      r.bossFx.spawn('shockwave', { x: m.tx, y: FIN_FLOOR, radius: m.r + 20, theme: 'hearth' });
      audio.sfx('bossSlam', { pan });
      if (me && me.y > FIN_FLOOR - HAMMER_H && Math.abs(me.x - m.tx) < m.r) r.ouchNext = { mob: m.id, kind: 'slam', mx: m.tx };
    } else if (m.a === 'bulge') {
      this.bulge.set(m.i, { at: t, end: t + m.dur });
      audio.sfx('bossWarn', { pan, vol: 0.35 });
    } else if (m.a === 'burst') {
      this.bulge.delete(m.i);
      const x = plateMid(m.i);
      r.bossFx.spawn('shockwave', { x, y: FIN_FLOOR, radius: PLATE_W / 2, theme: 'hearth' });
      audio.sfx('bossSlam', { pan, vol: 0.7 });
      if (me && me.y > FIN_FLOOR - BURST_H && plateAt(me.x) === m.i) r.ouchNext = { mob: m.id, kind: 'bite', mx: x };
    } else if (m.a === 'sweep') {
      this.marks.push({ kind: 'sweep', x0: m.x0, x1: m.x1, at: t, end: t + m.warn });
      this.sweep = { mob: m.id, x0: m.x0, x1: m.x1, at: t + m.warn, end: t + m.warn + m.dur, front: m.x0 };
      audio.sfx('bossRoar', { pan, vol: 0.6 });
    } else if (m.a === 'inhale') {
      audio.sfx('ultWarn', { vol: 0.4 });
    } else if (m.a === 'inhaleOut') {
      r.flash = Math.max(r.flash ?? 0, 0.3);
      audio.sfx('bossRoar', { pan });
    } else if (m.a === 'inhaleBroken') {
      audio.sfx('eggBreak', { pan });
    } else if (m.a === 'crust') {
      const x = plateMid(m.i);
      r.fx.spawn('nova', { x, y: FIN_FLOOR - 10, radius: 60, tint: 'frost' });
      audio.sfx('shellBlock', { pan, vol: 0.5 });
    } else if (m.a === 'ventOpen') {
      const v = VENTS[m.slot];
      r.fx.spawn('nova', { x: v.x, y: v.y, radius: 46, tint: 'fire' });
      audio.sfx('shellBlock', { pan, vol: 0.8 });
    } else if (m.a === 'ladle') {
      this.tipAt = t;
      audio.sfx('magmaRise', { vol: 0.5 });
    } else if (m.a === 'unburied') {
      r.flash = Math.max(r.flash ?? 0, 0.5);
      audio.sfx('bossRoar', { pan });
    } else if (m.a === 'brood') {
      r.bossFx.spawn('summon', { x: m.px, y: FIN_FLOOR - 20, theme: 'hearth' });
    } else if (m.a === 'finalRage') {
      r.bossFx.spawn('roar', { x: FIN_W / 2, y: 200, theme: 'hearth' });
      audio.sfx('bossRoar', { pan });
      r.flash = Math.max(r.flash ?? 0, 0.8);
    } else return false;
    return true;
  }
  // its ultimates going off (from Rpg.newUlt) → true if one of its own: Eruption (stand over a crusted or dark plate) and
  // the Last Pour (judged as the iron's front passes you: hits())
  ult(m, me) {
    if (m.kind === 'eruption') {
      audio.sfx('magmaRise');
      if (!(m.safe ?? []).includes(plateAt(me.x))) this.rpg.ouchNext = { mob: m.id, kind: 'ult', mx: me.x - 1, noDodge: true };
      return true;
    }
    if (m.kind === 'lastpour') {
      audio.sfx('collapse');
      this.wave = { mob: m.id, dir: m.dir, x0: m.x0, speed: m.speed, at: this.rpg.time, front: m.x0 };
      return true;
    }
    return false;
  }
  // every fresh fixed step: the sweep's coils and the Last Pour's iron passing us → an ouch, or null
  hits(me) {
    const t = this.rpg.time;
    if (this.wave) {
      const w = this.wave, front = w.x0 + w.dir * w.speed * (t - w.at), prev = w.front;
      w.front = front;
      if (front < -60 || front > FIN_W + 60) this.wave = null;
      if ((prev - me.x) * (front - me.x) <= 0) {
        const ledge = me.onPlat && me.grounded ? tyLedgeAt(me.x, me.y) : -1;
        if (!pourSafe(w.dir, me.x, me.y, ledge, typhonLook().crusted)) return { mob: w.mob, kind: 'ult', mx: me.x - w.dir, noDodge: true };
      }
    }
    if (this.sweep && t >= this.sweep.at) {
      const s = this.sweep, k = clamp((t - s.at) / Math.max(0.05, s.end - s.at), 0, 1), front = s.x0 + (s.x1 - s.x0) * k, prev = s.front;
      s.front = front;
      if (k >= 1) this.sweep = null;
      if ((prev - me.x) * (front - me.x) <= 0 && me.y > FIN_FLOOR - SWEEP_H) return { mob: s.mob, kind: 'charge', mx: front - Math.sign(s.x1 - s.x0) };
    }
    return null;
  }

  update(dt) {
    const r = this.rpg, t = r.time;
    const inDen = r.room === TYPHON_DEN;
    if (inDen && !this.inDen) this.cardAt = t;
    this.inDen = inDen;
    if (!inDen) return;
    stepTyphonLook(dt, t);
    if (this.st) this.prShown += (this.st.pr - this.prShown) * Math.min(1, dt * 2);
    this.marks = this.marks.filter((q) => t < q.end);
    for (const [i, b] of this.bulge) if (t > b.end + 0.5) this.bulge.delete(i);
    if (this.freed && t - this.freed.at > 14) this.freed = null;
  }

  // ——— drawing, in world space (after the mobs, before the slimes) ———
  draw(ctx) {
    const r = this.rpg, t = r.time, st = this.st;
    if (r.room !== TYPHON_DEN) return;
    const sts = st ? st.pl.map((p) => p.st) : Array(PLATES).fill('c');
    // the plates (with a coil pressing up under the bulging ones), then the iron over the flooded ones
    const bulge = new Map([...this.bulge].map(([i, b]) => [i, clamp((t - b.at) / Math.max(0.1, b.end - b.at), 0, 1)]));
    drawPlates(ctx, sts, t, bulge);
    if (st) drawIron(ctx, this.flood(), ledgesFlooded(st.ph, st.pr), sts, t);
    // the plates' rings (only once someone's beating a crust on)
    if (st) for (let i = 0; i < PLATES; i++) {
      const p = st.pl[i];
      if (!this.hot(i) || st.enr || p.fill < 0.005) continue;
      const hurt = clamp(1 - (t - (this.hurt.get(PLATE_SLOT + i) ?? -9)) / HURT_S, 0, 1) > 0;
      drawRing(ctx, plateMid(i), FIN_FLOOR - 16, 30, p.fill, t, hurt);
    }
    // the vents: their wheels and rings
    VENTS.forEach((V, i) => {
      const v = st?.vn[i], s = v?.st ?? 'r';
      drawVent(ctx, i, s, t, v?.fill ?? 0);
      if (st && s === 'r') {
        const hurt = clamp(1 - (t - (this.hurt.get(i) ?? -9)) / HURT_S, 0, 1) > 0;
        drawRing(ctx, V.x, V.y, 26, v.fill, t, hurt);
      }
    });
    // the pressure: a Keeper dial on the hearth's pillar, its needle climbing, and cracks of light opening up the walls
    const pr = clamp((st ? this.prShown : 0) / 100, 0, 1);
    this.drawDial(ctx, pr, t);
    if (pr > 0.35) {
      ctx.strokeStyle = `rgba(255,140,50,${(pr - 0.35) * 1.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const [x, s] of [[60, 1], [FIN_W - 60, -1]]) {
        let y = 420, xx = x;
        ctx.moveTo(xx, y);
        for (let k = 0; k < Math.round(8 * pr); k++) ctx.lineTo((xx += s * (8 + ((k * 7) % 11))), (y -= 30 + ((k * 13) % 17)));
      }
      ctx.stroke();
    }
    this.drawLadle(ctx, t);
    // its moves' marks
    for (const q of this.marks) {
      const k = clamp((t - q.at) / Math.max(0.1, q.end - q.at), 0, 1), pulse = 0.5 + 0.5 * Math.sin(t * (8 + 14 * k));
      ctx.save();
      if (q.kind === 'hammer') {
        ctx.fillStyle = `rgba(255,90,60,${0.18 + 0.25 * k})`;
        ctx.beginPath();
        ctx.ellipse(q.x, FIN_FLOOR + 2, q.r, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255,150,110,${0.5 + 0.4 * pulse})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (q.kind === 'sweep') {
        const a = Math.min(q.x0, q.x1), b = Math.max(q.x0, q.x1), dir = Math.sign(q.x1 - q.x0);
        ctx.fillStyle = `rgba(255,90,60,${0.1 + 0.2 * k})`;
        ctx.fillRect(a, FIN_FLOOR - SWEEP_H, b - a, SWEEP_H);
        ctx.fillStyle = `rgba(255,150,110,${0.5 + 0.4 * pulse})`;
        for (let x = a + 40; x < b; x += 120) {
          ctx.beginPath();
          ctx.moveTo(x - dir * 12, FIN_FLOOR - 56);
          ctx.lineTo(x + dir * 12, FIN_FLOOR - 45);
          ctx.lineTo(x - dir * 12, FIN_FLOOR - 34);
          ctx.fill();
        }
      }
      ctx.restore();
    }
    // the Last Pour's iron running along the den, up to the low ledges behind its front
    if (this.wave) {
      const w = this.wave, a = w.dir > 0 ? 0 : w.front, b = w.dir > 0 ? w.front : FIN_W;
      if (b > a) {
        const g = ctx.createLinearGradient(0, 330, 0, FIN_FLOOR + 30);
        g.addColorStop(0, 'rgba(255,220,120,0.95)');
        g.addColorStop(0.3, 'rgba(255,140,40,0.92)');
        g.addColorStop(1, 'rgba(160,40,10,0.9)');
        ctx.fillStyle = g;
        ctx.fillRect(a, 340 + Math.sin(t * 6) * 3, b - a, FIN_FLOOR + 30 - 340);
        glow(ctx, w.front, 380, 60, 90, HOT, 0.7);
      }
    }
    // freed: the tooth slides out of its chest and drops into the empty mould, and fits
    if (this.freed) {
      const k = clamp((t - this.freed.at - 2) / 1.6, 0, 1), x = this.freed.x + (TY_MID - this.freed.x) * k, y = 280 + (FIN_FLOOR + 10 - 280) * k * k;
      if (t - this.freed.at > 2) {
        glow(ctx, x, y, 30, 26, '255,236,170', 0.8 * (1 - 0.6 * k));
        ctx.fillStyle = '#fff4c8';
        ctx.beginPath();
        ctx.moveTo(x - 15, y + 8);
        ctx.lineTo(x - 9, y - 12);
        ctx.lineTo(x + 9, y - 12);
        ctx.lineTo(x + 15, y + 8);
        ctx.fill();
      }
    }
  }
  // the dial: an iron gauge on the hearth's west pillar, its needle sweeping from cold to the red as the pressure rises
  drawDial(ctx, pr, t) {
    ctx.save();
    ctx.translate(DIAL_X, DIAL_Y);
    ctx.fillStyle = '#1a1210';
    ctx.strokeStyle = '#6a4a34';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 5;
    for (const [a0, a1, c] of [[0.75, 1.25, '#5a6a74'], [1.25, 1.75, '#c07a3a'], [1.75, 2.25, '#ff4a2a']]) {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.arc(0, 0, 19, a0 * Math.PI, a1 * Math.PI);
      ctx.stroke();
    }
    const a = (0.75 + 1.5 * pr) * Math.PI + (pr > 0.85 ? Math.sin(t * 30) * 0.05 : 0);
    ctx.strokeStyle = '#ffe8c0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
    ctx.stroke();
    ctx.restore();
  }
  // the great ladle hanging off the crane's rail; it tips with the Pour (and swings for the Last Pour)
  drawLadle(ctx, t) {
    const r = this.rpg, u = r.ult?.kind === 'lastpour' ? r.ult : null;
    const tipK = clamp(1 - (t - this.tipAt) / 3, 0, 1), swing = u ? (u.dir ?? 1) * 0.5 * clamp((t - u.at) / 2, 0, 1) : 0;
    const empty = (this.st?.ph ?? 0) >= 3;
    ctx.save();
    ctx.strokeStyle = '#3a2a22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(LADLE_X - 20, 106);
    ctx.lineTo(LADLE_X - 30, LADLE_Y - 20);
    ctx.moveTo(LADLE_X + 20, 106);
    ctx.lineTo(LADLE_X + 30, LADLE_Y - 20);
    ctx.stroke();
    ctx.translate(LADLE_X, LADLE_Y - 20);
    ctx.rotate(swing + tipK * -0.9);
    ctx.fillStyle = '#2a1e1a';
    ctx.strokeStyle = '#0c0606';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.lineTo(36, 0);
    ctx.lineTo(28, 46);
    ctx.lineTo(-28, 46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (!empty) {
      ctx.fillStyle = '#ffb040';
      ctx.fillRect(-32, 2, 64, 6);
    }
    ctx.restore();
    if (tipK > 0 && !empty) { // (the pour: a stream of iron down to the mould)
      ctx.strokeStyle = `rgba(255,170,60,${tipK})`;
      ctx.lineWidth = 6 * tipK + 2;
      ctx.beginPath();
      ctx.moveTo(LADLE_X - 34, LADLE_Y - 10);
      ctx.quadraticCurveTo(LADLE_X - 70, LADLE_Y + 100, TY_MID + 40, FIN_FLOOR);
      ctx.stroke();
    }
  }

  // ——— the title card, over the HUD for CARD_S s on walking in (letterbox bars; you can move all the while) ———
  drawHud(ctx, H) {
    const r = this.rpg, age = r.time - this.cardAt;
    if (r.room !== TYPHON_DEN || age < 0 || age > CARD_S) return;
    const k = clamp(Math.min(age / 0.6, (CARD_S - age) / 0.8), 0, 1), bar = 64 * k;
    ctx.save();
    ctx.fillStyle = 'rgba(8,3,2,0.92)';
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);
    ctx.globalAlpha = clamp((age - 0.4) / 0.6, 0, 1) * clamp((CARD_S - age) / 0.8, 0, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const name = MOBS.typhon.name.toUpperCase(), y = H * 0.36;
    ctx.font = `700 44px ${FONT}`;
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20,6,2,0.9)';
    ctx.strokeText(name, W / 2, y);
    ctx.fillStyle = '#fff0dc';
    ctx.fillText(name, W / 2, y);
    ctx.font = `700 20px ${FONT}`;
    ctx.lineWidth = 6;
    ctx.strokeText(finalTag(EMBER_TOP), W / 2, y + 44);
    ctx.fillStyle = '#ffc890';
    ctx.fillText(finalTag(EMBER_TOP), W / 2, y + 44);
    ctx.restore();
  }
}
