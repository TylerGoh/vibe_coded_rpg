// Docs: docs/combat/stages.md, docs/combat/items.md
// The Wildwood: the mob stage east of the village (data in src/shared/rpg.js). Everything here only
// draws: the field's scenery (Sprout Meadow → Mushroom Grove → Bramble Woods), its gates, the mobs and
// the item icons. The sword and helmet shapes are shared with slime.js (equipped gear), so this file
// must never import slime.js.
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { drawAlchemyIcon } from './alchemy-art.js';
import { FIELD_W, FIELD_GROUND, FIELD_EXIT_X, ZONES, FIELD_PLATFORMS, MOBS, artOf } from './shared/rpg.js';
import { CALDERA_MOB_ART } from './caldera.js';
import { SANDBOX_MOB_ART } from './sandbox-art.js'; // (the dev sandbox's training dummies, docs/sandbox.md)
import { CITADEL_MOB_ART } from './citadel.js';
import { FJORD_MOB_ART, drawBoneHarpoon, drawFurHood } from './fjord-art.js';
import { FIELD_BOSS_ART, drawEliteGlow } from './fieldboss-art.js';
import { SON_ART } from './dens-fenrir.js';
import { WILLOW_MOB_ART, WILLOW_ICONS, drawReedRapier, drawLilyHat, drawMillerCap, drawSnailHelm, drawSnapjawShell } from './willowmere-art.js';
import { COVES_MOB_ART, COVES_ICONS, drawDriftCutlass, drawCoralSaber, drawTideClaw, drawConchHelm, drawHoardCrown } from './coves-art.js';
import { DEEP_MOB_ART, DEEP_ICONS, DEEP_SWORDS, DEEP_SWORD_LEN, DEEP_HELMETS } from './deep-art.js';
import { CANOPY_MOB_ART, CANOPY_ICONS, CANOPY_SWORDS, CANOPY_SWORD_LEN, CANOPY_HELMETS } from './canopy-art.js';
import { WRECK_MOB_ART, WRECK_ICONS, WRECK_SWORDS, WRECK_SWORD_LEN, WRECK_HELMETS } from './wreck-art.js';
import { THORN_MOB_ART, THORN_ICONS, THORN_SWORDS, THORN_SWORD_LEN, THORN_HELMETS } from './thornheart-art.js';
import { SPINE_MOB_ART, SPINE_ICONS, SPINE_SWORDS, SPINE_SWORD_LEN, SPINE_HELMETS } from './spine-art.js';
import { GLACIER_MOB_ART, GLACIER_ICONS, GLACIER_SWORDS, GLACIER_SWORD_LEN, GLACIER_HELMETS } from './glacier-art.js';
import { SKERRIES_MOB_ART, SKERRIES_ICONS, SKERRIES_SWORDS, SKERRIES_SWORD_LEN, SKERRIES_HELMETS } from './skerries-art.js';
import { HEIGHTS_MOB_ART, HEIGHTS_ICONS, HEIGHTS_SWORDS, HEIGHTS_SWORD_LEN, HEIGHTS_HELMETS } from './heights-art.js';
import { BLUEHALLS_MOB_ART, BLUEHALLS_ICONS, BLUEHALLS_SWORDS, BLUEHALLS_SWORD_LEN, BLUEHALLS_HELMETS } from './bluehalls-art.js';
import { SUNKEN_MOB_ART, SUNKEN_ICONS, SUNKEN_SWORDS, SUNKEN_SWORD_LEN, SUNKEN_HELMETS } from './sunkenroad-art.js';
import { OLDICE_MOB_ART, OLDICE_ICONS, OLDICE_SWORDS, OLDICE_SWORD_LEN, OLDICE_HELMETS } from './oldice-art.js';
import { LADON_SWORDS, LADON_SWORD_LEN, LADON_HELMETS } from './ladon-art.js';
import { FENRIR_SWORDS, FENRIR_SWORD_LEN, FENRIR_HELMETS } from './fenrir-art.js';
import { QBRIDGE_MOB_ART, QBRIDGE_ICONS, QBRIDGE_SWORDS, QBRIDGE_SWORD_LEN, QBRIDGE_HELMETS } from './qbridge-art.js';
import { FORGE_ICONS, FORGE_SWORDS, FORGE_SWORD_LEN, FORGE_HELMETS } from './forgehold-art.js';
import { drawStaff, STAFF_LEN } from './staff-art.js';
import { drawBow, BOW_LEN } from './bow-art.js';
const MOB_ART = { ...CALDERA_MOB_ART, ...CITADEL_MOB_ART, ...FJORD_MOB_ART, ...FIELD_BOSS_ART, ...WILLOW_MOB_ART, ...COVES_MOB_ART, ...DEEP_MOB_ART, ...CANOPY_MOB_ART, ...WRECK_MOB_ART, ...THORN_MOB_ART, ...SPINE_MOB_ART, ...GLACIER_MOB_ART, ...SKERRIES_MOB_ART, ...HEIGHTS_MOB_ART, ...BLUEHALLS_MOB_ART, ...QBRIDGE_MOB_ART, ...SUNKEN_MOB_ART, ...OLDICE_MOB_ART, ...SON_ART, ...SANDBOX_MOB_ART };
// Greenhollow's branches' gear and materials (src/willowmere-art.js, src/coves-art.js, src/deep-art.js, src/canopy-art.js,
// src/wreck-art.js, src/thornheart-art.js, src/spine-art.js, src/glacier-art.js, src/skerries-art.js, src/heights-art.js,
// src/bluehalls-art.js, src/qbridge-art.js, src/sunkenroad-art.js, src/oldice-art.js)
const BRANCH_SWORDS = { reed_rapier: drawReedRapier, drift_cutlass: drawDriftCutlass, coral_saber: drawCoralSaber, tide_claw: drawTideClaw, ...DEEP_SWORDS, ...CANOPY_SWORDS, ...WRECK_SWORDS, ...THORN_SWORDS, ...SPINE_SWORDS, ...GLACIER_SWORDS, ...SKERRIES_SWORDS, ...HEIGHTS_SWORDS, ...BLUEHALLS_SWORDS, ...QBRIDGE_SWORDS, ...FORGE_SWORDS, ...SUNKEN_SWORDS, ...OLDICE_SWORDS, ...LADON_SWORDS, ...FENRIR_SWORDS };
const BRANCH_HELMETS = { lily_hat: drawLilyHat, miller_cap: drawMillerCap, snail_helm: drawSnailHelm, snapjaw_shell: drawSnapjawShell, conch_helm: drawConchHelm, hoard_crown: drawHoardCrown, ...DEEP_HELMETS, ...CANOPY_HELMETS, ...WRECK_HELMETS, ...THORN_HELMETS, ...SPINE_HELMETS, ...GLACIER_HELMETS, ...SKERRIES_HELMETS, ...HEIGHTS_HELMETS, ...BLUEHALLS_HELMETS, ...QBRIDGE_HELMETS, ...FORGE_HELMETS, ...SUNKEN_HELMETS, ...OLDICE_HELMETS, ...LADON_HELMETS, ...FENRIR_HELMETS };
import { PET_ICONS } from './pet-art.js';
const BRANCH_ICONS = { ...WILLOW_ICONS, ...COVES_ICONS, ...DEEP_ICONS, ...CANOPY_ICONS, ...WRECK_ICONS, ...THORN_ICONS, ...SPINE_ICONS, ...GLACIER_ICONS, ...SKERRIES_ICONS, ...HEIGHTS_ICONS, ...BLUEHALLS_ICONS, ...QBRIDGE_ICONS, ...FORGE_ICONS, ...PET_ICONS, ...SUNKEN_ICONS, ...OLDICE_ICONS }; // (and pet food)

const INK = '#5b4a6b';
const FLOWER_COLORS = ['#ffb3c7', '#fff1a8', '#c9b6ff', '#ffffff', '#ffd1a1'];
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
// How far into the grove / the woods a world x is (0..1), with soft 300px crossfades at the borders
const B1 = ZONES[1].x0, B2 = ZONES[2].x0;
const groveK = (x) => smooth(B1 - 150, B1 + 150, x) * (1 - smooth(B2 - 150, B2 + 150, x));
const woodsK = (x) => smooth(B2 - 150, B2 + 150, x);
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// A little arrow drawn as a path (unicode arrows aren't in every font)
function arrow(ctx, x, y, dir, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(6, 0);
  ctx.moveTo(1, -5);
  ctx.lineTo(6, 0);
  ctx.lineTo(1, 5);
  ctx.stroke();
  ctx.restore();
}

// ——— seeded scenery ———

const zoneOf = (x) => (x < B1 ? 0 : x < B2 ? 1 : 2);

const groundDeco = (() => {
  const r = mulberry32(51);
  const out = [];
  for (let x = 150; x < FIELD_W - 20; x += 22 + r() * 40) {
    const z = zoneOf(x), k = r(), s = 0.8 + r() * 0.5;
    if (z === 0) {
      if (k < 0.4) out.push({ type: 'tuft', x, s, z });
      else if (k < 0.85) out.push({ type: 'flower', x, s, z, color: FLOWER_COLORS[Math.floor(r() * 5)] });
      else out.push({ type: 'clover', x, s, z });
    } else if (z === 1) {
      if (k < 0.4) out.push({ type: 'tuft', x, s, z });
      else if (k < 0.75) out.push({ type: 'shroom', x, s, z, hue: [330, 20, 270, 190][Math.floor(r() * 4)], p: r() * TAU });
      else out.push({ type: 'fern', x, s, z });
    } else {
      if (k < 0.4) out.push({ type: 'tuft', x, s, z });
      else if (k < 0.7) out.push({ type: 'sprig', x, s, z, p: r() * TAU });
      else if (k < 0.88) out.push({ type: 'berries', x, s, z });
      else out.push({ type: 'rock', x, s, z });
    }
  }
  return out;
})();
const pebbles = (() => {
  const r = mulberry32(53);
  return Array.from({ length: FIELD_W / 30 }, () => ({ x: r() * FIELD_W, dy: 30 + r() * (H - FIELD_GROUND - 30), r: 2 + r() * 3 }));
})();

// Big scenery standing on the ground (world speed, behind everything)
const meadowTrees = [[330, 1.0, 0], [760, 0.85, 1], [1130, 1.1, 2], [1480, 0.9, 0]].map(([x, s, c]) => ({ x, s, c }));
const meadowBushes = [180, 560, 990, 1340].map((x, i) => ({ x, s: 0.8 + (i % 2) * 0.3 }));
const giantShrooms = (() => {
  const r = mulberry32(61);
  const hues = [[352, 85, 80], [24, 90, 78], [280, 60, 80], [190, 55, 72]];
  return [1700, 1980, 2220, 2520, 2700, 2980, 3150].map((x, i) => {
    const [hu, sa, li] = hues[i % hues.length];
    return { x: x + (r() - 0.5) * 60, stem: 120 + r() * 140, cap: 70 + r() * 60, hue: hu, sat: sa, lit: li, tilt: (r() - 0.5) * 0.12, spots: Array.from({ length: 5 }, () => [r() * 1.6 - 0.8, r() * 0.7 + 0.15, 0.08 + r() * 0.08]) };
  });
})();
const woodTrunks = (() => {
  const r = mulberry32(67);
  return [3240, 3460, 3780, 4080, 4420, 4650].map((x) => ({ x: x + (r() - 0.5) * 40, w: 46 + r() * 30, lean: (r() - 0.5) * 0.05 }));
})();
const brambleArcs = (() => {
  const r = mulberry32(71);
  const out = [];
  for (let x = 3300; x < FIELD_W - 60; x += 140 + r() * 120) out.push({ x, w: 90 + r() * 80, h: 40 + r() * 50, p: r() * TAU });
  return out;
})();
// The far layer: silhouettes drifting at half speed. Their apparent world x shifts with the camera,
// so each fades in only while it appears over its own zone.
const FAR_F = 0.5;
const farBits = (() => {
  const r = mulberry32(73);
  const out = [];
  for (let x = -200; x < FIELD_W * (1 - FAR_F) + 1200; x += 90 + r() * 110) {
    out.push({ x, s: 0.7 + r() * 0.6, k: r(), h: r() });
  }
  return out;
})();
const motes = (() => {
  const r = mulberry32(79);
  return Array.from({ length: 90 }, () => ({ x: B1 + r() * (FIELD_W - B1), y: 140 + r() * 290, p: r() * TAU, s: 0.6 + r() * 0.8 }));
})();
const butterflies = [[260, 360], [700, 300], [1050, 380], [1420, 330]].map(([x, y], i) => ({ x, y, p: i * 1.7, c: ['#ffb3c7', '#fff1a8', '#c9b6ff', '#9fd8ff'][i] }));

const platBits = FIELD_PLATFORMS.map((p, i) => {
  const r = mulberry32(300 + i);
  return {
    vines: Array.from({ length: 2 + Math.floor(r() * 2) }, () => ({ x: p.x + 20 + r() * (p.w - 40), len: 18 + r() * 26, p: r() * TAU })),
    tufts: Array.from({ length: Math.floor(p.w / 45) }, () => ({ x: p.x + 14 + r() * (p.w - 28), s: 0.7 + r() * 0.4, flower: r() < 0.4, color: FLOWER_COLORS[Math.floor(r() * 5)] })),
    shrooms: Array.from({ length: 2 }, () => ({ x: p.x + 20 + r() * (p.w - 40), s: 0.7 + r() * 0.5, hue: [352, 24, 280][Math.floor(r() * 3)] })),
    side: i % 2 ? 1 : -1, // which end of a branch its tree trunk is at
    leaves: Array.from({ length: 4 }, () => ({ x: p.x + r() * p.w, dy: -6 - r() * 14, r: 10 + r() * 10 })),
  };
});

// ——— colours by zone ———
const PAL = [
  { dirt: '#d4a77a', dirtDark: '#c4946a', pebble: '#b38259', grass: '#7fd06e', grassLight: '#a3e48d', tuft: '#5fb85a' },
  { dirt: '#b99482', dirtDark: '#a68272', pebble: '#93705f', grass: '#6cbf93', grassLight: '#93dbb2', tuft: '#4f9f7c' },
  { dirt: '#8f7068', dirtDark: '#7c5f59', pebble: '#6a4f4c', grass: '#6a9a62', grassLight: '#8ab57c', tuft: '#4f7a4c' },
];
const gradCache = new WeakMap();
function zoneGradient(ctx, key) {
  let c = gradCache.get(ctx);
  if (!c) gradCache.set(ctx, (c = {}));
  if (!c[key]) {
    const g = ctx.createLinearGradient(0, 0, FIELD_W, 0);
    const at = (x) => clamp(x / FIELD_W, 0, 1);
    g.addColorStop(0, PAL[0][key]);
    g.addColorStop(at(B1 - 150), PAL[0][key]);
    g.addColorStop(at(B1 + 150), PAL[1][key]);
    g.addColorStop(at(B2 - 150), PAL[1][key]);
    g.addColorStop(at(B2 + 150), PAL[2][key]);
    g.addColorStop(1, PAL[2][key]);
    c[key] = g;
  }
  return c[key];
}
function shadeGradient(ctx) {
  let c = gradCache.get(ctx);
  if (!c) gradCache.set(ctx, (c = {}));
  if (!c.shade) {
    const g = ctx.createLinearGradient(0, 0, FIELD_W, 0);
    const at = (x) => clamp(x / FIELD_W, 0, 1);
    g.addColorStop(0, 'rgba(70,50,120,0)');
    g.addColorStop(at(B1 - 200), 'rgba(70,50,120,0)');
    g.addColorStop(at(B1 + 200), 'rgba(70,50,130,0.2)');
    g.addColorStop(at(B2 - 200), 'rgba(70,50,130,0.2)');
    g.addColorStop(at(B2 + 200), 'rgba(40,25,60,0.36)');
    g.addColorStop(1, 'rgba(40,25,60,0.4)');
    c.shade = g;
  }
  return c.shade;
}

// ——— the field ———

export function drawField(ctx, camX, viewW, time) {
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  drawFar(ctx, camX, viewW, time);
  // the grove and the woods sit in shade: a wash over the sky and the far layer
  ctx.fillStyle = shadeGradient(ctx);
  ctx.fillRect(Math.max(0, L), 0, Math.min(FIELD_W, R) - Math.max(0, L), H);
  if (visible(B1 - 200, B2 + 200, L, R)) drawLightShafts(ctx, L, R, time);

  for (const t of meadowTrees) if (visible(t.x - 110, t.x + 110, L, R)) drawMeadowTree(ctx, t, time);
  for (const b of meadowBushes) if (visible(b.x - 50, b.x + 50, L, R)) drawBush(ctx, b.x, FIELD_GROUND, b.s);
  for (const m of giantShrooms) if (visible(m.x - m.cap - 10, m.x + m.cap + 10, L, R)) drawGiantShroom(ctx, m, time);
  for (const t of woodTrunks) if (visible(t.x - 90, t.x + 90, L, R)) drawTrunk(ctx, t.x, t.w, t.lean, true);
  FIELD_PLATFORMS.forEach((p, i) => {
    if (p.kind !== 'branch') return;
    const tx = platBits[i].side < 0 ? p.x - 10 : p.x + p.w + 10;
    if (visible(tx - 70, tx + 70, L, R)) drawTrunk(ctx, tx, 54, 0, false);
  });
  for (const a of brambleArcs) if (visible(a.x - 20, a.x + a.w + 20, L, R)) drawBrambleArc(ctx, a, time);
  if (visible(FIELD_W - 120, FIELD_W + 10, L, R)) drawEastEdge(ctx, time);

  drawGround(ctx, Math.max(0, L), Math.min(FIELD_W, R), time);
  ZONES.forEach((z, i) => {
    const sx = i === 0 ? 210 : z.x0 + 70;
    if (visible(sx - 80, sx + 80, L, R)) drawZoneSign(ctx, sx, z, i, time);
  });
  if (visible(FIELD_EXIT_X - 90, FIELD_EXIT_X + 90, L, R)) drawArch(ctx, FIELD_EXIT_X, FIELD_GROUND, time, { label: 'Slimeville', dir: -1, zone: 0 });

  FIELD_PLATFORMS.forEach((p, i) => {
    if (!visible(p.x - 80, p.x + p.w + 80, L, R)) return;
    if (p.kind === 'island') drawIsland(ctx, p, platBits[i], time);
    else if (p.kind === 'log') drawLog(ctx, p, platBits[i], time);
    else drawBranch(ctx, p, platBits[i], time);
  });

  if (visible(0, B1 + 100, L, R)) drawButterflies(ctx, L, R, time);
  if (visible(B1 - 100, FIELD_W, L, R)) drawMotes(ctx, L, R, time);
  ctx.restore();
}

function drawFar(ctx, camX, viewW, time) {
  const off = camX * FAR_F;
  for (const b of farBits) {
    const ax = b.x + off; // apparent world x
    if (ax < camX - 160 || ax > camX + viewW + 160) continue;
    const gk = groveK(ax), wk = woodsK(ax);
    if (gk < 0.02 && wk < 0.02) continue;
    const base = FIELD_GROUND - 18;
    if (gk > 0.02) {
      ctx.globalAlpha = gk;
      ctx.fillStyle = mix('#b8a6d6', '#c9b3d9', b.h);
      const st = 110 + b.k * 120, cr = 40 + b.s * 40;
      ctx.beginPath();
      ctx.roundRect(ax - 7 * b.s, base - st, 14 * b.s, st, 6);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(ax, base - st + 4, cr, cr * 0.55, 0, Math.PI, 0);
      ctx.quadraticCurveTo(ax, base - st + 18, ax - cr, base - st + 4);
      ctx.fill();
    }
    if (wk > 0.02) {
      ctx.globalAlpha = wk;
      ctx.fillStyle = mix('#7e6a8a', '#8a7090', b.h);
      const tw = 22 + b.s * 20;
      ctx.beginPath();
      ctx.moveTo(ax - tw * 0.9, base + 4);
      ctx.quadraticCurveTo(ax - tw * 0.5, base - 10, ax - tw * 0.5, base - 60);
      ctx.lineTo(ax - tw * 0.4, 0);
      ctx.lineTo(ax + tw * 0.4, 0);
      ctx.lineTo(ax + tw * 0.5, base - 60);
      ctx.quadraticCurveTo(ax + tw * 0.5, base - 10, ax + tw * 0.9, base + 4);
      ctx.fill();
      // a dark canopy blob near the top
      ctx.fillStyle = mix('#8a7a9a', '#7e7090', b.h);
      circle(ctx, ax - 30 * b.s, 30 + b.k * 40, 50 * b.s);
      circle(ctx, ax + 34 * b.s, 10 + b.h * 40, 56 * b.s);
    }
  }
  ctx.globalAlpha = 1;
  // soft ground haze where the far layer meets the field
  const g = ctx.createLinearGradient(0, FIELD_GROUND - 120, 0, FIELD_GROUND);
  g.addColorStop(0, 'rgba(230,220,255,0)');
  g.addColorStop(1, 'rgba(230,220,255,0.35)');
  ctx.fillStyle = g;
  const x0 = Math.max(B1 - 200, camX - 80), x1 = Math.min(FIELD_W, camX + viewW + 80);
  if (x1 > x0) ctx.fillRect(x0, FIELD_GROUND - 120, x1 - x0, 120);
}

function drawLightShafts(ctx, L, R, time) {
  for (const [x, w] of [[1820, 70], [2140, 40], [2460, 90], [2860, 50]]) {
    if (!visible(x - 300, x + w + 50, L, R)) continue;
    const a = 0.09 + 0.03 * Math.sin(time * 0.7 + x);
    ctx.fillStyle = `rgba(255,250,215,${a})`;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + w, 0);
    ctx.lineTo(x + w - 180, FIELD_GROUND);
    ctx.lineTo(x - 180, FIELD_GROUND);
    ctx.closePath();
    ctx.fill();
  }
}

// ——— ground ———

function drawGround(ctx, L, R, time) {
  const y = FIELD_GROUND;
  ctx.fillStyle = zoneGradient(ctx, 'dirt');
  ctx.fillRect(L, y, R - L, H - y + 10);
  ctx.fillStyle = zoneGradient(ctx, 'dirtDark');
  ctx.fillRect(L, y + 50, R - L, H - y);
  ctx.fillStyle = zoneGradient(ctx, 'pebble');
  ctx.beginPath();
  for (const p of pebbles) {
    if (p.x < L || p.x > R) continue;
    ctx.moveTo(p.x + p.r * 1.4, y + p.dy);
    ctx.ellipse(p.x, y + p.dy, p.r * 1.4, p.r, 0, 0, TAU);
  }
  ctx.fill();
  // a worn dirt trail through the meadow
  ctx.fillStyle = '#e6c9a2';
  ctx.beginPath();
  for (let x = 40; x < 1500; x += 44) {
    if (x < L - 30 || x > R + 30) continue;
    ctx.moveTo(x + 15, y + 27);
    ctx.ellipse(x + ((x / 44) % 2) * 5, y + 27 + ((x / 44) % 3) * 3, 15, 5, 0, 0, TAU);
  }
  ctx.fill();
  grassCap(ctx, L, R, y, zoneGradient(ctx, 'grass'), zoneGradient(ctx, 'grassLight'));
  for (const d of groundDeco) if (d.x > L - 20 && d.x < R + 20) drawDeco(ctx, d.x, y - 2, d, time);
}

function grassCap(ctx, x0, x1, y, grass, light) {
  ctx.fillStyle = grass;
  ctx.beginPath();
  ctx.roundRect(x0 - 4, y - 4, x1 - x0 + 8, 18, 9);
  ctx.fill();
  ctx.beginPath();
  for (let gx = Math.floor(x0 / 15) * 15 + 6; gx < x1 + 7; gx += 15) {
    ctx.moveTo(gx + 7, y + 12);
    ctx.arc(gx, y + 12, 7, 0, Math.PI);
  }
  ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.roundRect(x0 + 2, y - 4, x1 - x0 - 4, 5, 2.5);
  ctx.fill();
}

function drawDeco(ctx, x, y, d, time) {
  const sway = Math.sin(time * 2 + x * 0.05) * 0.12;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(d.s, d.s);
  const pal = PAL[d.z ?? 0];
  if (d.type === 'tuft') {
    ctx.fillStyle = pal.tuft;
    for (const [ox, h, lean] of [[-5, 10, -0.3], [0, 14, 0], [5, 10, 0.3]]) {
      ctx.save();
      ctx.translate(ox, 0);
      ctx.rotate(lean + sway);
      ctx.beginPath();
      ctx.moveTo(-2.5, 0);
      ctx.lineTo(0, -h);
      ctx.lineTo(2.5, 0);
      ctx.fill();
      ctx.restore();
    }
  } else if (d.type === 'flower') {
    ctx.rotate(sway);
    ctx.strokeStyle = '#5fb85a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -16);
    ctx.stroke();
    ctx.fillStyle = d.color;
    for (let i = 0; i < 5; i++) {
      const a = (i * TAU) / 5;
      circle(ctx, Math.cos(a) * 4, -16 + Math.sin(a) * 4, 3.2);
    }
    ctx.fillStyle = '#ffcf4d';
    circle(ctx, 0, -16, 2.5);
  } else if (d.type === 'clover') {
    ctx.fillStyle = '#6cc96a';
    for (const a of [-2.2, -1.57, -0.9]) ellipse(ctx, Math.cos(a) * 4, -6 + Math.sin(a) * 4, 3.4, 3.4);
    ctx.strokeStyle = '#5fb85a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -6);
    ctx.stroke();
  } else if (d.type === 'shroom') {
    // a little glowing grove mushroom
    const glow = 0.25 + 0.12 * Math.sin(time * 1.8 + d.p);
    const gl = ctx.createRadialGradient(0, -8, 1, 0, -8, 18);
    gl.addColorStop(0, `hsla(${d.hue} 100% 85% / ${glow})`);
    gl.addColorStop(1, `hsla(${d.hue} 100% 85% / 0)`);
    ctx.fillStyle = gl;
    ctx.fillRect(-18, -26, 36, 36);
    ctx.fillStyle = '#fff4e6';
    ctx.beginPath();
    ctx.roundRect(-2.5, -9, 5, 9, 2);
    ctx.fill();
    ctx.fillStyle = `hsl(${d.hue} 85% 78%)`;
    ctx.beginPath();
    ctx.arc(0, -8, 7, Math.PI, 0);
    ctx.quadraticCurveTo(0, -5, -7, -8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    circle(ctx, -2.5, -11, 1.3);
    circle(ctx, 2.5, -12, 1);
  } else if (d.type === 'fern') {
    ctx.strokeStyle = '#4f9f7c';
    ctx.fillStyle = '#5fb38a';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate(side * 0.5 + sway);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(side * 4, -10, side * 2, -20);
      ctx.stroke();
      for (let k = 1; k <= 4; k++) ellipse(ctx, side * (3 + k * 0.2), -k * 4.5, 3.4 - k * 0.4, 1.6, side * 0.5);
      ctx.restore();
    }
  } else if (d.type === 'sprig') {
    // a little thorny sprig
    ctx.rotate(sway * 0.5);
    ctx.strokeStyle = '#6e4a5e';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-4, -8, 2, -16);
    ctx.stroke();
    ctx.fillStyle = '#6e4a5e';
    for (const [tx, ty, dir] of [[-2, -6, -1], [1, -11, 1], [1.5, -15, -1]]) {
      ctx.beginPath();
      ctx.moveTo(tx, ty - 1.5);
      ctx.lineTo(tx + dir * 4, ty - 2.5);
      ctx.lineTo(tx, ty + 1.5);
      ctx.fill();
    }
    ctx.fillStyle = '#7a9a5a';
    ellipse(ctx, 4, -15, 3.5, 1.8, -0.5);
  } else if (d.type === 'berries') {
    ctx.fillStyle = '#4f7a4c';
    ellipse(ctx, -4, -5, 6, 4, -0.3);
    ellipse(ctx, 4, -6, 6, 4, 0.3);
    ctx.fillStyle = '#e8506a';
    for (const [bx, by] of [[-3, -9], [1, -11], [4, -8]]) circle(ctx, bx, by, 2.6);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    circle(ctx, 0.3, -11.8, 0.9);
  } else {
    ctx.fillStyle = '#9c8a96';
    ctx.beginPath();
    ctx.ellipse(0, -3, 9, 6, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#b3a4ae';
    ellipse(ctx, -3, -6, 3.5, 1.8, -0.3);
    ctx.fillStyle = '#7a9a5a';
    ellipse(ctx, 5, -6, 3, 1.5, 0.4);
  }
  ctx.restore();
}

// ——— meadow ———

function drawMeadowTree(ctx, t, time) {
  const { x, s } = t, base = FIELD_GROUND;
  const greens = [['#7cc79a', '#9bd8b0'], ['#8fd07e', '#b0e39b'], ['#79c2a6', '#9fdcc0']][t.c];
  ctx.fillStyle = '#a0806a';
  ctx.beginPath();
  ctx.moveTo(x - 22 * s, base + 3);
  ctx.quadraticCurveTo(x - 9 * s, base - 8, x - 9 * s, base - 50 * s);
  ctx.lineTo(x - 7 * s, base - 120 * s);
  ctx.lineTo(x + 7 * s, base - 120 * s);
  ctx.lineTo(x + 9 * s, base - 50 * s);
  ctx.quadraticCurveTo(x + 9 * s, base - 8, x + 22 * s, base + 3);
  ctx.fill();
  const bob = Math.sin(time * 0.9 + x) * 1.5;
  ctx.fillStyle = greens[0];
  circle(ctx, x - 34 * s, base - 140 * s, 38 * s);
  circle(ctx, x + 36 * s, base - 136 * s, 36 * s);
  circle(ctx, x, base - 172 * s + bob, 52 * s);
  ctx.fillStyle = greens[1];
  circle(ctx, x - 18 * s, base - 192 * s + bob, 20 * s);
  circle(ctx, x + 30 * s, base - 150 * s, 10 * s);
  // a few pink blossoms
  ctx.fillStyle = '#ffc3d4';
  for (const [bx, by] of [[-40, -150], [20, -190], [44, -130], [-8, -150]]) circle(ctx, x + bx * s, base + by * s + bob * 0.5, 4.5 * s);
}

function drawBush(ctx, x, base, s) {
  ctx.fillStyle = '#6fbf72';
  circle(ctx, x - 20 * s, base - 12 * s, 18 * s);
  circle(ctx, x + 18 * s, base - 12 * s, 17 * s);
  circle(ctx, x, base - 22 * s, 22 * s);
  ctx.fillStyle = '#93d68d';
  circle(ctx, x - 8 * s, base - 32 * s, 8 * s);
  ctx.fillStyle = '#ff9fb8';
  for (const [bx, by] of [[-22, -18], [8, -30], [22, -14]]) circle(ctx, x + bx * s, base + by * s, 3.2 * s);
}

function drawButterflies(ctx, L, R, time) {
  for (const b of butterflies) {
    const x = b.x + Math.sin(time * 0.4 + b.p) * 90, y = b.y + Math.sin(time * 1.1 + b.p * 2) * 30;
    if (x < L || x > R) continue;
    const flap = Math.abs(Math.sin(time * 12 + b.p));
    ctx.fillStyle = b.c;
    ctx.save();
    ctx.translate(x, y);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 4 * flap, -2, 4.5 * flap + 0.8, 4, side * 0.4, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(side * 3 * flap, 3, 3 * flap + 0.6, 2.6, -side * 0.4, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = INK;
    ellipse(ctx, 0, 0, 1, 4);
    ctx.restore();
  }
}

// ——— grove ———

function drawGiantShroom(ctx, m, time) {
  const base = FIELD_GROUND, top = base - m.stem;
  const cap = `hsl(${m.hue} ${m.sat}% ${m.lit}%)`, capDark = `hsl(${m.hue} ${m.sat - 15}% ${m.lit - 12}%)`;
  ctx.save();
  ctx.translate(m.x, base);
  ctx.rotate(m.tilt);
  // stem, slightly bulging, with a skirt ring
  ctx.fillStyle = '#f6eadf';
  ctx.beginPath();
  ctx.moveTo(-20, 2);
  ctx.bezierCurveTo(-26, -m.stem * 0.3, -10, -m.stem * 0.7, -12, -m.stem);
  ctx.lineTo(12, -m.stem);
  ctx.bezierCurveTo(10, -m.stem * 0.7, 26, -m.stem * 0.3, 20, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(160,130,150,0.18)';
  ctx.fillRect(2, -m.stem, 9, m.stem);
  ctx.fillStyle = '#ede0d6';
  ctx.beginPath();
  ctx.ellipse(0, -m.stem * 0.72, 17, 6, 0, 0, Math.PI);
  ctx.fill();
  // gills under the cap
  ctx.fillStyle = mix('#f0d8d0', '#c9b6d9', 0.3);
  ctx.beginPath();
  ctx.ellipse(0, -m.stem + 2, m.cap * 0.92, 12, 0, 0, Math.PI);
  ctx.fill();
  // cap
  ctx.fillStyle = capDark;
  ctx.beginPath();
  ctx.moveTo(-m.cap, -m.stem + 4);
  ctx.bezierCurveTo(-m.cap, -m.stem - m.cap * 0.95, m.cap, -m.stem - m.cap * 0.95, m.cap, -m.stem + 4);
  ctx.quadraticCurveTo(0, -m.stem + 14, -m.cap, -m.stem + 4);
  ctx.fill();
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.moveTo(-m.cap + 6, -m.stem);
  ctx.bezierCurveTo(-m.cap + 6, -m.stem - m.cap * 0.88, m.cap - 6, -m.stem - m.cap * 0.88, m.cap - 6, -m.stem);
  ctx.quadraticCurveTo(0, -m.stem + 6, -m.cap + 6, -m.stem);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [sx, sy, r] of m.spots) ellipse(ctx, sx * m.cap * 0.75, -m.stem - sy * m.cap * 0.62, r * m.cap, r * m.cap * 0.75);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ellipse(ctx, -m.cap * 0.4, -m.stem - m.cap * 0.45, m.cap * 0.25, m.cap * 0.1, -0.5);
  ctx.restore();
  void time;
}

function drawMotes(ctx, L, R, time) {
  for (const m of motes) {
    const x = m.x + Math.sin(time * 0.5 + m.p) * 26, y = m.y + Math.sin(time * 0.8 + m.p * 1.7) * 18;
    if (x < L || x > R) continue;
    const a = 0.35 + 0.35 * Math.sin(time * 2.2 + m.p * 3);
    if (a < 0.05) continue;
    const woods = x > B2;
    ctx.fillStyle = woods ? `rgba(255,236,150,${a * 0.5})` : `rgba(255,240,255,${a * 0.45})`;
    circle(ctx, x, y, 5 * m.s);
    ctx.fillStyle = woods ? `rgba(255,246,190,${a})` : `rgba(255,255,255,${a})`;
    circle(ctx, x, y, 1.8 * m.s);
  }
}

// ——— woods ———

function drawTrunk(ctx, x, w, lean, roots) {
  const base = FIELD_GROUND;
  ctx.save();
  ctx.translate(x, base);
  ctx.rotate(lean);
  ctx.fillStyle = '#6e5560';
  ctx.beginPath();
  if (roots) {
    ctx.moveTo(-w * 1.1, 4);
    ctx.quadraticCurveTo(-w * 0.5, -6, -w * 0.5, -60);
  } else {
    ctx.moveTo(-w * 0.5, 4);
  }
  ctx.lineTo(-w * 0.42, -base - 10);
  ctx.lineTo(w * 0.42, -base - 10);
  ctx.lineTo(w * 0.5, roots ? -60 : 4);
  if (roots) ctx.quadraticCurveTo(w * 0.5, -6, w * 1.1, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5c4651';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.15, -30);
  ctx.quadraticCurveTo(-w * 0.25, -160, -w * 0.12, -320);
  ctx.moveTo(w * 0.2, -90);
  ctx.quadraticCurveTo(w * 0.26, -220, w * 0.16, -400);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(-w * 0.4, -base, w * 0.18, base - 20);
  // a knot hole and a patch of moss
  ctx.fillStyle = '#4a3842';
  ellipse(ctx, w * 0.05, -150, 7, 10);
  ctx.fillStyle = '#7a9a5a';
  ellipse(ctx, -w * 0.3, -40, 10, 5, 0.3);
  ellipse(ctx, -w * 0.18, -44, 7, 4);
  ctx.restore();
}

// Thorny bramble vines arching out of the ground
function drawBrambleArc(ctx, a, time) {
  const base = FIELD_GROUND + 2, sway = Math.sin(time * 0.8 + a.p) * 2;
  const pt = (t) => {
    const x = a.x + a.w * t;
    return [x, base - Math.sin(t * Math.PI) * a.h + Math.sin(t * Math.PI) * sway];
  };
  ctx.strokeStyle = '#7a4f66';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let t = 0; t <= 1.0001; t += 0.1) {
    const [x, y] = pt(t);
    t ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = '#94647e';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = '#6a4258';
  for (let i = 1; i < 10; i++) {
    const t = i / 10, [x, y] = pt(t), up = i % 2 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x + 1, y + up * 8);
    ctx.lineTo(x + 3, y);
    ctx.fill();
  }
  ctx.fillStyle = '#7a9a5a';
  for (const t of [0.25, 0.7]) {
    const [x, y] = pt(t);
    ellipse(ctx, x + 5, y - 4, 6, 3, -0.5);
  }
  const [rx, ry] = pt(0.5);
  ctx.fillStyle = '#e8506a';
  circle(ctx, rx - 3, ry + 5, 3);
  circle(ctx, rx + 3, ry + 6, 3);
}

// A tangled wall of bramble at the end of the field
function drawEastEdge(ctx, time) {
  const x = FIELD_W, base = FIELD_GROUND;
  ctx.fillStyle = '#5e4a56';
  ctx.beginPath();
  ctx.roundRect(x - 60, 0, 70, base + 10, [0, 0, 0, 0]);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    drawBrambleArc(ctx, { x: x - 110 + i * 8, w: 120, h: 80 + i * 40, p: i }, time);
  }
}

// ——— platforms ———

function drawIsland(ctx, p, bits, time) {
  const { x, y, w } = p;
  ctx.fillStyle = '#d4a77a';
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 4);
  ctx.bezierCurveTo(x + w * 0.05, y + 40, x + w * 0.3, y + 58, x + w * 0.5, y + 62);
  ctx.bezierCurveTo(x + w * 0.7, y + 58, x + w * 0.95, y + 40, x + w + 2, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c4946a';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y + 26);
  ctx.bezierCurveTo(x + w * 0.3, y + 50, x + w * 0.4, y + 54, x + w * 0.5, y + 56);
  ctx.bezierCurveTo(x + w * 0.62, y + 52, x + w * 0.75, y + 44, x + w * 0.85, y + 26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b38259';
  ellipse(ctx, x + w * 0.35, y + 30, 5, 3.5);
  ellipse(ctx, x + w * 0.62, y + 40, 4, 3);
  ctx.strokeStyle = '#5fb85a';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const v of bits.vines) {
    const sway = Math.sin(time * 1.6 + v.p) * 3;
    const depth = y + 18 + (1 - Math.abs(v.x - (x + w / 2)) / (w / 2)) * 30;
    ctx.beginPath();
    ctx.moveTo(v.x, y + 10);
    ctx.quadraticCurveTo(v.x + sway, depth, v.x + sway * 1.5, depth + v.len);
    ctx.stroke();
    ctx.fillStyle = '#6cc96a';
    ellipse(ctx, v.x + sway * 1.5 + 3, depth + v.len, 4, 2.2, 0.5);
  }
  grassCap(ctx, x, x + w, y, PAL[0].grass, PAL[0].grassLight);
  for (const t of bits.tufts) drawDeco(ctx, t.x, y - 2, t.flower ? { type: 'flower', s: t.s, color: t.color, z: 0 } : { type: 'tuft', s: t.s, z: 0 }, time);
}

// A mossy fallen log floating in the grove, mushrooms sprouting on top and moss dangling below
function drawLog(ctx, p, bits, time) {
  const { x, y, w } = p, th = 28;
  // dangling moss
  ctx.strokeStyle = '#6cae84';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (const v of bits.vines) {
    const sway = Math.sin(time * 1.4 + v.p) * 3;
    ctx.beginPath();
    ctx.moveTo(v.x, y + th - 4);
    ctx.quadraticCurveTo(v.x + sway, y + th + v.len * 0.6, v.x + sway * 1.4, y + th + v.len);
    ctx.stroke();
    ctx.fillStyle = '#86c49b';
    circle(ctx, v.x + sway * 1.4, y + th + v.len, 3);
  }
  // bark body
  ctx.fillStyle = '#9b7462';
  ctx.beginPath();
  ctx.roundRect(x, y - 2, w, th, th / 2);
  ctx.fill();
  ctx.fillStyle = '#87604f';
  ctx.beginPath();
  ctx.roundRect(x + 4, y + th * 0.55, w - 8, th * 0.42, [0, 0, th / 2, th / 2]);
  ctx.fill();
  ctx.strokeStyle = '#7a5545';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let bx = x + 26; bx < x + w - 24; bx += 34) {
    ctx.moveTo(bx, y + 6);
    ctx.quadraticCurveTo(bx + 8, y + 12, bx + 18, y + 10);
    ctx.moveTo(bx + 10, y + 18);
    ctx.lineTo(bx + 24, y + 19);
  }
  ctx.stroke();
  // cut end with tree rings (facing us on the right)
  const ex = x + w - th / 2, ey = y + th / 2 - 2;
  ctx.fillStyle = '#e8c9a0';
  ellipse(ctx, ex, ey, th * 0.38, th / 2 - 1);
  ctx.strokeStyle = '#c9a07a';
  ctx.lineWidth = 1.4;
  for (const r of [0.75, 0.5, 0.25]) {
    ctx.beginPath();
    ctx.ellipse(ex, ey, th * 0.38 * r, (th / 2 - 1) * r, 0, 0, TAU);
    ctx.stroke();
  }
  // moss blanket on top
  ctx.fillStyle = '#6cbf93';
  ctx.beginPath();
  ctx.roundRect(x + 8, y - 5, w - th - 8, 8, 4);
  ctx.fill();
  ctx.beginPath();
  for (let mx = x + 14; mx < x + w - th; mx += 13) {
    ctx.moveTo(mx + 6, y + 2);
    ctx.arc(mx, y + 2, 6, 0, Math.PI);
  }
  ctx.fill();
  ctx.fillStyle = '#93dbb2';
  ctx.beginPath();
  ctx.roundRect(x + 12, y - 5, w - th - 16, 3, 1.5);
  ctx.fill();
  for (const s of bits.shrooms) {
    ctx.save();
    ctx.translate(s.x, y - 2);
    ctx.scale(s.s, s.s);
    ctx.fillStyle = '#fff4e6';
    ctx.beginPath();
    ctx.roundRect(-2.5, -9, 5, 9, 2);
    ctx.fill();
    ctx.fillStyle = `hsl(${s.hue} 85% 76%)`;
    ctx.beginPath();
    ctx.arc(0, -8, 7.5, Math.PI, 0);
    ctx.quadraticCurveTo(0, -5, -7.5, -8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    circle(ctx, -2.5, -11, 1.4);
    circle(ctx, 3, -12, 1.1);
    ctx.restore();
  }
}

// A thick gnarled branch reaching out from a woods tree trunk, with leaf clumps and thorns underneath
function drawBranch(ctx, p, bits, time) {
  const { x, y, w } = p, th = 20, side = bits.side;
  const root = side < 0 ? x - 10 : x + w + 10, tip = side < 0 ? x + w + 6 : x - 6;
  // thorns hanging under
  ctx.fillStyle = '#5e3a50';
  for (let tx = x + 16; tx < x + w - 10; tx += 22) {
    ctx.beginPath();
    ctx.moveTo(tx - 4, y + th - 4);
    ctx.lineTo(tx, y + th + 7);
    ctx.lineTo(tx + 4, y + th - 4);
    ctx.fill();
  }
  ctx.fillStyle = '#7a5e68';
  ctx.beginPath();
  ctx.moveTo(root, y - 16);
  ctx.quadraticCurveTo((root + tip) / 2, y - 6, tip, y - 2);
  ctx.quadraticCurveTo(tip + side * -2 + (side < 0 ? 8 : -8), y + 6, tip, y + 12);
  ctx.quadraticCurveTo((root + tip) / 2, y + th + 4, root, y + th + 26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8c707a';
  ctx.beginPath();
  ctx.moveTo(root, y - 12);
  ctx.quadraticCurveTo((root + tip) / 2, y - 3, tip, y + 1);
  ctx.lineTo(tip, y + 5);
  ctx.quadraticCurveTo((root + tip) / 2, y + 2, root, y - 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#674c58';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let bx = x + 20; bx < x + w - 20; bx += 40) {
    ctx.moveTo(bx, y + 8);
    ctx.quadraticCurveTo(bx + 10, y + 11, bx + 22, y + 9);
  }
  ctx.stroke();
  // a mossy walking surface
  ctx.fillStyle = '#6a9a62';
  ctx.beginPath();
  ctx.roundRect(x + 4, y - 4, w - 8, 6, 3);
  ctx.fill();
  ctx.fillStyle = '#8ab57c';
  ctx.beginPath();
  ctx.roundRect(x + 10, y - 4, w - 20, 2.5, 1.2);
  ctx.fill();
  // leaf clumps along the top (behind slimes, small so they don't hide feet)
  for (const l of bits.leaves) {
    const s = Math.sin(time * 1.2 + l.x) * 1.2;
    ctx.fillStyle = '#5e8a58';
    circle(ctx, l.x, y - 2 + l.dy * 0.2 + s, l.r * 0.55);
    ctx.fillStyle = '#7aa86c';
    circle(ctx, l.x - 3, y - 4 + l.dy * 0.2 + s, l.r * 0.3);
  }
  // a little curl of new growth at the tip
  ctx.strokeStyle = '#7a9a5a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(tip + (side < 0 ? 4 : -4), y - 6, 5, Math.PI * 0.5, Math.PI * 1.8);
  ctx.stroke();
}

// ——— signs and gates ———

function drawZoneSign(ctx, x, z, i, time) {
  const base = FIELD_GROUND;
  const boards = ['#c99b6b', '#b98fa0', '#8c707a'], edges = ['#8f6240', '#8a6274', '#5e4a56'];
  ctx.fillStyle = edges[i];
  ctx.beginPath();
  ctx.roundRect(x - 4, base - 92, 8, 94, 3);
  ctx.fill();
  const swing = Math.sin(time * 1.1 + i) * 0.02;
  ctx.save();
  ctx.translate(x, base - 70);
  ctx.rotate(swing);
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(110, ctx.measureText(z.name).width + 28);
  ctx.fillStyle = boards[i];
  ctx.strokeStyle = edges[i];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -24, tw, 46, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -10, 15, '#fffaf0');
  // level pill
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-30, 2, 60, 15, 7.5);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 10, 11, ['#5fa65a', '#b0608a', '#7a3a5a'][i]);
  // a decoration on the top corner for each zone
  if (i === 0) {
    ctx.fillStyle = '#6cc96a';
    ellipse(ctx, tw / 2 - 6, -26, 7, 3.5, -0.5);
    ellipse(ctx, tw / 2 - 16, -27, 6, 3, 0.4);
  } else if (i === 1) {
    ctx.fillStyle = '#fff4e6';
    ctx.fillRect(tw / 2 - 12, -32, 5, 8);
    ctx.fillStyle = '#ff8f9f';
    ctx.beginPath();
    ctx.arc(tw / 2 - 9.5, -31, 8, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff';
    circle(ctx, tw / 2 - 12, -34, 1.4);
  } else {
    ctx.strokeStyle = '#6a4258';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-tw / 2 + 4, -20);
    ctx.quadraticCurveTo(-tw / 2 - 6, -6, -tw / 2 + 2, 12);
    ctx.stroke();
    ctx.fillStyle = '#6a4258';
    for (const [tx, ty] of [[-tw / 2 - 2, -10], [-tw / 2 - 1, 4]]) {
      ctx.beginPath();
      ctx.moveTo(tx, ty - 2);
      ctx.lineTo(tx - 6, ty);
      ctx.lineTo(tx, ty + 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// A wooden arch wrapped in leafy vines, with a hanging sign. Used at both ends of the trip.
function drawArch(ctx, x, base, time, { label, dir, plaque = false, zone = 0 }) {
  const half = 52, top = base - 150;
  // posts
  for (const px of [x - half, x + half]) {
    ctx.fillStyle = '#a0704a';
    ctx.beginPath();
    ctx.roundRect(px - 8, top + 10, 16, base - top - 8, 6);
    ctx.fill();
    ctx.fillStyle = '#b8845a';
    ctx.fillRect(px - 5, top + 16, 4, base - top - 20);
    ctx.fillStyle = '#8f6240';
    ctx.beginPath();
    ctx.roundRect(px - 11, base - 10, 22, 12, 4);
    ctx.fill();
  }
  // curved beam
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - half - 12, top + 18);
  ctx.quadraticCurveTo(x, top - 26, x + half + 12, top + 18);
  ctx.stroke();
  ctx.strokeStyle = '#b07f55';
  ctx.lineWidth = 9;
  ctx.stroke();
  // vines winding up the posts and over the top, with leaves and flowers
  ctx.strokeStyle = '#5fb85a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (const px of [x - half, x + half]) {
    for (let yy = base - 6; yy > top + 14; yy -= 2) {
      const vx = px + Math.sin(yy * 0.12 + px) * 9;
      yy === base - 6 ? ctx.moveTo(vx, yy) : ctx.lineTo(vx, yy);
    }
  }
  ctx.stroke();
  const leaves = [];
  for (const px of [x - half, x + half]) for (let yy = base - 20; yy > top + 20; yy -= 22) leaves.push([px + Math.sin(yy * 0.12 + px) * 9, yy]);
  for (let t = 0.1; t < 0.95; t += 0.12) {
    const bx = x - half - 12 + (2 * half + 24) * t;
    const by = (1 - t) * (1 - t) * (top + 18) + 2 * (1 - t) * t * (top - 26) + t * t * (top + 18);
    leaves.push([bx, by - 4]);
  }
  leaves.forEach(([lx, ly], i) => {
    const s = Math.sin(time * 2 + i) * 0.15;
    ctx.fillStyle = i % 2 ? '#6cc96a' : '#7fd06e';
    ellipse(ctx, lx + (i % 2 ? 5 : -5), ly, 6, 3.2, (i % 2 ? 0.5 : -0.5) + s);
    if (i % 4 === 1) {
      ctx.fillStyle = FLOWER_COLORS[i % 5];
      circle(ctx, lx, ly - 3, 3.4);
      ctx.fillStyle = '#ffcf4d';
      circle(ctx, lx, ly - 3, 1.4);
    }
  });
  // hanging sign
  const swing = Math.sin(time * 1.4 + x) * 0.035;
  ctx.save();
  ctx.translate(x, top + 4);
  ctx.rotate(swing);
  ctx.strokeStyle = '#e8d2a8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(-26, 20);
  ctx.moveTo(26, 0);
  ctx.lineTo(26, 20);
  ctx.stroke();
  ctx.font = "700 14px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = ctx.measureText(label).width + 44;
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = '#c99b6b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, 20, tw, 26, 8);
  ctx.fill();
  ctx.stroke();
  const ax = dir > 0 ? tw / 2 - 14 : -tw / 2 + 14;
  text(ctx, label, -dir * 7, 33.5, 14, INK);
  arrow(ctx, ax, 33, dir, 0.85, '#6cae5a');
  ctx.restore();
  if (plaque) {
    // a little warning plaque on its own stake
    // a little warning plaque nailed to the left post
    const px = x - half;
    ctx.save();
    ctx.translate(px, base - 62);
    ctx.rotate(-0.06);
    ctx.fillStyle = '#fff1a8';
    ctx.strokeStyle = '#e07a6a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-34, -14, 68, 30, 7);
    ctx.fill();
    ctx.stroke();
    text(ctx, 'Danger:', 0, -4, 10, '#c9504a');
    text(ctx, 'mobs!', 0, 8, 10, '#c9504a');
    // tiny bramble scratch marks in the corner
    ctx.strokeStyle = 'rgba(160,80,70,0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const k of [0, 3, 6]) {
      ctx.moveTo(22 + k, -10);
      ctx.lineTo(27 + k, -2);
    }
    ctx.stroke();
    ctx.restore();
  }
  void zone;
}

// The gate out of the village at its east end
export function drawFieldGate(ctx, x, groundY, time) {
  ctx.save();
  drawArch(ctx, x, groundY, time, { label: 'The Wildwood', dir: 1, plaque: true });
  ctx.restore();
}

// ——— mobs ———

// m = { kind, x, y (feet), facing, walking, vy, hurt 0..1, dying 0..1, t, seed }
export function drawMob(ctx, m, time) {
  const spec = MOBS[m.kind];
  if (!spec) return;
  const dying = clamp(m.dying ?? 0, 0, 1), hurt = clamp(m.hurt ?? 0, 0, 1);
  const t = m.t ?? time, seed = m.seed ?? 0, facing = m.facing < 0 ? -1 : 1;
  const vy = m.vy ?? 0, slow = !!m.slow;
  let w = spec.w, h = spec.h;
  // squash and stretch: idle breathing, hopping, the recoil when hit, and melting away when it dies
  let sx = 1, sy = 1;
  const air = clamp(-vy / 600, -0.4, 0.4);
  if (Math.abs(vy) > 1) {
    sx -= air * 0.35;
    sy += air * 0.45;
  } else {
    const k = Math.sin(t * (m.walking ? 12 : 3) * (slow ? 0.35 : 1) + seed) * (m.walking ? 0.05 : 0.03) * (slow ? 0.6 : 1);
    sx += k;
    sy -= k;
  }
  sx += hurt * 0.16;
  sy -= hurt * 0.14;
  sx *= 1 + dying * 0.5;
  sy *= 1 - dying * 0.8;
  w *= sx;
  h *= sy;

  ctx.save();
  ctx.translate(m.x - facing * hurt * 6, m.y);
  if (dying > 0) drawPoof(ctx, spec, dying, seed);
  ctx.globalAlpha = 1 - dying ** 1.4;
  if (spec.elite) drawEliteGlow(ctx, w, h, t, seed);
  ctx.scale(facing, 1);
  let sil;
  const art = spec.art ?? spec.base ?? m.kind; // an elite is drawn as its base mob (bigger, with the glow), unless it has its own `art`
  if (art === 'sprout') sil = drawSprout(ctx, w, h, t, seed, m, dying);
  else if (art === 'mushling') sil = drawMushling(ctx, w, h, t, seed, m, dying);
  else if (art === 'frostling') sil = drawFrostling(ctx, w, h, t, seed, m, dying);
  else if (art === 'yeti') sil = drawYeti(ctx, w, h, t, seed, m, dying);
  else if (art === 'wisp') sil = drawWisp(ctx, w, h, t, seed, m, dying);
  else if (art === 'golem') sil = drawGolem(ctx, w, h, t, seed, m, dying);
  else if (MOB_ART[art]) sil = MOB_ART[art](ctx, w, h, t, seed, m, dying); // the Caldera, the Citadel, Frostpeak's later mobs, field bosses, the branches
  else sil = drawBramble(ctx, w, h, t, seed, m, dying);
  if (slow && dying < 0.5) drawFrost(ctx, sil, w, h, t, seed);
  if (hurt > 0.01) {
    // flash: white at first, warming to a pink-red as it fades
    ctx.fillStyle = `rgba(255,${Math.round(150 + 105 * hurt)},${Math.round(160 + 95 * hurt)},${0.75 * hurt})`;
    sil();
    ctx.fill();
  }
  ctx.restore();
}

// Frozen by Frost Nova: an icy blue glaze over the body, a frosty rim and a few ice crystals stuck on
function drawFrost(ctx, sil, w, h, t, seed) {
  ctx.save();
  ctx.fillStyle = 'rgba(150,215,255,0.32)';
  sil();
  ctx.fill();
  ctx.strokeStyle = 'rgba(235,250,255,0.9)';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  const r = mulberry32(Math.floor(seed * 1000) + 17);
  for (let i = 0; i < 4; i++) {
    const cx = (r() - 0.5) * w * 0.8, cy = -h * (0.35 + r() * 0.6), s = 3 + r() * 2.5, a = r() * TAU;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.fillStyle = 'rgba(225,245,255,0.95)';
    ctx.strokeStyle = '#7ab8e8';
    ctx.lineWidth = 0.9;
    ctx.beginPath(); // a little diamond shard
    ctx.moveTo(0, -s * 1.5);
    ctx.lineTo(s * 0.6, 0);
    ctx.lineTo(0, s * 1.2);
    ctx.lineTo(-s * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // a glint drifting over the ice
  const g = (t * 0.6 + seed) % 1;
  ctx.fillStyle = `rgba(255,255,255,${Math.sin(g * Math.PI) * 0.9})`;
  star(ctx, -w * 0.3 + g * w * 0.6, -h * 0.75, 2.6);
  ctx.restore();
}

function drawPoof(ctx, spec, k, seed) {
  const r = mulberry32(Math.floor(seed * 1000) + 5);
  ctx.save();
  ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
  ctx.fillStyle = '#ffffff';
  const cy = -spec.h * 0.4;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + r() * 0.5, d = spec.w * (0.25 + k * 0.75);
    circle(ctx, Math.cos(a) * d, cy + Math.sin(a) * d * 0.6, (5 + r() * 5) * (1 - k * 0.5));
  }
  ctx.fillStyle = '#fff3a8';
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.6, d = spec.w * (0.4 + k * 0.9);
    star(ctx, Math.cos(a) * d, cy + Math.sin(a) * d * 0.7 - k * 8, 3.5 * (1 - k * 0.4));
  }
  ctx.restore();
}

function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.4 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function face(ctx, fx, fy, gap, t, seed, { sleepy = false, grumpy = false, dying = 0, size = 1 } = {}) {
  ctx.strokeStyle = '#2d2a3e';
  ctx.fillStyle = '#2d2a3e';
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.4) < 0.12;
  for (const ex of [fx - gap, fx + gap]) {
    if (dying > 0.05) {
      ctx.beginPath(); // x x
      ctx.moveTo(ex - 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex + 2.2 * size, fy + 2.2 * size);
      ctx.moveTo(ex + 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex - 2.2 * size, fy + 2.2 * size);
      ctx.stroke();
    } else if (sleepy) {
      // heavy-lidded: the bottom half of an eye under a droopy lid
      ctx.beginPath();
      ctx.ellipse(ex, fy, 2.6 * size, 3 * size, 0, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ex - 3.4 * size, fy - 0.2);
      ctx.quadraticCurveTo(ex, fy - 1.4 * size, ex + 3.4 * size, fy - 0.2);
      ctx.stroke();
    } else {
      ellipse(ctx, ex, fy, 2.4 * size, blink ? 0.6 : 3.3 * size);
      if (!blink) {
        ctx.fillStyle = '#fff';
        ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
        ctx.fillStyle = '#2d2a3e';
      }
    }
  }
  if (grumpy && dying < 0.05) {
    ctx.lineWidth = 2.4 * size;
    ctx.beginPath();
    ctx.moveTo(fx - gap - 3.5 * size, fy - 6 * size);
    ctx.lineTo(fx - gap + 3 * size, fy - 3.6 * size);
    ctx.moveTo(fx + gap + 3.5 * size, fy - 6 * size);
    ctx.lineTo(fx + gap - 3 * size, fy - 3.6 * size);
    ctx.stroke();
    ctx.lineWidth = 1.8 * size;
  }
  ctx.fillStyle = 'rgba(255,140,170,0.5)';
  ellipse(ctx, fx - gap - 4 * size, fy + 4.5 * size, 3 * size, 1.8 * size);
  ellipse(ctx, fx + gap + 4 * size, fy + 4.5 * size, 3 * size, 1.8 * size);
}

// Sprout: a small green bulb with a two-leaf sprout, always hopping
function drawSprout(ctx, w, h, t, seed, m, dying) {
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.bezierCurveTo(w * 0.28, -h * 0.96, w * 0.56, -h * 0.58, w * 0.5, -h * 0.26);
    ctx.bezierCurveTo(w * 0.46, -h * 0.02, w * 0.24, 0, 0, 0);
    ctx.bezierCurveTo(-w * 0.24, 0, -w * 0.46, -h * 0.02, -w * 0.5, -h * 0.26);
    ctx.bezierCurveTo(-w * 0.56, -h * 0.58, -w * 0.28, -h * 0.96, 0, -h);
    ctx.closePath();
  };
  // leaves on top, flopping with the hop
  const flop = clamp((m.vy ?? 0) / 500, -0.5, 0.5) + Math.sin(t * 4 + seed) * 0.12;
  ctx.save();
  ctx.translate(0, -h + 2);
  ctx.strokeStyle = '#4f9d5c';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -5);
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(0, -5);
    ctx.rotate(side * (0.5 + flop * 0.8));
    ctx.fillStyle = side > 0 ? '#7fd06e' : '#6cc96a';
    ctx.strokeStyle = '#4f9d5c';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(side * 5, -7, side * 11, -3);
    ctx.quadraticCurveTo(side * 6, 2, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#d4f7b0');
  g.addColorStop(1, '#86d07a');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = '#4f9d5c';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ellipse(ctx, -w * 0.22, -h * 0.62, w * 0.08, h * 0.12, -0.5);
  // tiny root tail
  ctx.strokeStyle = '#c9a07a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w * 0.1, -1);
  ctx.quadraticCurveTo(-w * 0.2, 4, -w * 0.32, 3);
  ctx.stroke();
  const fx = w * 0.12, fy = -h * 0.42;
  face(ctx, fx, fy, 4.6, t, seed, { dying, size: 0.85 });
  if (dying < 0.05) {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 1.4;
    ctx.fillStyle = '#2d2a3e';
    if (Math.abs(m.vy ?? 0) > 1) ellipse(ctx, fx, fy + 5, 1.6, 2); // a little "o" mid-hop
    else {
      ctx.beginPath();
      ctx.arc(fx, fy + 3.5, 2.4, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
  return body;
}

// Mushling: a peach-pink spotted mushroom with stubby feet and a sleepy face
function drawMushling(ctx, w, h, t, seed, m, dying) {
  const capY = -h * 0.6, capR = w * 0.58, capH = h * 0.46;
  const step = m.walking ? Math.sin(t * 9 + seed) : 0;
  const capPath = () => {
    ctx.beginPath();
    ctx.moveTo(-capR, capY + 2);
    ctx.bezierCurveTo(-capR, capY - capH * 1.3, capR, capY - capH * 1.3, capR, capY + 2);
    ctx.quadraticCurveTo(0, capY + 10, -capR, capY + 2);
    ctx.closePath();
  };
  const stemPath = () => {
    ctx.beginPath();
    ctx.roundRect(-w * 0.36, capY - 2, w * 0.72, -capY - 2, [6, 6, w * 0.3, w * 0.3]);
  };
  const sil = () => { // fills the stem itself, leaves the cap path for the caller to fill
    stemPath();
    ctx.fill();
    capPath();
  };
  // feet
  ctx.fillStyle = '#e8c9a8';
  ctx.strokeStyle = '#b88a6a';
  ctx.lineWidth = 1.5;
  for (const [fx, ph] of [[-w * 0.2, 1], [w * 0.2, -1]]) {
    ctx.beginPath();
    ctx.ellipse(fx + ph * step * 2, -2 - Math.max(0, ph * step) * 3, 6, 4, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // stem body
  const g = ctx.createLinearGradient(0, capY, 0, 0);
  g.addColorStop(0, '#fff8ee');
  g.addColorStop(1, '#f2dcc4');
  ctx.fillStyle = g;
  stemPath();
  ctx.fill();
  ctx.strokeStyle = '#c9a07a';
  ctx.lineWidth = 2;
  ctx.stroke();
  // sleepy face on the stem
  const fx = w * 0.1, fy = -h * 0.3;
  face(ctx, fx, fy, 5, t, seed, { sleepy: true, dying, size: 0.9 });
  if (dying < 0.05) {
    const yawn = Math.max(0, Math.sin(t * 0.45 + seed * 3) - 0.85) / 0.15;
    ctx.fillStyle = '#2d2a3e';
    if (yawn > 0) ellipse(ctx, fx, fy + 6, 2, 1 + yawn * 2);
    else {
      ctx.strokeStyle = '#2d2a3e';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(fx, fy + 4.5, 2, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
  // cap: gills underneath, then the dome and its spots
  ctx.fillStyle = '#f5d2c2';
  ellipse(ctx, 0, capY + 3, capR * 0.9, 5);
  const cg = ctx.createLinearGradient(0, capY - capH, 0, capY);
  cg.addColorStop(0, '#ffc2b0');
  cg.addColorStop(1, '#ff9a92');
  ctx.fillStyle = cg;
  capPath();
  ctx.fill();
  ctx.strokeStyle = '#d9707a';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = '#fff8f0';
  const r = mulberry32(Math.floor(seed * 997) + 1);
  for (const [sx, sy, sr] of [[-0.5, 0.35, 0.17], [0.1, 0.72, 0.2], [0.58, 0.3, 0.14], [-0.15, 0.25, 0.1]]) {
    ellipse(ctx, (sx + (r() - 0.5) * 0.1) * capR, capY - sy * capH, sr * capR, sr * capR * 0.75);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ellipse(ctx, -capR * 0.45, capY - capH * 0.6, capR * 0.18, capH * 0.12, -0.6);
  if (dying < 0.05 && Math.sin(t * 0.9 + seed) > 0.2) {
    // a drowsy "z" drifting up
    const k = (t * 0.5 + seed) % 1;
    ctx.globalAlpha *= Math.sin(k * Math.PI);
    ctx.strokeStyle = '#8a7aa8';
    ctx.lineWidth = 1.4;
    const zx = capR * 0.6 + k * 8, zy = capY - capH - 4 - k * 14;
    ctx.beginPath();
    ctx.moveTo(zx - 2.5, zy - 2.5);
    ctx.lineTo(zx + 2.5, zy - 2.5);
    ctx.lineTo(zx - 2.5, zy + 2.5);
    ctx.lineTo(zx + 2.5, zy + 2.5);
    ctx.stroke();
  }
  return sil;
}

// Bramblehog: a round plum hedgehog with soft spikes and grumpy eyebrows
function drawBramble(ctx, w, h, t, seed, m, dying) {
  const cx = -w * 0.04, cy = -h * 0.5, rx = w * 0.5, ry = h * 0.5;
  const step = m.walking ? Math.sin(t * 13 + seed) : 0;
  const bodyPath = () => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  };
  // feet
  ctx.fillStyle = '#6e4660';
  for (const [fx, ph] of [[-w * 0.3, 1], [-w * 0.1, -1], [w * 0.12, 1], [w * 0.3, -1]]) {
    ellipse(ctx, fx + ph * step * 2.5, -2 - Math.max(0, ph * step) * 2.5, 5, 3.5);
  }
  // soft spikes over the back (drawn first so the body overlaps their roots)
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (0.98 + (i / (n - 1)) * 0.8) + Math.sin(t * 6 + i + seed) * 0.03; // back → top
    const bx = cx + Math.cos(a) * rx * 0.86, by = cy + Math.sin(a) * ry * 0.86;
    const len = 11 + (i % 2) * 3;
    const tx = cx + Math.cos(a) * (rx + len), ty = cy + Math.sin(a) * (ry + len);
    const px = -Math.sin(a) * 6, py = Math.cos(a) * 6;
    ctx.fillStyle = i % 2 ? '#7a4a6e' : '#8a5a7e';
    ctx.strokeStyle = '#5e3a55';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + px, by + py);
    ctx.quadraticCurveTo((bx + tx) / 2 + px * 0.4, (by + ty) / 2 + py * 0.4, tx, ty);
    ctx.quadraticCurveTo((bx + tx) / 2 - px * 0.4, (by + ty) / 2 - py * 0.4, bx - px, by - py);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c99ab8';
    circle(ctx, tx - Math.cos(a) * 2, ty - Math.sin(a) * 2, 1.6);
  }
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#b582a0');
  g.addColorStop(1, '#8a5a7c');
  ctx.fillStyle = g;
  bodyPath();
  ctx.fill();
  ctx.strokeStyle = '#5e3a55';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  // a little leaf stuck in its spikes
  ctx.fillStyle = '#7a9a5a';
  ellipse(ctx, cx - rx * 0.35, cy - ry - 4, 5, 2.4, -0.6 + Math.sin(t * 3 + seed) * 0.1);
  // light face and belly patch at the front
  ctx.fillStyle = '#f2d4cc';
  ctx.beginPath();
  ctx.ellipse(w * 0.22, -h * 0.4, w * 0.25, h * 0.34, 0.15, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, cx - rx * 0.45, cy - ry * 0.45, rx * 0.18, ry * 0.14, -0.5);
  // ear
  ctx.fillStyle = '#9a6a8a';
  ctx.strokeStyle = '#5e3a55';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(w * 0.04, -h * 0.86, 4.5, 5.5, -0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8b0c4';
  ellipse(ctx, w * 0.04, -h * 0.85, 2.2, 3, -0.3);
  // snout and nose
  ctx.fillStyle = '#f2d4cc';
  ctx.strokeStyle = '#b08090';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(w * 0.44, -h * 0.36, 7, 5.5, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4a2a40';
  ellipse(ctx, w * 0.5, -h * 0.4, 3, 2.4);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  circle(ctx, w * 0.49, -h * 0.42, 0.9);
  const fx = w * 0.24, fy = -h * 0.52;
  face(ctx, fx, fy, 4.8, t, seed, { grumpy: true, dying, size: 0.9 });
  if (dying < 0.05) {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); // a little frown
    ctx.arc(w * 0.36, -h * 0.17, 2.6, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
  }
  return bodyPath;
}

// ——— Frostpeak Highlands mobs ———

function star5(ctx, x, y, r, inner = 0.5) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU - Math.PI / 2, rr = i % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

// Frostling: a small icy jelly sprite with a crown of frost spikes; it hops
function drawFrostling(ctx, w, h, t, seed, m, dying) {
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.bezierCurveTo(-w / 2, -h * 0.7, -w * 0.3, -h, 0, -h);
    ctx.bezierCurveTo(w * 0.3, -h, w / 2, -h * 0.7, w / 2, 0);
    ctx.quadraticCurveTo(0, 4, -w / 2, 0);
    ctx.closePath();
  };
  // frost crown: five little ice spikes, the middle one tallest
  const wob = Math.sin(t * 5 + seed) * 0.05;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.42 + wob;
    const bx = Math.cos(a) * w * 0.32, by = -h * 0.62 + Math.sin(a) * h * 0.4;
    const len = i === 2 ? 13 : i % 2 ? 10 : 7;
    ctx.fillStyle = i % 2 ? '#e8f8ff' : '#c4e8ff';
    ctx.strokeStyle = '#5a9ac8';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(bx - Math.sin(a) * 3.5, by + Math.cos(a) * 3.5);
    ctx.lineTo(bx + Math.cos(a) * len, by + Math.sin(a) * len);
    ctx.lineTo(bx + Math.sin(a) * 3.5, by - Math.cos(a) * 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, 'rgba(240,250,255,0.95)');
  g.addColorStop(1, 'rgba(140,200,240,0.95)');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = '#5a9ac8';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // icy facets and shine
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, -h * 0.25);
  ctx.lineTo(-w * 0.15, -h * 0.45);
  ctx.lineTo(-w * 0.28, -h * 0.6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ellipse(ctx, -w * 0.22, -h * 0.72, w * 0.08, h * 0.1, -0.5);
  const fx = w * 0.12, fy = -h * 0.42;
  face(ctx, fx, fy, 5, t, seed, { dying, size: 0.9 });
  ctx.fillStyle = 'rgba(120,180,255,0.45)'; // cool blue cheeks over the pink
  ellipse(ctx, fx - 9, fy + 4, 3, 1.8);
  ellipse(ctx, fx + 9, fy + 4, 3, 1.8);
  if (dying < 0.05) {
    ctx.fillStyle = '#2d2a3e';
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 1.4;
    if (Math.abs(m.vy ?? 0) > 1) ellipse(ctx, fx, fy + 5.5, 1.7, 2.1);
    else {
      ctx.beginPath();
      ctx.arc(fx, fy + 3.5, 2.4, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
  // a snowflake glint drifting round it
  const k = (t * 0.4 + seed) % 1;
  ctx.strokeStyle = `rgba(255,255,255,${Math.sin(k * Math.PI) * 0.9})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const gx = w * 0.45 + Math.sin(k * 6) * 3, gy = -h * 0.9 - k * 10;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    ctx.moveTo(gx - Math.cos(a) * 3, gy - Math.sin(a) * 3);
    ctx.lineTo(gx + Math.cos(a) * 3, gy + Math.sin(a) * 3);
  }
  ctx.stroke();
  return body;
}

// Yeti cub: a round, fluffy white yeti with little ears, a blue-grey face and very cross eyebrows
function drawYeti(ctx, w, h, t, seed, m, dying) {
  const cx = 0, cy = -h * 0.5, rx = w * 0.5, ry = h * 0.5;
  const step = m.walking ? Math.sin(t * 11 + seed) : 0;
  const n = 14;
  const fluff = () => { // a bumpy, fluffy outline
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a0 = (i / n) * TAU, a1 = ((i + 0.5) / n) * TAU, a2 = ((i + 1) / n) * TAU;
      const p0 = [cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry];
      const pc = [cx + Math.cos(a1) * rx * 1.12, cy + Math.sin(a1) * ry * 1.12];
      const p2 = [cx + Math.cos(a2) * rx, cy + Math.sin(a2) * ry];
      if (i === 0) ctx.moveTo(...p0);
      if (i < n) ctx.quadraticCurveTo(pc[0], pc[1], p2[0], p2[1]);
    }
    ctx.closePath();
  };
  // feet
  ctx.fillStyle = '#9aaccc';
  ctx.strokeStyle = '#6a7ca0';
  ctx.lineWidth = 1.4;
  for (const [fx, ph] of [[-w * 0.22, 1], [w * 0.2, -1]]) {
    ctx.beginPath();
    ctx.ellipse(fx + ph * step * 3, -2 - Math.max(0, ph * step) * 3, 8, 4.5, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // ears
  for (const ex of [-w * 0.28, w * 0.18]) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#a8b8d8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(ex, -h * 0.92, 6, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c9d8ea';
    circle(ctx, ex, -h * 0.92, 3);
  }
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#dfe8f6');
  ctx.fillStyle = g;
  fluff();
  ctx.fill();
  ctx.strokeStyle = '#a8b8d8';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // fluffy tufts
  ctx.strokeStyle = 'rgba(168,184,216,0.7)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (const [tx, ty] of [[-0.3, -0.7], [-0.36, -0.35], [0.0, -0.18], [-0.12, -0.85]]) {
    ctx.moveTo(w * tx - 3, h * ty);
    ctx.quadraticCurveTo(w * tx, h * ty - 4, w * tx + 3, h * ty);
  }
  ctx.stroke();
  // arms, swinging when it walks
  ctx.fillStyle = '#f4f8ff';
  ctx.strokeStyle = '#a8b8d8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(w * 0.42, -h * 0.36 + step * 2, 7, 10, -0.3 - step * 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // face patch
  ctx.fillStyle = '#c9d8ea';
  ctx.beginPath();
  ctx.ellipse(w * 0.14, -h * 0.55, w * 0.26, h * 0.24, 0, 0, TAU);
  ctx.fill();
  const fx = w * 0.14, fy = -h * 0.58;
  face(ctx, fx, fy, 6, t, seed, { grumpy: true, dying });
  if (dying < 0.05) {
    ctx.fillStyle = '#5a4a6a';
    ctx.beginPath(); // a little growl with one fang
    ctx.moveTo(fx - 5, fy + 9);
    ctx.quadraticCurveTo(fx, fy + 5.5, fx + 5, fy + 9);
    ctx.quadraticCurveTo(fx, fy + 8, fx - 5, fy + 9);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(fx + 1, fy + 7.4);
    ctx.lineTo(fx + 2.5, fy + 10);
    ctx.lineTo(fx + 3.6, fy + 7.6);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ellipse(ctx, -w * 0.25, -h * 0.68, w * 0.07, h * 0.08, -0.5);
  return fluff;
}

// Star wisp: a floating star spirit with a glowing comet tail. It hovers ~20 px above its feet.
function drawWisp(ctx, w, h, t, seed, m, dying) {
  const bob = Math.sin(t * 2.6 + seed * 5) * 4;
  const r = Math.min(w, h) * 0.5;
  const oy = -20 - r + bob;
  const body = () => {
    star5(ctx, 0, oy, r, 0.62);
  };
  // glow
  const gl = ctx.createRadialGradient(0, oy, 2, 0, oy, r * 2.2);
  gl.addColorStop(0, 'rgba(255,246,200,0.55)');
  gl.addColorStop(1, 'rgba(255,230,160,0)');
  ctx.fillStyle = gl;
  circle(ctx, 0, oy, r * 2.2);
  // comet tail streaming behind
  for (let i = 8; i >= 1; i--) {
    const k = i / 8;
    const tx = -r * 0.6 - k * r * 2.4, ty = oy + Math.sin(t * 5 - i * 0.7 + seed) * 3 * k + k * 4;
    ctx.fillStyle = `rgba(${Math.round(255 - 80 * k)},${Math.round(236 - 60 * k)},255,${0.7 * (1 - k * 0.8)})`;
    circle(ctx, tx, ty, r * 0.55 * (1 - k * 0.7));
  }
  // a faint shadow on the ground so it reads as hovering
  ctx.fillStyle = `rgba(60,40,110,${0.15 * (1 - dying)})`;
  ellipse(ctx, 0, -1, r * 0.8 - bob * 0.3, 3);
  const g = ctx.createRadialGradient(-r * 0.2, oy - r * 0.3, 1, 0, oy, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#ffe48a');
  ctx.fillStyle = g;
  ctx.save();
  ctx.translate(0, oy);
  ctx.rotate(Math.sin(t * 1.7 + seed) * 0.12);
  ctx.translate(0, -oy);
  body();
  ctx.fill();
  ctx.strokeStyle = '#e0a83a';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
  const fx = r * 0.12, fy = oy + 1;
  face(ctx, fx, fy, 4.4, t, seed, { dying, size: 0.85 });
  if (dying < 0.05) {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(fx, fy + 3.5, 2.2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  // orbiting sparkles
  for (let i = 0; i < 3; i++) {
    const a = t * 2 + (i / 3) * TAU + seed;
    ctx.fillStyle = i % 2 ? '#ffffff' : '#fff3a8';
    star(ctx, Math.cos(a) * r * 1.5, oy + Math.sin(a) * r * 0.7, 2.4);
  }
  return body;
}

// Crystal golem: a chunky lavender block of crystal with glowing eyes and crystal spikes on its back
function drawGolem(ctx, w, h, t, seed, m, dying) {
  const step = m.walking ? Math.sin(t * 7 + seed) : 0;
  const body = () => {
    ctx.beginPath();
    ctx.roundRect(-w * 0.42, -h * 0.9, w * 0.84, h * 0.78, [14, 14, 10, 10]);
  };
  // legs
  ctx.fillStyle = '#9a86e0';
  ctx.strokeStyle = '#5e4ca8';
  ctx.lineWidth = 1.8;
  for (const [lx, ph] of [[-w * 0.2, 1], [w * 0.16, -1]]) {
    ctx.beginPath();
    ctx.roundRect(lx - 7 + ph * step * 2, -h * 0.18 - Math.max(0, ph * step) * 3, 14, h * 0.18 + 1, 4);
    ctx.fill();
    ctx.stroke();
  }
  // crystal spikes on its back and shoulders (behind the body)
  for (const [bx, by, a, len, c] of [[-0.3, -0.85, -2.3, 24, '#ffc4ec'], [-0.05, -0.92, -1.75, 20, '#c4e8ff'], [-0.42, -0.6, -2.7, 18, '#e2d4ff'], [0.25, -0.9, -1.3, 13, '#ffc4ec']]) {
    const x0 = w * bx, y0 = h * by, ca = Math.cos(a), sa = Math.sin(a);
    ctx.fillStyle = c;
    ctx.strokeStyle = '#7a62c0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0 - sa * 6, y0 + ca * 6);
    ctx.lineTo(x0 - sa * 6 + ca * len * 0.75, y0 + ca * 6 + sa * len * 0.75);
    ctx.lineTo(x0 + ca * len, y0 + sa * len);
    ctx.lineTo(x0 + sa * 6 + ca * len * 0.75, y0 - ca * 6 + sa * len * 0.75);
    ctx.lineTo(x0 + sa * 6, y0 - ca * 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + ca * len * 0.9, y0 + sa * len * 0.9);
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, -h * 0.9, 0, -h * 0.1);
  g.addColorStop(0, '#ddd0ff');
  g.addColorStop(1, '#a490e6');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = '#5e4ca8';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  // facets
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, -h * 0.5);
  ctx.lineTo(-w * 0.15, -h * 0.4);
  ctx.lineTo(-w * 0.2, -h * 0.12);
  ctx.moveTo(-w * 0.15, -h * 0.4);
  ctx.lineTo(w * 0.1, -h * 0.9);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ellipse(ctx, -w * 0.26, -h * 0.76, w * 0.08, h * 0.05, -0.4);
  // glowing eyes in a dark visor band
  const fx = w * 0.16, fy = -h * 0.62;
  ctx.fillStyle = '#4a3a8a';
  ctx.beginPath();
  ctx.roundRect(fx - 15, fy - 6, 30, 12, 6);
  ctx.fill();
  const glow = 0.75 + 0.25 * Math.sin(t * 4 + seed);
  if (dying > 0.05) {
    ctx.strokeStyle = '#c4f4ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (const ex of [fx - 7, fx + 7]) {
      ctx.moveTo(ex - 2.5, fy - 2.5); ctx.lineTo(ex + 2.5, fy + 2.5);
      ctx.moveTo(ex + 2.5, fy - 2.5); ctx.lineTo(ex - 2.5, fy + 2.5);
    }
    ctx.stroke();
  } else {
    for (const ex of [fx - 7, fx + 7]) {
      const eg = ctx.createRadialGradient(ex, fy, 0.5, ex, fy, 7);
      eg.addColorStop(0, `rgba(220,250,255,${glow})`);
      eg.addColorStop(1, 'rgba(120,220,255,0)');
      ctx.fillStyle = eg;
      circle(ctx, ex, fy, 7);
      ctx.fillStyle = '#ffffff';
      ellipse(ctx, ex, fy + 0.5, 3, 2.2);
    }
    // angry brow ridge
    ctx.fillStyle = '#7a62c0';
    ctx.beginPath();
    ctx.moveTo(fx - 15, fy - 9);
    ctx.lineTo(fx - 1, fy - 4);
    ctx.lineTo(fx + 1, fy - 4);
    ctx.lineTo(fx + 15, fy - 9);
    ctx.lineTo(fx + 15, fy - 5);
    ctx.lineTo(fx - 15, fy - 5);
    ctx.closePath();
    ctx.fill();
  }
  // a big crystal fist in front, swinging as it walks
  ctx.fillStyle = '#b8a4f0';
  ctx.strokeStyle = '#5e4ca8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(w * 0.3, -h * 0.5 + step * 3, 16, 20, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ellipse(ctx, w * 0.3 + 5, -h * 0.5 + 5 + step * 3, 3, 2);
  return body;
}

// ——— gear and items (shared with slime.js) ———

// Blade length (from the hand) for each sword, longer for more reach
export const SWORD_LEN = { wood_sword: 30, iron_sword: 38, spore_blade: 42, crystal_sword: 46, bone_harpoon: 50, frost_blade: 52, thorn_sword: 54, star_sword: 58,
  magma_maul: 60, phoenix_blade: 62, cog_cleaver: 64, chrono_blade: 66, reed_rapier: 44, drift_cutlass: 50, coral_saber: 54, tide_claw: 58, ...DEEP_SWORD_LEN, ...CANOPY_SWORD_LEN, ...WRECK_SWORD_LEN, ...THORN_SWORD_LEN, ...SPINE_SWORD_LEN, ...GLACIER_SWORD_LEN, ...SKERRIES_SWORD_LEN, ...HEIGHTS_SWORD_LEN, ...BLUEHALLS_SWORD_LEN, ...QBRIDGE_SWORD_LEN , ...FORGE_SWORD_LEN, ...SUNKEN_SWORD_LEN, ...OLDICE_SWORD_LEN, ...LADON_SWORD_LEN, ...FENRIR_SWORD_LEN };
const HELMETS = ['leaf_cap', 'mush_helm', 'iron_helm', 'fur_hood', 'king_crown', 'bramble_helm', 'glacier_helm', 'star_crown',
  'ember_helm', 'phoenix_crown', 'aether_helm', 'hourglass_crown', ...Object.keys(BRANCH_HELMETS)];
const HELM_ICON_FIT = { ember_helm: [0.72, 1], phoenix_crown: [0.74, 2], aether_helm: [0.8, 1], hourglass_crown: [0.78, 5] };

// One sword, its grip at the origin and its blade pointing up (-y). glow: 0..1 extra crystal shine.
export function drawSword(ctx, id, glow = 0) {
  id = artOf(id); // (a rebalanced copy looks like its legacy original)
  const L = SWORD_LEN[id] ?? 34;
  if (id === 'spore_blade') return drawSporeBlade(ctx, L, glow);
  if (id === 'thorn_sword') return drawThornSword(ctx, L, glow);
  if (id === 'frost_blade') return drawFrostBlade(ctx, L, glow);
  if (id === 'star_sword') return drawStarSword(ctx, L, glow);
  if (id === 'magma_maul') return drawMagmaMaul(ctx, L, glow);
  if (id === 'phoenix_blade') return drawPhoenixBlade(ctx, L, glow);
  if (id === 'cog_cleaver') return drawCogCleaver(ctx, L, glow);
  if (id === 'chrono_blade') return drawChronoBlade(ctx, L, glow);
  if (id === 'bone_harpoon') return drawBoneHarpoon(ctx, L, glow); // (src/fjord-art.js)
  if (BRANCH_SWORDS[id]) return BRANCH_SWORDS[id](ctx, L, glow);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const bw = id === 'wood_sword' ? 4.2 : id === 'iron_sword' ? 3.8 : 4.4; // half-width of the blade
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-bw, -4);
    ctx.lineTo(-bw, -L + bw * 2.2);
    ctx.quadraticCurveTo(-bw * 0.4, -L + 1, 0, -L);
    ctx.quadraticCurveTo(bw * 0.4, -L + 1, bw, -L + bw * 2.2);
    ctx.lineTo(bw, -4);
    ctx.closePath();
  };
  if (id === 'crystal_sword') {
    const k = 0.55 + 0.25 * glow;
    const g = ctx.createRadialGradient(0, -L * 0.55, 2, 0, -L * 0.55, L * 0.7);
    g.addColorStop(0, `rgba(255,170,230,${k})`);
    g.addColorStop(1, 'rgba(255,170,230,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-L * 0.7, -L * 1.25, L * 1.4, L * 1.4);
  }
  if (id === 'wood_sword') {
    ctx.fillStyle = '#e8c08a';
    ctx.strokeStyle = '#9a6a3c';
  } else if (id === 'iron_sword') {
    const g = ctx.createLinearGradient(-bw, 0, bw, 0);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#dfe4ee');
    g.addColorStop(1, '#a9b2c6');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#6f7790';
  } else {
    const g = ctx.createLinearGradient(0, -L, 0, 0);
    g.addColorStop(0, '#fff0fb');
    g.addColorStop(0.5, '#ffb8e6');
    g.addColorStop(1, '#c4a0ff');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#a66ac9';
  }
  ctx.lineWidth = 1.6;
  blade();
  ctx.fill();
  ctx.stroke();
  // detail down the blade
  if (id === 'wood_sword') {
    ctx.strokeStyle = 'rgba(154,106,60,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-1.2, -7);
    ctx.quadraticCurveTo(0.8, -L * 0.45, -0.8, -L + 7);
    ctx.stroke();
    ctx.fillStyle = 'rgba(154,106,60,0.45)';
    ellipse(ctx, 1.4, -L * 0.6, 1.1, 1.8);
  } else if (id === 'iron_sword') {
    ctx.strokeStyle = 'rgba(111,119,144,0.6)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, -L + 8);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(-bw + 1, -L * 0.75, 1.3, L * 0.45);
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(0, -L + 3);
    ctx.moveTo(-bw + 0.5, -L * 0.3);
    ctx.lineTo(0, -L * 0.4);
    ctx.moveTo(bw - 0.5, -L * 0.6);
    ctx.lineTo(0, -L * 0.7);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    const tw = 0.5 + 0.5 * Math.sin(glow * 6);
    star(ctx, bw * 0.6, -L * 0.82, 2.2 + tw);
    star(ctx, -bw * 0.3, -L * 0.45, 1.6);
  }
  // crossguard
  const guard = { wood_sword: ['#a0704a', '#7a5232'], iron_sword: ['#e6b84a', '#a8802a'], crystal_sword: ['#fff6fd', '#c48ad9'] }[id] ?? ['#a0704a', '#7a5232'];
  ctx.fillStyle = guard[0];
  ctx.strokeStyle = guard[1];
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-bw - 4.5, -5.5, bw * 2 + 9, 4.5, 2.2);
  ctx.fill();
  ctx.stroke();
  if (id === 'crystal_sword') {
    ctx.fillStyle = '#ff6fae';
    ellipse(ctx, 0, -3.3, 1.8, 1.8);
  }
  // grip and pommel
  ctx.fillStyle = { wood_sword: '#c98a5a', iron_sword: '#7a5aa0', crystal_sword: '#b48ae6' }[id] ?? '#c98a5a';
  ctx.strokeStyle = guard[1];
  ctx.beginPath();
  ctx.roundRect(-2.2, -1.5, 4.4, 8.5, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-2, 1.5); ctx.lineTo(2, 0.5);
  ctx.moveTo(-2, 4.5); ctx.lineTo(2, 3.5);
  ctx.stroke();
  ctx.fillStyle = guard[0];
  ctx.strokeStyle = guard[1];
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(0, 8.6, 2.7, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Boss drop: a blade carved from Mother Mushroom's stalk, with a mushroom-cap guard and drifting spores
function drawSporeBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const bw = 4.6;
  // spores drifting off the blade
  for (let i = 0; i < 5; i++) {
    const k = (glow * 0.5 + i / 5) % 1;
    ctx.fillStyle = `rgba(255,240,170,${Math.sin(k * Math.PI) * 0.85})`;
    circle(ctx, Math.sin(i * 2.1 + k * 4) * (bw + 4 + k * 5), -L * (0.25 + i * 0.14) - k * 6, 1.4 + (i % 2) * 0.8);
  }
  const g = ctx.createLinearGradient(-bw, 0, bw, 0);
  g.addColorStop(0, '#fffaf2');
  g.addColorStop(1, '#e8d4bf');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#a8866a';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); // a stalk-like blade that swells a little, then tapers to a rounded point
  ctx.moveTo(-bw * 0.8, -4);
  ctx.bezierCurveTo(-bw * 1.2, -L * 0.4, -bw * 1.1, -L * 0.7, -bw * 0.4, -L + 3);
  ctx.quadraticCurveTo(0, -L - 1, bw * 0.4, -L + 3);
  ctx.bezierCurveTo(bw * 1.1, -L * 0.7, bw * 1.2, -L * 0.4, bw * 0.8, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(168,134,106,0.45)'; // fibres
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (const fx of [-2, 0.5, 2.6]) {
    ctx.moveTo(fx, -7);
    ctx.quadraticCurveTo(fx * 1.3, -L * 0.5, fx * 0.3, -L + 6);
  }
  ctx.stroke();
  // a tiny mushroom growing near the tip
  ctx.fillStyle = '#ff9a92';
  ctx.beginPath();
  ctx.arc(bw * 0.9, -L * 0.72, 3.4, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#fff';
  circle(ctx, bw * 0.9 - 1, -L * 0.72 - 1.6, 0.8);
  // guard: a peach mushroom cap seen from the side, spots and all
  ctx.fillStyle = '#ffb0a0';
  ctx.strokeStyle = '#d9707a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-11, -1.5);
  ctx.bezierCurveTo(-11, -9, 11, -9, 11, -1.5);
  ctx.quadraticCurveTo(0, 0.5, -11, -1.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff8f0';
  ellipse(ctx, -5, -4.5, 1.8, 1.3);
  ellipse(ctx, 4, -5, 2.2, 1.5);
  // grip and pommel
  ctx.fillStyle = '#b07f55';
  ctx.strokeStyle = '#7a5232';
  ctx.beginPath();
  ctx.roundRect(-2.2, -1, 4.4, 8, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f5d2c2';
  ctx.beginPath();
  ctx.arc(0, 8.6, 2.8, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Boss drop: the Briar Greatsword, a huge dark thorny blade with a vine-wrapped grip
function drawThornSword(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const bw = 6.5;
  // thorns along both edges (drawn first, the blade covers their roots)
  ctx.fillStyle = '#6a4258';
  ctx.strokeStyle = '#4a2a40';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 5; i++) {
    const y = -10 - i * (L - 22) / 4, side = i % 2 ? 1 : -1, bwAt = bw * (1 - (i / 5) * 0.35);
    for (const sd of [side, -side * 0.7]) {
      const dir = Math.sign(sd), len = 4.5 * Math.abs(sd) + 2;
      ctx.beginPath();
      ctx.moveTo(dir * (bwAt - 1), y + 2.5);
      ctx.lineTo(dir * (bwAt + len), y - 3);
      ctx.lineTo(dir * (bwAt - 1), y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  const g = ctx.createLinearGradient(-bw, 0, bw, 0);
  g.addColorStop(0, '#b0809e');
  g.addColorStop(0.5, '#8a5a7c');
  g.addColorStop(1, '#6a4060');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#4a2a40';
  ctx.lineWidth = 1.8;
  ctx.beginPath(); // broad at the base, tapering to a hooked point
  ctx.moveTo(-bw, -4);
  ctx.quadraticCurveTo(-bw * 0.9, -L * 0.6, -bw * 0.35, -L + 6);
  ctx.quadraticCurveTo(-1, -L - 2, 3, -L - 3);
  ctx.quadraticCurveTo(bw * 0.5, -L * 0.75, bw, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // a living green vine winding up the blade, with a leaf
  ctx.strokeStyle = '#7a9a5a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let y = -5; y > -L * 0.7; y -= 1.5) {
    const x = Math.sin(y * 0.35) * bw * 0.6;
    y === -5 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#8ab57c';
  ellipse(ctx, 3.5, -L * 0.45, 3.2, 1.6, -0.6 + Math.sin(glow * 3) * 0.15);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; // edge sheen
  ctx.fillRect(-bw + 1.5, -L * 0.7, 1.4, L * 0.55);
  // guard: two curled thorny branches with a red berry gem
  ctx.strokeStyle = '#5e3a50';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.quadraticCurveTo(-8, -1, -12, -6);
  ctx.moveTo(0, -3);
  ctx.quadraticCurveTo(8, -1, 12, -6);
  ctx.stroke();
  ctx.fillStyle = '#5e3a50';
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * 12, -5);
    ctx.lineTo(sd * 15, -10);
    ctx.lineTo(sd * 10, -7);
    ctx.fill();
  }
  ctx.fillStyle = '#e8506a';
  ctx.strokeStyle = '#a8283a';
  ctx.lineWidth = 1;
  circle(ctx, 0, -3.5, 2.6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  circle(ctx, -0.8, -4.3, 0.8);
  // vine-wrapped grip and a knotted pommel
  ctx.fillStyle = '#6e5560';
  ctx.strokeStyle = '#4a2a40';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-2.5, -1, 5, 9, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#7a9a5a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-2.5, 0.5); ctx.lineTo(2.5, 2.5);
  ctx.moveTo(-2.5, 3.5); ctx.lineTo(2.5, 5.5);
  ctx.stroke();
  ctx.fillStyle = '#7a5e68';
  ctx.strokeStyle = '#4a2a40';
  ctx.beginPath();
  ctx.arc(0, 9.4, 3.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Highlands boss drop: Glacia's Frostbite Blade, a jagged icy blade with a snowflake guard
function drawFrostBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const bw = 5;
  const g0 = ctx.createRadialGradient(0, -L * 0.55, 2, 0, -L * 0.55, L * 0.6);
  g0.addColorStop(0, 'rgba(170,225,255,0.45)');
  g0.addColorStop(1, 'rgba(170,225,255,0)');
  ctx.fillStyle = g0;
  ctx.fillRect(-L * 0.6, -L * 1.15, L * 1.2, L * 1.2);
  const g = ctx.createLinearGradient(-bw, 0, bw, 0);
  g.addColorStop(0, '#f2fbff');
  g.addColorStop(0.5, '#bfe6ff');
  g.addColorStop(1, '#7ab8e8');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#4a86b8';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); // jagged ice edges, a crystal point
  ctx.moveTo(-bw, -4);
  for (let i = 1; i <= 5; i++) ctx.lineTo(-bw - (i % 2) * 2.2, -4 - ((L - 14) * i) / 5);
  ctx.lineTo(0, -L);
  for (let i = 5; i >= 1; i--) ctx.lineTo(bw + ((i + 1) % 2) * 2.2, -4 - ((L - 14) * i) / 5 + 3);
  ctx.lineTo(bw, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-1, -6);
  ctx.lineTo(0, -L + 4);
  ctx.moveTo(-bw + 1, -L * 0.35);
  ctx.lineTo(-0.5, -L * 0.45);
  ctx.moveTo(bw - 1, -L * 0.62);
  ctx.lineTo(0, -L * 0.7);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  star(ctx, bw * 0.4, -L * 0.8, 2 + Math.sin(glow * 5) * 0.8);
  // snowflake guard
  ctx.strokeStyle = '#4a86b8';
  ctx.lineWidth = 4;
  snowflakeGuard(ctx);
  ctx.strokeStyle = '#e8f8ff';
  ctx.lineWidth = 2;
  snowflakeGuard(ctx);
  // grip and pommel
  ctx.fillStyle = '#5a7ac0';
  ctx.strokeStyle = '#3a5a98';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-2.2, -1, 4.4, 8, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c4e8ff';
  ctx.beginPath();
  ctx.moveTo(0, 6.5);
  ctx.lineTo(3, 9.5);
  ctx.lineTo(0, 12.5);
  ctx.lineTo(-3, 9.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function snowflakeGuard(ctx) {
  ctx.beginPath();
  ctx.moveTo(-10, -3);
  ctx.lineTo(10, -3);
  for (const sd of [-1, 1]) {
    ctx.moveTo(sd * 10, -3);
    ctx.lineTo(sd * 13, -6.5);
    ctx.moveTo(sd * 10, -3);
    ctx.lineTo(sd * 13, 0.5);
    ctx.moveTo(sd * 5, -3);
    ctx.lineTo(sd * 7, -6.5);
  }
  ctx.stroke();
}

// Highlands boss drop: the Starforged Sword, a golden-white blade with a star guard and a sparkle trail
function drawStarSword(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const bw = 4.8;
  const g0 = ctx.createRadialGradient(0, -L * 0.5, 2, 0, -L * 0.5, L * 0.65);
  g0.addColorStop(0, 'rgba(255,240,170,0.55)');
  g0.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = g0;
  ctx.fillRect(-L * 0.65, -L * 1.15, L * 1.3, L * 1.3);
  // sparkles drifting off the blade
  for (let i = 0; i < 6; i++) {
    const k = (glow * 0.6 + i / 6) % 1;
    ctx.fillStyle = `rgba(255,${i % 2 ? 255 : 236},${i % 2 ? 255 : 170},${Math.sin(k * Math.PI)})`;
    star(ctx, Math.sin(i * 2.7 + k * 3) * (bw + 4 + k * 6), -L * (0.15 + i * 0.14) - k * 8, 1.6 + (i % 3) * 0.6);
  }
  const g = ctx.createLinearGradient(-bw, 0, bw, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.55, '#fff3c4');
  g.addColorStop(1, '#f0c860');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#c0902a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-bw, -6);
  ctx.lineTo(-bw * 0.9, -L + bw * 3);
  ctx.quadraticCurveTo(-bw * 0.3, -L + 2, 0, -L);
  ctx.quadraticCurveTo(bw * 0.3, -L + 2, bw * 0.9, -L + bw * 3);
  ctx.lineTo(bw, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(192,144,42,0.55)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, -L + 8);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillRect(-bw + 1.2, -L * 0.8, 1.3, L * 0.55);
  // star guard with little wings
  ctx.fillStyle = '#ffe27a';
  ctx.strokeStyle = '#c0902a';
  ctx.lineWidth = 1.3;
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * 4, -4);
    ctx.quadraticCurveTo(sd * 11, -10, sd * 15, -6);
    ctx.quadraticCurveTo(sd * 10, -4, sd * 4, -1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  star5(ctx, 0, -3.5, 6.5, 0.48);
  ctx.fillStyle = '#fff6c4';
  ctx.fill();
  ctx.stroke();
  // grip and pommel
  ctx.fillStyle = '#7a6ac8';
  ctx.strokeStyle = '#4a3a8a';
  ctx.beginPath();
  ctx.roundRect(-2.2, 1, 4.4, 7.5, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe27a';
  ctx.strokeStyle = '#c0902a';
  ctx.beginPath();
  ctx.arc(0, 10, 2.8, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ——— late-game swords (Caldera + Citadel). glow is a running time (the slime's clock or the swing) ———

// A gear outline (teeth round a disc, a hole in the middle) as one evenodd path
function gearPath(ctx, x, y, r, teeth, rot, hole = r * 0.38, depth = r * 0.22) {
  ctx.beginPath();
  const n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = rot + (i / n) * TAU, q = i % 4, rr = q === 1 || q === 2 ? r : r - depth;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  if (hole > 0) {
    ctx.moveTo(x + hole, y);
    ctx.arc(x, y, hole, 0, TAU, true);
  }
}
function brassGear(ctx, x, y, r, teeth, rot, light = '#ffe2a0', mid = '#e0a848', line = '#8a5a20') {
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, light);
  g.addColorStop(1, mid);
  ctx.fillStyle = g;
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.2;
  gearPath(ctx, x, y, r, teeth, rot);
  ctx.fill('evenodd');
  ctx.stroke();
}
// A licking flame tongue standing on (x, y), leaning by lean (radians)
function flameTongue(ctx, x, y, w, h, lean = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.bezierCurveTo(-w * 0.6, -h * 0.45, -w * 0.05, -h * 0.55, w * 0.1, -h);
  ctx.bezierCurveTo(w * 0.2, -h * 0.55, w * 0.65, -h * 0.4, w / 2, 0);
  ctx.quadraticCurveTo(0, w * 0.35, -w / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function softGlow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// Caldera boss drop: Ignis's Magma Maul, a broad slab of cooled lava with molten veins and rising embers
const MAGMA_VEINS = [[0, -0.08], [-0.3, -0.2], [0.25, -0.33], [-0.2, -0.46], [0.3, -0.6], [-0.15, -0.72], [0.1, -0.86]];
function drawMagmaMaul(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const bw = 7.5, pulse = 0.75 + 0.25 * Math.sin(glow * 4);
  softGlow(ctx, 0, -L * 0.55, L * 0.75, '255,120,50', 0.5 * pulse);
  // embers floating up off it
  for (let i = 0; i < 7; i++) {
    const k = (glow * 0.45 + i / 7) % 1;
    ctx.fillStyle = `rgba(255,${150 + (i % 3) * 40},${60 + (i % 2) * 60},${Math.sin(k * Math.PI)})`;
    circle(ctx, Math.sin(i * 1.9 + k * 3) * (bw + 4 + k * 8), -L * (0.12 + i * 0.12) - k * 16, 1.3 + (i % 3) * 0.5);
  }
  const blade = () => {
    ctx.beginPath(); // a heavy slab that swells towards a blunt, rounded point
    ctx.moveTo(-bw, -5);
    ctx.quadraticCurveTo(-bw * 1.4, -L * 0.55, -bw * 1.1, -L + bw * 1.7);
    ctx.quadraticCurveTo(-bw * 0.7, -L + 1, 1.5, -L);
    ctx.quadraticCurveTo(bw * 1.05, -L + bw * 1.1, bw * 1.15, -L + bw * 2.1);
    ctx.quadraticCurveTo(bw * 1.35, -L * 0.55, bw, -5);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-bw, 0, bw, 0);
  g.addColorStop(0, '#8a6474');
  g.addColorStop(0.5, '#5e3e52');
  g.addColorStop(1, '#45293c');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2e1a28';
  ctx.lineWidth = 2;
  blade();
  ctx.fill();
  ctx.save();
  ctx.clip();
  // the molten core showing through the middle, and glowing veins branching off it
  const core = ctx.createLinearGradient(-bw, 0, bw, 0);
  core.addColorStop(0, 'rgba(255,120,40,0)');
  core.addColorStop(0.5, `rgba(255,150,60,${0.55 * pulse})`);
  core.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = core;
  ctx.fillRect(-bw * 1.5, -L, bw * 3, L);
  for (const [w, c] of [[3.6, `rgba(255,120,40,${0.7 * pulse})`], [1.5, '#ffe27a']]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    MAGMA_VEINS.forEach(([fx, fy], i) => {
      const x = fx * bw, y = fy * L - 4;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    for (let i = 1; i < MAGMA_VEINS.length - 1; i++) {
      const [fx, fy] = MAGMA_VEINS[i], s = fx < 0 ? -1 : 1;
      ctx.moveTo(fx * bw, fy * L - 4);
      ctx.lineTo(s * bw * 1.3, fy * L - 4 - 5);
    }
    ctx.stroke();
  }
  // the tip is still red hot
  softGlow(ctx, 0, -L + 5, 12, '255,200,90', 0.8 * pulse);
  ctx.restore();
  ctx.lineWidth = 2;
  blade();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; // a little sheen on the crust
  ctx.beginPath();
  ctx.ellipse(-bw * 0.7, -L * 0.5, 1.4, L * 0.25, 0.03, 0, TAU);
  ctx.fill();
  // guard: a chunky obsidian block with upturned prongs and an ember-core gem
  ctx.fillStyle = '#3e2a3a';
  ctx.strokeStyle = '#1e1018';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-14, -9);
  ctx.quadraticCurveTo(-12, -3, -6, -1);
  ctx.lineTo(6, -1);
  ctx.quadraticCurveTo(12, -3, 14, -9);
  ctx.quadraticCurveTo(10, -6.5, 6, -7);
  ctx.lineTo(-6, -7);
  ctx.quadraticCurveTo(-10, -6.5, -14, -9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,160,255,0.45)';
  ctx.fillRect(-8, -6, 5, 1.2);
  softGlow(ctx, 0, -4, 9, '255,150,60', 0.9 * pulse);
  ctx.fillStyle = '#ff8a3a';
  ctx.strokeStyle = '#a8401a';
  ctx.lineWidth = 1.1;
  circle(ctx, 0, -4, 3.2);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a0';
  circle(ctx, -0.6, -4.6, 1.3);
  // grip wrapped in glowing bands, an obsidian pommel
  ctx.fillStyle = '#4e3446';
  ctx.strokeStyle = '#2e1a28';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-2.6, -1, 5.2, 9, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ff9a4a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-2.5, 1.5); ctx.lineTo(2.5, 0.5);
  ctx.moveTo(-2.5, 4.5); ctx.lineTo(2.5, 3.5);
  ctx.stroke();
  ctx.fillStyle = '#3e2a3a';
  ctx.strokeStyle = '#1e1018';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) ctx.lineTo(Math.cos(i * TAU / 6) * 3.6, 10.5 + Math.sin(i * TAU / 6) * 3.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(255,170,80,${0.8 * pulse})`;
  circle(ctx, 0, 10.5, 1.4);
  ctx.restore();
}

// Caldera boss drop: the Phoenix Blade, a long fiery feather with flames licking its back edge
function drawPhoenixBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const bw = 5.5, fl = Math.sin(glow * 9);
  softGlow(ctx, 0, -L * 0.55, L * 0.7, '255,170,80', 0.5);
  // flames licking off the back (-x) edge
  for (let i = 0; i < 5; i++) {
    const y = -10 - i * (L - 18) / 5, hh = 9 + 4 * Math.sin(glow * 10 + i * 1.7) + (i % 2) * 3;
    ctx.fillStyle = i % 2 ? 'rgba(255,120,60,0.85)' : 'rgba(255,170,70,0.85)';
    flameTongue(ctx, -bw * 1.1 + 1, y, 7, hh, -1.0 + 0.12 * Math.sin(glow * 7 + i));
    ctx.fillStyle = 'rgba(255,236,150,0.9)';
    flameTongue(ctx, -bw * 1.1 + 1.5, y, 3.5, hh * 0.55, -1.0 + 0.12 * Math.sin(glow * 7 + i));
  }
  const blade = () => {
    ctx.beginPath(); // a feather that curves gently forward to its point
    ctx.moveTo(-bw * 0.8, -5);
    ctx.bezierCurveTo(-bw * 1.5, -L * 0.45, -bw * 1.1, -L * 0.82, 3, -L);
    ctx.bezierCurveTo(bw * 1.1, -L * 0.8, bw * 1.3, -L * 0.45, bw * 0.8, -5);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, -4, 2, -L);
  g.addColorStop(0, '#ff6a5a');
  g.addColorStop(0.45, '#ffa64a');
  g.addColorStop(1, '#fff4b0');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#c0402a';
  ctx.lineWidth = 1.7;
  blade();
  ctx.fill();
  ctx.stroke();
  // feather barbs off a bright shaft
  ctx.save();
  blade();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,240,200,0.7)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const q = 0.1 + i * 0.09, sx = q * q * 3, sy = -5 - (L - 8) * q;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - bw * 1.5, sy + 5);
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + bw * 1.5, sy + 4);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#fff8dc';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.quadraticCurveTo(0.5, -L * 0.6, 2.6, -L + 3);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  star(ctx, 3, -L * 0.78, 2.2 + fl * 0.8);
  // guard: a pair of flame-feather wings sweeping up
  for (const sd of [-1, 1]) {
    for (let j = 0; j < 3; j++) {
      ctx.fillStyle = ['#ff7a4a', '#ffa64a', '#ffd36b'][j];
      ctx.strokeStyle = '#c0402a';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      const tipX = sd * (16 - j * 3.5), tipY = -11 + j * 3.5 + fl * 0.6;
      ctx.moveTo(sd * 3, -2);
      ctx.quadraticCurveTo(sd * (9 - j), -9 + j * 2, tipX, tipY);
      ctx.quadraticCurveTo(sd * (10 - j * 2), -3 + j, sd * 3, 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#e83a4a'; // a ruby heart
  ctx.strokeStyle = '#8a1a2a';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -7.5);
  ctx.lineTo(3.4, -3.5);
  ctx.lineTo(0, 0.5);
  ctx.lineTo(-3.4, -3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  circle(ctx, -0.9, -4.6, 0.9);
  // grip wrapped in gold, and a pommel of three little tail plumes
  ctx.fillStyle = '#b8403a';
  ctx.strokeStyle = '#7a2020';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-2.3, 0, 4.6, 8, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ffd36b';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-2.2, 2.5); ctx.lineTo(2.2, 1.5);
  ctx.moveTo(-2.2, 5.5); ctx.lineTo(2.2, 4.5);
  ctx.stroke();
  for (let j = -1; j <= 1; j++) {
    ctx.fillStyle = j ? '#ffa64a' : '#ff6a4a';
    flameTongue(ctx, j * 2.2, 8, 3.8, -(9 - Math.abs(j) * 2.5), j * 0.35 + Math.sin(glow * 6 + j) * 0.12);
  }
  ctx.fillStyle = '#ffd36b';
  ctx.strokeStyle = '#b08a2a';
  ctx.lineWidth = 1;
  circle(ctx, 0, 8.5, 2.2);
  ctx.stroke();
  ctx.restore();
}

// Citadel boss drop: the Cog Cleaver, a great geared cleaver of steel and brass, its gears whirring
function drawCogCleaver(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const bw = 8, spin = glow * 2.2;
  softGlow(ctx, 0, -L * 0.5, L * 0.65, '255,220,150', 0.35);
  // teeth along the back (-x) edge
  ctx.fillStyle = '#c99a4a';
  ctx.strokeStyle = '#7a5220';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 7; i++) {
    const y = -14 - i * (L - 26) / 6;
    ctx.beginPath();
    ctx.roundRect(-bw - 4, y - 2.5, 5, 5, 1.2);
    ctx.fill();
    ctx.stroke();
  }
  const blade = () => {
    ctx.beginPath(); // straight spine, a bellied edge, a squared-off clipped tip
    ctx.moveTo(-bw, -5);
    ctx.lineTo(-bw, -L + 4);
    ctx.quadraticCurveTo(-bw, -L, -bw + 4, -L);
    ctx.lineTo(bw * 0.5, -L);
    ctx.lineTo(bw * 1.25, -L + 9);
    ctx.quadraticCurveTo(bw * 1.45, -L * 0.45, bw * 0.75, -5);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-bw, 0, bw * 1.3, 0);
  g.addColorStop(0, '#b4bed0');
  g.addColorStop(0.45, '#eef2f8');
  g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#5a6278';
  ctx.lineWidth = 1.8;
  blade();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  blade();
  ctx.clip();
  // a brass spine plate with rivets, and a bright honed edge
  ctx.fillStyle = '#e8b85a';
  ctx.fillRect(-bw, -L, 5, L);
  ctx.fillStyle = '#ffe6a8';
  for (let i = 0; i < 6; i++) circle(ctx, -bw + 2.5, -10 - i * (L - 18) / 5, 1.1);
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bw * 0.7, -8);
  ctx.quadraticCurveTo(bw * 1.3, -L * 0.45, bw * 1.05, -L + 9);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#7a5220';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-bw + 5, -6);
  ctx.lineTo(-bw + 5, -L);
  ctx.stroke();
  // two gears set into the blade, turning against each other
  brassGear(ctx, 1.5, -L * 0.3, 6.5, 8, spin);
  ctx.fillStyle = '#7a5220';
  circle(ctx, 1.5, -L * 0.3, 1.4);
  brassGear(ctx, 2.5, -L * 0.3 - 11, 4.2, 6, -spin * 1.5 + 0.3, '#fff0c8', '#d9a040');
  // a pipe along the spine, puffing steam now and then
  const puff = (glow * 0.8) % 1;
  ctx.fillStyle = `rgba(255,255,255,${0.75 * Math.sin(puff * Math.PI)})`;
  circle(ctx, -bw - 4 - puff * 6, -L + 2 - puff * 10, 2 + puff * 4);
  circle(ctx, -bw - 1 - puff * 3, -L - 1 - puff * 6, 1.5 + puff * 2.5);
  // guard: a big brass gear, the blade sits on it
  brassGear(ctx, 0, -3, 9, 10, -spin * 0.6, '#ffe2a0', '#c9902a');
  ctx.fillStyle = '#5a6278';
  circle(ctx, 0, -3, 2.4);
  ctx.fillStyle = '#9fe0f0';
  circle(ctx, 0, -3, 1.4);
  // leather grip, a brass hex-nut pommel
  ctx.fillStyle = '#8a5a3a';
  ctx.strokeStyle = '#5a3a20';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-2.4, 4, 4.8, 6.5, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8b85a';
  ctx.strokeStyle = '#7a5220';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) ctx.lineTo(Math.cos(i * TAU / 6 + 0.5) * 3.4, 12.5 + Math.sin(i * TAU / 6 + 0.5) * 3.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a5220';
  circle(ctx, 0, 12.5, 1.1);
  ctx.restore();
}

// Citadel boss drop: the Chrono Blade, the great clock's minute hand sharpened into a starry sword
function drawChronoBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const tw = 0.5 + 0.5 * Math.sin(glow * 3);
  softGlow(ctx, 0, -L * 0.55, L * 0.75, '150,200,255', 0.4 + 0.15 * tw);
  softGlow(ctx, 0, -L * 0.75, L * 0.4, '200,160,255', 0.35);
  const ringY = -L * 0.6;
  // a tilted ring of time orbiting the blade (back half first)
  const orbit = (front) => {
    ctx.strokeStyle = front ? 'rgba(255,224,140,0.95)' : 'rgba(255,224,140,0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, ringY, 15, 4.5, -0.25, front ? 0 : Math.PI, front ? Math.PI : TAU);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = glow * 1.6 + i * (TAU / 4), sn = Math.sin(a);
      if ((sn > 0) !== front) continue;
      const ex = Math.cos(a) * 15, ey = sn * 4.5;
      ctx.fillStyle = i % 2 ? '#ffffff' : '#ffe27a';
      star(ctx, ex * Math.cos(-0.25) - ey * Math.sin(-0.25), ringY + ex * Math.sin(-0.25) + ey * Math.cos(-0.25), 1.8);
    }
  };
  orbit(false);
  const blade = () => {
    ctx.beginPath(); // a slender clock hand: shaft, an open ring, then a spade point
    ctx.moveTo(-3, -5);
    ctx.lineTo(-2.4, ringY + 6);
    ctx.arc(0, ringY, 6.5, Math.PI * 0.62, Math.PI * 1.38);
    ctx.lineTo(-2, -L * 0.8);
    ctx.quadraticCurveTo(-7.5, -L * 0.85, 0, -L);
    ctx.quadraticCurveTo(7.5, -L * 0.85, 2, -L * 0.8);
    ctx.arc(0, ringY, 6.5, -Math.PI * 0.38, Math.PI * 0.38);
    ctx.lineTo(2.4, ringY + 6);
    ctx.lineTo(3, -5);
    ctx.closePath();
    ctx.moveTo(3.4, ringY);
    ctx.arc(0, ringY, 3.4, 0, TAU, true);
  };
  const g = ctx.createLinearGradient(0, -4, 0, -L);
  g.addColorStop(0, '#5a4ab8');
  g.addColorStop(0.6, '#8a7ae8');
  g.addColorStop(1, '#d8f4ff');
  ctx.strokeStyle = '#3a2a78';
  ctx.lineWidth = 3.4;
  blade();
  ctx.stroke();
  ctx.fillStyle = g;
  ctx.fill('evenodd');
  ctx.strokeStyle = '#ffd36b';
  ctx.lineWidth = 1.3;
  ctx.stroke();
  // little stars in the blade
  ctx.fillStyle = '#ffffff';
  for (const [x, y, r] of [[0, -L * 0.25, 1.3], [0.5, -L * 0.42, 1], [0, -L * 0.88, 2 + tw]]) star(ctx, x, y, r);
  ctx.fillStyle = `rgba(255,240,200,${0.5 + 0.5 * tw})`;
  circle(ctx, 0, ringY, 1.6);
  orbit(true);
  // guard: a little clock face whose hands really turn, with gold flourishes
  ctx.fillStyle = '#ffd36b';
  ctx.strokeStyle = '#a8742a';
  ctx.lineWidth = 1.2;
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * 6, -6);
    ctx.quadraticCurveTo(sd * 14, -9, sd * 15, -3);
    ctx.quadraticCurveTo(sd * 12, -5, sd * 6, -1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#fff8e8';
  ctx.strokeStyle = '#c0902a';
  ctx.lineWidth = 2;
  circle(ctx, 0, -3.5, 7.5);
  ctx.stroke();
  ctx.strokeStyle = '#8a7ae8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU, r0 = i % 3 ? 5.6 : 4.6;
    ctx.moveTo(Math.cos(a) * r0, -3.5 + Math.sin(a) * r0);
    ctx.lineTo(Math.cos(a) * 6.4, -3.5 + Math.sin(a) * 6.4);
  }
  ctx.stroke();
  ctx.strokeStyle = '#3a2a78';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  const ha = glow * 0.4 - Math.PI / 2, ma = glow * 4 - Math.PI / 2;
  ctx.moveTo(0, -3.5);
  ctx.lineTo(Math.cos(ha) * 3.2, -3.5 + Math.sin(ha) * 3.2);
  ctx.moveTo(0, -3.5);
  ctx.lineTo(Math.cos(ma) * 5, -3.5 + Math.sin(ma) * 5);
  ctx.stroke();
  ctx.fillStyle = '#c0902a';
  circle(ctx, 0, -3.5, 1);
  // grip and an hourglass pommel
  ctx.fillStyle = '#5a4ab8';
  ctx.strokeStyle = '#3a2a78';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-2.2, 4, 4.4, 6, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(220,240,255,0.9)';
  ctx.strokeStyle = '#a8742a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3.4, 11);
  ctx.lineTo(3.4, 11);
  ctx.lineTo(0, 14.5);
  ctx.lineTo(3.4, 18);
  ctx.lineTo(-3.4, 18);
  ctx.lineTo(0, 14.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd36b';
  ctx.beginPath();
  ctx.moveTo(-2, 17.5);
  ctx.lineTo(2, 17.5);
  ctx.lineTo(0, 15.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  ctx.strokeStyle = '#a8742a';
  ctx.beginPath();
  ctx.roundRect(-4.2, 10, 8.4, 1.8, 0.9);
  ctx.roundRect(-4.2, 17.4, 8.4, 1.8, 0.9);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ——— late-game helmets (same space as drawHelmet: by = brim line, rx = half the head's width) ———

// Ember Helm: a horned dome of cooled lava, glowing cracks, a little flame on the crest
const EMBER_CRACKS = [[-0.7, 0.2, -0.45, 0.55, -0.55, 0.85], [-0.1, 0.1, 0.05, 0.5, -0.1, 0.95], [0.5, 0.15, 0.35, 0.5, 0.5, 0.8]];
function drawEmberHelm(ctx, w, h, t, by, rx, ry) {
  const pulse = 0.75 + 0.25 * Math.sin(t * 4);
  // horns, behind the dome
  for (const sd of [-1, 1]) {
    const bx = sd * rx * 0.62, byy = by - ry * 0.55;
    const g = ctx.createLinearGradient(bx, byy, sd * (rx + 9), by - ry - 14);
    g.addColorStop(0, '#5e3e52');
    g.addColorStop(0.7, '#8a6474');
    g.addColorStop(1, '#ffb04a');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#2e1a28';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bx - sd * 5, byy + 3);
    ctx.quadraticCurveTo(sd * (rx + 6), byy, sd * (rx + 9), by - ry - 14);
    ctx.quadraticCurveTo(sd * (rx + 1), by - ry * 0.9, bx + sd * 4, byy - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(255,226,122,${pulse})`;
    circle(ctx, sd * (rx + 8.2), by - ry - 12.5, 1.4);
  }
  const dome = () => {
    ctx.beginPath();
    ctx.ellipse(0, by + 1, rx, ry, 0, Math.PI, 0);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-rx, by - ry, rx, by);
  g.addColorStop(0, '#8a6474');
  g.addColorStop(0.55, '#5e3e52');
  g.addColorStop(1, '#45293c');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2e1a28';
  ctx.lineWidth = 2;
  dome();
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (const [lw, c] of [[3.4, `rgba(255,120,40,${0.6 * pulse})`], [1.4, '#ffd36b']]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = lw;
    ctx.beginPath();
    for (const [x0, y0, x1, y1, x2, y2] of EMBER_CRACKS) {
      ctx.moveTo(x0 * rx, by - y0 * ry);
      ctx.lineTo(x1 * rx, by - y1 * ry);
      ctx.lineTo(x2 * rx, by - y2 * ry);
    }
    ctx.stroke();
  }
  ctx.restore();
  dome();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ellipse(ctx, -rx * 0.45, by - ry * 0.62, rx * 0.16, ry * 0.12, -0.6);
  // a flame on the crest
  const f = Math.sin(t * 9) * 0.12;
  ctx.fillStyle = 'rgba(255,120,60,0.9)';
  flameTongue(ctx, 0, by - ry + 1, 9, 13 + Math.sin(t * 7) * 2, f);
  ctx.fillStyle = '#ffd36b';
  flameTongue(ctx, 0, by - ry + 1, 4.5, 7 + Math.sin(t * 7) * 1.2, f);
  // a dark brow band with glowing ember studs
  ctx.fillStyle = '#3e2a3a';
  ctx.strokeStyle = '#1e1018';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-rx - 1.5, by - 4, rx * 2 + 3, 7, 3.5);
  ctx.fill();
  ctx.stroke();
  for (let i = -2; i <= 2; i++) {
    ctx.fillStyle = `rgba(255,140,60,${0.5 * pulse})`;
    circle(ctx, i * rx * 0.42, by - 0.5, 2.8);
    ctx.fillStyle = '#ffd36b';
    circle(ctx, i * rx * 0.42, by - 0.5, 1.3);
  }
}

// Phoenix Crown: a fan of flickering flame plumes on a gold band with a ruby
function drawPhoenixCrown(ctx, w, h, t, by, rx) {
  const cw = rx * 0.92, top = by - 2;
  const glow = ctx.createRadialGradient(0, top - 14, 2, 0, top - 14, 30);
  glow.addColorStop(0, `rgba(255,170,80,${0.5 + 0.12 * Math.sin(t * 5)})`);
  glow.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = glow;
  circle(ctx, 0, top - 14, 30);
  // two swept-back wing feathers at the sides
  for (const sd of [-1, 1]) {
    ctx.fillStyle = '#ff8a4a';
    ctx.strokeStyle = '#c0402a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(sd * cw * 0.8, top - 2);
    ctx.quadraticCurveTo(sd * (cw + 10), top - 6, sd * (cw + 15), top - 16 + Math.sin(t * 4 + sd) * 1.5);
    ctx.quadraticCurveTo(sd * (cw + 6), top - 10, sd * cw * 0.6, top - 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // the plumes: flame-feathers, red at the root, gold at the tip
  for (const [sx, tall, a] of [[-0.6, 15, -0.5], [-0.3, 21, -0.25], [0, 27, 0], [0.3, 21, 0.25], [0.6, 15, 0.5]]) {
    const fl = Math.sin(t * 8 + sx * 9) * 0.07, hh = tall + Math.sin(t * 6 + sx * 5) * 1.5;
    ctx.save();
    ctx.translate(sx * cw, top - 4);
    ctx.rotate(a + fl);
    const g = ctx.createLinearGradient(0, 0, 0, -hh);
    g.addColorStop(0, '#ff5a4a');
    g.addColorStop(0.55, '#ffa04a');
    g.addColorStop(1, '#fff0a0');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#c0402a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.bezierCurveTo(-6, -hh * 0.5, -2, -hh * 0.8, 1.5, -hh);
    ctx.bezierCurveTo(3, -hh * 0.75, 6, -hh * 0.45, 4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,250,220,0.8)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.quadraticCurveTo(0, -hh * 0.6, 1.2, -hh + 3);
    ctx.stroke();
    ctx.restore();
  }
  // the band, with a ruby and little gold studs
  const bg = ctx.createLinearGradient(0, top - 6, 0, top + 2);
  bg.addColorStop(0, '#fff0a8');
  bg.addColorStop(1, '#f0b83a');
  ctx.fillStyle = bg;
  ctx.strokeStyle = '#b0742a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-cw, top - 6, cw * 2, 8, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ff8a4a';
  for (const i of [-2, -1, 1, 2]) circle(ctx, i * cw * 0.4, top - 2, 1.4);
  ctx.fillStyle = '#e83a4a';
  ctx.strokeStyle = '#8a1a2a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cw * 0.05, top - 7);
  ctx.lineTo(cw * 0.05 + 4, top - 2);
  ctx.lineTo(cw * 0.05, top + 3);
  ctx.lineTo(cw * 0.05 - 4, top - 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  circle(ctx, cw * 0.05 - 1.2, top - 3.5, 1);
  // embers drifting up
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.8 + i / 3) % 1;
    ctx.fillStyle = `rgba(255,${200 + i * 20},120,${Math.sin(k * Math.PI)})`;
    circle(ctx, (i - 1) * cw * 0.7 + Math.sin(k * 6 + i) * 3, top - 22 - k * 14, 1.6);
  }
}

// Aether Helm: a light brass cap with a sky-crystal fin, a porthole lens, a turning gear and a little wing
function drawAetherHelm(ctx, w, h, t, by, rx, ry) {
  // a cloud puffing behind
  const ck = (t * 0.5) % 1;
  ctx.fillStyle = `rgba(255,255,255,${0.8 * Math.sin(ck * Math.PI)})`;
  circle(ctx, -rx - 4 - ck * 10, by - ry * 0.6 - ck * 6, 4 + ck * 3);
  circle(ctx, -rx + 1 - ck * 8, by - ry * 0.85 - ck * 6, 3 + ck * 2);
  // the crystal fin
  const fg = ctx.createLinearGradient(0, by - ry - 18, 0, by - ry * 0.5);
  fg.addColorStop(0, '#f2fdff');
  fg.addColorStop(0.5, '#8ae0f0');
  fg.addColorStop(1, '#8a9af0');
  const glow = ctx.createRadialGradient(0, by - ry - 6, 2, 0, by - ry - 6, 22);
  glow.addColorStop(0, `rgba(150,230,255,${0.45 + 0.15 * Math.sin(t * 3)})`);
  glow.addColorStop(1, 'rgba(150,230,255,0)');
  ctx.fillStyle = glow;
  circle(ctx, 0, by - ry - 6, 22);
  ctx.fillStyle = fg;
  ctx.strokeStyle = '#4a6ab8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.4, by - ry * 0.7);
  ctx.lineTo(-rx * 0.25, by - ry - 10);
  ctx.lineTo(rx * 0.05, by - ry - 19);
  ctx.lineTo(rx * 0.2, by - ry - 8);
  ctx.lineTo(rx * 0.35, by - ry * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.18, by - ry * 0.8);
  ctx.lineTo(-rx * 0.12, by - ry - 9);
  ctx.stroke();
  // a little white wing at the back
  ctx.save();
  ctx.translate(-rx * 0.75, by - ry * 0.45);
  ctx.rotate(-0.3 + Math.sin(t * 6) * 0.12);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#9ab0d0';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.quadraticCurveTo(-6, -12, -16, -12);
  ctx.quadraticCurveTo(-13, -8, -14, -6);
  ctx.quadraticCurveTo(-10, -4, -11, -1);
  ctx.quadraticCurveTo(-6, 1, 0, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // the brass dome
  const g = ctx.createLinearGradient(-rx, 0, rx, 0);
  g.addColorStop(0, '#fff0c8');
  g.addColorStop(0.5, '#e8b85a');
  g.addColorStop(1, '#b8842a');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#7a5220';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, by + 1, rx, ry, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122,82,32,0.55)'; // panel seams
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, by + 1, rx * 0.5, ry, 0, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  // a turning gear on the side
  brassGear(ctx, -rx * 0.45, by - ry * 0.45, 5.5, 8, t * 1.5, '#fff0c8', '#c9902a');
  // the band with rivets
  ctx.fillStyle = '#c9902a';
  ctx.strokeStyle = '#7a5220';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-rx - 1.5, by - 4, rx * 2 + 3, 7, 3.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff0c8';
  for (let i = -2; i <= 1; i++) circle(ctx, i * rx * 0.42, by - 0.5, 1.2);
  // a porthole lens of sky glass at the front
  ctx.fillStyle = '#e8b85a';
  ctx.strokeStyle = '#7a5220';
  ctx.lineWidth = 1.4;
  circle(ctx, rx * 0.62, by - 3, 5.6);
  ctx.stroke();
  const lg = ctx.createRadialGradient(rx * 0.62 - 1.5, by - 4.5, 0.5, rx * 0.62, by - 3, 4);
  lg.addColorStop(0, '#ffffff');
  lg.addColorStop(1, '#5fc4e8');
  ctx.fillStyle = lg;
  circle(ctx, rx * 0.62, by - 3, 3.8);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ellipse(ctx, -rx * 0.15, by - ry * 0.75, rx * 0.14, ry * 0.1, -0.4);
}

// Hourglass Crown: a gold crown with a clock halo behind it, an hourglass whose sand runs upward
function drawHourglassCrown(ctx, w, h, t, by, rx) {
  const cw = rx * 0.92, top = by - 2, hy = top - 16;
  // the clock halo
  const glow = ctx.createRadialGradient(0, hy, 3, 0, hy, 28);
  glow.addColorStop(0, 'rgba(200,170,255,0.5)');
  glow.addColorStop(1, 'rgba(160,200,255,0)');
  ctx.fillStyle = glow;
  circle(ctx, 0, hy, 28);
  ctx.fillStyle = 'rgba(120,100,220,0.28)';
  ctx.strokeStyle = 'rgba(255,211,107,0.95)';
  ctx.lineWidth = 1.6;
  circle(ctx, 0, hy, 17);
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU, r0 = i % 3 ? 14.5 : 12.5;
    ctx.moveTo(Math.cos(a) * r0, hy + Math.sin(a) * r0);
    ctx.lineTo(Math.cos(a) * 16.5, hy + Math.sin(a) * 16.5);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,190,0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const ha = t * 0.35 - 2.1, ma = t * 2 - Math.PI / 2;
  ctx.moveTo(0, hy);
  ctx.lineTo(Math.cos(ha) * 9, hy + Math.sin(ha) * 9);
  ctx.moveTo(0, hy);
  ctx.lineTo(Math.cos(ma) * 13, hy + Math.sin(ma) * 13);
  ctx.stroke();
  // crown points tipped with violet orbs
  const bg = ctx.createLinearGradient(0, top - 14, 0, top + 2);
  bg.addColorStop(0, '#fff3b8');
  bg.addColorStop(1, '#e8a83a');
  ctx.fillStyle = bg;
  ctx.strokeStyle = '#a8742a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-cw, top + 2);
  ctx.lineTo(-cw, top - 5);
  const pts = [-0.85, -0.45, 0.45, 0.85];
  ctx.lineTo(-cw * 0.85, top - 12);
  ctx.lineTo(-cw * 0.65, top - 6);
  ctx.lineTo(-cw * 0.45, top - 13);
  ctx.lineTo(-cw * 0.25, top - 6);
  ctx.lineTo(cw * 0.25, top - 6);
  ctx.lineTo(cw * 0.45, top - 13);
  ctx.lineTo(cw * 0.65, top - 6);
  ctx.lineTo(cw * 0.85, top - 12);
  ctx.lineTo(cw, top - 5);
  ctx.lineTo(cw, top + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const p of pts) {
    ctx.fillStyle = '#9a7ae8';
    ctx.strokeStyle = '#5a3aa8';
    ctx.lineWidth = 1;
    circle(ctx, p * cw, top - 13.5, 2.2);
    ctx.stroke();
  }
  ctx.fillStyle = '#7a4ae0';
  for (const p of [-0.65, 0.65]) {
    ctx.beginPath();
    ctx.moveTo(p * cw, top - 4);
    ctx.lineTo(p * cw + 2.2, top - 1.5);
    ctx.lineTo(p * cw, top + 1);
    ctx.lineTo(p * cw - 2.2, top - 1.5);
    ctx.closePath();
    ctx.fill();
  }
  // the hourglass at the front centre
  const gx = 0, gy0 = top - 21, gy1 = top - 3, mid = (gy0 + gy1) / 2;
  ctx.fillStyle = 'rgba(225,245,255,0.9)';
  ctx.strokeStyle = '#a8742a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(gx - 6, gy0);
  ctx.lineTo(gx + 6, gy0);
  ctx.quadraticCurveTo(gx + 6, mid - 2, gx + 1, mid);
  ctx.quadraticCurveTo(gx + 6, mid + 2, gx + 6, gy1);
  ctx.lineTo(gx - 6, gy1);
  ctx.quadraticCurveTo(gx - 6, mid + 2, gx - 1, mid);
  ctx.quadraticCurveTo(gx - 6, mid - 2, gx - 6, gy0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // sand gathers at the TOP (it runs upward), a thin stream rising through the neck
  const fillK = 0.55 + 0.25 * Math.sin(t * 0.7);
  ctx.fillStyle = '#ffd36b';
  ctx.beginPath();
  ctx.moveTo(gx - 5.2, gy0 + 1);
  ctx.lineTo(gx + 5.2, gy0 + 1);
  ctx.lineTo(gx + 5.2 - fillK * 1.5, gy0 + 1 + fillK * 5);
  ctx.lineTo(gx - 5.2 + fillK * 1.5, gy0 + 1 + fillK * 5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(gx - 4.5, gy1 - 1);
  ctx.lineTo(gx + 4.5, gy1 - 1);
  ctx.lineTo(gx, gy1 - 1 - (1 - fillK) * 6);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const k = (t * 1.2 + i / 3) % 1;
    circle(ctx, gx, gy1 - 2 - k * (gy1 - gy0 - 6), 0.7);
  }
  ctx.fillStyle = '#ffd36b';
  ctx.strokeStyle = '#a8742a';
  ctx.beginPath();
  ctx.roundRect(gx - 7.5, gy0 - 2, 15, 2.6, 1.3);
  ctx.roundRect(gx - 7.5, gy1 - 0.6, 15, 2.6, 1.3);
  ctx.fill();
  ctx.stroke();
  // twinkles round the halo
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.6 + i / 3) % 1, a = i * 2.1 + t * 0.3;
    ctx.fillStyle = `rgba(255,246,220,${Math.sin(k * Math.PI)})`;
    star(ctx, Math.cos(a) * 22, hy + Math.sin(a) * 16, 2.4);
  }
}

// ——— late-game loot, the Mega Elixir and the scrolls ———

function iconEmberCore(ctx) {
  // a warm round coal with glowing cracks and a little flame on top
  const g0 = ctx.createRadialGradient(0, 4, 2, 0, 4, 20);
  g0.addColorStop(0, 'rgba(255,150,70,0.65)');
  g0.addColorStop(1, 'rgba(255,150,70,0)');
  ctx.fillStyle = g0;
  circle(ctx, 0, 4, 20);
  ctx.fillStyle = 'rgba(255,120,60,0.9)';
  flameTongue(ctx, 1, -6, 10, 14, 0.1);
  ctx.fillStyle = '#ffe27a';
  flameTongue(ctx, 1, -6, 5, 8, 0.1);
  const g = ctx.createRadialGradient(-4, 0, 1, 0, 4, 14);
  g.addColorStop(0, '#8a6474');
  g.addColorStop(1, '#45293c');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2e1a28';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-12, 6);
  ctx.bezierCurveTo(-14, -6, -4, -9, 2, -7);
  ctx.bezierCurveTo(10, -6, 15, 0, 12, 9);
  ctx.bezierCurveTo(9, 15, -8, 16, -12, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const [lw, c] of [[3.2, 'rgba(255,120,40,0.7)'], [1.3, '#ffd36b']]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(-9, 2); ctx.lineTo(-3, 5); ctx.lineTo(-4, 11);
    ctx.moveTo(-3, 5); ctx.lineTo(4, 2); ctx.lineTo(9, 5);
    ctx.moveTo(4, 2); ctx.lineTo(3, -4);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ellipse(ctx, -6, -3, 3, 1.6, -0.5);
}
function iconObsidian(ctx) {
  // glassy black shards with violet sheen
  for (const [x, y, a, len, wd] of [[-7, 14, -0.5, 22, 6], [3, 15, 0.15, 30, 7.5], [11, 15, 0.75, 15, 4.5]]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(-wd, 0, wd, 0);
    g.addColorStop(0, '#6a5a8a');
    g.addColorStop(0.45, '#2e2440');
    g.addColorStop(1, '#1a1426');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#120c1c';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-wd, 0);
    ctx.lineTo(-wd * 0.8, -len * 0.6);
    ctx.lineTo(wd * 0.1, -len);
    ctx.lineTo(wd, -len * 0.5);
    ctx.lineTo(wd * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,170,255,0.75)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-wd * 0.5, -2);
    ctx.lineTo(-wd * 0.45, -len * 0.6);
    ctx.lineTo(wd * 0.05, -len * 0.9);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#ffffff';
  star(ctx, -12, -9, 3.2);
  ctx.fillStyle = '#d8c4ff';
  star(ctx, 13, -6, 2.2);
}
function iconCog(ctx) {
  brassGear(ctx, 0, 0, 17, 10, 0.15, '#fff0c8', '#d9a040', '#7a5220');
  ctx.strokeStyle = 'rgba(122,82,32,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 10.5, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#7a5220';
  for (let i = 0; i < 4; i++) {
    const a = i * TAU / 4 + 0.6;
    circle(ctx, Math.cos(a) * 9.5, Math.sin(a) * 9.5, 1.3);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ellipse(ctx, -7, -8, 4, 1.8, -0.7);
  ctx.fillStyle = '#ffffff';
  star(ctx, 14, -14, 3);
}
function iconAetherCrystal(ctx) {
  // a floating sky crystal over a wisp of cloud
  const g0 = ctx.createRadialGradient(0, -2, 2, 0, -2, 20);
  g0.addColorStop(0, 'rgba(160,230,255,0.6)');
  g0.addColorStop(1, 'rgba(160,230,255,0)');
  ctx.fillStyle = g0;
  circle(ctx, 0, -2, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.strokeStyle = '#b8c8e8';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(-6, 14, 4.5, Math.PI * 0.9, Math.PI * 1.9);
  ctx.arc(0, 12, 5.5, Math.PI * 1.1, Math.PI * 1.95);
  ctx.arc(7, 14, 4, Math.PI * 1.2, Math.PI * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const g = ctx.createLinearGradient(-8, -18, 8, 8);
  g.addColorStop(0, '#f2fdff');
  g.addColorStop(0.5, '#8ae0f0');
  g.addColorStop(1, '#9a8af0');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#4a6ab8';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(0, -19);
  ctx.lineTo(8, -6);
  ctx.lineTo(4, 7);
  ctx.lineTo(-4, 7);
  ctx.lineTo(-8, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(74,106,184,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-8, -6); ctx.lineTo(-1, -3); ctx.lineTo(8, -6);
  ctx.moveTo(-1, -3); ctx.lineTo(0, -19);
  ctx.moveTo(-1, -3); ctx.lineTo(-4, 7);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.moveTo(-1, -16); ctx.lineTo(-6, -6); ctx.lineTo(-2, -5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  star(ctx, 12, -12, 3.2);
  star(ctx, -13, -1, 2.2);
}
function iconMegaElixir(ctx) {
  // a grand golden-crimson flask with little gold wings and a star stopper
  const g0 = ctx.createRadialGradient(0, 5, 3, 0, 5, 21);
  g0.addColorStop(0, 'rgba(255,220,120,0.6)');
  g0.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = g0;
  circle(ctx, 0, 5, 21);
  for (const sd of [-1, 1]) {
    ctx.fillStyle = '#ffe9a0';
    ctx.strokeStyle = '#c0902a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(sd * 10, 0);
    ctx.quadraticCurveTo(sd * 16, -10, sd * 20, -8);
    ctx.quadraticCurveTo(sd * 18, -5, sd * 19, -3);
    ctx.quadraticCurveTo(sd * 16, -1, sd * 17, 2);
    ctx.quadraticCurveTo(sd * 14, 4, sd * 11, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 7, 12.5, 0, TAU);
  ctx.clip();
  const lg = ctx.createLinearGradient(0, -6, 0, 20);
  lg.addColorStop(0, '#fff3a0');
  lg.addColorStop(0.45, '#ffa04a');
  lg.addColorStop(1, '#ff4f7a');
  ctx.fillStyle = lg;
  ctx.fillRect(-14, 0, 28, 22);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; // a swirl in the potion
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(1, 9, 5, 0.3, Math.PI * 1.6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(-14, -8, 28, 8);
  ctx.restore();
  ctx.strokeStyle = '#b0742a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 7, 12.5, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,248,255,0.7)';
  ctx.strokeStyle = '#b0742a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-4.5, -11, 9, 7, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd36b';
  ctx.beginPath();
  ctx.roundRect(-6, -6.5, 12, 3, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff3a8';
  ctx.strokeStyle = '#c0902a';
  ctx.lineWidth = 1.3;
  star5(ctx, 0, -15, 6.5, 0.48);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ellipse(ctx, -6, 3, 2, 3.8, 0.4);
  ctx.fillStyle = '#ffffff';
  star(ctx, 14, 12, 3);
}

// Scrolls: a rolled parchment with a sword or helmet emblem and the success rate on a wax seal
const SCROLL_LOOK = {
  100: { seal: '#5fc47a', line: '#2f8a4c', knob: '#8ad89a' },
  60: { seal: '#5b8def', line: '#3f68c0', knob: '#9ab8ff' },
  10: { seal: '#f0b83a', line: '#a8742a', knob: '#ffe27a' },
  30: { seal: '#2e2440', line: '#120c1c', knob: '#7a5aa0' },
};
function iconScroll(ctx, id) {
  const chaos = id === 'scroll_chaos', helmet = id[7] === 'h';
  const rate = chaos ? 60 : +id.slice(8);
  const dark = rate === 30;
  const look = SCROLL_LOOK[rate] ?? SCROLL_LOOK[60];
  ctx.save();
  ctx.rotate(-0.18);
  if (dark) { // a faint violet menace round it
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
    g.addColorStop(0, 'rgba(150,90,220,0.45)');
    g.addColorStop(1, 'rgba(150,90,220,0)');
    ctx.fillStyle = g;
    circle(ctx, 0, 0, 22);
  }
  // the sheet, with a wavy edge
  ctx.fillStyle = dark ? '#d8cce6' : '#fff3d6';
  ctx.strokeStyle = dark ? '#5a4a78' : '#c9a06a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-11, -12);
  ctx.lineTo(11, -12);
  ctx.quadraticCurveTo(13, -4, 11, 1);
  ctx.quadraticCurveTo(9, 6, 11, 12);
  ctx.lineTo(-11, 12);
  ctx.quadraticCurveTo(-13, 6, -11, 1);
  ctx.quadraticCurveTo(-9, -4, -11, -12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the emblem
  ctx.save();
  ctx.translate(-2, -1);
  if (chaos) {
    ['#ff8fa6', '#ffc06a', '#fff07a', '#8fe0a0', '#8fc8ff', '#c4a0ff'].forEach((c, i) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 2 + i * 1.3, i * 1.05, i * 1.05 + 3.6);
      ctx.stroke();
    });
  } else if (helmet) {
    ctx.fillStyle = look.seal;
    ctx.strokeStyle = look.line;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(0, 3, 7, 7.5, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.roundRect(-8, 1.5, 16, 3.2, 1.6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ellipse(ctx, -3, -1.5, 1.8, 1.2, -0.5);
  } else {
    ctx.rotate(0.7);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = look.line;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-2, 3);
    ctx.lineTo(-2, -7);
    ctx.lineTo(0, -10);
    ctx.lineTo(2, -7);
    ctx.lineTo(2, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = look.seal;
    ctx.beginPath();
    ctx.roundRect(-5.5, 2.5, 11, 2.8, 1.4);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-1.4, 5, 2.8, 4.5, 1);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  // rolls at the top and bottom, with knobs in the scroll's colour
  for (const y of [-14, 14]) {
    ctx.fillStyle = dark ? '#b8a8d0' : '#f0d9a8';
    ctx.strokeStyle = dark ? '#5a4a78' : '#b08a5a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-13, y - 3, 26, 6, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(-10, y - 1.8, 20, 1.3);
    ctx.fillStyle = chaos ? '#c4a0ff' : look.knob;
    ctx.strokeStyle = chaos ? '#7a5aa0' : look.line;
    ctx.lineWidth = 1.3;
    for (const x of [-15, 15]) {
      circle(ctx, x, y, 2.8);
      ctx.stroke();
    }
  }
  ctx.restore();
  // the wax seal with the rate on it
  const sx = 9, sy = 10, r = 8.5;
  let fill = look.seal;
  if (chaos) {
    fill = ctx.createConicGradient ? ctx.createConicGradient(0, sx, sy) : '#c4a0ff';
    if (typeof fill !== 'string') {
      ['#ff8fa6', '#ffc06a', '#fff07a', '#8fe0a0', '#8fc8ff', '#c4a0ff', '#ff8fa6'].forEach((c, i) => fill.addColorStop(i / 6, c));
    }
  }
  ctx.fillStyle = fill;
  ctx.strokeStyle = chaos ? '#7a5aa0' : look.line;
  ctx.lineWidth = 1.6;
  ctx.beginPath(); // a slightly bumpy wax blob
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * TAU, rr = r + (i % 2 ? 0.8 : -0.2);
    ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (dark) { // cracked, with violet light seeping out
    ctx.strokeStyle = '#b48aff';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(sx - 7, sy - 4);
    ctx.lineTo(sx - 3, sy - 1);
    ctx.lineTo(sx - 4, sy + 3);
    ctx.moveTo(sx + 7, sy + 3);
    ctx.lineTo(sx + 4, sy + 1);
    ctx.lineTo(sx + 5, sy - 3);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, sx - 3, sy - 4.5, 3, 1.4, -0.4);
  ctx.font = `800 ${rate >= 100 ? 7.5 : 9}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = chaos ? '#5a3a8a' : dark ? '#120c1c' : look.line;
  ctx.strokeText(String(rate), sx, sy + 0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(rate), sx, sy + 0.5);
}

function drawGlacierHelm(ctx, w, h, t, by, rx) {
  // a crown of never-melting ice: a frosty band with tall icicle points
  const cw = rx * 0.95, top = by - 2;
  const tw = Math.sin(t * 2) * 0.5 + 0.5;
  const spikes = [[-0.8, 11], [-0.4, 15], [0, 21], [0.4, 15], [0.8, 11]];
  for (const [sx, tall] of spikes) {
    const x0 = sx * cw;
    const g = ctx.createLinearGradient(0, top - tall, 0, top);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#9fd4f5');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#4a86b8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x0 - 5, top - 4);
    ctx.lineTo(x0 - 1.5, top - tall);
    ctx.lineTo(x0 + 1.5, top - tall + 1);
    ctx.lineTo(x0 + 5, top - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x0 - 2, top - 5);
    ctx.lineTo(x0 - 1, top - tall + 4);
    ctx.stroke();
  }
  ctx.fillStyle = '#c4e8ff';
  ctx.strokeStyle = '#4a86b8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-cw, top - 6, cw * 2, 8, 4);
  ctx.fill();
  ctx.stroke();
  // little icicles dripping off the band
  ctx.fillStyle = '#e8f8ff';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cw * 0.4 - 2, top + 1.5);
    ctx.lineTo(i * cw * 0.4, top + 5 + (i % 2 ? 1 : 3));
    ctx.lineTo(i * cw * 0.4 + 2, top + 1.5);
    ctx.fill();
  }
  ctx.fillStyle = '#7ab8e8';
  ctx.beginPath(); // a gem at the front
  ctx.moveTo(cw * 0.3, top - 5.5);
  ctx.lineTo(cw * 0.3 + 3, top - 2);
  ctx.lineTo(cw * 0.3, top + 1.5);
  ctx.lineTo(cw * 0.3 - 3, top - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${0.5 + tw * 0.5})`;
  star(ctx, -cw * 0.4, top - 13, 2.2 + tw);
}

function drawStarCrown(ctx, w, h, t, by, rx) {
  // the Astral Wyrm's crest: a violet crystal fan with stars, on a gold band
  const cw = rx * 0.92, top = by - 2;
  const glow = ctx.createRadialGradient(0, top - 14, 2, 0, top - 14, 26);
  glow.addColorStop(0, `rgba(200,170,255,${0.45 + 0.15 * Math.sin(t * 3)})`);
  glow.addColorStop(1, 'rgba(200,170,255,0)');
  ctx.fillStyle = glow;
  circle(ctx, 0, top - 14, 26);
  for (const [sx, tall, a] of [[-0.55, 14, -0.45], [-0.25, 19, -0.2], [0.05, 24, 0], [0.35, 18, 0.22], [0.62, 12, 0.45]]) {
    ctx.save();
    ctx.translate(sx * cw, top - 4);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, -tall, 0, 0);
    g.addColorStop(0, '#f0e6ff');
    g.addColorStop(1, '#9a7ae8');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#5a3aa8';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); // a long hexagonal crystal
    ctx.moveTo(-3.5, 0);
    ctx.lineTo(-3.5, -tall * 0.7);
    ctx.lineTo(0, -tall);
    ctx.lineTo(3.5, -tall * 0.7);
    ctx.lineTo(3.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-1, -2);
    ctx.lineTo(-1, -tall * 0.75);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#ffd36b';
  ctx.strokeStyle = '#b08a2a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-cw, top - 6, cw * 2, 8, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a4ae0';
  for (let i = -2; i <= 2; i++) circle(ctx, i * cw * 0.4, top - 2, 1.6);
  // stars twinkling round the crest
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.7 + i / 3) % 1;
    ctx.fillStyle = `rgba(255,246,200,${Math.sin(k * Math.PI)})`;
    star(ctx, (i - 1) * cw * 0.8, top - 18 - k * 8 + (i % 2) * 6, 2.6);
  }
}

function iconIceShard(ctx) {
  for (const [x, y, a, len, wd] of [[-6, 14, -0.45, 24, 5], [4, 14, 0.3, 30, 6.5], [10, 15, 0.7, 16, 4]]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(-wd, 0, wd, 0);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#8fc8f0');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#4a86b8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-wd, 0);
    ctx.lineTo(-wd, -len * 0.75);
    ctx.lineTo(0, -len);
    ctx.lineTo(wd, -len * 0.75);
    ctx.lineTo(wd, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-wd * 0.3, -2);
    ctx.lineTo(-wd * 0.3, -len * 0.8);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#ffffff';
  star(ctx, -12, -10, 3.5);
}
function iconStardust(ctx) {
  // a little heap of glittering gold dust with stars rising off it
  const g = ctx.createRadialGradient(0, 8, 2, 0, 8, 18);
  g.addColorStop(0, 'rgba(255,240,170,0.7)');
  g.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = g;
  circle(ctx, 0, 6, 18);
  ctx.fillStyle = '#ffd86a';
  ctx.strokeStyle = '#c0902a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-15, 13);
  ctx.quadraticCurveTo(-8, 0, 0, -1);
  ctx.quadraticCurveTo(8, 0, 15, 13);
  ctx.quadraticCurveTo(0, 17, -15, 13);
  ctx.fill();
  ctx.stroke();
  for (const [x, y, c] of [[-7, 9, '#ffffff'], [-1, 5, '#c4b0ff'], [5, 10, '#ffffff'], [2, 12, '#fff3a8'], [-4, 13, '#c4e8ff'], [9, 12, '#c4b0ff']]) {
    ctx.fillStyle = c;
    circle(ctx, x, y, 1.3);
  }
  ctx.fillStyle = '#fff6c4';
  ctx.strokeStyle = '#c0902a';
  ctx.lineWidth = 1.2;
  star5(ctx, 0, -10, 7, 0.48);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  star(ctx, -11, -6, 3.2);
  star(ctx, 12, -14, 2.6);
}
function iconElixir(ctx) {
  // a round flask of rainbow elixir with a cork and sparkles
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 6, 13, 0, TAU);
  ctx.clip();
  const bands = ['#ff8fa6', '#ffc06a', '#fff07a', '#8fe0a0', '#8fc8ff', '#c4a0ff'];
  bands.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(-14, -1 + i * 3.4, 28, 3.6);
  });
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(-14, -8, 28, 8);
  ctx.restore();
  ctx.strokeStyle = '#8a7aa8';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 6, 13, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = 'rgba(230,240,255,0.6)'; // neck
  ctx.beginPath();
  ctx.roundRect(-4.5, -13, 9, 8, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c98a5a'; // cork
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-4, -18, 8, 6, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ellipse(ctx, -6, 1, 2.2, 4, 0.4);
  ctx.fillStyle = '#ffffff';
  star(ctx, 13, -10, 3.4);
  star(ctx, -14, -8, 2.4);
}

// A helmet on a slime's head, in the slime's local space (origin at its feet, body w × h, facing +x).
// It's sized from w and h, so it squashes along with the jelly.
export function drawHelmet(ctx, id, w, h, t = 0) {
  id = artOf(id);
  const by = -h * 0.68; // brim line, just above the eyes
  const rx = w * 0.5, ry = h * 0.4;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (id === 'fur_hood') drawFurHood(ctx, w, h); // (src/fjord-art.js)
  else if (BRANCH_HELMETS[id]) BRANCH_HELMETS[id](ctx, w, h, t);
  else if (id === 'leaf_cap') {
    // overlapping big leaves, tips pointing down round the brim, a curly stem on top
    ctx.strokeStyle = '#4f9d5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.02, by - ry + 2);
    ctx.quadraticCurveTo(w * 0.04, by - ry - 7, w * 0.12, by - ry - 8);
    ctx.stroke();
    ctx.fillStyle = '#7fd06e';
    ellipse(ctx, w * 0.17, by - ry - 9, 5, 2.6, 0.3 + Math.sin(t * 4) * 0.12);
    ctx.fillStyle = '#6cc96a';
    ctx.beginPath();
    ctx.ellipse(0, by + 1, rx, ry, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4f9d5c';
    ctx.stroke();
    const n = 5;
    for (let i = 0; i < n; i++) {
      const lx = -rx + (2 * rx * (i + 0.5)) / n;
      ctx.fillStyle = i % 2 ? '#86d47a' : '#74cb6c';
      ctx.strokeStyle = '#4f9d5c';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(lx - rx / n - 1, by - ry * 0.35);
      ctx.quadraticCurveTo(lx - rx / n, by + 3, lx, by + 6);
      ctx.quadraticCurveTo(lx + rx / n, by + 3, lx + rx / n + 1, by - ry * 0.35);
      ctx.quadraticCurveTo(lx, by - ry * 0.55, lx - rx / n - 1, by - ry * 0.35);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(79,157,92,0.6)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(lx, by - ry * 0.4);
      ctx.lineTo(lx, by + 4);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(79,157,92,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-rx * 0.5, by - ry * 0.5);
    ctx.quadraticCurveTo(0, by - ry * 1.05, rx * 0.5, by - ry * 0.5);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipse(ctx, -rx * 0.4, by - ry * 0.7, rx * 0.2, ry * 0.12, -0.5);
  } else if (id === 'mush_helm') {
    // a red toadstool cap, wider than the head, cream gills under the rim
    const R = w * 0.6, top = by - h * 0.5;
    ctx.fillStyle = '#f5e2cc';
    ellipse(ctx, 0, by + 2, R * 0.86, 4.5);
    ctx.fillStyle = '#ef5a62';
    ctx.strokeStyle = '#b8323e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-R, by + 2);
    ctx.bezierCurveTo(-R, top - h * 0.1, R, top - h * 0.1, R, by + 2);
    ctx.quadraticCurveTo(0, by + 7, -R, by + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff8f0';
    for (const [sx, sy, sr] of [[-0.55, 0.35, 0.15], [0.05, 0.75, 0.19], [0.55, 0.32, 0.13], [-0.2, 0.3, 0.09], [0.3, 0.6, 0.08]]) {
      ellipse(ctx, sx * R, by - sy * (by - top), sr * R, sr * R * 0.75);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipse(ctx, -R * 0.4, by - (by - top) * 0.62, R * 0.16, 2.5, -0.6);
  } else if (id === 'glacier_helm') {
    drawGlacierHelm(ctx, w, h, t, by, rx);
  } else if (id === 'star_crown') {
    drawStarCrown(ctx, w, h, t, by, rx);
  } else if (id === 'ember_helm') {
    drawEmberHelm(ctx, w, h, t, by, rx, ry);
  } else if (id === 'phoenix_crown') {
    drawPhoenixCrown(ctx, w, h, t, by, rx);
  } else if (id === 'aether_helm') {
    drawAetherHelm(ctx, w, h, t, by, rx, ry);
  } else if (id === 'hourglass_crown') {
    drawHourglassCrown(ctx, w, h, t, by, rx);
  } else if (id === 'king_crown') {
    // the Sprout King's crown: a woven green band with tall leaf points and a flower bud at the front
    const cw = rx * 0.92, top = by - 2;
    const sway = Math.sin(t * 3) * 0.06;
    for (let i = 0; i < 5; i++) {
      const lx = -cw * 0.8 + (cw * 1.6 * i) / 4, tall = i === 2 ? 17 : i % 2 ? 12 : 14;
      ctx.save();
      ctx.translate(lx, top - 4);
      ctx.rotate((i - 2) * 0.18 + sway);
      ctx.fillStyle = i % 2 ? '#8fd07e' : '#6cc96a';
      ctx.strokeStyle = '#3f8a4c';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-4.5, 0);
      ctx.quadraticCurveTo(-5, -tall * 0.6, 0, -tall);
      ctx.quadraticCurveTo(5, -tall * 0.6, 4.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(63,138,76,0.6)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -1);
      ctx.lineTo(0, -tall + 3);
      ctx.stroke();
      ctx.restore();
    }
    // band: braided stems with a golden rim
    ctx.fillStyle = '#6aa85a';
    ctx.strokeStyle = '#3f8a4c';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-cw, top - 6, cw * 2, 9, 4.5);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#ffd36b';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-cw + 3, top + 1);
    ctx.lineTo(cw - 3, top + 1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(63,138,76,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -cw + 5; x < cw - 3; x += 5) {
      ctx.moveTo(x, top - 5);
      ctx.lineTo(x + 3, top - 1);
    }
    ctx.stroke();
    // flower bud jewel at the front
    ctx.fillStyle = '#ffb3c7';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      circle(ctx, cw * 0.35 + Math.cos(a) * 2.6, top - 2 + Math.sin(a) * 2.6, 2.2);
    }
    ctx.fillStyle = '#ffcf4d';
    circle(ctx, cw * 0.35, top - 2, 1.8);
  } else if (id === 'bramble_helm') {
    // woven living brambles: a dark plum dome criss-crossed with vines, thorns all round
    ctx.fillStyle = '#5e3a50';
    for (let i = 0; i < 9; i++) { // thorns round the outline
      const a = Math.PI * (1.05 + (i / 8) * 0.9);
      const ox = Math.cos(a) * rx, oy = by + 1 + Math.sin(a) * ry;
      const tx = Math.cos(a) * (rx + 7), ty = by + 1 + Math.sin(a) * (ry + 7);
      const px = -Math.sin(a) * 3.2, py = Math.cos(a) * 3.2;
      ctx.beginPath();
      ctx.moveTo(ox + px, oy + py);
      ctx.lineTo(tx, ty);
      ctx.lineTo(ox - px, oy - py);
      ctx.fill();
    }
    const g = ctx.createLinearGradient(0, by - ry, 0, by);
    g.addColorStop(0, '#9a6a8a');
    g.addColorStop(1, '#6e4660');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#4a2a40';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, by + 1, rx, ry, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, by + 1, rx - 1, ry - 1, 0, Math.PI, 0);
    ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = '#b088a4';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); // woven strands both ways
    for (let k = -3; k <= 3; k++) {
      ctx.moveTo(k * rx * 0.35 - rx * 0.4, by + 2);
      ctx.quadraticCurveTo(k * rx * 0.35, by - ry * 0.5, k * rx * 0.35 + rx * 0.4, by - ry - 2);
      ctx.moveTo(k * rx * 0.35 + rx * 0.4, by + 2);
      ctx.quadraticCurveTo(k * rx * 0.35, by - ry * 0.5, k * rx * 0.35 - rx * 0.4, by - ry - 2);
    }
    ctx.stroke();
    ctx.restore();
    // a twisted vine rim
    ctx.strokeStyle = '#5e3a50';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-rx - 1, by + 1);
    ctx.lineTo(rx + 1, by + 1);
    ctx.stroke();
    ctx.strokeStyle = '#8a5a7c';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = -rx; x < rx; x += 5) {
      ctx.moveTo(x, by + 3);
      ctx.lineTo(x + 3, by - 1);
    }
    ctx.stroke();
    // leaves and red berries tucked in
    ctx.fillStyle = '#7a9a5a';
    ellipse(ctx, -rx * 0.45, by - ry * 0.75, 5, 2.4, -0.5 + Math.sin(t * 3) * 0.1);
    ellipse(ctx, rx * 0.55, by - ry * 0.45, 4.5, 2.2, 0.6);
    ctx.fillStyle = '#e8506a';
    circle(ctx, rx * 0.3, by - ry * 0.8, 2.6);
    circle(ctx, rx * 0.42, by - ry * 0.7, 2.2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    circle(ctx, rx * 0.29, by - ry * 0.85, 0.8);
  } else {
    // iron: a rounded steel dome, a riveted band, a little crest and a pink plume
    const g = ctx.createLinearGradient(-rx, 0, rx, 0);
    g.addColorStop(0, '#f2f4fa');
    g.addColorStop(0.55, '#c9d0de');
    g.addColorStop(1, '#9aa3b8');
    // plume (behind)
    const wave = Math.sin(t * 5) * 0.12;
    ctx.save();
    ctx.translate(-w * 0.06, by - ry - 1);
    ctx.rotate(-0.5 + wave);
    ctx.fillStyle = '#ff8fb8';
    ctx.strokeStyle = '#d9608e';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-4, -12, -16, -14, -20, -6);
    ctx.bezierCurveTo(-14, -6, -8, -2, 0, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = g;
    ctx.strokeStyle = '#6f7790';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, by + 1, rx, ry, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // crest ridge
    ctx.strokeStyle = '#8a93a8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, by + 1, rx * 0.12, ry, 0, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    // band with rivets
    ctx.fillStyle = '#b3bbcc';
    ctx.strokeStyle = '#6f7790';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-rx - 1.5, by - 4, rx * 2 + 3, 7, 3.5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#eef1f7';
    for (let i = -2; i <= 2; i++) circle(ctx, i * rx * 0.42, by - 0.5, 1.3);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ellipse(ctx, -rx * 0.45, by - ry * 0.62, rx * 0.16, ry * 0.12, -0.6);
  }
  ctx.restore();
}

// Item icons for loot and the bag: id from ITEMS, centred at (x, y), fitting a size × size box.
export function drawItemIcon(ctx, id, x, y, size) {
  id = artOf(id);
  ctx.save();
  ctx.translate(x, y);
  const s = size / 40;
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (id === 'coin') iconCoins(ctx);
  else if (drawAlchemyIcon(ctx, id)) {
    // (herbs and brews: src/alchemy-art.js drew it)
  } else if (id === 'red_jelly' || id === 'blue_jelly' || id === 'mana_jelly') iconJelly(ctx, id);
  else if (id === 'sprout_leaf') iconLeaf(ctx);
  else if (id === 'mush_cap') iconCap(ctx);
  else if (id === 'thorn') iconThorn(ctx);
  else if (id === 'ice_shard') iconIceShard(ctx);
  else if (id === 'stardust') iconStardust(ctx);
  else if (id === 'elixir') iconElixir(ctx);
  else if (id === 'mega_elixir') iconMegaElixir(ctx);
  else if (id === 'ember_core') iconEmberCore(ctx);
  else if (id === 'obsidian_shard') iconObsidian(ctx);
  else if (id === 'cog') iconCog(ctx);
  else if (id === 'aether_crystal') iconAetherCrystal(ctx);
  else if (id.startsWith('scroll_')) iconScroll(ctx, id);
  else if (BRANCH_ICONS[id]) BRANCH_ICONS[id](ctx);
  else if (BOW_LEN[id]) {
    // the whole bow, tilted, scaled to fill the slot
    ctx.rotate(-Math.PI / 4);
    const k = Math.min(1.1, 46 / (2 * BOW_LEN[id] + 8));
    ctx.scale(k, k);
    ctx.translate(-3, 0);
    drawBow(ctx, id, 0, 0);
  } else if (STAFF_LEN[id]) {
    // a shortened shaft so the head (what tells staves apart) is big
    ctx.rotate(Math.PI / 4);
    ctx.scale(1.05, 1.05);
    ctx.translate(0, 15);
    drawStaff(ctx, id, 0, 0, 20);
  } else if (SWORD_LEN[id]) {
    const L = SWORD_LEN[id] + 11; // blade + grip
    const k = Math.min(1, 48 / L);
    ctx.rotate(Math.PI / 4);
    ctx.scale(k, k);
    ctx.translate(0, (SWORD_LEN[id] - 11) / 2);
    drawSword(ctx, id, 0);
  } else if (HELMETS.includes(id)) {
    // the same helmet, on an invisible 40 × 40 head (the showier late ones shrunk a little to fit)
    const fit = HELM_ICON_FIT[id];
    if (fit) {
      ctx.translate(0, fit[1]);
      ctx.scale(fit[0], fit[0]);
    }
    ctx.translate(0, 34);
    drawHelmet(ctx, id, 40, 44, 0);
  } else {
    ctx.fillStyle = '#d9c3e8';
    circle(ctx, 0, 0, 12);
  }
  ctx.restore();
}

function coin(ctx, x, y, rx = 11, ry = 4.5) {
  ctx.fillStyle = '#d9971f';
  ctx.strokeStyle = '#a8701a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(x, y + 2.5, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd23a';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#e8a82a';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.62, ry * 0.6, 0, 0, TAU);
  ctx.stroke();
}
function iconCoins(ctx) {
  coin(ctx, -2, 12);
  coin(ctx, 0, 6);
  coin(ctx, -3, 0);
  // one coin standing on its edge, face on
  ctx.fillStyle = '#ffd23a';
  ctx.strokeStyle = '#a8701a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(9, -6, 9.5, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#e8a82a';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(9, -6, 6, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#e8a82a';
  star(ctx, 9, -6, 3.6);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ellipse(ctx, 5.5, -10, 2, 1.2, -0.7);
  ctx.fillStyle = '#ffffff';
  star(ctx, -12, -8, 2.6);
}
const JELLY = {
  red_jelly: { top: '#ffb0c0', bot: '#ff5f7e', line: '#c93a5a', fruit: '#e8304a' },
  blue_jelly: { top: '#a8c8ff', bot: '#5b8def', line: '#3f68c0', fruit: '#4a5ab8' },
  mana_jelly: { top: '#dcc0ff', bot: '#9a62e0', line: '#6a3ab0', fruit: '#7a3ac8' },
};
function iconJelly(ctx, id) {
  const c = JELLY[id], blue = id === 'blue_jelly';
  // plate
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#c9c3d6';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 14, 16, 4.5, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // wobbly jelly dome
  const g = ctx.createLinearGradient(0, -12, 0, 14);
  g.addColorStop(0, c.top);
  g.addColorStop(1, c.bot);
  ctx.fillStyle = g;
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-13, 13);
  ctx.bezierCurveTo(-15, 0, -12, -9, -8, -9);
  ctx.lineTo(8, -9);
  ctx.bezierCurveTo(12, -9, 15, 0, 13, 13);
  ctx.quadraticCurveTo(0, 16, -13, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // ridges
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (const x of [-6, 0, 6]) {
    ctx.moveTo(x, -7);
    ctx.quadraticCurveTo(x * 1.25, 3, x * 1.4, 12);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ellipse(ctx, -8, -2, 2, 5, 0.15);
  // cream and a berry on top
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = '#e0d4c4';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, -10, 7, 3.6, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -13, 4, 3, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c.fruit;
  if (blue) {
    circle(ctx, -1.5, -16.5, 3.4);
    circle(ctx, 2.8, -15.5, 2.8);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    circle(ctx, -2.5, -17.5, 1);
  } else if (id === 'mana_jelly') {
    // a little bunch of grapes with a leaf
    for (const [gx, gy] of [[-3, -17], [0.5, -17.5], [4, -16.8], [-1.5, -14.2], [2.2, -14], [0.3, -11.6]]) {
      ctx.fillStyle = c.fruit;
      circle(ctx, gx, gy, 2.3);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      circle(ctx, gx - 0.7, gy - 0.8, 0.7);
    }
    ctx.fillStyle = '#6cc96a';
    ellipse(ctx, 3, -20.5, 3, 1.4, -0.4);
    ctx.strokeStyle = '#4f9d5c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0.5, -19.5);
    ctx.lineTo(0, -21.5);
    ctx.stroke();
  } else {
    ctx.beginPath(); // a strawberry
    ctx.moveTo(-4, -17);
    ctx.quadraticCurveTo(0, -20, 4, -17);
    ctx.quadraticCurveTo(3, -11, 0, -11);
    ctx.quadraticCurveTo(-3, -11, -4, -17);
    ctx.fill();
    ctx.fillStyle = '#fff1a8';
    for (const [sx, sy] of [[-1.5, -15.5], [1.5, -15.5], [0, -13]]) circle(ctx, sx, sy, 0.6);
    ctx.fillStyle = '#6cc96a';
    ellipse(ctx, -1.5, -18.2, 2.2, 1, -0.3);
    ellipse(ctx, 1.5, -18.2, 2.2, 1, 0.3);
  }
}
function iconLeaf(ctx) {
  ctx.rotate(-0.5);
  ctx.strokeStyle = '#4f9d5c';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.quadraticCurveTo(-3, 20, -6, 18);
  ctx.stroke();
  ctx.fillStyle = '#7fd06e';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.bezierCurveTo(-16, 6, -12, -12, 0, -18);
  ctx.bezierCurveTo(12, -12, 16, 6, 0, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#a3e48d';
  ellipse(ctx, -4, -6, 3, 6, 0.3);
  ctx.strokeStyle = '#4f9d5c';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.lineTo(0, -14);
  for (const y of [-8, -2, 4]) {
    ctx.moveTo(0, y + 3);
    ctx.lineTo(-6, y - 1);
    ctx.moveTo(0, y + 3);
    ctx.lineTo(6, y - 1);
  }
  ctx.stroke();
}
function iconCap(ctx) {
  ctx.fillStyle = '#f5d2c2';
  ctx.strokeStyle = '#c9907a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 8, 15, 4.5, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(201,144,122,0.6)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let k = -3; k <= 3; k++) {
    ctx.moveTo(k * 2, 8);
    ctx.lineTo(k * 4.5, 10.5);
  }
  ctx.stroke();
  const g = ctx.createLinearGradient(0, -14, 0, 8);
  g.addColorStop(0, '#ffc2b0');
  g.addColorStop(1, '#ff9a92');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#d9707a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-18, 7);
  ctx.bezierCurveTo(-18, -20, 18, -20, 18, 7);
  ctx.quadraticCurveTo(0, 12, -18, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff8f0';
  ellipse(ctx, -8, -2, 3.5, 2.7);
  ellipse(ctx, 2, -9, 4.2, 3);
  ellipse(ctx, 10, -1, 2.8, 2.1);
  ellipse(ctx, -1, 1.5, 2, 1.5);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ellipse(ctx, -9, -8, 3.5, 1.6, -0.6);
}
function iconThorn(ctx) {
  ctx.rotate(0.3);
  const g = ctx.createLinearGradient(-8, 14, 6, -18);
  g.addColorStop(0, '#8a5a7c');
  g.addColorStop(1, '#c49ab8');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#5e3a55';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-9, 14);
  ctx.quadraticCurveTo(-8, -2, 6, -18);
  ctx.quadraticCurveTo(1, -2, 9, 14);
  ctx.quadraticCurveTo(0, 17, -9, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(-4, 10);
  ctx.quadraticCurveTo(-3, -1, 3, -11);
  ctx.quadraticCurveTo(-1, 0, -1.5, 10);
  ctx.fill();
  // a second little thorn
  ctx.fillStyle = '#9a6a8a';
  ctx.beginPath();
  ctx.moveTo(6, 6);
  ctx.quadraticCurveTo(10, 2, 15, 1);
  ctx.quadraticCurveTo(11, 6, 8, 10);
  ctx.fill();
  ctx.stroke();
}
