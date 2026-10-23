// Docs: docs/combat/bosses.md, docs/places/queensbridge.md
// The Queen's Bridge's boss den (The Seam), its way in at the Crack (the seam itself: a band of fresh ice frozen
// across the deck, glowing, a spear stood in it and a round shield leant on the spear), and Sigrun, the Queen's
// Shield: Glacia's sworn guard, fjord folk frozen half to ice, a tall shieldmaiden in a winged silver helm with a
// great round shield of ice and a spear. Her story: story/characters/bosses.md. dens.js imports this file and
// dispatches to it (same contracts as its own dens and bosses), so this file must NOT import dens.js: the few
// helpers it needs are copied below. The shared boss effects take her theme ('oath': FXPAL in dens.js); her
// Close the Seam is the `wave` ult, drawn as new ice racing along the floor (iceMass in dens.js).
import { H, TAU, mulberry32, circle, ellipse, mix } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, DENS, MOBS, FIELD_GROUND } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const SEAM_X = DEN_W - 260; // where the crack crosses the deck, at the far end
const SILVER = '#d8dce8', SILVER_D = '#7a8098', ICE = '#b4d4f0', ICE_L = '#e2f0fc', ICE_LINE = '#3e6294';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const rageCol = (c, enr, k = 0.3) => (enr ? mix(c, '#ff4a3a', k) : c);

// ——— small helpers (copies of the ones in dens.js) ———
function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.9, 0.35, 0.35); // src/glow.js
}
const gradCache = new WeakMap();
function vgrad(ctx, key, y0, y1, stops) {
  let c = gradCache.get(ctx);
  if (!c) gradCache.set(ctx, (c = {}));
  if (!c[key]) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const [k, col] of stops) g.addColorStop(k, col);
    c[key] = g;
  }
  return c[key];
}

// ——— the den: the middle of the bridge at dusk, high over the strait, the crack across the far end ———
const stars = (() => {
  const r = mulberry32(4301);
  return Array.from({ length: 50 }, () => ({ x: r() * DEN_W, y: 10 + r() * 160, s: 0.6 + r() * 1.4, p: r() * TAU }));
})();
const floes = (() => {
  const r = mulberry32(4311);
  return Array.from({ length: 22 }, () => ({ x: r() * DEN_W, y: 330 + r() * 80, w: 12 + r() * 40 }));
})();

function drawDenOath(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  // a dusk sky going from steel blue to a cold rose at the water
  ctx.fillStyle = vgrad(ctx, 'bg-oath', 0, H, [[0, '#2e3a5e'], [0.45, '#6a6e98'], [0.62, '#c8a8b8'], [0.64, '#5a6a8a'], [1, '#2a3650']]);
  ctx.fillRect(L, 0, R - L, H);
  for (const s of stars) {
    if (s.x < L || s.x > R) continue;
    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(time * 1.2 + s.p)})`;
    circle(ctx, s.x, s.y, s.s);
  }
  // the strait far below, floes on it
  for (const f of floes) {
    if (!visible(f.x - f.w, f.x + f.w, L, R)) continue;
    ctx.fillStyle = 'rgba(230,236,248,0.6)';
    ellipse(ctx, f.x + Math.sin(time * 0.1 + f.x) * 6, f.y, f.w, 3);
  }
  // the next island's cliffs, a ghost in the haze past the far end
  ctx.fillStyle = 'rgba(150,150,180,0.45)';
  ctx.beginPath();
  ctx.moveTo(DEN_W - 200, 360);
  ctx.lineTo(DEN_W - 120, 250);
  ctx.lineTo(DEN_W + 200, 230);
  ctx.lineTo(DEN_W + 200, 360);
  ctx.closePath();
  ctx.fill();
  // the balustrade behind, posts with crowns; snapped near the seam
  for (let x = 40; x < DEN_W; x += 150) {
    if (!visible(x - 30, x + 30, L, R)) continue;
    const near = Math.abs(x - SEAM_X) < 200, ph = near ? 40 : 86;
    ctx.fillStyle = 'rgba(180,212,240,0.85)';
    ctx.strokeStyle = ICE_LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 10, GROUND - ph, 20, ph, 3);
    ctx.fill();
    ctx.stroke();
    if (!near) {
      ctx.fillStyle = SILVER;
      ctx.beginPath();
      ctx.moveTo(x - 9, GROUND - ph - 2);
      ctx.lineTo(x - 9, GROUND - ph - 12);
      ctx.lineTo(x - 4, GROUND - ph - 7);
      ctx.lineTo(x, GROUND - ph - 15);
      ctx.lineTo(x + 4, GROUND - ph - 7);
      ctx.lineTo(x + 9, GROUND - ph - 12);
      ctx.lineTo(x + 9, GROUND - ph - 2);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(214,236,252,0.6)';
  ctx.fillRect(Math.max(L, 40), GROUND - 68, Math.min(R, SEAM_X - 200) - Math.max(L, 40), 8);
  // the deck
  ctx.fillStyle = '#f4f8ff';
  ctx.fillRect(L, GROUND - 2, R - L, 10);
  ctx.fillStyle = vgrad(ctx, 'oath-deck', GROUND + 8, H, [[0, '#cfe4f8'], [0.4, '#8ab0d8'], [1, '#3e5a80']]);
  ctx.fillRect(L, GROUND + 8, R - L, H - GROUND);
  // the seam: the crack frozen shut with new ice, glowing
  if (visible(SEAM_X - 120, SEAM_X + 120, L, R)) drawSeam(ctx, SEAM_X, GROUND, time, 1.4);
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx, time);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? 'The Seam', 750, time);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawLedge(ctx, p, i, time));
  ctx.restore();
}

// The seam across the deck: a jagged crack filled with clear new ice, light rising out of it, frost feathers
// growing along both lips
function drawSeam(ctx, x, b, time, s = 1) {
  const r = mulberry32(4321);
  glow(ctx, x, b - 20, 90 * s, 60 * s, '170,220,255', 0.45 + 0.1 * Math.sin(time * 2));
  ctx.fillStyle = '#1e3450';
  ctx.beginPath();
  ctx.moveTo(x - 50 * s, b + 30);
  for (let i = 0; i <= 8; i++) ctx.lineTo(x - 50 * s + i * 12.5 * s, b - 2 + (i % 2 ? 6 : -2));
  ctx.lineTo(x + 50 * s, b + 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(190,230,255,0.85)';
  ctx.beginPath();
  ctx.moveTo(x - 34 * s, b + 30);
  for (let i = 0; i <= 6; i++) ctx.lineTo(x - 34 * s + i * 11.3 * s, b + 2 + (i % 2 ? 4 : 0));
  ctx.lineTo(x + 34 * s, b + 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - 26 * s, b + 20);
  ctx.lineTo(x - 8 * s, b + 8);
  ctx.lineTo(x + 6 * s, b + 16);
  ctx.lineTo(x + 24 * s, b + 6);
  ctx.stroke();
  // light rising
  for (let i = 0; i < 6; i++) {
    const k = (time * 0.5 + i / 6) % 1;
    ctx.fillStyle = `rgba(214,240,255,${0.6 * (1 - k)})`;
    circle(ctx, x + (r() - 0.5) * 70 * s, b - k * 70, 1.6 + r() * 1.4);
  }
  // frost feathers along the lips
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const fx = x + (i - 3.5) * 13 * s;
    ctx.beginPath();
    ctx.moveTo(fx, b);
    ctx.lineTo(fx - 4, b - 7);
    ctx.moveTo(fx, b);
    ctx.lineTo(fx + 4, b - 7);
    ctx.stroke();
  }
}

function drawExit(ctx, time) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 60, 110, 90, '230,240,250', 0.45);
  ctx.fillStyle = 'rgba(214,232,248,0.9)';
  ctx.beginPath();
  ctx.moveTo(x - 44, b + 2);
  ctx.lineTo(x - 44, b - 70);
  ctx.arc(x, b - 70, 44, Math.PI, 0);
  ctx.lineTo(x + 44, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x - 44, b + 2);
  ctx.lineTo(x - 44, b - 70);
  ctx.arc(x, b - 70, 44, Math.PI, 0);
  ctx.lineTo(x + 44, b + 2);
  ctx.stroke();
  ctx.fillStyle = SILVER;
  ctx.fillRect(x - 6, b - 122, 12, 10);
  text(ctx, 'OUT', x, b - 140, 13, '#f0f8ff');
}

// The name on a long pale-blue pennant hung from a crossbar of ice, the crown on it in white
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 60);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50), hh = 54;
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-tw / 2 - 12, -34, tw + 24, 8, 4);
  ctx.fill();
  ctx.stroke();
  const wave = (i) => Math.sin(time * 2 + i) * 3;
  ctx.fillStyle = '#8ab8e0';
  ctx.strokeStyle = '#3e6294';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, -28);
  ctx.lineTo(tw / 2, -28);
  ctx.lineTo(tw / 2 + wave(1), hh);
  ctx.lineTo(wave(2), hh - 14);
  ctx.lineTo(-tw / 2 + wave(3), hh);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, name, 0, 8, 18, '#ffffff');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-8, 34);
  ctx.lineTo(-8, 26);
  ctx.lineTo(-4, 30);
  ctx.lineTo(0, 22);
  ctx.lineTo(4, 30);
  ctx.lineTo(8, 26);
  ctx.lineTo(8, 34);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The ledges: slabs of the deck heaved up and frozen in place
function drawLedge(ctx, p, i, time) {
  const { x, y, w } = p;
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y - 3);
  ctx.lineTo(x + w - 14, y + 26);
  ctx.lineTo(x + 10, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f4f8ff';
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 5, w + 4, 8, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(214,236,248,0.9)';
  for (let k = 0; k < 4; k++) {
    const ix = x + 20 + (k * (w - 40)) / 3;
    ctx.beginPath();
    ctx.moveTo(ix - 3, y + 24);
    ctx.lineTo(ix + 3, y + 24);
    ctx.lineTo(ix, y + 36 + (k % 2) * 8);
    ctx.closePath();
    ctx.fill();
  }
}

export const DEN_ART = { oath: drawDenOath };

// ——— the way in at the Crack (feet at groundY) ———
// The seam across the bridge's deck, glowing, a spear stood upright in it and a round shield of ice leant on
// the spear; the warning sign beside it
function drawEntranceOath(ctx, x, groundY, time) {
  const den = Math.max(0, DENS.findIndex((d) => d.theme === 'oath'));
  const spec = MOBS[DENS[den]?.boss];
  const b = groundY;
  ctx.save();
  drawSeam(ctx, x, b, time, 1.2);
  // the spear
  ctx.fillStyle = '#c8b498';
  ctx.strokeStyle = '#6a5a44';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(x - 3, b - 150, 6, 152, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(206,232,252,0.95)';
  ctx.strokeStyle = ICE_LINE;
  ctx.beginPath();
  ctx.moveTo(x, b - 150);
  ctx.quadraticCurveTo(x - 10, b - 168, x, b - 196);
  ctx.quadraticCurveTo(x + 10, b - 168, x, b - 150);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8ab8e0';
  ctx.beginPath();
  ctx.moveTo(x + 3, b - 146);
  ctx.quadraticCurveTo(x + 14, b - 142 + Math.sin(time * 4) * 3, x + 26, b - 140 + Math.sin(time * 4 + 1) * 4);
  ctx.lineTo(x + 3, b - 132);
  ctx.closePath();
  ctx.fill();
  // the shield, leant on it
  ctx.save();
  ctx.translate(x - 26, b - 34);
  ctx.rotate(-0.15);
  glow(ctx, 0, 0, 50, 50, '190,230,255', 0.35);
  ctx.fillStyle = 'rgba(196,224,248,0.95)';
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SILVER;
  ctx.strokeStyle = SILVER_D;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, -12, -14, 6, 10, -0.6);
  ctx.restore();
  // the warning sign on a post (the way in to a boss)
  const sx = x + 130;
  ctx.fillStyle = ICE_LINE;
  ctx.beginPath();
  ctx.roundRect(sx - 4, b - 86, 8, 88, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(sx, b - 76);
  ctx.rotate(Math.sin(time * 1.2) * 0.025 + 0.03);
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  const name = spec?.name ?? 'Boss';
  const tw = Math.max(92, ctx.measureText(name).width + 24);
  ctx.fillStyle = '#8ab8e0';
  ctx.strokeStyle = '#2e4e78';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -16, tw, 52, 10);
  ctx.fill();
  ctx.stroke();
  const pulse = 0.5 + 0.5 * Math.sin(time * 4);
  ctx.fillStyle = mix('#e0565a', '#ff7a6a', pulse);
  ctx.strokeStyle = '#a83a44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-26, -27, 52, 20, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'BOSS', 0, -16.5, 13, '#fffaf0');
  text(ctx, name, 0, 8, 13, '#fffaf0');
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-22, 18, 44, 14, 7);
  ctx.fill();
  text(ctx, `Lv ${spec?.lvl ?? '?'}`, 0, 25.5, 11, '#2e4e78');
  ctx.restore();
  ctx.restore();
}

export const ENTRANCE_ART = { oath: drawEntranceOath };

// ——— Sigrun (ctx, w, h, st) => sil, origin at her feet, +x = facing ———
// A tall fjord-folk slime frozen half to ice, pale and frosted, ice crusting her up to the middle; a tall winged
// silver helm with her queen's crown worked small on the brow; a pale blue cloak stiff with frost; a great round
// shield of ice in front with the shard set in its silver boss (the weak point S5 will use); a spear held up
// behind. Stern, tired eyes. m.warn: shield raised, spear drawn back · charging: shield first, leaning in
function drawSigrun(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const live = dying < 0.02;
  const breathe = Math.sin(t * 1.4 + seed) * 0.02;
  const lean = charging ? 0.12 : warn ? -0.05 : 0;
  const body = () => {
    ctx.moveTo(-w * 0.4, -2);
    ctx.bezierCurveTo(-w * 0.5, -h * (1.04 + breathe), w * 0.44, -h * (1.04 + breathe), w * 0.38, -2);
    ctx.closePath();
  };
  const sil = () => {
    ctx.beginPath();
    body();
  };
  ctx.save();
  ctx.translate(0, -h * 0.4);
  ctx.rotate(lean);
  ctx.translate(0, h * 0.4);
  // the cloak, behind her
  ctx.fillStyle = rageCol('#8ab8e0', enr, 0.25);
  ctx.strokeStyle = '#3e6294';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.1, -h * 0.66);
  ctx.quadraticCurveTo(-w * 0.62, -h * 0.4, -w * 0.58 + Math.sin(t * 1.5) * 4, -2);
  ctx.lineTo(-w * 0.2, -2);
  ctx.quadraticCurveTo(-w * 0.3, -h * 0.4, w * 0.06, -h * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; // frost on its hem
  for (let i = 0; i < 5; i++) ellipse(ctx, -w * 0.52 + i * w * 0.07, -6, 7, 3);
  // the spear, held up behind
  ctx.save();
  ctx.translate(-w * 0.3, -h * 0.42);
  ctx.rotate(warn ? -0.9 : -0.15);
  ctx.fillStyle = '#c8b498';
  ctx.strokeStyle = '#6a5a44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-3, -h * 0.66, 6, h * 0.9, 3);
  ctx.fill();
  ctx.stroke();
  glow(ctx, 0, -h * 0.76, 22, 30, '190,230,255', live ? 0.6 : 0.15);
  ctx.fillStyle = 'rgba(206,232,252,0.95)';
  ctx.strokeStyle = ICE_LINE;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.64);
  ctx.quadraticCurveTo(-12, -h * 0.74, 0, -h * 0.9);
  ctx.quadraticCurveTo(12, -h * 0.74, 0, -h * 0.64);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // the body: frosted jelly, ice up to her middle
  const g = ctx.createLinearGradient(0, -h * 0.85, 0, 0);
  g.addColorStop(0, rageCol('#eef4fa', enr, 0.15));
  g.addColorStop(1, rageCol('#b8d0e8', enr, 0.15));
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3e5a80';
  ctx.lineWidth = 4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(150,196,236,0.6)';
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, -2);
  for (let i = 0; i <= 8; i++) ctx.lineTo(-w * 0.42 + (i * w * 0.8) / 8, -h * (0.3 + (i % 2) * 0.06));
  ctx.lineTo(w * 0.38, -2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ellipse(ctx, -w * 0.18, -h * 0.6, w * 0.07, h * 0.1, -0.4);
  // the face: stern, tired eyes
  const ex = w * 0.1, ey = -h * 0.6;
  for (const dx of [-w * 0.08, w * 0.08]) {
    if (live) {
      ctx.fillStyle = '#2a3048';
      ellipse(ctx, ex + dx, ey, 4.5, warn ? 6 : 4.5);
      ctx.fillStyle = '#ffffff';
      circle(ctx, ex + dx + 1.5, ey - 1.5, 1.4);
      ctx.strokeStyle = '#2a3048';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(ex + dx - 7, ey - 8 + (dx < 0 ? 0 : -2));
      ctx.lineTo(ex + dx + 6, ey - 8 + (dx < 0 ? -2 : 0));
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#2a3048';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(ex + dx, ey - 1, 4, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = 'rgba(42,48,72,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ex - 6, ey + 14);
  ctx.lineTo(ex + 6, ey + 14);
  ctx.stroke();
  // the winged helm
  const hy = -h * 0.75, rx = w * 0.3;
  for (const s of [-1, 1]) {
    ctx.fillStyle = 'rgba(214,236,252,0.95)';
    ctx.strokeStyle = ICE_LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s * rx * 0.8, hy);
    ctx.quadraticCurveTo(s * rx * 1.5, hy - h * 0.06, s * rx * 1.36, hy - h * 0.24);
    ctx.quadraticCurveTo(s * rx * 1.1, hy - h * 0.12, s * rx * 0.6, hy - h * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = SILVER;
  ctx.strokeStyle = SILVER_D;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-rx, hy + 8);
  ctx.bezierCurveTo(-rx, hy - h * 0.2, rx, hy - h * 0.2, rx, hy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c9a64a';
  ctx.beginPath();
  ctx.moveTo(w * 0.04, hy + 2);
  ctx.lineTo(w * 0.04, hy - 6);
  ctx.lineTo(w * 0.08, hy - 2);
  ctx.lineTo(w * 0.12, hy - 10);
  ctx.lineTo(w * 0.16, hy - 2);
  ctx.lineTo(w * 0.2, hy - 6);
  ctx.lineTo(w * 0.2, hy + 2);
  ctx.closePath();
  ctx.fill();
  // the great round shield of ice, the shard in its boss
  const sx = w * 0.42 + (charging ? 10 : 0), sy = -h * 0.36 - (warn ? h * 0.08 : 0), sr = h * 0.26;
  glow(ctx, sx, sy, sr * 1.6, sr * 1.6, '200,230,255', warn ? 0.6 : 0.3);
  ctx.fillStyle = rageCol('#c4e0f8', enr, 0.15);
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(sx, sy, sr * 0.55, sr, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(62,98,148,0.4)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(a) * sr * 0.16, sy + Math.sin(a) * sr * 0.3);
    ctx.lineTo(sx + Math.cos(a) * sr * 0.5, sy + Math.sin(a) * sr * 0.92);
    ctx.stroke();
  }
  ctx.fillStyle = SILVER;
  ctx.strokeStyle = SILVER_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(sx + 2, sy, sr * 0.2, sr * 0.34, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  const sh = 0.6 + 0.4 * Math.sin(t * 3);
  glow(ctx, sx + 2, sy, 26, 26, '255,240,180', live ? 0.55 * sh : 0.1);
  ctx.fillStyle = live ? '#fff3c0' : '#c8c0a8';
  ctx.strokeStyle = '#c9a64a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx + 2, sy - 11);
  ctx.lineTo(sx + 9, sy);
  ctx.lineTo(sx + 2, sy + 11);
  ctx.lineTo(sx - 5, sy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, sx - sr * 0.2, sy - sr * 0.5, sr * 0.1, sr * 0.22, -0.2);
  // her breath, cold
  const pk = (t * 0.3 + seed) % 1;
  if (live && pk < 0.3) {
    const k = pk / 0.3;
    ctx.fillStyle = `rgba(240,248,255,${0.5 * (1 - k)})`;
    circle(ctx, ex + w * 0.18 + k * 30, ey + 12 - k * 10, 6 + k * 10);
  }
  ctx.restore();
  return sil;
}

export const BOSS_ART = { sigrun: drawSigrun };
