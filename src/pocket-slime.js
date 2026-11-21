// Docs: docs/places/pocket.md
// Your slime in 3D, for the pocket world (src/pocket.js): the same jelly as the 2D one (src/slime.js paletteFor: the
// colours from your hue), a soft dome shaded from its light top to its deeper bottom, lit so it shines, eyes with glints, a little
// smile, rosy cheeks and the leaf sprout. It squashes and stretches on a spring: landing flattens it, a jump stretches
// it, walking makes it wobble, swimming bobs it. makeSlime(THREE, hue) → { group, animate(dt, state) }. Faces +z.

const PROFILE = [[0, 0], [0.42, 0], [0.55, 0.07], [0.6, 0.2], [0.59, 0.36], [0.53, 0.55], [0.42, 0.7], [0.26, 0.82], [0.12, 0.88], [0, 0.9]];

export function makeSlime(THREE, hue) {
  const top = new THREE.Color().setHSL(hue / 360, 0.8, 0.76), bottom = new THREE.Color().setHSL(hue / 360, 0.6, 0.52);
  const group = new THREE.Group(); // where you stand (turned to face your way)
  const body = new THREE.Group(); // what squashes (its origin at your feet)
  group.add(body);

  const geo = new THREE.LatheGeometry(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 32);
  const pos = geo.attributes.position, col = [], c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.copy(bottom).lerp(top, Math.min(1, pos.getY(i) / 0.75));
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const jelly = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0, emissive: top, emissiveIntensity: 0.05 }));
  jelly.castShadow = true;
  body.add(jelly);

  const flat = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
  const blob = (mat, x, y, z, sx, sy, sz) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    body.add(m);
    return m;
  };
  // no painted shine: the jelly's own lit highlight is the shine (a flat white blob looked stuck on, owner)
  // eyes, with a glint each
  const ink = flat(0x2d2a3e), white = flat(0xffffff);
  for (const side of [-1, 1]) {
    blob(ink, side * 0.15, 0.44, 0.53, 0.05, 0.075, 0.03);
    blob(white, side * 0.15 - 0.015, 0.465, 0.56, 0.016, 0.02, 0.01);
    blob(flat(0xff9fb8, 0.7), side * 0.28, 0.34, 0.5, 0.07, 0.04, 0.02).rotation.y = side * 0.5; // cheeks
  }
  // a little smile
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 14, Math.PI), ink);
  smile.position.set(0, 0.37, 0.565);
  smile.rotation.z = Math.PI;
  body.add(smile);
  // the leaf sprout
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.14, 6), flat(0x4f9d5c));
  stem.position.set(-0.03, 0.95, 0);
  stem.rotation.z = 0.2;
  body.add(stem);
  const leaf = blob(new THREE.MeshStandardMaterial({ color: 0x6cc96a, roughness: 0.6 }), 0.05, 1.02, 0, 0.11, 0.035, 0.06);
  leaf.rotation.z = -0.4;

  // the jelly spring: squash (+ flatter and wider, − taller and thinner) and its speed
  let sq = 0, sv = 0, phase = 0;
  return {
    group,
    // state: { moving (0..1), grounded, vy, swimming, landed (a hard landing just now: its speed) }
    animate(dt, s) {
      if (s.landed) sv += Math.min(6, s.landed * 0.5); // landing: a squash (flatter)
      phase += dt * (s.moving ? 9 : 3);
      const target = (s.grounded ? 0 : Math.max(-0.18, Math.min(0.12, -s.vy * 0.02))) + (s.moving ? Math.sin(phase) * 0.06 : Math.sin(phase) * 0.015) + (s.swimming ? Math.sin(phase * 0.6) * 0.04 : 0);
      sv += ((target - sq) * 120 - sv * 9) * dt;
      sq += sv * dt;
      sq = Math.max(-0.35, Math.min(0.35, sq));
      body.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
      leaf.rotation.z = -0.4 + Math.sin(phase * 0.7) * 0.15 - sq;
    },
  };
}
