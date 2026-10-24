# Final bosses: one per island, built for a party of four (plan)

**Status: plan, written 2026-10-24 (owner). Nothing built.** Builds on S5's party mechanics
(`progression.md` section 6, `s5-plan.md`), so it comes after S5 and before Emberdeep's E1.

## The owner's ask (2026-10-24)
- **Every island gets a final boss.** Incredibly difficult: it needs **at least four players at its level**
  and takes them **about 30 minutes**.
- It's what the S track's party play is for: a mixed group that uses Taunt, Cleanse, heals, interrupts and
  weak points wins; anything less doesn't.
- **Greenhollow's lives in the Thornheart; Frostpeak's in the Blue Halls.** Both islands are already done, so
  these go ahead of Emberdeep on the roadmap. On new islands (Emberdeep on), the final boss is the **last
  phase** of the island's depth pass, after its capstone.

## How it differs from the other bosses
| size | example | who it's for | how long |
|---|---|---|---|
| field boss | the Thorn Hart, the Hall Troll | anyone, solo | a minute or two |
| den boss | the Tidemother, the Old Narwhal | any class solo; faster in a group | a few minutes |
| capstone | the Root Warden, Sigrun | a mixed party; extremely hard solo, never locked | a few minutes for a party |
| **final boss** | (new) | **four or more at its level; under four is not meant to win** | **about 30 minutes for four** |

**This is the owner's exception** to "every boss can be soloed" (`progression.md` principles). It's the
only boss size where too few players simply can't win. Every other size keeps the old rule, and the
capstones stay as they are.

## Design defaults (a builder can start from these; each a named constant in the code)
- **Level:** the top of its island's band (Greenhollow's at Lv 60, Frostpeak's at Lv 100), so it's the
  island's hardest fight even though it sits in a hard pocket. `[default]`; the alternative is the
  pocket's own top (60 and 90).
- **A den of its own** off the pocket's deepest end (a new room, like Sigrun's Seam off the Queen's
  Bridge). Inside the den the fight is the whole room; it isn't a field boss in the pocket.
- **Four is the floor:** HP scales with players (`BOSS_HP_PER_PLAYER`), but never below four players'
  worth (`FINAL_MIN_PLAYERS`), so two strong players can't shrink it. More than four makes it bigger,
  not easier.
- **Every S5 mechanic on, from the start:** no "only once enough slimes are there" gate. Focus, pulses,
  curses, a barrier phase, weak points, adds, an armour phase, and an ultimate to interrupt. Each class
  has a job only it does best, and the fight is built so a party missing one role struggles badly.
  Every mechanic still has a poor answer for any class (the S5 rule).
- **Phases across the 30 minutes:** three or four phases that change what the party must do, each with
  its own line. The last is the hardest.
- **An enrage** at `FINAL_ENRAGE_MIN` (a little past 30 minutes): the boss gets much stronger, so a party
  that's too weak runs out of time rather than winning slowly. Shown in the room (the light changes, a line).
- **Fainting:** a fainted slime stays down until a Cleric's Revive or the town (today's combat-room
  rule). Whoever gets back in can rejoin. No lockout.
- **Rewards:** the island's best gear, one piece per class (S5's loot by class), plus something only it
  drops (a cosmetic or a title; owner to pick). A long per-player reward window (`FINAL_WINDOW_MS`,
  default a day) so it's a weekly-night event, not a farm. Priced through `npm run economy` like any den:
  a 30-minute, four-player kill split four ways.
- **The economy sheet** gains a FINAL table: time for a mixed party of four (one of each class) at the
  boss's level to win, held near 30 minutes (`FINAL_KILL_MIN`, checked within a band), and a check that
  three players can't win before the enrage.
- **Mobile:** every mechanic readable and answerable on a phone (no tiny targets), the damage meter not
  crowding the screen with four or more names.

## The bosses (names and stories `[proposed]`, to write in their own session)
Big bosses get a story (`world/island-depth.md`): a creature twisted by an Anchor shard, holding on or
letting go, with lines on entering, at each phase and when freed (`characters/bosses.md`). Keep the lore
narrow, and the tone each island's own (`delivery.md`).
- **Greenhollow: the heart of the briar**, under the Thornheart's root knot by the Hedge Stone. The briar
  was planted "to keep the road" (the stone says so); whatever still keeps it is down there. Cozy island,
  so its menace is a quiet one, but the fight is not gentle.
- **Frostpeak: something sealed in the deepest ice of the Blue Halls**, below the Cutters' Niche: what the
  old ice-cutters stopped digging toward. Melancholy, cold, almost no humour.
- **Emberdeep (E5, after E4):** in the Old Foundry (`[default]`; or the Drained Tubes), at Lv 150.

## Phases
Each its own session and dev copy. Before building: read `progression.md` section 6, `s5-plan.md`,
`docs/combat/bosses.md`, and the pocket's doc.
- [ ] **FB1: Greenhollow's final boss** in the Thornheart (`docs/places/thornheart.md`): the den, the boss,
      its story and lines, the FINAL table and its checks in the economy sheet.
- [ ] **FB2: Frostpeak's final boss** in the Blue Halls (`docs/places/bluehalls.md`).
- Then every new island's depth pass ends with its own (Emberdeep's is E5 in `world/emberdeep-depth.md`).

## Open questions for the owner (default first)
1. Level: the island's top (60 / 100), or the pocket's top (60 / 90)?
2. The unique reward: a cosmetic (an aura, a hat) or a title by your name?
3. The reward window: a day, or a week?
