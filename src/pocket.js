// Docs: docs/places/pocket.md
// The pocket world: step through the Hall of Mirrors' upside-down mirror in the
// Gathering Fair and you're on a beach in 3D, as your own slime, seen from behind (third person). Step 4 (owner,
// 2026-11-20: the block world wasn't fun; "real 3d… a palm tree and a beach with waves", third person, replace the
// blocks): walk the sand, wade in, swim out on the swells, jump, splash. The beach and its maths are
// src/pocket-beach.js, the slime src/pocket-slime.js.
// Three.js draws it on its own full-window canvas (docs/performance.md), loaded only the first time someone steps in.
// While it's open the game's own canvas stops drawing (main.js skips render()) and your slime stands still at the mirror.
import { keys, KeyEditor } from './keys.js';
import { text } from './village.js';
import { buildBeach, groundH, waterH, shore, edgeOf, keepIn, PALMS, ROCKS, FOG, SUN_DIR, MIRROR_AT, FOLK_SOLID } from './pocket-beach.js';
import { MIRROR_W } from './pocket-mirror.js';

const SPEED = 6.5, WADE = 4.2, SWIM = 3.4, GRAVITY = 24, JUMP_V = 8.4, SWIM_JUMP_V = 5.5;
const SWIM_DEPTH = 0.75; // water deeper than this over the sand and you float instead of standing
const FLOAT = 0.28; // how far under the surface a floating slime's feet sit
const CAM_DIST = 6.5, CAM_MIN = 2.5, CAM_MAX = 13, LOOK = 0.0024, TOUCH_LOOK = 0.006;
const SPLASHES = 90;
const SEND_EVERY = 0.1; // s between telling the server where you are (server/pocket.js PK_HZ sends everyone back)
const LOST_S = 2; // s without news of someone on the beach before their slime goes
const ESC_GAP = 300; // ms: an Esc this soon after the menu opened is the same press (key)
const MIRROR_USE = 2.2; // within this of the mirror's front, E (pk_use) takes you home
// the cove's edges (src/pocket-beach.js edgeOf): within EDGE_SOFT of the ridge or the rocks you slow to a stop and get
// a little push back; past the buoys' CURRENT_SOFT the current carries you back, up to CURRENT m/s at the line
const EDGE_SOFT = 3, EDGE_PUSH = 1.2, CURRENT_SOFT = 9, CURRENT = 2.6, EDGE_SAY = 1.2;
// the beach's sound (Beach in src/audio.js): a gull calls every GULL_GAP s or so; a breaker comes down where the
// shader's foam crests break, BREAK_U out from the waterline
const GULL_GAP = [3, 10], BREAK_U = 2.5;
const EDGE_WORDS = { sea: "The current's too strong past the buoys", ridge: 'Too steep to climb', rocks: 'The rocks are too sheer to climb' };

let THREE = null; // the module, once loaded
let shared = null; // { renderer, scene, camera, beach, sun, splash, slime, hue }: built once, kept for the next visit
const show = (el, on, how = 'grid') => (el.style.display = on ? how : 'none'); // (display: grid beats `hidden`)

export class Pocket {
  // paint2d: draws a frame of the 2D game and says where your slime is in it (src/main.js), for the mirror's window.
  // send: a message to the server · who(id): a slime's { name, hue } · clock(): the server's tick (so the sea is shared)
  constructor({ touch, audio, onOpenChange, paint2d, send, who, clock }) {
    this.paint2d = paint2d;
    this.send = send;
    this.who = who;
    this.clock = clock;
    this.away = new Set(); // who's on the beach (their 2D slimes get a mark at the fair)
    this.remotes = new Map(); // id → { model, tag, target: [x, y, z, face, flags], pos, face, at, grounded, y0 }
    this.sentAt = -1;
    this.touch = touch;
    this.audio = audio;
    this.onOpenChange = onOpenChange;
    this.open = false;
    this.keys = new Set();
    this.pos = { x: 0, y: 0, z: 0 };
    this.vy = 0;
    this.face = 0; // which way your slime faces (radians about y; 0 = +z, toward the sea)
    this.camYaw = Math.PI; // the camera's angle round you (π: behind you, looking out to sea)
    this.camPitch = 0.32;
    this.camDist = CAM_DIST;
    this.grounded = true;
    this.swimming = false;
    this.wasWet = false;
    this.t = 0;
    this.drops = [];
    this.stick = null;
    this.lookTouch = null;
    this.ui = null;
    this.menuAt = -1e9; // when the Esc menu last opened
  }

  get isOpen() {
    return this.open;
  }

  // hue: your slime's colour (the 2D one's, src/slime.js)
  async show(hue = 148) {
    if (this.open) return;
    this.open = true;
    this.onOpenChange?.();
    this.buildUi();
    show(this.ui.loading, true);
    try {
      THREE ??= await import('three');
      const [{ makeSlime }, { makeMirror }, { buildFolk }, { buildCove }] = (this.mods = await Promise.all([import('./pocket-slime.js'), import('./pocket-mirror.js'), import('./pocket-folk.js'), import('./pocket-cove.js')]));
      shared ??= this.buildScene(makeMirror, buildFolk, makeSlime, buildCove);
      if (shared.hue !== hue) {
        // your slime, in your colour (made again if you come back a different colour)
        if (shared.slime) shared.scene.remove(shared.slime.group);
        shared.slime = makeSlime(THREE, hue);
        shared.hue = hue;
        shared.scene.add(shared.slime.group);
      }
    } catch (e) {
      console.warn('pocket world:', e);
      this.ui.loading.textContent = "This browser can't draw the pocket world (no WebGL).";
      return;
    }
    if (!this.open) return;
    show(this.ui.loading, false);
    const cv = shared.renderer.domElement;
    cv.style.cssText = 'position: absolute; inset: 0; display: block;'; // (not the game canvas's styles)
    this.ui.root.prepend(cv);
    this.respawn();
    this.send?.({ t: 'pk', a: 'in' }); // (on the beach: the others see you, and you them)
    this.resize();
    this.last = performance.now();
    this.frame = requestAnimationFrame((t) => this.tick(t));
    if (!this.touch) show(this.ui.look, true, 'block'); // click to look around (pointer lock needs a click)
  }

  close() {
    if (!this.open) return;
    this.open = false;
    cancelAnimationFrame(this.frame);
    if (document.pointerLockElement) document.exitPointerLock();
    this.keys.clear();
    this.stick = this.lookTouch = null;
    window.removeEventListener('resize', this.onResize);
    if (this.onLock) document.removeEventListener('pointerlockchange', this.onLock);
    this.send?.({ t: 'pk', a: 'out' });
    this.audio?.setBeach?.(null);
    for (const id of [...this.remotes.keys()]) this.dropRemote(id);
    this.ui?.editor.destroy();
    this.ui?.root.remove();
    this.ui = null;
    this.onOpenChange?.();
  }

  // just stepped out of the mirror, facing the sea, the camera out in front looking back at you and the mirror
  respawn() {
    Object.assign(this.pos, { x: MIRROR_AT.x, z: MIRROR_AT.z + 1.8 });
    this.pos.y = groundH(this.pos.x, this.pos.z);
    this.vy = 0;
    this.face = 0;
    this.camYaw = 0.35;
    this.camPitch = 0.28;
  }
  // close enough to the mirror's front to step through it (E, pk_use: owner, not by walking into it)
  nearMirror() {
    return this.pos.z > MIRROR_AT.z && Math.hypot(this.pos.x - MIRROR_AT.x, this.pos.z - MIRROR_AT.z) < MIRROR_USE;
  }
  goHome() {
    if (!this.nearMirror()) return;
    this.audio?.sfx('door');
    this.close(); // (through the mirror: back at the fair)
  }

  // ——— the scene ———
  buildScene(makeMirror, buildFolk, makeSlime, buildCove) {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(FOG, 60, 260);
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    scene.add(new THREE.HemisphereLight(0xfff0f6, 0xe9c9a0, 1.5));
    // the low sun: warm light and soft shadows, its shadow box following you
    const sun = new THREE.DirectionalLight(0xffe2bf, 2.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 120 });
    sun.shadow.bias = -0.0008;
    sun.shadow.radius = 3;
    scene.add(sun, sun.target);
    const beach = buildBeach(THREE, scene);
    const mirror = makeMirror(THREE, { x: MIRROR_AT.x, y: groundH(MIRROR_AT.x, MIRROR_AT.z), z: MIRROR_AT.z });
    scene.add(mirror.group);
    // splashes: little white drops, one instanced mesh
    const splash = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), SPLASHES);
    splash.frustumCulled = false;
    scene.add(splash);
    this.drops = Array.from({ length: SPLASHES }, () => ({ life: 0, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0 }));
    // the slimes on vacation and the sailboats (src/pocket-folk.js), moved on the sea's clock so everyone sees the same
    const folk = buildFolk(THREE, scene, makeSlime, { splash: (x, y, z, n, power) => this.splashAt(x, y, z, n, power) });
    const cove = buildCove(THREE, scene); // the jungle, the buoys and the far islands round the bay (src/pocket-cove.js)
    return { renderer, scene, camera, beach, mirror, sun, splash, folk, cove, slime: null, hue: null };
  }

  // a ring of drops thrown up at (x, y, z), n of them, this hard
  splashAt(x, y, z, n, power) {
    let k = 0;
    for (const d of this.drops) {
      if (d.life > 0) continue;
      const a = Math.random() * Math.PI * 2, s = (0.5 + Math.random()) * power;
      Object.assign(d, { life: 0.6 + Math.random() * 0.5, x, y, z, vx: Math.cos(a) * s, vy: (1.5 + Math.random() * 2) * power, vz: Math.sin(a) * s });
      if (++k >= n) break;
    }
    if (n > 5) this.audio?.sfx('plink');
  }

  // ——— the loop ———
  tick(now) {
    if (!this.open) return;
    this.frame = requestAnimationFrame((t) => this.tick(t));
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    // the sea's clock: the server's, so everyone floats on the same waves (an hour round, then it starts again)
    const ct = this.clock?.();
    this.t = ct == null ? this.t + dt : (ct / 60) % 3600;
    const step = this.move(dt);
    if (this.t - this.sentAt >= SEND_EVERY || this.t < this.sentAt) {
      this.sentAt = this.t;
      const flags = (this.grounded ? 1 : 0) | (this.swimming ? 2 : 0) | (step.moving ? 4 : 0);
      this.send?.({ t: 'pk', a: 'at', p: [this.pos.x, this.pos.y, this.pos.z, this.face, flags].map((v, i) => (i < 4 ? Math.round(v * 100) / 100 : v)) });
    }
    this.moveRemotes(dt);
    const { renderer, scene, camera, beach, mirror, sun, slime, splash } = shared;
    mirror.update(this.t, this.paint2d); // (the window back into the 2D fair: src/main.js draws a frame of it for us)
    const near = this.nearMirror() && !this.menuOpen();
    if (this.ui) {
      show(this.ui.home, near, 'block');
      const edge = !near && !this.menuOpen() && this.edge && this.edge.e > -EDGE_SAY ? EDGE_WORDS[this.edge.kind] : '';
      if (this.ui.edge.textContent !== edge) this.ui.edge.textContent = edge;
      show(this.ui.edge, !!edge, 'block');
      if (this.ui.useBtn) show(this.ui.useBtn, near, 'block');
    }
    // your slime
    slime.group.position.set(this.pos.x, this.pos.y, this.pos.z);
    slime.group.rotation.y = this.face;
    slime.animate(dt, step);
    // the camera, round you at camYaw / camPitch, kept above the sand and the water
    const tx = this.pos.x, ty = this.pos.y + 1, tz = this.pos.z, cp = Math.cos(this.camPitch);
    const cx = tx + Math.sin(this.camYaw) * cp * this.camDist, cz = tz + Math.cos(this.camYaw) * cp * this.camDist;
    const cy = Math.max(ty + Math.sin(this.camPitch) * this.camDist, groundH(cx, cz) + 0.4, waterH(cx, cz, this.t) + 0.35);
    camera.position.set(cx, cy, cz);
    camera.lookAt(tx, ty, tz);
    // the sun's shadow box follows you
    sun.position.set(tx + SUN_DIR[0] * 50, ty + SUN_DIR[1] * 50 + 20, tz + SUN_DIR[2] * 50);
    sun.target.position.set(tx, ty, tz);
    beach.update(this.t, camera.position);
    shared.folk.update(this.t, dt);
    shared.cove.update(this.t);
    this.sound(dt);
    // the drops
    const m = new THREE.Matrix4();
    this.drops.forEach((d, i) => {
      if (d.life > 0) {
        d.life -= dt;
        d.vy -= GRAVITY * 0.6 * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.z += d.vz * dt;
        if (d.vy < 0 && d.y < waterH(d.x, d.z, this.t) - 0.1) d.life = 0;
      }
      m.makeTranslation(d.x, d.life > 0 ? d.y : -99, d.z);
      splash.setMatrixAt(i, m);
    });
    splash.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }

  // the beach's sound, from the sea you see: the swash (waterH's) running up and draining back, louder the nearer the
  // waterline you are and panned toward it; a breaker as each foam crest comes down; gulls calling from where they fly
  sound(dt) {
    const a = this.audio;
    if (!a?.setBeach) return;
    const t = this.t, x = this.pos.x, z = this.pos.z, u = z - shore(x);
    const yaw = this.camYaw, rx = Math.cos(yaw), rz = -Math.sin(yaw); // (the camera's right, on the ground)
    const near = 1 / (1 + Math.max(0, Math.abs(u) - 2) / 8);
    const ds = (0.153 * Math.cos(0.9 * t) + 0.126 * Math.cos(2.1 * t + 1)) / 0.28; // (the swash's rate, as in waterH)
    const toSea = Math.sign(-u || 1) * Math.min(1, Math.abs(u) / 4), pan = rz * toSea; // (the waterline is along x: it's ahead or behind in z)
    a.setBeach({ near, run: Math.max(0, ds), drain: Math.max(0, -ds), pan, swim: this.swimming });
    // the breakers (the shader's crests: sin(u * 0.55 + t * 1.3) peaking near BREAK_U)
    const wave = Math.floor((BREAK_U * 0.55 + t * 1.3 - Math.PI / 2) / (Math.PI * 2));
    if (this.lastWave != null && wave !== this.lastWave) a.beachEvent('crash', near * (0.6 + Math.random() * 0.4), pan + (Math.random() - 0.5) * 0.3);
    this.lastWave = wave;
    // the gulls
    this.gullIn = (this.gullIn ?? 2) - dt;
    const gulls = shared?.folk.gulls;
    if (this.gullIn <= 0 && gulls?.length) {
      this.gullIn = GULL_GAP[0] + Math.random() * (GULL_GAP[1] - GULL_GAP[0]);
      const g = gulls[Math.floor(Math.random() * gulls.length)], gx = g.x - x, gz = g.z - z, d = Math.hypot(gx, g.y - this.pos.y, gz);
      a.beachEvent('gull', Math.min(1, 18 / (d + 6)), (gx * rx + gz * rz) / (Math.hypot(gx, gz) || 1));
    }
  }

  // one frame of moving about: → what your slime's jelly needs to know (pocket-slime.js animate)
  move(dt) {
    const k = this.keys;
    let f = (k.has('pk_fwd') ? 1 : 0) - (k.has('pk_back') ? 1 : 0), s = (k.has('pk_right') ? 1 : 0) - (k.has('pk_left') ? 1 : 0);
    if (this.stick) {
      // a phone's left thumb: how far it's pushed from where it went down, up to 60 px for full speed
      const dx = this.stick.x - this.stick.x0, dy = this.stick.y - this.stick.y0, d = Math.hypot(dx, dy);
      if (d > 6) [s, f] = [dx / Math.max(d, 60), -dy / Math.max(d, 60)];
    }
    const len = Math.min(1, Math.hypot(f, s));
    if (Math.hypot(f, s) > 1) [f, s] = [f / Math.hypot(f, s), s / Math.hypot(f, s)];
    // walk relative to the camera: forward is away from it
    const fx = -Math.sin(this.camYaw), fz = -Math.cos(this.camYaw);
    const mx = fx * f - fz * s, mz = fz * f + fx * s;
    const depth = waterH(this.pos.x, this.pos.z, this.t) - groundH(this.pos.x, this.pos.z);
    this.swimming = depth > SWIM_DEPTH;
    const speed = this.swimming ? SWIM : depth > 0.15 ? WADE : SPEED;
    let dx = mx * speed * dt, dz = mz * speed * dt;
    // the cove's edges: nearing the ridge or the rocks you slow to a stop (only going outward) and are eased back; past
    // the buoys' current it carries you in. No invisible wall to bump into
    const E = (this.edge = edgeOf(this.pos.x, this.pos.z)), soft = E.kind === 'sea' ? CURRENT_SOFT : EDGE_SOFT;
    if (E.e > -soft) {
      const k = Math.max(0, Math.min(1, -E.e / soft)), out = dx * E.nx + dz * E.nz;
      if (out > 0) [dx, dz] = [dx - E.nx * out * (1 - k), dz - E.nz * out * (1 - k)];
      const push = (E.kind === 'sea' ? CURRENT : EDGE_PUSH) * (1 - k) * dt;
      [dx, dz] = [dx - E.nx * push, dz - E.nz * push];
    }
    let nx = this.pos.x + dx, nz = this.pos.z + dz;
    // the palms' trunks and the rocks are in the way
    for (const o of OBSTACLES) {
      const ox = nx - o.x, oz = nz - o.z, d = Math.hypot(ox, oz);
      if (d < o.r) [nx, nz] = [o.x + (ox / (d || 1)) * o.r, o.z + (oz / (d || 1)) * o.r];
    }
    [nx, nz] = keepIn(nx, nz); // (and never past the edge)
    this.pos.x = nx;
    this.pos.z = nz;
    if (len > 0.05) {
      // turn to face where you're going, smoothly
      let d = Math.atan2(mx, mz) - this.face;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.face += d * Math.min(1, dt * 12);
    }
    // up and down: floating on the swell in deep water, else falling onto the sand
    const g = groundH(this.pos.x, this.pos.z), w = waterH(this.pos.x, this.pos.z, this.t), floatY = w - FLOAT;
    let landed = 0;
    const wasGrounded = this.grounded;
    if (w - g > SWIM_DEPTH && this.pos.y <= floatY + 0.05 && this.vy <= 0) {
      // floating: ride the surface
      if (!this.wasWet || this.vy < -4) this.splashAt(this.pos.x, w, this.pos.z, 26, 1.1);
      this.pos.y += (floatY - this.pos.y) * Math.min(1, dt * 10);
      this.vy = 0;
      this.grounded = true;
      this.wasWet = true;
    } else {
      this.vy -= GRAVITY * dt;
      this.pos.y += this.vy * dt;
      this.grounded = false;
      if (this.pos.y <= g) {
        if (!wasGrounded) landed = -this.vy;
        if (!wasGrounded && w > g + 0.05 && this.vy < -3) this.splashAt(this.pos.x, w, this.pos.z, 14, 0.8); // into the shallows
        this.pos.y = g;
        this.vy = 0;
        this.grounded = true;
      }
      if (this.pos.y > floatY + 0.3) this.wasWet = false;
    }
    // wading in the shallows kicks up a little spray now and then
    if (len > 0.3 && w - g > 0.08 && w - g < SWIM_DEPTH && Math.random() < dt * 6) this.splashAt(this.pos.x, w, this.pos.z, 3, 0.5);
    return { moving: len > 0.05 ? len : 0, grounded: this.grounded, vy: this.vy, swimming: this.swimming, landed };
  }

  // ——— the others on the beach (server/pocket.js) ———
  receive(m, myId) {
    if (m.a === 'who') this.away = new Set(m.ids);
    else if (m.a === 'in') this.away.add(m.id);
    else if (m.a === 'out') {
      this.away.delete(m.id);
      this.dropRemote(m.id);
    } else if (m.a === 'all' && this.open) {
      const now = performance.now();
      for (const [id, ...v] of m.s) {
        if (id === myId) continue;
        const r = this.remotes.get(id) ?? this.addRemote(id, v);
        if (!r) continue;
        r.target = v;
        r.at = now;
      }
    }
  }
  // someone else's slime, in their colour, with their name over it
  addRemote(id, v) {
    if (!shared || !this.mods) return null;
    const info = this.who?.(id) ?? { name: '?', hue: 148 };
    const model = this.mods[0].makeSlime(THREE, info.hue ?? 148);
    const tag = nameTag(info.name ?? '?');
    tag.position.y = 1.45;
    model.group.add(tag);
    shared.scene.add(model.group);
    const r = { model, target: v, pos: { x: v[0], y: v[1], z: v[2] }, face: v[3], at: performance.now(), grounded: true, vy: 0 };
    this.remotes.set(id, r);
    return r;
  }
  dropRemote(id) {
    const r = this.remotes.get(id);
    if (!r) return;
    shared?.scene.remove(r.model.group);
    r.model.group.traverse((o) => {
      o.geometry?.dispose();
      if (o.material?.map) o.material.map.dispose();
    });
    this.remotes.delete(id);
  }
  // each frame: ease everyone toward where they last said they were, and wobble their jelly the same way yours does
  moveRemotes(dt) {
    const now = performance.now(), k = Math.min(1, dt * 12);
    for (const [id, r] of this.remotes) {
      if (now - r.at > LOST_S * 1000) {
        this.dropRemote(id);
        continue;
      }
      const [x, y, z, face, fl] = r.target, y0 = r.pos.y;
      r.pos.x += (x - r.pos.x) * k;
      r.pos.y += (y - r.pos.y) * k;
      r.pos.z += (z - r.pos.z) * k;
      let d = face - r.face;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      r.face += d * k;
      const vy = (r.pos.y - y0) / Math.max(dt, 1e-3), grounded = !!(fl & 1);
      const landed = grounded && !r.grounded ? Math.max(0, -r.vy) : 0;
      r.grounded = grounded;
      r.vy = vy;
      r.model.group.position.set(r.pos.x, r.pos.y, r.pos.z);
      r.model.group.rotation.y = r.face;
      r.model.animate(dt, { moving: fl & 4 ? 1 : 0, grounded, vy, swimming: !!(fl & 2), landed });
    }
  }

  // at the fair (2D): a small "on the beach" sign over the waiting slime of everyone who's through the mirror
  drawAway(ctx, slimeOf) {
    for (const id of this.away) {
      const s = slimeOf(id);
      if (!s) continue;
      const w = 92, x = s.x - w / 2, y = s.y - s.h - 96; // (above the E prompt at the mirror)
      ctx.fillStyle = 'rgba(255,244,230,0.92)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, 20, 10);
      ctx.fill();
      text(ctx, 'on the beach', s.x, y + 10, 10, '#5b4a6b');
    }
  }

  jump() {
    if (!this.grounded) return;
    this.vy = this.swimming ? SWIM_JUMP_V : JUMP_V;
    this.grounded = false;
    if (this.swimming) this.splashAt(this.pos.x, this.pos.y + FLOAT, this.pos.z, 18, 1);
  }

  resize() {
    if (!shared || !this.open) return;
    const w = window.innerWidth, h = window.innerHeight;
    shared.renderer.setSize(w, h);
    shared.camera.aspect = w / h;
    shared.camera.updateProjectionMatrix();
  }

  // the camera swung round by (dx, dy) pixels of mouse or thumb
  turn(dx, dy, rate) {
    this.camYaw -= dx * rate;
    this.camPitch = Math.max(-0.1, Math.min(1.25, this.camPitch + dy * rate));
  }

  // ——— input (main.js hands every key here while it's open). Keys are read on the pocket world's own tab of the
  // Controls page (KEY_ACTIONS with tab 'pocket'), so they rebind apart from the game's ———
  key(e, down) {
    if (this.ui?.editor.listening) return; // (choosing a key on the controls card: it takes the press itself)
    if (down && e.code === 'Escape') {
      // The first Esc with the mouse captured: the browser lets the mouse go (pointerlockchange opens the menu), and the
      // same press may still arrive here, just after: ignore it, or it would close the menu it just opened (the flicker).
      // A later Esc closes the menu, back in the world with the "Click to look around" pill: a browser won't capture the
      // mouse again from a key straight after an Esc, so a click does that.
      if (e.repeat || performance.now() - this.menuAt < ESC_GAP) return;
      if (this.menuOpen()) this.resume(false);
      else this.openMenu();
      return;
    }
    const id = keys.of(e, 'pocket');
    if (!id || (down && this.menuOpen())) return;
    if (down) this.keys.add(id);
    else this.keys.delete(id);
    if (down && !e.repeat && id === 'pk_jump') this.jump();
    if (down && !e.repeat && id === 'pk_use') this.goHome();
  }

  // ——— the Esc menu: small and light over the world (owner: the old dark card was jarring) ———
  menuOpen() {
    return !!this.ui && this.ui.menu.style.display !== 'none';
  }
  openMenu() {
    if (!this.ui) return;
    if (document.pointerLockElement) document.exitPointerLock();
    this.keys.clear();
    if (!this.menuOpen()) this.menuAt = performance.now();
    show(this.ui.menu, true, 'flex');
    show(this.ui.look, false);
    this.showControls(false);
  }
  // back to the world. capture: try to take the mouse again (the Back to the world button: a click may); from Esc, no
  resume(capture = true) {
    if (!this.ui) return;
    show(this.ui.menu, false);
    this.showControls(false);
    if (this.touch) return;
    if (capture) shared?.renderer.domElement.requestPointerLock?.()?.catch?.(() => {});
    show(this.ui.look, !document.pointerLockElement, 'block');
  }
  showControls(on) {
    show(this.ui.ctl, on, 'block');
    show(this.ui.menuBtns, !on, 'flex');
    if (on) this.ui.editor.render();
    else {
      this.ui.editor?.stop();
      this.labelHint(); // (in case a key changed)
    }
  }

  buildUi() {
    const el = (tag, css, text) => {
      const d = document.createElement(tag);
      d.style.cssText = css;
      if (text) d.textContent = text;
      return d;
    };
    const font = "font-family: Fredoka, 'Trebuchet MS', sans-serif; font-weight: 700;";
    const root = el('div', `position: fixed; inset: 0; z-index: 1000; background: #ffe0b3; overflow: hidden; touch-action: none; user-select: none; ${font}`);
    const loading = el('div', 'position: absolute; inset: 0; display: grid; place-items: center; color: #5b4a6b; font-size: 22px;', 'Stepping through the mirror...');
    const hint = el('div', 'position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); padding: 6px 14px; border-radius: 14px; background: rgba(255,255,255,0.7); color: #5b4a6b; font-size: 13px; white-space: nowrap;',
      this.touch ? 'left thumb: walk · right thumb: look round' : '');
    const leave = el('button', `position: absolute; top: 14px; right: 14px; padding: 10px 18px; border: 0; border-radius: 18px; background: #fff4e6; color: #5b4a6b; font-size: 16px; ${font}`, 'Leave');
    leave.onclick = () => this.close();
    // desktop: a small pill until you click into the world (the mouse has to be captured to look around)
    const look = el('div', 'position: absolute; left: 50%; top: 18px; transform: translateX(-50%); padding: 8px 16px; border-radius: 16px; background: rgba(255,255,255,0.8); color: #5b4a6b; font-size: 14px; pointer-events: none;', 'Click to look around');
    show(look, false);
    // near the mirror: how to go home
    const home = el('div', 'position: absolute; left: 50%; top: 58px; transform: translateX(-50%); padding: 8px 16px; border-radius: 16px; background: rgba(255,244,230,0.9); color: #5b4a6b; font-size: 14px; pointer-events: none; white-space: nowrap;', '');
    show(home, false);
    // the Esc menu: a small card, the world still in view behind it
    const menu = el('div', 'position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); flex-direction: column; gap: 8px; padding: 16px; border-radius: 22px; background: rgba(255,244,230,0.95); color: #5b4a6b; box-shadow: 0 8px 30px rgba(60,40,90,0.25); min-width: 240px;');
    const mbtn = (text, fn) => {
      const b = el('button', `padding: 10px 18px; border: 0; border-radius: 16px; background: #ffffff; color: #5b4a6b; font-size: 16px; cursor: pointer; ${font}`, text);
      b.onclick = (e) => {
        e.stopPropagation();
        fn();
      };
      return b;
    };
    const menuBtns = el('div', 'display: flex; flex-direction: column; gap: 8px;');
    menuBtns.append(el('div', 'text-align: center; font-size: 18px; padding: 2px 0 4px;', 'The pocket world'), mbtn('Back to the world', () => this.resume()), mbtn('Controls', () => this.showControls(true))); // (the way home is the mirror on the sand, or Leave up top)
    // its controls: the pocket world's own tab of the key editor (the same bindings as the Esc menu's Controls page)
    const ctl = el('div', 'width: min(420px, 88vw); max-height: 76vh; overflow: auto;');
    const grid = el('div', 'display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; align-items: flex-start;'), note = el('div', 'margin: 8px 0; font-size: 13px; text-align: center;');
    const ctlRow = el('div', 'display: flex; gap: 8px; justify-content: center;');
    const reset = mbtn('Reset keys', () => {
      if (!reset.dataset.sure) {
        reset.dataset.sure = '1';
        reset.textContent = 'Click again to reset';
        return;
      }
      reset.dataset.sure = '';
      reset.textContent = 'Reset keys';
      keys.reset('pocket');
      editor.say('Every pocket world key is back to its default');
      this.labelHint();
    });
    ctlRow.append(reset, mbtn('Back', () => this.showControls(false)));
    ctl.append(grid, note, ctlRow);
    menu.append(menuBtns, ctl);
    menu.className = 'pocket-menu';
    show(menu, false);
    // near the cove's edge: why you can't go on (the current, the ridge, the rocks)
    const edge = el('div', 'position: absolute; left: 50%; top: 58px; transform: translateX(-50%); padding: 8px 16px; border-radius: 16px; background: rgba(255,255,255,0.75); color: #5b4a6b; font-size: 14px; pointer-events: none; white-space: nowrap;', '');
    show(edge, false);
    root.append(loading, hint, look, home, edge, menu, leave);
    const editor = new KeyEditor(grid, note, { tabs: ['pocket'] });
    this.ui = { root, loading, look, home, edge, menu, menuBtns, ctl, editor, hint };
    this.labelHint();
    show(ctl, false);
    if (this.touch) {
      const jump = el('button', `position: absolute; right: 26px; bottom: 60px; width: 84px; height: 84px; border: 0; border-radius: 50%; background: rgba(255,255,255,0.7); color: #5b4a6b; font-size: 18px; ${font}`, 'Jump');
      jump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.jump();
      });
      root.append(jump);
      // E, by the mirror (shown only there)
      const useBtn = el('button', `position: absolute; right: 124px; bottom: 120px; width: 66px; height: 66px; border: 0; border-radius: 50%; background: rgba(255,244,230,0.9); color: #5b4a6b; font-size: 20px; ${font}`, 'E');
      useBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.goHome();
      });
      show(useBtn, false);
      root.append(useBtn);
      this.ui.useBtn = useBtn;
      root.addEventListener('touchstart', (e) => this.touches(e, 'start'), { passive: false });
      root.addEventListener('touchmove', (e) => this.touches(e, 'move'), { passive: false });
      root.addEventListener('touchend', (e) => this.touches(e, 'end'));
      root.addEventListener('touchcancel', (e) => this.touches(e, 'end'));
    } else {
      const locked = () => document.pointerLockElement === shared?.renderer.domElement;
      root.addEventListener('mousemove', (e) => {
        if (locked()) this.turn(e.movementX, e.movementY, LOOK);
      });
      root.addEventListener('wheel', (e) => {
        if (e.deltaY && !this.menuOpen()) this.camDist = Math.max(CAM_MIN, Math.min(CAM_MAX, this.camDist * (e.deltaY > 0 ? 1.12 : 1 / 1.12)));
      }, { passive: true });
      // clicking into the world (not on the menu or a button) captures the mouse
      root.addEventListener('click', (e) => {
        if (locked() || this.menuOpen() || e.target.closest('button')) return;
        shared?.renderer.domElement.requestPointerLock?.()?.catch?.(() => {});
      });
      // the mouse let go (Esc: the browser takes that key itself): open the menu
      this.onLock = () => {
        if (!this.ui) return;
        if (document.pointerLockElement) {
          show(this.ui.look, false);
          show(this.ui.menu, false);
        } else if (!this.menuOpen()) this.openMenu();
      };
      document.addEventListener('pointerlockchange', this.onLock);
    }
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    document.body.append(root);
  }

  // the bottom line on a keyboard, in this account's pocket world keys
  labelHint() {
    if (this.ui && this.touch) this.ui.home.textContent = 'E  step back through the mirror to the fair';
    if (this.touch || !this.ui) return;
    const k = (id) => keys.label(id) || '—';
    this.ui.home.textContent = `${k('pk_use')}  step back through the mirror to the fair`;
    this.ui.hint.textContent = `${k('pk_fwd')}${k('pk_left')}${k('pk_back')}${k('pk_right')} walk · mouse look round · wheel zoom · ${k('pk_jump')} jump · Esc menu`;
  }

  // phones: the first thumb down on the left half walks (a stick from where it touched), on the right half swings the camera
  touches(e, type) {
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (type === 'start') {
        if (t.clientX < window.innerWidth / 2 && !this.stick) this.stick = { id: t.identifier, x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY };
        else if (!this.lookTouch) this.lookTouch = { id: t.identifier, x: t.clientX, y: t.clientY };
      } else if (type === 'move') {
        if (this.stick?.id === t.identifier) Object.assign(this.stick, { x: t.clientX, y: t.clientY });
        else if (this.lookTouch?.id === t.identifier) {
          this.turn(t.clientX - this.lookTouch.x, t.clientY - this.lookTouch.y, TOUCH_LOOK);
          Object.assign(this.lookTouch, { x: t.clientX, y: t.clientY });
        }
      } else {
        if (this.stick?.id === t.identifier) this.stick = null;
        if (this.lookTouch?.id === t.identifier) this.lookTouch = null;
      }
    }
  }
}

// what you can't walk through: the palms' trunks, the rocks, the camps' umbrellas, cool boxes and sandcastle
const OBSTACLES = [...PALMS.map((p) => ({ x: p.x, z: p.z, r: 0.55 })), ...ROCKS.map((r) => ({ x: r.x, z: r.z, r: r.s * 0.95 })), ...FOLK_SOLID,
  ...[-0.55, 0, 0.55].map((dx) => ({ x: MIRROR_AT.x + dx * MIRROR_W / 1.5, z: MIRROR_AT.z, r: 0.42 }))]; // (the mirror: solid, E takes you through)

// a name over a slime on the beach: a little pill, always facing you
function nameTag(name) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d');
  g.font = "700 30px Fredoka, 'Trebuchet MS', sans-serif";
  const w = Math.min(248, g.measureText(name).width + 36);
  g.fillStyle = 'rgba(91,74,107,0.8)';
  g.beginPath();
  g.roundRect(128 - w / 2, 8, w, 46, 23);
  g.fill();
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(name, 128, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, fog: false }));
  sprite.scale.set(1.6, 0.4, 1);
  return sprite;
}
