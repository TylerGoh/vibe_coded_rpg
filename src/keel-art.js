// Docs: docs/places/keel.md, docs/combat/stages.md
// The Citadel's depth pass, C5's art that isn't the room (the Keel's room is src/keel.js): the Keel's mobs (gear louse, chain
// hound, keel warden; the elites are drawn as their base, bigger) and the Rustwyrm, a field boss (KEEL_MOB_ART, called by
// drawMob in src/field.js); the materials' icons (KEEL_ICONS); gear for players (KEEL_SWORDS, KEEL_SWORD_LEN,
// KEEL_HELMETS): the Rustwyrm's Rust Flail and Coif, the keel wardens' visor (the staff and bow are rows in
// src/staff-art.js and src/bow-art.js). The Citadel's register under the city: black iron, rust, old brass and grease, a
// little aether light leaking from below; solemn, no whimsy.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse, clamp } from './util.js';

const RUST = '#9a4a2a', RUST_L = '#c8703e', RUST_D = '#5e2a1a', RUST_E = '#3a1a12';
const IRON = '#4a4656', IRON_D = '#2a2834', IRON_L = '#6e6a7e';
const BRASS = '#f0c470', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const GREASE = '#1a1614';
const AETHER = '150,240,234';
const warnK = (v) => (v === true ? 1 : clamp(+v || 0, 0, 1));

function softGlow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  circle(ctx, x, y, r);
}
// one chain link seen side-on or face-on (turned by `a`), centred, long axis along x
export function link(ctx, x, y, a, len, thick, face, edge) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.strokeStyle = edge;
  ctx.lineWidth = thick + 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, len / 2, face ? len * 0.3 : thick * 0.4, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = face ? RUST_L : RUST;
  ctx.lineWidth = thick;
  ctx.stroke();
  ctx.restore();
}

// A gear louse: a brass mite the size of a dog that lives in the Wheel's teeth and eats the grease off them, a flat
// segmented shell black with grease, six short legs going like a clock, two mandibles shaped like gear teeth. It leaves a
// slick of old grease behind it (`trail`, style `grease`)
function drawGearLouse(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const run = live ? t * 14 + seed * 5 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.42, w * 0.5, h * 0.42, 0, 0, TAU);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(20,16,20,0.3)';
  ellipse(ctx, 0, 0, w * 0.46, 4);
  // the legs, three a side, ticking
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const lx = -w * 0.28 + i * w * 0.26, ph = Math.sin(run + i * 2.1) * 4;
    ctx.moveTo(lx, -h * 0.3);
    ctx.lineTo(lx + 6 + ph, -h * 0.12);
    ctx.lineTo(lx + 2 + ph, 0);
    ctx.moveTo(lx - 2, -h * 0.3);
    ctx.lineTo(lx - 8 - ph, -h * 0.1);
    ctx.lineTo(lx - 4 - ph, 0);
  }
  ctx.stroke();
  // the shell: brass under the grease, in five plates
  const g = ctx.createLinearGradient(0, -h * 0.84, 0, -h * 0.1);
  g.addColorStop(0, '#8a6a3a');
  g.addColorStop(0.5, BRASS_E);
  g.addColorStop(1, '#3a2a1a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.42, w * 0.46, h * 0.38, 0, Math.PI, TAU);
  ctx.lineTo(w * 0.46, -h * 0.3);
  ctx.quadraticCurveTo(0, -h * 0.14, -w * 0.46, -h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2a1e14';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(30,22,16,0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 1; i < 5; i++) {
    const px = -w * 0.46 + (i / 5) * w * 0.92;
    ctx.moveTo(px, -h * 0.78 + Math.abs(px) * 0.25);
    ctx.lineTo(px, -h * 0.24);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(253,227,160,0.35)'; // brass showing through where it's rubbed
  ellipse(ctx, -w * 0.1, -h * 0.66, w * 0.16, h * 0.06);
  ctx.fillStyle = GREASE; // grease dripping off its back end
  for (let i = 0; i < 2; i++) {
    const k = ((t * 0.8 + i * 0.5 + seed) % 1);
    ellipse(ctx, -w * 0.4 - i * 4, -h * 0.26 + k * h * 0.24, 2, 3);
  }
  // the head and mandibles: two gear teeth working
  const bite = live ? Math.abs(Math.sin(t * 6 + seed)) * 0.4 : 0;
  ctx.fillStyle = IRON_D;
  circle(ctx, w * 0.44, -h * 0.34, h * 0.18);
  ctx.fillStyle = BRASS_D;
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(w * 0.54, -h * 0.3);
    ctx.rotate(s * (0.3 + bite));
    ctx.fillRect(0, -2, 10, 4);
    ctx.fillRect(7, -4, 3, 8);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,170,90,0.9)'; // two pin-point eyes
  circle(ctx, w * 0.5, -h * 0.42, 1.6);
  circle(ctx, w * 0.42, -h * 0.44, 1.6);
  ctx.strokeStyle = IRON_L; // feelers
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.46, -h * 0.48);
  ctx.quadraticCurveTo(w * 0.6, -h * 0.9, w * 0.74, -h * 0.76 + Math.sin(t * 4 + seed) * 2);
  ctx.stroke();
  ctx.restore();
  return body;
}

// A chain hound: one of the keel's watchdogs, built of linked chain on an iron frame, a skull of riveted plate with a
// hinged jaw, and a padlock for a heart, its keyhole lit. Still running its rounds of the chain locker; quick and low
function drawChainHound(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const run = live ? t * (m?.walking ? 13 : 3) + seed * 4 : 0;
  const bob = live ? Math.sin(run * 2) * 2 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.55, w * 0.5, h * 0.36, 0, 0, TAU);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(20,16,20,0.3)';
  ellipse(ctx, 0, 0, w * 0.44, 4);
  // legs: iron rods, a paw of plate
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  for (const [lx, ph] of [[-w * 0.3, 0], [-w * 0.18, Math.PI], [w * 0.2, Math.PI * 0.5], [w * 0.32, Math.PI * 1.5]]) {
    const sw = Math.sin(run + ph) * 7;
    ctx.moveTo(lx, -h * 0.48 + bob);
    ctx.lineTo(lx + sw * 0.4, -h * 0.22);
    ctx.lineTo(lx + sw, -2);
  }
  ctx.stroke();
  // the spine: a run of chain links from tail to neck, sagging a little
  const n = 7;
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1), x = -w * 0.46 + k * w * 0.8, y = -h * 0.58 + bob + Math.sin(k * Math.PI) * -4 + Math.sin(run + k * 3) * 1.2;
    link(ctx, x, y, (i % 2 ? 0.1 : -0.1), w * 0.17, 4, i % 2 === 0, RUST_E);
  }
  // the ribs: two iron hoops
  ctx.strokeStyle = IRON;
  ctx.lineWidth = 3;
  for (const rx of [-w * 0.12, w * 0.08]) {
    ctx.beginPath();
    ctx.ellipse(rx, -h * 0.5 + bob, 6, h * 0.2, 0, 0, TAU);
    ctx.stroke();
  }
  // the padlock heart, its keyhole lit
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(-w * 0.05, -h * 0.5 + bob, 12, 11, 2);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-w * 0.05 + 6, -h * 0.5 + bob, 4, Math.PI, TAU);
  ctx.stroke();
  const glow = live ? 0.6 + 0.3 * Math.sin(t * 3 + seed) : 0.2;
  ctx.fillStyle = `rgba(${AETHER},${glow})`;
  circle(ctx, -w * 0.05 + 6, -h * 0.5 + bob + 5, 1.8);
  // the tail: a short length of loose chain
  for (let i = 0; i < 3; i++) link(ctx, -w * 0.52 - i * 7, -h * 0.66 + bob - i * 3 + Math.sin(run + i) * 2, -0.5, 9, 2.4, i % 2 === 0, RUST_E);
  // the head: a riveted plate skull, the jaw hanging open as it runs
  const hx = w * 0.42, hy = -h * 0.66 + bob;
  const jaw = live ? 0.25 + Math.abs(Math.sin(run)) * 0.2 : 0.1;
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.moveTo(hx - 12, hy - 10);
  ctx.lineTo(hx + 16, hy - 6);
  ctx.lineTo(hx + 20, hy + 2);
  ctx.lineTo(hx - 12, hy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.save();
  ctx.translate(hx - 8, hy + 4);
  ctx.rotate(jaw);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(0, 0, 24, 5);
  ctx.fillStyle = '#d8d0c0';
  for (let i = 0; i < 4; i++) ctx.fillRect(6 + i * 5, -2, 2, 3);
  ctx.restore();
  ctx.fillStyle = IRON_L; // rivets
  circle(ctx, hx - 6, hy - 4, 1.4);
  circle(ctx, hx + 8, hy - 3, 1.4);
  ctx.fillStyle = `rgba(${AETHER},${live ? 0.95 : 0.3})`; // one eye, a chink of light
  ctx.fillRect(hx + 4, hy - 4, 6, 2.4);
  ctx.fillStyle = IRON_D; // ears: two bent plates
  ctx.beginPath();
  ctx.moveTo(hx - 10, hy - 9);
  ctx.lineTo(hx - 16, hy - 20);
  ctx.lineTo(hx - 4, hy - 10);
  ctx.fill();
  ctx.restore();
  return body;
}

// A keel warden: one of the hollow's great iron keepers, tall and heavy, a single lamp-slot for a face, a riveted
// bulkhead plate held across its front like a door (`shell`: from the front its plate takes the blows; get round
// behind). On its warn it sets its feet and draws the plate back, then rams forward behind it (m.charging)
function drawKeelWarden(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0, ram = !!m?.charging;
  const step = live && m?.walking ? Math.sin(t * 5 + seed) * 2.5 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.rect(-w * 0.42, -h, w * 0.84, h);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(20,16,20,0.3)';
  ellipse(ctx, 0, 0, w * 0.44, 5);
  // legs: two short iron columns
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-w * 0.28, -h * 0.3 + step, w * 0.2, h * 0.3 - step);
  ctx.fillRect(w * 0.04, -h * 0.3 - step, w * 0.2, h * 0.3 + step);
  // the body: a riveted iron barrel, rust bleeding down from the seams
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.roundRect(-w * 0.34, -h * 0.84, w * 0.62, h * 0.58, 8);
  ctx.fill();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(154,74,42,0.5)';
  for (let i = 0; i < 3; i++) ctx.fillRect(-w * 0.26 + i * w * 0.2, -h * 0.7, 3, h * 0.3 + (i % 2) * 6);
  ctx.fillStyle = IRON_L;
  for (let i = 0; i < 4; i++) {
    circle(ctx, -w * 0.28 + i * w * 0.17, -h * 0.8, 1.6);
    circle(ctx, -w * 0.28 + i * w * 0.17, -h * 0.32, 1.6);
  }
  // the head: a riveted box with one lamp-slot
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.roundRect(-w * 0.18, -h, w * 0.38, h * 0.2, [6, 6, 2, 2]);
  ctx.fill();
  ctx.fillStyle = `rgba(${AETHER},${live ? (wk || ram ? 1 : 0.8) : 0.2})`;
  ctx.fillRect(-w * 0.06, -h * 0.92, w * 0.22, 3);
  if (live) softGlow(ctx, w * 0.06, -h * 0.91, 12, AETHER, 0.2 + wk * 0.3);
  // the bulkhead plate, held across its front: drawn back on the wind-up, rammed out on the strike
  const px = w * 0.3 + (ram ? 10 : -wk * 8);
  ctx.save();
  ctx.translate(px, -h * 0.5);
  ctx.fillStyle = '#5a5666';
  ctx.beginPath();
  ctx.roundRect(-6, -h * 0.42, 16, h * 0.82, 4);
  ctx.fill();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.fillStyle = IRON_L;
  for (let i = 0; i < 6; i++) circle(ctx, 2, -h * 0.36 + i * h * 0.14, 1.6);
  ctx.fillStyle = 'rgba(154,74,42,0.6)'; // rust streaks down it
  ctx.fillRect(-2, -h * 0.2, 2, h * 0.3);
  ctx.fillRect(5, -h * 0.05, 2, h * 0.32);
  ctx.fillStyle = 'rgba(232,196,64,0.8)'; // the old hazard stripe painted across its middle, worn
  ctx.fillRect(-6, -3, 16, 5);
  ctx.restore();
  // the arm holding it
  ctx.fillStyle = IRON;
  ctx.fillRect(w * 0.1, -h * 0.62, px - w * 0.1 - 4, 8);
  if (dying > 0.05) {
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - dying)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, -h * 0.6);
    ctx.lineTo(w * 0.3, -h * 0.4);
    ctx.stroke();
  }
  ctx.restore();
  return body;
}

// The Rustwyrm: a serpent of linked chain as thick as a slime, rusted red, hanging down out of the dark between the Wheel's
// teeth; the chain goes up out of sight. Its head is a great iron hook, plated like a skull, two aether lamps in it for
// eyes. It sways; on its warn it draws its head back up into the dark (m.warn), then drops (m.charging), jaws open
function drawRustwyrm(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0, drop = !!m?.charging;
  const sway = live ? Math.sin(t * 0.9 + seed) : 0;
  const hx = w * 0.18 + sway * 8, hy = -h * 0.5 - wk * 26;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(hx, hy, w * 0.36, h * 0.48, 0, 0, TAU);
  };
  ctx.save();
  // the chain going up into the dark: a long curve of links, fading
  const top = -h * 0.5 - 520;
  const N = 34;
  for (let i = N; i >= 0; i--) {
    const k = i / N; // 0 at the head, 1 at the top
    const x = hx - w * 0.36 * Math.sin(k * 3.1 + 0.4) * (1 - k * 0.6) + Math.sin(t * 0.9 + seed + k * 3) * 10 * k;
    const y = hy - 8 + (top - hy) * k;
    const nx = hx - w * 0.36 * Math.sin((k + 1 / N) * 3.1 + 0.4) * (1 - (k + 1 / N) * 0.6), ny = hy - 8 + (top - hy) * (k + 1 / N);
    const a = Math.atan2(ny - y, nx - x);
    ctx.globalAlpha = (1 - dying ** 1.4) * (k > 0.6 ? Math.max(0, 1 - (k - 0.6) / 0.4) : 1);
    link(ctx, x, y, a, 24 - k * 6, 6 - k * 2, i % 2 === 0, RUST_E);
  }
  ctx.globalAlpha = 1 - dying ** 1.4;
  // rust flaking off it as it moves
  if (live) {
    ctx.fillStyle = 'rgba(200,112,62,0.6)';
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.6 + i * 0.25 + seed) % 1;
      ctx.fillRect(hx - 30 + i * 18 + Math.sin(i * 3) * 10, hy - 60 + k * 120, 2, 2);
    }
  }
  // the head: a great hook, plated like a skull
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(drop ? 0.5 : -0.1 - wk * 0.3);
  ctx.fillStyle = RUST_D;
  ctx.beginPath();
  ctx.moveTo(-26, -20);
  ctx.quadraticCurveTo(10, -36, 40, -12);
  ctx.quadraticCurveTo(54, 4, 44, 22);
  ctx.quadraticCurveTo(36, 34, 20, 30);
  ctx.lineTo(28, 18);
  ctx.quadraticCurveTo(36, 8, 26, 0);
  ctx.quadraticCurveTo(4, -6, -20, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = RUST_E;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,112,62,0.5)'; // plates, rust-bright on their edges
  for (let i = 0; i < 4; i++) ellipse(ctx, -14 + i * 14, -16 + i * 2, 6, 3, 0.3);
  ctx.fillStyle = IRON_L;
  for (let i = 0; i < 5; i++) circle(ctx, -18 + i * 12, -10 + Math.sin(i) * 3, 1.6);
  // the jaw: a second hook under it, open when it drops
  const jaw = drop ? 0.7 : 0.15 + wk * 0.3;
  ctx.save();
  ctx.translate(-14, 10);
  ctx.rotate(jaw);
  ctx.fillStyle = RUST;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(24, 4, 38, 18);
  ctx.lineTo(30, 20);
  ctx.quadraticCurveTo(18, 12, 0, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = RUST_E;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
  // the eyes: two aether lamps behind grilles
  const ek = live ? 0.75 + 0.25 * Math.sin(t * 2 + seed) : 0.2;
  for (const [ex, ey] of [[6, -14], [20, -10]]) {
    softGlow(ctx, ex, ey, 14, AETHER, 0.35 * ek * (1 + wk));
    ctx.fillStyle = `rgba(230,255,252,${ek})`;
    circle(ctx, ex, ey, 4);
    ctx.strokeStyle = IRON_D;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ex - 4, ey);
    ctx.lineTo(ex + 4, ey);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
  return body;
}

export const KEEL_MOB_ART = { gear_louse: drawGearLouse, chain_hound: drawChainHound, keel_warden: drawKeelWarden, rustwyrm: drawRustwyrm };

// ——— gear for players ———
// The Rust Flail: an iron haft, three links of the Rustwyrm's chain hanging off it, its hook at the end
function drawRustFlail(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(150,240,234,0.8)';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-2.2, -L * 0.6, 4.4, L * 0.62);
  ctx.fillStyle = RUST_D;
  ctx.fillRect(-3, -L * 0.24, 6, 3);
  ctx.shadowBlur = 0;
  for (let i = 0; i < 3; i++) link(ctx, 0, -L * 0.64 - i * 7, Math.PI / 2, 9, 2.4, i % 2 === 0, RUST_E);
  ctx.fillStyle = RUST_D; // the hook
  ctx.beginPath();
  ctx.moveTo(-2, -L * 0.84);
  ctx.quadraticCurveTo(10, -L * 0.98, 8, -L * 0.86);
  ctx.quadraticCurveTo(6, -L * 0.8, 1, -L * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = RUST_E;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = `rgba(${AETHER},0.9)`;
  circle(ctx, 4, -L * 0.88, 1.4);
  ctx.fillStyle = IRON;
  circle(ctx, 0, 2, 3);
  ctx.restore();
}
export const KEEL_SWORDS = { rust_flail: drawRustFlail };
export const KEEL_SWORD_LEN = { rust_flail: 66 };

// The Rustwyrm Coif: a hood of fine rust-red chain, hanging to the shoulders
function drawRustwyrmCoif(ctx, w, h) {
  const rx = w * 0.52, top = -h * 0.98, by = -h * 0.36;
  ctx.save();
  ctx.fillStyle = RUST;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.quadraticCurveTo(-rx * 1.04, top + h * 0.1, 0, top);
  ctx.quadraticCurveTo(rx * 1.04, top + h * 0.1, rx, by + 6);
  ctx.lineTo(rx * 0.7, by);
  ctx.quadraticCurveTo(0, by - h * 0.12, -rx * 0.7, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = RUST_E;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,112,62,0.6)'; // the mail's rows
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 5; i++) {
    const y = top + ((by - top) * i) / 5;
    ctx.moveTo(-rx * 0.9, y + 4);
    ctx.quadraticCurveTo(0, y - 4, rx * 0.9, y + 4);
  }
  ctx.stroke();
  ctx.restore();
}
// The Keel Warden's Visor: a riveted iron box helm with one narrow lamp-slot
function drawWardenVisor(ctx, w, h) {
  const rx = w * 0.46, top = -h * 0.96, by = -h * 0.4;
  ctx.save();
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.roundRect(-rx, top, rx * 2, by - top, [10, 10, 3, 3]);
  ctx.fill();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-rx * 0.6, top + (by - top) * 0.5, rx * 1.4, 4);
  ctx.fillStyle = `rgba(${AETHER},0.7)`;
  ctx.fillRect(-rx * 0.2, top + (by - top) * 0.5 + 1, rx * 0.8, 2);
  ctx.fillStyle = IRON_L;
  for (let i = 0; i < 4; i++) circle(ctx, -rx * 0.75 + i * rx * 0.5, top + 5, 1.4);
  ctx.fillStyle = 'rgba(154,74,42,0.6)';
  ctx.fillRect(rx * 0.5, top + 8, 2, (by - top) * 0.5);
  ctx.restore();
}
export const KEEL_HELMETS = { rustwyrm_coif: drawRustwyrmCoif, warden_visor: drawWardenVisor };

// ——— material icons (centred, about 28 px) ———
function iconLousePlate(ctx) {
  ctx.fillStyle = BRASS_E;
  ctx.strokeStyle = '#2a1e14';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 2, 12, 8, 0, Math.PI, TAU);
  ctx.quadraticCurveTo(0, 6, -12, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = GREASE;
  ellipse(ctx, 4, -2, 4, 2);
  ctx.fillStyle = 'rgba(253,227,160,0.6)';
  ellipse(ctx, -4, -3, 3, 1.4);
}
function iconHoundLink(ctx) {
  link(ctx, 0, 0, -0.6, 22, 4, true, RUST_E);
}
function iconKeelRivet(ctx) {
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-3, -2, 6, 13);
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.ellipse(0, -3, 10, 6, 0, Math.PI, TAU);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(154,74,42,0.7)';
  ctx.fillRect(-2, 2, 4, 6);
}
function iconWyrmLink(ctx) {
  link(ctx, -3, 3, -0.9, 20, 5, true, RUST_E);
  ctx.fillStyle = 'rgba(200,112,62,0.8)';
  for (const [x, y] of [[6, -8], [9, -2], [3, -11]]) ctx.fillRect(x, y, 2.4, 2.4);
}
export const KEEL_ICONS = { louse_plate: iconLousePlate, hound_link: iconHoundLink, keel_rivet: iconKeelRivet, wyrm_link: iconWyrmLink };
