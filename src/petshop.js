// Docs: docs/places/pets.md
// The Pet Shop (room PETSHOP), "Clover's Critters": Auntie Clover's food counter by the door (she's an AI
// character who trades: the food is her Trade button, SHOPS.clover), then every pet on a cushioned plinth
// with its price (PET_DISPLAY in src/shared/house.js). Walking up to a pet and pressing E opens the
// furniture store's buy card (src/store.js does the buying for both rooms). Also draws the shop's front
// in the village (src/village.js).
import { H, circle, ellipse } from './util.js';
import { text } from './village.js';
import { PETSHOP_EXIT_X, CLOVER_X } from './shared/rpg.js';
import { PET_DISPLAY, STORE_GROUND } from './shared/house.js';
import { drawWallpaper, drawFloor, drawPet } from './furniture.js';
import { PET_ICONS } from './pet-art.js';

const GROUND = STORE_GROUND;
const snap = (x, n) => Math.floor(x / n) * n; // patterns start on a fixed grid, so they don't slide with the camera
const ROSE = 5, PALE_WOOD = 1; // WALLPAPERS / FLOORS indices
const first = PET_DISPLAY[0].x - 80, last = PET_DISPLAY[PET_DISPLAY.length - 1].x + 80;

// store: the Store (src/store.js), for its signs, lights, tags and display drawing
export function drawPetShop(ctx, store, camX, viewW, time) {
  const L = camX - 40, R = camX + viewW + 40, L0 = snap(L, 240);
  drawWallpaper(ctx, ROSE, L0, R, 0, GROUND);
  // the pets' corner: a soft yellow band behind the plinths, with paw prints
  ctx.fillStyle = 'rgba(255,241,200,0.6)';
  ctx.fillRect(first, 60, last - first, GROUND - 60);
  ctx.fillStyle = 'rgba(217,106,138,0.18)';
  for (let x = snap(Math.max(first, L), 160) + 40; x < Math.min(last, R); x += 160) paw(ctx, x, 150 + ((x / 160) % 2) * 40, 1);
  // wainscot and skirting
  ctx.fillStyle = 'rgba(201,155,107,0.18)';
  ctx.fillRect(L, GROUND - 90, R - L, 90);
  ctx.fillStyle = '#e3bf91';
  ctx.fillRect(L, GROUND - 92, R - L, 5);
  drawFloor(ctx, PALE_WOOD, L0, R, GROUND, H);
  // ceiling with hanging lights
  ctx.fillStyle = '#a8794f';
  ctx.fillRect(L, 0, R - L, 44);
  ctx.fillStyle = '#c99b6b';
  ctx.fillRect(L, 40, R - L, 12);
  for (let x = Math.floor(L / 240) * 240 + 120; x < R; x += 240) store.drawLight(ctx, x, time);
  drawDoor(ctx);
  drawCounter(ctx, time);
  store.drawSign(ctx, "Clover's Critters", CLOVER_X, 104);
  store.drawSign(ctx, 'Adopt a pet: feed it, or it dies (a full belly lasts 2 days)', (first + last) / 2, 104);
  drawBasket(ctx, 690, time);
  store.drawDisplay(ctx, PET_DISPLAY, L, R, time);
}

function paw(ctx, x, y, s) {
  ellipse(ctx, x, y, 9 * s, 7 * s);
  for (const [dx, dy] of [[-10, -9], [-3.5, -14], [3.5, -14], [10, -9]]) circle(ctx, x + dx * s, y + dy * s, 3.4 * s);
}

// the way back out to the village, with a welcome mat
function drawDoor(ctx) {
  const x = PETSHOP_EXIT_X, base = GROUND;
  ctx.fillStyle = '#8f6240';
  ctx.beginPath();
  ctx.roundRect(x - 36, base - 116, 72, 116, [36, 36, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#ffb3c7';
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
}

// Auntie Clover's counter (she stands at CLOVER_X, drawn by main.js as a character): shelves of food behind
// her, a counter beside her with a sack of kibble and a steaming pot of stew
function drawCounter(ctx, time) {
  const x = CLOVER_X, base = GROUND;
  // shelves on the wall behind
  ctx.fillStyle = '#c99b6b';
  for (const y of [base - 230, base - 170]) {
    ctx.beginPath();
    ctx.roundRect(x - 150, y, 300, 8, 3);
    ctx.fill();
  }
  for (let i = 0; i < 6; i++) {
    for (const [y, k] of [[base - 230, 'pet_kibble'], [base - 170, 'pet_stew']]) {
      ctx.save();
      ctx.translate(x - 125 + i * 50, y - 14);
      ctx.scale(0.7, 0.7);
      PET_ICONS[k](ctx);
      ctx.restore();
    }
  }
  // the counter, to her right
  const cx = x + 70, cw = 150, ch = 70;
  ctx.fillStyle = '#d9a46c';
  ctx.beginPath();
  ctx.roundRect(cx, base - ch, cw, ch, [6, 6, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#c99360';
  ctx.fillRect(cx, base - ch + 14, cw, 4);
  ctx.fillStyle = '#ffb3c7';
  ctx.beginPath();
  ctx.roundRect(cx - 6, base - ch - 8, cw + 12, 10, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(217,106,138,0.45)';
  paw(ctx, cx + cw / 2, base - 30, 1);
  // on top: a sack of kibble and a pot of stew
  ctx.save();
  ctx.translate(cx + 38, base - ch - 22);
  PET_ICONS.pet_kibble(ctx);
  ctx.restore();
  ctx.save();
  ctx.translate(cx + 108, base - ch - 20 + Math.sin(time * 2) * 0.5);
  PET_ICONS.pet_stew(ctx);
  ctx.restore();
  text(ctx, 'Pet food: talk to Clover', cx + cw / 2, base - ch - 52, 12, '#5b4a6b');
}

// A basket by the counter where a Mini Turnipop naps (a pet of the shop's own: not for sale)
function drawBasket(ctx, x, time) {
  const base = GROUND;
  drawPet(ctx, 'turnipop', x, base - 14, 1, false, time * 0.4, 3);
  ctx.fillStyle = '#d8b07a';
  ctx.strokeStyle = '#a07a48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 34, base - 24, 68, 24, [4, 4, 10, 10]);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(160,122,72,0.6)';
  ctx.beginPath();
  for (let dx = -26; dx <= 26; dx += 10) {
    ctx.moveTo(x + dx, base - 22);
    ctx.lineTo(x + dx + 4, base - 2);
  }
  ctx.stroke();
  text(ctx, 'z', x + 22, base - 52 - Math.sin(time * 1.5) * 3, 12, '#8a7a9b');
}

// The shop's front in the village: a round window with a pet curled up in it, and paw-print bunting (drawn
// over the house shape village.js gives it, `x` its left edge, `w` its width)
export function drawPetShopWindow(ctx, x, w, base, time) {
  const wx = x + w * 0.72, wy = base - 78, r = 30;
  ctx.fillStyle = '#fff1e8';
  circle(ctx, wx, wy, r);
  ctx.save();
  ctx.beginPath();
  ctx.arc(wx, wy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#ffb3c7'; // a cushion
  ellipse(ctx, wx, wy + r - 6, r, 10);
  ctx.translate(wx, wy + r - 8);
  ctx.scale(0.55, 0.55);
  drawPet(ctx, 'sprout_king', 0, 0, -1, false, time * 0.5, 1);
  ctx.restore();
  ctx.strokeStyle = '#c99b6b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(wx, wy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(wx - 18, wy - 16, 4, 16);
  ctx.fillStyle = '#d96a8a'; // a paw print over the window
  paw(ctx, wx, wy - r - 14, 0.7);
}
