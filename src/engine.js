// Docs: docs/places/engine.md
// The Engine Halls (room ENGINE, src/shared/rpg.js; the Citadel's depth pass, C3): the engines that keep the city in the
// sky, through the blast door in the Chrono Spire. A long iron hall open on its far side to the sky: great aether turbines
// behind glass walls burning blue, their shafts going down through the floor; the floor itself a grated catwalk over a
// long drop to the clouds; gantries and catwalks above; wind through every grating. West to east: the Boiler Gallery (no
// mobs: the waystone, Number Nine's furnace), the Stoke Hold, the Turbine Walk and the Governor's Deck, the Helm's bulkhead
// at its far end (a gate: src/citadel-gates.js). The turbine blades (TURBINES) sweep up through slots in the floor on the
// server tick (turbineAt), drawn here: the slot glows and the grating shakes as one spins up, then the blades come round.
// The engine-room telegraph on the top gantry (last in ENGINE_PLATFORMS) is the find: its handle stopped at FULL AHEAD, a
// tag tied to it in a Keeper's hand: HOLD.
import { H, W, TAU, mulberry32, circle, ellipse } from './util.js';
import { ENGINE_W, FIELD_GROUND, ENGINE_PLATFORMS, ENGINE_EXIT_X, NINE_X, TURBINES, turbineAt } from './shared/rpg.js';
import { blueGlow } from './engine-art.js';

const GROUND = FIELD_GROUND;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const BRASS = '#f0c470', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const IRON = '#4a4656', IRON_D = '#2a2834', IRON_L = '#6e6a7e';
const AETHER = '150,240,234';
const TELEGRAPH = ENGINE_PLATFORMS.find((p) => p.kind === 'telegraph');

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

// the great turbines in the back wall (world x), each behind its glass, and the clouds far below (screen-space)
const BIG = (() => {
  const out = [];
  for (let x = 900; x < ENGINE_W - 300; x += 760) out.push(x);
  return out;
})();
const clouds = (() => {
  const r = mulberry32(9001);
  return Array.from({ length: 14 }, () => ({ x: r() * 1600, y: 500 + r() * 40, r: 50 + r() * 60 }));
})();
const streaks = (() => {
  const r = mulberry32(9011);
  return Array.from({ length: 22 }, () => ({ y: 80 + r() * 330, ph: r(), v: 0.6 + r() * 0.8, l: 30 + r() * 60 }));
})();

// Everything in the Engine Halls behind the slimes
export function drawEngineHalls(ctx, camX, viewW, time, tick) {
  ctx.save();
  ctx.translate(camX, 0);
  drawSkyBehind(ctx, camX, time);
  ctx.restore();
  const L = camX - 140, R = camX + viewW + 140;
  drawBackWall(ctx, L, R, time);
  for (const x of BIG) if (visible(x - 260, x + 260, L, R)) drawTurbine(ctx, x, time);
  drawFloor(ctx, L, R);
  TURBINES.forEach((g, i) => {
    if (visible(g.x - g.w / 2 - 40, g.x + g.w / 2 + 40, L, R)) drawSlot(ctx, g, tick == null ? { k: 0, spin: false } : turbineAt(i, Math.floor(tick)), time);
  });
  if (visible(-40, 900, L, R)) drawBoilerGallery(ctx, time);
  for (const p of ENGINE_PLATFORMS) {
    if (!visible(p.x - 80, p.x + p.w + 80, L, R)) continue;
    if (p.kind === 'catwalk') drawCatwalk(ctx, p);
    else if (p.kind === 'gantry') drawGantry(ctx, p, time);
  }
  if (TELEGRAPH && visible(TELEGRAPH.x - 40, TELEGRAPH.x + TELEGRAPH.w + 40, L, R)) drawTelegraph(ctx, TELEGRAPH, time);
  // wind through the gratings: pale streaks going past
  ctx.save();
  ctx.translate(camX, 0);
  for (const s of streaks) {
    const x = ((s.ph + time * s.v * 0.4) % 1) * (W + 200) - 100 - ((camX * 0.2) % 200);
    ctx.strokeStyle = 'rgba(220,240,248,0.14)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, s.y);
    ctx.lineTo(x + s.l, s.y + 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Behind: the hall's far side is open to the sky high up (dusk over the clouds), and the dark iron roof over it
function drawSkyBehind(ctx, camX, time) {
  ctx.fillStyle = vgrad(ctx, 'en-sky', 0, H, [[0, '#14161e'], [0.35, '#2a3040'], [0.7, '#5a6a80'], [1, '#a8b8c8']]);
  ctx.fillRect(0, 0, W, H);
  for (const c of clouds) {
    const x = ((c.x - camX * 0.08) % 1600 + 1600) % 1600 - 300;
    ctx.fillStyle = 'rgba(230,236,244,0.35)';
    ellipse(ctx, x, c.y, c.r * 1.6, c.r * 0.4);
  }
  // the roof's ribs and hanging chains, dark
  ctx.fillStyle = 'rgba(20,20,28,0.85)';
  ctx.fillRect(0, 0, W, 34);
  ctx.strokeStyle = 'rgba(20,20,28,0.7)';
  ctx.lineWidth = 6;
  for (let i = 0; i < 9; i++) {
    const x = ((i * 220 - camX * 0.35) % (W + 220) + W + 220) % (W + 220) - 110;
    ctx.beginPath();
    ctx.moveTo(x, 30);
    ctx.lineTo(x + 30, 120);
    ctx.stroke();
  }
}

// The back wall: riveted iron panels, pipes running along it, pressure gauges, a red lamp here and there
function drawBackWall(ctx, L, R, time) {
  const top = GROUND - 310;
  ctx.fillStyle = vgrad(ctx, 'en-wall', top, GROUND, [[0, '#2e2c38'], [1, '#3e3c4a']]);
  ctx.fillRect(L, top, R - L, GROUND - top);
  const P = 120;
  for (let x = Math.floor(L / P) * P; x < R; x += P) {
    ctx.strokeStyle = 'rgba(20,18,28,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, top + 2, P - 4, GROUND - top - 4);
    ctx.fillStyle = 'rgba(110,106,126,0.5)';
    for (let y = top + 12; y < GROUND; y += 40) {
      circle(ctx, x + 8, y, 1.8);
      circle(ctx, x + P - 8, y, 1.8);
    }
  }
  for (const [y, c, w] of [[top + 30, BRASS_E, 10], [top + 52, IRON_L, 7], [GROUND - 40, '#7a4422', 12]]) {
    ctx.fillStyle = c;
    ctx.fillRect(L, y, R - L, w);
  }
  for (let x = Math.floor(L / 520) * 520 + 260; x < R; x += 520) { // gauges and red lamps
    ctx.fillStyle = '#efe4c8';
    circle(ctx, x, top + 90, 11);
    ctx.strokeStyle = BRASS_E;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, top + 90, 11, 0, TAU);
    ctx.stroke();
    const a = -0.8 + Math.sin(time * 0.7 + x) * 0.3;
    ctx.strokeStyle = '#1a1630';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, top + 90);
    ctx.lineTo(x + Math.cos(a) * 8, top + 90 + Math.sin(a) * 8);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,90,70,${0.4 + 0.4 * Math.max(0, Math.sin(time * 1.5 + x))})`;
    circle(ctx, x + 40, top + 84, 4);
  }
}

// One of the great turbines behind its glass wall: a huge round housing, blades turning, blue fire at its heart
function drawTurbine(ctx, x, time) {
  const cy = GROUND - 170, r = 140;
  blueGlow(ctx, x, cy, r * 1.4, 0.25);
  ctx.fillStyle = IRON_D;
  circle(ctx, x, cy, r + 14);
  ctx.fillStyle = '#16202a';
  circle(ctx, x, cy, r);
  const a0 = time * 1.6 + x;
  ctx.fillStyle = 'rgba(70,80,100,0.9)';
  for (let i = 0; i < 9; i++) {
    const a = a0 + (i / 9) * TAU;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 24, cy + Math.sin(a) * 24);
    ctx.quadraticCurveTo(x + Math.cos(a + 0.4) * r * 0.7, cy + Math.sin(a + 0.4) * r * 0.7, x + Math.cos(a + 0.2) * r * 0.96, cy + Math.sin(a + 0.2) * r * 0.96);
    ctx.lineTo(x + Math.cos(a + 0.42) * r * 0.96, cy + Math.sin(a + 0.42) * r * 0.96);
    ctx.quadraticCurveTo(x + Math.cos(a + 0.5) * r * 0.5, cy + Math.sin(a + 0.5) * r * 0.5, x + Math.cos(a + 0.25) * 24, cy + Math.sin(a + 0.25) * 24);
    ctx.closePath();
    ctx.fill();
  }
  const k = 0.7 + 0.3 * Math.sin(time * 5 + x);
  blueGlow(ctx, x, cy, 50, 0.6 * k);
  ctx.fillStyle = `rgba(230,255,252,${0.8 * k})`;
  circle(ctx, x, cy, 14);
  ctx.strokeStyle = 'rgba(200,230,240,0.25)'; // the glass, a highlight across it
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(x, cy, r - 20, -2.4, -1.6);
  ctx.stroke();
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, cy, r + 8, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = IRON; // the shaft going down through the floor
  ctx.fillRect(x - 18, cy + r + 10, 36, GROUND - cy - r - 10);
}

// The floor: an iron grating over the drop, clouds showing through it, a rail along the front edge
function drawFloor(ctx, L, R) {
  ctx.fillStyle = vgrad(ctx, 'en-drop', GROUND, H, [[0, '#4a5868'], [1, '#a8b8c8']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(L, GROUND - 3, R - L, 8);
  ctx.strokeStyle = 'rgba(30,30,40,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = Math.floor(L / 16) * 16; x < R; x += 16) {
    ctx.moveTo(x, GROUND + 5);
    ctx.lineTo(x - 10, GROUND + 26);
  }
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.fillRect(L, GROUND + 24, R - L, 5);
  ctx.strokeStyle = IRON_L; // the front rail
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(L, GROUND + 48);
  ctx.lineTo(R, GROUND + 48);
  for (let x = Math.floor(L / 80) * 80; x < R; x += 80) {
    ctx.moveTo(x, GROUND + 29);
    ctx.lineTo(x, GROUND + 48);
  }
  ctx.stroke();
}

// A turbine's slot in the catwalk floor: dark, a hazard stripe either side; as it spins up the slot glows and the grating
// shakes; spinning, the blades sweep up through it, a blur of iron and blue light
function drawSlot(ctx, g, st, time) {
  const x0 = g.x - g.w / 2, x1 = g.x + g.w / 2, b = GROUND;
  const shake = st.k > 0 && !st.spin ? Math.sin(time * 60) * st.k * 1.5 : 0;
  ctx.save();
  ctx.translate(0, shake);
  ctx.fillStyle = '#0e1016';
  ctx.fillRect(x0, b - 2, g.w, 10);
  for (const sx of [x0 - 14, x1]) { // the hazard stripes
    ctx.fillStyle = '#e8c440';
    ctx.fillRect(sx, b - 2, 14, 6);
    ctx.fillStyle = IRON_D;
    for (let i = 0; i < 3; i++) ctx.fillRect(sx + i * 5, b - 2, 2, 6);
  }
  if (st.k > 0) {
    ctx.fillStyle = `rgba(${AETHER},${0.15 + 0.35 * st.k})`;
    ctx.fillRect(x0, b - 4, g.w, 6);
    blueGlow(ctx, g.x, b, g.w * 0.6, 0.2 * st.k);
  }
  if (st.spin) { // the blades coming round, up through the floor
    const a0 = time * 18;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 - 20, b - 140, g.w + 40, 142);
    ctx.clip();
    for (let i = 0; i < 4; i++) {
      const a = a0 + (i / 4) * TAU, cx = g.x, cy = b + 60;
      ctx.strokeStyle = 'rgba(110,106,126,0.85)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * (g.w * 0.55), cy + Math.sin(a) * 180);
      ctx.stroke();
      ctx.strokeStyle = `rgba(${AETHER},0.4)`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(${AETHER},0.12)`;
    ctx.fillRect(x0, b - 130, g.w, 130);
    ctx.restore();
  }
  ctx.restore();
}

// The Boiler Gallery: the blast door from inside (open, a little steam still leaking), and Number Nine's furnace, its
// mouth open on the blue fire, a coke bunker beside it, a shift board on the wall with twelve pegs and one tag still hung
function drawBoilerGallery(ctx, time) {
  const b = GROUND, dx = ENGINE_EXIT_X + 10;
  ctx.fillStyle = IRON_D; // the blast door's frame, the door swung back
  ctx.beginPath();
  ctx.roundRect(dx - 70, b - 216, 140, 216, 12);
  ctx.fill();
  ctx.fillStyle = 'rgba(190,160,255,0.18)'; // the Spire's dusk beyond
  ctx.beginPath();
  ctx.roundRect(dx - 56, b - 200, 112, 200, 9);
  ctx.fill();
  ctx.fillStyle = IRON;
  ctx.fillRect(dx + 56, b - 200, 16, 200);
  const k = (time * 0.4) % 1;
  ctx.fillStyle = `rgba(220,226,232,${0.25 * (1 - k)})`;
  circle(ctx, dx + 70, b - 150 - k * 40, 8 + k * 16);
  // the furnace
  const fx = NINE_X + 110;
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.roundRect(fx - 70, b - 170, 140, 170, [40, 40, 6, 6]);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 3;
  ctx.stroke();
  const fk = 0.7 + 0.3 * Math.sin(time * 6);
  blueGlow(ctx, fx, b - 60, 110, 0.35 * fk);
  ctx.fillStyle = '#0e1418';
  ctx.beginPath();
  ctx.roundRect(fx - 40, b - 96, 80, 60, 10);
  ctx.fill();
  ctx.fillStyle = `rgba(${AETHER},${0.55 + 0.3 * fk})`;
  for (let i = 0; i < 5; i++) {
    const h = 18 + 14 * Math.abs(Math.sin(time * 5 + i * 1.7));
    ctx.beginPath();
    ctx.ellipse(fx - 28 + i * 14, b - 40 - h / 2, 6, h / 2, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = IRON_L; // the door swung up over the mouth
  ctx.fillRect(fx - 44, b - 110, 88, 10);
  ctx.fillStyle = IRON; // the flue going up
  ctx.fillRect(fx - 16, 0, 32, b - 170);
  // the coke bunker
  ctx.fillStyle = IRON;
  ctx.fillRect(fx + 76, b - 60, 70, 60);
  ctx.fillStyle = '#5a6a74';
  for (let i = 0; i < 9; i++) circle(ctx, fx + 84 + (i % 5) * 13, b - 62 - Math.floor(i / 5) * 8, 6);
  // the shift board: twelve pegs, one tag left (NINE)
  const sx = NINE_X - 150, sy = b - 200;
  ctx.fillStyle = '#5a3a2a';
  ctx.fillRect(sx, sy, 110, 70);
  ctx.strokeStyle = '#2e1e14';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx, sy, 110, 70);
  for (let i = 0; i < 12; i++) {
    const px = sx + 14 + (i % 6) * 16, py = sy + 18 + Math.floor(i / 6) * 28;
    ctx.fillStyle = BRASS_D;
    circle(ctx, px, py, 2);
    if (i === 8) {
      ctx.fillStyle = '#efe4c8';
      ctx.fillRect(px - 5, py + 2, 10, 12);
      ctx.font = "700 8px Fredoka, 'Trebuchet MS', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#2a1e14';
      ctx.fillText('9', px, py + 8);
    }
  }
}

// A catwalk: an iron grating on brackets, a handrail, the drop showing through
function drawCatwalk(ctx, p) {
  const { x, y, w } = p;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 4;
  for (const bx of [x + 16, x + w - 16]) {
    ctx.beginPath();
    ctx.moveTo(bx, y + 4);
    ctx.lineTo(bx + (bx < x + w / 2 ? -14 : 14), y + 46);
    ctx.stroke();
  }
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 9, 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,20,28,0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let gx = x + 6; gx < x + w; gx += 10) {
    ctx.moveTo(gx, y - 3);
    ctx.lineTo(gx - 4, y + 4);
  }
  ctx.stroke();
  ctx.strokeStyle = IRON_L;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 28);
  ctx.lineTo(x + w - 4, y - 28);
  for (let rx = x + 6; rx < x + w; rx += 30) {
    ctx.moveTo(rx, y - 28);
    ctx.lineTo(rx, y - 4);
  }
  ctx.stroke();
}

// A gantry: a heavier iron deck hung from the roof on two rods, a lamp under it
function drawGantry(ctx, p, time) {
  const { x, y, w } = p;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const rx of [x + 12, x + w - 12]) {
    ctx.moveTo(rx, y);
    ctx.lineTo(rx, 0);
  }
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 12, 3);
  ctx.fill();
  ctx.fillStyle = IRON_L;
  ctx.fillRect(x, y - 4, w, 2);
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(x + w / 2 - 6, y + 8, 12, 6);
  const k = 0.7 + 0.3 * Math.sin(time * 2 + x);
  ctx.fillStyle = `rgba(${AETHER},${0.8 * k})`;
  circle(ctx, x + w / 2, y + 18, 4);
}

// The find: the engine-room telegraph on the top gantry: a brass pillar with a round dial (FULL AHEAD · HALF · STOP ·
// ASTERN, worn), its handle stopped hard at FULL AHEAD, and a paper tag tied to the handle in a neat hand: HOLD
function drawTelegraph(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 10, 3);
  ctx.fill();
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(cx - 5, y - 40, 10, 36);
  ctx.fillStyle = BRASS;
  circle(ctx, cx, y - 54, 16);
  ctx.fillStyle = '#efe4c8';
  circle(ctx, cx, y - 54, 12);
  ctx.strokeStyle = 'rgba(42,30,20,0.6)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + (i / 4) * Math.PI;
    ctx.moveTo(cx + Math.cos(a) * 8, y - 54 + Math.sin(a) * 8);
    ctx.lineTo(cx + Math.cos(a) * 12, y - 54 + Math.sin(a) * 12);
  }
  ctx.stroke();
  const ha = -Math.PI * 0.92; // the handle, stopped hard at FULL AHEAD
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, y - 54);
  ctx.lineTo(cx + Math.cos(ha) * 20, y - 54 + Math.sin(ha) * 20);
  ctx.stroke();
  const tx = cx + Math.cos(ha) * 18, ty = y - 54 + Math.sin(ha) * 18 + 3; // the tag on it
  const sw = Math.sin(time * 1.3) * 0.15;
  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(sw);
  ctx.strokeStyle = 'rgba(200,190,160,0.8)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 5);
  ctx.stroke();
  ctx.fillStyle = '#efe4c8';
  ctx.fillRect(-8, 5, 16, 9);
  ctx.font = "700 5px Fredoka, 'Trebuchet MS', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2a1e14';
  ctx.fillText('HOLD', 0, 9.5);
  ctx.restore();
  ctx.fillStyle = `rgba(150,240,234,${0.06 + 0.04 * Math.sin(time * 1.2)})`; // a faint light, so it can be found
  ellipse(ctx, cx, y - 40, w * 0.6, 26);
}
