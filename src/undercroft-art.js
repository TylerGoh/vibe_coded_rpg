// Docs: docs/places/undercroft.md, docs/combat/stages.md
// The Citadel's depth pass, C6 (b)'s art that isn't a room (the Undercroft's room is src/undercroft.js, the approach
// src/spoke.js): the Undercroft's mobs (sump slime, wheelwright echo, loose pawl, counterweight; the elites are drawn as
// their base, bigger) and the Mainspring, a named elite with its own art (UNDERCROFT_MOB_ART, called by drawMob in
// src/field.js); the materials' icons (UNDERCROFT_ICONS); gear for players (UNDERCROFT_SWORDS, UNDERCROFT_SWORD_LEN,
// UNDERCROFT_HELMETS): the Mainspring Blade and the wheelwright echoes' cap (the staff and bow are rows in src/staff-art.js
// and src/bow-art.js). The Citadel's register at its very bottom: black iron, lead, blue steel, old brass, leaked aether;
// solemn, no whimsy.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse, clamp } from './util.js';
import { link } from './keel-art.js';

const IRON = '#4a4656', IRON_D = '#2a2834', IRON_L = '#6e6a7e';
const BRASS = '#f0c470', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const LEAD = '#5e5e68', LEAD_D = '#34343c', LEAD_L = '#8a8a96';
const STEEL = '#4a6a9a', STEEL_D = '#2a3e62', STEEL_L = '#8ab0e0';
const AETHER = '150,240,234';
const warnK = (v) => (v === true ? 1 : clamp(+v || 0, 0, 1));

function softGlow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  circle(ctx, x, y, r);
}
// a small gear tooth (a stub of brass), turned by a
function toothBit(ctx, x, y, a, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = BRASS_E;
  ctx.beginPath();
  ctx.moveTo(-s, s * 0.6);
  ctx.lineTo(-s * 0.6, -s * 0.6);
  ctx.lineTo(s * 0.6, -s * 0.6);
  ctx.lineTo(s, s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// A sump slime: leaked aether gone thick and alive in the sump under the Wheel, a blue-black slime with a slow pale light
// moving in it and drowned gear teeth turning inside. On its warn it swells and the light gathers at its top; then it spits
// a glob of the stuff (the `sump` shot)
function drawSumpSlime(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0;
  const sq = live ? Math.sin(t * 3 + seed * 5) * 0.05 : 0;
  const rx = w * 0.5 * (1 + sq + wk * 0.08), ry = h * (0.9 - sq + wk * 0.12);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-rx, 0);
    ctx.bezierCurveTo(-rx, -ry * 0.9, -rx * 0.4, -ry, 0, -ry);
    ctx.bezierCurveTo(rx * 0.4, -ry, rx, -ry * 0.9, rx, 0);
    ctx.closePath();
  };
  ctx.save();
  softGlow(ctx, 0, -ry * 0.5, rx * 1.6, AETHER, 0.16 + 0.2 * wk);
  const g = ctx.createLinearGradient(0, -ry, 0, 0);
  g.addColorStop(0, '#2a5a66');
  g.addColorStop(0.6, '#123038');
  g.addColorStop(1, '#0a1c22');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,240,234,0.45)';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  // drowned teeth turning slowly inside
  ctx.save();
  body();
  ctx.clip();
  for (let i = 0; i < 3; i++) toothBit(ctx, -rx * 0.4 + i * rx * 0.4, -ry * (0.3 + 0.15 * (i % 2)), t * 0.4 + i * 2 + seed, 5);
  // the slow light moving in it
  const lx = Math.sin(t * 0.7 + seed) * rx * 0.5;
  softGlow(ctx, lx, -ry * (0.5 + 0.3 * wk), rx * 0.5, '220,255,250', 0.25 + 0.4 * wk);
  ctx.restore();
  ctx.fillStyle = 'rgba(220,255,250,0.5)'; // a highlight
  ellipse(ctx, -rx * 0.35, -ry * 0.72, rx * 0.16, ry * 0.08, -0.4);
  // eyes
  ctx.fillStyle = 'rgba(230,255,252,0.9)';
  circle(ctx, rx * 0.2, -ry * 0.5, 3);
  circle(ctx, rx * 0.52, -ry * 0.48, 2.6);
  ctx.fillStyle = '#06161a';
  circle(ctx, rx * 0.22, -ry * 0.5, 1.4);
  circle(ctx, rx * 0.54, -ry * 0.48, 1.2);
  ctx.restore();
  return body;
}

// A wheelwright echo: the echo of one of the Keepers' wheelwrights who went down in the Stopped Hour to free the Wheel and
// never came up. A Keeper's echo (the Last Echo's look: see-through blue-white, flickering, lines running down it), in a
// wheelwright's leather cap with a lamp at the brow, a great spanner over its shoulder; it goes round and round its last
// job. It fades out and back (`phase`: m.phased while it's gone); on its warn it swings the spanner up
function drawWrightEcho(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0;
  const fl = 0.6 + 0.4 * Math.abs(Math.sin(t * 7.3 + seed) * Math.sin(t * 2.1 + seed));
  const a = (m?.phased ? 0.22 : 0.8) * (1 - dying * 0.8) * (0.75 + 0.25 * fl);
  const bob = live ? Math.sin(t * 1.4 + seed) * 2 : 0;
  const rx = w * 0.5, top = -h * 0.86 + bob;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-rx, 0);
    ctx.bezierCurveTo(-rx, top * 0.7, -rx * 0.5, top, 0, top);
    ctx.bezierCurveTo(rx * 0.5, top, rx, top * 0.7, rx, 0);
    ctx.closePath();
  };
  ctx.save();
  ctx.globalAlpha *= a;
  softGlow(ctx, 0, top * 0.5, w, '214,228,255', 0.25);
  ctx.fillStyle = 'rgba(230,238,255,0.42)';
  body();
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,214,240,0.7)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.save();
  body();
  ctx.clip();
  ctx.strokeStyle = `rgba(230,240,255,${0.25 * fl})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const off = (t * 18) % 6;
  for (let y = top + off; y < 0; y += 6) {
    ctx.moveTo(-rx, y);
    ctx.lineTo(rx, y);
  }
  ctx.stroke();
  ctx.restore();
  // the cap: close leather, the lamp on its brass arm at the brow (out: it's only an echo of a lamp)
  ctx.fillStyle = 'rgba(120,96,74,0.75)';
  ctx.beginPath();
  ctx.ellipse(0, top + h * 0.1, rx * 0.66, h * 0.13, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillRect(-rx * 0.68, top + h * 0.1, rx * 1.36, 3);
  ctx.fillStyle = 'rgba(240,196,112,0.7)';
  ctx.fillRect(rx * 0.3, top + h * 0.02, 4, 8);
  circle(ctx, rx * 0.44, top + h * 0.03, 3);
  // face
  ctx.fillStyle = 'rgba(40,50,80,0.7)';
  circle(ctx, rx * 0.2, top + h * 0.32, 2.2);
  circle(ctx, rx * 0.52, top + h * 0.32, 2);
  // the spanner over its shoulder, up on the warn
  ctx.save();
  ctx.translate(-rx * 0.3, top + h * 0.5);
  ctx.rotate(-0.9 + wk * 1.4 + (live ? Math.sin(t * 1.4 + seed) * 0.05 : 0));
  ctx.fillStyle = 'rgba(180,190,210,0.8)';
  ctx.fillRect(-2.5, -h * 0.55, 5, h * 0.55);
  ctx.beginPath();
  ctx.arc(0, -h * 0.58, 8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(40,50,80,0.6)';
  ctx.fillRect(-3, -h * 0.66, 6, 8);
  ctx.restore();
  ctx.restore();
  return body;
}

// A loose pawl: one of the Wheel's ratchet pawls come off its pin, a hooked iron catch as big as a slime on a coiled spring,
// its pin-hole lit with aether. It hops along on its spring; on its warn the spring winds down tight; then it springs up and
// slams down like a pawl dropping into a ratchet (the stomp)
function drawLoosePawl(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0, air = !!m?.charging;
  const hop = live && !air && wk < 0.05 ? Math.abs(Math.sin(t * 3 + seed)) * 6 : 0;
  const coilH = h * (air ? 0.46 : 0.3 - wk * 0.14);
  const by = -coilH - hop;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, by - h * 0.32, w * 0.46, h * 0.38, 0, 0, TAU);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(10,10,14,0.35)';
  ellipse(ctx, 0, 0, w * 0.36, 4);
  // the spring
  ctx.strokeStyle = STEEL_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const turns = 5;
  for (let i = 0; i <= turns * 8; i++) {
    const k = i / (turns * 8), y = -hop - coilH * k, x = Math.sin(k * turns * TAU) * w * 0.18;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,176,224,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // the pawl: a hooked iron catch, its tip bright where it bit
  ctx.save();
  ctx.translate(0, by);
  ctx.rotate(air ? 0.25 : -wk * 0.15);
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.moveTo(-w * 0.38, 0);
  ctx.quadraticCurveTo(-w * 0.46, -h * 0.5, -w * 0.08, -h * 0.66);
  ctx.quadraticCurveTo(w * 0.36, -h * 0.72, w * 0.5, -h * 0.4);
  ctx.lineTo(w * 0.34, -h * 0.3);
  ctx.quadraticCurveTo(w * 0.2, -h * 0.5, -w * 0.02, -h * 0.42);
  ctx.quadraticCurveTo(w * 0.2, -h * 0.1, w * 0.1, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(253,227,160,0.5)'; // the bitten tip
  ctx.beginPath();
  ctx.moveTo(w * 0.5, -h * 0.4);
  ctx.lineTo(w * 0.34, -h * 0.3);
  ctx.lineTo(w * 0.42, -h * 0.44);
  ctx.closePath();
  ctx.fill();
  // the pin-hole, lit like an eye
  softGlow(ctx, -w * 0.16, -h * 0.4, 10 + wk * 6, AETHER, 0.6);
  ctx.fillStyle = IRON_D;
  circle(ctx, -w * 0.16, -h * 0.4, 5);
  ctx.fillStyle = `rgba(${AETHER},${0.8 + 0.2 * wk})`;
  circle(ctx, -w * 0.16, -h * 0.4, 2.6);
  ctx.restore();
  ctx.restore();
  return body;
}

// A counterweight: one of the clock's drive weights, a great bell of lead on a chain going up out of sight, its weight
// stamped on its side in a measure nobody uses. It hangs; on its warn the chain goes slack; then it drops on you (the dive)
function drawCounterweight(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0, drop = !!m?.charging;
  const sw = live ? Math.sin(t * 0.8 + seed) * 0.06 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.5, w * 0.5, h * 0.5, 0, 0, TAU);
  };
  ctx.save();
  ctx.rotate(sw);
  // the chain going up into the dark (slack on the warn)
  for (let i = 0; i < 26; i++) {
    const y = -h * 0.92 - i * 12, k = i / 26;
    ctx.globalAlpha = (1 - dying ** 1.4) * (k > 0.6 ? Math.max(0, 1 - (k - 0.6) / 0.4) : 1);
    link(ctx, Math.sin(i * 0.7 + t * 2) * wk * 6 * k, y, Math.PI / 2, 12, 2.4, i % 2 === 0, '#1a0e0a');
  }
  ctx.globalAlpha = 1 - dying ** 1.4;
  // the bell of lead
  const g = ctx.createLinearGradient(-w * 0.5, 0, w * 0.5, 0);
  g.addColorStop(0, LEAD_D);
  g.addColorStop(0.35, LEAD_L);
  g.addColorStop(1, LEAD_D);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-w * 0.16, -h * 0.94);
  ctx.quadraticCurveTo(-w * 0.44, -h * 0.5, -w * 0.5, -h * 0.06);
  ctx.lineTo(w * 0.5, -h * 0.06);
  ctx.quadraticCurveTo(w * 0.44, -h * 0.5, w * 0.16, -h * 0.94);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1e1e24';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.fillStyle = LEAD; // the lip
  ctx.fillRect(-w * 0.52, -h * 0.1, w * 1.04, h * 0.1);
  ctx.fillStyle = IRON_D; // the shackle at the top
  ctx.beginPath();
  ctx.arc(0, -h * 0.94, 6, Math.PI, TAU);
  ctx.lineWidth = 3;
  ctx.strokeStyle = IRON_D;
  ctx.stroke();
  // its weight stamped on its side (marks, not letters), and two dents for eyes catching the aether
  ctx.strokeStyle = 'rgba(30,30,36,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.14, -h * 0.34);
  ctx.lineTo(-w * 0.14, -h * 0.24);
  ctx.moveTo(-w * 0.06, -h * 0.34);
  ctx.lineTo(w * 0.02, -h * 0.24);
  ctx.moveTo(w * 0.08, -h * 0.34);
  ctx.lineTo(w * 0.16, -h * 0.34);
  ctx.lineTo(w * 0.08, -h * 0.24);
  ctx.stroke();
  const e = drop ? 1 : 0.6 + 0.4 * wk;
  ctx.fillStyle = `rgba(${AETHER},${0.7 * e})`;
  circle(ctx, w * 0.1, -h * 0.56, 2.6);
  circle(ctx, w * 0.3, -h * 0.54, 2.2);
  ctx.restore();
  return body;
}

// The Mainspring: the clock's mainspring, a coil of blue steel as big as a house, wound tight for an age, lying on its side
// across the foot of the Spoke, its outer end loose and lifting like a head. On its warn the coil tightens (the turns draw
// in, the steel brightens); then it uncoils at you in a lunge, and winds itself back up
function drawMainspring(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0, lunge = !!m?.charging;
  const cx = -w * 0.08, cy = -h * 0.5, R = h * 0.5 * (1 - wk * 0.06);
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.42, h * 0.5, 0, 0, TAU);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(10,10,14,0.4)';
  ellipse(ctx, cx, 0, w * 0.42, 6);
  softGlow(ctx, cx, cy, R * 1.6, '138,176,224', 0.12 + 0.2 * wk);
  // the coil: a spiral of steel strip, many turns
  const turns = 6.5, spin = live ? t * 0.2 : 0;
  ctx.lineCap = 'round';
  for (const [col, lw] of [[STEEL_D, 9], [STEEL, 6], [`rgba(138,176,224,${0.35 + 0.4 * wk})`, 1.6]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    for (let i = 0; i <= turns * 30; i++) {
      const k = i / (turns * 30), a = k * turns * TAU + spin, r = R * (0.12 + 0.88 * k);
      const x = cx + Math.cos(a) * r * (w * 0.42 / R) * 0.98, y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // the arbor at its heart, a square hole with the aether in it
  ctx.fillStyle = IRON_D;
  ctx.fillRect(cx - 9, cy - 9, 18, 18);
  ctx.fillStyle = `rgba(${AETHER},${0.6 + 0.3 * wk})`;
  ctx.fillRect(cx - 4, cy - 4, 8, 8);
  // the outer end, loose, lifting like a head: out straight in the lunge
  const ex = cx + w * 0.4, ey = cy + R * 0.1;
  const reach = lunge ? w * 0.3 : w * 0.08 + (live ? Math.sin(t * 1.2 + seed) * 4 : 0);
  const lift = lunge ? -0.1 : -0.6 - wk * 0.4;
  ctx.strokeStyle = STEEL_D;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.quadraticCurveTo(ex + reach * 0.6, ey + Math.sin(lift) * 40, ex + reach, ey + Math.sin(lift) * 60);
  ctx.stroke();
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 6;
  ctx.stroke();
  // the hooked end, with two rivet-holes lit like eyes
  const hx = ex + reach, hy = ey + Math.sin(lift) * 60;
  ctx.fillStyle = STEEL_D;
  circle(ctx, hx, hy, 9);
  ctx.fillStyle = `rgba(${AETHER},0.9)`;
  circle(ctx, hx + 2, hy - 3, 2.2);
  circle(ctx, hx - 3, hy + 2, 1.8);
  ctx.restore();
  return body;
}

export const UNDERCROFT_MOB_ART = { sump_slime: drawSumpSlime, wright_echo: drawWrightEcho, loose_pawl: drawLoosePawl, counterweight: drawCounterweight, mainspring: drawMainspring };

// ——— gear for players ———
// The Mainspring Blade: a long blade of blue steel that never quite straightens, a bright edge, a square arbor-guard
function drawSpringBlade(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(138,176,224,0.85)';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = STEEL;
  ctx.beginPath();
  ctx.moveTo(-3.2, -L * 0.22);
  ctx.quadraticCurveTo(-5, -L * 0.6, -1, -L);
  ctx.quadraticCurveTo(3.4, -L * 0.62, 3.4, -L * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = STEEL_L;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(1.6, -L * 0.24);
  ctx.quadraticCurveTo(1.4, -L * 0.6, -0.8, -L * 0.96);
  ctx.stroke();
  ctx.fillStyle = IRON_D; // the arbor-guard
  ctx.fillRect(-6, -L * 0.24, 12, 5);
  ctx.fillStyle = `rgba(${AETHER},0.85)`;
  ctx.fillRect(-1.5, -L * 0.235, 3, 3);
  ctx.fillStyle = '#3a2e24'; // the grip, wound
  ctx.fillRect(-2, -L * 0.2, 4, L * 0.2);
  ctx.fillStyle = STEEL_D;
  circle(ctx, 0, 1, 3);
  ctx.restore();
}
export const UNDERCROFT_SWORDS = { spring_blade: drawSpringBlade };
export const UNDERCROFT_SWORD_LEN = { spring_blade: 66 };

// The Wheelwright's Cap: a close leather cap, a lamp on a brass arm at the brow, a stub of chalk in the band
function drawWrightCap(ctx, w, h) {
  const rx = w * 0.5, top = -h * 0.95, by = -h * 0.5;
  ctx.save();
  ctx.fillStyle = '#6a5038';
  ctx.beginPath();
  ctx.moveTo(-rx, by);
  ctx.quadraticCurveTo(-rx * 1.02, top + h * 0.06, 0, top);
  ctx.quadraticCurveTo(rx * 1.02, top + h * 0.06, rx, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a2a1c';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = '#4a3828'; // the band
  ctx.fillRect(-rx, by - 6, rx * 2, 6);
  ctx.strokeStyle = 'rgba(160,130,96,0.6)'; // stitching
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(0, top + 2);
  ctx.lineTo(0, by - 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#f0ece2'; // the chalk in the band
  ctx.fillRect(-rx * 0.7, by - 8, 3, 8);
  ctx.fillStyle = BRASS_D; // the lamp on its arm at the brow
  ctx.fillRect(rx * 0.2, by - 14, 3, 10);
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.roundRect(rx * 0.12, by - 22, 10, 9, 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,230,180,0.95)';
  circle(ctx, rx * 0.12 + 5, by - 17.5, 2.6);
  ctx.restore();
}
export const UNDERCROFT_HELMETS = { wright_cap: drawWrightCap };

// ——— material icons (centred, about 28 px) ———
function iconSumpGlass(ctx) {
  softGlow(ctx, 0, 0, 14, AETHER, 0.4);
  ctx.fillStyle = '#123038';
  ctx.strokeStyle = '#06161a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.lineTo(-6, -8);
  ctx.lineTo(4, -10);
  ctx.lineTo(11, -1);
  ctx.lineTo(6, 9);
  ctx.lineTo(-5, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  toothBit(ctx, 1, 1, 0.4, 3.5);
  ctx.fillStyle = 'rgba(220,255,250,0.6)';
  ellipse(ctx, -4, -4, 3, 1.4, -0.5);
}
function iconWrightChalk(ctx) {
  ctx.save();
  ctx.rotate(-0.6);
  ctx.fillStyle = '#f0ece2';
  ctx.beginPath();
  ctx.moveTo(-4, 10);
  ctx.lineTo(-4, -6);
  ctx.lineTo(0, -11);
  ctx.lineTo(4, -6);
  ctx.lineTo(4, 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a8a294';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(240,236,226,0.8)'; // a stroke half made
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(6, 4);
  ctx.lineTo(6, 10);
  ctx.stroke();
}
function iconPawlSpring(ctx) {
  ctx.strokeStyle = STEEL_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const k = i / 40, y = 11 - k * 22, x = Math.sin(k * 4 * TAU) * 7;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = STEEL_L;
  ctx.lineWidth = 1;
  ctx.stroke();
}
function iconWeightLead(ctx) {
  ctx.fillStyle = LEAD_D;
  ctx.beginPath();
  ctx.moveTo(-5, -10);
  ctx.quadraticCurveTo(-11, 0, -11, 9);
  ctx.lineTo(11, 9);
  ctx.quadraticCurveTo(11, 0, 5, -10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1e1e24';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,160,170,0.4)';
  ctx.fillRect(-7, -2, 3, 9);
  ctx.strokeStyle = 'rgba(30,30,36,0.9)';
  ctx.beginPath();
  ctx.moveTo(-1, 0);
  ctx.lineTo(-1, 5);
  ctx.moveTo(2, 0);
  ctx.lineTo(5, 5);
  ctx.stroke();
}
export const UNDERCROFT_ICONS = { sump_glass: iconSumpGlass, wright_chalk: iconWrightChalk, pawl_spring: iconPawlSpring, weight_lead: iconWeightLead };
