// Docs: docs/social/trading.md
// Trading between two players: the rules both sides need (who can trade where).
import { isCombat } from './rpg.js';

export const TRADE_RANGE = 220; // px apart, at most, to ask for a trade
export const TRADE_LEAVE = 400; // walking further apart than this ends an open trade
export const TRADE_ITEMS = 9; // different bag entries one side can offer at once
export const TRADE_ASK_MS = 30_000; // how long a trade request stays open

// Can these two (physics states) start a trade? → null if yes, or why not
export function tradeBlock(a, b) {
  if (!a || !b) return 'They are not here';
  if (a.room !== b.room) return 'You need to be in the same place';
  if (isCombat(a.room)) return 'Not out here with the mobs: find a calmer spot';
  if (Math.abs(a.x - b.x) > TRADE_RANGE) return 'Stand next to them to trade';
  return null;
}
