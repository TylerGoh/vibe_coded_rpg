// Docs: docs/places/engine.md, docs/combat/stages.md
// The Citadel's depth pass, C3's art that isn't a room (the Engine Halls' room is src/engine.js): the halls' mobs (stoker
// automaton, arc jelly, governor ball) and the Stormcoil, a field boss (ENGINE_MOB_ART, called by drawMob in src/field.js);
// their materials' icons (ENGINE_ICONS); gear for players (ENGINE_SWORDS, ENGINE_SWORD_LEN, ENGINE_HELMETS): Number Nine's
// Stoker's Slice-Bar and Goggles, the Stormcoil's Coil Lance and Helm (the staffs and bows are rows in src/staff-art.js and
// src/bow-art.js); and Number Nine's look (the 'stoker' accessory: drawStokerDress, through src/slime.js). The Citadel's
// register: iron, brass, copper, aether-blue fire; solemn, no whimsy.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse, clamp } from './util.js';

const BRASS = '#f0c470', BRASS_L = '#fde3a0', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const IRON = '#4a4656', IRON_D = '#2a2834', IRON_L = '#6e6a7e';
const COPPER = '#c87a3a', COPPER_L = '#e8a870', COPPER_D = '#7a4422';
const AETHER = '150,240,234';
const warnK = (v) => (v === true ? 1 : clamp(+v || 0, 0, 1));

// a jagged arc of light between two points (seeded by t so it flickers)
function arc(ctx, x0, y0, x1, y1, t, a = 0.9, lw = 2) {
  ctx.strokeStyle = `rgba(${AETHER},${a})`;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  const n = 5;
  for (let i = 1; i < n; i++) {
    const k = i / n, j = Math.sin(t * 37 + i * 12.9) * 6;
    ctx.lineTo(x0 + (x1 - x0) * k + j * 0.5, y0 + (y1 - y0) * k + j);
  }
  ctx.lineTo(x1, y1);
  ctx.stroke();
}
function blueGlow(ctx, x, y, r, a) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${AETHER},${a})`);
  g.addColorStop(1, `rgba(${AETHER},0)`);
  ctx.fillStyle = g;
  circle(ctx, x, y, r);
}

// A stoker automaton: a squat iron fireman on short legs, a furnace door in its chest glowing blue through the grille, a
// shovel for one arm (forward) and a riveted claw for the other, a little funnel on its head puffing. On its warn it digs
// the shovel into the coke on its back; then it throws (the `cinder` lob)
function drawStokerAutomaton(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0;
  const bw = w * 0.42, top = -h * 0.78;
  const step = live ? Math.sin(t * 6 + seed * 3) : 0;
  const body = () => {
    ctx.beginPath();
    ctx.rect(-bw, top, bw * 2, -top);
  };
  ctx.save();
  ctx.fillStyle = IRON_D; // the legs
  for (const [lx, k] of [[-bw * 0.45, 1], [bw * 0.35, -1]]) {
    ctx.beginPath();
    ctx.roundRect(lx - 7, -16 - Math.max(0, step * k) * 3, 14, 16, 3);
    ctx.fill();
  }
  const g = ctx.createLinearGradient(-bw, 0, bw, 0); // the body, a boiler
  g.addColorStop(0, IRON_D);
  g.addColorStop(0.5, IRON_L);
  g.addColorStop(1, IRON);
  ctx.fillStyle = g;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-bw, top + 10, bw * 2, -top - 24, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  for (const y of [top + 18, -22]) for (let i = -2; i <= 2; i++) circle(ctx, i * bw * 0.4, y, 1.8);
  // the furnace door in its chest, the blue fire through its grille
  const fk = live ? 0.6 + 0.4 * Math.sin(t * 7 + seed) : 0.2;
  const fx = bw * 0.12, fy = top + 40;
  blueGlow(ctx, fx, fy, 26, 0.35 * fk + 0.2 * wk);
  ctx.fillStyle = '#16202a';
  ctx.beginPath();
  ctx.roundRect(fx - 13, fy - 11, 26, 22, 4);
  ctx.fill();
  ctx.fillStyle = `rgba(${AETHER},${0.5 + 0.4 * fk})`;
  ctx.beginPath();
  ctx.roundRect(fx - 10, fy - 2, 20, 11, 3);
  ctx.fill();
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -1; i <= 1; i++) {
    ctx.moveTo(fx + i * 6, fy - 10);
    ctx.lineTo(fx + i * 6, fy + 10);
  }
  ctx.stroke();
  // the funnel on its head, puffing
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-bw * 0.4 - 5, top - 2, 10, 14);
  ctx.fillRect(-bw * 0.4 - 7, top - 4, 14, 4);
  if (live) {
    const k = (t * 0.8 + seed) % 1;
    ctx.fillStyle = `rgba(200,210,220,${0.4 * (1 - k)})`;
    circle(ctx, -bw * 0.4 + k * 6, top - 8 - k * 20, 4 + k * 6);
  }
  // two lamp eyes
  ctx.fillStyle = wk ? '#ff7a5a' : `rgba(${AETHER},0.95)`;
  circle(ctx, bw * 0.3, top + 20, 3);
  circle(ctx, bw * 0.62, top + 20, 2.6);
  // the shovel arm (forward): dug back on the warn, swung up to throw
  const sw = wk ? -1.2 * wk : live ? Math.sin(t * 2 + seed) * 0.15 : 0.4;
  ctx.save();
  ctx.translate(bw - 2, top + 34);
  ctx.rotate(0.5 + sw);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(28, 0);
  ctx.stroke();
  ctx.fillStyle = IRON_L;
  ctx.beginPath();
  ctx.moveTo(26, -8);
  ctx.lineTo(42, -6);
  ctx.lineTo(42, 8);
  ctx.lineTo(26, 8);
  ctx.closePath();
  ctx.fill();
  if (wk > 0.3) { // a scoop of the blue coke on it
    ctx.fillStyle = '#6ad8d0';
    ellipse(ctx, 34, -8, 7, 4);
  }
  ctx.restore();
  // the coke heap in a hopper on its back
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-bw - 8, top + 24, 12, 28);
  ctx.fillStyle = '#5a6a74';
  for (let i = 0; i < 4; i++) circle(ctx, -bw - 2 + (i % 2) * 4, top + 24 - i * 2, 3);
  if (dying > 0.05) {
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - dying)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-bw * 0.6, top + 20);
    ctx.lineTo(bw * 0.2, top + 50);
    ctx.stroke();
  }
  ctx.restore();
  return body;
}

// An arc jelly: a spark of loose aether gone soft and round, a pale blue bell with a bright knot inside, filaments trailing
// under it and little arcs jumping between them. On its warn the filaments stiffen and the knot blazes; then it throws an
// arc along the grating (the `arc` beam)
function drawArcJelly(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0, firing = !!m?.charging;
  const cy = -h * 0.62 + (live ? Math.sin(t * 1.5 + seed * 4) * 4 : 0);
  const rx = w * 0.46, ry = h * 0.32;
  const pulse = live ? 1 + Math.sin(t * 4 + seed) * 0.06 : 1 - dying * 0.4;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, rx, ry + 6, 0, 0, TAU);
  };
  ctx.save();
  ctx.globalAlpha *= live ? 1 : 1 - dying * 0.7;
  blueGlow(ctx, 0, cy, rx * 2, 0.25 + 0.3 * wk + (firing ? 0.3 : 0));
  // the filaments, trailing under it (stiff on the warn)
  ctx.strokeStyle = `rgba(${AETHER},0.6)`;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    const x0 = (i - 2) * rx * 0.36, sway = live ? Math.sin(t * 2.5 + i + seed) * (1 - wk) * 6 : 0;
    ctx.beginPath();
    ctx.moveTo(x0, cy + ry * 0.6);
    ctx.quadraticCurveTo(x0 + sway, cy + ry + 10, x0 - sway * 0.6, cy + ry + 22 + wk * 4);
    ctx.stroke();
  }
  if (live && (wk > 0.2 || Math.sin(t * 5 + seed * 9) > 0.8)) arc(ctx, -rx * 0.6, cy + ry + 14, rx * 0.5, cy + ry + 18, t + seed, 0.8, 1.4);
  // the bell
  ctx.save();
  ctx.translate(0, cy);
  ctx.scale(pulse, 1 / pulse);
  const g = ctx.createRadialGradient(-rx * 0.2, -ry * 0.4, 2, 0, 0, rx);
  g.addColorStop(0, 'rgba(236,255,252,0.9)');
  g.addColorStop(0.6, 'rgba(120,220,220,0.6)');
  g.addColorStop(1, 'rgba(60,140,160,0.55)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-rx, ry * 0.5);
  ctx.bezierCurveTo(-rx, -ry * 1.3, rx, -ry * 1.3, rx, ry * 0.5);
  ctx.quadraticCurveTo(rx * 0.5, ry * 0.3, 0, ry * 0.6);
  ctx.quadraticCurveTo(-rx * 0.5, ry * 0.3, -rx, ry * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,110,130,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  // the bright knot inside
  const kk = 0.6 + 0.4 * (live ? Math.sin(t * 9 + seed) : 0) + wk * 0.4;
  ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.6 + 0.3 * kk)})`;
  circle(ctx, 0, cy - 2, 4 + kk * 2);
  // eyes
  ctx.fillStyle = 'rgba(20,50,64,0.85)';
  circle(ctx, rx * 0.22, cy + ry * 0.1, 2);
  circle(ctx, rx * 0.5, cy + ry * 0.1, 1.7);
  ctx.restore();
  return body;
}

// A governor ball: an engine's flyweight governor come off its spindle, two heavy brass balls on a bent arm round a collar,
// bounding along the deck. On its warn it crouches its arm in; then it leaps and comes down with a clang (the stomp)
function drawGovernorBall(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0, air = !!m?.charging;
  const spin = live ? t * 5 + seed : seed;
  const spread = air ? 1.2 : 1 - wk * 0.4;
  const cx = 0, cy = -h * 0.5;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, w * 0.5, h * 0.5, 0, 0, TAU);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(30,20,40,0.2)';
  ellipse(ctx, 0, 0, w * 0.4, 4);
  // the spindle collar in the middle
  ctx.fillStyle = BRASS_E;
  ctx.beginPath();
  ctx.roundRect(cx - 7, cy - h * 0.38, 14, h * 0.76, 5);
  ctx.fill();
  ctx.fillStyle = BRASS_D;
  ellipse(ctx, cx, cy - h * 0.38, 10, 4);
  ellipse(ctx, cx, cy + h * 0.2, 10, 4);
  // the two balls on their arms, turning round the spindle
  const balls = [0, Math.PI].map((ph) => {
    const a = spin + ph, d = w * 0.36 * spread;
    return { x: cx + Math.cos(a) * d, z: Math.sin(a), y: cy + h * 0.04 - (1 - wk) * 2 };
  }).sort((p, q) => p.z - q.z);
  for (const b of balls) {
    ctx.strokeStyle = BRASS_E;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.32);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    const r = h * 0.24 * (1 + b.z * 0.08);
    const g = ctx.createRadialGradient(b.x - r * 0.35, b.y - r * 0.35, 1, b.x, b.y, r);
    g.addColorStop(0, BRASS_L);
    g.addColorStop(0.6, BRASS);
    g.addColorStop(1, BRASS_E);
    ctx.fillStyle = g;
    circle(ctx, b.x, b.y, r);
    ctx.strokeStyle = BRASS_E;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, TAU);
    ctx.stroke();
  }
  // a single lamp eye on the collar
  ctx.fillStyle = wk || air ? '#ff7a5a' : `rgba(${AETHER},0.9)`;
  circle(ctx, cx + 3, cy - h * 0.14, 3);
  if (dying > 0.05) {
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - dying)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, cy);
    ctx.lineTo(w * 0.3, cy - 10);
    ctx.stroke();
  }
  ctx.restore();
  return body;
}

// The Stormcoil: one of the great aether coils, come loose of its housing: a tall drum of copper windings round a glass core
// burning blue, brass end-caps, torn cables hanging off it up into the dark, arcs jumping off its windings to the air. Its
// "face" is the core's bright knot and two cracked gauge-lenses on the upper cap. On its warn the windings glow and the arcs
// multiply; firing, a great arc goes down from its foot (the `arc` beam along the deck)
function drawStormcoil(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0, firing = !!m?.charging;
  const cw = w * 0.36, top = -h * 0.92, bot = -h * 0.1;
  const sway = live ? Math.sin(t * 0.9 + seed) * 0.06 : 0.2 * dying;
  const body = () => {
    ctx.beginPath();
    ctx.rect(-cw - 8, top, cw * 2 + 16, bot - top);
  };
  ctx.save();
  ctx.rotate(sway);
  // the torn cables, up into the dark
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 4;
  for (const [x, k] of [[-cw * 0.6, -1], [cw * 0.1, 0.4], [cw * 0.7, 1]]) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.quadraticCurveTo(x + k * 20, top - 60, x + k * 10, top - 200);
    ctx.stroke();
  }
  blueGlow(ctx, 0, (top + bot) / 2, cw * 2.6, 0.25 + 0.35 * wk + (firing ? 0.3 : 0));
  // the glass core
  const core = live ? 0.65 + 0.35 * Math.sin(t * 6 + seed) : 0.2;
  const cg = ctx.createLinearGradient(-cw * 0.6, 0, cw * 0.6, 0);
  cg.addColorStop(0, `rgba(60,140,160,${0.7})`);
  cg.addColorStop(0.5, `rgba(220,255,252,${0.6 + 0.4 * core})`);
  cg.addColorStop(1, `rgba(60,140,160,0.7)`);
  ctx.fillStyle = cg;
  ctx.fillRect(-cw * 0.6, top + 18, cw * 1.2, bot - top - 36);
  // the windings, copper, over the core
  for (let y = top + 22; y < bot - 18; y += 7) {
    const hot = wk > 0 && Math.sin(y * 0.3 + t * 12) > 0;
    ctx.fillStyle = hot ? COPPER_L : (y / 7) % 2 < 1 ? COPPER : COPPER_D;
    ctx.beginPath();
    ctx.roundRect(-cw, y, cw * 2, 5, 2.5);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.4 * core})`; // the core showing through the gap in the windings
  ctx.fillRect(-cw * 0.15, top + 20, cw * 0.3, bot - top - 40);
  // the end caps
  for (const [y, s] of [[top, 1], [bot, -1]]) {
    ctx.fillStyle = BRASS_D;
    ctx.strokeStyle = BRASS_E;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-cw - 8, y - (s > 0 ? 0 : 18), cw * 2 + 16, 18, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = BRASS_E;
    for (let i = -2; i <= 2; i++) circle(ctx, i * cw * 0.45, y + (s > 0 ? 9 : -9), 2);
  }
  // two cracked gauge-lenses on the upper cap: its eyes
  for (const ex of [cw * 0.2, cw * 0.62]) {
    ctx.fillStyle = '#efe4c8';
    circle(ctx, ex, top + 9, 6);
    ctx.fillStyle = wk || firing ? '#ff7a5a' : `rgba(${AETHER},0.9)`;
    circle(ctx, ex + 1, top + 9, 3);
    ctx.strokeStyle = BRASS_E;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ex, top + 9, 6, 0, TAU);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(30,20,20,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cw * 0.58, top + 4);
  ctx.lineTo(cw * 0.66, top + 13);
  ctx.stroke();
  // arcs jumping off it (more on the warn), and down from its foot when it fires
  if (live) {
    const n = 2 + Math.round(wk * 4);
    for (let i = 0; i < n; i++) {
      const y = top + 30 + ((i * 47 + Math.floor(t * 8) * 13) % Math.max(1, bot - top - 60));
      const s = i % 2 ? 1 : -1;
      arc(ctx, s * cw, y, s * (cw + 24 + (i % 3) * 10), y - 18 + (i % 2) * 30, t + i, 0.85, 1.6);
    }
    if (firing) arc(ctx, 0, bot, 6, -2, t * 2, 1, 3);
  }
  if (dying > 0.05) {
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - dying)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-cw, top + 40);
    ctx.lineTo(cw, bot - 40);
    ctx.stroke();
  }
  ctx.restore();
  return body;
}

export const ENGINE_MOB_ART = { stoker_automaton: drawStokerAutomaton, arc_jelly: drawArcJelly, governor_ball: drawGovernorBall, stormcoil: drawStormcoil };

// ——— gear for players ———
// The Stoker's Slice-Bar: a long iron fire-bar, its end flattened and ground sharp, a wrapped grip and a ring at the pommel
function drawSliceBar(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = `rgba(${AETHER},0.85)`;
    ctx.shadowBlur = 10;
  }
  const g = ctx.createLinearGradient(-3, 0, 3, 0);
  g.addColorStop(0, IRON_D);
  g.addColorStop(0.5, IRON_L);
  g.addColorStop(1, IRON);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-2.6, -L * 0.18);
  ctx.lineTo(-2.6, -L * 0.8);
  ctx.lineTo(-5, -L * 0.92);
  ctx.lineTo(0, -L);
  ctx.lineTo(5, -L * 0.92);
  ctx.lineTo(2.6, -L * 0.8);
  ctx.lineTo(2.6, -L * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = `rgba(${AETHER},0.55)`; // the blue heat still in its tip
  ctx.beginPath();
  ctx.moveTo(-4, -L * 0.9);
  ctx.lineTo(0, -L * 0.99);
  ctx.lineTo(4, -L * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(-6, -L * 0.19, 12, 3);
  ctx.fillStyle = '#5a3a2a';
  ctx.fillRect(-2.2, -L * 0.17, 4.4, L * 0.15);
  ctx.strokeStyle = IRON_L;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 3, 3.4, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
// The Coil Lance: a long spike of copper core, still wound with wire, a blue arc crawling up it
function drawCoilLance(ctx, L, glow, t = 0) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = `rgba(${AETHER},0.9)`;
    ctx.shadowBlur = 14;
  }
  ctx.fillStyle = 'rgba(200,250,246,0.85)';
  ctx.beginPath();
  ctx.moveTo(-3.4, -L * 0.2);
  ctx.lineTo(0, -L);
  ctx.lineTo(3.4, -L * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  for (let y = -L * 0.24; y > -L * 0.8; y -= 4) { // the windings
    const k = (-y - L * 0.2) / (L * 0.8);
    ctx.fillStyle = Math.round(-y / 4) % 2 ? COPPER : COPPER_D;
    ctx.fillRect(-3.4 * (1 - k * 0.9) - 0.6, y - 2, 6.8 * (1 - k * 0.9) + 1.2, 2.4);
  }
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.ellipse(0, -L * 0.2, 8, 3.2, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-2.2, -L * 0.18, 4.4, L * 0.17);
  ctx.fillStyle = COPPER;
  circle(ctx, 0, 1, 3);
  ctx.restore();
}
export const ENGINE_SWORDS = { slice_bar: drawSliceBar, coil_lance: drawCoilLance };
export const ENGINE_SWORD_LEN = { slice_bar: 64, coil_lance: 66 };

// Stoker's Goggles: a leather cap, two round goggles of smoked aether-glass pushed up on the brow
function drawStokerGoggles(ctx, w, h) {
  const by = -h * 0.7, rx = w * 0.46;
  ctx.fillStyle = '#5a3a2a';
  ctx.strokeStyle = '#2e1e14';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.86, by + 6);
  ctx.bezierCurveTo(-rx * 0.9, by - h * 0.32, rx * 0.9, by - h * 0.32, rx * 0.86, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3a2a20';
  ctx.fillRect(-rx * 0.9, by - 1, rx * 1.8, 5);
  for (const gx of [rx * 0.12, rx * 0.6]) {
    ctx.fillStyle = BRASS_D;
    circle(ctx, gx, by, 7.5);
    ctx.fillStyle = 'rgba(40,90,100,0.85)';
    circle(ctx, gx, by, 5.4);
    ctx.fillStyle = 'rgba(200,255,250,0.5)';
    circle(ctx, gx - 1.8, by - 1.8, 1.6);
  }
}
// The Stormcoil Helm: a dome of copper windings over a glass cap, two pins on the crown with a little arc between them
function drawCoilHelm(ctx, w, h) {
  const by = -h * 0.62, rx = w * 0.48;
  ctx.fillStyle = 'rgba(200,250,246,0.6)';
  ctx.beginPath();
  ctx.ellipse(0, by, rx * 0.86, h * 0.36, 0, Math.PI, TAU);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const yy = by - i * h * 0.06;
    const ww = rx * 0.86 * Math.sqrt(Math.max(0, 1 - ((i * 0.06) / 0.36) ** 2));
    ctx.fillStyle = i % 2 ? COPPER : COPPER_D;
    ctx.beginPath();
    ctx.roundRect(-ww, yy - 3, ww * 2, 3.4, 1.5);
    ctx.fill();
  }
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(-rx * 0.9, by - 1, rx * 1.8, 6, 3);
  ctx.fill();
  ctx.fillStyle = BRASS_E;
  for (const px of [-6, 6]) ctx.fillRect(px - 1.2, by - h * 0.44, 2.4, 9);
  arc(ctx, -6, by - h * 0.44, 6, by - h * 0.44, 0, 0.9, 1.4);
}
export const ENGINE_HELMETS = { stoker_goggles: drawStokerGoggles, coil_helm: drawCoilHelm };

// ——— material icons (centred, about 28 px) ———
function iconAetherCoke(ctx) {
  ctx.fillStyle = '#5a6a74';
  ctx.strokeStyle = '#2a3238';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.lineTo(-6, -8);
  ctx.lineTo(4, -10);
  ctx.lineTo(11, -2);
  ctx.lineTo(8, 9);
  ctx.lineTo(-4, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(${AETHER},0.7)`;
  for (const [x, y] of [[-3, -2], [4, 3], [1, -6]]) circle(ctx, x, y, 1.8);
}
function iconArcFilament(ctx) {
  ctx.strokeStyle = 'rgba(200,250,246,0.95)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-11, 10);
  ctx.quadraticCurveTo(-2, 2, -4, -4);
  ctx.quadraticCurveTo(-6, -10, 10, -11);
  ctx.stroke();
  arc(ctx, -8, 6, 8, -8, 1.3, 0.9, 1.2);
}
function iconGovernorWeight(ctx) {
  const g = ctx.createRadialGradient(-4, -4, 1, 0, 0, 11);
  g.addColorStop(0, BRASS_L);
  g.addColorStop(0.6, BRASS);
  g.addColorStop(1, BRASS_E);
  ctx.fillStyle = g;
  circle(ctx, 0, 2, 10);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(-6, -14);
  ctx.stroke();
}
function iconCoilWinding(ctx) {
  ctx.strokeStyle = COPPER;
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(0, -6 + i * 4, 10, 4, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.strokeStyle = COPPER_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(10, 6);
  ctx.lineTo(13, 12);
  ctx.stroke();
}
export const ENGINE_ICONS = { aether_coke: iconAetherCoke, arc_filament: iconArcFilament, governor_weight: iconGovernorWeight, coil_winding: iconCoilWinding };

// ——— Number Nine (the 'stoker' accessory: src/slime.js) ———
// The last stoker automaton on shift: an iron-grey slime-shape gone sooty, a big painted 9 on its front, a furnace grille
// in its belly with the blue fire behind it, a peaked cap with a lamp, and a shovel over its shoulder it leans on
export function drawStokerDress(ctx, w, h, fx, t) {
  ctx.save();
  ctx.fillStyle = 'rgba(30,26,34,0.35)'; // soot down its front
  ctx.beginPath();
  ctx.ellipse(fx * 0.2, -h * 0.4, w * 0.3, h * 0.22, 0, 0, TAU);
  ctx.fill();
  // the furnace grille in its belly
  const gx = fx * 0.3, gy = -h * 0.26;
  blueGlow(ctx, gx, gy, 18, 0.3 + 0.12 * Math.sin(t * 5));
  ctx.fillStyle = '#16202a';
  ctx.beginPath();
  ctx.roundRect(gx - 10, gy - 7, 20, 14, 3);
  ctx.fill();
  ctx.fillStyle = `rgba(${AETHER},${0.55 + 0.25 * Math.sin(t * 6)})`;
  ctx.fillRect(gx - 8, gy, 16, 5);
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = -1; i <= 1; i++) {
    ctx.moveTo(gx + i * 5, gy - 6);
    ctx.lineTo(gx + i * 5, gy + 6);
  }
  ctx.stroke();
  // the painted 9, chipped
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(240,226,190,0.85)';
  ctx.fillText('9', -fx * 0.35, -h * 0.44);
  // the peaked cap, and the lamp on its front
  ctx.fillStyle = '#2e2a32';
  ctx.beginPath();
  ctx.moveTo(-w * 0.36, -h * 0.84);
  ctx.quadraticCurveTo(0, -h * 1.06, w * 0.36, -h * 0.84);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e1a20';
  ctx.beginPath();
  ctx.ellipse(fx * 0.9, -h * 0.84, w * 0.22, 3.4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = BRASS_D;
  circle(ctx, fx * 0.3, -h * 0.9, 4);
  ctx.fillStyle = `rgba(${AETHER},0.9)`;
  circle(ctx, fx * 0.3, -h * 0.9, 2.4);
  // the shovel over its far shoulder, leaned on
  ctx.save();
  ctx.translate(-fx * 0.9, -h * 0.5);
  ctx.rotate(-0.35 + Math.sin(t * 0.7) * 0.03);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.lineTo(0, -26);
  ctx.stroke();
  ctx.fillStyle = IRON_L;
  ctx.beginPath();
  ctx.moveTo(-7, -26);
  ctx.lineTo(7, -26);
  ctx.lineTo(6, -42);
  ctx.lineTo(-6, -42);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
export { arc as drawArc, blueGlow };
