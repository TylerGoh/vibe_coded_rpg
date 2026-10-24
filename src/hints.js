// Docs: docs/ui/hints.md
// "What can I do here?": a stack of prompts above your own slime listing every action available where
// you stand (key cap + what it does), and little bouncing beacons over doors and characters that are
// close by but not in reach yet, so people notice them from a distance. main.js decides the actions.
import { W, clamp } from './util.js';
import { text } from './village.js';

const FONT = "Fredoka, 'Trebuchet MS', sans-serif";

// What each key is called on the touch controls (src/touch.js)
const TOUCH_NAMES = { E: 'E', Z: 'Loot', X: 'Hit', '↓': '▼', '↓+X': '▼ Hit', H: 'Hand', C: 'Courses', Q: 'Ask Clio', I: 'Bag', Shift: 'Dash', Space: 'Jump' };
export const keyName = (key, touch) => (touch ? TOUCH_NAMES[key] ?? key : key);

function keycap(ctx, x, y, label, h = 22) {
  ctx.font = `700 13px ${FONT}`;
  const w = Math.max(h, ctx.measureText(label).width + 12);
  ctx.fillStyle = '#d9c3a8';
  ctx.beginPath();
  ctx.roundRect(x, y + 2, w, h, 6);
  ctx.fill();
  ctx.fillStyle = '#fffaf3';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = '#c9b29a';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  text(ctx, label, x + w / 2, y + h / 2 + 0.5, 13, '#5b4a6b');
  return w;
}

// A level chip ("Lv 1–12", "Boss Lv 12"): what a door into a combat room says about who it's for.
// hard: a hard pocket, in red with a warning mark. Returns its width; (x, y) is its left middle.
const chipW = (ctx, band, hard) => {
  ctx.font = `700 11px ${FONT}`;
  return ctx.measureText(band).width + (hard ? 30 : 14);
};
function chip(ctx, x, y, band, hard) {
  const w = chipW(ctx, band, hard);
  ctx.fillStyle = hard ? '#e0526e' : '#8fcf7e';
  ctx.beginPath();
  ctx.roundRect(x, y - 9, w, 18, 9);
  ctx.fill();
  ctx.strokeStyle = hard ? '#fff0c2' : 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.3;
  ctx.stroke();
  if (hard) {
    // a little warning triangle with a "!"
    ctx.fillStyle = '#fff0c2';
    ctx.beginPath();
    ctx.moveTo(x + 13, y - 6);
    ctx.lineTo(x + 19, y + 5);
    ctx.lineTo(x + 7, y + 5);
    ctx.closePath();
    ctx.fill();
    text(ctx, '!', x + 13, y + 1.5, 8, '#e0526e');
  }
  text(ctx, band, x + (hard ? 23 : 7), y + 0.5, 11, hard ? '#ffffff' : '#2f5a2a', 'left');
  return w;
}

// actions: [{ key, label, band?, hard? }], drawn bottom-up from `bottom` (world y), centred on x and kept
// on screen. band: a door's level chip, after its label.
export function drawPrompts(ctx, x, bottom, actions, camX, time, touch) {
  if (!actions.length) return;
  ctx.save();
  const rowH = 30, bob = Math.sin(time * 3) * 1.5;
  actions.forEach((a, i) => {
    const key = keyName(a.key, touch);
    const bandW = a.band ? chipW(ctx, a.band, a.hard) + 8 : 0;
    ctx.font = `700 13px ${FONT}`;
    const keyW = Math.max(22, ctx.measureText(key).width + 12);
    const labelW = ctx.measureText(a.label).width;
    const w = keyW + labelW + 24 + bandW;
    const left = clamp(x - w / 2, camX + 8, camX + W - w - 8);
    const y = bottom - (i + 1) * rowH + bob;
    ctx.fillStyle = 'rgba(45,42,62,0.62)';
    ctx.beginPath();
    ctx.roundRect(left, y - 3, w, 28, 14);
    ctx.fill();
    keycap(ctx, left + 4, y, key);
    text(ctx, a.label, left + keyW + 12, y + 11.5, 13, '#ffffff', 'left');
    if (a.band) chip(ctx, left + keyW + 12 + labelW + 8, y + 11, a.band, a.hard);
  });
  ctx.restore();
}

// The level chip over a door into a combat room, readable from across the screen (x: the door's middle)
export function drawDoorBand(ctx, x, y, band, hard) {
  ctx.save();
  chip(ctx, x - chipW(ctx, band, hard) / 2, y, band, hard);
  ctx.restore();
}

// A small bouncing key over something you could use if you walked up to it. k: 0..1 fade.
export function drawBeacon(ctx, x, y, key, k, time, touch) {
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha = k;
  const label = keyName(key, touch);
  const by = y + Math.sin(time * 4 + x * 0.01) * 4;
  ctx.font = `700 13px ${FONT}`;
  const w = Math.max(22, ctx.measureText(label).width + 12);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.moveTo(x - 6, by + 22);
  ctx.lineTo(x, by + 30);
  ctx.lineTo(x + 6, by + 22);
  ctx.fill();
  keycap(ctx, x - w / 2, by, label);
  ctx.restore();
}
