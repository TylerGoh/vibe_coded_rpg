// Docs: docs/sandbox.md
// The dev sandbox's art: the Training Yard (room ARENA, drawArena, called by render() in src/main.js) and its two
// training dummies (SANDBOX_MOB_ART, called by drawMob in src/field.js). Soft and pastel like the rest; drawn only on a
// sandbox server, since nobody else ever stands in the yard.
import { H, TAU, circle, ellipse } from './util.js';
import { ARENA_W, ARENA_PLATFORMS } from './shared/sandbox.js';

const GROUND = 450; // (FIELD_GROUND: the yard's floor, ROOMS[ARENA] in sim.js)
let sky = null, skyCtx = null; // the sky's gradient, made once per canvas context

function drawHills(ctx, L, R, camX, par, y, amp, color, seed) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(L, GROUND);
  for (let x = L; x <= R + 40; x += 40) {
    const wx = x - camX * (1 - par); // (parallax: a far layer slides at `par` of the camera's speed)
    ctx.lineTo(x, y - amp * (0.6 + 0.4 * Math.sin(wx / 210 + seed)) - amp * 0.3 * Math.sin(wx / 87 + seed * 2));
  }
  ctx.lineTo(R + 40, GROUND);
  ctx.closePath();
  ctx.fill();
}

function drawCloud(ctx, x, y, s) {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [dx, dy, r] of [[-26, 4, 16], [-8, -6, 22], [14, -2, 18], [30, 6, 13], [2, 8, 16]]) circle(ctx, x + dx * s, y + dy * s, r * s);
}

// a bunting line between two poles: little pastel flags on a sagging string
function drawBunting(ctx, x0, x1, y, time) {
  const cols = ['#ff9fbf', '#ffd77a', '#9fe0c0', '#a8c8ff', '#d6b0ff'];
  const sag = (x) => y + Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * 26;
  ctx.strokeStyle = 'rgba(110,90,120,0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.quadraticCurveTo((x0 + x1) / 2, y + 52, x1, y);
  ctx.stroke();
  let i = 0;
  for (let x = x0 + 22; x < x1 - 12; x += 30, i++) {
    const fy = sag(x), sway = Math.sin(time * 2 + x / 50) * 2;
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath();
    ctx.moveTo(x - 9, fy);
    ctx.lineTo(x + 9, fy);
    ctx.lineTo(x + sway, fy + 18);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPost(ctx, x, top) {
  ctx.fillStyle = '#b98b62';
  ctx.beginPath();
  ctx.roundRect(x - 6, top, 12, GROUND - top + 4, 4);
  ctx.fill();
  ctx.fillStyle = '#d7aa7d';
  ellipse(ctx, x, top + 2, 7, 4);
}

// a wooden stand: a plank on two legs (ARENA_PLATFORMS: x is its left end, y its top)
function drawStand(ctx, p) {
  ctx.fillStyle = '#a77a54';
  for (const lx of [p.x + 18, p.x + p.w - 18]) {
    ctx.beginPath();
    ctx.roundRect(lx - 6, p.y + 6, 12, GROUND - p.y - 2, 3);
    ctx.fill();
  }
  ctx.strokeStyle = '#8f6646';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(p.x + 18, p.y + 20);
  ctx.lineTo(p.x + p.w - 18, GROUND - 16);
  ctx.stroke();
  ctx.fillStyle = '#e0b484';
  ctx.beginPath();
  ctx.roundRect(p.x, p.y - 2, p.w, 14, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(140,96,64,0.35)';
  for (let x = p.x + 30; x < p.x + p.w - 10; x += 34) ctx.fillRect(x, p.y + 1, 2, 9);
}

function drawHay(ctx, x) {
  ctx.fillStyle = '#f2d37c';
  ctx.beginPath();
  ctx.roundRect(x - 34, GROUND - 40, 68, 42, 12);
  ctx.fill();
  ctx.strokeStyle = '#d9a94d';
  ctx.lineWidth = 2;
  for (const dy of [-28, -14]) {
    ctx.beginPath();
    ctx.moveTo(x - 30, GROUND + dy);
    ctx.lineTo(x + 30, GROUND + dy);
    ctx.stroke();
  }
}

// the Training Yard: a fenced field under a soft sky, bunting, hay bales, the two stands and its sign
export function drawArena(ctx, camX, viewW, time) {
  const L = camX - 80, R = camX + viewW + 80;
  if (!sky || skyCtx !== ctx) {
    sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, '#bfe3ff');
    sky.addColorStop(0.6, '#ffe2ef');
    sky.addColorStop(1, '#fff3dc');
    skyCtx = ctx;
  }
  ctx.save();
  ctx.fillStyle = sky;
  ctx.fillRect(L, 0, R - L, H);
  for (let i = 0; i < 6; i++) {
    const span = viewW + 400, x = camX * 0.85 + ((((i * 470 + time * 8 - camX * 0.15) % span) + span) % span) - 200; // (they drift, and slide slowly)
    if (x > L - 80 && x < R + 80) drawCloud(ctx, x, 70 + (i % 3) * 38, 0.8 + (i % 2) * 0.35);
  }
  drawHills(ctx, L, R, camX, 0.25, 360, 60, '#cfe8c8', 1);
  drawHills(ctx, L, R, camX, 0.5, 400, 40, '#b7deb0', 4);
  // the fence along the back, with bunting from pole to pole
  ctx.fillStyle = '#d9b08a';
  for (const y of [GROUND - 52, GROUND - 30]) ctx.fillRect(Math.max(0, L), y, Math.min(ARENA_W, R) - Math.max(0, L), 7);
  for (let x = 40; x <= ARENA_W; x += 120) if (x > L - 20 && x < R + 20) drawPost(ctx, x, GROUND - 66);
  for (let x = 40; x + 360 <= ARENA_W; x += 360) if (x + 360 > L && x < R) drawBunting(ctx, x, x + 360, 150, time);
  for (let x = 40; x <= ARENA_W; x += 360) if (x > L - 20 && x < R + 20) drawPost(ctx, x, 146);
  // the sign
  if (L < 520 && R > 200) {
    drawPost(ctx, 300, GROUND - 120);
    drawPost(ctx, 420, GROUND - 120);
    ctx.fillStyle = '#fff7ea';
    ctx.strokeStyle = '#b98b62';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(270, GROUND - 150, 180, 56, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7a5fc0';
    ctx.font = '700 20px Fredoka, "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Training Yard', 360, GROUND - 129);
    ctx.fillStyle = '#b0763a';
    ctx.font = '700 12px Fredoka, "Trebuchet MS", sans-serif';
    ctx.fillText('dev sandbox', 360, GROUND - 108);
  }
  for (const x of [130, 1060, 2050]) if (x > L - 40 && x < R + 40) drawHay(ctx, x);
  // the floor: packed earth with a grassy edge
  ctx.fillStyle = '#9ccf86';
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = '#e6c9a0';
  ctx.fillRect(L, GROUND + 14, R - L, H - GROUND);
  ctx.fillStyle = 'rgba(180,140,100,0.35)';
  for (let x = Math.floor(L / 90) * 90; x < R; x += 90) ellipse(ctx, x + 30, GROUND + 40 + (x % 3) * 12, 14, 4);
  ctx.fillStyle = '#86c070'; // the grass's edge (one path: docs/performance.md)
  ctx.beginPath();
  for (let x = Math.floor(L / 16) * 16; x < R; x += 16) {
    ctx.moveTo(x, GROUND + 2);
    ctx.lineTo(x + 4, GROUND - 6 - (((x / 16) % 3) + 3) % 3 * 2 + Math.sin(time * 2 + x) * 1.2);
    ctx.lineTo(x + 8, GROUND + 2);
  }
  ctx.fill();
  for (const p of ARENA_PLATFORMS) if (p.x + p.w > L && p.x < R) drawStand(ctx, p);
  ctx.restore();
}

// ——— the dummies (drawMob's art: origin at the feet, +x the way it faces; returns its silhouette) ———
function drawDummy(ctx, w, h, t, seed, m, dying, spar) {
  const hurt = Math.max(0, Math.min(1, m.hurt ?? 0));
  const tilt = Math.sin(t * 26) * 0.16 * hurt + (spar && m.warn ? -0.08 : 0); // (it rocks on its post when hit)
  const bodyY = -h * 0.52, headY = -h * 0.86;
  const sil = () => {
    ctx.beginPath();
    ctx.ellipse(0, bodyY, w * 0.42, h * 0.27, 0, 0, TAU);
    ctx.moveTo(w * 0.24, headY);
    ctx.arc(0, headY, w * 0.24, 0, TAU);
  };
  // the post, stuck in the ground
  ctx.fillStyle = '#a77a54';
  ctx.beginPath();
  ctx.roundRect(-4, -h * 0.4, 8, h * 0.4 + 2, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(80,60,40,0.25)';
  ellipse(ctx, 0, 1, w * 0.4, 4);
  ctx.save();
  ctx.translate(0, -h * 0.3);
  ctx.rotate(tilt);
  ctx.translate(0, h * 0.3);
  // the crossbar arms (the sparring one holds a wooden sword)
  ctx.strokeStyle = '#b98b62';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.62, bodyY - h * 0.08);
  ctx.lineTo(w * 0.62, bodyY - h * 0.08 - (spar ? h * 0.06 : 0));
  ctx.stroke();
  if (spar) {
    ctx.save();
    ctx.translate(w * 0.62, bodyY - h * 0.14);
    ctx.rotate(-0.9 - (m.warn ? 0.5 : 0));
    ctx.fillStyle = '#d7aa7d';
    ctx.beginPath();
    ctx.roundRect(-3, -h * 0.42, 7, h * 0.42, 3);
    ctx.fill();
    ctx.fillStyle = '#8f6646';
    ctx.fillRect(-8, -4, 17, 5);
    ctx.restore();
  }
  // the straw sack body, with a painted target
  ctx.fillStyle = spar ? '#e9c7a4' : '#efd9b0';
  sil();
  ctx.fill();
  ctx.strokeStyle = '#c49a6c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#f08aa8';
  ctx.lineWidth = 3;
  for (const r of [0.22, 0.12]) {
    ctx.beginPath();
    ctx.arc(w * 0.02, bodyY + h * 0.02, w * r * 1.3, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = '#f08aa8';
  circle(ctx, w * 0.02, bodyY + h * 0.02, w * 0.06);
  // straw poking out at the waist, and the rope round it
  ctx.strokeStyle = '#e7c35c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -3; i <= 3; i++) {
    ctx.moveTo(i * w * 0.08, bodyY + h * 0.24);
    ctx.lineTo(i * w * 0.1 + Math.sin(seed + i) * 3, bodyY + h * 0.33);
  }
  ctx.stroke();
  ctx.strokeStyle = '#9b7350';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.36, bodyY - h * 0.14);
  ctx.quadraticCurveTo(0, bodyY - h * 0.1, w * 0.36, bodyY - h * 0.14);
  ctx.stroke();
  // the head: stitched eyes (a bandana and cross brows on the sparring one)
  if (spar) {
    ctx.fillStyle = '#ff8fa8';
    ctx.beginPath();
    ctx.ellipse(0, headY - h * 0.08, w * 0.25, h * 0.05, 0, Math.PI, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-w * 0.22, headY - h * 0.08);
    ctx.lineTo(-w * 0.42, headY - h * 0.02 + Math.sin(t * 5) * 2);
    ctx.lineTo(-w * 0.32, headY - h * 0.1);
    ctx.fill();
  }
  ctx.strokeStyle = '#6b5544';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  const ex = w * 0.09, ey = headY + h * 0.005, k = 3;
  ctx.beginPath();
  if (hurt > 0.3 || dying > 0) {
    for (const sx of [-ex, ex]) {
      ctx.moveTo(sx - k, ey - k);
      ctx.lineTo(sx + k, ey + k);
      ctx.moveTo(sx + k, ey - k);
      ctx.lineTo(sx - k, ey + k);
    }
  } else {
    for (const sx of [-ex, ex]) {
      ctx.moveTo(sx - k, ey);
      ctx.lineTo(sx + k, ey);
    }
  }
  if (spar) {
    ctx.moveTo(-ex - 5, ey - 7);
    ctx.lineTo(-ex + 3, ey - 4);
    ctx.moveTo(ex + 5, ey - 7);
    ctx.lineTo(ex - 3, ey - 4);
  }
  ctx.moveTo(-w * 0.07, ey + h * 0.06);
  ctx.quadraticCurveTo(0, ey + h * (spar ? 0.045 : 0.075), w * 0.07, ey + h * 0.06);
  ctx.stroke();
  ctx.restore();
  return () => {
    ctx.save();
    ctx.translate(0, -h * 0.3);
    ctx.rotate(tilt);
    ctx.translate(0, h * 0.3);
    sil();
    ctx.restore();
  };
}

export const SANDBOX_MOB_ART = {
  dummy: (ctx, w, h, t, seed, m, dying) => drawDummy(ctx, w, h, t, seed, m, dying, false),
  dummy_spar: (ctx, w, h, t, seed, m, dying) => drawDummy(ctx, w, h, t, seed, m, dying, true),
};
