// Docs: docs/combat/skills.md
import { attackFor, defenseFor, maxHpFor, reachFor, ITEMS, STAFF_BOLT_RANGE, BOW_RANGE, heavyHit } from './rpg.js';
import { DASH_CD, DASH_TICKS, DASH_V, BLINK_DIST, BLINK_CD, FJ_VX, IFR_DASH, IFR_BLINK, IFR_PHANTOM, PHANTOM_CD, SLAM_CD, UPCUT_CD, CHARGE_RESET, HOOK_CD, HOOK_RANGE } from './sim.js';

// Shared by client and server: classes, their skill trees, mana, and the hotbar (story/progression.md,
// story/archive/s2-plan.md). Everyone starts as a Novice; at CLASS_LVL you choose a class at the Rebirth Pool
// (server/rpg.js rebirth). Each class has basics, then two branches (both learnable since 2026-10-24),
// opening at the advancement levels (`adv` on each skill). Mobility is shared by every class. Active
// skills cost MP and have cooldowns; passives are always on. The server (server/rpg.js) decides every cast.

export const CLASS_LVL = 10; // choose a class from this level (the Rebirth Pool)
// Challenge the Gods (a gift: chenyirong's and justin's): seconds at 1 HP, the damage boost (6 = +600%), the cooldown
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
  // S3 (story/progression.md 5): the other staff class. Its normal attack is the holy bolt (HOLY_BOLT_*)
  cleric: {
    name: 'Cleric', weapon: 'staff', starter: 'wood_staff', stat: 'int', color: '#5fc79a',
    blurb: 'A staff and a soft halo. Heals and shields its friends, calls spirits to fight beside it, and almost never goes down.',
    strong: 'staying alive, keeping friends alive, summons', bad: 'damage: it kills slowest, crowds most of all',
    branches: [
      { id: 'priest', name: 'Priest', blurb: 'Big heals, a heal that lingers, a healing wisp, and getting fallen friends back up.' },
      { id: 'warden', name: 'Warden', blurb: 'Spirits and a totem that hold the boss, and barriers before the big hits.' },
    ],
  },
  // S4 (story/progression.md 4): the bow class. Its normal attack is a bow shot (BOW_SHOT_*); DEX is its main stat
  archer: {
    name: 'Archer', weapon: 'bow', starter: 'wood_bow', stat: 'dex', color: '#a6b04a',
    blurb: 'A bow and quick feet. Keeps its distance, kites whatever chases it, and hits hardest from far away.',
    strong: 'steady damage from range, staying on the move', bad: 'crowds of mobs, and anything that gets up close',
    branches: [
      { id: 'sniper', name: 'Sniper', blurb: 'One arrow at a time: long shots, arrows that go right through, and a mark that helps the whole party.' },
      { id: 'trapper', name: 'Trapper', blurb: 'Nets, slows and arrows from the sky: stops whatever chases you, and handles a crowd.' },
    ],
  },
};
// the classes you can choose at the Rebirth Pool, by name ("Warrior, Mage or Cleric")
export const classNames = (join = 'or') => {
  const n = Object.entries(CLASSES).filter(([id]) => id !== 'novice').map(([, c]) => c.name);
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} ${join} ${n.at(-1)}` : n[0];
};
// "a Mage", "an Archer"
export const aOrAn = (w) => `${/^[aeiou]/i.test(w) ? 'an' : 'a'} ${w}`;
export const branchOf = (id) => Object.values(CLASSES).flatMap((c) => c.branches).find((b) => b.id === id);

// The trees in the K panel: the Novice tree (Novice points, kept forever), one per class, and Mobility
// (any class, class points; a Novice can't learn it)
export const TREES = [
  { id: 'novice', name: 'Novice', color: CLASSES.novice.color, blurb: 'Basic tricks every slime keeps. Paid with Novice points (Lv 1–9).' },
  { id: 'warrior', name: 'Warrior', color: CLASSES.warrior.color, blurb: CLASSES.warrior.blurb },
  { id: 'mage', name: 'Mage', color: CLASSES.mage.color, blurb: CLASSES.mage.blurb },
  { id: 'cleric', name: 'Cleric', color: CLASSES.cleric.color, blurb: CLASSES.cleric.blurb },
  { id: 'archer', name: 'Archer', color: CLASSES.archer.color, blurb: CLASSES.archer.blurb },
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
  if (cls === 'novice') return lvl === CLASS_LVL ? `Lv ${lvl}! You can choose your class now: ${classNames()}, free, at the Rebirth Pool by Elder Mochi in Slimeville.` : `Lv ${lvl}: the ${ADVANCEMENTS.find((a) => a.lvl === lvl)?.name ?? 'next advancement'} is waiting. Choose a class at the Rebirth Pool by Elder Mochi first.`;
  const [a, b] = c.branches;
  if (lvl === 30) return `2nd advancement! Your ${c.name} tree opens two branches (K): ${a.name} and ${b.name}. Learn from both; your hotbar decides what you bring.`;
  return `${ADVANCEMENTS.find((x) => x.lvl === lvl)?.name ?? 'An advancement'}! New ${c.name} skills open in your tree (K).`;
}

// cls: 'novice' | a class | 'any' (Mobility) · tree: the K panel tab · branch: which of the two branches (none: basics) ·
// adv: the level it opens at.
// kind: 'strike' (hit the nearest mob ahead) · 'cleave' (the nearest few ahead) · 'spin' (every mob
// around you) · 'storm' (every mob around you, several times) · 'bolt' (first mob ahead, at range; `slow`
// slows it, `stat: 'best'` hits on the better of ATK and MAGIC) · 'fireball' (a bolt that bursts in
// `radius` where it lands) · 'chain' (a bolt that jumps between mobs) · 'nova' (every mob in a radius,
// slowing them) · 'meteor' (a big blast where the first mob ahead stands, a moment later) · 'starfall'
// (every mob in the room) · 'heal' (`self`: just you) · 'buff' (Berserk) · 'shield' (Mana Shield, a `toggle`: cast it again to turn it off) ·
// 'bubble' (blocks the next hit) · 'rally' (team attack/defence buff) · 'zone' (Sanctuary) · 'aegis'
// (team immunity) · 'wave' (SP2's Shockwave: every mob on your floor within `range` both ways) · 'gods' (Challenge the Gods) · 'chase' (the Warrior's chase moves: no hotbar, no MP, set off
// by movement + Attack inside sim.js step(); `how` says which) · 'passive'. `fire`: a fire spell (Kindling makes it stronger).
// `el`: the spell's element for the Mage's combos (S2.6, ELEMENTS below): 'frost' chills / freezes, 'fire' burns
// and shatters a frozen mob, 'storm' spreads a burn. (S6 adds the Lv 150 masteries.)
// The Cleric's kinds (S3): 'heal' with `power` (× MAGIC × Holy Power; Jelly Patch's `amount` is flat) · 'mend' (a
// heal over time) · 'summon' (`what`: 'spirit' | 'wisp' | 'totem' | 'seraph': server-run helpers, SUMMONS below)
// · 'revive' (fainted friends back up) · 'miracle' (heal everyone, revive everyone) · 'barrier' (soaks damage, or
// one ultimate) · 'cleanse' (S5.2: lifts a boss's curse). `holy` + `smite` on a bolt: it heals the caster a share of its damage.
// The Archer's kinds (S4, all on ATK): 'shot' (`arrows` arrows at the first mob ahead within `range`; `far`: more
// damage past FAR_PX) · 'pierce' (an arrow through every mob in a line ahead, up to `targets`) · 'rain' (arrows
// falling `hits` times on every mob within `radius` of the first mob ahead) · 'mark' (Hunter's Mark: everyone's
// hits on the first mob ahead do `boost` more for `dur`) · 'summon' with `what: 'net'` (Net Trap, server-run).
// SP1 (the skill pool's machinery, after the Archer's constants below): 'buff' with `fx` (a long buff, `party`
// radius) · 'field' (an area that hits whatever is inside for a while) · on any hitting skill: `dot` (bleed /
// poison), `pull`, `taunt`, `onKill` (also on passives) · new summon `what`s: phoenix, sprite, guardian, hawk, blast.
const W = { cls: 'warrior', tree: 'warrior' }, M = { cls: 'mage', tree: 'mage' }, C = { cls: 'cleric', tree: 'cleric' }, A = { cls: 'archer', tree: 'archer' };
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
    desc: (r) => `Flick a pebble at the first mob ahead (range 240): ${pct(1.1 + 0.2 * r)} of your ATK or MAGIC, whichever is higher.`,
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
    ...W, adv: 10, name: 'Cleave', kind: 'cleave', max: 3, mp: 10, cd: 2, reach: 70, targets: (r) => 2 + Math.max(1, r), // (SP2: more mobs with rank)
    mult: (r) => 1.5 + 0.4 * r,
    desc: (r) => `A wide swing through up to ${2 + Math.max(1, r)} mobs ahead: ${pct(1.5 + 0.4 * r)} damage each.`,
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
  // the chase moves (S2.5, story/progression.md 1c): short moves toward the target, each its own press
  charge: {
    ...W, adv: 10, name: 'Charge', kind: 'chase', max: 2, how: 'Dash, then hit',
    mult: (r) => [1, 1.8, 2.2][r],
    desc: (r) => `Hit a mob while you Dash (or just after) for ${pct([1, 1.8, 2.2][Math.max(1, r)])} damage: the dash stops on it and ${Math.round(CHARGE_RESET[Math.max(1, r)] * 100)}% of Dash's cooldown comes back, so you can chain charge, hit, charge. Needs Dash.`,
  },
  leap_slam: {
    ...W, adv: 10, name: 'Leap Slam', kind: 'chase', max: 2, how: 'In the air: Down + Attack', radius: 100, cdFor: (r) => SLAM_CD[r] / 60,
    mult: (r) => 1.8 + 0.5 * r,
    desc: (r) => `In the air, hold Down and attack: drop straight down and slam every mob within range 100 of where you land for ${pct(1.8 + 0.5 * Math.max(1, r))} damage. Cooldown ${SLAM_CD[Math.max(1, r)] / 60} s.`,
  },
  upward_cut: {
    ...W, adv: 10, name: 'Upward Cut', kind: 'chase', max: 2, how: 'Jump, then attack while rising', reach: 160, cdFor: (r) => UPCUT_CD[r] / 60,
    mult: (r) => 1.0 + 0.3 * r,
    desc: (r) => `Attack while you're still rising from a jump: the swing carries you higher and cuts every mob up to 160 above you for ${pct(1.0 + 0.3 * Math.max(1, r))} damage. For mobs on a ledge. Cooldown ${UPCUT_CD[Math.max(1, r)] / 60} s.`,
  },
  momentum: {
    ...W, adv: 10, name: 'Momentum', kind: 'passive', max: 2,
    per: (r) => [0, 0.02, 0.03][r],
    desc: (r) => `Every Charge, Leap Slam or Upward Cut that lands adds a stack: +${Math.round([0, 0.02, 0.03][Math.max(1, r)] * 100)}% attack each, up to ${MOMENTUM_MAX}. They last ${MOMENTUM_DUR} s, and all go if you stand still.`,
  },
  // SP2 (story/skills-plan.md): the basics' long buff, and Hook, a fifth chase move
  war_cry: {
    ...W, adv: 10, name: 'War Cry', kind: 'buff', max: 3, mp: 20, cd: 30, dur: 240, party: 300,
    fx: (r) => ({ atk: 0.02 * r }),
    desc: (r) => `A roar that lasts: +${pct(SKILLS.war_cry.fx(R1(r)).atk)} attack for you and every friend within range 300, for 4 min.`,
  },
  hook: {
    ...W, adv: 10, name: 'Hook', kind: 'chase', max: 2, how: 'Down + Dash, facing a mob', cdFor: (r) => HOOK_CD[r] / 60, range: HOOK_RANGE,
    mult: (r) => 1.2 + 0.3 * r,
    desc: (r) => `Hold Down and Dash toward a mob (range ${HOOK_RANGE}): a chain flies out, hooks it and yanks you to it, and the landing hits it for ${pct(SKILLS.hook.mult(R1(r)))} damage. Nothing ahead and the chain comes back empty. Cooldown ${HOOK_CD[R1(r)] / 60} s. Needs Dash.`,
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
    // it also taunts (S5, owner 2026-10-24: Taunt folded into Rally): every mob within range turns on you for
    // TAUNT_S s (src/shared/rpg.js), and a boss's focus moves to you (server/rpg.js taunt)
    desc: (r) => `Rally every friend within range 300, you too: +${Math.round((0.1 + 0.1 * r) * 100)}% attack and defence for 20 s. It also taunts: every enemy in range turns on you for a few seconds, and a boss's focus moves to you. Cooldown 30 s.`,
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
  // SP2: the Knight gathers the pack and holds it
  ground_shake: {
    ...W, branch: 'knight', adv: 30, name: 'Ground Shake', kind: 'spin', max: 3, mp: 18, cd: 10, radius: 170, pull: 90, taunt: true, anim: 'shake',
    mult: (r) => 0.7 + 0.1 * r,
    desc: (r) => `Slam the floor: every mob within range 170 is hit for ${pct(SKILLS.ground_shake.mult(R1(r)))} damage, dragged a little toward you and turns on you. Never drags a boss. Cooldown ${SKILLS.ground_shake.cd} s.`,
  },
  shield_bash: {
    ...W, branch: 'knight', adv: 30, name: 'Shield Bash', kind: 'strike', max: 3, mp: 14, cd: 10, reach: 40, stun: true, anim: 'bash',
    mult: (r) => 2.8 + 0.4 * r,
    desc: (r) => `Ram your shield into the mob ahead: ${pct(SKILLS.shield_bash.mult(R1(r)))} damage, and an ordinary mob is stunned for ${STUN_S} s (a boss only flinches). Cooldown ${SKILLS.shield_bash.cd} s.`,
  },
  shockwave: {
    ...W, branch: 'knight', adv: 60, name: 'Shockwave', kind: 'wave', max: 3, mp: 26, cd: 10, range: 280,
    mult: (r) => 1.2 + 0.2 * r,
    desc: (r) => `Stamp so hard a wave runs along the floor both ways (range ${SKILLS.shockwave.range} each side): ${pct(SKILLS.shockwave.mult(R1(r)))} damage to every mob standing on your floor. Cooldown ${SKILLS.shockwave.cd} s.`,
  },
  holy_lance: {
    ...W, branch: 'knight', adv: 60, name: 'Holy Lance', kind: 'cleave', max: 3, mp: 30, cd: 16, reach: 150, targets: 2, anim: 'lance',
    mult: (r) => 3.8 + 0.4 * r,
    desc: (r) => `A long thrust of light that runs through the first 2 mobs ahead: ${pct(SKILLS.holy_lance.mult(R1(r)))} damage each. Cooldown ${SKILLS.holy_lance.cd} s.`,
  },
  retribution: {
    ...W, branch: 'knight', adv: 60, name: 'Retribution', kind: 'passive', max: 3,
    share: (r) => 0.3 + 0.2 * r,
    desc: (r) => `While Rally is up, the damage you take is stored. Your next Shield Bash lets ${pct(SKILLS.retribution.share(R1(r)))} of it out on top (up to ${pct(RETRI_CAP)} of your attack more).`,
  },
  aegis: {
    ...W, branch: 'knight', adv: 100, name: 'Aegis', kind: 'aegis', max: 3, mp: 60, cd: 90, radius: 260, dur: (r) => 1.5 + 0.5 * r,
    desc: (r) => `You and every friend within range 260 can't be hurt at all for ${1.5 + 0.5 * r} s.`,
  },
  judgement: {
    ...W, branch: 'knight', adv: 100, name: 'Judgement', kind: 'spin', max: 3, mp: 50, cd: 24, radius: 260, taunt: true, anim: 'judgement',
    mult: (r) => 2.1 + 0.3 * r,
    desc: (r) => `Light falls on every mob within range 260: ${pct(SKILLS.judgement.mult(R1(r)))} damage each, and they all turn on you. Cooldown ${SKILLS.judgement.cd} s.`,
  },
  guardians_oath: {
    ...W, branch: 'knight', adv: 100, name: "Guardian's Oath", kind: 'buff', max: 3, mp: 40, cd: 60, dur: 300, party: 300, oath: true,
    fx: (r) => ({ def: 0.1 + 0.05 * r }),
    share: (r) => 0.1 + 0.05 * r,
    desc: (r) => `Swear to guard every friend within range 300, you too, for 5 min: +${pct(SKILLS.guardians_oath.fx(R1(r)).def)} defence, and while you stand near them ${pct(SKILLS.guardians_oath.share(R1(r)))} of the damage they take comes to you instead.`,
  },
  unbroken: {
    ...W, branch: 'knight', adv: 100, name: 'Unbroken', kind: 'passive', max: 3,
    per: (r) => 0.04 * r,
    desc: (r) => `+${pct(SKILLS.unbroken.per(R1(r)))} defence for every mob after you right now, up to ${UNBROKEN_MAX} of them.`,
  },
  // Berserker
  whirlwind: {
    ...W, branch: 'berserker', adv: 30, name: 'Whirlwind', kind: 'spin', max: 5, mp: 14, cd: 4, radius: 100,
    mult: (r) => 1.0 + 0.2 * r,
    desc: (r) => `Spin and hit every mob within range 100: ${pct(1.0 + 0.2 * r)} damage each.`,
  },
  berserk: {
    ...W, branch: 'berserker', adv: 30, name: 'Berserk', kind: 'buff', max: 3, mp: 20, cd: 30, dur: 20,
    boost: (r) => 0.25 + 0.1 * r,
    desc: (r) => `Battle rage: +${Math.round((0.25 + 0.1 * r) * 100)}% attack for 20 s.`,
  },
  rending_slash: {
    ...W, branch: 'berserker', adv: 30, name: 'Rending Slash', kind: 'strike', max: 3, mp: 12, cd: 8, reach: 40, anim: 'rend',
    mult: (r) => 1.8 + 0.2 * r,
    dot: { kind: 'bleed', share: (r) => 0.06 + 0.02 * r },
    desc: (r) => `A ragged cut at the mob ahead: ${pct(SKILLS.rending_slash.mult(R1(r)))} damage, and it bleeds ${pct(SKILLS.rending_slash.dot.share(R1(r)))} of that every second for ${BLEED_S} s. Cooldown ${SKILLS.rending_slash.cd} s.`,
  },
  bloodlust: {
    ...W, branch: 'berserker', adv: 30, name: 'Bloodlust', kind: 'passive', max: 3,
    boost: (r) => 0.05 + 0.05 * r,
    desc: (r) => `Below half HP: +${pct(SKILLS.bloodlust.boost(R1(r)))} attack, and Jelly Thirst heals double.`,
  },
  sword_mastery: {
    ...W, branch: 'berserker', adv: 60, name: 'Sword Mastery', kind: 'passive', max: 5,
    desc: (r) => `+${3 * r}% critical chance and critical hits do +${10 * r}% more damage.`,
  },
  blade_storm: {
    ...W, branch: 'berserker', adv: 60, name: 'Blade Storm', kind: 'storm', max: 3, mp: 30, cd: 12, radius: 130, hits: 4, crack: true, // (crack: it cracks a boss's armour, S5.2)
    mult: (r) => 0.8 + 0.15 * r,
    desc: (r) => `A storm of slashes: hits every mob within range 130 4 times for ${pct(0.8 + 0.15 * r)} each.`,
  },
  execution: {
    ...W, branch: 'berserker', adv: 60, name: 'Execution', kind: 'strike', max: 3, mp: 30, cd: 15, reach: 50, crack: true, anim: 'execute',
    mult: (r) => 3.1 + 0.3 * r,
    exec: (r) => 1.45 + 0.1 * r, // × on a mob at EXEC_AT of its HP or less
    onKill: { what: 'refund' },
    desc: (r) => `A beheading blow at the mob ahead: ${pct(SKILLS.execution.mult(R1(r)))} damage, ${pct(SKILLS.execution.mult(R1(r)) * SKILLS.execution.exec(R1(r)))} if it's down to ${pct(EXEC_AT)} of its HP. A kill gives its cooldown back. Cooldown ${SKILLS.execution.cd} s.`,
  },
  frenzy: {
    ...W, branch: 'berserker', adv: 60, name: 'Frenzy', kind: 'passive', max: 3,
    onKill: { what: 'extendBuff', buff: 'berserk', s: (r) => r },
    desc: (r) => `Every kill adds ${SKILLS.frenzy.onKill.s(R1(r))} s to Berserk while it's up (never past its full time).`,
  },
  sky_splitter: {
    ...W, branch: 'berserker', adv: 100, name: 'Sky Splitter', kind: 'strike', max: 3, mp: 50, cd: 45, reach: 90,
    mult: (r) => 5 + 1.5 * r,
    desc: (r) => `One enormous overhead blow at the mob ahead: ${pct(5 + 1.5 * r)} damage.`,
  },
  cyclone: {
    ...W, branch: 'berserker', adv: 100, name: 'Cyclone', kind: 'field', at: 'self', follow: true, shape: 'round', look: 'blade', max: 3, mp: 50, cd: 24, radius: 110, dur: 4, every: 0.3,
    mult: (r) => 0.35 + 0.05 * r,
    desc: (r) => `For ${SKILLS.cyclone.dur} s you're a spinning blade: every mob within range ${SKILLS.cyclone.radius} of you is cut for ${pct(SKILLS.cyclone.mult(R1(r)))} damage every ${SKILLS.cyclone.every} s. Keep moving: you carry it with you. Cooldown ${SKILLS.cyclone.cd} s.`,
  },
  rampage: {
    ...W, branch: 'berserker', adv: 100, name: 'Rampage', kind: 'passive', max: 2,
    desc: (r) => `Momentum stacks up to ${MOMENTUM_MAX + R1(r)}, and Whirlwind and Blade Storm add a stack when they hit.`,
  },

  // ——— Mage (staff, INT) ———
  magic_bolt: {
    ...M, adv: 10, name: 'Magic Bolt', kind: 'bolt', max: 3, mp: 5, cd: 0.8, range: 380,
    mult: (r) => 1.1 + 0.33 * r,
    desc: (r) => `A bolt at the first mob ahead (range 380): ${pct(1.1 + 0.33 * r)} magic damage.`,
  },
  mana_flow: {
    ...M, adv: 10, name: 'Mana Flow', kind: 'passive', max: 3,
    desc: (r) => `+${25 * r} max MP, and MP comes back ${r ? `${Math.round(mpRegenOf(r) * 10) / 10}×` : ''} faster.`,
  },
  arcane_mind: {
    ...M, adv: 15, name: 'Arcane Mind', kind: 'passive', max: 3,
    desc: (r) => `+${20 * r}% magic power.`,
  },
  mana_shield: {
    ...M, adv: 10, name: 'Mana Shield', kind: 'shield', toggle: true, max: 3, mp: 0, cd: 1,
    share: (r) => 0.2 + 0.1 * r,
    desc: (r) => `On / off: while it's on, ${Math.round((0.2 + 0.1 * r) * 100)}% of the damage you take comes off your MP instead of your HP.`,
  },
  arcane_charge: {
    ...M, adv: 10, name: 'Arcane Charge', kind: 'passive', max: 3,
    per: (r) => [0, 0.04, 0.08, 0.12][r],
    desc: (r) => `Every staff bolt that hits stores a charge (up to ${ARCANE_MAX}, for ${ARCANE_DUR} s). Your next spell spends them all: +${Math.round([0, 0.04, 0.08, 0.12][Math.max(1, r)] * 100)}% damage for each. Weave cheap bolts between your big spells.`,
  },
  // SP3 (story/skills-plan.md): the basics' mobbing staple and long party buff
  arcane_burst: {
    ...M, adv: 10, name: 'Arcane Burst', kind: 'fireball', anim: 'arcane', max: 3, mp: 10, cd: 5, range: 380, radius: 120,
    mult: (r) => 0.8 + 0.15 * r,
    desc: (r) => `A burst of raw magic on the first mob ahead (range ${SKILLS.arcane_burst.range}): ${pct(SKILLS.arcane_burst.mult(R1(r)))} magic damage to everything within range ${SKILLS.arcane_burst.radius} of it. No element: it spends Arcane Charge like any spell. Cooldown ${SKILLS.arcane_burst.cd} s.`,
  },
  arcane_insight: {
    ...M, adv: 10, name: 'Arcane Insight', kind: 'buff', max: 3, mp: 20, cd: 30, dur: 240, party: 300,
    fx: (r) => ({ magic: 0.01 * r }),
    desc: (r) => `A clear mind that lasts: +${pct(SKILLS.arcane_insight.fx(R1(r)).magic)} magic power for you and every friend within range ${SKILLS.arcane_insight.party}, for 4 min.`,
  },
  // Elementalist (fire)
  fireball: {
    ...M, branch: 'elementalist', adv: 30, name: 'Fireball', kind: 'fireball', fire: true, el: 'fire', max: 5, mp: 12, cd: 2.5, range: 380, radius: 70,
    mult: (r) => 1.3 + 0.2 * r,
    desc: (r) => `A ball of fire at the first mob ahead that bursts where it lands: ${pct(1.3 + 0.2 * r)} magic damage to everything within range 70.`,
  },
  // SP3: the Elementalist plants fire and sets packs off
  fire_wall: {
    ...M, branch: 'elementalist', adv: 30, name: 'Fire Wall', kind: 'field', at: 'ahead', shape: 'strip', fire: true, el: 'fire', max: 3, mp: 20, cd: 10, range: 340, radius: 150, dur: 5, every: 0.5,
    mult: (r) => 0.4 + 0.05 * r,
    desc: (r) => `A wall of fire planted on the first mob ahead (range ${SKILLS.fire_wall.range}) for ${SKILLS.fire_wall.dur} s, ${SKILLS.fire_wall.radius * 2} wide: everything in it takes ${pct(SKILLS.fire_wall.mult(R1(r)))} magic damage every ${SKILLS.fire_wall.every} s and burns. Cooldown ${SKILLS.fire_wall.cd} s.`,
  },
  flame_lance: {
    ...M, branch: 'elementalist', adv: 30, name: 'Flame Lance', kind: 'bolt', anim: 'flamelance', fire: true, el: 'fire', max: 3, mp: 12, cd: 2.5, range: 480,
    mult: (r) => 2.1 + 0.3 * r,
    desc: (r) => `A fast spear of fire at the first mob ahead (range ${SKILLS.flame_lance.range}): ${pct(SKILLS.flame_lance.mult(R1(r)))} magic damage, and it burns. Cooldown ${SKILLS.flame_lance.cd} s.`,
  },
  ignite: {
    ...M, branch: 'elementalist', adv: 30, name: 'Ignite', kind: 'passive', max: 3,
    onKill: { what: 'burst', when: 'burning', radius: 130, el: 'fire', mult: (r) => 0.4 + 0.2 * r },
    desc: (r) => `A burning mob you kill bursts: ${pct(SKILLS.ignite.onKill.mult(R1(r)))} magic damage to every mob within range ${SKILLS.ignite.onKill.radius} of it, setting them alight (and if that kills them, they burst too).`,
  },
  meteor: {
    ...M, branch: 'elementalist', adv: 60, name: 'Meteor', kind: 'meteor', fire: true, el: 'fire', max: 3, mp: 40, cd: 15, range: 450, radius: 150, delay: 0.8,
    mult: (r) => 3.5 + 0.6 * r,
    desc: (r) => `Calls a meteor down on the first mob ahead: ${pct(3.5 + 0.6 * r)} magic damage to everything within range 150.`,
  },
  combustion: {
    ...M, branch: 'elementalist', adv: 60, name: 'Combustion', kind: 'bolt', anim: 'combust', fire: true, max: 3, mp: 24, cd: 8, range: 450,
    mult: (r) => 2.4 + 0.2 * r,
    combust: (r) => 1.15 + 0.05 * r, // × on a burning mob, whose burn it uses up
    desc: (r) => `Sets off the burn on the first mob ahead (range ${SKILLS.combustion.range}) all at once: ${pct(SKILLS.combustion.mult(R1(r)))} magic damage, ${pct(SKILLS.combustion.mult(R1(r)) * SKILLS.combustion.combust(R1(r)))} if it's burning (the burn is spent). Cooldown ${SKILLS.combustion.cd} s.`,
  },
  kindling: {
    ...M, branch: 'elementalist', adv: 60, name: 'Kindling', kind: 'passive', max: 5,
    desc: (r) => `Your fire spells (Fireball, Fire Wall, Flame Lance, Combustion, Meteor, Starfall) hit ${6 * r}% harder.`,
  },
  starfall: {
    ...M, branch: 'elementalist', adv: 100, name: 'Starfall', kind: 'starfall', fire: true, el: 'fire', max: 3, mp: 70, cd: 60, radius: 700,
    mult: (r) => 2.5 + 0.6 * r,
    desc: (r) => `Stars rain on every mob within range 700: ${pct(2.5 + 0.6 * r)} magic damage each.`,
  },
  phoenix: {
    ...M, branch: 'elementalist', adv: 100, name: 'Phoenix', kind: 'summon', what: 'phoenix', el: 'fire', max: 3, mp: 50, cd: 60, dur: 30, every: 3,
    mult: (r) => 0.35 + 0.15 * r,
    desc: (r) => `A firebird circles you for ${SKILLS.phoenix.dur} s, diving at the nearest mob every ${SKILLS.phoenix.every} s: ${pct(SKILLS.phoenix.mult(R1(r)))} magic damage a dive, and it burns. Nothing can hurt it. Cooldown ${SKILLS.phoenix.cd} s.`,
  },
  // Frostbinder (ice and storm)
  frost_nova: {
    ...M, branch: 'frostbinder', adv: 30, name: 'Frost Nova', kind: 'nova', el: 'frost', max: 3, mp: 30, cd: 10, radius: 190, slow: 4,
    mult: (r) => 1.8 + 0.4 * r,
    desc: (r) => `A burst of frost: ${pct(1.8 + 0.4 * r)} magic damage to every mob within range 190, slowing them for 4 s.`,
  },
  chain_lightning: {
    ...M, branch: 'frostbinder', adv: 30, name: 'Chain Lightning', kind: 'chain', el: 'storm', max: 5, mp: 14, cd: 3, range: 380, jump: 220, targets: 4,
    mult: (r) => 1.0 + 0.15 * r,
    desc: (r) => `Lightning that leaps between up to 4 mobs: ${pct(1.0 + 0.15 * r)} magic damage each.`,
  },
  // SP3: the Frostbinder freezes on its own from Lv 30, holds a spot with Blizzard, and its storm primes the freeze
  frost_bolt: {
    ...M, branch: 'frostbinder', adv: 30, name: 'Frost Bolt', kind: 'bolt', ice: true, el: 'frost', max: 3, mp: 6, cd: 1.2, range: 420, slow: 2,
    mult: (r) => 1.3 + 0.25 * r,
    desc: (r) => `A cheap bolt of ice at the first mob ahead (range ${SKILLS.frost_bolt.range}): ${pct(SKILLS.frost_bolt.mult(R1(r)))} magic damage, and it's chilled. Two in a row freeze it. Cooldown ${SKILLS.frost_bolt.cd} s.`,
  },
  frost_armor: {
    ...M, branch: 'frostbinder', adv: 30, name: 'Frost Armor', kind: 'buff', max: 3, mp: 20, cd: 30, dur: 240, chills: true,
    fx: (r) => ({ def: 0.05 + 0.03 * r }),
    desc: (r) => `A coat of ice that lasts 4 min: +${pct(SKILLS.frost_armor.fx(R1(r)).def)} defence, and any mob that runs into you is chilled.`,
  },
  glacial_spike: {
    ...M, branch: 'frostbinder', adv: 60, name: 'Glacial Spike', kind: 'bolt', ice: true, el: 'frost', max: 5, mp: 16, cd: 4, range: 560, slow: 5,
    mult: (r) => 2 + 0.3 * r,
    desc: (r) => `A spike of ice at the first mob ahead (range 560): ${pct(2 + 0.3 * r)} magic damage, and it's slowed hard for 5 s.`,
  },
  blizzard: {
    ...M, branch: 'frostbinder', adv: 60, name: 'Blizzard', kind: 'field', at: 'ahead', shape: 'round', el: 'frost', max: 3, mp: 30, cd: 12, range: 420, radius: 150, dur: 6, every: 0.5,
    mult: (r) => 0.55 + 0.05 * r,
    desc: (r) => `A storm of ice planted on the first mob ahead (range ${SKILLS.blizzard.range}) for ${SKILLS.blizzard.dur} s: everything within range ${SKILLS.blizzard.radius} of it takes ${pct(SKILLS.blizzard.mult(R1(r)))} magic damage every ${SKILLS.blizzard.every} s and stays chilled. Cooldown ${SKILLS.blizzard.cd} s.`,
  },
  cold_snap: {
    ...M, branch: 'frostbinder', adv: 60, name: 'Cold Snap', kind: 'passive', max: 3,
    onKill: { what: 'burst', when: 'frozen', radius: 140, el: 'frost', mult: (r) => 0.5 + 0.2 * r },
    desc: (r) => `A frozen mob you kill bursts into ice: ${pct(SKILLS.cold_snap.onKill.mult(R1(r)))} magic damage to every mob within range ${SKILLS.cold_snap.onKill.radius} of it, chilling them (a chilled one freezes).`,
  },
  absolute_zero: {
    ...M, branch: 'frostbinder', adv: 100, name: 'Absolute Zero', kind: 'nova', ice: true, el: 'frost', max: 3, mp: 60, cd: 45, radius: 320, slow: 8,
    mult: (r) => 3 + 0.6 * r,
    desc: (r) => `Everything freezes: ${pct(3 + 0.6 * r)} magic damage to every mob within range 320, slowing them for 8 s.`,
  },
  thunder_call: {
    ...M, branch: 'frostbinder', adv: 100, name: 'Thunder Call', kind: 'chain', anim: 'thunder', el: 'storm', max: 3, mp: 30, cd: 8, range: 480, jump: 240, targets: 5, lead: 1.5, // (lead: × on the first mob)
    mult: (r) => 1.9 + 0.3 * r,
    desc: (r) => `One huge bolt from the sky on the first mob ahead (range ${SKILLS.thunder_call.range}): ${pct(SKILLS.thunder_call.mult(R1(r)) * SKILLS.thunder_call.lead)} magic damage, then it leaps on through up to ${SKILLS.thunder_call.targets - 1} more for ${pct(SKILLS.thunder_call.mult(R1(r)))} each. Storm: it spreads burns. Cooldown ${SKILLS.thunder_call.cd} s.`,
  },
  static: {
    ...M, branch: 'frostbinder', adv: 100, name: 'Static', kind: 'passive', max: 2,
    charge: (r) => 4 * r, // s a charge lasts
    desc: (r) => `Your storm spells leave every mob they hit charged for ${SKILLS.static.charge(R1(r))} s. Frost on a charged mob (anyone's) freezes it straight away.`,
  },

  // ——— Cleric (staff, INT; S3, story/progression.md 5). Heals scale with MAGIC × `heal` (Holy Power) ———
  smite: {
    ...C, adv: 10, name: 'Smite', kind: 'bolt', holy: true, max: 3, mp: 6, cd: 1.2, range: 320,
    mult: (r) => 0.9 + 0.25 * r, smite: (r) => 0.25 + 0.05 * r,
    desc: (r) => `Holy light at the first mob ahead (range 320): ${pct(0.9 + 0.25 * r)} magic damage, and you heal ${pct(0.25 + 0.05 * Math.max(1, r))} of the damage it does.`,
  },
  heal: {
    ...C, adv: 10, name: 'Jelly Heal', kind: 'heal', max: 3, mp: 14, cd: 4, radius: 220,
    power: (r) => 0.35 + 0.1 * r,
    desc: (r) => `Heal yourself and every friend within range 220 for ${pct(0.35 + 0.1 * Math.max(1, r))} of your MAGIC.`,
  },
  jelly_spirit: {
    ...C, adv: 10, name: 'Jelly Spirit', kind: 'summon', what: 'spirit', max: 3, mp: 25, cd: 20, dur: 20,
    mult: (r) => 0.5 + 0.15 * r, life: (r) => 0.5 + 0.2 * r,
    desc: (r) => `Call a glowing slime ghost for 20 s. It bounces at the nearest mob, hits it for ${pct(0.5 + 0.15 * Math.max(1, r))} of your MAGIC every second and draws its attention, so the mob (even a boss) goes after it instead of you. It has ${pct(0.5 + 0.2 * Math.max(1, r))} of your max HP. One at a time.`,
  },
  faith: {
    ...C, adv: 10, name: 'Faith', kind: 'passive', max: 3,
    desc: (r) => `+${15 * r}% magic power: your heals, Smite and spirits.`,
  },
  // S5.2 (owner, 2026-10-24: one rank, in the shared trunk so Priests and Wardens both have it): the answer to a
  // boss's curse (shared/rpg.js CURSE_*). The nearest cursed friend in range, else you; refused when nobody is cursed
  cleanse: {
    ...C, adv: 10, name: 'Cleanse', kind: 'cleanse', max: 1, mp: 12, cd: 6, radius: 300,
    power: () => 0.3,
    desc: () => 'Lift every curse off the nearest cursed friend within range 300 (or off you) and heal them for 30% of your MAGIC. A curse comes from a boss fought by a party: it softens your hits and burns.',
  },
  // SP4 (story/skills-plan.md): the basics' mobbing staple (a light that follows you) and long party buff
  radiance: {
    ...C, adv: 10, name: 'Radiance', kind: 'field', at: 'self', follow: true, shape: 'round', look: 'radiance', max: 3, mp: 14, cd: 12, radius: 120, dur: 4, every: 0.5,
    mult: (r) => 0.12 + 0.03 * r, heal: (r) => 0.02 + 0.01 * r,
    desc: (r) => `You shine for ${SKILLS.radiance.dur} s: every mob within range ${SKILLS.radiance.radius} of you takes ${pct(SKILLS.radiance.mult(R1(r)))} magic damage every ${SKILLS.radiance.every} s, and every friend in the light heals ${pct(SKILLS.radiance.heal(R1(r)))} of your MAGIC. It moves with you. Cooldown ${SKILLS.radiance.cd} s.`,
  },
  blessing: {
    ...C, adv: 10, name: 'Blessing', kind: 'buff', max: 3, mp: 20, cd: 30, dur: 240, party: 300,
    fx: (r) => ({ hp: 0.04 * r, atk: 0.01 * r, magic: 0.01 * r }),
    desc: (r) => `A blessing that lasts: +${pct(SKILLS.blessing.fx(R1(r)).hp)} max HP and +${pct(SKILLS.blessing.fx(R1(r)).atk)} attack and magic power for you and every friend within range ${SKILLS.blessing.party}, for 4 min.`,
  },
  // Priest (heals)
  mend: {
    ...C, branch: 'priest', adv: 30, name: 'Mend', kind: 'mend', max: 3, mp: 20, cd: 12, radius: 260, dur: 10,
    power: (r) => 0.06 + 0.02 * r,
    desc: (r) => `A heal that lingers: you and every friend within range 260 heal ${pct(0.06 + 0.02 * Math.max(1, r))} of your MAGIC every second for 10 s.`,
  },
  lantern_wisp: {
    ...C, branch: 'priest', adv: 30, name: 'Lantern Wisp', kind: 'summon', what: 'wisp', max: 3, mp: 30, cd: 40, dur: 30,
    power: (r) => 0.08 + 0.03 * r,
    desc: (r) => `A little lantern spirit for 30 s. It floats to whichever friend near you is hurt worst (or you) and every second heals everyone within range ${WISP_R} of it for ${pct(0.08 + 0.03 * Math.max(1, r))} of your MAGIC. Nothing can hit it.`,
  },
  // SP4: the Priest's mobbing staple at range, and overhealing that isn't wasted
  sacred_light: {
    ...C, branch: 'priest', adv: 30, name: 'Sacred Light', kind: 'meteor', anim: 'sacred', holy: true, max: 3, mp: 18, cd: 7, range: 420, radius: 110, delay: 0.35,
    mult: (r) => 1.1 + 0.15 * r, selfPer: (r) => 0.03 + 0.01 * r, // (selfPer: × MAGIC healed on you for each mob it hits)
    desc: (r) => `A column of light comes down on the first mob ahead (range ${SKILLS.sacred_light.range}): ${pct(SKILLS.sacred_light.mult(R1(r)))} magic damage to every mob within range ${SKILLS.sacred_light.radius} of it, and you heal ${pct(SKILLS.sacred_light.selfPer(R1(r)))} of your MAGIC for each mob it hits. Cooldown ${SKILLS.sacred_light.cd} s.`,
  },
  devotion: {
    ...C, branch: 'priest', adv: 30, name: 'Devotion', kind: 'passive', max: 3,
    share: (r) => 0.25 * r, // (share of the overheal that becomes a ward; DEVOTION_CAP, DEVOTION_S)
    desc: (r) => `Healing past full isn't wasted: ${pct(SKILLS.devotion.share(R1(r)))} of what your heals would overheal becomes a ward on that friend for ${DEVOTION_S} s (at most ${pct(DEVOTION_CAP)} of their max HP). It soaks hits like a Barrier, but never a boss's ultimate.`,
  },
  revive: {
    ...C, branch: 'priest', adv: 60, name: 'Revive', kind: 'revive', max: 3, mp: 40, radius: 220,
    cdFor: (r) => [0, 90, 70, 50][r], share: (r) => 0.2 + 0.1 * r,
    desc: (r) => `Get every knocked-out friend within range 220 back up where they fell, with ${pct(0.2 + 0.1 * Math.max(1, r))} of their HP and no EXP lost. Friends knocked out in a combat room stay down where they fell until they choose to wake up in town. Cooldown ${[0, 90, 70, 50][Math.max(1, r)]} s.`,
  },
  holy_power: {
    ...C, branch: 'priest', adv: 60, name: 'Holy Power', kind: 'passive', max: 5,
    desc: (r) => `Your heals (Jelly Heal, Mend, Miracle, the Lantern Wisp, the holy bolt's) and your holy light (Smite, Sacred Light, Judgment, Genesis) are ${8 * r}% stronger.`,
  },
  // SP4: holy ground, a bolt for the hurt, and the party's EXP buff
  consecration: {
    ...C, branch: 'priest', adv: 60, name: 'Consecration', kind: 'field', at: 'self', shape: 'strip', look: 'holy', max: 3, mp: 30, cd: 16, radius: 170, dur: 8, every: 0.5,
    mult: (r) => 0.15 + 0.03 * r, heal: (r) => 0.04 + 0.01 * r,
    desc: (r) => `Holy ground where you stand for ${SKILLS.consecration.dur} s, ${SKILLS.consecration.radius * 2} wide: every mob on it takes ${pct(SKILLS.consecration.mult(R1(r)))} magic damage every ${SKILLS.consecration.every} s, and every friend on it heals ${pct(SKILLS.consecration.heal(R1(r)))} of your MAGIC. Cooldown ${SKILLS.consecration.cd} s.`,
  },
  judgment: {
    ...C, branch: 'priest', adv: 60, name: 'Judgment', kind: 'bolt', anim: 'judgment', holy: true, max: 3, mp: 22, cd: 7, range: 450,
    mult: (r) => 1.8 + 0.2 * r, judge: (r) => 0.1 + 0.05 * r, lightHeal: () => 0.2, // (judge: + this × for each hurt slime near, JUDGMENT_*)
    desc: (r) => `A holy bolt at the first mob ahead (range ${SKILLS.judgment.range}): ${pct(SKILLS.judgment.mult(R1(r)))} magic damage, +${pct(SKILLS.judgment.judge(R1(r)))} for every slime within range ${JUDGMENT_R} under ${pct(JUDGMENT_AT)} HP (you too, up to ${JUDGMENT_MAX}). ${pct(SKILLS.judgment.lightHeal(R1(r)))} of the damage heals the friend nearest you who's hurt (or you). Cooldown ${SKILLS.judgment.cd} s.`,
  },
  holy_symbol: {
    ...C, branch: 'priest', adv: 60, name: 'Holy Symbol', kind: 'buff', max: 3, mp: 30, cd: 30, dur: 240, party: 300,
    fx: (r) => ({ exp: HOLY_SYMBOL_EXP * r }),
    desc: (r) => `A sign of light over the party that lasts: +${pct(SKILLS.holy_symbol.fx(R1(r)).exp)} EXP from every kill for you and every friend within range ${SKILLS.holy_symbol.party}, for 4 min.`,
  },
  miracle: {
    ...C, branch: 'priest', adv: 100, name: 'Miracle', kind: 'miracle', max: 3, mp: 80, cd: 120, radius: 600,
    power: (r) => 2 + 0.5 * r,
    desc: (r) => `Every friend within range 600, you too, heals ${pct(2 + 0.5 * Math.max(1, r))} of your MAGIC, and every knocked-out friend there gets back up with full HP. Cooldown 120 s.`,
  },
  genesis: { // SP4: `whole` hits every mob in the room (the client takes every mob it sees, the server the room's width)
    ...C, branch: 'priest', adv: 100, name: 'Genesis', kind: 'starfall', whole: true, anim: 'genesis', holy: true, max: 3, mp: 70, cd: 60, radius: 2000,
    mult: (r) => 1.6 + 0.3 * r, lightHeal: () => 0.1,
    desc: (r) => `Light falls on every mob in the area: ${pct(SKILLS.genesis.mult(R1(r)))} magic damage each, and ${pct(SKILLS.genesis.lightHeal(R1(r)))} of it heals the friend nearest you who's hurt (or you). Cooldown ${SKILLS.genesis.cd} s.`,
  },
  // Warden (spirits, the totem, barriers)
  guardian_totem: {
    ...C, branch: 'warden', adv: 30, name: 'Guardian Totem', kind: 'summon', what: 'totem', max: 3, mp: 30, cd: 35, dur: 25, radius: 160,
    cut: (r) => 0.15 + 0.05 * r, life: (r) => 0.8 + 0.3 * r,
    desc: (r) => `Plant a carved totem where you stand for 25 s: you and friends within range 160 of it take ${pct(0.15 + 0.05 * Math.max(1, r))} less damage. Mobs that touch it and bosses near it wear it down (${pct(0.8 + 0.3 * Math.max(1, r))} of your max HP). One at a time.`,
  },
  barrier: {
    ...C, branch: 'warden', adv: 30, name: 'Barrier', kind: 'barrier', max: 5, mp: 25, cd: 25, radius: 240, dur: 10,
    power: (r) => 0.6 + 0.2 * r,
    desc: (r) => `You and every friend within range 240 get a barrier for 10 s that soaks up ${pct(0.6 + 0.2 * Math.max(1, r))} of your MAGIC in damage. A boss's ultimate breaks it instead of knocking you out: cast it just before.`,
  },
  // SP4: the Warden's mobbing staple (three little spirits) and a totem that fights back
  sprites: {
    ...C, branch: 'warden', adv: 30, name: 'Sprites', kind: 'summon', what: 'sprite', count: 3, max: 3, mp: 24, cd: 18, dur: 18,
    mult: (r) => 0.16 + 0.03 * r, life: (r) => 0.25 + 0.05 * r, lightHeal: () => SUMMON_LIGHT,
    desc: (r) => `Call ${SKILLS.sprites.count} little sky spirits for ${SKILLS.sprites.dur} s, each going after a different mob (with one mob near, the others stay by you): ${pct(SKILLS.sprites.mult(R1(r)))} of your MAGIC a hit every second, and ${pct(SUMMON_LIGHT)} of what they do heals the friend nearest you who's hurt (or you). They draw mobs off you, and have ${pct(SKILLS.sprites.life(R1(r)))} of your max HP each. Cooldown ${SKILLS.sprites.cd} s.`,
  },
  warding_totem: {
    ...C, branch: 'warden', adv: 30, name: 'Warding Totem', kind: 'passive', max: 3,
    mult: (r) => 0.15 + 0.05 * r, // (× MAGIC every WARD_PULSE_S on every mob in the totem's ring)
    desc: (r) => `Your Guardian Totem pulses light every ${WARD_PULSE_S} s: every mob within its ring takes ${pct(SKILLS.warding_totem.mult(R1(r)))} of your MAGIC, and ${pct(SUMMON_LIGHT)} of it heals the friend nearest you who's hurt (or you).`,
  },
  spirit_bond: {
    ...C, branch: 'warden', adv: 60, name: 'Spirit Bond', kind: 'passive', max: 5,
    desc: (r) => `Your spirits and your totem have ${12 * r}% more HP and your spirits hit ${6 * r}% harder. From rank ${BOND_TWO}: two Jelly Spirits at once.`,
  },
  // SP4: the Warden's boss staple (a golem that holds the boss) and a long buff for friends by your summons
  stone_guardian: {
    ...C, branch: 'warden', adv: 60, name: 'Stone Guardian', kind: 'summon', what: 'guardian', max: 3, mp: 35, cd: 30, dur: 25, radius: 220, every: 2,
    mult: (r) => 0.8 + 0.2 * r, life: (r) => 1.5 + 0.5 * r, lightHeal: () => SUMMON_LIGHT,
    desc: (r) => `Raise a stone golem for ${SKILLS.stone_guardian.dur} s. It walks to the mob in front of you, taunts every mob within range ${SKILLS.stone_guardian.radius} of it (a boss too) and slams what's in front of it every ${SKILLS.stone_guardian.every} s for ${pct(SKILLS.stone_guardian.mult(R1(r)))} of your MAGIC; ${pct(SUMMON_LIGHT)} of that heals the friend nearest you who's hurt (or you). It has ${pct(SKILLS.stone_guardian.life(R1(r)))} of your max HP. Cooldown ${SKILLS.stone_guardian.cd} s.`,
  },
  resolve: {
    ...C, branch: 'warden', adv: 60, name: 'Resolve', kind: 'buff', max: 3, mp: 25, cd: 30, dur: 240, party: 300,
    fx: () => ({}), cut: (r) => 0.06 + 0.03 * r, // (no plain effect: the cut works only near your summons, RESOLVE_R, server/rpg.js hurt)
    buffText: (r) => `${pct(SKILLS.resolve.cut(R1(r)))} less damage taken near the Warden's summons`,
    desc: (r) => `Steady hearts that last: you and every friend within range ${SKILLS.resolve.party} take ${pct(SKILLS.resolve.cut(R1(r)))} less damage while standing within range ${RESOLVE_R} of any of your summons (spirits, sprites, the totem, the guardian, the Seraph), for 4 min.`,
  },
  seraph: {
    ...C, branch: 'warden', adv: 100, name: 'Seraph', kind: 'summon', what: 'seraph', max: 3, mp: 70, cd: 90, dur: 20,
    mult: (r) => 0.6 + 0.15 * r, life: (r) => 2 + r,
    desc: (r) => `Call a great winged spirit for 20 s. Every mob within range ${SERAPH_TAUNT} goes after it, and every second it hits every mob within range ${SERAPH_R} of it for ${pct(0.6 + 0.15 * Math.max(1, r))} of your MAGIC. It has ${pct(2 + Math.max(1, r))} of your max HP.`,
  },
  host: {
    ...C, branch: 'warden', adv: 100, name: 'Host', kind: 'passive', max: 1,
    desc: () => 'One more of every summon at a time: two totems, two guardians, two Seraphs, four sprites, a spirit more.',
  },

  // ——— Archer (bow, DEX; S4, story/progression.md 4). Every arrow is on ATK ———
  double_shot: {
    ...A, adv: 10, name: 'Double Shot', kind: 'shot', arrows: 2, max: 3, mp: 5, cd: 1, range: 420,
    mult: (r) => 0.75 + 0.15 * r,
    desc: (r) => `Two quick arrows at the first mob ahead (range 420): ${pct(0.75 + 0.15 * Math.max(1, r))} damage each.`,
  },
  retreat_shot: {
    ...A, adv: 10, name: 'Retreat Shot', kind: 'chase', max: 2, how: 'Dash, then shoot back',
    mult: (r) => [1, 1.6, 2][r],
    desc: (r) => `Shoot while you Dash (or just after) and the arrow flies back the way you came, at whatever is chasing you, for ${pct([1, 1.6, 2][Math.max(1, r)])} of a normal shot. Run and shoot at once. Needs Dash.`,
  },
  keen_eye: {
    ...A, adv: 10, name: 'Keen Eye', kind: 'passive', max: 3,
    desc: (r) => `+${KEEN_RANGE * r} bow range, and +${2 * r}% critical chance.`,
  },
  steady_hands: {
    ...A, adv: 10, name: 'Steady Hands', kind: 'passive', max: 3,
    desc: (r) => `+${STEADY * 100 * r}% attack with a bow.`,
  },
  evasion: {
    ...A, adv: 10, name: 'Evasion', kind: 'passive', max: 3,
    chance: (r) => EVADE * r,
    desc: (r) => `A ${Math.round(EVADE * 100 * Math.max(1, r))}% chance that a hit misses you completely (you're still knocked back). Never a boss's ultimate.`,
  },
  // SP5 (story/skills-plan.md): the basics' mobbing staple (one arrow at each of the first mobs ahead) and long buff
  spread_shot: {
    ...A, adv: 10, name: 'Spread Shot', kind: 'shot', arrows: 1, spread: 3, max: 3, mp: 10, cd: 4, range: 420,
    mult: (r) => 0.8 + 0.1 * r,
    desc: (r) => `A fan of ${SKILLS.spread_shot.spread} arrows, one at each of the first ${SKILLS.spread_shot.spread} mobs ahead (range ${SKILLS.spread_shot.range}): ${pct(SKILLS.spread_shot.mult(R1(r)))} damage each. Cooldown ${SKILLS.spread_shot.cd} s.`,
  },
  bow_focus: {
    ...A, adv: 10, name: 'Focus', kind: 'buff', max: 3, mp: 15, cd: 30, dur: 240,
    fx: (r) => ({ atk: 0.01 * r, crit: 0.01 * r }),
    desc: (r) => `Steady your aim for 4 min: +${pct(SKILLS.bow_focus.fx(R1(r)).atk)} attack and +${pct(SKILLS.bow_focus.fx(R1(r)).crit)} critical chance. Just you.`,
  },
  // Sniper (one arrow at a time)
  snipe: {
    ...A, branch: 'sniper', adv: 30, name: 'Snipe', kind: 'shot', arrows: 1, far: true, max: 5, mp: 16, cd: 4, range: 640,
    mult: (r) => 2.6 + 0.4 * r,
    desc: (r) => `One long, hard arrow at the first mob ahead (range 640): ${pct(2.6 + 0.4 * Math.max(1, r))} damage, and ${pct(FAR_BONUS)} more if it's more than ${FAR_PX} away. Keep your distance.`,
  },
  piercing_arrow: {
    ...A, branch: 'sniper', adv: 30, name: 'Piercing Arrow', kind: 'pierce', max: 5, mp: 14, cd: 3, range: 520, targets: 6,
    mult: (r) => 0.7 + 0.12 * r,
    desc: (r) => `An arrow that goes right through every mob in a line ahead (up to 6, range 520): ${pct(0.7 + 0.12 * Math.max(1, r))} damage each.`,
  },
  // SP5: a kill that keeps going, the Lv 60 mobbing staple, the party's crit, and the long shot that never misses its mark
  ricochet: {
    ...A, branch: 'sniper', adv: 30, name: 'Ricochet', kind: 'passive', max: 3,
    onKill: { what: 'ricochet', from: 'arrow', range: 260, jumps: 2, mult: (r) => 0.5 + 0.15 * r },
    desc: (r) => `An arrow that kills a mob jumps on to the nearest mob within range ${SKILLS.ricochet.onKill.range} for ${pct(SKILLS.ricochet.onKill.mult(R1(r)))} of your attack, and if that kills too, once more.`,
  },
  splitting_arrow: {
    ...A, branch: 'sniper', adv: 60, name: 'Splitting Arrow', kind: 'shot', arrows: 1, split: 5, max: 5, mp: 16, cd: 3, range: 520,
    mult: (r) => 0.95 + 0.08 * r,
    desc: (r) => `An arrow at the first mob ahead (range ${SKILLS.splitting_arrow.range}) for ${pct(SKILLS.splitting_arrow.mult(R1(r)))} damage that bursts into a fan when it hits: up to ${SKILLS.splitting_arrow.split} mobs behind it, within range ${SPLIT_R}, take ${pct(SPLIT_SHARE)} of that. Cooldown ${SKILLS.splitting_arrow.cd} s.`,
  },
  sharp_eyes: {
    ...A, branch: 'sniper', adv: 60, name: 'Sharp Eyes', kind: 'buff', max: 3, mp: 25, cd: 30, dur: 240, party: 300,
    fx: (r) => ({ crit: 0.01 * r, critDmg: 0.02 * r }),
    desc: (r) => `For 4 min, you and every friend within range ${SKILLS.sharp_eyes.party}: +${pct(SKILLS.sharp_eyes.fx(R1(r)).crit)} critical chance and +${pct(SKILLS.sharp_eyes.fx(R1(r)).critDmg)} critical damage.`,
  },
  eagle_eye: {
    ...A, branch: 'sniper', adv: 100, name: 'Eagle Eye', kind: 'passive', max: 1,
    desc: () => `A Snipe at a mob more than ${FAR_PX} away is always a critical hit. Keep your distance.`,
  },
  deadeye: {
    ...A, branch: 'sniper', adv: 60, name: 'Deadeye', kind: 'passive', max: 5,
    desc: (r) => `+${3 * r}% critical chance and critical hits do +${10 * r}% more damage.`,
  },
  hunters_mark: {
    ...A, branch: 'sniper', adv: 60, name: "Hunter's Mark", kind: 'mark', max: 3, mp: 20, cd: 18, dur: 12, range: 640,
    boost: (r) => 0.1 + 0.05 * r,
    desc: (r) => `Mark the first mob ahead (range 640) for 12 s: every slime's hits on it, yours and your friends', do ${pct(0.1 + 0.05 * Math.max(1, r))} more. One mark at a time.`,
  },
  heartseeker: {
    ...A, branch: 'sniper', adv: 100, name: 'Heartseeker', kind: 'pierce', far: true, max: 3, mp: 55, cd: 40, range: 960, targets: 10,
    mult: (r) => 5 + 1.5 * r,
    desc: (r) => `One enormous arrow straight across the room (range 960), through everything in its way: ${pct(5 + 1.5 * Math.max(1, r))} damage each, ${pct(FAR_BONUS)} more on mobs more than ${FAR_PX} away.`,
  },
  // Trapper (nets, slows, arrows from the sky)
  arrow_rain: {
    ...A, branch: 'trapper', adv: 30, name: 'Arrow Rain', kind: 'rain', max: 5, mp: 20, cd: 6, range: 450, radius: 130, hits: 3,
    mult: (r) => 0.4 + 0.08 * r,
    desc: (r) => `Loose a volley into the sky: it comes down round the first mob ahead (range 450), hitting everything within range 130 of it 3 times for ${pct(0.4 + 0.08 * Math.max(1, r))} each.`,
  },
  net_trap: {
    ...A, branch: 'trapper', adv: 30, name: 'Net Trap', kind: 'summon', what: 'net', max: 3, mp: 15, cd: 12, dur: 20,
    snare: (r) => 2 + r,
    desc: (r) => `Set a net on the ground where you stand for 20 s. The first mob to walk into it is caught: stuck fast and harmless for ${2 + Math.max(1, r)} s (a boss only slowed, for half that). Set it, then run: whatever chases you walks right in. One at a time.`,
  },
  // SP5: the Trapper's single-target staple from Lv 30 (poison), its Lv 60 mobbing trap, its hawk and its capstone passive
  poison_arrow: {
    ...A, branch: 'trapper', adv: 30, name: 'Poison Arrow', kind: 'shot', arrows: 1, max: 5, mp: 14, cd: 5, range: 480,
    mult: (r) => 1.2 + 0.15 * r, dot: { kind: 'poison', share: (r) => 0.04 + 0.01 * r },
    desc: (r) => `A venom-tipped arrow at the first mob ahead (range ${SKILLS.poison_arrow.range}): ${pct(SKILLS.poison_arrow.mult(R1(r)))} damage, then it loses ${pct(SKILLS.poison_arrow.dot.share(R1(r)))} of that every second for ${POISON_S} s. Cooldown ${SKILLS.poison_arrow.cd} s.`,
  },
  blast_trap: {
    ...A, branch: 'trapper', adv: 60, name: 'Blast Trap', kind: 'summon', what: 'blast', stat: 'atk', max: 5, mp: 20, cd: 12, dur: 20, radius: 140,
    mult: (r) => 1.4 + 0.2 * r,
    desc: (r) => `Set a trap where you stand for ${SKILLS.blast_trap.dur} s. The first mob to walk onto it sets it off: ${pct(SKILLS.blast_trap.mult(R1(r)))} of your attack to every mob within range ${SKILLS.blast_trap.radius}. Lead the pack over it. One at a time. Cooldown ${SKILLS.blast_trap.cd} s.`,
  },
  barbed_arrows: {
    ...A, branch: 'trapper', adv: 60, name: 'Barbed Arrows', kind: 'passive', max: 5,
    desc: (r) => `Your arrows slow whatever they hit for ${BARB_SLOW} s, and hit slowed, chilled or netted mobs ${Math.round(BARB_BONUS * 100 * r)}% harder.`,
  },
  trap_mastery: {
    ...A, branch: 'trapper', adv: 60, name: 'Trap Mastery', kind: 'passive', max: 3,
    burst: (r) => 1.2 + 0.4 * r,
    desc: (r) => `Your net catches ${1 + Math.max(1, r)} mobs instead of one, and bursts with every catch: ${pct(1.2 + 0.4 * Math.max(1, r))} of your attack to every mob within range ${NET_BURST_R}.`,
  },
  thousand_arrows: {
    ...A, branch: 'trapper', adv: 100, name: 'Thousand Arrows', kind: 'rain', max: 3, mp: 70, cd: 60, range: 520, radius: 340, hits: 6, slow: 3,
    mult: (r) => 0.8 + 0.2 * r,
    desc: (r) => `The sky goes dark with arrows: everything within range 340 of the first mob ahead is hit 6 times for ${pct(0.8 + 0.2 * Math.max(1, r))} each and slowed.`,
  },
  hawk: {
    ...A, branch: 'trapper', adv: 100, name: 'Hawk', kind: 'summon', what: 'hawk', stat: 'atk', max: 3, mp: 30, cd: 30, dur: 30, every: 1.5,
    mult: (r) => 0.4 + 0.1 * r,
    desc: (r) => `A hawk circles over you for ${SKILLS.hawk.dur} s and every ${SKILLS.hawk.every} s dives at whatever you last shot (else the nearest mob ahead) for ${pct(SKILLS.hawk.mult(R1(r)))} of your attack. Nothing can hit it.`,
  },
  huntmaster: {
    ...A, branch: 'trapper', adv: 100, name: 'Huntmaster', kind: 'passive', max: 3,
    bonus: (r) => 0.08 * r,
    desc: (r) => `Your Net Trap's bursts, your Blast Trap and your hawk hit ${pct(SKILLS.huntmaster.bonus(R1(r)))} harder on a slowed, chilled, frozen or netted mob.`,
  },

  // ——— Gifts: one player's own skill, granted by the server on load (server/rpg.js), never learned or
  // taken back, outside the point counts. `gift`: the account(s) it belongs to. Shown in the Novice tab.
  challenge_gods: {
    cls: 'gift', tree: 'gift', gift: ['chenyirong', 'justin'], adv: 1, name: 'Challenge the Gods', kind: 'gods', max: 1, mp: 0, cd: GODS_CD, dur: GODS_DUR,
    boost: GODS_BOOST,
    desc: () => `The slime gods have seen your stubbornness and wish to test your will. For ${GODS_DUR} s your HP drops to 1 and can't rise above it, and you deal +${GODS_BOOST * 100}% damage. Survive and you're healed to full. Cooldown ${GODS_CD} s.`,
  },

  // ——— Mobility (every class, class points): movement runs in the shared physics (sim.js step), from
  // input bits, so it's predicted exactly. 'move' skills have their own keys (Shift: Dash, V: Blink) and
  // can sit on the hotbar too; they cost no MP. Dash and Blink make you untouchable for a moment
  // ("i-frames"): that's how you get through the tall sweeps and the Colossus's / Chronos's ultimates.
  dash: {
    cls: 'any', tree: 'wind', adv: 10, name: 'Dash', kind: 'move', max: 3, mp: 0, cdFor: (r) => DASH_CD[r] / 60, key: 'Shift',
    desc: (r) => `Shift: burst forward ${Math.round((DASH_V * DASH_TICKS) / 60)} (in the air too), untouchable for ${secs(IFR_DASH)}. Cooldown ${DASH_CD[Math.max(1, r)] / 60} s.`,
  },
  flash_jump: {
    cls: 'any', tree: 'wind', adv: 10, name: 'Flash Jump', kind: 'passive', max: 3,
    desc: (r) => `Press Jump again in mid-air for a second, forward-flying jump (speed ${FJ_VX[Math.max(1, r)]}).`,
  },
  blink: {
    cls: 'any', tree: 'wind', adv: 30, name: 'Blink', kind: 'move', max: 3, mp: 0, cdFor: (r) => BLINK_CD[r] / 60, key: 'V',
    desc: (r) => `V: teleport forward ${BLINK_DIST[Math.max(1, r)]}, straight through anything, untouchable for ${secs(IFR_BLINK)}. Cooldown ${BLINK_CD[Math.max(1, r)] / 60} s.`,
  },
  phantom_step: {
    cls: 'any', tree: 'wind', adv: 60, name: 'Phantom Step', kind: 'passive', max: 2,
    desc: (r) => `Dash and Blink keep you untouchable ${secs(IFR_PHANTOM * Math.max(1, r))} longer and cool down ${Math.round(PHANTOM_CD * Math.max(1, r) * 100)}% faster.`,
  },
};
// ——— the Mage's combos (S2.6, story/progression.md 3): states on a mob, owned by the server (server/rpg.js
// applyHits), sent in the mob flags and drawn on the mob (src/elements.js) ———
// A frost spell CHILLS a mob for CHILL_S (it's slowed); a frost spell on a chilled mob FREEZES it: an ordinary
// mob stops dead for FREEZE_S, a boss (den or field) is only slowed to FROZEN_BOSS_SLOW for FREEZE_BOSS s.
// A fire spell on a frozen mob SHATTERS it: SHATTER_MULT damage, and the freeze ends (a freeze that ran out
// less than SHATTER_GRACE_MS ago still counts: the caster's screen is a little behind). Fire BURNS: BURN_DPS
// of the hit's damage every second for BURN_S (a fresh burn keeps the stronger one), ticked by the server
// every BURN_TICK_MS and counted for the caster. Storm (Chain Lightning) on a burning mob SPREADS the burn to
// every mob within BURN_SPREAD px that isn't burning harder.
export const CHILL_S = 6, FREEZE_S = 3, FREEZE_BOSS = 1.5, FROZEN_BOSS_SLOW = 0.25, SHATTER_MULT = 2.5, SHATTER_GRACE_MS = 400;
export const BURN_S = 4, BURN_DPS = 0.02, BURN_TICK_MS = 500, BURN_SPREAD = 160;
export const ELEMENTS = ['frost', 'fire', 'storm'];
// Arcane Charge (Mage basics): each staff bolt that hits adds a charge, up to ARCANE_MAX, all gone ARCANE_DUR s
// after the last one; the next Mage damage spell (spendsArcane) spends them all for +per(rank) damage each
export const ARCANE_MAX = 3, ARCANE_DUR = 10;
const SPELL_KINDS = new Set(['bolt', 'fireball', 'chain', 'meteor', 'nova', 'starfall']);
export const spendsArcane = (id) => SKILLS[id]?.cls === 'mage' && SPELL_KINDS.has(SKILLS[id].kind);
export const arcaneMult = (skills, n) => 1 + SKILLS.arcane_charge.per(rankOf(skills, 'arcane_charge')) * Math.min(ARCANE_MAX, n | 0);
// What kind of hit skill sk is, for a boss's S5.2 mechanics (shared/rpg.js partyHitMult): magic (a staff class's
// spell, or Pebble Toss on the better MAGIC: a barrier lets it through), heavy (its multiplier, with Arcane Charge,
// reaches ARMOUR_CRACK, or it's marked `crack`: it cracks armour), arrow (an Archer's: reaches a weak point from
// anywhere). st: { atk, magic }; charges: the Arcane charges it spends.
export function hitKinds(sk, rank, st, charges, skills) {
  const magic = sk.cls === 'mage' || sk.cls === 'cleric' || (sk.stat === 'best' && st.magic >= st.atk);
  return { magic, heavy: !!sk.crack || heavyHit((sk.mult?.(rank) ?? 1) * arcaneMult(skills, charges)), arrow: sk.cls === 'archer' };
}
// ——— the Cleric (S3, story/progression.md 5) ———
// The holy bolt (a Cleric's normal attack, its staff bolt): the staff bolt's range, HOLY_BOLT_MULT of MAGIC, and
// HOLY_BOLT_HEAL of what it did heals the hurt friend nearest you (or you) within HOLY_BOLT_HEAL_R
export const HOLY_BOLT_MULT = 0.7, HOLY_BOLT_HEAL = 0.4, HOLY_BOLT_HEAL_R = 320;
// Summons (server/summons.js runs them like mobs; src/summons.js draws them). Spirits (and the Seraph) chase
// the nearest mob within SPIRIT_SEEK at SPIRIT_SPEED and hit every SPIRIT_HIT_S; a mob they hit, and every
// mob within SPIRIT_TAUNT (the Seraph: SERAPH_TAUNT) that's after a slime, goes after them instead. The Seraph
// hits every mob within SERAPH_R. Spirits and totems get hurt: a mob touching one hits it for SUMMON_TOUCH of
// the mob's ATK every SUMMON_HURT_S; a boss within BOSS_SUMMON_REACH of one hits it for BOSS_SUMMON_HIT of its
// ATK every BOSS_SUMMON_S; an ultimate going off takes ULT_SUMMON of every one's max HP. The wisp heals
// everyone within WISP_R of it every WISP_TICK s and can't be hit. Spirit Bond: two spirits from BOND_TWO.
export const SPIRIT_SEEK = 520, SPIRIT_SPEED = 240, SPIRIT_HIT_S = 1, SPIRIT_TAUNT = 240, SERAPH_TAUNT = 420, SERAPH_R = 150;
export const SUMMON_TOUCH = 0.5, SUMMON_HURT_S = 0.8, BOSS_SUMMON_REACH = 140, BOSS_SUMMON_HIT = 1.3, BOSS_SUMMON_S = 1.2, ULT_SUMMON = 0.5;
export const WISP_R = 150, WISP_TICK = 1, BOND_TWO = 3;
// ——— the Archer (S4, story/progression.md 4) ———
// With a bow DEX is the main stat: +0.6 ATK and BOW_DEX_HP max HP a point (STR's job for a sword; statsFor)
// Keen Eye: +KEEN_RANGE px of bow range a rank · Steady Hands: +STEADY attack a rank · Evasion: EVADE a rank to
// dodge a hit (server/rpg.js hurt) · Snipe / Heartseeker: FAR_BONUS more on a mob over FAR_PX away (the client
// measures it; the server's cap allows it) · Barbed Arrows: arrows slow for BARB_SLOW s, BARB_BONUS a rank more
// on a slowed, chilled or netted mob · Hunter's Mark: one mark per Archer, shown on the mob (wire flag 2048)
export const KEEN_RANGE = 20, STEADY = 0.12, EVADE = 0.07, BOW_DEX_HP = 3, FAR_PX = 380, FAR_BONUS = 0.3, BARB_SLOW = 2, BARB_BONUS = 0.05;
// Net Trap (server/summons.js): a mob within NET_R of the net (on the ground near it) is caught for snare(rank) s:
// an ordinary mob stops dead and can't hurt anyone, a boss is slowed to NET_BOSS_SLOW for half that (wire flag
// 4096). It catches one mob, 1 + Trap Mastery's rank with it, each catch bursting for burst(rank) × ATK on every
// mob within NET_BURST_R; then it's spent
export const NET_R = 46, NET_BURST_R = 110, NET_BOSS_SLOW = 0.35;
// Arrow Rain / Thousand Arrows: the volley comes down RAIN_AT s after it's loosed, a wave every RAIN_EVERY s
// (the client shows the hits then; src/skillfx.js draws them falling)
export const RAIN_AT = 0.45, RAIN_EVERY = 0.22;
// ——— SP5, the Archer's skill pool (story/skills-plan.md) ———
// Spread Shot (`spread` on a shot): one arrow at each of the first `spread` mobs ahead. Splitting Arrow (`split` on a
// shot): the first mob takes the hit, then up to `split` mobs behind it (further along, within SPLIT_R of it) take
// SPLIT_SHARE of it. Eagle Eye: a `far` shot (Snipe) at a mob past FAR_PX always crits (the client rolls it; the
// server's cap already allows a crit). Huntmaster: a trap's or the hawk's hit × (1 + bonus(rank)) on a mob that's slowed,
// chilled, frozen or netted (server/summons.js huntX)
export const SPLIT_R = 300, SPLIT_SHARE = 1;
// the bonuses an arrow gets on mob view / server mob v (the client's roll and the server's cap use the same
// rules): Barbed Arrows on a slowed, chilled, frozen or netted mob · Snipe's and Heartseeker's long shot
export const arrowBonus = (skills, sk, slowed, dist) => (1 + BARB_BONUS * rankOf(skills, 'barbed_arrows') * (slowed ? 1 : 0)) * (sk?.far && dist > FAR_PX ? 1 + FAR_BONUS : 1);
// ——— SP1, the skill pool's machinery (story/skills-plan.md, "What's new under the hood"). It shipped dark: the
// class skills that use it come in SP2–SP5; TEST_SKILLS (below) exercises it on a test server ———
// Long buffs: kind 'buff' with `fx(rank)` (the effects, BUFF_FX) and a minutes-long `dur`; `party`: the radius it
// reaches friends in (none: only you). Kept on the server player (p.buffs, one of each skill id: a weaker rank never
// replaces a stronger one, a recast refreshes), fed to statsFor as buffs.long (buffFx adds them up, so the hit caps
// follow), shown in the status box (me.buffs), cleared on fainting, a class change and logging off; room changes keep
// them. Different buffs from different players stack. (Berserk is a `buff` with no fx: the old short kind.)
// exp: more EXP from kills (server/rpg.js kill), a faucet: `npm run economy` lists every buff that has it.
export const BUFF_FX = { atk: 'attack', magic: 'magic power', def: 'defence', hp: 'max HP', crit: 'critical chance', critDmg: 'critical damage', exp: 'EXP from kills', cut: 'less damage taken' };
export const isLongBuff = (sk) => sk?.kind === 'buff' && !!sk.fx;
// several long buffs' effects added up ({ atk: 0.2, … }; list: their fx objects)
export function buffFx(list) {
  const out = {};
  for (const fx of list) for (const [k, v] of Object.entries(fx ?? {})) if (BUFF_FX[k]) out[k] = (out[k] ?? 0) + v;
  return out;
}
// "+20% attack, +5% critical chance"
export const fxText = (fx) => Object.entries(fx ?? {}).filter(([k, v]) => v && BUFF_FX[k]).map(([k, v]) => (k === 'cut' ? `${pct(v)} less damage taken` : `+${pct(v)} ${BUFF_FX[k]}`)).join(', ');
// Fields (kind 'field'): an area on the ground that hits every mob inside it every `every` s for `dur` s, server-run like
// burns (server/rpg.js fieldTick), through damage() as the caster's hit (the meter, EXP, loot). `at`: 'self' (round you)
// or 'ahead' (on the first mob ahead within `range`, else out in front) · `shape`: 'strip' (a band `radius` each way
// along the floor, FIELD_TALL high) or 'round' (a circle of `radius`) · `mult(rank)` × the caster's stat (statOf) a tick ·
// `el`: it chills / burns like a spell (the Mage's combos) · `heal(rank)` × MAGIC × Holy Power heals every friend inside
// each tick · `look`: how it's drawn (FIELD_LOOKS; from el / heal when unset). One per skill per caster (a recast
// replaces it); it ends early if its caster leaves the room. `follow` (SP2's Cyclone): it moves with its caster.
export const FIELD_TALL = 90, FIELD_LOOKS = ['plain', 'fire', 'frost', 'holy', 'poison', 'blade', 'radiance']; // (blade: SP2's Cyclone; radiance: SP4's)
export const fieldLook = (sk) => sk.look ?? (sk.el === 'fire' ? 'fire' : sk.el === 'frost' ? 'frost' : sk.heal ? 'holy' : 'plain');
// Damage over time (SP1 widened the Mage's burn): `dot: { kind: 'bleed' | 'poison', share(rank) }` on a hitting skill
// leaves each mob it hits losing share × the hit's damage a second for DOTS[kind].s (a fresh one keeps the stronger
// dps, like a burn), ticked by the server every DOTS[kind].tick ms as the caster's hit. Bleed and poison take no part
// in the Mage's combos (storm spreads only burns, fire only burns). flag: the mob's wire flag (late joiners see it).
export const BLEED_S = 5, POISON_S = 8;
export const DOTS = {
  burn: { s: BURN_S, tick: BURN_TICK_MS, flag: 1024, color: '#ffa860' },
  bleed: { s: BLEED_S, tick: 500, flag: 8192, color: '#ff7a8e' },
  poison: { s: POISON_S, tick: 1000, flag: 16384, color: '#a6e070' },
};
// On-kill hooks (server/rpg.js onKill, the one place damage() kills a mob): `onKill: { what, when?, from? … }` on a
// passive runs on every kill its holder makes; on an active skill, only on kills that skill's own hits make.
// what: 'burst' (`radius`, `mult(rank)`, `el`: a blast round the dead mob on everything near it) · 'refund' (`skill`:
// that skill's cooldown comes back; on an active skill, its own) · 'extendBuff' (`buff`: a buff's skill id, `s(rank)`
// more seconds, never past its full time) · 'ricochet' (the killing arrow jumps to the nearest mob within `range`
// for `mult(rank)` × ATK; `jumps` times at most: the client decides it like any hit and the server caps it from the
// kill it saw, for RICOCHET_MS). when: the dead mob's state ('burning' | 'frozen' | 'chilled' | 'bleeding' |
// 'poisoned') · from: what made the killing hit ('arrow' | 'spell' | 'melee' | a skill id). A chain (a burst
// killing a mob that bursts…) stops ONKILL_DEPTH deep.
export const ONKILL_DEPTH = 3, RICOCHET_MS = 1500;
export const onKillFrom = (from, src) => !from || (from === 'arrow' ? !!src?.arrow : from === 'spell' ? !!src?.spell : from === 'melee' ? !!src && !src.arrow && !src.spell : src?.skill === from);
// Pull (`pull` px on a hitting skill; Ground Shake): every ordinary mob it reaches slides up to that far toward the
// caster over PULL_MS (server/rpg.js stepMob: mob positions only, never a slime's; never a boss, a field boss or an
// anchored mob). `taunt: true` on a skill: every mob it reaches turns on the caster (Rally's taunt, TAUNT_S).
export const PULL_MS = 250;
// SP1's summons (server/summons.js, drawn by src/summons.js; a skill declares `what`). hurt: mobs and bosses wear it
// down · planted: it stays where it was set · fly: it floats over its caster. phoenix: circles its caster and dives at
// a mob within PHOENIX_SEEK every `every` s (`el` burns) · sprite: `count` at once, each after a different mob ·
// guardian: walks to the mob in front, taunts every mob within its `radius` every GUARDIAN_TAUNT_S and slams the ones
// in front every `every` s · hawk: circles over its caster and dives at what the caster last hit (within HAWK_RANGE),
// else the nearest mob ahead · blast: set like a net; the first mob over it sets it off, `mult` × the stat on every
// mob within `radius`. Hits are `mult(rank)` × statOf.
export const SUMMON_KINDS = {
  spirit: { hurt: true }, wisp: {}, totem: { hurt: true, planted: true }, seraph: { hurt: true }, net: { planted: true },
  phoenix: { fly: true }, sprite: { hurt: true }, guardian: { hurt: true }, hawk: { fly: true }, blast: { planted: true },
};
export const PHOENIX_SEEK = 360, GUARDIAN_TAUNT_S = 2, GUARDIAN_SPEED = 120, HAWK_RANGE = 520, SPRITE_SCALE = 0.55;
// how many of summon `what` one caster can have up (Spirit Bond's two spirits; sprites come `count` at a time; Host: one more)
export const summonCap = (sk, skills) => (sk.what === 'spirit' ? spiritCap(skills) : sk.count ?? 1) + (sk.cls === 'cleric' ? rankOf(skills, 'host') : 0); // (SP4: Host, one more)
// the stat a skill hits with: `stat` ('atk' | 'magic' | 'best'), else the class's (Warrior and Archer ATK, the staff classes MAGIC)
export const statOf = (sk, st) => (sk.stat === 'atk' ? st.atk : sk.stat === 'magic' ? st.magic : sk.stat === 'best' ? Math.max(st.atk, st.magic) : sk.cls === 'warrior' || sk.cls === 'archer' ? st.atk : st.magic);
// a heal's size: Jelly Patch's flat `amount`, else `power` × MAGIC × Holy Power (st: statsFor)
export const healOf = (id, rank, st) => (SKILLS[id].amount ? SKILLS[id].amount(rank) : Math.round(st.magic * SKILLS[id].power(rank) * st.heal));
// a summon's max HP and its hit (before the roll), from its skill's rank and the caster's stats
export const summonHp = (id, rank, st) => Math.round(st.maxHp * (SKILLS[id].life?.(rank) ?? 1) * (1 + 0.12 * st.bond));
export const summonHit = (id, rank, st) => (SKILLS[id].stat ? statOf(SKILLS[id], st) : st.magic) * (SKILLS[id].mult?.(rank) ?? 0) * (1 + 0.06 * st.bond);
export const spiritCap = (skills) => (rankOf(skills, 'spirit_bond') >= BOND_TWO ? 2 : 1);
const secs = (ticks) => `${Math.round((ticks / 60) * 100) / 100} s`;
const R1 = (r) => Math.max(1, r); // (a description at rank 0 shows rank 1)
function pct(m) {
  return `${Math.round(m * 100)}%`;
}
export const cooldownOf = (id, rank) => SKILLS[id].cdFor?.(rank) ?? SKILLS[id].cd;
// Momentum (Warrior): stacks from chase-move hits, each lasting MOMENTUM_DUR s from the last; standing still
// for MOMENTUM_STILL s loses them all (server/rpg.js)
export const MOMENTUM_MAX = 5, MOMENTUM_DUR = 8, MOMENTUM_STILL = 1;
// ——— SP2, the Warrior's skill pool (story/skills-plan.md) ———
// Rampage: Momentum's cap goes up a stack a rank (and Whirlwind / Blade Storm add stacks: server/rpg.js cast)
export const momentumMax = (skills) => MOMENTUM_MAX + rankOf(skills, 'rampage');
// Shield Bash (`stun` on the skill): an ordinary mob can't move or hurt anyone for STUN_S s (server m.stunUntil;
// the echo's `stun` draws the stars). Retribution: damage taken while Rally is up is stored (p.retri, never more than
// RETRI_HOLD × max HP); the next Shield Bash adds share(rank) of it, at most RETRI_CAP × ATK more (the cap allows it).
// Execution: × exec(rank) on a mob at EXEC_AT of its HP or less (the client reads its bar, the server its own HP).
// Unbroken: +per(rank) DEF for every mob after you within UNBROKEN_R, up to UNBROKEN_MAX. Bloodlust: below
// BLOODLUST_AT of max HP. Guardian's Oath: a friend's hit moves share(rank) to its Knight within OATH_R (server hurt).
export const STUN_S = 1.5, RETRI_CAP = 3, RETRI_HOLD = 1, EXEC_AT = 0.3, UNBROKEN_MAX = 5, UNBROKEN_R = 400, BLOODLUST_AT = 0.5, OATH_R = 450;
// how many mobs a cleave or a pierce goes through at a rank (Cleave grows with rank since SP2)
export const targetsOf = (sk, rank) => (typeof sk.targets === 'function' ? sk.targets(rank) : sk.targets);
// Retribution's extra multiplier on a Shield Bash: what's stored, against ATK
// ——— SP3, the Mage's skill pool (story/skills-plan.md) ———
// Thunder Call: the first mob takes `lead` × (on a chain: applyHits' cap allows it for the first hit only). Combustion: × combust(rank) on a burning mob (the client reads v.burning, the server its own burn, with
// SHATTER_GRACE_MS of slack), and that burn is spent. Static: storm hits leave a charge (server m.staticUntil; the
// echo's `charged` draws it, no mob flag left); frost (not a field's soft chill) on a charged mob freezes it at once.
// Frost Armor (`chills` on a long buff): a mob that touches you is chilled (server ouch).
export const staticS = (skills) => SKILLS.static.charge(rankOf(skills, 'static')); // (0: no Static)
// ——— SP4, the Cleric's skill pool (story/skills-plan.md) ———
// Holy Symbol: +HOLY_SYMBOL_EXP EXP from kills a rank (a faucet: scripts/economy.mjs folds it into the pace).
// Devotion: share(rank) of a heal's overheal becomes a ward (q.devo on the server, soaked after the Barrier, never an
// ultimate) for DEVOTION_S s, at most DEVOTION_CAP × that slime's max HP. Judgment: + judge(rank) × for every slime
// within JUDGMENT_R under JUDGMENT_AT of its HP (the caster too), up to JUDGMENT_MAX (the client counts what it
// sees, the server caps with its own count). `lightHeal(rank)` on a Cleric damage skill or summon: that share of its
// damage heals the hurt friend nearest the caster within HOLY_BOLT_HEAL_R, else the caster (the holy bolt's rule);
// SUMMON_LIGHT for the summons and the Warding Totem's pulse (every WARD_PULSE_S on the mobs in the totem's ring).
// `selfPer(rank)` (Sacred Light): × MAGIC healed on the caster for each mob hit. Resolve: `cut(rank)` off damage
// taken while within RESOLVE_R of any of its Warden's summons. Host: summonCap + 1 for every summon.
export const HOLY_SYMBOL_EXP = 0.04, DEVOTION_S = 8, DEVOTION_CAP = 0.25, JUDGMENT_R = 400, JUDGMENT_AT = 0.8, JUDGMENT_MAX = 4;
export const SUMMON_LIGHT = 0.15, WARD_PULSE_S = 2, RESOLVE_R = 260;
// Judgment's × given how many hurt slimes are near (n, capped)
export const judgmentMult = (skills, n) => 1 + (SKILLS.judgment.judge(rankOf(skills, 'judgment') || 1)) * Math.max(0, Math.min(JUDGMENT_MAX, n | 0));
export const retriMult = (skills, stored, atk) => (rankOf(skills, 'retribution') && stored > 0 && atk > 0 ? Math.min(RETRI_CAP, (stored * SKILLS.retribution.share(rankOf(skills, 'retribution'))) / atk) : 0);
// The chase moves' ranks, packed for the physics (sim.js step reads state.mw): bits 0–1 Charge · 2–3 Leap
// Slam · 4–5 Upward Cut · 6–7 Retreat Shot (the Archer's, S4: sim.js retreatOpen) · 8–9 Hook (SP2)
export const chaseOf = (skills) => rankOf(skills, 'charge') | (rankOf(skills, 'leap_slam') << 2) | (rankOf(skills, 'upward_cut') << 4) | (rankOf(skills, 'retreat_shot') << 6) | (rankOf(skills, 'hook') << 8);
// The movement abilities a character has, packed for the physics (sim.js step reads state.mv):
// bits 0–1 Dash rank · 2–3 Flash Jump · 4–5 Blink · 6–7 Phantom Step
export const mobilityOf = (skills) => rankOf(skills, 'dash') | (rankOf(skills, 'flash_jump') << 2) | (rankOf(skills, 'blink') << 4) | (rankOf(skills, 'phantom_step') << 6);
export const durOf = (id, rank) => (typeof SKILLS[id].dur === 'function' ? SKILLS[id].dur(rank) : SKILLS[id].dur);
export const ACTIVE = (id) => SKILLS[id] && SKILLS[id].kind !== 'passive' && SKILLS[id].kind !== 'chase'; // (hotbar skills)

export const HOTBAR = 6; // skill slots, keys 1–6 (a skill id or null)
export const POTBAR = 3; // potion slots, keys 7–9 (a potion item id or null)

export const rankOf = (skills, id) => skills?.[id] ?? 0;

// ——— skill points: two separate counts, so the Novice tree can never eat class points ———
// Novice points: one a level up to SP_NOVICE_LVL (exactly fills the Novice tree). Class points (the class
// tree and Mobility): SP_PER_LVL a level from CLASS_LVL (owner, 2026-10-24: "2 points per level"), but never
// more than spRoom, the ranks your level has opened (so none pile up unspendable). No fork any more (owner,
// 2026-10-24): both branches can be learned; the hotbar's few slots are the limit. Nothing past SP_CAP_LVL (S6).
export const SP_NOVICE_LVL = 9, SP_PER_LVL = 2, SP_CAP_LVL = 200;
export const spNovice = (lvl) => Math.max(0, Math.min(lvl, SP_NOVICE_LVL));
// the class ranks c could hold at its level: its class's skills (both branches) and Mobility that its level has
// opened. A Novice has no cap (its points wait for a class).
export function spRoom(c) {
  const cls = c.cls;
  if (!cls || cls === 'novice' || !CLASSES[cls]) return Infinity;
  return Object.values(SKILLS).reduce((n, s) => n + (!s.gift && (s.cls === cls || s.cls === 'any') && c.lvl >= s.adv ? s.max : 0), 0);
}
export function spClass(c) {
  if (c.lvl < CLASS_LVL) return 0;
  return Math.min(SP_PER_LVL * (Math.min(c.lvl, SP_CAP_LVL) - CLASS_LVL + 1), spRoom(c));
}
const poolOf = (id) => (SKILLS[id]?.gift ? 'gift' : SKILLS[id]?.cls === 'novice' ? 'novice' : 'class');
export const spSpentIn = (skills, pool) => Object.entries(skills ?? {}).reduce((n, [id, r]) => n + (SKILLS[id] && poolOf(id) === pool ? r : 0), 0);
// points left to spend: { novice, cls } (a Novice's class points pile up until it chooses a class)
export const spLeft = (c) => ({ novice: spNovice(c.lvl) - spSpentIn(c.skills, 'novice'), cls: spClass(c) - spSpentIn(c.skills, 'class') });
// what the HUD counts as "points to spend"
export const spFree = (c) => {
  const l = spLeft(c);
  return Math.max(0, l.novice) + (c.cls && c.cls !== 'novice' ? Math.max(0, l.cls) : 0);
};
// the gift skills held (they survive a reset, a rebirth and a rollback)
export const giftsOf = (skills) => Object.fromEntries(Object.entries(skills ?? {}).filter(([id]) => SKILLS[id]?.gift));
export const pointsIn = (skills, tree) => Object.entries(skills ?? {}).reduce((n, [id, r]) => n + (SKILLS[id]?.tree === tree ? r : 0), 0);
export const branchPoints = (skills, branch) => Object.entries(skills ?? {}).reduce((n, [id, r]) => n + (SKILLS[id]?.branch === branch ? r : 0), 0);
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
  if (!skillFor(cls, id)) return `That's ${aOrAn(CLASSES[sk.cls].name)} skill`;
  if (c.lvl < sk.adv) return `Opens at Lv ${sk.adv}`;
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
// the points add up; anything else and they all come back as points ({})
export function cleanSkills(c) {
  const s = Object.fromEntries(Object.entries(c.skills ?? {}).filter(([id, n]) => skillFor(c.cls, id) && n > 0 && c.lvl >= SKILLS[id].adv).map(([id, n]) => [id, Math.min(n | 0, SKILLS[id].max)]).filter(([, n]) => n > 0));
  const left = spLeft({ ...c, skills: s });
  return left.novice < 0 || left.cls < 0 ? {} : s;
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
  { id: 'str', name: 'STR', short: '+0.6 ATK, +3 HP', desc: 'Strength: +0.6 ATK and +3 max HP per point (with a bow, only +0.2 ATK: archers aim with DEX).' },
  { id: 'dex', name: 'DEX', short: 'min dmg; bow ATK', desc: `Dexterity: raises your minimum damage (+0.1% per point, up to 105%) and +0.2 ATK and MAGIC per point. With a bow it's your main stat: +0.6 ATK and +${BOW_DEX_HP} max HP per point instead.` },
  { id: 'int', name: 'INT', short: '+0.9 MAGIC, +2 MP', desc: 'Intelligence: +0.9 MAGIC and +2 max MP per point.' },
  { id: 'luk', name: 'LUK', short: '+crit chance & damage', desc: 'Luck: +0.04% critical chance (up to +20%) and +0.15% critical damage per point.' },
];
export const apOf = (ap, k) => ap?.[k] ?? 0;
export const apTotal = (lvl) => AP_PER_LVL * lvl;
export const apSpent = (ap) => AP_STATS.reduce((n, s) => n + apOf(ap, s.id), 0);
export const MIN_ROLL = 0.85, MAX_ROLL = 1.15; // ±15% before DEX
export const minRollFor = (ap) => Math.min(1.05, MIN_ROLL + 0.001 * apOf(ap, 'dex'));
// Everything about a character's numbers in one place (c: {lvl, gear, skills}).
// buffs: { momentum: Momentum's stacks, gods: true while Challenge the Gods is up (HP capped at 1, damage boosted), berserk: true while it's up, rally: the Rally boost (e.g. 0.2) while it's up, manaShield: true
// while Mana Shield is switched on, brew: a brewed potion's buff ({ atk, crit, ward, regen, ... }, ITEMS) while it's up,
// long: the long buffs on you added up (buffFx: { atk, magic, def, hp, crit, critDmg, exp, cut }, SP1),
// hp: HP now (Bloodlust), attackers: mobs after you now (Unbroken) (SP2) }
export function statsFor(c, buffs = {}) {
  const long = buffs.long ?? {}; // (SP1's long buffs)
  const rage = buffs.berserk ? 1 + SKILLS.berserk.boost(rankOf(c.skills, 'berserk')) : 1;
  const rally = 1 + (buffs.rally ?? 0);
  const brew = buffs.brew ?? {}; // a brewed potion's buff (src/shared/alchemy.js)
  const might = (1 + (brew.atk ?? 0)) * (buffs.gods ? 1 + GODS_BOOST : 1);
  const push = 1 + SKILLS.momentum.per(rankOf(c.skills, 'momentum')) * Math.min(momentumMax(c.skills), buffs.momentum ?? 0); // (Momentum: ATK only)
  const arcane = (1 + 0.2 * rankOf(c.skills, 'arcane_mind')) * (1 + 0.15 * rankOf(c.skills, 'faith'));
  const mastery = rankOf(c.skills, 'sword_mastery');
  // scroll enhancements on the worn gear (rpg.js rollScroll)
  const ge = c.gearE ?? {}, enh = (k) => (ge.weapon?.[k] ?? 0) + (ge.helmet?.[k] ?? 0);
  const staff = ITEMS[c.gear?.weapon]?.kind === 'staff' ? ITEMS[c.gear.weapon] : null; // (S1: spells grow with a staff)
  const bow = ITEMS[c.gear?.weapon]?.kind === 'bow' ? ITEMS[c.gear.weapon] : null; // (S4: a bow shoots, and aims with DEX)
  const aim = rankOf(c.skills, 'deadeye'), keen = rankOf(c.skills, 'keen_eye');
  const holyBolt = !!staff && c.cls === 'cleric'; // (S3: a Cleric's staff fires a holy bolt that heals)
  const str = apOf(c.ap, 'str'), dex = apOf(c.ap, 'dex'), int = apOf(c.ap, 'int'), luk = apOf(c.ap, 'luk');
  const ms = rankOf(c.skills, 'mana_shield');
  // SP2: Bloodlust below BLOODLUST_AT of max HP (buffs.hp: HP now), Unbroken's DEF per mob after you (buffs.attackers)
  const hpMax = buffs.gods ? 1 : Math.round((maxHpFor(c.lvl) + enh('hp') + 17 * rankOf(c.skills, 'iron_jelly') + 3 * str + (bow ? BOW_DEX_HP * dex : 0)) * (1 + 0.08 * rankOf(c.skills, 'vitality')) * (1 + (long.hp ?? 0)));
  const lust = rankOf(c.skills, 'bloodlust') && buffs.hp != null && buffs.hp < hpMax * BLOODLUST_AT ? SKILLS.bloodlust.boost(rankOf(c.skills, 'bloodlust')) : 0;
  const stand = 1 + SKILLS.unbroken.per(rankOf(c.skills, 'unbroken')) * Math.min(UNBROKEN_MAX, buffs.attackers ?? 0);
  return {
    atk: Math.round((attackFor(c.lvl, c.gear?.weapon) + enh('atk') + (bow ? 0.2 * str + 0.6 * dex : 0.6 * str + 0.2 * dex)) * rage * rally * might * push * (bow ? 1 + STEADY * rankOf(c.skills, 'steady_hands') : 1) * (1 + (long.atk ?? 0)) * (1 + lust)),
    magic: Math.round((magicFor(c.lvl) + (staff?.magic ?? 0) + enh('magic') + 0.9 * int + 0.2 * dex) * rage * rally * arcane * might * (1 + (long.magic ?? 0))),
    def: Math.round((defenseFor(c.gear?.helmet) + enh('def') + 5 * rankOf(c.skills, 'iron_jelly')) * rally * (1 + (long.def ?? 0)) * stand),
    maxHp: hpMax,
    maxMp: maxMpFor(c.lvl, c.skills) + 2 * int + (staff?.mp ?? 0),
    reach: staff || bow ? 0 : reachFor(c.gear?.weapon), // a sword's extra reach (swings and blade skills)
    boltRange: staff ? STAFF_BOLT_RANGE + staff.reach : 0, // a staff bolt's range (a Cleric's holy bolt's too)
    arrowRange: bow ? BOW_RANGE + bow.reach + KEEN_RANGE * keen : 0, // a bow shot's range (S4)
    evade: SKILLS.evasion.chance(rankOf(c.skills, 'evasion')), // the chance a hit misses (Evasion, server/rpg.js hurt)
    holyBolt, // the normal attack is the Cleric's holy bolt (HOLY_BOLT_*)
    heal: 1 + 0.08 * rankOf(c.skills, 'holy_power'), // the Cleric's heals' multiplier, and Smite's (`holy` skills) (Holy Power)
    bond: rankOf(c.skills, 'spirit_bond'), // Spirit Bond's rank (summons' HP and damage)
    crit: 0.12 + 0.03 * (mastery + aim) + 0.02 * keen + Math.min(0.2, 0.0004 * luk) + (brew.crit ?? 0) + (long.crit ?? 0),
    critMult: 1.6 + 0.1 * (mastery + aim) + 0.0015 * luk + (long.critDmg ?? 0),
    exp: long.exp ?? 0, // share of extra EXP from kills (a long buff, SP1; server/rpg.js kill)
    cut: long.cut ?? 0, // share of damage taken away (a long buff, SP1; server/rpg.js hurt)
    minRoll: minRollFor(c.ap),
    hpRegen: (1 + 0.25 * rankOf(c.skills, 'vitality')) * (1 + (brew.regen ?? 0)),
    ward: brew.ward ?? 0, // share of damage taken away (server/rpg.js hurt)
    thirst: SKILLS.jelly_thirst.share(rankOf(c.skills, 'jelly_thirst')) * (lust ? 2 : 1), // share of damage dealt that heals you (Jelly Thirst; Bloodlust doubles it)
    bloodlust: !!lust, // (SP2: below half HP with Bloodlust)
    manaShield: buffs.manaShield && ms ? SKILLS.mana_shield.share(ms) : 0, // share of damage taken that comes off MP (hurt)
    fire: 1 + 0.06 * rankOf(c.skills, 'kindling'), // fire spells' multiplier (Kindling)
  };
}
export const mpRegen = (skills) => mpRegenOf(rankOf(skills, 'mana_flow')); // multiplier
export const magicFor = (lvl) => 5 + lvl * 3; // spell power from the level (a staff adds its magic; swords don't help spells)

// ——— Tests only (TEST_SKILLS=1 on a throwaway server, never live: docs/testing.md) ———
// Skills that exercise SP1's machinery before any class has one: gifts to everyone (`gift: '*'`, so they cost no
// points, survive a rebirth and show in the Novice tab), added to SKILLS by enableTestSkills() (the server at
// startup, a client when welcome says testSkills). With TEST_SKILLS unset nobody sees them.
const T = { cls: 'gift', tree: 'gift', gift: '*', test: true, adv: 1, max: 1, stat: 'best' };
const TEST_SKILLS = {
  test_war_cry: { ...T, name: 'Test War Cry', kind: 'buff', mp: 5, cd: 2, dur: 180, party: 300, fx: () => ({ atk: 0.2, crit: 0.05 }), desc: () => 'Test: a long buff for you and friends within range 300: +20% attack, +5% critical chance for 3 min.' },
  test_insight: { ...T, name: 'Test Insight', kind: 'buff', mp: 5, cd: 2, dur: 180, party: 300, fx: () => ({ magic: 0.2, hp: 0.1, exp: 0.1 }), desc: () => 'Test: a long buff for you and friends within range 300: +20% magic, +10% max HP, +10% EXP for 3 min.' },
  test_fire_wall: { ...T, name: 'Test Fire Wall', kind: 'field', at: 'ahead', shape: 'strip', el: 'fire', mp: 5, cd: 3, range: 320, radius: 80, dur: 6, every: 0.5, mult: () => 0.3, desc: () => 'Test: a wall of fire ahead for 6 s, burning everything in it.' },
  test_blizzard: { ...T, name: 'Test Blizzard', kind: 'field', at: 'ahead', shape: 'round', el: 'frost', mp: 5, cd: 3, range: 360, radius: 110, dur: 6, every: 0.7, mult: () => 0.3, desc: () => 'Test: a storm of ice planted ahead for 6 s, hitting and chilling everything in it.' },
  test_consecrate: { ...T, name: 'Test Consecration', kind: 'field', at: 'self', shape: 'strip', mp: 5, cd: 3, radius: 140, dur: 8, every: 1, mult: () => 0.25, heal: () => 0.1, desc: () => 'Test: holy ground round you for 8 s: mobs on it are hurt, friends on it healed.' },
  test_rend: { ...T, name: 'Test Rend', kind: 'strike', mp: 3, cd: 1, reach: 40, mult: () => 1.2, dot: { kind: 'bleed', share: () => 0.15 }, desc: () => 'Test: a hit that leaves the mob bleeding.' },
  test_venom: { ...T, name: 'Test Venom', kind: 'bolt', mp: 3, cd: 1, range: 380, mult: () => 1, dot: { kind: 'poison', share: () => 0.1 }, desc: () => 'Test: a bolt that leaves the mob poisoned.' },
  test_execute: { ...T, name: 'Test Execute', kind: 'strike', mp: 3, cd: 8, reach: 40, mult: () => 3, onKill: { what: 'refund' }, desc: () => 'Test: a heavy hit; a kill gives its cooldown back.' },
  test_shake: { ...T, name: 'Test Ground Shake', kind: 'spin', mp: 3, cd: 2, radius: 170, mult: () => 0.6, pull: 90, taunt: true, desc: () => 'Test: slam the floor: every mob within range 170 is hit, dragged toward you and taunted.' },
  test_ignite: { ...T, name: 'Test Ignite', kind: 'passive', onKill: { what: 'burst', when: 'burning', radius: 130, el: 'fire', mult: () => 0.6 }, desc: () => 'Test: a burning mob that dies bursts, setting the mobs near it alight.' },
  test_frenzy: { ...T, name: 'Test Frenzy', kind: 'passive', onKill: { what: 'extendBuff', buff: 'test_war_cry', s: () => 5 }, desc: () => 'Test: every kill adds 5 s to Test War Cry.' },
  test_ricochet: { ...T, name: 'Test Ricochet', kind: 'passive', onKill: { what: 'ricochet', from: 'arrow', range: 260, jumps: 2, mult: () => 0.8 }, desc: () => 'Test: an arrow that kills jumps on to the next mob (twice at most).' },
  test_phoenix: { ...T, name: 'Test Phoenix', kind: 'summon', what: 'phoenix', el: 'fire', mp: 5, cd: 3, dur: 20, every: 1.5, mult: () => 0.6, desc: () => 'Test: a firebird circles you for 20 s and dives at mobs.' },
  test_sprites: { ...T, name: 'Test Sprites', kind: 'summon', what: 'sprite', count: 3, mp: 5, cd: 3, dur: 20, mult: () => 0.3, life: () => 0.2, desc: () => 'Test: three little spirits for 20 s, each after a different mob.' },
  test_guardian: { ...T, name: 'Test Stone Guardian', kind: 'summon', what: 'guardian', mp: 5, cd: 3, dur: 25, radius: 200, every: 1.5, mult: () => 0.8, life: () => 1.5, desc: () => 'Test: a stone golem for 25 s that taunts the mobs near it and slams the one in front.' },
  test_hawk: { ...T, name: 'Test Hawk', kind: 'summon', what: 'hawk', mp: 5, cd: 3, dur: 25, every: 1.2, mult: () => 0.6, desc: () => 'Test: a hawk for 25 s that dives at whatever you last hit.' },
  test_blast: { ...T, name: 'Test Blast Trap', kind: 'summon', what: 'blast', mp: 5, cd: 3, dur: 20, radius: 120, mult: () => 2, desc: () => 'Test: a trap that explodes on the first mob over it, hitting everything within range 120.' },
};
export let testSkills = false;
export function enableTestSkills() {
  if (testSkills) return;
  testSkills = true;
  Object.assign(SKILLS, TEST_SKILLS);
}
// is gift skill sk account `name`'s? (`gift: '*'`: everyone's, the test skills)
export const giftFor = (sk, name) => sk.gift === '*' || [sk.gift].flat().includes(name);
