// Docs: docs/places/pets.md
// Pets' moods and pet food, drawn: how a pet looks at each mood (petLook: droopier, greyer, slower, and
// staying closer to its spot the hungrier it is), what floats over it (drawPetMood: hearts when happy, a
// thought of food when peckish, tears when sad, a rain cloud when starving), its belly bar (drawBelly),
// and the food's bag icons (PET_ICONS, used by src/field.js drawItemIcon).
import { TAU, circle, ellipse } from './util.js';

// mood: an index into PET_MOODS (src/shared/house.js), 0 happy → 3 starving
export const petLook = (mood) => ({
  squash: [0, 0.03, 0.08, 0.14][mood], // flatter: a droopy jelly
  sat: [1, 0.9, 0.65, 0.4][mood], // greyer
  roam: [1, 0.8, 0.45, 0.15][mood], // how far it still wanders
});

// Over a pet whose top is at (x, top)
export function drawPetMood(ctx, mood, x, top, w, time, seed) {
  ctx.save();
  if (mood === 0) {
    // now and then a little heart floats up
    const u = (time * 0.35 + seed) % 1;
    if (u < 0.5) {
      const k = u / 0.5;
      ctx.globalAlpha = 1 - k;
      heart(ctx, x + Math.sin(k * 6 + seed) * 6, top - 8 - k * 26, 5 + k * 2, '#ff8fb1');
    }
  } else if (mood === 1) {
    thought(ctx, x + w * 0.3, top - 14, time, false);
  } else {
    // tears from both eyes
    for (const side of [-1, 1]) {
      const u = (time * 0.9 + seed + (side > 0 ? 0.5 : 0)) % 1;
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = '#8fd0ff';
      const tx = x + side * Math.min(18, w * 0.22), ty = top + 14 + u * 22;
      ctx.beginPath();
      ctx.moveTo(tx, ty - 5);
      ctx.quadraticCurveTo(tx + 3.5, ty + 1, tx, ty + 3);
      ctx.quadraticCurveTo(tx - 3.5, ty + 1, tx, ty - 5);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (mood === 2) thought(ctx, x + w * 0.3, top - 14, time, true);
    else rainCloud(ctx, x, top - 26, time, seed);
  }
  ctx.restore();
}

// A belly bar over a pet: how full it is (0–1), red when it's nearly empty
export function drawBelly(ctx, x, y, full) {
  const w = 54;
  ctx.fillStyle = 'rgba(255,250,240,0.92)';
  ctx.beginPath();
  ctx.roundRect(x - w / 2 - 3, y - 4, w + 6, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#eadfd2';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 1, w, 4, 2);
  ctx.fill();
  ctx.fillStyle = full >= 0.5 ? '#8fd18a' : full >= 0.25 ? '#ffc66b' : '#ff7a7a';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 1, Math.max(2, w * full), 4, 2);
  ctx.fill();
}

function heart(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.7, y - r * 1.4, x, y - r * 0.5);
  ctx.bezierCurveTo(x + r * 0.7, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r);
  ctx.fill();
}
// A thought bubble with a bowl in it (empty, when it's sad)
function thought(ctx, x, y, time, empty) {
  const bob = Math.sin(time * 2) * 1.5;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  circle(ctx, x - 9, y + 12 + bob, 2.5);
  circle(ctx, x - 4, y + 6 + bob, 3.5);
  ellipse(ctx, x + 10, y - 6 + bob, 16, 12);
  ctx.fillStyle = '#d98f6a';
  ctx.beginPath();
  ctx.ellipse(x + 10, y - 6 + bob, 9, 6, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = empty ? '#c9b6a0' : '#ffd36b';
  ellipse(ctx, x + 10, y - 6 + bob, 9, empty ? 1.2 : 2.5);
}
function rainCloud(ctx, x, y, time, seed) {
  ctx.fillStyle = '#9aa3b5';
  for (const [dx, dy, r] of [[-12, 2, 9], [0, -3, 12], [12, 2, 9]]) circle(ctx, x + dx, y + dy + Math.sin(time * 1.3 + seed) * 1.5, r);
  ctx.strokeStyle = '#8fb8e0';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const u = (time * 1.6 + i * 0.27 + seed) % 1, dx = -12 + i * 8;
    ctx.moveTo(x + dx, y + 10 + u * 18);
    ctx.lineTo(x + dx - 1.5, y + 15 + u * 18);
  }
  ctx.stroke();
}

// ——— pet food in the bag (40 px box, centred) ———
function iconKibble(ctx) {
  // a little paper sack, rolled at the top, with biscuits spilling out
  ctx.fillStyle = '#e8c890';
  ctx.strokeStyle = '#a07a48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, -10);
  ctx.lineTo(12, -10);
  ctx.lineTo(14, 14);
  ctx.lineTo(-14, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d8b07a';
  ctx.fillRect(-13, -15, 26, 6);
  ctx.strokeRect(-13, -15, 26, 6);
  ctx.fillStyle = '#ff8fb1'; // a paw print on the front
  circle(ctx, 0, 4, 4);
  for (const [dx, dy] of [[-5, -2], [-1.5, -4.5], [2.5, -4.5], [6, -2]]) circle(ctx, dx, dy, 1.6);
  ctx.fillStyle = '#c98a5a';
  for (const [dx, dy] of [[-15, 15], [16, 13], [10, 17]]) ellipse(ctx, dx, dy, 3.5, 2.5);
}
function iconStew(ctx) {
  // a round bowl of stew, steaming
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  for (const dx of [-6, 2, 9]) {
    ctx.beginPath();
    ctx.moveTo(dx, -6);
    ctx.quadraticCurveTo(dx - 4, -11, dx, -15);
    ctx.stroke();
  }
  ctx.fillStyle = '#c96a4a';
  ctx.beginPath();
  ctx.ellipse(0, -1, 17, 5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  for (const [dx, dy] of [[-7, -1], [3, -2], [9, 0]]) circle(ctx, dx, dy, 2);
  ctx.fillStyle = '#9fd8ff';
  ctx.strokeStyle = '#5a8fb8';
  ctx.beginPath();
  ctx.moveTo(-18, -1);
  ctx.quadraticCurveTo(-16, 16, 0, 16);
  ctx.quadraticCurveTo(16, 16, 18, -1);
  ctx.quadraticCurveTo(0, 5, -18, -1);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  circle(ctx, -8, 8, 2.2);
}
export const PET_ICONS = { pet_kibble: iconKibble, pet_stew: iconStew };

// Auntie Clover (the Pet Shop's keeper, accessory 'petkeeper'): a polka-dot headscarf knotted in a bow, an
// apron with a paw print, a sprig of clover tucked in the scarf and a biscuit in her apron pocket.
// clip(ctx, w, h): the body's outline (src/slime.js), so the apron sits on the jelly.
export function drawPetkeeperDress(ctx, w, h, fx, t, clip) {
  ctx.save();
  ctx.save();
  clip(ctx, w, h);
  ctx.clip();
  const ay = -h * 0.26;
  ctx.fillStyle = '#fff6ea';
  ctx.beginPath();
  ctx.roundRect(-w * 0.26 + fx * 0.3, ay, w * 0.6, -ay + 4, [8, 8, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#ffb3c7';
  ctx.fillRect(-w / 2, ay - 1, w, 3.4);
  ctx.fillStyle = 'rgba(217,106,138,0.55)';
  const px = fx * 0.3 + w * 0.04, py = -h * 0.12;
  ellipse(ctx, px, py, 4, 3.2);
  for (const [dx, dy] of [[-4.5, -4], [-1.6, -6.2], [1.6, -6.2], [4.5, -4]]) circle(ctx, px + dx, py + dy, 1.4);
  ctx.restore();
  // the headscarf: a rounded cap of cloth over the top, white dots, a bow knotted at the back
  const by = -h * 0.84;
  ctx.fillStyle = '#d96a8a';
  ctx.beginPath();
  ctx.ellipse(0, by + 4, w * 0.42, 15, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [x, y] of [[-0.24, 2], [-0.06, -6], [0.14, -1], [0.3, 1], [0.02, 2]]) circle(ctx, w * x, by + y, 1.8);
  const bx = -Math.sign(fx || 1) * w * 0.4, sway = Math.sin(t * 2) * 0.12;
  ctx.fillStyle = '#c95a7a';
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(s * 0.6 + sway);
    ctx.beginPath();
    ctx.ellipse(0, -6, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  circle(ctx, bx, by, 3);
  // the clover sprig
  ctx.fillStyle = '#6cc96a';
  const cx = Math.sign(fx || 1) * w * 0.26, cy = by - 8;
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i - 1) * 1.1;
    circle(ctx, cx + Math.cos(a) * 3.2, cy + Math.sin(a) * 3.2, 2.6);
  }
  ctx.strokeStyle = '#4fa04a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + 1, cy + 6);
  ctx.stroke();
  ctx.restore();
}
