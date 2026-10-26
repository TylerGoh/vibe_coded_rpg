// Docs: docs/combat/items.md
// Bows (S4, story/progression.md 4): every bow is two curved limbs, a grip and a string, described in BOWS
// (limb length, wood colours, thickness, tip shape from TIPS, grip wrap, an optional gem, the string, and the
// arrow's tint), and drawn by drawBow with its grip at the origin, the limbs up (-y) and down (+y) and the belly
// facing +x (the way it shoots), so the bag icon, the bow on a slime's back and the shot all share it.
// bowTint gives the colour of its arrows' trail (src/skillfx.js). Copies (`<id>_n`) go through artOf.

import { artOf } from './shared/rpg.js';

const TAU = Math.PI * 2;
const LINE = '#3a3350';
const circle = (ctx, x, y, r) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
};
const ellipse = (ctx, x, y, rx, ry, rot = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
};

// len: one limb, grip to tip · wood: [light, dark] · w: the limb's thickness · tip: the shape at each tip
// (TIPS) · c / c2: the tip's colours · grip: the wrap's colour · gem: a stone in the grip (optional) · string ·
// glow: 'r,g,b' of the arrow's trail · curve: how far the belly bows forward (default 0.5)
export const BOWS = {
  wood_bow: { len: 22, wood: ['#c99a68', '#8c6440'], w: 3, tip: 'nock', grip: '#7a5a3a', string: '#f4ead8', glow: '240,220,180' },
  iron_bow: { len: 25, wood: ['#b48a62', '#7a5a3e'], w: 3.2, tip: 'cap', c: '#c9ced9', grip: '#5a6070', string: '#eef0f6', glow: '190,205,235' },
  crystal_bow: { len: 26, wood: ['#f4eef6', '#c7b8d4'], w: 3, tip: 'gem', c: '#ffb3e0', c2: '#e48ad0', grip: '#b89ad0', string: '#ffe6f6', glow: '255,170,230' },
  spore_bow: { len: 25, wood: ['#efe2c6', '#bba57e'], w: 3.4, tip: 'mush', c: '#ff8f8f', c2: '#fff4ea', grip: '#a88a62', string: '#f4ead8', glow: '255,190,170' },
  thorn_bow: { len: 27, wood: ['#7fae5f', '#4e7a3c'], w: 3.2, tip: 'thorn', c: '#ff6f86', grip: '#5e3a2a', string: '#bde0a0', glow: '255,140,160' },
  frost_bow: { len: 28, wood: ['#dff3ff', '#93c6e8'], w: 3, tip: 'flake', c: '#ffffff', grip: '#6aa6d8', gem: '#bfe9ff', string: '#ffffff', glow: '170,225,255' },
  star_bow: { len: 29, wood: ['#eef0fa', '#a9aec9'], w: 2.8, tip: 'star', c: '#ffe680', grip: '#8a90b0', gem: '#ffe680', string: '#fff8d0', glow: '255,232,140' },
  magma_bow: { len: 29, wood: ['#5a4a52', '#2f2630'], w: 3.6, tip: 'ember', c: '#ff8a3c', c2: '#ffd36a', grip: '#3a2a2a', gem: '#ff8a3c', string: '#ffb070', glow: '255,150,80' },
  phoenix_bow: { len: 30, wood: ['#ffd98a', '#d09a3a'], w: 3, tip: 'feather', c: '#ff7a4a', c2: '#ffd36a', grip: '#b8602a', string: '#ffe0a0', glow: '255,190,90' },
  cog_bow: { len: 30, wood: ['#e8c47a', '#a8803a'], w: 3.4, tip: 'gear', c: '#ffdb8a', grip: '#7a5a2a', gem: '#8adcd0', string: '#e8e2d0', glow: '255,220,150' },
  chrono_bow: { len: 31, wood: ['#e6d090', '#a88e4a'], w: 3, tip: 'gem', c: '#c8b0ff', c2: '#9a7ae0', grip: '#7a6a3a', gem: '#c8b0ff', string: '#ffe9a8', glow: '200,170,255' },
  reed_bow: { len: 25, wood: ['#c9d88a', '#8ea050'], w: 2.8, tip: 'reed', c: '#9a6a44', grip: '#c9b07a', string: '#e8e0c0', glow: '220,235,170' },
  drift_bow: { len: 26, wood: ['#e6ddcf', '#b0a28c'], w: 3.4, tip: 'gem', c: '#8fe6d0', c2: '#5ac0a8', grip: '#8a7a64', string: '#dfe8e4', glow: '150,235,215' },
  tide_bow: { len: 28, wood: ['#ffb4bf', '#e07a8c'], w: 3.2, tip: 'coral', c: '#ffb4bf', grip: '#6a9a7a', gem: '#fff6f0', string: '#7ab894', glow: '255,200,210' },
  glowcap_bow: { len: 27, wood: ['#8a6a54', '#5a4232'], w: 3.2, tip: 'mush', c: '#7fd0ff', c2: '#e0f6ff', grip: '#4a3828', string: '#c8e8ff', glow: '130,210,255' },
  knot_bow: { len: 28, wood: ['#9a7656', '#634a34'], w: 3.6, tip: 'curl', grip: '#4e3a28', gem: '#ffd36a', string: '#e8d8b8', glow: '255,215,120' },
  oak_bow: { len: 31, wood: ['#a8825a', '#6e5236'], w: 3.2, tip: 'leaf', c: '#7fc46a', grip: '#5a7a3a', gem: '#c99252', string: '#f0e8d0', glow: '190,240,160' },
  honey_bow: { len: 29, wood: ['#4a3e3a', '#2a2220'], w: 3, tip: 'gem', c: '#ffc44a', c2: '#e6a83a', grip: '#e6a83a', gem: '#ffe59a', string: '#fff4d0', glow: '255,200,90' },
  bosun_bow: { len: 29, wood: ['#9a7a5a', '#5e4630'], w: 3.6, tip: 'cap', c: '#d6b25a', grip: '#3a4a3a', gem: '#8affc0', string: '#d8d0b0', glow: '140,255,190' },
  hart_bow: { len: 30, wood: ['#e8d6b4', '#a8946a'], w: 3.4, tip: 'antler', c: '#e8d6b4', grip: '#7a3a3a', gem: '#fff4f6', string: '#c8a088', glow: '255,240,245' },
  neck_bow: { len: 31, wood: ['#3e5434', '#141e10'], w: 3.4, tip: 'fang', c: '#d8ccd2', grip: '#c8b494', string: '#c8b494', glow: '240,255,235' },
  sentinel_bow: { len: 30, wood: ['#c4c0d0', '#8a8698'], w: 3.6, tip: 'cap', c: '#a8a4b4', grip: '#6a6678', gem: '#ffcf7a', string: '#e8e4f0', glow: '255,205,120' },
  warden_bow: { len: 32, wood: ['#b0acc0', '#76728a'], w: 3.8, tip: 'curl', grip: '#5a7a4a', gem: '#ffcf7a', string: '#d8e8c8', glow: '255,200,110' },
  hydra_bow: { len: 34, wood: ['#34482c', '#141e10'], w: 4, tip: 'fang', c: '#e8e0cc', grip: '#4e7a3e', gem: '#fbfff6', string: '#a8d888', glow: '210,255,190', curve: 0.6 }, // (Ladon's)
  glacier_bow: { len: 29, wood: ['#7a6a5c', '#4a3e34'], w: 3.4, tip: 'gem', c: '#bfe6ff', c2: '#7fbfe8', grip: '#a8c8e0', string: '#e8f4ff', glow: '170,225,255' },
  howl_bow: { len: 30, wood: ['#c8d0dc', '#7a8494'], w: 3.2, tip: 'fang', c: '#fbf6ee', grip: '#9aa2ae', string: '#eef4ff', glow: '200,235,255' },
  tusk_bow: { len: 32, wood: ['#f2e6c8', '#c8b48a'], w: 3.6, tip: 'curl', grip: '#a0503a', gem: '#ffd8a8', string: '#f4ece0', glow: '255,230,200' },
  driftbone_bow: { len: 29, wood: ['#efe8d6', '#b8ae96'], w: 3.4, tip: 'nock', grip: '#7a8a9a', gem: '#bfe6ff', string: '#e8e4dc', glow: '200,235,255' },
  ivory_bow: { len: 30, wood: ['#f4ecd8', '#c8b898'], w: 3.6, tip: 'fang', c: '#f4ecd8', grip: '#8a6a50', string: '#e0d8c8', glow: '255,245,225' },
  narwhal_bow: { len: 32, wood: ['#fbf6e8', '#d8cbb0'], w: 3.2, tip: 'spiral', c: '#d8f0ff', grip: '#8ac4e8', gem: '#d8f0ff', string: '#e8f6ff', glow: '200,235,255' },
  skate_bow: { len: 31, wood: ['#c8d8d0', '#7a948a'], w: 3.4, tip: 'leaf', c: '#8ab8a8', grip: '#4e7a6e', string: '#e0f0ea', glow: '200,255,235' },
  foxfire_bow: { len: 30, wood: ['#f2f2ec', '#b8b8ae'], w: 3.2, tip: 'flame', c: '#bfffe0', c2: '#7ae0b8', grip: '#d8803a', string: '#bfffe0', glow: '150,240,200' },
  pale_star_bow: { len: 33, wood: ['#dce8fa', '#8a9ac0'], w: 3.2, tip: 'star', c: '#ffffff', grip: '#8a9ac0', gem: '#ffffff', string: '#e8f0ff', glow: '220,235,255' },
  prism_bow: { len: 31, wood: ['#a8d0fa', '#4e7ab8'], w: 3.2, tip: 'gem', c: '#e0ecff', c2: '#7aa0ff', grip: '#3e5a8a', gem: '#ffb8f0', string: '#e0ecff', glow: '150,190,255' },
  troll_bow: { len: 33, wood: ['#8a6a48', '#5a4434'], w: 4.4, tip: 'gem', c: '#8ec4f0', c2: '#2e5a8a', grip: '#4a3828', string: '#c8b898', glow: '140,190,255' },
  rimeguard_bow: { len: 31, wood: ['#e0e4ee', '#8a90a8'], w: 3.2, tip: 'cap', c: '#c8ccd8', grip: '#3e5a8a', gem: '#e2f0fc', string: '#f0f4ff', glow: '200,230,255' },
  oath_bow: { len: 33, wood: ['#c8b498', '#6a5a44'], w: 3.6, tip: 'cap', c: '#c8ccd8', grip: '#3e6294', gem: '#e2f0fc', string: '#e8e0d0', glow: '190,226,255', shield: true },
  spring_bow: { len: 30, wood: ['#8a8490', '#4e4a56'], w: 4, tip: 'rivet', c: '#c8c4cc', grip: '#3a3640', gem: '#ff8a3c', string: '#b8b4bc', glow: '255,150,80', curve: 0.38 },
};
export const BOW_LEN = Object.fromEntries(Object.entries(BOWS).map(([id, b]) => [id, b.len]));
export const bowTint = (id) => BOWS[artOf(id)]?.glow ?? '240,230,200';

// The tips: (ctx, b, x, y, side: -1 the top, 1 the bottom). x, y is the tip.
const TIPS = {
  nock(ctx, b, x, y, side) { // a plain notched tip
    ctx.fillStyle = b.wood[1];
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    circle(ctx, x, y, b.w * 0.6);
    ctx.fill();
    ctx.stroke();
  },
  cap(ctx, b, x, y, side) { // a metal cap
    ctx.fillStyle = b.c;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x - b.w * 0.7, y - (side < 0 ? 5 : 0), b.w * 1.4, 5, 1.5);
    ctx.fill();
    ctx.stroke();
  },
  gem(ctx, b, x, y, side) { // a little faceted stone
    ctx.fillStyle = b.c;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y + side * 6);
    ctx.lineTo(x + 3.2, y);
    ctx.lineTo(x, y - side * 2.5);
    ctx.lineTo(x - 3.2, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = b.c2 ?? 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(x, y + side * 6);
    ctx.lineTo(x + 3.2, y);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  },
  mush(ctx, b, x, y, side) { // a spotted mushroom cap
    ctx.fillStyle = b.c;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    ellipse(ctx, x, y + side * 1.5, 5.5, 3.6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = b.c2;
    circle(ctx, x - 1.8, y + side * 1.5 - 1, 1);
    ctx.fill();
    circle(ctx, x + 2, y + side * 1.5, 0.9);
    ctx.fill();
  },
  thorn(ctx, b, x, y, side) { // a red berry, and thorns down the limb
    ctx.fillStyle = b.wood[1];
    for (let i = 1; i <= 3; i++) {
      const ty = y - side * i * (b.len / 4.5), tx = x + 3 + i * 1.2;
      ctx.beginPath();
      ctx.moveTo(tx - 1, ty - 2);
      ctx.lineTo(tx + 4, ty - side * 1);
      ctx.lineTo(tx - 1, ty + 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = b.c;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.1;
    circle(ctx, x, y, 3);
    ctx.fill();
    ctx.stroke();
  },
  flake(ctx, b, x, y) { // a small snowflake
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    for (const sw of [3, 1.6]) {
      ctx.strokeStyle = sw > 2 ? LINE : b.c;
      ctx.lineWidth = sw;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI;
        ctx.moveTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5);
        ctx.lineTo(x - Math.cos(a) * 5, y - Math.sin(a) * 5);
      }
      ctx.stroke();
    }
  },
  star(ctx, b, x, y) { // a four-pointed star
    ctx.fillStyle = b.c;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU, r = i % 2 ? 2 : 5.5;
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  },
  ember(ctx, b, x, y, side) { // a glowing coal in a black claw
    ctx.fillStyle = b.c;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    circle(ctx, x, y, 3.4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = b.c2;
    circle(ctx, x - 0.8, y - 0.8, 1.4);
    ctx.fill();
  },
  feather(ctx, b, x, y, side) { // a flame-coloured feather swept back
    ctx.fillStyle = b.c;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.1;
    ellipse(ctx, x - 3, y + side * 4, 2.6, 7, side * 0.5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = b.c2;
    ellipse(ctx, x - 3, y + side * 4, 1, 5, side * 0.5);
    ctx.fill();
  },
  gear(ctx, b, x, y) { // a little cog
    ctx.fillStyle = b.c;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, r = i % 2 ? 3.4 : 4.8;
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = LINE;
    circle(ctx, x, y, 1.2);
    ctx.fill();
  },
  reed(ctx, b, x, y, side) { // a cattail head
    ctx.fillStyle = b.c;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.roundRect(x - 2.2, y + (side < 0 ? -2 : -6), 4.4, 8, 2.2);
    ctx.fill();
    ctx.stroke();
  },
  coral(ctx, b, x, y, side) { // a branching coral tip
    ctx.strokeStyle = LINE;
    ctx.lineCap = 'round';
    for (const [sw, col] of [[3.4, LINE], [2, b.c]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = sw;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + side * 5);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 3, y + side * 6);
      ctx.stroke();
    }
  },
  curl(ctx, b, x, y, side) { // the limb curling back on itself (a recurve)
    ctx.strokeStyle = LINE;
    ctx.lineCap = 'round';
    for (const [sw, col] of [[b.w + 2.4, LINE], [b.w, b.wood[1]]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = sw;
      ctx.beginPath();
      ctx.arc(x + 3, y, 3, Math.PI, Math.PI + side * 1.6, side < 0);
      ctx.stroke();
    }
  },
  leaf(ctx, b, x, y, side) { // a leaf on the tip
    ctx.fillStyle = b.c;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.1;
    ellipse(ctx, x + 3, y + side * 3, 2.6, 5.5, -side * 0.6);
    ctx.fill();
    ctx.stroke();
  },
  antler(ctx, b, x, y, side) { // antler tines
    for (const [sw, col] of [[3.6, LINE], [2.2, b.c]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = sw;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + side * 6);
      ctx.moveTo(x, y + side * 1);
      ctx.lineTo(x + 5, y + side * 4);
      ctx.moveTo(x - 1, y - side * 5);
      ctx.lineTo(x + 5, y - side * 6);
      ctx.stroke();
    }
  },
  fang(ctx, b, x, y, side) { // a white fang
    ctx.fillStyle = b.c;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 2.4, y);
    ctx.quadraticCurveTo(x - 1, y + side * 7, x + 2.5, y + side * 9);
    ctx.quadraticCurveTo(x + 2, y + side * 4, x + 2.4, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  },
  spiral(ctx, b, x, y, side) { // a narwhal's twist
    ctx.fillStyle = b.wood[0];
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 2.4, y);
    ctx.lineTo(x, y + side * 10);
    ctx.lineTo(x + 2.4, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = b.wood[1];
    ctx.beginPath();
    for (let i = 1; i <= 3; i++) {
      ctx.moveTo(x - 2 + i * 0.4, y + side * i * 2.4);
      ctx.lineTo(x + 2 - i * 0.4, y + side * (i * 2.4 + 1));
    }
    ctx.stroke();
  },
  flame(ctx, b, x, y, side) { // a cold green flame
    ctx.fillStyle = b.c2;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.quadraticCurveTo(x - 3, y + side * 6, x, y + side * 9);
    ctx.quadraticCurveTo(x + 3, y + side * 6, x + 3, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = b.c;
    circle(ctx, x, y + side * 2, 1.8);
    ctx.fill();
  },
  rivet(ctx, b, x, y) { // an iron rivet
    ctx.fillStyle = b.c;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    circle(ctx, x, y, 2.6);
    ctx.fill();
    ctx.stroke();
  },
};

// Draw bow id with its grip at (0, 0), limbs up and down, shooting toward +x. draw: how far the string is
// pulled back (0..1, with an arrow on it once it's pulled); flash 0..1 lights the arrow's tint round the grip.
export function drawBow(ctx, id, draw = 0, t = 0, flash = 0) {
  const b = BOWS[artOf(id)] ?? BOWS.wood_bow, L = b.len, bend = (b.curve ?? 0.5) * L + draw * 3;
  const tipX = -L * 0.18 - draw * 3, sx = tipX - draw * L * 0.55;
  ctx.save();
  ctx.lineCap = 'round';
  if (flash > 0) {
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 16);
    g.addColorStop(0, `rgba(${b.glow},${0.6 * flash})`);
    g.addColorStop(1, `rgba(${b.glow},0)`);
    ctx.fillStyle = g;
    circle(ctx, 0, 0, 16);
    ctx.fill();
  }
  // the string (behind the limbs), pulled back to sx
  ctx.strokeStyle = b.string;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(tipX, -L);
  ctx.lineTo(sx, 0);
  ctx.lineTo(tipX, L);
  ctx.stroke();
  // the limbs: an outline, the wood, and a lighter stripe down the front
  for (const side of [-1, 1]) {
    const limb = () => {
      ctx.beginPath();
      ctx.moveTo(0, side * 4);
      ctx.quadraticCurveTo(bend, side * L * 0.55, tipX, side * L);
    };
    limb();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = b.w + 2.4;
    ctx.stroke();
    ctx.strokeStyle = b.wood[1];
    ctx.lineWidth = b.w;
    ctx.stroke();
    ctx.save();
    ctx.translate(0.6, 0);
    limb();
    ctx.strokeStyle = b.wood[0];
    ctx.lineWidth = b.w * 0.42;
    ctx.stroke();
    ctx.restore();
    TIPS[b.tip]?.(ctx, b, tipX, side * L, side);
  }
  // the grip, wrapped, and its stone
  ctx.fillStyle = b.grip;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-2.4, -6, 5.2, 12, 2.4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -3; i <= 3; i += 3) {
    ctx.moveTo(-2, i - 1);
    ctx.lineTo(2.4, i + 1);
  }
  ctx.stroke();
  if (b.shield) { // the Shield-Oath Bow's little shield
    ctx.fillStyle = b.grip;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(3, -5);
    ctx.lineTo(9, -5);
    ctx.lineTo(9, 1);
    ctx.quadraticCurveTo(6, 6, 3, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  if (b.gem) {
    ctx.fillStyle = b.gem;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.1;
    circle(ctx, 1.4, 0, 2.3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    circle(ctx, 0.7, -0.8, 0.8);
    ctx.fill();
  }
  // an arrow on the string while it's drawn
  if (draw > 0.05) drawArrow(ctx, sx, 0, L * 0.85 - sx, b.glow);
  ctx.restore();
}

// An arrow from (x, y) pointing +x, len long (the head at x + len): a wooden shaft, a steel head, two feathers
// tinted with its bow's glow ('r,g,b')
export function drawArrow(ctx, x, y, len, tint = '240,230,200', big = false) {
  const k = big ? 1.3 : 1;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3.2 * k;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + len - 4, y);
  ctx.stroke();
  ctx.strokeStyle = '#d8b07a';
  ctx.lineWidth = 1.6 * k;
  ctx.stroke();
  // the head
  ctx.fillStyle = '#e8ecf4';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + len + 3 * k, y);
  ctx.lineTo(x + len - 5 * k, y - 3.6 * k);
  ctx.lineTo(x + len - 3 * k, y);
  ctx.lineTo(x + len - 5 * k, y + 3.6 * k);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the feathers
  ctx.fillStyle = `rgb(${tint})`;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + 1, y);
    ctx.lineTo(x - 3 * k, y + side * 4 * k);
    ctx.lineTo(x + 7 * k, y + side * 3 * k);
    ctx.lineTo(x + 9 * k, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
