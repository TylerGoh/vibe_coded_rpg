// Docs: docs/social/trading.md
// The trade window (both sides' offers, your bag to offer from, gold, Ready) and the card that pops up
// when someone asks you to trade. The server decides everything (server/trade.js): this only shows its
// state and sends your whole offer each time you change it.
import { ITEMS, enhName, slotsOf, isGear } from './shared/rpg.js';
import { TRADE_ITEMS } from './shared/trade.js';
import { drawItemIcon } from './field.js';
import { audio } from './audio.js';

const sameE = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// An item's full card in one line: its stats, scroll bonuses and upgrade slots, so a name can't fool anyone
export function itemDetail(x) {
  const it = ITEMS[x.id];
  if (!it) return '';
  const e = x.e ?? {}, gear = isGear(x.id), parts = [];
  if (it.atk) parts.push(`ATK +${it.atk}`);
  if (it.magic) parts.push(`MAGIC +${it.magic}`);
  if (it.def) parts.push(`DEF +${it.def}`);
  if (it.lvl) parts.push(`Lv ${it.lvl}`);
  const bonus = [['atk', 'ATK'], ['magic', 'MAGIC'], ['def', 'DEF'], ['hp', 'HP']].filter(([k]) => e[k]).map(([k, n]) => `${n} +${e[k]}`).join(', ');
  if (bonus) parts.push(`scrolled: ${bonus}`);
  if (gear) parts.push(`${slotsOf(x.id) - (e.u ?? 0)}/${slotsOf(x.id)} slots left`);
  return parts.length ? parts.join(' · ') : it.desc ?? '';
}

function icon(id, size) {
  const c = document.createElement('canvas'), dpr = Math.min(2, devicePixelRatio || 1);
  c.width = c.height = Math.round(size * dpr);
  c.className = 'tr-icon';
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawItemIcon(g, id, size / 2, size / 2, size * 0.8);
  return c;
}

export class Trade {
  constructor({ send, rpg, onOpenChange }) {
    this.send = send;
    this.rpg = rpg; // rpg.me.bag, rpg.me.coins
    this.onOpenChange = onOpenChange;
    this.el = document.getElementById('trade');
    this.who = document.getElementById('trade-who');
    this.mine = document.getElementById('trade-mine');
    this.theirs = document.getElementById('trade-theirs');
    this.bag = document.getElementById('trade-bag');
    this.coins = document.getElementById('trade-coins');
    this.readyButton = document.getElementById('trade-ready');
    this.readyButton.onclick = () => this.send({ t: 'trade-ready', on: !this.state?.mine.ready, v: this.state?.v });
    document.getElementById('trade-no').onclick = () => this.cancel();
    this.coins.onchange = () => this.sendOffer();
    this.coins.oninput = () => {
      clearTimeout(this.coinTimer);
      this.coinTimer = setTimeout(() => this.sendOffer(), 500);
    };
    this.card = document.getElementById('tradeask');
    this.cardText = document.getElementById('tradeask-text');
    document.getElementById('tradeask-go').onclick = () => this.answer(true);
    document.getElementById('tradeask-no').onclick = () => this.answer(false);
    this.asks = []; // [{ from, name, until }] newest last
    this.state = null; // the server's view: { with, withId, v, mine, theirs }
  }

  get isOpen() {
    return !this.el.hidden;
  }
  ask(id) {
    this.send({ t: 'trade-ask', to: id });
  }
  cancel() {
    if (this.state) this.send({ t: 'trade-cancel' });
    this.close();
  }
  close() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.state = null;
    document.activeElement?.blur();
    this.onOpenChange(false);
  }
  reset() {
    this.close();
    this.asks = [];
    this.showCard();
  }

  // ← trade / trade-ask / trade-end
  receive(m) {
    if (m.t === 'trade-ask') {
      this.asks = this.asks.filter((a) => a.from !== m.from);
      this.asks.push({ from: m.from, name: m.name, until: performance.now() + m.ms });
      audio.sfx('skillUp', { vol: 0.6 });
      return this.showCard();
    }
    if (m.t === 'trade-end') {
      this.close();
      this.rpg.toast(m.text);
      if (m.done) audio.sfx('coin');
      return;
    }
    const first = !this.state;
    this.state = m;
    if (first) {
      this.asks = this.asks.filter((a) => a.from !== m.withId);
      this.showCard();
      this.el.hidden = false;
      this.onOpenChange(true);
    }
    if (document.activeElement !== this.coins) this.coins.value = m.mine.coins || '';
    this.render();
  }
  // the bag changed (a 'me' update) while trading
  refresh() {
    if (this.isOpen) this.render();
  }

  // your offer as bag slots, matched from what the server read
  offerSlots() {
    const bag = this.rpg.me?.bag ?? [], used = new Set(), out = [];
    for (const x of this.state?.mine.items ?? []) {
      const i = bag.findIndex((b, k) => !used.has(k) && b.id === x.id && sameE(b.e, x.e));
      if (i < 0) continue;
      used.add(i);
      out.push({ slot: i, n: x.n });
    }
    return out;
  }
  sendOffer(items = this.offerSlots()) {
    if (!this.state) return;
    const coins = Math.max(0, Math.min(this.rpg.me?.coins ?? 0, Math.floor(Number(this.coins.value)) || 0));
    this.send({ t: 'trade-offer', items, coins });
  }

  side(el, s, title, mine) {
    el.replaceChildren();
    const h = document.createElement('h3');
    h.textContent = title;
    const list = document.createElement('div');
    list.className = 'tr-items';
    const slots = mine ? this.offerSlots() : [];
    s.items.forEach((x, i) => {
      const row = document.createElement('div');
      row.className = 'tr-item';
      const text = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = enhName(x.id, x.e) + (x.n > 1 ? ` ×${x.n}` : '');
      const d = document.createElement('span');
      d.textContent = itemDetail(x);
      text.append(b, d);
      row.append(icon(x.id, 28), text);
      if (mine && slots[i]) {
        const have = this.rpg.me?.bag[slots[i].slot]?.n ?? 1;
        if (have > 1) {
          const n = document.createElement('input');
          n.type = 'number';
          n.min = 1;
          n.max = have;
          n.value = x.n;
          n.className = 'tr-n';
          n.onchange = () => {
            const all = this.offerSlots();
            all[i].n = Math.max(1, Math.min(have, Math.floor(Number(n.value)) || 1));
            this.sendOffer(all);
          };
          row.append(n);
        }
        const x2 = document.createElement('button');
        x2.type = 'button';
        x2.textContent = '✕';
        x2.title = 'Take it back';
        x2.onclick = () => this.sendOffer(this.offerSlots().filter((_, k) => k !== i));
        row.append(x2);
      }
      list.append(row);
    });
    if (!s.items.length) {
      const p = document.createElement('p');
      p.className = 'tr-empty';
      p.textContent = mine ? 'Tap things in your bag below to offer them.' : 'Nothing yet.';
      list.append(p);
    }
    const foot = document.createElement('p');
    foot.className = 'tr-foot';
    if (!mine) foot.textContent = `Gold: ${s.coins.toLocaleString()}`;
    const r = document.createElement('p');
    r.className = 'tr-state' + (s.ready ? ' on' : '');
    r.textContent = s.ready ? 'Ready' : 'Not ready yet';
    el.append(h, list, ...(mine ? [] : [foot]), r);
  }

  render() {
    const t = this.state;
    if (!t) return;
    this.who.textContent = t.with;
    this.side(this.mine, t.mine, 'You offer', true);
    this.side(this.theirs, t.theirs, `${t.with} offers`, false);
    this.readyButton.textContent = t.mine.ready ? 'Not ready' : 'Ready';
    this.readyButton.classList.toggle('on', t.mine.ready);
    // your bag: tap to offer, tap again to take back
    const offered = this.offerSlots(), bag = this.rpg.me?.bag ?? [];
    this.bag.replaceChildren();
    bag.forEach((b, i) => {
      const k = offered.findIndex((o) => o.slot === i);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tr-slot' + (k >= 0 ? ' on' : '');
      btn.title = `${enhName(b.id, b.e)}: ${itemDetail(b)}`;
      const n = document.createElement('span');
      n.textContent = b.n > 1 ? b.n : b.e?.s ? `+${b.e.s}` : '';
      btn.append(icon(b.id, 32), n);
      btn.onclick = () => {
        if (k >= 0) this.sendOffer(offered.filter((_, j) => j !== k));
        else if (offered.length >= TRADE_ITEMS) this.rpg.toast(`At most ${TRADE_ITEMS} things at once`);
        else this.sendOffer([...offered, { slot: i, n: b.n }]);
      };
      this.bag.append(btn);
    });
    if (!bag.length) this.bag.textContent = 'Your bag is empty.';
  }

  // the "X wants to trade" card
  showCard() {
    const t = performance.now();
    this.asks = this.asks.filter((a) => a.until > t);
    const a = this.asks.at(-1);
    this.card.hidden = !a || !!this.state;
    if (a) this.cardText.textContent = `${a.name} wants to trade with you.`;
  }
  answer(yes) {
    const a = this.asks.pop();
    if (!a) return;
    this.send({ t: 'trade-answer', from: a.from, yes });
    this.showCard();
  }
}
