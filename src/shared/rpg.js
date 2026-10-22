// Docs: docs/combat/core.md, docs/combat/stages.md, docs/combat/bosses.md, docs/combat/items.md, docs/places/alchemy.md
// Shared by client and server: the mob stage (the Wildwood, east of the village), its mobs, items,
// levels and combat numbers. The server runs the mobs and decides every hit, drop and pickup
// (server/rpg.js); the client only draws them (src/rpg.js, art in src/field.js).

export const FIELD = 5; // room id (see ROOMS in sim.js)
export const FIELD_W = 5200; // the last stretch (where the Highlands trail used to be) is mob-free: the briar thins out toward the sea cliffs
export const CLIFFS_PATH_X = FIELD_W - 80; // the way out to Greenhollow's east cliffs (room CLIFFS in sim.js), at the very east end
export const FIELD_GROUND = 450;
export const FIELD_EXIT_X = 70; // the way back to the village, at the field's west end
export const FIELD_GATE_X = 5030; // the gate out of the village, at its east end

// Three zones, getting harder the further east you go
export const ZONES = [
  { name: 'Sprout Meadow', x0: 0, x1: 1600, lvl: '1–3' },
  { name: 'Mushroom Grove', x0: 1600, x1: 3200, lvl: '4–7' },
  { name: 'Bramble Woods', x0: 3200, x1: FIELD_W, lvl: '8+' },
];
// The second stage: Frostpeak, over the sea to the north. The ferry lands at Icefang Hamlet (FJORD, a safe
// town room: docs/places/fjord.md), and the path from there climbs into the stage's west end.
export const HIGHLANDS = 9; // room id
export const HIGHLANDS_W = 4000;
export const HIGHLANDS_EXIT_X = 70; // the path down to Icefang Hamlet
// Icefang Fjord and Icefang Hamlet (room 23): west to east, the ferry's dock, the laid-up ship south, Runa's
// net shed, the hamlet's huts round the lamp-fire, the path up to the ridge. No mobs.
export const FJORD = 23; // room id
export const FJORD_W = 3000;
export const FJORD_DOCK_X = 470; // the ferry's gangway
export const FJORD_HOME_X = 1840; // the turf hut whose door is everyone's own front door
export const FJORD_SPAWN_X = 2040; // where you wake up, by the lamp-fire
// The Pet Shop (room 27), in the village: Auntie Clover's counter of pet food, then the pets on plinths
// (docs/places/pets.md). Its layout: PET_DISPLAY in src/shared/house.js.
export const PETSHOP = 27; // room id
export const PETSHOP_W = 3000;
export const PETSHOP_EXIT_X = 90;
export const CLOVER_X = 420; // Auntie Clover, behind her counter (she trades: SHOPS)
export const FJORD_FIRE_X = 2120;
export const FJORD_EXIT_X = FJORD_W - 90; // up to Frostpine Ridge
export const RUNA_X = 1560; // Netmender Runa, at her net shed (she trades: SHOPS)
export const FJORD_PLATFORMS = [
  { x: 690, y: 378, w: 100, kind: 'crates' },
  { x: 1765, y: 330, w: 150, kind: 'turf' },
  { x: 2560, y: 322, w: 170, kind: 'turf' },
  { x: 2790, y: 362, w: 120, kind: 'rock' },
];
export const HIGHLAND_ZONES = [
  { name: 'Frostpine Ridge', x0: 0, x1: 2000, lvl: '13–17' },
  { name: 'Starfall Summit', x0: 2000, x1: HIGHLANDS_W, lvl: '18+' },
];
export const HIGHLAND_PLATFORMS = [
  { x: 380, y: 330, w: 220, kind: 'ice' },
  { x: 820, y: 240, w: 200, kind: 'ice' },
  { x: 1300, y: 320, w: 240, kind: 'ice' },
  { x: 2300, y: 330, w: 220, kind: 'crystal' },
  { x: 2750, y: 230, w: 200, kind: 'crystal' },
  { x: 3250, y: 320, w: 240, kind: 'crystal' },
];
// The third stage: the Emberdeep Caldera, a volcano down a lava-lit pass at the Highlands' east end
export const CALDERA = 12; // room id
export const CALDERA_W = 4400;
export const CALDERA_EXIT_X = 70; // back up to the Highlands
export const CALDERA_DOOR_X = 3950; // the pass down, at the Highlands' east end
export const CALDERA_ZONES = [
  { name: 'Cinder Flats', x0: 0, x1: 2200, lvl: '28–38' },
  { name: 'Magma Heart', x0: 2200, x1: CALDERA_W, lvl: '38–50' },
];
export const CALDERA_PLATFORMS = [
  { x: 400, y: 330, w: 220, kind: 'basalt' },
  { x: 850, y: 240, w: 200, kind: 'basalt' },
  { x: 1350, y: 320, w: 240, kind: 'basalt' },
  { x: 2500, y: 330, w: 220, kind: 'obsidian' },
  { x: 2950, y: 240, w: 200, kind: 'obsidian' },
  { x: 3450, y: 320, w: 240, kind: 'obsidian' },
];
// The fourth stage: the Aether Citadel, a clockwork city in the clouds, up a skylift at the Caldera's east end
export const CITADEL = 13; // room id
export const CITADEL_W = 4800;
export const CITADEL_EXIT_X = 70; // back down to the Caldera
export const CITADEL_DOOR_X = 4300; // the skylift up, at the Caldera's east end
export const CITADEL_ZONES = [
  { name: 'Cogwork Bastion', x0: 0, x1: 2400, lvl: '50–65' },
  { name: 'Chrono Spire', x0: 2400, x1: CITADEL_W, lvl: '66+' },
];
export const CITADEL_PLATFORMS = [
  { x: 420, y: 330, w: 220, kind: 'gear' },
  { x: 900, y: 240, w: 200, kind: 'gear' },
  { x: 1450, y: 320, w: 240, kind: 'gear' },
  { x: 2650, y: 330, w: 220, kind: 'aether' },
  { x: 3150, y: 230, w: 200, kind: 'aether' },
  { x: 3650, y: 320, w: 240, kind: 'aether' },
];
// ——— Greenhollow's branches (island depth G1: story/world/island-depth.md, docs/places/willowmere.md and
// docs/places/coves.md) ———
// Willowmere (room 24): north of Sprout Meadow up the brook path. West to east: the mill (no mobs; Miller
// Bun, a waystone, the weir stone under the wheel), the Reedy Banks, and the Millpond (Old Snapjaw, a field
// boss), with a high bough in the old willow at the far end.
export const WILLOWMERE = 24; // room id
export const WILLOWMERE_W = 4200;
export const WILLOWMERE_EXIT_X = 70; // the brook path back down to Sprout Meadow
export const WILLOWMERE_GATE_X = 880; // the footbridge over the brook, in Sprout Meadow (the way in)
export const BUN_X = 520; // Miller Bun, at the mill door (he trades: SHOPS)
export const WILLOWMERE_ZONES = [
  { name: 'The Mill', x0: 0, x1: 900, lvl: null }, // (no mobs)
  { name: 'Reedy Banks', x0: 900, x1: 2500, lvl: '5–10' },
  { name: 'The Millpond', x0: 2500, x1: WILLOWMERE_W, lvl: '10–15' },
];
export const WILLOWMERE_PLATFORMS = [
  { x: 560, y: 300, w: 140, kind: 'loft' }, // the mill's loft door
  { x: 150, y: 392, w: 90, kind: 'sacks' },
  { x: 1150, y: 345, w: 200, kind: 'bough' },
  { x: 1600, y: 265, w: 180, kind: 'bough' },
  { x: 2050, y: 340, w: 220, kind: 'log' },
  { x: 2750, y: 335, w: 220, kind: 'bough' },
  { x: 3200, y: 250, w: 200, kind: 'bough' },
  { x: 3650, y: 330, w: 220, kind: 'bough' },
  { x: 3950, y: 202, w: 130, kind: 'bough' }, // high in the old willow: easy to miss
];
// Saltspray Coves (room 25): south of the harbour along the shore. You come in at the EAST end (the
// harbour lies east of it) and go west, deeper and harder: Beachcomber Moss's driftwood cove (no mobs; a
// waystone), the Tide Pools, the Sea Stacks, the Tidemother's cave and the flooded mouth of Wreck Cave.
export const COVES = 25; // room id
export const COVES_W = 4400;
export const COVES_EXIT_X = COVES_W - 90; // back along the shore to the harbour
export const COVES_GATE_X = 110; // the shore path's end, at the harbour's west end (the way in)
export const MOSS_X = 3800; // Beachcomber Moss, by her driftwood shack (she trades: SHOPS)
export const TIDE_DEN_X = 340; // the Tidemother's sea cave, near the Coves' far (west) end
export const COVES_ZONES = [
  { name: 'The Sea Stacks', x0: 0, x1: 1900, lvl: '18–25' },
  { name: 'The Tide Pools', x0: 1900, x1: 3600, lvl: '10–17' },
  { name: 'Driftwood Cove', x0: 3600, x1: COVES_W, lvl: null }, // (no mobs)
];
export const COVES_PLATFORMS = [
  { x: 450, y: 330, w: 200, kind: 'stack' },
  { x: 900, y: 240, w: 180, kind: 'stack' },
  { x: 1400, y: 330, w: 220, kind: 'stack' },
  { x: 2150, y: 340, w: 200, kind: 'rock' },
  { x: 2650, y: 260, w: 180, kind: 'rock' },
  { x: 3150, y: 345, w: 210, kind: 'rock' },
  { x: 3640, y: 390, w: 100, kind: 'crates' },
  { x: 3920, y: 330, w: 150, kind: 'shack' }, // Moss's roof
];
// ——— island depth G2 (docs/places/deep.md) ———
// The Mycelium Deep (room 28): down through the hollow stump in Mushroom Grove, under the Wildwood, where the
// glowing threads seen above are roots as thick as trunks. West to east: the Root Stair (no mobs: Forager
// Truffle's camp, a waystone, the Listening Stone), Puffcap Hollow, the Thread Caverns and the Knotted Halls,
// with the Knotmole's burrow and the crack down into Glowroot Hollow at the far end. A high mushroom cap
// over the Thread Caverns (the Glow Shelf) is the off-the-path spot.
export const MYCELIUM = 28; // room id
export const MYCELIUM_W = 5200;
export const MYCELIUM_EXIT_X = 70; // up the roots to Mushroom Grove
export const MYCELIUM_GATE_X = 2430; // the hollow stump in Mushroom Grove (the way in)
export const TRUFFLE_X = 560; // Forager Truffle, at her camp (she trades: SHOPS)
export const KNOT_DEN_X = 4600; // the Knotmole's burrow, in the Knotted Halls
export const GLOWROOT_GATE_X = MYCELIUM_W - 90; // the crack down into Glowroot Hollow, at the far east end
export const MYCELIUM_ZONES = [
  { name: 'The Root Stair', x0: 0, x1: 1000, lvl: null }, // (no mobs; puffcaps lob, so they keep well away from the camp)
  { name: 'Puffcap Hollow', x0: 1000, x1: 2400, lvl: '15–22' },
  { name: 'The Thread Caverns', x0: 2400, x1: 3800, lvl: '22–28' },
  { name: 'The Knotted Halls', x0: 3800, x1: MYCELIUM_W, lvl: '28–35' },
];
export const MYCELIUM_PLATFORMS = [
  { x: 620, y: 330, w: 150, kind: 'tent' }, // Truffle's mushroom-cap tent
  { x: 1150, y: 340, w: 200, kind: 'cap' },
  { x: 1550, y: 250, w: 180, kind: 'cap' },
  { x: 2000, y: 335, w: 220, kind: 'root' },
  { x: 2650, y: 340, w: 200, kind: 'shelf' },
  { x: 3050, y: 255, w: 190, kind: 'root' },
  { x: 3450, y: 335, w: 220, kind: 'shelf' },
  { x: 3950, y: 335, w: 220, kind: 'root' },
  { x: 4250, y: 250, w: 180, kind: 'shelf' },
  { x: 4800, y: 340, w: 180, kind: 'cap' },
  { x: 3170, y: 160, w: 110, kind: 'cap' }, // the Glow Shelf, high over the Thread Caverns: easy to miss
];
// Glowroot Hollow (room 29): a hard pocket at the bottom of the Deep, where the threads knot together and
// the whole cave glows. West to east: the Glowfall (no mobs: where you climb down), the Lit Galleries and the
// Heart Knot. Elites live here.
export const GLOWROOT = 29; // room id
export const GLOWROOT_W = 3600;
export const GLOWROOT_EXIT_X = 70; // back up the crack into the Deep
export const GLOWROOT_ZONES = [
  { name: 'The Glowfall', x0: 0, x1: 500, lvl: null }, // (no mobs)
  { name: 'The Lit Galleries', x0: 500, x1: 2000, lvl: '40–45' },
  { name: 'The Heart Knot', x0: 2000, x1: GLOWROOT_W, lvl: '45–50' },
];
export const GLOWROOT_PLATFORMS = [
  { x: 700, y: 335, w: 200, kind: 'glowcap' },
  { x: 1150, y: 250, w: 180, kind: 'glowcap' },
  { x: 1600, y: 335, w: 220, kind: 'root' },
  { x: 2250, y: 335, w: 220, kind: 'root' },
  { x: 2700, y: 250, w: 200, kind: 'glowcap' },
  { x: 3150, y: 335, w: 220, kind: 'root' },
];
// ——— island depth G3 (docs/places/canopy.md) ———
// The Old Oak Canopy (room 31): up the rope ladder from Bramble Woods into the treetops. A wide room, not a
// tall one: the floor is the Great Bough (an oak limb as broad as a road), and the "height" is boughs and
// rope bridges stacked above it. West to east: the Treehouse Camp (no mobs: Ranger Acorn, a waystone, the
// Lifted Stone), the Squirrel Boughs, the Owl Hollows and the Wasp Crowns, where the Hornet Queen roams, and
// a fallen trunk across the high path to Keeper's Spine at the far end. The Crow's Nest, a lookout high over
// the Owl Hollows (last in CANOPY_PLATFORMS), is the off-the-path spot.
export const CANOPY = 31; // room id
export const CANOPY_W = 5600;
export const CANOPY_EXIT_X = 70; // down the rope ladder to Bramble Woods
export const CANOPY_GATE_X = 3390; // the rope ladder in Bramble Woods (the way in)
export const ACORN_X = 560; // Ranger Acorn, at her treehouse (she trades: SHOPS)
export const SPINE_GATE_X = CANOPY_W - 110; // the fallen trunk across the high path to Keeper's Spine
export const CANOPY_ZONES = [
  { name: 'The Treehouse Camp', x0: 0, x1: 1000, lvl: null }, // (no mobs)
  { name: 'The Squirrel Boughs', x0: 1000, x1: 2400, lvl: '25–30' },
  { name: 'The Owl Hollows', x0: 2400, x1: 3900, lvl: '30–35' },
  { name: 'The Wasp Crowns', x0: 3900, x1: CANOPY_W, lvl: '35–40' },
];
export const CANOPY_PLATFORMS = [
  { x: 610, y: 320, w: 170, kind: 'treehouse' }, // Acorn's treehouse roof
  { x: 1120, y: 340, w: 210, kind: 'bough' },
  { x: 1460, y: 255, w: 280, kind: 'bridge' },
  { x: 1860, y: 340, w: 210, kind: 'bough' },
  { x: 2160, y: 250, w: 190, kind: 'bough' },
  { x: 2520, y: 340, w: 220, kind: 'bough' },
  { x: 2860, y: 250, w: 300, kind: 'bridge' },
  { x: 3260, y: 340, w: 210, kind: 'bough' },
  { x: 3560, y: 255, w: 230, kind: 'bough' },
  { x: 4020, y: 340, w: 210, kind: 'bough' },
  { x: 4360, y: 250, w: 290, kind: 'bridge' },
  { x: 4760, y: 340, w: 210, kind: 'bough' },
  { x: 5060, y: 250, w: 200, kind: 'bough' },
  { x: 2950, y: 158, w: 110, kind: 'nest' }, // the Crow's Nest, high over the Owl Hollows: easy to miss
];
// ——— island depth G4: the hard pockets (docs/places/wreck.md, docs/places/thornheart.md) ———
// Wreck Cave (room 32): a sea cave behind the flooded mouth at Saltspray Coves' far (west) end, with an old
// apple ship wrecked inside. Like the Coves you come in at the EAST end (the mouth) and go west, deeper and
// harder: the Cave Mouth (no mobs), the Drowned Gallery, and the Wreck itself, where the Drowned Bosun
// roams. The crow's nest on the wreck's broken foremast (last in WRECK_PLATFORMS) is the off-the-path spot.
export const WRECK = 32; // room id
export const WRECK_W = 3800;
export const WRECK_EXIT_X = WRECK_W - 90; // back out through the cave mouth to the Coves
export const WRECK_GATE_X = 130; // the cave mouth at the Coves' far west end (the way in)
export const WRECK_ZONES = [
  { name: 'The Wreck', x0: 0, x1: 1800, lvl: '35–40' },
  { name: 'The Drowned Gallery', x0: 1800, x1: 3250, lvl: '30–35' },
  { name: 'The Cave Mouth', x0: 3250, x1: WRECK_W, lvl: null }, // (no mobs)
];
export const WRECK_PLATFORMS = [
  { x: 3000, y: 340, w: 200, kind: 'ledge' },
  { x: 2600, y: 255, w: 190, kind: 'ledge' },
  { x: 2200, y: 340, w: 230, kind: 'spar' }, // a broken spar wedged between the rocks
  { x: 1860, y: 255, w: 180, kind: 'ledge' },
  { x: 1150, y: 340, w: 340, kind: 'deck' }, // the wreck: its deck aft of the break
  { x: 1290, y: 250, w: 180, kind: 'stern' }, // the stern castle
  { x: 420, y: 340, w: 380, kind: 'deck' }, // the foredeck
  { x: 560, y: 248, w: 220, kind: 'yard' }, // the foremast's yard
  { x: 615, y: 158, w: 100, kind: 'nest' }, // the crow's nest, up the broken foremast: easy to miss
];
// The Thornheart (room 33): through the wall of thorns at Bramble Woods' east end, into the root of the briar
// that covers the whole east of the Wildwood. West to east: the Briar Gate (no mobs: where the thorns were
// cut back), the Bramble Maze and the Thornheart itself, where every briar on the island grows from one
// great root knot round an old Keeper stone (the Hedge Stone), and the Thorn Hart roams. The White Rose, a
// briar arch high over the Maze (last in THORN_PLATFORMS), is the off-the-path spot.
export const THORNHEART = 33; // room id
export const THORN_W = 4200;
export const THORN_EXIT_X = 70; // back out through the briar to Bramble Woods
export const THORN_GATE_X = 4920; // the wall of thorns at Bramble Woods' mob-free east end (the way in)
export const THORN_ZONES = [
  { name: 'The Briar Gate', x0: 0, x1: 520, lvl: null }, // (no mobs)
  { name: 'The Bramble Maze', x0: 520, x1: 2300, lvl: '50–55' },
  { name: 'The Thornheart', x0: 2300, x1: THORN_W, lvl: '55–60' },
];
export const THORN_PLATFORMS = [
  { x: 700, y: 340, w: 210, kind: 'log' },
  { x: 1050, y: 255, w: 190, kind: 'briar' },
  { x: 1450, y: 340, w: 220, kind: 'log' },
  { x: 1840, y: 250, w: 210, kind: 'briar' },
  { x: 2480, y: 340, w: 220, kind: 'root' },
  { x: 2860, y: 255, w: 200, kind: 'briar' },
  { x: 3260, y: 340, w: 220, kind: 'root' },
  { x: 3640, y: 255, w: 180, kind: 'briar' },
  { x: 1895, y: 160, w: 100, kind: 'rose' }, // the White Rose, a briar arch high over the Maze: easy to miss
];
// The open-air stages (each has zones); dens are separate rooms. band: the levels it's for, shown on every
// door into it (doorBand in sim.js); hard: a hard pocket (elites, a danger look on its doors). name: the
// location pill's (src/main.js)
export const STAGES = {
  [FIELD]: { name: 'The Wildwood', zones: ZONES, band: '1–12' },
  [HIGHLANDS]: { name: 'Frostpeak', zones: HIGHLAND_ZONES, band: '13–27' },
  [CALDERA]: { name: 'The Emberdeep Caldera', zones: CALDERA_ZONES, band: '28–50', pill: 'Emberdeep' },
  [CITADEL]: { name: 'The Aether Citadel', zones: CITADEL_ZONES, band: '50+', pill: 'Aether Citadel' },
  [WILLOWMERE]: { name: 'Willowmere', zones: WILLOWMERE_ZONES, band: '5–15' },
  [COVES]: { name: 'Saltspray Coves', zones: COVES_ZONES, band: '10–25' },
  [MYCELIUM]: { name: 'The Mycelium Deep', zones: MYCELIUM_ZONES, band: '15–35', pill: 'Mycelium Deep' },
  [GLOWROOT]: { name: 'Glowroot Hollow', zones: GLOWROOT_ZONES, band: '40–50', hard: true },
  [CANOPY]: { name: 'The Old Oak Canopy', zones: CANOPY_ZONES, band: '25–40', pill: 'Old Oak Canopy' },
  [WRECK]: { name: 'Wreck Cave', zones: WRECK_ZONES, band: '30–40', hard: true },
  [THORNHEART]: { name: 'The Thornheart', zones: THORN_ZONES, band: '50–60', hard: true, pill: 'Thornheart' },
};
export const zoneAt = (x, room = FIELD) => {
  const zones = STAGES[room]?.zones ?? ZONES;
  return zones.find((z) => x < z.x1) ?? zones.at(-1);
};

export const FIELD_PLATFORMS = [
  { x: 420, y: 340, w: 220, kind: 'island' },
  { x: 900, y: 300, w: 200, kind: 'island' },
  { x: 1250, y: 210, w: 160, kind: 'island' },
  { x: 1900, y: 335, w: 240, kind: 'log' },
  { x: 2350, y: 250, w: 200, kind: 'log' },
  { x: 2800, y: 330, w: 220, kind: 'log' },
  { x: 3500, y: 330, w: 240, kind: 'branch' },
  { x: 3900, y: 240, w: 200, kind: 'branch' },
  { x: 4300, y: 320, w: 240, kind: 'branch' },
];

// ——— mobs ———
// hp, atk (contact damage), exp, speed (px/s), aggro: chases anyone close without being hit first.
// anchored: hits don't knock it back (a wasp nest sits where it is).
// w/h: body size in px (for hit boxes and drawing). drops: [item, chance, min, max].
export const MOBS = {
  sprout: {
    name: 'Sprout', lvl: 1, hp: 22, atk: 5, exp: 6, speed: 45, w: 30, h: 28, aggro: false, hops: true,
    drops: [['coin', 0.9, 1, 4], ['sprout_leaf', 0.5, 1, 1], ['red_jelly', 0.12, 1, 1], ['mana_jelly', 0.08, 1, 1], ['wood_sword', 0.06, 1, 1], ['leaf_cap', 0.05, 1, 1]],
  },
  mushling: {
    name: 'Mushling', lvl: 5, hp: 70, atk: 11, exp: 18, speed: 55, w: 38, h: 40, aggro: false, hops: false,
    drops: [['coin', 0.9, 4, 10], ['mush_cap', 0.5, 1, 1], ['red_jelly', 0.18, 1, 2], ['blue_jelly', 0.05, 1, 1], ['mana_jelly', 0.15, 1, 1], ['iron_sword', 0.04, 1, 1], ['mush_helm', 0.05, 1, 1]],
  },
  bramble: {
    name: 'Bramblehog', lvl: 9, hp: 170, atk: 20, exp: 45, speed: 75, w: 50, h: 36, aggro: true, hops: false,
    drops: [['coin', 1, 10, 25], ['thorn', 0.55, 1, 2], ['blue_jelly', 0.15, 1, 1], ['mana_jelly', 0.2, 1, 2], ['crystal_sword', 0.03, 1, 1], ['iron_helm', 0.04, 1, 1]],
  },
  sprout_king: {
    name: 'Sprout King', boss: true, lvl: 4, hp: 5000, atk: 14, exp: 320, speed: 80, w: 120, h: 112, aggro: true, hops: false,
    phases: [['slam', 'charge'], ['slam', 'charge', 'summon', 'leap'], ['slam', 'charge', 'summon', 'leap']],
    ult: { name: 'Royal Decree', kind: 'stomp' }, minion: 'sprout',
    drops: [['royal_sap', 0.5, 1, 1], ['king_crown', 1, 1, 1], ['coin', 1, 50, 90], ['red_jelly', 1, 2, 4], ['mana_jelly', 1, 1, 2], ['wood_sword', 0.5, 1, 1], ['scroll_s100', 0.7, 1, 2], ['scroll_h100', 0.7, 1, 2], ['scroll_s60', 0.25, 1, 1], ['scroll_h60', 0.25, 1, 1]],
  },
  mother_mushroom: {
    name: 'Mother Mushroom', boss: true, lvl: 8, hp: 14000, atk: 24, exp: 950, speed: 60, w: 150, h: 140, aggro: true, hops: false,
    phases: [['slam', 'rain'], ['slam', 'rain', 'summon', 'leap'], ['slam', 'rain', 'summon', 'leap', 'barrage']],
    ult: { name: 'Spore Bloom', kind: 'spores' }, minion: 'mushling',
    drops: [['royal_sap', 0.8, 1, 2], ['spore_blade', 1, 1, 1], ['coin', 1, 120, 200], ['blue_jelly', 1, 1, 3], ['mana_jelly', 1, 2, 3], ['mush_helm', 0.6, 1, 1], ['scroll_s100', 1, 1, 2], ['scroll_h100', 1, 1, 2], ['scroll_s60', 0.4, 1, 1], ['scroll_h60', 0.4, 1, 1], ['scroll_s10', 0.05, 1, 1]],
  },
  bramble_behemoth: {
    name: 'Bramble Behemoth', boss: true, lvl: 12, hp: 30000, atk: 36, exp: 2500, speed: 95, w: 170, h: 130, aggro: true, hops: false,
    phases: [['charge', 'slam'], ['charge', 'slam', 'rain', 'summon'], ['charge', 'slam', 'rain', 'summon', 'leap', 'barrage']],
    ult: { name: 'Thorn Tsunami', kind: 'wave' }, minion: 'bramble',
    drops: [['royal_sap', 1, 1, 2], ['thorn_sword', 1, 1, 1], ['bramble_helm', 1, 1, 1], ['coin', 1, 250, 400], ['blue_jelly', 1, 2, 4], ['mana_jelly', 1, 2, 4], ['scroll_s100', 1, 1, 3], ['scroll_h100', 1, 1, 3], ['scroll_s60', 0.6, 1, 1], ['scroll_h60', 0.6, 1, 1], ['scroll_s10', 0.1, 1, 1], ['scroll_h10', 0.1, 1, 1]],
  },
  // ——— Frostpeak ———
  frostling: {
    name: 'Frostling', lvl: 13, hp: 380, atk: 30, exp: 90, speed: 60, w: 34, h: 34, aggro: false, hops: true,
    drops: [['coin', 1, 25, 45], ['ice_shard', 0.55, 1, 2], ['blue_jelly', 0.15, 1, 1], ['mana_jelly', 0.2, 1, 1], ['elixir', 0.03, 1, 1]],
  },
  yeti: {
    name: 'Yeti Cub', lvl: 16, hp: 650, atk: 40, exp: 150, speed: 70, w: 52, h: 50, aggro: true, hops: false,
    drops: [['coin', 1, 40, 70], ['ice_shard', 0.6, 1, 3], ['blue_jelly', 0.2, 1, 2], ['elixir', 0.05, 1, 1], ['frost_blade', 0.01, 1, 1]],
  },
  wisp: {
    name: 'Star Wisp', lvl: 19, hp: 800, atk: 48, exp: 230, speed: 85, w: 36, h: 40, aggro: false, hops: true,
    drops: [['coin', 1, 60, 100], ['stardust', 0.55, 1, 2], ['mana_jelly', 0.3, 1, 2], ['elixir', 0.07, 1, 1]],
  },
  golem: {
    name: 'Crystal Golem', lvl: 22, hp: 1400, atk: 60, exp: 380, speed: 55, w: 60, h: 62, aggro: true, hops: false,
    drops: [['coin', 1, 90, 160], ['stardust', 0.6, 1, 3], ['elixir', 0.1, 1, 1], ['star_crown', 0.008, 1, 1]],
  },
  frost_queen: {
    name: 'Frost Queen Glacia', boss: true, lvl: 18, hp: 45000, atk: 52, exp: 6000, speed: 90, w: 140, h: 160, aggro: true, hops: false,
    phases: [['rain', 'charge', 'slam'], ['rain', 'charge', 'slam', 'leap', 'summon'], ['barrage', 'rain', 'leap', 'slam', 'summon', 'charge']],
    ult: { name: 'Absolute Zero', kind: 'lanes' }, minion: 'frostling',
    drops: [['frost_heart', 1, 1, 2], ['frost_blade', 1, 1, 1], ['glacier_helm', 1, 1, 1], ['coin', 1, 600, 900], ['elixir', 1, 2, 4], ['ice_shard', 1, 4, 8], ['scroll_s60', 1, 1, 1], ['scroll_h60', 1, 1, 1], ['scroll_s10', 0.2, 1, 1], ['scroll_h10', 0.2, 1, 1], ['scroll_s30', 0.1, 1, 1], ['scroll_chaos', 0.1, 1, 1]],
  },
  astral_wyrm: {
    name: 'Astral Wyrm', boss: true, lvl: 25, hp: 90000, atk: 72, exp: 15000, speed: 110, w: 190, h: 150, aggro: true, hops: false,
    phases: [['rain', 'charge', 'leap'], ['barrage', 'charge', 'leap', 'slam', 'summon'], ['barrage', 'charge', 'leap', 'slam', 'summon', 'rain']],
    ult: { name: 'Supernova', kind: 'nova' }, minion: 'wisp',
    drops: [['frost_heart', 1, 2, 3], ['star_sword', 1, 1, 1], ['star_crown', 1, 1, 1], ['coin', 1, 1500, 2500], ['elixir', 1, 4, 6], ['stardust', 1, 6, 10], ['scroll_s60', 1, 1, 2], ['scroll_h60', 1, 1, 2], ['scroll_s10', 0.3, 1, 1], ['scroll_h10', 0.3, 1, 1], ['scroll_s30', 0.15, 1, 1], ['scroll_chaos', 0.15, 1, 1]],
  },
  // ——— the Emberdeep Caldera ———
  // ai: what makes a mob more than a walker (server/rpg.js mobAi, client src/rpg.js):
  //   lob: lobs a fireball at you from range (and backs off when you're close) · trail: leaves burning
  //   puddles behind it · shell: its front shell blocks `cut` of the damage (hit it from behind) and it
  //   lunges · dive: flies `fly` px up and swoops down at you · split: splits into `into` × n when it dies ·
  //   beam: fires a low laser along the floor (jump it) · blink: teleports behind you, then slashes around
  //   itself · phase: fades out (can't be hurt), then pulses outward when it comes back (dash through it)
  ember_imp: {
    name: 'Ember Imp', lvl: 30, hp: 1800, atk: 80, exp: 700, speed: 70, w: 34, h: 38, aggro: true, hops: true,
    ai: { kind: 'lob', range: 480, every: 2.8, keep: 170, warn: 0.5 },
    drops: [['coin', 1, 120, 200], ['ember_core', 0.5, 1, 2], ['elixir', 0.12, 1, 1], ['mega_elixir', 0.03, 1, 1], ['magma_maul', 0.003, 1, 1]],
  },
  magma_slug: {
    name: 'Magma Slug', lvl: 34, hp: 3000, atk: 90, exp: 900, speed: 32, w: 62, h: 34, aggro: false, hops: false,
    ai: { kind: 'trail', every: 0.8, life: 4, w: 54 },
    drops: [['coin', 1, 140, 230], ['ember_core', 0.6, 1, 3], ['elixir', 0.15, 1, 1], ['mega_elixir', 0.04, 1, 1]],
  },
  obsidian_crab: {
    name: 'Obsidian Crab', lvl: 40, hp: 3600, atk: 110, exp: 1150, speed: 60, w: 64, h: 44, aggro: true, hops: false,
    ai: { kind: 'shell', cut: 0.8, every: 3.2, warn: 0.5, lunge: 520, time: 0.35 },
    drops: [['coin', 1, 170, 280], ['obsidian_shard', 0.55, 1, 2], ['elixir', 0.15, 1, 1], ['mega_elixir', 0.05, 1, 1], ['ember_helm', 0.003, 1, 1]],
  },
  cinder_bat: {
    name: 'Cinder Bat', lvl: 45, hp: 3200, atk: 120, exp: 1300, speed: 110, w: 46, h: 30, aggro: true, hops: false, fly: 100,
    ai: { kind: 'dive', every: 3.5, warn: 0.6, time: 0.45 },
    drops: [['coin', 1, 190, 300], ['obsidian_shard', 0.5, 1, 2], ['mega_elixir', 0.06, 1, 1], ['phoenix_blade', 0.002, 1, 1]],
  },
  ignis: {
    name: 'Ignis the Magma Tyrant', boss: true, lvl: 36, hp: 150000, atk: 110, exp: 30000, speed: 85, w: 180, h: 170, aggro: true, hops: false,
    phases: [['slam', 'fireballs', 'geysers'], ['slam', 'fireballs', 'geysers', 'charge', 'flamewall'], ['geysers', 'fireballs', 'flamewall', 'leap', 'summon', 'barrage']],
    ult: { name: 'Caldera Eruption', kind: 'magma' }, minion: 'ember_imp',
    drops: [['phoenix_feather', 1, 1, 2], ['magma_maul', 1, 1, 1], ['ember_helm', 0.6, 1, 1], ['coin', 1, 3000, 5000], ['mega_elixir', 1, 2, 4], ['ember_core', 1, 6, 10], ['scroll_s60', 1, 1, 2], ['scroll_h60', 1, 1, 2], ['scroll_s10', 0.4, 1, 1], ['scroll_h10', 0.4, 1, 1], ['scroll_s30', 0.25, 1, 1], ['scroll_h30', 0.25, 1, 1], ['scroll_chaos', 0.25, 1, 1]],
  },
  pyra: {
    name: 'Pyra the Ember Phoenix', boss: true, lvl: 46, hp: 240000, atk: 140, exp: 55000, speed: 120, w: 170, h: 140, aggro: true, hops: false, fly: 40,
    phases: [['feathers', 'dive', 'rings'], ['feathers', 'dive', 'rings', 'rain', 'summon'], ['feathers', 'dive', 'rings', 'barrage', 'spiral']],
    ult: { name: 'Rebirth', kind: 'rebirth' }, minion: 'cinder_bat',
    drops: [['phoenix_feather', 1, 2, 3], ['phoenix_blade', 1, 1, 1], ['phoenix_crown', 0.6, 1, 1], ['coin', 1, 5000, 8000], ['mega_elixir', 1, 3, 5], ['obsidian_shard', 1, 6, 10], ['scroll_s60', 1, 2, 3], ['scroll_h60', 1, 2, 3], ['scroll_s10', 0.5, 1, 1], ['scroll_h10', 0.5, 1, 1], ['scroll_s30', 0.3, 1, 1], ['scroll_h30', 0.3, 1, 1], ['scroll_chaos', 0.3, 1, 1]],
  },
  // ——— the Aether Citadel ———
  cogling: {
    name: 'Cogling', lvl: 54, hp: 5000, atk: 150, exp: 1800, speed: 140, w: 44, h: 44, aggro: true, hops: false,
    ai: { kind: 'split', into: 'cogbit', n: 2 },
    drops: [['coin', 1, 260, 400], ['cog', 0.55, 1, 2], ['mega_elixir', 0.08, 1, 1], ['cog_cleaver', 0.002, 1, 1]],
  },
  cogbit: {
    name: 'Cogbit', lvl: 50, hp: 1200, atk: 110, exp: 400, speed: 175, w: 24, h: 24, aggro: true, hops: true,
    drops: [['coin', 1, 40, 80]],
  },
  sentry: {
    name: 'Sentry Drone', lvl: 58, hp: 4500, atk: 170, exp: 2000, speed: 45, w: 48, h: 46, aggro: true, hops: false, fly: 50,
    ai: { kind: 'beam', range: 620, every: 4, warn: 1, dur: 0.45, y0: 418, y1: 450 },
    drops: [['coin', 1, 280, 430], ['cog', 0.5, 1, 2], ['aether_crystal', 0.25, 1, 1], ['mega_elixir', 0.08, 1, 1]],
  },
  aether_knight: {
    name: 'Aether Knight', lvl: 66, hp: 8000, atk: 200, exp: 3200, speed: 80, w: 50, h: 62, aggro: true, hops: false,
    ai: { kind: 'blink', every: 5, warn: 0.4, slashWarn: 0.55, r: 120 },
    drops: [['coin', 1, 350, 550], ['aether_crystal', 0.5, 1, 2], ['mega_elixir', 0.1, 1, 1], ['aether_helm', 0.002, 1, 1]],
  },
  chrono_wraith: {
    name: 'Chrono Wraith', lvl: 72, hp: 7000, atk: 220, exp: 3800, speed: 65, w: 44, h: 56, aggro: true, hops: false, fly: 26,
    ai: { kind: 'phase', every: 7, dur: 2.2, r: 190 },
    drops: [['coin', 1, 400, 600], ['aether_crystal', 0.55, 1, 2], ['mega_elixir', 0.12, 1, 1], ['chrono_blade', 0.0015, 1, 1]],
  },
  colossus: {
    name: 'The Clockwork Colossus', boss: true, lvl: 60, hp: 420000, atk: 200, exp: 110000, speed: 70, w: 220, h: 200, aggro: true, hops: false,
    phases: [['slam', 'gears', 'beam'], ['slam', 'gears', 'beam', 'grid', 'sweep'], ['grid', 'sweep', 'gears', 'beam', 'charge', 'summon']],
    ult: { name: 'Overclock', kind: 'overclock' }, minion: 'cogling',
    drops: [['time_sand', 1, 1, 2], ['cog_cleaver', 1, 1, 1], ['aether_helm', 0.6, 1, 1], ['coin', 1, 9000, 14000], ['mega_elixir', 1, 4, 6], ['cog', 1, 8, 12], ['scroll_s60', 1, 2, 3], ['scroll_h60', 1, 2, 3], ['scroll_s10', 0.6, 1, 2], ['scroll_h10', 0.6, 1, 2], ['scroll_s30', 0.4, 1, 1], ['scroll_h30', 0.4, 1, 1], ['scroll_chaos', 0.4, 1, 2]],
  },
  chronos: {
    name: 'Chronos, Keeper of Hours', boss: true, lvl: 80, hp: 650000, atk: 260, exp: 220000, speed: 100, w: 160, h: 190, aggro: true, hops: false, fly: 30,
    phases: [['bombs', 'sweep', 'blink', 'spiral'], ['bombs', 'sweep', 'blink', 'spiral', 'echo', 'grid'], ['bombs', 'sweep', 'blink', 'spiral', 'echo', 'grid', 'summon']],
    ult: { name: 'Time Stop', kind: 'timestop' }, ults: [{ name: 'Time Stop', kind: 'timestop' }, { name: 'Collapse of Hours', kind: 'collapse' }], minion: 'chrono_wraith',
    drops: [['time_sand', 1, 2, 3], ['chrono_blade', 1, 1, 1], ['hourglass_crown', 0.6, 1, 1], ['coin', 1, 15000, 25000], ['mega_elixir', 1, 5, 8], ['aether_crystal', 1, 8, 12], ['scroll_s60', 1, 3, 4], ['scroll_h60', 1, 3, 4], ['scroll_s10', 0.8, 1, 2], ['scroll_h10', 0.8, 1, 2], ['scroll_s30', 0.5, 1, 2], ['scroll_h30', 0.5, 1, 2], ['scroll_chaos', 0.5, 1, 2]],
  },
  // ——— Frostpeak's later wildlife (atlas Phase 4; kept last: mob kinds go over the wire as their index) ———
  // floe seal: belly-slides along the ridge, harmless · snow owl: swoops from the pines (the cinder bat's
  // dive) · shard-moth: drifts over the summit, drawn to the wrong stars
  floe_seal: {
    name: 'Floe Seal', lvl: 14, hp: 460, atk: 30, exp: 110, speed: 70, w: 56, h: 30, aggro: false, hops: false,
    drops: [['coin', 1, 30, 55], ['ice_shard', 0.6, 1, 2], ['blue_jelly', 0.2, 1, 1], ['mana_jelly', 0.15, 1, 1], ['fur_hood', 0.006, 1, 1]],
  },
  snow_owl: {
    name: 'Snow Owl', lvl: 17, hp: 640, atk: 44, exp: 170, speed: 95, w: 44, h: 38, aggro: true, hops: false, fly: 95,
    ai: { kind: 'dive', every: 3.8, warn: 0.7, time: 0.5 },
    drops: [['coin', 1, 45, 80], ['ice_shard', 0.6, 1, 3], ['elixir', 0.05, 1, 1], ['bone_harpoon', 0.004, 1, 1]],
  },
  shard_moth: {
    name: 'Shard-Moth', lvl: 21, hp: 950, atk: 54, exp: 300, speed: 75, w: 46, h: 36, aggro: false, hops: false, fly: 70,
    drops: [['coin', 1, 80, 130], ['stardust', 0.55, 1, 2], ['mana_jelly', 0.3, 1, 1], ['elixir', 0.08, 1, 1]],
  },
};
// ——— elites and field bosses (docs/combat/stages.md; appended after the rest: kinds go over the wire as
// their index in MOBS) ———
// An elite is an ordinary mob made tougher by these multipliers, drawn as its base mob with a glow and a
// bigger name tag. Elites belong in hard pockets (story/world/island-depth.md); Bramble Woods has a couple
// as the first. Its coins scale by ELITE_GOLD and its other drops' chances by ELITE_DROP, so it's never
// more gold per EXP than its base mob (npm run economy checks it).
export const ELITE_HP = 3, ELITE_ATK = 1.5, ELITE_EXP = 2.5, ELITE_GOLD = 2.5, ELITE_DROP = 2, ELITE_LVL = 2, ELITE_SIZE = 1.25;
function elite(base, name) {
  const b = MOBS[base], r = Math.round;
  return {
    ...b, name, elite: true, base, lvl: b.lvl + ELITE_LVL, hp: r(b.hp * ELITE_HP), atk: r(b.atk * ELITE_ATK), exp: r(b.exp * ELITE_EXP),
    w: r(b.w * ELITE_SIZE), h: r(b.h * ELITE_SIZE), aggro: true,
    drops: b.drops.map(([id, ch, lo, hi]) => (id === 'coin' ? [id, ch, r(lo * ELITE_GOLD), r(hi * ELITE_GOLD)] : [id, Math.min(1, ch * ELITE_DROP), lo, hi])),
  };
}
MOBS.bramble_elite = elite('bramble', 'Elder Bramblehog');
// A field boss (field: true) roams an ordinary strip of a wilds room and comes back only every
// FIELD_BOSS_RESPAWN_MS; the room hears when it shows up (`desc` is the line). Small bosses: a name, a look
// and a move or two from the mob tricks (`ai`), no den, no phases, no ultimate. Its HP grows by
// BOSS_HP_PER_PLAYER for every extra slime fighting it, its loot is shared like a den boss's, and it's
// worth a few minutes of farming (npm run economy checks it).
//   stomp: crouches (warn), leaps and lands with a shockwave along the floor (jump it, or stand on a ledge)
MOBS.turnipop = {
  name: 'Turnipop', field: true, lvl: 5, hp: 1800, atk: 16, exp: 420, speed: 50, w: 92, h: 96, aggro: false, hops: false,
  ai: { kind: 'stomp', every: 3.6, warn: 0.9, r: 240, range: 300, jump: 620 },
  desc: 'Turnipop has popped up in Sprout Meadow!',
  drops: [['coin', 1, 80, 140], ['sprout_leaf', 1, 3, 6], ['red_jelly', 1, 2, 3], ['mana_jelly', 0.8, 1, 2], ['leaf_cap', 0.3, 1, 1], ['wood_sword', 0.3, 1, 1], ['scroll_s100', 0.35, 1, 1], ['scroll_h100', 0.35, 1, 1]],
};
export const FIELD_BOSS_RESPAWN_MS = 20 * 60_000;
// ——— Greenhollow's branches, G1 (art: src/willowmere-art.js, src/coves-art.js; story/world/island-depth.md).
// New mobs sit on the frozen curve (npm run economy checks it). style on lob / trail: how the shot or puddle
// looks (src/hazards.js) ———
// Willowmere: pond frogs hop the banks (harmless), dragonflies dive at you from the reeds, gloop snails
// leave sticky puddles; Old Snapjaw, a huge old pond turtle, surfaces in the Millpond now and then
MOBS.pond_frog = {
  name: 'Pond Frog', lvl: 6, hp: 95, atk: 13, exp: 24, speed: 50, w: 34, h: 28, aggro: false, hops: true,
  drops: [['coin', 0.9, 10, 18], ['lily_pad', 0.5, 1, 1], ['red_jelly', 0.15, 1, 1], ['mana_jelly', 0.1, 1, 1], ['lily_hat', 0.02, 1, 1]],
};
MOBS.dragonfly = {
  name: 'Dragonfly', lvl: 9, hp: 160, atk: 20, exp: 47, speed: 90, w: 46, h: 30, aggro: true, hops: false, fly: 85,
  ai: { kind: 'dive', every: 3.6, warn: 0.7, time: 0.45 },
  drops: [['coin', 1, 14, 26], ['dragon_wing', 0.55, 1, 1], ['mana_jelly', 0.2, 1, 1], ['blue_jelly', 0.08, 1, 1]],
};
MOBS.gloop_snail = {
  name: 'Gloop Snail', lvl: 13, hp: 520, atk: 30, exp: 97, speed: 30, w: 58, h: 38, aggro: false, hops: false,
  ai: { kind: 'trail', every: 0.9, life: 4, w: 50, style: 'goo' },
  drops: [['coin', 1, 30, 50], ['gloop', 0.6, 1, 2], ['blue_jelly', 0.15, 1, 1], ['elixir', 0.03, 1, 1], ['snail_helm', 0.004, 1, 1]],
};
MOBS.snapjaw = {
  name: 'Old Snapjaw', field: true, lvl: 15, hp: 12000, atk: 40, exp: 2400, speed: 40, w: 124, h: 82, aggro: false, hops: false,
  ai: { kind: 'shell', cut: 0.75, every: 3, warn: 0.7, lunge: 560, time: 0.4 },
  desc: 'Old Snapjaw has surfaced in the Millpond!',
  drops: [['coin', 1, 600, 1000], ['gloop', 1, 4, 6], ['blue_jelly', 1, 2, 3], ['snapjaw_shell', 0.4, 1, 1], ['reed_rapier', 0.25, 1, 1], ['scroll_s100', 0.5, 1, 1], ['scroll_h100', 0.5, 1, 1], ['scroll_s60', 0.15, 1, 1], ['scroll_h60', 0.15, 1, 1]],
};
// Saltspray Coves: rock crabs (front shell) and tide jellies (they go glassy, then sting) in the pools,
// storm gulls diving off the stacks, snapshrimp that snap water shots at you from range; the Tidemother's
// den is at the far end
MOBS.rock_crab = {
  name: 'Rock Crab', lvl: 11, hp: 300, atk: 25, exp: 68, speed: 55, w: 52, h: 36, aggro: false, hops: false,
  ai: { kind: 'shell', cut: 0.7, every: 3.4, warn: 0.55, lunge: 420, time: 0.3 },
  drops: [['coin', 1, 22, 38], ['crab_shell', 0.55, 1, 2], ['red_jelly', 0.15, 1, 1], ['blue_jelly', 0.1, 1, 1], ['mana_jelly', 0.15, 1, 1]],
};
MOBS.tide_jelly = {
  name: 'Tide Jelly', lvl: 15, hp: 480, atk: 36, exp: 131, speed: 40, w: 40, h: 44, aggro: false, hops: false, fly: 45,
  ai: { kind: 'phase', every: 6, dur: 1.8, r: 140 },
  drops: [['coin', 1, 40, 70], ['sea_glass', 0.6, 1, 2], ['mana_jelly', 0.25, 1, 1], ['elixir', 0.04, 1, 1]],
};
MOBS.storm_gull = {
  name: 'Storm Gull', lvl: 19, hp: 760, atk: 48, exp: 233, speed: 100, w: 50, h: 34, aggro: true, hops: false, fly: 100,
  ai: { kind: 'dive', every: 3.4, warn: 0.6, time: 0.42 },
  drops: [['coin', 1, 65, 105], ['gull_feather', 0.55, 1, 2], ['elixir', 0.07, 1, 1], ['blue_jelly', 0.15, 1, 1]],
};
MOBS.snapshrimp = {
  name: 'Snapshrimp', lvl: 23, hp: 1150, atk: 60, exp: 359, speed: 75, w: 46, h: 34, aggro: true, hops: false,
  ai: { kind: 'lob', range: 460, every: 2.6, keep: 160, warn: 0.5, style: 'water' },
  drops: [['coin', 1, 85, 145], ['coral', 0.55, 1, 2], ['elixir', 0.1, 1, 1], ['mega_elixir', 0.01, 1, 1], ['coral_saber', 0.004, 1, 1]],
};
// The Tidemother (her den is behind the sea cave at the Coves' far end). A big boss, so she has a story
// (story/characters/bosses.md) and `lines`: what she says to whoever walks in, at each new phase, and when
// she's freed (server/rpg.js bossSays, a bubble over her and a line in the chat)
MOBS.tidemother = {
  name: 'The Tidemother', boss: true, lvl: 25, hp: 80000, atk: 66, exp: 13000, speed: 90, w: 184, h: 150, aggro: true, hops: false,
  phases: [['slam', 'charge'], ['slam', 'charge', 'rain', 'summon'], ['charge', 'slam', 'rain', 'summon', 'leap', 'barrage']],
  ult: { name: 'Riptide', kind: 'wave' }, minion: 'rock_crab',
  lines: {
    enter: ['Mine. All of it is mine. The sea brought it and the sea shan\'t have it back.', 'Shoo! Don\'t touch the pretty things. Don\'t touch ANY of the things.'],
    phase: [null, 'You want my shells? My bottles? My lovely lost buttons? No!', 'If the tide goes out, it takes everything! I won\'t let it! I WON\'T!'],
    freed: 'Oh... it is heavy, isn\'t it. All of it. Let the tide have it, then. Let the water run clean.',
  },
  drops: [['royal_sap', 1, 1, 2], ['tide_claw', 1, 1, 1], ['hoard_crown', 0.6, 1, 1], ['coin', 1, 1200, 2000], ['elixir', 1, 2, 4], ['crab_shell', 1, 4, 8], ['scroll_s60', 1, 1, 2], ['scroll_h60', 1, 1, 2], ['scroll_s10', 0.25, 1, 1], ['scroll_h10', 0.25, 1, 1], ['scroll_s30', 0.1, 1, 1], ['scroll_chaos', 0.1, 1, 1]],
};
// ——— Greenhollow's branches, G2: the Mycelium Deep and Glowroot Hollow (art: src/deep-art.js;
// docs/places/deep.md). On the frozen curve like G1's ———
// The Deep: puffcaps lob spore balls, cave bats dive from the roof, puffballs burst into two pufflings,
// root beetles have a horned front (hit them from behind), knot spiders drop in behind you and lash out
MOBS.puffcap = {
  name: 'Puffcap', lvl: 16, hp: 560, atk: 39, exp: 153, speed: 40, w: 42, h: 44, aggro: true, hops: false,
  ai: { kind: 'lob', range: 440, every: 2.8, keep: 150, warn: 0.55, style: 'spore' },
  drops: [['coin', 1, 40, 66], ['spore_puff', 0.55, 1, 2], ['blue_jelly', 0.15, 1, 1], ['mana_jelly', 0.2, 1, 1], ['elixir', 0.05, 1, 1]],
};
MOBS.cave_bat = {
  name: 'Cave Bat', lvl: 20, hp: 860, atk: 52, exp: 264, speed: 105, w: 46, h: 32, aggro: true, hops: false, fly: 90,
  ai: { kind: 'dive', every: 3.4, warn: 0.6, time: 0.42 },
  drops: [['coin', 1, 60, 100], ['cave_wing', 0.55, 1, 2], ['elixir', 0.08, 1, 1], ['blue_jelly', 0.15, 1, 1]],
};
MOBS.puffball = {
  name: 'Puffball', lvl: 25, hp: 1300, atk: 63, exp: 400, speed: 60, w: 50, h: 46, aggro: false, hops: true,
  ai: { kind: 'split', into: 'puffling', n: 2 },
  drops: [['coin', 1, 85, 140], ['puff_fluff', 0.55, 1, 2], ['elixir', 0.1, 1, 1], ['mega_elixir', 0.01, 1, 1]],
};
MOBS.puffling = {
  name: 'Puffling', lvl: 22, hp: 320, atk: 50, exp: 60, speed: 150, w: 24, h: 24, aggro: true, hops: true,
  drops: [['coin', 1, 15, 30]],
};
MOBS.root_beetle = {
  name: 'Root Beetle', lvl: 28, hp: 2000, atk: 74, exp: 554, speed: 55, w: 60, h: 40, aggro: false, hops: false,
  ai: { kind: 'shell', cut: 0.75, every: 3.2, warn: 0.55, lunge: 480, time: 0.32 },
  drops: [['coin', 1, 110, 180], ['beetle_shell', 0.55, 1, 2], ['elixir', 0.12, 1, 1], ['mega_elixir', 0.03, 1, 1], ['beetle_helm', 0.004, 1, 1]],
};
MOBS.knot_spider = {
  name: 'Knot Spider', lvl: 32, hp: 2200, atk: 86, exp: 730, speed: 75, w: 48, h: 40, aggro: true, hops: false,
  ai: { kind: 'blink', every: 5, warn: 0.45, slashWarn: 0.55, r: 110 },
  drops: [['coin', 1, 130, 210], ['knot_silk', 0.5, 1, 2], ['elixir', 0.12, 1, 1], ['mega_elixir', 0.04, 1, 1], ['silk_blade', 0.003, 1, 1]],
};
// Glowroot Hollow (a hard pocket): glowworms throw a beam of light along the floor (jump it), glow moths
// fade out and pulse, threadweavers leave glowing sticky threads behind them; elites of both ends
MOBS.glowworm = {
  name: 'Glowworm', lvl: 42, hp: 3300, atk: 115, exp: 1225, speed: 35, w: 64, h: 34, aggro: true, hops: false,
  ai: { kind: 'beam', range: 560, every: 4.2, warn: 1, dur: 0.45, y0: 420, y1: 450, style: 'glow' },
  drops: [['coin', 1, 180, 290], ['glow_bead', 0.5, 1, 2], ['mega_elixir', 0.08, 1, 1], ['glowcap_helm', 0.003, 1, 1]],
};
MOBS.glow_moth = {
  name: 'Glow Moth', lvl: 46, hp: 3600, atk: 128, exp: 1446, speed: 70, w: 50, h: 40, aggro: true, hops: false, fly: 60,
  ai: { kind: 'phase', every: 6.5, dur: 2, r: 170 },
  drops: [['coin', 1, 200, 320], ['moth_dust', 0.5, 1, 2], ['mega_elixir', 0.08, 1, 1]],
};
MOBS.thread_weaver = {
  name: 'Threadweaver', lvl: 48, hp: 4400, atk: 135, exp: 1564, speed: 45, w: 60, h: 42, aggro: true, hops: false,
  ai: { kind: 'trail', every: 0.8, life: 4.5, w: 56, style: 'glow' },
  drops: [['coin', 1, 210, 340], ['glowthread', 0.5, 1, 2], ['mega_elixir', 0.08, 1, 1], ['glowroot_blade', 0.002, 1, 1]],
};
MOBS.glowworm_elite = elite('glowworm', 'Old Glowworm');
MOBS.weaver_elite = elite('thread_weaver', 'Elder Threadweaver');
// The Knotmole (her burrow is in the Knotted Halls). A big boss with a story (story/characters/bosses.md):
// an old blind mole who tied the warm threads in knots to keep the warmth for herself. Her Root Quake is
// the `stomp` ult (be off the floor when it lands)
MOBS.knotmole = {
  name: 'The Knotmole', boss: true, lvl: 35, hp: 135000, atk: 96, exp: 26000, speed: 80, w: 190, h: 150, aggro: true, hops: false,
  phases: [['slam', 'charge'], ['slam', 'charge', 'rain', 'summon'], ['charge', 'slam', 'rain', 'summon', 'leap', 'barrage']],
  ult: { name: 'Root Quake', kind: 'stomp' }, minion: 'puffcap',
  lines: {
    enter: ["Who's that? Out! The warm is MINE. Every last thread of it.", "Can't see you. Can smell you, though. You smell cold. Go away and stay cold."],
    phase: [null, 'Tied it tight, I did. Every knot. You shan\'t undo a single one!', 'If I let go it all runs off into the dark, off under the sea, and I\'ll be cold again! COLD!'],
    freed: 'Oh, my old paws... There it goes, running off under the sea. I\'d forgotten how it hums when it moves.',
  },
  drops: [['royal_sap', 1, 1, 2], ['burrow_claw', 1, 1, 1], ['knot_crown', 0.6, 1, 1], ['coin', 1, 3600, 5400], ['elixir', 1, 2, 4], ['mega_elixir', 1, 1, 3], ['knot_silk', 1, 6, 10], ['scroll_s60', 1, 1, 2], ['scroll_h60', 1, 1, 2], ['scroll_s10', 0.3, 1, 1], ['scroll_h10', 0.3, 1, 1], ['scroll_s30', 0.15, 1, 1], ['scroll_h30', 0.1, 1, 1], ['scroll_chaos', 0.15, 1, 1]],
};

// ——— Greenhollow's branches, G3: the Old Oak Canopy (art: src/canopy-art.js; docs/places/canopy.md). On the
// frozen curve like G1's and G2's ———
// Oak squirrels throw acorns from range, tent caterpillars leave sticky silk on the bough, flying squirrels
// glide in behind you and scratch, tawny owls dive from the branches, wasp nests burst into wasps when you
// knock them down, hornets flick stingers at you
MOBS.oak_squirrel = {
  name: 'Oak Squirrel', lvl: 26, hp: 1450, atk: 64, exp: 470, speed: 70, w: 40, h: 40, aggro: true, hops: true,
  ai: { kind: 'lob', range: 420, every: 2.6, keep: 140, warn: 0.5, style: 'acorn' },
  drops: [['coin', 1, 110, 180], ['oak_acorn', 0.55, 1, 2], ['elixir', 0.1, 1, 1], ['blue_jelly', 0.12, 1, 1], ['mega_elixir', 0.02, 1, 1]],
};
MOBS.tent_caterpillar = {
  name: 'Tent Caterpillar', lvl: 28, hp: 2000, atk: 72, exp: 554, speed: 32, w: 66, h: 30, aggro: false, hops: false,
  ai: { kind: 'trail', every: 0.85, life: 4.5, w: 54, style: 'silk' },
  drops: [['coin', 1, 120, 200], ['silk_tuft', 0.55, 1, 2], ['elixir', 0.12, 1, 1], ['mega_elixir', 0.03, 1, 1]],
};
MOBS.flying_squirrel = {
  name: 'Flying Squirrel', lvl: 31, hp: 2050, atk: 84, exp: 687, speed: 80, w: 46, h: 36, aggro: true, hops: true,
  ai: { kind: 'blink', every: 4.6, warn: 0.45, slashWarn: 0.55, r: 105 },
  drops: [['coin', 1, 135, 215], ['glider_fur', 0.5, 1, 2], ['elixir', 0.12, 1, 1], ['mega_elixir', 0.04, 1, 1]],
};
MOBS.tawny_owl = {
  name: 'Tawny Owl', lvl: 33, hp: 2250, atk: 90, exp: 774, speed: 90, w: 52, h: 46, aggro: true, hops: false, fly: 66,
  ai: { kind: 'dive', every: 3.3, warn: 0.65, time: 0.42 },
  drops: [['coin', 1, 145, 235], ['owl_feather', 0.5, 1, 2], ['elixir', 0.12, 1, 1], ['mega_elixir', 0.05, 1, 1], ['owl_cap', 0.004, 1, 1]],
};
MOBS.wasp_nest = {
  name: 'Wasp Nest', lvl: 36, hp: 3200, atk: 82, exp: 915, speed: 0, w: 50, h: 62, aggro: false, hops: false, anchored: true, // (anchored: hits don't knock it back)
  ai: { kind: 'split', into: 'wasp', n: 3 },
  drops: [['coin', 1, 160, 260], ['wasp_paper', 0.55, 1, 2], ['elixir', 0.12, 1, 1], ['mega_elixir', 0.06, 1, 1]],
};
MOBS.wasp = {
  name: 'Wasp', lvl: 34, hp: 520, atk: 92, exp: 110, speed: 150, w: 26, h: 22, aggro: true, hops: false, fly: 40,
  drops: [['coin', 1, 20, 40]],
};
MOBS.hornet = {
  name: 'Hornet', lvl: 38, hp: 2800, atk: 104, exp: 1015, speed: 85, w: 50, h: 40, aggro: true, hops: false, fly: 60,
  ai: { kind: 'lob', range: 380, every: 2.4, keep: 120, warn: 0.45, style: 'sting' },
  drops: [['coin', 1, 175, 285], ['hornet_sting', 0.5, 1, 2], ['elixir', 0.12, 1, 1], ['mega_elixir', 0.07, 1, 1], ['stingblade', 0.003, 1, 1]],
};
// The Hornet Queen: a field boss (small: no story), a great hornet who leaves her nest in the Wasp Crowns now
// and then and roams the boughs. Passive until hit; then she dives at you
MOBS.hornet_queen = {
  name: 'The Hornet Queen', field: true, lvl: 38, hp: 62000, atk: 100, exp: 18000, speed: 70, w: 118, h: 96, aggro: false, hops: false, fly: 115,
  ai: { kind: 'dive', every: 2.8, warn: 0.8, time: 0.5 },
  desc: 'The Hornet Queen has left her nest in the Wasp Crowns!',
  drops: [['coin', 1, 2200, 3400], ['honeycomb', 1, 4, 8], ['hornet_sting', 1, 3, 5], ['elixir', 1, 2, 3], ['mega_elixir', 1, 1, 2], ['queen_stinger', 0.25, 1, 1], ['honey_crown', 0.4, 1, 1], ['scroll_s60', 0.5, 1, 1], ['scroll_h60', 0.5, 1, 1], ['scroll_s10', 0.12, 1, 1], ['scroll_h10', 0.12, 1, 1]],
};

// ——— Greenhollow's branches, G4: the hard pockets (art: src/wreck-art.js, src/thornheart-art.js;
// docs/places/wreck.md, docs/places/thornheart.md). On the frozen curve like the others; elites only here ———
// Wreck Cave: barnacle crabs (front shell) and drowned lamps (go dark, then flare) in the Drowned Gallery;
// moray eels throw a jet of water along the floor (jump it) and bilge rats scurry round behind you and bite
// in the Wreck; the Drowned Bosun, a great old octopus in the bosun's coat, squirts ink
MOBS.barnacle_crab = {
  name: 'Barnacle Crab', lvl: 31, hp: 2400, atk: 83, exp: 687, speed: 55, w: 58, h: 40, aggro: true, hops: false,
  ai: { kind: 'shell', cut: 0.75, every: 3.2, warn: 0.5, lunge: 470, time: 0.32 },
  drops: [['coin', 1, 135, 215], ['barnacle', 0.55, 1, 2], ['elixir', 0.12, 1, 1], ['mega_elixir', 0.04, 1, 1], ['barnacle_helm', 0.004, 1, 1]],
};
MOBS.drowned_lamp = {
  name: 'Drowned Lamp', lvl: 33, hp: 2250, atk: 89, exp: 774, speed: 60, w: 40, h: 50, aggro: true, hops: false, fly: 52,
  ai: { kind: 'phase', every: 6.2, dur: 1.9, r: 150 },
  drops: [['coin', 1, 145, 235], ['lamp_glass', 0.5, 1, 2], ['elixir', 0.12, 1, 1], ['mega_elixir', 0.05, 1, 1]],
};
MOBS.moray_eel = {
  name: 'Moray Eel', lvl: 36, hp: 2650, atk: 97, exp: 915, speed: 45, w: 70, h: 36, aggro: true, hops: false,
  ai: { kind: 'beam', range: 520, every: 4.2, warn: 0.9, dur: 0.45, y0: 420, y1: 450, style: 'jet' },
  drops: [['coin', 1, 160, 260], ['moray_tooth', 0.5, 1, 2], ['elixir', 0.12, 1, 1], ['mega_elixir', 0.06, 1, 1], ['moray_fang', 0.003, 1, 1]],
};
MOBS.bilge_rat = {
  name: 'Bilge Rat', lvl: 38, hp: 2850, atk: 103, exp: 1015, speed: 85, w: 48, h: 34, aggro: true, hops: true,
  ai: { kind: 'blink', every: 4.8, warn: 0.45, slashWarn: 0.55, r: 105 },
  drops: [['coin', 1, 175, 285], ['brass_button', 0.5, 1, 2], ['elixir', 0.12, 1, 1], ['mega_elixir', 0.07, 1, 1]],
};
MOBS.barnacle_elite = elite('barnacle_crab', 'Old Barnacle Crab');
MOBS.eel_elite = elite('moray_eel', 'Great Moray');
// The Drowned Bosun: a field boss (small: no story), a great grey octopus who has lived in the wreck so long
// he wears the bosun's coat and cap and blows the whistle. Passive until hit; then he keeps his distance and
// squirts ink
MOBS.drowned_bosun = {
  name: 'The Drowned Bosun', field: true, lvl: 40, hp: 66000, atk: 104, exp: 19500, speed: 55, w: 136, h: 116, aggro: false, hops: false,
  ai: { kind: 'lob', range: 480, every: 2.4, keep: 170, warn: 0.7, style: 'ink' },
  desc: 'The Drowned Bosun is up and about in the Wreck! Hear the whistle?',
  drops: [['coin', 1, 2300, 3500], ['ink_sac', 1, 4, 8], ['brass_button', 1, 3, 5], ['elixir', 1, 2, 3], ['mega_elixir', 1, 1, 2], ['bosun_hook', 0.25, 1, 1], ['bosun_cap', 0.4, 1, 1], ['scroll_s60', 0.5, 1, 1], ['scroll_h60', 0.5, 1, 1], ['scroll_s10', 0.12, 1, 1], ['scroll_h10', 0.12, 1, 1]],
};
// The Thornheart: thornbacks (boars with a thorny front: hit them from behind), thistle puffs that burst into
// thistledown, pitcher plants rooted in place that spit thorn seeds, thorn stalkers that slip round behind
// you; the Thorn Hart, a great stag with antlers of briar, stamps the ground
MOBS.thornback = {
  name: 'Thornback', lvl: 51, hp: 5800, atk: 144, exp: 1753, speed: 60, w: 66, h: 46, aggro: true, hops: false,
  ai: { kind: 'shell', cut: 0.75, every: 3.2, warn: 0.55, lunge: 520, time: 0.32 },
  drops: [['coin', 1, 275, 435], ['thorn_bristle', 0.5, 1, 2], ['mega_elixir', 0.08, 1, 1], ['thornback_helm', 0.004, 1, 1]],
};
MOBS.thistle_puff = {
  name: 'Thistle Puff', lvl: 53, hp: 4700, atk: 151, exp: 1892, speed: 55, w: 52, h: 50, aggro: false, hops: true,
  ai: { kind: 'split', into: 'thistledown', n: 3 },
  drops: [['coin', 1, 290, 460], ['thistle_fluff', 0.5, 1, 2], ['mega_elixir', 0.08, 1, 1]],
};
MOBS.thistledown = {
  name: 'Thistledown', lvl: 50, hp: 900, atk: 138, exp: 210, speed: 140, w: 26, h: 26, aggro: true, hops: false, fly: 34,
  drops: [['coin', 1, 30, 55]],
};
MOBS.pitcher_plant = {
  name: 'Pitcher Plant', lvl: 55, hp: 5000, atk: 158, exp: 2036, speed: 0, w: 50, h: 70, aggro: true, hops: false, anchored: true,
  ai: { kind: 'lob', range: 460, every: 2.6, keep: 0, warn: 0.55, style: 'thorn' },
  drops: [['coin', 1, 300, 480], ['pitcher_nectar', 0.5, 1, 2], ['mega_elixir', 0.09, 1, 1]],
};
MOBS.thorn_stalker = {
  name: 'Thorn Stalker', lvl: 58, hp: 5400, atk: 168, exp: 2263, speed: 85, w: 60, h: 44, aggro: true, hops: false,
  ai: { kind: 'blink', every: 4.4, warn: 0.4, slashWarn: 0.5, r: 115 },
  drops: [['coin', 1, 320, 500], ['stalker_barb', 0.5, 1, 2], ['mega_elixir', 0.1, 1, 1], ['stalker_claw', 0.003, 1, 1]],
};
MOBS.thornback_elite = elite('thornback', 'Old Thornback');
MOBS.stalker_elite = elite('thorn_stalker', 'Elder Thorn Stalker');
// The Thorn Hart: a field boss (small: no story), a great white stag with antlers of living briar, who sleeps
// against the Hedge Stone and walks the Thornheart. Passive until hit; then he rears and stamps
MOBS.thorn_hart = {
  name: 'The Thorn Hart', field: true, lvl: 58, hp: 115000, atk: 160, exp: 40000, speed: 60, w: 150, h: 150, aggro: false, hops: false,
  ai: { kind: 'stomp', every: 3.4, warn: 0.9, r: 280, range: 320, jump: 640 },
  desc: 'The Thorn Hart is walking the Thornheart!',
  drops: [['coin', 1, 4400, 6400], ['antler_velvet', 1, 4, 8], ['stalker_barb', 1, 3, 5], ['mega_elixir', 1, 2, 3], ['briarheart_blade', 0.25, 1, 1], ['antler_crown', 0.4, 1, 1], ['scroll_s60', 0.5, 1, 1], ['scroll_h60', 0.5, 1, 1], ['scroll_s10', 0.15, 1, 1], ['scroll_h10', 0.15, 1, 1], ['scroll_s30', 0.05, 1, 1]],
};

// Boss phases: below these fractions of max HP a boss moves to its next phase (more moves, combos)
export const PHASE_AT = [1, 0.7, 0.3];
export const COMBO_CHANCE = [0, 0.4, 0.7]; // chance an attack chains into another, per phase
export const COMBO_MAX = [1, 2, 3]; // attacks in a row, per phase
// Ultimates: rare, heavily telegraphed, and they knock out anyone not standing somewhere safe
export const ULT_FIRST = 0.75; // first one once HP drops below this
export const ULT_EVERY = [0, 45, 32]; // seconds between ultimates in phase 2 / 3 (none in phase 1 until ULT_FIRST)
export const ULT_WARN = 3; // seconds of warning
// what's safe from each ultimate (checked on the client: src/rpg.js)
//   stomp: being off the floor (on a ledge or in the air) · spores: standing in one of the safe circles ·
//   wave: being in the air when the wave passes · lanes: standing in the one safe lane ·
//   nova: being at least NOVA_SAFE px from the boss
export const SAFE_R = 75;
export const NOVA_SAFE = 620;
export const WAVE_SPEED = 520;

// Where mobs live: each spawn patrols its own strip (the ground, or a platform) and respawns there.
const strip = (kind, x0, x1, y, n, room = FIELD) => Array.from({ length: n }, () => ({ kind, x0, x1, y, room }));
const plat = (i) => FIELD_PLATFORMS[i];
const onPlat = (kind, i, n) => strip(kind, plat(i).x + 15, plat(i).x + plat(i).w - 15, plat(i).y, n);
const hplat = (i) => HIGHLAND_PLATFORMS[i];
const onHPlat = (kind, i, n) => strip(kind, hplat(i).x + 15, hplat(i).x + hplat(i).w - 15, hplat(i).y, n, HIGHLANDS);
const onRoomPlat = (plats, room) => (kind, i, n) => strip(kind, plats[i].x + 15, plats[i].x + plats[i].w - 15, plats[i].y, n, room);
const onCPlat = onRoomPlat(CALDERA_PLATFORMS, CALDERA);
const onTPlat = onRoomPlat(CITADEL_PLATFORMS, CITADEL);
const onWPlat = onRoomPlat(WILLOWMERE_PLATFORMS, WILLOWMERE);
const onSPlat = onRoomPlat(COVES_PLATFORMS, COVES);
const onDPlat = onRoomPlat(MYCELIUM_PLATFORMS, MYCELIUM);
const onGPlat = onRoomPlat(GLOWROOT_PLATFORMS, GLOWROOT);
const onOPlat = onRoomPlat(CANOPY_PLATFORMS, CANOPY);
const onKPlat = onRoomPlat(WRECK_PLATFORMS, WRECK);
const onBPlat = onRoomPlat(THORN_PLATFORMS, THORNHEART);
export const SPAWNS = [
  ...strip('sprout', 250, 1550, FIELD_GROUND, 7),
  ...onPlat('sprout', 0, 2),
  ...onPlat('sprout', 1, 1),
  ...onPlat('sprout', 2, 1),
  ...strip('mushling', 1650, 3150, FIELD_GROUND, 6),
  ...onPlat('mushling', 3, 2),
  ...onPlat('mushling', 4, 1),
  ...onPlat('mushling', 5, 2),
  ...strip('bramble', 3250, 4750, FIELD_GROUND, 5),
  ...onPlat('bramble', 6, 1),
  ...onPlat('bramble', 7, 1),
  ...onPlat('bramble', 8, 1),
  ...strip('bramble_elite', 3600, 4600, FIELD_GROUND, 1),
  ...onPlat('bramble_elite', 7, 1),
  { kind: 'turnipop', x0: 520, x1: 1420, y: FIELD_GROUND, room: FIELD },
  ...strip('frostling', 250, 1100, FIELD_GROUND, 5, HIGHLANDS),
  ...strip('yeti', 1000, 1950, FIELD_GROUND, 4, HIGHLANDS),
  ...onHPlat('frostling', 0, 2),
  ...onHPlat('frostling', 1, 1),
  ...onHPlat('yeti', 2, 1),
  ...strip('wisp', 2100, 2950, FIELD_GROUND, 4, HIGHLANDS),
  ...strip('golem', 2900, 3900, FIELD_GROUND, 4, HIGHLANDS),
  ...onHPlat('wisp', 3, 2),
  ...onHPlat('wisp', 4, 1),
  ...onHPlat('golem', 5, 1),
  ...strip('floe_seal', 400, 1200, FIELD_GROUND, 3, HIGHLANDS),
  ...strip('snow_owl', 1100, 1900, FIELD_GROUND, 2, HIGHLANDS),
  ...onHPlat('snow_owl', 1, 1),
  ...strip('shard_moth', 2200, 3700, FIELD_GROUND, 3, HIGHLANDS),
  ...onHPlat('shard_moth', 4, 1),
  // the Caldera
  ...strip('ember_imp', 250, 1150, FIELD_GROUND, 5, CALDERA),
  ...strip('magma_slug', 1100, 2100, FIELD_GROUND, 4, CALDERA),
  ...onCPlat('ember_imp', 0, 1),
  ...onCPlat('ember_imp', 1, 1),
  ...onCPlat('magma_slug', 2, 1),
  ...strip('obsidian_crab', 2300, 3200, FIELD_GROUND, 4, CALDERA),
  ...strip('cinder_bat', 3100, 3900, FIELD_GROUND, 4, CALDERA),
  ...onCPlat('obsidian_crab', 3, 1),
  ...onCPlat('cinder_bat', 4, 1),
  ...onCPlat('obsidian_crab', 5, 1),
  // the Citadel
  ...strip('cogling', 250, 1250, FIELD_GROUND, 5, CITADEL),
  ...strip('sentry', 1150, 2200, FIELD_GROUND, 4, CITADEL),
  ...onTPlat('cogling', 0, 1),
  ...onTPlat('sentry', 1, 1),
  ...onTPlat('cogling', 2, 1),
  ...strip('aether_knight', 2500, 3500, FIELD_GROUND, 4, CITADEL),
  ...strip('chrono_wraith', 3400, 4450, FIELD_GROUND, 4, CITADEL),
  ...onTPlat('aether_knight', 3, 1),
  ...onTPlat('chrono_wraith', 4, 1),
  ...onTPlat('aether_knight', 5, 1),
  // Willowmere (the mill's end, x < 900, has none)
  ...strip('pond_frog', 950, 2450, FIELD_GROUND, 6, WILLOWMERE),
  ...onWPlat('pond_frog', 2, 2),
  ...onWPlat('pond_frog', 4, 1),
  ...strip('dragonfly', 1700, 2450, FIELD_GROUND, 3, WILLOWMERE),
  ...onWPlat('dragonfly', 3, 1),
  ...strip('gloop_snail', 2600, 4100, FIELD_GROUND, 5, WILLOWMERE),
  ...onWPlat('gloop_snail', 5, 1),
  ...onWPlat('gloop_snail', 7, 1),
  ...strip('dragonfly', 2700, 3600, FIELD_GROUND, 2, WILLOWMERE),
  ...onWPlat('dragonfly', 6, 1),
  { kind: 'snapjaw', x0: 2800, x1: 4000, y: FIELD_GROUND, room: WILLOWMERE },
  // Saltspray Coves (Driftwood Cove, x > 3600, has none; the Tidemother's cave mouth is at TIDE_DEN_X)
  ...strip('rock_crab', 2700, 3500, FIELD_GROUND, 5, COVES),
  ...onSPlat('rock_crab', 5, 1),
  ...strip('tide_jelly', 1950, 2800, FIELD_GROUND, 4, COVES),
  ...onSPlat('tide_jelly', 3, 1),
  ...onSPlat('tide_jelly', 4, 1),
  ...strip('storm_gull', 950, 1850, FIELD_GROUND, 4, COVES),
  ...onSPlat('storm_gull', 2, 1),
  ...strip('snapshrimp', 520, 1300, FIELD_GROUND, 4, COVES),
  ...onSPlat('snapshrimp', 0, 1),
  ...onSPlat('storm_gull', 1, 1),
  // the Mycelium Deep (the Root Stair, x < 1000, has none; the Knotmole's burrow is at KNOT_DEN_X)
  ...strip('puffcap', 1150, 1800, FIELD_GROUND, 5, MYCELIUM),
  ...onDPlat('puffcap', 1, 2),
  ...strip('cave_bat', 1700, 2350, FIELD_GROUND, 3, MYCELIUM),
  ...onDPlat('cave_bat', 2, 1),
  ...onDPlat('cave_bat', 3, 1),
  ...strip('puffball', 2450, 3150, FIELD_GROUND, 4, MYCELIUM),
  ...onDPlat('puffball', 4, 1),
  ...strip('root_beetle', 3100, 3750, FIELD_GROUND, 4, MYCELIUM),
  ...onDPlat('root_beetle', 5, 1),
  ...onDPlat('root_beetle', 6, 1),
  ...strip('knot_spider', 3850, 4480, FIELD_GROUND, 3, MYCELIUM),
  ...strip('root_beetle', 3850, 4450, FIELD_GROUND, 2, MYCELIUM),
  ...strip('knot_spider', 4720, 5000, FIELD_GROUND, 2, MYCELIUM),
  ...onDPlat('knot_spider', 7, 1),
  ...onDPlat('knot_spider', 9, 1),
  // Glowroot Hollow (the Glowfall, x < 500, has none; glowworms stay on the floor: their beam runs along it)
  ...strip('glowworm', 560, 1500, FIELD_GROUND, 4, GLOWROOT),
  ...strip('glow_moth', 1300, 1950, FIELD_GROUND, 3, GLOWROOT),
  ...onGPlat('glow_moth', 0, 1),
  ...onGPlat('glow_moth', 1, 1),
  ...onGPlat('glow_moth', 2, 1),
  ...strip('thread_weaver', 2100, 3500, FIELD_GROUND, 4, GLOWROOT),
  ...strip('glowworm', 2100, 3000, FIELD_GROUND, 2, GLOWROOT),
  ...onGPlat('thread_weaver', 3, 1),
  ...onGPlat('thread_weaver', 5, 1),
  ...onGPlat('glow_moth', 4, 1),
  ...strip('glowworm_elite', 2200, 3300, FIELD_GROUND, 1, GLOWROOT),
  ...strip('weaver_elite', 2400, 3500, FIELD_GROUND, 1, GLOWROOT),
  // the Old Oak Canopy (the Treehouse Camp, x < 1000, has none; squirrels throw, so they keep well away from it)
  ...strip('oak_squirrel', 1150, 1750, FIELD_GROUND, 4, CANOPY),
  ...onOPlat('oak_squirrel', 1, 1),
  ...onOPlat('oak_squirrel', 2, 1),
  ...strip('tent_caterpillar', 1700, 2350, FIELD_GROUND, 4, CANOPY),
  ...onOPlat('tent_caterpillar', 3, 1),
  ...onOPlat('tent_caterpillar', 4, 1),
  ...strip('flying_squirrel', 2450, 3150, FIELD_GROUND, 3, CANOPY),
  ...onOPlat('flying_squirrel', 5, 1),
  ...onOPlat('flying_squirrel', 6, 1),
  ...strip('tawny_owl', 3050, 3850, FIELD_GROUND, 3, CANOPY),
  ...onOPlat('tawny_owl', 7, 1),
  ...onOPlat('tawny_owl', 8, 1),
  ...strip('wasp_nest', 3950, 4650, FIELD_GROUND, 3, CANOPY),
  ...onOPlat('wasp_nest', 9, 1),
  ...onOPlat('wasp_nest', 10, 1),
  ...strip('hornet', 4550, 5380, FIELD_GROUND, 4, CANOPY),
  ...onOPlat('hornet', 11, 1),
  ...onOPlat('hornet', 12, 1),
  { kind: 'hornet_queen', x0: 4300, x1: 5320, y: FIELD_GROUND, room: CANOPY },
  // Wreck Cave (the Cave Mouth, x > 3250, has none)
  ...strip('barnacle_crab', 2300, 3150, FIELD_GROUND, 4, WRECK),
  ...onKPlat('barnacle_crab', 0, 1),
  ...onKPlat('barnacle_crab', 2, 1),
  ...strip('drowned_lamp', 1850, 2900, FIELD_GROUND, 3, WRECK),
  ...onKPlat('drowned_lamp', 1, 1),
  ...onKPlat('drowned_lamp', 3, 1),
  ...strip('moray_eel', 1150, 1800, FIELD_GROUND, 3, WRECK),
  ...strip('moray_eel', 250, 800, FIELD_GROUND, 1, WRECK),
  ...strip('bilge_rat', 250, 1500, FIELD_GROUND, 3, WRECK),
  ...onKPlat('bilge_rat', 4, 1),
  ...onKPlat('bilge_rat', 5, 1),
  ...onKPlat('bilge_rat', 6, 1),
  ...strip('barnacle_elite', 2400, 3100, FIELD_GROUND, 1, WRECK),
  ...strip('eel_elite', 300, 1100, FIELD_GROUND, 1, WRECK),
  { kind: 'drowned_bosun', x0: 200, x1: 1700, y: FIELD_GROUND, room: WRECK },
  // the Thornheart (the Briar Gate, x < 520, has none)
  ...strip('thornback', 620, 1350, FIELD_GROUND, 4, THORNHEART),
  ...onBPlat('thornback', 0, 1),
  ...strip('thistle_puff', 1300, 2250, FIELD_GROUND, 4, THORNHEART),
  ...onBPlat('thistle_puff', 1, 1),
  ...onBPlat('thistle_puff', 2, 1),
  ...onBPlat('thistle_puff', 3, 1),
  ...strip('pitcher_plant', 2420, 3200, FIELD_GROUND, 3, THORNHEART),
  ...onBPlat('pitcher_plant', 4, 1),
  ...strip('thorn_stalker', 2900, 3900, FIELD_GROUND, 3, THORNHEART),
  ...onBPlat('thorn_stalker', 5, 1),
  ...onBPlat('thorn_stalker', 6, 1),
  ...onBPlat('thorn_stalker', 7, 1),
  ...strip('thornback_elite', 900, 2100, FIELD_GROUND, 1, THORNHEART),
  ...strip('stalker_elite', 3000, 3900, FIELD_GROUND, 1, THORNHEART),
  { kind: 'thorn_hart', x0: 2450, x1: 3850, y: FIELD_GROUND, room: THORNHEART },
];
export const MOB_RESPAWN_MS = 9000;

// ——— boss dens: one per zone, a separate arena room behind a cave mouth near the zone's east end ———
// Bosses are mobs too (in MOBS, with boss: true), living alone in their den with whatever they summon.
// attacks: slam (jump + ground shockwave: jump or stand on a platform to dodge) · charge (dash across the
// den) · rain (things fall on marked spots) · summon (a few minions). Below 30% HP they enrage (faster).
export const DEN_W = 1500;
// from: the stage room the den's entrance is in
export const DENS = [
  { room: 6, boss: 'sprout_king', name: "Sprout King's Hollow", from: FIELD, entranceX: 1480, theme: 'sprout' },
  { room: 7, boss: 'mother_mushroom', name: "Mother Mushroom's Grotto", from: FIELD, entranceX: 3080, theme: 'mushroom' },
  { room: 8, boss: 'bramble_behemoth', name: 'The Briar Throne', from: FIELD, entranceX: 4520, theme: 'bramble' },
  { room: 10, boss: 'frost_queen', name: 'The Frozen Throne', from: HIGHLANDS, entranceX: 1880, theme: 'frost' },
  { room: 11, boss: 'astral_wyrm', name: 'Starfall Sanctum', from: HIGHLANDS, entranceX: 3820, theme: 'star' },
  { room: 14, boss: 'ignis', name: 'The Molten Forge', from: CALDERA, entranceX: 2080, theme: 'magma' },
  { room: 15, boss: 'pyra', name: 'Phoenix Roost', from: CALDERA, entranceX: 4060, theme: 'phoenix' },
  { room: 16, boss: 'colossus', name: 'The Grand Foundry', from: CITADEL, entranceX: 2280, theme: 'clock' },
  { room: 17, boss: 'chronos', name: 'The Hour Sanctum', from: CITADEL, entranceX: 4620, theme: 'chrono' },
  { room: 26, boss: 'tidemother', name: "The Tidemother's Hoard", from: COVES, entranceX: TIDE_DEN_X, theme: 'tide' }, // (art: src/dens-coves.js)
  { room: 30, boss: 'knotmole', name: 'The Knotted Burrow', from: MYCELIUM, entranceX: KNOT_DEN_X, theme: 'knot' }, // (art: src/dens-deep.js)
];
export const DEN_EXIT_X = 80;
export const DEN_PLATFORMS = [
  { x: 250, y: 330, w: 200, kind: 'ledge' },
  { x: 1050, y: 330, w: 200, kind: 'ledge' },
  { x: 640, y: 230, w: 220, kind: 'ledge' },
];
export const BOSS_RESPAWN_MS = 60_000;
// The boss reward window (S0, story/progression.md): a den boss respawns every BOSS_RESPAWN_MS, but each
// slime gets its full EXP and a full loot roll from a given boss only once per BOSS_WINDOW_MS. Kills
// inside the window give BOSS_REPEAT_SHARE of the EXP, and the loot drops at that share of its chances
// (unless someone in the fight has their window open: the loot is one shared set per kill).
export const BOSS_WINDOW_MS = 15 * 60_000;
export const BOSS_REPEAT_SHARE = 0.1;
// Over-level EXP falloff (S0): a mob or boss more than OVERLEVEL_GRACE levels below you gives
// OVERLEVEL_STEP less EXP per extra level, down to OVERLEVEL_FLOOR. Fighting at your own level is untouched.
export const OVERLEVEL_GRACE = 10;
export const OVERLEVEL_STEP = 0.05;
export const OVERLEVEL_FLOOR = 0.1;
export const overlevelScale = (lvl, mobLvl) => Math.max(OVERLEVEL_FLOOR, Math.min(1, 1 - (lvl - mobLvl - OVERLEVEL_GRACE) * OVERLEVEL_STEP));
// A boss's HP grows by this much for every extra slime in its den (and keeps the damage already done)
export const BOSS_HP_PER_PLAYER = 0.6;
export const COMBAT_ROOMS = new Set([...Object.keys(STAGES).map(Number), ...DENS.map((d) => d.room)]);
export const isCombat = (room) => COMBAT_ROOMS.has(room);
export const denAt = (room) => DENS.find((d) => d.room === room);

// ——— items ———
// kind: coin · potion (heal) · loot (just collectible, for now) · helmet (def) · sword (atk, reach)
// aim: the level a shop item is priced for (docs/economy.md; npm run economy checks it)
export const ITEMS = {
  coin: { name: 'Gold', kind: 'coin', desc: 'Shiny slime gold. Spend it at the shop in Slimeville.' },
  red_jelly: { name: 'Strawberry Jelly', price: 25, kind: 'potion', heal: 35, desc: 'Restores 35 HP.' },
  blue_jelly: { name: 'Blueberry Jelly', price: 80, kind: 'potion', heal: 100, desc: 'Restores 100 HP.' },
  mana_jelly: { name: 'Grape Jelly', price: 40, kind: 'potion', mana: 50, desc: 'Restores 50 MP.' },
  sprout_leaf: { name: 'Sprout Leaf', price: 4, kind: 'loot', desc: 'A springy little leaf from a Sprout.' },
  mush_cap: { name: 'Mushling Cap', price: 12, kind: 'loot', desc: 'A soft, spotted mushroom cap.' },
  thorn: { name: 'Bramble Thorn', price: 30, kind: 'loot', desc: 'A sharp thorn from a Bramblehog. Ouch.' },
  wood_sword: { name: 'Wooden Sword', price: 60, kind: 'sword', atk: 5, reach: 14, desc: 'A practice sword. Better than a mitten.' },
  iron_sword: { name: 'Iron Sword', price: 450, kind: 'sword', atk: 12, reach: 22, desc: 'A proper blade.' },
  crystal_sword: { name: 'Crystal Sword', price: 2200, kind: 'sword', atk: 22, reach: 30, desc: 'Glows faintly pink. Hits very hard.' },
  leaf_cap: { name: 'Leaf Cap', price: 50, kind: 'helmet', def: 2, desc: 'A cap woven from big leaves.' },
  mush_helm: { name: 'Mushroom Helm', price: 400, kind: 'helmet', def: 5, desc: 'Bouncy and surprisingly sturdy.' },
  iron_helm: { name: 'Iron Helm', price: 1500, kind: 'helmet', def: 9, desc: 'Heavy, shiny, very safe.' },
  // boss drops
  king_crown: { name: 'Sprout Crown', price: 1200, kind: 'helmet', def: 6, desc: "The Sprout King's leafy crown. Still a bit springy." },
  spore_blade: { name: 'Spore Blade', price: 3000, kind: 'sword', atk: 18, reach: 24, desc: "Carved from Mother Mushroom's stalk. Puffs spores when it hits." },
  thorn_sword: { name: 'Briar Greatsword', price: 9000, kind: 'sword', atk: 32, reach: 36, desc: 'A huge thorny blade from the Bramble Behemoth.' },
  frost_blade: { name: 'Frostbite Blade', price: 15000, kind: 'sword', atk: 44, reach: 38, desc: "Glacia's icy sword. Cold to the touch, colder to be hit by." },
  glacier_helm: { name: 'Glacier Crown', price: 12000, kind: 'helmet', def: 20, desc: 'A crown of never-melting ice.' },
  star_sword: { name: 'Starforged Sword', price: 40000, kind: 'sword', atk: 62, reach: 44, desc: 'Forged from a fallen star. Leaves a trail of sparkles.' },
  star_crown: { name: 'Astral Crown', price: 30000, kind: 'helmet', def: 28, desc: 'The Astral Wyrm\'s crest. It hums with starlight.' },
  ice_shard: { name: 'Ice Shard', price: 60, kind: 'loot', desc: 'A shard of ice that never melts.' },
  stardust: { name: 'Stardust', price: 120, kind: 'loot', desc: 'A pinch of glittering stardust.' },
  elixir: { name: 'Rainbow Elixir', price: 400, kind: 'potion', heal: 300, mana: 150, desc: 'Restores 300 HP and 150 MP.' },
  // Netmender Runa's (Icefang Hamlet): the fjord folk's warm gear
  fur_hood: { name: 'Seal-Fur Hood', price: 3000, aim: 15, kind: 'helmet', def: 11, desc: 'Seal fur over a knitted cap. The fjord folk swear by it.' },
  bone_harpoon: { name: 'Whalebone Harpoon', price: 5000, aim: 18, kind: 'sword', atk: 27, reach: 40, desc: 'Old whalebone, filed to a point. Cold to hold.' },
  bramble_helm: { name: 'Briar Helm', price: 7000, kind: 'helmet', def: 14, desc: 'Woven from living brambles. Nothing gets through.' },
  // the Caldera and the Citadel
  ember_core: { name: 'Ember Core', price: 200, kind: 'loot', desc: 'A warm little coal that never goes out.' },
  obsidian_shard: { name: 'Obsidian Shard', price: 300, kind: 'loot', desc: 'Glassy black volcanic stone, razor sharp.' },
  cog: { name: 'Brass Cog', price: 450, kind: 'loot', desc: 'A finely made cog. Still ticking, somehow.' },
  aether_crystal: { name: 'Aether Crystal', price: 700, kind: 'loot', desc: 'A sliver of crystallised sky.' },
  mega_elixir: { name: 'Mega Elixir', price: 1500, kind: 'potion', heal: 900, mana: 400, desc: 'Restores 900 HP and 400 MP.' },
  magma_maul: { name: 'Magma Maul', price: 60000, kind: 'sword', atk: 78, reach: 46, slots: 9, desc: "Ignis's molten blade. It glows like a forge." },
  ember_helm: { name: 'Ember Helm', price: 45000, kind: 'helmet', def: 34, slots: 9, desc: 'A horned helm of cooled lava, still warm inside.' },
  phoenix_blade: { name: 'Phoenix Blade', price: 90000, kind: 'sword', atk: 92, reach: 48, slots: 9, desc: "A sword of Pyra's flame-feathers. It never stops burning." },
  phoenix_crown: { name: 'Phoenix Crown', price: 70000, kind: 'helmet', def: 40, slots: 9, desc: 'A crest of fiery plumes.' },
  cog_cleaver: { name: 'Cog Cleaver', price: 150000, kind: 'sword', atk: 112, reach: 52, slots: 10, desc: 'A great geared blade from the Colossus. It whirs when swung.' },
  aether_helm: { name: 'Aether Helm', price: 120000, kind: 'helmet', def: 50, slots: 10, desc: 'Brass and sky-crystal. Light as a cloud.' },
  chrono_blade: { name: 'Chrono Blade', price: 300000, kind: 'sword', atk: 135, reach: 56, slots: 10, desc: "The hand of Chronos's great clock, sharpened. Time slows where it cuts." },
  hourglass_crown: { name: 'Hourglass Crown', price: 240000, kind: 'helmet', def: 62, slots: 10, desc: 'Sand still trickles through it, upward.' },
  // ——— Greenhollow's branches (G1). lvl: the level a piece of gear is as strong as (it must sit on the
  // frozen gear curve: npm run economy); traders' gear also has an `aim`. Mob drops sit a little under
  // their trader's tier, den gear a step above. Art: src/willowmere-art.js, src/coves-art.js ———
  lily_pad: { name: 'Lily Pad', price: 12, kind: 'loot', desc: 'A round green lily pad. A frog was sitting on it a moment ago.' },
  dragon_wing: { name: 'Dragonfly Wing', price: 30, kind: 'loot', desc: 'A wing like a stained-glass window, light as a breath.' },
  gloop: { name: 'Snail Gloop', price: 45, kind: 'loot', desc: 'Sticky, shiny and faintly minty. Somebody must want it.' },
  crab_shell: { name: 'Crab Shell', price: 40, kind: 'loot', desc: 'A rock crab outgrew this. It is surprisingly heavy.' },
  sea_glass: { name: 'Sea Glass', price: 60, kind: 'loot', desc: 'A pebble of glass, worn smooth and frosted by the tide.' },
  gull_feather: { name: 'Storm Feather', price: 90, kind: 'loot', desc: 'A long grey gull feather that smells of rain.' },
  coral: { name: 'Pink Coral', price: 120, kind: 'loot', desc: 'A knobbly twig of pink coral from the deep pools.' },
  lily_hat: { name: 'Lilypad Hat', price: 300, lvl: 6, kind: 'helmet', def: 6, desc: 'A lily pad worn as a hat. Frogs find it very reassuring.' },
  miller_cap: { name: "Miller's Cap", price: 700, lvl: 8, aim: 9, kind: 'helmet', def: 8, desc: 'A soft flour-dusted cap from the mill. It smells of bread.' },
  reed_rapier: { name: 'Reed Rapier', price: 900, lvl: 8, aim: 9, kind: 'sword', atk: 19, reach: 30, desc: 'A long thin blade with a grip of plaited river reeds.' },
  snail_helm: { name: 'Snailshell Helm', price: 4000, lvl: 12, kind: 'helmet', def: 14, desc: 'A spiral shell, still a little sticky inside. Very snug.' },
  snapjaw_shell: { name: 'Snapjaw Shell', price: 6500, lvl: 15, kind: 'helmet', def: 17, desc: "A scute from Old Snapjaw's back, mossy and older than the mill." },
  drift_cutlass: { name: 'Driftwood Cutlass', price: 5000, lvl: 16, aim: 18, kind: 'sword', atk: 40, reach: 36, desc: 'Sea-bleached driftwood with an edge of bright sea glass.' },
  conch_helm: { name: 'Conch Helm', price: 4000, lvl: 16, aim: 18, kind: 'helmet', def: 18, desc: 'A big pink conch. Hold it to your ear and you hear the sea.' },
  coral_saber: { name: 'Coral Saber', price: 16000, lvl: 21, kind: 'sword', atk: 52, reach: 42, desc: 'A curved blade of pink coral, grown, not forged.' },
  tide_claw: { name: "Tidemother's Claw", price: 36000, lvl: 26, kind: 'sword', atk: 64, reach: 46, slots: 8, desc: "The Tidemother's great claw, still gripping. It never lets go of anything." },
  hoard_crown: { name: 'Hoardshell Crown', price: 27000, lvl: 26, kind: 'helmet', def: 29, slots: 8, desc: 'A crown crusted with buttons, bottle caps and shells the sea gave back.' },
  // ——— G2: the Mycelium Deep and Glowroot Hollow (art: src/deep-art.js) ———
  spore_puff: { name: 'Puffcap Spores', price: 80, kind: 'loot', desc: 'A pouch of fine lilac spores. Do not sneeze.' },
  cave_wing: { name: 'Cave Bat Wing', price: 110, kind: 'loot', desc: 'A soft leathery wing, folded up like an umbrella.' },
  puff_fluff: { name: 'Puffball Fluff', price: 140, kind: 'loot', desc: 'A handful of fluff from a burst puffball. It floats if you let go.' },
  beetle_shell: { name: 'Root Beetle Shell', price: 200, kind: 'loot', desc: 'A shiny brown wing case, hard as a nut and knobbly as a root.' },
  knot_silk: { name: 'Knot Silk', price: 260, kind: 'loot', desc: 'A skein of spider silk tied in tiny knots. It glows a little in the dark.' },
  glow_bead: { name: 'Glowworm Bead', price: 380, kind: 'loot', desc: "A warm bead of light from a glowworm's tail. It never quite goes out." },
  moth_dust: { name: 'Glowmoth Dust', price: 420, kind: 'loot', desc: 'Shimmering wing dust. It leaves your fingers glowing for an hour.' },
  glowthread: { name: 'Glowthread', price: 460, kind: 'loot', desc: 'A strand of the glowing threads that run under the island. It hums faintly.' },
  rootwood_saber: { name: 'Rootwood Saber', price: 11000, lvl: 24, aim: 26, kind: 'sword', atk: 58, reach: 42, desc: 'Carved from a root of the Deep, dark and hard as iron. It glows along the grain.' },
  lantern_cap: { name: 'Lantern Cap', price: 8500, lvl: 24, aim: 26, kind: 'helmet', def: 26, desc: "A forager's leather cap with a glowing mushroom for a lamp. Never be lost underground." },
  beetle_helm: { name: 'Beetleshell Helm', price: 22000, lvl: 27, kind: 'helmet', def: 29, desc: "A root beetle's horned wing case. Charge with it at your peril." },
  silk_blade: { name: 'Silkthread Blade', price: 36000, lvl: 31, kind: 'sword', atk: 70, reach: 46, desc: 'A pale blade wound tight with knot silk. It whispers when it cuts.' },
  burrow_claw: { name: "Knotmole's Claw", price: 52000, lvl: 37, kind: 'sword', atk: 79, reach: 48, slots: 8, desc: "The Knotmole's great digging claw. It has tied a thousand knots and untied one." },
  knot_crown: { name: 'Knotroot Crown', price: 40000, lvl: 37, kind: 'helmet', def: 35, slots: 8, desc: 'Warm roots knotted into a crown. It still holds on, but gently now.' },
  glowcap_helm: { name: 'Glowcap Helm', price: 62000, lvl: 44, kind: 'helmet', def: 38, desc: 'A great glowing mushroom cap, hollowed out. Everyone can see you coming.' },
  glowroot_blade: { name: 'Glowroot Blade', price: 90000, lvl: 47, kind: 'sword', atk: 93, reach: 50, desc: 'A sword grown from the heart of Glowroot Hollow. The light runs down it like sap.' },
  // ——— G3: the Old Oak Canopy (art: src/canopy-art.js) ———
  oak_acorn: { name: 'Oak Acorn', price: 170, kind: 'loot', desc: 'A fat glossy acorn with its cap on. A squirrel was saving it for winter.' },
  silk_tuft: { name: 'Silk Tuft', price: 200, kind: 'loot', desc: 'A soft white tuft of caterpillar silk, still a bit sticky.' },
  glider_fur: { name: 'Glider Fur', price: 240, kind: 'loot', desc: "A wisp of silver fur from a flying squirrel's wing flap. Lighter than air, nearly." },
  owl_feather: { name: 'Owl Feather', price: 270, kind: 'loot', desc: 'A barred brown feather, so soft it makes no sound when it falls.' },
  wasp_paper: { name: 'Wasp Paper', price: 300, kind: 'loot', desc: 'A curl of grey paper from a wasp nest, chewed from old wood. You could write on it, carefully.' },
  hornet_sting: { name: 'Hornet Stinger', price: 330, kind: 'loot', desc: 'A hornet stinger as long as a finger. Hold it by the blunt end.' },
  honeycomb: { name: 'Wild Honeycomb', price: 420, kind: 'loot', desc: "A slab of golden comb from the Hornet Queen's nest, dripping. Hornets don't make honey. These ones stole it." },
  ranger_billhook: { name: "Ranger's Billhook", price: 16000, lvl: 30, aim: 32, kind: 'sword', atk: 70, reach: 44, desc: 'A hooked oak-handled blade for clearing paths through the branches. Ranger Acorn keeps hers very sharp.' },
  ranger_hood: { name: "Ranger's Hat", price: 12000, lvl: 30, aim: 32, kind: 'helmet', def: 31, desc: 'A broad green felt hat with an acorn badge and a jay feather in the band.' },
  owl_cap: { name: 'Owlfeather Cap', price: 30000, lvl: 33, kind: 'helmet', def: 32, desc: 'A cap of soft owl feathers with two little ear tufts. You hear everything in it.' },
  stingblade: { name: 'Stingblade', price: 50000, lvl: 37, kind: 'sword', atk: 79, reach: 48, desc: "A long straight blade ground from a hornet's stinger, banded amber and black." },
  queen_stinger: { name: "Queen's Stinger", price: 56000, lvl: 39, kind: 'sword', atk: 82, reach: 50, desc: "The Hornet Queen's own stinger, gold at the tip. It hums when it's swung." },
  honey_crown: { name: 'Honeycomb Crown', price: 42000, lvl: 39, kind: 'helmet', def: 36, desc: 'A crown of golden wax cells, warm and faintly sticky. Bees follow you around.' },
  // ——— G4: the hard pockets (art: src/wreck-art.js, src/thornheart-art.js). No trader: drops only ———
  barnacle: { name: 'Barnacle Cluster', price: 230, kind: 'loot', desc: 'A knobbly clump of barnacles prised off a crab. The crab is relieved.' },
  lamp_glass: { name: 'Lamp Glass', price: 270, kind: 'loot', desc: "A ship's lamp chimney, green with age, that still glows a little in the dark." },
  moray_tooth: { name: 'Moray Tooth', price: 300, kind: 'loot', desc: 'A long hooked eel tooth. Moray eels have a second set further back. Nobody asks why.' },
  brass_button: { name: 'Brass Button', price: 330, kind: 'loot', desc: 'A brass button with an apple stamped on it, off an old sailor\'s coat. Bilge rats hoard them.' },
  ink_sac: { name: 'Bosun\'s Ink', price: 450, kind: 'loot', desc: 'A squishy sac of octopus ink, deep purple-black. Good for writing very serious letters.' },
  thorn_bristle: { name: 'Thorn Bristle', price: 420, kind: 'loot', desc: "A stiff tuft of a thornback's bristles, with a thorn grown into every one." },
  thistle_fluff: { name: 'Thistle Fluff', price: 440, kind: 'loot', desc: 'A soft purple-white puff of thistledown. It tries to float away when you open your bag.' },
  pitcher_nectar: { name: 'Pitcher Nectar', price: 460, kind: 'loot', desc: 'A stoppered flask of sweet sticky nectar from a pitcher plant. Smells like honey and trouble.' },
  stalker_barb: { name: 'Stalker Barb', price: 500, kind: 'loot', desc: 'A curved black thorn shed by a thorn stalker. It grew on a living thing, which is the unsettling part.' },
  antler_velvet: { name: 'Antler Velvet', price: 600, kind: 'loot', desc: "Soft green velvet the Thorn Hart rubs off his antlers on the Hedge Stone. Tiny white roses grow on it." },
  barnacle_helm: { name: 'Barnacle Helm', price: 37000, lvl: 33, kind: 'helmet', def: 32, desc: "An old ship's helmet so crusted with barnacles it's mostly barnacle now." },
  moray_fang: { name: 'Moray Fang', price: 55000, lvl: 36, kind: 'sword', atk: 77, reach: 48, desc: 'A long hooked blade of eel tooth, sea-green and wickedly sharp. It bites, then holds on.' },
  bosun_hook: { name: "Bosun's Boathook", price: 74000, lvl: 41, kind: 'sword', atk: 85, reach: 52, desc: "The Bosun's own boathook: an oak pole with a brass hook, worn smooth by eight tentacles." },
  bosun_cap: { name: "Bosun's Cap", price: 57000, lvl: 41, kind: 'helmet', def: 37, desc: 'A navy knitted watch cap with a brass whistle on a cord. Blow it and everyone stands up straighter.' },
  thornback_helm: { name: 'Thornback Helm', price: 93000, lvl: 52, kind: 'helmet', def: 44, desc: "A thick leather helm with a ridge of thornback bristles down the middle. Nobody pats you on the head." },
  stalker_claw: { name: "Stalker's Claw", price: 145000, lvl: 57, kind: 'sword', atk: 107, reach: 52, desc: 'A curved black blade like a great thorn. It strikes from where you aren\'t looking.' },
  briarheart_blade: { name: 'Briarheart Blade', price: 156000, lvl: 59, kind: 'sword', atk: 110, reach: 56, desc: 'A sword of living briar wood, grown, not forged. A white rose buds on the guard and never opens.' },
  antler_crown: { name: 'Hart\'s Antler Crown', price: 120000, lvl: 59, kind: 'helmet', def: 49, desc: 'A crown of shed briar antlers, soft with green velvet, white roses at the tips.' },
  // ——— farming and alchemy (src/shared/alchemy.js): herbs grow in garden plots, potions are brewed at a lab.
  // Herbs and brews sell for less than their seeds cost (npm run economy checks it): they're for using.
  // buff: { atk (ATK and MAGIC ×1+atk), crit (+crit chance), ward (damage taken ×1−ward), regen (fight HP regen
  // ×1+regen), exp (mob EXP ×1+exp), gold (gold picked up ×1+gold) } for `dur` s;
  // one brewed buff at a time (a new one replaces it). full: fills HP and MP.
  mintleaf: { name: 'Mintleaf', price: 3, kind: 'loot', herb: true, desc: 'A cool, fresh herb from your garden.' },
  sunberry: { name: 'Sunberry', price: 8, kind: 'loot', herb: true, desc: 'A warm golden berry. Smells like summer.' },
  moonbell: { name: 'Moonbell', price: 20, kind: 'loot', herb: true, desc: 'A pale flower that only rings at night.' },
  frostbloom: { name: 'Frostbloom', price: 70, kind: 'loot', herb: true, desc: 'Icy petals that never wilt.' },
  emberroot: { name: 'Emberroot', price: 180, kind: 'loot', herb: true, desc: 'A knobbly root, hot to the touch.' },
  starlotus: { name: 'Starlotus', price: 450, kind: 'loot', herb: true, desc: 'A lotus that glows like a tiny star.' },
  // boss reagents: only bosses drop them, for the rarest brews
  royal_sap: { name: 'Royal Sap', price: 200, kind: 'loot', reagent: true, desc: 'Golden sap from a forest boss. Alchemists prize it.' },
  frost_heart: { name: 'Frost Heart', price: 800, kind: 'loot', reagent: true, desc: 'A beating heart of ice from a boss of Frostpeak.' },
  phoenix_feather: { name: 'Phoenix Feather', price: 2500, kind: 'loot', reagent: true, desc: 'A feather that is still on fire. From a boss of the Caldera.' },
  time_sand: { name: 'Sand of Hours', price: 7000, kind: 'loot', reagent: true, desc: 'Sand from a great clock. It falls upward.' },
  mint_tonic: { name: 'Mint Tonic', price: 3, kind: 'potion', brewed: true, heal: 250, desc: 'Brewed. Restores 250 HP.' },
  sun_cordial: { name: 'Sunberry Cordial', price: 5, kind: 'potion', brewed: true, mana: 200, desc: 'Brewed. Restores 200 MP.' },
  sprout_salve: { name: 'Sprout Salve', price: 3, kind: 'potion', brewed: true, heal: 450, mana: 100, desc: 'Brewed. Restores 450 HP and 100 MP.' },
  moon_draught: { name: 'Moonbell Draught', price: 10, kind: 'potion', brewed: true, heal: 700, mana: 350, desc: 'Brewed. Restores 700 HP and 350 MP.' },
  might_brew: { name: 'Brew of Might', price: 12, kind: 'potion', brewed: true, buff: { atk: 0.15 }, dur: 600, desc: 'Brewed. +15% ATK and MAGIC for 10 minutes.' },
  scholar_tea: { name: "Scholar's Tea", price: 15, kind: 'potion', brewed: true, buff: { exp: 0.15 }, dur: 600, desc: 'Brewed. +15% EXP from mobs for 10 minutes.' },
  jelly_blend: { name: 'Jellyberry Blend', price: 40, kind: 'potion', brewed: true, heal: 1000, mana: 500, desc: 'Brewed. Restores 1000 HP and 500 MP.' },
  frost_ward: { name: 'Frostbloom Ward', price: 60, kind: 'potion', brewed: true, buff: { ward: 0.25 }, dur: 600, desc: 'Brewed. Take 25% less damage for 10 minutes.' },
  star_tonic: { name: 'Stardust Tonic', price: 55, kind: 'potion', brewed: true, heal: 800, mana: 1500, desc: 'Brewed. Restores 800 HP and 1500 MP.' },
  briar_balm: { name: 'Briar Balm', price: 45, kind: 'potion', brewed: true, buff: { regen: 2 }, dur: 600, desc: 'Brewed. Triple HP regeneration in fights for 10 minutes.' },
  royal_draught: { name: 'Royal Draught', price: 75, kind: 'potion', brewed: true, buff: { exp: 0.3 }, dur: 600, desc: 'Brewed. +30% EXP from mobs for 10 minutes.' },
  ember_fury: { name: 'Emberroot Fury', price: 150, kind: 'potion', brewed: true, buff: { atk: 0.25, crit: 0.1 }, dur: 600, desc: 'Brewed. +25% ATK and MAGIC and +10% crit chance for 10 minutes.' },
  obsidian_skin: { name: 'Obsidian Skin', price: 200, kind: 'potion', brewed: true, buff: { ward: 0.35 }, dur: 600, desc: 'Brewed. Take 35% less damage for 10 minutes.' },
  glacial_elixir: { name: 'Glacial Heart Elixir', price: 350, kind: 'potion', brewed: true, full: true, buff: { ward: 0.3, regen: 1 }, dur: 600, desc: 'Brewed. Fully restores HP and MP, then 30% less damage taken and double HP regeneration for 10 minutes.' },
  star_elixir: { name: 'Starlotus Elixir', price: 650, kind: 'potion', brewed: true, full: true, buff: { atk: 0.2, crit: 0.05, ward: 0.15 }, dur: 600, desc: 'Brewed. Fully restores HP and MP, then +20% ATK and MAGIC, +5% crit and 15% less damage taken for 10 minutes.' },
  gilded_draught: { name: 'Gilded Draught', price: 480, kind: 'potion', brewed: true, buff: { gold: 0.2 }, dur: 600, desc: 'Brewed. +20% gold picked up for 10 minutes.' },
  phoenix_draught: { name: 'Phoenix Draught', price: 1800, kind: 'potion', brewed: true, full: true, buff: { atk: 0.35, crit: 0.15, regen: 1 }, dur: 600, desc: 'Brewed. Fully restores HP and MP, then +35% ATK and MAGIC, +15% crit and double HP regeneration for 10 minutes.' },
  hour_elixir: { name: 'Elixir of Hours', price: 4400, kind: 'potion', brewed: true, full: true, buff: { atk: 0.3, crit: 0.1, ward: 0.25, exp: 0.2 }, dur: 900, desc: 'Brewed. Fully restores HP and MP, then +30% ATK and MAGIC, +10% crit, 25% less damage taken and +20% EXP for 15 minutes.' },
  sludge: { name: 'Murky Sludge', price: 1, kind: 'loot', desc: 'A brew gone wrong. It bubbles sadly.' },
  // ——— pet food (Auntie Clover's, the Pet Shop: docs/places/pets.md). food: how much of a pet's belly one
  // fills (1 = full, which lasts PET_STARVE_MS). Fed at home: E at the pet.
  pet_kibble: { name: 'Pet Kibble', price: 400, kind: 'loot', food: 0.25, desc: 'Crunchy little biscuits. Fills a quarter of a pet\'s belly. Feed it at home: E at the pet.' },
  pet_stew: { name: 'Hearty Pet Stew', price: 1200, kind: 'loot', food: 1, desc: 'A whole bowl of stew. Fills a pet right up for two days. Feed it at home: E at the pet.' },
  // ——— enhancement scrolls (boss drops): see SCROLL rules below ———
  scroll_s100: { name: 'Sword Scroll 100%', price: 300, kind: 'scroll', slot: 'sword', rate: 1, atk: 1, magic: 1, desc: 'Always works: +1 ATK and +1 MAGIC on a sword.' },
  scroll_s60: { name: 'Sword Scroll 60%', price: 1500, kind: 'scroll', slot: 'sword', rate: 0.6, atk: 3, magic: 2, desc: '60% chance: +3 ATK and +2 MAGIC on a sword.' },
  scroll_s10: { name: 'Sword Scroll 10%', price: 6000, kind: 'scroll', slot: 'sword', rate: 0.1, atk: 7, magic: 5, desc: '10% chance: +7 ATK and +5 MAGIC on a sword.' },
  scroll_s30: { name: 'Dark Sword Scroll 30%', price: 4000, kind: 'scroll', slot: 'sword', rate: 0.3, atk: 6, magic: 4, dark: 0.5, desc: '30% chance: +6 ATK and +4 MAGIC on a sword. If it fails, a 50% chance the sword is DESTROYED.' },
  scroll_h100: { name: 'Helmet Scroll 100%', price: 300, kind: 'scroll', slot: 'helmet', rate: 1, def: 1, hp: 10, desc: 'Always works: +1 DEF and +10 max HP on a helmet.' },
  scroll_h60: { name: 'Helmet Scroll 60%', price: 1500, kind: 'scroll', slot: 'helmet', rate: 0.6, def: 2, hp: 30, desc: '60% chance: +2 DEF and +30 max HP on a helmet.' },
  scroll_h10: { name: 'Helmet Scroll 10%', price: 6000, kind: 'scroll', slot: 'helmet', rate: 0.1, def: 5, hp: 80, desc: '10% chance: +5 DEF and +80 max HP on a helmet.' },
  scroll_h30: { name: 'Dark Helmet Scroll 30%', price: 4000, kind: 'scroll', slot: 'helmet', rate: 0.3, def: 4, hp: 60, dark: 0.5, desc: '30% chance: +4 DEF and +60 max HP on a helmet. If it fails, a 50% chance the helmet is DESTROYED.' },
  scroll_chaos: { name: 'Chaos Scroll 60%', price: 5000, kind: 'scroll', slot: 'any', rate: 0.6, chaos: true, desc: "60% chance to reroll the item's bonuses wildly: each one changes by -3 to +5 (HP by ten times that). Swords or helmets." },
};
export const STACKS = (id) => ['coin', 'potion', 'loot', 'scroll'].includes(ITEMS[id]?.kind);

// ——— enhancement (MapleStory style) ———
// Every sword and helmet has a number of upgrade slots (ITEMS.slots, else DEFAULT_SLOTS). Each scroll
// used on it takes one slot whether it works or not, and nothing ever gives a slot back. A piece of gear
// carries its own enhancement e = { u: slots used, s: successes, atk, magic, def, hp } (bag entries and
// the worn gear keep it with them). Dark scrolls can destroy the item when they fail.
export const DEFAULT_SLOTS = { sword: 7, helmet: 7 };
export const slotsOf = (id) => ITEMS[id]?.slots ?? DEFAULT_SLOTS[ITEMS[id]?.kind] ?? 0;
export const canScroll = (scrollId, itemId) => {
  const sc = ITEMS[scrollId], it = ITEMS[itemId];
  return sc?.kind === 'scroll' && (it?.kind === 'sword' || it?.kind === 'helmet') && (sc.slot === 'any' || sc.slot === it.kind);
};
export const enhName = (id, e) => `${ITEMS[id]?.name ?? id}${e?.s ? ` +${e.s}` : ''}`;
// Roll a scroll on gear `itemId` with enhancement e (not changed) → { ok, boom, e: the new enhancement }
export function rollScroll(scrollId, itemId, e, rnd = Math.random) {
  const sc = ITEMS[scrollId], kind = ITEMS[itemId].kind;
  const next = { u: 0, s: 0, atk: 0, magic: 0, def: 0, hp: 0, ...(e ?? {}) };
  next.u++;
  if (rnd() >= sc.rate) return { ok: false, boom: !!sc.dark && rnd() < sc.dark, e: next };
  next.s++;
  if (sc.chaos) {
    const d = () => Math.floor(rnd() * 9) - 3; // -3 … +5
    if (kind === 'sword') {
      next.atk = Math.max(0, next.atk + d());
      next.magic = Math.max(0, next.magic + d());
    } else {
      next.def = Math.max(0, next.def + d());
      next.hp = Math.max(0, next.hp + d() * 10);
    }
  } else for (const k of ['atk', 'magic', 'def', 'hp']) next[k] += sc[k] ?? 0;
  return { ok: true, boom: false, e: next };
}
export const BAG_SLOTS = 24;

// ——— gold and the shop (Merchant Pip's stall in the village) ———
// Buying costs `price`; selling gives back SELL_RATE of it (loot materials exist mostly to be sold).
export const SHOP_X = 2780;
export const SHOP_RANGE = 120;
export const SELL_RATE = 0.4;
export const SHOP_STOCK = ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'mega_elixir', 'wood_sword', 'iron_sword', 'crystal_sword', 'leaf_cap', 'mush_helm', 'iron_helm'];
// Every shopkeeper: where they stand (room, x; you trade within SHOP_RANGE) and what they sell. Pip's has
// the Boutique too. Runa is also an AI character: her dialog has a Trade button (src/npc.js).
export const SHOPS = {
  pip: { name: "Merchant Pip's Shop", room: 0 /* the village */, x: SHOP_X, stock: SHOP_STOCK, boutique: true },
  runa: { name: "Runa's Net Shed", room: FJORD, x: RUNA_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'frostbloom', 'fur_hood', 'bone_harpoon'] },
  // the branches' traders (island depth: each branch sells the basic potions, so a deep branch isn't a walk
  // back to Pip, and a tier of gear for its middle levels)
  bun: { name: 'Willowmere Mill', room: WILLOWMERE, x: BUN_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'reed_rapier', 'miller_cap'] },
  moss: { name: "Moss's Driftwood Shack", room: COVES, x: MOSS_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'drift_cutlass', 'conch_helm'] },
  truffle: { name: "Truffle's Camp", room: MYCELIUM, x: TRUFFLE_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'mega_elixir', 'rootwood_saber', 'lantern_cap'] },
  acorn: { name: "Acorn's Treehouse", room: CANOPY, x: ACORN_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'mega_elixir', 'ranger_billhook', 'ranger_hood'] },
  // the Pet Shop: pet food only (the pets themselves are on plinths: furni-buy, src/petshop.js)
  clover: { name: "Clover's Critters", room: PETSHOP, x: CLOVER_X, stock: ['pet_kibble', 'pet_stew'] },
};
export const sellPrice = (id) => Math.max(1, Math.floor((ITEMS[id]?.price ?? 0) * SELL_RATE));
export const BUY_MAX = 20; // potions bought at once

// ——— the Boutique (a tab in Pip's shop): the friends' signature accessories (once worn for
// free by their accounts, now anyone's to buy), sold cheaply as cosmetics. Owned ones can be worn in any mix from the bag's Style row; they're purely
// for looks (src/slime.js draws them, keyed by these ids). Hiding the helmet shows them unobstructed.
export const COSMETICS = {
  ribbon: { name: 'Pink Ribbon', price: 150, desc: "A big pink bow, just like shireen's." },
  glasses: { name: 'Round Glasses', price: 120, desc: "Studious round specs (shireen's style)." },
  notes: { name: 'Study Notes', price: 150, desc: 'A notebook to scribble in. Very serious.' },
  bowtie: { name: 'Bowtie', price: 120, desc: "A dapper bowtie, qinxin's signature." },
  flute: { name: 'Flute', price: 200, desc: "darrell's flute: it toots when you jump." },
  laptop: { name: 'Laptop', price: 250, desc: "chenyirong's laptop, notifications and all." },
};
export const PICKUP_RANGE = 55;

// ——— levels and combat ———
export const maxHpFor = (lvl) => 40 + lvl * 12;
export const expToNext = (lvl) => Math.round(12 * lvl ** 1.7 + 8);
export const attackFor = (lvl, sword) => 4 + lvl * 2 + (ITEMS[sword]?.atk ?? 0);
export const defenseFor = (helmet) => ITEMS[helmet]?.def ?? 0;
export const reachFor = (sword) => ITEMS[sword]?.reach ?? 0; // extra slap reach, px
export const HURT_INVULN_MS = 1200; // after a mob hits you
