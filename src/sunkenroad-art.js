// Docs: docs/places/sunkenroad.md, docs/combat/stages.md
// The Sunken Road's art that isn't the room itself (src/sunkenroad.js): its creatures (briarling, old road
// guard, seed-pod lantern, root creeper and the Severed Neck, a named elite; SUNKEN_MOB_ART, called by drawMob
// in src/field.js), the gear dropped there (SUNKEN_SWORDS, SUNKEN_SWORD_LEN, SUNKEN_HELMETS, drawn by
// drawSword / drawHelmet in src/field.js) and its materials' icons (SUNKEN_ICONS).
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
// Ladon's things share one tell: small white eyes that glow (the roses its heads have for eyes).
import { TAU, circle, ellipse } from './util.js';
import { glow as softGlow } from './glow.js';

const INKC = '#2d2a3e';
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);

function thorn(ctx, x, y, a, len, base, fill = '#d8c8d0') {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(a + Math.PI / 2) * base, y + Math.sin(a + Math.PI / 2) * base);
  ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
  ctx.lineTo(x + Math.cos(a - Math.PI / 2) * base, y + Math.sin(a - Math.PI / 2) * base);
  ctx.closePath();
  ctx.fill();
}
// a pair of small white eyes, glowing softly (closed in a squint when dying)
function whiteEyes(ctx, x, y, gap, r, t, seed, dying) {
  if (dying > 0.05) {
    ctx.strokeStyle = INKC;
    ctx.lineWidth = 1.6;
    for (const ex of [x - gap, x + gap]) {
      ctx.beginPath();
      ctx.moveTo(ex - r, y - r); ctx.lineTo(ex + r, y + r);
      ctx.moveTo(ex + r, y - r); ctx.lineTo(ex - r, y + r);
      ctx.stroke();
    }
    return;
  }
  const blink = ((t + seed * 5) % 4.2) < 0.1;
  for (const ex of [x - gap, x + gap]) {
    glow(ctx, ex, y, r * 3.2, r * 3.2, '240,255,235', 0.5);
    ctx.fillStyle = '#fbfff6';
    if (blink) ellipse(ctx, ex, y, r, r * 0.25);
    else circle(ctx, ex, y, r);
  }
}
function rose(ctx, x, y, r) {
  ctx.fillStyle = '#fbf6f4';
  ctx.strokeStyle = 'rgba(200,170,180,0.8)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.55, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#f4d060';
  circle(ctx, x, y, r * 0.3);
}
// a ripple of loose earth and root tips on the floor (a creeper gone under)
function burrow(ctx, w, t, eyes) {
  ctx.fillStyle = 'rgba(70,52,46,0.8)';
  for (let i = 0; i < 6; i++) ellipse(ctx, (i - 2.5) * w * 0.14, -2 - Math.abs(Math.sin(t * 8 + i)) * 3, w * 0.09, 4);
  ctx.strokeStyle = '#4a3a2e';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * w * 0.25, k = Math.sin(t * 6 + i * 2) * 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + 4, -8 - k, x + 8, -4);
    ctx.stroke();
  }
  if (eyes) {
    ctx.fillStyle = 'rgba(250,255,245,0.9)';
    ellipse(ctx, w * 0.12, -5, 2.4, 1.2);
    ellipse(ctx, w * 0.22, -5, 2.4, 1.2);
  }
}

// Briarling: one of Ladon's seeds, grown wild. A round little bramble of black-green canes, thorns all over, a
// white rose bud on top and two white eyes; it runs about on root toes
// (`sprout`, set by src/ladon.js on one that springs up in Ladon's den where a head fell: for SPROUT_S it pushes up out
// of a split seed, unfolding)
const SPROUT_S = 0.7;
function drawBriarling(ctx, w, h, t, seed, m, dying) {
  const k = m.sprout ? Math.min(1, (m.t ?? 1) / SPROUT_S) : 1;
  if (k < 1) {
    // the seed husk, split, at its feet
    glow(ctx, 0, -6, 26, 16, '190,255,150', 0.6 * (1 - k));
    ctx.fillStyle = '#1e2418';
    for (const sd of [-1, 1]) ellipse(ctx, sd * (6 + k * 10), -3, 7, 4, sd * (0.4 + k));
    ctx.save();
    ctx.scale(0.3 + 0.7 * k + Math.sin(k * Math.PI) * 0.15, k * k * (1 + Math.sin(k * Math.PI) * 0.2));
  }
  const sil = drawBriarlingBody(ctx, w, h, t, seed, m, dying);
  if (k < 1) ctx.restore();
  return sil;
}
function drawBriarlingBody(ctx, w, h, t, seed, m, dying) {
  const r = Math.min(w, h) * 0.46, cy = -h * 0.5;
  const step = m.walking ? Math.sin(t * 16 + seed) : 0;
  ctx.strokeStyle = '#3a2e24';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const [x, s] of [[-0.45, 1], [-0.1, -1], [0.3, 1], [0.6, -1]]) {
    ctx.beginPath();
    ctx.moveTo(r * x, cy + r * 0.6);
    ctx.quadraticCurveTo(r * x + 4 * s * step, -4, r * x + 5 + step * 3 * s, 0);
    ctx.stroke();
  }
  const body = () => ctx.arc(0, cy, r, 0, TAU);
  const g = ctx.createRadialGradient(-r * 0.3, cy - r * 0.4, 1, 0, cy, r);
  g.addColorStop(0, '#4e6a44');
  g.addColorStop(1, '#22301e');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#141c12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // woven canes over the ball
  ctx.strokeStyle = 'rgba(110,140,90,0.55)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(0, cy, r * (0.45 + i * 0.13), 0.3 + i, 2.2 + i);
    ctx.stroke();
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.2;
    thorn(ctx, Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92, a, 7, 2.2);
  }
  // the bud on top
  ctx.strokeStyle = '#3e5a34';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, cy - r * 0.9);
  ctx.quadraticCurveTo(3, cy - r * 1.2, 1 + Math.sin(t * 2 + seed) * 2, cy - r * 1.35);
  ctx.stroke();
  ctx.fillStyle = '#fbf6f4';
  ellipse(ctx, 1 + Math.sin(t * 2 + seed) * 2, cy - r * 1.42, 3.6, 4.6);
  ctx.fillStyle = '#5e8a4a';
  ellipse(ctx, -2, cy - r * 1.2, 4, 2, -0.5);
  whiteEyes(ctx, r * 0.3, cy - r * 0.05, r * 0.24, 2.3, t, seed, dying);
  return () => {
    ctx.beginPath();
    body();
  };
}

// Old Road Guard: a Keeper stone figure that stood by the road, and the briar grew through it. A rounded block
// of mossy grey stone for a body, a round stone shield held in front (the shell: hit it from behind), canes
// threaded through the cracks with a rose or two, and the amber slit eyes the Keepers' work always has
function drawRoadGuard(ctx, w, h, t, seed, m, dying) {
  const warn = !!m.warn && dying < 0.05, lunge = !!m.charging;
  const lean = warn ? -0.06 : lunge ? 0.1 : 0;
  ctx.save();
  ctx.rotate(lean);
  const bw = w * 0.36, top = -h * 0.92;
  // stubby stone feet
  ctx.fillStyle = '#6e6a66';
  const step = m.walking ? Math.sin(t * 9 + seed) * 3 : 0;
  ellipse(ctx, -bw * 0.5 + step, -4, bw * 0.4, 5);
  ellipse(ctx, bw * 0.5 - step, -4, bw * 0.4, 5);
  const body = () => ctx.roundRect(-bw, top, bw * 2, -top - 6, [bw * 0.9, bw * 0.9, 8, 8]);
  const g = ctx.createLinearGradient(-bw, 0, bw, 0);
  g.addColorStop(0, '#8a8680');
  g.addColorStop(1, '#5e5a58');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3a3634';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // moss and cracks
  ctx.fillStyle = 'rgba(110,150,80,0.6)';
  ellipse(ctx, -bw * 0.4, top + 10, bw * 0.5, 5);
  ellipse(ctx, bw * 0.2, -h * 0.3, bw * 0.35, 4);
  ctx.strokeStyle = 'rgba(40,36,34,0.6)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-bw * 0.2, top + 4);
  ctx.lineTo(-bw * 0.05, top + h * 0.22);
  ctx.lineTo(-bw * 0.3, top + h * 0.38);
  ctx.stroke();
  // the eyes: two amber slits
  if (dying < 0.05) {
    const ey = top + h * 0.2;
    glow(ctx, bw * 0.35, ey, 18, 10, '255,190,90', warn ? 0.8 : 0.45);
    ctx.fillStyle = warn ? '#fff0b0' : '#ffc860';
    ctx.beginPath();
    ctx.roundRect(bw * 0.05, ey - 2, bw * 0.3, 4, 2);
    ctx.roundRect(bw * 0.45, ey - 2, bw * 0.3, 4, 2);
    ctx.fill();
  }
  // briar through it: a cane out of the top, one round the waist
  ctx.strokeStyle = '#2e3a26';
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  const sw = Math.sin(t * 1.5 + seed) * 3;
  ctx.beginPath();
  ctx.moveTo(-bw * 0.3, top + 6);
  ctx.bezierCurveTo(-bw * 0.5, top - 14, bw * 0.1, top - 20 + sw, bw * 0.4, top - 10 + sw);
  ctx.stroke();
  thorn(ctx, -bw * 0.4, top - 8, -2.2, 6, 1.8);
  thorn(ctx, bw * 0.1, top - 16 + sw, -1.2, 6, 1.8);
  rose(ctx, bw * 0.42, top - 10 + sw, 3.6);
  ctx.beginPath();
  ctx.moveTo(-bw * 1.05, -h * 0.42);
  ctx.quadraticCurveTo(0, -h * 0.36, bw * 1.05, -h * 0.46);
  ctx.stroke();
  for (let k = -0.7; k < 0.8; k += 0.5) thorn(ctx, bw * k, -h * 0.4, Math.PI / 2, 5, 1.6);
  // the shield in front
  const sx = bw * 1.05, sy = -h * 0.5, sr = h * 0.3;
  const sg = ctx.createRadialGradient(sx + sr * 0.3, sy - sr * 0.3, 2, sx, sy, sr);
  sg.addColorStop(0, '#9a968e');
  sg.addColorStop(1, '#5a5652');
  ctx.fillStyle = sg;
  ctx.strokeStyle = '#3a3634';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(sx, sy, sr * 0.45, sr, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40,36,34,0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(sx, sy, sr * 0.28, sr * 0.7, 0, 0, TAU);
  ctx.stroke();
  // thorns grown out through the shield's face
  for (const [dy, a] of [[-0.6, -0.4], [-0.1, 0.1], [0.45, 0.4]]) thorn(ctx, sx + sr * 0.3, sy + sr * dy, a, 8, 2.2, '#e0d4da');
  ctx.restore();
  return () => {
    ctx.beginPath();
    ctx.save();
    ctx.rotate(lean);
    body();
    ctx.restore();
  };
}

// Seed-Pod Lantern: a rooted stalk bent over like a lamp post, a great translucent pod hanging from its tip with
// glowing seeds inside. It swells and brightens before it throws (rooted: it never moves)
function drawSeedLantern(ctx, w, h, t, seed, m, dying) {
  const warn = !!m.warn && dying < 0.05;
  const sway = Math.sin(t * 1.2 + seed) * 3;
  // leaves and roots at its foot
  ctx.fillStyle = '#34482c';
  ctx.strokeStyle = '#1e2a18';
  ctx.lineWidth = 1.4;
  for (const [s, k] of [[-1, 1], [1, 0.9], [-1, 0.55]]) {
    ctx.beginPath();
    ctx.ellipse(s * w * 0.4 * k, -5 * k, w * 0.3 * k, 5, s * 0.35, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // the stalk
  const tipX = w * 0.35 + sway, tipY = -h * 0.82;
  ctx.strokeStyle = '#2e3a26';
  ctx.lineCap = 'round';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.1, 0);
  ctx.bezierCurveTo(-w * 0.2, -h * 0.5, -w * 0.05, -h * 1.02, tipX, tipY - 6);
  ctx.stroke();
  ctx.strokeStyle = '#4a5e3a';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  thorn(ctx, -w * 0.16, -h * 0.35, Math.PI, 6, 1.8);
  thorn(ctx, -w * 0.1, -h * 0.66, -2.6, 6, 1.8);
  // the pod
  const pr = w * (warn ? 0.36 : 0.3), py = tipY + pr * 0.9;
  glow(ctx, tipX, py, pr * 3.4, pr * 3.4, '190,255,150', warn ? 0.6 : 0.32 + 0.06 * Math.sin(t * 2 + seed));
  const pod = () => ctx.ellipse(tipX, py, pr * 0.85, pr, 0, 0, TAU);
  ctx.fillStyle = 'rgba(170,220,130,0.55)';
  ctx.strokeStyle = '#3e5a30';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  pod();
  ctx.fill();
  ctx.stroke();
  // ribs and the seeds inside
  ctx.strokeStyle = 'rgba(60,90,50,0.6)';
  ctx.lineWidth = 1;
  for (const k of [-0.45, 0, 0.45]) {
    ctx.beginPath();
    ctx.ellipse(tipX, py, pr * 0.85 * Math.abs(k || 0.08), pr, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = warn ? '#fbffe0' : '#e8ffc8';
  for (let i = 0; i < 4; i++) circle(ctx, tipX + Math.cos(i * 1.7 + t) * pr * 0.35, py + Math.sin(i * 2.3 + t * 0.8) * pr * 0.45, 2.4);
  // its cap of leaves where it hangs
  ctx.fillStyle = '#3e5a30';
  ellipse(ctx, tipX - 4, tipY - 2, 7, 3, -0.4);
  ellipse(ctx, tipX + 4, tipY - 2, 7, 3, 0.4);
  if (dying < 0.05) {
    ctx.fillStyle = INKC;
    circle(ctx, tipX + pr * 0.25, py + pr * 0.1, 1.6);
    circle(ctx, tipX + pr * 0.55, py + pr * 0.1, 1.6);
  }
  return () => {
    ctx.beginPath();
    pod();
    ctx.rect(-w * 0.18, -h * 0.75, w * 0.18, h * 0.75);
  };
}

// Root Creeper: a long knotted root that crawls on a fringe of rootlets, a blunt head with two pinprick white
// eyes. It dives under the paving and comes up behind you
function drawRootCreeper(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05, warn = !!m.warn && !gone && dying < 0.05;
  if (gone) {
    burrow(ctx, w, t, true);
    return () => {
      ctx.beginPath();
      ctx.arc(0, -6, 10, 0, TAU);
    };
  }
  const rise = warn ? 6 : 0, n = 6, seg = w / (n + 1);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = -w * 0.45 + i * seg;
    pts.push([x, -h * 0.35 - Math.sin(t * 7 + i * 0.9 + seed) * 3 - (i === n - 1 ? rise : 0)]);
  }
  // rootlet legs
  ctx.strokeStyle = '#3a2c22';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  for (const [x, y] of pts) {
    for (const d of [-1, 1]) {
      const k = m.walking ? Math.sin(t * 18 + x) * 3 : 0;
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.lineTo(x + d * 5 + k, 0);
      ctx.stroke();
    }
  }
  // the knotted body
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i], r = h * (0.26 + 0.05 * Math.sin(i * 2.1));
    const g = ctx.createRadialGradient(x - 3, y - 4, 1, x, y, r);
    g.addColorStop(0, '#7a5e48');
    g.addColorStop(1, '#4a3628');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#2a1e16';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (i % 2) thorn(ctx, x, y - r, -Math.PI / 2 - 0.3, 5, 1.6);
  }
  // the head
  const [hx, hy] = pts[n - 1], hr = h * 0.36;
  ctx.fillStyle = '#5e4636';
  ctx.strokeStyle = '#2a1e16';
  ctx.beginPath();
  ctx.ellipse(hx + hr * 0.6, hy, hr * 1.1, hr * 0.85, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  whiteEyes(ctx, hx + hr * 0.95, hy - hr * 0.2, hr * 0.24, 1.8, t, seed, dying);
  return () => {
    ctx.beginPath();
    for (const [x, y] of pts) {
      ctx.moveTo(x + h * 0.3, y);
      ctx.arc(x, y, h * 0.3, 0, TAU);
    }
    ctx.ellipse(hx + hr * 0.6, hy, hr * 1.1, hr * 0.85, 0, 0, TAU);
  };
}

// The Severed Neck: one of Ladon's heads, cut off long ago, that never stopped growing. A long dragon skull of
// woven black-green thorn, a frill of dark leaves, one white rose for an eye (the other a dark socket), a green
// glow deep in its throat, and behind it the stump of its neck, the cut end sealed in pale scar bark, grown a
// body of its own on crooked root legs. It sinks under the paving and comes up behind you
function drawSeveredNeck(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05, warn = !!m.warn && !gone && dying < 0.05;
  if (gone) {
    ctx.save();
    ctx.scale(1.6, 1.2);
    burrow(ctx, w * 0.7, t, false);
    ctx.restore();
    glow(ctx, w * 0.2, -10, 30, 16, '240,255,235', 0.5 + 0.2 * Math.sin(t * 6));
    ctx.fillStyle = '#fbfff6';
    circle(ctx, w * 0.2, -8, 2.6);
    return () => {
      ctx.beginPath();
      ctx.arc(0, -8, 16, 0, TAU);
    };
  }
  const breathe = Math.sin(t * 1.6 + seed) * 2, rear = warn ? 8 : 0, open = warn ? 0.35 : 0.08 + 0.04 * Math.sin(t * 2);
  // the neck: thick at the old cut (low at the back, where it lies on its root legs), rearing up in a curve
  // and thinning to the skull held out in front. Built from a centre curve and a width
  const nx0 = -w * 0.48, ny0 = -h * 0.26 + breathe * 0.3, hx = w * 0.12, hy = -h * 0.7 - rear + breathe;
  const c1 = [-w * 0.3, -h * 0.98 - rear * 0.5], c2 = [-w * 0.02, -h * 1.02 - rear];
  const N = 14, top = [], bot = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, v = 1 - u;
    const x = v * v * v * nx0 + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * hx;
    const y = v * v * v * ny0 + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * hy;
    const dx = 3 * v * v * (c1[0] - nx0) + 6 * v * u * (c2[0] - c1[0]) + 3 * u * u * (hx - c2[0]);
    const dy = 3 * v * v * (c1[1] - ny0) + 6 * v * u * (c2[1] - c1[1]) + 3 * u * u * (hy - c2[1]);
    const len = Math.hypot(dx, dy) || 1, nx = dy / len, ny = -dx / len, r = h * (0.19 - 0.08 * u);
    top.push([x + nx * r, y + ny * r]);
    bot.push([x - nx * r, y - ny * r]);
  }
  const neck = () => {
    ctx.moveTo(top[0][0], top[0][1]);
    for (const [x, y] of top) ctx.lineTo(x, y);
    for (let i = N; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
    ctx.closePath();
  };
  // root legs under the low part of the neck: the body it grew
  ctx.strokeStyle = '#2a2a1e';
  ctx.lineCap = 'round';
  ctx.lineWidth = 4.5;
  const step = m.walking ? Math.sin(t * 10 + seed) * 5 : 0;
  for (const [k, s] of [[1, 1], [3, -1], [5, 1], [7, -1]]) {
    const [bx, by] = bot[k];
    ctx.beginPath();
    ctx.moveTo(bx, by - 3);
    ctx.quadraticCurveTo(bx + 12 * s, by + (0 - by) * 0.4, bx + step * s + 4, 0);
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#3a4c30');
  g.addColorStop(1, '#161e12');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#0a0e08';
  ctx.lineWidth = 2;
  ctx.beginPath();
  neck();
  ctx.fill();
  ctx.stroke();
  // woven cane lines along it, and thorns like teeth down its back
  ctx.strokeStyle = 'rgba(110,140,90,0.4)';
  ctx.lineWidth = 1.5;
  for (const f of [0.3, 0.6]) {
    ctx.beginPath();
    top.forEach(([x, y], i) => {
      const px = x + (bot[i][0] - x) * f, py = y + (bot[i][1] - y) * f;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    });
    ctx.stroke();
  }
  for (let i = 1; i < N; i += 2) {
    const [x, y] = top[i], [x2, y2] = top[i + 1];
    thorn(ctx, x, y, Math.atan2(y2 - y, x2 - x) - Math.PI / 2 - 0.35, 12 - i * 0.4, 3.2, '#d8ccd2');
  }
  // the old cut at the back, sealed over in pale scar bark (rings of it)
  const ang = Math.atan2(top[0][1] - bot[0][1], top[0][0] - bot[0][0]);
  ctx.save();
  ctx.translate(nx0, ny0);
  ctx.rotate(ang - Math.PI / 2);
  ctx.fillStyle = '#b8a07e';
  ctx.strokeStyle = '#5a4a36';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, h * 0.19, h * 0.07, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,74,54,0.6)';
  ctx.beginPath();
  ctx.ellipse(0, 0, h * 0.1, h * 0.035, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
  // the skull: long, woven of thorn, snout to +x; the jaw hangs open a little (wide when it's about to dive)
  ctx.save();
  ctx.translate(hx, hy);
  const L = w * 0.46, sh = h * 0.24;
  glow(ctx, L * 0.4, sh * 0.2, L * 0.5, sh, '170,255,150', 0.25 + (warn ? 0.35 : 0)); // the throat's glow
  // leaf frill behind the skull
  ctx.fillStyle = '#2a3e24';
  ctx.strokeStyle = '#141e10';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 - 0.9 + i * 0.45;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * sh * 0.9 - 4, Math.sin(a) * sh * 0.9, 14, 5, a, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // lower jaw
  ctx.save();
  ctx.rotate(open);
  ctx.fillStyle = '#26321e';
  ctx.strokeStyle = '#0e140c';
  ctx.beginPath();
  ctx.moveTo(0, sh * 0.2);
  ctx.quadraticCurveTo(L * 0.5, sh * 0.75, L * 0.95, sh * 0.35);
  ctx.lineTo(L * 0.9, sh * 0.15);
  ctx.quadraticCurveTo(L * 0.45, sh * 0.3, 0, sh * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (let k = 0.25; k < 0.9; k += 0.16) thorn(ctx, L * k, sh * (0.25 + k * 0.05), -Math.PI / 2, 6, 1.6, '#efe6ea');
  ctx.restore();
  // upper skull
  const skull = () => {
    ctx.moveTo(-sh * 0.4, -sh * 0.6);
    ctx.quadraticCurveTo(L * 0.4, -sh * 1.05, L, -sh * 0.05);
    ctx.quadraticCurveTo(L * 0.5, sh * 0.3, -sh * 0.3, sh * 0.35);
    ctx.quadraticCurveTo(-sh * 0.7, 0, -sh * 0.4, -sh * 0.6);
    ctx.closePath();
  };
  const sg = ctx.createLinearGradient(0, -sh, 0, sh * 0.4);
  sg.addColorStop(0, '#3e5434');
  sg.addColorStop(1, '#1e2a18');
  ctx.fillStyle = sg;
  ctx.strokeStyle = '#0e140c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  skull();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(110,140,90,0.5)';
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-sh * 0.2, -sh * 0.35 + i * sh * 0.22);
    ctx.quadraticCurveTo(L * 0.45, -sh * 0.7 + i * sh * 0.25, L * 0.9, -sh * 0.05 + i * sh * 0.05);
    ctx.stroke();
  }
  for (let k = 0.2; k < 0.95; k += 0.15) thorn(ctx, L * k, sh * (0.18 - k * 0.1), Math.PI / 2, 6, 1.6, '#efe6ea'); // upper teeth
  for (let k = 0.1; k < 0.7; k += 0.2) thorn(ctx, L * k, -sh * (0.62 + 0.2 * Math.sin(k * 3)), -Math.PI / 2 - 0.5, 9, 2.4, '#d8ccd2'); // brow thorns
  // the eye: a white rose that glows; the far one a dark socket
  ctx.fillStyle = '#0a0e08';
  ellipse(ctx, L * 0.22, -sh * 0.42, 4, 3);
  if (dying < 0.05) {
    glow(ctx, L * 0.36, -sh * 0.32, 26, 22, '240,255,235', 0.6 + (warn ? 0.3 : 0));
    rose(ctx, L * 0.36, -sh * 0.32, 6);
  } else {
    ctx.fillStyle = '#8a8478';
    circle(ctx, L * 0.36, -sh * 0.32, 4);
  }
  ctx.restore();
  return () => {
    ctx.beginPath();
    neck();
    ctx.save();
    ctx.translate(hx, hy);
    skull();
    ctx.restore();
  };
}

export const SUNKEN_MOB_ART = {
  briarling: drawBriarling, road_guard: drawRoadGuard, seed_lantern: drawSeedLantern, root_creeper: drawRootCreeper, severed_neck: drawSeveredNeck,
};

// ——— gear: swords (ctx, L, glow), grip at the origin, blade up (-y) ———
// Neckthorn Fang: a great hooked black-green thorn for a blade, a pale scar-bark grip, a white rose at the guard
function drawNeckFang(ctx, L, gl) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#c8b494';
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.strokeStyle = '#6a5a44';
  ctx.lineWidth = 1;
  for (let y = -1; y < 10; y += 3.2) {
    ctx.beginPath();
    ctx.moveTo(-3, y);
    ctx.lineTo(3, y + 1.6);
    ctx.stroke();
  }
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.quadraticCurveTo(-8, -L * 0.55, 6, -L);
    ctx.quadraticCurveTo(1, -L * 0.75, 3, -L * 0.6);
    ctx.quadraticCurveTo(6, -L * 0.3, 5, -5);
    ctx.closePath();
  };
  if (gl) glow(ctx, 0, -L * 0.5, 14, L * 0.6, '200,255,190', 0.35);
  const g = ctx.createLinearGradient(-6, 0, 6, 0);
  g.addColorStop(0, '#3e5434');
  g.addColorStop(1, '#141e10');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#0a0e08';
  ctx.lineWidth = 1.4;
  blade();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(160,200,140,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, -8);
  ctx.quadraticCurveTo(-4, -L * 0.55, 4, -L * 0.92);
  ctx.stroke();
  for (let k = 0.25; k < 0.7; k += 0.15) thorn(ctx, 5, -L * k, 0.2, 4, 1.4, '#d8ccd2');
  rose(ctx, 0, -5, 4.2);
  ctx.restore();
}
export const SUNKEN_SWORDS = { neck_fang: drawNeckFang };
export const SUNKEN_SWORD_LEN = { neck_fang: 66 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Road Guard's Helm: a rounded cap of mossy grey stone, a cane of briar threaded through its crest with a rose
function drawRoadguardHelm(ctx, w, h, t = 0) {
  const by = -h * 0.7, rx = w * 0.5;
  ctx.fillStyle = '#7e7a74';
  ctx.strokeStyle = '#3a3634';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 3);
  ctx.bezierCurveTo(-rx * 1.02, by - h * 0.44, rx * 1.02, by - h * 0.44, rx, by + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,150,80,0.65)';
  ellipse(ctx, -rx * 0.4, by - h * 0.22, rx * 0.3, 3.5);
  ctx.fillStyle = '#5e5a58';
  ctx.beginPath();
  ctx.roundRect(-rx * 1.04, by - 2, rx * 2.08, 6, 3);
  ctx.fill();
  ctx.strokeStyle = '#2e3a26';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  const sw = Math.sin(t * 1.5) * 1.5;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.6, by - h * 0.18);
  ctx.bezierCurveTo(-rx * 0.3, by - h * 0.55, rx * 0.2, by - h * 0.55 + sw, rx * 0.55, by - h * 0.36 + sw);
  ctx.stroke();
  thorn(ctx, -rx * 0.35, by - h * 0.42, -2, 5, 1.6);
  thorn(ctx, rx * 0.15, by - h * 0.5 + sw, -1.2, 5, 1.6);
  rose(ctx, rx * 0.56, by - h * 0.36 + sw, 3.6);
}
export const SUNKEN_HELMETS = { roadguard_helm: drawRoadguardHelm };

// ——— materials' icons (40 × 40, centred) ———
function iconBriarSeed(ctx) {
  ctx.fillStyle = '#1e2418';
  ctx.strokeStyle = '#0a0e08';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 2, 11, 14, 0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  glow(ctx, 3, -2, 12, 12, '240,255,235', 0.5);
  ctx.fillStyle = '#fbfff6';
  circle(ctx, 3, -2, 2.6);
  ctx.strokeStyle = 'rgba(110,140,90,0.6)';
  ctx.beginPath();
  ctx.arc(0, 2, 7, 1.8, 3.6);
  ctx.stroke();
}
function iconKeeperCobble(ctx) {
  ctx.fillStyle = '#8a8680';
  ctx.strokeStyle = '#3a3634';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-14, -11, 28, 22, 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40,36,34,0.55)';
  ctx.lineWidth = 2;
  for (const y of [-3, 4]) {
    ctx.beginPath();
    ctx.moveTo(-11, y);
    ctx.lineTo(11, y - 1);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(110,150,80,0.7)';
  ellipse(ctx, -8, -9, 6, 2.5);
}
function iconGlowSeed(ctx) {
  glow(ctx, 0, 0, 20, 20, '190,255,150', 0.6);
  ctx.fillStyle = '#c8f0a0';
  ctx.strokeStyle = '#4a6a3a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 11, 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fbffe8';
  ellipse(ctx, -2, -4, 2.4, 3.2);
}
function iconCreeperRoot(ctx) {
  ctx.strokeStyle = '#5e4636';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 2, 10, 0.4, 5.6);
  ctx.stroke();
  ctx.strokeStyle = '#7a5e48';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#3a2c22';
  ctx.lineWidth = 1.4;
  for (let a = 0.6; a < 5.6; a += 0.7) {
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 12, 2 + Math.sin(a) * 12);
    ctx.lineTo(Math.cos(a) * 16, 2 + Math.sin(a) * 16);
    ctx.stroke();
  }
}
export const SUNKEN_ICONS = { briar_seed: iconBriarSeed, keeper_cobble: iconKeeperCobble, glow_seed: iconGlowSeed, creeper_root: iconCreeperRoot };
