// Docs: docs/places/fen.md
// Wickmere (room WICKMERE, src/shared/rpg.js; atlas Phase 8, L0): Lantern Fen's town, stilt houses on a boardwalk over
// black water, with Reedwater's jetty as its waterfront. West to east: Reedwater's jetty in the fog with the eel-boat
// Hush tied up alongside (her gangway is a door, WICK_DOCK_X) and Netta's eel boxes, the waystone on the landing, Wren's
// lamp stall where the Lamp Walk begins, the Lamp Walk itself (a lantern on every post, each with a name tag on a
// string, all of them lit), the great lantern stand on its landing (you wake by it), the stilt house whose door is
// everyone's own front door (WICK_HOME_X), the lantern gallery on its tall poles, Hob's punt (drawn by
// src/branch-gates.js: the Still Mere's gate), Sedge's reed shed, and the boardwalk's east end running off into the
// reeds (the Shallows). Behind: a violet dusk, a low moon, the still mere with the dead's lights drifting far out on it,
// and across the water the far line of the Lantern Causeway's lamps (seen, not reached: story/phase8-plan.md).
// The platforms are WICK_PLATFORMS. This room paints its own sky; the Shallows (src/shallows.js) borrow it.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { WICK_W, FIELD_GROUND, WICK_DOCK_X, WICK_HOME_X, WICK_SPAWN_X, WICK_EXIT_X, WICK_PLATFORMS, WREN_X, SEDGE_X, STILLMERE_GATE_X } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';

const GROUND = FIELD_GROUND;
const HORIZON = 300;
const JETTY_END = 640; // Reedwater's jetty runs out west of here; the town's boardwalk east of it
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const plats = (kind) => WICK_PLATFORMS.filter((p) => p.kind === kind);
const plat = (kind) => plats(kind)[0];
// the Lamp Walk's posts, kept clear of the stall, the lantern stand, the home door, Hob's punt and Sedge's shed
const POSTS = Array.from({ length: 22 }, (_, i) => 880 + i * 70).filter((x) => ![[WICK_HOME_X, 50], [WREN_X, 80], [WICK_SPAWN_X, 60], [STILLMERE_GATE_X, 80], [SEDGE_X, 130]].some(([c, r]) => Math.abs(x - c) < r));

// freed (L5 (c)): the posts whose lanterns have gone out (a seeded third of them, and always the one nearest Wren's stall:
// her husband's)
const WREN_POST = POSTS.reduce((b, x) => (Math.abs(x - WREN_X - 90) < Math.abs(b - WREN_X - 90) ? x : b), POSTS[0]);
const OUT_POSTS = new Set(POSTS.filter((x) => x === WREN_POST || mulberry32(Math.round(x) + 77)() < 0.3));

function text(ctx, str, x, y, size, color) {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

const stars = (() => {
  const r = mulberry32(701);
  return Array.from({ length: 46 }, () => ({ x: r() * W, y: r() * 170, s: 0.5 + r(), p: r() * TAU }));
})();
const drift = (() => {
  const r = mulberry32(709);
  return Array.from({ length: 22 }, () => ({ x: r() * 2400, y: r(), p: r() * TAU, warm: r() < 0.65 }));
})();
const flies = (() => {
  const r = mulberry32(719);
  return Array.from({ length: 34 }, () => ({ x: r() * W, y: 200 + r() * 260, p: r() * TAU, v: 0.4 + r() * 0.6 }));
})();
const mists = (() => {
  const r = mulberry32(727);
  return Array.from({ length: 12 }, (_, i) => ({ x: i * 180 + r() * 90, y: r(), s: 0.7 + r() * 0.8 }));
})();

// Everything in Wickmere behind the slimes
// freed: you've freed the Wickmother (L5 (c), docs/social/story.md): for you the Lamp Walk burns low, a few of its lanterns
// out and their tags gone (OUT_POSTS: Wren's husband's, the one nearest her stall, among them)
export function drawWickmere(ctx, camX, viewW, time, freed = false) {
  ctx.save();
  ctx.translate(camX, 0); // the sky and the far mere in screen space
  drawFenSky(ctx, camX, time, WICK_W);
  ctx.restore();
  const L = camX - 100, R = camX + viewW + 100;
  if (visible(WICK_DOCK_X - 360, WICK_DOCK_X + 260, L, R)) drawHushAlongside(ctx, time);
  drawBoardwalk(ctx, Math.max(0, L), Math.min(WICK_W, R), time);
  for (const p of plats('porch')) if (visible(p.x - 40, p.x + p.w + 40, L, R)) drawStiltHouse(ctx, p, time, p.x < WICK_HOME_X && p.x + p.w > WICK_HOME_X);
  const g = plat('bridge');
  if (visible(g.x - 40, g.x + g.w + 40, L, R)) drawGallery(ctx, g, time);
  const bx = plat('boxes');
  if (visible(bx.x - 20, bx.x + bx.w + 20, L, R)) drawEelBoxes(ctx, bx, time);
  for (const x of POSTS) if (visible(x - 30, x + 30, L, R)) drawLampPost(ctx, x, time, freed && OUT_POSTS.has(x), freed);
  if (visible(WREN_X - 120, WREN_X + 140, L, R)) drawWrenStall(ctx, time);
  if (visible(WICK_SPAWN_X - 80, WICK_SPAWN_X + 80, L, R)) drawLampStand(ctx, WICK_SPAWN_X, time);
  if (visible(SEDGE_X - 160, SEDGE_X + 160, L, R)) drawReedShed(ctx, time);
  if (visible(WICK_EXIT_X - 260, WICK_W, L, R)) drawEastEnd(ctx, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawFenAir(ctx, camX, time);
  ctx.restore();
}

// A house can look out on Wickmere (its `view`, docs/places/houses.md): the dusk, the mere and the fireflies
export function drawWickmereView(ctx, camX, time) {
  drawFenSky(ctx, camX, time, WICK_W);
  drawFenAir(ctx, camX, time);
}

// ——— the sky and the mere (shared with the Shallows) ———
export function drawFenSky(ctx, camX, time, roomW, { causeway = true } = {}) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#2a2646');
  sky.addColorStop(0.55, '#5e4e84');
  sky.addColorStop(1, '#c4aed2');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  for (const s of stars) {
    const x = (((s.x - camX * 0.02) % W) + W) % W;
    ctx.fillStyle = `rgba(255,250,235,${0.2 + 0.35 * (0.5 + 0.5 * Math.sin(time * 1.6 + s.p))})`;
    circle(ctx, x, s.y, s.s * 0.8);
  }
  const mx = 210 - camX * 0.015, my = 96; // a low moon in a ring of mist
  const mg = ctx.createRadialGradient(mx, my, 10, mx, my, 120);
  mg.addColorStop(0, 'rgba(240,230,255,0.35)');
  mg.addColorStop(1, 'rgba(240,230,255,0)');
  ctx.fillStyle = mg;
  ctx.fillRect(mx - 120, my - 120, 240, 240);
  ctx.fillStyle = '#efe8f8';
  circle(ctx, mx, my, 20);
  ctx.fillStyle = 'rgba(200,186,220,0.6)';
  circle(ctx, mx + 6, my - 4, 4);
  // the other islands, far off over the water to the west
  drawDistantIslands(ctx, { from: 'fen', scroll: camX, roomW, time, horizon: HORIZON, haze: '#c4aed2', fade: 0.6, scale: 0.5, night: 0.8, sky: 210 });
  // far reeds and willows along the mere's other shore
  ctx.fillStyle = '#4a4064';
  ctx.beginPath();
  ctx.moveTo(0, HORIZON + 4);
  for (let x = 0; x <= W + 40; x += 40) {
    const wx = x - (((camX * 0.12) % 40) + 40) % 40;
    ctx.lineTo(wx, HORIZON - 8 - Math.abs(Math.sin((wx + camX * 0.12) * 0.013)) * 22);
  }
  ctx.lineTo(W, HORIZON + 4);
  ctx.closePath();
  ctx.fill();
  // the mere: black and still, the sky in it
  const sea = ctx.createLinearGradient(0, HORIZON, 0, H);
  sea.addColorStop(0, '#6a5a8a');
  sea.addColorStop(0.3, '#3e3858');
  sea.addColorStop(1, '#221e34');
  ctx.fillStyle = sea;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  ctx.fillStyle = 'rgba(240,230,255,0.15)'; // the moon on the water
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.roundRect(mx - 24 - i * 3 + Math.sin(time * 0.8 + i) * 3, HORIZON + 8 + i * i * 2.2, 48 + i * 6, 2, 1);
    ctx.fill();
  }
  // the Lantern Causeway: a far line of lamps across the water, toward something you can't see for mist
  if (causeway) {
    const cx0 = W * 0.55 - camX * 0.05;
    for (let i = 0; i < 26; i++) {
      const k = i / 25, x = cx0 + k * 420, y = HORIZON + 14 - k * 12;
      ctx.fillStyle = `rgba(255,220,160,${(0.55 - k * 0.35) * (0.7 + 0.3 * Math.sin(time * 2 + i))})`;
      circle(ctx, x, y, 1.8 - k * 0.8);
    }
  }
  // the dead's lanterns adrift far out on the mere
  for (const d of drift) {
    const f = 0.06 + d.y * 0.1;
    const x = (((d.x - camX * f + Math.sin(time * 0.2 + d.p) * 12) % 2400) + 2400) % 2400 - 200;
    if (x < -30 || x > W + 30) continue;
    const y = HORIZON + 10 + d.y * 50 + Math.sin(time * 0.9 + d.p) * 1.2, sz = 0.5 + d.y * 0.6;
    ctx.fillStyle = d.warm ? 'rgba(255,214,150,0.25)' : 'rgba(214,190,255,0.25)';
    circle(ctx, x, y - 3 * sz, 9 * sz);
    ctx.fillStyle = d.warm ? '#ffe2a8' : '#e4d4ff';
    ctx.fillRect(x - 2 * sz, y - 6 * sz, 4 * sz, 5 * sz);
    ctx.fillStyle = 'rgba(255,230,190,0.2)';
    ellipse(ctx, x, y + 1, 7 * sz, 1.4);
  }
  // mist lying on the water
  for (const m of mists) {
    const x = (((m.x - camX * 0.2 - time * 3) % 2160) + 2160) % 2160 - 200;
    if (x < -260 || x > W + 260) continue;
    ctx.fillStyle = 'rgba(214,204,232,0.22)';
    ellipse(ctx, x, HORIZON + 20 + m.y * 40, 160 * m.s, 16 * m.s);
  }
}

// In screen space, over everything: fireflies and a breath of low mist
export function drawFenAir(ctx, camX, time) {
  for (const f of flies) {
    const x = (((f.x + Math.sin(time * f.v + f.p) * 40 - camX * 0.3) % W) + W) % W, y = f.y + Math.sin(time * f.v * 1.3 + f.p) * 16;
    ctx.fillStyle = `rgba(230,255,160,${0.25 + 0.5 * (0.5 + 0.5 * Math.sin(time * 3.4 + f.p * 5))})`;
    circle(ctx, x, y, 1.6);
  }
  const g = ctx.createLinearGradient(0, GROUND - 40, 0, H);
  g.addColorStop(0, 'rgba(214,204,232,0)');
  g.addColorStop(1, 'rgba(214,204,232,0.18)');
  ctx.fillStyle = g;
  ctx.fillRect(0, GROUND - 40, W, H - GROUND + 40);
}

// ——— the boardwalk ———
// Weathered planks on posts over the black water; west of JETTY_END it's Reedwater's narrower jetty
function drawBoardwalk(ctx, L, R, time) {
  ctx.fillStyle = '#5a5070'; // the plank edge facing you
  ctx.fillRect(L, GROUND, R - L, 12);
  ctx.fillStyle = '#7a6e8a';
  ctx.fillRect(L, GROUND - 2, R - L, 4);
  ctx.strokeStyle = 'rgba(46,42,58,0.55)'; // plank ends
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.floor(L / 34) * 34; x < R; x += 34) {
    ctx.moveTo(x, GROUND + 1);
    ctx.lineTo(x, GROUND + 12);
  }
  ctx.stroke();
  // the posts down into the water, and their wobbling reflections
  for (let x = Math.floor(L / 120) * 120 + 20; x < R; x += 120) {
    ctx.fillStyle = '#3e3650';
    ctx.fillRect(x - 5, GROUND + 12, 10, H - GROUND - 12);
    ctx.fillStyle = 'rgba(122,110,138,0.35)';
    for (let y = GROUND + 30; y < H; y += 12) ctx.fillRect(x - 5 + Math.sin(time * 1.5 + y * 0.2) * 2, y, 10, 3);
  }
  ctx.fillStyle = 'rgba(214,204,232,0.12)'; // ripples on the water under the boards
  for (let x = Math.floor(L / 90) * 90; x < R; x += 90) {
    ctx.beginPath();
    ctx.roundRect(x + Math.sin(time + x) * 10, GROUND + 40 + (x % 3) * 14, 40, 2, 1);
    ctx.fill();
  }
  // a rope rail along the water side of the jetty
  if (L < JETTY_END) {
    ctx.strokeStyle = '#8a7a64';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = Math.max(0, Math.floor(L / 110) * 110); x < Math.min(JETTY_END, R + 110); x += 110) {
      ctx.moveTo(x, GROUND - 34);
      ctx.quadraticCurveTo(x + 55, GROUND - 22, x + 110, GROUND - 34);
    }
    ctx.stroke();
    for (let x = Math.max(0, Math.floor(L / 110) * 110); x < Math.min(JETTY_END, R + 110); x += 110) {
      ctx.fillStyle = '#4a4058';
      ctx.fillRect(x - 3, GROUND - 40, 6, 40);
    }
  }
}

// The Hush, tied up alongside the jetty: black hull, the little wheelhouse and stove pipe, sail furled, bow lantern lit
function drawHushAlongside(ctx, time) {
  const x0 = WICK_DOCK_X - 330, x1 = WICK_DOCK_X + 200, wl = GROUND - 30 + Math.sin(time * 0.6) * 1.2, deck = wl - 46;
  ctx.save();
  ctx.fillStyle = '#2e2a3a';
  ctx.beginPath();
  ctx.moveTo(x0, deck);
  ctx.lineTo(x1 + 30, deck - 10);
  ctx.quadraticCurveTo(x1 + 10, wl - 4, x1 - 40, wl + 8);
  ctx.lineTo(x0 + 24, wl + 8);
  ctx.quadraticCurveTo(x0 - 6, wl, x0, deck);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a7aa8';
  ctx.fillRect(x0 + 6, deck + 6, x1 - x0 + 10, 4);
  text(ctx, 'HUSH', x1 - 40, deck + 22, 12, '#c8b8e8');
  ctx.fillStyle = '#d8cfc0'; // the wheelhouse
  ctx.fillRect(x0 + 50, deck - 52, 70, 52);
  ctx.fillStyle = '#4e4862';
  ctx.fillRect(x0 + 44, deck - 58, 82, 8);
  ctx.fillStyle = `rgba(255,220,160,${0.7 + 0.2 * Math.sin(time * 2)})`;
  ctx.fillRect(x0 + 62, deck - 42, 16, 14);
  ctx.fillStyle = '#3a3446'; // the stove pipe, a thread of smoke
  ctx.fillRect(x0 + 100, deck - 84, 9, 30);
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.25 + i / 4) % 1;
    ctx.fillStyle = `rgba(196,190,206,${0.45 * (1 - k)})`;
    circle(ctx, x0 + 104 - k * 20, deck - 92 - k * 50, 4 + k * 8);
  }
  ctx.strokeStyle = '#3a3446'; // the mast, sail furled on the boom
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x0 + 250, deck);
  ctx.lineTo(x0 + 250, deck - 200);
  ctx.moveTo(x0 + 250, deck - 40);
  ctx.lineTo(x0 + 150, deck - 34);
  ctx.stroke();
  ctx.fillStyle = '#cfc4ae';
  ctx.beginPath();
  ctx.roundRect(x0 + 152, deck - 46, 96, 13, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(80,72,92,0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x0 + 250, deck - 196);
  ctx.lineTo(x1 + 20, deck - 8);
  ctx.moveTo(x0 + 250, deck - 196);
  ctx.lineTo(x0 + 10, deck - 2);
  ctx.stroke();
  // her bow lantern on its pole
  ctx.strokeStyle = '#3a3446';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x1 - 10, deck);
  ctx.lineTo(x1 + 20, deck - 120);
  ctx.quadraticCurveTo(x1 + 40, deck - 134, x1 + 46, deck - 116);
  ctx.stroke();
  const lg = ctx.createRadialGradient(x1 + 46, deck - 98, 2, x1 + 46, deck - 98, 52);
  lg.addColorStop(0, `rgba(214,190,255,${0.5 + 0.12 * Math.sin(time * 3)})`);
  lg.addColorStop(1, 'rgba(214,190,255,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(x1 - 6, deck - 150, 104, 104);
  ctx.fillStyle = '#2e2a3a';
  ctx.beginPath();
  ctx.roundRect(x1 + 38, deck - 110, 16, 22, 4);
  ctx.fill();
  ctx.fillStyle = '#e4d4ff';
  ctx.beginPath();
  ctx.roundRect(x1 + 41, deck - 107, 10, 15, 3);
  ctx.fill();
  // the gangway, a plank down to the jetty
  ctx.fillStyle = '#7a6e8a';
  ctx.save();
  ctx.translate(WICK_DOCK_X, GROUND);
  ctx.rotate(-0.42);
  ctx.fillRect(-4, -8, 60, 7);
  ctx.restore();
  ctx.restore();
}

// Netta's eel boxes on the jetty: slatted crates stacked (the platform's the top), a coil of rope, a net over them
function drawEelBoxes(ctx, p, time) {
  for (const [dx, y, w] of [[0, p.y, p.w], [8, p.y + 40, p.w - 10]]) {
    ctx.fillStyle = '#6a5a48';
    ctx.fillRect(p.x + dx, y, w, 40);
    ctx.strokeStyle = '#3e3428';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x + dx, y, w, 40);
    ctx.beginPath();
    for (let x = p.x + dx + 12; x < p.x + dx + w; x += 14) {
      ctx.moveTo(x, y + 4);
      ctx.lineTo(x, y + 36);
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#6a5a48';
  ctx.fillRect(p.x + 4, p.y + 80, p.w - 18, GROUND - p.y - 80);
  ctx.strokeStyle = 'rgba(200,190,170,0.45)'; // a net thrown over
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.moveTo(p.x + i * 20, p.y);
    ctx.lineTo(p.x + i * 20 + 30, p.y + 50);
  }
  ctx.stroke();
  const wr = Math.sin(time * 3) * 2; // something long and dark shifts in the top box
  ctx.fillStyle = '#2a2a2e';
  ellipse(ctx, p.x + p.w * 0.5 + wr, p.y + 22, 20, 3);
}

// A lantern post on the Lamp Walk: a lantern hung off its crook, and a name tag on a string turning in the draught
// (out: let go, L5 (c), for a slime who freed her: cold glass, no tag; low: the rest burn a little lower for them)
function drawLampPost(ctx, x, time, out = false, low = false) {
  const r = mulberry32(Math.round(x));
  const warm = r() < 0.75, hh = 104 + r() * 20, top = GROUND - hh;
  ctx.fillStyle = '#4a4058';
  ctx.fillRect(x - 2.5, top, 5, hh);
  ctx.strokeStyle = '#4a4058';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, top + 2);
  ctx.quadraticCurveTo(x + 12, top - 8, x + 16, top + 6);
  ctx.stroke();
  const ly = top + 18, sw = Math.sin(time * 1.2 + x) * 1.5;
  if (!out) {
    const dim = low ? 0.7 : 1, g = ctx.createRadialGradient(x + 16 + sw, ly, 2, x + 16 + sw, ly, 40);
    g.addColorStop(0, warm ? `rgba(255,214,150,${(0.42 + 0.1 * Math.sin(time * 2.3 + x)) * dim})` : `rgba(214,190,255,${0.4 * dim})`);
    g.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 24 + sw, ly - 40, 80, 80);
  }
  ctx.fillStyle = '#2e2a3a';
  ctx.beginPath();
  ctx.roundRect(x + 10 + sw, ly - 9, 12, 17, 3);
  ctx.fill();
  ctx.fillStyle = out ? '#4a4660' : warm ? '#ffe2a8' : '#e4d4ff';
  ctx.beginPath();
  ctx.roundRect(x + 12.5 + sw, ly - 6.5, 7, 12, 2);
  ctx.fill();
  if (out) return; // (its tag gone with its light)
  const ta = Math.sin(time * 0.9 + x * 0.1) * 0.5; // the name tag, turning on its string
  ctx.strokeStyle = 'rgba(200,190,170,0.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + 16 + sw, ly + 8);
  ctx.lineTo(x + 16 + sw, ly + 20);
  ctx.stroke();
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.roundRect(x + 16 + sw - 4 * Math.cos(ta), ly + 20, 8 * Math.cos(ta) + 0.5, 10, 1.5);
  ctx.fill();
}

// Wren's stall: a little booth under a reed awning, shelves of lanterns and stoppered jars of lamp oil, wicks hung
// to dry on a line
function drawWrenStall(ctx, time) {
  const x = WREN_X - 60, w = 140, top = GROUND - 120;
  ctx.fillStyle = '#5a4e6a';
  ctx.fillRect(x, top + 24, w, GROUND - top - 24);
  ctx.fillStyle = '#6a5e7a';
  ctx.fillRect(x - 8, GROUND - 46, w + 16, 46); // the counter
  ctx.fillStyle = '#8a7e6a'; // the awning, reed thatch
  ctx.beginPath();
  ctx.moveTo(x - 20, top + 30);
  ctx.lineTo(x + w / 2, top - 6);
  ctx.lineTo(x + w + 20, top + 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(70,58,40,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    ctx.moveTo(x - 16 + i * 15, top + 28);
    ctx.lineTo(x + w / 2 + (i - 6) * 3, top);
  }
  ctx.stroke();
  for (let i = 0; i < 5; i++) { // jars of oil on the counter
    const jx = x + 8 + i * 26;
    ctx.fillStyle = 'rgba(214,190,120,0.75)';
    ctx.beginPath();
    ctx.roundRect(jx, GROUND - 66, 14, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#6a5040';
    ctx.fillRect(jx + 3, GROUND - 70, 8, 5);
  }
  for (let i = 0; i < 4; i++) { // lanterns on the shelf
    const lx = x + 22 + i * 32, ly = top + 52;
    ctx.fillStyle = `rgba(255,214,150,${0.22 + 0.08 * Math.sin(time * 2 + i)})`;
    circle(ctx, lx, ly, 14);
    ctx.fillStyle = '#2e2a3a';
    ctx.beginPath();
    ctx.roundRect(lx - 6, ly - 8, 12, 16, 3);
    ctx.fill();
    ctx.fillStyle = i % 2 ? '#e4d4ff' : '#ffe2a8';
    ctx.fillRect(lx - 3.5, ly - 5, 7, 10);
  }
  ctx.strokeStyle = 'rgba(220,210,190,0.7)'; // wicks drying on a line
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 4, top + 34);
  ctx.quadraticCurveTo(x + w / 2, top + 42, x + w - 4, top + 34);
  for (let i = 1; i < 9; i++) {
    const wx = x + 4 + (i * (w - 8)) / 9;
    ctx.moveTo(wx, top + 36 + Math.sin(i) * 1.5);
    ctx.lineTo(wx + Math.sin(time + i) * 1.5, top + 48);
  }
  ctx.stroke();
}

// The great lantern stand on the Lamp Walk's landing: tiers of lanterns on an iron frame, where you wake up
function drawLampStand(ctx, x, time) {
  const top = GROUND - 170;
  ctx.fillStyle = '#3e3650';
  ctx.fillRect(x - 3, top, 6, 170);
  for (const [dy, n, span] of [[30, 3, 60], [76, 5, 100], [122, 7, 140]]) {
    ctx.fillStyle = '#3e3650';
    ctx.fillRect(x - span / 2, top + dy - 2, span, 3);
    for (let i = 0; i < n; i++) {
      const lx = x - span / 2 + (i + 0.5) * (span / n), ly = top + dy + 12, warm = (i + dy) % 3 !== 0;
      ctx.fillStyle = warm ? `rgba(255,214,150,${0.2 + 0.08 * Math.sin(time * 2 + i + dy)})` : 'rgba(214,190,255,0.2)';
      circle(ctx, lx, ly, 12);
      ctx.fillStyle = '#2e2a3a';
      ctx.beginPath();
      ctx.roundRect(lx - 4.5, ly - 7, 9, 13, 2);
      ctx.fill();
      ctx.fillStyle = warm ? '#ffe2a8' : '#e4d4ff';
      ctx.fillRect(lx - 2.5, ly - 4.5, 5, 8);
    }
  }
}

// A stilt house on the boardwalk: plank walls under a steep reed roof, a lantern in every window; its balcony (the
// platform) with a rail. The home one has the door that's everyone's own front door
function drawStiltHouse(ctx, p, time, home) {
  const x = p.x, w = p.w, y = p.y;
  ctx.fillStyle = '#5e5474';
  ctx.fillRect(x + 8, y + 6, w - 16, GROUND - y - 6);
  ctx.strokeStyle = 'rgba(46,42,58,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let xx = x + 22; xx < x + w - 10; xx += 16) {
    ctx.moveTo(xx, y + 8);
    ctx.lineTo(xx, GROUND);
  }
  ctx.stroke();
  ctx.fillStyle = '#8a7e6a'; // the reed roof, steep, behind the balcony
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 2);
  ctx.lineTo(x + w / 2, y - 76);
  ctx.lineTo(x + w + 6, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6e6450';
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 10, y - 70);
  ctx.lineTo(x + w / 2, y - 92);
  ctx.lineTo(x + w / 2 + 10, y - 70);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a4058'; // the balcony and its rail
  ctx.fillRect(x, y, w, 7);
  ctx.strokeStyle = '#4a4058';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 20);
  ctx.lineTo(x + w - 2, y - 20);
  for (let xx = x + 4; xx < x + w; xx += 24) {
    ctx.moveTo(xx, y);
    ctx.lineTo(xx, y - 20);
  }
  ctx.stroke();
  for (const wx of [x + 26, x + w - 54]) { // windows, a lantern in each
    if (home && Math.abs(wx + 14 - WICK_HOME_X) < 40) continue;
    ctx.fillStyle = `rgba(255,220,160,${0.7 + 0.2 * Math.sin(time * 1.7 + wx)})`;
    ctx.fillRect(wx, y + 36, 28, 26);
    ctx.fillStyle = '#4a4058';
    ctx.fillRect(wx + 13, y + 36, 2, 26);
    ctx.fillRect(wx, y + 48, 28, 2);
  }
  if (home) { // the door, ajar, warm light inside, a lantern of its own over it
    const dx = WICK_HOME_X;
    ctx.fillStyle = '#3a3248';
    ctx.beginPath();
    ctx.roundRect(dx - 22, GROUND - 74, 44, 74, [12, 12, 0, 0]);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,214,150,0.65)';
    ctx.beginPath();
    ctx.roundRect(dx - 18, GROUND - 70, 30, 70, [10, 10, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#6a5a48';
    ctx.fillRect(dx + 6, GROUND - 70, 12, 70);
    ctx.fillStyle = `rgba(255,214,150,${0.35 + 0.1 * Math.sin(time * 2)})`;
    circle(ctx, dx, GROUND - 90, 14);
    ctx.fillStyle = '#ffe2a8';
    ctx.fillRect(dx - 3, GROUND - 95, 6, 9);
  }
}

// The lantern gallery: a plank walkway slung between two tall poles (the platform), hung underneath with lanterns
// on strings of every length
function drawGallery(ctx, p, time) {
  const a = p.x, b = p.x + p.w, y = p.y;
  ctx.fillStyle = '#3e3650';
  ctx.fillRect(a - 8, y - 30, 9, GROUND - y + 30);
  ctx.fillRect(b - 1, y - 30, 9, GROUND - y + 30);
  ctx.fillStyle = '#6a5e7a';
  ctx.fillRect(a, y, p.w, 7);
  ctx.strokeStyle = '#8a7a64';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(a - 4, y - 26);
  ctx.quadraticCurveTo((a + b) / 2, y - 14, b + 4, y - 26);
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const lx = a + 10 + i * ((p.w - 20) / 8), len = 18 + ((i * 37) % 50), sw = Math.sin(time * 1.1 + i) * 2, warm = i % 3 !== 1;
    ctx.strokeStyle = 'rgba(200,190,170,0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(lx, y + 7);
    ctx.lineTo(lx + sw, y + 7 + len);
    ctx.stroke();
    const ly = y + 7 + len + 6;
    ctx.fillStyle = warm ? `rgba(255,214,150,${0.24 + 0.08 * Math.sin(time * 2.4 + i)})` : 'rgba(214,190,255,0.24)';
    circle(ctx, lx + sw, ly, 13);
    ctx.fillStyle = '#2e2a3a';
    ctx.beginPath();
    ctx.roundRect(lx + sw - 5, ly - 7, 10, 14, 3);
    ctx.fill();
    ctx.fillStyle = warm ? '#ffe2a8' : '#e4d4ff';
    ctx.fillRect(lx + sw - 3, ly - 4.5, 6, 9);
  }
}

// Sedge's reed shed: a lean-to of woven reed panels, bundles of cut reed stacked against it, a frame with a hood
// half-woven on it, finished hoods hung on pegs
function drawReedShed(ctx, time) {
  const x = SEDGE_X - 110, w = 220, top = GROUND - 130;
  ctx.fillStyle = '#a8986a';
  ctx.beginPath();
  ctx.moveTo(x, GROUND);
  ctx.lineTo(x, top + 26);
  ctx.lineTo(x + w, top);
  ctx.lineTo(x + w, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(110,94,60,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let yy = top + 14; yy < GROUND; yy += 10) {
    ctx.moveTo(x, yy + 12);
    ctx.lineTo(x + w, yy - 4);
  }
  ctx.stroke();
  ctx.fillStyle = '#8a7a50'; // the roof's edge
  ctx.beginPath();
  ctx.moveTo(x - 12, top + 30);
  ctx.lineTo(x + w + 12, top - 6);
  ctx.lineTo(x + w + 12, top + 4);
  ctx.lineTo(x - 12, top + 40);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 3; i++) { // bundles of cut reed against the wall
    const bx = x - 30 + i * 14;
    ctx.fillStyle = i % 2 ? '#c8b880' : '#b8a874';
    ctx.beginPath();
    ctx.moveTo(bx, GROUND);
    ctx.lineTo(bx + 4, GROUND - 100 - i * 8);
    ctx.lineTo(bx + 14, GROUND - 98 - i * 8);
    ctx.lineTo(bx + 16, GROUND);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6a5a3a';
    ctx.fillRect(bx + 1, GROUND - 46, 15, 4);
  }
  for (let i = 0; i < 3; i++) { // hoods on pegs
    const hx = x + 50 + i * 46, hy = top + 56 - i * 6;
    ctx.fillStyle = '#4a4058';
    ctx.fillRect(hx - 1, hy - 4, 3, 6);
    ctx.fillStyle = i === 1 ? '#c8b880' : '#b8a874';
    ctx.beginPath();
    ctx.moveTo(hx - 14, hy + 24);
    ctx.bezierCurveTo(hx - 16, hy - 4, hx + 16, hy - 4, hx + 14, hy + 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9a7a4a';
    for (let k = -12; k <= 12; k += 6) ellipse(ctx, hx + k, hy + 25, 1.6, 3);
  }
  // the weaving frame, a hood half done on it
  const fx = x + w - 40;
  ctx.strokeStyle = '#5a4a3a';
  ctx.lineWidth = 3;
  ctx.strokeRect(fx - 26, GROUND - 92, 52, 70);
  ctx.strokeStyle = 'rgba(200,184,128,0.9)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let xx = fx - 22; xx <= fx + 22; xx += 5) {
    ctx.moveTo(xx, GROUND - 90);
    ctx.lineTo(xx, GROUND - 24);
  }
  for (let yy = GROUND - 60; yy < GROUND - 26; yy += 5) {
    ctx.moveTo(fx - 24, yy);
    ctx.lineTo(fx + 24, yy);
  }
  ctx.stroke();
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(fx - 28, GROUND - 22, 6, 22);
  ctx.fillRect(fx + 22, GROUND - 22, 6, 22);
  // her practice lantern, on a nail by the door
  ctx.fillStyle = `rgba(255,220,150,${0.25 + 0.1 * Math.sin(time * 2.6)})`;
  circle(ctx, x + 22, top + 70, 12);
  ctx.fillStyle = '#2e2a3a';
  ctx.beginPath();
  ctx.roundRect(x + 17, top + 63, 10, 14, 3);
  ctx.fill();
  ctx.fillStyle = '#ffe2a8';
  ctx.fillRect(x + 19.5, top + 66, 5, 8);
}

// The boardwalk's east end: it narrows and runs off into tall reeds; a post with an arm pointing east, burned in it:
// THE SHALLOWS
function drawEastEnd(ctx, time) {
  const x = WICK_EXIT_X;
  ctx.fillStyle = '#4a4058';
  ctx.fillRect(x - 140, GROUND - 100, 7, 100);
  ctx.fillStyle = '#7a6a54';
  ctx.beginPath();
  ctx.moveTo(x - 136, GROUND - 92);
  ctx.lineTo(x - 54, GROUND - 92);
  ctx.lineTo(x - 42, GROUND - 82);
  ctx.lineTo(x - 54, GROUND - 72);
  ctx.lineTo(x - 136, GROUND - 72);
  ctx.closePath();
  ctx.fill();
  text(ctx, 'THE SHALLOWS', x - 92, GROUND - 82, 10, '#ece2cc');
  for (let i = 0; i < 26; i++) { // reeds closing in
    const rx = x - 60 + i * 7 + Math.sin(i * 2.3) * 4, hh = 70 + ((i * 29) % 60), lean = Math.sin(time * 0.8 + i) * 3;
    ctx.strokeStyle = i % 3 ? '#6a7a50' : '#8a8a5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx, GROUND + 4);
    ctx.quadraticCurveTo(rx + lean * 0.5, GROUND - hh * 0.5, rx + lean, GROUND - hh);
    ctx.stroke();
    if (i % 4 === 0) {
      ctx.fillStyle = '#6a4a32';
      ellipse(ctx, rx + lean, GROUND - hh - 6, 3, 8);
    }
  }
}
