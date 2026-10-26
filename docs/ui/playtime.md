# Play time page (Esc menu)

Owner's ask (2026-10-26): players can see how long they've played, per day and overall, from the settings
(Esc) menu. The **Play time** button sits beside **Controls** (two half-width buttons in a `.menu-row`, so
the menu still fits in 540 px on phones).

- **Data**: the character's `played` / `active` totals (`docs/combat/core.md`, recorded since 2026-10-23)
  and `days`, a map `'YYYY-MM-DD' → [ms played, ms active]`, both counted by `clock()` in `server/rpg.js`
  on every save. Only the last `DAYS_KEPT` days are kept on the character. Per-day counting started
  2026-10-26, so the all-time total is bigger than the sum of the days.
- **Days** are the server's local dates (`dayOf`; the box runs on Singapore time, where the friends are),
  not the viewer's: one shared calendar, and the note on the page says so.
- **Protocol**: → `{t:'playtime'}` when the page opens; ← `{t:'playtime', played, active, today, days}`
  (`playtime()` in `server/rpg.js` runs `clock()` first, so it's up to the second). Nothing is pushed while
  it's open.
- **Client**: `src/playtime.js` (`PlayTime`) draws three totals (today, last 7 days, all time with its
  active part) and one bar per day for `DAYS_SHOWN` days; the darker part of each bar is active time.
  Plain HTML (`#playtime` in `index.html`), so it works the same on touch.
- Active = a key pressed within `ACTIVE_WINDOW_MS`; logged in but idle still counts as played.
