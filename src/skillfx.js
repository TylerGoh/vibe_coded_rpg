// Docs: docs/combat/skills.md
// Skill art for the Wildwood (skills in src/shared/skills.js): the skill icons for the hotbar and the
// skill tree, the spell and sword effects (SkillFx, drawn in world space) and the Berserk aura.
// Positions are slime feet (y = bottom); a slime is ~50 wide × 42 tall.
import { TAU, clamp, circle, ellipse } from './util.js';
import { drawArrow } from './bow-art.js';
import { RAIN_AT, RAIN_EVERY } from './shared/skills.js';

const BLADE = '#e0806a', MAGIC = '#7a8cf0', GUARD = '#4fb88f', WIND = '#5fc4d8';
const TREE_OF = {
  power_strike: 'blade', iron_jelly: 'blade', whirlwind: 'blade', berserk: 'blade',
  cleave: 'blade', sword_mastery: 'blade', blade_storm: 'blade', sky_splitter: 'blade',
  magic_bolt: 'magic', mana_flow: 'magic', heal: 'holy', frost_nova: 'magic',
  chain_lightning: 'magic', arcane_mind: 'magic', meteor: 'magic', starfall: 'magic',
  jelly_bubble: 'guardian', vitality: 'guardian', rally: 'guardian', second_wind: 'guardian', sanctuary: 'guardian', aegis: 'guardian',
  dash: 'wind', flash_jump: 'wind', blink: 'wind', phantom_step: 'wind',
  // S2: the Novice tree and the classes' new skills
  slime_bash: 'novice', pebble_toss: 'novice', jelly_patch: 'novice', jelly_thirst: 'blade', mana_shield: 'magic',
  fireball: 'fire', kindling: 'fire', glacial_spike: 'magic', absolute_zero: 'magic',
  challenge_gods: 'gods', // (a gift: one player's own)
  charge: 'blade', leap_slam: 'blade', upward_cut: 'blade', momentum: 'blade', // the Warrior's chase moves (S2.5)
  arcane_charge: 'magic', // (S2.6)
  // the Cleric (S3)
  smite: 'holy', faith: 'holy', jelly_spirit: 'holy', mend: 'holy', lantern_wisp: 'holy', revive: 'holy', holy_power: 'holy',
  miracle: 'holy', guardian_totem: 'holy', barrier: 'holy', spirit_bond: 'holy', seraph: 'holy',
  // the Archer (S4)
  double_shot: 'archer', retreat_shot: 'archer', keen_eye: 'archer', steady_hands: 'archer', evasion: 'archer', snipe: 'archer',
  piercing_arrow: 'archer', deadeye: 'archer', hunters_mark: 'archer', heartseeker: 'archer', arrow_rain: 'archer', net_trap: 'archer',
  barbed_arrows: 'archer', trap_mastery: 'archer', thousand_arrows: 'archer',
};
const PALETTE = {
  blade: [BLADE, '#ffc4b0', '#b85a48'],
  magic: [MAGIC, '#c4cdff', '#4f5fc0'],
  guardian: [GUARD, '#bff0d8', '#2f8a64'],
  wind: [WIND, '#c4f0f8', '#2f8aa0'],
  novice: ['#e6b85c', '#fff0c4', '#a8782a'],
  fire: ['#f08a5a', '#ffd0b0', '#b8502a'],
  gods: ['#c8406a', '#ffd88a', '#6a1a3a'],
  holy: ['#5fc79a', '#fff2c0', '#2f8a64'],
  archer: ['#a6b04a', '#eef4c0', '#5e6a22'],
};
// A white arrow for the icons: its head at (x, y) pointing along rot, len long
function iconArrow(ctx, dark, x, y, len, rot, head = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = dark;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-len, 0);
  ctx.lineTo(-4, 0);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(4 * head, 0);
  ctx.lineTo(-6 * head, -5 * head);
  ctx.lineTo(-4 * head, 0);
  ctx.lineTo(-6 * head, 5 * head);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const side of [-1, 1]) { // fletching
    ctx.beginPath();
    ctx.moveTo(-len + 2, 0);
    ctx.lineTo(-len - 3, side * 5);
    ctx.lineTo(-len + 7, side * 4);
    ctx.lineTo(-len + 9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
// a reticle: a ring with four ticks
function reticle(ctx, x, y, r, color, w = 2.4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    ctx.moveTo(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4));
    ctx.lineTo(x + Math.cos(a) * (r + 5), y + Math.sin(a) * (r + 5));
  }
  ctx.stroke();
}
// a little net: a square of crossed cords with a peg at each corner
function iconNet(ctx, dark, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = dark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-r, -r * 0.6, 2 * r, 1.2 * r, 4);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-r, -r * 0.6, 2 * r, 1.2 * r, 4);
  ctx.clip();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = -2 * r; i <= 2 * r; i += 6) {
    ctx.moveTo(i, -r);
    ctx.lineTo(i + r, r);
    ctx.moveTo(i, -r);
    ctx.lineTo(i - r, r);
  }
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#fff2c4';
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.4;
  for (const [px, py] of [[-r, -r * 0.6], [r, -r * 0.6], [-r, r * 0.6], [r, r * 0.6]]) {
    circle(ctx, px, py, 2.6);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
const ease = (k) => 1 - (1 - k) ** 3;
// a stable pseudo-random number in [0, 1) for (seed, i)
const rnd = (seed, i) => {
  const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

// A small upright sword pointing up, hilt at (0, 0), for icons (len = blade length)
function iconSword(ctx, dark, len = 22, w = 3) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-w, -2);
  ctx.lineTo(-w, -len);
  ctx.lineTo(0, -len - w * 1.7);
  ctx.lineTo(w, -len);
  ctx.lineTo(w, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd36b';
  ctx.beginPath();
  ctx.roundRect(-w * 2.7, -3, w * 5.4, 4, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe9dc';
  ctx.beginPath();
  ctx.roundRect(-2, 1, 4, 7, 1.5);
  ctx.fill();
  ctx.stroke();
}

// A world-space sword (pointing up from the hilt at 0, 0), for effects
function fxSword(ctx, len, w, tint = '#ffb49a') {
  const g = ctx.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, '#ffffff');
  g.addColorStop(0.51, '#ffe6dc');
  g.addColorStop(1, '#ffd6c8');
  ctx.fillStyle = g;
  ctx.strokeStyle = tint;
  ctx.lineWidth = Math.max(1.5, w * 0.3);
  ctx.beginPath();
  ctx.moveTo(-w, 0);
  ctx.lineTo(-w, -len);
  ctx.lineTo(0, -len - w * 2);
  ctx.lineTo(w, -len);
  ctx.lineTo(w, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (w >= 6) { // a fuller down the middle of big swords
    ctx.strokeStyle = 'rgba(255,170,140,0.45)';
    ctx.lineWidth = w * 0.25;
    ctx.beginPath();
    ctx.moveTo(0, -w);
    ctx.lineTo(0, -len + w);
    ctx.stroke();
  }
  ctx.fillStyle = '#c99a6a'; // grip and pommel
  ctx.beginPath();
  ctx.roundRect(-w * 0.55, w * 0.6, w * 1.1, w * 2.6, w * 0.4);
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  circle(ctx, 0, w * 3.5, w * 0.75);
  ctx.strokeStyle = '#d9a040';
  ctx.lineWidth = Math.max(1, w * 0.2);
  ctx.beginPath();
  ctx.roundRect(-w * 2.6, -1, w * 5.2, w * 1.3, w * 0.6);
  ctx.fill();
  ctx.stroke();
}

// A jagged lightning path from a to b (redrawn with a new jitter every few frames)
function zigzag(ctx, ax, ay, bx, by, seed, jag = 14) {
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len, n = Math.max(3, Math.round(len / 22));
  ctx.moveTo(ax, ay);
  for (let i = 1; i < n; i++) {
    const q = i / n, off = (rnd(seed, i) - 0.5) * 2 * jag * Math.sin(q * Math.PI) ** 0.5;
    ctx.lineTo(ax + dx * q + nx * off, ay + dy * q + ny * off);
  }
  ctx.lineTo(bx, by);
}

function feather(ctx, x, y, len, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -len / 2);
  ctx.quadraticCurveTo(len * 0.32, 0, 0, len / 2);
  ctx.quadraticCurveTo(-len * 0.32, 0, 0, -len / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(214,176,96,0.9)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -len / 2);
  ctx.lineTo(0, len / 2 + 2);
  ctx.stroke();
  ctx.restore();
}

function star(ctx, x, y, r, points = 4, inner = 0.4) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * TAU - Math.PI / 2, rr = i % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function heart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.8, y - s * 1.2, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.8, y - s * 1.2, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
  ctx.closePath();
  ctx.fill();
}

function snowflake(ctx, x, y, r, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU, c = Math.cos(a), s = Math.sin(a);
    ctx.moveTo(0, 0);
    ctx.lineTo(c * r, s * r);
    // little v-branches
    const bx = c * r * 0.55, by = s * r * 0.55, b = r * 0.32;
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(a + 0.8) * b, by + Math.sin(a + 0.8) * b);
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(a - 0.8) * b, by + Math.sin(a - 0.8) * b);
  }
  ctx.stroke();
  ctx.restore();
}

function flame(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.bezierCurveTo(x - w * 0.6, y - h * 0.45, x - w * 0.1, y - h * 0.6, x, y - h);
  ctx.bezierCurveTo(x + w * 0.15, y - h * 0.6, x + w * 0.6, y - h * 0.45, x + w / 2, y);
  ctx.quadraticCurveTo(x, y + w * 0.3, x - w / 2, y);
  ctx.closePath();
  ctx.fill();
}

// ——— icons ———

// An icon for a skill: a rounded badge in its tree's colour with a white symbol. Centred at (x, y),
// fitting a size × size box.
export function drawSkillIcon(ctx, id, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 48, size / 48);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const [base, light, dark] = PALETTE[TREE_OF[id] ?? 'blade'];
  // badge
  const g = ctx.createLinearGradient(0, -24, 0, 24);
  g.addColorStop(0, light);
  g.addColorStop(1, base);
  ctx.fillStyle = g;
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.roundRect(-22, -22, 44, 44, 13);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-19, -19, 38, 38, 10.5);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ellipse(ctx, -9, -14, 9, 3.5, -0.3);
  ctx.strokeStyle = dark;
  ctx.fillStyle = '#ffffff';
  const sym = ICONS[id];
  if (sym) sym(ctx, dark);
  else {
    ctx.fillStyle = '#ffffff';
    circle(ctx, 0, 0, 7);
  }
  ctx.restore();
}

const ICONS = {
  // ——— the Archer (S4) ———
  double_shot(ctx, dark) { // two arrows side by side
    iconArrow(ctx, dark, 14, -9, 26, -0.35);
    iconArrow(ctx, dark, 16, 5, 26, -0.35);
  },
  retreat_shot(ctx, dark) { // an arrow flying back, with dash lines going the other way
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (const [y, x0, x1] of [[6, 6, 18], [12, 2, 16], [18, 8, 18]]) {
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
    }
    ctx.stroke();
    iconArrow(ctx, dark, -16, -6, 24, Math.PI);
  },
  keen_eye(ctx, dark) { // an eye with a crosshair in it
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-17, 0);
    ctx.quadraticCurveTo(0, -16, 17, 0);
    ctx.quadraticCurveTo(0, 16, -17, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7a8a2a';
    circle(ctx, 0, 0, 6.5);
    ctx.fill();
    reticle(ctx, 0, 0, 6.5, '#e8504a', 1.6);
    ctx.fillStyle = '#ffffff';
    circle(ctx, -2, -2, 1.6);
    ctx.fill();
  },
  steady_hands(ctx, dark) { // a bow drawn, an arrow on the string
    ctx.save();
    ctx.translate(4, 0);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-6, -17);
    ctx.quadraticCurveTo(10, 0, -6, 17);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-6, -17);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-6, 17);
    ctx.stroke();
    ctx.restore();
    iconArrow(ctx, dark, 18, 0, 26, 0, 0.9);
  },
  evasion(ctx, dark) { // a see-through slime stepping aside as an arrow goes by
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ellipse(ctx, -6, 6, 11, 9);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.8;
    ellipse(ctx, 6, 8, 10, 8.5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = dark;
    circle(ctx, 3, 7, 1.4);
    ctx.fill();
    circle(ctx, 9, 7, 1.4);
    ctx.fill();
    iconArrow(ctx, dark, 18, -10, 30, 0, 0.8);
  },
  snipe(ctx, dark) { // a crosshair with an arrow coming in from far off
    reticle(ctx, 6, 4, 11, '#ffffff', 3);
    ctx.fillStyle = '#e8504a';
    circle(ctx, 6, 4, 2.4);
    ctx.fill();
    iconArrow(ctx, dark, 4, 2, 22, 0.55, 0.8);
  },
  piercing_arrow(ctx, dark) { // an arrow through three rings
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2.4;
    for (const x of [-10, 0, 10]) {
      ctx.beginPath();
      ctx.ellipse(x, 0, 3.5, 9, 0, 0, TAU);
      ctx.stroke();
    }
    iconArrow(ctx, dark, 19, 0, 36, 0);
  },
  deadeye(ctx, dark) { // a bullseye with an arrow in its middle
    for (const [r, c] of [[16, '#ffffff'], [11, '#e8504a'], [6.5, '#ffffff'], [2.6, '#e8504a']]) {
      ctx.fillStyle = c;
      circle(ctx, -2, 2, r);
      ctx.fill();
    }
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.6;
    circle(ctx, -2, 2, 16);
    ctx.stroke();
    iconArrow(ctx, dark, -1, 1, 20, 2.4, 0.8);
  },
  hunters_mark(ctx, dark) { // a red mark turning over a target
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipse(ctx, 0, 12, 13, 5);
    ctx.fill();
    reticle(ctx, 0, -2, 12, '#ffffff', 4.5);
    reticle(ctx, 0, -2, 12, '#e8504a', 2.4);
    ctx.fillStyle = '#e8504a';
    circle(ctx, 0, -2, 3);
    ctx.fill();
  },
  heartseeker(ctx, dark) { // a big golden arrow through a heart
    ctx.fillStyle = '#ffd0d8';
    heart(ctx, 2, 2, 12);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    iconArrow(ctx, dark, 20, -8, 38, 0.42, 1.2);
  },
  arrow_rain(ctx, dark) { // three arrows falling from the sky
    for (const [x, y] of [[-10, 4], [0, 12], [10, 4]]) iconArrow(ctx, dark, x, y, 18, Math.PI / 2 - 0.2, 0.8);
  },
  net_trap(ctx, dark) {
    iconNet(ctx, dark, 0, 4, 15);
  },
  barbed_arrows(ctx, dark) { // a big hooked arrowhead
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, -12);
    ctx.lineTo(0, -6);
    ctx.lineTo(4, -2);
    ctx.lineTo(-6, 4);
    ctx.lineTo(-2, 8);
    ctx.lineTo(-16, 16);
    ctx.lineTo(-8, 2);
    ctx.lineTo(-12, -2);
    ctx.lineTo(-2, -8);
    ctx.lineTo(-6, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c8d08a';
    circle(ctx, 4, -6, 2);
    ctx.fill();
  },
  trap_mastery(ctx, dark) { // a net with a burst over it
    iconNet(ctx, dark, 0, 7, 13);
    ctx.fillStyle = '#fff2c4';
    star(ctx, 0, -9, 10, 6, 0.45);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  },
  thousand_arrows(ctx, dark) { // a sky full of arrows
    for (const [x, y] of [[-14, -2], [-5, 8], [4, -4], [13, 6], [-9, 16], [9, 18]]) iconArrow(ctx, dark, x, y, 13, Math.PI / 2 - 0.25, 0.6);
  },
  // ——— the Cleric (S3) ———
  smite(ctx, dark) { // a falling shaft of light with a star where it strikes
    ctx.fillStyle = 'rgba(255,240,170,0.9)';
    ctx.beginPath();
    ctx.moveTo(-5, -20);
    ctx.lineTo(5, -20);
    ctx.lineTo(9, 8);
    ctx.lineTo(-9, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    star(ctx, 0, 8, 11, 4, 0.35);
    ctx.fillStyle = '#ffe9a0';
    star(ctx, 0, 8, 5, 4, 0.4);
    ctx.fillStyle = '#c8ffd8';
    star(ctx, 14, -12, 3.5);
  },
  faith(ctx, dark) { // a halo over a glowing heart
    ctx.strokeStyle = '#ffd96a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -13, 11, 3.5, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    heart(ctx, 0, 6, 13);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#ffe9a0';
    star(ctx, 0, 4, 4);
  },
  jelly_spirit(ctx, dark) { // a little slime ghost
    ctx.fillStyle = 'rgba(240,255,248,0.95)';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, 12);
    ctx.bezierCurveTo(-14, -6, -7, -16, 0, -16);
    ctx.bezierCurveTo(7, -16, 14, -6, 12, 12);
    ctx.quadraticCurveTo(8, 15, 4, 12);
    ctx.quadraticCurveTo(0, 15, -4, 12);
    ctx.quadraticCurveTo(-8, 15, -12, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = dark;
    ellipse(ctx, -4, -3, 1.6, 2.4);
    ellipse(ctx, 4, -3, 1.6, 2.4);
    ctx.fillStyle = '#ffe9a0';
    star(ctx, 15, -13, 3.5);
  },
  mend(ctx, dark) { // a heart with a ring of leaves turning round it
    ctx.fillStyle = '#ff8fb0';
    heart(ctx, 0, 3, 12);
    ctx.fillStyle = '#c8ffd8';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU - 0.6;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 15, 1 + Math.sin(a) * 15, 4.5, 2.2, a + 1.2, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  },
  lantern_wisp(ctx, dark) { // a paper lantern glowing
    ctx.fillStyle = 'rgba(255,230,150,0.6)';
    circle(ctx, 0, 2, 16);
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(-1.2, -18, 2.4, 6);
    ctx.beginPath();
    ctx.roundRect(-7, -13, 14, 4, 1.5);
    ctx.roundRect(-7, 14, 14, 4, 1.5);
    ctx.fill();
    ctx.fillStyle = '#fff6d0';
    ctx.strokeStyle = '#b8863a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 2, 11, 12, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffb060';
    ellipse(ctx, 0, 4, 3.5, 5);
  },
  revive(ctx, dark) { // a slime rising out of a puddle in a beam of light
    ctx.fillStyle = 'rgba(255,245,190,0.85)';
    ctx.fillRect(-8, -22, 16, 34);
    ctx.fillStyle = '#9fe6c0';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 14, 16, 4, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-9, 10);
    ctx.bezierCurveTo(-10, -4, 10, -4, 9, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.lineTo(14, -18);
    ctx.moveTo(9, -13);
    ctx.lineTo(14, -18);
    ctx.lineTo(19, -13);
    ctx.stroke();
  },
  holy_power(ctx, dark) { // a cross of light inside a sunburst
    ctx.fillStyle = '#ffe9a0';
    star(ctx, 0, 0, 18, 8, 0.55);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-3, -11, 6, 22, 2);
    ctx.roundRect(-11, -3, 22, 6, 2);
    ctx.fill();
  },
  miracle(ctx, dark) { // three hearts under a big star
    ctx.fillStyle = '#ffe9a0';
    star(ctx, 0, -8, 13, 5, 0.45);
    ctx.fillStyle = '#ff8fb0';
    heart(ctx, -11, 12, 7);
    heart(ctx, 0, 14, 8);
    heart(ctx, 11, 12, 7);
  },
  guardian_totem(ctx, dark) { // the carved totem with its gem
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.6;
    [[16, 18, '#c9a27a'], [2, 16, '#b88c62'], [-11, 14, '#d4b088']].forEach(([y, w, c]) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.roundRect(-w / 2, y - 12, w, 12, 3.5);
      ctx.fill();
      ctx.stroke();
    });
    ctx.fillStyle = '#7ff0b0';
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(5, -18);
    ctx.lineTo(0, -12);
    ctx.lineTo(-5, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5a3c26';
    ellipse(ctx, -3, -5, 1.2, 1.7);
    ellipse(ctx, 3, -5, 1.2, 1.7);
  },
  barrier(ctx, dark) { // a golden bubble of hexagons
    ctx.strokeStyle = '#ffd96a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.4;
    for (const [x, y] of [[0, 0], [-8, -6], [8, -6], [-8, 7], [8, 7]]) {
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * TAU;
        ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * 4.5, y + Math.sin(a) * 4.5);
      }
      ctx.stroke();
    }
  },
  spirit_bond(ctx, dark) { // two little ghosts holding hands
    for (const [x, s] of [[-7, 1], [7, -1]]) {
      ctx.fillStyle = 'rgba(240,255,248,0.95)';
      ctx.strokeStyle = dark;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - 8, 12);
      ctx.bezierCurveTo(x - 9, -2, x - 4, -10, x, -10);
      ctx.bezierCurveTo(x + 4, -10, x + 9, -2, x + 8, 12);
      ctx.quadraticCurveTo(x, 15, x - 8, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = dark;
      ellipse(ctx, x - 2.5 + s, -2, 1.1, 1.7);
      ellipse(ctx, x + 2.5 + s, -2, 1.1, 1.7);
    }
    ctx.fillStyle = '#ff8fb0';
    heart(ctx, 0, -16, 5);
  },
  seraph(ctx, dark) { // wings and a halo
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.4;
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(sd * (9 + i * 4), -2 + i * 6, 10 - i * 2, 4.5, sd * 0.5, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#f2fff8';
    circle(ctx, 0, 4, 7);
    ctx.stroke();
    ctx.strokeStyle = '#ffd96a';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(0, -13, 8, 2.6, 0, 0, TAU);
    ctx.stroke();
  },
  // ——— the Mage's Arcane Charge (S2.6): three charges stacked into a burst ———
  arcane_charge(ctx, dark) {
    ctx.lineWidth = 2;
    [[-11, 9, 0.6], [-3, 3, 0.8], [5, -3, 1]].forEach(([x, y, a]) => {
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 4.5, y);
      ctx.lineTo(x, y + 6);
      ctx.lineTo(x - 4.5, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = dark;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff6c4';
    star(ctx, 14, -12, 6);
  },
  // ——— the Warrior's chase moves (S2.5) ———
  charge(ctx, dark) {
    // a sword thrust forward with speed lines streaming behind it, a star where it lands
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (const [y, x0, x1] of [[-8, -19, -9], [0, -21, -7], [8, -18, -9]]) {
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
    }
    ctx.stroke();
    ctx.save();
    ctx.translate(-4, 0);
    ctx.rotate(Math.PI / 2);
    iconSword(ctx, dark, 20, 3);
    ctx.restore();
    ctx.fillStyle = '#fff6c4';
    star(ctx, 17, 0, 5);
  },
  leap_slam(ctx, dark) {
    // a sword driving straight down into the ground, a shockwave ring spreading out
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 14, 17, 4.5, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(-14, 4);
    ctx.lineTo(-19, -1);
    ctx.moveTo(14, 4);
    ctx.lineTo(19, -1);
    ctx.stroke();
    ctx.save();
    ctx.translate(0, -12);
    ctx.rotate(Math.PI);
    iconSword(ctx, dark, 20, 3);
    ctx.restore();
  },
  upward_cut(ctx, dark) {
    // a rising crescent with an up arrow and a sword sweeping up through it
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(4, 4, 18, Math.PI * 0.55, Math.PI * 1.45);
    ctx.arc(9, 4, 14, Math.PI * 1.4, Math.PI * 0.6, true);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.translate(6, 12);
    ctx.rotate(0.3);
    iconSword(ctx, dark, 20, 3);
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-13, -10);
    ctx.lineTo(-8, -17);
    ctx.lineTo(-3, -10);
    ctx.stroke();
  },
  momentum(ctx, dark) {
    // three chevrons, getting bigger, pushing forward
    ctx.lineWidth = 3.2;
    [[-11, 6, 0.55], [-2, 8, 0.8], [8, 10, 1]].forEach(([x, h, a]) => {
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.moveTo(x - h * 0.6, -h);
      ctx.lineTo(x + h * 0.4, 0);
      ctx.lineTo(x - h * 0.6, h);
      ctx.stroke();
    });
    ctx.fillStyle = '#fff6c4';
    star(ctx, 17, -14, 3.5);
  },
  // ——— Gifts ———
  challenge_gods(ctx) {
    // a lightning bolt striking down on a single tiny heart (1 HP), rays behind
    ctx.strokeStyle = 'rgba(255,240,190,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.2;
      ctx.moveTo(Math.cos(a) * 9, 6 + Math.sin(a) * 9);
      ctx.lineTo(Math.cos(a) * 17, 6 + Math.sin(a) * 17);
    }
    ctx.stroke();
    ctx.fillStyle = '#ff4a6a';
    ctx.strokeStyle = '#6a1a3a';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); // the heart
    ctx.moveTo(0, 13);
    ctx.bezierCurveTo(-9, 6, -8, -1, -3.5, 0);
    ctx.bezierCurveTo(-1.5, 0.5, 0, 2, 0, 3);
    ctx.bezierCurveTo(0, 2, 1.5, 0.5, 3.5, 0);
    ctx.bezierCurveTo(8, -1, 9, 6, 0, 13);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff6c4';
    ctx.strokeStyle = '#a8782a';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); // the bolt, from the top of the badge to the heart
    ctx.moveTo(4, -20);
    ctx.lineTo(-5, -7);
    ctx.lineTo(0, -7);
    ctx.lineTo(-4, 2);
    ctx.lineTo(7, -11);
    ctx.lineTo(2, -11);
    ctx.lineTo(8, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  },
  // ——— Novice ———
  slime_bash(ctx, dark) {
    // a jelly leaning into a bump, an impact star ahead of it
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    jellyBlob(ctx, -4, 13, 24, 20, 0.6);
    ctx.stroke();
    ctx.fillStyle = dark;
    ellipse(ctx, -1, 4, 1.4, 2);
    ellipse(ctx, 5, 4, 1.4, 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (const dy of [-4, 2, 8]) {
      ctx.moveTo(-21, dy);
      ctx.lineTo(-16, dy);
    }
    ctx.stroke();
    ctx.fillStyle = '#fff6c4';
    star(ctx, 13, -6, 7, 5, 0.45);
  },
  pebble_toss(ctx, dark) {
    // a pebble at the end of a dotted arc
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 5; i++) circle(ctx, -16 + i * 5.5, 8 - Math.sin((i / 5) * Math.PI) * 14, 1.6);
    ctx.fillStyle = '#e8e0d4';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ellipse(ctx, 10, 2, 8, 6.5, 0.3);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, 7.5, -0.5, 2.5, 1.5, 0.3);
  },
  jelly_patch(ctx, dark) {
    // a jelly with a crossed plaster on it
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    jellyBlob(ctx, 0, 15, 30, 26);
    ctx.stroke();
    ctx.save();
    ctx.translate(2, 2);
    for (const a of [0.6, -0.6]) {
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = '#ffd9b0';
      ctx.beginPath();
      ctx.roundRect(-11, -3.5, 22, 7, 3);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = '#ff8fb0';
    heart(ctx, 13, -12, 4);
  },
  // ——— Warrior / Mage (S2) ———
  jelly_thirst(ctx, dark) {
    // a sword over a heart: hits that heal
    ctx.fillStyle = '#ff8fb0';
    ctx.strokeStyle = '#d9507a';
    ctx.lineWidth = 2;
    heart(ctx, 2, 6, 12);
    ctx.stroke();
    ctx.save();
    ctx.translate(-4, 12);
    ctx.rotate(0.6);
    iconSword(ctx, dark, 20, 2.6);
    ctx.restore();
    ctx.fillStyle = '#c8ffd8';
    star(ctx, 14, -13, 4);
  },
  mana_shield(ctx, dark) {
    // a round shield with a mana drop on it
    ctx.fillStyle = '#e6ebff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.quadraticCurveTo(14, -14, 15, -9);
    ctx.quadraticCurveTo(14, 8, 0, 17);
    ctx.quadraticCurveTo(-14, 8, -15, -9);
    ctx.quadraticCurveTo(-14, -14, 0, -17);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6a7ae8';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.bezierCurveTo(3, -4, 7, 0, 7, 4);
    ctx.bezierCurveTo(7, 8, 4, 10, 0, 10);
    ctx.bezierCurveTo(-4, 10, -7, 8, -7, 4);
    ctx.bezierCurveTo(-7, 0, -3, -4, 0, -9);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, -2.5, 3, 1.5, 3, 0.3);
  },
  fireball(ctx) {
    // a ball of fire flying right, flames trailing
    ctx.fillStyle = 'rgba(255,230,190,0.85)';
    ctx.save();
    ctx.translate(2, 2);
    ctx.rotate(-Math.PI / 2);
    flame(ctx, 0, -2, 18, 26);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    circle(ctx, 6, 0, 8.5);
    ctx.fillStyle = '#ffd36b';
    circle(ctx, 7.5, -1, 4.5);
  },
  kindling(ctx, dark) {
    // two crossed logs and a flame on them
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.fillStyle = '#ffe2c8';
    for (const a of [0.35, -0.35]) {
      ctx.save();
      ctx.translate(0, 11);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.roundRect(-15, -3.5, 30, 7, 3.5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#ffffff';
    flame(ctx, 0, 8, 18, 26);
    ctx.fillStyle = '#ffd36b';
    flame(ctx, 0, 7, 9, 14);
  },
  glacial_spike(ctx, dark) {
    // a long ice spike pointing right
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-17, -6);
    ctx.lineTo(17, 0);
    ctx.lineTo(-17, 6);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#9fd4ff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();
    ctx.fillStyle = '#dff4ff';
    star(ctx, -6, -12, 3.5);
    star(ctx, 2, 12, 3);
  },
  absolute_zero(ctx, dark) {
    // a big snowflake inside a frozen ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 5;
    snowflake(ctx, 0, 0, 12);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.6;
    snowflake(ctx, 0, 0, 12);
  },
  // ——— Mobility (wind) ———
  dash(ctx, dark) {
    // a jelly zooming right, speed lines streaming behind it
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (const [y, x0, x1] of [[-6, -18, -6], [1, -20, -3], [8, -16, -5]]) {
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#ffffff';
    jellyBlob(ctx, -4, 12, 24, 17);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.8;
    jellyBlob(ctx, 5, 12, 27, 20, 0.25);
    ctx.stroke();
    ctx.fillStyle = dark;
    ellipse(ctx, 9, 3, 1.3, 2);
    ellipse(ctx, 14, 3, 1.3, 2);
    ctx.fillStyle = 'rgba(255,143,176,0.6)';
    ellipse(ctx, 17.5, 6.5, 2, 1.2);
    ctx.fillStyle = '#fff6c4';
    star(ctx, 17, -13, 3.5);
  },
  flash_jump(ctx, dark) {
    // a jelly springing up off a puff of wind
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(0, 13, 14, 4, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, 7);
    ctx.quadraticCurveTo(-11, 3, -9, 7);
    ctx.moveTo(16, 7);
    ctx.quadraticCurveTo(11, 3, 9, 7);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.8;
    jellyBlob(ctx, 0, 6, 24, 17);
    ctx.stroke();
    ctx.fillStyle = dark;
    ellipse(ctx, -3, -2, 1.2, 1.8);
    ellipse(ctx, 3, -2, 1.2, 1.8);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); // an up chevron
    ctx.moveTo(-6, -14);
    ctx.lineTo(0, -20);
    ctx.lineTo(6, -14);
    ctx.stroke();
    ctx.fillStyle = '#fff6c4';
    star(ctx, 15, -14, 3);
  },
  blink(ctx, dark) {
    // a dotted ghost where it was, a hop arrow, a sparkling pop where it lands
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([2.5, 3]);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    jellyBlob(ctx, -10, 13, 18, 13);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-9, -4);
    ctx.quadraticCurveTo(0, -20, 8, -8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(11, -5);
    ctx.lineTo(5, -6);
    ctx.lineTo(9, -11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    circle(ctx, 10, 5, 11);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.8;
    jellyBlob(ctx, 10, 14, 19, 14);
    ctx.stroke();
    ctx.fillStyle = dark;
    ellipse(ctx, 8, 7, 1, 1.6);
    ellipse(ctx, 12.5, 7, 1, 1.6);
    ctx.fillStyle = '#fff6c4';
    star(ctx, 19, -3, 3.2);
    star(ctx, 2, 0, 2.2);
  },
  phantom_step(ctx, dark) {
    // a trail of ghostly afterimages fading behind a jelly
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.3 + i * 0.2;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.2;
      jellyBlob(ctx, -13 + i * 7, 12, 18, 13);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.8;
    jellyBlob(ctx, 8, 12, 24, 18, 0.2);
    ctx.stroke();
    ctx.fillStyle = dark;
    ellipse(ctx, 10, 4, 1.2, 1.8);
    ellipse(ctx, 15, 4, 1.2, 1.8);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); // wisps curling off
    ctx.moveTo(-18, -4);
    ctx.quadraticCurveTo(-13, -12, -6, -10);
    ctx.moveTo(-10, -14);
    ctx.quadraticCurveTo(-4, -20, 2, -17);
    ctx.stroke();
    ctx.fillStyle = '#fff6c4';
    star(ctx, 17, -15, 3.4);
  },
  power_strike(ctx, dark) {
    // a big crescent slash behind a sword
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(-4, 6, 19, -1.9, 0.2);
    ctx.arc(-9, 10, 14, 0.25, -1.75, true);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.translate(-6, 9);
    ctx.rotate(0.78);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.8;
    ctx.beginPath(); // blade
    ctx.moveTo(-3, -4);
    ctx.lineTo(-3, -22);
    ctx.lineTo(0, -27);
    ctx.lineTo(3, -22);
    ctx.lineTo(3, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.roundRect(-8, -5, 16, 4, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffe9dc';
    ctx.beginPath();
    ctx.roundRect(-2, -1, 4, 8, 1.5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#fff6c4';
    star(ctx, 14, -13, 4.5);
  },
  iron_jelly(ctx, dark) {
    // a round shield with a little jelly face
    ctx.fillStyle = '#eef1f7';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.quadraticCurveTo(9, -11, 14, -12);
    ctx.quadraticCurveTo(15, 6, 0, 16);
    ctx.quadraticCurveTo(-15, 6, -14, -12);
    ctx.quadraticCurveTo(-9, -11, 0, -15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#a6f5c9'; // the jelly inside
    ctx.strokeStyle = '#3fa673';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, 7);
    ctx.bezierCurveTo(-8, -3, -4, -6, 0, -6);
    ctx.bezierCurveTo(4, -6, 8, -3, 8, 7);
    ctx.quadraticCurveTo(0, 9, -8, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2d2a3e';
    ellipse(ctx, -2.5, 1, 1.1, 1.6);
    ellipse(ctx, 2.5, 1, 1.1, 1.6);
    ctx.fillStyle = '#c9d0de';
    for (const [rx, ry] of [[-10, -9], [10, -9], [0, 12]]) circle(ctx, rx, ry, 1.4);
  },
  whirlwind(ctx, dark) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    for (let a = 0; a < TAU * 2.1; a += 0.15) {
      const r = 1.5 + a * 1.1;
      const px = Math.cos(a) * r, py = -1 + Math.sin(a) * r * 0.8;
      a ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); // little gusts flying off
    ctx.moveTo(-16, 10);
    ctx.lineTo(-9, 13);
    ctx.moveTo(10, -14);
    ctx.lineTo(16, -11);
    ctx.stroke();
    ctx.fillStyle = '#fff6c4';
    star(ctx, 15, 12, 3);
    void dark;
  },
  berserk(ctx) {
    // an angry little flame
    ctx.fillStyle = '#ff5a3a';
    flame(ctx, 0, 15, 26, 33);
    ctx.fillStyle = '#ffa23a';
    flame(ctx, 0, 14, 18, 23);
    ctx.fillStyle = '#ffe27a';
    flame(ctx, 0, 13, 10, 12);
    ctx.strokeStyle = '#7a1a10';
    ctx.lineWidth = 2;
    ctx.beginPath(); // furious brows
    ctx.moveTo(-8, -3);
    ctx.lineTo(-2.5, 0);
    ctx.moveTo(8, -3);
    ctx.lineTo(2.5, 0);
    ctx.stroke();
    ctx.fillStyle = '#7a1a10';
    ellipse(ctx, -4.5, 3, 1.4, 2);
    ellipse(ctx, 4.5, 3, 1.4, 2);
  },
  magic_bolt(ctx) {
    // a glowing orb streaking forward
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (const [dy, len] of [[-6, 16], [0, 20], [6, 14]]) {
      ctx.moveTo(-17, dy + 4);
      ctx.lineTo(-17 + len * 0.6, dy + 2);
    }
    ctx.stroke();
    const g = ctx.createRadialGradient(5, -2, 1, 5, -2, 14);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, '#e2e6ff');
    g.addColorStop(1, 'rgba(226,230,255,0)');
    ctx.fillStyle = g;
    circle(ctx, 5, -2, 14);
    ctx.fillStyle = '#ffffff';
    star(ctx, 5, -2, 9, 4, 0.38);
    ctx.fillStyle = '#fff6c4';
    star(ctx, -9, -13, 3);
    star(ctx, 14, 12, 2.4);
  },
  mana_flow(ctx, dark) {
    // a mana droplet with a swirl inside
    ctx.fillStyle = '#e6ebff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.bezierCurveTo(4, -9, 13, -1, 13, 6);
    ctx.bezierCurveTo(13, 13, 7, 17, 0, 17);
    ctx.bezierCurveTo(-7, 17, -13, 13, -13, 6);
    ctx.bezierCurveTo(-13, -1, -4, -9, 0, -17);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#6a7ae8';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let a = 0; a < TAU * 1.4; a += 0.2) {
      const r = 1 + a * 1.1;
      const px = Math.cos(a) * r, py = 7 + Math.sin(a) * r * 0.8;
      a ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, -5, 0, 2, 4, 0.3);
  },
  heal(ctx) {
    ctx.fillStyle = '#ff8fb0';
    ctx.strokeStyle = '#d9507a';
    ctx.lineWidth = 2;
    heart(ctx, -1, 2, 14);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ellipse(ctx, -7, -4, 3, 2, -0.6);
    ctx.fillStyle = '#ffffff'; // a plus on the heart
    ctx.beginPath();
    ctx.roundRect(-3, -1, 4, 12, 1.5);
    ctx.roundRect(-7, 3, 12, 4, 1.5);
    ctx.fill();
    ctx.fillStyle = '#c8ffd8';
    star(ctx, 14, -13, 4.5);
    star(ctx, -15, -12, 3);
    star(ctx, 15, 11, 2.6);
  },
  frost_nova(ctx, dark) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 6;
    snowflake(ctx, 0, 0, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    snowflake(ctx, 0, 0, 16);
    ctx.fillStyle = '#dff4ff';
    circle(ctx, 0, 0, 3.5);
  },

  // ——— Blade (new) ———
  cleave(ctx, dark) {
    // one very wide crescent sweeping through three little targets
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-8, 0, 17, -1.75, 1.75);
    ctx.arc(-13, 0, 12.5, 1.6, -1.6, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // three little blobs being cut, each with a split line
    for (const [tx, ty] of [[11, -11], [14, 1], [11, 13]]) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = dark;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(tx, ty, 4.4, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ff7a5a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tx - 6, ty - 3);
      ctx.lineTo(tx + 6, ty + 3);
      ctx.stroke();
    }
  },
  sword_mastery(ctx, dark) {
    // a sword ringed by a laurel, with a crit sparkle
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(0, 0, 15, s < 0 ? Math.PI * 0.55 : Math.PI * 0.45, s < 0 ? Math.PI * 1.25 : -Math.PI * 0.25, s > 0);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const a = s < 0 ? Math.PI * (0.65 + i * 0.17) : Math.PI * (0.35 - i * 0.17);
        ellipse(ctx, Math.cos(a) * 15, Math.sin(a) * 15, 2.2, 4, a + (s < 0 ? 0.6 : -0.6));
      }
    }
    ctx.save();
    ctx.translate(0, 9);
    iconSword(ctx, dark, 21, 3);
    ctx.restore();
    ctx.fillStyle = '#ffe27a';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.2;
    star(ctx, 12, -13, 6.5, 4, 0.36);
    ctx.stroke();
  },
  blade_storm(ctx, dark) {
    // a ring of swords whirling round a swirl
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let a = 0; a < TAU * 1.3; a += 0.15) {
      const r = 1 + a * 0.9;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      a ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.4;
      ctx.save();
      ctx.translate(Math.cos(a) * 5, Math.sin(a) * 5);
      ctx.rotate(a + Math.PI * 0.5 + 0.35);
      ctx.scale(0.6, 0.6);
      iconSword(ctx, dark, 20, 3.2);
      ctx.restore();
    }
  },
  sky_splitter(ctx, dark) {
    // a beam from the sky, a huge sword plunging down it, cracks in the ground
    const g = ctx.createLinearGradient(0, -22, 0, 18);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0.15)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-6, -21);
    ctx.lineTo(6, -21);
    ctx.lineTo(10, 15);
    ctx.lineTo(-10, 15);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.translate(0, -12);
    ctx.rotate(Math.PI);
    iconSword(ctx, dark, 20, 3.6);
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath(); // ground cracks
    ctx.moveTo(-3, 15);
    ctx.lineTo(-10, 18);
    ctx.lineTo(-16, 16);
    ctx.moveTo(3, 15);
    ctx.lineTo(9, 18);
    ctx.lineTo(16, 15);
    ctx.stroke();
    ctx.fillStyle = '#fff6c4';
    star(ctx, -13, -12, 3.6);
    star(ctx, 14, -6, 2.8);
  },

  // ——— Magic (new) ———
  chain_lightning(ctx, dark) {
    const pts = [[-14, -12], [-1, 3], [13, -8]];
    ctx.lineWidth = 6.5;
    ctx.strokeStyle = dark;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(-14, -12);
      ctx.lineTo(-10, -3);
      ctx.lineTo(-5, -5);
      ctx.lineTo(-1, 3);
      ctx.lineTo(4, -3);
      ctx.lineTo(7, 0);
      ctx.lineTo(13, -8);
      ctx.moveTo(-1, 3);
      ctx.lineTo(2, 9);
      ctx.lineTo(-2, 11);
      ctx.lineTo(3, 17);
    };
    path();
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff6a8';
    path();
    ctx.stroke();
    for (const [px, py] of pts) {
      ctx.fillStyle = '#ffffff';
      circle(ctx, px, py, 4);
      ctx.fillStyle = '#ffe27a';
      circle(ctx, px, py, 2);
    }
  },
  arcane_mind(ctx, dark) {
    // a glowing third eye inside a rune circle
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU - Math.PI / 2;
      circle(ctx, Math.cos(a) * 16, Math.sin(a) * 16, 2);
    }
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.beginPath(); // the eye
    ctx.moveTo(-12, 0);
    ctx.quadraticCurveTo(0, -12, 12, 0);
    ctx.quadraticCurveTo(0, 12, -12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 6);
    g.addColorStop(0, '#e9d4ff');
    g.addColorStop(1, '#8a5ae8');
    ctx.fillStyle = g;
    circle(ctx, 0, 0, 5.5);
    ctx.fillStyle = '#ffffff';
    circle(ctx, -1.8, -1.8, 1.6);
    ctx.fillStyle = '#fff6c4';
    star(ctx, 14, -14, 3.4);
  },
  meteor(ctx, dark) {
    // a flaming rock streaking down from the top left
    ctx.save();
    ctx.translate(6, 6);
    ctx.rotate(-Math.PI * 0.25);
    ctx.fillStyle = 'rgba(255,240,200,0.6)';
    flame(ctx, 0, 6, 22, 32);
    ctx.fillStyle = '#ff8a4a';
    flame(ctx, 0, 6, 16, 26);
    ctx.fillStyle = '#ffd36b';
    flame(ctx, 0, 5, 9, 16);
    ctx.restore();
    ctx.fillStyle = '#8a6a8e';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(6, 6, 8.5, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6a4f70';
    circle(ctx, 8, 8, 2.2);
    circle(ctx, 3, 4, 1.4);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ellipse(ctx, 3, 2, 3, 1.6, -0.6);
  },
  starfall(ctx) {
    // three stars raining down with streaks
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2.2;
    const stars = [[-8, -3, 7], [10, -8, 5], [4, 12, 6.5]];
    ctx.beginPath();
    for (const [sx, sy, r] of stars) {
      ctx.moveTo(sx - r * 0.6, sy - r * 0.8);
      ctx.lineTo(sx - r * 1.3, sy - r * 1.7);
    }
    ctx.stroke();
    for (const [sx, sy, r] of stars) {
      ctx.fillStyle = '#fff6a8';
      star(ctx, sx, sy, r + 1.5, 5, 0.48);
      ctx.fillStyle = '#ffffff';
      star(ctx, sx, sy, r * 0.6, 5, 0.48);
    }
  },

  // ——— Guardian ———
  jelly_bubble(ctx, dark) {
    // a big shiny bubble with a jelly inside
    ctx.fillStyle = 'rgba(230,255,245,0.55)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, 16.5, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#a6f5c9';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-9, 10);
    ctx.bezierCurveTo(-9, -1, -5, -4, 0, -4);
    ctx.bezierCurveTo(5, -4, 9, -1, 9, 10);
    ctx.quadraticCurveTo(0, 12, -9, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2d2a3e';
    ellipse(ctx, -3, 3, 1.2, 1.7);
    ellipse(ctx, 3, 3, 1.2, 1.7);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, 12.5, -2.7, -1.9);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    circle(ctx, 8, -9, 2);
  },
  vitality(ctx, dark) {
    // a plump heart with a pulse line through it
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    heart(ctx, 0, 1, 15);
    ctx.stroke();
    ctx.strokeStyle = '#ff6f93';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-4, -7);
    ctx.lineTo(0, 7);
    ctx.lineTo(3, -2);
    ctx.lineTo(6, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();
    ctx.fillStyle = '#e6fff0';
    star(ctx, 15, -14, 3.6);
  },
  rally(ctx, dark) {
    // a waving banner on a pole with a star on it
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-11, 18);
    ctx.lineTo(-11, -16);
    ctx.stroke();
    ctx.fillStyle = '#ffd36b';
    circle(ctx, -11, -17, 2.8);
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-10, -13);
    ctx.quadraticCurveTo(0, -18, 7, -13);
    ctx.quadraticCurveTo(12, -10, 17, -12);
    ctx.lineTo(13, -3);
    ctx.lineTo(17, 6);
    ctx.quadraticCurveTo(10, 8, 6, 5);
    ctx.quadraticCurveTo(-2, 1, -10, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff9a7e';
    star(ctx, 2, -5, 6, 5, 0.45);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); // cheer lines
    ctx.moveTo(-17, -6);
    ctx.lineTo(-14, -4);
    ctx.moveTo(-17, 2);
    ctx.lineTo(-14, 2);
    ctx.stroke();
  },
  second_wind(ctx, dark) {
    // a little heart lifted by two wings
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.6;
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(s, 1);
      ctx.beginPath();
      ctx.moveTo(4, 2);
      ctx.quadraticCurveTo(12, -16, 20, -12);
      ctx.quadraticCurveTo(19, -6, 15, -5);
      ctx.quadraticCurveTo(18, -1, 13, 1);
      ctx.quadraticCurveTo(15, 5, 10, 6);
      ctx.quadraticCurveTo(7, 8, 4, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#ff8fb0';
    ctx.strokeStyle = '#d9507a';
    ctx.lineWidth = 1.6;
    heart(ctx, 0, 4, 7.5);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath(); // an upward lift
    ctx.moveTo(-5, 17);
    ctx.lineTo(0, 13);
    ctx.lineTo(5, 17);
    ctx.stroke();
  },
  sanctuary(ctx, dark) {
    // a holy circle on the floor under a soft dome, with a sparkle on top
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 9, 17, 17, 0, Math.PI, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 9, 17, 17, 0, Math.PI, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#fff3b0';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(0, 10, 18, 5.5, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 10, 12, 3.4, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#fff6c4';
    star(ctx, 0, -3, 7.5, 4, 0.34);
    ctx.fillStyle = '#ffffff';
    for (const [mx, my] of [[-9, 0], [9, -2], [-5, -9]]) circle(ctx, mx, my, 1.5);
  },
  aegis(ctx, dark) {
    // a golden shield with a radiant star
    ctx.fillStyle = 'rgba(255,240,180,0.45)';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.12) * 12, Math.sin(a - 0.12) * 12);
      ctx.lineTo(Math.cos(a) * 21, Math.sin(a) * 21);
      ctx.lineTo(Math.cos(a + 0.12) * 12, Math.sin(a + 0.12) * 12);
      ctx.fill();
    }
    const g = ctx.createLinearGradient(0, -15, 0, 16);
    g.addColorStop(0, '#fff3b0');
    g.addColorStop(1, '#f2b84a');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#a8742a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.quadraticCurveTo(8, -11, 13, -12);
    ctx.quadraticCurveTo(14, 6, 0, 16);
    ctx.quadraticCurveTo(-14, 6, -13, -12);
    ctx.quadraticCurveTo(-8, -11, 0, -15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    star(ctx, 0, 0, 8, 5, 0.45);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ellipse(ctx, -6, -7, 2.5, 4, 0.4);
    void dark;
  },
};

// ——— effects ———

const LIFE = {
  strike: 0.35, spin: 0.5, heal: 0.9, nova: 0.6, buff: 0.6, levelskill: 0.8,
  cleave: 0.38, storm: 1.0, skysplit: 0.65, chain: 0.42, starfall: 1.3, bubblePop: 0.45, rally: 0.8, aegis: 0.7, secondwind: 1.0,
  dash: 0.3, blink: 0.45, flashjump: 0.35, scroll: 1.4, gods: 1.1,
  charge: 0.35, slam: 0.55, upcut: 0.4, shatter: 0.55,
  barrier: 0.6, revive: 1.1, // (S3)
};

export class SkillFx {
  constructor() {
    this.list = [];
  }

  // kind: 'strike' | 'spin' | 'bolt' | 'heal' | 'nova' | 'buff' | 'levelskill' | 'cleave' | 'storm' |
  // 'skysplit' | 'chain' | 'meteor' | 'starfall' | 'bubblePop' | 'rally' | 'zone' | 'aegis' | 'secondwind' |
  // 'dash' | 'blink' | 'flashjump' | 'scroll' | 'iframe' | 'staffbolt' | 'holybolt' | 'charge' | 'slam' | 'slamfall' | 'upcut' | 'shatter'
  // (options: see each FX entry)
  spawn(kind, o = {}) {
    const life = kind === 'bolt' ? (o.dur ?? 0.3) + 0.35
      : kind === 'staffbolt' ? (o.dur ?? 0.15) + 0.25
      : kind === 'holybolt' ? (o.dur ?? 0.15) + 0.4
      : kind === 'meteor' ? (o.delay ?? 0.8) + 0.6
      : kind === 'zone' ? (o.dur ?? 8)
      : kind === 'iframe' || kind === 'slamfall' ? (o.dur ?? 0.3)
      : kind === 'arrow' ? (o.dur ?? 0.2) + 0.3
      : kind === 'pierce' ? (o.dur ?? 0.3) + 0.45
      : kind === 'rain' ? RAIN_AT + (o.hits ?? 3) * RAIN_EVERY + 0.4
      : LIFE[kind];
    if (!life) return;
    this.list.push({ kind, o, age: 0, life, seed: Math.random() * 1000 });
  }

  update(dt) {
    for (const e of this.list) e.age += dt;
    this.list = this.list.filter((e) => e.age < e.life);
  }

  draw(ctx) {
    for (const e of this.list) {
      const k = clamp(e.age / e.life, 0, 1);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      FX[e.kind](ctx, e, k);
      ctx.restore();
    }
  }
}

const FX = {
  // ——— the Archer (S4) ———
  // An arrow {x, y, tx, ty, dur, hit, tint, big}: a shallow arc there, nose along its path, a faint trail; on
  // landing a little burst of splinters (hit) or the arrow stuck in the ground, fading (miss)
  arrow(ctx, e) {
    const { x, y, tx, ty, hit } = e.o, dur = e.o.dur ?? 0.2, tint = e.o.tint ?? '240,230,200';
    const lift = Math.min(18, Math.abs(tx - x) * 0.04);
    const at = (q) => [x + (tx - x) * q, y + (ty - y) * q - Math.sin(q * Math.PI) * lift];
    const q = Math.min(1, e.age / dur);
    const [px, py] = at(q), [bx, by] = at(Math.max(0, q - 0.04));
    const ang = Math.atan2(py - by, px - bx || Math.sign(tx - x) || 1);
    if (q < 1) {
      const [t0x, t0y] = at(Math.max(0, q - 0.25));
      ctx.strokeStyle = `rgba(${tint},0.45)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t0x, t0y);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.translate(px, py);
      ctx.rotate(ang);
      drawArrow(ctx, -26, 0, 26, tint, e.o.big);
      return;
    }
    const b = (e.age - dur) / 0.3;
    ctx.globalAlpha = 1 - b;
    if (hit) {
      ctx.fillStyle = `rgb(${tint})`;
      for (let i = 0; i < 5; i++) {
        const a = ang + Math.PI + (i - 2) * 0.5, d = 4 + b * 18;
        ctx.save();
        ctx.translate(px + Math.cos(a) * d, py + Math.sin(a) * d);
        ctx.rotate(a);
        ctx.fillRect(-3, -0.8, 6, 1.6);
        ctx.restore();
      }
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * (1 - b) + 0.5;
      ctx.beginPath();
      ctx.arc(px, py, 3 + b * 12, 0, TAU);
      ctx.stroke();
    } else {
      ctx.translate(px, py);
      ctx.rotate(ang);
      drawArrow(ctx, -26, 0, 26, tint);
    }
  },
  // Piercing Arrow / Heartseeker {x, y, tx, ty, dur, big}: a streak of light along the line with the arrow at its
  // head, the streak lingering and thinning out behind
  pierce(ctx, e) {
    const { x, y, tx, big } = e.o, dur = Math.max(0.05, e.o.dur ?? 0.3), dir = Math.sign(tx - x) || 1;
    const q = Math.min(1, e.age / dur), hx = x + (tx - x) * q, fade = e.age > dur ? 1 - (e.age - dur) / 0.45 : 1;
    const w = big ? 9 : 4;
    ctx.globalAlpha = Math.max(0, fade);
    const g = ctx.createLinearGradient(x, 0, hx, 0);
    g.addColorStop(0, `rgba(255,240,180,0)`);
    g.addColorStop(1, big ? 'rgba(255,220,120,0.9)' : 'rgba(240,250,200,0.85)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, y - w * 0.3);
    ctx.lineTo(hx, y - w / 2);
    ctx.lineTo(hx, y + w / 2);
    ctx.lineTo(x, y + w * 0.3);
    ctx.closePath();
    ctx.fill();
    if (q < 1) {
      ctx.translate(hx, y);
      ctx.scale(dir, 1);
      drawArrow(ctx, -30, 0, 30, big ? '255,210,110' : '230,240,180', big);
    }
  },
  // Arrow Rain / Thousand Arrows {sx, sy, x, y, radius, hits, big}: a few arrows shot up from the archer, then
  // waves of them coming down slantwise over the area, each landing with a puff of dust
  rain(ctx, e) {
    const { sx, sy, x, y, radius: R = 130, hits = 3, big } = e.o, t = e.age;
    if (t < 0.3) {
      for (let i = 0; i < 3; i++) {
        const q = t / 0.3, ax = sx + (i - 1) * 6, ay = sy - 30 - q * 160;
        ctx.save();
        ctx.globalAlpha = 1 - q;
        ctx.translate(ax, ay);
        ctx.rotate(-Math.PI / 2 + (i - 1) * 0.12);
        drawArrow(ctx, -22, 0, 22);
        ctx.restore();
      }
    }
    const per = big ? 14 : 7, FALL = 0.2;
    for (let n = 0; n < hits; n++) {
      const land = RAIN_AT + n * RAIN_EVERY;
      for (let i = 0; i < per; i++) {
        const ox = (rnd(e.seed + n, i) * 2 - 1) * R, at = land + (rnd(e.seed, n * 31 + i) - 0.5) * 0.12, gx = x + ox, gy = y - 2;
        const q = (t - (at - FALL)) / FALL;
        if (q < 0 || q > 2) continue;
        if (q <= 1) {
          ctx.save();
          ctx.translate(gx - 60 * (1 - q), gy - 220 * (1 - q));
          ctx.rotate(Math.atan2(220, 60));
          drawArrow(ctx, -22, 0, 22);
          ctx.restore();
        } else {
          const b = q - 1;
          ctx.globalAlpha = 1 - b;
          ctx.fillStyle = 'rgba(230,220,200,0.8)';
          circle(ctx, gx - 6 - b * 6, gy - 3 - b * 4, 4 * (1 - b) + 1);
          ctx.fill();
          circle(ctx, gx + 6 + b * 6, gy - 3 - b * 4, 4 * (1 - b) + 1);
          ctx.fill();
          ctx.save();
          ctx.translate(gx, gy);
          ctx.rotate(Math.atan2(220, 60));
          drawArrow(ctx, -18, 0, 14);
          ctx.restore();
          ctx.globalAlpha = 1;
        }
      }
    }
  },

  // ——— the Cleric (S3) ———
  // Barrier {x, y, radius, targets}: a golden ring sweeping out, and a flash of hexagons round everyone it shields
  barrier(ctx, e, k) {
    const { x, y } = e.o, R = (e.o.radius ?? 200) * ease(Math.min(1, k / 0.5)), a = 1 - k;
    ctx.save();
    ctx.translate(x, y - 6);
    ctx.scale(1, 0.3);
    ctx.strokeStyle = `rgba(255,217,106,${a})`;
    ctx.lineWidth = 4 / 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.stroke();
    ctx.restore();
    for (const t of e.o.targets ?? [{ x, y }]) {
      ctx.strokeStyle = `rgba(255,236,160,${a})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * TAU + k * 2, hx = t.x + Math.cos(ang) * 30, hy = t.y - 22 + Math.sin(ang) * 30;
        ctx.beginPath();
        for (let j = 0; j <= 6; j++) {
          const b = (j / 6) * TAU;
          ctx[j ? 'lineTo' : 'moveTo'](hx + Math.cos(b) * 6, hy + Math.sin(b) * 6);
        }
        ctx.stroke();
      }
    }
  },
  // Revive {x, y}: a pillar of soft light on a slime getting back up, sparkles rising
  revive(ctx, e, k) {
    const { x, y } = e.o, a = Math.sin(k * Math.PI);
    const g = ctx.createLinearGradient(x, y - 200, x, y);
    g.addColorStop(0, 'rgba(255,245,200,0)');
    g.addColorStop(1, `rgba(255,245,200,${0.6 * a})`);
    ctx.fillStyle = g;
    ctx.fillRect(x - 26, y - 200, 52, 200);
    for (let i = 0; i < 8; i++) {
      const s = (k * 1.4 + i / 8) % 1;
      ctx.fillStyle = `rgba(255,236,160,${a * (1 - s)})`;
      star(ctx, x + Math.sin(i * 2.7 + e.seed) * 22, y - 10 - s * 120, 3 + (i % 3));
    }
  },
  // ——— the Mage's combos (S2.6) ———
  // Shatter {x, y, r}: a frozen mob's ice bursting: pale shards flying out, a ring of frost
  shatter(ctx, e, k) {
    const { x, y } = e.o, r = e.o.r ?? 30, fade = 1 - k;
    ctx.translate(x, y);
    ctx.globalAlpha = fade * 0.7;
    ctx.strokeStyle = '#d6f1ff';
    ctx.lineWidth = 3 * fade + 1;
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.5 + ease(k)), 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = fade;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + rnd(e.seed, i), d = r * (0.3 + ease(k) * (0.9 + rnd(e.seed, i + 9) * 0.6)), sz = 4 + rnd(e.seed, i + 18) * 5;
      ctx.save();
      ctx.translate(Math.cos(a) * d, Math.sin(a) * d + k * k * 30);
      ctx.rotate(a + k * 6);
      ctx.fillStyle = i % 2 ? '#ffffff' : '#bfe8ff';
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz * 0.5, sz * 0.6);
      ctx.lineTo(-sz * 0.5, sz * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  },
  // ——— the Warrior's chase moves (S2.5) ———
  // Charge {x, y, dir}: a burst of sparks and a short coral thrust where the dash hit
  charge(ctx, e, k) {
    const { x, y } = e.o, dir = e.o.dir < 0 ? -1 : 1, fade = 1 - k;
    ctx.translate(x + dir * 30, y - 22);
    ctx.scale(dir, 1);
    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(255,154,126,0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18 + ease(k) * 26, 10 + ease(k) * 6, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7 - 0.5) * 2.2, d0 = 8 + ease(k) * 12, d1 = d0 + 14 * fade + 4;
      ctx.moveTo(Math.cos(a) * d0, Math.sin(a) * d0);
      ctx.lineTo(Math.cos(a) * d1, Math.sin(a) * d1);
    }
    ctx.stroke();
    ctx.fillStyle = '#fff6c4';
    star(ctx, 0, 0, 9 * fade + 2);
  },
  // Leap Slam falling {follow}: a streak of speed lines above the slime as it drops
  slamfall(ctx, e) {
    const p = e.o.follow?.();
    if (!p) return;
    ctx.translate(p.x, p.y - 40);
    for (let i = 0; i < 5; i++) {
      const dx = (i - 2) * 9, len = 26 + rnd(e.seed, i) * 26;
      ctx.globalAlpha = 0.7 - Math.abs(i - 2) * 0.15;
      ctx.strokeStyle = i % 2 ? 'rgba(255,200,180,0.9)' : '#ffffff';
      ctx.lineWidth = i === 2 ? 4 : 2.5;
      ctx.beginPath();
      ctx.moveTo(dx, -4);
      ctx.lineTo(dx, -4 - len);
      ctx.stroke();
    }
  },
  // Leap Slam landing {x, y, radius}: a shockwave ring along the floor and cracks of light
  slam(ctx, e, k) {
    const { x, y } = e.o, R = (e.o.radius ?? 100) * (0.3 + 0.7 * ease(k)), fade = 1 - k;
    ctx.translate(x, y);
    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(255,220,200,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, R, R * 0.22, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5 * fade + 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, R, R * 0.22, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,154,126,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI + (i / 5) * Math.PI, d = 10 + R * 0.5;
      ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 4);
      ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d * 0.6);
    }
    ctx.stroke();
    ctx.fillStyle = '#fff6c4';
    star(ctx, 0, -6, 10 * fade + 2);
  },
  // Upward Cut {x, y, dir, follow}: a crescent sweeping up from below the slime to over its head
  upcut(ctx, e, k) {
    const p = e.o.follow?.() ?? e.o, dir = e.o.dir < 0 ? -1 : 1;
    ctx.translate(p.x, p.y - 30);
    ctx.scale(dir, 1);
    const sweep = ease(Math.min(1, k / 0.5)), fade = k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5;
    const a0 = Math.PI * 0.6, a1 = a0 - Math.PI * 1.2 * sweep, R = 50;
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#ff9a7e';
    ctx.beginPath();
    ctx.arc(0, 0, R + 4, a0, a1, true);
    ctx.arc(-6, 0, R - 8, a1, a0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, R, a0 - 0.1, a1, true);
    ctx.arc(-4, 0, R - 4, a1, a0 - 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff6c4';
    star(ctx, Math.cos(a1) * (R + 2), Math.sin(a1) * (R + 2), 7 * (1 - k * 0.6));
  },

  // Challenge the Gods {x, y}: a bolt of light out of the sky onto the caster, and a crimson ring bursting out
  gods(ctx, e, k) {
    const { x, y } = e.o, fade = 1 - k;
    ctx.translate(x, y);
    const flash = Math.max(0, 1 - k * 3);
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#fff6d0';
    ctx.fillRect(-14 * flash - 3, -600, 2 * (14 * flash + 3), 600); // the column of light
    ctx.globalAlpha = Math.max(0, 1 - k * 2.2);
    ctx.strokeStyle = '#fff6c4';
    ctx.lineWidth = 4;
    ctx.beginPath(); // the bolt
    let bx = 0;
    ctx.moveTo(0, -560);
    for (let i = 1; i <= 10; i++) {
      bx = i === 10 ? 0 : (rnd(e.seed, i) - 0.5) * 34;
      ctx.lineTo(bx, -560 + i * 54);
    }
    ctx.stroke();
    ctx.globalAlpha = fade;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6 * fade + 1;
    ctx.beginPath();
    ctx.ellipse(0, -20, 20 + ease(k) * 80, (20 + ease(k) * 80) * 0.6, 0, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + e.seed, d = 16 + ease(k) * 60;
      ctx.fillStyle = i % 2 ? '#ffffff' : '#fff2c0';
      star(ctx, Math.cos(a) * d, -22 + Math.sin(a) * d * 0.6 - k * 20, 4 * fade + 1);
    }
  },

  // A big bright crescent slash in front of the caster
  strike(ctx, e, k) {
    const { x, y } = e.o, dir = e.o.dir < 0 ? -1 : 1;
    ctx.translate(x, y - 22);
    ctx.scale(dir, 1);
    const sweep = ease(Math.min(1, k / 0.45));
    const a0 = -1.5, a1 = a0 + 2.5 * sweep;
    const fade = k < 0.45 ? 1 : 1 - (k - 0.45) / 0.55;
    const R = 54 + 8 * k;
    ctx.globalAlpha = fade;
    // glow
    ctx.fillStyle = 'rgba(255,170,140,0.35)';
    ctx.beginPath();
    ctx.arc(8, 0, R + 10, a0, a1);
    ctx.arc(2, 0, R - 18, a1, a0, true);
    ctx.closePath();
    ctx.fill();
    // crescent body: coral edge, white core
    ctx.fillStyle = '#ff9a7e';
    ctx.beginPath();
    ctx.arc(8, 0, R + 4, a0, a1);
    ctx.arc(0, 0, R - 8, a1, a0, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, 0, R, a0 + 0.1, a1);
    ctx.arc(2, 0, R - 4, a1, a0 + 0.1, true);
    ctx.closePath();
    ctx.fill();
    // speed lines and a sparkle at the leading tip
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const [dy, len] of [[-14, 22], [0, 30], [14, 20]]) {
      const sx = 30 + k * 30;
      ctx.moveTo(sx, dy);
      ctx.lineTo(sx + len * (1 - k), dy);
    }
    ctx.stroke();
    const tx = 8 + Math.cos(a1) * (R + 2), ty = Math.sin(a1) * (R + 2);
    ctx.fillStyle = '#fff6c4';
    star(ctx, tx, ty, 7 * (1 - k * 0.6));
  },

  // A whirling gust around the caster
  spin(ctx, e, k) {
    const p = e.o.follow?.() ?? e.o;
    const R = (e.o.radius ?? 100) * (0.55 + 0.45 * ease(k));
    const fade = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    ctx.translate(p.x, p.y - 18);
    ctx.globalAlpha = fade;
    // a soft disc of wind
    const g = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, R);
    g.addColorStop(0, 'rgba(255,220,200,0)');
    g.addColorStop(0.8, 'rgba(255,220,200,0.22)');
    g.addColorStop(1, 'rgba(255,220,200,0)');
    ctx.save();
    ctx.scale(1, 0.45);
    ctx.fillStyle = g;
    circle(ctx, 0, 0, R);
    // spinning crescents at a few radii
    const spin = e.age * 22;
    for (let i = 0; i < 3; i++) {
      const r = R * (0.55 + i * 0.22), a = spin * (1 - i * 0.15) + i * 2.1;
      ctx.strokeStyle = i === 1 ? 'rgba(255,154,126,0.9)' : 'rgba(255,255,255,0.95)';
      ctx.lineWidth = (5 - i) / 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, r, a, a + 2.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r, a + Math.PI, a + Math.PI + 1.6);
      ctx.stroke();
    }
    ctx.restore();
    // dust kicked up at the feet
    ctx.fillStyle = 'rgba(255,248,236,0.8)';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + e.seed, d = R * (0.4 + 0.6 * k);
      circle(ctx, Math.cos(a + e.age * 6) * d, 16 - k * 8 - (i % 2) * 4, (5 - 3 * k) * (i % 2 ? 0.8 : 1.1));
    }
  },

  // A glowing projectile with a trail; a burst on a hit, a fizzle on a miss
  // tint: 'r,g,b' of the glow (Fireball's fire, Glacial Spike's ice); the default is Magic Bolt's blue
  bolt(ctx, e) {
    const { x, y, tx, ty, hit } = e.o, dur = e.o.dur ?? 0.3, tint = e.o.tint ?? '160,175,255';
    const sy = y - 22, ey = ty - 18;
    const at = (q) => {
      q = clamp(q, 0, 1);
      return [x + (tx - x) * q, sy + (ey - sy) * q - Math.sin(q * Math.PI) * 14];
    };
    const q = e.age / dur;
    if (q < 1) {
      // trail
      for (let i = 8; i >= 1; i--) {
        const [px, py] = at(q - i * 0.035);
        const f = 1 - i / 9;
        ctx.fillStyle = `rgba(${tint},${0.5 * f})`;
        circle(ctx, px, py + Math.sin(e.age * 30 + i) * 1.5, 9 * f + 1.5);
      }
      const [px, py] = at(q);
      const g = ctx.createRadialGradient(px, py, 1, px, py, 24);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.35, `rgba(${tint},0.9)`);
      g.addColorStop(1, `rgba(${tint},0)`);
      ctx.fillStyle = g;
      circle(ctx, px, py, 24);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(e.age * 12);
      ctx.fillStyle = '#ffffff';
      star(ctx, 0, 0, 10, 4, 0.35);
      ctx.restore();
      return;
    }
    const b = (e.age - dur) / 0.35; // 0 → 1 after arriving
    const [px, py] = at(1);
    if (hit) {
      ctx.globalAlpha = 1 - b;
      ctx.strokeStyle = `rgb(${tint})`;
      ctx.lineWidth = 4 * (1 - b) + 1;
      ctx.beginPath();
      ctx.arc(px, py, 6 + b * 26, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      circle(ctx, px, py, 10 * (1 - b));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + e.seed;
        ctx.fillStyle = i % 2 ? '#ffffff' : '#fff6c4';
        star(ctx, px + Math.cos(a) * (8 + b * 26), py + Math.sin(a) * (8 + b * 26), 4 * (1 - b) + 1);
      }
    } else {
      // fizzle: the orb shrinks into a few drifting puffs
      ctx.globalAlpha = 1 - b;
      ctx.fillStyle = 'rgba(200,208,255,0.8)';
      circle(ctx, px, py, 7 * (1 - b));
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + e.seed;
        circle(ctx, px + Math.cos(a) * b * 12, py + Math.sin(a) * b * 8 - b * 10, 3.5 * (1 - b) + 0.5);
      }
    }
  },

  // A staff's normal attack (S1): a small, quick orb in the staff's colour (tint 'r,g,b'), a pop on a hit
  staffbolt(ctx, e) {
    const { x, y, tx, ty, hit } = e.o, dur = e.o.dur ?? 0.15, tint = e.o.tint ?? '190,200,255';
    const at = (q) => {
      q = clamp(q, 0, 1);
      return [x + (tx - x) * q, y + (ty - y) * q - Math.sin(q * Math.PI) * 6];
    };
    const q = e.age / dur;
    if (q < 1) {
      for (let i = 5; i >= 1; i--) {
        const [px, py] = at(q - i * 0.06);
        const f = 1 - i / 6;
        ctx.fillStyle = `rgba(${tint},${0.55 * f})`;
        circle(ctx, px, py, 6 * f + 1);
      }
      const [px, py] = at(q);
      ctx.fillStyle = `rgba(${tint},0.45)`;
      circle(ctx, px, py, 11);
      ctx.fillStyle = '#ffffff';
      circle(ctx, px, py, 4.5);
      return;
    }
    const b = (e.age - dur) / 0.25, [px, py] = at(1);
    ctx.globalAlpha = 1 - b;
    if (hit) {
      ctx.strokeStyle = `rgb(${tint})`;
      ctx.lineWidth = 3 * (1 - b) + 1;
      ctx.beginPath();
      ctx.arc(px, py, 4 + b * 16, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + e.seed;
        ctx.fillStyle = i % 2 ? '#ffffff' : `rgb(${tint})`;
        star(ctx, px + Math.cos(a) * (5 + b * 16), py + Math.sin(a) * (5 + b * 16), 3 * (1 - b) + 1);
      }
    } else {
      ctx.fillStyle = `rgba(${tint},0.8)`;
      circle(ctx, px, py, 5 * (1 - b));
      for (let i = 0; i < 3; i++) circle(ctx, px + Math.cos(i * 2 + e.seed) * b * 9, py - b * 8, 2.5 * (1 - b) + 0.5);
    }
  },

  // A Cleric's holy bolt (S3): a spinning golden star with a trail of little sparkles that drift down as it
  // flies; on a hit a ring, a cross of rays and a rising shower of stars; on a miss a soft fizzle of sparkles
  holybolt(ctx, e) {
    const { x, y, tx, ty, hit } = e.o, dur = e.o.dur ?? 0.15;
    const at = (q) => {
      q = clamp(q, 0, 1);
      return [x + (tx - x) * q, y + (ty - y) * q - Math.sin(q * Math.PI) * 8];
    };
    const q = e.age / dur;
    if (q < 1) {
      for (let i = 7; i >= 1; i--) {
        const [px, py] = at(q - i * 0.05);
        const f = 1 - i / 8;
        ctx.fillStyle = i % 2 ? `rgba(255,255,255,${0.7 * f})` : `rgba(255,222,120,${0.8 * f})`;
        star(ctx, px + Math.sin(i * 2.3 + e.seed) * 4, py + (1 - f) * 8, 4 * f + 1.2);
      }
      const [px, py] = at(q);
      ctx.fillStyle = 'rgba(255,226,130,0.4)';
      circle(ctx, px, py, 12);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(e.age * 14);
      ctx.fillStyle = '#ffe28a';
      star(ctx, 0, 0, 9, 4, 0.35);
      ctx.fillStyle = '#ffffff';
      star(ctx, 0, 0, 4.5, 4, 0.4);
      ctx.restore();
      return;
    }
    const b = (e.age - dur) / 0.4, [px, py] = at(1), fade = 1 - b;
    if (hit) {
      ctx.globalAlpha = fade;
      ctx.strokeStyle = '#ffe28a';
      ctx.lineWidth = 3 * fade + 1;
      ctx.beginPath();
      ctx.arc(px, py, 6 + ease(b) * 22, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,246,200,0.85)';
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((i / 4) * TAU + Math.PI / 4);
        ctx.fillRect(-1.5 * fade - 0.5, 4, 3 * fade + 1, 8 + ease(b) * 18);
        ctx.restore();
      }
      ctx.fillStyle = '#ffffff';
      star(ctx, px, py, 10 * fade + 2, 4, 0.35);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + e.seed, d = 6 + ease(b) * 20;
        ctx.fillStyle = i % 2 ? '#ffffff' : '#ffd86a';
        star(ctx, px + Math.cos(a) * d, py + Math.sin(a) * d - b * 18, 3.5 * fade + 1);
      }
    } else {
      ctx.globalAlpha = fade;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#ffffff' : '#ffe28a';
        star(ctx, px + Math.cos(i * 1.7 + e.seed) * b * 12, py - b * 14, 3 * fade + 0.8);
      }
    }
  },

  // A soft ring spreading from the caster, and hearts and sparkles rising from everyone healed
  heal(ctx, e, k) {
    const { x, y } = e.o, R = (e.o.radius ?? 170) * ease(Math.min(1, k / 0.6));
    const fade = 1 - k;
    ctx.save();
    ctx.translate(x, y - 4);
    ctx.scale(1, 0.3);
    ctx.globalAlpha = fade;
    const g = ctx.createRadialGradient(0, 0, R * 0.6, 0, 0, R);
    g.addColorStop(0, 'rgba(180,255,200,0)');
    g.addColorStop(0.85, 'rgba(180,255,200,0.35)');
    g.addColorStop(1, 'rgba(255,190,215,0)');
    ctx.fillStyle = g;
    circle(ctx, 0, 0, R);
    ctx.strokeStyle = 'rgba(255,170,205,0.9)';
    ctx.lineWidth = 4 / 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150,240,180,0.9)';
    ctx.lineWidth = 2 / 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.9, 0, TAU);
    ctx.stroke();
    ctx.restore();
    const targets = e.o.targets?.length ? e.o.targets : [{ x, y }];
    targets.forEach((t, ti) => {
      // a soft green glow on each target
      const gl = ctx.createRadialGradient(t.x, t.y - 20, 4, t.x, t.y - 20, 40);
      gl.addColorStop(0, `rgba(190,255,205,${0.45 * Math.sin(k * Math.PI)})`);
      gl.addColorStop(1, 'rgba(190,255,205,0)');
      ctx.fillStyle = gl;
      circle(ctx, t.x, t.y - 20, 40);
      for (let i = 0; i < 4; i++) {
        const s = clamp((k - i * 0.12) / 0.6, 0, 1);
        if (s <= 0 || s >= 1) continue;
        const hx = t.x + Math.sin(i * 2.3 + ti + e.seed) * 16 + Math.sin(s * 8 + i) * 3, hy = t.y - 30 - s * 46;
        ctx.globalAlpha = Math.sin(s * Math.PI);
        ctx.fillStyle = i % 2 ? '#ff8fb0' : '#ffb3c7';
        heart(ctx, hx, hy, 5 + (i % 2) * 1.5);
        ctx.fillStyle = '#c8ffd8';
        star(ctx, hx + 10, hy + 8, 3);
      }
      ctx.globalAlpha = 1;
    });
  },

  // An icy ring bursting out to its radius, with snowflakes riding it and frost shards on the ground
  // tint: none (frost), 'fire' (Fireball's burst: flames, no ice) or 'mana' (Mana Shield: sparkles)
  nova(ctx, e, k) {
    const { x, y } = e.o, R = (e.o.radius ?? 190) * ease(k), tint = e.o.tint;
    const [disc, ring] = tint === 'fire' ? ['255,200,140', '255,140,70'] : tint === 'mana' ? ['205,215,255', '140,160,255'] : ['200,235,255', '150,210,255'];
    const fade = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
    ctx.translate(x, y);
    ctx.globalAlpha = fade;
    // pale frosty disc and ring (flattened, lying on the ground and around the caster)
    ctx.save();
    ctx.translate(0, -18);
    ctx.scale(1, 0.5);
    const g = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, Math.max(1, R));
    g.addColorStop(0, `rgba(${disc},0.05)`);
    g.addColorStop(0.8, `rgba(${disc},0.3)`);
    g.addColorStop(1, `rgba(${disc},0)`);
    ctx.fillStyle = g;
    circle(ctx, 0, 0, Math.max(1, R));
    ctx.strokeStyle = `rgba(${ring},0.95)`;
    ctx.lineWidth = 7 / 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, R), 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2.5 / 0.5;
    ctx.stroke();
    ctx.restore();
    if (tint) {
      // flames (fire) or sparkles (mana) riding the ring instead of ice
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + e.seed, px = Math.cos(a) * R, py = -18 + Math.sin(a) * R * 0.5 - k * 10;
        ctx.fillStyle = tint === 'fire' ? (i % 2 ? '#ffd36b' : '#ff8a4a') : i % 2 ? '#ffffff' : '#c4cdff';
        if (tint === 'fire') flame(ctx, px, py + 6, 8, 14 * (1 - k * 0.6));
        else star(ctx, px, py, 4.5 * (1 - k) + 1);
      }
      return;
    }
    // ice shards poking up from the ground where the ring passes
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1, d = R * (0.35 + ((i * 37) % 60) / 100);
      const grow = clamp((R - d) / 40, 0, 1) * (1 - Math.max(0, k - 0.7) / 0.3);
      if (grow <= 0) continue;
      const sx = side * d, h = (10 + ((i * 13) % 9)) * grow, lean = side * 0.25;
      ctx.fillStyle = 'rgba(220,245,255,0.95)';
      ctx.strokeStyle = '#7ab8e8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx - 4, 0);
      ctx.lineTo(sx + lean * h, -h);
      ctx.lineTo(sx + 4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // snowflakes riding the ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + e.seed;
      snowflake(ctx, Math.cos(a) * R, -18 + Math.sin(a) * R * 0.5 - k * 10, 6, e.age * 3 + i);
    }
  },

  // Berserk kicks in: flames flare up round the caster and a warm ring bursts out
  buff(ctx, e, k) {
    const { x, y } = e.o;
    ctx.translate(x, y);
    const fade = 1 - k;
    ctx.globalAlpha = fade;
    ctx.strokeStyle = '#ff7a4a';
    ctx.lineWidth = 5 * fade + 1;
    ctx.beginPath();
    ctx.ellipse(0, -20, 20 + ease(k) * 50, (20 + ease(k) * 50) * 0.7, 0, 0, TAU);
    ctx.stroke();
    const rise = Math.sin(Math.min(1, k * 1.6) * Math.PI);
    for (let i = 0; i < 6; i++) { // flames flare up on both sides, clear of its face
      const fx = (i < 3 ? -1 : 1) * (18 + (i % 3) * 8), h = (30 + (i % 3) * 8) * rise;
      ctx.fillStyle = i % 2 ? '#ff5a3a' : '#ff9a3a';
      flame(ctx, fx, 2, 12, h + Math.sin(e.age * 30 + i) * 3);
      ctx.fillStyle = '#ffe27a';
      flame(ctx, fx, 1, 5, h * 0.45);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + e.seed, d = 14 + k * 46;
      ctx.fillStyle = i % 2 ? '#ffe27a' : '#ff9a3a';
      circle(ctx, Math.cos(a) * d, -22 + Math.sin(a) * d * 0.7 - k * 14, 3 * fade + 0.5);
    }
  },

  // Cleave {x, y, dir, reach}: one very wide crescent sweeping from overhead to the ground ahead
  cleave(ctx, e, k) {
    const { x, y } = e.o, dir = e.o.dir < 0 ? -1 : 1, R = (e.o.reach ?? 70) + 34;
    ctx.translate(x, y - 30);
    ctx.scale(dir, 0.72);
    const sweep = ease(Math.min(1, k / 0.42));
    const a0 = -2.1, a1 = a0 + 3.2 * sweep;
    const fade = k < 0.42 ? 1 : 1 - (k - 0.42) / 0.58;
    const band = (ro, ri, from, to, ox = 10) => {
      ctx.beginPath();
      ctx.arc(ox, 0, ro, from, to);
      ctx.arc(2, 0, ri, to, from, true);
      ctx.closePath();
      ctx.fill();
    };
    // after-images trailing the edge
    for (let i = 2; i >= 1; i--) {
      ctx.globalAlpha = fade * (0.25 / i);
      ctx.fillStyle = '#ffb49a';
      band(R + 4, R - 26, a0, Math.max(a0 + 0.01, a1 - i * 0.35));
    }
    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(255,170,140,0.35)';
    band(R + 14, R - 30, a0, a1, 14);
    ctx.fillStyle = '#ff9a7e';
    band(R + 6, R - 16, a0, a1);
    ctx.fillStyle = '#ffffff';
    band(R + 1, R - 7, a0 + 0.12, a1);
    // a sparkle on the leading tip, and speed lines across the front
    const tx = 10 + Math.cos(a1) * (R + 2), ty = Math.sin(a1) * (R + 2);
    ctx.fillStyle = '#fff6c4';
    star(ctx, tx, ty, 9 * (1 - k * 0.6));
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const [dy, len] of [[-24, 26], [-6, 36], [12, 30], [28, 20]]) {
      const sx = R * 0.5 + k * 40;
      ctx.moveTo(sx, dy);
      ctx.lineTo(sx + len * (1 - k), dy);
    }
    ctx.stroke();
  },

  // Blade Storm {x, y, radius, follow?, hits}: swords whirling round the caster, with a flash per hit
  storm(ctx, e, k) {
    const p = e.o.follow?.() ?? e.o, R = e.o.radius ?? 130, hits = e.o.hits ?? 4;
    const fade = Math.min(1, k / 0.1, (1 - k) / 0.2);
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = fade;
    // a wind disc lying on the ground
    ctx.save();
    ctx.translate(0, -20);
    ctx.scale(1, 0.42);
    const g = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
    g.addColorStop(0, 'rgba(255,220,200,0)');
    g.addColorStop(0.75, 'rgba(255,200,180,0.25)');
    g.addColorStop(1, 'rgba(255,200,180,0)');
    ctx.fillStyle = g;
    circle(ctx, 0, 0, R);
    const spin = e.age * 16;
    for (let i = 0; i < 3; i++) {
      const r = R * (0.5 + i * 0.22), a = spin * (1 + i * 0.2) + i * 2;
      ctx.strokeStyle = i === 1 ? 'rgba(255,154,126,0.85)' : 'rgba(255,255,255,0.9)';
      ctx.lineWidth = (4.5 - i) / 0.42;
      ctx.beginPath();
      ctx.arc(0, 0, r, a, a + 1.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r, a + Math.PI, a + Math.PI + 1.3);
      ctx.stroke();
    }
    ctx.restore();
    // six swords orbiting (the far ones dimmer, as if behind)
    for (let i = 0; i < 6; i++) {
      const a = spin + (i / 6) * TAU, r = R * 0.72;
      const sx = Math.cos(a) * r, sy = -20 + Math.sin(a) * r * 0.42, near = Math.sin(a) > 0;
      ctx.save();
      ctx.globalAlpha = fade * (near ? 1 : 0.55);
      ctx.translate(sx, sy);
      ctx.rotate(a + Math.PI);
      const s = near ? 1 : 0.8;
      ctx.scale(s, s);
      ctx.translate(0, 16);
      fxSword(ctx, 40, 5);
      ctx.restore();
    }
    // a flash for every hit: crossed slashes and a pulse
    for (let h = 0; h < hits; h++) {
      const t0 = 0.08 + h * (0.78 / hits), q = (e.age - t0) / 0.18;
      if (q < 0 || q > 1) continue;
      ctx.globalAlpha = fade * (1 - q);
      ctx.strokeStyle = 'rgba(255,240,230,0.9)';
      ctx.lineWidth = 4 * (1 - q) + 1;
      ctx.beginPath();
      ctx.ellipse(0, -20, R * (0.4 + 0.65 * q), R * (0.4 + 0.65 * q) * 0.45, 0, 0, TAU);
      ctx.stroke();
      for (let j = 0; j < 3; j++) {
        const a = rnd(e.seed + h, j) * TAU, d = R * (0.35 + 0.6 * rnd(e.seed + h, j + 9));
        const cx = Math.cos(a) * d, cy = -24 + Math.sin(a) * d * 0.4, L = 22 + 10 * (1 - q);
        for (const [lw, col] of [[7, 'rgba(255,154,126,0.7)'], [2.6, '#ffffff']]) {
          ctx.strokeStyle = col;
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(cx - L * 0.7, cy - L * 0.5);
          ctx.lineTo(cx + L * 0.7, cy + L * 0.5);
          ctx.moveTo(cx + L * 0.7, cy - L * 0.5);
          ctx.lineTo(cx - L * 0.7, cy + L * 0.5);
          ctx.stroke();
        }
        ctx.fillStyle = '#fff6c4';
        star(ctx, cx, cy, 6 * (1 - q) + 1);
      }
    }
  },

  // Sky Splitter {x, y, dir}: a giant overhead swing, then a beam and an enormous sword from the sky
  skysplit(ctx, e, k) {
    const { x, y } = e.o, dir = e.o.dir < 0 ? -1 : 1, tx = x + dir * 60, hitK = 0.3;
    // the overhead swing (behind everything else)
    ctx.save();
    ctx.translate(x, y - 62);
    ctx.scale(dir, 0.82);
    const sw = ease(Math.min(1, k / hitK)), a0 = -2.6, a1 = a0 + 3.5 * sw, R = 110;
    ctx.globalAlpha = k < hitK ? 1 : Math.max(0, 1 - (k - hitK) / 0.35);
    ctx.fillStyle = 'rgba(255,170,140,0.35)';
    ctx.beginPath();
    ctx.arc(14, 0, R + 16, a0, a1);
    ctx.arc(0, 0, R - 34, a1, a0, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff9a7e';
    ctx.beginPath();
    ctx.arc(12, 0, R + 6, a0, a1);
    ctx.arc(2, 0, R - 20, a1, a0, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(12, 0, R, a0 + 0.12, a1);
    ctx.arc(4, 0, R - 9, a1, a0 + 0.12, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // the beam from the sky
    const bk = clamp(k / 0.15, 0, 1), bf = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
    const top = y - 600, bot = top + (y - top) * ease(bk), w = 30 + 34 * Math.sin(Math.min(1, k / 0.5) * Math.PI * 0.5);
    ctx.globalAlpha = bf;
    let g = ctx.createLinearGradient(tx - w, 0, tx + w, 0);
    g.addColorStop(0, 'rgba(255,200,170,0)');
    g.addColorStop(0.3, 'rgba(255,190,160,0.45)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.7, 'rgba(255,190,160,0.45)');
    g.addColorStop(1, 'rgba(255,200,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(tx - w, top, w * 2, bot - top);
    // the enormous sword plunging down the beam
    const tipY = top + 40 + (y - 6 - top - 40) * ease(clamp(k / hitK, 0, 1)) ** 1.5;
    ctx.save();
    ctx.globalAlpha = k < hitK + 0.15 ? 1 : Math.max(0, 1 - (k - hitK - 0.15) / 0.3);
    ctx.translate(tx, tipY - 170);
    ctx.rotate(Math.PI);
    fxSword(ctx, 170, 13, '#ff9a7e');
    ctx.restore();
    if (k < hitK) return;
    // impact: flash, shockwave, cracks and flying debris
    const q = (k - hitK) / (1 - hitK);
    ctx.globalAlpha = 1 - q;
    g = ctx.createRadialGradient(tx, y - 20, 4, tx, y - 20, 90 + q * 40);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.4, 'rgba(255,200,170,0.5)');
    g.addColorStop(1, 'rgba(255,200,170,0)');
    ctx.fillStyle = g;
    circle(ctx, tx, y - 20, 90 + q * 40);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6 * (1 - q) + 1;
    ctx.beginPath();
    ctx.ellipse(tx, y - 2, 30 + ease(q) * 170, (30 + ease(q) * 170) * 0.2, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150,90,80,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const s = i % 2 ? 1 : -1, L = (24 + 30 * rnd(e.seed, i)) * Math.min(1, q * 4);
      ctx.moveTo(tx + s * 6, y);
      ctx.lineTo(tx + s * L * 0.5, y + 2 + rnd(e.seed, i + 3) * 3);
      ctx.lineTo(tx + s * L, y + 1);
    }
    ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const vx = (rnd(e.seed, i + 20) - 0.5) * 260, vy = -160 - 160 * rnd(e.seed, i + 30), t = q * 0.45;
      ctx.fillStyle = i % 3 ? '#c9a58a' : '#fff6c4';
      circle(ctx, tx + vx * t, y - 6 + vy * t + 900 * t * t, 4 - 2 * q);
    }
  },

  // Chain Lightning {points: [{x, y}, …]} (feet): arcs from the first point through the rest
  chain(ctx, e, k) {
    const pts = e.o.points ?? [];
    if (pts.length < 2) return;
    const lift = 22, flick = e.seed + Math.floor(e.age / 0.04), n = pts.length - 1;
    const fade = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
    for (let i = 0; i < n; i++) {
      const appear = (i / n) * 0.3, a = pts[i], b = pts[i + 1];
      if (k < appear) break;
      const grow = clamp((k - appear) / 0.06, 0, 1);
      const ax = a.x, ay = a.y - lift, bx = ax + (b.x - ax) * grow, by = ay + (b.y - lift - ay) * grow;
      ctx.globalAlpha = fade * (0.75 + 0.25 * rnd(flick, i));
      for (const [lw, col] of [[14, 'rgba(110,130,250,0.3)'], [7, '#6a7ae8'], [3.6, '#c4cdff'], [1.6, '#ffffff']]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        zigzag(ctx, ax, ay, bx, by, flick + i * 7, 16);
        ctx.stroke();
      }
      // a little forked branch
      const mx = ax + (bx - ax) * 0.5, my = ay + (by - ay) * 0.5;
      ctx.strokeStyle = 'rgba(106,122,232,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      zigzag(ctx, mx, my, mx + (rnd(flick, i + 40) - 0.5) * 50, my + 18 + rnd(flick, i + 50) * 16, flick + i, 6);
      ctx.stroke();
      // a crackle where it lands
      if (grow >= 1) {
        const q = clamp((k - appear - 0.06) / 0.5, 0, 1);
        const hg = ctx.createRadialGradient(b.x, b.y - lift, 1, b.x, b.y - lift, 26);
        hg.addColorStop(0, 'rgba(255,255,255,0.95)');
        hg.addColorStop(0.5, `rgba(150,165,255,${0.6 * (1 - q)})`);
        hg.addColorStop(1, 'rgba(150,165,255,0)');
        ctx.fillStyle = hg;
        circle(ctx, b.x, b.y - lift, 26);
        for (let j = 0; j < 5; j++) {
          const ang = (j / 5) * TAU + rnd(flick, j), d = 8 + q * 22;
          ctx.fillStyle = j % 2 ? '#fff6a8' : '#dfe4ff';
          star(ctx, b.x + Math.cos(ang) * d, b.y - lift + Math.sin(ang) * d, 4 * (1 - q) + 1);
        }
      }
    }
    // a spark at the caster's end
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#ffffff';
    star(ctx, pts[0].x, pts[0].y - lift, 9 * (1 - k) + 3, 4, 0.3);
  },

  // Meteor {x, y, radius, delay}: a flaming rock falls from the top left onto (x, y), then explodes
  meteor(ctx, e) {
    const { x, y } = e.o, R = e.o.radius ?? 150, d = e.o.delay ?? 0.8;
    if (e.age < d) {
      const q = e.age / d, f = q ** 1.6;
      // a warning circle on the ground
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.4 * q;
      ctx.strokeStyle = '#ff7a4a';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -e.age * 40;
      ctx.beginPath();
      ctx.ellipse(x, y - 2, R * (1.1 - 0.15 * q), R * (1.1 - 0.15 * q) * 0.22, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,140,80,0.18)';
      ctx.beginPath();
      ctx.ellipse(x, y - 2, R * q, R * q * 0.22, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      const sx = x - 340, sy = y - 600, mx = sx + (x - sx) * f, my = sy + (y - 14 - sy) * f;
      const ux = (x - sx), uy = (y - sy), ul = Math.hypot(ux, uy), nx = ux / ul, ny = uy / ul;
      const size = 16 + 10 * q;
      // flame trail
      for (let i = 10; i >= 1; i--) {
        const t = i * (10 + 8 * q), w = size * (1 - i / 12);
        ctx.globalAlpha = 0.75 * (1 - i / 11);
        ctx.fillStyle = i > 6 ? '#ff7a4a' : i > 3 ? '#ffa23a' : '#ffe27a';
        circle(ctx, mx - nx * t + Math.sin(e.age * 40 + i) * 2, my - ny * t, w);
      }
      ctx.globalAlpha = 1;
      const g = ctx.createRadialGradient(mx, my, 2, mx, my, size * 2.2);
      g.addColorStop(0, 'rgba(255,240,180,0.9)');
      g.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.fillStyle = g;
      circle(ctx, mx, my, size * 2.2);
      ctx.fillStyle = '#8a6a8e';
      ctx.strokeStyle = '#ffb04a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(mx, my, size, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#6a4f70';
      circle(ctx, mx + size * 0.3, my + size * 0.25, size * 0.25);
      circle(ctx, mx - size * 0.35, my - size * 0.1, size * 0.16);
      return;
    }
    // the explosion
    const b = clamp((e.age - d) / 0.6, 0, 1), eb = ease(b);
    ctx.globalAlpha = 1 - b;
    let g = ctx.createRadialGradient(x, y - R * 0.3, 4, x, y - R * 0.3, R * (0.5 + 0.6 * eb));
    g.addColorStop(0, 'rgba(255,255,240,1)');
    g.addColorStop(0.35, 'rgba(255,200,110,0.85)');
    g.addColorStop(0.7, 'rgba(255,120,70,0.5)');
    g.addColorStop(1, 'rgba(255,120,70,0)');
    ctx.fillStyle = g;
    circle(ctx, x, y - R * 0.3, R * (0.5 + 0.6 * eb));
    ctx.strokeStyle = '#ffd36b';
    ctx.lineWidth = 8 * (1 - b) + 1;
    ctx.beginPath();
    ctx.ellipse(x, y - 2, R * (0.3 + 0.8 * eb), R * (0.3 + 0.8 * eb) * 0.22, 0, 0, TAU);
    ctx.stroke();
    // flames licking up across the blast
    for (let i = 0; i < 9; i++) {
      const fx = x + (rnd(e.seed, i) - 0.5) * 1.6 * R * eb, h = (40 + 50 * rnd(e.seed, i + 9)) * Math.sin(Math.min(1, b * 2.2) * Math.PI * 0.5) * (1 - b);
      ctx.fillStyle = i % 2 ? '#ff7a4a' : '#ffa23a';
      flame(ctx, fx, y, 22, h);
      ctx.fillStyle = '#ffe27a';
      flame(ctx, fx, y, 9, h * 0.5);
    }
    // smoke puffs rising, and rocks flying
    for (let i = 0; i < 7; i++) {
      const a = rnd(e.seed, i + 30) * Math.PI + Math.PI, dd = R * 0.6 * eb;
      ctx.fillStyle = 'rgba(190,175,200,0.6)';
      circle(ctx, x + Math.cos(a) * dd, y - 30 + Math.sin(a) * dd * 0.6 - b * 30, 12 + 14 * b);
    }
    for (let i = 0; i < 10; i++) {
      const vx = (rnd(e.seed, i + 50) - 0.5) * 420, vy = -200 - 220 * rnd(e.seed, i + 60), t = b * 0.6;
      ctx.fillStyle = i % 3 ? '#8a6a8e' : '#ffb04a';
      circle(ctx, x + vx * t, y - 10 + vy * t + 800 * t * t, 4.5 - 2.5 * b);
    }
  },

  // Starfall {x, y, radius, targets: [{x, y}]}: stars streak down on every target and all over the radius
  starfall(ctx, e) {
    if (!e.stars) {
      const { x, y } = e.o, R = e.o.radius ?? 700;
      e.stars = (e.o.targets ?? []).map((t, i) => ({ x: t.x, y: t.y, t0: 0.05 + rnd(e.seed, i) * 0.45, big: true }));
      for (let i = 0; i < 18; i++) e.stars.push({ x: x + (rnd(e.seed, i + 100) - 0.5) * 2 * R, y, t0: rnd(e.seed, i + 200) * 0.7, big: false });
    }
    const fall = 0.28;
    // a faint starry shimmer over the whole area
    const all = Math.min(1, e.age / 0.2, (e.life - e.age) / 0.3);
    for (const s of e.stars) {
      const q = (e.age - s.t0) / fall;
      if (q < 0) continue;
      const ex = s.x, ey = s.y - (s.big ? 26 : 8), sx = ex - 150, sy = ey - 520, size = s.big ? 16 : 9;
      if (q < 1) {
        const px = sx + (ex - sx) * q, py = sy + (ey - sy) * q;
        const g = ctx.createLinearGradient(px - 75, py - 260, px, py);
        g.addColorStop(0, 'rgba(150,165,255,0)');
        g.addColorStop(0.7, 'rgba(160,175,255,0.6)');
        g.addColorStop(1, 'rgba(255,240,170,0.95)');
        ctx.globalAlpha = all;
        ctx.strokeStyle = g;
        ctx.lineWidth = size * 0.8;
        ctx.beginPath();
        ctx.moveTo(px - 75, py - 260);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(e.age * 8);
        ctx.fillStyle = '#ffe27a';
        ctx.strokeStyle = '#e0a83a';
        ctx.lineWidth = 2;
        star(ctx, 0, 0, size, 5, 0.48);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        star(ctx, 0, 0, size * 0.45, 5, 0.48);
        ctx.restore();
        continue;
      }
      const b = (e.age - s.t0 - fall) / 0.35;
      if (b > 1) continue;
      ctx.globalAlpha = all * (1 - b);
      const g = ctx.createRadialGradient(ex, ey, 1, ex, ey, size * 3.5);
      g.addColorStop(0, 'rgba(255,255,240,0.95)');
      g.addColorStop(0.45, 'rgba(255,220,120,0.6)');
      g.addColorStop(1, 'rgba(150,165,255,0)');
      ctx.fillStyle = g;
      circle(ctx, ex, ey, size * 3.5 * (0.6 + 0.4 * b));
      for (let j = 0; j < 5; j++) {
        const a = (j / 5) * TAU + s.t0 * 10, dd = size * (0.8 + 2.4 * ease(b));
        ctx.fillStyle = j % 2 ? '#ffd36b' : '#8f9dff';
        star(ctx, ex + Math.cos(a) * dd, ey + Math.sin(a) * dd, size * 0.4 * (1 - b) + 1);
      }
    }
  },

  // Jelly Bubble pops {x, y}: the bubble bursts into droplets (it just blocked a hit)
  bubblePop(ctx, e, k) {
    const { x, y } = e.o, cx = x, cy = y - 22, R = 34 + ease(k) * 16;
    ctx.globalAlpha = 1 - k;
    for (const [lw, col] of [[3 * (1 - k) + 3.5, 'rgba(80,190,160,0.6)'], [3 * (1 - k) + 1, 'rgba(255,255,255,0.95)']]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + e.seed;
        ctx.beginPath();
        ctx.arc(cx, cy, R, a, a + 0.45 * (1 - k) + 0.05);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(170,240,215,0.25)';
    circle(ctx, cx, cy, 34 * (1 - k));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + rnd(e.seed, i), d = 30 + ease(k) * (30 + 20 * rnd(e.seed, i + 5));
      ctx.fillStyle = i % 2 ? '#8fe0c0' : '#ffffff';
      circle(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d + k * k * 20, 3.2 * (1 - k) + 0.8);
    }
    ctx.fillStyle = '#ffffff';
    star(ctx, cx, cy - 4, 14 * (1 - k), 4, 0.3);
  },

  // Rally {x, y, radius}: a heroic burst of golden rays, a ring out to the radius and a banner pop
  rally(ctx, e, k) {
    const { x, y } = e.o, R = e.o.radius ?? 300, ek = ease(k);
    ctx.translate(x, y);
    const fade = k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5;
    ctx.globalAlpha = fade;
    // ground ring sweeping out to the radius
    ctx.strokeStyle = 'rgba(255,211,107,0.9)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, -2, R * ek, R * ek * 0.2, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,154,126,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -2, R * ek * 0.9, R * ek * 0.18, 0, 0, TAU);
    ctx.stroke();
    // rays
    const g = ctx.createRadialGradient(0, -22, 4, 0, -22, 100);
    g.addColorStop(0, 'rgba(255,240,180,0.85)');
    g.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = g;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + e.seed, L = 30 + 70 * ek, w = 0.11;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - w) * 14, -22 + Math.sin(a - w) * 14);
      ctx.lineTo(Math.cos(a) * L, -22 + Math.sin(a) * L);
      ctx.lineTo(Math.cos(a + w) * 14, -22 + Math.sin(a + w) * 14);
      ctx.fill();
    }
    // a little banner popping up over the head
    const pop = Math.min(1, k / 0.25), s = ease(pop) * (1 + 0.15 * Math.sin(pop * Math.PI));
    ctx.save();
    ctx.translate(0, -58 - 14 * ek);
    ctx.scale(s, s);
    ctx.strokeStyle = '#a8742a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-10, 16);
    ctx.lineTo(-10, -14);
    ctx.stroke();
    ctx.fillStyle = '#ffd36b';
    circle(ctx, -10, -15, 3);
    ctx.fillStyle = '#ff9a7e';
    ctx.beginPath();
    const wv = Math.sin(e.age * 14) * 2;
    ctx.moveTo(-9, -12);
    ctx.quadraticCurveTo(2, -16 + wv, 16, -12);
    ctx.lineTo(12, -4);
    ctx.lineTo(16, 4);
    ctx.quadraticCurveTo(4, 0 + wv, -9, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    star(ctx, 3, -4, 5, 5, 0.45);
    ctx.restore();
    // golden sparks flying up
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + e.seed, d = 16 + ek * 60;
      ctx.fillStyle = i % 2 ? '#ffe27a' : '#fff6c4';
      star(ctx, Math.cos(a) * d, -24 + Math.sin(a) * d * 0.6 - k * 30, 4 * (1 - k) + 1);
    }
  },

  // Sanctuary {x, y, radius, dur}: a holy circle on the floor with a soft dome and rising motes
  zone(ctx, e) {
    const { x, y } = e.o, R = e.o.radius ?? 160, t = e.age;
    const a = clamp(Math.min(t / 0.4, (e.life - t) / 0.6), 0, 1);
    const grow = 0.6 + 0.4 * ease(Math.min(1, t / 0.4));
    const r = R * grow, flat = 0.22;
    ctx.translate(x, y);
    ctx.globalAlpha = a;
    // the dome
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.78, 0, Math.PI, TAU);
    ctx.ellipse(0, 0, r, r * flat, 0, 0, Math.PI);
    ctx.closePath();
    const dg = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
    dg.addColorStop(0, 'rgba(255,250,220,0.04)');
    dg.addColorStop(0.75, 'rgba(220,255,235,0.14)');
    dg.addColorStop(1, 'rgba(255,240,180,0.3)');
    ctx.fillStyle = dg;
    ctx.fill();
    ctx.strokeStyle = `rgba(255,240,190,${0.6 + 0.15 * Math.sin(t * 3)})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.78, 0, Math.PI, TAU);
    ctx.stroke();
    // a shimmer sliding over the dome
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.78, 0, Math.PI, TAU);
    ctx.clip();
    const sx = ((t * 0.35) % 1) * r * 3 - r * 1.5;
    const sg = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, 'rgba(255,255,255,0.16)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(-r, -r, r * 2, r);
    ctx.restore();
    // the holy circle on the floor
    ctx.save();
    ctx.scale(1, flat);
    const fg = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    fg.addColorStop(0, 'rgba(255,248,210,0.5)');
    fg.addColorStop(0.7, 'rgba(200,250,220,0.32)');
    fg.addColorStop(1, 'rgba(255,240,170,0.1)');
    ctx.fillStyle = fg;
    ctx.restore();
    const ring = (rr, lw, col) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.ellipse(0, 0, rr, rr * flat, 0, 0, TAU);
      ctx.stroke();
    };
    ring(r, 5, 'rgba(240,200,90,0.9)');
    ring(r, 2, 'rgba(255,250,220,0.95)');
    ring(r * 0.86, 2, 'rgba(90,200,150,0.8)');
    ctx.setLineDash([r * 0.12, r * 0.08]);
    ctx.lineDashOffset = -t * 30;
    ring(r * 0.62, 1.6, 'rgba(255,255,255,0.8)');
    ctx.setLineDash([]);
    // rune stars circling on the floor
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * TAU + t * 0.6;
      ctx.fillStyle = i % 2 ? '#fff6c4' : '#d8ffe8';
      star(ctx, Math.cos(an) * r * 0.74, Math.sin(an) * r * 0.74 * flat, 4 + 1.5 * Math.sin(t * 4 + i), 4, 0.4);
    }
    // motes drifting up
    for (let i = 0; i < 16; i++) {
      const q = (t * 0.45 + rnd(e.seed, i)) % 1, mx = (rnd(e.seed, i + 30) - 0.5) * 1.7 * r;
      const top = Math.sqrt(Math.max(0, 1 - (mx / r) ** 2)) * r * 0.75;
      ctx.globalAlpha = a * Math.sin(q * Math.PI) * 0.9;
      ctx.fillStyle = i % 3 ? '#fff6c4' : '#c8ffd8';
      circle(ctx, mx + Math.sin(t * 2 + i) * 4, -q * top, 2.2 + (i % 2));
    }
  },

  // Aegis {x, y, radius}: a shimmering golden dome bursting out to the radius
  aegis(ctx, e, k) {
    const { x, y } = e.o, R = (e.o.radius ?? 260) * (0.15 + 0.85 * ease(Math.min(1, k / 0.55)));
    const fade = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45, H = R * 0.7;
    ctx.translate(x, y);
    ctx.globalAlpha = fade;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, R, H, 0, Math.PI, TAU);
    ctx.ellipse(0, 0, R, R * 0.1, 0, 0, Math.PI);
    ctx.closePath();
    const g = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, R);
    g.addColorStop(0, 'rgba(255,240,170,0.08)');
    g.addColorStop(0.8, 'rgba(255,220,120,0.25)');
    g.addColorStop(1, 'rgba(255,210,100,0.5)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.clip();
    // a honeycomb-ish lattice of meridians and rings
    ctx.strokeStyle = 'rgba(255,245,200,0.5)';
    ctx.lineWidth = 1.4;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, R * (i / 4), H, 0, Math.PI, TAU);
      ctx.stroke();
    }
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(0, -H * (i / 3) * 0.9, R * Math.sqrt(1 - ((i / 3) * 0.9) ** 2), R * 0.1 * Math.sqrt(1 - ((i / 3) * 0.9) ** 2), 0, 0, TAU);
      ctx.stroke();
    }
    const sx = -R + k * R * 2.4;
    const sg = ctx.createLinearGradient(sx - 50, -H, sx + 50, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, 'rgba(255,255,255,0.45)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(-R, -H, R * 2, H + R * 0.1);
    ctx.restore();
    ctx.strokeStyle = '#ffd36b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, R, H, 0, Math.PI, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,211,107,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, R, R * 0.1, 0, 0, Math.PI);
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const an = Math.PI + (i / 8) * Math.PI;
      ctx.fillStyle = i % 2 ? '#ffffff' : '#fff6c4';
      star(ctx, Math.cos(an) * R, Math.sin(an) * H, 6 * (1 - k) + 2);
    }
  },

  // Second Wind {x, y}: a lethal hit survived: a pillar of light, wings flaring and feathers falling
  secondwind(ctx, e, k) {
    const { x, y } = e.o;
    ctx.translate(x, y);
    // pillar of light
    const pf = k < 0.4 ? 1 : 1 - (k - 0.4) / 0.6, w = 34 * (0.5 + 0.5 * Math.sin(Math.min(1, k / 0.15) * Math.PI * 0.5)) * pf;
    let g = ctx.createLinearGradient(-w, 0, w, 0);
    g.addColorStop(0, 'rgba(255,240,200,0)');
    g.addColorStop(0.5, 'rgba(255,255,245,0.9)');
    g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g;
    for (let i = 0; i < 10; i++) { // fading out towards the top
      ctx.globalAlpha = pf * (1 - i / 10);
      ctx.fillRect(-w, -(i + 1) * 30, w * 2, 30.5);
    }
    // flash
    g = ctx.createRadialGradient(0, -22, 2, 0, -22, 70);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.globalAlpha = Math.max(0, 1 - k * 2);
    ctx.fillStyle = g;
    circle(ctx, 0, -22, 70);
    // ring
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = '#fff3b0';
    ctx.lineWidth = 4 * (1 - k) + 1;
    ctx.beginPath();
    ctx.ellipse(0, -22, 14 + ease(k) * 70, (14 + ease(k) * 70) * 0.75, 0, 0, TAU);
    ctx.stroke();
    // wings flaring open behind it
    const open = ease(Math.min(1, k / 0.3)), wf = k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5;
    ctx.globalAlpha = wf * 0.9;
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * 22, -26);
      ctx.scale(s * 1.2, 1.2);
      ctx.rotate(-0.8 + 0.6 * open);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeStyle = 'rgba(230,205,140,0.9)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.quadraticCurveTo(20, -36, 52, -30);
      ctx.quadraticCurveTo(50, -18, 40, -15);
      ctx.quadraticCurveTo(48, -6, 36, -2);
      ctx.quadraticCurveTo(42, 6, 28, 8);
      ctx.quadraticCurveTo(14, 14, 0, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // feathers drifting out and down
    for (let i = 0; i < 10; i++) {
      const s = i % 2 ? 1 : -1, d = 20 + ease(k) * (50 + 40 * rnd(e.seed, i));
      const fx = s * d + Math.sin(e.age * 5 + i) * 6, fy = -40 - 40 * rnd(e.seed, i + 10) + k * k * 70;
      ctx.globalAlpha = (1 - k) * 0.95;
      ctx.fillStyle = '#fffaf0';
      feather(ctx, fx, fy, 14, s * (0.6 + e.age * 3) + i);
    }
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = '#fff6c4';
    for (let i = 0; i < 6; i++) {
      const an = (i / 6) * TAU + e.seed, d = 12 + ease(k) * 40;
      star(ctx, Math.cos(an) * d, -22 + Math.sin(an) * d - k * 20, 4 * (1 - k) + 1);
    }
  },

  // A skill point learned: a little ring of sparkles
  levelskill(ctx, e, k) {
    const { x, y } = e.o;
    ctx.translate(x, y - 24);
    ctx.globalAlpha = 1 - k;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + e.seed, d = 10 + ease(k) * 36;
      ctx.fillStyle = i % 2 ? '#fff6c4' : i % 4 ? '#c4cdff' : '#ffc4b0';
      star(ctx, Math.cos(a) * d, Math.sin(a) * d - k * 16, 4.5 * (1 - k) + 1);
    }
    ctx.strokeStyle = 'rgba(255,240,180,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -k * 16, 6 + ease(k) * 26, 0, TAU);
    ctx.stroke();
  },

  // ——— Mobility ———

  // Dash: afterimages and speed streaks along the ~180 px burst (x, y = where it started)
  dash(ctx, e, k) {
    const { x, y } = e.o, dir = e.o.dir < 0 ? -1 : 1, D = e.o.dist ?? 180;
    const p = ease(Math.min(1, k / 0.55)), head = D * p, fade = 1 - ease(k);
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    // a gust of dust kicked up where it set off
    for (let i = 0; i < 4; i++) {
      const d = 6 + ease(k) * (14 + i * 6);
      ctx.globalAlpha = fade * 0.75;
      ctx.fillStyle = 'rgba(240,250,255,0.9)';
      circle(ctx, -d, -3 - i * 3 - k * 6, (6 - i) * (1 - k * 0.6));
    }
    // streaks from the start to the slime's front
    const g = ctx.createLinearGradient(0, 0, head + 20, 0);
    g.addColorStop(0, 'rgba(95,196,216,0)');
    g.addColorStop(1, 'rgba(210,248,255,0.9)');
    for (let i = 0; i < 5; i++) {
      const yy = -6 - i * 8, len = head * (0.55 + 0.45 * rnd(e.seed, i)), lag = k * 40 * rnd(e.seed, i + 5);
      const x0 = head + 10 - len + lag, x1 = Math.max(x0, head - 4 + (i % 2) * 8);
      ctx.globalAlpha = fade;
      ctx.strokeStyle = 'rgba(95,196,216,0.45)';
      ctx.lineWidth = i === 2 ? 8 : 6;
      ctx.beginPath();
      ctx.moveTo(x0, yy);
      ctx.lineTo(x1, yy);
      ctx.stroke();
      ctx.strokeStyle = g;
      ctx.lineWidth = i === 2 ? 3.5 : 2.4;
      ctx.stroke();
    }
    // jelly afterimages, fading towards the back
    for (let i = 1; i <= 3; i++) {
      const ax = head * (1 - i * 0.24);
      if (ax < 2) continue;
      ctx.globalAlpha = fade * (0.75 - i * 0.18);
      ctx.fillStyle = '#a8ecff';
      jellyBlob(ctx, ax, 0, 46 - i * 2, 38 - i * 2, 0.3);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // a little shock ring at the front at the start
    if (k < 0.5) {
      const q = k / 0.5;
      ctx.globalAlpha = 1 - q;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(head + 26, -20, 4 + q * 6, 14 + q * 10, 0, -1.2, 1.2);
      ctx.stroke();
    }
  },

  // Blink: a shimmer collapsing where it left (x0) and a sparkling pop where it appears (x1)
  blink(ctx, e, k) {
    const { x0, x1, y } = e.o;
    // where it left: a ghost outline sucked into a point, sparkles spiralling in
    const out = Math.min(1, k / 0.6);
    ctx.save();
    ctx.translate(x0, y);
    ctx.globalAlpha = 1 - out;
    ctx.save();
    ctx.translate(0, -20);
    ctx.scale(1 - out * 0.8, 1 + out * 0.6);
    ctx.translate(0, 20);
    ctx.fillStyle = 'rgba(190,240,255,0.45)';
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -e.age * 40;
    jellyBlob(ctx, 0, 0, 48, 40);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + e.seed + out * 3, d = 40 * (1 - ease(out)) + 4;
      ctx.fillStyle = i % 2 ? '#ffffff' : '#bfefff';
      star(ctx, Math.cos(a) * d, -20 + Math.sin(a) * d * 0.8, 3.5 * (1 - out) + 1);
    }
    ctx.restore();
    // where it appears: a flash, a ring and a burst of stars
    const q = clamp((k - 0.08) / 0.92, 0, 1);
    if (q <= 0) return;
    ctx.translate(x1, y - 20);
    const fl = ctx.createRadialGradient(0, 0, 2, 0, 0, 46);
    fl.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - q)})`);
    fl.addColorStop(0.5, `rgba(170,235,255,${0.5 * (1 - q)})`);
    fl.addColorStop(1, 'rgba(170,235,255,0)');
    ctx.fillStyle = fl;
    circle(ctx, 0, 0, 46);
    ctx.globalAlpha = 1 - q;
    ctx.strokeStyle = '#8fe4f4';
    ctx.lineWidth = 4 * (1 - q) + 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 + ease(q) * 42, (10 + ease(q) * 42) * 0.8, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + e.seed, r0 = 12 + ease(q) * 22;
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * (r0 + 10 * (1 - q)), Math.sin(a) * (r0 + 10 * (1 - q)));
    }
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + e.seed * 2, d = 14 + ease(q) * (30 + 14 * rnd(e.seed, i));
      ctx.fillStyle = i % 2 ? '#fff6c4' : '#ffffff';
      star(ctx, Math.cos(a) * d, Math.sin(a) * d * 0.85 - q * 8, 4.5 * (1 - q) + 1);
    }
  },

  // Flash Jump: a puff of wind bursting out under the slime as it jumps again in mid-air
  flashjump(ctx, e, k) {
    const { x, y } = e.o, dir = e.o.dir < 0 ? -1 : 1, q = ease(k);
    ctx.translate(x, y + 2);
    ctx.scale(dir, 1);
    ctx.globalAlpha = 1 - k;
    // a flat ring of air spreading under its feet
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 3.5 * (1 - k) + 1;
    ctx.beginPath();
    ctx.ellipse(-6 - q * 10, 4 + q * 8, 18 + q * 36, 4 + q * 8, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(95,196,216,0.9)';
    ctx.lineWidth = 2.5 * (1 - k) + 1;
    ctx.beginPath();
    ctx.ellipse(-6 - q * 10, 4 + q * 8, 10 + q * 22, 2.5 + q * 5, 0, 0, TAU);
    ctx.stroke();
    // swooshes of air pushed down and back
    for (const [lw, c] of [[6, 'rgba(95,196,216,0.4)'], [2.6, 'rgba(255,255,255,0.95)']]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = lw;
      ctx.beginPath();
      for (const s of [-1, 1]) {
        ctx.moveTo(s * 14 - 4, -2);
        ctx.quadraticCurveTo(s * (20 + q * 12) - 8, 4 + q * 6, s * (16 + q * 24) - 16 * q - 6, 14 + q * 20);
      }
      ctx.stroke();
    }
    // little puffs flying out behind
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.55 + 0.45 * rnd(e.seed, i)), d = 8 + q * (24 + 12 * rnd(e.seed, i + 3));
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.9)' : 'rgba(200,245,255,0.9)';
      circle(ctx, Math.cos(a) * d - 6, 4 + Math.sin(a) * d * 0.5, (4.5 - i * 0.5) * (1 - k * 0.7));
    }
    // speed ticks up its sides
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const sx of [-24, 24]) {
      ctx.moveTo(sx, -10 + q * 14);
      ctx.lineTo(sx, 2 + q * 18);
    }
    ctx.stroke();
  },

  // A scroll used on gear: the result over the slime's head. ok = a golden burst and rising stars,
  // fail = a grey puff that fizzles, boom = a dark crack and the item shattering
  scroll(ctx, e, k) {
    const p = e.o.follow?.() ?? e.o, r = e.o.result;
    ctx.translate(p.x, p.y - 62);
    // the scroll's magic circle gathering first (shared by all three)
    const gather = clamp(k / 0.22, 0, 1), after = clamp((k - 0.22) / 0.78, 0, 1);
    if (k < 0.3) {
      ctx.save();
      ctx.globalAlpha = k < 0.22 ? 0.9 : 0.9 * (1 - (k - 0.22) / 0.08);
      ctx.rotate(e.age * 4);
      ctx.strokeStyle = r === 'boom' ? '#b48aff' : '#ffe9a0';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 30 - gather * 16, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU, d = 30 - gather * 18;
        ctx.fillStyle = '#ffffff';
        star(ctx, Math.cos(a) * d, Math.sin(a) * d, 2.5);
      }
      ctx.restore();
    }
    if (after <= 0) return;
    const q = after, fade = q < 0.65 ? 1 : 1 - (q - 0.65) / 0.35;
    if (r === 'ok') {
      // a golden flash with turning rays, a ring, and stars rising and twinkling
      ctx.save();
      ctx.globalAlpha = fade;
      const fl = ctx.createRadialGradient(0, 0, 2, 0, 0, 60);
      fl.addColorStop(0, `rgba(255,255,230,${0.95 * (1 - q * 0.8)})`);
      fl.addColorStop(0.4, `rgba(255,220,110,${0.55 * (1 - q * 0.6)})`);
      fl.addColorStop(1, 'rgba(255,210,90,0)');
      ctx.fillStyle = fl;
      circle(ctx, 0, 0, 60);
      ctx.rotate(e.age * 0.9);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU, len = (i % 2 ? 34 : 50) * (0.6 + 0.4 * ease(Math.min(1, q * 3)));
        ctx.fillStyle = i % 2 ? 'rgba(255,246,200,0.55)' : 'rgba(255,224,120,0.6)';
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - 0.08) * 10, Math.sin(a - 0.08) * 10);
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        ctx.lineTo(Math.cos(a + 0.08) * 10, Math.sin(a + 0.08) * 10);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = Math.max(0, 1 - q * 1.6);
      ctx.strokeStyle = '#ffd36b';
      ctx.lineWidth = 4 * (1 - q) + 1;
      ctx.beginPath();
      ctx.arc(0, 0, 12 + ease(q) * 50, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const s = clamp((q - rnd(e.seed, i) * 0.3) / 0.7, 0, 1);
        if (s <= 0 || s >= 1) continue;
        const sx = (rnd(e.seed, i + 20) - 0.5) * 80 + Math.sin(s * 6 + i) * 4, sy = 20 - s * (60 + 30 * rnd(e.seed, i + 40));
        ctx.globalAlpha = Math.sin(s * Math.PI);
        ctx.fillStyle = i % 3 ? '#fff6c4' : '#ffffff';
        star(ctx, sx, sy, (3 + 3 * rnd(e.seed, i + 60)) * (0.8 + 0.3 * Math.sin(e.age * 20 + i)));
      }
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#ffffff';
      star(ctx, 0, 0, 14 * (1 - q) + 2, 4, 0.3);
    } else if (r === 'fail') {
      // a grey puff that sags and fizzles, with a couple of dud sparks dropping
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + e.seed, d = 6 + ease(q) * (16 + 8 * rnd(e.seed, i));
        ctx.globalAlpha = fade * 0.85;
        ctx.fillStyle = i % 2 ? '#c9c6d2' : '#b2aebe';
        circle(ctx, Math.cos(a) * d, Math.sin(a) * d * 0.7 + q * 10, (11 - i % 3 * 2) * (1 - q * 0.5));
      }
      ctx.globalAlpha = fade * 0.9;
      ctx.fillStyle = '#e4e2ea';
      circle(ctx, 0, q * 10, 12 * (1 - q * 0.4));
      for (let i = 0; i < 4; i++) {
        const s = clamp(q * 1.2 - i * 0.1, 0, 1);
        ctx.globalAlpha = (1 - s) * 0.9;
        ctx.fillStyle = '#8a8698';
        star(ctx, (i - 1.5) * 14, 10 + s * s * 40, 2.6 * (1 - s) + 0.6);
      }
      // a sad little curl of smoke rising
      ctx.globalAlpha = fade * 0.6;
      ctx.strokeStyle = '#a8a4b4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let j = 0; j <= 10; j++) {
        const yy = -10 - j * 3 * (0.4 + q), xx = Math.sin(j * 0.8 + e.age * 4) * 4;
        j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke();
    } else {
      // boom: a dark flash, jagged cracks splitting outwards, shards flying and falling, smoke
      ctx.save();
      ctx.globalAlpha = fade;
      const fl = ctx.createRadialGradient(0, 0, 2, 0, 0, 56);
      fl.addColorStop(0, `rgba(60,30,90,${0.85 * (1 - q * 0.5)})`);
      fl.addColorStop(0.6, `rgba(120,60,180,${0.4 * (1 - q)})`);
      fl.addColorStop(1, 'rgba(120,60,180,0)');
      ctx.fillStyle = fl;
      circle(ctx, 0, 0, 56);
      const grow = ease(Math.min(1, q * 4));
      for (const [lw, c] of [[5, '#2e1a40'], [2, '#d0a8ff']]) {
        ctx.strokeStyle = c;
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + e.seed;
          let px = 0, py = 0;
          ctx.moveTo(0, 0);
          for (let j = 1; j <= 3; j++) {
            const d = j * 12 * grow, wob = (rnd(e.seed, i * 3 + j) - 0.5) * 0.9;
            px = Math.cos(a + wob) * d;
            py = Math.sin(a + wob) * d;
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }
      ctx.restore();
      // shards of the destroyed item, spinning out and falling
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + e.seed, sp = 50 + 40 * rnd(e.seed, i + 7);
        const sx = Math.cos(a) * sp * q, sy = Math.sin(a) * sp * q * 0.8 + 90 * q * q;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(e.age * (6 + i) + i);
        ctx.globalAlpha = Math.max(0, 1 - q * 1.1);
        ctx.fillStyle = i % 3 ? '#4a3a62' : '#c4b0e8';
        ctx.strokeStyle = '#1e1428';
        ctx.lineWidth = 1;
        const sz = 3 + 3 * rnd(e.seed, i + 30);
        ctx.beginPath();
        ctx.moveTo(-sz, -sz * 0.4);
        ctx.lineTo(sz * 0.3, -sz);
        ctx.lineTo(sz, sz * 0.6);
        ctx.lineTo(-sz * 0.2, sz * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      // dark smoke billowing up
      for (let i = 0; i < 6; i++) {
        const s = clamp(q * 1.3 - i * 0.06, 0, 1);
        ctx.globalAlpha = Math.sin(s * Math.PI) * 0.6;
        ctx.fillStyle = i % 2 ? '#5a5068' : '#6e6680';
        circle(ctx, (rnd(e.seed, i + 50) - 0.5) * 40, -s * 40 - i * 3, 8 + s * 10);
      }
    }
  },

  // I-frames: a faint shimmering outline round a slime while nothing can touch it
  iframe(ctx, e, k) {
    const p = e.o.follow?.() ?? e.o;
    if (!p) return;
    ctx.translate(p.x, p.y);
    const a = Math.sin(k * Math.PI), fl = 0.7 + 0.3 * Math.sin(e.age * 50);
    ctx.globalAlpha = a * 0.5 * fl;
    ctx.fillStyle = 'rgba(200,245,255,0.35)';
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2;
    jellyBlob(ctx, 0, 2, 58, 50);
    ctx.stroke();
    ctx.save();
    ctx.clip();
    const sy = -50 + k * 70; // a shine sweeping up through it
    const g = ctx.createLinearGradient(0, sy - 10, 0, sy + 10);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-34, sy - 10, 68, 20);
    ctx.restore();
    ctx.globalAlpha = a * 0.8;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) {
      const an = e.age * 5 + (i / 3) * TAU;
      star(ctx, Math.cos(an) * 30, -22 + Math.sin(an) * 24, 2.2);
    }
  },
};

// While Challenge the Gods is up (feet at x, y; left: seconds to go): the slime glows white (owner), a pulse
// quickening as the end nears, red sparks circling. Drawn before the slime.
export function drawGodsAura(ctx, x, y, time, left) {
  ctx.save();
  ctx.translate(x, y);
  const beat = 0.5 + 0.5 * Math.sin(time * (6 + Math.max(0, 15 - left) * 0.8)); // the heart races
  const g = ctx.createRadialGradient(0, -20, 10, 0, -20, 58);
  g.addColorStop(0, `rgba(255,255,255,${0.6 + 0.3 * beat})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -20, 58, 50, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.45 + 0.45 * beat;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -20, 34 + 4 * beat, 30 + 4 * beat, 0, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 6; i++) {
    const a = time * 2.6 + (i / 6) * TAU;
    ctx.fillStyle = i % 2 ? '#ffffff' : '#fff2c0';
    star(ctx, Math.cos(a) * 36, -22 + Math.sin(a) * 14, 3);
  }
  ctx.restore();
}

// A flickering warm aura round a slime (feet at x, y) while Berserk is on. Drawn before the slime.
export function drawBerserkAura(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  const pulse = 0.85 + 0.15 * Math.sin(time * 9);
  const g = ctx.createRadialGradient(0, -20, 8, 0, -20, 46);
  g.addColorStop(0, `rgba(255,110,60,${0.5 * pulse})`);
  g.addColorStop(1, 'rgba(255,120,70,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -20, 46, 40, 0, 0, TAU);
  ctx.fill();
  // flame tongues licking up round its outline
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (1.0 + (i / 8) * 1.0); // left side → over the top → right side
    const fx = Math.cos(a) * 31, fy = -14 + Math.sin(a) * 32;
    const h = 20 + 7 * Math.sin(time * 14 + i * 1.7) + (i % 2) * 6;
    ctx.save();
    ctx.translate(fx, fy + 4);
    ctx.rotate((a - Math.PI * 1.5) * 0.6); // leaning outward, mostly up
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = i % 2 ? '#ff6a3a' : '#ff9a4a';
    flame(ctx, 0, 0, 11, h);
    ctx.fillStyle = '#ffd36b';
    flame(ctx, 0, -1, 4, h * 0.5);
    ctx.restore();
  }
  // embers drifting up
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.9 + i / 4) % 1;
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
    ctx.fillStyle = '#ffb04a';
    circle(ctx, Math.sin(i * 2.4 + time * 2) * 22, -10 - k * 50, 2);
  }
  ctx.restore();
}

// A wobbly translucent jelly bubble round a slime (feet at x, y) while Jelly Bubble is up. Drawn before the slime.
// A Cleric's Barrier (S3) as worn: a thin golden shell of hexagons, brighter the more it still soaks up (f: 0–1)
export function drawBarrier(ctx, x, y, time, f = 1) {
  ctx.save();
  ctx.translate(x, y - 22);
  ctx.globalAlpha = 0.35 + 0.45 * f;
  ctx.strokeStyle = 'rgba(255,217,106,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 38, 35, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,245,200,0.7)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + time * 0.6, hx = Math.cos(a) * 34, hy = Math.sin(a) * 31;
    ctx.beginPath();
    for (let j = 0; j <= 6; j++) {
      const b = (j / 6) * TAU;
      ctx[j ? 'lineTo' : 'moveTo'](hx + Math.cos(b) * 5, hy + Math.sin(b) * 5);
    }
    ctx.stroke();
  }
  ctx.restore();
}
export function drawBubble(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y - 22);
  const path = () => {
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * TAU;
      const r = 36 + 1.8 * Math.sin(a * 3 + time * 4) + 1.2 * Math.sin(a * 5 - time * 3.2);
      const px = Math.cos(a) * r * (1.06 + 0.03 * Math.sin(time * 3)), py = Math.sin(a) * r * (0.97 - 0.03 * Math.sin(time * 3));
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  };
  const g = ctx.createRadialGradient(-8, -10, 6, 0, 0, 40);
  g.addColorStop(0, 'rgba(230,255,248,0.05)');
  g.addColorStop(0.7, 'rgba(170,240,215,0.18)');
  g.addColorStop(1, 'rgba(150,225,255,0.42)');
  path();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(80,190,160,0.7)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // a soft rainbow sheen and highlights on the rim
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,200,240,0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 33, 0.2 + Math.sin(time) * 0.2, 1.0 + Math.sin(time) * 0.2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.arc(0, 0, 32, -2.75, -2.0);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  circle(ctx, 22, -24, 2.6);
  circle(ctx, 27, -17, 1.4);
  ctx.restore();
}

// A subtle heroic glow while Rally is up: a warm halo at the feet and little golden chevrons rising.
export function drawRallyAura(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  const pulse = 0.8 + 0.2 * Math.sin(time * 5);
  const up = ctx.createLinearGradient(0, 0, 0, -60);
  up.addColorStop(0, `rgba(255,210,110,${0.3 * pulse})`);
  up.addColorStop(1, 'rgba(255,210,110,0)');
  ctx.fillStyle = up;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.quadraticCurveTo(-34, -40, 0, -62);
  ctx.quadraticCurveTo(34, -40, 30, 0);
  ctx.closePath();
  ctx.fill();
  const g = ctx.createRadialGradient(0, -2, 4, 0, -2, 40);
  g.addColorStop(0, `rgba(255,215,120,${0.6 * pulse})`);
  g.addColorStop(1, 'rgba(255,215,120,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -2, 40, 10, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(240,180,70,${0.9 * pulse})`;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0, -1, 30, 7, 0, 0, TAU);
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.7 + i / 3) % 1, sx = (i - 1) * 24 + Math.sin(time * 2 + i) * 3;
    const al = Math.sin(k * Math.PI), cy = -8 - k * 50;
    ctx.globalAlpha = al * 0.6;
    ctx.strokeStyle = '#b8742a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(sx - 5.5, cy + 4);
    ctx.lineTo(sx, cy - 1.5);
    ctx.lineTo(sx + 5.5, cy + 4);
    ctx.stroke();
    ctx.globalAlpha = al;
    ctx.strokeStyle = i % 2 ? '#ffb49a' : '#ffe27a';
    ctx.lineWidth = 2.6;
    ctx.stroke();
  }
  const sk = (time * 0.5) % 1;
  ctx.globalAlpha = Math.sin(sk * Math.PI);
  ctx.fillStyle = '#fff6c4';
  star(ctx, 18 - sk * 6, -46 - sk * 10, 3.5);
  ctx.restore();
}

// A golden shimmering shell round a slime while Aegis is up (nothing can hurt it).
export function drawAegisAura(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y - 22);
  const rx = 38, ry = 36, pulse = 0.85 + 0.15 * Math.sin(time * 8);
  const g = ctx.createRadialGradient(0, 0, 12, 0, 0, rx);
  g.addColorStop(0, 'rgba(255,240,170,0.03)');
  g.addColorStop(0.75, `rgba(255,220,120,${0.22 * pulse})`);
  g.addColorStop(1, `rgba(255,205,90,${0.5 * pulse})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // a faint hex lattice and a moving shine
  ctx.strokeStyle = 'rgba(255,245,200,0.35)';
  ctx.lineWidth = 1;
  for (let row = -3; row <= 3; row++) {
    for (let col = -3; col <= 3; col++) {
      const hx = col * 15 + (row % 2 ? 7.5 : 0), hy = row * 13;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + Math.PI / 6;
        ctx.lineTo(hx + Math.cos(a) * 8, hy + Math.sin(a) * 8);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  const sx = ((time * 0.8) % 1.6) * 100 - 80;
  const sg = ctx.createLinearGradient(sx - 18, -ry, sx + 18, ry);
  sg.addColorStop(0, 'rgba(255,255,255,0)');
  sg.addColorStop(0.5, 'rgba(255,255,255,0.5)');
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  ctx.restore();
  ctx.strokeStyle = `rgba(255,211,107,${0.9 * pulse})`;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(0, 0, rx - 4, ry - 4, 0, -2.7, -1.9);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = time * 1.6 + (i / 3) * TAU;
    ctx.fillStyle = i % 2 ? '#ffffff' : '#fff6c4';
    star(ctx, Math.cos(a) * rx, Math.sin(a) * ry, 3 + 1.5 * Math.sin(time * 6 + i));
  }
  ctx.restore();
}

// A jelly-shaped silhouette path, feet centred at (x, y), w × h; lean tilts the top forward (+x)
function jellyBlob(ctx, x, y, w, h, lean = 0) {
  const hw = w / 2, tx = lean * w * 0.3;
  ctx.beginPath();
  ctx.moveTo(x - hw, y);
  ctx.bezierCurveTo(x - hw * 1.04, y - h * 0.82, x - hw * 0.62 + tx, y - h, x + tx, y - h);
  ctx.bezierCurveTo(x + hw * 0.62 + tx, y - h, x + hw * 1.04, y - h * 0.82, x + hw, y);
  ctx.quadraticCurveTo(x, y + h * 0.08, x - hw, y);
  ctx.closePath();
  ctx.fill();
}

// The shine on a held sword that's been scrolled +N times. Call it in the sword's own space (grip at
// the origin, blade along -y), just BEFORE drawSword so the halo sits behind the blade. len = blade length.
const ENHANCE_TINT = ['170,225,255', '255,220,120', '200,150,255', '255,140,190'];
export function drawEnhanceGlow(ctx, plus, time, len = 50) {
  if (!(plus > 0)) return;
  const tier = plus >= 10 ? 3 : plus >= 7 ? 2 : plus >= 4 ? 1 : 0, rgb = ENHANCE_TINT[tier];
  const k = Math.min(1, plus / 10), pulse = 0.8 + 0.2 * Math.sin(time * (3 + tier));
  ctx.save();
  ctx.translate(0, -len * 0.5);
  ctx.scale(0.42 + k * 0.18, 1);
  const r = len * (0.62 + k * 0.18);
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
  g.addColorStop(0, `rgba(${rgb},${(0.25 + 0.4 * k) * pulse})`);
  g.addColorStop(0.6, `rgba(${rgb},${(0.12 + 0.25 * k) * pulse})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  circle(ctx, 0, 0, r);
  ctx.restore();
  // a glint travelling up the blade from +4
  if (plus >= 4) {
    const q = (time * 0.7) % 1;
    ctx.fillStyle = `rgba(255,255,255,${Math.sin(q * Math.PI) * 0.9})`;
    star(ctx, 0, -6 - q * (len - 10), 3 + tier);
  }
  // sparkles orbiting from +7, more and bigger with every level
  if (plus >= 7) {
    const n = Math.min(8, plus - 3);
    for (let i = 0; i < n; i++) {
      const s = (time * 0.6 + i / n) % 1, sd = i % 2 ? 1 : -1;
      ctx.fillStyle = i % 3 ? `rgba(255,255,255,${Math.sin(s * Math.PI)})` : `rgba(${rgb},${Math.sin(s * Math.PI)})`;
      star(ctx, sd * (7 + 4 * Math.sin(s * 5 + i)), -len * (0.1 + 0.9 * ((i / n + s * 0.3) % 1)), 1.8 + s * 1.6 + tier * 0.4);
    }
  }
}
