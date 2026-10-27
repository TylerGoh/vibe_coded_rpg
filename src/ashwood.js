// Docs: docs/places/ashwood.md
// The Ashwood (room ASHWOOD, data in src/shared/rpg.js): the windward outer slope north of Cinder Flats, up the old
// charcoal road, where the old forest was cut and burned for charcoal to feed the foundry. Standing charcoal trunks,
// black and cracked, ash coming down like rain, grey ash underfoot, and ferns coming back (thick at the bottom of the
// slope, a few brave ones near the top). You come in at the EAST end and climb west: Collier's Clearing (no mobs:
// Collier Pitch's turf hut and his smoking clamps, a deadwood pile; the Kiln Stone, drawn by src/ruins.js, and the
// waystone, src/waystones.js), the Fern Slope, the Charcoal Stands (fallen trunks, a great burnt trunk broken off,
// ASH_PLATFORMS) and the Burnt Crown, the bare top of the slope where Greyback walks. The Old Foundry's bricked-up
// adit at the west end is a gate (src/branch-gates.js). The Green Tree, the last living tree of the old forest, grows
// in a hidden hollow high over the Charcoal Stands (last in ASH_PLATFORMS). Behind: a low grey sky, the sea far
// below to the north, the other islands, the island's smoke column leaning in from the south. Paints its own sky.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { ASH_W, ASH_EXIT_X, ASH_ZONES, ASH_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';

const GROUND = FIELD_GROUND;
const HORIZON = 250;
const GREEN = ASH_PLATFORMS.at(-1);
const CHAR = '#2e282c', CHAR_D = '#1a1618', CHAR_L = '#4a4248';
const FERN = '#6aa05a', FERN_D = '#4a7a40';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
// ash coming down like rain: long grey streaks and slower flakes
const rain = (() => {
  const r = mulberry32(551);
  return Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H, v: 90 + r() * 70, l: 8 + r() * 10, a: 0.18 + r() * 0.25 }));
})();
const flakes = (() => {
  const r = mulberry32(553);
  return Array.from({ length: 40 }, () => ({ x: r() * W, y: r() * H, s: 0.8 + r() * 1.4, v: 10 + r() * 14, p: r() * TAU }));
})();
// far charcoal trunks on the slope behind (parallax), x in a 1600 px loop
const farTrunks = (() => {
  const r = mulberry32(557);
  return Array.from({ length: 34 }, () => ({ x: r() * 1600, h: 50 + r() * 90, lean: (r() - 0.5) * 0.12, b: r() < 0.5 }));
})();
// standing charcoal trunks in the room itself (behind the slimes), thinning out near the clearing
const TRUNKS = (() => {
  const r = mulberry32(559);
  const out = [];
  for (let x = 120; x < 4100; x += 150 + r() * 170) {
    if (ASH_PLATFORMS.some((p) => p.kind === 'stump' && x > p.x - 40 && x < p.x + p.w + 40)) continue;
    out.push({ x, h: 150 + r() * 170, w: 12 + r() * 10, top: r(), lean: (r() - 0.5) * 0.08, branch: r() < 0.6 ? (r() < 0.5 ? -1 : 1) : 0, glow: r() < 0.25 });
  }
  return out;
})();
// ferns: thick near the clearing, few up on the Crown (the forest coming back from the bottom)
const FERNS = (() => {
  const r = mulberry32(563);
  const out = [];
  for (let x = 40; x < ASH_W; x += 30 + r() * 60) {
    const thick = Math.min(1, Math.max(0.08, (x - 600) / 3800));
    if (r() < thick) out.push({ x, h: 14 + r() * 16 * (0.6 + thick), d: r() < 0.5 ? -1 : 1, p: r() * TAU });
  }
  return out;
})();
const CLAMPS = [{ x: 4300, w: 110 }, { x: 4410, w: 80 }];
const HUT = ASH_PLATFORMS.find((p) => p.kind === 'hut');

// Everything in the Ashwood behind the slimes
export function drawAshwood(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0); // sky and slope behind in screen space
  drawSky(ctx, camX, time);
  ctx.restore();

  const L = camX - 160, R = camX + viewW + 160;
  drawGround(ctx, Math.max(0, L), Math.min(ASH_W, R));
  for (const t of TRUNKS) if (visible(t.x - 60, t.x + 60, L, R)) drawTrunk(ctx, t, time);
  if (visible(4200, 4480, L, R)) for (const c of CLAMPS) drawClamp(ctx, c, time);
  if (visible(HUT.x - 120, HUT.x + HUT.w + 80, L, R)) drawHut(ctx, HUT, time);
  if (visible(4140, 4260, L, R)) drawWoodpile(ctx, 4165);
  for (const p of ASH_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'ledge') drawLedge(ctx, p);
    else if (p.kind === 'log') drawLog(ctx, p, time);
    else if (p.kind === 'stump') drawStump(ctx, p, time);
  }
  if (visible(GREEN.x - 120, GREEN.x + GREEN.w + 120, L, R)) drawGreenTree(ctx, GREEN, time);
  for (const f of FERNS) if (visible(f.x - 20, f.x + 20, L, R)) drawFern(ctx, f.x, GROUND + 2, f.h, f.d, time + f.p);
  ASH_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x1 - 30; // you walk in from the east: each zone's sign stands at its east edge
    if (visible(sx - 90, sx + 90, L, R)) drawZoneSign(ctx, sx, z, i);
  });
  if (visible(ASH_EXIT_X - 260, ASH_W, L, R)) drawExitSign(ctx, ASH_EXIT_X - 110, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawAir(ctx, camX, time);
  ctx.restore();
}

// ——— the sky and the slope behind ———
let skyGrad = null, seaGrad = null, gradCtx = null;
function drawSky(ctx, camX, time) {
  if (gradCtx !== ctx) {
    gradCtx = ctx;
    skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON);
    skyGrad.addColorStop(0, '#5a5262');
    skyGrad.addColorStop(0.6, '#8a8290');
    skyGrad.addColorStop(1, '#b8aeb4');
    seaGrad = ctx.createLinearGradient(0, HORIZON, 0, GROUND);
    seaGrad.addColorStop(0, '#a8a8b0');
    seaGrad.addColorStop(1, '#6a7480');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  // the island's smoke column, leaning in from the south (behind you, over the cone)
  const sx = W * 0.85 - camX * 0.03 + 120;
  for (let i = 0; i < 14; i++) {
    const k = (i / 14 + time * 0.008) % 1;
    ctx.fillStyle = `rgba(80,70,80,${0.4 * (1 - k * 0.6)})`;
    circle(ctx, sx - k * k * 300 + Math.sin(i * 1.7 + time * 0.2) * 14, 220 - k * 280, 34 + k * 80);
  }
  drawDistantIslands(ctx, { from: 'ember', scroll: camX, roomW: ASH_W, time, horizon: HORIZON, haze: '#b8aeb4', fade: 0.7, scale: 0.5, night: 0.15, sky: 200 });
  // the sea, far below to the north, grey under the ash
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, HORIZON, W, 60);
  ctx.fillStyle = 'rgba(240,236,240,0.4)';
  ctx.fillRect(0, HORIZON, W, 1.2);
  // low clouds of ash dragging along the slope
  for (let i = 0; i < 5; i++) {
    const x = ((((i * 410 - camX * 0.08 + time * 6) % 2050) + 2050) % 2050) - 300;
    ctx.fillStyle = 'rgba(150,142,150,0.35)';
    ellipse(ctx, x, 90 + (i % 3) * 30, 170, 22);
  }
  // the slope behind, two layers, bristling with far charcoal trunks
  slopeLayer(ctx, camX, 0.15, HORIZON + 10, '#7a7078', 0.6, time);
  slopeLayer(ctx, camX, 0.3, HORIZON + 50, '#5e565e', 1, time);
}
function slopeLayer(ctx, camX, f, y0, color, sc, time) {
  // the slope rises toward the west (the top of the hill is where you're climbing)
  const off = camX * f;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 40) {
    const wx = x + off;
    const y = y0 - 50 * sc * (1 - Math.min(1, Math.max(0, wx / (ASH_W * f + W)))) + Math.sin(wx * 0.006) * 10 * sc;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (const t of farTrunks) {
    const x = ((((t.x - off) % 1600) + 1600) % 1600) - 200;
    if (x < -20 || x > W + 20) continue;
    const wx = x + off;
    const base = y0 - 50 * sc * (1 - Math.min(1, Math.max(0, wx / (ASH_W * f + W)))) + Math.sin(wx * 0.006) * 10 * sc + 4;
    const hh = t.h * sc * 0.6;
    ctx.lineWidth = 3 * sc + 1;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.lineTo(x + t.lean * hh, base - hh);
    if (t.b) {
      ctx.moveTo(x + t.lean * hh * 0.6, base - hh * 0.6);
      ctx.lineTo(x + t.lean * hh * 0.6 + 10 * sc, base - hh * 0.8);
    }
    ctx.stroke();
  }
  void time;
}

// Ash coming down like rain, slanting in on the wind off the sea, and slower flakes drifting
function drawAir(ctx, camX, time) {
  ctx.strokeStyle = '#a8a0a8';
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  for (const d of rain) {
    const y = (d.y + time * d.v) % (H + 20) - 10;
    const x = ((((d.x - camX * 0.4 - y * 0.25) % W) + W) % W);
    ctx.globalAlpha = d.a;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - d.l * 0.25, y + d.l);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(190,182,188,0.6)';
  for (const a of flakes) {
    const y = (a.y + time * a.v) % H;
    const x = ((((a.x - camX * 0.3 + Math.sin(time * 0.7 + a.p) * 16) % W) + W) % W);
    circle(ctx, x, y, a.s);
  }
}

// ——— the ground ———

// Grey ash over dark soil, streaked, with a little glint of a live ember here and there
function drawGround(ctx, L, R) {
  if (R <= L) return;
  ctx.fillStyle = '#4a4248';
  ctx.fillRect(L, GROUND - 4, R - L, H - GROUND + 4);
  ctx.fillStyle = '#8a8288';
  ctx.beginPath();
  ctx.moveTo(L, GROUND + 2);
  for (let x = Math.floor(L / 30) * 30; x <= R + 30; x += 30) ctx.lineTo(x, GROUND - 3 + Math.sin(x * 0.05) * 1.6);
  ctx.lineTo(R + 30, GROUND + 6);
  ctx.lineTo(L, GROUND + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6a6268';
  for (let x = Math.floor(L / 70) * 70; x < R; x += 70) {
    const k = Math.sin(x * 1.37) * 0.5 + 0.5;
    ellipse(ctx, x + 20, GROUND + 18 + k * 30, 26 + k * 14, 3);
    ellipse(ctx, x + 50, GROUND + 50 + k * 20, 18, 2.4);
  }
  // the old charcoal road through the clearing: cart ruts in the ash
  if (R > 4100) {
    ctx.strokeStyle = 'rgba(40,34,38,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.max(L, 4100), GROUND + 8);
    ctx.lineTo(R, GROUND + 8);
    ctx.moveTo(Math.max(L, 4100), GROUND + 16);
    ctx.lineTo(R, GROUND + 16);
    ctx.stroke();
  }
}

// A standing charcoal trunk: black, cracked into little squares like burnt wood is, its top snapped off, maybe one
// stub of a branch; now and then a live red glow deep in a crack
function drawTrunk(ctx, t, time) {
  ctx.save();
  ctx.translate(t.x, GROUND + 2);
  ctx.rotate(t.lean);
  const h = t.h, w = t.w;
  ctx.fillStyle = CHAR;
  ctx.beginPath();
  ctx.moveTo(-w * 0.8, 0);
  ctx.quadraticCurveTo(-w * 0.5, -10, -w * 0.5, -24);
  ctx.lineTo(-w * 0.42, -h);
  ctx.lineTo(-w * 0.1, -h - 10 - t.top * 14);
  ctx.lineTo(w * 0.12, -h + 4);
  ctx.lineTo(w * 0.44, -h - 6 * t.top);
  ctx.lineTo(w * 0.5, -24);
  ctx.quadraticCurveTo(w * 0.5, -10, w * 0.8, 0);
  ctx.closePath();
  ctx.fill();
  // the lit side, and the cracks
  ctx.fillStyle = CHAR_L;
  ctx.fillRect(-w * 0.42, -h + 10, w * 0.22, h - 30);
  ctx.strokeStyle = CHAR_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -h + 14; y < -20; y += 11) {
    ctx.moveTo(-w * 0.46, y);
    ctx.lineTo(w * 0.46, y + 1);
    const o = (y / 11) % 2 ? -w * 0.1 : w * 0.16;
    ctx.moveTo(o, y);
    ctx.lineTo(o, y + 11);
  }
  ctx.stroke();
  if (t.branch) {
    ctx.strokeStyle = CHAR;
    ctx.lineWidth = w * 0.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.66);
    ctx.lineTo(t.branch * w * 1.6, -h * 0.78);
    ctx.stroke();
  }
  if (t.glow) {
    const k = 0.5 + 0.5 * Math.sin(time * 1.3 + t.x);
    ctx.fillStyle = `rgba(255,110,50,${0.35 + 0.35 * k})`;
    ellipse(ctx, w * 0.1, -h * 0.4, 2, 5);
  }
  ctx.restore();
}

// A fern: a few fronds unrolling out of the ash
function drawFern(ctx, x, y, h, d, t) {
  const sway = Math.sin(t * 1.2) * 1.5;
  ctx.strokeStyle = FERN_D;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  for (const [dx, k] of [[-1, 0.8], [0, 1], [1, 0.7]]) {
    const ex = x + dx * h * 0.5 * d + sway, ey = y - h * k;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + dx * h * 0.2 * d, y - h * k * 0.7, ex, ey);
    ctx.stroke();
  }
  ctx.strokeStyle = FERN;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const [dx, k] of [[-1, 0.8], [0, 1], [1, 0.7]]) {
    for (let s = 0.3; s < 0.95; s += 0.17) {
      const px = x + dx * h * 0.5 * d * s * s + sway * s, py = y - h * k * s;
      ctx.moveTo(px, py);
      ctx.lineTo(px - 4, py - 2.5);
      ctx.moveTo(px, py);
      ctx.lineTo(px + 4, py - 2.5);
    }
  }
  ctx.stroke();
  ctx.beginPath(); // a fiddlehead still curled up
  ctx.arc(x + d * 5, y - h * 0.5, 2.4, 0, Math.PI * 1.5);
  ctx.stroke();
}

// A rock ledge (a platform): black basalt jutting out of the slope, ash drifted on top
function drawLedge(ctx, p) {
  const top = p.y, bottom = GROUND + 2;
  ctx.fillStyle = '#3e3640';
  ctx.beginPath();
  ctx.moveTo(p.x + 10, top);
  ctx.lineTo(p.x + p.w - 10, top);
  ctx.quadraticCurveTo(p.x + p.w + 6, top + 6, p.x + p.w - 6, top + 34);
  ctx.lineTo(p.x + p.w * 0.7, bottom);
  ctx.lineTo(p.x + p.w * 0.3, bottom);
  ctx.lineTo(p.x + 6, top + 34);
  ctx.quadraticCurveTo(p.x - 6, top + 6, p.x + 10, top);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2a242c';
  ctx.fillRect(p.x + p.w * 0.55, top + 16, p.w * 0.12, bottom - top - 16);
  ctx.fillStyle = '#9a9298';
  ctx.beginPath();
  ctx.roundRect(p.x + 2, top - 4, p.w - 4, 8, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(p.x + 8, top - 2, p.w * 0.4, 2);
}

// A fallen charcoal trunk (a platform), propped on a stump at one end and a rock at the other
function drawLog(ctx, p, time) {
  const top = p.y, r = 13;
  ctx.fillStyle = CHAR_D;
  ctx.fillRect(p.x + 14, top + r, 12, GROUND - top - r);
  ctx.fillStyle = '#3e3640';
  ctx.beginPath();
  ctx.roundRect(p.x + p.w - 40, top + r, 30, GROUND - top - r + 2, 6);
  ctx.fill();
  ctx.fillStyle = CHAR;
  ctx.beginPath();
  ctx.roundRect(p.x, top - 2, p.w, r * 2, r);
  ctx.fill();
  ctx.strokeStyle = CHAR_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = p.x + 16; x < p.x + p.w - 10; x += 13) {
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + r * 2 - 4);
  }
  ctx.moveTo(p.x + 6, top + r);
  ctx.lineTo(p.x + p.w - 6, top + r);
  ctx.stroke();
  ctx.fillStyle = '#5a4a40'; // the cut end's rings
  ellipse(ctx, p.x + p.w - 4, top + r - 2, 6, r - 1);
  ctx.strokeStyle = CHAR_D;
  ctx.beginPath();
  ctx.ellipse(p.x + p.w - 4, top + r - 2, 3, r * 0.5, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#9a9298'; // ash on top
  ctx.beginPath();
  ctx.roundRect(p.x + 4, top - 4, p.w - 10, 5, 3);
  ctx.fill();
  // a fern growing out of the old wood
  drawFern(ctx, p.x + p.w * 0.5, top - 1, 12, 1, time + p.x);
}

// The great burnt trunk in the Charcoal Stands (a platform at its broken top): the old forest's biggest, snapped off
// high up, hollow at its foot; the way up to the Green Tree is from its top
function drawStump(ctx, p, time) {
  const top = p.y;
  ctx.fillStyle = CHAR;
  ctx.beginPath();
  ctx.moveTo(p.x - 30, GROUND + 2);
  ctx.quadraticCurveTo(p.x + 4, GROUND - 30, p.x + 8, GROUND - 70);
  ctx.lineTo(p.x + 4, top + 6);
  ctx.lineTo(p.x + p.w - 4, top + 6);
  ctx.lineTo(p.x + p.w - 8, GROUND - 70);
  ctx.quadraticCurveTo(p.x + p.w - 4, GROUND - 30, p.x + p.w + 30, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = CHAR_L;
  ctx.fillRect(p.x + 18, top + 16, 18, GROUND - top - 40);
  ctx.strokeStyle = CHAR_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = top + 18; y < GROUND - 20; y += 13) {
    ctx.moveTo(p.x + 8, y);
    ctx.lineTo(p.x + p.w - 8, y + 1);
    for (let x = p.x + 20 + ((y / 13) % 2) * 12; x < p.x + p.w - 10; x += 26) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 13);
    }
  }
  ctx.stroke();
  // the hollow at its foot, a red glow far inside
  ctx.fillStyle = CHAR_D;
  ctx.beginPath();
  ctx.ellipse(p.x + p.w * 0.5, GROUND - 2, 22, 34, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = `rgba(255,110,50,${0.25 + 0.15 * Math.sin(time * 1.1)})`;
  ellipse(ctx, p.x + p.w * 0.5, GROUND - 12, 8, 6);
  // its jagged broken top (the platform)
  ctx.fillStyle = CHAR;
  ctx.beginPath();
  ctx.moveTo(p.x, top + 8);
  ctx.lineTo(p.x + 6, top - 4);
  ctx.lineTo(p.x + 30, top);
  ctx.lineTo(p.x + 56, top - 8);
  ctx.lineTo(p.x + 90, top - 1);
  ctx.lineTo(p.x + 120, top - 10);
  ctx.lineTo(p.x + p.w - 6, top - 2);
  ctx.lineTo(p.x + p.w, top + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#9a9298';
  ctx.beginPath();
  ctx.roundRect(p.x + 4, top - 3, p.w - 8, 5, 3);
  ctx.fill();
}

// The Green Tree: a hidden hollow in the rock high over the Charcoal Stands, out of the smoke, where the last living
// tree of the old forest grows: a small, thick, stubborn tree in full green leaf, its roots gripping the rock; a
// ring of ferns round it, a dented tin cup left for watering, and the ash falls round it but not on it
function drawGreenTree(ctx, p, time) {
  const top = p.y;
  // the rock that holds the hollow (a jut of the slope, behind the trunk's top)
  ctx.fillStyle = '#3e3640';
  ctx.beginPath();
  ctx.moveTo(p.x - 40, top + 70);
  ctx.quadraticCurveTo(p.x - 50, top + 10, p.x - 10, top - 4);
  ctx.lineTo(p.x + p.w + 20, top - 2);
  ctx.quadraticCurveTo(p.x + p.w + 60, top + 20, p.x + p.w + 30, top + 80);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2a242c';
  ellipse(ctx, p.x + p.w * 0.5, top + 34, 40, 20);
  ctx.fillStyle = '#5a4a40'; // a lip of earth to stand on
  ctx.beginPath();
  ctx.roundRect(p.x - 4, top - 4, p.w + 8, 8, 4);
  ctx.fill();
  // the tree
  const tx = p.x + p.w * 0.62, sway = Math.sin(time * 0.9) * 2;
  ctx.strokeStyle = '#6a4a3a';
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(tx, top - 2);
  ctx.quadraticCurveTo(tx - 6, top - 30, tx + 2 + sway * 0.3, top - 56);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tx - 3, top - 30);
  ctx.lineTo(tx - 20 + sway * 0.4, top - 48);
  ctx.moveTo(tx, top - 42);
  ctx.lineTo(tx + 18 + sway * 0.4, top - 58);
  ctx.moveTo(tx - 2, top - 2); // roots over the rock
  ctx.quadraticCurveTo(tx - 16, top + 2, tx - 26, top + 14);
  ctx.moveTo(tx + 2, top - 2);
  ctx.quadraticCurveTo(tx + 18, top + 4, tx + 24, top + 18);
  ctx.stroke();
  // its crown, full green
  const crown = [[0, -70, 26], [-18, -58, 18], [18, -60, 20], [-6, -84, 16], [12, -80, 14]];
  ctx.fillStyle = '#4a8a46';
  for (const [dx, dy, r] of crown) circle(ctx, tx + dx + sway, top + dy, r);
  ctx.fillStyle = '#6aaa5a';
  for (const [dx, dy, r] of crown) circle(ctx, tx + dx - 3 + sway, top + dy - 4, r * 0.7);
  ctx.fillStyle = '#9ad07a';
  for (const [dx, dy, r] of crown) circle(ctx, tx + dx - 6 + sway, top + dy - 8, r * 0.3);
  // a soft light on it: the one bright thing on the slope
  const g = ctx.createRadialGradient(tx, top - 60, 4, tx, top - 60, 70);
  g.addColorStop(0, 'rgba(220,255,200,0.18)');
  g.addColorStop(1, 'rgba(220,255,200,0)');
  ctx.fillStyle = g;
  circle(ctx, tx, top - 60, 70);
  // ferns round its foot and the tin cup
  drawFern(ctx, p.x + 14, top, 14, -1, time);
  drawFern(ctx, p.x + p.w - 6, top, 12, 1, time + 1);
  ctx.fillStyle = '#9a9ca8';
  ctx.beginPath();
  ctx.roundRect(p.x + 26, top - 11, 9, 10, 2);
  ctx.fill();
  ctx.strokeStyle = '#6a6c78';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(p.x + 37, top - 6, 3, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
}

// A charcoal clamp: a low dome of earth and turf over stacked deadwood, smoke leaking from its vents, a red glow at
// its foot where the earth has slipped
function drawClamp(ctx, c, time) {
  const x = c.x, w = c.w;
  ctx.fillStyle = '#4a3e3a';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, GROUND + 2);
  ctx.quadraticCurveTo(x - w * 0.4, GROUND - w * 0.5, x, GROUND - w * 0.52);
  ctx.quadraticCurveTo(x + w * 0.4, GROUND - w * 0.5, x + w / 2, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5e5048';
  ellipse(ctx, x - w * 0.14, GROUND - w * 0.34, w * 0.18, w * 0.08, -0.3);
  ctx.fillStyle = FERN_D; // turf patches
  for (const dx of [-0.3, 0.1, 0.3]) ellipse(ctx, x + dx * w, GROUND - w * (0.3 - Math.abs(dx) * 0.4), 7, 3);
  ctx.fillStyle = `rgba(255,110,50,${0.4 + 0.2 * Math.sin(time * 1.6 + x)})`;
  ellipse(ctx, x + w * 0.28, GROUND - 3, 7, 3);
  for (let i = 0; i < 5; i++) {
    const k = (time * 0.18 + i / 5 + x * 0.001) % 1;
    ctx.fillStyle = `rgba(140,130,138,${0.45 * (1 - k)})`;
    circle(ctx, x + Math.sin(k * 5 + i) * 10 - k * 30, GROUND - w * 0.52 - k * 120, 8 + k * 22);
  }
}

// Pitch's turf hut (its roof is a platform): log walls, a turf roof growing ferns, a low door, a stool and a lantern
function drawHut(ctx, p, time) {
  const top = p.y, x0 = p.x + 10, x1 = p.x + p.w - 10;
  ctx.fillStyle = '#4a3a34';
  ctx.fillRect(x0, top + 10, x1 - x0, GROUND - top - 8);
  ctx.strokeStyle = '#2e2420';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let y = top + 22; y < GROUND; y += 12) {
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#1e1818'; // the low door
  ctx.beginPath();
  ctx.roundRect(x0 + 18, GROUND - 58, 32, 60, [14, 14, 0, 0]);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,190,110,0.5)'; // a little window, lit
  ctx.fillRect(x1 - 42, top + 32, 18, 14);
  ctx.fillStyle = '#5a6a44'; // the turf roof
  ctx.beginPath();
  ctx.moveTo(p.x, top + 14);
  ctx.quadraticCurveTo(p.x + p.w / 2, top - 10, p.x + p.w, top + 14);
  ctx.lineTo(p.x + p.w, top + 4);
  ctx.quadraticCurveTo(p.x + p.w / 2, top - 6, p.x, top + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6a7a50';
  ctx.beginPath();
  ctx.roundRect(p.x, top - 2, p.w, 8, 4);
  ctx.fill();
  drawFern(ctx, p.x + 30, top, 12, -1, time);
  drawFern(ctx, p.x + p.w - 24, top, 10, 1, time + 2);
  // a lantern on a hook by the door
  const lx = x0 + 60, ly = GROUND - 66;
  ctx.strokeStyle = '#3a3034';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lx, ly - 10);
  ctx.lineTo(lx, ly - 4);
  ctx.stroke();
  const g = ctx.createRadialGradient(lx, ly + 4, 1, lx, ly + 4, 26);
  g.addColorStop(0, `rgba(255,200,120,${0.5 + 0.1 * Math.sin(time * 3)})`);
  g.addColorStop(1, 'rgba(255,160,80,0)');
  ctx.fillStyle = g;
  circle(ctx, lx, ly + 4, 26);
  ctx.fillStyle = '#ffd08a';
  ctx.beginPath();
  ctx.roundRect(lx - 4, ly - 4, 8, 12, 2);
  ctx.fill();
}

// Deadwood stacked for the next burn: only fallen branches, grey and bare
function drawWoodpile(ctx, x) {
  ctx.fillStyle = '#5a5258';
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 5 - r; i++) {
      const cx = x + i * 18 + r * 9, cy = GROUND - 7 - r * 13;
      ctx.beginPath();
      ctx.roundRect(cx - 8, cy - 6, 16, 12, 6);
      ctx.fill();
      ctx.fillStyle = '#8a7a6a';
      ellipse(ctx, cx + 6, cy, 3, 5);
      ctx.fillStyle = '#5a5258';
    }
  }
}

// Each zone's sign: a charred board on two posts with the zone's name and levels (red for the deepest)
function drawZoneSign(ctx, x, z, i) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(140, ctx.measureText(z.name).width + 30);
  ctx.fillStyle = CHAR;
  ctx.fillRect(x - tw / 2 + 10, GROUND - 92, 5, 92);
  ctx.fillRect(x + tw / 2 - 15, GROUND - 92, 5, 92);
  ctx.save();
  ctx.translate(x, GROUND - 66);
  ctx.fillStyle = '#a89480';
  ctx.strokeStyle = CHAR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 46, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(40,30,30,0.25)'; // scorched corner
  ellipse(ctx, tw / 2 - 16, 16, 18, 8);
  text(ctx, z.name, 0, -6, 15, '#3a2a26');
  const red = i === 0;
  ctx.fillStyle = red ? '#d0485a' : 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-32, 6, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 14.5, 11, red ? '#fffaf0' : '#3a2a26');
  ctx.fillStyle = 'rgba(160,152,158,0.85)'; // ash settled on top
  ctx.beginPath();
  ctx.roundRect(-tw / 2 - 2, -23, tw + 4, 5, 3);
  ctx.fill();
  ctx.restore();
}

// The way back down the charcoal road
function drawExitSign(ctx, x, time) {
  ctx.fillStyle = '#4a3a34';
  ctx.fillRect(x - 3, GROUND - 92, 6, 94);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.6) * 0.03);
  ctx.fillStyle = '#c8b498';
  ctx.strokeStyle = '#6a4a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-64, -12);
  ctx.lineTo(58, -12);
  ctx.lineTo(70, 0);
  ctx.lineTo(58, 12);
  ctx.lineTo(-64, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Cinder Flats', 0, 1, 12, '#4a3440');
  ctx.fillStyle = '#d0485a';
  ctx.fillRect(-3, 12, 6, 10);
  ctx.restore();
}
