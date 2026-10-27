// Docs: docs/places/blacksands.md
// The Black Sands (room BLACKSANDS, data in src/shared/rpg.js): the beach west of Forgehold's quay, out along the
// beach path past Auntie Soot's springs. Black sand glittering wet at the waterline, warm green shallows, little
// geysers puffing (drawing only), sea stacks standing in the water. You come in at the EAST end and walk west:
// the Beach Path (no mobs; the Turning Stone, drawn by src/ruins.js), the Warm Shallows (basalt boulders, hot
// pools), the Stacks (columns of basalt, SANDS_PLATFORMS) and the Bellowing Vent, a great yellow-crusted vent
// mound where the Bellower squats, against the black cliffs at the west end. The Kettle, a little hot pool on top
// of the tallest stack with two mugs left on its rim, is the hidden spot (last in SANDS_PLATFORMS). Behind: an
// ash-hazed afternoon over a warm sea, the other islands far off to the north, the island's smoke column back
// east over Forgehold. This room paints its own sky.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { SANDS_W, SANDS_EXIT_X, SANDS_ZONES, SANDS_PLATFORMS, SANDS_VENT_X, FIELD_GROUND } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';

const GROUND = FIELD_GROUND;
const HORIZON = 300;
const KETTLE = SANDS_PLATFORMS.at(-1);
const BASALT = '#3e3844', BASALT_D = '#24202a', BASALT_L = '#5e5664', SULPHUR = '#f2d45a';
const WOOD = '#6a5048', WOOD_D = '#4a3630';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
const ash = (() => {
  const r = mulberry32(541);
  return Array.from({ length: 46 }, () => ({ x: r() * W, y: r() * H, s: 0.8 + r() * 1.3, v: 7 + r() * 12, p: r() * TAU }));
})();
const glints = (() => {
  const r = mulberry32(543);
  return Array.from({ length: 30 }, () => ({ x: r() * 1800, y: r(), w: 10 + r() * 22, p: r() * TAU }));
})();
// far sea stacks out in the water (parallax), x in a 2400 px loop
const farStacks = (() => {
  const r = mulberry32(547);
  return Array.from({ length: 9 }, () => ({ x: r() * 2400, h: 30 + r() * 70, w: 14 + r() * 22, lean: (r() - 0.5) * 0.2 }));
})();
// hot pools in the sand and little geysers (drawing only: a geyser that throws you would be a step() job)
const POOLS = [{ x: 3180, w: 60 }, { x: 3620, w: 46 }, { x: 2780, w: 52 }, { x: 2260, w: 70 }, { x: 1760, w: 50 }, { x: 1240, w: 58 }, { x: 260, w: 44 }];
const GEYSERS = [{ x: 3420, p: 0.1 }, { x: 2600, p: 0.55 }, { x: 1420, p: 0.3 }, { x: 1080, p: 0.8 }];

// Everything on the Black Sands behind the slimes
export function drawBlackSands(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0); // sky and sea in screen space
  drawSky(ctx, camX, time);
  ctx.restore();

  const L = camX - 140, R = camX + viewW + 140;
  if (visible(-200, 260, L, R)) drawCliffs(ctx, time);
  drawSand(ctx, Math.max(0, L), Math.min(SANDS_W, R));
  if (visible(SANDS_VENT_X - 280, SANDS_VENT_X + 280, L, R)) drawVent(ctx, time);
  for (const p of POOLS) if (visible(p.x - 90, p.x + 90, L, R)) drawPool(ctx, p, time);
  for (const g of GEYSERS) if (visible(g.x - 60, g.x + 60, L, R)) drawLittleGeyser(ctx, g, time);
  for (const p of SANDS_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'basalt') drawBoulder(ctx, p, time);
    else if (p.kind === 'stack') drawStack(ctx, p, time);
  }
  if (visible(KETTLE.x - 60, KETTLE.x + KETTLE.w + 60, L, R)) drawKettle(ctx, KETTLE, time);
  if (visible(3900, SANDS_W, L, R)) drawPath(ctx, Math.max(3900, L), Math.min(SANDS_W, R));
  SANDS_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x1 - 30; // you walk in from the east: each zone's sign stands at its east edge
    if (visible(sx - 90, sx + 90, L, R)) drawZoneSign(ctx, sx, z, i, time);
  });
  if (visible(SANDS_EXIT_X - 260, SANDS_W, L, R)) drawExitSign(ctx, SANDS_EXIT_X - 110, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawAir(ctx, camX, time);
  ctx.restore();
}

// ——— the sky and the sea ———
let skyGrad = null, seaGrad = null, gradCtx = null;
function drawSky(ctx, camX, time) {
  if (gradCtx !== ctx) {
    gradCtx = ctx;
    skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON);
    skyGrad.addColorStop(0, '#6e5068');
    skyGrad.addColorStop(0.55, '#c48a7a');
    skyGrad.addColorStop(1, '#f0c098');
    seaGrad = ctx.createLinearGradient(0, HORIZON, 0, GROUND);
    seaGrad.addColorStop(0, '#dcc8aa');
    seaGrad.addColorStop(0.3, '#86b09e');
    seaGrad.addColorStop(1, '#52807a');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  // the sun, a pale disc through the haze, over the sea to the west
  ctx.fillStyle = 'rgba(255,220,180,0.25)';
  circle(ctx, 180 - camX * 0.01, 120, 64);
  ctx.fillStyle = '#ffd2a0';
  circle(ctx, 180 - camX * 0.01, 120, 24);
  // the island's smoke column, back east over Forgehold
  const sx = W * 0.95 - camX * 0.04 + 100;
  for (let i = 0; i < 14; i++) {
    const k = (i / 14 + time * 0.008) % 1;
    ctx.fillStyle = `rgba(110,84,98,${0.45 * (1 - k * 0.6)})`;
    circle(ctx, sx - k * k * 380 + Math.sin(i * 1.9 + time * 0.2) * 14, 230 - k * 300, 36 + k * 80);
  }
  drawDistantIslands(ctx, { from: 'ember', scroll: camX, roomW: SANDS_W, time, horizon: HORIZON, haze: '#f0c098', fade: 0.6, scale: 0.55, night: 0.1, sky: 220 });
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  ctx.fillStyle = 'rgba(255,240,220,0.55)';
  ctx.fillRect(0, HORIZON, W, 1.5);
  // far sea stacks, steam hanging round their feet
  for (const s of farStacks) {
    const x = (((s.x - camX * 0.18) % 2400) + 2400) % 2400 - 300;
    if (x < -60 || x > W + 60) continue;
    ctx.fillStyle = 'rgba(90,74,92,0.55)';
    ctx.beginPath();
    ctx.moveTo(x - s.w / 2, HORIZON + 8);
    ctx.lineTo(x - s.w * 0.36 + s.lean * s.h, HORIZON + 8 - s.h);
    ctx.lineTo(x + s.w * 0.36 + s.lean * s.h, HORIZON + 8 - s.h);
    ctx.lineTo(x + s.w / 2, HORIZON + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(250,244,236,0.3)';
    ellipse(ctx, x, HORIZON + 6, s.w * 1.2, 4);
  }
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

// Ash drifting down, thinner than in town, and a low warm haze along the sand
function drawAir(ctx, camX, time) {
  ctx.fillStyle = 'rgba(126,112,118,0.5)';
  for (const a of ash) {
    const y = (a.y + time * a.v) % H;
    const x = ((((a.x - camX * 0.25 + Math.sin(time * 0.6 + a.p) * 14) % W) + W) % W);
    circle(ctx, x, y, a.s);
  }
}

// ——— the ground ———

// Black sand: dark, finely speckled, wet and shiny at the waterline, with lines of foam
function drawSand(ctx, L, R) {
  if (R <= L) return;
  ctx.fillStyle = '#3a3038';
  ctx.fillRect(L, GROUND - 4, R - L, H - GROUND + 4);
  ctx.fillStyle = '#4a3e46';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 6, R - L + 8, 12, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,236,220,0.28)';
  for (let x = Math.floor(L / 11) * 11; x < R; x += 11) circle(ctx, x + (x % 3) * 3, GROUND + 6 + ((x * 7) % 46), 1);
  ctx.fillStyle = 'rgba(255,230,220,0.2)';
  for (let x = Math.floor(L / 80) * 80; x < R; x += 80) ellipse(ctx, x + 40, GROUND + 20 + (x % 160 ? 8 : 0), 24, 3);
}

// The black cliffs at the west end: the beach stops against them
function drawCliffs(ctx, time) {
  ctx.fillStyle = BASALT_D;
  ctx.beginPath();
  ctx.moveTo(-200, GROUND + 4);
  ctx.lineTo(-200, 40);
  ctx.lineTo(60, 60);
  ctx.lineTo(110, 160);
  ctx.lineTo(90, 260);
  ctx.lineTo(150, 350);
  ctx.lineTo(130, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = BASALT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const x of [-40, 10, 50, 80]) {
    ctx.moveTo(x, 70);
    ctx.lineTo(x + 16, GROUND);
  }
  ctx.stroke();
  for (let i = 0; i < 4; i++) { // steam seeping out of the cliff's foot
    const k = (time * 0.2 + i / 4) % 1;
    ctx.fillStyle = `rgba(250,248,246,${0.35 * Math.sin(k * Math.PI)})`;
    circle(ctx, 120 + Math.sin(i * 2.1) * 20, GROUND - 10 - k * 120, 12 + k * 18);
  }
}

// The Bellowing Vent: a low mound of crusted rock, yellow with sulphur, steaming out of a hole in its top
function drawVent(ctx, time) {
  const x = SANDS_VENT_X;
  ctx.fillStyle = '#5a4e58';
  ctx.beginPath();
  ctx.moveTo(x - 260, GROUND + 4);
  ctx.quadraticCurveTo(x - 140, GROUND - 70, x - 40, GROUND - 78);
  ctx.lineTo(x + 40, GROUND - 78);
  ctx.quadraticCurveTo(x + 140, GROUND - 70, x + 260, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(242,212,90,0.55)';
  for (const [dx, dy, r] of [[-120, -36, 22], [-60, -62, 18], [70, -60, 20], [140, -30, 24], [10, -70, 14]]) ellipse(ctx, x + dx, GROUND + dy, r, r * 0.45);
  ctx.fillStyle = '#2a2230';
  ellipse(ctx, x, GROUND - 76, 36, 7);
  ctx.fillStyle = 'rgba(255,150,80,0.4)';
  ellipse(ctx, x, GROUND - 76, 22, 4);
  for (let i = 0; i < 8; i++) {
    const k = (time * 0.25 + i / 8) % 1;
    ctx.fillStyle = `rgba(250,248,246,${0.5 * Math.sin(k * Math.PI)})`;
    circle(ctx, x + Math.sin(i * 2.7 + time * 0.3) * 24, GROUND - 80 - k * 200, 16 + k * 34);
  }
}

// A hot pool in the sand, green and steaming
function drawPool(ctx, p, time) {
  ctx.fillStyle = '#5aa094';
  ellipse(ctx, p.x, GROUND + 6, p.w, 8);
  ctx.fillStyle = 'rgba(200,240,230,0.5)';
  ellipse(ctx, p.x - p.w * 0.3, GROUND + 4, p.w * 0.3, 2.6);
  ctx.fillStyle = 'rgba(242,212,90,0.5)'; // a sulphur rim
  ellipse(ctx, p.x + p.w * 0.85, GROUND + 4, 8, 3);
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.22 + i / 3 + p.x * 0.001) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.4 * Math.sin(k * Math.PI)})`;
    circle(ctx, p.x - p.w * 0.5 + i * p.w * 0.45 + Math.sin(k * 5 + i) * 8, GROUND - k * 60, 7 + k * 14);
  }
}

// A little geyser: a scalded ring that bubbles, and now and then a short white spout
function drawLittleGeyser(ctx, g, time) {
  ctx.fillStyle = '#c8b8a4';
  ellipse(ctx, g.x, GROUND + 2, 30, 5);
  ctx.fillStyle = '#6ab4a8';
  ellipse(ctx, g.x, GROUND + 1, 13, 3);
  const ph = (time * 0.18 + g.p) % 1;
  if (ph < 0.18) {
    const k = ph / 0.18, h = Math.sin(k * Math.PI) * 120;
    ctx.fillStyle = 'rgba(250,252,250,0.85)';
    ctx.beginPath();
    ctx.moveTo(g.x - 7, GROUND);
    ctx.quadraticCurveTo(g.x - 3, GROUND - h * 0.6, g.x - 5, GROUND - h);
    ctx.lineTo(g.x + 5, GROUND - h);
    ctx.quadraticCurveTo(g.x + 3, GROUND - h * 0.6, g.x + 7, GROUND);
    ctx.closePath();
    ctx.fill();
    circle(ctx, g.x, GROUND - h, 10 + k * 6);
  }
  const k = (time * 0.3 + g.p) % 1;
  ctx.fillStyle = `rgba(250,248,246,${0.35 * Math.sin(k * Math.PI)})`;
  circle(ctx, g.x, GROUND - 10 - k * 70, 8 + k * 14);
}

// A basalt boulder with a flat top (a platform), wet and dark, a few barnacles and a crust of sand
function drawBoulder(ctx, p, time) {
  const top = p.y, x0 = p.x - 10, x1 = p.x + p.w + 10;
  ctx.fillStyle = BASALT;
  ctx.beginPath();
  ctx.moveTo(x0 - 14, GROUND + 4);
  ctx.quadraticCurveTo(x0 - 8, top + 20, x0 + 10, top + 2);
  ctx.lineTo(x1 - 10, top + 2);
  ctx.quadraticCurveTo(x1 + 8, top + 20, x1 + 14, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = BASALT_L;
  ctx.beginPath();
  ctx.roundRect(p.x - 4, top - 2, p.w + 8, 9, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,240,220,0.5)';
  for (let i = 0; i < 6; i++) circle(ctx, p.x + 12 + i * (p.w - 24) / 5, top + 18 + (i % 3) * 14, 1.1);
  ctx.fillStyle = '#c8bcc0'; // barnacles low down
  for (let i = 0; i < 5; i++) circle(ctx, x0 + 10 + i * (x1 - x0 - 20) / 4, GROUND - 6 - (i % 2) * 6, 2.4);
  ctx.fillStyle = 'rgba(200,240,230,0.25)';
  ellipse(ctx, p.x + p.w * 0.3, top + 4, p.w * 0.2, 2);
}

// A sea stack: a column of jointed basalt standing up out of the shallows, flat on top (a platform)
function drawStack(ctx, p, time) {
  stackColumn(ctx, p.x, p.w, p.y);
}
function stackColumn(ctx, x, w, top) {
  ctx.fillStyle = 'rgba(250,244,236,0.35)'; // foam round its foot
  ellipse(ctx, x + w / 2, GROUND + 6, w * 0.7, 6);
  ctx.fillStyle = BASALT;
  ctx.beginPath();
  ctx.moveTo(x - 16, GROUND + 4);
  ctx.lineTo(x - 2, top + 4);
  ctx.lineTo(x + w + 2, top + 4);
  ctx.lineTo(x + w + 16, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  // the columns' joints
  ctx.strokeStyle = BASALT_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 1; i < 5; i++) {
    const k = i / 5;
    ctx.moveTo(x + w * k, top + 8);
    ctx.lineTo(x - 14 + (w + 28) * k, GROUND);
  }
  for (let y = top + 40; y < GROUND - 10; y += 46) {
    ctx.moveTo(x + 2, y);
    ctx.lineTo(x + w - 2, y + 6);
  }
  ctx.stroke();
  ctx.fillStyle = BASALT_L;
  ctx.beginPath();
  ctx.roundRect(x - 4, top - 2, w + 8, 9, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; // seabird whitewash
  for (const k of [0.2, 0.55, 0.8]) ellipse(ctx, x + w * k, top + 12, 6, 3);
}

// The Kettle: the tallest stack, a little hot pool cupped in its top, two tin mugs left on the rim, steam rising
function drawKettle(ctx, p, time) {
  stackColumn(ctx, p.x, p.w, p.y);
  const cx = p.x + p.w * 0.55;
  ctx.fillStyle = '#4a8a80';
  ellipse(ctx, cx, p.y + 3, p.w * 0.3, 4);
  ctx.fillStyle = 'rgba(200,240,230,0.6)';
  ellipse(ctx, cx - 6, p.y + 2, 8, 1.5);
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.25 + i / 3) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.45 * Math.sin(k * Math.PI)})`;
    circle(ctx, cx - 10 + i * 10, p.y - k * 50, 6 + k * 10);
  }
  // two mugs on the rim, one tipped over
  for (const [mx, tip] of [[p.x + 12, 0], [p.x + p.w - 14, 1.3]]) {
    ctx.save();
    ctx.translate(mx, p.y - 1);
    ctx.rotate(tip);
    ctx.fillStyle = '#c8c4cc';
    ctx.strokeStyle = '#5e5a66';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-5, -11, 10, 11, 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(6, -6, 3, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.fillStyle = '#d0485a';
    ctx.fillRect(-5, -8, 10, 2);
    ctx.restore();
  }
}

// The Beach Path: flat stones laid in the sand toward Forgehold, a marker post with a red rag
function drawPath(ctx, L, R) {
  ctx.fillStyle = '#6a5a62';
  for (let x = Math.floor(L / 46) * 46; x < R; x += 46) ellipse(ctx, x + 20, GROUND + 3, 14, 4);
  ctx.fillStyle = 'rgba(255,240,230,0.2)';
  for (let x = Math.floor(L / 46) * 46; x < R; x += 46) ellipse(ctx, x + 16, GROUND + 1.5, 6, 1.4);
}

// Each zone's sign: a driftwood board on two posts with the zone's name and levels (red for the deepest)
function drawZoneSign(ctx, x, z, i, time) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(140, ctx.measureText(z.name).width + 30);
  ctx.fillStyle = WOOD_D;
  ctx.fillRect(x - tw / 2 + 10, GROUND - 92, 5, 92);
  ctx.fillRect(x + tw / 2 - 15, GROUND - 92, 5, 92);
  ctx.save();
  ctx.translate(x, GROUND - 66);
  ctx.fillStyle = '#b89a86';
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 46, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -6, 15, '#3a2a26');
  const red = i === 0;
  ctx.fillStyle = red ? '#d0485a' : 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-32, 6, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 14.5, 11, red ? '#fffaf0' : '#3a2a26');
  ctx.fillStyle = 'rgba(140,130,136,0.8)'; // ash settled on top
  ctx.beginPath();
  ctx.roundRect(-tw / 2 - 2, -23, tw + 4, 5, 3);
  ctx.fill();
  ctx.restore();
}

// The way back to town
function drawExitSign(ctx, x, time) {
  ctx.fillStyle = WOOD;
  ctx.fillRect(x - 3, GROUND - 92, 6, 94);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.6) * 0.03);
  ctx.fillStyle = '#d8b898';
  ctx.strokeStyle = '#8f6240';
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
  text(ctx, 'Forgehold', 0, 1, 12, '#4a3440');
  ctx.fillStyle = '#d0485a';
  ctx.fillRect(-3, 12, 6, 10);
  ctx.restore();
}
