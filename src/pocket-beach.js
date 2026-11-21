// Docs: docs/places/pocket.md
// The pocket world's beach (step 4, owner 2026-11-20: "real 3d… a palm tree and a beach with waves"). Two halves:
//  - the shapes as plain maths (groundH: the sand; waterH: the sea's surface), used by src/pocket.js to walk, wade and
//    swim. The water's shader (WATER_GLSL) has the very same formulas, so you float on the waves you see. Change one,
//    change the other.
//  - buildBeach(THREE, scene): the sky, the sand, the sea, palm trees, rocks, starfish and clouds; → { update(t, eye) }.
//  - where the vacationers' camps stand (CAMPS, FOLK_SOLID); they're built and moved in src/pocket-folk.js.
// No Three.js import here (it's passed in), so the maths runs in Node too. Units are metres-ish: a slime is about 1 tall.
// The shore runs along x (wavy, `shore`); the land is toward -z, the sea toward +z, where the sun hangs low.

export const SEA = 0; // the still sea level
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const shore = (x) => 3 * Math.sin(x * 0.045) + 1.5 * Math.sin(x * 0.11 + 1.3);

// ——— the cove (owner 2026-11-21: "a more seamless blockage… still look spacious"): the beach is a bay, with rocky
// headlands at both ends running out into the sea, a jungle ridge rising behind the dunes, and a line of buoys across
// the bay's mouth where a current carries swimmers back. The ground's own shape is the edge you see; edgeOf is the one
// you walk into (the server keeps everyone inside it too, keepIn) ———
export const HEAD_X = 97, HEAD_PINCH = 6, HEAD_H = 13; // the headlands' inner foot (|x|), how far they close in by the bay's mouth, how high
export const RIDGE_U = -37, RIDGE_H = 15; // where the ridge starts rising (u: from the waterline, inland negative), how high it climbs
export const BUOY_U = 44; // the buoy line across the bay's mouth (u)
const WALK_RIDGE = RIDGE_U - 3, WALK_HEAD = 1.5; // how far up the ridge you get, how near the headlands' foot
export const headX = (u) => HEAD_X - HEAD_PINCH * smooth(0, BUOY_U + 10, u);
const rough = (x, z) => Math.sin(x * 0.31 + z * 0.19) * Math.sin(z * 0.37 - x * 0.13);
// how much of the ridge (grass) and the headlands (rock) is at (x, z), 0..1 each (src/pocket-beach.js colours the sand by them)
export function coveK(x, z) {
  const u = z - shore(x);
  return { ridge: smooth(RIDGE_U + 2, RIDGE_U - 4, u), rock: smooth(-1, 3, Math.abs(x) - headX(u)) * (1 - smooth(52, 68, u)) };
}
function coveH(x, z, u) {
  const d = Math.abs(x) - headX(u), r = rough(x, z);
  const ridge = smooth(RIDGE_U, RIDGE_U - 18, u) * (RIDGE_H * (0.85 + 0.15 * Math.sin(x * 0.05)) + r * 1.5) + 6 * smooth(RIDGE_U - 15, RIDGE_U - 70, u);
  const head = smooth(-1, 7, d) * (1 - smooth(46, 68, u)) * (HEAD_H + r * 2.2 + 2 * Math.sin(u * 0.13 + x * 0.02));
  return ridge + head;
}
// the sand's height at (x, z): rising gently inland to low dunes, sloping down under the sea, and the cove round it
export function groundH(x, z) {
  const u = z - shore(x); // > 0: the sea side
  if (u >= 0) return Math.max(-7, -u * 0.11) + coveH(x, z, u);
  return -u * 0.07 + 1.4 * smooth(-18, -40, u) * (0.6 + 0.4 * Math.sin(x * 0.09)) + coveH(x, z, u);
}
// how near the edge (x, z) is: e > 0 past it, e < 0 that far inside; (nx, nz) points out; kind: 'rocks' | 'ridge' | 'sea'
export function edgeOf(x, z) {
  const u = z - shore(x);
  const eH = Math.abs(x) - (headX(u) - WALK_HEAD), eR = WALK_RIDGE - u, eS = u - BUOY_U;
  if (eH >= eR && eH >= eS) return { e: eH, nx: Math.sign(x) || 1, nz: 0, kind: 'rocks' };
  if (eR >= eS) return { e: eR, nx: 0, nz: -1, kind: 'ridge' };
  return { e: eS, nx: 0, nz: 1, kind: 'sea' };
}
// (x, z) moved back inside the cove if it's past the edge → [x, z]
export function keepIn(x, z) {
  for (let i = 0; i < 3; i++) {
    const E = edgeOf(x, z);
    if (E.e <= 0) break;
    x -= E.nx * E.e;
    z -= E.nz * E.e;
  }
  return [x, z];
}
// the sea's surface at (x, z) at time t: swells rolling in (fading near the beach) and the swash, the whole edge of the
// water running up the sand and back
export function waterH(x, z, t) {
  const u = z - shore(x);
  const swell = 0.2 * Math.sin(0.35 * z - 1.1 * t + 0.2 * Math.sin(0.07 * x)) + 0.1 * Math.sin(0.21 * x + 0.5 * z - 0.7 * t);
  const swash = 0.17 * Math.sin(0.9 * t) + 0.06 * Math.sin(2.1 * t + 1);
  return SEA + swell * smooth(-1, 12, u) + swash * (1 - smooth(4, 14, u));
}

// the same functions in GLSL, for the water's shader (the cove's numbers written out: HEAD_X, HEAD_PINCH, BUOY_U + 10,
// RIDGE_U, RIDGE_H, HEAD_H. Change one, change the other)
const WATER_GLSL = `
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
}
float sm(float a, float b, float v) { float t = clamp((v - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float shoreZ(float x) { return 3.0 * sin(x * 0.045) + 1.5 * sin(x * 0.11 + 1.3); }
float coveH(float x, float z, float u) {
  float d = abs(x) - (97.0 - 6.0 * sm(0.0, 54.0, u)), r = sin(x * 0.31 + z * 0.19) * sin(z * 0.37 - x * 0.13);
  float ridge = sm(-37.0, -55.0, u) * (15.0 * (0.85 + 0.15 * sin(x * 0.05)) + r * 1.5) + 6.0 * sm(-52.0, -107.0, u);
  float head = sm(-1.0, 7.0, d) * (1.0 - sm(46.0, 68.0, u)) * (13.0 + r * 2.2 + 2.0 * sin(u * 0.13 + x * 0.02));
  return ridge + head;
}
float groundH(float x, float z) {
  float u = z - shoreZ(x);
  if (u >= 0.0) return max(-7.0, -u * 0.11) + coveH(x, z, u);
  return -u * 0.07 + 1.4 * sm(-18.0, -40.0, u) * (0.6 + 0.4 * sin(x * 0.09)) + coveH(x, z, u);
}
float waterH(float x, float z, float t) {
  float u = z - shoreZ(x);
  float swell = 0.2 * sin(0.35 * z - 1.1 * t + 0.2 * sin(0.07 * x)) + 0.1 * sin(0.21 * x + 0.5 * z - 0.7 * t);
  float swash = 0.17 * sin(0.9 * t) + 0.06 * sin(2.1 * t + 1.0);
  return swell * sm(-1.0, 12.0, u) + swash * (1.0 - sm(4.0, 14.0, u));
}
`;

// where the palm trees stand (x, z, lean toward the sea, height), and the rocks
export const PALMS = [
  { x: -6, z: -9, lean: 0.35, h: 7.5, turn: 0.4 },
  { x: 9, z: -13, lean: 0.25, h: 6.4, turn: -0.6 },
  { x: -17, z: -16, lean: 0.3, h: 8.2, turn: 1.4 },
  // (the wider beach, owner 2026-11-21: "expand the world")
  { x: -40, z: -19, lean: 0.3, h: 7.8, turn: -0.3 }, { x: -50, z: -24, lean: 0.2, h: 8.8, turn: 0.9 },
  { x: 33, z: -15, lean: 0.32, h: 7.2, turn: 0.2 }, { x: 40, z: -21, lean: 0.22, h: 8.4, turn: -1.1 },
  { x: 64, z: -13, lean: 0.35, h: 7, turn: 0.5 }, { x: -72, z: -14, lean: 0.3, h: 7.6, turn: -0.5 },
  { x: 82, z: -22, lean: 0.25, h: 8.6, turn: 1.2 }, { x: -90, z: -20, lean: 0.28, h: 8, turn: 0.1 },
];
// the mirror home (src/pocket-mirror.js): where it stands; it faces the sea
export const MIRROR_AT = { x: 1.5, z: -8.5 };
export const ROCKS = [
  { x: 14, z: 2, s: 1.3 }, { x: 15.6, z: 3.2, s: 0.7 }, { x: -24, z: 4, s: 1.8 }, { x: 4, z: -22, s: 0.9 }, { x: -9, z: 8, s: 0.6 },
  { x: 72, z: 6, s: 2.2 }, { x: 74.5, z: 7.5, s: 1.1 }, { x: -78, z: 3, s: 1.6 }, { x: 56, z: -26, s: 1.2 }, { x: -45, z: 9, s: 0.8 },
];

// the vacationers' camps (src/pocket-folk.js; owner 2026-11-21: "a bunch of slimes on vacation. kid slimes family slimes
// and sails"): an umbrella at (x, z), `back` in from the waterline, towels toward the sea, a cool box, and what the kids
// play there (catch, castle, chase, paddle). Kept here, plain data, so src/pocket.js can make the solid bits solid.
export const CAMPS = [
  { x: -30, back: 7, play: 'catch', canopy: [0xff8fa6, 0xfff6f0], towels: [0x7fc8f8, 0xffd36e], hue: 200 },
  { x: 22, back: 8, play: 'castle', canopy: [0x7fc8f8, 0xfff6f0], towels: [0xff9fb0, 0xa7e08a], hue: 330 },
  { x: 48, back: 6.5, play: 'chase', canopy: [0xffd36e, 0xff9a7a], towels: [0xc7a4ff, 0x7fc8f8], hue: 40 },
  { x: -58, back: 7.5, play: 'paddle', canopy: [0xa7e08a, 0xfff6f0], towels: [0xffb27a, 0xff8fa6], hue: 120 },
].map((c) => ({ ...c, z: shore(c.x) - c.back }));
export const CASTLE_AT = [2.6, 3.4], COOLER_AT = [-2, -0.4]; // from a camp's umbrella
export const FOLK_SOLID = CAMPS.flatMap((c) => [
  { x: c.x, z: c.z, r: 0.25 },
  { x: c.x + COOLER_AT[0], z: c.z + COOLER_AT[1], r: 0.4 },
  ...(c.play === 'castle' ? [{ x: c.x + CASTLE_AT[0], z: c.z + CASTLE_AT[1], r: 0.8 }] : []),
]);

const SKY_TOP = 0x7fb3ec, SKY_MID = 0xf5c5d9, SKY_LOW = 0xffe0b3;
export const FOG = 0xf8d9c6; // the haze at the horizon (the sky's lowest colour, a touch pinker)
export const SUN_DIR = [0.35, 0.22, 0.91]; // toward the low sun, over the sea

export function buildBeach(THREE, scene) {
  const sunDir = new THREE.Vector3(...SUN_DIR).normalize();
  // ——— the sky: a dome with a pastel gradient and a soft sun ———
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(450, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { top: { value: new THREE.Color(SKY_TOP) }, mid: { value: new THREE.Color(SKY_MID) }, low: { value: new THREE.Color(SKY_LOW) }, sun: { value: sunDir } },
      vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 top, mid, low, sun; varying vec3 vDir;
        void main() {
          float h = vDir.y;
          vec3 c = mix(low, mid, smoothstep(0.0, 0.18, h));
          c = mix(c, top, smoothstep(0.15, 0.6, h));
          if (h < 0.0) c = low;
          float d = max(dot(normalize(vDir), sun), 0.0);
          c += vec3(1.0, 0.85, 0.6) * (pow(d, 600.0) * 1.2 + pow(d, 12.0) * 0.35);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  scene.add(sky);

  // ——— the sand: a heightfield, dry on top, darker where the water reaches, tinted under it ———
  const sandGeo = new THREE.PlaneGeometry(300, 300, 230, 230); // (wide enough that the ridge and headlands run off past the fog)
  sandGeo.rotateX(-Math.PI / 2);
  const p = sandGeo.attributes.position, cols = [];
  const dry = new THREE.Color(0xf4e0b2), wet = new THREE.Color(0xd8bb8c), deep = new THREE.Color(0xb9b49a), c = new THREE.Color();
  const grass = new THREE.Color(0x7fbf6a), grass2 = new THREE.Color(0x5e9f5c), rock = new THREE.Color(0xb3a6c2), rock2 = new THREE.Color(0x8f84a6);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i) - 8;
    const ripple = 0.035 * Math.sin(x * 1.7 + z * 0.9) * Math.sin(z * 2.3 - x * 0.4);
    const h = groundH(x, z);
    p.setY(i, h + ripple);
    p.setZ(i, z);
    c.copy(dry).lerp(wet, smooth(0.6, 0.05, h)).lerp(deep, smooth(-0.3, -3, h));
    const k = coveK(x, z), n = 0.5 + 0.5 * Math.sin(x * 0.7 + z * 0.4) * Math.sin(z * 0.9 - x * 0.3);
    if (k.ridge > 0) c.lerp(grass.clone().lerp(grass2, n), k.ridge * (1 - k.rock));
    if (k.rock > 0) c.lerp(rock.clone().lerp(rock2, n * 0.8 + smooth(2, 10, h) * 0.2), k.rock);
    const j = 1 + (Math.sin(x * 12.9898 + z * 78.233) * 43758.5453 % 1) * 0.03; // a grain of noise
    cols.push(c.r * j, c.g * j, c.b * j);
  }
  sandGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  sandGeo.computeVertexNormals();
  const sand = new THREE.Mesh(sandGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  sand.receiveShadow = true;
  scene.add(sand);

  // ——— the sea: the swells and swash moved in the vertex shader, foam at the edge and on the breakers ———
  const waterGeo = new THREE.PlaneGeometry(420, 420, 220, 220);
  waterGeo.rotateX(-Math.PI / 2);
  waterGeo.translate(0, 0, 150);
  const water = new THREE.Mesh(
    waterGeo,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        t: { value: 0 }, sun: { value: sunDir }, eye: { value: new THREE.Vector3() },
        fogColor: { value: new THREE.Color(FOG) }, shallow: { value: new THREE.Color(0x86e3d6) }, deepC: { value: new THREE.Color(0x4a92c9) }, skyC: { value: new THREE.Color(SKY_MID) },
      },
      vertexShader: `${WATER_GLSL}
        uniform float t; varying vec3 vPos; varying vec3 vN;
        void main() {
          vec3 p = position;
          p.y = waterH(p.x, p.z, t);
          float e = 0.3;
          float hx = waterH(p.x + e, p.z, t) - waterH(p.x - e, p.z, t), hz = waterH(p.x, p.z + e, t) - waterH(p.x, p.z - e, t);
          vN = normalize(vec3(-hx, 2.0 * e, -hz));
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `${WATER_GLSL}
        uniform float t; uniform vec3 sun, eye, fogColor, shallow, deepC, skyC; varying vec3 vPos; varying vec3 vN;
        void main() {
          float depth = vPos.y - groundH(vPos.x, vPos.z);
          if (depth < 0.0) discard;
          vec3 V = normalize(eye - vPos), N = normalize(vN);
          vec3 col = mix(shallow, deepC, smoothstep(0.2, 4.5, depth));
          float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
          col = mix(col, skyC, fres * 0.6);
          col += vec3(1.0, 0.9, 0.75) * pow(max(dot(reflect(-sun, N), V), 0.0), 80.0) * 1.4;
          // foam: a lacy rim where the water meets the sand, and lines on the breakers rolling in
          float u = vPos.z - shoreZ(vPos.x);
          // (lace: two layers of drifting noise, so the foam breaks into bubbly patches instead of a grid)
          float lace = vnoise(vPos.xz * 1.4 + vec2(t * 0.25, -t * 0.45)) * 0.6 + vnoise(vPos.xz * 4.2 - vec2(t * 0.6, t * 0.15)) * 0.4;
          float edge = 1.0 - smoothstep(0.0, 0.05, depth); // the thin bright line right at the edge
          float rim = (1.0 - smoothstep(0.03, 0.3, depth)) * smoothstep(0.35, 0.7, lace);
          float crest = smoothstep(0.9, 1.0, 0.5 + 0.5 * sin(u * 0.55 + t * 1.3 + vnoise(vPos.xz * 0.3) * 2.0));
          float wave = crest * sm(1.0, 4.0, u) * (1.0 - sm(10.0, 18.0, u)) * smoothstep(0.4, 0.75, lace);
          float foam = clamp(edge * 0.9 + rim * 0.85 + wave * 0.8, 0.0, 1.0);
          col = mix(col, vec3(1.0), foam);
          float alpha = mix(0.45, 0.9, smoothstep(0.0, 1.6, depth));
          alpha = max(alpha, foam);
          float dist = length(eye - vPos);
          col = mix(col, fogColor, smoothstep(60.0, 260.0, dist));
          gl_FragColor = vec4(col, alpha);
        }`,
    }),
  );
  water.frustumCulled = false; // (moved in the shader)
  scene.add(water);

  // ——— palm trees: a curved, ringed trunk, drooping fronds that sway, coconuts ———
  const palms = PALMS.map((pl) => palm(THREE, scene, pl));

  // ——— rocks and starfish ———
  const rockMat = new THREE.MeshStandardMaterial({ color: 0xb8aec8, roughness: 0.9, flatShading: true });
  for (const r of ROCKS) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r.s, 0), rockMat);
    m.position.set(r.x, groundH(r.x, r.z) + r.s * 0.35, r.z);
    m.scale.set(1, 0.65, 1.1);
    m.rotation.set(r.x, r.z, 0.3);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  }
  const star = new THREE.Shape();
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? 0.1 : 0.26;
    i ? star.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : star.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  const starGeo = new THREE.ExtrudeGeometry(star, { depth: 0.05, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
  starGeo.rotateX(-Math.PI / 2);
  for (const [x, z, col] of [[3, -2, 0xff9fb0], [-5, 1.5, 0xffb27a], [11, -4, 0xff8fa6], [-13, -1, 0xd6a4ff]]) {
    const m = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 }));
    m.position.set(x, groundH(x, z) + 0.02, z);
    m.rotation.y = x;
    scene.add(m);
  }

  // ——— clouds, far over the sea ———
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xfff4f4, fog: false, transparent: true, opacity: 0.9 });
  const puff = new THREE.SphereGeometry(1, 12, 8);
  for (const [x, y, z, s] of [[-80, 40, 180, 9], [40, 55, 220, 12], [120, 35, 160, 8], [-160, 50, 120, 10], [10, 70, 300, 16]]) {
    const g = new THREE.Group();
    for (const [dx, dy, ds] of [[0, 0, 1], [1.1, -0.2, 0.8], [-1.1, -0.25, 0.75], [0.4, 0.45, 0.7]]) {
      const m = new THREE.Mesh(puff, cloudMat);
      m.position.set(dx * s, dy * s, 0);
      m.scale.set(ds * s, ds * s * 0.6, ds * s * 0.6);
      g.add(m);
    }
    g.position.set(x, y, z);
    scene.add(g);
  }

  return {
    water,
    update(t, eye) {
      water.material.uniforms.t.value = t;
      water.material.uniforms.eye.value.copy(eye);
      for (const pl of palms) pl.sway(t);
    },
  };
}

// One palm tree at pl = { x, z, lean, h, turn }: → { sway(t) } (src/pocket-cove.js plants some on the ridge too)
export function palm(THREE, scene, pl) {
  const base = new THREE.Vector3(pl.x, groundH(pl.x, pl.z) - 0.2, pl.z);
  const lean = new THREE.Vector3(Math.sin(pl.turn), 0, Math.cos(pl.turn)).multiplyScalar(pl.lean * pl.h);
  const curve = new THREE.QuadraticBezierCurve3(base, base.clone().add(new THREE.Vector3(0, pl.h * 0.55, 0)).addScaledVector(lean, 0.15), base.clone().add(new THREE.Vector3(0, pl.h, 0)).add(lean));
  const SEG = 16, bark = [new THREE.MeshStandardMaterial({ color: 0xc19468, roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: 0xad8158, roughness: 0.9 })];
  const up = new THREE.Vector3(0, 1, 0), rings = [[], []], q = new THREE.Quaternion(), mat = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < SEG; i++) {
    const a = curve.getPoint(i / SEG), b = curve.getPoint((i + 1) / SEG), len = a.distanceTo(b);
    const r0 = 0.34 - (i / SEG) * 0.16, r1 = 0.34 - ((i + 1) / SEG) * 0.16;
    const geo = new THREE.CylinderGeometry(r1 * 0.92, r0, len * 1.04, 10);
    q.setFromUnitVectors(up, b.clone().sub(a).normalize());
    geo.applyMatrix4(mat.compose(a.clone().add(b).multiplyScalar(0.5), q, one));
    rings[i % 2].push(geo);
  }
  // (the rings merged into one mesh per colour: two draws a trunk, not sixteen; the wider beach has eleven palms)
  for (const k of [0, 1]) {
    const m = new THREE.Mesh(merge(THREE, rings[k]), bark[k]);
    m.castShadow = true;
    scene.add(m);
  }
  const top = curve.getPoint(1);
  const crown = new THREE.Group();
  crown.position.copy(top);
  scene.add(crown);
  // coconuts
  const nut = new THREE.MeshStandardMaterial({ color: 0x8a6142, roughness: 0.6 });
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), nut);
    const a = (i / 3) * Math.PI * 2 + pl.turn;
    m.position.set(Math.cos(a) * 0.22, -0.25, Math.sin(a) * 0.22);
    m.castShadow = true;
    crown.add(m);
  }
  // fronds: a spine that arches out and droops, with leaflets down both sides
  const FRONDS = 9, fronds = [];
  const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75 });
  for (let f = 0; f < FRONDS; f++) {
    const ang = (f / FRONDS) * Math.PI * 2 + pl.turn + (f % 2) * 0.2, L = 3.4 + (f % 3) * 0.4;
    const pos = [], col = [];
    const dark = new THREE.Color(0x3f9a55), light = new THREE.Color(0x9ad86e), cc = new THREE.Color();
    const spine = (s) => new THREE.Vector3(s * L, Math.sin(s * Math.PI * 0.55) * 0.9 - s * s * 2.1, 0);
    const N = 18;
    for (let i = 0; i < N; i++) {
      const s0 = i / N, s1 = (i + 1) / N, a = spine(s0), b = spine(s1);
      const ll = 0.85 * Math.sin(Math.PI * Math.min(1, s0 * 1.15)) + 0.12;
      for (const side of [-1, 1]) {
        const tip = a.clone().add(new THREE.Vector3(0.25 * ll, -0.35 * ll, side * ll));
        for (const [v, k] of [[a, 0], [b, 0], [tip, 1]]) {
          pos.push(v.x, v.y, v.z);
          cc.copy(dark).lerp(light, k * 0.7 + s0 * 0.3);
          col.push(cc.r, cc.g, cc.b);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    const frond = new THREE.Mesh(g, leafMat);
    frond.castShadow = true;
    const pivot = new THREE.Group();
    pivot.rotation.y = ang;
    pivot.add(frond);
    crown.add(pivot);
    fronds.push({ frond, ph: f * 1.7 + pl.x });
  }
  return {
    sway(t) {
      for (const fr of fronds) {
        fr.frond.rotation.z = Math.sin(t * 1.3 + fr.ph) * 0.06 + Math.sin(t * 0.47 + fr.ph) * 0.04;
        fr.frond.rotation.x = Math.sin(t * 1.1 + fr.ph * 0.7) * 0.05;
      }
      crown.rotation.z = Math.sin(t * 0.6 + pl.x) * 0.02;
    },
  };
}

// indexed geometries with the same attributes (position, normal, uv) as one (three's mergeGeometries lives in its addons,
// which would import three into this file, and the server and the game's bundle import this file)
function merge(THREE, geos) {
  const out = new THREE.BufferGeometry(), idx = [];
  let base = 0;
  for (const name of ['position', 'normal', 'uv']) {
    const n = geos[0].attributes[name].itemSize, arr = [];
    for (const g of geos) arr.push(...g.attributes[name].array);
    out.setAttribute(name, new THREE.Float32BufferAttribute(arr, n));
  }
  for (const g of geos) {
    for (const i of g.index.array) idx.push(i + base);
    base += g.attributes.position.count;
  }
  out.setIndex(idx);
  return out;
}
