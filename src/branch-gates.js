// Docs: docs/places/branches.md
// The blocked ways into Greenhollow's unshipped branches (GATES in src/shared/branches.js), drawn behind the
// slimes (DRAW: a washed-out bridge, a root-choked stump, a rotten rope ladder, a wall of thorns, Wreck
// Cave's flooded mouth, a fallen trunk; after G5 none is left on Greenhollow). Each has a little wooden sign naming the place it leads to (red-trimmed for a hard
// pocket). Shipped branches keep their spot as an open way in (ENTRIES: drawEntries): Willowmere's
// footbridge, mended with new planks, the shore path to the Coves, its rockfall rolled aside, the hollow
// stump into the Mycelium Deep, its roots cut back, the glowing crack down into Glowroot Hollow, and the
// Old Oak Canopy's rope ladder, restrung, Wreck Cave's mouth with the water gone down, and the Thornheart's
// wall of thorns, cut back into a tunnel, and the fallen trunk in the Canopy, sawn through to Keeper's Spine.
// Frostpeak's (its depth pass, F0): a snow slide over the hamlet's shore path (the Whale Skerries), the ice
// stair onto the Queen's Bridge broken off on Frostpine Ridge, and in the Rimeglass Glacier the crevasse with
// the cutters' ladder smashed at the bottom (the Blue Halls) and the icefall with its steps sheared away (the
// Aurora Heights); the glacier's own way in, its snout on Starfall Summit with steps cut up it, is open.
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
const SIGN_AT = { bridge: -130, stump: -100, ladder: 78, thorns: -128, shore: 104, flooded: 110, crack: -120, trunk: -170, snowslide: 110, icestair: -120, crevasse: 104, icefall: -150, snout: -130 };
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
// leaves (src/canopy.js draws the ridge in the sky). Open (G5 shipped): a passage sawn clean through it, the
// cut block rolled aside, steps notched in the far side, and the Spine's light showing through the gap
function drawTrunk(ctx, time, g, open = false) {
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
  if (open) {
    // the passage sawn through it: pale cut faces, the ridge's bright sky through the gap, sawdust, and the
    // cut block rolled aside
    ctx.fillStyle = '#d6e2f0';
    ctx.strokeStyle = '#3e2c22';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, 2);
    ctx.lineTo(-30, -96);
    ctx.lineTo(30, -126);
    ctx.lineTo(60, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e0c49a';
    ctx.fillRect(-12, -92, 8, 92);
    ctx.fillRect(48, -116, 8, 118);
    ctx.stroke();
    ctx.fillStyle = '#a8a4b4'; // a glimpse of grey stone and heather on the far side
    ctx.beginPath();
    ctx.moveTo(-4, 2);
    ctx.quadraticCurveTo(20, -40, 54, -30);
    ctx.lineTo(54, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c48ad0';
    for (let i = 0; i < 5; i++) ellipse(ctx, 2 + i * 11, -6 - (i % 2) * 4, 3, 2.4);
    ctx.fillStyle = '#4e3a2c'; // steps up
    for (let i = 0; i < 3; i++) ctx.fillRect(-2 + i * 16, -14 - i * 20, 14, 4);
    ctx.fillStyle = '#7a5e48';
    ctx.strokeStyle = '#3e2c22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(110, -20, 36, 20, 0.15, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e0c49a';
    ellipse(ctx, 142, -14, 7, 18, 0.15);
    ctx.fillStyle = 'rgba(224,196,154,0.8)';
    for (let i = 0; i < 7; i++) ellipse(ctx, -6 + i * 10, 0, 3, 1.4);
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

// The Thornheart: the briar closes into a solid wall, dark and thick with thorns; something stirs deep in it.
// Open (the branch has shipped): the canes are cut back and bent aside into an arch over a low dark tunnel,
// the cut stems lying in a heap, and the eyes still blink, far down the tunnel.
function drawThorns(ctx, time, g, open = false) {
  const r = mulberry32(4920);
  ctx.fillStyle = 'rgba(40,20,40,0.22)';
  ellipse(ctx, 0, 2, 100, 10);
  // dark depth behind the canes
  const dg = ctx.createRadialGradient(0, -90, 10, 0, -90, 110);
  dg.addColorStop(0, '#3a1f36');
  dg.addColorStop(1, 'rgba(58,31,54,0)');
  ctx.fillStyle = dg;
  ellipse(ctx, 0, -90, 100, 100);
  ctx.lineCap = 'round';
  ctx.fillStyle = '#4a2c42'; // the thicket's dark mass at the foot of the canes
  ellipse(ctx, 0, -26, 100, 34);
  if (open) {
    // the tunnel: a low dark arch going back into the briar
    const tg = ctx.createRadialGradient(0, -40, 4, 0, -40, 60);
    tg.addColorStop(0, '#150a14');
    tg.addColorStop(1, '#2e1828');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(-40, 2);
    ctx.quadraticCurveTo(-44, -92, 0, -96);
    ctx.quadraticCurveTo(44, -92, 40, 2);
    ctx.closePath();
    ctx.fill();
  }
  // canes, arching over each other (open: pushed out to the sides and bent over the tunnel)
  for (let i = 0; i < 26; i++) {
    let x0 = -96 + r() * 192, h = 90 + r() * 120, lean = (r() - 0.5) * 120;
    const w = 5 + r() * 4, dark = r() > 0.5;
    if (open) {
      const side = x0 < 0 ? -1 : 1;
      x0 = side * (44 + Math.abs(x0) * 0.55);
      lean = -side * (40 + Math.abs(lean) * 0.6); // bent over the top of the arch
      h = Math.max(h, 120);
    }
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
  if (open) {
    // the cut stems, heaped to one side, pale where they were cut
    for (let i = 0; i < 6; i++) {
      const x = -86 + i * 7, y = -4 - (i % 3) * 4;
      ctx.strokeStyle = '#6a4258';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x - 22, y + 2);
      ctx.lineTo(x + 22, y - 3);
      ctx.stroke();
      ctx.fillStyle = '#d8c0a0';
      ellipse(ctx, x + 22, y - 3, 2.4, 2.4);
    }
  }
  // two eyes blinking deep in the briar, now and then
  const eo = clamp(Math.sin(time * 0.7) * 6 - 4.5, 0, 1);
  if (eo > 0) {
    const ey = open ? -48 : -96, eg = open ? 7 : 10;
    ctx.fillStyle = `rgba(255,170,190,${0.8 * eo})`;
    ellipse(ctx, -eg, ey, 3.4 * (open ? 0.8 : 1), 2.2 * eo);
    ellipse(ctx, eg, ey, 3.4 * (open ? 0.8 : 1), 2.2 * eo);
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
// the arch, a broken timber pokes out, and the swell heaves in and out. Open (the branch has shipped): the
// water has gone down to a shallow pool, the timber laid across it as a plank, a dark tide line high on the
// arch where the water stood, and a lantern glowing far inside.
function drawFlooded(ctx, time, g, open = false) {
  if (open) return drawFloodedOpen(ctx, time);
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

function drawFloodedOpen(ctx, time) {
  ctx.fillStyle = '#8f8a96'; // the cliff around the mouth (as when it was flooded)
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
  const arch = () => {
    ctx.beginPath();
    ctx.moveTo(-66, 4);
    ctx.lineTo(-66, -70);
    ctx.quadraticCurveTo(-60, -132, 0, -136);
    ctx.quadraticCurveTo(60, -132, 66, -70);
    ctx.lineTo(66, 4);
    ctx.closePath();
  };
  ctx.save();
  arch();
  ctx.clip();
  const d = ctx.createLinearGradient(0, -140, 0, 4);
  d.addColorStop(0, '#1a2430');
  d.addColorStop(1, '#0e161f');
  ctx.fillStyle = d;
  ctx.fillRect(-70, -140, 140, 150);
  // a lantern glowing far inside, swaying a little
  const sw = Math.sin(time * 1.3) * 3;
  ctx.fillStyle = 'rgba(255,214,140,0.22)';
  ellipse(ctx, 14 + sw, -66, 22, 22);
  ctx.fillStyle = '#ffd88a';
  ellipse(ctx, 14 + sw, -66, 3, 4);
  // the shallow pool left at the bottom
  const pg = ctx.createLinearGradient(0, -20, 0, 4);
  pg.addColorStop(0, '#3a6e8e');
  pg.addColorStop(1, '#22465e');
  ctx.fillStyle = pg;
  ctx.fillRect(-70, -16 + Math.sin(time * 1.1) * 1.5, 140, 24);
  ctx.restore();
  // the tide line: a dark wet band and weed high up the arch, where the water stood
  ctx.strokeStyle = 'rgba(60,70,80,0.45)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-68, -110);
  ctx.quadraticCurveTo(0, -118, 68, -110);
  ctx.stroke();
  ctx.fillStyle = '#5f8a5a';
  for (let i = 0; i < 7; i++) ellipse(ctx, -60 + i * 20, -106 + (i % 2) * 3, 4, 7);
  // the old timber, laid across the pool as a plank
  ctx.fillStyle = '#6a4a38';
  ctx.strokeStyle = '#3e2a20';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-58, -12, 116, 9, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c9b49a';
  for (const x of [-46, 40]) ellipse(ctx, x, -7.5, 1.8, 1.8);
  // rocks at the foot
  ctx.fillStyle = '#7a7480';
  for (const [x, s] of [[-80, 16], [-62, 10], [76, 14], [94, 9]]) ellipse(ctx, x, -s * 0.5, s, s * 0.7);
}

// ——— Frostpeak ———
const SNOW = '#f7fbff', SNOW_S = '#d6e6f4', ICE = '#a9d4ee', ICE_D = '#6fa8d0', ICE_L = '#d8eefa', ICE_LINE = '#3e6e94';
function iceBlock(ctx, x, y, w, h) {
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 5);
  ctx.lineTo(x + w * 0.5, y);
  ctx.lineTo(x + w - 2, y + 6);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ICE_L;
  ctx.fillRect(x + 5, y + 8, w * 0.22, h - 12);
  ctx.fillStyle = ICE_D;
  ctx.fillRect(x + w * 0.74, y + 8, w * 0.2, h - 11);
}
function snowCap(ctx, x, y, w) {
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 1, w * 0.56, 6, 0, Math.PI, 0);
  ctx.fill();
}
// The Whale Skerries, at Icefang Hamlet's west end: the shore path runs off north under the fjord wall, and
// a snow slide has come down across it, a great heap of snow and broken rock with the path's marker posts
// sticking out of it, and the sea showing past its end
function drawSnowslide(ctx, time) {
  const r = mulberry32(3711);
  ctx.fillStyle = '#4a4a5a'; // the fjord wall behind
  ctx.beginPath();
  ctx.moveTo(-150, 2);
  ctx.lineTo(-140, -190);
  ctx.lineTo(-60, -230);
  ctx.lineTo(20, -200);
  ctx.lineTo(90, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; // the scar the slide left down it
  ctx.beginPath();
  ctx.moveTo(-90, -210);
  ctx.quadraticCurveTo(-70, -120, -100, -40);
  ctx.lineTo(-20, -40);
  ctx.quadraticCurveTo(-30, -130, -50, -214);
  ctx.closePath();
  ctx.fill();
  // the heap
  ctx.fillStyle = SNOW_S;
  ctx.beginPath();
  ctx.moveTo(-150, 4);
  ctx.quadraticCurveTo(-130, -110, -50, -120);
  ctx.quadraticCurveTo(30, -110, 80, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.moveTo(-140, 4);
  ctx.quadraticCurveTo(-120, -96, -50, -110);
  ctx.quadraticCurveTo(20, -96, 70, 4);
  ctx.closePath();
  ctx.fill();
  // broken rock in it
  ctx.fillStyle = '#6a6a7a';
  ctx.strokeStyle = '#3e3e4e';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 9; i++) {
    const x = -130 + r() * 190, y = -10 - r() * 80, s = 6 + r() * 12;
    ctx.beginPath();
    ctx.moveTo(x - s, y + s * 0.4);
    ctx.lineTo(x - s * 0.3, y - s * 0.7);
    ctx.lineTo(x + s, y - s * 0.2);
    ctx.lineTo(x + s * 0.6, y + s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // the path's marker posts, buried to the top, one snapped
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(-100, -86, 5, 20);
  ctx.fillStyle = '#d0485a';
  ctx.fillRect(-100, -86, 5, 5);
  ctx.save();
  ctx.translate(-6, -64);
  ctx.rotate(0.9);
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(0, 0, 5, 26);
  ctx.fillStyle = '#d0485a';
  ctx.fillRect(0, 0, 5, 5);
  ctx.restore();
  // a few flakes still sliding down
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.3 + i / 4) % 1;
    ctx.fillStyle = `rgba(255,255,255,${Math.sin(k * Math.PI)})`;
    ctx.beginPath();
    ctx.arc(-70 + i * 14 + k * 30, -200 + k * 150, 2, 0, TAU);
    ctx.fill();
  }
}
// The Queen's Bridge, on Frostpine Ridge by the Frozen Throne: a stair of blue ice blocks climbing up toward
// the bridge that arches over the strait, broken off halfway where the bridge cracked: a gap of empty air,
// then the stair's top hanging from the bridge's underside, dripping
function drawIcestair(ctx, time) {
  // the bridge itself, coming down out of the sky from the upper left and ending in a jagged break
  const deck = () => {
    ctx.beginPath();
    ctx.moveTo(-330, -520);
    ctx.quadraticCurveTo(-180, -330, -40, -236);
    ctx.lineTo(-30, -210);
    ctx.lineTo(-48, -200);
    ctx.lineTo(-58, -186);
    ctx.quadraticCurveTo(-200, -280, -380, -500);
    ctx.closePath();
  };
  ctx.fillStyle = 'rgba(200,228,248,0.95)';
  ctx.strokeStyle = 'rgba(80,140,190,0.9)';
  ctx.lineWidth = 2.5;
  deck();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(-330, -520);
  ctx.quadraticCurveTo(-180, -330, -40, -236);
  ctx.lineTo(-46, -228);
  ctx.quadraticCurveTo(-190, -322, -342, -512);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(200,232,250,0.9)'; // icicles under it
  for (let i = 0; i < 7; i++) {
    const x = -250 + i * 30, y = -360 + i * 22 + (i > 3 ? (i - 3) * 6 : 0), len = 10 + (i % 3) * 8;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x + 3, y);
    ctx.lineTo(x, y + len);
    ctx.closePath();
    ctx.fill();
  }
  // the lower steps, standing
  for (let i = 0; i < 4; i++) iceBlock(ctx, 40 - i * 26, -26 - i * 26, 30, 26 + i * 26);
  for (let i = 0; i < 4; i++) snowCap(ctx, 40 - i * 26, -26 - i * 26, 30);
  // the broken end: jagged
  ctx.fillStyle = ICE_L;
  ctx.beginPath();
  ctx.moveTo(-38, -104);
  ctx.lineTo(-30, -112);
  ctx.lineTo(-26, -102);
  ctx.lineTo(-20, -110);
  ctx.lineTo(-12, -104);
  ctx.closePath();
  ctx.fill();
  // the top of the stair, hanging from the bridge, and the gap between
  for (let i = 0; i < 2; i++) iceBlock(ctx, -64 - i * 26, -196 + i * 14, 26, 22);
  // a drip falling from the broken end
  const k = (time * 0.7) % 1;
  ctx.fillStyle = `rgba(200,232,250,${1 - k})`;
  ctx.beginPath();
  ctx.arc(-50, -186 + k * 180, 2, 0, TAU);
  ctx.fill();
  // ropes the fjord folk tied across the foot: red rag knots
  ctx.strokeStyle = '#8a6a48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, -36);
  ctx.quadraticCurveTo(54, -28, 76, -36);
  ctx.stroke();
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(74, -44, 4, 46);
  ctx.fillStyle = '#d0485a';
  ctx.fillRect(50, -34, 6, 8);
}
// The Blue Halls, in the Glacier's Crevasse Field: a crevasse mouth in the ice wall, blue going down into dark
// with a cold light far below; the cutters' ladder lies smashed at the bottom, only its top rail still pegged
// to the lip, and a broken rung or two
function drawCrevasse(ctx, time) {
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-90, 2);
  ctx.lineTo(-80, -150);
  ctx.lineTo(80, -160);
  ctx.lineTo(90, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the slot
  const g = ctx.createLinearGradient(0, -150, 0, 0);
  g.addColorStop(0, '#3a6a96');
  g.addColorStop(1, '#0e2036');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-34, 2);
  ctx.lineTo(-24, -140);
  ctx.lineTo(26, -146);
  ctx.lineTo(36, 2);
  ctx.closePath();
  ctx.fill();
  // the cold light, far down
  ctx.fillStyle = `rgba(120,200,255,${0.35 + 0.15 * Math.sin(time * 1.5)})`;
  ctx.beginPath();
  ctx.ellipse(2, -18, 22, 10, 0, 0, TAU);
  ctx.fill();
  // the ladder's top rail, pegged to the lip, dangling
  ctx.strokeStyle = '#7a5a40';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, -146);
  ctx.lineTo(-10, -110 + Math.sin(time * 1.2) * 2);
  ctx.stroke();
  ctx.fillStyle = '#5a5a66';
  ctx.fillRect(-18, -150, 8, 6);
  // broken rungs scattered in front
  ctx.save();
  ctx.translate(-60, -6);
  ctx.rotate(0.3);
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(0, 0, 26, 5);
  ctx.restore();
  ctx.save();
  ctx.translate(46, -4);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(0, 0, 20, 5);
  ctx.restore();
  // snow over the lip
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.ellipse(0, -152, 92, 10, -0.03, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(200,232,250,0.9)';
  for (let i = 0; i < 5; i++) {
    const x = -20 + i * 11;
    ctx.beginPath();
    ctx.moveTo(x - 2, -146);
    ctx.lineTo(x + 2, -146);
    ctx.lineTo(x, -132 + (i % 2) * 6);
    ctx.closePath();
    ctx.fill();
  }
}
// The Aurora Heights, at the top of the Glacier's Icefall: a wall of great jumbled ice blocks climbing up and
// away, where the cutters' steps used to run; the bottom few steps are still there, and then sheared ice.
// The aurora shimmers low over the top.
function drawIcefall(ctx, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) {
    const x = -140 + i * 22, y = -290 + Math.sin(i * 0.7 + time * 0.8) * 10;
    ctx.fillStyle = `rgba(120,240,200,${0.08 + 0.05 * Math.sin(time + i)})`;
    ctx.fillRect(x, y, 22, 80);
  }
  ctx.restore();
  for (const [x, y, w, h] of [[-120, -150, 70, 150], [-60, -210, 80, 210], [10, -260, 90, 260], [60, -190, 80, 190], [-20, -110, 60, 110]]) iceBlock(ctx, x, y, w, h);
  for (const [x, y, w] of [[-120, -150, 70], [-60, -210, 80], [10, -260, 90], [60, -190, 80]]) snowCap(ctx, x, y, w);
  // the surviving bottom steps, and the sheared face above them
  ctx.fillStyle = ICE_L;
  for (let i = 0; i < 3; i++) ctx.fillRect(-14 + i * 14, -20 - i * 22, 30, 5);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, -84);
  ctx.lineTo(4, -96);
  ctx.lineTo(16, -88);
  ctx.lineTo(30, -104);
  ctx.stroke();
  // a fixed rope's end, hanging loose from a peg high up
  ctx.strokeStyle = '#8a6a48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, -230);
  ctx.quadraticCurveTo(46 + Math.sin(time * 1.4) * 4, -180, 38, -150);
  ctx.stroke();
  ctx.fillStyle = '#5a5a66';
  ctx.fillRect(36, -236, 8, 6);
}
// The glacier's snout on Starfall Summit (open: the Rimeglass Glacier has shipped): a wall of blue ice
// coming down off the mountain, with steps cut in it zig-zagging up, a rope on iron pegs beside them, and a
// cutters' red flag at the top
function drawSnout(ctx, time) {
  ctx.fillStyle = '#c4def0';
  ctx.beginPath();
  ctx.moveTo(-170, 2);
  ctx.quadraticCurveTo(-160, -150, -60, -200);
  ctx.quadraticCurveTo(60, -230, 170, -180);
  ctx.lineTo(160, 2);
  ctx.closePath();
  ctx.fill();
  iceBlock(ctx, -120, -150, 90, 152);
  iceBlock(ctx, -40, -190, 100, 192);
  iceBlock(ctx, 50, -160, 90, 162);
  for (const [x, y, w] of [[-120, -150, 90], [-40, -190, 100], [50, -160, 90]]) snowCap(ctx, x, y, w);
  // the cut steps, zig-zagging up the middle block
  ctx.fillStyle = ICE_L;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) {
    const x = -24 + (i % 2 ? 30 : 0) + (i > 3 ? 10 : 0), y = -16 - i * 25;
    ctx.fillRect(x, y, 34, 6);
    ctx.strokeRect(x, y, 34, 6);
  }
  // the rope on pegs
  ctx.strokeStyle = '#8a6a48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-36, -10);
  ctx.quadraticCurveTo(-30, -100, -32, -186);
  ctx.stroke();
  ctx.fillStyle = '#5a5a66';
  for (const y of [-14, -100, -186]) ctx.fillRect(-38, y - 4, 6, 8);
  // the flag
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(20, -240, 3, 52);
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.moveTo(23, -240);
  ctx.quadraticCurveTo(36, -236 + Math.sin(time * 4) * 3, 44, -232 + Math.sin(time * 4 + 1) * 4);
  ctx.lineTo(23, -224);
  ctx.closePath();
  ctx.fill();
}

const DRAW = { bridge: drawBridge, stump: drawStump, ladder: drawLadder, thorns: drawThorns, flooded: drawFlooded, trunk: drawTrunk, snowslide: drawSnowslide, icestair: drawIcestair, crevasse: drawCrevasse, icefall: drawIcefall };
const OPEN = { snout: drawSnout, bridge: (ctx, time, g) => drawBridge(ctx, time, g, true), shore: drawShore, stump: (ctx, time, gate) => drawStump(ctx, time, gate, true), crack: drawCrack, ladder: (ctx, time, g) => drawLadder(ctx, time, g, true),
  flooded: (ctx, time, g) => drawFlooded(ctx, time, g, true), thorns: (ctx, time, g) => drawThorns(ctx, time, g, true), trunk: (ctx, time, g) => drawTrunk(ctx, time, g, true) };
