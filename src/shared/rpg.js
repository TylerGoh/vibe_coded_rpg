// Docs: docs/combat/core.md, docs/combat/stages.md, docs/combat/bosses.md, docs/combat/items.md, docs/places/alchemy.md
// Shared by client and server: the mob stage (the Wildwood, east of the village), its mobs, items,
// levels and combat numbers. The server runs the mobs and decides every hit, drop and pickup
// (server/rpg.js); the client only draws them (src/rpg.js, art in src/field.js).
import { curve } from './curve.js';

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
export const PETSHOP_W = 4000;
export const PETSHOP_EXIT_X = 90;
export const CLOVER_X = 420; // Auntie Clover, behind her counter (she trades: SHOPS)
export const FJORD_FIRE_X = 2120;
export const FJORD_LODESTAR_X = 1180; // the Lodestar's gangway, south to Emberdeep (boards STEAM_N, sim.js)
export const FJORD_EXIT_X = FJORD_W - 90; // up to Frostpine Ridge
export const RUNA_X = 1560; // Netmender Runa, at her net shed (she trades: SHOPS)
export const FJORD_PLATFORMS = [
  { x: 690, y: 378, w: 100, kind: 'crates' },
  { x: 1765, y: 330, w: 150, kind: 'turf' },
  { x: 2560, y: 322, w: 170, kind: 'turf' },
  { x: 2790, y: 362, w: 120, kind: 'rock' },
];
export const HIGHLAND_ZONES = [
  { name: 'Frostpine Ridge', x0: 0, x1: 2000, lvl: '40–46' },
  { name: 'Starfall Summit', x0: 2000, x1: HIGHLANDS_W, lvl: '47+' },
];
export const HIGHLAND_PLATFORMS = [
  { x: 380, y: 330, w: 220, kind: 'ice' },
  { x: 820, y: 240, w: 200, kind: 'ice' },
  { x: 1300, y: 320, w: 240, kind: 'ice' },
  { x: 2300, y: 330, w: 220, kind: 'crystal' },
  { x: 2750, y: 230, w: 200, kind: 'crystal' },
  { x: 3250, y: 320, w: 240, kind: 'crystal' },
];
// The third stage: Emberdeep (the room is still called the Caldera in code), up the road from Forgehold. The
// pass down from Starfall Summit went when the Lodestar started sailing (atlas Phase 5): the summit's east
// end is a plain lookout now (SUMMIT_LOOKOUT_X, drawn by src/highlands.js).
export const CALDERA = 12; // room id
export const CALDERA_W = 4400;
export const CALDERA_EXIT_X = 70; // back down the road to Forgehold
export const SUMMIT_LOOKOUT_X = 3950; // where the pass used to go down, at Starfall Summit's east end
// Emberdeep's branches' blocked ways in (EMBERDEEP in branches.js; docs/places/branches.md), in Cinder Flats
// and Magma Heart, and the grounded balloon by the thermal column (atlas Phase 6)
export const COAST_GATE_X = 1190; // the gully south to the Smoking Coast (a fresh lava tongue across it)
export const ASHWOOD_GATE_X = 1690; // the old charcoal road north to the Ashwood (its iron bridge fallen in)
export const BRIMSTONE_GATE_X = 3270; // up the cone's flank to the Brimstone Fields (the vent field fuming)
export const BALLOON_X = 3745; // the balloon in its cradle, deflated
// Forgehold (room 44, atlas Phase 5, docs/places/forgehold.md): Emberdeep's landing and its town, a safe room.
// West to east: the beach path out to the Black Sands (a geyser broke out across it), Black Sand Shore's
// rusted iron quay where the Lodestar ties up, Auntie Soot's springs, then the town on its ledges in the
// caldera's outer wall: your front door, the waystone, the great forge (you wake by it) with Forgewarden
// Ash, the memorial wall, Slag's stack of gear-teeth, and the road up into Cinder Flats at the east end.
export const FORGEHOLD = 44; // room id
export const FORGE_W = 3400;
export const SANDS_GATE_X = 150; // the beach path to the Black Sands
export const FORGE_DOCK_X = 640; // the Lodestar's gangway (boards STEAM_S, sim.js)
export const SOOT_X = 1290; // Auntie Soot, at her springs (she trades: SHOPS)
export const FORGE_HOME_X = 1770; // the iron door in the rock that is everyone's own front door
export const FORGE_SPAWN_X = 2080; // where you wake up, by the great forge
export const FORGE_FIRE_X = 2200; // the great forge
export const ASH_X = 2330; // Forgewarden Ash, at the forge
export const FORGE_WALL_X = 2630; // the memorial wall
export const SLAG_X = 2980; // Slag, by his stack of gear-teeth (he trades: SHOPS)
export const FORGE_EXIT_X = FORGE_W - 90; // the road up into Cinder Flats
// iron crates on the quay, the bathhouse roof, ledges in the wall joined by chains and iron stairs (drawing),
// the forge's hood, a ledge over the memorial wall, and Slag's stack of gear-teeth
export const FORGE_PLATFORMS = [
  { x: 770, y: 380, w: 104, kind: 'crates' },
  { x: 1150, y: 318, w: 230, kind: 'bathroof' },
  { x: 1620, y: 300, w: 210, kind: 'ledge' },
  { x: 1880, y: 214, w: 190, kind: 'ledge' },
  { x: 2140, y: 300, w: 130, kind: 'hood' },
  { x: 2520, y: 268, w: 230, kind: 'ledge' },
  { x: 2830, y: 352, w: 150, kind: 'teeth' }, // Slag's stack of gear-teeth
];
export const CALDERA_ZONES = [
  { name: 'Cinder Flats', x0: 0, x1: 2200, lvl: '90–100' },
  { name: 'Magma Heart', x0: 2200, x1: CALDERA_W, lvl: '100–115' },
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
  { name: 'Cogwork Bastion', x0: 0, x1: 2400, lvl: '140–155' },
  { name: 'Chrono Spire', x0: 2400, x1: CITADEL_W, lvl: '156+' },
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
// ——— island depth G5 (docs/places/spine.md) ———
// Keeper's Spine (room 34): the bare stone ridge along the top of Greenhollow, above the Old Oak Canopy, over
// the fallen trunk (cut through now). Wind, heather and the biggest Keeper ruins on the island. You come in
// at the WEST end (SPINE_EXIT_X, the cut trunk) and go east along the Keepers' road, higher and harder: the
// Windgap (no mobs: a waystone, the Road Stone), the Heather Slopes, the Standing Stones and the Warden's
// Crest, where the road ends at a sealed gate and the Root Warden's court (WARDEN_DEN_X). The Watch Seat, a
// capstone on the tallest trilithon over the Standing Stones (last in SPINE_PLATFORMS), is the hidden spot.
export const SPINE = 34; // room id
export const SPINE_W = 5400;
export const SPINE_EXIT_X = 70; // back through the cut trunk to the Old Oak Canopy
export const WARDEN_DEN_X = 5000; // the Root Warden's court, through the ruined gatehouse at the road's end
export const SPINE_ZONES = [
  { name: 'The Windgap', x0: 0, x1: 900, lvl: null }, // (no mobs)
  { name: 'The Heather Slopes', x0: 900, x1: 2400, lvl: '45–50' },
  { name: 'The Standing Stones', x0: 2400, x1: 3900, lvl: '50–55' },
  { name: "The Warden's Crest", x0: 3900, x1: SPINE_W, lvl: '55–60' },
];
export const SPINE_PLATFORMS = [
  { x: 1100, y: 340, w: 210, kind: 'ledge' },
  { x: 1480, y: 255, w: 200, kind: 'ledge' },
  { x: 1880, y: 340, w: 220, kind: 'ledge' },
  { x: 2560, y: 340, w: 230, kind: 'lintel' },
  { x: 2940, y: 255, w: 230, kind: 'lintel' },
  { x: 3360, y: 340, w: 230, kind: 'lintel' },
  { x: 4100, y: 340, w: 220, kind: 'wall' },
  { x: 4460, y: 255, w: 210, kind: 'wall' },
  { x: 3000, y: 160, w: 110, kind: 'seat' }, // the Watch Seat, on the tallest trilithon's capstone: easy to miss
];
// ——— Frostpeak's depth pass, F1 (docs/places/glacier.md) ———
// The Rimeglass Glacier (room 36): a great river of blue ice above Starfall Summit, up its snout from the
// Summit's east end. You come in at the WEST end (GLACIER_EXIT_X) and climb east, higher and harder: the
// Cutters' Camp (no mobs: Ice-Cutter Eyvind, a waystone, the Rime Stone), the Snout, the Crevasse Field (a
// crevasse down into the Blue Halls, open since F3: BLUEHALLS_GATE_X) and the Icefall, where Old Rimehorn walks,
// and at its top the way up to the Aurora Heights (open since F3: HEIGHTS_GATE_X). Ylva's Cairn, on a high serac
// over the Snout (last in GLACIER_PLATFORMS), is the hidden spot.
export const GLACIER = 36; // room id
export const GLACIER_W = 5400;
export const GLACIER_EXIT_X = 70; // back down the snout to Starfall Summit
export const GLACIER_GATE_X = 3540; // the glacier's snout at Starfall Summit's east end (the way in)
export const EYVIND_X = 610; // Ice-Cutter Eyvind, at his hut (he trades: SHOPS)
export const BLUEHALLS_GATE_X = 3245; // the crevasse down into the Blue Halls (F3)
export const HEIGHTS_GATE_X = GLACIER_W - 110; // the climb up to the Aurora Heights, at the Icefall's top (F3)
// Frostpeak's other blocked ways in (src/shared/branches.js FROSTPEAK): the shore path to the Whale Skerries
// at the hamlet's west end, and the ice stair onto the Queen's Bridge on Frostpine Ridge
export const SKERRIES_GATE_X = 160;
export const BRIDGE_GATE_X = 1620;
export const GLACIER_ZONES = [
  { name: "The Cutters' Camp", x0: 0, x1: 950, lvl: null }, // (no mobs)
  { name: 'The Snout', x0: 950, x1: 2400, lvl: '60–65' },
  { name: 'The Crevasse Field', x0: 2400, x1: 3900, lvl: '65–70' },
  { name: 'The Icefall', x0: 3900, x1: GLACIER_W, lvl: '70–75' },
];
export const GLACIER_PLATFORMS = [
  { x: 690, y: 330, w: 160, kind: 'hut' }, // Eyvind's hut roof
  { x: 1100, y: 340, w: 210, kind: 'serac' },
  { x: 1460, y: 255, w: 220, kind: 'serac' },
  { x: 1880, y: 340, w: 220, kind: 'serac' },
  { x: 2180, y: 250, w: 180, kind: 'serac' },
  { x: 2560, y: 340, w: 220, kind: 'serac' },
  { x: 2900, y: 255, w: 240, kind: 'snowbridge' }, // a snow bridge over a crevasse
  { x: 3350, y: 340, w: 210, kind: 'serac' },
  { x: 3650, y: 255, w: 200, kind: 'serac' },
  { x: 4050, y: 340, w: 220, kind: 'serac' },
  { x: 4400, y: 250, w: 230, kind: 'serac' },
  { x: 4780, y: 340, w: 220, kind: 'serac' },
  { x: 5000, y: 255, w: 180, kind: 'serac' },
  { x: 2215, y: 160, w: 100, kind: 'cairn' }, // Ylva's Cairn, high on a serac over the Snout: easy to miss
];
// ——— Frostpeak's depth pass, F2 (docs/places/skerries.md, docs/places/grotto.md) ———
// The Whale Skerries (room 37): low black islets and a whale's bones along the fjord's outer shore, out of
// Icefang Hamlet's west end along the shore path (the snow slide dug through: SKERRIES_GATE_X). You come in
// at the EAST end (the hamlet lies east) and walk west, deeper and harder, so its zones run hard -> easy by x:
// the Whaling Hut (no mobs: Hakon, a waystone, the Sounding Stone), the Black Skerries, the Whalebones
// (Grandmother, a great whale's skeleton; her skull's crown, last in SKERRIES_PLATFORMS, is the hidden spot)
// and the Floe Edge, where the pack ice starts: the Old Narwhal's breathing hole (her den, NARWHAL_DEN_X) and,
// at the very end, the mouth of the Narwhal Grotto in the sea cliff (GROTTO_GATE_X).
export const SKERRIES = 37; // room id
export const SKERRIES_W = 5000;
export const SKERRIES_EXIT_X = SKERRIES_W - 70; // the shore path back to Icefang Hamlet
export const HAKON_X = 4420; // Hakon the bone-carver, at the whaling hut's door (he trades: SHOPS)
export const NARWHAL_DEN_X = 560; // the Old Narwhal's breathing hole in the pack ice
export const GROTTO_GATE_X = 170; // the Narwhal Grotto's mouth, in the sea cliff at the Skerries' far end
export const SKERRIES_ZONES = [
  { name: 'The Floe Edge', x0: 0, x1: 1700, lvl: '65–70' },
  { name: 'The Whalebones', x0: 1700, x1: 3300, lvl: '60–65' },
  { name: 'The Black Skerries', x0: 3300, x1: 4200, lvl: '55–60' },
  { name: 'The Whaling Hut', x0: 4200, x1: SKERRIES_W, lvl: null }, // (no mobs)
];
export const SKERRIES_PLATFORMS = [
  { x: 4480, y: 330, w: 170, kind: 'hut' }, // the whaling hut's roof
  { x: 3820, y: 262, w: 200, kind: 'skerry' },
  { x: 3440, y: 340, w: 220, kind: 'skerry' },
  { x: 3000, y: 340, w: 210, kind: 'skerry' },
  { x: 2620, y: 340, w: 200, kind: 'rib' }, // a fallen rib wedged between two rocks
  { x: 2240, y: 250, w: 320, kind: 'spine' }, // Grandmother's backbone
  { x: 1960, y: 338, w: 200, kind: 'jaw' }, // her jawbone, lying in the shingle
  { x: 1340, y: 340, w: 220, kind: 'floe' },
  { x: 1000, y: 258, w: 200, kind: 'floe' },
  { x: 700, y: 340, w: 200, kind: 'floe' },
  { x: 2100, y: 160, w: 110, kind: 'skull' }, // Grandmother's Crown, on top of the whale's skull: easy to miss
];
// The Narwhal Grotto (room 39, a hard pocket): a sea cave of green ice in the cliff at the Skerries' far end.
// You come in at the WEST end (GROTTO_EXIT_X) and go east into the cliff: the Grotto Mouth (no mobs), the
// Green Halls and the Tusk Hall, where the old pod's shed tusks hang in the ice; a nook up among them (last in
// GROTTO_PLATFORMS) is the hidden spot.
export const GROTTO = 39; // room id
export const GROTTO_W = 4000;
export const GROTTO_EXIT_X = 70; // back out to the Skerries
export const GROTTO_ZONES = [
  { name: 'The Grotto Mouth', x0: 0, x1: 600, lvl: null }, // (no mobs)
  { name: 'The Green Halls', x0: 600, x1: 2300, lvl: '70–75' },
  { name: 'The Tusk Hall', x0: 2300, x1: GROTTO_W, lvl: '75–80' },
];
export const GROTTO_PLATFORMS = [
  { x: 800, y: 340, w: 200, kind: 'shelf' },
  { x: 1150, y: 255, w: 200, kind: 'shelf' },
  { x: 1550, y: 340, w: 220, kind: 'shelf' },
  { x: 1950, y: 255, w: 200, kind: 'shelf' },
  { x: 2450, y: 340, w: 220, kind: 'shelf' },
  { x: 2850, y: 255, w: 200, kind: 'shelf' },
  { x: 3250, y: 340, w: 220, kind: 'shelf' },
  { x: 3600, y: 255, w: 200, kind: 'shelf' },
  { x: 3430, y: 165, w: 100, kind: 'nook' }, // up among the hung tusks: easy to miss
];
// ——— Frostpeak's depth pass, F3 (docs/places/heights.md, docs/places/bluehalls.md) ———
// The Aurora Heights (room 40): the high snowfield above the Glacier's Icefall, up the cutters' new steps
// (HEIGHTS_GATE_X in the Glacier), where the aurora hangs low enough to touch and the wrong stars are closest.
// You come in at the WEST end (HEIGHTS_EXIT_X) and go east: the Last Step (no mobs: a waystone, the Serpent
// Stone), the Low Lights, the Starfield and the Wyrmfall, a long glassy hollow melted into the snow where the
// Pale Wyrm lies. Liv's Reach, on an ice spire over the Low Lights (last in HEIGHTS_PLATFORMS), is the hidden
// spot.
export const HEIGHTS = 40; // room id
export const HEIGHTS_W = 5200;
export const HEIGHTS_EXIT_X = 70; // back down the cutters' steps to the Glacier's Icefall
export const HEIGHTS_ZONES = [
  { name: 'The Last Step', x0: 0, x1: 900, lvl: null }, // (no mobs)
  { name: 'The Low Lights', x0: 900, x1: 2450, lvl: '75–80' },
  { name: 'The Starfield', x0: 2450, x1: 3850, lvl: '80–85' },
  { name: 'The Wyrmfall', x0: 3850, x1: HEIGHTS_W, lvl: '85–90' },
];
export const HEIGHTS_PLATFORMS = [
  { x: 1100, y: 340, w: 210, kind: 'cornice' },
  { x: 1480, y: 255, w: 210, kind: 'cornice' },
  { x: 1880, y: 340, w: 220, kind: 'cornice' },
  { x: 2180, y: 250, w: 180, kind: 'cornice' },
  { x: 2620, y: 340, w: 220, kind: 'cornice' },
  { x: 3000, y: 255, w: 220, kind: 'cornice' },
  { x: 3420, y: 340, w: 210, kind: 'cornice' },
  { x: 4060, y: 340, w: 220, kind: 'starglass' }, // shards of the fall, standing up out of the snow
  { x: 4440, y: 255, w: 220, kind: 'starglass' },
  { x: 4840, y: 340, w: 200, kind: 'starglass' },
  { x: 2215, y: 160, w: 100, kind: 'reach' }, // Liv's Reach, on top of an ice spire: easy to miss
];
// The Blue Halls (room 41, a hard pocket): ice caves inside the glacier, deep blue, down the cutters' mended
// ladder from the Crevasse Field (BLUEHALLS_GATE_X). You come in at the WEST end (BLUEHALLS_EXIT_X), at the
// ladder's foot, and go east, deeper: the Ladder Foot (no mobs), the Blue Halls and the Deep Blue, where the
// Hall Troll stacks its walls. The Cutters' Niche, high in the first hall's wall (last in BLUEHALLS_PLATFORMS),
// is the hidden spot.
export const BLUEHALLS = 41; // room id
export const BLUEHALLS_W = 4200;
export const BLUEHALLS_EXIT_X = 70; // back up the ladder to the Glacier
export const BLUEHALLS_ZONES = [
  { name: 'The Ladder Foot', x0: 0, x1: 600, lvl: null }, // (no mobs)
  { name: 'The Blue Halls', x0: 600, x1: 2350, lvl: '80–85' },
  { name: 'The Deep Blue', x0: 2350, x1: BLUEHALLS_W, lvl: '85–90' },
];
export const BLUEHALLS_PLATFORMS = [
  { x: 800, y: 340, w: 200, kind: 'shelf' },
  { x: 1150, y: 255, w: 210, kind: 'shelf' },
  { x: 1560, y: 340, w: 220, kind: 'shelf' },
  { x: 1960, y: 255, w: 200, kind: 'shelf' },
  { x: 2500, y: 340, w: 220, kind: 'shelf' },
  { x: 2900, y: 255, w: 210, kind: 'shelf' },
  { x: 3300, y: 340, w: 220, kind: 'shelf' },
  { x: 3680, y: 255, w: 200, kind: 'shelf' },
  { x: 1180, y: 165, w: 100, kind: 'niche' }, // the Cutters' Niche, high in the first hall's wall: easy to miss
];
// ——— Frostpeak's depth pass, F4 (docs/places/queensbridge.md) ———
// The Queen's Bridge (room 42): out onto the ice bridge Queen Glacia froze across the strait, up the ice stair
// on Frostpine Ridge (mended since F4: BRIDGE_GATE_X). You come in at the WEST end (QBRIDGE_EXIT_X, the stair's
// head) and walk east out over the strait, higher and harder: the Stairhead (no mobs: a waystone, the Strait
// Stone), the Span, the Frozen Guard (the Queen's guards frozen at their posts along the rail) and the Crack,
// where the bridge split and is frozen shut again every night: Sigrun's den (SIGRUN_DEN_X). The Shield's Perch,
// a lookout on the tallest arch over the Frozen Guard (last in QBRIDGE_PLATFORMS), is the hidden spot.
export const QBRIDGE = 42; // room id
export const QBRIDGE_W = 5400;
export const QBRIDGE_EXIT_X = 70; // back down the ice stair to Frostpine Ridge
export const SIGRUN_DEN_X = 5020; // the Seam: the crack across the bridge, and Sigrun on it
export const QBRIDGE_ZONES = [
  { name: 'The Stairhead', x0: 0, x1: 900, lvl: null }, // (no mobs)
  { name: 'The Span', x0: 900, x1: 2400, lvl: '85–90' },
  { name: 'The Frozen Guard', x0: 2400, x1: 3900, lvl: '90–95' },
  { name: 'The Crack', x0: 3900, x1: QBRIDGE_W, lvl: '95–100' },
];
export const QBRIDGE_PLATFORMS = [
  { x: 1100, y: 340, w: 210, kind: 'arch' },
  { x: 1480, y: 255, w: 210, kind: 'arch' },
  { x: 1880, y: 340, w: 220, kind: 'arch' },
  { x: 2560, y: 340, w: 220, kind: 'post' }, // the guards' posts: ice parapets with a frozen guard standing on each
  { x: 2940, y: 255, w: 220, kind: 'post' },
  { x: 3340, y: 340, w: 210, kind: 'post' },
  { x: 4060, y: 340, w: 220, kind: 'slab' }, // slabs of the deck heaved up where it cracked
  { x: 4440, y: 255, w: 210, kind: 'slab' },
  { x: 3000, y: 160, w: 100, kind: 'perch' }, // the Shield's Perch, a lookout on the tallest arch: easy to miss
];
// The open-air stages (each has zones); dens are separate rooms. band: the levels it's for, shown on every
// door into it (doorBand in sim.js); hard: a hard pocket (elites, a danger look on its doors). name: the
// location pill's (src/main.js)
export const STAGES = {
  [FIELD]: { name: 'The Wildwood', zones: ZONES, band: '1–12' },
  [HIGHLANDS]: { name: 'Frostpeak', zones: HIGHLAND_ZONES, band: '40–60' },
  [CALDERA]: { name: 'Emberdeep', zones: CALDERA_ZONES, band: '90–115' },
  [CITADEL]: { name: 'The Aether Citadel', zones: CITADEL_ZONES, band: '140–170', pill: 'Aether Citadel' },
  [WILLOWMERE]: { name: 'Willowmere', zones: WILLOWMERE_ZONES, band: '5–15' },
  [COVES]: { name: 'Saltspray Coves', zones: COVES_ZONES, band: '10–25' },
  [MYCELIUM]: { name: 'The Mycelium Deep', zones: MYCELIUM_ZONES, band: '15–35', pill: 'Mycelium Deep' },
  [GLOWROOT]: { name: 'Glowroot Hollow', zones: GLOWROOT_ZONES, band: '40–50', hard: true },
  [CANOPY]: { name: 'The Old Oak Canopy', zones: CANOPY_ZONES, band: '25–40', pill: 'Old Oak Canopy' },
  [WRECK]: { name: 'Wreck Cave', zones: WRECK_ZONES, band: '30–40', hard: true },
  [THORNHEART]: { name: 'The Thornheart', zones: THORN_ZONES, band: '50–60', hard: true, pill: 'Thornheart' },
  [SPINE]: { name: "Keeper's Spine", zones: SPINE_ZONES, band: '45–60' },
  [GLACIER]: { name: 'The Rimeglass Glacier', zones: GLACIER_ZONES, band: '60–75', pill: 'Rimeglass Glacier' },
  [SKERRIES]: { name: 'The Whale Skerries', zones: SKERRIES_ZONES, band: '55–70', pill: 'Whale Skerries' },
  [GROTTO]: { name: 'The Narwhal Grotto', zones: GROTTO_ZONES, band: '70–80', hard: true, pill: 'Narwhal Grotto' },
  [HEIGHTS]: { name: 'The Aurora Heights', zones: HEIGHTS_ZONES, band: '75–90', pill: 'Aurora Heights' },
  [BLUEHALLS]: { name: 'The Blue Halls', zones: BLUEHALLS_ZONES, band: '80–90', hard: true },
  [QBRIDGE]: { name: "The Queen's Bridge", zones: QBRIDGE_ZONES, band: '85–100', pill: "Queen's Bridge" },
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
    name: 'Frostling', lvl: 40, hp: 3100, atk: 108, exp: 1039, speed: 60, w: 34, h: 34, aggro: false, hops: true,
    drops: [['coin', 1, 240, 430], ['ice_shard', 0.55, 1, 2], ['blue_jelly', 0.15, 1, 1], ['mana_jelly', 0.2, 1, 1], ['elixir', 0.03, 1, 1]],
  },
  yeti: {
    name: 'Yeti Cub', lvl: 44, hp: 3943, atk: 125, exp: 1305, speed: 70, w: 52, h: 50, aggro: true, hops: false,
    drops: [['coin', 1, 280, 490], ['ice_shard', 0.6, 1, 3], ['blue_jelly', 0.2, 1, 2], ['elixir', 0.05, 1, 1], ['frost_blade_n', 0.01, 1, 1]],
  },
  wisp: {
    name: 'Star Wisp', lvl: 49, hp: 3988, atk: 138, exp: 1603, speed: 85, w: 36, h: 40, aggro: false, hops: true,
    drops: [['coin', 1, 330, 550], ['stardust', 0.55, 1, 2], ['mana_jelly', 0.3, 1, 2], ['elixir', 0.07, 1, 1]],
  },
  golem: {
    name: 'Crystal Golem', lvl: 53, hp: 5910, atk: 160, exp: 2207, speed: 55, w: 60, h: 62, aggro: true, hops: false,
    drops: [['coin', 1, 400, 710], ['stardust', 0.6, 1, 3], ['elixir', 0.1, 1, 1], ['star_crown_n', 0.008, 1, 1]],
  },
  frost_queen: {
    name: 'Frost Queen Glacia', boss: true, lvl: 47, hp: 240000, atk: 150, exp: 44000, speed: 90, w: 140, h: 160, aggro: true, hops: false,
    phases: [['rain', 'charge', 'slam'], ['rain', 'charge', 'slam', 'leap', 'summon'], ['barrage', 'rain', 'leap', 'slam', 'summon', 'charge']],
    ult: { name: 'Absolute Zero', kind: 'lanes' }, minion: 'frostling',
    drops: [['frost_heart', 1, 1, 2], ['frost_blade_n', 1, 1, 1], ['glacier_helm_n', 1, 1, 1], ['coin', 1, 2250, 3370], ['elixir', 1, 2, 4], ['ice_shard', 1, 4, 8], ['scroll_s60', 1, 1, 1], ['scroll_h60', 1, 1, 1], ['scroll_s10', 0.2, 1, 1], ['scroll_h10', 0.2, 1, 1], ['scroll_s30', 0.1, 1, 1], ['scroll_chaos', 0.1, 1, 1]],
  },
  astral_wyrm: {
    name: 'Astral Wyrm', boss: true, lvl: 57, hp: 330000, atk: 180, exp: 76000, speed: 110, w: 190, h: 150, aggro: true, hops: false,
    phases: [['rain', 'charge', 'leap'], ['barrage', 'charge', 'leap', 'slam', 'summon'], ['barrage', 'charge', 'leap', 'slam', 'summon', 'rain']],
    ult: { name: 'Supernova', kind: 'nova' }, minion: 'wisp',
    drops: [['frost_heart', 1, 2, 3], ['star_sword_n', 1, 1, 1], ['star_crown_n', 1, 1, 1], ['coin', 1, 4360, 7260], ['elixir', 1, 4, 6], ['stardust', 1, 6, 10], ['scroll_s60', 1, 1, 2], ['scroll_h60', 1, 1, 2], ['scroll_s10', 0.3, 1, 1], ['scroll_h10', 0.3, 1, 1], ['scroll_s30', 0.15, 1, 1], ['scroll_chaos', 0.15, 1, 1]],
  },
  // ——— Emberdeep (the legacy stage: Cinder Flats, Magma Heart) ———
  // ai: what makes a mob more than a walker (server/rpg.js mobAi, client src/rpg.js):
  //   lob: lobs a fireball at you from range (and backs off when you're close) · trail: leaves burning
  //   puddles behind it · shell: its front shell blocks `cut` of the damage (hit it from behind) and it
  //   lunges · dive: flies `fly` px up and swoops down at you · split: splits into `into` × n when it dies ·
  //   beam: fires a low laser along the floor (jump it) · blink: teleports behind you, then slashes around
  //   itself · phase: fades out (can't be hurt), then pulses outward when it comes back (dash through it)
  ember_imp: {
    name: 'Ember Imp', lvl: 92, hp: 9794, atk: 294, exp: 6026, speed: 70, w: 34, h: 38, aggro: true, hops: true,
    ai: { kind: 'lob', range: 480, every: 2.8, keep: 170, warn: 0.5 },
    drops: [['coin', 1, 750, 1240], ['ember_core', 0.5, 1, 2], ['elixir', 0.12, 1, 1], ['mega_elixir', 0.03, 1, 1], ['magma_maul_n', 0.003, 1, 1]],
  },
  magma_slug: {
    name: 'Magma Slug', lvl: 97, hp: 14409, atk: 308, exp: 6667, speed: 32, w: 62, h: 34, aggro: false, hops: false,
    ai: { kind: 'trail', every: 0.8, life: 4, w: 54 },
    drops: [['coin', 1, 860, 1410], ['ember_core', 0.6, 1, 3], ['elixir', 0.15, 1, 1], ['mega_elixir', 0.04, 1, 1]],
  },
  obsidian_crab: {
    name: 'Obsidian Crab', lvl: 104, hp: 14725, atk: 343, exp: 7022, speed: 60, w: 64, h: 44, aggro: true, hops: false,
    ai: { kind: 'shell', cut: 0.8, every: 3.2, warn: 0.5, lunge: 520, time: 0.35 },
    drops: [['coin', 1, 880, 1450], ['obsidian_shard', 0.55, 1, 2], ['elixir', 0.15, 1, 1], ['mega_elixir', 0.05, 1, 1], ['ember_helm_n', 0.003, 1, 1]],
  },
  cinder_bat: {
    name: 'Cinder Bat', lvl: 109, hp: 11836, atk: 345, exp: 6930, speed: 110, w: 46, h: 30, aggro: true, hops: false, fly: 100,
    ai: { kind: 'dive', every: 3.5, warn: 0.6, time: 0.45 },
    drops: [['coin', 1, 820, 1300], ['obsidian_shard', 0.5, 1, 2], ['mega_elixir', 0.06, 1, 1], ['phoenix_blade_n', 0.002, 1, 1]],
  },
  ignis: {
    name: 'Ignis the Magma Tyrant', boss: true, lvl: 99, hp: 680000, atk: 360, exp: 210000, speed: 85, w: 180, h: 170, aggro: true, hops: false,
    phases: [['slam', 'fireballs', 'geysers'], ['slam', 'fireballs', 'geysers', 'charge', 'flamewall'], ['geysers', 'fireballs', 'flamewall', 'leap', 'summon', 'barrage']],
    ult: { name: 'Caldera Eruption', kind: 'magma' }, minion: 'ember_imp',
    drops: [['phoenix_feather', 1, 1, 2], ['magma_maul_n', 1, 1, 1], ['ember_helm_n', 0.6, 1, 1], ['coin', 1, 11170, 18620], ['mega_elixir', 1, 2, 4], ['ember_core', 1, 6, 10], ['scroll_s60', 1, 1, 2], ['scroll_h60', 1, 1, 2], ['scroll_s10', 0.4, 1, 1], ['scroll_h10', 0.4, 1, 1], ['scroll_s30', 0.25, 1, 1], ['scroll_h30', 0.25, 1, 1], ['scroll_chaos', 0.25, 1, 1]],
  },
  pyra: {
    name: 'Pyra the Ember Phoenix', boss: true, lvl: 110, hp: 870000, atk: 400, exp: 290000, speed: 120, w: 170, h: 140, aggro: true, hops: false, fly: 40,
    phases: [['feathers', 'dive', 'rings'], ['feathers', 'dive', 'rings', 'rain', 'summon'], ['feathers', 'dive', 'rings', 'barrage', 'spiral']],
    ult: { name: 'Rebirth', kind: 'rebirth' }, minion: 'cinder_bat',
    drops: [['phoenix_feather', 1, 2, 3], ['phoenix_blade_n', 1, 1, 1], ['phoenix_crown_n', 0.6, 1, 1], ['coin', 1, 15730, 25170], ['mega_elixir', 1, 3, 5], ['obsidian_shard', 1, 6, 10], ['scroll_s60', 1, 2, 3], ['scroll_h60', 1, 2, 3], ['scroll_s10', 0.5, 1, 1], ['scroll_h10', 0.5, 1, 1], ['scroll_s30', 0.3, 1, 1], ['scroll_h30', 0.3, 1, 1], ['scroll_chaos', 0.3, 1, 1]],
  },
  // ——— the Aether Citadel ———
  cogling: {
    name: 'Cogling', lvl: 144, hp: 21283, atk: 483, exp: 10901, speed: 140, w: 44, h: 44, aggro: true, hops: false,
    ai: { kind: 'split', into: 'cogbit', n: 2 },
    drops: [['coin', 1, 1340, 2060], ['cog', 0.55, 1, 2], ['mega_elixir', 0.08, 1, 1], ['cog_cleaver_n', 0.002, 1, 1]],
  },
  cogbit: {
    name: 'Cogbit', lvl: 140, hp: 5108, atk: 354, exp: 2422, speed: 175, w: 24, h: 24, aggro: true, hops: true,
    drops: [['coin', 1, 210, 410]],
  },
  sentry: {
    name: 'Sentry Drone', lvl: 148, hp: 17952, atk: 519, exp: 11009, speed: 45, w: 48, h: 46, aggro: true, hops: false, fly: 50,
    ai: { kind: 'beam', range: 620, every: 4, warn: 1, dur: 0.45, y0: 418, y1: 450 },
    drops: [['coin', 1, 1420, 2190], ['cog', 0.5, 1, 2], ['aether_crystal', 0.25, 1, 1], ['mega_elixir', 0.08, 1, 1]],
  },
  aether_knight: {
    name: 'Aether Knight', lvl: 156, hp: 28192, atk: 552, exp: 14510, speed: 80, w: 50, h: 62, aggro: true, hops: false,
    ai: { kind: 'blink', every: 5, warn: 0.4, slashWarn: 0.55, r: 120 },
    drops: [['coin', 1, 1480, 2320], ['aether_crystal', 0.5, 1, 2], ['mega_elixir', 0.1, 1, 1], ['aether_helm_n', 0.002, 1, 1]],
  },
  chrono_wraith: {
    name: 'Chrono Wraith', lvl: 162, hp: 22705, atk: 568, exp: 15083, speed: 65, w: 44, h: 56, aggro: true, hops: false, fly: 26,
    ai: { kind: 'phase', every: 7, dur: 2.2, r: 190 },
    drops: [['coin', 1, 1550, 2320], ['aether_crystal', 0.55, 1, 2], ['mega_elixir', 0.12, 1, 1], ['chrono_blade_n', 0.0015, 1, 1]],
  },
  colossus: {
    name: 'The Clockwork Colossus', boss: true, lvl: 150, hp: 1600000, atk: 600, exp: 580000, speed: 70, w: 220, h: 200, aggro: true, hops: false,
    phases: [['slam', 'gears', 'beam'], ['slam', 'gears', 'beam', 'grid', 'sweep'], ['grid', 'sweep', 'gears', 'beam', 'charge', 'summon']],
    ult: { name: 'Overclock', kind: 'overclock' }, minion: 'cogling',
    drops: [['time_sand', 1, 1, 2], ['cog_cleaver_n', 1, 1, 1], ['aether_helm_n', 0.6, 1, 1], ['coin', 1, 29600, 46040], ['mega_elixir', 1, 4, 6], ['cog', 1, 8, 12], ['scroll_s60', 1, 2, 3], ['scroll_h60', 1, 2, 3], ['scroll_s10', 0.6, 1, 2], ['scroll_h10', 0.6, 1, 2], ['scroll_s30', 0.4, 1, 1], ['scroll_h30', 0.4, 1, 1], ['scroll_chaos', 0.4, 1, 2]],
  },
  chronos: {
    name: 'Chronos, Keeper of Hours', boss: true, lvl: 170, hp: 1900000, atk: 630, exp: 790000, speed: 100, w: 160, h: 190, aggro: true, hops: false, fly: 30,
    phases: [['bombs', 'sweep', 'blink', 'spiral'], ['bombs', 'sweep', 'blink', 'spiral', 'echo', 'grid'], ['bombs', 'sweep', 'blink', 'spiral', 'echo', 'grid', 'summon']],
    ult: { name: 'Time Stop', kind: 'timestop' }, ults: [{ name: 'Time Stop', kind: 'timestop' }, { name: 'Collapse of Hours', kind: 'collapse' }], minion: 'chrono_wraith',
    drops: [['time_sand', 1, 2, 3], ['chrono_blade_n', 1, 1, 1], ['hourglass_crown_n', 0.6, 1, 1], ['coin', 1, 38920, 64870], ['mega_elixir', 1, 5, 8], ['aether_crystal', 1, 8, 12], ['scroll_s60', 1, 3, 4], ['scroll_h60', 1, 3, 4], ['scroll_s10', 0.8, 1, 2], ['scroll_h10', 0.8, 1, 2], ['scroll_s30', 0.5, 1, 2], ['scroll_h30', 0.5, 1, 2], ['scroll_chaos', 0.5, 1, 2]],
  },
  // ——— Frostpeak's later wildlife (atlas Phase 4; kept last: mob kinds go over the wire as their index) ———
  // floe seal: belly-slides along the ridge, harmless · snow owl: swoops from the pines (the cinder bat's
  // dive) · shard-moth: drifts over the summit, drawn to the wrong stars
  floe_seal: {
    name: 'Floe Seal', lvl: 41, hp: 3326, atk: 102, exp: 1137, speed: 70, w: 56, h: 30, aggro: false, hops: false,
    drops: [['coin', 1, 230, 420], ['ice_shard', 0.6, 1, 2], ['blue_jelly', 0.2, 1, 1], ['mana_jelly', 0.15, 1, 1], ['fur_hood_n', 0.006, 1, 1]],
  },
  snow_owl: {
    name: 'Snow Owl', lvl: 46, hp: 3656, atk: 135, exp: 1384, speed: 95, w: 44, h: 38, aggro: true, hops: false, fly: 95,
    ai: { kind: 'dive', every: 3.8, warn: 0.7, time: 0.5 },
    drops: [['coin', 1, 260, 470], ['ice_shard', 0.6, 1, 3], ['elixir', 0.05, 1, 1], ['bone_harpoon_n', 0.004, 1, 1]],
  },
  shard_moth: {
    name: 'Shard-Moth', lvl: 51, hp: 4130, atk: 145, exp: 1789, speed: 75, w: 46, h: 36, aggro: false, hops: false, fly: 70,
    drops: [['coin', 1, 350, 570], ['stardust', 0.55, 1, 2], ['mana_jelly', 0.3, 1, 1], ['elixir', 0.08, 1, 1]],
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
// ——— Greenhollow's branches, G5: Keeper's Spine (art: src/spine-art.js, src/dens-spine.js; docs/places/spine.md).
// On the frozen curve like the others ———
// Moss turtles have a mossy shell in front (hit them from behind), crag kites dive out of the wind, stone
// sentinels (Keeper-made, still on watch) throw a beam of amber light along the road, gale sprites fade into
// the wind and gust out again, rootlings burst out of the ground behind you
MOBS.moss_turtle = {
  name: 'Moss Turtle', lvl: 46, hp: 4500, atk: 128, exp: 1446, speed: 30, w: 70, h: 44, aggro: false, hops: false,
  ai: { kind: 'shell', cut: 0.75, every: 3.4, warn: 0.6, lunge: 460, time: 0.32 },
  drops: [['coin', 1, 200, 320], ['turtle_moss', 0.5, 1, 2], ['mega_elixir', 0.08, 1, 1], ['mossback_helm', 0.004, 1, 1]],
};
MOBS.crag_kite = {
  name: 'Crag Kite', lvl: 48, hp: 4200, atk: 135, exp: 1564, speed: 110, w: 54, h: 34, aggro: true, hops: false, fly: 62,
  ai: { kind: 'dive', every: 3.4, warn: 0.6, time: 0.42 },
  drops: [['coin', 1, 210, 340], ['kite_feather', 0.5, 1, 2], ['mega_elixir', 0.08, 1, 1]],
};
MOBS.stone_sentinel = {
  name: 'Stone Sentinel', lvl: 52, hp: 4900, atk: 148, exp: 1822, speed: 28, w: 56, h: 72, aggro: true, hops: false,
  ai: { kind: 'beam', range: 560, every: 4.2, warn: 1, dur: 0.45, y0: 420, y1: 450, style: 'warden' },
  drops: [['coin', 1, 282, 447], ['rune_chip', 0.5, 1, 2], ['mega_elixir', 0.08, 1, 1], ['sentinel_blade', 0.003, 1, 1]],
};
MOBS.gale_sprite = {
  name: 'Gale Sprite', lvl: 55, hp: 4900, atk: 158, exp: 2036, speed: 80, w: 46, h: 46, aggro: true, hops: false, fly: 46,
  ai: { kind: 'phase', every: 6.5, dur: 2, r: 175 },
  drops: [['coin', 1, 300, 480], ['bottled_gale', 0.5, 1, 2], ['mega_elixir', 0.09, 1, 1]],
};
MOBS.rootling = {
  name: 'Rootling', lvl: 58, hp: 5400, atk: 168, exp: 2263, speed: 70, w: 44, h: 52, aggro: true, hops: false,
  ai: { kind: 'blink', every: 4.6, warn: 0.4, slashWarn: 0.5, r: 115 },
  drops: [['coin', 1, 320, 500], ['rootling_twig', 0.5, 1, 2], ['mega_elixir', 0.1, 1, 1]],
};
// The Root Warden (its court is at the Spine's east end): Greenhollow's capstone boss, with a story
// (story/characters/bosses.md). A Keeper guardian of stone the roots grew through, still holding the gate
// at the end of the Keepers' road long after anyone could relieve it. Its ultimate, Hold Fast, is the
// `lanes` ult as roots: they burst up through every stretch of floor but one.
// party: the party mechanics it's built for (story/progression.md, S5), named here so S5 can switch them
// on; nothing reads it yet. focus: its slams lock onto one slime · pulse: the shard's light every few
// seconds · barrier: a rune shield that turns blades · weakpoint: the shard, high on its back · adds: rootlings
MOBS.root_warden = {
  name: 'The Root Warden', boss: true, lvl: 60, hp: 440000, atk: 200, exp: 115000, speed: 65, w: 200, h: 230, aggro: true, hops: false,
  phases: [['slam', 'beam', 'charge'], ['slam', 'beam', 'grid', 'summon', 'echo'], ['grid', 'beam', 'echo', 'slam', 'summon', 'barrage', 'leap']],
  ult: { name: 'Hold Fast', kind: 'lanes' }, minion: 'rootling', looks: { beam: 'warden', grid: 'root' }, // (how its beam and grid are drawn: src/hazards.js)
  party: ['focus', 'pulse', 'barrier', 'weakpoint', 'adds'],
  lines: {
    enter: ['HALT. The road is shut. No one passes until the Keepers come back.', 'Another one. They all come up the road sooner or later. None of them are Keepers.'],
    phase: [null, 'The roots have me by every joint. Good. Roots do not let go. Neither do I.', 'Hold. Hold the gate. Hold. I have forgotten every word but that one.'],
    freed: "...They are not coming back, are they. Then I am relieved. Let the roots have me. The gate stays shut, little ones. But the road is yours.",
  },
  drops: [['royal_sap', 1, 2, 3], ['warden_blade', 1, 1, 1], ['warden_helm', 0.6, 1, 1], ['coin', 1, 9500, 14500], ['mega_elixir', 1, 4, 6], ['rune_chip', 1, 8, 12], ['scroll_s60', 1, 2, 3], ['scroll_h60', 1, 2, 3], ['scroll_s10', 0.6, 1, 2], ['scroll_h10', 0.6, 1, 2], ['scroll_s30', 0.4, 1, 1], ['scroll_h30', 0.4, 1, 1], ['scroll_chaos', 0.4, 1, 2]],
};

// ——— Frostpeak's depth pass, F1: the Rimeglass Glacier (art: src/glacier-art.js; docs/places/glacier.md). On
// the frozen curve like Greenhollow's branches ———
// Snow hares hop the Snout (harmless), snow petrels dive off the seracs, glacier rams lower their great curled
// horns (hit them from behind), rime wolves circle round behind you, frost wraiths fade into the blowing snow
// and pulse out of it, grown yetis (Tove's cubs, all grown up) throw snowballs; Old Rimehorn, a mammoth older
// than the hamlet, walks the Icefall
MOBS.snow_hare = {
  name: 'Snow Hare', lvl: 61, hp: 5600, atk: 175, exp: 2513, speed: 85, w: 40, h: 38, aggro: false, hops: true,
  drops: [['coin', 1, 360, 548], ['hare_tuft', 0.55, 1, 2], ['mega_elixir', 0.08, 1, 1]],
};
MOBS.snow_petrel = {
  name: 'Snow Petrel', lvl: 63, hp: 5800, atk: 186, exp: 2704, speed: 110, w: 52, h: 34, aggro: true, hops: false, fly: 62,
  ai: { kind: 'dive', every: 3.4, warn: 0.6, time: 0.42 },
  drops: [['coin', 1, 390, 590], ['petrel_down', 0.5, 1, 2], ['mega_elixir', 0.09, 1, 1]],
};
MOBS.glacier_ram = {
  name: 'Glacier Ram', lvl: 65, hp: 7400, atk: 194, exp: 2903, speed: 55, w: 66, h: 50, aggro: true, hops: false,
  ai: { kind: 'shell', cut: 0.75, every: 3.2, warn: 0.55, lunge: 540, time: 0.32 },
  drops: [['coin', 1, 410, 620], ['ram_horn', 0.5, 1, 2], ['mega_elixir', 0.09, 1, 1], ['ramhorn_helm', 0.004, 1, 1]],
};
MOBS.rime_wolf = {
  name: 'Rime Wolf', lvl: 67, hp: 6700, atk: 202, exp: 3109, speed: 90, w: 60, h: 42, aggro: true, hops: false,
  ai: { kind: 'blink', every: 4.4, warn: 0.4, slashWarn: 0.5, r: 115 },
  drops: [['coin', 1, 430, 640], ['wolf_pelt', 0.5, 1, 2], ['mega_elixir', 0.1, 1, 1], ['rimefang', 0.003, 1, 1]],
};
MOBS.frost_wraith = {
  name: 'Frost Wraith', lvl: 70, hp: 7000, atk: 213, exp: 3434, speed: 75, w: 46, h: 56, aggro: true, hops: false, fly: 44,
  ai: { kind: 'phase', every: 6.5, dur: 2, r: 180 },
  drops: [['coin', 1, 460, 700], ['frozen_breath', 0.5, 1, 2], ['mega_elixir', 0.1, 1, 1]],
};
MOBS.great_yeti = {
  name: 'Great Yeti', lvl: 73, hp: 8100, atk: 225, exp: 3747, speed: 60, w: 70, h: 74, aggro: true, hops: false,
  ai: { kind: 'lob', range: 460, every: 2.8, keep: 160, warn: 0.55, style: 'snow' },
  drops: [['coin', 1, 490, 740], ['yeti_fur', 0.5, 1, 2], ['mega_elixir', 0.11, 1, 1]],
};
// Old Rimehorn: a field boss (small: no story), a mammoth older than the hamlet, shaggy with icicles, who walks
// the Icefall and the fjord folk leave alone. Passive until hit; then he rears and stamps
MOBS.rimehorn = {
  name: 'Old Rimehorn', field: true, lvl: 75, hp: 170000, atk: 220, exp: 68000, speed: 45, w: 170, h: 150, aggro: false, hops: false,
  ai: { kind: 'stomp', every: 3.6, warn: 1, r: 300, range: 330, jump: 600 },
  desc: 'Old Rimehorn is walking the Icefall!',
  drops: [['coin', 1, 6400, 9200], ['mammoth_wool', 1, 4, 8], ['yeti_fur', 1, 3, 5], ['mega_elixir', 1, 2, 3], ['tusk_blade', 0.25, 1, 1], ['mammoth_hood', 0.4, 1, 1], ['scroll_s60', 0.5, 1, 1], ['scroll_h60', 0.5, 1, 1], ['scroll_s10', 0.15, 1, 1], ['scroll_h10', 0.15, 1, 1], ['scroll_s30', 0.05, 1, 1]],
};

// ——— Frostpeak's depth pass, F2: the Whale Skerries and the Narwhal Grotto (art: src/skerries-art.js,
// src/dens-skerries.js; docs/places/skerries.md, docs/places/grotto.md). On the frozen curve ———
// The Skerries: ice seals loll on the rocks (harmless), skuas dive at you, sea urchins sit tight on the rocks
// and flick spines, whalebone crabs wear a bit of whale skull in front (hit them from behind), sea smoke (the
// cold mist off open water) fades and gusts, bull walruses rear up and slam the ice
MOBS.ice_seal = {
  name: 'Ice Seal', lvl: 56, hp: 5100, atk: 161, exp: 2110, speed: 50, w: 64, h: 40, aggro: false, hops: false,
  drops: [['coin', 1, 305, 480], ['seal_whisker', 0.55, 1, 2], ['mega_elixir', 0.08, 1, 1]],
};
MOBS.skua = {
  name: 'Skua', lvl: 58, hp: 5000, atk: 168, exp: 2263, speed: 115, w: 54, h: 36, aggro: true, hops: false, fly: 62,
  ai: { kind: 'dive', every: 3.2, warn: 0.55, time: 0.4 },
  drops: [['coin', 1, 320, 500], ['skua_feather', 0.5, 1, 2], ['mega_elixir', 0.09, 1, 1]],
};
MOBS.sea_urchin = {
  name: 'Sea Urchin', lvl: 61, hp: 5400, atk: 175, exp: 2513, speed: 0, w: 48, h: 40, aggro: true, hops: false, anchored: true,
  ai: { kind: 'lob', range: 440, every: 2.6, keep: 0, warn: 0.55, style: 'spine' },
  drops: [['coin', 1, 360, 548], ['urchin_spine', 0.5, 1, 2], ['mega_elixir', 0.09, 1, 1]],
};
MOBS.whalebone_crab = {
  name: 'Whalebone Crab', lvl: 64, hp: 7300, atk: 190, exp: 2803, speed: 55, w: 64, h: 46, aggro: true, hops: false,
  ai: { kind: 'shell', cut: 0.75, every: 3.2, warn: 0.5, lunge: 500, time: 0.32 },
  drops: [['coin', 1, 400, 605], ['whalebone_chip', 0.5, 1, 2], ['mega_elixir', 0.09, 1, 1], ['bonecrab_helm', 0.004, 1, 1]],
};
MOBS.sea_smoke = {
  name: 'Sea Smoke', lvl: 67, hp: 6600, atk: 202, exp: 3109, speed: 75, w: 50, h: 54, aggro: true, hops: false, fly: 44,
  ai: { kind: 'phase', every: 6.5, dur: 2, r: 175 },
  drops: [['coin', 1, 430, 640], ['bottled_mist', 0.5, 1, 2], ['mega_elixir', 0.1, 1, 1]],
};
MOBS.bull_walrus = {
  name: 'Bull Walrus', lvl: 69, hp: 8000, atk: 209, exp: 3325, speed: 40, w: 84, h: 62, aggro: true, hops: false,
  ai: { kind: 'stomp', every: 4.2, warn: 0.85, r: 170, range: 220, jump: 420 },
  drops: [['coin', 1, 450, 680], ['walrus_whisker', 0.5, 1, 2], ['mega_elixir', 0.11, 1, 1], ['ivory_cutlass', 0.003, 1, 1]],
};
// The Narwhal Grotto (a hard pocket): lanternfish swim the air of the cave and wink out, ice eels throw a jet
// of freezing water along the floor (jump it), brine slugs leave freezing brine behind them, ice skates glide
// round behind you; elites of the eels and the skates
MOBS.lanternfish = {
  name: 'Lanternfish', lvl: 71, hp: 7200, atk: 216, exp: 3540, speed: 70, w: 48, h: 40, aggro: true, hops: false, fly: 50,
  ai: { kind: 'phase', every: 6.2, dur: 1.9, r: 170 },
  drops: [['coin', 1, 470, 715], ['lantern_lure', 0.5, 1, 2], ['mega_elixir', 0.11, 1, 1], ['angler_lamp', 0.003, 1, 1]],
};
MOBS.ice_eel = {
  name: 'Ice Eel', lvl: 73, hp: 7600, atk: 225, exp: 3747, speed: 45, w: 76, h: 38, aggro: true, hops: false,
  ai: { kind: 'beam', range: 540, every: 4.2, warn: 0.9, dur: 0.45, y0: 420, y1: 450, style: 'jet' },
  drops: [['coin', 1, 490, 740], ['eel_skin', 0.5, 1, 2], ['mega_elixir', 0.11, 1, 1]],
};
MOBS.brine_slug = {
  name: 'Brine Slug', lvl: 75, hp: 8800, atk: 232, exp: 3960, speed: 40, w: 64, h: 40, aggro: true, hops: false,
  ai: { kind: 'trail', every: 0.8, life: 4.5, w: 56, style: 'brine' },
  drops: [['coin', 1, 510, 770], ['brine_crystal', 0.5, 1, 2], ['mega_elixir', 0.12, 1, 1]],
};
MOBS.ice_skate = {
  name: 'Ice Skate', lvl: 78, hp: 8300, atk: 243, exp: 4290, speed: 90, w: 70, h: 34, aggro: true, hops: false,
  ai: { kind: 'blink', every: 4.4, warn: 0.4, slashWarn: 0.5, r: 115 },
  drops: [['coin', 1, 540, 810], ['skate_wing', 0.5, 1, 2], ['mega_elixir', 0.12, 1, 1], ['skate_blade', 0.003, 1, 1]],
};
MOBS.ice_eel_elite = elite('ice_eel', 'Great Ice Eel');
MOBS.skate_elite = elite('ice_skate', 'Elder Skate');
// The Old Narwhal (her den is the breathing hole at the Floe Edge). A big boss with a story
// (story/characters/bosses.md): the last of her pod, who stayed when the rest swam south, and with a shard in
// her tusk holds the floes shut across the fjord's mouth so that nothing else can ever leave: not the fish,
// not the seals. Her ultimate, Close the Floes, is the `lanes` ult as ice coming down everywhere but one lane;
// her beam is a jet of freezing sea (`looks`)
MOBS.old_narwhal = {
  name: 'The Old Narwhal', boss: true, lvl: 70, hp: 520000, atk: 222, exp: 150000, speed: 75, w: 230, h: 150, aggro: true, hops: false,
  phases: [['charge', 'slam', 'rain'], ['charge', 'slam', 'beam', 'rain', 'summon'], ['charge', 'beam', 'echo', 'rain', 'summon', 'leap', 'barrage']],
  ult: { name: 'Close the Floes', kind: 'lanes' }, minion: 'whalebone_crab', looks: { beam: 'jet' },
  lines: {
    enter: ['Shut. The floes are shut. Nothing leaves my water. Nothing.', 'Another little warm thing come to open the ice? Go home. Go home and STAY.'],
    phase: [null, 'They all swam south. Every one. I sang and sang and they did not turn round.', 'If the ice opens, the fish go, the seals go, YOU go. Then I am the only thing left in the sea!'],
    freed: '...Go on, then. Swim. All of you. I will sing you out past the skerries, the way I should have sung them.',
  },
  drops: [['royal_sap', 1, 2, 3], ['narwhal_tusk', 1, 1, 1], ['floe_crown', 0.6, 1, 1], ['coin', 1, 11000, 16500], ['mega_elixir', 1, 4, 6], ['narwhal_ivory', 1, 4, 8], ['scroll_s60', 1, 2, 3], ['scroll_h60', 1, 2, 3], ['scroll_s10', 0.6, 1, 2], ['scroll_h10', 0.6, 1, 2], ['scroll_s30', 0.4, 1, 1], ['scroll_h30', 0.4, 1, 1], ['scroll_chaos', 0.4, 1, 2]],
};

// ——— Frostpeak's depth pass, F3: the Aurora Heights and the Blue Halls (art: src/heights-art.js,
// src/bluehalls-art.js; docs/places/heights.md, docs/places/bluehalls.md). On the frozen curve ———
// The Heights: ptarmigan peck about the Low Lights (harmless), snow foxes dive into the snow and come up behind
// you, rime eagles stoop out of the aurora, aurora jellies (drifting bells of the lights' own colour) go dark
// and flare, musk oxen stand shoulder to the wind behind a wall of horn (hit them from behind), and lost stars,
// little ones that fell with the Wyrm, hop about the Wyrmfall flicking sparks
MOBS.ptarmigan = {
  name: 'Ptarmigan', lvl: 76, hp: 8000, atk: 235, exp: 4012, speed: 80, w: 40, h: 36, aggro: false, hops: true,
  drops: [['coin', 1, 510, 765], ['ptarmigan_feather', 0.55, 1, 2], ['mega_elixir', 0.12, 1, 1]],
};
MOBS.snow_fox = {
  name: 'Snow Fox', lvl: 78, hp: 8300, atk: 243, exp: 4194, speed: 95, w: 56, h: 38, aggro: true, hops: false,
  ai: { kind: 'blink', every: 4.4, warn: 0.4, slashWarn: 0.5, r: 115 },
  drops: [['coin', 1, 540, 810], ['fox_brush', 0.5, 1, 2], ['mega_elixir', 0.12, 1, 1], ['foxfire_blade', 0.003, 1, 1]],
};
MOBS.rime_eagle = {
  name: 'Rime Eagle', lvl: 81, hp: 8700, atk: 254, exp: 4471, speed: 115, w: 62, h: 40, aggro: true, hops: false, fly: 62,
  ai: { kind: 'dive', every: 3.3, warn: 0.6, time: 0.42 },
  drops: [['coin', 1, 565, 850], ['eagle_quill', 0.5, 1, 2], ['mega_elixir', 0.12, 1, 1]],
};
MOBS.aurora_jelly = {
  name: 'Aurora Jelly', lvl: 83, hp: 9000, atk: 261, exp: 4661, speed: 65, w: 48, h: 56, aggro: true, hops: false, fly: 44,
  ai: { kind: 'phase', every: 6.2, dur: 1.9, r: 180 },
  drops: [['coin', 1, 585, 880], ['bottled_aurora', 0.5, 1, 2], ['mega_elixir', 0.13, 1, 1]],
};
MOBS.musk_ox = {
  name: 'Musk Ox', lvl: 86, hp: 11500, atk: 272, exp: 4951, speed: 50, w: 72, h: 56, aggro: true, hops: false,
  ai: { kind: 'shell', cut: 0.75, every: 3.2, warn: 0.55, lunge: 540, time: 0.32 },
  drops: [['coin', 1, 610, 915], ['qiviut', 0.5, 1, 2], ['mega_elixir', 0.13, 1, 1], ['muskox_helm', 0.004, 1, 1]],
};
MOBS.lost_star = {
  name: 'Lost Star', lvl: 88, hp: 9800, atk: 279, exp: 5148, speed: 60, w: 40, h: 42, aggro: true, hops: true,
  ai: { kind: 'lob', range: 460, every: 2.7, keep: 150, warn: 0.55, style: 'star' },
  drops: [['coin', 1, 630, 945], ['star_spark', 0.5, 1, 2], ['mega_elixir', 0.14, 1, 1]],
};
// The Blue Halls (a hard pocket): icicle bats hang from the roof and drop on you, ice worms tunnel through the
// walls and come out behind you, glass beetles carry a shell of clear ice in front (hit them from behind),
// prism crawlers catch the blue light and throw it along the floor (jump it); elites of the worms and beetles
MOBS.icicle_bat = {
  name: 'Icicle Bat', lvl: 81, hp: 8600, atk: 254, exp: 4471, speed: 110, w: 50, h: 32, aggro: true, hops: false, fly: 60,
  ai: { kind: 'dive', every: 3.4, warn: 0.6, time: 0.42 },
  drops: [['coin', 1, 565, 850], ['bat_wing', 0.5, 1, 2], ['mega_elixir', 0.12, 1, 1]],
};
MOBS.ice_worm = {
  name: 'Ice Worm', lvl: 83, hp: 9100, atk: 261, exp: 4661, speed: 70, w: 70, h: 34, aggro: true, hops: false,
  ai: { kind: 'blink', every: 4.6, warn: 0.45, slashWarn: 0.5, r: 115 },
  drops: [['coin', 1, 585, 880], ['worm_glass', 0.5, 1, 2], ['mega_elixir', 0.13, 1, 1]],
};
MOBS.glass_beetle = {
  name: 'Glass Beetle', lvl: 86, hp: 11400, atk: 272, exp: 4951, speed: 55, w: 64, h: 44, aggro: true, hops: false,
  ai: { kind: 'shell', cut: 0.75, every: 3.2, warn: 0.5, lunge: 500, time: 0.32 },
  drops: [['coin', 1, 610, 915], ['glass_shell', 0.5, 1, 2], ['mega_elixir', 0.13, 1, 1], ['beetle_helm', 0.004, 1, 1]],
};
MOBS.prism_crawler = {
  name: 'Prism Crawler', lvl: 88, hp: 10000, atk: 279, exp: 5148, speed: 45, w: 60, h: 46, aggro: true, hops: false,
  ai: { kind: 'beam', range: 560, every: 4.2, warn: 0.9, dur: 0.45, y0: 420, y1: 450, style: 'prism' },
  drops: [['coin', 1, 630, 945], ['prism_shard', 0.5, 1, 2], ['mega_elixir', 0.14, 1, 1], ['prism_blade', 0.003, 1, 1]],
};
MOBS.worm_elite = elite('ice_worm', 'Great Ice Worm');
MOBS.beetle_elite = elite('glass_beetle', 'Old Glass Beetle');
// The Pale Wyrm: a field boss with a story (story/characters/bosses.md), something of the Astral Wyrm's kind
// that fell with it and lies in the long hollow it melted in the Wyrmfall, dim and curled up. It could go back
// up; it would rather stay fallen. Passive until hit; then it lifts off the snow and falls on you, again and
// again (the dive), and settles back down
MOBS.pale_wyrm = {
  name: 'The Pale Wyrm', field: true, lvl: 90, hp: 220000, atk: 262, exp: 93000, speed: 55, w: 210, h: 100, aggro: false, hops: false, fly: 80,
  ai: { kind: 'dive', every: 3.2, warn: 0.9, time: 0.55 },
  desc: 'The Pale Wyrm has stirred in the Wyrmfall.',
  drops: [['coin', 1, 8000, 11600], ['pale_scale', 1, 4, 8], ['star_spark', 1, 3, 5], ['mega_elixir', 1, 2, 3], ['pale_star_blade', 0.25, 1, 1], ['aurora_crown', 0.4, 1, 1], ['scroll_s60', 0.5, 1, 1], ['scroll_h60', 0.5, 1, 1], ['scroll_s10', 0.15, 1, 1], ['scroll_h10', 0.15, 1, 1], ['scroll_s30', 0.05, 1, 1]],
};
// The Hall Troll: a field boss (small: no story), a great blue-grey troll out of the cutters' stories who lives
// in the Deep Blue, cuts blocks of ice of its own and stacks them into walls nobody needs. Passive until hit;
// then it keeps its distance and throws blocks of ice
MOBS.hall_troll = {
  name: 'The Hall Troll', field: true, lvl: 88, hp: 215000, atk: 270, exp: 89000, speed: 50, w: 150, h: 160, aggro: false, hops: false,
  ai: { kind: 'lob', range: 520, every: 2.6, keep: 180, warn: 0.75, style: 'ice' },
  desc: 'The Hall Troll is stacking ice in the Deep Blue. Hear it?',
  drops: [['coin', 1, 7800, 11300], ['troll_tooth', 1, 4, 8], ['glass_shell', 1, 3, 5], ['mega_elixir', 1, 2, 3], ['troll_maul', 0.25, 1, 1], ['troll_helm', 0.4, 1, 1], ['scroll_s60', 0.5, 1, 1], ['scroll_h60', 0.5, 1, 1], ['scroll_s10', 0.15, 1, 1], ['scroll_h10', 0.15, 1, 1], ['scroll_s30', 0.05, 1, 1]],
};

// ——— Frostpeak's depth pass, F4: the Queen's Bridge (art: src/qbridge-art.js, src/dens-qbridge.js;
// docs/places/queensbridge.md). On the frozen curve ———
// Rime puffins sit along the rail (harmless), sleet harriers stoop out of the strait's wind, rimeguards (the
// Queen's guards, frozen half-solid and still on watch) hold a round shield of ice in front (hit them from
// behind), hoarfrost shades fade into the cold and pulse out of it, leopard seals slip down through the
// cracks and come up behind you, and rime archers, guards still at their loopholes, throw javelins of ice
MOBS.rime_puffin = {
  name: 'Rime Puffin', lvl: 86, hp: 9000, atk: 272, exp: 4951, speed: 75, w: 38, h: 40, aggro: false, hops: true,
  drops: [['coin', 1, 610, 915], ['puffin_beak', 0.55, 1, 2], ['mega_elixir', 0.13, 1, 1]],
};
MOBS.sleet_harrier = {
  name: 'Sleet Harrier', lvl: 88, hp: 9700, atk: 279, exp: 5148, speed: 115, w: 60, h: 38, aggro: true, hops: false, fly: 62,
  ai: { kind: 'dive', every: 3.3, warn: 0.6, time: 0.42 },
  drops: [['coin', 1, 630, 945], ['harrier_talon', 0.5, 1, 2], ['mega_elixir', 0.14, 1, 1]],
};
MOBS.rimeguard = {
  name: 'Rimeguard', lvl: 91, hp: 12600, atk: 291, exp: 5450, speed: 45, w: 50, h: 58, aggro: true, hops: false,
  ai: { kind: 'shell', cut: 0.75, every: 3.2, warn: 0.55, lunge: 520, time: 0.32 },
  drops: [['coin', 1, 665, 1000], ['rime_buckle', 0.5, 1, 2], ['mega_elixir', 0.14, 1, 1], ['rimeguard_helm', 0.004, 1, 1]],
};
MOBS.hoarfrost_shade = {
  name: 'Hoarfrost Shade', lvl: 93, hp: 10600, atk: 298, exp: 5655, speed: 70, w: 46, h: 58, aggro: true, hops: false, fly: 44,
  ai: { kind: 'phase', every: 6.2, dur: 1.9, r: 180 },
  drops: [['coin', 1, 690, 1035], ['bottled_hoarfrost', 0.5, 1, 2], ['mega_elixir', 0.15, 1, 1]],
};
MOBS.leopard_seal = {
  name: 'Leopard Seal', lvl: 95, hp: 11100, atk: 306, exp: 5863, speed: 85, w: 76, h: 36, aggro: true, hops: false,
  ai: { kind: 'blink', every: 4.4, warn: 0.45, slashWarn: 0.5, r: 120 },
  drops: [['coin', 1, 710, 1065], ['seal_whisker', 0.5, 1, 2], ['mega_elixir', 0.15, 1, 1]],
};
MOBS.rime_archer = {
  name: 'Rime Archer', lvl: 98, hp: 11500, atk: 317, exp: 6182, speed: 40, w: 48, h: 58, aggro: true, hops: false,
  ai: { kind: 'lob', range: 480, every: 2.7, keep: 170, warn: 0.6, style: 'javelin' },
  drops: [['coin', 1, 740, 1110], ['ice_arrowhead', 0.5, 1, 2], ['mega_elixir', 0.16, 1, 1], ['rimeguard_blade', 0.003, 1, 1]],
};
// Sigrun, the Queen's Shield (the Seam, at the bridge's crack): Frostpeak's capstone boss, with a story
// (story/characters/bosses.md). Glacia's sworn guard, fjord folk frozen half to ice, who still freezes the
// crack shut every night though her queen has let go: holding on to someone else's holding on. Her beam is
// the cold light off her shield (`looks`), her grid the deck heaving along the seam, and her ultimate, Close
// the Seam, is the `wave` ult as new ice racing along the floor (src/dens.js iceMass).
// party (story/progression.md, S5; nothing reads it yet): focus: her spear locks onto one slime · barrier:
// her shield turns blades from the front (flank her) · pulse: the seam's cold every few seconds · weakpoint:
// the shard, set in her shield's boss · adds: rimeguards
MOBS.sigrun = {
  name: "Sigrun, the Queen's Shield", boss: true, lvl: 100, hp: 760000, atk: 330, exp: 260000, speed: 80, w: 150, h: 190, aggro: true, hops: false,
  phases: [['slam', 'charge', 'rain'], ['slam', 'charge', 'beam', 'rain', 'summon', 'grid'], ['grid', 'beam', 'echo', 'slam', 'summon', 'barrage', 'leap', 'charge']],
  ult: { name: 'Close the Seam', kind: 'wave' }, minion: 'rimeguard', looks: { beam: 'shield', grid: 'seam' }, // (how they're drawn: src/hazards.js)
  party: ['focus', 'barrier', 'pulse', 'weakpoint', 'adds'],
  lines: {
    enter: ["Halt. This is the Queen's bridge. No one crosses while I stand on it.", 'Every night it cracks, and every night I close it. Go back down. You are letting the cold out.'],
    phase: [null, 'She told me to hold it. She never told me I could stop.', 'Her hands are open now. I saw her let go. Mine are not hers to open!'],
    freed: '...Then let it crack. She let go, and I held on for her, and it was never mine to hold. Go on, little ones. Cross while it lasts.',
  },
  drops: [['royal_sap', 1, 2, 3], ['oath_blade', 1, 1, 1], ['sigrun_helm', 0.6, 1, 1], ['coin', 1, 17000, 25500], ['mega_elixir', 1, 4, 6], ['seam_ice', 1, 4, 8], ['scroll_s60', 1, 2, 3], ['scroll_h60', 1, 2, 3], ['scroll_s10', 0.6, 1, 2], ['scroll_h10', 0.6, 1, 2], ['scroll_s30', 0.4, 1, 1], ['scroll_h30', 0.4, 1, 1], ['scroll_chaos', 0.4, 1, 2]],
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
const onPPlat = onRoomPlat(SPINE_PLATFORMS, SPINE);
const onIPlat = onRoomPlat(GLACIER_PLATFORMS, GLACIER);
const onSkPlat = onRoomPlat(SKERRIES_PLATFORMS, SKERRIES);
const onGrPlat = onRoomPlat(GROTTO_PLATFORMS, GROTTO);
const onAhPlat = onRoomPlat(HEIGHTS_PLATFORMS, HEIGHTS);
const onBhPlat = onRoomPlat(BLUEHALLS_PLATFORMS, BLUEHALLS);
const onQbPlat = onRoomPlat(QBRIDGE_PLATFORMS, QBRIDGE);
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
  // Keeper's Spine (the Windgap, x < 900, has none; sentinels stay on the road: their beam runs along it;
  // nothing near the Root Warden's gatehouse at WARDEN_DEN_X)
  ...strip('moss_turtle', 1000, 1750, FIELD_GROUND, 4, SPINE),
  ...onPPlat('moss_turtle', 0, 1),
  ...strip('crag_kite', 1650, 2350, FIELD_GROUND, 3, SPINE),
  ...onPPlat('crag_kite', 1, 1),
  ...onPPlat('crag_kite', 2, 1),
  ...strip('stone_sentinel', 2500, 3250, FIELD_GROUND, 3, SPINE),
  ...strip('gale_sprite', 3100, 3850, FIELD_GROUND, 3, SPINE),
  ...onPPlat('gale_sprite', 3, 1),
  ...onPPlat('gale_sprite', 4, 1),
  ...onPPlat('stone_sentinel', 5, 1),
  ...strip('rootling', 4000, 4800, FIELD_GROUND, 4, SPINE),
  ...strip('stone_sentinel', 4000, 4700, FIELD_GROUND, 1, SPINE),
  ...onPPlat('rootling', 6, 1),
  ...onPPlat('rootling', 7, 1),
  // the Rimeglass Glacier (the Cutters' Camp, x < 950, has none; nothing at the crevasse or the climb at the top)
  ...strip('snow_hare', 1000, 2350, FIELD_GROUND, 5, GLACIER),
  ...onIPlat('snow_hare', 1, 1),
  ...strip('snow_petrel', 1300, 2350, FIELD_GROUND, 3, GLACIER),
  ...onIPlat('snow_petrel', 2, 1),
  ...strip('glacier_ram', 1950, 2380, FIELD_GROUND, 2, GLACIER),
  ...onIPlat('glacier_ram', 3, 1),
  ...onIPlat('snow_petrel', 4, 1),
  ...strip('glacier_ram', 2450, 3100, FIELD_GROUND, 3, GLACIER),
  ...onIPlat('glacier_ram', 5, 1),
  ...strip('rime_wolf', 2950, 3880, FIELD_GROUND, 4, GLACIER),
  ...onIPlat('rime_wolf', 6, 1),
  ...strip('frost_wraith', 3350, 3880, FIELD_GROUND, 1, GLACIER),
  ...onIPlat('frost_wraith', 7, 1),
  ...onIPlat('rime_wolf', 8, 1),
  ...strip('frost_wraith', 3950, 4700, FIELD_GROUND, 2, GLACIER),
  ...strip('great_yeti', 4300, 5180, FIELD_GROUND, 4, GLACIER),
  ...onIPlat('frost_wraith', 9, 1),
  ...onIPlat('great_yeti', 10, 1),
  ...onIPlat('great_yeti', 11, 1),
  ...onIPlat('frost_wraith', 12, 1),
  { kind: 'rimehorn', x0: 4000, x1: 5150, y: FIELD_GROUND, room: GLACIER },
  // the Whale Skerries (the Whaling Hut, x > 4200, has none; nothing near the den or the Grotto's mouth)
  ...strip('ice_seal', 3350, 4150, FIELD_GROUND, 4, SKERRIES),
  ...onSkPlat('ice_seal', 2, 1),
  ...strip('skua', 3350, 4150, FIELD_GROUND, 2, SKERRIES),
  ...onSkPlat('skua', 1, 1),
  ...onSkPlat('skua', 3, 1),
  ...strip('sea_urchin', 1750, 3250, FIELD_GROUND, 3, SKERRIES),
  ...onSkPlat('sea_urchin', 6, 1),
  ...strip('whalebone_crab', 1750, 3250, FIELD_GROUND, 3, SKERRIES),
  ...onSkPlat('whalebone_crab', 4, 1),
  ...onSkPlat('whalebone_crab', 5, 1),
  ...strip('sea_smoke', 800, 1650, FIELD_GROUND, 2, SKERRIES),
  ...onSkPlat('sea_smoke', 8, 1),
  ...strip('bull_walrus', 800, 1650, FIELD_GROUND, 3, SKERRIES),
  ...onSkPlat('bull_walrus', 7, 1),
  ...onSkPlat('sea_smoke', 9, 1),
  // the Narwhal Grotto (the mouth, x < 600, has none)
  ...strip('lanternfish', 700, 2250, FIELD_GROUND, 3, GROTTO),
  ...onGrPlat('lanternfish', 1, 1),
  ...strip('ice_eel', 900, 2250, FIELD_GROUND, 3, GROTTO),
  ...onGrPlat('ice_eel', 2, 1),
  ...onGrPlat('lanternfish', 3, 1),
  { kind: 'ice_eel_elite', x0: 1700, x1: 2200, y: FIELD_GROUND, room: GROTTO },
  ...strip('brine_slug', 2400, 3900, FIELD_GROUND, 3, GROTTO),
  ...onGrPlat('brine_slug', 4, 1),
  ...strip('ice_skate', 2400, 3900, FIELD_GROUND, 3, GROTTO),
  ...onGrPlat('ice_skate', 5, 1),
  ...onGrPlat('brine_slug', 6, 1),
  ...onGrPlat('ice_skate', 7, 1),
  { kind: 'skate_elite', x0: 3200, x1: 3850, y: FIELD_GROUND, room: GROTTO },
  // the Aurora Heights (the Last Step, x < 900, has none)
  ...strip('ptarmigan', 1000, 2400, FIELD_GROUND, 4, HEIGHTS),
  ...onAhPlat('ptarmigan', 0, 1),
  ...strip('snow_fox', 1450, 2400, FIELD_GROUND, 3, HEIGHTS),
  ...onAhPlat('snow_fox', 1, 1),
  ...onAhPlat('ptarmigan', 2, 1),
  ...onAhPlat('snow_fox', 3, 1),
  ...strip('rime_eagle', 2500, 3800, FIELD_GROUND, 3, HEIGHTS),
  ...onAhPlat('rime_eagle', 4, 1),
  ...strip('aurora_jelly', 2550, 3800, FIELD_GROUND, 3, HEIGHTS),
  ...onAhPlat('aurora_jelly', 5, 1),
  ...onAhPlat('rime_eagle', 6, 1),
  ...strip('musk_ox', 3900, 5100, FIELD_GROUND, 3, HEIGHTS),
  ...onAhPlat('musk_ox', 7, 1),
  ...strip('lost_star', 3950, 5100, FIELD_GROUND, 3, HEIGHTS),
  ...onAhPlat('lost_star', 8, 1),
  ...onAhPlat('lost_star', 9, 1),
  { kind: 'pale_wyrm', x0: 3950, x1: 5050, y: FIELD_GROUND, room: HEIGHTS },
  // the Blue Halls (the ladder's foot, x < 600, has none)
  ...strip('icicle_bat', 700, 2300, FIELD_GROUND, 3, BLUEHALLS),
  ...onBhPlat('icicle_bat', 1, 1),
  ...strip('ice_worm', 900, 2300, FIELD_GROUND, 3, BLUEHALLS),
  ...onBhPlat('ice_worm', 0, 1),
  ...onBhPlat('ice_worm', 2, 1),
  ...onBhPlat('icicle_bat', 3, 1),
  { kind: 'worm_elite', x0: 1700, x1: 2250, y: FIELD_GROUND, room: BLUEHALLS },
  ...strip('glass_beetle', 2450, 4100, FIELD_GROUND, 3, BLUEHALLS),
  ...onBhPlat('glass_beetle', 4, 1),
  ...strip('prism_crawler', 2450, 4100, FIELD_GROUND, 3, BLUEHALLS),
  ...onBhPlat('prism_crawler', 5, 1),
  ...onBhPlat('glass_beetle', 6, 1),
  ...onBhPlat('prism_crawler', 7, 1),
  { kind: 'beetle_elite', x0: 3300, x1: 4050, y: FIELD_GROUND, room: BLUEHALLS },
  { kind: 'hall_troll', x0: 2700, x1: 4050, y: FIELD_GROUND, room: BLUEHALLS },
  // the Queen's Bridge (the Stairhead, x < 900, has none; nothing right by Sigrun's seam at SIGRUN_DEN_X)
  ...strip('rime_puffin', 1000, 2350, FIELD_GROUND, 4, QBRIDGE),
  ...onQbPlat('rime_puffin', 0, 1),
  ...strip('sleet_harrier', 1450, 2350, FIELD_GROUND, 3, QBRIDGE),
  ...onQbPlat('sleet_harrier', 1, 1),
  ...onQbPlat('rime_puffin', 2, 1),
  ...strip('rimeguard', 2500, 3850, FIELD_GROUND, 3, QBRIDGE),
  ...onQbPlat('rimeguard', 3, 1),
  ...strip('hoarfrost_shade', 2550, 3850, FIELD_GROUND, 3, QBRIDGE),
  ...onQbPlat('hoarfrost_shade', 4, 1),
  ...onQbPlat('rimeguard', 5, 1),
  ...strip('leopard_seal', 3950, 4800, FIELD_GROUND, 3, QBRIDGE),
  ...strip('rime_archer', 4000, 4850, FIELD_GROUND, 3, QBRIDGE),
  ...onQbPlat('rime_archer', 6, 1),
  ...onQbPlat('leopard_seal', 6, 1),
  ...onQbPlat('rime_archer', 7, 1),
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
  { room: 35, boss: 'root_warden', name: "The Warden's Court", from: SPINE, entranceX: WARDEN_DEN_X, theme: 'warden' }, // (art: src/dens-spine.js)
  { room: 38, boss: 'old_narwhal', name: 'The Breathing Hole', from: SKERRIES, entranceX: NARWHAL_DEN_X, theme: 'floe' }, // (art: src/dens-skerries.js)
  { room: 43, boss: 'sigrun', name: 'The Seam', from: QBRIDGE, entranceX: SIGRUN_DEN_X, theme: 'oath' }, // (art: src/dens-qbridge.js)
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
// kind: coin · potion (heal) · loot (just collectible, for now) · helmet (def) · sword (atk, reach) ·
// staff (magic, mp, reach: the staff bolt's extra range; twin: the sword it drops in place of, see STAFF_OF) ·
// bow (atk, reach: the arrow's extra range, twin; made from its sword below, BOW_LIST)
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
  frost_blade: { name: 'Frostbite Blade (Legacy)', legacy: true, price: 15000, kind: 'sword', atk: 44, reach: 38, desc: "Glacia's icy sword. Cold to the touch, colder to be hit by." },
  frost_blade_n: { name: 'Frostbite Blade', lvl: 47, art: 'frost_blade', price: 110000, kind: 'sword', atk: 93, reach: 38, desc: "Glacia's icy sword. Cold to the touch, colder to be hit by." },
  glacier_helm: { name: 'Glacier Crown (Legacy)', legacy: true, price: 12000, kind: 'helmet', def: 20, desc: 'A crown of never-melting ice.' },
  glacier_helm_n: { name: 'Glacier Crown', lvl: 47, art: 'glacier_helm', price: 84000, kind: 'helmet', def: 41, desc: 'A crown of never-melting ice.' },
  star_sword: { name: 'Starforged Sword (Legacy)', legacy: true, price: 40000, kind: 'sword', atk: 62, reach: 44, desc: 'Forged from a fallen star. Leaves a trail of sparkles.' },
  star_sword_n: { name: 'Starforged Sword', lvl: 57, art: 'star_sword', price: 210000, kind: 'sword', atk: 108, reach: 44, desc: 'Forged from a fallen star. Leaves a trail of sparkles.' },
  star_crown: { name: 'Astral Crown (Legacy)', legacy: true, price: 30000, kind: 'helmet', def: 28, desc: 'The Astral Wyrm\'s crest. It hums with starlight.' },
  star_crown_n: { name: 'Astral Crown', lvl: 57, art: 'star_crown', price: 160000, kind: 'helmet', def: 48, desc: 'The Astral Wyrm\'s crest. It hums with starlight.' },
  ice_shard: { name: 'Ice Shard', price: 60, kind: 'loot', desc: 'A shard of ice that never melts.' },
  stardust: { name: 'Stardust', price: 120, kind: 'loot', desc: 'A pinch of glittering stardust.' },
  elixir: { name: 'Rainbow Elixir', price: 400, kind: 'potion', heal: 300, mana: 150, desc: 'Restores 300 HP and 150 MP.' },
  // Netmender Runa's (Icefang Hamlet): the fjord folk's warm gear
  fur_hood: { name: 'Seal-Fur Hood (Legacy)', legacy: true, price: 3000, kind: 'helmet', def: 11, desc: 'Seal fur over a knitted cap. The fjord folk swear by it.' },
  fur_hood_n: { name: 'Seal-Fur Hood', lvl: 42, aim: 44, art: 'fur_hood', price: 28000, kind: 'helmet', def: 38, desc: 'Seal fur over a knitted cap. The fjord folk swear by it.' },
  bone_harpoon: { name: 'Whalebone Harpoon (Legacy)', legacy: true, price: 5000, kind: 'sword', atk: 27, reach: 40, desc: 'Old whalebone, filed to a point. Cold to hold.' },
  bone_harpoon_n: { name: 'Whalebone Harpoon', lvl: 44, aim: 44, art: 'bone_harpoon', price: 36000, kind: 'sword', atk: 89, reach: 40, desc: 'Old whalebone, filed to a point. Cold to hold.' },
  bramble_helm: { name: 'Briar Helm', price: 7000, kind: 'helmet', def: 14, desc: 'Woven from living brambles. Nothing gets through.' },
  // the Caldera and the Citadel
  ember_core: { name: 'Ember Core', price: 200, kind: 'loot', desc: 'A warm little coal that never goes out.' },
  obsidian_shard: { name: 'Obsidian Shard', price: 300, kind: 'loot', desc: 'Glassy black volcanic stone, razor sharp.' },
  cog: { name: 'Brass Cog', price: 450, kind: 'loot', desc: 'A finely made cog. Still ticking, somehow.' },
  aether_crystal: { name: 'Aether Crystal', price: 700, kind: 'loot', desc: 'A sliver of crystallised sky.' },
  mega_elixir: { name: 'Mega Elixir', price: 1500, kind: 'potion', heal: 900, mana: 400, desc: 'Restores 900 HP and 400 MP.' },
  magma_maul: { name: 'Magma Maul (Legacy)', legacy: true, price: 60000, kind: 'sword', atk: 78, reach: 46, slots: 9, desc: "Ignis's molten blade. It glows like a forge." },
  magma_maul_n: { name: 'Magma Maul', lvl: 99, art: 'magma_maul', price: 470000, kind: 'sword', atk: 156, reach: 46, slots: 9, desc: "Ignis's molten blade. It glows like a forge." },
  ember_helm: { name: 'Ember Helm (Legacy)', legacy: true, price: 45000, kind: 'helmet', def: 34, slots: 9, desc: 'A horned helm of cooled lava, still warm inside.' },
  ember_helm_n: { name: 'Ember Helm', lvl: 99, art: 'ember_helm', price: 350000, kind: 'helmet', def: 73, slots: 9, desc: 'A horned helm of cooled lava, still warm inside.' },
  phoenix_blade: { name: 'Phoenix Blade (Legacy)', legacy: true, price: 90000, kind: 'sword', atk: 92, reach: 48, slots: 9, desc: "A sword of Pyra's flame-feathers. It never stops burning." },
  phoenix_blade_n: { name: 'Phoenix Blade', lvl: 110, art: 'phoenix_blade', price: 530000, kind: 'sword', atk: 168, reach: 48, slots: 9, desc: "A sword of Pyra's flame-feathers. It never stops burning." },
  phoenix_crown: { name: 'Phoenix Crown (Legacy)', legacy: true, price: 70000, kind: 'helmet', def: 40, slots: 9, desc: 'A crest of fiery plumes.' },
  phoenix_crown_n: { name: 'Phoenix Crown', lvl: 110, art: 'phoenix_crown', price: 410000, kind: 'helmet', def: 80, slots: 9, desc: 'A crest of fiery plumes.' },
  cog_cleaver: { name: 'Cog Cleaver (Legacy)', legacy: true, price: 150000, kind: 'sword', atk: 112, reach: 52, slots: 10, desc: 'A great geared blade from the Colossus. It whirs when swung.' },
  cog_cleaver_n: { name: 'Cog Cleaver', lvl: 150, art: 'cog_cleaver', price: 970000, kind: 'sword', atk: 208, reach: 52, slots: 10, desc: 'A great geared blade from the Colossus. It whirs when swung.' },
  aether_helm: { name: 'Aether Helm (Legacy)', legacy: true, price: 120000, kind: 'helmet', def: 50, slots: 10, desc: 'Brass and sky-crystal. Light as a cloud.' },
  aether_helm_n: { name: 'Aether Helm', lvl: 150, art: 'aether_helm', price: 770000, kind: 'helmet', def: 102, slots: 10, desc: 'Brass and sky-crystal. Light as a cloud.' },
  chrono_blade: { name: 'Chrono Blade (Legacy)', legacy: true, price: 300000, kind: 'sword', atk: 135, reach: 56, slots: 10, desc: "The hand of Chronos's great clock, sharpened. Time slows where it cuts." },
  chrono_blade_n: { name: 'Chrono Blade', lvl: 170, art: 'chrono_blade', price: 1400000, kind: 'sword', atk: 227, reach: 56, slots: 10, desc: "The hand of Chronos's great clock, sharpened. Time slows where it cuts." },
  hourglass_crown: { name: 'Hourglass Crown (Legacy)', legacy: true, price: 240000, kind: 'helmet', def: 62, slots: 10, desc: 'Sand still trickles through it, upward.' },
  hourglass_crown_n: { name: 'Hourglass Crown', lvl: 170, art: 'hourglass_crown', price: 1100000, kind: 'helmet', def: 112, slots: 10, desc: 'Sand still trickles through it, upward.' },
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
  drift_cutlass: { name: 'Driftwood Cutlass', price: 7000, lvl: 16, aim: 18, kind: 'sword', atk: 40, reach: 36, desc: 'Sea-bleached driftwood with an edge of bright sea glass.' },
  conch_helm: { name: 'Conch Helm', price: 6000, lvl: 16, aim: 18, kind: 'helmet', def: 18, desc: 'A big pink conch. Hold it to your ear and you hear the sea.' },
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
  rootwood_saber: { name: 'Rootwood Saber', price: 16000, lvl: 24, aim: 26, kind: 'sword', atk: 58, reach: 42, desc: 'Carved from a root of the Deep, dark and hard as iron. It glows along the grain.' },
  lantern_cap: { name: 'Lantern Cap', price: 14500, lvl: 24, aim: 26, kind: 'helmet', def: 26, desc: "A forager's leather cap with a glowing mushroom for a lamp. Never be lost underground." },
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
  ranger_billhook: { name: "Ranger's Billhook", price: 21000, lvl: 30, aim: 32, kind: 'sword', atk: 70, reach: 44, desc: 'A hooked oak-handled blade for clearing paths through the branches. Ranger Acorn keeps hers very sharp.' },
  ranger_hood: { name: "Ranger's Hat", price: 18000, lvl: 30, aim: 32, kind: 'helmet', def: 31, desc: 'A broad green felt hat with an acorn badge and a jay feather in the band.' },
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
  // ——— G5: Keeper's Spine (art: src/spine-art.js). No trader: drops only ———
  turtle_moss: { name: 'Turtle Moss', price: 400, kind: 'loot', desc: "A springy green tuft off a moss turtle's shell. There's a tiny snail living in it." },
  kite_feather: { name: 'Kite Feather', price: 420, kind: 'loot', desc: 'A long barred flight feather. Hold it up and it tugs toward the wind.' },
  rune_chip: { name: 'Rune Chip', price: 450, kind: 'loot', desc: 'A chip of grey Keeper stone with half a gear tooth carved on it. Still faintly warm.' },
  bottled_gale: { name: 'Bottled Gale', price: 470, kind: 'loot', desc: 'A corked bottle with a gust of the ridge wind inside. It hums when you shake it.' },
  rootling_twig: { name: 'Rootling Twig', price: 490, kind: 'loot', desc: "A knobbly root-finger that wriggles for a while after a rootling's gone. Then it doesn't." },
  mossback_helm: { name: 'Mossback Helm', price: 76000, lvl: 47, kind: 'helmet', def: 41, desc: "An old turtle shell gone green with moss, worn as a helmet. Very calm. Very slow to take off." },
  sentinel_blade: { name: 'Sentinel Blade', price: 126000, lvl: 53, kind: 'sword', atk: 102, reach: 52, desc: 'A long grey blade of Keeper stone, a gear carved at the hilt. It was made to stand guard, and it still does.' },
  warden_blade: { name: "Warden's Greatblade", price: 175000, lvl: 62, slots: 9, kind: 'sword', atk: 114, reach: 58, desc: "The Root Warden's stone blade, roots grown all the way through it. It held a gate for longer than anyone remembers." },
  // the Rimeglass Glacier (F1)
  hare_tuft: { name: 'Snow Hare Tuft', price: 480, kind: 'loot', desc: 'A puff of white winter fur, softer than it has any right to be. The fjord folk line mittens with it.' },
  petrel_down: { name: 'Petrel Down', price: 500, kind: 'loot', desc: 'A handful of grey-white down from a snow petrel. It smells of the sea, even up here.' },
  ram_horn: { name: 'Ram Horn Ring', price: 520, kind: 'loot', desc: "A ring of horn knocked off a glacier ram's curl. You can count the winters in it." },
  wolf_pelt: { name: 'Rime Wolf Pelt', price: 540, kind: 'loot', desc: 'A strip of frost-grey pelt, the tips of every hair iced white.' },
  frozen_breath: { name: 'Frozen Breath', price: 560, kind: 'loot', desc: "A wisp of a frost wraith caught in a stoppered vial. The glass is too cold to hold for long." },
  yeti_fur: { name: 'Great Yeti Fur', price: 580, kind: 'loot', desc: 'A hank of long white fur, coarse outside and warm as a blanket underneath.' },
  mammoth_wool: { name: 'Mammoth Wool', price: 700, kind: 'loot', desc: "A great hank of Old Rimehorn's winter coat, red-brown and tangled with ice. Runa would knit a whole jumper from it." },
  cutter_cleaver: { name: "Ice-Cutter's Cleaver", price: 80000, lvl: 64, aim: 66, kind: 'sword', atk: 117, reach: 52, desc: 'A heavy square blade for cutting blocks of glacier ice. Eyvind grinds them on the same stone his father did.' },
  cutter_cap: { name: "Ice-Cutter's Cap", price: 62000, lvl: 64, aim: 66, kind: 'helmet', def: 52, desc: 'A thick fur cap with flaps tied up on top and snow goggles of carved horn.' },
  ramhorn_helm: { name: 'Ramhorn Helm', price: 151000, lvl: 66, kind: 'helmet', def: 54, desc: "A frosted iron cap with a glacier ram's great curled horns. Lower your head and things move out of your way." },
  rimefang: { name: 'Rimefang', price: 209000, lvl: 68, kind: 'sword', atk: 121, reach: 54, desc: 'A pale curved blade like a wolf\'s fang, rimed white along the edge. It is always colder than the air.' },
  tusk_blade: { name: 'Rimehorn Tusk', price: 262000, lvl: 76, kind: 'sword', atk: 130, reach: 60, desc: "A greatsword carved from a shed mammoth tusk, yellowed and cracked and older than the hamlet. Old Rimehorn grows a new one." },
  mammoth_hood: { name: 'Woolly Hood', price: 201000, lvl: 76, kind: 'helmet', def: 59, desc: "A great shaggy hood of Old Rimehorn's red-brown wool with two little tusks at the brow. Nothing has ever been this warm." },
  // the Whale Skerries and the Narwhal Grotto (F2)
  seal_whisker: { name: 'Seal Whisker', price: 470, kind: 'loot', desc: "A long pale whisker from an ice seal. The fjord folk say it bends toward fish." },
  skua_feather: { name: 'Skua Feather', price: 480, kind: 'loot', desc: 'A dark brown feather with a white flash. Skuas steal everything, including other birds\' dinners.' },
  urchin_spine: { name: 'Urchin Spine', price: 500, kind: 'loot', desc: 'A long purple spine, needle-sharp at one end. Carry it point down.' },
  whalebone_chip: { name: 'Whalebone Chip', price: 520, kind: 'loot', desc: 'A chip of old grey whalebone a crab was wearing. Hakon carves these into combs.' },
  bottled_mist: { name: 'Bottled Sea Smoke', price: 540, kind: 'loot', desc: 'A wisp of the mist that smokes off open water in the cold, in a corked bottle. It swirls when you tilt it.' },
  walrus_whisker: { name: 'Walrus Whisker', price: 560, kind: 'loot', desc: 'A bristle off a bull walrus, thick as a nail. Its owner has hundreds more.' },
  lantern_lure: { name: 'Lantern Lure', price: 590, kind: 'loot', desc: "A lanternfish's little light on its stalk. It goes on glowing a while, pale green." },
  eel_skin: { name: 'Ice Eel Skin', price: 610, kind: 'loot', desc: 'A strip of eel skin, glass-smooth and colder than the hand that holds it.' },
  brine_crystal: { name: 'Brine Crystal', price: 630, kind: 'loot', desc: 'A lump of salt-white crystal from a brine slug\'s trail. It tastes of the sea, if you lick it. Don\'t.' },
  skate_wing: { name: 'Skate Wing', price: 650, kind: 'loot', desc: 'The tip of an ice skate\'s wing, thin and grey-green, rippling at the edge.' },
  narwhal_ivory: { name: 'Narwhal Ivory', price: 760, kind: 'loot', desc: "A spiral sliver of the Old Narwhal's tusk, worn smooth. Hold it to your ear and it hums, very low." },
  bonecarver_knife: { name: "Bone-Carver's Saber", price: 64000, lvl: 58, aim: 60, kind: 'sword', atk: 109, reach: 52, desc: "A curved saber with a whalebone hilt Hakon carved himself: a seal on one side, a whale on the other." },
  sealskin_hood: { name: 'Sealskin Hood', price: 50000, lvl: 58, aim: 60, kind: 'helmet', def: 48, desc: 'A snug grey hood of sealskin, oiled against the spray, with a fringe of white fur round the face.' },
  bonecrab_helm: { name: 'Whalebone Helm', price: 140000, lvl: 63, kind: 'helmet', def: 52, desc: "A whalebone crab's borrowed bit of skull, cleaned and lined. It was a whale's, then a crab's, now yours." },
  ivory_cutlass: { name: 'Ivory Cutlass', price: 200000, lvl: 67, kind: 'sword', atk: 120, reach: 54, desc: "A heavy cutlass with a blade of polished walrus ivory. The walrus had more." },
  angler_lamp: { name: "Angler's Lamp", price: 168000, lvl: 71, kind: 'helmet', def: 56, desc: 'A hood with a lanternfish\'s green light on a stalk over your brow. Things in the dark come to look at it.' },
  narwhal_tusk: { name: 'Narwhal Tusk', price: 238000, lvl: 72, slots: 9, kind: 'sword', atk: 125, reach: 62, desc: "A long spiral lance of the Old Narwhal's ivory, the tip still frosted. She grows it back; she has done it before." },
  floe_crown: { name: 'Floe Crown', price: 176000, lvl: 72, slots: 9, kind: 'helmet', def: 57, desc: 'A ring of sea ice that never melts, points standing up like the floes she held shut. It hums a long, low note.' },
  skate_blade: { name: 'Skate Wing Blade', price: 268000, lvl: 77, kind: 'sword', atk: 131, reach: 58, desc: "A wide, thin blade like a skate's wing, grey-green and rippling at the edge. It slips round things." },
  // Frostpeak's depth pass F3: the Aurora Heights and the Blue Halls (docs/places/heights.md, docs/places/bluehalls.md)
  ptarmigan_feather: { name: 'Ptarmigan Feather', price: 640, kind: 'loot', desc: 'A small white feather, so white it looks blue in the shade. The bird it came off is nowhere to be seen.' },
  fox_brush: { name: 'Snow Fox Brush', price: 650, kind: 'loot', desc: 'The white tip of a snow fox\'s tail, soft as smoke. It still smells faintly of snow.' },
  eagle_quill: { name: 'Rime Eagle Quill', price: 680, kind: 'loot', desc: 'A long grey flight feather with frost along every barb. It was a long way up.' },
  bottled_aurora: { name: 'Bottled Aurora', price: 700, kind: 'loot', desc: 'A little of an aurora jelly\'s light in a stoppered bottle, green going to violet. It fades by morning, slowly.' },
  qiviut: { name: 'Qiviut', price: 730, kind: 'loot', desc: 'The soft under-wool a musk ox sheds in spring. Warmer than anything Runa has ever knitted, she says, crossly.' },
  star_spark: { name: 'Star Spark', price: 750, kind: 'loot', desc: 'A chip of a lost star, still faintly warm. It points, very slightly, at the sky.' },
  pale_scale: { name: 'Pale Wyrm Scale', price: 840, kind: 'loot', desc: 'A thin scale like frosted glass with a dim star inside it. Hold it up and it brightens a little, then forgets to.' },
  bat_wing: { name: 'Icicle Bat Wing', price: 680, kind: 'loot', desc: 'A thin wing of grey skin with icicles along its fingers. It rattles when it folds.' },
  worm_glass: { name: 'Worm Glass', price: 700, kind: 'loot', desc: 'A bead of ice an ice worm has chewed so smooth it looks like glass. Ice worms chew a lot of them.' },
  glass_shell: { name: 'Glass Beetle Shell', price: 730, kind: 'loot', desc: 'A wing case of clear blue ice, light as paper. You can read through it, if the writing is big.' },
  prism_shard: { name: 'Prism Shard', price: 750, kind: 'loot', desc: 'A splinter off a prism crawler\'s back. Hold it to the light and it throws a little blue line on the wall.' },
  troll_tooth: { name: "Hall Troll's Tooth", price: 820, kind: 'loot', desc: 'A blue-grey tooth the size of a fist, worn flat from chewing ice. It grows another.' },
  foxfire_blade: { name: 'Foxfire Blade', price: 283000, lvl: 79, kind: 'sword', atk: 134, reach: 58, desc: 'A slim white blade with a snow fox\'s brush at the grip. A flicker of green runs along its edge, like the lights.' },
  muskox_helm: { name: 'Musk Ox Helm', price: 264000, lvl: 87, kind: 'helmet', def: 66, desc: 'A boss of musk ox horn across the brow, the qiviut lining as warm as a hearth. Put your head down and walk into the wind.' },
  pale_star_blade: { name: 'Pale Star Blade', price: 378000, lvl: 91, kind: 'sword', atk: 148, reach: 64, desc: 'A long blade of frosted starglass with a dim star caught in it near the tip. It gets a little brighter every time you lift it.' },
  aurora_crown: { name: 'Aurora Crown', price: 289000, lvl: 91, kind: 'helmet', def: 69, desc: 'A thin circlet of starglass with the aurora moving in it, green to violet. It is very quiet to wear.' },
  beetle_helm: { name: 'Glass Beetle Helm', price: 264000, lvl: 87, kind: 'helmet', def: 66, desc: 'A glass beetle\'s wing cases of clear blue ice, made into a helm. Everything looks a little bluer from inside.' },
  prism_blade: { name: 'Prism Blade', price: 361000, lvl: 89, kind: 'sword', atk: 145, reach: 58, desc: 'A three-sided blade of clear ice that splits the light into a fan of blue along its edge. It never melts.' },
  troll_maul: { name: "Hall Troll's Maul", price: 361000, lvl: 89, kind: 'sword', atk: 145, reach: 62, desc: 'A block of glacier ice the troll cut for itself, on a whole pine trunk. Heavy. Very heavy. You get used to it.' },
  troll_helm: { name: 'Troll-Ice Helm', price: 276000, lvl: 89, kind: 'helmet', def: 67, desc: 'A lump of blue ice the Hall Troll hollowed out like a pot, worn upside down. It fits better than it should.' },
  // Frostpeak's depth pass F4: the Queen's Bridge (docs/places/queensbridge.md)
  puffin_beak: { name: 'Rime Puffin Beak', price: 660, kind: 'loot', desc: 'A puffin\'s bright striped beak, frosted at the tip. They shed them every winter and grow a duller one.' },
  harrier_talon: { name: 'Sleet Harrier Talon', price: 690, kind: 'loot', desc: 'A hooked grey talon with ice in the curl of it. It has held on to things in a gale.' },
  rime_buckle: { name: 'Frozen Buckle', price: 720, kind: 'loot', desc: 'A guard\'s belt buckle in old silver, the Queen\'s crown on it, frozen solid to a scrap of leather.' },
  bottled_hoarfrost: { name: 'Bottled Hoarfrost', price: 740, kind: 'loot', desc: 'A little of a hoarfrost shade in a stoppered bottle. The glass grows feathers of frost on the inside.' },
  seal_whisker: { name: 'Leopard Seal Whisker', price: 760, kind: 'loot', desc: 'A long stiff whisker, pale and beaded. It twitches when the ice under you creaks.' },
  ice_arrowhead: { name: 'Ice Arrowhead', price: 790, kind: 'loot', desc: 'The head of a rime archer\'s javelin, clear blue and sharp as the day it was frozen.' },
  seam_ice: { name: 'Seam Ice', price: 860, kind: 'loot', desc: 'A chip of the ice Sigrun freezes into the crack every night. It is the coldest thing you have ever held, and it does not melt.' },
  rimeguard_helm: { name: 'Rimeguard Helm', price: 295000, lvl: 92, kind: 'helmet', def: 69, desc: 'A guard\'s round helm of silver gone white with rime, the Queen\'s crown on the brow. It is warmer inside than it looks.' },
  rimeguard_blade: { name: 'Rimeguard Blade', price: 449000, lvl: 99, kind: 'sword', atk: 156, reach: 60, desc: 'A guard\'s straight sword, its edge frozen sharper than any smith could hone it. It was worn at a post nobody came to relieve.' },
  oath_blade: { name: 'Shield-Oath Spear', price: 477000, lvl: 102, slots: 9, kind: 'sword', atk: 160, reach: 66, desc: "Sigrun's spear, its head a long leaf of blue ice that she sharpens on the bridge every night. It has never once been lowered." },
  sigrun_helm: { name: "Sigrun's Helm", price: 364000, lvl: 102, slots: 9, kind: 'helmet', def: 75, desc: 'A tall winged helm of rimed silver and clear ice, a crown worked small on the brow: not hers, her queen\'s.' },
  warden_helm: { name: 'Wardenstone Helm', price: 134000, lvl: 62, slots: 9, kind: 'helmet', def: 51, desc: "A Keeper guardian's stone helm with a crown of living roots. Wear it and you stand up very straight." },
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
  // ——— staves (S1, story/progression.md): MAGIC on the same frozen curve as their twin sword's ATK, the same
  // price, a little MP. Equipped, the normal attack is a staff bolt (STAFF_BOLT_*). Art: src/staff-art.js.
  wood_staff: { name: 'Twig Staff', price: 60, kind: 'staff', magic: 5, mp: 3, reach: 14, twin: 'wood_sword', desc: 'A practice staff, a bent stick with a spark caught in the knot. Fires little bolts.' },
  iron_staff: { name: 'Apprentice Staff', price: 450, kind: 'staff', magic: 12, mp: 7, reach: 22, twin: 'iron_sword', desc: 'A proper staff with an iron ring and a blue stone. Its bolts fly true.' },
  crystal_staff: { name: 'Crystal Staff', price: 2200, kind: 'staff', magic: 22, mp: 13, reach: 30, twin: 'crystal_sword', desc: 'A pink crystal on a pale shaft. It hums when you think hard.' },
  spore_staff: { name: 'Sporecap Staff', price: 3000, kind: 'staff', magic: 18, mp: 11, reach: 24, twin: 'spore_blade', desc: 'Grown from Mother Mushroom\'s stalk, with her spotted cap on top. Puffs spores when it casts.' },
  thorn_staff: { name: 'Briar Staff', price: 9000, kind: 'staff', magic: 32, mp: 19, reach: 36, twin: 'thorn_sword', desc: 'A twist of the Bramble Behemoth\'s briar, a red thornberry glowing in its crook.' },
  frost_staff: { name: 'Icicle Staff (Legacy)', legacy: true, price: 15000, kind: 'staff', magic: 44, mp: 26, reach: 38, twin: 'frost_blade', desc: 'Glacia\'s sceptre: a shaft of blue ice that never melts, crowned with a snowflake.' },
  frost_staff_n: { name: 'Icicle Staff', lvl: 47, art: 'frost_staff', price: 110000, kind: 'staff', magic: 93, mp: 56, reach: 38, twin: 'frost_blade_n', desc: 'Glacia\'s sceptre: a shaft of blue ice that never melts, crowned with a snowflake.' },
  star_staff: { name: 'Starforged Staff (Legacy)', legacy: true, price: 40000, kind: 'staff', magic: 62, mp: 37, reach: 44, twin: 'star_sword', desc: 'A fallen star set on a silver rod. It leaves sparkles in the air behind each bolt.' },
  star_staff_n: { name: 'Starforged Staff', lvl: 57, art: 'star_staff', price: 210000, kind: 'staff', magic: 108, mp: 65, reach: 44, twin: 'star_sword_n', desc: 'A fallen star set on a silver rod. It leaves sparkles in the air behind each bolt.' },
  magma_staff: { name: 'Magma Sceptre (Legacy)', legacy: true, price: 60000, slots: 9, kind: 'staff', magic: 78, mp: 47, reach: 46, twin: 'magma_maul', desc: 'A rod of black rock with Ignis\'s molten heart in the top. Warm to hold, very warm to be hit by.' },
  magma_staff_n: { name: 'Magma Sceptre', lvl: 99, art: 'magma_staff', price: 470000, slots: 9, kind: 'staff', magic: 156, mp: 94, reach: 46, twin: 'magma_maul_n', desc: 'A rod of black rock with Ignis\'s molten heart in the top. Warm to hold, very warm to be hit by.' },
  phoenix_staff: { name: 'Phoenix Feather Staff (Legacy)', legacy: true, price: 90000, slots: 9, kind: 'staff', magic: 92, mp: 55, reach: 48, twin: 'phoenix_blade', desc: 'Pyra\'s flame-feathers bound to a golden rod. It never stops burning.' },
  phoenix_staff_n: { name: 'Phoenix Feather Staff', lvl: 110, art: 'phoenix_staff', price: 530000, slots: 9, kind: 'staff', magic: 168, mp: 101, reach: 48, twin: 'phoenix_blade_n', desc: 'Pyra\'s flame-feathers bound to a golden rod. It never stops burning.' },
  cog_staff: { name: 'Cogwork Staff (Legacy)', legacy: true, price: 150000, slots: 10, kind: 'staff', magic: 112, mp: 67, reach: 52, twin: 'cog_cleaver', desc: 'A brass staff with a turning gear for a head, from the Colossus. It ticks while it thinks.' },
  cog_staff_n: { name: 'Cogwork Staff', lvl: 150, art: 'cog_staff', price: 970000, slots: 10, kind: 'staff', magic: 208, mp: 125, reach: 52, twin: 'cog_cleaver_n', desc: 'A brass staff with a turning gear for a head, from the Colossus. It ticks while it thinks.' },
  chrono_staff: { name: 'Hourglass Sceptre (Legacy)', legacy: true, price: 300000, slots: 10, kind: 'staff', magic: 135, mp: 81, reach: 56, twin: 'chrono_blade', desc: 'Chronos\'s hourglass on a rod of clock-brass. The sand runs up.' },
  chrono_staff_n: { name: 'Hourglass Sceptre', lvl: 170, art: 'chrono_staff', price: 1400000, slots: 10, kind: 'staff', magic: 227, mp: 136, reach: 56, twin: 'chrono_blade_n', desc: 'Chronos\'s hourglass on a rod of clock-brass. The sand runs up.' },
  reed_staff: { name: 'Cattail Staff', price: 900, lvl: 8, aim: 9, kind: 'staff', magic: 19, mp: 11, reach: 30, twin: 'reed_rapier', desc: 'A tall bundle of river reeds with a cattail head, plaited at Willowmere Mill.' },
  drift_staff: { name: 'Driftwood Staff', price: 7000, lvl: 16, aim: 18, kind: 'staff', magic: 40, mp: 24, reach: 36, twin: 'drift_cutlass', desc: 'Sea-bleached driftwood with a ball of bright sea glass caught in its roots.' },
  tide_staff: { name: 'Tidemother\'s Coral Staff', price: 36000, lvl: 26, slots: 8, kind: 'staff', magic: 64, mp: 38, reach: 46, twin: 'tide_claw', desc: 'A branch of the Tidemother\'s pink coral with a pearl in its fork. It smells of the sea.' },
  glowcap_staff: { name: 'Glowcap Staff', price: 16000, lvl: 24, aim: 26, kind: 'staff', magic: 58, mp: 35, reach: 42, twin: 'rootwood_saber', desc: 'A rootwood staff with a glowing blue mushroom on top. Truffle swears it reads in the dark.' },
  knot_staff: { name: 'Knotroot Staff', price: 52000, lvl: 37, slots: 8, kind: 'staff', magic: 79, mp: 47, reach: 48, twin: 'burrow_claw', desc: 'A root the Knotmole tied in a perfect knot, with a gold light in the middle of it.' },
  oak_staff: { name: 'Oakbranch Staff', price: 21000, lvl: 30, aim: 32, kind: 'staff', magic: 70, mp: 42, reach: 44, twin: 'ranger_billhook', desc: 'A living oak branch, still in leaf, with an acorn at the tip. Ranger Acorn cut it herself.' },
  honey_staff: { name: 'Honeycomb Sceptre', price: 56000, lvl: 39, kind: 'staff', magic: 82, mp: 49, reach: 50, twin: 'queen_stinger', desc: 'The Hornet Queen\'s sceptre: a ball of golden comb on a black and amber rod. It drips.' },
  bosun_staff: { name: 'Bosun\'s Lantern Pole', price: 74000, lvl: 41, kind: 'staff', magic: 85, mp: 51, reach: 52, twin: 'bosun_hook', desc: 'The Bosun\'s ship lantern on an oak pole, still lit with a cold green flame after all these years.' },
  sentinel_staff: { name: 'Sentinel Staff', price: 126000, lvl: 53, kind: 'staff', magic: 102, mp: 61, reach: 54, twin: 'sentinel_blade', desc: "A Keeper sentinel's grey stone rod, its amber eye-stone set in the head. It looks where you're looking." },
  warden_staff: { name: "Warden's Rootstaff", price: 175000, lvl: 62, slots: 9, kind: 'staff', magic: 114, mp: 68, reach: 58, twin: 'warden_blade', desc: 'A Keeper staff of grey stone wound with roots, the Warden\'s amber light in its crook. It has been waiting a long time.' },
  glacier_staff: { name: 'Glacier Staff', price: 80000, lvl: 64, aim: 66, kind: 'staff', magic: 117, mp: 70, reach: 52, twin: 'cutter_cleaver', desc: 'A blackened driftwood staff with a lump of blue glacier ice in its head that never melts. Eyvind cut the ice; Skaldi carved the wood.' },
  howl_staff: { name: 'Howling Staff', price: 209000, lvl: 68, kind: 'staff', magic: 121, mp: 72, reach: 54, twin: 'rimefang', desc: 'A grey staff bound in rime wolf pelt, a white fang at its tip. Its bolts howl on the way out.' },
  tusk_staff: { name: 'Rimehorn Staff', price: 262000, lvl: 76, kind: 'staff', magic: 130, mp: 78, reach: 60, twin: 'tusk_blade', desc: "A curved staff of old mammoth ivory wound with red-brown wool, frost flowers growing up it as you cast." },
  driftbone_staff: { name: 'Driftbone Staff', price: 64000, lvl: 58, aim: 60, kind: 'staff', magic: 109, mp: 65, reach: 52, twin: 'bonecarver_knife', desc: 'A staff of sea-bleached whalebone, a ring of seals carved round its head chasing each other forever.' },
  // Forgehold's traders (atlas Phase 5): Slag's heavy forge gear, aimed at the island's start, and Auntie
  // Soot's eggs, boiled in the hottest spring
  slag_maul: { name: 'Slag Maul', price: 156000, lvl: 88, aim: 92, kind: 'sword', atk: 144, reach: 54, desc: 'Black slag on an iron haft, hammered from the scrap of a gear-tooth. Forged for a wheel that never got it.' },
  bellows_rod: { name: 'Bellows Rod', price: 156000, lvl: 88, aim: 92, kind: 'staff', magic: 144, mp: 86, reach: 54, twin: 'slag_maul', desc: "An iron poker from the great forge, a coal that won't go out caught in its cage." },
  smith_cap: { name: "Smith's Iron Cap", price: 123000, lvl: 88, aim: 92, kind: 'helmet', def: 66, desc: 'Riveted iron with a leather flap against the sparks. Heavy. Forgehold folk nap in them.' },
  spring_egg: { name: 'Spring-Boiled Egg', price: 600, kind: 'potion', heal: 500, desc: "Boiled in Auntie Soot's hottest pool. Still warm. Restores 500 HP." },
  ivory_staff: { name: 'Walrus Ivory Staff', price: 200000, lvl: 67, kind: 'staff', magic: 120, mp: 72, reach: 54, twin: 'ivory_cutlass', desc: "A walrus tusk on a driftwood shaft, whiskers bound round the grip. It barks, a bit, when you cast." },
  narwhal_staff: { name: 'Narwhal Song Staff', price: 238000, lvl: 72, slots: 9, kind: 'staff', magic: 125, mp: 75, reach: 62, twin: 'narwhal_tusk', desc: "A twist of the Old Narwhal's ivory with sea ice at its head. Its bolts sing, low and long, like something calling a pod home." },
  skate_staff: { name: 'Skate Staff', price: 268000, lvl: 77, kind: 'staff', magic: 131, mp: 79, reach: 58, twin: 'skate_blade', desc: "A pale staff with an ice skate's wing for a head, rippling as if it were still swimming." },
  foxfire_staff: { name: 'Foxfire Staff', price: 283000, lvl: 79, kind: 'staff', magic: 134, mp: 80, reach: 58, twin: 'foxfire_blade', desc: 'A white birch staff with a fox\'s brush bound under its head and a green flame that dances in it without burning.' },
  pale_star_staff: { name: 'Pale Star Staff', price: 378000, lvl: 91, kind: 'staff', magic: 148, mp: 89, reach: 64, twin: 'pale_star_blade', desc: 'A staff of starglass with a dim star at its head. Its bolts fall instead of fly, softly, the way stars did.' },
  prism_staff: { name: 'Prism Staff', price: 361000, lvl: 89, kind: 'staff', magic: 145, mp: 87, reach: 58, twin: 'prism_blade', desc: 'A rod of clear blue ice with a prism at its head. Its bolts come out as three and meet again on the way.' },
  troll_staff: { name: 'Troll-Ice Staff', price: 361000, lvl: 89, kind: 'staff', magic: 145, mp: 87, reach: 62, twin: 'troll_maul', desc: 'A pine trunk with a lump of the troll\'s blue ice wedged in its fork. The ice hums when you cast, very low.' },
  rimeguard_staff: { name: 'Rimeguard Staff', price: 449000, lvl: 99, kind: 'staff', magic: 156, mp: 94, reach: 60, twin: 'rimeguard_blade', desc: 'A guard\'s pike cut down to a staff, the Queen\'s crown on its silver ferrule. Its bolts fly straight, as if on watch.' },
  oath_staff: { name: 'Shield-Oath Staff', price: 477000, lvl: 102, slots: 9, kind: 'staff', magic: 160, mp: 96, reach: 66, twin: 'oath_blade', desc: "Sigrun's spear-shaft with a round boss of ice for a head, like a little shield. Its bolts hold where they land." },
  hart_staff: { name: 'Hart\'s Antler Staff', price: 156000, lvl: 59, kind: 'staff', magic: 110, mp: 66, reach: 56, twin: 'briarheart_blade', desc: 'A shed antler of the Thorn Hart on a briar shaft. A white rose buds between the tines and never opens.' },
  // ——— enhancement scrolls (boss drops): see SCROLL rules below ———
  scroll_s100: { name: 'Weapon Scroll 100%', price: 300, kind: 'scroll', slot: 'weapon', rate: 1, atk: 1, magic: 1, desc: 'Always works: +1 ATK and +1 MAGIC on a weapon (a staff gets them the other way round).' },
  scroll_s60: { name: 'Weapon Scroll 60%', price: 1500, kind: 'scroll', slot: 'weapon', rate: 0.6, atk: 3, magic: 2, desc: '60% chance: +3 ATK and +2 MAGIC on a weapon (a staff gets them the other way round).' },
  scroll_s10: { name: 'Weapon Scroll 10%', price: 6000, kind: 'scroll', slot: 'weapon', rate: 0.1, atk: 7, magic: 5, desc: '10% chance: +7 ATK and +5 MAGIC on a weapon (a staff gets them the other way round).' },
  scroll_s30: { name: 'Dark Weapon Scroll 30%', price: 4000, kind: 'scroll', slot: 'weapon', rate: 0.3, atk: 6, magic: 4, dark: 0.5, desc: '30% chance: +6 ATK and +4 MAGIC on a weapon (a staff gets them the other way round). If it fails, a 50% chance the weapon is DESTROYED.' },
  scroll_h100: { name: 'Helmet Scroll 100%', price: 300, kind: 'scroll', slot: 'helmet', rate: 1, def: 1, hp: 10, desc: 'Always works: +1 DEF and +10 max HP on a helmet.' },
  scroll_h60: { name: 'Helmet Scroll 60%', price: 1500, kind: 'scroll', slot: 'helmet', rate: 0.6, def: 2, hp: 30, desc: '60% chance: +2 DEF and +30 max HP on a helmet.' },
  scroll_h10: { name: 'Helmet Scroll 10%', price: 6000, kind: 'scroll', slot: 'helmet', rate: 0.1, def: 5, hp: 80, desc: '10% chance: +5 DEF and +80 max HP on a helmet.' },
  scroll_h30: { name: 'Dark Helmet Scroll 30%', price: 4000, kind: 'scroll', slot: 'helmet', rate: 0.3, def: 4, hp: 60, dark: 0.5, desc: '30% chance: +4 DEF and +60 max HP on a helmet. If it fails, a 50% chance the helmet is DESTROYED.' },
  scroll_chaos: { name: 'Chaos Scroll 60%', price: 5000, kind: 'scroll', slot: 'any', rate: 0.6, chaos: true, desc: "60% chance to reroll the item's bonuses wildly: each one changes by -3 to +5 (HP by ten times that). Weapons or helmets." },
};
// ——— bows (S4, story/progression.md 4): the Archer's weapon. Every staff's twin sword has a bow twin too, made
// here from the sword so they can never drift apart: the same price, `lvl`, `aim`, slots, ATK and reach (the
// reach adds to the arrow's range, BOW_RANGE). Equipped, the normal attack is a bow shot (BOW_SHOT_*). The
// raised legacy pairs only get a bow for their `_n` copy: nobody ever owned a legacy bow. Art: src/bow-art.js.
// [id, twin sword, name, description]
const BOW_LIST = [
  ['wood_bow', 'wood_sword', 'Practice Bow', 'A bent hazel stick and a bit of string. The arrows mostly go where you look.'],
  ['iron_bow', 'iron_sword', "Hunter's Bow", 'A proper ash bow with an iron-capped grip. Pulls smooth, shoots straight.'],
  ['crystal_bow', 'crystal_sword', 'Crystal Bow', 'Pale wood tipped with pink crystal at both ends. Its arrows leave a faint shimmer.'],
  ['spore_bow', 'spore_blade', 'Sporecap Bow', "Grown from Mother Mushroom's stalk, a spotted cap on each tip. Every arrow puffs a little cloud."],
  ['thorn_bow', 'thorn_sword', 'Briar Bow', "A curve of the Bramble Behemoth's briar, strung with thornvine. Don't hold it by the wrong end."],
  ['frost_bow', 'frost_blade_n', 'Icicle Bow', "Glacia's bow: a curve of blue ice that never melts, strung with frost."],
  ['star_bow', 'star_sword_n', 'Starforged Bow', 'Silver limbs with a fallen star in the grip. Its arrows streak like shooting stars.'],
  ['magma_bow', 'magma_maul_n', 'Magma Bow', "Black rock limbs with Ignis's molten heart in the grip. Its arrows glow orange all the way there."],
  ['phoenix_bow', 'phoenix_blade_n', 'Phoenix Feather Bow', "Pyra's flame-feathers along a golden bow. The string never cools."],
  ['cog_bow', 'cog_cleaver_n', 'Cogwork Bow', "A brass bow from the Colossus with a little gear that winds the string for you. It ticks."],
  ['chrono_bow', 'chrono_blade_n', 'Hourglass Bow', "Clock-brass limbs round Chronos's hourglass. Its arrows seem to land a moment before you loose them."],
  ['reed_bow', 'reed_rapier', 'Reed Bow', 'Bundled river reeds bound with mill twine. Light, springy and a bit damp.'],
  ['drift_bow', 'drift_cutlass', 'Driftwood Bow', 'Sea-bleached driftwood strung with fishing line, a bead of sea glass on each tip.'],
  ['tide_bow', 'tide_claw', "Tidemother's Coral Bow", "A curve of the Tidemother's pink coral strung with kelp, a pearl in the grip. It smells of the sea."],
  ['glowcap_bow', 'rootwood_saber', 'Glowcap Bow', "Rootwood limbs with a little blue glowcap on each tip. Truffle says it's for shooting in the dark."],
  ['knot_bow', 'burrow_claw', 'Knotroot Bow', 'A root the Knotmole bent into a perfect curve, a gold light caught in the knot at its grip.'],
  ['oak_bow', 'ranger_billhook', "Ranger's Longbow", "Acorn's own make: a tall oak longbow, still in leaf at the tips. She'll show you how to hold it."],
  ['honey_bow', 'queen_stinger', "Hornet Queen's Bow", 'Black and amber limbs with comb at the grip, strung with silk. Its arrows hum like wasps.'],
  ['bosun_bow', 'bosun_hook', "Bosun's Spar Bow", "Bent from the Brave Pippin's oak spars, a cold green lantern-flame in the grip."],
  ['hart_bow', 'briarheart_blade', "Hart's Antler Bow", "Two curves of the Thorn Hart's antler, joined at the grip and strung with briar."],
  ['sentinel_bow', 'sentinel_blade', 'Sentinel Bow', "Grey Keeper stone that bends when it shouldn't, an amber eye-stone in the grip. It looks where you're aiming."],
  ['warden_bow', 'warden_blade', "Warden's Rootbow", "Grey stone limbs wound with roots, the Warden's amber light in the grip. Old, patient and very strong."],
  ['glacier_bow', 'cutter_cleaver', 'Glacier Bow', 'Blackened driftwood with glacier ice set in the tips. Eyvind cut the ice; Skaldi bent the wood.'],
  ['howl_bow', 'rimefang', 'Howling Bow', 'Grey wood wrapped in rime wolf pelt, a fang on each tip. Its arrows howl on the way out.'],
  ['tusk_bow', 'tusk_blade', 'Rimehorn Bow', 'A curve of old mammoth ivory wound with red-brown wool. Frost flowers grow up it as you draw.'],
  ['driftbone_bow', 'bonecarver_knife', 'Driftbone Bow', 'Sea-bleached whalebone, a ring of carved seals chasing each other round the grip forever.'],
  ['ivory_bow', 'ivory_cutlass', 'Walrus Ivory Bow', 'Two walrus tusks on a driftwood grip, whiskers bound round it. It barks, a bit, when you loose.'],
  ['narwhal_bow', 'narwhal_tusk', 'Narwhal Song Bow', "A twist of the Old Narwhal's ivory strung with sea ice. Its arrows sing, low and long."],
  ['skate_bow', 'skate_blade', 'Skate Wing Bow', "A pale bow shaped like an ice skate's wings, rippling as if it were still swimming."],
  ['foxfire_bow', 'foxfire_blade', 'Foxfire Bow', "White birch with a fox's brush at the grip and a green flame running along the string."],
  ['pale_star_bow', 'pale_star_blade', 'Pale Star Bow', 'Starglass limbs with a dim star in the grip. Its arrows fall softly, the way stars did.'],
  ['prism_bow', 'prism_blade', 'Prism Bow', 'Clear blue ice with a prism at the grip. Its arrows split into three colours and meet again on the mob.'],
  ['troll_bow', 'troll_maul', 'Troll-Ice Bow', "A bent pine trunk with a lump of the troll's blue ice wedged in the grip. Very heavy. Very strong."],
  ['rimeguard_bow', 'rimeguard_blade', 'Rimeguard Bow', "A guard's longbow, the Queen's crown on its silver grip. Its arrows fly straight, as if on watch."],
  ['oath_bow', 'oath_blade', 'Shield-Oath Bow', 'A war bow with a little shield on its grip and an oath carved down its back. It has never broken one.'],
  ['spring_bow', 'slag_maul', 'Ironspring Bow', 'Two leaf-springs off an old forge bellows, riveted together and strung with wire. Forged for a wheel that never got it.'],
];
for (const [id, twin, name, desc] of BOW_LIST) {
  const sw = ITEMS[twin];
  ITEMS[id] = { name, price: sw.price, ...(sw.lvl ? { lvl: sw.lvl } : {}), ...(sw.aim ? { aim: sw.aim } : {}), ...(sw.slots ? { slots: sw.slots } : {}), kind: 'bow', atk: sw.atk, reach: sw.reach, twin, desc };
}
export const STACKS = (id) => ['coin', 'potion', 'loot', 'scroll'].includes(ITEMS[id]?.kind);
// The weapon slot (gear.weapon) holds any of these; the kind decides the normal attack (S1: a sword swings,
// a staff fires a bolt; S4: a bow shoots an arrow). A class wields one kind (CLASSES in skills.js).
export const WEAPON_KINDS = ['sword', 'staff', 'bow'];
export const isWeapon = (id) => WEAPON_KINDS.includes(ITEMS[id]?.kind);
export const isGear = (id) => isWeapon(id) || ITEMS[id]?.kind === 'helmet';
export const gearSlotOf = (id) => (isWeapon(id) ? 'weapon' : ITEMS[id]?.kind === 'helmet' ? 'helmet' : null);
export const weaponKind = (id) => (isWeapon(id) ? ITEMS[id].kind : null);
// A sword's staff twin: wherever the sword drops, its twin may drop instead (server/rpg.js picks by what the
// fighters are holding, plus STAFF_OFFKIND so everyone sees both)
// The rebalance (R, story/world/island-depth.md): an item with `art` is drawn as that item (a scaled
// copy, `<id>_n`, looks exactly like its legacy original). Every art lookup by id goes through artOf.
export const artOf = (id) => ITEMS[id]?.art ?? id;
export const STAFF_OF = Object.fromEntries(Object.entries(ITEMS).filter(([, it]) => it.kind === 'staff' && it.twin).map(([id, it]) => [it.twin, id]));
// and its bow twin (S4): a drop can be any of the three (server/rpg.js twinPick)
export const BOW_OF = Object.fromEntries(Object.entries(ITEMS).filter(([, it]) => it.kind === 'bow' && it.twin).map(([id, it]) => [it.twin, id]));
export const STAFF_OFFKIND = 0.2;
// The staff bolt (a staff's normal attack): reach STAFF_BOLT_RANGE plus the staff's own reach, damage
// STAFF_BOLT_MULT of MAGIC (less than a swing hits for: range is paid for), flying STAFF_BOLT_SPEED px/s
export const STAFF_BOLT_RANGE = 170;
export const STAFF_BOLT_MULT = 0.7;
export const STAFF_BOLT_SPEED = 1100;
// The bow shot (a bow's normal attack, S4): an arrow to the first mob ahead within BOW_RANGE plus the bow's
// reach (and Keen Eye's), BOW_SHOT_MULT of ATK (less than a swing: range is paid for), at BOW_SHOT_SPEED px/s
export const BOW_RANGE = 250;
export const BOW_SHOT_MULT = 0.75;
export const BOW_SHOT_SPEED = 1400;

// ——— enhancement (MapleStory style) ———
// Every sword and helmet has a number of upgrade slots (ITEMS.slots, else DEFAULT_SLOTS). Each scroll
// used on it takes one slot whether it works or not, and nothing ever gives a slot back. A piece of gear
// carries its own enhancement e = { u: slots used, s: successes, atk, magic, def, hp } (bag entries and
// the worn gear keep it with them). Dark scrolls can destroy the item when they fail.
export const DEFAULT_SLOTS = { sword: 7, staff: 7, bow: 7, helmet: 7 };
export const slotsOf = (id) => ITEMS[id]?.slots ?? DEFAULT_SLOTS[ITEMS[id]?.kind] ?? 0;
export const canScroll = (scrollId, itemId) => {
  const sc = ITEMS[scrollId], it = ITEMS[itemId];
  return sc?.kind === 'scroll' && isGear(itemId) && (sc.slot === 'any' || sc.slot === gearSlotOf(itemId));
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
    if (kind !== 'helmet') {
      next.atk = Math.max(0, next.atk + d());
      next.magic = Math.max(0, next.magic + d());
    } else {
      next.def = Math.max(0, next.def + d());
      next.hp = Math.max(0, next.hp + d() * 10);
    }
  } else {
    // a weapon scroll's main stat follows the weapon: on a staff its ATK and MAGIC swap round
    const add = kind === 'staff' ? { ...sc, atk: sc.magic, magic: sc.atk } : sc;
    for (const k of ['atk', 'magic', 'def', 'hp']) next[k] += add[k] ?? 0;
  }
  return { ok: true, boom: false, e: next };
}
export const BAG_SLOTS = 24;

// ——— gold and the shop (Merchant Pip's stall in the village) ———
// Buying costs `price`; selling gives back SELL_RATE of it (loot materials exist mostly to be sold).
export const SHOP_X = 2780;
export const SHOP_RANGE = 120;
export const SELL_RATE = 0.4;
export const SHOP_STOCK = ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'mega_elixir', 'wood_sword', 'iron_sword', 'crystal_sword', 'wood_staff', 'iron_staff', 'crystal_staff', 'wood_bow', 'iron_bow', 'crystal_bow', 'leaf_cap', 'mush_helm', 'iron_helm'];
// Every shopkeeper: where they stand (room, x; you trade within SHOP_RANGE) and what they sell. Pip's has
// the Boutique too. Runa is also an AI character: her dialog has a Trade button (src/npc.js).
export const SHOPS = {
  pip: { name: "Merchant Pip's Shop", room: 0 /* the village */, x: SHOP_X, stock: SHOP_STOCK, boutique: true },
  runa: { name: "Runa's Net Shed", room: FJORD, x: RUNA_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'frostbloom', 'fur_hood_n', 'bone_harpoon_n'] },
  // the branches' traders (island depth: each branch sells the basic potions, so a deep branch isn't a walk
  // back to Pip, and a tier of gear for its middle levels)
  bun: { name: 'Willowmere Mill', room: WILLOWMERE, x: BUN_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'reed_rapier', 'reed_staff', 'reed_bow', 'miller_cap'] },
  moss: { name: "Moss's Driftwood Shack", room: COVES, x: MOSS_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'drift_cutlass', 'drift_staff', 'drift_bow', 'conch_helm'] },
  truffle: { name: "Truffle's Camp", room: MYCELIUM, x: TRUFFLE_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'mega_elixir', 'rootwood_saber', 'glowcap_staff', 'glowcap_bow', 'lantern_cap'] },
  acorn: { name: "Acorn's Treehouse", room: CANOPY, x: ACORN_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'mega_elixir', 'ranger_billhook', 'oak_staff', 'oak_bow', 'ranger_hood'] },
  // the Pet Shop: pet food only (the pets themselves are on plinths: furni-buy, src/petshop.js)
  eyvind: { name: "The Cutters' Hut", room: GLACIER, x: EYVIND_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'mega_elixir', 'cutter_cleaver', 'glacier_staff', 'glacier_bow', 'cutter_cap'] },
  hakon: { name: 'The Whaling Hut', room: SKERRIES, x: HAKON_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'mega_elixir', 'bonecarver_knife', 'driftbone_staff', 'driftbone_bow', 'sealskin_hood'] },
  // Forgehold (atlas Phase 5): Auntie Soot's potions and eggs at the springs, Slag's forge gear
  soot: { name: "Auntie Soot's Springs", room: FORGEHOLD, x: SOOT_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'mega_elixir', 'spring_egg'] },
  slag: { name: "Slag's Stack", room: FORGEHOLD, x: SLAG_X, stock: ['red_jelly', 'blue_jelly', 'mana_jelly', 'elixir', 'mega_elixir', 'slag_maul', 'bellows_rod', 'spring_bow', 'smith_cap'] },
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
// The levelling pace (L1, story/progression.md, owner 2026-10-23): about LEVEL_MIN(L) minutes of farming
// mobs at your own level (KILLS_PER_MIN kills a minute of the frozen curve's EXP) for level L, slowing as you
// get stronger: 0.5·L^0.65 up to Lv 100 (10 min there), then a tenth of a minute per level (20 min at Lv 200),
// and never faster than the old curve (12·L^1.7 + 8), which still sets the first dozen levels. The balance
// sheet checks the real pace against LEVEL_MIN within LEVEL_PACE.
export const KILLS_PER_MIN = 6;
export const LEVEL_MIN = (lvl) => (lvl <= 100 ? 0.5 * lvl ** 0.65 : lvl / 10);
const oldExpToNext = (lvl) => Math.round(12 * lvl ** 1.7 + 8);
export const expToNext = (lvl) => Math.max(oldExpToNext(lvl), Math.round(LEVEL_MIN(lvl) * KILLS_PER_MIN * curve('exp', lvl)));
// Changing class at the Rebirth Pool (S2, story/progression.md L2, owner 2026-10-23): REBIRTH_HOURS of farming
// gold at your level (KILLS_PER_MIN kills of the frozen curve's gold), so it costs the same play time at any
// level. The first choice at Lv 10 is free. The balance sheet checks it against its own farming gold.
export const REBIRTH_HOURS = 1;
export const rebirthCost = (lvl) => Math.round((REBIRTH_HOURS * 60 * KILLS_PER_MIN * curve('gold', Math.max(1, lvl))) / 1000) * 1000;
export const attackFor = (lvl, weapon) => 4 + lvl * 2 + (ITEMS[weapon]?.atk ?? 0); // (a staff has no atk)
export const defenseFor = (helmet) => ITEMS[helmet]?.def ?? 0;
export const reachFor = (weapon) => ITEMS[weapon]?.reach ?? 0; // extra slap reach (a staff: extra bolt range; a bow: extra arrow range), px
export const HURT_INVULN_MS = 1200; // after a mob hits you
