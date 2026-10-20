// Docs: docs/places/alchemy.md
// Farming and alchemy on the client (data: src/shared/alchemy.js; rules: server/house.js for plots,
// server/rpg.js for brewing; art: src/alchemy-art.js). E at an empty garden plot in your own house opens
// the seed card ({t:'plant'}); E at a grown one harvests it ({t:'harvest'}). E at an alchemy lab (any
// house) opens the lab: the recipe book on the left, the cauldron on the right. You do the steps one by
// one (add or grind ingredients, stir, heat, cool, distill) and Bottle sends the whole list ({t:'brew'});
// the server checks it against the recipes. Also the brewed buff's timer on the HUD.
import { text } from './village.js';
import { audio } from './audio.js';
import { drawItemIcon } from './field.js';
import { isHouse } from './shared/sim.js';
import { ITEMS } from './shared/rpg.js';
import { CROPS, RECIPES, ACTIONS, INGREDIENTS, BREW_MAX, MAX_STEPS, PLOT_REACH, LAB_REACH, needs, recipeFor, stepItem, stepLabel, fmtTime, BUFF_LABELS } from './shared/alchemy.js';

const now = () => performance.now() / 1000;
const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
};
function icon(id, size) {
  const c = document.createElement('canvas');
  const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = c.height = size * dpr;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  drawItemIcon(g, id, size / 2, size / 2, size * 0.86);
  return c;
}
const stars = (n) => '★'.repeat(n); // a recipe's tier
const minutes = (s) => (s >= 60 ? `${Math.round(s / 60)} min` : `${s}s`);

export class Alchemy {
  constructor({ send, rpg, houses, onOpenChange }) {
    this.send = send;
    this.rpg = rpg; // rpg.me: your bag and gold
    this.houses = houses; // the farms (houses.farmOf)
    this.onOpenChange = onOpenChange;
    this.steps = [];
    this.n = 1; // batch size
    this.grind = false; // the mortar: the next ingredient is ground
    this.pick = null; // the recipe open in the book
    this.buff = null; // { id, until } our brewed buff (now() time)
    this.seeds = document.getElementById('seeds');
    this.seedList = document.getElementById('seeds-list');
    document.getElementById('seeds-close').onclick = () => this.close();
    this.panel = document.getElementById('alch');
    this.book = document.getElementById('alch-book');
    this.recipe = document.getElementById('alch-recipe');
    this.stepsEl = document.getElementById('alch-steps');
    this.ings = document.getElementById('alch-ings');
    this.status = document.getElementById('alch-status');
    document.getElementById('alch-close').onclick = () => this.close();
    const on = (id, fn) => (document.getElementById(id).onclick = () => {
      fn();
      document.activeElement?.blur();
    });
    this.grindBtn = document.getElementById('alch-grind');
    on('alch-grind', () => {
      this.grind = !this.grind;
      this.render();
    });
    const acts = document.getElementById('alch-acts');
    for (const [a, label] of Object.entries(ACTIONS)) {
      const b = el('button', 'alch-act', label);
      b.type = 'button';
      b.onclick = () => this.step(a);
      acts.append(b);
    }
    on('alch-undo', () => {
      this.steps.pop();
      this.render();
    });
    on('alch-empty', () => {
      this.steps = [];
      this.render();
    });
    on('alch-less', () => this.batch(-1));
    on('alch-more', () => this.batch(1));
    this.bottleBtn = document.getElementById('alch-bottle');
    on('alch-bottle', () => this.bottle());
  }

  get isOpen() {
    return !this.panel.hidden || !this.seeds.hidden;
  }
  close() {
    if (!this.isOpen) return;
    this.panel.hidden = this.seeds.hidden = true;
    this.plot = null;
    this.onOpenChange(false);
  }

  // ——— where you're standing ———
  // The garden plot you're at in this house: { it, f: its crop { c, readyAt } or undefined }
  plotAt(room, me) {
    const h = this.houses.houses.get(room);
    if (!h) return null;
    let best = null;
    for (const it of h.layout.items) {
      if (it.k !== 'garden_plot' || Math.abs(it.x - me.x) > PLOT_REACH) continue;
      if (!best || Math.abs(it.x - me.x) < Math.abs(best.x - me.x)) best = it;
    }
    return best && { it: best, f: best.id && h.farm?.get(best.id) };
  }
  labAt(room, me) {
    return this.houses.houses.get(room)?.layout.items.find((it) => it.k === 'alchemy_lab' && Math.abs(it.x - me.x) < LAB_REACH);
  }
  // What E does here (for the prompts above your slime), or null
  prompt(room, me) {
    if (!isHouse(room)) return null;
    const mine = this.houses.isMine(room), plot = mine && this.plotAt(room, me);
    if (plot) {
      if (!plot.f) return 'plant a seed';
      const left = plot.f.readyAt - now(), name = CROPS[plot.f.c].name;
      return left > 0 ? `${name}: ready in ${fmtTime(left * 1000)}` : `harvest the ${name}`;
    }
    if (this.labAt(room, me)) return 'brew potions';
    return null;
  }
  // E: → true if it did something here
  use(room, me) {
    if (this.isOpen) {
      this.close();
      return true;
    }
    if (!isHouse(room)) return false;
    const plot = this.houses.isMine(room) && this.plotAt(room, me);
    if (plot) {
      if (!plot.it.id) return true; // (just put down: the server is giving it a number)
      if (!plot.f) this.openSeeds(plot.it);
      else if (plot.f.readyAt > now()) {
        this.rpg.toast(`The ${CROPS[plot.f.c].name} needs ${fmtTime((plot.f.readyAt - now()) * 1000)} more`);
        audio.sfx('error');
      } else this.send({ t: 'harvest', plot: plot.it.id });
      return true;
    }
    if (this.labAt(room, me)) {
      this.openLab();
      return true;
    }
    return false;
  }
  // Every frame: walking away closes the card / the lab
  update(room, me) {
    if (!this.isOpen) return;
    if (!this.seeds.hidden && (!this.plot || this.plotAt(room, me)?.it !== this.plot)) this.close();
    else if (!this.panel.hidden && !this.labAt(room, me)) this.close();
  }

  // ——— messages ———
  receive(m, ctx) {
    if (m.t === 'harvested') {
      this.rpg.toast(`Harvested ${ITEMS[m.item].name} ×${m.n}`);
      audio.sfx('pickup');
    } else if (m.t === 'brewed') {
      const s = ctx.slimeOf(m.id);
      if (s) this.rpg.pop(s.x, s.y - 80, m.ok ? `${ITEMS[m.item].name} ×${m.n}` : 'sludge…', m.ok ? '#ffe28a' : '#b8c48a', 18);
      if (m.id !== ctx.myId) return;
      audio.sfx(m.ok ? 'scrollOk' : 'scrollFail');
      this.rpg.toast(m.ok ? `Brewed ${ITEMS[m.item].name} ×${m.n}! It's in your bag` : 'The brew turned to Murky Sludge… the ingredients are gone');
      this.steps = [];
      this.render();
    }
  }
  // {t:'me'}: our brewed buff
  gotMe(m) {
    this.buff = m.brew ? { id: m.brew.id, until: now() + m.brew.left / 1000 } : null;
    if (!this.panel.hidden) this.render();
    if (!this.seeds.hidden) this.renderSeeds();
  }

  // ——— the seed card ———
  openSeeds(plot) {
    this.plot = plot;
    this.panel.hidden = true;
    this.seeds.hidden = false;
    this.renderSeeds();
    this.onOpenChange(true);
    audio.sfx('pickup', { vol: 0.5 });
  }
  renderSeeds() {
    const gold = this.rpg.me?.coins ?? 0;
    this.seedList.replaceChildren();
    document.getElementById('seeds-gold').textContent = `${gold.toLocaleString('en-US')} gold`;
    for (const [c, crop] of Object.entries(CROPS)) {
      const r = el('div', 'seed-row');
      const body = el('div', 'seed-body');
      body.append(el('b', '', crop.name), el('p', '', `Grows in ${minutes(crop.grow)} · ${crop.yield[0]}–${crop.yield[1]} per harvest`));
      const b = el('button', '', `Plant · ${crop.seed}`);
      b.type = 'button';
      b.disabled = gold < crop.seed;
      b.onclick = () => {
        if (!this.plot) return;
        this.send({ t: 'plant', plot: this.plot.id, crop: c });
        audio.sfx('equip');
        this.close();
      };
      r.append(icon(c, 36), body, b);
      this.seedList.append(r);
    }
  }

  // ——— the lab ———
  openLab() {
    this.seeds.hidden = true;
    this.panel.hidden = false;
    this.pick ??= Object.keys(RECIPES)[0];
    this.render();
    this.onOpenChange(true);
    audio.sfx('pickup', { vol: 0.5 });
  }
  have(id) {
    return (this.rpg.me?.bag ?? []).filter((b) => b.id === id).reduce((a, b) => a + b.n, 0);
  }
  // how many more of id the steps so far can still use (for the batch size)
  spare(id) {
    return this.have(id) - (needs(this.steps)[id] ?? 0) * this.n;
  }
  step(s) {
    if (this.steps.length >= MAX_STEPS) return audio.sfx('error');
    const id = stepItem(s);
    if (id && this.spare(id) < this.n) {
      this.rpg.toast(`You need ${this.n} more ${ITEMS[id].name}${this.n > 1 ? ` (×${this.n} batch)` : ''}`);
      return audio.sfx('error');
    }
    this.steps.push(s);
    if (id) this.grind = false; // the mortar's done its job
    audio.sfx(id ? 'pickup' : s === 'heat' ? 'fireball' : 'bubble', { vol: 0.4 });
    this.render();
  }
  batch(d) {
    const n = Math.max(1, Math.min(BREW_MAX, this.n + d));
    const need = needs(this.steps);
    if (Object.entries(need).some(([id, k]) => this.have(id) < k * n)) return audio.sfx('error');
    this.n = n;
    this.render();
  }
  bottle() {
    if (!this.steps.length) return;
    if (!Object.keys(needs(this.steps)).length) {
      this.rpg.toast('Put some ingredients in first');
      return audio.sfx('error');
    }
    // a brew that's no recipe asks once more before it turns to sludge
    if (!recipeFor(this.steps) && !(this.sure > now())) {
      this.sure = now() + 4;
      this.rpg.toast("That's not any recipe: it'll turn to sludge. Press Bottle again to do it anyway");
      return audio.sfx('error');
    }
    this.sure = 0;
    this.send({ t: 'brew', steps: this.steps, n: this.n });
  }

  render() {
    if (this.panel.hidden) return;
    const done = this.steps;
    // the recipe book
    this.book.replaceChildren();
    for (const [id, r] of Object.entries(RECIPES)) {
      const b = el('button', `alch-rec${id === this.pick ? ' on' : ''}`);
      b.type = 'button';
      b.append(icon(id, 28), el('span', '', ITEMS[id].name), el('i', '', stars(r.tier)));
      b.onclick = () => {
        this.pick = id;
        this.render();
      };
      this.book.append(b);
    }
    // the open recipe: what it does, what it takes, and its steps (ticked off as you follow them)
    const r = RECIPES[this.pick], it = ITEMS[this.pick];
    this.recipe.replaceChildren();
    const head = el('div', 'alch-rhead');
    const words = el('div');
    words.append(el('b', '', `${it.name} ×${r.makes}`), el('p', '', it.desc.replace(/^Brewed\. /, '')));
    head.append(icon(this.pick, 40), words);
    const need = Object.entries(needs(r.steps)).map(([id, k]) => `${ITEMS[id].name} ×${k * this.n} (have ${this.have(id)})`).join(' · ');
    const ol = el('ol', 'alch-rsteps');
    let ok = true;
    r.steps.forEach((s, i) => {
      const li = el('li', '', stepLabel(s, ITEMS));
      if (i < done.length) {
        ok &&= done[i] === s;
        li.className = done[i] === s && ok ? 'did' : 'bad';
      } else if (i === done.length && ok) li.className = 'next';
      ol.append(li);
    });
    this.recipe.append(head, el('p', 'alch-need', `Needs${this.n > 1 ? ` (batch ×${this.n})` : ''}: ${need}`), ol);
    // the cauldron
    this.stepsEl.replaceChildren();
    if (!done.length) this.stepsEl.append(el('p', 'alch-empty', 'Empty. Follow a recipe from the book, one step at a time.'));
    done.forEach((s, i) => this.stepsEl.append(el('span', 'alch-chip', `${i + 1}. ${stepLabel(s, ITEMS)}`)));
    this.stepsEl.scrollTop = this.stepsEl.scrollHeight;
    // the ingredient shelf
    this.ings.replaceChildren();
    for (const id of INGREDIENTS) {
      const left = this.spare(id);
      const b = el('button', 'alch-ing');
      b.type = 'button';
      b.title = `${this.grind ? 'Grind' : 'Add'} ${ITEMS[id].name}`;
      b.disabled = left < this.n;
      b.append(icon(id, 26), el('span', '', ITEMS[id].name), el('b', '', String(Math.max(0, left))));
      b.onclick = () => this.step(`${this.grind ? 'grind' : 'add'}:${id}`);
      this.ings.append(b);
    }
    this.grindBtn.textContent = this.grind ? 'Mortar: ON (next one is ground)' : 'Mortar: off';
    this.grindBtn.classList.toggle('on', this.grind);
    document.getElementById('alch-n').textContent = `Batch ×${this.n}`;
    const match = recipeFor(done);
    this.status.textContent = match ? `Ready: ${ITEMS[match].name} ×${RECIPES[match].makes * this.n}` : done.length ? 'Not a recipe (yet)' : '';
    this.status.className = match ? 'ok' : '';
    this.bottleBtn.disabled = !done.length;
    document.getElementById('alch-buff').textContent = this.buff && this.buff.until > now() ? `Active: ${ITEMS[this.buff.id].name}` : '';
  }

  // ——— the HUD: our brewed buff and how long it has left (under the HP panel) ———
  drawBuff(ctx, y) {
    const b = this.buff;
    if (!b || b.until <= now()) return;
    const it = ITEMS[b.id], label = `${it.name} · ${fmtTime((b.until - now()) * 1000)}`;
    const what = Object.keys(it.buff).map((k) => BUFF_LABELS[k]).join(', ');
    ctx.font = "700 12px Fredoka, 'Trebuchet MS', sans-serif";
    const w = Math.max(ctx.measureText(label).width, ctx.measureText(what).width * 0.85) + 50;
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.beginPath();
    ctx.roundRect(16, y, w, 34, 12);
    ctx.fill();
    drawItemIcon(ctx, b.id, 34, y + 17, 26);
    text(ctx, label, 52, y + 11, 12, '#5b4a6b', 'left');
    text(ctx, what, 52, y + 25, 10, '#8a7aa8', 'left');
  }
}
