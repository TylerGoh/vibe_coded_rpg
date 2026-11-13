// Docs: docs/social/story.md
// Story progress (atlas Phase 7, story/phase7-plan.md): each character's `story` record is every den boss it has ever
// helped beat (boss kind → when, the first time; server/rpg.js), never reset. The lore tier (story/canon.md's tiers)
// comes from it: a tier opens with any den boss of its island, and brings every tier under it.
export const BOSS_TIER = {
  // Greenhollow (Tier 1: learned in the Wildwood)
  sprout_king: 1, mother_mushroom: 1, bramble_behemoth: 1, tidemother: 1, knotmole: 1, root_warden: 1, ladon: 1,
  // Frostpeak (Tier 2)
  frost_queen: 2, astral_wyrm: 2, old_narwhal: 2, sigrun: 2, fenrir: 2,
  // Emberdeep (Tier 3)
  ignis: 3, pyra: 3, hatchkeeper: 3, brenna: 3, typhon: 3,
  // the Aether Citadel (Tier 4: the endgame)
  colossus: 4, chronos: 4, meridian: 4, // (the Citadel's depth pass, C1: the Orrery's den)
  // Lantern Fen adds no canon tier (story/phase8-plan.md): its final boss is in the record only for her freed changes
  // (the Hall's front door, Wickmere's Lamp Walk: docs/social/story.md)
  wickmother: 0,
};
export const TOP_TIER = 4;

// a story record → its lore tier (0: only what everyone knows)
export const tierOf = (story) => Object.keys(story ?? {}).reduce((t, k) => Math.max(t, BOSS_TIER[k] ?? 0), 0);

// A saved record, cleaned: only bosses that give a tier, each with a sane time
export const cleanStory = (s, now) => Object.fromEntries(Object.entries(s && typeof s === 'object' ? s : {}).filter(([k, at]) => k in BOSS_TIER && Number.isFinite(at) && at > 0 && at <= now));
