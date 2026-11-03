// Docs: docs/ui/keybinds.md
// Every rebindable keyboard action and its default keys (KeyboardEvent.code values). Shared so the server
// can check what a client asks to save. Esc is never in here: it always opens the menu, so nobody can lock
// themselves out of the Controls page.
import { HOTBAR, POTBAR } from './skills.js';

// group: the column on the Controls page · keys: the defaults (KEY_SLOTS of them at most; Jump keeps three)
export const KEY_ACTIONS = [
  { id: 'left', group: 'Move', name: 'Walk left', keys: ['ArrowLeft', 'KeyA'] },
  { id: 'right', group: 'Move', name: 'Walk right', keys: ['ArrowRight', 'KeyD'] },
  { id: 'jump', group: 'Move', name: 'Jump', keys: ['ArrowUp', 'KeyW', 'Space'] },
  { id: 'down', group: 'Move', name: 'Drop down', keys: ['ArrowDown', 'KeyS'] },
  { id: 'use', group: 'Move', name: 'Use / talk / doors', keys: ['KeyE'] },
  { id: 'dash', group: 'Move', name: 'Dash', keys: ['ShiftLeft', 'ShiftRight'] },
  { id: 'blink', group: 'Move', name: 'Blink', keys: ['KeyV'] },
  { id: 'attack', group: 'Fight', name: 'Attack', keys: ['KeyX'] },
  { id: 'pickup', group: 'Fight', name: 'Pick up', keys: ['KeyZ'] },
  ...Array.from({ length: HOTBAR }, (_, i) => ({ id: `skill${i + 1}`, group: 'Fight', name: `Skill slot ${i + 1}`, keys: [`Digit${i + 1}`] })),
  ...Array.from({ length: POTBAR }, (_, i) => ({ id: `pot${i + 1}`, group: 'Fight', name: `Potion slot ${i + 1}`, keys: [`Digit${HOTBAR + i + 1}`] })),
  { id: 'bag', group: 'Other', name: 'Bag', keys: ['KeyI'] },
  { id: 'skills', group: 'Other', name: 'Skill tree', keys: ['KeyK'] },
  { id: 'players', group: 'Other', name: 'Players', keys: ['KeyP'] },
  { id: 'chat', group: 'Other', name: 'Chat', keys: ['Enter', 'Slash'] },
  { id: 'decorate', group: 'Other', name: 'Decorate your house', keys: ['KeyR'] },
  { id: 'mic', group: 'Other', name: 'Mic', keys: ['KeyM'] },
  { id: 'broadcast', group: 'Other', name: 'Broadcast', keys: ['KeyB'] },
  { id: 'fullscreen', group: 'Other', name: 'Fullscreen', keys: ['KeyF'] },
  { id: 'courses', group: 'Other', name: 'Course menu', keys: ['KeyC'] },
  { id: 'hand', group: 'Other', name: 'Raise your hand', keys: ['KeyH'] },
  { id: 'clio', group: 'Other', name: 'Ask Clio', keys: ['KeyQ'] },
];
export const KEY_ACTION = Object.fromEntries(KEY_ACTIONS.map((a) => [a.id, a]));
export const KEY_SLOTS = 2; // keys per action (owner: a main key and a backup)
export const slotsOf = (a) => Math.max(KEY_SLOTS, a.keys.length);
export const FIXED_KEYS = new Set(['Escape']); // never bindable

// A saved binding set: { actionId: [code | null, …] }, only the actions that differ from the defaults.
// Anything malformed is dropped (an unknown action, a code that doesn't look like one, a fixed key).
export function cleanKeys(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const a of KEY_ACTIONS) {
    const v = raw[a.id];
    if (!Array.isArray(v)) continue;
    out[a.id] = Array.from({ length: slotsOf(a) }, (_, i) => (typeof v[i] === 'string' && /^[A-Za-z0-9]{1,24}$/.test(v[i]) && !FIXED_KEYS.has(v[i]) ? v[i] : null));
  }
  return out;
}
