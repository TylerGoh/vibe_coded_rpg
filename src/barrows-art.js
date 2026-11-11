// Docs: docs/places/barrows.md, docs/places/shallows.md, docs/combat/stages.md
// Atlas Phase 8, L3's art that isn't a room (the room is src/barrows.js): the Shallows' field boss the Bog Bloat and
// its boglings, the Sunk Barrows' creatures (grave lamp, lantern leech, peat mound and its clods, barrow hound) and its
// field boss the Sleeper in the Peat (BARROWS_MOB_ART, called by drawMob in src/field.js); their materials' icons
// (BARROWS_ICONS); and gear for players (BARROWS_SWORDS, BARROWS_SWORD_LEN, BARROWS_HELMETS): the Bog-Iron Cleaver and
// Bloat Cap, the peat mound's rare Bog-Iron Helm, the barrow hound's rare Barrowfang, the Sleeper's Blade and Hood (the
// staves and bows are rows in src/staff-art.js and src/bow-art.js). Lantern Fen's register, gone underground: peat
// brown, old stone, bog-iron, old bronze, and the small warm lights of the dead's lanterns.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';
import { drawLantern } from './stillmere-art.js';

const INKC = '#2e2a3a';
const PEAT = '#3a2c20', PEAT_D = '#221a12', PEAT_L = '#5a4632';
const BOG = '106,86,64';
const LAMP = '255,214,150';
const BRONZE = '#a8783a', BRONZE_D = '#6a4a22', BRONZE_L = '#d8b070';
const STONE = '#6a6862', STONE_D = '#3e3c38';

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, col = INKC, shut = false } = {}) {
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.8) < 0.12;
  for (const ex of [fx - gap, fx + gap]) {
    if (dying > 0.05) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex + 2.2 * size, fy + 2.2 * size);
      ctx.moveTo(ex + 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex - 2.2 * size, fy + 2.2 * size);
      ctx.stroke();
    } else if (shut || blink) {
      ctx.beginPath();
      ctx.arc(ex, fy - 1, 2.4 * size, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ellipse(ctx, ex, fy, 2.4 * size, 3.2 * size);
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
      ctx.fillStyle = col;
    }
  }
}
function softGlow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// ——— the Shallows' field boss ———
// The Bog Bloat: a bog slime that never stopped growing, a great brown see-through dome of peat-jelly with everything it
// has rolled over floating inside it (old boards, weed, a lost lantern still lit, bubbles), weed draped over its top and
// muck sliding off its sides; two small eyes and a slack wide mouth. It shrinks as it's hit (it sheds boglings: the
// server's `shed`), and heaves up before it rolls (warn)
function drawBogBloat(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const frac = m.maxHp ? Math.max(0, Math.min(1, m.hp / m.maxHp)) : 1;
  const k = 0.78 + 0.22 * frac; // (smaller as it sheds)
  const W2 = w * 0.5 * k, H2 = h * k * (warn ? 1.06 : 1);
  const wob = live ? Math.sin(t * 2.2 + seed) * 0.03 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-W2, 0);
    ctx.bezierCurveTo(-W2 * (1.06 + wob), -H2 * 0.55, -W2 * 0.6, -H2, 0, -H2 * (1 - wob));
    ctx.bezierCurveTo(W2 * 0.62, -H2, W2 * (1.08 - wob), -H2 * 0.5, W2, 0);
    ctx.closePath();
  };
  ctx.save();
  ctx.fillStyle = 'rgba(40,32,22,0.35)'; // its shadow in the water
  ellipse(ctx, 0, 2, W2 * 1.1, 8);
  const g = ctx.createLinearGradient(0, -H2, 0, 0);
  g.addColorStop(0, `rgba(${BOG},0.78)`);
  g.addColorStop(1, 'rgba(58,44,32,0.92)');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.save(); // what's inside it
  body();
  ctx.clip();
  ctx.fillStyle = 'rgba(90,70,48,0.8)'; // old boards
  for (const [x, y, a, L] of [[-0.4, 0.35, 0.4, 0.5], [0.2, 0.55, -0.3, 0.42], [-0.05, 0.22, 0.1, 0.36]]) {
    ctx.save();
    ctx.translate(W2 * x, -H2 * y + Math.sin(t * 0.8 + x * 5) * 3);
    ctx.rotate(a + Math.sin(t * 0.5 + y * 7) * 0.05);
    ctx.fillRect(-W2 * L * 0.5, -3, W2 * L, 6);
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(110,138,78,0.6)'; // weed
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const x = -W2 * 0.6 + i * W2 * 0.4;
    ctx.moveTo(x, -H2 * 0.08);
    ctx.quadraticCurveTo(x + 10 + Math.sin(t + i) * 6, -H2 * 0.3, x - 4, -H2 * 0.5);
  }
  ctx.stroke();
  drawLantern(ctx, -W2 * 0.3, -H2 * 0.62 + Math.sin(t * 0.7) * 3, 1.3, live ? 0.7 : 0.3, t); // a lost lantern, still lit
  ctx.fillStyle = 'rgba(214,204,180,0.35)'; // bubbles going up
  for (let i = 0; i < 6; i++) {
    const p = ((t * 0.25 + i / 6 + seed) % 1);
    circle(ctx, -W2 * 0.5 + ((i * 37) % 10) / 10 * W2, -p * H2 * 0.9, 2 + (i % 3));
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(34,26,18,0.85)';
  ctx.lineWidth = 2.6;
  body();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,248,230,0.22)'; // the shine
  ellipse(ctx, -W2 * 0.36, -H2 * 0.76, W2 * 0.2, H2 * 0.07, -0.5);
  ctx.fillStyle = 'rgba(96,120,72,0.85)'; // weed draped over the top
  for (let i = 0; i < 5; i++) {
    const x = -W2 * 0.4 + i * W2 * 0.2;
    ctx.beginPath();
    ctx.ellipse(x, -H2 * (0.96 - Math.abs(i - 2) * 0.06), 12, 4, (i - 2) * 0.3, 0, TAU);
    ctx.fill();
    ctx.fillRect(x - 1.2, -H2 * (0.94 - Math.abs(i - 2) * 0.06), 2.4, 12 + (i % 2) * 10);
  }
  ctx.fillStyle = 'rgba(58,44,32,0.85)'; // muck sliding off its sides
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
    const y = -H2 * (0.4 - i * 0.2) + ((t * 14 + i * 30 + seed * 9) % 30);
    ellipse(ctx, s * W2 * (0.95 - i * 0.04), y, 4, 7);
  }
  const fx = W2 * 0.36, fy = -H2 * 0.58; // the face
  if (live) eyes(ctx, fx, fy, 9, t, seed, { size: 1.2 });
  else eyes(ctx, fx, fy, 9, t, seed, { dying, size: 1.2 });
  ctx.fillStyle = 'rgba(30,22,16,0.85)';
  ctx.beginPath();
  ctx.ellipse(fx, fy + 18, warn ? 14 : 11, warn ? 7 : 3.5, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  return body;
}
// A bogling: a little lump of the Bloat, brown see-through jelly with a scrap of weed stuck on it
function drawBogling(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, 0);
    ctx.quadraticCurveTo(-w * 0.55, -h, 0, -h);
    ctx.quadraticCurveTo(w * 0.55, -h, w * 0.5, 0);
    ctx.closePath();
  };
  ctx.fillStyle = `rgba(${BOG},0.85)`;
  body();
  ctx.fill();
  ctx.strokeStyle = PEAT_D;
  ctx.lineWidth = 1.6;
  body();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,248,230,0.3)';
  ellipse(ctx, -w * 0.18, -h * 0.72, w * 0.12, h * 0.08, -0.4);
  ctx.fillStyle = 'rgba(96,120,72,0.9)';
  ellipse(ctx, -w * 0.05, -h * 0.98, 6, 2.2, 0.3);
  if (live) eyes(ctx, w * 0.14, -h * 0.5, 4, t, seed, { size: 0.7 });
  else eyes(ctx, w * 0.14, -h * 0.5, 4, t, seed, { dying, size: 0.7 });
  return body;
}

// ——— the Sunk Barrows ———
// Grave lamp: one of the dead's lanterns grown into the barrow wall: a squat grave-post of grey stone, green with damp,
// a cage of black iron set into its top with a flame in it that has two eyes, a name tag on a string. It can't move
// (rooted); it gathers its flame up tall (warn) and spits a drop of burning lamp oil
function drawGraveLamp(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const post = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.4, 0);
    ctx.lineTo(-w * 0.34, -h * 0.5);
    ctx.quadraticCurveTo(0, -h * 0.58, w * 0.34, -h * 0.5);
    ctx.lineTo(w * 0.4, 0);
    ctx.closePath();
  };
  ctx.fillStyle = STONE;
  post();
  ctx.fill();
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = 1.8;
  post();
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,138,78,0.55)'; // damp moss
  ellipse(ctx, -w * 0.2, -h * 0.08, w * 0.18, 4);
  ellipse(ctx, w * 0.16, -h * 0.42, w * 0.14, 3);
  ctx.strokeStyle = 'rgba(46,42,58,0.5)'; // a worn mark cut in it
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-5, -h * 0.34); ctx.lineTo(5, -h * 0.34);
  ctx.moveTo(0, -h * 0.4); ctx.lineTo(0, -h * 0.22);
  ctx.stroke();
  const cy = -h * 0.72, flick = live ? Math.sin(t * 11 + seed) * 2 : 0, tall = warn ? 1.5 : 1;
  if (live) softGlow(ctx, 0, cy, warn ? 40 : 28, LAMP, warn ? 0.55 : 0.35);
  ctx.fillStyle = `rgba(255,226,168,${live ? 0.9 : 0.3})`; // the flame
  ctx.beginPath();
  ctx.moveTo(-w * 0.18, cy + h * 0.14);
  ctx.quadraticCurveTo(-w * 0.24, cy - h * 0.06 * tall, flick, cy - h * 0.2 * tall);
  ctx.quadraticCurveTo(w * 0.24, cy - h * 0.06 * tall, w * 0.18, cy + h * 0.14);
  ctx.closePath();
  ctx.fill();
  if (live) eyes(ctx, 2, cy + 2, 4, t, seed, { size: 0.7, col: '#6a4a22' });
  else eyes(ctx, 2, cy + 2, 4, t, seed, { dying, size: 0.7, col: '#6a4a22' });
  ctx.strokeStyle = '#1e1a1e'; // the iron cage
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(-w * 0.26, cy - h * 0.16, w * 0.52, h * 0.32);
  ctx.moveTo(0, cy - h * 0.16); ctx.lineTo(0, cy - h * 0.24);
  ctx.moveTo(-w * 0.3, cy - h * 0.16); ctx.lineTo(0, cy - h * 0.25); ctx.lineTo(w * 0.3, cy - h * 0.16);
  ctx.stroke();
  ctx.strokeStyle = '#8a7a60'; // the tag on its string
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(w * 0.26, cy);
  ctx.lineTo(w * 0.34, cy + 10 + Math.sin(t * 1.4 + seed) * 1.5);
  ctx.stroke();
  ctx.fillStyle = '#e8dcc0';
  ctx.fillRect(w * 0.3, cy + 10 + Math.sin(t * 1.4 + seed) * 1.5, 5, 7);
  return post;
}
// Lantern leech: a fat black leech as long as your arm, ringed, a sucker at the front; it has drunk so much lamp oil out
// of the grave lamps that it glows amber inside. It inches along the floor (its back humps when it walks)
function drawLanternLeech(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, walk = !!m.walking && live;
  const hump = walk ? (Math.sin(t * 8 + seed) * 0.5 + 0.5) * h * 0.4 : h * 0.1;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, 0);
    ctx.quadraticCurveTo(-w * 0.5, -h * 0.7, -w * 0.2, -h * 0.7 - hump * 0.5);
    ctx.quadraticCurveTo(0, -h * 0.8 - hump, w * 0.2, -h * 0.7 - hump * 0.5);
    ctx.quadraticCurveTo(w * 0.5, -h * 0.8, w * 0.5, -h * 0.25);
    ctx.lineTo(w * 0.5, 0);
    ctx.closePath();
  };
  ctx.fillStyle = '#1e1a1e';
  body();
  ctx.fill();
  if (live) { // the oil glowing through its skin
    ctx.save();
    body();
    ctx.clip();
    softGlow(ctx, -w * 0.05, -h * 0.4 - hump * 0.4, w * 0.45, LAMP, 0.5 + 0.12 * Math.sin(t * 2 + seed));
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(80,70,84,0.9)'; // the rings
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 1; i < 8; i++) {
    const x = -w * 0.5 + (i / 8) * w;
    ctx.moveTo(x, -1);
    ctx.lineTo(x + 2, -h * 0.62 - Math.sin((i / 8) * Math.PI) * hump);
  }
  ctx.stroke();
  ctx.strokeStyle = '#0e0c10';
  ctx.lineWidth = 2;
  body();
  ctx.stroke();
  ctx.fillStyle = '#4a3a3e'; // the sucker
  ellipse(ctx, w * 0.5, -h * 0.2, 5, h * 0.24);
  ctx.fillStyle = '#120e10';
  ellipse(ctx, w * 0.52, -h * 0.2, 2.4, h * 0.12);
  if (live) eyes(ctx, w * 0.32, -h * 0.55, 3.5, t, seed, { size: 0.6, col: '#ffe2a8' });
  else eyes(ctx, w * 0.32, -h * 0.55, 3.5, t, seed, { dying, size: 0.6, col: '#ffe2a8' });
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ellipse(ctx, -w * 0.15, -h * 0.62 - hump * 0.5, w * 0.16, 2.4, -0.1);
  return body;
}
// Peat mound: a heap of the barrows' black peat that got up and walks, cut bricks of it stacked anyhow, turf on top
// with roots hanging off, two small pale eyes deep in it. Break it and it falls into clods
function drawPeatMound(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, walk = !!m.walking && live;
  const bob = walk ? Math.abs(Math.sin(t * 6 + seed)) * 3 : 0;
  const heap = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, 0);
    ctx.quadraticCurveTo(-w * 0.52, -h * 0.6, -w * 0.2, -h * 0.9 - bob);
    ctx.quadraticCurveTo(0, -h - bob, w * 0.22, -h * 0.9 - bob);
    ctx.quadraticCurveTo(w * 0.52, -h * 0.6, w * 0.5, 0);
    ctx.closePath();
  };
  ctx.fillStyle = PEAT;
  heap();
  ctx.fill();
  ctx.save();
  heap();
  ctx.clip();
  ctx.strokeStyle = PEAT_D; // the cut bricks
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let r = 0; r < 5; r++) {
    const y = -r * h * 0.2 - bob * (r / 5);
    ctx.moveTo(-w * 0.6, y);
    ctx.lineTo(w * 0.6, y - (r % 2 ? 2 : -2));
    for (let c = 0; c < 4; c++) {
      const x = -w * 0.45 + c * w * 0.3 + (r % 2) * w * 0.15;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y - h * 0.2);
    }
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(90,70,50,0.5)';
  for (let i = 0; i < 6; i++) ellipse(ctx, -w * 0.35 + (i * 0.14) * w, -h * (0.15 + (i % 3) * 0.25), 6, 2.5);
  ctx.restore();
  ctx.strokeStyle = PEAT_D;
  ctx.lineWidth = 2;
  heap();
  ctx.stroke();
  ctx.fillStyle = '#5e7a44'; // turf on top
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.92 - bob, w * 0.3, h * 0.08, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = PEAT_L; // roots hanging off
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const x = -w * 0.28 + i * w * 0.14;
    ctx.moveTo(x, -h * 0.86 - bob);
    ctx.quadraticCurveTo(x + Math.sin(t + i) * 3, -h * 0.72, x + 2, -h * 0.62 - (i % 2) * 8);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(14,10,8,0.85)'; // the hollows its eyes are in
  ellipse(ctx, w * 0.12, -h * 0.55 - bob * 0.6, 14, 8);
  if (live) eyes(ctx, w * 0.12, -h * 0.55 - bob * 0.6, 5, t, seed, { size: 0.8, col: '#d8d0b0' });
  else eyes(ctx, w * 0.12, -h * 0.55, 5, t, seed, { dying, size: 0.8, col: '#d8d0b0' });
  return heap;
}
// Peat clod: one brick of it, hopping, with eyes
function drawPeatClod(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const brick = () => {
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h, w, h, 4);
  };
  ctx.fillStyle = PEAT;
  brick();
  ctx.fill();
  ctx.strokeStyle = PEAT_D;
  ctx.lineWidth = 1.6;
  brick();
  ctx.stroke();
  ctx.fillStyle = '#5e7a44';
  ctx.fillRect(-w * 0.5, -h, w, 3);
  if (live) eyes(ctx, w * 0.1, -h * 0.5, 4, t, seed, { size: 0.6, col: '#d8d0b0' });
  else eyes(ctx, w * 0.1, -h * 0.5, 4, t, seed, { dying, size: 0.6, col: '#d8d0b0' });
  return brick;
}
// Barrow hound: a lean old hound buried with its master and still keeping the barrow, peat-dark and gone leathery, a
// collar of plaited reed with a little bronze bell, long ears, pale eyes. Quick and low
function drawBarrowHound(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, walk = !!m.walking && live;
  const run = walk ? t * 14 + seed : 0, bob = walk ? Math.sin(run * 2) * 2 : 0;
  const by = -h * 0.55 + bob;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, by);
    ctx.quadraticCurveTo(-w * 0.4, by - h * 0.22, -w * 0.1, by - h * 0.2);
    ctx.lineTo(w * 0.18, by - h * 0.22);
    ctx.quadraticCurveTo(w * 0.3, by - h * 0.3, w * 0.36, by - h * 0.42); // the neck up
    ctx.quadraticCurveTo(w * 0.5, by - h * 0.44, w * 0.52, by - h * 0.28); // the muzzle
    ctx.quadraticCurveTo(w * 0.44, by - h * 0.14, w * 0.3, by - h * 0.08);
    ctx.quadraticCurveTo(w * 0.24, by + h * 0.16, 0, by + h * 0.14);
    ctx.quadraticCurveTo(-w * 0.32, by + h * 0.16, -w * 0.42, by);
    ctx.closePath();
  };
  ctx.strokeStyle = PEAT_D; // legs
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [x, ph] of [[-w * 0.3, 0], [-w * 0.18, Math.PI], [w * 0.14, Math.PI * 0.5], [w * 0.24, Math.PI * 1.5]]) {
    const sw = walk ? Math.sin(run + ph) * 8 : 0;
    ctx.moveTo(x, by + h * 0.08);
    ctx.lineTo(x + sw, -2);
  }
  ctx.stroke();
  ctx.strokeStyle = PEAT; // the tail, low
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.4, by - h * 0.04);
  ctx.quadraticCurveTo(-w * 0.52, by + h * 0.04, -w * 0.56, by + h * 0.22 + (walk ? Math.sin(run) * 3 : 0));
  ctx.stroke();
  const g = ctx.createLinearGradient(0, by - h * 0.3, 0, by + h * 0.16);
  g.addColorStop(0, PEAT_L);
  g.addColorStop(1, PEAT_D);
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = '#120e0a';
  ctx.lineWidth = 1.8;
  body();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(30,22,16,0.6)'; // ribs showing
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(-w * 0.12 + i * 7, by - h * 0.14);
    ctx.quadraticCurveTo(-w * 0.1 + i * 7, by, -w * 0.13 + i * 7, by + h * 0.08);
  }
  ctx.stroke();
  ctx.fillStyle = PEAT_D; // the long ear
  ctx.beginPath();
  ctx.ellipse(w * 0.32, by - h * 0.34, 4, 11, 0.5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#8a7a50'; // the reed collar and its bell
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.26, by - h * 0.36);
  ctx.lineTo(w * 0.32, by - h * 0.12);
  ctx.stroke();
  ctx.fillStyle = BRONZE;
  circle(ctx, w * 0.32, by - h * 0.08, 3);
  if (live) eyes(ctx, w * 0.42, by - h * 0.34, 0, t, seed, { size: 0.7, col: '#e8e4d0' });
  else eyes(ctx, w * 0.42, by - h * 0.34, 0, t, seed, { dying, size: 0.7, col: '#e8e4d0' });
  ctx.fillStyle = '#120e0a';
  circle(ctx, w * 0.52, by - h * 0.3, 2);
  return body;
}
// The Sleeper in the Peat: a great slime the bog kept, brown as strong tea and gone leathery, curled up asleep in the Peat
// Hall's floor under a blanket of peat, a bronze torc round it, grave goods laid by it (a bowl, a pin, a little lamp).
// Until someone hits it (HP full) it lies low and sleeps; then it gets up, slowly, the peat sliding off it, its eyes
// half open and sad. Before it comes down (warn) it rears up tall
function drawPeatSleeper(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const asleep = live && (!m.maxHp || m.hp >= m.maxHp) && !m.walking && !warn;
  const H = h * (asleep ? 0.55 : warn ? 1.1 : 0.95), breathe = live ? Math.sin(t * (asleep ? 0.9 : 1.6) + seed) * 0.025 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, 0);
    ctx.bezierCurveTo(-w * 0.52, -H * 0.6, -w * 0.3, -H * (1 + breathe), w * 0.02, -H * (1 + breathe));
    ctx.bezierCurveTo(w * 0.34, -H * (1 + breathe), w * 0.52, -H * 0.55, w * 0.5, 0);
    ctx.closePath();
  };
  ctx.save();
  ctx.fillStyle = BRONZE_D; // grave goods laid by it: a bowl, a long pin
  ctx.beginPath();
  ctx.ellipse(-w * 0.62, -5, 14, 6, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = BRONZE;
  ctx.fillRect(-w * 0.62 - 14, -6, 28, 2);
  ctx.save();
  ctx.translate(w * 0.6, -3);
  ctx.rotate(-0.2);
  ctx.fillStyle = BRONZE;
  ctx.fillRect(-12, -1, 24, 2);
  circle(ctx, 12, 0, 3);
  ctx.restore();
  if (live) drawLantern(ctx, w * 0.7, -10, 1, 0.6, t);
  const g = ctx.createLinearGradient(0, -H, 0, 0);
  g.addColorStop(0, '#7a5a3a');
  g.addColorStop(0.6, '#5a4028');
  g.addColorStop(1, '#3a2a1a');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,28,16,0.5)'; // creases in its leathery skin
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const y = -H * (0.2 + i * 0.14);
    ctx.moveTo(-w * (0.42 - i * 0.04), y);
    ctx.quadraticCurveTo(-w * 0.1, y - 6, w * 0.1 - i * 4, y + 2);
  }
  ctx.stroke();
  ctx.strokeStyle = '#2a1e12';
  ctx.lineWidth = 2.4;
  body();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,210,0.15)';
  ellipse(ctx, -w * 0.22, -H * 0.8, w * 0.14, H * 0.06, -0.4);
  ctx.strokeStyle = BRONZE; // the torc
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(w * 0.06, -H * 0.36, w * 0.34, H * 0.08, 0, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = BRONZE_L;
  circle(ctx, w * 0.06 - w * 0.3, -H * 0.31, 4);
  circle(ctx, w * 0.06 + w * 0.3, -H * 0.31, 4);
  const blanket = asleep ? 1 : 0.4; // the peat over it (mostly slid off once it's up)
  ctx.fillStyle = PEAT;
  ctx.beginPath();
  ctx.moveTo(-w * 0.54, 2);
  ctx.quadraticCurveTo(-w * 0.5, -H * 0.5 * blanket, -w * 0.1, -H * 0.62 * blanket);
  ctx.quadraticCurveTo(w * 0.1, -H * 0.66 * blanket, w * 0.18, -H * 0.5 * blanket);
  ctx.quadraticCurveTo(w * 0.2, -H * 0.2 * blanket, w * 0.54, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5e7a44';
  for (let i = 0; i < 4; i++) ellipse(ctx, -w * 0.4 + i * w * 0.14, -H * (0.4 - Math.abs(i - 1.5) * 0.06) * blanket, 10, 3);
  const fx = w * 0.24, fy = -H * 0.62; // the face: eyes shut, or half open and sad
  if (!live) eyes(ctx, fx, fy, 11, t, seed, { dying, size: 1.3 });
  else if (asleep) {
    eyes(ctx, fx, fy, 11, t, seed, { shut: true, size: 1.3 });
    ctx.fillStyle = `rgba(230,222,206,${0.4 + 0.3 * Math.sin(t * 0.9)})`; // breath, slow
    circle(ctx, fx + 30 + ((t * 6) % 16), fy - 14 - ((t * 6) % 16), 3);
  } else {
    eyes(ctx, fx, fy, 11, t, seed, { size: 1.3 });
    ctx.fillStyle = '#5a4028'; // heavy lids
    ctx.fillRect(fx - 16, fy - 6, 10, 4);
    ctx.fillRect(fx + 6, fy - 6, 10, 4);
    ctx.strokeStyle = '#2a1e12';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(fx, fy + 18, 7, 1.15 * Math.PI, 1.85 * Math.PI); // a sad mouth
    ctx.stroke();
  }
  ctx.restore();
  return body;
}

export const BARROWS_MOB_ART = { bog_bloat: drawBogBloat, bogling: drawBogling, grave_lamp: drawGraveLamp, lantern_leech: drawLanternLeech, peat_mound: drawPeatMound, peat_clod: drawPeatClod, barrow_hound: drawBarrowHound, peat_sleeper: drawPeatSleeper };

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
function reedGrip(ctx, L, col = '#8a7a50') {
  ctx.fillStyle = '#2a2018';
  ctx.beginPath();
  ctx.roundRect(-2.6, -L * 0.22, 5.2, L * 0.22, 2);
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -L * 0.2; y < 0; y += 3.2) {
    ctx.moveTo(-2.6, y);
    ctx.lineTo(2.6, y + 1.6);
  }
  ctx.stroke();
}
// The Bog-Iron Cleaver: a broad heavy cleaver of black bog-iron, square-ended, a strand of dried weed tied at the guard
function drawBloatCleaver(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(200,180,120,0.8)';
    ctx.shadowBlur = 10;
  }
  const g = ctx.createLinearGradient(-6, 0, 8, 0);
  g.addColorStop(0, '#2a2622');
  g.addColorStop(0.5, '#4e4840');
  g.addColorStop(1, '#1e1a16');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-4, -L * 0.24);
  ctx.lineTo(-5, -L * 0.95);
  ctx.lineTo(8, -L);
  ctx.lineTo(9, -L * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(200,190,170,0.5)'; // the honed edge
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(8.5, -L * 0.98);
  ctx.lineTo(9, -L * 0.32);
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,100,60,0.4)'; // rust bloom
  ellipse(ctx, 1, -L * 0.6, 3, 5);
  ctx.fillStyle = '#3a3026';
  ctx.fillRect(-7, -L * 0.26, 18, 4);
  ctx.strokeStyle = '#6e8a4e';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-6, -L * 0.24);
  ctx.quadraticCurveTo(-10, -L * 0.16, -8, -L * 0.08);
  ctx.stroke();
  reedGrip(ctx, L);
  ctx.restore();
}
// Barrowfang: a short dark bronze blade with a hooked point like a hound's tooth
function drawBarrowfang(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(220,180,110,0.8)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = BRONZE_D;
  ctx.beginPath();
  ctx.moveTo(-4, -L * 0.24);
  ctx.quadraticCurveTo(-5, -L * 0.7, -1, -L * 0.94);
  ctx.quadraticCurveTo(6, -L * 1.02, 7, -L * 0.86); // the hook
  ctx.quadraticCurveTo(3, -L * 0.86, 4, -L * 0.7);
  ctx.lineTo(4, -L * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = BRONZE_L;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3.6, -L * 0.3);
  ctx.quadraticCurveTo(-4.4, -L * 0.7, -0.6, -L * 0.92);
  ctx.stroke();
  ctx.fillStyle = BRONZE;
  ctx.fillRect(-6, -L * 0.26, 12, 3.4);
  reedGrip(ctx, L);
  ctx.restore();
}
// The Sleeper's Blade: a long leaf-shaped blade of old bronze, gone brown in the peat, a midrib down it, a pommel ring
function drawSleeperBlade(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,214,150,0.85)';
    ctx.shadowBlur = 12;
  }
  const g = ctx.createLinearGradient(-6, 0, 6, 0);
  g.addColorStop(0, '#6a4a22');
  g.addColorStop(0.5, '#b08850');
  g.addColorStop(1, '#5a3e1c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-3, -L * 0.24);
  ctx.quadraticCurveTo(-7, -L * 0.6, 0, -L * 1.02); // leaf-shaped: swelling, then to a point
  ctx.quadraticCurveTo(7, -L * 0.6, 3, -L * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#4a3418'; // the midrib
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.26);
  ctx.lineTo(0, -L * 0.96);
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,150,110,0.35)'; // a little verdigris
  ellipse(ctx, -2, -L * 0.42, 2, 4);
  ctx.fillStyle = BRONZE;
  ctx.beginPath();
  ctx.ellipse(0, -L * 0.24, 7, 2.6, 0, 0, TAU);
  ctx.fill();
  reedGrip(ctx, L, '#6a5a40');
  ctx.strokeStyle = BRONZE;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 3, 3, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
export const BARROWS_SWORDS = { bloat_cleaver: drawBloatCleaver, barrowfang: drawBarrowfang, sleeper_blade: drawSleeperBlade };
export const BARROWS_SWORD_LEN = { bloat_cleaver: 66, barrowfang: 62, sleeper_blade: 68 };

// ——— helmets: (ctx, w, h) on a slime of that size, feet at the origin ———
// The Bloat Cap: a round cap of the Bloat's jelly set hard, brown as old glass, a sprig of bog myrtle stuck in it
function drawBloatCap(ctx, w, h) {
  const by = -h * 0.62, rx = w * 0.5;
  ctx.fillStyle = `rgba(${BOG},0.85)`;
  ctx.strokeStyle = PEAT_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.86, by + 6);
  ctx.bezierCurveTo(-rx * 0.9, by - h * 0.42, rx * 0.9, by - h * 0.42, rx * 0.86, by + 6);
  ctx.quadraticCurveTo(0, by + 1, -rx * 0.86, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,248,230,0.3)';
  ellipse(ctx, -rx * 0.3, by - h * 0.2, rx * 0.16, h * 0.05, -0.4);
  ctx.fillStyle = 'rgba(90,70,48,0.6)'; // a splinter of board set in it
  ctx.fillRect(-rx * 0.1, by - h * 0.12, rx * 0.36, 3);
  ctx.strokeStyle = '#6e8a4e'; // the sprig
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(rx * 0.4, by - h * 0.18);
  ctx.lineTo(rx * 0.6, by - h * 0.42);
  ctx.stroke();
  ctx.fillStyle = '#7e9a5a';
  ellipse(ctx, rx * 0.56, by - h * 0.36, 4, 2, -0.8);
  ellipse(ctx, rx * 0.62, by - h * 0.44, 4, 2, 0.6);
}
// The Bog-Iron Helm: a round black helm of bog-iron with a plaited reed band round the rim
function drawBogironHelm(ctx, w, h) {
  const by = -h * 0.6, rx = w * 0.52;
  ctx.fillStyle = '#2e2a26';
  ctx.strokeStyle = '#141210';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 8);
  ctx.bezierCurveTo(-rx * 1.02, by - h * 0.48, rx * 1.02, by - h * 0.48, rx, by + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,100,60,0.35)'; // rust
  ellipse(ctx, rx * 0.3, by - h * 0.2, rx * 0.2, h * 0.06, 0.3);
  ctx.fillStyle = 'rgba(200,190,170,0.18)';
  ellipse(ctx, -rx * 0.34, by - h * 0.26, rx * 0.14, h * 0.05, -0.4);
  ctx.strokeStyle = '#8a7a50'; // the plaited reed band
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 4);
  ctx.quadraticCurveTo(0, by - 2, rx, by + 4);
  ctx.stroke();
  ctx.strokeStyle = '#5a4e30';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -5; i <= 5; i++) {
    const x = (i / 5) * rx * 0.94;
    ctx.moveTo(x - 2, by + 3 - Math.cos((i / 5) * 1.4) * 3);
    ctx.lineTo(x + 2, by + 5 - Math.cos((i / 5) * 1.4) * 3);
  }
  ctx.stroke();
  ctx.fillStyle = '#2e2a26'; // a knob on top
  circle(ctx, 0, by - h * 0.36, 4);
}
// The Sleeper's Hood: a hood of woven wool the peat has dyed the colour of tea, a bronze pin at the throat
function drawSleeperHood(ctx, w, h) {
  const by = -h * 0.6, rx = w * 0.56;
  ctx.fillStyle = '#6a4a2c';
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 14);
  ctx.bezierCurveTo(-rx * 1.08, by - h * 0.5, rx * 0.9, by - h * 0.56, rx * 0.96, by + 10);
  ctx.quadraticCurveTo(rx * 0.6, by - 2, 0, by - 3);
  ctx.quadraticCurveTo(-rx * 0.66, by - 2, -rx, by + 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40,28,16,0.35)'; // the weave
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const y = by - h * 0.08 - i * h * 0.06;
    ctx.moveTo(-rx * (0.8 - i * 0.08), y);
    ctx.lineTo(rx * (0.76 - i * 0.08), y - 1);
  }
  ctx.stroke();
  ctx.fillStyle = '#6a4a2c'; // the point falling back
  ctx.beginPath();
  ctx.moveTo(-rx * 0.4, by - h * 0.4);
  ctx.quadraticCurveTo(-rx * 1.1, by - h * 0.46, -rx * 1.3, by - h * 0.1);
  ctx.quadraticCurveTo(-rx * 1.0, by - h * 0.24, -rx * 0.7, by - h * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRONZE; // the pin
  circle(ctx, rx * 0.66, by + 8, 4);
  ctx.fillStyle = BRONZE_L;
  circle(ctx, rx * 0.64, by + 7, 1.6);
}
export const BARROWS_HELMETS = { bloat_cap: drawBloatCap, bogiron_helm: drawBogironHelm, sleeper_hood: drawSleeperHood };

// ——— materials' icons (centred on the origin, about 28 px across) ———
function iconBloatJelly(ctx) {
  ctx.fillStyle = `rgba(${BOG},0.85)`;
  ctx.beginPath();
  ctx.moveTo(-12, 10);
  ctx.quadraticCurveTo(-14, -10, 0, -12);
  ctx.quadraticCurveTo(14, -10, 12, 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PEAT_D;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = 'rgba(90,70,48,0.8)';
  ctx.fillRect(-7, 0, 12, 3);
  ctx.fillStyle = 'rgba(255,248,230,0.35)';
  ellipse(ctx, -5, -6, 3, 2, -0.4);
}
function iconBarrowWick(ctx) {
  ctx.strokeStyle = '#1e1a1e';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.bezierCurveTo(-4, 0, 4, 6, 8, -8);
  ctx.stroke();
  softGlow(ctx, 9, -10, 9, LAMP, 0.6);
  ctx.fillStyle = '#ffe2a8';
  ellipse(ctx, 9, -11, 2.4, 4);
}
function iconLeechSkin(ctx) {
  ctx.fillStyle = '#1e1a1e';
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 6, -0.4, 0, TAU);
  ctx.fill();
  softGlow(ctx, 0, 0, 10, LAMP, 0.45);
  ctx.strokeStyle = 'rgba(80,70,84,0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -3; i <= 3; i++) {
    ctx.moveTo(i * 3.4 - 2, -5 + i * 1.3);
    ctx.lineTo(i * 3.4 + 2, 5 + i * 1.3);
  }
  ctx.stroke();
}
function iconBarrowPeat(ctx) {
  ctx.fillStyle = PEAT;
  ctx.beginPath();
  ctx.roundRect(-12, -8, 24, 16, 3);
  ctx.fill();
  ctx.strokeStyle = PEAT_D;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,70,50,0.8)';
  ctx.beginPath();
  ctx.moveTo(-10, -2); ctx.lineTo(10, -3);
  ctx.moveTo(-9, 3); ctx.lineTo(9, 3);
  ctx.stroke();
  ctx.fillStyle = '#5e7a44';
  ctx.fillRect(-12, -8, 24, 3);
}
function iconHoundCollar(ctx) {
  ctx.strokeStyle = '#8a7a50';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, -2, 11, 8, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#5a4e30';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    ctx.moveTo(Math.cos(a) * 9.5, -2 + Math.sin(a) * 6.5);
    ctx.lineTo(Math.cos(a + 0.2) * 12.5, -2 + Math.sin(a + 0.2) * 9.5);
  }
  ctx.stroke();
  ctx.fillStyle = BRONZE;
  circle(ctx, 0, 9, 3.6);
  ctx.fillStyle = BRONZE_D;
  circle(ctx, 0, 10.5, 1.2);
}
function iconBogBronze(ctx) {
  ctx.save();
  ctx.rotate(-0.5);
  ctx.fillStyle = BRONZE;
  ctx.fillRect(-12, -1.4, 22, 2.8); // a long pin
  circle(ctx, 11, 0, 3.4);
  ctx.restore();
  ctx.strokeStyle = BRONZE_L; // a ring
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(-4, 6, 5, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,150,110,0.6)'; // verdigris
  circle(ctx, -7, 3, 1.6);
  circle(ctx, 4, -4, 1.4);
}
export const BARROWS_ICONS = { bloat_jelly: iconBloatJelly, barrow_wick: iconBarrowWick, leech_skin: iconLeechSkin, barrow_peat: iconBarrowPeat, hound_collar: iconHoundCollar, bog_bronze: iconBogBronze };
