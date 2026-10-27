// Docs: docs/places/branches.md
// The blocked ways into Greenhollow's unshipped branches (GATES in src/shared/branches.js), drawn behind the
// slimes (DRAW: a washed-out bridge, a root-choked stump, a rotten rope ladder, a wall of thorns, Wreck
// Cave's flooded mouth, a fallen trunk; after G5 none is left on Greenhollow). Each has a little wooden sign naming the place it leads to (red-trimmed for a hard
// pocket). Shipped branches keep their spot as an open way in (ENTRIES: drawEntries): Willowmere's
// footbridge, mended with new planks, the shore path to the Coves, its rockfall rolled aside, the hollow
// stump into the Mycelium Deep, its roots cut back, the glowing crack down into Glowroot Hollow, and the
// Old Oak Canopy's rope ladder, restrung, Wreck Cave's mouth with the water gone down, and the Thornheart's
// wall of thorns, cut back into a tunnel, and the fallen trunk in the Canopy, sawn through to Keeper's Spine,
// and (FB1 (b)) the split in the Thornheart's root knot, a dark way down between the roots to the Sunken Road,
// and (FB2 (b)) the Hall Troll's wall fallen over at the Blue Halls' east end, the cutters' old ladder down to the
// Old Ice behind it (Fenrir's door at the foot of the Long Stair is drawn by src/longstair.js).
// Frostpeak's (its depth pass, F0): the ice
// stair onto the Queen's Bridge broken off on Frostpine Ridge, and in the Rimeglass Glacier the crevasse with
// the cutters' ladder smashed at the bottom (the Blue Halls) and the icefall with its steps sheared away (the
// Aurora Heights); none is left since F4. Emberdeep's (atlas Phase 5, E0): a geyser across Forgehold's beach
// path (the Black Sands), a fresh lava tongue down the gully (the Smoking Coast), the charcoal road's fallen
// iron bridge (the Ashwood), the fuming vent field (the Brimstone Fields), and the balloon lying deflated by
// the thermal column (atlas Phase 6). Open: the ice stair built up again to the Queen's Bridge (F4), the glacier's own way in, its snout on Starfall Summit with steps cut up it (F1), the
// snow slide over the hamlet's shore path dug through to the Whale Skerries and the Narwhal Grotto's mouth in
// the Skerries' sea cliff (F2), the crevasse with a new ladder down into the Blue Halls and the icefall with
// new steps cut up to the Aurora Heights (F3), and on Emberdeep the geyser on Forgehold's beach path gone quiet,
// stones laid across it, to the Black Sands (E1), and the charcoal road's iron bridge hauled back up onto its
// stones, to the Ashwood (E1), and the gully's lava tongue crusted hard, steps cut down it, to the Smoking Coast (E2).
// The Ashwood's own gate: the Old Foundry's mine adit, bricked up by the forge folk. The Coast's old lava tube in its
// sea cliff, steam roaring out of it until it drained (E2), open to the Drained Tubes (OPEN.tubemouth: old steps down).
// Feet on the ground at (g.x, ground).
import { TAU, mulberry32, circle, ellipse, clamp } from './util.js';
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
    if (g.sign !== false) sign(ctx, SIGN_AT[g.kind], g.name, g.hard, near === g); // (a gate whose room draws its own sign: Fenrir's door)
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
const SIGN_AT = { fallenwall: -178, rootsplit: 58, bridge: -130, stump: -100, ladder: 78, thorns: -128, shore: 104, flooded: 110, crack: -120, trunk: -170, snowslide: 110, icestair: -120, crevasse: 104, icefall: -150, snout: -130, grotto: 118, geyser: 120, lavatongue: -150, ironbridge: -150, adit: 92, fumes: -130, balloon: -190, tubemouth: 130 };
const SCALE = { bridge: 1.5, thorns: 1.15, balloon: 0.82 };

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
// The snow slide dug through (open: the Whale Skerries have shipped): the heap cut in two, the halves banked
// up either side of a cleared path, the marker posts stood back up, two shovels left stuck in the snow
function drawSnowslideOpen(ctx, time) {
  ctx.fillStyle = '#4a4a5a'; // the fjord wall behind
  ctx.beginPath();
  ctx.moveTo(-150, 2);
  ctx.lineTo(-140, -190);
  ctx.lineTo(-60, -230);
  ctx.lineTo(20, -200);
  ctx.lineTo(90, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; // the old scar, weathering
  ctx.beginPath();
  ctx.moveTo(-90, -210);
  ctx.quadraticCurveTo(-70, -120, -100, -40);
  ctx.lineTo(-20, -40);
  ctx.quadraticCurveTo(-30, -130, -50, -214);
  ctx.closePath();
  ctx.fill();
  // the two banks of snow either side of the cut
  for (const [a, b, top] of [[-150, -70, -80], [-10, 80, -70]]) {
    ctx.fillStyle = SNOW_S;
    ctx.beginPath();
    ctx.moveTo(a, 4);
    ctx.quadraticCurveTo(a + 6, top, (a + b) / 2, top - 6);
    ctx.quadraticCurveTo(b - 6, top, b, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = SNOW;
    ctx.beginPath();
    ctx.moveTo(a + 8, 4);
    ctx.quadraticCurveTo(a + 12, top + 8, (a + b) / 2, top + 2);
    ctx.quadraticCurveTo(b - 12, top + 8, b - 8, 4);
    ctx.closePath();
    ctx.fill();
  }
  // shovel marks on the cut faces
  ctx.strokeStyle = 'rgba(150,180,210,0.6)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-74 + i * 2, -10 - i * 16);
    ctx.lineTo(-68 + i * 2, -18 - i * 16);
    ctx.moveTo(-6 - i * 2, -8 - i * 14);
    ctx.lineTo(-12 - i * 2, -16 - i * 14);
    ctx.stroke();
  }
  // the cleared path between, trodden
  ctx.fillStyle = 'rgba(180,170,160,0.6)';
  ctx.fillRect(-70, -2, 60, 5);
  // the marker posts, stood back up, and two shovels stuck in the bank
  for (const x of [-80, 4]) {
    ctx.fillStyle = '#7a5a40';
    ctx.fillRect(x, -60, 5, 60);
    ctx.fillStyle = '#d0485a';
    ctx.fillRect(x, -60, 5, 6);
  }
  for (const [x, a] of [[-120, -0.3], [50, 0.25]]) {
    ctx.save();
    ctx.translate(x, -50);
    ctx.rotate(a);
    ctx.fillStyle = '#8a6a48';
    ctx.fillRect(-1.5, -40, 3, 40);
    ctx.fillRect(-6, -42, 12, 3);
    ctx.fillStyle = '#7a7a86';
    ctx.beginPath();
    ctx.roundRect(-7, 0, 14, 16, 3);
    ctx.fill();
    ctx.restore();
  }
}
// The Narwhal Grotto's mouth, in the sea cliff at the Skerries' far end (open): a tall arch into the cliff,
// green ice inside glowing faintly, icicles fringing it, a skerry stone at its foot to climb in by
function drawGrottoMouth(ctx, time) {
  ctx.fillStyle = '#0e2a2c';
  ctx.beginPath();
  ctx.moveTo(-58, 2);
  ctx.lineTo(-58, -110);
  ctx.quadraticCurveTo(-50, -170, 0, -176);
  ctx.quadraticCurveTo(52, -170, 58, -110);
  ctx.lineTo(58, 2);
  ctx.closePath();
  ctx.fill();
  const pulse = 0.5 + 0.5 * Math.sin(time * 1.3);
  const g = ctx.createRadialGradient(0, -60, 4, 0, -60, 90);
  g.addColorStop(0, `rgba(150,255,210,${0.35 + 0.15 * pulse})`);
  g.addColorStop(1, 'rgba(150,255,210,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-60, -170, 120, 172);
  // green ice walls inside, receding
  ctx.fillStyle = 'rgba(90,184,160,0.6)';
  ctx.beginPath();
  ctx.moveTo(-50, 2);
  ctx.lineTo(-20, -100);
  ctx.lineTo(-30, 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(50, 2);
  ctx.lineTo(18, -110);
  ctx.lineTo(28, 2);
  ctx.closePath();
  ctx.fill();
  // icicles round the arch
  ctx.fillStyle = 'rgba(200,245,230,0.9)';
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8) * Math.PI, x = Math.cos(a) * 56, y = -112 + Math.sin(a) * 62, len = 12 + (i % 3) * 8;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x + 3, y);
    ctx.lineTo(x, y + len);
    ctx.closePath();
    ctx.fill();
  }
  // a stepping stone at its foot
  ctx.fillStyle = '#3a3e4c';
  ctx.beginPath();
  ctx.ellipse(10, 0, 40, 12, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = SNOW;
  ellipse(ctx, 10, -10, 22, 3);
}
// The Queen's Bridge, on Frostpine Ridge by the Frozen Throne: a stair of blue ice blocks climbing up toward
// the bridge that arches over the strait. Blocked (F0–F3): broken off halfway where the bridge cracked, a gap
// of empty air, then the stair's top hanging from the bridge's underside, dripping, and the fjord folk's rope
// across its foot. Open (F4): the gap built up again with fresh-cut blocks (paler, their saw marks still on
// them: the cutters' work), a rope rail on pegs all the way up and the cutters' red flag at the foot
function drawIcestair(ctx, time, _g, open = false) {
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
  if (open) return drawIcestairMended(ctx, time);
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
// the mended stair (F4): new blocks up the gap to the bridge, a rope rail, the red flag
function drawIcestairMended(ctx, time) {
  for (let i = 0; i < 3; i++) {
    const x = -36 - i * 14, y = -128 - i * 24;
    iceBlock(ctx, x, y, 28, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; // fresh-cut: paler, saw marks
    ctx.fillRect(x + 2, y + 6, 24, 16);
    ctx.strokeStyle = 'rgba(62,98,148,0.45)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(x + 4 + k * 8, y + 8);
      ctx.lineTo(x + 8 + k * 8, y + 20);
      ctx.stroke();
    }
    snowCap(ctx, x, y, 28);
  }
  for (let i = 0; i < 2; i++) iceBlock(ctx, -64 - i * 26, -196 + i * 14, 26, 22);
  // the rope rail on pegs, all the way up
  ctx.strokeStyle = '#a07e58';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(72, -40);
  ctx.quadraticCurveTo(10, -90, -40, -210);
  ctx.stroke();
  ctx.fillStyle = '#5a5a66';
  for (const [px, py] of [[72, -40], [30, -80], [-6, -140], [-40, -210]]) ctx.fillRect(px - 2, py - 4, 4, 10);
  // the cutters' red flag at the foot
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(84, -66, 3, 68);
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.moveTo(87, -66);
  ctx.quadraticCurveTo(100, -62 + Math.sin(time * 4) * 3, 108, -58 + Math.sin(time * 4 + 1) * 4);
  ctx.lineTo(87, -50);
  ctx.closePath();
  ctx.fill();
}
// The Blue Halls, in the Glacier's Crevasse Field: a crevasse mouth in the ice wall, blue going down into dark
// with a cold light far below. Blocked (F0–F2): the cutters' ladder lies smashed at the bottom, only its top
// rail still pegged to the lip, and a broken rung or two. Open (F3): a new ladder of pale fresh pine pegged to
// the lip and running down into the blue, a lantern hung at the top, a coil of rope beside it
function drawCrevasse(ctx, time, _g, open = false) {
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
  if (open) {
    crevasseLadder(ctx, time);
    return;
  }
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
// The mended ladder (F3): two rails of new pine running down into the slot (the near end lit, the far end lost
// in the blue), pegged to the lip with iron, a cutters' lantern on the top peg, a coil of rope and the snow
// over the lip trodden flat
function crevasseLadder(ctx, time) {
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const y = -138 + i * 15, a = Math.max(0.15, 1 - i * 0.1);
    ctx.strokeStyle = `rgba(214,184,138,${a})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-13 + i * 0.4, y);
    ctx.lineTo(13 - i * 0.4, y);
    ctx.stroke();
  }
  for (const s of [-1, 1]) {
    const lg = ctx.createLinearGradient(0, -150, 0, -10);
    lg.addColorStop(0, '#e2c08e');
    lg.addColorStop(1, 'rgba(160,130,90,0.1)');
    ctx.strokeStyle = lg;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(s * 15, -156);
    ctx.lineTo(s * 11, -12);
    ctx.stroke();
  }
  ctx.fillStyle = '#5a5a66';
  for (const s of [-1, 1]) ctx.fillRect(s * 15 - 4, -160, 8, 7);
  // snow over the lip, trodden flat where the ladder goes over
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.ellipse(-56, -152, 40, 9, -0.03, Math.PI, 0);
  ctx.ellipse(56, -154, 40, 9, 0.03, Math.PI, 0);
  ctx.fill();
  // the lantern, hung on a pole stuck in the snow by the top of the ladder
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(-46, -196, 3, 46);
  ctx.fillRect(-46, -196, 16, 3);
  const sw = Math.sin(time * 1.3) * 0.08;
  ctx.save();
  ctx.translate(-32, -193);
  ctx.rotate(sw);
  ctx.strokeStyle = '#4e4e5a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 6);
  ctx.stroke();
  ctx.fillStyle = `rgba(255,214,140,${0.25 + 0.06 * Math.sin(time * 5)})`;
  ctx.beginPath();
  ctx.arc(0, 15, 18, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe0a0';
  ctx.strokeStyle = '#4e4e5a';
  ctx.beginPath();
  ctx.roundRect(-5, 6, 10, 15, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4e4e5a';
  ctx.fillRect(-6, 4, 12, 3);
  ctx.restore();
  // a coil of rope on the snow
  ctx.strokeStyle = '#a07e58';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(52, -6 - i * 3, 14 - i * 2, 4, 0, 0, TAU);
    ctx.stroke();
  }
}
// The Aurora Heights, at the top of the Glacier's Icefall: a wall of great jumbled ice blocks climbing up and
// away, the aurora shimmering low over the top. Blocked (F0–F2): where the cutters' steps used to run, the
// bottom few are still there, and then sheared ice, a fixed rope's end hanging loose. Open (F3): new steps
// cut zig-zagging all the way up, a new rope on iron pegs beside them, a cutters' red flag at the top
function drawIcefall(ctx, time, _g, open = false) {
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
  if (open) {
    // the new steps, zig-zagging up the blocks to the top, fresh-cut and bright
    ctx.fillStyle = ICE_L;
    ctx.strokeStyle = ICE_LINE;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 10; i++) {
      const x = -30 + (i % 2 ? 26 : 0) + Math.min(i, 6) * 4, y = -18 - i * 24;
      ctx.fillRect(x, y, 30, 6);
      ctx.strokeRect(x, y, 30, 6);
    }
    // the rope on pegs
    ctx.strokeStyle = '#a07e58';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-40, -10);
    ctx.quadraticCurveTo(-34, -130, -10, -250);
    ctx.stroke();
    ctx.fillStyle = '#5a5a66';
    for (const [x, y] of [[-40, -14], [-30, -130], [-10, -250]]) ctx.fillRect(x - 3, y - 4, 6, 8);
    // the flag at the top
    ctx.fillStyle = '#7a5a40';
    ctx.fillRect(30, -320, 3, 58);
    ctx.fillStyle = '#d0485a';
    ctx.beginPath();
    ctx.moveTo(33, -320);
    ctx.quadraticCurveTo(46, -316 + Math.sin(time * 4) * 3, 54, -312 + Math.sin(time * 4 + 1) * 4);
    ctx.lineTo(33, -304);
    ctx.closePath();
    ctx.fill();
    return;
  }
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

// ——— Emberdeep (atlas Phase 5, E0: story/world/emberdeep-depth.md) ———
// The Black Sands, off Forgehold's west end: a new geyser has broken out right across the beach path. A
// scalded ring in the black sand, a bubbling pool, and every few seconds a column of boiling water.
// open (E1, the update itself lifted it): the geyser has gone quiet, its pool crusted over with only a wisp of
// steam, flat stones laid across it, the rope and its stakes pulled up and left lying by the path
function drawGeyser(ctx, time, g, open = false) {
  if (open) return drawGeyserQuiet(ctx, time);
  ctx.fillStyle = '#c8b8a4'; // the scalded ring
  ctx.beginPath();
  ctx.ellipse(0, 2, 74, 9, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8dcc8';
  ctx.beginPath();
  ctx.ellipse(0, 1, 50, 6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#6ab4a8'; // the pool, bubbling
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 5, 0, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    const k = (time * 1.6 + i / 4) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - k)})`;
    ellipse(ctx, -18 + i * 12, -1 - k * 4, 2 + k * 3, 1.6 + k * 2);
  }
  // the path's stones running into it from both sides
  ctx.fillStyle = '#6a5a62';
  for (const dx of [-112, -92, 90, 110]) ellipse(ctx, dx, 3, 9, 3.5);
  // the spout: building, up, falling back in steam
  const ph = (time * 0.28) % 1;
  if (ph > 0.55 && ph < 0.85) {
    const k = (ph - 0.55) / 0.3, h = Math.sin(k * Math.PI) * 230;
    ctx.fillStyle = 'rgba(250,252,250,0.9)';
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.quadraticCurveTo(-6, -h * 0.6, -9, -h);
    ctx.lineTo(9, -h);
    ctx.quadraticCurveTo(6, -h * 0.6, 14, 0);
    ctx.closePath();
    ctx.fill();
    circle(ctx, 0, -h, 18 + k * 8);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (const dx of [-20, 18]) circle(ctx, dx, -h * 0.8, 10);
  }
  for (let i = 0; i < 6; i++) { // steam hanging over it
    const k = (time * 0.18 + i / 6) % 1;
    ctx.fillStyle = `rgba(250,248,246,${0.45 * Math.sin(k * Math.PI)})`;
    circle(ctx, Math.sin(i * 2.3 + time * 0.4) * 30, -20 - k * 140, 14 + k * 26);
  }
  // a rope strung across on two stakes, red rags knotted on it
  ctx.strokeStyle = '#4a3e46';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const px of [-70, 70]) {
    ctx.moveTo(px, 4);
    ctx.lineTo(px, -44);
  }
  ctx.stroke();
  ctx.strokeStyle = '#c9b8aa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-70, -40);
  ctx.quadraticCurveTo(0, -26, 70, -40);
  ctx.stroke();
  ctx.fillStyle = '#d0485a';
  for (const t of [0.25, 0.5, 0.75]) ctx.fillRect(-70 + t * 140 - 2, -36 + Math.sin(t * Math.PI) * 9, 4, 8);
}

function drawGeyserQuiet(ctx, time) {
  ctx.fillStyle = '#8a7a74'; // the old scalded ring, gone grey
  ctx.beginPath();
  ctx.ellipse(0, 2, 74, 9, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#a8988a';
  ctx.beginPath();
  ctx.ellipse(0, 1, 46, 5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(242,212,90,0.55)'; // a sulphur crust over the old hole
  ellipse(ctx, -6, 0, 22, 3.5);
  // a wisp of steam, nothing more
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.15 + i / 3) % 1;
    ctx.fillStyle = `rgba(250,248,246,${0.3 * Math.sin(k * Math.PI)})`;
    circle(ctx, Math.sin(i * 2.3 + time * 0.4) * 10, -10 - k * 70, 8 + k * 12);
  }
  // the path's stones, and new flat ones laid across where it was
  ctx.fillStyle = '#6a5a62';
  for (const dx of [-112, -92, -60, -30, 0, 30, 60, 90, 110]) ellipse(ctx, dx, 3, 10, 3.6);
  ctx.fillStyle = 'rgba(255,240,230,0.25)';
  for (const dx of [-60, -30, 0, 30, 60]) ellipse(ctx, dx - 3, 1.5, 5, 1.4);
  // the rope and its stakes, pulled up and left lying by the path, a red rag still knotted on
  ctx.strokeStyle = '#4a3e46';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-96, -2);
  ctx.lineTo(-58, -8);
  ctx.moveTo(62, -6);
  ctx.lineTo(100, -1);
  ctx.stroke();
  ctx.strokeStyle = '#c9b8aa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-60, -7);
  ctx.bezierCurveTo(-30, -2, -20, 6, 10, 5);
  ctx.bezierCurveTo(30, 4, 40, -4, 62, -5);
  ctx.stroke();
  ctx.fillStyle = '#d0485a';
  ctx.fillRect(-26, 0, 4, 7);
}

// The Smoking Coast, down a gully south off Cinder Flats: a fresh lava tongue has run down it, crusting over
// black with red still showing in the cracks. The gully's walls frame it; steam lifts off.
// open (E2, the update itself lifted it): the tongue has crusted hard and gone cold grey-black, steps cut down it,
// an iron hand-chain pegged along one side, a last wisp of warmth off the top
function drawLavaTongue(ctx, time, _g, open = false) {
  ctx.fillStyle = '#5a3e4c'; // the gully's walls
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 120, 4);
    ctx.quadraticCurveTo(s * 110, -90, s * 70, -150);
    ctx.lineTo(s * 40, -140);
    ctx.quadraticCurveTo(s * 60, -60, s * 50, 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#7a5a68';
  for (const s of [-1, 1]) ellipse(ctx, s * 86, -60, 12, 30, s * 0.2);
  // the tongue: a black crust spilling out of the gully across the path
  ctx.fillStyle = '#2a2026';
  ctx.beginPath();
  ctx.moveTo(-40, -138);
  ctx.quadraticCurveTo(-56, -70, -96, 4);
  ctx.lineTo(96, 4);
  ctx.quadraticCurveTo(56, -70, 40, -138);
  ctx.closePath();
  ctx.fill();
  if (open) return lavaTongueCold(ctx, time);
  const pulse = 0.6 + 0.3 * Math.sin(time * 2.2);
  ctx.strokeStyle = `rgba(255,${110 + Math.round(40 * pulse)},60,${pulse})`;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const r = mulberry32(5101);
  for (let i = 0; i < 9; i++) {
    const y = -130 + i * 15, half = 30 + i * 7;
    const x0 = (r() - 0.5) * half;
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + (r() - 0.5) * 30, y + 10);
    ctx.lineTo(x0 + (r() - 0.5) * 40, y + 16);
  }
  ctx.stroke();
  ctx.fillStyle = `rgba(255,150,70,${0.5 * pulse})`; // the hot front edge
  ctx.beginPath();
  ctx.ellipse(0, 3, 90, 4, 0, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const k = (time * 0.25 + i / 5) % 1;
    ctx.fillStyle = `rgba(240,232,232,${0.4 * Math.sin(k * Math.PI)})`;
    circle(ctx, -40 + i * 20 + Math.sin(k * 4 + i) * 6, -20 - k * 120, 10 + k * 16);
  }
}

function lavaTongueCold(ctx, time) {
  ctx.strokeStyle = '#4a3e46'; // ropy wrinkles in the cold crust
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const r = mulberry32(5103);
  for (let i = 0; i < 7; i++) {
    const y = -124 + i * 18, half = 26 + i * 8;
    ctx.moveTo(-half * 0.8, y + 4);
    ctx.quadraticCurveTo((r() - 0.5) * 20, y - 4, half * 0.8, y + 4);
  }
  ctx.stroke();
  // steps cut down the middle, pale where the crust was chipped
  for (let i = 0; i < 8; i++) {
    const y = -128 + i * 17, w = 22 + i * 3;
    ctx.fillStyle = '#5e5260';
    ctx.fillRect(-w / 2, y, w, 5);
    ctx.fillStyle = 'rgba(200,190,200,0.35)';
    ctx.fillRect(-w / 2, y, w, 1.5);
  }
  // an iron hand-chain pegged down one side
  ctx.strokeStyle = '#7a7480';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const pegs = [[-34, -132], [-44, -96], [-56, -60], [-70, -24], [-82, 2]];
  for (let i = 0; i < pegs.length - 1; i++) {
    const [x0, y0] = pegs[i], [x1, y1] = pegs[i + 1];
    ctx.moveTo(x0, y0 - 10);
    ctx.quadraticCurveTo((x0 + x1) / 2 + 3, (y0 + y1) / 2 - 2, x1, y1 - 10);
  }
  ctx.stroke();
  ctx.fillStyle = '#4a4450';
  for (const [x, y] of pegs) ctx.fillRect(x - 1.5, y - 12, 3, 12);
  // a last wisp of warmth
  for (let i = 0; i < 2; i++) {
    const k = (time * 0.18 + i / 2) % 1;
    ctx.fillStyle = `rgba(240,232,232,${0.22 * Math.sin(k * Math.PI)})`;
    circle(ctx, -10 + i * 24, -110 - k * 70, 8 + k * 12);
  }
}

// The Drained Tubes, in the Smoking Coast's sea cliff: the round mouth of an old lava tube, glassy-lipped, running
// down into the cliff. Shut (E2's gate): the sea got in somewhere below and is boiling off, so steam roars out of it
// in a white wall and the shallows at its lip hiss. open (when the Tubes ship): drained, dark and cold inside, its
// glassy walls catching the light, old rock steps going down, a drip now and then
function drawTubeMouth(ctx, time, _g, open = false) {
  ctx.fillStyle = '#2e2830'; // the sea cliff's face
  ctx.beginPath();
  ctx.moveTo(-120, 4);
  ctx.lineTo(-112, -150);
  ctx.quadraticCurveTo(-60, -190, 0, -184);
  ctx.quadraticCurveTo(70, -192, 112, -146);
  ctx.lineTo(120, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3e3640'; // columns in the old rock
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const x of [-96, -74, 76, 98]) {
    ctx.moveTo(x, -150);
    ctx.lineTo(x + 3, 0);
  }
  ctx.stroke();
  // the tube's mouth, a round hole with a glassy black lip
  ctx.fillStyle = '#121014';
  ctx.beginPath();
  ctx.ellipse(0, -52, 52, 56, 0, Math.PI, 0);
  ctx.lineTo(52, 4);
  ctx.lineTo(-52, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a5468';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, -52, 54, 58, 0, Math.PI, 0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(190,210,230,0.45)'; // the glassy shine on the lip
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, -52, 52, 56, 0, Math.PI * 1.15, Math.PI * 1.45);
  ctx.stroke();
  if (open) {
    // drained: old steps going down into the dark, the walls catching a little light, a drip
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `rgba(90,82,96,${0.9 - i * 0.2})`;
      ctx.fillRect(-30 + i * 6, -8 - i * 9, 60 - i * 12, 5);
    }
    ctx.strokeStyle = 'rgba(160,170,200,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-40, -40);
    ctx.quadraticCurveTo(-30, -80, 0, -96);
    ctx.stroke();
    const k = (time * 0.6) % 1;
    ctx.fillStyle = `rgba(200,220,240,${0.7 * (1 - k)})`;
    circle(ctx, 18, -100 + k * 90, 1.6);
    return;
  }
  // shut: steam roaring out in a white wall, the shallows hissing at its lip
  for (let i = 0; i < 12; i++) {
    const k = (time * 0.55 + i / 12) % 1;
    ctx.fillStyle = `rgba(245,242,240,${0.55 * Math.sin(k * Math.PI)})`;
    circle(ctx, Math.sin(i * 2.3 + time) * 26 + (i % 2 ? 1 : -1) * k * 30, -40 - k * 170, 18 + k * 34);
  }
  ctx.fillStyle = 'rgba(250,250,250,0.6)';
  ctx.beginPath();
  ctx.ellipse(0, -30, 46, 34 + Math.sin(time * 7) * 2, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(120,170,170,0.7)'; // seawater at the lip, boiling
  ctx.fillRect(-52, -4, 104, 8);
  for (let i = 0; i < 7; i++) {
    const k = (time * 2 + i * 0.37) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - k)})`;
    circle(ctx, -44 + i * 14, -2 - k * 6, 1.5 + k * 2);
  }
}

// The Ashwood, up the old charcoal road north out of Cinder Flats: its iron bridge over a lava channel has
// fallen in, one end still on the near bank, the truss sagging into the glow. Ash trees on the far side.
// open (E1, the update itself lifted it): the smiths hauled the truss out on chains and set it back on its
// stones, bright new plates riveted over the bent places (Slag's), the chains still hanging off the posts
function drawIronBridge(ctx, time, _g, open = false) {
  ctx.fillStyle = '#6a6062'; // the ash trees beyond, grey and bare
  for (const [x, h] of [[30, 120], [62, 150], [96, 110], [128, 140]]) {
    ctx.fillRect(x - 3, -h, 6, h - 30);
    ctx.beginPath();
    ctx.moveTo(x, -h + 30);
    ctx.lineTo(x - 18, -h + 6);
    ctx.moveTo(x, -h + 50);
    ctx.lineTo(x + 16, -h + 26);
    ctx.strokeStyle = '#6a6062';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  // the channel, glowing
  const pulse = 0.7 + 0.2 * Math.sin(time * 1.8);
  const g = ctx.createLinearGradient(0, -12, 0, 6);
  g.addColorStop(0, `rgba(255,140,70,${pulse})`);
  g.addColorStop(1, `rgba(255,220,120,${pulse})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-70, 6);
  ctx.quadraticCurveTo(-56, -14, -40, -16);
  ctx.lineTo(40, -16);
  ctx.quadraticCurveTo(56, -14, 70, 6);
  ctx.closePath();
  ctx.fill();
  // the near abutment, and the fallen truss tipping down into the channel
  ctx.fillStyle = '#4a3e46';
  ctx.beginPath();
  ctx.roundRect(-100, -24, 34, 28, 4);
  ctx.fill();
  if (open) return ironBridgeUp(ctx, time);
  ctx.strokeStyle = '#3a3438';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-74, -24);
  ctx.lineTo(30, 2);
  ctx.moveTo(-74, -44);
  ctx.lineTo(24, -14);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    const xa = -74 + t * 104, ya = -24 + t * 26, xb = -74 + t * 98, yb = -44 + t * 30;
    ctx.moveTo(xa, ya);
    ctx.lineTo(xb, yb);
    if (i < 5) ctx.lineTo(-74 + (t + 0.2) * 104, -24 + (t + 0.2) * 26);
  }
  ctx.stroke();
  // the far abutment, and a road post beyond
  ctx.fillStyle = '#4a3e46';
  ctx.beginPath();
  ctx.roundRect(66, -24, 34, 28, 4);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.3 + i / 3) % 1;
    ctx.fillStyle = `rgba(255,190,120,${Math.sin(k * Math.PI) * 0.7})`;
    circle(ctx, -20 + i * 22 + Math.sin(k * 6) * 4, -14 - k * 60, 1.6);
  }
}

function ironBridgeUp(ctx, time) {
  ctx.fillStyle = '#4a3e46'; // the far abutment
  ctx.beginPath();
  ctx.roundRect(66, -24, 34, 28, 4);
  ctx.fill();
  // the deck, level again from stone to stone, and the truss over it
  ctx.fillStyle = '#3a3438';
  ctx.fillRect(-74, -28, 148, 6);
  ctx.strokeStyle = '#3a3438';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-74, -48);
  ctx.lineTo(74, -48);
  ctx.moveTo(-74, -26);
  ctx.lineTo(-74, -48);
  ctx.moveTo(74, -26);
  ctx.lineTo(74, -48);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const x0 = -74 + i * 24.7;
    ctx.moveTo(x0, -26);
    ctx.lineTo(x0 + 24.7, -48);
    ctx.moveTo(x0 + 24.7, -26);
    ctx.lineTo(x0 + 24.7, -48);
  }
  ctx.stroke();
  // Slag's new plates over the bent places, bright, with rivets
  for (const [x, w] of [[-34, 20], [12, 24]]) {
    ctx.fillStyle = '#9a96a2';
    ctx.fillRect(x, -30, w, 9);
    ctx.fillStyle = '#d8d4dc';
    for (let k = 3; k < w; k += 6) circle(ctx, x + k, -25.5, 1.1);
  }
  // the chains it was hauled up on, still hanging off the posts
  ctx.strokeStyle = '#5e5a64';
  ctx.lineWidth = 2;
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#4a3e46';
    ctx.fillRect(s * 88 - 3, -66, 6, 42);
    ctx.beginPath();
    ctx.moveTo(s * 88, -62);
    ctx.quadraticCurveTo(s * 60, -36 + Math.sin(time * 1.2 + s) * 1.5, s * 50, -48);
    ctx.stroke();
  }
  // heat shimmering up off the channel through the deck
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.3 + i / 3) % 1;
    ctx.fillStyle = `rgba(255,190,120,${Math.sin(k * Math.PI) * 0.5})`;
    circle(ctx, -30 + i * 30 + Math.sin(k * 6) * 4, -30 - k * 50, 1.4);
  }
}

// The Old Foundry, up the Ashwood's slope at its west end: an old mine adit into the foundry's workings, a timbered
// mouth in the black rock with a rail running out of it, bricked up by the forge folk themselves: neat forge bricks,
// good mortar, a rusted lamp hook over it, no sign but the one the gate gets. Cold air leaks round one brick.
function drawAdit(ctx, time) {
  ctx.fillStyle = '#2e2830'; // the slope's rock face
  ctx.beginPath();
  ctx.moveTo(-120, 0);
  ctx.lineTo(-104, -120);
  ctx.quadraticCurveTo(-40, -168, 30, -150);
  ctx.quadraticCurveTo(96, -132, 112, -60);
  ctx.lineTo(120, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3e3640';
  ctx.beginPath();
  ctx.moveTo(-100, -110);
  ctx.quadraticCurveTo(-40, -156, 20, -142);
  ctx.lineTo(10, -132);
  ctx.quadraticCurveTo(-40, -142, -90, -102);
  ctx.closePath();
  ctx.fill();
  // the bricks filling the mouth
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-44, -96, 88, 96, [30, 30, 0, 0]);
  ctx.clip();
  ctx.fillStyle = '#8a5a48';
  ctx.fillRect(-44, -96, 88, 96);
  ctx.strokeStyle = '#c8b8a8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let r = 0; r < 12; r++) {
    const y = -r * 8;
    ctx.moveTo(-44, y);
    ctx.lineTo(44, y);
    for (let x = -44 + (r % 2) * 9; x < 44; x += 18) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 8);
    }
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(30,20,20,0.25)'; // soot up the bricks
  ctx.fillRect(-44, -96, 88, 30);
  ctx.restore();
  // the timber frame round the mouth
  ctx.fillStyle = '#4a3a34';
  ctx.fillRect(-52, -100, 10, 100);
  ctx.fillRect(42, -100, 10, 100);
  ctx.fillRect(-58, -108, 116, 12);
  ctx.fillStyle = 'rgba(20,14,14,0.4)';
  ctx.fillRect(-58, -98, 116, 3);
  // the rail running out of it, cut off at the bricks
  ctx.strokeStyle = '#6a646e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(-30, -2);
  ctx.moveTo(-34, 1);
  ctx.lineTo(70, 1);
  ctx.moveTo(-34, -3);
  ctx.lineTo(70, -3);
  ctx.stroke();
  ctx.fillStyle = '#4a3a34';
  for (let x = -30; x < 70; x += 14) ctx.fillRect(x, -1, 8, 3);
  // the rusted lamp hook, no lamp
  ctx.strokeStyle = '#7a5040';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -108);
  ctx.lineTo(0, -122);
  ctx.arc(4, -122, 4, Math.PI, 0);
  ctx.stroke();
  // cold air leaking round one brick, a thin wisp
  const k = (time * 0.4) % 1;
  ctx.fillStyle = `rgba(220,226,236,${0.35 * Math.sin(k * Math.PI)})`;
  circle(ctx, 18 + k * 10, -56 - k * 26, 3 + k * 4);
}

// The Brimstone Fields, up the cone's flank from Magma Heart: the path climbs into a field of vents crusted
// yellow, fuming. Nobody can breathe that air today.
function drawFumes(ctx, time) {
  ctx.fillStyle = '#6a5048'; // the flank, rising to the right
  ctx.beginPath();
  ctx.moveTo(-100, 4);
  ctx.quadraticCurveTo(0, -40, 130, -170);
  ctx.lineTo(130, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d8c060'; // sulphur crusts
  for (const [x, y, r] of [[-30, -10, 14], [10, -30, 18], [50, -66, 16], [86, -104, 14], [40, -20, 10], [110, -140, 12]]) ellipse(ctx, x, y, r, r * 0.45, -0.5);
  ctx.fillStyle = '#4a3a34'; // the vents
  for (const [x, y] of [[10, -32], [50, -68], [86, -106]]) ellipse(ctx, x, y, 6, 3, -0.5);
  // the path's marker cairns going up into it
  ctx.fillStyle = '#8a7a72';
  for (const [x, y] of [[-60, -6], [-24, -18]]) {
    ellipse(ctx, x, y, 6, 4);
    ellipse(ctx, x, y - 6, 4, 3);
  }
  // the fumes: yellow clouds rolling out of the vents
  for (let i = 0; i < 12; i++) {
    const k = (time * 0.14 + i / 12) % 1, src = [[10, -32], [50, -68], [86, -106]][i % 3];
    ctx.fillStyle = `rgba(226,214,120,${0.42 * Math.sin(k * Math.PI)})`;
    circle(ctx, src[0] - k * 70 + Math.sin(i * 1.7 + time * 0.5) * 10, src[1] - k * 90, 14 + k * 34);
  }
}

// The thermal column (atlas Phase 6): the balloon lies deflated in its cradle on a ledge, patched, its basket
// tipped and its burner cold. Behind it the column of hot air shimmers up into the sky, and stalls.
function drawBalloon(ctx, time) {
  // the column's shimmer, rising behind
  const stall = 0.5 + 0.5 * Math.sin(time * 0.35);
  for (let i = 0; i < 8; i++) {
    const y = -40 - i * 40, wob = Math.sin(time * 2 + i) * 6 * stall;
    ctx.fillStyle = `rgba(255,220,190,${0.12 * stall * (1 - i / 9)})`;
    ellipse(ctx, 30 + wob, y, 40 + i * 4, 22);
  }
  // the ledge and the cradle
  ctx.fillStyle = '#4a3a44';
  ctx.beginPath();
  ctx.roundRect(-110, -22, 230, 26, 6);
  ctx.fill();
  ctx.strokeStyle = '#6a5040';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (const x of [-80, -20, 40, 90]) {
    ctx.moveTo(x, -22);
    ctx.lineTo(x + 6, -56);
  }
  ctx.moveTo(-80, -56);
  ctx.lineTo(96, -56);
  ctx.stroke();
  // the envelope, deflated, draped over the cradle in folds, with patches
  ctx.fillStyle = '#c0605a';
  ctx.strokeStyle = '#7a3a38';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-100, -26);
  ctx.quadraticCurveTo(-90, -78, -40, -70);
  ctx.quadraticCurveTo(-10, -96, 30, -74);
  ctx.quadraticCurveTo(70, -92, 104, -60);
  ctx.quadraticCurveTo(118, -40, 110, -24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#e8c45a'; // its gores
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const x of [-60, -20, 20, 60]) {
    ctx.moveTo(x, -28);
    ctx.quadraticCurveTo(x + 8, -60, x + 4, -80);
  }
  ctx.stroke();
  ctx.fillStyle = '#d8c8a8'; // patches
  ctx.fillRect(-48, -60, 14, 10);
  ctx.fillRect(48, -54, 12, 12);
  // the basket, tipped on its side, and the burner, cold
  ctx.fillStyle = '#a8784a';
  ctx.strokeStyle = '#6a4a2e';
  ctx.beginPath();
  ctx.roundRect(-150, -36, 40, 34, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#6a4a2e';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = -30; y < 0; y += 6) {
    ctx.moveTo(-150, y);
    ctx.lineTo(-110, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#5e5a66';
  ctx.beginPath();
  ctx.roundRect(-140, -50, 20, 14, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,190,175,0.8)'; // slack ropes from the basket to the envelope
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-112, -34);
  ctx.quadraticCurveTo(-104, -10, -96, -30);
  ctx.moveTo(-112, -20);
  ctx.quadraticCurveTo(-106, 0, -100, -26);
  ctx.stroke();
}

const DRAW = { tubemouth: drawTubeMouth, bridge: drawBridge, stump: drawStump, ladder: drawLadder, thorns: drawThorns, flooded: drawFlooded, trunk: drawTrunk, snowslide: drawSnowslide, icestair: drawIcestair, crevasse: drawCrevasse, icefall: drawIcefall, geyser: drawGeyser, lavatongue: drawLavaTongue, ironbridge: drawIronBridge, fumes: drawFumes, balloon: drawBalloon, adit: drawAdit };
// The Thornheart's root knot, split open at its east end (FB1 (b)): two great roots pried apart into a dark slot
// going down, torn bark pale along the edges, a faint green glow far below (the Sunken Road's seed pods) and a
// white rose petal or two drifting into it. The update itself split it: no quest
function drawRootSplit(ctx, time) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.9);
  const dg = ctx.createRadialGradient(0, -40, 4, 0, -60, 120);
  dg.addColorStop(0, `rgba(170,240,150,${0.18 + 0.1 * pulse})`);
  dg.addColorStop(1, 'rgba(170,240,150,0)');
  ctx.fillStyle = dg;
  ctx.fillRect(-120, -190, 240, 200);
  // the slot between the roots
  ctx.fillStyle = '#0c080e';
  ctx.beginPath();
  ctx.moveTo(-34, 6);
  ctx.bezierCurveTo(-44, -60, -26, -130, -6, -176);
  ctx.bezierCurveTo(14, -130, 40, -60, 36, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(150,220,130,${0.25 + 0.15 * pulse})`;
  ctx.beginPath();
  ctx.ellipse(0, -6, 18, 7, 0, 0, TAU);
  ctx.fill();
  // the two roots, bent apart
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = i % 2 ? '#5e3a50' : '#4a2c42';
      ctx.lineWidth = 20 - i * 5;
      ctx.beginPath();
      ctx.moveTo(side * (46 + i * 12), 8);
      ctx.bezierCurveTo(side * (62 + i * 10), -70, side * (40 + i * 6), -140, side * (10 + i * 4), -190 + i * 10);
      ctx.stroke();
    }
    // torn bark, pale along the split
    ctx.strokeStyle = '#d8c0a0';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(side * 36, 0);
    ctx.bezierCurveTo(side * 48, -60, side * 30, -130, side * 6, -172);
    ctx.stroke();
    ctx.fillStyle = '#e9c6d4';
    for (let k = 0; k < 4; k++) {
      const y = -30 - k * 38, x = side * (52 - k * 8);
      ctx.beginPath();
      ctx.moveTo(x, y - 3);
      ctx.lineTo(x + side * 10, y - 6);
      ctx.lineTo(x, y + 3);
      ctx.closePath();
      ctx.fill();
    }
  }
  // a petal drifting down into it
  const py = -150 + ((time * 22) % 150), px = Math.sin(time * 1.3) * 8;
  ctx.fillStyle = `rgba(251,246,244,${0.8 * (1 - (py + 150) / 150)})`;
  ellipse(ctx, px, py, 3, 1.8, time);
}

// The Hall Troll's wall at the Blue Halls' east end, fallen over (FB2 (b)): the blocks lie tumbled on the floor to
// the west, and in the back wall where it stood there's a dark slot going down, the top of the cutters' old ladder
// sticking up out of it, rimed grey, a cold blue glow far below (the Old Ice). The update itself knocked it over:
// no quest
const FALLEN = [[-58, -2, 0.25], [-96, -1, -0.12], [-132, 0, 0.5], [-74, -30, 0.9], [-112, -27, -0.35], [44, -1, -0.2]];
function drawFallenWall(ctx, time) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.7);
  // the slot behind where the wall stood
  const dg = ctx.createRadialGradient(0, -20, 4, 0, -50, 110);
  dg.addColorStop(0, `rgba(120,170,255,${0.2 + 0.08 * pulse})`);
  dg.addColorStop(1, 'rgba(120,170,255,0)');
  ctx.fillStyle = dg;
  ctx.fillRect(-110, -180, 220, 190);
  ctx.fillStyle = '#030816';
  ctx.beginPath();
  ctx.moveTo(-42, 4);
  ctx.lineTo(-46, -70);
  ctx.lineTo(-34, -120);
  ctx.lineTo(-18, -168);
  ctx.lineTo(6, -150);
  ctx.lineTo(24, -172);
  ctx.lineTo(40, -110);
  ctx.lineTo(46, -40);
  ctx.lineTo(44, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(168,212,250,0.55)'; // the clean break where the wall stood against the ice
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = `rgba(130,180,255,${0.22 + 0.12 * pulse})`;
  ctx.beginPath();
  ctx.ellipse(0, -4, 26, 7, 0, 0, TAU);
  ctx.fill();
  // the top of the old ladder, poking up out of the dark: grey wood, rimed
  for (const sx of [-16, 16]) {
    ctx.fillStyle = '#6a6460';
    ctx.strokeStyle = '#2e2a2a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(sx - 3, -64, 6, 70, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(230,244,255,0.8)';
    ctx.fillRect(sx - 3, -64, 6, 3);
  }
  for (let y = -52; y < 0; y += 14) {
    ctx.fillStyle = '#5a5450';
    ctx.fillRect(-14, y, 28, 4);
    ctx.fillStyle = 'rgba(230,244,255,0.5)';
    ctx.fillRect(-14, y, 28, 1.2);
  }
  // the wall's stub, still standing, and its blocks tumbled to the west
  for (const [bx, by, a] of FALLEN) {
    ctx.save();
    ctx.translate(bx, by - 15);
    ctx.rotate(a);
    ctx.fillStyle = a > 0.4 ? '#3e78c0' : '#4682c8';
    ctx.strokeStyle = '#0e2a5a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-19, -14, 38, 29, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(168,212,250,0.5)';
    ctx.fillRect(-15, -10, 10, 3);
    ctx.strokeStyle = 'rgba(14,42,90,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(2, -8);
    ctx.lineTo(10, 2);
    ctx.lineTo(6, 10);
    ctx.stroke();
    ctx.restore();
  }
  // chips of ice scattered round
  ctx.fillStyle = 'rgba(190,225,255,0.85)';
  for (const [cx, cy, r] of [[-40, -2, 3], [-150, -1, 2.4], [-20, -1, 2], [62, -1, 2.6], [-118, -3, 1.8]]) ellipse(ctx, cx, cy, r * 1.6, r, cx);
}

const OPEN = { fallenwall: drawFallenWall, icestair: (ctx, time, g) => drawIcestair(ctx, time, g, true), snout: drawSnout, crevasse: (ctx, time, g) => drawCrevasse(ctx, time, g, true), icefall: (ctx, time, g) => drawIcefall(ctx, time, g, true), snowslide: drawSnowslideOpen, grotto: drawGrottoMouth, bridge: (ctx, time, g) => drawBridge(ctx, time, g, true), shore: drawShore, stump: (ctx, time, gate) => drawStump(ctx, time, gate, true), crack: drawCrack, ladder: (ctx, time, g) => drawLadder(ctx, time, g, true),
  flooded: (ctx, time, g) => drawFlooded(ctx, time, g, true), thorns: (ctx, time, g) => drawThorns(ctx, time, g, true), trunk: (ctx, time, g) => drawTrunk(ctx, time, g, true), rootsplit: drawRootSplit, geyser: (ctx, time, g) => drawGeyser(ctx, time, g, true), ironbridge: (ctx, time, g) => drawIronBridge(ctx, time, g, true),
  lavatongue: (ctx, time, g) => drawLavaTongue(ctx, time, g, true), tubemouth: (ctx, time, g) => drawTubeMouth(ctx, time, g, true) };
