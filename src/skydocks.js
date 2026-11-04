// Docs: docs/places/skydocks.md
// The Skydocks (room SKYDOCKS, data in src/shared/rpg.js; atlas Phase 6 (c)): the Citadel's broken piers, past the
// camp's pier end across the plank. You come in at the WEST end (the plank from the camp) and go east: the Outer
// Moorings, the Warden's Pier (the Dockwarden at its post, WARDEN_X, with its arrivals board and the crates nobody came
// for; the waystone is drawn by src/waystones.js), the Hanging Gantries and the Loading Ramp, which climbs at the east
// end into an open brass gate in the city's underside (the way into Cogwork Bastion). Between the piers the deck is only
// planks laid over the cloud, and gusts blow across them (GUSTS, drawn from the server tick: drawGap). The Harbour Lamp,
// a dead signal lamp in a brass cage hanging high over the Gantries (last in SKYDOCKS_PLATFORMS), is the find.
// The sky and the wind are the camp's (drawCitadelSky, drawCitadelAir in src/skycamp.js). Paints its own sky.
import { W, TAU, mulberry32, circle, ellipse } from './util.js';
import { SKYDOCKS_W, SKYDOCKS_EXIT_X, SKYDOCKS_RAMP_X, SKYDOCKS_ZONES, SKYDOCKS_PLATFORMS, WARDEN_X, FIELD_GROUND, GUSTS, gustAt } from './shared/rpg.js';
import { drawCitadelSky, drawCitadelAir } from './skycamp.js';

const GROUND = FIELD_GROUND;
const LAMP = SKYDOCKS_PLATFORMS.at(-1);
const BRASS = '#c9a24a', BRASS_D = '#8a6a2a', VERD = '#5e9c88';
const IRON = '#5a4e58', IRON_D = '#3e3a48';
const PLANK = '#8a7058', PLANK_L = '#a88a6a', PLANK_N = '#c99b6b';
const RAMP_X0 = SKYDOCKS_RAMP_X - 30; // where the loading ramp starts to climb (its door is at the foot)
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color) {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
// bollards along the deck, most with an empty mooring ring on them (world x; none in the gaps or on the ramp)
const BOLLARDS = (() => {
  const r = mulberry32(6901);
  const out = [];
  for (let x = 260; x < RAMP_X0 - 60; x += 240 + r() * 260) if (!GUSTS.some((g) => Math.abs(x - g.x) < g.w / 2 + 40)) out.push({ x, ring: r() < 0.7 });
  return out;
})();
// chains hanging down out of the city here and there, swaying, their ends broken off (world x)
const CHAINS = (() => {
  const r = mulberry32(6907);
  const out = [];
  for (let x = 140; x < SKYDOCKS_W; x += 280 + r() * 360) out.push({ x, len: 90 + r() * 170, p: r() * TAU });
  return out;
})();
// broken piers far off, at different heights (screen space, slow parallax)
const FAR = (() => {
  const r = mulberry32(6911);
  return Array.from({ length: 9 }, (_, i) => ({ x: i * 340 + r() * 140, y: 150 + r() * 130, w: 90 + r() * 120, tilt: (r() - 0.5) * 0.12 }));
})();

// Everything on the Skydocks behind the slimes. tick: the server tick (the gusts follow it), or null
export function drawSkydocks(ctx, camX, viewW, time, tick) {
  ctx.save();
  ctx.translate(camX, 0); // the sky in screen space
  drawCitadelSky(ctx, camX, time, SKYDOCKS_W);
  drawFarPiers(ctx, camX, time);
  ctx.restore();
  const L = camX - 120, R = camX + viewW + 120;
  for (const c of CHAINS) if (visible(c.x - 20, c.x + 20, L, R)) drawChain(ctx, c, time);
  if (visible(RAMP_X0 - 80, SKYDOCKS_W + 40, L, R)) drawRamp(ctx, time);
  drawDeck(ctx, Math.max(0, L), Math.min(RAMP_X0, R));
  GUSTS.forEach((g, i) => {
    if (visible(g.x - g.w / 2 - 40, g.x + g.w / 2 + 40, L, R)) drawGap(ctx, g, tick == null ? { k: 0, blow: false } : gustAt(i, Math.floor(tick)), time);
  });
  if (visible(-40, SKYDOCKS_EXIT_X + 200, L, R)) drawPlankEnd(ctx, time);
  for (const b of BOLLARDS) if (visible(b.x - 30, b.x + 30, L, R)) drawBollard(ctx, b, time);
  if (visible(WARDEN_X - 140, WARDEN_X + 260, L, R)) drawWardenPost(ctx, time);
  for (const p of SKYDOCKS_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'pier') drawStage(ctx, p);
    else if (p.kind === 'gantry') drawGantry(ctx, p, time);
    else if (p.kind === 'crates') drawCrates(ctx, p);
  }
  if (visible(LAMP.x - 60, LAMP.x + LAMP.w + 60, L, R)) drawLamp(ctx, LAMP, time);
  SKYDOCKS_ZONES.forEach((z) => {
    if (!z.lvl) return;
    const sx = z.x0 + 200; // you come in from the west: each zone's sign stands just inside its west edge
    if (visible(sx - 90, sx + 90, L, R)) drawZoneSign(ctx, sx, z);
  });
  ctx.save();
  ctx.translate(camX, 0);
  drawCitadelAir(ctx, time);
  ctx.restore();
}

// ——— far off ———
function drawFarPiers(ctx, camX, time) {
  const span = 3060;
  for (const f of FAR) {
    const x = ((((f.x - camX * 0.25) % span) + span) % span) - 200;
    if (x < -260 || x > W + 60) continue;
    ctx.save();
    ctx.translate(x, f.y);
    ctx.rotate(f.tilt);
    ctx.fillStyle = 'rgba(110,98,110,0.55)';
    ctx.fillRect(0, 0, f.w, 7);
    ctx.strokeStyle = 'rgba(90,82,98,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(18, -f.y + 30); // its chains up to the city
    ctx.moveTo(f.w - 10, 0);
    ctx.lineTo(f.w - 22, -f.y + 30);
    ctx.moveTo(f.w * 0.3, 7);
    ctx.lineTo(f.w * 0.36, 70); // a strut, hanging loose
    ctx.stroke();
    ctx.strokeStyle = 'rgba(184,146,74,0.5)';
    ctx.beginPath();
    ctx.arc(f.w * 0.6, 14 + Math.sin(time + f.x) * 1.5, 5, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}

// A chain hanging out of the city, swaying, broken off at the end
function drawChain(ctx, c, time) {
  const sw = Math.sin(time * 0.9 + c.p) * 6;
  ctx.strokeStyle = 'rgba(78,70,82,0.85)';
  ctx.lineWidth = 2.4;
  for (let y = 40, i = 0; y < 40 + c.len; y += 9, i++) {
    const x = c.x + sw * ((y - 40) / c.len);
    ctx.beginPath();
    ctx.ellipse(x, y, i % 2 ? 2 : 3.4, i % 2 ? 4.5 : 5, 0, 0, TAU);
    ctx.stroke();
  }
}

// ——— the deck ———
// Weathered planks on an iron joist, struts going down into the cloud; nothing under the gaps but the cloud
function drawDeck(ctx, L, R) {
  if (R <= L) return;
  const runs = [];
  let a = L;
  for (const g of [...GUSTS].sort((p, q) => p.x - q.x)) {
    const g0 = g.x - g.w / 2, g1 = g.x + g.w / 2;
    if (g1 <= a || g0 >= R) continue;
    if (g0 > a) runs.push([a, g0]);
    a = Math.max(a, g1);
  }
  if (a < R) runs.push([a, R]);
  for (const [x0, x1] of runs) {
    ctx.strokeStyle = '#4e4652';
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (let x = Math.ceil(x0 / 220) * 220; x < x1; x += 220) {
      ctx.moveTo(x, GROUND + 18);
      ctx.lineTo(x + 40, GROUND + 140);
      if (x + 110 < x1) {
        ctx.moveTo(x + 110, GROUND + 18);
        ctx.lineTo(x + 70, GROUND + 140);
      }
    }
    ctx.stroke();
    ctx.fillStyle = IRON;
    ctx.fillRect(x0, GROUND + 6, x1 - x0, 16);
    ctx.fillStyle = PLANK;
    ctx.fillRect(x0, GROUND - 2, x1 - x0, 12);
    ctx.fillStyle = PLANK_L;
    for (let x = Math.floor(x0 / 46) * 46; x < x1; x += 46) {
      const px = Math.max(x, x0), pw = Math.min(x + 42, x1) - px;
      if (pw > 0) ctx.fillRect(px, GROUND - 2, pw, 4);
    }
    ctx.fillStyle = IRON_D; // the broken ends of the joist, where the pier gave out
    for (const x of [x0, x1]) if (x > 1 && x < RAMP_X0 - 1) ctx.fillRect(x - 3, GROUND - 2, 6, 26);
  }
}

// A gap between piers: two planks laid across it side by side, a rope strung either side for a handrail, a short post
// with a pennant at each end. The wind gets up (k: streaks thicken across the gap, the pennants stand out, the planks
// shudder) and blows (white gusts tearing across at plank height: off the planks, or jump), then drops.
function drawGap(ctx, g, st, time) {
  const x0 = g.x - g.w / 2, x1 = g.x + g.w / 2;
  const shake = st.blow ? Math.sin(time * 40) * 2 : st.k * Math.sin(time * 26) * 1.2;
  const sag = 8 + (st.blow ? 4 : 0);
  // the planks
  ctx.fillStyle = PLANK_N;
  ctx.beginPath();
  ctx.moveTo(x0 - 4, GROUND - 2);
  ctx.quadraticCurveTo(g.x, GROUND + sag + shake, x1 + 4, GROUND - 2);
  ctx.lineTo(x1 + 4, GROUND + 8);
  ctx.quadraticCurveTo(g.x, GROUND + sag + 10 + shake, x0 - 4, GROUND + 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,90,60,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, GROUND + 3);
  ctx.quadraticCurveTo(g.x, GROUND + sag + 5 + shake, x1, GROUND + 3);
  ctx.stroke();
  // posts and the handropes
  ctx.fillStyle = IRON_D;
  for (const x of [x0 - 10, x1 + 4]) ctx.fillRect(x, GROUND - 58, 6, 58);
  ctx.strokeStyle = 'rgba(200,190,175,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 - 7, GROUND - 54);
  ctx.quadraticCurveTo(g.x, GROUND - 30 + shake * 2 + (st.blow ? 10 : 0), x1 + 7, GROUND - 54);
  ctx.stroke();
  // the pennants: limp, then standing out hard to the west (the wind blows from the east here, like in the camp)
  for (const px of [x0 - 7, x1 + 7]) {
    const stiff = 0.25 + st.k * 0.75;
    ctx.fillStyle = st.blow ? '#e8705a' : '#e8c45a';
    ctx.beginPath();
    ctx.moveTo(px, GROUND - 58);
    for (let i = 0; i <= 4; i++) ctx.lineTo(px - i * 7 * stiff - i * 1.5, GROUND - 58 + i * (1 - stiff) * 5 + Math.sin(time * (6 + st.k * 10) + i) * 2);
    for (let i = 4; i >= 0; i--) ctx.lineTo(px - i * 7 * stiff - i * 1.5, GROUND - 46 + i * (1 - stiff) * 5 + Math.sin(time * (6 + st.k * 10) + i) * 2);
    ctx.closePath();
    ctx.fill();
  }
  // the wind across the gap
  const n = Math.round(3 + st.k * 9 + (st.blow ? 8 : 0));
  ctx.strokeStyle = st.blow ? 'rgba(255,255,255,0.75)' : `rgba(255,255,255,${0.12 + st.k * 0.35})`;
  ctx.lineWidth = st.blow ? 2.4 : 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const v = st.blow ? 900 : 300 + st.k * 400, len = st.blow ? 60 : 26 + st.k * 20;
    const x = x1 - ((((time * v + i * 97) % (g.w + 120)) + g.w + 120) % (g.w + 120)) + 60;
    const y = GROUND - 8 - ((i * 37) % 70);
    if (x < x0 - 30 || x > x1 + 30) continue;
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (st.blow ? 2 : 0));
  }
  ctx.stroke();
  if (st.blow) { // a white tear of air right over the planks
    ctx.fillStyle = 'rgba(240,246,255,0.18)';
    ellipse(ctx, g.x, GROUND - 30, g.w * 0.55, 34);
  }
}

// The west end: the plank from the camp, laid over the gap and lashed to a bollard, and a board with the way back
function drawPlankEnd(ctx, time) {
  const sag = Math.sin(time * 2.2) * 2;
  ctx.fillStyle = PLANK_N;
  ctx.beginPath();
  ctx.moveTo(-60, GROUND - 2);
  ctx.quadraticCurveTo(30, GROUND + 6 + sag, 120, GROUND - 2);
  ctx.lineTo(120, GROUND + 8);
  ctx.quadraticCurveTo(30, GROUND + 16 + sag, -60, GROUND + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = IRON_D;
  ctx.fillRect(130, GROUND - 30, 16, 30);
  ctx.strokeStyle = 'rgba(200,190,175,0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, GROUND - 2);
  ctx.lineTo(132, GROUND - 22);
  ctx.moveTo(112, GROUND + 6);
  ctx.lineTo(134, GROUND - 12);
  ctx.stroke();
  ctx.fillStyle = '#6a5040';
  ctx.fillRect(176, GROUND - 120, 5, 120);
  ctx.beginPath();
  ctx.roundRect(126, GROUND - 124, 104, 28, 4);
  ctx.fill();
  text(ctx, 'To the camp', 178, GROUND - 110, 12, '#f2ece0');
}

// A bollard on the deck's edge, iron with a brass cap, and maybe an empty mooring ring hung on it
function drawBollard(ctx, b, time) {
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.roundRect(b.x - 9, GROUND - 26, 18, 26, 5);
  ctx.fill();
  ctx.fillStyle = BRASS_D;
  ellipse(ctx, b.x, GROUND - 26, 11, 4);
  if (!b.ring) return;
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(b.x + 10, GROUND - 14 + Math.sin(time * 1.4 + b.x) * 1.2, 8, 0, TAU);
  ctx.stroke();
}

// A loading stage (a platform): a short raised deck on two iron legs, a broken rail along its back
function drawStage(ctx, p) {
  ctx.fillStyle = IRON_D;
  for (const x of [p.x + 16, p.x + p.w - 24]) ctx.fillRect(x, p.y + 10, 8, GROUND - p.y - 10);
  ctx.strokeStyle = IRON;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x + 20, p.y + 20);
  ctx.lineTo(p.x + p.w - 20, GROUND - 10);
  ctx.stroke();
  ctx.fillStyle = PLANK;
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, 12, 3);
  ctx.fill();
  ctx.fillStyle = PLANK_L;
  for (let x = p.x + 4; x < p.x + p.w - 10; x += 30) ctx.fillRect(x, p.y, 26, 3);
  ctx.fillStyle = IRON;
  ctx.fillRect(p.x + 6, p.y - 22, 4, 22);
  ctx.fillRect(p.x + p.w * 0.5, p.y - 22, 4, 12); // a post snapped short
  ctx.fillRect(p.x + 6, p.y - 22, p.w * 0.4, 3);
}

// A gantry hanging off the city on two chains (a platform), its lattice underneath and an empty ring dangling
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
  ctx.strokeStyle = PLANK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = g.x + 10; x < g.x + g.w - 10; x += 20) {
    ctx.moveTo(x, g.y + 12);
    ctx.lineTo(x + 10, g.y + 22);
    ctx.lineTo(x + 20, g.y + 12);
  }
  ctx.stroke();
  ctx.fillStyle = '#b8924a';
  circle(ctx, g.x + g.w / 2, g.y + 30 + Math.sin(time) * 2, 6);
  ctx.fillStyle = '#6a5c50';
  circle(ctx, g.x + g.w / 2, g.y + 30 + Math.sin(time) * 2, 3.4);
}

// The Warden's crates (a platform): cargo stacked to be collected, stencilled and never collected, a tarp gone grey
function drawCrates(ctx, p) {
  const box = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(60,44,30,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + w - 2, y + h - 2);
    ctx.stroke();
  };
  box(p.x, p.y, 78, GROUND - p.y, '#9a7a52');
  box(p.x + 82, p.y, 78, GROUND - p.y, '#8a6c48');
  ctx.fillStyle = 'rgba(40,30,30,0.55)';
  ctx.font = "700 10px Fredoka, 'Trebuchet MS', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('HOLD', p.x + 39, p.y + 40);
  ctx.fillText('HOLD', p.x + 121, p.y + 40);
  ctx.fillStyle = 'rgba(150,150,160,0.8)'; // the tarp over the near one
  ctx.beginPath();
  ctx.moveTo(p.x - 4, p.y + 2);
  ctx.lineTo(p.x + 70, p.y - 2);
  ctx.lineTo(p.x + 80, p.y + 30);
  ctx.lineTo(p.x - 6, p.y + 26);
  ctx.closePath();
  ctx.fill();
}

// The Dockwarden's post: a brass pillar with a little hood against the wind, the ledger's chain hanging off it, and
// behind, an arrivals board on two legs, every slot blank but one (the Kite, chalked in by someone else)
function drawWardenPost(ctx, time) {
  const x = WARDEN_X + 54;
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(x - 7, GROUND - 120, 14, 120);
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.moveTo(x - 30, GROUND - 120);
  ctx.quadraticCurveTo(x, GROUND - 146, x + 30, GROUND - 120);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = VERD;
  ctx.fillRect(x - 30, GROUND - 122, 60, 3);
  ctx.strokeStyle = 'rgba(110,104,120,0.9)'; // the ledger's chain, looping down to the Warden
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - 6, GROUND - 90);
  ctx.quadraticCurveTo(x - 30, GROUND - 40, WARDEN_X + 24, GROUND - 46);
  ctx.stroke();
  // the arrivals board
  const bx = WARDEN_X + 150, by = GROUND - 180;
  ctx.fillStyle = IRON_D;
  ctx.fillRect(bx - 50, by + 80, 6, GROUND - by - 80);
  ctx.fillRect(bx + 44, by + 80, 6, GROUND - by - 80);
  ctx.fillStyle = '#2e3440';
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(bx - 62, by, 124, 92, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'ARRIVALS', bx, by + 13, 12, BRASS);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = 'rgba(200,210,230,0.12)';
    ctx.fillRect(bx - 52, by + 26 + i * 12, 104, 9);
  }
  text(ctx, 'KITE', bx - 26, by + 31, 9, '#e8e2d4');
  ctx.fillStyle = `rgba(150,220,255,${0.4 + 0.3 * Math.sin(time * 2)})`; // a lamp on the board still lit
  circle(ctx, bx + 52, by + 10, 3);
}

// The Harbour Lamp (the find): a signal lamp in a brass cage hung off the city on one chain, its great lens dark; the
// floor of the cage is the platform. Up here you see the whole underside of the city and the far piers.
function drawLamp(ctx, p, time) {
  const cx = p.x + p.w / 2, sway = Math.sin(time * 0.7) * 1.5;
  ctx.strokeStyle = 'rgba(78,70,82,0.9)';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 3]);
  ctx.beginPath();
  ctx.moveTo(cx, 30);
  ctx.lineTo(cx + sway, p.y - 96);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = BRASS_D; // the cage's bars and its dome
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 4; i++) {
    const x = p.x + 6 + (i * (p.w - 12)) / 4;
    ctx.moveTo(x, p.y);
    ctx.lineTo(x + sway * 0.3, p.y - 76);
  }
  ctx.stroke();
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 74);
  ctx.quadraticCurveTo(cx, p.y - 112, p.x + p.w, p.y - 74);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = VERD;
  ctx.fillRect(p.x, p.y - 76, p.w, 3);
  // the lens, dark, a cold glint crawling round it
  ctx.fillStyle = '#4a5464';
  circle(ctx, cx, p.y - 36, 22);
  ctx.strokeStyle = 'rgba(200,220,240,0.35)';
  ctx.lineWidth = 1.2;
  for (const r of [8, 14, 19]) {
    ctx.beginPath();
    ctx.arc(cx, p.y - 36, r, 0, TAU);
    ctx.stroke();
  }
  const a = time * 0.6;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  circle(ctx, cx + Math.cos(a) * 15, p.y - 36 + Math.sin(a) * 15, 2);
  // its floor
  ctx.fillStyle = '#6a5c50';
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, 10, 3);
  ctx.fill();
}

// The east end: the loading ramp climbing up out of the deck into an open brass gate in the city's underside, a warm
// light in it (the Bastion), and its sign
function drawRamp(ctx, time) {
  const x0 = RAMP_X0, x1 = SKYDOCKS_W + 40, topY = GROUND - 210;
  // the gate, set into the brass of the city coming down low over the east end
  ctx.fillStyle = '#4e4858';
  ctx.fillRect(x0 + 60, 0, x1 - x0 - 60, topY + 10);
  ctx.fillStyle = 'rgba(255,214,150,0.55)';
  ctx.beginPath();
  ctx.roundRect(x0 + 150, topY - 120, 150, 130, [60, 60, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(x0 + 146, topY - 124, 158, 134, [62, 62, 0, 0]);
  ctx.stroke();
  for (let i = 0; i < 3; i++) { // gear-teeth round the arch, turning slowly
    const a = time * 0.2 + (i * TAU) / 3;
    ctx.fillStyle = BRASS_D;
    circle(ctx, x0 + 225 + Math.cos(a) * 92, topY - 54 + Math.sin(a) * 40, 5);
  }
  // the ramp: a long iron slope with cleats, from the deck up into the gate
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.moveTo(x0 - 20, GROUND + 22);
  ctx.lineTo(x0 - 20, GROUND - 2);
  ctx.lineTo(x0 + 260, topY + 8);
  ctx.lineTo(x1, topY + 8);
  ctx.lineTo(x1, GROUND + 22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PLANK;
  ctx.beginPath();
  ctx.moveTo(x0 - 20, GROUND - 2);
  ctx.lineTo(x0 + 260, topY + 8);
  ctx.lineTo(x0 + 260, topY + 20);
  ctx.lineTo(x0 - 20, GROUND + 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PLANK_L;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let k = 0.1; k < 1; k += 0.12) {
    const x = x0 - 20 + k * 280, y = GROUND - 2 + k * (topY + 8 - GROUND + 2);
    ctx.moveTo(x - 6, y + 4);
    ctx.lineTo(x + 6, y - 2);
  }
  ctx.stroke();
  // the deck runs on to the ramp's foot
  ctx.fillStyle = PLANK;
  ctx.fillRect(x0 - 20, GROUND - 2, x1 - x0 + 20, 12);
  ctx.fillStyle = IRON;
  ctx.fillRect(x0 - 20, GROUND + 6, x1 - x0 + 20, 16);
  // the sign at the ramp's foot
  const sx = RAMP_X0 - 120;
  ctx.fillStyle = IRON_D;
  ctx.fillRect(sx - 3, GROUND - 120, 6, 120);
  ctx.fillStyle = '#b8aca0';
  ctx.strokeStyle = '#2e282c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(sx - 76, GROUND - 140, 152, 46, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Cogwork Bastion', sx, GROUND - 126, 14, '#2e2226');
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(sx - 34, GROUND - 114, 68, 16, 8);
  ctx.fill();
  text(ctx, 'Lv 140+', sx, GROUND - 105.5, 11, '#2e2226');
}

function drawZoneSign(ctx, x, z) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(150, ctx.measureText(z.name).width + 30);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(x - tw / 2 + 10, GROUND - 92, 5, 92);
  ctx.fillRect(x + tw / 2 - 15, GROUND - 92, 5, 92);
  ctx.save();
  ctx.translate(x, GROUND - 66);
  ctx.fillStyle = '#c8bca8';
  ctx.strokeStyle = '#3a3240';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 46, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(94,156,136,0.5)'; // verdigris run down from the brass screws
  for (const s of [-1, 1]) ctx.fillRect(s * (tw / 2 - 12) - 2, -16, 4, 14);
  text(ctx, z.name, 0, -6, 15, '#2e2236');
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-34, 6, 68, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 14.5, 11, '#2e2236');
  ctx.restore();
}
