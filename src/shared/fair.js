// Docs: docs/places/fair.md
// The Gathering Fair (room FAIR): the Keepers' fair from the last Gathering, caught out of time in the Stopped Hour, so a
// striped tent in every town still opens onto it (story/fair-plan.md). Shared by the client and the server: the room's
// layout, the tents, the booths and their seeded rounds (so the server can work out the best score a round allows and
// cap what a client claims), tickets and the prize counter. Cosmetic only (owner, 2026-11-20): tickets never become gold,
// EXP or power, and the games are free.

export const FAIR = 112; // room id
export const FAIR_W = 4900;
export const FAIR_GROUND = 450;
export const FAIR_EXIT_X = 150; // the tent flap: where you arrive, and the way back out to the town you came from

// The tent in each town, in TOWNS order (src/shared/sim.js adds the door to each town's room, and the way back out lands
// you here): Slimeville, Icefang Hamlet, Forgehold, the Skydocks Camp, Wickmere, Caravanserai
// (each clear of its town's waystone, NPCs' talk ranges and doors: E does one thing at a time)
export const FAIR_TENT_X = [1172, 2700, 1530, 2300, 2440, 2640];
export const TENT_W = 70;

// ——— the layout, west to east ———
// the Gate Plaza (the tent flap, the ticket booth, Ringmaster Fizz, the prize counter), the Big Top (scenery: laced shut,
// the ring being raked, F3), the Midway (the booths), Ride Row (the carousel, the Ferris wheel turning empty behind, the
// coaster's station roped off while its chain lift is greased, F2), the Hall of Mirrors, the Pier's End
export const FIZZ_X = 560; // Ringmaster Fizz, by the prize counter
export const PRIZE_X = 790; // the first prize on the counter
export const PRIZE_STEP = 95;
export const PRIZE_RANGE = 40;
export const BIGTOP_X = 1640; // the Big Top's middle (background)
export const CAROUSEL_X = 3420; // the carousel's middle
export const CAROUSEL_R = 190; // its deck's half-width
export const WHEEL_X = 3020; // the Ferris wheel's hub (background)
export const STATION_X = 3800; // the coaster's station (roped off until F2)
export const MIRRORS_X0 = 3980, MIRRORS_X1 = 4380; // the Hall of Mirrors' open front
export const MIRRORS = [ // each mirror: its middle, and how it bends you (src/fair.js)
  { x: 4030, bend: 'tall' },
  { x: 4130, bend: 'wide' },
  { x: 4230, bend: 'wobble' },
  { x: 4330, bend: 'flip' },
];
export const PIER_X = 4480;
export const POCKET_X = 4330; // the upside-down mirror: E steps through it into the pocket world (src/pocket.js; the dev sandbox's experiment) // where the boardwalk goes out over the water

export const BOOTH_RANGE = 70;
// The booths. game: what E starts (FAIR_GAMES below); shut: a stall the next phase opens, with its in-world reason (owner's
// rule: the next phase shows but doesn't open, never a "coming soon")
export const BOOTHS = [
  { id: 'gallery', x: 2120, name: 'Pop Gallery', game: 'gallery', canopy: ['#ff8fa6', '#fff4e6'] },
  { id: 'bonk', x: 2460, name: 'Bonk-a-Knotmole', game: 'bonk', canopy: ['#8fc8ff', '#fff4e6'] },
  { id: 'rings', x: 2790, name: 'Ring Toss', shut: 'Shutters down. A card on the counter: "Gone to fetch more rings. Back soon. - P."', canopy: ['#b9e58c', '#fff4e6'] },
  { id: 'ducks', x: 3140, name: 'Hook-a-Duck', shut: 'The pond is empty. A chalk line on the board: "Ducks out for a swim."', canopy: ['#ffd36e', '#fff4e6'] },
];
// other things E reads aloud (a toast): the closed rides
export const FAIR_LOOKS = [
  { x: BIGTOP_X, w: 120, look: 'look at the Big Top', says: 'The flaps are laced shut. Inside, someone is raking the ring and humming.' },
  { x: STATION_X, w: 110, look: 'look at the coaster station', says: 'A rope across the gate, and a sign: "Chain lift being greased. Mind the drips."' },
];

// Platforms (one-way): the ticket booth's roof, the booths' canopies, the carousel's horses and its canopy rim, the mirrors'
// roof, crates and the pier's posts. The horses are `horse` (a slime on one bobs with it: src/fair.js rideOf)
const booths = BOOTHS.map((b) => ({ x: b.x - 100, y: 300, w: 200, kind: 'canopy' }));
export const HORSES = [-135, -45, 45, 135].map((dx, i) => ({ x: CAROUSEL_X + dx - 24, y: 380, w: 48, kind: 'horse', i }));
export const FAIR_PLATFORMS = [
  { x: 340, y: 330, w: 150, kind: 'kiosk' },
  { x: 1180, y: 402, w: 70, kind: 'crates' },
  { x: 1230, y: 356, w: 50, kind: 'crates' },
  ...booths,
  ...HORSES,
  { x: CAROUSEL_X - 170, y: 250, w: 340, kind: 'carousel' },
  { x: 3640, y: 402, w: 70, kind: 'crates' },
  { x: MIRRORS_X0 + 10, y: 262, w: MIRRORS_X1 - MIRRORS_X0 - 20, kind: 'mirrors' },
  { x: 4560, y: 392, w: 60, kind: 'post' },
  { x: 4700, y: 360, w: 60, kind: 'post' },
];

// ——— tickets and the prize counter ———
// Prizes are Boutique-style cosmetics (COSMETICS in rpg.js, worn from the bag's Style row) priced in tickets, never gold
export const PRIZES = ['fair_balloon', 'candy_floss', 'paper_crown', 'star_specs', 'jester_cap'];
export const prizeX = (i) => PRIZE_X + i * PRIZE_STEP;
export const TICKETS_MAX = 99999;

// ——— the games ———
// One round is ROUND_S seconds. The server sends a seed; both sides build the same plan from it (when each target or
// mole shows, where, how fast, what it's worth), so the server knows the best score that round allows (maxScore) and
// caps the claim, scaled down if you leave early. Tickets: TICKETS_ROUND × your share of that best (at least one if
// you scored at all).
export const ROUND_S = 30;
export const TICKETS_ROUND = 24;
export const FAIR_GAMES = {
  gallery: { name: 'Pop Gallery', how: 'Pop the tin targets as they slide past. Gold stars are worth a lot. Leave Elder Mochi alone!' },
  bonk: { name: 'Bonk-a-Knotmole', how: 'Bonk the Knotmoles before they duck. Golden ones are worth more. Never bonk a Turnipop!' },
};

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pop Gallery, in the game card's own units (GALLERY_W × GALLERY_H): three rails, each sliding one way. A target: { t0,
// rail, dir, v (px/s), kind, pts, r }; it's at x = from + dir·v·(t − t0) while it's on the card.
export const GALLERY_W = 720, GALLERY_H = 380;
export const RAILS = [120, 210, 300]; // rail heights
export const GALLERY_KINDS = {
  tin: { pts: 10, r: 30 }, // a tin cut-out of a mob (src/fair-games.js picks which from its index)
  star: { pts: 50, r: 22 }, // a gold star, quick
  mochi: { pts: -25, r: 30 }, // a cardboard Elder Mochi: don't
};
export function galleryPlan(seed) {
  const r = rng(seed), out = [];
  for (let t = 0.3; t < ROUND_S - 0.5; t += 0.42 + r() * 0.5) {
    const rail = Math.floor(r() * 3), dir = rail === 1 ? -1 : 1, roll = r();
    const kind = roll < 0.1 ? 'star' : roll < 0.19 ? 'mochi' : 'tin';
    const v = (kind === 'star' ? 300 : 140) + r() * 90 + t * 2.5;
    out.push({ t0: t, rail, dir, v, kind, pts: GALLERY_KINDS[kind].pts, r: GALLERY_KINDS[kind].r, look: Math.floor(r() * 6) });
  }
  return out;
}
// where target g is at time t (null once it's off the card or before it comes on)
export function galleryAt(g, t) {
  if (t < g.t0) return null;
  const d = g.v * (t - g.t0), x = g.dir > 0 ? -g.r + d : GALLERY_W + g.r - d;
  if (x < -g.r - 2 || x > GALLERY_W + g.r + 2) return null;
  return { x, y: RAILS[g.rail] };
}

// Bonk-a-Knotmole: a 3×3 field of holes. A pop: { t0, hole, dur, kind, pts }, up from t0 for dur seconds; no hole has
// two at once. Quicker as the round goes on.
export const BONK_KINDS = {
  mole: { pts: 10 },
  gold: { pts: 30 },
  turnip: { pts: -15 }, // a Mini Turnipop: Auntie Clover would never forgive you
};
export function bonkPlan(seed) {
  const r = rng(seed), out = [], free = Array(9).fill(0);
  for (let t = 0.4; t < ROUND_S - 0.6; t += 0.62 - (t / ROUND_S) * 0.3 + r() * 0.3) {
    const open = free.map((f, i) => (f <= t ? i : -1)).filter((i) => i >= 0);
    if (!open.length) continue;
    const hole = open[Math.floor(r() * open.length)], roll = r();
    const kind = roll < 0.1 ? 'gold' : roll < 0.22 ? 'turnip' : 'mole';
    const dur = (kind === 'gold' ? 0.75 : 1.15) - (t / ROUND_S) * 0.4 + r() * 0.2;
    out.push({ t0: t, hole, dur, kind, pts: BONK_KINDS[kind].pts });
    free[hole] = t + dur + 0.15;
  }
  return out;
}

export const planOf = (game, seed) => (game === 'gallery' ? galleryPlan(seed) : game === 'bonk' ? bonkPlan(seed) : []);
// the best score a round of `game` with `seed` allows: every good target hit, nothing bad
export const maxScore = (game, seed) => planOf(game, seed).reduce((a, p) => a + Math.max(0, p.pts), 0);
// tickets for `score` out of a round's best `max`
export const ticketsFor = (score, max) => (score > 0 && max > 0 ? Math.max(1, Math.round(TICKETS_ROUND * Math.min(1, score / max))) : 0);

export const boothAt = (x) => BOOTHS.find((b) => Math.abs(x - b.x) < BOOTH_RANGE);
export const prizeAt = (x) => {
  const i = PRIZES.findIndex((_, i) => Math.abs(x - prizeX(i)) < PRIZE_RANGE);
  return i < 0 ? null : PRIZES[i];
};
export const lookAt = (x) => FAIR_LOOKS.find((l) => Math.abs(x - l.x) < l.w / 2);
