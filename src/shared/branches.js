// Docs: docs/places/branches.md
// Greenhollow's branches (story/world/island-depth.md): the side areas off the main trail, each its own
// combat room once it ships. Until then the way in is there but blocked by something in the world (a
// node's `gate`: drawn by src/branch-gates.js, E shows what's wrong), never a "coming soon" sign. The
// island map (src/worldmap.js) draws this list as a graph: shipped places solid, the rest blocked.
// When a branch ships: give it its room(s), set `rooms`, remove its `gate` (and the block's art goes with
// it: the update itself lifts the block), and make its children's gates the next ones.
import { FIELD, ZONES, DENS, zoneAt } from './rpg.js';
import { VILLAGE, HARBOUR, CLIFFS } from './sim.js';

// at: where the node sits on the island map (map pixels, 720×380) · from: the node it branches off (an edge
// on the map) · band: its levels · hard: a hard pocket · rooms: the rooms that are it (shipped) · zone: a
// Wildwood zone · gate: the blocked way in: { room, x, kind (the art), look (the prompt), says (on E) }
// · past: an unshipped place behind another one, with no gate of its own yet (`block` names why on the map)
export const GREENHOLLOW = [
  { id: 'harbour', name: 'Harbour', at: [75, 205], rooms: [HARBOUR], town: true },
  { id: 'slimeville', name: 'Slimeville', at: [190, 205], from: 'harbour', town: true },
  { id: 'meadow', name: 'Sprout Meadow', band: '1–3', at: [305, 205], from: 'slimeville', zone: 0 },
  { id: 'grove', name: 'Mushroom Grove', band: '4–7', at: [420, 205], from: 'meadow', zone: 1 },
  { id: 'woods', name: 'Bramble Woods', band: '8–12', at: [535, 205], from: 'grove', zone: 2 },
  { id: 'cliffs', name: 'East Cliffs', at: [650, 205], from: 'woods', rooms: [CLIFFS] },
  {
    id: 'willowmere', name: 'Willowmere', band: '5–15', at: [305, 285], from: 'meadow', block: 'bridge out',
    gate: { room: FIELD, x: 880, kind: 'bridge', look: 'look at the washed-out footbridge', says: 'A path runs north along the brook to Willowmere, but the footbridge over the brook has washed out.' },
  },
  {
    id: 'coves', name: 'Saltspray Coves', band: '10–25', at: [75, 285], from: 'harbour', block: 'rockfall',
    gate: { room: HARBOUR, x: 110, kind: 'rockfall', look: 'look at the rockfall', says: 'The shore path south to Saltspray Coves is buried under a rockfall.' },
  },
  { id: 'wreck', name: 'Wreck Cave', band: '30–40', hard: true, at: [75, 350], from: 'coves', past: true, block: 'flooded' },
  {
    id: 'deep', name: 'Mycelium Deep', band: '15–35', at: [420, 285], from: 'grove', block: 'roots',
    gate: { room: FIELD, x: 2430, kind: 'stump', look: 'peer into the hollow stump', says: 'The hollow stump goes down to the Mycelium Deep, but its hole is choked with roots.' },
  },
  { id: 'glowroot', name: 'Glowroot Hollow', band: '40–50', hard: true, at: [420, 350], from: 'deep', past: true, block: 'deeper in' },
  {
    id: 'canopy', name: 'Old Oak Canopy', band: '25–40', at: [535, 125], from: 'woods', block: 'rotten ladder',
    gate: { room: FIELD, x: 3390, kind: 'ladder', look: 'look up the rope ladder', says: "A rope ladder climbs into the Old Oak Canopy, but its rungs have rotted through. It won't take a slime's weight." },
  },
  { id: 'spine', name: "Keeper's Spine", band: '45–60', at: [535, 55], from: 'canopy', past: true, block: 'fallen trunk' },
  {
    id: 'thornheart', name: 'Thornheart', band: '50–60', hard: true, at: [650, 285], from: 'woods', block: 'thorns',
    gate: { room: FIELD, x: 4920, kind: 'thorns', look: 'look into the briar', says: 'Somewhere past this wall of thorns lies the Thornheart. Nothing gets through.' },
  },
];
export const ISLAND_MAPS = { green: GREENHOLLOW }; // (Frostpeak's comes with its depth pass)
export const shipped = (n) => !n.gate && !n.past;

// Blocked ways in, and the one you're standing at (on the ground, close enough to look)
export const GATES = GREENHOLLOW.filter((n) => n.gate).map((n) => ({ ...n.gate, branch: n.id, name: n.name, hard: !!n.hard }));
export const GATE_RANGE = 60;
export const gateAt = (me, room) => (me && me.grounded && !me.onPlat ? GATES.find((g) => g.room === room && Math.abs(me.x - g.x) < GATE_RANGE) : null) ?? null;

// The island-map node a room (and x in it) is, or null when it isn't one of them (the village's buildings
// and houses: the map pins those on Slimeville)
export function nodeAt(room, x) {
  const den = DENS.find((d) => d.room === room);
  if (den) [room, x] = [den.from, den.entranceX];
  if (room === FIELD) return GREENHOLLOW.find((n) => n.zone === ZONES.indexOf(zoneAt(x, FIELD))) ?? null;
  return GREENHOLLOW.find((n) => n.rooms?.includes(room)) ?? (room === VILLAGE ? GREENHOLLOW[1] : null);
}
