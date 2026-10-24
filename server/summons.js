// Docs: docs/combat/skills.md
// The Cleric's summons (S3, story/progression.md 5), run here like mobs: the Jelly Spirit and the Seraph
// chase mobs, hit them and draw them off the slimes; the Lantern Wisp floats by a hurt friend and heals
// around it; the Guardian Totem stands where it was planted and cuts the damage friends near it take. Every
// rule and number is in src/shared/skills.js (SPIRIT_SEEK and the constants after it). Clients only draw them
// (src/summons.js) from {t:'summons'} snapshots. A summon is also a mob target: it carries the same
// fields a player does (state.x / y / room / facing, joined, faintUntil), so the mob and boss code that
// chases and aims at m.target needs no change. The Archer's Net Trap (S4) lives here too: planted where it was
// set, never a target, it catches the first mob that walks into it (NET_R and the constants after it). SP1 added the
// skill pool's kinds (skills.js SUMMON_KINDS): the phoenix and the hawk (fliers that dive at mobs, never hurt), sprites
// (several little spirits, each after a different mob), the stone guardian (walks, taunts, slams) and the blast trap
// (a net that explodes).
import { MOBS } from '../src/shared/rpg.js';
import { SKILLS, SPIRIT_SEEK, SPIRIT_SPEED, SPIRIT_HIT_S, SPIRIT_TAUNT, SERAPH_TAUNT, SERAPH_R, SUMMON_TOUCH, SUMMON_HURT_S, BOSS_SUMMON_REACH, BOSS_SUMMON_HIT, BOSS_SUMMON_S, ULT_SUMMON, WISP_R, WISP_TICK, MAX_ROLL, summonHp, summonHit, NET_R, NET_BURST_R, rankOf, SUMMON_KINDS, summonCap, PHOENIX_SEEK, GUARDIAN_TAUNT_S, GUARDIAN_SPEED, HAWK_RANGE } from '../src/shared/skills.js';

export const SUMMON_WHATS = ['spirit', 'wisp', 'totem', 'seraph', 'net', 'phoenix', 'sprite', 'guardian', 'hawk', 'blast']; // over the wire as an index
const DIVE_MS = 320; // a phoenix's or hawk's dive, there (and as long back)
const rand = (a, b) => a + Math.random() * (b - a);

// ctx: { players, mobs (the live array), toRoom, stats(p), damage(m, dmg, crit, id, p, dir, knock, src), heal(id, p, qid, q, amt, at),
// element(m, el, dmg, id) (the Mage's combos: a phoenix's fire burns) }
export function createSummons({ players, mobs, toRoom, stats, damage, heal, element }) {
  const list = [];
  let nextId = 1;
  const now = () => Date.now();
  const big = (k) => k.boss || k.field;
  const alive = (room) => mobs.filter((m) => !m.dead && !m.gone && m.room === room && !(m.special && !m.egg));
  const gone = new Set(); // rooms whose last summon just went (one empty snapshot)

  function remove(s, how) {
    const i = list.indexOf(s);
    if (i < 0) return;
    list.splice(i, 1);
    s.joined = false; // (mobs after it give up: server/rpg.js stepMob)
    for (const m of mobs) if (m.target === s) m.target = null;
    toRoom(s.room)({ t: 'sumgone', id: s.id, how, x: Math.round(s.x), y: Math.round(s.y) });
    if (!list.some((q) => q.room === s.room)) gone.add(s.room);
  }
  const sync = (s) => Object.assign(s.state, { x: s.x, y: s.y, facing: s.dir });

  return {
    list,
    // Call one (sprites: `count` of them): p (player id) cast skill `id` at `rank`. Replaces the oldest of its kind past
    // the cap (summonCap). → the (first) new summon
    add(id, p, skill, rank) {
      const sk = SKILLS[skill], st = stats(p), t = now(), what = sk.what, s0 = p.state, kind = SUMMON_KINDS[what] ?? {};
      const mine = list.filter((q) => q.owner === id && q.what === what);
      const cap = summonCap(sk, p.rpg.skills), n = Math.min(cap, what === 'sprite' ? sk.count ?? 1 : 1);
      while (mine.length && mine.length + n > cap) remove(mine.shift(), 'faded');
      const hp = kind.hurt ? summonHp(skill, rank, st) : 1, dir = s0.facing < 0 ? -1 : 1;
      let first = null;
      for (let i = 0; i < n; i++) {
        const s = {
          id: nextId++, what, skill, owner: id, room: s0.room, x: s0.x + (kind.planted ? 0 : dir * (36 + i * 18)), y: s0.y,
          dir, hp, maxHp: hp, until: t + sk.dur * 1000, hitAt: t + 400 + i * 150, tauntAt: t, touchAt: 0, bossAt: new Map(),
          hit: summonHit(skill, rank, st), crit: st.crit, critMult: st.critMult, minRoll: st.minRoll, def: Math.round(st.def * 0.5),
          heal: what === 'wisp' ? Math.round(st.magic * sk.power(rank) * st.heal) : 0, cut: sk.cut?.(rank) ?? 0, r: sk.radius ?? 0,
          every: (sk.every ?? SPIRIT_HIT_S) * 1000, el: sk.el ?? null, // (SP1's kinds: how often it hits, its element)
          // what the mob code sees when it's after this summon (never a flier or a trap: SP1)
          summon: true, joined: !kind.fly && !kind.planted || what === 'totem', faintUntil: 0, name: SKILLS[skill].name, state: { room: s0.room, x: 0, y: 0, facing: 1 },
          target: null, follow: null, dive: null, phase: Math.random() * 6.3,
        };
        if (what === 'net') { // (S4) how long a catch holds, how many it takes, and Trap Mastery's burst
          const tm = rankOf(p.rpg.skills, 'trap_mastery');
          Object.assign(s, { snare: sk.snare(rank), left: 1 + tm, burst: tm ? st.atk * SKILLS.trap_mastery.burst(tm) : 0, hitAt: t + 300 });
        }
        if (what === 'blast') Object.assign(s, { left: 1, hitAt: t + 300 }); // (SP1: it goes off once)
        if (what === 'wisp') s.y -= 64;
        if (kind.fly) s.y -= 80;
        sync(s);
        list.push(s);
        first ??= s;
      }
      return first;
    },

    // The best Guardian Totem cut for a slime at q (0: none)
    cutAt(q) {
      let cut = 0;
      for (const s of list) if (s.what === 'totem' && s.room === q.state.room && Math.abs(q.state.x - s.x) < s.r && Math.abs(q.state.y - s.y) < 120) cut = Math.max(cut, s.cut);
      return cut;
    },

    // A boss's ultimate went off in room: every spirit and totem there takes ULT_SUMMON of its max HP
    ult(room) {
      for (const s of [...list]) if (s.room === room && SUMMON_KINDS[s.what]?.hurt) hurt(s, s.maxHp * ULT_SUMMON);
    },

    // Every summon of player id goes (it left, fainted out of the room, changed class)
    clear(id) {
      for (const s of [...list]) if (s.owner === id) remove(s, 'faded');
    },

    // Every tick: move, hit, heal, get hurt, fade. → nothing (messages go out as they happen)
    tick(dt, tick) {
      const t = now(), hits = new Map(); // room → [summonId, hits]
      for (const s of [...list]) {
        const p = players.get(s.owner);
        if (!p?.joined || !p.rpg || p.state.room !== s.room) { remove(s, 'faded'); continue; }
        if (t >= s.until) { remove(s, 'faded'); continue; }
        if (s.what === 'wisp') wisp(s, p, t, dt);
        else if (s.what === 'net' || s.what === 'blast') net(s, p, t, hits);
        else if (s.what === 'totem') hurtBy(s, t);
        else if (s.what === 'phoenix' || s.what === 'hawk') flier(s, p, t, dt, hits);
        else if (s.what === 'guardian') {
          guardian(s, p, t, dt, hits);
          if (list.includes(s)) hurtBy(s, t);
        } else {
          spirit(s, p, t, dt, hits);
          if (list.includes(s)) hurtBy(s, t);
        }
        sync(s);
      }
      for (const [room, h] of hits) toRoom(room)({ t: 'sumhit', h });
      // ~20 Hz: [id, what, owner, x, y, hp, maxHp, dir] for every room with summons (an empty one when the last goes)
      if (tick % 3 === 0) {
        const rooms = new Map();
        for (const s of list) {
          if (!rooms.has(s.room)) rooms.set(s.room, []);
          rooms.get(s.room).push([s.id, SUMMON_WHATS.indexOf(s.what), s.owner, Math.round(s.x), Math.round(s.y), Math.max(0, Math.ceil(s.hp)), s.maxHp, s.dir]);
        }
        for (const room of gone) if (!rooms.has(room)) rooms.set(room, []);
        gone.clear();
        for (const [room, s] of rooms) toRoom(room)({ t: 'summons', s });
      }
    },
  };

  // ——— spirits and the Seraph: chase the nearest mob, hit it, draw it ———
  function spirit(s, p, t, dt, hits) {
    const seraph = s.what === 'seraph';
    let m = s.target;
    if (m && (m.dead || m.gone || m.room !== s.room || (m.special && !m.egg) || Math.abs(m.x - s.x) > SPIRIT_SEEK * 1.3)) m = s.target = null;
    if (!m) {
      // the mob going after its Cleric first, else the nearest (a sprite: one its siblings aren't after, SP1)
      const taken = s.what === 'sprite' ? new Set(list.filter((o) => o !== s && o.owner === s.owner && o.what === 'sprite').map((o) => o.target)) : null;
      let best = null, bestD = SPIRIT_SEEK;
      for (const q of alive(s.room)) {
        if (taken?.has(q)) continue;
        const d = Math.abs(q.x - s.x) - (q.target === p ? 200 : 0);
        if (d < bestD) [best, bestD] = [q, d];
      }
      m = s.target = best;
    }
    // where to go: next to the mob, or back by the Cleric's side
    const k = m && MOBS[m.kind];
    const gx = m ? m.x - Math.sign(m.x - s.x || 1) * (k.w / 2 + 14) : p.state.x - (p.state.facing < 0 ? -1 : 1) * 46;
    const gy = m ? m.y : p.state.y;
    const dx = gx - s.x, step = SPIRIT_SPEED * (seraph ? 0.8 : 1) * dt;
    s.x += Math.abs(dx) < step ? dx : Math.sign(dx) * step;
    s.y += (gy - s.y) * Math.min(1, dt * 5);
    if (m) s.dir = Math.sign(m.x - s.x) || s.dir;
    else if (Math.abs(dx) > 4) s.dir = Math.sign(dx);
    // draw them: a mob (or boss) after a slime near it comes after this instead
    if (t >= s.tauntAt) {
      s.tauntAt = t + 1000;
      const R = seraph ? SERAPH_TAUNT : SPIRIT_TAUNT;
      for (const q of alive(s.room)) {
        if (Math.abs(q.x - s.x) > R + MOBS[q.kind].w / 2 || Math.abs(q.y - s.y) > R) continue;
        if (q.focus || q.tauntUntil > t) continue; // (S5: a boss's focus and a Knight's taunt hold its eye)
        if (seraph ? q.target !== s : q.target && !q.target.summon) { // (the Seraph: every mob, busy or not)
          q.target = s;
          q.targetUntil = t + 5000;
        }
      }
    }
    if (t < s.hitAt) return;
    const inReach = (q) => {
      const kq = MOBS[q.kind];
      return seraph ? Math.abs(q.x - s.x) < SERAPH_R + kq.w / 2 && Math.abs(q.y - kq.h / 2 - (s.y - 30)) < SERAPH_R + kq.h / 2
        : Math.abs(q.x - s.x) < kq.w / 2 + 34 && Math.abs(q.y - s.y) < kq.h + 40;
    };
    const struck = seraph ? alive(s.room).filter(inReach) : m && inReach(m) ? [m] : [];
    if (!struck.length) return;
    s.hitAt = t + s.every;
    const out = [];
    for (const q of struck) {
      const crit = Math.random() < s.crit;
      const dmg = Math.max(1, Math.round(s.hit * rand(s.minRoll, MAX_ROLL) * (crit ? s.critMult : 1)));
      out.push(damage(q, dmg, crit, s.owner, p, Math.sign(q.x - s.x) || s.dir, 60, { kind: 'summon', skill: s.skill }));
      if (!q.dead && !q.focus && !(q.tauntUntil > t)) {
        q.target = s; // (damage() pointed it at the Cleric: the spirit is what it saw)
        q.targetUntil = t + 5000;
      }
    }
    if (!hits.has(s.room)) hits.set(s.room, []);
    hits.get(s.room).push([s.id, out]);
  }

  // ——— the Lantern Wisp: by the friend near its Cleric who's hurt worst, healing everyone round it ———
  function wisp(s, p, t, dt) {
    if (t >= s.hitAt) {
      s.hitAt = t + WISP_TICK * 1000;
      // pick who to float by (every tick), then heal round where it is
      let best = p, worst = p.rpg.hp / stats(p).maxHp;
      for (const [, q] of players) {
        if (!q.joined || !q.rpg || q === p || q.faintUntil || q.state.room !== s.room || Math.abs(q.state.x - p.state.x) > 400) continue;
        const f = q.rpg.hp / stats(q).maxHp;
        if (f < worst) [best, worst] = [q, f];
      }
      s.follow = best;
      for (const [qid, q] of players) {
        if (!q.joined || !q.rpg || q.faintUntil || q.state.room !== s.room) continue;
        if (Math.hypot(q.state.x - s.x, q.state.y - 30 - s.y) < WISP_R + 40) heal(s.owner, p, qid, q, s.heal, 'wisp');
      }
    }
    const f = s.follow?.joined && s.follow.state.room === s.room ? s.follow : p;
    const gx = f.state.x - (f.state.facing < 0 ? -1 : 1) * 30, gy = f.state.y - 64 + Math.sin(t / 300) * 4;
    s.x += (gx - s.x) * Math.min(1, dt * 4);
    s.y += (gy - s.y) * Math.min(1, dt * 4);
    s.dir = Math.sign(gx - s.x) || s.dir;
  }

  // ——— the Net Trap (Archer, S4): on the ground where it was set; the first mob (on the ground) that walks into
  // it is caught: snareUntil (server/rpg.js stepMob: an ordinary mob stops dead and can't hurt anyone, a boss
  // is only slowed, for half as long). Trap Mastery: more catches, each bursting round the caught mob. ———
  // SP1's blast trap is one too: what walks in sets it off (boom) instead of being caught.
  function net(s, p, t, hits) {
    if (t < s.hitAt) return; // (a moment to set it down)
    if (s.what === 'blast') return blast(s, p, t, hits);
    const caught = [], out = [];
    for (const m of alive(s.room)) {
      const k = MOBS[m.kind];
      if (s.left <= 0) break;
      if (m.snareUntil > t || k.fly || Math.abs(m.x - s.x) > NET_R + k.w / 2 || Math.abs(m.y - s.y) > 40) continue;
      m.snareUntil = t + s.snare * 1000 * (big(k) ? 0.5 : 1);
      if (!big(k)) m.vx = 0;
      s.left--;
      caught.push(m.id);
      if (!s.burst) continue;
      for (const q of alive(s.room)) {
        if (Math.abs(q.x - m.x) > NET_BURST_R + MOBS[q.kind].w / 2 || Math.abs(q.y - m.y) > NET_BURST_R) continue;
        const crit = Math.random() < s.crit;
        out.push(damage(q, Math.max(1, Math.round(s.burst * rand(s.minRoll, MAX_ROLL) * (crit ? s.critMult : 1))), crit, s.owner, p, Math.sign(q.x - m.x) || 1, 120, { kind: 'summon', skill: s.skill }));
      }
    }
    if (!caught.length) return;
    toRoom(s.room)({ t: 'netcatch', id: s.id, m: caught, x: Math.round(s.x), y: Math.round(s.y) });
    if (out.length) {
      if (!hits.has(s.room)) hits.set(s.room, []);
      hits.get(s.room).push([s.id, out]);
    }
    if (s.left <= 0) remove(s, 'sprung');
  }

  // ——— SP1: the blast trap. The first mob on the ground within NET_R sets it off: s.hit on everything within its radius ———
  function blast(s, p, t, hits) {
    const near = (m, R) => Math.abs(m.x - s.x) < R + MOBS[m.kind].w / 2 && Math.abs(m.y - s.y) < Math.max(40, R * 0.6);
    if (!alive(s.room).some((m) => !MOBS[m.kind].fly && near(m, NET_R))) return;
    const out = [];
    for (const q of alive(s.room)) {
      if (!near(q, s.r)) continue;
      const crit = Math.random() < s.crit;
      out.push(damage(q, Math.max(1, Math.round(s.hit * rand(s.minRoll, MAX_ROLL) * (crit ? s.critMult : 1))), crit, s.owner, p, Math.sign(q.x - s.x) || 1, 260, { kind: 'summon', skill: s.skill }));
    }
    if (!hits.has(s.room)) hits.set(s.room, []);
    hits.get(s.room).push([s.id, out]);
    remove(s, 'boom');
  }

  // ——— SP1: the phoenix and the hawk. They circle over their caster; every `every` ms one dives at a mob (the phoenix:
  // the nearest within PHOENIX_SEEK of its caster; the hawk: what its caster last hit, else the nearest ahead within
  // HAWK_RANGE), hits it as it gets there and flies back. Nothing can hit them. ———
  function flier(s, p, t, dt, hits) {
    const hawk = s.what === 'hawk', ps = p.state;
    if (s.dive) {
      const d = s.dive, f = (t - d.at) / DIVE_MS;
      const m = d.m, mx = m.dead ? d.tx : m.x, my = m.dead ? d.ty : m.y - MOBS[m.kind].h / 2;
      if (!d.hit && f >= 1) {
        d.hit = true;
        if (!m.dead && !m.gone && m.room === s.room) {
          const crit = Math.random() < s.crit, dmg = Math.max(1, Math.round(s.hit * rand(s.minRoll, MAX_ROLL) * (crit ? s.critMult : 1)));
          if (!hits.has(s.room)) hits.set(s.room, []);
          hits.get(s.room).push([s.id, [damage(m, dmg, crit, s.owner, p, Math.sign(m.x - s.x) || s.dir, 80, { kind: 'summon', skill: s.skill })]]);
          if (s.el && !m.dead) element(m, s.el, dmg, s.owner);
        }
        d.tx = mx;
        d.ty = my;
      }
      if (f < 1) {
        s.x = d.x0 + (mx - d.x0) * f;
        s.y = d.y0 + (my - d.y0) * f;
        s.dir = Math.sign(mx - d.x0) || s.dir;
        return;
      }
      if (f >= 2) s.dive = null;
    }
    // circling over the caster (and gliding back there after a dive)
    s.phase += dt * (hawk ? 1.6 : 2.2);
    const gx = ps.x + Math.cos(s.phase) * (hawk ? 50 : 70), gy = ps.y - (hawk ? 110 : 90) + Math.sin(s.phase * 2) * 14;
    const k = Math.min(1, dt * (s.dive ? 6 : 4));
    if (Math.abs(gx - s.x) > 2) s.dir = Math.sign(gx - s.x);
    s.x += (gx - s.x) * k;
    s.y += (gy - s.y) * k;
    if (s.dive || t < s.hitAt) return;
    let m = null;
    if (hawk) {
      const last = p.lastHit?.m;
      if (last && !last.dead && !last.gone && last.room === s.room && t - p.lastHit.at < 6000 && Math.abs(last.x - ps.x) < HAWK_RANGE) m = last;
      else {
        const dir = ps.facing < 0 ? -1 : 1;
        m = alive(s.room).filter((q) => (q.x - ps.x) * dir > -20 && Math.abs(q.x - ps.x) < HAWK_RANGE && Math.abs(q.y - ps.y) < 160).sort((a, b) => Math.abs(a.x - ps.x) - Math.abs(b.x - ps.x))[0] ?? null;
      }
    } else m = alive(s.room).filter((q) => Math.abs(q.x - ps.x) < PHOENIX_SEEK && Math.abs(q.y - ps.y) < 220).sort((a, b) => Math.abs(a.x - ps.x) - Math.abs(b.x - ps.x))[0] ?? null;
    if (!m) return;
    s.hitAt = t + s.every;
    s.dive = { m, at: t, x0: s.x, y0: s.y, hit: false };
  }

  // ——— SP1: the stone guardian. Walks to the mob in front of its caster (the one after its caster first), taunts every
  // mob within its radius every GUARDIAN_TAUNT_S (bosses too, unless a focus or a Knight's taunt holds them) and slams
  // the mobs in front of it every `every` ms. ———
  function guardian(s, p, t, dt, hits) {
    const ps = p.state;
    let m = s.target;
    if (m && (m.dead || m.gone || m.room !== s.room || (m.special && !m.egg) || Math.abs(m.x - s.x) > SPIRIT_SEEK)) m = s.target = null;
    if (!m) {
      let best = null, bestD = SPIRIT_SEEK;
      for (const q of alive(s.room)) {
        if (MOBS[q.kind].fly) continue;
        const d = Math.abs(q.x - ps.x) - (q.target === p ? 200 : 0);
        if (d < bestD && Math.abs(q.y - ps.y) < 160) [best, bestD] = [q, d];
      }
      m = s.target = best;
    }
    const k = m && MOBS[m.kind];
    const gx = m ? m.x - Math.sign(m.x - s.x || 1) * (k.w / 2 + 22) : ps.x - (ps.facing < 0 ? -1 : 1) * 50;
    const dx = gx - s.x, step = GUARDIAN_SPEED * dt;
    s.x += Math.abs(dx) < step ? dx : Math.sign(dx) * step;
    s.y += ((m ? m.y : ps.y) - s.y) * Math.min(1, dt * 8);
    if (m) s.dir = Math.sign(m.x - s.x) || s.dir;
    else if (Math.abs(dx) > 4) s.dir = Math.sign(dx);
    if (t >= s.tauntAt) {
      s.tauntAt = t + GUARDIAN_TAUNT_S * 1000;
      for (const q of alive(s.room)) {
        if (Math.abs(q.x - s.x) > s.r + MOBS[q.kind].w / 2 || Math.abs(q.y - s.y) > s.r || q.focus || q.tauntUntil > t) continue;
        q.target = s;
        q.targetUntil = t + GUARDIAN_TAUNT_S * 1000 + 500;
      }
    }
    if (t < s.hitAt || !m || Math.abs(m.x - s.x) > k.w / 2 + 40) return;
    s.hitAt = t + s.every;
    const out = [];
    for (const q of alive(s.room)) {
      const kq = MOBS[q.kind];
      if (Math.abs(q.x - (s.x + s.dir * 30)) > kq.w / 2 + 50 || Math.abs(q.y - s.y) > kq.h + 30) continue;
      const crit = Math.random() < s.crit;
      out.push(damage(q, Math.max(1, Math.round(s.hit * rand(s.minRoll, MAX_ROLL) * (crit ? s.critMult : 1))), crit, s.owner, p, s.dir, 220, { kind: 'summon', skill: s.skill }));
    }
    if (!out.length) return;
    if (!hits.has(s.room)) hits.set(s.room, []);
    hits.get(s.room).push([s.id, out]);
  }

  // ——— spirits and totems get worn down: touched by mobs, hit by bosses nearby ———
  function hurtBy(s, t) {
    for (const m of alive(s.room)) {
      const k = MOBS[m.kind];
      if (m.frozenUntil > t && !big(k)) continue; // (frozen solid: harmless)
      const dx = Math.abs(m.x - s.x), dy = Math.abs(m.y - s.y);
      if (big(k)) {
        if (dx > k.w / 2 + BOSS_SUMMON_REACH || dy > 220 || (s.bossAt.get(m.id) ?? 0) > t) continue;
        s.bossAt.set(m.id, t + BOSS_SUMMON_S * 1000);
        hurt(s, k.atk * BOSS_SUMMON_HIT);
      } else if (dx < k.w / 2 + 16 && dy < k.h + 10 && t >= s.touchAt) {
        s.touchAt = t + SUMMON_HURT_S * 1000;
        hurt(s, k.atk * SUMMON_TOUCH);
      }
      if (!list.includes(s)) return;
    }
  }
  function hurt(s, raw) {
    const dmg = Math.max(1, Math.round(raw * rand(0.85, 1.15) - s.def));
    s.hp -= dmg;
    toRoom(s.room)({ t: 'sumhurt', id: s.id, dmg });
    if (s.hp <= 0) remove(s, 'broke');
  }
}
