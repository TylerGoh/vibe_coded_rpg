// Docs: docs/combat/skills.md
// The Cleric's summons as everyone in the room sees them (S3; the server runs them: server/summons.js).
// {t:'summons', s: [[id, what, owner, x, y, hp, maxHp, dir], …]} ~20 times a second; we glide each one to
// its newest spot. Their hits ({t:'sumhit'}) show like anyone's (src/rpg.js othersHits). Art: soft, pastel,
// procedural, like the slimes. Positions: x, y = the feet (the wisp: its own middle). The Archer's Net Trap
// (S4) is drawn here too: a rope net pegged out on the ground, flicking up when it catches something
// ({t:'netcatch'}); the mob it caught wears the net (src/elements.js). SP1's kinds are simple first looks that SP2–SP5
// polish: the phoenix (SP3 polished it: a golden firebird with flame wings, a plumed crest and a streaming tail), sprites (SP4
// polished them: small sky-blue spirits with flapping petal wings, a star on a curly antenna and a trail of sparkles), the
// stone guardian (SP4: a mossy block golem with a glowing golden rune on its chest, a little flower in the moss, eyes
// that brighten as it winds up and a dust ring when it slams; the Warding Totem's pulse is a golden ring), the hawk (SP5: a red-brown hawk with a barred cream breast, a dark cap, fingered wingtips that fold back in a dive) and the
// blast trap (SP5: a clay pot in a ring of stakes, a rune that pulses faster as it waits, a fuse with a crawling spark;
// it goes off with a flash, fire, smoke and shards).
import { TAU, clamp, circle, ellipse } from './util.js';
import { SKILLS, WISP_R, SERAPH_R, NET_R, SPRITE_SCALE } from './shared/skills.js';
import { audio } from './audio.js';

const WHATS = ['spirit', 'wisp', 'totem', 'seraph', 'net', 'phoenix', 'sprite', 'guardian', 'hawk', 'blast']; // (server/summons.js SUMMON_WHATS)
const UNHURT = new Set(['wisp', 'net', 'phoenix', 'hawk', 'blast']); // (no HP bar: nothing can hit them)
const TOP = { seraph: 96, totem: 76, guardian: 74, sprite: 50 }; // (where the HP bar goes over its feet)
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
        if (s?.what === 'totem') s.pulse = 1; // (SP4: the Warding Totem's pulse)
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
      s.pulse = Math.max(0, (s.pulse ?? 0) - dt * 2);
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
      else if (s.what === 'sprite') sprite(ctx, s);
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
  if (s.pulse > 0) { // (SP4: the Warding Totem's pulse, a golden ring running out to the edge)
    const k = 1 - s.pulse;
    ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(255,214,110,${s.pulse})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y - 2, Math.max(1, r * (0.2 + 0.8 * k)), Math.max(1, 14 * (0.3 + 0.7 * k)), 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,240,180,${0.5 * s.pulse})`;
    ctx.fillRect(s.x - 3, s.y - 96, 6, 60);
  }
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
// The phoenix (SP3's polish of SP1's first look): a golden firebird with scalloped wings of flame beating, a crest of
// three flame plumes, and a long tail of flickering tongues (red, orange, gold) streaming behind with embers falling
// off it. It leans into a dive (lunge, set by its hits). One soft glow, the rest flat fills (docs/performance.md).
function phoenix(ctx, s) {
  const d = s.dir, flap = Math.sin(s.t * 13), lean = s.lunge * 0.5 * d;
  const x = s.x, y = s.y + Math.sin(s.t * 3) * 3;
  glow(ctx, x, y, 46, '255,160,80', 0.45);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  // embers drifting down off the tail
  for (let i = 0; i < 4; i++) {
    const f = (s.t * 0.9 + i / 4) % 1;
    ctx.fillStyle = `rgba(255,${190 - i * 20},90,${1 - f})`;
    circle(ctx, -d * (22 + i * 9) + Math.sin(s.t * 4 + i) * 3, 6 + f * 26, 2.2 * (1 - f) + 0.6);
  }
  // the tail: three long flame tongues, flickering
  for (const [k, col, len, off] of [[0, '#ff6a4a', 40, -5], [1, '#ff9a4a', 34, 3], [2, '#ffd36b', 26, -1]]) {
    const w = Math.sin(s.t * 11 + k * 2) * 4;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-d * 6, off - 4);
    ctx.quadraticCurveTo(-d * (len * 0.5), off - 8 + w, -d * len, off + w * 1.5);
    ctx.quadraticCurveTo(-d * (len * 0.55), off + 6 + w, -d * 6, off + 4);
    ctx.closePath();
    ctx.fill();
  }
  // wings: three flame feathers each, beating
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(-d * 2, -3);
    ctx.scale(1, side * (0.55 + 0.45 * flap));
    for (const [col, sc] of [['#ff8a4a', 1], ['#ffc46b', 0.62]]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-d * 6 * sc, -14 * sc, -d * 2 * sc, -24 * sc);
      ctx.quadraticCurveTo(-d * 3 * sc, -16 * sc, -d * 10 * sc, -21 * sc);
      ctx.quadraticCurveTo(-d * 8 * sc, -12 * sc, -d * 16 * sc, -15 * sc);
      ctx.quadraticCurveTo(-d * 10 * sc, -5 * sc, 0, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  // body and chest
  ctx.fillStyle = '#ffc04a';
  ctx.strokeStyle = '#d0603a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 8.5, d * -0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ellipse(ctx, d * 4, 2, 6, 4.5);
  // head: crest of three plumes, beak, eye
  const hx = d * 10, hy = -6;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i === 1 ? '#ffd36b' : '#ff7a4a';
    ctx.save();
    ctx.translate(hx - d * (2 + i * 2.5), hy - 4);
    ctx.rotate(-d * (0.5 + i * 0.35) + Math.sin(s.t * 9 + i) * 0.12);
    ellipse(ctx, 0, -5, 2.2, 6);
    ctx.restore();
  }
  ctx.fillStyle = '#ffc04a';
  ctx.beginPath();
  ctx.arc(hx, hy, 6, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f08a3a';
  ctx.beginPath();
  ctx.moveTo(hx + d * 5, hy - 2);
  ctx.lineTo(hx + d * 11, hy + 1);
  ctx.lineTo(hx + d * 5, hy + 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a2a1a';
  circle(ctx, hx + d * 2, hy - 1.5, 1.6);
  ctx.fillStyle = '#ffffff';
  circle(ctx, hx + d * 2.5, hy - 2, 0.6);
  ctx.restore();
}
// The hawk (SP5's polish of SP1's first look): a red-brown hawk with a cream breast barred in brown, a dark cap and
// cheek stripe, a hooked golden beak and a bright eye. Its long wings beat with fingered tips while it circles; in a
// dive (lunge, set by its hits) it folds them back, tips its head down and streams speed lines. Flat fills only.
const HAWK_BACK = '#9a5f3a', HAWK_WING = '#b8794a', HAWK_DARK = '#5a3420', HAWK_BREAST = '#f4e6cc';
function hawk(ctx, s) {
  const d = s.dir, dive = Math.max(clamp(s.lunge, 0, 1), clamp(((s.ty ?? s.y) - s.y) / 24, 0, 1)), flap = Math.sin(s.t * (dive ? 4 : 7.5));
  const x = s.x, y = s.y + Math.sin(s.t * 2.4) * 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(d * dive * 0.55); // (nose down in a dive)
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (dive > 0.2) { // speed lines streaming off behind
    ctx.strokeStyle = `rgba(255,255,255,${0.6 * dive})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const ly of [-6, 0, 6]) {
      ctx.moveTo(-d * (22 + Math.abs(ly)), ly);
      ctx.lineTo(-d * (40 + Math.abs(ly) * 2), ly);
    }
    ctx.stroke();
  }
  // the tail: a fan of barred feathers
  ctx.fillStyle = HAWK_WING;
  ctx.strokeStyle = HAWK_DARK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-d * 9, -3);
  ctx.lineTo(-d * 24, -8);
  ctx.quadraticCurveTo(-d * 27, 0, -d * 24, 8);
  ctx.lineTo(-d * 9, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = HAWK_DARK;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const b of [15, 20]) {
    ctx.moveTo(-d * b, -5 - (b - 15) * 0.4);
    ctx.lineTo(-d * b, 5 + (b - 15) * 0.4);
  }
  ctx.stroke();
  // the wings, seen from the side: the far one (darker, a little behind) and the near one, both beating up and down
  // together (the downstroke dips below the body); long, with fingered tips; folded back and low in a dive
  const span = 1 - dive * 0.5, beat = dive ? 0.45 : 0.25 + 0.75 * flap;
  const wing = (ox, sy, col) => {
    ctx.save();
    ctx.translate(ox, -3);
    ctx.scale(1, sy);
    ctx.fillStyle = col;
    ctx.strokeStyle = HAWK_DARK;
    ctx.lineWidth = 1.5 / Math.max(0.3, Math.abs(sy));
    ctx.beginPath();
    ctx.moveTo(d * 6, 0);
    ctx.quadraticCurveTo(d * 7, -18 * span, d * 1 - d * dive * 10, -31 * span);
    for (let f = 0; f < 4; f++) { // the finger feathers at the tip, then the trailing edge back to the body
      const fx = d * 1 - d * dive * 10 - d * (f + 1) * 4.2, fy = -(31 - (f + 1) * 3.5) * span;
      ctx.lineTo(fx + d * 1.5, fy + 5 * span);
      ctx.lineTo(fx, fy);
    }
    ctx.quadraticCurveTo(-d * 14, -10 * span, -d * 8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,52,32,0.5)'; // a bar across it
    ctx.lineWidth = 1.2 / Math.max(0.3, Math.abs(sy));
    ctx.beginPath();
    ctx.moveTo(d * 5, -12 * span);
    ctx.quadraticCurveTo(-d * 3, -15 * span, -d * 10, -11 * span);
    ctx.stroke();
    ctx.restore();
  };
  wing(-d * 3, Math.sign(beat || 1) * Math.max(0.2, Math.abs(beat)) * 0.85, HAWK_BACK);
  // the body: brown back, cream breast with little bars
  ctx.fillStyle = HAWK_BACK;
  ctx.strokeStyle = HAWK_DARK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 7, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = HAWK_BREAST;
  ctx.beginPath();
  ctx.ellipse(d * 3, 2.5, 8, 4.5, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(154,95,58,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const bx of [-1, 2.5, 6]) {
    ctx.moveTo(d * bx - 1.5, 2);
    ctx.lineTo(d * bx + 1.5, 3);
  }
  ctx.stroke();
  // the head: a cream face under a dark cap, a cheek stripe, a hooked beak and a bright eye
  const hx = d * 12, hy = -4;
  ctx.fillStyle = HAWK_BREAST;
  ctx.strokeStyle = HAWK_DARK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(hx, hy, 5.8, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = HAWK_DARK;
  ctx.beginPath();
  ctx.arc(hx, hy, 5.8, Math.PI * 1.05, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath(); // the cheek stripe
  ctx.moveTo(hx + d * 1, hy);
  ctx.lineTo(hx - d * 1, hy + 5);
  ctx.lineWidth = 2;
  ctx.strokeStyle = HAWK_DARK;
  ctx.stroke();
  ctx.fillStyle = '#f2c14e';
  ctx.strokeStyle = '#a8782a';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(hx + d * 4.5, hy - 2);
  ctx.quadraticCurveTo(hx + d * 11, hy - 2, hx + d * 9.5, hy + 3.5);
  ctx.quadraticCurveTo(hx + d * 8, hy + 1, hx + d * 4.5, hy + 1.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd24a';
  circle(ctx, hx + d * 2, hy - 1.2, 1.9);
  ctx.fillStyle = '#2a1a10';
  circle(ctx, hx + d * 2.3, hy - 1.2, 1.1);
  ctx.fillStyle = '#ffffff';
  circle(ctx, hx + d * 2.7, hy - 1.7, 0.45);
  wing(d * 1, Math.sign(beat || 1) * Math.max(0.2, Math.abs(beat)), HAWK_WING); // (the near wing, over the body)
  ctx.restore();
}
// The stone guardian (SP4's polish): a squat golem of rounded lilac-grey blocks, moss on its head and shoulder with a
// little flower in it, a golden rune glowing on its chest, eyes that brighten as it winds up; it leans into a slam and
// a ring of dust puffs out from its fist
function guardian(ctx, s) {
  const lean = s.lunge * 8 * s.dir, x = s.x + lean + (s.flash ? rand(-1.5, 1.5) : 0), y = s.y, d = s.dir;
  const step = Math.sin(s.t * 6) * 2, glowK = 0.5 + 0.5 * Math.sin(s.t * 3);
  ctx.fillStyle = 'rgba(60,50,70,0.18)';
  ellipse(ctx, x, y, 28, 5);
  ctx.strokeStyle = s.flash > 0 ? '#e0607a' : '#5a5668';
  ctx.lineWidth = 2;
  const block = (bx, by, w, h, c, r = 6) => {
    const g = ctx.createLinearGradient(0, by - h, 0, by);
    g.addColorStop(0, '#e2deec');
    g.addColorStop(1, c);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(bx - w / 2, by - h, w, h, r);
    ctx.fill();
    ctx.stroke();
  };
  block(x - 9, y + step * 0.5, 12, 14, '#a29db2'); // legs
  block(x + 9, y - step * 0.5, 12, 14, '#a29db2');
  block(x - d * 22, y - 18 + s.lunge * 6, 12, 26, '#aca7bd'); // the back arm
  block(x, y - 12, 40, 34, '#bab5c9', 9); // body
  // cracks and pebbles in the stone
  ctx.strokeStyle = 'rgba(90,86,104,0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 38);
  ctx.lineTo(x - 10, y - 32);
  ctx.lineTo(x - 12, y - 27);
  ctx.moveTo(x + 13, y - 22);
  ctx.lineTo(x + 9, y - 17);
  ctx.stroke();
  // the rune on its chest: a soft golden diamond with a star in it
  glow(ctx, x + d * 2, y - 28, 14, '255,220,130', 0.35 + 0.3 * glowK + s.lunge * 0.3);
  ctx.fillStyle = `rgba(255,226,140,${0.75 + 0.25 * glowK})`;
  ctx.beginPath();
  ctx.moveTo(x + d * 2, y - 36);
  ctx.lineTo(x + d * 2 + 6, y - 28);
  ctx.lineTo(x + d * 2, y - 20);
  ctx.lineTo(x + d * 2 - 6, y - 28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  circle(ctx, x + d * 2, y - 28, 1.8);
  ctx.strokeStyle = s.flash > 0 ? '#e0607a' : '#5a5668';
  ctx.lineWidth = 2;
  block(x + d * 24, y - 18 - s.lunge * 10, 13, 28, '#aca7bd'); // the slamming arm
  block(x + d * 2, y - 44, 24, 18, '#c8c3d6', 7); // head
  ctx.fillStyle = '#8fd07a'; // moss, a flower in it
  ellipse(ctx, x - 6 + d * 2, y - 61, 9, 3);
  ellipse(ctx, x - d * 20, y - 44, 6, 2.6);
  ctx.fillStyle = '#ffd0e0';
  for (let i = 0; i < 5; i++) circle(ctx, x - 9 + d * 2 + Math.cos(i * 1.26) * 2.2, y - 64 + Math.sin(i * 1.26) * 2.2, 1.5);
  ctx.fillStyle = '#ffe27a';
  circle(ctx, x - 9 + d * 2, y - 64, 1.2);
  const eye = 0.55 + 0.25 * glowK + s.lunge * 0.4;
  glow(ctx, x + d * 6, y - 53, 11, '150,230,255', eye);
  ctx.fillStyle = '#7fe0ff'; // eyes
  ellipse(ctx, x + d * 1, y - 53, 2, 2.6);
  ellipse(ctx, x + d * 9, y - 53, 2, 2.6);
  if (s.lunge > 0.05) { // the slam's dust ring in front of it
    const k = 1 - s.lunge, fx = x + d * 34;
    ctx.strokeStyle = `rgba(200,190,170,${s.lunge})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(fx, y - 2, 10 + k * 34, 3 + k * 6, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = `rgba(220,210,190,${s.lunge * 0.8})`;
    for (let i = 0; i < 4; i++) circle(ctx, fx + (i - 1.5) * 12 * (0.5 + k), y - 6 - k * 14 * (i % 2 ? 1 : 0.6), 3 + k * 2);
  }
}
// A sprite (SP4's polish): a small sky-blue spirit with two petal wings flapping fast, a star on a curly antenna and a
// trail of sparkles behind it (the spirit's body, scaled down)
function sprite(ctx, s) {
  const sc = SPRITE_SCALE, bob = Math.sin(s.t * 5) * 3, x = s.x + s.lunge * 10 * s.dir, y = s.y - 10 + bob, d = s.dir;
  for (let i = 0; i < 4; i++) { // sparkles trailing behind
    const k = (s.t * 2 + i * 0.25) % 1;
    ctx.fillStyle = `rgba(214,236,255,${0.8 * (1 - k)})`;
    circle(ctx, x - d * (12 + k * 30), y - 10 + Math.sin(s.t * 6 + i * 2) * 4, 2.4 * (1 - k) + 0.6);
  }
  const flap = Math.sin(s.t * 26);
  ctx.save();
  ctx.translate(x - d * 2, y - 18 * sc);
  ctx.fillStyle = 'rgba(226,242,255,0.6)';
  ctx.strokeStyle = 'rgba(120,170,220,0.7)';
  ctx.lineWidth = 1.2;
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sd * 7, -4, 8, 3.5 + flap * 1.5, sd * (0.6 + flap * 0.35), 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  spirit(ctx, s, sc, true);
  ctx.strokeStyle = 'rgba(70,120,170,0.8)'; // the antenna, in the body's scaled space
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(d * 2, -29);
  ctx.quadraticCurveTo(d * 4, -40, d * 10, -42);
  ctx.stroke();
  glow(ctx, d * 10, -42, 9, '255,240,170', 0.7);
  ctx.fillStyle = '#fff6c8';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + s.t * 3, r = i % 2 ? 2 : 5;
    ctx[i ? 'lineTo' : 'moveTo'](d * 10 + Math.cos(a) * r, -42 + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
// The blast trap (SP5's polish of SP1's first look): a squat clay pot sunk in a ring of four wooden stakes, a pressure
// plate on top with an orange burst rune that glows and pulses faster the longer it waits, and a fuse cord round the
// rim with a spark crawling along it. It goes off with a flash, a ball of fire, smoke and flying shards (puff 'boom').
function blastTrap(ctx, s, time) {
  const x = s.x, y = s.y - 2, wait = time - (s.born ?? time), rate = 4 + Math.min(10, wait * 0.6), pulse = 0.5 + 0.5 * Math.sin(time * rate + s.id);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(60,40,30,0.18)'; // its shadow
  ellipse(ctx, x, y + 3, 30, 7);
  // the stakes behind
  const stake = (sx, sy) => {
    ctx.fillStyle = '#c8945e';
    ctx.strokeStyle = '#6e5232';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(sx - 2.5, sy);
    ctx.lineTo(sx - 2.5, sy - 9);
    ctx.lineTo(sx, sy - 13);
    ctx.lineTo(sx + 2.5, sy - 9);
    ctx.lineTo(sx + 2.5, sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  stake(x - 15, y - 4);
  stake(x + 15, y - 4);
  // the pot: round clay, a darker band, sunk in the ground
  ctx.fillStyle = '#b8705a';
  ctx.strokeStyle = '#6a3a2a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x - 18, y);
  ctx.quadraticCurveTo(x - 20, y - 12, x - 13, y - 13);
  ctx.lineTo(x + 13, y - 13);
  ctx.quadraticCurveTo(x + 20, y - 12, x + 18, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a4e3a';
  ctx.fillRect(x - 18, y - 6, 36, 3);
  // the pressure plate and its rune
  ctx.fillStyle = '#7a6a5a';
  ctx.strokeStyle = '#4a3a2e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(x, y - 13, 14, 4, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(255,150,80,${0.25 + 0.35 * pulse})`;
  ellipse(ctx, x, y - 13, 10 + 3 * pulse, 3 + pulse);
  ctx.strokeStyle = `rgba(255,${200 + 40 * pulse},140,${0.6 + 0.4 * pulse})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { // a little burst: six rays
    const a = (i / 6) * TAU;
    ctx.moveTo(x + Math.cos(a) * 2.5, y - 13 + Math.sin(a) * 0.8);
    ctx.lineTo(x + Math.cos(a) * 8, y - 13 + Math.sin(a) * 2.4);
  }
  ctx.stroke();
  // the fuse round the rim, a spark crawling along it
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.ellipse(x, y - 9, 19, 5, 0, 0, Math.PI);
  ctx.stroke();
  ctx.setLineDash([]);
  const a = (time * 1.6 + s.id) % Math.PI, fx = x + Math.cos(a) * 19, fy = y - 9 + Math.sin(a) * 5;
  ctx.fillStyle = 'rgba(255,220,140,0.5)';
  circle(ctx, fx, fy, 3.5 + pulse);
  ctx.fillStyle = '#fff4c4';
  circle(ctx, fx, fy, 1.6);
  // the stakes in front
  stake(x - 9, y + 3);
  stake(x + 9, y + 3);
  ctx.restore();
}

// fading out (motes rising), breaking (shards and a pop), appearing (a ring of light), a net set down (a
// puff of dust), or a net snapping up round a mob (cords flicking up and in); SP1: a blast trap going off (boom)
function puff(ctx, p, k) {
  const a = 1 - k;
  ctx.save();
  if (p.what === 'boom') { // (SP5's polish: a white flash, a ball of fire, smoke rolling up, shards of the pot flying)
    if (k < 0.18) {
      ctx.fillStyle = `rgba(255,250,220,${0.8 * (1 - k / 0.18)})`;
      circle(ctx, p.x, p.y - 14, 40 + 160 * k);
    }
    ctx.fillStyle = `rgba(255,180,110,${a * 0.45})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 10, 20 + 120 * k, Math.PI, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,230,170,${a})`;
    ctx.lineWidth = 4 * a + 1;
    ctx.stroke();
    for (const [dx, r0, col] of [[0, 26, '255,140,70'], [-14, 18, '255,190,90'], [14, 18, '255,210,120']]) {
      ctx.fillStyle = `rgba(${col},${a})`;
      circle(ctx, p.x + dx * (1 + k), p.y - 18 - 30 * k, r0 * (1 - k * 0.6));
    }
    for (let i = 0; i < 5; i++) { // smoke
      ctx.fillStyle = `rgba(150,140,140,${0.5 * a})`;
      circle(ctx, p.x + (i - 2) * 16 * (0.5 + k), p.y - 30 - 60 * k - (i % 2) * 10, 8 + 14 * k);
    }
    for (let i = 0; i < 10; i++) { // shards of the pot
      const ang = Math.PI + 0.15 + (i / 9) * (Math.PI - 0.3), d = 20 + 110 * k;
      ctx.fillStyle = i % 2 ? `rgba(184,112,90,${a})` : `rgba(255,220,140,${a})`;
      ctx.save();
      ctx.translate(p.x + Math.cos(ang) * d, p.y - 10 + Math.sin(ang) * d * 0.8 + 40 * k * k);
      ctx.rotate(i + k * 8);
      ctx.fillRect(-3, -2, 6, 4);
      ctx.restore();
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
