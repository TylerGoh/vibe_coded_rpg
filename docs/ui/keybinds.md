# Key bindings (the Controls page)

Owner's ask (2026-11-03): rebind the keyboard. Every action can be moved to another key or left with no key:
the 6 skill slots and 3 potion slots (`HOTBAR`, `POTBAR`), Mobility (Dash, Blink), use/talk (E), fullscreen,
movement, attack, panels, chat, mic, broadcast and the lecture-hall keys. Owner's choices: **everything**
rebindable, **saved per account**, opened **only from the Esc menu** (no hotkey for it), **two keys per action**
(a main one and a backup; Jump keeps three so Arrow Up, W and Space all still work by default).

- **Where**: the Esc menu's **Controls** page (it used to be a read-only list). On a keyboard it shows the editor:
  three columns (Move, Fight, Other), one row per action, a small button per key. Click one, press a key:
  Backspace clears it, Esc cancels. Under it, the moves made of two keys (Charge, Leap Slam, Hook, Upward
  Cut) written with your keys. **Reset keys** puts everything back (it asks for a second click).
- **A boss's snare combo** uses the four movement actions (left, right, jump, down: `KEY_DIR` in `src/challenge.js`), so it
  follows the rebinding; it's listed under the editor with the two-key moves. Not a new action.
- **Esc is fixed** (`FIXED_KEYS`): it always opens the menu, so nobody can lock themselves out of this page. Also
  not rebindable on purpose: number keys picking a stone on the waystone card, Delete / F while decorating
  (`Houses.key`), O for the sandbox panel (dev only). They sit inside their own cards, so they don't clash.
- **A key does one thing**: binding a key that another action had takes it off that action (the note says
  which). The defaults never overlap. Contextual uses follow the bindings: the bag's own key closes the bag,
  the use key closes the shop and the other E-panels, the walk keys browse the museum and turn the telescope.
- **Data**: `KEY_ACTIONS` in `src/shared/keys.js` (id, column, name, default codes, as `KeyboardEvent.code`).
  The character keeps only the actions that differ from the defaults, as `c.keys` (`{action: [code|null, …]}`),
  checked by `cleanKeys` on load and on every save. Protocol: → `{t:'keys', keys}` (the whole override set),
  answered by the usual `me`, which carries `keys`. Adding an action later: add it to `KEY_ACTIONS` and use
  `keys.is(e, id)` in the handler; saved sets without it just get its default.
- **Client**: `src/keys.js`. `keys.of(e)` / `keys.is(e, id)` read a key press (main.js's keydown handler asks it
  everything; no `e.code === 'KeyX'` checks are left for rebindable keys), `keys.label(id)` names an action's
  key for the HUD (hotbar slot labels via `Rpg.relabel`, hint key caps via `keys.token` in `src/hints.js`, the
  skill card, the mic / broadcast / fullscreen buttons, the first-time help pill). `KeyEditor` is the page; it
  catches the key press in the capture phase so the game never sees it.
- **Touch**: the touch buttons (`src/touch.js`) send made-up key events with the default codes; `keys.of`
  reads those (`isTrusted === false`) against the defaults, so a phone works the same whatever the account
  rebound on a PC. A touch device's Controls page shows the touch list, with a **Keyboard keys** button to
  switch to the editor (a tablet with a keyboard).
- Past mistake avoided: a `me` already on its way when you change a key would carry the old set and undo it, so
  `keys.load` ignores the server for a few seconds after a local change (the `me` that answers the save
  confirms it).
- Layout checked in headless Chromium at 960×540 and on a phone (844×390). On touch the key buttons are kept small and
  the combo list is hidden (`body.touch #kb-combos`) so the editor fits above its buttons.
