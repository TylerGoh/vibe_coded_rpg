// Docs: docs/places/sunkenroad.md
// The Sunken Road (room SUNKEN, data in src/shared/rpg.js): the old Keeper road under the briar, down through
// the split in the Thornheart's root knot. Dark: no daylight at all, only the glowing seed pods that hang from
// the briar roof. The road's paving stones are lifted and tilted by roots, and an old root runs along its edge
// the whole way (the quiet hint: it runs back west, under the island). West to east: the Root Stair (the way
// down; no mobs), the Old Road, the Lantern Reach and the Neck's Hollow, where the road climbs up and out east
// into the Road's End (a pale light up the slope). Platforms: heaved-up slabs, root arches, and the Milestone
// (the hidden spot), a Keeper milestone the roots lifted high.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { SUNKEN_W, SUNKEN_EXIT_X, SUNKEN_END_X, SUNKEN_ZONES, SUNKEN_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { glow as softGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function thorn(ctx, x, y, a, len, base, fill = '#9a8a94') {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(a + Math.PI / 2) * base, y + Math.sin(a + Math.PI / 2) * base);
  ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
  ctx.lineTo(x + Math.cos(a - Math.PI / 2) * base, y + Math.sin(a - Math.PI / 2) * base);
  ctx.closePath();
  ctx.fill();
}

// ——— seeded scenery ———
const backRoots = [0.3, 0.55].map((f, j) => {
  const r = mulberry32(4701 + j);
  return { f, arcs: Array.from({ length: 8 }, (_, i) => ({ x: i * 260 + r() * 90, w: 220 + r() * 220, h: 260 + r() * 120 - j * 50, lw: 16 + r() * 10 + j * 6 })) };
});
const farPods = (() => {
  const r = mulberry32(4711);
  return Array.from({ length: 22 }, () => ({ x: r() * 1800, y: 90 + r() * 240, s: 1 + r() * 2, p: r() * TAU }));
})();
const roofArcs = (() => {
  const r = mulberry32(4721);
  const out = [];
  for (let x = -100; x < SUNKEN_W + 100; x += 70 + r() * 90) out.push({ x, w: 200 + r() * 240, y: 40 + r() * 40, lw: 9 + r() * 9, dark: r() < 0.6 });
  return out;
})();
// seed pods hanging off the roof: the only light down here
const pods = (() => {
  const r = mulberry32(4731);
  const out = [];
  for (let x = 380; x < SUNKEN_W - 300; x += 280 + r() * 260) out.push({ x, len: 40 + r() * 70, s: 0.8 + r() * 0.5, p: r() * TAU });
  return out;
})();
const hangRoots = (() => {
  const r = mulberry32(4741);
  const out = [];
  for (let x = 0; x < SUNKEN_W; x += 60 + r() * 90) out.push({ x, len: 30 + r() * 80, p: r() * TAU });
  return out;
})();
// the paving: one flagstone after another, some tipped up by roots
const flags = (() => {
  const r = mulberry32(4751);
  const out = [];
  for (let x = 0; x < SUNKEN_W; ) {
    const w = 46 + r() * 30;
    out.push({ x, w, tilt: r() < 0.18 ? (r() - 0.5) * 0.3 : 0, lift: r() < 0.18 ? 2 + r() * 4 : 0, moss: r() < 0.35, root: r() < 0.12 });
    x += w + 3;
  }
  return out;
})();
const motes = (() => {
  const r = mulberry32(4761);
  return Array.from({ length: 22 }, () => ({ x: r() * W, y: r() * 400, v: 4 + r() * 6, p: r() * TAU, s: 1 + r() * 1.2 }));
})();

// Everything behind the slimes. camX is the left edge of the view.
export function drawSunkenRoad(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawBack(ctx, camX, time);
  ctx.restore();
  const L = camX - 80, R = camX + viewW + 80;
  const l = Math.max(0, L), r = Math.min(SUNKEN_W, R);
  if (visible(-60, 420, L, R)) drawRootStair(ctx, time);
  if (visible(SUNKEN_END_X - 420, SUNKEN_W + 60, L, R)) drawClimb(ctx, time);
  drawRoof(ctx, l, r, time);
  for (const p of pods) if (visible(p.x - 160, p.x + 160, L, R)) drawPod(ctx, p, time);
  for (const p of SUNKEN_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'slab') drawSlab(ctx, p);
    else if (p.kind === 'root') drawRootArch(ctx, p);
    else drawMilestone(ctx, p, time);
  }
  drawFloor(ctx, l, r, time);
  SUNKEN_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x0 + 70;
    if (visible(sx - 80, sx + 80, L, R)) drawZoneSign(ctx, sx, z, i, time);
  });
  if (visible(SUNKEN_EXIT_X - 60, SUNKEN_EXIT_X + 150, L, R)) drawArrowSign(ctx, SUNKEN_EXIT_X + 92, 'Up to the Thornheart', -1, time);
  if (visible(SUNKEN_END_X - 200, SUNKEN_END_X, L, R)) drawArrowSign(ctx, SUNKEN_END_X - 110, "The Road's End", 1, time);
  drawMotes(ctx, camX, time);
}

function drawBack(ctx, camX, time) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#120e14');
  g.addColorStop(1, '#22202a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // a faint green haze from the pods, fading deeper in
  const k = Math.max(0, Math.min(1, camX / (SUNKEN_W - W)));
  glow(ctx, W * 0.5, 260, 600, 260, '150,200,130', 0.12 - 0.05 * k + 0.02 * Math.sin(time * 0.5));
  // far pods glimmering deep in the briar
  for (const m of farPods) {
    const x = ((m.x - camX * 0.18) % 1800 + 1800) % 1800 - 200;
    if (x < -20 || x > W + 20) continue;
    const a = 0.25 + 0.2 * Math.sin(time * 1.3 + m.p);
    glow(ctx, x, m.y, 10 * m.s, 10 * m.s, '190,255,150', a);
  }
  backRoots.forEach(({ f, arcs }, j) => {
    ctx.strokeStyle = j ? '#2a2630' : '#201c26';
    ctx.lineCap = 'round';
    const span = 260 * 8, off = -((camX * f) % span);
    for (const rep of [0, span]) {
      for (const a of arcs) {
        const x = off + rep + a.x;
        if (x + a.w < -40 || x > W + 40) continue;
        ctx.lineWidth = a.lw;
        ctx.beginPath();
        ctx.moveTo(x, GROUND + 4);
        ctx.quadraticCurveTo(x + a.w * 0.15, GROUND - a.h, x + a.w * 0.55, GROUND - a.h * 0.95);
        ctx.quadraticCurveTo(x + a.w * 0.95, GROUND - a.h * 0.85, x + a.w, GROUND + 4);
        ctx.stroke();
      }
    }
  });
}

// The Root Stair at the west end: roots coming down from the split above, a grey glimmer of the Thornheart's
// light falling between them
function drawRootStair(ctx, time) {
  const x = SUNKEN_EXIT_X;
  ctx.save();
  ctx.globalAlpha = 0.16 + 0.03 * Math.sin(time * 0.7);
  ctx.fillStyle = '#e8f0d8';
  ctx.beginPath();
  ctx.moveTo(x - 20, 0);
  ctx.lineTo(x + 60, 0);
  ctx.lineTo(x + 120, GROUND);
  ctx.lineTo(x - 50, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  glow(ctx, x + 30, GROUND - 8, 120, 18, '232,240,216', 0.35);
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = i % 2 ? '#3a2c34' : '#2e2228';
    ctx.lineWidth = 16 - i * 1.6;
    const bx = x - 50 + i * 30;
    ctx.beginPath();
    ctx.moveTo(bx + 20, -10);
    ctx.bezierCurveTo(bx - 20, 140, bx + 40, 260, bx + (i % 2 ? 50 : -10), GROUND + 6);
    ctx.stroke();
  }
  // steps cut in the roots
  ctx.fillStyle = '#4a3c3a';
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.roundRect(x - 30 + k * 10, GROUND - 30 - k * 34, 46, 7, 3);
    ctx.fill();
  }
}

// The east end: the road's paving climbing up and out toward a pale light (the Road's End)
function drawClimb(ctx, time) {
  const x0 = SUNKEN_END_X - 300, x1 = SUNKEN_W + 40;
  glow(ctx, SUNKEN_END_X + 40, GROUND - 120, 240, 200, '245,248,240', 0.32 + 0.04 * Math.sin(time * 0.6));
  ctx.fillStyle = '#2e2a30';
  ctx.beginPath();
  ctx.moveTo(x0, GROUND);
  ctx.quadraticCurveTo(x0 + 220, GROUND - 10, x1, GROUND - 150);
  ctx.lineTo(x1, GROUND);
  ctx.closePath();
  ctx.fill();
  // flagstones up the slope
  for (let k = 0; k < 7; k++) {
    const f = k / 7, x = x0 + 80 + f * (x1 - x0 - 80), y = GROUND - 6 - f * f * 140;
    ctx.fillStyle = k % 2 ? '#5e5a58' : '#6e6a66';
    ctx.beginPath();
    ctx.roundRect(x, y - 6, 40, 9, 4);
    ctx.fill();
  }
  // a few white petals on the slope: roses up there
  ctx.fillStyle = 'rgba(251,246,244,0.75)';
  for (let k = 0; k < 6; k++) ellipse(ctx, x0 + 160 + k * 46, GROUND - 4 - k * k * 3.5, 2.6, 1.4, k);
}

// The roof: briar woven tight, black canes and hanging roots, no gaps at all
function drawRoof(ctx, L, R, time) {
  ctx.fillStyle = '#0c0a0e';
  ctx.beginPath();
  ctx.moveTo(L - 20, 0);
  for (let x = L - (L % 40) - 40; x <= R + 40; x += 40) ctx.lineTo(x, 46 + Math.sin(x * 0.013) * 12 + Math.sin(x * 0.041) * 6);
  ctx.lineTo(R + 20, 0);
  ctx.closePath();
  ctx.fill();
  ctx.lineCap = 'round';
  for (const a of roofArcs) {
    if (a.x + a.w < L - 40 || a.x > R + 40) continue;
    ctx.strokeStyle = a.dark ? '#1e1a1e' : '#2e2830';
    ctx.lineWidth = a.lw;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - 30);
    ctx.quadraticCurveTo(a.x + a.w / 2, a.y + 50, a.x + a.w, a.y - 30);
    ctx.stroke();
    for (let k = 0.2; k < 0.85; k += 0.22) {
      const px = a.x + a.w * k, py = (1 - k) * (1 - k) * (a.y - 30) + 2 * (1 - k) * k * (a.y + 50) + k * k * (a.y - 30);
      thorn(ctx, px, py, Math.PI / 2 + (k > 0.5 ? -0.4 : 0.4), 8, 2.4, '#6a5e66');
    }
  }
  ctx.strokeStyle = '#3a2e2a';
  ctx.lineWidth = 2;
  for (const h of hangRoots) {
    if (h.x < L - 20 || h.x > R + 20) continue;
    const sw = Math.sin(time * 0.8 + h.p) * 3;
    ctx.beginPath();
    ctx.moveTo(h.x, 50);
    ctx.quadraticCurveTo(h.x + sw, 50 + h.len * 0.6, h.x + sw * 1.6, 50 + h.len);
    ctx.stroke();
  }
}

// A seed pod hanging from the roof on a cane, glowing green-gold: a pool of light on the road below
function drawPod(ctx, p, time) {
  const sw = Math.sin(time * 0.9 + p.p) * 4, y = 60 + p.len, x = p.x + sw;
  glow(ctx, p.x, GROUND, 140 * p.s, 22, '190,255,150', 0.22);
  glow(ctx, x, y, 70 * p.s, 70 * p.s, '190,255,150', 0.3 + 0.08 * Math.sin(time * 1.7 + p.p));
  ctx.strokeStyle = '#2a3424';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(p.x, 44);
  ctx.quadraticCurveTo(p.x + sw * 0.5, 50 + p.len * 0.5, x, y - 12 * p.s);
  ctx.stroke();
  ctx.fillStyle = 'rgba(180,230,140,0.75)';
  ctx.strokeStyle = '#3e5a30';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(x, y, 9 * p.s, 13 * p.s, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f4ffe0';
  for (let i = 0; i < 3; i++) circle(ctx, x + Math.cos(i * 2.1 + time) * 3 * p.s, y + Math.sin(i * 1.7 + time) * 5 * p.s, 1.6 * p.s);
}

// A paving stone the roots heaved up and laid flat on a knuckle of root: its top is the platform
function drawSlab(ctx, p) {
  const { x, y, w } = p;
  ctx.strokeStyle = '#2e2228';
  ctx.lineCap = 'round';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, GROUND + 6);
  ctx.quadraticCurveTo(x + w * 0.3, y + 30, x + w * 0.55, y + 16);
  ctx.quadraticCurveTo(x + w * 0.75, y + 30, x + w * 0.85, GROUND + 6);
  ctx.stroke();
  ctx.strokeStyle = '#3e3038';
  ctx.lineWidth = 11;
  ctx.stroke();
  const g = ctx.createLinearGradient(0, y - 4, 0, y + 18);
  g.addColorStop(0, '#7e7a74');
  g.addColorStop(1, '#4e4a48');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2a2624';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 3, w + 8, 20, 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(30,26,24,0.5)';
  ctx.lineWidth = 1.4;
  for (let k = w / 3; k < w; k += w / 3) {
    ctx.beginPath();
    ctx.moveTo(x + k, y - 2);
    ctx.lineTo(x + k - 4, y + 16);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(110,150,80,0.6)';
  for (let k = 10; k < w; k += 34) ellipse(ctx, x + k, y - 1, 8, 3);
}

// A great root arching up off the floor (a platform), thorned
function drawRootArch(ctx, p) {
  const { x, y, w } = p;
  ctx.strokeStyle = '#2a1e24';
  ctx.lineCap = 'round';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(x - 34, GROUND + 6);
  ctx.quadraticCurveTo(x - 10, y + 12, x + 12, y + 10);
  ctx.lineTo(x + w - 12, y + 10);
  ctx.quadraticCurveTo(x + w + 10, y + 12, x + w + 34, GROUND + 6);
  ctx.stroke();
  ctx.strokeStyle = '#3e2c34';
  ctx.lineWidth = 15;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,96,104,0.35)';
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let k = 20; k < w - 10; k += 30) thorn(ctx, x + k, y + 3, -Math.PI / 2 + ((k / 30) % 2 ? 0.3 : -0.3), 8, 2.4);
}

// The Milestone (the hidden spot): a tall Keeper milestone the roots lifted off the road and hold up high. Its
// face is carved with a hand pointing west, back along the road, and a row of worn marks nobody can read
function drawMilestone(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  // the root that lifted it
  ctx.strokeStyle = '#2a1e24';
  ctx.lineCap = 'round';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(cx - 70, GROUND + 6);
  ctx.bezierCurveTo(cx - 60, GROUND - 120, cx + 20, y + 140, cx - 6, y + 92);
  ctx.stroke();
  ctx.strokeStyle = '#3e2c34';
  ctx.lineWidth = 12;
  ctx.stroke();
  // the stone, top flat (the platform)
  glow(ctx, cx, y + 40, 70, 60, '255,214,140', 0.12 + 0.04 * Math.sin(time * 1.2));
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, '#9a968e');
  g.addColorStop(1, '#66625e');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3a3634';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 8, y - 2, w - 16, 100, [10, 10, 4, 4]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#86827a';
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 10, 5);
  ctx.fill();
  ctx.stroke();
  // carvings: a hand pointing west, worn marks
  ctx.strokeStyle = 'rgba(50,44,40,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 16, y + 34);
  ctx.lineTo(cx - 14, y + 34);
  ctx.moveTo(cx - 6, y + 27);
  ctx.lineTo(cx - 16, y + 34);
  ctx.lineTo(cx - 6, y + 41);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.moveTo(cx - 14 + k * 9, y + 58);
    ctx.lineTo(cx - 10 + k * 9, y + 70);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,214,140,0.5)';
  circle(ctx, cx, y + 16, 3);
  ctx.fillStyle = 'rgba(110,150,80,0.7)';
  ellipse(ctx, x + 14, y - 3, 9, 3);
}

// The road itself: flagstones the whole way, some tipped up, moss in the joints, a root along its edge
function drawFloor(ctx, L, R, time) {
  ctx.fillStyle = '#1e1a1e';
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  for (const f of flags) {
    if (f.x + f.w < L - 20 || f.x > R + 20) continue;
    ctx.save();
    ctx.translate(f.x + f.w / 2, GROUND + 6 - f.lift);
    ctx.rotate(f.tilt);
    ctx.fillStyle = '#5a5654';
    ctx.strokeStyle = '#2a2624';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-f.w / 2, -6, f.w, 14, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(140,136,128,0.4)';
    ctx.beginPath();
    ctx.roundRect(-f.w / 2 + 3, -5, f.w - 6, 3, 2);
    ctx.fill();
    if (f.moss) {
      ctx.fillStyle = 'rgba(110,150,80,0.6)';
      ellipse(ctx, -f.w / 2 + 2, -4, 6, 2.4);
    }
    ctx.restore();
    if (f.root) {
      // a root pushing up through the joint
      ctx.strokeStyle = '#3e2c34';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(f.x - 10, GROUND + 10);
      ctx.quadraticCurveTo(f.x, GROUND - 10, f.x + 14, GROUND + 8);
      ctx.stroke();
      thorn(ctx, f.x + 2, GROUND - 4, -Math.PI / 2, 6, 1.8);
    }
  }
  // the old root along the road's edge, all the way
  ctx.strokeStyle = '#2e2228';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let x = L - (L % 60) - 60; x <= R + 60; x += 60) {
    const y = GROUND + 24 + Math.sin(x * 0.011) * 4;
    if (x === L - (L % 60) - 60) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// Hard pocket signs: dark boards with a red trim (like the Thornheart's)
function drawZoneSign(ctx, x, z, i, time) {
  ctx.fillStyle = '#3a2e2a';
  ctx.beginPath();
  ctx.roundRect(x - 4, GROUND - 92, 8, 94, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 70);
  ctx.rotate(Math.sin(time * 1.1 + i) * 0.02);
  ctx.font = `700 15px ${FONT}`;
  const tw = Math.max(130, ctx.measureText(z.name).width + 28);
  ctx.fillStyle = '#2e2632';
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

// a wooden arrow sign on a post (dir -1: points west)
function drawArrowSign(ctx, x, label, dir, time) {
  ctx.fillStyle = '#3a2e2a';
  ctx.fillRect(x - 3, GROUND - 92, 6, 92);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.2 + x) * 0.02);
  ctx.scale(dir, 1);
  ctx.fillStyle = '#c8a87e';
  ctx.strokeStyle = '#6e4e34';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-62, -12);
  ctx.lineTo(54, -12);
  ctx.lineTo(66, 0);
  ctx.lineTo(54, 12);
  ctx.lineTo(-62, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.scale(dir, 1);
  text(ctx, label, dir * 2, 1, 11, '#4a3b4c');
  ctx.restore();
}

// dust and spores hanging in the dark, drifting very slowly
function drawMotes(ctx, camX, time) {
  for (const m of motes) {
    const x = camX + ((m.x - camX * 0.15 + Math.sin(time * 0.4 + m.p) * 20) % W + W) % W;
    const y = 60 + ((m.y + time * m.v) % 380);
    ctx.fillStyle = `rgba(210,240,190,${0.25 + 0.2 * Math.sin(time * 1.6 + m.p)})`;
    circle(ctx, x, y, m.s);
  }
}
