// Docs: docs/places/archive.md, docs/combat/stages.md
// The Citadel's depth pass, C2's art that isn't a room (the Archive's room is src/archive.js, the Indexer and its den
// src/dens-archive.js): the Archive's mobs (page swarm, ink slime, binder automaton, index moth) (ARCHIVE_MOB_ART, called by
// drawMob in src/field.js); their materials' icons and the Indexer's (ARCHIVE_ICONS); gear for players (ARCHIVE_SWORDS,
// ARCHIVE_SWORD_LEN, ARCHIVE_HELMETS): Folio's Archivist's Rule and Reading Visor, the Indexer's Spike and the Drawer Crown
// (the staffs and bows are rows in src/staff-art.js and src/bow-art.js); and Folio's look (the 'archivist' accessory:
// drawArchivistDress, through src/slime.js). The Citadel's register: brass, paper, oak, ink; solemn, no whimsy.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse, clamp } from './util.js';

const BRASS = '#f0c470', BRASS_L = '#fde3a0', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const PAPER = '#efe4c8', PAPER_D = '#d8c8a0', INKC = '#1a1630', OAK = '#6a4a32', OAK_D = '#3e2a1e', RED = '#c8302a';
const warnK = (v) => (v === true ? 1 : clamp(+v || 0, 0, 1));

// a page: a little sheet seen at an angle `a` (its turn), ruled lines on it
function page(ctx, x, y, s, a, tint = PAPER) {
  const k = Math.cos(a);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(a * 0.7) * 0.5);
  ctx.scale(Math.abs(k) * 0.85 + 0.15, 1);
  ctx.fillStyle = k > 0 ? tint : PAPER_D;
  ctx.strokeStyle = 'rgba(110,84,60,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(-s * 0.7, -s, s * 1.4, s * 2);
  ctx.fill();
  ctx.stroke();
  if (k > 0) {
    ctx.strokeStyle = 'rgba(60,50,80,0.4)';
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(-s * 0.5, i * s * 0.32);
      ctx.lineTo(s * 0.45, i * s * 0.32);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// A page swarm: loose pages up out of the stacks in a flock, turning over and over round a knot of them in the middle,
// a pair of ink-blot eyes on the front page. It drifts up the way everything here does, and comes down on you rustling
function drawPageSwarm(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const cy = -h * 0.55 + (live ? Math.sin(t * 1.3 + seed * 5) * 5 : dying * 20);
  const rr = Math.min(w, h) * 0.46;
  const body = () => {
    ctx.beginPath();
    ctx.arc(0, cy, rr, 0, TAU);
  };
  ctx.save();
  ctx.globalAlpha *= live ? 1 : 1 - dying * 0.7;
  const spin = live ? t * 1.6 + seed : seed;
  for (let i = 0; i < 9; i++) { // the flock, wheeling round
    const a = spin * (i % 2 ? 1 : -0.8) + (i / 9) * TAU;
    const d = rr * (0.55 + 0.3 * Math.sin(i * 1.7 + spin * 0.5)) * (1 + dying * 1.5);
    page(ctx, Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, 6.5, spin * 3 + i * 1.3);
  }
  page(ctx, -3, cy + 2, 9, live ? Math.sin(t * 2 + seed) * 0.6 : 0.4); // the knot in the middle
  page(ctx, 4, cy - 1, 10, live ? Math.sin(t * 2.3 + seed) * 0.5 : 0.2);
  if (live) { // two blots for eyes, on the front page
    ctx.fillStyle = INKC;
    circle(ctx, 3, cy - 3, 2);
    circle(ctx, 9, cy - 3, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    circle(ctx, 3.6, cy - 3.6, 0.7);
    circle(ctx, 9.6, cy - 3.6, 0.7);
  }
  ctx.restore();
  return body;
}

// An ink slime: the Archive's spilt ink gone to slime in the wells, a glossy black blob with a violet sheen, a nib-shaped
// glint on top, drips running off it (it leaves a trail of ink: the `ink` puddle in src/hazards.js)
function drawInkSlime(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const sq = live ? 1 + Math.sin(t * 5 + seed * 3) * 0.06 : 1 - dying * 0.5;
  const bw = w * 0.5 / Math.sqrt(sq), bh = h * 0.92 * sq;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-bw, -1);
    ctx.bezierCurveTo(-bw, -bh * 0.9, -bw * 0.3, -bh, 0, -bh);
    ctx.bezierCurveTo(bw * 0.3, -bh, bw, -bh * 0.9, bw, -1);
    ctx.quadraticCurveTo(0, 3, -bw, -1);
    ctx.closePath();
  };
  ctx.save();
  ctx.fillStyle = 'rgba(26,22,48,0.3)'; // the wet ring it sits in
  ellipse(ctx, 0, 0, bw * 1.25, 4);
  body();
  const g = ctx.createLinearGradient(0, -bh, 0, 0);
  g.addColorStop(0, '#3a3466');
  g.addColorStop(0.5, '#221e40');
  g.addColorStop(1, INKC);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#0e0c1c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,150,230,0.4)'; // the sheen
  ellipse(ctx, -bw * 0.35, -bh * 0.7, bw * 0.28, bh * 0.12, -0.4);
  ctx.fillStyle = 'rgba(253,227,160,0.75)'; // the nib-shaped glint
  ctx.beginPath();
  ctx.moveTo(-bw * 0.05, -bh * 0.97);
  ctx.lineTo(bw * 0.12, -bh * 0.8);
  ctx.lineTo(-bw * 0.02, -bh * 0.74);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 3; i++) { // drips running down its sides
    const dx = (i - 1) * bw * 0.6, k = live ? (t * 0.6 + i * 0.37 + seed) % 1 : 0.5;
    ctx.fillStyle = INKC;
    ellipse(ctx, dx, -bh * 0.35 + k * bh * 0.3, 2.4, 3.4 + k * 2);
  }
  if (live) { // eyes, white and wide
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, bw * 0.18, -bh * 0.55, 4.2, 5);
    ellipse(ctx, bw * 0.55, -bh * 0.55, 3.6, 4.4);
    ctx.fillStyle = INKC;
    circle(ctx, bw * 0.24, -bh * 0.53, 2.2);
    circle(ctx, bw * 0.6, -bh * 0.53, 1.9);
  } else { // it splashes out flat
    ctx.fillStyle = `rgba(26,22,48,${0.6 * (1 - dying)})`;
    for (let i = 0; i < 6; i++) circle(ctx, Math.cos(i) * bw * (1 + dying), -2 - dying * 8 * Math.abs(Math.sin(i * 2)), 3);
  }
  ctx.restore();
  return body;
}

// A binder automaton: one of the rebinding machines, a squat brass press on two stubby legs, a screw-press wheel on its top,
// one round lens for an eye, and a great leather-bound board held up in front of it like a shield (the `shell`: hit it from
// behind, where its works show). On its warn it hauls the board up to slam it shut on you
function drawBinderAutomaton(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0;
  const lunging = !!m?.charging;
  const bw = w * 0.4, top = -h * 0.82;
  const body = () => {
    ctx.beginPath();
    ctx.rect(-bw, top, bw * 2 + 14, -top);
  };
  ctx.save();
  // the legs
  ctx.fillStyle = BRASS_E;
  for (const lx of [-bw * 0.55, bw * 0.4]) {
    ctx.beginPath();
    ctx.roundRect(lx - 5, -14, 10, 14, 3);
    ctx.fill();
  }
  // the press's body, brass, riveted, the works showing through a grille at the back
  const g = ctx.createLinearGradient(-bw, 0, bw, 0);
  g.addColorStop(0, BRASS_D);
  g.addColorStop(0.5, BRASS_L);
  g.addColorStop(1, BRASS_D);
  ctx.fillStyle = g;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-bw, top + 14, bw * 2, -top - 26, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3a2e2a'; // the grille at its back
  ctx.fillRect(-bw + 5, top + 26, 12, -top - 48);
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let y = top + 30; y < -20; y += 6) {
    ctx.moveTo(-bw + 5, y);
    ctx.lineTo(-bw + 17, y);
  }
  ctx.stroke();
  ctx.fillStyle = BRASS_E;
  for (const [rx, ry] of [[-bw + 24, top + 22], [bw - 8, top + 22], [-bw + 24, -20], [bw - 8, -20]]) circle(ctx, rx, ry, 2);
  // the screw-press wheel on top, turning a little as it walks
  const sp = live ? t * 1.5 + seed : seed;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, top + 14);
  ctx.lineTo(0, top + 2);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, top + 2, bw * 0.7, 4, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = BRASS_L;
  for (let i = 0; i < 4; i++) circle(ctx, Math.cos(sp + (i * TAU) / 4) * bw * 0.7, top + 2 + Math.sin(sp + (i * TAU) / 4) * 4, 2.4);
  // the lens eye
  const ex = bw * 0.35, ey = top + 32;
  ctx.fillStyle = BRASS_E;
  circle(ctx, ex, ey, 8);
  ctx.fillStyle = '#2a2430';
  circle(ctx, ex, ey, 6);
  if (live) {
    ctx.fillStyle = wk || lunging ? 'rgba(255,120,100,0.95)' : 'rgba(255,226,160,0.85)';
    circle(ctx, ex + 1.5, ey, 3.2);
  }
  // the board: a great leather-bound cover held up in front, brass corners and a clasp (raised on the warn)
  const raise = lunging ? -14 : -10 * wk;
  ctx.save();
  ctx.translate(bw + 6, top + 22 + raise);
  ctx.rotate(lunging ? 0.12 : -0.06 * wk);
  ctx.fillStyle = '#6a2e26';
  ctx.strokeStyle = '#2e1410';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-4, 0, 14, -top - 20, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRASS;
  ctx.fillRect(-4, 0, 14, 5);
  ctx.fillRect(-4, -top - 25, 14, 5);
  ctx.fillStyle = BRASS_D; // the clasp
  ctx.fillRect(8, (-top - 20) * 0.45, 6, 10);
  ctx.strokeStyle = 'rgba(253,227,160,0.5)'; // tooling on the leather
  ctx.lineWidth = 1;
  ctx.strokeRect(-1, 9, 8, -top - 38);
  ctx.restore();
  if (dying > 0.05) { // the board drops and the press springs open
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - dying)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-bw * 0.5, top + 20);
    ctx.lineTo(bw * 0.2, top + 40);
    ctx.stroke();
  }
  ctx.restore();
  return body;
}

// An index moth: a great grey moth whose wings are catalogue cards, a little tab standing up off each one's edge with a
// letter worn off it. It sleeps on the top drawers and drops on anything that moves (`dive`: its wings fold back)
function drawIndexMoth(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? warnK(m.warn) : 0;
  const diving = !!m?.charging;
  const cy = -h * 0.55;
  const flap = live ? (diving ? 0.2 : Math.sin(t * 9 + seed * 3) * 0.5 + 0.55) * (1 - wk * 0.6) : 0.3;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, w * 0.48, h * 0.42, 0, 0, TAU);
  };
  ctx.save();
  ctx.globalAlpha *= live ? 1 : 1 - dying * 0.6;
  for (const s of [-1, 1]) { // the wings: two cards each side, tabs up
    for (const [k, wy] of [[1, -1], [0.75, 1]]) {
      ctx.save();
      ctx.translate(0, cy);
      ctx.scale(s, 1);
      ctx.rotate(wy * (0.25 + flap * 0.35) * (diving ? 0.4 : 1));
      const ww = w * 0.44 * k, wh = h * 0.34 * k;
      ctx.scale(1, 0.45 + flap * 0.55);
      ctx.fillStyle = wy < 0 ? '#c8c0b4' : '#b0a898';
      ctx.strokeStyle = '#6e6458';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(2, wy < 0 ? -wh : 0, ww, wh, 3);
      ctx.fill();
      ctx.stroke();
      if (wy < 0) { // the tab
        ctx.beginPath();
        ctx.roundRect(ww * 0.55, -wh - 6, ww * 0.3, 7, 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(80,70,90,0.35)'; // ruled lines
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < 4; i++) {
        const ly = (wy < 0 ? -wh : 0) + (wh * i) / 4;
        ctx.moveTo(6, ly);
        ctx.lineTo(ww - 4, ly);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(200,48,42,0.5)'; // a faded red margin line
      ctx.fillRect(8, wy < 0 ? -wh + 2 : 2, 1.2, wh - 4);
      ctx.restore();
    }
  }
  // the body: furry, grey, banded
  ctx.fillStyle = '#7a7068';
  ctx.strokeStyle = '#4a4440';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, cy + 4, 6, h * 0.3, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,192,180,0.5)';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    ctx.moveTo(-5, cy + 4 + i * 6);
    ctx.lineTo(5, cy + 4 + i * 6);
  }
  ctx.stroke();
  // the head, feathery antennae, two dark eyes
  ctx.fillStyle = '#8a8078';
  circle(ctx, 0, cy - h * 0.24, 6);
  ctx.strokeStyle = '#6e6458';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const s of [-1, 1]) {
    ctx.moveTo(s * 2, cy - h * 0.3);
    ctx.quadraticCurveTo(s * 10, cy - h * 0.5, s * 14, cy - h * 0.46);
  }
  ctx.stroke();
  ctx.fillStyle = wk || diving ? '#ff7a5a' : '#2a2430';
  circle(ctx, 2.6, cy - h * 0.25, 2);
  circle(ctx, -1.6, cy - h * 0.25, 1.6);
  ctx.restore();
  return body;
}

export const ARCHIVE_MOB_ART = { page_swarm: drawPageSwarm, ink_slime: drawInkSlime, binder_automaton: drawBinderAutomaton, index_moth: drawIndexMoth };

// ——— gear for players ———
// The Archivist's Rule: a long brass rule ground to an edge, every inch marked, a little leather grip
function drawArchivistRule(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,236,200,0.9)';
    ctx.shadowBlur = 10;
  }
  const g = ctx.createLinearGradient(-4, 0, 4, 0);
  g.addColorStop(0, BRASS_D);
  g.addColorStop(0.5, BRASS_L);
  g.addColorStop(1, BRASS);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-3.5, -L * 0.18);
  ctx.lineTo(-3.5, -L * 0.96);
  ctx.lineTo(0, -L);
  ctx.lineTo(3.5, -L * 0.96);
  ctx.lineTo(3.5, -L * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,58,30,0.8)'; // the inch marks
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const y = -L * 0.2 - i * L * 0.054;
    ctx.moveTo(-3.5, y);
    ctx.lineTo(i % 2 ? -1.5 : 0.5, y);
  }
  ctx.stroke();
  ctx.fillStyle = BRASS_E; // a plain cross-guard
  ctx.fillRect(-7, -L * 0.19, 14, 3);
  ctx.fillStyle = '#5a3a2a'; // the leather grip
  ctx.fillRect(-2.2, -L * 0.17, 4.4, L * 0.16);
  ctx.fillStyle = BRASS;
  circle(ctx, 0, 1, 3);
  ctx.restore();
}
// The Indexer's Spike: a filing spike as long as a sword, brass on an iron foot, a few last pages still caught on it
function drawIndexerSpike(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,140,120,0.85)';
    ctx.shadowBlur = 12;
  }
  const g = ctx.createLinearGradient(-3, 0, 3, 0);
  g.addColorStop(0, BRASS_D);
  g.addColorStop(0.5, BRASS_L);
  g.addColorStop(1, BRASS_D);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-2.8, -L * 0.2);
  ctx.lineTo(0, -L);
  ctx.lineTo(2.8, -L * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1;
  ctx.stroke();
  // the pages on it, skewered, a little ragged
  for (const [k, a] of [[0.36, 0.2], [0.44, -0.25], [0.5, 0.1]]) {
    ctx.save();
    ctx.translate(0, -L * k);
    ctx.rotate(a);
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = 'rgba(110,84,60,0.8)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.rect(-8, -3, 16, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = RED;
    ctx.fillRect(-6, -1, 3, 2);
    ctx.restore();
  }
  ctx.fillStyle = '#4a4656'; // the iron foot as its guard
  ctx.beginPath();
  ctx.ellipse(0, -L * 0.2, 9, 3.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = OAK_D;
  ctx.fillRect(-2.2, -L * 0.18, 4.4, L * 0.17);
  ctx.fillStyle = BRASS_E;
  circle(ctx, 0, 1, 3);
  ctx.restore();
}
export const ARCHIVE_SWORDS = { archivist_rule: drawArchivistRule, indexer_spike: drawIndexerSpike };
export const ARCHIVE_SWORD_LEN = { archivist_rule: 64, indexer_spike: 68 };

// The Reading Visor: a green glass eyeshade on a brass band, a little lens on an arm swung down over one eye
function drawReadingVisor(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.48;
  ctx.fillStyle = BRASS_D;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-rx * 0.84, by - 2, rx * 1.68, 6, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(90,170,120,0.72)'; // the shade
  ctx.strokeStyle = '#2e6a4a';
  ctx.beginPath();
  ctx.moveTo(-rx * 0.2, by + 1);
  ctx.lineTo(rx * 0.95, by + 1);
  ctx.quadraticCurveTo(rx * 1.3, by + 6, rx * 1.2, by + 9);
  ctx.lineTo(-rx * 0.1, by + 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = BRASS_E; // the lens on its arm
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(rx * 0.7, by + 2);
  ctx.lineTo(rx * 0.62, by + 14);
  ctx.stroke();
  ctx.fillStyle = 'rgba(230,240,255,0.45)';
  circle(ctx, rx * 0.6, by + 18, 5);
  ctx.strokeStyle = BRASS;
  ctx.beginPath();
  ctx.arc(rx * 0.6, by + 18, 5, 0, TAU);
  ctx.stroke();
}
// The Drawer Crown: a ring of little brass card drawers, each with a label frame and no label; one sticks out a little
function drawDrawerCrown(ctx, w, h) {
  const by = -h * 0.64, rx = w * 0.46;
  for (let i = -2; i <= 2; i++) {
    const dx = i * rx * 0.36, dh = 13 - Math.abs(i) * 1.5, out = i === 1 ? 3 : 0;
    ctx.fillStyle = OAK;
    ctx.strokeStyle = OAK_D;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(dx - 7, by - dh - out, 14, dh + 4, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = BRASS; // the label frame
    ctx.fillRect(dx - 4, by - dh + 2 - out, 8, 4);
    ctx.fillStyle = PAPER;
    ctx.fillRect(dx - 3, by - dh + 3 - out, 6, 2);
    ctx.fillStyle = BRASS_E; // the pull
    circle(ctx, dx, by - 1 - out, 1.5);
  }
  ctx.fillStyle = BRASS_D;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-rx * 0.9, by + 2, rx * 1.8, 6, 3);
  ctx.fill();
  ctx.stroke();
}
export const ARCHIVE_HELMETS = { reading_visor: drawReadingVisor, drawer_crown: drawDrawerCrown };

// ——— material icons (centred, about 28 px) ———
function iconLooseLeaf(ctx) {
  page(ctx, 0, 0, 11, 0.3);
}
function iconArchiveInk(ctx) {
  ctx.fillStyle = 'rgba(200,214,250,0.5)'; // a little glass bottle
  ctx.strokeStyle = '#5a6aa8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-8, -6, 16, 16, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INKC;
  ctx.beginPath();
  ctx.roundRect(-7, -1, 14, 10, 3);
  ctx.fill();
  ctx.fillStyle = OAK; // the stopper
  ctx.fillRect(-4, -12, 8, 6);
  ctx.fillStyle = 'rgba(160,150,230,0.5)';
  ellipse(ctx, -3, 2, 2.5, 1.2);
}
function iconBinderClasp(ctx) {
  ctx.fillStyle = BRASS;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-11, -6, 16, 12, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(3, -4, 9, 8, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRASS_E;
  circle(ctx, -7, 0, 1.6);
  circle(ctx, -1, 0, 1.6);
}
function iconIndexTab(ctx) {
  ctx.fillStyle = '#c8c0b4';
  ctx.strokeStyle = '#6e6458';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-12, -5, 24, 14, 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(2, -11, 8, 7, 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(80,70,90,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const y of [0, 4]) {
    ctx.moveTo(-9, y);
    ctx.lineTo(9, y);
  }
  ctx.stroke();
}
function iconLastCard(ctx) {
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.rect(-13, -8, 26, 17);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = RED; // the red top line, and the date typed under it, nothing else
  ctx.fillRect(-11, -5, 22, 1.4);
  ctx.fillStyle = INKC;
  for (let i = 0; i < 5; i++) ctx.fillRect(-10 + i * 3.2, -2.5, 2.2, 2);
  ctx.strokeStyle = 'rgba(60,50,80,0.25)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (const y of [3, 6]) {
    ctx.moveTo(-11, y);
    ctx.lineTo(11, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  circle(ctx, 0, 7, 1.6); // the hole for the rod
}
export const ARCHIVE_ICONS = { loose_leaf: iconLooseLeaf, archive_ink: iconArchiveInk, binder_clasp: iconBinderClasp, index_tab: iconIndexTab, last_card: iconLastCard };

// ——— Folio (the 'archivist' accessory: src/slime.js) ———
// A small archive automaton: brass seams and rivets, a pair of round reading lenses on a bridge over its eyes, a green
// eyeshade, a little card drawer in its front with a brass pull, a pen tucked behind it on a thin arm, and a short stack
// of index cards held in front that it keeps squaring up
export function drawArchivistDress(ctx, w, h, fx, t) {
  ctx.save();
  ctx.strokeStyle = 'rgba(138,90,46,0.55)'; // the seam round its middle, and rivets
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.46, w * 0.47, h * 0.09, 0, 0.1, Math.PI - 0.1);
  ctx.stroke();
  ctx.fillStyle = BRASS_E;
  for (let i = -2; i <= 2; i++) circle(ctx, i * w * 0.15, -h * 0.39 + Math.abs(i) * 1.2, 1.5);
  // the card drawer in its front
  const dx = fx * 0.3;
  ctx.fillStyle = OAK;
  ctx.strokeStyle = OAK_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(dx - 11, -h * 0.3, 22, 13, 2.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRASS;
  ctx.fillRect(dx - 6, -h * 0.3 + 3, 12, 4);
  ctx.fillStyle = PAPER;
  ctx.fillRect(dx - 5, -h * 0.3 + 4, 10, 2);
  ctx.fillStyle = BRASS_E;
  circle(ctx, dx, -h * 0.3 + 10, 1.6);
  // the reading lenses on their bridge, over its eyes
  const ly = -h * 0.6;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(fx - 4, ly, 6, 0, TAU);
  ctx.moveTo(fx + 18, ly);
  ctx.arc(fx + 12, ly, 6, 0, TAU);
  ctx.moveTo(fx + 2, ly - 1);
  ctx.quadraticCurveTo(fx + 4, ly - 4, fx + 6, ly - 1);
  ctx.stroke();
  ctx.fillStyle = 'rgba(230,240,255,0.25)';
  circle(ctx, fx - 4, ly, 5.2);
  circle(ctx, fx + 12, ly, 5.2);
  // the green eyeshade
  ctx.fillStyle = 'rgba(90,170,120,0.7)';
  ctx.strokeStyle = '#2e6a4a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, -h * 0.76);
  ctx.quadraticCurveTo(fx, -h * 0.84, fx + w * 0.55, -h * 0.72);
  ctx.lineTo(fx + w * 0.4, -h * 0.68);
  ctx.quadraticCurveTo(fx, -h * 0.76, -w * 0.28, -h * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the pen behind it on a thin arm, nodding as it writes nothing
  const nod = Math.sin(t * 1.4) * 0.15;
  ctx.save();
  ctx.translate(-fx * 0.8, -h * 0.7);
  ctx.rotate(-0.6 + nod);
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -12);
  ctx.stroke();
  ctx.fillStyle = INKC;
  ctx.fillRect(-1.5, -24, 3, 12);
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.moveTo(-1.5, -24);
  ctx.lineTo(0, -28);
  ctx.lineTo(1.5, -24);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // the stack of cards held out in front, squared up now and then
  const tap = Math.max(0, Math.sin(t * 0.8)) ** 8 * 3;
  ctx.save();
  ctx.translate(fx * 1.25, -h * 0.2 - tap);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i === 3 ? PAPER : PAPER_D;
    ctx.strokeStyle = 'rgba(110,84,60,0.7)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.rect(-8 + (i % 2) * 0.8, -i * 1.6, 16, 10);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = RED;
  ctx.fillRect(-6, -4.2, 12, 1);
  ctx.restore();
  ctx.restore();
}
export { page as drawPage };
