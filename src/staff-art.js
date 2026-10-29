// Docs: docs/combat/items.md
// Staves (S1, story/progression.md): every staff is a shaft plus a head, described in STAFFS (length, shaft
// colours, head shape, gem colour, glow), and drawn by drawStaff with its grip at the origin and the head
// pointing up (-y), the same way drawSword draws a sword (src/field.js), so the bag icon, the staff on a
// slime's back and the cast all share it. staffGlow gives the colour of its bolt (src/skillfx.js).

import { artOf } from './shared/rpg.js';

const TAU = Math.PI * 2;
const circle = (ctx, x, y, r) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
};
const ellipse = (ctx, x, y, rx, ry, rot = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
};
const LINE = '#3a3350';

// len: the shaft from the grip to the head · shaft: [light, dark] · w: half-width at the grip ·
// head: the shape on top (HEADS) · gem / gem2: its colours · glow: 'r,g,b' of the light round the head and of the bolt ·
// ribbon: 'r,g,b' of a ribbon of light wound up the shaft (Fenrir's Gleipnir Staff)
export const STAFFS = {
  wood_staff: { len: 44, shaft: ['#c99a68', '#8c6440'], w: 2.6, head: 'twig', gem: '#ffe9a0', glow: '255,236,170' },
  iron_staff: { len: 50, shaft: ['#a07a58', '#6e5038'], w: 2.6, head: 'ring', gem: '#7fb4ff', gem2: '#c9ced9', glow: '150,190,255' },
  crystal_staff: { len: 54, shaft: ['#f4eef6', '#c7b8d4'], w: 2.6, head: 'crystal', gem: '#ffb3e0', gem2: '#e48ad0', glow: '255,170,230' },
  spore_staff: { len: 52, shaft: ['#efe2c6', '#bba57e'], w: 3, head: 'cap', gem: '#ff8f8f', gem2: '#fff4ea', glow: '255,190,170' },
  thorn_staff: { len: 58, shaft: ['#7fae5f', '#4e7a3c'], w: 2.8, head: 'crook', gem: '#ff6f86', glow: '255,120,150' },
  frost_staff: { len: 60, shaft: ['#dff3ff', '#93c6e8'], w: 2.6, head: 'flake', gem: '#bfe9ff', gem2: '#ffffff', glow: '170,225,255' },
  star_staff: { len: 62, shaft: ['#eef0fa', '#a9aec9'], w: 2.4, head: 'star', gem: '#ffe680', gem2: '#fff8d0', glow: '255,232,140' },
  magma_staff: { len: 62, shaft: ['#5a4a52', '#2f2630'], w: 3, head: 'ember', gem: '#ff8a3c', gem2: '#ffd36a', glow: '255,150,80' },
  phoenix_staff: { len: 64, shaft: ['#ffd98a', '#d09a3a'], w: 2.6, head: 'feather', gem: '#ff7a4a', gem2: '#ffd36a', glow: '255,190,90' },
  cog_staff: { len: 66, shaft: ['#e8c47a', '#a8803a'], w: 2.8, head: 'gear', gem: '#ffdb8a', gem2: '#8adcd0', glow: '255,220,150' },
  chrono_staff: { len: 68, shaft: ['#e6d090', '#a88e4a'], w: 2.6, head: 'hourglass', gem: '#c8b0ff', gem2: '#ffe9a8', glow: '200,170,255' },
  reed_staff: { len: 54, shaft: ['#c9d88a', '#8ea050'], w: 2.4, head: 'cattail', gem: '#9a6a44', glow: '230,240,170' },
  drift_staff: { len: 56, shaft: ['#e6ddcf', '#b0a28c'], w: 3, head: 'roots', gem: '#8fe6d0', gem2: '#d8fff4', glow: '150,235,215' },
  tide_staff: { len: 60, shaft: ['#ffb4bf', '#e07a8c'], w: 2.8, head: 'coral', gem: '#fff6f0', gem2: '#ffb4bf', glow: '255,200,210' },
  glowcap_staff: { len: 58, shaft: ['#8a6a54', '#5a4232'], w: 2.8, head: 'cap', gem: '#7fd0ff', gem2: '#e0f6ff', glow: '130,210,255' },
  knot_staff: { len: 62, shaft: ['#9a7656', '#634a34'], w: 3, head: 'knot', gem: '#ffd36a', glow: '255,215,120' },
  oak_staff: { len: 60, shaft: ['#a8825a', '#6e5236'], w: 3, head: 'leaf', gem: '#c99252', gem2: '#7fc46a', glow: '190,240,160' },
  honey_staff: { len: 62, shaft: ['#4a3e3a', '#2a2220'], w: 2.6, head: 'comb', gem: '#ffc44a', gem2: '#ffe59a', glow: '255,200,90', band: '#e6a83a' },
  bosun_staff: { len: 64, shaft: ['#9a7a5a', '#5e4630'], w: 2.8, head: 'lantern', gem: '#8affc0', gem2: '#d6b25a', glow: '140,255,190' },
  hart_staff: { len: 66, shaft: ['#7a6a54', '#4a3e30'], w: 2.8, head: 'antler', gem: '#fff4f6', gem2: '#e8d6b4', glow: '255,240,245' },
  neck_staff: { len: 66, shaft: ['#2e3a26', '#141e10'], w: 2.8, head: 'roots', gem: '#fbfff6', gem2: '#c8f0a0', glow: '240,255,235' },
  gatehound_staff: { len: 66, shaft: ['#2a3448', '#0e121c'], w: 2.8, head: 'crystal', gem: '#dfeeff', gem2: '#4a6aa8', glow: '200,230,255' },
  sentinel_staff: { len: 64, shaft: ['#c4c0d0', '#8a8698'], w: 2.8, head: 'eyestone', gem: '#ffcf7a', gem2: '#a8a4b4', glow: '255,205,120' },
  glacier_staff: { len: 62, shaft: ['#7a6a5c', '#4a3e34'], w: 2.8, head: 'crystal', gem: '#bfe6ff', gem2: '#7fbfe8', glow: '170,225,255' },
  howl_staff: { len: 64, shaft: ['#c8d0dc', '#7a8494'], w: 2.8, head: 'flake', gem: '#e8f4ff', gem2: '#ffffff', glow: '200,235,255' },
  tusk_staff: { len: 68, shaft: ['#f2e6c8', '#c8b48a'], w: 3, head: 'crook', gem: '#ffd8a8', glow: '255,230,200' },
  driftbone_staff: { len: 62, shaft: ['#efe8d6', '#b8ae96'], w: 2.8, head: 'ring', gem: '#bfe6ff', gem2: '#efe8d6', glow: '200,235,255' },
  ivory_staff: { len: 64, shaft: ['#8a6a50', '#5a4434'], w: 2.8, head: 'crook', gem: '#f4ecd8', glow: '255,245,225' },
  narwhal_staff: { len: 68, shaft: ['#fbf6e8', '#d8cbb0'], w: 3, head: 'crystal', gem: '#d8f0ff', gem2: '#8ac4e8', glow: '200,235,255' },
  skate_staff: { len: 66, shaft: ['#c8d8d0', '#7a948a'], w: 2.8, head: 'leaf', gem: '#8ab8a8', gem2: '#4e7a6e', glow: '200,255,235' },
  foxfire_staff: { len: 64, shaft: ['#f2f2ec', '#b8b8ae'], w: 2.8, head: 'flake', gem: '#bfffe0', gem2: '#7ae0b8', glow: '150,240,200' },
  pale_star_staff: { len: 70, shaft: ['#dce8fa', '#8a9ac0'], w: 3, head: 'star', gem: '#ffffff', gem2: '#c8dcff', glow: '220,235,255' },
  prism_staff: { len: 66, shaft: ['#a8d0fa', '#4e7ab8'], w: 2.8, head: 'crystal', gem: '#e0ecff', gem2: '#7aa0ff', glow: '150,190,255' },
  troll_staff: { len: 66, shaft: ['#8a6a48', '#5a4434'], w: 3.4, head: 'crystal', gem: '#8ec4f0', gem2: '#2e5a8a', glow: '140,190,255' },
  rimeguard_staff: { len: 64, shaft: ['#e0e4ee', '#8a90a8'], w: 2.8, head: 'crystal', gem: '#e2f0fc', gem2: '#8ab8e0', glow: '200,230,255' },
  oath_staff: { len: 70, shaft: ['#c8b498', '#6a5a44'], w: 3, head: 'shield', gem: '#e2f0fc', gem2: '#3e6294', glow: '190,226,255' },
  warden_staff: { len: 68, shaft: ['#b0acc0', '#76728a'], w: 3.2, head: 'rootcrook', gem: '#ffcf7a', gem2: '#7aa05e', glow: '255,200,110' },
  unsleeping_staff: { len: 70, shaft: ['#34482c', '#141e10'], w: 3, head: 'thornskull', gem: '#fbfff6', gem2: '#4e7a3e', glow: '220,255,200' }, // (Ladon's: src/ladon-art.js has the rest)
  white_rose_rod: { len: 68, shaft: ['#4e6a3e', '#22301e'], w: 2.8, head: 'whiterose', gem: '#fbf6f0', gem2: '#7aa05e', glow: '250,246,232' },
  gleipnir_staff: { len: 72, shaft: ['#5a6476', '#262c3a'], w: 3, head: 'gleipnir', gem: '#f4f8ff', gem2: '#8aa0c8', glow: '226,236,255', ribbon: '226,236,255' }, // (Fenrir's: src/fenrir-art.js has the rest)
  lantern_rod: { len: 70, shaft: ['#7a8090', '#3a404c'], w: 2.9, head: 'lantern', gem: '#ffe2a0', gem2: '#3a404c', glow: '255,220,150' },
  bellows_rod: { len: 62, shaft: ['#8a8490', '#4e4a56'], w: 2.8, head: 'ring', gem: '#ff8a3c', gem2: '#5e5a66', glow: '255,150,80' },
  // the Black Sands (E1, docs/places/blacksands.md)
  blackglass_staff: { len: 64, shaft: ['#6a6470', '#36323c'], w: 2.8, head: 'crystal', gem: '#3a3446', gem2: '#8ad0c0', glow: '160,230,215' },
  bellower_staff: { len: 66, shaft: ['#5a5058', '#2e2830'], w: 3.2, head: 'ember', gem: '#3a3240', gem2: '#ffb46a', glow: '255,170,110' },
  // the Ashwood (E1, docs/places/ashwood.md)
  deadwood_staff: { len: 64, shaft: ['#4a4248', '#24202a'], w: 3, head: 'twig', gem: '#ff8a4a', gem2: '#3a3238', glow: '255,140,80' },
  foxember_staff: { len: 64, shaft: ['#8a8490', '#4e4a56'], w: 2.8, head: 'ember', gem: '#5a5058', gem2: '#ff6a3a', glow: '255,120,70' },
  brand_staff: { len: 70, shaft: ['#3a3236', '#1a1618'], w: 3.4, head: 'ember', gem: '#2a2426', gem2: '#ffa050', glow: '255,160,90' },
  // the Smoking Coast (E2, docs/places/coast.md)
  quench_staff: { len: 64, shaft: ['#7a7884', '#3e3c48'], w: 2.8, head: 'crystal', gem: '#1e1c26', gem2: '#9adce8', glow: '170,225,240' },
  scaldbarb_staff: { len: 66, shaft: ['#8a8490', '#4a4652'], w: 2.8, head: 'crystal', gem: '#2a2430', gem2: '#f0f0f0', glow: '235,240,245' },
  // the Drained Tubes (E2, docs/places/tubes.md)
  adderglass_staff: { len: 64, shaft: ['#8a8490', '#4a4652'], w: 2.8, head: 'crystal', gem: '#1e1a22', gem2: '#ff6a4a', glow: '255,120,90' },
  hundred_staff: { len: 70, shaft: ['#3e383e', '#1c181e'], w: 3.2, head: 'ember', gem: '#2a2428', gem2: '#ff8a3a', glow: '255,140,70' }, // (Hundredfoot's: jointed segments)
  nestfire_staff: { len: 68, shaft: ['#6a6470', '#2e2a32'], w: 3, head: 'ember', gem: '#1e1c26', gem2: '#ff9a5a', glow: '255,160,110' }, // (the Hatchkeeper's: a black-glass egg, an ember inside)
  // the Brimstone Fields (E3a, docs/places/brimstone.md)
  pick_staff: { len: 64, shaft: ['#8a6a48', '#5a4430'], w: 3, head: 'crystal', gem: '#c8a020', gem2: '#fff07a', glow: '255,230,110' }, // (Ochre's: an old yoke pole, a lump of sulphur)
  kitetalon_staff: { len: 66, shaft: ['#8a8490', '#4e4a56'], w: 2.8, head: 'crystal', gem: '#a8781e', gem2: '#ffe060', glow: '255,220,100' },
  pinion_staff: { len: 70, shaft: ['#4a4448', '#24202a'], w: 3.2, head: 'feather', gem: '#6a6268', gem2: '#9a9298', glow: '255,214,120' }, // (the Condor's: slag-iron feathers)
  // the Old Foundry (E3b, docs/places/foundry.md)
  sootfang_staff: { len: 64, shaft: ['#3a3436', '#1a1618'], w: 2.8, head: 'crystal', gem: '#1e1a1c', gem2: '#ff5a40', glow: '255,100,80' }, // (a hound's fang, smoking)
  crucible_staff: { len: 70, shaft: ['#5a5460', '#2e2a32'], w: 3.2, head: 'ember', gem: '#2a2426', gem2: '#ffb040', glow: '255,150,60' }, // (Old Crucible's: a little crucible of molten metal)
  // the Caldera Rim (E4a, docs/places/rim.md)
  cragbeak_staff: { len: 68, shaft: ['#3a3438', '#1c181e'], w: 3, head: 'feather', gem: '#2a2428', gem2: '#6a6a84', glow: '230,236,255' }, // (a roc's beak, a shimmer bead in its jaw)
  twinfang_staff: { len: 68, shaft: ['#2e2a2c', '#141012'], w: 3, head: 'fang', gem: '#1c1416', gem2: '#ff7a3a', glow: '255,120,60' }, // (E5 (b): Orthrus's, two fangs and a coal between them)
  bearer_staff: { len: 70, shaft: ['#5a4a40', '#2e2420'], w: 3.2, head: 'gear', gem: '#6e6870', gem2: '#e8f2ff', glow: '214,232,255' }, // (Brenna's, E4b: a little toothed block strapped on, a shard of light in it)
};
export const STAFF_LEN = Object.fromEntries(Object.entries(STAFFS).map(([id, s]) => [id, s.len]));
export const staffGlow = (id) => STAFFS[artOf(id)]?.glow ?? '190,200,255';

// A soft light behind the head (stronger while casting)
function halo(ctx, s, y, r, a) {
  const g = ctx.createRadialGradient(0, y, 1, 0, y, r);
  g.addColorStop(0, `rgba(${s.glow},${a})`);
  g.addColorStop(1, `rgba(${s.glow},0)`);
  ctx.fillStyle = g;
  circle(ctx, 0, y, r);
  ctx.fill();
}
function gem(ctx, x, y, r, c, shine = true) {
  ctx.fillStyle = c;
  circle(ctx, x, y, r);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  if (shine) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.32);
    ctx.fill();
  }
}

// The heads: (ctx, s, top y, time, glow 0..1)
const HEADS = {
  // a bent twig with a little spark caught in its fork
  twig(ctx, s, y, t) {
    ctx.strokeStyle = s.shaft[1];
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, y + 6);
    ctx.quadraticCurveTo(-6, y, -7, y - 6);
    ctx.moveTo(0, y + 4);
    ctx.quadraticCurveTo(5, y - 1, 4, y - 7);
    ctx.stroke();
    ctx.fillStyle = '#8fd47a';
    ellipse(ctx, -8, y - 7, 3.2, 1.8, -0.7);
    ctx.fill();
    gem(ctx, -1, y - 2, 2.6 + Math.sin(t * 6) * 0.4, s.gem, false);
  },
  // an iron ring holding a stone
  ring(ctx, s, y) {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 4.6;
    circle(ctx, 0, y - 4, 7);
    ctx.stroke();
    ctx.strokeStyle = s.gem2;
    ctx.lineWidth = 2.6;
    ctx.stroke();
    gem(ctx, 0, y - 4, 3.8, s.gem);
  },
  // a long faceted crystal
  crystal(ctx, s, y) {
    ctx.fillStyle = s.gem;
    ctx.beginPath();
    ctx.moveTo(0, y - 16);
    ctx.lineTo(5.5, y - 6);
    ctx.lineTo(3.5, y + 3);
    ctx.lineTo(-3.5, y + 3);
    ctx.lineTo(-5.5, y - 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.fillStyle = s.gem2;
    ctx.beginPath();
    ctx.moveTo(0, y - 16);
    ctx.lineTo(5.5, y - 6);
    ctx.lineTo(3.5, y + 3);
    ctx.lineTo(0, y + 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ellipse(ctx, -2, y - 7, 1.1, 4, 0.1);
    ctx.fill();
  },
  // a mushroom cap with spots (Mother Mushroom's red, Truffle's glowing blue)
  cap(ctx, s, y) {
    ctx.fillStyle = s.gem;
    ctx.beginPath();
    ctx.moveTo(-11, y + 1);
    ctx.quadraticCurveTo(-11, y - 12, 0, y - 12);
    ctx.quadraticCurveTo(11, y - 12, 11, y + 1);
    ctx.quadraticCurveTo(0, y - 2, -11, y + 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = s.gem2;
    for (const [dx, dy, r] of [[-5, -6, 2.2], [3, -8, 1.8], [6.5, -3, 1.4], [-1, -3, 1.2]]) {
      circle(ctx, dx, y + dy, r);
      ctx.fill();
    }
  },
  // the briar's crook, curling over a glowing thornberry
  crook(ctx, s, y) {
    ctx.strokeStyle = s.shaft[1];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y + 4);
    ctx.bezierCurveTo(0, y - 10, 12, y - 12, 10, y - 3);
    ctx.stroke();
    ctx.strokeStyle = s.shaft[0];
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = s.shaft[1];
    for (const [x0, y0, a] of [[-1, y - 4, -2.4], [5, y - 10, -1.2], [11, y - 7, 0.2]]) {
      ctx.save();
      ctx.translate(x0, y0);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -1.4);
      ctx.lineTo(4, 0);
      ctx.lineTo(0, 1.4);
      ctx.fill();
      ctx.restore();
    }
    gem(ctx, 8.5, y + 1.5, 3.2, s.gem);
  },
  // a six-armed snowflake
  flake(ctx, s, y, t) {
    ctx.save();
    ctx.translate(0, y - 7);
    ctx.rotate(t * 0.6);
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.rotate(TAU / 6);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -9);
      ctx.moveTo(0, -5);
      ctx.lineTo(3, -7.5);
      ctx.moveTo(0, -5);
      ctx.lineTo(-3, -7.5);
      ctx.stroke();
      ctx.strokeStyle = s.gem;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
    ctx.restore();
    gem(ctx, 0, y - 7, 2.6, s.gem2, false);
  },
  // a fallen star
  star(ctx, s, y, t) {
    ctx.save();
    ctx.translate(0, y - 7);
    ctx.rotate(Math.sin(t * 2) * 0.15);
    ctx.fillStyle = s.gem;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * TAU, r = i % 2 ? 4.4 : 10;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = s.gem2;
    circle(ctx, -1.5, -1.5, 2.4);
    ctx.fill();
    ctx.restore();
  },
  // a cup of black rock holding a molten orb
  ember(ctx, s, y, t) {
    gem(ctx, 0, y - 6, 6 + Math.sin(t * 5) * 0.5, s.gem, false);
    ctx.fillStyle = s.gem2;
    circle(ctx, -1.5, y - 7.5, 2.6);
    ctx.fill();
    ctx.fillStyle = s.shaft[1];
    ctx.beginPath();
    ctx.moveTo(-9, y - 8);
    ctx.lineTo(-5, y - 2);
    ctx.lineTo(0, y + 3);
    ctx.lineTo(5, y - 2);
    ctx.lineTo(9, y - 8);
    ctx.lineTo(6, y - 1);
    ctx.lineTo(0, y + 6);
    ctx.lineTo(-6, y - 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  },
  // a fan of flame-feathers
  feather(ctx, s, y, t) {
    for (const [a, l, c] of [[-0.6, 13, s.gem], [0.6, 13, s.gem], [-0.25, 17, s.gem2], [0.25, 17, s.gem2], [0, 20, '#fff2c0']]) {
      ctx.save();
      ctx.translate(0, y + 2);
      ctx.rotate(a + Math.sin(t * 7 + a * 4) * 0.05);
      ctx.fillStyle = c;
      ellipse(ctx, 0, -l / 2, 3.2, l / 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(58,51,80,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  },
  // a turning gear with a teal light in the hub
  gear(ctx, s, y, t) {
    ctx.save();
    ctx.translate(0, y - 7);
    ctx.rotate(t * 1.4);
    ctx.fillStyle = s.gem;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU, r = i % 2 ? 8 : 10.5;
      ctx.lineTo(Math.cos(a - 0.12) * r, Math.sin(a - 0.12) * r);
      ctx.lineTo(Math.cos(a + 0.12) * r, Math.sin(a + 0.12) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.restore();
    gem(ctx, 0, y - 7, 3.6, s.gem2);
  },
  // an hourglass in a brass frame, its sand running up
  hourglass(ctx, s, y, t) {
    const top = y - 18, bot = y;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(-6, top + 2);
    ctx.lineTo(6, top + 2);
    ctx.lineTo(1, (top + bot) / 2);
    ctx.lineTo(6, bot - 2);
    ctx.lineTo(-6, bot - 2);
    ctx.lineTo(-1, (top + bot) / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    const k = (t * 0.25) % 1; // sand climbing into the top bulb
    ctx.fillStyle = s.gem2;
    ctx.beginPath();
    ctx.moveTo(-5 * (1 - k * 0.6), bot - 2);
    ctx.lineTo(5 * (1 - k * 0.6), bot - 2);
    ctx.lineTo(1, (top + bot) / 2 + 1);
    ctx.lineTo(-1, (top + bot) / 2 + 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = s.gem;
    ellipse(ctx, 0, top + 4 + 2 * (1 - k), 4 * k + 1, 1.6 * k + 0.6);
    ctx.fill();
    ctx.fillStyle = s.shaft[0];
    ctx.strokeStyle = LINE;
    for (const yy of [top, bot - 1]) {
      ctx.beginPath();
      ctx.roundRect(-8, yy - 1.5, 16, 3.5, 1.5);
      ctx.fill();
      ctx.stroke();
    }
  },
  // a cattail head and two reed leaves
  cattail(ctx, s, y) {
    ctx.strokeStyle = '#8ea050';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y + 4);
    ctx.quadraticCurveTo(-7, y - 2, -9, y - 12);
    ctx.moveTo(0, y + 3);
    ctx.quadraticCurveTo(6, y - 3, 8, y - 10);
    ctx.stroke();
    ctx.fillStyle = s.gem;
    ctx.beginPath();
    ctx.roundRect(-3, y - 16, 6, 15, 3);
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = s.shaft[0];
    ctx.beginPath();
    ctx.moveTo(0, y - 16);
    ctx.lineTo(0, y - 21);
    ctx.stroke();
  },
  // driftwood roots clutching a ball of sea glass
  roots(ctx, s, y) {
    gem(ctx, 0, y - 7, 6, s.gem);
    ctx.fillStyle = s.gem2;
    circle(ctx, -2, y - 9, 2);
    ctx.fill();
    ctx.strokeStyle = s.shaft[1];
    ctx.lineWidth = 2.4;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, y + 4);
      ctx.bezierCurveTo(d * 9, y, d * 9, y - 10, d * 3, y - 14);
      ctx.stroke();
    }
  },
  // a branch of coral with a pearl in its fork
  coral(ctx, s, y) {
    ctx.strokeStyle = s.shaft[1];
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(0, y + 4);
    ctx.quadraticCurveTo(-8, y - 2, -9, y - 13);
    ctx.moveTo(-6, y - 5);
    ctx.lineTo(-12, y - 8);
    ctx.moveTo(0, y + 2);
    ctx.quadraticCurveTo(8, y - 3, 8, y - 15);
    ctx.moveTo(6, y - 7);
    ctx.lineTo(12, y - 10);
    ctx.stroke();
    ctx.strokeStyle = s.shaft[0];
    ctx.lineWidth = 1.6;
    ctx.stroke();
    gem(ctx, 0, y - 5, 3.6, s.gem);
  },
  // a root tied in a loop round a golden light
  knot(ctx, s, y, t) {
    halo(ctx, s, y - 8, 9, 0.5 + Math.sin(t * 3) * 0.15);
    ctx.strokeStyle = s.shaft[1];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y + 4);
    ctx.bezierCurveTo(-12, y - 4, -6, y - 18, 0, y - 15);
    ctx.bezierCurveTo(8, y - 12, 8, y - 2, -4, y - 4);
    ctx.stroke();
    ctx.strokeStyle = s.shaft[0];
    ctx.lineWidth = 1.4;
    ctx.stroke();
    gem(ctx, 0, y - 9, 2.8, s.gem, false);
  },
  // oak leaves and an acorn
  leaf(ctx, s, y, t) {
    for (const [a, c] of [[-0.9, s.gem2], [0.9, s.gem2], [0, '#9bd67e']]) {
      ctx.save();
      ctx.translate(0, y + 1);
      ctx.rotate(a + Math.sin(t * 2 + a) * 0.06);
      ctx.fillStyle = c;
      ellipse(ctx, 0, -8, 4, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(58,51,80,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = s.gem;
    ellipse(ctx, 0, y - 13, 3.6, 4.4);
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#8a6440';
    ellipse(ctx, 0, y - 16.5, 4.2, 2);
    ctx.fill();
    ctx.stroke();
  },
  // a ball of golden comb, dripping
  comb(ctx, s, y, t) {
    gem(ctx, 0, y - 8, 8, s.gem, false);
    ctx.strokeStyle = 'rgba(160,100,30,0.6)';
    ctx.lineWidth = 1;
    for (const [hx, hy] of [[-3, -11], [3, -11], [0, -6], [-5, -5], [5, -5]]) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) ctx.lineTo(hx + Math.cos((i / 6) * TAU) * 2.4, y + hy + Math.sin((i / 6) * TAU) * 2.4);
      ctx.closePath();
      ctx.stroke();
    }
    const d = (t * 0.7) % 1; // a drip slowly falling
    ctx.fillStyle = s.gem2;
    ellipse(ctx, 3, y + d * 6, 1.6, 2.2);
    ctx.fill();
    ctx.fillStyle = s.band;
    ctx.fillRect(-3, y + 1, 6, 2.5);
  },
  // a ship's lantern with a cold green flame
  lantern(ctx, s, y, t) {
    ctx.strokeStyle = s.shaft[1];
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, y + 4);
    ctx.quadraticCurveTo(0, y - 10, 6, y - 12);
    ctx.stroke();
    const lx = 6, ly = y - 1;
    ctx.strokeStyle = s.gem2;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(lx, y - 12);
    ctx.lineTo(lx, ly - 7);
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,255,225,0.5)';
    ctx.beginPath();
    ctx.roundRect(lx - 4.5, ly - 7, 9, 11, 2.5);
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.stroke();
    ctx.fillStyle = s.gem;
    ellipse(ctx, lx, ly - 1 + Math.sin(t * 9) * 0.4, 2, 3.4 + Math.sin(t * 7) * 0.4);
    ctx.fill();
    ctx.fillStyle = s.gem2;
    ctx.fillRect(lx - 5, ly - 8, 10, 2);
    ctx.fillRect(lx - 5, ly + 3, 10, 2);
  },
  // two antler tines with a white rose bud between them
  antler(ctx, s, y) {
    for (const [c, lw] of [[LINE, 4.6], [s.gem2, 2.8]]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = lw;
      for (const d of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, y + 4);
        ctx.quadraticCurveTo(d * 9, y - 2, d * 10, y - 16);
        ctx.moveTo(d * 7, y - 4);
        ctx.lineTo(d * 13, y - 8);
        ctx.moveTo(d * 9, y - 10);
        ctx.lineTo(d * 5, y - 15);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#7fae5f';
    ellipse(ctx, 0, y - 2, 2.4, 3.4);
    ctx.fill();
    ctx.fillStyle = s.gem;
    ellipse(ctx, 0, y - 7, 3.4, 4.4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(58,51,80,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  },
  // a Keeper sentinel's eye-stone: an amber stone in a ring of grey stone cut with gear teeth
  eyestone(ctx, s, y, t, glow) {
    ctx.fillStyle = s.gem2;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 9, y - 8 + Math.sin(a) * 9, 2.4, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    circle(ctx, 0, y - 8, 9);
    ctx.fill();
    ctx.stroke();
    gem(ctx, 0, y - 8, 5 + glow, s.gem);
  },
  // the Warden's: a grey stone crook wound round with roots, a sprig of leaves, the amber light in its curl
  rootcrook(ctx, s, y) {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 6.4;
    ctx.beginPath();
    ctx.moveTo(0, y + 4);
    ctx.lineTo(0, y - 10);
    ctx.arc(6, y - 10, 6, Math.PI, Math.PI * 2.1);
    ctx.stroke();
    ctx.strokeStyle = s.shaft[0];
    ctx.lineWidth = 4;
    ctx.stroke();
    gem(ctx, 6, y - 9, 3.6, s.gem);
    ctx.strokeStyle = '#5a4030';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-3, y + 6);
    ctx.lineTo(3, y);
    ctx.lineTo(-3, y - 6);
    ctx.lineTo(2, y - 13);
    ctx.quadraticCurveTo(8, y - 19, 12, y - 13);
    ctx.stroke();
    ctx.fillStyle = s.gem2;
    ellipse(ctx, 14, y - 16, 3.4, 2, 0.5);
    ctx.fill();
  },
  // Ladon's Unsleeping Staff: a little woven thorn skull, its two white rose eyes wide open (brighter as it casts)
  thornskull(ctx, s, y, t, glow) {
    ctx.fillStyle = s.gem2;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(d * 8, y - 6, 5, 2.2, d * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = s.shaft[1];
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-7, y - 4);
    ctx.quadraticCurveTo(-8, y - 17, 0, y - 18);
    ctx.quadraticCurveTo(8, y - 17, 7, y - 4);
    ctx.quadraticCurveTo(0, y + 3, -7, y - 4);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = s.shaft[0];
    ctx.lineWidth = 1.2;
    for (const k of [-11, -7]) {
      ctx.beginPath();
      ctx.moveTo(-6, y + k);
      ctx.lineTo(6, y + k - 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#e8e0cc';
    for (const x of [-3, 0, 3]) {
      ctx.beginPath();
      ctx.moveTo(x - 1.2, y - 3);
      ctx.lineTo(x, y + 0.5);
      ctx.lineTo(x + 1.2, y - 3);
      ctx.fill();
    }
    const blink = !glow && t % 5 < 0.12; // (it almost never does)
    for (const d of [-1, 1]) {
      ctx.fillStyle = s.gem;
      if (blink) ctx.fillRect(d * 3.2 - 2, y - 10.5, 4, 1);
      else gem(ctx, d * 3.2, y - 10, 2.2 + glow * 0.6, s.gem, false);
    }
  },
  // the White Rose Rod: one white rose wide open on the rod's tip, two leaves under it
  whiterose(ctx, s, y, t, glow) {
    ctx.fillStyle = s.gem2;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(d * 6, y - 1, 5.5, 2.4, d * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(200,180,186,0.9)';
    ctx.lineWidth = 0.9;
    ctx.fillStyle = s.gem;
    const r = 7.5 + glow * 0.8;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + Math.sin(t * 0.8) * 0.05;
      circle(ctx, Math.cos(a) * r * 0.55, y - 9 + Math.sin(a) * r * 0.55, r * 0.56);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#efe6dc';
    circle(ctx, 0, y - 9, r * 0.36);
    ctx.fill();
    ctx.fillStyle = '#efd88a';
    circle(ctx, 0, y - 9, r * 0.16);
    ctx.fill();
  },
  // Fenrir's Gleipnir Staff: the fetter's ribbon wound up the shaft (drawStaff, `ribbon`) and tied off at the top in a
  // loop of light, its frayed end streaming loose
  gleipnir(ctx, s, y, t, glow) {
    ctx.strokeStyle = `rgba(${s.ribbon},0.95)`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(-3, y - 6, 4, 6, -0.5, 0, Math.PI * 2);
    ctx.ellipse(3, y - 6, 4, 6, 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, y - 2);
    for (let i = 1; i <= 8; i++) ctx.lineTo(i * 2.2, y - 2 - i * 1.6 + Math.sin(t * 5 + i * 0.9) * (1 + i * 0.35));
    ctx.stroke();
    ctx.lineWidth = 0.8;
    for (const d of [-1.5, 1.5]) {
      ctx.beginPath();
      ctx.moveTo(17.6, y - 14.8 + Math.sin(t * 5 + 7.2) * 3.8);
      ctx.lineTo(20 + d, y - 17 + d + Math.sin(t * 5 + 8) * 4);
      ctx.stroke();
    }
    gem(ctx, 0, y - 1, 2.2 + glow * 0.6, s.gem, false);
  },
  // the Lantern Rod: a Keeper crook at the top with a little cutters' lantern hanging from it, lit
  lantern(ctx, s, y, t, glow) {
    ctx.strokeStyle = s.shaft[1];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y + 3);
    ctx.quadraticCurveTo(1, y - 14, 9, y - 13);
    ctx.quadraticCurveTo(14, y - 12, 13, y - 7);
    ctx.stroke();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(13, y - 7);
    ctx.lineTo(13, y - 3);
    ctx.stroke();
    ctx.save();
    ctx.translate(13, 0);
    halo(ctx, s, y + 4, 8 + glow * 4, 0.6 + glow * 0.3);
    ctx.fillStyle = s.gem2;
    ctx.beginPath();
    ctx.moveTo(-4.5, y - 1);
    ctx.lineTo(0, y - 4);
    ctx.lineTo(4.5, y - 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = s.gem;
    ctx.beginPath();
    ctx.roundRect(-3.5, y - 1, 7, 9, 1.5);
    ctx.fill();
    ctx.strokeStyle = s.gem2;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#fff8e0';
    ctx.beginPath();
    ctx.ellipse(0, y + 4, 1.3, 2.4 * (1 + 0.15 * Math.sin(t * 12)), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = s.gem2;
    ctx.fillRect(-4, y + 8, 8, 2);
    ctx.restore();
  },
  // Sigrun's: a little round shield of clear ice on the shaft's head, a silver boss in it, a pale pennant
  shield(ctx, s, y) {
    ctx.fillStyle = s.gem;
    ctx.strokeStyle = s.gem2;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, y - 8, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    gem(ctx, 0, y - 8, 2.8, '#d8dce8');
    ctx.fillStyle = '#8ab8e0';
    ctx.beginPath();
    ctx.moveTo(1, y + 2);
    ctx.lineTo(11, y + 5);
    ctx.lineTo(1, y + 9);
    ctx.closePath();
    ctx.fill();
  },
  // two black fangs forking up from the head, a coal held between them (E5 (b): Orthrus's)
  fang(ctx, s, y, t) {
    for (const d of [-1, 1]) {
      ctx.fillStyle = s.gem;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(d * 2, y + 4);
      ctx.quadraticCurveTo(d * 9, y - 4, d * 4, y - 16);
      ctx.quadraticCurveTo(d * 5, y - 4, d * 0.5, y + 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = s.gem2;
    ctx.beginPath();
    ctx.arc(0, y - 4, 3 + 0.4 * Math.sin(t * 3), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.8)';
    ellipse(ctx, -0.8, y - 5, 1, 1);
    ctx.fill();
  },
};

// One staff, grip at the origin, head up. glow 0..1: extra light (casting); t: time, for the moving parts;
// len: a shorter shaft (the bag icon, so the head is big enough to tell staves apart).
export function drawStaff(ctx, id, glow = 0, t = 0, len = 0) {
  const s = STAFFS[artOf(id)]; // (a rebalanced copy looks like its legacy original)
  if (!s) return;
  const L = len || s.len, w = s.w;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  halo(ctx, s, -L - 6, 14 + glow * 8, 0.25 + glow * 0.35);
  // the shaft: a little wider at the grip, a rounded butt below the hand
  ctx.beginPath();
  ctx.moveTo(-w, 9);
  ctx.lineTo(-w * 0.75, -L + 2);
  ctx.quadraticCurveTo(0, -L - 1, w * 0.75, -L + 2);
  ctx.lineTo(w, 9);
  ctx.quadraticCurveTo(0, 12, -w, 9);
  ctx.closePath();
  const g = ctx.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, s.shaft[0]);
  g.addColorStop(1, s.shaft[1]);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // a wrap where the hand goes, and a collar under the head
  ctx.fillStyle = s.band ?? 'rgba(58,51,80,0.35)';
  for (const yy of [-3, 1]) ctx.fillRect(-w - 0.4, yy, w * 2 + 0.8, 1.6);
  ctx.fillStyle = s.gem2 ?? s.gem;
  ctx.beginPath();
  ctx.roundRect(-w - 1.2, -L + 1, w * 2 + 2.4, 3, 1.4);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.stroke();
  if (s.ribbon) { // (the Gleipnir Staff: a ribbon of light wound up the shaft, the turns behind it fainter)
    for (let i = 0; i < 9; i++) {
      const y0 = 4 - (i / 9) * (L - 2), y1 = y0 - L / 18;
      ctx.strokeStyle = `rgba(${s.ribbon},${i % 2 ? 0.35 : 0.95})`;
      ctx.lineWidth = i % 2 ? 1.2 : 1.8;
      ctx.beginPath();
      ctx.moveTo(i % 2 ? w : -w - 0.6, i % 2 ? y1 : y0);
      ctx.lineTo(i % 2 ? -w : w + 0.6, i % 2 ? y1 - L / 18 : y1);
      ctx.stroke();
    }
  }
  HEADS[s.head](ctx, s, -L - 2, t, glow);
  ctx.restore();
}
