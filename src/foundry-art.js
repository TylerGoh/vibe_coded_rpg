// Docs: docs/places/foundry.md, docs/combat/stages.md
// The Old Foundry's art that isn't the room itself (src/foundry.js): its creatures (iron ant, slag golem and its
// slaglings, crucible newt, soot hound, bellows toad, and Old Crucible, the field boss; FOUNDRY_MOB_ART, called by
// drawMob in src/field.js; the elites are drawn as their base mob), the gear dropped there (FOUNDRY_SWORDS,
// FOUNDRY_SWORD_LEN, FOUNDRY_HELMETS, drawn by drawSword / drawHelmet in src/field.js; the staves and bows are data in
// src/staff-art.js and src/bow-art.js) and its materials' icons (FOUNDRY_ICONS). Emberdeep's register: iron, slag,
// soot, brick; dark, with a red glow only where something is still hot.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
const IRON = '#8a8490', IRON_D = '#4e4a56', IRON_L = '#b0aab4';
const SLAG = '#2a2426', SLAG_D = '#141012', SLAG_L = '#4a4246';
const EMBER = '#ff7a3a', EMBER_L = '#ffc070';
const SOOTC = '#1e1a1c', SOOT_L = '#3a3436';

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, glow = null } = {}) {
  ctx.strokeStyle = INKC;
  ctx.fillStyle = glow ?? INKC;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.8) < 0.12;
  for (const ex of [fx - gap, fx + gap]) {
    if (dying > 0.05) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex + 2.2 * size, fy + 2.2 * size);
      ctx.moveTo(ex + 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex - 2.2 * size, fy + 2.2 * size);
      ctx.stroke();
    } else if (blink) {
      ctx.beginPath();
      ctx.arc(ex, fy - 1, 2.4 * size, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ellipse(ctx, ex, fy, 2.4 * size, 3.2 * size);
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
      ctx.fillStyle = glow ?? INKC;
    }
  }
}
// a soft red glow, for anything still hot
function ember(ctx, x, y, r, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,140,70,${a})`);
  g.addColorStop(1, 'rgba(255,90,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

// Iron ant: a big black ant carrying a bent plate of scrap iron in its jaws, held up in front like a shield. Hit it
// from behind (the `shell` brain): its abdomen is soft and dull red
function drawIronAnt(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, ram = !!m.charging && live;
  const step = m.walking || ram ? Math.sin(t * 14 + seed) * 2.4 : 0;
  const cy = -h * 0.42;
  // six legs
  ctx.strokeStyle = SLAG_D;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const x = -w * 0.12 + i * w * 0.12, lift = i % 2 ? step : -step;
    ctx.beginPath();
    ctx.moveTo(x, cy + 2);
    ctx.lineTo(x + (i - 1) * 6, cy - h * 0.1 - lift);
    ctx.lineTo(x + (i - 1) * 10, -1);
    ctx.stroke();
  }
  // abdomen, waist, thorax
  ctx.fillStyle = '#4a2622';
  ellipse(ctx, -w * 0.3, cy, w * 0.2, h * 0.26);
  ctx.fillStyle = 'rgba(255,110,60,0.35)';
  ellipse(ctx, -w * 0.34, cy - 2, w * 0.1, h * 0.12);
  ctx.fillStyle = SLAG;
  ellipse(ctx, -w * 0.04, cy - 2, w * 0.13, h * 0.16);
  ellipse(ctx, w * 0.16, cy - 6, w * 0.1, h * 0.17);
  // feelers
  ctx.strokeStyle = SLAG_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(w * 0.2, cy - h * 0.2);
  ctx.quadraticCurveTo(w * 0.28, cy - h * 0.6, w * 0.36, cy - h * 0.62 + Math.sin(t * 4 + seed) * 2);
  ctx.stroke();
  eyes(ctx, w * 0.2, cy - 8, 2.4, t, seed, { dying, size: 0.45, glow: EMBER });
  // the scrap plate, held up in front (raised higher when it's about to ram)
  const plate = () => {
    const py = cy + (warn ? -6 : 0);
    ctx.moveTo(w * 0.28, py + h * 0.42);
    ctx.lineTo(w * 0.26, py - h * 0.5);
    ctx.lineTo(w * 0.44, py - h * 0.44);
    ctx.lineTo(w * 0.5, py + h * 0.36);
    ctx.closePath();
  };
  ctx.fillStyle = IRON_D;
  ctx.strokeStyle = '#2e2a34';
  ctx.lineWidth = 2;
  ctx.beginPath();
  plate();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(140,70,40,0.55)'; // rust
  ellipse(ctx, w * 0.36, cy - h * 0.1, 3, 5);
  ctx.fillStyle = IRON_L;
  for (const y of [-0.34, 0, 0.26]) circle(ctx, w * 0.34, cy + h * y, 1.4);
  return () => {
    ctx.beginPath();
    plate();
    ctx.ellipse(-w * 0.3, cy, w * 0.2, h * 0.26, 0, 0, TAU);
    ctx.ellipse(-w * 0.04, cy - 2, w * 0.13, h * 0.16, 0, 0, TAU);
    ctx.ellipse(w * 0.16, cy - 6, w * 0.1, h * 0.17, 0, 0, TAU);
  };
}

// Slag golem: a heap of black glassy slag that got up and walks, two stubby legs, glowing cracks; break it and it
// falls apart into slaglings (the `split` brain)
function lumps(w, h) {
  return [[0, -0.34, 0.34, 0.24], [-0.16, -0.62, 0.24, 0.18], [0.12, -0.7, 0.2, 0.16], [0, -0.86, 0.16, 0.12]].map(([x, y, rx, ry]) => [x * w, y * h, rx * w, ry * h]);
}
function drawSlagGolem(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const step = m.walking ? Math.sin(t * 7 + seed) * 3 : 0;
  ctx.fillStyle = SLAG_D;
  ctx.beginPath();
  ctx.roundRect(-w * 0.26, -h * 0.2 - step, w * 0.18, h * 0.2 + step, 4);
  ctx.roundRect(w * 0.08, -h * 0.2 + step, w * 0.18, h * 0.2 - step, 4);
  ctx.fill();
  const L = lumps(w, h);
  ctx.strokeStyle = SLAG_D;
  ctx.lineWidth = 2;
  L.forEach(([x, y, rx, ry], i) => {
    ctx.fillStyle = i % 2 ? SLAG : '#332c30';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  });
  // glowing cracks between the lumps
  if (live) {
    ctx.strokeStyle = `rgba(255,120,60,${0.6 + 0.25 * Math.sin(t * 3 + seed)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, -h * 0.4);
    ctx.lineTo(-w * 0.04, -h * 0.5);
    ctx.lineTo(w * 0.1, -h * 0.44);
    ctx.moveTo(w * 0.04, -h * 0.26);
    ctx.lineTo(w * 0.18, -h * 0.3);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(170,180,210,0.35)'; // glassy glints
  for (const [x, y] of [[-0.1, -0.3], [0.14, -0.66], [-0.2, -0.6]]) ellipse(ctx, w * x, h * y, 3, 1.4, -0.4);
  eyes(ctx, w * 0.06, -h * 0.84, 3, t, seed, { dying, size: 0.55, glow: EMBER });
  return () => {
    ctx.beginPath();
    for (const [x, y, rx, ry] of L) {
      ctx.moveTo(x + rx, y);
      ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    }
  };
}
// A slagling: one lump of the golem, hopping, a single glowing eye-crack
function drawSlagling(ctx, w, h, t, seed, m, dying) {
  ctx.fillStyle = SLAG;
  ctx.strokeStyle = SLAG_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.48, 0);
  ctx.lineTo(-w * 0.36, -h * 0.8);
  ctx.lineTo(w * 0.1, -h * 0.98);
  ctx.lineTo(w * 0.5, -h * 0.5);
  ctx.lineTo(w * 0.44, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(170,180,210,0.35)';
  ellipse(ctx, -w * 0.16, -h * 0.6, 2.4, 1.2, -0.4);
  eyes(ctx, w * 0.16, -h * 0.5, 2, t, seed, { dying, size: 0.4, glow: EMBER });
  return () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.48, 0);
    ctx.lineTo(-w * 0.36, -h * 0.8);
    ctx.lineTo(w * 0.1, -h * 0.98);
    ctx.lineTo(w * 0.5, -h * 0.5);
    ctx.lineTo(w * 0.44, 0);
    ctx.closePath();
  };
}

// Crucible newt: a long orange-and-black newt with a cheek pouch full of molten metal, which it swells and lobs
// (the `lob` brain). Its skin won't burn
function drawCrucibleNewt(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const step = m.walking ? Math.sin(t * 10 + seed) * 2.4 : 0;
  const cy = -h * 0.42;
  // legs
  ctx.strokeStyle = '#2a1c1a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const [x, s] of [[-w * 0.18, 1], [w * 0.16, -1]]) {
    ctx.beginPath();
    ctx.moveTo(x, cy + 2);
    ctx.lineTo(x + 4 + step * s, -1);
    ctx.stroke();
  }
  // tail
  ctx.fillStyle = '#e06a2a';
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, cy - h * 0.2);
  ctx.quadraticCurveTo(-w * 0.44, cy - h * 0.1 + Math.sin(t * 3 + seed) * 3, -w * 0.52, cy + h * 0.2);
  ctx.quadraticCurveTo(-w * 0.38, cy + h * 0.14, -w * 0.18, cy + h * 0.2);
  ctx.closePath();
  ctx.fill();
  // body
  const body = () => {
    ctx.moveTo(-w * 0.24, cy);
    ctx.ellipse(0, cy, w * 0.26, h * 0.3, 0, Math.PI, TAU);
    ctx.quadraticCurveTo(w * 0.42, cy - h * 0.34, w * 0.44, cy + h * 0.04);
    ctx.quadraticCurveTo(w * 0.3, cy + h * 0.36, 0, cy + h * 0.3);
    ctx.quadraticCurveTo(-w * 0.2, cy + h * 0.3, -w * 0.24, cy);
  };
  ctx.fillStyle = '#e06a2a';
  ctx.strokeStyle = '#6a2a14';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SOOTC; // black blotches
  for (const [x, y, r] of [[-0.12, -0.1, 4], [0.06, -0.2, 3.4], [0.2, -0.08, 3], [-0.02, 0.06, 2.6]]) ellipse(ctx, w * x, cy + h * y, r * 1.3, r);
  // the cheek pouch, glowing with metal (fuller and brighter before it spits)
  const pr = warn ? 7 : 4.5;
  ember(ctx, w * 0.32, cy + h * 0.12, pr * 2.4, live ? 0.6 : 0);
  ctx.fillStyle = live ? (warn ? EMBER_L : EMBER) : '#5a3a30';
  circle(ctx, w * 0.32, cy + h * 0.12, pr);
  eyes(ctx, w * 0.3, cy - h * 0.16, 3, t, seed, { dying, size: 0.5 });
  return () => {
    ctx.beginPath();
    body();
  };
}

// Soot hound: a lean black dog matted with soot, a scorched collar of old chain, red eyes; it runs at anything
// that moves (a plain aggressive chaser), leaving a puff of soot at each step
function drawSootHound(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const run = !!m.walking && live, ph = t * (run ? 16 : 3) + seed;
  const cy = -h * 0.56;
  ctx.strokeStyle = SOOTC;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const [x, o] of [[-w * 0.26, 0], [-w * 0.16, Math.PI], [w * 0.18, Math.PI * 0.5], [w * 0.26, Math.PI * 1.5]]) {
    const sw = run ? Math.sin(ph + o) * 6 : 0;
    ctx.beginPath();
    ctx.moveTo(x, cy + h * 0.1);
    ctx.lineTo(x + sw, -2);
    ctx.stroke();
  }
  // tail, ragged
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.32, cy - h * 0.06);
  ctx.quadraticCurveTo(-w * 0.46, cy - h * 0.4, -w * 0.5, cy - h * 0.2 + Math.sin(ph * 0.5) * 3);
  ctx.stroke();
  const body = () => {
    ctx.moveTo(-w * 0.34, cy);
    ctx.quadraticCurveTo(-w * 0.3, cy - h * 0.26, 0, cy - h * 0.22);
    ctx.quadraticCurveTo(w * 0.24, cy - h * 0.26, w * 0.3, cy - h * 0.12);
    ctx.lineTo(w * 0.34, cy - h * 0.42); // the head, up
    ctx.lineTo(w * 0.5, cy - h * 0.3);
    ctx.lineTo(w * 0.52, cy - h * 0.18);
    ctx.lineTo(w * 0.36, cy + h * 0.06);
    ctx.quadraticCurveTo(0, cy + h * 0.22, -w * 0.34, cy + h * 0.1);
    ctx.closePath();
  };
  ctx.fillStyle = SOOTC;
  ctx.strokeStyle = '#0a0809';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // matted tufts
  ctx.fillStyle = SOOT_L;
  for (const [x, y] of [[-0.2, -0.2], [-0.04, -0.2], [0.12, -0.2], [0.26, -0.3]]) {
    ctx.beginPath();
    ctx.moveTo(w * x - 3, cy + h * y + 2);
    ctx.lineTo(w * x, cy + h * y - 4);
    ctx.lineTo(w * x + 3, cy + h * y + 2);
    ctx.fill();
  }
  // ears
  ctx.fillStyle = SOOTC;
  ctx.beginPath();
  ctx.moveTo(w * 0.34, cy - h * 0.4);
  ctx.lineTo(w * 0.36, cy - h * 0.6);
  ctx.lineTo(w * 0.42, cy - h * 0.38);
  ctx.fill();
  // the chain collar
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(w * 0.3, cy - h * 0.34);
  ctx.lineTo(w * 0.36, cy + h * 0.02);
  ctx.stroke();
  ctx.setLineDash([]);
  eyes(ctx, w * 0.44, cy - h * 0.3, 2.4, t, seed, { dying, size: 0.5, glow: '#ff4a3a' });
  // soot puffing off it as it runs
  if (run) {
    const k = (t * 2 + seed) % 1;
    ctx.fillStyle = `rgba(40,34,36,${0.5 * (1 - k)})`;
    circle(ctx, -w * 0.3 - k * 16, -4 - k * 10, 3 + k * 6);
  }
  return () => {
    ctx.beginPath();
    body();
  };
}

// Bellows toad: a fat grey toad whose pleated sides fold like a forge bellows; it fills up (the warn) and lets out
// a low blast of hot air along the floor (the `beam` brain)
function drawBellowsToad(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const puff = warn ? 1.18 : 1 + 0.03 * Math.sin(t * 2 + seed);
  const cy = -h * 0.44;
  const rx = w * 0.42 * puff, ry = h * 0.44 * puff;
  // back legs
  ctx.fillStyle = '#4e4a52';
  ellipse(ctx, -w * 0.3, -h * 0.12, w * 0.16, h * 0.14);
  ellipse(ctx, w * 0.22, -h * 0.08, w * 0.1, h * 0.1);
  // body
  ctx.fillStyle = '#6a646c';
  ctx.strokeStyle = '#2e2a32';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, cy, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // the pleats down its side, like bellows leather
  ctx.strokeStyle = 'rgba(40,36,44,0.6)';
  ctx.lineWidth = 1.4;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-rx * 0.6 + i * 2, cy - ry * 0.5 + Math.abs(i) * 4);
    ctx.lineTo(rx * 0.3 + i * 2, cy + ry * 0.6 - Math.abs(i) * 3);
    ctx.stroke();
  }
  // warts with a dull red in them
  ctx.fillStyle = '#8a7a7e';
  for (const [x, y] of [[-0.2, -0.3], [0.04, -0.4], [-0.3, 0.05]]) circle(ctx, rx * x * 2, cy + ry * y, 2.4);
  // the mouth: wide; glowing when it's about to blow
  ctx.strokeStyle = '#2e2a32';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rx * 0.5, cy + ry * 0.2);
  ctx.quadraticCurveTo(rx * 0.8, cy + ry * 0.35, rx * 0.98, cy + ry * 0.1);
  ctx.stroke();
  if (warn) {
    ember(ctx, rx * 0.96, cy + ry * 0.2, 16, 0.7);
    ctx.fillStyle = 'rgba(255,220,180,0.5)';
    for (let i = 0; i < 3; i++) circle(ctx, rx + 6 + i * 6, cy + ry * 0.2 + Math.sin(t * 20 + i) * 2, 2 + i);
  }
  eyes(ctx, rx * 0.5, cy - ry * 0.6, 4, t, seed, { dying, size: 0.6, glow: '#ffb070' });
  return () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, rx, ry, 0, 0, TAU);
  };
}

// Old Crucible: a fire salamander as long as a cart, black with orange blotches, its back crusted with cooled slag
// that cracks to show the glow beneath; a wide flat head, a mouth that fills with molten metal before it lobs
function drawOldCrucible(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const walk = !!m.walking && live, ph = t * (walk ? 7 : 1.5) + seed;
  const cy = -h * 0.5;
  const sway = (x) => Math.sin(ph * 0.6 + x * 3) * 4;
  // the tail, long and tapering
  ctx.fillStyle = '#1e1618';
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, cy - h * 0.24);
  ctx.quadraticCurveTo(-w * 0.4, cy - h * 0.1 + sway(-0.4), -w * 0.52, cy + h * 0.06 + sway(-0.6));
  ctx.quadraticCurveTo(-w * 0.4, cy + h * 0.22, -w * 0.2, cy + h * 0.26);
  ctx.closePath();
  ctx.fill();
  // legs, splayed
  ctx.strokeStyle = '#1e1618';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  for (const [x, o] of [[-w * 0.16, 0], [-w * 0.1, Math.PI], [w * 0.18, Math.PI], [w * 0.24, 0]]) {
    const sw = walk ? Math.sin(ph + o) * 8 : 0;
    ctx.beginPath();
    ctx.moveTo(x, cy + h * 0.1);
    ctx.lineTo(x + sw - 10, -h * 0.2);
    ctx.lineTo(x + sw, -3);
    ctx.stroke();
  }
  const body = () => {
    ctx.moveTo(-w * 0.24, cy);
    ctx.quadraticCurveTo(-w * 0.2, cy - h * 0.36, 0, cy - h * 0.34);
    ctx.quadraticCurveTo(w * 0.22, cy - h * 0.34, w * 0.3, cy - h * 0.24);
    // the head: wide and flat
    ctx.quadraticCurveTo(w * 0.42, cy - h * 0.4, w * 0.5, cy - h * 0.18);
    ctx.quadraticCurveTo(w * 0.52, cy + (warn ? h * 0.12 : 0), w * 0.44, cy + h * 0.1);
    ctx.quadraticCurveTo(w * 0.3, cy + h * 0.22, 0, cy + h * 0.26);
    ctx.quadraticCurveTo(-w * 0.22, cy + h * 0.26, -w * 0.24, cy);
    ctx.closePath();
  };
  ctx.fillStyle = '#241a1c';
  ctx.strokeStyle = '#0c0808';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // orange blotches
  ctx.fillStyle = '#e8701e';
  for (const [x, y, r] of [[-0.16, -0.1, 9], [-0.02, 0.08, 7], [0.12, -0.04, 8], [0.26, 0.06, 6], [0.42, -0.14, 5]]) ellipse(ctx, w * x, cy + h * y, r * 1.4, r);
  // the slag crust along its back, cracked, glowing in the cracks
  ctx.fillStyle = SLAG;
  ctx.strokeStyle = SLAG_D;
  ctx.lineWidth = 1.6;
  const plates = [[-0.18, -0.3, 0.07], [-0.06, -0.34, 0.08], [0.06, -0.34, 0.08], [0.18, -0.3, 0.07], [0.28, -0.26, 0.05]];
  for (const [x, y, r] of plates) {
    ctx.beginPath();
    ctx.ellipse(w * x, cy + h * y, w * r, h * 0.12, 0, Math.PI, TAU);
    ctx.fill();
    ctx.stroke();
  }
  if (live) {
    ctx.strokeStyle = `rgba(255,${130 + 30 * Math.sin(t * 2.4)},60,0.85)`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (const [x, y, r] of plates) {
      ctx.moveTo(w * (x - r * 0.6), cy + h * (y - 0.04));
      ctx.lineTo(w * x, cy + h * (y - 0.1));
      ctx.lineTo(w * (x + r * 0.5), cy + h * (y - 0.02));
    }
    ctx.stroke();
  }
  // the mouth: a long line; open and full of metal before it lobs
  if (warn) {
    ember(ctx, w * 0.46, cy + h * 0.02, 30, 0.75);
    ctx.fillStyle = EMBER_L;
    ellipse(ctx, w * 0.46, cy + h * 0.02, w * 0.05, h * 0.07);
  } else {
    ctx.strokeStyle = '#0c0808';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.34, cy + h * 0.02);
    ctx.quadraticCurveTo(w * 0.44, cy + h * 0.06, w * 0.5, cy - h * 0.06);
    ctx.stroke();
  }
  eyes(ctx, w * 0.4, cy - h * 0.24, 6, t, seed, { dying, size: 1.1, glow: '#ffb050' });
  // heat shimmer off its back
  if (live) {
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.5 + i / 4 + seed * 0.1) % 1;
      ctx.fillStyle = `rgba(255,170,110,${0.25 * Math.sin(k * Math.PI)})`;
      circle(ctx, w * (-0.16 + i * 0.12), cy - h * 0.4 - k * 30, 3 + k * 5);
    }
  }
  return () => {
    ctx.beginPath();
    body();
  };
}

export const FOUNDRY_MOB_ART = { iron_ant: drawIronAnt, slag_golem: drawSlagGolem, slagling: drawSlagling, crucible_newt: drawCrucibleNewt, soot_hound: drawSootHound, bellows_toad: drawBellowsToad, old_crucible: drawOldCrucible };

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
function ironGrip(ctx) {
  ctx.fillStyle = '#4a3a34';
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.fillStyle = IRON;
  ctx.fillRect(-7, -5, 14, 3.5);
  circle(ctx, 0, 12, 2.6);
}
// Sootfang: a short black iron blade hooked at the tip like a hound's tooth, sooty
function drawSootfang(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,90,70,0.8)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = '#2a2628';
  ctx.beginPath();
  ctx.moveTo(-3.5, -5);
  ctx.lineTo(-3.5, -L * 0.8);
  ctx.quadraticCurveTo(-3, -L, 5, -L * 0.94);
  ctx.quadraticCurveTo(1, -L * 0.88, 3.5, -L * 0.76);
  ctx.lineTo(3.5, -5);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(160,150,160,0.5)'; // the edge, wiped bright
  ctx.fillRect(2, -L * 0.74, 1.4, L * 0.66);
  ctx.fillStyle = 'rgba(60,52,56,0.7)'; // soot smudges
  for (const k of [0.3, 0.5, 0.66]) ellipse(ctx, -1, -L * k, 2.2, 3);
  ironGrip(ctx);
  ctx.restore();
}
// Crucible Blade: a long iron blade poured in one go, its fuller still faintly glowing, a salamander's tail curled
// round the guard
function drawCrucibleBlade(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,140,60,0.85)';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.moveTo(-4.5, -5);
  ctx.lineTo(-4, -L * 0.9);
  ctx.lineTo(0, -L);
  ctx.lineTo(4, -L * 0.9);
  ctx.lineTo(4.5, -5);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,130,60,0.75)'; // the fuller, still warm
  ctx.fillRect(-1, -L * 0.86, 2, L * 0.78);
  ctx.fillStyle = 'rgba(30,24,26,0.5)'; // the cast's rough skin at the edges
  for (let k = 0.15; k < 0.85; k += 0.12) circle(ctx, -3, -L * k, 1);
  ironGrip(ctx);
  // the salamander's tail round the guard
  ctx.strokeStyle = '#e8701e';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-7, -4);
  ctx.quadraticCurveTo(-11, 4, -4, 6);
  ctx.quadraticCurveTo(2, 7, 3, 2);
  ctx.stroke();
  ctx.fillStyle = '#1e1618';
  circle(ctx, -9, 1, 1.4);
  ctx.restore();
}
export const FOUNDRY_SWORDS = { sootfang: drawSootfang, crucible_blade: drawCrucibleBlade };
export const FOUNDRY_SWORD_LEN = { sootfang: 60, crucible_blade: 66 };

// ——— helmets: (ctx, w, h), the slime's size; drawn over its top ———
// Scrap-Iron Helm: an iron cap riveted together from odd scrap plates, every one a different shape
function drawScrapHelm(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.54;
  ctx.fillStyle = IRON_D;
  ctx.strokeStyle = '#2e2a34';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx * 1.04, by - h * 0.56, rx * 1.04, by - h * 0.56, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the odd plates
  ctx.lineWidth = 1.2;
  for (const [x0, y0, x1, y1, c] of [[-0.9, 0.04, -0.3, 0.32, IRON], [-0.3, 0.1, 0.3, 0.4, '#6e6872'], [0.3, 0.04, 0.9, 0.28, '#7a5a4a'], [-0.5, 0.3, 0.1, 0.5, '#7a7480']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(rx * x0, by - h * y0);
    ctx.lineTo(rx * x1, by - h * y0 - 2);
    ctx.lineTo(rx * x1 - 3, by - h * y1);
    ctx.lineTo(rx * x0 + 4, by - h * y1 + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = IRON_L;
  for (const [x, y] of [[-0.6, 0.12], [-0.1, 0.2], [0.5, 0.12], [-0.2, 0.42], [0.2, 0.34], [0.7, 0.2]]) circle(ctx, rx * x, by - h * y, 1.5);
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by + 1, rx * 2.04, 6, 3);
  ctx.fill();
  ctx.stroke();
}
// Crucible Helm: a heavy iron helm crusted with cooled slag, cracked to show a glow, a salamander's crest down the back
function drawCrucibleHelm(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.56;
  ctx.fillStyle = '#3e383e';
  ctx.strokeStyle = '#1e1a1e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx * 1.04, by - h * 0.6, rx * 1.04, by - h * 0.6, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the slag crust in lumps
  ctx.fillStyle = SLAG;
  for (const [x, y, r] of [[-0.5, 0.14, 0.2], [-0.1, 0.3, 0.24], [0.34, 0.2, 0.2], [0.04, 0.08, 0.18]]) ellipse(ctx, rx * x, by - h * y, rx * r, h * r * 0.4);
  ctx.strokeStyle = 'rgba(255,130,60,0.85)'; // the glow in the cracks
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.6, by - h * 0.1);
  ctx.lineTo(-rx * 0.2, by - h * 0.22);
  ctx.lineTo(rx * 0.1, by - h * 0.16);
  ctx.moveTo(rx * 0.2, by - h * 0.3);
  ctx.lineTo(rx * 0.5, by - h * 0.18);
  ctx.stroke();
  // the crest, black and orange, from brow to back
  ctx.fillStyle = '#e8701e';
  ctx.strokeStyle = '#6a2a14';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.5, by - h * 0.4);
  for (let i = 0; i <= 5; i++) {
    const x = -rx * 0.5 + i * rx * 0.2;
    ctx.lineTo(x + rx * 0.1, by - h * (0.56 + (i % 2) * 0.06) + Math.abs(i - 2.5) * 2);
    ctx.lineTo(x + rx * 0.2, by - h * 0.44 + Math.abs(i - 2.5) * 2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by + 1, rx * 2.04, 6, 3);
  ctx.fill();
  ctx.stroke();
}
export const FOUNDRY_HELMETS = { scrap_helm: drawScrapHelm, crucible_helm: drawCrucibleHelm };

// ——— material icons: (ctx), centred, about 30 px ———
function iconAntIron(ctx) {
  ctx.fillStyle = IRON_D;
  ctx.strokeStyle = '#2e2a34';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, 6);
  ctx.quadraticCurveTo(-8, -12, 6, -10);
  ctx.lineTo(12, -2);
  ctx.quadraticCurveTo(2, 0, 0, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(140,70,40,0.6)';
  ellipse(ctx, -2, -2, 3, 2);
  ctx.fillStyle = IRON_L; // the bite marks
  for (const [x, y] of [[8, -4], [10, -1], [4, -9]]) circle(ctx, x, y, 1.2);
}
function iconSlagLump(ctx) {
  ctx.fillStyle = SLAG;
  ctx.strokeStyle = SLAG_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, 6);
  ctx.lineTo(-8, -8);
  ctx.lineTo(4, -12);
  ctx.lineTo(12, -2);
  ctx.lineTo(8, 10);
  ctx.lineTo(-4, 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,60,0.8)';
  ellipse(ctx, 0, 2, 4, 2);
  ctx.fillStyle = 'rgba(180,190,220,0.5)';
  ellipse(ctx, -4, -5, 3, 1.2, -0.4);
}
function iconNewtSkin(ctx) {
  ctx.fillStyle = '#e06a2a';
  ctx.strokeStyle = '#6a2a14';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-13, 4);
  ctx.quadraticCurveTo(-10, -10, 4, -8);
  ctx.quadraticCurveTo(14, -6, 13, 4);
  ctx.quadraticCurveTo(0, 10, -13, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SOOTC;
  for (const [x, y, r] of [[-6, -2, 3], [2, -4, 2.4], [7, 1, 2]]) circle(ctx, x, y, r);
}
function iconSootPelt(ctx) {
  ctx.fillStyle = SOOTC;
  ctx.beginPath();
  ctx.moveTo(-13, 8);
  for (let i = 0; i <= 8; i++) ctx.lineTo(-13 + i * 3.25, -6 - (i % 2) * 5);
  ctx.lineTo(13, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SOOT_L;
  for (const [x, y] of [[-6, 0], [2, -2], [8, 2]]) ellipse(ctx, x, y, 3, 1.6);
}
function iconBellowsHide(ctx) {
  ctx.fillStyle = '#6a646c';
  ctx.strokeStyle = '#2e2a32';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, -9);
  ctx.lineTo(12, -9);
  ctx.lineTo(9, 10);
  ctx.lineTo(-9, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40,36,44,0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    ctx.moveTo(-11 + Math.abs(i), -5 + i * 3.5);
    ctx.lineTo(11 - Math.abs(i), -5 + i * 3.5);
  }
  ctx.stroke();
}
function iconCrucibleScale(ctx) {
  ctx.fillStyle = SLAG;
  ctx.strokeStyle = SLAG_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, 8);
  ctx.quadraticCurveTo(-12, -12, 2, -12);
  ctx.quadraticCurveTo(14, -10, 12, 8);
  ctx.quadraticCurveTo(0, 13, -12, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = EMBER; // where it broke
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-8, -2);
  ctx.lineTo(-1, -6);
  ctx.lineTo(4, 0);
  ctx.lineTo(9, -3);
  ctx.stroke();
  ctx.fillStyle = SLAG_L;
  circle(ctx, -4, 4, 2);
}
export const FOUNDRY_ICONS = { ant_iron: iconAntIron, slag_lump: iconSlagLump, newt_skin: iconNewtSkin, soot_pelt: iconSootPelt, bellows_hide: iconBellowsHide, crucible_scale: iconCrucibleScale };
