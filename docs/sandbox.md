# The dev sandbox at /rpg_dev

Files: `server/sandbox.js` (its messages, the login copy, dummies, bosses, toggles, the DPS count, `IDLE_EXIT_MIN`),
`src/shared/sandbox.js` (the Training Yard's room `ARENA` and every sandbox number), `src/sandbox.js` (the panel and
the readout), `src/sandbox-art.js` (the yard and the dummies), `scripts/sandbox-build.mjs` (the build-if-changed step),
`deploy/rpg-dev.service` and its socket unit `deploy/rpg-dev.socket`, the `/rpg_dev/` block in
`deploy/nginx-owntracks.conf`. Hooks into the game: `hooks` in `createRpg` (`server/rpg.js`), the `sbx` branch and
`SANDBOX` in `server/index.js`, `onSandbox` in `src/net.js` / `src/main.js`.

## What it is, and why (owner, 2026-10-27; `story/roadmap.md` 5b)
Friends say some classes don't *feel* right, and bots can't judge feel, so the owner wanted a quick hand-testing loop:
log in, become any class at any level with any gear, hit dummies or a boss, read the DPS, change something, again.
**It is not the full game**: the world is all there (it's the same code), but you start in the Training Yard and the
panel is the way around. Open to the owner and every friend (any account). Not wanted: live number sliders (balance
stays in code and `npm run economy`).

**Everything "feel" is the game's own**: the hit pops, sounds, shakes, buff bar and status box, hotbar, boss moves.
The sandbox only adds a room, two mob kinds, a panel and a readout; it never changes how a skill or a boss works.

## The pieces
- **Its own server process**: the same `server/index.js` with `SANDBOX=1`, on 127.0.0.1:3003, serving under
  `RPG_BASE=/rpg_dev/` (the client is built with the same `RPG_BASE`: `vite.config.js` takes it as Vite's `base`, and
  the client finds its WebSocket from `import.meta.env.BASE_URL`, so one codebase serves both). Its own DB (`DB`), its
  own build (`DIST`), no TURN or DeepSeek keys (voice is STUN only and the characters sleep: it spends nothing).
- **Started on demand** (RAM is tight): systemd holds the port (`rpg-dev.socket`) and starts `rpg-dev.service` on the
  first connection; the server takes the socket as fd 3 (`LISTEN_FDS`, `fromSystemd` in `server/index.js`), else
  listens on `PORT`. With nobody connected for `IDLE_EXIT_MIN` it saves and exits; the next visit starts it again. The
  first page load after a sleep waits a few seconds (nginx's `proxy_read_timeout` is long enough for a build too).
- **The code dir**: `~/rpg-dev`, a git worktree of `~/rpg` on the `dev` branch, with `node_modules` a symlink to
  `~/rpg/node_modules`. The owner points it at work in progress there. The service builds its client into
  `~/.cache/rpg-dev/dist` only when the code changed (`scripts/sandbox-build.mjs`: a hash of everything the client
  build reads, kept in the build folder), so a cold start with unchanged code skips the build.
- **Accounts**: friends log in with their live name and password. Before every sandbox login, `syncAccount` opens the
  live DB (`LIVE_DB`) **read-only** and copies that account's password hash (so a password changed on live works here
  too) and, the first time only, its character. After that the character is the sandbox's own. The live DB is never
  written. A sandbox-only account: `DB=~/.local/share/rpg-dev/sandbox.sqlite node server/accounts.js add <user> <pass>`.

## The Training Yard and the panel
- **The Training Yard** (`ARENA`, room 53, `ROOMS` in `src/shared/sim.js`): a combat room with two stands, no doors.
  Everyone in the sandbox logs in there and wakes up there (`hooks.respawn`). On the live server it exists in the code
  but nothing leads to it.
- **The panel** (`#sbx`; O on a keyboard, the Sandbox button by Players on touch; 44 px targets on phones), four tabs:
  - *Character*: class, level (with the advancement levels as shortcuts, up to `SANDBOX_MAX_LVL`), skills (Max all:
    every point the level gives, earliest advancement first, then the newest skills on an empty hotbar; Keep; None, to
    spend by hand in K), ability points (all in the class's `MAIN_STAT`, keep, or reset to spend in I), any weapon of
    the class's kind and any helmet, whatever their level. Apply swaps at once (buffs, summons and cooldowns cleared,
    HP and MP full, everyone sees the new look) and saves in the sandbox DB. Stock potions puts `SANDBOX_POTS` of each
    of `SANDBOX_POTIONS` in the bag and on the potion bar.
  - *Dummies*: one Training Dummy, a pack (`DUMMY_PACK`, for area skills) or a Sparring Dummy that hits back (it stomps:
    jump the shockwave; touching it hurts too; `SPAR_HIT_PCT` of your max HP a hit, like a boss's share, so it matters
    at any level), up to `DUMMY_MAX`; Clear. Dummies never die and give nothing (`dummy` on their `MOBS` rows, kept up
    in `damage()`); their HP stays at the yard's setting (`DUMMY_HP_SHARES`), for skills that care about a target's HP.
  - *Bosses*: every `DENS` row (the dens, the party dens, the final bosses), started at phase 1–4 or near death:
    Fight resets that boss (`resetBoss`), sets its HP to the share that phase starts at (`PHASE_AT`, a final boss's
    `FINAL` row), and puts you in its den. Everything else is the game's: leave and it heals after a few seconds; party
    mechanics need the party sizes they need in the game. Back to the yard from anywhere. Everyone in the sandbox
    shares the dens, as in the game.
  - *Toggles* (yours, until you log out): god mode (hits land, numbers and knockback show, you never go down:
    `hooks.god` in `hurt()`), full MP (topped up before each cast and between casts), no cooldowns (server and client).
- **The DPS readout** (`#sbx-dps`, left side under the status box; the boss's damage meter stays on the right): your
  damage on anything since its reset, counted by the server (`hooks.onDamage` in `damage()`: dots, summons, fields and
  bursts included and labelled), DPS over first hit → last hit, the total, a timer, the top skills with share and
  hit count, and Reset (also on the panel, which can hide it).

## Safety rules (why none of this reaches the live game)
- Every `sbx` message is dropped unless the server runs with `SANDBOX` (`server/index.js` creates the sandbox module
  only then; `hooks` stay empty on live). Never set `SANDBOX`, `LIVE_DB` or `RPG_BASE` in `deploy/rpg.service`.
- The sandbox's DB, positions and boss files live in `~/.local/share/rpg-dev/`; the live DB is only read, and only for
  the login copy. Nothing earned in the sandbox (gold, items, EXP) exists anywhere else, so it doesn't touch
  `docs/economy.md`'s sheet (dummies give nothing; bosses pay into the sandbox DB only).
- `scripts/sandbox-build.mjs` refuses to build into a `dist/` the live site serves.

## Install (once) and update
Install (the main session; no sudo):
```
git -C ~/rpg worktree add ~/rpg-dev -b dev        # or: git -C ~/rpg worktree add ~/rpg-dev dev  (an existing branch)
ln -s ~/rpg/node_modules ~/rpg-dev/node_modules
install -m 644 ~/rpg/deploy/rpg-dev.socket ~/rpg/deploy/rpg-dev.service ~/.config/systemd/user/
systemctl --user daemon-reload && systemctl --user enable --now rpg-dev.socket
(cd ~/rpg-dev && DIST=~/.cache/rpg-dev/dist RPG_BASE=/rpg_dev/ node scripts/sandbox-build.mjs)   # first build
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3003/rpg_dev/   # 200: started on demand
```
nginx (the owner, with sudo): `sudo bash /home/tylergoh/rpg/deploy/install-nginx.sh`. The staged config is a whole copy
of the live one; the installer refuses one that would drop a route the live config has (other projects add theirs:
`/cal/`, `/bank/`), so restage it from `/etc/nginx/conf.d/owntracks.conf` if it complains.

Update: put the code in `~/rpg-dev` (`git -C ~/rpg-dev merge main` for what's live, or commit / check out work in
progress on `dev`), then `systemctl --user restart rpg-dev.service` (it rebuilds if the client changed). Or just stop
it (`systemctl --user stop rpg-dev.service`): the next visit starts it with the new code. Logs:
`journalctl --user -u rpg-dev`. A failed start (a build error) leaves the socket waiting: fix the code, then
`systemctl --user reset-failed rpg-dev.service`. Unit changes: `install` them again and `daemon-reload`.
Note: `npm run dev` (Vite's dev server) also wants port 3003; stop the socket or pass `--port` while using it.

## Not done / ideas
- No switch to force a boss's party mechanics on for one slime (`TEST_PARTY` does it on a test server); no field bosses
  on the Bosses tab; dummies don't fight back with anything but a stomp.
