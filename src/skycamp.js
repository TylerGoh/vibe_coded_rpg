// Docs: docs/places/skydocks.md
// The Skydocks camp (room SKYCAMP, src/shared/rpg.js; atlas Phase 6): the Citadel's town, on the one pier under the
// dead city that still holds. West to east: Pilot Kestrel's stall under an awning, the mooring mast with the Kite
// tied up alongside (her gangway is a door, CAMP_DOCK_X), the ridge tent whose flap is everyone's own front door
// (CAMP_HOME_X), the waystone, the brazier lashed down with chains (you wake by it), a gantry hanging off the city on
// chains, Pilgrim Ione's lantern pole, Tamp's pile of salvaged gears, a second tent, and the pier's end, where the
// plank across to the next pier lies laid and lashed down (Phase 6 (c): a door into the Skydocks). Behind: a cold high
// sky, a sea of cloud below with the other islands' landmarks poking through it, the Citadel's underside overhead,
// and beyond the pier's end the broken piers of the Skydocks with a small brass figure at its post on one of them.
// The platforms are CAMP_PLATFORMS. This room paints its own sky; the Skydocks (src/skydocks.js) borrow it and the
// wind (drawCitadelSky, drawCitadelAir).
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { CAMP_W, FIELD_GROUND, CAMP_DOCK_X, CAMP_HOME_X, CAMP_FIRE_X, CAMP_END_X, CAMP_PLATFORMS, KESTREL_X, IONE_X } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';

const GROUND = FIELD_GROUND;
const HORIZON = 330;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const plats = (kind) => CAMP_PLATFORMS.filter((p) => p.kind === kind);
const plat = (kind) => plats(kind)[0];

function text(ctx, str, x, y, size, color) {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

const streaks = (() => {
  const r = mulberry32(401);
  return Array.from({ length: 22 }, () => ({ x: r() * W, y: r() * H, v: 260 + r() * 260, l: 30 + r() * 70 }));
})();
const motes = (() => {
  const r = mulberry32(409);
  return Array.from({ length: 40 }, () => ({ x: r() * W, y: r() * H, v: 60 + r() * 80, s: 0.8 + r() * 1.2, p: r() * TAU }));
})();
const billows = (() => {
  const r = mulberry32(419);
  return Array.from({ length: 26 }, (_, i) => ({ x: i * 80 + r() * 50, y: r() * 30, s: 40 + r() * 50 }));
})();

// Everything in the camp behind the slimes
export function drawSkycamp(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0); // the sky in screen space
  drawCitadelSky(ctx, camX, time);
  ctx.restore();
  const L = camX - 100, R = camX + viewW + 100;
  if (visible(CAMP_END_X - 400, CAMP_W, L, R)) drawBeyond(ctx, time);
  if (visible(CAMP_DOCK_X - 420, CAMP_DOCK_X + 420, L, R)) drawKite(ctx, time);
  drawPier(ctx, Math.max(0, L), Math.min(CAMP_END_X + 158, R)); // (past the last post it's only the plank, over the cloud)
  if (visible(KESTREL_X - 140, KESTREL_X + 260, L, R)) drawStall(ctx, time);
  if (visible(CAMP_DOCK_X - 100, CAMP_DOCK_X + 100, L, R)) drawMast(ctx, time);
  for (const p of plats('tent')) if (visible(p.x - 40, p.x + p.w + 40, L, R)) drawTent(ctx, p, time, p.x < CAMP_HOME_X);
  if (visible(CAMP_FIRE_X - 80, CAMP_FIRE_X + 80, L, R)) drawBrazier(ctx, time);
  const g = plat('gantry');
  if (visible(g.x - 40, g.x + g.w + 40, L, R)) drawGantry(ctx, g, time);
  if (visible(IONE_X - 80, IONE_X + 80, L, R)) drawLanternPole(ctx, time);
  const gp = plat('gears');
  if (visible(gp.x - 40, gp.x + gp.w + 60, L, R)) drawGearPile(ctx, gp);
  if (visible(CAMP_END_X - 100, CAMP_W + 40, L, R)) drawPierEnd(ctx, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawCitadelAir(ctx, time);
  ctx.restore();
}

// A house can look out on the camp (its `view`, docs/places/houses.md): the sky and the wind, in screen space
export function drawSkycampView(ctx, camX, time) {
  drawCitadelSky(ctx, camX, time);
  drawCitadelAir(ctx, time);
}

// ——— the sky ———
export function drawCitadelSky(ctx, camX, time, roomW = CAMP_W) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#2f4f92');
  sky.addColorStop(0.6, '#7ea6d8');
  sky.addColorStop(1, '#d6e4f4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; // a few stars, it's that high
  for (let i = 0; i < 14; i++) circle(ctx, (i * 173 + 40) % W, 30 + ((i * 59) % 90), 0.8 + (i % 3) * 0.4);
  // the other islands, their landmarks standing up out of the cloud sea
  drawDistantIslands(ctx, { from: 'citadel', scroll: camX, roomW, time, horizon: HORIZON, haze: '#d6e4f4', fade: 0.55, scale: 0.55, night: 0.25, sky: 200 });
  // the sea of cloud below, rolling
  ctx.fillStyle = '#eef2f8';
  ctx.fillRect(0, HORIZON + 10, W, H - HORIZON);
  for (const b of billows) {
    const x = ((b.x - camX * 0.15 - time * 4) % 2080 + 2080) % 2080 - 100;
    if (x < -120 || x > W + 120) continue;
    ctx.fillStyle = '#f6f8fc';
    circle(ctx, x, HORIZON + 22 + b.y, b.s);
    ctx.fillStyle = 'rgba(200,210,230,0.5)';
    ellipse(ctx, x, HORIZON + 40 + b.y + b.s * 0.4, b.s, 6);
  }
  // the Citadel's underside overhead: dark brass, plating seams, a slow gear, chains hanging down
  const p = -camX * 0.3;
  ctx.fillStyle = '#4e4858';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = -40; x <= W + 80; x += 60) {
    const wx = x - (((p % 60) + 60) % 60);
    ctx.lineTo(wx, 40 + Math.sin((wx - p) * 0.011) * 18 + (Math.round((wx - p) / 60) % 3 === 0 ? 14 : 0));
  }
  ctx.lineTo(W, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(200,160,90,0.45)';
  for (let x = ((p % 150) + 150) % 150 - 150; x < W; x += 150) ctx.fillRect(x, 18, 80, 4);
  const gx = ((p + 700) % 1400 + 1400) % 1400 - 200;
  ctx.save();
  ctx.translate(gx, 30);
  ctx.rotate(time * 0.02);
  ctx.fillStyle = '#6e6052';
  ctx.beginPath();
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TAU, r = i % 2 ? 48 : 56;
    i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4e4858';
  circle(ctx, 0, 0, 20);
  ctx.restore();
}

// Wind streaks and ice motes blowing through, over everything
export function drawCitadelAir(ctx, time) {
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const s of streaks) {
    const x = W - (((s.x + time * s.v) % (W + 200)) + (W + 200)) % (W + 200) + 100;
    ctx.moveTo(x, s.y);
    ctx.lineTo(x + s.l, s.y);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,248,255,0.7)';
  for (const m of motes) {
    const x = W - (((m.x + time * m.v) % W) + W) % W;
    circle(ctx, x, (m.y + Math.sin(time + m.p) * 10 + H) % H, m.s);
  }
}

// ——— the pier ———
// Weathered planks on iron joists, struts going down into the cloud
function drawPier(ctx, L, R) {
  if (R <= L) return;
  ctx.strokeStyle = '#4e4652'; // the struts below
  ctx.lineWidth = 7;
  ctx.beginPath();
  for (let x = Math.floor(L / 220) * 220; x < R + 220; x += 220) {
    ctx.moveTo(x, GROUND + 18);
    ctx.lineTo(x + 40, H + 10);
    ctx.moveTo(x + 110, GROUND + 18);
    ctx.lineTo(x + 70, H + 10);
  }
  ctx.stroke();
  ctx.fillStyle = '#5a4e58'; // the joist
  ctx.fillRect(L, GROUND + 6, R - L, 16);
  ctx.fillStyle = '#8a7058'; // the planks
  ctx.fillRect(L, GROUND - 2, R - L, 12);
  ctx.fillStyle = '#a88a6a';
  for (let x = Math.floor(L / 46) * 46; x < R; x += 46) {
    ctx.fillRect(x, GROUND - 2, 42, 4);
    if ((x / 46) % 7 === 3) { // a missing plank here and there, cloud showing through
      ctx.fillStyle = '#dfe6f0';
      ctx.fillRect(x + 4, GROUND + 2, 34, 6);
      ctx.fillStyle = '#a88a6a';
    }
  }
}

// Pilot Kestrel's stall: a striped awning on poles over her crates (a platform), sacks and coils of rope, a lamp
function drawStall(ctx, time) {
  const x0 = KESTREL_X - 110, x1 = KESTREL_X + 90, top = GROUND - 150;
  ctx.fillStyle = '#6a5040';
  for (const x of [x0, x1]) ctx.fillRect(x - 3, top, 6, GROUND - top);
  const flap = Math.sin(time * 4) * 3;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? '#f0e2c8' : '#c95f58';
    const a = x0 + ((x1 - x0) / 5) * i, b = a + (x1 - x0) / 5;
    ctx.beginPath();
    ctx.moveTo(a, top);
    ctx.lineTo(b, top);
    ctx.lineTo(b, top + 22 + flap);
    ctx.quadraticCurveTo((a + b) / 2, top + 30 + flap, a, top + 22 + flap);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#fff6ea'; // her board
  ctx.beginPath();
  ctx.roundRect(KESTREL_X - 56, top + 36, 112, 24, 5);
  ctx.fill();
  text(ctx, "KESTREL'S", KESTREL_X, top + 48, 12, '#7a3a38');
  const c = plat('crates'), n = Math.round(c.w / 54), cw = c.w / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#c9a77e' : '#d9b890';
    ctx.beginPath();
    ctx.roundRect(c.x + i * cw + 1, c.y + 1, cw - 2, GROUND - c.y - 2, 4);
    ctx.fill();
    ctx.strokeStyle = '#a07a52';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + i * cw + 6, c.y + 6, cw - 12, GROUND - c.y - 14);
  }
  ctx.fillStyle = '#c8b090'; // sacks
  ellipse(ctx, KESTREL_X - 70, GROUND - 14, 16, 14);
  ellipse(ctx, KESTREL_X - 46, GROUND - 10, 12, 10);
  ctx.strokeStyle = '#c9b8aa'; // a coil of rope
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(c.x + c.w + 30, GROUND - 6 - i * 5, 18 - i * 3, 5, 0, 0, TAU);
    ctx.stroke();
  }
  const lx = x1 - 14, ly = top + 26 + Math.sin(time * 2) * 2; // the lamp
  ctx.fillStyle = 'rgba(255,220,150,0.3)';
  circle(ctx, lx, ly + 10, 16);
  ctx.fillStyle = '#4a3c40';
  ctx.fillRect(lx - 5, ly, 10, 16);
  ctx.fillStyle = '#ffe2a0';
  ctx.fillRect(lx - 3, ly + 3, 6, 10);
}

// The Kite moored alongside the pier, behind it: the envelope up over the mast, the gondola's rim at the pier's edge
function drawKite(ctx, time) {
  const cx = CAMP_DOCK_X + 20, bob = Math.sin(time * 0.9) * 4, cy = 120 + bob;
  ctx.strokeStyle = 'rgba(200,190,175,0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const dx of [-300, -150, 0, 150, 300]) {
    ctx.moveTo(cx + dx * 0.7, cy + 70);
    ctx.lineTo(cx + dx, GROUND - 40 + bob);
  }
  ctx.stroke();
  ctx.fillStyle = '#c95f58';
  ctx.strokeStyle = '#7a3a38';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 330, 96, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, 328, 94, 0, 0, TAU);
  ctx.clip();
  ctx.fillStyle = '#f0e2c8';
  for (let x = cx - 330; x < cx + 330; x += 120) ctx.fillRect(x, cy - 100, 60, 200);
  ctx.fillStyle = '#d8c8a8';
  ctx.fillRect(cx - 160, cy - 20, 22, 16);
  ctx.fillRect(cx + 120, cy + 10, 18, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ellipse(ctx, cx - 120, cy - 50, 120, 20);
  ctx.restore();
  text(ctx, 'KITE', cx, cy + 6, 24, '#7a3a38');
  // the gondola's rim, just showing behind the pier's edge
  ctx.fillStyle = '#b0804e';
  ctx.beginPath();
  ctx.roundRect(cx - 320, GROUND - 40 + bob, 640, 44, [8, 8, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(cx - 320, GROUND - 42 + bob, 640, 5);
}

// The mooring mast at the gangway: an iron mast with a brass ring up it (a platform) the Kite's lines run to, and the
// plank across to her gondola
function drawMast(ctx, time) {
  const x = CAMP_DOCK_X, ring = plat('ring');
  ctx.fillStyle = '#5a5262';
  ctx.fillRect(x - 70, ring.y - 60, 12, GROUND - ring.y + 60);
  ctx.fillStyle = BRASS_RING;
  ctx.beginPath();
  ctx.roundRect(ring.x, ring.y, ring.w, 10, 5);
  ctx.fill();
  ctx.strokeStyle = '#5a5262';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 64, ring.y - 50);
  ctx.lineTo(ring.x + 4, ring.y);
  ctx.moveTo(x - 64, ring.y - 50);
  ctx.lineTo(ring.x + ring.w - 4, ring.y);
  ctx.stroke();
  ctx.fillStyle = '#c84a4a'; // a windsock, streaming
  const k = Math.sin(time * 5) * 3;
  ctx.beginPath();
  ctx.moveTo(x - 58, ring.y - 56);
  ctx.lineTo(x - 58 + 40, ring.y - 52 + k);
  ctx.lineTo(x - 58 + 38, ring.y - 42 + k);
  ctx.lineTo(x - 58, ring.y - 44);
  ctx.closePath();
  ctx.fill();
  // the plank out to her
  ctx.fillStyle = '#c99b6b';
  ctx.beginPath();
  ctx.moveTo(x - 30, GROUND);
  ctx.lineTo(x + 30, GROUND);
  ctx.lineTo(x + 24, GROUND - 36);
  ctx.lineTo(x - 24, GROUND - 36);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a77b52';
  for (let i = 1; i < 4; i++) ctx.fillRect(x - 28 + i * 1.6, GROUND - i * 9, 56 - i * 3.2, 2);
}
const BRASS_RING = '#c9a24a';

// A ridge tent (the roof's ridge pole is a platform), its guy-lines pegged to the planks. The home tent's flap is
// tied back on a warm dark inside, a little lamp by it
function drawTent(ctx, p, time, home) {
  const x0 = p.x, x1 = p.x + p.w, y = p.y + 4, flap = Math.sin(time * 3 + p.x) * 2;
  ctx.strokeStyle = 'rgba(200,190,175,0.9)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x0, y + 4);
  ctx.lineTo(x0 - 40, GROUND);
  ctx.moveTo(x1, y + 4);
  ctx.lineTo(x1 + 40, GROUND);
  ctx.stroke();
  ctx.fillStyle = home ? '#c8b8a0' : '#a8b4c0';
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.lineTo(x1 + 22, GROUND + flap * 0.3);
  ctx.lineTo(x0 - 22, GROUND - flap * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = home ? '#b0a088' : '#909ca8';
  ctx.fillRect(x0 - 10, (y + GROUND) / 2 + flap, x1 - x0 + 20, 3);
  ctx.fillStyle = '#6a5040'; // the ridge pole
  ctx.beginPath();
  ctx.roundRect(x0 - 6, p.y, p.w + 12, 8, 4);
  ctx.fill();
  if (home) {
    const dx = CAMP_HOME_X;
    ctx.fillStyle = '#3a2c34';
    ctx.beginPath();
    ctx.moveTo(dx - 26, GROUND);
    ctx.lineTo(dx, GROUND - 78);
    ctx.lineTo(dx + 26, GROUND);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,200,130,0.35)';
    ellipse(ctx, dx, GROUND - 20, 14, 18);
    ctx.fillStyle = '#d8c8b0'; // the flap, tied back
    ctx.beginPath();
    ctx.moveTo(dx, GROUND - 78);
    ctx.lineTo(dx + 26, GROUND);
    ctx.lineTo(dx + 40, GROUND - 30);
    ctx.closePath();
    ctx.fill();
  }
}

// The brazier: an iron bowl on legs, chained down to the planks against the wind, the fire leaning hard east
function drawBrazier(ctx, time) {
  const x = CAMP_FIRE_X, top = GROUND - 56;
  ctx.strokeStyle = '#3e3844';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const dx of [-30, 30]) {
    ctx.moveTo(x + dx * 0.6, top + 10);
    ctx.lineTo(x + dx * 1.6, GROUND);
  }
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#4e4858';
  ctx.beginPath();
  for (const dx of [-18, 0, 18]) {
    ctx.moveTo(x + dx, top + 16);
    ctx.lineTo(x + dx * 1.3, GROUND);
  }
  ctx.stroke();
  const glow = 0.3 + 0.08 * Math.sin(time * 6);
  ctx.fillStyle = `rgba(255,170,90,${glow})`;
  circle(ctx, x + 10, top - 20, 60);
  for (let i = 0; i < 6; i++) {
    const k = (time * 1.4 + i / 6) % 1;
    ctx.fillStyle = `rgba(255,${180 + i * 10},90,${1 - k})`;
    ellipse(ctx, x - 14 + i * 6 + k * 40, top - 6 - k * 34, 7 * (1 - k) + 2, 10 * (1 - k) + 2, 0.8);
  }
  ctx.fillStyle = '#4e4858';
  ctx.beginPath();
  ctx.moveTo(x - 34, top);
  ctx.lineTo(x + 34, top);
  ctx.lineTo(x + 22, top + 18);
  ctx.lineTo(x - 22, top + 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(x - 34, top - 2, 68, 4);
}

// A gantry hanging off the city's underside on two chains (a platform), swaying a little (drawing only)
function drawGantry(ctx, g, time) {
  ctx.strokeStyle = '#4e4652';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 3]);
  ctx.beginPath();
  for (const x of [g.x + 14, g.x + g.w - 14]) {
    ctx.moveTo(x, 40);
    ctx.lineTo(x, g.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#6a5c50';
  ctx.beginPath();
  ctx.roundRect(g.x, g.y, g.w, 12, 3);
  ctx.fill();
  ctx.strokeStyle = '#8a7058';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = g.x + 10; x < g.x + g.w - 10; x += 20) {
    ctx.moveTo(x, g.y + 12);
    ctx.lineTo(x + 10, g.y + 22);
    ctx.lineTo(x + 20, g.y + 12);
  }
  ctx.stroke();
  ctx.fillStyle = '#b8924a';
  circle(ctx, g.x + g.w / 2, g.y + 30 + Math.sin(time) * 2, 6); // an empty mooring ring hanging under it
  ctx.fillStyle = '#6a5c50';
  circle(ctx, g.x + g.w / 2, g.y + 30 + Math.sin(time) * 2, 3.4);
}

// Ione's lantern pole: a tall staff lashed to a bollard, a lantern at the top that she keeps lit, a bedroll below
function drawLanternPole(ctx, time) {
  const x = IONE_X + 70, top = GROUND - 190;
  ctx.fillStyle = '#6a5040';
  ctx.fillRect(x - 3, top, 6, GROUND - top);
  ctx.fillStyle = '#4e4652';
  ctx.beginPath();
  ctx.roundRect(x - 12, GROUND - 26, 24, 26, 6);
  ctx.fill();
  const sw = Math.sin(time * 1.3) * 3, lx = x + 14 + sw, ly = top + 18;
  ctx.strokeStyle = '#3a2c34';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, top + 4);
  ctx.lineTo(x + 14, top + 4);
  ctx.lineTo(lx, ly - 10);
  ctx.stroke();
  ctx.fillStyle = `rgba(255,220,160,${0.25 + 0.08 * Math.sin(time * 2.6)})`;
  circle(ctx, lx, ly, 26);
  ctx.fillStyle = '#3a2c34';
  ctx.beginPath();
  ctx.roundRect(lx - 8, ly - 10, 16, 22, 3);
  ctx.fill();
  ctx.fillStyle = '#ffe2a0';
  ctx.beginPath();
  ctx.roundRect(lx - 5, ly - 6, 10, 14, 2);
  ctx.fill();
  ctx.fillStyle = '#7a6498'; // her bedroll
  ctx.beginPath();
  ctx.roundRect(IONE_X - 90, GROUND - 16, 60, 16, 8);
  ctx.fill();
  ctx.fillStyle = '#5e4a7a';
  circle(ctx, IONE_X - 90, GROUND - 8, 8);
}

// Tamp's pile of salvaged gears (a platform): brass and iron gears of every size heaped on a tarp, a few sorted out in
// rows beside it, none of them the one he wants
function drawGearPile(ctx, p) {
  ctx.fillStyle = '#8a8478';
  ctx.beginPath();
  ctx.moveTo(p.x - 20, GROUND);
  ctx.lineTo(p.x + p.w + 20, GROUND);
  ctx.lineTo(p.x + p.w - 10, p.y + 10);
  ctx.lineTo(p.x + 10, p.y + 10);
  ctx.closePath();
  ctx.fill();
  const gear = (x, y, r, c, rot) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = c;
    ctx.beginPath();
    const n = Math.max(8, Math.round(r * 0.8));
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * TAU, rr = i % 2 ? r : r + 4;
      i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(40,30,40,0.5)';
    circle(ctx, 0, 0, r * 0.3);
    ctx.restore();
  };
  gear(p.x + 30, p.y + 40, 22, '#b8924a', 0.3);
  gear(p.x + 80, p.y + 24, 28, '#8a8490', 1.1);
  gear(p.x + 130, p.y + 44, 18, '#c9a24a', 0.7);
  gear(p.x + 60, p.y + 66, 16, '#7a7480', 0.2);
  gear(p.x + 110, p.y + 72, 14, '#b8924a', 2);
  ctx.fillStyle = '#6a6470'; // the top of the pile, flat enough to stand on
  ctx.fillRect(p.x, p.y, p.w, 6);
  for (let i = 0; i < 5; i++) gear(p.x + p.w + 40 + i * 18, GROUND - 7, 6, i % 2 ? '#c9a24a' : '#8a8490', i); // sorted, in a row
}

// The pier's end: the rail opened up, and the plank across to the next pier laid flat and lashed down at this end (the
// way on to the Skydocks since Phase 6 (c)), ropes strung along it for a handrail, the flag still cracking in the wind,
// and a board nailed to the post with the way chalked on it
function drawPierEnd(ctx, time) {
  const x = CAMP_END_X;
  ctx.fillStyle = '#5a4e58'; // the rail's posts, the rail itself unshipped and stacked
  ctx.fillRect(x - 40, GROUND - 40, 8, 40);
  ctx.fillRect(x + 150, GROUND - 40, 8, 40);
  ctx.fillStyle = '#8a7058';
  ctx.fillRect(x - 70, GROUND - 10, 90, 6);
  ctx.fillRect(x - 64, GROUND - 16, 80, 6);
  // the plank: from the pier's end out over the gap, off the room's edge, flexing a little in the wind
  const sag = Math.sin(time * 2.2) * 2;
  ctx.fillStyle = '#c99b6b';
  ctx.beginPath();
  ctx.moveTo(x + 10, GROUND - 2);
  ctx.quadraticCurveTo(x + 200, GROUND + 6 + sag, CAMP_W + 60, GROUND - 2);
  ctx.lineTo(CAMP_W + 60, GROUND + 8);
  ctx.quadraticCurveTo(x + 200, GROUND + 16 + sag, x + 10, GROUND + 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,190,175,0.95)'; // the lashings and the handrope
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const lx of [x + 20, x + 34]) {
    ctx.moveTo(lx, GROUND - 4);
    ctx.lineTo(lx + 4, GROUND + 12);
  }
  ctx.moveTo(x + 154, GROUND - 38);
  ctx.quadraticCurveTo(x + 260, GROUND - 20 + sag, CAMP_W + 60, GROUND - 36);
  ctx.stroke();
  ctx.fillStyle = '#5a4e58'; // the flag
  ctx.fillRect(x + 92, GROUND - 170, 4, 170);
  ctx.fillStyle = '#e8c45a';
  ctx.beginPath();
  ctx.moveTo(x + 96, GROUND - 170);
  for (let i = 0; i <= 6; i++) ctx.lineTo(x + 96 + i * 10, GROUND - 170 + Math.sin(time * 9 + i) * 4);
  for (let i = 6; i >= 0; i--) ctx.lineTo(x + 96 + i * 10, GROUND - 146 + Math.sin(time * 9 + i) * 4);
  ctx.closePath();
  ctx.fill();
  // the board on the flagpole: the way, chalked
  ctx.fillStyle = '#6a5040';
  ctx.beginPath();
  ctx.roundRect(x + 40, GROUND - 120, 112, 30, 4);
  ctx.fill();
  text(ctx, 'The Skydocks', x + 92, GROUND - 105, 13, '#f2ece0');
}

// Past the pier's end, across a gap of cloud: the Skydocks' broken piers at different heights, empty mooring rings,
// and on one of them a small brass figure at its post, a ledger in its hands (the Dockwarden, Phase 6 (c))
function drawBeyond(ctx, time) {
  const x0 = CAMP_END_X - 230; // (far off, so drawn up in the sky above the pier's end, small)
  for (const [x, y, w] of [[x0, 214, 170], [x0 + 200, 150, 140], [x0 - 120, 110, 100]]) {
    ctx.fillStyle = '#6e6260';
    ctx.fillRect(x, y, w, 10);
    ctx.strokeStyle = '#5a5262';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 10);
    ctx.lineTo(x + 30, y + 140);
    ctx.moveTo(x + w - 20, y + 10);
    ctx.lineTo(x + w - 40, y + 120);
    ctx.stroke();
    ctx.strokeStyle = '#b8924a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 22 + Math.sin(time + x) * 2, 7, 0, TAU);
    ctx.stroke();
  }
  // the Dockwarden, small and far: a brass body, a round head with one lit eye, a ledger
  const dx = x0 + 110, dy = 214;
  ctx.fillStyle = '#b8924a';
  ctx.beginPath();
  ctx.roundRect(dx - 6, dy - 20, 12, 20, 3);
  ctx.fill();
  circle(ctx, dx, dy - 25, 6);
  ctx.fillStyle = `rgba(150,220,255,${0.6 + 0.3 * Math.sin(time * 2)})`;
  circle(ctx, dx + 2, dy - 26, 1.6);
  ctx.fillStyle = '#e8dcc0';
  ctx.fillRect(dx + 4, dy - 15, 6, 7);
}
