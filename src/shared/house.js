// Docs: docs/places/houses.md
// Personal houses, shared by the browser and the server: house sizes (bought bigger with gold), the
// furniture catalogue, wallpapers and floors, the layout format, and the platforms furniture makes (so you
// can hop onto a bed or a bookshelf). A layout is { size, wall, floor, view, items: [{ k, x, y, f, id? }] }: view
// an index into TOWNS (whose backdrop shows through the windows and over the backyard), size
// an index into HOUSE_SIZES (only the server changes it, when you pay), k a FURNITURE id, x its centre, y its
// bottom (world px), f flipped, id (garden plots and pets) the number the server gave it: a plot's crop is
// kept under it (docs/places/alchemy.md), and a pet's belly (docs/places/pets.md). Items are drawn in their layer order (rugs, wall things, then the rest)
// and, within a layer, in array order. Drawings: src/house.js.
import { HOUSE_GROUND, ROOMS, STORE, STORE_W, TOWNS } from './sim.js';
import { MOBS, PETSHOP_W } from './rpg.js';

// Every house is an open-plan inside (x 0 → inside, big picture windows onto the sky) with a backyard
// right behind it (inside → inside + yard). Bigger sizes cost gold, paid once to expand for good; prices
// are set against the economy balance sheet (docs/economy.md, npm run economy): `aim` is the level the price
// is checked at, in minutes of farming there (L2: the smaller sizes 10-20, the big ones about 30).
export const HOUSE_SIZES = [
  { name: 'Cottage', inside: 960, yard: 720, pieces: 60, price: 0 },
  { name: 'Cozy Home', inside: 1280, yard: 960, pieces: 80, price: 2000, aim: 12 },
  { name: 'Family House', inside: 1600, yard: 1200, pieces: 100, price: 10000, aim: 22 },
  { name: 'Manor', inside: 1920, yard: 1440, pieces: 120, price: 30000, aim: 40 },
  { name: 'Estate', inside: 2400, yard: 1680, pieces: 150, price: 130000, aim: 65 },
  { name: 'Grand Estate', inside: 2880, yard: 2080, pieces: 180, price: 210000, aim: 120 },
];
export const sizeOf = (layout) => HOUSE_SIZES[layout?.size] ?? HOUSE_SIZES[0];
export const houseWidth = (layout) => sizeOf(layout).inside + sizeOf(layout).yard;
export const WALL_TOP = 64; // below the ceiling beams: wall things hang between here and the floor

// Furniture is bought at the furniture store in the village (src/store.js), one piece at a time, and
// stays yours: putting a piece away in the decorate panel keeps it for later. `price` scales with how big
// and grand a piece is (little things are pocket money, the piano and the garden tree are long-term goals;
// see docs/economy.md); `sec` is its section in the store's showroom.
// layer: 'rug' lies on the floor, behind everything · 'wall' hangs anywhere on the wall (inside only: the
// yard has no wall) · 'floor' stands on the floor (or the grass) or on top of other furniture. top: the
// height of its flat top, which becomes a one-way platform you can stand (and put things) on. yard: only
// goes in the backyard, on the grass. seat: { top, w } a narrow perch only slimes use (the swing's seat:
// nothing can be put on it). pet: a mini boss that roams the house (PETS, below). fixed: every house has
// exactly one, always out (it can be moved, never put away, never sold): the storage chest.
export const FURNITURE = {
  bed: { name: 'Bed', price: 8000, sec: 'Bedroom', w: 150, h: 70, layer: 'floor', top: 44 },
  sofa: { name: 'Sofa', price: 6000, sec: 'Living room', w: 140, h: 66, layer: 'floor', top: 34 },
  armchair: { name: 'Armchair', price: 1200, sec: 'Living room', w: 76, h: 70, layer: 'floor', top: 34 },
  beanbag: { name: 'Beanbag', price: 450, sec: 'Living room', w: 70, h: 40, layer: 'floor', top: 30 },
  table: { name: 'Table', price: 900, sec: 'Living room', w: 120, h: 60, layer: 'floor', top: 60 },
  chair: { name: 'Chair', price: 300, sec: 'Living room', w: 44, h: 74, layer: 'floor', top: 34 },
  dresser: { name: 'Dresser', price: 2500, sec: 'Bedroom', w: 100, h: 80, layer: 'floor', top: 80 },
  bookshelf: { name: 'Bookshelf', price: 7000, sec: 'Bedroom', w: 92, h: 160, layer: 'floor', top: 160 },
  fireplace: { name: 'Fireplace', price: 22000, sec: 'Living room', w: 140, h: 130, layer: 'floor', top: 112 },
  piano: { name: 'Piano', price: 30000, sec: 'Living room', w: 120, h: 96, layer: 'floor', top: 96 },
  lamp: { name: 'Floor lamp', price: 500, sec: 'Living room', w: 40, h: 124, layer: 'floor' },
  plant: { name: 'Plant', price: 150, sec: 'Little things', w: 44, h: 64, layer: 'floor' },
  tree: { name: 'Potted tree', price: 1500, sec: 'Bedroom', w: 70, h: 136, layer: 'floor' },
  tablelamp: { name: 'Table lamp', price: 200, sec: 'Little things', w: 30, h: 44, layer: 'floor' },
  teapot: { name: 'Teapot', price: 120, sec: 'Little things', w: 40, h: 30, layer: 'floor' },
  cake: { name: 'Cake', price: 150, sec: 'Little things', w: 40, h: 34, layer: 'floor' },
  fishbowl: { name: 'Fishbowl', price: 300, sec: 'Little things', w: 40, h: 38, layer: 'floor' },
  plushie: { name: 'Slime plush', price: 250, sec: 'Little things', w: 38, h: 36, layer: 'floor' },
  books: { name: 'Books', price: 100, sec: 'Little things', w: 42, h: 30, layer: 'floor' },
  rug: { name: 'Rug', price: 1000, sec: 'Living room', w: 220, h: 10, layer: 'rug' },
  painting: { name: 'Painting', price: 600, sec: 'On the wall', w: 80, h: 60, layer: 'wall' },
  window: { name: 'Window', price: 800, sec: 'On the wall', w: 96, h: 96, layer: 'wall' },
  clock: { name: 'Clock', price: 400, sec: 'On the wall', w: 46, h: 58, layer: 'wall' },
  mirror: { name: 'Mirror', price: 500, sec: 'On the wall', w: 56, h: 80, layer: 'wall' },
  shelf: { name: 'Wall shelf', price: 450, sec: 'On the wall', w: 110, h: 18, layer: 'wall', top: 18 },
  bunting: { name: 'Bunting', price: 300, sec: 'On the wall', w: 170, h: 40, layer: 'wall' },
  // for the garden (they work inside too)
  bench: { name: 'Garden bench', price: 2000, sec: 'Garden', w: 120, h: 56, layer: 'floor', top: 30 },
  flowerbed: { name: 'Flower bed', price: 600, sec: 'Garden', w: 110, h: 40, layer: 'floor' },
  hedge: { name: 'Hedge', price: 800, sec: 'Garden', w: 100, h: 62, layer: 'floor', top: 58 },
  birdbath: { name: 'Birdbath', price: 900, sec: 'Garden', w: 50, h: 62, layer: 'floor' },
  lamppost: { name: 'Lamp post', price: 1200, sec: 'Garden', w: 34, h: 150, layer: 'floor' },
  oak: { name: 'Garden tree', price: 36000, sec: 'Garden', w: 170, h: 240, layer: 'floor', top: 170 },
  swing: { name: 'Swing', price: 15000, sec: 'Garden', w: 110, h: 170, layer: 'floor', seat: { top: 44, w: 52 } },
  pond: { name: 'Pond', price: 10000, sec: 'Garden', w: 160, h: 12, layer: 'rug' },
  // farming and alchemy (docs/places/alchemy.md): every house gets a couple free (GIFT in shared/alchemy.js)
  garden_plot: { name: 'Garden plot', price: 600, sec: 'Farm & lab', w: 110, h: 30, layer: 'floor', yard: true },
  alchemy_lab: { name: 'Alchemy lab', price: 3500, sec: 'Farm & lab', w: 140, h: 120, layer: 'floor' },
  // the storage chest: your second bag (CHEST_SLOTS in rpg.js; its contents are kept with your character,
  // server/rpg.js `chest`). Not in the store
  chest: { name: 'Storage chest', price: 0, w: 88, h: 60, layer: 'floor', top: 56, fixed: true },
};
export const FIXED = Object.keys(FURNITURE).filter((k) => FURNITURE[k].fixed);
export const CHEST_REACH = 70; // how near the chest you must be to open it
export const CHEST_X = 285; // where a house that has no chest yet gets one

// Pets: mini versions of the bosses, sold at the Pet Shop (PET_DISPLAY, below) and placed like furniture
// (they stand on the floor, where they're put, then wander off around the house: src/house.js). Prestige
// prices: about 20 minutes of farming at its boss's level, with a floor (PET_MIN in the balance sheet) so no
// pet is trivial (owner, L2 2026-10-23; before that, "around 50k per pet or more"); the later the boss, the
// dearer its pet. `npm run economy` lists and checks them.
// Each pet you own is one animal with its own belly (docs/places/pets.md): it must be fed, or it dies.
export const PET_SCALE = 0.4; // of the boss's own size
export const PETS = {
  sprout_king: 20000, turnipop: 20000, mother_mushroom: 20000, bramble_behemoth: 20000, snapjaw: 20000, tidemother: 22000, knotmole: 38000,
  hornet_queen: 46000, drowned_bosun: 47000, frost_queen: 48000, astral_wyrm: 82000, thorn_hart: 83000, root_warden: 84000, old_narwhal: 97000,
  rimehorn: 108000, ladon: 120000, hall_troll: 131000, pale_wyrm: 132000, ignis: 150000, sigrun: 151000, bellower: 152000, pyra: 155000, fenrir: 165000, greyback: 190000, colossus: 248000, chronos: 270000,
};
for (const [kind, price] of Object.entries(PETS)) {
  const m = MOBS[kind];
  FURNITURE[`pet_${kind}`] = { name: `Mini ${m.name.replace(/^The /, '').split(/,| the /)[0]}`, price, sec: 'Pets', w: m.petWH?.[0] ?? Math.round(m.w * PET_SCALE), h: m.petWH?.[1] ?? Math.round(m.h * PET_SCALE), layer: 'floor', pet: kind }; // (petWH: a pet with art of its own, not the boss shrunk)
}
export const LAYERS = ['rug', 'wall', 'floor'];

// ——— pets' bellies (docs/places/pets.md; the server keeps them: server/house.js) ———
// Owner (2026-10-21): a pet must be fully fed every 2 days or it dies, and it gets sadder the hungrier it
// is. A full belly lasts PET_STARVE_MS; food (ITEMS with `food`, sold at the Pet Shop) fills part of it.
// It goes down while you're offline and while the pet is put away too.
export const PET_STARVE_MS = 2 * 24 * 3600 * 1000;
export const PET_ROAM = 280; // a pet wanders up to this far either side of where it was put (less when sad)
export const PET_REACH = 90; // how near a pet you must be to feed it
// How it feels, from how full it is (0–1): the first whose `min` it reaches. src/pet-art.js draws each one.
export const PET_MOODS = [
  { min: 0.75, name: 'Happy' },
  { min: 0.5, name: 'Peckish' },
  { min: 0.25, name: 'Hungry and sad' },
  { min: 0, name: 'Starving and miserable' },
];
export const petMood = (full) => Math.max(0, PET_MOODS.findIndex((m) => full >= m.min));

export const WALLPAPERS = [
  { name: 'Peach', base: '#ffe9dc', pattern: '#ffd9c7', kind: 'stripes' },
  { name: 'Mint', base: '#e3f6ea', pattern: '#cfeedb', kind: 'dots' },
  { name: 'Lilac', base: '#efe6ff', pattern: '#e0d2fb', kind: 'diamonds' },
  { name: 'Sky', base: '#e2f1ff', pattern: '#cfe6fb', kind: 'stripes' },
  { name: 'Lemon', base: '#fff6d6', pattern: '#fbeab3', kind: 'dots' },
  { name: 'Rose', base: '#ffe3ec', pattern: '#fbd0de', kind: 'hearts' },
  { name: 'Night', base: '#3d3a5c', pattern: '#4a4670', kind: 'stars' },
];
export const FLOORS = [
  { name: 'Honey wood', a: '#d9a46c', b: '#c99360' },
  { name: 'Pale wood', a: '#ead2ae', b: '#dcc196' },
  { name: 'Dark wood', a: '#9c6b4e', b: '#8a5d43' },
  { name: 'Mint tiles', a: '#cdebd9', b: '#b8dfc8' },
  { name: 'Pink tiles', a: '#f6d3df', b: '#ecbfd0' },
];

// What a brand-new house looks like, so it feels like home before you decorate
export const DEFAULT_LAYOUT = {
  size: 0, wall: 0, floor: 0, view: 0,
  items: [
    { k: 'clock', x: 160, y: 250, f: false },
    { k: 'chest', x: CHEST_X, y: HOUSE_GROUND, f: false },
    { k: 'rug', x: 470, y: HOUSE_GROUND, f: false },
    { k: 'bed', x: 800, y: HOUSE_GROUND, f: true },
    { k: 'plushie', x: 830, y: HOUSE_GROUND - 44, f: true },
    { k: 'table', x: 470, y: HOUSE_GROUND, f: false },
    { k: 'teapot', x: 450, y: HOUSE_GROUND - 60, f: false },
    { k: 'chair', x: 380, y: HOUSE_GROUND, f: false },
    { k: 'plant', x: 200, y: HOUSE_GROUND, f: false },
    { k: 'lamp', x: 640, y: HOUSE_GROUND, f: false },
    { k: 'alchemy_lab', x: 1040, y: HOUSE_GROUND, f: false },
    { k: 'flowerbed', x: 1230, y: HOUSE_GROUND, f: false },
    { k: 'birdbath', x: 1330, y: HOUSE_GROUND, f: false },
    { k: 'garden_plot', x: 1460, y: HOUSE_GROUND, f: false },
    { k: 'garden_plot', x: 1600, y: HOUSE_GROUND, f: false },
  ],
};

// What a brand-new house owns: exactly the pieces it starts with
export const STARTER = (() => {
  const own = {};
  for (const it of DEFAULT_LAYOUT.items) own[it.k] = (own[it.k] ?? 0) + 1;
  return own;
})();
// How many of each piece a layout uses
export function placed(layout) {
  const n = {};
  for (const it of layout?.items ?? []) n[it.k] = (n[it.k] ?? 0) + 1;
  return n;
}
// Owned counts from the wire (or the DB), made safe: known pieces, whole numbers
export function cleanOwned(o) {
  const out = {};
  for (const [k, v] of Object.entries(o ?? {})) if (FURNITURE[k] && v > 0) out[k] = Math.min(999, Math.floor(v));
  for (const k of FIXED) out[k] = 1; // (everyone owns exactly one chest)
  return out;
}

const clampN = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(v) || 0)));
const index = (v, n) => clampN(v, 0, n - 1);

// Where a piece's middle can go: wall things inside, yard things in the backyard, the rest anywhere
const xRange = (def, size) => {
  const { inside } = HOUSE_SIZES[size];
  return [(def.yard ? inside : 0) + def.w / 2, (def.layer === 'wall' ? inside : houseWidth({ size })) - def.w / 2];
};

// A layout from the wire (or the DB), made safe: known pieces only, inside the house (wall things on the
// wall), at most its size's `pieces`, and (given `owned`) no more of a piece than its owner has bought.
// Plot and pet ids are kept (one piece per id: a repeat loses it, and the server sorts it out).
// The fixed pieces (the chest) are always there, exactly once: a layout without one gets it at CHEST_X.
export function cleanLayout(l, owned) {
  const size = index(l?.size, HOUSE_SIZES.length), { pieces } = HOUSE_SIZES[size];
  const items = [], used = {}, ids = new Set();
  const given = Array.isArray(l?.items) ? l.items : [];
  // (fixed pieces go first, so a full house still has room for them: the first one of each, or a new one)
  const fixed = FIXED.map((k) => given.find((it) => it?.k === k) ?? { k, x: CHEST_X, y: HOUSE_GROUND, f: false });
  for (const it of [...fixed, ...given.filter((it) => !FURNITURE[it?.k]?.fixed)]) {
    const def = FURNITURE[it?.k];
    if (!def || items.length >= pieces) continue;
    if (owned && !def.fixed && (used[it.k] = (used[it.k] ?? 0) + 1) > (owned[it.k] ?? 0)) continue;
    const [x0, x1] = xRange(def, size);
    const out = {
      k: it.k,
      x: clampN(it.x, x0, x1),
      y: def.pet ? HOUSE_GROUND : def.layer === 'floor' ? clampN(it.y, WALL_TOP + def.h, HOUSE_GROUND) : def.layer === 'rug' ? HOUSE_GROUND : clampN(it.y, WALL_TOP + def.h, HOUSE_GROUND - 20),
      f: !!it.f,
    };
    if ((it.k === 'garden_plot' || def.pet) && Number.isInteger(it.id) && it.id > 0 && !ids.has(it.id)) ids.add((out.id = it.id));
    items.push(out);
  }
  return { size, wall: index(l?.wall, WALLPAPERS.length), floor: index(l?.floor, FLOORS.length), view: index(l?.view, TOWNS.length), items: settle(items) };
}

// Nothing floats: a piece whose support was moved away drops onto whatever is below it (or the floor).
// Lowest pieces first, so a stack falls together.
function settle(items) {
  const order = items.filter((it) => FURNITURE[it.k].layer === 'floor').sort((a, b) => b.y - a.y);
  for (const it of order) {
    if (it.y >= HOUSE_GROUND || FURNITURE[it.k].pet) continue;
    let y = HOUSE_GROUND;
    for (const o of items) {
      const d = FURNITURE[o.k];
      if (o === it || !d.top || Math.abs(o.x - it.x) > d.w / 2 - 6) continue;
      const top = o.y - d.top;
      if (top >= it.y && top < y && o.y > it.y) y = top;
    }
    it.y = y;
  }
  return items;
}

// What a layout makes of its room (for sim.js setHouseRoom): its width, and the one-way platforms on top
// of its furniture
export function houseRoom(layout) {
  const platforms = [];
  for (const it of layout.items) {
    const def = FURNITURE[it.k];
    if (def.top) platforms.push({ x: it.x - def.w / 2 + 6, y: it.y - def.top, w: def.w - 12, kind: 'furniture' });
    if (def.seat) platforms.push({ x: it.x - def.seat.w / 2, y: it.y - def.seat.top, w: def.seat.w, kind: 'furniture' });
  }
  return { width: houseWidth(layout), platforms };
}

// Where a piece being carried would land with the pointer at (px, py): wall things hang where you point,
// rugs lie on the floor, and the rest stand on the highest furniture top (or the floor) at or below the
// pointer. layout: the house (its items: the other pieces).
export function snapPlacement(k, px, py, { size, items }) {
  const def = FURNITURE[k], [x0, x1] = xRange(def, size);
  const x = clampN(px, x0, x1);
  if (def.layer === 'rug' || def.pet) return { x, y: HOUSE_GROUND }; // (pets walk the floor)
  if (def.layer === 'wall') return { x, y: clampN(py + def.h / 2, WALL_TOP + def.h, HOUSE_GROUND - 20) };
  let y = HOUSE_GROUND;
  for (const it of items) {
    const o = FURNITURE[it.k];
    if (!o.top || Math.abs(it.x - x) > o.w / 2 - 6) continue;
    const top = it.y - o.top;
    if (top >= py - 24 && top < y && top - def.h >= WALL_TOP) y = top;
  }
  return { x, y };
}

// ——— the furniture store's showroom (drawn by src/store.js) ———
// One of every piece on display, section by section after an entrance lobby. The lobby has a numbered
// door to each section and each section has one back (museum style): they're doors in ROOMS[STORE], added
// here because the layout depends on FURNITURE, so both the server's and the client's physics take them.
export const STORE_SECTIONS = [
  { name: 'Living room', color: '#9fd8ff' },
  { name: 'Bedroom', color: '#ffb3c7' },
  { name: 'Little things', color: '#ffe28a' },
  { name: 'On the wall', color: '#c9b6ff' },
  { name: 'Garden', color: '#8fd18a' },
  { name: 'Farm & lab', color: '#c7e89a' },
];
// (pets have their own shop: PET_DISPLAY)
export const STORE_GROUND = 470;
export const STORE_PEDESTAL = 46; // little things stand on a pedestal so they're easy to see
const SHOW_FIRST = 920, SHOW_GAP = 52, SECTION_GAP = 220;
export const storePortalX = (i) => 250 + i * 100; // in the lobby
// Every piece on display { k, x, y (its bottom), small } and every section { name, color, x (its sign),
// x0, x1 (its wall band), back (its door back to the lobby; none for the first) }
export const DISPLAY = [], SHOW_SECTIONS = [];
{
  let x = SHOW_FIRST;
  for (const sec of STORE_SECTIONS) {
    const ks = Object.keys(FURNITURE).filter((k) => FURNITURE[k].sec === sec.name);
    if (!ks.length) continue;
    const x0 = x, small = sec.name === 'Little things';
    for (const k of ks) {
      const def = FURNITURE[k];
      DISPLAY.push({ k, x: x + def.w / 2, y: def.layer === 'wall' ? STORE_GROUND - 170 : small ? STORE_GROUND - STORE_PEDESTAL : STORE_GROUND, small });
      x += def.w + SHOW_GAP;
    }
    SHOW_SECTIONS.push({ ...sec, x: (x0 + x - SHOW_GAP) / 2, x0: x0 - 40, x1: x - SHOW_GAP + 40, back: x0 - 100 });
    x += SECTION_GAP;
  }
  if (x > STORE_W) console.warn(`the showroom needs ${x} px: raise STORE_W in sim.js`);
  SHOW_SECTIONS.forEach((s, i) => {
    ROOMS[STORE].doors.push({ x: storePortalX(i), w: 56, to: STORE, toX: s.back + 60, label: `go to section ${i + 1}: ${s.name}` });
    // (the first section starts right after the lobby: no way back needed)
    if (i) ROOMS[STORE].doors.push({ x: s.back, w: 56, to: STORE, toX: storePortalX(i), label: 'back to the entrance' });
  });
}

// ——— the Pet Shop's plinths (drawn by src/petshop.js) ———
// Every pet on a cushioned plinth, cheapest first, after Auntie Clover's counter. { k, x, y (its bottom) }
export const PET_PLINTH = 46;
export const PET_DISPLAY = [];
{
  let x = 820;
  const pets = Object.keys(FURNITURE).filter((k) => FURNITURE[k].pet).sort((a, b) => FURNITURE[a].price - FURNITURE[b].price);
  for (const k of pets) {
    const def = FURNITURE[k];
    PET_DISPLAY.push({ k, x: x + def.w / 2, y: STORE_GROUND - PET_PLINTH, small: true });
    x += def.w + 70;
  }
  if (x > PETSHOP_W) console.warn(`the Pet Shop needs ${x} px: raise PETSHOP_W in rpg.js`);
}
