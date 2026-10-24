// Docs: docs/combat/core.md, docs/combat/skills.md, docs/combat/stages.md, docs/combat/bosses.md
// The Wildwood and the boss dens on the client (data: src/shared/rpg.js, src/shared/skills.js; rules:
// server/rpg.js). Combat is decided here, from what's on screen, for responsiveness: which mobs your
// swings and skills hit and for how much (shown at once, then sent), and when a mob, a boss slam or
// falling thorns hit you (the knockback is predicted at that exact step, see net.js applyKick). The
// server sanity-checks and owns the mobs, loot and your stats. Also: HP/MP/EXP HUD, the hotbar (1–9),
// the bag (I). The skill tree and the shop are in skilltree.js and shop.js.
import { W, clamp, rand } from './util.js';
import { text } from './village.js';
import { drawMob, drawItemIcon } from './field.js';
import { drawBoss, drawBossBar, BossFx, drawUltBanner } from './dens.js';
import { drawHazard } from './hazards.js';
import { SkillFx, drawSkillIcon, drawGodsAura, drawBerserkAura, drawBubble, drawBarrier, drawRallyAura, drawAegisAura } from './skillfx.js';
import { Summons } from './summons.js';
import { Party } from './party.js';
import { StatusBox, statusOf } from './status.js';
import { audio } from './audio.js';
import { MOBS, ITEMS, BAG_SLOTS, lootFits, PICKUP_RANGE, HURT_INVULN_MS, isCombat, denAt, sellPrice, SAFE_R, DEN_W, COSMETICS, DEN_PLATFORMS, canScroll, slotsOf, enhName, FIELD_BOSS_RESPAWN_MS, gearSlotOf, isGear, STAFF_BOLT_MULT, STAFF_BOLT_SPEED, STAFF_BOLT_RANGE, BOW_SHOT_MULT, BOW_SHOT_SPEED, BOW_RANGE, curseMult, heavyHit } from './shared/rpg.js';
import { SKILLS, HOTBAR, POTBAR, rankOf, cooldownOf, durOf, AP_STATS, AP_PER_LVL, apOf, MIN_ROLL, MAX_ROLL, statsFor, CLASSES, weaponOk, ARCANE_MAX, ARCANE_DUR, SHATTER_MULT, BURN_SPREAD, spendsArcane, arcaneMult, HOLY_BOLT_MULT, arrowBonus, RAIN_AT, RAIN_EVERY, aOrAn, hitKinds } from './shared/skills.js';
import { drawMobState } from './elements.js';
import { staffGlow } from './staff-art.js';
import { bowTint } from './bow-art.js';
import { SLAP_REACH, DASH_CD, BLINK_CD, PHANTOM_CD } from './shared/sim.js';

const MOB_KINDS = Object.keys(MOBS); // same order as the server's
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const panX = (x, me) => clamp((x - me) / 500, -1, 1);
// knockbacks: same numbers as server/rpg.js OUCH + hurt()
const OUCH = { touch: 380, charge: 380, slam: 420, rain: 200, ult: 420, shot: 240, burn: 150, geyser: 380, sweep: 380, beam: 300, zap: 260, bomb: 420, slash: 380, pulse: 360 };
// what to do about each boss ultimate (shown on the warning banner)
const ULT_HINT = {
  stomp: 'Get off the floor: onto a ledge!', spores: 'Stand inside a clear circle!', wave: 'Jump over the wave!', lanes: 'Get into the safe lane!', nova: 'Run far away from it!',
  magma: 'Stand on the ledge that holds!', rebirth: 'Break the egg before it hatches!', overclock: 'Safe tiles 1 → 2 → 3: Dash and Blink between them!',
  timestop: "When time stops, DON'T MOVE!", collapse: 'Dash or Blink through a wall of void!',
};
// ultimates Dash / Blink i-frames can get you through (the rest want you somewhere safe)
const DODGEABLE_ULT = new Set(['collapse']);
const TILE = 150; // den floor tiles for the grid attacks
// each skill kind's sound (id: the skill, for the ones that sound different)
const SKILL_SOUND = Object.fromEntries(Object.entries({
  strike: (id) => (id === 'sky_splitter' ? 'skySplitter' : 'powerStrike'), cleave: 'cleave', spin: 'whirlwind', storm: 'bladeStorm', bolt: 'bolt', chain: 'chain', meteor: 'meteor', nova: 'nova', starfall: 'starfall', heal: 'heal', buff: 'buff', bubble: 'bubble', fireball: 'bolt', shield: 'bubble', rally: 'rally', zone: 'sanctuary', aegis: 'aegis', gods: 'skySplitter', mend: 'heal', miracle: 'aegis', revive: 'secondWind', barrier: 'bubble', summon: 'rally',
  shot: (id) => (id === 'snipe' ? 'snipe' : 'bowShot'), pierce: (id) => (id === 'heartseeker' ? 'snipe' : 'pierce'), rain: 'arrowRain', mark: 'mark',
}).map(([k, v]) => [k, typeof v === 'function' ? v : () => v]));
const kickFrom = (me, mx, knock) => ({ vx: Math.sign(me.x - mx || 1) * knock, vy: -Math.min(420, knock * 1.1) });

export class Rpg {
  constructor({ send, net, onOpenChange }) {
    this.send = send;
    this.net = net;
    this.onOpenChange = onOpenChange;
    this.me = null; // { lvl, exp, next, hp, maxHp, mp, maxMp, coins, bag, gear, atk, magic, def, skills, sp, hotbar, potbar, pvp }
    this.snaps = []; // { k, mobs: Map(id → [id, kind, x, y, hp, flags]) }
    this.views = new Map(); // id → the mob as drawn (interpolated, plus animation state)
    this.killed = new Map(); // mob id → time: killed (predicted or seen), hidden until the server agrees
    this.ghosts = []; // mobs that just died, fading out
    this.loot = []; // [id, item, n, x, y]
    this.taken = new Map(); // loot id → time we picked it up (hidden at once)
    this.pops = []; // floating numbers: { x, y, text, color, at, size }
    this.toasts = [];
    this.time = 0;
    this.cds = {}; // skill → time (this.time) it's ready again
    this.hurtAt = -9; // our last ouch (this.time), for the invulnerability window
    this.ouchNext = null; // a boss slam / thorn hit to report at the next step
    this.room = null;
    this.bossBack = 0; // seconds until this den's boss returns (0: it's here)
    this.dmg = new Map(); // boss / field boss id → { kind, d: [[name, damage], …], at }: the damage meter
    this.fx = new SkillFx();
    this.summons = new Summons(this); // the Cleric's spirits, wisps and totems (S3)
    this.party = new Party(this); // S5's party mechanics on bosses (src/party.js)
    this.status = new StatusBox(document.getElementById('status')); // what's on you, under the HP panel (src/status.js)
    this.downNear = () => false; // (x, y, r) → is a knocked-out slime there? (main.js: Revive's check)
    this.bossFx = new BossFx();
    this.hz = []; // the newer mobs' and bosses' attacks: simulated here, judged in step(), drawn by hazards.js
    this.timed = []; // [time, fn]: follow-ups (a geyser erupting, a bomb going off…)
    this.still = null; // Chronos's Time Stop: { x0, until, mob } while we must not move
    this.slimeOf = () => null;
    this.selected = -1;
    this.assign = null; // { bar: 'skill' | 'pot', id }: choosing a hotbar slot for this
    this.el = document.getElementById('inv');
    this.grid = document.getElementById('inv-grid');
    this.info = document.getElementById('inv-info');
    document.getElementById('inv-close').onclick = () => this.close();
    document.getElementById('inv-pvp').onclick = () => this.setPvp(!this.me?.pvp);
    this.slots = [];
    for (let i = 0; i < BAG_SLOTS; i++) this.slots.push(this.slotButton(this.grid, i));
    this.gearSlots = { helmet: this.slotButton(document.getElementById('inv-helmet'), 'helmet'), weapon: this.slotButton(document.getElementById('inv-weapon'), 'weapon') };
    this.buildHotbar();
  }

  setPvp(on) {
    if (!this.me) return;
    this.me.pvp = on;
    this.send({ t: 'pvp', on });
    this.toast(on ? 'Friendly fire on: slaps hurt friends who have it on too' : 'Friendly fire off: nobody can hurt you, and you can\'t hurt anyone');
    if (this.isOpen) this.render();
    this.onPvp?.();
  }

  // ——— messages ———
  receive(m, ctx) {
    const { mine, slimeOf, myId } = ctx;
    this.slimeOf = slimeOf;
    this.myId = myId;
    if (m.t === 'me') {
      const old = this.me;
      this.me = m;
      this.meAt = this.time; // (its timers are ms left as of now: the status box)
      this.momentum = m.momentum ? { n: m.momentum, until: this.time + (m.momentumLeft ?? 0) / 1000 } : null; // (the HUD's Momentum pips)
      // Arcane Charge: we predict our own charges (staffBolt, cast); the server's count wins once ours has
      // been quiet a moment (a 'me' sent before our last bolt arrived would otherwise take one away)
      if (this.time - (this.arcane?.at ?? -9) > 1) this.arcane = { n: m.arcane ?? 0, at: -9, until: this.time + ARCANE_DUR };
      this.onMe?.(m);
      if (old && mine) {
        const gained = m.lvl === old.lvl ? m.exp - old.exp : 0;
        if (gained > 0) this.pop(mine.x, mine.y - 70, `+${gained} EXP`, '#ffd34d', 15);
      }
      if (this.isOpen) this.render();
    } else if (m.t === 'mobs') {
      const mobs = new Map();
      for (const a of m.m) mobs.set(a[0], a);
      this.snaps.push({ k: m.k, mobs });
      if (this.snaps.length > 40) this.snaps.shift();
      this.bossBack = m.b ?? 0;
    } else if (m.t === 'loot') {
      this.loot = m.l;
    } else if (m.t === 'notice') {
      // a one-time message on joining (the levelling rollback, classes arriving): a toast, and a line kept in
      // the chat; m.news names one with a banner instead of a toast ('classes': its line is the last one)
      const lines = m.text.split('\n'), banner = m.news && this.onNews?.(m);
      lines.forEach((line, i) => {
        if (!(banner && i === lines.length - 1)) this.toast(line);
        this.onAnnounce?.(line);
      });
    } else if (m.t === 'advance') {
      // an advancement level reached (src/shared/skills.js ADVANCEMENTS): a banner (src/rebirth.js) and a line
      // kept in the chat
      if (!this.onNews?.(m)) this.toast(m.text);
      this.onAnnounce?.(m.text);
      audio.sfx('levelup');
    } else if (m.t === 'burn') {
      // burns ticking (the Mage's combos): small orange numbers on every burning mob, anyone's
      for (const [id, dmg, , killed] of m.h ?? []) {
        const v = this.views.get(id);
        if (!v || this.killed.has(id)) continue;
        this.pop(v.x + rand(-10, 10), v.y - MOBS[v.kind].h - 8, String(dmg), '#ffa860', 14);
        if (killed) this.mobDied(v, mine?.x ?? v.x);
      }
    } else if (m.t === 'thirst') {
      const s = slimeOf(m.id);
      if (s && s.visible !== false) this.pop(s.x, s.y - 64, `+${m.n}`, '#7fe0a0', 15);
    } else if (m.t === 'reborn') {
      // someone came out of the Rebirth Pool as a new class: the splash (onReborn, src/rebirth.js) and a sound
      const s = slimeOf(m.id);
      if (s) {
        s.cls = m.cls;
        this.fx.spawn('levelskill', { x: s.x, y: s.y });
        this.pop(s.x, s.y - 110, CLASSES[m.cls]?.name ?? '', CLASSES[m.cls]?.color ?? '#fff2b0', 20); // (above the E prompt)
        this.onReborn?.(m, s);
        audio.sfx('reborn', { pan: m.id === myId ? 0 : panX(s.x, mine?.x ?? s.x), vol: m.id === myId ? 1 : 0.7 });
      }
    } else if (m.t === 'toast') {
      this.onToast?.(m.text); // (the Rebirth Pool's card shows its refusals)
      this.toast(m.text);
      if (/full|only drop|already|Not enough|first|out of|haven't/.test(m.text)) audio.sfx('error');
      if (/Level up/.test(m.text)) audio.sfx('levelup');
    } else if (m.t === 'got') {
      const it = ITEMS[m.item];
      if (it.kind === 'coin') audio.sfx('coin');
      else {
        audio.sfx('pickup');
        this.toast(`Picked up ${it.name}${m.n > 1 ? ` ×${m.n}` : ''}`);
      }
    } else if (m.t === 'nomana') {
      audio.sfx('noMana');
      this.toast('Not enough MP');
    } else if (m.t === 'shop') {
      audio.sfx(m.ok === 'buy' ? 'coinBuy' : 'coinSell');
      const name = m.cos ? COSMETICS[m.cos].name : ITEMS[m.item].name;
      this.toast(`${m.ok === 'buy' ? 'Bought' : 'Sold'} ${name}${m.n > 1 ? ` ×${m.n}` : ''} for ${m.gold} gold${m.cos ? ' (wearing it now: Bag → Style)' : ''}`);
    } else if (m.t === 'skill') {
      this.skillEcho(m, slimeOf, myId, mine);
    } else if (m.t === 'boss') {
      this.bossEvent(m, mine);
    } else if (m.t === 'party') {
      this.party.receive(m);
    } else if (m.t === 'curse') {
      this.party.curse(m);
    } else if (m.t === 'summons' || m.t === 'sumhit' || m.t === 'sumhurt' || m.t === 'sumgone' || m.t === 'netcatch') {
      this.summons.receive(m, { mine });
    } else if (m.t === 'bossdmg') {
      if (m.d.length) this.dmg.set(m.id, { kind: m.kind, d: m.d, h: m.h ?? [], k: m.k ?? [], at: this.time });
      else this.dmg.delete(m.id); // its HP was reset: the meter starts over
    } else if (m.t === 'scrolled') {
      this.scrolled(m, slimeOf(m.id), m.id === myId);
    }
  }
  // Someone used a scroll: the result over their head (and in your bag, if it was you)
  scrolled(m, s, isMe) {
    const label = { ok: 'SUCCESS!', fail: 'FAILED', boom: 'DESTROYED!' }[m.result];
    if (s && (isMe || s.visible !== false)) {
      this.fx.spawn('scroll', { x: s.x, y: s.y, result: m.result, follow: () => ({ x: s.x, y: s.y }) });
      this.pop(s.x, s.y - 78, label, m.result === 'ok' ? '#ffe28a' : m.result === 'boom' ? '#c79cff' : '#d8d4e4', isMe ? 24 : 18);
    }
    audio.sfx({ ok: 'scrollOk', fail: 'scrollFail', boom: 'scrollBoom' }[m.result], { vol: isMe ? 1 : 0.45 });
    if (isMe) {
      const left = `${m.left} slot${m.left === 1 ? '' : 's'} left`;
      this.toast(m.result === 'ok' ? `The scroll worked! ${m.name} (${left})` : m.result === 'boom' ? `The dark scroll failed and destroyed your ${ITEMS[m.item].name}…` : `The scroll failed (${m.name}, ${left})`);
    }
  }

  toast(text) {
    this.toasts.push({ text, at: this.time });
    if (this.toasts.length > 4) this.toasts.shift();
  }

  pop(x, y, label, color, size = 18, delay = 0) {
    this.pops.push({ x: x + rand(-6, 6), y, text: label, color, at: this.time + delay, size });
    if (this.pops.length > 40) this.pops.shift();
  }

  // ——— hitting mobs (predicted) ———
  shownHp(v) {
    return v.localUntil > this.time ? Math.min(v.hp, v.localHp) : v.hp;
  }
  // Show our hit straight away: number, flash, voice; a predicted kill hides the mob until the server agrees
  showHit(v, dmg, crit, myX, delay = 0) {
    const k = MOBS[v.kind];
    v.hurt = 1;
    v.localHp = this.shownHp(v) - dmg;
    // a boss's death waits for the server (its 'die' / 'fieldDown'): the server caps each hit, so a kill we
    // predicted could leave it a sliver of HP, and it would die on screen, come back and die again
    if (k.boss || k.field) v.localHp = Math.max(1, v.localHp);
    v.localUntil = this.time + 0.8;
    this.pop(v.x, v.y - k.h - 14, String(dmg), crit ? '#ff5d8f' : '#ffffff', crit ? 26 : 20, delay);
    audio.sfx(crit ? 'crit' : 'hit', { pan: panX(v.x, myX) });
    audio.sfx('mobHurt', { kind: MOBS[v.kind].base ?? v.kind, pan: panX(v.x, myX), vol: 0.8 });
    if (v.localHp <= 0) this.mobDied(v, myX);
  }
  mobDied(v, myX) {
    if (this.killed.has(v.id)) return;
    this.killed.set(v.id, this.time);
    this.ghosts.push({ ...v, dying: 0 });
    const k = MOBS[v.kind], pan = panX(v.x, myX);
    audio.sfx('mobDeath', { kind: MOBS[v.kind].base ?? v.kind, pan });
    if (k.boss || k.field) {
      audio.sfx('bossDie', { pan });
      this.bossFx.spawn('bossDie', { x: v.x, y: v.y, size: k.w, theme: denAt(this.room)?.theme });
    } else audio.sfx('mobDie', { pan, vol: 0.7 });
  }
  // mobs we can hit, as drawn (not while phased out or mid-teleport; Pyra's egg can be)
  targets() {
    return [...this.views.values()].filter((v) => !this.killed.has(v.id) && (!v.special || v.shield !== undefined));
  }
  // the mobs in a box ahead of me toward dir (nearest first)
  ahead(me, dir, reach, back = 14) {
    const out = [];
    for (const v of this.targets()) {
      const k = MOBS[v.kind], d = (v.x - me.x) * dir;
      if (d < -back - k.w / 2 || d > reach + k.w / 2) continue;
      if (Math.abs((v.y - k.h / 2) - (me.y - 20)) > 40 + k.h / 2) continue;
      out.push([v, Math.abs(d)]);
    }
    return out.sort((a, b) => a[1] - b[1]).map((a) => a[0]);
  }
  // An Obsidian Crab's front shell blocks most of a hit from the side it faces (the server cuts it too)
  shellCut(v, fromX) {
    const ai = MOBS[v.kind].ai;
    return ai?.kind === 'shell' && Math.sign(fromX - v.x) === v.facing ? 1 - ai.cut : 1;
  }
  blocked(v, cut) {
    if (cut < 1) {
      this.pop(v.x, v.y - MOBS[v.kind].h - 30, 'SHELL', '#b8b2d0', 14);
      audio.sfx('shellBlock', { vol: 0.6 });
    }
  }
  // A slap / sword swing / staff bolt: → hits to send with it ([[mobId, dmg, crit]]). mult: a Charge's
  // (the server allows it from its own state: server/rpg.js attack)
  slapHits(me, dir, mult = 1) {
    if (!this.me || !isCombat(this.room)) return [];
    if (this.staffOf(this.me)) return this.staffBolt(me, dir);
    if (this.bowOf(this.me)) return this.bowShot(me, dir, mult);
    const [v] = this.ahead(me, dir, SLAP_REACH + (this.swordOf(this.me)?.reach ?? 0));
    if (!v) return [];
    const cut = this.shellCut(v, me.x), [pm, weak] = this.party.mod(v, { heavy: heavyHit(mult) }, me.y); // (S5.2: a boss's barrier, armour, weak point, stagger)
    let [dmg, crit] = this.roll(this.me.atk, mult * this.markOn(v));
    dmg = Math.max(1, Math.round(dmg * cut * pm));
    this.blocked(v, cut);
    this.showHit(v, dmg, crit, me.x);
    return [weak ? [v.id, dmg, crit, 0, 1] : [v.id, dmg, crit]];
  }


  // A Charge connected (anyone's: the slap echo carries `charge` for the others)
  chargeFx(s, dir) {
    this.fx.spawn('charge', { x: s.x, y: s.y, dir });
    this.pop(s.x + dir * 30, s.y - 70, 'CHARGE!', '#ffb08a', 17);
    audio.sfx('powerStrike', { vol: 0.7 });
  }
  // the mobs in a column above me, up to `reach` px over my head (Upward Cut)
  above(me, reach) {
    return this.targets().filter((v) => {
      const k = MOBS[v.kind];
      return Math.abs(v.x - me.x) < 40 + k.w / 2 && v.y - k.h < me.y && v.y > me.y - 40 - reach;
    });
  }
  // The Warrior's chase moves (S2.5): a Leap Slam just landed or an Upward Cut just went off, at input seq
  // (sim.js step did the moving; main.js moveFx draws them). Hits are predicted here and sent as a skill,
  // capped by the server (server/rpg.js chase). No MP, no hotbar.
  chase(id, me, seq) {
    const sk = SKILLS[id], m = this.me, rank = rankOf(m?.skills, id);
    if (!m || !rank || !isCombat(this.room)) return;
    const msg = { t: 'skill', skill: id, dir: me.facing, s: seq, hits: [] }, sx = me.x;
    for (const v of id === 'leap_slam' ? this.around(me.x, me.y, sk.radius) : this.above(me, sk.reach)) {
      const cut = this.shellCut(v, sx), [pm, weak] = this.party.mod(v, { heavy: heavyHit(sk.mult(rank)) }, me.y);
      let [dmg, crit] = this.roll(m.atk, sk.mult(rank) * this.markOn(v));
      dmg = Math.max(1, Math.round(dmg * cut * pm));
      this.blocked(v, cut);
      msg.hits.push(weak ? [v.id, dmg, crit, 0, 1] : [v.id, dmg, crit]);
      this.showHit(v, dmg, crit, sx);
    }
    if (msg.hits.length) this.send(msg);
  }

  swordOf(m) {
    const it = ITEMS[m?.gear?.weapon];
    return it?.kind === 'sword' ? it : null;
  }
  staffOf(m) {
    const it = ITEMS[m?.gear?.weapon];
    return it?.kind === 'staff' ? it : null;
  }
  bowOf(m) {
    const it = ITEMS[m?.gear?.weapon];
    return it?.kind === 'bow' ? it : null;
  }
  // Hunter's Mark (Archer, S4) on mob view v: everyone's hits on it do more (the server's cap allows the same)
  markOn(v) {
    return v?.marked ? 1 + (v.markBoost ?? SKILLS.hunters_mark.boost(1)) : 1;
  }
  // Is mob view v slowed, chilled, frozen or netted (Barbed Arrows' bonus)?
  slowed(v) {
    return !!(v.slow || v.chill || v.frozen || v.netted);
  }
  // A bow's normal attack (S4): an arrow to the first mob ahead within the bow's range, BOW_SHOT_MULT of ATK
  // (mult: a Retreat Shot's, main.js). Sent now, shown when it lands; the server caps it (server/rpg.js shoot).
  bowShot(me, dir, mult = 1) {
    const m = this.me, range = statsFor(m).arrowRange;
    const [v] = this.ahead(me, dir, range, 0);
    const sx = me.x, sy = me.y;
    const tx = v ? v.x : sx + dir * range * 0.85, ty = v ? v.y - MOBS[v.kind].h / 2 : sy - 20;
    const dur = Math.abs(tx - sx) / BOW_SHOT_SPEED + 0.03;
    this.fx.spawn('arrow', { x: sx + dir * 30, y: sy - 13, tx, ty, dur, hit: !!v, tint: bowTint(m.gear.weapon) });
    if (!v) return [];
    const cut = this.shellCut(v, sx), [pm, weak] = this.party.mod(v, { arrow: true }, sy);
    let [dmg, crit] = this.roll(m.atk, BOW_SHOT_MULT * mult * arrowBonus(m.skills, null, this.slowed(v), 0) * this.markOn(v));
    dmg = Math.max(1, Math.round(dmg * cut * pm));
    if (rankOf(m.skills, 'barbed_arrows')) v.slowLocal = this.time + dur + 1;
    setTimeout(() => {
      this.blocked(v, cut);
      this.showHit(v, dmg, crit, sx);
    }, dur * 1000);
    return [weak ? [v.id, dmg, crit, 0, 1] : [v.id, dmg, crit]];
  }
  // Someone else's arrow (drawn only: their hits come with the slap message) → when it lands
  otherArrow(s, dir, hits) {
    const v = hits?.length ? this.views.get(hits[0][0]) : null;
    const tx = v ? v.x : s.x + dir * 200, ty = v ? v.y - MOBS[v.kind].h / 2 : s.y - 20;
    const dur = Math.abs(tx - s.x) / BOW_SHOT_SPEED + 0.03;
    this.fx.spawn('arrow', { x: s.x + dir * 30, y: s.y - 13, tx, ty, dur, hit: !!v, tint: bowTint(s.gear?.weapon) });
    return dur;
  }
  // A Retreat Shot went off (ours or anyone's; the dash draws its own dust): a word over the shooter
  retreatFx(s, dir) {
    this.pop(s.x - dir * 20, s.y - 70, 'RETREAT SHOT', '#e6f0a8', 14);
  }
  // A staff's normal attack: a little bolt to the first mob ahead within the staff's range (S1). The hit
  // is sent now and shown when the bolt lands; the server caps it at STAFF_BOLT_MULT of MAGIC. A Cleric's is
  // the holy bolt (S3): golden, HOLY_BOLT_MULT of MAGIC, and the server heals a hurt friend from it.
  staffBolt(me, dir) {
    const m = this.me, range = statsFor(m).boltRange, holy = m.cls === 'cleric';
    const [v] = this.ahead(me, dir, range, 0);
    const sx = me.x, sy = me.y;
    const tx = v ? v.x : sx + dir * range * 0.8, ty = v ? v.y - MOBS[v.kind].h / 2 : sy - 22;
    const dur = Math.abs(tx - sx) / STAFF_BOLT_SPEED + 0.04;
    this.fx.spawn(holy ? 'holybolt' : 'staffbolt', { x: sx + dir * 18, y: sy - 10, tx, ty, dur, hit: !!v, tint: staffGlow(m.gear.weapon) });
    if (!v) return [];
    if (!holy && rankOf(m.skills, 'arcane_charge')) this.arcane = { n: Math.min(ARCANE_MAX, this.charges() + 1), at: this.time, until: this.time + ARCANE_DUR }; // (the server counts it too: attack)
    const cut = this.shellCut(v, sx), [pm, weak] = this.party.mod(v, { magic: true }, sy);
    let [dmg, crit] = this.roll(m.magic, (holy ? HOLY_BOLT_MULT : STAFF_BOLT_MULT) * this.markOn(v));
    dmg = Math.max(1, Math.round(dmg * cut * pm));
    setTimeout(() => {
      this.blocked(v, cut);
      this.showHit(v, dmg, crit, sx);
    }, dur * 1000);
    return [weak ? [v.id, dmg, crit, 0, 1] : [v.id, dmg, crit]];
  }
  // Arcane Charge's stored charges (Mage), as we predict them
  charges() {
    return this.arcane && this.arcane.until > this.time ? this.arcane.n : 0;
  }
  // The Mage's combos (S2.6): what our spell of element el just did to v's state, predicted until the
  // server's flags say so (they're its call: server/rpg.js element). Short local times bridge the gap.
  predictEl(v, el, shatter) {
    const t = this.time;
    if (el === 'frost' && !v.frozen) {
      if (v.chill) Object.assign(v, { frozenLocal: t + 0.5, chillGone: t + 0.5, chillLocal: 0, frozen: true, chill: false });
      else Object.assign(v, { chillLocal: t + 0.5, chill: true });
    } else if (el === 'fire') {
      if (shatter) Object.assign(v, { thawLocal: t + 0.6, frozenLocal: 0, frozen: false });
      Object.assign(v, { burnLocal: t + 0.5, burning: true });
    } else if (el === 'storm' && v.burning) {
      for (const q of this.targets()) if (q !== v && Math.abs(q.x - v.x) < BURN_SPREAD + MOBS[q.kind].w / 2 && Math.abs(q.y - v.y) < BURN_SPREAD) Object.assign(q, { burnLocal: t + 0.5, burning: true });
    }
  }
  // A shatter landed on v (ours or a friend's): shards, a word, a crack
  shatterFx(v, delay = 0) {
    const k = MOBS[v.kind];
    this.timed.push([this.time + delay, () => {
      this.fx.spawn('shatter', { x: v.x, y: v.y - k.h / 2, r: Math.max(30, k.w * 0.6) });
      audio.sfx('crit', { vol: 0.8 });
    }]);
    this.pop(v.x, v.y - k.h - 40, 'SHATTER!', '#bfe8ff', 20, delay);
  }
  // Someone else's staff bolt or holy bolt (drawn only: their hits come with the slap message)
  otherBolt(s, dir, hits) {
    const v = hits?.length ? this.views.get(hits[0][0]) : null;
    const tx = v ? v.x : s.x + dir * 150, ty = v ? v.y - MOBS[v.kind].h / 2 : s.y - 22;
    const dur = Math.abs(tx - s.x) / STAFF_BOLT_SPEED + 0.04;
    this.fx.spawn(s.cls === 'cleric' ? 'holybolt' : 'staffbolt', { x: s.x + dir * 18, y: s.y - 10, tx, ty, dur, hit: !!v, tint: staffGlow(s.gear?.weapon) });
    return dur;
  }

  // damage roll: minRoll (85%, raised by DEX) to 115%, crits from Sword Mastery and LUK (the server caps
  // hits at the best possible roll)
  // (S5.2: a boss's curse on us takes CURSE_DMG a stack off every hit: curseMult, the server's cap too)
  roll(base, mult = 1) {
    const crit = Math.random() < (this.me?.crit ?? 0.12);
    mult *= curseMult(this.me?.curse?.n);
    return [Math.max(1, Math.round(base * mult * rand(this.me?.minRoll ?? MIN_ROLL, MAX_ROLL) * (crit ? this.me?.critMult ?? 1.6 : 1))), crit ? 1 : 0];
  }

  // a boss's focus on us (S5): seconds left, 0 if none
  focusLeft() {
    return this.party.focusLeft();
  }
  // Cleanse's target (S5.2), as the server picks it: the nearest cursed friend within r, else us if we're cursed
  cleanseTarget(me, r) {
    let best = null, bestD = Infinity;
    for (const [id] of this.party.curses) {
      if (id === this.myId) continue;
      const s = this.slimeOf(id);
      const d = s ? Math.hypot(s.x - me.x, s.y - me.y) : Infinity;
      if (s && !s.down && d <= r + 40 && d < bestD) [best, bestD] = [s, d];
    }
    return best ?? (this.me?.curse?.n > 0 || this.party.cursedN(this.myId) ? me : null);
  }

  // ——— skills (hotbar 1–6) ———
  cooldown(id) {
    return Math.max(0, (this.cds[id] ?? 0) - this.time);
  }
  // mobs within radius of (x, y) (around the body's middle)
  around(x, y, radius, round = false) {
    return this.targets().filter((v) => {
      const k = MOBS[v.kind];
      return round ? Math.hypot(v.x - x, v.y - k.h / 2 - (y - 20)) < radius + k.w / 2 : Math.abs(v.x - x) < radius + k.w / 2 && Math.abs((v.y - k.h / 2) - (y - 20)) < 50 + k.h / 2;
    });
  }
  // Cast from the hotbar: predicts everything, then tells the server. → true if it went off
  cast(id, me, dir, seq, mine) {
    const sk = SKILLS[id], m = this.me;
    if (!sk || !m) return false;
    const fail = (msg, sound) => {
      this.toast(msg);
      audio.sfx(sound);
      return false;
    };
    const rank = rankOf(m.skills, id);
    if (!rank) return fail(`You haven't learned ${sk.name} yet (press K)`, 'error');
    if (!isCombat(this.room)) return fail('Skills only work out in the Wildwood', 'error');
    if (this.cooldown(id) > 0) return false;
    if (m.mp < sk.mp) return fail('Not enough MP', 'noMana');
    if (sk.kind === 'revive' && !this.downNear(me.x, me.y, sk.radius)) return fail('Nobody near you is knocked out', 'error');
    if (sk.kind === 'cleanse' && !this.cleanseTarget(me, sk.radius)) return fail('Nothing to cleanse: nobody near you is cursed', 'error');
    m.mp -= sk.mp; // the server's next 'me' corrects this
    this.cds[id] = this.time + cooldownOf(id, rank);
    const msg = { t: 'skill', skill: id, dir, s: seq, hits: [] };
    // Arcane Charge: a Mage damage spell spends every stored charge for extra damage (the server counts the same)
    const charges = spendsArcane(id) ? this.charges() : 0;
    if (spendsArcane(id)) this.arcane = { n: 0, at: this.time, until: 0 };
    if (charges && mine) this.pop(mine.x, mine.y - 112, `ARCANE x${charges}`, '#c4cdff', 16);
    const mult = (sk.mult?.(rank) ?? 1) * arcaneMult(m.skills, charges);
    const kinds = hitKinds(sk, rank, m, charges, m.skills); // (S5.2: magic, heavy, arrow: what a boss's mechanics make of it)
    const hit = (v, base, delay = 0, extra = 1) => {
      const cut = this.shellCut(v, sx);
      const shatter = sk.el === 'fire' && !!v.frozen; // fire on a frozen mob (the Mage's combos)
      const [pm, weak] = this.party.mod(v, { ...kinds, heavy: kinds.heavy || shatter }, sy);
      let [dmg, crit] = this.roll(base, mult * extra * this.markOn(v) * (shatter ? SHATTER_MULT : 1));
      dmg = Math.max(1, Math.round(dmg * cut * pm));
      if (!delay) this.blocked(v, cut);
      msg.hits.push(weak ? [v.id, dmg, crit, shatter ? 1 : 0, 1] : shatter ? [v.id, dmg, crit, 1] : [v.id, dmg, crit]);
      if (sk.el) this.predictEl(v, sk.el, shatter);
      if (shatter) this.shatterFx(v, delay);
      if (delay) setTimeout(() => this.showHit(v, dmg, crit, sx), delay * 1000);
      else this.showHit(v, dmg, crit, sx);
    };
    const sx = me.x, sy = me.y, reach = SLAP_REACH + (this.swordOf(m)?.reach ?? 0) + (sk.reach ?? 0);
    const mag = (sk.stat === 'best' ? Math.max(m.atk, m.magic) : m.magic) * (sk.fire ? m.fire ?? 1 : 1) * (sk.holy ? m.heal ?? 1 : 1);
    const sound = sk.what === 'net' ? 'netSet' : SKILL_SOUND[sk.kind]?.(id);
    // an arrow skill's bonus on v (Archer, S4): Barbed Arrows on a slowed mob, Snipe's long shot
    const arrow = (v) => arrowBonus(m.skills, sk, this.slowed(v), Math.abs(v.x - sx));
    const barbed = rankOf(m.skills, 'barbed_arrows') ? 1 : 0;
    if (sk.kind === 'shot' || sk.kind === 'pierce') {
      // the Archer's arrows: Double Shot / Snipe at the first mob ahead, Piercing Arrow / Heartseeker through a line
      const line = sk.kind === 'pierce' ? this.ahead(me, dir, sk.range, 0).slice(0, sk.targets) : this.ahead(me, dir, sk.range, 0).slice(0, 1);
      const v = line[0], far = line.at(-1);
      const tx = sk.kind === 'pierce' ? sx + dir * sk.range : v ? v.x : sx + dir * sk.range, ty = v ? v.y - MOBS[v.kind].h / 2 : sy - 20;
      msg.tx = Math.round(tx);
      msg.ty = Math.round(ty);
      const speed = sk.kind === 'pierce' ? 2200 : 1600;
      for (const q of line) {
        const at = Math.abs(q.x - sx) / speed + 0.03;
        if (barbed || sk.slow) q.slowLocal = this.time + at + 1;
        for (let n = 0; n < (sk.arrows ?? 1); n++) hit(q, m.atk, at + n * 0.12, arrow(q));
      }
      this.arrowFx(id, sk, sx, sy, dir, tx, ty, !!v, m.gear?.weapon);
      if (far) setTimeout(() => audio.sfx('arrowHit', { pan: panX(far.x, sx) }), (Math.abs(far.x - sx) / speed) * 1000);
    } else if (sk.kind === 'rain') {
      // a volley up into the sky, coming down round the first mob ahead (or out in front)
      const [v] = this.ahead(me, dir, sk.range, 0);
      const tx = v ? v.x : sx + dir * Math.min(sk.range, 260), fy = v ? v.y : sy;
      msg.tx = Math.round(tx);
      msg.ty = Math.round(fy);
      const inside = this.around(tx, fy, sk.radius);
      for (let n = 0; n < sk.hits; n++) for (const q of inside) hit(q, m.atk, RAIN_AT + n * RAIN_EVERY, arrow(q));
      if (barbed || sk.slow) for (const q of inside) q.slowLocal = this.time + RAIN_AT + (sk.slow ?? 1);
      this.fx.spawn('rain', { sx, sy, x: tx, y: fy, radius: sk.radius, hits: sk.hits, big: sk.radius > 200 });
    } else if (sk.kind === 'mark') {
      const [v] = this.ahead(me, dir, sk.range, 0);
      if (!v) {
        this.cds[id] = 0; // nothing to mark: no MP, no cooldown (the server would refuse it)
        m.mp += sk.mp;
        return fail('Nothing ahead to mark', 'error');
      }
      msg.mob = v.id;
      for (const q of this.views.values()) if (q.markBy === this.myId) q.markLocal = 0;
      Object.assign(v, { markLocal: this.time + 0.6, marked: true, markBoost: sk.boost(rank), markBy: this.myId });
      this.arrowFx(id, sk, sx, sy, dir, v.x, v.y - MOBS[v.kind].h / 2, true, m.gear?.weapon);
    } else if (sk.kind === 'strike') {
      const [v] = this.ahead(me, dir, reach);
      if (v) hit(v, m.atk);
      this.fx.spawn(id === 'sky_splitter' ? 'skysplit' : 'strike', { x: sx, y: sy, dir });
    } else if (sk.kind === 'cleave') {
      for (const v of this.ahead(me, dir, reach).slice(0, sk.targets)) hit(v, m.atk);
      this.fx.spawn('cleave', { x: sx, y: sy, dir, reach });
    } else if (sk.kind === 'spin') {
      for (const v of this.around(sx, sy, sk.radius)) hit(v, m.atk);
      this.fx.spawn('spin', { x: sx, y: sy, radius: sk.radius, follow: () => mine && { x: mine.x, y: mine.y } });
    } else if (sk.kind === 'storm') {
      const inside = this.around(sx, sy, sk.radius);
      for (let n = 0; n < sk.hits; n++) for (const v of inside) hit(v, m.atk, n * 0.22);
      this.fx.spawn('storm', { x: sx, y: sy, radius: sk.radius, hits: sk.hits, follow: () => mine && { x: mine.x, y: mine.y } });
    } else if (sk.kind === 'bolt' || sk.kind === 'fireball' || sk.kind === 'meteor') {
      const [v] = this.ahead(me, dir, sk.range, 0);
      const tx = v ? v.x : sx + dir * sk.range, ty = v ? v.y - MOBS[v.kind].h / 2 : sy - 22;
      msg.tx = Math.round(tx);
      msg.ty = Math.round(ty);
      if (sk.kind === 'bolt' || sk.kind === 'fireball') {
        const dur = Math.abs(tx - sx) / 900 + 0.05;
        if (sk.kind === 'fireball') {
          // it bursts where it lands, hitting everything near (even if it only reached the floor)
          const fy = v ? v.y : sy;
          for (const t of this.around(tx, fy, sk.radius, true)) hit(t, mag, dur);
          if (v) setTimeout(() => audio.sfx('boltHit', { pan: panX(tx, sx) }), dur * 1000);
        } else if (v) {
          if (sk.slow) v.slowLocal = this.time + dur + sk.slow;
          hit(v, mag, dur);
          setTimeout(() => audio.sfx('boltHit', { pan: panX(tx, sx) }), dur * 1000);
        }
        this.boltFx(id, sk, sx, sy, tx, ty, dur, !!v);
      } else {
        const fy = v ? v.y : 450; // the blast is on the floor under the target
        for (const t of this.around(tx, fy, sk.radius, true)) hit(t, mag, sk.delay);
        setTimeout(() => audio.sfx('meteorHit', { pan: panX(tx, sx) }), sk.delay * 1000);
        this.fx.spawn('meteor', { x: tx, y: fy, radius: sk.radius, delay: sk.delay });
      }
    } else if (sk.kind === 'chain') {
      // a bolt to the first mob ahead, then leaping to the nearest mob not yet hit
      const [first] = this.ahead(me, dir, sk.range, 0);
      const chain = [];
      if (first) {
        chain.push(first);
        while (chain.length < sk.targets) {
          const last = chain.at(-1);
          const next = this.targets().filter((q) => !chain.includes(q) && Math.abs(q.x - last.x) < sk.jump).sort((a, b) => Math.abs(a.x - last.x) - Math.abs(b.x - last.x))[0];
          if (!next) break;
          chain.push(next);
        }
      }
      chain.forEach((v, n) => hit(v, mag, 0.05 * n));
      const points = [[sx + dir * 16, sy - 24], ...chain.map((v) => [v.x, v.y - MOBS[v.kind].h / 2])];
      if (!chain.length) points.push([sx + dir * sk.range * 0.6, sy - 30]);
      msg.points = points.map(([x, y]) => [Math.round(x), Math.round(y)]);
      this.fx.spawn('chain', { points: points.map(([x, y]) => ({ x, y })) });
    } else if (sk.kind === 'nova') {
      for (const v of this.around(sx, sy, sk.radius, true)) {
        v.slowLocal = this.time + sk.slow;
        hit(v, mag);
      }
      this.fx.spawn('nova', { x: sx, y: sy, radius: sk.radius });
    } else if (sk.kind === 'starfall') {
      const hits = this.around(sx, sy, sk.radius);
      hits.forEach((v, n) => hit(v, mag, 0.3 + 0.08 * n));
      this.fx.spawn('starfall', { x: sx, y: sy, radius: sk.radius, targets: hits.map((v) => ({ x: v.x, y: v.y })) });
    } else if (sk.kind === 'heal' || sk.kind === 'mend' || sk.kind === 'miracle') {
      this.fx.spawn('heal', { x: sx, y: sy, radius: Math.min(sk.radius, 400), targets: [{ x: sx, y: sy }] });
    } else if (sk.kind === 'barrier') {
      if (mine) Object.assign(mine, { barrierUntil: this.time + sk.dur, barrierF: 1 });
      this.fx.spawn('barrier', { x: sx, y: sy, radius: sk.radius });
    } else if (sk.kind === 'revive') {
      this.fx.spawn('heal', { x: sx, y: sy, radius: sk.radius, targets: [{ x: sx, y: sy }] });
    } else if (sk.kind === 'cleanse') {
      const s = this.cleanseTarget(me, sk.radius);
      this.fx.spawn('heal', { x: sx, y: sy, radius: 90, targets: s ? [{ x: s.x, y: s.y }] : [] });
    } else if (sk.kind === 'summon') {
      this.summons.called(sx + (sk.what === 'totem' || sk.what === 'net' ? 0 : dir * 36), sy, sk.what);
    } else if (sk.kind === 'buff') {
      if (mine) mine.berserkUntil = this.time + sk.dur;
      this.fx.spawn('buff', { x: sx, y: sy });
    } else if (sk.kind === 'bubble') {
      if (mine) mine.bubbleUntil = this.time + sk.dur;
    } else if (sk.kind === 'shield') {
      m.shield = m.shield ? 0 : 1; // a toggle (the server's 'me' follows)
      if (m.shield) this.fx.spawn('nova', { x: sx, y: sy, radius: 70, tint: 'mana' });
      this.toast(`Mana Shield ${m.shield ? 'on' : 'off'}`);
    } else if (sk.kind === 'rally') {
      if (mine) mine.rallyUntil = this.time + sk.dur;
      this.fx.spawn('rally', { x: sx, y: sy, radius: sk.radius });
    } else if (sk.kind === 'gods') {
      if (mine) mine.godsUntil = this.time + sk.dur;
      m.hp = Math.min(m.hp, 1); // (the server's 'me' follows)
      this.fx.spawn('gods', { x: sx, y: sy });
    } else if (sk.kind === 'zone') {
      this.fx.spawn('zone', { x: sx, y: sy, radius: sk.radius, dur: sk.dur });
    } else if (sk.kind === 'aegis') {
      if (mine) mine.aegisUntil = this.time + durOf(id, rank);
      this.fx.spawn('aegis', { x: sx, y: sy, radius: sk.radius });
    }
    if (sound) audio.sfx(sound);
    this.send(msg);
    return true;
  }

  // A bolt-like spell's flight: Magic Bolt, Pebble Toss (a small pebble), Glacial Spike (ice), Fireball
  // (fire, and a burst where it lands)
  boltFx(id, sk, x, y, tx, ty, dur, hit) {
    if (sk.stat === 'best') return this.fx.spawn('staffbolt', { x: x + 8 * Math.sign(tx - x), y: y - 24, tx, ty, dur: dur * 1.4, hit, tint: '214,196,170' });
    this.fx.spawn('bolt', { x, y: y - 22, tx, ty, dur, hit, tint: sk.fire ? '255,150,80' : sk.ice ? '160,225,255' : sk.holy ? '255,232,150' : undefined });
    if (sk.kind === 'fireball') this.timed.push([this.time + dur, () => this.fx.spawn('nova', { x: tx, y: ty + 18, radius: sk.radius, tint: 'fire' })]);
  }

  // An arrow skill's flight (Archer, S4): Double Shot's two arrows, Snipe's long one, a piercing streak, the mark
  arrowFx(id, sk, x, y, dir, tx, ty, hit, weapon) {
    const tint = bowTint(weapon);
    if (sk.kind === 'pierce') return this.fx.spawn('pierce', { x: x + dir * 14, y: y - 20, tx, ty: y - 20, dur: Math.abs(tx - x) / 2200, big: id === 'heartseeker' });
    const dur = Math.abs(tx - x) / 1600 + 0.03;
    for (let n = 0; n < (sk.arrows ?? 1); n++) this.timed.push([this.time + n * 0.12, () => this.fx.spawn('arrow', { x: x + dir * 14, y: y - 20, tx, ty, dur, hit, tint: sk.kind === 'mark' ? '255,120,110' : tint, big: !!sk.far })]);
  }

  // The server's {t:'skill'} for everyone in the room (ours: our hits are already shown)
  skillEcho(m, slimeOf, myId, mine) {
    const sk = SKILLS[m.skill], caster = slimeOf(m.id), myX = mine?.x ?? m.x;
    for (const [pid, amt] of m.heals ?? []) {
      const s = slimeOf(pid);
      if (s && amt > 0) this.pop(s.x, s.y - 64, `+${amt}`, '#7fe0a0', 20);
    }
    // team buffs land on whoever was in range (including us, when someone else cast it)
    for (const pid of m.targets ?? []) {
      const s = slimeOf(pid);
      if (!s) continue;
      if (sk.kind === 'rally') s.rallyUntil = this.time + m.dur;
      if (sk.kind === 'aegis') s.aegisUntil = this.time + m.dur;
      if (sk.kind === 'barrier') Object.assign(s, { barrierUntil: this.time + m.dur, barrierF: 1 });
    }
    // Revive / Miracle: everyone it got back up (main.js clears their splat)
    for (const pid of m.revived ?? []) {
      const s = slimeOf(pid);
      this.onRevived?.(pid);
      if (!s) continue;
      this.fx.spawn('revive', { x: s.x, y: s.y });
      this.pop(s.x, s.y - 70, 'REVIVED!', '#ffe9a0', 22);
    }
    // Hunter's Mark (S4): the mob it's on, and how much it adds, for everyone's rolls (markOn)
    if (m.mark) {
      const [mid, boost] = m.mark, v = this.views.get(mid);
      for (const q of this.views.values()) if (q.markBy === m.id) Object.assign(q, { markLocal: 0, markBy: null });
      if (v) Object.assign(v, { markBoost: boost, markBy: m.id, markLocal: this.time + 0.6, marked: true });
    }
    // Rally's taunt (S5): it pulled mobs (a boss's focus too) onto the caster
    if (m.taunt && caster && (m.id === myId || caster.visible !== false)) this.pop(caster.x, caster.y - 96, 'TAUNT!', '#ff9a7a', m.id === myId ? 22 : 18);
    if (m.id === myId || !caster || caster.visible === false) return;
    const x = caster.x, y = caster.y, vol = 0.6, pan = panX(x, myX);
    if (m.arcane) this.pop(x, y - 112, `ARCANE x${m.arcane}`, '#c4cdff', 14);
    if (sk.kind === 'buff') caster.berserkUntil = this.time + (m.dur ?? 20);
    if (sk.kind === 'bubble') caster.bubbleUntil = this.time + (m.dur ?? 8);
    if (sk.kind === 'gods') caster.godsUntil = this.time + (m.dur ?? 15);
    const follow = () => ({ x: caster.x, y: caster.y });
    if (sk.kind === 'strike') this.fx.spawn(m.skill === 'sky_splitter' ? 'skysplit' : 'strike', { x, y, dir: m.dir });
    else if (sk.kind === 'cleave') this.fx.spawn('cleave', { x, y, dir: m.dir, reach: SLAP_REACH + sk.reach });
    else if (sk.kind === 'spin') this.fx.spawn('spin', { x, y, radius: sk.radius, follow });
    else if (sk.kind === 'storm') this.fx.spawn('storm', { x, y, radius: sk.radius, hits: sk.hits, follow });
    else if (sk.kind === 'bolt' || sk.kind === 'fireball') this.boltFx(m.skill, sk, x, y, m.tx, m.ty, Math.abs(m.tx - x) / 900 + 0.05, m.hits.length > 0);
    else if (sk.kind === 'shield' && m.on) this.fx.spawn('nova', { x, y, radius: 70, tint: 'mana' });
    else if (sk.kind === 'meteor') this.fx.spawn('meteor', { x: m.tx, y: 450, radius: sk.radius, delay: sk.delay });
    else if (sk.kind === 'chain' && m.points) this.fx.spawn('chain', { points: m.points.map(([px, py]) => ({ x: px, y: py })) });
    else if (sk.kind === 'nova') this.fx.spawn('nova', { x, y, radius: sk.radius });
    else if (sk.kind === 'starfall') this.fx.spawn('starfall', { x, y, radius: sk.radius, targets: m.hits.map(([id]) => this.views.get(id)).filter(Boolean).map((v) => ({ x: v.x, y: v.y })) });
    else if (sk.kind === 'heal' || sk.kind === 'miracle') this.fx.spawn('heal', { x, y, radius: Math.min(sk.radius, 400), targets: (m.heals ?? []).map(([pid]) => slimeOf(pid)).filter(Boolean).map((s) => ({ x: s.x, y: s.y })) });
    else if (sk.kind === 'mend' || sk.kind === 'revive' || sk.kind === 'cleanse') this.fx.spawn('heal', { x, y, radius: sk.radius, targets: (m.targets ?? []).map((pid) => slimeOf(pid)).filter(Boolean).map((s) => ({ x: s.x, y: s.y })) });
    else if (sk.kind === 'barrier') this.fx.spawn('barrier', { x, y, radius: sk.radius, targets: (m.targets ?? []).map((pid) => slimeOf(pid)).filter(Boolean).map((s) => ({ x: s.x, y: s.y })) });
    else if (sk.kind === 'summon' && m.sx !== undefined) this.summons.called(m.sx, m.sy);
    else if (sk.kind === 'buff') this.fx.spawn('buff', { x, y });
    else if (sk.kind === 'rally') this.fx.spawn('rally', { x, y, radius: sk.radius });
    else if (sk.kind === 'zone') this.fx.spawn('zone', { x, y, radius: sk.radius, dur: m.dur });
    else if (sk.kind === 'aegis') this.fx.spawn('aegis', { x, y, radius: sk.radius });
    else if (sk.kind === 'gods') this.fx.spawn('gods', { x, y });
    else if (sk.kind === 'shot' || sk.kind === 'pierce' || sk.kind === 'mark') this.arrowFx(m.skill, sk, x, y, m.dir, m.tx ?? x + m.dir * 300, m.ty ?? y - 20, m.hits.length > 0 || !!m.mark, caster.gear?.weapon);
    else if (sk.kind === 'rain') this.fx.spawn('rain', { sx: x, sy: y, x: m.tx, y: m.ty, radius: sk.radius, hits: sk.hits, big: sk.radius > 200 });
    const sound = sk.what === 'net' ? 'netSet' : SKILL_SOUND[sk.kind]?.(m.skill);
    if (sound) audio.sfx(sound, { pan, vol });
    const delay = sk.kind === 'bolt' || sk.kind === 'fireball' ? Math.abs(m.tx - x) / 900 : sk.kind === 'meteor' ? sk.delay : sk.kind === 'starfall' ? 0.3 : sk.kind === 'shot' ? Math.abs(m.tx - x) / 1600 : sk.kind === 'pierce' ? 0.15 : sk.kind === 'rain' ? RAIN_AT : 0;
    this.othersHits(m.hits, myX, delay);
  }
  // A shield or Second Wind did its thing: {id, what: 'pop' | 'block' | 'secondwind'}
  guard(m, s, isMe) {
    if (!s) return;
    if (m.what === 'pop') {
      s.bubbleUntil = 0;
      this.fx.spawn('bubblePop', { x: s.x, y: s.y });
      audio.sfx('bubblePop');
      this.pop(s.x, s.y - 64, 'BLOCKED', '#9fe0ff', 18);
    } else if (m.what === 'block') {
      audio.sfx('block', { vol: isMe ? 1 : 0.5 });
      this.pop(s.x, s.y - 64, 'IMMUNE', '#ffe28a', 18);
    } else if (m.what === 'barrier') { // a Barrier broke (it took an ultimate, or ran out of soak)
      s.barrierUntil = 0;
      this.fx.spawn('bubblePop', { x: s.x, y: s.y });
      audio.sfx('bubblePop');
      this.pop(s.x, s.y - 64, 'BARRIER', '#ffe28a', 18);
    } else if (m.what === 'soak') { // the Barrier soaked a hit up whole
      this.pop(s.x, s.y - 60, 'SOAKED', '#ffe9a0', 15);
      audio.sfx('block', { vol: isMe ? 0.7 : 0.35 });
    } else if (m.what === 'dodge') { // Evasion (Archer, S4): the hit missed
      this.pop(s.x, s.y - 64, 'MISS', '#e6f0a8', 18);
      audio.sfx('dodge', { vol: isMe ? 0.8 : 0.4 });
    } else if (m.what === 'secondwind') {
      this.fx.spawn('secondwind', { x: s.x, y: s.y });
      audio.sfx('secondWind');
      this.pop(s.x, s.y - 70, 'SECOND WIND!', '#7fe0a0', 22);
    }
  }
  // Someone else's hits ([[mobId, dmg, crit, killed]]): numbers, flashes, kills
  othersHits(hits, myX, delay = 0) {
    for (const [id, dmg, crit, killed, shattered] of hits ?? []) {
      const v = this.views.get(id);
      if (!v) continue;
      const k = MOBS[v.kind];
      v.hurt = 1;
      if (shattered) this.shatterFx(v, delay);
      this.pop(v.x, v.y - k.h - 14, String(dmg), crit ? '#ffb0c8' : '#e8e4f4', crit ? 22 : 17, delay);
      audio.sfx('mobHurt', { kind: MOBS[v.kind].base ?? v.kind, pan: panX(v.x, myX), vol: 0.5 });
      if (killed) this.mobDied(v, myX);
    }
  }

  // ——— bosses ———
  // A field boss showed up in this room, or was beaten: everyone here hears (a toast and a chat line)
  fieldBoss(m, mine) {
    const k = MOBS[m.kind];
    if (!k) return;
    const line = m.a === 'fieldUp' ? k.desc : `${k.name} is beaten! It'll be back in about ${Math.round(FIELD_BOSS_RESPAWN_MS / 60000)} minutes.`;
    this.toast(line);
    this.onAnnounce?.(line);
    if (m.a === 'fieldUp') audio.sfx('fieldBoss');
    const v = m.a === 'fieldDown' && this.views.get(m.id);
    if (v) this.mobDied(v, mine?.x ?? m.x); // (our own hits never predict a boss's death)
  }
  // A big boss's line (MOBS[kind].lines: on walking in, at a new phase, when freed): a bubble over it for
  // a few seconds and a line in the chat
  bossSays(m) {
    const k = MOBS[m.kind];
    if (!k || !m.text) return;
    this.says = { id: m.id, text: m.text, at: this.time, x: this.views.get(m.id)?.x ?? m.x };
    this.onAnnounce?.(`${k.name}: "${m.text}"`);
  }
  bossEvent(m, mine) {
    if (m.a === 'fieldUp' || m.a === 'fieldDown') return this.fieldBoss(m, mine);
    if (m.a === 'say') return this.bossSays(m);
    const theme = denAt(this.room)?.theme, myX = mine?.x ?? m.x, pan = panX(m.x, myX);
    const ground = 450, me = this.net.me, v = this.views.get(m.id), k = MOBS[v?.kind] ?? MOBS.sprout_king;
    if (this.party.event(m, pan)) return; // (S5: the pulse; src/party.js)
    if (this.hazardEvent(m, k, theme, pan, me)) return;
    if (m.a === 'warn') {
      audio.sfx('bossWarn', { pan });
      if (m.act === 'slam') this.bossFx.spawn('slamWarn', { x: m.x, y: ground, radius: m.r ?? 300, dur: m.dur, theme });
      if (m.act === 'charge') this.bossFx.spawn('chargeWarn', { x: m.x, y: m.y, dir: m.dir, dur: m.dur });
      if (m.act === 'leap') this.bossFx.spawn('leap', { x: m.x, y: ground, tx: m.tx, dur: m.dur + 0.9, theme });
    } else if (m.a === 'leap') {
      audio.sfx('leap', { pan });
    } else if (m.a === 'slam') {
      this.bossFx.spawn('shockwave', { x: m.x, y: ground, radius: m.r, theme });
      audio.sfx('bossSlam', { pan });
      // on the floor near it (not in the air, not up on a ledge): it got us
      if (me.grounded && !me.onPlat && Math.abs(me.x - m.x) < m.r) this.ouchNext = { mob: m.id, kind: 'slam', mx: m.x };
    } else if (m.a === 'charge') {
      audio.sfx('bossCharge', { pan });
    } else if (m.a === 'rain') {
      for (const x of m.marks) this.bossFx.spawn('rainWarn', { x, y: ground, dur: m.dur, theme });
    } else if (m.a === 'rainHit') {
      for (const x of m.marks) this.bossFx.spawn('rainHit', { x, y: ground, theme });
      audio.sfx('thornRain');
      if (m.marks.some((x) => Math.abs(me.x - x) < 36)) this.ouchNext = { mob: m.id, kind: 'rain', mx: me.x - 1 };
    } else if (m.a === 'summon') {
      this.bossFx.spawn('summon', { x: m.x, y: m.y, theme });
      audio.sfx('summon', { pan });
    } else if (m.a === 'phase') {
      this.bossFx.spawn('phase', { x: m.x, y: m.y, theme, n: m.n });
      audio.sfx('phase', { pan });
      this.toast(`${k.name} grows stronger: phase ${m.n}!`);
    } else if (m.a === 'rage') {
      this.bossFx.spawn('roar', { x: m.x, y: m.y - k.h * 0.6, theme });
      audio.sfx('bossRoar', { pan });
      this.toast('The boss is enraged!');
    } else if (m.a === 'ultWarn') {
      // the big one: a banner, the safe spots, and ULT_WARN seconds to get there
      this.ult = { ...m, boss: k.name, hint: ULT_HINT[m.kind] ?? 'Get somewhere safe!', at: this.time };
      this.bossFx.spawn(`${m.kind}Warn`, { ...m, y: ground, theme });
      audio.sfx('ultWarn');
    } else if (m.a === 'ultHit') {
      this.ult = null;
      this.bossFx.spawn(`${m.kind}Hit`, { ...m, y: ground, theme });
      audio.sfx('ultHit');
      if (this.newUlt(m, me)) return;
      if (m.kind === 'wave') {
        this.bossFx.spawn('waveGo', { x0: m.x0, dir: m.dir, speed: m.speed, y: ground, theme });
        this.wave = { mob: m.id, x0: m.x0, dir: m.dir, speed: m.speed, at: this.time, front: m.x0 };
        return;
      }
      const safe =
        m.kind === 'stomp' ? !(me.grounded && !me.onPlat) :
        m.kind === 'spores' ? m.safe.some((x) => Math.abs(me.x - x) < SAFE_R) :
        m.kind === 'lanes' ? me.x >= m.lanes[m.safe][0] && me.x <= m.lanes[m.safe][1] :
        m.kind === 'nova' ? Math.abs(me.x - m.x) >= m.r : true;
      if (!safe) this.ouchNext = { mob: m.id, kind: 'ult', mx: m.x, noDodge: true };
    } else if (m.a === 'die') {
      this.ult = null;
      this.wave = null;
      this.still = null;
      this.hz = this.hz.filter((h) => h.mob !== m.id);
      if (v) this.mobDied(v, myX);
      this.toast('Boss defeated!');
    }
  }

  // ——— the newer mobs' and bosses' attacks: events → hazards (judged in step(), drawn by hazards.js) ———
  later(dt, fn) {
    this.timed.push([this.time + dt, fn]);
  }
  hint(text) {
    if (this.time - (this.hintAt ?? -99) > 6) this.toast(text);
    this.hintAt = this.time;
  }
  // → true if m was one of these events
  hazardEvent(m, k, theme, pan, me) {
    const now = this.time, mob = m.id, fx = this.bossFx, ground = 450;
    const add = (h) => this.hz.push({ mob, warnAt: now, ...h });
    if (m.a === 'shots') {
      for (const [x, y, vx, vy, g, r, delay] of m.shots) add({ type: 'shot', style: m.style, x, y, vx, vy, g, r, at: now + delay, end: now + delay + 4, pos: null });
      audio.sfx(m.style === 'water' ? 'squirt' : 'fireball', { pan, vol: m.style === 'ember' ? 0.8 : 0.5 });
    } else if (m.a === 'puddle') {
      add({ type: 'puddle', style: m.style, x: m.x - m.dir * k.w * 0.35, y: m.y, w: m.w, at: now + 0.15, end: now + m.life });
    } else if (m.a === 'geysers') {
      for (const [x, d] of m.list) {
        const at = now + d + m.warn;
        add({ type: 'geyser', x, r: m.r, top: m.top, warnAt: now + d, at, dur: m.dur, end: at + m.dur + 0.3 });
        this.later(at - now, () => {
          fx.spawn('geyserBurst', { x, y: m.top, theme });
          audio.sfx('geyser', { pan: panX(x, this.net.me.x), vol: 0.5 });
        });
      }
      audio.sfx('geyserWarn', { pan });
    } else if (m.a === 'sweep') {
      for (const f of m.fronts) {
        const travel = (f.dir > 0 ? DEN_W + 200 - f.x0 : f.x0 + 200) / f.speed;
        add({ type: 'sweep', style: f.style, x0: f.x0, dir: f.dir, speed: f.speed, h: f.h, tall: f.tall, at: now + f.delay, front: f.x0, end: now + f.delay + travel, lethal: !!f.lethal });
        this.later(f.delay, () => audio.sfx({ flame: 'flamewall', ring: 'ringFire', gear: 'gearRoll', laser: 'laser', void: 'collapse' }[f.style] ?? 'flamewall', { pan, vol: 0.6 }));
      }
      if (m.hint) this.hint(m.hint);
    } else if (m.a === 'beam') {
      add({ type: 'beam', style: m.style, x: m.bx ?? m.x, dir: m.dir, y0: m.y0, y1: m.y1, len: m.len, at: now + m.warn, dur: m.dur, end: now + m.warn + m.dur + 0.25 });
      audio.sfx('laserCharge', { pan, vol: 0.6 });
      this.later(m.warn, () => audio.sfx('laser', { pan }));
    } else if (m.a === 'grid') {
      add({ type: 'grid', style: m.style, tiles: m.tiles, tw: TILE, tall: !!m.tall, at: now + m.warn, dur: m.dur, end: now + m.warn + m.dur + 0.2, lethal: !!m.lethal });
      audio.sfx('gridWarn', { vol: 0.6 });
      this.later(m.warn, () => {
        audio.sfx('zap');
        for (const i of m.tiles) fx.spawn('zapBurst', { x: i * TILE + TILE / 2, x0: i * TILE, x1: (i + 1) * TILE, y: ground, theme });
      });
    } else if (m.a === 'bombs') {
      for (const id of m.ids) {
        const follow = () => {
          const s = id === this.myId ? this.net.me : this.slimeOf(id);
          return s && (id === this.myId || s.visible !== false) ? { x: s.x, y: s.y } : null;
        };
        add({ type: 'bomb', target: id, follow, r: m.r, at: now + m.warn, end: now + m.warn + 0.1 });
        this.later(m.warn, () => {
          const c = follow();
          if (c) fx.spawn('bombBoom', { x: c.x, y: c.y - 18, r: m.r, theme });
          audio.sfx('bombBoom', { vol: 0.7 });
        });
      }
      for (let i = 0; i < 3; i++) this.later(i, () => audio.sfx('bombTick', { vol: 0.5 }));
      if (m.ids.includes(this.myId)) this.hint(m.hint ?? 'A clock bomb is on you!');
    } else if (m.a === 'slash') {
      add({ type: 'slash', x: m.x, y: m.y, r: m.r, at: now + m.warn, end: now + m.warn + 0.15 });
      audio.sfx('slashWarn', { pan, vol: 0.6 });
      this.later(m.warn, () => {
        fx.spawn('slashArc', { x: m.x, y: m.y, r: m.r, theme });
        audio.sfx('slash', { pan, vol: 0.7 });
      });
    } else if (m.a === 'pulse') {
      const y = m.y - k.h / 2;
      add({ type: 'pulse', x: m.x, y, r: m.r, at: now + m.warn, end: now + m.warn + 0.2 });
      audio.sfx('phaseOut', { pan, vol: 0.5 });
      this.later(m.warn, () => {
        fx.spawn('pulseRing', { x: m.x, y, r: m.r, theme });
        audio.sfx('pulse', { pan, vol: 0.6 });
      });
    } else if (m.a === 'echo') {
      // after-images slamming the floor one after another
      for (const [x, d] of m.list) {
        this.later(d, () => fx.spawn('slamWarn', { x, y: ground, radius: m.r, dur: m.warn, theme }));
        this.later(d + m.warn, () => {
          fx.spawn('shockwave', { x, y: ground, radius: m.r, theme });
          audio.sfx('bossSlam', { pan: panX(x, this.net.me.x), vol: 0.6 });
          const me = this.net.me;
          if (me.grounded && !me.onPlat && Math.abs(me.x - x) < m.r) this.ouchNext = { mob, kind: 'slam', mx: x };
        });
      }
    } else if (m.a === 'diveWarn') {
      fx.spawn('diveWarn', { x: m.x, y: m.y - k.h / 2, tx: m.tx, ty: m.ty - 20, dur: m.dur, theme });
      audio.sfx('dive', { pan, vol: 0.6 });
    } else if (m.a === 'mobBlink' || m.a === 'bossBlink') {
      fx.spawn('blinkOut', { x: m.x0, y: m.y, size: k.w, theme });
      fx.spawn('blinkIn', { x: m.x, y: m.y, size: k.w, theme });
      audio.sfx('bossBlink', { pan, vol: 0.6 });
    } else if (m.a === 'eggBreak') {
      this.ult = null;
      fx.spawn('eggBreak', { x: m.x, y: m.y, theme });
      audio.sfx('eggBreak', { pan });
      this.toast(`The egg shattered! ${k.name} is stunned`);
    } else return false;
    return true;
  }
  // the newer ultimates going off → true if handled
  newUlt(m, me) {
    const now = this.time, mob = m.id;
    if (m.kind === 'magma') {
      // lava everywhere but the one ledge that holds
      const p = DEN_PLATFORMS[m.safe];
      const safe = me.onPlat && me.grounded && Math.abs(me.y - p.y) < 1 && me.x >= p.x - 16 && me.x <= p.x + p.w + 16;
      if (!safe) this.ouchNext = { mob, kind: 'ult', mx: me.x - 1, noDodge: true };
      audio.sfx('magmaRise');
    } else if (m.kind === 'rebirth') {
      this.ouchNext = { mob, kind: 'ult', mx: m.x, noDodge: true }; // nobody broke the egg: everyone's caught
      audio.sfx('rebirth');
    } else if (m.kind === 'overclock') {
      // three lethal zaps of every column but the safe one, m.gap apart
      m.safe.forEach((safe, i) => this.hz.push({ type: 'grid', style: 'volt', mob, tiles: Array.from({ length: 10 }, (_, j) => j).filter((j) => j !== safe), tw: TILE, tall: true, lethal: true,
        warnAt: now + Math.max(0, i * m.gap - 0.9), at: now + i * m.gap, dur: 0.3, end: now + i * m.gap + 0.5 }));
      m.safe.forEach((_, i) => this.later(i * m.gap, () => audio.sfx('zap')));
      audio.sfx('overclock');
    } else if (m.kind === 'timestop') {
      this.still = { x0: me.x, until: now + m.still, mob };
      audio.sfx('timeStop');
      this.later(m.still, () => audio.sfx('timeResume'));
    } else if (m.kind === 'collapse') {
      for (const dir of [1, -1]) {
        const x0 = dir > 0 ? 0 : DEN_W;
        this.hz.push({ type: 'sweep', style: 'void', mob, x0, dir, speed: m.speed, h: 450, tall: true, lethal: true, warnAt: now, at: now, front: x0, end: now + DEN_W / m.speed + 0.3 });
      }
      audio.sfx('collapse');
    } else return false;
    return true;
  }
  // Is a hazard hitting us right now? → an ouch, or null. Called on every fresh fixed step.
  hazardHits(me) {
    const t = this.time, bx = me.x, by = me.y - 20; // our body's middle
    for (const h of this.hz) {
      if (t < h.at || h.done) continue;
      const ouch = (kind) => ({ mob: h.mob, kind: h.lethal ? 'ult' : kind, mx: h.dir ? me.x - h.dir : h.x ?? me.x - 1, noDodge: h.lethal && !(h.type === 'sweep') });
      if (h.type === 'shot') {
        if (h.pos && Math.hypot(h.pos.x - bx, h.pos.y - by) < h.r + 16) {
          h.done = true;
          return { ...ouch('shot'), mx: h.pos.x };
        }
      } else if (h.type === 'puddle') {
        if (t < h.end - 0.4 && me.grounded && Math.abs(me.y - h.y) < 2 && Math.abs(me.x - h.x) < h.w / 2 + 6) return ouch('burn');
      } else if (h.type === 'geyser') {
        if (t < h.at + h.dur && Math.abs(me.x - h.x) < h.r + 10 && me.y > h.top) return ouch('geyser');
      } else if (h.type === 'sweep') {
        const front = h.x0 + h.dir * h.speed * (t - h.at), prev = h.front;
        h.front = front;
        // its front passed us this step (Blink across it and it never does)
        if ((prev - me.x) * (front - me.x) <= 0 && (h.tall || me.y > 450 - h.h - 2)) return ouch('sweep');
      } else if (h.type === 'beam') {
        const a = Math.min(h.x, h.x + h.dir * h.len), b = Math.max(h.x, h.x + h.dir * h.len);
        if (t < h.at + h.dur && me.x > a && me.x < b && me.y > h.y0 && me.y - 36 < h.y1) return ouch('beam');
      } else if (h.type === 'grid') {
        if (t > h.at + h.dur) continue;
        if (h.lethal) h.done = true; // the overclock zaps are judged once, the moment they go off
        if (h.tiles.includes(Math.floor(me.x / h.tw)) && (h.tall || (me.grounded && !me.onPlat))) return ouch('zap');
      } else if (h.type === 'bomb' || h.type === 'slash' || h.type === 'pulse') {
        h.done = true; // these go off once
        const c = h.type === 'bomb' ? h.follow() : h;
        if (!c) continue;
        const hit = h.type === 'bomb' ? Math.hypot(c.x - me.x, c.y - me.y) < h.r : h.type === 'slash' ? Math.abs(me.x - c.x) < h.r && Math.abs(me.y - c.y) < 90 : Math.hypot(c.x - bx, c.y - by) < h.r;
        if (hit) return { ...ouch(h.type), mx: c.x };
      }
    }
    return null;
  }

  // ——— every fixed step (from net.js): did something hit us? → the knockback to predict ———
  step(me, seq, splatted) {
    if (!this.me || !isCombat(this.room) || splatted) return null;
    // the Thorn Tsunami rolling across the den: on the ground when its front passes you = hit
    if (this.wave) {
      const w = this.wave, front = w.x0 + w.dir * w.speed * (this.time - w.at);
      if ((w.front - me.x) * (front - me.x) <= 0 && me.grounded) this.ouchNext = { mob: w.mob, kind: 'ult', mx: me.x - w.dir };
      w.front = front;
      if (front < -50 || front > DEN_W + 50) this.wave = null;
    }
    // Time Stop: moving at all while it lasts is fatal
    if (this.still) {
      if (this.time > this.still.until) this.still = null;
      else if (Math.abs(me.x - this.still.x0) > 3 || Math.abs(me.vx) > 1) {
        this.ouchNext = { mob: this.still.mob, kind: 'ult', mx: me.x - 1, noDodge: true };
        this.still = null;
      }
    }
    if (!this.ouchNext) this.ouchNext = this.hazardHits(me);
    // Dash / Blink i-frames: untouchable (except the ultimates that want you somewhere safe)
    if (me.ifr > 0 && !this.ouchNext?.noDodge) {
      this.ouchNext = null;
      return null;
    }
    const ult = this.ouchNext?.kind === 'ult'; // (an ultimate ignores the invulnerability after a hit)
    if (!ult && this.time - this.hurtAt < HURT_INVULN_MS / 1000) {
      this.ouchNext = null;
      return null;
    }
    let ouch = this.ouchNext;
    this.ouchNext = null;
    if (ouch) delete ouch.noDodge;
    if (!ouch) {
      for (const v of this.targets()) {
        const k = MOBS[v.kind];
        if (Math.abs(me.x - v.x) > k.w / 2 + 12 || me.y < v.y - k.h - 4 || me.y > v.y + 30) continue;
        if ((v.frozen || v.netted) && !k.boss && !k.field) continue; // frozen solid or netted: harmless (the server agrees: ouch)
        ouch = { mob: v.id, kind: v.charging ? 'charge' : 'touch', mx: v.x };
        break;
      }
    }
    if (!ouch) return null;
    this.hurtAt = this.time;
    this.send({ t: 'ouch', s: seq, ...ouch });
    // shields and Second Wind are the server's call; the knockback only if we'd still be standing
    return kickFrom(me, ouch.mx, OUCH[ouch.kind]);
  }

  // ——— the mobs, interpolated on the server's clock (same as other slimes) ———
  update(dt, me, room) {
    this.time += dt;
    this.flash = Math.max(0, (this.flash ?? 0) - dt * 3);
    this.fx.update(dt);
    this.summons.update(dt);
    this.bossFx.update(dt);
    for (const g of this.ghosts) g.dying += dt * (MOBS[g.kind].boss ? 0.8 : 2.2);
    this.ghosts = this.ghosts.filter((g) => g.dying < 1);
    for (const [id, t] of this.killed) if (this.time - t > 3) this.killed.delete(id);
    for (const [id, t] of this.taken) if (this.time - t > 2) this.taken.delete(id);
    for (let i = this.timed.length - 1; i >= 0; i--) if (this.time >= this.timed[i][0]) this.timed.splice(i, 1)[0][1]();
    for (const h of this.hz) {
      if (h.type !== 'shot' || this.time < h.at) continue;
      const tt = this.time - h.at;
      h.pos = { x: h.x + h.vx * tt, y: h.y + h.vy * tt + 0.5 * h.g * tt * tt, vx: h.vx, vy: h.vy + h.g * tt };
      if (h.pos.y > 456 || h.done) h.end = Math.min(h.end, this.time); // hit the floor (or us)
    }
    this.hz = this.hz.filter((h) => this.time < h.end);
    if (room !== this.room) this.leave(room);
    this.updateHotbar(room);
    this.party.update();
    this.status.update(statusOf(this, this.slimeOf(this.myId)), isCombat(room) && !!this.me);
    if (!isCombat(room)) return;
    const t = this.net.renderTick();
    if (t === null || !this.snaps.length) return;
    let a = this.snaps[0], b = this.snaps.at(-1);
    for (let i = this.snaps.length - 1; i > 0; i--) {
      if (this.snaps[i - 1].k <= t) {
        a = this.snaps[i - 1];
        b = this.snaps[i];
        break;
      }
    }
    const f = b.k > a.k ? clamp((t - a.k) / (b.k - a.k), 0, 1) : 1;
    const seen = new Set();
    for (const [id, mb] of b.mobs) {
      const ma = a.mobs.get(id) ?? mb;
      seen.add(id);
      let v = this.views.get(id);
      if (!v) this.views.set(id, (v = { id, t: 0, hurt: 0, seed: id * 7.3 }));
      v.kind = MOB_KINDS[mb[1]];
      const ny = ma[3] + (mb[3] - ma[3]) * f;
      v.vy = (ny - (v.y ?? ny)) / Math.max(dt, 1e-3);
      v.x = ma[2] + (mb[2] - ma[2]) * f;
      v.y = ny;
      v.hp = f < 0.5 ? ma[4] : mb[4];
      v.maxHp = mb[6] ?? MOBS[v.kind].hp; // bosses grow with the number of slimes fighting them
      const fl = mb[5];
      v.facing = fl & 1 ? -1 : 1;
      v.walking = !!(fl & 2);
      v.angry = !!(fl & 4);
      v.warn = !!(fl & 8);
      v.charging = !!(fl & 16);
      v.enraged = !!(fl & 32);
      v.slow = !!(fl & 64) || (v.slowLocal ?? 0) > this.time;
      v.special = !!(fl & 128);
      // the Mage's combos (256 chilled · 512 frozen · 1024 burning), plus what our own spells predicted
      const tt = this.time;
      v.frozen = (!!(fl & 512) && !((v.thawLocal ?? 0) > tt)) || (v.frozenLocal ?? 0) > tt;
      v.chill = !v.frozen && ((!!(fl & 256) && !((v.chillGone ?? 0) > tt)) || (v.chillLocal ?? 0) > tt);
      v.burning = !!(fl & 1024) || (v.burnLocal ?? 0) > tt;
      // the Archer's (S4): 2048 marked (Hunter's Mark) · 4096 netted (Net Trap)
      v.marked = !!(fl & 2048) || (v.markLocal ?? 0) > tt;
      if (!v.marked) v.markBy = null;
      v.netted = !!(fl & 4096);
      v.shield = mb[7];
      v.shieldMax = mb[8];
      v.t += dt;
      v.hurt = Math.max(0, v.hurt - dt * 3);
    }
    for (const id of this.views.keys()) if (!seen.has(id)) this.views.delete(id);
    // a kill we predicted that the server didn't agree with (the mob's still there after a while): show it again
    for (const [id, at] of this.killed) if (seen.has(id) && this.time - at > 1.2 && this.views.get(id).hp > 0) this.killed.delete(id);
    this.nearLoot = me && this.loot.some((d) => !this.taken.has(d[0]) && Math.abs(d[3] - me.x) <= PICKUP_RANGE && Math.abs(d[4] - me.y) < 60);
    audio.setIntensity?.(this.boss()?.enraged ? 1 : 0);
  }
  boss() {
    for (const v of this.views.values()) if (MOBS[v.kind].boss && !this.killed.has(v.id)) return v;
    return null;
  }

  // Z: hide the nearest loot at once (the server's 'got' and 'loot' confirm it)
  pickup(me, seq) {
    let best = null, bestD = PICKUP_RANGE;
    for (const d of this.loot) {
      const dx = Math.abs(d[3] - me.x);
      if (!this.taken.has(d[0]) && dx <= bestD && Math.abs(d[4] - me.y) < 60 && (!this.me || lootFits(this.me.bag, d[1]))) [best, bestD] = [d, dx]; // (the server takes the same one)
    }
    if (best) this.taken.set(best[0], this.time);
    this.send({ t: 'pickup', s: seq });
  }

  // Changing rooms: forget the old room's mobs (the new one's are sent on the way in)
  leave(room) {
    this.room = room;
    this.snaps = [];
    this.views.clear();
    this.killed.clear();
    this.ghosts = [];
    this.loot = [];
    this.says = null;
    this.bossBack = 0;
    this.dmg.clear();
    this.summons.clear();
    this.party.clear();
    this.ouchNext = null;
    this.ult = null;
    this.wave = null;
    this.hz = [];
    this.timed = [];
    this.still = null;
    audio.setIntensity?.(0);
  }

  // ——— drawing, in world space ———
  drawWorld(ctx) {
    this.summons.drawGround(ctx); // (a Guardian Totem's ring)
    for (const d of this.loot) {
      if (this.taken.has(d[0])) continue;
      const bob = Math.sin(this.time * 3 + d[0]) * 3;
      ctx.fillStyle = 'rgba(40,30,60,0.18)';
      ctx.beginPath();
      ctx.ellipse(d[3], d[4] - 1, 11 - bob * 0.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      drawItemIcon(ctx, d[1], d[3], d[4] - 16 + bob, 26);
    }
    for (const h of this.hz) if (h.type === 'puddle' || h.type === 'geyser') drawHazard(ctx, h, this.time);
    const draw = (v) => (MOBS[v.kind].boss ? drawBoss(ctx, v, this.time) : drawMob(ctx, v, this.time));
    for (const g of this.ghosts) draw({ ...g, hurt: 0 });
    for (const v of this.views.values()) if (!this.killed.has(v.id)) {
      draw(v);
      drawMobState(ctx, v, MOBS[v.kind], this.time); // ice, frost, flames (the Mage's combos)
    }
    for (const v of this.views.values()) {
      const k = MOBS[v.kind];
      if (k.boss || this.killed.has(v.id)) continue; // the boss has its bar at the top of the screen
      // field bosses and elites get a bigger, golden-rimmed tag; a field boss always shows its HP
      const big = k.field || k.elite, size = big ? 13 : 11, th = big ? 20 : 16;
      ctx.font = `700 ${size}px ${FONT}`;
      const label = `${k.field ? 'Field boss: ' : ''}${k.name} Lv ${k.lvl}`;
      const w = ctx.measureText(label).width + (big ? 18 : 12);
      ctx.fillStyle = k.field ? 'rgba(170,70,40,0.82)' : k.elite ? 'rgba(160,104,24,0.78)' : v.angry ? 'rgba(150,40,70,0.6)' : 'rgba(45,42,62,0.5)';
      ctx.beginPath();
      ctx.roundRect(v.x - w / 2, v.y + 6, w, th, th / 2);
      ctx.fill();
      if (big) {
        ctx.strokeStyle = '#ffe08a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      text(ctx, label, v.x, v.y + 6 + th / 2 + 0.5, size, '#ffffff');
      const hp = this.shownHp(v);
      if (k.field) bar(ctx, v.x - 50, v.y - k.h - 16, 100, 8, hp / v.maxHp, '#ff6f91');
      else if (hp < v.maxHp) bar(ctx, v.x - 24, v.y - k.h - 10, 48, 6, hp / v.maxHp, '#ff6f91');
    }
    this.summons.draw(ctx); // the Cleric's spirits, wisps and totems (S3)
    this.party.draw(ctx); // a boss's focus line, a pulse's rings (S5)
    this.bossFx.draw(ctx);
    this.drawSays(ctx);
  }
  drawSays(ctx) {
    const sy = this.says;
    if (!sy) return;
    const life = 4 + sy.text.length / 22, age = this.time - sy.at;
    if (age > life) return (this.says = null);
    const v = this.views.get(sy.id), k = MOBS[v?.kind];
    if (v) sy.x = v.x;
    const x = sy.x, bottom = (v ? v.y - (k?.h ?? 120) : 300) - 26;
    ctx.save();
    ctx.globalAlpha = clamp(Math.min(age * 5, life - age), 0, 1);
    ctx.font = `700 13px ${FONT}`;
    const lines = [];
    let line = '';
    for (const word of sy.text.split(' ')) {
      if (line && ctx.measureText(`${line} ${word}`).width > 260) lines.push(line), (line = word);
      else line = line ? `${line} ${word}` : word;
    }
    lines.push(line);
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 22, h = lines.length * 16 + 12, y = bottom - h;
    const bx = clamp(x - w / 2, 8, DEN_W - w - 8);
    ctx.fillStyle = '#fffaf3';
    ctx.strokeStyle = 'rgba(40,40,60,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, y, w, h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 7, bottom - 1);
    ctx.lineTo(x, bottom + 9);
    ctx.lineTo(x + 7, bottom - 1);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4a3b5c';
    lines.forEach((l, i) => ctx.fillText(l, bx + 11, y + 14 + i * 16));
    ctx.restore();
  }
  drawAura(ctx, s) {
    if ((s.godsUntil ?? 0) > this.time) drawGodsAura(ctx, s.x, s.y, this.time, s.godsUntil - this.time);
    if ((s.berserkUntil ?? 0) > this.time) drawBerserkAura(ctx, s.x, s.y, this.time);
    if ((s.rallyUntil ?? 0) > this.time) drawRallyAura(ctx, s.x, s.y, this.time);
  }
  // shields go over the slime
  drawShields(ctx, s) {
    if ((s.bubbleUntil ?? 0) > this.time) drawBubble(ctx, s.x, s.y, this.time);
    if ((s.aegisUntil ?? 0) > this.time) drawAegisAura(ctx, s.x, s.y, this.time);
    if ((s.barrierUntil ?? 0) > this.time) drawBarrier(ctx, s.x, s.y, this.time, s.barrierF ?? 1);
  }
  drawFx(ctx) {
    for (const h of this.hz) if (h.type !== 'puddle' && h.type !== 'geyser') drawHazard(ctx, h, this.time);
    this.party.drawOver(ctx); // a curse's wisps, over the slimes (S5.2)
    this.fx.draw(ctx);
  }

  drawPops(ctx) {
    for (const p of this.pops) {
      const k = (this.time - p.at) / 0.9;
      if (k > 1 || k < 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1 - k) * 3);
      ctx.font = `700 ${p.size}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(45,42,62,0.85)';
      const y = p.y - k * 34 - Math.sin(Math.min(1, k * 4) * Math.PI) * 6;
      ctx.strokeText(p.text, p.x, y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, y);
      ctx.restore();
    }
  }

  // ——— the HUD, in screen space: level, HP, MP, EXP and gold (combat rooms), boss bar, toasts ———
  drawHud(ctx, combat, H) {
    const m = this.me;
    if (combat && m) {
      const x = 16, y = 56;
      ctx.fillStyle = 'rgba(255,255,255,0.86)';
      ctx.beginPath();
      ctx.roundRect(x, y, 290, 66, 16);
      ctx.fill();
      ctx.fillStyle = '#8a6fc4';
      ctx.beginPath();
      ctx.arc(x + 26, y + 33, 20, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'Lv', x + 26, y + 23, 10, '#e9e0ff');
      text(ctx, String(m.lvl), x + 26, y + 38, 17, '#ffffff');
      bar(ctx, x + 54, y + 8, 224, 14, m.hp / m.maxHp, m.hp / m.maxHp < 0.3 ? '#ff4f6f' : '#ff7f9f');
      text(ctx, `HP ${Math.ceil(m.hp)} / ${m.maxHp}`, x + 166, y + 15.5, 10.5, '#4a3550');
      bar(ctx, x + 54, y + 26, 224, 14, m.mp / m.maxMp, '#6f9cff');
      text(ctx, `MP ${Math.max(0, Math.floor(m.mp))} / ${m.maxMp}`, x + 166, y + 33.5, 10.5, '#26356b');
      bar(ctx, x + 54, y + 44, 150, 11, m.exp / m.next, '#ffcf4d');
      text(ctx, `EXP ${m.exp} / ${m.next}`, x + 129, y + 50, 9.5, '#5b4a2b');
      drawItemIcon(ctx, 'coin', x + 222, y + 50, 16);
      text(ctx, String(m.coins), x + 234, y + 50.5, 11, '#a8791a', 'left');
      if (m.sp > 0) {
        ctx.fillStyle = '#ff8fb1';
        ctx.beginPath();
        ctx.roundRect(x + 296, y + 4, 92, 22, 11);
        ctx.fill();
        text(ctx, `${m.sp} skill pt${m.sp > 1 ? 's' : ''} · K`, x + 342, y + 15.5, 11, '#ffffff');
      }
      if (m.apLeft > 0) {
        ctx.fillStyle = '#e0a04a';
        ctx.beginPath();
        ctx.roundRect(x + 296, y + 32, 92, 22, 11);
        ctx.fill();
        text(ctx, `${m.apLeft} AP · ${document.body.classList.contains('touch') ? 'Bag' : 'I'}`, x + 342, y + 43.5, 11, '#ffffff');
      }
      // (Momentum's stacks and Arcane Charge's charges are in the status box now: src/status.js)
      if (this.flash > 0) {
        ctx.fillStyle = `rgba(255,60,90,${this.flash * 0.18})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
    const den = denAt(this.room);
    if (this.ult && den) {
      const k = clamp(1 - (this.time - this.ult.at) / this.ult.dur, 0, 1);
      drawUltBanner(ctx, this.ult.boss, this.ult.name, this.ult.hint, k, this.time);
    }
    if (den) {
      const b = this.boss();
      if (b) {
        const k = MOBS[b.kind];
        ctx.save();
        ctx.translate(100, 84); // its own row: right of the HP/MP panel, under the top pills
        drawBossBar(ctx, k.name, k.lvl, Math.max(0, this.shownHp(b)), b.maxHp, b.enraged, this.time);
        ctx.restore();
        if (b.shield !== undefined) {
          // Pyra's Rebirth egg: break it before the timer runs out
          const x = W / 2 - 160, y = 170;
          ctx.fillStyle = 'rgba(255,255,255,0.88)';
          ctx.beginPath();
          ctx.roundRect(x - 8, y - 6, 336, 30, 15);
          ctx.fill();
          bar(ctx, x, y, 320, 18, b.shield / b.shieldMax, '#ffb347');
          text(ctx, `EGG ${b.shield} / ${b.shieldMax}: BREAK IT!`, x + 160, y + 9.5, 11, '#6b3a10');
        }
      } else if (this.bossBack > 0) {
        const label = `${MOBS[den.boss].name} returns in ${this.bossBack}s`;
        ctx.font = `700 15px ${FONT}`;
        const w = ctx.measureText(label).width + 30;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.roundRect(W / 2 - w / 2, 58, w, 30, 15);
        ctx.fill();
        text(ctx, label, W / 2, 73, 15, '#5b4a6b');
      }
    }
    if (this.still) {
      const left = Math.max(0, this.still.until - this.time);
      ctx.font = `700 34px ${FONT}`;
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(30,30,60,0.8)';
      ctx.textAlign = 'center';
      ctx.strokeText("TIME STOP: DON'T MOVE", W / 2, H * 0.42);
      text(ctx, "TIME STOP: DON'T MOVE", W / 2, H * 0.42, 34, '#dfe8ff');
      text(ctx, left.toFixed(1), W / 2, H * 0.42 + 40, 22, '#ffe28a');
    }
    this.drawMeter(ctx, den);
    let row = 0;
    const top = den ? (this.boss()?.shield !== undefined ? 210 : 172) : 128; // under the boss bar (and the egg's) in a den
    for (const t of this.toasts) {
      const k = (this.time - t.at) / 3;
      if (k > 1) continue;
      ctx.globalAlpha = Math.min(1, (1 - k) * 4, k * 20);
      ctx.font = `700 15px ${FONT}`;
      const w = ctx.measureText(t.text).width + 30;
      ctx.fillStyle = 'rgba(45,42,62,0.78)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - w / 2, top + row * 36, w, 30, 15);
      ctx.fill();
      text(ctx, t.text, W / 2, top + 15 + row * 36, 15, /Level up|defeated/.test(t.text) ? '#ffe28a' : '#ffffff');
      ctx.globalAlpha = 1;
      row++;
    }
  }

  // The damage meter: who's done how much to this den's boss (kept up after the kill, until it's back), or
  // to the field boss fought last in this room. Right side, under the top-right buttons (and the boss bar).
  // Under the damage, once anyone has some (S3): healing done (the Cleric's part) and damage taken (the
  // Knight's), the top few of each.
  drawMeter(ctx, den) {
    let e = null;
    for (const v of this.dmg.values()) if (den ? v.kind === den.boss : this.time - v.at < 30 && (!e || v.at > e.at)) e = v;
    if (!e) return;
    const me = this.slimeOf(this.myId)?.name;
    const section = (list, n) => {
      const mine = list.findIndex(([name]) => name === me), rows = list.slice(0, n).map((r, i) => [i, ...r]);
      if (mine >= n) rows.push([mine, ...list[mine]]); // (you're always on it)
      return { rows, total: list.reduce((a, [, v]) => a + v, 0) || 1 };
    };
    const parts = [[`Damage · ${MOBS[e.kind].name}`.slice(0, 30), section(e.d, 5), 'rgba(255,143,177,0.6)']];
    if (e.h?.length) parts.push(['Healing', section(e.h, 3), 'rgba(110,214,160,0.7)']);
    if (e.k?.length) parts.push(['Damage taken', section(e.k, 3), 'rgba(130,170,240,0.65)']);
    const w = 196, x = W - 16 - w, y = 182, rh = 19; // (under the boss bar, and the controls line on phones)
    const h = 12 + parts.reduce((n, [, sec]) => n + 18 + sec.rows.length * rh, 0);
    ctx.fillStyle = 'rgba(45,32,60,0.78)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    let ry = y + 14;
    for (const [title, { rows, total }, color] of parts) {
      text(ctx, title, x + 10, ry, 11, 'rgba(255,255,255,0.8)', 'left');
      ry += 12;
      for (const [i, name, v] of rows) {
        const share = v / total, you = name === me;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.roundRect(x + 8, ry, w - 16, rh - 4, 5);
        ctx.fill();
        ctx.fillStyle = you ? 'rgba(255,211,77,0.75)' : color;
        ctx.beginPath();
        ctx.roundRect(x + 8, ry, Math.max(6, (w - 16) * share), rh - 4, 5);
        ctx.fill();
        text(ctx, `${i + 1}. ${name}`.slice(0, 16), x + 13, ry + 8, 11, '#fffaf0', 'left');
        text(ctx, `${v >= 10000 ? `${(v / 1000).toFixed(v >= 100000 ? 0 : 1)}k` : v.toLocaleString()} · ${Math.round(share * 100)}%`, x + w - 13, ry + 8, 11, '#fffaf0', 'right');
        ry += rh;
      }
      ry += 6;
    }
  }

  // Someone in the room got hurt
  // dot: a curse's burn (S5.2): a small violet number, no wince or flash
  hurt(s, dmg, isMe, dot = false) {
    if (!s) return;
    if (dot) return this.pop(s.x, s.y - 60, `-${dmg}`, '#c49ae8', isMe ? 16 : 13);
    s.wince();
    this.pop(s.x, s.y - 60, `-${dmg}`, '#ff6f6f', isMe ? 22 : 17);
    if (isMe) {
      audio.sfx('hurt');
      this.flash = 1;
    }
  }

  // ——— the hotbar: 6 skills (1–6) and 3 potions (7–9), HTML so it can be clicked and tapped ———
  buildHotbar() {
    this.hb = document.getElementById('hotbar');
    this.hbSlots = [];
    const make = (bar, i, key) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `hb-slot hb-${bar}`;
      b.innerHTML = '<canvas></canvas><span class="hb-cd"></span><span class="hb-key"></span><span class="hb-n"></span>';
      b.querySelector('.hb-key').textContent = key;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onSlot?.(bar, i);
      });
      b.addEventListener('contextmenu', (e) => e.preventDefault());
      this.hb.append(b);
      this.hbSlots.push({ b, bar, i, drawn: undefined, cd: b.querySelector('.hb-cd'), n: b.querySelector('.hb-n') });
    };
    for (let i = 0; i < HOTBAR; i++) make('skill', i, String(i + 1));
    const gap = document.createElement('span');
    gap.className = 'hb-gap';
    this.hb.append(gap);
    for (let i = 0; i < POTBAR; i++) make('pot', i, String(HOTBAR + i + 1));
  }
  // the other hotbar setup, from the Esc menu only (shown at once; the server keeps both)
  swapHotbar() {
    const m = this.me;
    if (!m?.alt) return;
    [m.hotbar, m.alt.hotbar] = [m.alt.hotbar, m.hotbar];
    [m.potbar, m.alt.potbar] = [m.alt.potbar, m.potbar];
    m.set ^= 1;
    this.send({ t: 'hotswap' });
    audio.sfx('equip');
    this.toast(`Hotbar setup ${m.set + 1}`);
  }
  slotContent(bar, i) {
    return (bar === 'pot' ? this.me?.potbar : this.me?.hotbar)?.[i] ?? null;
  }
  // "Put on hotbar" (skill tree / bag): the next slot of that bar you press gets it
  startAssign(bar, id) {
    this.assign = { bar, id };
    this.toast(`Now press a ${bar === 'pot' ? 'potion' : 'skill'} slot on the hotbar (${bar === 'pot' ? '7–9' : '1–6'})`);
  }
  // → true if this press was used to place something
  finishAssign(bar, i) {
    const a = this.assign;
    if (!a || a.bar !== bar) return false;
    this.assign = null;
    const same = this.slotContent(bar, i) === a.id;
    this.send({ t: 'hotbar', bar, slot: i, id: same ? null : a.id });
    const list = bar === 'pot' ? this.me.potbar : this.me.hotbar; // show it straight away
    for (let j = 0; j < list.length; j++) if (list[j] === a.id) list[j] = null;
    list[i] = same ? null : a.id;
    audio.sfx('equip');
    return true;
  }
  updateHotbar(room) {
    if (!this.hb) return;
    const show = !!this.me && (isCombat(room) || !!this.assign);
    this.hb.hidden = !show;
    if (!show) return;
    this.hb.classList.toggle('assigning', !!this.assign);
    for (const s of this.hbSlots) {
      const id = this.slotContent(s.bar, s.i);
      s.b.classList.toggle('target', !!this.assign && this.assign.bar === s.bar);
      if (s.drawn !== id) {
        s.drawn = id;
        const c = s.b.firstChild, dpr = Math.min(2, devicePixelRatio || 1), size = s.b.clientWidth || 44;
        c.width = c.height = Math.round(size * dpr);
        const g = c.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, size, size);
        if (id && s.bar === 'skill') drawSkillIcon(g, id, size / 2, size / 2, size * 0.86);
        if (id && s.bar === 'pot') drawItemIcon(g, id, size / 2, size / 2, size * 0.78);
        s.b.title = id ? (SKILLS[id]?.name ?? ITEMS[id]?.name) : 'Empty';
      }
      if (s.bar === 'skill' && SKILLS[id]?.kind === 'move') {
        // Dash / Blink: their cooldowns live in the physics state
        const me = this.net.me, r = rankOf(this.me.skills, id), ph = 1 - PHANTOM_CD * rankOf(this.me.skills, 'phantom_step');
        const left = id === 'dash' ? me.dc : me.bc, full = Math.round((id === 'dash' ? DASH_CD : BLINK_CD)[Math.max(1, r)] * ph);
        s.cd.style.height = left > 0 ? `${Math.min(100, (left / full) * 100)}%` : '0%';
        s.b.classList.toggle('dim', !r);
        s.n.textContent = '';
      } else if (s.bar === 'skill') {
        const sk = SKILLS[id], cd = id ? this.cooldown(id) : 0;
        s.cd.style.height = sk && cd > 0 ? `${(cd / sk.cd) * 100}%` : '0%';
        s.b.classList.toggle('dim', !!sk && (!rankOf(this.me.skills, id) || this.me.mp < sk.mp));
        s.b.classList.toggle('on', !!sk?.toggle && !!this.me.shield); // a toggle that's switched on (Mana Shield)
        s.n.textContent = '';
      } else {
        const n = id ? this.me.bag.filter((b) => b.id === id).reduce((a, b) => a + b.n, 0) : 0;
        s.n.textContent = id ? String(n) : '';
        s.b.classList.toggle('dim', !!id && !n);
      }
    }
  }

  // ——— inventory (I) ———
  get isOpen() {
    return !this.el.hidden;
  }
  toggle() {
    if (this.isOpen) this.close();
    else {
      this.el.hidden = false;
      this.render();
      this.onOpenChange(true);
    }
  }
  close() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.selected = -1;
    this.onOpenChange(false);
  }

  slotButton(parent, key) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'inv-slot';
    const c = document.createElement('canvas');
    b.append(c);
    const n = document.createElement('span');
    n.className = 'inv-n';
    b.append(n);
    b.onclick = () => {
      if (this.selected === key) this.primary(key); // second tap: equip / use / take off
      else {
        this.selected = key;
        this.render();
      }
    };
    parent.append(b);
    return b;
  }
  itemAt(key) {
    const m = this.me;
    if (!m) return null;
    if (key === 'helmet' || key === 'weapon') return m.gear[key] ? { id: m.gear[key], n: 1, worn: true, e: m.gearE?.[key] } : null;
    return m.bag[key] ?? null;
  }
  primary(key) {
    const b = this.itemAt(key);
    if (!b) return;
    const it = ITEMS[b.id];
    if (b.worn) this.act('unequip', key);
    else if (isGear(b.id)) this.act('equip', key);
    else if (it.kind === 'potion') this.act('use', key);
  }
  act(t, slot) {
    const m = this.me, b = this.itemAt(slot);
    if (t === 'equip' && b && gearSlotOf(b.id) === 'weapon' && !weaponOk(m.cls, b.id)) {
      // a class wields only its own weapon kind (src/shared/skills.js CLASSES)
      this.toast(`${aOrAn(CLASSES[m.cls].name).replace(/^a/, 'A')} can only wield ${aOrAn(CLASSES[m.cls].weapon)} (change class at the Rebirth Pool)`);
      return audio.sfx('error');
    }
    this.send({ t, slot });
    audio.sfx(t === 'use' ? (ITEMS[b?.id]?.mana ? 'mpPotion' : 'potion') : t === 'drop' ? 'pickup' : 'equip');
    // show it straight away (the server's 'me' follows)
    if (t === 'equip' && b) {
      const kind = gearSlotOf(b.id), old = m.gear[kind];
      m.gear = { ...m.gear, [kind]: b.id };
      if (old) m.bag[slot] = { id: old, n: 1 };
      else m.bag.splice(slot, 1);
      this.onGear?.(m.gear);
    } else if (t === 'unequip' && b) {
      m.bag.push({ id: b.id, n: 1 });
      m.gear = { ...m.gear, [slot]: null };
      this.onGear?.(m.gear);
    }
    if (t !== 'use' || (b?.n ?? 0) <= 1) this.selected = -1;
    this.render();
  }
  // A scroll in the bag: one button per weapon / helmet it can go on (worn first). Dark scrolls ask twice.
  scrollButtons(sel, button) {
    const m = this.me, slot = this.selected, sc = ITEMS[sel.id];
    const options = [];
    for (const k of ['weapon', 'helmet']) if (m.gear[k] && canScroll(sel.id, m.gear[k])) options.push([k, m.gear[k], m.gearE?.[k], 'worn']);
    m.bag.forEach((b, i) => canScroll(sel.id, b.id) && options.push([i, b.id, b.e, 'bag']));
    if (!options.length) return button(sc.slot === 'helmet' ? 'No helmet to use it on' : sc.slot === 'weapon' ? 'No weapon to use it on' : 'No gear to use it on', () => {});
    for (const [target, id, e, where] of options.slice(0, 4)) {
      const left = slotsOf(id) - (e?.u ?? 0);
      const arming = this.confirm?.slot === slot && this.confirm?.target === target;
      const label = arming ? `Sure? It may DESTROY ${ITEMS[id].name}` : `Use on ${enhName(id, e)}${where === 'worn' ? ' (worn)' : ''} · ${left} left`;
      button(label, () => {
        if (left <= 0) return this.toast(`${enhName(id, e)} has no upgrade slots left`), audio.sfx('error');
        if (sc.dark && !arming) {
          this.confirm = { slot, target };
          return this.render();
        }
        this.confirm = null;
        this.send({ t: 'scroll', slot, target });
        audio.sfx('scrollUse');
        this.selected = -1;
      });
    }
  }
  // a potion from the hotbar (7–9)
  drink(id) {
    const m = this.me, it = ITEMS[id];
    if (!m || !it) return;
    const b = m.bag.find((x) => x.id === id);
    if (!b) {
      this.toast(`You're out of ${it.name}`);
      return audio.sfx('error');
    }
    if ((it.heal && !it.mana && m.hp >= m.maxHp) || (it.mana && !it.heal && m.mp >= m.maxMp)) {
      this.toast("You're already full");
      return audio.sfx('error');
    }
    this.send({ t: 'use', item: id });
    audio.sfx(it.buff ? 'buff' : it.mana ? 'mpPotion' : 'potion');
    if (it.heal) m.hp = Math.min(m.maxHp, m.hp + it.heal); // shown at once; the server's 'me' follows
    if (it.mana) m.mp = Math.min(m.maxMp, m.mp + it.mana);
    if (it.full) [m.hp, m.mp] = [m.maxHp, m.maxMp]; // (a brewed Starlotus Elixir)
    b.n--;
  }

  render() {
    const m = this.me;
    if (!m) return;
    document.getElementById('inv-stats').textContent = `Lv ${m.lvl} · HP ${Math.ceil(m.hp)}/${m.maxHp} · MP ${Math.floor(m.mp)}/${m.maxMp} · DEF ${m.def}`;
    this.renderAp();
    document.getElementById('inv-coins').textContent = `${m.coins} gold`;
    this.renderStyle();
    const pvp = document.getElementById('inv-pvp');
    pvp.textContent = `Friendly fire: ${m.pvp ? 'on' : 'off'}`;
    pvp.classList.toggle('on', !!m.pvp);
    const paint = (b, key) => {
      const item = this.itemAt(key);
      const c = b.firstChild, dpr = Math.min(2, devicePixelRatio || 1), size = b.clientWidth || 48;
      c.width = c.height = Math.round(size * dpr);
      const g = c.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, size, size);
      if (item) drawItemIcon(g, item.id, size / 2, size / 2, size * 0.78);
      b.lastChild.textContent = item && item.n > 1 ? item.n : item?.e?.s ? `+${item.e.s}` : '';
      b.classList.toggle('on', this.selected === key);
      b.classList.toggle('empty', !item);
      b.title = item ? ITEMS[item.id].name : '';
    };
    this.slots.forEach((b, i) => paint(b, i));
    for (const k of ['helmet', 'weapon']) paint(this.gearSlots[k], k);

    this.info.replaceChildren();
    const sel = this.itemAt(this.selected);
    if (!sel) {
      const p = document.createElement('p');
      p.className = 'inv-hint';
      p.textContent = 'Tap an item to see it. Tap it again to equip or use it.';
      this.info.append(p);
      return;
    }
    const it = ITEMS[sel.id];
    const h = document.createElement('b');
    h.textContent = enhName(sel.id, sel.e) + (sel.n > 1 ? ` ×${sel.n}` : '');
    const d = document.createElement('p');
    const e = sel.e ?? {}, gear = isGear(sel.id);
    const bonus = [['atk', 'ATK'], ['magic', 'MAGIC'], ['def', 'DEF'], ['hp', 'HP']].filter(([k]) => e[k]).map(([k, n]) => `${n} +${e[k]}`).join(', ');
    d.textContent = it.desc + (it.atk ? ` ATK +${it.atk}.` : '') + (it.kind === 'sword' ? ` Reach +${it.reach}.` : '') + (it.magic && it.kind === 'staff' ? ` MAGIC +${it.magic}, MP +${it.mp}. Fires a bolt instead of swinging. Range ${STAFF_BOLT_RANGE + it.reach}.` : '') + (it.kind === 'bow' ? ` Shoots arrows instead of swinging. Range ${BOW_RANGE + it.reach}. Archers aim with DEX.` : '') + (it.def ? ` DEF +${it.def}.` : '')
      + (gear ? ` Upgrade slots: ${slotsOf(sel.id) - (e.u ?? 0)} of ${slotsOf(sel.id)} left${bonus ? ` (scrolled: ${bonus})` : ''}.` : '')
      + (it.price ? ` Sells for ${sellPrice(sel.id)} gold.` : '')
      + (it.legacy ? ' Legacy: the old version, from before Frostpeak, Emberdeep and the Aether Citadel grew stronger. It works as it always did, but nothing drops it any more.' : '');
    const row = document.createElement('div');
    row.className = 'inv-actions';
    const button = (label, fn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.onclick = fn;
      row.append(b);
    };
    if (sel.worn) button('Take off', () => this.act('unequip', this.selected));
    else {
      if (isGear(sel.id)) button('Equip', () => this.act('equip', this.selected));
      if (it.kind === 'scroll') this.scrollButtons(sel, button);
      if (it.kind === 'potion') {
        button('Use', () => this.act('use', this.selected));
        button('Put on hotbar', () => {
          this.startAssign('pot', sel.id);
          this.close();
        });
      }
      button('Drop', () => this.act('drop', this.selected));
    }
    this.info.append(h, d, row);
  }
}

// The bag's stat column (MapleStory style): ability points into STR / DEX / INT / LUK, + to add and − to
// take back (free, any time), a step of 1 / 10 / all, and the damage ranges they give
Rpg.prototype.renderAp = function () {
  const m = this.me, col = document.getElementById('inv-ap');
  if (!m.ap) return col.replaceChildren();
  this.apStep ??= 1;
  col.replaceChildren();
  const el = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  const btn = (label, cls, fn, off) => {
    const b = el('button', cls, label);
    b.type = 'button';
    b.disabled = !!off;
    b.onclick = fn;
    return b;
  };
  const head = el('div', 'ap-head');
  head.append(el('b', null, 'Stats'), el('span', m.apLeft > 0 ? 'ap-left on' : 'ap-left', `${m.apLeft} AP left`));
  col.append(head);
  const amount = (up, k) => (this.apStep === 'all' ? (up ? m.apLeft : apOf(m.ap, k)) : Math.min(this.apStep, up ? m.apLeft : apOf(m.ap, k)));
  for (const st of AP_STATS) {
    const row = el('div', 'ap-row');
    row.title = st.desc;
    const name = el('div', 'ap-name');
    name.append(el('b', null, st.name), el('small', null, st.short));
    const val = el('span', 'ap-val', String(apOf(m.ap, st.id)));
    const change = (up) => () => {
      const n = amount(up, st.id);
      if (!n) return;
      this.send({ t: 'ap', stat: st.id, n: up ? n : -n });
      audio.sfx(up ? 'skillUp' : 'reset');
    };
    row.append(name, val, btn('−', 'ap-btn minus', change(false), !apOf(m.ap, st.id)), btn('+', 'ap-btn', change(true), m.apLeft <= 0));
    col.append(row);
  }
  const steps = el('div', 'ap-steps');
  steps.append(el('span', null, 'Step'));
  for (const s of [1, 10, 'all']) {
    const b = btn(s === 'all' ? 'All' : String(s), 'style-chip' + (this.apStep === s ? ' on' : ''), () => {
      this.apStep = s;
      this.render();
    });
    steps.append(b);
  }
  steps.append(btn('Reset', 'style-chip ap-reset', () => {
    this.send({ t: 'ap', reset: true });
    audio.sfx('reset');
  }, !Object.values(m.ap).some((v) => v > 0)));
  col.append(steps);
  // damage ranges: the bar spans 0 → the biggest crit; the bright part is a normal hit, the pale part a crit
  const lo = m.minRoll ?? MIN_ROLL, crit = m.critMult ?? 1.6;
  const range = (label, base, color) => {
    const box = el('div', 'ap-dmg');
    const top = el('div', 'ap-dmg-top');
    top.append(el('b', null, label), el('span', null, `${Math.max(1, Math.round(base * lo))} ~ ${Math.round(base * MAX_ROLL)}`));
    const barEl = el('div', 'ap-bar'), full = MAX_ROLL * crit;
    const seg = (a, b, cls) => {
      const d = el('i', cls);
      d.style.left = `${(a / full) * 100}%`;
      d.style.width = `${((b - a) / full) * 100}%`;
      d.style.background = color;
      barEl.append(d);
    };
    seg(lo, MAX_ROLL, 'hit');
    seg(lo * crit, MAX_ROLL * crit, 'crit');
    const foot = el('small', null, `crit ${Math.round(base * lo * crit)} ~ ${Math.round(base * full)}`);
    box.append(top, barEl, foot);
    col.append(box);
  };
  range('ATK', m.atk, '#e0806a');
  range('MAGIC', m.magic, '#7a8cf0');
  col.append(el('p', 'ap-foot', `Crit ${Math.round((m.crit ?? 0.12) * 1000) / 10}% · ×${Math.round(crit * 100) / 100} · steady ${Math.round(lo * 100)}%`));
};

// The bag's Style row: Boutique cosmetics to wear in any mix, and whether the helmet shows over them
Rpg.prototype.renderStyle = function () {
  const m = this.me, row = document.getElementById('inv-style');
  row.replaceChildren();
  const chip = (label, on, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'style-chip' + (on ? ' on' : '');
    b.textContent = label;
    b.onclick = fn;
    row.append(b);
  };
  const label = document.createElement('span');
  label.textContent = 'Style:';
  row.append(label);
  if (!m.cosmetics.length) {
    const p = document.createElement('span');
    p.className = 'style-none';
    p.textContent = 'buy accessories in the Boutique at Pip\'s shop';
    row.append(p);
  }
  for (const id of m.cosmetics) {
    const on = m.wear.includes(id);
    chip(COSMETICS[id].name, on, () => {
      m.wear = on ? m.wear.filter((w) => w !== id) : [...m.wear, id];
      this.send({ t: 'wear', id, on: !on });
      audio.sfx('equip');
      this.onGear?.(m.gear);
      this.render();
    });
  }
  chip(m.showHelmet ? 'Helmet: shown' : 'Helmet: hidden', m.showHelmet, () => {
    m.showHelmet = !m.showHelmet;
    this.send({ t: 'showhelm', on: m.showHelmet });
    this.onGear?.(m.gear);
    this.render();
  });
};

export function bar(ctx, x, y, w, h, f, color) {
  ctx.fillStyle = 'rgba(60,45,80,0.25)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  if (f > 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(h, w * clamp(f, 0, 1)), h, h / 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 1.5, Math.max(0, w * clamp(f, 0, 1) - 6), h * 0.3, h * 0.15);
  ctx.fill();
}
