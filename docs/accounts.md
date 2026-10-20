# Accounts and login

- `data/accounts.sqlite` (node:sqlite, scrypt hashes), managed by `server/accounts.js`. Deliberately
  low-stakes: the point is one login per person, not security.
- No sign-up: `node server/accounts.js add <user> <pass>` (also resets a password) / `list` / `remove`.
  Point it at another DB with `DB=…` (test servers).
- Logging in elsewhere takes over the slime; the old tab gets close code 4001 and returns to the login
  screen. A takeover once crashed the live server (a missing per-player field on the new connection):
  any per-player state the server keeps must be (re)initialised on every login.
- Accounts, all with password `P@ssw0rd123`: darrell (flute), shireen (ribbon, glasses, notes),
  chenyirong (laptop), qinxin (bowtie), tyler (owner), justin, dustin, guang, zhunhao, momo, marcus,
  tristan. The first four were dd / s / yr / qx in Slime Hop. Their accessories are keyed by username in
  `ACCESSORIES` in `src/slime.js`.
- Characters (level, bag, skills…) are a separate table, `rpg_chars`: see `docs/combat/core.md`. House
  layouts are the `houses` table (`docs/places/houses.md`).
