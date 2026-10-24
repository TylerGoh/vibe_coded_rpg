// Docs: docs/combat/skills.md
// The status box (S5.1; owner, 2026-10-24: "buffs and nerfs probably need a box status"): in combat rooms, a
// row of small icons under the HP/MP panel (below the Players / Chat buttons), one per thing on you, each with
// its time left or its stacks. Buffs have a white rim; debuffs (a boss's focus, S5.2's curse stacks) a red one;
// a cooldown (Second Wind recharging) is greyed. HTML like the hotbar, so an icon can be tapped (or hovered)
// for its name without the tap slapping. statusOf() lists what's on you; StatusBox draws the list.
import { drawSkillIcon } from './skillfx.js';
import { drawItemIcon } from './field.js';
import { ITEMS } from './shared/rpg.js';
import { rankOf, SKILLS, fxText, momentumMax, BLOODLUST_AT } from './shared/skills.js';

// What's on you now → [{ key, name, icon (a skill id, or 'item:<id>', 'focus', 'curse'), left (s, or none),
// n (stacks / amount), debuff, cool }]. rpg: the Rpg (its `me`, meAt, momentum, charges, focusLeft);
// mine: your slime (its *Until timers, in rpg.time, from `me` and our own casts).
export function statusOf(rpg, mine) {
  const m = rpg.me, t = rpg.time, out = [];
  if (!m || !mine) return out;
  const since = t - (rpg.meAt ?? t); // (the 'me' timers are ms left when it was sent)
  const fromMe = (ms) => (ms > 0 ? ms / 1000 - since : 0);
  const timed = (key, icon, name, left, extra = {}) => left > 0 && out.push({ key, icon, name, left, ...extra });
  // debuffs first: they're the ones to act on
  const focus = rpg.focusLeft?.() ?? 0;
  if (focus > 0) out.push({ key: 'focus', icon: 'focus', name: "Focused: the boss is after you. Keep moving, or let a Knight's Rally take it", left: focus, debuff: true });
  // S5.2's curse lands here: me.curse = { n, left } (stacks, ms left)
  if (m.curse?.n > 0) out.push({ key: 'curse', icon: 'curse', name: 'Cursed: you hit softer and it burns. A Cleric can Cleanse it, or step well back to let it fade', n: m.curse.n, left: fromMe(m.curse.left), debuff: true });
  timed('gods', 'challenge_gods', 'Challenge the Gods', (mine.godsUntil ?? 0) - t);
  timed('berserk', 'berserk', 'Berserk', (mine.berserkUntil ?? 0) - t);
  timed('rally', 'rally', 'Rally', (mine.rallyUntil ?? 0) - t);
  timed('bubble', 'jelly_bubble', 'Jelly Bubble: blocks the next hit', (mine.bubbleUntil ?? 0) - t);
  timed('aegis', 'aegis', 'Aegis: nothing gets through', (mine.aegisUntil ?? 0) - t);
  if ((mine.barrierUntil ?? 0) > t && m.barrier > 0) out.push({ key: 'barrier', icon: 'barrier', name: `Barrier: soaks ${m.barrier} more damage`, left: mine.barrierUntil - t, n: m.barrier });
  timed('mend', 'mend', 'Mend: healing every second', fromMe(m.mend));
  // SP1's long buffs (yours and friends'): me.buffs = [[skill id, ms left, rank]]
  for (const [id, ms, rank] of m.buffs ?? []) if (SKILLS[id]) timed(`buff:${id}`, id, `${SKILLS[id].name}: ${fxText(SKILLS[id].fx?.(rank))}`, fromMe(ms));
  if (m.brew && ITEMS[m.brew.id]) timed('brew', `item:${m.brew.id}`, ITEMS[m.brew.id].name, fromMe(m.brew.left));
  timed('draught', 'item:barrier_draught', 'Barrier Draught: takes the next boss pulse whole', fromMe(m.draught)); // (S5.5)
  if (m.shield) out.push({ key: 'shield', icon: 'mana_shield', name: 'Mana Shield: on (cast it again to turn it off)' });
  const mo = rpg.momentum;
  if (mo && mo.until > t && mo.n > 0) out.push({ key: 'momentum', icon: 'momentum', name: `Momentum: ${mo.n} of ${momentumMax(m.skills)} stacks (more attack; keep moving)`, left: mo.until - t, n: mo.n });
  // SP2: Retribution's store (the next Shield Bash lets it out), Bloodlust while it's on
  if (m.retri > 0) out.push({ key: 'retri', icon: 'retribution', name: `Retribution: ${m.retri} damage stored for your next Shield Bash`, n: m.retri });
  if (rankOf(m.skills, 'bloodlust') && m.hp < m.maxHp * BLOODLUST_AT) out.push({ key: 'bloodlust', icon: 'bloodlust', name: 'Bloodlust: below half HP, you hit harder and Jelly Thirst heals double' });
  const arc = rankOf(m.skills, 'arcane_charge') ? rpg.charges() : 0;
  if (arc > 0) out.push({ key: 'arcane', icon: 'arcane_charge', name: `Arcane Charge: your next spell spends ${arc}`, n: arc });
  timed('cure', 'item:cleansing_tonic', 'Cleansing Tonic and Barrier Draught: recharging', fromMe(m.cure), { cool: true });
  timed('secondwind', 'second_wind', 'Second Wind: recharging', fromMe(m.secondWind), { cool: true });
  return out;
}

const fmt = (s) => (s >= 60 ? `${Math.ceil(s / 60)}m` : String(Math.ceil(s)));

export class StatusBox {
  constructor(el) {
    this.el = el;
    this.cells = new Map(); // key → { b, c, t, n, icon, full }
    this.tip = document.createElement('div');
    this.tip.className = 'st-tip';
    this.tip.hidden = true;
    el.append(this.tip);
  }
  // show the list (statusOf) or hide the box
  update(list, show) {
    this.el.hidden = !show || !list.length;
    if (this.el.hidden) return;
    const keep = new Set();
    for (const it of list) {
      keep.add(it.key);
      let c = this.cells.get(it.key);
      if (!c || c.icon !== it.icon) {
        if (c) c.b.remove();
        c = this.cell(it);
        this.cells.set(it.key, c);
      }
      this.el.insertBefore(c.b, this.tip); // (keeps the list's order)
      if (it.left > 0 && it.left > (c.full ?? 0) + 0.5) c.full = it.left; // (its longest time: the sweep's whole)
      const time = it.left > 0 ? fmt(it.left) : '', n = it.n > 1 ? (it.n >= 1000 ? `${Math.round(it.n / 100) / 10}k` : String(it.n)) : '';
      if (c.time !== time) c.t.textContent = c.time = time;
      if (c.count !== n) c.n.textContent = c.count = n;
      const k = it.left > 0 && c.full ? Math.max(0, Math.min(1, 1 - it.left / c.full)) : 0;
      c.b.style.setProperty('--k', k.toFixed(3));
      c.b.title = it.name;
      c.name = it.name;
    }
    for (const [key, c] of this.cells) if (!keep.has(key)) {
      c.b.remove();
      this.cells.delete(key);
    }
  }
  cell(it) {
    const b = document.createElement('div');
    b.className = `st${it.debuff ? ' debuff' : ''}${it.cool ? ' cool' : ''}`;
    b.innerHTML = '<canvas></canvas><i></i><span class="st-t"></span><span class="st-n"></span>';
    const c = { b, icon: it.icon, t: b.querySelector('.st-t'), n: b.querySelector('.st-n'), full: 0 };
    // tap or click: its name for a moment (and never a slap on the game underneath)
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.say(c);
    });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    requestAnimationFrame(() => this.paint(b.firstChild, it.icon)); // (once it's in the page and has a size)
    return c;
  }
  say(c) {
    this.tip.textContent = c.name;
    this.tip.hidden = false;
    this.tip.style.left = `${c.b.offsetLeft}px`;
    clearTimeout(this.tipT);
    this.tipT = setTimeout(() => (this.tip.hidden = true), 2200);
  }
  paint(cv, icon) {
    const dpr = Math.min(2, devicePixelRatio || 1), size = cv.parentNode?.clientWidth || 30;
    cv.width = cv.height = Math.round(size * dpr);
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (icon === 'focus') drawFocusIcon(g, size);
    else if (icon === 'curse') drawCurseIcon(g, size);
    else if (icon.startsWith('item:')) drawItemIcon(g, icon.slice(5), size / 2, size / 2, size * 0.8);
    else drawSkillIcon(g, icon, size / 2, size / 2, size * 0.92);
  }
}

// a boss's focus on you: a red target reticle on a pale badge
function drawFocusIcon(g, s) {
  const c = s / 2, r = s * 0.3;
  g.fillStyle = '#fff1f1';
  g.beginPath();
  g.arc(c, c, s * 0.46, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#e0485f';
  g.lineWidth = s * 0.08;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(c, c, r, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    g.moveTo(c + dx * r * 0.55, c + dy * r * 0.55);
    g.lineTo(c + dx * r * 1.45, c + dy * r * 1.45);
  }
  g.stroke();
  g.fillStyle = '#e0485f';
  g.beginPath();
  g.arc(c, c, s * 0.07, 0, Math.PI * 2);
  g.fill();
}
// a curse (S5.2): dark violet wisps curling up off a dim badge
function drawCurseIcon(g, s) {
  const c = s / 2;
  g.fillStyle = '#ece4f6';
  g.beginPath();
  g.arc(c, c, s * 0.46, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#5a3a7a';
  g.lineWidth = s * 0.08;
  g.lineCap = 'round';
  for (const dx of [-0.18, 0, 0.18]) {
    g.beginPath();
    g.moveTo(c + dx * s, c + s * 0.26);
    g.bezierCurveTo(c + dx * s - s * 0.12, c + s * 0.05, c + dx * s + s * 0.12, c - s * 0.08, c + dx * s, c - s * 0.26);
    g.stroke();
  }
}
