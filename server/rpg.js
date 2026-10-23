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
import { FIELD, MOBS, SPAWNS, MOB_RESPAWN_MS, ITEMS, STACKS, BAG_SLOTS, PICKUP_RANGE, expToNext, HURT_INVULN_MS, DENS, DEN_W, BOSS_RESPAWN_MS, BOSS_WINDOW_MS, BOSS_REPEAT_SHARE, overlevelScale, OVERLEVEL_GRACE, BOSS_HP_PER_PLAYER, FIELD_BOSS_RESPAWN_MS, PHASE_AT, COMBO_CHANCE, COMBO_MAX, ULT_FIRST, ULT_EVERY, ULT_WARN, NOVA_SAFE, WAVE_SPEED, isCombat, SHOPS, SHOP_RANGE, sellPrice, BUY_MAX, COSMETICS, canScroll, rollScroll, slotsOf, enhName, gearSlotOf, STAFF_OF, STAFF_OFFKIND, STAFF_BOLT_MULT } from '../src/shared/rpg.js';
import { SKILLS, ACTIVE, HOTBAR, POTBAR, AP_STATS, AP_PER_LVL, apOf, apTotal, apSpent, statsFor, cantLearn, cantUnlearn, rankOf, spTotal, spSpent, mpRegen, cooldownOf, durOf, mobilityOf } from '../src/shared/skills.js';
import { SLAP_REACH, TICK_RATE, ROOMS, TOWNS, placeAt } from '../src/shared/sim.js';
import { encodeMobs } from '../src/shared/wire.js';
import { RECIPES, BREW_MAX, cleanSteps, recipeFor, needs } from '../src/shared/alchemy.js';
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
});

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
      // bosses: walk → warn → act, every few seconds
      phase: 'walk', next: 3, timer: 0, act: null, enraged: false, last: null, emptyFor: 0,
      stage: 0, chain: 0, ultAt: 0, ultArmed: false, ult: null, ultLiveUntil: 0, rains: [], slamR: 300,
      // the newer mobs' tricks (mobAi) and bosses: special = phased / mid-teleport / Pyra's egg
      aiCd: rand(1, k.ai?.every ?? 3), aiPhase: null, aiTimer: 0, special: false, egg: null, ultN: 0,
      hover: k.fly ?? 0, hoverCur: k.fly ?? 0, dive: null, later: [],
      // bosses and field bosses: damage dealt by each slime (name → HP) since its HP was last full
      dmg: new Map(), dmgDirty: true,
    });
  }

  // ——— characters ———
  const brewOf = (c) => ((c.brew?.until ?? 0) > now() ? ITEMS[c.brew.id].buff : null); // a brewed potion's buff
  const buffsOf = (p) => ({ berserk: (p.berserkUntil ?? 0) > now(), rally: (p.rallyUntil ?? 0) > now() ? p.rallyBoost : 0, brew: brewOf(p.rpg) });
  const stats = (p) => statsFor(p.rpg, buffsOf(p));
  const left = (until) => Math.max(0, (until ?? 0) - now());
  const zones = []; // Sanctuaries: { room, x, r, until, cut }
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
    r.skills = Object.fromEntries(Object.entries(r.skills ?? {}).filter(([id, n]) => SKILLS[id] && n > 0).map(([id, n]) => [id, Math.min(n, SKILLS[id].max)]));
    if (spSpent(r.skills) > spTotal(r.lvl)) r.skills = {};
    const skillBar = (b) => Array.from({ length: HOTBAR }, (_, i) => (ACTIVE(b?.[i]) ? b[i] : null));
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
    p.hurtAt = 0;
    p.clockAt = now();
    p.cds = {};
    p.hist = [];
    p.dirty = !c;
    moves(p);
  }
  // the Mobility skills ride along in the physics state (sim.js step), so prediction knows them too
  function moves(p) {
    if (p.state && p.rpg) p.state.mv = mobilityOf(p.rpg.skills);
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
    const { lvl, exp, hp, mp, coins, bag, gear, gearE, skills, hotbar, potbar, alt, set, ap, pvp, cosmetics, wear, showHelmet, brew, ways, bossAt, bot, accusedAt, played, active } = p.rpg;
    const town = p.state?.town | 0; // your town (TOWNS in sim.js) lives in the physics state, and is saved with you
    saveRow.run(p.name, JSON.stringify({ lvl, exp, hp, mp, coins, bag, gear, gearE, skills, hotbar, potbar, alt, set, ap, pvp, cosmetics, wear, showHelmet, brew, town, ways, bossAt, bot, accusedAt, played, active }), now());
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
      t: 'me', lvl: c.lvl, exp: c.exp, next: expToNext(c.lvl), hp: Math.ceil(c.hp), maxHp: st.maxHp, mp: Math.floor(c.mp), maxMp: st.maxMp,
      coins: c.coins, bag: c.bag, gear: c.gear, gearE: c.gearE, atk: st.atk, magic: st.magic, def: st.def, skills: c.skills, sp: spTotal(c.lvl) - spSpent(c.skills),
      hotbar: c.hotbar, potbar: c.potbar, alt: c.alt, set: c.set, pvp: c.pvp, crit: st.crit, critMult: st.critMult, minRoll: st.minRoll,
      ap: c.ap, apLeft: apTotal(c.lvl) - apSpent(c.ap),
      cosmetics: c.cosmetics, wear: c.wear, showHelmet: c.showHelmet,
      berserk: left(p.berserkUntil), rally: left(p.rallyUntil), bubble: left(p.bubbleUntil), aegis: left(p.aegisUntil), secondWind: left(p.swReadyAt),
      brew: brewOf(c) ? { id: c.brew.id, left: left(c.brew.until) } : null,
      ways: c.ways,
    });
  }
  // What everyone else sees of you: gear, level and friendly fire (also part of join / welcome)
  const look = (p) => ({ gear: p.rpg.gear, lvl: p.rpg.lvl, pvp: p.rpg.pvp, wear: p.rpg.wear, showHelmet: p.rpg.showHelmet, plus: p.rpg.gearE?.weapon?.s ?? 0 });
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
      toast(q, `Level up! You're level ${c.lvl} (+1 skill point: K · +${AP_PER_LVL} ability points: I)`);
    }
    sendMe(q);
  }

  // ——— hurting slimes ———
  const hurtMsg = (id, p, dmg, by) => ({ t: 'hurt', id, dmg, hp: Math.max(0, Math.ceil(p.rpg.hp)), max: stats(p).maxHp, by });
  // 0 HP: splat where you stand (everyone in the room sees it), then wake up in your town (TOWNS: the last
  // one you were in)
  function faint(id, p, by) {
    p.rpg.hp = 0;
    p.faintUntil = now() + FAINT_MS; // inputs are ignored meanwhile (index.js)
    p.faintBy = by;
    for (const m of mobs) if (m.target === p) m.target = null;
    toRoom(p.state.room)({ t: 'faint', id, by });
    sendMe(p);
  }
  function wakeUp(p) {
    const c = p.rpg;
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
  function hurt(qid, q, raw, fromX, by, knock = 380, ult = false) {
    if (q.faintUntil || TEST_GOD) return;
    const t = now(), st = stats(q);
    if ((q.aegisUntil ?? 0) > t) return guard(qid, q, 'block');
    if ((q.bubbleUntil ?? 0) > t) {
      q.bubbleUntil = 0; // the bubble takes the hit, and pops
      sendMe(q);
      return guard(qid, q, 'pop');
    }
    const zone = zones.find((z) => z.room === q.state.room && z.until > t && Math.abs(q.state.x - z.x) < z.r);
    let dmg = ult ? (zone ? Math.round(st.maxHp * 0.6) : Math.ceil(q.rpg.hp) + 1) : Math.max(1, Math.round(raw * rand(0.85, 1.15) - st.def));
    if (zone && !ult) dmg = Math.max(1, Math.round(dmg * (1 - zone.cut)));
    if (st.ward && !ult) dmg = Math.max(1, Math.round(dmg * (1 - st.ward))); // a brewed ward
    q.hurtAt = t;
    q.rpg.hp -= dmg;
    const sw = rankOf(q.rpg.skills, 'second_wind');
    if (q.rpg.hp <= 0 && sw && t >= (q.swReadyAt ?? 0)) {
      q.rpg.hp = 1; // Second Wind
      q.swReadyAt = t + SKILLS.second_wind.cdFor(sw) * 1000;
      guard(qid, q, 'secondwind');
    }
    toRoom(q.state.room)(hurtMsg(qid, q, dmg, by));
    if (q.rpg.hp <= 0) return faint(qid, q, by);
    // knocked back (and up): the client's prediction catches up from the next snapshot
    const s = q.state;
    s.vx = Math.sign(s.x - fromX || 1) * knock;
    s.vy = -Math.min(420, knock * 1.1);
    s.grounded = s.onPlat = false;
    sendMe(q);
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

  // A dropping sword with a staff twin (STAFF_OF): which one falls. The weapon kind a random fighter is
  // holding, so everyone sees drops they can use; STAFF_OFFKIND of the time the other one, so both turn up.
  function twinPick(m, sword) {
    const held = [...m.hitters.keys()].map((qid) => ITEMS[players.get(qid)?.rpg?.gear.weapon]?.kind).filter(Boolean);
    let staff = held.length ? held[Math.floor(Math.random() * held.length)] === 'staff' : Math.random() < 0.5;
    if (Math.random() < STAFF_OFFKIND) staff = !staff;
    return staff ? STAFF_OF[sword] : sword;
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
    const drops = k.drops.filter(([, chance]) => Math.random() < chance * odds).map((d) => (STAFF_OF[d[0]] ? [twinPick(m, d[0]), ...d.slice(1)] : d));
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
    m.target = p;
    m.targetUntil = now() + 8000;
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
  // Apply hits the client worked out: [[mobId, dmg, crit], …] → [[mobId, dmg, crit, killed], …]
  function applyHits(id, p, hits, { max = 1, range, cap, dir, knock = 200, slow = 0 }) {
    const out = [];
    if (!Array.isArray(hits)) return out;
    for (const h of hits.slice(0, max)) {
      const m = Array.isArray(h) && mobs.find((q) => q.id === h[0] && !q.dead && q.room === p.state.room);
      if (!m || Math.abs(m.x - p.state.x) > range + MOBS[m.kind].w / 2 + SLACK) continue;
      const k = MOBS[m.kind];
      if (m.special && !m.egg) continue; // phased out / mid-teleport: can't be hit
      // an Obsidian Crab's front shell takes most of a hit from the front (the client shows the same cut)
      const shell = k.ai?.kind === 'shell' && Math.sign(p.state.x - m.x) === m.dir ? 1 - k.ai.cut : 1;
      const dmg = Math.max(1, Math.min(Math.round(Number(h[1]) || 0), Math.ceil(cap * shell) + 1));
      if (slow) m.slowUntil = now() + slow * 1000 * (MOBS[m.kind].boss ? 0.5 : 1);
      out.push(damage(m, dmg, !!h[2], id, p, Math.sign(m.x - p.state.x) || dir, knock));
    }
    return out;
  }
  const capOf = (st) => 1.15 * st.critMult; // best roll × crit

  // ——— a slap / sword swing / staff bolt in a combat room ———
  function attack(id, p, dir, hits) {
    if (p.faintUntil || !isCombat(p.state.room)) return [];
    const st = stats(p);
    if (st.boltRange) return applyHits(id, p, hits, { range: st.boltRange, cap: st.magic * STAFF_BOLT_MULT * capOf(st), dir, knock: 120 });
    return applyHits(id, p, hits, { range: SLAP_REACH + st.reach, cap: st.atk * capOf(st), dir });
  }

  // ——— skills (1–6) ———
  // friends within r of p (including p), in its room
  const near = (p, r) => inRoom(p.state.room).filter(([, q]) => !q.faintUntil && Math.hypot(q.state.x - p.state.x, q.state.y - p.state.y) <= r + 40);
  function cast(id, p, m) {
    const sk = SKILLS[m.skill], c = p.rpg, s = p.state;
    if (!ACTIVE(m.skill) || p.faintUntil) return;
    const rank = rankOf(c.skills, m.skill);
    if (!rank) return toast(p, `You haven't learned ${sk.name} yet (K)`);
    if (!isCombat(s.room)) return toast(p, 'Skills only work out in the Wildwood');
    if ((p.cds[m.skill] ?? 0) > now() + 250) return; // still cooling down (with slack for lag)
    if (c.mp < sk.mp) return send(p.ws, { t: 'nomana' });
    c.mp -= sk.mp;
    p.cds[m.skill] = now() + cooldownOf(m.skill, rank) * 1000;
    const st = stats(p), dir = m.dir < 0 ? -1 : 1, t = now();
    const phys = st.atk * (sk.mult?.(rank) ?? 1) * capOf(st), magic = st.magic * (sk.mult?.(rank) ?? 1) * capOf(st);
    const out = { t: 'skill', id, skill: m.skill, dir, x: s.x, y: s.y, hits: [] };
    const hit = (o) => (out.hits = applyHits(id, p, m.hits, { dir, ...o }));
    if (sk.kind === 'strike') hit({ range: SLAP_REACH + st.reach + sk.reach, cap: phys, knock: 320 });
    else if (sk.kind === 'cleave') hit({ max: sk.targets, range: SLAP_REACH + st.reach + sk.reach, cap: phys, knock: 260 });
    else if (sk.kind === 'spin') hit({ max: 20, range: sk.radius, cap: phys, knock: 260 });
    else if (sk.kind === 'storm') hit({ max: 20 * sk.hits, range: sk.radius, cap: phys, knock: 60 });
    else if (sk.kind === 'bolt' || sk.kind === 'chain' || sk.kind === 'meteor') {
      const range = sk.kind === 'chain' ? sk.range + sk.jump * sk.targets : sk.range + (sk.radius ?? 0);
      hit({ max: sk.kind === 'bolt' ? 1 : sk.kind === 'chain' ? sk.targets : 20, range, cap: magic, knock: 120 });
      out.tx = Number(m.tx) || s.x + dir * sk.range;
      out.ty = Number(m.ty) || s.y - 22;
      if (Array.isArray(m.points)) out.points = m.points.slice(0, 6).map((q) => [Number(q[0]) || 0, Number(q[1]) || 0]);
    } else if (sk.kind === 'nova') hit({ max: 20, range: sk.radius, cap: magic, knock: 100, slow: sk.slow });
    else if (sk.kind === 'starfall') hit({ max: 30, range: sk.radius, cap: magic, knock: 80 });
    else if (sk.kind === 'heal') {
      out.heals = [];
      for (const [qid, q] of near(p, sk.radius)) {
        const max = stats(q).maxHp, amt = Math.min(max - q.rpg.hp, sk.amount(rank));
        q.rpg.hp += amt;
        out.heals.push([qid, Math.round(amt)]);
        if (q !== p) sendMe(q);
      }
    } else if (sk.kind === 'buff') {
      p.berserkUntil = t + sk.dur * 1000;
      out.dur = sk.dur;
    } else if (sk.kind === 'bubble') {
      p.bubbleUntil = t + sk.dur * 1000;
      out.dur = sk.dur;
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
    } else if (sk.kind === 'zone') {
      zones.push({ room: s.room, x: s.x, r: sk.radius, until: t + sk.dur * 1000, cut: sk.cut(rank) });
      out.dur = sk.dur;
    }
    toRoom(s.room)(out);
    sendMe(p);
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
    if (m.kind !== 'touch' && m.kind !== 'charge' && !MOBS[mob.kind].boss && !MOBS[mob.kind].ai) return;
    if (ult && now() > mob.ultLiveUntil) return; // no ultimate going off right now
    const mx = Number.isFinite(m.mx) && Math.abs(m.mx - mob.x) < DEN_W ? m.mx : mob.x;
    hurt(id, p, MOBS[mob.kind].atk * mult, mx, undefined, knock, ult);
  }

  // ——— mobs and bosses, every tick ———
  function stepMob(m, here, dt) {
    const k = MOBS[m.kind], sp = m.sp, t = now();
    const slow = m.slowUntil > t ? (k.boss ? 0.6 : 0.4) : 1;
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
    const ai = !k.boss && k.ai ? mobAi(m, k, here, dt, t) : null;
    if (k.boss) want = bossBrain(m, k, here, dt, t) * slow;
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
    if (m.act !== 'ult' && m.target && ++m.chain < COMBO_MAX[stage] && Math.random() < COMBO_CHANCE[stage]) {
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
    spawn(m);
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
          Object.assign(m, { hp: MOBS[m.kind].hp, maxHp: MOBS[m.kind].hp, fighters: 1, hitters: new Map(), dmg: new Map(), dmgDirty: true }); // left alone: it heals up (and the damage meter starts over)
        }
        if (m.den) {
          m.emptyFor = here.length ? 0 : m.emptyFor + dt;
          if (m.emptyFor > 8 && (m.hp < m.maxHp || m.fighters > 1 || m.enraged)) resetBoss(m); // everyone left: it heals up
        }
        if (here.length) stepMob(m, here, dt);
      }
      for (let i = mobs.length - 1; i >= 0; i--) if (mobs[i].gone) mobs.splice(i, 1);
      // ~30 Hz mob snapshots to each combat room: [id, kind, x, y, hp, flags, maxHp]
      // flags: 1 facing left · 2 walking · 4 angry · 8 telegraphing · 16 charging · 32 enraged · 64 slowed ·
      // 128 special (phased out, mid-teleport, Pyra's egg); then [egg hp, egg max] while there's an egg
      if (tick % 2 === 0) {
        for (const [room, here] of rooms) {
          if (!here.length) continue;
          const list = mobs.filter((m) => m.room === room && !m.dead && !m.gone).map((m) => [m.id, MOB_KINDS.indexOf(m.kind), Math.round(m.x), Math.round(m.y), Math.max(0, Math.ceil(m.hp)),
            (m.dir < 0 ? 1 : 0) | (Math.abs(m.vx) > 10 ? 2 : 0) | (m.target ? 4 : 0) | (m.phase === 'warn' ? 8 : 0) | (m.act === 'charge' && m.phase === 'act' ? 16 : 0) | (m.enraged ? 32 : 0) | (m.slowUntil > t ? 64 : 0) | (m.special ? 128 : 0) | (m.aiPhase === 'warn' || m.aiPhase === 'out' || m.aiPhase === 'slash' ? 8 : 0) | (m.aiPhase === 'lunge' || m.dive ? 16 : 0), m.maxHp,
            ...(m.egg ? [Math.max(0, Math.ceil(m.egg.hp)), m.egg.max] : [])]);
          const boss = mobs.find((m) => m.den && m.room === room);
          const msg = { t: 'mobs', k: tick, m: list };
          if (boss?.dead) msg.b = Math.ceil((boss.respawnAt - t) / 1000); // seconds until the boss is back
          let data, bin; // binary for current clients (src/shared/wire.js), JSON for old tabs
          for (const [, q] of here) send(q.ws, q.bin ? (bin ??= encodeMobs(tick, list, msg.b)) : (data ??= JSON.stringify(msg)));
        }
      }
      // the damage meter of each boss and field boss: {t:'bossdmg', id, kind, d: [[name, damage], …] (most first)}
      // when it changed (at most every quarter second), and every few seconds for anyone who just came in.
      // An empty d: its HP was reset (it respawned, or healed up when left alone)
      if (tick % 15 === 0) {
        for (const m of mobs) {
          if (m.gone || !(m.dmgDirty || (tick % 180 === 0 && m.dmg.size)) || !rooms.get(m.room)?.length) continue;
          m.dmgDirty = false;
          toRoom(m.room)({ t: 'bossdmg', id: m.id, kind: m.kind, d: [...m.dmg].sort((a, b) => b[1] - a[1]).map(([n, v]) => [n, Math.round(v)]) });
        }
      }
      for (const p of players.values()) if (p.faintUntil && t >= p.faintUntil) wakeUp(p);
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

    entered(p) {
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
      let best = -1, bestD = PICKUP_RANGE + 10; // (a little slack for lag)
      loot.forEach((d, i) => {
        const dx = Math.abs(d.x - s.x);
        if (d.room === s.room && dx <= bestD && Math.abs(d.y - s.y) < 60) [best, bestD] = [i, dx];
      });
      if (best < 0) return;
      const d = loot[best], c = p.rpg;
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
        const gs = gearSlotOf(b.id), old = c.gear[gs], oldE = c.gearE[gs];
        c.gear[gs] = b.id;
        c.gearE[gs] = b.e ?? null;
        if (old) c.bag[slot] = oldE ? { id: old, n: 1, e: oldE } : { id: old, n: 1 };
        else c.bag.splice(slot, 1);
        showLook(id, p);
      } else if (m.t === 'use' && it.kind === 'potion') {
        const st = stats(p);
        if (p.faintUntil) return;
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

    // The skill tree (K): learn / take back a point / reset everything, and the hotbar
    skills(id, p, m) {
      const c = p.rpg;
      if (m.t === 'learn') {
        const why = cantLearn(c.lvl, c.skills, m.skill);
        if (why) return toast(p, why);
        c.skills = { ...c.skills, [m.skill]: rankOf(c.skills, m.skill) + 1 };
      } else if (m.t === 'unlearn') {
        const why = cantUnlearn(c.skills, m.skill);
        if (why) return toast(p, why);
        c.skills = { ...c.skills, [m.skill]: rankOf(c.skills, m.skill) - 1 };
        if (!c.skills[m.skill]) delete c.skills[m.skill];
      } else if (m.t === 'respec') {
        c.skills = {};
        p.berserkUntil = 0;
      } else if (m.t === 'hotbar') {
        const bar = m.bar === 'pot' ? c.potbar : c.hotbar, i = m.slot >>> 0;
        if (i >= bar.length) return;
        const ok = m.id === null || (m.bar === 'pot' ? ITEMS[m.id]?.kind === 'potion' : ACTIVE(m.id));
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
