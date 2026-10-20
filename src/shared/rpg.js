// Docs: docs/combat/core.md, docs/combat/stages.md, docs/combat/bosses.md, docs/combat/items.md, docs/places/alchemy.md
// Shared by client and server: the mob stage (the Wildwood, east of the village), its mobs, items,
// levels and combat numbers. The server runs the mobs and decides every hit, drop and pickup
// (server/rpg.js); the client only draws them (src/rpg.js, art in src/field.js).

export const FIELD = 5; // room id (see ROOMS in sim.js)
export const FIELD_W = 4800;
export const FIELD_GROUND = 450;
export const FIELD_EXIT_X = 70; // the way back to the village, at the field's west end
export const FIELD_GATE_X = 5030; // the gate out of the village, at its east end

// Three zones, getting harder the further east you go
export const ZONES = [
  { name: 'Sprout Meadow', x0: 0, x1: 1600, lvl: '1–3' },
  { name: 'Mushroom Grove', x0: 1600, x1: 3200, lvl: '4–7' },
  { name: 'Bramble Woods', x0: 3200, x1: FIELD_W, lvl: '8+' },
];
// The second stage: the Frostpeak Highlands, up a trail from the Wildwood's east end
export const HIGHLANDS = 9; // room id
export const HIGHLANDS_W = 4000;
export const HIGHLANDS_EXIT_X = 70; // back down to the Wildwood
export const HIGHLANDS_DOOR_X = 4740; // the trail up, at the Wildwood's east end
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
// The open-air stages (each has zones); dens are separate rooms
export const STAGES = {
  [FIELD]: { name: 'The Wildwood', zones: ZONES },
  [HIGHLANDS]: { name: 'The Frostpeak Highlands', zones: HIGHLAND_ZONES },
  [CALDERA]: { name: 'The Emberdeep Caldera', zones: CALDERA_ZONES },
  [CITADEL]: { name: 'The Aether Citadel', zones: CITADEL_ZONES },
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
    drops: [['king_crown', 1, 1, 1], ['coin', 1, 50, 90], ['red_jelly', 1, 2, 4], ['mana_jelly', 1, 1, 2], ['wood_sword', 0.5, 1, 1], ['scroll_s100', 0.7, 1, 2], ['scroll_h100', 0.7, 1, 2], ['scroll_s60', 0.25, 1, 1], ['scroll_h60', 0.25, 1, 1]],
  },
  mother_mushroom: {
    name: 'Mother Mushroom', boss: true, lvl: 8, hp: 14000, atk: 24, exp: 950, speed: 60, w: 150, h: 140, aggro: true, hops: false,
    phases: [['slam', 'rain'], ['slam', 'rain', 'summon', 'leap'], ['slam', 'rain', 'summon', 'leap', 'barrage']],
    ult: { name: 'Spore Bloom', kind: 'spores' }, minion: 'mushling',
    drops: [['spore_blade', 1, 1, 1], ['coin', 1, 120, 200], ['blue_jelly', 1, 1, 3], ['mana_jelly', 1, 2, 3], ['mush_helm', 0.6, 1, 1], ['scroll_s100', 1, 1, 2], ['scroll_h100', 1, 1, 2], ['scroll_s60', 0.4, 1, 1], ['scroll_h60', 0.4, 1, 1], ['scroll_s10', 0.05, 1, 1]],
  },
  bramble_behemoth: {
    name: 'Bramble Behemoth', boss: true, lvl: 12, hp: 30000, atk: 36, exp: 2500, speed: 95, w: 170, h: 130, aggro: true, hops: false,
    phases: [['charge', 'slam'], ['charge', 'slam', 'rain', 'summon'], ['charge', 'slam', 'rain', 'summon', 'leap', 'barrage']],
    ult: { name: 'Thorn Tsunami', kind: 'wave' }, minion: 'bramble',
    drops: [['thorn_sword', 1, 1, 1], ['bramble_helm', 1, 1, 1], ['coin', 1, 250, 400], ['blue_jelly', 1, 2, 4], ['mana_jelly', 1, 2, 4], ['scroll_s100', 1, 1, 3], ['scroll_h100', 1, 1, 3], ['scroll_s60', 0.6, 1, 1], ['scroll_h60', 0.6, 1, 1], ['scroll_s10', 0.1, 1, 1], ['scroll_h10', 0.1, 1, 1]],
  },
  // ——— the Frostpeak Highlands ———
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
    drops: [['frost_blade', 1, 1, 1], ['glacier_helm', 1, 1, 1], ['coin', 1, 600, 900], ['elixir', 1, 2, 4], ['ice_shard', 1, 4, 8], ['scroll_s60', 1, 1, 1], ['scroll_h60', 1, 1, 1], ['scroll_s10', 0.2, 1, 1], ['scroll_h10', 0.2, 1, 1], ['scroll_s30', 0.1, 1, 1], ['scroll_chaos', 0.1, 1, 1]],
  },
  astral_wyrm: {
    name: 'Astral Wyrm', boss: true, lvl: 25, hp: 90000, atk: 72, exp: 15000, speed: 110, w: 190, h: 150, aggro: true, hops: false,
    phases: [['rain', 'charge', 'leap'], ['barrage', 'charge', 'leap', 'slam', 'summon'], ['barrage', 'charge', 'leap', 'slam', 'summon', 'rain']],
    ult: { name: 'Supernova', kind: 'nova' }, minion: 'wisp',
    drops: [['star_sword', 1, 1, 1], ['star_crown', 1, 1, 1], ['coin', 1, 1500, 2500], ['elixir', 1, 4, 6], ['stardust', 1, 6, 10], ['scroll_s60', 1, 1, 2], ['scroll_h60', 1, 1, 2], ['scroll_s10', 0.3, 1, 1], ['scroll_h10', 0.3, 1, 1], ['scroll_s30', 0.15, 1, 1], ['scroll_chaos', 0.15, 1, 1]],
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
    drops: [['magma_maul', 1, 1, 1], ['ember_helm', 0.6, 1, 1], ['coin', 1, 3000, 5000], ['mega_elixir', 1, 2, 4], ['ember_core', 1, 6, 10], ['scroll_s60', 1, 1, 2], ['scroll_h60', 1, 1, 2], ['scroll_s10', 0.4, 1, 1], ['scroll_h10', 0.4, 1, 1], ['scroll_s30', 0.25, 1, 1], ['scroll_h30', 0.25, 1, 1], ['scroll_chaos', 0.25, 1, 1]],
  },
  pyra: {
    name: 'Pyra the Ember Phoenix', boss: true, lvl: 46, hp: 240000, atk: 140, exp: 55000, speed: 120, w: 170, h: 140, aggro: true, hops: false, fly: 40,
    phases: [['feathers', 'dive', 'rings'], ['feathers', 'dive', 'rings', 'rain', 'summon'], ['feathers', 'dive', 'rings', 'barrage', 'spiral']],
    ult: { name: 'Rebirth', kind: 'rebirth' }, minion: 'cinder_bat',
    drops: [['phoenix_blade', 1, 1, 1], ['phoenix_crown', 0.6, 1, 1], ['coin', 1, 5000, 8000], ['mega_elixir', 1, 3, 5], ['obsidian_shard', 1, 6, 10], ['scroll_s60', 1, 2, 3], ['scroll_h60', 1, 2, 3], ['scroll_s10', 0.5, 1, 1], ['scroll_h10', 0.5, 1, 1], ['scroll_s30', 0.3, 1, 1], ['scroll_h30', 0.3, 1, 1], ['scroll_chaos', 0.3, 1, 1]],
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
    drops: [['cog_cleaver', 1, 1, 1], ['aether_helm', 0.6, 1, 1], ['coin', 1, 9000, 14000], ['mega_elixir', 1, 4, 6], ['cog', 1, 8, 12], ['scroll_s60', 1, 2, 3], ['scroll_h60', 1, 2, 3], ['scroll_s10', 0.6, 1, 2], ['scroll_h10', 0.6, 1, 2], ['scroll_s30', 0.4, 1, 1], ['scroll_h30', 0.4, 1, 1], ['scroll_chaos', 0.4, 1, 2]],
  },
  chronos: {
    name: 'Chronos, Keeper of Hours', boss: true, lvl: 80, hp: 650000, atk: 260, exp: 220000, speed: 100, w: 160, h: 190, aggro: true, hops: false, fly: 30,
    phases: [['bombs', 'sweep', 'blink', 'spiral'], ['bombs', 'sweep', 'blink', 'spiral', 'echo', 'grid'], ['bombs', 'sweep', 'blink', 'spiral', 'echo', 'grid', 'summon']],
    ult: { name: 'Time Stop', kind: 'timestop' }, ults: [{ name: 'Time Stop', kind: 'timestop' }, { name: 'Collapse of Hours', kind: 'collapse' }], minion: 'chrono_wraith',
    drops: [['chrono_blade', 1, 1, 1], ['hourglass_crown', 0.6, 1, 1], ['coin', 1, 15000, 25000], ['mega_elixir', 1, 5, 8], ['aether_crystal', 1, 8, 12], ['scroll_s60', 1, 3, 4], ['scroll_h60', 1, 3, 4], ['scroll_s10', 0.8, 1, 2], ['scroll_h10', 0.8, 1, 2], ['scroll_s30', 0.5, 1, 2], ['scroll_h30', 0.5, 1, 2], ['scroll_chaos', 0.5, 1, 2]],
  },
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
];
export const DEN_EXIT_X = 80;
export const DEN_PLATFORMS = [
  { x: 250, y: 330, w: 200, kind: 'ledge' },
  { x: 1050, y: 330, w: 200, kind: 'ledge' },
  { x: 640, y: 230, w: 220, kind: 'ledge' },
];
export const BOSS_RESPAWN_MS = 60_000;
// A boss's HP grows by this much for every extra slime in its den (and keeps the damage already done)
export const BOSS_HP_PER_PLAYER = 0.6;
export const COMBAT_ROOMS = new Set([FIELD, HIGHLANDS, CALDERA, CITADEL, ...DENS.map((d) => d.room)]);
export const isCombat = (room) => COMBAT_ROOMS.has(room);
export const denAt = (room) => DENS.find((d) => d.room === room);

// ——— items ———
// kind: coin · potion (heal) · loot (just collectible, for now) · helmet (def) · sword (atk, reach)
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
  // ——— farming and alchemy (src/shared/alchemy.js): herbs grow in garden plots, potions are brewed at a lab.
  // Herbs and brews sell for less than their seeds cost (npm run economy checks it): they're for using.
  // buff: { atk (ATK and MAGIC ×1+atk), crit (+crit chance), ward (damage taken ×1−ward) } for `dur` s;
  // one brewed buff at a time (a new one replaces it). full: fills HP and MP.
  mintleaf: { name: 'Mintleaf', price: 12, kind: 'loot', herb: true, desc: 'A cool, fresh herb from your garden.' },
  sunberry: { name: 'Sunberry', price: 27, kind: 'loot', herb: true, desc: 'A warm golden berry. Smells like summer.' },
  moonbell: { name: 'Moonbell', price: 72, kind: 'loot', herb: true, desc: 'A pale flower that only rings at night.' },
  frostbloom: { name: 'Frostbloom', price: 240, kind: 'loot', herb: true, desc: 'Icy petals that never wilt.' },
  emberroot: { name: 'Emberroot', price: 720, kind: 'loot', herb: true, desc: 'A knobbly root, hot to the touch.' },
  starlotus: { name: 'Starlotus', price: 1800, kind: 'loot', herb: true, desc: 'A lotus that glows like a tiny star.' },
  mint_tonic: { name: 'Mint Tonic', price: 15, kind: 'potion', brewed: true, heal: 250, desc: 'Brewed. Restores 250 HP.' },
  sun_cordial: { name: 'Sunberry Cordial', price: 40, kind: 'potion', brewed: true, mana: 200, desc: 'Brewed. Restores 200 MP.' },
  moon_draught: { name: 'Moonbell Draught', price: 80, kind: 'potion', brewed: true, heal: 700, mana: 350, desc: 'Brewed. Restores 700 HP and 350 MP.' },
  might_brew: { name: 'Brew of Might', price: 50, kind: 'potion', brewed: true, buff: { atk: 0.15 }, dur: 300, desc: 'Brewed. +15% ATK and MAGIC for 5 minutes.' },
  frost_ward: { name: 'Frostbloom Ward', price: 250, kind: 'potion', brewed: true, buff: { ward: 0.25 }, dur: 300, desc: 'Brewed. Take 25% less damage for 5 minutes.' },
  ember_fury: { name: 'Emberroot Fury', price: 650, kind: 'potion', brewed: true, buff: { atk: 0.25, crit: 0.1 }, dur: 300, desc: 'Brewed. +25% ATK and MAGIC and +10% crit chance for 5 minutes.' },
  star_elixir: { name: 'Starlotus Elixir', price: 3000, kind: 'potion', brewed: true, full: true, buff: { atk: 0.2, crit: 0.05, ward: 0.15 }, dur: 300, desc: 'Brewed. Fully restores HP and MP, then +20% ATK and MAGIC, +5% crit and 15% less damage taken for 5 minutes.' },
  sludge: { name: 'Murky Sludge', price: 1, kind: 'loot', desc: 'A brew gone wrong. It bubbles sadly.' },
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
export const sellPrice = (id) => Math.max(1, Math.floor((ITEMS[id]?.price ?? 0) * SELL_RATE));
export const BUY_MAX = 20; // potions bought at once

// ——— the Boutique (a tab in Pip's shop): the special accessories some friends' slimes always wear,
// sold cheaply as cosmetics. Owned ones can be worn in any mix from the bag's Style row; they're purely
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
