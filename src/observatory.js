// Docs: docs/places/observatory.md
// The Buried Observatory (room OBSERVATORY, src/shared/rpg.js; atlas Phase 9, A1): the Keepers' star-dials half swallowed
// by sand, on east from the Glass Dunes. Great bronze rings standing up out of the dunes green and gold, a sundial's gnomon
// as tall as a tower casting its shadow across the trail, steps going down into the sand, and under the sand everywhere the
// dial floor's bronze lines showing through. West to east: the Sunken Steps (a waystone, and the Dial Stone: OBS_STONE_X,
// src/ruins.js; no mobs), the Ring Walk, the Gnomon (GNOMON_X; the stair down under the dial ring, BURIED_GATE_X, choked
// by a fall of sand: a gate, src/branch-gates.js), the Dial Court (the Sunroller's den mouth at SUN_DEN_X, drawn by
// src/dens-sun.js), and the far end, the old caravan road going on east into a standing storm (STORM_GATE_X, a gate), the
// sky reddening over it. The noon mark on the gnomon's top (last in OBS_PLATFORMS) is the hidden spot. The sky is
// Caravanserai's (drawDuneSky, drawDuneAir: src/caravan.js).
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { OBS_W, FIELD_GROUND, OBS_PLATFORMS, OBS_ZONES, GNOMON_X, OBS_EXIT_X, STORM_GATE_X } from './shared/rpg.js';
import { drawDuneSky, drawDuneAir } from './caravan.js';
import { drawDuneSign } from './glassdunes.js';

const GROUND = FIELD_GROUND;
const STEPS_END = OBS_ZONES[0].x1;
const NOON = OBS_PLATFORMS.find((p) => p.kind === 'noonmark');
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const BRONZE = '#b8823a', BRONZE_D = '#6a4418', BRONZE_L = '#e8b85a';

// the great rings, half sunk: x, radius, tilt, thickness
const RINGS = (() => {
  const r = mulberry32(961);
  const out = [];
  for (let x = 700; x < OBS_W - 300; x += 420 + r() * 300) {
    if (Math.abs(x - GNOMON_X) < 260) continue;
    out.push({ x, r: 140 + r() * 120, a: (r() - 0.5) * 0.5, th: 8 + r() * 6 });
  }
  return out;
})();
const dunesFront = (() => {
  const r = mulberry32(967);
  return Array.from({ length: 14 }, () => ({ x: r() * OBS_W, w: 160 + r() * 200, h: 16 + r() * 22 }));
})();

// Everything in the Buried Observatory behind the slimes
// freed: you've freed the Sunroller (docs/social/story.md): for you the great gnomon stands at noon and casts no shadow
export function drawObservatory(ctx, camX, viewW, time, freed = false) {
  ctx.save();
  ctx.translate(camX, 0);
  drawDuneSky(ctx, camX, time, OBS_W);
  const red = Math.max(0, (camX + viewW / 2 - (OBS_W - 1600)) / 1600); // the sky reddening toward the storm, east
  if (red > 0) {
    const g = ctx.createLinearGradient(W, 0, 0, 0);
    g.addColorStop(0, `rgba(200,90,60,${0.45 * red})`);
    g.addColorStop(1, 'rgba(200,90,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  const L = camX - 160, R = camX + viewW + 160;
  for (const rg of RINGS) if (visible(rg.x - rg.r - 20, rg.x + rg.r + 20, L, R)) drawRing(ctx, rg, time);
  if (visible(GNOMON_X - 900, GNOMON_X + 960, L, R)) drawGnomon(ctx, time, freed);
  drawGround(ctx, Math.max(0, L), Math.min(OBS_W, R), time);
  if (visible(0, STEPS_END + 60, L, R)) drawSunkenSteps(ctx);
  for (const p of OBS_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'steps') drawStepBlock(ctx, p);
    else if (p.kind === 'ring') drawRingLedge(ctx, p, time);
    else if (p.kind === 'gnomon') drawGnomonLedge(ctx, p);
  }
  for (const d of dunesFront) if (visible(d.x - d.w / 2, d.x + d.w / 2, L, R)) drawDrift(ctx, d);
  if (visible(OBS_EXIT_X, OBS_EXIT_X + 220, L, R)) drawDuneSign(ctx, OBS_EXIT_X + 110, 'Glass Dunes', -1, time);
  if (visible(STORM_GATE_X - 400, OBS_W, L, R)) drawStormGlow(ctx, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawDuneAir(ctx, camX, time, { thick: Math.max(0, (camX - (OBS_W - 1400)) / 1400) * 0.6 });
  ctx.restore();
}

function drawGround(ctx, L, R, time) {
  if (R <= L) return;
  const g = ctx.createLinearGradient(0, GROUND - 6, 0, H);
  g.addColorStop(0, '#e0bc84');
  g.addColorStop(1, '#b88a56');
  ctx.fillStyle = g;
  ctx.fillRect(L, GROUND - 4, R - L, H - GROUND + 4);
  ctx.fillStyle = '#ecd09a';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 6, R - L + 8, 10, 5);
  ctx.fill();
  // the dial floor's bronze lines showing through the sand: hour lines radiating from the gnomon, an arc or two
  ctx.strokeStyle = 'rgba(184,130,58,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -12; i <= 12; i++) {
    const x = GNOMON_X + i * 210;
    if (x < L - 200 || x > R + 200) continue;
    ctx.moveTo(GNOMON_X + i * 60, GROUND + 2);
    ctx.lineTo(x, H);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(184,130,58,0.4)';
  ctx.beginPath();
  ctx.ellipse(GNOMON_X, GROUND + 4, 1400, 40, 0, 0, Math.PI);
  ctx.ellipse(GNOMON_X, GROUND + 4, 2600, 70, 0, 0, Math.PI);
  ctx.stroke();
  ctx.fillStyle = 'rgba(232,184,90,0.6)'; // numerals' studs along the arcs
  for (let i = -12; i <= 12; i++) {
    const x = GNOMON_X + i * 116;
    if (x < L || x > R) continue;
    circle(ctx, x, GROUND + 4 + Math.sqrt(Math.max(0, 1 - ((x - GNOMON_X) / 1400) ** 2)) * 40, 3);
  }
}

// a great bronze ring half swallowed by the dunes, green-gold, star marks along it, sand heaped up its sides
function drawRing(ctx, rg, time) {
  const { x, r, a, th } = rg, cy = GROUND + r * 0.4;
  ctx.save();
  ctx.strokeStyle = BRONZE_D;
  ctx.lineWidth = th + 4;
  ctx.beginPath();
  ctx.ellipse(x, cy, r, r * 0.96, a, Math.PI * 1.02, Math.PI * 1.98);
  ctx.stroke();
  ctx.strokeStyle = BRONZE;
  ctx.lineWidth = th;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(106,168,152,0.55)'; // verdigris along its back
  ctx.lineWidth = th * 0.5;
  ctx.beginPath();
  ctx.ellipse(x, cy, r - th * 0.2, r * 0.96 - th * 0.2, a, Math.PI * 1.15, Math.PI * 1.4);
  ctx.stroke();
  ctx.fillStyle = BRONZE_L; // star marks
  for (let i = 1; i < 8; i++) {
    const t = Math.PI * (1.02 + i * 0.12);
    const px = x + Math.cos(t) * r * Math.cos(a) - Math.sin(t) * r * 0.96 * Math.sin(a);
    const py = cy + Math.cos(t) * r * Math.sin(a) + Math.sin(t) * r * 0.96 * Math.cos(a);
    if (py < GROUND) circle(ctx, px, py, 2.2);
  }
  ctx.fillStyle = '#e0bc84'; // sand heaped where it goes in
  for (const s of [-1, 1]) ellipse(ctx, x + s * r * 0.95, GROUND - 6, 60, 20);
  ctx.restore();
}

// The gnomon: a sundial's pointer as tall as a tower, a great wedge of bronze-clad stone rising out of the sand, the hours
// cut down its edge, its long shadow lying east across the dial floor
function drawGnomon(ctx, time, noon = false) {
  const x = GNOMON_X, top = NOON.y - 6, base = GROUND;
  if (noon) { // (freed) noon: a pool of shade right at its foot, no shadow anywhere else
    ctx.fillStyle = 'rgba(60,40,70,0.2)';
    ellipse(ctx, x - 30, base + 8, 130, 10);
  } else {
    ctx.fillStyle = 'rgba(60,40,70,0.22)'; // its shadow, lying east
    ctx.beginPath();
    ctx.moveTo(x - 20, base);
    ctx.lineTo(x + 80, base);
    ctx.lineTo(x + 900, base + 30);
    ctx.lineTo(x + 760, base + 30);
    ctx.closePath();
    ctx.fill();
  }
  const g = ctx.createLinearGradient(x - 120, 0, x + 80, 0);
  g.addColorStop(0, '#8a6430');
  g.addColorStop(0.6, '#c89448');
  g.addColorStop(1, '#a8743a');
  ctx.fillStyle = g;
  ctx.strokeStyle = BRONZE_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 140, base);
  ctx.lineTo(x - 30, top);
  ctx.lineTo(x + 40, top);
  ctx.lineTo(x + 70, base);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(106,68,24,0.6)'; // the hours cut down its sloping edge
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 1; i < 12; i++) {
    const k = i / 12, ex = x - 140 + (110) * (1 - k), ey = base - (base - top) * (1 - k);
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex + 14, ey);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(106,168,152,0.45)';
  ellipse(ctx, x - 50, base - 120, 18, 30, 0.3);
  ellipse(ctx, x + 10, base - 200, 10, 20, 0.2);
  ctx.fillStyle = BRONZE_L; // the noon mark's plate on top (the hidden spot)
  ctx.beginPath();
  ctx.roundRect(NOON.x, NOON.y - 4, NOON.w, 8, 3);
  ctx.fill();
  ctx.fillStyle = `rgba(255,240,190,${0.35 + 0.25 * Math.sin(time * 2)})`;
  circle(ctx, NOON.x + NOON.w / 2, NOON.y - 8, 4);
  ctx.fillStyle = '#e0bc84'; // sand drifted against its foot
  ellipse(ctx, x - 40, base - 4, 140, 18);
}

// the Sunken Steps: broad stone steps going down into the sand at the room's west end, the trail coming in over them
function drawSunkenSteps(ctx) {
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#b89a72' : '#c8aa82';
    ctx.fillRect(0, GROUND - 120 + i * 20, 240 - i * 30, 20);
    ctx.fillStyle = 'rgba(232,200,138,0.8)';
    ctx.fillRect(0, GROUND - 120 + i * 20, 240 - i * 30, 4);
  }
}

function drawStepBlock(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#b89a72';
  ctx.strokeStyle = '#7a6448';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(x, y, w, GROUND - y);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d8ba92';
  ctx.fillRect(x, y - 4, w, 8);
  ctx.strokeStyle = 'rgba(122,100,72,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let yy = y + 26; yy < GROUND; yy += 26) {
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
  }
  ctx.stroke();
  ctx.fillStyle = '#e0bc84';
  ellipse(ctx, x + w * 0.7, GROUND - 4, w * 0.5, 14);
}

// the top of a fallen ring's arc, lying across two blocks, flat enough to stand on
function drawRingLedge(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = '#9a8a6a';
  ctx.fillRect(x + 10, y + 6, 14, GROUND - y - 6);
  ctx.fillRect(x + w - 24, y + 6, 14, GROUND - y - 6);
  ctx.fillStyle = BRONZE;
  ctx.strokeStyle = BRONZE_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 10);
  ctx.quadraticCurveTo(x + w / 2, y - 12, x + w + 10, y + 10);
  ctx.lineTo(x + w + 10, y + 2);
  ctx.quadraticCurveTo(x + w / 2, y - 20, x - 10, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRONZE_L;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 6, 3);
  ctx.fill();
  ctx.fillStyle = '#26305a';
  for (let k = 1; k < 5; k++) circle(ctx, x + (k * w) / 5, y + 6, 1.8);
}

// a ledge on the gnomon's side: a bronze bracket bolted to it
function drawGnomonLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = BRONZE_D;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 4);
  ctx.lineTo(x + w * 0.3, y + 40);
  ctx.lineTo(x + w * 0.4, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = BRONZE;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 10, 3);
  ctx.fill();
  ctx.fillStyle = BRONZE_L;
  ctx.fillRect(x + 4, y - 4, w - 8, 3);
}

// a low drift of sand in front of the trail
function drawDrift(ctx, d) {
  ctx.fillStyle = 'rgba(236,206,150,0.9)';
  ctx.beginPath();
  ctx.moveTo(d.x - d.w / 2, H);
  ctx.quadraticCurveTo(d.x - d.w * 0.1, GROUND + 50 - d.h, d.x + d.w / 2, H);
  ctx.closePath();
  ctx.fill();
}

// the red light of the standing storm over the far end of the room (the gate's own art is src/branch-gates.js)
function drawStormGlow(ctx, time) {
  const x = STORM_GATE_X;
  const g = ctx.createRadialGradient(x + 200, GROUND - 160, 20, x + 200, GROUND - 160, 520);
  g.addColorStop(0, `rgba(200,80,50,${0.4 + 0.08 * Math.sin(time * 1.3)})`);
  g.addColorStop(1, 'rgba(200,80,50,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 400, 0, 1000, H);
}
