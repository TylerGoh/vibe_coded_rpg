// Docs: docs/combat/bosses.md
// S5's party mechanics on the client (story/s5-plan.md; rules in server/rpg.js partyTick, numbers in PARTY and
// the constants after it in src/shared/rpg.js). The server says which mechanics are on for each boss
// ({t:'party'}: bits in PARTY_MECHS order, who the focus is on, and S5.2's stagger, shield phase, weak point and
// who's cursed); this draws them and predicts what they do to our hits (mod). It never names the answer (owner,
// 2026-10-26: players discover the mechanics; telegraphs and pops only). S5.1: the focus (a red line and a reticle) and the pulse (rings closing in, a flash).
// S5.2: the curse (a sigil on the floor, then dark wisps over the cursed), the barrier (a rune dome), the armour
// (a shell of plates that cracks), the weak point (a glowing crystal high on the boss), the stagger (stars round
// its head) and the interrupt (an ultimate frozen out: the banner goes).
import { TAU } from './util.js';
import { text } from './village.js';
import { glow } from './glow.js';
import { audio } from './audio.js';
import { MOBS, DEN_W, partyBit, partyHitMult, weakOf, weakReach, ARMOUR_CRACKS, barrierCovers, weakFaces, barrierOf } from './shared/rpg.js';
import { THROAT_MULT, LADON_SLOTS } from './shared/final.js';

const RED = '232,64,92', CURSE = '96,52,140', DOME = '150,170,255', WEAK = '255,214,120';
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";

export class Party {
  constructor(rpg) {
    this.rpg = rpg;
    this.bosses = new Map(); // boss id → { on, focus (slime id), until (rpg.time), at (when heard, performance.now), stUntil, stQueued, sh, wk }
    this.pulses = []; // { mob, warnAt, at } a pulse on its way; { mob, hitAt } one going off
    this.sigils = []; // a curse on its way: { mob, x, y, r, at, end } (rpg.time); hit: the burst
    this.curses = new Map(); // slime id → curse stacks (anyone in the room)
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
      sh: m.sh ? { kind: m.sh[0] === 'b' ? 'barrier' : m.sh[0] === 'w' ? 'both' : 'armour', from: t + m.sh[1] / 1000, until: t + m.sh[2] / 1000, v: m.sh[3], c: m.sh[4] } : null, // ('w': both at once, FB1)
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
  // slime id's curse stacks
  cursedN(id) {
    return this.curses.get(id) ?? 0;
  }
  // S5.2: what boss v's mechanics do to our hit of kinds { magic, heavy, arrow } from a slime whose feet are at
  // (x, y) → [multiplier, weak] (weak: it's on the weak point: the hit carries h[4]). The server caps it the same
  // way. S5.3: a front-only barrier (Sigrun's) or weak point only counts from the side the boss faces.
  mod(v, { magic = false, heavy = false, arrow = false } = {}, y = 0, x = v?.x + (v?.facing ?? 1)) {
    const b = this.bosses.get(v?.id);
    if (!b) return [1, false];
    const kk = MOBS[v.kind], t = this.rpg.time;
    let sh = b.sh && t >= b.sh.from && t < b.sh.until ? b.sh.kind : null;
    if (sh === 'barrier' && !barrierCovers(kk, v.x, v.facing, x)) sh = null; // (round the back of her shield)
    let weak = !!(b.wk && b.wk.until > t) && weakFaces(kk, v.x, v.facing, x) && weakReach(weakOf(kk, v.x, v.y, v.facing), y, arrow);
    // FB1: a final boss's heads (src/ladon.js picked the part this hit is on: v.part): a head, its stump or the Gaze's
    // shard are outside the bark and the roses; a glowing throat does THROAT_MULT. The code goes out as h[4]
    const pt = kk.heads ? v.part ?? 'body' : null, off = !!pt && pt !== 'body';
    if (pt) weak = !!pt.weak && !!(b.wk && b.wk.until > t);
    if (off) sh = null;
    const k = partyHitMult({ stag: b.stUntil > t, shield: sh, phys: barrierOf(kk).phys }, { magic, heavy, weak }) * (pt?.throat ? THROAT_MULT : 1); // (SP6: a top boss's barrier lets less through)
    // a word over it now and then: what cut the hit, or that it found the spot
    const warded = (sh === 'barrier' || sh === 'both') && !magic, armoured = (sh === 'armour' || sh === 'both') && !heavy;
    if (t - this.said > 0.7 && (warded || armoured || weak || pt?.throat)) {
      this.said = t;
      const at = pt?.x !== undefined ? pt : { x: v.x, y: v.y - kk.h - 30 };
      if (weak) this.rpg.pop(at.x, at.y - 16, 'WEAK POINT!', '#ffe08a', 17);
      else if (pt?.throat) this.rpg.pop(at.x, at.y - 30, 'THROAT!', '#d8ffb0', 17);
      else this.rpg.pop(v.x, v.y - kk.h - 30, warded ? 'WARDED' : 'ARMOURED', '#b8c4ff', 14);
      if (!weak && !pt?.throat) audio.sfx('shellBlock', { vol: 0.5 });
    }
    if (pt) return [k, weak ? 1 : pt.slot !== undefined ? 2 + pt.slot : 0]; // (h[4]: 1 the shard, 2 + slot a head or stump)
    return [k, weak];
  }
  // the focus landed on slime id: a warning sound if it's us (the red line and reticle say the rest)
  focusMoved(id) {
    if (id === this.rpg.myId) audio.sfx('bossWarn', { vol: 0.5 });
  }
  // boss events → true if handled: 'pulseWarn' {dur}, 'pulseHit', S5.2's 'curseWarn' {cx, r, dur}, 'curseHit',
  // 'shieldUp' {kind, dur}, 'shieldBreak' / 'shieldDrop' {kind}, 'crack' {n}, 'weakOpen', 'weakBreak',
  // 'stagger' {dur}, 'ultCancel' {by}
  event(m, pan) {
    const r = this.rpg, t = r.time, v = r.views.get(m.id), k = MOBS[v?.kind] ?? MOBS.sprout_king;
    const b = this.bosses.get(m.id), head = (v?.y ?? m.y) - k.h;
    if (m.a === 'pulseWarn') {
      this.pulses.push({ mob: m.id, warnAt: t, at: t + m.dur });
      audio.sfx('phaseOut', { pan, vol: 0.7 });
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
      const floor = k.boss ? 450 : m.fy ?? m.y; // (fy: a field boss's floor, S5.4)
      this.sigils.push({ mob: m.id, x: m.cx, y: floor, r: m.r, at: t, end: t + m.dur, look: CURSES[k.looks?.curse] ?? CURSES.dark, thorn: k.looks?.curse === 'thorn', drowned: k.looks?.curse === 'drowned', pale: k.looks?.curse === 'pale' });
      audio.sfx('bossWarn', { pan, vol: 0.45 });
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
      return true;
    }
    if (m.a === 'shieldBreak') {
      if (v) r.fx.spawn('shatter', { x: v.x, y: v.y - k.h / 2, r: Math.max(40, k.w * 0.75) });
      r.pop(m.x, head - 22, m.kind === 'barrier' ? 'BARRIER BROKEN!' : 'ARMOUR BROKEN!', '#e8ecff', 20);
      audio.sfx('eggBreak', { pan });
      if (b?.sh?.kind === 'both') b.sh.kind = m.kind === 'barrier' ? 'armour' : 'barrier'; // (the other one holds, FB1)
      else if (b) b.sh = null;
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
      if (b.sh && t < b.sh.until && t > b.sh.from - 1.6) {
        if (b.sh.kind === 'both') { // (FB1: the bark under the roses)
          drawShield(ctx, v, k, { ...b.sh, kind: 'armour', v: b.sh.c }, t);
          drawShield(ctx, v, k, { ...b.sh, kind: 'barrier' }, t);
        } else drawShield(ctx, v, k, b.sh, t);
      }
      if (b.wk && b.wk.until > t) drawWeak(ctx, weakOf(k, v.x, v.y, v.facing), b.wk, t, !!v.marked, k.looks?.weak);
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
      if (p.hitAt) drawPulseHit(ctx, cx, cy, reach, (t - p.hitAt) / 0.8, k);
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
  const x0 = k.heads ? LADON_SLOTS[0].x : v.x, y0 = k.heads ? 150 : v.y - k.h * 0.55, x1 = s.x, y1 = s.y - 22; // (FB1: Ladon's Watch comes from the eyes in the dark)
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
// seconds left over it (k: 0 → 1 over the warning). S5.4: `looks.pulse` on the boss recolours it (the
// Tidemother's tide: sea-green rings with foam on them, "TIDE"; the Old Narwhal's breathing hole: steel-blue rings
// with spray on them and a plume of cold mist going up off her, "BREATH")
const PULSES = {
  violet: { ring: '176,110,255', glow: '190,130,255', hit: '160,100,250', word: 'PULSE', fill: '#f1e4ff', edge: 'rgba(40,20,70,0.75)' },
  tide: { ring: '80,196,214', glow: '120,220,232', hit: '60,170,206', word: 'TIDE', fill: '#e2fbff', edge: 'rgba(8,48,66,0.78)', foam: true },
  breath: { ring: '62,128,186', glow: '170,214,240', hit: '84,150,206', word: 'BREATH', fill: '#f2faff', edge: 'rgba(24,44,70,0.8)', foam: true, plume: true },
  thorn: { ring: '120,190,80', glow: '170,230,120', hit: '96,160,60', word: 'BREATH', fill: '#eaffd8', edge: 'rgba(24,40,16,0.82)' }, // Ladon's green hiss of thorn dust (FB1)
};
function drawPulseWarn(ctx, x, y, kind, reach, k, t, left) {
  if (k > 1) return;
  const P = PULSES[kind.looks?.pulse] ?? PULSES.violet;
  ctx.save();
  const pulse = 0.5 + 0.5 * Math.sin(t * (6 + 12 * k));
  for (let i = 0; i < 3; i++) {
    const f = 1 - ((k * 1.6 + i / 3) % 1), rad = kind.w * 0.6 + f * reach;
    ctx.strokeStyle = `rgba(${P.ring},${(0.15 + 0.5 * k) * (1 - f * 0.6)})`;
    ctx.lineWidth = 4 + 6 * k;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, TAU);
    ctx.stroke();
    if (P.foam) { // (little white caps riding the ring)
      ctx.fillStyle = `rgba(240,252,255,${(0.2 + 0.5 * k) * (1 - f * 0.6)})`;
      for (let j = 0; j < 14; j++) {
        const an = (j * TAU) / 14 + i * 0.4 + t * 0.3;
        ctx.beginPath();
        ctx.arc(x + Math.cos(an) * rad, y + Math.sin(an) * rad, 2.5 + 2 * k, 0, TAU);
        ctx.fill();
      }
    }
  }
  glow(ctx, x, y, kind.w * (0.8 + 0.4 * k), kind.w * (0.8 + 0.4 * k), P.glow, 0.4 + 0.4 * pulse * k);
  if (P.plume) { // (the breathing hole heaving: a column of cold mist off her back, taller as it comes)
    for (let i = 0; i < 7; i++) {
      const ph = (t * 0.9 + i / 7) % 1, py = y - kind.h * 0.4 - ph * (50 + 90 * k);
      ctx.fillStyle = `rgba(240,248,255,${(0.25 + 0.45 * k) * (1 - ph)})`;
      ctx.beginPath();
      ctx.arc(x + Math.sin(i * 2.3 + t) * (8 + 14 * ph), py, 8 + 18 * ph, 0, TAU);
      ctx.fill();
    }
  }
  outlined(ctx, `${P.word} ${Math.max(0, left).toFixed(1)}`, x, y - kind.h * 0.6 - 30, 20, P.fill, P.edge);
  ctx.restore();
}
// The pulse going off: a bright ring racing out across the room (f: 0 → 1)
function drawPulseHit(ctx, x, y, reach, f, kind) {
  if (f > 1) return;
  const rad = 40 + f * reach, a = 1 - f, P = PULSES[kind?.looks?.pulse] ?? PULSES.violet;
  ctx.save();
  ctx.strokeStyle = `rgba(${P.hit},${0.8 * a})`;
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
// then (hit) a burst of dark smoke going up. S5.4: `looks.curse` on the boss recolours it (the Drowned Bosun's:
// sea-green ink with bubbles rising; the Thorn Hart's: briar green with thorns round the rim; the Pale Wyrm's:
// a pale, starless indigo with dim stars sinking into it, the pull of staying fallen)
const CURSES = {
  dark: { fill: CURSE, rim: '150,96,210', inner: '230,200,255', star: '200,160,240', smoke: '70,36,110' },
  drowned: { fill: '34,104,100', rim: '84,184,164', inner: '206,252,236', star: '140,222,200', smoke: '20,66,70' },
  thorn: { fill: '52,84,36', rim: '120,162,70', inner: '226,240,190', star: '160,196,104', smoke: '46,62,30' },
  pale: { fill: '58,66,112', rim: '176,190,232', inner: '236,242,255', star: '200,212,246', smoke: '44,50,90' },
};
function drawSigil(ctx, s, t) {
  const L = s.look ?? CURSES.dark;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.scale(1, 0.28);
  if (s.hit) {
    const f = Math.min(1, (t - s.hit) / 0.7), a = 1 - f;
    ctx.fillStyle = `rgba(${L.fill},${0.35 * a})`;
    ctx.beginPath();
    ctx.arc(0, 0, s.r * (1 + 0.15 * f), 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    for (let i = 0; i < 7; i++) {
      const x = s.x + (i / 6 - 0.5) * s.r * 1.6, y = s.y - 10 - f * (60 + (i % 3) * 25);
      ctx.fillStyle = `rgba(${L.smoke},${0.5 * a})`;
      ctx.beginPath();
      ctx.arc(x, y, 10 + 8 * f, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  const k = Math.min(1, (t - s.at) / Math.max(0.1, s.end - s.at)), pulse = 0.5 + 0.5 * Math.sin(t * 10);
  ctx.fillStyle = `rgba(${L.fill},${0.16 + 0.22 * k})`;
  ctx.beginPath();
  ctx.arc(0, 0, s.r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(${L.rim},${0.6 + 0.3 * pulse})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, s.r, 0, TAU);
  ctx.stroke();
  if (s.thorn) { // (thorns standing up round the rim)
    ctx.fillStyle = `rgba(${L.rim},${0.7 + 0.25 * k})`;
    for (let i = 0; i < 16; i++) {
      const an = (i * TAU) / 16, cx = Math.cos(an) * s.r, cy = Math.sin(an) * s.r, nx = Math.cos(an), ny = Math.sin(an);
      ctx.beginPath();
      ctx.moveTo(cx - ny * 7, cy + nx * 7);
      ctx.lineTo(cx + nx * (14 + 8 * k), cy + ny * (14 + 8 * k));
      ctx.lineTo(cx + ny * 7, cy - nx * 7);
      ctx.fill();
    }
  }
  // the closing ring and a turning star of runes
  ctx.strokeStyle = `rgba(${L.inner},${0.5 + 0.4 * k})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, s.r * (1 - k * 0.92), 0, TAU);
  ctx.stroke();
  ctx.rotate(t * 0.8);
  ctx.strokeStyle = `rgba(${L.star},${0.45 + 0.3 * k})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 5; i++) {
    const a = (i * 2 * TAU) / 5 - Math.PI / 2;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * s.r * 0.7, Math.sin(a) * s.r * 0.7);
  }
  ctx.stroke();
  ctx.restore();
  if (s.pale) { // (dim stars sinking down into it, in screen space)
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const ph = (t * 0.45 + i / 6) % 1, sx = s.x + Math.sin(i * 2.1) * s.r * 0.75, sy = s.y - 80 + ph * 80;
      ctx.globalAlpha = Math.sin(ph * Math.PI) * (0.4 + 0.5 * k);
      starPath(ctx, sx, sy, 5 - 2 * ph, 2 - ph * 0.8, t + i);
      ctx.fillStyle = `rgb(${L.inner})`;
      ctx.fill();
    }
    ctx.restore();
  }
  if (s.drowned) { // (bubbles of ink rising off it, in screen space: not squashed)
    ctx.save();
    ctx.strokeStyle = `rgba(${L.inner},${0.35 + 0.35 * k})`;
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 8; i++) {
      const ph = (t * 0.7 + i / 8) % 1, bx = s.x + Math.sin(i * 2.7) * s.r * 0.8, by = s.y - ph * 70;
      ctx.globalAlpha = Math.sin(ph * Math.PI);
      ctx.beginPath();
      ctx.arc(bx + Math.sin(t * 3 + i) * 3, by, 3 + (i % 3), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
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
// (S5.3: `looks.dome` on the boss tints it: the Root Warden's in Keeper amber; Sigrun's, `barrierFront`, is a curved
// wall of ice in front of her shield instead of a dome, with runes of frost)
// S5.4: `looks.shell` recolours the armour's plates (the Bramble Behemoth's bark, thorned; Old Snapjaw's mossy scutes;
// Old Rimehorn's hide of rime, icicles hanging off it; the Hall Troll's stacked blocks of blue ice, square-cut)
const SHELLS = {
  stone: { edge: 'rgba(80,66,58,0.9)', face: 'rgba(196,176,150,0.95)' },
  bark: { edge: 'rgba(58,36,24,0.95)', face: 'rgba(132,92,58,0.95)', thorns: 'rgba(214,190,160,0.95)' },
  scute: { edge: 'rgba(40,58,32,0.95)', face: 'rgba(112,140,78,0.95)', moss: 'rgba(150,196,96,0.95)' },
  rime: { edge: 'rgba(70,104,140,0.9)', face: 'rgba(214,236,252,0.95)', icicles: 'rgba(236,248,255,0.95)' },
  block: { edge: 'rgba(40,74,120,0.95)', face: 'rgba(150,200,240,0.92)', blocks: true },
};
// S5.4: Glacia's (`queen`): ice blue, deep enough to read in her white throne room, snowflakes turning round it; the Astral Wyrm's (`star`): starlight, violet with
// little gold stars for runes
const DOMES = { rose: ['250,244,240', '255,255,255', '246,226,236'], keeper: ['255,200,110', '255,236,190', '255,246,220'], ice: ['170,220,255', '214,240,255', '240,250,255'], queen: ['130,196,245', '92,156,220', '104,166,230'], star: ['150,120,240', '255,224,140', '255,236,170'] };
function drawShield(ctx, v, k, sh, t) {
  const fade = Math.max(0, Math.min(1, 1 - (sh.from - t) / 1.5)), end = Math.min(1, (sh.until - t) / 0.6);
  const a = fade * end, cx = v.x, cy = v.y - k.h * 0.5, rx = k.w * 0.72, ry = k.h * 0.68;
  if (a <= 0) return;
  ctx.save();
  if (sh.kind === 'barrier' && k.barrierFront) {
    drawFrontWall(ctx, v, k, typeof sh.v === 'number' ? sh.v : 1, a, t);
  } else if (sh.kind === 'barrier') {
    const hp = typeof sh.v === 'number' ? sh.v : 1, pulse = 0.5 + 0.5 * Math.sin(t * 4);
    const [col, rim, rune] = DOMES[k.looks?.dome] ?? [DOME, '200,212,255', '235,240,255'];
    ctx.globalAlpha = a;
    glow(ctx, cx, cy, rx * 1.1, ry * 1.1, col, 0.25 + 0.2 * hp);
    ctx.fillStyle = `rgba(${col},${0.1 + 0.12 * hp})`;
    ctx.strokeStyle = `rgba(${rim},${0.55 + 0.35 * hp})`;
    ctx.lineWidth = 3 + 2 * pulse * hp;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // runes turning round its rim (the Warden's: little Keeper gears)
    ctx.fillStyle = `rgba(${rune},${0.5 + 0.4 * hp})`;
    ctx.strokeStyle = `rgba(${rune},${0.5 + 0.4 * hp})`;
    for (let i = 0; i < 10; i++) {
      const an = t * 0.6 + (i * TAU) / 10, x = cx + Math.cos(an) * rx, y = cy + Math.sin(an) * ry;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(an);
      if (k.looks?.dome === 'queen') { // (a snowflake: three bars crossed, with ticks)
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const g = (j * TAU) / 6, ex = Math.cos(g) * 7, ey = Math.sin(g) * 7;
          ctx.moveTo(0, 0);
          ctx.lineTo(ex, ey);
          ctx.moveTo(ex * 0.55 + Math.cos(g + 1) * 2.5, ey * 0.55 + Math.sin(g + 1) * 2.5);
          ctx.lineTo(ex * 0.55, ey * 0.55);
          ctx.lineTo(ex * 0.55 + Math.cos(g - 1) * 2.5, ey * 0.55 + Math.sin(g - 1) * 2.5);
        }
        ctx.stroke();
      } else if (k.looks?.dome === 'rose') { // (FB1: Ladon's white roses, five petals round a pale heart)
        for (let j = 0; j < 5; j++) {
          const g = (j * TAU) / 5;
          ctx.beginPath();
          ctx.arc(Math.cos(g) * 3.6, Math.sin(g) * 3.6, 3.4, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(236,220,170,0.9)';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, TAU);
        ctx.fill();
      } else if (k.looks?.dome === 'star') {
        starPath(ctx, 0, 0, 6.5, 2.8, 0);
        ctx.fill();
      } else if (k.looks?.dome === 'keeper') {
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, TAU);
        ctx.stroke();
        for (let j = 0; j < 6; j++) {
          const g = (j * TAU) / 6;
          ctx.fillRect(Math.cos(g) * 6 - 1.5, Math.sin(g) * 6 - 1.5, 3, 3);
        }
      } else {
        ctx.fillRect(-2, -6, 4, 12);
        ctx.fillRect(-5, -1.5, 10, 3);
      }
      ctx.restore();
    }
  } else {
    const cracks = typeof sh.v === 'number' ? sh.v : 0, S = SHELLS[k.looks?.shell] ?? SHELLS.stone;
    ctx.globalAlpha = a;
    ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a0 = Math.PI * (1.05 + i * 0.13), a1 = a0 + 0.11;
      if (S.blocks) { // (the Hall Troll's: a cut block of ice for a plate, square to the ground)
        const am = (a0 + a1) / 2, bx = cx + Math.cos(am) * rx * 0.92, by = cy + Math.sin(am) * ry * 0.92, bw = 22 + (i % 2) * 6;
        ctx.fillStyle = S.face;
        ctx.strokeStyle = S.edge;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(bx - bw / 2, by - 11, bw, 22);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(240,250,255,0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx - bw / 2 + 4, by - 6);
        ctx.lineTo(bx - bw / 2 + 4 + bw * 0.4, by - 6);
        ctx.stroke();
        continue;
      }
      ctx.strokeStyle = S.edge;
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.92, ry * 0.92, 0, a0, a1);
      ctx.stroke();
      ctx.strokeStyle = S.face;
      ctx.lineWidth = 9;
      ctx.stroke();
      const am = (a0 + a1) / 2, px = cx + Math.cos(am) * rx * 0.92, py = cy + Math.sin(am) * ry * 0.92;
      if (S.thorns) { // (the Behemoth's bark: a thorn on every plate)
        const nx = Math.cos(am), ny = Math.sin(am);
        ctx.fillStyle = S.thorns;
        ctx.beginPath();
        ctx.moveTo(px - ny * 4, py + nx * 4);
        ctx.lineTo(px + nx * 16, py + ny * 16);
        ctx.lineTo(px + ny * 4, py - nx * 4);
        ctx.fill();
      }
      if (S.icicles) { // (Rimehorn's rime: an icicle hanging off every plate)
        ctx.fillStyle = S.icicles;
        ctx.beginPath();
        ctx.moveTo(px - 4, py + 3);
        ctx.lineTo(px, py + 16 + (i % 3) * 4);
        ctx.lineTo(px + 4, py + 3);
        ctx.fill();
      }
      if (S.moss) { // (Snapjaw's scutes: tufts of pond moss)
        ctx.fillStyle = S.moss;
        ctx.beginPath();
        ctx.arc(px + 3, py - 2, 3.2, 0, TAU);
        ctx.arc(px - 3, py + 1, 2.4, 0, TAU);
        ctx.fill();
      }
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
// A front-only barrier (Sigrun's, S5.3): a tall curved wall of ice standing off the side she faces, frost runes
// drifting up it, thinner as its HP goes; open behind her (hp: 0–1, a: its fade)
function drawFrontWall(ctx, v, k, hp, a, t) {
  const [col, rim, rune] = DOMES[k.looks?.dome] ?? DOMES.ice, f = v.facing, pulse = 0.5 + 0.5 * Math.sin(t * 4);
  const x0 = v.x + f * k.w * 0.62, top = v.y - k.h * 1.08, bot = v.y + 4, bulge = f * k.w * 0.22;
  ctx.globalAlpha = a;
  glow(ctx, x0 + bulge * 0.5, (top + bot) / 2, k.w * 0.32, k.h * 0.62, col, 0.25 + 0.25 * hp);
  // the pane: a crescent, thick in the middle
  ctx.fillStyle = `rgba(${col},${0.16 + 0.16 * hp})`;
  ctx.strokeStyle = `rgba(${rim},${0.6 + 0.35 * hp})`;
  ctx.lineWidth = 3 + 2 * pulse * hp;
  ctx.beginPath();
  ctx.moveTo(x0, top);
  ctx.quadraticCurveTo(x0 + bulge * 2, (top + bot) / 2, x0, bot);
  ctx.quadraticCurveTo(x0 + bulge * 0.6, (top + bot) / 2, x0, top);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // frost runes drifting up it
  ctx.fillStyle = `rgba(${rune},${0.45 + 0.45 * hp})`;
  for (let i = 0; i < 6; i++) {
    const ph = (t * 0.35 + i / 6) % 1, y = bot - ph * (bot - top), s = Math.sin(ph * Math.PI);
    const x = x0 + bulge * (1.1 * s + 0.15);
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = a * s;
    ctx.fillRect(-1.5, -6, 3, 12);
    ctx.rotate(Math.PI / 3);
    ctx.fillRect(-1.5, -5, 3, 10);
    ctx.rotate(Math.PI / 3);
    ctx.fillRect(-1.5, -5, 3, 10);
    ctx.restore();
  }
  ctx.globalAlpha = a;
}
// The weak point: a glowing crystal (brighter under Hunter's Mark), a ring round it filling as it's hit, and the
// seconds it stays open
// (S5.4: `looks.weak: 'honey'`, the Hornet Queen's honey sac: a glowing honeycomb cell with a drip, not a crystal;
// `'star'`, the Astral Wyrm's and the Pale Wyrm's: a five-pointed star, slowly turning)
function drawWeak(ctx, spot, wk, t, marked, look) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 6), r = spot.r;
  ctx.save();
  glow(ctx, spot.x, spot.y, r * 2.4, r * 2.4, WEAK, (marked ? 0.75 : 0.5) + 0.3 * pulse);
  ctx.translate(spot.x, spot.y);
  ctx.fillStyle = marked ? '#fff2c4' : '#ffe08a';
  ctx.strokeStyle = '#b8782a';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  if (look === 'honey') {
    for (let i = 0; i < 6; i++) ctx[i ? 'lineTo' : 'moveTo'](Math.cos((i * TAU) / 6) * r * 0.75, Math.sin((i * TAU) / 6) * r * 0.75);
  } else if (look === 'star') {
    starPath(ctx, 0, 0, r * 0.9, r * 0.4, t * 0.6, true);
  } else {
    ctx.moveTo(0, -r * 0.8);
    ctx.lineTo(r * 0.5, 0);
    ctx.lineTo(0, r * 0.8);
    ctx.lineTo(-r * 0.5, 0);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  if (look === 'honey') {
    ctx.arc(-r * 0.22, -r * 0.22, r * 0.18, 0, TAU);
    ctx.fill();
    // a drop of honey hanging off it, swelling and falling
    const f = (t * 0.8) % 1;
    ctx.fillStyle = '#f0a830';
    ctx.beginPath();
    ctx.arc(0, r * 0.75 + f * f * 26, 2.5 + 2 * Math.min(1, f * 3), 0, TAU);
  } else if (look === 'star') {
    ctx.arc(0, 0, r * 0.2, 0, TAU);
  } else {
    ctx.moveTo(-r * 0.12, -r * 0.5);
    ctx.lineTo(r * 0.14, -r * 0.1);
    ctx.lineTo(-r * 0.2, 0);
    ctx.closePath();
  }
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
// a five-pointed star's path (ro, ri: outer and inner radius, turned by rot); open: leave it for closePath
function starPath(ctx, x, y, ro, ri, rot, open) {
  if (!open) ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? ri : ro;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
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
