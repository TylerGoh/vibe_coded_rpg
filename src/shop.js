// Docs: docs/combat/items.md
// The shops (SHOPS): Merchant Pip's in the village (E at the stall) and Runa's net shed at Icefang Hamlet
// (the Trade button in her dialog). Buy potions and gear with gold, sell loot and spare gear back for
// SELL_RATE of the price, and (the Boutique tab, Pip's only) the friends' signature accessories, as cheap
// cosmetics. Gold drops from every mob and boss. Rules: server/rpg.js.
import { drawItemIcon } from './field.js';
import { audio } from './audio.js';
import { Slime } from './slime.js';
import { ITEMS, SHOPS, STACKS, sellPrice, COSMETICS } from './shared/rpg.js';

export class Shop {
  constructor({ rpg, send, onOpenChange }) {
    this.rpg = rpg;
    this.send = send;
    this.onOpenChange = onOpenChange;
    this.tab = 'buy';
    this.el = document.getElementById('shop');
    this.list = document.getElementById('shop-list');
    document.getElementById('shop-close').onclick = () => this.close();
    document.getElementById('shop-buy').onclick = () => this.show('buy');
    document.getElementById('shop-sell').onclick = () => this.show('sell');
    document.getElementById('shop-cos').onclick = () => this.show('cos');
    this.model = new Slime(320); // the Boutique's mannequin
    this.keeper = 'pip'; // whose shop is open (a SHOPS key)
  }

  get isOpen() {
    return !this.el.hidden;
  }
  open(keeper = 'pip') {
    this.keeper = keeper;
    const k = SHOPS[keeper];
    this.el.querySelector('h2').firstChild.textContent = `${k.name} `;
    document.getElementById('shop-cos').hidden = !k.boutique;
    this.el.hidden = false;
    this.show('buy');
    this.onOpenChange(true);
  }
  close() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.onOpenChange(false);
  }
  show(tab) {
    this.tab = tab;
    this.render();
  }

  buy(id, n) {
    const m = this.rpg.me, cost = ITEMS[id].price * n;
    if (m.coins < cost) return this.rpg.toast(`Not enough gold (that's ${cost})`), audio.sfx('error');
    this.send({ t: 'buy', item: id, n, shop: this.keeper });
  }
  sell(slot, n) {
    this.send({ t: 'sell', slot, n, shop: this.keeper });
  }

  icon(id) {
    const c = document.createElement('canvas');
    const dpr = Math.min(2, devicePixelRatio || 1), size = 40;
    c.width = c.height = size * dpr;
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    drawItemIcon(g, id, size / 2, size / 2, size * 0.8);
    return c;
  }
  // a little slime wearing the accessory
  preview(id) {
    const c = document.createElement('canvas');
    c.className = 'cos-preview';
    const dpr = Math.min(2, devicePixelRatio || 1), size = 48;
    c.width = c.height = size * dpr;
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    const s = this.model;
    s.accessories = [id];
    s.animate(0, { x: 0, y: 0, vx: 0, vy: 0, grounded: true, facing: 1 });
    g.translate(size / 2, size - 4);
    g.scale(0.72, 0.72);
    s.draw(g);
    return c;
  }
  row(id, label, price, buttons) {
    const r = document.createElement('div');
    r.className = 'shop-row';
    const it = ITEMS[id];
    const body = document.createElement('div');
    body.className = 'shop-body';
    body.innerHTML = '<b></b><p></p>';
    body.querySelector('b').textContent = label;
    body.querySelector('p').textContent = it.desc + (it.atk ? ` ATK +${it.atk}.` : '') + (it.def ? ` DEF +${it.def}.` : '');
    const cost = document.createElement('span');
    cost.className = 'shop-price';
    cost.textContent = `${price} gold`;
    const btns = document.createElement('div');
    btns.className = 'shop-btns';
    for (const [text, fn, off] of buttons) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.disabled = !!off;
      b.onclick = fn;
      btns.append(b);
    }
    r.append(this.icon(id), body, cost, btns);
    return r;
  }

  render() {
    const m = this.rpg.me;
    if (!m || !this.isOpen) return;
    document.getElementById('shop-gold').textContent = `${m.coins} gold`;
    document.getElementById('shop-buy').classList.toggle('on', this.tab === 'buy');
    document.getElementById('shop-sell').classList.toggle('on', this.tab === 'sell');
    document.getElementById('shop-cos').classList.toggle('on', this.tab === 'cos');
    this.list.replaceChildren();
    if (this.tab === 'cos') {
      for (const [id, cos] of Object.entries(COSMETICS)) {
        const owned = m.cosmetics.includes(id);
        const r = document.createElement('div');
        r.className = 'shop-row';
        const body = document.createElement('div');
        body.className = 'shop-body';
        body.innerHTML = '<b></b><p></p>';
        body.querySelector('b').textContent = cos.name;
        body.querySelector('p').textContent = `${cos.desc} Cosmetic: wear it from the bag's Style row.`;
        const cost = document.createElement('span');
        cost.className = 'shop-price';
        cost.textContent = owned ? 'owned' : `${cos.price} gold`;
        const btns = document.createElement('div');
        btns.className = 'shop-btns';
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = owned ? 'Owned' : 'Buy';
        b.disabled = owned || m.coins < cos.price;
        b.onclick = () => this.send({ t: 'buycos', id });
        btns.append(b);
        r.append(this.preview(id), body, cost, btns);
        this.list.append(r);
      }
    } else if (this.tab === 'buy') {
      for (const id of SHOPS[this.keeper].stock) {
        const p = ITEMS[id].price, stack = STACKS(id);
        const buttons = [['Buy', () => this.buy(id, 1), m.coins < p]];
        if (stack) buttons.push(['×5', () => this.buy(id, 5), m.coins < p * 5]);
        this.list.append(this.row(id, ITEMS[id].name, p, buttons));
      }
    } else {
      if (!m.bag.length) {
        const p = document.createElement('p');
        p.className = 'shop-empty';
        p.textContent = 'Your bag is empty. Mobs out in the wilds drop things you can sell here.';
        this.list.append(p);
      }
      m.bag.forEach((b, slot) => {
        const each = sellPrice(b.id);
        const buttons = [['Sell 1', () => this.sell(slot, 1)]];
        if (b.n > 1) buttons.push([`All ${b.n}`, () => this.sell(slot, b.n)]);
        this.list.append(this.row(b.id, `${ITEMS[b.id].name}${b.n > 1 ? ` ×${b.n}` : ''}`, each, buttons));
      });
    }
  }
}
