// Docs: docs/places/canopy.md, docs/combat/stages.md
// The Old Oak Canopy's art that isn't the room itself (src/canopy.js): its creatures (oak squirrel, tent
// caterpillar, flying squirrel, tawny owl, wasp nest, wasp, hornet and the Hornet Queen, a field boss;
// CANOPY_MOB_ART, called by drawMob in src/field.js), the gear sold at Acorn's treehouse or dropped up here
// (CANOPY_SWORDS, CANOPY_SWORD_LEN, CANOPY_HELMETS, drawn by drawSword / drawHelmet in src/field.js), its
// materials' icons (CANOPY_ICONS) and Ranger Acorn's dress (drawRangerDress, called by src/slime.js for the
// 'ranger' accessory).
import { TAU, circle, ellipse } from './util.js';

function face(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, cross = false } = {}) {
  ctx.strokeStyle = '#2d2a3e';
  ctx.fillStyle = '#2d2a3e';
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.6) < 0.12;
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
      ctx.fillStyle = '#2d2a3e';
      ellipse(ctx, ex, fy, 2.4 * size, 3.2 * size);
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
    }
  }
  if (cross && dying < 0.05) {
    // cross little brows
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 1.6 * size;
    ctx.beginPath();
    ctx.moveTo(fx - gap - 3 * size, fy - 6 * size); ctx.lineTo(fx - gap + 2.5 * size, fy - 4.5 * size);
    ctx.moveTo(fx + gap + 3 * size, fy - 6 * size); ctx.lineTo(fx + gap - 2.5 * size, fy - 4.5 * size);
    ctx.stroke();
  }
}
function blush(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(255,140,160,0.35)';
  ellipse(ctx, x, y, r, r * 0.6);
}
function halo(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// a pair of see-through insect wings, buzzing (flat when `still`)
function wings(ctx, x, y, len, t, seed, { still = false, back = false, n = 2 } = {}) {
  ctx.save();
  ctx.fillStyle = 'rgba(235,248,255,0.55)';
  ctx.strokeStyle = 'rgba(120,140,170,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const buzz = still ? 0 : Math.sin(t * 60 + seed + i) * 0.35;
    ctx.save();
    ctx.translate(x - i * len * 0.18, y);
    ctx.rotate((back ? 0.9 : -0.35) - i * 0.35 + buzz);
    ctx.beginPath();
    ctx.ellipse(-len * 0.5, 0, len * 0.5, len * 0.2, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// ——— mobs: (ctx, w, h, t, seed, m, dying) => sil, origin at the feet, +x = facing ———

// Oak Squirrel: a round rusty-orange squirrel with a cream tummy, tufted ears and a huge curled tail,
// clutching an acorn. m.warn: it winds the acorn back over its head, about to throw.
function drawOakSquirrel(ctx, w, h, t, seed, m, dying) {
  const warn = !!m.warn && dying < 0.05;
  const cy = -h * 0.42, r = h * 0.36;
  // the tail: a big S-curl behind it, swishing
  const sw = Math.sin(t * 3 + seed) * 0.08;
  ctx.save();
  ctx.translate(-r * 0.7, -h * 0.2);
  ctx.rotate(sw);
  ctx.fillStyle = '#d27a48';
  ctx.strokeStyle = '#8a4a2c';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-w * 0.55, 4, -w * 0.62, -h * 0.75, -w * 0.25, -h * 0.85);
  ctx.bezierCurveTo(-w * 0.02, -h * 0.9, w * 0.05, -h * 0.62, -w * 0.12, -h * 0.55);
  ctx.bezierCurveTo(-w * 0.3, -h * 0.45, -w * 0.2, -h * 0.1, 4, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,220,180,0.45)';
  ellipse(ctx, -w * 0.3, -h * 0.55, w * 0.1, h * 0.16, -0.4);
  ctx.restore();
  // ears
  ctx.fillStyle = '#e0905a';
  ctx.strokeStyle = '#8a4a2c';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * r * 0.35 + r * 0.15, cy - r * 0.75);
    ctx.lineTo(s * r * 0.5 + r * 0.25, cy - r * 1.45);
    ctx.lineTo(s * r * 0.75 + r * 0.1, cy - r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  const body = () => ctx.ellipse(0, cy, r * 1.05, r, 0, 0, TAU);
  ctx.fillStyle = '#e0905a';
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fbe6c8';
  ellipse(ctx, r * 0.25, cy + r * 0.3, r * 0.55, r * 0.55);
  // the acorn, in its paws or wound back over its head
  const [ax, ay] = warn ? [-r * 0.2, cy - r * 1.35] : [r * 0.75, cy + r * 0.3];
  ctx.fillStyle = '#c8945a';
  ctx.strokeStyle = '#7a5030';
  ctx.lineWidth = 1.2;
  ellipse(ctx, ax, ay + 2, 5.5, 6.5);
  ctx.stroke();
  ctx.fillStyle = '#8a6040';
  ctx.beginPath();
  ctx.arc(ax, ay - 1, 6, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#e0905a'; // the paw(s) holding it
  circle(ctx, ax - 3, ay + 4, 3);
  face(ctx, r * 0.42, cy - r * 0.2, r * 0.24, t, seed, { dying, size: 0.85, cross: warn });
  blush(ctx, r * 0.78, cy + r * 0.05, 3.5);
  ctx.fillStyle = '#5a3a2a'; // little nose
  circle(ctx, r * 0.98, cy - r * 0.05, 1.6);
  return () => {
    ctx.beginPath();
    body();
  };
}

// Tent Caterpillar: a long soft green caterpillar in bobbing segments, pale spots and white silk tufts,
// its face at the front. It inches along, leaving sticky silk behind it.
function drawTentCaterpillar(ctx, w, h, t, seed, m, dying) {
  const n = 6, segR = h * 0.42, span = w - segR * 2;
  const segs = [];
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1), inch = m.walking ? Math.sin(t * 8 + seed - i * 0.9) : Math.sin(t * 2 + seed - i * 0.6) * 0.3;
    segs.push({ x: -span / 2 + k * span, y: -segR - Math.max(0, inch) * h * 0.22, r: segR * (i === n - 1 ? 1.15 : 0.9 + 0.08 * Math.sin(i)) });
  }
  // little feet
  ctx.fillStyle = '#6a9a48';
  for (const s of segs.slice(0, -1)) ellipse(ctx, s.x, -2, s.r * 0.35, 2.6);
  for (const [i, s] of segs.entries()) {
    ctx.fillStyle = i % 2 ? '#a8d878' : '#9ccc6a';
    ctx.strokeStyle = '#5a8a3c';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (i < n - 1) {
      ctx.fillStyle = '#fff2a8';
      circle(ctx, s.x, s.y - s.r * 0.35, s.r * 0.22);
      // a tuft of white silk hair
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const d of [-0.3, 0, 0.3]) {
        ctx.moveTo(s.x + d * s.r, s.y - s.r * 0.85);
        ctx.lineTo(s.x + d * s.r * 1.6, s.y - s.r * 1.45 + Math.sin(t * 4 + i + d) * 1.2);
      }
      ctx.stroke();
    }
  }
  const hd = segs[n - 1];
  // antennae
  ctx.strokeStyle = '#5a8a3c';
  ctx.lineWidth = 1.4;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(hd.x + s * hd.r * 0.3, hd.y - hd.r * 0.8);
    ctx.quadraticCurveTo(hd.x + s * hd.r * 0.5 + 3, hd.y - hd.r * 1.6, hd.x + s * hd.r * 0.7 + 4, hd.y - hd.r * 1.7);
    ctx.stroke();
    ctx.fillStyle = '#ffb3c7';
    circle(ctx, hd.x + s * hd.r * 0.7 + 4, hd.y - hd.r * 1.7, 2);
  }
  face(ctx, hd.x + hd.r * 0.25, hd.y - hd.r * 0.1, hd.r * 0.3, t, seed, { dying, size: 0.8 });
  blush(ctx, hd.x + hd.r * 0.7, hd.y + hd.r * 0.3, 3);
  return () => {
    ctx.beginPath();
    for (const s of segs) {
      ctx.moveTo(s.x + s.r, s.y);
      ctx.arc(s.x, s.y, s.r, 0, TAU);
    }
  };
}

// Flying Squirrel: a silver-lilac squirrel with huge dark eyes and a skin flap between its legs. m.special:
// it's gliding round behind you (faded, flap spread); m.warn: flap spread, about to scratch.
function drawFlyingSquirrel(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05, warn = !!m.warn && dying < 0.05, spread = gone || warn;
  ctx.save();
  if (gone) ctx.globalAlpha *= 0.22 + 0.12 * Math.sin(t * 40);
  const cy = -h * 0.48, r = h * 0.36;
  // the flap: a soft membrane stretched wrist to ankle
  ctx.fillStyle = '#a89cc0';
  ctx.strokeStyle = '#6a5a88';
  ctx.lineWidth = 1.6;
  const fw = spread ? w * 0.6 : w * 0.42, fh = spread ? h * 0.12 : h * 0.05;
  ctx.beginPath();
  ctx.moveTo(-fw, cy + fh);
  ctx.quadraticCurveTo(-fw * 0.5, cy - r * 0.5, 0, cy - r * 0.2);
  ctx.quadraticCurveTo(fw * 0.5, cy - r * 0.5, fw, cy + fh);
  ctx.quadraticCurveTo(fw * 0.5, cy + r * 0.9, 0, cy + r * 0.7);
  ctx.quadraticCurveTo(-fw * 0.5, cy + r * 0.9, -fw, cy + fh);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // a flat fluffy tail
  ctx.fillStyle = '#c4bad8';
  ctx.beginPath();
  ctx.ellipse(-w * 0.45, cy + r * 0.3, w * 0.22, h * 0.12, 0.2 + Math.sin(t * 3 + seed) * 0.08, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // ears
  ctx.fillStyle = '#c4bad8';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(r * 0.15 + s * r * 0.5, cy - r * 0.85, r * 0.22, r * 0.3, s * 0.3, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  const body = () => ctx.ellipse(0, cy, r, r * 0.92, 0, 0, TAU);
  ctx.fillStyle = '#c4bad8';
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f2ecf8';
  ellipse(ctx, r * 0.2, cy + r * 0.32, r * 0.5, r * 0.45);
  // big dark night eyes
  if (dying < 0.05) {
    for (const ex of [r * 0.12, r * 0.62]) {
      ctx.fillStyle = '#2d2a3e';
      ellipse(ctx, ex, cy - r * 0.18, r * 0.2, r * 0.24);
      ctx.fillStyle = '#fff';
      circle(ctx, ex + r * 0.06, cy - r * 0.28, r * 0.07);
    }
    if (warn) {
      ctx.strokeStyle = '#2d2a3e';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(r * 0.0, cy - r * 0.55); ctx.lineTo(r * 0.28, cy - r * 0.45);
      ctx.moveTo(r * 0.78, cy - r * 0.55); ctx.lineTo(r * 0.5, cy - r * 0.45);
      ctx.stroke();
    }
  } else face(ctx, r * 0.37, cy - r * 0.18, r * 0.25, t, seed, { dying, size: 0.8 });
  ctx.fillStyle = '#ff9fb8';
  circle(ctx, r * 0.95, cy, 1.8);
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// Tawny Owl: a round barred brown owl with a pale facial disc, big amber eyes and ear tufts, hovering on
// soft wings. m.warn: wings up, eyes fixed on you; m.charging: diving, wings swept back.
function drawTawnyOwl(ctx, w, h, t, seed, m, dying) {
  const warn = !!m.warn && dying < 0.05, dive = !!m.charging && dying < 0.05;
  const cy = -h * 0.5, r = h * 0.42;
  const flap = dive ? 0.9 : warn ? -0.9 : Math.sin(t * 7 + seed) * 0.55;
  ctx.fillStyle = '#a07650';
  ctx.strokeStyle = '#6a4a30';
  ctx.lineWidth = 1.8;
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * r * 0.75, cy - r * 0.1);
    ctx.rotate(s * flap);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.3);
    ctx.quadraticCurveTo(s * w * 0.42, -r * 0.7, s * w * 0.5, r * 0.1);
    ctx.quadraticCurveTo(s * w * 0.32, r * 0.25, s * w * 0.28, r * 0.5);
    ctx.quadraticCurveTo(s * w * 0.14, r * 0.25, 0, r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,60,40,0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(s * w * 0.1 * i, -r * 0.15);
      ctx.lineTo(s * w * 0.12 * i, r * 0.3);
      ctx.stroke();
    }
    ctx.restore();
  }
  // ear tufts
  ctx.fillStyle = '#a07650';
  ctx.strokeStyle = '#6a4a30';
  ctx.lineWidth = 1.6;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * r * 0.35, cy - r * 0.8);
    ctx.lineTo(s * r * 0.7, cy - r * 1.35);
    ctx.lineTo(s * r * 0.8, cy - r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  const body = () => ctx.ellipse(0, cy, r, r * 1.02, 0, 0, TAU);
  ctx.fillStyle = '#b88a5e';
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // the barred chest
  ctx.fillStyle = '#e8cfa8';
  ellipse(ctx, 0, cy + r * 0.4, r * 0.55, r * 0.5);
  ctx.strokeStyle = 'rgba(120,80,50,0.55)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const y = cy + r * (0.2 + i * 0.22);
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, y);
    ctx.quadraticCurveTo(-r * 0.1, y + 3, 0, y);
    ctx.moveTo(r * 0.05, y + 2);
    ctx.quadraticCurveTo(r * 0.15, y + 5, r * 0.25, y + 2);
    ctx.stroke();
  }
  // the facial disc: a pale heart, two great amber eyes
  ctx.fillStyle = '#f0dcc0';
  ellipse(ctx, r * 0.15, cy - r * 0.25, r * 0.75, r * 0.5);
  if (dying < 0.05) {
    for (const ex of [-r * 0.15, r * 0.45]) {
      ctx.fillStyle = '#ffb84a';
      circle(ctx, ex, cy - r * 0.28, r * 0.26);
      ctx.fillStyle = '#2d2a3e';
      circle(ctx, ex + (warn ? r * 0.06 : 0), cy - r * 0.28, r * (warn ? 0.1 : 0.15));
      ctx.fillStyle = '#fff';
      circle(ctx, ex + r * 0.06, cy - r * 0.36, r * 0.05);
    }
  } else face(ctx, r * 0.15, cy - r * 0.28, r * 0.3, t, seed, { dying });
  ctx.fillStyle = '#e0a040'; // beak
  ctx.beginPath();
  ctx.moveTo(r * 0.08, cy - r * 0.1);
  ctx.lineTo(r * 0.22, cy - r * 0.1);
  ctx.lineTo(r * 0.15, cy + r * 0.08);
  ctx.closePath();
  ctx.fill();
  // feet tucked under
  ctx.fillStyle = '#e0a040';
  for (const s of [-1, 1]) ellipse(ctx, s * r * 0.25, cy + r * 0.98, 3, 2);
  return () => {
    ctx.beginPath();
    body();
  };
}

// Wasp Nest: a papery grey teardrop of a nest sitting on the bough, swirled in bands, a stub of the twig it
// fell from sticking out of the top, a dark hole at the front and a few wasps buzzing round it. Knock it
// down and it bursts into wasps (the `split` brain).
function drawWaspNest(ctx, w, h, t, seed, m, dying) {
  const wob = Math.sin(t * 9 + seed) * (m.target ? 0.05 : 0.015);
  ctx.save();
  ctx.rotate(wob);
  // the twig stub
  ctx.strokeStyle = '#7a5a40';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.9);
  ctx.lineTo(-w * 0.12, -h * 1.08);
  ctx.moveTo(-w * 0.05, -h * 1.0);
  ctx.lineTo(w * 0.14, -h * 1.12);
  ctx.stroke();
  ctx.fillStyle = '#8fc070';
  ellipse(ctx, w * 0.2, -h * 1.12, 6, 3.5, -0.4);
  const body = () => {
    ctx.moveTo(0, -h * 0.94);
    ctx.bezierCurveTo(w * 0.62, -h * 0.85, w * 0.6, -h * 0.05, 0, 0);
    ctx.bezierCurveTo(-w * 0.6, -h * 0.05, -w * 0.62, -h * 0.85, 0, -h * 0.94);
  };
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, '#c8beb4');
  g.addColorStop(0.5, '#e4dcd2');
  g.addColorStop(1, '#bcb2a8');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#8a7e74';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // papery bands
  ctx.save();
  ctx.beginPath();
  body();
  ctx.clip();
  ctx.strokeStyle = 'rgba(130,115,105,0.45)';
  ctx.lineWidth = 1.4;
  for (let i = 1; i < 7; i++) {
    const y = -h * 0.94 + i * h * 0.14;
    ctx.beginPath();
    ctx.moveTo(-w * 0.6, y + 4);
    ctx.quadraticCurveTo(0, y - 5 + Math.sin(i * 2.1) * 3, w * 0.6, y + 2);
    ctx.stroke();
  }
  ctx.restore();
  // the hole, and a cross little face above it
  ctx.fillStyle = '#4a3a3a';
  ellipse(ctx, w * 0.12, -h * 0.22, w * 0.12, h * 0.07);
  face(ctx, w * 0.1, -h * 0.5, w * 0.12, t, seed, { dying, size: 0.8, cross: !!m.target });
  ctx.restore();
  // wasps buzzing round it
  if (dying < 0.05) {
    for (let i = 0; i < 3; i++) {
      const a = t * (2.4 + i * 0.4) + seed + (i * TAU) / 3;
      const x = Math.cos(a) * w * 0.7, y = -h * 0.55 + Math.sin(a * 1.3) * h * 0.35;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(Math.cos(a) > 0 ? -1 : 1, 1);
      tinyWasp(ctx, 0.55, t, seed + i);
      ctx.restore();
    }
  }
  return () => {
    ctx.beginPath();
    body();
  };
}
function tinyWasp(ctx, s, t, seed) {
  wings(ctx, -2 * s, -6 * s, 12 * s, t, seed, { n: 1 });
  ctx.fillStyle = '#ffd84a';
  ellipse(ctx, 0, 0, 8 * s, 5 * s);
  ctx.fillStyle = '#3a3040';
  ctx.fillRect(-3 * s, -5 * s, 2.2 * s, 10 * s);
  ctx.fillRect(1.5 * s, -5 * s, 2.2 * s, 10 * s);
  ctx.fillStyle = '#3a3040';
  circle(ctx, 8 * s, -1 * s, 3.5 * s);
}

// Wasp: a little yellow-and-black wasp with buzzing wings and a tiny stinger
function drawWasp(ctx, w, h, t, seed, m, dying) {
  const cy = -h * 0.5, r = h * 0.38;
  wings(ctx, -r * 0.2, cy - r * 0.8, w * 0.55, t, seed, { still: dying > 0.05 });
  const body = () => ctx.ellipse(-r * 0.3, cy, r * 1.2, r * 0.85, 0, 0, TAU);
  ctx.fillStyle = '#ffd84a';
  ctx.strokeStyle = '#7a6020';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  body();
  ctx.clip();
  ctx.fillStyle = '#3a3040';
  for (const x of [-r * 0.9, -r * 0.2]) ctx.fillRect(x, cy - r, r * 0.35, r * 2);
  ctx.restore();
  ctx.fillStyle = '#3a3040'; // stinger
  ctx.beginPath();
  ctx.moveTo(-r * 1.45, cy - 2);
  ctx.lineTo(-r * 2, cy + 1);
  ctx.lineTo(-r * 1.45, cy + 3);
  ctx.fill();
  ctx.fillStyle = '#3a3040'; // head
  circle(ctx, r * 1.05, cy - r * 0.15, r * 0.6);
  if (dying < 0.05) {
    ctx.fillStyle = '#ff6a6a';
    circle(ctx, r * 1.25, cy - r * 0.3, r * 0.2);
  }
  return () => {
    ctx.beginPath();
    body();
  };
}

// Hornet: a big amber-and-brown hornet with smoky wings. m.warn: it curls its tail forward to flick a
// stinger at you.
function drawHornet(ctx, w, h, t, seed, m, dying) {
  const warn = !!m.warn && dying < 0.05;
  const cy = -h * 0.5, r = h * 0.3;
  wings(ctx, -r * 0.1, cy - r * 0.9, w * 0.55, t, seed, { still: dying > 0.05 });
  // the abdomen (curled forward under it when it's about to sting)
  ctx.save();
  ctx.translate(-r * 0.6, cy + r * 0.1);
  ctx.rotate(warn ? -1.1 : -0.15);
  const abd = () => ctx.ellipse(-r * 1.1, 0, r * 1.3, r * 0.85, 0, 0, TAU);
  ctx.fillStyle = '#f0a038';
  ctx.strokeStyle = '#6a3a18';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  abd();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  abd();
  ctx.clip();
  ctx.fillStyle = '#5a3420';
  for (const x of [-r * 1.7, -r * 1.05, -r * 0.4]) ctx.fillRect(x, -r, r * 0.3, r * 2);
  ctx.restore();
  ctx.fillStyle = '#3a2418';
  ctx.beginPath();
  ctx.moveTo(-r * 2.35, -2.5);
  ctx.lineTo(-r * 3.0, 0);
  ctx.lineTo(-r * 2.35, 2.5);
  ctx.fill();
  ctx.restore();
  // thorax and legs
  ctx.strokeStyle = '#5a3420';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.2 + i * r * 0.3, cy + r * 0.5);
    ctx.lineTo(-r * 0.4 + i * r * 0.35, cy + r * 1.3 + Math.sin(t * 6 + i) * 1.5);
    ctx.stroke();
  }
  const body = () => ctx.ellipse(0, cy, r * 0.85, r * 0.75, 0, 0, TAU);
  ctx.fillStyle = '#8a4a28';
  ctx.strokeStyle = '#4a2a18';
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f0a038'; // head
  ctx.beginPath();
  ctx.arc(r * 1.05, cy - r * 0.1, r * 0.62, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (dying < 0.05) {
    ctx.fillStyle = '#3a2418';
    ellipse(ctx, r * 1.3, cy - r * 0.25, r * 0.2, r * 0.3);
    ctx.fillStyle = '#fff';
    circle(ctx, r * 1.36, cy - r * 0.36, r * 0.07);
    ctx.strokeStyle = '#3a2418';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); // a cross brow
    ctx.moveTo(r * 1.05, cy - r * 0.6);
    ctx.lineTo(r * 1.45, cy - r * 0.48);
    ctx.stroke();
  } else face(ctx, r * 1.2, cy - r * 0.2, r * 0.18, t, seed, { dying, size: 0.7 });
  // antennae
  ctx.strokeStyle = '#3a2418';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(r * 1.2, cy - r * 0.65);
  ctx.quadraticCurveTo(r * 1.5, cy - r * 1.4, r * 1.9, cy - r * 1.3);
  ctx.stroke();
  return () => {
    ctx.beginPath();
    body();
    ctx.moveTo(r * 1.67, cy - r * 0.1);
    ctx.arc(r * 1.05, cy - r * 0.1, r * 0.62, 0, TAU);
  };
}

// The Hornet Queen (a field boss): a great golden hornet with a fluffy collar, four shimmering wings, a long
// banded tail and a little crown of wax cells. m.warn: she rears back, about to dive; m.charging: diving.
function drawHornetQueen(ctx, w, h, t, seed, m, dying) {
  const warn = !!m.warn && dying < 0.05, dive = !!m.charging && dying < 0.05;
  const cy = -h * 0.52, r = h * 0.28;
  ctx.save();
  ctx.rotate(warn ? -0.18 : dive ? 0.25 : Math.sin(t * 1.6 + seed) * 0.04);
  if (dying < 0.05) halo(ctx, 0, cy, w * 0.75, '255,210,110', 0.22 + 0.08 * Math.sin(t * 3));
  wings(ctx, -r * 0.1, cy - r * 0.95, w * 0.62, t, seed, { still: dying > 0.05, back: dive, n: 2 });
  // the long tail
  ctx.save();
  ctx.translate(-r * 0.5, cy + r * 0.15);
  ctx.rotate(warn ? -0.5 : -0.12);
  const abd = () => ctx.ellipse(-r * 1.35, 0, r * 1.6, r * 0.95, 0, 0, TAU);
  const ag = ctx.createLinearGradient(0, -r, 0, r);
  ag.addColorStop(0, '#ffd070');
  ag.addColorStop(1, '#e08a28');
  ctx.fillStyle = ag;
  ctx.strokeStyle = '#6a3a18';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  abd();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  abd();
  ctx.clip();
  ctx.fillStyle = '#5a3420';
  for (const x of [-r * 2.15, -r * 1.5, -r * 0.85]) ctx.fillRect(x, -r, r * 0.32, r * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, -r * 1.3, -r * 0.5, r * 0.9, r * 0.18);
  ctx.restore();
  ctx.fillStyle = '#3a2418';
  ctx.beginPath();
  ctx.moveTo(-r * 2.9, -4);
  ctx.lineTo(-r * 3.6, 0);
  ctx.lineTo(-r * 2.9, 4);
  ctx.fill();
  ctx.fillStyle = '#ffe080'; // a gold tip on it
  circle(ctx, -r * 3.55, 0, 2.4);
  ctx.restore();
  // legs
  ctx.strokeStyle = '#5a3420';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.3 + i * r * 0.35, cy + r * 0.55);
    ctx.quadraticCurveTo(-r * 0.6 + i * r * 0.4, cy + r * 1.1, -r * 0.4 + i * r * 0.42, cy + r * 1.6 + Math.sin(t * 4 + i) * 2);
    ctx.stroke();
  }
  const body = () => ctx.ellipse(0, cy, r * 0.95, r * 0.85, 0, 0, TAU);
  ctx.fillStyle = '#9a5a30';
  ctx.strokeStyle = '#4a2a18';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // the fluffy collar
  ctx.fillStyle = '#ffe6b0';
  for (let i = 0; i < 7; i++) {
    const a = -1.2 + i * 0.4;
    circle(ctx, r * 0.55 + Math.cos(a) * r * 0.35, cy + Math.sin(a) * r * 0.7, r * 0.26);
  }
  // head
  const hx = r * 1.15, hy = cy - r * 0.15, hr = r * 0.7;
  ctx.fillStyle = '#ffc050';
  ctx.strokeStyle = '#6a3a18';
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (dying < 0.05) {
    ctx.fillStyle = '#3a2418';
    ellipse(ctx, hx + hr * 0.35, hy - hr * 0.1, hr * 0.26, hr * 0.38);
    ctx.fillStyle = '#fff';
    circle(ctx, hx + hr * 0.42, hy - hr * 0.26, hr * 0.09);
    ctx.strokeStyle = '#3a2418';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx, hy - hr * 0.62);
    ctx.lineTo(hx + hr * 0.6, hy - hr * 0.46);
    ctx.stroke();
    ctx.beginPath(); // a haughty little mouth
    ctx.moveTo(hx + hr * 0.4, hy + hr * 0.4);
    ctx.lineTo(hx + hr * 0.7, hy + hr * 0.32);
    ctx.stroke();
  } else face(ctx, hx + hr * 0.3, hy, hr * 0.25, t, seed, { dying });
  // antennae
  ctx.strokeStyle = '#3a2418';
  ctx.lineWidth = 1.8;
  for (const d of [0, 1]) {
    ctx.beginPath();
    ctx.moveTo(hx + hr * 0.2 + d * 4, hy - hr * 0.9);
    ctx.quadraticCurveTo(hx + hr * 0.6 + d * 8, hy - hr * 2, hx + hr * 1.2 + d * 8, hy - hr * 1.8);
    ctx.stroke();
  }
  // the crown: wax cells, gold
  const cx0 = hx - hr * 0.2, cyc = hy - hr * 0.95;
  for (let i = 0; i < 4; i++) {
    const x = cx0 + (i - 1.5) * hr * 0.32, y = cyc - (i === 1 || i === 2 ? hr * 0.22 : 0);
    hexCell(ctx, x, y, hr * 0.2, '#ffd84a', '#b8861e');
  }
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
    ctx.moveTo(hx + hr, hy);
    ctx.arc(hx, hy, hr, 0, TAU);
  };
}
function hexCell(ctx, x, y, r, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + Math.PI / 6;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export const CANOPY_MOB_ART = {
  oak_squirrel: drawOakSquirrel, tent_caterpillar: drawTentCaterpillar, flying_squirrel: drawFlyingSquirrel, tawny_owl: drawTawnyOwl,
  wasp_nest: drawWaspNest, wasp: drawWasp, hornet: drawHornet, hornet_queen: drawHornetQueen,
};

// ——— gear: swords (ctx, L, glow), grip at the origin, blade up (-y) ———
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

// Ranger's Billhook: a long oak handle and a broad steel blade with a hooked tip, for clearing branches
function drawBillhook(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#d8dde4';
  ctx.strokeStyle = '#6a7280';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-3.5, -L * 0.35);
  ctx.lineTo(-4.5, -L * 0.85);
  ctx.quadraticCurveTo(-4, -L * 1.02, 4, -L * 1.0);
  ctx.quadraticCurveTo(9, -L * 0.98, 8, -L * 0.88); // the hook
  ctx.quadraticCurveTo(4, -L * 0.9, 3.5, -L * 0.82);
  ctx.lineTo(3.5, -L * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${0.6 + 0.4 * glow})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-2.5, -L * 0.4);
  ctx.lineTo(-3.2, -L * 0.84);
  ctx.stroke();
  // the oak handle, long, with a brass ferrule
  ctx.fillStyle = '#a07048';
  ctx.strokeStyle = '#5a3a24';
  ctx.beginPath();
  ctx.roundRect(-3, -L * 0.36, 6, L * 0.36 - 2, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d8b050';
  ctx.fillRect(-3.5, -L * 0.37, 7, 3);
  grip(ctx, '#2e6a3a', '#1e4a28');
  ctx.restore();
}
// Stingblade: a long straight blade ground from a hornet's stinger, amber and black bands to a dark point
function drawStingblade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-4.5, -6);
    ctx.lineTo(-2, -L * 0.85);
    ctx.lineTo(0, -L);
    ctx.lineTo(2, -L * 0.85);
    ctx.lineTo(4.5, -6);
    ctx.closePath();
  };
  ctx.fillStyle = '#f0a038';
  ctx.strokeStyle = '#5a3420';
  ctx.lineWidth = 1.5;
  blade();
  ctx.fill();
  ctx.save();
  blade();
  ctx.clip();
  ctx.fillStyle = '#4a2a18';
  for (let k = 0.18; k < 0.8; k += 0.2) ctx.fillRect(-6, -L * k - 4, 12, 4);
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(-6, -L, 12, L * 0.17);
  ctx.restore();
  blade();
  ctx.stroke();
  ctx.fillStyle = `rgba(255,240,200,${0.5 + 0.4 * glow})`;
  ctx.fillRect(-0.8, -L * 0.8, 1.6, L * 0.7);
  // a guard like folded wings
  ctx.fillStyle = 'rgba(230,245,255,0.8)';
  ctx.strokeStyle = '#7a8aa0';
  ctx.lineWidth = 1;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * 8, -6, 7, 3, s * -0.3, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  grip(ctx, '#5a3420', '#2e1a10');
  ctx.restore();
}
// Queen's Stinger: the Hornet Queen's own stinger, a curved golden blade with a gold tip, a crossguard of
// wax cells
function drawQueenStinger(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const g = ctx.createLinearGradient(-6, 0, 6, 0);
  g.addColorStop(0, '#e89a30');
  g.addColorStop(0.5, '#ffd070');
  g.addColorStop(1, '#d88a28');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#6a3a18';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-5, -7);
  ctx.quadraticCurveTo(-6, -L * 0.6, 2, -L);
  ctx.quadraticCurveTo(5, -L * 0.6, 5, -7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#5a3420';
  ctx.lineWidth = 2.4;
  for (const k of [0.3, 0.5, 0.7]) {
    ctx.beginPath();
    ctx.moveTo(-4.5, -L * k);
    ctx.lineTo(4.5, -L * k - 1);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff2b0';
  circle(ctx, 2, -L + 3, 2.4);
  if (glow > 0) halo(ctx, 2, -L + 3, 10, '255,230,140', 0.6 * glow);
  for (const x of [-8, 0, 8]) hexCell(ctx, x, -6, 4.5, '#ffd84a', '#b8861e');
  grip(ctx, '#5a3420', '#2e1a10');
  ctx.restore();
}
export const CANOPY_SWORDS = { ranger_billhook: drawBillhook, stingblade: drawStingblade, queen_stinger: drawQueenStinger };
export const CANOPY_SWORD_LEN = { ranger_billhook: 52, stingblade: 58, queen_stinger: 60 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet; by is the brim line ———
// Ranger's Hat: a broad green felt hat, pinched crown, a band with an acorn badge and a blue jay feather
function drawRangerHat(ctx, w, h, t) {
  const by = -h * 0.72, rx = w * 0.5;
  ctx.fillStyle = '#5e8a4e';
  ctx.strokeStyle = '#34542c';
  ctx.lineWidth = 2;
  ctx.beginPath(); // the broad brim
  ctx.ellipse(0, by + 2, rx * 1.3, 6, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath(); // the crown, pinched at the top
  ctx.moveTo(-rx * 0.7, by + 1);
  ctx.bezierCurveTo(-rx * 0.8, by - h * 0.4, -rx * 0.1, by - h * 0.36, 0, by - h * 0.3);
  ctx.bezierCurveTo(rx * 0.1, by - h * 0.36, rx * 0.8, by - h * 0.4, rx * 0.7, by + 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a5038'; // the band
  ctx.fillRect(-rx * 0.72, by - 7, rx * 1.44, 6);
  // the acorn badge
  ctx.fillStyle = '#d8a050';
  ellipse(ctx, rx * 0.15, by - 3, 3.4, 4);
  ctx.fillStyle = '#8a6040';
  ctx.beginPath();
  ctx.arc(rx * 0.15, by - 5, 3.8, Math.PI, 0);
  ctx.fill();
  // the jay feather tucked in the band
  ctx.save();
  ctx.translate(-rx * 0.45, by - 6);
  ctx.rotate(-0.9 + Math.sin(t * 2) * 0.05);
  ctx.fillStyle = '#5aa0e0';
  ellipse(ctx, 0, -10, 3.2, 11);
  ctx.fillStyle = '#2d3a58';
  for (let i = 0; i < 3; i++) ctx.fillRect(-3, -16 + i * 5, 6, 1.5);
  ctx.restore();
}
// Owlfeather Cap: a snug cap of soft barred feathers with two little ear tufts
function drawOwlCap(ctx, w, h) {
  const by = -h * 0.7, rx = w * 0.5;
  ctx.fillStyle = '#b88a5e';
  ctx.strokeStyle = '#6a4a30';
  ctx.lineWidth = 2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * rx * 0.4, by - h * 0.3);
    ctx.lineTo(s * rx * 0.8, by - h * 0.62);
    ctx.lineTo(s * rx * 0.85, by - h * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-rx, by + 3);
  ctx.bezierCurveTo(-rx * 1.02, by - h * 0.44, rx * 1.02, by - h * 0.44, rx, by + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // feathers in scalloped rows
  ctx.strokeStyle = 'rgba(240,220,190,0.75)';
  ctx.lineWidth = 1.3;
  for (let row = 0; row < 3; row++) {
    const y = by - row * h * 0.1 - 2, span = rx * (0.95 - row * 0.2);
    ctx.beginPath();
    for (let x = -span; x < span; x += 8) {
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 4, y + 4, x + 8, y);
    }
    ctx.stroke();
  }
}
// Honeycomb Crown: a ring of golden wax cells, warm and a little sticky, a drip of honey on the front
function drawHoneyCrown(ctx, w, h, t) {
  const by = -h * 0.7, rx = w * 0.5, cr = Math.max(4, w * 0.075);
  halo(ctx, 0, by - 8, rx, '255,215,120', 0.3);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const x = -rx * 0.85 + (i * rx * 1.7) / (n - 1), lift = Math.sin((i / (n - 1)) * Math.PI) * 5;
    hexCell(ctx, x, by - 3 - lift, cr, '#ffcf4a', '#b8861e');
    hexCell(ctx, x, by - 3 - lift - cr * 1.6, cr * (i % 2 ? 0.75 : 0.9), '#ffdc70', '#b8861e');
  }
  // a drip of honey
  const d = (t * 0.4) % 1;
  ctx.fillStyle = '#f0a020';
  ellipse(ctx, rx * 0.1, by + 2 + d * 6, 2.2, 3 + d * 2);
}
export const CANOPY_HELMETS = { ranger_hood: drawRangerHat, owl_cap: drawOwlCap, honey_crown: drawHoneyCrown };

// ——— materials' icons (40 × 40, centred) ———
function iconAcorn(ctx) {
  ctx.fillStyle = '#d8a050';
  ctx.strokeStyle = '#7a5030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 4, 10, 12, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a6040';
  ctx.beginPath();
  ctx.arc(0, -3, 12, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60,40,20,0.5)';
  ctx.lineWidth = 1;
  for (const x of [-6, 0, 6]) {
    ctx.beginPath();
    ctx.moveTo(x - 3, -12);
    ctx.lineTo(x + 3, -4);
    ctx.stroke();
  }
  ctx.strokeStyle = '#6a4a30';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(2, -19);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ellipse(ctx, -4, 6, 2.5, 4);
}
function iconSilkTuft(ctx) {
  for (const [x, y, r] of [[-6, 4, 9], [5, 5, 8], [0, -5, 9], [8, -4, 6]]) {
    ctx.fillStyle = '#f4f6f8';
    circle(ctx, x, y, r);
  }
  ctx.strokeStyle = 'rgba(160,170,190,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.moveTo(-12 + i * 5, -10);
    ctx.quadraticCurveTo(-8 + i * 5, 2, -12 + i * 6, 12);
  }
  ctx.stroke();
}
function iconGliderFur(ctx) {
  ctx.fillStyle = '#c4bad8';
  ctx.strokeStyle = '#6a5a88';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-15, 8);
  ctx.quadraticCurveTo(-8, -14, 4, -12);
  ctx.quadraticCurveTo(16, -10, 14, 4);
  ctx.quadraticCurveTo(2, 2, -15, 8);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-8 + i * 5, 2);
    ctx.lineTo(-4 + i * 5, -8);
    ctx.stroke();
  }
}
function iconOwlFeather(ctx) {
  ctx.save();
  ctx.rotate(0.5);
  ctx.fillStyle = '#b88a5e';
  ctx.strokeStyle = '#6a4a30';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, -2, 7, 16, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8cfa8';
  for (let i = 0; i < 4; i++) ctx.fillRect(-6, -12 + i * 7, 12, 2.5);
  ctx.strokeStyle = '#6a4a30';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 18);
  ctx.stroke();
  ctx.restore();
}
function iconWaspPaper(ctx) {
  ctx.fillStyle = '#e4dcd2';
  ctx.strokeStyle = '#8a7e74';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-14, -10);
  ctx.quadraticCurveTo(0, -16, 14, -9);
  ctx.quadraticCurveTo(10, 4, 14, 12);
  ctx.quadraticCurveTo(0, 6, -14, 12);
  ctx.quadraticCurveTo(-10, 0, -14, -10);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(130,115,105,0.5)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-11, -6 + i * 5);
    ctx.quadraticCurveTo(0, -9 + i * 5, 11, -5 + i * 5);
    ctx.stroke();
  }
}
function iconHornetSting(ctx) {
  ctx.save();
  ctx.rotate(-0.7);
  ctx.fillStyle = '#3a2418';
  ctx.beginPath();
  ctx.moveTo(-4, 12);
  ctx.lineTo(0, -18);
  ctx.lineTo(4, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f0a038';
  ctx.strokeStyle = '#6a3a18';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 13, 7, 5, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(-0.7, -10, 1.4, 16);
  ctx.restore();
}
function iconHoneycomb(ctx) {
  for (const [x, y] of [[-7, -6], [7, -6], [0, 6], [-14, 6], [14, 6], [0, -18]]) hexCell(ctx, x, y + 4, 7.5, '#ffcf4a', '#b8861e');
  ctx.fillStyle = '#f0a020';
  ellipse(ctx, 2, 18, 2.5, 3.5);
}
export const CANOPY_ICONS = { oak_acorn: iconAcorn, silk_tuft: iconSilkTuft, glider_fur: iconGliderFur, owl_feather: iconOwlFeather, wasp_paper: iconWaspPaper, hornet_sting: iconHornetSting, honeycomb: iconHoneycomb };

// ——— Ranger Acorn: the Ranger's Hat, a red neckerchief, a brass spyglass on a cord and a logbook ———
export function drawRangerDress(ctx, w, h, fx, t) {
  ctx.save();
  // the logbook, strapped at her side
  ctx.save();
  ctx.translate(-w * 0.42, -h * 0.3);
  ctx.rotate(-0.15 + Math.sin(t * 2) * 0.03);
  ctx.fillStyle = '#8a5a3a';
  ctx.strokeStyle = '#4a2e1e';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-8, -10, 16, 20, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f4ead8';
  ctx.fillRect(7, -8, 2, 16);
  ctx.fillStyle = '#d8a050';
  circle(ctx, 0, 0, 2.6);
  ctx.restore();
  // the neckerchief, knotted at the front
  const ny = -h * 0.5;
  ctx.fillStyle = '#e06a5a';
  ctx.strokeStyle = '#a04038';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.36 + fx * 0.3, ny - 4);
  ctx.quadraticCurveTo(fx * 0.3, ny + 5, w * 0.36 + fx * 0.3, ny - 4);
  ctx.lineTo(w * 0.3 + fx * 0.3, ny + 3);
  ctx.quadraticCurveTo(fx * 0.3, ny + 11, -w * 0.3 + fx * 0.3, ny + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath(); // the tails of the knot
  ctx.moveTo(fx * 0.3 + w * 0.06, ny + 6);
  ctx.lineTo(fx * 0.3 + w * 0.0, ny + 16);
  ctx.lineTo(fx * 0.3 + w * 0.14, ny + 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd0c8';
  for (const d of [-0.2, 0.05, 0.25]) circle(ctx, fx * 0.3 + w * d, ny + 1, 1.1);
  // the spyglass on its cord
  ctx.strokeStyle = '#7a5038';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(fx * 0.3 + w * 0.1, ny + 5);
  ctx.quadraticCurveTo(w * 0.3, -h * 0.3, w * 0.34, -h * 0.2);
  ctx.stroke();
  ctx.save();
  ctx.translate(w * 0.34, -h * 0.2);
  ctx.rotate(0.6 + Math.sin(t * 2.2) * 0.06);
  ctx.fillStyle = '#d8b050';
  ctx.strokeStyle = '#8a6a20';
  ctx.beginPath();
  ctx.roundRect(-3, -2, 6, 13, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b89030';
  ctx.fillRect(-3.5, 9, 7, 3);
  ctx.restore();
  ctx.restore();
  // the hat
  ctx.save();
  ctx.translate(fx * 0.25, 0);
  drawRangerHat(ctx, w * 0.92, h, t);
  ctx.restore();
}
