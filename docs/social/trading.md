# Trading coins and items

Files: `server/trade.js` (asks, the open trade, the swap, the log), `src/shared/trade.js` (where you can
trade: `tradeBlock`, `TRADE_RANGE`, `TRADE_LEAVE`, `TRADE_ITEMS`, `TRADE_ASK_MS`), `src/trade.js` (the
trade window and the "wants to trade" card), the Trade button in the Players panel (`src/players.js`).
The protocol is at the top of `server/index.js`.

## How it works (owner, 2026-10-23)
- Two slimes in the same room, within `TRADE_RANGE` of each other, outside combat rooms. One taps Trade
  in the Players panel (P); the other gets a card (Trade / Not now). If both ask each other, it opens.
  Not built yet: starting a trade by tapping a slime on the canvas (tapping slaps).
- The window shows both offers (each item's full card: stats, scroll bonuses, upgrade slots left),
  your bag to tap things in and out of the offer (a number box for part of a stack), and gold.
- **Anti-scam:** every offer change bumps the trade's version `v` and un-readies both sides. A Ready
  carries the `v` it was looking at, and a stale one is ignored, so nobody readies an offer they never saw.
- **The server decides everything.** An offer is sent whole as bag slots and re-read on the server
  into `{id, n, e}` copies. When both are Ready, the server works out both new bags at that moment
  (`after()`): if either side no longer has what they offered, or a bag can't hold what comes in,
  nothing moves and both are un-readied. Otherwise both bags and purses change in the same tick and both
  characters are saved straight away.
- Items keep their enhancement `e`. Worn gear isn't in the bag, so it has to be taken off first.
  Cosmetics, houses, furniture and pets aren't bag items, so they can't be traded (owner's open question
  on cosmetics: locked for now).
- The trade ends when either side cancels (Esc / Cancel), leaves, changes room, walks further than
  `TRADE_LEAVE` apart, or (via the tick) ends up somewhere `tradeBlock` refuses.
- **Bots:** a slime caught botting (`caughtBy`, `docs/social/accuse.md`) can't trade either way, so a
  caught bot can't pass its gold out. EXP can't be traded, so the skim can't be dodged.
- **Log:** every finished trade is a row in table `trade_log` (at, a, b, a_gave, b_gave as JSON) in the
  accounts DB, and a `trade:` line in the service log, so a lost item can be traced.

## Mobile
The window is HTML; on touch (`body.touch #trade`) it fills the canvas height, with bigger bag slots and
buttons. Movement keys are blocked while it's open (it's in main.js's overlay lists).
