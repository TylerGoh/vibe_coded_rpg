// Docs: docs/places/waystones.md
// Waystones: Keeper standing stones that still work (the Waystone in the ruins says "IT IS STILL TURNING").
// Walk up to one and press E to attune to it (saved with your character, server/rpg.js); at any stone you
// have attuned, E lists the others you have and the server moves you there. Respawn stays at towns
// (TOWNS in sim.js): a waystone is for getting back out, not for waking up. One in Slimeville, one at each
// branch's entrance hub and one on Keeper's Spine, the Queen's Bridge and the Caldera Rim (story/world/island-depth.md); none in the hard pockets.
// The stones only reach stones on their own island (isle): islands are reached by their crossings.
import { VILLAGE, FJORD, FORGEHOLD, WILLOWMERE, COVES, MYCELIUM, CANOPY, SPINE, GLACIER, SKERRIES, HEIGHTS, QBRIDGE, ASHWOOD, COAST, BRIMSTONE, RIM } from './sim.js';
import { CALDERA } from './rpg.js';

// x: the stone, on its room's ground (where you arrive is a little beside it, ARRIVE_DX) · isle: its island
// (Greenhollow when left out)
export const WAYSTONES = [
  { id: 'slimeville', name: 'Slimeville', room: VILLAGE, x: 1265 },
  { id: 'willowmere', name: 'Willowmere', room: WILLOWMERE, x: 320 },
  { id: 'coves', name: 'Saltspray Coves', room: COVES, x: 4140 },
  { id: 'deep', name: 'Mycelium Deep', room: MYCELIUM, x: 300 },
  { id: 'canopy', name: 'Old Oak Canopy', room: CANOPY, x: 300 },
  { id: 'spine', name: "Keeper's Spine", room: SPINE, x: 320 },
  { id: 'icefang', name: 'Icefang Hamlet', room: FJORD, x: 1975, isle: 'frost' }, // (by the lamp-fire, where you wake up)
  { id: 'glacier', name: 'Rimeglass Glacier', room: GLACIER, x: 300, isle: 'frost' },
  { id: 'skerries', name: 'Whale Skerries', room: SKERRIES, x: 4800, isle: 'frost' },
  { id: 'heights', name: 'Aurora Heights', room: HEIGHTS, x: 330, isle: 'frost' },
  { id: 'qbridge', name: "Queen's Bridge", room: QBRIDGE, x: 330, isle: 'frost' },
  { id: 'forgehold', name: 'Forgehold', room: FORGEHOLD, x: 1960, isle: 'ember' }, // (by the great forge, where you wake up)
  { id: 'magmaheart', name: 'Magma Heart', room: CALDERA, x: 2250, isle: 'ember' }, // (just past the Molten Forge's mouth)
  { id: 'ashwood', name: 'The Ashwood', room: ASHWOOD, x: 5080, isle: 'ember' }, // (in Collier's Clearing, past the Kiln Stone)
  { id: 'coast', name: 'The Smoking Coast', room: COAST, x: 4330, isle: 'ember' }, // (on the Glass Beach, before Liv's shelter)
  { id: 'brimstone', name: 'The Brimstone Fields', room: BRIMSTONE, x: 5080, isle: 'ember' }, // (in the Picker's Camp, past the Breathing Stone)
  { id: 'rim', name: 'The Caldera Rim', room: RIM, x: 5120, isle: 'ember' }, // (at the Stair Head, past the Hoist Stone)
];
export const isleOf = (w) => w.isle ?? 'green';
export const sameIsle = (a, b) => isleOf(a) === isleOf(b);
export const WAY_RANGE = 56;
export const ARRIVE_DX = 46;
export const wayById = (id) => WAYSTONES.find((w) => w.id === id);
// The stone a slime is standing at (on the ground, close enough to touch), or null
export const wayAt = (s) => (s && s.grounded && !s.onPlat ? WAYSTONES.find((w) => w.room === s.room && Math.abs(s.x - w.x) < WAY_RANGE) : null) ?? null;
