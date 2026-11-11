// Docs: docs/places/stillmere.md, docs/combat/stages.md
// The Still Mere's art that isn't the room itself (src/stillmere.js; atlas Phase 8, L2): its creatures (mist shade, mere
// eel, lamp crab: STILLMERE_MOB_ART, called by drawMob in src/field.js), their materials' icons (STILLMERE_ICONS), and
// gear for players (STILLMERE_SWORDS, STILLMERE_SWORD_LEN, STILLMERE_HELMETS): Ferryman Hob's tier (the Boathook, the
// Oilskin Hat; the staff and bow are in src/staff-art.js and src/bow-art.js), the lamp crab's rare Crab Lantern and Old
// Gullet's Tooth and Eelskin Cowl. Lantern Fen's register: black still water, grey mist, violet dusk, small warm lights.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2e2a3a';
const EEL = '#2a2832', EEL_D = '#16141c', EEL_L = '#4a4656';
const MIST = '214,212,226';
const LAMP = '255,214,150';

// a little lantern (the fen's: a square cage of dark iron, frog-skin windows, a warm light), centred at its middle
export function drawLantern(ctx, x, y, s = 1, lit = 1, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (lit > 0 && s < 0.8) { // (small, far off: a plain soft dot, no gradient: docs/performance.md)
    ctx.fillStyle = `rgba(${LAMP},${0.18 * lit})`;
    circle(ctx, 0, 0, 14);
  } else if (lit > 0) {
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 22);
    g.addColorStop(0, `rgba(${LAMP},${0.45 * lit})`);
    g.addColorStop(1, `rgba(${LAMP},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(-22, -22, 44, 44);
  }
  ctx.fillStyle = lit > 0 ? `rgba(255,226,168,${0.55 + 0.35 * lit + 0.05 * Math.sin(t * 6)})` : '#5a5268';
  ctx.fillRect(-4, -5, 8, 10);
  ctx.strokeStyle = '#2e2a3a';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-4.5, -5.5, 9, 11);
  ctx.beginPath();
  ctx.moveTo(-5.5, -5.5);
  ctx.lineTo(0, -9);
  ctx.lineTo(5.5, -5.5);
  ctx.moveTo(0, -9);
  ctx.lineTo(0, -12);
  ctx.moveTo(0, -5.5);
  ctx.lineTo(0, 5.5);
  ctx.stroke();
  ctx.restore();
}

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, col = INKC } = {}) {
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.8) < 0.12;
  for (const ex of [fx - gap, fx + gap]) {
    if (dying > 0.05) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex + 2.2 * size, fy + 2.2 * size);
      ctx.moveTo(ex + 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex - 2.2 * size, fy + 2.2 * size);
      ctx.stroke();
    } else if (blink) {
      ctx.beginPath();
      ctx.arc(ex, fy - 1, 2.4 * size, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ellipse(ctx, ex, fy, 2.4 * size, 3.2 * size);
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
      ctx.fillStyle = col;
    }
  }
}

// Mist shade: the mere's mist got up into a hooded shape, taller than a slime, faceless in the hood but for two pale
// eyes, its hem trailing off into wisps over the water. It drifts. m.special: thinned to nothing (it comes back with a
// cold pulse: the `phase` brain)
function drawMistShade(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, gone = live && !!m.special;
  const sway = live ? Math.sin(t * 1.3 + seed) * 2.5 : 0;
  const top = -h + 4;
  const hood = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -h * 0.12);
    ctx.bezierCurveTo(-w * 0.5, -h * 0.6, -w * 0.3, top, sway * 0.3, top);
    ctx.bezierCurveTo(w * 0.34, top, w * 0.52, -h * 0.6, w * 0.44, -h * 0.12);
    ctx.quadraticCurveTo(0, -h * 0.02, -w * 0.42, -h * 0.12);
    ctx.closePath();
  };
  ctx.save();
  ctx.globalAlpha *= gone ? 0.16 : 0.85;
  const g = ctx.createRadialGradient(0, -h * 0.5, 2, 0, -h * 0.5, w * 1.2);
  g.addColorStop(0, `rgba(${MIST},0.3)`);
  g.addColorStop(1, `rgba(${MIST},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(-w * 1.2, -h * 1.1, w * 2.4, h * 1.2);
  ctx.strokeStyle = `rgba(${MIST},0.5)`; // the hem, trailing off into wisps
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const x0 = -w * 0.32 + i * w * 0.21;
    ctx.moveTo(x0, -h * 0.12);
    ctx.quadraticCurveTo(x0 - 6 + Math.sin(t * 2 + i + seed) * 4, -h * 0.02, x0 - 14 - i * 2, 2 + Math.sin(t * 1.6 + i) * 2);
  }
  ctx.stroke();
  const fg = ctx.createLinearGradient(0, top, 0, -h * 0.05);
  fg.addColorStop(0, '#d8d6e2');
  fg.addColorStop(1, 'rgba(150,146,170,0.7)');
  ctx.fillStyle = fg;
  hood();
  ctx.fill();
  ctx.fillStyle = 'rgba(46,42,58,0.85)'; // the dark inside the hood
  ctx.beginPath();
  ctx.ellipse(w * 0.08 + sway * 0.3, -h * 0.62, w * 0.24, h * 0.18, 0, 0, TAU);
  ctx.fill();
  if (live) eyes(ctx, w * 0.1 + sway * 0.3, -h * 0.62, 5, t, seed, { col: '#e8f0ff', size: 0.85 });
  else eyes(ctx, w * 0.1, -h * 0.62, 5, t, seed, { dying, col: '#e8f0ff', size: 0.85 });
  ctx.restore();
  return hood;
}

// Mere eel: a long black eel lying along the bottom of the shallows, its back just out of the water, a blunt head with a
// pale lip and a small round eye. m.special: gone under (only a dorsal fin cutting the water and a ripple: it comes up
// behind you and bites, the `blink` brain)
function drawMereEel(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, under = live && !!m.special;
  const wave = (x) => Math.sin(t * 5 + seed + x * 0.09) * (live ? 4 : 0);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -6 + wave(-w * 0.5));
    for (let i = 1; i <= 8; i++) {
      const x = -w * 0.5 + (i / 8) * w * 0.86;
      ctx.lineTo(x, -h * 0.34 - Math.sin((i / 8) * Math.PI) * h * 0.12 + wave(x));
    }
    ctx.quadraticCurveTo(w * 0.5, -h * 0.5, w * 0.5, -h * 0.18);
    ctx.lineTo(w * 0.36, -4);
    for (let i = 8; i >= 0; i--) {
      const x = -w * 0.5 + (i / 8) * w * 0.86;
      ctx.lineTo(x, -4 + wave(x) * 0.6);
    }
    ctx.closePath();
  };
  ctx.save();
  if (under) {
    const k = (t * 1.4 + seed) % 1; // a ring spreading, a fin cutting the water
    ctx.strokeStyle = `rgba(214,204,232,${0.45 * (1 - k)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, -2, 10 + k * 34, 2 + k * 5, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = EEL;
    ctx.beginPath();
    ctx.moveTo(-14, -2);
    ctx.quadraticCurveTo(-4, -16, 10, -12);
    ctx.lineTo(14, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return body;
  }
  ctx.fillStyle = EEL;
  ctx.strokeStyle = EEL_D;
  ctx.lineWidth = 2;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = EEL_L; // a dorsal fin all along the back
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 7; i++) {
    const x = -w * 0.46 + (i / 7) * w * 0.7;
    const y = -h * 0.36 - Math.sin(((i + 0.5) / 8) * Math.PI) * h * 0.12 + wave(x);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y - 3 - (i % 2) * 2);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,150,190,0.5)'; // a pale belly line
  ctx.beginPath();
  ctx.roundRect(-w * 0.4, -7, w * 0.7, 3, 1.5);
  ctx.fill();
  const hx = w * 0.4, hy = -h * 0.32;
  const gape = live ? Math.max(0, Math.sin(t * 2.2 + seed)) * 3 : 0;
  ctx.fillStyle = '#c8c0d8'; // the pale lip
  ctx.beginPath();
  ctx.moveTo(hx + w * 0.1, hy + 4);
  ctx.lineTo(hx - 4, hy + 6 + gape);
  ctx.lineTo(hx + w * 0.08, hy + 7 + gape);
  ctx.closePath();
  ctx.fill();
  if (live) {
    ctx.fillStyle = '#e8dca0';
    circle(ctx, hx + 2, hy - 2, 3);
    ctx.fillStyle = INKC;
    circle(ctx, hx + 2.6, hy - 2, 1.6);
  } else eyes(ctx, hx + 2, hy - 2, 0.1, t, seed, { dying, size: 0.7 });
  ctx.restore();
  return body;
}

// Lamp crab: a big black mere crab, each wearing a lantern stolen off the water on its back for a shell (lit, its name
// tag still turning), claws held up in front. The claws turn a blow from the front (the `shell` brain): get behind.
// m.warn: claws raised · m.charging: scuttling at you
function drawLampCrab(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = live && !!m.warn, rush = live && !!m.charging;
  const bob = live ? Math.sin(t * (rush ? 18 : 3) + seed) * (rush ? 1.6 : 0.8) : 0;
  const by = -h * 0.32 + bob;
  const shell = () => {
    ctx.beginPath();
    ctx.ellipse(0, by, w * 0.42, h * 0.2, 0, 0, TAU);
  };
  ctx.save();
  ctx.strokeStyle = EEL_D; // legs
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const lx = -w * 0.3 + i * w * 0.14, step = live ? Math.sin(t * (rush ? 20 : 6) + i * 1.7) * 3 : 0;
    ctx.moveTo(lx, by + 4);
    ctx.lineTo(lx - 8, by + 12 + step);
    ctx.lineTo(lx - 12, 0);
  }
  ctx.stroke();
  // the lantern on its back (behind the shell's top edge), tied on with weed
  drawLantern(ctx, -w * 0.06, by - h * 0.36, 1.9, live ? 1 : 0.2, t);
  ctx.strokeStyle = '#4e5a3a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, by - 2);
  ctx.quadraticCurveTo(-w * 0.06, by - h * 0.2, w * 0.2, by - 2);
  ctx.stroke();
  ctx.fillStyle = '#e8dcc0'; // its name tag, still turning
  ctx.save();
  ctx.translate(-w * 0.06 + 9, by - h * 0.36 + 10);
  ctx.rotate(Math.sin(t * 1.5 + seed) * 0.5);
  ctx.fillRect(-2, 0, 5, 7);
  ctx.restore();
  ctx.fillStyle = EEL;
  ctx.strokeStyle = EEL_D;
  ctx.lineWidth = 2;
  shell();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,214,150,0.18)'; // the lamplight on its back
  ellipse(ctx, -w * 0.06, by - h * 0.1, w * 0.26, h * 0.07);
  // the claws, up in front
  const up = warn ? -10 : rush ? 4 : 0;
  for (const [cx, cs] of [[w * 0.36, 1], [w * 0.2, 0.8]]) {
    ctx.fillStyle = cs < 1 ? EEL_D : EEL_L;
    ctx.beginPath();
    ctx.ellipse(cx + 6, by - 8 + up * cs, 10 * cs, 7 * cs, -0.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = EEL_D;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + 6, by - 8 + up * cs);
    ctx.lineTo(cx + 16 * cs, by - 14 + up * cs);
    ctx.stroke();
  }
  // eyes on stalks
  for (const ex of [w * 0.14, w * 0.24]) {
    ctx.strokeStyle = EEL_D;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex, by - h * 0.14);
    ctx.lineTo(ex + 1, by - h * 0.28);
    ctx.stroke();
  }
  if (live) {
    ctx.fillStyle = '#fff';
    for (const ex of [w * 0.14, w * 0.24]) circle(ctx, ex + 1, by - h * 0.3, 2.6);
    ctx.fillStyle = INKC;
    for (const ex of [w * 0.14, w * 0.24]) circle(ctx, ex + 1.8, by - h * 0.3, 1.3);
  } else eyes(ctx, w * 0.19, by - h * 0.3, 5, t, seed, { dying, size: 0.7 });
  ctx.restore();
  return shell;
}

export const STILLMERE_MOB_ART = { mist_shade: drawMistShade, mere_eel: drawMereEel, lamp_crab: drawLampCrab };

// ——— gear for players ———
// Hob's Boathook: a long bog-iron hook on a short ash haft
function drawBoathook(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,214,150,0.8)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = '#8a6a48'; // the haft
  ctx.beginPath();
  ctx.roundRect(-2.2, -L * 0.62, 4.4, L * 0.62, 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#3a3640'; // the iron: a spike and a hook curling back
  ctx.beginPath();
  ctx.moveTo(-3, -L * 0.6);
  ctx.lineTo(-1.6, -L * 1.02);
  ctx.lineTo(1.6, -L * 0.98);
  ctx.lineTo(3, -L * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a3640';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(2, -L * 0.74);
  ctx.quadraticCurveTo(12, -L * 0.78, 10, -L * 0.66);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,190,220,0.5)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.62);
  ctx.lineTo(0, -L * 0.96);
  ctx.stroke();
  ctx.strokeStyle = '#d8ccb0'; // a twist of cord at the grip
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -L * 0.2; y < 0; y += 3) {
    ctx.moveTo(-2.2, y);
    ctx.lineTo(2.2, y + 1.5);
  }
  ctx.stroke();
  ctx.restore();
}
// Old Gullet's Tooth: one long, backward-curving tooth, ivory going to amber at the root, a black eelskin grip; a little
// warm light deep in the root
function drawGulletTooth(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,214,150,0.85)';
    ctx.shadowBlur = 12;
  }
  const g = ctx.createLinearGradient(0, -L * 0.25, 0, -L);
  g.addColorStop(0, '#c8a060');
  g.addColorStop(0.4, '#efe6d0');
  g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-4.6, -L * 0.26);
  ctx.quadraticCurveTo(-6, -L * 0.7, 4, -L * 1.02); // curving back
  ctx.quadraticCurveTo(0, -L * 0.66, 4.6, -L * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(${LAMP},0.7)`;
  ellipse(ctx, 0, -L * 0.32, 2.4, 4);
  ctx.fillStyle = EEL; // the guard: a ring of black gum
  ctx.beginPath();
  ctx.ellipse(0, -L * 0.25, 8, 3, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = EEL_D; // the grip, wrapped in eelskin
  ctx.beginPath();
  ctx.roundRect(-2.6, -L * 0.24, 5.2, L * 0.24, 2);
  ctx.fill();
  ctx.strokeStyle = EEL_L;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -L * 0.22; y < 0; y += 3.4) {
    ctx.moveTo(-2.6, y);
    ctx.lineTo(2.6, y + 1.6);
  }
  ctx.stroke();
  ctx.restore();
}
export const STILLMERE_SWORDS = { boathook: drawBoathook, gullet_tooth: drawGulletTooth };
export const STILLMERE_SWORD_LEN = { boathook: 62, gullet_tooth: 68 };

// The Oilskin Hat: a wide black brim of oiled cloth, a low crown, a carved willow duck on the band
function drawOilskinHat(ctx, w, h) {
  const by = -h * 0.62, rx = w * 0.5;
  ctx.fillStyle = '#2e2a34';
  ctx.strokeStyle = '#16141c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, by + 4, rx * 1.25, 6, 0, 0, TAU); // the brim
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-rx * 0.66, by + 4);
  ctx.quadraticCurveTo(-rx * 0.7, by - h * 0.34, 0, by - h * 0.36);
  ctx.quadraticCurveTo(rx * 0.7, by - h * 0.34, rx * 0.66, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,190,220,0.25)'; // the oily sheen
  ellipse(ctx, -rx * 0.24, by - h * 0.22, rx * 0.16, h * 0.05, -0.3);
  ctx.fillStyle = '#6a5a42'; // the band
  ctx.fillRect(-rx * 0.66, by - 4, rx * 1.32, 5);
  ctx.fillStyle = '#c8a870'; // the duck
  ellipse(ctx, rx * 0.3, by - 3, 5, 3);
  circle(ctx, rx * 0.36 + 3, by - 6, 2.4);
  ctx.fillStyle = '#e8b040';
  ctx.fillRect(rx * 0.36 + 5, by - 6.5, 3, 1.4);
}
// The Crab Lantern: a stolen lantern on an eelskin harness, sitting on top of your head, still lit
function drawCrabLantern(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.5;
  ctx.strokeStyle = EEL_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.8, by + 6);
  ctx.quadraticCurveTo(0, by - 6, rx * 0.8, by + 6);
  ctx.stroke();
  drawLantern(ctx, 0, by - 14, 1.7, 1);
  ctx.fillStyle = '#e8dcc0'; // the tag
  ctx.fillRect(9, by - 6, 4, 6);
}
// The Eelskin Cowl: a close hood of slick black eelskin, a fin down the back, a faint light deep in the lining
function drawEelskinCowl(ctx, w, h) {
  const by = -h * 0.6, rx = w * 0.54;
  ctx.fillStyle = EEL;
  ctx.strokeStyle = EEL_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 10);
  ctx.bezierCurveTo(-rx * 1.06, by - h * 0.52, rx * 1.06, by - h * 0.52, rx, by + 10);
  ctx.quadraticCurveTo(rx * 0.7, by - 2, 0, by - 2);
  ctx.quadraticCurveTo(-rx * 0.7, by - 2, -rx, by + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,190,220,0.22)';
  ellipse(ctx, -rx * 0.3, by - h * 0.26, rx * 0.2, h * 0.06, -0.4);
  ctx.strokeStyle = EEL_L; // the fin, down the back
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.2, by - h * 0.38);
  ctx.quadraticCurveTo(-rx * 0.9, by - h * 0.4, -rx * 1.2, by - h * 0.06);
  ctx.stroke();
  ctx.fillStyle = `rgba(${LAMP},0.35)`; // the light in the lining
  ellipse(ctx, rx * 0.5, by + 4, 5, 3);
}
export const STILLMERE_HELMETS = { oilskin_hat: drawOilskinHat, crab_lantern: drawCrabLantern, eelskin_cowl: drawEelskinCowl };

// ——— materials' icons (centred on the origin, about 28 px across) ———
function iconShadeVeil(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(214,212,226,0.75)';
  ctx.beginPath();
  ctx.moveTo(-12, -6);
  ctx.quadraticCurveTo(-2, -14, 10, -8);
  ctx.quadraticCurveTo(14, 2, 6, 10);
  ctx.quadraticCurveTo(-4, 4, -10, 10);
  ctx.quadraticCurveTo(-14, 2, -12, -6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,146,170,0.8)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.quadraticCurveTo(0, 0, 4, -4);
  ctx.stroke();
  ctx.restore();
}
function iconEelskin(ctx) {
  ctx.save();
  ctx.strokeStyle = EEL;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-12, 8);
  ctx.bezierCurveTo(-4, -14, 4, 14, 12, -8);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,190,220,0.45)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-11, 6);
  ctx.bezierCurveTo(-4, -12, 4, 12, 11, -9);
  ctx.stroke();
  ctx.restore();
}
function iconCrabGlass(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,226,168,0.55)';
  ctx.strokeStyle = '#6a5a42';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-9, -11);
  ctx.quadraticCurveTo(-13, 0, -9, 11);
  ctx.lineTo(9, 11);
  ctx.quadraticCurveTo(13, 0, 9, -11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(46,42,58,0.35)';
  ctx.fillRect(-7, -8, 5, 16);
  ctx.strokeStyle = 'rgba(46,42,58,0.55)'; // the scratched name
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(2, 6);
  ctx.lineTo(7, 5);
  ctx.moveTo(3, 8);
  ctx.lineTo(6, 8);
  ctx.stroke();
  ctx.restore();
}
function iconSwallowedLamp(ctx) {
  ctx.save();
  drawLantern(ctx, 0, 2, 1.7, 1);
  ctx.restore();
}
export const STILLMERE_ICONS = { shade_veil: iconShadeVeil, mere_eelskin: iconEelskin, crab_glass: iconCrabGlass, swallowed_lamp: iconSwallowedLamp };
