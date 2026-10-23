// Docs: docs/combat/skills.md
import { attackFor, defenseFor, maxHpFor, reachFor, ITEMS, STAFF_BOLT_RANGE } from './rpg.js';
import { DASH_CD, DASH_TICKS, DASH_V, BLINK_DIST, BLINK_CD, FJ_VX, IFR_DASH, IFR_BLINK, IFR_PHANTOM, PHANTOM_CD } from './sim.js';

// Shared by client and server: classes, their skill trees, mana, and the hotbar (story/progression.md,
// story/s2-plan.md). Everyone starts as a Novice; at CLASS_LVL you choose a class at the Rebirth Pool
// (server/rpg.js rebirth). Each class has basics, then two branches (the fork: points in one at a time),
// opening at the advancement levels (`adv` on each skill). Mobility is shared by every class. Active
// skills cost MP and have cooldowns; passives are always on. The server (server/rpg.js) decides every cast.

export const CLASS_LVL = 10; // choose a class from this level (the Rebirth Pool)
// Challenge the Gods (chenyirong's gift): seconds at 1 HP, the damage boost (6 = +600%), the cooldown
export const GODS_DUR = 15, GODS_BOOST = 6, GODS_CD = 120;
// weapon: the only weapon kind the class can wield (null: any) · starter: handed out free on choosing it
// if you own none of that kind · strong / bad: for the Rebirth Pool's card (progression.md 1b)
export const CLASSES = {
  novice: {
    name: 'Novice', weapon: null, stat: null, color: '#e6b85c',
    blurb: 'Every slime starts here: a few basic tricks and any weapon. Choose a class at Lv 10 at the Rebirth Pool.',
    strong: 'trying everything', bad: 'no class skills yet', branches: [],
  },
  warrior: {
    name: 'Warrior', weapon: 'sword', starter: 'wood_sword', stat: 'str', color: '#e0806a',
    blurb: 'A sword and a thick skin. Gets in close, stays on top of its target, and heals a little from every hit.',
    strong: 'toughness, damage up close, catching things', bad: 'range: it has to be right next to its target',
    branches: [
      { id: 'knight', name: 'Knight', blurb: 'Holds the boss: shields, a second wind, buffs for friends.' },
      { id: 'berserker', name: 'Berserker', blurb: 'Hits hardest up close: spins, rage and huge blows.' },
    ],
  },
  mage: {
    name: 'Mage', weapon: 'staff', starter: 'wood_staff', stat: 'int', color: '#7a8cf0',
    blurb: 'A staff and a head full of spells. Hits many mobs at once from afar, freezes and burns them.',
    strong: 'area damage and burst, control', bad: 'toughness (least HP and DEF), and it runs out of MP',
    branches: [
      { id: 'elementalist', name: 'Elementalist', blurb: 'Fire: big bursts over a wide area.' },
      { id: 'frostbinder', name: 'Frostbinder', blurb: 'Ice and storm: slows, long range and control.' },
    ],
  },
};
export const branchOf = (id) => Object.values(CLASSES).flatMap((c) => c.branches).find((b) => b.id === id);

// The trees in the K panel: the Novice tree (Novice points, kept forever), one per class, and Mobility
// (any class, class points; a Novice can't learn it)
export const TREES = [
  { id: 'novice', name: 'Novice', color: CLASSES.novice.color, blurb: 'Basic tricks every slime keeps. Paid with Novice points (Lv 1–9).' },
  { id: 'warrior', name: 'Warrior', color: CLASSES.warrior.color, blurb: CLASSES.warrior.blurb },
  { id: 'mage', name: 'Mage', color: CLASSES.mage.color, blurb: CLASSES.mage.blurb },
  { id: 'wind', name: 'Mobility', color: '#5fc4d8', blurb: 'Dash, double jump and teleport, for every class. Some late bosses need these to dodge.' },
];

// The advancements (progression.md 7): what opens at each level, for the level-up banner
export const ADVANCEMENTS = [
  { lvl: CLASS_LVL, name: '1st advancement' },
  { lvl: 30, name: '2nd advancement' },
  { lvl: 60, name: '3rd advancement' },
  { lvl: 100, name: '4th advancement' },
];
// The banner when you reach an advancement level as class cls
export function advanceText(cls, lvl) {
  const c = CLASSES[cls] ?? CLASSES.novice;
  if (cls === 'novice') return lvl === CLASS_LVL ? `Lv ${lvl}! You can choose your class now: Warrior or Mage, free, at the Rebirth Pool by Elder Mochi in Slimeville.` : `Lv ${lvl}: the ${ADVANCEMENTS.find((a) => a.lvl === lvl)?.name ?? 'next advancement'} is waiting. Choose a class at the Rebirth Pool by Elder Mochi first.`;
  const [a, b] = c.branches;
  if (lvl === 30) return `2nd advancement! Your ${c.name} tree forks (K): ${a.name} or ${b.name}. Points go in one branch at a time; switching back is free.`;
  return `${ADVANCEMENTS.find((x) => x.lvl === lvl)?.name ?? 'An advancement'}! New ${c.name} skills open in your tree (K).`;
}

// cls: 'novice' | a class | 'any' (Mobility) · tree: the K panel tab · branch: the fork (none: basics) ·
// adv: the level it opens at.
// kind: 'strike' (hit the nearest mob ahead) · 'cleave' (the nearest few ahead) · 'spin' (every mob
// around you) · 'storm' (every mob around you, several times) · 'bolt' (first mob ahead, at range; `slow`
// slows it, `stat: 'best'` hits on the better of ATK and MAGIC) · 'fireball' (a bolt that bursts in
// `radius` where it lands) · 'chain' (a bolt that jumps between mobs) · 'nova' (every mob in a radius,
// slowing them) · 'meteor' (a big blast where the first mob ahead stands, a moment later) · 'starfall'
// (every mob in the room) · 'heal' (`self`: just you) · 'buff' (Berserk) · 'shield' (Mana Shield) ·
// 'bubble' (blocks the next hit) · 'rally' (team attack/defence buff) · 'zone' (Sanctuary) · 'aegis'
// (team immunity) · 'gods' (Challenge the Gods) · 'passive'. `fire`: a fire spell (Kindling makes it stronger).
// (S2.5 adds the Warrior's chase moves and S2.6 the Mage's Arcane Charge; S6 the Lv 150 masteries.)
const W = { cls: 'warrior', tree: 'warrior' }, M = { cls: 'mage', tree: 'mage' };
export const SKILLS = {
  // ——— Novice (Novice points, Lv 1, kept forever; weak once you have a class) ———
  slime_bash: {
    cls: 'novice', tree: 'novice', adv: 1, name: 'Slime Bash', kind: 'strike', max: 3, mp: 3, cd: 3, reach: 30,
    mult: (r) => 1.3 + 0.2 * r,
    desc: (r) => `Throw your whole jelly at the nearest mob ahead: ${pct(1.3 + 0.2 * r)} damage.`,
  },
  pebble_toss: {
    cls: 'novice', tree: 'novice', adv: 1, name: 'Pebble Toss', kind: 'bolt', stat: 'best', max: 3, mp: 3, cd: 3, range: 240,
    mult: (r) => 1.1 + 0.2 * r,
    desc: (r) => `Flick a pebble at the first mob ahead, up to 240 px away: ${pct(1.1 + 0.2 * r)} of your ATK or MAGIC, whichever is higher.`,
  },
  jelly_patch: {
    cls: 'novice', tree: 'novice', adv: 1, name: 'Jelly Patch', kind: 'heal', self: true, max: 3, mp: 6, cd: 30, radius: 40,
    amount: (r) => 20 + 15 * r,
    desc: (r) => `Patch yourself up: heal ${20 + 15 * r} HP. Cooldown 30 s.`,
  },

  // ——— Warrior (sword, STR) ———
  power_strike: {
    ...W, adv: 10, name: 'Power Strike', kind: 'strike', max: 3, mp: 6, cd: 1.2, reach: 40,
    mult: (r) => 1.8 + 0.6 * r,
    desc: (r) => `A heavy swing at the nearest mob ahead: ${pct(1.8 + 0.6 * r)} damage.`,
  },
  cleave: {
    ...W, adv: 10, name: 'Cleave', kind: 'cleave', max: 3, mp: 10, cd: 2, reach: 70, targets: 3,
    mult: (r) => 1.5 + 0.4 * r,
    desc: (r) => `A wide swing through up to 3 mobs ahead: ${pct(1.5 + 0.4 * r)} damage each.`,
  },
  iron_jelly: {
    ...W, adv: 10, name: 'Iron Jelly', kind: 'passive', max: 3,
    desc: (r) => `Tougher jelly: +${5 * r} DEF and +${17 * r} max HP.`,
  },
  jelly_thirst: {
    ...W, adv: 10, name: 'Jelly Thirst', kind: 'passive', max: 3,
    share: (r) => 0.01 * r,
    desc: (r) => `Every hit you land heals you ${Math.round(1 * r)}% of the damage it did.`,
  },
  // Knight
  jelly_bubble: {
    ...W, branch: 'knight', adv: 30, name: 'Jelly Bubble', kind: 'bubble', max: 3, mp: 20, cd: 45, dur: 8,
    cdFor: (r) => 45 - 7 * (r - 1),
    desc: (r) => `A wobbly bubble that blocks the next hit within 8 s, even a boss's ultimate. Cooldown ${45 - 7 * (r - 1)} s.`,
  },
  vitality: {
    ...W, branch: 'knight', adv: 30, name: 'Vitality', kind: 'passive', max: 5,
    desc: (r) => `+${8 * r}% max HP, and HP comes back faster.`,
  },
  rally: {
    ...W, branch: 'knight', adv: 30, name: 'Rally', kind: 'rally', max: 3, mp: 25, cd: 30, radius: 300, dur: 20,
    boost: (r) => 0.1 + 0.1 * r,
    desc: (r) => `Rally every friend within 300 px, you too: +${Math.round((0.1 + 0.1 * r) * 100)}% attack and defence for 20 s. Cooldown 30 s.`,
  },
  second_wind: {
    ...W, branch: 'knight', adv: 30, name: 'Second Wind', kind: 'passive', max: 3,
    cdFor: (r) => [0, 120, 90, 60][r],
    desc: (r) => `A hit that would knock you out leaves you at 1 HP instead. Once every ${[0, 120, 90, 60][r]} s.`,
  },
  sanctuary: {
    ...W, branch: 'knight', adv: 60, name: 'Sanctuary', kind: 'zone', max: 3, mp: 45, cd: 50, radius: 160, dur: 8,
    cut: (r) => 0.5 + 0.1 * r,
    desc: (r) => `A holy circle for 8 s: friends inside take ${Math.round((0.5 + 0.1 * r) * 100)}% less damage, and boss ultimates can't knock them out.`,
  },
  aegis: {
    ...W, branch: 'knight', adv: 100, name: 'Aegis', kind: 'aegis', max: 3, mp: 60, cd: 90, radius: 260, dur: (r) => 1.5 + 0.5 * r,
    desc: (r) => `You and every friend within 260 px can't be hurt at all for ${1.5 + 0.5 * r} s.`,
  },
  // Berserker
  whirlwind: {
    ...W, branch: 'berserker', adv: 30, name: 'Whirlwind', kind: 'spin', max: 5, mp: 14, cd: 4, radius: 100,
    mult: (r) => 1.0 + 0.2 * r,
    desc: (r) => `Spin and hit every mob within 100 px: ${pct(1.0 + 0.2 * r)} damage each.`,
  },
  berserk: {
    ...W, branch: 'berserker', adv: 30, name: 'Berserk', kind: 'buff', max: 3, mp: 20, cd: 30, dur: 20,
    boost: (r) => 0.25 + 0.1 * r,
    desc: (r) => `Battle rage: +${Math.round((0.25 + 0.1 * r) * 100)}% attack for 20 s.`,
  },
  sword_mastery: {
    ...W, branch: 'berserker', adv: 60, name: 'Sword Mastery', kind: 'passive', max: 5,
    desc: (r) => `+${3 * r}% critical chance and critical hits do +${10 * r}% more damage.`,
  },
  blade_storm: {
    ...W, branch: 'berserker', adv: 60, name: 'Blade Storm', kind: 'storm', max: 3, mp: 30, cd: 12, radius: 130, hits: 4,
    mult: (r) => 0.8 + 0.15 * r,
    desc: (r) => `A storm of slashes: hits every mob within 130 px 4 times for ${pct(0.8 + 0.15 * r)} each.`,
  },
  sky_splitter: {
    ...W, branch: 'berserker', adv: 100, name: 'Sky Splitter', kind: 'strike', max: 3, mp: 50, cd: 45, reach: 90,
    mult: (r) => 5 + 1.5 * r,
    desc: (r) => `One enormous overhead blow at the mob ahead: ${pct(5 + 1.5 * r)} damage.`,
  },

  // ——— Mage (staff, INT) ———
  magic_bolt: {
    ...M, adv: 10, name: 'Magic Bolt', kind: 'bolt', max: 3, mp: 5, cd: 0.8, range: 380,
    mult: (r) => 1.1 + 0.33 * r,
    desc: (r) => `A bolt at the first mob ahead, up to 380 px away: ${pct(1.1 + 0.33 * r)} magic damage.`,
  },
  mana_flow: {
    ...M, adv: 10, name: 'Mana Flow', kind: 'passive', max: 3,
    desc: (r) => `+${25 * r} max MP, and MP comes back ${r ? `${Math.round(mpRegenOf(r) * 10) / 10}×` : ''} faster.`,
  },
  arcane_mind: {
    ...M, adv: 10, name: 'Arcane Mind', kind: 'passive', max: 3,
    desc: (r) => `+${20 * r}% magic power.`,
  },
  mana_shield: {
    ...M, adv: 10, name: 'Mana Shield', kind: 'shield', max: 3, mp: 20, cd: 30, dur: 60,
    share: (r) => 0.2 + 0.1 * r,
    desc: (r) => `For 60 s, ${Math.round((0.2 + 0.1 * r) * 100)}% of the damage you take comes off your MP instead of your HP.`,
  },
  // Elementalist (fire)
  fireball: {
    ...M, branch: 'elementalist', adv: 30, name: 'Fireball', kind: 'fireball', fire: true, max: 5, mp: 12, cd: 2.5, range: 380, radius: 70,
    mult: (r) => 1.3 + 0.2 * r,
    desc: (r) => `A ball of fire at the first mob ahead that bursts where it lands: ${pct(1.3 + 0.2 * r)} magic damage to everything within 70 px.`,
  },
  meteor: {
    ...M, branch: 'elementalist', adv: 60, name: 'Meteor', kind: 'meteor', fire: true, max: 3, mp: 40, cd: 15, range: 450, radius: 150, delay: 0.8,
    mult: (r) => 3.5 + 0.6 * r,
    desc: (r) => `Calls a meteor down on the first mob ahead: ${pct(3.5 + 0.6 * r)} magic damage to everything within 150 px.`,
  },
  kindling: {
    ...M, branch: 'elementalist', adv: 60, name: 'Kindling', kind: 'passive', max: 5,
    desc: (r) => `Your fire spells (Fireball, Meteor, Starfall) hit ${6 * r}% harder.`,
  },
  starfall: {
    ...M, branch: 'elementalist', adv: 100, name: 'Starfall', kind: 'starfall', fire: true, max: 3, mp: 70, cd: 60, radius: 700,
    mult: (r) => 2.5 + 0.6 * r,
    desc: (r) => `Stars rain on every mob within 700 px: ${pct(2.5 + 0.6 * r)} magic damage each.`,
  },
  // Frostbinder (ice and storm)
  frost_nova: {
    ...M, branch: 'frostbinder', adv: 30, name: 'Frost Nova', kind: 'nova', max: 3, mp: 30, cd: 10, radius: 190, slow: 4,
    mult: (r) => 1.8 + 0.4 * r,
    desc: (r) => `A burst of frost: ${pct(1.8 + 0.4 * r)} magic damage to every mob within 190 px, slowing them for 4 s.`,
  },
  chain_lightning: {
    ...M, branch: 'frostbinder', adv: 30, name: 'Chain Lightning', kind: 'chain', max: 5, mp: 14, cd: 3, range: 380, jump: 220, targets: 4,
    mult: (r) => 1.0 + 0.15 * r,
    desc: (r) => `Lightning that leaps between up to 4 mobs: ${pct(1.0 + 0.15 * r)} magic damage each.`,
  },
  glacial_spike: {
    ...M, branch: 'frostbinder', adv: 60, name: 'Glacial Spike', kind: 'bolt', ice: true, max: 5, mp: 16, cd: 4, range: 560, slow: 5,
    mult: (r) => 2 + 0.3 * r,
    desc: (r) => `A spike of ice at the first mob ahead, up to 560 px away: ${pct(2 + 0.3 * r)} magic damage, and it's slowed hard for 5 s.`,
  },
  absolute_zero: {
    ...M, branch: 'frostbinder', adv: 100, name: 'Absolute Zero', kind: 'nova', ice: true, max: 3, mp: 60, cd: 45, radius: 320, slow: 8,
    mult: (r) => 3 + 0.6 * r,
    desc: (r) => `Everything freezes: ${pct(3 + 0.6 * r)} magic damage to every mob within 320 px, slowing them for 8 s.`,
  },

  // ——— Gifts: one player's own skill, granted by the server on load (server/rpg.js), never learned or
  // taken back, outside the point counts. `gift`: the account it belongs to. Shown in the Novice tab.
  challenge_gods: {
    cls: 'gift', tree: 'gift', gift: 'chenyirong', adv: 1, name: 'Challenge the Gods', kind: 'gods', max: 1, mp: 0, cd: GODS_CD, dur: GODS_DUR,
    boost: GODS_BOOST,
    desc: () => `The slime gods have seen your stubbornness and wish to test your will. For ${GODS_DUR} s your HP drops to 1 and can't rise above it, and you deal +${GODS_BOOST * 100}% damage. Survive and you're healed to full. Cooldown ${GODS_CD} s.`,
  },

  // ——— Mobility (every class, class points): movement runs in the shared physics (sim.js step), from
  // input bits, so it's predicted exactly. 'move' skills have their own keys (Shift: Dash, V: Blink) and
  // can sit on the hotbar too; they cost no MP. Dash and Blink make you untouchable for a moment
  // ("i-frames"): that's how you get through the tall sweeps and the Colossus's / Chronos's ultimates.
  dash: {
    cls: 'any', tree: 'wind', adv: 10, name: 'Dash', kind: 'move', max: 3, mp: 0, cdFor: (r) => DASH_CD[r] / 60, key: 'Shift',
    desc: (r) => `Shift: burst ${Math.round((DASH_V * DASH_TICKS) / 60)} px the way you face (in the air too), untouchable for ${secs(IFR_DASH)}. Cooldown ${DASH_CD[Math.max(1, r)] / 60} s.`,
  },
  flash_jump: {
    cls: 'any', tree: 'wind', adv: 10, name: 'Flash Jump', kind: 'passive', max: 3,
    desc: (r) => `Press Jump again in mid-air for a second, forward-flying jump (${FJ_VX[Math.max(1, r)]} px/s).`,
  },
  blink: {
    cls: 'any', tree: 'wind', adv: 30, name: 'Blink', kind: 'move', max: 3, mp: 0, cdFor: (r) => BLINK_CD[r] / 60, key: 'V',
    desc: (r) => `V: teleport ${BLINK_DIST[Math.max(1, r)]} px the way you face, straight through anything, untouchable for ${secs(IFR_BLINK)}. Cooldown ${BLINK_CD[Math.max(1, r)] / 60} s.`,
  },
  phantom_step: {
    cls: 'any', tree: 'wind', adv: 60, name: 'Phantom Step', kind: 'passive', max: 2,
    desc: (r) => `Dash and Blink keep you untouchable ${secs(IFR_PHANTOM * Math.max(1, r))} longer and cool down ${Math.round(PHANTOM_CD * Math.max(1, r) * 100)}% faster.`,
  },
};
const secs = (ticks) => `${Math.round((ticks / 60) * 100) / 100} s`;
function pct(m) {
  return `${Math.round(m * 100)}%`;
}
export const cooldownOf = (id, rank) => SKILLS[id].cdFor?.(rank) ?? SKILLS[id].cd;
// The movement abilities a character has, packed for the physics (sim.js step reads state.mv):
// bits 0–1 Dash rank · 2–3 Flash Jump · 4–5 Blink · 6–7 Phantom Step
export const mobilityOf = (skills) => rankOf(skills, 'dash') | (rankOf(skills, 'flash_jump') << 2) | (rankOf(skills, 'blink') << 4) | (rankOf(skills, 'phantom_step') << 6);
export const durOf = (id, rank) => (typeof SKILLS[id].dur === 'function' ? SKILLS[id].dur(rank) : SKILLS[id].dur);
export const ACTIVE = (id) => SKILLS[id] && SKILLS[id].kind !== 'passive';

export const HOTBAR = 6; // skill slots, keys 1–6 (a skill id or null)
export const POTBAR = 3; // potion slots, keys 7–9 (a potion item id or null)

export const rankOf = (skills, id) => skills?.[id] ?? 0;

// ——— skill points: two separate counts, so the Novice tree can never eat class points ———
// Novice points: one a level up to SP_NOVICE_LVL (exactly fills the Novice tree). Class points (the class
// tree and Mobility) from CLASS_LVL: SP_CLASS_START, then one every SP_EVERY_EARLY levels to Lv 60, one
// every SP_EVERY_LATE levels to SP_CAP_LVL, and SP_ADV_BONUS more at each later advancement (30, 60, 100).
// Sized so you finish one branch and some of Mobility, never everything. Nothing past SP_CAP_LVL (S6).
export const SP_NOVICE_LVL = 9, SP_CLASS_START = 3, SP_EVERY_EARLY = 3, SP_EVERY_LATE = 10, SP_ADV_BONUS = 2, SP_CAP_LVL = 200;
export const spNovice = (lvl) => Math.max(0, Math.min(lvl, SP_NOVICE_LVL));
export function spClass(lvl) {
  if (lvl < CLASS_LVL) return 0;
  const L = Math.min(lvl, SP_CAP_LVL);
  let n = SP_CLASS_START + Math.floor((Math.min(L, 60) - CLASS_LVL) / SP_EVERY_EARLY);
  if (L > 60) n += Math.floor((L - 60) / SP_EVERY_LATE);
  for (const a of ADVANCEMENTS) if (a.lvl > CLASS_LVL && L >= a.lvl) n += SP_ADV_BONUS;
  return n;
}
const poolOf = (id) => (SKILLS[id]?.gift ? 'gift' : SKILLS[id]?.cls === 'novice' ? 'novice' : 'class');
export const spSpentIn = (skills, pool) => Object.entries(skills ?? {}).reduce((n, [id, r]) => n + (SKILLS[id] && poolOf(id) === pool ? r : 0), 0);
// points left to spend: { novice, cls } (a Novice's class points pile up until it chooses a class)
export const spLeft = (c) => ({ novice: spNovice(c.lvl) - spSpentIn(c.skills, 'novice'), cls: spClass(c.lvl) - spSpentIn(c.skills, 'class') });
// what the HUD counts as "points to spend"
export const spFree = (c) => {
  const l = spLeft(c);
  return Math.max(0, l.novice) + (c.cls && c.cls !== 'novice' ? Math.max(0, l.cls) : 0);
};
// the gift skills held (they survive a reset, a rebirth and a rollback)
export const giftsOf = (skills) => Object.fromEntries(Object.entries(skills ?? {}).filter(([id]) => SKILLS[id]?.gift));
export const pointsIn = (skills, tree) => Object.entries(skills ?? {}).reduce((n, [id, r]) => n + (SKILLS[id]?.tree === tree ? r : 0), 0);
export const branchPoints = (skills, branch) => Object.entries(skills ?? {}).reduce((n, [id, r]) => n + (SKILLS[id]?.branch === branch ? r : 0), 0);
// the branch of the fork you hold points in (null: none yet)
export const heldBranch = (skills) => Object.keys(skills ?? {}).map((id) => SKILLS[id]?.branch).find(Boolean) ?? null;
// can class cls use skill id at all?
export const skillFor = (cls, id) => {
  const sk = SKILLS[id];
  return !!sk && (sk.cls === 'novice' || !!sk.gift || sk.cls === cls || (sk.cls === 'any' && !!cls && cls !== 'novice'));
};

// Can this skill take another point? (c: {lvl, cls, skills}) → null if so, else why not
export function cantLearn(c, id) {
  const sk = SKILLS[id];
  if (!sk) return 'Unknown skill';
  if (sk.gift) return "A gift from the gods: it can't be learned";
  const cls = c.cls ?? 'novice';
  if (rankOf(c.skills, id) >= sk.max) return 'Maxed out';
  if (sk.cls === 'any' && cls === 'novice') return `Choose a class first (at Lv ${CLASS_LVL}, at the Rebirth Pool by Elder Mochi)`;
  if (!skillFor(cls, id)) return `That's a ${CLASSES[sk.cls].name} skill`;
  if (c.lvl < sk.adv) return `Opens at Lv ${sk.adv}`;
  const held = heldBranch(c.skills);
  if (sk.branch && held && held !== sk.branch) return `Take your ${branchOf(held).name} points back first`;
  const left = spLeft(c)[poolOf(id) === 'novice' ? 'novice' : 'cls'];
  if (left <= 0) return poolOf(id) === 'novice' ? 'No Novice points left (one a level up to Lv 9)' : 'No class points left (more come as you level)';
  return null;
}
// Can a point be taken back out of this skill? → null if so. (Always, free: no skill needs another.)
export function cantUnlearn(c, id) {
  if (!SKILLS[id] || !rankOf(c.skills, id)) return 'Nothing to take back';
  if (SKILLS[id].gift) return "A gift from the gods can't be given back";
  return null;
}
// The skills c may keep (on loading a save): the ones its class can use and its level has opened, while
// the points add up and the fork holds; anything else and they all come back as points ({})
export function cleanSkills(c) {
  const s = Object.fromEntries(Object.entries(c.skills ?? {}).filter(([id, n]) => skillFor(c.cls, id) && n > 0 && c.lvl >= SKILLS[id].adv).map(([id, n]) => [id, Math.min(n | 0, SKILLS[id].max)]).filter(([, n]) => n > 0));
  const branches = new Set(Object.keys(s).map((id) => SKILLS[id].branch).filter(Boolean));
  const left = spLeft({ ...c, skills: s });
  return branches.size > 1 || left.novice < 0 || left.cls < 0 ? {} : s;
}
// Can class cls hold weapon item id? (a Novice: anything)
export const weaponOk = (cls, id) => !id || !CLASSES[cls]?.weapon || ITEMS[id]?.kind === CLASSES[cls].weapon;

const mpRegenOf = (r) => 1 + 0.83 * r;
export const maxMpFor = (lvl, skills) => 20 + lvl * 6 + 25 * rankOf(skills, 'mana_flow');

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
// buffs: { gods: true while Challenge the Gods is up (HP capped at 1, damage boosted), berserk: true while it's up, rally: the Rally boost (e.g. 0.2) while it's up, manaShield: true
// while Mana Shield is up, brew: a brewed potion's buff ({ atk, crit, ward, regen, ... }, ITEMS) while it's up }
export function statsFor(c, buffs = {}) {
  const rage = buffs.berserk ? 1 + SKILLS.berserk.boost(rankOf(c.skills, 'berserk')) : 1;
  const rally = 1 + (buffs.rally ?? 0);
  const brew = buffs.brew ?? {}; // a brewed potion's buff (src/shared/alchemy.js)
  const might = (1 + (brew.atk ?? 0)) * (buffs.gods ? 1 + GODS_BOOST : 1);
  const arcane = 1 + 0.2 * rankOf(c.skills, 'arcane_mind');
  const mastery = rankOf(c.skills, 'sword_mastery');
  // scroll enhancements on the worn gear (rpg.js rollScroll)
  const ge = c.gearE ?? {}, enh = (k) => (ge.weapon?.[k] ?? 0) + (ge.helmet?.[k] ?? 0);
  const staff = ITEMS[c.gear?.weapon]?.kind === 'staff' ? ITEMS[c.gear.weapon] : null; // (S1: spells grow with a staff)
  const str = apOf(c.ap, 'str'), dex = apOf(c.ap, 'dex'), int = apOf(c.ap, 'int'), luk = apOf(c.ap, 'luk');
  const ms = rankOf(c.skills, 'mana_shield');
  return {
    atk: Math.round((attackFor(c.lvl, c.gear?.weapon) + enh('atk') + 0.6 * str + 0.2 * dex) * rage * rally * might),
    magic: Math.round((magicFor(c.lvl) + (staff?.magic ?? 0) + enh('magic') + 0.9 * int + 0.2 * dex) * rage * rally * arcane * might),
    def: Math.round((defenseFor(c.gear?.helmet) + enh('def') + 5 * rankOf(c.skills, 'iron_jelly')) * rally),
    maxHp: buffs.gods ? 1 : Math.round((maxHpFor(c.lvl) + enh('hp') + 17 * rankOf(c.skills, 'iron_jelly') + 3 * str) * (1 + 0.08 * rankOf(c.skills, 'vitality'))),
    maxMp: maxMpFor(c.lvl, c.skills) + 2 * int + (staff?.mp ?? 0),
    reach: staff ? 0 : reachFor(c.gear?.weapon), // a sword's extra reach (swings and blade skills)
    boltRange: staff ? STAFF_BOLT_RANGE + staff.reach : 0, // a staff bolt's range
    crit: 0.12 + 0.03 * mastery + Math.min(0.2, 0.0004 * luk) + (brew.crit ?? 0),
    critMult: 1.6 + 0.1 * mastery + 0.0015 * luk,
    minRoll: minRollFor(c.ap),
    hpRegen: (1 + 0.25 * rankOf(c.skills, 'vitality')) * (1 + (brew.regen ?? 0)),
    ward: brew.ward ?? 0, // share of damage taken away (server/rpg.js hurt)
    thirst: SKILLS.jelly_thirst.share(rankOf(c.skills, 'jelly_thirst')), // share of damage dealt that heals you (Jelly Thirst)
    manaShield: buffs.manaShield && ms ? SKILLS.mana_shield.share(ms) : 0, // share of damage taken that comes off MP (hurt)
    fire: 1 + 0.06 * rankOf(c.skills, 'kindling'), // fire spells' multiplier (Kindling)
  };
}
export const mpRegen = (skills) => mpRegenOf(rankOf(skills, 'mana_flow')); // multiplier
export const magicFor = (lvl) => 5 + lvl * 3; // spell power from the level (a staff adds its magic; swords don't help spells)
