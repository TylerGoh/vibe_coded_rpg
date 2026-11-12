// Docs: docs/places/wickmother.md, docs/combat/bosses.md
// The Wickmother on the client (L5 (c); the brain is server/wickmother.js, the numbers src/shared/wickmother.js): what her
// 'final' message says (the phase, her pose, the silk walls, the hall lanterns and their rings, the one she's kindling),
// drawn over the den (the lanterns on their strings, the lights going up when one is let go, the silk walls, phase 4's
// dark, the Stoop's mark, the Long Night's wave), which target a hit of ours is on (a hall lantern, the shard or her
// body: v.part, read by Party.mod), the Hold on hits to her body (hold: Party.mod cuts them as the server does), the
// moves she judges on our side (the Stoop, both ultimates), the title card on walking in, and her freeing. No hint names
// an answer (owner, 2026-10-26): telegraphs and pops only.
import { W, clamp } from './util.js';
import { audio } from './audio.js';
import { MOBS, WICK_DEN, finalTag, FEN_TOP, weakOf } from './shared/rpg.js';
import { FIN_W, FIN_FLOOR, HEAD_REACH } from './shared/final.js';
import { HALL_LAMPS, STOOP_H, holdMult, lampAt, nightSafe, wickLedgeAt, wickSpot } from './shared/wickmother.js';
import { drawRing } from './dens-ladon.js';
import { drawHallLamp, drawSilkWalls, drawWickDark, setWickLook, stepWickLook, glow } from './dens-wick.js';

const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const CARD_S = 5; // the title card's seconds (you can move all the while)
const HURT_S = 0.25; // a ring's flash when a hit fills it
const RISE_S = 4.5; // a let-go lantern's light drifting up out of the Hall
const FREED_GAP = 0.9, FREED_LIGHTS = 12; // freed: a light comes out of her and goes up every FREED_GAP s, FREED_LIGHTS of them
const DARK_A = 0.84, DARK_RAGE_A = 0.9; // phase 4's dark (and once she's enraged)

export class WickFinal {
  constructor(rpg) {
    this.rpg = rpg;
    this.st = null; // { id, ph, enr, po, sw, kd, lp: [{ st, fill, until }] }
    this.cardAt = -99;
    this.inDen = false;
    this.swShown = 0;
    this.light = HALL_LAMPS.map(() => 1); // each lantern's light as drawn (eased)
    this.marks = []; // the Stoop's landings: { x, r, at, end, feint }
    this.relight = new Map(); // lantern → { at, end }: a moth relighting it
    this.kindleAt = -99;
    this.rising = []; // lights going up: { x, y, at, warm }
    this.wave = null; // the Long Night: { mob, dir, x0, speed, at, front }
    this.hurt = new Map(); // slot → rpg.time its ring last filled
    this.freed = null; // { at, x }
  }
  clear() {
    this.st = null;
    this.freed = null;
    this.marks = [];
    this.relight.clear();
    this.hurt.clear();
    this.rising = [];
    this.wave = null;
    this.light = HALL_LAMPS.map(() => 1);
    setWickLook({ po: 'crown', ph: 0, enr: false, lamps: HALL_LAMPS.map(() => 'l') });
  }
  // {t:'final', fb:'wickmother', id, ph, enr, po, sw, kd, lp: [[st, fill%, ms]]}
  receive(m) {
    const t = this.rpg.time, old = this.st;
    const lp = m.lp.map(([st, fill, ms]) => ({ st, fill: fill / 100, until: t + ms / 1000 }));
    lp.forEach((l, i) => old && l.fill > (old.lp[i]?.fill ?? 0) + 0.001 && this.hurt.set(i, t));
    if (!old) this.swShown = m.sw;
    if (m.kd >= 0 && old?.kd !== m.kd) this.kindleAt = t;
    this.freed = null;
    this.st = { id: m.id, ph: m.ph, enr: !!m.enr, po: m.po, sw: m.sw, kd: m.kd, lp };
    setWickLook({ po: m.po, ph: m.ph, enr: !!m.enr, lamps: lp.map((l) => l.st) });
  }
  // the Hold on a hit on her body: every lit lantern takes a share (src/shared/wickmother.js holdMult)
  hold() {
    return this.st ? holdMult(this.st.lp.filter((l) => l.st === 'l').length) : 1;
  }
  // can lantern slot be hit now? phases 1–3 a lit one; phase 4 an out one; never once she's enraged
  open(slot) {
    const st = this.st;
    if (!st || st.enr) return false;
    return st.lp[slot]?.st === (st.ph >= 3 ? 'o' : 'l');
  }

  // ——— which target of boss view v a hit of ours is on ———
  // ahead of (x, feet y) toward dir, reach px out (back px behind); arrow: arrows (and spells, bolts) reach any lantern
  // in range → { slot, x, y, prop } (a hall lantern) | { weak, x, y } (the shard) | 'body' | null. The nearest wins.
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
    for (let slot = 0; slot < HALL_LAMPS.length; slot++) {
      if (!this.open(slot)) continue;
      const s = wickSpot(slot), d = ahead(s.x, s.r);
      if (d < 0 || (!far && Math.abs(y - 20 - s.y) > s.r + HEAD_REACH) || d >= bestD) continue;
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
    for (let slot = 0; slot < HALL_LAMPS.length; slot++) {
      if (!this.open(slot)) continue;
      const s = wickSpot(slot), d = Math.abs(s.x - x);
      if (d > r + s.r || Math.abs(y - 20 - s.y) > s.r + HEAD_REACH || d >= bestD) continue;
      [best, bestD] = [{ slot, x: s.x, y: s.y, prop: true }, d];
    }
    const body = Math.abs(v.x - x) < r + k.w / 2;
    if (best && (!body || bestD <= Math.max(0, Math.abs(v.x - x) - k.w / 2))) return best;
    return body ? 'body' : best;
  }

  // a lantern's light lets go: it drifts up out of the Hall through the hole in the roof
  rise(i, warm = true) {
    const L = HALL_LAMPS[i];
    this.rising.push({ x: L.x, y: L.y, at: this.rpg.time, warm, seed: Math.random() * 10 });
  }

  // ——— her events → true if handled ———
  event(m, pan, me) {
    const r = this.rpg, t = r.time;
    const low = (h = 70) => me && me.y > FIN_FLOOR - h;
    if (m.a === 'die') {
      this.freed = { at: t, x: m.x, light: [...this.light] };
      // the lights come out of her one by one and drift up through the hole in the roof
      for (let i = 0; i < FREED_LIGHTS; i++) this.rising.push({ x: m.x + (Math.random() - 0.5) * 80, y: FIN_FLOOR - 170 + (Math.random() - 0.5) * 40, at: t + 2 + i * FREED_GAP, warm: true, seed: i * 1.7 });
      this.st = null;
      this.marks = [];
      this.relight.clear();
      this.wave = null;
      setWickLook({ po: 'freed', enr: false });
      return false; // (the usual death runs too)
    }
    if (m.a === 'watch') {
      audio.sfx('bossWarn', { pan, vol: m.to === r.myId ? 0.7 : 0.35 });
    } else if (m.a === 'stoop') {
      this.marks.push({ x: m.tx, r: m.r, at: t, end: t + m.dur + 0.4 });
      audio.sfx('bossWarn', { pan, vol: 0.5 });
    } else if (m.a === 'stoopFeint') {
      this.marks = this.marks.filter((q) => q.x !== m.tx);
      r.pop(m.tx, FIN_FLOOR - 140, '?', '#e8dcff', 20);
      audio.sfx('phaseOut', { pan, vol: 0.45 });
    } else if (m.a === 'stoopHit') {
      this.marks = this.marks.filter((q) => q.x !== m.tx);
      r.bossFx.spawn('shockwave', { x: m.tx, y: FIN_FLOOR, radius: m.r + 20, theme: 'lamps' });
      audio.sfx('bossSlam', { pan, vol: 0.8 });
      if (low(STOOP_H) && Math.abs(me.x - m.tx) < m.r) r.ouchNext = { mob: m.id, kind: 'slam', mx: m.tx };
    } else if (m.a === 'kindle') {
      this.kindleAt = t;
      audio.sfx('fireball', { pan, vol: 0.35 });
    } else if (m.a === 'kindleStopped') {
      const L = HALL_LAMPS[m.i];
      r.pop(L.x, L.y - 44, 'SAVED', '#e6f2ff', 16);
      audio.sfx('shellBlock', { pan, vol: 0.5 });
    } else if (m.a === 'lampOut') {
      this.relight.delete(m.i);
      const L = HALL_LAMPS[m.i];
      if (m.by === 'ring' || m.by === 'holy' || m.by === 'frost' || m.by === 'draw' || m.by === 'phase') this.rise(m.i);
      if (m.by === 'ring' || m.by === 'holy' || m.by === 'frost') {
        r.fx.spawn('nova', { x: L.x, y: L.y, radius: 34, tint: m.by === 'frost' ? 'frost' : 'mana' });
        audio.sfx('phaseOut', { pan, vol: 0.6 });
      }
    } else if (m.a === 'lampLit') {
      const L = HALL_LAMPS[m.i];
      r.fx.spawn('nova', { x: L.x, y: L.y, radius: 36, tint: 'fire' });
      if (m.party) r.pop(L.x, L.y - 40, 'LIT', '#ffe2a8', 18);
      audio.sfx('fireball', { pan, vol: 0.45 });
    } else if (m.a === 'silkStep') {
      audio.sfx(m.dir > 0 ? 'bossWarn' : 'shellBlock', { pan, vol: 0.35 });
    } else if (m.a === 'moths') {
      r.bossFx.spawn('summon', { x: m.px, y: 120, theme: 'lamps' });
      audio.sfx('summon', { pan, vol: 0.4 });
    } else if (m.a === 'mothRelight') {
      this.relight.set(m.i, { at: t, end: t + m.dur });
    } else if (m.a === 'mothStopped') {
      this.relight.delete(m.i);
      const L = HALL_LAMPS[m.i];
      r.pop(L.x, L.y - 44, 'SAVED', '#e6f2ff', 16);
    } else if (m.a === 'draw') {
      audio.sfx('ultWarn', { vol: 0.45 });
    } else if (m.a === 'drawn') {
      r.flash = Math.max(r.flash ?? 0, 0.5);
      audio.sfx('magmaRise', { pan, vol: 0.6 });
    } else if (m.a === 'drawBroken') {
      audio.sfx('eggBreak', { pan });
    } else if (m.a === 'lastLight') {
      r.flash = Math.max(r.flash ?? 0, 0.7);
      audio.sfx('phaseOut', { pan });
    } else if (m.a === 'finalRage') {
      r.bossFx.spawn('roar', { x: FIN_W / 2, y: 200, theme: 'lamps' });
      audio.sfx('bossRoar', { pan });
      r.flash = Math.max(r.flash ?? 0, 0.8);
    } else return false;
    return true;
  }
  // her ultimates going off (from Rpg.newUlt) → true if one of hers: All Souls' Night (stand in a dark strip) and The
  // Long Night (the high root ledge at the end the silk rolls to)
  ult(m, me) {
    if (m.kind === 'souls') {
      audio.sfx('magmaRise');
      if (!(m.safe ?? []).includes(lampAt(me.x))) this.rpg.ouchNext = { mob: m.id, kind: 'ult', mx: me.x - 1, noDodge: true };
      return true;
    }
    if (m.kind === 'night') {
      audio.sfx('collapse');
      this.wave = { mob: m.id, dir: m.dir, x0: m.x0, speed: m.speed, at: this.rpg.time, front: m.x0 };
      return true;
    }
    return false;
  }
  // the Long Night's wave passing us (the silk walls and the dark are the server's)
  hits(me) {
    const t = this.rpg.time;
    if (!this.wave || !me) return null;
    const w = this.wave, front = w.x0 + w.dir * w.speed * (t - w.at), prev = w.front;
    w.front = front;
    if (front < -60 || front > FIN_W + 60) this.wave = null;
    if ((prev - me.x) * (front - me.x) <= 0) {
      const ledge = me.onPlat && me.grounded ? wickLedgeAt(me.x, me.y) : -1;
      if (!nightSafe(w.dir, ledge)) return { mob: w.mob, kind: 'ult', mx: me.x - w.dir, noDodge: true };
    }
    return null;
  }

  update(dt) {
    const r = this.rpg, t = r.time;
    const inDen = r.room === WICK_DEN;
    if (inDen && !this.inDen) this.cardAt = t;
    this.inDen = inDen;
    if (!inDen) return;
    const st = this.st, v = st ? r.views.get(st.id) : null;
    stepWickLook(dt, t, v ? v.x : null);
    if (st) this.swShown += (st.sw - this.swShown) * Math.min(1, dt * 4);
    else this.swShown += (0 - this.swShown) * Math.min(1, dt * 2);
    // each lantern's light, eased (freed: they dim one by one, gently)
    for (let i = 0; i < HALL_LAMPS.length; i++) {
      let want = 1;
      if (st) want = st.lp[i].st === 'o' ? (st.ph >= 3 ? st.lp[i].fill * 0.35 : 0) : 1;
      else if (this.freed) want = t - this.freed.at > 2 + i * FREED_GAP ? 0.12 : this.freed.light[i];
      this.light[i] += (want - this.light[i]) * Math.min(1, dt * (want > this.light[i] ? 3 : this.freed ? 1.2 : 5));
    }
    this.marks = this.marks.filter((q) => t < q.end);
    for (const [i, s] of this.relight) if (t > s.end + 0.5) this.relight.delete(i);
    this.rising = this.rising.filter((q) => t - q.at < RISE_S);
    if (this.freed && t - this.freed.at > 2 + FREED_LIGHTS * FREED_GAP + RISE_S + 4) this.freed = null;
  }

  // ——— drawing, in world space (after the mobs, before the slimes) ———
  draw(ctx) {
    const r = this.rpg, t = r.time, st = this.st;
    if (r.room !== WICK_DEN) return;
    const v = st ? r.views.get(st.id) : null;
    // phase 4: the Hall dark but for her and the lanterns the party has lit
    if (st && st.ph >= 3 && v) drawWickDark(ctx, v.x, st.lp.map((l) => l.st), st.enr ? DARK_RAGE_A : DARK_A, t);
    // the hall lanterns on their strings, their rings, the one she's kindling, the ones the moths are at
    HALL_LAMPS.forEach((L, i) => {
      const l = st?.lp[i], hurt = clamp(1 - (t - (this.hurt.get(i) ?? -9)) / HURT_S, 0, 1);
      const kd = st && st.kd === i ? clamp((t - this.kindleAt) / 1.6, 0, 1) : 0;
      drawHallLamp(ctx, i, this.light[i], l?.st ?? (this.freed ? 'o' : 'l'), t, hurt, kd);
      if (l && !st.enr && l.fill > 0.005 && this.open(i)) drawRing(ctx, L.x, L.y, LAMP_RING_R, l.fill, t, hurt > 0);
      const mo = this.relight.get(i);
      if (mo) { // (a moth's wings closing round it: a warm ring closing in)
        const k = clamp((t - mo.at) / Math.max(0.1, mo.end - mo.at), 0, 1);
        ctx.strokeStyle = `rgba(255,190,120,${0.5 + 0.4 * Math.sin(t * 14)})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(L.x, L.y, 54 - 30 * k, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    // the silk walls (phase 3)
    if (this.swShown > 2) drawSilkWalls(ctx, this.swShown, t);
    // the Stoop's landing marks
    for (const q of this.marks) {
      const k = clamp((t - q.at) / Math.max(0.1, q.end - q.at), 0, 1), pulse = 0.5 + 0.5 * Math.sin(t * (8 + 14 * k));
      ctx.save();
      ctx.fillStyle = `rgba(255,90,100,${0.18 + 0.25 * k})`;
      ctx.beginPath();
      ctx.ellipse(q.x, FIN_FLOOR + 2, q.r, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,130,130,${0.5 + 0.4 * pulse})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = `rgba(255,90,100,${0.05 + 0.08 * k})`;
      ctx.fillRect(q.x - q.r, FIN_FLOOR - STOOP_H, q.r * 2, STOOP_H);
      ctx.restore();
    }
    // the lights going up out of the Hall, through the hole in the roof
    for (const q of this.rising) {
      const k = clamp((t - q.at) / RISE_S, 0, 1), e = k * k * (3 - 2 * k);
      const x = q.x + (FIN_W / 2 - q.x) * e * 0.55 + Math.sin(t * 2 + q.seed) * 10 * (1 - k), y = q.y + (20 - q.y) * e;
      const a = k < 0.1 ? k / 0.1 : 1 - Math.max(0, (k - 0.75) / 0.25);
      glow(ctx, x, y, 22, 22, '255,226,170', 0.6 * a);
      ctx.fillStyle = `rgba(255,248,226,${0.9 * a})`;
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // the Long Night's silk rolling across the Hall
    if (this.wave) {
      const w = this.wave, a = w.dir > 0 ? 0 : w.front, b = w.dir > 0 ? w.front : FIN_W;
      if (b > a) {
        const g = ctx.createLinearGradient(0, 120, 0, FIN_FLOOR + 30);
        g.addColorStop(0, 'rgba(236,228,244,0.15)');
        g.addColorStop(0.5, 'rgba(226,218,238,0.75)');
        g.addColorStop(1, 'rgba(210,200,228,0.95)');
        ctx.fillStyle = g;
        ctx.fillRect(a, 120, b - a, FIN_FLOOR - 120 + 30);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let y = 130; y < FIN_FLOOR + 20; y += 14) {
          ctx.moveTo(w.front, y);
          ctx.lineTo(w.front - w.dir * (30 + ((y * 7) % 40)), y + 6);
        }
        ctx.stroke();
      }
    }
  }

  // ——— the title card, over the HUD for CARD_S s on walking in (letterbox bars; you can move all the while) ———
  drawHud(ctx, H) {
    const r = this.rpg, age = r.time - this.cardAt;
    if (r.room !== WICK_DEN || age < 0 || age > CARD_S) return;
    const k = clamp(Math.min(age / 0.6, (CARD_S - age) / 0.8), 0, 1), bar = 64 * k;
    ctx.save();
    ctx.fillStyle = 'rgba(8,4,12,0.92)';
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);
    ctx.globalAlpha = clamp((age - 0.4) / 0.6, 0, 1) * clamp((CARD_S - age) / 0.8, 0, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const name = MOBS.wickmother.name.toUpperCase(), y = H * 0.36;
    ctx.font = `700 46px ${FONT}`;
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(16,8,24,0.9)';
    ctx.strokeText(name, W / 2, y);
    ctx.fillStyle = '#fff4e0';
    ctx.fillText(name, W / 2, y);
    ctx.font = `700 20px ${FONT}`;
    ctx.lineWidth = 6;
    ctx.strokeText(finalTag(FEN_TOP), W / 2, y + 44);
    ctx.fillStyle = '#e8d4ff';
    ctx.fillText(finalTag(FEN_TOP), W / 2, y + 44);
    ctx.restore();
  }
}
const LAMP_RING_R = 24;
