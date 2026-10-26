// Docs: docs/places/ladon.md, docs/combat/bosses.md
// A final boss on the client (FB1 (c); the brain is server/final.js, the numbers FINAL and the rest of
// src/shared/final.js): what the 'final' message says (the phase, the heads and their rings, the acting head, the
// coils, the enrage), drawn over the den (the necks, heads, stumps, the first head's eyes in the dark, the coils, the
// bite marks), which head or part a hit of ours is on (the Rpg's ahead() / around() ask reach(): v.part, read by
// Party.mod), the hazards it judges itself (a Bite, the coils, its two ultimates) and the title card on walking in.
// No hint names an answer (owner, 2026-10-26): telegraphs and pops only.
import { W, clamp } from './util.js';
import { audio } from './audio.js';
import { MOBS, LADON_DEN, finalTag, GREEN_TOP, weakOf } from './shared/rpg.js';
import { FIN_W, FIN_FLOOR, LADON_SLOTS, LADON_PLATFORMS, LADON_HIGH, headSpot, headTarget, throatOpen, isStump, inCoils, HEAD_R, HEAD_REACH, BITE_R, SWELL_S, onBitePath, BITE_PATH_R } from './shared/final.js';
import { drawHead, drawStump, drawRing, drawCoilWall, drawEyes, drawHighArch, cane, glow, setLadonLook } from './dens-ladon.js';

const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const CARD_S = 5; // the title card's seconds (you can move all the while)
const EYES_Y = 100; // the first head's eyes in the dark, over the body (above the boss bar)
const HEAD_S = 1.25, NECK_W = 34; // a side head's size and neck (the first head is twice the size)
const HURT_S = 0.25; // a head's flash when its ring fills (a hit)
const FREED_S = 11, FREED_GAP = 0.7; // its death: how long the heads take to sink, one every FREED_GAP s

// a hanging head's angle, kept near profile (a skull pointing straight down doesn't read): at most PROFILE_MAX off level
const PROFILE_MAX = 0.95;
const profile = (a, dx) => (dx >= 0 ? clamp(a, -PROFILE_MAX, PROFILE_MAX) : Math.PI - clamp(Math.PI - (a < 0 ? a + Math.PI * 2 : a), -PROFILE_MAX, PROFILE_MAX));

export class Final {
  constructor(rpg) {
    this.rpg = rpg;
    this.st = null; // { id, ph, act, cw, enr, cuUntil, heads: [{ slot, st, fill, until, x }] }
    this.pos = new Map(); // slot → { x, y, a } as drawn (eased toward where the server says)
    this.marks = []; // bite marks on the floor { x, at, end }
    this.lit = new Map(); // slot → rpg.time its eyes lit (an act)
    this.cardAt = -99;
    this.inDen = false;
    this.cwShown = 0;
    this.hurt = new Map(); // slot → rpg.time its ring last filled (a hit: the head flashes)
    this.freed = null; // { at, heads: [{ slot, st, p }] }: its death, heads sinking one by one (FREED_S)
  }
  clear() {
    this.st = null;
    this.freed = null;
    this.hurt.clear();
    this.pos.clear();
    this.marks = [];
    this.lit.clear();
    this.cwShown = 0;
    setLadonLook({ enr: false, ph: 0 });
  }
  // {t:'final', id, ph, act, cw, enr, cu, hd: [[slot, st, fill%, ms, x]]}
  receive(m) {
    const t = this.rpg.time;
    for (const [slot, , fill] of m.hd) { const old = this.st?.heads.find((h) => h.slot === slot); if (old && fill / 100 > old.fill + 0.001) this.hurt.set(slot, t); }
    this.freed = null;
    this.st = { id: m.id, ph: m.ph, act: m.act, cw: m.cw, enr: !!m.enr, cuUntil: m.cu ? t + m.cu / 1000 : 0, heads: m.hd.map(([slot, st, fill, ms, x]) => ({ slot, st, fill: fill / 100, until: t + ms / 1000, x })) };
    if (m.act >= 0) this.lit.set(m.act, this.lit.get(m.act) ?? t);
    for (const s of [...this.lit.keys()]) if (s !== m.act && !this.st.heads.some((h) => h.slot === s && h.st === 'rear')) this.lit.delete(s);
    setLadonLook({ enr: !!m.enr, ph: m.ph });
  }
  mine(v) {
    return !!this.st && v?.id === this.st.id;
  }
  // the watched slime's x (the focus: the Watch), if any
  watchedX() {
    const b = this.st && this.rpg.party.bosses.get(this.st.id);
    if (!b?.focus || b.until <= this.rpg.time) return undefined;
    const s = this.rpg.slimeOf(b.focus);
    return s ? s.x : undefined;
  }
  coilOn() {
    return !!this.st && this.st.cuUntil > this.rpg.time;
  }

  // ——— which part of boss view v a hit of ours is on ———
  // a hit ahead of (x, feet y) toward dir, reach px out (back px behind), arrow: any arrow reaches any head in range
  // → { slot, x, y, throat } (a head or stump) | { weak, x, y } (the Gaze's shard) | 'body' | null
  reach(v, x, y, dir, reach, back, arrow) {
    const k = MOBS[v.kind], wx = this.watchedX(), coil = this.coilOn(), b = this.rpg.party.bosses.get(v.id), t = this.rpg.time;
    const ahead = (sx, r) => {
      const d = (sx - x) * dir;
      return d >= -back - r && d <= reach + r ? Math.abs(d) : -1;
    };
    if (b?.wk && b.wk.until > t) {
      const s = weakOf(k, v.x, v.y, v.facing);
      if (ahead(s.x, s.r) >= 0 && (arrow || Math.abs(y - 20 - s.y) < s.r + HEAD_REACH)) return { weak: true, x: s.x, y: s.y };
    }
    let best = null, bestD = Infinity;
    for (const h of this.st?.heads ?? []) {
      if (!headTarget(h)) continue;
      const s = headSpot(h), d = ahead(s.x, s.r);
      const far = arrow || (h.st === 'stump' && this.rpg.aimMagic); // (a spell or bolt reaches a stump: the fire answer)
      if (d < 0 || (!far && Math.abs(y - 20 - s.y) > s.r + HEAD_REACH) || d >= bestD) continue;
      [best, bestD] = [{ slot: h.slot, x: s.x, y: s.y, throat: coil && throatOpen(h, wx, x) }, d];
    }
    if (best) return best; // (a head in reach comes first: cutting them is the faster way)
    const bd = ahead(v.x, k.w / 2);
    return bd >= 0 && Math.abs((v.y - k.h / 2) - (y - 20)) <= 40 + k.h / 2 ? 'body' : null;
  }
  // an area hit round (x, feet y), radius r → the same
  reachAround(v, x, y, r) {
    const k = MOBS[v.kind], t = this.rpg.time, b = this.rpg.party.bosses.get(v.id);
    if (b?.wk && b.wk.until > t) {
      const s = weakOf(k, v.x, v.y, v.facing);
      if (Math.abs(s.x - x) < r + s.r && Math.abs(y - 20 - s.y) < s.r + HEAD_REACH) return { weak: true, x: s.x, y: s.y };
    }
    let best = null, bestD = Infinity;
    for (const h of this.st?.heads ?? []) {
      if (!headTarget(h)) continue;
      const s = headSpot(h), d = Math.abs(s.x - x);
      if (d > r + s.r || Math.abs(y - 20 - s.y) > s.r + HEAD_REACH || d >= bestD) continue;
      [best, bestD] = [{ slot: h.slot, x: s.x, y: s.y, throat: this.coilOn() && throatOpen(h, this.watchedX(), x) }, d];
    }
    if (best) return best;
    return Math.abs(v.x - x) < r + k.w / 2 ? 'body' : null;
  }

  // ——— its events → true if handled ———
  event(m, pan, me) {
    const r = this.rpg, t = r.time;
    if (m.a === 'die') {
      // freed: keep where every head was, to sink them one by one (the first head last), eyes closing
      const heads = this.st && m.id === this.st.id ? this.st.heads.map((h) => ({ slot: h.slot, st: h.st, p: { ...(this.pos.get(h.slot) ?? this.where(h, t, undefined, false)) } })) : null;
      this.clear();
      if (heads) this.freed = { at: t, heads };
      return false; // (the usual death runs too)
    }
    if (m.a === 'watch') {
      audio.sfx('bossWarn', { pan, vol: m.to === r.myId ? 0.7 : 0.35 });
      this.watchAt = t;
    } else if (m.a === 'bite') {
      this.marks.push({ x: m.tx, at: t, end: t + m.dur, slot: m.slot, from: headSpot({ slot: m.slot, st: 'rear' }) });
      this.lit.set(m.slot, t);
      audio.sfx('bossWarn', { pan, vol: 0.5 });
    } else if (m.a === 'biteHit') {
      this.marks = this.marks.filter((q) => q.x !== m.tx);
      this.lit.delete(m.slot);
      r.bossFx.spawn('shockwave', { x: m.tx, y: FIN_FLOOR, radius: BITE_R + 16, theme: 'hydra' });
      audio.sfx('bossSlam', { pan, vol: 0.8 });
      // on the floor at the mark, or anywhere along the head's way down to it (an arch in its path too): it got us
      if (me && ((me.y > FIN_FLOOR - 50 && Math.abs(me.x - m.tx) < BITE_R) || onBitePath(m.slot, m.tx, me.x, me.y))) r.ouchNext = { mob: m.id, kind: 'bite', mx: m.tx };
    } else if (m.a === 'coil') {
      audio.sfx('phaseOut', { pan, vol: 0.5 });
    } else if (m.a === 'coilStep') {
      audio.sfx(m.dir > 0 ? 'bossRoar' : 'shellBlock', { pan, vol: 0.4 });
    } else if (m.a === 'headFall') {
      r.fx.spawn('shatter', { x: m.hx, y: m.hy, r: 46 });
      r.pop(m.hx, m.hy - 40, 'CUT!', '#d8ffb0', 22);
      audio.sfx('eggBreak', { pan });
    } else if (m.a === 'regrow') {
      const s = LADON_SLOTS[m.slot];
      if (s) r.bossFx.spawn('summon', { x: s.x, y: s.y + 30, theme: 'hydra' });
      audio.sfx('summon', { pan, vol: 0.6 });
    } else if (m.a === 'seal') {
      const s = headSpot({ slot: m.slot, st: 'sealed' });
      r.fx.spawn('nova', { x: s.x, y: s.y + 20, radius: 40, tint: 'fire' });
      r.pop(s.x, s.y - 34, 'SEALED', '#ffd2a0', 18);
      audio.sfx('fireball', { pan, vol: 0.6 });
    } else if (m.a === 'gaze') {
      this.lit.set(0, t);
      audio.sfx('ultWarn', { vol: 0.5 });
    } else if (m.a === 'finalRage') {
      r.bossFx.spawn('roar', { x: FIN_W / 2, y: 200, theme: 'hydra' });
      audio.sfx('bossRoar', { pan });
      r.flash = Math.max(r.flash ?? 0, 0.8);
    } else return false;
    return true;
  }
  // its ultimates going off (from Rpg.newUlt) → true if one of its own: Hundred Heads (stand in a gap) and Strangle
  // (be on the high arch)
  ult(m, me) {
    if (m.kind === 'heads') {
      if (!(m.gaps ?? []).some(([a, b]) => me.x >= a && me.x <= b)) this.rpg.ouchNext = { mob: m.id, kind: 'ult', mx: me.x - 1, noDodge: true };
      audio.sfx('thornRain');
      return true;
    }
    if (m.kind === 'strangle') {
      const p = LADON_PLATFORMS[LADON_HIGH];
      const safe = me.onPlat && me.grounded && Math.abs(me.y - p.y) < 1 && me.x >= p.x - 16 && me.x <= p.x + p.w + 16;
      if (!safe) this.rpg.ouchNext = { mob: m.id, kind: 'ult', mx: me.x - 1, noDodge: true };
      audio.sfx('magmaRise');
      return true;
    }
    return false;
  }
  // a hazard of its own on us this step → an ouch or null: the coils (a wall of necks: they hurt, they never block)
  hits(me) {
    if (!this.st || this.rpg.room !== LADON_DEN) return null;
    if (inCoils(this.cwShown - 6, me.x)) return { mob: this.st.id, kind: 'coil', mx: me.x < FIN_W / 2 ? 0 : FIN_W };
    return null;
  }

  update(dt) {
    const r = this.rpg, t = r.time;
    const inDen = r.room === LADON_DEN;
    if (inDen && !this.inDen) this.cardAt = t;
    this.inDen = inDen;
    // a briarling that springs up while we watch (where a head fell) unfolds out of its seed (src/sunkenroad-art.js)
    if (inDen) for (const v of r.views.values()) if (v.kind === 'briarling' && v.sprout === undefined) v.sprout = !!this.st && v.t < 0.1;
    if (!this.st) return;
    this.cwShown += (this.st.cw - this.cwShown) * Math.min(1, dt * 4);
    this.marks = this.marks.filter((q) => t < q.end + 0.3);
    const wx = this.watchedX(), coil = this.coilOn();
    for (const h of this.st.heads) {
      const to = this.where(h, t, wx, coil), p = this.pos.get(h.slot);
      if (!p) this.pos.set(h.slot, { ...to });
      else {
        const k = Math.min(1, dt * (h.st === 'bite' ? 22 : h.st === 'rear' ? 5 : 3));
        p.x += (to.x - p.x) * k;
        p.y += (to.y - p.y) * k;
        p.a += ((((to.a - p.a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI) * k; // (the short way round)
      }
    }
  }
  // where head h is drawn and where its snout points
  where(h, t, wx, coil) {
    const s = LADON_SLOTS[h.slot], sw = Math.sin(t * 1.3 + h.slot * 1.7) * 6;
    const spot = headSpot(h);
    if (h.st === 'bite') return { x: h.x - 12, y: FIN_FLOOR - 58, a: Math.PI / 2 - 0.5 }; // (its snout buried in the road)
    if (h.st === 'gaze') return { x: spot.x, y: spot.y, a: wx !== undefined && wx < spot.x ? Math.PI : 0 };
    if (isStump(h.st)) return { x: spot.x, y: spot.y, a: Math.atan2(s.y - s.ry, s.x - s.rx) };
    if (h.st === 'rear') return { x: spot.x, y: spot.y, a: Math.atan2(FIN_FLOOR - spot.y, h.x - spot.x) };
    const tx = coil && wx !== undefined ? wx : FIN_W / 2, ty = coil ? FIN_FLOOR - 30 : FIN_FLOOR;
    return { x: spot.x + sw, y: spot.y + sw * 0.5, a: profile(Math.atan2(ty - spot.y, tx - spot.x), tx - spot.x) };
  }

  // ——— drawing, in world space (after the boss's body, before the slimes) ———
  // a head's neck: from its root in a wall or the roof to just behind the skull (thick as a trunk; the first's thicker)
  neck(ctx, s, p, slot, stump) {
    const big = slot === 0, w = big ? NECK_W * 1.6 : NECK_W, back = big ? 64 : 34;
    const mx = (s.rx + p.x) / 2, my = Math.max(s.ry, p.y) - (stump ? 10 : -50);
    cane(ctx, s.rx, s.ry, mx, my, p.x - Math.cos(p.a) * back, p.y - Math.sin(p.a) * back, w, slot);
  }
  head(ctx, p, slot, lit, t, o) {
    const flip = Math.cos(p.a) < 0; // (keep the skull upright whichever way it faces)
    ctx.save();
    ctx.translate(p.x, p.y);
    if (flip) ctx.scale(1, -1);
    drawHead(ctx, 0, 0, flip ? -p.a : p.a, slot === 0 ? HEAD_S * 2 : HEAD_S, lit, t, { first: slot === 0, ...o });
    ctx.restore();
  }
  draw(ctx) {
    const r = this.rpg, st = this.st, t = r.time;
    if (r.room === LADON_DEN) drawHighArch(ctx);
    if (this.freed && r.room === LADON_DEN) return this.drawFreed(ctx, t);
    if (!st || r.room !== LADON_DEN || !r.views.get(st.id)) return;
    const enr = st.enr, coil = this.coilOn(), wx = this.watchedX();
    // the bite marks
    for (const q of this.marks) {
      const k = clamp((t - q.at) / Math.max(0.1, q.end - q.at), 0, 1), pulse = 0.5 + 0.5 * Math.sin(t * (8 + 14 * k));
      ctx.fillStyle = `rgba(255,90,100,${0.18 + 0.25 * k})`;
      ctx.beginPath();
      ctx.ellipse(q.x, FIN_FLOOR + 2, BITE_R, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,120,120,${0.5 + 0.4 * pulse})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      // the head's way down: a band from where it rears to the mark (it hits everything on it)
      if (q.from) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = `rgba(255,90,100,${0.08 + 0.14 * k})`;
        ctx.lineWidth = BITE_PATH_R * 2;
        ctx.beginPath();
        ctx.moveTo(q.from.x, q.from.y);
        ctx.lineTo(q.x, FIN_FLOOR - 30);
        ctx.stroke();
        ctx.setLineDash([10, 12]);
        ctx.lineDashOffset = -t * 60;
        ctx.strokeStyle = `rgba(255,140,140,${0.3 + 0.4 * pulse})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
    }
    // the first head, until it comes out: a pair of eyes in the dark over the body (a glint of the shard above them)
    const first = st.heads.find((h) => h.slot === 0);
    if (first?.st === 'eyes') drawEyes(ctx, LADON_SLOTS[0].x, EYES_Y, clamp(0.4 + 0.6 * Math.min(1, (t - (this.watchAt ?? -9)) / 0.6), 0, 1), 1.3, t, enr, true);
    // the necks, then the heads, then their rings (back to front: the roof's first)
    const list = st.heads.filter((h) => h.st !== 'eyes').sort((a, b) => LADON_SLOTS[a.slot].y - LADON_SLOTS[b.slot].y);
    for (const h of list) this.neck(ctx, LADON_SLOTS[h.slot], this.pos.get(h.slot) ?? this.where(h, t, wx, coil), h.slot, isStump(h.st));
    for (const h of list) {
      const p = this.pos.get(h.slot) ?? this.where(h, t, wx, coil);
      if (isStump(h.st)) {
        const left = h.until - t, grow = h.st === 'stump' ? clamp(1 - left / SWELL_S, 0, 1) : 0;
        drawStump(ctx, p.x, p.y, p.a, h.st, grow, t);
        continue;
      }
      // the acting head's eyes light first (its move's tell), then its jaw opens
      const litAt = this.lit.get(h.slot), acting = h.st === 'rear' || h.st === 'gaze' || st.act === h.slot;
      const lit = acting ? 1 : litAt !== undefined ? clamp(1 - (t - litAt) / 0.8, 0, 1) : 0.15;
      const throat = coil && h.st === 'up' && h.slot !== 0 ? 1 : 0;
      const jaw = h.st === 'bite' ? 0.35 : h.st === 'rear' ? 0.9 : throat ? 0.55 : acting ? 0.4 + 0.2 * Math.sin(t * 6) : 0.08 + 0.06 * Math.sin(t * 1.4 + h.slot);
      const hurt = clamp(1 - (t - (this.hurt.get(h.slot) ?? -9)) / HURT_S, 0, 1);
      this.head(ctx, p, h.slot, lit, t, { throat, enr, jaw, hurt });
    }
    for (const h of list) {
      if (!headTarget(h) || isStump(h.st)) continue;
      const s = headSpot(h);
      if (h.fill > 0.005 || h.st === 'bite') drawRing(ctx, s.x, s.y, HEAD_R, h.fill, t, coil);
    }
    // the coils (phase 3 on), over everything at their ends
    if (this.cwShown > 4) for (const side of [-1, 1]) drawCoilWall(ctx, side, this.cwShown, t, enr);
    // the Watch's eyes over a Coil: where the heads are turned
    if (coil && wx !== undefined) glow(ctx, wx, FIN_FLOOR - 30, 60, 30, '255,120,110', 0.25);
  }
  // freed: the side heads sink one by one, their eyes closing; the first head comes down last, lays its brow on the road
  // and closes its eyes for the first time
  drawFreed(ctx, t) {
    const f = this.freed, age = t - f.at;
    if (age > FREED_S) return void (this.freed = null);
    const sides = f.heads.filter((h) => h.slot !== 0), first = f.heads.find((h) => h.slot === 0);
    const fade = clamp((FREED_S - age) / 1.5, 0, 1);
    ctx.save();
    ctx.globalAlpha = fade;
    sides.forEach((h, i) => {
      const k = clamp((age - 0.6 - i * FREED_GAP) / 1.6, 0, 1), e = k * k * (3 - 2 * k);
      if (k >= 1) return;
      const p = { x: h.p.x, y: h.p.y + e * 300, a: h.p.a + (Math.PI / 2 - h.p.a) * e * 0.5 };
      ctx.save();
      ctx.globalAlpha = fade * (1 - e);
      this.neck(ctx, LADON_SLOTS[h.slot], p, h.slot, isStump(h.st));
      if (isStump(h.st)) drawStump(ctx, p.x, p.y, p.a, h.st, 0, t);
      else this.head(ctx, p, h.slot, k > 0 ? 0 : 0.5, t, { shut: k > 0.05, jaw: 0 });
      ctx.restore();
    });
    // the first head, last: down to the road, then its eyes close
    const t0 = 0.6 + sides.length * FREED_GAP, k = clamp((age - t0) / 2.2, 0, 1), e = k * k * (3 - 2 * k);
    const from = first && first.st !== 'eyes' ? first.p : { x: LADON_SLOTS[0].x, y: EYES_Y, a: Math.PI / 2 };
    if (first && first.st === 'eyes' && k <= 0) drawEyes(ctx, from.x, from.y, 1, 1.3, t, false, true);
    else {
      const p = { x: from.x + (LADON_SLOTS[0].x + 70 - from.x) * e, y: from.y + (FIN_FLOOR - 40 - from.y) * e, a: from.a + (0.12 - from.a) * e };
      ctx.save();
      ctx.globalAlpha = fade * (first?.st === 'eyes' ? clamp(k * 3, 0, 1) : 1);
      this.neck(ctx, LADON_SLOTS[0], p, 0, false);
      this.head(ctx, p, 0, k < 1 ? 0.6 : 0, t, { shut: age > t0 + 3, jaw: 0 });
      ctx.restore();
    }
    ctx.restore();
  }

  // ——— the title card, over the HUD for CARD_S s on walking in (letterbox bars; you can move all the while) ———
  drawHud(ctx, H) {
    const r = this.rpg, age = r.time - this.cardAt;
    if (r.room !== LADON_DEN || age < 0 || age > CARD_S) return;
    const k = clamp(Math.min(age / 0.6, (CARD_S - age) / 0.8), 0, 1), bar = 64 * k;
    ctx.save();
    ctx.fillStyle = 'rgba(6,5,8,0.92)';
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);
    ctx.globalAlpha = clamp((age - 0.4) / 0.6, 0, 1) * clamp((CARD_S - age) / 0.8, 0, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const name = MOBS.ladon.name.toUpperCase(), y = H * 0.36;
    ctx.font = `700 46px ${FONT}`;
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10,14,8,0.9)';
    ctx.strokeText(name, W / 2, y);
    ctx.fillStyle = '#f4f8ec';
    ctx.fillText(name, W / 2, y);
    ctx.font = `700 20px ${FONT}`;
    ctx.lineWidth = 6;
    ctx.strokeText(finalTag(GREEN_TOP), W / 2, y + 44);
    ctx.fillStyle = '#c8f0a0';
    ctx.fillText(finalTag(GREEN_TOP), W / 2, y + 44);
    ctx.restore();
  }
}
