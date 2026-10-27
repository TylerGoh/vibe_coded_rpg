// Docs: docs/places/oldice.md, docs/combat/stages.md
// The Old Ice's art that isn't the room itself (src/oldice.js): its creatures (gnawer, rime raven, chain-warden,
// black-ice wolf and Garm, a named elite; OLDICE_MOB_ART, called by drawMob in src/field.js; the other elites are
// drawn as their base mobs), the gear dropped there (OLDICE_SWORDS, OLDICE_SWORD_LEN, OLDICE_HELMETS, drawn by
// drawSword / drawHelmet in src/field.js; the staff and bow are data in src/staff-art.js and src/bow-art.js) and
// its materials' icons (OLDICE_ICONS).
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
// The wolf's things share one tell: pale blue-white eyes with no pupils. FB2 (c)'s pack reuses the black-ice wolf.
import { TAU, circle, ellipse } from './util.js';
import { glow as softGlow } from './glow.js';

const INKC = '#2d2a3e';
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const EYE = '220,240,255';
const RIBBON = '#fff3c8', RIBBON_RGB = '255,236,170';

// a pair of pale eyes with no pupils, glowing a little (crossed out when dying)
function paleEyes(ctx, x, y, gap, r, t, seed, dying, bright = 0.45) {
  if (dying > 0.05) {
    ctx.strokeStyle = INKC;
    ctx.lineWidth = 1.5;
    for (const ex of [x - gap, x + gap]) {
      ctx.beginPath();
      ctx.moveTo(ex - r, y - r); ctx.lineTo(ex + r, y + r);
      ctx.moveTo(ex + r, y - r); ctx.lineTo(ex - r, y + r);
      ctx.stroke();
    }
    return;
  }
  const blink = ((t + seed * 5) % 5.1) < 0.1;
  for (const ex of [x - gap, x + gap]) {
    glow(ctx, ex, y, r * 3.4, r * 3, EYE, bright);
    ctx.fillStyle = '#f4faff';
    ellipse(ctx, ex, y, r * 1.15, blink ? r * 0.2 : r * 0.8);
  }
}
// a ripple of ice chips where something has gone under the floor (blink)
function burrow(ctx, w, t) {
  ctx.fillStyle = 'rgba(200,226,255,0.85)';
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * w * 0.13, up = Math.abs(Math.sin(t * 9 + i * 1.3)) * 6;
    ctx.beginPath();
    ctx.moveTo(x - 3, 0);
    ctx.lineTo(x, -3 - up);
    ctx.lineTo(x + 3, 0);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(10,26,60,0.6)';
  ellipse(ctx, 0, 1, w * 0.45, 3);
}

// Gnawer: a pale ice rat as big as a dog, fur white-grey and stiff with frost, a long bare tail, yellow teeth worn
// flat from chewing through the bed. m.special: it has tunnelled under the ice (blink) · m.warn: about to come up
function drawGnawer(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  if (m.special && live) {
    burrow(ctx, w, t);
    return () => {
      ctx.beginPath();
      ctx.arc(0, -6, 10, 0, TAU);
    };
  }
  const run = m.walking && live ? Math.sin(t * 18 + seed) : 0, cy = -h * 0.45, rx = w * 0.4, ry = h * 0.36;
  // tail
  ctx.strokeStyle = '#c8a8a8';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-rx * 0.9, cy + ry * 0.4);
  ctx.quadraticCurveTo(-w * 0.75, -2 + run * 3, -w * 0.95, -h * 0.3 + Math.sin(t * 3 + seed) * 4);
  ctx.stroke();
  // feet
  ctx.fillStyle = '#d8b4b4';
  for (const [fx, ph] of [[-0.25, 0], [0.25, Math.PI]]) ellipse(ctx, w * fx + Math.sin(t * 18 + ph) * 3 * (m.walking ? 1 : 0), -2, 5, 3);
  const body = () => ctx.ellipse(0, cy, rx, ry, 0, 0, TAU);
  const g = ctx.createRadialGradient(-rx * 0.3, cy - ry * 0.5, 2, 0, cy, rx);
  g.addColorStop(0, '#f4f8fc');
  g.addColorStop(1, '#a8b8cc');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#4a5a70';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // frost spikes along its back
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * 0.85 + i * 0.32, bx = Math.cos(a) * rx * 0.95, by = cy + Math.sin(a) * ry * 0.95;
    ctx.beginPath();
    ctx.moveTo(bx - 3, by + 1);
    ctx.lineTo(bx + Math.cos(a) * 6, by + Math.sin(a) * 7);
    ctx.lineTo(bx + 3, by + 1);
    ctx.fill();
  }
  // head: a long snout, pink nose, round ear, the teeth
  const hx = rx * 0.85, hy = cy - ry * 0.1 - (m.warn && live ? 3 : 0);
  ctx.fillStyle = '#dfe6ee';
  ctx.strokeStyle = '#4a5a70';
  ctx.beginPath();
  ctx.moveTo(hx - 8, hy - ry * 0.7);
  ctx.quadraticCurveTo(hx + w * 0.22, hy - 6, hx + w * 0.26, hy + 4);
  ctx.quadraticCurveTo(hx + w * 0.1, hy + ry * 0.6, hx - 10, hy + ry * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8a0a8';
  circle(ctx, hx + w * 0.26, hy + 3, 2.6);
  ctx.fillStyle = '#e8d070';
  ctx.fillRect(hx + w * 0.17, hy + 6, 3, 6);
  ctx.fillRect(hx + w * 0.2, hy + 6, 3, 6);
  ctx.fillStyle = '#c8d0dc';
  ctx.strokeStyle = '#4a5a70';
  ctx.beginPath();
  ctx.arc(hx - 2, hy - ry * 0.6, 6, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8b0b8';
  circle(ctx, hx - 2, hy - ry * 0.6, 3);
  paleEyes(ctx, hx + w * 0.1, hy - 4, 0.1, 2, t, seed, dying, 0.35);
  return () => {
    ctx.beginPath();
    body();
    ctx.ellipse(hx + w * 0.08, hy, w * 0.2, ry * 0.65, 0, 0, TAU);
  };
}

// Rime raven: a big black raven, its wing edges and tail rimed white, a heavy grey beak, pale eyes. m.warn: wings
// up, about to drop on you · m.charging: diving
function drawRimeRaven(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const cy = -h * 0.5, bob = live && !dive ? Math.sin(t * 4 + seed) * 3 : 0;
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(dive ? 0.55 : 0);
  const flap = dive ? -1 : warn ? -0.7 + Math.sin(t * 22) * 0.2 : Math.sin(t * 8 + seed) * 0.5;
  const wing = (s) => {
    ctx.save();
    ctx.translate(-w * 0.05, cy);
    ctx.rotate(flap * s);
    ctx.scale(1, s);
    ctx.fillStyle = s > 0 ? '#1a1c26' : '#2a2c38';
    ctx.strokeStyle = '#06070c';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w * 0.2, -h * 0.7, -w * 0.55, -h * 0.55);
    for (let i = 0; i < 4; i++) ctx.lineTo(-w * (0.5 - i * 0.1), -h * (0.36 - i * 0.08) + (i % 2 ? -4 : 3));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (s > 0) {
      ctx.strokeStyle = 'rgba(235,246,255,0.9)'; // rime along the feather tips
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w * 0.55, -h * 0.55);
      for (let i = 0; i < 4; i++) ctx.lineTo(-w * (0.5 - i * 0.1), -h * (0.36 - i * 0.08) + (i % 2 ? -4 : 3));
      ctx.stroke();
    }
    ctx.restore();
  };
  wing(1);
  const body = () => ctx.ellipse(0, cy, w * 0.26, h * 0.26, -0.15, 0, TAU);
  // tail
  ctx.fillStyle = '#1a1c26';
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, cy);
  ctx.lineTo(-w * 0.48, cy + h * 0.14);
  ctx.lineTo(-w * 0.44, cy + h * 0.26);
  ctx.lineTo(-w * 0.14, cy + h * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(235,246,255,0.85)';
  ctx.fillRect(-w * 0.48, cy + h * 0.14, 4, h * 0.12);
  ctx.fillStyle = '#22242e';
  ctx.strokeStyle = '#06070c';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // head and beak
  const hx = w * 0.22, hy = cy - h * 0.16;
  ctx.fillStyle = '#22242e';
  ctx.beginPath();
  ctx.arc(hx, hy, h * 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6a6e7a';
  ctx.beginPath();
  ctx.moveTo(hx + h * 0.14, hy - 3);
  ctx.quadraticCurveTo(hx + w * 0.28, hy - 1, hx + w * 0.3, hy + 5);
  ctx.lineTo(hx + h * 0.14, hy + 4);
  ctx.closePath();
  ctx.fill();
  paleEyes(ctx, hx + 3, hy - 2, 0.1, 1.8, t, seed, dying, 0.4);
  wing(-1);
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
    ctx.arc(hx, hy, h * 0.2, 0, TAU);
  };
}

// Chain-warden: a Keeper stone figure, hooded and blocky, cracked and rimed, holding a length of old ribbon across
// its front in both hands: the fetter, fine as silk, glowing faintly gold. Hits from in front glance off it (the
// shell brain): go round behind. m.warn: it draws the ribbon taut · m.charging: lunges
function drawChainWarden(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, lunge = !!m.charging && live;
  const step = m.walking && live ? Math.sin(t * 8 + seed) * 2 : 0;
  ctx.save();
  ctx.rotate(lunge ? 0.12 : 0);
  // legs / plinth
  ctx.fillStyle = '#4e5262';
  ctx.strokeStyle = '#1c1e28';
  ctx.lineWidth = 1.8;
  for (const [lx, d] of [[-0.18, 1], [0.12, -1]]) {
    ctx.beginPath();
    ctx.roundRect(w * lx - 6, -h * 0.3 + step * d, 13, h * 0.3 - step * d, 3);
    ctx.fill();
    ctx.stroke();
  }
  // the robe-like body of stone
  const body = () => {
    ctx.moveTo(-w * 0.32, -h * 0.26);
    ctx.lineTo(-w * 0.24, -h * 0.78);
    ctx.quadraticCurveTo(0, -h * 0.86, w * 0.24, -h * 0.78);
    ctx.lineTo(w * 0.32, -h * 0.26);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-w * 0.3, 0, w * 0.3, 0);
  g.addColorStop(0, '#5e6272');
  g.addColorStop(1, '#868a9a');
  ctx.fillStyle = g;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(28,30,40,0.6)'; // cracks
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.1, -h * 0.74);
  ctx.lineTo(-w * 0.02, -h * 0.6);
  ctx.lineTo(-w * 0.12, -h * 0.46);
  ctx.moveTo(w * 0.16, -h * 0.5);
  ctx.lineTo(w * 0.22, -h * 0.38);
  ctx.stroke();
  // the hood and its face: a dark hollow, two pale eyes (the wolf's tell: these are its keepers now)
  const hy = -h * 0.86;
  ctx.fillStyle = '#6e7282';
  ctx.strokeStyle = '#1c1e28';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, hy + h * 0.12);
  ctx.quadraticCurveTo(-w * 0.22, hy - h * 0.14, 0, hy - h * 0.16);
  ctx.quadraticCurveTo(w * 0.24, hy - h * 0.14, w * 0.22, hy + h * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#14161e';
  ellipse(ctx, w * 0.05, hy, w * 0.13, h * 0.08);
  paleEyes(ctx, w * 0.08, hy, w * 0.05, 1.6, t, seed, dying, 0.35);
  ctx.fillStyle = 'rgba(235,246,255,0.8)'; // rime on the hood
  ellipse(ctx, -w * 0.04, hy - h * 0.13, w * 0.14, 2.5);
  // the fetter: held across its front from hand to hand, a loop hanging, pulled taut when it's about to lunge
  const hand1 = [w * 0.3, -h * 0.62], hand2 = [w * 0.3, -h * 0.3], sag = warn ? 2 : 10 + Math.sin(t * 1.6 + seed) * 3;
  if (live) glow(ctx, w * 0.36, -h * 0.46, 26, h * 0.3, RIBBON_RGB, 0.45 + (warn ? 0.25 : 0));
  ctx.strokeStyle = RIBBON;
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...hand1);
  ctx.quadraticCurveTo(w * 0.42 + sag, -h * 0.46, ...hand2);
  ctx.moveTo(...hand2);
  ctx.quadraticCurveTo(w * 0.2, -h * 0.12, w * 0.06 + sag * 0.4, -h * 0.1 + Math.sin(t * 1.3 + seed) * 2);
  ctx.stroke();
  ctx.fillStyle = '#7a7e8e';
  ctx.strokeStyle = '#1c1e28';
  ctx.lineWidth = 1.5;
  for (const [x, y] of [hand1, hand2]) {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
    ctx.ellipse(0, hy, w * 0.22, h * 0.15, 0, 0, TAU);
  };
}

// A wolf (the black-ice wolf, and Garm on the same bones): near-black fur cased in ice, rimed white along the back,
// pale eyes with no pupils. m.warn: it crouches, hackles up, about to charge · m.charging: stretched out in its run
export function wolf(ctx, w, h, t, seed, m, dying, o) {
  const live = dying < 0.05, warn = !!m.warn && live, run = !!m.charging && live;
  const gait = (m.walking || run) && live ? t * (run ? 22 : 13) + seed : 0;
  const crouch = warn ? h * 0.08 : 0, stretch = run ? 1.12 : 1;
  const cy = -h * 0.55 + crouch, bx = w * 0.42 * stretch, by = h * 0.24;
  ctx.save();
  // legs: two pairs, swinging
  ctx.strokeStyle = o.leg;
  ctx.lineCap = 'round';
  ctx.lineWidth = w * 0.07;
  for (const [lx, ph, far] of [[-0.28, 0, 1], [0.26, Math.PI, 1], [-0.22, Math.PI, 0], [0.32, 0, 0]]) {
    const sw = Math.sin(gait + ph) * (gait ? (run ? 0.6 : 0.35) : 0);
    ctx.globalAlpha = far ? 0.75 : 1;
    ctx.beginPath();
    ctx.moveTo(w * lx, cy + by * 0.4);
    ctx.lineTo(w * lx + Math.sin(sw) * h * 0.32, -2 - Math.max(0, Math.cos(gait + ph)) * 4 * (gait ? 1 : 0));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // tail: straight out behind when it runs, low when it stalks
  ctx.strokeStyle = o.fur;
  ctx.lineWidth = h * 0.16;
  ctx.beginPath();
  ctx.moveTo(-bx * 0.85, cy - by * 0.2);
  ctx.quadraticCurveTo(-bx * 1.25, cy + (run ? -by * 0.3 : by * 0.6), -bx * 1.45, cy + (run ? -by * 0.4 : by * 1.1) + Math.sin(t * 2 + seed) * 3);
  ctx.stroke();
  const body = () => ctx.ellipse(0, cy, bx, by, 0, 0, TAU);
  const g = ctx.createLinearGradient(0, cy - by, 0, cy + by);
  g.addColorStop(0, o.top);
  g.addColorStop(1, o.fur);
  ctx.fillStyle = g;
  ctx.strokeStyle = o.ink;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // rime along the back, and the hackles up when it's about to go
  ctx.fillStyle = 'rgba(235,246,255,0.9)';
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.85 + i * 0.12 + 0.1, rx = Math.cos(a) * bx * 0.96, ry = cy + Math.sin(a) * by * 0.96, up = warn ? 9 : 5;
    ctx.beginPath();
    ctx.moveTo(rx - 3, ry + 2);
    ctx.lineTo(rx + Math.cos(a) * 2, ry - up);
    ctx.lineTo(rx + 4, ry + 2);
    ctx.fill();
  }
  if (o.chest) {
    ctx.fillStyle = o.chest; // Garm's chest, frosted rust-red
    ellipse(ctx, bx * 0.72, cy + by * 0.25, bx * 0.3, by * 0.7, 0.2);
  }
  // head: neck forward, a long muzzle, ears back when it charges
  const hx = bx * 0.95, hy = cy - by * 0.75 + (warn ? crouch * 0.6 : 0), hr = h * 0.24;
  ctx.fillStyle = o.top;
  ctx.strokeStyle = o.ink;
  ctx.beginPath();
  ctx.moveTo(hx - hr, hy + hr * 0.7);
  ctx.quadraticCurveTo(hx - hr * 0.6, hy - hr * 1.1, hx + hr * 0.4, hy - hr * 0.7);
  ctx.quadraticCurveTo(hx + hr * 2.1, hy - hr * 0.2, hx + hr * 2.2, hy + hr * 0.3);
  ctx.quadraticCurveTo(hx + hr * 1.2, hy + hr * 0.8, hx - hr * 0.2, hy + hr * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = o.ink;
  circle(ctx, hx + hr * 2.15, hy + hr * 0.15, hr * 0.16);
  const ear = run ? -0.9 : warn ? -0.5 : 0;
  for (const d of [0, 1]) {
    ctx.fillStyle = d ? o.top : o.fur;
    ctx.save();
    ctx.translate(hx - hr * 0.1 + d * hr * 0.5, hy - hr * 0.75);
    ctx.rotate(ear);
    ctx.beginPath();
    ctx.moveTo(-hr * 0.3, 0);
    ctx.lineTo(-hr * 0.05, -hr * 0.8);
    ctx.lineTo(hr * 0.3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  if (warn || run) {
    // bared teeth
    ctx.fillStyle = '#f4faff';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(hx + hr * (1.1 + i * 0.3), hy + hr * 0.5);
      ctx.lineTo(hx + hr * (1.2 + i * 0.3), hy + hr * 0.75);
      ctx.lineTo(hx + hr * (1.3 + i * 0.3), hy + hr * 0.5);
      ctx.fill();
    }
  }
  paleEyes(ctx, hx + hr * 0.75, hy - hr * 0.15, 0.1, hr * 0.14, t, seed, dying, o.glow);
  ctx.restore();
  return { body, hx, hy, hr };
}
function drawBlackWolf(ctx, w, h, t, seed, m, dying) {
  const r = wolf(ctx, w, h, t, seed, m, dying, { fur: '#141a28', top: '#2a3448', leg: '#10141e', ink: '#05070c', glow: 0.45 });
  return () => {
    ctx.beginPath();
    r.body();
    ctx.ellipse(r.hx + r.hr, r.hy, r.hr * 1.4, r.hr, 0, 0, TAU);
  };
}
// Garm, the Hound at the Gate: a great black-ice hound, heavier in the shoulder, its chest frosted rust-red, a thick
// iron collar with a broken length of old chain swinging from it, and eyes brighter than the pack's
function drawGarm(ctx, w, h, t, seed, m, dying) {
  const r = wolf(ctx, w, h, t, seed, m, dying, { fur: '#0e121c', top: '#262e40', leg: '#0a0d14', ink: '#030408', glow: 0.7, chest: 'rgba(170,96,90,0.55)' });
  // the collar and its broken chain
  const cx = r.hx - r.hr * 0.3, cy = r.hy + r.hr * 0.6;
  ctx.strokeStyle = '#5a5a66';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r.hr * 0.45, r.hr * 0.75, 0.3, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 3;
  const sw = Math.sin(t * (m.walking ? 9 : 2) + seed) * 0.4 + (m.charging ? -0.7 : 0);
  let px = cx, py = cy + r.hr * 0.7;
  for (let i = 0; i < 4; i++) {
    const nx = px - Math.sin(sw + i * 0.2) * 10, ny = py + Math.cos(sw + i * 0.2) * 9;
    ctx.strokeStyle = i % 2 ? '#4a4a56' : '#6a6a76';
    ctx.beginPath();
    ctx.ellipse((px + nx) / 2, (py + ny) / 2, 6, 3.5, Math.atan2(ny - py, nx - px), 0, TAU);
    ctx.stroke();
    [px, py] = [nx, ny];
  }
  // scars across its muzzle, pale
  ctx.strokeStyle = 'rgba(220,236,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(r.hx + r.hr * 0.9, r.hy - r.hr * 0.5);
  ctx.lineTo(r.hx + r.hr * 1.4, r.hy + r.hr * 0.2);
  ctx.stroke();
  return () => {
    ctx.beginPath();
    r.body();
    ctx.ellipse(r.hx + r.hr, r.hy, r.hr * 1.4, r.hr, 0, 0, TAU);
  };
}
export const OLDICE_MOB_ART = { gnawer: drawGnawer, rime_raven: drawRimeRaven, chain_warden: drawChainWarden, black_wolf: drawBlackWolf, garm: drawGarm };

// ——— gear: swords (ctx, L, glow), grip at the origin, blade up (-y) ———
// Gatehound Fang: a long curved fang of black ice for a blade, a grip bound in black pelt, a link of old chain at
// the guard; it breathes frost along its edge
function drawGatehoundFang(ctx, L, gl) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#1e2232';
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.strokeStyle = '#4a5268';
  ctx.lineWidth = 1;
  for (let y = -1; y < 10; y += 3) {
    ctx.beginPath();
    ctx.moveTo(-3, y);
    ctx.lineTo(3, y + 1.5);
    ctx.stroke();
  }
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.quadraticCurveTo(-7, -L * 0.6, 4, -L);
    ctx.quadraticCurveTo(7, -L * 0.6, 5, -5);
    ctx.closePath();
  };
  if (gl) glow(ctx, 0, -L * 0.5, 14, L * 0.6, '170,210,255', 0.35);
  const g = ctx.createLinearGradient(-6, 0, 6, 0);
  g.addColorStop(0, '#3a4a6a');
  g.addColorStop(1, '#0a0e1a');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#04060c';
  ctx.lineWidth = 1.4;
  blade();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(220,240,255,0.75)'; // frost along the edge
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(4, -8);
  ctx.quadraticCurveTo(6, -L * 0.6, 3.5, -L * 0.95);
  ctx.stroke();
  ctx.strokeStyle = '#6a6a76'; // the link at the guard
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -5, 7, 3.5, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
export const OLDICE_SWORDS = { gatehound_fang: drawGatehoundFang };
export const OLDICE_SWORD_LEN = { gatehound_fang: 64 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Chain-Warden's Helm: a hooded cap of grey Keeper stone, rimed on top, a loop of old glowing ribbon wound round the
// brow, its loose end lifting a little
function drawWardenHelm(ctx, w, h, t = 0) {
  const by = -h * 0.7, rx = w * 0.5;
  ctx.fillStyle = '#6e7282';
  ctx.strokeStyle = '#1c1e28';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 3);
  ctx.bezierCurveTo(-rx * 1.05, by - h * 0.46, rx * 0.9, by - h * 0.5, rx, by + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(235,246,255,0.8)';
  ellipse(ctx, -rx * 0.15, by - h * 0.3, rx * 0.45, 3.5);
  glow(ctx, 0, by - 2, rx * 1.2, 10, RIBBON_RGB, 0.35);
  ctx.strokeStyle = RIBBON;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-rx * 1.02, by - 2);
  ctx.quadraticCurveTo(0, by - 6, rx * 1.02, by - 2);
  ctx.stroke();
  ctx.lineWidth = 2.2;
  const sw = Math.sin(t * 1.4) * 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.95, by - 2);
  ctx.quadraticCurveTo(-rx * 1.25, by + 6 + sw, -rx * 1.1, by + 14 + sw);
  ctx.stroke();
}
export const OLDICE_HELMETS = { warden_helm: drawWardenHelm };

// ——— materials' icons (40 × 40, centred) ———
function iconGnawerTooth(ctx) {
  ctx.fillStyle = '#e8d070';
  ctx.strokeStyle = '#7a6430';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-7, -14);
  ctx.quadraticCurveTo(-9, 4, -4, 14);
  ctx.lineTo(6, 14);
  ctx.quadraticCurveTo(8, 0, 7, -14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,250,220,0.7)';
  ctx.fillRect(-4, -10, 3, 18);
}
function iconRavenQuill(ctx) {
  ctx.save();
  ctx.rotate(0.6);
  ctx.fillStyle = '#1e2030';
  ctx.strokeStyle = '#06070c';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.quadraticCurveTo(-9, -2, 0, -17);
  ctx.quadraticCurveTo(8, -2, 0, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(235,246,255,0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.quadraticCurveTo(-4, -13, 0, -17);
  ctx.stroke();
  ctx.strokeStyle = '#8a8e9a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(0, -14);
  ctx.stroke();
  ctx.restore();
}
function iconFetterScrap(ctx) {
  glow(ctx, 0, 0, 20, 16, RIBBON_RGB, 0.5);
  ctx.strokeStyle = RIBBON;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, 8);
  ctx.bezierCurveTo(-6, -16, 4, 16, 14, -8);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,160,90,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
}
function iconBlackicePelt(ctx) {
  ctx.fillStyle = '#1a2030';
  ctx.strokeStyle = '#05070c';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-14, -8);
  ctx.quadraticCurveTo(0, -14, 14, -8);
  ctx.lineTo(12, 10);
  ctx.quadraticCurveTo(0, 15, -12, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(235,246,255,0.85)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-11 + i * 5.5, -9);
    ctx.lineTo(-9 + i * 5.5, -15);
    ctx.lineTo(-7 + i * 5.5, -9);
    ctx.fill();
  }
}
export const OLDICE_ICONS = { gnawer_tooth: iconGnawerTooth, raven_quill: iconRavenQuill, fetter_scrap: iconFetterScrap, blackice_pelt: iconBlackicePelt };
