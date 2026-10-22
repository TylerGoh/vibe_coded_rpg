// Docs: docs/places/thornheart.md
// The Thornheart (room THORNHEART, data in src/shared/rpg.js): a hard pocket through the cut in the wall of
// thorns at Bramble Woods' east end, down into the root of the briar that covers the east of the Wildwood.
// West to east: the Briar Gate (the tunnel you crawled in by; no mobs), the Bramble Maze, and the Thornheart
// itself, where every cane on the island grows out of one great root knot wrapped round the Hedge Stone (a
// Keeper stone: src/ruins.js) and the Thorn Hart roams. Under a roof of woven canes, with daylight only
// through the gaps: plum and moss-green, pale thorns, white roses only near the heart. Platforms: fallen
// logs, woven briar arches, raised roots, and the White Rose arch (the hidden spot).
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { THORN_W, THORN_EXIT_X, THORN_ZONES, THORN_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { glow as softGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const HEART_X = THORN_W - 300; // the root knot (the Hedge Stone stands in front of it)

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function thorn(ctx, x, y, a, len, base) {
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(a + Math.PI / 2) * base, y + Math.sin(a + Math.PI / 2) * base);
  ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
  ctx.lineTo(x + Math.cos(a - Math.PI / 2) * base, y + Math.sin(a - Math.PI / 2) * base);
  ctx.closePath();
  ctx.fill();
}

// ——— seeded scenery ———
// back canes: big arches in two parallax layers, behind everything
const backCanes = [0.35, 0.6].map((f, j) => {
  const r = mulberry32(3301 + j);
  return { f, arcs: Array.from({ length: 9 }, (_, i) => ({ x: i * 230 + r() * 80, w: 200 + r() * 200, h: 200 + r() * 140 - j * 40, lw: 10 + r() * 8 + j * 4 })) };
});
// the roof: canes arching right over the path, gaps of daylight between them
const roofArcs = (() => {
  const r = mulberry32(3311);
  const out = [];
  for (let x = -100; x < THORN_W + 100; x += 90 + r() * 120) out.push({ x, w: 220 + r() * 260, y: 30 + r() * 50, lw: 7 + r() * 7, dark: r() < 0.5 });
  return out;
})();
const gaps = (() => {
  const r = mulberry32(3321);
  const out = [];
  for (let x = 200; x < THORN_W - 400; x += 260 + r() * 380) out.push({ x, w: 30 + r() * 40 });
  return out;
})();
const tufts = (() => {
  const r = mulberry32(3331);
  const out = [];
  for (let x = 20; x < THORN_W; x += 26 + r() * 50) out.push({ x, h: 6 + r() * 14, k: r() });
  return out;
})();
const petals = (() => {
  const r = mulberry32(3341);
  return Array.from({ length: 26 }, () => ({ x: r() * W, y: r() * 400, v: 10 + r() * 14, p: r() * TAU, s: 1.6 + r() * 1.4 }));
})();

// Everything behind the slimes. camX is the left edge of the view.
export function drawThornheart(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawBack(ctx, camX, time);
  ctx.restore();
  const L = camX - 80, R = camX + viewW + 80;
  const l = Math.max(0, L), r = Math.min(THORN_W, R);
  for (const g of gaps) if (visible(g.x - 150, g.x + 150, L, R)) drawSunbeam(ctx, g, time);
  if (visible(HEART_X - 700, THORN_W + 40, L, R)) drawKnot(ctx, time);
  if (visible(-60, 360, L, R)) drawTunnel(ctx, time);
  drawRoof(ctx, l, r, time);
  for (const p of THORN_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'log') drawLog(ctx, p);
    else if (p.kind === 'root') drawRootStep(ctx, p);
    else drawArch(ctx, p, time, p.kind === 'rose');
  }
  drawFloor(ctx, l, r, time);
  THORN_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x0 + 70;
    if (visible(sx - 80, sx + 80, L, R)) drawZoneSign(ctx, sx, z, i, time);
  });
  if (visible(THORN_EXIT_X - 60, THORN_EXIT_X + 150, L, R)) drawExitSign(ctx, THORN_EXIT_X + 90, time);
  drawPetals(ctx, camX, time);
}

function drawBack(ctx, camX, time) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#2a1e2e');
  g.addColorStop(1, '#3e3448');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // a pale green-gold haze deeper in, warmer near the heart
  const k = Math.max(0, Math.min(1, (camX - 1800) / 1800));
  glow(ctx, W * 0.6, 220, 560, 300, '200,220,170', 0.12 + 0.18 * k + 0.03 * Math.sin(time * 0.6));
  backCanes.forEach(({ f, arcs }, j) => {
    ctx.strokeStyle = j ? '#4a3448' : '#3a2a3c';
    ctx.lineCap = 'round';
    const span = 230 * 9, off = -((camX * f) % span);
    for (const rep of [0, span]) {
      for (const a of arcs) {
        const x = off + rep + a.x;
        if (x + a.w < -40 || x > W + 40) continue;
        ctx.lineWidth = a.lw;
        ctx.beginPath();
        ctx.moveTo(x, GROUND + 4);
        ctx.quadraticCurveTo(x + a.w * 0.2, GROUND - a.h, x + a.w * 0.6, GROUND - a.h * 0.9);
        ctx.quadraticCurveTo(x + a.w * 0.95, GROUND - a.h * 0.8, x + a.w, GROUND + 4);
        ctx.stroke();
      }
    }
  });
}

// A beam of daylight through a gap in the roof of canes
function drawSunbeam(ctx, g, time) {
  ctx.save();
  ctx.globalAlpha = 0.13 + 0.04 * Math.sin(time * 0.6 + g.x);
  ctx.fillStyle = '#fff4d0';
  ctx.beginPath();
  ctx.moveTo(g.x - g.w / 2, 40);
  ctx.lineTo(g.x + g.w / 2, 40);
  ctx.lineTo(g.x + g.w * 1.6 + 30, GROUND);
  ctx.lineTo(g.x - g.w * 0.6 + 30, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  glow(ctx, g.x + 30 + g.w * 0.5, GROUND, g.w * 1.8, 16, '255,244,208', 0.4);
}

// The heart: a great knot of roots rising from the floor at the east end, every cane in the room growing out
// of it and arching away west overhead. The Hedge Stone (src/ruins.js) stands in front of it.
function drawKnot(ctx, time) {
  const x = HEART_X, top = 140;
  glow(ctx, x, GROUND - 160, 360, 260, '235,250,225', 0.22 + 0.05 * Math.sin(time * 0.8));
  ctx.lineCap = 'round';
  // canes leaving the knot for the roof
  for (let i = 0; i < 7; i++) {
    ctx.strokeStyle = i % 2 ? '#5e3a50' : '#4e3044';
    ctx.lineWidth = 14 - i;
    ctx.beginPath();
    ctx.moveTo(x - 20 + i * 8, top + 40);
    ctx.quadraticCurveTo(x - 200 - i * 60, -40 + i * 12, x - 500 - i * 90, 40 + i * 10);
    ctx.stroke();
  }
  // the knot itself: twisted loops of root
  for (let j = 0; j < 9; j++) {
    const rx = 110 + (j % 3) * 30, ry = 120 + ((j + 1) % 3) * 24, rot = j * 0.6;
    ctx.strokeStyle = j % 2 ? '#5e3a50' : '#4a2c42';
    ctx.lineWidth = 22 - (j % 3) * 5;
    ctx.beginPath();
    ctx.ellipse(x, GROUND - 130, rx, ry, rot, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(160,110,140,0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  // thorns all over it, roses here and there, green velvet scraped bare where the Hart rubs
  ctx.fillStyle = '#e9c6d4';
  const r = mulberry32(3351);
  for (let i = 0; i < 40; i++) {
    const a = r() * TAU, d = 90 + r() * 70;
    thorn(ctx, x + Math.cos(a) * d, GROUND - 130 + Math.sin(a) * d, a, 9, 2.6);
  }
  for (let i = 0; i < 9; i++) {
    const a = r() * TAU, d = 80 + r() * 80, rx = x + Math.cos(a) * d, ry = GROUND - 130 + Math.sin(a) * d * 0.9;
    const n = Math.sin(time * 1.1 + i) * 1.2;
    ctx.fillStyle = '#fbf6f4';
    for (let k = 0; k < 5; k++) circle(ctx, rx + n + Math.cos((k / 5) * TAU) * 3, ry + Math.sin((k / 5) * TAU) * 3, 3.2);
    ctx.fillStyle = '#f4d060';
    circle(ctx, rx + n, ry, 1.8);
  }
}

// The Briar Gate: the tunnel you crawled in by, at the west end, bright with Bramble Woods' daylight
function drawTunnel(ctx, time) {
  const x = THORN_EXIT_X - 70;
  glow(ctx, x + 40, GROUND - 60, 170, 130, '240,250,215', 0.5);
  ctx.fillStyle = '#e8f0d0';
  ctx.beginPath();
  ctx.moveTo(x - 10, GROUND);
  ctx.quadraticCurveTo(x, GROUND - 130, x + 60, GROUND - 130);
  ctx.quadraticCurveTo(x + 120, GROUND - 120, x + 128, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#9aca78'; // Bramble Woods' grass out there
  ctx.fillRect(x - 6, GROUND - 16, 130, 16);
  ctx.strokeStyle = '#5e3a50';
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    ctx.lineWidth = 10 - i;
    ctx.beginPath();
    ctx.moveTo(x - 14 + i * 3, GROUND + 4);
    ctx.quadraticCurveTo(x - 4 + i * 6, GROUND - 150 - i * 6, x + 64, GROUND - 140 - i * 5);
    ctx.quadraticCurveTo(x + 130 - i * 4, GROUND - 130 - i * 4, x + 134 - i * 3, GROUND + 4);
    ctx.stroke();
  }
  // the cut stems, pale at the ends
  ctx.fillStyle = '#d8c0a0';
  for (const [dx, dy] of [[-8, -60], [0, -110], [126, -70], [118, -112]]) circle(ctx, x + dx, GROUND + dy, 3);
}

// The roof of canes across the top of the screen
function drawRoof(ctx, L, R, time) {
  ctx.fillStyle = '#1e1420';
  ctx.beginPath();
  ctx.moveTo(L - 20, 0);
  for (let x = L - (L % 40) - 40; x <= R + 40; x += 40) ctx.lineTo(x, 34 + Math.sin(x * 0.017) * 10 + Math.sin(x * 0.043) * 6);
  ctx.lineTo(R + 20, 0);
  ctx.closePath();
  ctx.fill();
  ctx.lineCap = 'round';
  for (const a of roofArcs) {
    if (a.x + a.w < L - 40 || a.x > R + 40) continue;
    ctx.strokeStyle = a.dark ? '#4a2c42' : '#5e3a50';
    ctx.lineWidth = a.lw;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - 30);
    ctx.quadraticCurveTo(a.x + a.w / 2, a.y + 60, a.x + a.w, a.y - 30);
    ctx.stroke();
    ctx.fillStyle = '#d8b0c4';
    for (let k = 0.2; k < 0.85; k += 0.2) {
      const t = k, px = a.x + a.w * t, py = (1 - t) * (1 - t) * (a.y - 30) + 2 * (1 - t) * t * (a.y + 60) + t * t * (a.y - 30);
      thorn(ctx, px, py, Math.PI / 2 + (k > 0.5 ? -0.4 : 0.4), 8, 2.4);
    }
  }
  // a few leaves hanging down off the roof, swaying
  ctx.fillStyle = '#5e8a4a';
  for (let x = L - (L % 120); x < R; x += 120) {
    const sw = Math.sin(time * 1.3 + x) * 3;
    ellipse(ctx, x + 30 + sw, 70 + (x % 7) * 4, 5, 9, 0.3);
  }
}

// A fallen log, mossy, a platform
function drawLog(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#4a3a30';
  for (const k of [0.15, 0.85]) {
    ctx.beginPath();
    ctx.roundRect(x + w * k - 10, y + 10, 20, GROUND - y - 8, 4);
    ctx.fill();
  }
  ctx.fillStyle = '#7a5a44';
  ctx.strokeStyle = '#3e2a1e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 2, w + 12, 24, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c8a07a';
  ellipse(ctx, x + w + 2, y + 10, 7, 11);
  ctx.strokeStyle = 'rgba(62,42,30,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x + w + 2, y + 10, 3.5, 6, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#6a9a4e';
  for (let k = 6; k < w; k += 18) ellipse(ctx, x + k, y + 1, 9, 4);
}

// A raised root of the knot, arching up off the floor (a platform)
function drawRootStep(ctx, p) {
  const { x, y, w } = p;
  ctx.strokeStyle = '#4a2c42';
  ctx.lineCap = 'round';
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(x - 30, GROUND + 6);
  ctx.quadraticCurveTo(x - 10, y + 12, x + 12, y + 10);
  ctx.lineTo(x + w - 12, y + 10);
  ctx.quadraticCurveTo(x + w + 10, y + 12, x + w + 30, GROUND + 6);
  ctx.stroke();
  ctx.strokeStyle = '#5e3a50';
  ctx.lineWidth = 14;
  ctx.stroke();
  ctx.fillStyle = '#e9c6d4';
  for (let k = 20; k < w - 10; k += 30) thorn(ctx, x + k, y + 2, -Math.PI / 2 + ((k / 30) % 2 ? 0.3 : -0.3), 8, 2.4);
}

// A woven arch of briar canes; its top is a platform. The White Rose (rose): the one up high with a single
// big white rose blooming on it, glowing softly.
function drawArch(ctx, p, time, rose) {
  const { x, y, w } = p;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = i === 1 ? '#7a4c62' : '#5e3a50';
    ctx.lineWidth = 8 - i * 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 24 + i * 6, GROUND + 4);
    ctx.quadraticCurveTo(x - 10, y + 2 + i * 3, x + w / 2, y + 4 + i * 3);
    ctx.quadraticCurveTo(x + w + 10, y + 2 + i * 3, x + w + 24 - i * 6, GROUND + 4);
    ctx.stroke();
  }
  // the woven top you stand on
  ctx.fillStyle = '#6a4258';
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 2, w + 8, 12, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,160,180,0.5)';
  ctx.lineWidth = 1.4;
  for (let k = 8; k < w; k += 14) {
    ctx.beginPath();
    ctx.moveTo(x + k, y - 1);
    ctx.lineTo(x + k + 8, y + 9);
    ctx.stroke();
  }
  ctx.fillStyle = '#e9c6d4';
  for (let k = 14; k < w; k += 28) thorn(ctx, x + k, y + 10, Math.PI / 2, 7, 2.2);
  if (rose) {
    const cx = x + w / 2, cy = y - 16, n = Math.sin(time * 1.2) * 1.5;
    glow(ctx, cx, cy, 60, 50, '255,250,235', 0.5 + 0.1 * Math.sin(time * 1.6));
    ctx.strokeStyle = '#4e7a3e';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - 6, y);
    ctx.quadraticCurveTo(cx - 8, cy + 8, cx + n, cy);
    ctx.stroke();
    ctx.fillStyle = '#6a9a4e';
    ellipse(ctx, cx - 10, y - 6, 6, 3, -0.5);
    ctx.fillStyle = '#fbf6f4';
    ctx.strokeStyle = 'rgba(200,170,180,0.8)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(cx + n + Math.cos(a) * 5, cy + Math.sin(a) * 5, 6.5, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#f4d060';
    circle(ctx, cx + n, cy, 3);
  }
}

function drawFloor(ctx, L, R, time) {
  ctx.fillStyle = '#3a2c30';
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = '#4e3c3a';
  ctx.fillRect(L, GROUND, R - L, 8);
  for (const t of tufts) {
    if (t.x < L - 20 || t.x > R + 20) continue;
    if (t.k < 0.55) {
      ctx.fillStyle = '#5e8a4a';
      ctx.beginPath();
      ctx.moveTo(t.x - 5, GROUND + 2);
      ctx.lineTo(t.x - 1, GROUND - t.h);
      ctx.lineTo(t.x + 2, GROUND + 2);
      ctx.lineTo(t.x + 5, GROUND - t.h * 0.7);
      ctx.lineTo(t.x + 8, GROUND + 2);
      ctx.closePath();
      ctx.fill();
    } else if (t.k < 0.8) {
      // a thorny runner along the ground
      ctx.strokeStyle = '#5e3a50';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(t.x - 16, GROUND + 3);
      ctx.quadraticCurveTo(t.x, GROUND - 6, t.x + 16, GROUND + 3);
      ctx.stroke();
      ctx.fillStyle = '#e9c6d4';
      thorn(ctx, t.x - 4, GROUND - 2, -Math.PI / 2 - 0.3, 6, 1.8);
      thorn(ctx, t.x + 6, GROUND - 2, -Math.PI / 2 + 0.3, 6, 1.8);
    } else {
      ctx.fillStyle = 'rgba(251,246,244,0.8)'; // fallen petals
      ellipse(ctx, t.x, GROUND + 3, 3, 1.6, 0.4);
      ellipse(ctx, t.x + 6, GROUND + 4, 2.6, 1.4, -0.3);
    }
  }
}

// Hard pocket signs: dark boards with a red trim (like Glowroot Hollow's)
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
  ctx.fillStyle = '#3e2c40';
  ctx.strokeStyle = '#e0526e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -24, tw, 46, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -9, 15, '#fbeef4');
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
  text(ctx, 'Out to the woods', -2, 1, 11, '#5b4a6b');
  ctx.restore();
}

// Petals and seeds drifting down through the beams of light
function drawPetals(ctx, camX, time) {
  for (const m of petals) {
    const x = camX + ((m.x - camX * 0.2 + Math.sin(time * 0.7 + m.p) * 26) % W + W) % W;
    const y = 50 + ((m.y + time * m.v) % 400);
    ctx.fillStyle = `rgba(251,240,246,${0.45 + 0.25 * Math.sin(time * 2 + m.p)})`;
    ellipse(ctx, x, y, m.s, m.s * 0.6, time + m.p);
  }
}
