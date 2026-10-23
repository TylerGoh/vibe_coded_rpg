// Docs: docs/places/heights.md, docs/combat/stages.md
// The Aurora Heights' art that isn't the room itself (src/heights.js): its creatures (ptarmigan, snow fox, rime
// eagle, aurora jelly, musk ox, lost star and the Pale Wyrm, the field boss; HEIGHTS_MOB_ART, called by
// drawMob in src/field.js), the gear dropped there (HEIGHTS_SWORDS, HEIGHTS_SWORD_LEN, HEIGHTS_HELMETS, drawn
// by drawSword / drawHelmet in src/field.js; the staves are data in src/staff-art.js) and its materials'
// icons (HEIGHTS_ICONS).
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
const AUR = '150,240,200', STAR = '220,235,255';
function face(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, sleepy = false } = {}) {
  ctx.strokeStyle = INKC;
  ctx.fillStyle = INKC;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.6) < 0.12;
  for (const ex of [fx - gap, fx + gap]) {
    if (dying > 0.05) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex + 2.2 * size, fy + 2.2 * size);
      ctx.moveTo(ex + 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex - 2.2 * size, fy + 2.2 * size);
      ctx.stroke();
    } else if (blink || sleepy) {
      ctx.beginPath();
      ctx.arc(ex, fy - 1, 2.4 * size, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ellipse(ctx, ex, fy, 2.4 * size, 3.2 * size);
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
      ctx.fillStyle = INKC;
    }
  }
}
function halo(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function star5(ctx, x, y, R, r, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i / 10) * TAU, rr = i % 2 ? r : R;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

// Ptarmigan: a round white grouse in its winter coat, feathered snowshoe feet, a black tail edge and a little
// red comb over the eye. Harmless; it hops.
function drawPtarmigan(ctx, w, h, t, seed, m, dying) {
  const cy = -h * 0.45, peck = m.walking ? 0 : Math.max(0, Math.sin(t * 2 + seed)) * 0.25;
  // feathered feet
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#9aa8bc';
  ctx.lineWidth = 1.3;
  for (const x of [-w * 0.08, w * 0.12]) {
    ctx.beginPath();
    ctx.ellipse(x, -h * 0.06, w * 0.12, h * 0.07, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  const body = () => {
    ctx.ellipse(-w * 0.04, cy, w * 0.4, h * 0.36, 0, 0, TAU);
    ctx.moveTo(w * 0.4, cy - h * 0.26);
    ctx.ellipse(w * 0.24, cy - h * 0.26 + peck * h * 0.3, w * 0.18, h * 0.2, 0, 0, TAU);
  };
  const g = ctx.createLinearGradient(0, cy - h * 0.5, 0, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#dce6f2');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#9aa8bc';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // tail with its black edge
  ctx.fillStyle = INKC;
  ctx.beginPath();
  ctx.ellipse(-w * 0.44, cy - h * 0.04, w * 0.08, h * 0.12, -0.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, -w * 0.4, cy - h * 0.02, w * 0.07, h * 0.11, -0.5);
  // wing line
  ctx.strokeStyle = 'rgba(154,168,188,0.8)';
  ctx.beginPath();
  ctx.arc(-w * 0.04, cy - h * 0.02, w * 0.22, 0.2, 2.4);
  ctx.stroke();
  const hy = cy - h * 0.26 + peck * h * 0.3;
  // beak, comb, eye
  ctx.fillStyle = INKC;
  ctx.beginPath();
  ctx.moveTo(w * 0.4, hy - 1);
  ctx.lineTo(w * 0.48, hy + 2);
  ctx.lineTo(w * 0.39, hy + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e04a5a';
  ellipse(ctx, w * 0.27, hy - h * 0.11, w * 0.06, h * 0.035, 0.2);
  face(ctx, w * 0.29, hy - h * 0.02, 0.001, t, seed, { dying, size: 0.8 });
  return () => {
    ctx.beginPath();
    body();
  };
}

// Snow fox: a small white fox with short round ears, black eyes and nose and a great soft brush of a tail.
// m.special: it has dived into the snow (blink) and only the tail's tip shows over a little mound
function drawSnowFox(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  if (gone) {
    ctx.fillStyle = '#f4f8ff';
    ctx.strokeStyle = '#b8c8dc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.4, h * 0.22, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, -w * 0.1 + Math.sin(t * 9) * 3, -h * 0.28, w * 0.07, h * 0.12, 0.3);
    for (let i = 0; i < 4; i++) circle(ctx, Math.sin(t * 7 + i * 2) * w * 0.4, -h * 0.2 - ((t * 2 + i * 0.25) % 1) * h * 0.4, 1.6);
    return () => {
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.4, h * 0.22, 0, Math.PI, 0);
    };
  }
  const cy = -h * 0.42, step = m.walking ? Math.sin(t * 10) * 3 : 0;
  // legs
  ctx.fillStyle = '#e6eef8';
  ctx.strokeStyle = '#9aa8bc';
  ctx.lineWidth = 1.4;
  for (const [x, s] of [[-0.24, 1], [-0.12, -1], [0.14, 1], [0.26, -1]]) {
    ctx.beginPath();
    ctx.roundRect(w * x - 3, -h * 0.3 - s * step * 0.3, 6, h * 0.3, 3);
    ctx.fill();
    ctx.stroke();
  }
  // the brush, curling up behind
  const tw = Math.sin(t * 2.4 + seed) * 0.15;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-w * 0.44, cy - h * 0.18, w * 0.2, h * 0.3, -0.9 + tw, 0, TAU);
  ctx.fill();
  ctx.stroke();
  const body = () => {
    ctx.ellipse(-w * 0.04, cy, w * 0.34, h * 0.24, 0, 0, TAU);
    ctx.moveTo(w * 0.46, cy - h * 0.14);
    ctx.ellipse(w * 0.3, cy - h * 0.16, w * 0.17, h * 0.22, 0, 0, TAU);
  };
  const g = ctx.createLinearGradient(0, cy - h * 0.4, 0, cy + h * 0.3);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#d8e2f0');
  ctx.fillStyle = g;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // ears, snout, nose
  ctx.fillStyle = '#ffffff';
  for (const dx of [0.2, 0.32]) {
    ctx.beginPath();
    ctx.moveTo(w * dx - 5, cy - h * 0.3);
    ctx.lineTo(w * dx, cy - h * 0.5);
    ctx.lineTo(w * dx + 5, cy - h * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, w * 0.44, cy - h * 0.08, w * 0.08, h * 0.08);
  ctx.fillStyle = INKC;
  circle(ctx, w * 0.51, cy - h * 0.1, 2.2);
  face(ctx, w * 0.32, cy - h * 0.2, w * 0.05, t, seed, { dying, size: 0.75 });
  return () => {
    ctx.beginPath();
    body();
  };
}

// Rime eagle: a big grey-white eagle with frost along its wings, a yellow hooked beak and yellow feet. It
// stoops out of the aurora. m.warn: wings up, about to stoop · m.charging: diving.
function drawRimeEagle(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const cy = -h * 0.5, bob = live && !dive ? Math.sin(t * 2 + seed) * 2 : 0;
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(dive ? 0.55 : 0);
  const flap = dive ? -1.1 : warn ? -0.7 + Math.sin(t * 16) * 0.15 : Math.sin(t * 3 + seed) * 0.3;
  const wing = (s) => {
    ctx.save();
    ctx.translate(-w * 0.04, cy - 2);
    ctx.rotate(flap * s);
    ctx.scale(1, s);
    ctx.fillStyle = s > 0 ? '#c8d0dc' : '#e2e8f0';
    ctx.strokeStyle = '#5a6a80';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w * 0.2, -h * 0.7, -w * 0.55, -h * 0.45);
    for (let i = 0; i < 4; i++) ctx.lineTo(-w * (0.5 - i * 0.1), -h * (0.3 - i * 0.05));
    ctx.quadraticCurveTo(-w * 0.12, -h * 0.05, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(220,240,255,0.95)'; // rime on the leading edge
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.04, -h * 0.08);
    ctx.quadraticCurveTo(-w * 0.2, -h * 0.66, -w * 0.52, -h * 0.44);
    ctx.stroke();
    ctx.restore();
  };
  wing(1);
  const body = () => {
    ctx.ellipse(-w * 0.04, cy, w * 0.3, h * 0.22, 0, 0, TAU);
    ctx.moveTo(w * 0.38, cy - h * 0.12);
    ctx.ellipse(w * 0.26, cy - h * 0.12, w * 0.13, h * 0.18, 0, 0, TAU);
  };
  ctx.fillStyle = '#d8dee8';
  ctx.strokeStyle = '#5a6a80';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, w * 0.26, cy - h * 0.14, w * 0.1, h * 0.13);
  // tail
  ctx.fillStyle = '#b8c2d0';
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, cy - 3);
  ctx.lineTo(-w * 0.52, cy - 8);
  ctx.lineTo(-w * 0.5, cy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // beak and feet
  ctx.fillStyle = '#f2c84a';
  ctx.strokeStyle = '#8a6a20';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.36, cy - h * 0.18);
  ctx.quadraticCurveTo(w * 0.5, cy - h * 0.18, w * 0.47, cy - h * 0.04);
  ctx.lineTo(w * 0.38, cy - h * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f2c84a';
  for (const x of [-w * 0.04, w * 0.06]) ellipse(ctx, x, cy + h * 0.22, 3, 4);
  wing(-1);
  face(ctx, w * 0.29, cy - h * 0.18, 0.001, t, seed, { dying, size: 0.8 });
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// Aurora jelly: a drifting bell of the lights' own colour, see-through, green going violet, with long ribbon
// tentacles. m.special: it has gone dark (phase) and can't be hurt
function drawAuroraJelly(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  const cy = -h * 0.65, pulse = Math.sin(t * 2.4 + seed) * 0.08;
  ctx.save();
  if (gone) ctx.globalAlpha *= 0.18 + 0.08 * Math.sin(t * 20);
  halo(ctx, 0, cy, w * 0.9, AUR, 0.35);
  // ribbons
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const x = -w * 0.28 + i * w * 0.14;
    ctx.strokeStyle = `hsla(${150 + i * 30},85%,70%,0.6)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, cy + h * 0.12);
    ctx.bezierCurveTo(x + Math.sin(t * 2 + i) * 8, cy + h * 0.35, x - Math.sin(t * 2.2 + i) * 8, cy + h * 0.5, x + Math.sin(t * 1.7 + i) * 6, cy + h * 0.68);
    ctx.stroke();
  }
  const body = () => {
    ctx.moveTo(-w * 0.44 * (1 + pulse), cy + h * 0.14);
    ctx.bezierCurveTo(-w * 0.48 * (1 + pulse), cy - h * 0.4, w * 0.48 * (1 + pulse), cy - h * 0.4, w * 0.44 * (1 + pulse), cy + h * 0.14);
    ctx.quadraticCurveTo(0, cy + h * 0.04, -w * 0.44 * (1 + pulse), cy + h * 0.14);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, cy - h * 0.35, 0, cy + h * 0.15);
  g.addColorStop(0, 'rgba(170,255,220,0.85)');
  g.addColorStop(1, 'rgba(200,150,255,0.7)');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(90,170,150,0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ellipse(ctx, -w * 0.16, cy - h * 0.16, w * 0.1, h * 0.06, -0.4);
  // its light inside
  halo(ctx, 0, cy - h * 0.04, w * 0.3, '220,255,240', 0.6);
  face(ctx, w * 0.06, cy - h * 0.02, w * 0.1, t, seed, { dying, size: 0.75 });
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// Musk ox: a dark brown beast in a long skirt of hair down to the snow, a cream saddle on its back, and a
// great boss of horn across its brow, curving down and up at the tips: blows on its front don't land well.
// m.warn: head down, about to lunge
function drawMuskOx(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, charge = !!m.charging && live;
  const cy = -h * 0.5, sway = m.walking ? Math.sin(t * 6) * 1.5 : 0;
  ctx.save();
  if (warn) {
    ctx.translate(w * 0.3, -h * 0.4);
    ctx.rotate(0.1);
    ctx.translate(-w * 0.3, h * 0.4);
  }
  // legs peeking out under the skirt
  ctx.fillStyle = '#3a2a22';
  for (const x of [-0.28, -0.12, 0.12, 0.26]) ctx.fillRect(w * x - 3, -h * 0.12, 6, h * 0.12);
  ctx.fillStyle = '#d8ccb8';
  for (const x of [-0.28, -0.12, 0.12, 0.26]) ctx.fillRect(w * x - 3, -4, 6, 4);
  const body = () => {
    ctx.moveTo(-w * 0.46, cy + h * 0.34);
    ctx.quadraticCurveTo(-w * 0.5, cy - h * 0.2, -w * 0.2, cy - h * 0.4);
    ctx.quadraticCurveTo(w * 0.1, cy - h * 0.5, w * 0.3, cy - h * 0.3);
    ctx.quadraticCurveTo(w * 0.48, cy - h * 0.1, w * 0.46, cy + h * 0.2);
    ctx.lineTo(w * 0.4, cy + h * 0.36);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, cy - h * 0.45, 0, cy + h * 0.4);
  g.addColorStop(0, '#6e5040');
  g.addColorStop(1, '#3e2a20');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#24160e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // the long hair hanging in strands
  ctx.strokeStyle = 'rgba(30,18,12,0.6)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 14; i++) {
    const x = -w * 0.42 + i * w * 0.062;
    ctx.beginPath();
    ctx.moveTo(x, cy - h * 0.1);
    ctx.quadraticCurveTo(x - 2 + sway, cy + h * 0.15, x - 1 + sway, cy + h * 0.36);
    ctx.stroke();
  }
  // the cream saddle and frost on it
  ctx.fillStyle = '#c8b498';
  ellipse(ctx, -w * 0.04, cy - h * 0.36, w * 0.16, h * 0.07, -0.1);
  ctx.fillStyle = 'rgba(240,248,255,0.85)';
  ellipse(ctx, -w * 0.08, cy - h * 0.42, w * 0.1, h * 0.03, -0.1);
  // the face, low, and the horn boss
  const hx = w * 0.36, hy = cy + h * 0.02;
  ctx.fillStyle = '#4e3a2e';
  ctx.beginPath();
  ctx.ellipse(hx, hy, w * 0.11, h * 0.2, 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a7a6a';
  ellipse(ctx, hx + w * 0.06, hy + h * 0.14, w * 0.05, h * 0.06);
  face(ctx, hx + w * 0.02, hy - h * 0.02, w * 0.04, t, seed, { dying, size: 0.75 });
  ctx.strokeStyle = '#3e3026';
  ctx.lineWidth = w * 0.08 + 2;
  ctx.lineCap = 'round';
  const horn = () => {
    ctx.beginPath();
    ctx.moveTo(hx - w * 0.12, hy - h * 0.2);
    ctx.quadraticCurveTo(hx + w * 0.02, hy - h * 0.32, hx + w * 0.14, hy - h * 0.18);
    ctx.quadraticCurveTo(hx + w * 0.2, hy - h * 0.02, hx + w * 0.16, hy + h * 0.06);
    ctx.stroke();
  };
  horn();
  ctx.strokeStyle = charge ? '#fff2d8' : '#e2d2b4';
  ctx.lineWidth = w * 0.08;
  horn();
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// Lost star: a little star that fell with the Wyrm, five soft points, pale and dimmed, hopping about the
// Wyrmfall. m.warn: it brightens and flicks a spark
function drawLostStar(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const cy = -h * 0.5, spin = Math.sin(t * 1.5 + seed) * 0.12;
  const R = Math.min(w, h) * 0.52;
  halo(ctx, 0, cy, R * (warn ? 2.4 : 1.8), STAR, warn ? 0.7 : 0.35);
  const body = () => {
    star5(ctx, 0, cy, R, R * 0.55, -Math.PI / 2 + spin);
  };
  const g = ctx.createRadialGradient(0, cy, 2, 0, cy, R);
  g.addColorStop(0, warn ? '#ffffff' : '#f4f8ff');
  g.addColorStop(1, warn ? '#d8ecff' : '#a8bcd8');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#5a6e98';
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,190,210,0.5)';
  ellipse(ctx, -R * 0.3, cy + R * 0.12, 3, 2);
  ellipse(ctx, R * 0.3, cy + R * 0.12, 3, 2);
  face(ctx, 0, cy - R * 0.05, R * 0.22, t, seed, { dying, size: 0.8, sleepy: !warn && !m.walking && live });
  if (warn) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) circle(ctx, Math.cos(t * 9 + i * 1.6) * R * 1.3, cy + Math.sin(t * 9 + i * 1.6) * R * 1.3, 1.6);
  }
  return () => {
    body();
  };
}

// The Pale Wyrm: something of the Astral Wyrm's kind that fell with it, a long serpent of frosted starglass
// with a dim star in every coil, a mane of faint aurora wisps, small swept horns. Drowsy unless it's striking:
// it would rather lie in the snow. m.warn: it lifts its head, eyes lit, about to fall on you · m.charging:
// stretched out, falling
function drawPaleWyrm(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const cy = -h * 0.45, N = 14;
  const amp = dive ? h * 0.06 : h * 0.16;
  ctx.save();
  if (dive) ctx.rotate(0.35);
  // the spine: tail (west) to neck (east)
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const k = i / N, x = -w * 0.5 + k * w * 0.78;
    let y = cy + Math.sin(k * 5.2 - t * 1.4 + seed) * amp * (1 - k * 0.4);
    if (warn) y -= k * k * h * 0.35;
    pts.push([x, y, 3 + Math.sin(k * Math.PI) * h * 0.2 + k * h * 0.06]);
  }
  const [hx, hy] = pts[N];
  const headY = hy - (warn ? h * 0.08 : 0);
  halo(ctx, 0, cy, w * 0.55, STAR, warn ? 0.4 : 0.22);
  // the mane: faint aurora wisps along the back
  ctx.lineCap = 'round';
  for (let i = 3; i <= N; i += 2) {
    const [x, y, r] = pts[i];
    ctx.strokeStyle = `hsla(${150 + (i % 4) * 35},85%,62%,${0.5 + 0.2 * Math.sin(t * 2 + i)})`;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.8);
    ctx.quadraticCurveTo(x - 10, y - r - 14 + Math.sin(t * 2.4 + i) * 4, x - 22, y - r - 6);
    ctx.stroke();
  }
  const body = () => {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y, r] of pts) ctx.lineTo(x, y - r);
    ctx.quadraticCurveTo(hx + w * 0.16, headY - h * 0.22, hx + w * 0.22, headY - h * 0.02);
    ctx.quadraticCurveTo(hx + w * 0.16, headY + h * 0.14, hx, hy + pts[N][2]);
    for (let i = N; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + pts[i][2]);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, cy - h * 0.4, 0, cy + h * 0.3);
  g.addColorStop(0, '#f4f8ff');
  g.addColorStop(1, '#94a6d0');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#34406e';
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // belly plates
  ctx.strokeStyle = 'rgba(74,90,136,0.35)';
  ctx.lineWidth = 1.2;
  for (let i = 2; i < N; i++) {
    const [x, y, r] = pts[i];
    ctx.beginPath();
    ctx.moveTo(x - 3, y + r * 0.4);
    ctx.lineTo(x + 3, y + r * 0.95);
    ctx.stroke();
  }
  // a dim star in every coil
  for (let i = 1; i < N; i += 2) {
    const [x, y] = pts[i], a = (warn ? 0.9 : 0.4) + 0.2 * Math.sin(t * 1.6 + i);
    halo(ctx, x, y, 9, STAR, a * 0.7);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    star5(ctx, x, y, 3.2, 1.4, t * 0.3 + i);
    ctx.fill();
  }
  // horns swept back, a soft whisker, the face
  ctx.fillStyle = '#dce6f6';
  ctx.strokeStyle = '#4a5a88';
  ctx.lineWidth = 1.4;
  for (const [dx, len] of [[0, 1], [w * 0.04, 0.8]]) {
    ctx.beginPath();
    ctx.moveTo(hx + w * 0.06 + dx, headY - h * 0.16);
    ctx.quadraticCurveTo(hx - w * 0.02 + dx, headY - h * 0.34 * len, hx - w * 0.08 + dx, headY - h * 0.36 * len);
    ctx.quadraticCurveTo(hx + dx, headY - h * 0.24, hx + w * 0.1 + dx, headY - h * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(220,235,255,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(hx + w * 0.2, headY + h * 0.02);
  ctx.quadraticCurveTo(hx + w * 0.24, headY + h * 0.18 + Math.sin(t * 2) * 3, hx + w * 0.18, headY + h * 0.28);
  ctx.stroke();
  if (warn && live) {
    for (const ex of [hx + w * 0.1, hx + w * 0.15]) halo(ctx, ex, headY - h * 0.06, 8, '200,230,255', 0.9);
  }
  face(ctx, hx + w * 0.125, headY - h * 0.06, w * 0.025, t, seed, { dying, size: 0.9, sleepy: !warn && !dive && live });
  ctx.restore();
  return () => {
    ctx.save();
    if (dive) ctx.rotate(0.35);
    ctx.beginPath();
    body();
    ctx.restore();
  };
}

export const HEIGHTS_MOB_ART = { ptarmigan: drawPtarmigan, snow_fox: drawSnowFox, rime_eagle: drawRimeEagle, aurora_jelly: drawAuroraJelly, musk_ox: drawMuskOx, lost_star: drawLostStar, pale_wyrm: drawPaleWyrm };

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
const grip = (ctx, c1, c2) => {
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.strokeStyle = c2;
  ctx.lineWidth = 1;
  for (let y = -1; y < 10; y += 3.2) {
    ctx.beginPath();
    ctx.moveTo(-3, y);
    ctx.lineTo(3, y + 1.6);
    ctx.stroke();
  }
};
// Foxfire Blade: a slim white blade, a flicker of green running up its edge, a snow fox's brush at the grip
function drawFoxfireBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.lineTo(-3.5, -L * 0.85);
    ctx.lineTo(0, -L);
    ctx.lineTo(4, -L * 0.85);
    ctx.lineTo(4, -6);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-4, 0, 4, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#c8d4e4');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#5a6a88';
  ctx.lineWidth = 1.5;
  blade();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `rgba(${AUR},${0.45 + 0.5 * glow})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(3, -10);
  ctx.lineTo(3, -L * 0.84);
  ctx.lineTo(0, -L * 0.97);
  ctx.stroke();
  ctx.fillStyle = '#9aa4b4';
  ctx.beginPath();
  ctx.roundRect(-8, -9, 16, 4, 2);
  ctx.fill();
  grip(ctx, '#e8eef6', '#8a96a6');
  ctx.fillStyle = '#ffffff'; // the brush
  ctx.strokeStyle = '#9aa8bc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(-5, 12, 4, 7, 0.5, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
// Pale Star Blade: a long blade of frosted starglass, faceted, a dim star caught near the tip
function drawPaleStarBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(-7, -L * 0.7);
    ctx.lineTo(0, -L);
    ctx.lineTo(7, -L * 0.7);
    ctx.lineTo(6, -6);
    ctx.closePath();
  };
  ctx.fillStyle = 'rgba(214,230,252,0.92)';
  ctx.strokeStyle = '#4a5a88';
  ctx.lineWidth = 1.6;
  blade();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.moveTo(-5, -8);
  ctx.lineTo(-6, -L * 0.68);
  ctx.lineTo(0, -L * 0.96);
  ctx.lineTo(-1, -8);
  ctx.closePath();
  ctx.fill();
  halo(ctx, 0, -L * 0.78, 9 + 5 * glow, STAR, 0.6 + 0.4 * glow);
  ctx.fillStyle = '#ffffff';
  star5(ctx, 0, -L * 0.78, 3.4, 1.5);
  ctx.fill();
  ctx.fillStyle = '#8a9ac0';
  ctx.beginPath();
  ctx.roundRect(-10, -9, 20, 5, 2.5);
  ctx.fill();
  grip(ctx, '#c8d4ec', '#6a7aa0');
  ctx.restore();
}
export const HEIGHTS_SWORDS = { foxfire_blade: drawFoxfireBlade, pale_star_blade: drawPaleStarBlade };
export const HEIGHTS_SWORD_LEN = { foxfire_blade: 60, pale_star_blade: 68 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Musk Ox Helm: a dark wool cap with a musk ox's boss of horn across the brow, curling down and up at the sides
function drawMuskoxHelm(ctx, w, h) {
  const by = -h * 0.72, rx = w * 0.5;
  ctx.fillStyle = '#5a4234';
  ctx.strokeStyle = '#2a1a12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx, by - h * 0.4, rx, by - h * 0.4, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.lineCap = 'round';
  const horn = () => {
    ctx.beginPath();
    ctx.moveTo(-rx * 1.12, by + 10);
    ctx.quadraticCurveTo(-rx * 1.2, by - h * 0.1, -rx * 0.5, by - h * 0.16);
    ctx.quadraticCurveTo(0, by - h * 0.2, rx * 0.5, by - h * 0.16);
    ctx.quadraticCurveTo(rx * 1.2, by - h * 0.1, rx * 1.12, by + 10);
    ctx.stroke();
  };
  ctx.strokeStyle = '#3e3026';
  ctx.lineWidth = 9;
  horn();
  ctx.strokeStyle = '#e2d2b4';
  ctx.lineWidth = 6;
  horn();
  ctx.fillStyle = '#c8b498'; // the qiviut lining at the edge
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by + 2, rx * 2.04, 7, 3.5);
  ctx.fill();
}
// Aurora Crown: a thin circlet of starglass with the aurora moving in it, a dim star at the front
function drawAuroraCrown(ctx, w, h, t = 0) {
  const by = -h * 0.74, rx = w * 0.46;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(214,230,252,0.85)';
  ctx.strokeStyle = '#4a5a88';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 4);
  for (let i = 0; i <= 6; i++) {
    const x = -rx + (i * rx * 2) / 6, up = i % 2 ? h * 0.12 : h * (i === 3 ? 0.26 : 0.2);
    ctx.lineTo(x - rx * 0.08, by - 2);
    ctx.lineTo(x, by - up);
    ctx.lineTo(x + rx * 0.08, by - 2);
  }
  ctx.lineTo(rx, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = `hsla(${150 + i * 28 + Math.sin(t + i) * 20},85%,70%,0.55)`;
    ctx.fillRect(-rx + 4 + i * (rx * 2 - 8) / 6, by - 1, (rx * 2 - 8) / 6, 4);
  }
  halo(ctx, 0, by - h * 0.12, 8, STAR, 0.7);
  ctx.fillStyle = '#ffffff';
  star5(ctx, 0, by - h * 0.12, 3, 1.3);
  ctx.fill();
  ctx.restore();
}
export const HEIGHTS_HELMETS = { muskox_helm: drawMuskoxHelm, aurora_crown: drawAuroraCrown };

// ——— materials' icons (40 × 40, centred) ———
function iconPtarmiganFeather(ctx) {
  ctx.save();
  ctx.rotate(-0.6);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#9aa8bc';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, -2, 7, 15, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#b8c4d4';
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.lineTo(0, -15);
  ctx.stroke();
  ctx.fillStyle = INKC;
  ctx.beginPath();
  ctx.ellipse(0, -14, 4, 3, 0, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}
function iconFoxBrush(ctx) {
  ctx.save();
  ctx.rotate(-0.5);
  ctx.fillStyle = '#e6eef8';
  ctx.strokeStyle = '#9aa8bc';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 16, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, -2, -6, 5, 8);
  ctx.restore();
}
function iconEagleQuill(ctx) {
  ctx.save();
  ctx.rotate(0.6);
  ctx.fillStyle = '#c8d0dc';
  ctx.strokeStyle = '#5a6a80';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, 17);
  ctx.quadraticCurveTo(-8, 0, -2, -17);
  ctx.quadraticCurveTo(6, -2, 0, 17);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(230,245,255,0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, 6);
  ctx.quadraticCurveTo(-6, -4, -2, -15);
  ctx.stroke();
  ctx.restore();
}
function iconBottledAurora(ctx) {
  halo(ctx, 0, 3, 18, AUR, 0.5);
  const g = ctx.createLinearGradient(0, -8, 0, 14);
  g.addColorStop(0, 'rgba(150,255,210,0.8)');
  g.addColorStop(1, 'rgba(190,140,255,0.8)');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#4a6a88';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-8, -8, 16, 22, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#a8865a';
  ctx.fillRect(-4, -14, 8, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(-5, -5, 2, 14);
}
function iconQiviut(ctx) {
  ctx.fillStyle = '#9a7e64';
  for (const [x, y, r] of [[-7, 3, 9], [4, -3, 10], [9, 6, 7], [-1, 8, 8]]) circle(ctx, x, y, r);
  ctx.fillStyle = '#c8b498';
  for (const [x, y, r] of [[-5, 0, 5], [4, -6, 6]]) circle(ctx, x, y, r);
  ctx.strokeStyle = 'rgba(70,50,36,0.5)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(-8 + i * 4, 4 + (i % 2) * 2, 4, 0.3, 2.6);
    ctx.stroke();
  }
}
function iconStarSpark(ctx) {
  halo(ctx, 0, 0, 18, STAR, 0.6);
  ctx.fillStyle = '#f4f8ff';
  ctx.strokeStyle = '#5a6e98';
  ctx.lineWidth = 1.5;
  star5(ctx, 0, 0, 11, 5, -Math.PI / 2 + 0.3);
  ctx.fill();
  ctx.stroke();
}
function iconPaleScale(ctx) {
  ctx.fillStyle = 'rgba(214,230,252,0.92)';
  ctx.strokeStyle = '#4a5a88';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.quadraticCurveTo(15, -8, 12, 6);
  ctx.quadraticCurveTo(6, 15, 0, 15);
  ctx.quadraticCurveTo(-6, 15, -12, 6);
  ctx.quadraticCurveTo(-15, -8, 0, -15);
  ctx.fill();
  ctx.stroke();
  halo(ctx, 0, 1, 9, STAR, 0.8);
  ctx.fillStyle = '#ffffff';
  star5(ctx, 0, 1, 3.4, 1.5);
  ctx.fill();
}
export const HEIGHTS_ICONS = { ptarmigan_feather: iconPtarmiganFeather, fox_brush: iconFoxBrush, eagle_quill: iconEagleQuill, bottled_aurora: iconBottledAurora, qiviut: iconQiviut, star_spark: iconStarSpark, pale_scale: iconPaleScale };
