// Docs: docs/places/pocket.md
// The mirror on the beach (owner, 2026-11-20: "add the mirror in the beach as the exit"): the other side of the Hall of
// Mirrors' upside-down mirror. A gold arched frame like the fair's, standing on the sand; its glass is a real reflection
// (Three's Reflector: the scene drawn again from the mirrored camera) turned upside down about the mirror's middle, like
// the one you came through. You step out of it when you arrive, and walk back into it to go home (src/pocket.js).
// makeMirror(THREE, Reflector, at) → { group, update(t) }. `at`: { x, y (the sand), z }; it faces +z, the sea.

export const MIRROR_W = 1.5, MIRROR_H = 2.5; // the glass

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

export function makeMirror(THREE, Reflector, at) {
  const group = new THREE.Group();
  group.position.set(at.x, at.y + 0.12, at.z);
  const gold = new THREE.MeshStandardMaterial({ color: 0xf2c14e, metalness: 0.55, roughness: 0.3 });

  // the glass: the reflection, flipped top to bottom about the mirror's middle
  const shader = {
    name: 'UpsideDownMirror',
    uniforms: { color: { value: new THREE.Color(0xe8ecff) }, tDiffuse: { value: null }, textureMatrix: { value: null }, mid: { value: MIRROR_H / 2 } },
    vertexShader: `uniform mat4 textureMatrix; uniform float mid; varying vec4 vUv; varying vec4 vMid; varying vec2 vLocal;
      void main() {
        vUv = textureMatrix * vec4(position, 1.0);
        vMid = textureMatrix * vec4(0.0, mid, 0.0, 1.0);
        vLocal = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform float mid; varying vec4 vUv; varying vec4 vMid; varying vec2 vLocal;
      void main() {
        vec2 uv = vUv.xy / vUv.w, m = vMid.xy / vMid.w;
        uv.y = 2.0 * m.y - uv.y;
        vec3 c = texture2D(tDiffuse, clamp(uv, 0.002, 0.998)).rgb * color;
        // a soft sheen down the glass
        float sheen = smoothstep(0.08, 0.0, abs(vLocal.x * 0.8 + vLocal.y * 0.35 - 0.5)) * 0.25;
        gl_FragColor = vec4(c + sheen, 1.0);
        #include <colorspace_fragment>
      }`,
  };
  const glass = new Reflector(new THREE.ShapeGeometry(arch(THREE, MIRROR_W, MIRROR_H), 24), { shader, textureWidth: 512, textureHeight: 768, clipBias: 0.003 });
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

  return {
    group,
    update(t) {
      for (const sp of sparks) {
        const a = sp.a + t * sp.s;
        sp.m.position.set(Math.cos(a) * (MIRROR_W / 2 + 0.35), MIRROR_H / 2 + Math.sin(a * 1.3) * (MIRROR_H / 2 + 0.2), 0.12 + Math.sin(a * 2) * 0.1);
        sp.m.rotation.y = t * 2 + sp.a;
        sp.m.scale.setScalar(0.6 + 0.4 * Math.sin(t * 3 + sp.a * 3));
      }
    },
  };
}
