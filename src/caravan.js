// Docs: docs/places/amberdune.md
// Caravanserai (room CARAVAN, src/shared/rpg.js; atlas Phase 9, A0): Amberdune's town, with Saltmouth's dry piers as its
// waterfront. West to east: the new jetty where the sea is now, the Saltwind alongside (her gangway is a door,
// DUNE_DOCK_X) and Kesh's water casks; the walk in over the old seabed, pale and cracked with salt, a boat careened on
// its side; the way down onto the seabed to the Salt Flats (a gate: src/branch-gates.js); Saltmouth's stone piers
// standing high and dry, mooring rings far over your head and a white salt line on every wall; Tally's counting-stall;
// the deep stone well and its windlass (you wake by it); the striped tent whose flap is everyone's own front door
// (DUNE_HOME_X); tents everywhere, every one of them half struck, packs and bundles, pack-lizards dozing in the shade,
// amber glass lanterns; the Star Court, a ring of half-buried Keeper star-dials where Mother Dune sits; the east end, out
// onto the Glass Dunes. Behind: a high hot sky, the far dunes, the other islands small over the sea to the north-east, and
// now and then a hill on the horizon that wasn't there last time (Old Carapace walking: drawDuneSky's `walker`).
// The platforms are CARAVAN_PLATFORMS. This room paints its own sky; Amberdune's other rooms borrow it (drawDuneSky,
// drawDuneAir), and so does a house looking out on it (drawCaravanView).
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { FAIR_TENT_X } from './shared/fair.js';
import { CARAVAN_W, FIELD_GROUND, DUNE_DOCK_X, DUNE_HOME_X, DUNE_SPAWN_X, CARAVAN_EXIT_X, CARAVAN_PLATFORMS, TALLY_X, WELL_X, MOTHER_X, KESH_X, SALTFLATS_GATE_X, DUNE_WAY_X } from './shared/rpg.js';
import { drawDistantIslands, isWalkerStill } from './distant.js';

const GROUND = FIELD_GROUND;
const HORIZON = 300;
const JETTY_END = 560; // the new jetty runs out west of here, over the water; the old seabed east of it
const SEABED_END = 880; // the old seabed gives way to Saltmouth's piers and the town's sand
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const plat = (kind) => CARAVAN_PLATFORMS.find((p) => p.kind === kind);
const STRIPES = [['#c8583a', '#f0e2c0'], ['#3e4a7a', '#e8c88a'], ['#d89a3a', '#f4ecd8'], ['#6a8a5a', '#efe2c4'], ['#8a4a6a', '#f0dcc8']];

function text(ctx, str, x, y, size, color) {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
const farDunes = (() => {
  const r = mulberry32(901);
  return Array.from({ length: 12 }, (_, i) => ({ x: i * 260 + r() * 120, w: 200 + r() * 260, h: 18 + r() * 30 }));
})();
const motes = (() => {
  const r = mulberry32(907);
  return Array.from({ length: 40 }, () => ({ x: r() * W, y: 160 + r() * 360, s: 0.6 + r() * 1.1, v: 30 + r() * 50, p: r() * TAU }));
})();
// tents behind the street (x, width, stripes, how far struck 0..1); kept clear of the stall, the well and the home tent
const TENTS = (() => {
  const r = mulberry32(911);
  const out = [];
  for (let x = 1420; x < CARAVAN_W - 200; x += 120 + r() * 80) {
    if ([[WELL_X, 120], [DUNE_HOME_X, 110], [MOTHER_X, 180], [FAIR_TENT_X[5], 200]].some(([c, rr]) => Math.abs(x - c) < rr)) continue;
    out.push({ x, w: 90 + r() * 50, c: STRIPES[Math.floor(r() * STRIPES.length)], struck: r() < 0.7 ? 0.3 + r() * 0.6 : 0, far: r() < 0.5 });
  }
  return out;
})();
const LANTERNS = [1240, 1590, 2000, 2290, 2620, 3010];
const LIZARDS = [{ x: 1330, f: 1 }, { x: 2510, f: -1 }];

// Everything in Caravanserai behind the slimes
// freed: you've freed Old Carapace (A5 (c), docs/social/story.md): the well has come up a little, and Mother Dune has struck her
// tent at last, packed, the bundles beside her
export function drawCaravan(ctx, camX, viewW, time, freed = false) {
  ctx.save();
  ctx.translate(camX, 0);
  drawDuneSky(ctx, camX, time, CARAVAN_W, { sea: true });
  ctx.restore();
  const L = camX - 120, R = camX + viewW + 120;
  for (const tn of TENTS) if (tn.far && visible(tn.x - tn.w, tn.x + tn.w, L, R)) drawTent(ctx, tn, time, true);
  if (visible(DUNE_DOCK_X - 360, DUNE_DOCK_X + 260, L, R)) drawSaltwindAlongside(ctx, time);
  drawGround(ctx, Math.max(0, L), Math.min(CARAVAN_W, R), time);
  if (visible(0, JETTY_END + 40, L, R)) drawJetty(ctx, time);
  if (visible(KESH_X - 70, KESH_X + 70, L, R)) drawCasks(ctx);
  const hull = plat('hull');
  if (visible(hull.x - 40, hull.x + hull.w + 40, L, R)) drawCareened(ctx, hull);
  const pier = plat('pier');
  if (visible(SEABED_END - 40, 1420, L, R)) drawPiers(ctx, pier, time);
  for (const tn of TENTS) if (!tn.far && visible(tn.x - tn.w, tn.x + tn.w, L, R)) drawTent(ctx, tn, time, false);
  for (const lz of LIZARDS) if (visible(lz.x - 80, lz.x + 80, L, R)) drawPackLizard(ctx, lz, time);
  if (visible(TALLY_X - 120, TALLY_X + 120, L, R)) drawTallyStall(ctx, time);
  if (visible(WELL_X - 100, WELL_X + 100, L, R)) drawWell(ctx, time, freed);
  const packs = plat('packs');
  if (visible(packs.x - 20, packs.x + packs.w + 20, L, R)) drawPacks(ctx, packs);
  if (visible(DUNE_HOME_X - 90, DUNE_HOME_X + 90, L, R)) drawHomeTent(ctx, time);
  const aw = plat('awning');
  if (visible(aw.x - 40, aw.x + aw.w + 40, L, R)) drawAwning(ctx, aw, time);
  if (visible(MOTHER_X - 180, CARAVAN_W - 120, L, R)) drawStarCourt(ctx, plat('dial'), time, freed);
  for (const x of LANTERNS) if (visible(x - 30, x + 30, L, R)) drawLantern(ctx, x, time);
  if (visible(CARAVAN_EXIT_X - 120, CARAVAN_W, L, R)) drawExitSign(ctx, CARAVAN_EXIT_X - 60, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawDuneAir(ctx, camX, time);
  ctx.restore();
}

// A house can look out on Caravanserai (its `view`, docs/places/houses.md): the high sky, the dunes, the dust
export function drawCaravanView(ctx, camX, time) {
  drawDuneSky(ctx, camX, time, CARAVAN_W);
  drawDuneAir(ctx, camX, time);
}

// ——— the sky (shared with the Glass Dunes, the Mirage Oasis and the Buried Observatory) ———
// opts: sea (the turquoise sea far off to the west, in town), dusk 0..1 (redder and lower toward the Storm Road), haze
let skyGrad = null, skyKey = '', gradCtx = null;
export function drawDuneSky(ctx, camX, time, roomW, { sea = false, dusk = 0, walker = true } = {}) {
  const key = String(dusk);
  if (gradCtx !== ctx || skyKey !== key) {
    gradCtx = ctx;
    skyKey = key;
    skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON);
    skyGrad.addColorStop(0, dusk ? '#4a5a9a' : '#3a78c0');
    skyGrad.addColorStop(0.55, dusk ? '#c8907a' : '#8ec0e4');
    skyGrad.addColorStop(1, dusk ? '#f4c08a' : '#f6e6c4');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  // the sun, high and white, a wide pale ring round it
  const sx = W * 0.3 - camX * 0.01, sy = dusk ? 170 : 74;
  const sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 150);
  sg.addColorStop(0, 'rgba(255,252,236,0.55)');
  sg.addColorStop(1, 'rgba(255,252,236,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(sx - 150, sy - 150, 300, 300);
  ctx.fillStyle = '#fffcf0';
  circle(ctx, sx, sy, 22);
  // the other islands, small, over the sea to the north-east
  drawDistantIslands(ctx, { from: 'dune', scroll: camX, roomW, time, horizon: HORIZON, haze: '#f6e6c4', fade: 0.62, scale: 0.5, night: 0.05, sky: 230 });
  // far dunes, gold, along the horizon
  for (const d of farDunes) {
    const x = (((d.x - camX * 0.08) % 3120) + 3120) % 3120 - 300;
    if (x + d.w < -40 || x - d.w > W + 40) continue;
    ctx.fillStyle = '#e8c890';
    ctx.beginPath();
    ctx.moveTo(x - d.w / 2, HORIZON + 4);
    ctx.quadraticCurveTo(x - d.w * 0.1, HORIZON - d.h * 1.4, x + d.w / 2, HORIZON + 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,150,90,0.35)'; // the shadow side
    ctx.beginPath();
    ctx.moveTo(x - d.w * 0.06, HORIZON - d.h * 0.66);
    ctx.quadraticCurveTo(x + d.w * 0.2, HORIZON - d.h * 0.2, x + d.w / 2, HORIZON + 4);
    ctx.lineTo(x, HORIZON + 4);
    ctx.closePath();
    ctx.fill();
  }
  // a hill far off on the horizon that has moved since you last looked: Old Carapace, walking (the hour of the day sets
  // where; the atlas's hint at the finale, shown, never told)
  if (walker) {
    const still = isWalkerStill(), hour = still ? 15 : (Date.now() / 3.6e6) % 24; // (freed, A5 (c): he lies still, always in the same place)
    const hx = ((hour / 24) * 1800 - camX * 0.03 + 600) % 1800 - 300, hy = HORIZON + 2;
    if (still && hx > -120 && hx < W + 120) {
      ctx.fillStyle = 'rgba(190,156,124,0.55)'; // lying down: lower and longer, the dust settled
      ctx.beginPath();
      ctx.moveTo(hx - 40, hy);
      ctx.quadraticCurveTo(hx - 30, hy - 15, hx, hy - 16);
      ctx.quadraticCurveTo(hx + 30, hy - 15, hx + 40, hy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(160,128,104,0.5)';
      for (const dx of [-14, -4, 6, 16]) ctx.fillRect(hx + dx - 1.5, hy - 15 + Math.abs(dx) * 0.3, 3, 2.5);
    } else if (hx > -120 && hx < W + 120) {
      ctx.fillStyle = 'rgba(190,156,124,0.55)';
      ctx.beginPath();
      ctx.moveTo(hx - 34, hy);
      ctx.quadraticCurveTo(hx - 24, hy - 22, hx, hy - 23);
      ctx.quadraticCurveTo(hx + 24, hy - 22, hx + 34, hy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(160,128,104,0.5)'; // tiny shapes on it, like roofs
      for (const dx of [-12, -3, 6, 14]) ctx.fillRect(hx + dx - 1.5, hy - 22 + Math.abs(dx) * 0.4, 3, 2.5);
      ctx.fillStyle = 'rgba(232,210,170,0.35)'; // the dust it raises
      ellipse(ctx, hx + 36, hy - 2, 22, 5);
    }
  }
  // the ground beyond: the old seabed's white glare out west in town, gold sand elsewhere
  const ground = ctx.createLinearGradient(0, HORIZON, 0, GROUND);
  ground.addColorStop(0, '#f0d8a4');
  ground.addColorStop(1, '#dcb070');
  ctx.fillStyle = ground;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  if (sea) {
    const k = Math.max(0, 1 - camX / 1400); // the sea, a bright far line, only toward the town's west end
    if (k > 0) {
      ctx.fillStyle = `rgba(110,210,214,${0.85 * k})`;
      ctx.fillRect(0, HORIZON + 2, W * 0.6 * k, 10);
      ctx.fillStyle = `rgba(255,255,255,${0.5 * k})`;
      ctx.fillRect(0, HORIZON + 2, W * 0.6 * k, 1.5);
      ctx.fillStyle = `rgba(244,240,226,${0.6 * k})`; // the salt glare between
      ctx.fillRect(0, HORIZON + 12, W * 0.5 * k, 26);
    }
  }
  ctx.fillStyle = 'rgba(255,248,226,0.35)'; // heat shimmer along the horizon
  for (let i = 0; i < 6; i++) {
    const y = HORIZON + 4 + i * 3;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, y + Math.sin(x * 0.05 + time * 3 + i) * 1.2);
    ctx.lineTo(W, y + 1.5);
    ctx.lineTo(0, y + 1.5);
    ctx.fill();
  }
}

// Sand and dust drifting across on the wind, a warm glare low down
export function drawDuneAir(ctx, camX, time, { thick = 0 } = {}) {
  for (const m of motes) {
    const x = ((((m.x + time * m.v - camX * 0.3) % W) + W) % W);
    const y = m.y + Math.sin(time * 0.8 + m.p) * 8;
    ctx.fillStyle = `rgba(214,170,110,${0.35 + thick * 0.3})`;
    circle(ctx, x, y, m.s);
  }
  if (thick > 0) {
    ctx.fillStyle = `rgba(200,110,70,${0.12 * thick})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ——— the ground ———
function drawGround(ctx, L, R, time) {
  if (R <= L) return;
  // the town's sand, and west of the piers the old seabed: pale, crusted white with salt, cracked into plates
  ctx.fillStyle = '#d8ae6c';
  ctx.fillRect(L, GROUND - 2, R - L, H - GROUND + 2);
  ctx.fillStyle = '#e6c488';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 6, R - L + 8, 12, 6);
  ctx.fill();
  const a = Math.max(L, JETTY_END), b = Math.min(R, SEABED_END + 120);
  if (b > a) {
    const g = ctx.createLinearGradient(SEABED_END - 200, 0, SEABED_END + 120, 0);
    g.addColorStop(0, '#efe8d8');
    g.addColorStop(1, 'rgba(239,232,216,0)');
    ctx.fillStyle = g;
    ctx.fillRect(a, GROUND - 6, b - a, H - GROUND + 6);
    ctx.strokeStyle = 'rgba(184,170,140,0.6)'; // the cracks in the salt
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(a / 34) * 34; x < Math.min(b, SEABED_END); x += 34) {
      ctx.moveTo(x, GROUND + 2);
      ctx.lineTo(x + 8, GROUND + 18);
      ctx.lineTo(x + 2, GROUND + 40);
      ctx.moveTo(x + 8, GROUND + 18);
      ctx.lineTo(x + 30, GROUND + 22);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,190,170,0.6)'; // shells
    for (let x = Math.floor(a / 57) * 57; x < Math.min(b, SEABED_END); x += 57) ellipse(ctx, x + 20, GROUND + 10 + (x % 3) * 9, 3, 2);
  }
  ctx.fillStyle = 'rgba(160,110,60,0.25)'; // ripples in the sand, east of the seabed
  for (let x = Math.floor(Math.max(L, SEABED_END) / 30) * 30; x < R; x += 30) ellipse(ctx, x + 12, GROUND + 14 + ((x / 30) % 4) * 10, 10, 1.4);
  if (L < JETTY_END) { // the water under the jetty, turquoise, lapping
    const wR = Math.min(R, JETTY_END);
    ctx.fillStyle = '#6ac8c8';
    ctx.fillRect(L, GROUND + 2, wR - L, H - GROUND);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let x = Math.floor(L / 60) * 60; x < wR; x += 60) {
      const k = Math.sin(time * 1.4 + x * 0.05);
      ctx.fillRect(x + 10 + k * 6, GROUND + 14 + (x % 120 ? 10 : 0), 26, 2);
    }
    ctx.fillStyle = '#efe8d8'; // where the water meets the seabed: a fringe of foam and salt
    ctx.beginPath();
    ctx.moveTo(JETTY_END - 10, H);
    ctx.quadraticCurveTo(JETTY_END - 30 + Math.sin(time) * 4, GROUND + 30, JETTY_END + 10, GROUND - 2);
    ctx.lineTo(JETTY_END + 40, GROUND - 2);
    ctx.lineTo(JETTY_END + 40, H);
    ctx.closePath();
    ctx.fill();
  }
}

// The new jetty: a long run of planks on piles out over the water, a rope rail, fresh wood at the end and old grey wood
// nearer the shore: Kesh moves it out every season and counts it a personal insult
function drawJetty(ctx, time) {
  const y = GROUND - 4;
  for (let x = 30; x < JETTY_END + 20; x += 58) {
    ctx.fillStyle = '#6a5040';
    ctx.fillRect(x - 4, y, 8, 46);
  }
  for (let x = 0; x < JETTY_END + 30; x += 22) {
    ctx.fillStyle = x < 260 ? '#c8a272' : '#9a8a78';
    ctx.fillRect(x, y - 4, 20, 8);
  }
  ctx.strokeStyle = '#c8b48a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 30; x < JETTY_END; x += 116) {
    ctx.moveTo(x, y - 40);
    ctx.quadraticCurveTo(x + 58, y - 30, x + 116, y - 40);
  }
  ctx.stroke();
  ctx.fillStyle = '#6a5040';
  for (let x = 30; x < JETTY_END; x += 116) ctx.fillRect(x - 3, y - 44, 6, 40);
}

// Kesh's water casks, lashed in a stack by the jetty's foot, one with a dipper on it
function drawCasks(ctx) {
  const x = KESH_X + 50, y = GROUND - 2;
  for (const [dx, dy] of [[-22, 0], [8, 0], [-7, -26]]) {
    ctx.fillStyle = '#9a6a42';
    ctx.strokeStyle = '#5a3a24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + dx, y + dy - 13, 14, 13, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#4a4a52';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + dx - 11, y + dy - 20);
    ctx.lineTo(x + dx + 11, y + dy - 20);
    ctx.moveTo(x + dx - 11, y + dy - 6);
    ctx.lineTo(x + dx + 11, y + dy - 6);
    ctx.stroke();
  }
}

// The Saltwind alongside the jetty: a long low caravan skiff, her hull sand-brown, a patched ochre sail furled on the
// yard, water casks and bales on deck, a string of brass bells at the stern
export function drawSaltwindHull(ctx, x, y, time, furled = true) {
  const bob = Math.sin(time * 1.2) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = '#8a6a48';
  ctx.strokeStyle = '#4a3424';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-180, -40);
  ctx.lineTo(170, -40);
  ctx.quadraticCurveTo(200, -40, 210, -64);
  ctx.quadraticCurveTo(190, -6, 130, 0);
  ctx.lineTo(-140, 0);
  ctx.quadraticCurveTo(-180, -6, -190, -48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c8583a'; // her band
  ctx.fillRect(-178, -34, 344, 6);
  text(ctx, 'SALTWIND', 60, -17, 12, '#f4e6c8');
  ctx.strokeStyle = '#5a4030'; // the mast and yard
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-10, -40);
  ctx.lineTo(-10, -230);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-120, -200);
  ctx.lineTo(110, -226);
  ctx.stroke();
  if (furled) {
    ctx.fillStyle = '#d89a3a'; // the ochre sail furled along the yard, a patch or two
    ctx.beginPath();
    ctx.moveTo(-118, -198);
    ctx.quadraticCurveTo(-5, -186, 108, -222);
    ctx.lineTo(108, -212);
    ctx.quadraticCurveTo(-5, -172, -118, -188);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c8b48a';
    ctx.fillRect(-60, -196, 14, 7);
    ctx.fillRect(40, -207, 12, 6);
  }
  for (const [dx, w, h, c] of [[-150, 34, 26, '#9a6a42'], [-110, 40, 22, '#e8dcc0'], [90, 30, 28, '#9a6a42'], [126, 36, 20, '#e8dcc0']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(dx - w / 2, -40 - h, w, h, 6);
    ctx.fill();
  }
  ctx.strokeStyle = '#c8b48a'; // the bells at the stern
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-188, -50);
  ctx.quadraticCurveTo(-200, -30, -196, -14);
  ctx.stroke();
  ctx.fillStyle = '#d8a84a';
  for (let i = 0; i < 4; i++) circle(ctx, -190 - i * 2 + Math.sin(time * 3 + i) * 1.5, -44 + i * 8, 2.6);
  ctx.restore();
}
function drawSaltwindAlongside(ctx, time) {
  drawSaltwindHull(ctx, DUNE_DOCK_X - 60, GROUND + 6, time);
}

// A boat careened on its side on the old seabed where the water left it: grey planks, ribs showing, the salt over it
function drawCareened(ctx, p) {
  const { x, y, w } = p;
  ctx.save();
  ctx.fillStyle = '#9a8a78';
  ctx.strokeStyle = '#5a4a3e';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - 20, GROUND);
  ctx.quadraticCurveTo(x - 10, y + 10, x + 10, y);
  ctx.lineTo(x + w - 10, y);
  ctx.quadraticCurveTo(x + w + 20, y + 20, x + w + 30, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,74,62,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let k = 1; k < 4; k++) {
    ctx.moveTo(x - 10 + k * 3, y + k * 20);
    ctx.lineTo(x + w + 10 + k * 4, y + k * 20);
  }
  ctx.stroke();
  ctx.fillStyle = '#b8a890';
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 8, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(244,240,226,0.8)'; // salt crusted along the top
  for (let k = 0; k < 6; k++) ellipse(ctx, x + 14 + k * (w - 28) / 5, y - 3, 8, 2);
  ctx.restore();
}

// Saltmouth's piers: great stone piers standing high and dry on the sand, steps up their sides, iron mooring rings far
// over your head, a white salt line along every wall where the sea used to come to
function drawPiers(ctx, p, time) {
  const top = p.y;
  for (const [x0, x1, h] of [[SEABED_END, SEABED_END + 160, 120], [p.x, p.x + p.w, GROUND - top], [p.x + p.w + 30, p.x + p.w + 70, 90]]) {
    ctx.fillStyle = '#c8a478';
    ctx.strokeStyle = '#8a6a48';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x0, GROUND - h, x1 - x0, h);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(138,106,72,0.45)'; // the courses
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = GROUND - h + 22; y < GROUND; y += 22) {
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(244,240,226,0.9)'; // the salt line
    ctx.fillRect(x0, GROUND - Math.min(h, 70), x1 - x0, 4);
    ctx.fillStyle = 'rgba(106,138,90,0.35)'; // old weed, dried, below it
    ctx.fillRect(x0, GROUND - Math.min(h, 70) + 4, x1 - x0, 10);
  }
  ctx.fillStyle = '#d8b488'; // the long pier's top, a walkway
  ctx.beginPath();
  ctx.roundRect(p.x - 4, top - 4, p.w + 8, 9, 3);
  ctx.fill();
  ctx.strokeStyle = '#4a4a52'; // mooring rings, high up
  ctx.lineWidth = 3;
  for (const x of [SEABED_END + 40, SEABED_END + 120, p.x + 60, p.x + 170]) {
    ctx.beginPath();
    ctx.arc(x, GROUND - 100, 7, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = '#b8946a'; // steps up the long pier's west end
  for (let i = 0; i < 6; i++) ctx.fillRect(p.x - 26 - i * 0, GROUND - 22 * (i + 1) + 8, 26 - i * 3, 22 * (i + 1) - 8 > 0 ? 6 : 0);
  // a bollard on the long pier, a rope still on it, cut
  ctx.fillStyle = '#5a5458';
  ctx.beginPath();
  ctx.roundRect(p.x + p.w - 40, top - 22, 16, 18, 4);
  ctx.fill();
  ctx.strokeStyle = '#c8b48a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x + p.w - 32, top - 12);
  ctx.quadraticCurveTo(p.x + p.w - 10, top + 6, p.x + p.w + 4, top + 28 + Math.sin(time) * 2);
  ctx.stroke();
}

// A tent: a striped pitched tent, some of them half struck (one side down, the poles leaning, bundles beside)
function drawTent(ctx, tn, time, far) {
  const { x, w, c, struck } = tn, h = far ? 70 : 92, base = GROUND - (far ? 34 : 0);
  ctx.save();
  if (far) ctx.globalAlpha = 0.55;
  const peak = base - h, lean = struck * 26;
  ctx.fillStyle = c[0];
  ctx.strokeStyle = 'rgba(60,40,30,0.5)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, base);
  ctx.lineTo(x + lean, peak + struck * 20);
  ctx.lineTo(x + w / 2 - struck * w * 0.3, base - struck * 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = c[1];
  for (let k = -w / 2; k < w / 2; k += 22) {
    ctx.beginPath();
    ctx.moveTo(x + k, base);
    ctx.lineTo(x + lean + k * 0.08, peak);
    ctx.lineTo(x + lean + k * 0.08 + 4, peak);
    ctx.lineTo(x + k + 10, base);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = '#5a4030'; // the pole
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + lean * 0.5, base);
  ctx.lineTo(x + lean, peak + struck * 20 - 10);
  ctx.stroke();
  if (struck > 0.3 && !far) { // bundles, half packed
    ctx.fillStyle = '#e8dcc0';
    ctx.beginPath();
    ctx.roundRect(x + w / 2 - 6, base - 22, 30, 22, 7);
    ctx.fill();
    ctx.strokeStyle = '#9a7a52';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + w / 2 + 9, base - 22);
    ctx.lineTo(x + w / 2 + 9, base);
    ctx.stroke();
  }
  ctx.restore();
}

// A pack-lizard dozing in the shade: a slime-sized sand lizard, a pack still strapped on, its tail curled, now and then
// one eye opening
function drawPackLizard(ctx, lz, time) {
  const { x, f } = lz, y = GROUND - 2, br = Math.sin(time * 1.2 + x) * 1.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f, 1);
  ctx.fillStyle = '#c89a5a';
  ctx.strokeStyle = '#8a6438';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-50, 0);
  ctx.quadraticCurveTo(-70, -6, -56, -14);
  ctx.quadraticCurveTo(-30, -36 - br, 10, -32 - br);
  ctx.quadraticCurveTo(44, -30, 50, -14);
  ctx.quadraticCurveTo(54, 0, 40, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3e4a7a'; // the pack, strapped on
  ctx.beginPath();
  ctx.roundRect(-20, -46 - br, 34, 18, 6);
  ctx.fill();
  ctx.strokeStyle = '#8a6438';
  ctx.beginPath();
  ctx.moveTo(-4, -28 - br);
  ctx.lineTo(-4, -6);
  ctx.stroke();
  ctx.strokeStyle = '#3a2a1e'; // closed eye
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if ((time + x) % 7 < 0.6) ellipse(ctx, 38, -20, 2, 2.6);
  else {
    ctx.arc(38, -21, 2.6, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

// Tally's counting-stall: a low counter under a striped canopy, tally sticks in a jar, a balance with weights, his ledger
// open, strings of beads hung from the canopy's edge
function drawTallyStall(ctx, time) {
  const x = TALLY_X, y = GROUND;
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(x - 70, y - 120, 5, 120);
  ctx.fillRect(x + 65, y - 120, 5, 120);
  ctx.fillStyle = '#3e4a7a';
  ctx.beginPath();
  ctx.moveTo(x - 84, y - 118);
  ctx.lineTo(x + 84, y - 118);
  ctx.lineTo(x + 76, y - 100);
  ctx.lineTo(x - 76, y - 100);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8c88a';
  for (let k = -76; k < 76; k += 24) ctx.fillRect(x + k, y - 118, 12, 18);
  for (let k = -64; k <= 64; k += 32) { // bead strings
    ctx.strokeStyle = '#8a6a48';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + k, y - 100);
    ctx.lineTo(x + k + Math.sin(time + k) * 1.5, y - 76);
    ctx.stroke();
    ctx.fillStyle = k % 64 ? '#b8583a' : '#d8a84a';
    for (let i = 0; i < 4; i++) circle(ctx, x + k + Math.sin(time + k) * 1.5 * (i / 4), y - 96 + i * 6, 1.8);
  }
  ctx.fillStyle = '#9a7a52'; // the counter
  ctx.beginPath();
  ctx.roundRect(x - 64, y - 46, 128, 46, 6);
  ctx.fill();
  ctx.fillStyle = '#b8946a';
  ctx.fillRect(x - 64, y - 48, 128, 6);
  ctx.fillStyle = '#f0e6cc'; // the open ledger
  ctx.fillRect(x - 46, y - 54, 34, 7);
  ctx.strokeStyle = '#6a4a2e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 29, y - 54);
  ctx.lineTo(x - 29, y - 47);
  ctx.stroke();
  ctx.fillStyle = '#c8b48a'; // the jar of tally sticks
  ctx.fillRect(x + 4, y - 64, 12, 16);
  ctx.strokeStyle = '#8a6a48';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.moveTo(x + 6 + i * 2, y - 64);
    ctx.lineTo(x + 4 + i * 3, y - 76);
  }
  ctx.stroke();
  ctx.strokeStyle = '#d8a84a'; // the balance
  ctx.lineWidth = 1.6;
  const tip = Math.sin(time * 0.7) * 3;
  ctx.beginPath();
  ctx.moveTo(x + 40, y - 48);
  ctx.lineTo(x + 40, y - 74);
  ctx.moveTo(x + 26, y - 72 + tip);
  ctx.lineTo(x + 54, y - 72 - tip);
  ctx.stroke();
  ctx.fillStyle = '#d8a84a';
  ellipse(ctx, x + 26, y - 64 + tip, 6, 2);
  ellipse(ctx, x + 54, y - 64 - tip, 6, 2);
}

// The well: a deep ring of dressed stone, a windlass on two posts with the rope marked in knots (Asra marks it every
// morning, a little further down), the bucket on the rim, a drinking trough beside it, and the dark going down
function drawWell(ctx, time, freed = false) {
  const x = WELL_X, y = GROUND;
  ctx.fillStyle = '#b89a72'; // the trough
  ctx.beginPath();
  ctx.roundRect(x + 46, y - 18, 50, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#6ab0b0';
  ctx.fillRect(x + 50, y - 16, 42, 3);
  ctx.fillStyle = '#c8a478'; // the ring
  ctx.strokeStyle = '#7a5a38';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 44, y - 40, 88, 40, 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122,90,56,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = -36; k < 44; k += 18) {
    ctx.moveTo(x + k, y - 40);
    ctx.lineTo(x + k, y);
  }
  ctx.moveTo(x - 44, y - 20);
  ctx.lineTo(x + 44, y - 20);
  ctx.stroke();
  ctx.fillStyle = '#2a2018';
  ctx.beginPath();
  ctx.ellipse(x, y - 40, 40, 7, 0, 0, TAU);
  ctx.fill();
  if (freed) { // (Old Carapace freed: the water's come up, near enough to see from the top, glinting)
    ctx.fillStyle = 'rgba(90,170,190,0.9)';
    ctx.beginPath();
    ctx.ellipse(x, y - 39, 30, 4.5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(time * 3)})`;
    ctx.fillRect(x - 8 + Math.sin(time * 1.3) * 6, y - 40, 7, 1.4);
  }
  ctx.fillStyle = '#5a4030'; // the windlass
  ctx.fillRect(x - 40, y - 104, 6, 64);
  ctx.fillRect(x + 34, y - 104, 6, 64);
  ctx.fillRect(x - 40, y - 104, 80, 6);
  ctx.fillStyle = '#7a5a3e';
  ctx.beginPath();
  ctx.ellipse(x, y - 86, 26, 7, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#d8c49a'; // the rope down, its knots
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 82);
  ctx.lineTo(x, y - 40);
  ctx.stroke();
  ctx.fillStyle = '#d8c49a';
  for (let i = 0; i < 4; i++) circle(ctx, x, y - 76 + i * 9, 2);
  ctx.strokeStyle = '#5a4030'; // the crank
  ctx.lineWidth = 3;
  const a = time * 0.4;
  ctx.beginPath();
  ctx.moveTo(x + 40, y - 86);
  ctx.lineTo(x + 52 + Math.cos(a) * 10, y - 86 + Math.sin(a) * 10);
  ctx.stroke();
  ctx.fillStyle = '#9a6a42'; // the bucket on the rim
  ctx.beginPath();
  ctx.moveTo(x - 36, y - 56);
  ctx.lineTo(x - 18, y - 56);
  ctx.lineTo(x - 20, y - 40);
  ctx.lineTo(x - 34, y - 40);
  ctx.closePath();
  ctx.fill();
}

// A stack of packs and bundles, roped, ready for a journey nobody's going on
function drawPacks(ctx, p) {
  const { x, y, w } = p;
  for (const [dx, dy, bw, bh, c] of [[0, 0, w * 0.55, GROUND - y - 30, '#e8dcc0'], [w * 0.5, 0, w * 0.5, GROUND - y - 40, '#3e4a7a'], [w * 0.15, -(GROUND - y - 30), w * 0.7, 30, '#c8583a']]) {
    ctx.fillStyle = c;
    ctx.strokeStyle = 'rgba(60,40,30,0.5)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(x + dx, GROUND - bh + dy, bw, bh, 8);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = '#8a6a48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y);
  ctx.lineTo(x + w * 0.3, GROUND);
  ctx.moveTo(x + w * 0.75, y + 10);
  ctx.lineTo(x + w * 0.75, GROUND);
  ctx.stroke();
}

// The home tent: a big round tent striped indigo and gold, its door flap tied back, a lamp of amber glass by it
function drawHomeTent(ctx, time) {
  const x = DUNE_HOME_X, y = GROUND;
  ctx.fillStyle = '#3e4a7a';
  ctx.strokeStyle = '#26305a';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - 80, y);
  ctx.quadraticCurveTo(x - 76, y - 110, x, y - 140);
  ctx.quadraticCurveTo(x + 76, y - 110, x + 80, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#e8c88a';
  for (let k = -80; k < 80; k += 32) {
    ctx.beginPath();
    ctx.moveTo(x + k, y);
    ctx.lineTo(x, y - 140);
    ctx.lineTo(x + k + 14, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#2a1e18'; // the doorway
  ctx.beginPath();
  ctx.moveTo(x - 26, y);
  ctx.quadraticCurveTo(x - 24, y - 70, x, y - 82);
  ctx.quadraticCurveTo(x + 24, y - 70, x + 26, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c8583a'; // the flap, tied back
  ctx.beginPath();
  ctx.moveTo(x, y - 82);
  ctx.quadraticCurveTo(x + 30, y - 50, x + 36, y - 30);
  ctx.lineTo(x + 26, y - 26);
  ctx.quadraticCurveTo(x + 18, y - 54, x, y - 82);
  ctx.fill();
  ctx.fillStyle = '#d8a84a';
  circle(ctx, x, y - 142, 5);
  drawLantern(ctx, x - 52, time, 70);
}

// A tent's awning stretched out on poles, flat enough to stand on
function drawAwning(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(x + 6, y, 5, GROUND - y);
  ctx.fillRect(x + w - 11, y, 5, GROUND - y);
  ctx.fillStyle = '#d89a3a';
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 4);
  ctx.lineTo(x + w + 6, y - 4);
  ctx.lineTo(x + w + 6, y + 10);
  for (let k = w + 6; k > -6; k -= 18) ctx.quadraticCurveTo(x + k - 9, y + 18 + Math.sin(time * 2 + k) * 1, x + k - 18, y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4ecd8';
  for (let k = 0; k < w; k += 36) ctx.fillRect(x + k, y - 4, 16, 14);
  ctx.fillStyle = '#c8583a'; // the tent behind it, half struck
  ctx.beginPath();
  ctx.moveTo(x + 10, GROUND);
  ctx.lineTo(x + w * 0.3, y + 16);
  ctx.lineTo(x + w * 0.9, GROUND);
  ctx.closePath();
  ctx.fill();
}

// The Star Court: a ring of Keeper star-dials half buried in the sand at the town's edge (great bronze rings and a tilted
// dial face), a rug laid in the middle with cushions, where Mother Dune sits at night; the dials gone green
function drawStarCourt(ctx, p, time, freed = false) {
  const cx = MOTHER_X + 120;
  if (freed) { // (Old Carapace freed: her tent struck at last, rolled and tied, two packs and a pole beside it)
    const bx = MOTHER_X - 120;
    ctx.fillStyle = '#c8583a';
    ctx.beginPath();
    ctx.roundRect(bx - 34, GROUND - 18, 68, 18, 9);
    ctx.fill();
    ctx.fillStyle = '#e8c890';
    for (const dx of [-20, 0, 20]) ctx.fillRect(bx + dx - 2, GROUND - 18, 4, 18);
    ctx.fillStyle = '#7a4a2a';
    ctx.beginPath();
    ctx.roundRect(bx + 40, GROUND - 22, 26, 22, 6);
    ctx.roundRect(bx - 66, GROUND - 18, 24, 18, 6);
    ctx.fill();
    ctx.strokeStyle = '#5a3a24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx - 50, GROUND - 4);
    ctx.lineTo(bx + 60, GROUND - 30);
    ctx.stroke();
  }
  ctx.fillStyle = '#c8583a'; // the rug
  ctx.beginPath();
  ctx.ellipse(MOTHER_X, GROUND + 6, 80, 9, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#f4d68a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(MOTHER_X, GROUND + 6, 66, 6, 0, 0, TAU);
  ctx.stroke();
  for (const [dx, r, a, th] of [[-150, 70, 0.2, 5], [110, 90, -0.35, 6]]) { // bronze rings, half sunk (a third, further east, went for the fair's plot)
    ctx.strokeStyle = '#8a7a4a';
    ctx.lineWidth = th + 2;
    ctx.beginPath();
    ctx.ellipse(cx + dx, GROUND + 10, r, r * 0.9, a, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.strokeStyle = '#c8a050';
    ctx.lineWidth = th - 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(106,168,152,0.6)';
    circle(ctx, cx + dx + Math.cos(Math.PI * 1.4 + a) * r, GROUND + 10 + Math.sin(Math.PI * 1.4 + a) * r * 0.9, 4);
  }
  // the tilted dial face (its rim is the platform), star marks round it
  const { x, y, w } = p;
  ctx.fillStyle = '#a88a52';
  ctx.strokeStyle = '#6a5428';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, GROUND);
  ctx.lineTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w + 10, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c8a860';
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 8, 3);
  ctx.fill();
  ctx.fillStyle = '#26305a';
  for (let i = 0; i < 7; i++) circle(ctx, x + 18 + i * (w - 36) / 6, y + 22 + (i % 2) * 12, 2.4);
  ctx.strokeStyle = 'rgba(38,48,90,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 22);
  for (let i = 1; i < 7; i++) ctx.lineTo(x + 18 + i * (w - 36) / 6, y + 22 + (i % 2) * 12);
  ctx.stroke();
}

// A lantern of amber glass on a pole, lit even by day
function drawLantern(ctx, x, time, h = 110) {
  const y = GROUND;
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(x - 2.5, y - h, 5, h);
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.quadraticCurveTo(x + 12, y - h - 8, x + 16, y - h + 4);
  ctx.stroke();
  const g = ctx.createRadialGradient(x + 16, y - h + 18, 2, x + 16, y - h + 18, 30);
  g.addColorStop(0, `rgba(255,190,90,${0.35 + 0.1 * Math.sin(time * 3 + x)})`);
  g.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 14, y - h - 12, 60, 60);
  ctx.fillStyle = '#7a4a1e';
  ctx.beginPath();
  ctx.roundRect(x + 9, y - h + 6, 14, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#ffb84a';
  ctx.beginPath();
  ctx.roundRect(x + 11.5, y - h + 9, 9, 14, 3);
  ctx.fill();
}

// The way out onto the Glass Dunes
function drawExitSign(ctx, x, time) {
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(x - 3, GROUND - 92, 6, 94);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.6) * 0.03);
  ctx.fillStyle = '#e8d0a0';
  ctx.strokeStyle = '#8a6a48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-60, -12);
  ctx.lineTo(54, -12);
  ctx.lineTo(66, 0);
  ctx.lineTo(54, 12);
  ctx.lineTo(-60, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Glass Dunes', 0, 1, 12, '#4a3424');
  ctx.fillStyle = '#d0485a';
  ctx.fillRect(-3, 12, 6, 10);
  ctx.restore();
}
export { DUNE_SPAWN_X, SALTFLATS_GATE_X, DUNE_WAY_X };
