// Docs: docs/places/bellwalks.md, docs/places/helm.md, docs/combat/stages.md
// The Citadel's depth pass, C4's art that isn't a room or a den (the Bell Walks' room is src/bells.js, the Helm's den
// src/dens-helm.js): the Bell Walks' mobs (bell wraith, clapper knight, rain shard) and the Great Bell, a field boss
// (BELLS_MOB_ART, called by drawMob in src/field.js); the materials' icons (BELLS_ICONS: the Bell Walks' and the Helmsman's
// Wheel Peg); gear for players (BELLS_SWORDS, BELLS_SWORD_LEN, BELLS_HELMETS): the Great Bell's Toll Hammer and Bell Helm,
// the clapper knights' Clapper Helm, the Helmsman's The Last Heading and Helmsman's Cap (the staffs and bows are rows in
// src/staff-art.js and src/bow-art.js). The Citadel's register: bell bronze, brass, star-iron, the hanging rain's glass;
// solemn, no whimsy.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse, clamp } from './util.js';

const BRONZE = '#b8863a', BRONZE_L = '#e0b464', BRONZE_D = '#7a5426', BRONZE_E = '#4a3018';
const VERD = '#6aa08a', VERD_D = '#3e6a5a';
const BRASS = '#f0c470', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const IRON_D = '#2a2834', IRON_L = '#6e6a7e';
const RAIN = '210,226,255';
const warnK = (v) => (v === true ? 1 : clamp(+v || 0, 0, 1));

// a hanging raindrop (a teardrop point up), the stopped rain up here
export function drop(ctx, x, y, s = 1, a = 0.7) {
  ctx.fillStyle = `rgba(${RAIN},${a})`;
  ctx.beginPath();
  ctx.moveTo(x, y - 3.6 * s);
  ctx.quadraticCurveTo(x + 2 * s, y, x, y + 1.8 * s);
  ctx.quadraticCurveTo(x - 2 * s, y, x, y - 3.6 * s);
  ctx.fill();
}
function softGlow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  circle(ctx, x, y, r);
}
// a bell's profile, mouth down at y = 0, height bh, mouth half-width bw (the shoulder narrower, a crown on top)
export function bellPath(ctx, bw, bh) {
  ctx.beginPath();
  ctx.moveTo(-bw, 0);
  ctx.bezierCurveTo(-bw * 0.92, -bh * 0.2, -bw * 0.62, -bh * 0.36, -bw * 0.6, -bh * 0.7);
  ctx.bezierCurveTo(-bw * 0.6, -bh * 0.94, -bw * 0.3, -bh, 0, -bh);
  ctx.bezierCurveTo(bw * 0.3, -bh, bw * 0.6, -bh * 0.94, bw * 0.6, -bh * 0.7);
  ctx.bezierCurveTo(bw * 0.62, -bh * 0.36, bw * 0.92, -bh * 0.2, bw, 0);
  ctx.quadraticCurveTo(0, bh * 0.08, -bw, 0);
  ctx.closePath();
}
export function bronzeFill(ctx, bw, bh, dark = false) {
  const g = ctx.createLinearGradient(-bw, 0, bw, 0);
  g.addColorStop(0, dark ? BRONZE_E : BRONZE_D);
  g.addColorStop(0.35, dark ? BRONZE_D : BRONZE_L);
  g.addColorStop(0.7, dark ? BRONZE_D : BRONZE);
  g.addColorStop(1, BRONZE_E);
  return g;
}

// A bell wraith: the echo of a bell-ringer, a grey hooded shape with no feet, going round the galleries with a rope's end in
// its hands to ring a change that never comes. Its face is a dark hollow with two pale points. It fades out and back
// (`phase`: m.phased while it's gone); on its warn it lifts the rope to pull
function drawBellWraith(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0;
  const bob = live ? Math.sin(t * 1.6 + seed) * 3 : 0;
  const a = (m?.phased ? 0.25 : 0.85) * (1 - dying * 0.8);
  const top = -h + bob;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -6);
    ctx.quadraticCurveTo(-w * 0.5, top + h * 0.4, 0, top);
    ctx.quadraticCurveTo(w * 0.5, top + h * 0.4, w * 0.42, -6);
    ctx.closePath();
  };
  ctx.save();
  ctx.globalAlpha *= a;
  softGlow(ctx, 0, top + h * 0.45, w * 0.9, '200,210,230', 0.25);
  // the robe, ragged at the hem, swaying
  ctx.fillStyle = '#8a8c9e';
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, -6);
  ctx.quadraticCurveTo(-w * 0.5, top + h * 0.4, 0, top);
  ctx.quadraticCurveTo(w * 0.5, top + h * 0.4, w * 0.42, -6);
  for (let i = 4; i >= 0; i--) ctx.lineTo(-w * 0.42 + (i / 4) * w * 0.84, -6 + (i % 2 ? 8 : 0) + Math.sin(t * 3 + i + seed) * 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(60,60,80,0.35)';
  ctx.fillRect(-2, top + h * 0.3, 4, h * 0.6);
  // the hood's hollow and its two pale points
  ctx.fillStyle = '#2a2a3a';
  ellipse(ctx, w * 0.06, top + h * 0.2, w * 0.2, h * 0.12);
  ctx.fillStyle = wk ? 'rgba(255,220,200,0.95)' : 'rgba(230,236,255,0.9)';
  circle(ctx, w * 0.0, top + h * 0.2, 1.8);
  circle(ctx, w * 0.12, top + h * 0.2, 1.8);
  // the rope's end, in two grey hands
  const ry = top + h * (0.5 - wk * 0.25);
  ctx.strokeStyle = '#c8b89a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.2, ry);
  ctx.quadraticCurveTo(w * 0.32, ry - 40, w * 0.26, top - 40 - wk * 20);
  ctx.stroke();
  ctx.fillStyle = '#b0a8c0';
  circle(ctx, w * 0.2, ry, 4);
  circle(ctx, w * 0.24, ry + 7, 4);
  ctx.fillStyle = '#c84a3a'; // the sally, the rope's red-striped grip
  ctx.fillRect(w * 0.18, ry + 10, 5, 12);
  ctx.restore();
  return body;
}

// A clapper knight: an aether knight's heavier kin, its armour cast in bell bronze gone green at the seams, a great helm
// with one slit, a bell's clapper on a chain for a mace. It blinks to you (`blink`: m.warn is the wind-up, m.charging the
// strike) and brings the clapper down
function drawClapperKnight(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0, hit = !!m?.charging;
  const step = live ? Math.sin(t * 5 + seed) * 2 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.rect(-w * 0.4, -h, w * 0.8, h);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(30,20,40,0.2)';
  ellipse(ctx, 0, 0, w * 0.4, 4);
  // legs
  ctx.fillStyle = BRONZE_D;
  ctx.fillRect(-w * 0.26, -h * 0.32 + step, w * 0.18, h * 0.32 - step);
  ctx.fillRect(w * 0.06, -h * 0.32 - step, w * 0.18, h * 0.32 + step);
  // the body: a bell-shaped cuirass, mouth down
  ctx.save();
  ctx.translate(0, -h * 0.28);
  bellPath(ctx, w * 0.4, h * 0.5);
  ctx.fillStyle = bronzeFill(ctx, w * 0.4, h * 0.5);
  ctx.fill();
  ctx.strokeStyle = BRONZE_E;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = VERD; // verdigris at the seams
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.36, -h * 0.06);
  ctx.lineTo(w * 0.36, -h * 0.06);
  ctx.moveTo(-w * 0.28, -h * 0.26);
  ctx.lineTo(w * 0.28, -h * 0.26);
  ctx.stroke();
  ctx.restore();
  // the great helm, one slit, a faint light in it
  const hy = -h * 0.88;
  ctx.fillStyle = bronzeFill(ctx, w * 0.22, h * 0.2);
  ctx.beginPath();
  ctx.roundRect(-w * 0.2, hy - h * 0.1, w * 0.4, h * 0.22, [10, 10, 4, 4]);
  ctx.fill();
  ctx.strokeStyle = BRONZE_E;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.fillStyle = '#1a1420';
  ctx.fillRect(-w * 0.04, hy - 2, w * 0.22, 4);
  ctx.fillStyle = wk || hit ? 'rgba(255,140,110,0.95)' : 'rgba(200,176,255,0.85)';
  ctx.fillRect(w * 0.06, hy - 1, w * 0.08, 2);
  // the clapper on its chain, raised on the wind-up, swung down on the strike
  const ang = hit ? 1.1 : -0.6 - wk * 1.4;
  ctx.save();
  ctx.translate(w * 0.3, -h * 0.62);
  ctx.rotate(ang);
  ctx.strokeStyle = IRON_L;
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -h * 0.36);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = BRONZE_D;
  ellipse(ctx, 0, -h * 0.42, 7, 11);
  ctx.fillStyle = BRONZE_L;
  ellipse(ctx, -2, -h * 0.45, 2.4, 5);
  ctx.restore();
  ctx.fillStyle = BRONZE; // the gauntlet
  circle(ctx, w * 0.3, -h * 0.62, 6);
  if (dying > 0.05) {
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - dying)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, -h * 0.5);
    ctx.lineTo(w * 0.3, -h * 0.3);
    ctx.stroke();
  }
  ctx.restore();
  return body;
}

// A rain shard: where the stopped rain has grown together on a balcony, a cluster of clear ice spikes rooted to the stone,
// a cloud of hanging drops round it. It never moves (anchored); on its warn the drops nearest it draw in and brighten, then
// it flicks one at you (`lob`, style `raindrop`)
function drawRainShard(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.45, 0);
    ctx.lineTo(0, -h);
    ctx.lineTo(w * 0.45, 0);
    ctx.closePath();
  };
  ctx.save();
  softGlow(ctx, 0, -h * 0.5, w * 1.1, RAIN, 0.2 + wk * 0.35);
  ctx.fillStyle = 'rgba(80,80,100,0.5)'; // the stone it's rooted to
  ellipse(ctx, 0, 0, w * 0.5, 5);
  for (const [dx, hh, lean] of [[-w * 0.26, 0.62, -0.25], [w * 0.24, 0.7, 0.22], [0, 1, 0.02], [-w * 0.08, 0.45, -0.5], [w * 0.12, 0.5, 0.45]]) {
    ctx.save();
    ctx.translate(dx, 0);
    ctx.rotate(lean);
    const sh = h * hh, sw = w * 0.15;
    const g = ctx.createLinearGradient(-sw, 0, sw, 0);
    g.addColorStop(0, 'rgba(170,196,240,0.8)');
    g.addColorStop(0.5, 'rgba(240,248,255,0.95)');
    g.addColorStop(1, 'rgba(150,176,224,0.8)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-sw, 0);
    ctx.lineTo(0, -sh);
    ctx.lineTo(sw, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,130,190,0.8)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }
  // the drops hanging round it, drawn in on its warn
  for (let i = 0; i < 12; i++) {
    const a = i * 2.39 + seed, d = (w * 0.55 + (i % 4) * 9) * (1 - wk * 0.45);
    const x = Math.cos(a) * d, y = -h * 0.55 + Math.sin(a) * d * 0.7 + (live ? Math.sin(t * 0.8 + i) * 0.6 : 0);
    drop(ctx, x, y, 1.2, 0.55 + wk * 0.4);
  }
  if (dying > 0.05) {
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - dying)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, -h * 0.7);
    ctx.lineTo(w * 0.15, -h * 0.2);
    ctx.stroke();
  }
  ctx.restore();
  return body;
}

// The Great Bell: the biggest of the Spire's bells, come down out of its frame: a huge bronze bell green with verdigris,
// bands of Keeper letters round its waist worn smooth, its crown's iron straps snapped. It "looks" out of two round
// sound-holes high on its shoulder, a cold light inside. It rolls itself along on its lip. On its warn it heaves up off the
// floor (m.warn), comes down (m.charging) and tolls: rings of sound off its mouth
function drawGreatBell(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0, down = !!m?.charging;
  const bw = w * 0.5, bh = h * 0.94;
  const lift = wk * 26, rock = live ? Math.sin(t * 1.2 + seed) * 0.05 * (1 - wk) : 0.25 * dying;
  const body = () => {
    ctx.beginPath();
    ctx.rect(-bw, -bh - lift, bw * 2, bh);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(30,20,40,0.25)';
  ellipse(ctx, 0, 0, bw * (1 - wk * 0.3), 6);
  ctx.translate(0, -lift);
  ctx.rotate(rock);
  // the inside of its mouth, dark, the clapper hanging still
  ctx.fillStyle = '#1a1420';
  ellipse(ctx, 0, -2, bw * 0.92, 10);
  ctx.fillStyle = BRONZE_E;
  ellipse(ctx, 0, -4, 10, 8);
  // the bell
  bellPath(ctx, bw, bh);
  ctx.fillStyle = bronzeFill(ctx, bw, bh);
  ctx.fill();
  ctx.strokeStyle = BRONZE_E;
  ctx.lineWidth = 3;
  ctx.stroke();
  // verdigris streaks down from the shoulder
  ctx.save();
  bellPath(ctx, bw, bh);
  ctx.clip();
  ctx.fillStyle = 'rgba(106,160,138,0.45)';
  for (let i = 0; i < 7; i++) {
    const x = -bw * 0.7 + i * bw * 0.23;
    ctx.beginPath();
    ctx.moveTo(x - 5, -bh * 0.8);
    ctx.quadraticCurveTo(x + 3, -bh * 0.45, x - 2, -bh * (0.25 - (i % 3) * 0.05));
    ctx.lineTo(x + 4, -bh * 0.8);
    ctx.fill();
  }
  // the bands round its waist, Keeper letters worn smooth
  for (const y of [-bh * 0.18, -bh * 0.52]) {
    ctx.fillStyle = BRONZE_D;
    ctx.fillRect(-bw, y - 4, bw * 2, 8);
    ctx.fillStyle = 'rgba(240,210,140,0.5)';
    for (let x = -bw + 8; x < bw - 8; x += 14) ctx.fillRect(x, y - 2, 6, 4);
  }
  ctx.restore();
  // the snapped crown straps on top
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-bw * 0.25, -bh * 0.98);
  ctx.lineTo(-bw * 0.3, -bh - 22);
  ctx.moveTo(bw * 0.25, -bh * 0.98);
  ctx.lineTo(bw * 0.34, -bh - 16);
  ctx.stroke();
  ctx.fillStyle = BRONZE_D;
  ctx.beginPath();
  ctx.roundRect(-bw * 0.32, -bh - 10, bw * 0.64, 14, 6);
  ctx.fill();
  // its two sound-holes high on the shoulder, a cold light in them: its eyes
  for (const ex of [bw * 0.08, bw * 0.4]) {
    ctx.fillStyle = '#1a1420';
    circle(ctx, ex, -bh * 0.74, 7);
    ctx.fillStyle = wk || down ? 'rgba(255,150,120,0.95)' : 'rgba(200,220,255,0.85)';
    circle(ctx, ex + 1, -bh * 0.74, 3.2);
  }
  ctx.restore();
  // the toll: rings of sound off its mouth when it comes down
  if (down && live) {
    for (let i = 0; i < 3; i++) {
      const k = (t * 2 + i / 3) % 1;
      ctx.strokeStyle = `rgba(255,236,190,${0.6 * (1 - k)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -10, bw * (1 + k * 1.4), 14 + k * 20, 0, Math.PI, TAU);
      ctx.stroke();
    }
  }
  if (dying > 0.05) {
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - dying)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-bw * 0.4, -bh * 0.8);
    ctx.lineTo(-bw * 0.1, -bh * 0.4);
    ctx.lineTo(-bw * 0.3, -bh * 0.1);
    ctx.stroke();
  }
  return body;
}

export const BELLS_MOB_ART = { bell_wraith: drawBellWraith, clapper_knight: drawClapperKnight, rain_shard: drawRainShard, great_bell: drawGreatBell };

// ——— gear for players ———
// The Toll Hammer: a long haft with a head of bell bronze, flared like a little bell lying on its side
function drawTollHammer(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,220,150,0.85)';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = '#4a3428';
  ctx.fillRect(-2.2, -L * 0.82, 4.4, L * 0.84);
  ctx.fillStyle = BRONZE_D;
  ctx.fillRect(-2.8, -L * 0.3, 5.6, 3);
  ctx.save();
  ctx.translate(0, -L * 0.86);
  ctx.rotate(Math.PI / 2);
  bellPath(ctx, 9, 20);
  ctx.translate(0, 0);
  ctx.fillStyle = bronzeFill(ctx, 9, 20);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = BRONZE_E;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(106,160,138,0.6)';
  ctx.fillRect(-6, -L * 0.88, 12, 2);
  ctx.fillStyle = BRONZE;
  circle(ctx, 0, 2, 3);
  ctx.restore();
}
// The Last Heading: a long straight blade of star-iron and brass, a compass set in the cross-guard, its needle steady
function drawHeadingBlade(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(150,240,234,0.85)';
    ctx.shadowBlur = 12;
  }
  const g = ctx.createLinearGradient(-3.4, 0, 3.4, 0);
  g.addColorStop(0, '#5a5870');
  g.addColorStop(0.5, '#e8ecf8');
  g.addColorStop(1, '#8a8aa4');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-3.4, -L * 0.2);
  ctx.lineTo(-3, -L * 0.92);
  ctx.lineTo(0, -L);
  ctx.lineTo(3, -L * 0.92);
  ctx.lineTo(3.4, -L * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(40,40,60,0.6)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.22);
  ctx.lineTo(0, -L * 0.94);
  ctx.stroke();
  ctx.fillStyle = BRASS_D; // the guard, the compass in it
  ctx.fillRect(-11, -L * 0.21, 22, 4);
  ctx.fillStyle = BRASS;
  circle(ctx, 0, -L * 0.19, 5.4);
  ctx.fillStyle = '#efe4c8';
  circle(ctx, 0, -L * 0.19, 3.8);
  ctx.strokeStyle = '#c8302a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.19 + 3);
  ctx.lineTo(0, -L * 0.19 - 3);
  ctx.stroke();
  ctx.fillStyle = '#3a2e2a';
  ctx.fillRect(-2.2, -L * 0.16, 4.4, L * 0.15);
  ctx.fillStyle = BRASS_D;
  circle(ctx, 0, 1, 3);
  ctx.restore();
}
export const BELLS_SWORDS = { toll_hammer: drawTollHammer, heading_blade: drawHeadingBlade };
export const BELLS_SWORD_LEN = { toll_hammer: 66, heading_blade: 68 };

// The Bell Helm: a helm cast in bell bronze, flared at the rim like the Great Bell's lip, a little crown loop on top
function drawBellHelm(ctx, w, h) {
  const by = -h * 0.6, rx = w * 0.5;
  ctx.save();
  ctx.translate(0, by + 6);
  bellPath(ctx, rx, h * 0.46);
  ctx.fillStyle = bronzeFill(ctx, rx, h * 0.46);
  ctx.fill();
  ctx.strokeStyle = BRONZE_E;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = 'rgba(106,160,138,0.5)';
  ctx.fillRect(-rx * 0.8, -h * 0.12, rx * 1.6, 3);
  ctx.strokeStyle = BRONZE_D;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, -h * 0.5, 4, Math.PI, TAU);
  ctx.stroke();
  ctx.restore();
}
// The Clapper Helm: a clapper knight's great helm, one piece of bell bronze, a single eye-slit
function drawClapperHelm(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.46;
  ctx.fillStyle = bronzeFill(ctx, rx, h * 0.4);
  ctx.beginPath();
  ctx.roundRect(-rx, by - h * 0.3, rx * 2, h * 0.42, [14, 14, 4, 4]);
  ctx.fill();
  ctx.strokeStyle = BRONZE_E;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = '#1a1420';
  ctx.fillRect(-rx * 0.6, by - 3, rx * 1.4, 5);
  ctx.strokeStyle = VERD_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, by - h * 0.3);
  ctx.lineTo(0, by - 4);
  ctx.stroke();
}
// The Helmsman's Cap: a peaked cap of brass plate, a lamp at the brow, a little gyroscope turning in its crown
function drawHelmsmanCap(ctx, w, h, t = 0) {
  const by = -h * 0.68, rx = w * 0.46;
  ctx.fillStyle = BRASS_D;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.9, by + 4);
  ctx.bezierCurveTo(-rx * 0.9, by - h * 0.3, rx * 0.9, by - h * 0.3, rx * 0.9, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3a3040'; // the peak
  ctx.beginPath();
  ctx.ellipse(rx * 0.4, by + 4, rx * 0.7, 4, 0.05, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = BRASS; // the band
  ctx.fillRect(-rx * 0.9, by - 2, rx * 1.8, 5);
  ctx.fillStyle = 'rgba(150,240,234,0.9)'; // the brow lamp
  circle(ctx, rx * 0.5, by, 3);
  const a = (typeof t === 'number' ? t : 0) * 2; // the gyroscope in the crown
  ctx.strokeStyle = '#fde3a0';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, by - h * 0.24, 6, 6 * Math.abs(Math.cos(a)) + 0.5, 0, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, by - h * 0.24, 6 * Math.abs(Math.sin(a)) + 0.5, 6, 0, 0, TAU);
  ctx.stroke();
}
export const BELLS_HELMETS = { bell_helm: drawBellHelm, clapper_helm: drawClapperHelm, helmsman_cap: drawHelmsmanCap };

// ——— material icons (centred, about 28 px) ———
function iconWraithChime(ctx) {
  ctx.strokeStyle = '#8a8c9e';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, -6);
  ctx.stroke();
  ctx.fillStyle = '#dfe4f0';
  ctx.save();
  ctx.translate(0, 8);
  bellPath(ctx, 8, 14);
  ctx.fill();
  ctx.strokeStyle = '#7a7e94';
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(200,210,240,0.35)';
  circle(ctx, 0, 2, 12);
}
function iconClapperPlate(ctx) {
  ctx.fillStyle = BRONZE;
  ctx.strokeStyle = BRONZE_E;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-11, -6);
  ctx.quadraticCurveTo(0, -12, 11, -6);
  ctx.lineTo(9, 9);
  ctx.quadraticCurveTo(0, 12, -9, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = VERD;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(8, 0);
  ctx.stroke();
}
function iconStoppedDrop(ctx) {
  softGlow(ctx, 0, 0, 14, RAIN, 0.4);
  drop(ctx, 0, 2, 3.2, 0.95);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  circle(ctx, -1.5, 0, 1.4);
}
function iconBellBronze(ctx) {
  ctx.fillStyle = BRONZE_D;
  ctx.strokeStyle = BRONZE_E;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-11, 6);
  ctx.quadraticCurveTo(-4, -10, 10, -8);
  ctx.lineTo(8, 0);
  ctx.quadraticCurveTo(-2, 0, -6, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(106,160,138,0.7)';
  ellipse(ctx, 0, -4, 4, 2);
}
function iconWheelPeg(ctx) {
  const g = ctx.createLinearGradient(-4, 0, 4, 0);
  g.addColorStop(0, BRASS_E);
  g.addColorStop(0.5, '#fde3a0');
  g.addColorStop(1, BRASS_D);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-3, 12);
  ctx.lineTo(-3, -2);
  ctx.quadraticCurveTo(-6, -6, -4, -10);
  ctx.quadraticCurveTo(0, -14, 4, -10);
  ctx.quadraticCurveTo(6, -6, 3, -2);
  ctx.lineTo(3, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-4, 8, 8, 3);
}
export const BELLS_ICONS = { wraith_chime: iconWraithChime, clapper_plate: iconClapperPlate, stopped_drop: iconStoppedDrop, bell_bronze: iconBellBronze, wheel_peg: iconWheelPeg };
export { BRONZE, BRONZE_L, BRONZE_D, BRONZE_E, VERD, VERD_D, softGlow };
