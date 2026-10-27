// Docs: docs/places/houses.md
// Drawings of every piece of house furniture (FURNITURE in src/shared/house.js), wallpapers and floors.
// Each piece is drawn from its bottom centre (x, y), facing right; f flips it. Soft pastel shapes, no images.
import { drawLadonPet } from './ladon-art.js';
import { drawFenrirPet } from './fenrir-art.js';
import { TAU, circle, ellipse, mix } from './util.js';
import { FURNITURE, WALLPAPERS, FLOORS, PET_SCALE } from './shared/house.js';
import { MOBS } from './shared/rpg.js';
import { petLook } from './pet-art.js';
import { drawBoss } from './dens.js';
import { drawMob } from './field.js';

const INK = '#5b4a6b';
const WOOD = '#c99b6b', WOOD_DARK = '#a8794f', WOOD_LIGHT = '#e3bf91';

function rr(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function shine(ctx, x, y, rx, ry, a = 0.45) {
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ellipse(ctx, x, y, rx, ry, -0.4);
}

// Every drawing works in local coordinates: (0, 0) is the bottom centre, up is negative y.
const DRAW = {
  bed(ctx) {
    rr(ctx, 56, -86, 16, 86, 6, WOOD_DARK); // headboard
    rr(ctx, 50, -92, 28, 12, 6, WOOD);
    rr(ctx, -74, -44, 148, 30, 10, '#fffaf3'); // mattress
    rr(ctx, -74, -48, 112, 34, [12, 6, 6, 12], '#ffb3c7'); // blanket
    ctx.fillStyle = '#ff9fb8';
    for (let i = 0; i < 4; i++) circle(ctx, -58 + i * 28, -32, 4);
    rr(ctx, 30, -58, 36, 18, 9, '#ffffff'); // pillow
    shine(ctx, -40, -44, 20, 4);
    rr(ctx, -74, -16, 148, 10, 4, WOOD);
    rr(ctx, -72, -8, 12, 8, 3, WOOD_DARK);
    rr(ctx, 60, -8, 12, 8, 3, WOOD_DARK);
  },
  sofa(ctx) {
    const c = '#9fd8ff', d = mix(c, '#5b7fa8', 0.35);
    rr(ctx, -62, -66, 124, 42, 16, d); // back
    rr(ctx, -70, -46, 22, 40, 10, c); // arms
    rr(ctx, 48, -46, 22, 40, 10, c);
    rr(ctx, -50, -38, 100, 22, 8, c); // seat cushions
    ctx.strokeStyle = d;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.lineTo(0, -18);
    ctx.stroke();
    rr(ctx, -66, -14, 132, 10, 5, d);
    rr(ctx, -60, -6, 8, 6, 2, WOOD_DARK);
    rr(ctx, 52, -6, 8, 6, 2, WOOD_DARK);
    shine(ctx, -30, -56, 16, 4);
    rr(ctx, 24, -56, 22, 20, 7, '#ffe28a'); // a cushion
  },
  armchair(ctx) {
    const c = '#c9b6ff', d = mix(c, INK, 0.3);
    rr(ctx, -30, -70, 60, 44, 16, d);
    rr(ctx, -38, -46, 16, 38, 8, c);
    rr(ctx, 22, -46, 16, 38, 8, c);
    rr(ctx, -24, -38, 48, 22, 8, c);
    rr(ctx, -36, -14, 72, 10, 5, d);
    rr(ctx, -32, -6, 7, 6, 2, WOOD_DARK);
    rr(ctx, 25, -6, 7, 6, 2, WOOD_DARK);
    shine(ctx, -10, -60, 10, 3);
  },
  beanbag(ctx) {
    ctx.fillStyle = '#ff9fb8';
    ctx.beginPath();
    ctx.moveTo(-35, 0);
    ctx.bezierCurveTo(-38, -30, -16, -42, 0, -40);
    ctx.bezierCurveTo(18, -42, 38, -30, 35, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = mix('#ff9fb8', INK, 0.18);
    ellipse(ctx, 0, -28, 22, 6);
    shine(ctx, -16, -28, 8, 5);
  },
  table(ctx) {
    rr(ctx, -60, -60, 120, 12, 5, WOOD);
    rr(ctx, -54, -50, 108, 6, 3, WOOD_DARK);
    rr(ctx, -50, -48, 9, 48, 3, WOOD_DARK);
    rr(ctx, 41, -48, 9, 48, 3, WOOD_DARK);
    rr(ctx, -58, -60, 116, 3, 2, WOOD_LIGHT);
  },
  chair(ctx) {
    rr(ctx, 12, -74, 8, 74, 3, WOOD_DARK); // back post
    rr(ctx, 8, -74, 16, 8, 4, WOOD);
    rr(ctx, 14, -62, 6, 24, 2, WOOD);
    rr(ctx, -22, -32, 46, 8, 4, WOOD); // seat
    rr(ctx, -18, -39, 36, 9, 4, '#ffb3c7'); // its cushion, on top (FURNITURE.chair.top sits in it)
    rr(ctx, -20, -26, 6, 26, 2, WOOD_DARK);
  },
  dresser(ctx) {
    rr(ctx, -50, -80, 100, 76, 8, '#fff3e2');
    ctx.strokeStyle = '#d9c3a8';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.roundRect(-42, -72 + i * 23, 84, 19, 5);
      ctx.stroke();
      ctx.fillStyle = '#ffd36b';
      circle(ctx, 0, -62.5 + i * 23, 3.5);
    }
    rr(ctx, -54, -82, 108, 8, 4, WOOD);
    rr(ctx, -46, -6, 10, 6, 2, WOOD_DARK);
    rr(ctx, 36, -6, 10, 6, 2, WOOD_DARK);
  },
  bookshelf(ctx) {
    rr(ctx, -46, -160, 92, 160, 6, WOOD_DARK);
    rr(ctx, -40, -152, 80, 146, 4, mix(WOOD_DARK, '#3a2a20', 0.35));
    const colors = ['#ff9fb8', '#9fd8ff', '#ffe28a', '#a6f5c9', '#c9b6ff', '#ffd1a1'];
    for (let r = 0; r < 4; r++) {
      const sy = -118 + r * 36;
      rr(ctx, -44, sy + 2, 88, 6, 2, WOOD);
      let bx = -38;
      for (let i = 0; bx < 34; i++) {
        const bw = 7 + ((r * 7 + i * 3) % 5), bh = 22 + ((r + i * 5) % 9);
        if ((r + i) % 7 === 5) {
          ctx.save(); // one leaning book
          ctx.translate(bx + 2, sy + 2);
          ctx.rotate(0.3);
          rr(ctx, 0, -bh, bw, bh, 2, colors[(r + i) % 6]);
          ctx.restore();
          bx += bw + 10;
          continue;
        }
        rr(ctx, bx, sy + 2 - bh, bw, bh, 2, colors[(r * 2 + i) % 6]);
        bx += bw + 1;
      }
    }
    rr(ctx, -50, -164, 100, 10, 4, WOOD);
  },
  fireplace(ctx, t) {
    rr(ctx, -70, -112, 140, 112, [12, 12, 0, 0], '#e8d2c0');
    ctx.fillStyle = '#d4bba6';
    for (let r = 0; r < 4; r++) for (let i = 0; i < 5; i++) ellipse(ctx, -56 + i * 28 + (r % 2) * 14, -98 + r * 26, 11, 5);
    rr(ctx, -40, -74, 80, 74, [36, 36, 0, 0], '#4a3a44');
    // the fire
    const flick = (k) => Math.sin(t * 9 + k) * 4;
    ctx.fillStyle = '#ff8a5b';
    ctx.beginPath();
    ctx.moveTo(-26, -8);
    ctx.quadraticCurveTo(-30, -36 + flick(1), -12, -52 + flick(2));
    ctx.quadraticCurveTo(-6, -36, 0, -60 + flick(3));
    ctx.quadraticCurveTo(10, -38, 14, -50 + flick(4));
    ctx.quadraticCurveTo(30, -30 + flick(5), 26, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.moveTo(-14, -8);
    ctx.quadraticCurveTo(-16, -26 + flick(6), -2, -38 + flick(7));
    ctx.quadraticCurveTo(14, -24 + flick(8), 14, -8);
    ctx.closePath();
    ctx.fill();
    rr(ctx, -30, -10, 60, 10, 4, '#8f6240'); // logs
    rr(ctx, -78, -120, 156, 14, 6, WOOD); // mantel
    rr(ctx, -74, -110, 148, 4, 2, WOOD_DARK);
    const glow = ctx.createRadialGradient(0, -30, 6, 0, -30, 90);
    glow.addColorStop(0, 'rgba(255,190,110,0.28)');
    glow.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-100, -120, 200, 130);
  },
  piano(ctx) {
    rr(ctx, -60, -96, 120, 92, [10, 10, 4, 4], '#4a3f5c');
    rr(ctx, -56, -92, 112, 28, 6, '#5d5175');
    rr(ctx, -64, -54, 128, 12, 4, '#4a3f5c');
    rr(ctx, -58, -54, 116, 8, 2, '#fffaf3');
    ctx.fillStyle = '#2d2a3e';
    for (let i = 0; i < 13; i++) if ([1, 2, 4, 5, 6].includes(i % 7)) ctx.fillRect(-56 + i * 8.6, -54, 4, 5);
    rr(ctx, -54, -42, 8, 42, 2, '#3d334d');
    rr(ctx, 46, -42, 8, 42, 2, '#3d334d');
    rr(ctx, -30, -88, 26, 18, 2, '#fffaf3'); // sheet music
    ctx.fillStyle = INK;
    for (let i = 0; i < 3; i++) ctx.fillRect(-27, -84 + i * 5, 20, 1);
    shine(ctx, 30, -84, 14, 3, 0.25);
  },
  lamp(ctx) {
    rr(ctx, -16, -6, 32, 6, 3, INK);
    rr(ctx, -2.5, -100, 5, 96, 2, '#8f7fa3');
    const g = ctx.createRadialGradient(0, -96, 4, 0, -96, 70);
    g.addColorStop(0, 'rgba(255,226,140,0.35)');
    g.addColorStop(1, 'rgba(255,226,140,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-70, -166, 140, 140);
    ctx.fillStyle = '#fff1a8';
    ctx.beginPath();
    ctx.moveTo(-12, -124);
    ctx.lineTo(12, -124);
    ctx.lineTo(20, -98);
    ctx.lineTo(-20, -98);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe28a';
    ctx.fillRect(-20, -101, 40, 3);
  },
  plant(ctx, t) {
    ctx.fillStyle = '#5fb85a';
    for (const [a, l] of [[-0.7, 34], [-0.3, 42], [0, 46], [0.35, 40], [0.75, 32]]) {
      ctx.save();
      ctx.translate(0, -28);
      ctx.rotate(a + Math.sin(t * 1.5 + a * 3) * 0.04);
      ellipse(ctx, 0, -l / 2, 7, l / 2);
      ctx.restore();
    }
    ctx.fillStyle = '#e88f6a';
    ctx.beginPath();
    ctx.moveTo(-20, -30);
    ctx.lineTo(20, -30);
    ctx.lineTo(15, 0);
    ctx.lineTo(-15, 0);
    ctx.closePath();
    ctx.fill();
    rr(ctx, -22, -34, 44, 8, 3, '#f2a582');
  },
  tree(ctx, t) {
    rr(ctx, -4, -90, 8, 64, 3, '#9b7d66');
    const sway = Math.sin(t * 1.2) * 1.5;
    ctx.fillStyle = '#6fc46a';
    for (const [x, y, r] of [[-16, -100, 22], [16, -104, 22], [0, -122, 24], [-4, -92, 18], [10, -88, 16]]) circle(ctx, x + sway, y, r);
    ctx.fillStyle = '#8fd884';
    circle(ctx, -6 + sway, -118, 10);
    circle(ctx, -18 + sway, -104, 7);
    ctx.fillStyle = '#ffb3c7';
    for (const [x, y] of [[-20, -96], [14, -110], [2, -132], [20, -94]]) circle(ctx, x + sway, y, 3.5);
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath();
    ctx.moveTo(-26, -30);
    ctx.lineTo(26, -30);
    ctx.lineTo(20, 0);
    ctx.lineTo(-20, 0);
    ctx.closePath();
    ctx.fill();
    rr(ctx, -28, -34, 56, 8, 3, '#bfe6ff');
  },
  tablelamp(ctx) {
    rr(ctx, -10, -6, 20, 6, 3, INK);
    rr(ctx, -2, -26, 4, 22, 2, '#8f7fa3');
    const g = ctx.createRadialGradient(0, -30, 2, 0, -30, 34);
    g.addColorStop(0, 'rgba(255,226,140,0.4)');
    g.addColorStop(1, 'rgba(255,226,140,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-34, -64, 68, 68);
    ctx.fillStyle = '#ffd1e0';
    ctx.beginPath();
    ctx.moveTo(-8, -44);
    ctx.lineTo(8, -44);
    ctx.lineTo(15, -24);
    ctx.lineTo(-15, -24);
    ctx.closePath();
    ctx.fill();
  },
  teapot(ctx, t) {
    ctx.strokeStyle = '#ff9fb8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-15, -14, 7, Math.PI * 0.5, Math.PI * 1.5); // handle
    ctx.stroke();
    ctx.fillStyle = '#ff9fb8';
    ctx.beginPath(); // spout
    ctx.moveTo(10, -12);
    ctx.quadraticCurveTo(20, -14, 20, -24);
    ctx.lineTo(16, -24);
    ctx.quadraticCurveTo(16, -16, 8, -6);
    ctx.fill();
    ellipse(ctx, 0, -12, 14, 12);
    rr(ctx, -6, -27, 12, 5, 2, '#ff8aa6');
    circle(ctx, 0, -28, 3);
    ctx.fillStyle = '#ffffff';
    circle(ctx, -4, -12, 2.5);
    circle(ctx, 4, -10, 2.5);
    shine(ctx, -6, -18, 4, 2.5);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; // a wisp of steam
    for (let i = 0; i < 2; i++) {
      const k = (t * 0.6 + i / 2) % 1;
      ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8;
      circle(ctx, 20 + Math.sin(k * 6) * 3, -28 - k * 20, 2.5 + k * 3);
    }
    ctx.globalAlpha = 1;
  },
  cake(ctx, t) {
    rr(ctx, -20, -4, 40, 4, 2, '#e9e3f2'); // plate
    rr(ctx, -16, -24, 32, 20, 4, '#fff3e2');
    rr(ctx, -16, -16, 32, 4, 0, '#ffb3c7'); // jam layer
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-17, -27, 34, 7, 3);
    ctx.fill();
    for (let i = 0; i < 4; i++) circle(ctx, -12 + i * 8, -20, 2.6); // drips
    ctx.fillStyle = '#ff6f91';
    circle(ctx, 0, -30, 4); // the cherry
    rr(ctx, -1, -40, 2, 8, 1, '#fff1a8'); // candle
    ctx.fillStyle = '#ffb347';
    ellipse(ctx, 0, -43 + Math.sin(t * 12) * 0.6, 2, 3.5);
  },
  fishbowl(ctx, t) {
    ctx.fillStyle = 'rgba(159,216,255,0.55)';
    circle(ctx, 0, -18, 18);
    ctx.fillStyle = 'rgba(120,190,240,0.55)';
    ctx.beginPath();
    ctx.arc(0, -18, 18, 0.15, Math.PI - 0.15);
    ctx.fill();
    const fx = Math.sin(t * 1.3) * 8, dir = Math.cos(t * 1.3) > 0 ? 1 : -1;
    ctx.fillStyle = '#ffb347';
    ellipse(ctx, fx, -14, 6, 4);
    ctx.beginPath();
    ctx.moveTo(fx - dir * 5, -14);
    ctx.lineTo(fx - dir * 10, -18);
    ctx.lineTo(fx - dir * 10, -10);
    ctx.fill();
    ctx.fillStyle = INK;
    circle(ctx, fx + dir * 3, -15, 1);
    rr(ctx, -10, -37, 20, 4, 2, 'rgba(255,255,255,0.8)');
    shine(ctx, -8, -26, 4, 6, 0.6);
    ctx.fillStyle = '#5fb85a';
    ellipse(ctx, 9, -6, 3, 6);
  },
  plushie(ctx, t) {
    const bob = Math.sin(t * 2) * 0.6;
    ctx.fillStyle = '#a6f5c9';
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.bezierCurveTo(-20, -24 + bob, -10, -34 + bob, 0, -34 + bob);
    ctx.bezierCurveTo(10, -34 + bob, 20, -24 + bob, 18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = INK;
    circle(ctx, -6, -17, 2.5);
    circle(ctx, 6, -17, 2.5);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -13, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,143,177,0.5)';
    ellipse(ctx, -11, -11, 3, 2);
    ellipse(ctx, 11, -11, 3, 2);
    shine(ctx, -8, -26, 4, 3);
    ctx.fillStyle = '#ff8fb1'; // a little bow
    ellipse(ctx, 8, -32, 4, 3, 0.5);
    ellipse(ctx, 15, -30, 4, 3, -0.5);
  },
  books(ctx) {
    rr(ctx, -20, -10, 40, 10, 2, '#9fd8ff');
    rr(ctx, -17, -19, 36, 9, 2, '#ffb3c7');
    rr(ctx, -19, -28, 34, 9, 2, '#ffe28a');
    ctx.fillStyle = '#fffaf3';
    ctx.fillRect(16, -9, 3, 8);
    ctx.fillRect(15, -18, 3, 7);
  },
  rug(ctx) {
    ctx.fillStyle = '#ffb3c7';
    ellipse(ctx, 0, -2, 110, 10);
    ctx.fillStyle = '#ffd1e0';
    ellipse(ctx, 0, -2, 84, 7);
    ctx.fillStyle = '#fff3f7';
    ellipse(ctx, 0, -2, 52, 4);
  },
  painting(ctx) {
    rr(ctx, -40, -60, 80, 60, 6, '#e8b04a');
    rr(ctx, -33, -53, 66, 46, 3, '#bfe6ff');
    ctx.fillStyle = '#8fd884';
    ctx.beginPath();
    ctx.moveTo(-33, -7);
    ctx.quadraticCurveTo(-14, -30, 4, -16);
    ctx.quadraticCurveTo(18, -28, 33, -14);
    ctx.lineTo(33, -7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff1a8';
    circle(ctx, 18, -40, 7);
    ctx.fillStyle = '#ff9fb8';
    ellipse(ctx, -12, -16, 7, 6); // a tiny slime in the meadow
    ctx.fillStyle = INK;
    circle(ctx, -14, -17, 1);
    circle(ctx, -10, -17, 1);
  },
  // In a house the glass is see-through (house.js cuts it out of the wall, so the real sky shows); `sky` paints
  // a pretend sky instead, for the store icon and the piece you're carrying
  window(ctx, t, sky) {
    ctx.fillStyle = '#ffffff'; // the frame: a ring, so the glass inside stays open
    ctx.beginPath();
    ctx.roundRect(-48, -96, 96, 96, [46, 46, 8, 8]);
    ctx.roundRect(-40, -88, 80, 80, [40, 40, 4, 4]);
    ctx.fill('evenodd');
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-40, -88, 80, 80, [40, 40, 4, 4]);
    ctx.clip();
    if (sky) {
      const g = ctx.createLinearGradient(0, -88, 0, -8);
      g.addColorStop(0, '#9fd8ff');
      g.addColorStop(1, '#e2f4ff');
      ctx.fillStyle = g;
      ctx.fillRect(-40, -88, 80, 80);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      const cx = ((t * 6) % 120) - 60;
      ellipse(ctx, cx, -56, 14, 6);
      ellipse(ctx, cx + 10, -60, 10, 6);
      ctx.fillStyle = '#8fd884';
      ellipse(ctx, 0, -6, 60, 14);
    } else {
      ctx.fillStyle = 'rgba(207,236,255,0.18)'; // a hint of glass, like the picture windows
      ctx.fillRect(-40, -88, 80, 80);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-32, -38, 4, 26);
    }
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2.5, -88, 5, 80);
    ctx.fillRect(-40, -46, 80, 5);
    rr(ctx, -54, -6, 108, 8, 3, WOOD_LIGHT); // sill
  },
  clock(ctx, t) {
    rr(ctx, -20, -58, 40, 58, [20, 20, 6, 6], WOOD);
    ctx.fillStyle = '#fffaf0';
    circle(ctx, 0, -38, 15);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const d = new Date(), h = (d.getHours() % 12 + d.getMinutes() / 60) / 12 * TAU, mi = d.getMinutes() / 60 * TAU;
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.lineTo(Math.sin(h) * 7, -38 - Math.cos(h) * 7);
    ctx.moveTo(0, -38);
    ctx.lineTo(Math.sin(mi) * 11, -38 - Math.cos(mi) * 11);
    ctx.stroke();
    const swing = Math.sin(t * 3) * 0.3; // pendulum
    ctx.save();
    ctx.translate(0, -20);
    ctx.rotate(swing);
    ctx.fillStyle = '#e8b04a';
    ctx.fillRect(-1, 0, 2, 12);
    circle(ctx, 0, 14, 4);
    ctx.restore();
  },
  mirror(ctx) {
    ctx.fillStyle = '#e8b04a';
    ellipse(ctx, 0, -40, 28, 40);
    const g = ctx.createLinearGradient(-20, -70, 20, -10);
    g.addColorStop(0, '#f4fbff');
    g.addColorStop(1, '#cde6f5');
    ctx.fillStyle = g;
    ellipse(ctx, 0, -40, 22, 34);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.save();
    ctx.translate(-6, -48);
    ctx.rotate(-0.6);
    ctx.fillRect(-2, -14, 4, 28);
    ctx.fillRect(5, -8, 2.5, 14);
    ctx.restore();
  },
  shelf(ctx) {
    rr(ctx, -55, -18, 110, 9, 3, WOOD);
    ctx.fillStyle = WOOD_DARK;
    for (const sx of [-40, 34]) {
      ctx.beginPath();
      ctx.moveTo(sx, -9);
      ctx.lineTo(sx + 6, -9);
      ctx.lineTo(sx + 6, 0);
      ctx.closePath();
      ctx.fill();
    }
  },
  bunting(ctx, t) {
    ctx.strokeStyle = '#d9c3a8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-85, -38);
    ctx.quadraticCurveTo(0, -14, 85, -38);
    ctx.stroke();
    const colors = ['#ff9fb8', '#ffe28a', '#9fd8ff', '#a6f5c9', '#c9b6ff'];
    for (let i = 0; i < 8; i++) {
      const u = (i + 0.5) / 8, x = -85 + u * 170, y = -38 + 4 * u * (1 - u) * 24 * 1;
      const sway = Math.sin(t * 2 + i) * 0.08;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(sway);
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  },
  // ——— the garden ———
  bench(ctx) {
    rr(ctx, -56, -56, 112, 10, 5, WOOD); // back slats
    rr(ctx, -56, -44, 112, 8, 4, WOOD_LIGHT);
    rr(ctx, -60, -32, 120, 10, 5, WOOD); // seat
    shine(ctx, -30, -29, 18, 2.5, 0.35);
    ctx.fillStyle = '#7f8a99'; // iron legs
    for (const lx of [-50, 44]) {
      rr(ctx, lx, -56, 6, 56, 3, '#7f8a99');
      ctx.beginPath();
      ctx.arc(lx + 3, -10, 7, Math.PI, 0);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#7f8a99';
      ctx.stroke();
    }
  },
  flowerbed(ctx, t) {
    rr(ctx, -55, -16, 110, 16, 6, '#b07a52');
    rr(ctx, -55, -16, 110, 5, 3, '#c99467');
    const colors = ['#ff9fb8', '#ffe28a', '#c9b6ff', '#ff8f8f', '#9fd8ff'];
    for (let i = 0; i < 7; i++) {
      const x = -45 + i * 15, sway = Math.sin(t * 1.6 + i) * 1.5, top = -30 - (i % 3) * 5;
      ctx.strokeStyle = '#6fb86f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, -14);
      ctx.lineTo(x + sway, top);
      ctx.stroke();
      ctx.fillStyle = colors[i % colors.length];
      for (let j = 0; j < 5; j++) circle(ctx, x + sway + Math.cos((j / 5) * TAU) * 4, top + Math.sin((j / 5) * TAU) * 4, 3.5);
      ctx.fillStyle = '#fff1a8';
      circle(ctx, x + sway, top, 2.5);
    }
  },
  hedge(ctx) {
    ctx.fillStyle = '#6fb86f';
    for (const [x, y, r] of [[-30, -24, 24], [0, -34, 28], [30, -24, 24], [-38, -14, 14], [38, -14, 14]]) circle(ctx, x, y, r);
    rr(ctx, -50, -30, 100, 30, 10, '#6fb86f');
    ctx.fillStyle = '#86cc84';
    circle(ctx, -14, -44, 10);
    circle(ctx, 18, -40, 8);
    ctx.fillStyle = '#ffffff';
    for (const [x, y] of [[-24, -30], [10, -48], [32, -22]]) circle(ctx, x, y, 2.5);
  },
  birdbath(ctx, t) {
    rr(ctx, -16, -6, 32, 6, 3, '#d8d2e0');
    rr(ctx, -7, -46, 14, 42, 5, '#e8e2ee');
    ctx.fillStyle = '#e8e2ee';
    ellipse(ctx, 0, -50, 25, 9);
    ctx.fillStyle = '#9fd8ff';
    ellipse(ctx, 0, -52, 19, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ellipse(ctx, -6 + Math.sin(t * 2) * 3, -53, 5, 1.5);
    // a little bird, hopping now and then
    const hop = Math.max(0, Math.sin(t * 3)) ** 8 * 6;
    ctx.fillStyle = '#ffb38a';
    ellipse(ctx, 12, -60 - hop, 7, 6);
    circle(ctx, 17, -66 - hop, 4.5);
    ctx.fillStyle = INK;
    circle(ctx, 18.5, -67 - hop, 1.2);
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.moveTo(21, -66 - hop);
    ctx.lineTo(25, -65 - hop);
    ctx.lineTo(21, -64 - hop);
    ctx.fill();
  },
  lamppost(ctx) {
    rr(ctx, -12, -8, 24, 8, 3, '#6b6f80');
    rr(ctx, -3, -128, 6, 122, 3, '#6b6f80');
    const g = ctx.createRadialGradient(0, -136, 4, 0, -136, 60);
    g.addColorStop(0, 'rgba(255,226,140,0.5)');
    g.addColorStop(1, 'rgba(255,226,140,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-60, -196, 120, 120);
    rr(ctx, -12, -150, 24, 24, 6, '#fff1a8');
    rr(ctx, -15, -154, 30, 6, 3, '#6b6f80');
    rr(ctx, -10, -128, 20, 4, 2, '#6b6f80');
  },
  oak(ctx, t) {
    rr(ctx, -13, -176, 26, 176, 8, '#a8794f'); // trunk
    rr(ctx, -13, -176, 9, 176, 5, '#bf8d60');
    ctx.fillStyle = '#a8794f';
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.quadraticCurveTo(-12, -10, -12, -30);
    ctx.lineTo(12, -30);
    ctx.quadraticCurveTo(12, -10, 26, 0);
    ctx.fill();
    const sway = Math.sin(t * 0.8) * 2;
    ctx.fillStyle = '#6fb86f'; // canopy: its flat-ish bottom is the platform (top 170)
    for (const [x, y, r] of [[-50, -196, 40], [0, -214, 48], [50, -196, 40], [-28, -178, 30], [28, -178, 30]]) circle(ctx, x + sway, y, r);
    ctx.fillStyle = '#86cc84';
    for (const [x, y, r] of [[-30, -218, 20], [20, -232, 18], [52, -206, 14]]) circle(ctx, x + sway, y, r);
    ctx.fillStyle = '#ff8f8f'; // apples
    for (const [x, y] of [[-46, -188], [8, -200], [44, -182], [-12, -226]]) circle(ctx, x + sway, y, 5);
  },
  // a: the seat's angle (src/house.js swings it harder while someone sits on it)
  swing(ctx, t, a = Math.sin(t * 1.4) * 0.18) {
    rr(ctx, -55, -170, 110, 10, 5, WOOD_DARK); // frame
    for (const sx of [-1, 1]) {
      ctx.strokeStyle = WOOD_DARK;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx * 50, -166);
      ctx.lineTo(sx * 58, 0);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(0, -160);
    ctx.rotate(a);
    ctx.strokeStyle = '#d9c3a8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(-22, 118);
    ctx.moveTo(22, 0);
    ctx.lineTo(22, 118);
    ctx.stroke();
    rr(ctx, -28, 116, 56, 9, 4, '#ff9fb8');
    ctx.restore();
    ctx.lineCap = 'butt';
  },
  pond(ctx, t) {
    ctx.fillStyle = '#a7a1b5';
    ellipse(ctx, 0, -3, 80, 9);
    ctx.fillStyle = '#7fc8f0';
    ellipse(ctx, 0, -3, 72, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ellipse(ctx, -20 + Math.sin(t) * 6, -4, 14, 1.5);
    ctx.fillStyle = '#6fb86f'; // a lily pad
    ellipse(ctx, 34, -4, 10, 3);
    ctx.fillStyle = '#ffb3c7';
    circle(ctx, 36, -6, 2.5);
  },
  // farming and alchemy (docs/places/alchemy.md): what grows in a plot is drawn over it by src/house.js
  garden_plot(ctx) {
    rr(ctx, -55, -20, 110, 20, 6, '#a8794f'); // the wooden frame
    rr(ctx, -55, -20, 110, 6, 3, '#c99b6b');
    rr(ctx, -49, -17, 98, 12, 5, '#7a5236'); // tilled soil
    ctx.strokeStyle = '#664430';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const x of [-33, 0, 33]) {
      ctx.moveTo(x - 12, -11);
      ctx.quadraticCurveTo(x, -16, x + 12, -11);
    }
    ctx.stroke();
    ctx.fillStyle = '#8f6240';
    for (const x of [-52, 48]) rr(ctx, x, -24, 6, 10, 2, '#8f6240'); // corner posts
  },
  alchemy_lab(ctx, t) {
    // a workbench with a shelf of bottles behind, a cauldron on a burner, a glass still and a mortar
    rr(ctx, -66, -120, 8, 66, 3, WOOD_DARK); // shelf posts
    rr(ctx, 58, -120, 8, 66, 3, WOOD_DARK);
    rr(ctx, -70, -104, 140, 7, 3, WOOD);
    const bottles = ['#ff8fa6', '#8fc8ff', '#c4a0ff', '#8fe0a0', '#ffd36b', '#ff9f6a'];
    bottles.forEach((c, i) => {
      const x = -56 + i * 21, h = 10 + (i % 3) * 3;
      rr(ctx, x - 5, -104 - h, 10, h, [3, 3, 2, 2], c);
      rr(ctx, x - 2, -108 - h, 4, 5, 1, '#c98a5a');
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x - 3, -102 - h, 2, h - 4);
    });
    rr(ctx, -70, -58, 140, 10, 4, WOOD); // bench top
    rr(ctx, -64, -48, 128, 34, 4, mix(WOOD, '#ffffff', 0.15));
    ctx.fillStyle = WOOD_LIGHT;
    for (const x of [-34, 30]) circle(ctx, x, -31, 3); // drawer knobs
    rr(ctx, -64, -14, 10, 14, 3, WOOD_DARK);
    rr(ctx, 54, -14, 10, 14, 3, WOOD_DARK);
    // the burner and the cauldron
    const flick = Math.sin(t * 12) * 1.5;
    rr(ctx, -36, -66, 32, 8, 3, '#6f6880'); // the burner
    ctx.fillStyle = '#ffb347';
    ellipse(ctx, -20, -68, 8, 4 + flick * 0.5);
    ctx.fillStyle = '#ffe28a';
    ellipse(ctx, -20, -67, 4, 2.5);
    ctx.fillStyle = '#5b5568';
    ctx.beginPath();
    ctx.ellipse(-20, -92, 26, 22, 0, 0, Math.PI);
    ctx.fill();
    rr(ctx, -48, -96, 56, 8, 4, '#6f6880');
    ctx.fillStyle = '#9fe3a8'; // bubbling brew
    ellipse(ctx, -20, -95, 22, 4);
    ctx.fillStyle = '#c8f5cf';
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.8 + i / 3) % 1;
      ctx.globalAlpha = 1 - k;
      circle(ctx, -28 + i * 8, -98 - k * 20, 3 + k * 3);
    }
    ctx.globalAlpha = 1;
    // the still: a round flask, a neck, a pipe into a little bottle
    ctx.fillStyle = 'rgba(207,236,255,0.75)';
    circle(ctx, 30, -74, 13);
    ctx.fillStyle = '#c4a0ff';
    ctx.beginPath();
    ctx.arc(30, -74, 11, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#9fb8d0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, -86);
    ctx.lineTo(30, -96);
    ctx.quadraticCurveTo(46, -100, 54, -80);
    ctx.stroke();
    rr(ctx, 49, -76, 10, 16, 3, 'rgba(207,236,255,0.85)');
    rr(ctx, 50, -68, 8, 7, 2, '#c4a0ff');
    shine(ctx, 25, -79, 3, 5, 0.7);
    // mortar and pestle
    ctx.save();
    ctx.translate(8, -72);
    ctx.rotate(0.35);
    rr(ctx, -2, -10, 4, 16, 2, '#b8ae9f');
    ctx.restore();
    ctx.fillStyle = '#d8d0c4';
    ctx.beginPath();
    ctx.ellipse(4, -67, 9, 9, 0, 0, Math.PI);
    ctx.fill();
    rr(ctx, -6, -69, 20, 4, 2, '#e8e0d4');
  },
  chest(ctx) {
    // the storage chest: a wooden box with a rounded lid, gold bands and a heart-shaped latch
    const GOLD = '#f0c25a', GOLD_DARK = '#c99a2e';
    rr(ctx, -40, -6, 12, 6, 2, WOOD_DARK); // feet
    rr(ctx, 28, -6, 12, 6, 2, WOOD_DARK);
    rr(ctx, -42, -40, 84, 36, 6, WOOD); // the box
    ctx.fillStyle = WOOD_DARK;
    for (const y of [-28, -16]) ctx.fillRect(-40, y, 80, 2); // planks
    rr(ctx, -44, -58, 88, 20, [14, 14, 4, 4], mix(WOOD, WOOD_DARK, 0.35)); // the lid
    rr(ctx, -44, -42, 88, 5, 2, WOOD_DARK); // the lid's rim
    for (const x of [-30, 24]) {
      rr(ctx, x, -58, 6, 20, [3, 3, 0, 0], GOLD); // bands over the lid
      rr(ctx, x, -37, 6, 33, 2, GOLD); // and down the box
    }
    rr(ctx, -42, -6, 84, 4, 2, GOLD_DARK);
    // the latch: a little gold heart with a keyhole
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.bezierCurveTo(-11, -33, -8, -45, 0, -40);
    ctx.bezierCurveTo(8, -45, 11, -33, 0, -26);
    ctx.fill();
    ctx.fillStyle = INK;
    circle(ctx, 0, -36, 2);
    ctx.fillRect(-1, -36, 2, 5);
    shine(ctx, -22, -53, 12, 3, 0.4);
    shine(ctx, -26, -34, 8, 2, 0.25);
  },
};

// Pets (FURNITURE entries with `pet`): the boss's own art, shrunk. Standing still unless src/house.js walks it.
// mood (PET_MOODS, docs/places/pets.md): the hungrier, the droopier and greyer (src/pet-art.js petLook).
export function drawPet(ctx, kind, x, y, facing, walking, time, seed = 0, mood = 0) {
  ctx.save();
  ctx.translate(x, y);
  const look = petLook(mood);
  if (look.sat < 1) ctx.filter = `saturate(${look.sat})`; // (browsers without canvas filters just skip it)
  ctx.scale(PET_SCALE * (1 + look.squash * 0.5), PET_SCALE * (1 - look.squash));
  const m = { kind, x: 0, y: 0, facing, walking, vy: 0, seed };
  if (kind === 'ladon') { ctx.scale(1 / PET_SCALE, 1 / PET_SCALE); drawLadonPet(ctx, 0, 0, facing, walking, time, seed); } // (its own art: src/ladon-art.js)
  else if (kind === 'fenrir') { ctx.scale(1 / PET_SCALE, 1 / PET_SCALE); drawFenrirPet(ctx, 0, 0, facing, walking, time, seed); } // (its own art: src/fenrir-art.js)
  else if (MOBS[kind].boss) drawBoss(ctx, m, time);
  else drawMob(ctx, m, time);
  ctx.restore();
}
for (const [k, def] of Object.entries(FURNITURE)) if (def.pet) DRAW[k] = (ctx, t) => drawPet(ctx, def.pet, 0, 0, 1, false, t);

// arg: something a piece's drawing can take (the swing's seat angle; the window's pretend sky)
export function drawFurniture(ctx, k, x, y, f, time = 0, arg) {
  const draw = DRAW[k];
  if (!draw) return;
  ctx.save();
  ctx.translate(x, y);
  if (f) ctx.scale(-1, 1);
  draw(ctx, time, arg);
  ctx.restore();
}

// A piece's icon for the decorating panel: drawn to fit a size × size square
export function furnitureIcon(k, size) {
  const c = document.createElement('canvas');
  const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = c.height = size * dpr;
  const g = c.getContext('2d');
  const def = FURNITURE[k];
  const s = Math.min(1, (size - 6) / Math.max(def.w + 10, def.h + 10));
  g.scale(dpr, dpr);
  g.translate(size / 2, size / 2 + (def.h * s) / 2);
  g.scale(s, s);
  drawFurniture(g, k, 0, 0, false, 0, k === 'window'); // (the window paints its pretend sky)
  return c;
}

// The wallpaper, from the ceiling to y
export function drawWallpaper(ctx, i, x0, x1, y0, y1) {
  const wp = WALLPAPERS[i] ?? WALLPAPERS[0];
  ctx.fillStyle = wp.base;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = wp.pattern;
  if (wp.kind === 'stripes') for (let x = x0; x < x1; x += 40) ctx.fillRect(x, y0, 18, y1 - y0);
  else if (wp.kind === 'dots') {
    for (let y = y0 + 20, r = 0; y < y1; y += 34, r++) for (let x = x0 + (r % 2) * 22; x < x1; x += 44) circle(ctx, x, y, 5);
  } else if (wp.kind === 'diamonds') {
    for (let y = y0 + 24, r = 0; y < y1; y += 44, r++) {
      for (let x = x0 + (r % 2) * 28; x < x1; x += 56) {
        ctx.beginPath();
        ctx.moveTo(x, y - 12);
        ctx.lineTo(x + 8, y);
        ctx.lineTo(x, y + 12);
        ctx.lineTo(x - 8, y);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else if (wp.kind === 'hearts') {
    for (let y = y0 + 24, r = 0; y < y1; y += 46, r++) {
      for (let x = x0 + (r % 2) * 30; x < x1; x += 60) {
        circle(ctx, x - 4, y - 2, 5);
        circle(ctx, x + 4, y - 2, 5);
        ctx.beginPath();
        ctx.moveTo(x - 9, y);
        ctx.lineTo(x, y + 10);
        ctx.lineTo(x + 9, y);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else if (wp.kind === 'stars') {
    ctx.fillStyle = 'rgba(255,241,168,0.7)';
    for (let y = y0 + 26, r = 0; y < y1; y += 52, r++) {
      for (let x = x0 + (r % 2) * 40 + 10; x < x1; x += 80) {
        ctx.beginPath();
        for (let j = 0; j < 10; j++) {
          const a = (j / 10) * TAU - Math.PI / 2, rad = j % 2 ? 2.5 : 6;
          ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

export function drawFloor(ctx, i, x0, x1, y0, y1) {
  const fl = FLOORS[i] ?? FLOORS[0];
  ctx.fillStyle = fl.a;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = fl.b;
  const tiles = fl.name.includes('tiles');
  for (let y = y0, r = 0; y < y1; y += 24, r++) {
    for (let x = x0 - (r % 2) * (tiles ? 24 : 60); x < x1; x += tiles ? 48 : 120) {
      if (tiles) ctx.fillRect(x, y, 24, 24);
      else ctx.fillRect(x, y + 22, 118, 2), ctx.fillRect(x + 118, y, 2, 24);
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x0, y0, x1 - x0, 3);
}
