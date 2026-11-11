// Docs: docs/places/causeway.md
// The Lantern Causeway (room CAUSEWAY, src/shared/rpg.js; atlas Phase 8, L4): the Fen's main trail at its top, an old
// stone causeway straight out across the open mere toward the Hall of Lamps. Posts both sides with a lantern on every
// one, all lit; the dead's lights drifting thick on the black water either side; mist. West to east: the Causeway Foot
// (the near end, sunk until L4 and hauled back up onto new bog-oak piles, mud still on the stones, a waystone; no mobs),
// the Lamp Posts, the Open Mere (old arches standing over the road, some broken; the Will-Queen drifts here), the Toad's
// Reach (lily pads, toad spawn in the shallows, Grandfather's Pool beside the road: his den door at MIRE_DEN_X, drawn by
// dens.js), and at the far end the Hall of Lamps' door, shut with moth-silk (a gate, src/branch-gates.js). Far ahead on
// the horizon the Hall itself, a great hollow willow lit from inside, grows as you walk east. The hidden spot (last in
// CAUSEWAY_PLATFORMS) is the top of the broken arch over the Open Mere: a small lantern set facing back toward Wickmere,
// its tag reading "come home", when every other lamp faces the Hall. The sky and mere are Wickmere's (drawFenSky,
// drawFenAir: src/wickmere.js), without the far causeway (you're on it).
import { W, TAU, mulberry32, circle, ellipse } from './util.js';
import { CAUSEWAY_W, FIELD_GROUND, CAUSEWAY_PLATFORMS, CAUSEWAY_ZONES } from './shared/rpg.js';
import { drawFenSky, drawFenAir } from './wickmere.js';
import { drawReeds, drawTussock } from './shallows.js';
import { drawLantern } from './stillmere-art.js';

const GROUND = FIELD_GROUND;
const FOOT = CAUSEWAY_ZONES[0].x1, REACH = CAUSEWAY_ZONES[3];
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const HOME = CAUSEWAY_PLATFORMS.find((p) => p.kind === 'homeward');
const STONE = '#6e6878', STONE_D = '#44404e', STONE_L = '#8e889a';
const POST = '#3e3650';
const POST_GAP = 150; // a lamp post every this many px along the far side; the near side's are twice as far apart

// seeded scenery along the room
const lights = (() => { // the dead's lanterns adrift either side of the causeway
  const r = mulberry32(8001);
  return Array.from({ length: 70 }, () => ({ x: r() * CAUSEWAY_W, far: r() < 0.5, y: r(), v: 3 + r() * 6, p: r() * TAU, s: 0.6 + r() * 0.5 }));
})();
const clumps = (() => {
  const r = mulberry32(8011);
  return Array.from({ length: 36 }, () => ({ x: r() * CAUSEWAY_W, h: 40 + r() * 60, n: 3 + Math.floor(r() * 5), back: r() < 0.7 }));
})();
const pads = (() => { // lily pads on the water in the Toad's Reach, in front of the road
  const r = mulberry32(8021);
  return Array.from({ length: 30 }, () => ({ x: REACH.x0 + r() * (REACH.x1 - REACH.x0), y: GROUND + 56 + r() * 30, s: 0.7 + r() * 0.6, a: r() * TAU, bloom: r() < 0.25 }));
})();
const spawnStrings = (() => { // toad spawn, beaded strings of jelly in the shallows by the road
  const r = mulberry32(8031);
  return Array.from({ length: 12 }, () => ({ x: REACH.x0 + 100 + r() * (REACH.x1 - REACH.x0 - 400), y: GROUND + 60 + r() * 24, len: 30 + r() * 40, p: r() * TAU }));
})();
const moths = (() => { // small moths round the lamps
  const r = mulberry32(8041);
  return Array.from({ length: 40 }, () => ({ post: Math.floor(r() * (CAUSEWAY_W / POST_GAP)), p: r() * TAU, v: 2 + r() * 3, rr: 8 + r() * 12 }));
})();

// Everything on the Lantern Causeway behind the slimes
export function drawCauseway(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawFenSky(ctx, camX, time, CAUSEWAY_W, { causeway: false });
  drawHall(ctx, camX, time);
  ctx.restore();
  const L = camX - 120, R = camX + viewW + 120;
  // the far lights out on the open mere, small and slow (parallax: they sit further off)
  for (const f of lights) {
    if (!f.far) continue;
    const span = CAUSEWAY_W + 400;
    const x = ((((f.x + camX * 0.35 + time * f.v * 0.3) % span) + span) % span) - 200;
    if (!visible(x - 10, x + 10, L, R)) continue;
    drawLantern(ctx, x, 316 + f.y * 100 + Math.sin(time * 1.2 + f.p) * 1.2, 0.3 + f.y * 0.4, 0.8, time);
  }
  for (const c of clumps) if (c.back && visible(c.x - 30, c.x + 30, L, R)) drawReeds(ctx, c, time, true);
  // the far side's lamp posts, then the causeway itself
  for (let x = Math.floor(L / POST_GAP) * POST_GAP + 40; x < R; x += POST_GAP) if (x > FOOT - 200 && x < CAUSEWAY_W - 160) drawPost(ctx, x, GROUND - 6, 0.82, time, x);
  for (const m of moths) {
    const px = m.post * POST_GAP + 40;
    if (!visible(px - 30, px + 30, L, R) || px < FOOT - 200) continue;
    const a = time * m.v + m.p;
    ctx.fillStyle = 'rgba(232,224,208,0.7)';
    ellipse(ctx, px - 20 + Math.cos(a) * m.rr, GROUND - 92 + Math.sin(a * 1.3) * m.rr * 0.6, 2.2, 1.2, a);
  }
  drawRoad(ctx, Math.max(0, L), Math.min(CAUSEWAY_W, R), time);
  if (visible(0, FOOT + 80, L, R)) drawFoot(ctx, time);
  for (const p of CAUSEWAY_PLATFORMS) {
    if (!visible(p.x - 80, p.x + p.w + 80, L, R)) continue;
    if (p.kind === 'slab') drawSlab(ctx, p);
    else if (p.kind === 'arch') drawArch(ctx, p, p === CAUSEWAY_PLATFORMS[4]);
    else if (p.kind === 'islet') drawTussock(ctx, p, time);
  }
  if (HOME && visible(HOME.x - 80, HOME.x + HOME.w + 80, L, R)) drawHomeward(ctx, time);
  // the Toad's Reach: lily pads and toad spawn in the shallows beside the road
  for (const pd of pads) if (visible(pd.x - 20, pd.x + 20, L, R)) drawLily(ctx, pd, time);
  for (const s of spawnStrings) if (visible(s.x - 50, s.x + 50, L, R)) drawSpawn(ctx, s, time);
  // near lights, bobbing on the water in front of the road and drifting east
  for (const f of lights) {
    if (f.far) continue;
    const span = CAUSEWAY_W + 200;
    const wx = ((((f.x + time * f.v) % span) + span) % span) - 100;
    if (!visible(wx - 20, wx + 20, L, R)) continue;
    drawDrift(ctx, wx, GROUND + 52 + f.y * 26, f, time);
  }
  for (const c of clumps) if (!c.back && visible(c.x - 30, c.x + 30, L, R)) drawReeds(ctx, c, time, false);
  ctx.save();
  ctx.translate(camX, 0);
  drawFenAir(ctx, camX, time);
  ctx.restore();
}

// In front of the slimes (under the name tags): the near side's lamp posts, low and thin, and mist over the road's edge
export function drawCausewayFront(ctx, camX, viewW, time) {
  const L = camX - 200, R = camX + viewW + 200, gap = POST_GAP * 2;
  for (let x = Math.floor(L / gap) * gap + 115; x < R; x += gap) if (x > FOOT - 120 && x < CAUSEWAY_W - 200) drawPost(ctx, x, GROUND + 30, 0.7, time, x + 1);
  for (let x = Math.floor(L / 280) * 280; x < R; x += 280) {
    ctx.fillStyle = `rgba(214,212,226,${0.06 + 0.03 * Math.sin(time * 0.4 + x)})`;
    ellipse(ctx, x + Math.sin(time * 0.2 + x) * 60, GROUND + 26 + Math.sin(x * 0.01 + time * 0.3) * 5, 200, 15);
  }
}

// The Hall of Lamps, far off at the end of the causeway: a great hollow willow on an island of its own, its crown hung
// with moth-silk, light in every crack of it; it draws nearer (bigger) as you go east, and slides right so that at the
// room's end it stands behind its own door (the gate at HALL_GATE_X). Screen space.
function drawHall(ctx, camX, time) {
  const k = Math.max(0, Math.min(1, camX / (CAUSEWAY_W - W)));
  const x = 700 + k * 150, y = 302, s = 0.4 + k * 0.4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const g = ctx.createRadialGradient(0, -80, 10, 0, -80, 190);
  g.addColorStop(0, `rgba(255,214,150,${0.32 + 0.06 * Math.sin(time * 0.7)})`);
  g.addColorStop(1, 'rgba(255,214,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-190, -270, 380, 380);
  ctx.fillStyle = '#2a2438'; // the island it stands on
  ellipse(ctx, 0, 0, 120, 10);
  ctx.fillStyle = '#2e2840'; // the trunk, vast and hollow, splitting
  ctx.beginPath();
  ctx.moveTo(-60, 0);
  ctx.bezierCurveTo(-50, -60, -70, -110, -40, -150);
  ctx.lineTo(-10, -120);
  ctx.lineTo(12, -158);
  ctx.bezierCurveTo(60, -112, 48, -60, 62, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,214,150,0.75)'; // light in its cracks and its great door
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.quadraticCurveTo(-12, -40, 0, -54);
  ctx.quadraticCurveTo(12, -40, 10, 0);
  ctx.closePath();
  ctx.fill();
  for (const [cx, cy, h] of [[-36, -70, 16], [30, -86, 20], [-22, -118, 12], [40, -40, 10]]) ctx.fillRect(cx, cy, 2, h);
  ctx.fillStyle = 'rgba(214,206,226,0.55)'; // its crown: fronds hung with moth-silk, grey
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.95 + (i / 8) * Math.PI * 0.9;
    ellipse(ctx, Math.cos(a) * 90, -150 + Math.sin(a) * 60, 46, 22, a * 0.3);
  }
  for (let i = 0; i < 26; i++) { // lanterns hung all through it
    const a = (i * 2.399) % TAU, rr = 30 + ((i * 37) % 70);
    ctx.fillStyle = `rgba(255,226,168,${0.55 + 0.35 * Math.sin(time * 2 + i)})`;
    circle(ctx, Math.cos(a) * rr * 1.2, -150 + Math.sin(a) * rr * 0.6, 2.2);
  }
  ctx.restore();
}

// A lamp post: a tarred post with a crossarm and a lantern hung off it, a little name tag turning under it
function drawPost(ctx, x, foot, s, time, seed) {
  const h = 96 * s;
  ctx.fillStyle = POST;
  ctx.fillRect(x - 3 * s, foot - h, 6 * s, h);
  ctx.fillStyle = '#5a5070';
  ctx.fillRect(x - 4 * s, foot - h - 3 * s, 8 * s, 4 * s);
  ctx.strokeStyle = POST;
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(x, foot - h + 6 * s);
  ctx.lineTo(x - 18 * s, foot - h + 6 * s);
  ctx.stroke();
  drawLantern(ctx, x - 18 * s, foot - h + 20 * s, 1.1 * s, 1, time + seed);
  ctx.strokeStyle = 'rgba(232,220,192,0.6)'; // the tag
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - 18 * s, foot - h + 27 * s);
  ctx.lineTo(x - 18 * s, foot - h + 34 * s);
  ctx.stroke();
  ctx.fillStyle = '#e8dcc0';
  ctx.save();
  ctx.translate(x - 18 * s, foot - h + 37 * s);
  ctx.scale(Math.cos(time * 0.8 + seed), 1);
  ctx.fillRect(-3 * s, -2 * s, 6 * s, 4 * s);
  ctx.restore();
}

// The causeway: big dressed stones laid edge to edge, grey-violet, moss in the joints, a kerb along its far edge; its
// face goes down into the black water on piers
function drawRoad(ctx, L, R, time) {
  if (R <= L) return;
  ctx.fillStyle = STONE_D; // the face, down into the water
  ctx.fillRect(L, GROUND + 6, R - L, 40);
  ctx.fillStyle = STONE;
  ctx.fillRect(L, GROUND - 4, R - L, 12);
  ctx.fillStyle = STONE_L;
  ctx.fillRect(L, GROUND - 6, R - L, 3);
  ctx.strokeStyle = 'rgba(40,36,48,0.55)'; // the joints
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = Math.floor(L / 64) * 64; x < R; x += 64) {
    ctx.moveTo(x, GROUND - 4);
    ctx.lineTo(x, GROUND + 8);
    ctx.moveTo(x + 32, GROUND + 8);
    ctx.lineTo(x + 32, GROUND + 26);
    ctx.moveTo(x, GROUND + 26);
    ctx.lineTo(x, GROUND + 46);
  }
  ctx.moveTo(L, GROUND + 26);
  ctx.lineTo(R, GROUND + 26);
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,138,78,0.55)'; // moss in the joints
  for (let x = Math.floor(L / 64) * 64; x < R; x += 64) ellipse(ctx, x + 1, GROUND + 7, 4, 1.6);
  ctx.fillStyle = 'rgba(214,204,232,0.3)'; // the water lapping at its foot
  ctx.beginPath();
  ctx.moveTo(L, GROUND + 46);
  for (let x = Math.floor(L / 20) * 20; x <= R + 20; x += 20) ctx.lineTo(x, GROUND + 46 + Math.sin(x * 0.05 + time * 1.3) * 1.4);
  ctx.lineTo(R, GROUND + 50);
  ctx.lineTo(L, GROUND + 50);
  ctx.closePath();
  ctx.fill();
}

// The Causeway Foot: the stretch that had sunk, hauled back up onto new bog-oak piles; its stones still wet and muddy,
// weed caught on the posts, a coil of rope and a mallet left on it
function drawFoot(ctx, time) {
  for (let x = 30; x < FOOT; x += 90) { // the new piles, pale wood, under the road
    ctx.fillStyle = '#7a6448';
    ctx.fillRect(x - 6, GROUND + 6, 12, 44);
    ctx.fillStyle = '#9a8060';
    ctx.fillRect(x - 6, GROUND + 6, 12, 3);
  }
  ctx.fillStyle = 'rgba(70,58,44,0.55)'; // mud on the stones
  for (let x = 20; x < FOOT; x += 70) ellipse(ctx, x + ((x * 7) % 30), GROUND - 3, 18, 2.4);
  ctx.strokeStyle = 'rgba(110,138,78,0.8)'; // weed caught on the piles
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let x = 30; x < FOOT; x += 90) {
    ctx.moveTo(x - 6, GROUND + 14);
    ctx.quadraticCurveTo(x + Math.sin(time + x) * 3, GROUND + 24, x - 4, GROUND + 34);
  }
  ctx.stroke();
  ctx.strokeStyle = '#8a7a50'; // a coil of rope and a mallet, left where the work stopped
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(FOOT - 120, GROUND - 6, 12 - i * 3, 3 - i * 0.6, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = '#6a5640';
  ctx.fillRect(FOOT - 80, GROUND - 7, 22, 3);
  ctx.fillStyle = '#4a3c2c';
  ctx.fillRect(FOOT - 62, GROUND - 12, 10, 9);
}

// A pile of paving stones the causeway's builders left stacked beside the road, never laid (the platform is its top):
// dressed blocks in courses, moss on the top, a lantern set on a stone at its foot
function drawSlab(ctx, p) {
  const { x, y, w } = p;
  const rows = Math.max(1, Math.round((GROUND - y) / 26)), rh = (GROUND - y) / rows;
  for (let i = 0; i < rows; i++) {
    const ry = y + i * rh, inset = (rows - 1 - i) * 3 + ((i * 7) % 3) * 2;
    ctx.fillStyle = i % 2 ? STONE : '#7a7486';
    ctx.fillRect(x + inset, ry, w - inset * 2, rh - 1.5);
    ctx.strokeStyle = 'rgba(40,36,48,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let bx = x + inset + 40 + (i % 2) * 22; bx < x + w - inset - 10; bx += 46) {
      ctx.moveTo(bx, ry);
      ctx.lineTo(bx, ry + rh - 1.5);
    }
    ctx.stroke();
  }
  ctx.fillStyle = STONE_L;
  ctx.fillRect(x, y - 2, w, 4);
  ctx.fillStyle = 'rgba(110,138,78,0.65)';
  ellipse(ctx, x + w * 0.3, y, 16, 3);
  ellipse(ctx, x + w * 0.74, y, 10, 2.4);
}

// One of the old arches over the road: two square piers and a lintel (the platform is its top); a lantern hangs from the
// middle of it. `broken`: the Open Mere's, its east pier going on up, cracked off, to the top where the homeward lantern sits
function drawArch(ctx, p, broken) {
  const { x, y, w } = p;
  ctx.fillStyle = STONE_D;
  ctx.fillRect(x + 4, y + 10, 22, GROUND - y - 10);
  ctx.fillRect(x + w - 26, y + 10, 22, GROUND - y - 10);
  ctx.fillStyle = STONE;
  ctx.fillRect(x + 8, y + 10, 4, GROUND - y - 10);
  ctx.fillRect(x + w - 22, y + 10, 4, GROUND - y - 10);
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + 14);
  ctx.quadraticCurveTo(x + w / 2, y + 40, x, y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE_L;
  ctx.fillRect(x, y - 2, w, 4);
  ctx.strokeStyle = POST; // the hanging lamp
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 26);
  ctx.lineTo(x + w / 2, y + 44);
  ctx.stroke();
  drawLantern(ctx, x + w / 2, y + 52, 1.1, 1, x);
  if (broken && HOME) { // a second storey once: one slim pier still standing on the lintel, a broken capstone across it
    const px = HOME.x, pw = HOME.w, sx = px + pw - 44;
    ctx.fillStyle = STONE_D;
    ctx.fillRect(sx, HOME.y + 6, 30, y - HOME.y - 6);
    ctx.fillStyle = STONE;
    ctx.fillRect(sx + 4, HOME.y + 6, 4, y - HOME.y - 6);
    ctx.fillStyle = STONE; // the capstone, its west end snapped off
    ctx.beginPath();
    ctx.moveTo(px + 6, HOME.y - 2);
    ctx.lineTo(px + pw, HOME.y - 2);
    ctx.lineTo(px + pw, HOME.y + 8);
    ctx.lineTo(px + 14, HOME.y + 8);
    ctx.lineTo(px + 2, HOME.y + 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = STONE_L;
    ctx.fillRect(px + 6, HOME.y - 3, pw - 6, 2);
    ctx.fillStyle = 'rgba(110,138,78,0.6)';
    ellipse(ctx, px + pw - 20, HOME.y - 2, 9, 2);
  }
}

// The hidden spot: on the broken arch's top, a small lantern on a stub of iron, set facing back west toward Wickmere when
// every other lamp on the causeway faces the Hall; on its tag, in a child's letters, "come home"
function drawHomeward(ctx, time) {
  const x = HOME.x + HOME.w * 0.55, y = HOME.y - 2;
  ctx.fillStyle = POST;
  ctx.fillRect(x - 2, y - 26, 4, 26);
  ctx.strokeStyle = POST;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 24);
  ctx.lineTo(x - 12, y - 24); // (the crossarm points west, the wrong way)
  ctx.stroke();
  drawLantern(ctx, x - 12, y - 14, 0.95, 1, time);
  ctx.strokeStyle = 'rgba(232,220,192,0.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 8);
  ctx.lineTo(x - 12, y - 2);
  ctx.stroke();
  ctx.fillStyle = '#efe4c8';
  ctx.fillRect(x - 26, y - 2, 28, 9);
  ctx.font = "600 6px Fredoka, 'Trebuchet MS', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#5b4a6b';
  ctx.fillText('come home', x - 12, y + 2.6);
}

// A lily pad on the water, a notch cut in it, now and then a flower
function drawLily(ctx, pd, time) {
  const y = pd.y + Math.sin(time * 0.8 + pd.x) * 0.6;
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

// Toad spawn: a beaded string of clear jelly lying in the shallows, a dark dot in every bead
function drawSpawn(ctx, s, time) {
  for (let i = 0; i < s.len / 5; i++) {
    const bx = s.x + i * 5, by = s.y + Math.sin(i * 0.6 + time * 0.8 + s.p) * 2;
    ctx.fillStyle = 'rgba(214,220,200,0.35)';
    circle(ctx, bx, by, 2.6);
    ctx.fillStyle = 'rgba(30,26,36,0.8)';
    circle(ctx, bx, by, 0.9);
  }
}

// A lantern adrift on a little reed float, rocking
function drawDrift(ctx, x, y, f, time) {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 1.1 + f.p) * 1.5);
  ctx.rotate(Math.sin(time * 1.4 + f.p) * 0.08);
  ctx.fillStyle = '#6a5a42';
  ctx.beginPath();
  ctx.roundRect(-8 * f.s, -2, 16 * f.s, 4, 2);
  ctx.fill();
  drawLantern(ctx, 0, -8 * f.s, f.s, 1, time);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,226,168,0.15)';
  ellipse(ctx, x, y + 4, 10 * f.s, 1.6);
}
