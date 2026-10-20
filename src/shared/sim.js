// Docs: docs/netcode.md, docs/world.md
// Shared by the browser and the server: the village's walkable layout and the slime physics.
// Both sides run exactly this step() at a fixed 60 Hz, so the client can predict its own slime
// and then replay unacknowledged inputs on top of each server snapshot (see src/net.js).

export const TICK_RATE = 60;
export const DT = 1 / TICK_RATE;

// ——— rooms ———
// Room 0 is the village; room 1 the lecture hall, room 2 the piano room, room 3 the history museum,
// room 4 the tutoring room (through a side door in the lecture hall), room 5 the Wildwood (mobs; rpg.js). Each room has its own ground, width and
// one-way platforms (MapleStory style: jump up through them, land on top, hold ↓ to drop down).
// `kind` tells the renderer how to draw each platform. Doors move you between rooms (press E).

export const WORLD_W = 5100; // the village
export const GROUND_Y = 450;
import { FIELD, FIELD_W, FIELD_GROUND, FIELD_PLATFORMS, FIELD_EXIT_X, FIELD_GATE_X, DENS, DEN_W, DEN_PLATFORMS, DEN_EXIT_X, MOBS, HIGHLANDS, HIGHLANDS_W, HIGHLANDS_EXIT_X, HIGHLANDS_DOOR_X, HIGHLAND_PLATFORMS, STAGES, CALDERA, CALDERA_W, CALDERA_EXIT_X, CALDERA_DOOR_X, CALDERA_PLATFORMS, CITADEL, CITADEL_W, CITADEL_EXIT_X, CITADEL_DOOR_X, CITADEL_PLATFORMS } from './rpg.js';
export const VILLAGE = 0, HALL = 1, PIANO = 2, MUSEUM = 3, TUTOR = 4;
export const STORE = 18; // the furniture store (after the stages and dens, rpg.js)
export { FIELD };

export const PLATFORMS = [
  { x: 360, y: 335, w: 190, kind: 'island' },
  { x: 190, y: 225, w: 150, kind: 'island' }, // (moved off the furniture store's roof)
  { x: 1180, y: 320, w: 170, kind: 'island' },
  { x: 1860, y: 335, w: 200, kind: 'deck' }, // the big tree's lower deck
  { x: 1900, y: 220, w: 140, kind: 'deck' }, // ...and its lookout
  { x: 2620, y: 335, w: 200, kind: 'island' },
  { x: 2830, y: 225, w: 150, kind: 'island' },
];

export const HALL_DOOR_X = 3370; // the lecture hall's front doors, in the village
export const HALL_EXIT_X = 385; // the way out, inside the hall
export const TUTOR_DOOR_X = 1110; // the lecture hall's side door to the tutoring room
export const TUTOR_EXIT_X = 70;
export const PIANO_DOOR_X = 3880; // the Music House's door, in the village
export const PIANO_EXIT_X = 30;
export const MUSEUM_DOOR_X = 4560; // the Grand Museum of History's doors, in the village
export const MUSEUM_EXIT_X = 120;
export const HOME_DOOR_X = 1515; // the mushroom house's door, in the village: everyone's own front door
export const STORE_DOOR_X = 621; // the furniture store's door, in the village (docs/places/houses.md)
export const STORE_EXIT_X = 90;
export const STORE_W = 7400; // the showroom: every piece of FURNITURE on display (src/shared/house.js DISPLAY)

// ——— personal houses (docs/places/houses.md) ———
// Every account has a house of its own behind the same door. House rooms aren't in ROOMS: their ids
// start at HOUSE_BASE (the server hands each account one, `state.home`) and roomDef() makes them on
// demand. Their width (the house's size, bought bigger with gold) and platforms (the tops of the
// furniture inside) come from its layout (src/shared/house.js houseRoom), which the server and the client
// both apply with setHouseRoom() whenever a house's layout arrives or changes.
export const HOUSE_BASE = 100;
export const HOUSE_W = 1680; // until its layout arrives: the smallest house (src/shared/house.js HOUSE_SIZES)
export const HOUSE_GROUND = 470;
export const HOUSE_EXIT_X = 80;
export const HOME = -1; // a door's `to` meaning "your own house"
export const isHouse = (room) => room >= HOUSE_BASE;

// The museum is one long gallery, a walk through time: a lobby, then seven wings of exhibits. The
// lobby has a portal into each wing and every wing has a door back to the lobby. Exhibit content
// lives in src/history.js (it must have exactly `count` exhibits per wing, in this order).
export const MUSEUM_LOBBY = 1300; // the lobby's width; the first wing starts here
export const EXHIBIT_SPACING = 200;
export const WING_GAP = 320; // from a wing's archway to its first exhibit
export const MUSEUM_WINGS = [
  { id: 'ancient', name: 'The Ancient World', span: 'c. 10,000 BCE – 476 CE', count: 8 },
  { id: 'medieval', name: 'The Medieval World', span: '600 – 1453', count: 6 },
  { id: 'renaissance', name: 'Renaissance & Exploration', span: '1440 – 1700', count: 5 },
  { id: 'revolutions', name: 'The Age of Revolutions', span: '1760 – 1865', count: 6 },
  { id: 'wars', name: 'The World Wars', span: '1914 – 1945', count: 6 },
  { id: 'dictators', name: 'Hall of Dictators', span: '20th century', count: 10 },
  { id: 'modern', name: 'Cold War & the Modern World', span: '1945 – today', count: 9 },
];
{
  let x = MUSEUM_LOBBY;
  for (const w of MUSEUM_WINGS) {
    w.x = x; // the wing's archway
    w.firstX = x + WING_GAP; // its first exhibit
    x = w.firstX + w.count * EXHIBIT_SPACING;
  }
}
export const MUSEUM_W = MUSEUM_WINGS.at(-1).firstX + MUSEUM_WINGS.at(-1).count * EXHIBIT_SPACING + 300;
export const exhibitX = (wing, i) => MUSEUM_WINGS[wing].firstX + i * EXHIBIT_SPACING;
export const wingPortalX = (i) => 420 + i * 120; // in the lobby
export const wingReturnX = (i) => MUSEUM_WINGS[i].x + 80; // back-to-lobby door at each wing's start

// The piano room's floor is a giant keyboard: white keys are the floor itself, black keys are raised
// blocks you can land on. Landing on a key plays it. Starts at C3 (MIDI 48).
export const KEY_W = 64; // white key width
const WHITE_KEYS = 30; // C3 … D7
const FIRST_MIDI = 48;
const WHITE_STEPS = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B, in semitones
export const whiteMidi = (i) => FIRST_MIDI + 12 * Math.floor(i / 7) + WHITE_STEPS[i % 7];
export const BLACK_KEYS = [];
for (let i = 0; i < WHITE_KEYS - 1; i++) {
  if ([0, 1, 3, 4, 5].includes(i % 7)) BLACK_KEYS.push({ x: (i + 1) * KEY_W - 19, y: 436, w: 38, kind: 'black', midi: whiteMidi(i) + 1 });
}

export const ROOMS = [
  {
    name: 'Slimeville', width: WORLD_W, ground: GROUND_Y, platforms: PLATFORMS,
    doors: [
      { x: HALL_DOOR_X, w: 80, to: HALL, toX: HALL_EXIT_X, label: 'enter the Lecture Hall' },
      { x: PIANO_DOOR_X, w: 70, to: PIANO, toX: PIANO_EXIT_X, label: 'enter the Music House' },
      { x: MUSEUM_DOOR_X, w: 90, to: MUSEUM, toX: MUSEUM_EXIT_X, label: 'enter the Grand Museum of History' },
      { x: HOME_DOOR_X, w: 60, to: HOME, toX: HOUSE_EXIT_X, label: 'go into your house' },
      { x: STORE_DOOR_X, w: 60, to: STORE, toX: STORE_EXIT_X, label: 'enter the furniture store' },
      { x: FIELD_GATE_X, w: 80, to: FIELD, toX: FIELD_EXIT_X, label: 'head out to the Wildwood (mobs!)' },
    ],
  },
  {
    name: 'Lecture Hall', width: 1200, ground: 470,
    platforms: [
      { x: 30, y: 420, w: 300, kind: 'stage' },
      { x: 450, y: 425, w: 490, kind: 'seats' },
      { x: 530, y: 380, w: 410, kind: 'seats' },
      { x: 610, y: 335, w: 330, kind: 'seats' },
      { x: 690, y: 290, w: 250, kind: 'seats' },
    ],
    doors: [
      { x: HALL_EXIT_X, w: 70, to: VILLAGE, toX: HALL_DOOR_X, label: 'leave the hall' },
      { x: TUTOR_DOOR_X, w: 70, to: TUTOR, toX: TUTOR_EXIT_X, label: 'go to the Tutoring Room' },
    ],
  },
  {
    name: 'Music House', width: WHITE_KEYS * KEY_W, ground: 470, platforms: BLACK_KEYS,
    doors: [{ x: PIANO_EXIT_X, w: 70, to: VILLAGE, toX: PIANO_DOOR_X, label: 'leave the Music House' }],
  },
  {
    name: 'Grand Museum of History', width: MUSEUM_W, ground: 470, platforms: [],
    doors: [
      { x: MUSEUM_EXIT_X, w: 80, to: VILLAGE, toX: MUSEUM_DOOR_X, label: 'leave the museum' },
      ...MUSEUM_WINGS.map((w, i) => ({ x: wingPortalX(i), w: 60, to: MUSEUM, toX: wingReturnX(i), label: `go to ${w.name}` })),
      ...MUSEUM_WINGS.map((w, i) => ({ x: wingReturnX(i), w: 60, to: MUSEUM, toX: wingPortalX(i), label: 'back to the lobby' })),
    ],
  },
  {
    name: 'Tutoring Room', width: 960, ground: 470, platforms: [],
    doors: [{ x: TUTOR_EXIT_X, w: 70, to: HALL, toX: TUTOR_DOOR_X, label: 'back to the Lecture Hall' }],
  },
  {
    // the mob stage (src/shared/rpg.js): ground, platforms and mobs, east of the village gate
    name: 'The Wildwood', width: FIELD_W, ground: FIELD_GROUND, platforms: FIELD_PLATFORMS,
    doors: [
      { x: FIELD_EXIT_X, w: 80, to: VILLAGE, toX: FIELD_GATE_X, label: 'back to Slimeville' },
      { x: HIGHLANDS_DOOR_X, w: 80, to: HIGHLANDS, toX: HIGHLANDS_EXIT_X, label: 'climb to the Frostpeak Highlands (Lv 13+)' },
      ...denDoors(FIELD),
    ],
  },
];
// rooms 6–8 and 10–11: the boss dens (DENS in rpg.js); room 9: the Frostpeak Highlands
for (const d of DENS) {
  ROOMS[d.room] = {
    name: d.name, width: DEN_W, ground: FIELD_GROUND, platforms: DEN_PLATFORMS,
    doors: [{ x: DEN_EXIT_X, w: 80, to: d.from, toX: d.entranceX, label: `flee back to ${STAGES[d.from].name}` }],
  };
}
ROOMS[HIGHLANDS] = {
  name: 'The Frostpeak Highlands', width: HIGHLANDS_W, ground: FIELD_GROUND, platforms: HIGHLAND_PLATFORMS,
  doors: [
    { x: HIGHLANDS_EXIT_X, w: 80, to: FIELD, toX: HIGHLANDS_DOOR_X, label: 'back down to the Wildwood' },
    { x: CALDERA_DOOR_X, w: 80, to: CALDERA, toX: CALDERA_EXIT_X, label: 'descend to the Emberdeep Caldera (Lv 28+)' },
    ...denDoors(HIGHLANDS),
  ],
};
// room 12: the Emberdeep Caldera · room 13: the Aether Citadel · rooms 14–17: their dens
ROOMS[CALDERA] = {
  name: 'The Emberdeep Caldera', width: CALDERA_W, ground: FIELD_GROUND, platforms: CALDERA_PLATFORMS,
  doors: [
    { x: CALDERA_EXIT_X, w: 80, to: HIGHLANDS, toX: CALDERA_DOOR_X, label: 'climb back to the Frostpeak Highlands' },
    { x: CITADEL_DOOR_X, w: 80, to: CITADEL, toX: CITADEL_EXIT_X, label: 'ride the skylift to the Aether Citadel (Lv 50+)' },
    ...denDoors(CALDERA),
  ],
};
// room 18: the furniture store's showroom (no platforms: the pieces are only on display; the doors between
// its lobby and sections are added by src/shared/house.js, which knows the layout)
ROOMS[STORE] = {
  name: 'Furniture Store', width: STORE_W, ground: 470, platforms: [],
  doors: [{ x: STORE_EXIT_X, w: 70, to: VILLAGE, toX: STORE_DOOR_X, label: 'leave the store' }],
};
ROOMS[CITADEL] = {
  name: 'The Aether Citadel', width: CITADEL_W, ground: FIELD_GROUND, platforms: CITADEL_PLATFORMS,
  doors: [{ x: CITADEL_EXIT_X, w: 80, to: CALDERA, toX: CITADEL_DOOR_X, label: 'ride the skylift down to the Caldera' }, ...denDoors(CITADEL)],
};
const houses = new Map(); // room id → its room definition
// The room definition for any room id, houses included (undefined for an id that isn't a room)
export function roomDef(room) {
  if (ROOMS[room] || !isHouse(room)) return ROOMS[room];
  let r = houses.get(room);
  if (!r) {
    r = { name: 'House', width: HOUSE_W, ground: HOUSE_GROUND, platforms: [], doors: [{ x: HOUSE_EXIT_X, w: 70, to: VILLAGE, toX: HOME_DOOR_X, label: 'go back out to Slimeville' }] };
    houses.set(room, r);
  }
  return r;
}
export const setHouseRoom = (room, { width, platforms }) => Object.assign(roomDef(room), { width, platforms });

function denDoors(from) {
  return DENS.filter((d) => d.from === from).map((d) => ({ x: d.entranceX, w: 90, to: d.room, toX: DEN_EXIT_X, label: `enter ${d.name} (boss: ${MOBS[d.boss].name}, Lv ${MOBS[d.boss].lvl})` }));
}

// The piano key (MIDI note) under a slime standing in the piano room, or null
export function pianoKeyAt(s) {
  if (s.room !== PIANO || !s.grounded) return null;
  if (s.onPlat) {
    const b = BLACK_KEYS.find((k) => s.x >= k.x - 16 && s.x <= k.x + k.w + 16 && Math.abs(s.y - k.y) < 1);
    return b ? b.midi : null;
  }
  return whiteMidi(Math.min(WHITE_KEYS - 1, Math.max(0, Math.floor(s.x / KEY_W))));
}

export const SPAWN_X = 220;

// Input bits, one byte per step
export const LEFT = 1, RIGHT = 2, JUMP = 4, DOWN = 8, USE = 16; // USE: E, goes through doors
export const DASH = 32, BLINK = 64; // the Mobility skills (Shift, V); they only act on the press
export const KEY_MASK = 127;

// ——— Mobility (skills.js 'wind' tree). state.mv packs the ranks (skills.js mobilityOf), set by the
// server from the character's skills and sent in every snapshot, so prediction knows them too.
// Timers are in ticks. ifr: ticks left of being untouchable (src/rpg.js skips every hit meanwhile).
export const DASH_TICKS = 10, DASH_V = 1100;
export const DASH_CD = [0, 180, 150, 120];
export const BLINK_DIST = [0, 200, 250, 300];
export const BLINK_CD = [0, 360, 300, 240];
export const FJ_VX = [0, 520, 600, 680], FJ_VY = 640; // Flash Jump: a second, forward jump in mid-air
export const IFR_DASH = 15, IFR_BLINK = 18, IFR_PHANTOM = 6; // + per Phantom Step rank
export const PHANTOM_CD = 0.15; // cooldowns this much shorter per Phantom Step rank
const rankBits = (mv, i) => (mv >> (i * 2)) & 3; // 0 Dash · 1 Flash Jump · 2 Blink · 3 Phantom Step

const GRAVITY = 2300; // same feel as Slime Hop
const JUMP_V = 800;
const MAX_FALL = 1400;
const WALK = 270;
const ACCEL_GROUND = 2600;
const ACCEL_AIR = 1500;
const DROP_TIME = 0.25; // seconds platforms are ignored after dropping through one
const HALF_W = 16; // half the slime's footprint, for platform edges and world bounds

// use: whether E was already held last step (doors only trigger on the press, not while held)
// jh / dh / bh: Jump / Dash / Blink held last step. mv: mobility ranks. dt: dash ticks left; dc / bc: dash / blink
// cooldowns; ifr: untouchable ticks; fj: the Flash Jump is used up (until you land)
// home: the room id of your own house (set by the server at login; 0 = none yet, so that door stays shut)
export const newState = (x = SPAWN_X) => ({ x, y: GROUND_Y, vx: 0, vy: 0, grounded: true, drop: 0, facing: 1, onPlat: false, room: VILLAGE, use: false, jh: false, dh: false, bh: false, mv: 0, dt: 0, dc: 0, bc: 0, ifr: 0, fj: false, home: 0 });

// The door a slime standing at s could go through, or undefined
export const doorAt = (s) => roomDef(s.room).doors.find((d) => s.grounded && !s.onPlat && Math.abs(s.x - d.x) <= d.w / 2 && (d.to !== HOME || s.home));

// Quantised to 1/100 px so the state sent over the wire is exactly the state simulated.
const q = (v) => Math.round(v * 100) / 100;

function approach(v, target, step) {
  return v < target ? Math.min(target, v + step) : Math.max(target, v - step);
}

// Advance one slime by one fixed tick. Mutates and returns `s`.
export function step(s, keys) {
  const pressedUse = keys & USE && !s.use;
  s.use = !!(keys & USE);
  const door = pressedUse && doorAt(s);
  if (door) {
    s.room = door.to === HOME ? s.home : door.to;
    s.x = door.toX;
    s.y = roomDef(s.room).ground;
    s.vx = s.vy = s.drop = s.dt = 0;
    s.grounded = true;
    s.onPlat = false;
    return s;
  }
  const room = roomDef(s.room);
  const pressedJump = keys & JUMP && !s.jh, pressedDash = keys & DASH && !s.dh, pressedBlink = keys & BLINK && !s.bh;
  s.jh = !!(keys & JUMP);
  s.dh = !!(keys & DASH);
  s.bh = !!(keys & BLINK);
  if (s.dc) s.dc--;
  if (s.bc) s.bc--;
  if (s.ifr) s.ifr--;
  const mv = s.mv | 0, phantom = rankBits(mv, 3), cdK = 1 - PHANTOM_CD * phantom;

  const dir = (keys & RIGHT ? 1 : 0) - (keys & LEFT ? 1 : 0);
  if (dir) s.facing = dir;
  s.vx = approach(s.vx, dir * WALK, (s.grounded ? ACCEL_GROUND : ACCEL_AIR) * DT);
  if (pressedDash && rankBits(mv, 0) && !s.dc && !s.dt) {
    s.dt = DASH_TICKS;
    s.dc = Math.round(DASH_CD[rankBits(mv, 0)] * cdK);
    s.ifr = Math.max(s.ifr, IFR_DASH + IFR_PHANTOM * phantom);
  }
  if (pressedBlink && rankBits(mv, 2) && !s.bc) {
    s.x = Math.min(room.width - HALF_W, Math.max(HALF_W, s.x + s.facing * BLINK_DIST[rankBits(mv, 2)]));
    s.bc = Math.round(BLINK_CD[rankBits(mv, 2)] * cdK);
    s.ifr = Math.max(s.ifr, IFR_BLINK + IFR_PHANTOM * phantom);
    s.vy = Math.min(s.vy, 0);
    s.dt = 0;
  }
  if (s.dt) {
    s.dt--;
    s.vx = s.facing * (s.dt ? DASH_V : WALK); // ends at walking speed, so it stops crisply
    s.vy = Math.min(s.vy, 0); // a level dash, in the air too
  }

  // Holding ↓ on a platform drops you through it (↓ + jump too, MapleStory style). ↓ alone used to do
  // nothing, and on touch ▼ and Jump sit under the same thumb, so dropping was nearly impossible there.
  if (keys & DOWN && s.grounded && s.onPlat) {
    s.drop = DROP_TIME; // fall through the platform underfoot
    s.grounded = false;
  } else if (keys & JUMP && s.grounded) {
    s.vy = -JUMP_V;
    s.grounded = false;
  } else if (pressedJump && !s.grounded && !s.fj && rankBits(mv, 1)) {
    s.vy = -FJ_VY; // Flash Jump
    s.vx = s.facing * FJ_VX[rankBits(mv, 1)];
    s.fj = true;
  }
  s.drop = Math.max(0, s.drop - DT);

  const prevY = s.y;
  s.x = Math.min(room.width - HALF_W, Math.max(HALF_W, s.x + s.vx * DT));
  s.vy = Math.min(s.vy + GRAVITY * DT, MAX_FALL);
  s.y += s.vy * DT;
  s.grounded = false;
  s.onPlat = false;

  if (s.vy >= 0) {
    if (s.drop === 0) {
      for (const p of room.platforms) {
        if (s.x + HALF_W < p.x || s.x - HALF_W > p.x + p.w) continue;
        if (prevY <= p.y && s.y >= p.y) {
          s.y = p.y;
          s.vy = 0;
          s.grounded = true;
          s.onPlat = true;
          break;
        }
      }
    }
    if (s.y >= room.ground) {
      s.y = room.ground;
      s.vy = 0;
      s.grounded = true;
      s.onPlat = false;
    }
  }

  if (s.grounded) s.fj = false;
  s.x = q(s.x);
  s.y = q(s.y);
  s.vx = q(s.vx);
  s.vy = q(s.vy);
  s.drop = q(s.drop);
  return s;
}

// Wire format for one slime: [id, x, y, vx, vy, flags, drop, room, mv, dt, dc, bc, ifr]
// (`home` never changes, so it isn't in snapshots: welcome / join info carry it, and src/net.js keeps ours)
// flags: 1 grounded · 2 on a platform · 4 facing left · 8 E held · 16 Jump held · 32 Dash held · 64 Blink held · 128 Flash Jump used
export const pack = (id, s) => [id, s.x, s.y, s.vx, s.vy, (s.grounded ? 1 : 0) | (s.onPlat ? 2 : 0) | (s.facing < 0 ? 4 : 0) | (s.use ? 8 : 0) | (s.jh ? 16 : 0) | (s.dh ? 32 : 0) | (s.bh ? 64 : 0) | (s.fj ? 128 : 0), s.drop, s.room, s.mv | 0, s.dt | 0, s.dc | 0, s.bc | 0, s.ifr | 0];
export function unpack(a, s = {}) {
  s.x = a[1];
  s.y = a[2];
  s.vx = a[3];
  s.vy = a[4];
  s.grounded = !!(a[5] & 1);
  s.onPlat = !!(a[5] & 2);
  s.facing = a[5] & 4 ? -1 : 1;
  s.use = !!(a[5] & 8);
  s.jh = !!(a[5] & 16);
  s.dh = !!(a[5] & 32);
  s.bh = !!(a[5] & 64);
  s.fj = !!(a[5] & 128);
  s.drop = a[6];
  s.room = a[7] ?? VILLAGE;
  s.mv = a[8] ?? 0;
  s.dt = a[9] ?? 0;
  s.dc = a[10] ?? 0;
  s.bc = a[11] ?? 0;
  s.ifr = a[12] ?? 0;
  return s;
}

export const NAME_MAX = 12;
export const cleanName = (n) => String(n ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, NAME_MAX);
export const cleanHue = (h) => ((Math.round(Number(h)) % 360) + 360) % 360 || 0;

// The AI characters you can talk to (personalities: server/characters.js). Each stands on the ground of
// its room at x; walk within `range` and press E. `accessory` is how src/slime.js dresses them.
export const NPCS = [
  { id: 'mochi', name: 'Elder Mochi', short: 'Mochi', room: VILLAGE, x: 2075, hue: 95, range: 150, size: 1.3, accessory: 'elder', faces: -1, blurb: 'the oldest slime in Slimeville' },
  { id: 'clio', name: 'Curator Clio', short: 'Clio', room: MUSEUM, x: 300, hue: 32, range: 80, size: 1.15, accessory: 'curator', faces: 1, blurb: 'historian of the Grand Museum · ask from anywhere in the museum', anywhere: true },
];
export const NPC = NPCS[0]; // Elder Mochi
export const NPC_RANGE = 150;
export const NPC_TEXT_MAX = 200; // characters per thing you say
export const CHAT_MAX = 200; // characters per chat line (server/chat.js)
export const cleanText = (t, max) => String(t ?? '').replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

// Prof. Synapse stands on the lecture hall's stage at this x
export const PROF_X = 215;

// Slapping (click): the server checks who's within reach on that side, in the same room
export const SLAP_REACH = 72; // px in front of the slapper's centre
export const SLAP_COOLDOWN_MS = 350;
export const SLAP_QUIPS = {
  clio: ['Excuse me! This is a museum!', 'Ow! Please don\'t touch the curator.', 'History will remember that, you know.', 'Hmph! Security!'],
  mochi: ['Oof! Respect your elders, young one!', 'Hmph! My poor old jelly…', 'Ow! What was that for?', 'Goodness! Is that how they greet folks nowadays?'],
  prof: ["Ouch! That's not on the syllabus!", 'Detention!', 'Hey! Please backpropagate that.', 'Ow — I felt that in every layer!'],
};
