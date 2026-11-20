// Docs: docs/places/fair.md
// The Gathering Fair's art: the striped tent in every town (drawFairTent), the fairground itself behind the slimes
// (drawFair: an evening that never quite gets dark, string lights, the Big Top, the booths, the carousel, the Ferris wheel
// and the coaster's track, the Hall of Mirrors, the pier and every island close on the horizon), the prizes as slimes wear
// them (drawFairWear, called from Slime.draw) and Ringmaster Fizz's hat, coat and moustache (drawRingmaster).
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { text } from './village.js';
import { drawDistantIslands } from './distant.js';
import { FAIR_W, FAIR_GROUND, FAIR_EXIT_X, FAIR_PLATFORMS, BOOTHS, HORSES, CAROUSEL_X, CAROUSEL_R, WHEEL_X, BIGTOP_X, STATION_X, MIRRORS_X0, MIRRORS_X1, MIRRORS, PIER_X, PRIZES, prizeX } from './shared/fair.js';
import { COSMETICS } from './shared/rpg.js';

const G = FAIR_GROUND;
const HORIZON = 300;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const BULBS = ['#ffe28a', '#ff9fb8', '#9fe3ff', '#c4f59a', '#d6b4ff'];
const RED = '#e8546a', CREAM = '#fff4e6', GOLD = '#f2c14e';

// ——— the tent in every town ———
// A small circus tent: red and cream stripes, a scalloped valance, a pennant, the flap tied back on warm light and a
// glimpse of the fair's lights, and a little painted board on a post
export function drawFairTent(ctx, x, ground, time) {
  const w = 128, wall = 70, peak = ground - 172, eave = ground - wall;
  ctx.save();
  ctx.fillStyle = 'rgba(40,30,50,0.16)';
  ellipse(ctx, x, ground + 2, w * 0.62, 7);
  // walls
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? CREAM : RED;
    ctx.fillRect(x - w / 2 + (i * w) / 8, eave, w / 8 + 0.5, wall);
  }
  // the flap, tied back: warm light inside
  const fw = 42, top = eave + 6;
  const inside = ctx.createLinearGradient(0, top, 0, ground);
  inside.addColorStop(0, '#ffcf7a');
  inside.addColorStop(1, '#ff9a6a');
  ctx.fillStyle = inside;
  ctx.beginPath();
  ctx.moveTo(x - fw / 2, ground);
  ctx.quadraticCurveTo(x - fw / 2, top, x, top - 4);
  ctx.quadraticCurveTo(x + fw / 2, top, x + fw / 2, ground);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = BULBS[(i + Math.floor(time * 2)) % BULBS.length];
    circle(ctx, x - 12 + i * 8, top + 12 + Math.sin(i * 1.7) * 2, 2);
  }
  ctx.fillStyle = RED;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + side * fw / 2, top - 2);
    ctx.quadraticCurveTo(x + side * (fw / 2 + 4), ground - 30, x + side * (fw / 2 + 12), ground);
    ctx.lineTo(x + side * (fw / 2 + 2), ground);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = GOLD;
  for (const side of [-1, 1]) circle(ctx, x + side * (fw / 2 + 5), ground - 34, 2.6); // the ties
  // the roof: a cone of stripes
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? CREAM : RED;
    ctx.beginPath();
    ctx.moveTo(x, peak);
    ctx.lineTo(x - w / 2 - 8 + (i * (w + 16)) / 8, eave);
    ctx.lineTo(x - w / 2 - 8 + ((i + 1) * (w + 16)) / 8, eave);
    ctx.closePath();
    ctx.fill();
  }
  // the valance
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = i % 2 ? RED : GOLD;
    ctx.beginPath();
    const vx = x - w / 2 - 8 + (i * (w + 16)) / 9, vw = (w + 16) / 9;
    ctx.moveTo(vx, eave - 1);
    ctx.lineTo(vx + vw, eave - 1);
    ctx.quadraticCurveTo(vx + vw / 2, eave + 13, vx, eave - 1);
    ctx.fill();
  }
  // the pole and pennant
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, peak);
  ctx.lineTo(x, peak - 22);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  circle(ctx, x, peak - 23, 3);
  const flap = Math.sin(time * 4) * 3;
  ctx.fillStyle = '#7fc8ff';
  ctx.beginPath();
  ctx.moveTo(x + 1, peak - 20);
  ctx.quadraticCurveTo(x + 12, peak - 18 + flap, x + 22, peak - 14 + flap);
  ctx.quadraticCurveTo(x + 12, peak - 10 + flap * 0.5, x + 1, peak - 9);
  ctx.fill();
  // a banner across the roof
  ctx.fillStyle = CREAM;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 38, eave - 46, 76, 22, 8);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'THE FAIR', x, eave - 35, 11, RED);
  ctx.restore();
}

// ——— the sky: an evening that never quite gets dark, and every island close round the horizon ———
const stars = (() => {
  const r = mulberry32(11201);
  return Array.from({ length: 50 }, () => ({ x: r() * W, y: r() * 150, s: 0.6 + r() * 1.2, p: r() * TAU }));
})();
const clouds = (() => {
  const r = mulberry32(11211);
  return Array.from({ length: 7 }, () => ({ x: r() * 1600, y: 60 + r() * 140, s: 0.6 + r() * 0.7 }));
})();
function drawSky(ctx, camX, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#3f3a78');
  sky.addColorStop(0.45, '#9a6fb8');
  sky.addColorStop(0.78, '#ff9fa0');
  sky.addColorStop(1, '#ffd29a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HORIZON + 2);
  for (const s of stars) {
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time * 1.3 + s.p);
    ctx.fillStyle = '#fff6dd';
    circle(ctx, s.x, s.y, s.s);
  }
  ctx.globalAlpha = 1;
  // the low sun, never quite setting
  ctx.fillStyle = 'rgba(255,236,190,0.35)';
  circle(ctx, W * 0.78 - camX * 0.02, HORIZON - 26, 60);
  ctx.fillStyle = '#ffe9b8';
  circle(ctx, W * 0.78 - camX * 0.02, HORIZON - 26, 30);
  for (const c of clouds) {
    const x = ((c.x - camX * 0.08 + time * 4) % 1700 + 1700) % 1700 - 300;
    ctx.fillStyle = 'rgba(255,200,210,0.5)';
    ellipse(ctx, x, c.y, 70 * c.s, 14 * c.s);
    ellipse(ctx, x + 30 * c.s, c.y - 8 * c.s, 40 * c.s, 12 * c.s);
  }
  drawDistantIslands(ctx, { from: 'fair', scroll: camX, roomW: FAIR_W, time, horizon: HORIZON, haze: '#ffd8b0', fade: 0.4, scale: 0.85, night: 0.5, sky: 200 });
  // the sea under them
  const sea = ctx.createLinearGradient(0, HORIZON, 0, H);
  sea.addColorStop(0, '#f4b7a8');
  sea.addColorStop(1, '#6f86c4');
  ctx.fillStyle = sea;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  ctx.strokeStyle = 'rgba(255,240,220,0.45)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const y = HORIZON + 10 + i * 14, off = (time * (10 + i * 4) - camX * 0.3) % 80;
    ctx.beginPath();
    for (let x = -80 + ((off + 80) % 80); x < W; x += 80) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 26 + i * 3, y);
    }
    ctx.stroke();
  }
}

// far tents and flags behind the fair (a slow parallax), stopping short of the pier so the sea shows there
const farTents = (() => {
  const r = mulberry32(11221);
  const out = [];
  for (let x = -100; x < 2200; x += 90 + r() * 80) out.push({ x, w: 70 + r() * 60, h: 50 + r() * 50, c: r() < 0.5 ? '#c86f9a' : '#7f8fd0' });
  return out;
})();
function drawFarTents(ctx, camX) {
  // (in screen space: they drift by at half the camera's speed)
  for (const t of farTents) {
    const x = t.x - camX * 0.5, base = HORIZON + 30;
    if (x + t.w < -20 || x - t.w > W + 20) continue;
    ctx.fillStyle = t.c;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(x - t.w / 2, base);
    ctx.lineTo(x, base - t.h);
    ctx.lineTo(x + t.w / 2, base);
    ctx.fill();
    ctx.fillRect(x - t.w / 2 + 6, base, t.w - 12, 30);
  }
  ctx.globalAlpha = 1;
}

// ——— the ground: packed sand and sawdust, a plank walk; the pier out over the water ———
function drawGround(ctx, L, R) {
  const x0 = Math.max(0, L), x1 = Math.min(PIER_X, R);
  if (x1 > x0) {
    ctx.fillStyle = '#e9c99a';
    ctx.fillRect(x0, G, x1 - x0, H - G);
    ctx.fillStyle = '#d9b07c';
    ctx.fillRect(x0, G, x1 - x0, 6);
    ctx.fillStyle = 'rgba(160,110,70,0.25)';
    for (let x = Math.floor(x0 / 37) * 37; x < x1; x += 37) ctx.fillRect(x, G + 14 + ((x * 7) % 30), 10, 3);
  }
  const p0 = Math.max(PIER_X, L), p1 = Math.min(FAIR_W, R);
  if (p1 > p0) {
    ctx.fillStyle = '#b98a5c';
    ctx.fillRect(p0, G, p1 - p0, 16);
    ctx.fillStyle = '#9c6f45';
    for (let x = Math.floor(p0 / 26) * 26; x < p1; x += 26) ctx.fillRect(x, G, 2, 16);
    ctx.fillStyle = '#7d5634';
    for (let x = Math.ceil(PIER_X / 140) * 140; x < p1; x += 140) if (x > p0 - 10) ctx.fillRect(x - 6, G + 16, 12, H - G);
  }
}

// ——— string lights between poles all along the fair ———
const POLES = (() => {
  const out = [];
  for (let x = 260; x < FAIR_W - 100; x += 330) out.push(x);
  return out;
})();
function drawLights(ctx, L, R, time) {
  for (let i = 0; i < POLES.length; i++) {
    const x = POLES[i];
    if (visible(x - 340, x + 340, L, R)) {
      ctx.fillStyle = '#6a5a7a';
      ctx.fillRect(x - 3, G - 210, 6, 210);
      ctx.fillStyle = GOLD;
      circle(ctx, x, G - 212, 5);
    }
    const nx = POLES[i + 1];
    if (!nx || !visible(x, nx, L, R)) continue;
    ctx.strokeStyle = 'rgba(70,60,90,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, G - 206);
    ctx.quadraticCurveTo((x + nx) / 2, G - 150, nx, G - 206);
    ctx.stroke();
    for (let k = 1; k < 12; k++) {
      const f = k / 12, bx = x + (nx - x) * f, by = (1 - f) * (1 - f) * (G - 206) + 2 * f * (1 - f) * (G - 150) + f * f * (G - 206);
      const c = BULBS[(k + i + Math.floor(time * 1.5)) % BULBS.length];
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.25;
      circle(ctx, bx, by + 3, 6);
      ctx.globalAlpha = 1;
      circle(ctx, bx, by + 3, 2.6);
    }
  }
}

// ——— the Gate Plaza ———
function drawEntrance(ctx, time) {
  // the inside of the big entrance tent's wall, its flap open on the town you came from
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 ? CREAM : RED;
    ctx.fillRect(i * 34, G - 300, 34, 300);
  }
  ctx.fillStyle = 'rgba(40,20,40,0.18)';
  ctx.fillRect(0, G - 300, 238, 300);
  const x = FAIR_EXIT_X;
  ctx.fillStyle = '#ffe2b0';
  ctx.beginPath();
  ctx.moveTo(x - 34, G);
  ctx.quadraticCurveTo(x - 34, G - 120, x, G - 130);
  ctx.quadraticCurveTo(x + 34, G - 120, x + 34, G);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  for (let i = 0; i < 5; i++) ellipse(ctx, x - 20 + i * 10, G - 40 - (i % 2) * 30, 3, 14 + Math.sin(time * 2 + i) * 3);
  ctx.fillStyle = RED;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + side * 34, G - 124);
    ctx.quadraticCurveTo(x + side * 40, G - 60, x + side * 52, G);
    ctx.lineTo(x + side * 36, G);
    ctx.closePath();
    ctx.fill();
  }
  // the arch over the plaza
  ctx.fillStyle = GOLD;
  ctx.fillRect(262, G - 236, 8, 236);
  ctx.fillRect(490, G - 236, 8, 236);
  ctx.fillStyle = '#8a6fc4';
  ctx.beginPath();
  ctx.roundRect(250, G - 270, 260, 44, 22);
  ctx.fill();
  text(ctx, 'THE GATHERING FAIR', 380, G - 248, 17, '#fff4e6');
}
function drawKiosk(ctx, p, time) {
  const x = p.x, w = p.w, top = p.y;
  ctx.fillStyle = '#fff4e6';
  ctx.fillRect(x + 8, top + 10, w - 16, G - top - 10);
  ctx.fillStyle = '#7fb9e8';
  ctx.beginPath();
  ctx.roundRect(x + 30, top + 34, w - 60, 40, 6);
  ctx.fill();
  ctx.fillStyle = '#ffe9b8';
  ctx.fillRect(x + 34, top + 38, w - 68, 32);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? CREAM : '#ff8fa6';
    ctx.fillRect(x + (i * w) / 5, top, w / 5 + 0.5, 12);
  }
  text(ctx, 'TICKETS', x + w / 2, top + 22, 12, RED);
  text(ctx, 'every game free', x + w / 2, top + 92, 9, '#8a6fc4');
  // a ticket roll on the counter
  ctx.fillStyle = '#ffcf6a';
  ctx.fillRect(x + w - 34, top + 78, 14, 10);
  ctx.fillStyle = '#ff9a6a';
  ctx.fillRect(x + w - 24, top + 82 + Math.sin(time * 2) * 0.5, 20, 6);
}
function drawPrizeCounter(ctx, time) {
  const x0 = prizeX(0) - 70, x1 = prizeX(PRIZES.length - 1) + 70;
  // the back shelves
  ctx.fillStyle = '#c99b6b';
  ctx.fillRect(x0, G - 210, x1 - x0, 210);
  ctx.fillStyle = '#e3bf91';
  for (const y of [G - 190, G - 140]) ctx.fillRect(x0 + 6, y, x1 - x0 - 12, 6);
  // plushies on the shelves (just for show)
  const r = mulberry32(3);
  for (let x = x0 + 24; x < x1 - 20; x += 34) {
    ctx.fillStyle = BULBS[Math.floor(r() * BULBS.length)];
    ellipse(ctx, x, G - 196 + (x % 2), 12, 10);
    ctx.fillStyle = '#3a3550';
    circle(ctx, x - 3, G - 198, 1.4);
    circle(ctx, x + 4, G - 198, 1.4);
  }
  ctx.fillStyle = '#8a6fc4';
  ctx.beginPath();
  ctx.roundRect((x0 + x1) / 2 - 70, G - 250, 140, 32, 16);
  ctx.fill();
  text(ctx, 'PRIZES', (x0 + x1) / 2, G - 234, 15, '#fff4e6');
  // the counter
  ctx.fillStyle = '#ff9fb8';
  ctx.fillRect(x0, G - 66, x1 - x0, 66);
  ctx.fillStyle = '#e87c9b';
  ctx.fillRect(x0 - 6, G - 72, x1 - x0 + 12, 10);
  // each prize on a little stand, with its ticket price
  PRIZES.forEach((id, i) => {
    const x = prizeX(i), bob = Math.sin(time * 2 + i) * 2;
    ctx.fillStyle = '#fff4e6';
    ctx.fillRect(x - 16, G - 92, 32, 20);
    drawPrize(ctx, id, x, G - 104 + bob, time);
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    ctx.roundRect(x - 34, G - 50, 68, 22, 5);
    ctx.fill();
    text(ctx, `${COSMETICS[id].tickets} tickets`, x, G - 39, 10, RED);
  });
}
// one prize on its own (the counter shows them big)
function drawPrize(ctx, id, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  if (id === 'fair_balloon') {
    ctx.strokeStyle = '#8a7a9a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.quadraticCurveTo(4, -6, 0, -18);
    ctx.stroke();
    balloon(ctx, 0, -32, 13);
  } else if (id === 'candy_floss') floss(ctx, 0, 6, 1.3);
  else if (id === 'paper_crown') crown(ctx, 0, 6, 40);
  else if (id === 'star_specs') specs(ctx, 0, -6, 1.6);
  else if (id === 'jester_cap') jester(ctx, 0, 8, 46, time);
  ctx.restore();
}

// ——— the Big Top (laced shut until F3) ———
function drawBigTop(ctx, time) {
  const x = BIGTOP_X, w = 560, peak = G - 360, eave = G - 150;
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = i % 2 ? CREAM : RED;
    ctx.fillRect(x - w / 2 + (i * w) / 14, eave, w / 14 + 0.5, 150);
  }
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = i % 2 ? CREAM : RED;
    ctx.beginPath();
    ctx.moveTo(x, peak);
    ctx.lineTo(x - w / 2 - 20 + (i * (w + 40)) / 14, eave);
    ctx.lineTo(x - w / 2 - 20 + ((i + 1) * (w + 40)) / 14, eave);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? GOLD : '#8a6fc4';
    const vx = x - w / 2 - 20 + (i * (w + 40)) / 16, vw = (w + 40) / 16;
    ctx.beginPath();
    ctx.moveTo(vx, eave);
    ctx.lineTo(vx + vw, eave);
    ctx.quadraticCurveTo(vx + vw / 2, eave + 20, vx, eave);
    ctx.fill();
  }
  // flags on top
  for (const [dx, h, c] of [[0, 40, '#7fc8ff'], [-150, 22, GOLD], [150, 22, '#b9e58c']]) {
    const px = x + dx, py = dx ? peak + 110 : peak;
    ctx.strokeStyle = '#8a6a4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py - h);
    ctx.stroke();
    ctx.fillStyle = c;
    const f = Math.sin(time * 4 + dx) * 3;
    ctx.beginPath();
    ctx.moveTo(px, py - h);
    ctx.quadraticCurveTo(px + 12, py - h + 2 + f, px + 24, py - h + 6 + f);
    ctx.lineTo(px, py - h + 12);
    ctx.fill();
  }
  // the entrance, laced shut
  ctx.fillStyle = '#c23f57';
  ctx.beginPath();
  ctx.moveTo(x - 50, G);
  ctx.lineTo(x - 50, G - 110);
  ctx.quadraticCurveTo(x, G - 140, x + 50, G - 110);
  ctx.lineTo(x + 50, G);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.6;
  for (let y = G - 110; y < G - 6; y += 14) {
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.lineTo(x + 6, y + 7);
    ctx.moveTo(x + 6, y);
    ctx.lineTo(x - 6, y + 7);
    ctx.stroke();
  }
  ctx.fillStyle = '#3f3a78';
  ctx.beginPath();
  ctx.roundRect(x - 110, eave - 64, 220, 36, 18);
  ctx.fill();
  text(ctx, 'THE BIG TOP', x, eave - 46, 16, GOLD);
}

// ——— the booths ———
function drawBooth(ctx, b, time, best) {
  const x = b.x, top = 300, [c1, c2] = b.canopy;
  // the back board
  ctx.fillStyle = '#5b4a6b';
  ctx.fillRect(x - 92, top + 24, 184, G - top - 24);
  if (b.shut) {
    // shutters down
    ctx.fillStyle = '#c9a77c';
    ctx.fillRect(x - 92, top + 24, 184, 90);
    ctx.strokeStyle = '#a4825a';
    ctx.lineWidth = 2;
    for (let y = top + 34; y < top + 114; y += 12) {
      ctx.beginPath();
      ctx.moveTo(x - 92, y);
      ctx.lineTo(x + 92, y);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(x + 30, top + 80);
    ctx.rotate(0.08);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(-34, -14, 68, 28);
    text(ctx, b.id === 'rings' ? 'out for rings' : 'gone swimming', 0, 0, 9, '#5b4a6b');
    ctx.restore();
  } else if (b.game === 'gallery') {
    // the rails, with tin ducks going by
    for (let k = 0; k < 3; k++) {
      const y = top + 44 + k * 22;
      ctx.fillStyle = '#c9c9d6';
      ctx.fillRect(x - 84, y + 8, 168, 3);
      for (let j = 0; j < 4; j++) {
        const dx = ((time * (30 + k * 12) * (k % 2 ? -1 : 1) + j * 46) % 184 + 184) % 184 - 92;
        ctx.fillStyle = ['#ffd36e', '#9fe3ff', '#ff9fb8'][k];
        ellipse(ctx, x + dx, y + 2, 7, 6);
      }
    }
  } else {
    // holes, and a mole looking out of one
    for (let k = 0; k < 6; k++) {
      const hx = x - 60 + (k % 3) * 60, hy = top + 56 + Math.floor(k / 3) * 34;
      ctx.fillStyle = '#3a2f44';
      ellipse(ctx, hx, hy, 16, 6);
      if (k === Math.floor(time * 0.8) % 6) {
        ctx.fillStyle = '#9c6f4f';
        ellipse(ctx, hx, hy - 6, 10, 9);
        ctx.fillStyle = '#ff9fb8';
        circle(ctx, hx, hy - 4, 2.4);
      }
    }
  }
  // the counter
  ctx.fillStyle = c1;
  ctx.fillRect(x - 100, G - 60, 200, 60);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 5; i++) ctx.fillRect(x - 100 + i * 40 + 10, G - 60, 18, 60);
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(x - 106, G - 66, 212, 8);
  // posts and the striped canopy with its scalloped edge (the canopy's top is a platform)
  ctx.fillStyle = '#e3bf91';
  ctx.fillRect(x - 100, top + 10, 6, G - top - 70);
  ctx.fillRect(x + 94, top + 10, 6, G - top - 70);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? c2 : c1;
    ctx.fillRect(x - 100 + i * 25, top, 25.5, 16);
  }
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? c2 : c1;
    ctx.beginPath();
    ctx.moveTo(x - 100 + i * 25, top + 16);
    ctx.lineTo(x - 75 + i * 25, top + 16);
    ctx.quadraticCurveTo(x - 87.5 + i * 25, top + 32, x - 100 + i * 25, top + 16);
    ctx.fill();
  }
  // the name board
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = c1;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 80, top - 34, 160, 28, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, b.name.toUpperCase(), x, top - 20, 12, '#5b4a6b');
  // today's best, chalked on a little board by the open ones
  if (!b.shut) {
    ctx.fillStyle = '#3f4a3f';
    ctx.fillRect(x + 108, G - 92, 64, 50);
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(x + 138, G - 42, 4, 42);
    text(ctx, "today's best", x + 140, G - 82, 8, '#e8f0e0');
    text(ctx, best ? clip(best.name, 10) : '-', x + 140, G - 67, 9, '#fff4b0');
    text(ctx, best ? String(best.score) : '', x + 140, G - 53, 11, '#ffffff');
  }
}
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// ——— Ride Row: the Ferris wheel and the coaster's track behind, the carousel in front ———
function drawWheel(ctx, time) {
  const x = WHEEL_X, y = G - 240, R = 190, a = time * 0.12;
  ctx.strokeStyle = '#8a7fb0';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x - 90, G);
  ctx.lineTo(x, y);
  ctx.lineTo(x + 90, G);
  ctx.stroke();
  ctx.strokeStyle = '#d6c8f0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, R, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    const t = a + (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(t) * R, y + Math.sin(t) * R);
    ctx.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const t = a + (i / 24) * TAU;
    ctx.fillStyle = BULBS[(i + Math.floor(time * 2)) % BULBS.length];
    circle(ctx, x + Math.cos(t) * R, y + Math.sin(t) * R, 2.6);
  }
  for (let i = 0; i < 12; i++) {
    const t = a + (i / 12) * TAU, gx = x + Math.cos(t) * R, gy = y + Math.sin(t) * R;
    ctx.strokeStyle = '#8a7fb0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy + 10);
    ctx.stroke();
    ctx.fillStyle = BULBS[i % BULBS.length];
    ctx.beginPath();
    ctx.roundRect(gx - 14, gy + 10, 28, 20, [4, 4, 10, 10]);
    ctx.fill();
  }
  ctx.fillStyle = GOLD;
  circle(ctx, x, y, 12);
}
// the Gathering Line's track: hills and a loop behind Ride Row and the mirrors, on lattice legs
const trackY = (x) => G - 150 - 90 * Math.max(0, Math.sin((x - 2500) / 260)) - 40 * Math.sin((x - 2500) / 90) * 0.4;
const TRACK_X0 = 2560, TRACK_X1 = 4440, LOOP_X = 4180;
function drawTrack(ctx, L, R) {
  const x0 = Math.max(TRACK_X0, L - 40), x1 = Math.min(TRACK_X1, R + 40);
  if (x1 <= x0) return;
  ctx.strokeStyle = 'rgba(120,100,150,0.55)';
  ctx.lineWidth = 2;
  for (let x = Math.ceil(x0 / 60) * 60; x < x1; x += 60) {
    if (Math.abs(x - LOOP_X) < 70) continue;
    const y = trackY(x);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, G);
    ctx.moveTo(x - 20, G);
    ctx.lineTo(x, y + 30);
    ctx.lineTo(x + 20, G);
    ctx.stroke();
  }
  ctx.strokeStyle = '#ff6f91';
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 8) (x === x0 ? ctx.moveTo(x, trackY(x)) : ctx.lineTo(x, trackY(x)));
  ctx.stroke();
  if (visible(LOOP_X - 90, LOOP_X + 90, L, R)) {
    ctx.beginPath();
    ctx.arc(LOOP_X, trackY(LOOP_X) - 70, 70, 0, TAU);
    ctx.stroke();
  }
  ctx.strokeStyle = '#ffd1dc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 8) (x === x0 ? ctx.moveTo(x, trackY(x) - 3) : ctx.lineTo(x, trackY(x) - 3));
  ctx.stroke();
}
function drawStation(ctx, time) {
  const x = STATION_X;
  ctx.fillStyle = '#ffe9f0';
  ctx.fillRect(x - 70, G - 120, 140, 120);
  ctx.fillStyle = '#ff6f91';
  ctx.beginPath();
  ctx.moveTo(x - 86, G - 118);
  ctx.lineTo(x, G - 160);
  ctx.lineTo(x + 86, G - 118);
  ctx.fill();
  text(ctx, 'THE GATHERING LINE', x, G - 132, 10, '#fff4e6');
  // the car under a tarp
  ctx.fillStyle = '#b8a8d6';
  ctx.beginPath();
  ctx.roundRect(x - 50, G - 70, 100, 40, 12);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(x - 44, G - 64, 88, 6);
  // the rope across the gate, and an oil can
  ctx.fillStyle = GOLD;
  circle(ctx, x - 64, G - 40, 4);
  circle(ctx, x + 64, G - 40, 4);
  ctx.strokeStyle = '#c23f57';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 64, G - 40);
  ctx.quadraticCurveTo(x, G - 22 + Math.sin(time * 2) * 1.5, x + 64, G - 40);
  ctx.stroke();
  ctx.fillStyle = '#8a8aa0';
  ctx.fillRect(x + 30, G - 16, 14, 16);
  ctx.fillRect(x + 42, G - 20, 10, 3);
}
export const horseBob = (i, time) => Math.sin(time * 2.2 + i * 1.6) * 7;
function drawCarousel(ctx, time, back) {
  const x = CAROUSEL_X, R = CAROUSEL_R, top = 250;
  if (back) {
    // the back of the deck and the centre pole, the far horses going round
    ctx.fillStyle = '#d6b4ff';
    ellipse(ctx, x, G - 6, R + 10, 16);
    ctx.fillStyle = '#fff4e6';
    ctx.fillRect(x - 18, top, 36, G - top - 10);
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = BULBS[(k + Math.floor(time * 3)) % BULBS.length];
      ctx.fillRect(x - 18, top + 30 + k * 40, 36, 8);
    }
    for (let k = 0; k < 6; k++) {
      const a = time * 0.6 + (k / 6) * TAU;
      if (Math.sin(a) > 0) continue; // only the ones round the back
      const hx = x + Math.cos(a) * (R - 30), hy = G - 80 + Math.sin(time * 2 + k) * 5;
      ctx.globalAlpha = 0.55;
      horse(ctx, hx, hy, Math.cos(a) < 0 ? 1 : -1, 0.7, BULBS[k % BULBS.length]);
      ctx.globalAlpha = 1;
    }
    return;
  }
  // the canopy: a striped cone whose stripes turn, and its rim (a platform)
  const turn = (time * 0.6) % 1;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, top - 80);
  ctx.lineTo(x - R - 10, top);
  ctx.lineTo(x + R + 10, top);
  ctx.closePath();
  ctx.clip();
  for (let i = -1; i < 12; i++) {
    const a0 = ((i + turn) / 12) * Math.PI, a1 = ((i + 1 + turn) / 12) * Math.PI;
    ctx.fillStyle = i % 2 ? CREAM : RED;
    ctx.beginPath();
    ctx.moveTo(x, top - 80);
    ctx.lineTo(x - Math.cos(a0) * (R + 10), top);
    ctx.lineTo(x - Math.cos(a1) * (R + 10), top);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = GOLD;
  ctx.fillRect(x - R - 14, top, 2 * R + 28, 12);
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = BULBS[(i + Math.floor(time * 3)) % BULBS.length];
    circle(ctx, x - R - 6 + (i * (2 * R + 12)) / 13, top + 6, 2.6);
  }
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 ? RED : '#8a6fc4';
    const vx = x - R - 14 + (i * (2 * R + 28)) / 12, vw = (2 * R + 28) / 12;
    ctx.beginPath();
    ctx.moveTo(vx, top + 12);
    ctx.lineTo(vx + vw, top + 12);
    ctx.quadraticCurveTo(vx + vw / 2, top + 26, vx, top + 12);
    ctx.fill();
  }
  ctx.fillStyle = GOLD;
  circle(ctx, x, top - 84, 6);
  // the front of the deck
  ctx.fillStyle = '#c4a0ff';
  ctx.fillRect(x - R - 10, G - 8, 2 * R + 20, 8);
  // the horses you can ride, each on its pole, bobbing (a slime on one bobs with it: src/fair.js rideOf)
  for (const h of HORSES) {
    const hx = h.x + h.w / 2, dy = horseBob(h.i, time);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx, top + 12);
    ctx.lineTo(hx, G - 8);
    ctx.stroke();
    horse(ctx, hx, h.y + 14 + dy, h.i % 2 ? -1 : 1, 1, BULBS[(h.i + 1) % BULBS.length]);
  }
}
// a carousel horse, saddle top at y (a jelly-horse: round, soft, a mane of drips)
function horse(ctx, x, y, dir, s, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  ctx.fillStyle = '#fffaf0';
  ellipse(ctx, 0, 8, 26, 13); // body
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.quadraticCurveTo(28, -18, 34, -16);
  ctx.lineTo(38, -6);
  ctx.quadraticCurveTo(30, 2, 22, 10);
  ctx.fill(); // neck and head
  ctx.fillStyle = '#fffaf0';
  for (const [lx, a] of [[-16, 0.5], [16, -0.5]]) {
    ctx.save();
    ctx.translate(lx, 16);
    ctx.rotate(a);
    ctx.fillRect(-3, 0, 6, 16);
    ctx.restore();
  }
  ctx.fillStyle = c;
  ellipse(ctx, 26, -14, 5, 7); // mane
  ellipse(ctx, 20, -8, 4, 6);
  ellipse(ctx, -26, 6, 6, 4); // tail
  ctx.fillStyle = '#e8546a';
  ctx.fillRect(-10, -4, 20, 6); // saddle
  ctx.fillStyle = '#3a3550';
  circle(ctx, 32, -12, 1.4);
  ctx.restore();
}

// ——— the Hall of Mirrors: an open-fronted pavilion; each mirror shows the slimes in front of it, bent ———
function drawMirrorHall(ctx, time, slimes) {
  const x0 = MIRRORS_X0, x1 = MIRRORS_X1, top = 262;
  ctx.fillStyle = '#5b4a7b';
  ctx.fillRect(x0, top, x1 - x0, G - top);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x = x0; x < x1; x += 30) ctx.fillRect(x, top, 12, G - top);
  for (const m of MIRRORS) drawMirror(ctx, m, time, slimes);
  // the roof and its sign
  ctx.fillStyle = '#8a6fc4';
  ctx.beginPath();
  ctx.moveTo(x0 - 16, top + 4);
  ctx.lineTo((x0 + x1) / 2, top - 46);
  ctx.lineTo(x1 + 16, top + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.fillRect(x0 - 16, top - 2, x1 - x0 + 32, 8);
  ctx.fillStyle = '#fffaf0';
  ctx.beginPath();
  ctx.roundRect((x0 + x1) / 2 - 90, top - 34, 180, 26, 12);
  ctx.fill();
  text(ctx, 'HALL OF MIRRORS', (x0 + x1) / 2, top - 21, 12, '#5b4a7b');
  ctx.fillStyle = GOLD;
  ctx.fillRect(x0 - 8, top, 8, G - top);
  ctx.fillRect(x1, top, 8, G - top);
}
const MIRROR_W = 82, MIRROR_TOP = G - 176, MIRROR_BASE = G - 20;
function drawMirror(ctx, m, time, slimes) {
  const x = m.x, l = x - MIRROR_W / 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(l, MIRROR_TOP, MIRROR_W, MIRROR_BASE - MIRROR_TOP, [40, 40, 8, 8]);
  const glass = ctx.createLinearGradient(l, 0, l + MIRROR_W, 0);
  glass.addColorStop(0, '#cfe0f2');
  glass.addColorStop(0.5, '#eef6ff');
  glass.addColorStop(1, '#bcd0e8');
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.clip();
  // the reflections: every slime standing close to this mirror, stretched its way
  for (const s of slimes) {
    if (!s || Math.abs(s.x - x) > 70 || s.y < G - 60) continue;
    ctx.save();
    ctx.globalAlpha = 0.85;
    let sx = 1, sy = 1, base = MIRROR_BASE - 4;
    if (m.bend === 'tall') [sx, sy] = [0.55, 1.9];
    else if (m.bend === 'wide') [sx, sy] = [1.8, 0.55];
    else if (m.bend === 'wobble') [sx, sy] = [1 + 0.4 * Math.sin(time * 3), 1 - 0.35 * Math.sin(time * 3)];
    else [sy, base] = [-1, MIRROR_TOP + 12];
    ctx.translate(x + (s.x - x) * 0.5, base);
    ctx.scale(sx, sy);
    ctx.translate(-s.x, -s.y);
    s.draw(ctx);
    ctx.restore();
  }
  // a sheen sweeping across
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  const k = ((time * 0.3 + m.x * 0.01) % 1.6) - 0.3;
  ctx.beginPath();
  ctx.moveTo(l + k * MIRROR_W, MIRROR_TOP);
  ctx.lineTo(l + k * MIRROR_W + 16, MIRROR_TOP);
  ctx.lineTo(l + k * MIRROR_W - 24, MIRROR_BASE);
  ctx.lineTo(l + k * MIRROR_W - 40, MIRROR_BASE);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(l, MIRROR_TOP, MIRROR_W, MIRROR_BASE - MIRROR_TOP, [40, 40, 8, 8]);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  circle(ctx, x, MIRROR_TOP - 4, 6);
  ctx.fillRect(x - 30, MIRROR_BASE, 60, 6);
}

// ——— the pier's end ———
function drawPier(ctx, L, R) {
  if (!visible(PIER_X, FAIR_W, L, R)) return;
  ctx.strokeStyle = '#9c6f45';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(PIER_X + 20, G - 40);
  ctx.lineTo(FAIR_W - 10, G - 40);
  ctx.stroke();
  for (let x = PIER_X + 20; x <= FAIR_W - 10; x += 60) {
    ctx.fillStyle = '#9c6f45';
    ctx.fillRect(x - 3, G - 46, 6, 46);
  }
  ctx.fillRect(FAIR_W - 14, G - 120, 6, 120);
  ctx.fillStyle = '#fffaf0';
  ctx.beginPath();
  ctx.roundRect(FAIR_W - 130, G - 150, 116, 30, 8);
  ctx.fill();
  text(ctx, "THE PIER'S END", FAIR_W - 72, G - 135, 10, '#5b4a7b');
}
function drawPlatform(ctx, p, time) {
  if (p.kind === 'kiosk') drawKiosk(ctx, p, time);
  else if (p.kind === 'crates') {
    ctx.fillStyle = '#c99b6b';
    ctx.fillRect(p.x, p.y, p.w, G - p.y);
    ctx.strokeStyle = '#a4785a';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x + 2, p.y + 2, p.w - 4, G - p.y - 4);
    ctx.beginPath();
    ctx.moveTo(p.x + 2, p.y + 2);
    ctx.lineTo(p.x + p.w - 2, G - 2);
    ctx.stroke();
  } else if (p.kind === 'post') {
    ctx.fillStyle = '#7d5634';
    ctx.fillRect(p.x + p.w / 2 - 8, p.y, 16, G - p.y);
    ctx.fillStyle = '#b98a5c';
    ctx.fillRect(p.x, p.y, p.w, 8);
  }
}

// Everything in the fair behind the slimes. slimes: the visible ones (the mirrors show them); bests: today's best at
// each booth ({game: {name, score}})
export function drawFair(ctx, camX, viewW, time, slimes, bests) {
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, camX, time);
  drawFarTents(ctx, camX);
  ctx.restore();
  const L = camX - 120, R = camX + viewW + 120;
  drawGround(ctx, L, R);
  if (visible(WHEEL_X - 220, WHEEL_X + 220, L, R)) drawWheel(ctx, time);
  drawTrack(ctx, L, R);
  if (visible(BIGTOP_X - 320, BIGTOP_X + 320, L, R)) drawBigTop(ctx, time);
  drawLights(ctx, L, R, time);
  if (visible(0, 520, L, R)) drawEntrance(ctx, time);
  if (visible(prizeX(0) - 80, prizeX(PRIZES.length - 1) + 80, L, R)) drawPrizeCounter(ctx, time);
  for (const b of BOOTHS) if (visible(b.x - 110, b.x + 180, L, R)) drawBooth(ctx, b, time, b.game ? bests?.[b.game] : null);
  if (visible(CAROUSEL_X - CAROUSEL_R - 20, CAROUSEL_X + CAROUSEL_R + 20, L, R)) {
    drawCarousel(ctx, time, true);
    drawCarousel(ctx, time, false);
  }
  if (visible(STATION_X - 90, STATION_X + 90, L, R)) drawStation(ctx, time);
  if (visible(MIRRORS_X0 - 20, MIRRORS_X1 + 20, L, R)) drawMirrorHall(ctx, time, slimes);
  drawPier(ctx, L, R);
  for (const p of FAIR_PLATFORMS) if (visible(p.x - 20, p.x + p.w + 20, L, R)) drawPlatform(ctx, p, time);
}

// ——— the prizes, worn (Slime.draw calls this in the slime's own frame: facing right, feet at 0, h tall) ———
function balloon(ctx, x, y, r) {
  ctx.fillStyle = '#ff8fb0';
  ellipse(ctx, x, y, r, r * 1.15);
  ctx.fillStyle = '#e8638a';
  ctx.beginPath();
  ctx.moveTo(x - 3, y + r * 1.15 + 3);
  ctx.lineTo(x + 3, y + r * 1.15 + 3);
  ctx.lineTo(x, y + r * 1.15 - 1);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, x - r * 0.35, y - r * 0.4, r * 0.25, r * 0.4, -0.4);
}
function floss(ctx, x, y, s) {
  ctx.strokeStyle = '#e3bf91';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 16 * s);
  ctx.stroke();
  ctx.fillStyle = '#ffb3d1';
  for (const [dx, dy, r] of [[0, -24, 9], [-7, -20, 6], [7, -20, 6], [-5, -29, 6], [5, -29, 6], [0, -33, 5]]) circle(ctx, x + dx * s, y + dy * s, r * s);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  circle(ctx, x - 3 * s, y - 28 * s, 2.5 * s);
}
function crown(ctx, x, y, w) {
  const h = w * 0.42;
  ctx.fillStyle = GOLD;
  ctx.strokeStyle = '#c9932a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w / 2, y - h * 0.5);
  for (let i = 0; i < 4; i++) {
    const px = x - w / 2 + ((i + 0.5) * w) / 4;
    ctx.lineTo(px, y - h);
    ctx.lineTo(x - w / 2 + ((i + 1) * w) / 4, y - h * 0.5);
  }
  ctx.lineTo(x + w / 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ff6f91';
  circle(ctx, x, y - h * 0.3, w * 0.05);
  ctx.fillStyle = '#7fc8ff';
  circle(ctx, x - w * 0.28, y - h * 0.28, w * 0.04);
  circle(ctx, x + w * 0.28, y - h * 0.28, w * 0.04);
}
function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.48 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}
function specs(ctx, x, y, s) {
  for (const dx of [-7.5, 7.5]) {
    star(ctx, x + dx * s, y, 7 * s);
    ctx.fillStyle = 'rgba(255,130,180,0.55)';
    ctx.fill();
    ctx.strokeStyle = '#e8546a';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.strokeStyle = '#e8546a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - 2.5 * s, y);
  ctx.lineTo(x + 2.5 * s, y);
  ctx.stroke();
}
function jester(ctx, x, y, w, t) {
  const cols = ['#e8546a', '#7fa8ff', GOLD];
  ctx.fillStyle = '#8a6fc4';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 6, w, 8, 4);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const bx = x + (i - 1) * w * 0.42, sway = Math.sin(t * 3 + i) * 3;
    const tipX = bx + (i - 1) * w * 0.35 + sway, tipY = y - w * 0.55 + (i === 1 ? -6 : 8);
    ctx.fillStyle = cols[i];
    ctx.beginPath();
    ctx.moveTo(bx - w * 0.2, y - 5);
    ctx.quadraticCurveTo(bx, y - w * 0.6, tipX, tipY);
    ctx.quadraticCurveTo(bx + w * 0.05, y - w * 0.25, bx + w * 0.2, y - 5);
    ctx.fill();
    ctx.fillStyle = '#ffe28a';
    circle(ctx, tipX, tipY + 3, 3);
  }
}

// the prizes on a slime. s: the Slime (its accessories, its clock t); fx: its face's x
export function drawFairWear(ctx, s, w, h, fx) {
  const t = s.t;
  if (s.has('fair_balloon')) {
    const bx = -w * 0.55 + Math.sin(t * 1.3) * 4, by = -h - 46 + Math.sin(t * 1.9) * 3;
    ctx.strokeStyle = 'rgba(110,100,130,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w * 0.35, -h * 0.35);
    ctx.quadraticCurveTo(-w * 0.6, -h * 0.8, bx, by + 15);
    ctx.stroke();
    balloon(ctx, bx, by, 12);
  }
  if (s.has('candy_floss')) floss(ctx, w * 0.46, -h * 0.2, 0.75);
  if (s.has('star_specs')) specs(ctx, fx + 0.5, -h * 0.42, 0.9);
  if (s.has('paper_crown')) {
    ctx.save();
    ctx.translate(-w * 0.04, -h * 0.9);
    ctx.rotate(-0.12);
    crown(ctx, 0, 0, w * 0.5);
    ctx.restore();
  }
  if (s.has('jester_cap')) jester(ctx, -w * 0.02, -h * 0.86, w * 0.62, t);
}

// Ringmaster Fizz (accessory 'ringmaster'): a tall red top hat with a gold band, a curly painted moustache, a gold bow
export function drawRingmaster(ctx, w, h, fx, t) {
  // the hat
  ctx.save();
  ctx.translate(-w * 0.04, -h * 0.9);
  ctx.rotate(-0.06 + Math.sin(t * 2) * 0.02);
  ctx.fillStyle = '#2f2440';
  ellipse(ctx, 0, 0, w * 0.36, 5);
  ctx.fillStyle = '#c23f57';
  ctx.beginPath();
  ctx.roundRect(-w * 0.2, -h * 0.62, w * 0.4, h * 0.62, 4);
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.fillRect(-w * 0.2, -h * 0.18, w * 0.4, h * 0.1);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(-w * 0.15, -h * 0.58, w * 0.06, h * 0.36);
  ctx.restore();
  // the moustache
  const my = -h * 0.3;
  ctx.fillStyle = '#4a2f3a';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(fx, my);
    ctx.quadraticCurveTo(fx + side * 8, my + 5, fx + side * 13, my - 2);
    ctx.quadraticCurveTo(fx + side * 15, my - 6, fx + side * 12, my - 6);
    ctx.quadraticCurveTo(fx + side * 12, my - 2, fx + side * 8, my);
    ctx.quadraticCurveTo(fx + side * 4, my - 2, fx, my);
    ctx.fill();
  }
  // a gold bow at the collar
  ctx.fillStyle = GOLD;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(fx, -h * 0.08);
    ctx.lineTo(fx + side * 8, -h * 0.08 - 4);
    ctx.lineTo(fx + side * 8, -h * 0.08 + 4);
    ctx.closePath();
    ctx.fill();
  }
  circle(ctx, fx, -h * 0.08, 2.4);
}
