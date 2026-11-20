// Docs: docs/ui/keybinds.md
// Your keyboard bindings: which key does what (saved on your character, so they follow your account), the
// name of each key for the HUD, and the editor on the Esc menu's Controls page.
import { KEY_ACTIONS, KEY_ACTION, KEY_TABS, slotsOf, FIXED_KEYS, cleanKeys } from './shared/keys.js';

const NAMES = {
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', ShiftLeft: 'Shift', ShiftRight: 'R Shift',
  ControlLeft: 'Ctrl', ControlRight: 'R Ctrl', AltLeft: 'Alt', AltRight: 'R Alt', MetaLeft: 'Cmd', MetaRight: 'R Cmd',
  Space: 'Space', Enter: 'Enter', Slash: '/', Backslash: '\\', Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[',
  BracketRight: ']', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Tab: 'Tab', CapsLock: 'Caps', Delete: 'Del',
  Insert: 'Ins', Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn', IntlBackslash: '\\',
};
export function keyText(code) {
  if (!code) return '';
  if (NAMES[code]) return NAMES[code];
  let m;
  if ((m = /^Key([A-Z])$/.exec(code))) return m[1];
  if ((m = /^Digit(\d)$/.exec(code))) return m[1];
  if ((m = /^Numpad(.+)$/.exec(code))) return `Num ${m[1].replace('Add', '+').replace('Subtract', '-').replace('Multiply', '*').replace('Divide', '/').replace('Decimal', '.')}`;
  return code;
}
// one code for keys that are the same key twice on a keyboard
const norm = (code) => (code === 'NumpadEnter' ? 'Enter' : code);

// (per tab, KEY_TABS: each tab is its own keyboard)
const DEFAULTS = new Map(); // `${tab} ${code}` → action id, the default bindings
for (const a of KEY_ACTIONS) for (const c of a.keys) DEFAULTS.set(`${a.tab} ${c}`, a.id);

let saved = {}; // the overrides, as stored on the character
let binds = new Map(); // action id → [code | null, …]
let byCode = new Map(); // `${tab} ${code}` → action id
let changedAt = -1e9; // when you last changed a key here
function rebuild() {
  binds = new Map(KEY_ACTIONS.map((a) => [a.id, Array.from({ length: slotsOf(a) }, (_, i) => (saved[a.id] ? saved[a.id][i] : a.keys[i]) ?? null)]));
  byCode = new Map();
  for (const [id, codes] of binds) for (const c of codes) if (c && !byCode.has(`${KEY_ACTION[id].tab} ${c}`)) byCode.set(`${KEY_ACTION[id].tab} ${c}`, id);
}
rebuild();

export const keys = {
  onChange: null, // main.js: refresh every label that names a key
  send: null, // main.js: (overrides) => send them to the server
  // The action a key press means. Touch buttons send made-up key events (src/touch.js) with the default
  // codes, so those always read the defaults, whatever this account has rebound.
  // tab: which keyboard to read it on ('game', or 'pocket' in the pocket world)
  of(e, tab = 'game') {
    const c = `${tab} ${norm(e.code)}`;
    return e.isTrusted === false ? DEFAULTS.get(c) : byCode.get(c);
  },
  is(e, id) {
    return this.of(e, KEY_ACTION[id]?.tab) === id;
  },
  // what to call an action's key on screen: its first bound key, or '' if it has none
  label(id) {
    return keyText(binds.get(id)?.find(Boolean));
  },
  all(id) {
    return (binds.get(id) ?? []).filter(Boolean).map(keyText).join(' / ');
  },
  // the hints' key tokens (src/hints.js: 'E', 'X', '↓+X', '↓+Shift'…) in this account's keys
  token(t) {
    const T = { E: 'use', Z: 'pickup', X: 'attack', '↓': 'down', Shift: 'dash', Space: 'jump', I: 'bag', H: 'hand', C: 'courses', Q: 'clio' };
    return t.split('+').map((p) => (T[p] ? this.label(T[p]) || '—' : p)).join('+');
  },
  // the overrides from the server ('me'); ignored while you're choosing a key (yours win)
  load(raw) {
    // (and for a moment after you change one: a 'me' already on its way would still have the old keys)
    if (editor?.listening || performance.now() - changedAt < 3000) return;
    const next = cleanKeys(raw);
    if (JSON.stringify(next) === JSON.stringify(saved)) return;
    saved = next;
    rebuild();
    this.onChange?.();
  },
  set(id, i, code) {
    const a = KEY_ACTION[id];
    let took = null;
    if (code) {
      // a key does one thing (in its tab): take it off whatever had it
      for (const [other, codes] of binds) {
        if (KEY_ACTION[other].tab !== a.tab) continue;
        const j = codes.indexOf(code);
        if (j >= 0 && !(other === id && j === i)) {
          codes[j] = null;
          took = other;
        }
      }
    }
    binds.get(id)[i] = code;
    saved = {};
    for (const b of KEY_ACTIONS) {
      const codes = binds.get(b.id);
      if (codes.some((c, k) => c !== (b.keys[k] ?? null))) saved[b.id] = [...codes];
    }
    rebuild();
    changedAt = performance.now();
    this.send?.(saved);
    this.onChange?.();
    for (const ed of editors) ed.render();
    return took && took !== id ? KEY_ACTION[took].name : null;
  },
  // tab: only that tab's keys back to their defaults (all of them without one)
  reset(tab) {
    if (tab) for (const id of Object.keys(saved)) if (KEY_ACTION[id].tab === tab) delete saved[id];
    if (!tab) saved = {};
    rebuild();
    changedAt = performance.now();
    this.send?.(saved);
    this.onChange?.();
  },
};

// ——— the editor (desktop Controls page) ———
// (there can be two: the Esc menu's, and the pocket world's own, which shows only its tab)
const editors = new Set();
const editor = { get listening() { return [...editors].some((e) => e.listening); } };
export class KeyEditor {
  // tabs: which KEY_TABS it offers (a row of tab buttons when more than one); onTab: told when the tab changes
  constructor(box, note, { tabs = KEY_TABS.map((t) => t.id), onTab } = {}) {
    editors.add(this);
    this.box = box;
    this.note = note;
    this.listening = null; // { id, i, b } while waiting for a key
    this.cells = [];
    this.tab = tabs[0];
    this.onTab = onTab;
    this.cols = [];
    if (tabs.length > 1) {
      const bar = document.createElement('div');
      bar.className = 'kb-tabs';
      this.tabButtons = tabs.map((id) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'kb-tab';
        b.textContent = KEY_TABS.find((t) => t.id === id).name;
        b.onclick = () => this.show(id);
        bar.append(b);
        return [id, b];
      });
      box.before(bar);
    }
    const groups = [...new Set(KEY_ACTIONS.filter((a) => tabs.includes(a.tab)).map((a) => `${a.tab} ${a.group}`))];
    for (const tg of groups) {
      const [tab, g] = [tg.slice(0, tg.indexOf(' ')), tg.slice(tg.indexOf(' ') + 1)];
      const col = document.createElement('div');
      col.dataset.tab = tab;
      this.cols.push(col);
      col.className = 'kb-col';
      const h = document.createElement('div');
      h.className = 'kb-head';
      h.textContent = g;
      col.append(h);
      for (const a of KEY_ACTIONS.filter((x) => x.tab === tab && x.group === g)) {
        const row = document.createElement('div');
        row.className = 'kb-row';
        const name = document.createElement('span');
        name.className = 'kb-name';
        name.textContent = a.name;
        row.append(name);
        for (let i = 0; i < slotsOf(a); i++) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'kb-key';
          b.onclick = () => this.listen(a.id, i, b);
          row.append(b);
          this.cells.push({ id: a.id, i, b });
        }
        col.append(row);
      }
      box.append(col);
    }
    // the key press that picks a key: caught before the game's own keydown handler sees it
    addEventListener('keydown', (this.onKey = (e) => {
      if (!this.listening || !this.box.isConnected) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat) return;
      const { id, i } = this.listening;
      this.listening = null;
      if (e.code === 'Escape') this.say('');
      else if (e.code === 'Backspace') {
        keys.set(id, i, null);
        this.say(`${KEY_ACTION[id].name}: key cleared`);
      } else if (FIXED_KEYS.has(e.code)) this.say(`${keyText(e.code)} always opens the menu`);
      else {
        const code = norm(e.code);
        const took = keys.set(id, i, code);
        this.say(`${keyText(code)} is now ${KEY_ACTION[id].name}${took ? ` (taken from ${took})` : ''}`);
      }
      this.render();
    }), true);
    this.show(this.tab);
  }
  // gone for good (the pocket world's editor, when you leave it)
  destroy() {
    editors.delete(this);
    removeEventListener('keydown', this.onKey, true);
  }
  // which tab's keys are on show
  show(tab) {
    this.stop();
    this.tab = tab;
    for (const c of this.cols) c.hidden = c.dataset.tab !== tab;
    for (const [id, b] of this.tabButtons ?? []) b.classList.toggle('on', id === tab);
    this.onTab?.(tab);
  }
  listen(id, i, b) {
    this.listening = { id, i, b };
    this.render();
    this.say(`Press a key for ${KEY_ACTION[id].name} · Backspace clears it · Esc cancels`);
  }
  stop() {
    this.listening = null;
    this.render();
    this.say('');
  }
  say(t) {
    this.note.textContent = t || 'Click a key to change it';
  }
  render() {
    for (const c of this.cells) {
      const on = this.listening?.id === c.id && this.listening.i === c.i;
      const code = binds.get(c.id)[c.i];
      c.b.textContent = on ? '…' : keyText(code) || '—';
      c.b.classList.toggle('on', on);
      c.b.classList.toggle('none', !code && !on);
    }
  }
}
