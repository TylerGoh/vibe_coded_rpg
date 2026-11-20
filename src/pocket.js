// Docs: docs/places/pocket.md
// The pocket world (an experiment, dev sandbox only for now): step through the Hall of Mirrors' upside-down mirror in the
// Gathering Fair and you're on a beach in 3D, as your own slime, seen from behind (third person). Step 4 (owner,
// 2026-11-20: the block world wasn't fun; "real 3d… a palm tree and a beach with waves", third person, replace the
// blocks): walk the sand, wade in, swim out on the swells, jump, splash. The beach and its maths are
// src/pocket-beach.js, the slime src/pocket-slime.js.
// Three.js draws it on its own full-window canvas (docs/performance.md), loaded only the first time someone steps in.
// While it's open the game's own canvas stops drawing (main.js skips render()) and your slime stands still at the mirror.
import { keys, KeyEditor } from './keys.js';
import { buildBeach, groundH, waterH, WORLD_R, PALMS, ROCKS, FOG, SUN_DIR } from './pocket-beach.js';

const SPEED = 6.5, WADE = 4.2, SWIM = 3.4, GRAVITY = 24, JUMP_V = 8.4, SWIM_JUMP_V = 5.5;
const SWIM_DEPTH = 0.75; // water deeper than this over the sand and you float instead of standing
const FLOAT = 0.28; // how far under the surface a floating slime's feet sit
const CAM_DIST = 6.5, CAM_MIN = 2.5, CAM_MAX = 13, LOOK = 0.0024, TOUCH_LOOK = 0.006;
const SPLASHES = 90;
const ESC_GAP = 300; // ms: an Esc this soon after the menu opened is the same press (key)

let THREE = null; // the module, once loaded
let shared = null; // { renderer, scene, camera, beach, sun, splash, slime, hue }: built once, kept for the next visit
const show = (el, on, how = 'grid') => (el.style.display = on ? how : 'none'); // (display: grid beats `hidden`)

export class Pocket {
  constructor({ touch, audio, onOpenChange }) {
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
      const { makeSlime } = await import('./pocket-slime.js');
      shared ??= this.buildScene();
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
    this.ui?.editor.destroy();
    this.ui?.root.remove();
    this.ui = null;
    this.onOpenChange?.();
  }

  // on the sand between the palms, facing the sea
  respawn() {
    Object.assign(this.pos, { x: 0, z: -4 });
    this.pos.y = groundH(this.pos.x, this.pos.z);
    this.vy = 0;
    this.face = 0;
    this.camYaw = Math.PI;
    this.camPitch = 0.32;
  }

  // ——— the scene ———
  buildScene() {
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
    // splashes: little white drops, one instanced mesh
    const splash = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), SPLASHES);
    splash.frustumCulled = false;
    scene.add(splash);
    this.drops = Array.from({ length: SPLASHES }, () => ({ life: 0, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0 }));
    return { renderer, scene, camera, beach, sun, splash, slime: null, hue: null };
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
    this.t += dt;
    const step = this.move(dt);
    const { renderer, scene, camera, beach, sun, slime, splash } = shared;
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
    let nx = this.pos.x + mx * speed * dt, nz = this.pos.z + mz * speed * dt;
    // the palms' trunks and the rocks are in the way; the world ends in a ring
    for (const o of OBSTACLES) {
      const dx = nx - o.x, dz = nz - o.z, d = Math.hypot(dx, dz);
      if (d < o.r) [nx, nz] = [o.x + (dx / (d || 1)) * o.r, o.z + (dz / (d || 1)) * o.r];
    }
    const r = Math.hypot(nx, nz);
    if (r > WORLD_R) [nx, nz] = [(nx / r) * WORLD_R, (nz / r) * WORLD_R];
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
    menuBtns.append(el('div', 'text-align: center; font-size: 18px; padding: 2px 0 4px;', 'The pocket world'), mbtn('Back to the world', () => this.resume()), mbtn('Controls', () => this.showControls(true)), mbtn('Leave the pocket world', () => this.close()));
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
    root.append(loading, hint, look, menu, leave);
    const editor = new KeyEditor(grid, note, { tabs: ['pocket'] });
    this.ui = { root, loading, look, menu, menuBtns, ctl, editor, hint };
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
    if (this.touch || !this.ui) return;
    const k = (id) => keys.label(id) || '—';
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

// what you can't walk through: the palms' trunks, the rocks
const OBSTACLES = [...PALMS.map((p) => ({ x: p.x, z: p.z, r: 0.55 })), ...ROCKS.map((r) => ({ x: r.x, z: r.z, r: r.s * 0.95 }))];
