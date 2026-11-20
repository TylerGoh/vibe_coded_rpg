// Docs: docs/places/pocket.md
// The pocket world (an experiment, dev sandbox only for now): step through the Hall of Mirrors' upside-down mirror in the
// Gathering Fair and you're in a small blocky 3D world, first person. Step 1 (owner, 2026-11-20): a flat field in a pastel
// sky; walk, look, jump. Step 2: break and place blocks from a hotbar (the grid, collisions and aiming are
// src/pocket-world.js). Nobody else in it, and what you build lasts until the page reloads.
// Three.js draws it on its own full-window canvas (docs/performance.md), loaded only the first time someone steps in.
// While it's open the game's own canvas stops drawing (main.js skips render()) and your slime stands still at the mirror.
import { World, SIZE, HEIGHT, CHUNK, GROUND, BLOCKS, HOTBAR, collide, aim, boxInCell, meshChunk } from './pocket-world.js';

const EYE = 1.6, SPEED = 6.5, GRAVITY = 26, JUMP_V = 8.6, REACH = 6, LOOK = 0.0024, TOUCH_LOOK = 0.006;
const SKY = 0xbfe3ff, FOG = 0xe9d8f2;
const ACT_GAP = 0.18; // s between breaks / places while a button is held
const TAP_MS = 250, TAP_PX = 12; // a phone's look thumb that lifts this fast without moving is a tap: break or build

let THREE = null; // the module, once loaded
let shared = null; // { renderer, scene, camera, chunks, outline }: built once, kept for the next visit
const world = new World(); // (kept for the session: come back and your building is still there)
const show = (el, on, how = 'grid') => (el.style.display = on ? how : 'none'); // (display: grid beats `hidden`)
const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;

export class Pocket {
  constructor({ touch, audio, onOpenChange }) {
    this.touch = touch;
    this.audio = audio;
    this.onOpenChange = onOpenChange;
    this.open = false;
    this.keys = new Set();
    this.pos = { x: 0, y: 0, z: 0 };
    this.vy = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.grounded = true;
    this.slot = 0; // the hotbar slot in hand
    this.build = false; // phones: a tap builds (true) or breaks
    this.held = { break: false, place: false, at: 0 }; // desktop: mouse buttons held
    this.target = null; // what the crosshair is on (pocket-world.js aim)
    this.stick = null;
    this.lookTouch = null;
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
      shared ??= this.buildScene();
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
    this.held.break = this.held.place = false;
    this.stick = this.lookTouch = null;
    window.removeEventListener('resize', this.onResize);
    if (this.onLock) document.removeEventListener('pointerlockchange', this.onLock);
    this.ui?.root.remove();
    this.ui = null;
    this.onOpenChange?.();
  }

  // back to the middle, standing on whatever's built there
  respawn() {
    Object.assign(this.pos, { x: 0.5, y: world.topAt(0.5, 6.5), z: 6.5 });
    this.vy = 0;
    this.yaw = 0;
    this.pitch = -0.05;
  }

  // ——— the scene: one mesh per chunk of blocks (rebuilt when a block in it changes), the aim outline, the sky ———
  buildScene() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(FOG, 30, 120);
    const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.05, 400);
    const material = new THREE.MeshBasicMaterial({ vertexColors: true }); // (the shading is baked into the colours)
    const chunks = new Map();
    for (let cx = 0; cx < SIZE / CHUNK; cx++) {
      for (let cz = 0; cz < SIZE / CHUNK; cz++) {
        const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
        scene.add(mesh);
        chunks.set(`${cx},${cz}`, mesh);
      }
    }
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)), new THREE.LineBasicMaterial({ color: 0x5b4a6b }));
    outline.visible = false;
    scene.add(outline);
    shared = { renderer, scene, camera, chunks, outline };
    for (const key of chunks.keys()) this.remesh(...key.split(',').map(Number));
    return shared;
  }
  remesh(cx, cz) {
    const mesh = shared.chunks.get(`${cx},${cz}`);
    if (!mesh) return;
    const m = meshChunk(world, cx, cz), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(m.colors, 3));
    g.setIndex(new THREE.BufferAttribute(m.indices, 1));
    g.computeBoundingSphere();
    mesh.geometry.dispose();
    mesh.geometry = g;
  }
  // a block changed at grid cell (x, z): its chunk, and the one next door if it's on the edge
  changed(x, z) {
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    this.remesh(cx, cz);
    if (x % CHUNK === 0) this.remesh(cx - 1, cz);
    if (x % CHUNK === CHUNK - 1) this.remesh(cx + 1, cz);
    if (z % CHUNK === 0) this.remesh(cx, cz - 1);
    if (z % CHUNK === CHUNK - 1) this.remesh(cx, cz + 1);
  }

  // ——— breaking and placing ———
  breakBlock() {
    const t = this.target;
    if (!t || BLOCKS[world.get(t.x, t.y, t.z)]?.fixed) return;
    world.set(t.x, t.y, t.z, 0);
    this.changed(t.x, t.z);
    this.audio?.sfx('pop');
  }
  placeBlock() {
    const t = this.target;
    if (!t) return;
    const x = t.x + t.nx, y = t.y + t.ny, z = t.z + t.nz;
    if (y >= HEIGHT || world.get(x, y, z) || boxInCell(this.pos, x, y, z)) return; // (not inside yourself)
    if (!world.set(x, y, z, HOTBAR[this.slot])) return;
    this.changed(x, z);
    this.audio?.sfx('bonk');
  }
  pick(i) {
    this.slot = (i + HOTBAR.length) % HOTBAR.length;
    this.drawHotbar();
  }

  // ——— the loop ———
  tick(now) {
    if (!this.open) return;
    this.frame = requestAnimationFrame((t) => this.tick(t));
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.move(dt);
    const { renderer, scene, camera, outline } = shared;
    camera.position.set(this.pos.x, this.pos.y + EYE, this.pos.z);
    camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    // what the crosshair is on
    const cp = Math.cos(this.pitch), dir = [-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp];
    this.target = aim(world, this.pos.x, this.pos.y + EYE, this.pos.z, ...dir, REACH);
    outline.visible = !!this.target;
    if (this.target) outline.position.set(this.target.x - SIZE / 2 + 0.5, this.target.y - GROUND + 0.5, this.target.z - SIZE / 2 + 0.5);
    // mouse buttons held: keep breaking / placing at a steady pace
    if ((this.held.break || this.held.place) && now - this.held.at > ACT_GAP * 1000) {
      this.held.at = now;
      if (this.held.break) this.breakBlock();
      else this.placeBlock();
    }
    renderer.render(scene, camera);
  }

  move(dt) {
    const k = this.keys, playing = this.touch || (typeof document !== 'undefined' && document.pointerLockElement);
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
    this.vy = Math.max(-40, this.vy - GRAVITY * dt);
    const hit = collide(world, this.pos, (-sin * f + cos * s) * SPEED * dt, this.vy * dt, (-cos * f - sin * s) * SPEED * dt);
    if (hit.grounded || hit.bumped) this.vy = 0;
    this.grounded = hit.grounded;
    if (this.pos.y < -40) this.respawn(); // fell off the edge: back to the middle
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
    if (!down || e.repeat) return;
    if (e.code === 'Space') this.jump();
    const n = /^Digit([1-9])$/.exec(e.code);
    if (n && +n[1] <= HOTBAR.length) this.pick(+n[1] - 1);
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
    const cross = el('div', 'position: absolute; left: 50%; top: 50%; width: 18px; height: 18px; margin: -9px 0 0 -9px; pointer-events: none;');
    cross.innerHTML = '<div style="position:absolute;left:8px;top:0;width:2px;height:18px;background:#fff;box-shadow:0 0 2px #5b4a6b"></div><div style="position:absolute;top:8px;left:0;height:2px;width:18px;background:#fff;box-shadow:0 0 2px #5b4a6b"></div>';
    const hint = el('div', 'position: absolute; left: 50%; bottom: 86px; transform: translateX(-50%); padding: 6px 14px; border-radius: 14px; background: rgba(255,255,255,0.7); color: #5b4a6b; font-size: 13px; white-space: nowrap;',
      this.touch ? 'left thumb: walk · right thumb: look · tap: ' : 'WASD walk · mouse look · Space jump · left click break · right click place · 1-8 or wheel: block · Esc leave');
    const hotbar = el('div', 'position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); display: flex; gap: 6px; padding: 6px; border-radius: 16px; background: rgba(255,255,255,0.6);');
    const leave = el('button', `position: absolute; top: 14px; right: 14px; padding: 10px 18px; border: 0; border-radius: 18px; background: #fff4e6; color: #5b4a6b; font-size: 16px; ${font}`, 'Leave');
    leave.onclick = () => this.close();
    const paused = el('div', 'position: absolute; inset: 0; display: grid; place-items: center; background: rgba(40,30,60,0.35); cursor: pointer;');
    const card = el('div', 'padding: 22px 30px; border-radius: 22px; background: #fff4e6; color: #5b4a6b; text-align: center;');
    card.append(el('div', 'font-size: 26px; margin-bottom: 6px;', 'The pocket world'), el('div', 'font-size: 15px;', 'Click to walk about. Esc to leave.'));
    paused.append(card);
    show(paused, false);
    paused.onclick = () => shared?.renderer.domElement.requestPointerLock?.();
    root.append(loading, cross, hint, hotbar, paused, leave);
    this.ui = { root, loading, paused, hint, hotbar };
    this.drawHotbar();
    if (this.touch) {
      const btn = (css, text, fn) => {
        const b = el('button', `position: absolute; border: 0; border-radius: 50%; background: rgba(255,255,255,0.7); color: #5b4a6b; ${font} ${css}`, text);
        b.addEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
          fn(b);
        });
        root.append(b);
        return b;
      };
      btn('right: 26px; bottom: 96px; width: 84px; height: 84px; font-size: 18px;', 'Jump', () => this.jump());
      // tap mode: what a quick tap with the look thumb does
      const mode = btn('right: 120px; bottom: 110px; width: 70px; height: 70px; font-size: 14px;', 'Break', (b) => {
        this.build = !this.build;
        b.textContent = this.build ? 'Build' : 'Break';
        this.ui.hint.textContent = `left thumb: walk · right thumb: look · tap: ${this.build ? 'build' : 'break'}`;
      });
      this.ui.hint.textContent += 'break';
      this.ui.mode = mode;
      root.addEventListener('touchstart', (e) => this.touches(e, 'start'), { passive: false });
      root.addEventListener('touchmove', (e) => this.touches(e, 'move'), { passive: false });
      root.addEventListener('touchend', (e) => this.touches(e, 'end'));
      root.addEventListener('touchcancel', (e) => this.touches(e, 'cancel'));
    } else {
      const locked = () => document.pointerLockElement === shared?.renderer.domElement;
      root.addEventListener('mousemove', (e) => {
        if (!locked()) return;
        this.yaw -= e.movementX * LOOK;
        this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch - e.movementY * LOOK));
      });
      root.addEventListener('mousedown', (e) => {
        if (!locked()) return;
        if (e.button === 0) [this.held.break, this.held.place] = [true, false];
        else if (e.button === 2) [this.held.place, this.held.break] = [true, false];
        else return;
        this.held.at = performance.now();
        if (this.held.break) this.breakBlock();
        else this.placeBlock();
      });
      root.addEventListener('mouseup', (e) => {
        if (e.button === 0) this.held.break = false;
        if (e.button === 2) this.held.place = false;
      });
      root.addEventListener('contextmenu', (e) => e.preventDefault());
      root.addEventListener('wheel', (e) => {
        if (locked() && e.deltaY) this.pick(this.slot + Math.sign(e.deltaY));
      }, { passive: true });
      this.onLock = () => {
        if (this.ui) show(this.ui.paused, !document.pointerLockElement);
        if (!document.pointerLockElement) {
          this.keys.clear();
          this.held.break = this.held.place = false;
        }
      };
      document.addEventListener('pointerlockchange', this.onLock);
    }
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    document.body.append(root);
  }

  // the hotbar: one swatch per block you can place, the one in hand ringed (tap one on a phone to pick it)
  drawHotbar() {
    const bar = this.ui?.hotbar;
    if (!bar) return;
    bar.replaceChildren();
    HOTBAR.forEach((b, i) => {
      const d = BLOCKS[b], on = i === this.slot, s = document.createElement('button');
      s.style.cssText = `position: relative; width: 44px; height: 44px; border-radius: 10px; border: 3px solid ${on ? '#5b4a6b' : 'transparent'}; padding: 0;
        background: linear-gradient(${hex(d.top)} 0 34%, ${hex(d.side)} 34% 100%); box-shadow: inset 0 -6px 0 rgba(0,0,0,0.08);`;
      s.title = d.name;
      if (!this.touch) {
        const n = document.createElement('span');
        n.textContent = i + 1;
        n.style.cssText = "position: absolute; left: 3px; top: 1px; font: 700 11px Fredoka, sans-serif; color: rgba(60,40,80,0.7);";
        s.append(n);
      }
      s.addEventListener(this.touch ? 'touchstart' : 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.pick(i);
      });
      bar.append(s);
    });
  }

  // phones: the first thumb down on the left half walks (a stick from where it touched), on the right half looks; a quick
  // still tap with the look thumb breaks or builds at the crosshair (the mode button)
  touches(e, type) {
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (type === 'start') {
        if (t.clientX < window.innerWidth / 2 && !this.stick) this.stick = { id: t.identifier, x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY };
        else if (!this.lookTouch) this.lookTouch = { id: t.identifier, x: t.clientX, y: t.clientY, x0: t.clientX, y0: t.clientY, at: performance.now() };
      } else if (type === 'move') {
        if (this.stick?.id === t.identifier) Object.assign(this.stick, { x: t.clientX, y: t.clientY });
        else if (this.lookTouch?.id === t.identifier) {
          this.yaw -= (t.clientX - this.lookTouch.x) * TOUCH_LOOK;
          this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch - (t.clientY - this.lookTouch.y) * TOUCH_LOOK));
          Object.assign(this.lookTouch, { x: t.clientX, y: t.clientY });
        }
      } else {
        if (this.stick?.id === t.identifier) this.stick = null;
        const lt = this.lookTouch;
        if (lt?.id === t.identifier) {
          if (type === 'end' && performance.now() - lt.at < TAP_MS && Math.hypot(t.clientX - lt.x0, t.clientY - lt.y0) < TAP_PX) {
            if (this.build) this.placeBlock();
            else this.breakBlock();
          }
          this.lookTouch = null;
        }
      }
    }
  }
}
