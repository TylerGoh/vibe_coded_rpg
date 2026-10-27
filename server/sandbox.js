// Docs: docs/sandbox.md
// The dev sandbox at /rpg_dev (owner, 2026-10-27; story/roadmap.md 5b): the same server run with SANDBOX=1, its own
// port and its own DB, so the owner and friends can test how the classes FEEL by hand with a quick loop. index.js
// creates this only when SANDBOX is set; without it every {t:'sbx'} message is dropped, the Training Yard has no door
// and no dummy is ever spawned, so none of this reaches the live server.
//
//   → {t:'sbx', a:'char', cls, lvl, skills: 'max'|'keep'|'clear', ap: 'main'|'keep'|'reset', weapon?, helmet?}
//       the instant character swap (saved in the sandbox DB like any change)
//   → {t:'sbx', a:'pots'}                 stock SANDBOX_POTS of each of SANDBOX_POTIONS, the first three on the potion bar
//   → {t:'sbx', a:'dummy', kind: 'one'|'pack'|'spar'|'clear'}   training dummies in the Training Yard
//   → {t:'sbx', a:'dummyhp', share}       every dummy's HP setting (one of DUMMY_HP_SHARES)
//   → {t:'sbx', a:'boss', kind, hp}       into that boss's den, the boss fresh at hp (a share of its max HP: its phase)
//   → {t:'sbx', a:'yard'}                 back to the Training Yard
//   → {t:'sbx', a:'toggle', what: 'god'|'mp'|'nocd', on}
//   → {t:'sbx', a:'meter'}                the DPS readout starts over
//   ← {t:'sbx-state', god, mp, nocd, dummyHp}   on login and on every change
//   ← {t:'sbx-dps', total, ms, rows: [[key, dmg, hits]…]}   your damage since the readout's reset (every mob: dummies,
//       bosses, adds), at most every METER_EVERY_MS while it changes; ms is first hit → last hit; key: a skill id,
//       'attack', 'bolt', 'arrow', '<kind>:<skill>' (a summon's, a field's, a burst's) or 'dot:<burn|bleed|poison>'
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ITEMS, DENS, DEN_EXIT_X, MOBS, isWeapon } from '../src/shared/rpg.js';
import { SKILLS, CLASSES, ACTIVE, HOTBAR, AP_STATS, apTotal, apSpent, cantLearn, cleanSkills, giftsOf, rankOf, skillFor, weaponOk } from '../src/shared/skills.js';
import { placeAt } from '../src/shared/sim.js';
import { ARENA, ARENA_W, ARENA_SPAWN_X, DUMMY_HP_SHARES, DUMMY_MAX, DUMMY_PACK, DUMMY_GAP, METER_EVERY_MS, SANDBOX_MAX_LVL, MAIN_STAT, SANDBOX_POTIONS, SANDBOX_POTS } from '../src/shared/sandbox.js';
import { cleanUser } from './accounts.js';

// the server exits by itself after this long with nobody connected (index.js); systemd's socket starts it again on the
// next visit (deploy/rpg-dev.socket)
export const IDLE_EXIT_MIN = 20;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// rpg: createRpg's object (rpg.sandbox is the way in) · hooks: the object createRpg was given, filled in here ·
// dbPath: the sandbox's own DB · livePath: the live accounts DB, opened read-only to copy a login from (LIVE_DB)
export function createSandbox({ rpg, hooks, players, send, dbPath, livePath }) {
  const sb = rpg.sandbox;
  const db = new DatabaseSync(dbPath);
  let yardHp = 1; // the dummies' HP setting (a share of DUMMY_HP)

  // ——— logins: a friend's account (and, the first time, its character) comes over from the live DB ———
  // Called before every login check: the password hash is copied every time (a password changed on live works here
  // too), the character only when the sandbox has none yet. The live DB is only ever read.
  function syncAccount(user) {
    user = cleanUser(user);
    if (!livePath || !/^[a-z0-9_-]{1,12}$/.test(user) || !existsSync(livePath) || resolve(livePath) === resolve(dbPath)) return;
    let live;
    try {
      live = new DatabaseSync(livePath, { readOnly: true });
      const acc = live.prepare('SELECT user, pass, hue, created_at FROM accounts WHERE user = ?').get(user);
      if (!acc) return;
      db.prepare(`INSERT INTO accounts (user, pass, hue, created_at) VALUES (?, ?, ?, ?)
                  ON CONFLICT(user) DO UPDATE SET pass = excluded.pass`).run(acc.user, acc.pass, acc.hue, acc.created_at);
      if (!db.prepare('SELECT 1 FROM rpg_chars WHERE user = ?').get(user)) {
        const ch = live.prepare('SELECT data FROM rpg_chars WHERE user = ?').get(user);
        if (ch) db.prepare('INSERT INTO rpg_chars (user, data, updated_at) VALUES (?, ?, ?)').run(user, ch.data, Date.now());
      }
    } catch (e) {
      console.error('sandbox: could not copy the login from the live DB', e.message);
    } finally {
      live?.close();
    }
  }

  // ——— per player: the toggles and the DPS readout (kept across a takeover, fresh on a new login) ———
  const freshMeter = () => ({ start: 0, last: 0, total: 0, rows: new Map(), dirty: true });
  function login(p, old) {
    p.sbx = old?.sbx ?? { god: false, mp: false, nocd: false };
    p.sbxMeter = old?.sbxMeter ?? freshMeter();
  }
  const sendState = (p) => send(p.ws, { t: 'sbx-state', ...p.sbx, dummyHp: yardHp });
  function entered(p) {
    sendState(p);
    p.sbxMeter.dirty = true;
  }

  // what made a hit, as the readout's row key (server/rpg.js damage's src)
  const keyOf = (src) => (src?.kind === 'dot' ? `dot:${src.dot}` : src?.skill ? (src.kind && src.kind !== 'ricochet' ? `${src.kind}:${src.skill}` : src.skill) : src?.arrow ? 'arrow' : src?.spell ? 'bolt' : 'attack');
  hooks.onDamage = (m, dmg, id, p, src) => {
    const me = p?.sbxMeter;
    if (!me || !(dmg > 0)) return;
    const t = Date.now();
    if (!me.start) me.start = t;
    me.last = t;
    me.total += dmg;
    const k = keyOf(src), row = me.rows.get(k) ?? [0, 0];
    row[0] += dmg;
    row[1]++;
    me.rows.set(k, row);
    me.dirty = true;
  };
  hooks.god = (p) => !!p.sbx?.god;
  hooks.respawn = () => ({ room: ARENA, x: ARENA_SPAWN_X, name: 'the Training Yard' });

  setInterval(() => {
    for (const p of players.values()) {
      if (!p.joined || !p.rpg || !p.sbxMeter) continue;
      const me = p.sbxMeter;
      if (me.dirty) {
        me.dirty = false;
        const rows = [...me.rows].sort((a, b) => b[1][0] - a[1][0]).slice(0, 10).map(([k, [d, n]]) => [k, d, n]);
        send(p.ws, { t: 'sbx-dps', total: me.total, ms: me.last - me.start, rows });
      }
      // Full MP: topped up between casts too (beforeCast does it before each one)
      if (p.sbx?.mp && !p.faintUntil && p.rpg.mp < sb.stats(p).maxMp) {
        p.rpg.mp = sb.stats(p).maxMp;
        sb.sendMe(p);
      }
    }
  }, METER_EVERY_MS).unref();

  // a skill is about to be cast (index.js runActions): no cooldowns, full MP, if those are on
  function beforeCast(p) {
    if (p.sbx?.nocd) p.cds = {};
    if (p.sbx?.mp) p.rpg.mp = sb.stats(p).maxMp;
  }

  // ——— the instant character swap ———
  // every skill the class can hold at this level, a point at a time, the earliest advancement first, while points last
  function maxSkills(c) {
    const ch = { ...c, skills: giftsOf(c.skills) };
    const ids = Object.entries(SKILLS).filter(([id, sk]) => !sk.gift && skillFor(c.cls, id) && c.lvl >= sk.adv).sort((a, b) => a[1].adv - b[1].adv);
    for (const [id] of ids) while (!cantLearn(ch, id)) ch.skills = { ...ch.skills, [id]: rankOf(ch.skills, id) + 1 };
    return ch.skills;
  }
  function char(id, p, m) {
    const c = p.rpg;
    if (p.faintUntil) return sb.toast(p, 'Wake up first');
    const cls = CLASSES[m.cls] ? m.cls : c.cls;
    const lvl = clamp(Math.floor(Number(m.lvl) || c.lvl), 1, SANDBOX_MAX_LVL);
    Object.assign(c, { cls, lvl, exp: 0 });
    if (cls !== 'novice') c.reborn = Math.max(1, c.reborn); // (as if chosen at the pool)
    // gear: any item, whatever the level (gear has none); a weapon the class can't hold becomes its starter
    if (m.weapon !== undefined && (m.weapon === null || (isWeapon(m.weapon) && weaponOk(cls, m.weapon)))) {
      c.gear.weapon = m.weapon;
      c.gearE.weapon = null;
    }
    if (c.gear.weapon && !weaponOk(cls, c.gear.weapon)) {
      c.gear.weapon = CLASSES[cls].starter ?? null;
      c.gearE.weapon = null;
    }
    if (m.helmet !== undefined && (m.helmet === null || ITEMS[m.helmet]?.kind === 'helmet')) {
      c.gear.helmet = m.helmet;
      c.gearE.helmet = null;
    }
    // skills: all of them (as far as the level's points go), what still fits, or none (to spend by hand in K)
    c.skills = m.skills === 'max' ? maxSkills(c) : m.skills === 'clear' ? giftsOf(c.skills) : { ...giftsOf(c.skills), ...cleanSkills(c) };
    // ability points: every one into the class's main stat, kept (if they still add up) or all back
    const zero = Object.fromEntries(AP_STATS.map(({ id: k }) => [k, 0]));
    if (m.ap === 'main') c.ap = { ...zero, [MAIN_STAT[cls] ?? 'str']: apTotal(lvl) };
    else if (m.ap === 'reset' || apSpent(c.ap) > apTotal(lvl)) c.ap = zero;
    // the skill hotbars keep what's still learned; maxed with an empty bar, the newest skills go on it
    const fits = (s) => (s && ACTIVE(s) && skillFor(cls, s) && rankOf(c.skills, s) ? s : null);
    c.hotbar = c.hotbar.map(fits);
    c.alt.hotbar = c.alt.hotbar.map(fits);
    if (m.skills === 'max' && !c.hotbar.some(Boolean)) {
      const newest = Object.keys(c.skills).filter((s) => ACTIVE(s) && !SKILLS[s].gift).sort((a, b) => SKILLS[b].adv - SKILLS[a].adv).slice(0, HOTBAR);
      c.hotbar = Array.from({ length: HOTBAR }, (_, i) => newest[i] ?? null);
    }
    sb.refresh(id, p);
    rpg.save(p);
    sb.toast(p, `Lv ${lvl} ${CLASSES[cls].name}: ready`);
  }

  function pots(p) {
    const c = p.rpg;
    for (const id of SANDBOX_POTIONS) {
      if (!ITEMS[id]) continue;
      const b = c.bag.find((x) => x.id === id);
      if (b) b.n = SANDBOX_POTS;
      else if (!sb.addToBag(c, id, SANDBOX_POTS)) return sb.toast(p, 'Your bag is full: make room first (I)');
    }
    c.potbar = c.potbar.map((_, i) => SANDBOX_POTIONS[i] ?? null);
    sb.sendMe(p);
  }

  // ——— the Training Yard's dummies ———
  const dummiesHere = () => sb.mobs().filter((q) => q.room === ARENA && !q.gone && MOBS[q.kind].dummy);
  function dummy(p, kind) {
    if (p.state.room !== ARENA) return sb.toast(p, 'Dummies stand in the Training Yard (Back to the yard)');
    if (kind === 'clear') {
      for (const q of dummiesHere()) q.gone = true;
      return;
    }
    const n = kind === 'pack' ? DUMMY_PACK : 1;
    if (dummiesHere().length + n > DUMMY_MAX) return sb.toast(p, `That's ${DUMMY_MAX} dummies at most: clear some first`);
    const dir = p.state.x < ARENA_W / 2 ? 1 : -1; // (in front of you, toward the middle of the yard)
    for (let i = 0; i < n; i++) {
      const x = clamp(Math.round(p.state.x + dir * (200 + i * DUMMY_GAP)), 80, ARENA_W - 80);
      const q = sb.addMob(kind === 'spar' ? 'dummy_spar' : 'dummy', ARENA, x);
      q.dummyHp = yardHp;
      q.hp = Math.max(1, Math.round(q.maxHp * yardHp));
      q.dir = -dir;
    }
  }
  function dummyHp(share) {
    if (!DUMMY_HP_SHARES.includes(share)) return;
    yardHp = share;
    for (const q of dummiesHere()) {
      q.dummyHp = share;
      q.hp = Math.max(1, Math.round(q.maxHp * share));
    }
    for (const q of players.values()) if (q.joined && q.sbx) sendState(q);
  }

  // ——— bosses on demand: its den, the boss started fresh at the HP share that picks its phase ———
  function boss(p, m) {
    const d = DENS.find((x) => x.boss === m.kind), b = d && sb.mobs().find((q) => q.den === d);
    if (!b) return;
    if (p.faintUntil) return sb.toast(p, 'Wake up first');
    sb.resetBoss(b);
    b.hp = Math.max(1, Math.round(b.maxHp * clamp(Number(m.hp) || 1, 0.01, 1)));
    placeAt(p.state, d.room, DEN_EXIT_X + 160);
  }

  function receive(id, p, m) {
    if (!p.rpg || !p.sbx) return;
    if (m.a === 'char') char(id, p, m);
    else if (m.a === 'pots') pots(p);
    else if (m.a === 'dummy') dummy(p, m.kind);
    else if (m.a === 'dummyhp') dummyHp(Number(m.share));
    else if (m.a === 'boss') boss(p, m);
    else if (m.a === 'yard') {
      if (p.faintUntil) return sb.toast(p, 'Wake up first');
      placeAt(p.state, ARENA, ARENA_SPAWN_X);
    } else if (m.a === 'toggle' && ['god', 'mp', 'nocd'].includes(m.what)) {
      p.sbx[m.what] = !!m.on;
      if (m.what === 'nocd' && m.on) p.cds = {};
      sendState(p);
    } else if (m.a === 'meter') {
      p.sbxMeter = freshMeter();
    }
  }

  return { syncAccount, login, entered, beforeCast, receive };
}
