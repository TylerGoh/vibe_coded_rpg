// Docs: docs/places/cliffs.md, docs/places/willowmere.md, docs/places/coves.md
// The Keeper ruins in Bramble Woods (the Wildwood, room FIELD): four mossy old stones with carvings you
// can read (E), the first clue that someone else lived on Greenhollow long ago. The branches have a stone
// each too (the weir stone under Willowmere's mill wheel, the tide post in Saltspray Coves). The text opens
// on the museum's fact-sheet card (src/museum.js, `set`: the stones in the same room). Story:
// story/world/regions/greenhollow.md; keep what they say to canon Tier 1 (story/canon.md): the Keepers,
// gears, an hourglass scratched out.
import { TAU, mulberry32, circle, ellipse } from './util.js';
import { FIELD, FIELD_GROUND, WILLOWMERE, COVES } from './shared/rpg.js';

const READ_RANGE = 56;

export const RUIN_STONES = [
  {
    x: 3620, shape: 'waystone', name: 'the Waystone', title: 'The Waystone',
    look: 'A standing stone three slimes tall, furred with moss on its shady side. A ring of gear teeth is carved round its middle, worn as soft as a river pebble. Whoever cut it knew exactly what a gear was, ages before anyone in Slimeville did.',
    legible: ["...THE KEEPERS' ROAD...", '...REST HERE, TRAVELLER. IT IS STILL TURNING...', '(the rest is moss)'],
    note: 'Someone has scratched a tiny smiling slime near the bottom. It looks much newer than the rest. Only a few hundred years newer.',
  },
  {
    x: 3850, shape: 'gate', name: 'the Fallen Gate', title: 'The Fallen Gate',
    look: 'Two great posts once held a stone beam across the path. One post still stands. The other leans on it like a tired friend, and the beam lies in the bracken, cracked in three. The briar grows thickest right here, as if it were trying to close the gap.',
    legible: ['KEEP... THE HOUR... KEEP... THE TEETH... KEEP...', 'Every KEEP is cut deeper than the words around it, as if the carver pressed very hard.'],
    note: 'Bramblehogs like to nap in the shade of the leaning post. They do not like being woken up.',
  },
  {
    x: 4030, shape: 'roll', name: 'the Roll of Keepers', title: 'The Roll of Keepers',
    look: 'A long, low slab like a table, its top carved in rows. Each row begins with a little picture: a wave, a leaf, a star, a flame, a feather, a key, a bell, and more further down, where the slab has broken off. After each picture there was once a name. The names have worn away.',
    legible: ['THESE KEPT THE TURNING.', 'One row is different. Its picture, an hourglass, has been scratched over again and again with something sharp. Nothing else on the stone is damaged like that.'],
    note: 'A squirrel has filled one of the carved letters with acorns. It has decided the Roll is a cupboard.',
  },
  {
    x: 4215, shape: 'root', name: 'the Root Stone', title: 'The Root Stone',
    look: 'The roots of an enormous old stump have grown over this stone and gripped it like a hand. On the face they left bare is a carved tree, and its roots run off the edge of the stone and down into the ground, further than the carving goes.',
    legible: ['...THE ROOT RUNS UNDER ALL...', '...WHILE IT HOLDS...'],
    note: 'The tree in the carving looks a lot like the old apple tree in Slimeville. Funny, that.',
  },
  {
    room: WILLOWMERE, place: 'Willowmere', x: 742, shape: 'weir', // (right under the mill wheel's axle: WHEEL_X in src/willowmere.js)
    name: 'the weir stone', title: 'The Weir Stone',
    look: "A broad flat stone set into the bank where the millrace leaves the brook, polished by water for longer than anyone can say. The mill wheel's axle rests in a notch cut into its top, a notch far too neat to be an accident. A ring of gear teeth is carved round the notch.",
    legible: ['...KEEP THE WATER MOVING...', 'Under that, smaller, a row of little waves, each one carved a little further along than the last.'],
    note: "Somebody has chalked BUN'S on it in big floury letters. Somebody else has chalked an eel underneath, sticking its tongue out.",
  },
  {
    room: COVES, place: 'Saltspray Coves', x: 3460, shape: 'tidepost', name: 'the tide post', title: 'The Tide Post',
    look: 'A square stone post standing in the tide pools, crusted with barnacles to the height of a slime. Notches are cut up one face at even steps, each with a little carved wave beside it. The highest notches are far above anywhere the sea reaches now, on dry, sun-bleached stone.',
    legible: ['HIGH WATER', 'The notch marked HIGH WATER is the lowest one on the post. Above it, the notches go on climbing, and none of them is marked at all.'],
    note: "Fresh scratches by the waterline mark this year's tides, in a small careful hand. Beachcomber Moss's, probably. They creep upward.",
  },
];
for (const s of RUIN_STONES) {
  s.room ??= FIELD;
  s.place ??= 'Bramble Woods';
  s.set = RUIN_STONES.filter((o) => (o.room ?? FIELD) === s.room);
  s.index = s.set.indexOf(s);
}

// The stone you could read from where you stand (on the ground, not up on a branch)
export const ruinStoneAt = (me) => (me && me.grounded && !me.onPlat ? RUIN_STONES.find((s) => s.room === me.room && Math.abs(me.x - s.x) < READ_RANGE) : null) ?? null;

const STONE = '#a99cb3', STONE_DARK = '#887a94', STONE_LIGHT = '#c4b8cc', CARVE = '#6d6078', MOSS = '#7aa05e', MOSS_DARK = '#5f8448';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

// Behind the slimes, in front of the woods' trunks. near: the stone you could read now (it glows)
export function drawRuins(ctx, room, L, R, time, near) {
  const base = FIELD_GROUND + 2;
  for (const s of RUIN_STONES) {
    if (s.room !== room || !visible(s.x - 140, s.x + 140, L, R)) continue;
    ctx.save();
    ctx.translate(s.x, base);
    if (s === near) {
      // the carvings catch the light when you're close enough to read them
      const g = ctx.createRadialGradient(0, -70, 10, 0, -70, 120);
      g.addColorStop(0, 'rgba(255,236,170,0.35)');
      g.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-130, -200, 260, 200);
    }
    ({ waystone: drawWaystone, gate: drawGate, roll: drawRoll, root: drawRoot, weir: drawWeir, tidepost: drawTidePost })[s.shape](ctx, time, s === near);
    ctx.restore();
  }
}

function slab(ctx, x, y, w, h, r = 10) {
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.fillStyle = STONE_LIGHT;
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 4, Math.max(4, w * 0.22), h - 8, r * 0.6);
  ctx.fill();
  ctx.fillStyle = STONE_DARK;
  ctx.beginPath();
  ctx.roundRect(x + w - Math.max(5, w * 0.16), y + 6, Math.max(5, w * 0.16) - 3, h - 10, r * 0.5);
  ctx.fill();
}

function moss(ctx, x, y, w, seed) {
  const r = mulberry32(seed);
  ctx.fillStyle = MOSS_DARK;
  for (let i = 0; i < w / 9; i++) circle(ctx, x + r() * w, y + r() * 4, 4 + r() * 5);
  ctx.fillStyle = MOSS;
  for (let i = 0; i < w / 10; i++) circle(ctx, x + r() * w, y - 2 + r() * 3, 3 + r() * 4);
}

// a carved gear: a toothed ring cut into the stone
function carvedGear(ctx, x, y, r, teeth, glow) {
  ctx.strokeStyle = glow ? '#c9a24a' : CARVE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= teeth * 2; i++) {
    const a = (i / (teeth * 2)) * TAU, rr = i % 2 ? r : r + 4;
    const a2 = a + TAU / (teeth * 4);
    i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    ctx.lineTo(x + Math.cos(a2) * rr, y + Math.sin(a2) * rr);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.38, 0, TAU);
  ctx.stroke();
}

// worn letters: little scratches in rows
function scratches(ctx, x, y, w, rows, seed, glow) {
  const r = mulberry32(seed);
  ctx.strokeStyle = glow ? '#c9a24a' : CARVE;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let row = 0; row < rows; row++) {
    for (let cx = x; cx < x + w - 4; cx += 5 + r() * 4) {
      if (r() < 0.3) continue; // worn away
      const yy = y + row * 9;
      ctx.moveTo(cx, yy);
      ctx.lineTo(cx + (r() - 0.5) * 3, yy + 5);
    }
  }
  ctx.stroke();
}

function drawWaystone(ctx, time, glow) {
  // a tall menhir with a ring of gear teeth round its middle
  ctx.fillStyle = 'rgba(40,25,60,0.18)';
  ellipse(ctx, 0, 0, 46, 7);
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.moveTo(-32, 0);
  ctx.quadraticCurveTo(-36, -90, -22, -150);
  ctx.quadraticCurveTo(-4, -170, 16, -156);
  ctx.quadraticCurveTo(34, -100, 30, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE_LIGHT;
  ctx.beginPath();
  ctx.moveTo(-24, -6);
  ctx.quadraticCurveTo(-28, -90, -16, -144);
  ctx.quadraticCurveTo(-14, -90, -14, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE_DARK;
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.quadraticCurveTo(34, -100, 16, -156);
  ctx.quadraticCurveTo(24, -100, 20, 0);
  ctx.closePath();
  ctx.fill();
  carvedGear(ctx, 0, -86, 18, 10, glow);
  scratches(ctx, -16, -50, 34, 3, 41, glow);
  // the newer little smiley near the bottom
  ctx.strokeStyle = CARVE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(14, -16, 5, 0, TAU);
  ctx.moveTo(11, -15);
  ctx.quadraticCurveTo(14, -12, 17, -15);
  ctx.stroke();
  // moss down the shady side and over the top
  ctx.fillStyle = MOSS;
  for (let y = -150; y < -10; y += 14) circle(ctx, -24 + Math.sin(y * 0.1) * 4, y, 6 + Math.sin(y) * 2);
  ctx.fillStyle = MOSS_DARK;
  ellipse(ctx, -4, -160, 16, 6, -0.3);
  moss(ctx, -36, -2, 72, 11);
  void time;
}

function drawGate(ctx, time, glow) {
  ctx.fillStyle = 'rgba(40,25,60,0.18)';
  ellipse(ctx, 0, 0, 90, 8);
  // the standing post (left) and the one leaning on it (right)
  slab(ctx, -62, -150, 34, 150, 8);
  ctx.save();
  ctx.translate(30, 0);
  ctx.rotate(-0.32);
  slab(ctx, -16, -136, 32, 136, 8);
  scratches(ctx, -8, -110, 18, 6, 52, glow);
  ctx.restore();
  // KEEP, cut deep, down the standing post
  ctx.strokeStyle = glow ? '#c9a24a' : CARVE;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const y = -132 + i * 30;
    ctx.moveTo(-52, y);
    ctx.lineTo(-52, y + 16);
    ctx.moveTo(-46, y);
    ctx.lineTo(-40, y + 8);
    ctx.lineTo(-46, y + 16);
  }
  ctx.stroke();
  // the beam, cracked in three, lying in the bracken
  ctx.fillStyle = STONE_DARK;
  ctx.beginPath();
  ctx.roundRect(-110, -18, 44, 18, 5);
  ctx.roundRect(-62, -16, 40, 16, 5);
  ctx.fill();
  ctx.save();
  ctx.translate(70, -10);
  ctx.rotate(0.15);
  ctx.beginPath();
  ctx.roundRect(-20, -8, 46, 16, 5);
  ctx.fill();
  ctx.restore();
  // bracken and briar round the feet
  moss(ctx, -110, -2, 210, 13);
  ctx.strokeStyle = '#7a4f66';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const sway = Math.sin(time * 0.8) * 2;
  ctx.moveTo(-28, 0);
  ctx.quadraticCurveTo(-6, -70 + sway, 18, -30);
  ctx.stroke();
}

function drawRoll(ctx, time, glow) {
  ctx.fillStyle = 'rgba(40,25,60,0.18)';
  ellipse(ctx, 0, 0, 90, 8);
  // stubby legs and a long table-like slab, broken off at the right
  slab(ctx, -70, -34, 22, 34, 5);
  slab(ctx, 44, -34, 22, 34, 5);
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.moveTo(-86, -34);
  ctx.lineTo(-86, -66);
  ctx.quadraticCurveTo(-86, -72, -80, -72);
  ctx.lineTo(62, -72);
  ctx.lineTo(70, -60);
  ctx.lineTo(64, -52);
  ctx.lineTo(74, -40);
  ctx.lineTo(70, -34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE_LIGHT;
  ctx.fillRect(-82, -70, 140, 5);
  // rows: a little picture, then a worn-away name. The hourglass row is scratched out.
  const pics = ['wave', 'leaf', 'star', 'hour'];
  pics.forEach((p, i) => {
    const y = -60 + i * 6.5;
    ctx.strokeStyle = glow ? '#c9a24a' : CARVE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (p === 'wave') {
      ctx.moveTo(-78, y);
      ctx.quadraticCurveTo(-75, y - 3, -72, y);
      ctx.quadraticCurveTo(-69, y + 3, -66, y);
    } else if (p === 'leaf') {
      ctx.ellipse(-72, y, 5, 2, -0.3, 0, TAU);
    } else if (p === 'star') {
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI;
        ctx.moveTo(-72 - Math.cos(a) * 3, y - Math.sin(a) * 3);
        ctx.lineTo(-72 + Math.cos(a) * 3, y + Math.sin(a) * 3);
      }
    }
    ctx.stroke();
    if (p === 'hour') {
      ctx.strokeStyle = '#5a4c66';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let k = 0; k < 7; k++) {
        ctx.moveTo(-80 + k * 3, y - 3);
        ctx.lineTo(-74 + k * 3, y + 3);
      }
      ctx.stroke();
    }
    scratches(ctx, -60, y - 2, 110 - i * 8, 1, 60 + i, glow);
  });
  // acorns in a carved letter, and moss over the top
  ctx.fillStyle = '#b07a48';
  circle(ctx, 20, -47, 2.4);
  circle(ctx, 25, -46, 2.4);
  ctx.fillStyle = '#7a5434';
  circle(ctx, 20, -49, 1.6);
  circle(ctx, 25, -48, 1.6);
  ctx.fillStyle = MOSS;
  ellipse(ctx, -50, -72, 22, 5);
  ellipse(ctx, 34, -72, 16, 4);
  moss(ctx, -90, -2, 170, 17);
  void time;
}

function drawRoot(ctx, time, glow) {
  ctx.fillStyle = 'rgba(40,25,60,0.18)';
  ellipse(ctx, 0, 0, 80, 8);
  // the stone, leaning a little
  ctx.save();
  ctx.rotate(0.05);
  slab(ctx, -34, -112, 68, 112, 14);
  // the carved tree, its roots running off the stone's foot
  ctx.strokeStyle = glow ? '#c9a24a' : CARVE;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, -80, 15, 0, TAU);
  ctx.moveTo(0, -65);
  ctx.lineTo(0, -40);
  for (const dx of [-16, -7, 6, 17]) {
    ctx.moveTo(0, -40);
    ctx.quadraticCurveTo(dx * 0.5, -22, dx, 0);
  }
  ctx.stroke();
  ctx.restore();
  // the old stump behind and its roots gripping the stone like fingers
  ctx.fillStyle = '#7a5a5a';
  ctx.beginPath();
  ctx.roundRect(40, -70, 46, 70, [12, 12, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#9a7670';
  ellipse(ctx, 63, -70, 23, 6);
  ctx.strokeStyle = '#6a4a4a';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (const [y, len] of [[-58, 70], [-36, 64], [-14, 56]]) {
    ctx.beginPath();
    ctx.moveTo(46, y + 8);
    ctx.quadraticCurveTo(10, y - 12, 46 - len, y + 10);
    ctx.stroke();
  }
  ctx.strokeStyle = '#8a6464';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(44, -48);
  ctx.quadraticCurveTo(10, -66, -20, -48);
  ctx.stroke();
  ctx.fillStyle = MOSS;
  ellipse(ctx, -10, -112, 20, 6, 0.1);
  moss(ctx, -50, -2, 140, 19);
  void time;
}

// The weir stone: a broad, water-polished slab in the bank with a notch on top for the mill wheel's axle
// (the wheel itself is drawn by src/willowmere.js, just west of it)
function drawWeir(ctx, time, glow) {
  ctx.fillStyle = 'rgba(40,25,60,0.18)';
  ellipse(ctx, 0, 0, 70, 7);
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.moveTo(-58, 0);
  ctx.quadraticCurveTo(-62, -40, -40, -52);
  ctx.lineTo(-12, -54);
  ctx.lineTo(-8, -40); // the axle notch
  ctx.quadraticCurveTo(0, -34, 8, -40);
  ctx.lineTo(12, -54);
  ctx.lineTo(42, -50);
  ctx.quadraticCurveTo(62, -36, 58, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE_LIGHT;
  ctx.beginPath();
  ctx.roundRect(-50, -46, 22, 40, 8);
  ctx.fill();
  ctx.fillStyle = STONE_DARK;
  ctx.beginPath();
  ctx.roundRect(36, -44, 14, 40, 6);
  ctx.fill();
  // wet, darker band along the bottom where the water runs
  ctx.fillStyle = 'rgba(70,90,120,0.35)';
  ctx.beginPath();
  ctx.roundRect(-58, -14, 116, 14, 6);
  ctx.fill();
  carvedGear(ctx, 0, -36, 16, 9, glow);
  // the row of little waves, each a step further along
  ctx.strokeStyle = glow ? '#c9a24a' : CARVE;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const x = -44 + i * 18, y = -18 - i * 1.5;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 3, y - 3, x + 6, y);
    ctx.quadraticCurveTo(x + 9, y + 3, x + 12, y);
  }
  ctx.stroke();
  // chalk: BUN'S, and a rude eel
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(24, -30);
  ctx.quadraticCurveTo(32, -36, 40, -30);
  ctx.quadraticCurveTo(46, -26, 50, -30);
  ctx.stroke();
  ctx.fillStyle = MOSS;
  ellipse(ctx, -36, -51, 14, 4, -0.2);
  moss(ctx, -64, -2, 128, 23);
  // drips sparkling off the lip
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.9 + i / 3) % 1;
    ctx.fillStyle = `rgba(200,230,255,${0.8 * (1 - k)})`;
    circle(ctx, 48 + i * 4, -10 + k * 12, 1.8);
  }
}

// The tide post: a square stone post in the pools, barnacled to slime height, notched up one face
function drawTidePost(ctx, time, glow) {
  ctx.fillStyle = 'rgba(40,25,60,0.18)';
  ellipse(ctx, 0, 0, 40, 6);
  slab(ctx, -20, -170, 40, 170, 6);
  // the wet, barnacled foot
  ctx.fillStyle = 'rgba(70,100,120,0.4)';
  ctx.beginPath();
  ctx.roundRect(-20, -46, 40, 46, [0, 0, 6, 6]);
  ctx.fill();
  ctx.fillStyle = '#e8e0d4';
  for (const [bx, by] of [[-12, -10], [-4, -22], [8, -14], [12, -32], [-14, -36], [2, -40], [-6, -6], [14, -4]]) {
    circle(ctx, bx, by, 3);
    ctx.fillStyle = '#b8aca0';
    circle(ctx, bx, by, 1.2);
    ctx.fillStyle = '#e8e0d4';
  }
  // the notches, each with its little wave; the lowest one is the only one marked (HIGH WATER)
  ctx.strokeStyle = glow ? '#c9a24a' : CARVE;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const y = -52 - i * 16;
    ctx.moveTo(-18, y);
    ctx.lineTo(-6, y);
    ctx.moveTo(0, y - 2);
    ctx.quadraticCurveTo(3, y - 5, 6, y - 2);
    ctx.quadraticCurveTo(9, y + 1, 12, y - 2);
  }
  ctx.stroke();
  scratches(ctx, -16, -62, 30, 1, 77, glow);
  // this year's tides, scratched fresh by the waterline
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(10, -30 - i * 3);
    ctx.lineTo(18, -30 - i * 3);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(90,140,90,0.7)'; // a little seaweed
  ellipse(ctx, -18, -8, 4, 9, 0.3 + Math.sin(time * 1.4) * 0.15);
}
