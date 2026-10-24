// Docs: docs/combat/bosses.md
// S5's party mechanics on the client (story/s5-plan.md; rules in server/rpg.js partyTick, numbers in PARTY and
// the constants after it in src/shared/rpg.js). The server says which mechanics are on for each boss
// ({t:'party'}: bits in PARTY_MECHS order, who the focus is on, and S5.2's stagger, shield phase, weak point and
// who's cursed); this draws them, predicts what they do to our hits (mod) and names the answer the first few
// times (PARTY_HINTS). S5.1: the focus (a red line and a reticle) and the pulse (rings closing in, a flash).
// S5.2: the curse (a sigil on the floor, then dark wisps over the cursed), the barrier (a rune dome), the armour
// (a shell of plates that cracks), the weak point (a glowing crystal high on the boss), the stagger (stars round
// its head) and the interrupt (an ultimate frozen out: the banner goes).
import { TAU } from './util.js';
import { text } from './village.js';
import { glow } from './glow.js';
import { audio } from './audio.js';
import { MOBS, DEN_W, partyBit, PARTY_HINTS, partyHitMult, weakOf, weakReach, ARMOUR_CRACKS } from './shared/rpg.js';
import { rankOf } from './shared/skills.js';

const RED = '232,64,92', CURSE = '96,52,140', DOME = '150,170,255', WEAK = '255,214,120';
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";

export class Party {
  constructor(rpg) {
    this.rpg = rpg;
    this.bosses = new Map(); // boss id → { on, focus (slime id), until (rpg.time), at (when heard, performance.now), stUntil, stQueued, sh, wk }
    this.pulses = []; // { mob, warnAt, at } a pulse on its way; { mob, hitAt } one going off
    this.sigils = []; // a curse on its way: { mob, x, y, r, at, end } (rpg.time); hit: the burst
    this.curses = new Map(); // slime id → curse stacks (anyone in the room)
    this.told = {}; // hint → how many times this session
    this.last = new Map(); // boss id → who its focus was last on (so a repeat of the same isn't news)
    this.said = 0; // when we last popped "BARRIER" / "ARMOUR" over a cut hit (rpg.time)
  }
  clear() {
    this.bosses.clear();
    this.last.clear();
    this.curses.clear();
    this.pulses = [];
    this.sigils = [];
  }
  // {t:'party', id, on, f?, fl?, st?, sh?, wk?, cu?}
  receive(m) {
    const r = this.rpg, was = this.last.get(m.id), t = r.time;
    if (m.cu) for (const [id, n] of m.cu) this.curses.set(id, n);
    if (!m.on) return this.bosses.delete(m.id);
    const focus = m.f ?? null;
    this.bosses.set(m.id, {
      on: m.on, focus, until: focus ? t + (m.fl ?? 0) / 1000 : 0, at: performance.now(),
      stUntil: m.st > 0 ? t + m.st / 1000 : 0, stQueued: m.st === -1,
      sh: m.sh ? { kind: m.sh[0] === 'b' ? 'barrier' : 'armour', from: t + m.sh[1] / 1000, until: t + m.sh[2] / 1000, v: m.sh[3] } : null,
      wk: m.wk ? { until: t + m.wk[0] / 1000, fill: m.wk[1] } : null,
    });
    this.last.set(m.id, focus);
    if (focus && focus !== was) this.focusMoved(focus);
  }
  // {t:'curse', id, n}: someone's curse stacks (0: lifted)
  curse(m) {
    const r = this.rpg, had = this.curses.get(m.id) ?? 0;
    if (m.n > 0) this.curses.set(m.id, m.n);
    else this.curses.delete(m.id);
    const s = r.slimeOf(m.id);
    if (!m.n && had && s && (m.id === r.myId || s.visible !== false)) r.pop(s.x, s.y - 80, 'CURSE LIFTED', '#e4d4ff', m.id === r.myId ? 18 : 15);
    if (m.id === r.myId && m.n > had) {
      const cleric = rankOf(r.me?.skills, 'cleanse');
      this.tell('cursed', cleric ? 'You are cursed: your hits are softer and it burns. Cleanse it (or step well back to let it fade)' : 'You are cursed: your hits are softer and it burns. A Cleric can Cleanse it, a Cleansing Tonic lifts it, or step well back to let it fade');
    } else if (m.n > had && rankOf(r.me?.skills, 'cleanse')) this.tell('cursedFriend', 'A friend is cursed (the dark wisps): Cleanse lifts it');
  }
  // → is mechanic `mech` on for boss `id` (or any boss here)?
  on(mech, id) {
    const bit = partyBit(mech);
    if (id !== undefined) return !!((this.bosses.get(id)?.on ?? 0) & bit);
    for (const b of this.bosses.values()) if (b.on & bit) return true;
    return false;
  }
  // the focus: how long it stays on slime id (s; 0 if it isn't on them)
  focusOn(id) {
    let left = 0;
    for (const b of this.bosses.values()) if (b.focus === id) left = Math.max(left, b.until - this.rpg.time);
    return left;
  }
  focusLeft() {
    return this.focusOn(this.rpg.myId);
  }
  // who the focus is on (a slime id), if anyone
  focused() {
    for (const b of this.bosses.values()) if (b.focus && b.until > this.rpg.time) return b.focus;
    return null;
  }
  // slime id's curse stacks
  cursedN(id) {
    return this.curses.get(id) ?? 0;
  }
  // an open weak point here: { v, spot } of the nearest boss with one, or null
  weakOpen() {
    const r = this.rpg;
    for (const [id, b] of this.bosses) {
      const v = r.views.get(id);
      if (v && b.wk && b.wk.until > r.time) return { v, spot: weakOf(MOBS[v.kind], v.x, v.y, v.facing) };
    }
    return null;
  }
  // S5.2: what boss v's mechanics do to our hit of kinds { magic, heavy, arrow } from a slime whose feet are at y
  // → [multiplier, weak] (weak: it's on the weak point: the hit carries h[4]). The server caps it the same way.
  mod(v, { magic = false, heavy = false, arrow = false } = {}, y = 0) {
    const b = this.bosses.get(v?.id);
    if (!b) return [1, false];
    const t = this.rpg.time, sh = b.sh && t >= b.sh.from && t < b.sh.until ? b.sh.kind : null;
    const weak = !!(b.wk && b.wk.until > t) && weakReach(weakOf(MOBS[v.kind], v.x, v.y, v.facing), y, arrow);
    const k = partyHitMult({ stag: b.stUntil > t, shield: sh }, { magic, heavy, weak });
    // a word over it now and then: what cut the hit, or that it found the spot
    if (t - this.said > 0.7 && ((sh === 'barrier' && !magic) || (sh === 'armour' && !heavy) || weak)) {
      this.said = t;
      const kk = MOBS[v.kind];
      if (weak) this.rpg.pop(v.x, v.y - kk.h - 46, 'WEAK POINT!', '#ffe08a', 17);
      else this.rpg.pop(v.x, v.y - kk.h - 30, sh === 'barrier' ? 'WARDED' : 'ARMOURED', '#b8c4ff', 14);
      if (!weak) audio.sfx('shellBlock', { vol: 0.5 });
    }
    return [k, weak];
  }
  tell(key, line) {
    if ((this.told[key] = (this.told[key] ?? 0) + 1) <= PARTY_HINTS) this.rpg.toast(line);
  }
  focusMoved(id) {
    const r = this.rpg;
    if (id === r.myId) {
      audio.sfx('bossWarn', { vol: 0.5 });
      this.tell('focusMe', 'The boss has locked onto you! Keep moving and Dash clear of its hits');
    } else if (rankOf(r.me?.skills, 'rally')) this.tell('focusRally', "The boss is after a friend: your Rally pulls its focus onto you");
    else this.tell('focusOther', 'The boss has locked onto a friend (the red line): hit it while it chases them');
  }
  // boss events → true if handled: 'pulseWarn' {dur}, 'pulseHit', S5.2's 'curseWarn' {cx, r, dur}, 'curseHit',
  // 'shieldUp' {kind, dur}, 'shieldBreak' / 'shieldDrop' {kind}, 'crack' {n}, 'weakOpen', 'weakBreak',
  // 'stagger' {dur}, 'ultCancel' {by}
  event(m, pan) {
    const r = this.rpg, t = r.time, me = r.me, cls = me?.cls, v = r.views.get(m.id), k = MOBS[v?.kind] ?? MOBS.sprout_king;
    const b = this.bosses.get(m.id), head = (v?.y ?? m.y) - k.h;
    if (m.a === 'pulseWarn') {
      this.pulses.push({ mob: m.id, warnAt: t, at: t + m.dur });
      audio.sfx('phaseOut', { pan, vol: 0.7 });
      const cleric = cls === 'cleric', knight = rankOf(me?.skills, 'jelly_bubble') || rankOf(me?.skills, 'sanctuary');
      this.tell('pulse', cleric ? 'A pulse is coming that nobody can dodge: Barrier and heals now!' : knight ? 'A pulse is coming that nobody can dodge: Bubble or Sanctuary takes it' : 'A pulse is coming that nobody can dodge: top up your HP, or drink a Barrier Draught first (a Cleric\'s Barrier soaks it)');
      return true;
    }
    if (m.a === 'pulseHit') {
      this.pulses = this.pulses.filter((p) => p.mob !== m.id || p.hitAt);
      this.pulses.push({ mob: m.id, hitAt: t });
      audio.sfx('pulse', { pan });
      r.flash = Math.max(r.flash ?? 0, 0.6);
      return true;
    }
    if (m.a === 'curseWarn') {
      const floor = k.boss ? 450 : m.y;
      this.sigils.push({ mob: m.id, x: m.cx, y: floor, r: m.r, at: t, end: t + m.dur });
      audio.sfx('bossWarn', { pan, vol: 0.45 });
      this.tell('curseWarn', 'A dark sigil on the floor: step out of it before it closes, or it curses you');
      return true;
    }
    if (m.a === 'curseHit') {
      const s = this.sigils.find((q) => q.mob === m.id && !q.hit);
      if (s) Object.assign(s, { hit: t, end: t + 0.7 });
      audio.sfx('phaseOut', { pan, vol: 0.6 });
      return true;
    }
    if (m.a === 'shieldUp') {
      audio.sfx(m.kind === 'barrier' ? 'bubble' : 'shellBlock', { pan });
      if (m.kind === 'barrier') this.tell('barrier', cls === 'mage' || cls === 'cleric' ? 'A rune barrier! Blades barely scratch it, but your spells break it: break it to stagger the boss' : 'A rune barrier! Your hits do little through it: a Mage\'s spells break it, or wait it out');
      else this.tell('armour', rankOf(me?.skills, 'sky_splitter') || rankOf(me?.skills, 'blade_storm') || rankOf(me?.skills, 'snipe') ? 'Armour! Small hits glance off: your heavy hits crack it' : 'Armour! Small hits glance off: heavy hits (Sky Splitter, Blade Storm, Snipe, a shatter) crack it, or wait it out');
      return true;
    }
    if (m.a === 'shieldBreak') {
      if (v) r.fx.spawn('shatter', { x: v.x, y: v.y - k.h / 2, r: Math.max(40, k.w * 0.75) });
      r.pop(m.x, head - 22, m.kind === 'barrier' ? 'BARRIER BROKEN!' : 'ARMOUR BROKEN!', '#e8ecff', 20);
      audio.sfx('eggBreak', { pan });
      if (b) b.sh = null;
      return true;
    }
    if (m.a === 'shieldDrop') {
      if (b) b.sh = null;
      return true;
    }
    if (m.a === 'crack') {
      r.pop(m.x + (Math.random() - 0.5) * 40, head - 34, `CRACK ${m.n}/${ARMOUR_CRACKS}`, '#f4dcb0', 17);
      audio.sfx('crit', { pan, vol: 0.7 });
      return true;
    }
    if (m.a === 'weakOpen') {
      audio.sfx('mark', { pan, vol: 0.6 });
      this.tell('weak', cls === 'archer' ? 'A weak point is glowing on the boss: your arrows reach it from anywhere (Hunter\'s Mark keeps it open)' : 'A weak point is glowing high on the boss: jump and hit it (arrows reach it from anywhere)');
      return true;
    }
    if (m.a === 'weakBreak') {
      if (v) r.fx.spawn('shatter', { x: v.x, y: v.y - k.h * 0.9, r: 40 });
      audio.sfx('eggBreak', { pan, vol: 0.8 });
      if (b) b.wk = null;
      return true;
    }
    if (m.a === 'stagger') {
      if (b) Object.assign(b, { stUntil: t + m.dur, stQueued: false });
      r.pop(m.x, head - 64, 'STAGGERED!', '#ffe9a0', 26);
      audio.sfx('bossRoar', { pan, vol: 0.6 });
      this.tell('stagger', 'Staggered! It takes more damage for a few seconds: everyone hit it now');
      return true;
    }
    if (m.a === 'ultCancel') {
      const u = r.ult;
      r.ult = null; // (the banner goes, for everyone)
      if (u) r.bossFx.list = r.bossFx.list.filter((e) => e.kind !== `${u.kind}Warn`);
      r.pop(m.x, head - 100, 'INTERRUPTED!', '#bfe8ff', 26);
      audio.sfx('eggBreak', { pan });
      const by = m.by === r.myId ? 'Your freeze' : 'A freeze';
      r.toast(`${by} interrupted ${k.name}'s ultimate!`);
      return true;
    }
    if (m.a === 'die') this.bosses.delete(m.id);
    return false;
  }
  update() {
    const t = this.rpg.time;
    this.pulses = this.pulses.filter((p) => (p.hitAt ? t - p.hitAt < 0.8 : t < p.at + 1.5));
    this.sigils = this.sigils.filter((s) => t < s.end + (s.hit ? 0 : 1.5));
    const wall = performance.now(); // (wall time: a tab coming back from the background jumps rpg.time)
    for (const [id, b] of this.bosses) if (wall - b.at > 5000) this.bosses.delete(id); // (the server repeats it every 2 s)
  }

  // ——— drawing, in world space (after the mobs) ———
  draw(ctx) {
    const r = this.rpg, t = r.time;
    for (const s of this.sigils) drawSigil(ctx, s, t);
    for (const [id, b] of this.bosses) {
      const v = r.views.get(id);
      if (!v || r.killed.has(id)) continue;
      const k = MOBS[v.kind];
      if (b.sh && t < b.sh.until && t > b.sh.from - 1.6) drawShield(ctx, v, k, b.sh, t);
      if (b.wk && b.wk.until > t) drawWeak(ctx, weakOf(k, v.x, v.y, v.facing), b.wk, t, !!v.marked);
      if (b.stUntil > t) drawDizzy(ctx, v, k, t, b.stUntil - t);
      if (!b.focus || b.until <= t) continue;
      const s = r.slimeOf(b.focus);
      if (!s || (b.focus !== r.myId && s.visible === false)) continue;
      drawFocus(ctx, v, k, s, t, b.focus === r.myId);
    }
    for (const p of this.pulses) {
      const v = r.views.get(p.mob);
      if (!v) continue;
      const k = MOBS[v.kind], cx = v.x, cy = v.y - k.h * 0.5, reach = k.boss ? DEN_W : 900;
      if (p.hitAt) drawPulseHit(ctx, cx, cy, reach, (t - p.hitAt) / 0.8);
      else drawPulseWarn(ctx, cx, cy, k, reach, (t - p.warnAt) / Math.max(0.1, p.at - p.warnAt), t, p.at - t);
    }
  }
  // over the slimes (rpg.drawFx): the dark wisps of a curse on anyone cursed
  drawOver(ctx) {
    const r = this.rpg, t = r.time;
    for (const [id, n] of this.curses) {
      const s = r.slimeOf(id);
      if (s && (id === r.myId || s.visible !== false) && !s.down) drawWisps(ctx, s, n, t);
    }
  }
}

// The focus: a red dashed line from the boss's eyes to its slime, marching toward them, and a turning reticle
// over the slime (brighter when it's you)
function drawFocus(ctx, v, k, s, t, me) {
  const x0 = v.x, y0 = v.y - k.h * 0.55, x1 = s.x, y1 = s.y - 22;
  const pulse = 0.5 + 0.5 * Math.sin(t * 7);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(${RED},${0.18 + 0.12 * pulse})`;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.strokeStyle = `rgba(${RED},${0.75 + 0.25 * pulse})`;
  ctx.lineWidth = 4.5;
  ctx.setLineDash([16, 10]);
  ctx.lineDashOffset = -t * 60;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,236,240,0.85)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);
  // the reticle over the slime
  const cy = s.y - 62, rr = me ? 15 : 12, a = t * 1.6;
  glow(ctx, x1, cy, rr * 2, rr * 2, RED, 0.35 + 0.25 * pulse);
  ctx.strokeStyle = `rgba(${RED},0.95)`;
  ctx.lineWidth = me ? 3 : 2.4;
  ctx.beginPath();
  ctx.arc(x1, cy, rr, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const an = a + (i * TAU) / 4;
    ctx.moveTo(x1 + Math.cos(an) * rr * 0.55, cy + Math.sin(an) * rr * 0.55);
    ctx.lineTo(x1 + Math.cos(an) * rr * 1.5, cy + Math.sin(an) * rr * 1.5);
  }
  ctx.stroke();
  ctx.restore();
}

// The pulse on its way: rings closing in on the boss from across the room, a violet wash and "PULSE" with the
// seconds left over it (k: 0 → 1 over the warning)
function drawPulseWarn(ctx, x, y, kind, reach, k, t, left) {
  if (k > 1) return;
  ctx.save();
  const pulse = 0.5 + 0.5 * Math.sin(t * (6 + 12 * k));
  for (let i = 0; i < 3; i++) {
    const f = 1 - ((k * 1.6 + i / 3) % 1), rad = kind.w * 0.6 + f * reach;
    ctx.strokeStyle = `rgba(176,110,255,${(0.15 + 0.5 * k) * (1 - f * 0.6)})`;
    ctx.lineWidth = 4 + 6 * k;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, TAU);
    ctx.stroke();
  }
  glow(ctx, x, y, kind.w * (0.8 + 0.4 * k), kind.w * (0.8 + 0.4 * k), '190,130,255', 0.4 + 0.4 * pulse * k);
  outlined(ctx, `PULSE ${Math.max(0, left).toFixed(1)}`, x, y - kind.h * 0.6 - 30, 20, '#f1e4ff', 'rgba(40,20,70,0.75)');
  ctx.restore();
}
// The pulse going off: a bright ring racing out across the room (f: 0 → 1)
function drawPulseHit(ctx, x, y, reach, f) {
  if (f > 1) return;
  const rad = 40 + f * reach, a = 1 - f;
  ctx.save();
  ctx.strokeStyle = `rgba(160,100,250,${0.8 * a})`;
  ctx.lineWidth = 26 * a + 4;
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,250,255,${a})`;
  ctx.lineWidth = 6 * a + 1;
  ctx.stroke();
  ctx.restore();
}
// a word with a dark outline (canvas text, no emoji)
function outlined(ctx, label, x, y, size, fill, edge) {
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = edge;
  ctx.textAlign = 'center';
  ctx.strokeText(label, x, y);
  text(ctx, label, x, y, size, fill);
}

// ——— S5.2 ———
// A curse on its way: a dark violet sigil on the floor where it'll land, its ring closing as the time runs out;
// then (hit) a burst of dark smoke going up
function drawSigil(ctx, s, t) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.scale(1, 0.28);
  if (s.hit) {
    const f = Math.min(1, (t - s.hit) / 0.7), a = 1 - f;
    ctx.fillStyle = `rgba(${CURSE},${0.35 * a})`;
    ctx.beginPath();
    ctx.arc(0, 0, s.r * (1 + 0.15 * f), 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    for (let i = 0; i < 7; i++) {
      const x = s.x + (i / 6 - 0.5) * s.r * 1.6, y = s.y - 10 - f * (60 + (i % 3) * 25);
      ctx.fillStyle = `rgba(70,36,110,${0.5 * a})`;
      ctx.beginPath();
      ctx.arc(x, y, 10 + 8 * f, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  const k = Math.min(1, (t - s.at) / Math.max(0.1, s.end - s.at)), pulse = 0.5 + 0.5 * Math.sin(t * 10);
  ctx.fillStyle = `rgba(${CURSE},${0.16 + 0.22 * k})`;
  ctx.beginPath();
  ctx.arc(0, 0, s.r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(150,96,210,${0.6 + 0.3 * pulse})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, s.r, 0, TAU);
  ctx.stroke();
  // the closing ring and a turning star of runes
  ctx.strokeStyle = `rgba(230,200,255,${0.5 + 0.4 * k})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, s.r * (1 - k * 0.92), 0, TAU);
  ctx.stroke();
  ctx.rotate(t * 0.8);
  ctx.strokeStyle = `rgba(200,160,240,${0.45 + 0.3 * k})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 5; i++) {
    const a = (i * 2 * TAU) / 5 - Math.PI / 2;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * s.r * 0.7, Math.sin(a) * s.r * 0.7);
  }
  ctx.stroke();
  ctx.restore();
}
// A curse on a slime: n small dark wisps curling up round it
function drawWisps(ctx, s, n, t) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const ph = t * 1.1 + i * 0.37, f = (ph % 1 + 1) % 1, x = s.x + Math.sin(i * 2.3 + t * 0.9) * 24, y = s.y - 24 - f * 62;
    const a = Math.sin(f * Math.PI) * 0.95;
    ctx.strokeStyle = `rgba(60,28,100,${a})`;
    ctx.lineWidth = 7 - 3 * f;
    ctx.beginPath();
    ctx.moveTo(x, y + 18);
    ctx.bezierCurveTo(x - 12, y + 8, x + 12, y - 4, x, y - 16);
    ctx.stroke();
    ctx.strokeStyle = `rgba(200,160,250,${a * 0.7})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}
// The barrier: a rune dome over the boss, fading in over its warning, dimmer as its HP goes; the armour: a shell of
// plates round it, with a crack a hit that cracked it
function drawShield(ctx, v, k, sh, t) {
  const fade = Math.max(0, Math.min(1, 1 - (sh.from - t) / 1.5)), end = Math.min(1, (sh.until - t) / 0.6);
  const a = fade * end, cx = v.x, cy = v.y - k.h * 0.5, rx = k.w * 0.72, ry = k.h * 0.68;
  if (a <= 0) return;
  ctx.save();
  if (sh.kind === 'barrier') {
    const hp = typeof sh.v === 'number' ? sh.v : 1, pulse = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.globalAlpha = a;
    glow(ctx, cx, cy, rx * 1.1, ry * 1.1, DOME, 0.25 + 0.2 * hp);
    ctx.fillStyle = `rgba(${DOME},${0.1 + 0.12 * hp})`;
    ctx.strokeStyle = `rgba(200,212,255,${0.55 + 0.35 * hp})`;
    ctx.lineWidth = 3 + 2 * pulse * hp;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // runes turning round its rim
    ctx.fillStyle = `rgba(235,240,255,${0.5 + 0.4 * hp})`;
    for (let i = 0; i < 10; i++) {
      const an = t * 0.6 + (i * TAU) / 10, x = cx + Math.cos(an) * rx, y = cy + Math.sin(an) * ry;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(an);
      ctx.fillRect(-2, -6, 4, 12);
      ctx.fillRect(-5, -1.5, 10, 3);
      ctx.restore();
    }
  } else {
    const cracks = typeof sh.v === 'number' ? sh.v : 0;
    ctx.globalAlpha = a;
    ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a0 = Math.PI * (1.05 + i * 0.13), a1 = a0 + 0.11;
      ctx.strokeStyle = 'rgba(80,66,58,0.9)';
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.92, ry * 0.92, 0, a0, a1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(196,176,150,0.95)';
      ctx.lineWidth = 9;
      ctx.stroke();
    }
    // a crack per hit that cracked it
    ctx.strokeStyle = 'rgba(255,240,200,0.95)';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < cracks; i++) {
      const an = Math.PI * (1.15 + i * 0.2), x = cx + Math.cos(an) * rx * 0.92, y = cy + Math.sin(an) * ry * 0.92;
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x + 5, y - 1);
      ctx.lineTo(x - 3, y + 4);
      ctx.lineTo(x + 3, y + 10);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// The weak point: a glowing crystal (brighter under Hunter's Mark), a ring round it filling as it's hit, and the
// seconds it stays open
function drawWeak(ctx, spot, wk, t, marked) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 6), r = spot.r;
  ctx.save();
  glow(ctx, spot.x, spot.y, r * 2.4, r * 2.4, WEAK, (marked ? 0.75 : 0.5) + 0.3 * pulse);
  ctx.translate(spot.x, spot.y);
  ctx.fillStyle = marked ? '#fff2c4' : '#ffe08a';
  ctx.strokeStyle = '#b8782a';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.8);
  ctx.lineTo(r * 0.5, 0);
  ctx.lineTo(0, r * 0.8);
  ctx.lineTo(-r * 0.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.moveTo(-r * 0.12, -r * 0.5);
  ctx.lineTo(r * 0.14, -r * 0.1);
  ctx.lineTo(-r * 0.2, 0);
  ctx.closePath();
  ctx.fill();
  // how full it is
  ctx.strokeStyle = 'rgba(90,60,30,0.45)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.15, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#ffd25a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.15, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, wk.fill ?? 0));
  ctx.stroke();
  ctx.restore();
}
// The stagger: little stars circling over the boss's head, and the seconds it has left
function drawDizzy(ctx, v, k, t, left) {
  const cx = v.x, cy = v.y - k.h - 16, rx = Math.max(34, k.w * 0.32);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,233,160,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, rx * 0.3, 0, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const an = t * 3.4 + (i * TAU) / 4, x = cx + Math.cos(an) * rx, y = cy + Math.sin(an) * rx * 0.3, front = Math.sin(an) > 0;
    star(ctx, x, y, front ? 9 : 6.5, front ? '#fff2a8' : 'rgba(255,233,160,0.7)');
  }
  outlined(ctx, `DAZED ${Math.max(0, left).toFixed(1)}`, cx, cy - 22, 15, '#fff4c8', 'rgba(80,56,20,0.7)');
  ctx.restore();
}
function star(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = 'rgba(150,104,30,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
