// Docs: docs/places/branches.md
// The blocked ways into Greenhollow's unshipped branches (GATES in src/shared/branches.js), drawn behind the
// slimes: a root-choked stump, a rotten rope ladder, a wall of thorns, Wreck Cave's flooded mouth (in
// Saltspray Coves). Each has a little wooden sign naming the place it leads to (red-trimmed for a hard
// pocket). Shipped branches keep their spot as an open way in (ENTRIES: drawEntries): Willowmere's
// footbridge, mended with new planks, and the shore path to the Coves, its rockfall rolled aside.
// Feet on the ground at (g.x, ground).
import { TAU, mulberry32, ellipse, clamp } from './util.js';
import { GATES, ENTRIES } from './shared/branches.js';

const INK = '#5b4a6b';
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";

export function drawGates(ctx, room, ground, L, R, time, near) {
  for (const g of GATES) {
    if (g.room !== room || g.x + 160 < L || g.x - 160 > R) continue;
    ctx.save();
    ctx.translate(g.x, ground);
    ctx.save();
    ctx.scale(SCALE[g.kind] ?? 1, SCALE[g.kind] ?? 1);
    DRAW[g.kind](ctx, time, g);
    ctx.restore();
    sign(ctx, SIGN_AT[g.kind], g.name, g.hard, near === g);
    ctx.restore();
  }
}

// A shipped branch's way in, where its gate used to be (its door is in ROOMS: sim.js)
export function drawEntries(ctx, room, ground, L, R, time) {
  for (const g of ENTRIES) {
    if (g.room !== room || g.x + 160 < L || g.x - 160 > R) continue;
    ctx.save();
    ctx.translate(g.x, ground);
    ctx.save();
    ctx.scale(SCALE[g.kind] ?? 1, SCALE[g.kind] ?? 1);
    OPEN[g.kind](ctx, time, g);
    ctx.restore();
    sign(ctx, SIGN_AT[g.kind], g.name, false, false);
    ctx.restore();
  }
}

// where each gate's sign stands, relative to the gate, and how big its art is drawn
const SIGN_AT = { bridge: -130, stump: -100, ladder: 78, thorns: -128, shore: 104, flooded: 110 };
const SCALE = { bridge: 1.5, thorns: 1.15 };

// A little wooden signpost with the place's name; it glows a touch when you're close enough to look
function sign(ctx, x, name, hard, lit) {
  ctx.save();
  ctx.translate(x, 0);
  ctx.font = `700 11px ${FONT}`;
  const w = ctx.measureText(name).width + 18, top = -78;
  ctx.fillStyle = '#8f6240';
  ctx.fillRect(-3, top + 8, 6, -top - 8);
  if (lit) {
    ctx.fillStyle = 'rgba(255,240,190,0.5)';
    ctx.beginPath();
    ctx.roundRect(-w / 2 - 5, top - 14, w + 10, 30, 10);
    ctx.fill();
  }
  ctx.fillStyle = '#e2bf8f';
  ctx.strokeStyle = hard ? '#c8445f' : '#8f6240';
  ctx.lineWidth = hard ? 2.6 : 2;
  ctx.beginPath();
  ctx.roundRect(-w / 2, top - 9, w, 20, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hard ? '#a8324c' : INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 0, top + 1.5);
  ctx.restore();
}

// Willowmere: a little brook runs off north under a wooden footbridge. Washed out, its middle is gone;
// mended (the branch is open), new pale planks fill the gap.
function drawBridge(ctx, time, g, mended = false) {
  // the brook, cut into the turf and running off into the trees
  const water = ctx.createLinearGradient(0, -26, 0, 8);
  water.addColorStop(0, '#bfe6f5');
  water.addColorStop(1, '#7cc2e4');
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.moveTo(-58, 6);
  ctx.quadraticCurveTo(-30, -14, -14, -30);
  ctx.lineTo(14, -30);
  ctx.quadraticCurveTo(30, -14, 58, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const k = ((time * 0.35 + i / 4) % 1), y = -28 + k * 32, half = 10 + k * 30;
    ctx.globalAlpha = Math.sin(k * Math.PI);
    ctx.beginPath();
    ctx.moveTo(-half * 0.5, y);
    ctx.quadraticCurveTo(0, y - 2, half * 0.4, y + 1);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // reeds on the banks
  ctx.strokeStyle = '#5fb35a';
  ctx.lineWidth = 2;
  for (const [x, h, lean] of [[-62, 34, -0.15], [-54, 26, 0.1], [56, 30, 0.2], [64, 38, -0.05]]) {
    ctx.beginPath();
    ctx.moveTo(x, 4);
    ctx.quadraticCurveTo(x + lean * 20, -h * 0.6, x + lean * 34, -h);
    ctx.stroke();
    ctx.fillStyle = '#a0784e';
    ellipse(ctx, x + lean * 30, -h + 6, 2.6, 7, lean);
  }
  // the footbridge: two halves still on their posts, the middle gone, a couple of planks hanging
  ctx.lineJoin = 'round';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.fillStyle = '#a77a52';
    ctx.fillRect(48, -40, 7, 42); // post
    ctx.fillStyle = '#c99b6b';
    ctx.strokeStyle = '#8f6240';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(66, -36);
    ctx.quadraticCurveTo(40, -50, 18, -50);
    ctx.lineTo(18, -43);
    ctx.quadraticCurveTo(40, -43, 66, -29);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (let x = 24; x < 64; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, -49 + (x - 18) * 0.24);
      ctx.lineTo(x, -42 + (x - 18) * 0.24);
      ctx.stroke();
    }
    // a hand-rope, sagging into the gap (mended: tied across)
    ctx.strokeStyle = '#b89a6e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(52, -62);
    ctx.quadraticCurveTo(34, -66, 18, -62);
    if (mended) ctx.quadraticCurveTo(8, -60, 0, -61);
    else ctx.quadraticCurveTo(8, -48, 4, -40);
    ctx.stroke();
    ctx.restore();
  }
  if (mended) {
    // the new middle span: fresh pale planks, lashed on
    ctx.fillStyle = '#f0d6a8';
    ctx.strokeStyle = '#b8935e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-20, -50);
    ctx.quadraticCurveTo(0, -53, 20, -50);
    ctx.lineTo(20, -43);
    ctx.quadraticCurveTo(0, -46, -20, -43);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (let x = -14; x <= 14; x += 7) {
      ctx.beginPath();
      ctx.moveTo(x, -52);
      ctx.lineTo(x, -45);
      ctx.stroke();
    }
    ctx.strokeStyle = '#7fb06a'; // a green ribbon tied on the rope: somebody's proud of it
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -61);
    ctx.quadraticCurveTo(-6, -54 + Math.sin(time * 3) * 2, -3, -50);
    ctx.stroke();
    return;
  }
  // dangling planks, swaying
  for (const [x, len, ph] of [[-16, 20, 0], [14, 16, 1.7]]) {
    ctx.save();
    ctx.translate(x, -46);
    ctx.rotate(Math.sin(time * 1.6 + ph) * 0.14 + (x < 0 ? 0.25 : -0.3));
    ctx.fillStyle = '#c99b6b';
    ctx.strokeStyle = '#8f6240';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-3, 0, 6, len, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// Saltspray Coves' old rockfall (G0 blocked the shore path with it; drawShore has it rolled aside)
const ROCKS = (() => {
  const r = mulberry32(611);
  const out = [];
  for (const [x, y, s] of [[-50, 0, 30], [-14, 0, 38], [26, 0, 32], [58, 0, 24], [-34, -38, 26], [6, -50, 30], [40, -36, 24], [-8, -86, 22], [24, -78, 18]]) out.push({ x, y, s, tilt: r() * 0.6 - 0.3, shade: r() });
  return out;
})();
// The Mycelium Deep: a huge hollow stump, the hole in its side choked with roots; the warm threads glow
// faintly through the tangle
function drawStump(ctx, time) {
  ctx.fillStyle = 'rgba(60,40,60,0.18)';
  ellipse(ctx, 0, 2, 86, 9);
  // roots spreading into the ground
  ctx.fillStyle = '#9b7350';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 40, -30);
    ctx.quadraticCurveTo(s * 70, -6, s * 88, 2);
    ctx.lineTo(s * 40, 2);
    ctx.closePath();
    ctx.fill();
  }
  // the trunk
  const bark = ctx.createLinearGradient(-60, 0, 60, 0);
  bark.addColorStop(0, '#8a6444');
  bark.addColorStop(0.5, '#b48a62');
  bark.addColorStop(1, '#8a6444');
  ctx.fillStyle = bark;
  ctx.strokeStyle = '#6e4c33';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-56, 2);
  ctx.lineTo(-52, -104);
  ctx.lineTo(-30, -114);
  ctx.lineTo(-18, -104);
  ctx.lineTo(2, -118);
  ctx.lineTo(18, -106);
  ctx.lineTo(36, -112);
  ctx.lineTo(52, -102);
  ctx.lineTo(56, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(110,76,51,0.5)';
  ctx.lineWidth = 1.5;
  for (const x of [-38, -14, 22, 42]) {
    ctx.beginPath();
    ctx.moveTo(x, -96);
    ctx.quadraticCurveTo(x + 4, -50, x - 2, -6);
    ctx.stroke();
  }
  // moss on the rim
  ctx.fillStyle = '#86c46e';
  for (const [x, y, r] of [[-40, -110, 9], [-6, -110, 8], [28, -108, 10], [48, -100, 7]]) ellipse(ctx, x, y, r, r * 0.55);
  // the hole, dark, with the threads' glow coming up from below
  ctx.fillStyle = '#2f2338';
  ellipse(ctx, 0, -34, 26, 32);
  const glow = 0.5 + Math.sin(time * 1.8) * 0.2;
  const g = ctx.createRadialGradient(0, -14, 2, 0, -24, 30);
  g.addColorStop(0, `rgba(160,240,220,${glow})`);
  g.addColorStop(1, 'rgba(160,240,220,0)');
  ctx.fillStyle = g;
  ellipse(ctx, 0, -34, 26, 32);
  // roots knotted across it
  ctx.strokeStyle = '#7a5537';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const [a, b, c, d] of [[-26, -52, 24, -18], [-24, -14, 26, -50], [-20, -36, 22, -34], [-6, -64, 8, -4]]) {
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.quadraticCurveTo(0, (b + d) / 2 + 8, c, d);
    ctx.stroke();
  }
  ctx.strokeStyle = '#9b7350';
  ctx.lineWidth = 2;
  for (const [a, b, c, d] of [[-22, -44, 18, -24], [-14, -20, 20, -46]]) {
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.quadraticCurveTo(0, (b + d) / 2 - 6, c, d);
    ctx.stroke();
  }
  // a few glowing specks drifting up out of the tangle
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.25 + i / 4) % 1;
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
    ctx.fillStyle = i % 2 ? '#bff5e4' : '#ffd1ec';
    ctx.beginPath();
    ctx.arc(-10 + i * 7 + Math.sin(time + i) * 4, -20 - k * 50, 1.8, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Old Oak Canopy: a rope ladder hanging out of the treetops beside a giant oak, rungs rotted and
// snapped, the bottom of it lying in a heap
function drawLadder(ctx, time) {
  // the oak, running up off the top of the screen
  const bark = ctx.createLinearGradient(-110, 0, -20, 0);
  bark.addColorStop(0, '#6e5040');
  bark.addColorStop(0.55, '#94705a');
  bark.addColorStop(1, '#6e5040');
  ctx.fillStyle = bark;
  ctx.beginPath();
  ctx.moveTo(-112, 2);
  ctx.quadraticCurveTo(-96, -20, -94, -60);
  ctx.lineTo(-90, -460);
  ctx.lineTo(-30, -460);
  ctx.lineTo(-34, -60);
  ctx.quadraticCurveTo(-30, -18, -12, 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(70,48,38,0.45)';
  ctx.lineWidth = 2;
  for (const x of [-78, -60, -44]) {
    ctx.beginPath();
    ctx.moveTo(x, -440);
    ctx.quadraticCurveTo(x - 4, -220, x + 2, -20);
    ctx.stroke();
  }
  // the ladder: two ropes down from above, swaying a little, rungs every so often (some gone, some
  // hanging by one end), and it ends well above a slime's reach
  const sway = Math.sin(time * 0.9) * 4;
  const ropeX = (side, y) => side * 13 + sway * ((-y) / 460);
  ctx.strokeStyle = '#b89a6e';
  ctx.lineWidth = 2.2;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(ropeX(side, -460), -460);
    ctx.lineTo(ropeX(side, -150), side < 0 ? -150 : -128);
    ctx.stroke();
  }
  ctx.lineCap = 'round';
  for (let y = -440, i = 0; y < -150; y += 30, i++) {
    if (i % 4 === 2) continue; // a missing rung
    const broken = i % 3 === 1;
    ctx.strokeStyle = broken ? '#9b7a56' : '#c99b6b';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(ropeX(-1, y), y);
    if (broken) ctx.lineTo(ropeX(-1, y) + 9, y + 15); // snapped: hangs from one rope
    else ctx.lineTo(ropeX(1, y), y);
    ctx.stroke();
  }
  // frayed rope ends
  ctx.strokeStyle = '#b89a6e';
  ctx.lineWidth = 1.2;
  for (const [x, y] of [[ropeX(-1, -150), -150], [ropeX(1, -128), -128]]) {
    for (const d of [-3, 0, 3]) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + d, y + 7);
      ctx.stroke();
    }
  }
  // the fallen bottom of it, in a heap with broken rungs
  ctx.strokeStyle = '#b89a6e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(10, -6, 26, 6, 0, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(16, -10, 18, 5, 0.1, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#9b7a56';
  ctx.lineWidth = 3.4;
  for (const [x, y, a] of [[-6, -4, 0.3], [20, -12, -0.5], [34, -3, 0.1]]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14);
    ctx.stroke();
  }
}

// The Thornheart: the briar closes into a solid wall, dark and thick with thorns; something stirs deep in it
function drawThorns(ctx, time) {
  const r = mulberry32(4920);
  ctx.fillStyle = 'rgba(40,20,40,0.22)';
  ellipse(ctx, 0, 2, 100, 10);
  // dark depth behind the canes
  const g = ctx.createRadialGradient(0, -90, 10, 0, -90, 110);
  g.addColorStop(0, '#3a1f36');
  g.addColorStop(1, 'rgba(58,31,54,0)');
  ctx.fillStyle = g;
  ellipse(ctx, 0, -90, 100, 100);
  // canes, arching over each other
  ctx.lineCap = 'round';
  ctx.fillStyle = '#4a2c42'; // the thicket's dark mass at the foot of the canes
  ellipse(ctx, 0, -26, 100, 34);
  for (let i = 0; i < 26; i++) {
    const x0 = -96 + r() * 192, h = 90 + r() * 120, lean = (r() - 0.5) * 120, w = 5 + r() * 4;
    const dark = r() > 0.5;
    ctx.strokeStyle = dark ? '#5e3a50' : '#7a4c62';
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x0, 2);
    ctx.quadraticCurveTo(x0 + lean * 0.3, -h, x0 + lean, -h * 0.5);
    ctx.stroke();
    // thorns along it
    ctx.fillStyle = '#e9c6d4';
    for (let k = 0.2; k < 0.95; k += 0.18) {
      const t = k, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (x0 + lean * 0.3) + t * t * (x0 + lean);
      const y = (1 - t) * (1 - t) * 2 + 2 * (1 - t) * t * -h + t * t * (-h * 0.5);
      const side = (k * 10) % 2 > 1 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(x - 2.5, y);
      ctx.lineTo(x + 2.5, y);
      ctx.lineTo(x + side * 1.5, y - 7 * side);
      ctx.closePath();
      ctx.fill();
    }
  }
  // two eyes blinking deep in the briar, now and then
  const open = clamp(Math.sin(time * 0.7) * 6 - 4.5, 0, 1);
  if (open > 0) {
    ctx.fillStyle = `rgba(255,170,190,${0.8 * open})`;
    ellipse(ctx, -10, -96, 3.4, 2.2 * open);
    ellipse(ctx, 10, -96, 3.4, 2.2 * open);
  }
}

// Saltspray Coves, open: the rockfall's boulders rolled to either side of the shore path, the path swept,
// and a row of shells someone laid along it
function drawShore(ctx) {
  ctx.fillStyle = 'rgba(60,50,70,0.12)';
  ellipse(ctx, 0, 2, 110, 8);
  ctx.fillStyle = '#e8dcc4'; // the swept sandy path
  ellipse(ctx, 0, 1, 70, 6);
  for (const k of ROCKS.slice(0, 6)) {
    const x = k.x < 4 ? k.x - 70 : k.x + 64, s = k.s * 0.8, y = k.y * 0.4;
    ctx.fillStyle = k.shade > 0.5 ? '#c9bfb2' : '#b8ad9f';
    ctx.strokeStyle = '#8c8072';
    ctx.lineWidth = 2;
    ellipse(ctx, x, y - s * 0.75, s, s * 0.8, k.tilt);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipse(ctx, x - s * 0.35, y - s * 1.1, s * 0.3, s * 0.18, -0.4);
  }
  for (let i = 0; i < 7; i++) {
    const x = -42 + i * 14;
    ctx.fillStyle = i % 2 ? '#ffd6c9' : '#fff1e0';
    ctx.strokeStyle = '#d8a898';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 4, 0);
    ctx.quadraticCurveTo(x, -8, x + 4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

// Wreck Cave: a sea-cave mouth in the cliff at the Coves' far end, flooded to the roof: dark water fills
// the arch, a broken timber pokes out, and the swell heaves in and out
function drawFlooded(ctx, time) {
  ctx.fillStyle = '#8f8a96'; // the cliff around the mouth
  ctx.beginPath();
  ctx.moveTo(-120, 4);
  ctx.quadraticCurveTo(-128, -150, -60, -200);
  ctx.quadraticCurveTo(10, -230, 80, -190);
  ctx.quadraticCurveTo(130, -140, 118, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a6a0ab';
  ellipse(ctx, -70, -150, 26, 50, 0.2);
  ellipse(ctx, 74, -120, 18, 44, -0.2);
  // the arch, full of water to the top
  const swell = Math.sin(time * 1.1) * 4;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-66, 4);
  ctx.lineTo(-66, -70);
  ctx.quadraticCurveTo(-60, -132, 0, -136);
  ctx.quadraticCurveTo(60, -132, 66, -70);
  ctx.lineTo(66, 4);
  ctx.closePath();
  ctx.clip();
  const w = ctx.createLinearGradient(0, -140, 0, 4);
  w.addColorStop(0, '#2e5a78');
  w.addColorStop(1, '#16314a');
  ctx.fillStyle = w;
  ctx.fillRect(-70, -140, 140, 150);
  ctx.strokeStyle = 'rgba(190,230,255,0.4)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 6; i++) {
    const y = -122 + i * 22 + swell;
    ctx.beginPath();
    ctx.moveTo(-60, y);
    ctx.quadraticCurveTo(-30, y - 4 + Math.sin(time * 2 + i) * 2, 0, y);
    ctx.quadraticCurveTo(30, y + 4, 60, y);
    ctx.stroke();
  }
  ctx.restore();
  // the rim of the swell slopping at the roof
  ctx.fillStyle = 'rgba(220,240,255,0.7)';
  for (let i = 0; i < 5; i++) ellipse(ctx, -40 + i * 20, -128 + swell + Math.sin(time * 3 + i) * 2, 7, 2.5);
  // a ship's timber poking out of the water, and a lost lantern bobbing
  ctx.save();
  ctx.translate(34, -40 + swell * 0.6);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#6a4a38';
  ctx.strokeStyle = '#3e2a20';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-6, -40, 12, 60, 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,220,140,0.25)';
  ellipse(ctx, -24, -60 + swell, 14, 14);
  ctx.fillStyle = '#c99a4a';
  ctx.beginPath();
  ctx.roundRect(-30, -68 + swell, 12, 14, 3);
  ctx.fill();
  // rocks at the foot
  ctx.fillStyle = '#7a7480';
  for (const [x, s] of [[-80, 16], [-62, 10], [76, 14], [94, 9]]) ellipse(ctx, x, -s * 0.5, s, s * 0.7);
}

const DRAW = { bridge: drawBridge, stump: drawStump, ladder: drawLadder, thorns: drawThorns, flooded: drawFlooded };
const OPEN = { bridge: (ctx, time, g) => drawBridge(ctx, time, g, true), shore: drawShore };
