// Docs: docs/places/alchemy.md
// Farming and alchemy, shared by the browser and the server. Garden plots (furniture, backyard only) grow
// CROPS from seeds bought right at the plot; what they grow (herbs, items in ITEMS) goes into an alchemy
// lab (furniture too) with mob materials to brew potions by following a RECIPE: a list of steps done in
// order at the lab. Stronger potions take more steps and rarer ingredients. Rules: server/house.js
// (plots) and server/rpg.js (brewing); UI: src/alchemy.js; art: src/alchemy-art.js.

// grow: seconds from planting to harvest · seed: gold per planting (paid at the plot) · yield: herbs per
// harvest [min, max]. Herb sell prices (ITEMS) stay under the seed's cost, so a garden is never a gold
// farm (npm run economy checks it): crops are for brewing.
export const CROPS = {
  mintleaf: { name: 'Mintleaf', seed: 20, grow: 2 * 60, yield: [2, 3], color: '#7fd9a8', dark: '#3f9a6c' },
  sunberry: { name: 'Sunberry', seed: 45, grow: 5 * 60, yield: [2, 3], color: '#ffc84a', dark: '#d98a1f' },
  moonbell: { name: 'Moonbell', seed: 120, grow: 12 * 60, yield: [2, 3], color: '#b9a4ff', dark: '#7a5fd1' },
  frostbloom: { name: 'Frostbloom', seed: 400, grow: 25 * 60, yield: [2, 3], color: '#9fe3ff', dark: '#4fa8d6' },
  emberroot: { name: 'Emberroot', seed: 1200, grow: 45 * 60, yield: [2, 3], color: '#ff8a5c', dark: '#c94a2a' },
  starlotus: { name: 'Starlotus', seed: 3000, grow: 90 * 60, yield: [2, 3], color: '#ffe9a8', dark: '#e0a8d8' },
};
export const PLOT_REACH = 80; // how close (px, from the plot's middle) you have to stand to plant or harvest
export const LAB_REACH = 100; // the same for an alchemy lab
export const GIFT = { garden_plot: 2, alchemy_lab: 1 }; // every house gets these free (new and old ones)

// What you can do at the lab, in order. A step is 'stir' | 'heat' | 'cool' | 'distill' or
// 'add:<item>' / 'grind:<item>' (ground in the mortar first, then added).
export const ACTIONS = {
  stir: 'Stir',
  heat: 'Heat',
  cool: 'Cool',
  distill: 'Distill',
};
export const BREW_MAX = 10; // potions brewed at once (a batch: ingredients × n, steps done once)
export const MAX_STEPS = 24;

// Recipes, weakest first. Each makes `makes` of the potion with the same id (in ITEMS) per batch. The steps must be done
// exactly, in order: anything else turns to sludge and the ingredients are lost (the recipe book is right
// there). tier: shown as stars in the book.
export const RECIPES = {
  mint_tonic: { tier: 1, makes: 2, steps: ['add:mintleaf', 'add:mintleaf', 'stir'] },
  sun_cordial: { tier: 1, makes: 2, steps: ['grind:sunberry', 'add:sunberry', 'heat', 'stir'] },
  moon_draught: { tier: 2, makes: 2, steps: ['grind:moonbell', 'heat', 'add:mintleaf', 'add:sunberry', 'stir', 'stir'] },
  might_brew: { tier: 2, makes: 2, steps: ['grind:thorn', 'add:sunberry', 'add:sunberry', 'heat', 'stir', 'distill'] },
  frost_ward: { tier: 3, makes: 2, steps: ['add:frostbloom', 'grind:ice_shard', 'cool', 'stir', 'add:moonbell', 'cool', 'distill'] },
  ember_fury: { tier: 4, makes: 2, steps: ['grind:emberroot', 'add:ember_core', 'heat', 'heat', 'stir', 'add:sunberry', 'add:sunberry', 'stir', 'distill'] },
  star_elixir: { tier: 5, makes: 2, steps: ['grind:stardust', 'add:starlotus', 'add:starlotus', 'cool', 'stir', 'heat', 'add:moonbell', 'distill', 'grind:aether_crystal', 'stir', 'distill'] },
};
export const BUFF_LABELS = { atk: 'ATK and MAGIC', crit: 'crit chance', ward: 'less damage taken' };

export const stepItem = (s) => (s.startsWith('add:') || s.startsWith('grind:') ? s.slice(s.indexOf(':') + 1) : null);
// What a list of steps uses up: { item id: count }
export function needs(steps) {
  const n = {};
  for (const s of steps) {
    const id = stepItem(s);
    if (id) n[id] = (n[id] ?? 0) + 1;
  }
  return n;
}
// Every item some recipe uses (the lab's ingredient shelf)
export const INGREDIENTS = [...new Set(Object.values(RECIPES).flatMap((r) => Object.keys(needs(r.steps))))];
// The recipe these steps make exactly, or null (sludge)
export function recipeFor(steps) {
  for (const [id, r] of Object.entries(RECIPES)) if (r.steps.length === steps.length && r.steps.every((s, i) => s === steps[i])) return id;
  return null;
}
// A list of steps from the wire, made safe (known actions and ingredients only), or null
export function cleanSteps(steps) {
  if (!Array.isArray(steps) || !steps.length || steps.length > MAX_STEPS) return null;
  for (const s of steps) if (typeof s !== 'string' || !(ACTIONS[s] || INGREDIENTS.includes(stepItem(s)))) return null;
  return steps;
}
// How a step reads in the recipe book: needs ITEMS for the names (passed in, so this file stays tiny)
export const stepLabel = (s, items) => {
  const id = stepItem(s);
  if (!id) return ACTIONS[s];
  return `${s.startsWith('grind:') ? 'Grind' : 'Add'} ${items[id]?.name ?? id}`;
};
// A crop's growth from 0 to 1, given how many ms are left
export const grown = (c, left) => Math.min(1, Math.max(0, 1 - left / (CROPS[c].grow * 1000)));
export const fmtTime = (ms) => {
  const s = Math.ceil(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
};
