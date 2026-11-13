// Docs: docs/places/citadel.md, docs/places/branches.md
// The Aether Citadel's ways into its branches (the Citadel's depth pass, C0: story/citadel-plan.md), drawn by
// src/branch-gates.js like every island's (its DRAW, OPEN and SIGN_AT take these in). All in room 13, feet on the ground at
// the gate's x. Laid in C0, each lifted by the phase that ships its branch (its `open` look is drawn then):
// - `gardenstair` (C0, open): a brass spiral stair going up out of the Bastion to the Keepers' Gardens on the roof.
// - `shutter` (the Archive, C2): a stair going down under an arch, an iron shutter down over it, a sentinel's stamp on it.
// - `hatch` (the Keel, C5): a round maintenance hatch in the deck by the Grand Foundry, clamped shut under a jammed gear
//   that ticks, one beat slow.
// - `combolock` (the Orrery, C1): a round brass door with a combination lock on it, its rings turning by themselves,
//   round and round, never stopping.
// - `blastdoor` (the Engine Halls, C3): a riveted blast door onto the catwalks, venting steam too hot to pass; behind it,
//   the glow of something huge turning.
// - `frozenrain` (the Bell Walks, C4): a stair going up toward the top of the Spire, rain hanging on it in the air, every
//   drop stopped.
// The Citadel's register: brass, verdigris, iron, aether-glass; solemn, nothing whimsical.
import { TAU, circle, ellipse } from './util.js';

const BRASS = '#f0c470', BRASS_L = '#fde3a0', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const IRON = '#4a4656', IRON_D = '#2a2834', IRON_L = '#6e6a7e';
const STONE = '#efe2cc', STONE_D = '#cbb594', STONE_E = '#a08a68';
const CRYSTAL = '#c8b0ff', CRYSTAL_D = '#7a62c8';

function archway(ctx, w, h, fill, edge) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 2);
  ctx.lineTo(-w / 2, -h + w / 2);
  ctx.arc(0, -h + w / 2, w / 2, Math.PI, 0);
  ctx.lineTo(w / 2, 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 3;
  ctx.stroke();
}
function gear(ctx, x, y, r, n, a, face = BRASS, edge = BRASS_E) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const ang = a + (i / (n * 2)) * TAU, rr = i % 2 ? r : r * 0.8;
    ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = face;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = edge;
  circle(ctx, x, y, r * 0.28);
}
function steamPuff(ctx, x, y, time, ph, s = 1, a = 0.5) {
  for (let i = 0; i < 4; i++) {
    const p = (time * 0.5 + ph + i / 4) % 1;
    ctx.fillStyle = `rgba(250,248,244,${a * (1 - p)})`;
    circle(ctx, x + Math.sin(ph * 9 + i) * 8 * p, y - p * 70 * s, (8 + p * 18) * s);
  }
}

// The brass spiral stair up to the Keepers' Gardens (C0's: drawn open from the start). Its door is in ROOMS[CITADEL]
function drawGardenStair(ctx, time) {
  // the stair's column, going up out of sight, a brass rail wound round it
  ctx.fillStyle = STONE_D;
  ctx.fillRect(-16, -260, 32, 262);
  ctx.strokeStyle = STONE_E;
  ctx.lineWidth = 2;
  ctx.strokeRect(-16, -260, 32, 262);
  for (let i = 0; i < 9; i++) { // the treads, fanning round the column
    const y = -14 - i * 28, side = i % 2 ? 1 : -1;
    ctx.fillStyle = i % 2 ? STONE : '#e4d4b8';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(side * 58, y - 6);
    ctx.lineTo(side * 56, y + 4);
    ctx.lineTo(0, y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = STONE_E;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const k = i / 40, a = k * TAU * 2.2;
    ctx.lineTo(Math.sin(a) * 60, -k * 260 - 28);
  }
  ctx.stroke();
  ctx.strokeStyle = BRASS_L;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // a breath of wind coming down it, and a dry leaf
  const p = (time * 0.3) % 1;
  ctx.fillStyle = 'rgba(170,150,110,0.7)';
  ellipse(ctx, Math.sin(p * 9) * 40, -240 + p * 230, 3.5, 1.5, p * 12);
  // a brass plate at its foot
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.roundRect(-20, -54, 40, 16, 3);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = BRASS_E;
  for (let i = 0; i < 5; i++) ctx.fillRect(-14 + i * 6, -48, 3, 4); // (an inscription nobody can read)
}

// The Archive's stair down, an iron shutter over it, a sentinel's stamp (C2 raises it)
function drawShutter(ctx, time, g, open = false) {
  archway(ctx, 150, 190, STONE_D, STONE_E);
  ctx.fillStyle = '#1e1a28'; // the stair going down into the dark
  ctx.beginPath();
  ctx.moveTo(-60, 2);
  ctx.lineTo(-60, -110);
  ctx.arc(0, -110, 60, Math.PI, 0);
  ctx.lineTo(60, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(240,232,210,0.12)';
  for (let i = 0; i < 4; i++) ctx.fillRect(-50 + i * 6, -30 + i * 10, 100 - i * 12, 3);
  if (open) {
    // the shutter rolled up into the arch, pages drifting up out of the stair (time is wrong down there)
    ctx.fillStyle = IRON;
    ctx.fillRect(-62, -168, 124, 16);
    for (let i = 0; i < 4; i++) {
      const p = (time * 0.12 + i / 4) % 1;
      ctx.fillStyle = `rgba(244,238,220,${0.8 * (1 - p)})`;
      ctx.save();
      ctx.translate(Math.sin(i * 2 + time * 0.5) * 30, -10 - p * 170);
      ctx.rotate(Math.sin(time + i) * 0.6);
      ctx.fillRect(-6, -4, 12, 8);
      ctx.restore();
    }
    return;
  }
  // the shutter: iron slats, top to bottom
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-62, 2);
  ctx.lineTo(-62, -110);
  ctx.arc(0, -110, 62, Math.PI, 0);
  ctx.lineTo(62, 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = IRON;
  ctx.fillRect(-64, -176, 128, 180);
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  for (let y = -170; y < 0; y += 12) {
    ctx.beginPath();
    ctx.moveTo(-64, y);
    ctx.lineTo(64, y);
    ctx.stroke();
  }
  ctx.restore();
  // the sentinel's stamp: a round seal of red wax with a brass eye pressed into it
  ctx.fillStyle = '#a83a3a';
  circle(ctx, 0, -78, 15);
  ctx.strokeStyle = '#6a1e1e';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = BRASS_L;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, -78, 9, 5, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = BRASS_L;
  circle(ctx, 0, -78, 2.5);
  // the base rail, padlocked
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-64, -6, 128, 8);
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(-8, -14, 16, 14, 3);
  ctx.fill();
}

// The Grand Foundry's maintenance hatch, clamped shut under a jammed gear that ticks one beat slow (C5 frees it)
function drawHatch(ctx, time, g, open = false) {
  // a squat brass housing round a round hatch set in the deck, half sunk
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.ellipse(0, 0, 74, 22, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.fillStyle = open ? '#0e0c14' : IRON;
  ctx.beginPath();
  ctx.ellipse(0, -4, 54, 14, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = BRASS_E;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    circle(ctx, Math.cos(a) * 64, -4 + Math.sin(a) * 18, 2);
  }
  if (open) {
    ctx.fillStyle = 'rgba(150,240,234,0.15)'; // aether leaking up from far down
    ellipse(ctx, 0, -6, 40, 8);
    return;
  }
  // the clamp: an iron bar across it, and the jammed gear wedged in its jaw, rocking a tooth and back, once a beat late
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-70, -16, 140, 10);
  const beat = (time * 0.9) % 1, jerk = beat > 0.82 ? Math.sin((beat - 0.82) / 0.18 * Math.PI) * 0.12 : 0;
  gear(ctx, 26, -40, 34, 12, 0.2 + jerk, BRASS, BRASS_E);
  gear(ctx, -30, -30, 20, 9, -0.4 - jerk * 1.6, BRASS_L, BRASS_E);
  ctx.strokeStyle = 'rgba(42,40,52,0.9)'; // a broken tooth, bent into the bar
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, -12);
  ctx.lineTo(2, -4);
  ctx.stroke();
  // a little brass tag wired to it: a requisition for a gear, never filled
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(52, -36);
  ctx.lineTo(62, -18);
  ctx.stroke();
  ctx.fillStyle = '#f4eedc';
  ctx.fillRect(56, -18, 14, 9);
}

// The Orrery's door: a round brass door in an arch of crystal, its combination lock's three rings turning by themselves,
// never stopping (C1 stops them)
function drawComboLock(ctx, time, g, open = false) {
  archway(ctx, 168, 210, '#9a8ccc', '#6f60a8');
  ctx.fillStyle = 'rgba(200,176,255,0.35)'; // crystal facets in the arch
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 70, -126 + Math.sin(a) * 70);
    ctx.lineTo(Math.cos(a) * 84, -126 + Math.sin(a) * 84);
    ctx.lineTo(Math.cos(a + 0.12) * 78, -126 + Math.sin(a + 0.12) * 78);
    ctx.closePath();
    ctx.fill();
  }
  const cx = 0, cy = -92;
  if (open) {
    ctx.fillStyle = '#141028';
    circle(ctx, cx, cy, 64);
    for (let i = 0; i < 12; i++) { // stars beyond
      ctx.fillStyle = `rgba(255,250,235,${0.4 + 0.4 * Math.sin(time * 2 + i)})`;
      circle(ctx, cx + Math.cos(i * 2.4) * 40 * ((i % 4) / 4 + 0.2), cy + Math.sin(i * 2.4) * 40 * ((i % 3) / 3 + 0.2), 1.4);
    }
    return;
  }
  const dg = ctx.createRadialGradient(cx - 20, cy - 20, 6, cx, cy, 66);
  dg.addColorStop(0, BRASS_L);
  dg.addColorStop(1, BRASS_D);
  ctx.fillStyle = dg;
  circle(ctx, cx, cy, 66);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 66, 0, TAU);
  ctx.stroke();
  // three rings, each turning its own way at its own pace, marked with star signs
  const rings = [[54, 0.35], [40, -0.55], [26, 0.8]];
  rings.forEach(([r, v], i) => {
    ctx.strokeStyle = i % 2 ? BRASS_E : '#a8743a';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.stroke();
    const a0 = time * v + i;
    ctx.fillStyle = BRASS_L;
    for (let k = 0; k < 8; k++) {
      const a = a0 + (k / 8) * TAU;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (k % 2) circle(ctx, x, y, 2);
      else {
        ctx.beginPath();
        ctx.moveTo(x, y - 3.5);
        ctx.lineTo(x + 1.2, y - 1.2);
        ctx.lineTo(x + 3.5, y);
        ctx.lineTo(x + 1.2, y + 1.2);
        ctx.lineTo(x, y + 3.5);
        ctx.lineTo(x - 1.2, y + 1.2);
        ctx.lineTo(x - 3.5, y);
        ctx.lineTo(x - 1.2, y - 1.2);
        ctx.closePath();
        ctx.fill();
      }
    }
  });
  // the pointer at the top, never lined up
  ctx.fillStyle = '#a83a3a';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 68);
  ctx.lineTo(cx - 6, cy - 78);
  ctx.lineTo(cx + 6, cy - 78);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = BRASS_E;
  circle(ctx, cx, cy, 8);
}

// The Engine Halls' blast door: riveted iron onto the catwalks, steam venting hot round its edges, a glow behind its
// porthole of something huge turning (C3 vents it)
function drawBlastDoor(ctx, time, g, open = false) {
  ctx.fillStyle = IRON_D; // the frame
  ctx.beginPath();
  ctx.roundRect(-82, -216, 164, 218, 14);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 3;
  ctx.stroke();
  const turn = time * 0.7;
  if (open) {
    ctx.fillStyle = '#16202a';
    ctx.beginPath();
    ctx.roundRect(-66, -200, 132, 200, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(150,240,234,0.3)';
    circle(ctx, 0, -110, 50);
    ctx.strokeStyle = 'rgba(150,240,234,0.7)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const a = turn + (i / 5) * TAU;
      ctx.beginPath();
      ctx.moveTo(0, -110);
      ctx.lineTo(Math.cos(a) * 46, -110 + Math.sin(a) * 46);
      ctx.stroke();
    }
    return;
  }
  const dg = ctx.createLinearGradient(-66, 0, 66, 0);
  dg.addColorStop(0, IRON);
  dg.addColorStop(0.5, IRON_L);
  dg.addColorStop(1, IRON);
  ctx.fillStyle = dg;
  ctx.beginPath();
  ctx.roundRect(-66, -200, 132, 200, 10);
  ctx.fill();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = IRON_D; // rivets, in rows
  for (let y = -190; y < 0; y += 22) for (const x of [-56, 56]) circle(ctx, x, y, 2.6);
  // the wheel lock in the middle
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, -70, 24, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.lineTo(Math.cos(a) * 24, -70 + Math.sin(a) * 24);
    ctx.stroke();
  }
  // the porthole: blue fire behind glass, a huge blade sweeping past now and then
  ctx.fillStyle = BRASS_D;
  circle(ctx, 0, -150, 28);
  ctx.fillStyle = '#1e3440';
  circle(ctx, 0, -150, 22);
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, -150, 22, 0, TAU);
  ctx.clip();
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);
  ctx.fillStyle = `rgba(150,240,234,${0.35 + 0.25 * pulse})`;
  ctx.fillRect(-22, -172, 44, 44);
  ctx.fillStyle = 'rgba(20,24,34,0.85)';
  const sweep = ((time * 0.6) % 1.6) - 0.3;
  ctx.fillRect(-30 + sweep * 60, -176, 14, 52);
  ctx.restore();
  // the heat: the door's edges glowing dull red, steam jetting out of the seams
  ctx.strokeStyle = `rgba(255,110,70,${0.35 + 0.2 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-68, -202, 136, 204, 11);
  ctx.stroke();
  steamPuff(ctx, -70, -180, time, 0.1, 1, 0.55);
  steamPuff(ctx, 70, -120, time * 1.2, 0.5, 1, 0.55);
  steamPuff(ctx, -70, -60, time * 0.9, 0.3, 0.9, 0.5);
  steamPuff(ctx, 70, -20, time * 1.1, 0.7, 0.8, 0.5);
  // a stencilled warning plate, words worn off; only the heat sign left
  ctx.fillStyle = '#e8c440';
  ctx.beginPath();
  ctx.moveTo(0, -36);
  ctx.lineTo(-12, -16);
  ctx.lineTo(12, -16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-1.2, -30, 2.4, 8);
  circle(ctx, 0, -19.5, 1.4);
}

// The stair above the Hour Sanctum, going up toward the top of the Spire: a crystal stair, rain hanging on it in the air,
// every drop stopped (C4 lets it fall)
function drawFrozenRain(ctx, time, g, open = false) {
  // the stair, climbing to the right into the haze
  for (let i = 0; i < 10; i++) {
    const x = -90 + i * 20, y = -i * 22;
    ctx.fillStyle = i % 2 ? '#b8a6ec' : '#a898e0';
    ctx.fillRect(x, y - 10, 30, 12);
    ctx.strokeStyle = CRYSTAL_D;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x, y - 10, 30, 12);
  }
  ctx.strokeStyle = 'rgba(200,176,255,0.8)'; // a crystal hand-rail
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-90, -40);
  ctx.lineTo(110, -238);
  ctx.stroke();
  if (open) {
    // the rain fallen: a wet sheen on every step, a few drops still running down
    ctx.fillStyle = 'rgba(200,230,255,0.35)';
    for (let i = 0; i < 10; i++) ctx.fillRect(-90 + i * 20, -i * 22 - 11, 30, 3);
    return;
  }
  // the drops, hanging: hundreds of little teardrops, perfectly still, catching the light; a faint shimmer runs through them
  // now and then (the only thing that moves)
  const shimmer = (time * 0.25) % 1;
  for (let i = 0; i < 160; i++) {
    const x = -110 + ((i * 53) % 230), y = -6 - ((i * 97) % 250);
    const lit = Math.abs(((x + 110) / 230) - shimmer) < 0.06;
    ctx.fillStyle = lit ? 'rgba(255,255,255,0.95)' : 'rgba(210,226,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(x, y - 3.6);
    ctx.quadraticCurveTo(x + 2, y, x, y + 1.8);
    ctx.quadraticCurveTo(x - 2, y, x, y - 3.6);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(200,176,255,0.12)'; // a pale wall where they're thickest
  ctx.fillRect(-60, -230, 150, 230);
}

export const CITADEL_DRAW = { shutter: drawShutter, hatch: drawHatch, combolock: drawComboLock, blastdoor: drawBlastDoor, frozenrain: drawFrozenRain };
export const CITADEL_OPEN = {
  gardenstair: drawGardenStair,
  shutter: (ctx, time, g) => drawShutter(ctx, time, g, true), hatch: (ctx, time, g) => drawHatch(ctx, time, g, true),
  combolock: (ctx, time, g) => drawComboLock(ctx, time, g, true), blastdoor: (ctx, time, g) => drawBlastDoor(ctx, time, g, true),
  frozenrain: (ctx, time, g) => drawFrozenRain(ctx, time, g, true),
};
// where each one's sign stands, relative to it
export const CITADEL_SIGN_AT = { gardenstair: 96, shutter: -118, hatch: 104, combolock: -126, blastdoor: 122, frozenrain: -136 };
