// Docs: docs/places/fjord.md, docs/combat/stages.md
// Frostpeak's Phase 4 art that isn't the room itself (src/fjord.js): the later ridge and summit mobs
// (floe seal, snow owl, shard-moth; FJORD_MOB_ART, called by drawMob in src/field.js), Netmender Runa's
// gear (the Whalebone Harpoon and the Seal-Fur Hood, drawn by drawSword / drawHelmet in src/field.js), and
// the fjord folk's look and dress (drawFolk / drawFolkDress, called by src/slime.js).
import { TAU, circle, ellipse, clamp } from './util.js';

function face(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, sleepy = false } = {}) {
  ctx.strokeStyle = '#2d2a3e';
  ctx.fillStyle = '#2d2a3e';
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.4) < 0.12;
  for (const ex of [fx - gap, fx + gap]) {
    if (dying > 0.05) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex + 2.2 * size, fy + 2.2 * size);
      ctx.moveTo(ex + 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex - 2.2 * size, fy + 2.2 * size);
      ctx.stroke();
    } else if (sleepy || blink) {
      ctx.beginPath();
      ctx.arc(ex, fy - 1, 2.4 * size, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ellipse(ctx, ex, fy, 2.4 * size, 3.3 * size);
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
      ctx.fillStyle = '#2d2a3e';
    }
  }
  ctx.fillStyle = 'rgba(255,140,170,0.45)';
  ellipse(ctx, fx - gap - 4 * size, fy + 4.5 * size, 3 * size, 1.8 * size);
  ellipse(ctx, fx + gap + 4 * size, fy + 4.5 * size, 3 * size, 1.8 * size);
}

// ——— mobs: (ctx, w, h, t, seed, m, dying) => sil, origin at the feet, +x = facing ———

// Floe seal: a plump grey-blue seal that belly-slides along the snow, spotted, with whiskers and flippers
function drawSeal(ctx, w, h, t, seed, m, dying) {
  const slide = m.walking ? 1 : 0;
  const lift = slide ? 0 : Math.max(0, Math.sin(t * 1.3 + seed)) * 3; // looks up now and then, sitting
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.52, -h * 0.18);
    ctx.bezierCurveTo(-w * 0.5, -h * 0.75, w * 0.05, -h * 0.98 - lift, w * 0.32, -h * 0.9 - lift);
    ctx.bezierCurveTo(w * 0.56, -h * 0.82 - lift, w * 0.58, -h * 0.25, w * 0.42, -1);
    ctx.lineTo(-w * 0.4, -1);
    ctx.quadraticCurveTo(-w * 0.56, -2, -w * 0.52, -h * 0.18);
    ctx.closePath();
  };
  // a spray of snow behind a slide
  if (slide && dying < 0.05) {
    for (let i = 0; i < 5; i++) {
      const k = (t * 3 + i / 5) % 1;
      ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - k)})`;
      circle(ctx, -w * 0.5 - k * 26, -3 - Math.sin(k * Math.PI) * 9, 3 + k * 4);
    }
  }
  // tail flippers
  ctx.fillStyle = '#7d93b4';
  ctx.beginPath();
  ctx.moveTo(-w * 0.46, -h * 0.25);
  ctx.quadraticCurveTo(-w * 0.72, -h * 0.55 + Math.sin(t * 6 + seed) * 2, -w * 0.68, -h * 0.1);
  ctx.quadraticCurveTo(-w * 0.6, -h * 0.05, -w * 0.46, -h * 0.12);
  ctx.fill();
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#c8d6ec');
  g.addColorStop(1, '#93a7c6');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = '#64799c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(100,121,156,0.45)'; // spots
  for (const [sx, sy, r] of [[-0.28, 0.6, 3], [-0.1, 0.72, 2.4], [-0.36, 0.42, 2], [0.02, 0.5, 2.6]]) circle(ctx, w * sx, -h * sy, r);
  ctx.fillStyle = '#e8eef8'; // pale belly
  ctx.beginPath();
  ctx.ellipse(w * 0.05, -h * 0.12, w * 0.36, h * 0.12, 0, 0, Math.PI);
  ctx.fill();
  // a front flipper, paddling when it slides
  ctx.fillStyle = '#7d93b4';
  ctx.save();
  ctx.translate(w * 0.12, -h * 0.28);
  ctx.rotate(slide ? -0.6 + Math.sin(t * 10) * 0.4 : 0.3);
  ellipse(ctx, 0, 6, 4, 8);
  ctx.restore();
  const fx = w * 0.3, fy = -h * 0.68 - lift;
  face(ctx, fx, fy, 4.5, t, seed, { dying, size: 0.85 });
  if (dying < 0.05) {
    ctx.fillStyle = '#2d2a3e'; // nose and whiskers
    ellipse(ctx, fx + 9, fy + 3, 2.4, 1.8);
    ctx.strokeStyle = 'rgba(45,42,62,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const dy of [2, 5]) {
      ctx.moveTo(fx + 8, fy + dy + 1);
      ctx.lineTo(fx + 18, fy + dy - 1 + (dy - 3.5));
    }
    ctx.stroke();
  }
  return body;
}

// Snow owl: a round white owl with ear tufts and barred wings; it hangs on the air, then folds and dives
// (the cinder bat's dive: m.warn while it winds up, m.charging during the swoop)
function drawOwl(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const bob = dive ? 0 : Math.sin(t * 3 + seed * 3) * 3;
  const by = -h * 0.55 + bob, rx = w * 0.34, ry = h * 0.46;
  const flap = dive ? 1.3 : warn ? 0.9 + Math.sin(t * 34) * 0.06 : Math.sin(t * 7 + seed) * 0.6;
  const L = w * 0.6;
  const frame = () => {
    if (!dive) return;
    ctx.translate(0, by);
    ctx.rotate(0.6);
    ctx.translate(0, -by);
  };
  const wing = (side) => {
    ctx.save();
    ctx.translate(side * rx * 0.6, by - ry * 0.1);
    ctx.scale(side, 1);
    ctx.rotate(-flap * 0.8);
    ctx.moveTo(0, -4);
    ctx.quadraticCurveTo(L * 0.6, -L * 0.5, L, -L * 0.1);
    ctx.quadraticCurveTo(L * 0.8, L * 0.12, L * 0.6, L * 0.1);
    ctx.quadraticCurveTo(L * 0.4, L * 0.3, 0, ry * 0.6);
    ctx.closePath();
    ctx.restore();
  };
  const sil = () => {
    ctx.save();
    frame();
    ctx.beginPath();
    ctx.moveTo(rx, by);
    ctx.ellipse(0, by, rx, ry, 0, 0, TAU);
    wing(-1);
    wing(1);
    ctx.restore();
  };
  // a white streak behind the swoop
  if (dive) {
    for (let i = 5; i >= 1; i--) {
      const k = i / 5;
      ctx.fillStyle = `rgba(240,248,255,${0.5 * (1 - k * 0.7)})`;
      circle(ctx, -k * w * 1.2, by - k * w * 0.8, ry * (1 - k * 0.6));
    }
  }
  ctx.save();
  frame();
  for (const side of [-1, 1]) {
    ctx.fillStyle = side < 0 ? '#dfe6f2' : '#f6f9ff';
    ctx.strokeStyle = '#9fadc8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    wing(side);
    ctx.fill();
    ctx.stroke();
    ctx.save(); // grey bars along the wing
    ctx.translate(side * rx * 0.6, by - ry * 0.1);
    ctx.scale(side, 1);
    ctx.rotate(-flap * 0.8);
    ctx.strokeStyle = 'rgba(122,136,168,0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const u of [0.35, 0.55, 0.75]) {
      ctx.moveTo(L * u, -L * 0.25 * (1 - u));
      ctx.lineTo(L * u - 4, L * 0.12);
    }
    ctx.stroke();
    ctx.restore();
  }
  const g = ctx.createLinearGradient(0, by - ry, 0, by + ry);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#e2e9f6');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#9fadc8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, by, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // ear tufts
  ctx.fillStyle = '#f6f9ff';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * rx * 0.25, by - ry * 0.85);
    ctx.lineTo(s * rx * 0.62, by - ry * 1.25);
    ctx.lineTo(s * rx * 0.7, by - ry * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // speckles on its chest, and a little hooked beak between big round eyes
  ctx.fillStyle = 'rgba(122,136,168,0.5)';
  for (const [sx, sy] of [[-0.3, 0.3], [0.1, 0.45], [-0.05, 0.2], [0.3, 0.25]]) ellipse(ctx, rx * sx, by + ry * sy, 2.2, 1.4);
  const fy = by - ry * 0.25;
  if (live) {
    ctx.fillStyle = '#ffe9a8';
    for (const ex of [-6, 7]) circle(ctx, rx * 0.2 + ex, fy, 5.6);
  }
  face(ctx, rx * 0.2 + 0.5, fy, 6.5, t, seed, { dying, size: 0.9 });
  ctx.fillStyle = '#e8a54a';
  ctx.beginPath();
  ctx.moveTo(rx * 0.2 - 2, fy + 4);
  ctx.lineTo(rx * 0.2 + 3, fy + 4);
  ctx.lineTo(rx * 0.2 + 0.5, fy + 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  return sil;
}

// Shard-moth: a soft lilac moth whose wings are thin slivers of star-crystal; it drifts and glows
function drawMoth(ctx, w, h, t, seed, m, dying) {
  const by = -h * 0.55 + Math.sin(t * 2.2 + seed * 3) * 4;
  const flap = 0.55 + Math.sin(t * 11 + seed) * 0.45;
  const L = w * 0.62;
  const wing = (side, lower) => {
    ctx.save();
    ctx.translate(side * 3, by + (lower ? 4 : -2));
    ctx.scale(side * flap, 1);
    ctx.rotate(lower ? 0.5 : -0.35);
    ctx.moveTo(0, 0);
    if (lower) {
      ctx.lineTo(L * 0.55, L * 0.2);
      ctx.lineTo(L * 0.4, L * 0.55);
    } else {
      ctx.lineTo(L * 0.5, -L * 0.62);
      ctx.lineTo(L, -L * 0.3);
      ctx.lineTo(L * 0.62, L * 0.08);
    }
    ctx.closePath();
    ctx.restore();
  };
  const sil = () => {
    ctx.beginPath();
    for (const s of [-1, 1]) {
      wing(s, false);
      wing(s, true);
    }
    ctx.moveTo(4, by);
    ctx.ellipse(0, by, 5, h * 0.3, 0, 0, TAU);
  };
  if (dying < 0.05) {
    const glow = 0.25 + 0.15 * Math.sin(t * 3 + seed);
    const gg = ctx.createRadialGradient(0, by, 2, 0, by, w * 0.9);
    gg.addColorStop(0, `rgba(214,190,255,${glow})`);
    gg.addColorStop(1, 'rgba(214,190,255,0)');
    ctx.fillStyle = gg;
    circle(ctx, 0, by, w * 0.9);
  }
  for (const lower of [true, false]) {
    for (const s of [-1, 1]) {
      const cg = ctx.createLinearGradient(0, by - L * 0.6, 0, by + L * 0.4);
      cg.addColorStop(0, lower ? '#d8c8ff' : '#f1eaff');
      cg.addColorStop(1, lower ? '#a68ae6' : '#c4b0f6');
      ctx.fillStyle = cg;
      ctx.strokeStyle = '#7a62c0';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      wing(s, lower);
      ctx.fill();
      ctx.stroke();
    }
  }
  // a glint on each upper wing
  ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(t * 4 + seed)})`;
  for (const s of [-1, 1]) circle(ctx, s * L * 0.55 * flap, by - L * 0.3, 2);
  // fuzzy body, antennae and a sleepy face
  ctx.fillStyle = '#efe6ff';
  ctx.strokeStyle = '#8a74c8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, by, 7, h * 0.32, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#8a74c8';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (const s of [-1, 1]) {
    ctx.moveTo(s * 2, by - h * 0.28);
    ctx.quadraticCurveTo(s * 6, by - h * 0.6, s * 11, by - h * 0.62);
  }
  ctx.stroke();
  ctx.fillStyle = '#fff3a8';
  for (const s of [-1, 1]) circle(ctx, s * 11, by - h * 0.62, 2);
  face(ctx, 1, by - h * 0.08, 3, t, seed, { dying, size: 0.6, sleepy: true });
  return sil;
}

export const FJORD_MOB_ART = { floe_seal: drawSeal, snow_owl: drawOwl, shard_moth: drawMoth };

// ——— Runa's gear ———

// The Whalebone Harpoon: a cream bone shaft, a barbed head, and a rope wrap for a grip (grip at the
// origin, pointing up). Drawn by drawSword (src/field.js).
export function drawBoneHarpoon(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const g = ctx.createLinearGradient(-3, 0, 3, 0);
  g.addColorStop(0, '#fffaf0');
  g.addColorStop(1, '#d9ccb4');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#9a8a70';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); // the shaft
  ctx.roundRect(-2.6, -L + 12, 5.2, L - 2, 2.6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(154,138,112,0.6)'; // grain
  ctx.lineWidth = 0.8;
  for (let y = -L + 20; y < -6; y += 9) {
    ctx.beginPath();
    ctx.moveTo(-1.6, y);
    ctx.lineTo(1.2, y + 3);
    ctx.stroke();
  }
  // the barbed head
  ctx.fillStyle = '#f4efe2';
  ctx.strokeStyle = '#8a7a60';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -L - 6);
  ctx.lineTo(5, -L + 6);
  ctx.lineTo(9, -L + 14); // a barb
  ctx.lineTo(3, -L + 11);
  ctx.lineTo(2.6, -L + 14);
  ctx.lineTo(-2.6, -L + 14);
  ctx.lineTo(-3, -L + 11);
  ctx.lineTo(-9, -L + 14);
  ctx.lineTo(-5, -L + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(200,236,255,${0.35 + 0.3 * glow})`; // a little frost on the point
  ellipse(ctx, 0, -L - 1, 2, 4);
  // rope grip, and a loop of line
  ctx.strokeStyle = '#c99b6b';
  ctx.lineWidth = 2;
  for (let y = -12; y <= 4; y += 3.2) {
    ctx.beginPath();
    ctx.moveTo(-3.5, y);
    ctx.lineTo(3.5, y - 1.6);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(201,155,107,0.85)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(3, -4);
  ctx.quadraticCurveTo(12, 4, 6, 10);
  ctx.quadraticCurveTo(1, 12, 2, 6);
  ctx.stroke();
  ctx.restore();
}

// The Seal-Fur Hood: a grey seal-fur hood over a knitted band with a fjord pattern, and a fluffy trim.
// (Drawn by drawHelmet, src/field.js: w × h is the head, the brim just above the eyes.)
export function drawFurHood(ctx, w, h) {
  const by = -h * 0.68, rx = w * 0.54, ry = h * 0.44;
  ctx.fillStyle = '#9aa8c0';
  ctx.strokeStyle = '#6a7894';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx, by - ry * 1.5, rx, by - ry * 1.5, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(106,120,148,0.45)'; // seal spots
  for (const [sx, sy, r] of [[-0.4, 0.8, 2.6], [0.1, 1.0, 2], [0.38, 0.62, 2.4], [-0.1, 0.55, 1.8]]) circle(ctx, rx * sx, by - ry * sy, r);
  // the knitted band: red with a little white zigzag
  ctx.fillStyle = '#d9606e';
  ctx.beginPath();
  ctx.roundRect(-rx * 0.98, by - 7, rx * 1.96, 9, 3);
  ctx.fill();
  ctx.strokeStyle = '#fff3ea';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = -rx * 0.9, i = 0; x <= rx * 0.9; x += 5, i++) {
    if (i) ctx.lineTo(x, by - 2.5 + (i % 2 ? -2 : 2));
    else ctx.moveTo(x, by - 2.5 + 2);
  }
  ctx.stroke();
  // a fluffy trim along the brim
  ctx.fillStyle = '#f6f8ff';
  for (let x = -rx; x <= rx; x += 6) circle(ctx, x, by + 3, 3.6);
}

// ——— the fjord folk (docs/places/fjord.md; story/characters/people.md) ———
// Pale, frosted, half-solid in the cold: drawn over the body (clipped to it) as a rime crust on top and a
// few frost glints. src/slime.js paints their paler body and slows their wobble (Slime.folk).
export const FOLK_PALETTE = (hue) => ({
  top: `hsl(${hue} 55% 92%)`,
  bottom: `hsl(${hue} 32% 74%)`,
  line: `hsl(${hue} 28% 56%)`,
  cheek: `hsl(${hue} 60% 86%)`,
});
export function drawFolk(ctx, w, h, t) {
  ctx.fillStyle = 'rgba(255,255,255,0.72)'; // rime along the top, with a frosty lower edge
  ctx.beginPath();
  ctx.moveTo(-w * 0.6, -h * 1.1);
  ctx.lineTo(w * 0.6, -h * 1.1);
  ctx.lineTo(w * 0.6, -h * 0.74);
  for (let i = 0; i <= 10; i++) {
    const x = w * 0.6 - (i / 10) * w * 1.2;
    ctx.lineTo(x, -h * (0.78 - (i % 2) * 0.07 - Math.sin(i * 1.7) * 0.03));
  }
  ctx.closePath();
  ctx.fill();
  for (const [gx, gy, ph] of [[-0.28, 0.5, 0], [0.32, 0.3, 2], [0.05, 0.18, 4]]) {
    const k = clamp(Math.sin(t * 1.4 + ph), 0, 1);
    if (k < 0.05) continue;
    ctx.fillStyle = `rgba(255,255,255,${0.9 * k})`;
    ctx.beginPath(); // a four-point glint
    const x = w * gx, y = -h * gy, r = 3 * k;
    ctx.moveTo(x, y - r * 1.6);
    ctx.lineTo(x + r * 0.4, y);
    ctx.lineTo(x, y + r * 1.6);
    ctx.lineTo(x - r * 0.4, y);
    ctx.closePath();
    ctx.moveTo(x - r * 1.6, y);
    ctx.lineTo(x, y + r * 0.4);
    ctx.lineTo(x + r * 1.6, y);
    ctx.lineTo(x, y - r * 0.4);
    ctx.closePath();
    ctx.fill();
  }
}

// What each of Icefang Hamlet's people wears (their NPCS `accessory`), drawn over the face, facing right.
// fx: the face's centre x.
export function drawFolkDress(ctx, kind, w, h, fx, t) {
  ctx.save();
  if (kind === 'lamplighter') {
    // Old Skaldi: a fur-trimmed hood, a long white moustache, and his lamplighter's pole with a lantern
    const fy = -h * 0.42;
    ctx.fillStyle = '#f6f4ee';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(fx + 0.5, fy + 5);
      ctx.quadraticCurveTo(fx + s * 10, fy + 4, fx + s * 13, fy + 16 + Math.sin(t * 1.2) * 0.6);
      ctx.quadraticCurveTo(fx + s * 7, fy + 10, fx + 0.5, fy + 8);
      ctx.fill();
    }
    ctx.fillStyle = '#7a8aa6'; // the hood
    ctx.strokeStyle = '#56647e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-w * 0.52, -h * 0.5);
    ctx.bezierCurveTo(-w * 0.55, -h * 1.22, w * 0.5, -h * 1.25, w * 0.48, -h * 0.6);
    ctx.quadraticCurveTo(w * 0.1, -h * 0.82, -w * 0.3, -h * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f6f8ff'; // fur trim round the face
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      circle(ctx, -w * 0.3 + u * w * 0.78, -h * (0.66 + Math.sin(u * Math.PI) * 0.16), 3.6);
    }
    // the pole, behind him, with a little lantern hanging off its hook
    ctx.strokeStyle = '#7a5a40';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-w * 0.55, 0);
    ctx.lineTo(-w * 0.62, -h * 2.1);
    ctx.quadraticCurveTo(-w * 0.62, -h * 2.32, -w * 0.4, -h * 2.26);
    ctx.stroke();
    const lx = -w * 0.38, ly = -h * 2.0 + Math.sin(t * 1.6) * 1.2;
    ctx.strokeStyle = '#56647e';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.4, -h * 2.26);
    ctx.lineTo(lx, ly - 8);
    ctx.stroke();
    const g = ctx.createRadialGradient(lx, ly, 1, lx, ly, 22);
    g.addColorStop(0, 'rgba(255,226,150,0.8)');
    g.addColorStop(1, 'rgba(255,226,150,0)');
    ctx.fillStyle = g;
    circle(ctx, lx, ly, 22);
    ctx.fillStyle = '#56647e';
    ctx.beginPath();
    ctx.roundRect(lx - 5, ly - 8, 10, 3, 1.5);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.roundRect(lx - 4, ly - 5, 8, 10, 2.5);
    ctx.fill();
  } else if (kind === 'netmender') {
    // Netmender Runa: a knitted shawl round her shoulders, a headscarf, a netting needle and a cork float
    ctx.fillStyle = '#5aa9a1';
    ctx.strokeStyle = '#3f7f78';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); // headscarf
    ctx.moveTo(-w * 0.46, -h * 0.68);
    ctx.bezierCurveTo(-w * 0.44, -h * 1.16, w * 0.42, -h * 1.18, w * 0.44, -h * 0.72);
    ctx.quadraticCurveTo(0, -h * 0.84, -w * 0.46, -h * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff3ea';
    for (const [dx, dy] of [[-0.2, 0.95], [0.05, 1.0], [0.28, 0.92], [-0.32, 0.82], [0.36, 0.8]]) circle(ctx, w * dx, -h * dy, 1.6);
    ctx.fillStyle = '#d9606e'; // the shawl
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h * 0.34);
    ctx.quadraticCurveTo(0, -h * 0.12, w * 0.5, -h * 0.34);
    ctx.lineTo(w * 0.46, -h * 0.16);
    ctx.quadraticCurveTo(0, h * 0.06, -w * 0.46, -h * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff3ea';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const x = -w * 0.44 + (i / 10) * w * 0.88;
      ctx.lineTo(x, -h * 0.24 + Math.sin((i / 10) * Math.PI) * h * 0.1 + (i % 2 ? -1.5 : 1.5));
    }
    ctx.stroke();
    // netting needle in front, with a tail of twine, and a red-and-white float at her side
    ctx.save();
    ctx.translate(w * 0.5, -h * 0.3);
    ctx.rotate(-0.5 + Math.sin(t * 3) * 0.12);
    ctx.fillStyle = '#e8d2a8';
    ctx.strokeStyle = '#9a7a50';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(3, -16);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    circle(ctx, -w * 0.52, -h * 0.16, 5);
    ctx.fillStyle = '#e86f86';
    ctx.beginPath();
    ctx.arc(-w * 0.52, -h * 0.16, 5, Math.PI, 0);
    ctx.fill();
  } else if (kind === 'mittens') {
    // Tove: a knitted hat with a big pompom, and red mittens waving about
    ctx.fillStyle = '#e86f86';
    ctx.strokeStyle = '#b8485e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.44, -h * 0.72);
    ctx.bezierCurveTo(-w * 0.42, -h * 1.24, w * 0.4, -h * 1.26, w * 0.42, -h * 0.74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff3ea';
    ctx.beginPath();
    ctx.roundRect(-w * 0.46, -h * 0.8, w * 0.9, 7, 3);
    ctx.fill();
    circle(ctx, -w * 0.02 + Math.sin(t * 5) * 1.5, -h * 1.16, 6);
    ctx.fillStyle = '#e86f86';
    for (const s of [-1, 1]) {
      const wave = s > 0 ? Math.sin(t * 6) * 3 : 0;
      ctx.beginPath();
      ctx.ellipse(s * w * 0.52, -h * 0.32 - wave, 5, 6, s * 0.3, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}
