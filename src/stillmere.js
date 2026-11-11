// Docs: docs/places/stillmere.md
// The Still Mere (room STILLMERE, src/shared/rpg.js; atlas Phase 8, L2): the Fen's side branch, reached by Ferryman
// Hob's punt from Wickmere. Open black water and islets of peat joined by stepping stones, low mist, and the drifting
// lanterns thickest here: the fen folk set one adrift for each of their dead, and the mere carries them round and round.
// West to east: the Punt Landing (Hob's punt tied to a post, a waystone; no mobs), the Stepping Stones, the Lantern Drift
// (the lights so thick on the water you could almost walk on them), and the Gullet, the deep reach over the old eel pit
// (Old Gullet's den door at GULLET_DEN_X, drawn by dens.js; the water darker, turning slowly, a glow far down). The far
// end is open water, the lights going off into the mist. You walk the old punters' bar: flat stones just under the
// surface. The hidden spot (last in STILLMERE_PLATFORMS): an old eel-trap stake standing up out of the mist, a lantern
// tied to it, its tag washed blank. The sky and the mere are Wickmere's (drawFenSky, drawFenAir: src/wickmere.js).
import { H, TAU, mulberry32, circle, ellipse } from './util.js';
import { STILLMERE_W, FIELD_GROUND, STILLMERE_PLATFORMS, STILLMERE_ZONES, GULLET_DEN_X } from './shared/rpg.js';
import { drawFenSky, drawFenAir } from './wickmere.js';
import { drawWater, drawReeds, drawTussock } from './shallows.js';
import { drawLantern } from './stillmere-art.js';

const GROUND = FIELD_GROUND;
const LANDING = STILLMERE_ZONES[0].x1, DRIFT = STILLMERE_ZONES[2], GULLET = STILLMERE_ZONES[3];
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const STAKE = STILLMERE_PLATFORMS.find((p) => p.kind === 'stake');

// seeded scenery along the room
const clumps = (() => {
  const r = mulberry32(7701);
  return Array.from({ length: 40 }, () => ({ x: LANDING + r() * (GULLET.x0 - LANDING), h: 40 + r() * 60, n: 3 + Math.floor(r() * 5), back: r() < 0.6 }));
})();
// the lanterns adrift: thicker over the Drift; `far` ones ride the open water up by the horizon, small; the near ones
// bob along the walking line (in front of the slimes' feet)
const lights = (() => {
  const r = mulberry32(7711);
  const out = [];
  for (let i = 0; i < 90; i++) {
    const inDrift = i < 50;
    const x = inDrift ? DRIFT.x0 - 200 + r() * (DRIFT.x1 - DRIFT.x0 + 400) : r() * STILLMERE_W;
    out.push({ x, far: r() < 0.55, y: r(), v: 4 + r() * 8, p: r() * TAU, s: 0.7 + r() * 0.5 });
  }
  return out;
})();
const snags = (() => { // dead willow stumps standing up out of the open water
  const r = mulberry32(7721);
  return Array.from({ length: 12 }, () => ({ x: LANDING + r() * (STILLMERE_W - LANDING), h: 30 + r() * 70, lean: (r() - 0.5) * 0.4 }));
})();

// Everything in the Still Mere behind the slimes
export function drawStillMere(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawFenSky(ctx, camX, time, STILLMERE_W);
  ctx.restore();
  const L = camX - 120, R = camX + viewW + 120;
  // far lights out on the open mere, small and slow (parallax: they sit further off)
  for (const f of lights) {
    if (!f.far) continue;
    const x = f.x + camX * 0.35 + Math.sin(time * 0.1 + f.p) * 20 + time * f.v * 0.3;
    const wx = ((x % (STILLMERE_W + 400)) + STILLMERE_W + 400) % (STILLMERE_W + 400) - 200;
    if (!visible(wx - 10, wx + 10, L, R)) continue;
    const y = 310 + f.y * 110;
    drawLantern(ctx, wx, y + Math.sin(time * 1.2 + f.p) * 1.2, 0.35 + f.y * 0.4, 0.8, time);
  }
  for (const s of snags) if (visible(s.x - 30, s.x + 30, L, R)) drawSnag(ctx, s);
  for (const c of clumps) if (c.back && visible(c.x - 30, c.x + 30, L, R)) drawReeds(ctx, c, time, true);
  drawWater(ctx, Math.max(0, L), Math.min(STILLMERE_W, R), time);
  drawBar(ctx, Math.max(0, L), Math.min(STILLMERE_W, R));
  if (visible(GULLET.x0, STILLMERE_W, L, R)) drawDeep(ctx, Math.max(GULLET.x0, L), Math.min(STILLMERE_W, R), time);
  if (visible(0, LANDING + 60, L, R)) drawLanding(ctx, time);
  for (const p of STILLMERE_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'islet') drawTussock(ctx, p, time);
    else if (p.kind === 'stones') drawStones(ctx, p);
    else if (p.kind === 'staging') drawStaging(ctx, p, time);
  }
  if (visible(STAKE.x - 80, STAKE.x + STAKE.w + 80, L, R)) drawStake(ctx, time);
  for (const c of clumps) if (!c.back && visible(c.x - 30, c.x + 30, L, R)) drawReeds(ctx, c, time, false);
  // near lights, bobbing along the walking line and drifting east
  for (const f of lights) {
    if (f.far) continue;
    const wx = ((((f.x + time * f.v) % (STILLMERE_W + 200)) + STILLMERE_W + 200) % (STILLMERE_W + 200)) - 100;
    if (wx < LANDING - 40 || !visible(wx - 20, wx + 20, L, R)) continue;
    drawDriftLight(ctx, wx, GROUND + 4 + f.y * 30, f, time);
  }
  ctx.save();
  ctx.translate(camX, 0);
  drawFenAir(ctx, camX, time);
  ctx.restore();
}

// Low mist over the water, drawn in front of the slimes (under the name tags): the mere closes round you
export function drawStillMereFront(ctx, camX, viewW, time) {
  const L = camX - 200, R = camX + viewW + 200;
  for (let x = Math.floor(L / 260) * 260; x < R; x += 260) {
    const y = GROUND + 10 + Math.sin(x * 0.01 + time * 0.3) * 6;
    ctx.fillStyle = `rgba(214,212,226,${0.07 + 0.03 * Math.sin(time * 0.4 + x)})`;
    ellipse(ctx, x + Math.sin(time * 0.2 + x) * 60, y, 190, 16);
  }
}

// The punters' bar: flat stones laid just under the surface, the way you walk (paler where the water's thin over them)
function drawBar(ctx, L, R) {
  ctx.fillStyle = 'rgba(122,114,140,0.35)';
  for (let x = Math.floor(L / 46) * 46; x < R; x += 46) {
    ctx.beginPath();
    ctx.ellipse(x + 23, GROUND + 3, 19 + ((x / 46) % 3) * 2, 3.5, 0, 0, TAU);
    ctx.fill();
  }
}

// The Gullet: over the old eel pit the water's darker and turns very slowly, and something glows far down
function drawDeep(ctx, L, R, time) {
  ctx.fillStyle = 'rgba(10,8,18,0.35)';
  ctx.fillRect(L, GROUND + 6, R - L, H - GROUND);
  const cx = GULLET_DEN_X;
  if (!visible(cx - 260, cx + 260, L, R)) return;
  const g = ctx.createRadialGradient(cx, H - 20, 4, cx, H - 20, 200);
  g.addColorStop(0, `rgba(255,214,150,${0.16 + 0.05 * Math.sin(time * 0.8)})`);
  g.addColorStop(1, 'rgba(255,214,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - 200, GROUND + 8, 400, H - GROUND - 8);
  ctx.strokeStyle = 'rgba(214,204,232,0.16)'; // the slow turn of the water
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const a = time * 0.25 + i * 2.1;
    ctx.beginPath();
    ctx.ellipse(cx, GROUND + 22, 70 + i * 50, 6 + i * 3, 0, a, a + 2.2);
    ctx.stroke();
  }
}

// A lantern adrift: a little reed float, the lantern on it, a tag on a string; it rocks
function drawDriftLight(ctx, x, y, f, time) {
  const rock = Math.sin(time * 1.4 + f.p) * 0.08;
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 1.1 + f.p) * 1.5);
  ctx.rotate(rock);
  ctx.fillStyle = '#6a5a42'; // the float
  ctx.beginPath();
  ctx.roundRect(-9 * f.s, -2, 18 * f.s, 4, 2);
  ctx.fill();
  drawLantern(ctx, 0, -8 * f.s, f.s, 1, time);
  ctx.strokeStyle = 'rgba(232,220,192,0.6)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(4 * f.s, -10 * f.s);
  ctx.lineTo(7 * f.s, -4 * f.s);
  ctx.stroke();
  ctx.fillStyle = '#e8dcc0'; // its tag
  ctx.fillRect(6 * f.s, -4 * f.s, 3 * f.s, 4 * f.s);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,214,150,0.12)'; // its light on the water
  ellipse(ctx, x, y + 4, 16 * f.s, 2.5);
}

// The Punt Landing: a low peat islet with a mooring post, Hob's punt tied up alongside (the way back), a lantern on the post
function drawLanding(ctx, time) {
  ctx.fillStyle = '#4a3c30'; // the islet, low and wide
  ctx.beginPath();
  ctx.moveTo(-20, GROUND + 6);
  ctx.quadraticCurveTo(LANDING * 0.4, GROUND - 12, LANDING + 30, GROUND + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5e4e3e';
  ctx.beginPath();
  ctx.roundRect(0, GROUND - 6, LANDING, 8, 4);
  ctx.fill();
  // the punt, moored, rocking a little; its bow lantern lit
  const rock = Math.sin(time * 0.9) * 1.5;
  ctx.save();
  ctx.translate(150, GROUND + 4 + rock);
  ctx.fillStyle = '#2e2a3a';
  ctx.beginPath();
  ctx.moveTo(-100, -26);
  ctx.lineTo(100, -26);
  ctx.lineTo(92, 2);
  ctx.lineTo(-92, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a4058';
  ctx.fillRect(-98, -28, 196, 5);
  ctx.strokeStyle = '#3a3446';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(96, -26);
  ctx.lineTo(104, -66);
  ctx.quadraticCurveTo(112, -72, 116, -62);
  ctx.stroke();
  ctx.restore();
  drawLantern(ctx, 266, GROUND - 48 + rock, 1.2, 1, time);
  ctx.strokeStyle = 'rgba(168,154,120,0.8)'; // the painter, to the post
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-60 + 150, GROUND - 20 + rock);
  ctx.quadraticCurveTo(-20 + 150, GROUND - 4, 20, GROUND - 40);
  ctx.stroke();
  ctx.fillStyle = '#4a4058'; // the mooring post
  ctx.fillRect(14, GROUND - 70, 10, 70);
  ctx.fillStyle = '#5e5470';
  ctx.fillRect(12, GROUND - 74, 14, 6);
}

// A run of stepping stones: flat grey stones with water between, the top one the platform
function drawStones(ctx, p) {
  const x = p.x, w = p.w, y = p.y;
  ctx.fillStyle = '#4e4a5a';
  for (let i = 0; i < 3; i++) { // stones stepping down to the water beside it
    const sx = x - 30 + i * (w + 60) / 2.2, sy = y + 40 + (i % 2) * 20;
    if (sy > GROUND - 10) continue;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 16, 5, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#3a3646'; // the pillar of stones under the top one
  ctx.beginPath();
  ctx.moveTo(x + 14, GROUND);
  ctx.lineTo(x + 20, y + 8);
  ctx.lineTo(x + w - 20, y + 8);
  ctx.lineTo(x + w - 14, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6a667a';
  ctx.strokeStyle = '#2e2a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 12, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,138,78,0.5)'; // moss
  for (let k = 0; k < 4; k++) ellipse(ctx, x + 16 + (k * (w - 32)) / 3, y - 3, 6, 2);
}

// Old eel-trap staging: planks on stakes, wicker eel traps hung off it to dry
function drawStaging(ctx, p, time) {
  const x = p.x, w = p.w, y = p.y;
  ctx.fillStyle = '#3e3650';
  for (const px of [x + 10, x + w / 2, x + w - 14]) ctx.fillRect(px - 4, y + 6, 8, GROUND - y - 6);
  ctx.fillStyle = '#5a5070';
  ctx.fillRect(x, y, w, 8);
  ctx.fillStyle = '#7a6e8a';
  ctx.fillRect(x, y - 3, w, 4);
  for (let i = 0; i < 3; i++) { // the traps: long wicker cones
    const tx = x + 24 + i * (w - 48) / 2, sw = Math.sin(time * 0.8 + i + x) * 0.06;
    ctx.save();
    ctx.translate(tx, y + 8);
    ctx.rotate(sw);
    ctx.strokeStyle = '#a89a78';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.fillStyle = '#8a7a58';
    ctx.beginPath();
    ctx.moveTo(-7, 6);
    ctx.lineTo(7, 6);
    ctx.lineTo(1, 34);
    ctx.lineTo(-1, 34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(58,44,30,0.6)';
    ctx.beginPath();
    for (let k = 1; k < 4; k++) {
      ctx.moveTo(-7 + k * 1.6, 6 + k * 7);
      ctx.lineTo(7 - k * 1.6, 6 + k * 7);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// A dead willow stump standing up out of the open water
function drawSnag(ctx, s) {
  ctx.save();
  ctx.translate(s.x, GROUND - 2);
  ctx.rotate(s.lean);
  ctx.fillStyle = '#2e2a30';
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-5, -s.h);
  ctx.lineTo(1, -s.h - 8);
  ctx.lineTo(5, -s.h + 4);
  ctx.lineTo(8, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The hidden spot: an old eel-trap stake standing high out of the mist, the top flat (the platform), a lantern tied on
// whose tag the weather has washed blank. Nobody knows whose. Somebody keeps it lit
function drawStake(ctx, time) {
  const p = STAKE, cx = p.x + p.w / 2;
  ctx.fillStyle = '#3a3446';
  ctx.fillRect(cx - 7, p.y + 6, 14, GROUND - p.y - 6);
  ctx.fillStyle = '#5a5070';
  ctx.beginPath();
  ctx.roundRect(p.x, p.y - 2, p.w, 9, 4);
  ctx.fill();
  ctx.strokeStyle = '#a89a78'; // a lashing
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 7, p.y + 20 + i * 4);
    ctx.lineTo(cx + 7, p.y + 22 + i * 4);
    ctx.stroke();
  }
  drawLantern(ctx, cx + 18, p.y + 26, 1.2, 1, time);
  ctx.strokeStyle = 'rgba(168,154,120,0.8)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx + 7, p.y + 12);
  ctx.lineTo(cx + 18, p.y + 12);
  ctx.stroke();
  ctx.save(); // the blank tag, turning
  ctx.translate(cx + 26, p.y + 32);
  ctx.rotate(Math.sin(time * 1.2) * 0.4);
  ctx.fillStyle = '#f0e8d4';
  ctx.fillRect(-2.5, 0, 6, 9);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,214,150,0.15)';
  circle(ctx, cx + 18, p.y + 26, 30);
}
