# story/: the narrative bible

The story is the backbone of Slimeville. Places, bosses, NPCs and flavor text are meant to be **reshaped to
fit it**, not the other way round. When the game and this folder disagree, the folder describes where the
game is heading (unless it's marked `[proposed]`), and the gap is listed in `roadmap.md`.

This is a writing space, not feature documentation: `docs/` says how the code works, `story/` says what
the world *is*. Once a story beat ships into code, the feature's doc in `docs/` points back here.

## Read in this order
1. `pitch.md`: the premise, theme and tone in one page. Start here.
2. `canon.md`: the settled facts, kept short. NPC prompts get fed from this.
3. `world/geography.md`: the map, distances, travel and landscape rules. Read before touching any place.
4. `world/regions/`: one file per region (landscape, people, mood, what's there now and what should be).
5. `world/history.md`: the timeline of the world.
6. `characters/`: Elder Mochi, Chronos, the nine bosses, the people of each island.
7. `arcs/main-arc.md`: the main story, act by act.
8. `delivery.md`: how the story reaches players (NPCs, bosses, places, items) and the tone gradient.
9. `roadmap.md`: the game changes the story asks for, in priority order. **Future sessions start here.**
10. `inventory.md`: what exists in the game today and how the story reinterprets it.
11. `expansion.md`: the built-in slots for growing the story, and the rules for adding to it.
12. `open-questions.md`: undecided ideas. Nothing in here is canon.

## Rules for editing
- **Canon vs proposed.** `canon.md` holds only decisions the owner has accepted. Elsewhere, mark undecided
  ideas `[proposed]` or move them to `open-questions.md`. AI characters are only ever fed canon.
- **Geography comes first.** A new place needs a spot on the map (`world/geography.md`), a travel mode, a
  landscape that matches its climate logic, and a reason in the history for being the way it is.
- **The tone darkens with distance** (`delivery.md`). Home is cozy, and the far places are serious. Don't
  sprinkle puns on the Citadel.
- **Names:** soft and slime-flavoured near home, older and plainer further out. No real-world brand or
  game names. No emoji (they reach canvas text through NPCs).
- Keep files skimmable: headings and short paragraphs. Write numbers in the code, not here.
- Changing a name the game already uses? Add it to `inventory.md` and `roadmap.md` so the rename happens.
