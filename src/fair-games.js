// Docs: docs/places/fair.md
// The Gathering Fair's booth games, played on a card the camera zooms into (src/fair.js runs the round). Each game is
// built from the round's seed with the same plan the server uses to cap the score (src/shared/fair.js), and works in
// its own card units (GALLERY_W × GALLERY_H). Input arrives already in card units: aim (pointer moved), tap (pointer down
// or the fire key), and held directions (the walk / jump / down keys).
//   Pop Gallery: tin targets slide along three rails; aim and pop them. A short reload between shots.
//   Bonk-a-Knotmole: moles pop out of a 3×3 field; tap one (or move the mallet with the arrows and bonk).
import { TAU, circle, ellipse, clamp } from './util.js';
import { text } from './village.js';
import { galleryPlan, galleryAt, bonkPlan, GALLERY_W, GALLERY_H, RAILS } from './shared/fair.js';

const RELOAD = 0.22; // s between Pop Gallery shots
const CROSS_V = 520; // crosshair speed on keys, px/s
const TIN = ['#ffd36e', '#9fe3ff', '#ff9fb8', '#b9e58c', '#d6b4ff', '#ffb38a'];

// a burst of little stars where something was hit (pts: the score it gave, shown floating up)
class Pops {
  constructor() {
    this.list = [];
  }
  add(x, y, pts) {
    this.list.push({ x, y, pts, at: 0 });
  }
  update(dt) {
    for (const p of this.list) p.at += dt;
    this.list = this.list.filter((p) => p.at < 0.8);
  }
  draw(ctx) {
    for (const p of this.list) {
      const k = p.at / 0.8;
      ctx.globalAlpha = 1 - k;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        ctx.fillStyle = p.pts < 0 ? '#c9c9d6' : '#ffe28a';
        circle(ctx, p.x + Math.cos(a) * k * 34, p.y + Math.sin(a) * k * 34, 3 * (1 - k) + 1);
      }
      text(ctx, p.pts > 0 ? `+${p.pts}` : String(p.pts), p.x, p.y - 20 - k * 30, 18, p.pts < 0 ? '#d9465f' : '#ffffff');
      ctx.globalAlpha = 1;
    }
  }
}

export class Gallery {
  constructor(seed) {
    this.plan = galleryPlan(seed);
    this.hit = new Set();
    this.cross = { x: GALLERY_W / 2, y: GALLERY_H / 2 };
    this.cool = 0;
    this.pops = new Pops();
    this.kick = 0;
  }
  update(dt, t, dir) {
    this.cool = Math.max(0, this.cool - dt);
    this.kick = Math.max(0, this.kick - dt * 6);
    this.cross.x = clamp(this.cross.x + dir.x * CROSS_V * dt, 0, GALLERY_W);
    this.cross.y = clamp(this.cross.y + dir.y * CROSS_V * dt, 0, GALLERY_H);
    this.pops.update(dt);
  }
  aim(x, y) {
    this.cross.x = clamp(x, 0, GALLERY_W);
    this.cross.y = clamp(y, 0, GALLERY_H);
  }
  // fire at (x, y) (the crosshair if not given) at round time t: → points scored (0 for a miss)
  tap(t, x = this.cross.x, y = this.cross.y) {
    if (this.cool > 0) return null;
    this.aim(x, y);
    this.cool = RELOAD;
    this.kick = 1;
    let best = -1, bestD = Infinity;
    this.plan.forEach((g, i) => {
      if (this.hit.has(i)) return;
      const at = galleryAt(g, t);
      if (!at) return;
      const d = Math.hypot(at.x - x, at.y - y);
      if (d < g.r && d < bestD) [best, bestD] = [i, d];
    });
    if (best < 0) return 0;
    this.hit.add(best);
    const g = this.plan[best];
    this.pops.add(x, y, g.pts);
    return g.pts;
  }
  draw(ctx, t) {
    // the back of the stall: a starry blue board, the rails, a wavy tin sea at the bottom
    ctx.fillStyle = '#3f4f8a';
    ctx.fillRect(0, 0, GALLERY_W, GALLERY_H);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 30; i++) circle(ctx, (i * 97) % GALLERY_W, (i * 53) % 90 + 10, 2);
    for (const y of RAILS) {
      ctx.fillStyle = '#c9c9d6';
      ctx.fillRect(0, y + 32, GALLERY_W, 5);
      ctx.fillStyle = '#9a9ab0';
      ctx.fillRect(0, y + 37, GALLERY_W, 2);
    }
    this.plan.forEach((g, i) => {
      if (this.hit.has(i)) return;
      const at = galleryAt(g, t);
      if (at) target(ctx, g, at.x, at.y, t);
    });
    ctx.fillStyle = '#5b9bd5';
    ctx.beginPath();
    ctx.moveTo(0, GALLERY_H);
    for (let x = 0; x <= GALLERY_W; x += 20) ctx.lineTo(x, GALLERY_H - 26 + Math.sin(x * 0.05 + t * 3) * 6);
    ctx.lineTo(GALLERY_W, GALLERY_H);
    ctx.fill();
    this.pops.draw(ctx);
    // the crosshair (it jumps a little when you fire)
    const { x, y } = this.cross, r = 16 + this.kick * 6;
    ctx.strokeStyle = this.cool > 0 ? 'rgba(255,255,255,0.5)' : '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.moveTo(x - r - 8, y);
    ctx.lineTo(x - r + 6, y);
    ctx.moveTo(x + r - 6, y);
    ctx.lineTo(x + r + 8, y);
    ctx.moveTo(x, y - r - 8);
    ctx.lineTo(x, y - r + 6);
    ctx.moveTo(x, y + r - 6);
    ctx.lineTo(x, y + r + 8);
    ctx.stroke();
    ctx.fillStyle = '#ff6f91';
    circle(ctx, x, y, 2.5);
  }
}

// one tin target on its stick: a mob cut-out, a gold star, or a cardboard Elder Mochi (don't)
function target(ctx, g, x, y, t) {
  ctx.fillStyle = '#9a9ab0';
  ctx.fillRect(x - 2, y + 6, 4, 28);
  if (g.kind === 'star') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 3);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? g.r * 0.45 : g.r;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffd34e';
    ctx.fill();
    ctx.strokeStyle = '#d9a12a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (g.kind === 'mochi') {
    // Elder Mochi in cardboard: green, a white beard, and a little sign
    ctx.fillStyle = '#b9e58c';
    ctx.beginPath();
    ctx.moveTo(x - 26, y + 6);
    ctx.quadraticCurveTo(x - 26, y - 28, x, y - 28);
    ctx.quadraticCurveTo(x + 26, y - 28, x + 26, y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7fa860';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, x, y + 2, 14, 9);
    ctx.fillStyle = '#3a3550';
    circle(ctx, x - 7, y - 10, 2);
    circle(ctx, x + 7, y - 10, 2);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(x - 24, y - 50, 48, 16);
    text(ctx, 'not me!', x, y - 42, 10, '#d9465f');
    return;
  }
  // a tin mob: a round jelly with ears or a cap, by its look
  const c = TIN[g.look % TIN.length];
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x - g.r, y + 6);
  ctx.quadraticCurveTo(x - g.r, y - g.r, x, y - g.r);
  ctx.quadraticCurveTo(x + g.r, y - g.r, x + g.r, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,50,80,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (g.look % 3 === 0) {
    ctx.fillStyle = '#6cc96a'; // a sprout
    ellipse(ctx, x + 6, y - g.r - 6, 8, 4, -0.4);
  } else if (g.look % 3 === 1) {
    ctx.fillStyle = '#e8546a'; // a mushroom cap
    ellipse(ctx, x, y - g.r + 4, g.r * 0.9, 9);
    ctx.fillStyle = '#ffffff';
    circle(ctx, x - 8, y - g.r + 2, 3);
    circle(ctx, x + 7, y - g.r + 4, 2.5);
  } else {
    ctx.fillStyle = c; // ears
    circle(ctx, x - 14, y - g.r + 2, 7);
    circle(ctx, x + 14, y - g.r + 2, 7);
  }
  ctx.fillStyle = '#3a3550';
  circle(ctx, x - 8, y - 6, 3);
  circle(ctx, x + 8, y - 6, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, x - g.r * 0.45, y - g.r * 0.5, 4, 7, -0.5);
}

// ——— Bonk-a-Knotmole ———
const HOLE_X = [180, 360, 540], HOLE_Y = [110, 215, 320];
const holeXY = (i) => ({ x: HOLE_X[i % 3], y: HOLE_Y[Math.floor(i / 3)] });
const UP_T = 0.12; // s to pop up or duck
// how far out of its hole pop p is at time t (0..1), or 0 when it's down
function upness(p, t) {
  const k = t - p.t0;
  if (k < 0 || k > p.dur) return 0;
  return Math.min(1, k / UP_T, (p.dur - k) / UP_T);
}

export class Bonk {
  constructor(seed) {
    this.plan = bonkPlan(seed);
    this.bonked = new Map(); // pop index → when it was bonked
    this.cursor = 4;
    this.swing = 0;
    this.swingAt = 4;
    this.pops = new Pops();
    this.moved = 0;
  }
  update(dt, t, dir) {
    this.swing = Math.max(0, this.swing - dt * 5);
    this.pops.update(dt);
    // the arrows step the mallet one hole at a time (held: repeating)
    this.moved -= dt;
    if ((dir.x || dir.y) && this.moved <= 0) {
      const c = clamp((this.cursor % 3) + dir.x, 0, 2), r = clamp(Math.floor(this.cursor / 3) + dir.y, 0, 2);
      this.cursor = r * 3 + c;
      this.moved = 0.16;
    }
    if (!dir.x && !dir.y) this.moved = 0;
  }
  aim(x, y) {
    const i = this.holeNear(x, y);
    if (i >= 0) this.cursor = i;
  }
  holeNear(x, y) {
    let best = -1, bestD = 90;
    for (let i = 0; i < 9; i++) {
      const h = holeXY(i), d = Math.hypot(h.x - x, h.y - 20 - y);
      if (d < bestD) [best, bestD] = [i, d];
    }
    return best;
  }
  // bonk the hole at (x, y) (the mallet's hole if not given), or hole `i`: → points scored
  tap(t, x, y, i) {
    const hole = i ?? (x === undefined ? this.cursor : this.holeNear(x, y));
    if (hole < 0) return 0;
    this.cursor = hole;
    this.swing = 1;
    this.swingAt = hole;
    const k = this.plan.findIndex((p, j) => p.hole === hole && !this.bonked.has(j) && upness(p, t) > 0.3);
    if (k < 0) return 0;
    this.bonked.set(k, t);
    const p = this.plan[k], h = holeXY(hole);
    this.pops.add(h.x, h.y - 40, p.pts);
    return p.pts;
  }
  draw(ctx, t) {
    // a grassy board with a picket fence along the back
    ctx.fillStyle = '#8fd07f';
    ctx.fillRect(0, 0, GALLERY_W, GALLERY_H);
    ctx.fillStyle = '#7fc06f';
    for (let i = 0; i < 40; i++) ellipse(ctx, (i * 131) % GALLERY_W, (i * 71) % GALLERY_H, 18, 5);
    ctx.fillStyle = '#fff4e6';
    for (let x = 10; x < GALLERY_W; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x + 10, 26);
      ctx.lineTo(x + 20, 40);
      ctx.lineTo(x + 20, 60);
      ctx.lineTo(x, 60);
      ctx.fill();
    }
    ctx.fillRect(0, 44, GALLERY_W, 6);
    for (let i = 0; i < 9; i++) {
      const h = holeXY(i);
      ctx.fillStyle = '#5a3f2e';
      ellipse(ctx, h.x, h.y, 52, 16);
      ctx.fillStyle = '#2f2028';
      ellipse(ctx, h.x, h.y + 2, 44, 12);
      // whoever is up in this hole (clipped to the hole's top edge, so they come out of it)
      this.plan.forEach((p, j) => {
        if (p.hole !== i) return;
        let up = upness(p, t);
        const at = this.bonked.get(j);
        if (at !== undefined) up = Math.max(0, up - (t - at) * 6); // bonked: straight back down, dizzy
        if (up <= 0) return;
        ctx.save();
        ctx.beginPath();
        ctx.rect(h.x - 60, h.y - 120, 120, 120);
        ctx.clip();
        critter(ctx, p.kind, h.x, h.y + 6 - up * 52, t, at !== undefined);
        ctx.restore();
      });
      ctx.fillStyle = '#5a3f2e';
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 2, 46, 12, 0, 0, Math.PI);
      ctx.fill();
    }
    this.pops.draw(ctx);
    // the mallet over the hole it's on (swung down after a bonk)
    const h = holeXY(this.swing > 0 ? this.swingAt : this.cursor);
    ctx.save();
    ctx.translate(h.x + 36, h.y - 70);
    ctx.rotate(-0.5 + this.swing * 0.9);
    ctx.fillStyle = '#c99b6b';
    ctx.fillRect(-4, -6, 8, 60);
    ctx.fillStyle = '#e8546a';
    ctx.beginPath();
    ctx.roundRect(-30, -24, 60, 30, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-24, -20, 48, 6);
    ctx.restore();
  }
}

// a Knotmole (a root knot on its head), a golden one, or a Mini Turnipop (never bonk her)
function critter(ctx, kind, x, y, t, dizzy) {
  if (kind === 'turnip') {
    ctx.fillStyle = '#f6eefc';
    ellipse(ctx, x, y + 6, 30, 28);
    ctx.fillStyle = '#c47fd6';
    ellipse(ctx, x, y - 12, 26, 12);
    ctx.fillStyle = '#6cc96a';
    for (const a of [-0.5, 0, 0.5]) ellipse(ctx, x + a * 20, y - 32, 6, 14, a);
    ctx.fillStyle = '#3a3550';
    circle(ctx, x - 9, y, 3);
    circle(ctx, x + 9, y, 3);
    ctx.fillStyle = '#ff9fb8';
    ellipse(ctx, x - 16, y + 8, 5, 3);
    ellipse(ctx, x + 16, y + 8, 5, 3);
    return;
  }
  const gold = kind === 'gold';
  ctx.fillStyle = gold ? '#ffcf4e' : '#9c6f4f';
  ellipse(ctx, x, y + 8, 30, 32);
  ctx.fillStyle = gold ? '#fff0b0' : '#d9b08c';
  ellipse(ctx, x, y + 14, 18, 16);
  ctx.fillStyle = '#ff8fa6';
  ellipse(ctx, x, y + 2, 7, 5);
  // the root knot on its head
  ctx.strokeStyle = gold ? '#d9a12a' : '#6b4a2f';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 22);
  ctx.quadraticCurveTo(x + 6, y - 34, x - 2, y - 40);
  ctx.moveTo(x + 2, y - 24);
  ctx.quadraticCurveTo(x + 14, y - 30, x + 12, y - 38);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#2a2030';
  if (dizzy) {
    ctx.strokeStyle = '#2a2030';
    ctx.lineWidth = 2;
    for (const ex of [-11, 11]) {
      ctx.beginPath();
      ctx.moveTo(x + ex - 4, y - 12);
      ctx.lineTo(x + ex + 4, y - 4);
      ctx.moveTo(x + ex + 4, y - 12);
      ctx.lineTo(x + ex - 4, y - 4);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const a = t * 6 + (i * TAU) / 3;
      ctx.fillStyle = '#ffe28a';
      circle(ctx, x + Math.cos(a) * 22, y - 34 + Math.sin(a) * 6, 3);
    }
  } else {
    circle(ctx, x - 11, y - 8, 3.4);
    circle(ctx, x + 11, y - 8, 3.4);
    ctx.fillStyle = '#ffffff';
    circle(ctx, x - 10, y - 9, 1.2);
    circle(ctx, x + 12, y - 9, 1.2);
  }
  if (gold) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const k = (t * 2) % 1;
    circle(ctx, x - 20 + k * 40, y - 20 + Math.sin(k * 6) * 10, 2);
  }
}

export const GAMES = { gallery: Gallery, bonk: Bonk };
