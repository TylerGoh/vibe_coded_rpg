// Docs: docs/places/carapace.md, docs/combat/bosses.md
// Old Carapace on the client (atlas Phase 9, A5 (c); the brain is server/carapace.js, the numbers src/shared/carapace.js):
// what its 'final' message says (the phase, his pose, the stride's phase and period, the well, the drink's window), drawn
// over the den (the Look's gaze, the half of the shell about to take a footfall, the Snap's marks, the water in the well),
// which target a hit of ours is on (the shard while he lies down, or him: v.part, read by Party.mod), the drink's window on
// hits to him (hold: Party.mod as the server does), the Snap it judges on our side, the title card on walking in, and his
// freeing (he lies down). The Stride itself is the server's (a flat hurt): this only draws it. The ultimates are the shared
// `wave` and `nova` (src/rpg.js; their look: src/dens-carapace.js). No hint names an answer: telegraphs and pops only.
import { W, clamp } from './util.js';
import { audio } from './audio.js';
import { MOBS, LONG_DEN, finalTag, DUNE_TOP, weakOf } from './shared/rpg.js';
import { FIN_FLOOR, HEAD_REACH } from './shared/final.js';
import { HEAD_X, WELL_X, WELL_N, SLAKE_MULT, SNAP_H, STRIDE_LIFT, FEET } from './shared/carapace.js';
import { setShellLook, shellLook, glow, SAND_RGB, drawOldCarapace } from './dens-carapace.js';

const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const CARD_S = 5; // the title card's seconds (you can move all the while)
export const FREED_LIE_S = 7; // freed: he lies down, slowly, all the way

export class CarapaceFinal {
  constructor(rpg) {
    this.rpg = rpg;
    this.st = null; // { id, ph, enr, po, ss, wl, opUntil, dr, steps }
    this.cardAt = -99;
    this.inDen = false;
    this.sp = 0; // the stride's phase as drawn (eased toward the server's)
    this.marks = []; // the Snap's landings: { x, r, at, end, late }
    this.footAt = [-99, -99]; // when each foot last landed (drawn: dust)
    this.wlShown = 0;
    this.freed = null; // { at }
  }
  clear() {
    this.st = null;
    this.freed = null;
    this.marks = [];
    setShellLook({ po: 'walk', ph: 0, enr: false, sp: 0, slaked: false });
  }
  // {t:'final', fb:'old_carapace', id, ph, enr, po, sp, ss, wl, op, dr, st}
  receive(m) {
    const t = this.rpg.time, old = this.st;
    if (!old) this.sp = m.sp;
    else {
      let dd = m.sp - this.sp;
      dd -= Math.round(dd);
      this.sp = Math.abs(dd) > 0.12 ? m.sp : this.sp + dd * 0.5;
    }
    this.freed = null;
    this.st = { id: m.id, ph: m.ph, enr: !!m.enr, po: m.po, ss: m.ss, wl: m.wl, opUntil: m.op > 0 ? t + m.op / 1000 : 0, dr: m.dr, steps: m.st };
    setShellLook({ po: m.po, ph: m.ph, enr: !!m.enr, sp: this.sp, slaked: m.op > 0 });
  }
  // the drink's window: every hit on him does more (src/shared/carapace.js SLAKE_MULT)
  hold() {
    return this.st && this.st.opUntil > this.rpg.time ? SLAKE_MULT : 1;
  }
  slaked() {
    return !!this.st && this.st.opUntil > this.rpg.time;
  }

  // ——— which target of boss view v a hit of ours is on ———
  // ahead of (x, feet y) toward dir, reach px out (back px behind) → { weak, x, y } (the shard) | 'body' | null
  reach(v, x, y, dir, reach, back, arrow) {
    const k = MOBS[v.kind], t = this.rpg.time, b = this.rpg.party.bosses.get(v.id);
    const ahead = (sx, r) => {
      const d = (sx - x) * dir;
      return d >= -back - r && d <= reach + r ? Math.abs(d) : -1;
    };
    if (b?.wk && b.wk.until > t) {
      const s = weakOf(k, v.x, v.y, 1);
      if (ahead(s.x, s.r) >= 0 && (arrow || Math.abs(y - 20 - s.y) < s.r + HEAD_REACH)) return { weak: true, x: s.x, y: s.y };
    }
    const bd = ahead(v.x, k.w / 2);
    return bd >= 0 ? 'body' : null;
  }
  // an area hit round (x, feet y), radius r → the same
  reachAround(v, x, y, r) {
    const k = MOBS[v.kind], t = this.rpg.time, b = this.rpg.party.bosses.get(v.id);
    if (b?.wk && b.wk.until > t) {
      const s = weakOf(k, v.x, v.y, 1);
      if (Math.abs(s.x - x) < r + s.r && Math.abs(y - 20 - s.y) < s.r + HEAD_REACH) return { weak: true, x: s.x, y: s.y };
    }
    return Math.abs(v.x - x) < r + k.w / 2 ? 'body' : null;
  }

  // ——— its events → true if handled ———
  event(m, pan, me) {
    const r = this.rpg, t = r.time;
    const low = (h = 70) => me && me.y > FIN_FLOOR - h && !me.onPlat;
    if (m.a === 'die') {
      this.freed = { at: t };
      this.st = null;
      this.marks = [];
      setShellLook({ po: 'freed', enr: false, slaked: false, freedAt: t });
      audio.sfx('collapse', { vol: 0.3 });
      return false; // (the usual death runs too)
    }
    if (m.a === 'watch') {
      audio.sfx('bossWarn', { pan, vol: m.to === r.myId ? 0.7 : 0.35 });
    } else if (m.a === 'snap') {
      this.marks.push({ x: m.tx, r: m.r, at: t, end: t + m.dur + 0.4, late: false });
      audio.sfx('bossWarn', { pan, vol: 0.5 });
    } else if (m.a === 'snapLate') {
      for (const q of this.marks) if (q.x === m.tx) [q.end, q.late] = [t + m.dur + 0.3, true];
      r.pop(m.tx, FIN_FLOOR - 150, '...', '#fff0d8', 20);
    } else if (m.a === 'snapHit') {
      this.marks = this.marks.filter((q) => q.x !== m.tx);
      r.bossFx.spawn('shockwave', { x: m.tx, y: FIN_FLOOR, radius: m.r + 20, theme: 'shell' });
      audio.sfx('bossSlam', { pan, vol: 0.85 });
      if (low(SNAP_H) && Math.abs(me.x - m.tx) < m.r) r.ouchNext = { mob: m.id, kind: 'slam', mx: m.tx };
    } else if (m.a === 'foot') {
      this.footAt[m.i] = t;
      const f = FEET[m.i];
      r.bossFx.spawn('shockwave', { x: (f.x0 + f.x1) / 2, y: FIN_FLOOR, radius: (f.x1 - f.x0) / 2, theme: 'shell' });
      audio.sfx('bossSlam', { pan, vol: 0.4 });
    } else if (m.a === 'pour') {
      r.pop(WELL_X, FIN_FLOOR - 120, `${m.wl}/${WELL_N}`, '#cfeaff', 18);
      audio.sfx('bubblePop', { vol: 0.6 });
    } else if (m.a === 'drink') {
      r.fx.spawn('nova', { x: WELL_X, y: FIN_FLOOR - 30, radius: 80, tint: 'mana' });
      r.pop(WELL_X, 120, 'DRINK', '#cfeaff', 24);
      r.flash = Math.max(r.flash ?? 0, 0.3);
      audio.sfx('heal', { vol: 0.7 });
    } else if (m.a === 'drained') {
      audio.sfx('shellBlock', { pan, vol: 0.4 });
    } else if (m.a === 'sip') {
      r.pop(WELL_X, FIN_FLOOR - 120, `${m.wl}/${WELL_N}`, '#ffb0a0', 16);
      audio.sfx('summon', { pan, vol: 0.25 });
    } else if (m.a === 'drinking') {
      audio.sfx('summon', { pan, vol: 0.2 });
    } else if (m.a === 'mirages') {
      r.bossFx.spawn('summon', { x: m.px, y: FIN_FLOOR - 60, theme: 'shell' });
      audio.sfx('summon', { pan, vol: 0.4 });
    } else if (m.a === 'walkStep') {
      audio.sfx(m.dir > 0 ? 'bossWarn' : 'shellBlock', { pan, vol: 0.35 });
    } else if (m.a === 'rest') {
      audio.sfx('ultWarn', { vol: 0.45 });
    } else if (m.a === 'trample') {
      r.flash = Math.max(r.flash ?? 0, 0.6);
      r.bossFx.spawn('shockwave', { x: 750, y: FIN_FLOOR, radius: 750, theme: 'shell' });
      audio.sfx('collapse', { pan });
    } else if (m.a === 'restBroken') {
      audio.sfx('eggBreak', { pan });
    } else if (m.a === 'storm') {
      r.flash = Math.max(r.flash ?? 0, 0.5);
      audio.sfx('phaseOut', { pan });
    } else if (m.a === 'finalRage') {
      r.bossFx.spawn('roar', { x: HEAD_X, y: 200, theme: 'shell' });
      audio.sfx('bossRoar', { pan });
      r.flash = Math.max(r.flash ?? 0, 0.8);
    } else return false;
    return true;
  }
  // its ultimates are the shared ones (src/rpg.js judges them)
  ult() {
    return false;
  }
  hits() {
    return null;
  }

  update(dt) {
    const r = this.rpg, t = r.time;
    const inDen = r.room === LONG_DEN;
    if (inDen && !this.inDen) this.cardAt = t;
    this.inDen = inDen;
    if (!inDen) return;
    const st = this.st;
    if (st && !this.slaked()) this.sp = (this.sp + dt / Math.max(0.5, st.ss)) % 1;
    setShellLook({ sp: this.sp, slaked: this.slaked() });
    this.wlShown += ((st?.wl ?? 0) - this.wlShown) * Math.min(1, dt * 4);
    this.marks = this.marks.filter((q) => t < q.end);
    if (this.freed && t - this.freed.at > FREED_LIE_S + 8) this.freed = null;
  }

  // ——— drawing, in world space (after the mobs, before the slimes) ———
  draw(ctx) {
    const r = this.rpg, t = r.time, st = this.st;
    if (r.room !== LONG_DEN) return;
    // the Look: his old eye's gaze reaching back along the shell to the looked-at slime
    const b = st ? r.party.bosses.get(st.id) : null, fs = b?.focus && b.until > t ? r.slimeOf(b.focus) : null, fx = fs?.x;
    if (st && fx != null) {
      ctx.save();
      const g = ctx.createLinearGradient(HEAD_X - 40, 200, fx, FIN_FLOOR - 40);
      g.addColorStop(0, 'rgba(255,236,190,0.2)');
      g.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(HEAD_X - 50, 196);
      ctx.lineTo(fx - 40, FIN_FLOOR);
      ctx.lineTo(fx + 40, FIN_FLOOR);
      ctx.lineTo(HEAD_X - 30, 210);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // the Stride: the half of the shell that takes the next footfall lifts first (dust off it, a shadow under it)
    if (st && !this.slaked()) {
      const next = this.sp < 0.5 ? 1 : 0, left = (next === 1 ? 0.5 - this.sp : 1 - this.sp) * 2; // (0..1 of a half-period)
      if (left < STRIDE_LIFT) {
        const k = 1 - left / STRIDE_LIFT, F = FEET[next];
        ctx.save();
        ctx.fillStyle = `rgba(${SAND_RGB},${0.1 + 0.22 * k})`;
        ctx.fillRect(F.x0, FIN_FLOOR - 60 * k, F.x1 - F.x0, 60 * k + 2);
        ctx.strokeStyle = `rgba(255,120,100,${0.3 + 0.5 * k})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(F.x0, FIN_FLOOR - 2);
        ctx.lineTo(F.x1, FIN_FLOOR - 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(232,200,150,${0.4 * k})`; // dust streaming off it
        for (let i = 0; i < 8; i++) {
          const x = F.x0 + ((i * 61 + t * 90) % (F.x1 - F.x0));
          ctx.beginPath();
          ctx.ellipse(x, FIN_FLOOR - 8 - ((t * 40 + i * 13) % 30), 10, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
    // the well: water in it as it fills, glinting; the drink's window a cool glow over him
    if (this.wlShown > 0.02 || this.slaked()) {
      const k = this.slaked() ? 1 : clamp(this.wlShown / WELL_N, 0, 1);
      glow(ctx, WELL_X, FIN_FLOOR - 30, 70, 30, '170,220,255', 0.25 + 0.3 * k);
      ctx.fillStyle = `rgba(120,190,240,${0.5 + 0.3 * k})`;
      ctx.beginPath();
      ctx.ellipse(WELL_X, FIN_FLOOR - 24 - 10 * k, 42, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(t * 5)})`;
      ctx.fillRect(WELL_X - 12 + Math.sin(t * 2) * 10, FIN_FLOOR - 26 - 10 * k, 6, 1.6);
    }
    if (this.slaked()) glow(ctx, HEAD_X, 240, 120, 120, '170,220,255', 0.18 + 0.08 * Math.sin(t * 4));
    // the Snap's landing marks
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
      ctx.fillRect(q.x - q.r, FIN_FLOOR - SNAP_H, q.r * 2, SNAP_H);
      ctx.restore();
    }
    if (st?.enr) glow(ctx, HEAD_X, 220, 130, 130, '255,90,80', 0.15 + 0.08 * Math.sin(t * 6));
    // freed: he lies down, his head on the sand ahead of the shell, until he's back
    if (!st && t - shellLook().freedAt < 60) {
      const k = MOBS.old_carapace;
      ctx.save();
      ctx.translate(HEAD_X, FIN_FLOOR);
      ctx.globalAlpha = clamp((t - shellLook().freedAt) / 1.5, 0, 1);
      drawOldCarapace(ctx, k.w, k.h, { t, seed: 0, dying: 0, still: true });
      ctx.restore();
    }
  }
  // ——— the title card, over the HUD for CARD_S s on walking in (letterbox bars; you can move all the while) ———
  drawHud(ctx, H) {
    const r = this.rpg, age = r.time - this.cardAt;
    if (r.room !== LONG_DEN || age < 0 || age > CARD_S) return;
    const k = clamp(Math.min(age / 0.6, (CARD_S - age) / 0.8), 0, 1), bar = 64 * k;
    ctx.save();
    ctx.fillStyle = 'rgba(16,10,6,0.92)';
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);
    ctx.globalAlpha = clamp((age - 0.4) / 0.6, 0, 1) * clamp((CARD_S - age) / 0.8, 0, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const name = MOBS.old_carapace.name.toUpperCase(), y = H * 0.36;
    ctx.font = `700 46px ${FONT}`;
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20,12,6,0.9)';
    ctx.strokeText(name, W / 2, y);
    ctx.fillStyle = '#fff2d8';
    ctx.fillText(name, W / 2, y);
    ctx.font = `700 20px ${FONT}`;
    ctx.lineWidth = 6;
    ctx.strokeText(finalTag(DUNE_TOP), W / 2, y + 44);
    ctx.fillStyle = '#e8a860';
    ctx.fillText(finalTag(DUNE_TOP), W / 2, y + 44);
    ctx.restore();
  }
}
