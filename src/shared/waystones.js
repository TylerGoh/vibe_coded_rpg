// Docs: docs/places/waystones.md
// Waystones: Keeper standing stones that still work (the Waystone in the ruins says "IT IS STILL TURNING").
// Walk up to one and press E to attune to it (saved with your character, server/rpg.js); at any stone you
// have attuned, E lists the others you have and the server moves you there. Respawn stays at towns
// (TOWNS in sim.js): a waystone is for getting back out, not for waking up. One in Slimeville, one at each
// branch's entrance hub (story/world/island-depth.md); Keeper's Spine gets one when it ships.
import { VILLAGE, WILLOWMERE, COVES } from './sim.js';

// x: the stone, on its room's ground (where you arrive is a little beside it, ARRIVE_DX)
export const WAYSTONES = [
  { id: 'slimeville', name: 'Slimeville', room: VILLAGE, x: 1265 },
  { id: 'willowmere', name: 'Willowmere', room: WILLOWMERE, x: 320 },
  { id: 'coves', name: 'Saltspray Coves', room: COVES, x: 4140 },
];
export const WAY_RANGE = 56;
export const ARRIVE_DX = 46;
export const wayById = (id) => WAYSTONES.find((w) => w.id === id);
// The stone a slime is standing at (on the ground, close enough to touch), or null
export const wayAt = (s) => (s && s.grounded && !s.onPlat ? WAYSTONES.find((w) => w.room === s.room && Math.abs(s.x - w.x) < WAY_RANGE) : null) ?? null;
