// Docs: docs/places/typhon.md, docs/performance.md
// The Hearth (room 65, theme 'hearth'): Typhon's den at the foot of the Long Flue (E5 (c), story/e5-plan.md), and Typhon
// itself, the Buried Fire; its two ultimates' effects; the floor plates, the vents, the molten iron. The first forge,
// older than the Foundry above it: a vault of black basalt and soot-black brick with Keeper carving on the arches (teeth,
// a wheel), the great hearth pit at the back middle, an empty mould set in the floor (a gear-tooth's print, one short),
// four old furnace doors in the side walls (the vents), low brick ledges, a high one at each end, and the rusted gantry
// of a ladle-crane overhead. dens.js imports this file (DEN_ART, BOSS_ART, FX2), so it must NOT import dens.js.
// E5 (c1) stand-in art: readable shapes, functional; E5 (c2) polishes it. The den's static layer is baked (as Fenrir's),
// and the plates' four looks are baked once each and stamped (docs/performance.md).
import { H, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { DEN_EXIT_X } from './shared/rpg.js';
import { FIN_W, FIN_FLOOR } from './shared/final.js';
import { TYPHON_PLATFORMS, TY_MID, PLATES, PLATE_W, plateMid, VENTS, HIGH_W, HIGH_E } from './shared/typhon.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIN_FLOOR;
export const EMBER = '255,140,50', HOT = '255,190,90', FROSTC = '200,230,250';
export function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.9, 0.35, 0.35);
}
function text(ctx, str, x, y, size, color) {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— what the client last heard (src/typhon.js sets it: the FX and the boss art read it) ———
// po: its pose, ph: the phase, pr: the pressure, plates: ['c'|'g'|'m'|'k'], crusted: [bool], enr, breath 0–1 (its bellows
// breathing, eased), rise: how far out of the hearth (eased)
const look = { po: 'sunk', ph: 0, pr: 0, enr: false, plates: Array(PLATES).fill('c'), crusted: Array(PLATES).fill(false), rise: 0.2, arm: 0, rest: 0, ribs: 0, freed: 0 };
export function setTyphonLook(o) {
  Object.assign(look, o);
  if (o.plates) look.crusted = o.plates.map((s) => s === 'k');
}
export const typhonLook = () => look;
const RISE = [0.55, 0.75, 0.85, 1];
export function stepTyphonLook(dt, t) {
  const want = look.po === 'freed' ? 0.15 : look.po === 'sunk' ? 0.2 : look.po === 'sink' ? RISE[look.ph] - 0.2 : RISE[look.ph] ?? 1;
  look.rise += (want - look.rise) * Math.min(1, dt * (look.po === 'freed' ? 0.4 : 1.5));
  const arm = look.po === 'hammerL' || look.po === 'hammerR' ? 1 : 0, rest = look.po === 'restL' || look.po === 'restR' ? 1 : 0;
  look.arm += (arm - look.arm) * Math.min(1, dt * (arm ? 5 : 9));
  look.rest += (rest - look.rest) * Math.min(1, dt * 10);
  look.ribs += ((look.po === 'inhale' ? 1 : 0) - look.ribs) * Math.min(1, dt * 3);
  look.breath = 0.5 + 0.5 * Math.sin(t * (look.po === 'bellows' ? 3 : 1.3));
}

// ——— the den ———
const rnd = mulberry32(6565);
const bricks = Array.from({ length: 60 }, () => ({ x: rnd() * FIN_W, y: 40 + rnd() * 340, w: 30 + rnd() * 40, a: 0.05 + rnd() * 0.08 }));
const embers = Array.from({ length: 30 }, () => ({ x: rnd() * FIN_W, y: rnd() * GROUND, s: 0.8 + rnd() * 1.4, v: 14 + rnd() * 20, ph: rnd() * 10 }));
const ARCHES = [{ x: 240, w: 300 }, { x: 1260, w: 300 }];
const BX0 = -60, BX1 = FIN_W + 60;
let bake = null;
function denLayer(res) {
  if (bake && bake.res === res) return bake.c;
  const c = bake?.c ?? document.createElement('canvas');
  c.width = Math.ceil((BX1 - BX0) * res);
  c.height = Math.ceil(H * res);
  const g = c.getContext('2d');
  g.setTransform(res, 0, 0, res, -BX0 * res, 0);
  drawDenStatic(g);
  bake = { res, c };
  return c;
}
// a Keeper gear-tooth (the mould's print, the carving on the arches): a blunt trapezoid with a notch, w across
function toothPath(ctx, x, y, w, h) {
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w * 0.32, y - h);
  ctx.lineTo(x - w * 0.08, y - h);
  ctx.lineTo(x, y - h * 0.86);
  ctx.lineTo(x + w * 0.08, y - h);
  ctx.lineTo(x + w * 0.32, y - h);
  ctx.lineTo(x + w / 2, y);
  ctx.closePath();
}
function drawDenStatic(ctx) {
  ctx.save();
  // the vault: black basalt going up into soot, a warm floor glow at the bottom
  let g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#07040a');
  g.addColorStop(0.6, '#1a0f10');
  g.addColorStop(1, '#3a1a12');
  ctx.fillStyle = g;
  ctx.fillRect(BX0, 0, BX1 - BX0, GROUND + 4);
  // soot-black brick courses
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  for (let y = 30; y < GROUND; y += 26) {
    ctx.beginPath();
    ctx.moveTo(BX0, y);
    ctx.lineTo(BX1, y);
    ctx.stroke();
  }
  for (const b of bricks) {
    ctx.fillStyle = `rgba(120,60,40,${b.a})`;
    ctx.fillRect(b.x, Math.round(b.y / 26) * 26 + 2, b.w, 22);
  }
  // the side arches with Keeper carving: teeth round the arch, a wheel in the keystone
  for (const a of ARCHES) {
    ctx.fillStyle = 'rgba(4,2,4,0.6)';
    ctx.beginPath();
    ctx.moveTo(a.x - a.w / 2, GROUND);
    ctx.lineTo(a.x - a.w / 2, 180);
    ctx.arc(a.x, 180, a.w / 2, Math.PI, 0);
    ctx.lineTo(a.x + a.w / 2, GROUND);
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,110,80,0.35)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(a.x, 180, a.w / 2 + 8, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = 'rgba(150,110,80,0.4)';
    for (let i = 1; i < 8; i++) {
      const an = Math.PI + (i / 8) * Math.PI, x = a.x + Math.cos(an) * (a.w / 2 + 18), y = 180 + Math.sin(an) * (a.w / 2 + 18);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(an + Math.PI / 2);
      ctx.beginPath();
      toothPath(ctx, 0, 6, 16, 12);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(170,130,90,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(a.x, 180 - a.w / 2 - 6, 14, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const an = (i / 6) * TAU;
      ctx.beginPath();
      ctx.moveTo(a.x, 180 - a.w / 2 - 6);
      ctx.lineTo(a.x + Math.cos(an) * 14, 180 - a.w / 2 - 6 + Math.sin(an) * 14);
      ctx.stroke();
    }
  }
  // the great hearth pit at the back middle: a deep brick mouth, glowing at its throat
  ctx.fillStyle = '#120806';
  ctx.beginPath();
  ctx.moveTo(TY_MID - 230, GROUND);
  ctx.lineTo(TY_MID - 230, 200);
  ctx.quadraticCurveTo(TY_MID, 40, TY_MID + 230, 200);
  ctx.lineTo(TY_MID + 230, GROUND);
  ctx.fill();
  g = ctx.createLinearGradient(0, 120, 0, GROUND);
  g.addColorStop(0, 'rgba(255,120,40,0)');
  g.addColorStop(1, 'rgba(255,120,40,0.4)');
  ctx.fillStyle = g;
  ctx.fillRect(TY_MID - 220, 120, 440, GROUND - 120);
  ctx.strokeStyle = '#3a2016';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(TY_MID - 236, GROUND);
  ctx.lineTo(TY_MID - 236, 200);
  ctx.quadraticCurveTo(TY_MID, 32, TY_MID + 236, 200);
  ctx.lineTo(TY_MID + 236, GROUND);
  ctx.stroke();
  // the ladle-crane's rail across the vault (the ladle hanging off it is live: src/typhon.js)
  ctx.fillStyle = '#2a1c18';
  ctx.fillRect(330, 92, 840, 14);
  ctx.strokeStyle = 'rgba(160,90,60,0.4)';
  ctx.lineWidth = 2;
  for (let x = 340; x < 1160; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 106);
    ctx.lineTo(x + 15, 92);
    ctx.stroke();
  }
  for (const x of [330, 1156]) ctx.fillRect(x, 92, 14, 140);
  // the side walls, darker, with the four vents' furnace doors set in them (their wheels and rings are live)
  for (const side of [-1, 1]) {
    const x = side < 0 ? BX0 : BX1, gg = ctx.createLinearGradient(x, 0, x - side * 160, 0);
    gg.addColorStop(0, 'rgba(2,1,2,0.95)');
    gg.addColorStop(1, 'rgba(2,1,2,0)');
    ctx.fillStyle = gg;
    ctx.fillRect(side < 0 ? BX0 : FIN_W - 100, 0, 160, GROUND);
  }
  for (const v of VENTS) {
    ctx.fillStyle = '#1a1210';
    ctx.strokeStyle = '#4a3024';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(v.x - 30, v.y - 40, 60, 80, [30, 30, 6, 6]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3a2620';
    for (const dy of [-26, 0, 26]) for (const dx of [-20, 20]) circle(ctx, v.x + dx, v.y + dy, 2.5);
  }
  // the floor: a dark brick apron under the plates (the plates themselves are live)
  g = ctx.createLinearGradient(0, GROUND, 0, H);
  g.addColorStop(0, '#2a1a16');
  g.addColorStop(1, '#0e0806');
  ctx.fillStyle = g;
  ctx.fillRect(BX0, GROUND, BX1 - BX0, H - GROUND + 10);
  // the Long Flue's last steps coming down into the west wall (the way out)
  ctx.fillStyle = '#1c1210';
  for (let i = 0; i < 5; i++) ctx.fillRect(DEN_EXIT_X - 70 + i * 12, GROUND - 120 + i * 24, 70, 24);
  ctx.fillStyle = '#040202';
  ctx.beginPath();
  ctx.moveTo(DEN_EXIT_X - 42, GROUND + 2);
  ctx.lineTo(DEN_EXIT_X - 42, GROUND - 90);
  ctx.quadraticCurveTo(DEN_EXIT_X, GROUND - 140, DEN_EXIT_X + 42, GROUND - 90);
  ctx.lineTo(DEN_EXIT_X + 42, GROUND + 2);
  ctx.fill();
  text(ctx, 'OUT', DEN_EXIT_X, GROUND - 160, 13, '#ffe2c8');
  TYPHON_PLATFORMS.forEach((p) => drawLedge(ctx, p));
  ctx.restore();
}
function drawLedge(ctx, p) {
  if (p.kind === 'crane') {
    // the gantry walkway: riveted iron, a rail along it
    ctx.fillStyle = '#3a2a24';
    ctx.strokeStyle = '#120a08';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(p.x - 4, p.y - 4, p.w + 8, 12, 3);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(160,100,70,0.6)';
    ctx.lineWidth = 2;
    for (let x = p.x + 6; x < p.x + p.w; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, p.y + 8);
      ctx.lineTo(x + 9, p.y + 22);
      ctx.lineTo(x + 18, p.y + 8);
      ctx.stroke();
    }
    ctx.fillStyle = '#2a1c18';
    ctx.fillRect(p.x + 20, 106, 6, p.y - 106);
    ctx.fillRect(p.x + p.w - 26, 106, 6, p.y - 106);
    return;
  }
  const high = p.kind === 'high';
  ctx.fillStyle = high ? '#5a3a30' : '#4a3028';
  ctx.strokeStyle = '#140a08';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(p.x - 4, p.y - 4, p.w + 8, high ? 22 : 18, 5);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  for (let x = p.x + 24; x < p.x + p.w; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, p.y - 2);
    ctx.lineTo(x, p.y + (high ? 16 : 12));
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,190,140,0.25)';
  ctx.fillRect(p.x + 4, p.y - 2, p.w - 8, 2);
}
function drawDenHearth(ctx, camX, viewW, time) {
  const L = camX - 80, R = camX + viewW + 80;
  const m = ctx.getTransform(), res = Math.round(Math.hypot(m.a, m.b) * 1000) / 1000;
  if (Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6 && Math.abs(m.a - m.d) < 1e-6 && res > 0) {
    const img = denLayer(res);
    const sx = clamp(Math.floor((L - BX0) * res), 0, img.width - 1), sw = Math.min(img.width - sx, Math.ceil((R - L) * res));
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, 0, sw, img.height, Math.round(m.e + BX0 * res) + sx, Math.round(m.f), sw, img.height);
    ctx.restore();
  } else drawDenStatic(ctx);
  // the room breathes with it: the hearth's glow comes up and down (brighter the more pressure it holds)
  const b = look.breath ?? 0.5, pr = clamp(look.pr / 100, 0, 1);
  glow(ctx, TY_MID, GROUND - 60, 360, 200, EMBER, 0.12 + 0.12 * b + 0.25 * pr);
  // embers going up
  ctx.fillStyle = 'rgba(255,170,90,0.7)';
  for (const e of embers) {
    const y = GROUND - ((e.y + time * e.v) % GROUND), x = e.x + Math.sin(time * 0.6 + e.ph) * 12;
    if (x > L && x < R) circle(ctx, x, y, e.s);
  }
}
export const DEN_ART = { hearth: drawDenHearth };

// ——— the plates: four looks, baked once each, stamped per plate ———
const PH = 40; // (a plate's drawn depth below the floor line)
const plateBakes = {};
function plateLook(st) {
  if (plateBakes[st]) return plateBakes[st];
  const c = document.createElement('canvas'), w = Math.ceil(PLATE_W), h = PH + 8;
  c.width = w * 2;
  c.height = h * 2;
  const g = c.getContext('2d');
  g.scale(2, 2);
  const r = mulberry32(st.charCodeAt(0) * 31);
  if (st === 'm') {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#fff0b0');
    gr.addColorStop(0.3, '#ffb040');
    gr.addColorStop(1, '#b8340e');
    g.fillStyle = gr;
    g.fillRect(2, 0, w - 4, h);
    g.fillStyle = 'rgba(90,20,6,0.5)';
    for (let i = 0; i < 9; i++) ellipse(g, 10 + r() * (w - 20), 8 + r() * (h - 14), 6 + r() * 10, 2 + r() * 3);
  } else if (st === 'k') {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#dceaf4');
    gr.addColorStop(0.4, '#8ea4b6');
    gr.addColorStop(1, '#3a4654');
    g.fillStyle = gr;
    g.fillRect(2, 0, w - 4, h);
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) {
      let x = 8 + r() * (w - 16), y = 2;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 4; k++) g.lineTo((x += (r() - 0.5) * 18), (y += 4 + r() * 6));
      g.stroke();
    }
  } else {
    // cold iron (and glowing: the same iron, the heat is laid over it live)
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#4a3e3c');
    gr.addColorStop(0.15, '#2a2224');
    gr.addColorStop(1, '#140e0e');
    g.fillStyle = gr;
    g.fillRect(2, 0, w - 4, h);
    g.fillStyle = '#5a4a46';
    for (const x of [10, w - 10]) for (const y of [8, h - 10]) circle(g, x, y, 2.5);
    g.strokeStyle = 'rgba(255,120,50,0.18)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(w * 0.3, 2);
    g.lineTo(w * 0.36, h * 0.6);
    g.moveTo(w * 0.7, 3);
    g.lineTo(w * 0.62, h * 0.7);
    g.stroke();
  }
  g.strokeStyle = 'rgba(0,0,0,0.6)';
  g.lineWidth = 2;
  g.strokeRect(2, 0, w - 4, h);
  plateBakes[st] = c;
  return c;
}
// the eight plates (st: their states; hot: [bool] under the iron without a skin, phase 3) and the empty mould in the
// middle of the floor; t: time; bulge: { i → 0..1 } a coil heaving under it
export function drawPlates(ctx, sts, t, bulge = null) {
  for (let i = 0; i < PLATES; i++) {
    const st = sts[i] ?? 'c', x = i * PLATE_W, b = bulge?.get(i) ?? 0, lift = b > 0 ? Math.sin(b * Math.PI * 0.5) * 6 + Math.sin(t * 40) * b * 1.5 : 0;
    ctx.drawImage(plateLook(st === 'g' ? 'c' : st), x, GROUND - 2 - lift, PLATE_W, PH + 8);
    if (st === 'g' || b > 0) {
      // glowing: heat rising through the iron, pulsing faster as it goes (or a coil pressing up under it)
      const k = st === 'g' ? 0.35 + 0.35 * Math.sin(t * 12 + i) : 0.3 + 0.5 * b;
      ctx.fillStyle = `rgba(255,110,40,${k})`;
      ctx.fillRect(x + 2, GROUND - 2 - lift, PLATE_W - 4, PH + 8);
      ctx.strokeStyle = `rgba(255,200,110,${0.5 + 0.4 * k})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let c = 0; c < 4; c++) {
        const cx = x + 20 + c * 45 + Math.sin(i * 3 + c) * 10;
        ctx.moveTo(cx, GROUND - lift);
        ctx.lineTo(cx + 8, GROUND + 14 - lift);
        ctx.lineTo(cx - 4, GROUND + 26 - lift);
      }
      ctx.stroke();
    }
    if (st === 'm') {
      // its surface rolls: bright bubbles, a shimmer of heat
      ctx.fillStyle = 'rgba(255,250,210,0.8)';
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.8 + k * 0.33 + i * 0.17) % 1, bx = x + 20 + ((k * 61 + i * 37) % (PLATE_W - 40));
        circle(ctx, bx, GROUND + 4, 2 + 3 * Math.sin(ph * Math.PI));
      }
      ctx.fillStyle = `rgba(255,170,80,${0.12 + 0.06 * Math.sin(t * 6 + i)})`;
      ctx.fillRect(x + 4, GROUND - 26, PLATE_W - 8, 24);
    }
  }
  // the empty mould: the print of a gear-tooth in sand, set into the floor at the middle (one short)
  ctx.save();
  ctx.fillStyle = 'rgba(30,18,12,0.85)';
  ctx.strokeStyle = 'rgba(200,160,110,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(TY_MID, GROUND + 18, 70, 12, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(8,4,2,0.9)';
  ctx.beginPath();
  ctx.save();
  ctx.translate(TY_MID, GROUND + 22);
  ctx.scale(1, 0.32);
  toothPath(ctx, 0, 14, 80, 40);
  ctx.restore();
  ctx.fill();
  ctx.restore();
}
// the molten iron over the flooded plates (n a side; up to the low ledges once `ledges`); crusted ones show a skin
export function drawIron(ctx, n, ledges, sts, t) {
  if (n <= 0) return;
  const top = ledges ? 352 : GROUND - 10;
  for (let i = 0; i < PLATES; i++) {
    if (!(i < n || i >= PLATES - n)) continue;
    const x = i * PLATE_W, skin = sts[i] === 'k';
    const g = ctx.createLinearGradient(0, top, 0, GROUND + 40);
    g.addColorStop(0, skin ? 'rgba(170,190,206,0.95)' : 'rgba(255,220,120,0.95)');
    g.addColorStop(0.25, skin ? 'rgba(100,116,130,0.92)' : 'rgba(255,140,40,0.92)');
    g.addColorStop(1, skin ? 'rgba(40,46,56,0.9)' : 'rgba(160,40,10,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(x, top, PLATE_W, GROUND + 40 - top); // (a straight gradient in a rect: fastGradients caches it, docs/performance.md)
    ctx.strokeStyle = skin ? 'rgba(230,242,250,0.9)' : 'rgba(255,246,200,0.9)'; // (its rolling surface)
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k <= 8; k++) ctx[k ? 'lineTo' : 'moveTo'](x + (k / 8) * PLATE_W, top + Math.sin(t * 2.5 + (x + (k / 8) * PLATE_W) * 0.04) * 3);
    ctx.stroke();
    if (!skin) {
      ctx.fillStyle = 'rgba(255,250,210,0.7)';
      circle(ctx, x + ((t * 40 + i * 50) % PLATE_W), top + 6, 2.5);
    }
  }
}
// a vent: its iron wheel (turning while it opens), the door glowing by state ('r' ready, 'o' open, 's' shut, 'j' jammed)
export function drawVent(ctx, i, st, t, open = 0) {
  const v = VENTS[i], spin = st === 'o' ? t * 8 : open * 3;
  if (st === 'o') glow(ctx, v.x - v.side * 10, v.y, 70, 60, HOT, 0.6 + 0.2 * Math.sin(t * 20));
  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.strokeStyle = st === 'j' ? '#2a1a16' : st === 's' ? '#6a4030' : '#c08a5a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 3;
  for (let k = 0; k < 4; k++) {
    const a = spin + (k / 4) * TAU;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
    ctx.stroke();
  }
  if (st === 'j') { // (jammed: a bar of slag fused across it)
    ctx.strokeStyle = '#ff6a2a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-22, -10);
    ctx.lineTo(22, 10);
    ctx.stroke();
  }
  ctx.restore();
}

// ——— Typhon ———
// (ctx, w, h, st): feet at the origin (the floor in the hearth), facing +x. Only as much of it is out of the hearth as
// the phase has pushed up (look.rise; clipped at the floor): a hunched giant of black basalt and slag cracked with orange
// light, a mane of smoke, four burning eyes in a face like a cooling ingot, two huge forearms, and behind the grille of its
// ribs the tooth glowing gold-white (the weak point while it inhales: MOBS.typhon.weak's spot). Phase 4: the coils lie
// out along the floor behind it.
const BASALT = '#2a2022', BASALT_L = '#4a3a38', INK = '#0c0606';
function drawTyphon(ctx, w, h, st) {
  const t = st.t, dying = st.dying ?? 0, rise = clamp(look.rise, 0, 1), pr = clamp(look.pr / 100, 0, 1), b = look.breath ?? 0.5;
  const sink = (1 - rise) * h; // (how far down in the hearth it is)
  const heat = 0.35 + 0.45 * pr + 0.2 * b;
  ctx.save();
  // phase 4: the coils along the floor (behind it, both ways)
  if (look.ph >= 3 && look.po !== 'freed') {
    for (const s of [-1, 1]) {
      ctx.fillStyle = BASALT;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      for (let k = 0; k <= 10; k++) {
        const x = s * (k * 34), y = -26 + Math.sin(t * 2 + k * 0.9) * 8 + k * 1.6;
        ctx.lineTo(x, y - (24 - k * 1.6));
      }
      for (let k = 10; k >= 0; k--) ctx.lineTo(s * (k * 34), 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,140,50,${0.4 * heat})`;
      ctx.lineWidth = 2;
      for (let k = 1; k < 10; k += 2) {
        ctx.beginPath();
        ctx.moveTo(s * k * 34, -6);
        ctx.lineTo(s * (k * 34 + 10), -22);
        ctx.stroke();
      }
    }
  }
  ctx.beginPath();
  ctx.rect(-w * 2, -h * 2, w * 4, h * 2); // (clip at the floor: the rest of it is down in the hearth)
  ctx.clip();
  ctx.translate(0, sink);
  const breathe = b * 4, ribs = look.ribs;
  // the torso: hunched, wide at the shoulders
  const torso = () => {
    ctx.moveTo(-w * 0.34, 0);
    ctx.quadraticCurveTo(-w * 0.44, -h * 0.5, -w * 0.3, -h * 0.74 - breathe);
    ctx.quadraticCurveTo(0, -h * 0.86 - breathe, w * 0.3, -h * 0.74 - breathe);
    ctx.quadraticCurveTo(w * 0.44, -h * 0.5, w * 0.34, 0);
    ctx.closePath();
  };
  // the mane of smoke behind
  ctx.fillStyle = `rgba(60,50,52,${0.55 * (1 - dying)})`;
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI * 0.9 + (k / 6) * Math.PI * 0.8, r = w * 0.3 + Math.sin(t * 1.5 + k) * 6;
    circle(ctx, Math.cos(a) * r, -h * 0.82 + Math.sin(a) * r * 0.6, 26 + (k % 3) * 6);
  }
  ctx.fillStyle = BASALT;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  torso();
  ctx.fill();
  ctx.stroke();
  // cracks of light all over it, brighter with the pressure
  ctx.strokeStyle = `rgba(255,140,50,${heat})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (const [x0, y0, x1, y1] of [[-0.25, -0.2, -0.15, -0.45], [0.22, -0.15, 0.12, -0.4], [-0.08, -0.62, -0.18, -0.7], [0.1, -0.6, 0.2, -0.7], [-0.3, -0.5, -0.2, -0.58], [0.28, -0.48, 0.2, -0.3]]) {
    ctx.moveTo(x0 * w, y0 * h);
    ctx.lineTo((x0 + x1) * 0.5 * w + 6, (y0 + y1) * 0.5 * h);
    ctx.lineTo(x1 * w, y1 * h);
  }
  ctx.stroke();
  // the chest: a grille of its ribs, and behind it the tooth (gold-white; the ribs spread when it inhales)
  const cx = w * 0.1, cy = -h * 0.62;
  glow(ctx, cx, cy, 40 + ribs * 30, 34 + ribs * 24, '255,236,170', 0.5 + 0.4 * pr + 0.4 * ribs);
  ctx.fillStyle = '#fff4c8';
  ctx.strokeStyle = '#a8742a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.save();
  ctx.translate(cx, cy + 12);
  toothPath(ctx, 0, 0, 30, 24);
  ctx.restore();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#7a4a1a'; // (the mark burnt on it: a hammer over a flame, shown, never named)
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + 2);
  ctx.lineTo(cx + 5, cy + 2);
  ctx.moveTo(cx, cy + 2);
  ctx.lineTo(cx, cy + 8);
  ctx.stroke();
  ctx.strokeStyle = BASALT_L;
  ctx.lineWidth = 6;
  for (let k = -2; k <= 2; k++) {
    const spread = 1 + ribs * 1.6;
    ctx.beginPath();
    ctx.moveTo(cx + k * 9 * spread, cy - 22);
    ctx.quadraticCurveTo(cx + k * 13 * spread, cy, cx + k * 9 * spread, cy + 22);
    ctx.stroke();
  }
  // the head: a face like a cooling ingot, four burning eyes
  const hx = w * 0.04, hy = -h * 0.86 - breathe;
  ctx.fillStyle = '#3a2c2a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(hx - 44, hy - 40, 88, 64, 16);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,150,60,${heat})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hx - 30, hy + 14);
  ctx.lineTo(hx + 30, hy + 14);
  ctx.stroke();
  const eyesOpen = look.po === 'freed' ? clamp(1 - dying * 2, 0, 1) * 0.2 : look.po === 'stag' ? 0.4 : 1;
  for (const [ex, ey] of [[-22, -20], [10, -22], [-14, -4], [20, -6]]) {
    glow(ctx, hx + ex, hy + ey, 16, 12, '255,170,60', 0.7 * eyesOpen);
    ctx.fillStyle = `rgba(255,236,170,${eyesOpen})`;
    ctx.beginPath();
    ctx.ellipse(hx + ex, hy + ey, 6, 4 * eyesOpen + 0.5, 0, 0, TAU);
    ctx.fill();
  }
  // the forearms: the back one braced on the hearth's lip, the front one raised to hammer (or lying on the floor, steaming)
  const arm = clamp(look.arm, 0, 1), rest = clamp(look.rest, 0, 1);
  const drawArm = (sx, front) => {
    const shx = sx * w * 0.3, shy = -h * 0.66 - breathe;
    let fx = sx * w * 0.5, fy = -18;
    if (front) {
      fx += (w * 0.1) * arm + w * 0.35 * rest;
      fy += (-h * 0.75) * arm + 6 * rest + sink * rest;
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 46;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shx, shy);
    ctx.quadraticCurveTo((shx + fx) / 2 + sx * 30, (shy + fy) / 2, fx, fy);
    ctx.stroke();
    ctx.strokeStyle = BASALT_L;
    ctx.lineWidth = 38;
    ctx.stroke();
    ctx.fillStyle = BASALT;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(fx - 34, fy - 30, 68, 50, 18);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,140,50,${heat * (front && arm > 0.5 ? 1.3 : 1)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = -1; k <= 1; k++) {
      ctx.moveTo(fx + k * 16, fy - 26);
      ctx.lineTo(fx + k * 16, fy - 10);
    }
    ctx.stroke();
    if (front && rest > 0.5) { // (steam off the arm lying on the floor)
      ctx.fillStyle = 'rgba(200,190,190,0.3)';
      for (let k = 0; k < 3; k++) circle(ctx, fx - 20 + k * 20, fy - 40 - ((t * 30 + k * 13) % 40), 8 + k * 2);
    }
  };
  drawArm(-1, false);
  drawArm(1, true);
  ctx.restore();
  return () => {
    ctx.save();
    ctx.translate(0, sink);
    torso();
    ctx.restore();
  };
}
export const BOSS_ART = { typhon: drawTyphon };

// ——— its ultimates (FX2: dens.js spawns `${kind}Warn` / `${kind}Hit`) ———
function safeTag(ctx, x, y, time) {
  const bounce = Math.abs(Math.sin(time * 5)) * 4;
  ctx.fillStyle = 'rgba(120,240,160,0.95)';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 24, y - 11 - bounce, 48, 20, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'SAFE', x, y - 0.5 - bounce, 12, '#1e4a30');
}
// Eruption: the whole floor starts to glow; the dark plates (u.dark) and every crusted one (live) stay dark, marked SAFE
function eruptionWarn(ctx, e, k) {
  const pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 12 * k));
  for (let i = 0; i < PLATES; i++) {
    const x = i * PLATE_W, safe = (e.dark ?? []).includes(i) || look.crusted[i];
    if (safe) {
      glow(ctx, x + PLATE_W / 2, GROUND - 40, PLATE_W * 0.6, 70, '140,255,190', 0.35 + 0.2 * pulse);
      ctx.strokeStyle = `rgba(150,255,180,${0.6 + 0.35 * pulse})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(x + 6, GROUND - 240, PLATE_W - 12, 240);
      ctx.setLineDash([]);
      safeTag(ctx, x + PLATE_W / 2, GROUND - 130, e.t);
    } else {
      ctx.fillStyle = `rgba(255,110,40,${0.1 + 0.25 * k * pulse})`;
      ctx.fillRect(x + 2, GROUND - 260 * k, PLATE_W - 4, 260 * k);
    }
  }
}
function eruptionHit(ctx, e, k) {
  const up = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85, safe = e.safe ?? [];
  for (let i = 0; i < PLATES; i++) {
    if (safe.includes(i)) continue;
    const x = plateMid(i), hh = up * (300 + ((i * 53) % 90));
    const g = ctx.createLinearGradient(0, GROUND - hh, 0, GROUND);
    g.addColorStop(0, 'rgba(255,220,120,0)');
    g.addColorStop(0.3, 'rgba(255,170,60,0.85)');
    g.addColorStop(1, 'rgba(255,90,30,0.95)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - PLATE_W * 0.42, GROUND);
    ctx.quadraticCurveTo(x - PLATE_W * 0.2, GROUND - hh * 0.6, x + Math.sin(e.t * 9 + i) * 10, GROUND - hh);
    ctx.quadraticCurveTo(x + PLATE_W * 0.2, GROUND - hh * 0.6, x + PLATE_W * 0.42, GROUND);
    ctx.fill();
  }
}
// The Last Pour: the ladle swings toward one end; chevrons show which way the iron will run; the far high ledge and every
// crusted plate are SAFE (the wave itself is live: src/typhon.js)
function lastpourWarn(ctx, e, k) {
  const dir = e.dir ?? 1, pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 12 * k));
  ctx.fillStyle = `rgba(255,170,80,${0.4 + 0.3 * pulse})`;
  for (let x = 120; x < FIN_W; x += 220) {
    ctx.beginPath();
    ctx.moveTo(x - dir * 14, GROUND - 60);
    ctx.lineTo(x + dir * 14, GROUND - 48);
    ctx.lineTo(x - dir * 14, GROUND - 36);
    ctx.lineTo(x - dir * 6, GROUND - 48);
    ctx.fill();
  }
  const p = TYPHON_PLATFORMS[dir > 0 ? HIGH_E : HIGH_W];
  glow(ctx, p.x + p.w / 2, p.y - 30, p.w * 0.8, 60, '140,255,190', 0.45 + 0.2 * pulse);
  ctx.strokeStyle = `rgba(150,255,180,${0.6 + 0.35 * pulse})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(p.x, p.y - 110, p.w, 110);
  ctx.setLineDash([]);
  safeTag(ctx, p.x + p.w / 2, p.y - 130, e.t);
  for (let i = 0; i < PLATES; i++) if (look.crusted[i]) safeTag(ctx, plateMid(i), GROUND - 60, e.t + i);
}
function lastpourHit(ctx, e, k) {
  const flash = k < 0.1 ? k / 0.1 : clamp(1 - (k - 0.1) / 0.3, 0, 1);
  if (flash > 0.01) {
    ctx.fillStyle = `rgba(255,170,80,${0.15 * flash})`;
    ctx.fillRect(0, 0, FIN_W, GROUND + 4);
  }
}
export const FX2 = {
  eruptionWarn: { dur: 4, draw: eruptionWarn },
  eruptionHit: { dur: 1.4, draw: eruptionHit },
  lastpourWarn: { dur: 4, draw: lastpourWarn },
  lastpourHit: { dur: 1, draw: lastpourHit },
};
