// Docs: docs/ui/mobile.md
// On-screen controls for phones and tablets. Each button just plays the part of a key — it sends the
// same keydown/keyup the keyboard would — so every action works the same way on touch as on a keyboard.
// Tapping the game itself slaps (main.js), like clicking.
export const TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

const BUTTONS = [
  // [id, label, key, hold] — hold: pressed for as long as the finger is down (movement)
  ['t-left', '◀', 'ArrowLeft', true],
  ['t-right', '▶', 'ArrowRight', true],
  ['t-jump', 'Jump', 'Space', true],
  ['t-down', '▼', 'ArrowDown', true],
  ['t-use', 'E', 'KeyE', false],
  ['t-menu', 'Menu', 'Escape', false],
  ['t-full', 'Full', 'KeyF', false],
  ['t-courses', 'Courses', 'KeyC', false],
  ['t-hand', 'Hand', 'KeyH', false],
  ['t-ask', 'Ask Clio', 'KeyQ', false],
  ['t-attack', 'Hit', 'KeyX', false], // the Wildwood: attack the way you're facing
  ['t-loot', 'Loot', 'KeyZ', false],
  ['t-bag', 'Bag', 'KeyI', false],
  ['t-skills', 'Skills', 'KeyK', false],
  ['t-dash', 'Dash', 'ShiftLeft', false], // the Mobility skills, once learned
  ['t-blink', 'Blink', 'KeyV', false],
];

// ——— fullscreen ———
// Works on Android and iPad (and desktops); iPhones only allow it for video, so there the answer is
// "Add to Home Screen", which launches the game without browser bars (see the manifest in public/).
const inFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
// launched from the home screen (the fullscreen display-mode also matches while the page itself is fullscreen)
const standalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || (matchMedia('(display-mode: fullscreen)').matches && !inFullscreen());
export const isIPhone = () => /iPhone|iPod/.test(navigator.userAgent) && !standalone();
export const fullscreenSupported = () => !standalone() && !isIPhone() && !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
export function toggleFullscreen() {
  if (inFullscreen()) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    return;
  }
  if (!fullscreenSupported()) return;
  const el = document.documentElement;
  const req = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen();
  // once fullscreen, phones can also be held to landscape (not every browser allows it; that's fine)
  Promise.resolve(req).then(() => screen.orientation?.lock?.('landscape')).catch(() => {});
}

const key = (type, code) => dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));

export function setupTouch() {
  if (!TOUCH) return { update() {} };
  document.body.classList.add('touch');
  const box = document.getElementById('touch');
  const els = {};
  for (const [id, label, code, hold] of BUTTONS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = id;
    b.textContent = label;
    if (code === 'KeyF') {
      // browsers only allow fullscreen from a completed tap (finger lifted), not from touching down
      b.addEventListener('click', () => toggleFullscreen());
      box.append(b);
      els[id] = b;
      continue;
    }
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try {
        b.setPointerCapture?.(e.pointerId);
      } catch {} // (synthetic events have no real pointer)
      b.classList.add('down');
      key('keydown', code);
      if (!hold) setTimeout(() => key('keyup', code), 120); // held briefly, so the game's 60 Hz steps see it
    });
    const up = () => {
      if (!b.classList.contains('down')) return;
      b.classList.remove('down');
      if (hold) key('keyup', code);
    };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    box.append(b);
    els[id] = b;
  }
  if (!fullscreenSupported()) els['t-full'].remove();
  return {
    // show the controls while playing; the room-specific buttons only where they do something
    update({ playing, courses, hand, ask, field, overlay, dash, blink }) {
      els['t-dash'].hidden = !dash || overlay;
      els['t-blink'].hidden = !blink || overlay;
      box.hidden = !playing;
      els['t-ask'].hidden = !ask || overlay;
      els['t-courses'].hidden = !courses;
      els['t-hand'].hidden = !hand;
      els['t-attack'].hidden = els['t-loot'].hidden = !field || overlay;
      // while a panel or text box is up, the movement pad would only get in the way
      for (const id of ['t-left', 't-right', 't-jump', 't-down', 't-use']) els[id].hidden = overlay;
    },
  };
}
