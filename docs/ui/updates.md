# New-patch banner

Files: `src/update.js`, `buildId()` in `server/index.js`, `#update` in `index.html` / `src/style.css`.

- Owner's ask: after a deploy, players shouldn't need a hard refresh. A deploy restarts the server, every
  open tab reconnects with its old code, and its `welcome` carries `build`: the hashed `assets/…js|css`
  names in the served `dist/index.html`. The tab compares that with the same list read from its own page
  at load (`buildOf`, same rule on both sides). Different → a banner, "A new patch is out!", with an Install button.
- Install is just `location.reload()`: `index.html` is served `no-cache` and the assets are hashed and
  `immutable`, so a plain reload always gets the new build. No service worker on purpose (nothing to go stale).
- The reload keeps your spot: the server holds a leaving slime's position for `RELOAD_KEEP_MS`
  (`docs/netcode.md`, "Restarts keep positions"), and Install logs straight back in: it stashes the
  login in `sessionStorage` (per tab) just across the reload, and `takeResume` deletes it as it reads it.
  Sound comes back on the first key or tap after (browsers need a gesture; the reload had none).
- No Later button (owner's call): the banner stays until you Install. Nothing forces an update: old tabs
  keep working as long as the wire stays compatible (`BIN_VERSION`, `docs/netcode.md`).
- The server re-reads `index.html` when its mtime changes, so a rebuild without a restart is still noticed
  at the next reconnect. Dev mode (`vite` serving `/src/`) has no build list and never shows the banner.
- Phones: on `pointer: coarse` the banner sits below the top button row (it covered Menu at the top).
- Tabs opened before this shipped don't have the banner: they need one ordinary refresh.
