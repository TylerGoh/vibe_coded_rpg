// Docs: docs/places/tubes.md, docs/combat/stages.md
// The Drained Tubes' art that isn't the room itself (src/tubes.js): its creatures (clinker beetle, tube adder, lava
// drip, cinder moth, and Hundredfoot, the field boss; TUBES_MOB_ART, called by drawMob in src/field.js; the elites
// are drawn as their base mob), the gear dropped there (TUBES_SWORDS, TUBES_SWORD_LEN, TUBES_HELMETS, drawn by
// drawSword / drawHelmet in src/field.js; the staves and bows are data in src/staff-art.js and src/bow-art.js) and its
// materials' icons (TUBES_ICONS). Emberdeep's register: black glass, basalt, iron, slag, clinker; dark rock with a
// red glow only where something is still hot.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
const CLINK = '#3a3236', CLINK_D = '#1c181c', CLINK_L = '#5e5458';
const IRON = '#8a8490', IRON_D = '#4e4a56';
const GLASS = '#1e1a22';
const EMBER = '#ff7a3a', EMBER_L = '#ffc070';

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

// Clinker beetle: a squat beetle whose wing cases are a lump of rough clinker, black and blistered like furnace slag,
// worn forward over its head like a shield. Hit it from behind (the `shell` brain): its soft back glows a dull red
function drawClinkerBeetle(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, ram = !!m.charging && live;
  const step = m.walking || ram ? Math.sin(t * 12 + seed) * 2 : 0;
  const cy = -h * 0.46 + (warn ? 3 : 0);
  // legs
  ctx.strokeStyle = CLINK_D;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const x = -w * 0.2 + i * w * 0.18, lift = i % 2 ? step : -step;
    ctx.beginPath();
    ctx.moveTo(x, cy + h * 0.12);
    ctx.lineTo(x + 5, cy + h * 0.3 - lift);
    ctx.lineTo(x + 8, -1);
    ctx.stroke();
  }
  // the soft hind end, glowing in its seams
  ctx.fillStyle = '#4a2a26';
  ellipse(ctx, -w * 0.24, cy + 2, w * 0.18, h * 0.26);
  ctx.strokeStyle = `rgba(255,120,60,${0.55 + 0.2 * Math.sin(t * 3 + seed)})`;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(-w * 0.24 - i * 4, cy + 2, h * 0.14 + i * 3, -1.1, 1.1);
    ctx.stroke();
  }
  // the clinker shell, worn forward
  const shell = () => {
    ctx.moveTo(-w * 0.18, cy + h * 0.24);
    ctx.quadraticCurveTo(-w * 0.2, cy - h * 0.46, w * 0.18, cy - h * 0.4);
    ctx.quadraticCurveTo(w * 0.44, cy - h * 0.2, w * 0.42, cy + h * 0.3);
    ctx.closePath();
  };
  ctx.fillStyle = CLINK;
  ctx.strokeStyle = CLINK_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  shell();
  ctx.fill();
  ctx.stroke();
  // blisters and pits in the clinker
  ctx.fillStyle = CLINK_L;
  for (const [x, y, r] of [[0, -0.28, 4], [0.16, -0.2, 3.4], [0.3, 0, 3], [-0.06, -0.06, 3], [0.14, 0.08, 2.6]]) circle(ctx, w * x, cy + h * y, r);
  ctx.fillStyle = CLINK_D;
  for (const [x, y] of [[0.06, -0.16], [0.24, -0.1], [0.04, 0.12], [0.32, 0.16]]) circle(ctx, w * x, cy + h * y, 1.6);
  // horns poking out under the rim
  ctx.fillStyle = CLINK_D;
  ctx.beginPath();
  ctx.moveTo(w * 0.4, cy + h * 0.18);
  ctx.lineTo(w * 0.52, cy + h * (warn ? 0.06 : 0.12));
  ctx.lineTo(w * 0.42, cy + h * 0.28);
  ctx.closePath();
  ctx.fill();
  eyes(ctx, w * 0.36, cy + h * 0.2, 3, t, seed, { dying, size: 0.5, glow: EMBER });
  return () => {
    ctx.beginPath();
    shell();
    ctx.ellipse(-w * 0.24, cy + 2, w * 0.18, h * 0.26, 0, 0, TAU);
  };
}

// Tube adder: a long black snake with a glassy red sheen down its back, a blunt head, a flicking tongue. It slips
// into a crack in the tube wall (the `blink` brain) and comes out behind you; while gone it's a glint in a crack
function drawTubeAdder(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  if (gone) {
    ctx.strokeStyle = 'rgba(255,110,70,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, -2);
    ctx.lineTo(-w * 0.05, -h * 0.3);
    ctx.lineTo(w * 0.08, -h * 0.1);
    ctx.lineTo(w * 0.22, -h * 0.5);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const k = (t * 2 + i / 4) % 1;
      ctx.fillStyle = `rgba(80,70,80,${0.8 * (1 - k)})`;
      circle(ctx, -w * 0.1 + i * 8, -k * h * 0.8, 1.6);
    }
    return () => {
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.2, w * 0.24, h * 0.3, 0, 0, TAU);
    };
  }
  const live = dying < 0.05, warn = !!m.warn && live;
  const N = 9, crawl = m.walking ? t * 9 : t * 2;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1);
    pts.push([-w * 0.46 + k * w * 0.78, -h * 0.3 + Math.sin(crawl - i * 0.8) * h * 0.12 * (1 - k * 0.5)]);
  }
  const hx = w * 0.4, hy = -h * (warn ? 0.7 : 0.42);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const body = () => {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < N; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineTo(hx - 6, hy + 2);
  };
  ctx.strokeStyle = CLINK_D;
  ctx.lineWidth = h * 0.5;
  ctx.beginPath();
  body();
  ctx.stroke();
  ctx.strokeStyle = '#2a2228';
  ctx.lineWidth = h * 0.38;
  ctx.beginPath();
  body();
  ctx.stroke();
  // the glassy red sheen down the back
  ctx.strokeStyle = `rgba(255,96,70,${0.45 + 0.15 * Math.sin(t * 2 + seed)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pts[1][0], pts[1][1] - h * 0.12);
  for (let i = 2; i < N; i++) ctx.lineTo(pts[i][0], pts[i][1] - h * 0.12);
  ctx.stroke();
  // the head
  ctx.fillStyle = '#2a2228';
  ctx.strokeStyle = CLINK_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(hx, hy, w * 0.1, h * 0.3, 0.15, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (live && ((t + seed) % 1.6) < 0.4) {
    ctx.strokeStyle = '#d04a4a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(hx + w * 0.09, hy + 2);
    ctx.lineTo(hx + w * 0.16, hy);
    ctx.moveTo(hx + w * 0.16, hy);
    ctx.lineTo(hx + w * 0.19, hy - 2);
    ctx.moveTo(hx + w * 0.16, hy);
    ctx.lineTo(hx + w * 0.19, hy + 3);
    ctx.stroke();
  }
  eyes(ctx, hx + 2, hy - 3, 3, t, seed, { dying, size: 0.45, glow: EMBER });
  return () => {
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.3, w * 0.48, h * 0.3, 0, 0, TAU);
    ctx.ellipse(hx, hy, w * 0.1, h * 0.3, 0, 0, TAU);
  };
}

// Lava drip: a drop of lava fell from the roof long ago and set where it landed, a squat cone of black glass with a
// molten heart that never cooled; a thread still drips onto it from above. Rooted (it can't move); it swells and
// spits a gobbet of lava (the `lob` brain)
function drawLavaDrip(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const swell = warn ? 1.08 + 0.04 * Math.sin(t * 30) : 1;
  const cone = () => {
    ctx.moveTo(-w * 0.5, 0);
    ctx.quadraticCurveTo(-w * 0.44 * swell, -h * 0.5, -w * 0.08, -h * 0.86);
    ctx.quadraticCurveTo(0, -h * 0.96, w * 0.08, -h * 0.86);
    ctx.quadraticCurveTo(w * 0.44 * swell, -h * 0.5, w * 0.5, 0);
    ctx.closePath();
  };
  ctx.fillStyle = GLASS;
  ctx.strokeStyle = '#0e0c12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  cone();
  ctx.fill();
  ctx.stroke();
  // the molten heart, seen through cracks
  if (live) ember(ctx, 0, -h * 0.4, w * (warn ? 0.6 : 0.42), warn ? 0.8 : 0.5 + 0.1 * Math.sin(t * 2 + seed));
  ctx.strokeStyle = warn ? EMBER_L : EMBER;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, -h * 0.1);
  ctx.lineTo(-w * 0.08, -h * 0.34);
  ctx.lineTo(-w * 0.14, -h * 0.5);
  ctx.moveTo(w * 0.18, -h * 0.16);
  ctx.lineTo(w * 0.06, -h * 0.4);
  ctx.lineTo(w * 0.1, -h * 0.62);
  ctx.stroke();
  // a gloss of glass down one side
  ctx.strokeStyle = 'rgba(200,210,230,0.35)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, -h * 0.2);
  ctx.quadraticCurveTo(-w * 0.26, -h * 0.56, -w * 0.06, -h * 0.8);
  ctx.stroke();
  // the thread still dripping onto it from above, a bead running down
  if (live) {
    const k = (t * 0.7 + seed * 0.3) % 1;
    ctx.fillStyle = EMBER;
    circle(ctx, 0, -h * 0.96 - 40 + k * 40, 2.2);
    ctx.strokeStyle = 'rgba(255,140,70,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.96 - 60);
    ctx.lineTo(0, -h * 0.96);
    ctx.stroke();
  }
  eyes(ctx, 0, -h * 0.56, 4, t, seed, { dying, size: 0.6, glow: EMBER_L });
  return () => {
    ctx.beginPath();
    cone();
  };
}

// Cinder moth: a big soft moth the grey of cold ash, its wings edged in a dull glow like paper burning at the rim,
// trailing sparks. It fades into the dark and pulses out of it (the `phase` brain)
function drawCinderMoth(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  const cy = -h * 0.5 + Math.sin(t * 2.2 + seed) * 3;
  const flap = Math.sin(t * 9 + seed);
  ctx.save();
  if (gone) ctx.globalAlpha *= 0.18 + 0.08 * Math.sin(t * 20);
  const wing = (s) => {
    ctx.moveTo(0, cy);
    ctx.quadraticCurveTo(-w * 0.1, cy - h * (0.5 + flap * 0.2) * s, -w * 0.46, cy - h * (0.44 + flap * 0.16) * s);
    ctx.quadraticCurveTo(-w * 0.3, cy - h * 0.06 * s, 0, cy);
    ctx.moveTo(0, cy);
    ctx.quadraticCurveTo(w * 0.1, cy - h * (0.5 + flap * 0.2) * s, w * 0.4, cy - h * (0.4 + flap * 0.16) * s);
    ctx.quadraticCurveTo(w * 0.26, cy - h * 0.06 * s, 0, cy);
  };
  ctx.fillStyle = '#8a8288';
  ctx.strokeStyle = 'rgba(255,120,60,0.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  wing(1);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6a6268';
  ctx.beginPath();
  wing(-0.6);
  ctx.fill();
  ctx.stroke();
  // the eyespots, two dull embers
  ctx.fillStyle = 'rgba(255,140,70,0.7)';
  circle(ctx, -w * 0.22, cy - h * 0.28, 3);
  circle(ctx, w * 0.2, cy - h * 0.26, 3);
  // the furry body
  ctx.fillStyle = '#5a5258';
  ellipse(ctx, 0, cy, w * 0.14, h * 0.14);
  ctx.strokeStyle = '#8a8288';
  ctx.lineWidth = 1;
  ctx.beginPath(); // feathery feelers
  ctx.moveTo(w * 0.1, cy - 4);
  ctx.quadraticCurveTo(w * 0.2, cy - h * 0.3, w * 0.28, cy - h * 0.26);
  ctx.stroke();
  eyes(ctx, w * 0.08, cy - 1, 2.6, t, seed, { dying, size: 0.45 });
  // sparks trailing off
  if (dying < 0.05) {
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.8 + i / 3 + seed * 0.2) % 1;
      ctx.fillStyle = `rgba(255,160,80,${0.8 * (1 - k)})`;
      circle(ctx, -w * 0.2 - k * 20 + Math.sin(k * 9 + i) * 4, cy + k * 26, 1.4);
    }
  }
  ctx.restore();
  return () => {
    ctx.beginPath();
    ctx.ellipse(0, cy - h * 0.2, w * 0.46, h * 0.4, 0, 0, TAU);
  };
}

// Hundredfoot (field boss): a tube centipede as long as a cart, plated in clinker segments, its many legs glowing
// red at the joints, two long feelers sweeping ahead. It runs the Deep Tube end to end and the floor burns behind it
// (the `trail` brain, burning lava). Rears its front segments up when hit
function drawHundredfoot(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, run = !!m.walking && live;
  const N = 12, ph = run ? t * 14 : t * 3;
  const segW = w / (N + 1);
  const segs = [];
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1); // 0 the tail, 1 the head
    const rear = k > 0.75 ? (k - 0.75) * 4 * (m.hurt ? 0.5 : 0.18) : 0;
    segs.push({ x: -w * 0.46 + i * segW * 1.02, y: -h * 0.36 - Math.sin(ph * 0.3 - i * 0.7) * 2 - rear * h, r: h * (0.26 + 0.06 * Math.sin(k * Math.PI)) });
  }
  // legs, a pair per segment, scuttling in waves, red at the knees
  ctx.lineCap = 'round';
  for (let i = 0; i < N - 1; i++) {
    const s = segs[i], lift = Math.sin(ph - i * 0.9) * 4;
    for (const side of [-1, 1]) {
      const kx = s.x + side * 3 + lift * side * 0.4, ky = s.y + s.r + 4;
      ctx.strokeStyle = CLINK_D;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.r * 0.4);
      ctx.lineTo(kx, ky);
      ctx.lineTo(kx + side * 4 + lift, -1);
      ctx.stroke();
      ctx.fillStyle = live ? EMBER : '#5a3a30';
      circle(ctx, kx, ky, 1.8);
    }
  }
  // the segments, tail first
  ctx.strokeStyle = CLINK_D;
  ctx.lineWidth = 2;
  for (let i = 0; i < N; i++) {
    const s = segs[i];
    ctx.fillStyle = i === N - 1 ? '#2e282c' : i % 2 ? CLINK : '#423a3e';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, segW * 0.62, s.r, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // the glowing seam between plates
    if (i && live) {
      ctx.strokeStyle = `rgba(255,120,60,${0.5 + 0.25 * Math.sin(t * 3 - i)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(s.x - segW * 0.5, s.y, s.r * 0.8, -1.2, 1.2);
      ctx.stroke();
      ctx.strokeStyle = CLINK_D;
      ctx.lineWidth = 2;
    }
    ctx.fillStyle = CLINK_L; // a blister on each plate
    circle(ctx, s.x - 2, s.y - s.r * 0.5, 2.4);
  }
  const hd = segs[N - 1];
  // the poison claws under the head
  ctx.strokeStyle = '#6a2a24';
  ctx.lineWidth = 3;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(hd.x + segW * 0.3, hd.y + hd.r * 0.5);
    ctx.quadraticCurveTo(hd.x + segW * 0.9, hd.y + hd.r * (0.6 + s * 0.2), hd.x + segW * 0.7, hd.y + hd.r * 1.1);
    ctx.stroke();
  }
  // long feelers sweeping ahead
  ctx.strokeStyle = CLINK_L;
  ctx.lineWidth = 1.6;
  for (const s of [0, 1]) {
    ctx.beginPath();
    ctx.moveTo(hd.x + segW * 0.4, hd.y - hd.r * 0.5);
    ctx.quadraticCurveTo(hd.x + segW * 1.6, hd.y - h * (0.8 + s * 0.2), hd.x + segW * (2.4 + s * 0.4), hd.y - h * 0.3 + Math.sin(t * 3 + s * 2 + seed) * 6);
    ctx.stroke();
  }
  eyes(ctx, hd.x + segW * 0.2, hd.y - hd.r * 0.15, 4, t, seed, { dying, size: 0.8, glow: EMBER });
  // heat shimmer off its back
  if (live) {
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.5 + i / 4 + seed * 0.1) % 1, s = segs[2 + i * 2];
      ctx.fillStyle = `rgba(255,170,110,${0.25 * Math.sin(k * Math.PI)})`;
      circle(ctx, s.x, s.y - s.r - k * 24, 3 + k * 4);
    }
  }
  return () => {
    ctx.beginPath();
    for (const s of segs) {
      ctx.moveTo(s.x + segW * 0.62, s.y);
      ctx.ellipse(s.x, s.y, segW * 0.62, s.r, 0, 0, TAU);
    }
  };
}

export const TUBES_MOB_ART = { clinker_beetle: drawClinkerBeetle, tube_adder: drawTubeAdder, lava_drip: drawLavaDrip, cinder_moth: drawCinderMoth, hundredfoot: drawHundredfoot };

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
// Adderglass: a thin blade of black glass with a red sheen down it like an adder's back
function drawAdderglass(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,110,80,0.8)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = GLASS;
  ctx.beginPath();
  ctx.moveTo(-3, -5);
  ctx.quadraticCurveTo(-5, -L * 0.5, -1, -L);
  ctx.quadraticCurveTo(5, -L * 0.5, 3, -5);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,96,70,0.8)'; // the sheen, in a wavy line like the snake's back
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  for (let k = 0.1; k <= 0.9; k += 0.1) ctx.lineTo(Math.sin(k * 18) * 1.4, -L * k);
  ctx.stroke();
  ironGrip(ctx);
  ctx.restore();
}
// Hundredfoot Saw: a long iron blade toothed along one edge with Hundredfoot's legs, glowing at the joints
function drawHundredSaw(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,140,70,0.85)';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.moveTo(-4, -5);
  ctx.lineTo(-4, -L * 0.92);
  ctx.lineTo(0, -L);
  ctx.lineTo(4, -L * 0.9);
  ctx.lineTo(4, -5);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  // the leg-teeth on the edge, red at each joint
  for (let k = 0.14; k < 0.88; k += 0.09) {
    ctx.fillStyle = CLINK;
    ctx.beginPath();
    ctx.moveTo(4, -L * k);
    ctx.lineTo(9, -L * k - 3);
    ctx.lineTo(4, -L * k - 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = EMBER;
    circle(ctx, 4.5, -L * k - 2, 1.2);
  }
  ctx.fillStyle = IRON; // a bright fuller
  ctx.fillRect(-1.5, -L * 0.86, 2, L * 0.78);
  ironGrip(ctx);
  ctx.restore();
}
export const TUBES_SWORDS = { adderglass: drawAdderglass, hundred_saw: drawHundredSaw };
export const TUBES_SWORD_LEN = { adderglass: 60, hundred_saw: 66 };

// ——— helmets: (ctx, w, h), the slime's size; drawn over its top ———
// Clinker Helm: an iron cap shingled with clinker beetle scutes, rough and blistered
function drawClinkerHelm(ctx, w, h) {
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
  // the scutes, overlapping rows
  ctx.fillStyle = CLINK;
  ctx.strokeStyle = CLINK_D;
  ctx.lineWidth = 1.2;
  for (const [x, y, r] of [[-0.5, 0.06, 0.24], [-0.16, 0.08, 0.26], [0.2, 0.08, 0.26], [0.52, 0.06, 0.22], [-0.3, 0.22, 0.24], [0.06, 0.26, 0.26], [0.36, 0.22, 0.22], [-0.08, 0.38, 0.22]]) {
    ctx.beginPath();
    ctx.ellipse(rx * x, by - h * y, rx * r, h * r * 0.5, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = CLINK_L;
  for (const [x, y] of [[-0.3, 0.3], [0.1, 0.34], [0.4, 0.26], [-0.5, 0.12]]) circle(ctx, rx * x, by - h * y, 1.6);
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by + 1, rx * 2.04, 6, 3);
  ctx.fill();
  ctx.stroke();
}
// Hundredfoot Helm: a long iron helm plated in clinker segments down the back, two short feelers at the brow
function drawHundredHelm(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.54;
  ctx.fillStyle = IRON_D;
  ctx.strokeStyle = '#2e2a34';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 1.1, by + 6);
  ctx.bezierCurveTo(-rx * 1.1, by - h * 0.5, rx, by - h * 0.62, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the segments, front to back, red at the seams
  for (let i = 0; i < 5; i++) {
    const x = rx * (0.5 - i * 0.32), y = by - h * (0.38 - i * 0.04);
    ctx.fillStyle = i % 2 ? CLINK : '#423a3e';
    ctx.strokeStyle = CLINK_D;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y, rx * 0.2, h * 0.12, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = EMBER;
    circle(ctx, x - rx * 0.18, y + 1, 1.3);
  }
  // the feelers
  ctx.strokeStyle = CLINK_L;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (const s of [0, 1]) {
    ctx.beginPath();
    ctx.moveTo(rx * 0.6, by - h * 0.3);
    ctx.quadraticCurveTo(rx * (1 + s * 0.2), by - h * (0.8 + s * 0.1), rx * (1.3 + s * 0.2), by - h * (0.6 + s * 0.15));
    ctx.stroke();
  }
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.1, by + 1, rx * 2.1, 6, 3);
  ctx.fill();
  ctx.stroke();
}
export const TUBES_HELMETS = { clinker_helm: drawClinkerHelm, hundred_helm: drawHundredHelm };

// ——— material icons: (ctx), centred, about 30 px ———
function iconClinkerScute(ctx) {
  ctx.fillStyle = CLINK;
  ctx.strokeStyle = CLINK_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, 8);
  ctx.quadraticCurveTo(-12, -12, 2, -12);
  ctx.quadraticCurveTo(14, -10, 12, 8);
  ctx.quadraticCurveTo(0, 13, -12, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CLINK_L;
  for (const [x, y, r] of [[-5, -4, 2.6], [3, -6, 2], [6, 2, 2.4], [-2, 4, 1.8]]) circle(ctx, x, y, r);
}
function iconAdderScale(ctx) {
  ctx.fillStyle = '#2a2228';
  ctx.strokeStyle = '#0e0c12';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.quadraticCurveTo(10, -2, 0, 13);
  ctx.quadraticCurveTo(-10, -2, 0, -13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,96,70,0.85)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(0, 9);
  ctx.stroke();
}
function iconDripGlass(ctx) {
  ember(ctx, 0, 4, 12, 0.35);
  ctx.fillStyle = GLASS;
  ctx.strokeStyle = '#0e0c12';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.quadraticCurveTo(10, 4, 0, 12);
  ctx.quadraticCurveTo(-10, 4, 0, -13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = EMBER;
  circle(ctx, 1, 4, 2.2);
  ctx.strokeStyle = 'rgba(200,210,230,0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3, -4);
  ctx.quadraticCurveTo(-5, 2, -3, 7);
  ctx.stroke();
}
function iconCinderDust(ctx) {
  ctx.fillStyle = '#8a8288';
  ellipse(ctx, 0, 6, 12, 5);
  ctx.fillStyle = '#6a6268';
  ellipse(ctx, 0, 4, 8, 3);
  for (const [x, y, a] of [[-4, -4, 0.9], [3, -8, 0.7], [6, -2, 0.8], [-1, -11, 0.5]]) {
    ctx.fillStyle = `rgba(255,150,80,${a})`;
    circle(ctx, x, y, 1.6);
  }
}
function iconHundredPlate(ctx) {
  ctx.fillStyle = '#423a3e';
  ctx.strokeStyle = CLINK_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, -2, 13, 9, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = EMBER;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -2, 6, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.strokeStyle = CLINK_D; // the leg still hinged on
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(4, -1);
  ctx.lineTo(8, 7);
  ctx.lineTo(12, 12);
  ctx.stroke();
  ctx.fillStyle = EMBER;
  circle(ctx, 8, 7, 1.6);
}
export const TUBES_ICONS = { clinker_scute: iconClinkerScute, adder_scale: iconAdderScale, drip_glass: iconDripGlass, cinder_dust: iconCinderDust, hundred_plate: iconHundredPlate };
