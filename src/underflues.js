// Docs: docs/places/underflues.md
// The Under-Flues (room UNDERFLUES, a deep room on hard-pocket rules; data in src/shared/rpg.js): the brick flues and
// fire channels under the Old Foundry's furnaces, down the flue at the back of the big casting pit, where the stokers
// fed the fire from below. Soot-black brick vaults, fire channels running back into the wall, glowing seams in the
// brick that brighten and fade together (something breathing, far down), and it gets hotter and redder going east.
// West to east: the Flue Foot (no mobs: the stokers' shovels left standing in a coal heap, a coal barrow tipped over,
// a coat on a hook, a lamp), the Fire Channels, the Hot Seams and the Hound's Bed, where a great hollow is pressed
// into the soot and the way down to the Long Flue opens in the floor's far end. The Damper (last in
// UNDERFLUES_PLATFORMS), a great iron damper wheel high in a flue shaft with a stoker's tin mug hung on it, is the
// hidden spot. Emberdeep's register: brick, iron, soot, clinker; red only where something is still hot.
import { H, TAU, mulberry32, circle, ellipse } from './util.js';
import { UNDERFLUES_W, UNDERFLUES_EXIT_X, UNDERFLUES_END_X, UNDERFLUES_ZONES, UNDERFLUES_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const DAMPER = UNDERFLUES_PLATFORMS.at(-1);
const BRICK = '#4a2a24', BRICK_D = '#24120f', BRICK_L = '#6e3e32';
const IRON = '#5a5460', IRON_D = '#2e2a32', IRON_L = '#8a8490';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => radialGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
// how hot it is at x: 0 at the flue's foot, 1 at the way down
const heatAt = (x) => Math.max(0, Math.min(1, (x - 400) / (UNDERFLUES_W - 800)));
// the breathing far below: every seam in the brick brightens and fades with it
const BREATH_S = 6.5;
const breath = (time) => 0.5 - 0.5 * Math.cos((time / BREATH_S) * TAU);

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
const gradCache = new WeakMap();
function vgrad(ctx, key, y0, y1, stops) {
  let c = gradCache.get(ctx);
  if (!c) gradCache.set(ctx, (c = {}));
  if (!c[key]) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const [k, col] of stops) g.addColorStop(k, col);
    c[key] = g;
  }
  return c[key];
}

// ——— seeded scenery ———
const R0 = mulberry32(6301);
const VAULT = 520; // the brick vaults along the back wall, each with a fire channel running back into it
// glowing seams: cracks in the brick with the fire showing through, more of them going east
const seams = (() => {
  const out = [];
  for (let x = 560; x < UNDERFLUES_W - 120; x += 120 + R0() * 220) {
    if (R0() > 0.35 + 0.6 * heatAt(x)) continue;
    const pts = [[0, 0]];
    for (let i = 0; i < 4; i++) pts.push([pts[i][0] + (R0() - 0.5) * 30, pts[i][1] + 14 + R0() * 16]);
    out.push({ x, y: 150 + R0() * 200, pts, p: R0() * 2 });
  }
  return out;
})();
// shovels and fire-irons the stokers left leaning on the walls further in
const tools = (() => {
  const out = [];
  for (let x = 700; x < UNDERFLUES_W - 500; x += 500 + R0() * 500) {
    if (UNDERFLUES_PLATFORMS.some((p) => x > p.x - 30 && x < p.x + p.w + 30)) continue;
    out.push({ x, a: -0.18 - R0() * 0.2, kind: R0() < 0.6 ? 'shovel' : 'iron' });
  }
  return out;
})();
const flakes = Array.from({ length: 44 }, () => ({ x: R0() * UNDERFLUES_W, p: R0(), v: 0.02 + R0() * 0.04, d: R0() * TAU }));
const sparks = Array.from({ length: 30 }, () => ({ x: R0() * UNDERFLUES_W, p: R0(), v: 0.18 + R0() * 0.3 }));
const BED_X = UNDERFLUES_W - 560; // the hollow Orthrus has pressed into the soot

// Everything behind the slimes. camX is the left edge of the view.
export function drawUnderFlues(ctx, camX, viewW, time) {
  const L = camX - 160, R = camX + viewW + 160, b = breath(time);
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'back', 0, GROUND, [[0, '#060304'], [0.5, '#140807'], [1, '#26100c']]);
  ctx.fillRect(L, 0, R - L, H);
  drawVaults(ctx, L, R, time, b);
  for (const s of seams) if (visible(s.x - 40, s.x + 40, L, R)) drawSeam(ctx, s, b, time);
  if (visible(DAMPER.x - 140, DAMPER.x + DAMPER.w + 140, L, R)) drawDamper(ctx, DAMPER, time, b);
  for (const p of UNDERFLUES_PLATFORMS) {
    if (!visible(p.x - 40, p.x + p.w + 40, L, R)) continue;
    if (p.kind === 'ledge') drawLedge(ctx, p, b);
    else if (p.kind === 'catwalk') drawCatwalk(ctx, p);
  }
  drawRoof(ctx, L, R);
  for (const t of tools) if (visible(t.x - 40, t.x + 40, L, R)) drawTool(ctx, t);
  if (visible(-80, 700, L, R)) drawFlueFoot(ctx, time, b);
  if (visible(BED_X - 300, UNDERFLUES_W + 40, L, R)) drawBed(ctx, time, b);
  drawFloor(ctx, Math.max(0, L), Math.min(UNDERFLUES_W, R), b);
  UNDERFLUES_ZONES.forEach((z) => {
    if (!z.lvl) return;
    const sx = z.x0 + 80;
    if (visible(sx - 90, sx + 90, L, R)) drawZoneMark(ctx, sx, z);
  });
  if (visible(UNDERFLUES_EXIT_X, UNDERFLUES_EXIT_X + 320, L, R)) drawArrow(ctx, UNDERFLUES_EXIT_X + 160, 'Up to the Old Foundry', -1, time);
  if (visible(UNDERFLUES_END_X - 260, UNDERFLUES_END_X, L, R)) drawArrow(ctx, UNDERFLUES_END_X - 150, 'The Long Flue', 1, time);
  // soot coming down, sparks going up (more of them the hotter it is)
  for (const f of flakes) {
    if (f.x < L || f.x > R) continue;
    const k = (time * f.v + f.p) % 1;
    ctx.fillStyle = `rgba(30,24,24,${0.6 * Math.sin(k * Math.PI)})`;
    circle(ctx, f.x + Math.sin(k * 6 + f.d) * 10, 70 + k * (GROUND - 70), 1.6);
  }
  for (const s of sparks) {
    if (s.x < L || s.x > R || s.p > 0.25 + heatAt(s.x)) continue;
    const k = (time * s.v + s.p) % 1;
    ctx.fillStyle = `rgba(255,${180 - k * 90},80,${0.8 * (1 - k)})`;
    circle(ctx, s.x + Math.sin(k * 9 + s.p * 7) * 8, GROUND - k * 260, 1.4);
  }
  // the further east, the hotter and redder
  const hk = heatAt(camX + viewW / 2);
  if (hk > 0) {
    ctx.fillStyle = `rgba(120,24,8,${0.16 * hk + 0.05 * hk * b})`;
    ctx.fillRect(L, 0, R - L, H);
  }
  ctx.restore();
}

// The back wall: soot-black brick vaults, each with a fire channel running back into the wall, its mouth glowing
// redder going east (and with every breath below)
function drawVaults(ctx, L, R, time, b) {
  const top = 100;
  ctx.fillStyle = BRICK_D;
  ctx.fillRect(L, top - 30, R - L, GROUND - top + 30);
  // brick courses, faint
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = top; y < GROUND; y += 16) {
    ctx.moveTo(L, y);
    ctx.lineTo(R, y);
    const off = (y / 16) % 2 ? 0 : 20;
    for (let x = Math.floor(L / 40) * 40 + off; x < R; x += 40) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 16);
    }
  }
  ctx.stroke();
  for (let vx = Math.floor(L / VAULT) * VAULT; vx < R + VAULT; vx += VAULT) {
    if (vx < 520 || vx > UNDERFLUES_W - VAULT) continue; // (the flue's foot, and the hound's bed)
    const cx = vx + VAULT / 2, hw = 120, ch = heatAt(cx);
    // the pier between vaults
    ctx.fillStyle = BRICK;
    ctx.fillRect(vx - 34, top - 20, 68, GROUND - top + 20);
    ctx.strokeStyle = 'rgba(20,8,6,0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let y = top; y < GROUND; y += 16) {
      ctx.moveTo(vx - 34, y);
      ctx.lineTo(vx + 34, y);
    }
    ctx.stroke();
    // the channel's mouth: an arch going back into the wall, the fire far back in it
    ctx.fillStyle = '#0a0404';
    ctx.beginPath();
    ctx.moveTo(cx - hw, GROUND);
    ctx.lineTo(cx - hw, GROUND - 120);
    ctx.quadraticCurveTo(cx, GROUND - 240, cx + hw, GROUND - 120);
    ctx.lineTo(cx + hw, GROUND);
    ctx.closePath();
    ctx.fill();
    glow(ctx, cx, GROUND - 40, hw * 0.9, 90, '255,90,30', 0.12 + 0.3 * ch + 0.12 * b * (0.4 + ch));
    // the channel's floor running back, a red line of embers along it
    ctx.fillStyle = `rgba(255,${100 + 60 * b},40,${0.3 + 0.4 * ch})`;
    ctx.fillRect(cx - hw * 0.4, GROUND - 26, hw * 0.8, 3);
    // the arch's brick ring
    ctx.strokeStyle = BRICK_L;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx - hw - 4, GROUND - 118);
    ctx.quadraticCurveTo(cx, GROUND - 246, cx + hw + 4, GROUND - 118);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(20,8,6,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 12; i++) {
      const u = i / 12, v = 1 - u;
      const x = v * v * (cx - hw - 4) + 2 * u * v * cx + u * u * (cx + hw + 4), y = v * v * (GROUND - 118) + 2 * u * v * (GROUND - 246) + u * u * (GROUND - 118);
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
    }
    ctx.stroke();
  }
}

// A glowing seam: a crack in the brick with the fire showing through it, brightening with each breath below
function drawSeam(ctx, s, b, time) {
  const h = heatAt(s.x), a = 0.3 + 0.35 * h + 0.35 * b;
  glow(ctx, s.x, s.y + 30, 34, 50, '255,100,40', 0.12 + 0.18 * b * (0.5 + h));
  ctx.strokeStyle = `rgba(255,${130 + 60 * b},60,${a})`;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  s.pts.forEach(([dx, dy], i) => (i ? ctx.lineTo(s.x + dx, s.y + dy) : ctx.moveTo(s.x + dx, s.y + dy)));
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,230,170,${a * 0.6})`;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.lineCap = 'butt';
}

// A brick ledge corbelled out of the wall, its top lit from below by the channels
function drawLedge(ctx, p, b) {
  ctx.fillStyle = BRICK;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + p.w, p.y);
  ctx.lineTo(p.x + p.w - 14, p.y + 22);
  ctx.lineTo(p.x + p.w * 0.6, p.y + 40);
  ctx.lineTo(p.x + p.w * 0.4, p.y + 40);
  ctx.lineTo(p.x + 14, p.y + 22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,8,6,0.65)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const y of [p.y + 10, p.y + 22, p.y + 32]) {
    ctx.moveTo(p.x + 6, y);
    ctx.lineTo(p.x + p.w - 6, y);
  }
  for (let x = p.x + 24; x < p.x + p.w - 10; x += 32) {
    ctx.moveTo(x, p.y);
    ctx.lineTo(x, p.y + 10);
  }
  ctx.stroke();
  ctx.fillStyle = BRICK_L;
  ctx.fillRect(p.x, p.y - 2, p.w, 4);
  ctx.fillStyle = `rgba(255,120,60,${0.12 + 0.1 * b})`; // the glow on its underside
  ctx.fillRect(p.x + 18, p.y + 34, p.w - 36, 4);
}

// An iron catwalk over the channels, hung from the vault on two rods, its deck an open grating
function drawCatwalk(ctx, p) {
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(p.x + 14, p.y);
  ctx.lineTo(p.x + 30, 60);
  ctx.moveTo(p.x + p.w - 14, p.y);
  ctx.lineTo(p.x + p.w - 30, 60);
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  ctx.fillRect(p.x, p.y - 2, p.w, 5);
  ctx.fillRect(p.x, p.y + 9, p.w, 3);
  ctx.fillStyle = IRON;
  for (let x = p.x + 4; x < p.x + p.w - 2; x += 8) ctx.fillRect(x, p.y + 3, 3, 6);
  ctx.fillStyle = IRON_L;
  ctx.fillRect(p.x, p.y - 3, p.w, 1.5);
  // the handrail
  ctx.strokeStyle = IRON;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(p.x + 4, p.y - 22);
  ctx.lineTo(p.x + p.w - 4, p.y - 22);
  for (let x = p.x + 4; x <= p.x + p.w - 4; x += (p.w - 8) / 4) {
    ctx.moveTo(x, p.y - 22);
    ctx.lineTo(x, p.y - 2);
  }
  ctx.stroke();
}

// The Damper: a vertical flue shaft going up into the dark, and across it a great iron damper wheel on its axle (its
// top rim is the ledge), a stoker's tin mug hung on one of its spokes. Easy to miss
function drawDamper(ctx, p, time, b) {
  const cx = p.x + p.w / 2, cy = p.y + 48, r = 50;
  // the shaft
  ctx.fillStyle = '#0c0606';
  ctx.fillRect(cx - 70, 0, 140, cy + 60);
  ctx.strokeStyle = BRICK;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(cx - 74, 0);
  ctx.lineTo(cx - 74, cy + 70);
  ctx.moveTo(cx + 74, 0);
  ctx.lineTo(cx + 74, cy + 70);
  ctx.stroke();
  glow(ctx, cx, cy + 50, 70, 40, '255,100,40', 0.1 + 0.1 * b);
  // the wheel
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = IRON;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.2;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.stroke();
  ctx.fillStyle = IRON;
  circle(ctx, cx, cy, 8);
  ctx.fillStyle = IRON_L;
  circle(ctx, cx - 2, cy - 2, 2.5);
  // the axle into the brick
  ctx.fillStyle = IRON_D;
  ctx.fillRect(cx - 74, cy - 3, 148, 6);
  // the mug, hung on a spoke by its handle
  const a = 0.2 + TAU / 6, mx = cx + Math.cos(a) * r * 0.6, my = cy + Math.sin(a) * r * 0.6, sw = Math.sin(time * 0.8) * 0.06;
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(sw);
  ctx.strokeStyle = '#9a948a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 4, 3, Math.PI, TAU);
  ctx.stroke();
  ctx.fillStyle = '#b8b2a6';
  ctx.fillRect(-5, 6, 10, 11);
  ctx.fillStyle = '#7a746a';
  ctx.fillRect(-5, 6, 10, 2);
  ctx.restore();
}

// The roof: a low brick vault, black with soot, with an iron tie-rod now and then
function drawRoof(ctx, L, R) {
  ctx.fillStyle = vgrad(ctx, 'roof', 0, 90, [[0, '#040202'], [1, '#1c0c0a']]);
  ctx.beginPath();
  ctx.moveTo(L, 0);
  for (let x = Math.floor(L / 260) * 260; x <= R + 260; x += 260) ctx.quadraticCurveTo(x + 130, 96, x + 260, 70);
  ctx.lineTo(R + 260, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = IRON_D;
  for (let x = Math.floor(L / 780) * 780 + 130; x < R; x += 780) ctx.fillRect(x - 2, 0, 4, 84);
}

// A stoker's shovel or fire-iron left leaning on the wall
function drawTool(ctx, t) {
  ctx.save();
  ctx.translate(t.x, GROUND);
  ctx.rotate(t.a);
  if (t.kind === 'shovel') {
    ctx.fillStyle = '#4a3226';
    ctx.fillRect(-2, -110, 4, 92);
    ctx.fillStyle = '#5a3e2c';
    ctx.fillRect(-7, -114, 14, 4);
    ctx.fillStyle = '#1e1a1c';
    ctx.beginPath();
    ctx.moveTo(-9, -22);
    ctx.lineTo(9, -22);
    ctx.lineTo(8, 0);
    ctx.quadraticCurveTo(0, 4, -8, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.strokeStyle = IRON_D;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -130);
    ctx.moveTo(0, -130);
    ctx.lineTo(8, -138);
    ctx.stroke();
    ctx.strokeStyle = '#7a5a8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.fillStyle = IRON;
    ctx.beginPath();
    ctx.ellipse(0, -128, 5, 3, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// The Flue Foot: the flue you came down, coming in steep from the top left with the stokers' ladder pegged in it; a
// coal heap with shovels left standing in it; a coal barrow tipped over and its coal spilled; a stoker's coat on a
// hook; a lamp, out. Nobody here
function drawFlueFoot(ctx, time, b) {
  // the flue coming down
  ctx.fillStyle = '#0a0505';
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(140, 0);
  ctx.lineTo(180, GROUND - 120);
  ctx.lineTo(160, GROUND);
  ctx.lineTo(20, GROUND);
  ctx.lineTo(10, GROUND - 120);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = BRICK_L;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(10, GROUND - 120);
  ctx.lineTo(20, GROUND);
  ctx.moveTo(140, 0);
  ctx.lineTo(180, GROUND - 120);
  ctx.lineTo(160, GROUND);
  ctx.stroke();
  // the faint light of the Foundry far up it
  glow(ctx, 70, 30, 70, 60, '255,150,90', 0.14);
  // the ladder
  ctx.strokeStyle = '#3a3034';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(46, GROUND);
  ctx.lineTo(30, 40);
  ctx.moveTo(104, GROUND);
  ctx.lineTo(96, 40);
  for (let y = GROUND - 14; y > 50; y -= 22) {
    const k = (GROUND - y) / (GROUND - 40);
    ctx.moveTo(46 - k * 16, y);
    ctx.lineTo(104 - k * 8, y);
  }
  ctx.stroke();
  // the coal heap with shovels standing in it
  ctx.fillStyle = '#141012';
  ctx.beginPath();
  ctx.moveTo(300, GROUND + 2);
  ctx.quadraticCurveTo(360, GROUND - 70, 430, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(120,110,120,0.35)';
  for (let i = 0; i < 12; i++) circle(ctx, 316 + ((i * 47) % 104), GROUND - 8 - ((i * 23) % 40), 2.4);
  for (const [x, a] of [[342, -0.3], [372, 0.12], [398, 0.4]]) drawTool(ctx, { x, a, kind: 'shovel' });
  // the barrow, tipped on its side, coal spilled out of it
  ctx.save();
  ctx.translate(530, GROUND - 4);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#3a2a24';
  ctx.beginPath();
  ctx.moveTo(-34, -30);
  ctx.lineTo(30, -30);
  ctx.lineTo(22, 0);
  ctx.lineTo(-26, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#4a3226';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-26, -4);
  ctx.lineTo(-62, 4);
  ctx.moveTo(-26, -24);
  ctx.lineTo(-62, -18);
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  circle(ctx, 30, 6, 10);
  ctx.fillStyle = IRON;
  circle(ctx, 30, 6, 3);
  ctx.restore();
  ctx.fillStyle = '#141012';
  for (let i = 0; i < 14; i++) ellipse(ctx, 552 + i * 7 + ((i * 13) % 9), GROUND - 2 - (i % 3) * 2, 4, 3);
  // the coat on its hook, and the lamp gone out
  ctx.fillStyle = IRON_D;
  ctx.fillRect(456, GROUND - 168, 12, 3);
  ctx.fillStyle = '#2a2224';
  ctx.beginPath();
  ctx.moveTo(464, GROUND - 166);
  ctx.lineTo(446, GROUND - 150);
  ctx.lineTo(440, GROUND - 92);
  ctx.lineTo(486, GROUND - 92);
  ctx.lineTo(480, GROUND - 150);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#141012';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(463, GROUND - 150);
  ctx.lineTo(463, GROUND - 92);
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  ctx.fillRect(262, GROUND - 22, 18, 22);
  ctx.fillStyle = 'rgba(120,100,80,0.4)';
  ctx.fillRect(265, GROUND - 18, 12, 12);
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(271, GROUND - 24, 6, Math.PI, TAU);
  ctx.stroke();
  // the first warmth, coming the other way
  glow(ctx, 640, GROUND - 60, 120, 80, '255,90,30', 0.06 + 0.05 * b);
}

// The Hound's Bed: a great hollow pressed into a drift of soot against the wall, gnawed iron round it, scrape marks in
// the brick; and past it at the far end the way down to the Long Flue, a square brick mouth in the floor's end with the
// heat coming up out of it, breathing
function drawBed(ctx, time, b) {
  ctx.fillStyle = '#141012';
  ctx.beginPath();
  ctx.moveTo(BED_X - 260, GROUND + 2);
  ctx.quadraticCurveTo(BED_X - 200, GROUND - 90, BED_X, GROUND - 70);
  ctx.quadraticCurveTo(BED_X + 200, GROUND - 90, BED_X + 260, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0a0809';
  ellipse(ctx, BED_X, GROUND - 14, 170, 22);
  // scrape marks in the brick above it, in pairs (two heads, two of everything)
  ctx.strokeStyle = 'rgba(120,80,60,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const [x, y] of [[-160, -170], [-120, -184], [70, -176], [110, -190]]) {
    for (let i = 0; i < 3; i++) {
      ctx.moveTo(BED_X + x + i * 7, GROUND + y);
      ctx.lineTo(BED_X + x + i * 7 + 14, GROUND + y + 40);
    }
  }
  ctx.stroke();
  // gnawed iron: a bent fire-iron and a shovel blade bitten through
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(BED_X - 210, GROUND - 4);
  ctx.quadraticCurveTo(BED_X - 180, GROUND - 30, BED_X - 150, GROUND - 6);
  ctx.stroke();
  ctx.fillStyle = '#1e1a1c';
  ctx.beginPath();
  ctx.moveTo(BED_X + 180, GROUND - 2);
  ctx.lineTo(BED_X + 200, GROUND - 16);
  ctx.lineTo(BED_X + 206, GROUND - 8);
  ctx.lineTo(BED_X + 214, GROUND - 14);
  ctx.lineTo(BED_X + 216, GROUND);
  ctx.closePath();
  ctx.fill();
  // the way down: a square brick mouth at the end, heat coming up it
  const mx = UNDERFLUES_END_X;
  glow(ctx, mx, GROUND - 60, 140, 140, '255,90,30', 0.22 + 0.25 * b);
  ctx.fillStyle = '#0a0303';
  ctx.fillRect(mx - 60, GROUND - 170, 120, 170);
  ctx.fillStyle = `rgba(255,${80 + 60 * b},30,${0.35 + 0.35 * b})`;
  ctx.fillRect(mx - 50, GROUND - 30, 100, 30);
  ctx.strokeStyle = BRICK_L;
  ctx.lineWidth = 10;
  ctx.strokeRect(mx - 64, GROUND - 174, 128, 178);
  ctx.strokeStyle = 'rgba(20,8,6,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = GROUND - 170; y < GROUND; y += 14) {
    ctx.moveTo(mx - 69, y);
    ctx.lineTo(mx - 59, y);
    ctx.moveTo(mx + 59, y);
    ctx.lineTo(mx + 69, y);
  }
  ctx.stroke();
  // the grating's edge showing at the top of the way down, going on down into the heat
  ctx.fillStyle = IRON_D;
  ctx.fillRect(mx - 50, GROUND - 6, 100, 4);
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.4 + i / 4) % 1;
    ctx.strokeStyle = `rgba(255,190,130,${0.22 * Math.sin(k * Math.PI)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    const x = mx - 30 + i * 20, y = GROUND - 20 - k * 150;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 6 + Math.sin(time * 2 + i) * 5, y - 14, x, y - 28);
    ctx.stroke();
  }
}

// The floor: brick paving, black with soot, a channel of embers running down its middle that brightens with each breath
function drawFloor(ctx, L, R, b) {
  ctx.fillStyle = vgrad(ctx, 'floor', GROUND, H, [[0, '#3a2420'], [0.25, '#22120f'], [1, '#0a0505']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = 'rgba(160,110,90,0.25)';
  ctx.fillRect(L, GROUND - 1, R - L, 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.floor(L / 46) * 46; x < R; x += 46) {
    ctx.moveTo(x, GROUND + 4);
    ctx.lineTo(x - 6, GROUND + 22);
  }
  ctx.moveTo(L, GROUND + 22);
  ctx.lineTo(R, GROUND + 22);
  ctx.stroke();
  // the ember channel, east of the flue's foot
  const x0 = Math.max(L, 520);
  if (x0 < R) {
    ctx.fillStyle = '#0a0404';
    ctx.fillRect(x0, GROUND + 34, R - x0, 10);
    ctx.fillStyle = `rgba(255,${90 + 60 * b},30,${0.4 + 0.3 * b})`;
    ctx.fillRect(x0, GROUND + 37, R - x0, 4);
  }
}

// The zones' markers: an iron plate bolted to the brick, the name stamped in, a red level chip (hard-pocket rules)
function drawZoneMark(ctx, x, z) {
  ctx.font = `700 15px ${FONT}`;
  const tw = Math.max(130, ctx.measureText(z.name).width + 30);
  ctx.save();
  ctx.translate(x, GROUND - 60);
  ctx.fillStyle = '#2e2a32';
  ctx.fillRect(-4, 20, 8, 42);
  ctx.fillStyle = '#3e3640';
  ctx.strokeStyle = '#e0526e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -26, tw, 50, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = IRON_L;
  for (const [bx, by] of [[-tw / 2 + 7, -19], [tw / 2 - 7, -19], [-tw / 2 + 7, 17], [tw / 2 - 7, 17]]) circle(ctx, bx, by, 2);
  text(ctx, z.name, 0, -9, 15, '#f2e6d8');
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.roundRect(-36, 4, 72, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 12.5, 11, '#fffaf0');
  ctx.restore();
}

// A stokers' arrow board on an iron post: the way back up, and the way on down
function drawArrow(ctx, x, label, dir, time) {
  ctx.fillStyle = '#3a3034';
  ctx.fillRect(x - 3, GROUND - 92, 6, 94);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.2) * 0.02);
  ctx.font = `700 11px ${FONT}`;
  const hw = ctx.measureText(label).width / 2 + 16;
  ctx.fillStyle = '#c8b090';
  ctx.strokeStyle = '#6a5240';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-dir * hw, -12);
  ctx.lineTo(dir * (hw - 8), -12);
  ctx.lineTo(dir * (hw + 4), 0);
  ctx.lineTo(dir * (hw - 8), 12);
  ctx.lineTo(-dir * hw, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(30,24,24,0.5)'; // soot along its top edge
  ctx.fillRect(-hw + 4, -13, hw * 2 - 12, 2);
  text(ctx, label, -dir * 2, 1, 11, '#3e3040');
  ctx.restore();
}
