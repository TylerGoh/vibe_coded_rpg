// Docs: docs/combat/skills.md, docs/world.md
// The Rebirth Pool in Slimeville (S2.3, story/archive/s2-plan.md): the softly glowing spring by Elder Mochi's tree
// where a slime chooses (from CLASS_LVL) or changes its class. Here: the pool's art (drawn by
// src/village.js), the splash when someone comes out of it ({t:'reborn'}), its card (an HTML overlay,
// #pool in index.html) and the news banner (#news) that points players at it. The rules are the server's
// (server/rpg.js rebirth); the card only shows them and sends {t:'rebirth', cls}.
import { TAU, rand } from './util.js';
import { glow } from './glow.js';
import { gfx } from './gfx.js';
import { GROUND_Y, VILLAGE, REBIRTH_X, REBIRTH_RANGE } from './shared/sim.js';
import { CLASSES, CLASS_LVL, ADVANCEMENTS, classNames, aOrAn } from './shared/skills.js';
import { rebirthCost } from './shared/rpg.js';

export const nearPool = (me, room) => room === VILLAGE && !!me && Math.abs(me.x - REBIRTH_X) < REBIRTH_RANGE;

const gold = (n) => n.toLocaleString('en-US');
const WHERE = "the glowing spring just east of Elder Mochi's tree in Slimeville, by the Inn";

// ——— the art ———

const RIM = 56; // half the basin's width
const splashes = []; // { at, x (where the slime stands), color }

// The pool, in world coordinates (drawn after the ground, behind the slimes)
export function drawRebirthPool(ctx, time) {
  const x = REBIRTH_X, base = GROUND_Y, wy = base - 27, low = gfx.low;
  const pulse = 0.5 + 0.5 * Math.sin(time * 1.4);
  // the soft light over the water, and a few shafts rising out of it
  glow(ctx, x, wy - 34, 130, 105, '150,215,255', 0.55 + 0.12 * pulse, 0.85, 0.3, 0.32);
  if (!low) glow(ctx, x, wy - 8, 80, 44, '255,190,235', 0.3 + 0.1 * pulse);
  // the spring's source: mossy boulders behind the basin, a softly glowing drop carved in the middle one,
  // and a trickle running down into the water
  for (const [dx, w, h, c] of [[-34, 30, 44, '#bdb1d4'], [34, 28, 38, '#bdb1d4'], [0, 36, 62, '#cdc2e2']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(x + dx - w, wy - h, w * 2, h + 6, [w, w, 6, 6]);
    ctx.fill();
    ctx.fillStyle = '#9fd48f'; // moss
    ctx.beginPath();
    ctx.ellipse(x + dx - w * 0.2, wy - h + 5, w * 0.62, 6, -0.12, 0, TAU);
    ctx.fill();
  }
  const dy = wy - 40;
  glow(ctx, x, dy, 22, 22, '200,240,255', 0.7 + 0.3 * pulse);
  ctx.fillStyle = `rgba(150, 220, 250, ${0.75 + 0.25 * pulse})`;
  ctx.beginPath();
  ctx.moveTo(x, dy - 10);
  ctx.bezierCurveTo(x + 8, dy - 1, x + 8, dy + 7, x, dy + 7);
  ctx.bezierCurveTo(x - 8, dy + 7, x - 8, dy - 1, x, dy - 10);
  ctx.fill();
  ctx.fillStyle = '#c9f0ff';
  ctx.beginPath();
  ctx.roundRect(x - 4, dy + 8, 8, wy - dy - 8, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (let k = 0; k < 2; k++) {
    const p = (time * 1.2 + k * 0.5) % 1;
    ctx.globalAlpha = 0.9 * Math.sin(p * Math.PI);
    ctx.beginPath();
    ctx.ellipse(x, dy + 10 + p * (wy - dy - 12), 1.6, 3, 0, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 3; i++) {
    const sx = x + (i - 1) * 30 + Math.sin(time * 0.7 + i * 2.1) * 6, h = 80 + 22 * Math.sin(time * 0.9 + i);
    const g = ctx.createLinearGradient(0, wy - h, 0, wy);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, `rgba(215,240,255,${0.35 + 0.14 * Math.sin(time * 1.7 + i * 1.3)})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(sx - 7, wy - h, 14, h, 7);
    ctx.fill();
  }
  // a little reed clump and a flower at each end
  for (const [dx, s] of [[-RIM - 4, -1], [RIM + 4, 1]]) {
    ctx.strokeStyle = '#7fbf73';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const sway = Math.sin(time * 1.3 + k + dx) * 2;
      ctx.beginPath();
      ctx.moveTo(x + dx + s * k * 4, base - 4);
      ctx.quadraticCurveTo(x + dx + s * k * 5, base - 22, x + dx + s * (k * 7 + 2) + sway, base - 34 - k * 7);
      ctx.stroke();
    }
    ctx.fillStyle = s < 0 ? '#ffb3c7' : '#c9b6ff';
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * TAU;
      ctx.beginPath();
      ctx.arc(x + dx + s * 12 + Math.cos(a) * 4, base - 10 + Math.sin(a) * 4, 3.4, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#fff1a8';
    ctx.beginPath();
    ctx.arc(x + dx + s * 12, base - 10, 2.6, 0, TAU);
    ctx.fill();
  }
  // the basin: a low ring of pale stones, the water on top
  ctx.fillStyle = '#d7cfe6';
  ctx.beginPath();
  ctx.roundRect(x - RIM, wy - 3, RIM * 2, base - wy + 5, [16, 16, 0, 0]);
  ctx.fill();
  const water = ctx.createLinearGradient(x - RIM, 0, x + RIM, 0);
  const s = Math.sin(time * 0.8) * 0.12;
  water.addColorStop(0, '#7fd3ee');
  water.addColorStop(0.5 + s, '#bdeeff');
  water.addColorStop(1, '#c6b6ff');
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.ellipse(x, wy, RIM - 7, 8, 0, 0, TAU);
  ctx.fill();
  // ripples spreading from the middle, and a glint drifting across
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  for (let k = 0; k < (low ? 1 : 2); k++) {
    const p = (time * 0.45 + k * 0.5) % 1;
    ctx.globalAlpha = 0.7 * (1 - p);
    ctx.beginPath();
    ctx.ellipse(x, wy, 6 + p * (RIM - 14), 1.2 + p * 4.5, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x - 24 + Math.sin(time * 0.6) * 10, wy - 2, 7, 1.6, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  // a lily pad with a pink bud
  const lx = x + 22 + Math.sin(time * 0.5) * 3;
  ctx.fillStyle = '#8fd48a';
  ctx.beginPath();
  ctx.ellipse(lx, wy + 1, 9, 2.6, 0, 0.35, TAU - 0.1);
  ctx.lineTo(lx, wy + 1);
  ctx.fill();
  ctx.fillStyle = '#ffb3c7';
  ctx.beginPath();
  ctx.ellipse(lx + 1, wy - 2, 3, 3.6, 0, 0, TAU);
  ctx.fill();
  // the rim's stones and its little carved plaque
  ctx.fillStyle = '#c4bad8';
  for (const [sx, sy, r] of [[-40, -12, 7], [-22, -4, 6], [24, -5, 6], [41, -12, 7], [-46, -2, 5], [46, -2, 5]]) {
    ctx.beginPath();
    ctx.ellipse(x + sx, base + sy, r * 1.5, r, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#fff6e6';
  ctx.beginPath();
  ctx.roundRect(x - 33, base - 19, 66, 15, 7);
  ctx.fill();
  ctx.font = "700 10px Fredoka, 'Trebuchet MS', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#8a6fc0';
  ctx.fillText('Rebirth Pool', x, base - 11);
  // motes of light drifting up out of the water
  const n = low ? 4 : 8;
  for (let i = 0; i < n; i++) {
    const p = (time * 0.22 + i / n) % 1, a = Math.sin(p * Math.PI);
    const mx = x + Math.sin(i * 12.9898) * (RIM - 14) + Math.sin(time * 1.1 + i) * 5, my = wy - 4 - p * 95;
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = i % 3 ? '#ffffff' : '#ffe0f0';
    const r = 1.6 + (i % 3) * 0.7;
    ctx.beginPath();
    ctx.moveTo(mx, my - r * 2);
    ctx.lineTo(mx + r * 0.6, my - r * 0.6);
    ctx.lineTo(mx + r * 2, my);
    ctx.lineTo(mx + r * 0.6, my + r * 0.6);
    ctx.lineTo(mx, my + r * 2);
    ctx.lineTo(mx - r * 0.6, my + r * 0.6);
    ctx.lineTo(mx - r * 2, my);
    ctx.lineTo(mx - r * 0.6, my - r * 0.6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawSplashes(ctx, x, wy, time);
}

// Someone came out of the pool: a jet of water from the middle, rings on the water (drawn with the pool)
function drawSplashes(ctx, x, wy, time) {
  for (let i = splashes.length - 1; i >= 0; i--) {
    const sp = splashes[i], t = time - sp.at;
    if (t > 1.6 || t < -1) {
      splashes.splice(i, 1);
      continue;
    }
    if (t < 0) continue;
    // the jet rises fast, hangs, and falls back
    const up = t < 0.25 ? t / 0.25 : t < 0.7 ? 1 : Math.max(0, 1 - (t - 0.7) / 0.45);
    if (up > 0) {
      const h = 130 * up, w = 16 * (0.6 + 0.4 * up);
      const g = ctx.createLinearGradient(0, wy - h, 0, wy);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(1, 'rgba(160,224,245,0.85)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, wy - h, w, h, w / 2);
      ctx.fill();
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = 0.55 * up;
      ctx.beginPath();
      ctx.arc(x, wy - h, w * 0.9, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      glow(ctx, x, wy - h * 0.6, 60, 90, '255,255,255', 0.5 * up);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const p = Math.min(1, Math.max(0, (t - k * 0.18) / 1));
      if (p <= 0 || p >= 1) continue;
      ctx.globalAlpha = 0.9 * (1 - p);
      ctx.beginPath();
      ctx.ellipse(x, wy, 8 + p * (RIM - 8), 1.5 + p * 6, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

// {t:'reborn'}: the splash out of the pool, with droplets and sparkles in the new class's colour round the
// slime that came out (particles: src/particles.js)
export function poolSplash(particles, sx, sy, cls, time) {
  const color = CLASSES[cls]?.color ?? '#ffffff';
  splashes.push({ at: time, x: sx, color });
  const x = REBIRTH_X, wy = GROUND_Y - 27;
  for (let i = 0; i < 26; i++) { // water thrown up out of the pool, raining down round it
    particles.add({ x: x + rand(-8, 8), y: wy - rand(40, 120), vx: rand(-170, 170) + (sx - x) * 0.6, vy: -rand(120, 320), g: 900, size: rand(2.5, 4.5), color: i % 3 ? '#bfeaff' : '#ffffff', life: rand(0.7, 1.1) });
  }
  for (let i = 0; i < 22; i++) { // sparkles in the class's colour, round the slime
    const a = rand(0, TAU), v = rand(40, 150);
    particles.add({ x: sx + rand(-16, 16), y: sy - rand(6, 50), vx: Math.cos(a) * v * 0.6, vy: -rand(50, 190), g: -30, drag: 2, size: rand(3, 6), color: i % 2 ? color : '#fff6c8', shape: 'sparkle', vr: rand(-6, 6), life: rand(0.7, 1.2) });
  }
}

// ——— the card (E at the pool) ———

const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
};

export class PoolCard {
  // send(msg): to the server
  constructor(send) {
    this.send = send;
    this.el = document.getElementById('pool');
    this.body = document.getElementById('pool-body');
    this.gold = document.getElementById('pool-gold');
    this.me = null;
    this.ask = null; // { cls, step } while asking to be sure
    this.waiting = 0; // when the rebirth was sent (0: not waiting)
    this.refusal = '';
    document.getElementById('pool-close').onclick = () => this.close();
  }
  get isOpen() {
    return !this.el.hidden;
  }
  open(me) {
    this.me = me;
    this.ask = null;
    this.waiting = 0;
    this.refusal = '';
    this.el.hidden = false;
    this.render();
  }
  close() {
    this.el.hidden = true;
    this.ask = null;
    this.waiting = 0;
  }
  // Esc: step back out of a question first
  back() {
    if (this.ask && !this.waiting) {
      this.ask = null;
      this.render();
    } else this.close();
  }
  // a fresh 'me' (gold, level) while it's open
  update(me) {
    if (!this.isOpen || !me) return;
    const changed = !this.me || me.lvl !== this.me.lvl || me.coins !== this.me.coins || me.cls !== this.me.cls;
    this.me = me;
    if (changed && !this.waiting) this.render();
  }
  // the server's answers: we came out of the pool (close), or a refusal (show it)
  reborn() {
    if (this.isOpen) this.close();
  }
  refused(text) {
    if (!this.isOpen || !this.waiting) return false;
    this.waiting = 0;
    this.ask = null;
    this.refusal = text;
    this.render();
    return true;
  }
  cost() {
    const m = this.me;
    return m.reborn ? rebirthCost(m.lvl) : 0;
  }
  render() {
    const m = this.me;
    if (!m) return;
    this.gold.textContent = `${gold(m.coins)} gold`;
    const parts = [el('p', 'pool-intro', 'The water glows softly. Step in, and you come out as something new.')];
    const classes = Object.entries(CLASSES).filter(([id]) => id !== 'novice');
    if (m.lvl < CLASS_LVL) {
      parts.push(el('p', 'pool-big', `Come back at Lv ${CLASS_LVL} to choose your class.`));
      parts.push(el('p', 'pool-sub', `You're Lv ${m.lvl}. Until then you're a Novice: a few basic tricks, and any weapon. At Lv ${CLASS_LVL} you choose one of these, free:`));
      const row = el('div', 'pool-classes');
      for (const [, c] of classes) row.append(this.classCard(c, null));
      parts.push(row);
    } else {
      const cost = this.cost(), mine = CLASSES[m.cls];
      parts.push(el('p', 'pool-sub', m.cls === 'novice' ? `You're a Novice, Lv ${m.lvl}. Choose your class:` : `You're ${aOrAn(mine?.name ?? m.cls)}, Lv ${m.lvl}. Change your class:`));
      const row = el('div', 'pool-classes');
      for (const [id, c] of classes) row.append(this.classCard(c, id));
      parts.push(row);
      const price = el('p', 'pool-price');
      if (!cost) price.textContent = 'Free: your first choice.';
      else {
        price.textContent = `Changing class costs ${gold(cost)} gold at Lv ${m.lvl} (about an hour of farming at your level). You have ${gold(m.coins)}.`;
        if (m.coins < cost) price.classList.add('short');
      }
      parts.push(price);
      parts.push(this.keepList());
      if (this.refusal) parts.push(el('p', 'pool-refused', this.refusal));
      if (this.ask) parts.push(this.askBox());
    }
    this.body.replaceChildren(...parts);
    this.body.scrollTop = this.ask ? this.body.scrollHeight : 0;
  }
  classCard(c, id) {
    const m = this.me, card = el('div', 'pool-class');
    card.style.setProperty('--c', c.color);
    const head = el('div', 'pool-name', c.name);
    if (id && m.cls === id) head.append(el('span', 'pool-yours', 'your class'));
    card.append(head, el('p', 'pool-blurb', c.blurb));
    const sb = el('p', 'pool-sb');
    sb.append(el('b', 'pool-good', 'Strong at: '), c.strong, el('br'), el('b', 'pool-bad', 'Bad at: '), c.bad);
    card.append(sb, el('p', 'pool-weapon', `Wields ${aOrAn(c.weapon)}. Main stat: ${c.stat.toUpperCase()}.`));
    if (id) {
      const b = el('button', 'pool-pick');
      b.type = 'button';
      const cost = this.cost(), short = m.coins < cost;
      b.textContent = m.cls === id ? `You're ${aOrAn(c.name)}` : short ? 'Not enough gold' : `Become ${aOrAn(c.name)}`;
      b.disabled = m.cls === id || short || !!this.waiting;
      b.onclick = () => {
        this.refusal = '';
        this.ask = { cls: id, step: 1 };
        this.render();
      };
      card.append(b);
    }
    return card;
  }
  keepList() {
    const box = el('div', 'pool-keep');
    const kept = el('p');
    kept.append(el('b', null, 'Kept: '), 'your level and EXP, gold, bag, gear and house.');
    const reset = el('p');
    reset.append(el('b', null, 'Reset: '), 'every skill point and ability point comes back to spend again (K and I); both skill hotbars empty (potions stay); a weapon your new class can\'t wield goes back in your bag, and you get a starter one if you own none.');
    box.append(kept, reset);
    return box;
  }
  askBox() {
    const { cls, step } = this.ask, c = CLASSES[cls], cost = this.cost();
    const box = el('div', 'pool-ask');
    const btns = el('div', 'invite-btns');
    const yes = el('button', 'pool-sure'), no = el('button', 'pool-back', 'Not yet');
    yes.type = no.type = 'button';
    no.onclick = () => {
      this.ask = null;
      this.render();
    };
    let q;
    if (this.waiting) {
      q = 'The water stirs…';
      yes.textContent = 'Stepping in…';
      yes.disabled = no.disabled = true;
    } else if (!cost) {
      q = `Step into the pool and come out ${aOrAn(c.name)}? Free: your first choice. Changing again later costs gold.`;
      yes.textContent = `Become ${aOrAn(c.name)}`;
    } else if (step === 1) {
      q = `Become ${aOrAn(c.name)} for ${gold(cost)} gold?`;
      yes.textContent = `Yes, ${gold(cost)} gold`;
    } else {
      q = `Sure? The ${gold(cost)} gold isn't given back, and your skill points and ability points reset.`;
      yes.textContent = 'Pay and step in';
    }
    yes.onclick = () => {
      if (cost && step === 1) this.ask = { cls, step: 2 };
      else {
        this.waiting = performance.now();
        this.send({ t: 'rebirth', cls });
        setTimeout(() => { // no answer: let them try again
          if (this.waiting && performance.now() - this.waiting >= 4000) {
            this.waiting = 0;
            this.ask = null;
            this.render();
          }
        }, 4000);
      }
      this.render();
    };
    btns.append(yes, no);
    box.append(el('p', null, q), btns);
    return box;
  }
}

// ——— the news banner ———
// The one-time classes notice and the advancement messages, as a banner along the top (the chat line stays)

export function newsFor(m) {
  if (m.t === 'notice' && m.news === 'classes') {
    return {
      title: 'Classes are here!',
      text: `Everyone is a Novice for now: your skill points and ability points are refunded (K and I) and your skill hotbars are empty. From Lv ${CLASS_LVL}, choose ${classNames()} at the Rebirth Pool, ${WHERE}. Your first choice is free.`,
      sticky: true,
    };
  }
  if (m.t === 'advance') {
    if (m.lvl === CLASS_LVL && m.cls === 'novice') return { title: `Lv ${CLASS_LVL}: choose your class!`, text: `${classNames()}: step into the Rebirth Pool, ${WHERE}. Your first choice is free.`, sticky: true };
    const name = ADVANCEMENTS.find((a) => a.lvl === m.lvl)?.name ?? 'An advancement';
    return { title: `Lv ${m.lvl}: ${name}!`, text: m.text };
  }
  return null;
}

export class NewsBanner {
  constructor() {
    this.el = document.getElementById('news');
    this.title = document.getElementById('news-title');
    this.text = document.getElementById('news-text');
    this.timer = 0;
    document.getElementById('news-ok').onclick = () => this.hide();
  }
  get isOpen() {
    return !this.el.hidden;
  }
  show({ title, text, sticky }) {
    this.title.textContent = title;
    this.text.textContent = text;
    this.el.hidden = false;
    this.el.classList.remove('in');
    void this.el.offsetWidth; // (restart the slide-in)
    this.el.classList.add('in');
    clearTimeout(this.timer);
    if (!sticky) this.timer = setTimeout(() => this.hide(), 14000);
  }
  hide() {
    clearTimeout(this.timer);
    this.el.hidden = true;
  }
}
