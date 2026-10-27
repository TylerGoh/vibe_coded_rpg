// Docs: docs/places/fenrir.md, docs/combat/bosses.md
// Fenrir on the client (FB2 (c); the brain is server/fenrir.js, the numbers src/shared/fenrir.js): what its 'final'
// message says (the phase, the reach, its pose, the anchors and their rings, the lanterns), drawn over the den (the dark,
// the lanterns, the fetters, the frost lines, the marks of its moves, its eyes over the dark), which target a hit of
// ours is on (an anchor, a lantern, the shard or the body: v.part, read by Party.mod), the moves it judges itself (the
// Lunge, the Claw, the Pounce, the Rearing's landing, its two ultimates) and the title card on walking in. The dark's
// cold is the server's. No hint names an answer (owner, 2026-10-26): telegraphs and pops only.
import { W, clamp } from './util.js';
import { audio } from './audio.js';
import { MOBS, FENRIR_DEN, finalTag, FROST_TOP, weakOf } from './shared/rpg.js';
import { FIN_W, FIN_FLOOR, HEAD_REACH } from './shared/final.js';
import {
  FEN_MID, ANCHORS, ANCHOR_R, LANTERN_X, LANTERN_Y, LANTERN_SLOT, LUNGE_R, CLAW_H, POUNCE_R, LIGHT_R, TEETH, fenSpot, inLee, ledgeAt,
} from './shared/fenrir.js';
import { drawRing } from './dens-ladon.js';
import { drawDark, drawLantern, drawFetter, drawFrostLine, drawGlyph, setFenrirLook, stepFenrirLook, fenrirLook, glow } from './dens-fenrir.js';

const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const CARD_S = 5; // the title card's seconds (you can move all the while)
const HURT_S = 0.25; // a ring's flash when a hit fills it
const FREED_GAP = 1.1; // freed: a lantern comes back every FREED_GAP s
const DARK_A = 0.7, DARK_RAGE_A = 0.82; // how dark the dark is (and once it's enraged)
const GLYPHS = ['paw', 'roots', 'breath', 'beard'];

export class FenrirFinal {
  constructor(rpg) {
    this.rpg = rpg;
    this.st = null; // { id, ph, enr, rc, po, an: [{ st, fill, until }], ln: [{ lit, fill }] }
    this.cardAt = -99;
    this.inDen = false;
    this.rcShown = 0;
    this.light = LANTERN_X.map(() => 1); // each lantern's light as drawn (eased)
    this.marks = []; // { kind: 'lunge' | 'claw' | 'pounce' | 'rear', x, x0, x1, r, at, end }
    this.swallow = new Map(); // lantern → { at, end, son }: a son swallowing it
    this.hurt = new Map(); // slot → rpg.time its ring last filled
    this.snapAt = new Map(); // anchor → rpg.time it split
    this.freed = null; // { at, x }
  }
  clear() {
    this.st = null;
    this.freed = null;
    this.marks = [];
    this.swallow.clear();
    this.hurt.clear();
    this.light = LANTERN_X.map(() => 1);
    setFenrirLook({ po: 'lie', enr: false, ph: 0 });
  }
  // {t:'final', fb:'fenrir', id, ph, enr, rc, po, an: [[st, fill%, ms]], ln: [[lit, fill%]]}
  receive(m) {
    const t = this.rpg.time, old = this.st;
    const an = m.an.map(([st, fill, ms]) => ({ st, fill: fill / 100, until: t + ms / 1000 }));
    const ln = m.ln.map(([lit, fill]) => ({ lit: !!lit, fill: fill / 100 }));
    an.forEach((a, i) => old && a.fill > (old.an[i]?.fill ?? 0) + 0.001 && this.hurt.set(i, t));
    ln.forEach((l, i) => old && l.fill > (old.ln[i]?.fill ?? 0) + 0.001 && this.hurt.set(LANTERN_SLOT + i, t));
    if (!old) this.rcShown = m.rc;
    this.freed = null;
    this.st = { id: m.id, ph: m.ph, enr: !!m.enr, rc: m.rc, po: m.po, an, ln };
    setFenrirLook({ po: m.po, enr: !!m.enr, ph: m.ph });
  }
  mine(v) {
    return !!this.st && v?.id === this.st.id;
  }
  // can slot be hit now? (an anchor while it cracks; a dark lantern, until the enrage)
  open(slot) {
    const st = this.st;
    if (!st) return false;
    if (slot < LANTERN_SLOT) return st.an[slot]?.st === 'c';
    return !st.enr && st.ln[slot - LANTERN_SLOT] && !st.ln[slot - LANTERN_SLOT].lit;
  }

  // ——— which target of boss view v a hit of ours is on ———
  // ahead of (x, feet y) toward dir, reach px out (back px behind); arrow: arrows (and spells, bolts) reach any target
  // in range → { slot, x, y, prop } (an anchor or a lantern) | { weak, x, y } (the shard) | 'body' | null. The nearest wins.
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
    for (let slot = 0; slot < LANTERN_SLOT + LANTERN_X.length; slot++) {
      if (!this.open(slot)) continue;
      const s = fenSpot(slot), d = ahead(s.x, s.r);
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
    for (let slot = 0; slot < LANTERN_SLOT + LANTERN_X.length; slot++) {
      if (!this.open(slot)) continue;
      const s = fenSpot(slot), d = Math.abs(s.x - x);
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
    const low = (h = 70) => me && me.y > FIN_FLOOR - h;
    if (m.a === 'die') {
      this.freed = { at: t, x: m.x, light: [...this.light] };
      this.st = null;
      this.marks = [];
      this.swallow.clear();
      setFenrirLook({ po: 'freed', enr: false });
      return false; // (the usual death runs too)
    }
    if (m.a === 'watch') {
      audio.sfx('bossWarn', { pan, vol: m.to === r.myId ? 0.7 : 0.35 });
    } else if (m.a === 'lunge') {
      this.marks.push({ kind: 'lunge', x: m.tx, r: LUNGE_R, at: t, end: t + m.dur + 0.4 });
      audio.sfx('bossWarn', { pan, vol: 0.5 });
    } else if (m.a === 'lungeHit' || m.a === 'pounceHit') {
      const R = m.a === 'lungeHit' ? LUNGE_R : POUNCE_R;
      this.marks = this.marks.filter((q) => !(q.x === m.tx && (q.kind === 'lunge' || q.kind === 'pounce')));
      r.bossFx.spawn('shockwave', { x: m.tx, y: FIN_FLOOR, radius: R + 20, theme: 'wolf' });
      audio.sfx('bossSlam', { pan, vol: 0.8 });
      if (low() && Math.abs(me.x - m.tx) < R) r.ouchNext = { mob: m.id, kind: 'bite', mx: m.tx };
    } else if (m.a === 'claw') {
      this.marks.push({ kind: 'claw', x0: m.x0, x1: m.x1, at: t, end: t + m.dur + 0.2 });
      audio.sfx('slashWarn', { pan, vol: 0.6 });
    } else if (m.a === 'clawHit') {
      this.marks = this.marks.filter((q) => !(q.kind === 'claw' && q.x0 === m.x0));
      r.bossFx.spawn('shockwave', { x: (m.x0 + m.x1) / 2, y: FIN_FLOOR, radius: (m.x1 - m.x0) / 2 + 10, theme: 'wolf' });
      audio.sfx('slash', { pan, vol: 0.8 });
      if (low(CLAW_H) && me.x >= m.x0 - 10 && me.x <= m.x1 + 10) r.ouchNext = { mob: m.id, kind: 'slam', mx: m.x };
    } else if (m.a === 'pounce') {
      this.marks.push({ kind: 'pounce', x: m.tx, r: POUNCE_R, at: t, end: t + m.dur + 0.3 });
      audio.sfx('bossWarn', { pan, vol: 0.45 });
    } else if (m.a === 'rear') {
      this.marks.push({ kind: 'rear', x: m.tx, r: m.r, at: t, end: t + m.dur + 0.3 });
      audio.sfx('ultWarn', { vol: 0.45 });
    } else if (m.a === 'rearHit') {
      this.marks = this.marks.filter((q) => q.kind !== 'rear');
      r.bossFx.spawn('shockwave', { x: m.tx, y: FIN_FLOOR, radius: m.r, theme: 'wolf' });
      audio.sfx('bossSlam', { pan });
      r.flash = Math.max(r.flash ?? 0, 0.4);
      if (low(120) && Math.abs(me.x - m.tx) < m.r) r.ouchNext = { mob: m.id, kind: 'bite', mx: m.tx };
    } else if (m.a === 'rearBroken') {
      this.marks = this.marks.filter((q) => q.kind !== 'rear');
      audio.sfx('eggBreak', { pan });
    } else if (m.a === 'strain') {
      audio.sfx('bossRoar', { pan, vol: 0.6 });
    } else if (m.a === 'anchorSet') {
      const a = ANCHORS[m.slot];
      r.fx.spawn('nova', { x: a.x, y: a.y, radius: 50, tint: 'frost' });
      r.pop(a.x, a.y - 50, 'SET', '#e6f2ff', 20);
      audio.sfx('shellBlock', { pan, vol: 0.8 });
    } else if (m.a === 'anchorSlip') {
      const a = ANCHORS[m.slot];
      r.fx.spawn('shatter', { x: a.x, y: a.y, r: 30 });
      audio.sfx('bossRoar', { pan, vol: 0.5 });
    } else if (m.a === 'snap') {
      this.snapAt.set(m.slot, t);
      const a = ANCHORS[m.slot];
      r.fx.spawn('shatter', { x: a.x, y: a.y, r: 50 });
      audio.sfx('eggBreak', { pan });
    } else if (m.a === 'reach') {
      audio.sfx(m.dir > 0 ? 'bossRoar' : 'shellBlock', { pan, vol: 0.35 });
    } else if (m.a === 'lanternOut') {
      this.swallow.delete(m.i);
      audio.sfx('phaseOut', { pan, vol: 0.5 });
    } else if (m.a === 'lanternLit') {
      const x = LANTERN_X[m.i];
      r.fx.spawn('nova', { x, y: LANTERN_Y, radius: 36, tint: 'fire' });
      if (m.by !== 'freed') r.pop(x, LANTERN_Y - 40, 'LIT', '#ffe2a8', 18);
      audio.sfx('fireball', { pan, vol: 0.5 });
    } else if (m.a === 'sonSwallow') {
      this.swallow.set(m.i, { at: t, end: t + m.dur, sid: m.sid });
      audio.sfx('bossWarn', { pan, vol: 0.4 });
    } else if (m.a === 'sonStopped') {
      this.swallow.delete(m.i);
      r.pop(LANTERN_X[m.i], LANTERN_Y - 44, 'SAVED', '#e6f2ff', 16);
    } else if (m.a === 'sonUp') {
      r.bossFx.spawn('summon', { x: m.sx, y: FIN_FLOOR - 30, theme: 'wolf' });
      audio.sfx('bossRoar', { pan, vol: 0.5 });
    } else if (m.a === 'sonDown') {
      audio.sfx('mobDie', { pan, vol: 0.6 });
    } else if (m.a === 'pack') {
      r.bossFx.spawn('summon', { x: m.px, y: FIN_FLOOR - 20, theme: 'wolf' });
      audio.sfx('summon', { pan, vol: 0.5 });
    } else if (m.a === 'finalRage') {
      r.bossFx.spawn('roar', { x: FIN_W / 2, y: 200, theme: 'wolf' });
      audio.sfx('bossRoar', { pan });
      r.flash = Math.max(r.flash ?? 0, 0.8);
    } else return false;
    return true;
  }
  // its ultimates going off (from Rpg.newUlt) → true if one of its own: Swallow the Light (stand in a kept pool) and
  // Fimbulwinter (shelter in the lee of a far anchor stone)
  ult(m, me) {
    let safe;
    if (m.kind === 'swallow') {
      safe = (m.keep ?? []).some((i) => Math.abs(me.x - LANTERN_X[i]) < LIGHT_R);
      audio.sfx('magmaRise');
    } else if (m.kind === 'fimbul') {
      safe = inLee(m.dir, me.x, me.y, me.onPlat && me.grounded ? ledgeAt(me.x, me.y) : -1);
      audio.sfx('collapse');
    } else return false;
    if (!safe) this.rpg.ouchNext = { mob: m.id, kind: 'ult', mx: me.x - 1, noDodge: true };
    return true;
  }
  hits() {
    return null; // (the dark's cold is the server's; everything else comes as an event)
  }

  update(dt) {
    const r = this.rpg, t = r.time;
    const inDen = r.room === FENRIR_DEN;
    if (inDen && !this.inDen) this.cardAt = t;
    this.inDen = inDen;
    if (!inDen) return;
    stepFenrirLook(dt);
    const st = this.st;
    if (st) this.rcShown += (st.rc - this.rcShown) * Math.min(1, dt * 3);
    // the light of each lantern, eased (freed: they come back one by one)
    for (let i = 0; i < LANTERN_X.length; i++) {
      let want = 1;
      if (st) want = st.ln[i].lit ? 1 : st.ln[i].fill * 0.35;
      else if (this.freed) want = t - this.freed.at > 2 + i * FREED_GAP ? 1 : this.freed.light[i];
      this.light[i] += (want - this.light[i]) * Math.min(1, dt * (want > this.light[i] ? 3 : 6));
    }
    this.marks = this.marks.filter((q) => t < q.end);
    for (const [i, s] of this.swallow) if (t > s.end + 0.5) this.swallow.delete(i);
    if (this.freed && t - this.freed.at > 2 + LANTERN_X.length * FREED_GAP + 6) this.freed = null;
  }

  // ——— drawing, in world space (after the mobs, before the slimes) ———
  draw(ctx) {
    const r = this.rpg, t = r.time, st = this.st;
    if (r.room !== FENRIR_DEN) return;
    const v = st ? r.views.get(st.id) : null;
    // the dark over everything that isn't lit (the wolf's body too: you see its eyes and its breath)
    const level = st ? (st.enr ? DARK_RAGE_A : DARK_A) : this.freed ? DARK_A * clamp(1 - (t - this.freed.at - 2) / 8, 0.3, 1) : DARK_A;
    if (st || this.freed) drawDark(ctx, this.light, level);
    // the fetters: from each anchor still holding to its collar (the one being strained taut and hot)
    const L = fenrirLook(), coll = v ? (L.collar ? ctx.getTransform().inverse().transformPoint(L.collar) : { x: v.x + v.facing * 100, y: v.y - 150 }) : null;
    if (st && coll) st.an.forEach((a, i) => {
      if (a.st === 's') return;
      const A = ANCHORS[i];
      if (st.ph >= 3 && i === TEETH && L.muzzle) return; // (phase 4: that one runs to its teeth instead, below)
      drawFetter(ctx, A.x, A.y, coll.x, coll.y, t, a.st === 'c' ? 1 : 0.2);
    });
    if (st && v && st.ph >= 3 && st.an[TEETH].st !== 's') {
      const A = ANCHORS[TEETH];
      const mz = L.muzzle ? ctx.getTransform().inverse().transformPoint(L.muzzle) : { x: v.x + v.facing * 150, y: v.y - 120 };
      drawFetter(ctx, A.x, A.y, mz.x, mz.y, t, 0.4);
    }
    // the freed: the last fetter lies on the floor, still shining
    if (this.freed) drawFetter(ctx, this.freed.x - 160, FIN_FLOOR - 4, this.freed.x + 120, FIN_FLOOR - 3, t, 1, clamp((t - this.freed.at) / 2, 0, 1));
    // the anchors: the carving glows on a held one; a cracking one's ring; a split one
    ANCHORS.forEach((A, i) => {
      const a = st?.an[i], snapped = a?.st === 's';
      if (snapped) {
        ctx.strokeStyle = 'rgba(2,4,10,0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(A.x - 4, A.y - 40);
        ctx.lineTo(A.x + 6, A.y - 6);
        ctx.lineTo(A.x - 5, A.y + 14);
        ctx.lineTo(A.x + 3, A.y + 44);
        ctx.stroke();
        return;
      }
      const hot = a?.st === 'c', pulse = 0.5 + 0.5 * Math.sin(t * (hot ? 10 : 2) + i);
      glow(ctx, A.x, A.y, 40, 40, hot ? '255,200,170' : '200,224,255', (hot ? 0.45 : 0.15) + 0.15 * pulse);
      drawGlyph(ctx, GLYPHS[i], A.x, A.y, hot ? `rgba(255,236,220,${0.7 + 0.3 * pulse})` : 'rgba(220,236,255,0.75)', 1);
      if (hot) {
        // the crack running up the stone as its time runs out
        const left = clamp((a.until - t) / 7, 0, 1);
        ctx.strokeStyle = 'rgba(10,14,24,0.9)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y + 40);
        ctx.lineTo(A.x - 6, A.y + 40 - 80 * (1 - left) * 0.5);
        ctx.lineTo(A.x + 4, A.y + 40 - 80 * (1 - left));
        ctx.stroke();
        const hurt = clamp(1 - (t - (this.hurt.get(i) ?? -9)) / HURT_S, 0, 1);
        drawRing(ctx, A.x, A.y, ANCHOR_R, a.fill, t, hurt > 0);
      }
    });
    // the lanterns and their rings
    LANTERN_X.forEach((x, i) => {
      const l = st?.ln[i], hurt = clamp(1 - (t - (this.hurt.get(LANTERN_SLOT + i) ?? -9)) / HURT_S, 0, 1);
      drawLantern(ctx, x, this.light[i] > 0.4 ? this.light[i] : 0, l ? l.fill : 0, t, hurt);
      if (l && !l.lit && !st.enr && l.fill > 0.005) drawRing(ctx, x, LANTERN_Y, 22, l.fill, t, false);
      const sw = this.swallow.get(i);
      if (sw) { // (a son's jaws closing on it: a dark ring closing in)
        const k = clamp((t - sw.at) / Math.max(0.1, sw.end - sw.at), 0, 1);
        ctx.strokeStyle = `rgba(255,110,120,${0.5 + 0.4 * Math.sin(t * 14)})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, LANTERN_Y, 54 - 30 * k, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    // the reach: a line of frost on the floor at each end
    if (st && this.rcShown < FIN_W / 2 - 10) for (const s of [-1, 1]) drawFrostLine(ctx, FEN_MID + s * this.rcShown, t);
    // its moves' marks: where it'll land, where the claw goes
    for (const q of this.marks) {
      const k = clamp((t - q.at) / Math.max(0.1, q.end - q.at), 0, 1), pulse = 0.5 + 0.5 * Math.sin(t * (8 + 14 * k));
      ctx.save();
      if (q.kind === 'claw') {
        ctx.fillStyle = `rgba(255,90,100,${0.15 + 0.25 * k})`;
        ctx.fillRect(q.x0, FIN_FLOOR - CLAW_H, q.x1 - q.x0, CLAW_H + 4);
        ctx.strokeStyle = `rgba(255,130,130,${0.5 + 0.4 * pulse})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(q.x0, FIN_FLOOR - CLAW_H, q.x1 - q.x0, CLAW_H + 4);
      } else {
        ctx.fillStyle = `rgba(255,90,100,${0.18 + 0.25 * k})`;
        ctx.beginPath();
        ctx.ellipse(q.x, FIN_FLOOR + 2, q.r, q.kind === 'rear' ? 18 : 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255,130,130,${0.5 + 0.4 * pulse})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        if (q.kind === 'rear') {
          ctx.fillStyle = `rgba(255,90,100,${0.06 + 0.1 * k})`;
          ctx.fillRect(q.x - q.r, FIN_FLOOR - 120, q.r * 2, 120);
        }
      }
      ctx.restore();
    }
    // its eyes and its breath, over the dark
    if ((st || this.freed) && L.eye && L.p.eyes > 0.05) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const s = L.eyeS, x = L.eye.x, y = L.eye.y;
      glow(ctx, x, y, s * 1.2, s * 0.9, '220,240,255', 0.55 * L.p.eyes);
      ctx.fillStyle = `rgba(240,250,255,${0.9 * L.p.eyes})`;
      ctx.beginPath();
      ctx.ellipse(x, y, s * 0.17, s * 0.12 * L.p.eyes + 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      if (L.muzzle) {
        const b = 0.5 + 0.5 * Math.sin(t * 1.6);
        glow(ctx, L.muzzle.x + b * 10, L.muzzle.y - b * 8, s * (0.8 + b * 0.6), s * (0.5 + b * 0.4), '230,242,255', 0.25 * b);
      }
      ctx.restore();
    }
  }

  // ——— the title card, over the HUD for CARD_S s on walking in (letterbox bars; you can move all the while) ———
  drawHud(ctx, H) {
    const r = this.rpg, age = r.time - this.cardAt;
    if (r.room !== FENRIR_DEN || age < 0 || age > CARD_S) return;
    const k = clamp(Math.min(age / 0.6, (CARD_S - age) / 0.8), 0, 1), bar = 64 * k;
    ctx.save();
    ctx.fillStyle = 'rgba(2,4,10,0.92)';
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);
    ctx.globalAlpha = clamp((age - 0.4) / 0.6, 0, 1) * clamp((CARD_S - age) / 0.8, 0, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const name = MOBS.fenrir.name.toUpperCase(), y = H * 0.36;
    ctx.font = `700 46px ${FONT}`;
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(4,8,18,0.9)';
    ctx.strokeText(name, W / 2, y);
    ctx.fillStyle = '#f2f8ff';
    ctx.fillText(name, W / 2, y);
    ctx.font = `700 20px ${FONT}`;
    ctx.lineWidth = 6;
    ctx.strokeText(finalTag(FROST_TOP), W / 2, y + 44);
    ctx.fillStyle = '#bcdcff';
    ctx.fillText(finalTag(FROST_TOP), W / 2, y + 44);
    ctx.restore();
  }
}
