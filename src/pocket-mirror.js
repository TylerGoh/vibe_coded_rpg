// Docs: docs/places/pocket.md
// The mirror on the beach (owner, 2026-11-20: "add the mirror in the beach as the exit"): the other side of the Hall of
// Mirrors' upside-down mirror. A gold arched frame like the fair's, standing on the sand. Its glass is a window back into
// the 2D game (owner, 2026-11-20: "in the mirror display a 2d world on the other side"): the fair as the game draws it,
// round where your 2D slime waits at the Hall of Mirrors, copied in a few times a second (`paint`, from src/main.js). You
// step out of it when you arrive, and E in front of it takes you home (src/pocket.js).
// makeMirror(THREE, at) → { group, update(t, paint) }. `at`: { x, y (the sand), z }; it faces +z, the sea.

export const MIRROR_W = 1.5, MIRROR_H = 2.5; // the glass
const VIEW_H = 512, VIEW_W = Math.round((VIEW_H * MIRROR_W) / MIRROR_H); // the window's picture, in pixels
const PAINT_EVERY = 1 / 12; // s between copies of the 2D view
const CROP_H = 380, CROP_BOTTOM = 474; // the slice of the 2D game it shows, in its 960×540 units: from your slime's feet up

// an arched outline: straight sides, a round top
function arch(THREE, w, h) {
  const s = new THREE.Shape(), r = w / 2;
  s.moveTo(-r, 0);
  s.lineTo(-r, h - r);
  s.absarc(0, h - r, r, Math.PI, 0, true);
  s.lineTo(r, 0);
  s.lineTo(-r, 0);
  return s;
}

export function makeMirror(THREE, at) {
  const group = new THREE.Group();
  group.position.set(at.x, at.y + 0.12, at.z);
  const gold = new THREE.MeshStandardMaterial({ color: 0xf2c14e, metalness: 0.55, roughness: 0.3 });

  // the glass: a window onto the 2D fair. An offscreen canvas holds the view (VIEW_W × VIEW_H, the glass's shape) and is the
  // glass's texture; until the first copy lands it's the fair's dusk colours
  const view = document.createElement('canvas');
  view.width = VIEW_W;
  view.height = VIEW_H;
  const vctx = view.getContext('2d');
  const sky = vctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#3f3a78');
  sky.addColorStop(0.7, '#ff9fa0');
  sky.addColorStop(1, '#e9c99a');
  vctx.fillStyle = sky;
  vctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const tex = new THREE.CanvasTexture(view);
  tex.colorSpace = THREE.SRGBColorSpace;
  const glassGeo = new THREE.ShapeGeometry(arch(THREE, MIRROR_W, MIRROR_H), 24);
  // (a shape's own uvs are its coordinates: map them onto 0..1 across the glass)
  const uv = glassGeo.attributes.uv, gp = glassGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, gp.getX(i) / MIRROR_W + 0.5, gp.getY(i) / MIRROR_H);
  const glass = new THREE.Mesh(glassGeo, new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, t: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D map; uniform float t; varying vec2 vUv;
      void main() {
        // the 2D world, a little rippled, as if through old glass
        vec2 uv = vUv + vec2(sin(vUv.y * 40.0 + t * 2.0), cos(vUv.x * 30.0 + t * 1.7)) * 0.0015;
        vec3 c = texture2D(map, uv).rgb;
        // a soft sheen sweeping across, and the edges a touch darker
        float sheen = smoothstep(0.06, 0.0, abs(vUv.x - vUv.y * 0.35 - fract(t * 0.12) * 1.6 + 0.3)) * 0.22;
        float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) * smoothstep(0.0, 0.05, vUv.y);
        gl_FragColor = vec4(c * (0.82 + 0.18 * edge) + sheen, 1.0);
        #include <colorspace_fragment>
      }`,
  }));
  glass.position.z = 0.002;
  group.add(glass);

  // the frame: the arch's outline, raised, with a ball on top and two little feet in the sand
  const outer = arch(THREE, MIRROR_W + 0.26, MIRROR_H + 0.13);
  outer.holes.push(arch(THREE, MIRROR_W, MIRROR_H));
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 24 }), gold);
  frame.position.set(0, -0.065, -0.07);
  frame.castShadow = true;
  group.add(frame);
  // its back, so it isn't see-through from behind
  const back = new THREE.Mesh(new THREE.ShapeGeometry(arch(THREE, MIRROR_W + 0.1, MIRROR_H + 0.05), 24), new THREE.MeshStandardMaterial({ color: 0xb98a3e, roughness: 0.6, side: THREE.BackSide }));
  back.position.z = -0.04;
  group.add(back);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), gold);
  ball.position.set(0, MIRROR_H + 0.2, 0);
  group.add(ball);
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.5), gold);
    foot.position.set(side * (MIRROR_W / 2 + 0.05), -0.08, 0);
    foot.castShadow = true;
    group.add(foot);
  }
  // sparkles drifting round the frame, so you can find it from down the beach
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.9, fog: false });
  const sparks = Array.from({ length: 10 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), sparkMat);
    group.add(m);
    return { m, a: (i / 10) * Math.PI * 2, s: 0.4 + (i % 3) * 0.15 };
  });

  let paintedAt = -1;
  return {
    group,
    // paint: → { canvas (the game's), scale (its pixels a game unit), x (your 2D slime's x on screen, game units) }, after
    // drawing a fresh frame of the 2D game into it
    update(t, paint) {
      glass.material.uniforms.t.value = t;
      if (paint && (t - paintedAt >= PAINT_EVERY || t < paintedAt)) {
        paintedAt = t;
        const p = paint();
        if (p) {
          const ch = CROP_H, cw = (ch * VIEW_W) / VIEW_H, sx = Math.max(0, Math.min(960 - cw, p.x - cw / 2));
          vctx.drawImage(p.canvas, sx * p.scale, (CROP_BOTTOM - ch) * p.scale, cw * p.scale, ch * p.scale, 0, 0, VIEW_W, VIEW_H);
          tex.needsUpdate = true;
        }
      }
      for (const sp of sparks) {
        const a = sp.a + t * sp.s;
        sp.m.position.set(Math.cos(a) * (MIRROR_W / 2 + 0.35), MIRROR_H / 2 + Math.sin(a * 1.3) * (MIRROR_H / 2 + 0.2), 0.12 + Math.sin(a * 2) * 0.1);
        sp.m.rotation.y = t * 2 + sp.a;
        sp.m.scale.setScalar(0.6 + 0.4 * Math.sin(t * 3 + sp.a * 3));
      }
    },
  };
}
