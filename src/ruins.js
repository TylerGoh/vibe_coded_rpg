// Docs: docs/places/cliffs.md, docs/places/willowmere.md, docs/places/coves.md, docs/places/deep.md, docs/places/canopy.md, docs/places/wreck.md, docs/places/thornheart.md, docs/places/spine.md, docs/places/glacier.md
// The Keeper ruins in Bramble Woods (the Wildwood, room FIELD): four mossy old stones with carvings you
// can read (E), the first clue that someone else lived on Greenhollow long ago. The branches have a stone
// each too (the weir stone under Willowmere's mill wheel, the tide post in Saltspray Coves, the Listening
// Stone by Truffle's camp in the Mycelium Deep, the Lifted Stone by Acorn's treehouse in the Old Oak
// Canopy, the Hedge Stone in the Thornheart, the Road Stone on Keeper's Spine; on Frostpeak, the Rime Stone
// in the Rimeglass Glacier's Cutters' Camp, which may say a little more: Frostpeak's tier is canon Tier 2). Wreck Cave has the one reading here that isn't a stone: the
// wrecked ship's logbook (`wing` and `when` change the card's header lines). The text opens
// on the museum's fact-sheet card (src/museum.js, `set`: the stones in the same room). Story:
// story/world/regions/greenhollow.md; keep what they say to canon Tier 1 (story/canon.md): the Keepers,
// gears, an hourglass scratched out.
import { TAU, mulberry32, circle, ellipse } from './util.js';
import { FIELD, FIELD_GROUND, WILLOWMERE, COVES, MYCELIUM, CANOPY, WRECK, THORNHEART, THORN_W, SPINE, GLACIER } from './shared/rpg.js';

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
  {
    room: MYCELIUM, place: 'the Mycelium Deep', x: 900, shape: 'listening', name: 'the Listening Stone', title: 'The Listening Stone',
    look: 'A round-shouldered stone half swallowed by the glowing threads. Three of them grow straight through holes bored in it, as if it had been strung like a bead. A ring of gear teeth is carved round the holes. Put your ear to it and it hums, low and steady, the way a shell hums of the sea.',
    legible: ['WHAT ONE SHORE HEARS...', '...EVERY SHORE HEARS.', 'Under the words, a row of little islands, each joined to the next by one carved line. The line runs on off the edge of the stone.'],
    note: "A small card hangs off it on a string: PLEASE DO NOT LICK THE STONE. It's in Truffle's handwriting, and it looks like it was needed.",
  },
  {
    room: CANOPY, place: 'the Old Oak Canopy', x: 880, shape: 'lifted', name: 'the Lifted Stone', title: 'The Lifted Stone',
    look: 'A flat standing stone held up off the bough in a fist of bark. The oak grew round it long ago and has been lifting it ever since, a little every year, so now it sits where no stone has any business being. One face is carved with a ring of gear teeth, and under it an arrow, pointing up and east.',
    legible: ['...THE ROAD CLIMBS...', '...KEEP TO THE HIGH WAY...', 'The arrow points along the bough toward the far end of the canopy, and up.'],
    note: "Neat notches run down one edge, one a year: Ranger Acorn's, keeping count of how far the oak has lifted it. There are six. Below them, much older and almost grown over, there are a great many more.",
  },
  {
    room: WRECK, place: 'Wreck Cave', x: 1640, shape: 'log', name: "the ship's log", title: "The Brave Pippin's Log",
    wing: 'Wreck Cave · the wreck of the Brave Pippin', when: 'Written in a hurried hand · read by lamplight',
    look: "A sea chest has burst open at the foot of the wreck's stern, and the ship's logbook lies on top of it, swollen with seawater but still readable. The cover says the Brave Pippin, out of Greenhollow Bay. Little apples are stamped on the chest's brass corners.",
    legible: [
      'Out of Greenhollow Bay at first light, forty barrels of apples for Icefang. Fair wind. Tied up in the fjord before the morning was out. Sold the lot.',
      "The same run, a year on. The crossing took us till noon. The old hands say the sea's grown. Nonsense.",
      'The same run again. Dark before we raised the fjord. Rationed the apples. The crew are singing that song about the sea again.',
      'Storm off the south shore. Ran for the sea cave and lost the rudder on the rocks. All hands safe ashore. Leaving the old girl to the octopus, who seems to have moved in already.',
    ],
    note: 'Someone pressed a flower between the last pages, long ago. Someone much more recently left an apple core on the chest. The bilge rats say nothing.',
  },
  {
    room: THORNHEART, place: 'the Thornheart', x: THORN_W - 300, shape: 'hedge', name: 'the Hedge Stone', title: 'The Hedge Stone',
    look: 'Every briar in the Thornheart grows from one great knot of roots, and the knot is wrapped round a stone. The briar comes up through a slot cut clean through it, as if someone set a seed there on purpose. A ring of gear teeth is carved round the slot. The moss at its foot is pressed flat in the shape of something very large that sleeps here.',
    legible: ['...PLANTED TO KEEP THE ROAD...', '...LET IT GROW WHILE WE ARE AWAY...', 'Under the words, a hand carved pointing north, up toward the high ridge. The rest is under thorns.'],
    note: "White hairs are caught on the thorns all round it, and only here does the briar flower: little white roses, wherever the Thorn Hart has rubbed his antlers.",
  },
  {
    room: SPINE, place: "Keeper's Spine", x: 700, shape: 'road', name: 'the Road Stone', title: 'The Road Stone',
    look: 'A tall milestone at the edge of the old flagstones, where the road comes up onto the ridge. The wind has polished its west face smooth. The east face is cut with a road running away along a ridge, and at its end a round door with a ring of little pictures, the same as the Roll of Keepers. A carved root runs along under the road the whole way, from the stone\'s west edge to the door.',
    legible: ['THE HIGH ROAD. KEEP IT.', '...THE WARDEN HOLDS THE GATE UNTIL WE COME AGAIN...', 'The root under the carved road runs off the stone\'s west edge, toward the trees, and on toward the village.'],
    note: 'Little pebbles have been balanced along the top of the stone, one by one, by everyone who ever made it up here. Some of them have been there long enough to grow lichen.',
  },
  {
    room: GLACIER, place: 'the Rimeglass Glacier', x: 450, shape: 'rime', name: 'the Rime Stone', title: 'The Rime Stone',
    look: "A grey Keeper stone frozen inside a block of ice as clear as glass. The cutters found it deep in the glacier, cut the whole block out and stood it up by the camp, so you see the stone through the ice like a pebble at the bottom of a pool. Its face is carved with stars joined by lines, and under them two islands, so close together that the Keepers' road runs straight from one to the other across a strip of water no wider than a brook.",
    legible: ['...STEER BY THESE...', '...THE ROAD RUNS ON OVER THE WATER...', 'The stars carved on the stone are not where the stars are now. You look up, and back, and up again.'],
    note: "Axe marks go all the way round the block, careful and wide of the stone. Someone has chipped a little window in the ice over the stars, and keeps it polished.",
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
    ({ waystone: drawWaystone, gate: drawGate, roll: drawRoll, root: drawRoot, weir: drawWeir, tidepost: drawTidePost, listening: drawListening, lifted: drawLifted, log: drawLog, hedge: drawHedge, road: drawRoadStone, rime: drawRimeStone })[s.shape](ctx, time, s === near);
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

// The Listening Stone: a squat round stone with three of the Deep's glowing threads grown through it
function drawListening(ctx, time, glow) {
  ctx.fillStyle = 'rgba(20,10,30,0.25)';
  ellipse(ctx, 0, 0, 52, 7);
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.moveTo(-44, 0);
  ctx.quadraticCurveTo(-52, -90, 0, -104);
  ctx.quadraticCurveTo(52, -90, 44, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE_LIGHT;
  ctx.beginPath();
  ctx.moveTo(-36, -4);
  ctx.quadraticCurveTo(-42, -76, -10, -94);
  ctx.quadraticCurveTo(-26, -60, -24, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE_DARK;
  ctx.beginPath();
  ctx.moveTo(44, 0);
  ctx.quadraticCurveTo(50, -70, 22, -96);
  ctx.quadraticCurveTo(36, -60, 32, 0);
  ctx.closePath();
  ctx.fill();
  carvedGear(ctx, 0, -56, 26, 12, glow);
  scratches(ctx, -24, -18, 48, 1, 91, glow);
  // the threads, in one side and out the other
  const p = 0.7 + 0.3 * Math.sin(time * 1.8);
  ctx.lineCap = 'round';
  for (const [y, dy] of [[-70, -16], [-56, 4], [-42, 18]]) {
    ctx.strokeStyle = '#35585e';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-110, y + dy);
    ctx.quadraticCurveTo(-60, y + dy * 0.4, -20, y);
    ctx.moveTo(20, y);
    ctx.quadraticCurveTo(60, y - dy * 0.4, 110, y - dy);
    ctx.stroke();
    ctx.strokeStyle = `rgba(170,250,225,${0.6 * p})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#4a3c5c'; // the bored holes
    circle(ctx, -18, y, 5);
    circle(ctx, 18, y, 5);
    ctx.fillStyle = `rgba(200,255,235,${0.8 * p})`;
    circle(ctx, -18, y, 2.6);
    circle(ctx, 18, y, 2.6);
  }
  // Truffle's card on its string
  ctx.strokeStyle = 'rgba(230,210,180,0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, -84);
  ctx.lineTo(36, -66);
  ctx.stroke();
  ctx.save();
  ctx.translate(36, -60);
  ctx.rotate(0.12 + Math.sin(time * 1.1) * 0.05);
  ctx.fillStyle = '#f6eedc';
  ctx.fillRect(-9, -6, 18, 12);
  ctx.strokeStyle = 'rgba(91,74,107,0.6)';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    ctx.moveTo(-6, -2 + i * 3);
    ctx.lineTo(6, -2 + i * 3);
  }
  ctx.stroke();
  ctx.restore();
}

// The Lifted Stone (the Old Oak Canopy): a flat slab gripped in a fist of oak bark that rises out of the
// bough and holds it up off the ground, a carved gear and an arrow pointing up and east, Acorn's notches
function drawLifted(ctx, time, glow) {
  // the bark fist: thick ridges rising out of the bough and curling over the stone's foot
  const bark = ctx.createLinearGradient(-40, 0, 40, 0);
  bark.addColorStop(0, '#6e5040');
  bark.addColorStop(0.5, '#9a765e');
  bark.addColorStop(1, '#6a4c3c');
  ctx.fillStyle = bark;
  ctx.beginPath();
  ctx.moveTo(-58, 2);
  ctx.quadraticCurveTo(-40, -20, -44, -52);
  ctx.quadraticCurveTo(-20, -40, 0, -46);
  ctx.quadraticCurveTo(20, -40, 44, -54);
  ctx.quadraticCurveTo(40, -20, 58, 2);
  ctx.closePath();
  ctx.fill();
  // the stone, held up
  ctx.save();
  ctx.translate(0, -44);
  ctx.rotate(-0.04);
  slab(ctx, -32, -96, 64, 100, 12);
  carvedGear(ctx, 0, -64, 18, 10, glow);
  ctx.strokeStyle = glow ? '#c9a24a' : CARVE;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath(); // the arrow, up and east
  ctx.moveTo(-12, -14);
  ctx.lineTo(12, -38);
  ctx.moveTo(12, -38);
  ctx.lineTo(1, -37);
  ctx.moveTo(12, -38);
  ctx.lineTo(11, -27);
  ctx.stroke();
  scratches(ctx, -22, -90, 44, 1, 131, glow);
  // Acorn's notches down the edge
  ctx.strokeStyle = 'rgba(80,60,50,0.7)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(32, -80 + i * 7);
    ctx.lineTo(26, -80 + i * 7);
    ctx.stroke();
  }
  moss(ctx, -30, -98, 50, 141);
  ctx.restore();
  // the bark curling over the stone's foot, in front of it
  ctx.fillStyle = '#86664e';
  ctx.strokeStyle = 'rgba(60,40,30,0.5)';
  ctx.lineWidth = 2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 50, -6);
    ctx.quadraticCurveTo(s * 44, -48, s * 22, -60);
    ctx.quadraticCurveTo(s * 30, -40, s * 26, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  void time;
}

// Wreck Cave: a sea chest burst open at the foot of the wreck, the Brave Pippin's logbook open on top of it,
// its pages lifting in the cave's draught; brass corners stamped with apples. glow: the page catches the light
function drawLog(ctx, time, glow) {
  ctx.fillStyle = 'rgba(30,40,50,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 50, 7, 0, 0, TAU);
  ctx.fill();
  // the lid, fallen open behind
  ctx.save();
  ctx.translate(0, -40);
  ctx.rotate(-0.35);
  ctx.fillStyle = '#5e4232';
  ctx.strokeStyle = '#33241a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-40, -30, 80, 30, [10, 10, 2, 2]);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // the chest
  ctx.fillStyle = '#7a5640';
  ctx.strokeStyle = '#3e2a1e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-40, -42, 80, 42, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40,26,18,0.5)';
  ctx.lineWidth = 1.2;
  for (const y of [-28, -14]) {
    ctx.beginPath();
    ctx.moveTo(-38, y);
    ctx.lineTo(38, y);
    ctx.stroke();
  }
  // brass corners with a stamped apple
  for (const [x, y] of [[-40, -42], [32, -42], [-40, -8], [32, -8]]) {
    ctx.fillStyle = '#d8b050';
    ctx.fillRect(x, y, 8, 8);
    ctx.fillStyle = '#9a7a30';
    circle(ctx, x + 4, y + 4.5, 2);
  }
  // weed and a barnacle or two
  ctx.fillStyle = '#5f8a5a';
  for (const x of [-34, -20, 26]) ellipse(ctx, x, -2, 4, 7);
  // the logbook, open on top, pages lifting
  ctx.save();
  ctx.translate(0, -44);
  ctx.fillStyle = '#4a5a7a';
  ctx.beginPath();
  ctx.roundRect(-30, -4, 60, 7, 2);
  ctx.fill();
  for (const s of [-1, 1]) {
    ctx.fillStyle = glow ? '#fff6dc' : '#ece2c8';
    ctx.strokeStyle = '#9a8a6a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.quadraticCurveTo(s * 14, -9, s * 28, -4);
    ctx.lineTo(s * 28, 0);
    ctx.quadraticCurveTo(s * 14, -5, 0, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = glow ? 'rgba(120,90,40,0.8)' : 'rgba(90,80,70,0.5)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(s * 5, -3 - i * 1.5 + i * 0.5);
      ctx.lineTo(s * 23, -5 - i * 1.2 + i * 0.5);
      ctx.stroke();
    }
  }
  const lift = (Math.sin(time * 1.3) * 0.5 + 0.5) * 0.9;
  ctx.fillStyle = '#f4ead4'; // a page lifting in the draught
  ctx.beginPath();
  ctx.moveTo(0, -1);
  ctx.quadraticCurveTo(10, -6 - lift * 10, 20 - lift * 8, -5 - lift * 14);
  ctx.lineTo(22 - lift * 8, -2 - lift * 12);
  ctx.quadraticCurveTo(10, -2 - lift * 6, 0, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The Thornheart: the Hedge Stone, wrapped in the great root knot every briar in the Thornheart grows from;
// a thick cane rises through a slot cut in it and arches away, a carved gear round the slot, white roses
function drawHedge(ctx, time, glow) {
  // the root knot round its foot
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const s = i % 2 ? 1 : -1, k = 30 + i * 9;
    ctx.strokeStyle = i % 3 ? '#5e3a50' : '#6a4258';
    ctx.lineWidth = 12 - i;
    ctx.beginPath();
    ctx.moveTo(s * (70 + i * 6), 2);
    ctx.quadraticCurveTo(s * k, -30 - i * 4, -s * 10, -22 - i * 5);
    ctx.stroke();
  }
  slab(ctx, -34, -128, 68, 112, 12);
  // the slot and the cane rising through it, arching away over the top
  ctx.fillStyle = '#4e4258';
  ctx.beginPath();
  ctx.roundRect(-5, -108, 10, 74, 4);
  ctx.fill();
  carvedGear(ctx, 0, -70, 22, 12, glow);
  ctx.strokeStyle = '#5e3a50';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(0, -116);
  ctx.quadraticCurveTo(4, -170, 60, -168);
  ctx.quadraticCurveTo(100, -164, 116, -130);
  ctx.stroke();
  ctx.strokeStyle = '#7a4c62';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#e9c6d4';
  for (const [x, y, a] of [[-4, -126, -2.6], [10, -156, -1.4], [44, -168, -1.7], [78, -164, -1.1], [104, -146, -0.4]]) {
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a + 1.57) * 2.5, y + Math.sin(a + 1.57) * 2.5);
    ctx.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9);
    ctx.lineTo(x + Math.cos(a - 1.57) * 2.5, y + Math.sin(a - 1.57) * 2.5);
    ctx.closePath();
    ctx.fill();
  }
  scratches(ctx, -24, -122, 48, 1, 171, glow);
  scratches(ctx, -24, -38, 48, 2, 173, glow);
  moss(ctx, -36, -128, 60, 181);
  // white roses where the briar flowers, nodding
  for (const [x, y, r] of [[30, -166, 5], [70, -170, 4.5], [112, -136, 5], [-26, -24, 4]]) {
    const n = Math.sin(time * 1.2 + x) * 1;
    ctx.fillStyle = '#fbf6f4';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      circle(ctx, x + n + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.55);
    }
    ctx.fillStyle = '#f4d060';
    circle(ctx, x + n, y, r * 0.3);
  }
}

// The Road Stone (Keeper's Spine): a tall milestone at the road's edge, its face cut with a road running
// along a ridge to a round door, and a root carved under the road the whole way, off the stone's west edge
function drawRoadStone(ctx, time, glow) {
  slab(ctx, -30, -150, 60, 148, 14);
  const ink = glow ? '#c9a24a' : CARVE;
  // the ridge and the road along it
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, -70);
  ctx.quadraticCurveTo(-4, -96, 22, -92);
  ctx.stroke();
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(-22, -76);
  ctx.quadraticCurveTo(-4, -100, 12, -98);
  ctx.stroke();
  ctx.setLineDash([]);
  // the round door at its end, a ring of tiny marks round it
  ctx.beginPath();
  ctx.arc(16, -108, 8, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(16 + Math.cos(a) * 11, -108 + Math.sin(a) * 11, 0.9, 0, Math.PI * 2);
    ctx.stroke();
  }
  // the root, carved under the road and running off the west edge
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-31, -56);
  ctx.quadraticCurveTo(-6, -62, 10, -74);
  ctx.quadraticCurveTo(18, -82, 16, -98);
  ctx.stroke();
  carvedGear(ctx, 0, -128, 10, 10, glow);
  scratches(ctx, -22, -40, 44, 2, 191, glow);
  moss(ctx, -30, -150, 44, 193);
  // the pebbles balanced along its top
  ctx.fillStyle = STONE_LIGHT;
  ctx.strokeStyle = STONE_DARK;
  ctx.lineWidth = 1;
  for (const [x, r] of [[-16, 4], [-6, 3.4], [4, 4.4], [14, 3]]) {
    circle(ctx, x, -150 - r + 2, r);
    ctx.stroke();
  }
}

// The Rime Stone (the Rimeglass Glacier): a Keeper slab inside a tall block of clear ice, stars carved on it
// joined into a chart, two islands under them with the road running between, and a polished window in the ice
function drawRimeStone(ctx, time, glow) {
  // the stone, seen through the ice
  ctx.save();
  ctx.globalAlpha = 0.85;
  slab(ctx, -26, -132, 52, 122, 12);
  ctx.restore();
  const ink = glow ? '#c9a24a' : CARVE;
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 1.4;
  const stars = [[-14, -116], [-4, -108], [8, -118], [14, -104], [-10, -96], [4, -92]];
  ctx.beginPath();
  stars.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  for (const [x, y] of stars) circle(ctx, x, y, 1.8);
  // two islands and the road across the narrow strait
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-12, -64, 10, 5, 0, Math.PI, 0);
  ctx.moveTo(22, -64);
  ctx.ellipse(12, -64, 10, 5, 0, Math.PI, 0);
  ctx.stroke();
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(-16, -68);
  ctx.lineTo(16, -68);
  ctx.stroke();
  ctx.setLineDash([]);
  carvedGear(ctx, 0, -40, 8, 10, glow);
  // the block of ice round it: pale blue, a lit edge, bubbles, the polished window over the stars
  ctx.fillStyle = 'rgba(200,232,250,0.42)';
  ctx.strokeStyle = 'rgba(80,140,190,0.8)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-42, -2);
  ctx.lineTo(-44, -150);
  ctx.lineTo(-10, -160);
  ctx.lineTo(40, -152);
  ctx.lineTo(42, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.moveTo(-38, -6);
  ctx.lineTo(-40, -146);
  ctx.lineTo(-30, -149);
  ctx.lineTo(-30, -6);
  ctx.closePath();
  ctx.fill();
  for (const [x, y, r] of [[-20, -30, 2], [24, -50, 1.6], [30, -130, 2.4], [-28, -80, 1.4], [18, -20, 1.8]]) circle(ctx, x, y, r);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, -106, 20, 15, 0, 0, Math.PI * 2);
  ctx.stroke();
  const k = (time * 0.4) % 1; // a glint sliding across the window
  ctx.fillStyle = `rgba(255,255,255,${0.7 * Math.sin(k * Math.PI)})`;
  ctx.fillRect(-16 + k * 32, -118, 2, 22);
  // snow along the top and a drift at the foot
  ctx.fillStyle = '#f7fbff';
  ctx.beginPath();
  ctx.moveTo(-46, -150);
  ctx.quadraticCurveTo(-10, -170, 42, -154);
  ctx.quadraticCurveTo(0, -148, -46, -150);
  ctx.fill();
  ellipse(ctx, 0, 0, 52, 7);
}
