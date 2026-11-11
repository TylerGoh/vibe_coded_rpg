// Docs: docs/places/shallows.md
// The Shallows (room SHALLOWS, src/shared/rpg.js; atlas Phase 8, L0): Lantern Fen's first wilds, east off Wickmere's
// boardwalk. Knee-deep still water over peat, reed beds, lily pads and stretches of old boardwalk still up on their
// posts. West to east: the Landing Stage (the boardwalk's last boards, a waystone; no mobs), the Reedbeds, the Lily
// Flats, the Sunken Boardwalk; at the far end the Grove path, under water to the rails (a gate: src/branch-gates.js),
// and off the Reedbeds the side path to Firefly Hollow, a fallen willow across it (a gate). The drowned signpost (last in
// SHALLOWS_PLATFORMS, high up off the high boardwalk) is the find: its arms point at every island the fen folk know.
// The sky and the mere are Wickmere's (drawFenSky, drawFenAir: src/wickmere.js). The platforms are SHALLOWS_PLATFORMS.
import { H, TAU, mulberry32, circle, ellipse } from './util.js';
import { SHALLOWS_W, FIELD_GROUND, SHALLOWS_PLATFORMS, SHALLOWS_ZONES } from './shared/rpg.js';
import { drawFenSky, drawFenAir } from './wickmere.js';

const GROUND = FIELD_GROUND;
const STAGE_END = SHALLOWS_ZONES[0].x1; // the Landing Stage's boards end here
const LILY = SHALLOWS_ZONES[2], SUNK = SHALLOWS_ZONES[3];
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const SIGN = SHALLOWS_PLATFORMS.find((p) => p.kind === 'signpost');

function text(ctx, str, x, y, size, color, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, 0, 0);
  ctx.restore();
}

// seeded scenery along the room
const clumps = (() => {
  const r = mulberry32(731);
  return Array.from({ length: 70 }, () => ({ x: STAGE_END + r() * (SHALLOWS_W - STAGE_END), h: 50 + r() * 70, n: 4 + Math.floor(r() * 6), back: r() < 0.6 }));
})();
const pads = (() => {
  const r = mulberry32(737);
  return Array.from({ length: 60 }, () => ({ x: LILY.x0 - 200 + r() * (LILY.x1 - LILY.x0 + 600), s: 0.7 + r() * 0.7, a: r() * TAU, bloom: r() < 0.3 }));
})();
const stubs = (() => {
  const r = mulberry32(743);
  return Array.from({ length: 16 }, () => ({ x: SUNK.x0 + r() * (SUNK.x1 - SUNK.x0 - 300), h: 20 + r() * 50, lean: (r() - 0.5) * 0.4 }));
})();

// Everything in the Shallows behind the slimes
export function drawShallows(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawFenSky(ctx, camX, time, SHALLOWS_W);
  ctx.restore();
  const L = camX - 100, R = camX + viewW + 100;
  for (const c of clumps) if (c.back && visible(c.x - 30, c.x + 30, L, R)) drawReeds(ctx, c, time, true);
  for (const s of stubs) if (visible(s.x - 20, s.x + 20, L, R)) drawStub(ctx, s);
  drawWater(ctx, Math.max(0, L), Math.min(SHALLOWS_W, R), time);
  if (visible(0, STAGE_END + 40, L, R)) drawStage(ctx, Math.max(0, L), Math.min(STAGE_END, R));
  for (const p of SHALLOWS_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'tussock') drawTussock(ctx, p, time);
    else if (p.kind === 'boardwalk') drawOldBoardwalk(ctx, p);
  }
  if (visible(SIGN.x - 120, SIGN.x + SIGN.w + 120, L, R)) drawSignpost(ctx, time);
  for (const pd of pads) if (visible(pd.x - 20, pd.x + 20, L, R)) drawPad(ctx, pd, time);
  for (const c of clumps) if (!c.back && visible(c.x - 30, c.x + 30, L, R)) drawReeds(ctx, c, time, false);
  ctx.save();
  ctx.translate(camX, 0);
  drawFenAir(ctx, camX, time);
  ctx.restore();
}

// The shallows themselves: a skin of still dark water over peat, the walking line where your feet go in
function drawWater(ctx, L, R, time) {
  if (R <= L) return;
  ctx.fillStyle = '#2e2838'; // peat, under everything
  ctx.fillRect(L, GROUND + 6, R - L, H - GROUND);
  const g = ctx.createLinearGradient(0, GROUND - 6, 0, GROUND + 50);
  g.addColorStop(0, 'rgba(110,98,140,0.85)');
  g.addColorStop(1, 'rgba(46,40,60,0.95)');
  ctx.fillStyle = g;
  ctx.fillRect(L, GROUND - 4, R - L, 54);
  ctx.fillStyle = 'rgba(214,204,232,0.35)'; // the surface line, with slow ripples
  ctx.beginPath();
  ctx.moveTo(L, GROUND - 4);
  for (let x = Math.floor(L / 20) * 20; x <= R + 20; x += 20) ctx.lineTo(x, GROUND - 4 + Math.sin(x * 0.04 + time * 1.2) * 1.2);
  ctx.lineTo(R, GROUND - 1);
  ctx.lineTo(L, GROUND - 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(214,204,232,0.12)';
  for (let x = Math.floor(L / 110) * 110; x < R; x += 110) {
    ctx.beginPath();
    ctx.roundRect(x + Math.sin(time * 0.7 + x) * 12, GROUND + 18 + (x % 4) * 7, 50, 2, 1);
    ctx.fill();
  }
}

// The Landing Stage: the last boards of Wickmere's boardwalk, on posts, ending in the water
function drawStage(ctx, L, R) {
  ctx.fillStyle = '#5a5070';
  ctx.fillRect(L, GROUND - 2, R - L, 14);
  ctx.fillStyle = '#7a6e8a';
  ctx.fillRect(L, GROUND - 4, R - L, 4);
  ctx.strokeStyle = 'rgba(46,42,58,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.floor(L / 34) * 34; x < R; x += 34) {
    ctx.moveTo(x, GROUND);
    ctx.lineTo(x, GROUND + 12);
  }
  ctx.stroke();
  for (let x = Math.floor(L / 120) * 120 + 20; x < R; x += 120) {
    ctx.fillStyle = '#3e3650';
    ctx.fillRect(x - 5, GROUND + 12, 10, H - GROUND - 12);
  }
  if (R >= STAGE_END - 10) { // its broken end, a lantern on the last post
    ctx.fillStyle = '#4a4058';
    ctx.fillRect(STAGE_END - 8, GROUND - 60, 7, 60);
    ctx.fillStyle = 'rgba(255,214,150,0.3)';
    circle(ctx, STAGE_END - 4, GROUND - 66, 13);
    ctx.fillStyle = '#ffe2a8';
    ctx.fillRect(STAGE_END - 7, GROUND - 72, 6, 9);
  }
}

// A clump of reeds and bulrushes, swaying (back ones dimmer, behind the water line; front ones in front of it)
function drawReeds(ctx, c, time, back) {
  ctx.save();
  ctx.lineWidth = back ? 1.6 : 2.2;
  for (let i = 0; i < c.n; i++) {
    const x = c.x + (i - c.n / 2) * 5, hh = c.h * (0.7 + ((i * 37) % 10) / 30) * (back ? 1 : 0.6), lean = Math.sin(time * 0.7 + c.x * 0.01 + i) * 3;
    ctx.strokeStyle = back ? (i % 2 ? '#4e5a48' : '#5a6650') : i % 2 ? '#6a7a50' : '#7a8a58';
    ctx.beginPath();
    ctx.moveTo(x, GROUND + (back ? -2 : 6));
    ctx.quadraticCurveTo(x + lean * 0.5, GROUND - hh * 0.5, x + lean, GROUND - hh);
    ctx.stroke();
    if (i % 3 === 0) {
      ctx.fillStyle = back ? '#4a3a2c' : '#6a4a32';
      ellipse(ctx, x + lean, GROUND - hh - 5, 2.6, 7);
    }
  }
  ctx.restore();
}

// A tussock: a hump of peat and reed roots standing up out of the water, flat-topped (the platform), reeds on top
function drawTussock(ctx, p, time) {
  const x = p.x, w = p.w, y = p.y;
  ctx.fillStyle = '#4a3c30';
  ctx.beginPath();
  ctx.moveTo(x - 10, GROUND);
  ctx.quadraticCurveTo(x - 6, y + 20, x + 10, y);
  ctx.lineTo(x + w - 10, y);
  ctx.quadraticCurveTo(x + w + 6, y + 20, x + w + 10, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5e4c3a';
  ctx.fillRect(x + 6, y, w - 12, 8);
  ctx.strokeStyle = 'rgba(30,22,16,0.4)'; // root threads in the peat
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const rx = x + 14 + i * (w - 28) / 5;
    ctx.moveTo(rx, y + 10);
    ctx.quadraticCurveTo(rx + 6, y + 40, rx - 4, GROUND - 10);
  }
  ctx.stroke();
  ctx.lineWidth = 1.8; // grass on its top edge
  for (let i = 0; i < w / 7; i++) {
    const gx = x + 8 + i * 7, lean = Math.sin(time * 0.9 + gx) * 2;
    ctx.strokeStyle = i % 2 ? '#7a8a58' : '#8a9a62';
    ctx.beginPath();
    ctx.moveTo(gx, y + 1);
    ctx.lineTo(gx + lean, y - 8 - (i % 3) * 4);
    ctx.stroke();
  }
}

// A stretch of old boardwalk still up on its posts (the platform), a rail broken off at one end
function drawOldBoardwalk(ctx, p) {
  const x = p.x, w = p.w, y = p.y;
  ctx.fillStyle = '#3e3650';
  for (const px of [x + 12, x + w / 2, x + w - 16]) ctx.fillRect(px - 4, y + 6, 8, GROUND - y - 6);
  ctx.fillStyle = '#6a5e7a';
  ctx.fillRect(x, y, w, 8);
  ctx.strokeStyle = 'rgba(46,42,58,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let xx = x + 30; xx < x + w; xx += 30) {
    ctx.moveTo(xx, y);
    ctx.lineTo(xx, y + 8);
  }
  ctx.stroke();
  ctx.strokeStyle = '#5a5070';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + 4, y - 24);
  ctx.lineTo(x + w * 0.6, y - 24);
  ctx.lineTo(x + w * 0.66, y - 14); // broken
  ctx.moveTo(x + w * 0.3, y);
  ctx.lineTo(x + w * 0.3, y - 24);
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,138,78,0.6)'; // weed hanging off the edge
  for (let xx = x + 10; xx < x + w; xx += 22) ellipse(ctx, xx, y + 12, 2, 6);
}

// The Sunken Boardwalk's posts poking up out of the water where the boards have gone
function drawStub(ctx, s) {
  ctx.save();
  ctx.translate(s.x, GROUND - 2);
  ctx.rotate(s.lean);
  ctx.fillStyle = '#3e3650';
  ctx.fillRect(-4, -s.h, 8, s.h + 4);
  ctx.fillStyle = '#5a5070';
  ctx.fillRect(-5, -s.h, 10, 3);
  ctx.restore();
}

// A lily pad on the water (sometimes with a pale flower)
function drawPad(ctx, pd, time) {
  const y = GROUND - 3 + Math.sin(time * 0.8 + pd.x) * 0.6;
  ctx.fillStyle = '#4e6e52';
  ctx.beginPath();
  ctx.ellipse(pd.x, y, 16 * pd.s, 4.5 * pd.s, 0, pd.a, pd.a + TAU - 0.5);
  ctx.lineTo(pd.x, y);
  ctx.fill();
  if (pd.bloom) {
    ctx.fillStyle = '#f2d8ec';
    for (let i = 0; i < 5; i++) ellipse(ctx, pd.x + Math.cos(i * 1.26) * 3 * pd.s, y - 3 * pd.s + Math.sin(i * 1.26) * 1.4, 2.6 * pd.s, 1.6 * pd.s, i * 1.26);
    ctx.fillStyle = '#ffe28a';
    circle(ctx, pd.x, y - 3 * pd.s, 1.4 * pd.s);
  }
}

// The drowned signpost: a tall post leaning out of the water off the high boardwalk, a plank nailed across its top
// (the platform) and its arms pointing every which way, each with a name burned in: every island the fen folk know of.
// One arm, pointing up, has no name on it at all.
function drawSignpost(ctx, time) {
  const cx = SIGN.x + SIGN.w / 2, top = SIGN.y;
  ctx.fillStyle = '#4a4058';
  ctx.beginPath();
  ctx.moveTo(cx - 6, GROUND);
  ctx.lineTo(cx - 4, top + 6);
  ctx.lineTo(cx + 4, top + 6);
  ctx.lineTo(cx + 8, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6a5e7a'; // the plank on top
  ctx.fillRect(SIGN.x, top, SIGN.w, 7);
  const arm = (y, ang, name) => {
    ctx.save();
    ctx.translate(cx, y);
    ctx.rotate(ang);
    ctx.fillStyle = '#7a6a54';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(70, -7);
    ctx.lineTo(80, 0);
    ctx.lineTo(70, 7);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (name) {
      const tx = cx + Math.cos(ang) * 38, ty = y + Math.sin(ang) * 38;
      text(ctx, name, tx, ty, 8, '#ece2cc', Math.abs(ang) > Math.PI / 2 ? ang + Math.PI : ang);
    }
  };
  arm(top + 30, Math.PI + 0.1, 'GREENHOLLOW');
  arm(top + 54, -0.15, 'EMBERDEEP');
  arm(top + 78, Math.PI - 0.25, 'FROSTPEAK');
  arm(top + 22, -Math.PI / 2 + 0.2, ''); // (up: no name)
  ctx.fillStyle = 'rgba(110,138,78,0.7)'; // weed where the water's been up to
  ctx.fillRect(cx - 7, GROUND - 60, 15, 6);
  const w = Math.sin(time * 1.4) * 2; // a lantern moth resting on top, sometimes
  ctx.fillStyle = 'rgba(255,214,150,0.25)';
  circle(ctx, SIGN.x + SIGN.w - 12, top - 8 + w, 10);
}
