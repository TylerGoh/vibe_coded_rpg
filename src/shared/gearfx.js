// Docs: docs/combat/items.md
// Boss gear's unique effects (owner, 2026-11-06: "big impact stuff, so people have to actually think if it's worth
// it"). Every top and final boss has a weapon effect (its sword, staff and bow each get their own version) and a
// helmet effect, most with a cost; a few den and field bosses give a small one (no cost) to every piece they drop.
// Shared by the client (src/rpg.js, src/main.js), the server (server/rpg.js) and the physics (sim.js step: the
// movement ones ride in the slime's state as `gx`, so prediction knows them).
import { ITEMS, MOBS, bossTier, STAFF_OF, CLERIC_STAFF_OF, BOW_OF } from './rpg.js';

// ——— the numbers ———
export const HYDRA_HIT = 0.65, HYDRA_ECHO = 0.15, HYDRA_CRIT = 0.7; // Ladon: two hits of HYDRA_HIT; a spell echoes; crits × this
export const HOURS_SPEED = 1.3, HOURS_RESET = 0.25, HOURS_MP = 1.4; // Chronos: attack speed; a spell's cooldown reset; MP costs
export const HEARTH_EVERY = 5, ERUPT_R = 150, ERUPT_MULT = 1.5, EXPLODE_R = 110, EXPLODE_MULT = 0.5; // Typhon's sword and bow
export const GROUND_S = 3, GROUND_W = 90, GROUND_MULT = 0.25, GROUND_EVERY = 0.5, HEARTH_TAKEN = 1.15; // its staff's burning ground; the cost
export const BURDEN_DMG = 1.6, BURDEN_WALK = 0.75; // Brenna's weapons
export const DASH_SLASH_MULT = 1, NOVA_R = 170, NOVA_MULT = 1.2, VOLLEY = 2, UNBOUND_HP = 0.85; // Fenrir's weapons
export const ROOTED_S = 1, ROOTED_DMG = 1.45; // the Root Warden's weapons
export const OATH_EVERY = 15, OATH_BONUS = 3, OATH_DMG = 0.9; // Sigrun's weapons
export const PISTON_RANGE = 320, PISTON_MULT = 0.5, PISTON_PIERCE = 2, PISTON_FREE = 4, PISTON_HP = 0.01; // the Colossus's weapons
export const PACK_DEF = 0.9; // Fenrir's hood (a triple jump)
export const AIR_UP_V = 850, AIR_DOWN_V = 1300, AIRDASH_CD = 1.5; // Ladon's crown (an air dash)
export const GLIDE_JUMP = 1.12, GLIDE_FALL = 110; // the Colossus's helm (√1.25: a quarter higher; a slow fall)
export const FURNACE_WALK = 1.2, TRAIL_EVERY = 0.35, TRAIL_S = 2, TRAIL_W = 40, TRAIL_MULT = 0.2, FURNACE_DRAIN = 0.02, FURNACE_STILL = 1; // Typhon's mask
export const REWIND_HP = 0.8, REWIND_CD_S = 300, REWIND_SAFE_S = 2; // Chronos's crown (cheat death)
export const STOMP_VY = 1000, STOMP_R = 160, STOMP_MULT = 1.5; // Brenna's helm (a fall faster than this stomps)
export const BULWARK_WALK = 0.85; // Sigrun's helm (no knockback)
export const REST_HEAL = 0.03; // the Root Warden's helm (a second, standing still)
export const RUSH_S = 3, RUSH_SPEED = 1.15, SHATTERER = 1.2, BREWER = 1.5, PHASE_IFR = 30; // the small ones

// gx: the movement effects, as bits in the slime's physics state (sim.js step reads them; the server sets them from
// the worn gear and, for the Skirmisher's Backflip Volley, the skills: server/rpg.js moves)
export const GX = { SLOW25: 1, NOAIR: 2, TRIPLE: 4, AIRDASH: 8, GLIDE: 16, FAST20: 32, NODASH: 64, SLOW15: 128, KNOCKFREE: 256, RUSH: 512, WALL: 1024, PHASE: 2048, FLIP: 4096 };

// ——— the effects: name, what it does by weapon kind (or `all`), and its cost ———
export const GEAR_FX = {
  // weapons of the top and final bosses
  hydra: { name: 'Many-Headed', sword: `Every swing hits twice, ${HYDRA_HIT * 100}% each.`, staff: `A spell has a ${HYDRA_ECHO * 100}% chance to cast again, free.`, bow: `Every shot splits into two arrows, ${HYDRA_HIT * 100}% each.`, cost: `Critical hits do ${Math.round((1 - HYDRA_CRIT) * 100)}% less.` },
  hours: { name: 'Borrowed Hours', sword: `Swings ${Math.round((HOURS_SPEED - 1) * 100)}% faster.`, staff: `A spell has a ${HOURS_RESET * 100}% chance to reset its own cooldown.`, bow: `Holding attack fires ${Math.round((HOURS_SPEED - 1) * 100)}% faster.`, cost: `Skills cost ${Math.round((HOURS_MP - 1) * 100)}% more MP.` },
  hearth: { name: 'Buried Fire', sword: `Every ${HEARTH_EVERY}th hit erupts in fire around you.`, staff: 'Spells leave burning ground.', bow: 'Arrows explode on the first mob they hit.', cost: `You take ${Math.round((HEARTH_TAKEN - 1) * 100)}% more damage.` },
  burden: { name: 'The Weight', all: `+${Math.round((BURDEN_DMG - 1) * 100)}% damage.`, cost: `Walk ${Math.round((1 - BURDEN_WALK) * 100)}% slower; no jumping in mid-air.` },
  unbound: { name: 'Unbound', sword: 'Dashing through mobs slashes each one.', staff: 'Blink leaves a frost nova where you were.', bow: `Retreat Shot fires ${1 + VOLLEY} arrows.`, cost: `Max HP −${Math.round((1 - UNBOUND_HP) * 100)}%.` },
  rooted: { name: 'Rooted', all: `Stand still for ${ROOTED_S} s: +${Math.round((ROOTED_DMG - 1) * 100)}% damage until you move.`, cost: 'Standing still, in a game of jumping.' },
  oath: { name: 'Oath of the Shield', all: `Blocks one hit every ${OATH_EVERY} s; your next hit after a block does ${OATH_BONUS}×.`, cost: `${Math.round((1 - OATH_DMG) * 100)}% less damage otherwise.` },
  piston: { name: 'Clockwork', sword: `Every swing also fires a piston shot ahead (${PISTON_MULT * 100}%).`, staff: `Every ${PISTON_FREE}th spell is free.`, bow: `Arrows go through ${PISTON_PIERCE} more mobs.`, cost: `Every attack costs ${PISTON_HP * 100}% of your HP.` },
  // helmets of the top and final bosses
  pack: { name: 'Pack Runner', all: 'A third jump in mid-air.', cost: `DEF −${Math.round((1 - PACK_DEF) * 100)}%.` },
  briar: { name: 'Briar Step', all: 'One dash in mid-air each jump, any way: Jump then Dash goes up, Down then Dash goes down.', cost: `Dash cooldown +${Math.round((AIRDASH_CD - 1) * 100)}%.` },
  glide: { name: 'Steam Glide', all: 'Jump a quarter higher; hold Jump while falling to glide.', cost: 'Falling slowly makes you easy to hit.' },
  furnace: { name: 'Furnace Feet', all: `Walk ${Math.round((FURNACE_WALK - 1) * 100)}% faster, leaving a fire trail that burns mobs.`, cost: `Standing still burns you: ${FURNACE_DRAIN * 100}% of your HP a second.` },
  rewind: { name: 'Rewind', all: `Once every ${REWIND_CD_S / 60} min a killing blow leaves you at 1 HP, untouchable for ${REWIND_SAFE_S} s while time slows round you.`, cost: `Max HP −${Math.round((1 - REWIND_HP) * 100)}%.` },
  quake: { name: 'Last Delivery', all: 'Landing from a long fall stomps the ground: damage and knockback.', cost: 'No dash.' },
  bulwark: { name: 'Unmoved', all: 'Nothing knocks you back.', cost: `Walk ${Math.round((1 - BULWARK_WALK) * 100)}% slower.` },
  rest: { name: 'Deep Roots', all: `Standing still heals ${REST_HEAL * 100}% of your HP a second.` },
  // the den and field bosses' small ones (every piece they drop)
  rush: { name: 'Rush', all: `A kill gives +${Math.round((RUSH_SPEED - 1) * 100)}% speed for ${RUSH_S} s.` },
  firstcrit: { name: 'First Blood', all: 'Your first hit on a mob is always a critical hit.' },
  shatterer: { name: 'Shatterer', all: `+${Math.round((SHATTERER - 1) * 100)}% damage to a frozen or burning boss.` },
  wall: { name: 'Wall Jump', all: 'One more jump while touching a wall.' },
  brewer: { name: 'Brewer', all: `Potions heal ${Math.round((BREWER - 1) * 100)}% more.` },
  phase: { name: 'Phase Dash', all: 'Dash leaves you untouchable for longer.' },
};
// boss → [its weapons' effect, its helmet's effect] (one id: every piece)
const BOSS_FX = {
  ladon: ['hydra', 'briar'], chronos: ['hours', 'rewind'], typhon: ['hearth', 'furnace'], brenna: ['burden', 'quake'],
  fenrir: ['unbound', 'pack'], root_warden: ['rooted', 'rest'], sigrun: ['oath', 'bulwark'], colossus: ['piston', 'glide'],
  knotmole: 'rush', hornet_queen: 'rush', snapjaw: 'firstcrit', thorn_hart: 'firstcrit', frost_queen: 'shatterer', ignis: 'shatterer',
  old_narwhal: 'wall', hall_troll: 'wall', tidemother: 'brewer', hatchkeeper: 'brewer', pale_wyrm: 'phase', brimstone_condor: 'phase',
};
// item id → its effect id (boss gear only: bossTier, so never a shop's stock)
export const FX_OF = {};
for (const [boss, fx] of Object.entries(BOSS_FX)) {
  for (const [id] of MOBS[boss]?.drops ?? []) {
    if (!bossTier[id]) continue;
    const helm = ITEMS[id].kind === 'helmet';
    for (const g of helm ? [id] : [id, STAFF_OF[id], CLERIC_STAFF_OF[id], BOW_OF[id]].filter(Boolean)) FX_OF[g] ??= Array.isArray(fx) ? fx[helm ? 1 : 0] : fx;
  }
}
// what character c's worn gear does: { hydra: 'sword', rush: 'helmet', … } (the weapon's kind for a weapon effect)
export function fxOf(c) {
  const out = {}, w = c?.gear?.weapon, h = c?.gear?.helmet;
  if (FX_OF[w]) out[FX_OF[w]] = ITEMS[w].kind;
  if (FX_OF[h]) out[FX_OF[h]] ??= 'helmet';
  return out;
}
// the line an item card shows for item id ('' if none)
export function fxLine(id) {
  const f = GEAR_FX[FX_OF[id]];
  if (!f) return '';
  const what = f[ITEMS[id].kind] ?? f.all;
  return `${f.name}: ${what}${f.cost ? ` Cost: ${f.cost}` : ''}`;
}
// the gx bits for c's worn gear (sim.js step); skills add FLIP (server/rpg.js moves)
export function gearMoves(c) {
  const f = fxOf(c);
  let gx = 0;
  if (f.burden) gx |= GX.SLOW25 | GX.NOAIR;
  if (f.pack) gx |= GX.TRIPLE;
  if (f.briar) gx |= GX.AIRDASH;
  if (f.glide) gx |= GX.GLIDE;
  if (f.furnace) gx |= GX.FAST20;
  if (f.quake) gx |= GX.NODASH;
  if (f.bulwark) gx |= GX.SLOW15 | GX.KNOCKFREE;
  if (f.rush) gx |= GX.RUSH;
  if (f.wall) gx |= GX.WALL;
  if (f.phase) gx |= GX.PHASE;
  return gx;
}
// a sword's or bow's normal attack speed (Chronos's weapons): the time between attacks is divided by this
export const attackSpeedOf = (c) => (fxOf(c).hours && ITEMS[c.gear.weapon].kind !== 'staff' ? HOURS_SPEED : 1);
// walking speed × this, from gx (and the Rush bit, BOOST, while a kill's rush lasts)
export const walkOf = (gx, boost) => (gx & GX.SLOW25 ? BURDEN_WALK : 1) * (gx & GX.SLOW15 ? BULWARK_WALK : 1) * (gx & GX.FAST20 ? FURNACE_WALK : 1) * (gx & GX.RUSH && boost ? RUSH_SPEED : 1);
