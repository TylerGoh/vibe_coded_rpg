// Docs: docs/combat/skills.md
// The Cleric's summons as everyone in the room sees them (S3; the server runs them: server/summons.js).
// {t:'summons', s: [[id, what, owner, x, y, hp, maxHp, dir], …]} ~20 times a second; we glide each one to
// its newest spot. Their hits ({t:'sumhit'}) show like anyone's (src/rpg.js othersHits). Art: soft, pastel,
// procedural, like the slimes. Positions: x, y = the feet (the wisp: its own middle). The Archer's Net Trap
// (S4) is drawn here too: a rope net pegged out on the ground, flicking up when it catches something
// ({t:'netcatch'}); the mob it caught wears the net (src/elements.js). SP1's kinds are simple first looks that SP2–SP5
// polish: the phoenix (a little firebird with a flame tail), sprites (small sky-blue spirits), the stone guardian (a
// mossy block golem), the hawk (a brown bird with spread wings) and the blast trap (a round pad with a glowing rune
// that goes off with a bang).
import { TAU, clamp, circle, ellipse } from './util.js';
import { SKILLS, WISP_R, SERAPH_R, NET_R, SPRITE_SCALE } from './shared/skills.js';
import { audio } from './audio.js';

const WHATS = ['spirit', 'wisp', 'totem', 'seraph', 'net', 'phoenix', 'sprite', 'guardian', 'hawk', 'blast']; // (server/summons.js SUMMON_WHATS)
const UNHURT = new Set(['wisp', 'net', 'phoenix', 'hawk', 'blast']); // (no HP bar: nothing can hit them)
const TOP = { seraph: 96, totem: 76, guardian: 70, sprite: 36 }; // (where the HP bar goes over its feet)
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
      if (m.how === 'sprung') return; // (a net that caught its last: the catch already showed)
      if (m.how === 'boom') { // (SP1: a blast trap went off)
        this.puffs.push({ x: s?.x ?? m.x, y: s?.y ?? m.y, what: 'boom', at: rpg.time });
        audio.sfx('meteorHit', { pan: clamp((m.x - (mine?.x ?? m.x)) / 500, -1, 1), vol: 0.7 });
        return;
      }
      this.puffs.push({ x: s?.x ?? m.x, y: s?.y ?? m.y, what: s?.what ?? 'spirit', at: rpg.time, broke: m.how === 'broke' });
      if (m.how === 'broke') audio.sfx('bubblePop', { vol: 0.6 });
    } else if (m.t === 'netcatch') {
      // a Net Trap caught something: it flicks up round the mob (the mob then wears it: v.netted)
      const s = this.list.get(m.id);
      if (s) s.sprung = rpg.time;
      for (const id of m.m) {
        const v = rpg.views.get(id);
        if (v) this.puffs.push({ x: v.x, y: v.y, what: 'snap', at: rpg.time });
      }
      rpg.pop(m.x, m.y - 40, 'CAUGHT!', '#e6f0a8', 16);
      audio.sfx('netSnap', { pan: clamp((m.x - (mine?.x ?? m.x)) / 500, -1, 1) });
    }
  }
  // a summon just called (the caster's skill echo): a burst where it appears
  called(x, y, what) {
    this.puffs.push({ x, y, what: what === 'net' || what === 'blast' ? 'set' : 'call', at: this.rpg.time });
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
    for (const s of this.list.values()) if (s.what === 'net') net(ctx, s, this.rpg.time);
    for (const s of this.list.values()) if (s.what === 'blast') blastTrap(ctx, s, this.rpg.time);
  }
  draw(ctx) {
    const time = this.rpg.time;
    for (const s of this.list.values()) {
      ctx.save();
      if (s.what === 'spirit') spirit(ctx, s, 1);
      else if (s.what === 'seraph') seraph(ctx, s);
      else if (s.what === 'wisp') wisp(ctx, s);
      else if (s.what === 'totem') totem(ctx, s);
      else if (s.what === 'sprite') spirit(ctx, s, SPRITE_SCALE, true);
      else if (s.what === 'phoenix') phoenix(ctx, s);
      else if (s.what === 'hawk') hawk(ctx, s);
      else if (s.what === 'guardian') guardian(ctx, s);
      ctx.restore();
      if (!UNHURT.has(s.what) && s.hp < s.maxHp) hpBar(ctx, s.x - 20, s.y - (TOP[s.what] ?? 52), 40, 5, s.hp / s.maxHp);
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
// (sky: a sprite's sky-blue tint, SP1)
function spirit(ctx, s, scale, sky = false) {
  const bob = Math.sin(s.t * 5) * 3, lean = s.lunge * 10 * s.dir;
  const x = s.x + lean, y = s.y - 10 + bob;
  glow(ctx, x, y - 14 * scale, 34 * scale, sky ? '190,225,255' : '190,255,225', 0.45);
  ctx.translate(x, y);
  ctx.scale(scale * (1 + Math.sin(s.t * 9) * 0.03), scale * (1 - Math.sin(s.t * 9) * 0.03));
  ctx.globalAlpha = 0.85;
  // the tail: three soft scallops trailing behind
  ctx.fillStyle = sky ? 'rgba(200,228,255,0.75)' : 'rgba(200,250,228,0.75)';
  for (let i = 0; i < 3; i++) {
    const tx = -s.dir * (8 + i * 7), ty = 2 + Math.sin(s.t * 7 + i) * 2;
    circle(ctx, tx, ty, 7 - i * 1.6);
  }
  // the body
  const g = ctx.createLinearGradient(0, -30, 0, 4);
  g.addColorStop(0, sky ? '#f2f8ff' : '#f2fff8');
  g.addColorStop(1, sky ? '#a9d2f0' : '#a9ecc9');
  ctx.fillStyle = g;
  ctx.strokeStyle = s.flash > 0 ? `rgba(255,120,140,${0.6 + s.flash * 0.4})` : sky ? 'rgba(70,120,170,0.7)' : 'rgba(70,150,115,0.7)';
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

// The Net Trap (S4): a rope net pegged flat on the ground, as wide as it catches (NET_R), a wooden peg at each
// corner and a little bell on a cord; it twitches for a moment after it has caught something
const NET_ROPE = '#b8945e', NET_DARK = '#6e5232';
function net(ctx, s, time) {
  const w = NET_R, h = 9, x = s.x, y = s.y - 2, twitch = s.sprung ? Math.max(0, 1 - (time - s.sprung) * 3) : 0;
  ctx.save();
  ctx.translate(x, y);
  if (twitch) ctx.translate(0, -twitch * 6);
  // the shadow it casts, so it reads as lying on the ground
  ctx.fillStyle = 'rgba(60,40,30,0.16)';
  ellipse(ctx, 0, 2, w + 6, h + 2);
  ctx.fill();
  // the mesh: two sets of diagonal cords inside the ellipse
  ctx.save();
  ellipse(ctx, 0, 0, w, h);
  ctx.clip();
  ctx.strokeStyle = NET_ROPE;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = -w * 2; i <= w * 2; i += 9) {
    ctx.moveTo(i - h * 2, -h);
    ctx.lineTo(i + h * 2, h);
    ctx.moveTo(i + h * 2, -h);
    ctx.lineTo(i - h * 2, h);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = NET_DARK;
  ctx.lineWidth = 2.2;
  ellipse(ctx, 0, 0, w, h);
  ctx.stroke();
  // pegs at the four corners
  for (const [px, py] of [[-w * 0.8, -h * 0.6], [w * 0.8, -h * 0.6], [-w * 0.8, h * 0.6], [w * 0.8, h * 0.6]]) {
    ctx.fillStyle = '#d8b07a';
    ctx.strokeStyle = NET_DARK;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(px - 2, py - 6, 4, 8, 1.5);
    ctx.fill();
    ctx.stroke();
  }
  // the bell on its cord, which gives a little swing
  const sw = Math.sin(time * 3 + s.id) * 0.25 + twitch * Math.sin(time * 40) * 0.6;
  ctx.strokeStyle = NET_DARK;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.8, -h * 0.6 - 6);
  ctx.lineTo(w * 0.8 + Math.sin(sw) * 8, -h * 0.6 - 14);
  ctx.stroke();
  ctx.fillStyle = '#ffd96a';
  ctx.strokeStyle = '#a8782a';
  circle(ctx, w * 0.8 + Math.sin(sw) * 8, -h * 0.6 - 15, 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ——— SP1's summons (simple first looks; SP2–SP5 polish them) ———
// The phoenix: a small round firebird, wings beating, a tail of flame streaming behind (it leans into a dive)
function phoenix(ctx, s) {
  const x = s.x, y = s.y, flap = Math.sin(s.t * 14) * 0.6, d = s.dir;
  glow(ctx, x, y, 40, '255,170,90', 0.5);
  for (let i = 0; i < 4; i++) { // the tail: flame tongues trailing
    const tx = x - d * (12 + i * 8), ty = y + 2 + Math.sin(s.t * 9 + i) * 3;
    ctx.fillStyle = i % 2 ? 'rgba(255,200,110,0.8)' : 'rgba(255,130,80,0.8)';
    ellipse(ctx, tx, ty, 8 - i * 1.5, 4 - i * 0.6);
  }
  for (const side of [-1, 1]) { // wings
    ctx.save();
    ctx.translate(x, y - 2);
    ctx.rotate(side * (0.4 + flap));
    ctx.fillStyle = '#ffb25a';
    ctx.strokeStyle = '#d0603a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(-d * 2, side * -9, 13, 6, side * 0.5, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#ffd27a'; // body
  ctx.strokeStyle = '#d0603a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(x, y, 11, 9, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f08a3a'; // beak
  ctx.beginPath();
  ctx.moveTo(x + d * 10, y - 3);
  ctx.lineTo(x + d * 17, y);
  ctx.lineTo(x + d * 10, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a2a1a';
  circle(ctx, x + d * 5, y - 3, 1.7);
  ctx.fillStyle = '#ff8a52'; // crest
  ellipse(ctx, x - d * 2, y - 11, 3, 5, -d * 0.4);
}
// The hawk: a brown bird with long spread wings, gliding (wings beat faster in a dive)
function hawk(ctx, s) {
  const x = s.x, y = s.y, d = s.dir, flap = Math.sin(s.t * (s.lunge ? 18 : 6)) * 0.35;
  ctx.fillStyle = 'rgba(60,40,30,0.12)';
  ctx.strokeStyle = '#5a3c26';
  ctx.lineWidth = 1.6;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(side * flap);
    ctx.fillStyle = '#b8875a';
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.quadraticCurveTo(-d * 4, side * -16, -d * 10, side * -24);
    ctx.quadraticCurveTo(d * 4, side * -14, d * 6, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#9a6a42';
  ctx.beginPath();
  ctx.ellipse(x, y, 12, 6, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8dcc8'; // head
  ctx.beginPath();
  ctx.arc(x + d * 10, y - 2, 5, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f2c14e'; // beak
  ctx.beginPath();
  ctx.moveTo(x + d * 14, y - 3);
  ctx.lineTo(x + d * 19, y);
  ctx.lineTo(x + d * 14, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2a1a10';
  circle(ctx, x + d * 11, y - 3, 1.2);
  ctx.fillStyle = '#7a5232'; // tail
  ctx.beginPath();
  ctx.moveTo(x - d * 10, y - 3);
  ctx.lineTo(x - d * 20, y - 6);
  ctx.lineTo(x - d * 20, y + 5);
  ctx.lineTo(x - d * 10, y + 3);
  ctx.closePath();
  ctx.fill();
}
// The stone guardian: a squat golem of rounded grey blocks with moss on its shoulders and two glowing eyes; it
// leans into a slam
function guardian(ctx, s) {
  const lean = s.lunge * 8 * s.dir, x = s.x + lean + (s.flash ? rand(-1.5, 1.5) : 0), y = s.y, d = s.dir;
  const step = Math.sin(s.t * 6) * 2;
  ctx.fillStyle = 'rgba(60,50,70,0.18)';
  ellipse(ctx, x, y, 26, 5);
  ctx.strokeStyle = s.flash > 0 ? '#e0607a' : '#5a5668';
  ctx.lineWidth = 2;
  const block = (bx, by, w, h, c, r = 6) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(bx - w / 2, by - h, w, h, r);
    ctx.fill();
    ctx.stroke();
  };
  block(x - 9, y + step * 0.5, 12, 14, '#a9a4b8'); // legs
  block(x + 9, y - step * 0.5, 12, 14, '#a9a4b8');
  block(x, y - 12, 40, 34, '#c4c0d2', 9); // body
  block(x - d * 22, y - 18 + s.lunge * 6, 12, 26, '#b4afc4'); // arms
  block(x + d * 24, y - 18 - s.lunge * 10, 13, 28, '#b4afc4');
  block(x + d * 2, y - 44, 24, 18, '#d2cedd', 7); // head
  ctx.fillStyle = '#8fd07a'; // moss
  ellipse(ctx, x - 12, y - 46, 7, 3);
  ellipse(ctx, x + 10, y - 45, 6, 2.6);
  glow(ctx, x + d * 6, y - 53, 10, '150,230,255', 0.6);
  ctx.fillStyle = '#7fe0ff'; // eyes
  ellipse(ctx, x + d * 1, y - 53, 2, 2.6);
  ellipse(ctx, x + d * 9, y - 53, 2, 2.6);
}
// The blast trap: a round pad pegged on the ground with a glowing rune that pulses faster the longer it waits
function blastTrap(ctx, s, time) {
  const x = s.x, y = s.y - 2, pulse = 0.5 + 0.5 * Math.sin(time * 6 + s.id);
  ctx.save();
  ctx.fillStyle = 'rgba(60,40,30,0.16)';
  ellipse(ctx, x, y + 2, 30, 8);
  ctx.fillStyle = '#7a6a5a';
  ctx.strokeStyle = '#4a3a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, 24, 7, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,120,90,${0.5 + 0.5 * pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, 14, 4, 0, 0, TAU);
  ctx.moveTo(x - 9, y);
  ctx.lineTo(x + 9, y);
  ctx.moveTo(x, y - 3.5);
  ctx.lineTo(x, y + 3.5);
  ctx.stroke();
  ctx.restore();
}

// fading out (motes rising), breaking (shards and a pop), appearing (a ring of light), a net set down (a
// puff of dust), or a net snapping up round a mob (cords flicking up and in); SP1: a blast trap going off (boom)
function puff(ctx, p, k) {
  const a = 1 - k;
  ctx.save();
  if (p.what === 'boom') {
    ctx.fillStyle = `rgba(255,180,110,${a * 0.5})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 10, 20 + 90 * k, Math.PI, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,230,170,${a})`;
    ctx.lineWidth = 4 * a + 1;
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const ang = Math.PI + (i / 7) * Math.PI, d = 20 + 70 * k;
      ctx.fillStyle = `rgba(120,100,90,${a})`;
      circle(ctx, p.x + Math.cos(ang) * d, p.y - 10 + Math.sin(ang) * d * 0.8, 3);
    }
    ctx.restore();
    return;
  }
  if (p.what === 'set' || p.what === 'snap') {
    ctx.strokeStyle = `rgba(184,148,94,${a})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const ang = Math.PI + (i / 5) * Math.PI, r = p.what === 'snap' ? 34 * (1 - k * 0.6) : 14 + 26 * k;
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(ang) * r, p.y + Math.sin(ang) * r * (p.what === 'snap' ? 1.2 : 0.3));
      ctx.lineTo(p.x + Math.cos(ang) * (r + 8), p.y + Math.sin(ang) * (r + 8) * (p.what === 'snap' ? 1.2 : 0.3));
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
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
