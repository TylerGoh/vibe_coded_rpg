// Docs: docs/places/bluehalls.md, docs/combat/stages.md
// The Blue Halls' art that isn't the room itself (src/bluehalls.js): its creatures (icicle bat, ice worm,
// glass beetle, prism crawler and the Hall Troll, the field boss; BLUEHALLS_MOB_ART, called by drawMob in
// src/field.js; the elites are drawn as their base mobs), the gear dropped there (BLUEHALLS_SWORDS,
// BLUEHALLS_SWORD_LEN, BLUEHALLS_HELMETS, drawn by drawSword / drawHelmet in src/field.js; the staves are data
// in src/staff-art.js) and its materials' icons (BLUEHALLS_ICONS).
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
const BLUE = '150,200,255';
function face(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, sleepy = false } = {}) {
  ctx.strokeStyle = INKC;
  ctx.fillStyle = INKC;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.6) < 0.12;
  for (const ex of [fx - gap, fx + gap]) {
    if (dying > 0.05) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex + 2.2 * size, fy + 2.2 * size);
      ctx.moveTo(ex + 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex - 2.2 * size, fy + 2.2 * size);
      ctx.stroke();
    } else if (blink || sleepy) {
      ctx.beginPath();
      ctx.arc(ex, fy - 1, 2.4 * size, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ellipse(ctx, ex, fy, 2.4 * size, 3.2 * size);
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
      ctx.fillStyle = INKC;
    }
  }
}
function halo(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function icicle(ctx, x, y, len, w = 2.4) {
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x, y + len);
  ctx.closePath();
  ctx.fill();
}

// Icicle bat: a grey-blue bat with icicles hanging off its wing fingers and big pale ears. m.warn: wings up,
// about to drop on you · m.charging: diving
function drawIcicleBat(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const cy = -h * 0.5, bob = live && !dive ? Math.sin(t * 4 + seed) * 3 : 0;
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(dive ? 0.5 : 0);
  const flap = dive ? -0.9 : warn ? -0.6 + Math.sin(t * 20) * 0.2 : Math.sin(t * 9 + seed) * 0.45;
  const wing = (s) => {
    ctx.save();
    ctx.translate(0, cy);
    ctx.rotate(flap * s);
    ctx.scale(1, s);
    ctx.fillStyle = s > 0 ? '#5a6a8a' : '#7a8aa8';
    ctx.strokeStyle = '#2e3654';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-w * 0.1, -h * 0.6);
    ctx.lineTo(-w * 0.5, -h * 0.4);
    ctx.quadraticCurveTo(-w * 0.38, -h * 0.25, -w * 0.4, -h * 0.1);
    ctx.quadraticCurveTo(-w * 0.24, -h * 0.12, -w * 0.18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(${BLUE},0.95)`;
    if (s > 0) for (const [x, y] of [[-0.5, -0.4], [-0.4, -0.1], [-0.18, 0]]) icicle(ctx, w * x, -h * y, 7, 1.8);
    ctx.restore();
  };
  wing(1);
  const body = () => {
    ctx.ellipse(0, cy, w * 0.18, h * 0.3, 0, 0, TAU);
  };
  ctx.fillStyle = '#6a7a9a';
  ctx.strokeStyle = '#2e3654';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // ears
  ctx.fillStyle = '#8a9ab8';
  for (const dx of [-0.08, 0.1]) {
    ctx.beginPath();
    ctx.moveTo(w * dx - 4, cy - h * 0.22);
    ctx.lineTo(w * dx + 1, cy - h * 0.56);
    ctx.lineTo(w * dx + 5, cy - h * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  wing(-1);
  face(ctx, w * 0.04, cy - h * 0.06, w * 0.06, t, seed, { dying, size: 0.75 });
  ctx.fillStyle = '#ffffff'; // two little fangs
  for (const dx of [0, 0.06]) icicle(ctx, w * dx + 1, cy + h * 0.08, 3, 1.2);
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// Ice worm: a long pale-blue worm of segments, glassy, a round mouth ringed with little ice teeth. m.special:
// it has tunnelled into the floor (blink) and only a ripple of ice chips shows
function drawIceWorm(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  if (gone) {
    ctx.fillStyle = 'rgba(200,230,255,0.9)';
    for (let i = 0; i < 6; i++) {
      const k = ((t * 3 + i / 6) % 1);
      circle(ctx, -w * 0.3 + i * w * 0.12, -k * h * 0.6, 2.2 * (1 - k) + 0.6);
    }
    ctx.fillStyle = '#4e8ad0';
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.4, h * 0.12, 0, Math.PI, 0);
    ctx.fill();
    return () => {
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.4, h * 0.12, 0, Math.PI, 0);
    };
  }
  const N = 7, crawl = m.walking ? t * 8 : t * 2;
  const segs = [];
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1);
    segs.push([-w * 0.42 + k * w * 0.76, -h * 0.32 - Math.max(0, Math.sin(crawl - i * 0.9)) * h * 0.18, h * (0.24 + k * 0.1)]);
  }
  const body = () => {
    for (const [x, y, r] of segs) {
      ctx.moveTo(x + r, y);
      ctx.ellipse(x, y, r * 1.05, r, 0, 0, TAU);
    }
  };
  const g = ctx.createLinearGradient(0, -h * 0.8, 0, 0);
  g.addColorStop(0, '#d8eeff');
  g.addColorStop(1, '#7aaee0');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2e5a8a';
  ctx.lineWidth = 1.6;
  for (const [x, y, r] of segs) {
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.05, r, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ellipse(ctx, x - r * 0.3, y - r * 0.45, r * 0.35, r * 0.18);
    ctx.fillStyle = g;
  }
  const [hx, hy, hr] = segs[N - 1];
  // the mouth, ringed with ice teeth
  ctx.fillStyle = '#1e3a64';
  ellipse(ctx, hx + hr * 0.6, hy + hr * 0.15, hr * 0.32, hr * 0.42);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    circle(ctx, hx + hr * 0.6 + Math.cos(a) * hr * 0.3, hy + hr * 0.15 + Math.sin(a) * hr * 0.38, 1.4);
  }
  face(ctx, hx + hr * 0.1, hy - hr * 0.45, hr * 0.28, t, seed, { dying, size: 0.7 });
  return () => {
    ctx.beginPath();
    body();
  };
}

// Glass beetle: a round beetle whose wing cases are clear blue ice, worn forward like a shield over its head:
// blows on its front don't land well. m.warn: shell down, about to lunge
function drawGlassBeetle(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const cy = -h * 0.46, step = m.walking ? Math.sin(t * 12) * 2.5 : 0;
  // legs
  ctx.strokeStyle = '#1e2a44';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const x = -w * 0.22 + i * w * 0.2, s = i % 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x, cy + h * 0.1);
    ctx.lineTo(x + w * 0.06, -h * 0.12 + s * step);
    ctx.lineTo(x + w * 0.1, s * step * 0.5);
    ctx.stroke();
  }
  // the dark body under the shell, and the head
  ctx.fillStyle = '#2a3a5a';
  ellipse(ctx, 0, cy + h * 0.06, w * 0.42, h * 0.28);
  ctx.fillStyle = '#34466a';
  ellipse(ctx, w * 0.38, cy + h * 0.06, w * 0.14, h * 0.18);
  face(ctx, w * 0.42, cy + h * 0.02, w * 0.04, t, seed, { dying, size: 0.7 });
  // feelers
  ctx.strokeStyle = '#1e2a44';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(w * 0.46, cy - h * 0.06);
  ctx.quadraticCurveTo(w * 0.56, cy - h * 0.3, w * 0.62, cy - h * 0.24 + Math.sin(t * 3) * 2);
  ctx.stroke();
  // the ice shell, tipped forward
  ctx.save();
  ctx.translate(0, cy);
  ctx.rotate(warn ? 0.18 : 0.05);
  const shell = () => {
    ctx.moveTo(-w * 0.46, h * 0.1);
    ctx.bezierCurveTo(-w * 0.48, -h * 0.55, w * 0.42, -h * 0.6, w * 0.5, h * 0.18);
    ctx.quadraticCurveTo(0, h * 0.02, -w * 0.46, h * 0.1);
    ctx.closePath();
  };
  ctx.fillStyle = 'rgba(160,210,255,0.7)';
  ctx.strokeStyle = '#2e5a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  shell();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(46,90,138,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.4);
  ctx.lineTo(w * 0.04, h * 0.06);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ellipse(ctx, -w * 0.16, -h * 0.26, w * 0.12, h * 0.07, -0.4);
  ctx.restore();
  return () => {
    ctx.save();
    ctx.translate(0, cy);
    ctx.rotate(warn ? 0.18 : 0.05);
    ctx.beginPath();
    shell();
    ctx.restore();
    ctx.moveTo(w * 0.52, cy + h * 0.06);
    ctx.ellipse(w * 0.38, cy + h * 0.06, w * 0.14, h * 0.18, 0, 0, TAU);
  };
}

// Prism crawler: a low crab-like thing whose back is a cluster of clear prisms; it soaks up the blue light and
// throws it along the floor. m.warn: its prisms glow, about to fire
function drawPrismCrawler(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const cy = -h * 0.32, step = m.walking ? Math.sin(t * 10) * 2 : 0;
  ctx.strokeStyle = '#26365a';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const x = -w * 0.3 + i * w * 0.2, s = i % 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(x - w * 0.08, -h * 0.08 + s * step);
    ctx.lineTo(x - w * 0.04, 0);
    ctx.stroke();
  }
  const body = () => {
    ctx.ellipse(0, cy, w * 0.42, h * 0.22, 0, 0, TAU);
  };
  ctx.fillStyle = '#3a4e7a';
  ctx.strokeStyle = '#1a2440';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  face(ctx, w * 0.3, cy + h * 0.02, w * 0.05, t, seed, { dying, size: 0.7 });
  // the prisms on its back
  if (warn) halo(ctx, 0, cy - h * 0.4, w * 0.6, '160,190,255', 0.6 + 0.2 * Math.sin(t * 30));
  const prisms = [[-0.22, 0.5, -0.2], [-0.04, 0.75, 0.05], [0.14, 0.6, 0.25], [0.28, 0.4, 0.4]];
  for (const [dx, ht, a] of prisms) {
    ctx.save();
    ctx.translate(w * dx, cy - h * 0.14);
    ctx.rotate(a);
    ctx.fillStyle = warn ? 'rgba(220,235,255,0.95)' : 'rgba(170,205,255,0.8)';
    ctx.strokeStyle = '#3e5a9a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-4, -h * ht);
    ctx.lineTo(0, -h * ht - 6);
    ctx.lineTo(4, -h * ht);
    ctx.lineTo(5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-3, -h * ht + 2, 2, h * ht - 4);
    ctx.restore();
  }
  return () => {
    ctx.beginPath();
    body();
  };
}

// The Hall Troll: a great blue-grey troll out of the cutters' stories, hunched, with a long nose, small sad eyes,
// moss and rime in its hair, and a block of ice under one arm for the next wall. m.warn: the block lifted
// overhead, about to throw
function drawHallTroll(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const step = m.walking ? Math.sin(t * 5) * 4 : 0, cy = -h * 0.5;
  // legs
  ctx.fillStyle = '#5a6a84';
  ctx.strokeStyle = '#26304a';
  ctx.lineWidth = 2.2;
  for (const [x, s] of [[-0.16, 1], [0.12, -1]]) {
    ctx.beginPath();
    ctx.roundRect(w * x - w * 0.09, -h * 0.3 - s * step * 0.4, w * 0.18, h * 0.3, [6, 6, 10, 10]);
    ctx.fill();
    ctx.stroke();
  }
  const body = () => {
    ctx.moveTo(-w * 0.36, cy + h * 0.24);
    ctx.quadraticCurveTo(-w * 0.46, cy - h * 0.1, -w * 0.24, cy - h * 0.34);
    ctx.quadraticCurveTo(0, cy - h * 0.48, w * 0.24, cy - h * 0.34);
    ctx.quadraticCurveTo(w * 0.44, cy - h * 0.1, w * 0.34, cy + h * 0.24);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, cy - h * 0.45, 0, cy + h * 0.3);
  g.addColorStop(0, '#8a9ab8');
  g.addColorStop(1, '#4e5e7c');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#26304a';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // a belly patch and a rope belt with an ice pick in it
  ctx.fillStyle = 'rgba(200,215,235,0.4)';
  ellipse(ctx, w * 0.02, cy + h * 0.06, w * 0.18, h * 0.14);
  ctx.strokeStyle = '#8a6a48';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.34, cy + h * 0.16);
  ctx.quadraticCurveTo(0, cy + h * 0.24, w * 0.32, cy + h * 0.16);
  ctx.stroke();
  // hair: moss and rime
  ctx.fillStyle = '#5e7a5a';
  for (let i = 0; i < 6; i++) ellipse(ctx, -w * 0.2 + i * w * 0.08, cy - h * 0.38 + Math.abs(i - 2.5) * 2, w * 0.06, h * 0.05);
  ctx.fillStyle = 'rgba(240,248,255,0.9)';
  for (let i = 0; i < 4; i++) icicle(ctx, -w * 0.16 + i * w * 0.1, cy - h * 0.34, 5 + (i % 2) * 3, 2);
  // the face: long drooping nose, small sad eyes, a tusk
  const fx = w * 0.16, fy = cy - h * 0.18;
  face(ctx, fx, fy, w * 0.06, t, seed, { dying, size: 1, sleepy: !warn && live && !m.walking });
  ctx.fillStyle = '#7a8aa8';
  ctx.strokeStyle = '#26304a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fx + w * 0.02, fy + h * 0.02);
  ctx.quadraticCurveTo(fx + w * 0.22, fy + h * 0.06, fx + w * 0.16, fy + h * 0.16);
  ctx.quadraticCurveTo(fx + w * 0.06, fy + h * 0.16, fx - w * 0.02, fy + h * 0.06);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f2ecd8';
  icicle(ctx, fx - w * 0.06, fy + h * 0.12, -9, 2.4);
  // arms and the ice block
  const block = (bx, by, s) => {
    ctx.fillStyle = 'rgba(120,180,240,0.9)';
    ctx.strokeStyle = '#1e3a6a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx - s / 2, by - s / 2, s, s * 0.8, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(230,245,255,0.8)';
    ctx.fillRect(bx - s / 2 + 4, by - s / 2 + 4, s * 0.3, 4);
  };
  ctx.fillStyle = '#6a7a96';
  ctx.strokeStyle = '#26304a';
  ctx.lineWidth = 2.2;
  if (warn) {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(s * w * 0.18 - w * 0.06, cy - h * 0.62, w * 0.12, h * 0.34, 6);
      ctx.fill();
      ctx.stroke();
    }
    block(0, cy - h * 0.7, w * 0.42);
  } else {
    ctx.beginPath();
    ctx.roundRect(-w * 0.44, cy - h * 0.16, w * 0.13, h * 0.42, 6);
    ctx.fill();
    ctx.stroke();
    block(w * 0.36, cy + h * 0.1, w * 0.3);
    ctx.fillStyle = '#6a7a96';
    ctx.beginPath();
    ctx.roundRect(w * 0.26, cy - h * 0.12, w * 0.12, h * 0.3, 6);
    ctx.fill();
    ctx.stroke();
  }
  return () => {
    ctx.beginPath();
    body();
  };
}

export const BLUEHALLS_MOB_ART = { icicle_bat: drawIcicleBat, ice_worm: drawIceWorm, glass_beetle: drawGlassBeetle, prism_crawler: drawPrismCrawler, hall_troll: drawHallTroll };

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
const grip = (ctx, c1, c2) => {
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.strokeStyle = c2;
  ctx.lineWidth = 1;
  for (let y = -1; y < 10; y += 3.2) {
    ctx.beginPath();
    ctx.moveTo(-3, y);
    ctx.lineTo(3, y + 1.6);
    ctx.stroke();
  }
};
// Prism Blade: a three-sided blade of clear ice, a fan of blue light split along its edge
function drawPrismBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(170,210,255,0.9)';
  ctx.strokeStyle = '#2e4a8a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-5, -6);
  ctx.lineTo(-5, -L * 0.82);
  ctx.lineTo(0, -L);
  ctx.lineTo(5, -L * 0.82);
  ctx.lineTo(5, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(-4, -8);
  ctx.lineTo(-4, -L * 0.8);
  ctx.lineTo(0, -L * 0.96);
  ctx.lineTo(0, -8);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `hsla(${200 + i * 30},90%,70%,${0.4 + 0.5 * glow})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(5 + i * 1.6, -10);
    ctx.lineTo(5 + i * 1.6, -L * 0.8);
    ctx.stroke();
  }
  ctx.fillStyle = '#6a7aa8';
  ctx.beginPath();
  ctx.roundRect(-9, -9, 18, 4, 2);
  ctx.fill();
  grip(ctx, '#8a9ac0', '#3e4a70');
  ctx.restore();
}
// Hall Troll's Maul: a cut block of glacier ice on a short pine trunk, chisel marks on it
function drawTrollMaul(ctx, L, glow) {
  ctx.save();
  ctx.fillStyle = '#7a5a40';
  ctx.strokeStyle = '#4e3a2c';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-3.5, -L * 0.72, 7, L * 0.72 + 4, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(120,180,240,0.95)';
  ctx.strokeStyle = '#1e3a6a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-11, -L, 22, L * 0.34, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(230,245,255,${0.6 + 0.3 * glow})`;
  ctx.fillRect(-8, -L + 3, 7, 3);
  ctx.strokeStyle = 'rgba(30,58,106,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(2, -L * 0.92);
  ctx.lineTo(7, -L * 0.8);
  ctx.moveTo(-4, -L * 0.82);
  ctx.lineTo(1, -L * 0.72);
  ctx.stroke();
  grip(ctx, '#8a6a48', '#4e3a2c');
  ctx.restore();
}
export const BLUEHALLS_SWORDS = { prism_blade: drawPrismBlade, troll_maul: drawTrollMaul };
export const BLUEHALLS_SWORD_LEN = { prism_blade: 62, troll_maul: 64 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Glass Beetle Helm: a beetle's two wing cases of clear blue ice, closed over the head like a little dome
function drawBeetleHelm(ctx, w, h) {
  const by = -h * 0.72, rx = w * 0.52;
  ctx.fillStyle = 'rgba(160,210,255,0.75)';
  ctx.strokeStyle = '#2e5a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx, by - h * 0.44, rx, by - h * 0.44, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, by - h * 0.32);
  ctx.lineTo(0, by + 4);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, -rx * 0.45, by - h * 0.18, rx * 0.18, h * 0.05, -0.4);
  ctx.strokeStyle = '#1e2a44';
  ctx.lineWidth = 1.4;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * rx * 0.2, by - h * 0.3);
    ctx.quadraticCurveTo(s * rx * 0.4, by - h * 0.5, s * rx * 0.6, by - h * 0.46);
    ctx.stroke();
  }
}
// Troll-Ice Helm: a lump of blue ice hollowed out like a pot and worn upside down, chisel marks round it
function drawTrollHelm(ctx, w, h) {
  const by = -h * 0.7, rx = w * 0.56;
  ctx.fillStyle = 'rgba(110,170,235,0.92)';
  ctx.strokeStyle = '#1e3a6a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 8);
  ctx.lineTo(-rx * 0.9, by - h * 0.3);
  ctx.quadraticCurveTo(0, by - h * 0.42, rx * 0.9, by - h * 0.3);
  ctx.lineTo(rx, by + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(230,245,255,0.7)';
  ctx.fillRect(-rx * 0.7, by - h * 0.26, rx * 0.3, 4);
  ctx.strokeStyle = 'rgba(30,58,106,0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-rx * 0.4 + i * rx * 0.3, by - h * 0.1);
    ctx.lineTo(-rx * 0.3 + i * rx * 0.3, by);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200,230,255,0.9)';
  for (let i = 0; i < 5; i++) icicle(ctx, -rx * 0.8 + i * rx * 0.4, by + 7, 4 + (i % 2) * 3, 1.6);
}
export const BLUEHALLS_HELMETS = { beetle_helm: drawBeetleHelm, troll_helm: drawTrollHelm };

// ——— materials' icons (40 × 40, centred) ———
function iconBatWing(ctx) {
  ctx.fillStyle = '#6a7a9a';
  ctx.strokeStyle = '#2e3654';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-14, -6);
  ctx.lineTo(14, -12);
  ctx.quadraticCurveTo(8, -2, 12, 6);
  ctx.quadraticCurveTo(2, 2, 0, 10);
  ctx.quadraticCurveTo(-6, 2, -14, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(${BLUE},0.95)`;
  for (const [x, y] of [[12, 6], [0, 10], [-14, 6]]) icicle(ctx, x, y, 6, 1.8);
}
function iconWormGlass(ctx) {
  halo(ctx, 0, 0, 16, BLUE, 0.4);
  ctx.fillStyle = 'rgba(190,225,255,0.9)';
  ctx.strokeStyle = '#2e5a8a';
  ctx.lineWidth = 1.5;
  for (const [x, y, r] of [[-6, 4, 7], [6, 2, 6], [0, -6, 6]]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    circle(ctx, x - r * 0.3, y - r * 0.35, r * 0.25);
    ctx.fillStyle = 'rgba(190,225,255,0.9)';
  }
}
function iconGlassShell(ctx) {
  ctx.fillStyle = 'rgba(160,210,255,0.8)';
  ctx.strokeStyle = '#2e5a8a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, 10);
  ctx.bezierCurveTo(-14, -14, 12, -16, 12, 10);
  ctx.quadraticCurveTo(0, 6, -12, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ellipse(ctx, -4, -4, 4, 2.5, -0.4);
}
function iconPrismShard(ctx) {
  ctx.save();
  ctx.rotate(0.4);
  ctx.fillStyle = 'rgba(190,220,255,0.9)';
  ctx.strokeStyle = '#3e5a9a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6, 14);
  ctx.lineTo(-5, -10);
  ctx.lineTo(0, -16);
  ctx.lineTo(5, -10);
  ctx.lineTo(6, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `hsla(${200 + i * 30},90%,70%,0.8)`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(6, 4 + i * 3);
    ctx.lineTo(17, 8 + i * 5);
    ctx.stroke();
  }
}
function iconTrollTooth(ctx) {
  ctx.fillStyle = '#b8c4d8';
  ctx.strokeStyle = '#3e4a68';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-10, -12);
  ctx.quadraticCurveTo(0, -16, 10, -12);
  ctx.lineTo(8, 4);
  ctx.quadraticCurveTo(6, 14, 2, 14);
  ctx.lineTo(1, 6);
  ctx.lineTo(-1, 6);
  ctx.lineTo(-2, 14);
  ctx.quadraticCurveTo(-6, 14, -8, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ellipse(ctx, -4, -6, 3, 4);
}
export const BLUEHALLS_ICONS = { bat_wing: iconBatWing, worm_glass: iconWormGlass, glass_shell: iconGlassShell, prism_shard: iconPrismShard, troll_tooth: iconTrollTooth };
