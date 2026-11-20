// Docs: docs/places/pocket.md
// The pocket world (an experiment, dev sandbox only for now): step through the Hall of Mirrors' upside-down mirror in the
// Gathering Fair and you're in a small blocky 3D world, first person. Step 1 (owner, 2026-11-20: "a 3d flat world first,
// not too many features"): a flat field of grass blocks floating in a pastel sky; walk, look, jump; fall off the edge and
// you're put back in the middle. Nothing to break or build yet, nobody else in it, nothing saved.
// Three.js draws it on its own full-window canvas (docs/performance.md: "a 3D pocket dimension would get Three.js on its
// own canvas"), loaded only the first time someone steps in. While it's open the game's own canvas stops drawing
// (main.js skips render()) and your slime stands still at the mirror (inputBits sends nothing).

const SIZE = 64; // the field is SIZE × SIZE blocks
const DEPTH = 3; // dirt layers under the grass (seen at the edges)
const EYE = 1.6, SPEED = 4.6, GRAVITY = 24, JUMP_V = 8, LOOK = 0.0024, TOUCH_LOOK = 0.006;
const SKY = 0xbfe3ff, FOG = 0xe9d8f2;

let THREE = null; // the module, once loaded
let shared = null; // { renderer, scene, camera }: built once, kept for the next visit
// (the cards use display: grid, which beats the `hidden` attribute: toggle the style instead)
const show = (el, on) => (el.style.display = on ? 'grid' : 'none');

export class Pocket {
  constructor({ touch, onOpenChange }) {
    this.touch = touch;
    this.onOpenChange = onOpenChange;
    this.open = false;
    this.keys = new Set();
    this.pos = { x: 0, y: 0, z: 0 };
    this.vy = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.grounded = true;
    this.stick = null; // a phone's move thumb { id, x0, y0, x, y }
    this.lookTouch = null; // its look thumb { id, x, y }
    this.ui = null;
  }

  get isOpen() {
    return this.open;
  }

  async show() {
    if (this.open) return;
    this.open = true;
    this.onOpenChange?.();
    this.buildUi();
    show(this.ui.loading, true);
    try {
      THREE ??= await import('three');
      shared ??= this.buildWorld();
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
    this.resize();
    this.last = performance.now();
    this.frame = requestAnimationFrame((t) => this.tick(t));
    if (!this.touch) show(this.ui.paused, true); // click to play (pointer lock needs a click)
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
    this.ui?.root.remove();
    this.ui = null;
    this.onOpenChange?.();
  }

  respawn() {
    Object.assign(this.pos, { x: 0, y: 0, z: 6 });
    this.vy = 0;
    this.yaw = 0;
    this.pitch = -0.05;
  }

  // ——— the world: grass blocks (each a shade off its neighbours, the blocky look), dirt round the edges, the sky ———
  buildWorld() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(FOG, 30, 120);
    const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.05, 400);
    scene.add(new THREE.HemisphereLight(0xfff6ff, 0xb8a6d8, 1.6));
    const sun = new THREE.DirectionalLight(0xfff0d8, 1.6);
    sun.position.set(0.5, 1, 0.35);
    scene.add(sun);

    const box = new THREE.BoxGeometry(1, 1, 1);
    const half = SIZE / 2, c = new THREE.Color(), m = new THREE.Matrix4();
    const hash = (x, z, k) => {
      let h = (x * 374761393 + z * 668265263 + k * 2147483647) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    // the grass: one block per cell, its top at y = 0
    const grass = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial(), SIZE * SIZE);
    let i = 0;
    for (let x = 0; x < SIZE; x++) {
      for (let z = 0; z < SIZE; z++) {
        m.makeTranslation(x - half + 0.5, -0.5, z - half + 0.5);
        grass.setMatrixAt(i, m);
        const j = hash(x, z, 1) * 0.08 - 0.04;
        c.setRGB(0.55 + j, 0.82 + j, 0.5 + j);
        grass.setColorAt(i++, c);
      }
    }
    scene.add(grass);
    // the dirt underneath, only where it shows (the four edges)
    const edge = [];
    for (let k = 0; k < SIZE; k++) edge.push([k, 0], [k, SIZE - 1], [0, k], [SIZE - 1, k]);
    const dirt = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial(), edge.length * DEPTH);
    i = 0;
    for (const [x, z] of edge) {
      for (let y = 1; y <= DEPTH; y++) {
        m.makeTranslation(x - half + 0.5, -0.5 - y, z - half + 0.5);
        dirt.setMatrixAt(i, m);
        const j = hash(x, z, y + 2) * 0.08 - 0.04;
        c.setRGB(0.72 + j, 0.56 + j, 0.45 + j);
        dirt.setColorAt(i++, c);
      }
    }
    scene.add(dirt);
    return { renderer, scene, camera };
  }

  // ——— the loop ———
  tick(now) {
    if (!this.open) return;
    this.frame = requestAnimationFrame((t) => this.tick(t));
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.move(dt);
    const { renderer, scene, camera } = shared;
    camera.position.set(this.pos.x, this.pos.y + EYE, this.pos.z);
    camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    renderer.render(scene, camera);
  }

  move(dt) {
    const k = this.keys, playing = this.touch || document.pointerLockElement;
    let f = 0, s = 0;
    if (playing) {
      f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
      s = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    }
    if (this.stick) {
      // a phone's left thumb: how far it's pushed from where it went down, up to 60 px for full speed
      const dx = this.stick.x - this.stick.x0, dy = this.stick.y - this.stick.y0, d = Math.hypot(dx, dy);
      if (d > 6) [s, f] = [dx / Math.max(d, 60), -dy / Math.max(d, 60)];
    }
    const len = Math.hypot(f, s);
    if (len > 1) [f, s] = [f / len, s / len];
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    this.pos.x += (-sin * f + cos * s) * SPEED * dt;
    this.pos.z += (-cos * f - sin * s) * SPEED * dt;
    // standing on the field (it's flat: its top is y = 0 wherever there's a block), or falling off its edge
    const half = SIZE / 2, over = Math.abs(this.pos.x) < half + 0.3 && Math.abs(this.pos.z) < half + 0.3;
    this.vy -= GRAVITY * dt;
    this.pos.y += this.vy * dt;
    this.grounded = false;
    if (over && this.pos.y <= 0 && this.pos.y > -0.6) {
      this.pos.y = 0;
      this.vy = 0;
      this.grounded = true;
    }
    if (this.pos.y < -40) this.respawn(); // fell off: back to the middle
  }

  jump() {
    if (this.grounded) this.vy = JUMP_V;
  }

  resize() {
    if (!shared || !this.open) return;
    const w = window.innerWidth, h = window.innerHeight;
    shared.renderer.setSize(w, h);
    shared.camera.aspect = w / h;
    shared.camera.updateProjectionMatrix();
  }

  // ——— input (main.js hands every key here while it's open) ———
  key(e, down) {
    if (down && e.code === 'Escape') {
      // (with the mouse captured the browser takes the first Esc to let it go: that shows the pause card instead)
      if (!this.touch && this.ui.paused.style.display !== 'none') this.close();
      return;
    }
    if (down) this.keys.add(e.code);
    else this.keys.delete(e.code);
    if (down && e.code === 'Space' && !e.repeat) this.jump();
  }

  buildUi() {
    const el = (tag, css, text) => {
      const d = document.createElement(tag);
      d.style.cssText = css;
      if (text) d.textContent = text;
      return d;
    };
    const font = "font-family: Fredoka, 'Trebuchet MS', sans-serif; font-weight: 700;";
    const root = el('div', `position: fixed; inset: 0; z-index: 1000; background: #bfe3ff; overflow: hidden; touch-action: none; user-select: none; ${font}`);
    const loading = el('div', 'position: absolute; inset: 0; display: grid; place-items: center; color: #5b4a6b; font-size: 22px;', 'Stepping through the mirror...');
    const hint = el('div', 'position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); padding: 8px 16px; border-radius: 16px; background: rgba(255,255,255,0.75); color: #5b4a6b; font-size: 14px; white-space: nowrap;',
      this.touch ? 'left thumb: walk · right thumb: look' : 'WASD walk · mouse look · Space jump · Esc to leave');
    const leave = el('button', `position: absolute; top: 14px; right: 14px; padding: 10px 18px; border: 0; border-radius: 18px; background: #fff4e6; color: #5b4a6b; font-size: 16px; ${font}`, 'Leave');
    leave.onclick = () => this.close();
    const paused = el('div', 'position: absolute; inset: 0; display: grid; place-items: center; background: rgba(40,30,60,0.35); cursor: pointer;');
    const card = el('div', 'padding: 22px 30px; border-radius: 22px; background: #fff4e6; color: #5b4a6b; text-align: center;');
    card.append(el('div', 'font-size: 26px; margin-bottom: 6px;', 'The pocket world'), el('div', 'font-size: 15px;', 'Click to walk about. Esc to leave.'));
    paused.append(card);
    show(paused, false);
    paused.onclick = () => shared?.renderer.domElement.requestPointerLock?.();
    root.append(loading, hint, paused, leave);
    if (this.touch) {
      const jump = el('button', `position: absolute; right: 26px; bottom: 60px; width: 84px; height: 84px; border: 0; border-radius: 50%; background: rgba(255,255,255,0.7); color: #5b4a6b; font-size: 18px; ${font}`, 'Jump');
      jump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.jump();
      });
      root.append(jump);
      root.addEventListener('touchstart', (e) => this.touches(e, 'start'), { passive: false });
      root.addEventListener('touchmove', (e) => this.touches(e, 'move'), { passive: false });
      root.addEventListener('touchend', (e) => this.touches(e, 'end'));
      root.addEventListener('touchcancel', (e) => this.touches(e, 'end'));
    } else {
      this.onMouse = (e) => {
        if (document.pointerLockElement !== shared?.renderer.domElement) return;
        this.yaw -= e.movementX * LOOK;
        this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch - e.movementY * LOOK));
      };
      this.onLock = () => {
        if (this.ui) show(this.ui.paused, !document.pointerLockElement);
        if (!document.pointerLockElement) this.keys.clear();
      };
      root.addEventListener('mousemove', this.onMouse);
      document.addEventListener('pointerlockchange', this.onLock);
    }
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    document.body.append(root);
    this.ui = { root, loading, paused, hint };
  }

  // phones: the first thumb down on the left half walks (a stick from where it touched), on the right half looks
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
          this.yaw -= (t.clientX - this.lookTouch.x) * TOUCH_LOOK;
          this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch - (t.clientY - this.lookTouch.y) * TOUCH_LOOK));
          Object.assign(this.lookTouch, { x: t.clientX, y: t.clientY });
        }
      } else {
        if (this.stick?.id === t.identifier) this.stick = null;
        if (this.lookTouch?.id === t.identifier) this.lookTouch = null;
      }
    }
  }
}
