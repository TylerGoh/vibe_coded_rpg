// Docs: docs/places/forgehold.md
// Forgehold (room FORGEHOLD, src/shared/rpg.js): Emberdeep's landing and its town, with Black Sand Shore as its
// waterfront. West to east: black sand and the beach path out to the Black Sands (blocked by a geyser: its
// gate is drawn by src/branch-gates.js), the rusted iron quay where the Lodestar ties up (her gangway is a
// door, FORGE_DOCK_X), Auntie Soot's springs (a bathhouse of stacked stone over steaming pools), then the town
// cut into the caldera's outer wall: ledges joined by chains and iron stairs (FORGE_PLATFORMS), the iron door
// that is everyone's own front door (FORGE_HOME_X), the great forge with its hood (you wake by it), the
// memorial wall with its one blank space near the top, Slag's stack of gear-teeth, and the road up into
// Cinder Flats. Behind: an ash-hazed dusk, warm green sea, the other islands far off to the north and the
// island's own smoke column. This room paints its own sky.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { FORGE_W, FIELD_GROUND, FORGE_DOCK_X, FORGE_HOME_X, FORGE_FIRE_X, FORGE_WALL_X, FORGE_EXIT_X, FORGE_PLATFORMS, SOOT_X } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';
import { drawLodestar, drawLodestarGangway } from './fjord.js';

const GROUND = FIELD_GROUND;
const HORIZON = 300;
const INK = '#4a3440';
const QUAY_X0 = 300, QUAY_X1 = 920; // the rusted iron quay
const WALL_X = 1480; // the caldera's outer wall starts here; the town is cut into it
const SHIP_X = FORGE_DOCK_X - 150; // the Lodestar's stern (her gangway is 150 px along, as at the hamlet)
const BATH_X0 = 1150, BATH_X1 = 1380; // Auntie Soot's bathhouse
const BRAZIERS = [1580, 2470, 3130];
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const plat = (kind, i = 0) => FORGE_PLATFORMS.filter((p) => p.kind === kind)[i];

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
const ash = (() => {
  const r = mulberry32(401);
  return Array.from({ length: 60 }, () => ({ x: r() * W, y: r() * H, s: 0.8 + r() * 1.4, v: 8 + r() * 14, p: r() * TAU }));
})();
const embers = (() => {
  const r = mulberry32(403);
  return Array.from({ length: 22 }, () => ({ x: r() * W, p: r(), v: 0.05 + r() * 0.06, s: 1 + r() * 1.2 }));
})();
const glints = (() => {
  const r = mulberry32(405);
  return Array.from({ length: 30 }, () => ({ x: r() * 1800, y: r(), w: 10 + r() * 22, p: r() * TAU }));
})();
// lit windows and doors cut into the wall above the street (x, y above the ground)
const windows = (() => {
  const r = mulberry32(407);
  const out = [];
  for (let x = WALL_X + 80; x < FORGE_W - 120; x += 70 + r() * 60) {
    if (Math.abs(x - FORGE_WALL_X) < 150 || Math.abs(x - FORGE_FIRE_X) < 110) continue;
    out.push({ x, y: 230 + r() * 150, w: 14 + r() * 8, p: r() * TAU });
  }
  return out;
})();
const pools = [{ x: 990, w: 70 }, { x: 1080, w: 52 }, { x: 960, w: 40, back: true }];

// Everything in Forgehold behind the slimes
export function drawForgehold(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0); // sky and sea in screen space
  drawSky(ctx, camX, time);
  ctx.restore();

  const L = camX - 100, R = camX + viewW + 100;
  if (R > WALL_X - 120) drawWall(ctx, Math.max(WALL_X - 120, L), Math.min(FORGE_W, R), time);
  if (visible(SHIP_X - 60, SHIP_X + 460, L, R)) drawLodestar(ctx, time, SHIP_X, GROUND);
  drawSand(ctx, Math.max(0, L), Math.min(QUAY_X0, R));
  drawQuay(ctx, Math.max(QUAY_X0, L), Math.min(QUAY_X1, R));
  drawSand(ctx, Math.max(QUAY_X1, L), Math.min(WALL_X, R));
  drawStreet(ctx, Math.max(WALL_X, L), Math.min(FORGE_W, R));
  if (visible(FORGE_DOCK_X - 80, FORGE_DOCK_X + 200, L, R)) {
    drawLodestarGangway(ctx, FORGE_DOCK_X, time, GROUND);
    drawQuayBoard(ctx, FORGE_DOCK_X + 110, time);
  }
  const cr = plat('crates');
  if (visible(cr.x - 10, cr.x + cr.w + 10, L, R)) drawCrates(ctx, cr);
  for (const p of pools) if (visible(p.x - 90, p.x + 90, L, R)) drawPool(ctx, p, time);
  if (visible(BATH_X0 - 40, BATH_X1 + 60, L, R)) drawBathhouse(ctx, time);
  for (const p of FORGE_PLATFORMS) if (p.kind === 'ledge' && visible(p.x - 60, p.x + p.w + 60, L, R)) drawLedge(ctx, p, time);
  if (visible(1560, 2560, L, R)) drawChainsAndStairs(ctx, time);
  if (visible(FORGE_HOME_X - 80, FORGE_HOME_X + 80, L, R)) drawHomeDoor(ctx, time);
  if (visible(FORGE_FIRE_X - 180, FORGE_FIRE_X + 180, L, R)) drawForge(ctx, time);
  if (visible(FORGE_WALL_X - 140, FORGE_WALL_X + 140, L, R)) drawMemorial(ctx, time);
  const tt = plat('teeth');
  if (visible(tt.x - 40, tt.x + tt.w + 80, L, R)) drawTeeth(ctx, tt, time);
  for (const x of BRAZIERS) if (visible(x - 40, x + 40, L, R)) drawBrazier(ctx, x, time);
  if (visible(FORGE_EXIT_X - 200, FORGE_W, L, R)) drawRoadUp(ctx, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawAir(ctx, camX, time);
  ctx.restore();
}

// A house can look out on Forgehold (its `view`, docs/places/houses.md): the sky, the sea and the ash,
// in screen space like drawBackground
export function drawForgeView(ctx, camX, time) {
  drawSky(ctx, camX, time);
  drawAir(ctx, camX, time);
}

// ——— the sky and the sea ———

function drawSky(ctx, camX, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#5e3e56');
  sky.addColorStop(0.55, '#b06a66');
  sky.addColorStop(1, '#eaa47c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  // the island's own smoke column, leaning across the sky from behind the wall
  const sx = W * 0.82 - camX * 0.05;
  for (let i = 0; i < 16; i++) {
    const k = (i / 16 + time * 0.008) % 1;
    ctx.fillStyle = `rgba(110,84,98,${0.55 * (1 - k * 0.6)})`;
    circle(ctx, sx - k * k * 420 + Math.sin(i * 1.9 + time * 0.2) * 14, 210 - k * 300, 40 + k * 90);
  }
  // the sun, low and red through the ash
  ctx.fillStyle = 'rgba(255,190,140,0.22)';
  circle(ctx, 210 - camX * 0.01, 150, 70);
  ctx.fillStyle = '#ffb27a';
  circle(ctx, 210 - camX * 0.01, 150, 26);
  // the other islands, far off to the north across the Straits
  drawDistantIslands(ctx, { from: 'ember', scroll: camX, roomW: FORGE_W, time, horizon: HORIZON, haze: '#eaa47c', fade: 0.6, scale: 0.6, night: 0.2, sky: 220 });
  // the water: warm and green, steaming a little
  const sea = ctx.createLinearGradient(0, HORIZON, 0, GROUND);
  sea.addColorStop(0, '#d8c4a8');
  sea.addColorStop(0.3, '#7fa898');
  sea.addColorStop(1, '#4e7a70');
  ctx.fillStyle = sea;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  ctx.fillStyle = 'rgba(255,240,220,0.55)';
  ctx.fillRect(0, HORIZON, W, 1.5);
  for (const g of glints) {
    const y = HORIZON + 6 + g.y * g.y * (GROUND - HORIZON - 10);
    const f = 0.1 + g.y * 0.5;
    const x = (((g.x - camX * f + Math.sin(time * 0.5 + g.p) * 8) % 1800) + 1800) % 1800 - 200;
    if (x < -40 || x > W + 40) continue;
    ctx.globalAlpha = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(time * 1.4 + g.p));
    ctx.fillStyle = '#fff2e0';
    ctx.beginPath();
    ctx.roundRect(x, y, g.w * (0.5 + g.y), 2 + g.y, 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Ash drifting down, and a few embers rising, over everything
function drawAir(ctx, camX, time) {
  ctx.fillStyle = 'rgba(126,112,118,0.6)';
  for (const a of ash) {
    const y = (a.y + time * a.v) % H;
    const x = ((((a.x - camX * 0.25 + Math.sin(time * 0.6 + a.p) * 14) % W) + W) % W);
    circle(ctx, x, y, a.s);
  }
  for (const e of embers) {
    const k = (time * e.v + e.p) % 1;
    const x = ((((e.x - camX * 0.4 + Math.sin(k * 8 + e.p * 9) * 10) % W) + W) % W);
    ctx.fillStyle = `rgba(255,${170 + Math.round(e.s * 30)},100,${Math.sin(k * Math.PI) * 0.8})`;
    circle(ctx, x, GROUND - 10 - k * 360, e.s);
  }
}

// ——— the ground ———

// Black sand: dark, finely speckled, wet and shiny at the waterline
function drawSand(ctx, L, R) {
  if (R <= L) return;
  ctx.fillStyle = '#3a3038';
  ctx.fillRect(L, GROUND - 4, R - L, H - GROUND + 4);
  ctx.fillStyle = '#4a3e46';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 6, R - L + 8, 12, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(200,180,190,0.25)';
  for (let x = Math.floor(L / 13) * 13; x < R; x += 13) circle(ctx, x + (x % 3) * 3, GROUND + 6 + ((x * 7) % 40), 1);
  ctx.fillStyle = 'rgba(255,230,220,0.18)';
  for (let x = Math.floor(L / 90) * 90; x < R; x += 90) ellipse(ctx, x + 40, GROUND + 18, 26, 3);
}

// The quay: rusted iron plates on black piles, riveted, with bollards
function drawQuay(ctx, L, R) {
  if (R <= L) return;
  ctx.fillStyle = '#2e2630';
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = '#4a3a3e';
  for (let x = Math.ceil(QUAY_X0 / 80) * 80; x < R; x += 80) if (x > L - 20) ctx.fillRect(x - 7, GROUND + 14, 14, H - GROUND);
  ctx.fillStyle = '#8a5a48';
  ctx.fillRect(L, GROUND - 4, R - L, 16);
  ctx.fillStyle = '#a06a52';
  ctx.fillRect(L, GROUND - 4, R - L, 3);
  ctx.fillStyle = '#6a4436';
  for (let x = Math.floor(L / 60) * 60; x < R; x += 60) {
    ctx.fillRect(x, GROUND - 4, 2, 16);
    for (const dy of [0, 8]) circle(ctx, x + 6, GROUND + dy, 1.4);
  }
  ctx.fillStyle = 'rgba(160,96,60,0.4)'; // streaks of rust
  for (let x = Math.floor(L / 47) * 47; x < R; x += 47) ctx.fillRect(x + 20, GROUND + 12, 3, 10 + (x % 5) * 3);
  for (const bx of [QUAY_X0 + 40, QUAY_X1 - 40]) {
    if (bx < L - 20 || bx > R + 20) continue;
    ctx.fillStyle = '#3e3438';
    ctx.beginPath();
    ctx.roundRect(bx - 9, GROUND - 22, 18, 20, [7, 7, 2, 2]);
    ctx.fill();
  }
}

// The town's street: dark flagstones, warm in the cracks
function drawStreet(ctx, L, R) {
  if (R <= L) return;
  ctx.fillStyle = '#3e3240';
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = '#4e4050';
  for (let y = GROUND + 4, row = 0; y < H; y += 20, row++) {
    for (let x = Math.floor(L / 52) * 52 + (row % 2) * 26; x < R; x += 52) {
      ctx.beginPath();
      ctx.roundRect(x + 2, y, 48, 16, 4);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#5e4e5c';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 4, R - L + 8, 10, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,140,80,0.18)';
  for (let x = Math.floor(L / 52) * 52; x < R; x += 52) ctx.fillRect(x, GROUND + 6, 2, 30);
}

// ——— the wall and the town in it ———

// The caldera's outer wall, rising out of the top of the view: dark basalt in strata, lit windows and doors
// cut into it, smoke from flues
function drawWall(ctx, L, R, time) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#2e2430');
  g.addColorStop(1, '#4a3a48');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(WALL_X - 120, GROUND);
  ctx.quadraticCurveTo(WALL_X - 60, GROUND - 160, WALL_X - 30, GROUND - 300);
  ctx.lineTo(WALL_X + 10, -20);
  ctx.lineTo(R + 20, -20);
  ctx.lineTo(R + 20, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,14,22,0.35)'; // the strata
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const y of [70, 150, 250, 340]) {
    const x0 = Math.max(L, WALL_X - (y > 250 ? 40 : 0));
    ctx.moveTo(x0, GROUND - y);
    for (let x = Math.floor(x0 / 80) * 80 + 80; x <= R + 80; x += 80) ctx.lineTo(x, GROUND - y + Math.sin(x * 0.013 + y) * 6);
  }
  ctx.stroke();
  for (const wn of windows) {
    if (wn.x < L - 30 || wn.x > R + 30) continue;
    const fl = 0.7 + 0.25 * Math.sin(time * 2.4 + wn.p);
    ctx.fillStyle = '#1e1622';
    ctx.beginPath();
    ctx.roundRect(wn.x - wn.w / 2 - 3, GROUND - wn.y - 3, wn.w + 6, wn.w * 1.3 + 6, [wn.w, wn.w, 2, 2]);
    ctx.fill();
    ctx.fillStyle = `rgba(255,178,104,${fl})`;
    ctx.beginPath();
    ctx.roundRect(wn.x - wn.w / 2, GROUND - wn.y, wn.w, wn.w * 1.3, [wn.w, wn.w, 1, 1]);
    ctx.fill();
  }
  // flues breathing smoke out of the rock
  for (const fx of [1700, 2520, 2900, 3220]) {
    if (fx < L - 60 || fx > R + 60) continue;
    ctx.fillStyle = '#2a2028';
    ctx.fillRect(fx - 6, 40, 12, 26);
    for (let i = 0; i < 4; i++) {
      const k = (time * 0.2 + i / 4 + fx * 0.001) % 1;
      ctx.fillStyle = `rgba(140,118,128,${0.5 * (1 - k)})`;
      circle(ctx, fx + Math.sin(k * 4 + i) * 6 - k * 30, 34 - k * 90, 8 + k * 18);
    }
  }
}

// A ledge cut out of the wall: a basalt shelf on iron brackets with a chain rail
function drawLedge(ctx, p, time) {
  ctx.fillStyle = '#5a4a58';
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, 14, [6, 6, 3, 3]);
  ctx.fill();
  ctx.fillStyle = '#6e5e6c';
  ctx.fillRect(p.x + 4, p.y, p.w - 8, 3);
  ctx.fillStyle = '#2e2630'; // its brackets
  for (const bx of [p.x + 20, p.x + p.w - 20]) {
    ctx.beginPath();
    ctx.moveTo(bx - 6, p.y + 14);
    ctx.lineTo(bx + 6, p.y + 14);
    ctx.lineTo(bx - 10, p.y + 44);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#7a6a70'; // the chain rail along its front edge
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  for (let x = p.x + 6; x < p.x + p.w - 6; x += 40) {
    ctx.moveTo(x, p.y - 18);
    ctx.quadraticCurveTo(x + 20, p.y - 8 + Math.sin(time + x) * 1, Math.min(x + 40, p.x + p.w - 6), p.y - 18);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#4a3e46';
  for (let x = p.x + 6; x <= p.x + p.w - 6; x += 40) ctx.fillRect(x - 1.5, p.y - 20, 3, 20);
}

// Iron stairs from the street up to the first ledge, chains swung between the ledges
function drawChainsAndStairs(ctx, time) {
  const a = FORGE_PLATFORMS.filter((p) => p.kind === 'ledge');
  const [l1, l2, l3] = a;
  ctx.strokeStyle = '#3e3440';
  ctx.lineWidth = 3;
  ctx.beginPath(); // the stair's stringers
  ctx.moveTo(l1.x - 70, GROUND);
  ctx.lineTo(l1.x, l1.y + 6);
  ctx.moveTo(l1.x - 56, GROUND);
  ctx.lineTo(l1.x + 14, l1.y + 6);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 1; i < 8; i++) {
    const t = i / 8, x = l1.x - 70 + t * 70, y = GROUND + t * (l1.y + 6 - GROUND);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 14, y);
  }
  ctx.stroke();
  ctx.strokeStyle = '#6a5a62'; // chains between the ledges, sagging
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  for (const [p, q] of [[l1, l2], [l2, plat('hood')], [plat('hood'), l3]]) {
    const x0 = p.x + p.w - 6, y0 = p.y - 16, x1 = q.x + 6, y1 = q.y - 16;
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 40 + Math.sin(time * 0.9) * 2, x1, y1);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

// Everyone's own front door: a round-topped iron door set into the rock, riveted, with a lamp and a plaque
function drawHomeDoor(ctx, time) {
  const x = FORGE_HOME_X, b = GROUND;
  ctx.fillStyle = '#2a2028'; // the doorway's rock surround
  ctx.beginPath();
  ctx.roundRect(x - 34, b - 104, 68, 104, [34, 34, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#6e5a5a';
  ctx.strokeStyle = '#3e2e30';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 26, b - 92, 52, 92, [26, 26, 0, 0]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a6e66';
  for (const y of [b - 66, b - 30]) ctx.fillRect(x - 26, y, 52, 5);
  ctx.fillStyle = '#c8b0a0';
  for (const y of [b - 64, b - 28]) for (let dx = -20; dx <= 20; dx += 10) circle(ctx, x + dx, y + 2.5, 1.3);
  ctx.fillStyle = '#ffcf7a'; // the ring handle
  ctx.strokeStyle = '#ffcf7a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 14, b - 44, 4, 0, TAU);
  ctx.stroke();
  // the lamp beside it
  const fl = 0.75 + 0.2 * Math.sin(time * 5);
  ctx.fillStyle = `rgba(255,190,110,${0.25 * fl})`;
  circle(ctx, x + 46, b - 96, 22);
  ctx.fillStyle = '#3e3440';
  ctx.fillRect(x + 38, b - 110, 16, 4);
  ctx.fillStyle = `rgba(255,200,120,${fl})`;
  ctx.beginPath();
  ctx.roundRect(x + 40, b - 106, 12, 14, 3);
  ctx.fill();
  // the plaque
  ctx.fillStyle = '#8a6e5a';
  ctx.beginPath();
  ctx.roundRect(x - 30, b - 132, 60, 22, 5);
  ctx.fill();
  text(ctx, 'Home', x, b - 121, 13, '#fff1dc');
}

// The great forge: a stone hearth with a glowing mouth under its hood (a platform), the bellows, the anvil,
// a chimney up into the rock, and Ash's pot of mint on the sill (Soot waters it when he isn't looking)
function drawForge(ctx, time) {
  const x = FORGE_FIRE_X, b = GROUND, hood = plat('hood');
  const pulse = 0.8 + 0.2 * Math.sin(time * 3) + 0.05 * Math.sin(time * 11);
  const g = ctx.createRadialGradient(x, b - 60, 10, x, b - 60, 220);
  g.addColorStop(0, `rgba(255,150,80,${0.45 * pulse})`);
  g.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 220, b - 280, 440, 300);
  // the chimney going up into the wall
  ctx.fillStyle = '#3e3240';
  ctx.fillRect(x - 22, 0, 44, hood.y);
  // the hearth
  ctx.fillStyle = '#5a4a52';
  ctx.strokeStyle = '#2e2430';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 72, hood.y + 10, 144, b - hood.y - 10, [4, 4, 0, 0]);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(30,22,32,0.45)'; // its stones
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let y = hood.y + 34, row = 0; y < b; y += 24, row++) {
    ctx.moveTo(x - 72, y);
    ctx.lineTo(x + 72, y);
    for (let sx = x - 72 + (row % 2) * 24; sx < x + 72; sx += 48) {
      ctx.moveTo(sx, y);
      ctx.lineTo(sx, y + 24);
    }
  }
  ctx.stroke();
  // the mouth, glowing
  ctx.fillStyle = '#1e1418';
  ctx.beginPath();
  ctx.roundRect(x - 40, b - 86, 80, 70, [34, 34, 4, 4]);
  ctx.fill();
  const m = ctx.createLinearGradient(0, b - 80, 0, b - 18);
  m.addColorStop(0, `rgba(255,120,60,${0.7 * pulse})`);
  m.addColorStop(1, `rgba(255,220,130,${pulse})`);
  ctx.fillStyle = m;
  ctx.beginPath();
  ctx.roundRect(x - 32, b - 74, 64, 56, [28, 28, 3, 3]);
  ctx.fill();
  ctx.fillStyle = 'rgba(80,40,30,0.8)'; // coals
  for (let i = 0; i < 6; i++) ellipse(ctx, x - 22 + i * 9, b - 22, 6, 4);
  // the hood (you can stand on it)
  ctx.fillStyle = '#6a5a66';
  ctx.beginPath();
  ctx.moveTo(hood.x - 8, hood.y + 16);
  ctx.lineTo(hood.x + 6, hood.y);
  ctx.lineTo(hood.x + hood.w - 6, hood.y);
  ctx.lineTo(hood.x + hood.w + 8, hood.y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7e6e78';
  ctx.fillRect(hood.x + 6, hood.y, hood.w - 12, 3);
  // the mint, stubborn, in a cracked pot on the hood's edge
  const mx = hood.x + hood.w - 14, my = hood.y;
  ctx.fillStyle = '#a0624a';
  ctx.beginPath();
  ctx.moveTo(mx - 7, my - 12);
  ctx.lineTo(mx + 7, my - 12);
  ctx.lineTo(mx + 5, my);
  ctx.lineTo(mx - 5, my);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7fc46a';
  for (const [dx, dy, r] of [[-4, -16, 4], [3, -18, 4.5], [0, -22, 3.6], [5, -13, 3]]) ellipse(ctx, mx + dx, my + dy + Math.sin(time * 1.5 + dx) * 0.6, r, r * 0.7, dx * 0.1);
  // the bellows on the left, breathing
  const br = Math.sin(time * 1.6);
  ctx.fillStyle = '#7a5038';
  ctx.strokeStyle = '#4a2e20';
  ctx.beginPath();
  ctx.moveTo(x - 76, b - 40);
  ctx.lineTo(x - 140, b - 52 - br * 8);
  ctx.lineTo(x - 140, b - 18 + br * 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a6a52';
  ctx.fillRect(x - 148, b - 56 - br * 8, 10, 42 + br * 12);
  // the anvil on the right
  ctx.fillStyle = '#3e3a44';
  ctx.beginPath();
  ctx.moveTo(x + 84, b - 40);
  ctx.lineTo(x + 140, b - 40);
  ctx.quadraticCurveTo(x + 150, b - 34, x + 156, b - 38);
  ctx.lineTo(x + 140, b - 30);
  ctx.lineTo(x + 126, b - 30);
  ctx.lineTo(x + 130, b - 6);
  ctx.lineTo(x + 94, b - 6);
  ctx.lineTo(x + 98, b - 30);
  ctx.lineTo(x + 84, b - 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2e2a32';
  ctx.fillRect(x + 88, b - 6, 46, 6);
  // sparks now and then
  const k = (time * 0.7) % 1;
  if (k < 0.3) {
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.35, d = (k / 0.3) * 40;
      ctx.fillStyle = `rgba(255,${200 + i * 8},120,${1 - k / 0.3})`;
      circle(ctx, x + 112 + Math.cos(a) * d, b - 42 + Math.sin(a) * d + (k / 0.3) * 10, 1.6);
    }
  }
}

// The memorial wall: a slab of black glass-smooth stone, row on row of smiths' names carved small (strokes,
// not readable text), a nail hammered in beside every name, candles at its foot, and near the top one
// space left blank, with a frame round it (Ash's sister: he won't carve a name for someone who isn't dead)
function drawMemorial(ctx, time) {
  const x0 = FORGE_WALL_X - 106, x1 = FORGE_WALL_X + 106, top = plat('ledge', 2).y + 30, b = GROUND - 8;
  ctx.fillStyle = '#26202a';
  ctx.strokeStyle = '#141018';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x0, top, x1 - x0, b - top, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(x0 + 6, top + 6, 10, b - top - 12);
  const r = mulberry32(419);
  for (let y = top + 18, row = 0; y < b - 10; y += 13, row++) {
    for (let x = x0 + 14; x < x1 - 30; x += 46 + r() * 8) {
      const blank = row === 1 && x > FORGE_WALL_X - 30 && x < FORGE_WALL_X + 30;
      if (blank) continue;
      ctx.strokeStyle = 'rgba(200,180,190,0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const len = 18 + r() * 14;
      ctx.moveTo(x, y);
      for (let i = 1; i <= 5; i++) ctx.lineTo(x + (len * i) / 5, y + (i % 2 ? -1.5 : 1.5));
      ctx.stroke();
      ctx.fillStyle = '#8a8490';
      circle(ctx, x + len + 5, y, 1.6);
    }
  }
  // the blank space near the top, framed
  ctx.strokeStyle = 'rgba(255,200,140,0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(FORGE_WALL_X - 26, top + 24, 52, 14);
  // candles at its foot
  for (let i = 0; i < 5; i++) {
    const cx = x0 + 30 + i * 38, fl = 0.7 + 0.3 * Math.sin(time * 6 + i * 2);
    ctx.fillStyle = '#efe4cc';
    ctx.fillRect(cx - 3, GROUND - 16, 6, 12);
    ctx.fillStyle = `rgba(255,200,110,${fl})`;
    ellipse(ctx, cx, GROUND - 20, 2.4, 4 * fl);
  }
}

// Slag's stack: great iron gear-teeth dragged out of the ash and piled up (a platform), rusty, one of them
// standing on end at the end of the stack, where he files
function drawTeeth(ctx, p, time) {
  const b = GROUND, h = b - p.y, rows = 3, rh = h / rows;
  for (let i = 0; i < rows; i++) {
    const y = b - (i + 1) * rh, inset = i * 10;
    const tooth = (x0, x1) => {
      ctx.beginPath();
      ctx.moveTo(x0, y + rh);
      ctx.lineTo(x0 + 12, y);
      ctx.lineTo(x1 - 12, y);
      ctx.lineTo(x1, y + rh);
      ctx.closePath();
    };
    const segs = i === rows - 1 ? [[p.x, p.x + p.w]] : [[p.x - 8 + inset, p.x + p.w / 2 + 4], [p.x + p.w / 2 - 4, p.x + p.w + 8 - inset]];
    for (const [a, c] of segs) {
      ctx.fillStyle = i % 2 ? '#5e5660' : '#6a6068';
      ctx.strokeStyle = '#2e2832';
      ctx.lineWidth = 2;
      tooth(a, c);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(160,90,60,0.55)'; // rust, in patches
      ellipse(ctx, a + (c - a) * 0.3, y + rh * 0.55, 10, 5);
      ellipse(ctx, a + (c - a) * 0.72, y + rh * 0.35, 7, 4);
      ctx.fillStyle = 'rgba(200,196,210,0.35)'; // the worn face where it would have meshed
      ctx.fillRect(a + 16, y + 3, (c - a) - 32, 3);
    }
  }
  // the one on end, half filed bright
  const tx = p.x + p.w + 38;
  ctx.fillStyle = '#5e5660';
  ctx.strokeStyle = '#2e2832';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx - 22, b);
  ctx.lineTo(tx - 14, b - 74);
  ctx.lineTo(tx + 14, b - 74);
  ctx.lineTo(tx + 22, b);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(230,220,230,0.75)';
  ctx.beginPath();
  ctx.moveTo(tx - 14, b - 74);
  ctx.lineTo(tx + 14, b - 74);
  ctx.lineTo(tx + 15, b - 60);
  ctx.lineTo(tx - 15, b - 60);
  ctx.closePath();
  ctx.fill();
  const gl = 0.4 + 0.4 * Math.sin(time * 3);
  ctx.fillStyle = `rgba(255,255,255,${gl})`;
  circle(ctx, tx + 6, b - 70, 1.6);
}

// A brazier on an iron tripod, burning
function drawBrazier(ctx, x, time) {
  const b = GROUND, fl = 0.75 + 0.25 * Math.sin(time * 7 + x);
  ctx.fillStyle = `rgba(255,170,90,${0.22 * fl})`;
  circle(ctx, x, b - 70, 34);
  ctx.strokeStyle = '#2e2630';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 14, b);
  ctx.lineTo(x, b - 50);
  ctx.lineTo(x + 14, b);
  ctx.moveTo(x, b - 50);
  ctx.lineTo(x, b);
  ctx.stroke();
  ctx.fillStyle = '#3e3440';
  ctx.beginPath();
  ctx.moveTo(x - 18, b - 58);
  ctx.lineTo(x + 18, b - 58);
  ctx.lineTo(x + 12, b - 46);
  ctx.lineTo(x - 12, b - 46);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255,150,70,${fl})`;
  ctx.beginPath();
  ctx.moveTo(x - 14, b - 58);
  ctx.quadraticCurveTo(x - 8, b - 78 - fl * 8, x, b - 90 - fl * 6);
  ctx.quadraticCurveTo(x + 8, b - 78 - fl * 8, x + 14, b - 58);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255,230,150,${fl})`;
  ellipse(ctx, x, b - 64, 6, 8);
}

// The crates on the quay: iron-strapped, stamped with a gear
function drawCrates(ctx, p) {
  const n = Math.max(1, Math.round(p.w / 52)), cw = p.w / n, ch = GROUND - p.y;
  for (let i = 0; i < n; i++) {
    const x = p.x + i * cw;
    ctx.fillStyle = i % 2 ? '#6a5040' : '#7a5c48';
    ctx.beginPath();
    ctx.roundRect(x + 1, p.y + 1, cw - 2, ch - 2, 4);
    ctx.fill();
    ctx.fillStyle = '#3e3438';
    ctx.fillRect(x + 1, p.y + 10, cw - 2, 4);
    ctx.fillRect(x + 1, p.y + ch - 16, cw - 2, 4);
    ctx.strokeStyle = 'rgba(255,220,180,0.35)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x + cw / 2, p.y + ch / 2 + 2, 8, 0, TAU);
    ctx.stroke();
  }
}

// The springs: pools of hot water in the black sand, steaming
function drawPool(ctx, p, time) {
  ctx.fillStyle = p.back ? 'rgba(90,150,140,0.6)' : '#5aa094';
  ellipse(ctx, p.x, GROUND + 6, p.w, 9);
  ctx.fillStyle = 'rgba(200,240,230,0.5)';
  ellipse(ctx, p.x - p.w * 0.3, GROUND + 4, p.w * 0.3, 3);
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.22 + i / 4 + p.x * 0.001) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.42 * Math.sin(k * Math.PI)})`;
    circle(ctx, p.x - p.w * 0.5 + i * p.w * 0.33 + Math.sin(k * 5 + i) * 8, GROUND - k * 70, 8 + k * 16);
  }
}

// Auntie Soot's bathhouse: walls of stacked round stones, a flat slab roof (a platform), a striped curtain
// in the doorway, a sign, towels drying on a line, and socks
function drawBathhouse(ctx, time) {
  const roof = plat('bathroof'), x0 = BATH_X0, x1 = BATH_X1, b = GROUND;
  ctx.fillStyle = '#6a5a62';
  ctx.beginPath();
  ctx.roundRect(x0 + 8, roof.y + 10, x1 - x0 - 16, b - roof.y - 10, [6, 6, 0, 0]);
  ctx.fill();
  const r = mulberry32(431);
  for (let y = roof.y + 22; y < b; y += 16) {
    for (let x = x0 + 14 + ((y / 16) % 2) * 9; x < x1 - 14; x += 19) {
      ctx.fillStyle = r() > 0.5 ? '#7a6a72' : '#5e4e58';
      ellipse(ctx, x, y, 9, 7);
    }
  }
  // the doorway and its curtain
  const dx = SOOT_X - 60;
  ctx.fillStyle = '#2a1e24';
  ctx.beginPath();
  ctx.roundRect(dx - 26, b - 80, 52, 80, [24, 24, 0, 0]);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 ? '#f2e6d8' : '#d0607a';
    ctx.beginPath();
    ctx.roundRect(dx - 24 + i * 12, b - 76 + (i === 0 ? 4 : 0), 12, 52 + Math.sin(time * 1.2 + i) * 2, [6, 6, 2, 2]);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.15 * Math.sin(time * 1.4)})`; // steam puffing out under it
  circle(ctx, dx - 10 + Math.sin(time) * 4, b - 10, 10);
  circle(ctx, dx + 12, b - 16, 8);
  // the roof slab
  ctx.fillStyle = '#5a4a52';
  ctx.beginPath();
  ctx.roundRect(roof.x, roof.y, roof.w, 14, 6);
  ctx.fill();
  ctx.fillStyle = '#7a6a72';
  ctx.fillRect(roof.x + 4, roof.y, roof.w - 8, 3);
  // the sign
  ctx.fillStyle = '#8a6e5a';
  ctx.beginPath();
  ctx.roundRect(x1 - 120, roof.y + 22, 92, 24, 6);
  ctx.fill();
  text(ctx, 'SPRINGS', x1 - 74, roof.y + 34, 12, '#fff1dc');
  // a washing line from the roof's corner to a post, with towels and socks
  const px = x0 - 30;
  ctx.fillStyle = '#4a3e46';
  ctx.fillRect(px - 2, b - 110, 4, 110);
  ctx.strokeStyle = '#c9b8aa';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(px, b - 106);
  ctx.quadraticCurveTo((px + x0 + 20) / 2, b - 94, x0 + 20, b - 112);
  ctx.stroke();
  const sway = Math.sin(time * 1.3) * 2;
  for (const [t, c, w, h] of [[0.2, '#f2e6d8', 14, 20], [0.45, '#d0607a', 7, 12], [0.6, '#8aa8c8', 7, 12], [0.8, '#f2e6d8', 14, 18]]) {
    const lx = px + t * (x0 + 20 - px), ly = b - 106 + Math.sin(t * Math.PI) * 10 - t * 6;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(lx - w / 2 + sway * t, ly, w, h, 2);
    ctx.fill();
  }
}

// The quay's board by the gangway: where she sails
function drawQuayBoard(ctx, x, time) {
  const base = GROUND;
  ctx.fillStyle = '#4a3e46';
  ctx.fillRect(x - 4, base - 120, 8, 120);
  ctx.save();
  ctx.translate(x, base - 124);
  ctx.rotate(0.02 + Math.sin(time * 0.9) * 0.008);
  ctx.fillStyle = '#fff1dc';
  ctx.strokeStyle = '#8a5a48';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-84, -40, 168, 74, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'LODESTAR · NORTH', 0, -24, 13, '#3e4258');
  text(ctx, 'To Icefang Hamlet.', 0, -4, 13, INK);
  text(ctx, 'Letters carried.', 0, 13, 12, INK);
  text(ctx, '- Arne', 50, 26, 10, '#8a5a48');
  ctx.restore();
}

// The road up out of town to Cinder Flats: a ramp of packed cinders between rocks, the flats' glow beyond, and
// a signpost
function drawRoadUp(ctx, time) {
  const b = GROUND, x = FORGE_EXIT_X;
  const g = ctx.createRadialGradient(FORGE_W, b - 60, 10, FORGE_W, b - 60, 220);
  g.addColorStop(0, `rgba(255,150,90,${0.4 + 0.08 * Math.sin(time * 2)})`);
  g.addColorStop(1, 'rgba(255,150,90,0)');
  ctx.fillStyle = g;
  ctx.fillRect(FORGE_W - 240, b - 280, 260, 300);
  ctx.fillStyle = '#5a4448';
  ctx.beginPath();
  ctx.moveTo(x - 140, b);
  ctx.quadraticCurveTo(x - 20, b - 30, FORGE_W + 20, b - 120);
  ctx.lineTo(FORGE_W + 20, b);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3e3038';
  for (const [rx, ry, rr] of [[x - 120, b - 8, 22], [FORGE_W - 20, b - 130, 30], [x + 40, b - 70, 16]]) ellipse(ctx, rx, ry, rr, rr * 0.7);
  ctx.fillStyle = '#4a3e46';
  ctx.beginPath();
  ctx.roundRect(x - 5, b - 110, 10, 112, 4);
  ctx.fill();
  ctx.save();
  ctx.translate(x, b - 92);
  ctx.rotate(-0.05 + Math.sin(time * 0.8) * 0.01);
  ctx.fillStyle = '#c0605a';
  ctx.strokeStyle = '#7a3a38';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-70, -18);
  ctx.lineTo(60, -18);
  ctx.lineTo(78, 0);
  ctx.lineTo(60, 18);
  ctx.lineTo(-70, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Cinder Flats', 2, 1, 14, '#ffffff');
  ctx.restore();
}
