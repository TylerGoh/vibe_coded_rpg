// Docs: docs/places/crossings.md
// A crossing room (ROOMS[…].crossing in src/shared/sim.js): the deck of the ferry Puddle Jumper under way.
// The deck is ordinary platforms (DECK_PLATFORMS); everything that moves is drawing only, driven by YOUR
// voyage clock (state.vt): the coast you left slides away astern, the open sea scrolls past (icebergs, then
// snow and the aurora on the cold route), and the coast you're bound for comes up over the bow. When the
// clock runs out she's in: the sea stills, a jetty lies alongside and the gangway goes down (the door's
// `after`). One room type, themed per route (`crossing.route`); 'cold' is the only route so far.
// This room paints its own sky.
import { W, H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DECK_W, DECK_GROUND, DECK_PLATFORMS, DECK_GANGWAY_X, roomDef, voyage } from './shared/sim.js';
import { drawLandmark } from './distant.js';

const GROUND = DECK_GROUND;
const HORIZON = 292;
const DIST = 9000; // how far the sea scrolls over a whole voyage (px, at the nearest wave row)
const COAST_AT = W * 0.42; // where a coast's sea edge sits on screen when you're right at it
const HELM_X = 190, PADDLE_X = 760, FUNNEL_X = 1010, MAST_X = 1255, BELL_X = 1420;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const plat = (kind) => DECK_PLATFORMS.find((p) => p.kind === kind);

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

const ISLAND_NAME = { green: 'Greenhollow', frost: 'Frostpeak' };
// The crossing a room is, plus how far along you are: k 0..1 (0 = just cast off), d the sea scrolled so far,
// u how far toward Frostpeak you are (0 = at Greenhollow, 1 = at Frostpeak: the cold route's palette)
export function crossingAt(room, me) {
  const c = roomDef(room)?.crossing;
  if (!c) return null;
  const k = me ? voyage(me) : 0;
  const ease = smooth(0, 1, k);
  return { ...c, k, d: DIST * ease, u: c.to === 'frost' ? k : 1 - k, docked: k >= 1, left: Math.max(0, Math.ceil((c.ticks - (me?.vt | 0)) / 60)) };
}
// "Frostpeak in 42 s" for the HUD
export const crossingLabel = (cr) => (cr.docked ? `In at ${ISLAND_NAME[cr.to]}` : `${ISLAND_NAME[cr.to]} in ${cr.left} s`);

// ——— seeded scenery ———
const clouds = (() => {
  const r = mulberry32(211);
  return Array.from({ length: 7 }, (_, i) => ({ x: i * 260 + r() * 140, y: 40 + r() * 120, s: 0.6 + r() * 0.6 }));
})();
const waves = (() => {
  const r = mulberry32(213);
  return Array.from({ length: 70 }, () => ({ x: r() * 2000, y: r(), w: 14 + r() * 30, p: r() * TAU }));
})();
// icebergs along the route: u is how far toward Frostpeak each one floats, y its depth (0 far, 1 near)
const bergs = (() => {
  const r = mulberry32(217);
  return Array.from({ length: 16 }, () => ({ u: 0.38 + r() * 0.6, y: r(), s: 0.5 + r() * 0.8, seed: Math.floor(r() * 1e6) }));
})();
const flakes = (() => {
  const r = mulberry32(219);
  return Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H, v: 30 + r() * 40, s: 1 + r() * 1.8, p: r() * TAU }));
})();
const gulls = (() => {
  const r = mulberry32(223);
  return Array.from({ length: 4 }, () => ({ off: r() * 1200, y: 80 + r() * 120, v: 14 + r() * 18, s: 0.7 + r() * 0.5, p: r() * TAU }));
})();

// Everything behind the slimes. me: your own state (for the voyage clock).
export function drawCrossing(ctx, room, camX, viewW, time, me) {
  const cr = crossingAt(room, me);
  if (!cr) return;
  ctx.save();
  ctx.translate(camX, 0); // sky, sea and coasts in screen space
  drawSea(ctx, cr, camX, time);
  ctx.restore();
  const L = camX - 80, R = camX + viewW + 80;
  drawShip(ctx, cr, L, R, time);
}

// In front of the slimes: the near water lapping over the hull's foot, the bow wave
export function drawCrossingFront(ctx, room, camX, viewW, time, me) {
  const cr = crossingAt(room, me);
  if (!cr) return;
  const speed = cr.docked ? 0 : Math.sin(Math.PI * Math.min(1, cr.k * 1.05));
  const top = GROUND + 62, col = mix('#7cc0d6', '#5d7f9e', cr.u);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(camX - 10, H);
  for (let x = Math.floor(camX / 30) * 30 - 30; x <= camX + viewW + 40; x += 30) {
    ctx.lineTo(x, top + Math.sin(x * 0.03 + time * 2 + cr.d * 0.02) * 3 + Math.sin(x * 0.011 - time) * 2);
  }
  ctx.lineTo(camX + viewW + 40, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let x = Math.floor((camX + cr.d * 0.9) / 70) * 70; x < camX + cr.d * 0.9 + viewW + 70; x += 70) {
    const sx = x - cr.d * 0.9;
    ctx.beginPath();
    ctx.roundRect(sx, top + 6 + Math.sin(x) * 4, 26 + (x % 3) * 8, 3, 2);
    ctx.fill();
  }
  // the bow wave and the paddle's wake, while she's moving
  if (speed > 0.05 && visible(DECK_W - 140, DECK_W + 40, camX, camX + viewW)) {
    ctx.fillStyle = `rgba(255,255,255,${0.75 * speed})`;
    for (let i = 0; i < 6; i++) {
      const ph = (time * 2.4 + i / 6) % 1;
      circle(ctx, DECK_W - 50 + ph * 40, top - 2 - Math.sin(ph * Math.PI) * 14 * speed, 6 + i);
    }
  }
  if (speed > 0.05 && visible(PADDLE_X - 200, PADDLE_X + 60, camX, camX + viewW)) {
    ctx.fillStyle = `rgba(255,255,255,${0.6 * speed})`;
    for (let i = 0; i < 8; i++) {
      const ph = (time * 1.6 + i / 8) % 1;
      ellipse(ctx, PADDLE_X - 40 - ph * 160, top + 4, 14 * (1 - ph) + 4, 3);
    }
  }
}

function drawSea(ctx, cr, camX, time) {
  const u = cr.u, cold = smooth(0.3, 0.9, u);
  const swell = Math.sin(time * 0.8) * 3; // the horizon rises and falls a little: she's at sea
  const hz = HORIZON + swell;
  const sky = ctx.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, mix('#9fd2f2', '#5f6f9e', cold));
  sky.addColorStop(0.6, mix('#cfe9f6', '#a7b4d6', cold));
  sky.addColorStop(1, mix('#fbeee4', '#e4dcea', cold));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, hz + 1);
  // the sun, paling as it gets colder
  const sx = W - 170 - camX * 0.01, sy = 88 + cold * 20;
  const g = ctx.createRadialGradient(sx, sy, 14, sx, sy, 120);
  g.addColorStop(0, `rgba(255,248,214,${0.85 - cold * 0.55})`);
  g.addColorStop(1, 'rgba(255,248,214,0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx - 120, sy - 120, 240, 240);
  ctx.fillStyle = mix('#fff6d0', '#e8ecf6', cold);
  circle(ctx, sx, sy, 30);
  // the aurora, growing overhead as Frostpeak nears
  const au = smooth(0.45, 1, u);
  if (au > 0.01) {
    ctx.globalAlpha = 0.3 * au;
    for (const [c, off, y0] of [['#8fffd0', 0, 70], ['#c4a0ff', 2, 100], ['#9fd8ff', 4, 52]]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 40) {
        const y = y0 + Math.sin(x * 0.006 + time * 0.3 + off) * 26 + Math.sin(x * 0.013 - time * 0.2) * 10;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      for (let x = W; x >= 0; x -= 40) ctx.lineTo(x, y0 + 30 + Math.sin(x * 0.006 + time * 0.3 + off + 0.6) * 26);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // the two islands' landmarks on the horizon: the one astern shrinking, the one ahead growing
  const haze = mix('#fbeee4', '#e4dcea', cold);
  const from = cr.from, to = cr.to;
  ctx.save();
  ctx.globalAlpha = smooth(0.08, 0.3, cr.k);
  drawLandmark(ctx, from, 150 - camX * 0.02, hz, 1.3 - 0.8 * cr.k, { time, haze, fade: 0.25 + 0.4 * cr.k, sky: 200, night: au });
  ctx.globalAlpha = 1 - smooth(0.88, 0.98, cr.k);
  drawLandmark(ctx, to, W - 210 - camX * 0.02, hz, 0.45 + 0.9 * cr.k, { time, haze, fade: 0.65 - 0.45 * cr.k, sky: 200, night: au });
  ctx.restore();
  // clouds drifting astern
  const off = (cr.d * 0.04 + time * 4 + camX * 0.04) % 1800;
  ctx.fillStyle = cold > 0.5 ? 'rgba(236,240,250,0.8)' : 'rgba(255,255,255,0.88)';
  for (const c of clouds) {
    for (const x of [c.x - off, c.x - off + 1800]) {
      if (x < -150 || x > W + 60) continue;
      circle(ctx, x, c.y, 20 * c.s);
      circle(ctx, x + 24 * c.s, c.y - 9 * c.s, 26 * c.s);
      circle(ctx, x + 52 * c.s, c.y, 20 * c.s);
      ctx.beginPath();
      ctx.roundRect(x - 4 * c.s, c.y - 4 * c.s, 60 * c.s, 24 * c.s, 12 * c.s);
      ctx.fill();
    }
  }
  // the water: greener at home, grey-blue and darker in the north
  const sea = ctx.createLinearGradient(0, hz, 0, H);
  sea.addColorStop(0, mix('#cfe6ee', '#c4cfe2', cold));
  sea.addColorStop(0.35, mix('#9ccfe0', '#8aa0c0', cold));
  sea.addColorStop(1, mix('#6fb2cc', '#5a7698', cold));
  ctx.fillStyle = sea;
  ctx.fillRect(0, hz, W, H - hz);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(0, hz, W, 1.5);
  // the coasts: the one you left slides away astern, the one you're bound for comes up ahead
  const leave = COAST_AT - cr.d, reach = COAST_AT + (DIST - cr.d);
  if (leave > -40) drawCoast(ctx, from, leave, hz, -1, time);
  if (reach < W + 40) drawCoast(ctx, to, reach, hz, 1, time);
  // icebergs, further apart and smaller far out
  for (const b of bergs) {
    if (b.u < 0.4) continue;
    const at = cr.to === 'frost' ? b.u : 1 - b.u; // its place along this voyage, 0..1
    const f = 0.35 + b.y * 0.65; // nearer bergs slide faster
    const x = COAST_AT + (at * DIST - cr.d) * f;
    if (x < -120 || x > W + 120) continue;
    const y = hz + 8 + b.y * b.y * (GROUND - hz - 40);
    drawBerg(ctx, x, y + Math.sin(time * 0.9 + b.seed) * 1.5, b.s * (0.5 + b.y * 0.7), b.seed, cold);
  }
  // wave glints, sliding astern faster the nearer they are
  for (const wv of waves) {
    const y = hz + 6 + wv.y * wv.y * (GROUND - hz - 10);
    const f = 0.12 + wv.y * 0.6;
    const x = (((wv.x - cr.d * f - camX * f * 0.5 + Math.sin(time * 0.6 + wv.p) * 8) % 2000) + 2000) % 2000 - 200;
    if (x < -40 || x > W + 40) continue;
    ctx.globalAlpha = 0.22 + 0.33 * (0.5 + 0.5 * Math.sin(time * 1.6 + wv.p));
    ctx.fillStyle = cold > 0.6 ? '#eef2fa' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, wv.w * (0.5 + wv.y), 2 + wv.y * 1.5, 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // gulls follow her out of Greenhollow and meet her coming home
  const gk = 1 - smooth(0.12, 0.35, u);
  if (gk > 0.01) {
    ctx.strokeStyle = `rgba(125,138,154,${gk})`;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (const gu of gulls) {
      const x = ((gu.off + time * gu.v - camX * 0.2) % 1200 + 1200) % 1200 - 120;
      const y = gu.y + Math.sin(time * 0.7 + gu.p) * 12, fl = Math.sin(time * 5 + gu.p) * 4 * gu.s;
      ctx.beginPath();
      ctx.moveTo(x - 11 * gu.s, y - fl);
      ctx.quadraticCurveTo(x - 5 * gu.s, y - 6 * gu.s, x, y);
      ctx.quadraticCurveTo(x + 5 * gu.s, y - 6 * gu.s, x + 11 * gu.s, y - fl);
      ctx.stroke();
    }
  }
  // snow, as she comes into the north
  const sn = smooth(0.6, 0.95, u);
  if (sn > 0.01) {
    ctx.fillStyle = `rgba(255,255,255,${0.85 * sn})`;
    for (const f of flakes) {
      const y = (f.y + time * f.v) % H;
      const x = (((f.x + Math.sin(time + f.p) * 14 - time * 30 - cr.d * 0.05) % W) + W) % W;
      circle(ctx, x, y, f.s);
    }
  }
}

// An iceberg: a soft white lump with a blue shadow side and a pale underwater skirt
function drawBerg(ctx, x, y, s, seed, cold) {
  const r = mulberry32(seed);
  const w = (60 + r() * 60) * s, h = (30 + r() * 46) * s;
  ctx.fillStyle = 'rgba(200,226,240,0.45)';
  ellipse(ctx, x, y + 4 * s, w * 0.62, 8 * s);
  ctx.fillStyle = mix('#ffffff', '#eef4ff', cold);
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w * 0.32, y - h * (0.5 + r() * 0.3));
  ctx.lineTo(x - w * 0.08, y - h);
  ctx.lineTo(x + w * 0.16, y - h * (0.7 + r() * 0.2));
  ctx.lineTo(x + w * 0.36, y - h * 0.4);
  ctx.lineTo(x + w / 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(143,182,217,0.45)'; // the shadowed side
  ctx.beginPath();
  ctx.moveTo(x - w * 0.08, y - h);
  ctx.lineTo(x + w * 0.16, y - h * 0.75);
  ctx.lineTo(x + w * 0.36, y - h * 0.4);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w * 0.05, y);
  ctx.closePath();
  ctx.fill();
}

// The coast of an island, seen from the sea. edge: the screen x of its sea edge; side -1: it lies to the
// left of the edge (the coast you left), 1: to the right (the one ahead). Greenhollow shows green hills and
// the lighthouse, lit; Frostpeak black rock, snow and pines, and Icefang Hamlet on its quay.
function drawCoast(ctx, key, edge, hz, side, time) {
  ctx.save();
  const span = 1100; // how far inland the drawing goes
  const tip = edge, inland = tip + side * span, base = hz + 18; // tip: the point nearest the sea lane
  const at = (d) => tip + side * d; // d px inland from the tip
  if (key === 'green') {
    ctx.fillStyle = '#9bd8b0';
    ctx.beginPath();
    ctx.moveTo(inland, base);
    ctx.lineTo(inland, hz - 90);
    ctx.quadraticCurveTo(at(span / 2), hz - 150, at(260), hz - 70);
    ctx.quadraticCurveTo(at(120), hz - 30, tip, base - 4);
    ctx.lineTo(tip, base);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7cc79a';
    for (let i = 0; i < 6; i++) ellipse(ctx, at(330 + i * 120), hz - 84 - (i % 2) * 10, 60, 24);
    // Slimeville's roofs among the trees, and the big tree
    for (let i = 0; i < 5; i++) {
      const rx = at(420 + i * 70);
      ctx.fillStyle = ['#ff9fb8', '#ffd36b', '#9fd8ff', '#c4a0ff', '#ff9a5a'][i];
      ctx.beginPath();
      ctx.moveTo(rx - 18, hz - 92);
      ctx.lineTo(rx, hz - 110);
      ctx.lineTo(rx + 18, hz - 92);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#6aaa7e';
    ctx.fillStyle = '#9b7d66';
    ctx.fillRect(at(750) - 6, hz - 120, 12, 30);
    ctx.fillStyle = '#6aaa7e';
    circle(ctx, at(760), hz - 128, 36);
    circle(ctx, at(732), hz - 146, 28);
    // the rocky point and the lighthouse, its lamp lit and its beam sweeping
    const lx = at(70);
    ctx.fillStyle = '#a99fb4';
    ellipse(ctx, lx, base - 8, 90, 18);
    drawLighthouse(ctx, lx, base - 16, 0.4, time);
  } else {
    ctx.fillStyle = '#4a4d66';
    ctx.beginPath();
    ctx.moveTo(inland, base);
    ctx.lineTo(inland, hz - 200);
    ctx.lineTo(at(520), hz - 230);
    ctx.lineTo(at(380), hz - 150);
    ctx.lineTo(at(220), hz - 120);
    ctx.lineTo(at(70), hz - 50);
    ctx.lineTo(tip, base - 4);
    ctx.lineTo(tip, base);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4f8ff'; // snow on the rock
    ctx.beginPath();
    ctx.moveTo(at(640), hz - 222);
    ctx.lineTo(at(520), hz - 230);
    ctx.lineTo(at(440), hz - 186);
    ctx.lineTo(at(500), hz - 196);
    ctx.lineTo(at(560), hz - 184);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(at(230), hz - 120);
    ctx.lineTo(at(300), hz - 134);
    ctx.lineTo(at(260), hz - 114);
    ctx.closePath();
    ctx.fill();
    // up in the sky, the cracked ice bridge; at the water's edge, Icefang Hamlet's turf huts and its quay,
    // where she ties up (the fjord thawed in atlas Phase 4: docs/places/crossings.md)
    ctx.strokeStyle = 'rgba(214,236,255,0.85)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(at(260), hz - 128);
    ctx.quadraticCurveTo(at(350), hz - 230, at(460), hz - 246);
    ctx.moveTo(at(488), hz - 250);
    ctx.quadraticCurveTo(at(620), hz - 268, at(760), hz - 300);
    ctx.stroke();
    ctx.fillStyle = '#dfe6f4'; // the snowy shore the huts stand on
    ctx.beginPath();
    ctx.ellipse(at(170), base - 6, 130, 10, 0, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      const hx = at(80 + i * 56), hy = base - 12;
      ctx.fillStyle = '#9b7d66';
      ctx.fillRect(hx - 14, hy - 16, 28, 16);
      ctx.fillStyle = '#7fae86'; // turf roof
      ctx.beginPath();
      ctx.moveTo(hx - 19, hy - 14);
      ctx.quadraticCurveTo(hx, hy - 34, hx + 19, hy - 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.fillRect(hx - 4, hy - 10, 7, 6);
      const k = (time * 0.2 + i / 4) % 1;
      ctx.fillStyle = `rgba(236,240,250,${0.6 * (1 - k)})`;
      circle(ctx, hx + 6 - k * 10, hy - 34 - k * 40, 4 + k * 8);
    }
    const fire = 0.6 + 0.2 * Math.sin(time * 6); // the lamp-fire, glowing among the huts
    ctx.fillStyle = `rgba(255,200,120,${0.45 * fire})`;
    circle(ctx, at(150), base - 22, 14);
    ctx.fillStyle = '#5f8a8a'; // dark pines further along the shore
    for (let i = 0; i < 9; i++) {
      const px = at(300 + i * 44), py = hz - 30 - (i % 3) * 8;
      ctx.beginPath();
      ctx.moveTo(px - 12, py);
      ctx.lineTo(px, py - 34 - (i % 2) * 8);
      ctx.lineTo(px + 12, py);
      ctx.closePath();
      ctx.fill();
    }
    // the hamlet's quay, where she ties up, with its lamps lit
    ctx.fillStyle = '#8a8fa8';
    ctx.fillRect(Math.min(at(-40), at(200)), base - 8, 240, 8);
    for (let i = 0; i < 3; i++) {
      const lx = at(i * 90 - 20);
      ctx.fillStyle = '#4e4a62';
      ctx.fillRect(lx - 1.5, base - 26, 3, 18);
      ctx.fillStyle = '#ffe9a8';
      circle(ctx, lx, base - 28, 3);
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; // surf along its foot
  ctx.fillRect(Math.min(tip, inland), base - 2, span, 3);
  ctx.restore();
}

// The Greenhollow lighthouse, lit: a little tower with a glowing lamp and a soft beam sweeping round.
// Shared with the harbour (src/harbour.js draws the near one itself).
function drawLighthouse(ctx, x, base, s, time) {
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(s, s);
  ctx.fillStyle = '#fff8f0';
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(-26, -200);
  ctx.lineTo(26, -200);
  ctx.lineTo(40, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4a6b4';
  ctx.fillRect(-36, -60, 72, 30);
  ctx.fillRect(-31, -140, 62, 30);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(-22, -250, 44, 50);
  ctx.fillStyle = '#e86f86';
  ctx.beginPath();
  ctx.moveTo(-30, -248);
  ctx.quadraticCurveTo(0, -290, 30, -248);
  ctx.closePath();
  ctx.fill();
  beam(ctx, 0, -225, 1, time);
  ctx.restore();
}

// A lighthouse beam: a pale wedge that swings round (narrows as it turns away), and a warm glow
export function beam(ctx, x, y, s, time) {
  const a = Math.sin(time * 0.6); // -1..1: which way it points
  const len = 520 * s, spread = 0.12 + 0.1 * (1 - Math.abs(a));
  const g = ctx.createRadialGradient(x, y, 4 * s, x, y, 70 * s);
  g.addColorStop(0, 'rgba(255,240,170,0.95)');
  g.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = g;
  circle(ctx, x, y, 70 * s);
  ctx.save();
  ctx.globalAlpha = 0.18 + 0.14 * Math.abs(a);
  const lg = ctx.createLinearGradient(x, y, x + Math.sign(a || 1) * len, y);
  lg.addColorStop(0, 'rgba(255,244,190,0.9)');
  lg.addColorStop(1, 'rgba(255,244,190,0)');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + a * len, y - len * spread);
  ctx.lineTo(x + a * len, y + len * spread);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ——— the ship (world space) ———
function drawShip(ctx, cr, L, R, time) {
  const moving = !cr.docked;
  const speed = moving ? Math.sin(Math.PI * Math.min(1, cr.k * 1.05)) : 0;
  drawHull(ctx, L, R);
  if (visible(MAST_X - 120, MAST_X + 120, L, R)) drawMast(ctx, time, speed);
  if (visible(860, 1120, L, R)) drawCabin(ctx, time, speed);
  drawRail(ctx, L, R);
  if (visible(PADDLE_X - 90, PADDLE_X + 90, L, R)) drawPaddleBox(ctx, cr);
  if (visible(HELM_X - 60, HELM_X + 60, L, R)) drawHelm(ctx, time);
  const cr8 = plat('crates');
  if (visible(cr8.x - 20, cr8.x + cr8.w + 20, L, R)) drawCrates(ctx, cr8);
  if (visible(BELL_X - 40, BELL_X + 40, L, R)) drawBell(ctx, time, speed);
  if (visible(DECK_GANGWAY_X - 120, DECK_GANGWAY_X + 120, L, R)) drawGangway(ctx, cr, time);
}

// The hull below the deck line: navy with a cream band, her name near the bow, portholes
function drawHull(ctx, L, R) {
  const top = GROUND + 2, wl = GROUND + 70;
  ctx.fillStyle = '#4f6b9a';
  ctx.beginPath();
  ctx.moveTo(-10, top);
  ctx.lineTo(DECK_W + 30, top - 12);
  ctx.quadraticCurveTo(DECK_W - 10, wl, DECK_W - 120, wl + 30);
  ctx.lineTo(40, wl + 30);
  ctx.quadraticCurveTo(-6, wl, -10, top);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff1dc';
  ctx.beginPath();
  ctx.moveTo(-10, top + 6);
  ctx.lineTo(DECK_W + 26, top - 6);
  ctx.lineTo(DECK_W + 22, top + 10);
  ctx.lineTo(-10, top + 20);
  ctx.closePath();
  ctx.fill();
  if (visible(DECK_W - 330, DECK_W, L, R)) text(ctx, 'PUDDLE JUMPER', DECK_W - 170, top + 8, 13, '#4f6b9a');
  for (let x = 120; x < DECK_W - 80; x += 64) {
    if (!visible(x - 10, x + 10, L, R) || Math.abs(x - PADDLE_X) < 80) continue;
    ctx.fillStyle = '#ffffff';
    circle(ctx, x, top + 40, 8);
    ctx.fillStyle = '#ffe9a8';
    circle(ctx, x, top + 40, 5);
  }
  // the deck planks you stand on
  ctx.fillStyle = '#d9b38a';
  ctx.fillRect(Math.max(-10, L), GROUND - 2, Math.min(DECK_W + 10, R) - Math.max(-10, L), 6);
  ctx.fillStyle = '#ead0b0';
  ctx.fillRect(Math.max(-10, L), GROUND - 2, Math.min(DECK_W + 10, R) - Math.max(-10, L), 2);
}

// The bulwark: a low rail along the deck with posts, life rings and a gap at the gangway
function drawRail(ctx, L, R) {
  const y = GROUND - 34;
  ctx.strokeStyle = '#fff8f0';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [a, b] of [[8, DECK_GANGWAY_X - 50], [DECK_GANGWAY_X + 50, DECK_W - 8]]) {
    if (!visible(a, b, L, R)) continue;
    ctx.moveTo(Math.max(a, L), y);
    ctx.lineTo(Math.min(b, R), y);
    for (let x = Math.ceil(Math.max(a, L) / 40) * 40; x <= Math.min(b, R); x += 40) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, GROUND - 2);
    }
  }
  ctx.stroke();
  for (const x of [420, 1160]) {
    if (!visible(x - 20, x + 20, L, R)) continue;
    ctx.strokeStyle = '#ff8fa3';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y + 14, 12, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([6, 7]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// The paddle box amidships: a pink half-wheel housing on the hull side, the wheel churning behind its slats
function drawPaddleBox(ctx, cr) {
  const cx = PADDLE_X, cy = GROUND + 20, r = 74;
  ctx.save();
  ctx.fillStyle = '#e86f86';
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  const spin = cr.d * 0.01; // turns with the miles
  ctx.strokeStyle = '#fff1dc';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const a = Math.PI + ((i / 8) * Math.PI + spin) % Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6));
    ctx.stroke();
  }
  ctx.fillStyle = '#fff1dc';
  circle(ctx, cx, cy, 10);
  ctx.strokeStyle = '#d85b74';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.stroke();
  ctx.restore();
}

// The cabin with its roof (a platform), the funnel smoking (the smoke streams astern while she's moving)
function drawCabin(ctx, time, speed) {
  const p = plat('cabin');
  const x0 = p.x + 6, x1 = p.x + p.w - 6, top = p.y + 10;
  ctx.fillStyle = '#fff8f0';
  ctx.beginPath();
  ctx.roundRect(x0, top, x1 - x0, GROUND - top, [8, 8, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#9ccfe0';
  for (let x = x0 + 20; x < x1 - 70; x += 46) {
    ctx.beginPath();
    ctx.roundRect(x, top + 22, 30, 26, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,233,168,0.6)';
    ctx.fillRect(x + 3, top + 36, 24, 9);
    ctx.fillStyle = '#9ccfe0';
  }
  ctx.fillStyle = '#c98a5a'; // the cabin door
  ctx.beginPath();
  ctx.roundRect(x1 - 52, GROUND - 74, 34, 74, [9, 9, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  circle(ctx, x1 - 26, GROUND - 38, 2.4);
  ctx.fillStyle = '#7fc8c0'; // the roof
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#5aa9a1';
  ctx.fillRect(p.x + 4, p.y + 10, p.w - 8, 3);
  // the funnel and its smoke
  ctx.fillStyle = '#4f6b9a';
  ctx.beginPath();
  ctx.roundRect(FUNNEL_X - 18, p.y - 88, 36, 90, 4);
  ctx.fill();
  ctx.fillStyle = '#e86f86';
  ctx.fillRect(FUNNEL_X - 18, p.y - 74, 36, 12);
  for (let i = 0; i < 7; i++) {
    const k = (time * 0.35 + i / 7) % 1;
    const sx = FUNNEL_X - k * 180 * (0.25 + speed) + Math.sin(k * 5 + i) * 8, sy = p.y - 96 - k * 120;
    ctx.fillStyle = `rgba(240,236,246,${0.7 * (1 - k)})`;
    circle(ctx, sx, sy, 10 + k * 22);
  }
}

// The mast: its yard (a platform), the sail (set and billowing at sea, furled in harbour), the crow's
// nest (a platform) and a pennant streaming astern
function drawMast(ctx, time, speed) {
  const yard = plat('yard'), nest = plat('nest');
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(MAST_X, GROUND);
  ctx.lineTo(MAST_X, nest.y - 70);
  ctx.stroke();
  // rigging down to the rail
  ctx.strokeStyle = 'rgba(143,98,64,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const [x, y] of [[MAST_X - 150, GROUND - 34], [MAST_X + 170, GROUND - 34]]) {
    ctx.moveTo(MAST_X, nest.y - 60);
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  // the sail hangs from the yard
  const billow = 10 + 26 * speed + Math.sin(time * 1.3) * 3 * (0.3 + speed);
  if (speed > 0.02) {
    ctx.fillStyle = '#fff6ea';
    ctx.beginPath();
    ctx.moveTo(yard.x + 8, yard.y + 10);
    ctx.lineTo(yard.x + yard.w - 8, yard.y + 10);
    ctx.quadraticCurveTo(yard.x + yard.w + billow, yard.y + 80, yard.x + yard.w - 14, GROUND - 60);
    ctx.lineTo(yard.x + 14, GROUND - 60);
    ctx.quadraticCurveTo(yard.x + billow * 0.6, yard.y + 80, yard.x + 8, yard.y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(244,166,180,0.55)'; // a pink stripe
    ctx.fillRect(yard.x + 20, yard.y + 54, yard.w - 40, 16);
  }
  ctx.fillStyle = '#a77b52'; // the yard
  ctx.beginPath();
  ctx.roundRect(yard.x, yard.y, yard.w, 10, 5);
  ctx.fill();
  if (speed <= 0.02) { // furled along it
    ctx.fillStyle = '#f4ead8';
    ctx.beginPath();
    ctx.roundRect(yard.x + 8, yard.y + 8, yard.w - 16, 14, 7);
    ctx.fill();
  }
  // the crow's nest: a little barrel round the mast
  ctx.fillStyle = '#c99b6b';
  ctx.beginPath();
  ctx.roundRect(nest.x, nest.y, nest.w, 34, [4, 4, 12, 12]);
  ctx.fill();
  ctx.fillStyle = '#a77b52';
  ctx.fillRect(nest.x, nest.y + 10, nest.w, 4);
  ctx.fillRect(nest.x, nest.y + 22, nest.w, 4);
  // the pennant
  const top = nest.y - 70, flap = Math.sin(time * 6) * 4 * (0.4 + speed);
  ctx.fillStyle = '#9fd8ff';
  ctx.beginPath();
  ctx.moveTo(MAST_X, top);
  ctx.quadraticCurveTo(MAST_X - 30, top + 6 + flap, MAST_X - 60 - 10 * speed, top + 10 + flap);
  ctx.lineTo(MAST_X, top + 18);
  ctx.closePath();
  ctx.fill();
}

// The helm at the stern: a spoked wheel on a post, turning a touch now and then
function drawHelm(ctx, time) {
  const x = HELM_X, y = GROUND - 66;
  ctx.fillStyle = '#8f6240';
  ctx.beginPath();
  ctx.roundRect(x - 8, y, 16, GROUND - y, 4);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 0.5) * 0.4);
  ctx.strokeStyle = '#a77b52';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 34, Math.sin(a) * 34);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd36b';
  circle(ctx, 0, 0, 5);
  ctx.restore();
}

function drawCrates(ctx, p) {
  const n = Math.max(1, Math.round(p.w / 48)), cw = p.w / n, ch = GROUND - p.y;
  for (let i = 0; i < n; i++) {
    const x = p.x + i * cw;
    ctx.fillStyle = i % 2 ? '#d9b38a' : '#e4c49c';
    ctx.beginPath();
    ctx.roundRect(x + 1, p.y + 1, cw - 2, ch - 2, 4);
    ctx.fill();
    ctx.strokeStyle = '#b8895e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 5, p.y + 5);
    ctx.lineTo(x + cw - 5, p.y + ch - 5);
    ctx.moveTo(x + cw - 5, p.y + 5);
    ctx.lineTo(x + 5, p.y + ch - 5);
    ctx.stroke();
  }
  // a coil of rope beside them
  ctx.strokeStyle = '#c9b8aa';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(p.x + p.w + 28, GROUND - 6 - i * 5, 18 - i * 3, 5, 0, 0, TAU);
    ctx.stroke();
  }
}

// The ship's bell on its post near the bow, swinging with the swell
function drawBell(ctx, time, speed) {
  const x = BELL_X, top = GROUND - 96;
  ctx.fillStyle = '#8f6240';
  ctx.fillRect(x - 4, top, 8, GROUND - top);
  ctx.fillRect(x - 18, top, 36, 6);
  ctx.save();
  ctx.translate(x, top + 6);
  ctx.rotate(Math.sin(time * 1.6) * (0.08 + 0.12 * speed));
  ctx.fillStyle = '#ffd36b';
  ctx.beginPath();
  ctx.moveTo(-12, 26);
  ctx.quadraticCurveTo(-12, 2, 0, 2);
  ctx.quadraticCurveTo(12, 2, 12, 26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8b040';
  circle(ctx, 0, 28, 3);
  ctx.restore();
}

// The gangway gap in the rail. Under way a little chain hangs across it; once she's in, the plank is run
// out to the jetty and a sign says where you are
function drawGangway(ctx, cr, time) {
  const x = DECK_GANGWAY_X, y = GROUND - 34;
  ctx.fillStyle = '#8f6240';
  for (const px of [x - 50, x + 50]) {
    ctx.beginPath();
    ctx.roundRect(px - 5, y - 10, 10, GROUND - y + 8, 3);
    ctx.fill();
  }
  if (!cr.docked) {
    ctx.strokeStyle = '#9aa4b4';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x - 50, y - 4);
    ctx.quadraticCurveTo(x, y + 14 + Math.sin(time * 1.6) * 2, x + 50, y - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  // the plank, run out over the side to the jetty behind
  ctx.fillStyle = '#c99b6b';
  ctx.beginPath();
  ctx.moveTo(x - 34, GROUND - 2);
  ctx.lineTo(x + 34, GROUND - 2);
  ctx.lineTo(x + 26, GROUND - 46);
  ctx.lineTo(x - 26, GROUND - 46);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a77b52';
  for (let i = 1; i < 5; i++) ctx.fillRect(x - 32 + i * 1.6, GROUND - 2 - i * 9, 64 - i * 3.2, 2);
  // the sign
  ctx.fillStyle = '#8f6240';
  ctx.fillRect(x - 3, GROUND - 112, 6, 66);
  ctx.save();
  ctx.translate(x, GROUND - 112);
  ctx.rotate(Math.sin(time * 1.2) * 0.03);
  ctx.fillStyle = '#fff6ea';
  ctx.strokeStyle = '#7fa8c8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-70, -34, 140, 46, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Ashore', 0, -20, 12, '#8f6240');
  text(ctx, ISLAND_NAME[cr.to], 0, -2, 16, '#4f6b9a');
  ctx.restore();
}
