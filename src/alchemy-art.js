// Docs: docs/places/alchemy.md
// Farming and alchemy art: crops growing in a garden plot (drawn over the plot by src/house.js), and the
// item icons for herbs, boss reagents and brewed potions (drawItemIcon in src/field.js hands them over here).
import { TAU, circle, ellipse } from './util.js';
import { CROPS } from './shared/alchemy.js';

function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU, k = i % 2 ? r * 0.35 : r;
    ctx.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
  }
  ctx.closePath();
  ctx.fill();
}
function leaf(ctx, x, y, len, ang, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.35, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.35, 0, 0);
  ctx.fill();
  ctx.restore();
}

function heart(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.4, x, y - r * 0.4);
  ctx.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r);
  ctx.fill();
}
function hourglass(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.8, y - r);
  ctx.lineTo(x + r * 0.8, y - r);
  ctx.lineTo(x, y);
  ctx.lineTo(x + r * 0.8, y + r);
  ctx.lineTo(x - r * 0.8, y + r);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
}

// ——— boss reagents (ITEMS with reagent: true): only bosses drop them ———
const REAGENT = {
  royal_sap(ctx) {
    // a golden drop of sap with a leaf
    ctx.fillStyle = '#e8a82a';
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.quadraticCurveTo(13, 4, 9, 11);
    ctx.quadraticCurveTo(0, 20, -9, 11);
    ctx.quadraticCurveTo(-13, 4, 0, -15);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ellipse(ctx, 0, 6, 7, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ellipse(ctx, -3.5, 2, 2, 4, 0.3);
    leaf(ctx, 3, -12, 11, -0.6, '#7cc47f');
  },
  frost_heart(ctx) {
    ctx.fillStyle = '#4fa8d6';
    heart(ctx, 0, 2, 13);
    ctx.fillStyle = '#9fe3ff';
    heart(ctx, -1, 0, 9);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ellipse(ctx, -5, -4, 2, 3.5, 0.5);
    ctx.fillStyle = '#ffffff';
    star(ctx, 10, -10, 3);
  },
  phoenix_feather(ctx) {
    ctx.save();
    ctx.rotate(0.6);
    ctx.fillStyle = '#ff7a3a';
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.quadraticCurveTo(-11, 0, 0, -18);
    ctx.quadraticCurveTo(11, 0, 0, 18);
    ctx.fill();
    ctx.fillStyle = '#ffc84a';
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.quadraticCurveTo(-6, -2, 0, -14);
    ctx.quadraticCurveTo(6, -2, 0, 12);
    ctx.fill();
    ctx.strokeStyle = '#c94a2a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 19);
    ctx.lineTo(0, -12);
    ctx.stroke();
    ctx.restore();
  },
  time_sand(ctx) {
    ctx.fillStyle = '#c98a5a';
    ctx.fillRect(-11, -16, 22, 4);
    ctx.fillRect(-11, 12, 22, 4);
    ctx.fillStyle = 'rgba(230,240,255,0.8)';
    ctx.strokeStyle = '#8a7aa8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-9, -12);
    ctx.lineTo(9, -12);
    ctx.lineTo(1.5, 0);
    ctx.lineTo(9, 12);
    ctx.lineTo(-9, 12);
    ctx.lineTo(-1.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f2c46a';
    ctx.beginPath();
    ctx.moveTo(-6, -10);
    ctx.lineTo(6, -10);
    ctx.lineTo(0, -1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(7, 11);
    ctx.lineTo(-7, 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    star(ctx, 12, -6, 2.6);
  },
};

// ——— herbs: each crop's harvest, in a 40 × 40 box around (0, 0) ———
const HERB = {
  mintleaf(ctx) {
    ctx.strokeStyle = '#3f9a6c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.quadraticCurveTo(-2, 0, 2, -14);
    ctx.stroke();
    for (const [y, a, s] of [[8, -2.6, 1], [8, -0.5, 1], [-1, -2.5, 0.9], [-1, -0.6, 0.9], [-10, -1.6, 0.8]]) leaf(ctx, 0, y, 15 * s, a, a < -1.5 ? '#7fd9a8' : '#5fc48c');
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ellipse(ctx, -6, 2, 3, 1.4, -0.6);
  },
  sunberry(ctx) {
    leaf(ctx, 0, -8, 16, -0.6, '#6fb86f');
    leaf(ctx, 0, -8, 14, -2.4, '#8fd18a');
    for (const [x, y] of [[-7, 2], [6, 1], [0, 9], [-3, -5], [7, 9]]) {
      ctx.fillStyle = '#e8a82a';
      circle(ctx, x, y + 1, 6.5);
      ctx.fillStyle = '#ffc84a';
      circle(ctx, x, y, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      circle(ctx, x - 2, y - 2, 1.6);
    }
  },
  moonbell(ctx) {
    ctx.strokeStyle = '#5fa86f';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-10, 16);
    ctx.quadraticCurveTo(-8, -14, 8, -12);
    ctx.stroke();
    leaf(ctx, -9, 8, 12, -0.4, '#7cc47f');
    // the bell, hanging from the stem's tip
    ctx.fillStyle = '#9a84e8';
    ctx.beginPath();
    ctx.moveTo(8, -12);
    ctx.bezierCurveTo(18, -10, 16, 6, 18, 10);
    ctx.quadraticCurveTo(8, 14, -2, 10);
    ctx.bezierCurveTo(0, 6, -2, -10, 8, -12);
    ctx.fill();
    ctx.fillStyle = '#c9b6ff';
    ellipse(ctx, 8, 10, 10, 3);
    ctx.fillStyle = '#fff1a8';
    circle(ctx, 8, 13, 2.2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ellipse(ctx, 4, -2, 2, 5, 0.2);
  },
  frostbloom(ctx) {
    ctx.strokeStyle = '#4fa8d6';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU - Math.PI / 2;
      ctx.fillStyle = i % 2 ? '#bfeeff' : '#9fe3ff';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - 0.3) * 10, Math.sin(a - 0.3) * 10);
      ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17);
      ctx.lineTo(Math.cos(a + 0.3) * 10, Math.sin(a + 0.3) * 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    circle(ctx, 0, 0, 4);
  },
  emberroot(ctx) {
    leaf(ctx, 2, -8, 12, -1.2, '#e86a4a');
    leaf(ctx, 2, -8, 12, -2.2, '#ff9f6a');
    ctx.fillStyle = '#c94a2a';
    ctx.beginPath();
    ctx.moveTo(-8, -8);
    ctx.quadraticCurveTo(10, -12, 9, 0);
    ctx.quadraticCurveTo(8, 12, 0, 17);
    ctx.quadraticCurveTo(-4, 8, -10, 2);
    ctx.quadraticCurveTo(-12, -4, -8, -8);
    ctx.fill();
    ctx.fillStyle = '#ff8a5c';
    ellipse(ctx, -1, -2, 7, 8, 0.3);
    ctx.strokeStyle = '#a83a20';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const y of [-2, 4, 9]) {
      ctx.moveTo(-6, y);
      ctx.lineTo(4, y + 1);
    }
    ctx.stroke();
    ctx.fillStyle = '#ffe28a';
    circle(ctx, 3, -4, 1.6);
  },
  starlotus(ctx) {
    ctx.fillStyle = '#7cc47f';
    ellipse(ctx, 0, 12, 17, 4);
    for (const [a, c] of [[-2.4, '#f2b8e0'], [-0.7, '#f2b8e0'], [-2, '#ffd6ec'], [-1.1, '#ffd6ec'], [-1.57, '#fff0f8']]) {
      ctx.save();
      ctx.translate(0, 9);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(7, -10, 0, -20);
      ctx.quadraticCurveTo(-7, -10, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#ffe9a8';
    star(ctx, 0, -2, 7);
    ctx.fillStyle = '#ffffff';
    star(ctx, 13, -12, 3);
  },
};

// ——— brewed potions: a flask, its brew's colour, and a mark ———
const BREW = {
  mint_tonic: { shape: 'round', color: '#7fd9a8', mark: 'leaf' },
  sun_cordial: { shape: 'tall', color: '#ffc84a', mark: 'sun' },
  moon_draught: { shape: 'round', color: '#b9a4ff', mark: 'moon' },
  might_brew: { shape: 'tall', color: '#ff7f7f', mark: 'bolt' },
  frost_ward: { shape: 'wide', color: '#9fe3ff', mark: 'flake' },
  ember_fury: { shape: 'wide', color: '#ff8a5c', mark: 'flame' },
  star_elixir: { shape: 'round', color: '#ffd6ec', mark: 'star', rainbow: true },
  sprout_salve: { shape: 'wide', color: '#b8e88a', mark: 'leaf' },
  scholar_tea: { shape: 'tall', color: '#d9b48a', mark: 'book' },
  jelly_blend: { shape: 'round', color: '#9fb4ff', mark: 'heart' },
  star_tonic: { shape: 'tall', color: '#8fa0ff', mark: 'star' },
  briar_balm: { shape: 'wide', color: '#e8a0b4', mark: 'heart' },
  royal_draught: { shape: 'round', color: '#ffd76a', mark: 'book' },
  obsidian_skin: { shape: 'wide', color: '#6a5a7a', mark: 'gem' },
  glacial_elixir: { shape: 'round', color: '#bfeeff', mark: 'flake' },
  gilded_draught: { shape: 'tall', color: '#ffcf4a', mark: 'coin' },
  phoenix_draught: { shape: 'round', color: '#ff9a5c', mark: 'flame', rainbow: true },
  hour_elixir: { shape: 'tall', color: '#e8d4ff', mark: 'hourglass', rainbow: true },
  cleansing_tonic: { shape: 'tall', color: '#f2f6ff', mark: 'spark' }, // (S5.5: clear as spring water)
  barrier_draught: { shape: 'wide', color: '#ffe9a0', mark: 'shield' }, // (S5.5: the Cleric's Barrier gold)
  sludge: { shape: 'round', color: '#8a9a5b', mark: 'blob' },
};
function flask(ctx, { shape, color, mark, rainbow }) {
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = '#8a7aa8';
  const body = () => {
    ctx.beginPath();
    if (shape === 'round') ctx.arc(0, 6, 12, 0, TAU);
    else if (shape === 'tall') ctx.roundRect(-8, -6, 16, 24, 6);
    else ctx.roundRect(-13, -2, 26, 20, [10, 10, 6, 6]);
  };
  // glass
  ctx.fillStyle = 'rgba(230,240,255,0.6)';
  body();
  ctx.fill();
  // the brew, filling most of it
  ctx.save();
  body();
  ctx.clip();
  if (rainbow) {
    const g = ctx.createLinearGradient(-12, 0, 12, 18);
    for (const [k, c] of [[0, '#ff9fc4'], [0.35, '#ffe28a'], [0.7, '#9fe3ff'], [1, '#c4a0ff']]) g.addColorStop(k, c);
    ctx.fillStyle = g;
  } else ctx.fillStyle = color;
  ctx.fillRect(-14, shape === 'tall' ? 0 : 1, 28, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(-14, shape === 'tall' ? 0 : 1, 28, 2);
  ctx.restore();
  body();
  ctx.stroke();
  // neck and cork
  const top = shape === 'round' ? -6 : shape === 'tall' ? -6 : -2;
  ctx.fillStyle = 'rgba(230,240,255,0.7)';
  ctx.beginPath();
  ctx.roundRect(-4, top - 8, 8, 9, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c98a5a';
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-4.5, top - 13, 9, 6, 2);
  ctx.fill();
  ctx.stroke();
  // the mark, on a little label
  const my = shape === 'tall' ? 9 : 9;
  ctx.fillStyle = 'rgba(255,250,240,0.9)';
  circle(ctx, 0, my, 5.5);
  ctx.fillStyle = mark === 'blob' ? '#6a7a3b' : '#5b4a6b';
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 1.4;
  if (mark === 'leaf') leaf(ctx, -3.5, my + 2, 8, -0.8, '#3f9a6c');
  else if (mark === 'sun') {
    ctx.fillStyle = '#e8a82a';
    star(ctx, 0, my, 4.5);
    circle(ctx, 0, my, 2.4);
  } else if (mark === 'moon') {
    ctx.fillStyle = '#7a5fd1';
    circle(ctx, 0, my, 3.6);
    ctx.fillStyle = 'rgba(255,250,240,1)';
    circle(ctx, 1.8, my - 1.2, 3);
  } else if (mark === 'bolt') {
    ctx.fillStyle = '#e04a5a';
    ctx.beginPath();
    ctx.moveTo(1, my - 4.5);
    ctx.lineTo(-2.5, my + 0.5);
    ctx.lineTo(0, my + 0.5);
    ctx.lineTo(-1, my + 4.5);
    ctx.lineTo(2.5, my - 0.5);
    ctx.lineTo(0, my - 0.5);
    ctx.closePath();
    ctx.fill();
  } else if (mark === 'flake') {
    ctx.strokeStyle = '#4fa8d6';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      ctx.moveTo(Math.cos(a) * -4, my + Math.sin(a) * -4);
      ctx.lineTo(Math.cos(a) * 4, my + Math.sin(a) * 4);
    }
    ctx.stroke();
  } else if (mark === 'flame') {
    ctx.fillStyle = '#e8603a';
    ctx.beginPath();
    ctx.moveTo(0, my - 4.5);
    ctx.quadraticCurveTo(4, my, 2.5, my + 3.5);
    ctx.quadraticCurveTo(0, my + 5, -2.5, my + 3.5);
    ctx.quadraticCurveTo(-4, my, 0, my - 4.5);
    ctx.fill();
  } else if (mark === 'star') {
    ctx.fillStyle = '#e0a020';
    star(ctx, 0, my, 4.8);
  } else if (mark === 'book') {
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(-4, my - 3, 3.6, 6);
    ctx.fillRect(0.4, my - 3, 3.6, 6);
  } else if (mark === 'heart') {
    ctx.fillStyle = '#e0607a';
    heart(ctx, 0, my, 4.2);
  } else if (mark === 'gem') {
    ctx.fillStyle = '#4a3a5a';
    ctx.beginPath();
    ctx.moveTo(0, my - 4.5);
    ctx.lineTo(4, my);
    ctx.lineTo(0, my + 4.5);
    ctx.lineTo(-4, my);
    ctx.closePath();
    ctx.fill();
  } else if (mark === 'coin') {
    ctx.fillStyle = '#e0a020';
    circle(ctx, 0, my, 4);
    ctx.fillStyle = '#ffe28a';
    circle(ctx, -0.8, my - 0.8, 1.8);
  } else if (mark === 'hourglass') {
    hourglass(ctx, 0, my, 4.5, '#7a5fd1');
  } else if (mark === 'spark') { // a four-point sparkle: a curse lifted
    ctx.fillStyle = '#8a7ad8';
    ctx.beginPath();
    ctx.moveTo(0, my - 4.8);
    ctx.quadraticCurveTo(0.8, my - 0.8, 4.8, my);
    ctx.quadraticCurveTo(0.8, my + 0.8, 0, my + 4.8);
    ctx.quadraticCurveTo(-0.8, my + 0.8, -4.8, my);
    ctx.quadraticCurveTo(-0.8, my - 0.8, 0, my - 4.8);
    ctx.fill();
  } else if (mark === 'shield') { // a little round-bottomed shield
    ctx.fillStyle = '#d9a020';
    ctx.beginPath();
    ctx.moveTo(-3.8, my - 3.8);
    ctx.lineTo(3.8, my - 3.8);
    ctx.lineTo(3.8, my);
    ctx.quadraticCurveTo(3.4, my + 3.4, 0, my + 4.8);
    ctx.quadraticCurveTo(-3.4, my + 3.4, -3.8, my);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff4c8';
    ctx.fillRect(-0.7, my - 2.8, 1.4, 5.6);
  } else if (mark === 'blob') {
    circle(ctx, -1.5, my + 1, 2.4);
    circle(ctx, 1.8, my - 1, 1.6);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ellipse(ctx, shape === 'wide' ? -9 : -6, shape === 'tall' ? 3 : 4, 1.8, 4, 0.3);
  if (rainbow) {
    ctx.fillStyle = '#ffffff';
    star(ctx, 13, -10, 3.2);
    star(ctx, -14, -4, 2.4);
  }
}

// An icon for a herb or a brew (in the caller's 40 × 40 box around (0, 0)): → false if id isn't one
export function drawAlchemyIcon(ctx, id) {
  if (HERB[id]) HERB[id](ctx);
  else if (BREW[id]) flask(ctx, BREW[id]);
  else if (REAGENT[id]) REAGENT[id](ctx);
  else return false;
  return true;
}

// What's growing in a garden plot (its bottom middle at x, y): three plants of crop c, grown g (0 → 1);
// grown ones show their harvest, bobbing and sparkling
export function drawCrop(ctx, c, x, y, g, t) {
  const crop = CROPS[c];
  if (!crop) return;
  const ready = g >= 1;
  for (const [dx, i] of [[-33, 0], [0, 1], [33, 2]]) {
    const px = x + dx, base = y - 13, sway = Math.sin(t * 1.6 + i * 1.3) * (1 + g * 2);
    const h = 6 + g * 30;
    ctx.strokeStyle = crop.dark;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px, base);
    ctx.quadraticCurveTo(px + sway * 0.5, base - h * 0.5, px + sway, base - h);
    ctx.stroke();
    const leafCol = '#6fc47f';
    leaf(ctx, px, base - 2, 7 + g * 8, -0.4, leafCol);
    leaf(ctx, px, base - 2, 7 + g * 8, -2.7, '#8fd18a');
    if (g > 0.4) {
      leaf(ctx, px + sway * 0.5, base - h * 0.55, 6 + g * 6, -0.7, '#8fd18a');
      leaf(ctx, px + sway * 0.5, base - h * 0.55, 6 + g * 6, -2.4, leafCol);
    }
    const tx = px + sway, ty = base - h;
    if (ready) {
      const bob = Math.sin(t * 3 + i) * 1.5;
      ctx.save();
      ctx.translate(tx, ty - 6 + bob);
      ctx.scale(0.55, 0.55);
      HERB[c](ctx);
      ctx.restore();
    } else if (g > 0.6) {
      ctx.fillStyle = crop.color; // a bud
      circle(ctx, tx, ty - 2, 2 + (g - 0.6) * 8);
    }
  }
  if (ready) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.6 + i / 3) % 1;
      ctx.globalAlpha = Math.sin(k * Math.PI);
      star(ctx, x - 40 + ((i * 37) % 80), y - 30 - k * 30, 3);
    }
    ctx.globalAlpha = 1;
  }
}
