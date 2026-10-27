// Docs: docs/places/ashwood.md, docs/combat/stages.md
// The Ashwood's art that isn't the room itself (src/ashwood.js): its creatures (ash moth, char boar, ember fox,
// ironbark beetle, smoke wisp and Greyback, the field boss; ASH_MOB_ART, called by drawMob in src/field.js), the
// gear dropped or sold there (ASH_SWORDS, ASH_SWORD_LEN, ASH_HELMETS, drawn by drawSword / drawHelmet in
// src/field.js; the staves and bows are data in src/staff-art.js and src/bow-art.js), its materials' icons
// (ASH_ICONS) and Collier Pitch's dress (drawCollierDress, src/slime.js). Emberdeep's register: charcoal, iron,
// ember, slag; ash-grey and soot, a red glow in the cracks, and the first green of the ferns.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
const CHAR = '#2e282c', CHAR_D = '#1a1618', CHAR_L = '#4a4248';
const ASH = '#9a9298', ASH_D = '#6a6268', ASH_L = '#c4bcc0';
const IRON = '#8a8490', IRON_D = '#4e4a56';
const EMBER = '#ff7a3a', EMBER_L = '#ffc070';

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, glow = null } = {}) {
  ctx.strokeStyle = INKC;
  ctx.fillStyle = glow ?? INKC;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.6) < 0.12;
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
// a few sparks going up off something smouldering
function sparks(ctx, x, y, spread, t, seed, n = 3, a = 0.8) {
  for (let i = 0; i < n; i++) {
    const k = (t * 0.7 + i / n + seed * 0.13) % 1;
    ctx.fillStyle = `rgba(255,${150 + i * 30},90,${a * Math.sin(k * Math.PI)})`;
    circle(ctx, x + Math.sin(k * 7 + i * 2 + seed) * spread, y - k * 34, 1.3);
  }
}

// Ash moth: a soft grey moth the size of a cat, dusted with ash, two eye-spots on its wings that show when it
// opens them. It flutters low over the ferns (harmless).
function drawAshMoth(ctx, w, h, t, seed, m, dying) {
  const flap = dying > 0.05 ? 0.2 : 0.5 + 0.5 * Math.sin(t * 11 + seed);
  const cy = -h * 0.5 + Math.sin(t * 2.4 + seed) * 2;
  const wing = (s, back) => {
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.quadraticCurveTo(s * w * (back ? 0.3 : 0.2), cy - h * (0.2 + 0.4 * flap), s * w * (back ? 0.5 : 0.36), cy - h * (0.05 + 0.3 * flap));
    ctx.quadraticCurveTo(s * w * 0.42, cy + h * 0.2, 0, cy + h * 0.06);
    ctx.closePath();
  };
  for (const s of [-1, 1]) {
    ctx.fillStyle = s < 0 ? ASH_D : ASH;
    ctx.strokeStyle = ASH_D;
    ctx.lineWidth = 1.2;
    wing(s, s < 0);
    ctx.fill();
    ctx.stroke();
    if (flap > 0.35) { // the eye-spot
      ctx.fillStyle = '#4a4248';
      circle(ctx, s * w * 0.24, cy - h * 0.12 * flap - 2, 3.4);
      ctx.fillStyle = '#e8d8b8';
      circle(ctx, s * w * 0.24, cy - h * 0.12 * flap - 2, 1.6);
    }
  }
  // the body: fat and furry
  const body = () => ctx.ellipse(w * 0.04, cy + h * 0.04, w * 0.14, h * 0.24, 0.35, 0, TAU);
  ctx.fillStyle = ASH_L;
  ctx.strokeStyle = ASH_D;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = ASH_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    ctx.moveTo(-w * 0.02 + i * 3, cy + h * 0.12 - i * 5);
    ctx.lineTo(w * 0.1 + i * 3, cy + h * 0.16 - i * 5);
  }
  ctx.stroke();
  // feathery antennae
  ctx.strokeStyle = ASH_D;
  ctx.lineWidth = 1.2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.12, cy - h * 0.16);
    ctx.quadraticCurveTo(w * 0.2 + s * 3, cy - h * 0.4, w * 0.28 + s * 5, cy - h * 0.44);
    ctx.stroke();
  }
  eyes(ctx, w * 0.14, cy - h * 0.08, 3.5, t, seed, { dying, size: 0.6 });
  // ash shaken off it
  ctx.fillStyle = 'rgba(196,188,192,0.6)';
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.5 + i / 3 + seed) % 1;
    circle(ctx, Math.sin(i * 3 + seed) * w * 0.3, cy + k * h * 0.8, 1);
  }
  return () => {
    ctx.beginPath();
    body();
    wing(1, false);
  };
}

// Char boar: a bristly black boar, its back scorched bald in patches, little tusks, embers in the ash it roots
// through. It charges anything on sight.
function drawCharBoar(ctx, w, h, t, seed, m, dying) {
  const run = m.walking ? Math.sin(t * 14 + seed) : 0;
  const cy = -h * 0.55 + Math.abs(run) * 1.5;
  // legs
  ctx.fillStyle = CHAR_D;
  for (const [x, ph] of [[-0.28, 0], [-0.14, 1], [0.18, 1], [0.3, 0]]) {
    const sw = (ph ? run : -run) * 4;
    ctx.beginPath();
    ctx.roundRect(w * x - 4 + sw, cy + h * 0.12, 8, h * 0.4, 3);
    ctx.fill();
  }
  const body = () => ctx.ellipse(-w * 0.04, cy, w * 0.4, h * 0.34, 0, 0, TAU);
  ctx.fillStyle = CHAR;
  ctx.strokeStyle = CHAR_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // the bristle ridge, and scorched bald patches glowing faintly
  ctx.strokeStyle = CHAR_L;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const x = -w * 0.36 + i * w * 0.07;
    ctx.moveTo(x, cy - h * 0.28);
    ctx.lineTo(x - 3, cy - h * 0.42 - (i % 2) * 3);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,80,50,0.55)';
  ellipse(ctx, -w * 0.14, cy - h * 0.08, w * 0.08, h * 0.08, 0.3);
  ellipse(ctx, w * 0.06, cy + h * 0.06, w * 0.06, h * 0.06);
  // the head and snout
  ctx.fillStyle = CHAR;
  ctx.strokeStyle = CHAR_D;
  ctx.beginPath();
  ctx.ellipse(w * 0.34, cy + h * 0.02, w * 0.16, h * 0.22, 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5a4448';
  ctx.beginPath();
  ctx.roundRect(w * 0.44, cy + h * 0.02, w * 0.1, h * 0.18, 4);
  ctx.fill();
  ctx.fillStyle = CHAR_D;
  circle(ctx, w * 0.5, cy + h * 0.09, 1.4);
  circle(ctx, w * 0.5, cy + h * 0.15, 1.4);
  // tusks
  ctx.fillStyle = '#e8dcc4';
  ctx.beginPath();
  ctx.moveTo(w * 0.44, cy + h * 0.2);
  ctx.quadraticCurveTo(w * 0.5, cy + h * 0.08, w * 0.48, cy - h * 0.02);
  ctx.lineTo(w * 0.46, cy + h * 0.18);
  ctx.closePath();
  ctx.fill();
  // an ear
  ctx.fillStyle = CHAR_L;
  ctx.beginPath();
  ctx.moveTo(w * 0.28, cy - h * 0.14);
  ctx.lineTo(w * 0.22, cy - h * 0.38);
  ctx.lineTo(w * 0.34, cy - h * 0.2);
  ctx.closePath();
  ctx.fill();
  eyes(ctx, w * 0.36, cy - h * 0.06, 0.1, t, seed, { dying, size: 0.7, glow: '#ff9a5a' });
  // the curly tail
  ctx.strokeStyle = CHAR_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, cy - h * 0.06);
  ctx.quadraticCurveTo(-w * 0.52, cy - h * 0.2, -w * 0.46, cy - h * 0.24);
  ctx.stroke();
  if (dying < 0.05) sparks(ctx, -w * 0.1, cy - h * 0.3, 8, t, seed, 2, 0.6);
  return () => {
    ctx.beginPath();
    body();
    ctx.ellipse(w * 0.34, cy + h * 0.02, w * 0.16, h * 0.22, 0.2, 0, TAU);
  };
}

// Ember fox: a lean grey fox with ash-pale fur and a brush that glows red at the tip like a coal. It drops into the
// ash (m.special: only a trail of sparks skittering along) and comes up behind you. m.warn: hackles up, about to.
function drawEmberFox(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, gone = !!m.special && live, warn = !!m.warn && live;
  if (gone) {
    ctx.fillStyle = 'rgba(160,150,156,0.7)';
    for (let i = 0; i < 6; i++) {
      const a = t * 8 + i * 1.1;
      circle(ctx, Math.cos(a) * w * 0.3, -6 - Math.abs(Math.sin(a)) * 10, 3 + (i % 2));
    }
    sparks(ctx, 0, -6, 12, t * 2, seed, 4, 0.9);
    return () => {
      ctx.beginPath();
      ctx.ellipse(0, -8, w * 0.4, 10, 0, 0, TAU);
    };
  }
  const run = m.walking ? Math.sin(t * 13 + seed) : 0;
  const cy = -h * 0.55;
  // legs
  ctx.strokeStyle = ASH_D;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const [x, ph] of [[-0.24, 0], [-0.12, 1], [0.18, 1], [0.28, 0]]) {
    ctx.beginPath();
    ctx.moveTo(w * x, cy + h * 0.1);
    ctx.lineTo(w * x + (ph ? run : -run) * 4, -1);
    ctx.stroke();
  }
  // the brush, its tip a glowing coal
  const tw = Math.sin(t * 3 + seed) * 0.15 + (warn ? -0.4 : 0);
  ctx.save();
  ctx.translate(-w * 0.34, cy - h * 0.04);
  ctx.rotate(-0.5 + tw);
  ctx.fillStyle = ASH;
  ctx.strokeStyle = ASH_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(-w * 0.22, 0, w * 0.24, h * 0.14, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  const g = ctx.createRadialGradient(-w * 0.42, 0, 1, -w * 0.42, 0, 12);
  g.addColorStop(0, 'rgba(255,190,110,0.9)');
  g.addColorStop(1, 'rgba(255,90,40,0)');
  ctx.fillStyle = g;
  circle(ctx, -w * 0.42, 0, 12);
  ctx.fillStyle = EMBER;
  ellipse(ctx, -w * 0.42, 0, w * 0.06, h * 0.1);
  ctx.restore();
  const body = () => ctx.ellipse(-w * 0.02, cy, w * 0.32, h * 0.24, 0, 0, TAU);
  ctx.fillStyle = ASH;
  ctx.strokeStyle = ASH_D;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ASH_L; // pale belly
  ellipse(ctx, 0, cy + h * 0.1, w * 0.2, h * 0.1);
  if (warn) { // hackles up
    ctx.strokeStyle = ASH_D;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = -w * 0.18 + i * w * 0.06;
      ctx.moveTo(x, cy - h * 0.2);
      ctx.lineTo(x - 2, cy - h * 0.36);
    }
    ctx.stroke();
  }
  // the head: pointed snout, big ears
  ctx.fillStyle = ASH;
  ctx.strokeStyle = ASH_D;
  ctx.beginPath();
  ctx.moveTo(w * 0.2, cy - h * 0.22);
  ctx.quadraticCurveTo(w * 0.34, cy - h * 0.34, w * 0.42, cy - h * 0.12);
  ctx.lineTo(w * 0.56, cy - h * 0.02);
  ctx.quadraticCurveTo(w * 0.4, cy + h * 0.16, w * 0.22, cy + h * 0.06);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CHAR;
  circle(ctx, w * 0.56, cy - h * 0.03, 2);
  for (const ex of [0.26, 0.36]) {
    ctx.fillStyle = ASH;
    ctx.beginPath();
    ctx.moveTo(w * ex - 4, cy - h * 0.24);
    ctx.lineTo(w * ex, cy - h * 0.58);
    ctx.lineTo(w * ex + 5, cy - h * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = CHAR_L;
    ctx.beginPath();
    ctx.moveTo(w * ex - 1.5, cy - h * 0.28);
    ctx.lineTo(w * ex, cy - h * 0.48);
    ctx.lineTo(w * ex + 2.5, cy - h * 0.28);
    ctx.closePath();
    ctx.fill();
  }
  eyes(ctx, w * 0.36, cy - h * 0.1, 0.1, t, seed, { dying, size: 0.65, glow: warn ? '#ff6a3a' : null });
  return () => {
    ctx.beginPath();
    body();
    ctx.ellipse(w * 0.36, cy - h * 0.06, w * 0.16, h * 0.16, 0, 0, TAU);
  };
}

// Ironbark beetle: a big black beetle whose wing-case is grained and cracked like burnt bark and hard as iron, a
// red glow deep in the cracks; it turns that front to you (the `shell` brain), lowers its horn (m.warn) and rams
// (m.charging).
function drawIronbarkBeetle(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, ram = !!m.charging && live;
  const step = m.walking || ram ? Math.sin(t * 12) * 2.5 : 0;
  const cy = -h * 0.5 + (warn ? 3 : 0);
  // six legs
  ctx.strokeStyle = CHAR_D;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const x = -w * 0.2 + i * w * 0.2, lift = (i % 2 ? step : -step);
    ctx.beginPath();
    ctx.moveTo(x, cy + h * 0.14);
    ctx.lineTo(x + w * 0.06, cy + h * 0.32 - lift);
    ctx.lineTo(x + w * 0.1, -1);
    ctx.stroke();
  }
  // the wing-case: a dome of burnt bark
  const shell = () => {
    ctx.moveTo(-w * 0.44, cy + h * 0.18);
    ctx.bezierCurveTo(-w * 0.46, cy - h * 0.5, w * 0.3, cy - h * 0.56, w * 0.36, cy + h * 0.16);
    ctx.closePath();
  };
  ctx.fillStyle = CHAR;
  ctx.strokeStyle = CHAR_D;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  shell();
  ctx.fill();
  ctx.stroke();
  // the bark grain and its glowing cracks
  ctx.save();
  ctx.beginPath();
  shell();
  ctx.clip();
  ctx.strokeStyle = CHAR_L;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const y = cy - h * 0.34 + i * h * 0.1;
    ctx.moveTo(-w * 0.46, y + Math.sin(i) * 2);
    ctx.quadraticCurveTo(0, y - 4 + Math.sin(i * 2) * 3, w * 0.4, y + 2);
  }
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,120,50,${0.5 + 0.3 * Math.sin(t * 2 + seed)})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, cy - h * 0.3);
  ctx.lineTo(-w * 0.12, cy - h * 0.1);
  ctx.lineTo(-w * 0.18, cy + h * 0.06);
  ctx.moveTo(w * 0.08, cy - h * 0.34);
  ctx.lineTo(w * 0.14, cy - h * 0.14);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = CHAR_D; // the seam down the middle
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.04, cy - h * 0.38);
  ctx.lineTo(-w * 0.06, cy + h * 0.16);
  ctx.stroke();
  // the head and its horn, lowered to ram
  ctx.save();
  ctx.translate(w * 0.36, cy + h * 0.06);
  ctx.rotate(warn || ram ? 0.35 : 0);
  ctx.fillStyle = IRON_D;
  ctx.strokeStyle = CHAR_D;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.1, h * 0.16, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CHAR;
  ctx.beginPath();
  ctx.moveTo(w * 0.04, -h * 0.08);
  ctx.quadraticCurveTo(w * 0.2, -h * 0.2, w * 0.2, -h * 0.46);
  ctx.quadraticCurveTo(w * 0.12, -h * 0.18, w * 0.06, h * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  eyes(ctx, w * 0.04, -h * 0.02, 0.1, t, seed, { dying, size: 0.55, glow: '#ff9a5a' });
  ctx.restore();
  return () => {
    ctx.beginPath();
    shell();
    ctx.ellipse(w * 0.36, cy + h * 0.06, w * 0.1, h * 0.16, 0, 0, TAU);
  };
}

// Smoke wisp: a curl of grey smoke with a coal for a heart and two dim eyes, trailing off into the ash rain. It
// fades into the smoke (m.special: nearly gone, can't be hurt) and pulses out of it.
function drawSmokeWisp(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  const cy = -h * 0.55, sway = Math.sin(t * 1.7 + seed) * 3;
  ctx.save();
  if (gone) ctx.globalAlpha *= 0.18 + 0.08 * Math.sin(t * 20);
  // the trailing tail of smoke
  for (let i = 0; i < 6; i++) {
    const k = i / 6;
    ctx.fillStyle = `rgba(110,102,108,${0.55 - k * 0.4})`;
    circle(ctx, -w * 0.2 * k + Math.sin(t * 2 + i + seed) * 4, cy + h * 0.2 + k * h * 0.35, w * (0.26 - k * 0.12));
  }
  const body = () => {
    ctx.moveTo(-w * 0.34 + sway, cy + h * 0.12);
    ctx.bezierCurveTo(-w * 0.44 + sway, cy - h * 0.42, w * 0.4 + sway, cy - h * 0.48, w * 0.32 + sway, cy + h * 0.1);
    ctx.quadraticCurveTo(0, cy + h * 0.26, -w * 0.34 + sway, cy + h * 0.12);
    ctx.closePath();
  };
  ctx.fillStyle = '#8a8288';
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.fillStyle = 'rgba(196,188,192,0.6)';
  ellipse(ctx, -w * 0.08 + sway, cy - h * 0.22, w * 0.16, h * 0.08, -0.3);
  // curls
  ctx.strokeStyle = 'rgba(70,62,68,0.6)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(-w * 0.1 + sway, cy - h * 0.02, 6, 0.4, 4);
  ctx.arc(w * 0.14 + sway, cy - h * 0.16, 5, 3, 6.2);
  ctx.stroke();
  // the coal at its heart
  const pul = 0.6 + 0.4 * Math.sin(t * 3 + seed);
  const g = ctx.createRadialGradient(sway, cy + h * 0.06, 1, sway, cy + h * 0.06, 14);
  g.addColorStop(0, `rgba(255,170,90,${0.8 * pul})`);
  g.addColorStop(1, 'rgba(255,90,40,0)');
  ctx.fillStyle = g;
  circle(ctx, sway, cy + h * 0.06, 14);
  ctx.fillStyle = EMBER;
  circle(ctx, sway, cy + h * 0.06, 3);
  eyes(ctx, w * 0.1 + sway, cy - h * 0.14, 5, t, seed, { dying, size: 0.7 });
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// Greyback: a field boss (small: no story), an old bear gone ash-grey, scorched bald in patches, a notched ear,
// soot to the elbows, embers caught in his ruff. He walks the Burnt Crown on all fours; to throw (m.warn) he rears
// up with a burning log over his head.
function drawGreyback(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const step = m.walking ? Math.sin(t * 6 + seed) * 3 : 0;
  const rear = warn ? 1 : 0;
  const cy = -h * 0.46 - rear * h * 0.08;
  const FUR = '#8a8288', FUR_D = '#5a5258', FUR_L = '#b4acb0';
  // back legs
  ctx.fillStyle = FUR_D;
  ctx.beginPath();
  ctx.roundRect(-w * 0.36 - step, -h * 0.34, w * 0.16, h * 0.34, 10);
  ctx.roundRect(-w * 0.16 + step, -h * 0.32, w * 0.15, h * 0.32, 10);
  ctx.fill();
  // the body (tilted up when he rears)
  ctx.save();
  ctx.translate(-w * 0.1, cy);
  ctx.rotate(-rear * 0.45);
  const body = () => ctx.ellipse(0, 0, w * 0.4, h * 0.34, 0, 0, TAU);
  ctx.fillStyle = FUR;
  ctx.strokeStyle = FUR_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(70,60,66,0.5)'; // scorched bald patches
  ellipse(ctx, -w * 0.14, -h * 0.1, w * 0.1, h * 0.08, 0.4);
  ellipse(ctx, w * 0.1, h * 0.08, w * 0.08, h * 0.06);
  ctx.strokeStyle = FUR_L; // shaggy fur strokes
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = -2.6 + i * 0.32;
    ctx.moveTo(Math.cos(a) * w * 0.32, Math.sin(a) * h * 0.26);
    ctx.lineTo(Math.cos(a) * w * 0.4, Math.sin(a) * h * 0.34 - 3);
  }
  ctx.stroke();
  ctx.restore();
  // front legs: on the ground, or raised holding the log
  ctx.fillStyle = FUR_D;
  if (!warn) {
    ctx.beginPath();
    ctx.roundRect(w * 0.12 + step, -h * 0.36, w * 0.15, h * 0.36, 10);
    ctx.roundRect(w * 0.26 - step, -h * 0.34, w * 0.14, h * 0.34, 10);
    ctx.fill();
    ctx.fillStyle = CHAR; // sooty paws
    ellipse(ctx, w * 0.2 + step, -3, w * 0.09, 5);
    ellipse(ctx, w * 0.33 - step, -3, w * 0.08, 5);
  }
  // the head
  const hx = w * 0.3, hy = cy - h * 0.2 - rear * h * 0.22;
  ctx.fillStyle = FUR;
  ctx.strokeStyle = FUR_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(hx, hy, w * 0.16, h * 0.17, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = FUR_L; // muzzle
  ctx.beginPath();
  ctx.ellipse(hx + w * 0.12, hy + h * 0.04, w * 0.08, h * 0.07, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = CHAR;
  ellipse(ctx, hx + w * 0.18, hy + h * 0.02, 4, 3);
  for (const [ex, notch] of [[-0.08, false], [0.06, true]]) { // ears, the right one notched
    ctx.fillStyle = FUR;
    ctx.beginPath();
    ctx.arc(hx + w * ex, hy - h * 0.14, w * 0.045, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (notch) { // a bite out of its rim
      ctx.strokeStyle = FUR_D;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx + w * ex + 1, hy - h * 0.19);
      ctx.lineTo(hx + w * ex + 3, hy - h * 0.15);
      ctx.lineTo(hx + w * ex + 6, hy - h * 0.18);
      ctx.stroke();
      ctx.strokeStyle = FUR_D;
      ctx.lineWidth = 2;
    }
  }
  eyes(ctx, hx + w * 0.04, hy - h * 0.02, w * 0.04, t, seed, { dying, size: 1.1 });
  // embers caught in his ruff
  if (live) sparks(ctx, hx - w * 0.1, hy + h * 0.1, 10, t, seed, 3, 0.7);
  // the burning log, held up over his head
  if (warn) {
    ctx.save();
    ctx.translate(hx - w * 0.06, hy - h * 0.3);
    ctx.rotate(-0.25);
    ctx.fillStyle = FUR_D; // forelegs up
    ctx.beginPath();
    ctx.roundRect(-w * 0.12, 0, w * 0.08, h * 0.3, 6);
    ctx.roundRect(w * 0.06, 0, w * 0.08, h * 0.3, 6);
    ctx.fill();
    ctx.fillStyle = '#3a3034';
    ctx.strokeStyle = CHAR_D;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-w * 0.3, -h * 0.07, w * 0.6, h * 0.12, h * 0.06);
    ctx.fill();
    ctx.stroke();
    const fl = Math.sin(t * 14) * 3;
    for (const e of [-1, 1]) {
      const g = ctx.createRadialGradient(e * w * 0.3, 0, 1, e * w * 0.3, 0, 22);
      g.addColorStop(0, 'rgba(255,210,120,0.95)');
      g.addColorStop(1, 'rgba(255,90,40,0)');
      ctx.fillStyle = g;
      circle(ctx, e * w * 0.3, -4, 22);
      ctx.fillStyle = EMBER;
      ellipse(ctx, e * w * 0.31, -8 + fl * 0.5, 6, 10 + fl);
      ctx.fillStyle = EMBER_L;
      ellipse(ctx, e * w * 0.31, -4, 3, 5);
    }
    ctx.restore();
  }
  return () => {
    ctx.beginPath();
    ctx.ellipse(-w * 0.1, cy, w * 0.4, h * 0.34, -rear * 0.45, 0, TAU);
    ctx.ellipse(hx, hy, w * 0.16, h * 0.17, 0, 0, TAU);
  };
}
export const ASH_MOB_ART = { ash_moth: drawAshMoth, char_boar: drawCharBoar, ember_fox: drawEmberFox, ironbark_beetle: drawIronbarkBeetle, smoke_wisp: drawSmokeWisp, greyback: drawGreyback };

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
function woodGrip(ctx, c = '#5a4038') {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3, 9);
  ctx.lineTo(3, 9);
  ctx.stroke();
}
// Collier's Axe: a long charred haft and a broad felling-axe head, black, its bit honed bright
function drawCollierAxe(ctx, L, glow) {
  ctx.save();
  ctx.fillStyle = '#4a3a34';
  ctx.fillRect(-2.5, -L * 0.96, 5, L * 0.96);
  if (glow) {
    ctx.shadowColor = 'rgba(255,150,90,0.8)';
    ctx.shadowBlur = 10;
  }
  const hy = -L * 0.82;
  ctx.fillStyle = CHAR;
  ctx.strokeStyle = CHAR_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-2, hy - 6);
  ctx.lineTo(10, hy - 12);
  ctx.quadraticCurveTo(18, hy, 10, hy + 14);
  ctx.lineTo(-2, hy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.strokeStyle = '#d8d4dc'; // the honed bit
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(11, hy - 11);
  ctx.quadraticCurveTo(18, hy, 11, hy + 13);
  ctx.stroke();
  ctx.fillStyle = CHAR_D; // the poll behind
  ctx.beginPath();
  ctx.roundRect(-7, hy - 4, 6, 8, 2);
  ctx.fill();
  woodGrip(ctx);
  ctx.restore();
}
// Emberfang: a narrow iron blade quenched red along its edge, an ember fox's brush at the pommel
function drawEmberfang(ctx, L, glow) {
  ctx.save();
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-3.5, -6);
    ctx.lineTo(-3, -L * 0.86);
    ctx.lineTo(1, -L);
    ctx.lineTo(3.5, -L * 0.86);
    ctx.lineTo(3.5, -6);
    ctx.closePath();
  };
  if (glow) {
    ctx.shadowColor = 'rgba(255,110,60,0.85)';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = IRON;
  blade();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  const g = ctx.createLinearGradient(0, -6, 0, -L);
  g.addColorStop(0, 'rgba(255,90,40,0.2)');
  g.addColorStop(1, 'rgba(255,140,60,0.9)');
  ctx.strokeStyle = g; // the red edge
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(3.2, -8);
  ctx.lineTo(3.2, -L * 0.86);
  ctx.lineTo(1, -L);
  ctx.stroke();
  ctx.fillStyle = CHAR;
  ctx.beginPath();
  ctx.roundRect(-8, -7, 16, 4, 2);
  ctx.fill();
  woodGrip(ctx, '#4a4248');
  ctx.fillStyle = ASH; // the brush at the pommel
  ellipse(ctx, -3, 15, 4, 6, 0.4);
  ctx.fillStyle = EMBER;
  circle(ctx, -5, 19, 2.2);
  ctx.restore();
}
// Greyback's Brand: a charred log club bound in iron bands, its head still smouldering
function drawGreybackBrand(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,160,90,0.85)';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = '#3a3034';
  ctx.strokeStyle = CHAR_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3, -4);
  ctx.lineTo(-7, -L * 0.9);
  ctx.quadraticCurveTo(0, -L * 1.04, 7, -L * 0.9);
  ctx.lineTo(3, -4);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,120,50,0.85)'; // glowing cracks in the char
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3, -L * 0.8);
  ctx.lineTo(1, -L * 0.7);
  ctx.lineTo(-2, -L * 0.6);
  ctx.moveTo(3, -L * 0.88);
  ctx.lineTo(4, -L * 0.76);
  ctx.stroke();
  ctx.fillStyle = IRON; // the bands
  for (const y of [-L * 0.3, -L * 0.52]) {
    ctx.beginPath();
    ctx.roundRect(-6.5 + (y / L) * -2.5, y - 2, 13 - (y / L) * -5, 4, 1.5);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,200,120,0.9)'; // the smouldering end
  ellipse(ctx, 0, -L * 0.95, 5, 2.5);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = `rgba(255,${160 + i * 30},90,${0.6 - i * 0.15})`;
    circle(ctx, Math.sin(i * 2.1) * 3, -L - 4 - i * 5, 1.4);
  }
  woodGrip(ctx, '#3a3034');
  ctx.restore();
}
export const ASH_SWORDS = { collier_axe: drawCollierAxe, emberfang: drawEmberfang, greyback_brand: drawGreybackBrand };
export const ASH_SWORD_LEN = { collier_axe: 56, emberfang: 60, greyback_brand: 66 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Collier's Hood: a sooty leather hood with an iron brim and a smoke-cloth hanging at the neck
function drawCollierHood(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.54;
  ctx.fillStyle = '#5a4840';
  ctx.strokeStyle = '#3a2c26';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 14);
  ctx.bezierCurveTo(-rx * 1.04, by - h * 0.52, rx * 1.04, by - h * 0.52, rx, by + 14);
  ctx.quadraticCurveTo(rx * 0.6, by + 4, 0, by + 4);
  ctx.quadraticCurveTo(-rx * 0.6, by + 4, -rx, by + 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(30,22,22,0.35)'; // soot
  ellipse(ctx, rx * 0.2, by - h * 0.24, rx * 0.4, 6, 0.2);
  ctx.fillStyle = IRON; // the iron brim
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-rx * 0.86, by - 2, rx * 1.72, 5, 2.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a7a70'; // the smoke-cloth, down the side
  ctx.beginPath();
  ctx.moveTo(-rx, by + 10);
  ctx.quadraticCurveTo(-rx * 1.16, by + h * 0.3, -rx * 0.86, by + h * 0.42);
  ctx.lineTo(-rx * 0.7, by + 12);
  ctx.closePath();
  ctx.fill();
}
// Ironbark Helm: an iron helm shingled with ironbark beetle shell, black and grained, a faint red in the cracks
function drawIronbarkHelm(ctx, w, h, t = 0) {
  const by = -h * 0.72, rx = w * 0.5;
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx, by - h * 0.44, rx, by - h * 0.44, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the shingles of shell
  ctx.fillStyle = CHAR;
  ctx.strokeStyle = CHAR_D;
  ctx.lineWidth = 1.2;
  for (const [x, y, s] of [[-rx * 0.5, by - h * 0.06, 1], [0, by - h * 0.16, 1.1], [rx * 0.5, by - h * 0.06, 1], [-rx * 0.24, by - h * 0.28, 0.9], [rx * 0.24, by - h * 0.28, 0.9]]) {
    ctx.beginPath();
    ctx.ellipse(x, y, 9 * s, 6 * s, 0, Math.PI, TAU);
    ctx.lineTo(x + 9 * s, y + 2);
    ctx.lineTo(x - 9 * s, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = `rgba(255,120,50,${0.5 + 0.3 * Math.sin(t * 2)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, by - h * 0.2);
  ctx.lineTo(1, by - h * 0.12);
  ctx.moveTo(rx * 0.46, by - h * 0.1);
  ctx.lineTo(rx * 0.52, by - h * 0.03);
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by + 2, rx * 2.04, 5, 2.5);
  ctx.fill();
}
// Greyback Helm: a heavy iron helm with a bear's brow and two round ears hammered into it, grey with soot
function drawGreybackHelm(ctx, w, h) {
  const by = -h * 0.72, rx = w * 0.54;
  ctx.fillStyle = '#7a7480';
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  for (const s of [-1, 1]) { // the ears
    ctx.beginPath();
    ctx.arc(s * rx * 0.62, by - h * 0.32, 7, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5a5460';
    circle(ctx, s * rx * 0.62, by - h * 0.32, 3.5);
    ctx.fillStyle = '#7a7480';
  }
  ctx.beginPath();
  ctx.moveTo(-rx, by + 8);
  ctx.bezierCurveTo(-rx, by - h * 0.48, rx, by - h * 0.48, rx, by + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(60,54,60,0.35)'; // soot
  ellipse(ctx, -rx * 0.3, by - h * 0.2, rx * 0.4, 7, -0.3);
  // the heavy brow ridge
  ctx.fillStyle = '#5a5460';
  ctx.beginPath();
  ctx.moveTo(-rx * 1.04, by + 4);
  ctx.quadraticCurveTo(-rx * 0.5, by - 8, 0, by - 2);
  ctx.quadraticCurveTo(rx * 0.5, by - 8, rx * 1.04, by + 4);
  ctx.lineTo(rx * 1.04, by + 9);
  ctx.lineTo(-rx * 1.04, by + 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c8c4cc';
  for (let i = -2; i <= 2; i++) circle(ctx, i * rx * 0.36, by + 5.5, 1.2);
  // a coal set over the brow
  ctx.fillStyle = EMBER;
  circle(ctx, 0, by - h * 0.12, 3);
  ctx.fillStyle = EMBER_L;
  circle(ctx, -0.8, by - h * 0.12 - 0.8, 1.2);
}
export const ASH_HELMETS = { collier_hood: drawCollierHood, ironbark_helm: drawIronbarkHelm, greyback_helm: drawGreybackHelm };

// ——— materials' icons (40 × 40, centred) ———
function iconMothWing(ctx) {
  ctx.fillStyle = ASH;
  ctx.strokeStyle = ASH_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, 12);
  ctx.quadraticCurveTo(-16, -12, 6, -15);
  ctx.quadraticCurveTo(16, -6, 10, 4);
  ctx.quadraticCurveTo(0, 14, -12, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4a4248';
  circle(ctx, 0, -3, 5);
  ctx.fillStyle = '#e8d8b8';
  circle(ctx, 0, -3, 2.4);
  ctx.fillStyle = 'rgba(220,214,218,0.7)';
  for (const [x, y] of [[-8, 4], [6, -10], [-4, 8]]) circle(ctx, x, y, 1);
}
function iconCharTusk(ctx) {
  ctx.fillStyle = '#e8dcc4';
  ctx.strokeStyle = '#8a7a68';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, 12);
  ctx.quadraticCurveTo(-8, -6, 10, -14);
  ctx.quadraticCurveTo(0, -2, -4, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CHAR; // the blackened root end
  ctx.beginPath();
  ctx.moveTo(-12, 12);
  ctx.quadraticCurveTo(-11, 6, -9, 2);
  ctx.lineTo(-3, 6);
  ctx.quadraticCurveTo(-4, 10, -4, 14);
  ctx.closePath();
  ctx.fill();
}
function iconEmberBrush(ctx) {
  ctx.fillStyle = ASH;
  ctx.strokeStyle = ASH_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(-3, 3, 14, 8, -0.6, 0, TAU);
  ctx.fill();
  ctx.stroke();
  const g = ctx.createRadialGradient(8, -8, 1, 8, -8, 12);
  g.addColorStop(0, 'rgba(255,200,120,0.95)');
  g.addColorStop(1, 'rgba(255,90,40,0)');
  ctx.fillStyle = g;
  circle(ctx, 8, -8, 12);
  ctx.fillStyle = EMBER;
  ellipse(ctx, 7, -7, 5, 4, -0.6);
}
function iconIronbarkChip(ctx) {
  ctx.fillStyle = CHAR;
  ctx.strokeStyle = CHAR_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-14, 6);
  ctx.lineTo(-6, -12);
  ctx.lineTo(12, -8);
  ctx.lineTo(14, 8);
  ctx.lineTo(-2, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = CHAR_L;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(-10 + i * 2, -6 + i * 5);
    ctx.quadraticCurveTo(0, -8 + i * 5, 12, -4 + i * 4);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,120,50,0.8)';
  ctx.beginPath();
  ctx.moveTo(2, -6);
  ctx.lineTo(4, 2);
  ctx.stroke();
}
function iconBottledSmoke(ctx) {
  ctx.fillStyle = 'rgba(200,214,224,0.4)';
  ctx.strokeStyle = '#6a7480';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-5, -12);
  ctx.lineTo(-5, -6);
  ctx.quadraticCurveTo(-13, -2, -12, 8);
  ctx.quadraticCurveTo(-11, 15, 0, 15);
  ctx.quadraticCurveTo(11, 15, 12, 8);
  ctx.quadraticCurveTo(13, -2, 5, -6);
  ctx.lineTo(5, -12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,102,108,0.75)';
  for (const [x, y, r] of [[-4, 6, 5], [4, 8, 4.5], [0, 2, 4], [-2, 11, 3.5]]) circle(ctx, x, y, r);
  ctx.fillStyle = '#8a6a50';
  ctx.beginPath();
  ctx.roundRect(-5, -16, 10, 5, 1.5);
  ctx.fill();
}
function iconGreybackClaw(ctx) {
  ctx.fillStyle = CHAR;
  ctx.strokeStyle = CHAR_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-10, 12);
  ctx.quadraticCurveTo(-12, -6, 10, -14);
  ctx.quadraticCurveTo(0, -4, -2, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = EMBER;
  circle(ctx, 9, -13, 2);
  ctx.strokeStyle = '#8a6a50'; // a splinter of bark caught in it
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, 4);
  ctx.lineTo(4, 0);
  ctx.stroke();
}
export const ASH_ICONS = { moth_wing: iconMothWing, char_tusk: iconCharTusk, ember_brush: iconEmberBrush, ironbark_chip: iconIronbarkChip, bottled_smoke: iconBottledSmoke, greyback_claw: iconGreybackClaw };

// ——— Collier Pitch's dress (src/slime.js, accessory 'collier'): a sooty leather hood pushed back, a smoke-cloth
// round his neck, his long clamp rake leaning on him, and his fat ledger tied with string under one arm ———
export function drawCollierDress(ctx, w, h, fx, t) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // the rake, leaning on his back side
  ctx.strokeStyle = '#4a3a34';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, -h * 0.02);
  ctx.lineTo(-w * 0.76, -h * 1.06);
  ctx.stroke();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.9, -h * 1.02);
  ctx.lineTo(-w * 0.62, -h * 1.1);
  for (let i = 0; i < 4; i++) {
    const x = -w * 0.88 + i * w * 0.08, y = -h * 1.03 - i * h * 0.02;
    ctx.moveTo(x, y);
    ctx.lineTo(x + 1, y + 6);
  }
  ctx.stroke();
  // the hood, pushed back off his head
  ctx.fillStyle = '#5a4840';
  ctx.strokeStyle = '#3a2c26';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.46, -h * 0.66);
  ctx.bezierCurveTo(-w * 0.6, -h * 1.06, w * 0.1, -h * 1.12, w * 0.12, -h * 0.84);
  ctx.quadraticCurveTo(-w * 0.16, -h * 0.9, -w * 0.46, -h * 0.66);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.roundRect(-w * 0.12, -h * 0.92, w * 0.26, 3.5, 1.5);
  ctx.fill();
  // the smoke-cloth round his neck
  ctx.fillStyle = '#8a7a70';
  ctx.strokeStyle = '#5a4c44';
  ctx.beginPath();
  ctx.moveTo(-w * 0.44, -h * 0.34);
  ctx.quadraticCurveTo(0, -h * 0.2, w * 0.44, -h * 0.34);
  ctx.lineTo(w * 0.4, -h * 0.24);
  ctx.quadraticCurveTo(0, -h * 0.1, -w * 0.4, -h * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath(); // its loose end, stirring
  ctx.moveTo(w * 0.3, -h * 0.26);
  ctx.quadraticCurveTo(w * 0.42, -h * 0.12 + Math.sin(t * 1.6) * 1.5, w * 0.36, -h * 0.02);
  ctx.lineTo(w * 0.26, -h * 0.1);
  ctx.closePath();
  ctx.fill();
  // grey brows, heavy and slow
  ctx.fillStyle = '#a8a2a6';
  ctx.beginPath();
  ctx.roundRect(fx - 12, -h * 0.42 - 11, 10, 3, 1.5);
  ctx.roundRect(fx + 3, -h * 0.42 - 11, 10, 3, 1.5);
  ctx.fill();
  // the ledger under his arm, tied with string
  ctx.fillStyle = '#6a4a3a';
  ctx.strokeStyle = '#3a2820';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(w * 0.3, -h * 0.3, w * 0.3, h * 0.22, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8dcc4';
  ctx.fillRect(w * 0.32, -h * 0.29, w * 0.26, 2.5);
  ctx.strokeStyle = '#c8b898';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.45, -h * 0.3);
  ctx.lineTo(w * 0.45, -h * 0.08);
  ctx.stroke();
  ctx.restore();
}
