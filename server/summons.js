// Docs: docs/combat/skills.md
// The Cleric's summons (S3, story/progression.md 5), run here like mobs: the Jelly Spirit and the Seraph
// chase mobs, hit them and draw them off the slimes; the Lantern Wisp floats by a hurt friend and heals
// around it; the Guardian Totem stands where it was planted and cuts the damage friends near it take. Every
// rule and number is in src/shared/skills.js (SPIRIT_SEEK and the constants after it). Clients only draw them
// (src/summons.js) from {t:'summons'} snapshots. A summon is also a mob target: it carries the same
// fields a player does (state.x / y / room / facing, joined, faintUntil), so the mob and boss code that
// chases and aims at m.target needs no change.
import { MOBS } from '../src/shared/rpg.js';
import { SKILLS, SPIRIT_SEEK, SPIRIT_SPEED, SPIRIT_HIT_S, SPIRIT_TAUNT, SERAPH_TAUNT, SERAPH_R, SUMMON_TOUCH, SUMMON_HURT_S, BOSS_SUMMON_REACH, BOSS_SUMMON_HIT, BOSS_SUMMON_S, ULT_SUMMON, WISP_R, WISP_TICK, MAX_ROLL, spiritCap, summonHp, summonHit } from '../src/shared/skills.js';

export const SUMMON_WHATS = ['spirit', 'wisp', 'totem', 'seraph']; // over the wire as an index
const rand = (a, b) => a + Math.random() * (b - a);

// ctx: { players, mobs (the live array), toRoom, stats(p), damage(m, dmg, crit, id, p, dir, knock), heal(id, p, qid, q, amt, at) }
export function createSummons({ players, mobs, toRoom, stats, damage, heal }) {
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
    // Call one: p (player id) cast skill `id` at `rank`. Replaces the oldest of its kind past the cap.
    add(id, p, skill, rank) {
      const sk = SKILLS[skill], st = stats(p), t = now(), what = sk.what, s0 = p.state;
      const mine = list.filter((q) => q.owner === id && q.what === what);
      const cap = what === 'spirit' ? spiritCap(p.rpg.skills) : 1;
      while (mine.length >= cap) remove(mine.shift(), 'faded');
      const hp = what === 'wisp' ? 1 : summonHp(skill, rank, st);
      const s = {
        id: nextId++, what, skill, owner: id, room: s0.room, x: s0.x + (what === 'totem' ? 0 : (s0.facing < 0 ? -1 : 1) * 36), y: s0.y,
        dir: s0.facing < 0 ? -1 : 1, hp, maxHp: hp, until: t + sk.dur * 1000, hitAt: t + 400, tauntAt: t, touchAt: 0, bossAt: new Map(),
        hit: summonHit(skill, rank, st), crit: st.crit, critMult: st.critMult, minRoll: st.minRoll, def: Math.round(st.def * 0.5),
        heal: what === 'wisp' ? Math.round(st.magic * sk.power(rank) * st.heal) : 0, cut: sk.cut?.(rank) ?? 0, r: sk.radius ?? 0,
        // what the mob code sees when it's after this summon
        summon: true, joined: true, faintUntil: 0, name: SKILLS[skill].name, state: { room: s0.room, x: 0, y: 0, facing: 1 },
        target: null, follow: null,
      };
      if (what === 'wisp') s.y -= 64;
      sync(s);
      list.push(s);
      return s;
    },

    // The best Guardian Totem cut for a slime at q (0: none)
    cutAt(q) {
      let cut = 0;
      for (const s of list) if (s.what === 'totem' && s.room === q.state.room && Math.abs(q.state.x - s.x) < s.r && Math.abs(q.state.y - s.y) < 120) cut = Math.max(cut, s.cut);
      return cut;
    },

    // A boss's ultimate went off in room: every spirit and totem there takes ULT_SUMMON of its max HP
    ult(room) {
      for (const s of [...list]) if (s.room === room && s.what !== 'wisp') hurt(s, s.maxHp * ULT_SUMMON);
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
        else if (s.what === 'totem') hurtBy(s, t);
        else {
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
      // the mob going after its Cleric first, else the nearest
      let best = null, bestD = SPIRIT_SEEK;
      for (const q of alive(s.room)) {
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
    s.hitAt = t + SPIRIT_HIT_S * 1000;
    const out = [];
    for (const q of struck) {
      const crit = Math.random() < s.crit;
      const dmg = Math.max(1, Math.round(s.hit * rand(s.minRoll, MAX_ROLL) * (crit ? s.critMult : 1)));
      out.push(damage(q, dmg, crit, s.owner, p, Math.sign(q.x - s.x) || s.dir, 60));
      if (!q.dead) {
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
