// Docs: docs/places/typhon.md, docs/performance.md
// The Hearth (room 65, theme 'hearth'): Typhon's den at the foot of the Long Flue (E5 (c), story/e5-plan.md), and Typhon
// itself, the Buried Fire; its two ultimates' effects; the floor plates, the vents, the molten iron. The first forge,
// older than the Foundry above it: a vault of black basalt and soot-black brick with Keeper carving on the arches (teeth,
// a wheel), the great hearth pit at the back middle, an empty mould set in the floor (a gear-tooth's print, one short),
// four old furnace doors in the side walls (the vents), low brick ledges, a high one at each end, and the rusted gantry
// of a ladle-crane overhead. dens.js imports this file (DEN_ART, BOSS_ART, FX2), so it must NOT import dens.js.
// E5 (c2) polished c1's stand-in shapes: Typhon's eased poses, its cracks, coils and arms; the coils moving under the
// plates; the den's carving, chains and tools. The den's static layer is baked (as Fenrir's), and the plates' four looks
// are baked once each and stamped (docs/performance.md).
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
// breathing, eased), rise: how far out of the hearth (eased), hx: where its last Hammer lands (the fist lies there)
const look = { po: 'sunk', ph: 0, pr: 0, enr: false, plates: Array(PLATES).fill('c'), crusted: Array(PLATES).fill(false), rise: 0.2, arm: 0, rest: 0, ribs: 0, freed: 0, hx: null };
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
  // the hearth's mouth: an arch of wedge bricks, the mortar between them glowing, a Keeper wheel at its crown
  for (let k = 0; k <= 14; k++) { // (along the mouth's curve: a quadratic from (±236, 200) through the control (0, 32))
    const u = k / 14, x = TY_MID - 236 + 472 * u, y = (1 - u) * (1 - u) * 200 + 2 * u * (1 - u) * 32 + u * u * 200;
    const a = Math.atan2(2 * (1 - u) * (32 - 200) + 2 * u * (200 - 32), 472);
    ctx.save();
    ctx.translate(x, y - 6);
    ctx.rotate(a);
    ctx.fillStyle = k % 2 ? '#3a221a' : '#2e1a14';
    ctx.strokeStyle = 'rgba(255,130,50,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-16, -14, 32, 26, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(190,140,90,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(TY_MID, 66, 16, 0, TAU);
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU;
    ctx.moveTo(TY_MID, 66);
    ctx.lineTo(TY_MID + Math.cos(an) * 16, 66 + Math.sin(an) * 16);
  }
  ctx.stroke();
  // soot streaks up the walls over the hearth and the vents
  for (const [x, y, ww] of [[TY_MID - 120, 120, 60], [TY_MID + 110, 110, 70], ...VENTS.map((v) => [v.x + v.side * -10, v.y - 40, 50])]) {
    const sg = ctx.createLinearGradient(0, y - 120, 0, y);
    sg.addColorStop(0, 'rgba(0,0,0,0)');
    sg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(x - ww / 2, y);
    ctx.quadraticCurveTo(x - ww * 0.2, y - 80, x, y - 130);
    ctx.quadraticCurveTo(x + ww * 0.2, y - 80, x + ww / 2, y);
    ctx.fill();
  }
  // the smiths' tools left on the wall either side of the hearth: a rack of tongs and hammers, rusting
  for (const rx of [445, FIN_W - 445]) {
    ctx.fillStyle = '#2a1c18';
    ctx.fillRect(rx - 50, 160, 100, 8);
    for (let k = 0; k < 4; k++) {
      const x = rx - 36 + k * 24;
      ctx.strokeStyle = '#3e2c26';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, 168);
      ctx.lineTo(x, 240 + (k % 2) * 16);
      ctx.stroke();
      ctx.fillStyle = '#4a3630';
      if (k % 2) { // (tongs: two jaws)
        ctx.beginPath();
        ctx.moveTo(x - 6, 254);
        ctx.lineTo(x, 238);
        ctx.lineTo(x + 6, 254);
        ctx.lineWidth = 3;
        ctx.stroke();
      } else ctx.fillRect(x - 12, 232, 24, 14); // (a hammer's head)
    }
  }
  // chains hanging off the crane's rail, one with an empty hook
  for (const [x, len] of [[372, 130], [590, 90], [910, 110], [1128, 150]]) {
    ctx.strokeStyle = '#2e201c';
    ctx.lineWidth = 3;
    for (let y = 106; y < 106 + len; y += 10) {
      ctx.beginPath();
      ctx.ellipse(x, y + 5, 3, 5, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + 6, 106 + len + 6, 8, Math.PI, Math.PI * 0.2, true);
    ctx.stroke();
  }
  // the old marks of its fists in the side walls, cracked round
  for (const [x, y] of [[140, 300], [FIN_W - 150, 290]]) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, 34, 26, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const an = (k / 6) * TAU + 0.3;
      ctx.moveTo(x + Math.cos(an) * 32, y + Math.sin(an) * 24);
      ctx.lineTo(x + Math.cos(an) * 42, y + Math.sin(an) * 32);
    }
    ctx.stroke();
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
  // the seams between the plates glow with the heat under them (more with the pressure); from phase 2 its coils slide
  // under the floor, seen as a dark shape crossing the plates' faces with light in the gaps between its scales
  const pr = clamp(look.pr / 100, 0, 1), alive = look.po !== 'freed';
  if (alive) {
    ctx.strokeStyle = `rgba(255,150,60,${0.2 + 0.35 * pr + 0.1 * (look.breath ?? 0.5)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 1; i < PLATES; i++) {
      ctx.moveTo(i * PLATE_W, GROUND);
      ctx.lineTo(i * PLATE_W, GROUND + PH);
    }
    ctx.stroke();
  }
  if (alive && look.ph >= 1 && look.ph <= 2) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, GROUND + 2, FIN_W, PH - 2);
    ctx.clip();
    for (const c of [0, 1]) {
      const span = FIN_W + 900, dir = c ? -1 : 1, x0 = ((((t * 70 * dir + c * 800) % span) + span) % span) - 450, len = 420;
      ctx.fillStyle = 'rgba(8,3,2,0.5)';
      ctx.beginPath();
      for (let k = 0; k <= 12; k++) ctx[k ? 'lineTo' : 'moveTo'](x0 + (k / 12) * len, GROUND + 12 + Math.sin(t * 2 + k * 0.7) * 4 - Math.sin((k / 12) * Math.PI) * 4);
      for (let k = 12; k >= 0; k--) ctx.lineTo(x0 + (k / 12) * len, GROUND + 36 + Math.sin(t * 2 + k * 0.7) * 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,140,50,0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = 1; k < 12; k++) {
        const x = x0 + (k / 12) * len, y = GROUND + 24 + Math.sin(t * 2 + k * 0.7) * 3;
        ctx.moveTo(x - 10, y - 8);
        ctx.quadraticCurveTo(x, y + 2, x + 10, y - 8);
      }
      ctx.stroke();
    }
    ctx.restore();
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
// (ctx, w, h, st, m): feet at the origin (the floor in the hearth), facing +x. Only as much of it is out of the hearth as
// the phase has pushed up (look.rise; clipped at the floor, a collar of molten iron where it goes in): a hunched giant of
// black basalt and cooled slag, cracked all over with orange light that brightens with the pressure and every breath, a
// shaggy mane of smoke, four burning eyes under a heavy brow in a face like a cooling ingot, a jaw that opens to roar,
// breathe fire and work the bellows, and two enormous forearms it uses like hammers (the back one braced on the hearth's
// lip, the front one raised and brought down on the mark: the fist then lies on the floor where it landed, steaming, the
// melee's opening). Behind the grille of its ribs the tooth glows gold-white (the weak point while it inhales:
// MOBS.typhon.weak's spot, w * 0.1, -h * 0.62: move one, move the other). Phase 4: the coils lie out along the floor.
// Every pose eases the same numbers (look: arm, rest, ribs, hunch, jaw, lean, raise), so it moves between poses.
const BASALT = '#2a2022', BASALT_L = '#3e3232', BASALT_H = '#5a4846', INK = '#0c0606', SLAG = '#4a3430', TOOTH_C = '255,236,170';
// columnar basalt facets and the crack network over the torso, in units of (w, h), seeded once
const frnd = mulberry32(6517);
const FACETS = Array.from({ length: 16 }, () => {
  const cx = (frnd() - 0.5) * 0.56, cy = -0.12 - frnd() * 0.58, r = 0.05 + frnd() * 0.04, n = 5 + Math.floor(frnd() * 2), a0 = frnd() * TAU;
  return { pts: Array.from({ length: n }, (_, k) => [cx + Math.cos(a0 + (k / n) * TAU) * r, cy + Math.sin(a0 + (k / n) * TAU) * r * 1.1]), a: 0.06 + frnd() * 0.1 };
});
const CRACKS = Array.from({ length: 11 }, () => {
  let x = (frnd() - 0.5) * 0.6, y = -0.08 - frnd() * 0.62;
  const pts = [[x, y]], n = 3 + Math.floor(frnd() * 3), dx = (frnd() - 0.5) * 0.08, dy = -0.04 - frnd() * 0.04;
  for (let k = 0; k < n; k++) pts.push([(x += dx + (frnd() - 0.5) * 0.06), (y += dy + (frnd() - 0.5) * 0.03)]);
  return { pts, ph: frnd() * TAU };
});
const DRIPS = [[-0.33, -0.66, 0], [0.31, -0.68, 1.7], [-0.18, -0.4, 3.1], [0.24, -0.3, 4.4]];
// eased pose numbers, by pose: hunch (shoulders down, head low), lean (head forward), jaw (open), raise (the back arm up:
// the Pour, the ladle), glare (the eyes flare)
const POSE = {
  sunk: { hunch: 0.6, lean: 0, jaw: 0, raise: 0, glare: 0 },
  idle: { hunch: 0.2, lean: 0, jaw: 0, raise: 0, glare: 0 },
  glare: { hunch: 0.35, lean: 1, jaw: 0.25, raise: 0, glare: 1 },
  hammerL: { hunch: 0, lean: 0.4, jaw: 0.5, raise: 0, glare: 0.5 },
  hammerR: { hunch: 0, lean: 0.4, jaw: 0.5, raise: 0, glare: 0.5 },
  restL: { hunch: 0.7, lean: 0.8, jaw: 0.1, raise: 0, glare: 0 },
  restR: { hunch: 0.7, lean: 0.8, jaw: 0.1, raise: 0, glare: 0 },
  coil: { hunch: 0.8, lean: 0.3, jaw: 0.3, raise: 0, glare: 0.3 },
  bellows: { hunch: 0, lean: -0.3, jaw: 0.8, raise: 0, glare: 0.2 },
  breath: { hunch: 0.3, lean: 1, jaw: 1, raise: 0, glare: 0.6 },
  pour: { hunch: 0, lean: -0.2, jaw: 0.4, raise: 1, glare: 0.3 },
  sweep: { hunch: 0.5, lean: 0.8, jaw: 0.6, raise: 0, glare: 0.6 },
  inhale: { hunch: 0, lean: -0.6, jaw: 0.9, raise: 0, glare: 0.4 },
  sink: { hunch: 0.6, lean: 0, jaw: 0.2, raise: 0, glare: 0.4 },
  stag: { hunch: 1, lean: 0.6, jaw: 0.3, raise: 0, glare: -0.7 },
  freed: { hunch: 0.5, lean: 0.2, jaw: 0, raise: 0, glare: -1 },
};
const pz = { hunch: 0.6, lean: 0, jaw: 0, raise: 0, glare: 0 };
let pzAt = -1;
function easePose(t) {
  const dt = pzAt < 0 ? 1 : clamp(t - pzAt, 0, 0.1);
  pzAt = t;
  const want = POSE[look.po] ?? POSE.idle;
  for (const k in pz) pz[k] += (want[k] - pz[k]) * Math.min(1, dt * (k === 'jaw' ? 8 : 4));
}
// a stroke laid twice: a wide soft glow and a thin hot core (the cracks, the seams)
function hotLine(ctx, path, heat, core = 2) {
  ctx.strokeStyle = `rgba(255,110,40,${0.35 * heat})`;
  ctx.lineWidth = core * 3.2;
  ctx.beginPath();
  path();
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,${180 + Math.round(60 * heat)},${90 + Math.round(70 * heat)},${Math.min(1, 0.4 + heat)})`;
  ctx.lineWidth = core;
  ctx.stroke();
}
// a limb: a tapered round-ended slab from (x0, y0) r0 to (x1, y1) r1, basalt, outlined, a crack down it
function limb(ctx, x0, y0, r0, x1, y1, r1, heat, t, k) {
  const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
  const shape = () => {
    ctx.moveTo(x0 + nx * r0, y0 + ny * r0);
    ctx.lineTo(x1 + nx * r1, y1 + ny * r1);
    ctx.arc(x1, y1, r1, a + Math.PI / 2, a - Math.PI / 2, true);
    ctx.lineTo(x0 - nx * r0, y0 - ny * r0);
    ctx.arc(x0, y0, r0, a - Math.PI / 2, a + Math.PI / 2, true);
    ctx.closePath();
  };
  ctx.fillStyle = BASALT_L;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  shape();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; // (its shadowed underside)
  ctx.beginPath();
  ctx.moveTo(x0 - nx * r0 * 0.2, y0 - ny * r0 * 0.2);
  ctx.lineTo(x1 - nx * r1 * 0.2, y1 - ny * r1 * 0.2);
  ctx.lineTo(x1 - nx * r1, y1 - ny * r1);
  ctx.lineTo(x0 - nx * r0, y0 - ny * r0);
  ctx.fill();
  const len = Math.hypot(x1 - x0, y1 - y0);
  hotLine(ctx, () => {
    for (let s = 0; s <= 4; s++) {
      const f = 0.15 + s * 0.17, j = Math.sin(k * 7 + s * 2.3) * 0.35;
      ctx[s ? 'lineTo' : 'moveTo'](x0 + (x1 - x0) * f + nx * j * (r0 + (r1 - r0) * f), y0 + (y1 - y0) * f + ny * j * (r0 + (r1 - r0) * f));
    }
  }, heat * (0.75 + 0.25 * Math.sin(t * 2 + k)), len > 140 ? 2.4 : 2);
}
// a fist: a great knuckled block of basalt at (x, y), knuckles toward +x rotated by a; glowing between the fingers
function fist(ctx, x, y, s, a, heat, hot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = BASALT;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-s * 0.55, -s * 0.5, s * 1.1, s, s * 0.28);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BASALT_H;
  for (let k = 0; k < 4; k++) { // (the knuckles)
    ctx.beginPath();
    ctx.roundRect(s * 0.22, -s * 0.46 + k * s * 0.235, s * 0.36, s * 0.21, s * 0.08);
    ctx.fill();
    ctx.stroke();
  }
  hotLine(ctx, () => {
    for (let k = 1; k < 4; k++) {
      ctx.moveTo(s * 0.2, -s * 0.46 + k * s * 0.235);
      ctx.lineTo(s * 0.56, -s * 0.46 + k * s * 0.235);
    }
  }, heat * (1 + hot), 1.6);
  ctx.beginPath(); // (the thumb over the front)
  ctx.ellipse(s * 0.05, -s * 0.48, s * 0.26, s * 0.13, -0.2, 0, TAU);
  ctx.fillStyle = BASALT_L;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();
  if (hot > 0.05) glow(ctx, s * 0.4, 0, s * 0.9, s * 0.8, EMBER, 0.5 * hot);
  ctx.restore();
}
function drawTyphon(ctx, w, h, st, m) {
  const t = st.t, dying = st.dying ?? 0, rise = clamp(look.rise, 0, 1), pr = clamp(look.pr / 100, 0, 1), b = look.breath ?? 0.5;
  easePose(st.time ?? t);
  const sink = (1 - rise) * h; // (how far down in the hearth it is)
  const enr = look.enr, out = look.po === 'freed' ? clamp(1 - dying * 1.5, 0, 1) : 1;
  const heat = clamp((0.35 + 0.4 * pr + 0.2 * b + (enr ? 0.25 : 0) + 0.25 * pz.glare) * out, 0.05, 1.3);
  const facing = (m?.facing ?? 1) >= 0 ? 1 : -1;
  ctx.save();
  // phase 4: the coils lie out along the floor both ways (stretched toward its front in the Sweep), scaled in slag
  if (look.ph >= 3 && look.po !== 'freed') drawCoils(ctx, w, t, heat, pz.lean);
  ctx.beginPath();
  ctx.rect(-FIN_W, -h * 2, FIN_W * 2, h * 2); // (clip at the floor: the rest of it is down in the hearth)
  ctx.clip();
  // where it goes into the floor: a collar of molten iron round its waist
  glow(ctx, 0, 0, w * 0.6, 40, HOT, 0.55 * out + 0.2 * pr);
  ctx.translate(0, sink);
  const breathe = b * 4 + (look.po === 'bellows' ? b * 6 : 0), hun = pz.hunch * 18, ribs = look.ribs;
  const shY = -h * 0.7 - breathe + hun; // (the shoulders' line)
  // the mane of smoke behind: big soft puffs rolling up off its shoulders and head, lit from below
  for (let k = 0; k < 11; k++) {
    const a = -Math.PI * 0.95 + (k / 10) * Math.PI * 0.9, ph = (t * 0.25 + k * 0.37) % 1, r = w * (0.3 + 0.08 * Math.sin(t * 1.3 + k));
    const x = Math.cos(a) * r * 1.1, y = -h * 0.8 + hun + Math.sin(a) * r * 0.7 - ph * 30;
    ctx.fillStyle = `rgba(${48 + (k % 3) * 8},${40 + (k % 3) * 6},${42 + (k % 3) * 6},${(0.6 - ph * 0.35) * out})`;
    circle(ctx, x, y, 24 + (k % 3) * 8 + ph * 14);
  }
  glow(ctx, 0, -h * 0.82 + hun, w * 0.42, h * 0.22, EMBER, 0.12 * heat);
  // the back arm: braced on the hearth's lip behind it (raised toward the ladle for the Pour)
  const raise = pz.raise;
  const bShX = -w * 0.34, bFx = -w * 0.62 + raise * w * 0.2, bFy = -32 - raise * (h - 32);
  const bEx = (bShX + bFx) / 2 - w * 0.12, bEy = (shY + bFy) / 2 + (raise ? -raise * 40 : 30);
  limb(ctx, bShX, shY + 10, 30, bEx, bEy, 26, heat * 0.8, t, 1);
  limb(ctx, bEx, bEy, 28, bFx, bFy, 36, heat * 0.8, t, 2);
  fist(ctx, bFx, bFy, 64, raise ? -Math.PI / 2 : Math.PI, heat * 0.8, 0);
  // the torso: hunched, huge at the shoulders, narrowing into the hearth
  const torso = () => {
    ctx.moveTo(-w * 0.3, 0);
    ctx.quadraticCurveTo(-w * 0.42, -h * 0.4, -w * 0.4, shY + 18);
    ctx.quadraticCurveTo(-w * 0.38, shY - 22, -w * 0.18, shY - 16);
    ctx.quadraticCurveTo(0, shY - 30 - breathe * 0.5, w * 0.2, shY - 16);
    ctx.quadraticCurveTo(w * 0.4, shY - 22, w * 0.42, shY + 18);
    ctx.quadraticCurveTo(w * 0.44, -h * 0.4, w * 0.3, 0);
    ctx.closePath();
  };
  ctx.fillStyle = BASALT;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  torso();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  torso();
  ctx.clip();
  // columnar basalt facets, a slag skin round the waist, light from below
  for (const f of FACETS) {
    ctx.fillStyle = `rgba(110,90,86,${f.a})`;
    ctx.beginPath();
    f.pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x * w, y * h + hun * 0.6));
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = SLAG;
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, 0);
  for (let k = 0; k <= 12; k++) ctx.lineTo(-w * 0.5 + (k / 12) * w, -h * 0.14 - Math.sin(k * 1.7) * 10 - (k % 2) * 8);
  ctx.lineTo(w * 0.5, 0);
  ctx.fill();
  glow(ctx, 0, 0, w * 0.5, h * 0.3, EMBER, 0.25 + 0.3 * pr);
  // the cracks: a network of light all over it, brighter with the pressure and with each breath
  for (const c of CRACKS) {
    hotLine(ctx, () => c.pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x * w, y * h + hun * 0.6)), heat * (0.7 + 0.3 * Math.sin(t * 1.6 + c.ph)), 2.2);
  }
  ctx.restore();
  // shoulder boulders (pauldrons of rock)
  for (const s of [-1, 1]) {
    ctx.fillStyle = BASALT_L;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(s * w * 0.33, shY + 2, w * 0.13, h * 0.09, s * 0.3, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(140,116,110,0.25)';
    ellipse(ctx, s * w * 0.31, shY - 6, w * 0.07, h * 0.035, s * 0.3);
  }
  // slag dripping off it: a bead swells at a ledge of rock, stretches, falls and fades
  for (const [dx, dy, ph] of DRIPS) {
    const k = ((t * 0.35 + ph) % 1), x = dx * w, y0 = dy * h + hun * 0.6;
    if (k < 0.6) {
      ctx.fillStyle = `rgba(255,${150 + 60 * heat},70,${0.9 * out})`;
      ellipse(ctx, x, y0 + k * 8, 3 + k * 2, 3 + k * 6);
    } else {
      const f = (k - 0.6) / 0.4;
      ctx.fillStyle = `rgba(255,160,70,${(1 - f) * out})`;
      circle(ctx, x, y0 + 12 + f * f * 120, 3);
    }
  }
  // the chest: a grille of its ribs, and behind it the tooth (gold-white; the ribs spread open when it inhales)
  const cx = w * 0.1, cy = -h * 0.62 + hun * 0.4;
  ctx.fillStyle = '#140a08';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 34 + ribs * 16, 30 + ribs * 8, 0, 0, TAU);
  ctx.fill();
  glow(ctx, cx, cy, 44 + ribs * 40, 38 + ribs * 30, TOOTH_C, (0.45 + 0.35 * pr + 0.5 * ribs) * out);
  if (ribs > 0.3) { // (light pouring out between the ribs)
    ctx.fillStyle = `rgba(255,240,190,${0.18 * ribs})`;
    for (const a of [-0.5, -0.2, 0.15, 0.45]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 160, cy + Math.sin(a) * 160 - 30);
      ctx.lineTo(cx + Math.cos(a + 0.1) * 160, cy + Math.sin(a + 0.1) * 160 - 30);
      ctx.fill();
    }
  }
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
  ctx.moveTo(cx - 5, cy + 1);
  ctx.lineTo(cx + 5, cy + 1);
  ctx.moveTo(cx, cy + 1);
  ctx.lineTo(cx, cy + 5);
  ctx.moveTo(cx - 3, cy + 9);
  ctx.quadraticCurveTo(cx, cy + 3, cx + 3, cy + 9);
  ctx.stroke();
  for (let k = -2; k <= 2; k++) { // (the ribs: thick curved bars of basalt, outlined)
    const spread = 1 + ribs * 1.7, x0 = cx + k * 10 * spread, bow = k * 6 * spread;
    for (const [lw, col] of [[10, INK], [6, BASALT_H]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0 - k * 2, cy - 24);
      ctx.quadraticCurveTo(x0 + bow, cy, x0 - k * 2, cy + 24);
      ctx.stroke();
    }
  }
  // the head: a face like a cooling ingot under a crag of slag, a heavy brow over four eyes, a jaw that opens
  const hx = w * 0.04 + pz.lean * 22, hy = -h * 0.86 - breathe + hun * 1.6 + pz.lean * 10;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(pz.lean * 0.12 - (look.po === 'inhale' ? 0.18 : 0));
  const jaw = pz.jaw * 22;
  // the jaw (under the face; its mouth glows from the fire inside)
  ctx.fillStyle = '#2e2224';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-36, 6 + jaw * 0.3, 74, 28 + jaw * 0.4, [4, 4, 14, 14]);
  ctx.fill();
  ctx.stroke();
  if (jaw > 2) {
    glow(ctx, 6, 16 + jaw * 0.5, 50, 20 + jaw, HOT, 0.6 * pz.jaw * out);
    ctx.fillStyle = `rgba(255,${190 + 40 * heat},110,${0.95 * out})`;
    ctx.beginPath();
    ctx.roundRect(-26, 10, 58, jaw * 0.8, 4);
    ctx.fill();
    ctx.fillStyle = '#4a3a38'; // (blunt teeth, top and bottom)
    for (let k = 0; k < 5; k++) {
      ctx.fillRect(-24 + k * 12, 10, 7, 4);
      ctx.fillRect(-22 + k * 12, 10 + jaw * 0.8 - 4, 7, 4);
    }
  }
  // the face: the ingot, bevelled at the top, a crag of slag on its crown
  ctx.fillStyle = '#3a2c2a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-44, 14);
  ctx.lineTo(-48, -22);
  ctx.lineTo(-34, -44);
  ctx.lineTo(34, -46);
  ctx.lineTo(50, -24);
  ctx.lineTo(46, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(120,98,92,0.25)';
  ctx.beginPath();
  ctx.moveTo(-34, -44);
  ctx.lineTo(34, -46);
  ctx.lineTo(40, -36);
  ctx.lineTo(-38, -34);
  ctx.fill();
  ctx.fillStyle = SLAG;
  ctx.beginPath();
  ctx.moveTo(-36, -42);
  for (let k = 0; k <= 8; k++) ctx.lineTo(-36 + k * 9, -48 - (k % 2 ? 12 + Math.sin(k * 3.1) * 5 : 2));
  ctx.lineTo(36, -44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  hotLine(ctx, () => { // (cracks across the face)
    ctx.moveTo(-40, -8);
    ctx.lineTo(-30, 2);
    ctx.lineTo(-34, 10);
    ctx.moveTo(30, -38);
    ctx.lineTo(24, -28);
    ctx.moveTo(42, 0);
    ctx.lineTo(34, 8);
  }, heat, 1.8);
  // the four eyes: two big ones, two smaller under them, slanted; they flare to glare, gutter when it staggers, shut freed
  const open = look.po === 'freed' ? clamp(1 - dying * 2, 0, 1) * 0.15 : clamp(1 + pz.glare * 0.6, 0.3, 1.4);
  for (const [ex, ey, r, sl] of [[-20, -18, 9, 0.25], [18, -19, 9, -0.25], [-14, -2, 6, 0.2], [14, -3, 6, -0.2]]) {
    glow(ctx, ex, ey, r * 2.6, r * 1.9, '255,170,60', 0.65 * Math.min(1, open) * out);
    ctx.fillStyle = '#120806';
    ctx.beginPath();
    ctx.ellipse(ex, ey, r + 2, (r * 0.6 + 2) * Math.min(1, open), sl, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `rgba(255,${200 + 40 * Math.min(1, open)},150,${Math.min(1, open)})`;
    ctx.beginPath();
    ctx.ellipse(ex, ey, r, r * 0.55 * open + 0.4, sl, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `rgba(255,255,240,${0.9 * Math.min(1, open)})`;
    circle(ctx, ex + 2, ey, r * 0.28);
  }
  ctx.fillStyle = '#2a1e1e'; // (the brow: a heavy ledge of rock over the top pair)
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-42, -26);
  ctx.quadraticCurveTo(-20, -40 + pz.glare * 6, 0, -28 + pz.glare * 4);
  ctx.quadraticCurveTo(20, -40 + pz.glare * 6, 44, -28);
  ctx.lineTo(42, -34);
  ctx.lineTo(-40, -32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (look.po === 'bellows' || look.po === 'stag') { // (smoke out of its mouth)
    for (let k = 0; k < 3; k++) {
      const f = (t * 0.8 + k / 3) % 1;
      ctx.fillStyle = `rgba(90,80,80,${0.5 * (1 - f)})`;
      circle(ctx, 20 + f * 40, 20 - f * 50, 6 + f * 14);
    }
  }
  ctx.restore();
  // the front arm: idle at its side; raised overhead to hammer; then lying out on the floor to the mark, steaming
  const arm = clamp(look.arm, 0, 1), rest = clamp(look.rest, 0, 1);
  const reach = look.hx != null && m ? clamp((look.hx - m.x) * facing, w * 0.45, FIN_W * 0.62) : w * 0.9;
  const fShX = w * 0.34, fShY = shY + 10;
  let fFx = w * 0.6 - pz.hunch * 6, fFy = -36;
  fFx += (w * 0.22 - fFx) * arm;
  fFy += (-h * 1.22 + hun - fFy) * arm;
  fFx += (reach - fFx) * rest;
  fFy += (-30 - sink - fFy) * rest; // (on the floor, wherever the body is in the hearth)
  const fEx = (fShX + fFx) / 2 + w * 0.1 * (1 - arm) - w * 0.04 * arm, fEy = (fShY + fFy) / 2 + 40 * (1 - arm) - 10 * rest - 30 * arm;
  limb(ctx, fShX, fShY, 32, fEx, fEy, 28, heat, t, 3);
  limb(ctx, fEx, fEy, 30, fFx, fFy, 40, heat * (1 + 0.5 * arm), t, 4);
  fist(ctx, fFx, fFy, 70, arm > 0.5 ? -Math.PI / 2 : 0, heat, arm * 0.9 + rest * 0.4);
  if (rest > 0.5) { // (steam off the arm lying on the floor)
    for (let k = 0; k < 4; k++) {
      const f = (t * 0.7 + k / 4) % 1, x = fEx + (fFx - fEx) * (k / 3);
      ctx.fillStyle = `rgba(200,190,190,${0.3 * (1 - f) * rest})`;
      circle(ctx, x, fFy - 40 - f * 60, 8 + f * 10);
    }
  }
  ctx.restore();
  return () => {
    ctx.save();
    ctx.translate(0, sink);
    torso();
    ctx.restore();
  };
}
// phase 4's coils: two great lengths of slag-scaled body lying along the floor from its waist, rolling slowly, glowing
// between the scales; stretched forward (toward +x) as it leans into the Sweep
function drawCoils(ctx, w, t, heat, lean) {
  for (const s of [-1, 1]) {
    const len = s > 0 ? 380 + lean * 120 : 340, n = 14, thick = (k) => 46 - k * 2.4;
    const pt = (k) => [s * (40 + (k / n) * len), -28 + Math.sin(t * 2 + k * 0.8 + (s > 0 ? 0 : 2)) * 6 + k * 1.2];
    // the body: a band through the points, its top edge the scales'
    ctx.fillStyle = BASALT;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let k = 0; k <= n; k++) {
      const [x, y] = pt(k);
      ctx[k ? 'lineTo' : 'moveTo'](x, y - thick(k) * 0.5);
    }
    const [tx, ty] = pt(n);
    ctx.quadraticCurveTo(tx + s * 30, ty, tx + s * 46, ty + 14); // (the tail's tip)
    for (let k = n; k >= 0; k--) ctx.lineTo(pt(k)[0], 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // slag scales along its back, glowing in the gaps
    for (let k = 0; k < n; k++) {
      const [x, y] = pt(k), r = thick(k) * 0.42;
      ctx.fillStyle = k % 2 ? BASALT_L : SLAG;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(x, y - thick(k) * 0.32, r, r * 0.6, 0, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      hotLine(ctx, () => {
        ctx.moveTo(x + s * r, y - thick(k) * 0.3);
        ctx.lineTo(x + s * r * 1.1, y + 2);
      }, heat * (0.6 + 0.4 * Math.sin(t * 3 + k)), 1.6);
    }
    glow(ctx, s * (40 + len * 0.5), 0, len * 0.55, 30, EMBER, 0.18 * heat);
  }
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
