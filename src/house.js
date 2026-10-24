// Docs: docs/places/houses.md, docs/places/alchemy.md
// Personal houses, client side: draws the house you're in (its layout comes from the server in
// {t:'house'}), feeds the furniture's platforms to the physics, and runs decorating (R in your own
// house): pick a piece from the panel (or click one in the room) to carry it, click / tap to put it down.
// Every change sends the whole layout ({t:'house-set'}); the server checks it, saves it and sends it back.
// Expand (in the panel) pays for the next size up ({t:'house-grow'}). The panel only offers furniture you
// own ({t:'furni'}: bought at the furniture store, src/store.js), each with how many are still put away. The house is drawn open plan: picture
// windows show the backdrop of the town the owner picked (`view`, an index into TOWNS; drawn behind by main.js), and the backyard is open air. Crops growing in
// garden plots come with the layout (`farm`) and are drawn here; planting and the lab: src/alchemy.js.
// Pets wander around where they were put (petAt), less the hungrier they are, and show their mood (their
// bellies come with the layout, `pets`; feeding them: src/pets.js). A slime on the swing's seat swings with
// it (swingFor).
import { H, TAU, circle, clamp } from './util.js';
import { text } from './village.js';
import { audio } from './audio.js';
import { HOUSE_GROUND, HOUSE_EXIT_X, isHouse, setHouseRoom, TOWNS } from './shared/sim.js';
import { FURNITURE, LAYERS, WALLPAPERS, FLOORS, HOUSE_SIZES, WALL_TOP, sizeOf, houseWidth, houseRoom, snapPlacement, cleanLayout, placed, PET_ROAM, petMood } from './shared/house.js';
import { drawFurniture, furnitureIcon, drawWallpaper, drawFloor, drawPet } from './furniture.js';
import { petLook, drawPetMood, drawBelly } from './pet-art.js';
import { drawCrop } from './alchemy-art.js';
import { grown } from './shared/alchemy.js';

const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const byLayer = (items) => LAYERS.flatMap((l) => items.filter((it) => FURNITURE[it.k].layer === l));
const gold = (n) => n.toLocaleString('en-US');
const PANE = 150, PANE_GAP = 330; // the inside's picture windows: width, and the distance between them
const PANE_TOP = WALL_TOP + 40, PANE_BOTTOM = HOUSE_GROUND - 120;

// A pet wanders up to PET_ROAM px (times how far its mood still lets it: petLook) either side of where it
// was put: every PET_STEP s it picks a new spot (from the time, so everyone in the house sees about the same
// walk), walks there, and idles.
const PET_STEP = 5;
function petAt(it, i, time, width, roam = 1) {
  const seed = (i + 1) * 7.31 + it.x * 0.013;
  const spot = (n) => {
    const r = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
    return clamp(it.x + ((r - Math.floor(r)) * 2 - 1) * PET_ROAM * roam, 40, width - 40);
  };
  const u = time / PET_STEP + seed, n = Math.floor(u), walk = clamp((u - n) / 0.6, 0, 1);
  const a = spot(n - 1), b = spot(n), e = walk * walk * (3 - 2 * walk);
  return { x: a + (b - a) * e, facing: b >= a ? 1 : -1, walking: walk < 1 && Math.abs(b - a) > 4, seed };
}
// The swing's seat: its pivot (the top bar) and its angle on screen; harder while someone's on it
const SWING_PIVOT = 160;
const seatOn = (it, s) => s && Math.abs(s.x - it.x) <= FURNITURE.swing.seat.w / 2 + 4 && Math.abs(s.y - (it.y - FURNITURE.swing.seat.top)) < 3;
const swingAngle = (it, time, busy) => (busy ? Math.sin(time * 2.2) * 0.38 : Math.sin(time * 1.4) * 0.18) * (it.f ? -1 : 1);

export class Houses {
  constructor({ send, me, gold, view, toast, onOpenChange }) {
    this.send = send;
    this.me = me; // () → your username
    this.gold = gold; // () → your gold
    this.view = view; // () → the world x in the middle of the screen
    this.toast = toast;
    this.onOpenChange = onOpenChange;
    // room → { owner, layout, farm: Map(plot id → { c: crop, readyAt: performance.now() s }), pets: Map(pet id →
    // { emptyAt: performance.now() s, full: s a full belly lasts }), spots: [{ it, x, top }] where its pets were
    // last drawn }
    this.houses = new Map();
    this.belly = null; // the pet id whose belly bar to show (the one you're at: src/pets.js)
    this.owned = {}; // furniture id → how many you own
    this.editing = false;
    this.carry = null; // { k, f, from? } the piece being moved (from: where it was, to put it back)
    this.ptr = null; // pointer in world px, while over the room
    this.panel = document.getElementById('deco');
    this.grid = document.getElementById('deco-grid');
    this.note = document.getElementById('deco-note');
    for (const k of Object.keys(FURNITURE)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'deco-item';
      b.title = FURNITURE[k].name;
      b.dataset.k = k;
      b.append(furnitureIcon(k, 44), document.createElement('b'));
      b.hidden = true;
      b.onclick = () => this.pickNew(k);
      this.grid.append(b);
    }
    this.grid.addEventListener('wheel', (e) => {
      // a mouse wheel scrolls the row of furniture sideways
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      this.grid.scrollLeft += e.deltaY;
      e.preventDefault();
    }, { passive: false });
    const on = (id, fn) => (document.getElementById(id).onclick = () => {
      fn();
      document.activeElement?.blur(); // so Space jumps instead of pressing the button again
    });
    on('deco-wall', () => this.restyle('wall', WALLPAPERS.length));
    on('deco-floor', () => this.restyle('floor', FLOORS.length));
    this.viewBtn = document.getElementById('deco-view');
    on('deco-view', () => this.restyle('view', TOWNS.length));
    on('deco-flip', () => this.flip());
    on('deco-remove', () => this.remove());
    on('deco-kick', () => this.send({ t: 'house-kick' }));
    this.growBtn = document.getElementById('deco-grow');
    on('deco-grow', () => this.grow());
    on('deco-done', () => this.stopEditing());
  }

  receive(m) {
    const t = performance.now() / 1000, was = this.houses.get(m.room);
    // (a local decorating change has no farm or pets: they stay as they were)
    const farm = m.farm ? new Map(Object.entries(m.farm).map(([id, [c, left]]) => [Number(id), { c, readyAt: t + left / 1000 }])) : was?.farm ?? new Map();
    const pets = m.pets ? new Map(Object.entries(m.pets).map(([id, [left, full]]) => [Number(id), { emptyAt: t + left / 1000, full: full / 1000 }])) : was?.pets ?? new Map();
    this.houses.set(m.room, { owner: m.owner, layout: m.layout, farm, pets, spots: was?.spots ?? [] });
    setHouseRoom(m.room, houseRoom(m.layout));
    this.showNote();
  }
  // {t:'furni'}: what you own (at login, and after buying in the store)
  receiveOwned(m) {
    this.owned = m.owned;
    this.showNote();
  }
  // How many of piece k you own but haven't put out
  spare(k) {
    return (this.owned[k] ?? 0) - (placed(this.layout)[k] ?? 0);
  }
  grew(m) {
    const mine = m.by === this.me();
    this.toast(mine ? `Your house is now a ${m.name}! Walk right to see the new space` : `${m.by}'s house just grew into a ${m.name}!`);
    audio.sfx('levelup');
  }
  ownerOf(room) {
    return this.houses.get(room)?.owner;
  }
  // How full one of the pets in this house is (0–1), or null (not one we know: just bought)
  fullness(room, id) {
    const pet = this.houses.get(room)?.pets.get(id);
    return pet ? clamp((pet.emptyAt - performance.now() / 1000) / pet.full, 0, 1) : null;
  }
  isMine(room) {
    return isHouse(room) && this.ownerOf(room) === this.me();
  }
  title(room, mine) {
    const owner = this.ownerOf(room);
    return mine ? 'Your house' : owner ? `${owner}'s house` : 'A house';
  }

  // ——— decorating ———
  get isOpen() {
    return this.editing;
  }
  startEditing(room) {
    if (!this.isMine(room) || this.editing) return;
    this.editing = true;
    this.room = room;
    this.panel.hidden = false;
    this.showNote();
    this.onOpenChange(true);
  }
  stopEditing() {
    if (!this.editing) return;
    this.putBack();
    this.editing = false;
    this.panel.hidden = true;
    this.ptr = null;
    this.sure = 0;
    this.onOpenChange(false);
  }
  get layout() {
    return this.houses.get(this.room)?.layout;
  }
  // Apply a change locally straight away, and send it
  commit(layout) {
    layout = cleanLayout(layout, this.owned); // exactly what the server will make of it (things settle onto what's below)
    this.receive({ room: this.room, owner: this.me(), layout });
    this.send({ t: 'house-set', layout });
  }
  showNote() {
    if (!this.editing) return;
    const n = this.layout?.items.length ?? 0, use = placed(this.layout);
    let spare = 0;
    for (const b of this.grid.children) {
      const k = b.dataset.k, free = (this.owned[k] ?? 0) - (use[k] ?? 0);
      b.hidden = !this.owned[k];
      b.disabled = free <= 0;
      b.lastChild.textContent = free;
      b.title = `${FURNITURE[k].name} · ${free} put away`;
      spare += Math.max(0, free);
    }
    this.note.textContent = this.carry
      ? `Moving: ${FURNITURE[this.carry.k].name} · click / tap where it goes`
      : `${sizeOf(this.layout).name} · ${n} / ${sizeOf(this.layout).pieces} pieces · ${spare ? 'pick one below, or click one in the room to move it' : 'buy more at the furniture store in the village'}`;
    this.showGrow();
    const view = `View: ${TOWNS[this.layout?.view ?? 0]?.name ?? TOWNS[0].name}`;
    if (this.viewBtn.textContent !== view) this.viewBtn.textContent = view;
    for (const b of this.grid.children) b.classList.toggle('on', this.carry?.k === b.dataset.k && !this.carry.from);
    document.getElementById('deco-flip').disabled = document.getElementById('deco-remove').disabled = !this.carry;
  }
  pickNew(k) {
    if (!this.layout) return;
    this.putBack();
    const { pieces } = sizeOf(this.layout);
    if (this.spare(k) <= 0) {
      this.note.textContent = `All your ${FURNITURE[k].name.toLowerCase()}s are out: buy another at the ${FURNITURE[k].pet ? 'Pet Shop' : 'furniture store'}`;
      return audio.sfx('error');
    }
    if (this.layout.items.length >= pieces) {
      this.note.textContent = `That's the most this house can hold (${pieces}): remove something, or expand`;
      return audio.sfx('error');
    }
    this.carry = { k, f: false };
    this.ptr ??= { x: this.view(), y: HOUSE_GROUND - 120 };
    this.showNote();
  }
  // a piece picked up out of the room goes back where it was (if it isn't put down somewhere else)
  putBack() {
    if (this.carry?.from) {
      const items = [...this.layout.items];
      items.splice(this.carry.from.i, 0, this.carry.from.it);
      this.commit({ ...this.layout, items });
    }
    this.carry = null;
    this.showNote();
  }
  flip() {
    if (this.carry) this.carry.f = !this.carry.f;
  }
  remove() {
    if (!this.carry) return;
    this.carry = null; // (a moved piece is already out of the layout)
    audio.sfx('reset', { vol: 0.6 });
    this.showNote();
  }
  restyle(key, n) {
    if (!this.layout) return;
    this.commit({ ...this.layout, [key]: ((this.layout[key] ?? 0) + 1) % n });
  }
  where(px, py) {
    return snapPlacement(this.carry.k, px, py, this.layout);
  }
  // The Expand button: the next size and its price. The first press asks, a second one within a few
  // seconds buys (the server checks the gold).
  showGrow() {
    const next = HOUSE_SIZES[(this.layout?.size ?? 0) + 1], have = this.gold();
    const sure = this.sure > performance.now();
    const label = !next ? 'Biggest house!' : sure ? `Buy for ${gold(next.price)}?` : `Expand: ${next.name} · ${gold(next.price)} gold`;
    if (this.growBtn.textContent !== label) this.growBtn.textContent = label;
    this.growBtn.disabled = !next || have < next.price;
    this.growBtn.title = next ? `More room inside and a bigger garden, up to ${next.pieces} pieces. You have ${gold(have)} gold.` : '';
    this.growBtn.classList.toggle('sure', sure);
  }
  grow() {
    const size = (this.layout?.size ?? 0) + 1, next = HOUSE_SIZES[size];
    if (!next) return;
    if (this.gold() < next.price) return this.toast(`The ${next.name} costs ${gold(next.price)} gold`), audio.sfx('error');
    if (this.sure > performance.now()) {
      this.sure = 0;
      this.send({ t: 'house-grow', size });
    } else this.sure = performance.now() + 4000;
    this.showGrow();
  }
  // A click / tap on the room while decorating, in world px
  pointer(type, x, y) {
    if (!this.editing || !this.layout) return;
    this.ptr = { x, y };
    if (type !== 'down') return;
    if (this.carry) {
      const { x: px, y: py } = this.where(x, y);
      const id = this.carry.from?.it.id; // (a garden plot keeps its number, and so its crop)
      const items = [...this.layout.items, { k: this.carry.k, x: px, y: py, f: this.carry.f, ...(id ? { id } : {}) }];
      this.carry = null;
      this.commit({ ...this.layout, items });
      audio.sfx('equip', { vol: 0.6 });
      return;
    }
    // pick up the top-most piece under the pointer
    const order = byLayer(this.layout.items);
    for (let j = order.length - 1; j >= 0; j--) {
      const it = order[j], def = FURNITURE[it.k];
      const pad = def.layer === 'rug' ? 8 : 2;
      if (Math.abs(x - it.x) > def.w / 2 + pad || y < it.y - def.h - pad || y > it.y + pad) continue;
      const i = this.layout.items.indexOf(it);
      const items = this.layout.items.filter((_, n) => n !== i);
      this.carry = { k: it.k, f: it.f, from: { i, it } };
      this.commit({ ...this.layout, items });
      audio.sfx('pickup', { vol: 0.6 });
      this.showNote();
      return;
    }
  }
  // Delete / Backspace / F while decorating
  key(code) {
    if (code === 'Delete' || code === 'Backspace') this.remove();
    else if (code === 'KeyF') this.flip();
    else return false;
    return true;
  }

  // A slime sitting on a swing's seat in this house: where to swing it from ({ x, y, a }), or null
  swingFor(room, s, time) {
    for (const it of this.houses.get(room)?.layout.items ?? []) if (it.k === 'swing' && seatOn(it, s)) return { x: it.x, y: it.y - SWING_PIVOT, a: swingAngle(it, time, true) };
    return null;
  }

  // Which town this house looks out on (an index into TOWNS; main.js draws its backdrop)
  viewOf(room) {
    return this.houses.get(room)?.layout.view ?? 0;
  }

  // ——— drawing ———
  draw(ctx, room, time, mine) {
    const h = this.houses.get(room), layout = h?.layout ?? { size: 0, wall: 0, floor: 0, items: [] };
    const { inside } = sizeOf(layout), width = houseWidth(layout);
    this.drawYard(ctx, inside, width, time);
    const windows = panes(inside, layout.items);
    // the wall, with picture windows cut out of it: the sky behind (main.js) shows through
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, inside, HOUSE_GROUND);
    for (const x of windows) ctx.roundRect(x, PANE_TOP, PANE, PANE_BOTTOM - PANE_TOP, [PANE / 2, PANE / 2, 8, 8]);
    // the store's Windows are see-through too: their glass (furniture.js) cut out of the wall the same way
    for (const it of layout.items) if (it.k === 'window') ctx.roundRect(it.x - 40, it.y - 88, 80, 80, [40, 40, 4, 4]);
    ctx.clip('evenodd');
    drawWallpaper(ctx, layout.wall, 0, inside, 0, HOUSE_GROUND);
    const dark = WALLPAPERS[layout.wall]?.kind === 'stars';
    // wainscot and skirting
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(201,155,107,0.18)';
    ctx.fillRect(0, HOUSE_GROUND - 90, inside, 90);
    ctx.fillStyle = '#e3bf91';
    ctx.fillRect(0, HOUSE_GROUND - 92, inside, 5);
    ctx.fillStyle = '#c99b6b';
    ctx.fillRect(0, HOUSE_GROUND - 12, inside, 12);
    ctx.restore();
    for (const x of windows) drawPane(ctx, x);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, HOUSE_GROUND, inside, H - HOUSE_GROUND);
    ctx.clip();
    drawFloor(ctx, layout.floor, 0, inside, HOUSE_GROUND, H);
    ctx.restore();
    // ceiling beams
    ctx.fillStyle = '#a8794f';
    ctx.fillRect(0, 0, inside, WALL_TOP - 20);
    ctx.fillStyle = '#c99b6b';
    ctx.fillRect(0, WALL_TOP - 24, inside, 12);
    for (let x = 60; x < inside - 20; x += 210) {
      ctx.fillStyle = '#8f6240';
      ctx.fillRect(x, 0, 20, WALL_TOP - 12);
    }
    this.drawPatio(ctx, inside);
    this.drawDoor(ctx, time);
    // a name plaque over the door (the top of the screen belongs to the HUD and the phone buttons)
    const label = this.title(room, mine);
    ctx.font = `700 14px ${FONT}`;
    const w = ctx.measureText(label).width + 26, px = Math.max(8 + w / 2, HOUSE_EXIT_X);
    ctx.fillStyle = '#fffaf0';
    ctx.strokeStyle = '#c99b6b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(px - w / 2, HOUSE_GROUND - 150, w, 26, 9);
    ctx.fill();
    ctx.stroke();
    text(ctx, label, px, HOUSE_GROUND - 136.5, 14, '#5b4a6b');
    const who = this.who?.() ?? [];
    for (const it of byLayer(layout.items)) {
      const def = FURNITURE[it.k];
      if (def.pet) continue; // (drawn last: they walk in front of the furniture)
      if (it.k === 'swing') drawFurniture(ctx, it.k, it.x, it.y, it.f, time, swingAngle(it, time, who.some((s) => seatOn(it, s))) * (it.f ? -1 : 1));
      else drawFurniture(ctx, it.k, it.x, it.y, it.f, time);
    }
    const spots = [];
    layout.items.forEach((it, i) => {
      const def = FURNITURE[it.k];
      if (!def.pet) return;
      if (this.editing && mine) return drawFurniture(ctx, it.k, it.x, it.y, it.f, time); // (holds still to be picked up)
      const full = this.fullness(room, it.id), mood = full === null ? 0 : petMood(full);
      const p = petAt(it, i, time, width, petLook(mood).roam);
      drawPet(ctx, def.pet, p.x, it.y, p.facing, p.walking, time, p.seed, mood);
      const top = it.y - def.h * (1 - petLook(mood).squash);
      if (full !== null) drawPetMood(ctx, mood, p.x, top, def.w, time, p.seed);
      if (full !== null && it.id === this.belly) drawBelly(ctx, p.x, top - 6, full); // (low: the prompts above your slime would cover it)
      spots.push({ it, x: p.x, top });
    });
    if (h) h.spots = spots;
    const t = performance.now() / 1000;
    for (const it of layout.items) {
      const f = it.id && h?.farm.get(it.id);
      if (f) drawCrop(ctx, f.c, it.x, it.y, grown(f.c, (f.readyAt - t) * 1000), time);
    }
  }

  // The backyard, x0 → x1: open sky (already drawn), a far hedge and a picket fence, grass, a path
  drawYard(ctx, x0, x1, time) {
    const g = HOUSE_GROUND;
    ctx.fillStyle = '#9fd99a'; // far lawn
    ctx.beginPath();
    ctx.moveTo(x0, g - 70);
    for (let x = x0; x <= x1 + 40; x += 40) ctx.lineTo(x, g - 70 - Math.sin(x * 0.011) * 10);
    ctx.lineTo(x1, g);
    ctx.lineTo(x0, g);
    ctx.fill();
    ctx.fillStyle = '#7cc47f'; // a hedge along the back
    for (let x = x0 + 30; x < x1; x += 46) circle(ctx, x, g - 74 - (x % 3) * 3, 30);
    ctx.fillRect(x0, g - 74, x1 - x0, 40);
    // picket fence
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(x0, g - 64, x1 - x0, 7);
    ctx.fillRect(x0, g - 36, x1 - x0, 7);
    for (let x = x0 + 14; x < x1; x += 26) {
      ctx.beginPath();
      ctx.roundRect(x, g - 84, 14, 84, [7, 7, 0, 0]);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(201,155,107,0.25)';
    for (let x = x0 + 14; x < x1; x += 26) ctx.fillRect(x + 10, g - 80, 4, 80);
    // the lawn (mown in stripes), with a stepping-stone path from the patio
    ctx.fillStyle = '#8fd18a';
    ctx.fillRect(x0, g, x1 - x0, H - g);
    ctx.fillStyle = '#9fdc98';
    for (let x = x0; x < x1; x += 120) ctx.fillRect(x, g + 4, 60, H - g);
    ctx.fillStyle = '#7cc47f';
    for (let x = x0 + 8; x < x1; x += 22) {
      const sway = Math.sin(time * 1.5 + x * 0.05) * 2;
      ctx.beginPath();
      ctx.moveTo(x - 4, g + 2);
      ctx.lineTo(x + sway, g - 7);
      ctx.lineTo(x + 4, g + 2);
      ctx.fill();
    }
    ctx.fillStyle = '#e8e0d4';
    for (let x = x0 + 50, i = 0; x < Math.min(x1, x0 + 420); x += 70, i++) {
      ctx.beginPath();
      ctx.ellipse(x, g + 6, 24, 5, 0, 0, TAU);
      ctx.fill();
    }
  }

  // Where the inside opens onto the garden: a post and a raised glass slider, pushed open
  drawPatio(ctx, x) {
    const g = HOUSE_GROUND;
    ctx.fillStyle = '#a8794f';
    ctx.fillRect(x - 6, 0, 20, g);
    ctx.fillStyle = '#c99b6b';
    ctx.fillRect(x - 2, 0, 12, g);
    ctx.fillStyle = 'rgba(207,236,255,0.35)'; // the open glass slider, tucked against the wall
    ctx.fillRect(x - 70, WALL_TOP - 10, 64, g - WALL_TOP + 10);
    ctx.strokeStyle = '#e3bf91';
    ctx.lineWidth = 4;
    ctx.strokeRect(x - 70, WALL_TOP - 10, 64, g - WALL_TOP + 10);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(x - 58, WALL_TOP + 20, 6, 120);
    // a little roof overhang over the garden side
    ctx.fillStyle = '#e88f6a';
    ctx.beginPath();
    ctx.moveTo(x - 10, WALL_TOP - 24);
    ctx.lineTo(x + 90, WALL_TOP + 10);
    ctx.lineTo(x + 90, WALL_TOP + 24);
    ctx.lineTo(x - 10, WALL_TOP - 4);
    ctx.fill();
  }

  // the front door, from the inside: back out to the village
  drawDoor(ctx) {
    const x = HOUSE_EXIT_X, base = HOUSE_GROUND;
    ctx.fillStyle = '#8f6240';
    ctx.beginPath();
    ctx.roundRect(x - 34, base - 112, 68, 112, [34, 34, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#9c7bd1';
    ctx.beginPath();
    ctx.roundRect(x - 28, base - 106, 56, 106, [28, 28, 0, 0]);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    circle(ctx, x, base - 76, 10);
    ctx.fillStyle = '#ffd36b';
    circle(ctx, x + 18, base - 46, 3.5);
    ctx.fillStyle = '#e88f6a'; // doormat
    ctx.beginPath();
    ctx.roundRect(x - 36, base - 4, 72, 6, 3);
    ctx.fill();
  }

  // Decorating overlay, drawn over the slimes: the piece you're carrying, where it would land
  drawEditing(ctx, time) {
    if (!this.editing || !this.layout) return;
    this.showGrow(); // (gold can change while the panel is open)
    // outline every piece, so it's clear what can be picked up
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -time * 20;
    ctx.strokeStyle = 'rgba(122,95,192,0.55)';
    ctx.lineWidth = 1.5;
    for (const it of this.layout.items) {
      const def = FURNITURE[it.k];
      ctx.beginPath();
      ctx.roundRect(it.x - def.w / 2 - 3, it.y - def.h - 3, def.w + 6, def.h + 6, 6);
      ctx.stroke();
    }
    ctx.restore();
    if (!this.carry || !this.ptr) return;
    const { x, y } = this.where(this.ptr.x, this.ptr.y), def = FURNITURE[this.carry.k];
    ctx.save();
    ctx.globalAlpha = 0.72 + Math.sin(time * 6) * 0.12;
    drawFurniture(ctx, this.carry.k, x, y, this.carry.f, time, this.carry.k === 'window'); // (a carried window shows a pretend sky: nothing's cut out yet)
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ff8fb1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - def.w / 2 - 4, y - def.h - 4, def.w + 8, def.h + 8, 7);
    ctx.stroke();
    ctx.fillStyle = '#ff8fb1';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

// The x of each picture window in an inside `inside` px wide (none too near the door or the patio), leaving
// out any that something hung on the wall would cover: the wall stays solid behind paintings and shelves
function panes(inside, items) {
  const out = [];
  for (let x = 240; x + PANE < inside - 90; x += PANE_GAP) {
    const covered = items.some((it) => FURNITURE[it.k].layer === 'wall' && Math.abs(it.x - (x + PANE / 2)) < (FURNITURE[it.k].w + PANE) / 2 + 6);
    if (!covered) out.push(x);
  }
  return out;
}
// A picture window's frame, sill and a hint of glass
function drawPane(ctx, x) {
  const w = PANE, top = PANE_TOP, bottom = PANE_BOTTOM;
  ctx.fillStyle = 'rgba(207,236,255,0.18)';
  ctx.beginPath();
  ctx.roundRect(x, top, w, bottom - top, [w / 2, w / 2, 8, 8]);
  ctx.fill();
  ctx.strokeStyle = '#fffaf0';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.strokeStyle = '#e3bf91';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, top + 4);
  ctx.lineTo(x + w / 2, bottom);
  ctx.moveTo(x, top + w / 2);
  ctx.lineTo(x + w, top + w / 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x + 16, top + w / 2 + 14, 6, 60);
  ctx.fillStyle = '#c99b6b'; // sill
  ctx.beginPath();
  ctx.roundRect(x - 12, bottom, w + 24, 10, 4);
  ctx.fill();
}
