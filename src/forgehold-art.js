// Docs: docs/places/forgehold.md, docs/art.md
// Forgehold's art that isn't the room itself (src/forgehold.js): the forge folk's look (FORGE_PALETTE,
// drawForgeFolk: dark, dense, ember-flecked, called by src/slime.js), what Forgehold's people and the
// Lodestar's skipper wear (drawForgeDress: Forgewarden Ash, Auntie Soot, Slag, Skipper Arne), Slag's gear
// (FORGE_SWORDS, FORGE_SWORD_LEN, FORGE_HELMETS; the Bellows Rod is data in src/staff-art.js) and the
// item icons (FORGE_ICONS: Auntie Soot's spring-boiled egg).
import { TAU, circle, ellipse, clamp } from './util.js';

// ——— the forge folk (story/characters/people.md) ———
// Dark and dense, flecked with embers, stiff in the wobble (Slime.folk = 'forge'). Mid-dark rather than black,
// so the face still reads.
export const FORGE_PALETTE = (hue) => ({
  top: `hsl(${hue} 16% 50%)`,
  bottom: `hsl(${hue} 22% 31%)`,
  line: `hsl(${hue} 26% 18%)`,
  cheek: `hsl(${hue} 46% 60%)`,
});
// Drawn over the body (clipped to it): a soot-dark crown, a warm glow low down, and ember flecks that pulse
export function drawForgeFolk(ctx, w, h, t) {
  ctx.fillStyle = 'rgba(40,30,38,0.28)';
  ellipse(ctx, 0, -h * 0.98, w * 0.5, h * 0.22);
  const g = ctx.createLinearGradient(0, -h * 0.35, 0, 0);
  g.addColorStop(0, 'rgba(255,140,80,0)');
  g.addColorStop(1, 'rgba(255,140,80,0.22)');
  ctx.fillStyle = g;
  ctx.fillRect(-w * 0.6, -h * 0.35, w * 1.2, h * 0.4);
  for (const [fx, fy, ph] of [[-0.3, 0.62, 0], [0.34, 0.74, 1.7], [-0.12, 0.22, 3.1], [0.26, 0.3, 4.4], [-0.38, 0.36, 5.3]]) {
    const k = 0.45 + 0.55 * clamp(Math.sin(t * 1.9 + ph), 0, 1);
    ctx.fillStyle = `rgba(255,${150 + Math.round(60 * k)},90,${0.5 + 0.45 * k})`;
    circle(ctx, w * fx, -h * fy, 1.3 + k * 0.7);
  }
}

// What Forgehold's people (and Arne) wear: their NPCS `accessory`, drawn over the face, facing right.
// fx: the face's centre x.
export function drawForgeDress(ctx, kind, w, h, fx, t) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const fy = -h * 0.42;
  if (kind === 'forgewarden') {
    // Forgewarden Ash: a scorched leather apron, a band of rag round the brow, heavy grey brows, and his
    // hammer, head down, leaning against him
    ctx.strokeStyle = '#4a3a34';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-w * 0.62, -h * 0.02);
    ctx.lineTo(-w * 0.7, -h * 0.9);
    ctx.stroke();
    ctx.fillStyle = '#5e5a64';
    ctx.strokeStyle = '#2e2a34';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-w * 0.82, -h * 1.02, w * 0.26, h * 0.2, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7a5038'; // the apron
    ctx.strokeStyle = '#4a2e20';
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, -h * 0.3);
    ctx.lineTo(w * 0.46, -h * 0.3);
    ctx.lineTo(w * 0.44, -h * 0.02);
    ctx.quadraticCurveTo(w * 0.12, h * 0.04, -w * 0.22, -h * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(30,20,20,0.35)'; // scorch marks
    ellipse(ctx, w * 0.1, -h * 0.16, 4, 2.5, 0.4);
    ellipse(ctx, w * 0.3, -h * 0.1, 3, 2, -0.3);
    ctx.strokeStyle = '#7a5038'; // its strap
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-w * 0.12, -h * 0.3);
    ctx.lineTo(-w * 0.02, -h * 0.62);
    ctx.moveTo(w * 0.42, -h * 0.3);
    ctx.lineTo(w * 0.36, -h * 0.66);
    ctx.stroke();
    ctx.fillStyle = '#a84a3a'; // the rag round his brow, knotted at the back
    ctx.beginPath();
    ctx.moveTo(-w * 0.44, -h * 0.74);
    ctx.quadraticCurveTo(0, -h * 0.9, w * 0.44, -h * 0.74);
    ctx.lineTo(w * 0.42, -h * 0.64);
    ctx.quadraticCurveTo(0, -h * 0.8, -w * 0.42, -h * 0.64);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -h * 0.7);
    ctx.lineTo(-w * 0.56, -h * 0.62 + Math.sin(t * 2) * 1.2);
    ctx.lineTo(-w * 0.5, -h * 0.76);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b8b4b8'; // heavy brows
    ctx.beginPath();
    ctx.roundRect(fx - 13, fy - 11, 11, 3.6, 1.8);
    ctx.roundRect(fx + 3, fy - 11, 11, 3.6, 1.8);
    ctx.fill();
  } else if (kind === 'bathkeeper') {
    // Auntie Soot: a striped towel wound round her head, and a little basket of eggs on her arm
    ctx.fillStyle = '#f2e6d8';
    ctx.strokeStyle = '#b8a48e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.46, -h * 0.66);
    ctx.bezierCurveTo(-w * 0.5, -h * 1.18, w * 0.5, -h * 1.2, w * 0.46, -h * 0.66);
    ctx.quadraticCurveTo(0, -h * 0.82, -w * 0.46, -h * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#d0607a'; // its stripes
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.36, -h * 0.9);
    ctx.quadraticCurveTo(0, -h * 1.02, w * 0.36, -h * 0.9);
    ctx.moveTo(-w * 0.42, -h * 0.78);
    ctx.quadraticCurveTo(0, -h * 0.9, w * 0.42, -h * 0.78);
    ctx.stroke();
    ctx.fillStyle = '#f2e6d8'; // the tucked-in end, standing up
    ctx.beginPath();
    ctx.ellipse(w * 0.12, -h * 1.1, 6, 4, -0.4, 0, TAU);
    ctx.fill();
    // the basket
    const bx = w * 0.5, by = -h * 0.12;
    ctx.fillStyle = '#c9965a';
    ctx.strokeStyle = '#8a6036';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx - 9, by - 8);
    ctx.lineTo(bx + 9, by - 8);
    ctx.lineTo(bx + 7, by + 2);
    ctx.lineTo(bx - 7, by + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bx, by - 8, 8, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#fff6ea';
    for (const dx of [-4.5, 0.5, 5]) ellipse(ctx, bx + dx, by - 9, 3, 3.8);
    const k = (t * 0.5) % 1; // a curl of steam off the eggs
    ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - k)})`;
    circle(ctx, bx + Math.sin(k * 6) * 2, by - 14 - k * 12, 2 + k * 3);
  } else if (kind === 'apprentice') {
    // Slag: a leather cap far too big for him, goggles pushed up on it, a soot smudge, and his file
    ctx.fillStyle = '#6a4a38';
    ctx.strokeStyle = '#3e2a20';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.54, -h * 0.66);
    ctx.bezierCurveTo(-w * 0.56, -h * 1.26, w * 0.56, -h * 1.26, w * 0.54, -h * 0.66);
    ctx.quadraticCurveTo(0, -h * 0.84, -w * 0.54, -h * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7a5a44'; // its peak, sliding down over one eye a bit
    ctx.beginPath();
    ctx.ellipse(w * 0.32, -h * 0.68, w * 0.28, h * 0.07, 0.15, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#3e3a40'; // goggles, pushed up
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h * 0.9);
    ctx.lineTo(w * 0.5, -h * 0.9);
    ctx.stroke();
    for (const dx of [-0.1, 0.18]) {
      ctx.fillStyle = '#5a5660';
      circle(ctx, w * dx, -h * 0.92, 5.4);
      ctx.fillStyle = '#ffb27a';
      circle(ctx, w * dx, -h * 0.92, 3.6);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      circle(ctx, w * dx - 1.2, -h * 0.94, 1.1);
    }
    ctx.fillStyle = 'rgba(30,24,30,0.4)'; // the smudge
    ellipse(ctx, fx + 15, fy + 9, 4.5, 2.4, -0.3);
    // the file, held up: he's always filing something
    const ax = w * 0.62, ay = -h * 0.3, rot = -0.6 + Math.sin(t * 6) * 0.15;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(rot);
    ctx.fillStyle = '#8a6040';
    ctx.beginPath();
    ctx.roundRect(-2.4, -2, 4.8, 9, 2);
    ctx.fill();
    ctx.fillStyle = '#b8b8c4';
    ctx.strokeStyle = '#6a6a78';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-1.8, -20, 3.6, 18, 1);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (kind === 'skipper') {
    // Skipper Arne: a navy knitted watch cap with a red bobble, a thick grey beard, an oilskin collar turned up
    ctx.fillStyle = '#e8c45a'; // the oilskin
    ctx.strokeStyle = '#a8862e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.48, -h * 0.12);
    ctx.lineTo(-w * 0.44, -h * 0.36);
    ctx.quadraticCurveTo(0, -h * 0.26, w * 0.46, -h * 0.36);
    ctx.lineTo(w * 0.5, -h * 0.1);
    ctx.quadraticCurveTo(0, h * 0.02, -w * 0.48, -h * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d8dce4'; // the beard
    ctx.strokeStyle = '#a8aeba';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(fx - 16, fy + 4);
    ctx.quadraticCurveTo(fx - 18, fy + 22, fx + 1, fy + 26 + Math.sin(t * 1.4) * 0.6);
    ctx.quadraticCurveTo(fx + 19, fy + 22, fx + 17, fy + 4);
    ctx.quadraticCurveTo(fx + 1, fy + 12, fx - 16, fy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3e4a6a'; // the cap
    ctx.strokeStyle = '#26304a';
    ctx.beginPath();
    ctx.moveTo(-w * 0.48, -h * 0.66);
    ctx.bezierCurveTo(-w * 0.5, -h * 1.2, w * 0.5, -h * 1.2, w * 0.48, -h * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4e5a7e'; // its turned-up brim, ribbed
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h * 0.76, w, h * 0.13, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,38,60,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -w * 0.44; x < w * 0.46; x += 5) {
      ctx.moveTo(x, -h * 0.75);
      ctx.lineTo(x, -h * 0.64);
    }
    ctx.stroke();
    ctx.fillStyle = '#d0485a'; // the bobble
    circle(ctx, 0, -h * 1.08, 5.2);
  }
  ctx.restore();
}

// ——— Slag's gear (SHOPS.slag in rpg.js) ———
const grip = (ctx, c1, c2) => {
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.strokeStyle = c2;
  ctx.lineWidth = 1;
  for (let y = -1; y < 10; y += 3.2) {
    ctx.beginPath();
    ctx.moveTo(-3, y);
    ctx.lineTo(3, y + 1.6);
    ctx.stroke();
  }
};
// Slag Maul: an iron haft with a lump of black slag for a head, glowing in its cracks. L: from the hand.
function drawSlagMaul(ctx, L, glow) {
  ctx.save();
  ctx.fillStyle = '#6a646e';
  ctx.strokeStyle = '#34303a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-2.6, -L + 14, 5.2, L - 12, 2); // the haft
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a8490';
  for (const y of [-L * 0.35, -L * 0.6]) ctx.fillRect(-3.4, y, 6.8, 3); // iron bands
  // the head: a rough lump
  ctx.fillStyle = '#3a3240';
  ctx.strokeStyle = '#1e1824';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-13, -L + 18);
  ctx.lineTo(-15, -L + 6);
  ctx.lineTo(-8, -L - 2);
  ctx.lineTo(4, -L - 4);
  ctx.lineTo(14, -L + 2);
  ctx.lineTo(15, -L + 14);
  ctx.lineTo(8, -L + 22);
  ctx.lineTo(-6, -L + 23);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,100,120,0.6)'; // a dull sheen
  ellipse(ctx, -6, -L + 4, 4, 2.4, -0.4);
  ctx.strokeStyle = `rgba(255,${140 + Math.round(60 * glow)},70,${0.6 + 0.4 * glow})`; // the cracks, still hot
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-10, -L + 10);
  ctx.lineTo(-3, -L + 13);
  ctx.lineTo(2, -L + 6);
  ctx.moveTo(2, -L + 6);
  ctx.lineTo(9, -L + 12);
  ctx.moveTo(-3, -L + 13);
  ctx.lineTo(-1, -L + 20);
  ctx.stroke();
  grip(ctx, '#5a3e2e', '#2e2018');
  ctx.restore();
}
export const FORGE_SWORDS = { slag_maul: drawSlagMaul };
export const FORGE_SWORD_LEN = { slag_maul: 56 };

// Smith's Iron Cap: a riveted iron dome with a leather flap down the back of the neck, scorched
function drawSmithCap(ctx, w, h, t = 0) {
  const by = -h * 0.72, rx = w * 0.5;
  ctx.fillStyle = '#7a5038'; // the flap, behind
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by - 2, rx * 0.5, h * 0.36, [2, 2, 8, 8]);
  ctx.fill();
  const g = ctx.createLinearGradient(0, by - h * 0.46, 0, by + 4);
  g.addColorStop(0, '#9a96a2');
  g.addColorStop(1, '#5e5a66');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2e2a34';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 5);
  ctx.bezierCurveTo(-rx, by - h * 0.5, rx, by - h * 0.5, rx, by + 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4e4a56'; // the rim and its rivets
  ctx.beginPath();
  ctx.roundRect(-rx * 1.04, by, rx * 2.08, 6, 3);
  ctx.fill();
  ctx.fillStyle = '#b8b4c0';
  for (let i = -3; i <= 3; i++) circle(ctx, i * rx * 0.28, by + 3, 1.3);
  ctx.strokeStyle = '#4e4a56'; // a riveted strip over the crown
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.1, by);
  ctx.quadraticCurveTo(0, by - h * 0.42, rx * 0.1, by - h * 0.38);
  ctx.stroke();
  ctx.fillStyle = 'rgba(40,26,26,0.4)'; // a scorch
  ellipse(ctx, rx * 0.4, by - h * 0.14, 5, 3, 0.5);
  const k = clamp(Math.sin(t * 1.6), 0, 1); // a spark caught on the rim now and then
  if (k > 0.6) {
    ctx.fillStyle = `rgba(255,200,110,${(k - 0.6) * 2.5})`;
    circle(ctx, -rx * 0.6, by + 1, 1.8);
  }
}
export const FORGE_HELMETS = { smith_cap: drawSmithCap };

// ——— item icons (40 × 40, centred) ———
export const FORGE_ICONS = {
  // Auntie Soot's spring-boiled egg, in a little twist of cloth, steaming
  spring_egg(ctx) {
    ctx.fillStyle = '#e8d6c0';
    ctx.strokeStyle = '#b8a48e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-14, 6);
    ctx.quadraticCurveTo(0, 18, 14, 6);
    ctx.lineTo(10, 14);
    ctx.quadraticCurveTo(0, 20, -10, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fffaf0';
    ctx.strokeStyle = '#c8b8a0';
    ctx.beginPath();
    ctx.ellipse(0, -1, 10, 13, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ellipse(ctx, -4, -6, 2.6, 4, -0.3);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; // steam
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(5, -15);
    ctx.quadraticCurveTo(9, -19, 5, -22);
    ctx.quadraticCurveTo(1, -25, 5, -28);
    ctx.stroke();
  },
};
