// Docs: docs/combat/skills.md
// The Cleric's summons as everyone in the room sees them (S3; the server runs them: server/summons.js).
// {t:'summons', s: [[id, what, owner, x, y, hp, maxHp, dir], …]} ~20 times a second; we glide each one to
// its newest spot. Their hits ({t:'sumhit'}) show like anyone's (src/rpg.js othersHits). Art: soft, pastel,
// procedural, like the slimes. Positions: x, y = the feet (the wisp: its own middle).
import { TAU, clamp, circle, ellipse } from './util.js';
import { SKILLS, WISP_R, SERAPH_R } from './shared/skills.js';
import { audio } from './audio.js';

const WHATS = ['spirit', 'wisp', 'totem', 'seraph']; // (server/summons.js SUMMON_WHATS)
const rand = (a, b) => a + Math.random() * (b - a);

export class Summons {
  constructor(rpg) {
    this.rpg = rpg;
    this.list = new Map(); // id → { id, what, owner, x, y, tx, ty, hp, maxHp, dir, t, flash, lunge, born }
    this.puffs = []; // a summon fading or breaking: { x, y, what, at, broke }
  }
  clear() {
    this.list.clear();
    this.puffs = [];
  }
  receive(m, { mine }) {
    const rpg = this.rpg;
    if (m.t === 'summons') {
      const seen = new Set();
      for (const [id, w, owner, x, y, hp, maxHp, dir] of m.s) {
        seen.add(id);
        let s = this.list.get(id);
        if (!s) this.list.set(id, (s = { id, what: WHATS[w], owner, x, y, t: Math.random() * 10, flash: 0, lunge: 0, born: rpg.time }));
        Object.assign(s, { tx: x, ty: y, hp, maxHp, dir });
      }
      for (const id of this.list.keys()) if (!seen.has(id)) this.list.delete(id);
    } else if (m.t === 'sumhit') {
      // a spirit's (or the Seraph's) hits: its lunge, and the numbers on the mobs
      for (const [id, hits] of m.h) {
        const s = this.list.get(id);
        if (s) s.lunge = 1;
        rpg.othersHits(hits, mine?.x ?? s?.x ?? 0);
      }
    } else if (m.t === 'sumhurt') {
      const s = this.list.get(m.id);
      if (!s) return;
      s.flash = 1;
      rpg.pop(s.x, s.y - (s.what === 'seraph' ? 90 : 50), `-${m.dmg}`, '#ff9aa8', 14);
    } else if (m.t === 'sumgone') {
      const s = this.list.get(m.id);
      this.list.delete(m.id);
      this.puffs.push({ x: s?.x ?? m.x, y: s?.y ?? m.y, what: s?.what ?? 'spirit', at: rpg.time, broke: m.how === 'broke' });
      if (m.how === 'broke') audio.sfx('bubblePop', { vol: 0.6 });
    }
  }
  // a summon just called (the caster's skill echo): a burst where it appears
  called(x, y) {
    this.puffs.push({ x, y, what: 'call', at: this.rpg.time });
  }
  update(dt) {
    for (const s of this.list.values()) {
      const k = Math.min(1, dt * 14);
      s.x += (s.tx - s.x) * k;
      s.y += (s.ty - s.y) * k;
      s.t += dt;
      s.flash = Math.max(0, s.flash - dt * 4);
      s.lunge = Math.max(0, s.lunge - dt * 4);
    }
    this.puffs = this.puffs.filter((p) => this.rpg.time - p.at < 0.7);
  }

  // the totems' rings go under everything; the rest over the mobs
  drawGround(ctx) {
    for (const s of this.list.values()) if (s.what === 'totem') totemRing(ctx, s);
  }
  draw(ctx) {
    const time = this.rpg.time;
    for (const s of this.list.values()) {
      ctx.save();
      if (s.what === 'spirit') spirit(ctx, s, 1);
      else if (s.what === 'seraph') seraph(ctx, s);
      else if (s.what === 'wisp') wisp(ctx, s);
      else totem(ctx, s);
      ctx.restore();
      if (s.what !== 'wisp' && s.hp < s.maxHp) hpBar(ctx, s.x - 20, s.y - (s.what === 'seraph' ? 96 : s.what === 'totem' ? 76 : 52), 40, 5, s.hp / s.maxHp);
    }
    for (const p of this.puffs) puff(ctx, p, (time - p.at) / 0.7);
  }
}

function hpBar(ctx, x, y, w, h, f) {
  ctx.fillStyle = 'rgba(40,30,55,0.55)';
  ctx.beginPath();
  ctx.roundRect(x - 1, y - 1, w + 2, h + 2, 3);
  ctx.fill();
  ctx.fillStyle = '#8fe6b8';
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(2, w * clamp(f, 0, 1)), h, 2.5);
  ctx.fill();
}

// a soft glow (a small radial gradient: cheap at this size)
function glow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  circle(ctx, x, y, r);
}

// The Jelly Spirit: a glowing see-through slime ghost, bobbing along with a wispy tail; it leans into each hit
function spirit(ctx, s, scale) {
  const bob = Math.sin(s.t * 5) * 3, lean = s.lunge * 10 * s.dir;
  const x = s.x + lean, y = s.y - 10 + bob;
  glow(ctx, x, y - 14 * scale, 34 * scale, '190,255,225', 0.45);
  ctx.translate(x, y);
  ctx.scale(scale * (1 + Math.sin(s.t * 9) * 0.03), scale * (1 - Math.sin(s.t * 9) * 0.03));
  ctx.globalAlpha = 0.85;
  // the tail: three soft scallops trailing behind
  ctx.fillStyle = 'rgba(200,250,228,0.75)';
  for (let i = 0; i < 3; i++) {
    const tx = -s.dir * (8 + i * 7), ty = 2 + Math.sin(s.t * 7 + i) * 2;
    circle(ctx, tx, ty, 7 - i * 1.6);
  }
  // the body
  const g = ctx.createLinearGradient(0, -30, 0, 4);
  g.addColorStop(0, '#f2fff8');
  g.addColorStop(1, '#a9ecc9');
  ctx.fillStyle = g;
  ctx.strokeStyle = s.flash > 0 ? `rgba(255,120,140,${0.6 + s.flash * 0.4})` : 'rgba(70,150,115,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-17, 2);
  ctx.bezierCurveTo(-19, -18, -10, -30, 0, -30);
  ctx.bezierCurveTo(10, -30, 19, -18, 17, 2);
  ctx.quadraticCurveTo(11, 6, 6, 2);
  ctx.quadraticCurveTo(0, 6, -6, 2);
  ctx.quadraticCurveTo(-11, 6, -17, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ellipse(ctx, -7, -22, 4, 2.2, -0.5);
  // the face, looking where it's going
  const fx = s.dir * 3;
  ctx.fillStyle = '#2f5a48';
  ellipse(ctx, fx - 5, -14, 1.8, 2.6);
  ellipse(ctx, fx + 5, -14, 1.8, 2.6);
  ctx.strokeStyle = '#2f5a48';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(fx, -10, 2.6, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,150,170,0.5)';
  ellipse(ctx, fx - 9, -10, 2.6, 1.5);
  ellipse(ctx, fx + 9, -10, 2.6, 1.5);
}

// The Seraph: a big spirit with soft wings and a golden halo, and a faint ring where it strikes
function seraph(ctx, s) {
  ctx.save();
  ctx.globalAlpha = 0.12 + 0.06 * Math.sin(s.t * 3);
  ctx.strokeStyle = '#fff2b0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y - 4, SERAPH_R, 16, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
  const bob = Math.sin(s.t * 3) * 4, y = s.y - 34 + bob, flap = Math.sin(s.t * 6) * 0.25;
  glow(ctx, s.x, y - 20, 80, '255,245,200', 0.35);
  // wings behind
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(s.x + side * 18, y - 30);
    ctx.rotate(side * (0.5 + flap));
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.strokeStyle = 'rgba(200,180,120,0.6)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(side * (16 + i * 6), -4 + i * 8, 22 - i * 4, 9 - i, side * 0.3, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.save();
  spirit(ctx, { ...s, y: s.y - 24 + bob * 0, t: s.t }, 1.8);
  ctx.restore();
  // the halo
  ctx.strokeStyle = '#ffd96a';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.ellipse(s.x, y - 72, 16, 5, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,250,220,0.8)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

// The Lantern Wisp: a little paper lantern with a face and a flickering flame, trailing motes of light
function wisp(ctx, s) {
  const x = s.x, y = s.y + Math.sin(s.t * 4) * 3, fl = 0.8 + 0.2 * Math.sin(s.t * 23) * Math.sin(s.t * 7);
  // where it heals: a faint ring
  ctx.save();
  ctx.globalAlpha = 0.1 + 0.05 * Math.sin(s.t * 2);
  ctx.fillStyle = '#ffe9a0';
  ctx.beginPath();
  ctx.arc(x, y + 30, WISP_R, 0, TAU);
  ctx.fill();
  ctx.restore();
  glow(ctx, x, y, 34, '255,226,140', 0.5 * fl);
  for (let i = 0; i < 4; i++) {
    const a = s.t * 1.7 + i * 1.6, d = 16 + ((s.t * 20 + i * 9) % 18);
    ctx.fillStyle = `rgba(255,238,170,${0.7 - d / 40})`;
    circle(ctx, x - s.dir * d * 0.8 + Math.cos(a) * 3, y + 6 + Math.sin(a) * 4, 1.8);
  }
  ctx.translate(x, y);
  ctx.rotate(Math.sin(s.t * 2.5) * 0.08);
  ctx.fillStyle = '#8a6a4a'; // the hanger and the caps
  ctx.fillRect(-1, -17, 2, 5);
  ctx.beginPath();
  ctx.roundRect(-6, -13, 12, 3.5, 1.5);
  ctx.roundRect(-6, 10, 12, 3.5, 1.5);
  ctx.fill();
  const g = ctx.createLinearGradient(0, -11, 0, 11);
  g.addColorStop(0, '#fff8d8');
  g.addColorStop(1, '#ffd98a');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#c99a50';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 11, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(201,154,80,0.5)'; // paper ribs
  ctx.lineWidth = 1;
  for (const ry of [-5, 5]) {
    ctx.beginPath();
    ctx.ellipse(0, ry, 9, 1.6, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(255,170,70,${0.55 * fl})`; // the flame inside
  ellipse(ctx, 0, 2, 3.5 * fl, 5 * fl);
  ctx.fillStyle = '#6a4a30';
  ellipse(ctx, -3.5 + s.dir, -2, 1.1, 1.6);
  ellipse(ctx, 3.5 + s.dir, -2, 1.1, 1.6);
}

// The Guardian Totem: a short carved post of three stacked blocks with a glowing green gem on top
function totemRing(ctx, s) {
  const r = SKILLS.guardian_totem.radius, pulse = 0.5 + 0.5 * Math.sin(s.t * 2.4);
  ctx.save();
  ctx.fillStyle = `rgba(120,220,170,${0.08 + 0.04 * pulse})`;
  ctx.strokeStyle = `rgba(90,190,140,${0.35 + 0.2 * pulse})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.lineDashOffset = -s.t * 12;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y - 2, r, 14, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function totem(ctx, s) {
  const x = s.x + (s.flash ? rand(-1.5, 1.5) : 0), y = s.y;
  const blocks = [[0, 22, 18, '#c9a27a'], [-18, 20, 17, '#b88c62'], [-35, 18, 15, '#d4b088']];
  ctx.strokeStyle = s.flash > 0 ? '#e0607a' : '#6a4a32';
  ctx.lineWidth = 2;
  for (const [by, w, h, c] of blocks) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y + by - h, w, h, 5);
    ctx.fill();
    ctx.stroke();
  }
  // a carved face on the middle block, and leaf marks on the bottom one
  ctx.fillStyle = '#5a3c26';
  ellipse(ctx, x - 4, y - 28, 1.6, 2.2);
  ellipse(ctx, x + 4, y - 28, 1.6, 2.2);
  ctx.strokeStyle = '#5a3c26';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(x, y - 25, 3, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(70,140,90,0.8)';
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 6);
  ctx.quadraticCurveTo(x, y - 14, x + 6, y - 6);
  ctx.stroke();
  // the gem
  const gy = y - 60 + Math.sin(s.t * 2) * 1.5;
  glow(ctx, x, gy, 26, '140,255,190', 0.55);
  ctx.fillStyle = '#7ff0b0';
  ctx.strokeStyle = '#2f8a64';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x, gy - 9);
  ctx.lineTo(x + 7, gy);
  ctx.lineTo(x, gy + 9);
  ctx.lineTo(x - 7, gy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ellipse(ctx, x - 2, gy - 3, 1.8, 2.6, 0.4);
}

// fading out (motes rising), breaking (shards and a pop), or appearing (a ring of light)
function puff(ctx, p, k) {
  const a = 1 - k;
  ctx.save();
  if (p.what === 'call') {
    ctx.strokeStyle = `rgba(200,255,225,${a})`;
    ctx.lineWidth = 3 * a + 1;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 20, 10 + 40 * k, 5 + 20 * k, 0, 0, TAU);
    ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU + (p.broke ? 0.3 : 0), d = (p.broke ? 40 : 16) * k;
    ctx.fillStyle = p.broke ? `rgba(255,190,200,${a})` : `rgba(210,255,230,${a})`;
    circle(ctx, p.x + Math.cos(ang) * d, p.y - 20 + Math.sin(ang) * d * 0.6 - (p.broke ? 0 : 30 * k), p.broke ? 3 : 2.4);
  }
  ctx.restore();
}

// A Cleric's halo (S3: friends tell the two staff classes apart at a glance), over the slime's head in
// slime space: y is the top of the head
export function drawHalo(ctx, y, t) {
  const bob = Math.sin(t * 2.2) * 1.5;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = 'rgba(255,217,106,0.35)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(0, y - 9 + bob, 13, 4, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#ffd96a';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,252,230,0.9)';
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.restore();
}
// A Mage's faint sparkle round the head of its staff (staff space: the head is at (0, -len - 6))
export function drawStaffSparkle(ctx, len, t) {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const ph = t * 1.8 + i * 2.1, a = Math.max(0, Math.sin(ph)) ** 2;
    if (a < 0.05) continue;
    const x = Math.cos(i * 2.3 + t * 0.6) * 10, y = -len - 6 + Math.sin(i * 1.7 + t * 0.8) * 8, r = 2.5 + a * 1.5;
    ctx.fillStyle = `rgba(214,222,255,${a * 0.9})`;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 1.6);
    ctx.lineTo(x + r * 0.45, y);
    ctx.lineTo(x, y + r * 1.6);
    ctx.lineTo(x - r * 0.45, y);
    ctx.closePath();
    ctx.moveTo(x - r * 1.6, y);
    ctx.lineTo(x, y - r * 0.45);
    ctx.lineTo(x + r * 1.6, y);
    ctx.lineTo(x, y + r * 0.45);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
