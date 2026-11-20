# Lecture hall, courses, votes, tutoring room

Files: `server/lecture.js`, `server/tutor.js`, `server/vote.js`, `src/shared/courses.js` (the courses and
their syllabi), `src/hall.js` (hall + building), `src/tutor.js`, `src/courses-ui.js` (course menu),
`src/mastery-board.js` (the Most Mastered sheet).

## Lecture hall (Prof. Synapse)
- Lectures while at least one slime is inside; an empty hall pauses with no API calls. He teaches the
  current course a few lines per syllabus topic, writing one line at a time and prefetching the next. The
  chalkboard shows the course and syllabus progress.
- C opens the course menu. A course wins when more than half the students in the room vote for it; he
  finishes his line, announces the switch and starts the new course from topic 1.
- H raises your hand with a question; questions queue and are answered between lines (one queued per
  student, a cooldown, a daily cap).
- A question can steer the lecture ("skip ahead", "go back", "start this part again", "jump to topic 5 /
  to recursion"): DeepSeek returns JSON `{action: none|next|previous|restart|goto, topic, text}`; when shown,
  the syllabus moves (`gen++` drops any prefetched line). Without an AI key a regex guesses the action.
- Hall seating is drawn entirely behind players (drawing row fronts over them cut slimes in half).

## Tutoring room (Tutor Byte)
- Quizzes students one at a time in arrival order. DeepSeek (JSON mode) writes a short-answer question;
  the student on turn has a time limit; DeepSeek rates the answer 0–5 with right / missed / model answer.
  Session scoreboard, wiped when the room empties. "Take a break" is a vote.
- **It remembers what you've got right** (owner request, 2026-11-20). An answer marked `KNOWN_SCORE` or better is saved for
  good (table `tutor_known` in the accounts DB, per account and course), and when it's your turn again, in any later
  session, the question writer gets your latest `KNOWN_PROMPT` correctly answered questions with orders not to ask them
  or the same fact reworded. Wrong or partial answers aren't saved, so those may come up again. An answer that wasn't
  marked because the AI was down is never saved. On top of the prompt there's an **exact-text check** (owner request,
  same day): a written question matching one of the student's known questions in that course (all of them, not only
  the latest batch), or one already asked this session, is thrown away and the writer tries again, told about the
  rejected one (`sameText`: case, punctuation and spacing ignored; up to `WRITE_TRIES` writes, then a built-in question). The
  built-in questions (`FALLBACKS`, also used when the AI is down) skip known ones too: each template on the turn's topic,
  then on the course's other topics, the first not known nor asked this session; only a student who's had every one
  hears a repeat. A reworded repeat still gets past the check; only the prompt guards against those.
- **Mastered counts are shown** (owner request, same day). The scoreboard on the wall has a `mastered` column beside the
  session's points: each student's questions mastered in the current course, ever (`masteredIn`, a count of
  `tutor_known`, sent as the third value of each `scores` row). A verdict that masters a new question says so beside
  the score dots ("Mastered! N in this course", `result.mastered`): placed there, not at the bottom, so a long verdict
  can't push it off the board. Long names are cut short on the scoreboard to fit the extra column.
- **The Most Mastered leaderboards** (owner requests, same day): one sheet pinned on the wall between the whiteboard
  and the clock with two boards, each the top `TOP_N` accounts by questions mastered, all time (ties: who got there
  first). On top, the course being quizzed (`topCourse`; hidden while there's no course or on a break); under it, every
  course together (`top`). The server reads both when it starts, when the course changes, when the room empties and
  whenever someone masters a new question, never per tick.
- **The same sheet hangs in the lecture hall** (owner request, same day), on the far wall past the last window, above
  the tutoring room's door: the board for the course Prof. Synapse is lecturing, then every course. It rides on the
  hall's `{t:'courses'}` message as `leaders` (`tutor.leaders(course)`), so it's sent when you walk in and when the
  course changes, and the tutor's `onMastered` hook resends it whenever someone masters a question. One drawing for
  both rooms: `drawMasteryBoard` in `src/mastery-board.js`.
- Besides the CS courses, the tutor runs quizzes marked `tutorOnly` in `COURSES` (General Trivia, World
  Geography, Biomedical Science; owner request). Their `quiz` field tells the question writer what kind
  of question fits (trivia and geography want one checkable fact, biomed is short-answer like CS). The
  hall's course menu hides them and `lecture.setCourse` refuses them: Prof. Synapse lectures CS only.
