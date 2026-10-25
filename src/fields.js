// Docs: docs/combat/skills.md
// SP1's fields as everyone in the room sees them (the server runs them: server/rpg.js fieldTick). {t:'fields'} carries
// the room's whole list whenever it changes (and on walking in); their hits come as {t:'fieldhit'} and show like
// anyone's (src/rpg.js othersHits). Art: soft and pastel like the rest, cheap on purpose (docs/performance.md): one
// small gradient per field, flat shapes, a handful of particles worked out from the clock (no state to keep).
// A strip is a glowing band along the floor with a haze rising off it; a round one an ellipse on the floor under a
// faint dome. Each look has its own colours and bits: fire (flame tongues and embers), frost (flakes and floor
// crystals), holy (rising motes and rays), poison (bubbles), plain (sparkles). SP2's Cyclone is a `follow` field drawn
// round its caster wherever it goes, in the 'blade' look: no floor glow, a whirl of steel crescents. SP4's Radiance is
// one too, in the 'radiance' look: soft golden rays turning round the Cleric, a ring of light on the floor, motes.
import { TAU, clamp } from './util.js';
import { FIELD_LOOKS, FIELD_TALL } from './shared/skills.js';

const LOOK = {
  // [glow rgb, edge colour, particle colour]
  plain: ['200,184,255', '#a993e8', '#f2ecff'],
  fire: ['255,150,90', '#f07a4a', '#ffd27a'],
  frost: ['170,222,255', '#7cbde6', '#ffffff'],
  holy: ['255,228,140', '#e8b84a', '#fff6c8'],
  poison: ['168,222,112', '#78b84a', '#e4ffc0'],
  blade: ['255,190,170', '#e0806a', '#ffffff'],
  radiance: ['255,236,160', '#f0c860', '#fffbe6'],
};

export class Fields {
  constructor(rpg) {
    this.rpg = rpg;
    this.list = new Map(); // id → { id, skill, owner, x, y, r, round, until, look, born }
    this.room = null; // the room they're in (the list can arrive just before we've switched rooms ourselves)
  }
  // we're in `room` now: the old room's fields go
  clear(room) {
    if (room !== this.room) this.list.clear();
  }
  // {t:'fields', room, f: [[id, skill, owner, x, y, r, round, msLeft, look, follow]]}: the room's fields now
  receive(m) {
    const t = this.rpg.time, seen = new Set();
    if (m.room !== this.room) this.list.clear();
    this.room = m.room;
    for (const [id, skill, owner, x, y, r, round, ms, look, follow] of m.f ?? []) {
      seen.add(id);
      const f = this.list.get(id);
      const until = t + ms / 1000;
      if (f) f.until = until;
      else this.list.set(id, { id, skill, owner, x, y, r, round: !!round, until, look: FIELD_LOOKS[look] ?? 'plain', born: t, seed: (id * 7.31) % 10, follow: !!follow });
    }
    for (const [id, f] of this.list) if (!seen.has(id)) f.until = Math.min(f.until, t); // (gone: fade out)
  }
  update() {
    const t = this.rpg.time;
    for (const [id, f] of this.list) if (t - f.until > 0.5) this.list.delete(id);
  }
  // under the mobs and slimes
  draw(ctx) {
    const t = this.rpg.time;
    if (this.room !== this.rpg.room) return;
    for (const f of this.list.values()) {
      const a = clamp(Math.min((t - f.born) / 0.3, (f.until - t + 0.5) / 0.5), 0, 1);
      if (a <= 0) continue;
      if (f.follow) { // (Cyclone: round its caster, wherever it is now)
        const s = this.rpg.slimeOf(f.owner);
        if (s) [f.x, f.y] = [s.x, s.y];
      }
      ctx.save();
      ctx.globalAlpha = a;
      if (f.look === 'blade') whirl(ctx, f, t);
      else if (f.look === 'radiance') shine(ctx, f, t);
      else if (f.round) round(ctx, f, t);
      else strip(ctx, f, t);
      ctx.restore();
    }
  }
}

// Cyclone (SP2): a whirl of coral and white crescents round the slime, tilted like a spinning top, sparks flung off
function whirl(ctx, f, t) {
  const R = f.r, y = f.y - 20;
  ctx.save();
  ctx.translate(f.x, y);
  ctx.scale(1, 0.42);
  ctx.fillStyle = 'rgba(255,200,180,0.16)';
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    const r = R * (0.45 + i * 0.17), a = t * (16 - i * 2) + i * 1.7;
    ctx.strokeStyle = i % 2 ? 'rgba(255,154,126,0.85)' : 'rgba(255,255,255,0.95)';
    ctx.lineWidth = (6 - i) / 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, a, a + 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r, a + Math.PI, a + Math.PI + 1.4);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#fff4e2';
  for (let i = 0; i < 6; i++) {
    const a = t * 9 + i * 1.05 + f.seed, d = R * (0.7 + 0.3 * ((t * 3 + i * 0.37) % 1));
    ctx.beginPath();
    ctx.arc(f.x + Math.cos(a) * d, y + Math.sin(a) * d * 0.42, 2.2, 0, TAU);
    ctx.fill();
  }
}

// Radiance (SP4): a ring of light on the floor round the Cleric, soft golden rays turning out from its middle, motes
// drifting up (cheap: one small gradient, flat wedges)
function shine(ctx, f, t) {
  const R = f.r, cx = f.x, cy = f.y - 22, pulse = 0.5 + 0.5 * Math.sin(t * 5);
  const g = ctx.createRadialGradient(cx, cy, 6, cx, cy, R);
  g.addColorStop(0, 'rgba(255,246,200,0.42)');
  g.addColorStop(1, 'rgba(255,236,160,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,242,190,0.22)';
  for (let i = 0; i < 8; i++) { // the rays, slowly turning
    const a = t * 0.8 + (i / 8) * TAU, w = 0.11;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18);
    ctx.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R);
    ctx.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = `rgba(240,200,96,${0.5 + 0.3 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, f.y - 2, R * (0.92 + 0.05 * pulse), Math.max(8, R * 0.18), 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#fffbe6';
  for (let i = 0; i < 7; i++) {
    const k = (t * 0.7 + i * 0.143 + f.seed) % 1, a = i * 2.3 + f.seed;
    sparkle(ctx, cx + Math.cos(a) * R * 0.75, f.y - 6 - k * 70, 2.5 + (1 - k) * 2);
  }
}

// a band along the floor, a haze rising off it, and the look's bits
function strip(ctx, f, t) {
  const [rgb, edge, dot] = LOOK[f.look] ?? LOOK.plain, x0 = f.x - f.r, w = f.r * 2, y = f.y;
  const g = ctx.createLinearGradient(0, y - FIELD_TALL, 0, y);
  g.addColorStop(0, `rgba(${rgb},0)`);
  g.addColorStop(1, `rgba(${rgb},0.42)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x0, y - FIELD_TALL, w, FIELD_TALL, 14);
  ctx.fill();
  ctx.fillStyle = `rgba(${rgb},0.55)`;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x0, y - 5, w, 10, 5);
  ctx.fill();
  ctx.stroke();
  bits(ctx, f, t, x0, w, y, dot, edge);
}

// an ellipse on the floor, a faint dome over it, and the look's bits inside
function round(ctx, f, t) {
  const [rgb, edge, dot] = LOOK[f.look] ?? LOOK.plain, y = f.y, ry = Math.max(10, f.r * 0.22);
  const g = ctx.createRadialGradient(f.x, y, 0, f.x, y, f.r);
  g.addColorStop(0, `rgba(${rgb},0.38)`);
  g.addColorStop(1, `rgba(${rgb},0.08)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(f.x, y, f.r, Math.PI, TAU);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${rgb},0.6)`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.lineDashOffset = -t * 20;
  ctx.beginPath();
  ctx.arc(f.x, y, f.r, Math.PI, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = `rgba(${rgb},0.5)`;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(f.x, y, f.r, ry, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  bits(ctx, f, t, f.x - f.r * 0.85, f.r * 1.7, y, dot, edge);
}

// the look's particles across [x0, x0 + w] above the floor at y, from the clock alone
function bits(ctx, f, t, x0, w, y, dot, edge) {
  const n = Math.max(4, Math.round(w / 26)), s = f.seed;
  for (let i = 0; i < n; i++) {
    const u = ((i + 0.5) / n + Math.sin(i * 12.9 + s) * 0.08 + 1) % 1, px = x0 + u * w;
    const life = 1.2 + (i % 3) * 0.3, k = ((t + i * 0.37 + s) % life) / life; // 0 → 1, over and over
    if (f.look === 'fire') {
      // a flame tongue licking up, and an ember rising off it
      const h = 14 + 10 * Math.sin(t * 9 + i * 2.1);
      ctx.fillStyle = i % 2 ? '#ffb064' : '#ff8a52';
      ctx.beginPath();
      ctx.moveTo(px - 6, y);
      ctx.quadraticCurveTo(px - 5, y - h * 0.6, px + Math.sin(t * 7 + i) * 3, y - h);
      ctx.quadraticCurveTo(px + 5, y - h * 0.6, px + 6, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = dot;
      ctx.globalAlpha *= 1 - k * 0.8;
      ctx.beginPath();
      ctx.arc(px + Math.sin(k * 6 + i) * 6, y - 10 - k * (FIELD_TALL - 10), 2, 0, TAU);
      ctx.fill();
      ctx.globalAlpha /= 1 - k * 0.8;
    } else if (f.look === 'frost') {
      // a flake drifting down, and a little crystal standing on the floor
      flake(ctx, px + Math.sin(k * 5 + i) * 8, y - FIELD_TALL + k * (FIELD_TALL - 6), 3.5, dot, edge);
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(230,246,255,0.9)';
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px - 4, y);
        ctx.lineTo(px, y - 11);
        ctx.lineTo(px + 4, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (f.look === 'holy') {
      // a soft ray going up, a mote rising
      if (i % 2 === 0) {
        ctx.fillStyle = `rgba(255,240,180,${0.18 + 0.12 * Math.sin(t * 3 + i)})`;
        ctx.fillRect(px - 3, y - FIELD_TALL * 0.9, 6, FIELD_TALL * 0.9);
      }
      ctx.fillStyle = dot;
      sparkle(ctx, px, y - k * FIELD_TALL, 3 + (1 - k) * 2);
    } else if (f.look === 'poison') {
      ctx.strokeStyle = edge;
      ctx.fillStyle = 'rgba(214,255,170,0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(px, y - 4 - k * 40, 2.5 + k * 3, 0, TAU);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = dot;
      sparkle(ctx, px, y - 8 - k * FIELD_TALL * 0.7, 2.5);
    }
  }
}

function flake(ctx, x, y, r, fill, edge) {
  ctx.strokeStyle = fill;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.stroke();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

// a four-point twinkle
function sparkle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}
