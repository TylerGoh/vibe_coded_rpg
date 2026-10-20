// Docs: docs/social/lecture-tutor.md
// Course votes for a room (lecture hall, tutoring room). A choice wins once more than half of the
// students currently in the room have voted for it — so a student alone decides straight away.
export function createVote() {
  const votes = new Map(); // user → choice
  return {
    set: (user, choice) => votes.set(user, choice),
    drop: (user) => votes.delete(user),
    clear: () => votes.clear(),
    // { choice: count } among the students present
    counts(present) {
      const out = {};
      for (const u of present) if (votes.has(u)) out[votes.get(u)] = (out[votes.get(u)] ?? 0) + 1;
      return out;
    },
    winner(present) {
      for (const [choice, n] of Object.entries(this.counts(present))) if (n > present.length / 2) return choice;
      return null;
    },
  };
}
