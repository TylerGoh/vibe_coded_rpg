// Docs: docs/places/pocket.md
// The slimes on vacation on the pocket world's beach (owner 2026-11-21: "expand the world with a bunch of slimes on
// vacation. kid slimes family slimes and sails"). Families at umbrella camps (CAMPS in src/pocket-beach.js): a parent
// sunbathing in shades, one sitting in a sunhat, and their kids at play (catch with a beach ball, a sandcastle with a
// bucket run to the sea, chasing round the umbrella, a toddler paddling in a swim ring); a family strolling along the
// waterline; swimmers floating in rings; sailboats looping out on the sea, a slime or two aboard, and far sails on the
// horizon. Everything moves as a function of the sea's clock (the server's, src/pocket.js), so everyone on the beach sees
// the same vacationers in the same places. Only looks: no names, nothing to talk to, not solid (but the umbrellas, the
// cool boxes and the sandcastle are: FOLK_SOLID).
// buildFolk(THREE, scene, makeSlime, { splash }) → { update(t, dt) }. splash(x, y, z, n, power): src/pocket.js's drops.

import { groundH, waterH, shore, CAMPS, CASTLE_AT, COOLER_AT } from './pocket-beach.js';

const KID = 0.6, TODDLER = 0.45; // sizes (a grown slime is 1)
const TAU = Math.PI * 2;
const frac = (v) => v - Math.floor(v);
const seaZ = (x, u) => shore(x) + u; // u out from the waterline

export function buildFolk(THREE, scene, makeSlime, { splash } = {}) {
  const movers = []; // each: (t, dt) → void
  // a slime of this hue and size, maybe dressed: { hat, shades, ring }
  const slime = (hue, size = 1, dress = {}, parent = scene) => {
    const s = makeSlime(THREE, hue);
    s.group.scale.setScalar(size);
    s.group.rotation.order = 'YXZ'; // (turn, then lean back)
    if (dress.hat) hat(THREE, s.body, dress.hat);
    if (dress.shades) shades(THREE, s.body);
    if (dress.ring) ring(THREE, s.group, dress.ring);
    parent.add(s.group);
    s.size = size;
    return s;
  };
  // put a slime at (x, z) on the sand (or the sea's floor), facing `face`, `up` off the ground
  const stand = (s, x, z, face, up = 0) => {
    s.group.position.set(x, groundH(x, z) + up, z);
    s.group.rotation.y = face;
  };
  const idle = { moving: 0, grounded: true, vy: 0 };

  // ——— the camps ———
  for (const [ci, c] of CAMPS.entries()) {
    umbrella(THREE, scene, c);
    for (const [k, col] of c.towels.entries()) towel(THREE, scene, c.x + (k ? 0.75 : -0.75), c.z + 1.3, col);
    coolBox(THREE, scene, c.x + COOLER_AT[0], c.z + COOLER_AT[1], c.towels[0]);
    const hue = c.hue, kidHue = (k) => (hue + 25 + k * 30) % 360;
    const face = Math.PI * 0.02 * (ci - 1.5); // toward the sea, roughly
    // a parent sunbathing on the first towel, in shades, leant right back, breathing
    const sun = slime(hue, 1, { shades: true });
    const tilt = Math.atan2(groundH(c.x - 0.75, c.z + 2) - groundH(c.x - 0.75, c.z + 0.6), 1.4);
    movers.push((t, dt) => {
      stand(sun, c.x - 0.75, c.z + 1.2, face, 0.03);
      sun.group.rotation.x = -0.55 - tilt;
      const b = 1 + Math.sin(t * 1.3 + ci) * 0.02;
      sun.group.scale.set(1.12 * b, 0.72, 1.12 * b);
      sun.animate(dt, idle);
    });
    // the other parent: sitting up in a sunhat (or, at the paddling camp, standing at the water watching the toddler)
    const sit = slime((hue + 300) % 360, 1, { hat: c.canopy[0] });
    if (c.play !== 'paddle') {
      movers.push((t, dt) => {
        stand(sit, c.x + 0.75, c.z + 0.9, face + Math.sin(t * 0.21 + ci) * 0.5, 0.03);
        sit.group.rotation.x = -0.15;
        sit.animate(dt, idle);
      });
    }

    // ——— what the kids play ———
    if (c.play === 'catch') {
      // two kids throw a beach ball back and forth; each hops as it reaches them
      const a = slime(kidHue(0), KID), b = slime(kidHue(1), KID), ball = beachBall(THREE, scene);
      const A = [c.x - 2.4, c.z + 4.6], B = [c.x + 2.6, c.z + 5.4], P = 2.2;
      const face = Math.atan2(B[0] - A[0], B[1] - A[1]);
      const ha = hopper(P * 2, 0.35, 0.18), hb = hopper(P * 2, 0.35, 0.18);
      movers.push((t, dt) => {
        const n = Math.floor(t / P), s = frac(t / P), from = n % 2 ? B : A, to = n % 2 ? A : B;
        const x = from[0] + (to[0] - from[0]) * s, z = from[1] + (to[1] - from[1]) * s;
        ball.position.set(x, groundH(x, z) + 0.75 * KID + 3.2 * s * (1 - s), z);
        ball.rotation.set(t * 3, t * 2, 0);
        const ja = ha(t + P * 0.1), jb = hb(t + P * 1.1); // (each jumps up to catch, just as it comes down to them)
        stand(a, A[0], A[1], face, ja.y);
        stand(b, B[0], B[1], face + Math.PI, jb.y);
        a.animate(dt, ja);
        b.animate(dt, jb);
      });
    } else if (c.play === 'castle') {
      // one kid pats the sandcastle into shape; the other runs to the sea with the bucket and back
      const [cx, cz] = [c.x + CASTLE_AT[0], c.z + CASTLE_AT[1]];
      sandcastle(THREE, scene, cx, cz);
      const pat = slime(kidHue(0), KID), run = slime(kidHue(1), KID), bucket = pail(THREE, run.group);
      bucket.position.set(0.55, 0.35, 0.1);
      const hp = hopper(0.7, 0.12), hr = hopper(0.42, 0.18);
      const sea = [cx + 1.2, seaZ(cx + 1.2, 1.2)], home = [cx + 1.1, cz + 0.6], P = 14;
      let wet = false;
      movers.push((t, dt) => {
        const jp = hp(t);
        stand(pat, cx - 1, cz + 0.2, Math.PI / 2, jp.y);
        pat.animate(dt, jp);
        // the run: 5 s down to the water, 2 s filling up there, 5 s back, 2 s pouring at the castle
        const s = frac(t / P) * P;
        const k = s < 5 ? s / 5 : s < 7 ? 1 : s < 12 ? 1 - (s - 7) / 5 : 0;
        const moving = (s < 5 || (s >= 7 && s < 12)) ? 1 : 0;
        const x = home[0] + (sea[0] - home[0]) * k, z = home[1] + (sea[1] - home[1]) * k;
        const jr = moving ? hr(t) : { ...idle };
        const face = s < 7 ? Math.atan2(sea[0] - home[0], sea[1] - home[1]) : Math.atan2(home[0] - sea[0], home[1] - sea[1]);
        stand(run, x, z, face, jr.y);
        run.animate(dt, { ...jr, moving });
        const inWater = waterH(x, z, t) > groundH(x, z) + 0.04;
        if (inWater && !wet) splash?.(x, waterH(x, z, t), z, 4, 0.5);
        wet = inWater;
      });
    } else if (c.play === 'chase') {
      // two kids (and the littlest) chase each other round and round the umbrella, hopping
      const kids = [slime(kidHue(0), KID), slime(kidHue(1), KID), slime(kidHue(2), TODDLER)];
      const hops = kids.map(() => hopper(0.45, 0.22));
      const [ox, oz] = [c.x, c.z + 4.8], R = 2.8, W = 1.25;
      movers.push((t, dt) => {
        kids.forEach((k, i) => {
          const a = t * W - i * 0.75, j = hops[i](t + i * 0.13);
          const r = i === 2 ? R - 0.55 : R; // (the littlest cuts the corner)
          stand(k, ox + Math.cos(a) * r, oz + Math.sin(a) * r, Math.atan2(-Math.sin(a), Math.cos(a)), j.y);
          k.animate(dt, { ...j, moving: 1 });
        });
      });
    } else if (c.play === 'paddle') {
      // a toddler in a swim ring paddles to and fro in the shallows; its parent stands at the edge, watching
      const tod = slime(kidHue(0), TODDLER, { ring: 0xff8fa6 });
      const P = 18, x0 = c.x - 3, x1 = c.x + 3;
      let wasHop = 0;
      movers.push((t, dt) => {
        const s = frac(t / P), k = s < 0.5 ? s * 2 : 2 - s * 2;
        const x = x0 + (x1 - x0) * (0.5 - 0.5 * Math.cos(k * Math.PI)), z = seaZ(x, 4.2);
        const w = waterH(x, z, t), g = groundH(x, z), y = Math.max(g, w - 0.3 * TODDLER);
        tod.group.position.set(x, y, z);
        tod.group.rotation.y = (s < 0.5 ? 1 : -1) * Math.PI / 2 + Math.sin(t * 2) * 0.2;
        tod.animate(dt, { moving: 0.5, grounded: true, vy: 0, swimming: true });
        // a kick now and then
        const hop = Math.floor(t / 1.7);
        if (hop !== wasHop && Math.random() < 0.6) splash?.(x, w, z, 3, 0.45);
        wasHop = hop;
        const px = x * 0.6 + c.x * 0.4, pz = seaZ(px, 1.4);
        stand(sit, px, pz, Math.atan2(x - px, z - pz), 0);
        sit.group.rotation.x = 0;
        sit.animate(dt, idle);
      });
    }
  }

  // ——— a family strolling along the waterline: a parent in front, two kids after, then a toddler, hopping to keep up ———
  {
    const hue = 270, fam = [slime(hue, 1, { hat: 0xc7a4ff }), slime((hue + 30) % 360, KID), slime((hue + 60) % 360, KID), slime((hue + 90) % 360, TODDLER)];
    const X0 = -50, X1 = 8, P = 100; // (east of X1 the rocks are in the way) // there and back once every P s
    const at = (t) => {
      const s = frac(t / P), k = s < 0.5 ? s * 2 : 2 - s * 2, e = 0.5 - 0.5 * Math.cos(k * Math.PI);
      return { x: X0 + (X1 - X0) * e, dir: s < 0.5 ? 1 : -1 };
    };
    const hops = fam.map((f, i) => hopper(i ? 0.5 - i * 0.04 : 0.9, i ? 0.2 : 0.06));
    movers.push((t, dt) => {
      fam.forEach((f, i) => {
        const p = at(t - i * 1.1), u = 0.6 + (i % 2) * 0.8, z = seaZ(p.x, u), j = hops[i](t);
        stand(f, p.x, z, (p.dir * Math.PI) / 2, j.y);
        f.animate(dt, { ...j, moving: 1 });
        const inW = waterH(p.x, z, t) > groundH(p.x, z) + 0.05;
        if (inW && j.landed && Math.random() < 0.5) splash?.(p.x, waterH(p.x, z, t), z, 3, 0.4);
      });
    });
  }

  // ——— swimmers, floating in rings out past the breakers ———
  for (const [i, [x, u, hue, rc]] of [[-12, 11, 15, 0xffd36e], [-6, 13.5, 185, 0xff8fa6], [8, 12, 95, 0x7fc8f8], [36, 10, 300, 0xa7e08a], [-40, 14, 50, 0xffffff]].entries()) {
    const s = slime(hue, i === 1 ? KID : 1, { ring: rc, shades: i === 2 });
    movers.push((t, dt) => {
      const a = t * 0.08 + i * 1.7, px = x + Math.cos(a) * 2.5, pz = seaZ(px, u) + Math.sin(a) * 1.5;
      s.group.position.set(px, waterH(px, pz, t) - 0.32 * s.size, pz);
      s.group.rotation.y = Math.PI + Math.sin(t * 0.3 + i) * 0.8; // (looking back at the beach, mostly)
      s.animate(dt, { moving: 0, grounded: true, vy: 0, swimming: true });
    });
  }

  // ——— sailboats: looping out on the sea, rocking on the swell, a slime or two aboard; far sails on the horizon ———
  const BOATS = [
    { cx: -10, u: 34, A: 42, B: 7, w: 0.05, ph: 0, size: 1.2, hull: 0xfff6f0, sail: [0xffffff, 0xff8fa6], crew: [210, 30] },
    { cx: 30, u: 50, A: 50, B: 9, w: -0.04, ph: 2, size: 1.5, hull: 0x7fc8f8, sail: [0xffffff, 0xffd36e], crew: [140] },
    { cx: -45, u: 62, A: 38, B: 8, w: 0.035, ph: 4, size: 1.35, hull: 0xffd8a8, sail: [0xfff6f0, 0x7fc8f8], crew: [330, 300] },
    { cx: 60, u: 30, A: 30, B: 6, w: -0.06, ph: 1, size: 1, hull: 0xffffff, sail: [0xa7e08a, 0xffffff], crew: [60] },
    { cx: 5, u: 78, A: 60, B: 10, w: 0.03, ph: 5, size: 1.6, hull: 0xc7a4ff, sail: [0xffffff, 0xff9a7a], crew: [250, 280] },
    // far off, near the horizon (no crew to see)
    { cx: -120, u: 170, A: 70, B: 12, w: 0.015, ph: 0.5, size: 2.8, hull: 0xfff6f0, sail: [0xffffff, 0xffffff], crew: [] },
    { cx: 90, u: 210, A: 80, B: 14, w: -0.012, ph: 3, size: 3.2, hull: 0xfff6f0, sail: [0xffffff, 0xff8fa6], crew: [] },
    { cx: 10, u: 250, A: 90, B: 10, w: 0.01, ph: 1.5, size: 3.5, hull: 0xfff6f0, sail: [0xffd36e, 0xffffff], crew: [] },
  ];
  for (const bt of BOATS) {
    const b = sailboat(THREE, scene, bt);
    const crew = bt.crew.map((hue, k) => {
      const s = slime(hue, k ? KID : 0.62, k ? {} : { hat: bt.sail[1] }, b.group);
      s.group.position.set((k ? 0.25 : -0.2) * bt.size, 0.42 * bt.size, (k ? 0.5 : -0.95) * bt.size);
      s.group.rotation.y = k ? Math.PI * 0.5 : 0;
      return s;
    });
    movers.push((t, dt) => {
      const a = bt.w * t + bt.ph;
      const x = bt.cx + Math.cos(a) * bt.A, z = seaZ(bt.cx, bt.u) + Math.sin(a) * bt.B;
      const vx = -Math.sin(a) * bt.A * bt.w, vz = Math.cos(a) * bt.B * bt.w;
      const e = 1.2 * bt.size, y = waterH(x, z, t);
      const head = Math.atan2(vx, vz);
      // pitch and roll with the swell under it, and heel a little away from the wind (off the sea, toward the land)
      const fx = Math.sin(head), fz = Math.cos(head);
      const pitch = Math.atan2(waterH(x - fx * e, z - fz * e, t) - waterH(x + fx * e, z + fz * e, t), 2 * e);
      const roll = Math.atan2(waterH(x + fz * e, z - fx * e, t) - waterH(x - fz * e, z + fx * e, t), 2 * e);
      b.group.position.set(x, y - 0.15 * bt.size, z);
      b.group.rotation.set(pitch, head, roll + 0.12 * Math.sign(fx || 1), 'YXZ');
      b.flutter(t);
      for (const s of crew) s.animate(dt, idle);
    });
  }

  return {
    update(t, dt) {
      for (const m of movers) m(t, dt);
    },
  };
}

// A hop on a beat: → (t) → { y, vy, grounded, landed } (what a slime's jelly needs, src/pocket-slime.js). Up for `air`
// of every `period` s, `height` high.
function hopper(period, height, air = 0.55) {
  let prev = 0;
  return (t) => {
    const ph = frac(t / period);
    let y = 0, vy = 0, grounded = true, landed = 0;
    if (ph < air) {
      const s = ph / air;
      y = 4 * height * s * (1 - s);
      vy = (4 * height * (1 - 2 * s)) / (air * period);
      grounded = false;
    } else if (prev < air) landed = (4 * height) / (air * period);
    prev = ph;
    return { y, vy, grounded, landed, moving: 0 };
  };
}

// ——— things worn ———
// a straw sunhat with a ribbon in this colour
function hat(THREE, body, ribbon) {
  const straw = new THREE.MeshStandardMaterial({ color: 0xf3d58f, roughness: 0.85 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.55, 0.03, 24), straw);
  brim.position.y = 0.8;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.2, 18), straw);
  crown.position.y = 0.9;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.305, 0.305, 0.06, 18), new THREE.MeshStandardMaterial({ color: ribbon, roughness: 0.6 }));
  band.position.y = 0.84;
  const g = new THREE.Group();
  g.add(brim, crown, band);
  g.rotation.x = -0.12; // (tipped back a little)
  g.position.z = -0.03;
  for (const m of g.children) m.castShadow = true;
  body.add(g);
}
// round sunglasses over the eyes
function shades(THREE, body) {
  const dark = new THREE.MeshStandardMaterial({ color: 0x2d2a3e, roughness: 0.15, metalness: 0.3 });
  for (const side of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), dark);
    lens.position.set(side * 0.15, 0.45, 0.555);
    lens.scale.set(0.085, 0.07, 0.025);
    body.add(lens);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.018, 0.02), dark);
  bar.position.set(0, 0.47, 0.575);
  body.add(bar);
}
// a swim ring round the middle, striped with white
function ring(THREE, group, color) {
  const geo = new THREE.TorusGeometry(0.6, 0.14, 10, 24).toNonIndexed();
  stripe(THREE, geo, (x, y) => Math.floor(((Math.atan2(y, x) + Math.PI) / TAU) * 8) % 2, [color, 0xffffff]);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4 }));
  m.rotation.x = Math.PI / 2;
  m.position.y = 0.28;
  m.castShadow = true;
  group.add(m);
}
// colour a non-indexed geometry's triangles by which(x, y, z) of their middle: 0 or 1 → cols[0] or cols[1]
function stripe(THREE, geo, which, cols) {
  const p = geo.attributes.position, out = [], c = [new THREE.Color(cols[0]), new THREE.Color(cols[1])];
  for (let i = 0; i < p.count; i += 3) {
    const mx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, my = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, mz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const k = c[which(mx, my, mz)];
    for (let j = 0; j < 3; j++) out.push(k.r, k.g, k.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(out, 3));
  geo.computeVertexNormals();
}

// ——— the camps' things ———
function umbrella(THREE, scene, c) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.7, 8), new THREE.MeshStandardMaterial({ color: 0xfff6f0, roughness: 0.5 }));
  pole.position.y = 1.2;
  const geo = new THREE.CylinderGeometry(0.06, 1.75, 0.55, 12, 1, true).toNonIndexed();
  stripe(THREE, geo, (x, y, z) => Math.floor(((Math.atan2(z, x) + Math.PI) / TAU) * 12) % 2, c.canopy);
  const canopy = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }));
  canopy.position.y = 2.45;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), pole.material);
  knob.position.y = 2.75;
  g.add(pole, canopy, knob);
  for (const m of g.children) m.castShadow = true;
  g.position.set(c.x, groundH(c.x, c.z) - 0.1, c.z);
  g.rotation.x = 0.22; // (tipped toward the low sun)
  scene.add(g);
}
function towel(THREE, scene, x, z, color) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.03, 2), new THREE.MeshStandardMaterial({ color, roughness: 0.95 }));
  g.add(base);
  for (const dz of [-0.7, 0.7]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.034, 0.18), new THREE.MeshStandardMaterial({ color: 0xfff6f0, roughness: 0.95 }));
    s.position.z = dz;
    g.add(s);
  }
  for (const m of g.children) m.receiveShadow = true;
  g.position.set(x, groundH(x, z) + 0.05, z);
  g.rotation.x = -Math.atan2(groundH(x, z + 1) - groundH(x, z - 1), 2);
  scene.add(g);
}
function coolBox(THREE, scene, x, z, color) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.42), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
  box.position.y = 0.2;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.46), new THREE.MeshStandardMaterial({ color: 0xfff6f0, roughness: 0.5 }));
  lid.position.y = 0.44;
  g.add(box, lid);
  for (const m of g.children) m.castShadow = m.receiveShadow = true;
  g.position.set(x, groundH(x, z), z);
  g.rotation.y = 0.4;
  scene.add(g);
}
// a beach ball, six panels
function beachBall(THREE, scene) {
  const geo = new THREE.SphereGeometry(0.28, 18, 12).toNonIndexed();
  const cols = [0xff8fa6, 0xffffff, 0x7fc8f8, 0xffffff, 0xffd36e, 0xffffff].map((c) => new THREE.Color(c));
  const p = geo.attributes.position, out = [];
  for (let i = 0; i < p.count; i += 3) {
    const mx = p.getX(i) + p.getX(i + 1) + p.getX(i + 2), mz = p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2);
    const k = cols[Math.floor(((Math.atan2(mz, mx) + Math.PI) / TAU) * 6) % 6];
    for (let j = 0; j < 3; j++) out.push(k.r, k.g, k.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(out, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }));
  m.castShadow = true;
  scene.add(m);
  return m;
}
function sandcastle(THREE, scene, x, z) {
  const sand = new THREE.MeshStandardMaterial({ color: 0xe6c992, roughness: 0.95, flatShading: true });
  const g = new THREE.Group();
  const add = (geo, px, py, pz) => {
    const m = new THREE.Mesh(geo, sand);
    m.position.set(px, py, pz);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
  };
  add(new THREE.CylinderGeometry(0.7, 0.85, 0.3, 12), 0, 0.12, 0);
  add(new THREE.CylinderGeometry(0.3, 0.34, 0.6, 10), 0, 0.55, 0); // the keep
  add(new THREE.ConeGeometry(0.34, 0.35, 10), 0, 1.02, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    add(new THREE.CylinderGeometry(0.14, 0.16, 0.42, 8), Math.cos(a) * 0.55, 0.45, Math.sin(a) * 0.55);
    add(new THREE.ConeGeometry(0.16, 0.2, 8), Math.cos(a) * 0.55, 0.76, Math.sin(a) * 0.55);
  }
  // a little flag on the keep
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 4), new THREE.MeshStandardMaterial({ color: 0xfff6f0 }));
  stick.position.set(0, 1.35, 0);
  const flag = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.22, -0.06, 0), new THREE.Vector3(0, -0.13, 0)]),
    new THREE.MeshStandardMaterial({ color: 0xff8fa6, side: THREE.DoubleSide }));
  flag.position.set(0.01, 1.52, 0);
  g.add(stick, flag);
  g.position.set(x, groundH(x, z) - 0.05, z);
  scene.add(g);
}
// a little bucket, carried by a kid (on its group, so it doesn't squash)
function pail(THREE, parent) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.26, 12), new THREE.MeshStandardMaterial({ color: 0xff9a7a, roughness: 0.5 }));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 4, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0xfff6f0 }));
  handle.position.y = 0.13;
  g.add(b, handle);
  b.castShadow = true;
  parent.add(g);
  return g;
}

// A sailboat (bt: { size, hull, sail: [colour, stripe] }), facing +z: → { group, flutter(t) }
function sailboat(THREE, scene, bt) {
  const group = new THREE.Group();
  group.rotation.order = 'YXZ';
  const inner = new THREE.Group(); // (scaled; the crew go on `group`, scaled on their own)
  inner.scale.setScalar(bt.size);
  group.add(inner);
  // the hull: a rounded, pointed outline seen from above, given depth
  const out = new THREE.Shape();
  out.moveTo(-0.55, -1.4);
  out.lineTo(0.55, -1.4);
  out.quadraticCurveTo(0.72, 0.1, 0, 1.75);
  out.quadraticCurveTo(-0.72, 0.1, -0.55, -1.4);
  const hullGeo = new THREE.ExtrudeGeometry(out, { depth: 0.42, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
  hullGeo.rotateX(Math.PI / 2); // (the outline lies flat, its depth downward)
  hullGeo.translate(0, 0.42, 0);
  const hull = new THREE.Mesh(hullGeo, new THREE.MeshStandardMaterial({ color: bt.hull, roughness: 0.45 }));
  hull.castShadow = true;
  const deckGeo = new THREE.ShapeGeometry(out);
  deckGeo.rotateX(-Math.PI / 2);
  deckGeo.scale(0.9, 1, -0.9);
  const deck = new THREE.Mesh(deckGeo, new THREE.MeshStandardMaterial({ color: 0xd8b48a, roughness: 0.8, side: THREE.DoubleSide }));
  deck.position.y = 0.45;
  // a stripe along the side, just under the gunwale
  const band = new THREE.Mesh(hullGeo, new THREE.MeshStandardMaterial({ color: bt.sail[1] === 0xffffff ? 0x7fc8f8 : bt.sail[1], roughness: 0.45 }));
  band.scale.set(1.02, 0.12, 1.02);
  band.position.y = 0.33;
  // the mast and boom
  const wood = new THREE.MeshStandardMaterial({ color: 0xc19468, roughness: 0.8 });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 3.4, 8), wood);
  mast.position.set(0, 2.1, 0.35);
  mast.castShadow = true;
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 6), wood);
  boom.rotation.x = Math.PI / 2;
  boom.position.set(0, 0.75, -0.48);
  // the sails: a mainsail back from the mast and a jib to the bow, in bands of colour, filled a little by the wind
  const sailMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
  const main = new THREE.Mesh(sailGeo(THREE, [0, 0.8, 0.33], [0, 3.7, 0.33], [0, 0.8, -1.3], bt.sail), sailMat);
  const jib = new THREE.Mesh(sailGeo(THREE, [0, 0.62, 0.55], [0, 3.3, 0.37], [0, 0.6, 1.55], bt.sail), sailMat);
  main.castShadow = jib.castShadow = true;
  // a pennant at the top
  const pen = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.06, -0.45), new THREE.Vector3(0, -0.14, 0)]),
    new THREE.MeshStandardMaterial({ color: bt.sail[1] === 0xffffff ? 0xff8fa6 : bt.sail[1], side: THREE.DoubleSide }));
  pen.position.set(0, 3.82, 0.35);
  inner.add(hull, band, deck, mast, boom, main, jib, pen);
  scene.add(group);
  return {
    group,
    flutter(t) {
      const f = Math.sin(t * 2.3 + bt.ph) * 0.03;
      main.rotation.y = 0.18 + f; // (sheeted out a touch, breathing)
      jib.rotation.y = -0.12 - f;
      pen.rotation.y = Math.sin(t * 6 + bt.ph) * 0.35;
    },
  };
}
// a triangular sail (tack, head, clew), in horizontal bands of cols[0] with every third cols[1], bellied out sideways
function sailGeo(THREE, tack, head, clew, cols) {
  const N = 9, pos = [], col = [], c0 = new THREE.Color(cols[0]), c1 = new THREE.Color(cols[1]);
  const lerp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const belly = (p, k) => [p[0] + 0.28 * Math.sin(Math.PI * k) * (1 - p[1] / 4), p[1], p[2]];
  for (let i = 0; i < N; i++) {
    const k0 = i / N, k1 = (i + 1) / N;
    // the band's four corners: up the luff (tack → head) and up the leech (clew → head)
    const a0 = lerp(tack, head, k0), a1 = lerp(tack, head, k1), b0 = lerp(clew, head, k0), b1 = lerp(clew, head, k1);
    const m0 = belly(lerp(a0, b0, 0.5), 1), m1 = belly(lerp(a1, b1, 0.5), 1);
    const cc = i % 3 === 1 ? c1 : c0;
    for (const v of [a0, m0, a1, m0, m1, a1, m0, b0, m1, b0, b1, m1]) {
      pos.push(...v);
      col.push(cc.r, cc.g, cc.b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
