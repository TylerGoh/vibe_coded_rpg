# Accusing someone of botting (for fun)

Files: `server/accuse.js` (accusations, the deny deadline, the penalty, the cooldown), `src/accuse.js` (the
notice, the canvas "Not a bot!" button, the caught pill), the Accuse button in the Players panel
(`src/players.js`), and the EXP skim in `gainExp` (`server/rpg.js`).

## Owner decisions (2026-10-21)
- It's a friendly game, so this is a joke mechanic, not anti-cheat. Anyone can accuse any online slime
  from the Players panel (Accuse, then Sure? within a few seconds, so it isn't tapped by accident). One
  accusation per accuser per `ACCUSE_COOLDOWN_MS`; a slime with an accusation (or penalty) already on
  them can't be accused again until it's over.
- The accused has `ACCUSE_WINDOW_MS` to deny it. **Nothing is blocked while it's open** (owner: a bot
  has to keep botting): no overlay, no card, the touch pad stays.
- The deny button **is drawn on the canvas, never HTML** (owner: "should not be element selectable"),
  at a random spot that jumps every `MOVE_MS`, so a script can't find it in the page or click a fixed
  spot. It has no hotkey on purpose. The canvas `pointerdown` checks it (`accuse.tap`) before anything
  else, so tapping it doesn't also slap. On phones it stays in the upper part of the screen, clear of the
  touch controls.
- Not denied in time: caught. For `BOT_PENALTY_MS` (a liberal pick; the owner gave no length) the
  caught slime gains no EXP at all, and `BOT_CUT` of what they'd have gained goes to the accuser if
  they're online (otherwise it's lost). A caught accuser's own skimmed share isn't passed on again, and
  a caught slime receiving a share gets nothing.
- Everything is saved on the character (`bot`, `accusedAt`), so logging out doesn't escape it: an
  accusation that runs out while you're offline catches you when you're back (the penalty is counted
  from the deadline, so time offline counts too).

## Notes
- Economy: it only removes EXP (the skim is a fraction of what's lost), so `npm run economy` doesn't
  change.
- Tests: `TEST_ACCUSE_FAST=20` makes every timer 20× shorter (never set it live). The minute counts in
  the toasts then read as fractions.
