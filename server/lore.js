// Docs: docs/social/story.md
// The lore an AI character may share with one slime (atlas Phase 7, story/phase7-plan.md). The canon is read from
// story/canon.md itself at start-up (its "## Tier N" sections), so the game and the bible can't drift apart. A
// character with a `lore` cap (server/characters.js) gets, for the slime it's answering, the canon from Tier 1 up to
// min(that slime's tier, its cap); the slime's tier comes from its story record (src/shared/story.js).
import { readFileSync } from 'node:fs';

// tier → its canon lines (plain text, markdown bold dropped)
function readCanon() {
  const text = readFileSync(new URL('../story/canon.md', import.meta.url), 'utf8');
  const tiers = {};
  for (const part of text.split(/^## /m).slice(1)) {
    const body = part.split('\n').slice(1).join('\n').replace(/\*\*/g, '').trim();
    const m = /^Tier (\d)\b/.exec(part);
    if (m) tiers[+m[1]] = body;
    else if (/^Deliberately open/.test(part)) tiers.open = body.replace(/\s*\(don't close these in canon\)/, '');
  }
  return tiers;
}
export const CANON = readCanon();
for (const t of [1, 2, 3, 4]) if (!CANON[t]) console.warn(`lore: story/canon.md has no "## Tier ${t}" section`);

// The system-prompt section for `user` at lore tier `tier`, for a character whose cap is `cap`. knows: the character
// knows the old story itself (Mochi, Clio: it confirms and deepens); otherwise it has only heard the same rumours in
// its own corner (everyone else: it talks them over, in its own life's terms, and adds nothing)
export function loreFor(user, tier, cap, knows = false) {
  const n = Math.min(tier, cap);
  if (n <= 0) {
    return `\n\nThe old story: ${user} hasn't learned any of it yet (only what everyone knows). If they ask about the deep
past, the Keepers, shards or why the sea widens, don't tell them: deflect in character (some things are better found
than told; the great beasts of the wilds know more). Never hint at what you're keeping back.`;
  }
  const known = Array.from({ length: n }, (_, i) => `Tier ${i + 1}:\n${CANON[i + 1] ?? ''}`).join('\n');
  if (!knows) {
    return `\n\nThe old story, as far as ${user} has found it out (they've beaten the great beasts that carry it). You've heard
the same things whispered in your own corner of the world, so with ${user}, and only with them, you may talk these over:
in your own plain voice, what you've heard, what you make of it, how it sits with your own life and your island. This
overrides your "don't know" list for exactly these lines and nothing else: add no facts, names or history beyond them,
don't lecture, and don't bring it up first unless it fits:
${known}
Anything past this you don't know: say so in character. Others standing near may have earned less: speak to ${user}.
Nobody knows these (never answer them or invent an answer):
${CANON.open ?? ''}`;
  }
  return `\n\nThe old story, as far as ${user} has earned it (they've beaten the great beasts that carry it, up to lore
Tier ${n} of ${cap}). With ${user} you may talk about these things freely, in your own words and your own voice, a
little at a time, as things they've found out that you can now confirm and deepen (never as a lecture or a list):
${known}
Anything past this isn't theirs yet: deflect it in character, without hinting at what's there. Others standing near
may have earned less: speak to ${user}.
Nobody knows these, you included (never answer them, never invent an answer; wonder about them if you like):
${CANON.open ?? ''}`;
}

// The freed world changes (atlas Phase 7 (d)): once a slime has beaten one of these bosses, its place is drawn changed
// for that slime alone (src/coves.js, deep.js, skerries.js, spine.js). The characters who live by it hear it from the
// slime's own story record, so they don't go on describing it as stuck to the one who freed it. near: character ids
export const FREED = {
  tidemother: { near: ['moss'], name: 'the Tidemother', seen: "the Tide Pools run clear again: the tide comes and goes in them, the anemones stand up, little fish are back" },
  knotmole: { near: ['truffle'], name: 'the Knotmole', seen: "the Knotmole's knots are untied, and the glow runs west along the great threads in full again, past the Knotted Halls and off under the sea" },
  old_narwhal: { near: ['hakon', 'skaldi', 'runa', 'tove'], name: 'the Old Narwhal', seen: "the pack ice across the outer sound has broken up: she sang the floes out, they drift away to sea and fish leap in the open water" },
  root_warden: { near: ['acorn'], name: 'the Root Warden', seen: "up on Keeper's Spine the great roots have drawn back off the Crest's stones into the turf, heather growing over them" },
  // the Citadel, C1: the Orrery's den (its dome drawn changed for the slime who freed it: src/orrery.js)
  meridian: { near: ['echo'], name: 'Meridian, the orrery\'s engine', seen: "in the Orrery the great arms hang still at last and the stars in the dome sit where they are now, scattered; nothing pulls them back any more. It frightens you and eases you at once" },
  // L5 (c): Lantern Fen's final boss. Nobody in Wickmere says her name; "the Mother" is as far as the songs go
  wickmother: { near: ['wren', 'hob', 'sedge', 'netta'], name: 'the Mother in the Hall of Lamps', seen: "the Lamp Walk burns low: a few of its lanterns have gone out and their tags are gone, as if they were let go (Wren's husband's is one of them), and the Hall of Lamps' front door at the Causeway's end stands open, its silk cut down. Be gentle about it: it is grief, and a relief" },
};

// The prompt lines for character `id` about what `user` has freed (freed: the boss kinds in their story record)
export function freedFor(user, id, freed = []) {
  const seen = freed.map((k) => FREED[k]).filter((f) => f?.near.includes(id));
  if (!seen.length) return '';
  return `\n\nWhat ${user} has changed: ${seen.map((f) => `they beat ${f.name}, and for them ${f.seen}`).join('; ')}. With ${user},
talk of it as changed (you've noticed it lately; you can guess it was their doing, and be glad of it in your own way).
What you know above describes it as it was before. Others standing near may still see it the old way.`;
}
