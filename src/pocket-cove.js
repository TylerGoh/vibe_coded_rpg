// Docs: docs/places/pocket.md
// The pocket world's cove (owner 2026-11-21: "a more seamless blockage… still look spacious"): what you see round the
// beach's edges. The edges' shapes are maths in src/pocket-beach.js (coveH in groundH, edgeOf); this draws what's on
// them and past them:
//  - the jungle on the ridge behind the dunes and on the headlands' tops (instanced bushes and trees, a few palms);
//  - sea stacks off the headlands' tips;
//  - the buoy line across the bay's mouth (floats bobbing on the swell, a rope through them);
//  - far off, for the eye to go past the edge: hazy mountains inland, and on the sea's horizon the other islands as
//    the 2D skies draw them (src/distant.js): Frostpeak under its aurora, Greenhollow's hump and apple tree, the Citadel
//    hanging in the sky, Lantern Fen in its mist with lights over it, Emberdeep's smoking volcano, Amberdune's dunes.
// Like the beach, no Three.js import here (it's passed in). Everything is placed by a fixed seed, so every visit (and
// everyone) sees the same cove; the floats and the smoke move on the sea's clock.
import { groundH, waterH, shore, headX, palm, RIDGE_U, BUOY_U, FOG } from './pocket-beach.js';

const BUOY_GAP = 5; // m between floats
const ISLAND_R = 360; // how far off the horizon's islands sit
const HAZE = 0.5; // how much of the haze's colour the far things take (they must look far: docs/places/harbour.md)

export function buildCove(THREE, scene) {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const fog = new THREE.Color(FOG), hazed = (hex, k = HAZE) => new THREE.Color(hex).lerp(fog, k);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
  const put = (mesh, i, x, y, z, sx, sy, sz, rotY = 0) => {
    q.setFromAxisAngle(v.set(0, 1, 0), rotY);
    mesh.setMatrixAt(i, m4.compose(v.set(x, y, z).clone(), q, sc.set(sx, sy, sz)));
  };

  // ——— the jungle: where it grows (the ridge's slope and top, and the headlands' tops) ———
  const spots = [];
  for (let i = 0; i < 2600 && spots.length < 620; i++) {
    const x = -150 + rnd() * 300, z = -158 + rnd() * 230, u = z - shore(x), d = Math.abs(x) - headX(u);
    const onRidge = u < RIDGE_U - 6, onHead = d > 4 && u < 34;
    if (!onRidge && !onHead) continue;
    spots.push({ x, z, y: groundH(x, z) });
  }
  const greens = [0x5e9f5c, 0x77b867, 0x4f8f57, 0x8cc874, 0x3f8452];
  const N_TREE = Math.floor(spots.length * 0.3), N_BUSH = spots.length - N_TREE;
  const leaf = new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true });
  const bushes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), leaf, N_BUSH);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), leaf, N_TREE);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.34, 1, 6).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x9a7356, roughness: 0.9 }), N_TREE);
  spots.forEach((s, i) => {
    col.setHex(greens[i % greens.length]);
    if (i < N_TREE) {
      const h = 4 + rnd() * 4, r = 1.8 + rnd() * 1.4;
      put(trunks, i, s.x, s.y - 0.3, s.z, 1, h, 1);
      put(crowns, i, s.x, s.y + h, s.z, r, r * 0.8, r, rnd() * 6);
      crowns.setColorAt(i, col);
    } else {
      const r = 1 + rnd() * 1.6, j = i - N_TREE;
      put(bushes, j, s.x, s.y + r * 0.2, s.z, r, r * 0.75, r, rnd() * 6);
      bushes.setColorAt(j, col);
    }
  });
  scene.add(bushes, crowns, trunks); // (no shadows: three draws, however many there are)
  // a few palms along the ridge's foot, so the beach's own trees carry on up into the jungle
  const palms = [-128, -84, -52, -18, 26, 58, 92, 124].map((x, i) => {
    const z = shore(x) + RIDGE_U - 4 - (i % 3) * 3;
    return palm(THREE, scene, { x, z, lean: 0.25, h: 8 + (i % 3), turn: 0.3 * Math.sin(i * 2.1) });
  });

  // ——— sea stacks off the headlands' tips ———
  const stackMat = new THREE.MeshStandardMaterial({ color: 0xa79bba, roughness: 0.9, flatShading: true });
  for (const side of [-1, 1]) {
    for (const [dx, u, s, h] of [[4, 70, 3.2, 3], [13, 78, 2.4, 2.6], [-3, 82, 1.4, 1.8], [22, 66, 3.8, 2.2]]) {
      const x = side * (headX(u) + dx), z = shore(x) + u;
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), stackMat);
      m.position.set(x, groundH(x, z) + s * h * 0.55, z);
      m.scale.set(1, h, 1.1);
      m.rotation.y = x * 0.3;
      scene.add(m);
    }
  }

  // ——— the buoy line across the bay's mouth: floats bobbing on the swell, a rope through them ———
  const bx0 = -(headX(BUOY_U) - 1), bx1 = -bx0, nB = Math.round((bx1 - bx0) / BUOY_GAP) + 1;
  const bxs = Array.from({ length: nB }, (_, i) => bx0 + (i * (bx1 - bx0)) / (nB - 1));
  const floats = new THREE.InstancedMesh(new THREE.SphereGeometry(0.38, 12, 8), new THREE.MeshStandardMaterial({ roughness: 0.5 }), nB);
  bxs.forEach((x, i) => floats.setColorAt(i, col.setHex(i % 2 ? 0xfff6f0 : 0xff8a7a)));
  floats.frustumCulled = false;
  const ropePos = new Float32Array(nB * 3);
  const ropeGeo = new THREE.BufferGeometry();
  ropeGeo.setAttribute('position', new THREE.BufferAttribute(ropePos, 3));
  const rope = new THREE.Line(ropeGeo, new THREE.LineBasicMaterial({ color: 0xfff1dc }));
  rope.frustumCulled = false;
  scene.add(floats, rope);

  // ——— far off: mountains inland, hazy flat shapes behind the ridge ———
  const far = (hex, k) => new THREE.MeshBasicMaterial({ color: hazed(hex, k), fog: false });
  const mtnBack = far(0x9d8fc0, 0.62), mtnFront = far(0x8f9fc4, 0.5), snow = far(0xffffff, 0.35);
  for (let i = 0; i < 9; i++) {
    const a = -1.1 + (i / 8) * 2.2 + (rnd() - 0.5) * 0.15, r = 300 + rnd() * 70, h = 70 + rnd() * 70;
    const x = Math.sin(a) * r, z = -Math.cos(a) * r, w = 55 + rnd() * 40;
    const m = new THREE.Mesh(new THREE.ConeGeometry(w, h, 6), i % 2 ? mtnBack : mtnFront);
    m.position.set(x, h / 2 - 8, z);
    m.rotation.y = rnd() * 6;
    scene.add(m);
    if (h > 110) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.22, h * 0.22, 6), snow);
      cap.position.set(x, h - 8 - h * 0.11 + 0.5, z);
      cap.rotation.y = m.rotation.y;
      scene.add(cap);
    }
  }

  // ——— the other islands on the sea's horizon (left to right as you look out: Frostpeak, Greenhollow, the Citadel,
  // Lantern Fen, Emberdeep, Amberdune), small and hazed so they look far ———
  const at = (deg) => [Math.sin((deg * Math.PI) / 180) * ISLAND_R, Math.cos((deg * Math.PI) / 180) * ISLAND_R];
  const add = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    scene.add(m);
    return m;
  };
  const cone = new THREE.ConeGeometry(1, 1, 7), ball = new THREE.SphereGeometry(1, 14, 8);
  const movers = [];
  {
    // Frostpeak: snowy peaks, and the aurora over them
    const [x, z] = at(46), ice = far(0xe8f2ff, 0.4), rockF = far(0x8d9cc0, 0.5);
    add(ball, rockF, x, -3, z, 34, 9, 14);
    for (const [dx, h, w] of [[0, 30, 13], [-12, 22, 10], [11, 19, 9], [20, 13, 7]]) add(cone, ice, x + dx, h / 2 - 2, z + dx * 0.2, w, h, w);
    // (a glowing ribbon, faded to nothing at its edges and ends: a plain sheet read as a grey slab)
    const aur = new THREE.PlaneGeometry(60, 14, 24, 4), ap = aur.attributes.position, ac = [];
    for (let i = 0; i < ap.count; i++) {
      const ax = ap.getX(i) / 30, ay = ap.getY(i) / 7, fade = Math.sin(((ax + 1) / 2) * Math.PI) * Math.sin(((ay + 1) / 2) * Math.PI);
      ap.setZ(i, Math.sin(ap.getX(i) * 0.15) * 4);
      ac.push(0.45, 0.95, 0.75, fade * (0.6 + 0.4 * Math.sin(ax * 5)));
    }
    aur.setAttribute('color', new THREE.Float32BufferAttribute(ac, 4));
    const aurora = add(aur, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }), x, 44, z + 10);
    aurora.lookAt(0, 44, 0);
    movers.push((t) => (aurora.material.opacity = 0.35 + 0.15 * Math.sin(t * 0.4)));
  }
  {
    // Greenhollow: the green hump with the apple tree on it
    const [x, z] = at(24), g = far(0x86c47a, 0.45);
    add(ball, g, x, -4, z, 30, 12, 14);
    add(new THREE.CylinderGeometry(0.6, 0.9, 7, 6), far(0x8a6a50, 0.45), x + 2, 10, z);
    add(ball, far(0x6fb46a, 0.42), x + 2, 15, z, 5.5, 4.5, 5);
    for (const [dx, dy] of [[-2.5, 14], [1.5, 13], [3.5, 16], [0, 17]]) add(ball, far(0xff6f7a, 0.35), x + 2 + dx, dy, z - 4, 0.7, 0.7, 0.7);
  }
  {
    // the Citadel, hanging in the sky: a rock upside down, towers on it
    const [x, z] = at(4), stone = far(0xe2d6ec, 0.3), brass = far(0xf0c46a, 0.25), y = 58;
    const g = new THREE.Group();
    // (a flat-topped rock, ragged underneath: a plain cone read as an arrow)
    const top = new THREE.Mesh(new THREE.CylinderGeometry(15, 12, 4, 8), far(0xb6a4c8, 0.42));
    top.position.y = -2;
    const base = new THREE.Mesh(new THREE.ConeGeometry(12, 11, 8), far(0xa592b8, 0.48));
    base.rotation.x = Math.PI;
    base.position.y = -9.5;
    g.add(top, base);
    for (const [dx, dz, r, h] of [[-7, 2, 4, 7], [6, -2, 3.5, 6], [1, 5, 3, 5]]) {
      const shard = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), far(0xa592b8, 0.48));
      shard.rotation.x = Math.PI;
      shard.position.set(dx, -4 - h / 2, dz);
      g.add(shard);
    }
    for (const [dx, h, r] of [[0, 18, 2.4], [-7, 11, 1.8], [7, 13, 1.8], [-3, 8, 1.4], [4, 7, 1.3]]) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), stone);
      tower.position.set(dx, h / 2, dx * 0.3);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(r * 1.3, r * 2.2, 8), brass);
      roof.position.set(dx, h + r * 1.1, dx * 0.3);
      g.add(tower, roof);
    }
    g.position.set(x, y, z);
    scene.add(g);
    movers.push((t) => (g.position.y = y + Math.sin(t * 0.2) * 1.2));
  }
  {
    // Lantern Fen: a low dark island in violet mist, lights hovering over it
    const [x, z] = at(-22), mist = new THREE.MeshBasicMaterial({ color: hazed(0xc9a8e8, 0.35), transparent: true, opacity: 0.45, depthWrite: false, fog: false });
    add(ball, far(0x5c4f74, 0.5), x, -2, z, 30, 6, 12);
    add(ball, mist, x, 2, z, 40, 5, 16);
    const lamp = new THREE.MeshBasicMaterial({ color: 0xffe28a, fog: false });
    const lights = [[-12, 6], [-4, 8], [3, 6.5], [10, 7.5], [16, 5.5], [-18, 5]].map(([dx, dy], i) => ({ m: add(ball, lamp, x + dx, dy, z - 6, 0.6, 0.6, 0.6), dy, i }));
    movers.push((t) => {
      for (const l of lights) l.m.position.y = l.dy + Math.sin(t * 0.9 + l.i * 1.3) * 0.8;
    });
  }
  {
    // Emberdeep: the volcano, smoke rising off it
    const [x, z] = at(-42), top = 26;
    add(new THREE.CylinderGeometry(3.5, 24, top + 3, 9), far(0x9b6f86, 0.5), x, top / 2 - 3, z);
    add(new THREE.CylinderGeometry(2.6, 3.4, 0.6, 9), far(0xff9a6a, 0.3), x, top - 1.3, z);
    const smokeMat = new THREE.MeshBasicMaterial({ color: hazed(0xb8a3b0, 0.45), transparent: true, opacity: 0.55, depthWrite: false, fog: false });
    const puffs = Array.from({ length: 9 }, (_, i) => ({ m: add(ball, smokeMat, x, top, z, 1, 1, 1), i }));
    movers.push((t) => {
      for (const p of puffs) {
        const s = ((t * 0.05 + p.i / puffs.length) % 1 + 1) % 1; // (each puff climbs, grows and starts again)
        p.m.position.set(x + s * 10 + Math.sin(p.i * 2) * 1.5, top + s * 38, z);
        const r = 2.5 + s * 7;
        p.m.scale.set(r, r * 0.8, r);
      }
    });
  }
  {
    // Amberdune: low golden dunes
    const [x, z] = at(-57), gold = far(0xf2c77a, 0.45), gold2 = far(0xe0ad62, 0.45);
    for (const [dx, w, h, m] of [[-10, 22, 7, gold], [6, 26, 9, gold2], [20, 16, 5, gold]]) add(ball, m, x + dx, -2, z + dx * 0.3, w, h, 10);
  }

  return {
    update(t) {
      // the floats ride the swell, the rope sagging between them
      bxs.forEach((x, i) => {
        const z = shore(x) + BUOY_U + 1, y = waterH(x, z, t);
        put(floats, i, x, y, z, 1, 0.85, 1);
        ropePos.set([x, y + 0.05, z], i * 3);
      });
      floats.instanceMatrix.needsUpdate = true;
      ropeGeo.attributes.position.needsUpdate = true;
      for (const p of palms) p.sway(t);
      for (const m of movers) m(t);
    },
  };
}
