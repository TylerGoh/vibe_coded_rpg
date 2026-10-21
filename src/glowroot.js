// Docs: docs/places/deep.md
// Glowroot Hollow (room GLOWROOT, data in src/shared/rpg.js): a hard pocket at the bottom of the Mycelium
// Deep, down the crack at its far end. The deepest cave on Greenhollow, where the glowing threads come
// together and the whole place shines. West to east: the Glowfall (a curtain of glowing threads pouring
// down the crack you climbed in by; no mobs), the Lit Galleries, and the Heart Knot, where every thread
// meets in one great knot that pulses like a heart. Brighter and stranger than the Deep, still soft:
// teal-dark rock, threads in mint, pink and gold, huge glowcaps. Platforms: glowcaps and root bridges.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { GLOWROOT_W, GLOWROOT_EXIT_X, GLOWROOT_ZONES, GLOWROOT_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { glow } from './deep.js';

const GROUND = FIELD_GROUND;
const HEART_X = GLOWROOT_W - 200, HEART_Y = 210; // the Heart Knot, high on the far wall
const COLORS = ['160,255,220', '255,190,235', '255,226,160'];
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
// Threads run in from the west along the wall and curve up into the Heart Knot
const THREADS = (() => {
  const r = mulberry32(2901);
  return Array.from({ length: 7 }, (_, i) => ({ y0: 90 + i * 46 + r() * 18, a: 14 + r() * 20, f: 0.003 + r() * 0.003, p: r() * TAU, w: 6 + r() * 8, c: COLORS[i % 3], v: 60 + r() * 40, gap: 200 + r() * 160 }));
})();
const threadY = (t, x) => {
  const y = t.y0 + t.a * Math.sin(x * t.f + t.p);
  const k = Math.max(0, Math.min(1, (x - (HEART_X - 1100)) / 1100)); // drawn in toward the knot
  return y + (HEART_Y - y) * k * k;
};
const farRocks = [0.3, 0.55].map((f, j) => {
  const r = mulberry32(2910 + j);
  return { f, bumps: Array.from({ length: 10 }, (_, i) => ({ x: i * 200 + r() * 90, w: 130 + r() * 150, h: 100 + r() * 120 + j * 30 })) };
});
const crystals = (() => {
  const r = mulberry32(2921);
  const out = [];
  for (let x = 40; x < GLOWROOT_W; x += 50 + r() * 110) out.push({ x, h: 14 + r() * 30, lean: r() * 0.5 - 0.25, c: COLORS[Math.floor(r() * 3)], up: r() < 0.5 });
  return out;
})();
const glowcaps = (() => {
  const r = mulberry32(2931);
  const out = [];
  for (let x = 30; x < GLOWROOT_W - 20; x += 24 + r() * 60) if (r() < 0.7) out.push({ x, h: 8 + r() * 18, s: 0.7 + r() * 1, c: COLORS[Math.floor(r() * 3)], p: r() * TAU });
  return out;
})();
const motes = (() => {
  const r = mulberry32(2937);
  return Array.from({ length: 44 }, () => ({ x: r() * W, y: 60 + r() * 380, v: 8 + r() * 14, p: r() * TAU, s: 1 + r() * 2, c: COLORS[Math.floor(r() * 3)] }));
})();

// Everything behind the slimes. camX is the left edge of the view.
export function drawGlowroot(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawBackWall(ctx, camX, time);
  ctx.restore();

  const L = camX - 80, R = camX + viewW + 80;
  if (visible(HEART_X - 1300, GLOWROOT_W + 40, L, R)) drawHeart(ctx, time);
  drawThreads(ctx, Math.max(0, L), Math.min(GLOWROOT_W, R), time);
  drawRoof(ctx, Math.max(0, L), Math.min(GLOWROOT_W, R), time);
  if (visible(-60, 360, L, R)) drawGlowfall(ctx, time);
  for (const p of GLOWROOT_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'glowcap') drawGlowcap(ctx, p, time);
    else drawRootBridge(ctx, p, time);
  }
  drawFloor(ctx, Math.max(0, L), Math.min(GLOWROOT_W, R), time);
  GLOWROOT_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x0 + 70;
    if (visible(sx - 80, sx + 80, L, R)) drawZoneSign(ctx, sx, z, i, time);
  });
  if (visible(GLOWROOT_EXIT_X - 60, GLOWROOT_EXIT_X + 150, L, R)) drawExitSign(ctx, GLOWROOT_EXIT_X + 90, time);
  drawMotes(ctx, camX, time);
}

function drawBackWall(ctx, camX, time) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#101d2e');
  g.addColorStop(0.55, '#1a3346');
  g.addColorStop(1, '#25495a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const k = Math.min(1, Math.max(0, (camX - 600) / 2000));
  glow(ctx, W * 0.9, 200, 600, 360, '170,255,225', 0.15 + 0.25 * k + 0.05 * Math.sin(time * 1.2));
  farRocks.forEach(({ f, bumps }, j) => {
    ctx.fillStyle = j ? '#1f3a4c' : '#172d3e';
    const span = 200 * 10, off = -((camX * f) % span);
    for (const rep of [0, span]) {
      ctx.beginPath();
      ctx.moveTo(off + rep - 50, GROUND);
      for (const b of bumps) {
        const x = off + rep + b.x;
        ctx.lineTo(x - b.w / 2, GROUND - 20);
        ctx.quadraticCurveTo(x - b.w * 0.3, GROUND - b.h, x, GROUND - b.h * 1.05);
        ctx.quadraticCurveTo(x + b.w * 0.3, GROUND - b.h, x + b.w / 2, GROUND - 20);
      }
      ctx.lineTo(off + rep + span + 50, GROUND);
      ctx.closePath();
      ctx.fill();
    }
  });
}

// The Heart Knot: every thread in the island meets here, wound into one great knot that beats slowly
function drawHeart(ctx, time) {
  const beat = 0.5 + 0.5 * Math.sin(time * 1.4) ** 8 + 0.15 * Math.sin(time * 1.4);
  glow(ctx, HEART_X, HEART_Y, 300, 240, '170,255,225', 0.35 + 0.25 * beat);
  glow(ctx, HEART_X, HEART_Y, 160, 130, '255,200,240', 0.3 + 0.2 * beat);
  ctx.save();
  ctx.lineCap = 'round';
  for (let j = 0; j < 9; j++) {
    const rx = 70 + (j % 3) * 22 + beat * 4, ry = 44 + ((j + 1) % 3) * 16, rot = j * 0.7 + time * 0.03 * (j % 2 ? 1 : -1);
    ctx.strokeStyle = j % 2 ? '#24505a' : '#2c4458';
    ctx.lineWidth = 14 - (j % 3) * 3;
    ctx.beginPath();
    ctx.ellipse(HEART_X, HEART_Y, rx, ry, rot, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${COLORS[j % 3]},${0.55 + 0.35 * beat})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(245,255,250,${0.7 + 0.3 * beat})`;
  circle(ctx, HEART_X, HEART_Y, 12 + beat * 4);
  // threads hanging down from it to the floor, like the roots of a tree
  for (let i = -3; i <= 3; i++) {
    ctx.strokeStyle = '#24505a';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(HEART_X + i * 20, HEART_Y + 40);
    ctx.quadraticCurveTo(HEART_X + i * 50, (HEART_Y + GROUND) / 2 + 20, HEART_X + i * 70, GROUND + 4);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${COLORS[(i + 3) % 3]},0.6)`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawThreads(ctx, L, R, time) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const [i, t] of THREADS.entries()) {
    const x1 = Math.min(R, HEART_X);
    if (x1 < L) continue;
    ctx.beginPath();
    for (let x = L - (L % 16); x <= x1 + 16; x += 16) (x === L - (L % 16) ? ctx.moveTo(x, threadY(t, x)) : ctx.lineTo(x, threadY(t, x)));
    ctx.strokeStyle = `rgba(${t.c},0.14)`;
    ctx.lineWidth = t.w + 16;
    ctx.stroke();
    ctx.strokeStyle = '#24464f';
    ctx.lineWidth = t.w;
    ctx.stroke();
    ctx.strokeStyle = `rgba(${t.c},0.6)`;
    ctx.lineWidth = Math.max(2, t.w * 0.3);
    ctx.stroke();
    // glow running west along every thread, away from the heart
    const n = Math.ceil((HEART_X + 200) / t.gap), span = n * t.gap;
    for (let k = 0; k < n; k++) {
      const px = (((k * t.gap - time * t.v + i * 131) % span) + span) % span - 100;
      if (px < L - 40 || px > x1 + 40) continue;
      const py = threadY(t, px);
      glow(ctx, px, py, 24, 14, t.c, 0.9);
      ctx.fillStyle = 'rgba(250,255,252,0.9)';
      circle(ctx, px, py, t.w * 0.3);
    }
  }
  ctx.restore();
}

// The roof: crystals and glow drips hanging from it
function drawRoof(ctx, L, R, time) {
  ctx.fillStyle = '#0c1724';
  ctx.beginPath();
  ctx.moveTo(L - 20, 0);
  for (let x = L - (L % 40) - 40; x <= R + 40; x += 40) ctx.lineTo(x, 24 + Math.sin(x * 0.011) * 9 + Math.sin(x * 0.037) * 5);
  ctx.lineTo(R + 20, 0);
  ctx.closePath();
  ctx.fill();
  for (const c of crystals) {
    if (c.x < L - 30 || c.x > R + 30) continue;
    const base = c.up ? GROUND + 2 : 22 + Math.sin(c.x * 0.011) * 9, dir = c.up ? -1 : 1;
    glow(ctx, c.x, base + dir * c.h * 0.6, 18, 22, c.c, 0.35 + 0.15 * Math.sin(time * 1.8 + c.x));
    ctx.fillStyle = `rgba(${c.c},0.75)`;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.save();
    ctx.translate(c.x, base);
    ctx.rotate(c.lean);
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(0, dir * c.h);
    ctx.lineTo(5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// The Glowfall: the threads you climbed down by, pouring out of the crack in the roof like a waterfall of light
function drawGlowfall(ctx, time) {
  const x = GLOWROOT_EXIT_X;
  glow(ctx, x + 10, GROUND - 160, 150, 260, '170,255,225', 0.45);
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const dx = -50 + i * 13, sway = Math.sin(time * 0.9 + i) * 6;
    ctx.strokeStyle = '#24464f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + dx * 0.5, 0);
    ctx.quadraticCurveTo(x + dx + sway, GROUND * 0.55, x + dx * 1.3, GROUND + 4);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${COLORS[i % 3]},0.7)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    // drops of light sliding down
    const k = (time * 0.4 + i * 0.37) % 1, s = k;
    const px = x + dx * 0.5 + (dx * 1.3 - dx * 0.5) * s + sway * Math.sin(s * Math.PI), py = s * (GROUND + 4);
    glow(ctx, px, py, 12, 16, COLORS[i % 3], 0.9);
  }
  ctx.restore();
}

// A great glowing mushroom on a stalk; its cap is the platform
function drawGlowcap(ctx, p, time) {
  const cx = p.x + p.w / 2, top = p.y, r = p.w / 2;
  const c = COLORS[Math.floor(p.x / 500) % 3], pulse = 0.75 + 0.25 * Math.sin(time * 1.5 + p.x * 0.01);
  glow(ctx, cx, top + 10, r * 1.6, 90, c, 0.4 * pulse);
  ctx.fillStyle = '#cfe8e0';
  ctx.beginPath();
  ctx.moveTo(cx - 12, top + 10);
  ctx.quadraticCurveTo(cx - 20, (top + GROUND) / 2, cx - 17, GROUND + 2);
  ctx.lineTo(cx + 17, GROUND + 2);
  ctx.quadraticCurveTo(cx + 20, (top + GROUND) / 2, cx + 12, top + 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(${c},0.55)`;
  ellipse(ctx, cx, top + 12, r * 0.9, 9);
  ctx.fillStyle = `rgba(${c},0.92)`;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(p.x - 4, top + 10);
  ctx.quadraticCurveTo(p.x - 2, top - 26, cx, top - 30);
  ctx.quadraticCurveTo(p.x + p.w + 2, top - 26, p.x + p.w + 4, top + 10);
  ctx.quadraticCurveTo(cx, top + 4, p.x - 4, top + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(255,255,255,${0.6 * pulse})`;
  for (const [fx, fy, s] of [[-0.5, -0.1, 7], [-0.1, -0.65, 9], [0.35, -0.3, 6]]) ellipse(ctx, cx + fx * r, top + fy * 28, s * (r / 90), s * 0.7 * (r / 90));
}

function drawRootBridge(ctx, p, time) {
  const { x, y, w } = p;
  ctx.strokeStyle = '#1e3440';
  ctx.lineCap = 'round';
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(x - 30, GROUND + 6);
  ctx.quadraticCurveTo(x - 10, y + 10, x + 10, y + 8);
  ctx.lineTo(x + w - 10, y + 8);
  ctx.quadraticCurveTo(x + w + 10, y + 10, x + w + 30, GROUND + 6);
  ctx.stroke();
  ctx.strokeStyle = '#2e4c56';
  ctx.lineWidth = 12;
  ctx.stroke();
  ctx.strokeStyle = `rgba(170,255,225,${0.6 + 0.25 * Math.sin(time * 2.4 + x)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let k = 0; k <= w; k += 4) ctx.lineTo(x + k, y + 8 + Math.sin(k * 0.12) * 6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(170,255,225,0.5)';
  for (let k = 12; k < w - 8; k += 22) ellipse(ctx, x + k, y + 1, 8, 3);
}

function drawFloor(ctx, L, R, time) {
  ctx.fillStyle = '#16303e';
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = '#21434f';
  ctx.fillRect(L, GROUND, R - L, 9);
  ctx.fillStyle = 'rgba(170,255,225,0.35)'; // glowing moss
  for (let x = L - (L % 30); x < R; x += 30) ellipse(ctx, x + 10, GROUND + 1, 13, 3.5);
  for (const m of glowcaps) {
    if (m.x < L - 20 || m.x > R + 20) continue;
    const s = m.s;
    glow(ctx, m.x, GROUND - m.h, 18 * s, 14 * s, m.c, 0.5 + 0.2 * Math.sin(time * 2 + m.p));
    ctx.fillStyle = '#d8eee8';
    ctx.fillRect(m.x - 1.5 * s, GROUND - m.h, 3 * s, m.h + 2);
    ctx.fillStyle = `rgba(${m.c},0.95)`;
    ctx.beginPath();
    ctx.ellipse(m.x, GROUND - m.h, 7 * s, 5 * s, 0, Math.PI, 0);
    ctx.fill();
  }
}

// Hard pocket signs: dark boards with a red trim
function drawZoneSign(ctx, x, z, i, time) {
  ctx.fillStyle = '#4a3a30';
  ctx.beginPath();
  ctx.roundRect(x - 4, GROUND - 92, 8, 94, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 70);
  ctx.rotate(Math.sin(time * 1.1 + i) * 0.02);
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 28);
  ctx.fillStyle = '#2e4c58';
  ctx.strokeStyle = '#e0526e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -24, tw, 46, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -9, 15, '#eafff8');
  ctx.fillStyle = '#e0526e';
  ctx.beginPath();
  ctx.roundRect(-34, 2, 68, 15, 7.5);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 10, 11, '#ffffff');
  ctx.restore();
}

function drawExitSign(ctx, x, time) {
  ctx.fillStyle = '#4a3a30';
  ctx.fillRect(x - 3, GROUND - 92, 6, 92);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.2) * 0.02);
  ctx.fillStyle = '#e2bf8f';
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(56, -12);
  ctx.lineTo(-50, -12);
  ctx.lineTo(-62, 0);
  ctx.lineTo(-50, 12);
  ctx.lineTo(56, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Up to the Deep', -2, 1, 11, '#5b4a6b');
  ctx.restore();
}

function drawMotes(ctx, camX, time) {
  for (const m of motes) {
    const x = camX + ((m.x - camX * 0.25 + Math.sin(time * 0.4 + m.p) * 30) % W + W) % W;
    const y = m.y - ((time * m.v) % 380);
    const yy = y < 50 ? y + 380 : y;
    ctx.fillStyle = `rgba(${m.c},${0.45 + 0.35 * Math.sin(time * 2.2 + m.p)})`;
    circle(ctx, x, yy, m.s);
  }
}
