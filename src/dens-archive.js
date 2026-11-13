// Docs: docs/combat/bosses.md, docs/places/archive.md
// The Archive's boss den (the Last Drawer, the Citadel's depth pass C2), its way in in the Index Hall (a narrow stair going
// down between two of the great catalogue's cabinets, a drawer's brass label frame over it with no label, pages drifting
// up out of it), and the Indexer itself: the Archive's cataloguing automaton, a great oak-and-brass card cabinet the size
// of a house, filing the same last day over and over. The plan: story/citadel-plan.md.
// dens.js imports this file and dispatches to it (same contracts as its own dens and bosses), so this file must NOT
// import dens.js: the few helpers it needs are copied below. The shared boss effects take its theme ('archive': FXPAL in
// dens.js); Closing Time is the shared `lanes` ult. Its freeing (drawIndexerFreed, the den's bossDie): the last page comes
// down into its open drawer, the drawer slides shut, and the pages in the air come down and lie still.
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, FIELD_GROUND, BOSS_RESPAWN_MS } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';
import { drawSunk } from './challenge.js';
import { drawPage } from './archive-art.js';

const GROUND = FIELD_GROUND;
export const INDEXER_FREED_S = 6; // how long the freeing plays (the den's bossDie lasts this long)
const BRASS = '#f0c470', BRASS_L = '#fde3a0', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const OAK = '#6a4a32', OAK_D = '#3e2a1e', OAK_L = '#8a6448', PAPER = '#efe4c8', RED = '#c8302a';
const LAMP = '255,226,170';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const rageCol = (c, enr, k = 0.3) => (enr ? mix(c, '#ff4a3a', k) : c);

// ——— small helpers (copies of the ones in dens.js) ———
function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.9, 0.35, 0.35); // src/glow.js
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

// Freed: the pages stay down for a while after (set from drawIndexerFreed)
let freedPending = false, freedAt = -1e9;

// ——— the den: the Indexer's card room, a tall chamber walled in little drawers up into the dark, brass label frames on
// every one; in the back wall one great drawer stands pulled out (the record of the last day), and pages drift up off it
// all the time. A reading lamp hangs on a long chain. The floor is oak, pages underfoot ———
const pagesUp = (() => {
  const r = mulberry32(8901);
  return Array.from({ length: 30 }, () => ({ x: 40 + r() * (DEN_W - 80), ph: r(), v: 0.04 + r() * 0.05, s: 3 + r() * 4, p: r() * TAU }));
})();
const lying = (() => {
  const r = mulberry32(8911);
  return Array.from({ length: 60 }, () => ({ x: r() * DEN_W, y: GROUND + 2 + r() * 12, a: r() * TAU, s: 4 + r() * 3 }));
})();

function drawDenArchive(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  if (freedPending) (freedPending = false), (freedAt = time);
  const freedT = time - freedAt, freed = freedT < BOSS_RESPAWN_MS / 1000;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'bg-archive', 0, GROUND, [[0, '#0e0a0e'], [0.4, '#2a1e18'], [1, '#4a3424']]);
  ctx.fillRect(L, 0, R - L, H);
  // the walls of drawers, up into the dark
  const DW = 40, DH = 26;
  for (let y = 40; y < GROUND - 10; y += DH + 4) {
    const a = clamp((y - 40) / 160, 0, 1);
    for (let x = Math.floor(L / (DW + 4)) * (DW + 4); x < R; x += DW + 4) {
      ctx.fillStyle = `rgba(138,100,72,${0.25 + 0.55 * a})`;
      ctx.fillRect(x, y, DW, DH);
      ctx.fillStyle = `rgba(200,144,74,${0.3 + 0.5 * a})`;
      ctx.fillRect(x + 12, y + 5, 16, 7);
      ctx.fillStyle = `rgba(138,90,46,${0.4 + 0.5 * a})`;
      circle(ctx, x + DW / 2, y + 19, 2);
    }
  }
  // the great drawer pulled out in the back wall, the record of the last day (freed: shut)
  const gx = DEN_W / 2;
  if (visible(gx - 160, gx + 160, L, R)) {
    const out = freed ? 0 : 1;
    ctx.fillStyle = OAK_D;
    ctx.fillRect(gx - 130, 150, 260, 90);
    ctx.fillStyle = OAK_L;
    ctx.fillRect(gx - 130 - 10 * out, 150 + 40 * out, 260 + 20 * out, 90);
    ctx.strokeStyle = OAK_D;
    ctx.lineWidth = 3;
    ctx.strokeRect(gx - 130 - 10 * out, 150 + 40 * out, 260 + 20 * out, 90);
    ctx.fillStyle = BRASS_D;
    ctx.fillRect(gx - 40, 166 + 40 * out, 80, 22);
    ctx.fillStyle = PAPER;
    ctx.fillRect(gx - 34, 170 + 40 * out, 68, 14);
    ctx.fillStyle = BRASS_E;
    ellipse(ctx, gx, 214 + 40 * out, 16, 5);
    if (!freed) { // the cards standing up in it, the top ones riffling
      for (let i = 0; i < 18; i++) {
        const cx = gx - 110 + i * 13, lift = Math.max(0, Math.sin(time * 2 + i * 0.7)) * 6;
        ctx.fillStyle = i % 5 === 0 ? '#e0d4b4' : PAPER;
        ctx.fillRect(cx, 178 - lift, 10, 14 + lift);
      }
    }
  }
  // the reading lamp on its long chain
  const lx = DEN_W * 0.28;
  if (visible(lx - 80, lx + 80, L, R)) {
    ctx.strokeStyle = 'rgba(138,90,46,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx + Math.sin(time * 0.5) * 4, 110);
    ctx.stroke();
    glow(ctx, lx, 130, 120, 140, LAMP, 0.25);
    ctx.fillStyle = '#3a7a5a';
    ctx.beginPath();
    ctx.moveTo(lx - 22, 124);
    ctx.quadraticCurveTo(lx, 100, lx + 22, 124);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(${LAMP},0.9)`;
    ellipse(ctx, lx, 124, 16, 3);
  }
  // the pages, drifting up (freed: lying still on the floor)
  if (!freed) {
    for (const pg of pagesUp) {
      if (!visible(pg.x - 20, pg.x + 20, L, R)) continue;
      const k = (time * pg.v + pg.ph) % 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 4) * Math.min(1, (1 - k) * 3) * 0.75;
      drawPage(ctx, pg.x + Math.sin(time * 0.7 + pg.p) * 14, GROUND - 10 - k * (GROUND + 30), pg.s, time * 1.3 + pg.p);
      ctx.restore();
    }
  }
  // the floor: oak boards, pages underfoot
  ctx.fillStyle = vgrad(ctx, 'floor-archive', GROUND, H, [[0, '#5a3e2a'], [1, '#2a1c14']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = OAK_D;
  ctx.fillRect(L, GROUND - 2, R - L, 4);
  for (const f of lying) {
    if (!visible(f.x - 10, f.x + 10, L, R)) continue;
    if (!freed && f.x % 3 > 1) continue; // (freed, all of them: they came down)
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(1, 0.35);
    ctx.rotate(f.a);
    ctx.fillStyle = 'rgba(239,228,200,0.8)';
    ctx.fillRect(-f.s, -f.s * 0.7, f.s * 2, f.s * 1.4);
    ctx.restore();
  }
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? 'The Last Drawer', 750, time);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawSunk(ctx, p, i, () => drawLedge(ctx, p))); // (drawSunk: a boss's moving arena, src/challenge.js)
  ctx.restore();
}

function drawExit(ctx) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 80, 100, 110, LAMP, 0.22);
  ctx.fillStyle = OAK; // the narrow stair going back up
  for (let i = 0; i < 7; i++) ctx.fillRect(x - 30 + i * 3, b - 10 - i * 26, 60 - i * 3, 7);
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 32, b - 30);
  ctx.lineTo(x + 18, b - 190);
  ctx.stroke();
  text(ctx, 'OUT', x, b - 206, 13, '#f0eef8');
}

// The name on a card in a big brass label frame, hung on two chains
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 110);
  ctx.rotate(Math.sin(time * 0.4) * 0.01);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 56);
  ctx.strokeStyle = 'rgba(200,144,74,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const sx of [-tw / 2 + 18, tw / 2 - 18]) {
    ctx.moveTo(sx, -46);
    ctx.lineTo(sx, -18);
  }
  ctx.stroke();
  ctx.fillStyle = BRASS_D;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 44, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PAPER; // the card in the frame
  ctx.fillRect(-tw / 2 + 10, -13, tw - 20, 30);
  ctx.fillStyle = RED;
  ctx.fillRect(-tw / 2 + 14, -9, tw - 28, 1.4);
  ctx.fillStyle = BRASS_E; // the frame's two screws
  circle(ctx, -tw / 2 + 5, 2, 2.5);
  circle(ctx, tw / 2 - 5, 2, 2.5);
  text(ctx, name, 0, 5, 18, '#2a1e14');
  ctx.restore();
}

// The ledges: drawers pulled out of the walls, their brass pulls and label frames under the lip
function drawLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = OAK_L;
  ctx.strokeStyle = OAK_D;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 24, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = OAK;
  ctx.fillRect(x + 3, y - 4, w - 6, 3);
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(x + w / 2 - 14, y + 4, 28, 9);
  ctx.fillStyle = PAPER;
  ctx.fillRect(x + w / 2 - 11, y + 6, 22, 5);
  ctx.fillStyle = BRASS_E;
  ellipse(ctx, x + w / 2, y + 17, 7, 2.4);
}

export const DEN_ART = { archive: drawDenArchive };

// ——— the way in, in the Index Hall (feet at groundY) ———
// A narrow stair going down between two of the catalogue's cabinets, an empty brass label frame over it, lamplight coming
// up, and pages drifting up out of it
function drawEntranceArchive(ctx, x, groundY, time) {
  const b = groundY;
  ctx.save();
  for (const s of [-1, 1]) { // the two cabinets either side
    const cx = x + s * 78;
    ctx.fillStyle = OAK;
    ctx.fillRect(cx - 36, b - 210, 72, 210);
    for (let dy = b - 200; dy < b - 14; dy += 26) {
      ctx.fillStyle = OAK_L;
      ctx.fillRect(cx - 30, dy, 60, 22);
      ctx.fillStyle = BRASS_D;
      ctx.fillRect(cx - 9, dy + 4, 18, 7);
      ctx.fillStyle = BRASS_E;
      circle(ctx, cx, dy + 17, 2);
    }
  }
  ctx.fillStyle = '#120c0c'; // the opening between them, and the stair going down
  ctx.fillRect(x - 42, b - 180, 84, 180);
  glow(ctx, x, b - 20, 70, 60, LAMP, 0.3 + 0.06 * Math.sin(time * 0.9));
  ctx.fillStyle = OAK_D;
  for (let i = 0; i < 5; i++) ctx.fillRect(x - 36 + i * 4, b - 6 - i * 20, 72 - i * 8, 5);
  ctx.fillStyle = BRASS_D; // the empty label frame over it
  ctx.beginPath();
  ctx.roundRect(x - 40, b - 204, 80, 22, 4);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(30,20,14,0.6)';
  ctx.fillRect(x - 32, b - 199, 64, 12);
  for (let i = 0; i < 3; i++) { // pages coming up out of it
    const k = (time * 0.18 + i * 0.33) % 1;
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 4) * (1 - k);
    drawPage(ctx, x - 16 + i * 16 + Math.sin(time + i) * 6, b - 20 - k * 160, 4, time * 1.5 + i);
    ctx.restore();
  }
  ctx.restore();
}
export const ENTRANCE_ART = { archive: drawEntranceArchive };

// ——— the Indexer (ctx, w, h, st) => sil, origin under it on the floor, +x = facing ———
// A great card cabinet of oak and brass on six short legs, its front all little drawers with label frames, sliding in and
// out as it files; its top drawer (in front, where `weak` puts the weak point) stands open, cards standing up in it and the
// shard among them. Four thin brass arms off its top: a pen, a stamp, a blotter, a pair of tongs; one reading lens on a
// telescoping stalk for an eye. st.warn: every drawer shoots out and the lens goes red; charging: it tips forward on its
// legs; enraged: the brass reddens.
function drawIndexer(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const live = dying < 0.02;
  const bw = w * 0.42, top = -h * 0.8, base = -h * 0.12;
  const brass = rageCol(BRASS, enr, 0.22), brassD = rageCol(BRASS_D, enr, 0.22), brassE = rageCol(BRASS_E, enr, 0.2);
  const sil = () => {
    ctx.beginPath();
    ctx.rect(-bw, top - 20, bw * 2, -top + 20);
  };
  ctx.save();
  if (charging) ctx.rotate(0.06);
  // the legs, six short turned ones in two rows
  for (let i = 0; i < 3; i++) {
    const lx = -bw * 0.8 + i * bw * 0.8;
    ctx.fillStyle = OAK_D;
    ctx.beginPath();
    ctx.roundRect(lx - 7, base - 4, 14, -base + 2, 4);
    ctx.fill();
    ctx.fillStyle = brassE;
    ellipse(ctx, lx, -2, 10, 3.5);
  }
  // the cabinet's body
  const g = ctx.createLinearGradient(-bw, 0, bw, 0);
  g.addColorStop(0, OAK_D);
  g.addColorStop(0.4, OAK_L);
  g.addColorStop(1, OAK);
  ctx.fillStyle = g;
  ctx.strokeStyle = OAK_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-bw, top, bw * 2, base - top, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = brassD; // brass corners and the plinth band
  ctx.fillRect(-bw, base - 10, bw * 2, 6);
  ctx.fillRect(-bw, top, bw * 2, 6);
  // the drawers: 4 columns × 4 rows, sliding in and out as it files (all out on the warn)
  const cols = 4, rows = 4, dw = (bw * 2 - 24) / cols, dh = (base - top - 60) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = -bw + 12 + c * dw, dy = top + 48 + r * dh;
      const slide = !live ? 0 : warn ? 6 : Math.max(0, Math.sin(t * 1.8 + r * 1.3 + c * 2.1 + seed)) ** 6 * 6;
      ctx.fillStyle = OAK_D;
      ctx.fillRect(dx + 2, dy + 2, dw - 4, dh - 4);
      ctx.fillStyle = OAK_L;
      ctx.fillRect(dx + 2 + slide * 0.3, dy + 2 - slide * 0.3, dw - 4, dh - 4);
      ctx.strokeStyle = 'rgba(42,30,20,0.7)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(dx + 2 + slide * 0.3, dy + 2 - slide * 0.3, dw - 4, dh - 4);
      ctx.fillStyle = brassD;
      ctx.fillRect(dx + dw / 2 - 8 + slide * 0.3, dy + 6 - slide * 0.3, 16, 6);
      ctx.fillStyle = PAPER;
      ctx.fillRect(dx + dw / 2 - 6 + slide * 0.3, dy + 7 - slide * 0.3, 12, 4);
      ctx.fillStyle = brassE;
      circle(ctx, dx + dw / 2 + slide * 0.3, dy + dh - 9 - slide * 0.3, 2);
    }
  }
  // the top drawer, standing open in front (the weak point: MOBS.indexer.weak), cards up in it and the shard among them
  const tx = w * 0.22, ty = -h * 0.66;
  ctx.fillStyle = OAK_D;
  ctx.fillRect(tx - 34, ty - 8, 68, 22);
  ctx.fillStyle = OAK_L;
  ctx.fillRect(tx - 30, ty + 4, 68, 14);
  ctx.strokeStyle = OAK_D;
  ctx.lineWidth = 2;
  ctx.strokeRect(tx - 30, ty + 4, 68, 14);
  for (let i = 0; i < 7; i++) {
    const lift = live ? Math.max(0, Math.sin(t * 3 + i)) * 4 : 0;
    ctx.fillStyle = i % 3 ? PAPER : '#e0d4b4';
    ctx.fillRect(tx - 26 + i * 9, ty - 6 - lift, 7, 12 + lift);
  }
  const sh = 0.6 + 0.4 * Math.sin(t * 3);
  glow(ctx, tx + 6, ty - 4, 24, 22, '255,236,190', live ? 0.5 * sh : 0.1);
  ctx.fillStyle = live ? '#fff4d8' : '#b8b0a0';
  ctx.strokeStyle = '#a88a50';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx + 5, ty - 16);
  ctx.lineTo(tx + 12, ty - 5);
  ctx.lineTo(tx + 6, ty + 4);
  ctx.lineTo(tx - 1, ty - 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the four thin arms off its top: pen, stamp, blotter, tongs, working at nothing
  const arms = [[-0.7, 'pen'], [-0.25, 'stamp'], [0.2, 'blot'], [0.62, 'tongs']];
  arms.forEach(([ax, kind], i) => {
    const sx = bw * ax, sy = top;
    const sw = live ? Math.sin(t * (warn ? 6 : 1.6) + i * 1.7 + seed) * (warn ? 0.5 : 0.3) : 0.6;
    const a1 = -Math.PI / 2 + (ax < 0 ? -0.5 : 0.5) + sw, l1 = h * 0.22, l2 = h * 0.18;
    const ex = sx + Math.cos(a1) * l1, ey = sy + Math.sin(a1) * l1;
    const a2 = a1 + (ax < 0 ? 0.9 : -0.9) + sw * 0.6;
    const fx = ex + Math.cos(a2) * l2, fy = ey + Math.sin(a2) * l2;
    ctx.strokeStyle = brassE;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    ctx.strokeStyle = brass;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = brassD;
    circle(ctx, ex, ey, 4);
    if (kind === 'pen') {
      ctx.fillStyle = '#1a1630';
      ctx.fillRect(fx - 2, fy - 2, 4, 14);
      ctx.fillStyle = brass;
      ctx.beginPath();
      ctx.moveTo(fx - 2, fy + 12);
      ctx.lineTo(fx, fy + 18);
      ctx.lineTo(fx + 2, fy + 12);
      ctx.fill();
    } else if (kind === 'stamp') {
      ctx.fillStyle = brassD;
      ctx.fillRect(fx - 8, fy - 2, 16, 9);
      ctx.fillStyle = RED;
      ctx.fillRect(fx - 9, fy + 7, 18, 4);
    } else if (kind === 'blot') {
      ctx.fillStyle = OAK;
      ctx.beginPath();
      ctx.ellipse(fx, fy + 6, 11, 5, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = brassE;
      ctx.fillRect(fx - 1.5, fy - 2, 3, 8);
    } else {
      ctx.strokeStyle = brassE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx - 4, fy + 12);
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + 4, fy + 12);
      ctx.stroke();
      ctx.fillStyle = PAPER; // a card held in its tongs
      ctx.fillRect(fx - 6, fy + 10, 12, 8);
    }
  });
  // the reading lens on its telescoping stalk: its eye, leaning out over the front
  const lk = live ? Math.sin(t * 0.9 + seed) * 4 : -8;
  const sx0 = bw * 0.55, sy0 = top, lx = bw * 0.95 + lk, ly = top - 34;
  ctx.strokeStyle = brassE;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(sx0, sy0);
  ctx.lineTo(lx - 10, ly + 6);
  ctx.stroke();
  ctx.strokeStyle = brass;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = brassE;
  circle(ctx, lx, ly, 15);
  ctx.fillStyle = '#2a2430';
  circle(ctx, lx, ly, 11);
  if (live) {
    const lit = warn || charging;
    glow(ctx, lx, ly, 26, 26, lit ? '255,110,90' : LAMP, 0.4);
    ctx.fillStyle = lit ? 'rgba(255,120,100,0.95)' : `rgba(${LAMP},${0.75 + 0.2 * Math.sin(t * 2)})`;
    circle(ctx, lx + 2, ly, 6.5);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    circle(ctx, lx - 2, ly - 3.5, 2);
  } else {
    ctx.strokeStyle = 'rgba(255,226,170,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx - 6, ly - 6); ctx.lineTo(lx + 6, ly + 6);
    ctx.moveTo(lx + 6, ly - 6); ctx.lineTo(lx - 6, ly + 6);
    ctx.stroke();
  }
  ctx.restore();
  return sil;
}
export const BOSS_ART = { indexer: drawIndexer };
export const ULT_LOOKS = {}; // (Closing Time is the shared `lanes` ult: dens.js)

// ——— freed: the last page comes down out of the air into its open drawer, the drawer slides shut, and every page in the
// air comes down after it and settles (the den's bossDie, INDEXER_FREED_S long) ———
export function drawIndexerFreed(ctx, e) {
  const tt = e.t;
  if (tt > 2) freedPending = true;
  const x0 = e.x ?? 750, y0 = GROUND - 132;
  const fade = tt > INDEXER_FREED_S - 1 ? Math.max(0, INDEXER_FREED_S - tt) : 1;
  // the last page, sinking into the drawer
  const k = clamp(tt / 2.2, 0, 1), ease = 1 - (1 - k) ** 3;
  ctx.save();
  ctx.globalAlpha *= (k < 1 ? 1 : Math.max(0, 1 - (tt - 2.2) * 2)) * fade;
  drawPage(ctx, x0 + 50 + Math.sin(tt * 2) * 14 * (1 - k), y0 - 140 + 130 * ease, 9, tt * 0.8 + (1 - k) * 3);
  ctx.restore();
  // the drawer sliding shut
  const shut = clamp((tt - 2.2) / 0.8, 0, 1);
  if (tt > 1.8) {
    ctx.save();
    ctx.globalAlpha *= fade;
    ctx.fillStyle = OAK_L;
    ctx.strokeStyle = OAK_D;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x0 + 20 - 30 * shut, y0 + 4, 68, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = BRASS_E;
    circle(ctx, x0 + 54 - 30 * shut, y0 + 11, 2.5);
    ctx.restore();
  }
  // the pages in the air, coming down and settling on the floor
  for (let i = 0; i < 24; i++) {
    const start = 2.4 + (i % 8) * 0.18;
    const j = clamp((tt - start) / 2, 0, 1);
    if (j <= 0) continue;
    const px = x0 - 360 + ((i * 137) % 720), py = 60 + ((i * 53) % 160);
    const y = py + (GROUND - 4 - py) * (1 - (1 - j) ** 2);
    ctx.save();
    ctx.globalAlpha *= Math.min(1, j * 4) * fade;
    drawPage(ctx, px + Math.sin(tt * 2 + i) * 10 * (1 - j), y, 4 + (i % 3), (1 - j) * (tt * 2 + i) + j * 1.4);
    ctx.restore();
  }
}
