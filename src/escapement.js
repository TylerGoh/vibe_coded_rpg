// Docs: docs/places/escapement.md, docs/combat/bosses.md
// The Escapement on the client (the Citadel's C6 (c); the brain is server/escapement.js, the numbers
// src/shared/escapement.js): what its 'final' message says (the phase, its pose, the beat's phase, period and amplitude, the
// haul, the two pallets and the Tick's window), drawn over the den (the crutch and the bob swinging on the beat, the pallets'
// states and the pawls jamming them, the Pallet Strike's mark, the Count's light, phase 4's beat ring round you, the
// Counter-Swing's sweep), which target a hit of ours is on (a pallet, the shard or its body: v.part, read by Party.mod), the
// Tick's open window on hits to its body (hold: Party.mod as the server does), the moves it judges on our side (the strike,
// its three ultimates), the title card on walking in, and its freeing. The Beat itself is the server's (a flat hurt): this
// only draws it. No hint names an answer (owner, 2026-10-26): telegraphs and pops only.
import { W, clamp } from './util.js';
import { audio } from './audio.js';
import { MOBS, CATCH_DEN, finalTag, CITADEL_TOP, weakOf } from './shared/rpg.js';
import { FIN_W, FIN_FLOOR, HEAD_REACH } from './shared/final.js';
import {
  ESC_MID, PALLETS, TICK_OPEN_MULT, TICK_CD, STRIKE_H, STILL_V, STOPPED_GRACE, BOB_R, PIVOT_Y, bobX, bobY, bobLow, haulX, holdSafe, counterSafe, catchLedgeAt, palletSpot,
} from './shared/escapement.js';
import { CITADEL_MAP } from './shared/branches.js';
import { drawRing } from './dens-ladon.js';
import { drawPendulum, setEscLook, stepEscLook, toothGo, glow, AETHER } from './dens-esc.js';

const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const CARD_S = 5; // the title card's seconds (you can move all the while)
const FREED_SWING_S = 6; // freed: the bob's one free swing the length of the den, settling
// Freed, the city ticks once (story/c6-plan.md, per character): the next time you're in any Citadel room after freeing it,
// one great tick, heard everywhere, and the light jumps. Once (kept in this browser: TICK_KEY)
const CITADEL_ROOMS = new Set(CITADEL_MAP.flatMap((n) => n.rooms ?? (n.zr != null ? [n.zr] : [])));
const TICK_KEY = 'slimeville-city-ticked';

export class EscFinal {
  constructor(rpg) {
    this.rpg = rpg;
    this.st = null; // { id, ph, enr, po, bs, ba, sw, hl, pl: [{ jam, struckAt, jamming }], opUntil, cdUntil, tk }
    this.cardAt = -99;
    this.inDen = false;
    this.ph = 0; // the beat's phase as drawn (eased toward the server's)
    this.amp = 300;
    this.bob = { x: ESC_MID, y: 380 }; // the bob as drawn (eased toward where it should be)
    this.marks = []; // the Pallet Strike's landings: { x, r, at, end, late }
    this.wave = null; // the Counter-Swing: { mob, dir, x0, speed, at, front }
    this.beatAt = -99; // phase 4: the last beat the server checked on (the ring round you closes to the next)
    this.lastMove = -99;
    this.flashPal = [-99, -99]; // when each pallet was last struck (drawn)
    this.freed = null; // { at }
  }
  clear() {
    this.st = null;
    this.freed = null;
    this.marks = [];
    this.wave = null;
    setEscLook({ po: 'hold', ph: 0, enr: false, jam: [0, 0] });
  }
  // {t:'final', fb:'escapement', id, ph, enr, po, bp, bs, ba, sw, hl, pl: [[jam, struck ms ago, jamming %]], op, tk}
  receive(m) {
    const t = this.rpg.time, old = this.st;
    const pl = m.pl.map(([jam, ago, jamming]) => ({ jam: !!jam, struckAt: ago >= 0 ? t - ago / 1000 : -99, jamming: jamming / 100 }));
    if (!old) [this.ph, this.amp] = [m.bp, m.ba];
    else {
      // nudge the drawn phase toward the server's (snap if it's far off)
      let d = m.bp - this.ph;
      d -= Math.round(d);
      this.ph = Math.abs(d) > 0.12 ? m.bp : this.ph + d * 0.5;
    }
    const opUntil = m.op > 0 ? t + m.op / 1000 : 0;
    this.freed = null;
    this.st = { id: m.id, ph: m.ph, enr: !!m.enr, po: m.po, bs: m.bs, ba: m.ba, sw: m.sw, hl: m.hl, pl, opUntil, cdUntil: opUntil ? opUntil + TICK_CD : old?.cdUntil ?? 0, tk: m.tk };
    setEscLook({ po: m.po, ph: m.ph, enr: !!m.enr, jam: pl.map((p) => (p.jam ? 1 : 0)) });
  }
  // the Tick's open window: every hit on its body does more (src/shared/escapement.js TICK_OPEN_MULT)
  hold() {
    return this.st && this.st.opUntil > this.rpg.time ? TICK_OPEN_MULT : 1;
  }
  // can pallet slot be struck now? (not jammed, not in the window or just after it, never once enraged)
  open(slot) {
    const st = this.st;
    if (!st || st.enr) return false;
    return !!st.pl[slot] && !st.pl[slot].jam && this.rpg.time >= st.cdUntil;
  }

  // ——— which target of boss view v a hit of ours is on ———
  // ahead of (x, feet y) toward dir, reach px out (back px behind); arrow: arrows (and spells, bolts) reach a pallet at any
  // height → { slot, x, y, prop } (a pallet) | { weak, x, y } (the shard) | 'body' | null. The nearest wins.
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
    for (let slot = 0; slot < PALLETS.length; slot++) {
      if (!this.open(slot)) continue;
      const s = palletSpot(slot), d = ahead(s.x, s.r);
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
    for (let slot = 0; slot < PALLETS.length; slot++) {
      if (!this.open(slot)) continue;
      const s = palletSpot(slot), d = Math.abs(s.x - x);
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
    const low = (h = 70) => me && me.y > FIN_FLOOR - h && !me.onPlat;
    if (m.a === 'die') {
      this.freed = { at: t, x0: this.bob.x };
      this.st = null;
      this.marks = [];
      this.wave = null;
      setEscLook({ po: 'freed', enr: false, jam: [0, 0] });
      audio.sfx('bossSlam', { vol: 0.4 });
      return false; // (the usual death runs too)
    }
    if (m.a === 'watch') {
      audio.sfx('bossWarn', { pan, vol: m.to === r.myId ? 0.7 : 0.35 });
    } else if (m.a === 'strike') {
      this.marks.push({ x: m.tx, r: m.r, at: t, end: t + m.dur + 0.4, late: false });
      audio.sfx('bossWarn', { pan, vol: 0.5 });
    } else if (m.a === 'strikeLate') {
      for (const q of this.marks) if (q.x === m.tx) [q.end, q.late] = [t + m.dur + 0.3, true];
      r.pop(m.tx, FIN_FLOOR - 140, '...', '#dff8f4', 20);
    } else if (m.a === 'strikeHit') {
      this.marks = this.marks.filter((q) => q.x !== m.tx);
      r.bossFx.spawn('shockwave', { x: m.tx, y: FIN_FLOOR, radius: m.r + 20, theme: 'catch' });
      audio.sfx('bossSlam', { pan, vol: 0.85 });
      if (low(STRIKE_H) && Math.abs(me.x - m.tx) < m.r) r.ouchNext = { mob: m.id, kind: 'slam', mx: m.tx };
    } else if (m.a === 'struck') {
      this.flashPal[m.i] = t;
      audio.sfx('shellBlock', { pan, vol: 0.4 });
    } else if (m.a === 'tick') {
      // one tooth let go: the Wheel jolts round
      toothGo();
      for (const P of PALLETS) r.fx.spawn('nova', { x: P.x, y: P.y, radius: 44, tint: 'mana' });
      r.pop(ESC_MID, 90, 'TICK', '#dff8f4', 24);
      r.flash = Math.max(r.flash ?? 0, 0.35);
      audio.sfx('bossSlam', { vol: 0.7 });
    } else if (m.a === 'bite') {
      audio.sfx('shellBlock', { pan, vol: 0.55 });
    } else if (m.a === 'jamming') {
      audio.sfx('summon', { pan, vol: 0.25 });
    } else if (m.a === 'jam') {
      const P = PALLETS[m.i];
      r.pop(P.x, P.y - 50, 'JAMMED', '#ff9a8a', 16);
      audio.sfx('shellBlock', { pan, vol: 0.6 });
    } else if (m.a === 'jamStopped' || m.a === 'unjam') {
      const P = PALLETS[m.i];
      r.pop(P.x, P.y - 50, 'FREE', '#e6f2ff', 16);
    } else if (m.a === 'pawls') {
      r.bossFx.spawn('summon', { x: m.px, y: 120, theme: 'catch' });
      audio.sfx('summon', { pan, vol: 0.4 });
    } else if (m.a === 'swingStep') {
      audio.sfx(m.dir > 0 ? 'bossWarn' : 'shellBlock', { pan, vol: 0.35 });
    } else if (m.a === 'rewound') {
      audio.sfx('ultWarn', { vol: 0.45 });
    } else if (m.a === 'drop') {
      r.flash = Math.max(r.flash ?? 0, 0.6);
      r.bossFx.spawn('shockwave', { x: ESC_MID, y: FIN_FLOOR, radius: FIN_W / 2, theme: 'catch' });
      audio.sfx('collapse', { pan });
    } else if (m.a === 'rewoundBroken') {
      audio.sfx('eggBreak', { pan });
    } else if (m.a === 'stopping') {
      r.flash = Math.max(r.flash ?? 0, 0.5);
      audio.sfx('phaseOut', { pan });
    } else if (m.a === 'tickBeat') {
      this.beatAt = t;
      audio.sfx('shellBlock', { pan, vol: 0.3 });
    } else if (m.a === 'finalRage') {
      r.bossFx.spawn('roar', { x: ESC_MID, y: 200, theme: 'catch' });
      audio.sfx('bossRoar', { pan });
      r.flash = Math.max(r.flash ?? 0, 0.8);
    } else return false;
    return true;
  }
  // its ultimates going off (from Rpg.newUlt) → true if one of its: Hold (under the hauled bob, or that end's ledges),
  // Counter-Swing (the high ledge at the far end, as the sweep passes) and The Stopped Hour (moving as it lands)
  ult(m, me) {
    const r = this.rpg, ledge = () => (me.onPlat && me.grounded ? catchLedgeAt(me.x, me.y) : -1);
    if (m.kind === 'hold') {
      audio.sfx('bossSlam');
      if (!holdSafe(m.side ?? 1, me.x, ledge())) r.ouchNext = { mob: m.id, kind: 'ult', mx: me.x - 1, noDodge: true };
      return true;
    }
    if (m.kind === 'counter') {
      audio.sfx('collapse');
      this.wave = { mob: m.id, dir: m.dir, x0: m.x0, speed: m.speed, at: r.time, front: m.x0 };
      return true;
    }
    if (m.kind === 'stopped') {
      audio.sfx('phaseOut');
      const moving = Math.abs(me.vx) > STILL_V || !me.grounded || r.time - this.lastMove < STOPPED_GRACE;
      if (!moving) r.ouchNext = { mob: m.id, kind: 'ult', mx: me.x - 1, noDodge: true };
      return true;
    }
    return false;
  }
  // every step: whether we're moving (the Stopped Hour), and the Counter-Swing's sweep passing us (the Beat is the server's)
  hits(me) {
    const t = this.rpg.time;
    if (!me) return null;
    if (Math.abs(me.vx) > STILL_V || !me.grounded) this.lastMove = t;
    if (!this.wave) return null;
    const w = this.wave, front = w.x0 + w.dir * w.speed * (t - w.at), prev = w.front;
    w.front = front;
    if (front < -80 || front > FIN_W + 80) this.wave = null;
    if ((prev - me.x) * (front - me.x) <= 0) {
      const ledge = me.onPlat && me.grounded ? catchLedgeAt(me.x, me.y) : -1;
      if (!counterSafe(w.dir, ledge)) return { mob: w.mob, kind: 'ult', mx: me.x - w.dir, noDodge: true };
    }
    return null;
  }

  // where the bob should be drawn now → { x, y, low }
  bobAt() {
    const st = this.st, t = this.rpg.time;
    if (this.freed) {
      // one free swing the length of the den, settling to rest in the middle
      const k = clamp((t - this.freed.at) / FREED_SWING_S, 0, 1), a = (FIN_W / 2 - 80) * (1 - k) ** 1.5 * Math.cos(k * Math.PI * 2.5);
      const x = ESC_MID + a;
      return { x, y: bobY(x, FIN_W / 2 - 80), low: false };
    }
    if (!st) return { x: ESC_MID, y: bobY(ESC_MID, this.amp), low: false };
    if (this.wave) return { x: clamp(this.wave.front, 40, FIN_W - 40), y: FIN_FLOOR - 70, low: true };
    if (st.hl === 2) return { x: ESC_MID, y: 200, low: false }; // (stopped, held high in the middle)
    if (st.hl === 1 || st.hl === -1) return { x: haulX(st.hl), y: 150, low: false }; // (hauled up to one end)
    const x = bobX(this.ph, this.amp);
    return { x, y: bobY(x, this.amp), low: bobLow(x, this.amp) };
  }

  // freed: the first time back in the Citadel, the city ticks once
  cityTick() {
    const r = this.rpg;
    if (this.ticked || !CITADEL_ROOMS.has(r.room) || r.room === CATCH_DEN || !r.me?.freed?.includes('escapement')) return;
    this.ticked = true;
    try {
      if (localStorage.getItem(TICK_KEY)) return;
      localStorage.setItem(TICK_KEY, '1');
    } catch {
      return;
    }
    audio.sfx('bossSlam', { vol: 0.9 });
    audio.sfx('collapse', { vol: 0.35 });
    r.flash = Math.max(r.flash ?? 0, 0.45);
  }
  update(dt) {
    const r = this.rpg, t = r.time;
    this.cityTick();
    const inDen = r.room === CATCH_DEN;
    if (inDen && !this.inDen) this.cardAt = t;
    this.inDen = inDen;
    if (!inDen) return;
    stepEscLook(dt, t);
    const st = this.st;
    if (st) {
      this.ph = (this.ph + dt / Math.max(0.5, st.bs)) % 1;
      this.amp += (st.ba - this.amp) * Math.min(1, dt * 3);
    }
    const want = this.bobAt(), k = Math.min(1, dt * (want.low ? 30 : 4));
    this.bob.x += (want.x - this.bob.x) * k;
    this.bob.y += (want.y - this.bob.y) * k;
    this.marks = this.marks.filter((q) => t < q.end);
    if (this.freed && t - this.freed.at > FREED_SWING_S + 8) this.freed = null;
  }

  // ——— drawing, in world space (after the mobs, before the slimes) ———
  draw(ctx) {
    const r = this.rpg, t = r.time, st = this.st;
    if (r.room !== CATCH_DEN) return;
    const v = st ? r.views.get(st.id) : null;
    // the Count: the shard's light reaching toward the counted slime
    const b = st ? r.party.bosses.get(st.id) : null, fs = b?.focus && b.until > t ? r.slimeOf(b.focus) : null, fx = fs?.x;
    if (st && fx != null) {
      ctx.save();
      const g = ctx.createLinearGradient(ESC_MID, 150, fx, FIN_FLOOR - 40);
      g.addColorStop(0, 'rgba(190,255,250,0.22)');
      g.addColorStop(1, 'rgba(190,255,250,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(ESC_MID - 10, 150);
      ctx.lineTo(fx - 40, FIN_FLOOR);
      ctx.lineTo(fx + 40, FIN_FLOOR);
      ctx.lineTo(ESC_MID + 10, 150);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // the pallets' rings: struck (a bright flash and a ring running down the tick's window), jammed, a pawl jamming one
    PALLETS.forEach((P, i) => {
      const p = st?.pl[i];
      if (!p) return;
      const since = t - p.struckAt;
      if (since >= 0 && since < 1.5 && this.open(i)) drawRing(ctx, P.x, P.y, 44, 1 - since / 1.5, t, since < 0.15);
      if (p.jamming > 0 && !p.jam) drawRing(ctx, P.x, P.y + 120, 30, p.jamming, t, false);
      if (p.jam) glow(ctx, P.x, P.y + 20, 50, 30, '255,110,90', 0.4 + 0.15 * Math.sin(t * 8));
      if (st.opUntil > t) glow(ctx, P.x, P.y, 46, 46, AETHER, 0.4);
    });
    // the pendulum (its crutch out of the dark, the bob swinging) and its low band's mark on the floor
    const bob = this.bob, low = st && !st.hl && !this.wave && bobLow(bob.x, this.amp);
    if (low) {
      ctx.fillStyle = 'rgba(255,110,90,0.18)';
      ctx.fillRect(bob.x - BOB_R, FIN_FLOOR - 4, BOB_R * 2, 8);
    }
    drawPendulum(ctx, bob.x, bob.y, PIVOT_Y, t, 0.6, st?.ph >= 3 ? 1 : 0);
    // the Pallet Strike's landing marks
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
      ctx.fillRect(q.x - q.r, FIN_FLOOR - STRIKE_H, q.r * 2, STRIKE_H);
      ctx.restore();
    }
    // phase 4: the beat round you, a ring closing to the next tick like a clock hand
    const mine = st && st.ph >= 3 ? r.slimeOf(r.myId) : null;
    if (mine) {
      const per = st.bs * (st.enr ? 0.5 : 1), k = clamp((t - this.beatAt) / per, 0, 1), x = mine.x;
      {
        ctx.save();
        ctx.strokeStyle = `rgba(220,255,250,${0.25 + 0.5 * k})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, mine.y - 24, 64 - 30 * k, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
    // the Counter-Swing's sweep: a wash of bronze behind the bob as it goes
    if (this.wave) {
      const w = this.wave, a = w.dir > 0 ? Math.max(0, w.front - 260) : w.front, z = w.dir > 0 ? w.front : Math.min(FIN_W, w.front + 260);
      if (z > a) {
        const g = ctx.createLinearGradient(w.front - w.dir * 260, 0, w.front, 0);
        g.addColorStop(0, 'rgba(253,214,150,0)');
        g.addColorStop(1, 'rgba(253,214,150,0.4)');
        ctx.fillStyle = g;
        ctx.fillRect(a, 100, z - a, FIN_FLOOR - 100);
      }
    }
    if (v && st?.enr) glow(ctx, ESC_MID, 150, 120, 120, '255,90,80', 0.15 + 0.08 * Math.sin(t * 6));
  }
  // ——— the title card, over the HUD for CARD_S s on walking in (letterbox bars; you can move all the while) ———
  drawHud(ctx, H) {
    const r = this.rpg, age = r.time - this.cardAt;
    if (r.room !== CATCH_DEN || age < 0 || age > CARD_S) return;
    const k = clamp(Math.min(age / 0.6, (CARD_S - age) / 0.8), 0, 1), bar = 64 * k;
    ctx.save();
    ctx.fillStyle = 'rgba(4,6,10,0.92)';
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);
    ctx.globalAlpha = clamp((age - 0.4) / 0.6, 0, 1) * clamp((CARD_S - age) / 0.8, 0, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const name = MOBS.escapement.name.toUpperCase(), y = H * 0.36;
    ctx.font = `700 46px ${FONT}`;
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(8,10,16,0.9)';
    ctx.strokeText(name, W / 2, y);
    ctx.fillStyle = '#e8fffb';
    ctx.fillText(name, W / 2, y);
    ctx.font = `700 20px ${FONT}`;
    ctx.lineWidth = 6;
    ctx.strokeText(finalTag(CITADEL_TOP), W / 2, y + 44);
    ctx.fillStyle = '#e0b066';
    ctx.fillText(finalTag(CITADEL_TOP), W / 2, y + 44);
    ctx.restore();
  }
}
