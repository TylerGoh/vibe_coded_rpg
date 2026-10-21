# Lecture hall, courses, votes, tutoring room

Files: `server/lecture.js`, `server/tutor.js`, `server/vote.js`, `src/shared/courses.js` (the courses and
their syllabi), `src/hall.js` (hall + building), `src/tutor.js`, `src/courses-ui.js` (course menu).

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
- Besides the CS courses, the tutor runs quizzes marked `tutorOnly` in `COURSES` (General Trivia, World
  Geography, Biomedical Science; owner request). Their `quiz` field tells the question writer what kind
  of question fits (trivia and geography want one checkable fact, biomed is short-answer like CS). The
  hall's course menu hides them and `lecture.setCourse` refuses them: Prof. Synapse lectures CS only.
