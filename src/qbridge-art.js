// Docs: docs/places/queensbridge.md, docs/combat/stages.md
// The Queen's Bridge's art that isn't the room itself (src/qbridge.js): its creatures (rime puffin, sleet
// harrier, rimeguard, hoarfrost shade, leopard seal, rime archer; QBRIDGE_MOB_ART, called by drawMob in
// src/field.js; Sigrun is in src/dens-qbridge.js), the gear dropped there (QBRIDGE_SWORDS, QBRIDGE_SWORD_LEN,
// QBRIDGE_HELMETS, drawn by drawSword / drawHelmet in src/field.js; the staves are data in src/staff-art.js)
// and its materials' icons (QBRIDGE_ICONS).
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
const SILVER = '#d8dce8', SILVER_D = '#7a8098', ICE = '#b4d4f0', ICE_L = '#e2f0fc', ICE_LINE = '#3e6294';
const FOLK = '#dce8f4', FOLK_LINE = '#5a7aa0'; // the fjord folk's frosted jelly
function face(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, shut = false, cross = false } = {}) {
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
    } else if (blink || shut) {
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
  if (cross && dying <= 0.05) {
    // a stern brow
    ctx.beginPath();
    ctx.moveTo(fx - gap - 3 * size, fy - 5 * size);
    ctx.lineTo(fx - gap + 3 * size, fy - 3.5 * size);
    ctx.moveTo(fx + gap + 3 * size, fy - 5 * size);
    ctx.lineTo(fx + gap - 3 * size, fy - 3.5 * size);
    ctx.stroke();
  }
}
function halo(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
// a fjord-folk guard's round silver helm with the Queen's little crown on the brow
function guardHelm(ctx, cx, top, rx, ry) {
  ctx.fillStyle = SILVER;
  ctx.strokeStyle = SILVER_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - rx, top + ry);
  ctx.bezierCurveTo(cx - rx, top - ry * 0.4, cx + rx, top - ry * 0.4, cx + rx, top + ry);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(cx - 1.5, top - ry * 0.3 - 6, 3, 7);
  ctx.fillStyle = '#c9a64a';
  ctx.beginPath();
  ctx.moveTo(cx + rx * 0.3, top + ry * 0.6);
  ctx.lineTo(cx + rx * 0.3, top + ry * 0.1);
  ctx.lineTo(cx + rx * 0.45, top + ry * 0.35);
  ctx.lineTo(cx + rx * 0.6, top);
  ctx.lineTo(cx + rx * 0.75, top + ry * 0.35);
  ctx.lineTo(cx + rx * 0.9, top + ry * 0.1);
  ctx.lineTo(cx + rx * 0.9, top + ry * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(250,252,255,0.9)'; // rime
  ellipse(ctx, cx - rx * 0.2, top + ry * 0.05, rx * 0.5, 2);
}

// Rime puffin: a round little black-and-white seabird with a bright striped beak gone frosty at the tip, sitting
// along the rail. Harmless; it hops
function drawRimePuffin(ctx, w, h, t, seed, m, dying) {
  const cy = -h * 0.48, bob = m.walking ? 0 : Math.sin(t * 2 + seed) * 1;
  const body = () => {
    ctx.ellipse(0, cy + bob, w * 0.4, h * 0.44, 0, 0, TAU);
  };
  // feet
  ctx.fillStyle = '#f08a4a';
  ellipse(ctx, -w * 0.12, -2, w * 0.12, 3);
  ellipse(ctx, w * 0.12, -2, w * 0.12, 3);
  ctx.fillStyle = '#26283a';
  ctx.strokeStyle = '#141420';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // white belly and face
  ctx.fillStyle = '#f6f8fc';
  ellipse(ctx, w * 0.08, cy + h * 0.1 + bob, w * 0.26, h * 0.3);
  ellipse(ctx, w * 0.14, cy - h * 0.18 + bob, w * 0.2, h * 0.16);
  // wing
  ctx.fillStyle = '#1a1c2a';
  ellipse(ctx, -w * 0.14, cy + h * 0.02 + bob, w * 0.18, h * 0.26, 0.3 + (m.walking ? Math.sin(t * 14) * 0.3 : 0));
  // the beak: big, triangular, striped orange and grey, frosted at the tip
  const bx = w * 0.32, by = cy - h * 0.14 + bob;
  ctx.fillStyle = '#ff8a3a';
  ctx.strokeStyle = '#8a3a1a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(bx, by - h * 0.12);
  ctx.quadraticCurveTo(bx + w * 0.28, by - h * 0.02, bx + w * 0.22, by + h * 0.06);
  ctx.lineTo(bx, by + h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a8098';
  ctx.fillRect(bx + 1, by - h * 0.08, 3, h * 0.16);
  ctx.fillStyle = 'rgba(240,248,255,0.95)';
  ellipse(ctx, bx + w * 0.2, by + h * 0.02, 3, 2);
  face(ctx, w * 0.18, cy - h * 0.2 + bob, w * 0.001, t, seed, { dying, size: 0.7 });
  ctx.fillStyle = 'rgba(255,170,190,0.5)';
  ellipse(ctx, w * 0.2, cy - h * 0.08 + bob, 3, 2);
  return () => {
    ctx.beginPath();
    body();
  };
}

// Sleet harrier: a slim grey hawk, barred white underneath, sleet caught in its feathers. It stoops out of the
// strait's wind. m.warn: wings up, about to stoop · m.charging: diving
function drawSleetHarrier(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const cy = -h * 0.5;
  const flap = dive ? -0.9 : warn ? -1.2 : Math.sin(t * 9 + seed) * 0.7;
  ctx.save();
  if (dive) {
    ctx.translate(0, cy);
    ctx.rotate(0.5);
    ctx.translate(0, -cy);
  }
  // the far wing
  const wing = (dir, a) => {
    ctx.save();
    ctx.translate(-w * 0.05, cy - h * 0.05);
    ctx.rotate(a * dir);
    ctx.fillStyle = dir > 0 ? '#7a8498' : '#9aa4b8';
    ctx.strokeStyle = '#3e4658';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w * 0.3, -h * 0.5 * dir, -w * 0.5, -h * 0.3 * dir);
    ctx.quadraticCurveTo(-w * 0.3, -h * 0.05 * dir, 0, h * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-w * 0.1 * i, -h * 0.05 * i * dir);
      ctx.lineTo(-w * 0.1 * i - 6, -h * 0.05 * i * dir - 6 * dir);
      ctx.stroke();
    }
    ctx.restore();
  };
  wing(1, flap);
  const body = () => {
    ctx.moveTo(-w * 0.46, cy + h * 0.06);
    ctx.quadraticCurveTo(-w * 0.2, cy - h * 0.3, w * 0.2, cy - h * 0.24);
    ctx.quadraticCurveTo(w * 0.42, cy - h * 0.2, w * 0.4, cy);
    ctx.quadraticCurveTo(w * 0.2, cy + h * 0.28, -w * 0.2, cy + h * 0.18);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, cy - h * 0.3, 0, cy + h * 0.25);
  g.addColorStop(0, '#8a94a8');
  g.addColorStop(1, '#eef2f8');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3e4658';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // barring on the breast
  ctx.strokeStyle = 'rgba(90,100,120,0.5)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(w * (0.02 + i * 0.08), cy + h * 0.06);
    ctx.lineTo(w * (0.06 + i * 0.08), cy + h * 0.14);
    ctx.stroke();
  }
  // the hooked beak
  ctx.fillStyle = '#f0c040';
  ctx.strokeStyle = '#6a5018';
  ctx.beginPath();
  ctx.moveTo(w * 0.38, cy - h * 0.12);
  ctx.quadraticCurveTo(w * 0.52, cy - h * 0.08, w * 0.48, cy + h * 0.04);
  ctx.lineTo(w * 0.38, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  face(ctx, w * 0.27, cy - h * 0.1, w * 0.001, t, seed, { dying, size: 0.7, cross: warn });
  wing(-1, flap * 0.8);
  // sleet in its feathers
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 4; i++) circle(ctx, -w * 0.2 + i * w * 0.12, cy - h * 0.14 + (i % 2) * 4, 1.4);
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// Rimeguard: one of the Queen's guards, a fjord-folk slime frozen half to ice and still on watch, in a round
// silver helm, a big round shield of ice held in front (blows on the front don't land well), a short sword.
// m.warn: shield up, about to shove · m.charging: lunging behind the shield
function drawRimeguard(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, charge = !!m.charging && live;
  const cy = -h * 0.42, sway = m.walking ? Math.sin(t * 6) * 1.2 : 0;
  const body = () => {
    ctx.moveTo(-w * 0.4, -2);
    ctx.bezierCurveTo(-w * 0.46, cy - h * 0.62, w * 0.42, cy - h * 0.62, w * 0.38, -2);
    ctx.closePath();
  };
  // the body: frosted jelly, an icy crust over the lower half
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#eef4fa');
  g.addColorStop(1, '#b8d0e8');
  ctx.fillStyle = g;
  ctx.strokeStyle = FOLK_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,200,236,0.55)';
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, -2);
  ctx.lineTo(-w * 0.4, -h * 0.28);
  ctx.lineTo(-w * 0.2, -h * 0.34);
  ctx.lineTo(0, -h * 0.26);
  ctx.lineTo(w * 0.2, -h * 0.34);
  ctx.lineTo(w * 0.38, -h * 0.24);
  ctx.lineTo(w * 0.38, -2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, -w * 0.18, cy - h * 0.12, w * 0.08, h * 0.1, -0.4);
  face(ctx, w * 0.1, cy - h * 0.06, w * 0.09, t, seed, { dying, size: 0.8, cross: true });
  guardHelm(ctx, 0, cy - h * 0.42, w * 0.38, h * 0.18);
  // the sword, held back
  ctx.save();
  ctx.translate(-w * 0.34, cy + h * 0.04);
  ctx.rotate(warn ? -0.9 : -0.4 + sway * 0.02);
  ctx.fillStyle = ICE_L;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.lineTo(-2, -h * 0.4);
  ctx.lineTo(0, -h * 0.46);
  ctx.lineTo(2, -h * 0.4);
  ctx.lineTo(2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SILVER_D;
  ctx.fillRect(-5, -1, 10, 3);
  ctx.restore();
  // the round shield of ice in front
  const sx = w * 0.42 + (charge ? 6 : 0), sy = cy + (warn ? -h * 0.06 : 0), sr = h * 0.3;
  halo(ctx, sx, sy, sr * 1.4, '200,230,255', warn ? 0.5 : 0.2);
  ctx.fillStyle = 'rgba(196,224,248,0.95)';
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(sx, sy, sr * 0.5, sr, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SILVER;
  ctx.strokeStyle = SILVER_D;
  ctx.beginPath();
  ctx.ellipse(sx + 2, sy, sr * 0.18, sr * 0.3, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ellipse(ctx, sx - sr * 0.16, sy - sr * 0.5, sr * 0.1, sr * 0.22, -0.2);
  return () => {
    ctx.beginPath();
    body();
  };
}

// Hoarfrost shade: the cold that settled on the bridge, gathered into a tall ragged shape of frost-feathers
// with two pale lights for eyes and a crown-shape of ice on its head, as if it remembered being a guard.
// It fades out (m.special) and pulses back
function drawHoarfrostShade(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  const cy = -h * 0.55, sway = Math.sin(t * 1.8 + seed) * 3;
  ctx.save();
  if (gone) ctx.globalAlpha *= 0.16 + 0.08 * Math.sin(t * 22);
  halo(ctx, 0, cy, w * 0.9, '220,236,255', 0.35);
  const body = () => {
    ctx.moveTo(-w * 0.34, cy + h * 0.42);
    ctx.bezierCurveTo(-w * 0.5, cy - h * 0.1, -w * 0.3, cy - h * 0.48, sway, cy - h * 0.46);
    ctx.bezierCurveTo(w * 0.3, cy - h * 0.48, w * 0.5, cy - h * 0.1, w * 0.34, cy + h * 0.42);
    for (let i = 0; i < 5; i++) {
      const x = w * 0.34 - (i + 1) * (w * 0.68) / 5;
      ctx.lineTo(x + w * 0.07, cy + h * 0.32 + Math.sin(t * 4 + i) * 3);
      ctx.lineTo(x, cy + h * 0.42 + Math.sin(t * 3 + i * 2) * 4);
    }
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, cy - h * 0.45, 0, cy + h * 0.45);
  g.addColorStop(0, 'rgba(244,250,255,0.9)');
  g.addColorStop(1, 'rgba(170,200,236,0.45)');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(110,150,200,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // frost feathers along its sides
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = cy - h * 0.2 + i * h * 0.1, x = (i % 2 ? 1 : -1) * w * 0.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (i % 2 ? 6 : -6), y - 5);
    ctx.moveTo(x, y);
    ctx.lineTo(x + (i % 2 ? 7 : -7), y + 2);
    ctx.stroke();
  }
  // the crown of ice it remembers wearing
  ctx.fillStyle = 'rgba(214,236,252,0.9)';
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(sway - 10, cy - h * 0.42);
  ctx.lineTo(sway - 10, cy - h * 0.54);
  ctx.lineTo(sway - 4, cy - h * 0.47);
  ctx.lineTo(sway, cy - h * 0.58);
  ctx.lineTo(sway + 4, cy - h * 0.47);
  ctx.lineTo(sway + 10, cy - h * 0.54);
  ctx.lineTo(sway + 10, cy - h * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // two pale lights for eyes
  const live = dying < 0.05;
  for (const dx of [-w * 0.1, w * 0.1]) {
    halo(ctx, sway * 0.5 + dx + w * 0.04, cy - h * 0.18, 7, '200,230,255', live ? 0.9 : 0.2);
    ctx.fillStyle = live ? '#ffffff' : '#a8b8d0';
    circle(ctx, sway * 0.5 + dx + w * 0.04, cy - h * 0.18, 2.2);
  }
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// Leopard seal: a long spotted grey seal with a big head and a wide grin of teeth, slipping along the deck. It
// dives down through the cracks (m.special: only a hole in the ice with a ripple, and its whiskers) and comes up
// behind you
function drawLeopardSeal(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  if (gone) {
    ctx.fillStyle = '#2e4e78';
    ctx.strokeStyle = ICE_LINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, -1, w * 0.3, 4, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = `rgba(200,230,255,${0.6 + 0.3 * Math.sin(t * 8)})`;
    ctx.beginPath();
    ctx.ellipse(0, -1, w * 0.36 + Math.sin(t * 6) * 3, 6, 0, Math.PI, 0);
    ctx.stroke();
    ctx.strokeStyle = '#e8ecf4';
    ctx.lineWidth = 1;
    for (const dy of [-3, 0, 3]) {
      ctx.beginPath();
      ctx.moveTo(w * 0.04, -4 + dy);
      ctx.lineTo(w * 0.16, -6 + dy * 1.5);
      ctx.stroke();
    }
    return () => {
      ctx.beginPath();
      ctx.ellipse(0, -1, w * 0.3, 4, 0, 0, TAU);
    };
  }
  const live = dying < 0.05, warn = !!m.warn && live;
  const cy = -h * 0.46, hump = m.walking ? Math.sin(t * 7) * 2 : 0;
  const body = () => {
    ctx.moveTo(-w * 0.5, cy + h * 0.3);
    ctx.quadraticCurveTo(-w * 0.3, cy - h * 0.44 - hump, w * 0.12, cy - h * 0.4);
    ctx.quadraticCurveTo(w * 0.5, cy - h * 0.4, w * 0.5, cy + h * 0.06);
    ctx.quadraticCurveTo(w * 0.46, cy + h * 0.5, w * 0.2, cy + h * 0.5);
    ctx.lineTo(-w * 0.36, cy + h * 0.5);
    ctx.closePath();
  };
  // the tail flippers
  ctx.fillStyle = '#6a7284';
  ctx.beginPath();
  ctx.moveTo(-w * 0.44, cy + h * 0.3);
  ctx.lineTo(-w * 0.56, cy + h * 0.08);
  ctx.lineTo(-w * 0.52, cy + h * 0.5);
  ctx.closePath();
  ctx.fill();
  const g = ctx.createLinearGradient(0, cy - h * 0.4, 0, cy + h * 0.5);
  g.addColorStop(0, '#7a8296');
  g.addColorStop(1, '#d4d8e2');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2e3446';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // spots
  ctx.fillStyle = 'rgba(46,52,70,0.45)';
  for (let i = 0; i < 9; i++) ellipse(ctx, -w * 0.36 + ((i * 37) % 60) / 60 * w * 0.66, cy - h * 0.16 + ((i * 23) % 30) / 30 * h * 0.4, 2.5, 1.8);
  // the fore flipper
  ctx.fillStyle = '#5e6678';
  ellipse(ctx, w * 0.1, cy + h * 0.4, w * 0.1, h * 0.12, 0.5);
  // the wide mouth, teeth showing when it's about to strike
  ctx.strokeStyle = '#2e3446';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(w * 0.48, cy + h * 0.04);
  ctx.quadraticCurveTo(w * 0.36, cy + h * (warn ? 0.26 : 0.14), w * 0.22, cy + h * 0.06);
  ctx.stroke();
  if (warn) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      const x = w * 0.26 + i * w * 0.05;
      ctx.beginPath();
      ctx.moveTo(x - 2, cy + h * 0.08);
      ctx.lineTo(x + 2, cy + h * 0.08);
      ctx.lineTo(x, cy + h * 0.16);
      ctx.closePath();
      ctx.fill();
    }
  }
  face(ctx, w * 0.32, cy - h * 0.12, w * 0.05, t, seed, { dying, size: 0.75, cross: warn });
  ctx.strokeStyle = '#eef0f6';
  ctx.lineWidth = 1;
  for (const dy of [-2, 1, 4]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.44, cy + dy);
    ctx.lineTo(w * 0.58, cy + dy * 1.6 - 2);
    ctx.stroke();
  }
  return () => {
    ctx.beginPath();
    body();
  };
}

// Rime archer: a guard frozen at her loophole, a fjord-folk slime in a silver helm and a white cloak gone stiff
// with frost, a quiver of ice javelins on her back. She keeps her distance and throws. m.warn: arm back
function drawRimeArcher(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const cy = -h * 0.42;
  const body = () => {
    ctx.moveTo(-w * 0.4, -2);
    ctx.bezierCurveTo(-w * 0.46, cy - h * 0.62, w * 0.42, cy - h * 0.62, w * 0.38, -2);
    ctx.closePath();
  };
  // the quiver of javelins behind her
  ctx.save();
  ctx.translate(-w * 0.3, cy - h * 0.1);
  ctx.rotate(-0.35);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = ICE_L;
    ctx.strokeStyle = ICE_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4 + i * 4, -h * 0.34);
    ctx.lineTo(-2 + i * 4, -h * 0.44);
    ctx.lineTo(0 + i * 4, -h * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#7a5a44';
  ctx.beginPath();
  ctx.roundRect(-6, -h * 0.34, 16, h * 0.4, 4);
  ctx.fill();
  ctx.restore();
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#eef4fa');
  g.addColorStop(1, '#c4d8ec');
  ctx.fillStyle = g;
  ctx.strokeStyle = FOLK_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // the frost-stiff cloak over her back
  ctx.fillStyle = 'rgba(250,252,255,0.9)';
  ctx.strokeStyle = 'rgba(110,140,180,0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.1, cy - h * 0.3);
  ctx.quadraticCurveTo(-w * 0.5, cy - h * 0.1, -w * 0.46, -2);
  ctx.lineTo(-w * 0.2, -2);
  ctx.quadraticCurveTo(-w * 0.18, cy, w * 0.04, cy - h * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  face(ctx, w * 0.12, cy - h * 0.06, w * 0.09, t, seed, { dying, size: 0.8, cross: warn });
  guardHelm(ctx, 0, cy - h * 0.42, w * 0.36, h * 0.18);
  // the throwing arm and a javelin
  ctx.save();
  ctx.translate(w * 0.24, cy + h * 0.02);
  ctx.rotate(warn ? -2.2 : -0.6);
  ctx.fillStyle = FOLK;
  ctx.strokeStyle = FOLK_LINE;
  ctx.lineWidth = 1.4;
  ellipse(ctx, 0, -h * 0.12, 5, h * 0.12);
  ctx.stroke();
  if (warn) {
    ctx.fillStyle = ICE_L;
    ctx.strokeStyle = ICE_LINE;
    ctx.beginPath();
    ctx.moveTo(-2, -h * 0.2);
    ctx.lineTo(0, -h * 0.62);
    ctx.lineTo(2, -h * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    halo(ctx, 0, -h * 0.58, 8, '200,230,255', 0.8);
  }
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

export const QBRIDGE_MOB_ART = { rime_puffin: drawRimePuffin, sleet_harrier: drawSleetHarrier, rimeguard: drawRimeguard, hoarfrost_shade: drawHoarfrostShade, leopard_seal: drawLeopardSeal, rime_archer: drawRimeArcher };

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
// Rimeguard Blade: a straight guard's sword, its edge frozen glass-sharp, a silver cross-guard with a little crown
function drawRimeguardBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-4.5, -6);
    ctx.lineTo(-4.5, -L * 0.88);
    ctx.lineTo(0, -L);
    ctx.lineTo(4.5, -L * 0.88);
    ctx.lineTo(4.5, -6);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-4.5, 0, 4.5, 0);
  g.addColorStop(0, '#f4f8fc');
  g.addColorStop(1, '#b8c4d8');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#5a6a88';
  ctx.lineWidth = 1.5;
  blade();
  ctx.fill();
  ctx.stroke();
  // the frozen edge
  ctx.strokeStyle = `rgba(190,230,255,${0.55 + 0.45 * glow})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, -8);
  ctx.lineTo(4, -L * 0.87);
  ctx.lineTo(0, -L * 0.98);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,106,136,0.5)'; // the fuller
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, -L * 0.8);
  ctx.stroke();
  ctx.fillStyle = SILVER;
  ctx.strokeStyle = SILVER_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-11, -9, 22, 4.5, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c9a64a';
  ctx.beginPath();
  ctx.moveTo(-3, -9);
  ctx.lineTo(-3, -13);
  ctx.lineTo(-1, -11);
  ctx.lineTo(0, -14);
  ctx.lineTo(1, -11);
  ctx.lineTo(3, -13);
  ctx.lineTo(3, -9);
  ctx.closePath();
  ctx.fill();
  grip(ctx, '#3e4a66', '#8a96b4');
  ctx.fillStyle = SILVER;
  circle(ctx, 0, 12, 3);
  ctx.restore();
}
// Shield-Oath Spear: Sigrun's spear, a long shaft of pale wood bound in silver, its head a long leaf of clear
// blue ice with the seam's light in it
function drawOathSpear(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#c8b498';
  ctx.strokeStyle = '#6a5a44';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-2.2, -L * 0.7, 4.4, L * 0.7 + 10, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SILVER;
  for (const y of [-L * 0.2, -L * 0.45, -L * 0.68]) ctx.fillRect(-3, y, 6, 3);
  // the head
  halo(ctx, 0, -L * 0.84, 10 + 6 * glow, '190,230,255', 0.5 + 0.4 * glow);
  ctx.fillStyle = 'rgba(206,232,252,0.95)';
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.68);
  ctx.quadraticCurveTo(-8, -L * 0.8, 0, -L);
  ctx.quadraticCurveTo(8, -L * 0.8, 0, -L * 0.68);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${0.6 + 0.4 * glow})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.7);
  ctx.lineTo(0, -L * 0.96);
  ctx.stroke();
  ctx.fillStyle = '#8ab8e0'; // a pale blue pennant
  ctx.beginPath();
  ctx.moveTo(2, -L * 0.66);
  ctx.lineTo(14, -L * 0.62);
  ctx.lineTo(2, -L * 0.57);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
export const QBRIDGE_SWORDS = { rimeguard_blade: drawRimeguardBlade, oath_blade: drawOathSpear };
export const QBRIDGE_SWORD_LEN = { rimeguard_blade: 62, oath_blade: 72 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Rimeguard Helm: a guard's round silver helm gone white with rime, a nasal bar, the Queen's crown on the brow
function drawRimeguardHelm(ctx, w, h) {
  const by = -h * 0.72, rx = w * 0.5;
  ctx.fillStyle = SILVER;
  ctx.strokeStyle = SILVER_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx, by - h * 0.42, rx, by - h * 0.42, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(rx * 0.3, by - 2, 4, 14); // the nasal bar
  ctx.fillRect(-2, by - h * 0.32, 4, 8); // the spike
  ctx.fillStyle = '#c9a64a';
  ctx.beginPath();
  ctx.moveTo(-6, by - 2);
  ctx.lineTo(-6, by - 9);
  ctx.lineTo(-3, by - 5);
  ctx.lineTo(0, by - 11);
  ctx.lineTo(3, by - 5);
  ctx.lineTo(6, by - 9);
  ctx.lineTo(6, by - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(250,252,255,0.9)';
  ellipse(ctx, -rx * 0.3, by - h * 0.22, rx * 0.4, 3, -0.2);
  ctx.fillStyle = SILVER_D;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by + 2, rx * 2.04, 5, 2.5);
  ctx.fill();
}
// Sigrun's Helm: a tall helm of rimed silver and clear ice, two swept wings of ice at the sides, her queen's
// crown worked small on the brow
function drawSigrunHelm(ctx, w, h, t = 0) {
  const by = -h * 0.72, rx = w * 0.5;
  ctx.save();
  ctx.lineJoin = 'round';
  // the wings
  for (const s of [-1, 1]) {
    ctx.fillStyle = 'rgba(214,236,252,0.95)';
    ctx.strokeStyle = ICE_LINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(s * rx * 0.8, by - 2);
    ctx.quadraticCurveTo(s * rx * 1.5, by - h * 0.2, s * rx * 1.4, by - h * 0.56);
    ctx.quadraticCurveTo(s * rx * 1.2, by - h * 0.3, s * rx * 0.7, by - h * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(62,98,148,0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(s * rx * (0.8 + i * 0.12), by - h * (0.08 + i * 0.08));
      ctx.lineTo(s * rx * (0.9 + i * 0.12), by - h * (0.14 + i * 0.1));
      ctx.stroke();
    }
  }
  ctx.fillStyle = SILVER;
  ctx.strokeStyle = SILVER_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx, by - h * 0.5, rx, by - h * 0.5, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // a band of clear ice round it, lit
  halo(ctx, 0, by - 2, rx, '190,230,255', 0.3 + 0.1 * Math.sin(t * 2));
  ctx.fillStyle = 'rgba(190,226,252,0.9)';
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by - 2, rx * 2.04, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#c9a64a';
  ctx.beginPath();
  ctx.moveTo(-5, by - 2);
  ctx.lineTo(-5, by - 8);
  ctx.lineTo(-2.5, by - 5);
  ctx.lineTo(0, by - 10);
  ctx.lineTo(2.5, by - 5);
  ctx.lineTo(5, by - 8);
  ctx.lineTo(5, by - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(250,252,255,0.9)';
  ellipse(ctx, -rx * 0.25, by - h * 0.3, rx * 0.35, 3, -0.2);
  ctx.restore();
}
export const QBRIDGE_HELMETS = { rimeguard_helm: drawRimeguardHelm, sigrun_helm: drawSigrunHelm };

// ——— materials' icons (40 × 40, centred) ———
function iconPuffinBeak(ctx) {
  ctx.fillStyle = '#ff8a3a';
  ctx.strokeStyle = '#8a3a1a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, -10);
  ctx.quadraticCurveTo(14, -4, 12, 6);
  ctx.lineTo(-12, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a8098';
  ctx.fillRect(-10, -8, 4, 16);
  ctx.fillStyle = '#f4c040';
  ctx.fillRect(-4, -6, 3, 13);
  ctx.fillStyle = 'rgba(240,248,255,0.95)';
  ellipse(ctx, 9, 3, 4, 2.5);
}
function iconHarrierTalon(ctx) {
  ctx.fillStyle = '#5a5e6e';
  ctx.strokeStyle = '#2e3040';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-6, -14);
  ctx.quadraticCurveTo(12, -12, 10, 6);
  ctx.quadraticCurveTo(6, 14, -2, 12);
  ctx.quadraticCurveTo(4, 6, 2, -2);
  ctx.quadraticCurveTo(0, -8, -8, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(214,236,252,0.95)';
  ellipse(ctx, 4, 2, 3, 5, 0.4);
}
function iconRimeBuckle(ctx) {
  ctx.fillStyle = '#6a5040';
  ctx.fillRect(-16, -5, 32, 10);
  ctx.fillStyle = SILVER;
  ctx.strokeStyle = SILVER_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-10, -11, 20, 22, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c9a64a';
  ctx.beginPath();
  ctx.moveTo(-6, 4);
  ctx.lineTo(-6, -4);
  ctx.lineTo(-3, -1);
  ctx.lineTo(0, -6);
  ctx.lineTo(3, -1);
  ctx.lineTo(6, -4);
  ctx.lineTo(6, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(214,236,252,0.8)';
  ellipse(ctx, -4, -8, 6, 2);
}
function iconBottledHoarfrost(ctx) {
  ctx.fillStyle = 'rgba(214,236,252,0.6)';
  ctx.strokeStyle = '#5a7aa0';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-9, -8, 18, 22, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a6a50';
  ctx.fillRect(-4, -15, 8, 7);
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const x = -5 + i * 3.5, y = 8 - i * 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 3, y - 3);
    ctx.moveTo(x, y);
    ctx.lineTo(x - 3, y - 3);
    ctx.stroke();
  }
  halo(ctx, 0, 3, 10, '220,236,255', 0.5);
}
function iconSealWhisker(ctx) {
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, 12);
  ctx.quadraticCurveTo(0, -2, 14, -12);
  ctx.strokeStyle = '#5a6078';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = '#f4f6fa';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#5a6078';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    circle(ctx, -9 + i * 6.5, 8 - i * 5.6, 2.4);
    ctx.stroke();
  }
}
function iconIceArrowhead(ctx) {
  halo(ctx, 0, -2, 14, '190,230,255', 0.5);
  ctx.fillStyle = 'rgba(206,232,252,0.95)';
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(8, 4);
  ctx.lineTo(2, 2);
  ctx.lineTo(2, 12);
  ctx.lineTo(-2, 12);
  ctx.lineTo(-2, 2);
  ctx.lineTo(-8, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(-4, 1);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
}
function iconSeamIce(ctx) {
  halo(ctx, 0, 0, 18, '170,220,255', 0.6);
  ctx.fillStyle = 'rgba(200,232,255,0.95)';
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-12, -6);
  ctx.lineTo(-2, -13);
  ctx.lineTo(12, -7);
  ctx.lineTo(10, 9);
  ctx.lineTo(-4, 13);
  ctx.lineTo(-13, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the seam's line of light through it
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-10, 3);
  ctx.lineTo(-3, -1);
  ctx.lineTo(2, 2);
  ctx.lineTo(10, -3);
  ctx.stroke();
}
export const QBRIDGE_ICONS = { puffin_beak: iconPuffinBeak, harrier_talon: iconHarrierTalon, rime_buckle: iconRimeBuckle, bottled_hoarfrost: iconBottledHoarfrost, seal_whisker: iconSealWhisker, ice_arrowhead: iconIceArrowhead, seam_ice: iconSeamIce };
