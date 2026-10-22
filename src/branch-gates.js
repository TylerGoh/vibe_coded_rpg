// Docs: docs/places/branches.md
// The blocked ways into Greenhollow's unshipped branches (GATES in src/shared/branches.js), drawn behind the
// slimes: a root-choked stump, a rotten rope ladder, a wall of thorns, Wreck Cave's flooded mouth (in
// Saltspray Coves). Each has a little wooden sign naming the place it leads to (red-trimmed for a hard
// pocket). Shipped branches keep their spot as an open way in (ENTRIES: drawEntries): Willowmere's
// footbridge, mended with new planks, the shore path to the Coves, its rockfall rolled aside, the hollow
// stump into the Mycelium Deep, its roots cut back, the glowing crack down into Glowroot Hollow, and the
// Old Oak Canopy's rope ladder, restrung. The Canopy has Keeper's Spine's gate: a fallen trunk.
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
    sign(ctx, SIGN_AT[g.kind], g.name, g.hard, false);
    ctx.restore();
  }
}

// where each gate's sign stands, relative to the gate, and how big its art is drawn
const SIGN_AT = { bridge: -130, stump: -100, ladder: 78, thorns: -128, shore: 104, flooded: 110, crack: -120, trunk: -170 };
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
function drawStump(ctx, time, gate, open = false) {
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
  if (open) return drawStumpOpen(ctx, time);
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

// The Mycelium Deep, open: the roots in the hole cut back (their stubs still show), a rope knotted to a
// stake running down into the glow, and the light coming up stronger now nothing's in the way
function drawStumpOpen(ctx, time) {
  const glow = 0.65 + Math.sin(time * 1.8) * 0.2;
  const g = ctx.createRadialGradient(0, -14, 2, 0, -24, 34);
  g.addColorStop(0, `rgba(170,250,225,${glow})`);
  g.addColorStop(1, 'rgba(170,250,225,0)');
  ctx.fillStyle = g;
  ellipse(ctx, 0, -34, 26, 32);
  ctx.strokeStyle = '#7a5537'; // cut stubs round the rim of the hole
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const [a, b, c, d] of [[-26, -52, -16, -46], [24, -18, 15, -22], [-22, -14, -13, -20], [24, -50, 16, -46]]) {
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(c, d);
    ctx.stroke();
  }
  // the rope, tied to a stake by the trunk, over the lip and down
  ctx.fillStyle = '#8f6240';
  ctx.fillRect(58, -26, 6, 28);
  ctx.strokeStyle = '#d8c08a';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(61, -22);
  ctx.quadraticCurveTo(40, -70, 8, -62);
  ctx.quadraticCurveTo(2, -40, 4, -6 + Math.sin(time * 1.4) * 1.5);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const y = -50 + i * 12;
    ctx.beginPath();
    ctx.arc(4 + Math.sin(time * 1.4 + i) * 0.6, y, 2.2, 0, TAU);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const k = (time * 0.3 + i / 6) % 1;
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.95;
    ctx.fillStyle = i % 2 ? '#bff5e4' : '#ffd1ec';
    ctx.beginPath();
    ctx.arc(-14 + i * 6 + Math.sin(time + i) * 4, -16 - k * 70, 2, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Glowroot Hollow's way in, at the Mycelium Deep's far end: a jagged crack in the cave floor and wall,
// light welling up out of it in slow pulses, threads running down over the edge
function drawCrack(ctx, time) {
  const pulse = 0.6 + 0.4 * Math.sin(time * 1.4) ** 2;
  const g = ctx.createRadialGradient(0, -10, 4, 0, -40, 130);
  g.addColorStop(0, `rgba(190,255,230,${0.7 * pulse})`);
  g.addColorStop(1, 'rgba(190,255,230,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-130, -170, 260, 180);
  ctx.fillStyle = '#2a2038'; // the split rock
  ctx.beginPath();
  ctx.moveTo(-60, 4);
  ctx.lineTo(-38, -60);
  ctx.lineTo(-48, -110);
  ctx.lineTo(-20, -160);
  ctx.lineTo(18, -150);
  ctx.lineTo(30, -96);
  ctx.lineTo(50, -50);
  ctx.lineTo(64, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(200,255,235,${0.75 * pulse})`; // the glow inside it
  ctx.beginPath();
  ctx.moveTo(-26, 4);
  ctx.lineTo(-14, -56);
  ctx.lineTo(-22, -100);
  ctx.lineTo(-6, -138);
  ctx.lineTo(6, -100);
  ctx.lineTo(16, -54);
  ctx.lineTo(30, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#24464f'; // threads running down over the edge
  ctx.lineCap = 'round';
  for (const [x0, c] of [[-90, '170,255,225'], [-70, '255,190,235'], [80, '255,226,160']]) {
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#24464f';
    ctx.beginPath();
    ctx.moveTo(x0, -120);
    ctx.quadraticCurveTo(x0 * 0.6, -40, x0 * 0.2, 4);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(${c},0.75)`;
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const k = (time * 0.35 + i / 5) % 1;
    ctx.globalAlpha = Math.sin(k * Math.PI);
    ctx.fillStyle = ['#bff5e4', '#ffd1ec', '#ffe6b0'][i % 3];
    ctx.beginPath();
    ctx.arc(-10 + i * 5 + Math.sin(time * 1.3 + i) * 6, -k * 150, 2.2, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Old Oak Canopy: a rope ladder hanging out of the treetops beside a giant oak. Rotten (the old gate): rungs
// rotted and snapped, the bottom of it lying in a heap. Mended (the branch is open): new rope and pale new
// rungs all the way down, pegged to the ground, the old rotten bits coiled up beside it.
function drawLadder(ctx, time, g, mended = false) {
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
  if (mended) return drawLadderMended(ctx, time);
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

function drawLadderMended(ctx, time) {
  const sway = Math.sin(time * 0.9) * 2;
  const ropeX = (side, y) => side * 13 + sway * ((-y) / 460);
  ctx.strokeStyle = '#e2c890';
  ctx.lineWidth = 2.4;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(ropeX(side, -460), -460);
    ctx.lineTo(ropeX(side, -4), -4);
    ctx.stroke();
  }
  ctx.lineCap = 'round';
  for (let y = -440, i = 0; y < -8; y += 30, i++) {
    ctx.strokeStyle = i % 5 === 3 ? '#c99b6b' : '#ecd2a4'; // (one old rung that was still good)
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(ropeX(-1, y), y);
    ctx.lineTo(ropeX(1, y), y);
    ctx.stroke();
  }
  // pegged down at the foot
  ctx.fillStyle = '#8f6240';
  for (const side of [-1, 1]) ctx.fillRect(side * 18 - 2.5, -8, 5, 10);
  // the old rotten ladder, coiled up out of the way
  ctx.strokeStyle = '#9b7a56';
  ctx.lineWidth = 2;
  for (const [rx, ry] of [[22, 6], [16, 5], [10, 4]]) {
    ctx.beginPath();
    ctx.ellipse(46, -ry, rx, ry, 0, 0, TAU);
    ctx.stroke();
  }
  // and a little basket on a pulley rope, for Ranger Acorn's bread
  const by = -60 - Math.sin(time * 0.4) * 30;
  ctx.strokeStyle = '#d8c08a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-36, -460);
  ctx.lineTo(-36, by - 12);
  ctx.stroke();
  ctx.fillStyle = '#d8b07a';
  ctx.strokeStyle = '#a07a48';
  ctx.beginPath();
  ctx.roundRect(-46, by - 12, 20, 14, [2, 2, 6, 6]);
  ctx.fill();
  ctx.stroke();
}

// Keeper's Spine, at the Old Oak Canopy's far end: a great trunk come down across the high path, rotten and
// split, mushrooms and moss all along it, too big to climb. Past it, the bare grey ridge shows over the
// leaves (src/canopy.js draws the ridge in the sky)
function drawTrunk(ctx, time) {
  const bark = ctx.createLinearGradient(0, -150, 0, 0);
  bark.addColorStop(0, '#8a6a52');
  bark.addColorStop(1, '#5e4636');
  ctx.fillStyle = bark;
  ctx.strokeStyle = '#3e2c22';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); // lying on a slant, the far end up in the leaves
  ctx.moveTo(-120, 2);
  ctx.quadraticCurveTo(-130, -70, -60, -96);
  ctx.lineTo(150, -190);
  ctx.lineTo(170, -110);
  ctx.lineTo(10, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the broken end facing you: rings, gone soft and dark in the middle
  ctx.fillStyle = '#c8a07a';
  ctx.beginPath();
  ctx.ellipse(-60, -48, 52, 50, 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(110,80,55,0.6)';
  ctx.lineWidth = 1.4;
  for (const r of [40, 30, 20]) {
    ctx.beginPath();
    ctx.ellipse(-60, -48, r, r * 0.96, 0.2, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = '#4a3428'; // rotten heart
  ctx.beginPath();
  ctx.ellipse(-58, -46, 13, 15, 0.3, 0, TAU);
  ctx.fill();
  // cracks along the trunk, moss and shelf fungus
  ctx.strokeStyle = 'rgba(40,28,20,0.6)';
  ctx.lineWidth = 2;
  for (const [x0, y0, x1, y1] of [[-10, -80, 90, -150], [20, -40, 120, -120]]) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo((x0 + x1) / 2, (y0 + y1) / 2 + 6);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.fillStyle = '#86b46a';
  for (const [x, y, s] of [[-20, -98, 14], [40, -128, 12], [100, -160, 13], [70, -110, 9]]) ellipse(ctx, x, y, s, s * 0.45, -0.4);
  for (const [x, y] of [[0, -50], [50, -80], [110, -122]]) {
    ctx.fillStyle = '#e8c890';
    ctx.strokeStyle = '#a07a48';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y, 11, 4.5, -0.4, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  }
  // a few leaves still drifting down off it
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.15 + i / 3) % 1;
    ctx.globalAlpha = Math.sin(k * Math.PI);
    ctx.fillStyle = i % 2 ? '#9cc87a' : '#d8b860';
    ellipse(ctx, 60 + i * 30 + Math.sin(time + i * 2) * 12, -180 + k * 175, 4, 2.2, time * 2 + i);
  }
  ctx.globalAlpha = 1;
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

const DRAW = { bridge: drawBridge, stump: drawStump, ladder: drawLadder, thorns: drawThorns, flooded: drawFlooded, trunk: drawTrunk };
const OPEN = { bridge: (ctx, time, g) => drawBridge(ctx, time, g, true), shore: drawShore, stump: (ctx, time, gate) => drawStump(ctx, time, gate, true), crack: drawCrack, ladder: (ctx, time, g) => drawLadder(ctx, time, g, true) };
