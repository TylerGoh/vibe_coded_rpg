// Docs: docs/places/pets.md
// Feeding pets, client side: E at a pet in any house (they wander: it's the one nearest you within
// PET_REACH, where src/house.js last drew it) opens its card: how it feels, its belly, how long until it's
// empty, and a Feed button for each pet food in your bag ({t:'pet-feed'}; the server checks and keeps the
// bellies, server/house.js). {t:'pet-fed'} pops a "Yum!" over the pet for everyone in the house.
import { audio } from './audio.js';
import { drawItemIcon } from './field.js';
import { isHouse } from './shared/sim.js';
import { ITEMS } from './shared/rpg.js';
import { FURNITURE, PET_REACH, PET_MOODS, petMood } from './shared/house.js';

const FOODS = Object.keys(ITEMS).filter((id) => ITEMS[id].food);
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
export const timeLeft = (s) => (s >= 7200 ? `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min` : s >= 60 ? `${Math.ceil(s / 60)} min` : `${Math.ceil(s)} s`);

export class Pets {
  constructor({ send, rpg, houses, onOpenChange }) {
    this.send = send;
    this.rpg = rpg; // rpg.me: your bag; rpg.toast / rpg.pop
    this.houses = houses;
    this.onOpenChange = onOpenChange;
    this.id = null; // the pet whose card is open
    this.card = document.getElementById('petcard');
    this.nameEl = document.getElementById('pet-name');
    this.moodEl = document.getElementById('pet-mood');
    this.bar = document.querySelector('#pet-belly b');
    this.foods = document.getElementById('pet-foods');
    document.getElementById('petcard-close').onclick = () => this.close();
  }
  get isOpen() {
    return !this.card.hidden;
  }
  close() {
    if (!this.isOpen) return;
    this.card.hidden = true;
    this.id = null;
    this.onOpenChange(false);
  }

  // The pet you're at in this house: its spot { it, x, top } (where it was last drawn), or null
  petAt(room, me, reach = PET_REACH) {
    if (!isHouse(room) || this.houses.editing) return null;
    let best = null;
    for (const s of this.houses.houses.get(room)?.spots ?? []) {
      if (s.it.id && Math.abs(s.x - me.x) < reach && (!best || Math.abs(s.x - me.x) < Math.abs(best.x - me.x))) best = s;
    }
    return best;
  }
  // What E does here (for the prompts above your slime), or null
  prompt(room, me) {
    const s = this.petAt(room, me), full = s && this.houses.fullness(room, s.it.id);
    if (!s || full === null) return null;
    return `feed ${FURNITURE[s.it.k].name} (${PET_MOODS[petMood(full)].name.toLowerCase()})`;
  }
  // E: → true if it did something here
  use(room, me) {
    if (this.isOpen) {
      this.close();
      return true;
    }
    const s = this.petAt(room, me);
    if (!s || this.houses.fullness(room, s.it.id) === null) return false;
    this.id = s.it.id;
    this.card.hidden = false;
    this.key = '';
    this.render(room);
    this.onOpenChange(true);
    audio.sfx('pickup', { vol: 0.5 });
    return true;
  }
  // Every frame: the belly bar over the pet you're at, and the card follows it (walking off closes it)
  update(room, me) {
    const s = this.isOpen ? this.petAt(room, me, PET_REACH * 2.5) : this.petAt(room, me);
    this.houses.belly = this.isOpen ? this.id : s?.it.id ?? null;
    if (!this.isOpen) return;
    const still = (this.houses.houses.get(room)?.spots ?? []).some((p) => p.it.id === this.id && Math.abs(p.x - me.x) < PET_REACH * 2.5);
    if (!still || this.houses.fullness(room, this.id) === null) return this.close();
    this.render(room);
  }
  render(room) {
    const it = this.houses.houses.get(room)?.layout.items.find((it) => it.id === this.id);
    const full = this.houses.fullness(room, this.id), pet = this.houses.houses.get(room)?.pets.get(this.id);
    if (!it || full === null) return;
    const mood = petMood(full), left = Math.max(0, full * pet.full), mine = this.houses.isMine(room);
    const bag = this.rpg.me?.bag ?? [], have = (id) => bag.filter((b) => b.id === id).reduce((a, b) => a + b.n, 0);
    const moodText = `${PET_MOODS[mood].name} · ${Math.round(full * 100)}% full · ${left > 0 ? `empty in ${timeLeft(left)}` : 'empty'}${mood >= 2 ? (mine ? ': feed it, or it will die!' : ': it needs feeding') : ''}`;
    if (this.moodEl.textContent !== moodText) this.moodEl.textContent = moodText;
    this.bar.style.width = `${Math.max(2, full * 100)}%`;
    this.bar.style.background = full >= 0.5 ? '#8fd18a' : full >= 0.25 ? '#ffc66b' : '#ff7a7a';
    // the rest only changes when the bag or the pet does
    const key = `${this.id}|${FOODS.map(have).join(',')}|${full >= 0.98}`;
    if (key === this.key) return;
    this.key = key;
    this.nameEl.textContent = mine ? FURNITURE[it.k].name : `${this.houses.ownerOf(room)}'s ${FURNITURE[it.k].name}`;
    this.foods.replaceChildren();
    for (const id of FOODS) {
      const n = have(id), r = el('div', 'seed-row'), body = el('div', 'seed-body');
      body.append(el('b', '', `${ITEMS[id].name} ×${n}`), el('p', '', `Fills ${Math.round(ITEMS[id].food * 100)}% of its belly`));
      const b = el('button', '', full >= 0.98 ? 'Full' : 'Feed');
      b.type = 'button';
      b.disabled = !n || full >= 0.98;
      b.onclick = () => {
        this.send({ t: 'pet-feed', id: this.id, item: id });
        b.blur();
      };
      r.append(icon(id, 36), body, b);
      this.foods.append(r);
    }
    if (!FOODS.some((id) => have(id))) this.foods.append(el('p', '', 'No pet food in your bag: Auntie Clover sells it at the Pet Shop in Slimeville.'));
  }

  // {t:'pet-fed'}: a "Yum!" over the pet, for everyone in the house
  fed(m, me) {
    const s = this.houses.houses.get(m.room)?.spots.find((p) => p.it.id === m.id);
    if (s) this.rpg.pop(s.x, s.top - 24, 'Yum!', '#ff8fb1', 18);
    if (m.by === me) {
      audio.sfx('pickup');
      this.key = ''; // (the bag changed)
    }
  }
}
