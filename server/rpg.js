// Docs: docs/combat/core.md, docs/combat/bosses.md, docs/combat/stages.md, docs/combat/skills.md, docs/combat/items.md, docs/places/alchemy.md
// The Wildwood's RPG side (data in src/shared/rpg.js and src/shared/skills.js): each account's level,
// EXP, HP, MP, coins, bag, gear, skills and hotbar (saved in table `rpg_chars`); the mobs and bosses
// (run here at 60 Hz in every combat room someone is in); hits, skills, drops and pickups. Everything is
// decided here; clients only draw it. Messages: see server/index.js.
//
// Responsiveness over cheat-proofing (the owner's call: it's a game among friends). Clients decide
// their own combat from what's on their screen: which mobs their swings and skills hit, and for how
// much (src/rpg.js), and when a mob, a slam or falling thorns hit THEM ('ouch'). The server only
// sanity-checks (the mob exists nearby, damage under the most that's possible) and applies it. An ouch
// is run in input order (index.js) and applies the same knockback the client already predicted at that
// step, so nothing snaps back. Slaps on friends are still judged here, against where the slapper saw
// them (each player keeps ~0.5 s of position history).
import { DatabaseSync } from 'node:sqlite';
import { FIELD, MOBS, SPAWNS, MOB_RESPAWN_MS, ITEMS, STACKS, BAG_SLOTS, PICKUP_RANGE, expToNext, HURT_INVULN_MS, DENS, DEN_W, BOSS_RESPAWN_MS, BOSS_WINDOW_MS, BOSS_REPEAT_SHARE, LEVEL_MIN, overlevelScale, OVERLEVEL_GRACE, BOSS_HP_PER_PLAYER, FIELD_BOSS_RESPAWN_MS, PHASE_AT, COMBO_CHANCE, COMBO_MAX, ULT_FIRST, ULT_EVERY, ULT_WARN, NOVA_SAFE, WAVE_SPEED, isCombat, SHOPS, SHOP_RANGE, sellPrice, BUY_MAX, COSMETICS, canScroll, rollScroll, slotsOf, enhName, gearSlotOf, STAFF_OF, BOW_OF, STAFF_OFFKIND, lootFits, STAFF_BOLT_MULT, BOW_SHOT_MULT, rebirthCost, PARTY_MECHS, partyActive, partyBit, FOCUS_S, FOCUS_GAP, FOCUS_ATK, TAUNT_S, PULSE_EVERY, PULSE_WARN, PULSE_HP, CURSE_EVERY, CURSE_WARN, CURSE_R, CURSE_MAX, CURSE_DOT, CURSE_S, CURSE_FADE_R, CURSE_FADE_S, curseMult, BARRIER_EVERY, BARRIER_WARN, BARRIER_S, BARRIER_HP, ARMOUR_EVERY, ARMOUR_WARN, ARMOUR_S, ARMOUR_CRACKS, heavyHit, WEAK_EVERY, WEAK_OPEN_S, WEAK_MARK_S, WEAK_HP, weakOf, weakReach, STAGGER_S, partyHitMult } from '../src/shared/rpg.js';
import { SKILLS, ACTIVE, HOTBAR, POTBAR, AP_STATS, AP_PER_LVL, apOf, apTotal, apSpent, statsFor, cantLearn, cantUnlearn, rankOf, spLeft, spFree, cleanSkills, giftsOf, skillFor, GODS_DUR, GODS_BOOST, weaponOk, CLASSES, CLASS_LVL, ADVANCEMENTS, advanceText, mpRegen, cooldownOf, durOf, mobilityOf, chaseOf, MOMENTUM_MAX, MOMENTUM_DUR, MOMENTUM_STILL, CHILL_S, FREEZE_S, FREEZE_BOSS, FROZEN_BOSS_SLOW, SHATTER_MULT, SHATTER_GRACE_MS, BURN_S, BURN_DPS, BURN_TICK_MS, BURN_SPREAD, ARCANE_MAX, ARCANE_DUR, spendsArcane, arcaneMult, hitKinds, healOf, classNames, HOLY_BOLT_MULT, HOLY_BOLT_HEAL, HOLY_BOLT_HEAL_R, BARB_SLOW, BARB_BONUS, FAR_BONUS, NET_BOSS_SLOW, aOrAn } from '../src/shared/skills.js';
import { createSummons } from './summons.js';
import { SLAP_REACH, TICK_RATE, ROOMS, TOWNS, placeAt, VILLAGE, REBIRTH_X, REBIRTH_RANGE, chargeOpen, applyCharge, chaseRank, retreatOpen } from '../src/shared/sim.js';
import { encodeMobs } from '../src/shared/wire.js';
import { RECIPES, BREW_MAX, cleanSteps, recipeFor, needs, CURE_CD, DRAUGHT_S } from '../src/shared/alchemy.js';
import { wayAt, wayById, sameIsle, ARRIVE_DX } from '../src/shared/waystones.js';
import { caughtBy, cleanBot, BOT_CUT } from './accuse.js';

export const MOB_KINDS = Object.keys(MOBS); // mob kinds go over the wire as an index into this
const GRAVITY = 1400;
const LOOT_LIFE_MS = 90_000;
const SAVE_EVERY_MS = 5000;
const HISTORY = 40; // ticks of position history kept for lag compensation
const MAX_REWIND = 30; // ticks (0.5 s): never rewind further than this
const FAINT_MS = 1600;
const ACTIVE_WINDOW_MS = 60_000; // play time counts as active while you've pressed a key this recently
const CLOCK_GAP_MS = 30_000; // never count more than this between two clock ticks (a stalled server)
const FIELD_BOSS_FIGHT_MS = 20000; // a field boss counts the slimes who hit it this recently as its fighters
const FIELD_BOSS_IDLE_MS = 60000; // nobody's hit it for this long: it heals up and forgets its fighters
const TEST_BOSS_HP = Number(process.env.TEST_BOSS_HP) || 1; // tests only: weaker bosses (dens and field bosses)
const TEST_GOD = !!process.env.TEST_GOD; // tests only: nobody gets hurt
const FIELD_RESPAWN_MS = Number(process.env.TEST_FIELD_RESPAWN_MS) || FIELD_BOSS_RESPAWN_MS; // (tests only: sooner)
// tests only: TEST_PARTY=sprout_king:focus,pulse gives that boss those party mechanics and switches them on
// (partyLive), so the S5 engine can be tried before any real boss has it (docs/testing.md)
for (const spec of (process.env.TEST_PARTY ?? '').split(';').filter(Boolean)) {
  const [kind, list] = spec.split(':');
  if (MOBS[kind]) Object.assign(MOBS[kind], { party: (list ?? '').split(',').filter(Boolean), partyLive: true });
}
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const newChar = () => ({
  lvl: 1, exp: 0, hp: 52, mp: 26, coins: 0,
  bag: [{ id: 'wood_sword', n: 1 }, { id: 'red_jelly', n: 3 }, { id: 'mana_jelly', n: 2 }],
  gear: { helmet: null, weapon: null }, gearE: { helmet: null, weapon: null }, skills: {}, hotbar: Array(HOTBAR).fill(null), potbar: ['red_jelly', 'mana_jelly', null], pvp: true,
  alt: { hotbar: Array(HOTBAR).fill(null), potbar: Array(POTBAR).fill(null) }, set: 0, // the other hotbar setup (swapped from the Esc menu)
  ap: { str: 0, dex: 0, int: 0, luk: 0 }, // ability points (AP_STATS)
  cosmetics: [], wear: [], showHelmet: true, // the Boutique
  ways: [], // the waystones you've attuned to (src/shared/waystones.js)
  bossAt: {}, // den boss kind → when you last got its full reward (BOSS_WINDOW_MS)
  played: 0, active: 0, // ms logged in, and ms of that with a key pressed in the last ACTIVE_WINDOW_MS (clock)
  lb: 1, // the levelling rebalance's rollback has been looked at (ROLLBACK; new characters never need it)
  cls: 'novice', reborn: 0, // your class (CLASSES; chosen at the Rebirth Pool) and how many times you've chosen one
});

// S2, classes (story/archive/s2-plan.md): the one-time notice for characters saved before classes existed
const CLASSES_NEWS = `Classes are here! Everyone is a Novice for now: all your skill points and ability points are refunded (K and I) and your skill hotbars are empty. From Lv ${CLASS_LVL}, choose your class, ${classNames()}, at the Rebirth Pool by Elder Mochi in Slimeville: your first choice is free.`;

// L3, the levelling rebalance's rollback (story/progression.md, owner 2026-10-23): a one-time move of the
// characters who levelled far past their play time (mostly by camping bosses before S0) back to the level
// their estimated play time gives on the new EXP curve (the lower end of the estimate), plus whatever their
// recorded play time (`active`, all of it recorded since that estimate) adds on top at LEVEL_MIN a level.
// chenyirong goes to darrell's level (owner: botting). Gold, bag, gear, house and pets are all kept; skill
// points and AP are refunded, and every boss pays out again. Runs once per character: `lb` marks it done.
const ROLLBACK = { chenyirong: 57, justin: 87, darrell: 57, tyler: 48, qing: 32, wallace: 21 };
// An easter egg (owner, 2026-10-23): these players go back to Lv 1 once, lose every item (a new character's
// starter bag), are sent home to Slimeville, and hold a skill of their own, Challenge the Gods (a gift:
// SKILLS.challenge_gods). keepGold: their gold stays. House and pets are kept. `gods` 2 marks it done
// (chenyirong had an earlier step, `gods` 1, that kept everything but the level).
const GODS_RESET = { chenyirong: { keepGold: false }, justin: { keepGold: true } };
const GODS_NEWS = `The slime gods have seen your stubbornness and wish to test your will. You are Lv 1 again, but you hold a rare gift: Challenge the Gods (on your hotbar, and in the Novice tab of K). For ${GODS_DUR} seconds your HP is stuck at 1 and you hit ${1 + GODS_BOOST} times as hard. Live through it and you are healed to full.`;
export function rollbackLevel(base, activeMs) {
  let lvl = base, min = activeMs / 60_000;
  while (min >= LEVEL_MIN(lvl)) min -= LEVEL_MIN(lvl++);
  return lvl;
}

// players: the server's id → player map. send(ws, msg). toRoom(room)(msg). broadcast(msg).
export function createRpg({ dbPath, players, send, toRoom, broadcast }) {
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS rpg_chars (user TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL)`);
  const loadRow = db.prepare('SELECT data FROM rpg_chars WHERE user = ?');
  const saveRow = db.prepare(`INSERT INTO rpg_chars (user, data, updated_at) VALUES (?, ?, ?)
                              ON CONFLICT(user) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`);

  let tick = 0, nextMob = 1, nextLoot = 1;
  const mobs = SPAWNS.map((sp) => spawn({ id: nextMob++, sp: { ...sp, room: sp.room ?? FIELD } }));
  for (const d of DENS) mobs.push(spawn({ id: nextMob++, sp: { kind: d.boss, x0: 200, x1: DEN_W - 200, y: ROOMS[d.room].ground, room: d.room }, den: d }));
  const loot = []; // { id, room, item, n, x, y, at }
  const inRoom = (room) => [...players.entries()].filter(([, q]) => q.joined && q.rpg && q.state.room === room);
  const now = () => Date.now();

  function spawn(m) {
    const k = MOBS[m.sp.kind], hp = Math.round(k.hp * (k.boss || k.field ? TEST_BOSS_HP : 1));
    return Object.assign(m, {
      kind: m.sp.kind, room: m.sp.room, x: m.den ? DEN_W * 0.7 : rand(m.sp.x0, m.sp.x1), y: m.sp.y, vx: 0, vy: 0, dir: -1, walk: 0, hp, maxHp: hp, fighters: 1,
      wander: rand(0.5, 2), target: null, targetUntil: 0, dead: false, respawnAt: 0, hitters: new Map(), hist: [], slowUntil: 0,
      // the Mage's combos (S2.6, skills.js CHILL_S…): chilled / frozen until, a burn { until, dps, by, next }
      chillUntil: 0, frozenUntil: 0, burn: null,
      // the Archer's (S4): netted until (Net Trap), and Hunter's Mark { until, boost, by }
      snareUntil: 0, mark: null,
      // bosses: walk → warn → act, every few seconds
      phase: 'walk', next: 3, timer: 0, act: null, enraged: false, last: null, emptyFor: 0,
      stage: 0, chain: 0, ultAt: 0, ultArmed: false, ult: null, ultLiveUntil: 0, rains: [], slamR: 300,
      // the newer mobs' tricks (mobAi) and bosses: special = phased / mid-teleport / Pyra's egg
      aiCd: rand(1, k.ai?.every ?? 3), aiPhase: null, aiTimer: 0, special: false, egg: null, ultN: 0,
      hover: k.fly ?? 0, hoverCur: k.fly ?? 0, dive: null, later: [],
      // bosses and field bosses: damage dealt by each slime (name → HP) since its HP was last full
      dmg: new Map(), dmgDirty: true,
      // and (S3) healing done and damage taken while it was fought (name → HP), for the support roles
      heal: new Map(), taken: new Map(),
      // S5's party mechanics (partyTick): the bits switched on, focus { p, id, until }, when the next focus and
      // pulse come, Rally's taunt
      partyOn: 0, partySentAt: 0, focus: null, focusLast: null, focusNext: 0, pulseAt: 0, pulseHit: 0, tauntUntil: 0,
      // S5.2: the stagger (until, or one waiting for the move it's in to end), the curse's next cast and the sigil on
      // its way { x, at }, the shield phase { kind: 'barrier' | 'armour', from (after its warning), until, hp, max,
      // cracks } and when the next comes, the weak point { until, fill, max } and when it next opens
      staggerUntil: 0, staggerQueued: false, curseAt: 0, curseSigil: null, shield: null, shieldNext: 0, shieldLast: null, weak: null, weakNext: 0,
    });
  }

  // ——— characters ———
  const brewOf = (c) => ((c.brew?.until ?? 0) > now() ? ITEMS[c.brew.id].buff : null); // a brewed potion's buff
  const arcaneOf = (p) => (p.arcane && p.arcane.until > now() ? p.arcane.n : 0); // Arcane Charge's charges (Mage)
  const momentumOf = (p) => (p.momentum && p.momentum.until > now() ? p.momentum.n : 0); // Momentum's stacks (Warrior)
  const buffsOf = (p) => ({ momentum: momentumOf(p), gods: (p.godsUntil ?? 0) > now(), berserk: (p.berserkUntil ?? 0) > now(), manaShield: !!p.rpg.shield, rally: (p.rallyUntil ?? 0) > now() ? p.rallyBoost : 0, brew: brewOf(p.rpg) });
  const stats = (p) => statsFor(p.rpg, buffsOf(p));
  const left = (until) => Math.max(0, (until ?? 0) - now());
  const zones = []; // Sanctuaries: { room, x, r, until, cut }
  // The Cleric's summons (S3): run like mobs (server/summons.js), their hits credited to the Cleric
  const summons = createSummons({ players, mobs, toRoom, stats, damage, heal: (id, p, qid, q, amt) => healFrom(id, p, qid, q, amt) });
  // The damage meter's other columns (S3): healing done (key 'heal') and damage taken ('taken'), credited to
  // every den boss and every field boss being fought in room. A heal also counts as fighting it (EXP, loot).
  function credit(room, id, name, key, amt) {
    const t = now();
    for (const m of mobs) {
      if (m.dead || m.gone || m.room !== room || !(m.den || (MOBS[m.kind].field && t - Math.max(0, ...m.hitters.values()) < FIELD_BOSS_FIGHT_MS))) continue;
      m[key].set(name, (m[key].get(name) ?? 0) + amt);
      m.dmgDirty = true;
      if (key === 'heal') m.hitters.set(id, t);
    }
  }
  // Player id / p heals qid / q for amt (capped at q's max HP): +HP over q for the room (pop: false when the
  // skill's echo shows it), healing on the meter. → the HP healed
  function healFrom(id, p, qid, q, amt, pop = true) {
    if (!q?.rpg || q.faintUntil || !q.joined) return 0;
    const a = Math.max(0, Math.min(stats(q).maxHp - q.rpg.hp, Math.round(amt)));
    if (a < 1) return 0;
    q.rpg.hp += a;
    if (pop) toRoom(q.state.room)({ t: 'thirst', id: qid, n: a });
    sendMe(q);
    credit(q.state.room, id, p.name, 'heal', a);
    return a;
  }
  function load(p) {
    let c;
    try {
      c = JSON.parse(loadRow.get(p.name)?.data ?? 'null');
    } catch {}
    const fresh = newChar();
    p.rpg = { ...fresh, ...(c ?? {}) };
    const r = p.rpg;
    r.bag = (r.bag ?? []).filter((b) => ITEMS[b?.id]).slice(0, BAG_SLOTS);
    // (before S1 the weapon slot was called `sword`)
    const oldSword = r.gear?.sword, oldSwordE = r.gearE?.sword;
    r.gear = { helmet: r.gear?.helmet ?? null, weapon: r.gear?.weapon ?? oldSword ?? null };
    r.gearE = { helmet: r.gearE?.helmet ?? null, weapon: r.gearE?.weapon ?? (r.gear.weapon === oldSword ? oldSwordE : null) ?? null };
    for (const s of ['helmet', 'weapon']) if (gearSlotOf(r.gear[s]) !== s) r.gear[s] = null;
    for (const s of ['helmet', 'weapon']) if (!r.gear[s]) r.gearE[s] = null; // scroll enhancements
    r.cls = CLASSES[r.cls] ? r.cls : 'novice';
    r.reborn = Math.max(0, Math.floor(Number(r.reborn) || 0));
    r.skills = cleanSkills(r); // (only your class's skills, opened by your level, adding up)
    const skillBar = (b) => Array.from({ length: HOTBAR }, (_, i) => (ACTIVE(b?.[i]) && skillFor(r.cls, b[i]) ? b[i] : null));
    const potBar = (b) => Array.from({ length: POTBAR }, (_, i) => (ITEMS[b?.[i]]?.kind === 'potion' ? b[i] : null));
    r.hotbar = skillBar(r.hotbar);
    r.potbar = potBar(r.potbar);
    if (c && !c.potbar) r.potbar = fresh.potbar; // characters from before the hotbar
    r.alt = { hotbar: skillBar(r.alt?.hotbar), potbar: potBar(r.alt?.potbar) };
    r.set = r.set === 1 ? 1 : 0;
    r.ap = Object.fromEntries(AP_STATS.map(({ id }) => [id, Math.max(0, Math.floor(Number(r.ap?.[id]) || 0))]));
    if (apSpent(r.ap) > apTotal(r.lvl)) r.ap = { ...fresh.ap };
    const st = stats(p);
    r.hp = Math.min(st.maxHp, Math.max(1, r.hp));
    r.mp = Math.min(st.maxMp, Math.max(0, r.mp ?? st.maxMp));
    r.pvp = r.pvp !== false;
    r.cosmetics = (r.cosmetics ?? []).filter((id) => COSMETICS[id]);
    r.wear = (r.wear ?? []).filter((id) => r.cosmetics.includes(id));
    r.showHelmet = r.showHelmet !== false;
    r.brew = ITEMS[r.brew?.id]?.buff && r.brew.until > now() ? { id: r.brew.id, until: r.brew.until } : null;
    r.town = TOWNS[r.town] ? r.town | 0 : 0;
    r.ways = [...new Set((Array.isArray(r.ways) ? r.ways : []).filter(wayById))];
    r.bossAt = Object.fromEntries(Object.entries(r.bossAt ?? {}).filter(([k, at]) => MOBS[k]?.boss && Number.isFinite(at) && at <= now() && now() - at < BOSS_WINDOW_MS));
    for (const k of ['played', 'active']) r[k] = Number.isFinite(r[k]) && r[k] > 0 ? Math.floor(r[k]) : 0;
    cleanBot(r); // accused of botting (server/accuse.js)
    if (c && !c.lb) { // (a saved character from before the rollback: fresh ones start with lb)
      const to = ROLLBACK[p.name] ? rollbackLevel(ROLLBACK[p.name], r.active) : r.lvl;
      if (to < r.lvl) {
        const from = r.lvl;
        Object.assign(r, { lvl: to, exp: 0, skills: {}, ap: { ...fresh.ap }, bossAt: {} });
        r.hotbar = Array(HOTBAR).fill(null);
        r.alt.hotbar = Array(HOTBAR).fill(null);
        r.hp = stats(p).maxHp;
        r.mp = stats(p).maxMp;
        p.notice = `Levelling has been rebalanced: you're now Lv ${to} (from Lv ${from}), where your play time puts you. Everything you own is kept, your skill points and ability points are refunded (K and I), and every boss is worth fighting again.`;
      }
      r.lb = 1;
      p.dirty = true;
    }
    if (c && !c.cls) { // S2 (one time): a character from before classes becomes a Novice, every point refunded
      Object.assign(r, { cls: 'novice', reborn: 0, skills: {}, ap: { ...fresh.ap } });
      r.hotbar = Array(HOTBAR).fill(null);
      r.alt.hotbar = Array(HOTBAR).fill(null);
      const st2 = stats(p);
      r.hp = Math.min(st2.maxHp, r.hp);
      r.mp = Math.min(st2.maxMp, r.mp);
      p.news = 'classes'; // (the client can show it as a banner)
      p.notice = [p.notice, CLASSES_NEWS].filter(Boolean).join('\n');
      p.dirty = true;
    }
    const gods = GODS_RESET[p.name];
    if (gods && !(r.gods >= 2)) { // the easter egg (once): Lv 1 in Slimeville, no items, the gift on the hotbar
      if (!gods.keepGold) r.coins = 0;
      Object.assign(r, { lvl: 1, exp: 0, bag: fresh.bag, gear: fresh.gear, gearE: fresh.gearE, potbar: fresh.potbar, brew: null, skills: {}, ap: { ...fresh.ap }, bossAt: {}, town: 0, gods: 2 });
      r.hotbar = ['challenge_gods', ...Array(HOTBAR - 1).fill(null)];
      r.alt = { hotbar: Array(HOTBAR).fill(null), potbar: Array(POTBAR).fill(null) };
      p.goHome = true; // (index.js: not put back where they stood before a restart)
      r.hp = stats(p).maxHp;
      r.mp = stats(p).maxMp;
      p.notice = `${GODS_NEWS} To begin, they have taken ${gods.keepGold ? 'your things' : 'your gold and your things'}, and sent you home to Slimeville.`;
      p.dirty = true;
    }
    // gift skills: only their own account holds them, and it always does
    r.skills = Object.fromEntries(Object.entries(r.skills).filter(([id]) => !SKILLS[id].gift));
    for (const [id, sk] of Object.entries(SKILLS)) if ([sk.gift].flat().includes(p.name)) r.skills[id] = 1;
    p.hurtAt = 0;
    p.clockAt = now();
    p.cds = {};
    p.hist = [];
    p.dirty = !c;
    moves(p);
  }
  // the Mobility skills and the Warrior's chase moves ride along in the physics state (sim.js step), so
  // prediction knows them too
  function moves(p) {
    if (!p.state || !p.rpg) return;
    p.state.mv = mobilityOf(p.rpg.skills);
    p.state.mw = chaseOf(p.rpg.skills);
  }
  // Play time (owner, 2026-10-23: for balancing levelling speed): logged-in time, and the active part of it
  function clock(p) {
    const t = now(), dt = Math.min(CLOCK_GAP_MS, Math.max(0, t - (p.clockAt ?? t)));
    p.clockAt = t;
    if (!dt) return;
    p.rpg.played += dt;
    if (t - (p.keysAt ?? 0) < ACTIVE_WINDOW_MS) p.rpg.active += dt;
    p.dirty = true;
  }
  function save(p) {
    if (p.rpg && p.joined) clock(p);
    if (!p.rpg || !p.dirty) return;
    const { lvl, exp, hp, mp, coins, bag, gear, gearE, skills, hotbar, potbar, alt, set, ap, pvp, cosmetics, wear, showHelmet, brew, ways, bossAt, bot, accusedAt, played, active, lb, cls, reborn, gods, shield } = p.rpg;
    const town = p.state?.town | 0; // your town (TOWNS in sim.js) lives in the physics state, and is saved with you
    saveRow.run(p.name, JSON.stringify({ lvl, exp, hp, mp, coins, bag, gear, gearE, skills, hotbar, potbar, alt, set, ap, pvp, cosmetics, wear, showHelmet, brew, town, ways, bossAt, bot, accusedAt, played, active, lb, cls, reborn, gods, shield }), now());
    p.dirty = false;
  }
  setInterval(() => {
    for (const p of players.values()) if (p.joined) save(p);
  }, SAVE_EVERY_MS).unref();

  // Your own stats, bag, gear, skills and hotbar: sent to you whenever any of it changes
  function sendMe(p) {
    const c = p.rpg, st = stats(p);
    p.dirty = true;
    send(p.ws, {
      t: 'me', down: p.faintUntil === Infinity ? 1 : undefined, lvl: c.lvl, exp: c.exp, next: expToNext(c.lvl), hp: Math.ceil(c.hp), maxHp: st.maxHp, mp: Math.floor(c.mp), maxMp: st.maxMp,
      coins: c.coins, bag: c.bag, gear: c.gear, gearE: c.gearE, atk: st.atk, magic: st.magic, heal: st.heal, def: st.def, skills: c.skills, sp: spFree(c), spLeft: spLeft(c), cls: c.cls, reborn: c.reborn,
      hotbar: c.hotbar, potbar: c.potbar, alt: c.alt, set: c.set, pvp: c.pvp, crit: st.crit, critMult: st.critMult, minRoll: st.minRoll,
      ap: c.ap, apLeft: apTotal(c.lvl) - apSpent(c.ap),
      cosmetics: c.cosmetics, wear: c.wear, showHelmet: c.showHelmet,
      momentum: momentumOf(p), momentumLeft: momentumOf(p) ? left(p.momentum.until) : 0, arcane: arcaneOf(p),
      berserk: left(p.berserkUntil), shield: c.shield ? 1 : 0, barrier: p.barrier && p.barrier.until > now() ? Math.ceil(p.barrier.left) : 0, barrierLeft: left(p.barrier?.until), mend: left(p.mend?.until), fire: st.fire, rally: left(p.rallyUntil), bubble: left(p.bubbleUntil), aegis: left(p.aegisUntil), gods: left(p.godsUntil), secondWind: left(p.swReadyAt),
      brew: brewOf(c) ? { id: c.brew.id, left: left(c.brew.until) } : null,
      curse: p.curse ? { n: p.curse.n, left: left(p.curse.until) } : undefined, // (S5.2: a boss's curse stacks)
      draught: left(p.draughtUntil), cure: left(p.cureAt), // (S5.5: a Barrier Draught waiting for a pulse; the two potions' shared cooldown)
      ways: c.ways,
    });
  }
  // What everyone else sees of you: gear, level and friendly fire (also part of join / welcome)
  const look = (p) => ({ cls: p.rpg.cls, gear: p.rpg.gear, lvl: p.rpg.lvl, pvp: p.rpg.pvp, wear: p.rpg.wear, showHelmet: p.rpg.showHelmet, plus: p.rpg.gearE?.weapon?.s ?? 0 });
  const showLook = (id, p, extra = {}) => broadcast({ t: 'gear', id, ...look(p), ...extra });
  const toast = (p, text) => send(p.ws, { t: 'toast', text });

  // e: a piece of gear's scroll enhancement (it travels with the item)
  function addToBag(c, id, n, e) {
    const slot = STACKS(id) && c.bag.find((b) => b.id === id);
    if (slot) slot.n += n;
    else if (c.bag.length < BAG_SLOTS) c.bag.push(e ? { id, n, e } : { id, n });
    else return false;
    return true;
  }

  // share: this is a caught botter's cut going to their accuser (it isn't skimmed again)
  function gainExp(qid, q, exp, share = false) {
    const c = q.rpg;
    const by = caughtBy(c); // caught botting (server/accuse.js): no EXP, and the accuser skims BOT_CUT of it
    if (by) {
      const t = !share && [...players].find(([, x]) => x.joined && x.rpg && x.name === by);
      if (t) gainExp(t[0], t[1], Math.round(exp * BOT_CUT), true);
      return;
    }
    c.exp += exp;
    let up = false;
    const was = c.lvl, freeWas = spFree(c);
    while (c.exp >= expToNext(c.lvl)) {
      c.exp -= expToNext(c.lvl);
      c.lvl++;
      up = true;
    }
    if (up) {
      const st = stats(q);
      c.hp = st.maxHp;
      c.mp = st.maxMp;
      showLook(qid, q, { up: true });
      const pts = spFree(c) - freeWas;
      toast(q, `Level up! You're level ${c.lvl} (${pts > 0 ? `+${pts} skill point${pts > 1 ? 's' : ''}: K · ` : ''}+${AP_PER_LVL * (c.lvl - was)} ability points: I)`);
      // an advancement opened: a banner (ADVANCEMENTS)
      for (const a of ADVANCEMENTS) if (was < a.lvl && c.lvl >= a.lvl) send(q.ws, { t: 'advance', lvl: a.lvl, cls: c.cls, text: advanceText(c.cls, a.lvl) });
    }
    sendMe(q);
  }

  // ——— hurting slimes ———
  const hurtMsg = (id, p, dmg, by) => ({ t: 'hurt', id, dmg, hp: Math.max(0, Math.ceil(p.rpg.hp)), max: stats(p).maxHp, by });
  // 0 HP: splat where you stand (everyone in the room sees it), then wake up in your town (TOWNS: the last
  // one you were in)
  function faint(id, p, by) {
    p.rpg.hp = 0;
    p.godsUntil = 0; // (Challenge the Gods lost: no heal at the end)
    p.momentum = null;
    p.arcane = null;
    p.barrier = p.mend = null;
    p.draughtUntil = 0; // (and drops a Barrier Draught, S5.5)
    if (p.curse) uncurse(id, p, true); // (a KO lifts a curse, S5.2)
    // in a combat room you stay down where you fell until you ask to wake up in town ({t:'wake'}), so a
    // Cleric can come and Revive you (owner, 2026-10-24: get everyone used to that); elsewhere, a moment
    const t = now(), down = isCombat(p.state.room);
    p.faintUntil = down ? Infinity : t + FAINT_MS; // inputs are ignored meanwhile (index.js)
    p.faintAt = t;
    p.faintBy = by;
    for (const m of mobs) if (m.target === p) m.target = null;
    toRoom(p.state.room)({ t: 'faint', id, by, down: down ? 1 : undefined });
    sendMe(p);
  }
  // Challenge the Gods ran out with you still standing: healed to full
  function godsEnd(id, p) {
    p.godsUntil = 0;
    if (!p.rpg || !p.joined) return;
    const amt = Math.round(stats(p).maxHp - p.rpg.hp);
    p.rpg.hp = stats(p).maxHp;
    if (amt > 0) toRoom(p.state.room)({ t: 'thirst', id, n: amt });
    toast(p, 'You stared down the gods and lived. Healed to full!');
    sendMe(p);
  }
  function wakeUp(id, p) {
    const c = p.rpg;
    toRoom(p.state.room)({ t: 'woke', id }); // (the puddle where you fell goes)
    const lost = Math.min(c.exp, Math.floor(expToNext(c.lvl) * 0.1));
    c.exp -= lost;
    c.hp = stats(p).maxHp;
    p.faintUntil = 0;
    const town = TOWNS[p.state.town | 0] ?? TOWNS[0];
    placeAt(p.state, town.room, town.x + randInt(0, 120)); // (keeps your house door working, which it didn't before)
    moves(p);
    toast(p, `${p.faintBy ? `${p.faintBy} knocked you out!` : 'You fainted!'} You woke up in ${town.name}${lost ? ` (lost ${lost} EXP)` : ''}`);
    sendMe(p);
  }
  // Damage a slime (from a mob, a boss attack or a friend), with knockback away from fromX.
  // ult: a boss ultimate, which knocks you out outright, unless you're shielded (Aegis, Jelly Bubble),
  // standing in a Sanctuary (then it's 60% of your max HP), or Second Wind saves you.
  const guard = (qid, q, what) => toRoom(q.state.room)({ t: 'guard', id: qid, what });
  // mob: the mob that did it (the damage meter's "taken" column), if it was one. flat: raw is the damage
  // itself, past DEF and the roll, and it can't be dodged (a boss's pulse, S5); knock 0: not knocked back.
  // flat 'dot': a curse's burn (S5.2): flat, and it doesn't pop a Bubble, start the after-hit invulnerability or
  // flash the screen (Aegis still blocks it, quietly)
  function hurt(qid, q, raw, fromX, by, knock = 380, ult = false, mob = null, flat = false) {
    if (q.faintUntil || TEST_GOD) return;
    const t = now(), st = stats(q), dot = flat === 'dot';
    if ((q.aegisUntil ?? 0) > t) return dot ? undefined : guard(qid, q, 'block');
    if (flat === true && (q.draughtUntil ?? 0) > t) { // a Barrier Draught (S5.5) takes a boss's pulse whole, once
      q.draughtUntil = 0;
      sendMe(q);
      return guard(qid, q, 'draught');
    }
    if ((q.bubbleUntil ?? 0) > t && !dot) {
      q.bubbleUntil = 0; // the bubble takes the hit, and pops
      sendMe(q);
      return guard(qid, q, 'pop');
    }
    if (!ult && !flat && st.evade && Math.random() < st.evade) { // Evasion (Archer, S4): it misses, but you're still knocked
      q.hurtAt = t; // back, as the client predicted (src/rpg.js step), so the physics stays in step
      knockBack(q, fromX, knock);
      sendMe(q);
      return guard(qid, q, 'dodge');
    }
    const bar = q.barrier && q.barrier.until > t ? q.barrier : null; // a Cleric's Barrier (S3)
    if (bar && ult) {
      q.barrier = null; // it takes the ultimate instead of you, and breaks
      sendMe(q);
      return guard(qid, q, 'barrier');
    }
    const zone = zones.find((z) => z.room === q.state.room && z.until > t && Math.abs(q.state.x - z.x) < z.r);
    let dmg = ult ? (zone ? Math.round(st.maxHp * 0.6) : Math.ceil(q.rpg.hp) + 1) : flat ? Math.max(1, Math.round(raw)) : Math.max(1, Math.round(raw * rand(0.85, 1.15) - st.def));
    if (zone && !ult) dmg = Math.max(1, Math.round(dmg * (1 - zone.cut)));
    const totem = ult ? 0 : summons.cutAt(q); // a Guardian Totem near you
    if (totem) dmg = Math.max(1, Math.round(dmg * (1 - totem)));
    if (st.ward && !ult) dmg = Math.max(1, Math.round(dmg * (1 - st.ward))); // a brewed ward
    if (bar) { // the Barrier soaks it up first
      const soak = Math.min(bar.left, dmg);
      bar.left -= soak;
      dmg -= soak;
      if (bar.left <= 0) q.barrier = null;
      if (dmg <= 0) {
        if (!dot) q.hurtAt = t;
        sendMe(q);
        return dot ? undefined : guard(qid, q, 'soak');
      }
      if (!q.barrier) guard(qid, q, 'barrier');
    }
    if (st.manaShield && !ult) { // Mana Shield: a share of it comes off MP while there's MP
      const take = Math.min(Math.round(dmg * st.manaShield), Math.floor(q.rpg.mp));
      q.rpg.mp -= take;
      dmg -= take;
    }
    if (!dot) q.hurtAt = t;
    q.rpg.hp -= dmg;
    if (mob) credit(q.state.room, qid, q.name, 'taken', Math.min(dmg, Math.max(0, Math.ceil(q.rpg.hp + dmg))));
    const sw = rankOf(q.rpg.skills, 'second_wind');
    if (q.rpg.hp <= 0 && sw && t >= (q.swReadyAt ?? 0)) {
      q.rpg.hp = 1; // Second Wind
      q.swReadyAt = t + SKILLS.second_wind.cdFor(sw) * 1000;
      guard(qid, q, 'secondwind');
    }
    toRoom(q.state.room)(dot ? { ...hurtMsg(qid, q, dmg, by), dot: 1 } : hurtMsg(qid, q, dmg, by));
    if (q.rpg.hp <= 0) return faint(qid, q, by);
    if (knock) knockBack(q, fromX, knock);
    sendMe(q);
  }
  // knocked back (and up): the client's prediction catches up from the next snapshot
  function knockBack(q, fromX, knock) {
    const s = q.state;
    s.vx = Math.sign(s.x - fromX || 1) * knock;
    s.vy = -Math.min(420, knock * 1.1);
    s.grounded = s.onPlat = false;
  }

  // Slapping a friend in a combat room hurts them too, if you both have friendly fire on
  function pvp(id, p, dir, hits) {
    if (!p.rpg.pvp || p.faintUntil) return;
    for (const qid of hits) {
      const q = players.get(qid);
      if (!q?.rpg?.pvp) continue;
      hurt(qid, q, stats(p).atk * 0.6, p.state.x - dir * 10, p.name, 300);
    }
  }

  // ——— where a slime was at server tick vt (slaps on friends are judged where the slapper saw them) ———
  function record(o, x, y) {
    o.hist ??= [];
    o.hist.push([tick, x, y]);
    if (o.hist.length > HISTORY) o.hist.shift();
  }
  function posAt(o, vt, x = o.x, y = o.y) {
    if (!Number.isFinite(vt) || !o.hist?.length) return { x, y };
    const want = Math.max(tick - MAX_REWIND, Math.min(tick, Math.round(vt)));
    for (let i = o.hist.length - 1; i >= 0; i--) if (o.hist[i][0] <= want) return { x: o.hist[i][1], y: o.hist[i][2] };
    return { x: o.hist[0][1], y: o.hist[0][2] };
  }
  const playerAt = (q, vt) => posAt(q, vt, q.state.x, q.state.y);

  // ——— loot on the ground ———
  const lootMsg = (room) => ({ t: 'loot', l: loot.filter((d) => d.room === room).map((d) => [d.id, d.item, d.n, d.x, d.y]) });
  const showLoot = (room) => toRoom(room)(lootMsg(room));
  function dropLoot(room, item, n, x, y, e) {
    loot.push({ id: nextLoot++, room, item, n, e, x: Math.round(Math.max(20, Math.min(ROOMS[room].width - 20, x))), y, at: now() });
    if (loot.length > 200) loot.shift();
  }

  // A dropping sword with a staff twin (STAFF_OF) and a bow twin (BOW_OF, S4): which one falls. The weapon kind
  // a random fighter is holding, so everyone sees drops they can use; STAFF_OFFKIND of the time one of the
  // others, so every kind turns up.
  function twinPick(m, sword) {
    const of = { sword, staff: STAFF_OF[sword], bow: BOW_OF[sword] }, kinds = Object.keys(of).filter((k) => of[k]);
    const held = [...m.hitters.keys()].map((qid) => ITEMS[players.get(qid)?.rpg?.gear.weapon]?.kind).filter((k) => kinds.includes(k));
    let kind = held.length ? held[Math.floor(Math.random() * held.length)] : kinds[Math.floor(Math.random() * kinds.length)];
    if (Math.random() < STAFF_OFFKIND) { const other = kinds.filter((k) => k !== kind); kind = other[Math.floor(Math.random() * other.length)] ?? kind; }
    return of[kind];
  }

  function kill(m) {
    const k = MOBS[m.kind];
    m.dead = true;
    m.respawnAt = now() + (k.boss ? BOSS_RESPAWN_MS : k.field ? FIELD_RESPAWN_MS : MOB_RESPAWN_MS);
    // everyone who hit it in the last 20 s (a boss or field boss: the whole fight) gets the EXP: it's a co-op
    // village. Less if you're far above its level (overlevelScale), and a den boss gives its full reward
    // once per BOSS_WINDOW_MS per slime (story/progression.md, S0)
    const t = now();
    let fresh = false; // someone here has this boss's window open: the loot rolls at full chance
    for (const [qid, at] of m.hitters) {
      const q = players.get(qid);
      if (!q?.joined || q.state.room !== m.room || t - at >= (k.boss || k.field ? 600_000 : 20000)) continue;
      let scale = overlevelScale(q.rpg.lvl, k.lvl) * (1 + (brewOf(q.rpg)?.exp ?? 0)); // (a brewed EXP buff)
      if (k.boss) {
        const last = q.rpg.bossAt[m.kind] ?? 0;
        if (t - last >= BOSS_WINDOW_MS) {
          q.rpg.bossAt[m.kind] = t;
          q.dirty = true;
          fresh = true;
          toast(q, `Full reward from ${k.name}! Its next full reward for you is in ${BOSS_WINDOW_MS / 60_000} min${q.rpg.lvl - k.lvl > OVERLEVEL_GRACE ? ` (less EXP: you're far above its level)` : ''}`);
        } else {
          scale *= BOSS_REPEAT_SHARE;
          toast(q, `You had ${k.name}'s full reward lately: ${Math.round(BOSS_REPEAT_SHARE * 100)}% EXP and rarer loot for ${Math.ceil((last + BOSS_WINDOW_MS - t) / 60_000)} more min`);
        }
      }
      gainExp(qid, q, Math.round(k.exp * scale));
    }
    const odds = k.boss && !fresh ? BOSS_REPEAT_SHARE : 1;
    const drops = k.drops.filter(([, chance]) => Math.random() < chance * odds).map((d) => (STAFF_OF[d[0]] || BOW_OF[d[0]] ? [twinPick(m, d[0]), ...d.slice(1)] : d));
    drops.forEach(([item, , lo, hi], i) => dropLoot(m.room, item, randInt(lo, hi), m.x + (i - (drops.length - 1) / 2) * (k.boss || k.field ? 34 : 22) + rand(-6, 6), ROOMS[m.room].ground > m.y ? m.y : ROOMS[m.room].ground));
    if (k.field) toRoom(m.room)({ t: 'boss', a: 'fieldDown', id: m.id, kind: m.kind, x: m.x, y: m.y });
    if (k.boss) {
      toRoom(m.room)({ t: 'boss', a: 'die', id: m.id, x: m.x, y: m.y });
      bossSays(m, k.lines?.freed);
      for (const q of mobs) if (q.minion && q.room === m.room) q.dead = q.gone = true; // the minions flee
    }
    if (m.minion) m.gone = true;
    if (k.ai?.kind === 'split') {
      // a Cogling falls apart into Cogbits (they don't respawn)
      for (let i = 0; i < k.ai.n; i++) {
        const bit = spawn({ id: nextMob++, sp: { kind: k.ai.into, x0: m.sp.x0, x1: m.sp.x1, y: m.sp.y, room: m.room }, minion: true });
        bit.x = Math.max(m.sp.x0, Math.min(m.sp.x1, m.x + (i ? 18 : -18)));
        bit.vx = (i ? 1 : -1) * 220;
        bit.vy = -320;
        bit.target = m.target;
        bit.targetUntil = now() + 8000;
        mobs.push(bit);
      }
    }
    showLoot(m.room);
  }

  // Hit mob m for dmg (from player id / p, toward dir); returns the hit for the broadcast
  function damage(m, dmg, crit, id, p, dir, knock = 200) {
    if (m.egg) {
      // Pyra's Rebirth: hits crack the egg first; break it in time and she's stunned
      m.egg.hp -= dmg;
      m.hitters.set(id, now());
      if (m.egg.hp <= 0) eggBreaks(m);
      return [m.id, dmg, crit ? 1 : 0, 0];
    }
    m.hitters.set(id, now());
    if (MOBS[m.kind].field) fieldFighters(m);
    if (MOBS[m.kind].boss || MOBS[m.kind].field) {
      m.dmg.set(p.name, (m.dmg.get(p.name) ?? 0) + Math.min(dmg, Math.max(0, m.hp))); // (overkill doesn't count)
      m.dmgDirty = true;
    }
    m.hp -= dmg;
    if (!m.focus && !(m.tauntUntil > now())) { // (a Knight's taunt and a boss's focus hold its eye)
      m.target = p;
      m.targetUntil = now() + 8000;
    }
    if (!MOBS[m.kind].boss && !MOBS[m.kind].field && !MOBS[m.kind].fly && !MOBS[m.kind].anchored && knock) { // (anchored: a wasp nest doesn't slide)
      m.vx = dir * knock; // knocked back a little
      if (!MOBS[m.kind].hops || m.vy === 0) m.vy = -180;
    }
    const killed = m.hp <= 0;
    if (killed) kill(m);
    return [m.id, dmg, crit ? 1 : 0, killed ? 1 : 0];
  }
  // A field boss gets tougher with every extra slime fighting it (the ones who hit it lately), like a den
  // boss with every extra slime in its den; it keeps the damage already done
  function fieldFighters(m) {
    const t = now(), n = [...m.hitters.values()].filter((at) => t - at < FIELD_BOSS_FIGHT_MS).length;
    if (n <= m.fighters) return;
    const max = Math.round(MOBS[m.kind].hp * (1 + BOSS_HP_PER_PLAYER * (n - 1)));
    m.hp += max - m.maxHp;
    m.maxHp = max;
    m.fighters = n;
  }
  const alive = (room) => mobs.filter((m) => !m.dead && m.room === room);
  const SLACK = 200; // px: how far from where we think a mob is the client may hit it (lag, interpolation)
  // Apply hits the client worked out: [[mobId, dmg, crit, shatter?], …] → [[mobId, dmg, crit, killed, shattered?], …].
  // el: the spell's element (the Mage's combos, skills.js CHILL_S…): the client marks a fire hit it saw land on
  // a frozen mob (shatter), and the cap allows SHATTER_MULT for it only if the mob really is frozen here
  // S5.2 (the party mechanics, shared/rpg.js partyHitMult): magic: a staff's or a spell's hit (a barrier lets it
  // through, and it wears the barrier down) · heavy: a hit big enough to crack armour (heavyHit) · arrow: an
  // arrow (it reaches a weak point from anywhere). The client marks a hit it aimed at an open weak point (h[4]);
  // it's taken only if the spot is open here and the hitter could reach it (weakReach).
  function applyHits(id, p, hits, { max = 1, range, cap, dir, knock = 200, slow = 0, el = null, magic = false, heavy = false, arrow = false }) {
    const out = [];
    if (!Array.isArray(hits)) return out;
    const cursed = curseMult(p.curse?.n); // (a curse on the hitter: everything it hits, softer)
    const cracked = new Set(); // (armour: one crack a cast)
    for (const h of hits.slice(0, max)) {
      const m = Array.isArray(h) && mobs.find((q) => q.id === h[0] && !q.dead && q.room === p.state.room);
      if (!m || Math.abs(m.x - p.state.x) > range + MOBS[m.kind].w / 2 + SLACK) continue;
      const k = MOBS[m.kind];
      if (m.special && !m.egg) continue; // phased out / mid-teleport: can't be hit
      // an Obsidian Crab's front shell takes most of a hit from the front (the client shows the same cut)
      const shell = k.ai?.kind === 'shell' && Math.sign(p.state.x - m.x) === m.dir ? 1 - k.ai.cut : 1;
      const shatter = el === 'fire' && !!h[3] && m.frozenUntil > now() - SHATTER_GRACE_MS;
      const marked = m.mark && m.mark.until > now() - SHATTER_GRACE_MS ? 1 + m.mark.boost : 1; // Hunter's Mark (S4): everyone's hits
      const ps = m.partyOn ? partyHit(m) : null, weak = !!h[4] && !!ps?.weakOpen && weakReach(weakOf(k, m.x, m.y, m.dir), p.state.y, arrow, 40);
      const pm = ps ? partyHitMult(ps, { magic, heavy: heavy || shatter, weak }) : 1;
      const dmg = Math.max(1, Math.min(Math.round(Number(h[1]) || 0), Math.ceil(cap * shell * marked * cursed * pm * (shatter ? SHATTER_MULT : 1)) + 1));
      if (slow) m.slowUntil = now() + slow * 1000 * (MOBS[m.kind].boss ? 0.5 : 1);
      const hit = damage(m, dmg, !!h[2], id, p, Math.sign(m.x - p.state.x) || dir, knock);
      if (shatter) hit.push(1);
      if (ps && !m.dead) partyHitLanded(m, dmg, { magic, heavy: (heavy || shatter) && !cracked.has(m), weak }) && cracked.add(m);
      if (el && !m.dead) element(m, el, dmg, id, shatter);
      out.push(hit);
    }
    return out;
  }
  // A spell of element el just hit m for dmg (from player id): the combo states (skills.js CHILL_S…)
  function element(m, el, dmg, id, shatter) {
    const t = now(), k = MOBS[m.kind];
    if (el === 'frost') {
      if (m.frozenUntil > t) return; // (already frozen: no refresh, so nothing stays frozen for ever)
      if (m.chillUntil > t) {
        m.chillUntil = 0;
        m.frozenUntil = t + (k.boss || k.field ? FREEZE_BOSS : FREEZE_S) * 1000;
        if (!k.boss && !k.field) m.vx = 0;
        // S5.2's interrupt: a boss frozen while its ultimate is still warning loses the ultimate, then staggers
        if (k.boss && m.act === 'ult' && m.phase === 'warn' && m.ult?.kind !== 'rebirth' && partyOn(m, 'interrupt')) interruptUlt(m, id);
      } else m.chillUntil = t + CHILL_S * 1000;
    } else if (el === 'fire') {
      if (shatter) m.frozenUntil = m.chillUntil = 0;
      burn(m, dmg * BURN_DPS, id);
    } else if (el === 'storm' && m.burn && m.burn.until > t) {
      // Chain Lightning on a burning mob: the fire jumps to the mobs near it (the spreader's burn now)
      for (const q of alive(m.room)) {
        if (q === m || (q.special && !q.egg) || Math.abs(q.x - m.x) > BURN_SPREAD + MOBS[q.kind].w / 2 || Math.abs(q.y - m.y) > BURN_SPREAD) continue;
        if (!q.burn || q.burn.until <= t || q.burn.dps < m.burn.dps) burn(q, m.burn.dps, id);
      }
    }
  }
  // set m burning at dps for BURN_S (from player id); a burn already going keeps the stronger dps
  function burn(m, dps, id) {
    const t = now(), b = m.burn && m.burn.until > t ? m.burn : null;
    if (b && b.dps > dps) b.until = Math.max(b.until, t + BURN_S * 1000);
    else m.burn = { until: t + BURN_S * 1000, dps, by: id, next: b?.next ?? t + BURN_TICK_MS };
  }
  const capOf = (st) => 1.15 * st.critMult; // best roll × crit
  // Jelly Thirst: the hits p just landed heal it a share of their damage (everyone in the room sees the +HP)
  function thirst(id, p, hits) {
    const st = stats(p), c = p.rpg;
    if (!st.thirst || !hits.length || p.faintUntil) return;
    const amt = Math.min(st.maxHp - c.hp, Math.round(hits.reduce((n, h) => n + h[1], 0) * st.thirst));
    if (amt < 1) return;
    c.hp += amt;
    toRoom(p.state.room)({ t: 'thirst', id, n: amt });
    sendMe(p);
  }

  // Momentum (Warrior): a chase move landed, one more stack (sendMe follows from the caller)
  function momentumUp(p) {
    const r = rankOf(p.rpg.skills, 'momentum');
    if (!r) return;
    p.momentum = { n: Math.min(MOMENTUM_MAX, momentumOf(p) + 1), until: now() + MOMENTUM_DUR * 1000 };
    p.movedAt = now();
  }

  // ——— a slap / sword swing / staff bolt in a combat room ———
  // A Charge (Warrior: a slap while dashing or just after, sim.js chargeOpen) is judged from our own state
  // at the slap's input, the same call the client made: a stronger cap, and the same state edit
  // (applyCharge) the client predicted there. → the hits, with `charged` set for the echo
  function attack(id, p, dir, hits) {
    if (p.faintUntil || !isCombat(p.state.room)) return [];
    const st = stats(p);
    if (st.holyBolt) return holyBolt(id, p, dir, hits);
    if (st.arrowRange) return shoot(id, p, dir, hits, st);
    const charged = !st.boltRange && chargeOpen(p.state) && Array.isArray(hits) && hits.length > 0;
    const mult = charged ? SKILLS.charge.mult(chaseRank(p.state.mw, 0)) : 1;
    const out = st.boltRange ? applyHits(id, p, hits, { range: st.boltRange, cap: st.magic * STAFF_BOLT_MULT * capOf(st), dir, knock: 120, magic: true }) : applyHits(id, p, hits, { range: SLAP_REACH + st.reach, cap: st.atk * mult * capOf(st), dir, knock: charged ? 320 : 200, heavy: heavyHit(mult) });
    // Arcane Charge (Mage): a staff bolt that hit stores a charge for the next spell
    if (st.boltRange && out.length && rankOf(p.rpg.skills, 'arcane_charge')) p.arcane = { n: Math.min(ARCANE_MAX, arcaneOf(p) + 1), until: now() + ARCANE_DUR * 1000 };
    if (charged) {
      applyCharge(p.state);
      if (out.length) {
        momentumUp(p);
        sendMe(p);
      }
    }
    thirst(id, p, out);
    out.charged = charged;
    return out;
  }

  // A bow shot (S4): an arrow to the first mob ahead within the bow's range, BOW_SHOT_MULT of ATK. A Retreat
  // Shot (sim.js retreatOpen: dashing or just after, shooting back the way you came) is judged from our own
  // state at the shot's input, like a Charge, but changes nothing about the move.
  function shoot(id, p, dir, hits, st) {
    const r = chaseRank(p.state.mw, 3), retreat = r > 0 && retreatOpen(p.state, dir);
    const mult = BOW_SHOT_MULT * (retreat ? SKILLS.retreat_shot.mult(r) : 1) * barbCap(p);
    const out = applyHits(id, p, hits, { range: st.arrowRange, cap: st.atk * mult * capOf(st), dir, knock: 100, slow: barbSlow(p), arrow: true });
    out.retreat = retreat && out.length > 0;
    return out;
  }
  // Barbed Arrows (Trapper): every arrow slows, and the cap allows its bonus on a slowed mob (the client only
  // adds it when its view of the mob says so: skills.js arrowBonus)
  const barbSlow = (p) => (rankOf(p.rpg.skills, 'barbed_arrows') ? BARB_SLOW : 0);
  const barbCap = (p) => 1 + BARB_BONUS * rankOf(p.rpg.skills, 'barbed_arrows');

  // The Cleric's holy bolt (S3, skills.js HOLY_BOLT_*): the staff bolt's range, and HOLY_BOLT_HEAL of what it did
  // heals the hurt friend nearest you within HOLY_BOLT_HEAL_R (you, when nobody else is hurt)
  function holyBolt(id, p, dir, hits) {
    const st = stats(p);
    const out = applyHits(id, p, hits, { range: st.boltRange, cap: st.magic * HOLY_BOLT_MULT * capOf(st), dir, knock: 120, magic: true });
    const amt = out.reduce((n, h) => n + h[1], 0) * HOLY_BOLT_HEAL * st.heal;
    if (amt >= 1) {
      let best = null, bestD = HOLY_BOLT_HEAL_R;
      for (const [qid, q] of inRoom(p.state.room)) {
        const d = Math.abs(q.state.x - p.state.x);
        if (q !== p && !q.faintUntil && q.rpg.hp < stats(q).maxHp && d < bestD) [best, bestD] = [[qid, q], d];
      }
      const [qid, q] = best ?? [id, p];
      healFrom(id, p, qid, q, amt);
    }
    return out;
  }

  // ——— the Warrior's chase moves (S2.5): Leap Slam's landing and Upward Cut's hits ———
  // The physics (sim.js step) did the move; index.js notes the input it happened at (p.chaseAt), so a
  // claim is only taken for a slam that really landed (a cut that really went off) near that input, once.
  const CHASE_SLACK = 30; // inputs
  function chase(id, p, m) {
    const sk = SKILLS[m.skill], c = p.rpg, s = p.state, rank = rankOf(c.skills, m.skill);
    if (!rank || p.faintUntil || !isCombat(s.room) || !skillFor(c.cls, m.skill)) return;
    const at = p.chaseAt?.[m.skill];
    if (at === undefined || Math.abs((m.s >>> 0) - at) > CHASE_SLACK) return;
    delete p.chaseAt[m.skill];
    const st = stats(p), dir = s.facing < 0 ? -1 : 1;
    const cap = st.atk * sk.mult(rank) * capOf(st);
    const out = { t: 'skill', id, skill: m.skill, dir, x: s.x, y: s.y, hits: [] };
    const heavy = heavyHit(sk.mult(rank));
    out.hits = m.skill === 'leap_slam' ? applyHits(id, p, m.hits, { max: 20, range: sk.radius, cap, dir, knock: 260, heavy }) : applyHits(id, p, m.hits, { max: 8, range: 40, cap, dir, knock: 160, heavy });
    if (out.hits.length) momentumUp(p);
    toRoom(s.room)(out);
    thirst(id, p, out.hits);
    sendMe(p);
  }

  // ——— skills (1–6) ———
  // friends within r of p (including p), in its room
  const near = (p, r) => inRoom(p.state.room).filter(([, q]) => !q.faintUntil && Math.hypot(q.state.x - p.state.x, q.state.y - p.state.y) <= r + 40);
  function cast(id, p, m) {
    const sk = SKILLS[m.skill], c = p.rpg, s = p.state;
    if (sk?.kind === 'chase') return chase(id, p, m);
    if (!ACTIVE(m.skill) || p.faintUntil) return;
    const rank = rankOf(c.skills, m.skill);
    if (!skillFor(c.cls, m.skill)) return toast(p, `${sk.name} isn't one of your class's skills`);
    if (!rank) return toast(p, `You haven't learned ${sk.name} yet (K)`);
    if (!isCombat(s.room)) return toast(p, 'Skills only work out in the Wildwood');
    if ((p.cds[m.skill] ?? 0) > now() + 250) return; // still cooling down (with slack for lag)
    if (c.mp < sk.mp) return send(p.ws, { t: 'nomana' });
    const down = sk.kind === 'revive' || sk.kind === 'miracle' ? downNear(p, sk.radius) : [];
    if (sk.kind === 'revive' && !down.length) return toast(p, 'Nobody near you is knocked out'); // (the client checks first: src/rpg.js cast)
    const cleansed = sk.kind === 'cleanse' ? cleanseTarget(p, sk.radius) : null;
    if (sk.kind === 'cleanse' && !cleansed) return toast(p, 'Nothing to cleanse: nobody near you is cursed'); // (the client checks first too)
    c.mp -= sk.mp;
    p.cds[m.skill] = now() + cooldownOf(m.skill, rank) * 1000;
    const st = stats(p), dir = m.dir < 0 ? -1 : 1, t = now();
    // Arcane Charge: a Mage damage spell spends every stored charge (the client predicted the same count)
    const charges = spendsArcane(m.skill) ? arcaneOf(p) : 0;
    if (spendsArcane(m.skill)) p.arcane = null;
    const mult = (sk.mult?.(rank) ?? 1) * capOf(st) * arcaneMult(c.skills, charges);
    const phys = st.atk * mult, magic = (sk.stat === 'best' ? Math.max(st.atk, st.magic) : st.magic) * mult * (sk.fire ? st.fire : 1) * (sk.holy ? st.heal : 1);
    const out = { t: 'skill', id, skill: m.skill, dir, x: s.x, y: s.y, hits: [] };
    if (charges) out.arcane = charges;
    // S5.2: what kind of hit it is, for a boss's barrier, armour and weak point (the client works out the same: src/rpg.js cast)
    const kinds = hitKinds(sk, rank, st, charges, c.skills);
    const hit = (o) => (out.hits = applyHits(id, p, m.hits, { dir, el: sk.el ?? null, ...kinds, ...o }));
    if (sk.kind === 'strike') hit({ range: SLAP_REACH + st.reach + sk.reach, cap: phys, knock: 320 });
    else if (sk.kind === 'cleave') hit({ max: sk.targets, range: SLAP_REACH + st.reach + sk.reach, cap: phys, knock: 260 });
    else if (sk.kind === 'spin') hit({ max: 20, range: sk.radius, cap: phys, knock: 260 });
    else if (sk.kind === 'storm') hit({ max: 20 * sk.hits, range: sk.radius, cap: phys, knock: 60 });
    else if (sk.kind === 'bolt' || sk.kind === 'fireball' || sk.kind === 'chain' || sk.kind === 'meteor') {
      const range = sk.kind === 'chain' ? sk.range + sk.jump * sk.targets : sk.range + (sk.radius ?? 0);
      hit({ max: sk.kind === 'bolt' ? 1 : sk.kind === 'chain' ? sk.targets : sk.kind === 'fireball' ? 8 : 20, range, cap: magic, knock: 120, slow: sk.slow ?? 0 });
      out.tx = Number(m.tx) || s.x + dir * sk.range;
      out.ty = Number(m.ty) || s.y - 22;
      if (Array.isArray(m.points)) out.points = m.points.slice(0, 6).map((q) => [Number(q[0]) || 0, Number(q[1]) || 0]);
    } else if (sk.kind === 'shot' || sk.kind === 'pierce' || sk.kind === 'rain') {
      // the Archer's (S4): arrows on ATK; Barbed Arrows slows, Snipe / Heartseeker allow FAR_BONUS
      const cap = phys * barbCap(p) * (sk.far ? 1 + FAR_BONUS : 1), slow = Math.max(sk.slow ?? 0, barbSlow(p));
      if (sk.kind === 'shot') hit({ max: sk.arrows, range: sk.range, cap, knock: sk.far ? 260 : 120, slow });
      else if (sk.kind === 'pierce') hit({ max: sk.targets, range: sk.range, cap, knock: 160, slow });
      else hit({ max: 20 * sk.hits, range: sk.range + sk.radius, cap, knock: 40, slow });
      out.tx = Number(m.tx) || s.x + dir * sk.range;
      out.ty = Number(m.ty) || s.y - 22;
    } else if (sk.kind === 'mark') {
      // Hunter's Mark: the mob the client aimed at, if it's in range; one mark per Archer at a time
      const mob = mobs.find((q) => q.id === m.mob && !q.dead && q.room === s.room);
      if (mob && Math.abs(mob.x - s.x) <= sk.range + MOBS[mob.kind].w / 2 + SLACK) {
        for (const q of mobs) if (q.mark?.by === id) q.mark = null;
        mob.mark = { until: t + sk.dur * 1000, boost: sk.boost(rank), by: id };
        out.mark = [mob.id, sk.boost(rank), sk.dur];
      }
    } else if (sk.kind === 'nova') hit({ max: 20, range: sk.radius, cap: magic, knock: 100, slow: sk.slow });
    else if (sk.kind === 'starfall') hit({ max: 30, range: sk.radius, cap: magic, knock: 80 });
    else if (sk.kind === 'heal' || sk.kind === 'miracle') {
      out.heals = [];
      const amt = healOf(m.skill, rank, st);
      for (const [qid, q] of sk.self ? [[id, p]] : near(p, sk.radius)) out.heals.push([qid, healFrom(id, p, qid, q, amt, false)]);
      if (sk.kind === 'miracle') out.revived = down.map(([qid, q]) => revive(qid, q, 1));
    } else if (sk.kind === 'revive') {
      out.revived = down.map(([qid, q]) => revive(qid, q, sk.share(rank)));
    } else if (sk.kind === 'cleanse') {
      const [qid, q] = cleansed;
      uncurse(qid, q);
      out.targets = [qid];
      out.heals = [[qid, healFrom(id, p, qid, q, healOf(m.skill, rank, st), false)]];
    } else if (sk.kind === 'mend' || sk.kind === 'barrier') {
      out.dur = sk.dur;
      out.targets = [];
      const amt = healOf(m.skill, rank, st);
      for (const [qid, q] of near(p, sk.radius)) {
        if (sk.kind === 'mend') q.mend = { until: t + sk.dur * 1000, amt, by: id, next: t + 1000 };
        else q.barrier = { until: t + sk.dur * 1000, left: amt };
        out.targets.push(qid);
        if (q !== p) sendMe(q);
      }
    } else if (sk.kind === 'summon') {
      const su = summons.add(id, p, m.skill, rank);
      out.sid = su.id;
      out.sx = Math.round(su.x);
      out.sy = Math.round(su.y);
    } else if (sk.kind === 'buff') {
      p.berserkUntil = t + sk.dur * 1000;
      out.dur = sk.dur;
    } else if (sk.kind === 'bubble') {
      p.bubbleUntil = t + sk.dur * 1000;
      out.dur = sk.dur;
    } else if (sk.kind === 'shield') {
      c.shield = !c.shield; // a toggle, saved with the character
      out.on = c.shield ? 1 : 0;
    } else if (sk.kind === 'rally' || sk.kind === 'aegis') {
      const dur = durOf(m.skill, rank);
      out.dur = dur;
      out.targets = [];
      for (const [qid, q] of near(p, sk.radius)) {
        if (sk.kind === 'rally') {
          q.rallyUntil = t + dur * 1000;
          q.rallyBoost = sk.boost(rank);
        } else q.aegisUntil = t + dur * 1000;
        out.targets.push(qid);
        if (q !== p) sendMe(q);
      }
      if (sk.kind === 'rally') out.taunt = taunt(id, p, sk.radius) || undefined; // (S5: Rally taunts too)
    } else if (sk.kind === 'gods') {
      p.godsUntil = t + sk.dur * 1000; // HP capped at 1 (statsFor), healed to full when it ends (tick)
      c.hp = Math.min(c.hp, 1);
      out.dur = sk.dur;
    } else if (sk.kind === 'zone') {
      zones.push({ room: s.room, x: s.x, r: sk.radius, until: t + sk.dur * 1000, cut: sk.cut(rank) });
      out.dur = sk.dur;
    }
    toRoom(s.room)(out);
    thirst(id, p, out.hits);
    if (sk.smite && out.hits.length) healFrom(id, p, id, p, out.hits.reduce((n, h) => n + h[1], 0) * sk.smite(rank) * st.heal); // Smite
    sendMe(p);
  }
  // knocked-out slimes within r of p (Revive, Miracle): [[id, q]]
  const downNear = (p, r) => inRoom(p.state.room).filter(([, q]) => q !== p && q.faintUntil > now() && Math.hypot(q.state.x - p.state.x, q.state.y - p.state.y) <= r + 40);
  // get a knocked-out slime back up where it fell, with share of its max HP (it never woke up: no EXP lost)
  function revive(qid, q, share) {
    q.faintUntil = 0;
    q.faintBy = null;
    q.rpg.hp = Math.max(1, Math.round(stats(q).maxHp * share));
    q.hurtAt = now(); // (a moment's invulnerability, as after any hit)
    sendMe(q);
    return qid;
  }

  // ——— ouch: the client says something hit it (run in input order; see index.js) ———
  // m: {mob, kind: 'touch' | 'charge' | 'slam' | 'rain' | 'ult', mx}  (mx: the mob's x as the client saw it, for knockback)
  const OUCH = {
    touch: [1, 380], charge: [1.2, 380], slam: [1.3, 420], rain: [1.1, 200], ult: [1, 420],
    // the newer mobs' and bosses' attacks (src/rpg.js decides the hits)
    shot: [1.1, 240], burn: [0.6, 150], geyser: [1.3, 380], sweep: [1.3, 380], beam: [1.4, 300], zap: [1.2, 260],
    bomb: [1.5, 420], slash: [1.3, 380], pulse: [1.2, 360],
  };
  function ouch(id, p, m) {
    const mob = mobs.find((q) => q.id === m.mob && !q.dead && q.room === p.state.room);
    const [mult, knock] = OUCH[m.kind] ?? [];
    if (!mob || !mult || p.faintUntil) return;
    const ult = m.kind === 'ult';
    if (!ult && now() - p.hurtAt < HURT_INVULN_MS - 250) return; // (an ultimate ignores the invulnerability)
    if (m.kind === 'touch' && Math.abs(mob.x - p.state.x) > MOBS[mob.kind].w / 2 + SLACK) return;
    if ((m.kind === 'touch' || m.kind === 'charge') && (mob.frozenUntil > now() || mob.snareUntil > now()) && !MOBS[mob.kind].boss && !MOBS[mob.kind].field) return; // frozen solid or netted: harmless
    if (m.kind !== 'touch' && m.kind !== 'charge' && !MOBS[mob.kind].boss && !MOBS[mob.kind].ai) return;
    if (ult && now() > mob.ultLiveUntil) return; // no ultimate going off right now
    const mx = Number.isFinite(m.mx) && Math.abs(m.mx - mob.x) < DEN_W ? m.mx : mob.x;
    const focused = !ult && mob.focus?.p === p && mob.focus.until > now(); // (S5: the boss's focus hits harder)
    hurt(id, p, MOBS[mob.kind].atk * mult * (focused ? FOCUS_ATK : 1), mx, undefined, knock, ult, mob);
  }

  // ——— mobs and bosses, every tick ———
  function stepMob(m, here, dt) {
    const k = MOBS[m.kind], sp = m.sp, t = now();
    const big = k.boss || k.field, frozen = m.frozenUntil > t, netted = m.snareUntil > t;
    if ((frozen || netted) && !big) {
      // frozen solid (the Mage's combos) or caught in a net (the Archer's Net Trap): no thinking, no walking,
      // no attacks; only gravity
      m.vx = 0;
      if (!k.fly && (m.vy !== 0 || m.y < sp.y)) {
        m.vy += GRAVITY * dt;
        m.y = Math.min(sp.y, m.y + m.vy * dt);
        if (m.y >= sp.y) m.vy = 0;
      }
      return;
    }
    const slow = frozen ? FROZEN_BOSS_SLOW : netted ? NET_BOSS_SLOW : m.slowUntil > t || m.chillUntil > t ? (k.boss ? 0.6 : 0.4) : 1;
    if (big && (k.party || m.partyOn)) partyTick(m, k, here, t); // (S5: may point m.target at its focus)
    // S5.2's stagger: one that waited for the boss's move to finish starts now; meanwhile it stands dazed
    if (m.staggerQueued && (k.boss ? m.phase === 'walk' : !m.aiPhase)) stagger(m);
    const staggered = big && m.staggerUntil > t;
    if (m.target && (t > m.targetUntil || !m.target.joined || m.target.state.room !== m.room || m.target.faintUntil)) m.target = null;
    if (!m.target && (k.aggro || m.minion)) {
      let best = null, bestD = k.boss ? Infinity : 230;
      for (const [, q] of here) {
        const d = Math.abs(q.state.x - m.x);
        if (!q.faintUntil && d < bestD && (k.boss || Math.abs(q.state.y - m.y) < 70)) [best, bestD] = [q, d];
      }
      if (best) {
        m.target = best;
        m.targetUntil = t + 6000;
      }
    }
    let want = 0;
    for (let i = m.later.length - 1; i >= 0; i--) if (t >= m.later[i][0]) m.later.splice(i, 1)[0][1](); // timed follow-ups
    const ai = !k.boss && k.ai && !staggered ? mobAi(m, k, here, dt, t) : null;
    if (staggered && !k.boss) want = 0;
    else if (k.boss) want = bossBrain(m, k, here, dt, t) * slow;
    else if (ai !== null) want = ai * slow;
    else if (m.target) {
      const dx = m.target.state.x - m.x;
      want = Math.abs(dx) > 8 ? Math.sign(dx) * k.speed * 1.6 * slow : 0;
    } else {
      m.wander -= dt;
      if (m.wander <= 0) {
        m.walk = Math.random() < 0.35 ? 0 : Math.random() < 0.5 ? -1 : 1;
        m.wander = rand(1, 3);
      }
      want = m.walk * k.speed * slow;
    }
    const lunging = (k.boss && (m.act === 'charge' || m.act === 'leap') && m.phase === 'act') || m.aiPhase === 'lunge';
    if (!lunging) m.vx += (want - m.vx) * Math.min(1, dt * 6);
    if (Math.abs(m.vx) > 5 && !(k.boss && m.phase === 'warn')) m.dir = Math.sign(m.vx);
    if (k.hops && m.vy === 0 && m.y === sp.y && Math.abs(want) > 1 && Math.random() < 0.03) m.vy = -330;
    m.x += m.vx * dt;
    if (m.x < sp.x0 || m.x > sp.x1) {
      m.x = Math.min(sp.x1, Math.max(sp.x0, m.x));
      m.walk = -m.walk;
      if (k.boss && m.act === 'charge') m.timer = 0; // hit the wall: charge over
    }
    if (k.fly) {
      // fliers hover (bob a little); a dive moves them straight to its target and back up
      if (m.dive) {
        const d = m.dive, f = Math.min(1, (t - d.at) / d.ms);
        m.x = d.x0 + (d.x1 - d.x0) * f;
        m.y = d.y0 + (d.y1 - d.y0) * f;
        m.vx = 0;
        if (f >= 1) m.dive = d.next ? { ...d.next, at: t } : null;
      } else {
        m.hoverCur += (m.hover - m.hoverCur) * Math.min(1, dt * 3);
        m.y = sp.y - m.hoverCur + Math.sin(t / 400 + m.id) * 4;
      }
      m.vy = 0;
    } else if (m.vy !== 0 || m.y < sp.y) {
      m.vy += GRAVITY * dt * (k.boss ? 1.3 : 1);
      m.y += m.vy * dt;
      if (m.y >= sp.y) {
        m.y = sp.y;
        m.vy = 0;
        if (k.boss && (m.act === 'slam' || m.act === 'leap') && m.phase === 'act') slamLands(m);
        if (m.aiPhase === 'air') stompLands(m, k);
      }
    }
    // (touching a slime hurts it: the client reports that itself, see ouch())
  }

  // ——— the newer mobs' tricks (MOBS[kind].ai, see src/shared/rpg.js) ———
  // Returns how fast the mob wants to walk, or null for the ordinary walk/chase. Attacks are events the
  // clients turn into hazards and judge themselves (src/rpg.js), like boss attacks.
  const later = (m, ms, fn) => m.later.push([now() + ms, fn]);
  function mobAi(m, k, here, dt, t) {
    const ai = k.ai, tg = m.target?.state;
    if (ai.kind === 'split') return null;
    m.aiCd -= dt;
    const dx = tg ? tg.x - m.x : 0, adx = Math.abs(dx), face = () => (m.dir = Math.sign(dx) || m.dir);
    const ready = tg && m.aiCd <= 0 && !m.aiPhase;
    const again = () => {
      m.aiPhase = null;
      m.aiCd = ai.every * rand(0.8, 1.25);
    };
    if (m.aiPhase) {
      m.aiTimer -= dt;
      if (m.aiTimer > 0) return m.aiPhase === 'lunge' ? m.vx : 0;
    }
    if (ai.kind === 'lob') {
      if (m.aiPhase === 'warn') {
        // a lobbed fireball that lands where the target is now
        if (tg) {
          face();
          const x0 = m.x + m.dir * 8, y0 = m.y - k.h - 6, tx = tg.x + rand(-20, 20), ty = tg.y - 18;
          const T = Math.max(0.6, Math.min(1.3, Math.abs(tx - x0) / 380)), g = 900;
          bossEvent(m, 'shots', { style: ai.style ?? 'ember', shots: [[Math.round(x0), Math.round(y0), Math.round((tx - x0) / T), Math.round((ty - y0 - 0.5 * g * T * T) / T), g, 14, 0]] });
        }
        again();
        return 0;
      }
      if (ready && adx < ai.range && Math.abs(tg.y - m.y) < 220) {
        face();
        m.aiPhase = 'warn';
        m.aiTimer = ai.warn;
        return 0;
      }
      if (!tg) return null;
      return adx < ai.keep ? -Math.sign(dx) * k.speed * 1.2 : adx > ai.range * 0.75 ? Math.sign(dx) * k.speed * 1.3 : 0; // keeps its distance
    }
    if (ai.kind === 'stomp') {
      // crouch (the shockwave's reach is marked), leap, and land with a shockwave: stompLands
      if (m.aiPhase === 'warn') {
        m.aiPhase = 'air';
        m.aiTimer = 3; // (landing ends it: stompLands)
        m.vy = -ai.jump;
        return 0;
      }
      if (m.aiPhase === 'air') {
        again();
        return 0;
      }
      if (ready && adx < ai.range && Math.abs(tg.y - m.y) < 140) {
        face();
        m.aiPhase = 'warn';
        m.aiTimer = ai.warn;
        bossEvent(m, 'warn', { act: 'slam', dur: ai.warn, r: ai.r });
        return 0;
      }
      return null;
    }
    if (ai.kind === 'trail') {
      if (m.aiCd <= 0 && Math.abs(m.vx) > 8) {
        m.aiCd = ai.every;
        bossEvent(m, 'puddle', { w: ai.w, life: ai.life, style: ai.style });
      }
      return null;
    }
    if (ai.kind === 'shell') {
      if (m.aiPhase === 'warn') {
        m.aiPhase = 'lunge'; // snap forward
        m.aiTimer = ai.time;
        m.vx = m.dir * ai.lunge;
        return m.vx;
      }
      if (m.aiPhase === 'lunge') {
        again();
        return 0;
      }
      if (ready && adx < 220 && Math.abs(tg.y - m.y) < 60) {
        face();
        m.aiPhase = 'warn';
        m.aiTimer = ai.warn;
        return 0;
      }
      return null;
    }
    if (ai.kind === 'dive') {
      if (m.aiPhase === 'warn') {
        // swoop down to where the target was and back up
        const y1 = m.sp.y - 6, x1 = Math.max(m.sp.x0 - 120, Math.min(m.sp.x1 + 120, m.diveX));
        m.dive = { x0: m.x, y0: m.y, x1, y1, ms: ai.time * 1000, at: t, next: { x0: x1, y0: y1, x1: x1 + m.dir * 90, y1: m.sp.y - m.hover, ms: 600 } };
        m.aiPhase = 'diving';
        m.aiTimer = ai.time + 0.6;
        return 0;
      }
      if (m.aiPhase === 'diving') {
        again();
        return 0;
      }
      if (ready && adx < 360) {
        face();
        m.diveX = tg.x;
        m.aiPhase = 'warn';
        m.aiTimer = ai.warn;
        bossEvent(m, 'diveWarn', { tx: Math.round(tg.x), ty: m.sp.y, dur: ai.warn });
        return 0;
      }
      return null;
    }
    if (ai.kind === 'beam') {
      if (m.aiPhase === 'warn') {
        m.aiPhase = 'firing';
        m.aiTimer = ai.dur + 0.3;
        return 0;
      }
      if (m.aiPhase === 'firing') {
        again();
        return 0;
      }
      if (ready && adx < ai.range && Math.abs(tg.y - m.sp.y) < 40) {
        face();
        m.aiPhase = 'warn';
        m.aiTimer = ai.warn;
        bossEvent(m, 'beam', { style: ai.style ?? 'sentry', bx: Math.round(m.x + m.dir * 20), y0: ai.y0, y1: ai.y1, len: ai.range, warn: ai.warn, dur: ai.dur });
        return 0;
      }
      return null;
    }
    if (ai.kind === 'blink') {
      if (m.aiPhase === 'out') {
        // reappear behind the target, then slash all around
        const x0 = m.x;
        m.x = tg ? Math.max(m.sp.x0, Math.min(m.sp.x1, tg.x - (m.target.state.facing || 1) * 70)) : m.x;
        m.dir = tg ? Math.sign(tg.x - m.x) || 1 : m.dir;
        m.special = false;
        bossEvent(m, 'mobBlink', { x0: Math.round(x0) });
        bossEvent(m, 'slash', { r: ai.r, warn: ai.slashWarn });
        m.aiPhase = 'slash';
        m.aiTimer = ai.slashWarn + 0.2;
        return 0;
      }
      if (m.aiPhase === 'slash') {
        again();
        return 0;
      }
      if (ready && adx < 400 && Math.abs(tg.y - m.y) < 100) {
        m.aiPhase = 'out';
        m.aiTimer = ai.warn;
        m.special = true;
        return 0;
      }
      return null;
    }
    if (ai.kind === 'phase') {
      if (m.aiPhase === 'phased') {
        m.special = false; // back, with a pulse (bossEvent 'pulse' was sent when it phased out)
        again();
        return 0;
      }
      if (ready && adx < 300) {
        m.aiPhase = 'phased';
        m.aiTimer = ai.dur;
        m.special = true;
        bossEvent(m, 'pulse', { r: ai.r, warn: ai.dur });
        return 0;
      }
      return m.aiPhase ? 0 : null;
    }
    return null;
  }

  const bossEvent = (m, a, extra = {}) => toRoom(m.room)({ t: 'boss', a, id: m.id, x: Math.round(m.x), y: m.y, dir: m.dir, ...extra });
  // A big boss's lines (MOBS[kind].lines: on entering, at each new phase, when freed): a bubble over it and a
  // line in the chat, for the whole den (or just `p`, who walked in)
  const bossSays = (m, text, p) => text && (p ? (msg) => send(p.ws, msg) : toRoom(m.room))({ t: 'boss', a: 'say', id: m.id, kind: m.kind, text });
  const WARN = {
    slam: 0.9, charge: 0.75, rain: 0.4, summon: 0.6, leap: 0.8, barrage: 0.5,
    // the newer bosses (their attacks carry their own telegraphs, so the boss's own wind-up is short)
    fireballs: 0.6, geysers: 0.35, flamewall: 0.5, feathers: 0.5, spiral: 0.6, dive: 0.8, rings: 0.5,
    gears: 0.5, beam: 0.3, grid: 0.3, sweep: 0.3, bombs: 0.4, blink: 0.3, echo: 0.5,
  };
  const minionsIn = (room) => mobs.filter((q) => q.minion && !q.dead && q.room === room).length;
  // A boss's attack pattern; returns how fast it wants to walk.
  // Three stages (PHASE_AT): more moves and longer combos as its HP drops; below ULT_FIRST it starts
  // using its ultimate (a one-hit KO unless you stand somewhere safe), then every ULT_EVERY seconds.
  function bossBrain(m, k, here, dt, t) {
    // more slimes in the den: more HP (it never shrinks back mid-fight)
    if (here.length > m.fighters) {
      const max = Math.round(k.hp * TEST_BOSS_HP * (1 + BOSS_HP_PER_PLAYER * (here.length - 1)));
      m.hp += max - m.maxHp;
      m.maxHp = max;
      m.fighters = here.length;
    }
    const frac = m.hp / m.maxHp;
    const stage = frac > PHASE_AT[1] ? 0 : frac > PHASE_AT[2] ? 1 : 2;
    if (stage > m.stage) {
      m.stage = stage;
      bossEvent(m, 'phase', { n: stage + 1 });
      bossSays(m, k.lines?.phase?.[stage]);
      if (stage === 2) {
        m.enraged = true;
        bossEvent(m, 'rage');
      }
    }
    if (!m.ultArmed && frac < ULT_FIRST) {
      m.ultArmed = true;
      m.ultAt = t; // first one as soon as it's free
    }
    const pace = [1, 0.8, 0.6][stage];
    // pending thorn rains: the marked spots get hit now (each client checks itself: ouch)
    for (let i = m.rains.length - 1; i >= 0; i--) {
      if (t < m.rains[i].at) continue;
      bossEvent(m, 'rainHit', { marks: m.rains[i].marks });
      m.rains.splice(i, 1);
    }
    if (m.staggerUntil > t) return 0; // (S5.2: staggered, dazed: no moves)
    const start = (act, quick) => {
      m.act = m.last = act;
      m.phase = 'warn';
      if (act === 'ult') return startUlt(m, k, t);
      m.timer = WARN[act] * (m.enraged ? 0.8 : 1) * (quick ? 0.7 : 1);
      const extra = { act, dur: m.timer };
      if (act === 'charge') m.dir = Math.sign(m.target.state.x - m.x) || m.dir;
      if (act === 'leap') extra.tx = m.leapX = Math.round(Math.max(150, Math.min(DEN_W - 150, m.target.state.x)));
      if (act === 'dive') {
        extra.tx = m.leapX = Math.round(Math.max(150, Math.min(DEN_W - 150, m.target.state.x)));
        m.hover = 220; // rises up first
        bossEvent(m, 'diveWarn', { tx: m.leapX, ty: m.sp.y, dur: m.timer });
      }
      if (act === 'feathers' || act === 'spiral') m.hover = 170;
      bossEvent(m, 'warn', extra);
    };
    const choose = () => {
      const list = k.phases[stage].filter((a) => a !== m.last && !(a === 'summon' && minionsIn(m.room) >= 4));
      return pick(list.length ? list : k.phases[stage]);
    };
    if (m.phase === 'walk') {
      m.next -= dt;
      if (m.next <= 0 && m.target) {
        m.chain = 0;
        start(m.ultArmed && t >= m.ultAt ? 'ult' : choose());
        return 0;
      }
      if (!m.target) return 0;
      const dx = m.target.state.x - m.x;
      return Math.abs(dx) > k.w * 0.4 ? Math.sign(dx) * k.speed * [1, 1.15, 1.35][stage] : 0;
    }
    m.timer -= dt;
    if (m.phase === 'warn') {
      if (m.timer > 0) return 0;
      m.phase = 'act';
      if (m.act === 'ult') return ultGoesOff(m, k, t), 0;
      if (m.act === 'slam') {
        m.vy = -760;
        m.slamR = 300;
        m.timer = 3; // until it lands
      } else if (m.act === 'leap') {
        // jump so it lands on where the target stood when it warned
        const vy = 820, air = (2 * vy) / (GRAVITY * 1.3);
        m.vy = -vy;
        m.vx = (m.leapX - m.x) / air;
        m.slamR = 170;
        m.timer = 3;
        bossEvent(m, 'leap', { tx: m.leapX, dur: air });
      } else if (m.act === 'charge') {
        m.vx = m.dir * [600, 660, 740][stage];
        m.timer = 1.4;
        bossEvent(m, 'charge');
      } else if (m.act === 'rain' || m.act === 'barrage') {
        const waves = m.act === 'barrage' ? 3 : 1;
        for (let w = 0; w < waves; w++) {
          const marks = [];
          for (const [, q] of here) marks.push(q.state.x + rand(-50, 50) + (w ? rand(-60, 60) : 0));
          while (marks.length < (m.act === 'barrage' ? 3 + stage : [6, 7, 9][stage])) marks.push(rand(140, DEN_W - 140));
          const at = t + 1100 + w * 650;
          m.rains.push({ at, marks: marks.map(Math.round) });
          setTimeout(() => !m.dead && bossEvent(m, 'rain', { marks: marks.map(Math.round), dur: (at - now()) / 1000 }), w * 650);
        }
        m.timer = 0.3 * waves;
      } else if (newMove(m, k, here, stage, t)) {
        // (the newer bosses' moves: newMove sets m.timer)
      } else if (m.act === 'summon') {
        const n = Math.min([2, 2, 3][stage], 5 - minionsIn(m.room));
        for (let i = 0; i < n; i++) {
          const x = Math.max(120, Math.min(DEN_W - 120, m.x + rand(-160, 160)));
          const minion = spawn({ id: nextMob++, sp: { kind: k.minion, x0: 60, x1: DEN_W - 60, y: m.sp.y, room: m.room }, minion: true });
          minion.x = x;
          mobs.push(minion);
        }
        bossEvent(m, 'summon');
        m.timer = 0;
      }
      return 0;
    }
    // acting
    if (m.act === 'charge') {
      if (m.timer > 0) return m.vx;
      m.vx = 0;
    } else if ((m.act === 'slam' || m.act === 'leap' || m.act === 'ult') && m.timer > 0) return 0;
    else if (m.timer > 0) return 0;
    // done: chain into another attack (a combo), or walk a bit
    if (m.act !== 'ult' && m.target && !m.staggerQueued && ++m.chain < COMBO_MAX[stage] && Math.random() < COMBO_CHANCE[stage]) {
      start(choose(), true);
      return 0;
    }
    m.phase = 'walk';
    m.act = null;
    m.next = rand(2.2, 3.6) * pace;
    if (k.fly) m.hover = k.fly;
    return 0;
  }

  // ——— the newer bosses' moves (Ignis, Pyra, the Colossus, Chronos) → true if m.act was one of them ———
  // Each sends one event the clients turn into hazards (src/rpg.js) and judge themselves.
  const tiles = (pick) => Array.from({ length: 10 }, (_, i) => i).filter(pick);
  function newMove(m, k, here, stage, t) {
    const a = m.act;
    const targets = here.filter(([, q]) => !q.faintUntil).map(([, q]) => q.state);
    const tq = m.target?.state ?? targets[0] ?? { x: m.x + m.dir * 200, y: m.sp.y, facing: 1 }; // (the target may have just left)
    const head = { x: m.x + m.dir * k.w * 0.25, y: m.y - k.h * 0.6 };
    const aim = (q) => Math.atan2(q.y - 20 - head.y, q.x - head.x);
    if (a === 'fireballs') {
      // lobbed fireballs at everyone (more as it weakens), landing where they stand now
      const shots = [];
      for (const q of targets) for (let i = 0; i < 1 + stage; i++) {
        const tx = q.x + rand(-60, 60) * i, ty = q.y - 18, T = rand(0.8, 1.15), g = 900;
        shots.push([Math.round(head.x), Math.round(head.y), Math.round((tx - head.x) / T), Math.round((ty - head.y - 0.5 * g * T * T) / T), g, 18, Math.round(i * 25) / 100]);
      }
      bossEvent(m, 'shots', { style: 'ember', shots });
      m.timer = 0.6;
    } else if (a === 'geysers') {
      // lava columns erupting across the den one after another: stand in the gaps between them
      const dir = Math.random() < 0.5 ? 1 : -1, list = [];
      for (let i = 0; i < 10; i++) list.push([75 + 150 * (dir > 0 ? i : 9 - i), Math.round(i * 16) / 100]);
      if (stage >= 1) for (let i = 0; i < 9; i++) list.push([150 + 150 * (dir > 0 ? 8 - i : i), 1.7 + Math.round(i * 16) / 100]); // then the gaps
      bossEvent(m, 'geysers', { list, warn: 0.8, r: 42, top: 160, dur: 0.35 });
      m.timer = stage >= 1 ? 2.2 : 1;
    } else if (a === 'flamewall') {
      const fronts = [{ x0: Math.round(m.x), dir: m.dir, speed: 520, h: 54, tall: false, style: 'flame', delay: 0.4 }];
      if (stage >= 2) fronts.push({ ...fronts[0], dir: -m.dir });
      bossEvent(m, 'sweep', { fronts });
      m.timer = 0.6;
    } else if (a === 'feathers') {
      // fans of fiery feathers at her target
      const shots = [], n = 7 + 2 * stage, base = aim(tq);
      for (let w = 0; w < (stage >= 2 ? 2 : 1); w++)
        for (let i = 0; i < n; i++) {
          const ang = base + (i / (n - 1) - 0.5) * 1.2 + (w ? 0.09 : 0);
          shots.push([Math.round(head.x), Math.round(head.y), Math.round(Math.cos(ang) * 430), Math.round(Math.sin(ang) * 430), 0, 12, w * 0.45]);
        }
      bossEvent(m, 'shots', { style: 'feather', shots });
      m.timer = 0.9;
    } else if (a === 'spiral') {
      // a slow spiral of bullets in two (or three) arms
      const shots = [], arms = stage >= 2 ? 3 : 2, n = 26, a0 = rand(0, Math.PI * 2);
      for (let i = 0; i < n; i++)
        for (let j = 0; j < arms; j++) {
          const ang = a0 + i * 0.42 + (j * Math.PI * 2) / arms;
          shots.push([Math.round(m.x), Math.round(m.y - k.h * 0.55), Math.round(Math.cos(ang) * 250), Math.round(Math.sin(ang) * 250), 0, 12, Math.round(i * 7) / 100]);
        }
      bossEvent(m, 'shots', { style: m.kind === 'chronos' ? 'clock' : 'feather', shots });
      m.timer = 1.9;
    } else if (a === 'dive') {
      const y1 = m.sp.y - 4;
      m.dive = { x0: m.x, y0: m.y, x1: m.leapX, y1, ms: 450, at: t, next: { x0: m.leapX, y0: y1, x1: Math.max(150, Math.min(DEN_W - 150, m.leapX + m.dir * 160)), y1, ms: 350, next: null } };
      m.hover = k.fly;
      m.hoverCur = 0;
      bossEvent(m, 'charge');
      m.timer = 0.9;
    } else if (a === 'rings') {
      const fronts = [];
      for (let i = 0; i < 2 + stage; i++) for (const dir of [-1, 1]) fronts.push({ x0: Math.round(m.x), dir, speed: 430, h: 40, tall: false, style: 'ring', delay: 0.3 + i * 0.75 });
      bossEvent(m, 'sweep', { fronts });
      m.timer = 0.6 + 0.75 * (1 + stage);
    } else if (a === 'gears') {
      const fronts = [];
      for (let i = 0; i < 2 + stage; i++) fronts.push({ x0: Math.round(m.x), dir: i % 2 ? -1 : 1, speed: 380 + 40 * stage, h: 52, tall: false, style: 'gear', delay: 0.4 + i * 0.45 });
      bossEvent(m, 'sweep', { fronts });
      m.timer = 0.8;
    } else if (a === 'beam') {
      // its eye laser across the den: low (jump it) or high (stay on the floor), then the other one
      const dir = Math.sign(tq.x - m.x) || m.dir, low = Math.random() < 0.5;
      const band = (lo) => (lo ? [410, 450] : [290, 398]);
      const beams = [{ y: band(low), delay: 0 }];
      if (stage >= 1) beams.push({ y: band(!low), delay: 1.4 });
      for (const b of beams) bossEvent(m, 'beam', { style: k.looks?.beam ?? 'colossus', bx: Math.round(m.x), dir, y0: b.y[0], y1: b.y[1], len: DEN_W, warn: 1 + b.delay, dur: 0.5 });
      m.timer = 1.6 + (stage >= 1 ? 1.4 : 0);
    } else if (a === 'grid') {
      // electrified floor tiles: one checkerboard, then the other (jump, or stand on a ledge)
      const odd = Math.random() < 0.5;
      const style = k.looks?.grid ?? (m.kind === 'chronos' ? 'chrono' : 'volt');
      bossEvent(m, 'grid', { style, tiles: tiles((i) => i % 2 === (odd ? 1 : 0)), warn: 1.1, dur: 0.45, tall: false });
      bossEvent(m, 'grid', { style, tiles: tiles((i) => i % 2 === (odd ? 0 : 1)), warn: 2.1, dur: 0.45, tall: false });
      m.timer = 2.4;
    } else if (a === 'sweep') {
      // a TALL beam / void wall across the whole den: too tall to jump. Dash through it (i-frames) or Blink past.
      const dir = Math.random() < 0.5 ? 1 : -1;
      const fronts = [{ x0: dir > 0 ? 0 : DEN_W, dir, speed: 700, h: 450, tall: true, style: m.kind === 'chronos' ? 'void' : 'laser', delay: 1.3 }];
      bossEvent(m, 'sweep', { fronts, hint: 'Dash or Blink through it!' });
      m.timer = 1.6;
    } else if (a === 'bombs') {
      // clock bombs on slimes: they go off around whoever carries them. Spread out, and Dash at the last moment
      const ids = here.filter(([, q]) => !q.faintUntil).map(([qid]) => qid);
      const pickN = stage === 0 ? Math.min(2, ids.length) : ids.length;
      const marked = ids.sort(() => Math.random() - 0.5).slice(0, pickN);
      bossEvent(m, 'bombs', { ids: marked, warn: 3, r: 140, hint: 'Spread out! Dash just as it goes off!' });
      m.timer = 0.8;
    } else if (a === 'blink') {
      // teleports next to its target and slams the floor around itself
      const x0 = m.x;
      m.x = Math.max(150, Math.min(DEN_W - 150, tq.x + (Math.random() < 0.5 ? -1 : 1) * rand(60, 120)));
      m.dir = Math.sign(tq.x - m.x) || m.dir;
      bossEvent(m, 'bossBlink', { x0: Math.round(x0) });
      bossEvent(m, 'warn', { act: 'slam', dur: 0.6, r: 220 });
      later(m, 650, () => !m.dead && bossEvent(m, 'slam', { r: 220 }));
      m.timer = 1;
    } else if (a === 'echo') {
      // after-images slam the floor one after another all over the den
      const list = [];
      for (let i = 0; i < 3 + stage; i++) list.push([Math.round(rand(150, DEN_W - 150)), Math.round(i * 45) / 100]);
      list[0][0] = Math.round(tq.x);
      bossEvent(m, 'echo', { list, r: 170, warn: 0.9 });
      m.timer = 1 + 0.45 * list.length;
    } else return false;
    return true;
  }

  // Pyra's egg broke in time: no explosion, and she's stunned for a moment
  function eggBreaks(m) {
    m.egg = null;
    m.special = false;
    m.ult = null;
    m.ultLiveUntil = 0;
    m.phase = 'walk';
    m.act = null;
    m.next = 3.5;
    m.hover = MOBS[m.kind].fly ?? 0;
    m.ultAt = now() + ULT_EVERY[Math.max(1, m.stage)] * 1000;
    bossEvent(m, 'eggBreak');
  }
  // The ultimate: ULT_WARN seconds of warning (with where's safe), then it goes off
  function startUlt(m, k, t) {
    const which = k.ults ? k.ults[m.ultN++ % k.ults.length] : k.ult; // Chronos alternates
    const u = { kind: which.kind, name: which.name, dur: ULT_WARN };
    if (u.kind === 'spores') {
      const a = rand(180, DEN_W / 2 - 150);
      u.safe = [Math.round(a), Math.round(Math.min(DEN_W - 180, a + rand(450, 750)))];
    } else if (u.kind === 'wave') {
      u.dir = Math.random() < 0.5 ? 1 : -1;
      u.x0 = u.dir > 0 ? 0 : DEN_W;
      u.speed = WAVE_SPEED;
    } else if (u.kind === 'lanes') {
      const w = DEN_W / 5;
      u.lanes = Array.from({ length: 5 }, (_, i) => [Math.round(i * w), Math.round((i + 1) * w)]);
      u.safe = randInt(0, 4);
    } else if (u.kind === 'nova') u.r = NOVA_SAFE;
    else if (u.kind === 'magma') u.safe = randInt(0, 2); // the one ledge that holds (DEN_PLATFORMS index)
    else if (u.kind === 'rebirth') {
      // an egg: break it within the time or it bursts, knocking everyone out, and she heals
      u.dur = 10;
      const max = Math.round(m.maxHp * 0.025);
      m.egg = { hp: max, max };
      m.special = true;
      m.hover = 0;
    } else if (u.kind === 'overclock') {
      // three lethal zaps of every floor column but one; each safe column is 4 apart, 1.3 s after the last:
      // too far to walk in time, so it takes a Dash and a Blink
      const s1 = randInt(0, 9), s2 = s1 < 5 ? s1 + 4 : s1 - 4;
      const s3 = s2 <= 3 ? s2 + 4 : s2 >= 6 ? s2 - 4 : Math.random() < 0.5 ? s2 + 4 : s2 - 4;
      u.safe = [s1, s2, s3];
      u.gap = 1.3;
    } else if (u.kind === 'timestop') u.still = 2; // don't move at all for this long once it hits
    else if (u.kind === 'collapse') u.speed = 650; // void walls from both ends: Dash / Blink through one
    m.ult = u;
    m.timer = u.dur;
    m.vx = 0;
    bossEvent(m, 'ultWarn', u);
  }
  function ultGoesOff(m, k, t) {
    const u = m.ult;
    const lasts = u.kind === 'wave' ? (DEN_W / WAVE_SPEED) * 1000 + 600 : u.kind === 'overclock' ? u.gap * 2000 + 900 : u.kind === 'timestop' ? u.still * 1000 + 700
      : u.kind === 'collapse' ? (DEN_W / u.speed) * 1000 + 700 : 1500;
    if (u.kind === 'rebirth') {
      m.egg = null;
      m.special = false;
      m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.15);
    }
    m.ultLiveUntil = t + lasts; // clients report their 'ult' ouches within this window
    summons.ult(m.room); // (spirits and totems take a big share of it)
    m.timer = lasts / 1000;
    m.ultAt = t + ULT_EVERY[Math.max(1, m.stage)] * 1000;
    bossEvent(m, 'ultHit', { ...u, x: Math.round(m.x) });
  }
  // On the floor within slamR when it lands: hit (each client checks itself: ouch). In the air or on a ledge: safe.
  function stompLands(m, k) {
    bossEvent(m, 'slam', { r: k.ai.r });
    m.aiPhase = null;
    m.aiCd = k.ai.every * rand(0.8, 1.25);
  }
  function slamLands(m) {
    bossEvent(m, 'slam', { r: m.slamR });
    m.timer = 0;
  }
  function resetBoss(m) {
    for (const q of mobs) if (q.minion && q.room === m.room) q.dead = q.gone = true;
    if (m.partyOn) toRoom(m.room)({ t: 'party', id: m.id, on: 0 });
    spawn(m);
  }

  // ——— S5: bosses that need a party (PARTY in src/shared/rpg.js, story/s5-plan.md) ———
  // partyOn(m, mech): is that mechanic switched on for this fight (the boss lists it, has partyLive, and enough
  // slimes are fighting it)? S5.2's curse, barrier, armour, weak point and interrupt read the same gate.
  const partyOn = (m, mech) => partyActive(MOBS[m.kind], m.fighters, mech);
  const partyBits = (m) => PARTY_MECHS.reduce((b, mech) => (partyOn(m, mech) ? b | partyBit(mech) : b), 0);
  // who's in the fight: everyone in a den; round a field boss, the slimes near it or who hit it lately
  const inFight = (m, here) => (m.den ? here : here.filter(([qid, q]) => Math.abs(q.state.x - m.x) < 900 || now() - (m.hitters.get(qid) ?? 0) < FIELD_BOSS_FIGHT_MS))
    .filter(([, q]) => !q.faintUntil);
  // → the room: {t:'party', id, on: bits (PARTY_MECHS order), f: the focused slime's id, fl: ms of it left, and S5.2's:
  // st: ms of the stagger left (or -1: one waiting for its move to end) · sh: [kind 'b' | 'a', ms until it's up, ms
  // left, barrier HP left (0–1) or armour cracks] · wk: [ms left open, filled (0–1)] · cu: [[slime id, curse stacks]]}
  function sendParty(m) {
    const t = now(), f = m.focus, sh = m.shield, w = m.weak, ms = (x) => Math.max(0, Math.round(x - t));
    m.partySentAt = t;
    m.partyDirty = false;
    const cu = inRoom(m.room).filter(([, q]) => q.curse?.n > 0).map(([qid, q]) => [qid, q.curse.n]);
    toRoom(m.room)({
      t: 'party', id: m.id, on: m.partyOn, f: f ? f.id : undefined, fl: f ? ms(f.until) : undefined,
      st: m.staggerUntil > t ? ms(m.staggerUntil) : m.staggerQueued ? -1 : undefined,
      sh: sh ? [sh.kind === 'barrier' ? 'b' : 'a', ms(sh.from), ms(sh.until), sh.kind === 'barrier' ? Math.round((Math.max(0, sh.hp) / sh.max) * 100) / 100 : sh.cracks] : undefined,
      wk: w ? [ms(w.until), Math.round((w.fill / w.max) * 100) / 100] : undefined,
      cu: cu.length ? cu : undefined,
    });
  }
  function partyTick(m, k, here, t) {
    const bits = m.dead ? 0 : partyBits(m);
    let dirty = bits !== m.partyOn;
    m.partyOn = bits;
    // focus: one slime at a time, FOCUS_S each, FOCUS_GAP between (someone else next time if it can)
    if (bits & partyBit('focus')) {
      const f = m.focus;
      if (f && (t > f.until || !f.p.joined || f.p.state.room !== m.room || f.p.faintUntil)) {
        m.focus = null;
        m.focusLast = f.p;
        m.focusNext = t + FOCUS_GAP * 1000;
        dirty = true;
      }
      if (!m.focus && t >= m.focusNext && m.act !== 'ult' && !m.special && !(m.staggerUntil > t)) {
        const list = inFight(m, here), others = list.filter(([, q]) => q !== m.focusLast);
        const pickFrom = others.length ? others : list;
        if (pickFrom.length) {
          const [id, p] = pick(pickFrom);
          m.focus = { p, id, until: t + FOCUS_S * 1000 };
          dirty = true;
        }
      }
      if (m.focus) {
        m.target = m.focus.p;
        m.targetUntil = Math.max(m.targetUntil, t + 1000);
      }
    } else if (m.focus) {
      m.focus = null;
      dirty = true;
    }
    // pulse: a ring closing in for PULSE_WARN s ({t:'boss', a:'pulseWarn'}), then PULSE_HP of every fighter's max HP
    if (bits & partyBit('pulse')) {
      if (!m.pulseAt) m.pulseAt = t + PULSE_EVERY * 1000; // (the first a whole beat after it switches on)
      if (!m.pulseHit && t >= m.pulseAt && m.act !== 'ult' && !m.special && !(m.staggerUntil > t)) {
        m.pulseHit = t + PULSE_WARN * 1000;
        bossEvent(m, 'pulseWarn', { dur: PULSE_WARN });
      }
      if (m.pulseHit && t >= m.pulseHit) {
        m.pulseHit = 0;
        m.pulseAt = t + PULSE_EVERY * 1000;
        bossEvent(m, 'pulseHit');
        // (a Barrier Draught takes it in hurt(), on `flat`)
        for (const [qid, q] of inFight(m, here)) hurt(qid, q, stats(q).maxHp * PULSE_HP, m.x, undefined, 0, false, m, true);
      }
    } else m.pulseAt = m.pulseHit = 0;
    // S5.2: nothing new starts while the boss is busy (an ultimate, phased out, staggered)
    const busy = m.act === 'ult' || m.special || m.staggerUntil > t;
    if (m.staggerUntil && t >= m.staggerUntil) {
      m.staggerUntil = 0;
      dirty = true;
    }
    // curse: a sigil under the boss's target (or anyone fighting), CURSE_WARN s to step out, then a stack on everyone in it
    if (bits & partyBit('curse')) {
      if (!m.curseAt) m.curseAt = t + CURSE_EVERY * 600; // (the first a little sooner)
      if (!m.curseSigil && t >= m.curseAt && !busy) {
        const tg = m.target?.state ?? m.target ?? pick(inFight(m, here).map(([, q]) => q.state));
        if (tg && Number.isFinite(tg.x)) {
          const cx = Math.round(tg.x);
          m.curseSigil = { x: cx, at: t + CURSE_WARN * 1000 };
          bossEvent(m, 'curseWarn', { cx, r: CURSE_R, dur: CURSE_WARN });
        }
      }
      if (m.curseSigil && t >= m.curseSigil.at) {
        const cx = m.curseSigil.x;
        m.curseSigil = null;
        m.curseAt = t + CURSE_EVERY * 1000;
        bossEvent(m, 'curseHit', { cx, r: CURSE_R });
        for (const [qid, q] of inFight(m, here)) if (Math.abs(q.state.x - cx) < CURSE_R) curse(qid, q, m);
        dirty = true;
      }
    } else m.curseAt = 0, m.curseSigil = null;
    // barrier / armour: a shield phase now and then (both listed: they take turns)
    const canB = bits & partyBit('barrier'), canA = bits & partyBit('armour');
    if (canB || canA) {
      const sh = m.shield;
      if (sh && t >= sh.until) {
        m.shield = null;
        bossEvent(m, 'shieldDrop', { kind: sh.kind });
        dirty = true;
      }
      if (!m.shieldNext) m.shieldNext = t + (canB ? BARRIER_EVERY : ARMOUR_EVERY) * 500;
      if (!m.shield && t >= m.shieldNext && !busy) {
        const kind = canB && canA ? (m.shieldLast === 'barrier' ? 'armour' : 'barrier') : canB ? 'barrier' : 'armour';
        const b = kind === 'barrier', warn = b ? BARRIER_WARN : ARMOUR_WARN, max = Math.max(1, Math.round(k.hp * TEST_BOSS_HP * BARRIER_HP)); // (one slime's worth of its HP: a lone Mage can break it in a big party too)
        m.shield = { kind, from: t + warn * 1000, until: t + (warn + (b ? BARRIER_S : ARMOUR_S)) * 1000, hp: max, max, cracks: 0 };
        m.shieldLast = kind;
        m.shieldNext = m.shield.until + (b ? BARRIER_EVERY : ARMOUR_EVERY) * 1000;
        bossEvent(m, 'shieldUp', { kind, dur: warn });
        dirty = true;
      }
    } else if (m.shield || m.shieldNext) {
      dirty ||= !!m.shield;
      m.shield = null;
      m.shieldNext = 0;
    }
    // weak point: open for WEAK_OPEN_S now and then (Hunter's Mark on the boss: WEAK_MARK_S)
    if (bits & partyBit('weakpoint')) {
      const w = m.weak;
      if (w && m.mark && m.mark.until > t && w.until < w.at + WEAK_MARK_S * 1000) {
        w.until = w.at + WEAK_MARK_S * 1000;
        dirty = true;
      }
      if (w && t >= w.until) {
        m.weak = null;
        m.weakNext = t + WEAK_EVERY * 1000;
        dirty = true;
      }
      if (!m.weakNext) m.weakNext = t + WEAK_EVERY * 500;
      if (!m.weak && t >= m.weakNext && !busy) {
        m.weak = { at: t, until: t + WEAK_OPEN_S * 1000, fill: 0, max: Math.max(1, Math.round(k.hp * TEST_BOSS_HP * WEAK_HP)) }; // (like the barrier's)
        bossEvent(m, 'weakOpen');
        dirty = true;
      }
    } else if (m.weak || m.weakNext) {
      dirty ||= !!m.weak;
      m.weak = null;
      m.weakNext = 0;
    }
    if (dirty || (m.partyDirty && t - m.partySentAt > 150) || (bits && t - m.partySentAt > 2000)) sendParty(m); // (and every 2 s, for anyone who just came in)
  }
  // S5.2: a boss's party state as the hit cap sees it, a little generous at the edges (the client's view of a phase
  // starting or ending runs a moment behind): { stag, shield, weakOpen }
  function partyHit(m) {
    const t = now(), sh = m.shield;
    return { stag: m.staggerUntil > t - 300, shield: sh && t >= sh.from + 250 ? sh.kind : null, weakOpen: !!m.weak && t < m.weak.until + 300 };
  }
  // a hit just landed on a boss with its party mechanics on: magic wears a barrier down, a heavy hit cracks armour,
  // a hit on the weak point fills it. Each one, done, staggers it. → true if it cracked the armour
  function partyHitLanded(m, dmg, { magic, heavy, weak }) {
    const t = now(), sh = m.shield;
    let cracked = false;
    if (sh && t >= sh.from) {
      if (sh.kind === 'barrier' && magic) {
        sh.hp -= dmg;
        m.partyDirty = true;
        if (sh.hp <= 0) breakShield(m);
      } else if (sh.kind === 'armour' && heavy) {
        cracked = true;
        sh.cracks++;
        m.partyDirty = true;
        bossEvent(m, 'crack', { n: sh.cracks });
        if (sh.cracks >= ARMOUR_CRACKS) breakShield(m);
      }
    }
    if (weak && m.weak) {
      m.weak.fill += dmg;
      m.partyDirty = true;
      if (m.weak.fill >= m.weak.max) {
        m.weak = null;
        m.weakNext = t + WEAK_EVERY * 1000;
        bossEvent(m, 'weakBreak');
        stagger(m);
      }
    }
    return cracked;
  }
  function breakShield(m) {
    const kind = m.shield.kind;
    m.shield = null;
    bossEvent(m, 'shieldBreak', { kind });
    stagger(m);
  }
  // The stagger (STAGGER_S): the boss stops dazed and takes STAGGER_DMG more. A wind-up it was in is dropped; a
  // move already going off (or an ultimate) finishes first, then it staggers (staggerQueued)
  function stagger(m) {
    const t = now(), k = MOBS[m.kind];
    if (m.dead) return;
    if (k.boss && m.phase === 'warn' && m.act !== 'ult' && !m.special) {
      m.act = null;
      m.phase = 'walk';
      m.timer = 0;
      m.hover = k.fly ?? 0;
    }
    if (k.boss ? m.phase !== 'walk' : !!m.aiPhase) {
      m.staggerQueued = true;
      m.partyDirty = true;
      return;
    }
    m.staggerQueued = false;
    m.staggerUntil = t + STAGGER_S * 1000;
    m.next = Math.max(m.next, 1);
    m.vx = 0;
    bossEvent(m, 'stagger', { dur: STAGGER_S });
    sendParty(m);
  }
  // The interrupt (S5.2; owner 2026-10-24): a freeze landed (from player id) while the ultimate was still warning:
  // it's cancelled outright ({t:'boss', a:'ultCancel'} clears everyone's banner), the next comes ULT_EVERY later as
  // usual, and the boss staggers
  function interruptUlt(m, id) {
    const t = now();
    m.ult = null;
    m.act = null;
    m.phase = 'walk';
    m.timer = 0;
    m.ultLiveUntil = 0;
    m.hover = MOBS[m.kind].fly ?? 0;
    m.ultAt = t + ULT_EVERY[Math.max(1, m.stage)] * 1000;
    bossEvent(m, 'ultCancel', { by: id });
    stagger(m);
  }
  // ——— S5.2: curses, on the player (p.curse { n, until, by: the boss's id, room, tick, far }; not saved) ———
  function curse(qid, q, m) {
    const t = now(), c = q.curse;
    if (q.faintUntil || (q.aegisUntil ?? 0) > t) return; // (Aegis: nothing gets through)
    q.curse = { n: Math.min(CURSE_MAX, (c?.n ?? 0) + 1), until: t + CURSE_S * 1000, by: m.id, room: m.room, tick: c?.tick ?? t + 1000, far: 0 };
    cursed(qid, q);
  }
  // → the room: {t:'curse', id, n} (the wisps over a cursed slime), and its owner's status box
  function cursed(qid, q) {
    toRoom(q.state.room)({ t: 'curse', id: qid, n: q.curse?.n ?? 0 });
    sendMe(q);
  }
  function uncurse(qid, q, quiet = false) {
    if (!q.curse) return;
    const room = q.curse.room;
    q.curse = null;
    toRoom(room)({ t: 'curse', id: qid, n: 0 });
    if (!quiet && q.joined) sendMe(q);
  }
  // Cleanse's target: the nearest cursed friend within r, else p if it's cursed → [id, q] or null
  function cleanseTarget(p, r) {
    const list = near(p, r).filter(([, q]) => q.curse?.n > 0);
    const others = list.filter(([, q]) => q !== p).sort(([, a], [, b]) => Math.abs(a.state.x - p.state.x) - Math.abs(b.state.x - p.state.x));
    return others[0] ?? list.find(([, q]) => q === p) ?? null;
  }
  // every tick: each curse burns once a second, fades at range, and ends with its time, its boss, or leaving the room
  function curseTick(t) {
    for (const [qid, q] of players) {
      const cu = q.curse;
      if (!cu) continue;
      const boss = mobs.find((m) => m.id === cu.by && !m.dead && !m.gone);
      if (!q.joined || !q.rpg || t >= cu.until || q.state.room !== cu.room || !boss) {
        uncurse(qid, q, !q.joined);
        continue;
      }
      if (Math.abs(q.state.x - boss.x) > CURSE_FADE_R) {
        if (!cu.far) cu.far = t + CURSE_FADE_S * 1000;
        else if (t >= cu.far) {
          cu.far = t + CURSE_FADE_S * 1000;
          if (--cu.n <= 0) {
            uncurse(qid, q);
            continue;
          }
          cursed(qid, q);
        }
      } else cu.far = 0;
      if (t >= cu.tick) {
        cu.tick = t + 1000;
        hurt(qid, q, stats(q).maxHp * CURSE_DOT * cu.n, q.state.x, undefined, 0, false, boss, 'dot');
      }
    }
  }
  // Rally's taunt (the Knight; S5, owner 2026-10-24): every mob within r turns on p for TAUNT_S, and a boss's
  // focus moves to p (one without focus: its target, for as long). → how many it pulled
  function taunt(id, p, r) {
    const t = now();
    let n = 0;
    for (const m of alive(p.state.room)) {
      if (Math.abs(m.x - p.state.x) > r + MOBS[m.kind].w / 2 || Math.abs(m.y - p.state.y) > r + MOBS[m.kind].h) continue;
      m.target = p;
      m.targetUntil = m.tauntUntil = t + TAUNT_S * 1000;
      if (m.partyOn & partyBit('focus')) { // (in the gap between two focuses too)
        m.focus = { p, id, until: t + TAUNT_S * 1000 };
        sendParty(m);
      }
      n++;
    }
    return n;
  }

  // Spend gold on something outside the bag (a bigger house): → true if p had it. Saved straight away.
  function pay(p, gold) {
    const c = p.rpg;
    if (!c || !(gold >= 0) || c.coins < gold) return false;
    c.coins -= gold;
    p.dirty = true;
    save(p);
    sendMe(p);
    return true;
  }

  return {
    load,
    save,
    pay,
    look,
    sendMe,
    attack,
    pvp,
    cast,
    ouch,
    playerAt,

    tick(serverTick) {
      tick = serverTick;
      const t = now(), dt = 1 / TICK_RATE;
      for (const [, p] of players) if (p.joined && p.rpg) record(p, p.state.x, p.state.y);
      const rooms = new Map();
      for (const m of mobs) {
        if (m.gone) continue;
        if (!rooms.has(m.room)) rooms.set(m.room, inRoom(m.room));
        const here = rooms.get(m.room);
        if (m.dead) {
          if (!m.minion && t >= m.respawnAt) {
            spawn(m);
            if (MOBS[m.kind].field) toRoom(m.room)({ t: 'boss', a: 'fieldUp', id: m.id, kind: m.kind }); // the room hears it
          }
          continue;
        }
        if (MOBS[m.kind].field && (m.hp < m.maxHp || m.fighters > 1) && t - Math.max(0, ...m.hitters.values()) > FIELD_BOSS_IDLE_MS) {
          Object.assign(m, { hp: MOBS[m.kind].hp, maxHp: MOBS[m.kind].hp, fighters: 1, hitters: new Map(), dmg: new Map(), heal: new Map(), taken: new Map(), dmgDirty: true }); // left alone: it heals up (and the damage meter starts over)
        }
        if (m.den) {
          m.emptyFor = here.some(([, q]) => !q.faintUntil) ? 0 : m.emptyFor + dt; // (knocked-out slimes lying there don't count)
          if (m.emptyFor > 8 && (m.hp < m.maxHp || m.fighters > 1 || m.enraged)) resetBoss(m); // everyone left (or is down): it heals up
        }
        if (here.length) stepMob(m, here, dt);
      }
      for (let i = mobs.length - 1; i >= 0; i--) if (mobs[i].gone) mobs.splice(i, 1);
      summons.tick(dt, tick); // the Cleric's spirits, wisps and totems (server/summons.js)
      // Mend (Cleric): a heal every second while it lasts, from its caster (gone if the caster left)
      for (const [qid, q] of players) {
        const md = q.mend;
        if (!md || t < md.next) continue;
        const by = players.get(md.by);
        if (t >= md.until || !q.joined || !q.rpg || !by?.joined || by.state.room !== q.state.room) {
          q.mend = null;
          continue;
        }
        md.next += 1000;
        healFrom(md.by, by, qid, q, md.amt);
      }
      curseTick(t); // (S5.2: a boss's curses on players)
      // burns (the Mage's combos): a tick of damage every BURN_TICK_MS, counted for the caster (the damage meter,
      // EXP); the burn ends with its time or when the caster leaves the room. → {t:'burn', h: [[mobId, dmg, 0, killed]]}
      const burnt = new Map();
      for (const m of mobs) {
        const b = m.burn;
        if (!b || m.dead || m.gone) continue;
        const q = players.get(b.by);
        if (t >= b.until || !q?.joined || !q.rpg || q.state.room !== m.room) {
          m.burn = null;
          continue;
        }
        if (t < b.next) continue;
        b.next += BURN_TICK_MS;
        if (m.special && !m.egg) continue; // (phased out: the flames can't reach it)
        const hit = damage(m, Math.max(1, Math.round((b.dps * BURN_TICK_MS) / 1000)), false, b.by, q, 0, 0);
        if (!burnt.has(m.room)) burnt.set(m.room, []);
        burnt.get(m.room).push(hit);
      }
      for (const [room, h] of burnt) toRoom(room)({ t: 'burn', h });
      // ~30 Hz mob snapshots to each combat room: [id, kind, x, y, hp, flags, maxHp]
      // flags: 1 facing left · 2 walking · 4 angry · 8 telegraphing · 16 charging · 32 enraged · 64 slowed ·
      // 128 special (phased out, mid-teleport, Pyra's egg); the Mage's combos above the byte: 256 chilled · 512
      // frozen · 1024 burning; the Archer's (S4): 2048 marked (Hunter's Mark) · 4096 netted (wire version 5 sends
      // them in a second byte; older tabs get the low byte only);
      // then [egg hp, egg max] while there's an egg
      if (tick % 2 === 0) {
        for (const [room, here] of rooms) {
          if (!here.length) continue;
          const list = mobs.filter((m) => m.room === room && !m.dead && !m.gone).map((m) => [m.id, MOB_KINDS.indexOf(m.kind), Math.round(m.x), Math.round(m.y), Math.max(0, Math.ceil(m.hp)),
            (m.dir < 0 ? 1 : 0) | (Math.abs(m.vx) > 10 ? 2 : 0) | (m.target ? 4 : 0) | (m.phase === 'warn' ? 8 : 0) | (m.act === 'charge' && m.phase === 'act' ? 16 : 0) | (m.enraged ? 32 : 0) | (m.slowUntil > t ? 64 : 0) | (m.special ? 128 : 0) | (m.aiPhase === 'warn' || m.aiPhase === 'out' || m.aiPhase === 'slash' ? 8 : 0) | (m.aiPhase === 'lunge' || m.dive ? 16 : 0) | (m.chillUntil > t ? 256 : 0) | (m.frozenUntil > t ? 512 : 0) | (m.burn && m.burn.until > t ? 1024 : 0) | (m.mark && m.mark.until > t ? 2048 : 0) | (m.snareUntil > t ? 4096 : 0), m.maxHp,
            ...(m.egg ? [Math.max(0, Math.ceil(m.egg.hp)), m.egg.max] : [])]);
          const boss = mobs.find((m) => m.den && m.room === room);
          const msg = { t: 'mobs', k: tick, m: list };
          if (boss?.dead) msg.b = Math.ceil((boss.respawnAt - t) / 1000); // seconds until the boss is back
          let data; // binary for current clients (src/shared/wire.js, each version once), JSON for old tabs
          const bin = {};
          for (const [, q] of here) send(q.ws, q.bin ? (bin[q.bin] ??= encodeMobs(tick, list, msg.b, q.bin)) : (data ??= JSON.stringify(msg)));
        }
      }
      // the damage meter of each boss and field boss: {t:'bossdmg', id, kind, d: [[name, damage], …] (most first)}
      // when it changed (at most every quarter second), and every few seconds for anyone who just came in.
      // An empty d: its HP was reset (it respawned, or healed up when left alone)
      if (tick % 15 === 0) {
        for (const m of mobs) {
          if (m.gone || !(m.dmgDirty || (tick % 180 === 0 && m.dmg.size)) || !rooms.get(m.room)?.length) continue;
          m.dmgDirty = false;
          const rows = (map) => [...map].sort((a, b) => b[1] - a[1]).map(([n, v]) => [n, Math.round(v)]);
          toRoom(m.room)({ t: 'bossdmg', id: m.id, kind: m.kind, d: rows(m.dmg), h: m.heal.size ? rows(m.heal) : undefined, k: m.taken.size ? rows(m.taken) : undefined });
        }
      }
      for (const [pid, p] of players) if (p.faintUntil && t >= p.faintUntil) wakeUp(pid, p);
      for (const [pid, p] of players) if (p.godsUntil && t >= p.godsUntil) godsEnd(pid, p);
      // Momentum: gone after MOMENTUM_STILL s standing still (or when its time runs out)
      for (const p of players.values()) {
        if (!p.momentum || !p.state) continue;
        if (!p.state.grounded || Math.abs(p.state.vx) > 1) p.movedAt = t;
        if (p.momentum.until <= t || t - (p.movedAt ?? t) >= MOMENTUM_STILL * 1000) {
          p.momentum = null;
          if (p.joined && p.rpg) sendMe(p);
        }
      }
      for (let i = zones.length - 1; i >= 0; i--) if (zones[i].until < t) zones.splice(i, 1);
      if (tick % TICK_RATE === 0) {
        // once a second: slow regen in combat rooms, quick everywhere else; loot fades after a while
        for (const p of players.values()) {
          if (!p.joined || !p.rpg || p.faintUntil) continue;
          const st = stats(p), c = p.rpg, combat = isCombat(p.state.room);
          let changed = false;
          if (c.hp < st.maxHp && !(combat && t - p.hurtAt < 5000)) {
            c.hp = Math.min(st.maxHp, c.hp + (combat ? Math.max(1, st.maxHp * 0.01 * st.hpRegen) : st.maxHp * 0.08));
            changed = true;
          }
          if (c.mp < st.maxMp) {
            c.mp = Math.min(st.maxMp, c.mp + (combat ? Math.max(1, st.maxMp * 0.02) * mpRegen(c.skills) : st.maxMp * 0.1));
            changed = true;
          }
          if (changed) sendMe(p);
        }
        const gone = new Set();
        for (let i = loot.length - 1; i >= 0; i--) if (t - loot[i].at > LOOT_LIFE_MS) gone.add(loot.splice(i, 1)[0].room);
        for (const room of gone) showLoot(room);
      }
    },

    // → {t:'wake'} while knocked out in a combat room: give up waiting for a Cleric and wake up in town
    // (not in the first FAINT_MS, so a held click doesn't skip the splat). Closing the game does it too.
    wake(id, p, quit = false) {
      if (p.faintUntil !== Infinity || (!quit && now() - (p.faintAt ?? 0) < FAINT_MS)) return;
      wakeUp(id, p);
    },

    entered(p) {
      // a one-time message on joining (the rollback, classes arriving); news: which one, for a banner
      if (p.notice) send(p.ws, { t: 'notice', text: p.notice, news: p.news ?? undefined });
      p.notice = p.news = null;
      // who's lying knocked out in here (you too, after a reload): drawn as puddles, and Revive can reach them
      for (const [qid, q] of inRoom(p.state.room)) if (q.faintUntil === Infinity) send(p.ws, { t: 'faint', id: qid, down: 1, quiet: 1 });
      if (isCombat(p.state.room)) send(p.ws, lootMsg(p.state.room));
      const boss = mobs.find((m) => m.den && m.room === p.state.room && !m.dead), enter = boss && MOBS[boss.kind].lines?.enter;
      if (enter) bossSays(boss, pick(enter), p);
    },

    // → {t:'way'} at a waystone: attune to it · → {t:'way', to} at one you're attuned to: go to stone `to`
    // (src/shared/waystones.js). Checked like a door: you're standing at the stone, and you know both.
    way(id, p, m) {
      const at = wayAt(p.state), c = p.rpg;
      if (!at || p.faintUntil) return;
      if (!m.to) {
        if (c.ways.includes(at.id)) return;
        c.ways.push(at.id);
        toast(p, `The waystone hums. You're attuned to the ${at.name} waystone.`);
        sendMe(p);
        return;
      }
      const to = wayById(m.to);
      if (!to || to === at || !sameIsle(to, at) || !c.ways.includes(at.id) || !c.ways.includes(to.id)) return;
      toRoom(p.state.room)({ t: 'warp', id, x: Math.round(p.state.x) });
      placeAt(p.state, to.room, to.x + ARRIVE_DX);
      moves(p);
      toRoom(to.room)({ t: 'warp', id, x: Math.round(p.state.x), in: true });
      toast(p, `The stones hum, and you're at the ${to.name} waystone.`);
    },

    // Z: pick up the nearest thing on the ground
    pickup(p) {
      const t = now();
      if (!isCombat(p.state.room) || t - (p.pickAt ?? 0) < 100) return;
      p.pickAt = t;
      const s = p.state;
      const c = p.rpg;
      // the nearest drop that fits: a full bag still takes the coins beside an item it can't hold
      let best = -1, bestD = PICKUP_RANGE + 10, full = false; // (a little slack for lag)
      loot.forEach((d, i) => {
        const dx = Math.abs(d.x - s.x);
        if (d.room !== s.room || dx > bestD || Math.abs(d.y - s.y) >= 60) return;
        if (!lootFits(c.bag, d.item)) return void (full = true);
        [best, bestD] = [i, dx];
      });
      if (best < 0) return full && toast(p, 'Your bag is full');
      const d = loot[best];
      if (d.item === 'coin') c.coins += Math.round(d.n * (1 + (brewOf(c)?.gold ?? 0))); // (a brewed gold buff)
      else if (!addToBag(c, d.item, d.n, d.e)) return toast(p, 'Your bag is full');
      loot.splice(best, 1);
      showLoot(d.room);
      send(p.ws, { t: 'got', item: d.item, n: d.n, loot: d.id });
      sendMe(p);
    },

    // Bag actions from the inventory (I) and the potion hotbar (7–9)
    item(id, p, m) {
      const c = p.rpg;
      if (m.t === 'unequip') {
        const slot = m.slot === 'helmet' ? 'helmet' : 'weapon'; // (old tabs say 'sword')
        if (!c.gear[slot]) return;
        if (c.bag.length >= BAG_SLOTS) return toast(p, 'Your bag is full');
        c.bag.push(c.gearE[slot] ? { id: c.gear[slot], n: 1, e: c.gearE[slot] } : { id: c.gear[slot], n: 1 });
        c.gear[slot] = null;
        c.gearE[slot] = null;
        showLook(id, p);
        return sendMe(p);
      }
      // the potion hotbar names the item instead of a bag slot
      const slot = typeof m.item === 'string' ? c.bag.findIndex((b) => b.id === m.item) : m.slot >>> 0;
      const b = c.bag[slot];
      if (!b) return typeof m.item === 'string' && toast(p, `You're out of ${ITEMS[m.item]?.name ?? 'that'}`);
      const it = ITEMS[b.id];
      if (m.t === 'equip' && gearSlotOf(b.id)) {
        if (!weaponOk(c.cls, gearSlotOf(b.id) === 'weapon' ? b.id : null)) return toast(p, `${aOrAn(CLASSES[c.cls].name).replace(/^a/, 'A')} can only wield ${aOrAn(CLASSES[c.cls].weapon)} (change class at the Rebirth Pool)`);
        const gs = gearSlotOf(b.id), old = c.gear[gs], oldE = c.gearE[gs];
        c.gear[gs] = b.id;
        c.gearE[gs] = b.e ?? null;
        if (old) c.bag[slot] = oldE ? { id: old, n: 1, e: oldE } : { id: old, n: 1 };
        else c.bag.splice(slot, 1);
        showLook(id, p);
      } else if (m.t === 'use' && it.kind === 'potion') {
        const st = stats(p);
        if (p.faintUntil) return;
        if (it.cure) { // S5.5: the Cleansing Tonic and the Barrier Draught, one shared cooldown (CURE_CD)
          const t = now();
          if ((p.cureAt ?? 0) > t) return toast(p, `${it.name}: ready in ${Math.ceil((p.cureAt - t) / 1000)} s`);
          if (it.cure === 'curse' && !p.curse) return toast(p, "You're not cursed");
          p.cureAt = t + CURE_CD * 1000;
          if (it.cure === 'curse') {
            uncurse(id, p, true);
            guard(id, p, 'cleansed');
          } else p.draughtUntil = t + DRAUGHT_S * 1000;
        }
        if (it.heal && c.hp >= st.maxHp && !it.mana) return toast(p, "You're already at full HP");
        if (it.mana && c.mp >= st.maxMp && !it.heal) return toast(p, "You're already at full MP");
        if (it.heal) c.hp = Math.min(st.maxHp, c.hp + it.heal);
        if (it.mana) c.mp = Math.min(st.maxMp, c.mp + it.mana);
        if (it.buff) {
          // a brewed buff replaces whichever one was up
          const was = brewOf(c) && c.brew.id !== b.id ? ITEMS[c.brew.id].name : null;
          c.brew = { id: b.id, until: now() + it.dur * 1000 };
          toast(p, `${it.name}: ${it.dur / 60} minutes${was ? ` (instead of ${was})` : ''}`);
        }
        if (it.full) {
          const full = stats(p); // (with the new buff)
          c.hp = full.maxHp;
          c.mp = full.maxMp;
        }
        if (--b.n <= 0) c.bag.splice(slot, 1);
      } else if (m.t === 'drop') {
        if (!isCombat(p.state.room)) return toast(p, 'You can only drop things in the Wildwood');
        c.bag.splice(slot, 1);
        dropLoot(p.state.room, b.id, b.n, p.state.x + p.state.facing * 20, p.state.y, b.e);
        showLoot(p.state.room);
      } else return;
      sendMe(p);
    },

    // A scroll from the bag on a sword or helmet (MapleStory style: every try uses up one of the item's
    // slots, success or not, and nothing gives a slot back). {t:'scroll', slot: the scroll's bag index,
    // target: 'helmet' | 'weapon' (worn) | a bag index}. Everyone in the room sees how it went.
    scroll(id, p, m) {
      const c = p.rpg, sc = c.bag[m.slot >>> 0];
      if (!sc || ITEMS[sc.id]?.kind !== 'scroll' || p.faintUntil) return;
      if (m.target === 'sword') m.target = 'weapon'; // (old tabs)
      const worn = m.target === 'helmet' || m.target === 'weapon';
      const item = worn ? (c.gear[m.target] ? { id: c.gear[m.target], e: c.gearE[m.target] } : null) : c.bag[m.target >>> 0];
      if (!item || !canScroll(sc.id, item.id)) return toast(p, "That scroll doesn't go on that");
      const used = item.e?.u ?? 0, slots = slotsOf(item.id);
      if (used >= slots) return toast(p, `${enhName(item.id, item.e)} has no upgrade slots left`);
      const r = rollScroll(sc.id, item.id, item.e);
      if (--sc.n <= 0) c.bag.splice(c.bag.indexOf(sc), 1);
      const name = enhName(item.id, r.e);
      if (r.boom) {
        if (worn) {
          c.gear[m.target] = null;
          c.gearE[m.target] = null;
        } else c.bag.splice(c.bag.indexOf(item), 1);
      } else if (worn) c.gearE[m.target] = r.e;
      else item.e = r.e;
      if (worn) showLook(id, p);
      const left = slots - r.e.u;
      toRoom(p.state.room)({ t: 'scrolled', id, result: r.boom ? 'boom' : r.ok ? 'ok' : 'fail', item: item.id, name, left, by: p.name });
      if (r.boom || (r.ok && r.e.s >= 7)) broadcast({ t: 'toast', text: r.boom ? `${p.name}'s ${ITEMS[item.id].name} was destroyed by a dark scroll!` : `${p.name} scrolled their ${name}!` });
      const st = stats(p);
      c.hp = Math.min(c.hp, st.maxHp);
      sendMe(p);
    },

    // Put n of an item in p's bag (a harvest): → false if the bag is full
    give(p, id, n) {
      if (!addToBag(p.rpg, id, n)) return false;
      sendMe(p);
      return true;
    },
    // Use up n of a stacking item from p's bag (pet food): → false if p hasn't that many
    take(p, id, n) {
      const c = p.rpg, slot = c?.bag.find((b) => b.id === id);
      if (!slot || slot.n < n) return false;
      slot.n -= n;
      if (!slot.n) c.bag.splice(c.bag.indexOf(slot), 1);
      p.dirty = true;
      sendMe(p);
      return true;
    },

    // Brewing at an alchemy lab (server/index.js has checked p is at one): {t:'brew', steps, n}. The steps
    // are everything done at the lab, in order; a batch of n uses n × the ingredients and makes n × the
    // recipe's `makes`. Wrong steps make sludge, and the ingredients are gone either way.
    brew(id, p, m) {
      const c = p.rpg, steps = cleanSteps(m.steps), n = Math.max(1, Math.min(BREW_MAX, m.n >>> 0 || 1));
      if (!steps || p.faintUntil) return;
      const need = needs(steps);
      if (!Object.keys(need).length) return toast(p, 'Put some ingredients in first');
      for (const [item, k] of Object.entries(need)) {
        const have = c.bag.filter((b) => b.id === item).reduce((a, b) => a + b.n, 0);
        if (have < k * n) return toast(p, `Not enough ${ITEMS[item].name}: that takes ${k * n}, you have ${have}`);
      }
      const r = recipeFor(steps), result = RECIPES[r] ? r : 'sludge', made = r ? RECIPES[r].makes * n : 1;
      // room in the bag for what comes out (counting slots the ingredients free up)
      const after = c.bag.map((b) => ({ ...b }));
      for (const [item, k] of Object.entries(need)) {
        let left = k * n;
        for (const b of after) if (b.id === item && left > 0) {
          const take = Math.min(left, b.n);
          b.n -= take;
          left -= take;
        }
      }
      const kept = after.filter((b) => b.n > 0);
      if (!kept.some((b) => b.id === result) && kept.length >= BAG_SLOTS) return toast(p, 'Your bag is full: make room for the potions first');
      c.bag = kept;
      addToBag(c, result, made);
      toRoom(p.state.room)({ t: 'brewed', id, item: result, n: made, ok: !!r });
      sendMe(p);
    },

    // The shops (SHOPS: Merchant Pip in the village, Runa at Icefang Hamlet): {t:'buy', item, n, shop} ·
    // {t:'sell', slot, n, shop} · {t:'buycos', id} (Pip's Boutique). shop: SHOPS key, default 'pip'.
    shop(id, p, m) {
      const c = p.rpg, keeper = SHOPS[m.shop] ?? SHOPS.pip;
      if (p.state.room !== keeper.room || Math.abs(p.state.x - keeper.x) > SHOP_RANGE + 140) return toast(p, 'Walk over to the shop first');
      if (m.t === 'buy') {
        const it = ITEMS[m.item];
        if (!keeper.stock.includes(m.item)) return;
        const n = STACKS(m.item) ? Math.max(1, Math.min(BUY_MAX, m.n >>> 0 || 1)) : 1;
        const cost = it.price * n;
        if (c.coins < cost) return toast(p, `Not enough gold (that's ${cost})`);
        if (!addToBag(c, m.item, n)) return toast(p, 'Your bag is full');
        c.coins -= cost;
        send(p.ws, { t: 'shop', ok: 'buy', item: m.item, n, gold: cost });
      } else if (m.t === 'buycos') {
        const cos = keeper.boutique && COSMETICS[m.id];
        if (!cos || c.cosmetics.includes(m.id)) return;
        if (c.coins < cos.price) return toast(p, `Not enough gold (that's ${cos.price})`);
        c.coins -= cos.price;
        c.cosmetics.push(m.id);
        c.wear.push(m.id); // put it on straight away
        send(p.ws, { t: 'shop', ok: 'buy', cos: m.id, n: 1, gold: cos.price });
        showLook(id, p);
      } else if (m.t === 'sell') {
        const b = c.bag[m.slot >>> 0];
        if (!b) return;
        const n = Math.max(1, Math.min(b.n, m.n >>> 0 || b.n));
        const gold = sellPrice(b.id) * n;
        b.n -= n;
        if (b.n <= 0) c.bag.splice(m.slot >>> 0, 1);
        c.coins += gold;
        send(p.ws, { t: 'shop', ok: 'sell', item: b.id, n, gold });
      } else return;
      sendMe(p);
    },

    // The Rebirth Pool in Slimeville (S2, story/archive/s2-plan.md): {t:'rebirth', cls} chooses your class (from
    // CLASS_LVL; the first choice is free) or changes it (rebirthCost(lvl) gold). Level, EXP, gold, bag, gear
    // and house all stay; every skill point and AP comes back, the skill hotbars empty and buffs end. The
    // weapon must suit the new class: a wrong one goes back in the bag (refused if the bag is full), a right
    // one from the bag takes its place, and if you own none of that kind you get its starter weapon.
    rebirth(id, p, m) {
      const c = p.rpg, s = p.state, cl = CLASSES[m.cls];
      if (!cl || m.cls === 'novice' || p.faintUntil) return;
      if (s.room !== VILLAGE || Math.abs(s.x - REBIRTH_X) > REBIRTH_RANGE + 40) return toast(p, 'Walk over to the Rebirth Pool first');
      if (m.cls === c.cls) return toast(p, `You're ${aOrAn(cl.name)} already`);
      if (c.lvl < CLASS_LVL) return toast(p, `Come back at Lv ${CLASS_LVL} to choose your class`);
      const cost = c.reborn ? rebirthCost(c.lvl) : 0;
      if (c.coins < cost) return toast(p, `Not enough gold: changing class costs ${cost.toLocaleString('en-US')} at your level`);
      const g = c.gear, wrong = g.weapon && !weaponOk(m.cls, g.weapon) ? { id: g.weapon, n: 1, ...(c.gearE.weapon ? { e: c.gearE.weapon } : {}) } : null;
      const power = (b) => (ITEMS[b.id].atk ?? ITEMS[b.id].magic ?? 0) + (b.e?.atk ?? 0) + (b.e?.magic ?? 0);
      const from = !g.weapon || wrong ? c.bag.reduce((best, b, i) => (ITEMS[b.id]?.kind === cl.weapon && (best < 0 || power(b) > power(c.bag[best])) ? i : best), -1) : -1; // (the strongest)
      if (wrong && from < 0 && c.bag.length >= BAG_SLOTS) return toast(p, `Your bag is full: make room for your ${ITEMS[wrong.id].name} first`);
      c.coins -= cost;
      if (!g.weapon || wrong) {
        if (from >= 0) {
          const b = c.bag[from];
          g.weapon = b.id;
          c.gearE.weapon = b.e ?? null;
          if (wrong) c.bag[from] = wrong;
          else c.bag.splice(from, 1);
        } else {
          if (wrong) c.bag.push(wrong);
          g.weapon = cl.starter;
          c.gearE.weapon = null;
        }
      }
      const was = c.cls;
      Object.assign(c, { cls: m.cls, reborn: c.reborn + 1, skills: giftsOf(c.skills), ap: Object.fromEntries(AP_STATS.map(({ id: k }) => [k, 0])) });
      c.hotbar = Array(HOTBAR).fill(null);
      c.alt.hotbar = Array(HOTBAR).fill(null);
      c.shield = false;
      p.berserkUntil = p.rallyUntil = p.bubbleUntil = p.aegisUntil = p.godsUntil = 0;
      p.barrier = p.mend = null;
      summons.clear(id);
      p.cds = {};
      moves(p);
      const st = stats(p);
      c.hp = Math.min(c.hp, st.maxHp);
      c.mp = Math.min(c.mp, st.maxMp);
      toRoom(s.room)({ t: 'reborn', id, cls: m.cls, from: was });
      showLook(id, p);
      toast(p, `You're a ${cl.name} now${cost ? ` (${cost.toLocaleString('en-US')} gold)` : ''}! Your skill points and ability points are all yours to spend (K and I).`);
      sendMe(p);
    },

    // The skill tree (K): learn / take back a point / reset everything, and the hotbar
    skills(id, p, m) {
      const c = p.rpg;
      if (m.t === 'learn') {
        const why = cantLearn(c, m.skill);
        if (why) return toast(p, why);
        c.skills = { ...c.skills, [m.skill]: rankOf(c.skills, m.skill) + 1 };
      } else if (m.t === 'unlearn') {
        const why = cantUnlearn(c, m.skill);
        if (why) return toast(p, why);
        c.skills = { ...c.skills, [m.skill]: rankOf(c.skills, m.skill) - 1 };
        if (!c.skills[m.skill]) delete c.skills[m.skill];
      } else if (m.t === 'respec') {
        c.skills = giftsOf(c.skills);
        p.berserkUntil = 0;
        c.shield = false;
      } else if (m.t === 'hotbar') {
        const bar = m.bar === 'pot' ? c.potbar : c.hotbar, i = m.slot >>> 0;
        if (i >= bar.length) return;
        const ok = m.id === null || (m.bar === 'pot' ? ITEMS[m.id]?.kind === 'potion' : ACTIVE(m.id) && skillFor(c.cls, m.id));
        if (!ok) return;
        for (let j = 0; j < bar.length; j++) if (bar[j] === m.id) bar[j] = null; // one slot per thing
        bar[i] = m.id;
      } else if (m.t === 'hotswap') {
        // Esc menu: swap the whole hotbar (skills and potions) for the other setup
        [c.hotbar, c.alt.hotbar] = [c.alt.hotbar, c.hotbar];
        [c.potbar, c.alt.potbar] = [c.alt.potbar, c.potbar];
        c.set ^= 1;
      } else if (m.t === 'ap') {
        // ability points from the bag: {stat, n} adds n (or takes -n back, free); {reset: true} takes all back
        if (m.reset) c.ap = Object.fromEntries(AP_STATS.map(({ id }) => [id, 0]));
        else {
          if (!AP_STATS.some((st) => st.id === m.stat)) return;
          const n = Math.trunc(Number(m.n) || 0), free = apTotal(c.lvl) - apSpent(c.ap);
          const d = n > 0 ? Math.min(n, free) : Math.max(n, -apOf(c.ap, m.stat));
          if (!d) return toast(p, n > 0 ? `No ability points left (you get ${AP_PER_LVL} each level)` : 'Nothing to take back');
          c.ap = { ...c.ap, [m.stat]: apOf(c.ap, m.stat) + d };
        }
      } else if (m.t === 'wear') {
        if (!c.cosmetics.includes(m.id)) return;
        c.wear = c.wear.filter((w) => w !== m.id);
        if (m.on) c.wear.push(m.id);
        showLook(id, p);
      } else if (m.t === 'showhelm') {
        c.showHelmet = !!m.on;
        showLook(id, p);
      } else if (m.t === 'pvp') {
        c.pvp = !!m.on;
        showLook(id, p);
      } else return;
      moves(p);
      // passives change max HP / MP
      const st = stats(p);
      c.hp = Math.min(c.hp, st.maxHp);
      c.mp = Math.min(c.mp, st.maxMp);
      sendMe(p);
    },
  };
}
