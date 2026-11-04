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
