// Docs: docs/art.md, docs/places/harbour.md
// The other islands, far off in every outdoor sky. story/world/geography.md: "every outdoor sky draws the
// others in their compass direction, small and far off. That's what makes the world feel big."
// Each island's view faces the middle of the Glass Sea (the Maelstrom, where the Citadel circles), so from
// home Frostpeak sits on the left (north), Emberdeep's smoke on the right (south) and the Citadel hangs
// high in the middle. Drawn in screen space, after a room's sky and before its own hills and mountains.
import { W, TAU, circle, mix } from './util.js';

// For each island you can stand on: the compass bearing its view faces, and the bearing (degrees,
// 0 = north, clockwise) and distance (1 = far, bigger = nearer) of every other island's landmark.
const VIEWS = {
  green: { face: 90, sees: { frost: [40, 1], citadel: [92, 1], ember: [140, 1] } },
  frost: { face: 180, sees: { citadel: [165, 1], ember: [190, 0.8], green: [240, 0.9] } },
  ember: { face: 0, sees: { frost: [335, 0.8], citadel: [345, 1.1], green: [300, 0.9] } },
  citadel: { face: 270, sees: { green: [270, 0.9], frost: [0, 0.9], ember: [180, 0.9] } },
};
const PX_PER_DEG = 4.4; // how wide the panorama is
const PAN = 160; // walking from one end of a room to the other turns the panorama this many px

// o: { from (an island key above), scroll (camera x), roomW, time, horizon (the sea line's screen y),
// haze (the sky colour near the horizon: far things fade into it), fade (0..1, how much), scale, night (0..1),
// sky (how high the Citadel floats above the horizon, px) }
export function drawDistantIslands(ctx, o) {
  const view = VIEWS[o.from];
  if (!view) return;
  const pan = -((o.scroll + W / 2) / o.roomW - 0.5) * PAN;
  const scale = o.scale ?? 1, fade = o.fade ?? 0.5, haze = o.haze ?? '#f0faff';
  const tint = (c, more = 0) => mix(c, haze, Math.min(1, fade + more));
  for (const [key, [bearing, near]] of Object.entries(view.sees)) {
    let rel = (((bearing - view.face) % 360) + 540) % 360 - 180; // -180..180, negative = to the left
    const x = W / 2 + rel * PX_PER_DEG + pan, s = scale * near;
    if (x < -260 || x > W + 260) continue;
    const draw = { frost: drawFrostpeak, ember: drawEmberdeep, citadel: drawCitadel, green: drawGreenhollow }[key];
    draw(ctx, x, o.horizon, s, o, tint);
  }
}

// Frostpeak: a cluster of snowy peaks under the aurora (its landmark), faint by day
function drawFrostpeak(ctx, x, y, s, o, tint) {
  const t = o.time, night = o.night ?? 0;
  ctx.save();
  ctx.globalAlpha = (0.22 + 0.4 * night) * Math.min(1, s);
  for (const [c, dy, ph] of [['#8fffd0', 0, 0], ['#c4a0ff', 14, 2], ['#9fd8ff', -10, 4]]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    const y0 = y - 150 * s + dy;
    for (let i = 0; i <= 12; i++) {
      const px = x - 120 * s + i * 20 * s;
      const py = y0 + Math.sin(i * 0.7 + t * 0.4 + ph) * 10 * s;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    for (let i = 12; i >= 0; i--) {
      const px = x - 120 * s + i * 20 * s;
      ctx.lineTo(px, y0 + 22 * s + Math.sin(i * 0.7 + t * 0.4 + ph + 0.8) * 8 * s);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  const rock = tint('#8ea4cc'), snow = tint('#ffffff', -0.1);
  for (const [dx, h, w] of [[-46, 62, 70], [0, 100, 92], [44, 74, 76], [80, 40, 56]]) {
    const px = x + dx * s, ph = h * s, hw = (w * s) / 2;
    ctx.fillStyle = rock;
    ctx.beginPath();
    ctx.moveTo(px - hw, y);
    ctx.lineTo(px - hw * 0.12, y - ph + 3 * s);
    ctx.quadraticCurveTo(px, y - ph - 2 * s, px + hw * 0.12, y - ph + 3 * s);
    ctx.lineTo(px + hw, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = snow;
    ctx.beginPath();
    ctx.moveTo(px - hw * 0.12, y - ph + 3 * s);
    ctx.quadraticCurveTo(px, y - ph - 2 * s, px + hw * 0.12, y - ph + 3 * s);
    ctx.lineTo(px + hw * 0.42, y - ph * 0.58);
    ctx.quadraticCurveTo(px + hw * 0.15, y - ph * 0.64, px, y - ph * 0.56);
    ctx.quadraticCurveTo(px - hw * 0.18, y - ph * 0.64, px - hw * 0.42, y - ph * 0.58);
    ctx.closePath();
    ctx.fill();
  }
}

// Emberdeep: a dark volcano island with a glowing mouth and its smoke column (its landmark), leaning
// with the wind and rising out of the top of the view
function drawEmberdeep(ctx, x, y, s, o, tint) {
  const t = o.time;
  ctx.fillStyle = tint('#c9a6b0', 0.05);
  for (let i = 0; i < 14; i++) {
    const k = ((i / 14 + t * 0.012) % 1), r = (10 + k * 46) * s;
    ctx.globalAlpha = 0.75 * (1 - k * 0.7);
    circle(ctx, x + (k * k * 120 - 6 + Math.sin(i * 1.9 + t * 0.3) * 6) * s, y - (60 + k * 330) * s, r);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = tint('#ff9a5a', -0.15);
  ctx.globalAlpha = 0.5 + 0.15 * Math.sin(t * 1.3);
  circle(ctx, x, y - 58 * s, 16 * s);
  ctx.globalAlpha = 1;
  ctx.fillStyle = tint('#7a5a6e');
  ctx.beginPath();
  ctx.moveTo(x - 110 * s, y);
  ctx.quadraticCurveTo(x - 50 * s, y - 20 * s, x - 16 * s, y - 58 * s);
  ctx.lineTo(x + 16 * s, y - 58 * s);
  ctx.quadraticCurveTo(x + 50 * s, y - 20 * s, x + 110 * s, y);
  ctx.closePath();
  ctx.fill();
}

// The Aether Citadel: a pale island hanging in the sky with towers on top and rock trailing below,
// drifting slowly round the Maelstrom
function drawCitadel(ctx, x, y, s, o, tint) {
  const t = o.time, cx = x + Math.sin(t * 0.02) * 24 * s, cy = y - (o.sky ?? 200) * s + Math.sin(t * 0.5) * 4 * s;
  ctx.fillStyle = tint('#c9c2e8', 0.05);
  ctx.beginPath();
  ctx.moveTo(cx - 52 * s, cy);
  ctx.quadraticCurveTo(cx - 30 * s, cy + 22 * s, cx - 8 * s, cy + 52 * s);
  ctx.lineTo(cx, cy + 62 * s);
  ctx.lineTo(cx + 10 * s, cy + 44 * s);
  ctx.quadraticCurveTo(cx + 34 * s, cy + 20 * s, cx + 52 * s, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tint('#e4def8', 0.05);
  for (const [dx, h, w] of [[-30, 18, 10], [-14, 34, 9], [2, 52, 11], [18, 28, 9], [34, 14, 10]]) {
    ctx.beginPath();
    ctx.roundRect(cx + (dx - w / 2) * s, cy - h * s, w * s, h * s + 1, [3 * s, 3 * s, 0, 0]);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(cx, cy, 54 * s, 6 * s, 0, 0, TAU);
  ctx.fill();
  // a faint ring of light round the spire: the clock it keeps
  ctx.strokeStyle = tint('#fff4c8', -0.1);
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.arc(cx + 2 * s, cy - 58 * s, 6 * s, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Greenhollow, seen from away: a low green island with the great apple tree on its back and a little
// lighthouse at the west end
function drawGreenhollow(ctx, x, y, s, o, tint) {
  ctx.fillStyle = tint('#8cc9a0');
  ctx.beginPath();
  ctx.moveTo(x - 100 * s, y);
  ctx.quadraticCurveTo(x - 70 * s, y - 34 * s, x - 10 * s, y - 36 * s);
  ctx.quadraticCurveTo(x + 50 * s, y - 40 * s, x + 80 * s, y - 22 * s);
  ctx.quadraticCurveTo(x + 96 * s, y - 12 * s, x + 104 * s, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tint('#6aaa7e');
  circle(ctx, x - 10 * s, y - 50 * s, 15 * s);
  circle(ctx, x + 2 * s, y - 56 * s, 13 * s);
  ctx.fillStyle = tint('#f4eee4');
  ctx.fillRect(x - 86 * s, y - 34 * s, 5 * s, 22 * s);
}
