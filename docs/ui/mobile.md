# Mobile: touch controls, layout, fullscreen

Files: `src/touch.js` (buttons, fullscreen), touch layout rules in `src/style.css` (`body.touch …`),
`public/` (manifest, icons; copied into `dist/` as-is).

**Every new feature must work on phones too; the owner checks.** Test with the phone emulation in
`docs/testing.md` and look at a screenshot.

- On coarse-pointer devices, on-screen buttons dispatch the same keydown/keyup events as the keyboard
  (◀ ▶ Jump ▼ E · Menu = Esc · Full · Courses = C · Hand = H · Ask Clio = Q · Hit = X · Loot = Z · Bag = I ·
  Skills = K · Dash · Blink). So **a new keyboard action works on touch by adding a button to `BUTTONS`**
  and showing it in the right room in `update()`.
- Tap-style buttons hold their key ~120 ms so the 60 Hz sim sees it. Tapping the canvas slaps.
- The HUD buttons and pills don't carry key labels (owner, 2026-10-20: they crowded the combat HUD); every
  key and touch button is listed on the Esc menu's **Controls** page (`CONTROLS` in `src/main.js`, one list
  for touch, one for keyboards). A new key or button goes there.
- HTML strips that are tappable on their own: the hotbar, `#voicebar` (Mic, Broadcast), `#hudbtns`
  (Players, Decorate, Chat; below the location pill, top left); Menu and Full sit left of the voicebar. Panels (bag, skills, shop) move to the top on touch; the movement pad hides while a panel
  or text box is up; the feed sits above the controls.
- Phones render at up to 2× like desktops; the Esc menu's **Graphics** setting (Auto by default) drops to
  1× on a slow device (`docs/performance.md`). The Esc menu is tight: ten buttons fill the screen.
- Fullscreen (F / Full / Esc menu) must run from a `click`: on touch `pointerdown` isn't a user activation.
  iPhones can't fullscreen a page, so they get an "Add to Home Screen" tip; the manifest (display:
  fullscreen) and apple-* meta tags make the home-screen icon launch without browser bars.
  `(display-mode: fullscreen)` also matches in Fullscreen-API mode, not only home-screen launches.
