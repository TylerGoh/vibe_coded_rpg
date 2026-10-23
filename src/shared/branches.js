// Docs: docs/places/branches.md
// Each island's branches (story/world/island-depth.md; Greenhollow's, then Frostpeak's): the side areas off the main trail, each its own
// combat room once it ships. Until then the way in is there but blocked by something in the world (a
// node's `gate`: drawn by src/branch-gates.js, E shows what's wrong), never a "coming soon" sign. The
// island map (src/worldmap.js) draws this list as a graph: shipped places solid, the rest blocked.
// When a branch ships: give it its room(s), set `rooms`, remove its `gate` (and the block's art goes with
// it: the update itself lifts the block), give it an `entry` (the open way in, drawn where the gate was),
// and make its children's gates the next ones.
import { FIELD, STAGES, DENS, zoneAt, HIGHLANDS, FJORD, GLACIER, GLACIER_GATE_X, BLUEHALLS_GATE_X, HEIGHTS_GATE_X, SKERRIES_GATE_X, BRIDGE_GATE_X, SKERRIES, GROTTO, GROTTO_GATE_X, HEIGHTS, BLUEHALLS, WILLOWMERE, WILLOWMERE_GATE_X, COVES, COVES_GATE_X, MYCELIUM, MYCELIUM_GATE_X, GLOWROOT, GLOWROOT_GATE_X, CANOPY, CANOPY_GATE_X, SPINE, SPINE_GATE_X, WRECK, WRECK_GATE_X, THORNHEART, THORN_GATE_X } from './rpg.js';
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
  { id: 'bridge', name: "The Queen's Bridge", band: '85–100', at: [360, 300], from: 'ridge', block: 'the stair broke off',
    gate: { room: HIGHLANDS, x: BRIDGE_GATE_X, kind: 'icestair', look: 'look up the ice stair', says: "The stair up onto the Queen's bridge broke off where the bridge cracked. It creaks." } },
];
export const ISLAND_MAPS = { green: GREENHOLLOW, frost: FROSTPEAK };
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
