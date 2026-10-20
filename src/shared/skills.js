// Docs: docs/combat/skills.md
import { attackFor, defenseFor, maxHpFor, reachFor } from './rpg.js';
import { DASH_CD, DASH_TICKS, DASH_V, BLINK_DIST, BLINK_CD, FJ_VX, IFR_DASH, IFR_BLINK, IFR_PHANTOM, PHANTOM_CD } from './sim.js';

// Shared by client and server: the two skill trees, mana, and the hotbar. Every level gives one skill
// point (SP) to spend in either tree; deeper tiers need points in that tree first. Active skills cost MP
// and have cooldowns; passives are always on. The server (server/rpg.js) decides every cast.

export const TREES = [
  { id: 'blade', name: 'Blade', color: '#e0806a', blurb: 'Sword skills: big hits, spins and a battle rage.' },
  { id: 'magic', name: 'Magic', color: '#7a8cf0', blurb: 'Spells: bolts from afar, healing and frost.' },
  { id: 'guardian', name: 'Guardian', color: '#4fb88f', blurb: 'Survive anything: shields, team buffs, a second wind.' },
  { id: 'wind', name: 'Mobility', color: '#5fc4d8', blurb: 'Dash, double jump and teleport. Some late bosses need these to dodge.' },
];

// tier: 1 (always open), then TIER_NEEDS points in that tree's lower tiers.
// kind: 'strike' (hit the nearest mob ahead) · 'cleave' (the nearest few ahead) · 'spin' (every mob
// around you) · 'storm' (every mob around you, several times) · 'bolt' (first mob ahead, at range) ·
// 'chain' (a bolt that jumps between mobs) · 'nova' (every mob in a radius, slowing them) · 'meteor'
// (a big blast where the first mob ahead stands, a moment later) · 'starfall' (every mob in the room) ·
// 'heal' (you and friends nearby) · 'buff' (Berserk) · 'bubble' (blocks the next hit) · 'rally' (team
// attack/defence buff) · 'zone' (Sanctuary) · 'aegis' (team immunity) · 'passive'.
export const SKILLS = {
  power_strike: {
    tree: 'blade', tier: 1, name: 'Power Strike', kind: 'strike', max: 5, mp: 6, cd: 1.2, reach: 40,
    mult: (r) => 1.6 + 0.25 * r,
    desc: (r) => `A heavy swing at the nearest mob ahead: ${pct(1.6 + 0.25 * r)} damage.`,
  },
  iron_jelly: {
    tree: 'blade', tier: 1, name: 'Iron Jelly', kind: 'passive', max: 5,
    desc: (r) => `Tougher jelly: +${3 * r} DEF and +${10 * r} max HP.`,
  },
  whirlwind: {
    tree: 'blade', tier: 2, name: 'Whirlwind', kind: 'spin', max: 5, mp: 14, cd: 4, radius: 100,
    mult: (r) => 1.0 + 0.2 * r,
    desc: (r) => `Spin and hit every mob within 100 px: ${pct(1.0 + 0.2 * r)} damage each.`,
  },
  cleave: {
    tree: 'blade', tier: 2, name: 'Cleave', kind: 'cleave', max: 5, mp: 10, cd: 2, reach: 70, targets: 3,
    mult: (r) => 1.3 + 0.2 * r,
    desc: (r) => `A wide swing through up to 3 mobs ahead: ${pct(1.3 + 0.2 * r)} damage each.`,
  },
  sword_mastery: {
    tree: 'blade', tier: 3, name: 'Sword Mastery', kind: 'passive', max: 5,
    desc: (r) => `+${3 * r}% critical chance and critical hits do +${10 * r}% more damage.`,
  },
  blade_storm: {
    tree: 'blade', tier: 4, name: 'Blade Storm', kind: 'storm', max: 3, mp: 30, cd: 12, radius: 130, hits: 4,
    mult: (r) => 0.8 + 0.15 * r,
    desc: (r) => `A storm of slashes: hits every mob within 130 px 4 times for ${pct(0.8 + 0.15 * r)} each.`,
  },
  sky_splitter: {
    tree: 'blade', tier: 5, name: 'Sky Splitter', kind: 'strike', max: 3, mp: 50, cd: 45, reach: 90,
    mult: (r) => 5 + 1.5 * r,
    desc: (r) => `One enormous overhead blow at the mob ahead: ${pct(5 + 1.5 * r)} damage.`,
  },
  berserk: {
    tree: 'blade', tier: 3, name: 'Berserk', kind: 'buff', max: 3, mp: 20, cd: 30, dur: 20,
    boost: (r) => 0.25 + 0.1 * r,
    desc: (r) => `Battle rage: +${Math.round((0.25 + 0.1 * r) * 100)}% attack for 20 s.`,
  },
  magic_bolt: {
    tree: 'magic', tier: 1, name: 'Magic Bolt', kind: 'bolt', max: 5, mp: 5, cd: 0.8, range: 380,
    mult: (r) => 1.1 + 0.2 * r,
    desc: (r) => `A bolt at the first mob ahead, up to 380 px away: ${pct(1.1 + 0.2 * r)} magic damage.`,
  },
  mana_flow: {
    tree: 'magic', tier: 1, name: 'Mana Flow', kind: 'passive', max: 5,
    desc: (r) => `+${15 * r} max MP, and MP comes back ${r ? `${1 + r * 0.5}×` : ''} faster.`,
  },
  heal: {
    tree: 'magic', tier: 2, name: 'Jelly Heal', kind: 'heal', max: 5, mp: 16, cd: 6, radius: 170,
    amount: (r) => 20 + 14 * r,
    desc: (r) => `Heal yourself and every friend within 170 px for ${20 + 14 * r} HP.`,
  },
  chain_lightning: {
    tree: 'magic', tier: 2, name: 'Chain Lightning', kind: 'chain', max: 5, mp: 14, cd: 3, range: 380, jump: 220, targets: 4,
    mult: (r) => 1.0 + 0.15 * r,
    desc: (r) => `Lightning that leaps between up to 4 mobs: ${pct(1.0 + 0.15 * r)} magic damage each.`,
  },
  arcane_mind: {
    tree: 'magic', tier: 3, name: 'Arcane Mind', kind: 'passive', max: 5,
    desc: (r) => `+${12 * r}% magic power.`,
  },
  meteor: {
    tree: 'magic', tier: 4, name: 'Meteor', kind: 'meteor', max: 3, mp: 40, cd: 15, range: 450, radius: 150, delay: 0.8,
    mult: (r) => 3.5 + 0.6 * r,
    desc: (r) => `Calls a meteor down on the first mob ahead: ${pct(3.5 + 0.6 * r)} magic damage to everything within 150 px.`,
  },
  starfall: {
    tree: 'magic', tier: 5, name: 'Starfall', kind: 'starfall', max: 3, mp: 70, cd: 60, radius: 700,
    mult: (r) => 2.5 + 0.6 * r,
    desc: (r) => `Stars rain on every mob within 700 px: ${pct(2.5 + 0.6 * r)} magic damage each.`,
  },
  frost_nova: {
    tree: 'magic', tier: 3, name: 'Frost Nova', kind: 'nova', max: 3, mp: 30, cd: 10, radius: 190, slow: 4,
    mult: (r) => 1.8 + 0.4 * r,
    desc: (r) => `A burst of frost: ${pct(1.8 + 0.4 * r)} magic damage to every mob within 190 px, slowing them for 4 s.`,
  },
  // ——— Guardian ———
  jelly_bubble: {
    tree: 'guardian', tier: 1, name: 'Jelly Bubble', kind: 'bubble', max: 3, mp: 20, cd: 45, dur: 8,
    cdFor: (r) => 45 - 7 * (r - 1),
    desc: (r) => `A wobbly bubble that blocks the next hit within 8 s, even a boss's ultimate. Cooldown ${45 - 7 * (r - 1)} s.`,
  },
  vitality: {
    tree: 'guardian', tier: 1, name: 'Vitality', kind: 'passive', max: 5,
    desc: (r) => `+${8 * r}% max HP, and HP comes back faster.`,
  },
  rally: {
    tree: 'guardian', tier: 2, name: 'Rally', kind: 'rally', max: 3, mp: 25, cd: 40, radius: 300, dur: 15,
    boost: (r) => 0.1 + 0.05 * r,
    desc: (r) => `Rally every friend within 300 px: +${Math.round((0.1 + 0.05 * r) * 100)}% attack and defence for 15 s.`,
  },
  second_wind: {
    tree: 'guardian', tier: 3, name: 'Second Wind', kind: 'passive', max: 3,
    cdFor: (r) => [0, 120, 90, 60][r],
    desc: (r) => `A hit that would knock you out leaves you at 1 HP instead. Once every ${[0, 120, 90, 60][r]} s.`,
  },
  sanctuary: {
    tree: 'guardian', tier: 4, name: 'Sanctuary', kind: 'zone', max: 3, mp: 45, cd: 50, radius: 160, dur: 8,
    cut: (r) => 0.5 + 0.1 * r,
    desc: (r) => `A holy circle for 8 s: friends inside take ${Math.round((0.5 + 0.1 * r) * 100)}% less damage, and boss ultimates can't knock them out.`,
  },
  aegis: {
    tree: 'guardian', tier: 5, name: 'Aegis', kind: 'aegis', max: 3, mp: 60, cd: 90, radius: 260, dur: (r) => 1.5 + 0.5 * r,
    desc: (r) => `You and every friend within 260 px can't be hurt at all for ${1.5 + 0.5 * r} s.`,
  },
  // ——— Mobility: movement runs in the shared physics (sim.js step), from input bits, so it's predicted
  // exactly. 'move' skills have their own keys (Shift: Dash, V: Blink) and can sit on the hotbar too;
  // they cost no MP. Dash and Blink make you untouchable for a moment ("i-frames"): that's how you get
  // through the tall sweeps and the Colossus's / Chronos's ultimates.
  dash: {
    tree: 'wind', tier: 1, name: 'Dash', kind: 'move', max: 3, mp: 0, cdFor: (r) => DASH_CD[r] / 60, key: 'Shift',
    desc: (r) => `Shift: burst ${Math.round((DASH_V * DASH_TICKS) / 60)} px the way you face (in the air too), untouchable for ${secs(IFR_DASH)}. Cooldown ${DASH_CD[Math.max(1, r)] / 60} s.`,
  },
  flash_jump: {
    tree: 'wind', tier: 1, name: 'Flash Jump', kind: 'passive', max: 3,
    desc: (r) => `Press Jump again in mid-air for a second, forward-flying jump (${FJ_VX[Math.max(1, r)]} px/s).`,
  },
  blink: {
    tree: 'wind', tier: 2, name: 'Blink', kind: 'move', max: 3, mp: 0, cdFor: (r) => BLINK_CD[r] / 60, key: 'V',
    desc: (r) => `V: teleport ${BLINK_DIST[Math.max(1, r)]} px the way you face, straight through anything, untouchable for ${secs(IFR_BLINK)}. Cooldown ${BLINK_CD[Math.max(1, r)] / 60} s.`,
  },
  phantom_step: {
    tree: 'wind', tier: 3, name: 'Phantom Step', kind: 'passive', max: 2,
    desc: (r) => `Dash and Blink keep you untouchable ${secs(IFR_PHANTOM * Math.max(1, r))} longer and cool down ${Math.round(PHANTOM_CD * Math.max(1, r) * 100)}% faster.`,
  },
};
const secs = (ticks) => `${Math.round((ticks / 60) * 100) / 100} s`;
function pct(m) {
  return `${Math.round(m * 100)}%`;
}
export const TIER_NEEDS = { 1: 0, 2: 3, 3: 6, 4: 10, 5: 15 }; // points in that tree's LOWER tiers
export const cooldownOf = (id, rank) => SKILLS[id].cdFor?.(rank) ?? SKILLS[id].cd;
// The movement abilities a character has, packed for the physics (sim.js step reads state.mv):
// bits 0–1 Dash rank · 2–3 Flash Jump · 4–5 Blink · 6–7 Phantom Step
export const mobilityOf = (skills) => rankOf(skills, 'dash') | (rankOf(skills, 'flash_jump') << 2) | (rankOf(skills, 'blink') << 4) | (rankOf(skills, 'phantom_step') << 6);
export const durOf = (id, rank) => (typeof SKILLS[id].dur === 'function' ? SKILLS[id].dur(rank) : SKILLS[id].dur);
export const ACTIVE = (id) => SKILLS[id] && SKILLS[id].kind !== 'passive';

export const HOTBAR = 6; // skill slots, keys 1–6 (a skill id or null)
export const POTBAR = 3; // potion slots, keys 7–9 (a potion item id or null)

export const rankOf = (skills, id) => skills?.[id] ?? 0;
export const pointsIn = (skills, tree, belowTier = 99) => Object.entries(skills ?? {}).reduce((n, [id, r]) => n + (SKILLS[id]?.tree === tree && SKILLS[id].tier < belowTier ? r : 0), 0);
export const spTotal = (lvl) => lvl; // one point per level (one to start with)
export const spSpent = (skills) => Object.values(skills ?? {}).reduce((a, b) => a + b, 0);
// Can this skill take another point? → null if so, else why not
export function cantLearn(lvl, skills, id) {
  const sk = SKILLS[id];
  if (!sk) return 'Unknown skill';
  if (rankOf(skills, id) >= sk.max) return 'Maxed out';
  if (spSpent(skills) >= spTotal(lvl)) return 'No skill points left (you get one each level)';
  if (pointsIn(skills, sk.tree, sk.tier) < TIER_NEEDS[sk.tier]) return `Needs ${TIER_NEEDS[sk.tier]} points in lower ${TREES.find((t) => t.id === sk.tree).name} skills first`;
  return null;
}
// Can a point be taken back out of this skill? → null if so. (Not if a deeper skill relies on it.)
export function cantUnlearn(skills, id) {
  const sk = SKILLS[id];
  if (!sk || !rankOf(skills, id)) return 'Nothing to take back';
  const after = { ...skills, [id]: rankOf(skills, id) - 1 };
  for (const [other, r] of Object.entries(after)) {
    const o = SKILLS[other];
    if (r > 0 && o.tree === sk.tree && o.tier > sk.tier && pointsIn(after, o.tree, o.tier) < TIER_NEEDS[o.tier]) return `${o.name} needs this point. Take points out of ${o.name} first`;
  }
  return null;
}

export const maxMpFor = (lvl, skills) => 20 + lvl * 6 + 15 * rankOf(skills, 'mana_flow');

// ——— ability points (AP), MapleStory style: AP_PER_LVL every level, spent on four stats in the bag (I).
// Like skill points they can be taken back for free at any time (the owner wants nobody stuck in a build).
// c.ap = { str, dex, int, luk }. Damage rolls between minRoll and MAX_ROLL of ATK / MAGIC; DEX raises the floor.
export const AP_PER_LVL = 5;
export const AP_STATS = [
  { id: 'str', name: 'STR', short: '+0.6 ATK, +3 HP', desc: 'Strength: +0.6 ATK and +3 max HP per point.' },
  { id: 'dex', name: 'DEX', short: 'higher min dmg, +0.2 both', desc: 'Dexterity: raises your minimum damage (+0.1% per point, up to 105%) and +0.2 ATK and MAGIC per point.' },
  { id: 'int', name: 'INT', short: '+0.9 MAGIC, +2 MP', desc: 'Intelligence: +0.9 MAGIC and +2 max MP per point.' },
  { id: 'luk', name: 'LUK', short: '+crit chance & damage', desc: 'Luck: +0.04% critical chance (up to +20%) and +0.15% critical damage per point.' },
];
export const apOf = (ap, k) => ap?.[k] ?? 0;
export const apTotal = (lvl) => AP_PER_LVL * lvl;
export const apSpent = (ap) => AP_STATS.reduce((n, s) => n + apOf(ap, s.id), 0);
export const MIN_ROLL = 0.85, MAX_ROLL = 1.15; // ±15% before DEX
export const minRollFor = (ap) => Math.min(1.05, MIN_ROLL + 0.001 * apOf(ap, 'dex'));
// Everything about a character's numbers in one place (c: {lvl, gear, skills}).
// buffs: { berserk: true while it's up, rally: the Rally boost (e.g. 0.2) while it's up, brew: a brewed
// potion's buff ({ atk, crit, ward }, ITEMS) while it's up }
export function statsFor(c, buffs = {}) {
  const rage = buffs.berserk ? 1 + SKILLS.berserk.boost(rankOf(c.skills, 'berserk')) : 1;
  const rally = 1 + (buffs.rally ?? 0);
  const brew = buffs.brew ?? {}; // a brewed potion's buff (src/shared/alchemy.js)
  const might = 1 + (brew.atk ?? 0);
  const arcane = 1 + 0.12 * rankOf(c.skills, 'arcane_mind');
  const mastery = rankOf(c.skills, 'sword_mastery');
  // scroll enhancements on the worn gear (rpg.js rollScroll)
  const ge = c.gearE ?? {}, enh = (k) => (ge.sword?.[k] ?? 0) + (ge.helmet?.[k] ?? 0);
  const str = apOf(c.ap, 'str'), dex = apOf(c.ap, 'dex'), int = apOf(c.ap, 'int'), luk = apOf(c.ap, 'luk');
  return {
    atk: Math.round((attackFor(c.lvl, c.gear?.sword) + enh('atk') + 0.6 * str + 0.2 * dex) * rage * rally * might),
    magic: Math.round((magicFor(c.lvl) + enh('magic') + 0.9 * int + 0.2 * dex) * rage * rally * arcane * might),
    def: Math.round((defenseFor(c.gear?.helmet) + enh('def') + 3 * rankOf(c.skills, 'iron_jelly')) * rally),
    maxHp: Math.round((maxHpFor(c.lvl) + enh('hp') + 10 * rankOf(c.skills, 'iron_jelly') + 3 * str) * (1 + 0.08 * rankOf(c.skills, 'vitality'))),
    maxMp: maxMpFor(c.lvl, c.skills) + 2 * int,
    reach: reachFor(c.gear?.sword),
    crit: 0.12 + 0.03 * mastery + Math.min(0.2, 0.0004 * luk) + (brew.crit ?? 0),
    critMult: 1.6 + 0.1 * mastery + 0.0015 * luk,
    minRoll: minRollFor(c.ap),
    hpRegen: 1 + 0.25 * rankOf(c.skills, 'vitality'),
    ward: brew.ward ?? 0, // share of damage taken away (server/rpg.js hurt)
  };
}
export const mpRegen = (skills) => 1 + 0.5 * rankOf(skills, 'mana_flow'); // multiplier
export const magicFor = (lvl) => 5 + lvl * 3; // spell power (swords don't help spells)
