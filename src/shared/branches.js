// Docs: docs/places/branches.md
// Each island's branches (story/world/island-depth.md; Greenhollow's, then Frostpeak's, then Emberdeep's: story/world/emberdeep-depth.md): the side areas off the main trail, each its own
// combat room once it ships. Until then the way in is there but blocked by something in the world (a
// node's `gate`: drawn by src/branch-gates.js, E shows what's wrong), never a "coming soon" sign. The
// island map (src/worldmap.js) draws this list as a graph: shipped places solid, the rest blocked.
// When a branch ships: give it its room(s), set `rooms`, remove its `gate` (and the block's art goes with
// it: the update itself lifts the block), give it an `entry` (the open way in, drawn where the gate was),
// and make its children's gates the next ones.
import { FIELD, STAGES, DENS, zoneAt, HIGHLANDS, FJORD, CALDERA, FORGEHOLD, SANDS_GATE_X, ASHWOOD, FOUNDRY_GATE_X, COAST_GATE_X, ASHWOOD_GATE_X, BRIMSTONE_GATE_X, BALLOON_X, GLACIER, GLACIER_GATE_X, BLUEHALLS_GATE_X, HEIGHTS_GATE_X, SKERRIES_GATE_X, BRIDGE_GATE_X, SKERRIES, GROTTO, GROTTO_GATE_X, HEIGHTS, BLUEHALLS, QBRIDGE, WILLOWMERE, WILLOWMERE_GATE_X, COVES, COVES_GATE_X, MYCELIUM, MYCELIUM_GATE_X, GLOWROOT, GLOWROOT_GATE_X, CANOPY, CANOPY_GATE_X, SPINE, SPINE_GATE_X, WRECK, WRECK_GATE_X, THORNHEART, THORN_GATE_X, SUNKEN, ROADSEND, SUNKEN_GATE_X, OLDICE, LONGSTAIR, OLDICE_GATE_X, BLACKSANDS, COAST, TUBES, TUBES_GATE_X } from './rpg.js';
import { VILLAGE, HARBOUR, CLIFFS } from './sim.js';

// at: where the node sits on the island map (map pixels, 720×380) · from: the node it branches off (an edge
// on the map) · band: its levels · hard: a hard pocket · rooms: the rooms that are it (shipped) · zone: a
// zone of a stage room (zr, FIELD when left out: the Wildwood) · gate: the blocked way in: { room, x, kind (the art), look (the prompt), says (on E) }
// · past: an unshipped place behind another one, with no gate of its own yet (`block` names why on the map)
// · entry: a shipped branch's way in, drawn by src/branch-gates.js: { room, x (its door), kind (the art) }
export const GREENHOLLOW = [
  { id: 'harbour', name: 'Harbour', at: [75, 205], rooms: [HARBOUR], town: true },
  { id: 'slimeville', name: 'Slimeville', at: [190, 205], from: 'harbour', town: true },
  { id: 'meadow', name: 'Sprout Meadow', band: '1–3', at: [305, 205], from: 'slimeville', zone: 0 },
  { id: 'grove', name: 'Mushroom Grove', band: '4–7', at: [420, 205], from: 'meadow', zone: 1 },
  { id: 'woods', name: 'Bramble Woods', band: '8–12', at: [535, 205], from: 'grove', zone: 2 },
  { id: 'cliffs', name: 'East Cliffs', at: [650, 205], from: 'woods', rooms: [CLIFFS] },
  { id: 'willowmere', name: 'Willowmere', band: '5–15', at: [305, 285], from: 'meadow', rooms: [WILLOWMERE], entry: { room: FIELD, x: WILLOWMERE_GATE_X, kind: 'bridge' } },
  { id: 'coves', name: 'Saltspray Coves', band: '10–25', at: [75, 285], from: 'harbour', rooms: [COVES], entry: { room: HARBOUR, x: COVES_GATE_X, kind: 'shore' } },
  { id: 'wreck', name: 'Wreck Cave', band: '30–40', hard: true, at: [75, 350], from: 'coves', rooms: [WRECK], entry: { room: COVES, x: WRECK_GATE_X, kind: 'flooded' } },
  { id: 'deep', name: 'Mycelium Deep', band: '15–35', at: [420, 285], from: 'grove', rooms: [MYCELIUM], entry: { room: FIELD, x: MYCELIUM_GATE_X, kind: 'stump' } },
  { id: 'glowroot', name: 'Glowroot Hollow', band: '40–50', hard: true, at: [420, 350], from: 'deep', rooms: [GLOWROOT], entry: { room: MYCELIUM, x: GLOWROOT_GATE_X, kind: 'crack' } },
  { id: 'canopy', name: 'Old Oak Canopy', band: '25–40', at: [535, 125], from: 'woods', rooms: [CANOPY], entry: { room: FIELD, x: CANOPY_GATE_X, kind: 'ladder' } },
  { id: 'spine', name: "Keeper's Spine", band: '45–60', at: [535, 55], from: 'canopy', rooms: [SPINE], entry: { room: CANOPY, x: SPINE_GATE_X, kind: 'trunk' } },
  { id: 'thornheart', name: 'Thornheart', band: '50–60', hard: true, at: [650, 285], from: 'woods', rooms: [THORNHEART], entry: { room: FIELD, x: THORN_GATE_X, kind: 'thorns' } },
  // FB1 (b): the deep room past the Thornheart and the approach to Ladon's den (one node: the Road's End is its end)
  { id: 'sunkenroad', name: 'Sunken Road', band: '55–60', hard: true, at: [650, 350], from: 'thornheart', rooms: [SUNKEN, ROADSEND], entry: { room: THORNHEART, x: SUNKEN_GATE_X, kind: 'rootsplit' } },
];
// Frostpeak (its depth pass, F0 on): the hamlet, the ridge and summit (the stage's two zones), and the
// branches. Says are under ~90 characters (the toast doesn't wrap)
export const FROSTPEAK = [
  { id: 'hamlet', name: 'Icefang Hamlet', at: [100, 215], rooms: [FJORD], town: true },
  { id: 'ridge', name: 'Frostpine Ridge', band: '40–46', at: [230, 215], from: 'hamlet', zone: 0, zr: HIGHLANDS },
  { id: 'summit', name: 'Starfall Summit', band: '47–60', at: [360, 215], from: 'ridge', zone: 1, zr: HIGHLANDS },
  { id: 'glacier', name: 'Rimeglass Glacier', band: '60–75', at: [490, 140], from: 'summit', rooms: [GLACIER], entry: { room: HIGHLANDS, x: GLACIER_GATE_X, kind: 'snout' } },
  { id: 'heights', name: 'Aurora Heights', band: '75–90', at: [490, 60], from: 'glacier', rooms: [HEIGHTS], entry: { room: GLACIER, x: HEIGHTS_GATE_X, kind: 'icefall' } },
  { id: 'bluehalls', name: 'Blue Halls', band: '80–90', hard: true, at: [625, 140], from: 'glacier', rooms: [BLUEHALLS], entry: { room: GLACIER, x: BLUEHALLS_GATE_X, kind: 'crevasse' } },
  { id: 'skerries', name: 'Whale Skerries', band: '55–70', at: [100, 290], from: 'hamlet', rooms: [SKERRIES], entry: { room: FJORD, x: SKERRIES_GATE_X, kind: 'snowslide' } },
  { id: 'grotto', name: 'Narwhal Grotto', band: '70–80', hard: true, at: [100, 350], from: 'skerries', rooms: [GROTTO], entry: { room: SKERRIES, x: GROTTO_GATE_X, kind: 'grotto' } },
  { id: 'bridge', name: "The Queen's Bridge", band: '85–100', at: [360, 300], from: 'ridge', rooms: [QBRIDGE], entry: { room: HIGHLANDS, x: BRIDGE_GATE_X, kind: 'icestair' } },
  // FB2 (b): the deep room under the Blue Halls and the approach to Fenrir's den (one node: the Long Stair is its end).
  // FB2 (c) took away the den's gate (`wolfhold`, "the ice holds"): the door comes with the den's DENS row, like Ladon's
  { id: 'oldice', name: 'The Old Ice', band: '90–100', hard: true, at: [625, 225], from: 'bluehalls', rooms: [OLDICE, LONGSTAIR], entry: { room: BLUEHALLS, x: OLDICE_GATE_X, kind: 'fallenwall' } },
];
// Emberdeep (atlas Phase 5, E0 on: story/world/emberdeep-depth.md): Forgehold, the legacy stage's two zones,
// and every branch's gate laid before any of them ships. The balloon by the thermal column is atlas Phase 6
// (to the Citadel's Skydocks), not a branch, but it's blocked the same way and shown on the map.
export const EMBERDEEP = [
  { id: 'forgehold', name: 'Forgehold', at: [205, 215], rooms: [FORGEHOLD], town: true },
  { id: 'flats', name: 'Cinder Flats', band: '90–100', at: [355, 215], from: 'forgehold', zone: 0, zr: CALDERA },
  { id: 'heart', name: 'Magma Heart', band: '100–115', at: [505, 215], from: 'flats', zone: 1, zr: CALDERA },
  // E1: the geyser across the beach path has gone quiet (the update itself lifted it)
  { id: 'sands', name: 'Black Sands', band: '90–100', at: [76, 215], from: 'forgehold', rooms: [BLACKSANDS], entry: { room: FORGEHOLD, x: SANDS_GATE_X, kind: 'geyser' } },
  // E2: the lava tongue down the gully has crusted hard, and someone cut steps in it (the update itself lifted it)
  { id: 'coast', name: 'Smoking Coast', band: '100–115', at: [355, 295], from: 'flats', rooms: [COAST], entry: { room: CALDERA, x: COAST_GATE_X, kind: 'lavatongue' } },
  // E2 (piece 3): the old lava tube in the Coast's sea cliff has drained, the steam gone (the update itself lifted it)
  { id: 'tubes', name: 'Drained Tubes', band: '115–125', hard: true, at: [205, 300], from: 'coast', rooms: [TUBES], entry: { room: COAST, x: TUBES_GATE_X, kind: 'tubemouth' } },
  // E1: the charcoal road's iron bridge hauled back up onto its abutments (the update itself lifted it)
  { id: 'ashwood', name: 'The Ashwood', band: '115–130', at: [355, 135], from: 'flats', rooms: [ASHWOOD], entry: { room: CALDERA, x: ASHWOOD_GATE_X, kind: 'ironbridge' } },
  { id: 'foundry', name: 'Old Foundry', band: '130–145', hard: true, at: [205, 135], from: 'ashwood', block: 'bricked up',
    gate: { room: ASHWOOD, x: FOUNDRY_GATE_X, kind: 'adit', look: 'look at the bricked-up adit', says: 'The old adit is bricked up from this side. Forge bricks, good mortar. Someone meant it.' } },
  { id: 'brimstone', name: 'Brimstone Fields', band: '125–140', at: [505, 135], from: 'heart', block: 'the vents are fuming',
    gate: { room: CALDERA, x: BRIMSTONE_GATE_X, kind: 'fumes', look: 'look up the flank', says: 'The vent field across the path is fuming yellow. Nobody can breathe that air today.' } },
  { id: 'rim', name: 'Caldera Rim', band: '135–150', at: [505, 58], from: 'brimstone', past: true, block: 'past the Fields' },
  { id: 'column', name: 'The Balloon', at: [640, 215], from: 'heart', block: 'the column stalls',
    gate: { room: CALDERA, x: BALLOON_X, kind: 'balloon', look: 'look at the balloon', says: 'The column keeps stalling. Nobody goes up in a wind that drops out under them.' } },
];
export const ISLAND_MAPS = { green: GREENHOLLOW, frost: FROSTPEAK, ember: EMBERDEEP };
const ALL = Object.values(ISLAND_MAPS).flat();
export const shipped = (n) => !n.gate && !n.past;
export const ENTRIES = ALL.filter((n) => n.entry).map((n) => ({ ...n.entry, branch: n.id, name: n.name, band: n.band, hard: !!n.hard }));

// Blocked ways in, and the one you're standing at (on the ground, close enough to look)
export const GATES = ALL.filter((n) => n.gate).map((n) => ({ ...n.gate, branch: n.id, name: n.name, hard: !!n.hard }));
export const GATE_RANGE = 60;
export const gateAt = (me, room) => (me && me.grounded && !me.onPlat ? GATES.find((g) => g.room === room && Math.abs(me.x - g.x) < GATE_RANGE) : null) ?? null;

// The island-map node a room (and x in it) is, on whichever island's map, or null when it isn't one of them
// (the village's buildings and houses: the map pins those on Slimeville)
export function nodeAt(room, x) {
  const den = DENS.find((d) => d.room === room);
  if (den) [room, x] = [den.from, den.entranceX];
  const zones = STAGES[room]?.zones, zi = zones ? zones.indexOf(zoneAt(x, room)) : -1;
  return ALL.find((n) => n.zone !== undefined && (n.zr ?? FIELD) === room && n.zone === zi) ?? ALL.find((n) => n.rooms?.includes(room)) ?? (room === VILLAGE ? GREENHOLLOW[1] : null);
}
