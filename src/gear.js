// Docs: docs/combat/items.md
// Boss gear's unique effects on the client (src/shared/gearfx.js holds the numbers), and the Skirmisher's air shots
// (docs/combat/skills.md). The extra hits are decided here like any other hit (rolled, shown at once) and sent as
// {t:'gearHit', kind, s, hits}; the server caps each kind (server/rpg.js gearHit). The movement effects aren't here:
// they're in the physics (sim.js step, `gx`).
import { MOBS, BOW_SHOT_MULT, BOW_SHOT_SPEED, isCombat } from './shared/rpg.js';
import { SKILLS, rankOf } from './shared/skills.js';
import {
  fxOf, GX, HYDRA_HIT, HEARTH_EVERY, ERUPT_R, ERUPT_MULT, EXPLODE_R, EXPLODE_MULT, GROUND_S, GROUND_W, GROUND_MULT, GROUND_EVERY,
  DASH_SLASH_MULT, NOVA_R, NOVA_MULT, VOLLEY, ROOTED_S, ROOTED_DMG, OATH_BONUS, PISTON_RANGE, PISTON_MULT, PISTON_PIERCE, PISTON_FREE,
  TRAIL_EVERY, TRAIL_S, TRAIL_W, TRAIL_MULT, STOMP_VY, STOMP_R, STOMP_MULT, RUSH_S, SHATTERER,
} from './shared/gearfx.js';
import { audio } from './audio.js';
import { bowTint } from './bow-art.js';

export class Gear {
  constructor(rpg) {
    this.g = rpg;
    this.reset();
  }
  reset() {
    this.hitBefore = new Set(); // mobs we've hit (First Blood)
    this.swings = 0; // normal hits landed (Typhon's sword: every HEARTH_EVERY-th erupts)
    this.casts = 0; // spells cast (the Colossus's staff: every PISTON_FREE-th is free; the server counts the same)
    this.oath = false; // Sigrun's weapons: a hit was blocked, our next hit does OATH_BONUS×
    this.grounds = []; // burning ground (Typhon's staff): { x, y, until }
    this.trail = []; // the fire trail (Typhon's mask): { x, y, until }
    this.tickAt = 0;
    this.trailAt = 0;
    this.rushUntil = 0;
    this.stillSince = null;
    this.run = { n: 0, until: 0 }; // Hit and Run's shots left
    this.skyN = 0; // Skyfall's air shots (every SKILLS.skyfall.every-th: the hawk)
    this.slashed = new Set();
    this.prev = null;
  }
  get fx() {
    return fxOf(this.g.me);
  }
  // ——— damage ———
  // what boss gear adds to a hit on v (Rooted, Oath, Shatterer; First Blood sets a sure crit for the roll)
  mult(v) {
    const f = this.fx, k = v ? MOBS[v.kind] : null;
    let x = 1;
    if (f.rooted && this.stillSince != null && this.g.time - this.stillSince >= ROOTED_S) x *= ROOTED_DMG;
    if (f.oath && this.oath) {
      x *= OATH_BONUS;
      this.oath = false;
      if (v) this.g.pop(v.x, v.y - (k?.h ?? 40) - 40, 'OATH!', '#ffe08a', 16);
    }
    if (f.shatterer && (k?.boss || k?.field) && (v.frozen || v.burning)) x *= SHATTERER;
    if (f.firstcrit && v && !this.hitBefore.has(v.id)) this.g.sureNext = true;
    if (v) this.hitBefore.add(v.id);
    return x;
  }
  // the Skirmisher's bonus on an arrow fired now (Aerial Archery in the air; Hit and Run spends one of its shots)
  shotMult(airborne) {
    const m = this.g.me, aer = rankOf(m?.skills, 'aerial_archery'), run = rankOf(m?.skills, 'hit_and_run');
    let x = aer && airborne ? 1 + SKILLS.aerial_archery.bonus(aer) : 1;
    if (run && this.run.n > 0 && this.g.time < this.run.until) {
      this.run.n--;
      x *= 1 + SKILLS.hit_and_run.bonus(run);
    }
    return x;
  }
  // roll and send extra hits of `kind` on `targets` (base: ATK or MAGIC; mult: its share), shown after `delay` s
  extra(kind, targets, base, mult, { delay = 0, el = null, magic = false, arrow = false, x = null, dir = 1 } = {}) {
    const g = this.g, me = g.slimeOf(g.myId) ?? g.net?.me;
    if (!targets.length || !me) return;
    const hits = [];
    for (const v of targets) {
      const cut = g.shellCut(v, me.x), [pm, weak] = g.party.mod(v, { magic, arrow }, me.y, me.x);
      let [dmg, crit] = g.roll(base, mult * g.markOn(v) * this.mult(v));
      dmg = Math.max(1, Math.round(dmg * cut * pm));
      hits.push(weak ? [v.id, dmg, crit, 0, +weak] : [v.id, dmg, crit]);
      if (el) g.predictEl(v, el, false);
      const show = () => g.showHit(v, dmg, crit, me.x);
      if (delay) setTimeout(show, delay * 1000);
      else show();
    }
    g.afterInput(() => g.send({ t: 'gearHit', kind, s: g.net.seq, dir, x: x == null ? undefined : Math.round(x), hits }));
  }
  // the next mobs in a line behind v, away from x (pierces)
  behind(v, fromX, n, reach = 300) {
    const dir = Math.sign(v.x - fromX) || 1;
    return this.g.targets().filter((q) => q !== v && (q.x - v.x) * dir > 0 && Math.abs(q.x - v.x) < reach && Math.abs(q.y - v.y) < 60).sort((a, b) => Math.abs(a.x - v.x) - Math.abs(b.x - v.x)).slice(0, n);
  }
  near(x, y, r, not = null) {
    return this.g.around(x, y, r).filter((q) => q !== not);
  }
  // a sword swing just hit v (or nothing): Ladon's second hit, the Colossus's piston, Typhon's eruption
  swung(me, dir, v) {
    const f = this.fx, m = this.g.me;
    if (f.hydra === 'sword' && v) this.extra('twin', [v], m.atk, HYDRA_HIT, { delay: 0.1, dir });
    if (f.piston === 'sword') {
      const [p] = this.g.ahead(me, dir, PISTON_RANGE, 0);
      if (p) {
        this.g.fx.spawn('arrow', { x: me.x + dir * 20, y: me.y - 18, tx: p.x, ty: p.y - MOBS[p.kind].h / 2, dur: 0.12, hit: true, tint: '#c8b07a' });
        this.extra('piston', [p], m.atk, PISTON_MULT, { delay: 0.12, dir });
      }
    }
    if (f.hearth === 'sword' && v && ++this.swings % HEARTH_EVERY === 0) {
      this.g.fx.spawn('nova', { x: me.x, y: me.y + 10, radius: ERUPT_R, tint: 'fire' });
      this.g.pop(me.x, me.y - 90, 'ERUPT!', '#ffb08a', 18);
      audio.sfx('nova', { vol: 0.7 });
      this.extra('erupt', this.near(me.x, me.y, ERUPT_R), m.atk, ERUPT_MULT, { el: 'fire', dir });
    }
  }
  // a bow shot (or a shot skill's first arrow) is on its way to v, landing in dur s: Ladon's split, the Colossus's
  // pierce, Typhon's explosion, Fenrir's volley (retreat), Aerial Archery's second arrow, Skyfall
  shot(me, dir, v, dur, { normal = true, retreat = 1, airborne = false, sm = 1 } = {}) {
    if (!v) return;
    const f = this.fx, m = this.g.me, g = this.g, base = m.atk * BOW_SHOT_MULT * retreat * sm;
    const arrow = (tv, extraDelay = 0) => g.fx.spawn('arrow', { x: me.x + dir * 30, y: me.y - 13, tx: tv.x, ty: tv.y - MOBS[tv.kind].h / 2, dur: dur + extraDelay, hit: true, tint: bowTint(m.gear?.weapon) });
    if (normal && f.hydra === 'bow') {
      arrow(v, 0.06);
      this.extra('twin', [v], base, HYDRA_HIT, { delay: dur + 0.06, arrow: true, dir });
    }
    if (normal && f.piston === 'bow') this.extra('pierce', this.behind(v, me.x, PISTON_PIERCE), base, 1, { delay: dur + 0.08, arrow: true, dir });
    if (normal && f.hearth === 'bow') {
      setTimeout(() => g.fx.spawn('nova', { x: v.x, y: v.y + 10, radius: EXPLODE_R, tint: 'fire' }), dur * 1000);
      this.extra('explode', this.near(v.x, v.y, EXPLODE_R, v), base, EXPLODE_MULT, { delay: dur, dir });
    }
    if (normal && f.unbound === 'bow' && retreat > 1) {
      for (let n = 1; n <= VOLLEY; n++) arrow(v, n * 0.07);
      this.extra('volley', Array(VOLLEY).fill(v), base, 1, { delay: dur + 0.1, arrow: true, dir });
    }
    if (normal && airborne && rankOf(m.skills, 'aerial_archery')) {
      arrow(v, 0.09);
      this.extra('aerial', [v], base, 1, { delay: dur + 0.09, arrow: true, dir });
    }
    if (airborne && rankOf(m.skills, 'skyfall')) {
      const [b] = this.behind(v, me.x, 1);
      if (b) this.extra('sky', [b], m.atk, SKILLS.skyfall.pierce, { delay: dur + 0.1, arrow: true, dir });
      if (++this.skyN % SKILLS.skyfall.every === 0) {
        g.fx.spawn('arrow', { x: v.x - dir * 120, y: v.y - 260, tx: v.x, ty: v.y - MOBS[v.kind].h / 2, dur: 0.25, hit: true, tint: '#e6f0a8' });
        g.pop(v.x, v.y - MOBS[v.kind].h - 50, 'STOOP!', '#e6f0a8', 15, dur);
        this.extra('dive', [v], m.atk, SKILLS.skyfall.dive, { delay: dur + 0.25, arrow: true, dir });
      }
    }
  }
  // a spell went off toward (tx, ty): Typhon's staff leaves the ground burning there
  spell(sk, tx, ty) {
    if (this.fx.hearth !== 'staff' || !(sk.mult || sk.kind === 'field')) return;
    this.grounds.push({ x: tx, y: ty, until: this.g.time + GROUND_S });
    if (this.grounds.length > 6) this.grounds.shift();
  }
  // a skill's MP for us now (Chronos's weapons cost more; the Colossus's staff makes every PISTON_FREE-th free; an
  // echo is free), and count it
  cost(sk, mp, free) {
    if (free) return 0;
    const n = this.casts + 1;
    return this.fx.piston === 'staff' && n % PISTON_FREE === 0 ? 0 : mp;
  }
  cast(free) {
    if (!free) this.casts++;
  }
  // a kill we predicted (Rush)
  killed() {
    if (this.fx.rush) this.rushUntil = this.g.time + RUSH_S;
  }
  // the BOOST input bit (sim.js): Rush running
  boost() {
    return !!this.fx.rush && this.g.time < this.rushUntil;
  }
  // ——— messages ———
  receive(m, mine) {
    const g = this.g;
    if (m.t === 'gearfx' && m.a === 'oath') {
      this.oath = true;
    } else if (m.t === 'gearfx' && m.a === 'echo') {
      if (mine) g.pop(mine.x, mine.y - 100, 'ECHO!', '#c4cdff', 16);
      setTimeout(() => { // the spell again, free (the server allows it once: server/rpg.js cast)
        const me = g.slimeOf(g.myId);
        if (me && isCombat(g.room)) g.cast(m.skill, me, me.facing, g.net.seq, me, true);
      }, 180);
    } else if (m.t === 'gearhit' && m.id !== g.myId) {
      const k = m.kind;
      if (k === 'erupt' || k === 'explode' || k === 'stomp' || k === 'nova') g.fx.spawn('nova', { x: m.x, y: (g.views.get(m.hits[0]?.[0])?.y ?? 0) + 10, radius: k === 'erupt' ? ERUPT_R : k === 'explode' ? EXPLODE_R : k === 'stomp' ? STOMP_R : NOVA_R, tint: k === 'nova' ? undefined : k === 'stomp' ? 'mana' : 'fire' });
      g.othersHits(m.hits, mine?.x ?? m.x);
    }
  }
  // ——— every fresh fixed step (src/rpg.js step) ———
  step(me) {
    const g = this.g, m = g.me, t = g.time;
    if (!m || !isCombat(g.room)) return;
    const f = this.fx, p = this.prev ?? { grounded: me.grounded, vy: me.vy, dt: me.dt, bc: me.bc, x: me.x };
    this.stillSince = me.grounded && Math.abs(me.vx) < 1 ? this.stillSince ?? t : null;
    // Hit and Run: a jump or a dash readies its shots
    if (rankOf(m.skills, 'hit_and_run') && ((p.grounded && !me.grounded && me.vy < 0) || (me.dt > 0 && !(p.dt > 0)))) this.run = { n: SKILLS.hit_and_run.shots, until: t + SKILLS.hit_and_run.window };
    // Fenrir's sword: every mob a dash goes through is slashed, once a dash
    if (f.unbound === 'sword' && me.dt > 0) {
      if (!(p.dt > 0)) this.slashed = new Set();
      const vs = g.targets().filter((v) => !this.slashed.has(v.id) && Math.abs(v.x - me.x) < MOBS[v.kind].w / 2 + 30 && Math.abs((v.y - MOBS[v.kind].h / 2) - (me.y - 20)) < 40 + MOBS[v.kind].h / 2);
      for (const v of vs) this.slashed.add(v.id);
      if (vs.length) {
        g.fx.spawn('strike', { x: me.x, y: me.y, dir: me.facing });
        this.extra('dash', vs, m.atk, DASH_SLASH_MULT, { dir: me.facing });
      }
    }
    // Fenrir's staff: a Blink leaves a frost nova where you were (bc: its cooldown, set on the step it goes off)
    if (f.unbound === 'staff' && me.bc > (p.bc ?? 0)) {
      g.fx.spawn('nova', { x: p.x, y: me.y + 10, radius: NOVA_R });
      audio.sfx('nova', { vol: 0.6 });
      this.extra('nova', g.around(p.x, me.y, NOVA_R), m.magic, NOVA_MULT, { el: 'frost', magic: true, x: p.x, dir: me.facing });
    }
    // Brenna's helm: a long fall lands as a stomp
    if (f.quake && me.grounded && !p.grounded && p.vy >= STOMP_VY) {
      g.fx.spawn('nova', { x: me.x, y: me.y + 10, radius: STOMP_R, tint: 'mana' });
      g.pop(me.x, me.y - 90, 'STOMP!', '#ffd0a0', 18);
      audio.sfx('bossSlam', { vol: 0.6 });
      this.extra('stomp', g.around(me.x, me.y, STOMP_R), Math.max(m.atk, m.magic), STOMP_MULT, { dir: me.facing });
    }
    // Typhon's mask: a fire trail behind you while you walk
    if (f.furnace && me.grounded && Math.abs(me.vx) > 50 && t - this.trailAt >= TRAIL_EVERY) {
      this.trailAt = t;
      this.trail.push({ x: me.x, y: me.y, until: t + TRAIL_S });
    }
    this.trail = this.trail.filter((q) => q.until > t);
    this.grounds = this.grounds.filter((q) => q.until > t);
    // the trail and burning ground hurt what stands in them, every GROUND_EVERY s
    if (t - this.tickAt >= GROUND_EVERY && (this.trail.length || this.grounds.length)) {
      this.tickAt = t;
      const on = (list, w) => g.targets().filter((v) => list.some((q) => Math.abs(v.x - q.x) < w + MOBS[v.kind].w / 2 && Math.abs(v.y - q.y) < 60));
      const tr = on(this.trail, TRAIL_W), gr = on(this.grounds, GROUND_W);
      if (tr.length) this.extra('trail', tr.slice(0, 12), Math.max(m.atk, m.magic), TRAIL_MULT, { dir: me.facing });
      if (gr.length) this.extra('ground', gr.slice(0, 20), m.magic, GROUND_MULT, { magic: true, dir: me.facing });
    }
    this.prev = { grounded: me.grounded, vy: me.vy, dt: me.dt, bc: me.bc, x: me.x };
  }
  // Sigrun's helm: nothing knocks us back (the server agrees: knockBack)
  knockFree(me) {
    return !!((me.gx | 0) & GX.KNOCKFREE);
  }
  // ——— drawing (world space): the burning ground and the fire trail ———
  draw(ctx) {
    const t = this.g.time;
    for (const [list, w, life] of [[this.grounds, GROUND_W, GROUND_S], [this.trail, TRAIL_W, TRAIL_S]]) {
      for (const q of list) {
        const a = Math.min(1, (q.until - t) / 0.5) * 0.7, flick = 0.85 + 0.15 * Math.sin(t * 14 + q.x);
        const grd = ctx.createRadialGradient(q.x, q.y - 6, 2, q.x, q.y - 6, w);
        grd.addColorStop(0, `rgba(255, 210, 140, ${a * flick})`);
        grd.addColorStop(0.5, `rgba(255, 140, 90, ${a * 0.6 * flick})`);
        grd.addColorStop(1, 'rgba(255, 120, 80, 0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.ellipse(q.x, q.y - 4, w, 14 + 6 * (life > 2 ? 1 : 0.6), 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
