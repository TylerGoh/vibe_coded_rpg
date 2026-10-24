// Docs: docs/places/houses.md
// The storage chest in your own house, client side: E at it opens the panel, your bag on the left and the
// chest on the right (CHEST_SLOTS each, the same as the bag). Tap a thing to move it across: the whole
// stack, or one at a time with the "One at a time" toggle (or Shift-click). The server keeps the chest
// with your character and checks you're at it ({t:'chest'}, server/rpg.js); `me` brings both back.
import { audio } from './audio.js';
import { drawItemIcon } from './field.js';
import { BAG_SLOTS, CHEST_SLOTS, enhName } from './shared/rpg.js';
import { CHEST_REACH } from './shared/house.js';
import { itemDetail } from './trade.js';

function icon(id, size) {
  const c = document.createElement('canvas'), dpr = Math.min(2, devicePixelRatio || 1);
  c.width = c.height = Math.round(size * dpr);
  c.className = 'tr-icon';
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawItemIcon(g, id, size / 2, size / 2, size * 0.8);
  return c;
}

export class Chest {
  constructor({ send, rpg, houses, onOpenChange }) {
    this.send = send;
    this.rpg = rpg; // rpg.me.bag, rpg.me.chest; rpg.toast
    this.houses = houses;
    this.onOpenChange = onOpenChange;
    this.el = document.getElementById('chest');
    this.bagEl = document.getElementById('chest-bag');
    this.boxEl = document.getElementById('chest-box');
    this.oneBtn = document.getElementById('chest-one');
    this.one = false;
    this.oneBtn.onclick = () => {
      this.one = !this.one;
      this.render();
      document.activeElement?.blur();
    };
    document.getElementById('chest-close').onclick = () => this.close();
  }
  get isOpen() {
    return !this.el.hidden;
  }
  close() {
    if (!this.isOpen) return;
    this.el.hidden = true;
    this.onOpenChange(false);
  }
  // Your chest, if you're at it (only in your own house)
  at(room, me) {
    if (!this.houses.isMine(room) || this.houses.editing) return null;
    return this.houses.houses.get(room)?.layout.items.find((it) => it.k === 'chest' && Math.abs(it.x - me.x) < CHEST_REACH) ?? null;
  }
  prompt(room, me) {
    return this.at(room, me) ? 'open your storage chest' : null;
  }
  // E: → true if it did something here
  use(room, me) {
    if (this.isOpen) {
      this.close();
      return true;
    }
    if (!this.at(room, me)) return false;
    this.el.hidden = false;
    this.render();
    this.onOpenChange(true);
    audio.sfx('pickup', { vol: 0.5 });
    return true;
  }
  // Every frame: walking away closes it
  update(room, me) {
    if (this.isOpen && !this.at(room, me)) this.close();
  }
  // {t:'me'}: the bag or the chest changed
  refresh() {
    if (this.isOpen) this.render();
  }

  // one side's slots; key: what a tap sends ('put' from the bag, 'take' from the chest; a full side: the server says so)
  grid(el, list, max, key) {
    el.replaceChildren();
    for (let i = 0; i < max; i++) {
      const b = list[i], btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tr-slot' + (b ? '' : ' empty');
      if (b) {
        btn.title = `${enhName(b.id, b.e)}${b.n > 1 ? ` ×${b.n}` : ''}: ${itemDetail(b)}`;
        const n = document.createElement('span');
        n.textContent = b.n > 1 ? b.n : b.e?.s ? `+${b.e.s}` : '';
        btn.append(icon(b.id, 32), n);
        btn.onclick = (e) => {
          this.send({ t: 'chest', [key]: i, ...(this.one || e.shiftKey ? { n: 1 } : {}) });
          audio.sfx('equip', { vol: 0.4 });
          document.activeElement?.blur();
        };
      } else btn.disabled = true;
      el.append(btn);
    }
  }
  render() {
    const me = this.rpg.me, bag = me?.bag ?? [], box = me?.chest ?? [];
    this.grid(this.bagEl, bag, BAG_SLOTS, 'put');
    this.grid(this.boxEl, box, CHEST_SLOTS, 'take');
    document.getElementById('chest-bag-n').textContent = `${bag.length} / ${BAG_SLOTS}`;
    document.getElementById('chest-n').textContent = `${box.length} / ${CHEST_SLOTS}`;
    this.oneBtn.textContent = this.one ? 'Moving: one at a time' : 'Moving: whole stacks';
    this.oneBtn.classList.toggle('on', this.one);
  }
}
