// Docs: docs/social/lecture-tutor.md
// Tutor Byte's quiz in the tutoring room. Students vote on a course (or a break); then the tutor quizzes
// the students in the room one at a time, in turn. On your turn DeepSeek writes a short-answer question
// on the course; you type an answer; the tutor rates it out of 5 for how correct it is and explains what
// you got right, what you missed and what a full answer looks like. Points add up for the session and are
// wiped when the room empties.
//
// Phases: idle (no course yet) · break · asking (writing a question) · answering (waiting for the student,
// with a time limit) · marking · review (showing the verdict) → next student's turn.
import { deepseek } from './npc.js';
import { courseById, BREAK } from '../src/shared/courses.js';

const ANSWER_MS = 90000; // time to answer before the tutor moves on
const ANSWER_MAX = 400; // characters per answer
const REVIEW_MS = 14000; // how long the verdict stays up before the next turn
const RECENT_QUESTIONS = 20; // questions remembered this session, so they aren't repeated

const PERSONA = `You are Tutor Byte, a friendly, encouraging slime tutor in Slimeville's tutoring room, running a
quiz for slime students on university courses and trivia. You are accurate and fair.`;

const parseJson = (out) => {
  try {
    return JSON.parse(out);
  } catch {
    const m = out.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  }
};
const short = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

export function createTutor(broadcast) {
  let course = null; // course id, BREAK, or null
  let phase = 'idle';
  let turn = null; // whose turn it is
  let question = null; // { text, topic }
  let answerText = null;
  let deadline = 0;
  let reviewUntil = 0;
  let result = null; // { user, answer, score, right, missed, model, comment }
  let order = []; // students in the order they take turns
  const scores = new Map(); // user → points this session
  const asked = []; // recent questions
  let qn = 0; // questions asked this session (also picks the syllabus topic)
  let gen = 0; // bumps when the quiz is interrupted, so stale AI replies are ignored
  let session = false;

  const state = () => ({
    t: 'tutor', phase, course, turn, question: question?.text ?? null, topic: question?.topic ?? null,
    answer: answerText, msLeft: phase === 'answering' ? Math.max(0, deadline - Date.now()) : 0, result,
    scores: order.map((u) => [u, scores.get(u) ?? 0]),
  });
  const send = () => broadcast(state());

  function reset() {
    gen++;
    phase = course && course !== BREAK ? 'idle' : course === BREAK ? 'break' : 'idle';
    turn = question = answerText = result = null;
  }

  async function ask() {
    const c = courseById(course);
    const who = order[(order.indexOf(turn) + 1) % order.length] ?? order[0];
    turn = who;
    phase = 'asking';
    question = answerText = result = null;
    const myGen = ++gen;
    const topic = c.syllabus[qn++ % c.syllabus.length];
    send();
    let text = null;
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        const out = await deepseek([
          { role: 'system', content: PERSONA },
          { role: 'user', content: `Write one quiz question for the student "${who}" on ${c.code} ${c.name}, topic: "${topic}".
${c.quiz ? `It must be ${c.quiz}. Not multiple choice` : `It must be a short-answer question (not multiple choice) that can be answered well in 1–3 sentences: a definition,
a "why" or "how", a tiny worked example, or a comparison. Introductory university level`}, accurate and unambiguous,
under 35 words. Do not repeat or closely resemble these earlier questions: ${asked.length ? asked.map((q) => `"${q}"`).join('; ') : '(none yet)'}.
Reply as JSON: {"question": "..."}` },
        ], 150, { json: true, temperature: 1.0 });
        text = short(parseJson(out)?.question, 240) || null;
      } catch (e) {
        console.error('tutor question:', String(e));
      }
    }
    if (myGen !== gen) return;
    text ||= `In your own words: what is "${topic.toLowerCase()}" in ${c.name}, and why does it matter?`;
    asked.push(text);
    if (asked.length > RECENT_QUESTIONS) asked.shift();
    question = { text, topic };
    phase = 'answering';
    deadline = Date.now() + ANSWER_MS;
    send();
  }

  async function mark(user, given) {
    const c = courseById(course);
    phase = 'marking';
    answerText = given;
    const myGen = gen;
    send();
    let verdict = null;
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        const out = await deepseek([
          { role: 'system', content: PERSONA },
          { role: 'user', content: `Course: ${c.code} ${c.name}. Question for ${user}: "${question.text}"
${given ? `${user}'s answer: "${given}"` : `${user} didn't answer in time.`}
Rate how correct and complete the answer is from 0 to 5 (0 = wrong or blank, 3 = partly right, 5 = fully correct).
Be fair: credit correct ideas even if worded informally or briefly (a one-word answer can be fully correct; accept close spellings); don't reward confident nonsense.
Reply as JSON: {"score": <0-5 integer>, "right": "what they got right, or empty", "missed": "what was wrong or missing, or empty",
"model": "a concise correct answer, 1–2 sentences", "comment": "one short encouraging remark to ${user}"}.
Keep each field under 30 words, plain text.` },
        ], 300, { json: true, temperature: 0.3 });
        verdict = parseJson(out);
      } catch (e) {
        console.error('tutor marking:', String(e));
      }
    }
    if (myGen !== gen) return;
    const score = Math.max(0, Math.min(5, Math.round(Number(verdict?.score) || 0)));
    result = {
      user, answer: given, score,
      right: short(verdict?.right, 220), missed: short(verdict?.missed ?? (given ? '' : 'No answer in time.'), 220),
      model: short(verdict?.model, 260) || '(The tutor couldn\'t mark this one — the AI isn\'t available right now.)',
      comment: short(verdict?.comment, 140),
    };
    scores.set(user, (scores.get(user) ?? 0) + score);
    phase = 'review';
    reviewUntil = Date.now() + REVIEW_MS + Math.min(8000, (result.model.length + result.missed.length) * 25);
    send();
  }

  return {
    state,
    course: () => course,

    // The room voted for a course (or BREAK): restart the quiz on it; scores carry on for the session
    setCourse(id) {
      if (id === course || (id !== BREAK && !courseById(id))) return;
      course = id;
      reset();
      send();
    },

    // The student whose turn it is answers → null, or a reason (phrased for the player)
    answer(user, raw) {
      if (phase !== 'answering' || user !== turn) return "It isn't your turn to answer.";
      mark(user, short(raw, ANSWER_MAX) || '(no answer)');
      return null;
    },

    // About once a second, with the names of the students in the room (in arrival order)
    tick(students) {
      if (!students.length) {
        if (session) {
          // everyone left: the session is over, wipe it
          session = false;
          course = null;
          order = [];
          scores.clear();
          asked.length = 0;
          qn = 0;
          reset();
        }
        return;
      }
      session = true;
      const before = order.join();
      order = order.filter((u) => students.includes(u)).concat(students.filter((u) => !order.includes(u)));
      if (order.join() !== before) send();
      if (!course || course === BREAK) return;
      const now = Date.now();
      if (phase === 'idle') ask();
      else if (phase === 'answering' && (now > deadline || !order.includes(turn))) mark(turn, null);
      else if (phase === 'review' && now > reviewUntil) ask();
      else if (phase === 'asking' && !order.includes(turn)) ask(); // they left before we finished writing
    },
  };
}
