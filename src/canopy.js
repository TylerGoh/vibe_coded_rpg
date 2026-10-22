// Docs: docs/places/canopy.md
// The Old Oak Canopy (room CANOPY, data in src/shared/rpg.js): the treetops above Bramble Woods, up the rope
// ladder. A wide room, not a tall one: the floor is the Great Bough, an oak limb as broad as a road, with
// the leafy depths below it; the "height" is side boughs and rope bridges stacked above, and great trunks
// running up off the top of the screen. West to east: the rope ladder down, Ranger Acorn's treehouse (its
// roof is a platform), the Lifted Stone (src/ruins.js), then the Squirrel Boughs, the Owl Hollows (shadier,
// eyes in the knotholes) and the Wasp Crowns (golden late light, paper nests hanging in the leaves), with
// the fallen trunk to Keeper's Spine at the far end (src/branch-gates.js). Through gaps in the leaves you see
// the sea and the far islands; from the Owl Hollows on, the Spine's bare grey ridge rises over the leaves
// (shown, not open: story/world/island-depth.md). The Crow's Nest, a lookout high over the Owl Hollows, is
// the off-the-path spot.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { CANOPY_W, CANOPY_EXIT_X, CANOPY_ZONES, CANOPY_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const INK = '#5b4a6b';
const BOUGH_H = 56; // how thick the Great Bough looks under your feet
const OWLS_X = CANOPY_ZONES[2].x0, WASPS_X = CANOPY_ZONES[3].x0;
const HOUSE = CANOPY_PLATFORMS[0];
const NEST = CANOPY_PLATFORMS.at(-1);
const HORIZON = 250;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const smooth = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// A soft round glow (this area's falloff; drawn by src/glow.js)
function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3); // src/glow.js
}

// ——— seeded scenery ———
// leaf masses in the distance, two layers sliding slower than the bough. The far one grows in clumps with
// gaps between them, where you see the sea; the near one only rises up to just under the horizon
const farLeaves = [0.12, 0.3].map((f, j) => {
  const r = mulberry32(3101 + j);
  const blobs = Array.from({ length: 22 }, (_, i) => ({ x: i * 110 + r() * 60, y: (j ? 300 : 150) + r() * (j ? 50 : 80), r: (j ? 60 : 45) + r() * 40, gap: !j && i % 8 >= 6 }));
  return { f, span: 2420, blobs: blobs.filter((b) => !b.gap) };
});
// the great trunks: running up off the top of the screen and down into the depths
const TRUNKS = (() => {
  const r = mulberry32(3111);
  const out = [];
  for (let x = 380; x < CANOPY_W - 100; x += 560 + r() * 260) {
    if (Math.abs(x - (HOUSE.x + HOUSE.w / 2)) < 160) continue;
    out.push({ x, w: 80 + r() * 50, lean: (r() - 0.5) * 30, holes: Array.from({ length: 2 }, () => ({ y: 80 + r() * 230, s: 0.8 + r() * 0.5 })), p: r() * TAU });
  }
  return out;
})();
// paper nests hanging in the far leaves of the Wasp Crowns
const PAPER_NESTS = (() => {
  const r = mulberry32(3121);
  const out = [];
  for (let x = WASPS_X + 80; x < CANOPY_W; x += 180 + r() * 220) out.push({ x, y: 40 + r() * 120, s: 0.6 + r() * 0.6, p: r() * TAU });
  return out;
})();
const tufts = (() => {
  const r = mulberry32(3131);
  const out = [];
  for (let x = 20; x < CANOPY_W; x += 26 + r() * 50) out.push({ x, s: 0.6 + r() * 0.8, c: r() < 0.5 ? '#86b46a' : '#9cc87a', flower: r() < 0.12 });
  return out;
})();
const leavesFall = (() => {
  const r = mulberry32(3141);
  return Array.from({ length: 26 }, () => ({ x: r() * W, y: r() * H, v: 14 + r() * 18, sw: 20 + r() * 30, p: r() * TAU, s: 2.4 + r() * 2.4, c: ['#9cc87a', '#b8d888', '#d8b860', '#e09a5a'][Math.floor(r() * 4)] }));
})();
const beams = (() => {
  const r = mulberry32(3151);
  const out = [];
  for (let x = 200; x < CANOPY_W; x += 420 + r() * 500) out.push({ x, w: 40 + r() * 50, a: 0.12 + r() * 0.1 });
  return out;
})();

// How much of the zones' moods applies at x: shade in the Owl Hollows, golden light in the Wasp Crowns
const shadeAt = (x) => smooth(OWLS_X - 300, OWLS_X + 200, x) * (1 - smooth(WASPS_X - 200, WASPS_X + 300, x));
const goldAt = (x) => smooth(WASPS_X - 300, WASPS_X + 300, x);

// Everything behind the slimes. camX is the left edge of the view.
export function drawCanopy(ctx, camX, viewW, time) {
  const mid = camX + viewW / 2;
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, camX, time, goldAt(mid));
  drawFarLeaves(ctx, camX, time, shadeAt(mid), goldAt(mid));
  drawSpine(ctx, camX, time);
  ctx.restore();

  const L = camX - 120, R = camX + viewW + 120;
  for (const n of PAPER_NESTS) if (visible(n.x - 40, n.x + 40, L, R)) drawPaperNest(ctx, n, time);
  for (const b of beams) if (visible(b.x - 120, b.x + 200, L, R)) drawBeam(ctx, b, time);
  for (const t of TRUNKS) if (visible(t.x - t.w, t.x + t.w, L, R)) drawTrunk(ctx, t, time);
  for (const p of CANOPY_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'bough') drawBough(ctx, p, time);
    else if (p.kind === 'bridge') drawBridge(ctx, p, time);
  }
  if (visible(HOUSE.x - 120, HOUSE.x + HOUSE.w + 120, L, R)) drawTreehouse(ctx, time);
  if (visible(NEST.x - 60, NEST.x + NEST.w + 60, L, R)) drawCrowsNest(ctx, NEST, time);
  drawGreatBough(ctx, Math.max(0, L), Math.min(CANOPY_W, R), time);
  if (visible(CANOPY_EXIT_X - 80, CANOPY_EXIT_X + 160, L, R)) drawLadderDown(ctx, time);
  CANOPY_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x0 + 70;
    if (visible(sx - 80, sx + 80, L, R)) drawZoneSign(ctx, sx, z, i, time);
  });
  if (visible(CANOPY_EXIT_X, CANOPY_EXIT_X + 220, L, R)) drawExitSign(ctx, CANOPY_EXIT_X + 110, time);
  // the zones' moods, washed over everything behind the slimes
  ctx.save();
  ctx.translate(camX, 0);
  const sh = shadeAt(mid), gd = goldAt(mid);
  if (sh > 0.01) {
    ctx.fillStyle = `rgba(30,60,50,${0.16 * sh})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (gd > 0.01) {
    ctx.fillStyle = `rgba(255,190,90,${0.1 * gd})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawFallingLeaves(ctx, camX, time);
  ctx.restore();
}

// The sky over the treetops: bright blue going warm toward the horizon, and the sea far below it with the
// far islands on it (seen over the island's east side)
function drawSky(ctx, camX, time, gold) {
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, gold > 0.5 ? '#9cc8e8' : '#a8d8f0');
  g.addColorStop(1, gold > 0.5 ? '#ffe4bc' : '#eaf6f2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, HORIZON);
  glow(ctx, W * 0.78, 70, 160, 120, '255,244,200', 0.55 + 0.2 * gold);
  ctx.fillStyle = '#fff8dc';
  circle(ctx, W * 0.78, 70, 22);
  // the sea and the islands across it
  const sea = ctx.createLinearGradient(0, HORIZON, 0, H);
  sea.addColorStop(0, '#b8dcea');
  sea.addColorStop(1, '#8cc4dc');
  ctx.fillStyle = sea;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  drawDistantIslands(ctx, { from: 'green', scroll: camX, roomW: CANOPY_W, time, horizon: HORIZON, haze: '#eef4f0', fade: 0.6, scale: 0.5, sky: 180 });
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = HORIZON + 12 + i * 14, x = ((i * 173 - time * (6 + i)) % W + W) % W;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 40, y);
    ctx.stroke();
  }
}

// Two layers of distant treetops, leaving gaps where the sky and sea show through
function drawFarLeaves(ctx, camX, time, shade, gold) {
  farLeaves.forEach(({ f, span, blobs }, j) => {
    const base = j ? '#7aae6a' : '#a2c896';
    ctx.fillStyle = gold > 0.3 ? (j ? '#8aa860' : '#b4c486') : base;
    const off = -((camX * f) % span);
    for (const rep of [0, span]) {
      for (const b of blobs) {
        const x = off + rep + b.x;
        if (x < -b.r * 1.6 || x > W + b.r * 1.6) continue;
        const sway = Math.sin(time * 0.5 + b.x) * 2;
        circle(ctx, x + sway, b.y, b.r);
        circle(ctx, x - b.r * 0.7 + sway, b.y + b.r * 0.4, b.r * 0.75);
        circle(ctx, x + b.r * 0.7 + sway, b.y + b.r * 0.5, b.r * 0.7);
        ctx.fillRect(x - b.r * 1.2, b.y + b.r * 0.4, b.r * 2.4, H);
      }
    }
    if (shade > 0.01 && j) {
      ctx.fillStyle = `rgba(30,60,50,${0.12 * shade})`;
      ctx.fillRect(0, 0, W, H);
    }
  });
  // a soft green haze over the far layer
  ctx.fillStyle = 'rgba(150,200,150,0.12)';
  ctx.fillRect(0, 0, W, H);
}

// Keeper's Spine: from the Owl Hollows on, a bare grey ridge rises over the treetops in the east, standing
// stones along its crest. It's where the high path goes, past the fallen trunk (not open yet: G5).
function drawSpine(ctx, camX, time) {
  const x = 2120 - camX * 0.3; // its middle, in screen px (it slides slowly, like the far leaves)
  if (x < -500 || x > W + 500) return;
  const top = 92;
  ctx.fillStyle = '#a8a4b4';
  ctx.beginPath();
  ctx.moveTo(x - 520, HORIZON + 30);
  ctx.quadraticCurveTo(x - 300, top + 70, x - 120, top + 18);
  ctx.lineTo(x - 40, top);
  ctx.quadraticCurveTo(x + 60, top - 8, x + 150, top + 26);
  ctx.quadraticCurveTo(x + 340, top + 80, x + 520, HORIZON + 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#bcb8c8'; // the lit face
  ctx.beginPath();
  ctx.moveTo(x - 40, top);
  ctx.quadraticCurveTo(x + 60, top - 8, x + 150, top + 26);
  ctx.quadraticCurveTo(x + 300, top + 70, x + 420, HORIZON);
  ctx.lineTo(x + 40, HORIZON);
  ctx.closePath();
  ctx.fill();
  // standing stones along the crest, small with distance
  ctx.fillStyle = '#8a8698';
  const crest = (dx) => (dx < -40 ? (-40 - dx) * 0.24 : dx < 60 ? -2 : (dx - 60) * 0.3);
  for (const [dx, hgt] of [[-70, 18], [-30, 26], [20, 30], [70, 22]]) {
    const cy = top + crest(dx) + 3;
    ctx.beginPath();
    ctx.roundRect(x + dx - 4, cy - hgt, 8, hgt + 4, [3, 3, 0, 0]);
    ctx.fill();
  }
  // wind streaming off the top
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.12 + i / 3) % 1;
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8;
    ctx.beginPath();
    ctx.moveTo(x - 60 + k * 200, top - 10 - i * 8);
    ctx.quadraticCurveTo(x + k * 200, top - 20 - i * 8, x + 60 + k * 200, top - 12 - i * 8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// A grey paper wasp nest hanging from a twig in the far leaves, a few dots of wasps round it
function drawPaperNest(ctx, n, time) {
  const s = n.s, sw = Math.sin(time * 0.8 + n.p) * 0.05;
  ctx.save();
  ctx.translate(n.x, n.y);
  ctx.rotate(sw);
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = '#6a5040';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -40 * s);
  ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.fillStyle = '#cfc6bc';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(24 * s, 4 * s, 22 * s, 46 * s, 0, 52 * s);
  ctx.bezierCurveTo(-22 * s, 46 * s, -24 * s, 4 * s, 0, 0);
  ctx.fill();
  ctx.strokeStyle = 'rgba(130,115,105,0.5)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-18 * s, i * 10 * s);
    ctx.quadraticCurveTo(0, i * 10 * s - 4, 18 * s, i * 10 * s);
    ctx.stroke();
  }
  ctx.fillStyle = '#5a4a40';
  ellipse(ctx, 0, 44 * s, 5 * s, 3 * s);
  ctx.restore();
  ctx.fillStyle = 'rgba(80,60,30,0.7)';
  for (let i = 0; i < 3; i++) {
    const a = time * 3 + n.p + i * 2.1;
    circle(ctx, n.x + Math.cos(a) * 30 * s, n.y + 26 * s + Math.sin(a * 1.4) * 20 * s, 1.6);
  }
}

// A shaft of sunlight falling through a gap in the leaves
function drawBeam(ctx, b, time) {
  const a = b.a * (0.75 + 0.25 * Math.sin(time * 0.6 + b.x));
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, `rgba(255,248,215,${a * 2})`);
  g.addColorStop(1, 'rgba(255,248,215,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(b.x, 0);
  ctx.lineTo(b.x + b.w, 0);
  ctx.lineTo(b.x + b.w + 140, GROUND);
  ctx.lineTo(b.x + 90, GROUND);
  ctx.closePath();
  ctx.fill();
}

// A great oak trunk, up off the top of the screen and down past the bough into the depths. In the Owl
// Hollows its knotholes have eyes in them that blink
function drawTrunk(ctx, t, time) {
  const x = t.x, w = t.w;
  const bark = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  bark.addColorStop(0, '#6e5040');
  bark.addColorStop(0.5, '#9a765e');
  bark.addColorStop(1, '#6a4c3c');
  ctx.fillStyle = bark;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + t.lean, -10);
  ctx.lineTo(x + w / 2 + t.lean, -10);
  ctx.quadraticCurveTo(x + w / 2, GROUND - 60, x + w / 2 + 14, H + 10);
  ctx.lineTo(x - w / 2 - 14, H + 10);
  ctx.quadraticCurveTo(x - w / 2, GROUND - 60, x - w / 2 + t.lean, -10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,40,30,0.4)';
  ctx.lineWidth = 2;
  for (const k of [-0.28, -0.05, 0.2, 0.34]) {
    ctx.beginPath();
    ctx.moveTo(x + w * k + t.lean, 0);
    ctx.quadraticCurveTo(x + w * k + Math.sin(k * 9) * 6, GROUND * 0.5, x + w * k * 1.1, H);
    ctx.stroke();
  }
  // moss up the shady side
  ctx.fillStyle = 'rgba(120,170,90,0.55)';
  for (let y = 40; y < GROUND; y += 70) ellipse(ctx, x - w * 0.38 + (t.lean * (GROUND - y)) / GROUND, y + Math.sin(y) * 10, 8, 20);
  const owls = x > OWLS_X - 100 && x < WASPS_X + 100;
  for (const h of t.holes) {
    const hx = x + (t.lean * (GROUND - h.y)) / GROUND + w * 0.08, hy = h.y, s = h.s;
    ctx.fillStyle = '#5a3e30';
    ellipse(ctx, hx, hy, 15 * s, 20 * s);
    ctx.fillStyle = '#2a1c18';
    ellipse(ctx, hx, hy + 2, 10 * s, 14 * s);
    if (owls) {
      const blink = ((time + h.y * 0.01 + t.p) % 4.5) < 0.18;
      if (!blink) {
        ctx.fillStyle = '#ffd060';
        circle(ctx, hx - 4 * s, hy, 2.6 * s);
        circle(ctx, hx + 4 * s, hy, 2.6 * s);
        ctx.fillStyle = '#2a1c18';
        circle(ctx, hx - 4 * s, hy, 1.1 * s);
        circle(ctx, hx + 4 * s, hy, 1.1 * s);
      }
    }
  }
}

// A side bough: a stout branch with leaf clumps at both ends and a twig or two; its top is the platform
function drawBough(ctx, p, time) {
  const y = p.y, x0 = p.x, x1 = p.x + p.w;
  ctx.fillStyle = 'rgba(20,40,20,0.18)';
  ellipse(ctx, (x0 + x1) / 2, y + 26, p.w * 0.4, 6);
  const bark = ctx.createLinearGradient(0, y - 2, 0, y + 20);
  bark.addColorStop(0, '#a07a5e');
  bark.addColorStop(1, '#6e5040');
  ctx.fillStyle = bark;
  ctx.strokeStyle = '#4e3628';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 - 6, y + 2);
  ctx.quadraticCurveTo((x0 + x1) / 2, y - 3, x1 + 6, y + 1);
  ctx.quadraticCurveTo(x1 + 12, y + 9, x1 + 2, y + 15);
  ctx.quadraticCurveTo((x0 + x1) / 2, y + 22, x0 - 2, y + 17);
  ctx.quadraticCurveTo(x0 - 14, y + 10, x0 - 6, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60,40,30,0.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x0 + 10, y + 8);
  ctx.quadraticCurveTo((x0 + x1) / 2, y + 5, x1 - 10, y + 9);
  ctx.stroke();
  // a twig hanging down with a few leaves
  ctx.strokeStyle = '#6e5040';
  ctx.lineWidth = 2.4;
  const tx = x0 + p.w * 0.62;
  ctx.beginPath();
  ctx.moveTo(tx, y + 16);
  ctx.quadraticCurveTo(tx + 10, y + 34, tx + 4, y + 52);
  ctx.stroke();
  leafClump(ctx, tx + 4, y + 56, 0.7, time, p.x);
  // leafy ends
  leafClump(ctx, x0 - 4, y - 2, 1, time, p.x + 1);
  leafClump(ctx, x1 + 4, y - 4, 1.1, time, p.x + 2);
  // moss on top
  ctx.fillStyle = '#8fc070';
  for (let k = x0 + 18; k < x1 - 14; k += 32) ellipse(ctx, k, y + 1, 10, 3);
}
function leafClump(ctx, x, y, s, time, seed) {
  const sw = Math.sin(time * 1.2 + seed) * 2 * s;
  const cs = ['#7aae5e', '#8cc070', '#a2d084'];
  for (const [dx, dy, r, c] of [[-12, 2, 13, 0], [10, 0, 14, 1], [0, -10, 15, 2], [-4, 6, 11, 1], [14, -8, 9, 0]]) {
    ctx.fillStyle = cs[c];
    circle(ctx, x + dx * s + sw, y + dy * s, r * s);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  circle(ctx, x - 2 * s + sw, y - 14 * s, 5 * s);
}

// A rope bridge between two branch posts: planks on top (the platform), rope rails sagging between posts
function drawBridge(ctx, p, time) {
  const y = p.y, x0 = p.x, x1 = p.x + p.w, sag = Math.sin(time * 1.1 + p.x) * 1.5;
  // posts at each end, lashed to the trunks behind
  ctx.fillStyle = '#8a6448';
  ctx.strokeStyle = '#4e3628';
  ctx.lineWidth = 1.6;
  for (const x of [x0 - 4, x1 - 4]) {
    ctx.beginPath();
    ctx.roundRect(x, y - 40, 9, 58, 3);
    ctx.fill();
    ctx.stroke();
  }
  // the rails
  ctx.strokeStyle = '#d8c08a';
  ctx.lineWidth = 2;
  for (const dy of [-34, -18]) {
    ctx.beginPath();
    ctx.moveTo(x0, y + dy);
    ctx.quadraticCurveTo((x0 + x1) / 2, y + dy + 14 + sag, x1, y + dy);
    ctx.stroke();
  }
  // the hangers from rail to planks
  ctx.lineWidth = 1;
  for (let x = x0 + 20; x < x1 - 10; x += 26) {
    const k = (x - x0) / (x1 - x0), ry = y - 18 + 14 * 4 * k * (1 - k) + sag * 4 * k * (1 - k);
    ctx.beginPath();
    ctx.moveTo(x, ry);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  // planks
  for (let x = x0; x < x1; x += 16) {
    ctx.fillStyle = (x / 16) % 2 ? '#c8a07a' : '#b89068';
    ctx.strokeStyle = '#7a5a40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 1, y, 14, 9, 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = '#d8c08a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y + 9);
  ctx.lineTo(x1, y + 9);
  ctx.stroke();
}

// Ranger Acorn's treehouse: a round-windowed wooden hut on the bough, a shingled roof (the platform), a
// round green door, a flag, her pulley basket and a little row of squirrel-sized knitted hats drying
function drawTreehouse(ctx, time) {
  const p = HOUSE, x0 = p.x, x1 = p.x + p.w, cx = (x0 + x1) / 2, top = p.y;
  // the walls
  ctx.fillStyle = '#c89a6c';
  ctx.strokeStyle = '#7a5a40';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x0 + 10, top + 14, p.w - 20, GROUND - top - 12, 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,80,50,0.45)';
  ctx.lineWidth = 1.4;
  for (let y = top + 30; y < GROUND; y += 16) {
    ctx.beginPath();
    ctx.moveTo(x0 + 12, y);
    ctx.lineTo(x1 - 12, y);
    ctx.stroke();
  }
  // the round door
  ctx.fillStyle = '#5e8a4e';
  ctx.strokeStyle = '#34542c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 24, GROUND + 1);
  ctx.lineTo(cx - 24, GROUND - 40);
  ctx.arc(cx, GROUND - 40, 24, Math.PI, 0);
  ctx.lineTo(cx + 24, GROUND + 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d8b050';
  circle(ctx, cx + 14, GROUND - 26, 3);
  // a round window either side, lamplit
  for (const wx of [x0 + 36, x1 - 36]) {
    glow(ctx, wx, top + 50, 22, 22, '255,220,150', 0.5 + 0.1 * Math.sin(time * 2 + wx));
    ctx.fillStyle = '#ffe6b0';
    circle(ctx, wx, top + 50, 12);
    ctx.strokeStyle = '#7a5a40';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(wx, top + 50, 12, 0, TAU);
    ctx.moveTo(wx - 12, top + 50);
    ctx.lineTo(wx + 12, top + 50);
    ctx.moveTo(wx, top + 38);
    ctx.lineTo(wx, top + 62);
    ctx.stroke();
  }
  // the roof: green shingles, the platform's top
  ctx.fillStyle = '#6e9a58';
  ctx.strokeStyle = '#3e5e30';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 - 10, top + 18);
  ctx.quadraticCurveTo(cx, top - 6, x1 + 10, top + 18);
  ctx.lineTo(x1 - 4, top + 2);
  ctx.quadraticCurveTo(cx, top - 4, x0 + 4, top + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#86b46a';
  for (let x = x0; x < x1; x += 18) ellipse(ctx, x + 9, top + 1, 9, 3.5);
  // the flag: a little green pennant with an acorn on it
  const fx = x1 - 20, wave = Math.sin(time * 3) * 3;
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(fx - 1.5, top - 50, 3, 50);
  ctx.fillStyle = '#e06a5a';
  ctx.beginPath();
  ctx.moveTo(fx + 1.5, top - 50);
  ctx.quadraticCurveTo(fx + 18, top - 46 + wave, fx + 32, top - 42 + wave);
  ctx.quadraticCurveTo(fx + 18, top - 36 + wave, fx + 1.5, top - 32);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe6b0';
  circle(ctx, fx + 12, top - 41 + wave * 0.6, 2.6);
  // knitted hats drying on a line from the house to the nearest leaves
  ctx.strokeStyle = 'rgba(230,210,180,0.85)';
  ctx.lineWidth = 1;
  const lx0 = x1 - 6, lx1 = x1 + 90, ly = top + 26;
  ctx.beginPath();
  ctx.moveTo(lx0, ly);
  ctx.quadraticCurveTo((lx0 + lx1) / 2, ly + 14, lx1, ly - 4);
  ctx.stroke();
  ['#e06a5a', '#5aa0e0', '#ffd84a', '#a0d080'].forEach((c, i) => {
    const k = (i + 1) / 5, hx = lx0 + (lx1 - lx0) * k, hy = ly + 14 * 4 * k * (1 - k) - 4 * k + Math.sin(time * 1.6 + i) * 1;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(hx, hy + 6, 5, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff';
    circle(ctx, hx, hy, 1.8);
  });
  leafClump(ctx, lx1 + 10, ly - 6, 0.9, time, 7);
  // the pulley basket on its rope, hanging off the bough's edge
  const bx = x0 - 30, by = GROUND + 30 + Math.sin(time * 0.7) * 3;
  ctx.strokeStyle = '#7a5a40';
  ctx.lineWidth = 3;
  ctx.beginPath(); // the boom
  ctx.moveTo(x0 + 10, top + 30);
  ctx.lineTo(bx - 6, top + 22);
  ctx.stroke();
  ctx.strokeStyle = '#d8c08a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(bx, top + 24);
  ctx.lineTo(bx, by - 10);
  ctx.stroke();
  ctx.fillStyle = '#d8b07a';
  ctx.strokeStyle = '#a07a48';
  ctx.beginPath();
  ctx.roundRect(bx - 10, by - 10, 20, 14, [2, 2, 6, 6]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8c890'; // a loaf peeking out
  ellipse(ctx, bx, by - 10, 7, 4);
}

// The Crow's Nest: a wicker lookout high over the Owl Hollows, a pole with a ragged flag, a brass spyglass
// on a little stand pointing east (at the Spine), and a golden acorn someone left in the corner
function drawCrowsNest(ctx, p, time) {
  const x0 = p.x, x1 = p.x + p.w, cx = (x0 + x1) / 2, y = p.y;
  glow(ctx, cx, y - 16, 80, 50, '255,240,200', 0.25);
  // the branch it's lashed to, running up off the top
  ctx.strokeStyle = '#6e5040';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 30, -10);
  ctx.quadraticCurveTo(cx - 10, y - 30, cx, y + 30);
  ctx.stroke();
  // the basket
  ctx.fillStyle = '#d8b07a';
  ctx.strokeStyle = '#a07a48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 - 4, y);
  ctx.lineTo(x1 + 4, y);
  ctx.quadraticCurveTo(x1, y + 26, cx, y + 30);
  ctx.quadraticCurveTo(x0, y + 26, x0 - 4, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(160,122,72,0.6)';
  ctx.lineWidth = 1;
  for (let k = 6; k < 26; k += 6) {
    ctx.beginPath();
    ctx.moveTo(x0 + k * 0.3, y + k);
    ctx.lineTo(x1 - k * 0.3, y + k);
    ctx.stroke();
  }
  // the flag
  const px = x0 + 14, wave = Math.sin(time * 4) * 3;
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(px - 1.5, y - 54, 3, 54);
  ctx.fillStyle = '#f4ead8';
  ctx.beginPath();
  ctx.moveTo(px + 1.5, y - 54);
  ctx.lineTo(px + 26, y - 48 + wave);
  ctx.lineTo(px + 18, y - 44 + wave);
  ctx.lineTo(px + 26, y - 40 + wave);
  ctx.lineTo(px + 1.5, y - 36);
  ctx.closePath();
  ctx.fill();
  // the spyglass on its stand, pointing east
  const sx = x1 - 24;
  ctx.strokeStyle = '#7a5a40';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(sx, y);
  ctx.lineTo(sx, y - 14);
  ctx.moveTo(sx - 6, y);
  ctx.lineTo(sx, y - 14);
  ctx.moveTo(sx + 6, y);
  ctx.lineTo(sx, y - 14);
  ctx.stroke();
  ctx.save();
  ctx.translate(sx, y - 16);
  ctx.rotate(-0.25);
  ctx.fillStyle = '#d8b050';
  ctx.strokeStyle = '#8a6a20';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-10, -3, 24, 6, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b89030';
  ctx.fillRect(12, -4, 4, 8);
  ctx.restore();
  // the golden acorn
  const ax = cx - 6, ay = y - 5;
  glow(ctx, ax, ay, 14, 12, '255,220,120', 0.6 + 0.2 * Math.sin(time * 2.5));
  ctx.fillStyle = '#ffd050';
  ellipse(ctx, ax, ay + 1, 4, 5);
  ctx.fillStyle = '#b88a30';
  ctx.beginPath();
  ctx.arc(ax, ay - 1.5, 4.5, Math.PI, 0);
  ctx.fill();
}

// The Great Bough: the oak limb everyone walks on, broad as a road, bark and moss, planks laid along it
// round the camp, and the leafy depths below it with the forest floor lost in the haze
function drawGreatBough(ctx, L, R, time) {
  const depth = ctx.createLinearGradient(0, GROUND, 0, H);
  depth.addColorStop(0, '#4e7a50');
  depth.addColorStop(1, '#2e4e3a');
  ctx.fillStyle = depth;
  ctx.fillRect(L, GROUND + BOUGH_H - 10, R - L, H - GROUND);
  ctx.fillStyle = 'rgba(120,170,110,0.6)';
  for (let x = L - (L % 60); x < R + 60; x += 60) circle(ctx, x + Math.sin(x) * 10, GROUND + BOUGH_H + 18 + Math.sin(x * 0.7) * 6, 24);
  // the limb
  const bark = ctx.createLinearGradient(0, GROUND, 0, GROUND + BOUGH_H);
  bark.addColorStop(0, '#a07a5e');
  bark.addColorStop(0.4, '#8a664e');
  bark.addColorStop(1, '#5e4434');
  ctx.fillStyle = bark;
  ctx.beginPath();
  ctx.moveTo(L, GROUND);
  ctx.lineTo(R, GROUND);
  for (let x = R; x >= L - 40; x -= 40) ctx.lineTo(x, GROUND + BOUGH_H + Math.sin(x * 0.011) * 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,40,30,0.4)';
  ctx.lineWidth = 2;
  for (const dy of [16, 30, 42]) {
    ctx.beginPath();
    for (let x = L - (L % 30); x <= R + 30; x += 30) {
      const y = GROUND + dy + Math.sin(x * 0.02 + dy) * 3;
      x === L - (L % 30) ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // planks laid along the bough round the camp
  const p0 = Math.max(L, 0), p1 = Math.min(R, 960);
  for (let x = p0 - (p0 % 22); x < p1; x += 22) {
    ctx.fillStyle = (x / 22) % 2 ? '#d8b088' : '#caa078';
    ctx.strokeStyle = '#8a6a4a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 1, GROUND - 1, 20, 8, 2);
    ctx.fill();
    ctx.stroke();
  }
  // moss and little ferns along the top
  ctx.fillStyle = '#86b46a';
  for (let x = L - (L % 38); x < R; x += 38) if (x > 960) ellipse(ctx, x + 14, GROUND + 1, 17, 4);
  for (const t of tufts) {
    if (t.x < L - 10 || t.x > R + 10 || t.x < 980) continue;
    ctx.fillStyle = t.c;
    for (const d of [-4, 0, 4]) ellipse(ctx, t.x + d * t.s, GROUND - 4 * t.s, 2.4 * t.s, 6 * t.s, d * 0.12);
    if (t.flower) {
      ctx.fillStyle = '#ffe6f0';
      circle(ctx, t.x, GROUND - 10 * t.s, 2.6);
    }
  }
  void time;
}

// The way down: the top of the rope ladder, tied round a stump of a branch, dropping off the bough's edge
function drawLadderDown(ctx, time) {
  const x = CANOPY_EXIT_X, sway = Math.sin(time * 0.9) * 2;
  ctx.fillStyle = '#7a5a40';
  ctx.beginPath();
  ctx.roundRect(x - 34, GROUND - 46, 14, 48, 4);
  ctx.fill();
  ctx.strokeStyle = '#e2c890';
  ctx.lineWidth = 2.4;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x - 27, GROUND - 36);
    ctx.quadraticCurveTo(x + side * 13, GROUND - 20, x + side * 13, GROUND + 4);
    ctx.lineTo(x + side * 13 + sway, H + 10);
    ctx.stroke();
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ecd2a4';
  ctx.lineWidth = 3.6;
  for (let y = GROUND + 22; y < H; y += 30) {
    const s = sway * ((y - GROUND) / (H - GROUND));
    ctx.beginPath();
    ctx.moveTo(x - 13 + s, y);
    ctx.lineTo(x + 13 + s, y);
    ctx.stroke();
  }
  // a gap cut in the bough's planks where it goes over
  ctx.fillStyle = '#3e5e40';
  ctx.beginPath();
  ctx.roundRect(x - 18, GROUND + 4, 36, 10, 3);
  ctx.fill();
}

function drawZoneSign(ctx, x, z, i, time) {
  const board = ['#7aa860', '#6a8a70', '#c8963a'][i - 1] ?? '#7aa860', edge = ['#4a7a38', '#3e5e48', '#8a5e18'][i - 1] ?? '#4a7a38';
  ctx.fillStyle = '#7a5a40';
  ctx.beginPath();
  ctx.roundRect(x - 4, GROUND - 92, 8, 94, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 70);
  ctx.rotate(Math.sin(time * 1.1 + i) * 0.02);
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(120, ctx.measureText(z.name).width + 28);
  ctx.fillStyle = board;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -24, tw, 46, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -9, 15, '#ffffff');
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.roundRect(-30, 2, 60, 15, 7.5);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 10, 11, edge);
  // an acorn perched on the board
  ctx.fillStyle = '#d8a050';
  ellipse(ctx, tw / 2 - 14, -26, 5, 6);
  ctx.fillStyle = '#8a6040';
  ctx.beginPath();
  ctx.arc(tw / 2 - 14, -28, 5.5, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

// The way back down to Bramble Woods
function drawExitSign(ctx, x, time) {
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(x - 3, GROUND - 92, 6, 92);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.2) * 0.02);
  ctx.fillStyle = '#e2bf8f';
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(56, -12);
  ctx.lineTo(-50, -12);
  ctx.lineTo(-62, 0);
  ctx.lineTo(-50, 12);
  ctx.lineTo(56, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Down to the Woods', -2, 1, 11, INK);
  ctx.restore();
}

// Leaves drifting down past everything (screen space, so they're everywhere you look)
function drawFallingLeaves(ctx, camX, time) {
  ctx.save();
  for (const l of leavesFall) {
    const y = ((l.y + time * l.v) % (H + 40)) - 20;
    const x = ((l.x - camX * 0.4 + Math.sin(time * 0.8 + l.p) * l.sw) % W + W) % W;
    ctx.fillStyle = l.c;
    ctx.globalAlpha = 0.85;
    ellipse(ctx, x, y, l.s * 1.6, l.s * 0.8, time * 1.5 + l.p);
  }
  ctx.restore();
}
