// Docs: docs/places/helm.md, docs/combat/bosses.md
// The Citadel's party den, the Helm (C4), its way in at the Engine Halls' east end at HELM_GATE_X (the bulkhead, unsealed
// and swung back: the den's entrance art is the gate's open look, src/citadel-gates.js), and the Helmsman himself: a great
// brass automaton who has held the city on its last heading since the Stopped Hour, because nobody ever came up to the
// bridge to tell him to land. The plan: story/citadel-plan.md.
// dens.js imports this file and dispatches to it (same contracts as its own dens and bosses), so this file must NOT
// import dens.js: the few helpers it needs are copied below. The shared boss effects take its theme ('helm': FXPAL in
// dens.js). Two looks of its own that dens.js hands over by theme: The Last Heading (the `wave` ult: HELM_ULT, a bank of
// cloud driven down the bridge as he puts the wheel hard over) and his freeing (drawHelmFreed, run from the den's bossDie:
// he takes his hands off the wheel and it spins free; the den keeps the wheel turning on its own until he's back).
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, FIELD_GROUND, BOSS_RESPAWN_MS } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';
import { drawSunk } from './challenge.js';
import { CITADEL_OPEN } from './citadel-gates.js';

const GROUND = FIELD_GROUND;
export const HELM_FREED_S = 7; // how long the freeing plays (the den's bossDie lasts this long)
const BRASS = '#f0c470', BRASS_L = '#fde3a0', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const IRON = '#4a4656', IRON_D = '#2a2834', IRON_L = '#6e6a7e';
const AETHER = '150,240,234';
const WHEEL_X = DEN_W / 2, WHEEL_Y = GROUND - 250, WHEEL_R = 150; // the great wheel at the back of the bridge
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const rageCol = (c, enr, k = 0.3) => (enr ? mix(c, '#ff4a3a', k) : c);
const ease = (k) => 1 - (1 - k) ** 3;

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

// Freed: the wheel spins on its own until the den has him back (set from drawHelmFreed)
let freedPending = false, freedAt = -1e9, freeingSeen = -1e9; // (freeingSeen: a freeing is drawing the wheel itself)

// ——— the den: the city's bridge, high in the bow over the Engine Halls: a long curved window across the back over the
// clouds (they slide past, slowly, always the same way: the city circling), the great wheel the size of a house on its
// pedestal in the middle of the bridge, brass instruments along the sill (a binnacle, an inclinometer, the heading dial
// with its needle never moving), speaking tubes, the deck plates. The ledges are the instrument galleries either side ———
const clouds = (() => {
  const r = mulberry32(9201);
  return Array.from({ length: 16 }, () => ({ x: r() * 2000, y: 180 + r() * 220, r: 40 + r() * 70, v: 0.5 + r() * 0.5 }));
})();

// the great wheel, at (x, y), radius r, turned to angle a; `free`: no hands on it, spinning
function drawWheel(ctx, x, y, r, a, enr = false) {
  ctx.save();
  ctx.translate(x, y);
  // the pedestal under it
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.moveTo(-40, GROUND - y);
  ctx.lineTo(-24, 20);
  ctx.lineTo(24, 20);
  ctx.lineTo(40, GROUND - y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = BRASS_D;
  circle(ctx, 0, 0, 30);
  ctx.rotate(a);
  // the spokes running out past the rim into handles
  for (let i = 0; i < 8; i++) {
    const k = (i / 8) * TAU, c = Math.cos(k), s = Math.sin(k);
    ctx.strokeStyle = rageCol(BRASS_E, enr, 0.2);
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(c * 26, s * 26);
    ctx.lineTo(c * (r + 30), s * (r + 30));
    ctx.stroke();
    ctx.strokeStyle = rageCol(BRASS_D, enr, 0.2);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(c * 26, s * 26);
    ctx.lineTo(c * (r + 30), s * (r + 30));
    ctx.stroke();
    ctx.fillStyle = BRASS;
    circle(ctx, c * (r + 34), s * (r + 34), 9);
  }
  ctx.strokeStyle = BRASS_E; // the rim
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = rageCol(BRASS, enr, 0.15);
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(253,227,160,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r - 2, -2.2, -1.2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = BRASS_L; // the boss in the middle
  circle(ctx, x, y, 14);
  ctx.fillStyle = BRASS_E;
  circle(ctx, x, y, 5);
}

function drawDenHelm(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  if (freedPending) (freedPending = false), (freedAt = time);
  const freedT = time - freedAt, freed = freedT < BOSS_RESPAWN_MS / 1000;
  ctx.save();
  // the sky through the window: high, cold, the clouds going past one way
  ctx.fillStyle = vgrad(ctx, 'bg-helm', 0, GROUND, [[0, '#1e2234'], [0.5, '#4a5470'], [1, '#a8b4c8']]);
  ctx.fillRect(L, 0, R - L, H);
  for (const c of clouds) {
    const x = ((c.x - time * 12 * c.v) % 2000 + 2000) % 2000 - 250;
    if (!visible(x - c.r * 2, x + c.r * 2, L, R)) continue;
    ctx.fillStyle = 'rgba(232,236,246,0.5)';
    ellipse(ctx, x, c.y, c.r * 1.7, c.r * 0.38);
  }
  // the window's frame: brass mullions curving over, the roof dark above
  ctx.fillStyle = IRON_D;
  ctx.fillRect(L, 0, R - L, 60);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 10;
  for (let x = Math.floor(L / 250) * 250; x < R + 250; x += 250) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND - 120);
    ctx.quadraticCurveTo(x + 10, 120, x + 40, 60);
    ctx.stroke();
  }
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(L, 62);
  ctx.lineTo(R, 62);
  ctx.moveTo(L, GROUND - 120);
  ctx.lineTo(R, GROUND - 120);
  ctx.stroke();
  // the sill and its instruments
  ctx.fillStyle = vgrad(ctx, 'sill-helm', GROUND - 120, GROUND, [[0, '#3e3c4a'], [1, '#2a2834']]);
  ctx.fillRect(L, GROUND - 118, R - L, 118);
  for (let x = 140; x < DEN_W; x += 260) {
    if (!visible(x - 60, x + 60, L, R) || Math.abs(x - WHEEL_X) < 200) continue;
    drawDial(ctx, x, GROUND - 80, time, x);
  }
  // the speaking tubes, brass, up the frame
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 6;
  for (const x of [330, DEN_W - 330]) {
    if (!visible(x - 30, x + 30, L, R)) continue;
    ctx.beginPath();
    ctx.moveTo(x, GROUND - 118);
    ctx.lineTo(x, 90);
    ctx.stroke();
    ctx.fillStyle = BRASS;
    ellipse(ctx, x, GROUND - 124, 12, 6);
  }
  // the great wheel: held a hair either side of the heading while he lives; spinning free after a freeing
  if (Date.now() - freeingSeen > 250 && visible(WHEEL_X - WHEEL_R - 60, WHEEL_X + WHEEL_R + 60, L, R)) {
    const a = freed ? freedT * 0.6 + 3 : Math.sin(time * 0.35) * 0.04;
    drawWheel(ctx, WHEEL_X, WHEEL_Y, WHEEL_R, a);
  }
  // the deck: riveted brass-edged plates
  ctx.fillStyle = vgrad(ctx, 'floor-helm', GROUND, H, [[0, '#4a4656'], [0.4, '#2a2834'], [1, '#16141c']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(L, GROUND - 2, R - L, 5);
  ctx.fillStyle = 'rgba(110,106,126,0.5)';
  for (let x = Math.floor(L / 90) * 90; x < R; x += 90) {
    ctx.fillRect(x, GROUND + 4, 2, 40);
    circle(ctx, x + 8, GROUND + 12, 1.8);
    circle(ctx, x - 8, GROUND + 12, 1.8);
  }
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx, time);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? 'The Helm', 750, time);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawSunk(ctx, p, i, () => drawLedge(ctx, p))); // (drawSunk: the shared ledge sink, src/challenge.js)
  ctx.restore();
}

// an instrument on the sill: a brass dial, its needle (the heading dial's never moves; the others shiver)
function drawDial(ctx, x, y, time, seed) {
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(x - 6, y + 10, 12, 30);
  ctx.fillStyle = BRASS;
  circle(ctx, x, y, 22);
  ctx.fillStyle = '#efe4c8';
  circle(ctx, x, y, 17);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13);
    ctx.lineTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16);
    ctx.stroke();
  }
  const na = -Math.PI / 2 + Math.sin(time * 0.9 + seed) * 0.05;
  ctx.strokeStyle = '#c8302a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(na) * 14, y + Math.sin(na) * 14);
  ctx.stroke();
}

// The way out: the bulkhead back down to the Engine Halls
function drawExit(ctx, time) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 80, 100, 110, AETHER, 0.25);
  ctx.save();
  ctx.translate(x, b);
  ctx.scale(0.8, 0.8);
  CITADEL_OPEN.bulkhead(ctx, time, {});
  ctx.restore();
  text(ctx, 'OUT', x, b - 196, 13, '#f0eef8');
}

// The name, on a brass plate hung under the window's top rail
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 90);
  ctx.rotate(Math.sin(time * 0.4) * 0.008);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(220, ctx.measureText(name).width + 50);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const sx of [-tw / 2 + 18, tw / 2 - 18]) {
    ctx.moveTo(sx, -30);
    ctx.lineTo(sx, -18);
  }
  ctx.stroke();
  ctx.fillStyle = BRASS_D;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 40, 8);
  ctx.fill();
  ctx.stroke();
  text(ctx, name, 0, 1, 18, '#2a1e14');
  ctx.restore();
}

// The ledges: iron instrument galleries with a brass rail, hung off the bridge's frame
function drawLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const rx of [x + 14, x + w - 14]) {
    ctx.moveTo(rx, y);
    ctx.lineTo(rx, 62);
  }
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 11, 3);
  ctx.fill();
  ctx.fillStyle = IRON_L;
  ctx.fillRect(x, y - 4, w, 2);
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 24);
  ctx.lineTo(x + w - 4, y - 24);
  for (let rx = x + 8; rx < x + w; rx += 32) {
    ctx.moveTo(rx, y - 24);
    ctx.lineTo(rx, y - 4);
  }
  ctx.stroke();
}

export const DEN_ART = { helm: drawDenHelm };

// ——— the way in at the Engine Halls' east end (feet at groundY): the bulkhead, unsealed, swung back on a lit stair ———
function drawEntranceHelm(ctx, x, groundY, time) {
  ctx.save();
  ctx.translate(x, groundY);
  CITADEL_OPEN.bulkhead(ctx, time, {});
  ctx.restore();
}
export const ENTRANCE_ART = { helm: drawEntranceHelm };

// ——— the Helmsman (ctx, w, h, st) => sil, origin under him on the floor, +x = facing ———
// A great brass automaton, tall and narrow-shouldered, in a long coat of riveted plate that flares to the deck like a
// ship's officer's; two long arms with big four-fingered hands, held out before him as if on spokes; a domed head with a
// peaked brass cap and one great compass for an eye, its needle swinging; a gyroscope turning in the cap's crown; at his
// back an open hatch where his clockwork turns and the shard glints (where `weak.back` puts the weak point). m.warn: he
// heaves both arms over (putting the wheel hard over); charging: he strides, leaning; st.still: freed, arms down.
function drawHelmsman(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const live = dying < 0.02 && !st.still;
  const sway = live ? Math.sin(t * 1.1 + seed) * 0.015 : 0;
  const plate = rageCol(BRASS_D, enr, 0.2), plateL = rageCol(BRASS, enr, 0.2), plateE = rageCol(BRASS_E, enr, 0.2);
  const coatW = w * 0.42, shoulderY = -h * 0.72, headY = -h * 0.86;
  const sil = () => {
    ctx.beginPath();
    ctx.moveTo(-coatW, 0);
    ctx.lineTo(-w * 0.24, shoulderY);
    ctx.lineTo(w * 0.24, shoulderY);
    ctx.lineTo(coatW, 0);
    ctx.closePath();
    ctx.rect(-w * 0.16, -h, w * 0.32, h * 0.3);
  };
  ctx.save();
  ctx.rotate(sway);
  // the open hatch at his back: clockwork turning, the shard in it (MOBS.helmsman.weak)
  const bx = -w * 0.34, by = -h * 0.5;
  // the coat of plate
  const g = ctx.createLinearGradient(-coatW, 0, coatW, 0);
  g.addColorStop(0, plateE);
  g.addColorStop(0.4, plateL);
  g.addColorStop(0.75, plate);
  g.addColorStop(1, plateE);
  ctx.fillStyle = g;
  ctx.strokeStyle = plateE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-coatW, 0);
  ctx.lineTo(-w * 0.24, shoulderY);
  ctx.quadraticCurveTo(0, shoulderY - 10, w * 0.24, shoulderY);
  ctx.lineTo(coatW, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,58,30,0.6)'; // the plates' seams and rivets
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 5; i++) {
    const y = shoulderY * (1 - i / 5), hw = w * 0.24 + (coatW - w * 0.24) * (i / 5);
    ctx.beginPath();
    ctx.moveTo(-hw, y);
    ctx.lineTo(hw, y);
    ctx.stroke();
    ctx.fillStyle = BRASS_L;
    for (let k = -2; k <= 2; k++) circle(ctx, k * hw * 0.4, y - 3, 1.6);
  }
  ctx.fillStyle = IRON_D; // the front opening of the coat, dark, a row of buttons
  ctx.fillRect(w * 0.02, shoulderY + 6, 8, -shoulderY - 6);
  ctx.fillStyle = BRASS_L;
  for (let y = shoulderY + 20; y < -10; y += 22) circle(ctx, w * 0.02 + 4, y, 3);
  // the hatch at his back
  ctx.fillStyle = '#16141c';
  ctx.beginPath();
  ctx.roundRect(bx - 18, by - 22, 34, 44, 6);
  ctx.fill();
  ctx.strokeStyle = plateE;
  ctx.lineWidth = 2;
  ctx.stroke();
  const ga = live ? t * 2 : 0;
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 2;
  for (const [gx, gy, r, s] of [[bx - 6, by - 8, 9, 1], [bx + 6, by + 8, 7, -1.3]]) {
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = ga * s + (i / 6) * TAU;
      ctx.beginPath();
      ctx.moveTo(gx + Math.cos(a) * r, gy + Math.sin(a) * r);
      ctx.lineTo(gx + Math.cos(a) * (r + 3), gy + Math.sin(a) * (r + 3));
      ctx.stroke();
    }
  }
  const sh = 0.6 + 0.4 * Math.sin(t * 3);
  glow(ctx, bx, by, 22, 22, '255,236,190', live ? 0.5 * sh : 0.1);
  ctx.fillStyle = live ? '#fff4d8' : '#b8b0a0';
  ctx.strokeStyle = '#a88a50';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(bx, by - 8);
  ctx.lineTo(bx + 6, by);
  ctx.lineTo(bx, by + 8);
  ctx.lineTo(bx - 5, by);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the arms, held out before him as if on spokes; heaved over on the warn, swung back as he strides, down when freed
  const lift = st.still ? 0.9 : warn ? -0.9 : charging ? 0.5 : -0.25 + Math.sin(t * 0.7 + seed) * 0.04;
  for (const [sx, side] of [[w * 0.2, 1], [-w * 0.14, -1]]) {
    ctx.save();
    ctx.translate(sx, shoulderY + 8);
    ctx.rotate(lift * (side > 0 ? 1 : 0.8) + (side < 0 ? 0.25 : 0));
    ctx.fillStyle = side > 0 ? plateL : plate;
    ctx.strokeStyle = plateE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-8, 0, 16, h * 0.32, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = IRON;
    circle(ctx, 0, 0, 9);
    ctx.translate(0, h * 0.32);
    ctx.fillStyle = plateL; // the hand, four fingers curled as if round a spoke
    ctx.beginPath();
    ctx.ellipse(0, 6, 13, 10, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    for (let i = -1.5; i <= 1.5; i++) {
      ctx.fillStyle = plate;
      ctx.beginPath();
      ctx.roundRect(i * 6 - 2.5, 10, 5, 10, 2);
      ctx.fill();
    }
    ctx.restore();
  }
  // the neck and the domed head
  ctx.fillStyle = IRON;
  ctx.fillRect(-10, shoulderY - 18, 20, 20);
  ctx.fillStyle = plateL;
  ctx.strokeStyle = plateE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(w * 0.02, headY, w * 0.17, h * 0.1, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // the compass eye, its needle swinging (pinned on the heading; wild on the warn)
  const ex = w * 0.08, ey = headY + 2;
  ctx.fillStyle = BRASS_E;
  circle(ctx, ex, ey, 14);
  ctx.fillStyle = live ? '#efe4c8' : '#a8a090';
  circle(ctx, ex, ey, 11);
  if (live) glow(ctx, ex, ey, 18, 18, warn ? '255,110,80' : AETHER, 0.35);
  const na = live ? -Math.PI / 2 + (warn ? Math.sin(t * 14) * 1.2 : Math.sin(t * 0.8 + seed) * 0.08) : 0.8;
  ctx.strokeStyle = '#c8302a';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(ex - Math.cos(na) * 9, ey - Math.sin(na) * 9);
  ctx.lineTo(ex + Math.cos(na) * 9, ey + Math.sin(na) * 9);
  ctx.stroke();
  ctx.fillStyle = BRASS_E;
  circle(ctx, ex, ey, 2);
  // the peaked cap, a lamp at its brow, a gyroscope turning in its crown
  const cy = headY - h * 0.08;
  ctx.fillStyle = plate;
  ctx.beginPath();
  ctx.moveTo(-w * 0.16, cy + 8);
  ctx.bezierCurveTo(-w * 0.16, cy - h * 0.08, w * 0.18, cy - h * 0.08, w * 0.18, cy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = IRON_D; // the peak
  ctx.beginPath();
  ctx.ellipse(w * 0.14, cy + 8, w * 0.14, 5, 0.06, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = live ? `rgba(${AETHER},0.95)` : '#5a6a70';
  circle(ctx, w * 0.1, cy + 2, 4);
  const ga2 = live ? t * 2.4 : 0.6;
  ctx.strokeStyle = BRASS_L;
  ctx.lineWidth = 1.8;
  const gy = cy - h * 0.09;
  ctx.beginPath();
  ctx.ellipse(0, gy, 10, 10 * Math.abs(Math.cos(ga2)) + 0.6, 0, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, gy, 10 * Math.abs(Math.sin(ga2)) + 0.6, 10, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
  return sil;
}
export const BOSS_ART = { helmsman: drawHelmsman };

// ——— The Last Heading (the `wave` ult: a bank of cloud driven the length of the bridge as he puts the wheel hard over) ———
function cloudMass(ctx, fx, dir, hh, time) {
  const y = GROUND + 2;
  ctx.fillStyle = 'rgba(232,236,246,0.35)';
  ctx.fillRect(Math.min(fx, fx - dir * 280), y - hh, 280, hh);
  for (let i = 0; i < 8; i++) {
    const bx = fx - dir * (i * 34), r = hh * (0.6 - i * 0.05) * (0.9 + 0.1 * Math.sin(time * 7 + i));
    if (r <= 4) continue;
    ctx.fillStyle = i % 2 ? 'rgba(244,246,252,0.9)' : 'rgba(214,222,238,0.9)';
    circle(ctx, bx, y - r * 0.8, r);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; // wind streaks out in front
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const sy = y - 10 - i * hh * 0.18, sx = fx + dir * (10 + ((time * 300 + i * 40) % 60));
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + dir * 30, sy);
    ctx.stroke();
  }
  glow(ctx, fx, y - hh * 0.5, 80, hh, '220,230,250', 0.4);
}
const HELM_ULT = {
  waveWarn(ctx, e, k) {
    const { x0, dir } = e, y = GROUND;
    const pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 14 * k));
    ctx.fillStyle = `rgba(255,110,90,${0.1 + 0.12 * pulse})`; // the lane it will drive down
    ctx.fillRect(-20, y - 70, DEN_W + 40, 72);
    ctx.strokeStyle = `rgba(255,246,236,${0.3 + 0.3 * pulse})`;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < 10; i++) {
      const p = (i / 10 + e.t * 0.4) % 1;
      const cx = dir > 0 ? x0 + p * (DEN_W - x0) : x0 - p * x0;
      ctx.beginPath();
      ctx.moveTo(cx - dir * 10, y - 48);
      ctx.lineTo(cx + dir * 4, y - 36);
      ctx.lineTo(cx - dir * 10, y - 24);
      ctx.stroke();
    }
    const hh = 70 * ease(k); // the cloud piling up behind him
    if (hh > 2) cloudMass(ctx, x0 + dir * 20, dir, hh, e.t);
    glow(ctx, x0, y - 40, 120, 80, '255,90,60', 0.25 + 0.3 * pulse);
  },
  waveGo(ctx, e) {
    cloudMass(ctx, e.x0 + e.dir * e.speed * e.t, e.dir, 70, e.t);
  },
};
export const ULT_LOOKS = { helm: HELM_ULT };

// ——— freed: he takes his hands off the wheel, and it spins free (the den's bossDie, HELM_FREED_S long) ———
export function drawHelmFreed(ctx, e) {
  const tt = e.t;
  if (tt > HELM_FREED_S - 0.5) freedPending = true;
  freeingSeen = Date.now();
  const k = clamp((tt - 0.6) / 2.4, 0, 1);
  const x = e.x ?? 750;
  ctx.save();
  ctx.globalAlpha *= tt < 0.6 ? tt / 0.6 : 1;
  // the wheel, let go: still for a beat, then going round on its own, faster
  const spin = tt < 2 ? 0 : (tt - 2) ** 2 * 0.35;
  drawWheel(ctx, WHEEL_X, WHEEL_Y, WHEEL_R, spin);
  ctx.translate(x, GROUND);
  drawHelmsman(ctx, 170, 210, { t: tt, seed: 0, enr: false, warn: false, charging: false, dying: 0, still: k >= 1 });
  ctx.restore();
}
