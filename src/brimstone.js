// Docs: docs/places/brimstone.md
// The Brimstone Fields (room BRIMSTONE, data in src/shared/rpg.js): Emberdeep's cone above Magma Heart, up its flank
// (the vent field at BRIMSTONE_GATE_X in the Caldera room, its fumes blown off the path since E3a). Yellow crusts,
// fumaroles, acid pools, sulphur chimneys; harsh and bright up here, still soft and rounded. You come in at the EAST
// end and climb west: the Picker's Camp (no mobs: Picker Ochre's lean-to and her stack of full baskets, the Breathing
// Stone, drawn by src/ruins.js, and the waystone, src/waystones.js), the Yellow Crust, the Acid Pools and the High
// Vents, where the Organ stands (a cluster of chimneys that whistle a chord in the wind, a ledge on top: last in
// BRIM_PLATFORMS) and, at the very west end, the Bearers' stair up toward the rim (a gate: src/branch-gates.js).
// Behind: a hazy yellow-grey sky, the cone's upper slope rising west to the crater's lip, the island's smoke column
// pouring off it, and far below to the south the sea. Paints its own sky.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { BRIM_W, BRIM_EXIT_X, BRIM_ZONES, BRIM_PLATFORMS, OCHRE_X, FIELD_GROUND } from './shared/rpg.js';

const GROUND = FIELD_GROUND;
const HORIZON = 300;
const ORGAN = BRIM_PLATFORMS.at(-1);
const HUT = BRIM_PLATFORMS.find((p) => p.kind === 'hut');
const CRUST = '#4a3e3a', CRUST_D = '#2a2224', CRUST_L = '#6a5a50';
const SUL = '#e8c84a', SUL_L = '#fff07a', SUL_D = '#a8862a';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
// yellow fume drifting across the whole view, thicker toward the top (west)
const drift = (() => {
  const r = mulberry32(5911);
  return Array.from({ length: 24 }, () => ({ x: r() * W, y: 100 + r() * 320, r: 30 + r() * 50, v: 5 + r() * 9, p: r() * TAU }));
})();
// fumaroles in the ground (world x), puffing; bigger toward the High Vents
const VENTS = (() => {
  const r = mulberry32(5913);
  const out = [];
  for (let x = 120; x < 4100; x += 180 + r() * 220) out.push({ x, s: 0.6 + (1 - x / 4100) * 0.7 + r() * 0.2, p: r() * TAU });
  return out;
})();
// acid pools in the ground at the Acid Pools (drawing only)
const POOLS = [{ x: 1700, w: 90 }, { x: 2140, w: 70 }, { x: 2480, w: 110 }, { x: 2820, w: 60 }];
// sulphur crust patches along the ground (behind the slimes)
const PATCHES = (() => {
  const r = mulberry32(5917);
  const out = [];
  for (let x = 40; x < 4200; x += 70 + r() * 150) out.push({ x, w: 26 + r() * 50, h: 3 + r() * 5 });
  return out;
})();
// background chimneys on the slope (parallax-free, behind everything), world x
const BACK_CHIMNEYS = (() => {
  const r = mulberry32(5919);
  const out = [];
  for (let x = 300; x < 4000; x += 260 + r() * 300) out.push({ x, h: 60 + r() * 90, w: 14 + r() * 12 });
  return out;
})();

// Everything in the Brimstone Fields behind the slimes
export function drawBrimstone(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0); // sky in screen space
  drawSky(ctx, camX, time);
  ctx.restore();

  const L = camX - 160, R = camX + viewW + 160;
  drawSlope(ctx, Math.max(0, L), Math.min(BRIM_W, R));
  for (const c of BACK_CHIMNEYS) if (visible(c.x - 30, c.x + 30, L, R)) drawBackChimney(ctx, c, time);
  if (visible(ORGAN.x - 160, ORGAN.x + ORGAN.w + 160, L, R)) drawOrgan(ctx, ORGAN, time);
  drawGround(ctx, Math.max(0, L), Math.min(BRIM_W, R));
  for (const p of PATCHES) if (visible(p.x - 10, p.x + p.w + 10, L, R)) drawPatch(ctx, p);
  for (const p of POOLS) if (visible(p.x - 30, p.x + p.w + 30, L, R)) drawPool(ctx, p, time);
  for (const v of VENTS) if (visible(v.x - 60, v.x + 60, L, R)) drawVent(ctx, v, time);
  for (const p of BRIM_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'crust') drawCrust(ctx, p);
    else if (p.kind === 'chimney') drawChimney(ctx, p, time);
  }
  if (visible(OCHRE_X - 260, HUT.x + HUT.w + 60, L, R)) drawLeanTo(ctx, HUT, time);
  BRIM_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x1 - 30; // you climb in from the east: each zone's sign stands at its east edge
    if (visible(sx - 90, sx + 90, L, R)) drawZoneSign(ctx, sx, z, i);
  });
  if (visible(BRIM_EXIT_X - 260, BRIM_W, L, R)) drawExitSign(ctx, BRIM_EXIT_X - 110, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawAir(ctx, camX, time);
  ctx.restore();
}

// ——— the sky ———
let skyGrad = null, gradCtx = null;
function drawSky(ctx, camX, time) {
  if (gradCtx !== ctx) {
    gradCtx = ctx;
    skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON);
    skyGrad.addColorStop(0, '#8a8274');
    skyGrad.addColorStop(0.5, '#c4b890');
    skyGrad.addColorStop(1, '#e8dcb0');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  // the sea far below to the south, a pale band
  ctx.fillStyle = '#b8c4b0';
  ctx.fillRect(0, HORIZON - 30, W, 30);
  ctx.fillStyle = 'rgba(250,246,230,0.5)';
  ctx.fillRect(0, HORIZON - 30, W, 1.2);
  // the cone's upper slope rising west to the crater's lip (parallax), and the smoke column pouring off it
  const lip = -camX * 0.05 + 120;
  ctx.fillStyle = '#7a6a5e';
  ctx.beginPath();
  ctx.moveTo(lip - 400, HORIZON);
  ctx.lineTo(lip - 300, 60);
  ctx.lineTo(lip + 40, 50);
  ctx.quadraticCurveTo(lip + 400, 120, lip + 900, HORIZON - 20);
  ctx.lineTo(lip + 1200, HORIZON);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(216,192,96,0.4)'; // yellow streaks down it
  for (const [dx, y] of [[60, 120], [220, 170], [420, 220], [-120, 140]]) ellipse(ctx, lip + dx, y, 40, 6, 0.4);
  for (let i = 0; i < 12; i++) {
    const k = (i / 12 + time * 0.01) % 1;
    ctx.fillStyle = `rgba(96,86,84,${0.4 * (1 - k * 0.6)})`;
    circle(ctx, lip - 130 + k * k * 300 + Math.sin(i * 1.7 + time * 0.2) * 14, 50 - k * 140, 40 + k * 70);
  }
  // a low bank of haze
  for (let i = 0; i < 5; i++) {
    const x = ((((i * 430 - camX * 0.08 + time * 5) % 2150) + 2150) % 2150) - 300;
    ctx.fillStyle = 'rgba(236,226,190,0.3)';
    ellipse(ctx, x, HORIZON - 10 + (i % 2) * 8, 200, 16);
  }
}

// The flank behind the path: a dark slope rising west, crusted yellow in bands
function drawSlope(ctx, L, R) {
  if (R <= L) return;
  ctx.fillStyle = '#5a4a44';
  ctx.beginPath();
  ctx.moveTo(L, GROUND);
  for (let x = Math.floor(L / 40) * 40; x <= R + 40; x += 40) {
    const rise = Math.max(0, 1 - x / 4600); // higher toward the west (the top)
    ctx.lineTo(x, GROUND - 60 - rise * 140 + Math.sin(x * 0.011) * 10);
  }
  ctx.lineTo(R + 40, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(216,192,96,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = Math.floor(L / 120) * 120; x < R; x += 120) {
    const rise = Math.max(0, 1 - x / 4600);
    ctx.moveTo(x, GROUND - 40 - rise * 100);
    ctx.quadraticCurveTo(x + 40, GROUND - 46 - rise * 110, x + 80, GROUND - 38 - rise * 100);
  }
  ctx.stroke();
}

function drawBackChimney(ctx, c, time) {
  ctx.fillStyle = '#6a5a4c';
  ctx.beginPath();
  ctx.moveTo(c.x - c.w, GROUND - 40);
  ctx.lineTo(c.x - c.w * 0.4, GROUND - 40 - c.h);
  ctx.lineTo(c.x + c.w * 0.4, GROUND - 40 - c.h);
  ctx.lineTo(c.x + c.w, GROUND - 40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(216,192,96,0.5)';
  ellipse(ctx, c.x, GROUND - 40 - c.h + 4, c.w * 0.5, 3);
  const k = (time * 0.15 + c.x * 0.001) % 1;
  ctx.fillStyle = `rgba(226,214,140,${0.3 * Math.sin(k * Math.PI)})`;
  circle(ctx, c.x + k * 30, GROUND - 46 - c.h - k * 60, 8 + k * 16);
}

// ——— the ground ———
// Dark crust, its top lip crusted yellow, yellower toward the High Vents; at the camp, packed and trodden
function drawGround(ctx, L, R) {
  if (R <= L) return;
  ctx.fillStyle = CRUST;
  ctx.fillRect(L, GROUND - 4, R - L, H - GROUND + 4);
  ctx.fillStyle = CRUST_L;
  ctx.beginPath();
  ctx.moveTo(L, GROUND + 2);
  for (let x = Math.floor(L / 30) * 30; x <= R + 30; x += 30) ctx.lineTo(x, GROUND - 3 + Math.sin(x * 0.07) * 1.8);
  ctx.lineTo(R + 30, GROUND + 6);
  ctx.lineTo(L, GROUND + 6);
  ctx.closePath();
  ctx.fill();
  // a yellow lip, heavier toward the top
  const x1 = Math.min(R, 4200);
  if (x1 > L) {
    ctx.fillStyle = 'rgba(232,200,74,0.55)';
    for (let x = Math.floor(L / 24) * 24; x < x1; x += 24) {
      const k = Math.max(0, 1 - x / 4200);
      ellipse(ctx, x + 12, GROUND - 1, 6 + k * 8, 2 + k * 1.5);
    }
  }
  // cracks with crust in them
  ctx.strokeStyle = 'rgba(30,24,26,0.6)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let x = Math.floor(L / 90) * 90; x < R; x += 90) {
    const k = Math.sin(x * 1.37) * 0.5 + 0.5;
    ctx.moveTo(x, GROUND + 14 + k * 30);
    ctx.lineTo(x + 18, GROUND + 20 + k * 30);
    ctx.lineTo(x + 30, GROUND + 16 + k * 30);
  }
  ctx.stroke();
  // the camp: packed, trodden earth
  if (R > 4200) {
    const x0 = Math.max(L, 4200);
    ctx.fillStyle = '#54463e';
    ctx.fillRect(x0, GROUND - 2, R - x0, H - GROUND + 2);
    ctx.fillStyle = '#6a5a4e';
    ctx.fillRect(x0, GROUND - 3, R - x0, 4);
  }
}
function drawPatch(ctx, p) {
  ctx.fillStyle = SUL;
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, GROUND + 1, p.w / 2, p.h, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = SUL_L;
  ellipse(ctx, p.x + p.w * 0.4, GROUND - p.h * 0.5, p.w * 0.14, p.h * 0.3);
}
// A pool of acid in the ground: pale green, bubbling, a ring of yellow crust and a smoke over it
function drawPool(ctx, p, time) {
  const cx = p.x + p.w / 2;
  ctx.fillStyle = SUL_D;
  ellipse(ctx, cx, GROUND + 4, p.w / 2 + 8, 6);
  ctx.fillStyle = '#9ab848';
  ellipse(ctx, cx, GROUND + 4, p.w / 2, 4.4);
  ctx.fillStyle = 'rgba(232,248,170,0.7)';
  ellipse(ctx, cx - p.w * 0.12, GROUND + 3, p.w * 0.2, 1.6);
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.7 + i / 3 + p.x * 0.01) % 1;
    ctx.fillStyle = `rgba(240,255,190,${0.8 * (1 - k)})`;
    circle(ctx, cx + (i - 1) * p.w * 0.22, GROUND + 3, 1.4 + k * 2);
    ctx.fillStyle = `rgba(220,236,170,${0.3 * Math.sin(k * Math.PI)})`;
    circle(ctx, cx + (i - 1) * p.w * 0.2 + k * 8, GROUND - 6 - k * 40, 5 + k * 9);
  }
}
// A fumarole: a low cone of yellow crust round a dark hole, puffing fume
function drawVent(ctx, v, time) {
  const s = v.s;
  ctx.fillStyle = SUL_D;
  ctx.beginPath();
  ctx.ellipse(v.x, GROUND + 1, 22 * s, 9 * s, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = SUL;
  ctx.beginPath();
  ctx.ellipse(v.x, GROUND, 16 * s, 7 * s, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = CRUST_D;
  ellipse(ctx, v.x, GROUND - 6 * s, 5 * s, 2 * s);
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.22 + i / 4 + v.p) % 1;
    ctx.fillStyle = `rgba(234,224,150,${0.42 * Math.sin(k * Math.PI)})`;
    circle(ctx, v.x + Math.sin(k * 4 + i + v.p) * 10 * s + k * 20, GROUND - 8 * s - k * 120 * s, (6 + k * 26) * s);
  }
}

// A crusted rock ledge (a platform): a black outcrop with a yellow cap
function drawCrust(ctx, p) {
  const top = p.y, bottom = GROUND + 2;
  ctx.fillStyle = CRUST;
  ctx.beginPath();
  ctx.moveTo(p.x - 12, bottom);
  ctx.quadraticCurveTo(p.x - 8, top + 12, p.x + 10, top);
  ctx.lineTo(p.x + p.w - 10, top);
  ctx.quadraticCurveTo(p.x + p.w + 8, top + 12, p.x + p.w + 12, bottom);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = CRUST_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    const x = p.x + (p.w * i) / 4;
    ctx.moveTo(x, top + 12);
    ctx.lineTo(x + (i - 2) * 6, bottom - 6);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(216,192,96,0.4)'; // yellow down the face
  ellipse(ctx, p.x + p.w * 0.3, top + 30, 10, 18);
  ctx.fillStyle = SUL;
  ctx.beginPath();
  ctx.roundRect(p.x, top - 4, p.w, 9, 5);
  ctx.fill();
  ctx.fillStyle = SUL_L;
  for (const k of [0.2, 0.55, 0.85]) ellipse(ctx, p.x + p.w * k, top - 1, 6, 1.6);
}

// A sulphur chimney (a platform): a tall crusted column grown up off a vent, flat-topped, a thread of fume off its rim
function chimneyColumn(ctx, x, w, top) {
  ctx.fillStyle = '#5e4e44';
  ctx.beginPath();
  ctx.moveTo(x - 16, GROUND + 4);
  ctx.quadraticCurveTo(x - 6, (top + GROUND) / 2, x, top + 4);
  ctx.lineTo(x + w, top + 4);
  ctx.quadraticCurveTo(x + w + 6, (top + GROUND) / 2, x + w + 16, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  // yellow bands and drips
  ctx.fillStyle = 'rgba(232,200,74,0.6)';
  for (let y = top + 26; y < GROUND - 10; y += 38) {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y, w / 2 + 4, 4, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(232,200,74,0.8)';
  for (const k of [0.2, 0.5, 0.8]) ellipse(ctx, x + w * k, top + 18, 3, 10);
  ctx.fillStyle = SUL;
  ctx.beginPath();
  ctx.roundRect(x - 4, top - 2, w + 8, 9, 4);
  ctx.fill();
}
function drawChimney(ctx, p, time) {
  chimneyColumn(ctx, p.x, p.w, p.y);
  const k = (time * 0.2 + p.x * 0.001) % 1;
  ctx.fillStyle = `rgba(234,224,150,${0.3 * Math.sin(k * Math.PI)})`;
  circle(ctx, p.x + p.w + 6 + k * 20, p.y - 6 - k * 40, 6 + k * 10);
}

// The Organ: a cluster of sulphur chimneys of different heights standing round the tallest, open-topped like pipes,
// that whistle a chord when the wind's right (rings of sound lifting off their mouths); the tallest has a flat ledge
// on top (the platform), with a worn sitting place and a few kite feathers wedged in a crack
function drawOrgan(ctx, p, time) {
  // the pipes round it, behind
  const pipes = [[-120, 140, 20], [-80, 190, 24], [-36, 230, 22], [p.w + 20, 210, 22], [p.w + 56, 160, 20], [p.w + 90, 120, 18]];
  for (const [dx, hgt, pw] of pipes) {
    const x = p.x + dx, top = GROUND - hgt;
    ctx.fillStyle = '#5a4a40';
    ctx.beginPath();
    ctx.moveTo(x - pw * 0.7, GROUND + 4);
    ctx.lineTo(x - pw * 0.45, top);
    ctx.lineTo(x + pw * 0.45, top);
    ctx.lineTo(x + pw * 0.7, GROUND + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(232,200,74,0.6)';
    for (let y = top + 20; y < GROUND; y += 34) ellipse(ctx, x, y, pw * 0.55, 3);
    ctx.fillStyle = SUL;
    ellipse(ctx, x, top, pw * 0.48, 4);
    ctx.fillStyle = CRUST_D; // its open mouth
    ellipse(ctx, x, top, pw * 0.3, 2.2);
  }
  // the tallest, with its ledge on top
  chimneyColumn(ctx, p.x, p.w, p.y);
  // the chord: rings of sound lifting off the pipes' mouths, now and then, when the wind gusts
  const gust = Math.max(0, Math.sin(time * 0.5));
  if (gust > 0.3) {
    for (const [dx, hgt] of pipes.slice(0, 5)) {
      const k = (time * 0.6 + dx * 0.01) % 1;
      ctx.strokeStyle = `rgba(255,248,210,${(gust - 0.3) * 0.9 * (1 - k)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(p.x + dx, GROUND - hgt - 6 - k * 26, 5 + k * 10, 2 + k * 3, 0, 0, TAU);
      ctx.stroke();
    }
  }
  // the worn sitting place and the feathers in a crack
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ellipse(ctx, p.x + p.w * 0.3, p.y + 1, 12, 2);
  ctx.fillStyle = '#9a5a3a';
  for (const [dx, a] of [[0.8, -0.4], [0.86, 0.2]]) {
    ctx.save();
    ctx.translate(p.x + p.w * dx, p.y);
    ctx.rotate(a);
    ellipse(ctx, 0, -7, 2.2, 7);
    ctx.restore();
  }
}

// Ochre's lean-to: an iron sheet on poles and a frame of old basket hoops (its roof a platform), a stack of full
// baskets of sulphur waiting to go down, her spare yoke leaning on it, a water butt, and a peg with a wet cloth
function drawLeanTo(ctx, p, time) {
  const top = p.y, bottom = GROUND + 2;
  ctx.strokeStyle = '#7a6a5a'; // poles
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x + 8, bottom);
  ctx.lineTo(p.x + 12, top + 4);
  ctx.moveTo(p.x + p.w - 10, bottom);
  ctx.lineTo(p.x + p.w - 12, top + 4);
  ctx.stroke();
  ctx.strokeStyle = '#8a6a48'; // basket hoops for the back wall
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, bottom - 20 - i * 20, p.w * 0.4, 16, 0, Math.PI, 0);
    ctx.stroke();
  }
  ctx.fillStyle = '#7a7480'; // the iron sheet roof, rippled, streaked yellow
  ctx.beginPath();
  ctx.roundRect(p.x - 6, top - 4, p.w + 12, 9, 2);
  ctx.fill();
  ctx.strokeStyle = '#4e4a56';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = p.x; x < p.x + p.w + 6; x += 10) {
    ctx.moveTo(x, top - 3);
    ctx.lineTo(x, top + 4);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(232,200,74,0.5)';
  ellipse(ctx, p.x + p.w * 0.6, top + 1, 18, 3);
  // the stack of full baskets, west of the lean-to (Ochre stands by them)
  const bx = OCHRE_X - 90;
  const basket = (x, y) => {
    ctx.fillStyle = '#b08a5a';
    ctx.strokeStyle = '#6a4a30';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 24);
    ctx.lineTo(x + 16, y - 24);
    ctx.lineTo(x + 12, y);
    ctx.lineTo(x - 12, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let yy = y - 18; yy < y; yy += 6) {
      ctx.moveTo(x - 14, yy);
      ctx.lineTo(x + 14, yy);
    }
    ctx.stroke();
    ctx.fillStyle = SUL;
    ellipse(ctx, x, y - 24, 15, 5);
    ctx.fillStyle = SUL_L;
    circle(ctx, x - 4, y - 27, 2.4);
  };
  basket(bx - 34, GROUND);
  basket(bx, GROUND);
  basket(bx - 17, GROUND - 26);
  // the spare yoke leaning on them
  ctx.strokeStyle = '#8a6a48';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(bx + 20, GROUND);
  ctx.quadraticCurveTo(bx + 30, GROUND - 40, bx + 24, GROUND - 74);
  ctx.stroke();
  // a water butt, a cloth on a peg dripping into it
  const wx = OCHRE_X - 180; // (west of the baskets: the Breathing Stone stands east of the lean-to)
  ctx.fillStyle = '#6a5040';
  ctx.beginPath();
  ctx.roundRect(wx - 16, GROUND - 30, 32, 30, 5);
  ctx.fill();
  ctx.fillStyle = '#7a9aa8';
  ellipse(ctx, wx, GROUND - 30, 14, 3);
  ctx.strokeStyle = '#7a6a5a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wx + 22, GROUND);
  ctx.lineTo(wx + 22, GROUND - 56);
  ctx.lineTo(wx + 8, GROUND - 56);
  ctx.stroke();
  ctx.fillStyle = '#c8c0b0';
  ctx.beginPath();
  ctx.roundRect(wx - 2, GROUND - 56, 12, 18, 2);
  ctx.fill();
  const k = (time * 0.9) % 1;
  ctx.fillStyle = 'rgba(160,200,220,0.8)';
  circle(ctx, wx + 4, GROUND - 38 + k * 6, 1.4);
}

function drawZoneSign(ctx, x, z, i) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(140, ctx.measureText(z.name).width + 30);
  ctx.fillStyle = '#4a3e3a';
  ctx.fillRect(x - tw / 2 + 10, GROUND - 92, 5, 92);
  ctx.fillRect(x + tw / 2 - 15, GROUND - 92, 5, 92);
  ctx.save();
  ctx.translate(x, GROUND - 66);
  ctx.fillStyle = '#c4b088';
  ctx.strokeStyle = '#3a302c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 46, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(232,200,74,0.5)'; // a crust of sulphur on it
  ellipse(ctx, tw / 2 - 18, 18, 16, 5);
  text(ctx, z.name, 0, -6, 15, '#3a2a26');
  const red = i === 0;
  ctx.fillStyle = red ? '#d0485a' : 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-32, 6, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 14.5, 11, red ? '#fffaf0' : '#3a2a26');
  ctx.restore();
}

// The way back down the flank
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
  text(ctx, 'Magma Heart', 0, 1, 12, '#4a3440');
  ctx.fillStyle = '#d0485a';
  ctx.fillRect(-3, 12, 6, 10);
  ctx.restore();
}

// Fume drifting through, thicker toward the High Vents
function drawAir(ctx, camX, time) {
  const top = Math.max(0, 1 - camX / 3800); // 1 at the High Vents, 0 at the camp
  for (const d of drift) {
    const x = ((((d.x - camX * 0.5 + time * d.v) % (W + 200)) + W + 200) % (W + 200)) - 100;
    const a = (0.05 + 0.1 * top) * (0.6 + 0.4 * Math.sin(time * 0.5 + d.p));
    ctx.fillStyle = `rgba(236,226,150,${a})`;
    circle(ctx, x, d.y + Math.sin(time * 0.4 + d.p) * 10, d.r);
  }
}
