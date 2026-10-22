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
export const SPAWN_X = 220; // where you start in the village
import { FIELD, FIELD_W, FIELD_GROUND, FIELD_PLATFORMS, FIELD_EXIT_X, FIELD_GATE_X, CLIFFS_PATH_X, DENS, DEN_W, DEN_PLATFORMS, DEN_EXIT_X, MOBS, HIGHLANDS, HIGHLANDS_W, HIGHLANDS_EXIT_X, HIGHLAND_PLATFORMS, FJORD, FJORD_W, FJORD_DOCK_X, FJORD_EXIT_X, FJORD_HOME_X, FJORD_SPAWN_X, FJORD_PLATFORMS, RUNA_X, STAGES, CALDERA, CALDERA_W, CALDERA_EXIT_X, CALDERA_DOOR_X, CALDERA_PLATFORMS, CITADEL, CITADEL_W, CITADEL_EXIT_X, CITADEL_DOOR_X, CITADEL_PLATFORMS, WILLOWMERE, WILLOWMERE_W, WILLOWMERE_EXIT_X, WILLOWMERE_GATE_X, WILLOWMERE_PLATFORMS, BUN_X, COVES, COVES_W, COVES_EXIT_X, COVES_GATE_X, COVES_PLATFORMS, MOSS_X, PETSHOP, PETSHOP_W, PETSHOP_EXIT_X, CLOVER_X, MYCELIUM, MYCELIUM_W, MYCELIUM_EXIT_X, MYCELIUM_GATE_X, MYCELIUM_PLATFORMS, TRUFFLE_X, GLOWROOT, GLOWROOT_W, GLOWROOT_EXIT_X, GLOWROOT_GATE_X, GLOWROOT_PLATFORMS, CANOPY, CANOPY_W, CANOPY_EXIT_X, CANOPY_GATE_X, CANOPY_PLATFORMS, ACORN_X } from './rpg.js';
export const VILLAGE = 0, HALL = 1, PIANO = 2, MUSEUM = 3, TUTOR = 4;
export const STORE = 18; // the furniture store (after the stages and dens, rpg.js)
export const HARBOUR = 19; // Greenhollow Harbour, west of the village (docs/places/harbour.md)
export const CLIFFS = 20; // Greenhollow's east cliffs, past the end of the Wildwood (docs/places/cliffs.md)
export const FERRY_N = 21, FERRY_S = 22; // the ferry's deck, out to Frostpeak and back home (docs/places/crossings.md)
export { FIELD, FJORD, WILLOWMERE, COVES, MYCELIUM, GLOWROOT, CANOPY };

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
export const PETSHOP_DOOR_X = 2989; // the Pet Shop's door, in the village, between Pip's stall and the hall (docs/places/pets.md)
export const HARBOUR_GATE_X = 60; // the way down to the harbour, at the village's west end
export const HARBOUR_W = 2400;
export const HARBOUR_EXIT_X = HARBOUR_W - 90; // back up to the village, at the harbour's east end
export const CLIFFS_W = 1700;
export const CLIFFS_EXIT_X = 80; // back into the Wildwood, at the cliffs' west end
export const CLIFFS_SCOPE_X = 1440; // the telescope, near the edge
export const GANGWAY_X = 1000; // the ferry's gangway, at the quay in the harbour
export const DECK_W = 1500; // a crossing room: the deck, stern (west) to bow (east)
export const DECK_GANGWAY_X = 560; // where you come aboard, and go ashore once she's in
export const STORE_W = 9200; // the showroom: every piece of FURNITURE on display (src/shared/house.js DISPLAY)

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
      { x: PETSHOP_DOOR_X, w: 60, to: PETSHOP, toX: PETSHOP_EXIT_X, label: 'enter the Pet Shop' },
      { x: FIELD_GATE_X, w: 80, to: FIELD, toX: FIELD_EXIT_X, label: 'head out to the Wildwood (mobs!)' },
      { x: HARBOUR_GATE_X, w: 70, to: HARBOUR, toX: HARBOUR_EXIT_X, label: 'walk down to Greenhollow Harbour' },
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
      { x: CLIFFS_PATH_X, w: 80, to: CLIFFS, toX: CLIFFS_EXIT_X, label: 'push through to the sea cliffs' },
      { x: WILLOWMERE_GATE_X, w: 80, to: WILLOWMERE, toX: WILLOWMERE_EXIT_X, label: 'cross the footbridge to Willowmere' },
      { x: MYCELIUM_GATE_X, w: 80, to: MYCELIUM, toX: MYCELIUM_EXIT_X, label: 'climb down the hollow stump into the Mycelium Deep' },
      { x: CANOPY_GATE_X, w: 80, to: CANOPY, toX: CANOPY_EXIT_X, label: 'climb the rope ladder into the Old Oak Canopy' },
      ...denDoors(FIELD),
    ],
  },
];
// rooms 6–8, 10–11, 14–17, 26 and 30: the boss dens (DENS in rpg.js); room 9: Frostpeak's wilds (Frostpine Ridge, Starfall Summit)
for (const d of DENS) {
  ROOMS[d.room] = {
    name: d.name, width: DEN_W, ground: FIELD_GROUND, platforms: DEN_PLATFORMS,
    doors: [{ x: DEN_EXIT_X, w: 80, to: d.from, toX: d.entranceX, label: `flee back to ${STAGES[d.from].name}` }],
  };
}
ROOMS[HIGHLANDS] = {
  name: 'Frostpeak', width: HIGHLANDS_W, ground: FIELD_GROUND, platforms: HIGHLAND_PLATFORMS,
  doors: [
    { x: HIGHLANDS_EXIT_X, w: 80, to: FJORD, toX: FJORD_EXIT_X, label: 'walk down to Icefang Hamlet' },
    { x: CALDERA_DOOR_X, w: 80, to: CALDERA, toX: CALDERA_EXIT_X, label: 'descend to the Emberdeep Caldera' },
    ...denDoors(HIGHLANDS),
  ],
};
// room 12: the Emberdeep Caldera · room 13: the Aether Citadel · rooms 14–17: their dens
ROOMS[CALDERA] = {
  name: 'The Emberdeep Caldera', width: CALDERA_W, ground: FIELD_GROUND, platforms: CALDERA_PLATFORMS,
  doors: [
    { x: CALDERA_EXIT_X, w: 80, to: HIGHLANDS, toX: CALDERA_DOOR_X, label: 'climb back up to Frostpeak' },
    { x: CITADEL_DOOR_X, w: 80, to: CITADEL, toX: CITADEL_EXIT_X, label: 'ride the skylift to the Aether Citadel' },
    ...denDoors(CALDERA),
  ],
};
// room 18: the furniture store's showroom (no platforms: the pieces are only on display; the doors between
// its lobby and sections are added by src/shared/house.js, which knows the layout)
ROOMS[STORE] = {
  name: 'Furniture Store', width: STORE_W, ground: 470, platforms: [],
  doors: [{ x: STORE_EXIT_X, w: 70, to: VILLAGE, toX: STORE_DOOR_X, label: 'leave the store' }],
};
// room 27: the Pet Shop (pets on plinths, Auntie Clover's food counter: src/petshop.js; no platforms)
ROOMS[PETSHOP] = {
  name: 'Pet Shop', width: PETSHOP_W, ground: 470, platforms: [],
  doors: [{ x: PETSHOP_EXIT_X, w: 70, to: VILLAGE, toX: PETSHOP_DOOR_X, label: 'leave the Pet Shop' }],
};
ROOMS[CITADEL] = {
  name: 'The Aether Citadel', width: CITADEL_W, ground: FIELD_GROUND, platforms: CITADEL_PLATFORMS,
  doors: [{ x: CITADEL_EXIT_X, w: 80, to: CALDERA, toX: CITADEL_DOOR_X, label: 'ride the skylift down to the Caldera' }, ...denDoors(CITADEL)],
};
// room 19: Greenhollow Harbour. Its platforms are crates, the old keeper's hut and the lighthouse gallery
// (drawn by src/harbour.js, which reads them from here). The ferry's gangway is a door onto her deck.
export const HARBOUR_PLATFORMS = [
  { x: 640, y: 372, w: 110, kind: 'crates' },
  { x: 470, y: 288, w: 130, kind: 'hut' },
  { x: 230, y: 198, w: 170, kind: 'gallery' },
  { x: 1920, y: 380, w: 96, kind: 'crates' },
];
ROOMS[HARBOUR] = {
  name: 'Greenhollow Harbour', width: HARBOUR_W, ground: 470, platforms: HARBOUR_PLATFORMS,
  doors: [
    { x: HARBOUR_EXIT_X, w: 80, to: VILLAGE, toX: HARBOUR_GATE_X, label: 'walk back up to Slimeville' },
    { x: GANGWAY_X, w: 80, to: FERRY_N, toX: DECK_GANGWAY_X, label: 'board the ferry to Frostpeak (Lv 13+)', ask: 'Set sail for Frostpeak? She takes about a minute.' },
    { x: COVES_GATE_X, w: 80, to: COVES, toX: COVES_EXIT_X, label: 'take the shore path to Saltspray Coves' },
  ],
};
// room 20: Greenhollow's east cliffs, a vista with no mobs. The room ends at the cliff edge (a fence), and
// `viewPad` lets the camera look that far past the east wall, out over the drop and the open sea.
export const CLIFFS_PLATFORMS = [
  { x: 1010, y: 418, w: 120, kind: 'bench' },
  { x: 560, y: 360, w: 150, kind: 'rock' },
];
ROOMS[CLIFFS] = {
  name: "Greenhollow's East Cliffs", width: CLIFFS_W, ground: 450, platforms: CLIFFS_PLATFORMS, viewPad: 380,
  doors: [{ x: CLIFFS_EXIT_X, w: 80, to: FIELD, toX: CLIFFS_PATH_X, label: 'back into the Wildwood (mobs!)' }],
};
// rooms 21 and 22: crossings (docs/places/crossings.md). A crossing is the deck of a ship under way: ordinary
// step() physics on the deck, while the sea and sky scroll past (drawing only, src/crossing.js). Your own
// voyage clock (state.vt, ticks since you came aboard) runs in step(), and the way ashore is a door that
// only opens once it reaches `crossing.ticks` (`after`), so arriving is predicted like any door. One room
// type, themed per route; each direction is its own room so the two sailings don't share a deck.
// Platforms: crates by the helm, the cabin roof, the yard on the mast, the crow's nest.
export const DECK_GROUND = 440;
export const DECK_PLATFORMS = [
  { x: 330, y: 392, w: 96, kind: 'crates' },
  { x: 860, y: 322, w: 250, kind: 'cabin' },
  { x: 1180, y: 252, w: 150, kind: 'yard' },
  { x: 1218, y: 140, w: 74, kind: 'nest' },
];
// ashore: the gangway once she's in (`after`); back: the same gangway for the first CAST_OFF ticks (`before`),
// while she's still casting off, so boarding by mistake doesn't mean a whole voyage
export const CAST_OFF = 6 * TICK_RATE;
const deck = (name, crossing, ashore, back) => ({
  name, width: DECK_W, ground: DECK_GROUND, platforms: DECK_PLATFORMS, crossing,
  doors: [{ ...ashore, x: DECK_GANGWAY_X, w: 90, after: crossing.ticks }, { ...back, x: DECK_GANGWAY_X, w: 90, before: CAST_OFF, label: "hop back ashore (she's still casting off)" }],
});
// route: the theme src/crossing.js paints · from / to: the islands (src/distant.js keys) · ticks: how long
// she takes. The first crossing out is the slow one (story/world/geography.md); home is quicker.
ROOMS[FERRY_N] = deck('The Puddle Jumper, bound for Frostpeak', { route: 'cold', from: 'green', to: 'frost', ticks: 60 * TICK_RATE },
  { to: FJORD, toX: FJORD_DOCK_X, label: 'go ashore at Icefang Hamlet' }, { to: HARBOUR, toX: GANGWAY_X });
ROOMS[FERRY_S] = deck('The Puddle Jumper, bound for Greenhollow', { route: 'cold', from: 'frost', to: 'green', ticks: 45 * TICK_RATE },
  { to: HARBOUR, toX: GANGWAY_X, label: 'go ashore at Greenhollow Harbour' }, { to: FJORD, toX: FJORD_DOCK_X });
export const VOYAGE_MAX = 65535; // state.vt stops counting here (it's a u16 on the wire)
// room 23: Icefang Fjord, Frostpeak's landing, and its town, Icefang Hamlet (docs/places/fjord.md). A safe
// room: the ferry's dock at the west end, the hamlet round its lamp-fire, the path up to Frostpine Ridge
// at the east end. Its platforms (FJORD_PLATFORMS, rpg.js) are crates on the quay, turf roofs and a rock.
ROOMS[FJORD] = {
  name: 'Icefang Hamlet', width: FJORD_W, ground: FIELD_GROUND, platforms: FJORD_PLATFORMS,
  doors: [
    { x: FJORD_DOCK_X, w: 80, to: FERRY_S, toX: DECK_GANGWAY_X, label: 'board the ferry home to Greenhollow', ask: 'Sail home to Greenhollow? About 45 seconds at sea.' },
    { x: FJORD_HOME_X, w: 60, to: HOME, toX: HOUSE_EXIT_X, label: 'go into your house' },
    { x: FJORD_EXIT_X, w: 80, to: HIGHLANDS, toX: HIGHLANDS_EXIT_X, label: 'climb up to Frostpine Ridge (mobs!)' },
  ],
};

// rooms 24 and 25: Greenhollow's first branches (island depth G1): Willowmere, up the brook from Sprout
// Meadow (docs/places/willowmere.md), and Saltspray Coves, along the shore from the harbour, entered at its
// east end (docs/places/coves.md). Room 26 is the Tidemother's den in the Coves (DENS in rpg.js).
ROOMS[WILLOWMERE] = {
  name: 'Willowmere', width: WILLOWMERE_W, ground: FIELD_GROUND, platforms: WILLOWMERE_PLATFORMS,
  doors: [{ x: WILLOWMERE_EXIT_X, w: 80, to: FIELD, toX: WILLOWMERE_GATE_X, label: 'back down the brook to Sprout Meadow (mobs!)' }],
};
ROOMS[COVES] = {
  name: 'Saltspray Coves', width: COVES_W, ground: FIELD_GROUND, platforms: COVES_PLATFORMS,
  doors: [{ x: COVES_EXIT_X, w: 80, to: HARBOUR, toX: COVES_GATE_X, label: 'back along the shore to the harbour' }, ...denDoors(COVES)],
};
// rooms 28 and 29 (island depth G2, docs/places/deep.md): the Mycelium Deep, down the hollow stump in
// Mushroom Grove, and Glowroot Hollow, a hard pocket down a crack at the Deep's far end. Room 30 is the
// Knotmole's burrow in the Deep (DENS in rpg.js).
ROOMS[MYCELIUM] = {
  name: 'The Mycelium Deep', width: MYCELIUM_W, ground: FIELD_GROUND, platforms: MYCELIUM_PLATFORMS,
  doors: [
    { x: MYCELIUM_EXIT_X, w: 80, to: FIELD, toX: MYCELIUM_GATE_X, label: 'climb back up the roots to Mushroom Grove (mobs!)' },
    { x: GLOWROOT_GATE_X, w: 80, to: GLOWROOT, toX: GLOWROOT_EXIT_X, label: 'climb down the crack into Glowroot Hollow (hard!)' },
    ...denDoors(MYCELIUM),
  ],
};
ROOMS[GLOWROOT] = {
  name: 'Glowroot Hollow', width: GLOWROOT_W, ground: FIELD_GROUND, platforms: GLOWROOT_PLATFORMS,
  doors: [{ x: GLOWROOT_EXIT_X, w: 80, to: MYCELIUM, toX: GLOWROOT_GATE_X, label: 'climb back up into the Mycelium Deep (mobs!)' }],
};
// room 31 (island depth G3, docs/places/canopy.md): the Old Oak Canopy, up the rope ladder in Bramble Woods.
// Its far end (the fallen trunk to Keeper's Spine) is a gate, not a door: GREENHOLLOW in branches.js.
ROOMS[CANOPY] = {
  name: 'The Old Oak Canopy', width: CANOPY_W, ground: FIELD_GROUND, platforms: CANOPY_PLATFORMS,
  doors: [{ x: CANOPY_EXIT_X, w: 80, to: FIELD, toX: CANOPY_GATE_X, label: 'climb down the rope ladder to Bramble Woods (mobs!)' }],
};

// ——— towns (docs/world.md) ———
// Owner's rule: every island's landing has a town, and every town works like Slimeville. It has a door
// into your own house, and being in one makes it your town (state.town, an index into TOWNS): you wake up
// there after fainting, start there when your spot wasn't kept, and your house's front door lets you out
// into it. x: where you wake up; homeX: its house door.
export const TOWNS = [
  { room: VILLAGE, name: 'Slimeville', x: SPAWN_X, homeX: HOME_DOOR_X },
  { room: FJORD, name: 'Icefang Hamlet', x: FJORD_SPAWN_X, homeX: FJORD_HOME_X },
];
TOWNS.forEach((t, i) => (ROOMS[t.room].town = i)); // (step() reads room.town)
export const townOf = (room) => ROOMS[room]?.town ?? -1; // -1: not a town
export const TOWN = -2; // a door's `to` meaning "your town" (a house's front door)
const townAt = (s) => TOWNS[s.town | 0] ?? TOWNS[0];

// ——— level bands on doors (docs/world.md) ———
// Every door into a combat room says who it's for: the stage's `band` (STAGES in rpg.js) or the den boss's
// level. The door's prompt and a chip over the door show it (src/hints.js); a hard pocket's are red.
for (const r of ROOMS) {
  for (const d of r?.doors ?? []) {
    const den = DENS.find((x) => x.room === d.to);
    if (STAGES[d.to]) Object.assign(d, { band: `Lv ${STAGES[d.to].band}`, hard: !!STAGES[d.to].hard });
    else if (den) d.band = `Boss Lv ${MOBS[den.boss].lvl}`;
  }
}

const houses = new Map(); // room id → its room definition
// The room definition for any room id, houses included (undefined for an id that isn't a room)
export function roomDef(room) {
  if (ROOMS[room] || !isHouse(room)) return ROOMS[room];
  let r = houses.get(room);
  if (!r) {
    r = { name: 'House', width: HOUSE_W, ground: HOUSE_GROUND, platforms: [], doors: [{ x: HOUSE_EXIT_X, w: 70, to: TOWN, label: 'go back outside' }] };
    houses.set(room, r);
  }
  return r;
}
export const setHouseRoom = (room, { width, platforms }) => Object.assign(roomDef(room), { width, platforms });

function denDoors(from) {
  return DENS.filter((d) => d.from === from).map((d) => ({ x: d.entranceX, w: 90, to: d.room, toX: DEN_EXIT_X, label: `enter ${d.name} (boss: ${MOBS[d.boss].name})` }));
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
// vt: voyage ticks, how long you've been aboard a crossing (0 everywhere else)
// town: your town (an index into TOWNS), the last one you were in
export const newState = (x = SPAWN_X) => ({ x, y: GROUND_Y, vx: 0, vy: 0, grounded: true, drop: 0, facing: 1, onPlat: false, room: VILLAGE, use: false, jh: false, dh: false, bh: false, mv: 0, dt: 0, dc: 0, bc: 0, ifr: 0, fj: false, home: 0, vt: 0, town: 0 });
// Move a slime to (room, x), standing, keeping who it is (house, mobility, town). For the server's
// teleports (waking up, invites, tests); doors do this inside step().
export const placeAt = (s, room, x) => Object.assign(s, newState(x), { room, y: roomDef(room).ground, home: s.home, mv: s.mv, facing: s.facing, town: townOf(room) >= 0 ? townOf(room) : s.town | 0 });

// Whether door d can be used right now (your own house once you have one; a ship's gangway once she's in,
// or back ashore while she's casting off). A door with `ask` is confirmed on the client first (src/main.js).
export const doorOpen = (s, d) => (d.to !== HOME || !!s.home) && (!d.after || (s.vt | 0) >= d.after) && (!d.before || (s.vt | 0) < d.before);
// The door a slime standing at s could go through, or undefined
export const doorAt = (s) => roomDef(s.room).doors.find((d) => s.grounded && !s.onPlat && Math.abs(s.x - d.x) <= d.w / 2 && doorOpen(s, d));
// How far along its crossing a slime is, 0..1 (0 when not aboard one)
export const voyage = (s) => {
  const c = roomDef(s.room)?.crossing;
  return c ? Math.min(1, (s.vt | 0) / c.ticks) : 0;
};

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
    const town = door.to === TOWN && townAt(s);
    s.room = door.to === HOME ? s.home : town ? town.room : door.to;
    s.x = town ? town.homeX : door.toX;
    s.y = roomDef(s.room).ground;
    s.vx = s.vy = s.drop = s.dt = s.vt = 0;
    s.grounded = true;
    s.onPlat = false;
    return s;
  }
  const room = roomDef(s.room);
  s.vt = room.crossing ? Math.min(VOYAGE_MAX, (s.vt | 0) + 1) : 0;
  if (room.town !== undefined) s.town = room.town;
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

// Wire format for one slime: [id, x, y, vx, vy, flags, drop, room, mv, dt, dc, bc, ifr, vt, town]
// (`home` never changes, so it isn't in snapshots: welcome / join info carry it, and src/net.js keeps ours)
// flags: 1 grounded · 2 on a platform · 4 facing left · 8 E held · 16 Jump held · 32 Dash held · 64 Blink held · 128 Flash Jump used
export const pack = (id, s) => [id, s.x, s.y, s.vx, s.vy, (s.grounded ? 1 : 0) | (s.onPlat ? 2 : 0) | (s.facing < 0 ? 4 : 0) | (s.use ? 8 : 0) | (s.jh ? 16 : 0) | (s.dh ? 32 : 0) | (s.bh ? 64 : 0) | (s.fj ? 128 : 0), s.drop, s.room, s.mv | 0, s.dt | 0, s.dc | 0, s.bc | 0, s.ifr | 0, s.vt | 0, s.town | 0];
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
  s.vt = a[13] ?? 0;
  s.town = a[14] ?? 0;
  return s;
}

export const NAME_MAX = 12;
export const cleanName = (n) => String(n ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, NAME_MAX);
export const cleanHue = (h) => ((Math.round(Number(h)) % 360) + 360) % 360 || 0;

// The AI characters you can talk to (personalities: server/characters.js). Each stands on the ground of
// its room at x; walk within `range` and press E. `accessory` is how src/slime.js dresses them. `also`: more
// rooms they stand in, at the same x (Brine at the helm of both sailings); use npcIn() rather than .room.
// hello: the line their dialog opens with before anyone has said anything.
export const NPCS = [
  { id: 'mochi', name: 'Elder Mochi', short: 'Mochi', room: VILLAGE, x: 2075, hue: 95, range: 150, size: 1.3, accessory: 'elder', faces: -1, blurb: 'the oldest slime in Slimeville', hello: 'Hmm? Oh — hello there, little one. Sit a while… (everyone can hear you)' },
  { id: 'brine', name: 'Captain Brine', short: 'Brine', room: FERRY_N, also: [FERRY_S], x: 250, hue: 205, range: 130, size: 1.25, accessory: 'captain', faces: 1, blurb: 'master of the Puddle Jumper, at her wheel', hello: 'Ahoy! Mind the rigging. (Everyone can hear you.)' },
  // Icefang Hamlet's fjord folk (folk: their people's look, src/slime.js; shop: they trade too, SHOPS in rpg.js)
  { id: 'skaldi', name: 'Old Skaldi', short: 'Skaldi', room: FJORD, x: 2210, hue: 205, range: 130, size: 1.2, accessory: 'lamplighter', folk: 'fjord', faces: -1, blurb: 'lamplighter of Icefang Hamlet, keeper of the old songs', hello: 'Sit by the fire. Warm your jelly. (Everyone can hear you.)' },
  { id: 'runa', name: 'Netmender Runa', short: 'Runa', room: FJORD, x: RUNA_X, hue: 178, range: 120, size: 1.1, accessory: 'netmender', folk: 'fjord', faces: 1, blurb: 'mends the nets and trades at her shed', shop: 'runa', hello: 'Buying or chatting? Trade is the button. (Everyone can hear you.)' },
  { id: 'tove', name: 'Tove', short: 'Tove', room: FJORD, x: 2480, hue: 215, range: 110, size: 0.8, accessory: 'mittens', folk: 'fjord', lively: true, faces: -1, blurb: "Skaldi's granddaughter, who feeds the yeti cubs", hello: 'Are you going up the ridge? Ask me about the animals! (Everyone can hear you.)' },
  // Greenhollow's branches (island depth G1): each has a character who trades and is worth a chat
  { id: 'bun', name: 'Miller Bun', short: 'Bun', room: WILLOWMERE, x: BUN_X, hue: 34, range: 120, size: 1.2, accessory: 'miller', faces: 1, blurb: 'runs the Willowmere mill and trades at its door', shop: 'bun', hello: 'Mind the flour! Buying or chatting? Trade is the button. (Everyone can hear you.)' },
  { id: 'truffle', name: 'Forager Truffle', short: 'Truffle', room: MYCELIUM, x: TRUFFLE_X, hue: 330, range: 120, size: 1.05, accessory: 'forager', faces: 1, blurb: 'forages the Deep and trades at her camp', shop: 'truffle', hello: 'Shh, the puffcaps are napping. Buying or chatting? Trade is the button. (Everyone can hear you.)' },
  { id: 'acorn', name: 'Ranger Acorn', short: 'Acorn', room: CANOPY, x: ACORN_X, hue: 95, range: 120, size: 1.05, accessory: 'ranger', faces: 1, blurb: 'watches over the Old Oak Canopy and trades at her treehouse', shop: 'acorn', hello: "Feet on the bough, eyes on the branches! Buying or chatting? Trade is the button. (Everyone can hear you.)" },
  { id: 'moss', name: 'Beachcomber Moss', short: 'Moss', room: COVES, x: MOSS_X, hue: 150, range: 120, size: 1.05, accessory: 'beachcomber', faces: -1, blurb: 'keeps what the sea washes in, and trades it', shop: 'moss', hello: 'Oh! A visitor. Mind the shells. Trade is the button. (Everyone can hear you.)' },
  // the Pet Shop's keeper: sells pet food (the pets are on plinths), and knows everything about keeping them
  { id: 'clover', name: 'Auntie Clover', short: 'Clover', room: PETSHOP, x: CLOVER_X, hue: 330, range: 130, size: 1.15, accessory: 'petkeeper', faces: 1, blurb: 'runs the Pet Shop and raises the little ones', shop: 'clover', hello: 'Oh, hello, dear! Mind the little ones. Food is the Trade button. (Everyone can hear you.)' },
  { id: 'clio', name: 'Curator Clio', short: 'Clio', room: MUSEUM, x: 300, hue: 32, range: 80, size: 1.15, accessory: 'curator', faces: 1, blurb: 'historian of the Grand Museum · ask from anywhere in the museum', anywhere: true, hello: 'Welcome to the museum! Ask Clio anything about history. (Everyone can hear you.)' },
];
export const NPC = NPCS[0]; // Elder Mochi
export const npcIn = (c, room) => c.room === room || !!c.also?.includes(room);
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
  clover: ['Not in front of the little ones!', 'Ow! Now you\'ve upset the kibble.', 'Shoo! Even Turnipop has better manners.', 'Gentle hands, dear. GENTLE.'],
  clio: ['Excuse me! This is a museum!', 'Ow! Please don\'t touch the curator.', 'History will remember that, you know.', 'Hmph! Security!'],
  mochi: ['Oof! Respect your elders, young one!', 'Hmph! My poor old jelly…', 'Ow! What was that for?', 'Goodness! Is that how they greet folks nowadays?'],
  skaldi: ['Hm.', 'The cold has done worse.', 'Mind the fire, child.', 'That was unkind. Sit down.'],
  runa: ['Hands off the nets!', "That'll cost you.", 'Hmph. Fjord manners, is it?', 'I have a needle and I know how to use it.'],
  tove: ['Hey! Rude!', "I'm telling grandpa!", 'Ow! The yetis are nicer than you.', 'Do it again and I set Big Grumble on you.'],
  bun: ['Oof! Flour everywhere now!', 'Hey! I knead dough, not slaps.', 'That was rude. Rye rude.', 'Do that again and no buns for you.'],
  truffle: ['Oof! Mind my mushrooms!', "Hey! That's no way to treat a forager.", 'Rude! Even the cave bats knock first.', 'Do that again and you can find your own way out.'],
  acorn: ["Hey! I'll put that in the logbook.", 'Ow! Watch it, or you can climb down the hard way.', "Rude! Even the hornets warn you first.", 'Do that again and Zip takes your hat.'],
  moss: ['Ow! Careful, I bruise like a peach.', "That's going in the collection. As a bad memory.", 'Rude! Even crabs say hello first.', 'Hmph. The tide is gentler than you.'],
  brine: ['Oi! Mind the captain, landlubber!', 'Arr, I\'ve been hit by bigger waves than you.', 'Blistering barnacles!', 'Is that how they greet sailors these days?'],
  prof: ["Ouch! That's not on the syllabus!", 'Detention!', 'Hey! Please backpropagate that.', 'Ow — I felt that in every layer!'],
};
