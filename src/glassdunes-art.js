// Docs: docs/places/glassdunes.md, docs/combat/stages.md
// The Glass Dunes' art that isn't the room itself (src/glassdunes.js; atlas Phase 9, A0): its creatures (sand skipper,
// heat mirage, dune beetle, fulgurite scorpion; DUNES_MOB_ART, called by drawMob in src/field.js; the Mirage Oasis has the
// skippers and the mirages too) and its materials' icons (DUNES_ICONS). Amberdune's register: sun-bleached golds and
// ochres, sandstone reds, a deep sky blue; lightning glass where the sand fused; soft and rounded as ever.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#3a2a1e';
const SAND = '#e8c88a', SAND_D = '#b8924e', SAND_L = '#f6e2b4';
const OCHRE = '#d8963a', OCHRE_D = '#9a5e1e';
const GLASS = 'rgba(200,226,236,0.85)', GLASS_D = '#6a8a9a', GLASS_L = '#f0faff';

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, col = INKC } = {}) {
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.4) < 0.12;
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
      ctx.fillStyle = col;
    }
  }
}

// Sand skipper: a little sand lizard, gold with ochre bands, a striped frill at its neck, running up on its toes with
// its tail held high; quick and low, in bunches
function drawSandSkipper(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const run = live ? Math.sin(t * 18 + seed) : 0;
  const hop = live ? Math.abs(Math.sin(t * 9 + seed)) * 3 : 0;
  const by = -h * 0.42 - hop;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, by, w * 0.34, h * 0.26, -0.05, 0, TAU);
  };
  ctx.save();
  ctx.strokeStyle = SAND_D; // the legs, up on its toes
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [lx, ph] of [[-w * 0.18, 1], [w * 0.16, -1]]) {
    ctx.moveTo(lx, by + h * 0.1);
    ctx.lineTo(lx + run * ph * 7, -1);
  }
  ctx.stroke();
  ctx.fillStyle = SAND; // the tail, held high and curled
  ctx.strokeStyle = SAND_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.28, by - 3);
  ctx.quadraticCurveTo(-w * 0.6, by - h * 0.4 + run * 2, -w * 0.46, by - h * 0.74);
  ctx.quadraticCurveTo(-w * 0.52, by - h * 0.3, -w * 0.26, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const g = ctx.createLinearGradient(0, by - h * 0.26, 0, by + h * 0.26);
  g.addColorStop(0, SAND_L);
  g.addColorStop(1, SAND);
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(216,150,58,0.7)'; // ochre bands
  for (const x of [-0.18, -0.02, 0.14]) ellipse(ctx, w * x, by - h * 0.1, 3, h * 0.12);
  ctx.fillStyle = SAND; // the head
  ellipse(ctx, w * 0.36, by - h * 0.12, w * 0.16, h * 0.18);
  ctx.strokeStyle = SAND_D;
  ctx.stroke();
  ctx.fillStyle = live ? '#e8583a' : '#a8705a'; // the frill, spread, striped like a sunset
  ctx.beginPath();
  ctx.moveTo(w * 0.24, by - h * 0.3);
  ctx.quadraticCurveTo(w * 0.18, by - h * 0.62, w * 0.3, by - h * 0.66);
  ctx.quadraticCurveTo(w * 0.32, by - h * 0.4, w * 0.3, by - h * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f4d68a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.25, by - h * 0.32);
  ctx.lineTo(w * 0.27, by - h * 0.58);
  ctx.stroke();
  eyes(ctx, w * 0.4, by - h * 0.18, 3.2, t, seed, { dying, size: 0.8 });
  ctx.restore();
  return body;
}

// Heat mirage: the shimmer over hot sand got up and wandering: a tall wavering column of clear air with a mirrored sliver
// of sky in it and two soft dark eyes. Harmless, and everywhere
function drawHeatMirage(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const a = live ? 1 : Math.max(0, 1 - dying * 1.5);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, 0);
    for (let y = 0; y >= -h; y -= 6) ctx.lineTo(-w * 0.32 * (1 - (-y / h) * 0.4) + Math.sin(y * 0.18 + t * 6 + seed) * 3, y);
    for (let y = -h; y <= 0; y += 6) ctx.lineTo(w * 0.32 * (1 - (-y / h) * 0.4) + Math.sin(y * 0.18 + t * 6 + seed + 1.4) * 3, y);
    ctx.closePath();
  };
  ctx.save();
  ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, 'rgba(150,200,240,0.4)');
  g.addColorStop(0.5, 'rgba(255,246,220,0.35)');
  g.addColorStop(1, 'rgba(255,214,150,0.25)');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = 'rgba(120,180,230,0.45)'; // a mirrored sliver of sky
  ctx.fillRect(-w, -h * 0.5 + Math.sin(t * 2 + seed) * 4, w * 2, h * 0.14);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    const y = -((t * 22 + i * h * 0.2 + seed * 13) % h);
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, y);
    for (let x = -w * 0.3; x <= w * 0.3; x += 4) ctx.lineTo(x, y + Math.sin(x * 0.3 + t * 8) * 1.5);
    ctx.stroke();
  }
  ctx.restore();
  eyes(ctx, w * 0.06, -h * 0.66, 5, t, seed, { dying, size: 0.9, col: 'rgba(80,60,40,0.7)' });
  ctx.restore();
  return body;
}

// Dune beetle: a round black beetle with a gold sheen, a scoop of a horn for digging. Under the sand (the `phase` brain:
// m.special) it's only a mound of sand travelling, a horn tip showing; it bursts up out of it with a pulse
function drawDuneBeetle(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const under = live && m?.special;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.42, w * 0.42, h * 0.4, 0, Math.PI, 0);
    ctx.lineTo(w * 0.42, -h * 0.2);
    ctx.quadraticCurveTo(0, -h * 0.06, -w * 0.42, -h * 0.2);
    ctx.closePath();
  };
  ctx.save();
  if (under) {
    // a mound of sand moving along, grains spilling off, the horn tip just showing
    ctx.fillStyle = SAND;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.5, h * 0.3, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = SAND_D;
    for (let i = 0; i < 6; i++) {
      const k = (t * 2 + i / 6) % 1;
      circle(ctx, (i % 2 ? 1 : -1) * w * (0.3 + k * 0.3), -h * 0.12 + k * h * 0.14, 1.6);
    }
    ctx.fillStyle = '#2a2430';
    ctx.beginPath();
    ctx.moveTo(w * 0.1, -h * 0.26);
    ctx.lineTo(w * 0.2, -h * 0.5);
    ctx.lineTo(w * 0.24, -h * 0.26);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return () => {
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.5, h * 0.3, 0, Math.PI, 0);
    };
  }
  const walk = live ? Math.sin(t * 10 + seed) : 0;
  ctx.strokeStyle = '#1e1a22'; // six legs
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const lx = -w * 0.26 + i * w * 0.26, ph = i % 2 ? 1 : -1;
    ctx.moveTo(lx, -h * 0.2);
    ctx.lineTo(lx + walk * ph * 5 - 4, -1);
  }
  ctx.stroke();
  const g = ctx.createLinearGradient(-w * 0.3, -h * 0.8, w * 0.3, -h * 0.1);
  g.addColorStop(0, '#4a4060');
  g.addColorStop(0.5, '#26202e');
  g.addColorStop(1, '#3a2a1e');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#141018';
  ctx.lineWidth = 2;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232,184,90,0.6)'; // the gold sheen and the line between its wing-cases
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-w * 0.1, -h * 0.5, w * 0.24, h * 0.22, -0.3, Math.PI * 1.1, Math.PI * 1.6);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(20,16,24,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.04, -h * 0.8);
  ctx.lineTo(-w * 0.04, -h * 0.16);
  ctx.stroke();
  ctx.fillStyle = '#26202e'; // the head and its digging horn
  ellipse(ctx, w * 0.42, -h * 0.26, w * 0.14, h * 0.16);
  ctx.beginPath();
  ctx.moveTo(w * 0.44, -h * 0.36);
  ctx.quadraticCurveTo(w * 0.62, -h * 0.5, w * 0.6, -h * 0.8);
  ctx.quadraticCurveTo(w * 0.52, -h * 0.5, w * 0.36, -h * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(232,184,90,0.7)';
  ellipse(ctx, w * 0.56, -h * 0.66, 1.6, 4, 0.3);
  eyes(ctx, w * 0.46, -h * 0.26, 3, t, seed, { dying, size: 0.7, col: '#f4d68a' });
  // sand still spilling off its back for a moment after it comes up
  ctx.fillStyle = 'rgba(232,200,138,0.8)';
  for (let i = 0; i < 4; i++) circle(ctx, -w * 0.2 + i * w * 0.14, -h * 0.74 + ((t * 30 + i * 9) % 18), 1.4);
  ctx.restore();
  return body;
}

// Fulgurite scorpion: a sand-coloured scorpion whose front, claws and all, is crusted over in lightning glass, branching
// and clear; its back is bare (`shell`: hit it from behind). m.warn: the claws come up and the sting arches over
function drawFulguriteScorpion(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m?.warn && live, lunge = !!m?.charging && live;
  const by = -h * 0.36;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(-w * 0.04, by, w * 0.3, h * 0.24, 0, 0, TAU);
  };
  ctx.save();
  const walk = live ? Math.sin(t * 9 + seed) : 0;
  ctx.strokeStyle = SAND_D; // eight legs
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const lx = -w * 0.22 + i * w * 0.12, ph = i % 2 ? 1 : -1;
    ctx.moveTo(lx, by + 4);
    ctx.quadraticCurveTo(lx - 6, by + 10, lx - 8 + walk * ph * 4, -1);
  }
  ctx.stroke();
  // the tail, segment by segment, arched over: higher on a warning
  const arch = warn ? 1 : 0.7 + Math.sin(t * 2 + seed) * 0.05;
  let px = -w * 0.3, py = by - 2;
  ctx.fillStyle = SAND;
  ctx.strokeStyle = SAND_D;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.95 - i * 0.22 * arch);
    px += Math.cos(a) * w * 0.1;
    py -= Math.sin(a) * h * 0.22 * arch + 2;
    ctx.beginPath();
    ctx.ellipse(px, py, 6 - i * 0.4, 5 - i * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = GLASS; // the sting, a hook of glass
  ctx.strokeStyle = GLASS_D;
  ctx.beginPath();
  ctx.moveTo(px - 2, py - 4);
  ctx.quadraticCurveTo(px + 10, py - 6, px + 10, py + 6);
  ctx.quadraticCurveTo(px + 4, py, px + 2, py + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SAND; // the body, bare at the back
  ctx.strokeStyle = SAND_D;
  ctx.lineWidth = 2;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(184,146,78,0.5)';
  for (const x of [-0.24, -0.14, -0.04]) ellipse(ctx, w * x, by - 2, 2.4, h * 0.16);
  // the glass shell over its front half and the claws, branching and clear, glinting
  ctx.fillStyle = GLASS;
  ctx.strokeStyle = GLASS_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(w * 0.02, by - h * 0.28);
  ctx.quadraticCurveTo(w * 0.3, by - h * 0.34, w * 0.3, by);
  ctx.quadraticCurveTo(w * 0.28, by + h * 0.24, w * 0.02, by + h * 0.22);
  ctx.lineTo(w * 0.08, by + h * 0.06);
  ctx.lineTo(w * 0.0, by - h * 0.04);
  ctx.lineTo(w * 0.08, by - h * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const reach = lunge ? 14 : warn ? -4 : 0, up = warn ? -h * 0.24 : 0;
  for (const [dy, s] of [[-h * 0.12, 1], [h * 0.1, 0.85]]) { // the claws, glass-crusted
    const cx = w * 0.42 + reach, cy = by + dy + up * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.26, by + dy * 0.5);
    ctx.lineTo(cx - 6, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 2);
    ctx.quadraticCurveTo(cx + 6, cy - 10 * s, cx + 12, cy - 2);
    ctx.lineTo(cx + 2, cy);
    ctx.quadraticCurveTo(cx + 8, cy + 6, cx - 6, cy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = GLASS_L; // a branching glint
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, by - h * 0.2);
  ctx.lineTo(w * 0.18, by - h * 0.06);
  ctx.lineTo(w * 0.14, by + h * 0.04);
  ctx.moveTo(w * 0.18, by - h * 0.06);
  ctx.lineTo(w * 0.24, by - h * 0.02);
  ctx.stroke();
  eyes(ctx, w * 0.22, by - h * 0.12, 3, t, seed, { dying, size: 0.7 });
  if (live && Math.sin(t * 3 + seed) > 0.85) { // a spark in the glass
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    circle(ctx, w * 0.2, by - h * 0.2, 1.6);
  }
  ctx.restore();
  return body;
}

export const DUNES_MOB_ART = { sand_skipper: drawSandSkipper, heat_mirage: drawHeatMirage, dune_beetle: drawDuneBeetle, fulgurite_scorpion: drawFulguriteScorpion };

// ——— materials' icons (centred on the origin, about 28 px across) ———
function iconSkipperFrill(ctx) {
  ctx.save();
  ctx.fillStyle = '#e8583a';
  ctx.strokeStyle = '#9a3a22';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 9);
  ctx.lineTo(-11, -4);
  ctx.quadraticCurveTo(0, -12, 11, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#f4d68a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const a of [-0.9, -0.3, 0.3, 0.9]) {
    ctx.moveTo(0, 8);
    ctx.lineTo(Math.sin(a) * 11, -Math.cos(a) * 9);
  }
  ctx.stroke();
  ctx.restore();
}
function iconBottledShimmer(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(200,226,240,0.5)';
  ctx.strokeStyle = '#8a9aa8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-3, -11);
  ctx.lineTo(3, -11);
  ctx.lineTo(3, -5);
  ctx.quadraticCurveTo(10, -2, 9, 5);
  ctx.quadraticCurveTo(8, 11, 0, 11);
  ctx.quadraticCurveTo(-8, 11, -9, 5);
  ctx.quadraticCurveTo(-10, -2, -3, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a6a48';
  ctx.fillRect(-3.5, -13, 7, 3);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  for (const y of [0, 4]) {
    ctx.beginPath();
    for (let x = -7; x <= 7; x += 2) ctx.lineTo(x, y + Math.sin(x) * 1);
    ctx.stroke();
  }
  ctx.restore();
}
function iconBeetleWingcase(ctx) {
  ctx.save();
  ctx.fillStyle = '#26202e';
  ctx.strokeStyle = '#141018';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 12, 0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232,184,90,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-2, -2, 5, 8, 0.3, Math.PI * 1.1, Math.PI * 1.7);
  ctx.stroke();
  ctx.restore();
}
function iconFulguriteSting(ctx) {
  ctx.save();
  ctx.fillStyle = GLASS;
  ctx.strokeStyle = GLASS_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-8, 10);
  ctx.quadraticCurveTo(-6, -6, 6, -10);
  ctx.quadraticCurveTo(10, -2, 4, 2);
  ctx.quadraticCurveTo(2, -4, -2, 0);
  ctx.quadraticCurveTo(-4, 6, -4, 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = GLASS_L;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-5, 6);
  ctx.lineTo(-3, -2);
  ctx.lineTo(2, -6);
  ctx.stroke();
  ctx.restore();
}
export const DUNES_ICONS = { skipper_frill: iconSkipperFrill, bottled_shimmer: iconBottledShimmer, beetle_wingcase: iconBeetleWingcase, fulgurite_sting: iconFulguriteSting };
export { SAND, SAND_D, SAND_L, OCHRE, OCHRE_D };
