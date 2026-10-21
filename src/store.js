// Docs: docs/places/houses.md
// The furniture store (room STORE): a long showroom with one of every FURNITURE piece on display, in
// sections, each with its price tag (the layout and the lobby's doors to each section: src/shared/house.js). Walk up to a piece and press E (or tap E) for a card that buys it
// ({t:'furni-buy'}); the server takes the gold and adds it to what you own ({t:'furni'}), and it shows up
// in your decorate panel at home. Also draws the store's outside in the village (src/village.js). The Pet
// Shop (src/petshop.js) sells its pets with the same card: update() picks the room's display.
import { H, circle, mix } from './util.js';
import { text } from './village.js';
import { audio } from './audio.js';
import { STORE_EXIT_X } from './shared/sim.js';
import { PETSHOP } from './shared/rpg.js';
import { FURNITURE, DISPLAY, PET_DISPLAY, SHOW_SECTIONS, STORE_GROUND, STORE_PEDESTAL, storePortalX } from './shared/house.js';
import { drawFurniture, furnitureIcon, drawWallpaper, drawFloor } from './furniture.js';

const GROUND = STORE_GROUND, PEDESTAL = STORE_PEDESTAL, GAP = 52;
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const gold = (n) => n.toLocaleString('en-US');
const snap = (x, n) => Math.floor(x / n) * n; // patterns start on a fixed grid, so they don't slide with the camera

export class Store {
  constructor({ send, gold: myGold, owned, toast }) {
    this.send = send;
    this.gold = myGold; // () → your gold
    this.owned = owned; // () → { furniture id: how many you own }
    this.toast = toast;
    this.near = null; // the piece on display you're standing at
    this.display = DISPLAY; // the room's pieces on display (the Pet Shop's are its pets)
    this.card = document.getElementById('furni');
    this.icon = document.getElementById('furni-icon');
    this.name = document.getElementById('furni-name');
    this.info = document.getElementById('furni-info');
    this.buyBtn = document.getElementById('furni-buy');
    this.buyBtn.onclick = () => {
      if (!this.k) return;
      if (this.gold() < FURNITURE[this.k].price) return audio.sfx('error');
      this.send({ t: 'furni-buy', k: this.k });
      this.buyBtn.blur();
    };
    document.getElementById('furni-no').onclick = () => this.close();
  }

  get isOpen() {
    return !this.card.hidden;
  }
  // Every frame in the store (or the Pet Shop): which piece you're at (and the card goes away when you walk off)
  update(me, room) {
    const display = room === PETSHOP ? PET_DISPLAY : DISPLAY;
    if (display !== this.display) this.close();
    this.display = display;
    let best = null, bd = Infinity;
    for (const d of display) {
      const dx = Math.abs(d.x - me.x);
      // (reaching halfway across the gaps: no dead spots between pieces)
      if (dx < Math.max(FURNITURE[d.k].w / 2, 26) + GAP / 2 + 2 && dx < bd) (best = d), (bd = dx);
    }
    this.near = best;
    // the card stays while you're still by its piece (sliding onto the next one doesn't close it)
    const shown = this.isOpen && display.find((d) => d.k === this.k);
    if (shown && Math.abs(shown.x - me.x) > FURNITURE[shown.k].w / 2 + GAP + 40) this.close();
    if (this.isOpen) this.fill();
  }
  leave() {
    this.near = null;
    this.close();
  }
  open() {
    if (!this.near) return;
    this.k = this.near.k;
    this.icon.replaceChildren(furnitureIcon(this.k, 64));
    this.card.hidden = false;
    this.fill();
    audio.sfx('pickup', { vol: 0.5 });
  }
  close() {
    this.card.hidden = true;
    this.k = null;
  }
  fill() {
    const def = FURNITURE[this.k], have = this.owned()[this.k] ?? 0, cash = this.gold();
    const name = def.name, info = `${def.pet ? 'A pet: it roams your house. Feed it, or it dies: a full belly lasts 2 days · ' : ''}${gold(def.price)} gold · you own ${have} · you have ${gold(cash)} gold`;
    if (this.name.textContent !== name) this.name.textContent = name;
    if (this.info.textContent !== info) this.info.textContent = info;
    this.buyBtn.disabled = cash < def.price;
    this.buyBtn.textContent = cash < def.price ? 'Not enough gold' : `Buy for ${gold(def.price)}`;
  }
  // {t:'furni'} after buying something
  bought(m) {
    if (!m.bought) return;
    const def = FURNITURE[m.bought];
    this.toast(def.pet ? `Adopted: ${def.name}! Put it out at home (Decorate), and keep it fed: Auntie Clover sells the food` : `Bought: ${def.name}! It's in your decorate panel at home`);
    audio.sfx('coinBuy');
  }

  // ——— drawing ———
  draw(ctx, camX, viewW, time) {
    const L = camX - 40, R = camX + viewW + 40;
    const L0 = snap(L, 240);
    drawWallpaper(ctx, 0, L0, R, 0, GROUND);
    // each section gets its own wall colour band and a sign
    for (const s of SHOW_SECTIONS) {
      if (s.x1 < L || s.x0 > R) continue;
      if (s.name === 'Garden') {
        // a painted sky and a patch of lawn: the garden corner
        const g = ctx.createLinearGradient(0, 0, 0, GROUND);
        g.addColorStop(0, '#bfe6ff');
        g.addColorStop(1, '#e8f7ff');
        ctx.fillStyle = g;
        ctx.fillRect(s.x0, 60, s.x1 - s.x0, GROUND - 60);
        ctx.fillStyle = '#ffffff';
        for (const [cx, cy, r] of [[s.x0 + 160, 140, 26], [s.x0 + 196, 132, 32], [s.x0 + 232, 142, 22], [s.x1 - 260, 170, 24], [s.x1 - 228, 162, 30]]) circle(ctx, cx, cy, r);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(s.x0, 60, s.x1 - s.x0, GROUND - 60);
      }
      this.drawSign(ctx, s.name, s.x, 104);
    }
    // wainscot and skirting
    ctx.fillStyle = 'rgba(201,155,107,0.18)';
    ctx.fillRect(L, GROUND - 90, R - L, 90);
    ctx.fillStyle = '#e3bf91';
    ctx.fillRect(L, GROUND - 92, R - L, 5);
    drawFloor(ctx, 1, L0, R, GROUND, H);
    for (const s of SHOW_SECTIONS) {
      if (s.name !== 'Garden' || s.x1 < L || s.x0 > R) continue;
      ctx.fillStyle = '#8fd18a';
      ctx.beginPath();
      ctx.roundRect(s.x0, GROUND - 4, s.x1 - s.x0, 12, 6);
      ctx.fill();
    }
    // ceiling with hanging lights
    ctx.fillStyle = '#a8794f';
    ctx.fillRect(L, 0, R - L, 44);
    ctx.fillStyle = '#c99b6b';
    ctx.fillRect(L, 40, R - L, 12);
    for (let x = Math.floor(L / 240) * 240 + 120; x < R; x += 240) this.drawLight(ctx, x, time);
    this.drawDoor(ctx);
    SHOW_SECTIONS.forEach((s, i) => {
      this.drawArchDoor(ctx, storePortalX(i), s.color, String(i + 1), s.name);
      if (i) this.drawArchDoor(ctx, s.back, s.color, '<', 'Entrance');
    });
    this.drawDisplay(ctx, DISPLAY, L, R, time);
  }

  // The pieces on display, their pedestals and price tags (the Pet Shop's too)
  drawDisplay(ctx, display, L, R, time) {
    for (const d of display) {
      const def = FURNITURE[d.k];
      if (d.x + def.w / 2 < L || d.x - def.w / 2 > R) continue;
      const on = this.near === d;
      if (on) {
        const g = ctx.createRadialGradient(d.x, d.y - def.h / 2, 10, d.x, d.y - def.h / 2, def.w / 2 + 50);
        g.addColorStop(0, 'rgba(255,241,168,0.55)');
        g.addColorStop(1, 'rgba(255,241,168,0)');
        ctx.fillStyle = g;
        ctx.fillRect(d.x - def.w / 2 - 60, d.y - def.h - 60, def.w + 120, def.h + 120);
      }
      if (d.small) {
        const pw = Math.max(60, def.w + 16);
        ctx.fillStyle = '#fffaf0';
        ctx.beginPath();
        ctx.roundRect(d.x - pw / 2, GROUND - PEDESTAL, pw, PEDESTAL, [8, 8, 0, 0]);
        ctx.fill();
        ctx.fillStyle = def.pet ? '#d96a8a' : '#e3bf91'; // (a pet's plinth has a velvet cushion)
        ctx.beginPath();
        ctx.roundRect(d.x - pw / 2 - 4, GROUND - PEDESTAL - (def.pet ? 7 : 4), pw + 8, def.pet ? 10 : 7, def.pet ? 5 : 0);
        ctx.fill();
      }
      drawFurniture(ctx, d.k, d.x, d.y - (on ? 3 + Math.sin(time * 4) * 2 : 0), false, time);
      this.drawTag(ctx, d, on);
    }
  }

  drawSign(ctx, label, x, y) {
    ctx.font = `700 17px ${FONT}`;
    const w = ctx.measureText(label).width + 40;
    ctx.strokeStyle = '#8f6240';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 14, 52);
    ctx.lineTo(x - w / 2 + 14, y - 16);
    ctx.moveTo(x + w / 2 - 14, 52);
    ctx.lineTo(x + w / 2 - 14, y - 16);
    ctx.stroke();
    ctx.fillStyle = '#fffaf0';
    ctx.strokeStyle = '#c99b6b';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 18, w, 36, 12);
    ctx.fill();
    ctx.stroke();
    text(ctx, label, x, y + 1, 17, '#5b4a6b');
  }
  drawTag(ctx, d, on) {
    const label = gold(FURNITURE[d.k].price);
    ctx.font = `700 12px ${FONT}`;
    // wall things: under them; the rest: just above them (the bottom of the screen has the help line)
    const def = FURNITURE[d.k], w = ctx.measureText(label).width + 30, y = def.layer === 'wall' ? d.y + 22 : d.y - def.h - 22;
    ctx.fillStyle = on ? '#ff8fb1' : 'rgba(255,250,240,0.95)';
    ctx.beginPath();
    ctx.roundRect(d.x - w / 2, y - 10, w, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#ffd36b'; // a coin
    circle(ctx, d.x - w / 2 + 11, y, 5);
    text(ctx, label, d.x + 6, y + 0.5, 12, on ? '#ffffff' : '#5b4a6b');
  }
  drawLight(ctx, x, time) {
    ctx.strokeStyle = '#8f6240';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 52);
    ctx.lineTo(x, 84);
    ctx.stroke();
    const g = ctx.createRadialGradient(x, 92, 4, x, 92, 70);
    g.addColorStop(0, `rgba(255,226,140,${0.45 + Math.sin(time * 2 + x) * 0.04})`);
    g.addColorStop(1, 'rgba(255,226,140,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 70, 22, 140, 140);
    ctx.fillStyle = '#ffd1e0';
    ctx.beginPath();
    ctx.moveTo(x - 16, 98);
    ctx.lineTo(x - 8, 82);
    ctx.lineTo(x + 8, 82);
    ctx.lineTo(x + 16, 98);
    ctx.closePath();
    ctx.fill();
  }
  // the way back out to the village, with a welcome mat
  drawDoor(ctx) {
    const x = STORE_EXIT_X, base = GROUND;
    ctx.fillStyle = '#8f6240';
    ctx.beginPath();
    ctx.roundRect(x - 36, base - 116, 72, 116, [36, 36, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#7fc8c0';
    ctx.beginPath();
    ctx.roundRect(x - 30, base - 110, 60, 110, [30, 30, 0, 0]);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.roundRect(x - 20, base - 96, 40, 40, [20, 20, 4, 4]);
    ctx.fill();
    ctx.fillStyle = '#ffd36b';
    circle(ctx, x + 20, base - 48, 3.5);
    ctx.fillStyle = '#e88f6a';
    ctx.beginPath();
    ctx.roundRect(x - 40, base - 4, 80, 6, 3);
    ctx.fill();
    // a "Welcome" board just inside
    this.drawSign(ctx, 'Welcome! Pick a section, or walk on through', 470, 190);
  }
  // a door to another part of the showroom: a coloured arch with a number (or an arrow) and its name
  drawArchDoor(ctx, x, color, mark, name) {
    const base = GROUND;
    ctx.fillStyle = mix(color, '#000000', 0.25);
    ctx.beginPath();
    ctx.roundRect(x - 30, base - 96, 60, 96, [30, 30, 0, 0]);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - 25, base - 91, 50, 91, [25, 25, 0, 0]);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    circle(ctx, x, base - 62, 14);
    text(ctx, mark, x, base - 61, 16, '#5b4a6b');
    text(ctx, name, x, base - 112, 12, '#5b4a6b');
  }
}

// The store's front in the village: a shop window full of furniture under a striped awning (drawn over
// the house shape village.js gives it, `x` its left edge, `w` its width)
export function drawStoreWindow(ctx, x, w, base, time) {
  const wx = x + w * 0.52, wy = base - 104, ww = w * 0.4, wh = 62;
  ctx.fillStyle = '#e2f1ff';
  ctx.beginPath();
  ctx.roundRect(wx, wy, ww, wh, 8);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(wx, wy, ww, wh, 8);
  ctx.clip();
  ctx.translate(wx + ww / 2, wy + wh);
  ctx.scale(0.42, 0.42);
  drawFurniture(ctx, 'sofa', -40, 0, false, time);
  drawFurniture(ctx, 'lamp', 60, 0, false, time);
  ctx.restore();
  ctx.strokeStyle = '#c99b6b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(wx, wy, ww, wh, 8);
  ctx.stroke();
  // awning
  const n = 6, aw = ww + 16;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#fffaf0' : '#7fc8c0';
    ctx.beginPath();
    ctx.moveTo(wx - 8 + (aw / n) * i, wy - 16);
    ctx.lineTo(wx - 8 + (aw / n) * (i + 1), wy - 16);
    ctx.lineTo(wx - 8 + (aw / n) * (i + 1), wy - 2);
    ctx.arc(wx - 8 + (aw / n) * (i + 0.5), wy - 2, aw / n / 2, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(wx + 6, wy + 6, 4, 22);
}
