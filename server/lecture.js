// Docs: docs/social/lecture-tutor.md
// Prof. Synapse's lectures in the lecture hall. He teaches one course at a time (src/shared/courses.js),
// working through its syllabus a few lines per topic. While at least one slime is inside he keeps going:
// DeepSeek writes the next line, which is shown for a while, and the following line is fetched before
// that time is up so there are no awkward pauses. With nobody in the hall he stops, so an empty hall
// costs nothing. Without a DeepSeek key (or if it fails) he falls back to built-in lines.
//
// Students choose the course by vote (server/index.js → setCourse); he finishes his current line,
// announces the change, and starts the new course from the top of its syllabus.
//
// Students can also raise their hand with a question (ask()). Questions queue up in order; the answer
// is written in the background and, once his current line has had its time, he calls on the student
// and answers before carrying on.
//
// A question can also steer the lecture ("skip ahead", "go back", "start this part again", "jump to
// recursion"): the answer comes back as JSON with an action, and when it's shown the syllabus moves to
// that topic, throwing away any line already written for the old one.
import { deepseek } from './npc.js';
import { courseById } from '../src/shared/courses.js';

const HISTORY = 8; // previous lines he sees, so the lecture flows
const LINES_PER_TOPIC = 4;
const PREFETCH_MS = 5000; // start writing the next line this long before the current one ends
const ASK_MAX = 150; // characters per question
const ASK_QUEUE = 6;
const ASK_COOLDOWN_MS = 20000; // after your question is answered
const ASK_DAILY = 40; // questions per student per day
export const DEFAULT_COURSE = 'ml';
const showFor = (text) => Math.min(18, Math.max(9, 5 + text.length * 0.07)) * 1000;

const system = (course) => `You are Prof. Synapse, a cheerful, slightly nerdy slime professor with a mortarboard and a pointer,
lecturing slime students in Slimeville's lecture hall. You are teaching ${course.code}: ${course.name}.
Syllabus: ${course.syllabus.map((t, i) => `${i + 1}. ${t}`).join('; ')}.
You speak one line at a time. Each line is 1–2 sentences (under 45 words) teaching one accurate, clear idea
at an introductory university level — definitions, intuitions, small examples, common pitfalls, a bit of
history. Follow on naturally from your previous lines. Now and then add a gentle slime pun or greet a
student by name. Plain text only: no markdown, no lists, no code blocks (describe code in words, or quote
a very short snippet inline).`;

const ANSWER = (who, q, topicNo) => `${who} raises their hand and asks: "${q}"
You are currently on syllabus topic ${topicNo}.
If they're asking you to move the lecture — skip ahead / next part, go back / previous part, start this
part over, or jump to a particular topic — set "action" to "next", "previous", "restart" or "goto" (with
"topic" = the syllabus number), and make "text" a short, cheerful acknowledgement naming the topic you're
moving to (1 sentence). Otherwise "action" is "none": call on them by name and answer in 1–3 sentences
(under 60 words), kindly and accurately, at a level a curious student can follow. If it's off-topic or
silly, answer briefly and playfully in character, then steer back to the course. Keep it family-friendly.
Reply as JSON: {"action": "none"|"next"|"previous"|"restart"|"goto", "topic": number|null, "text": "..."}.
"text" is plain text only.`;

// Without the AI, spot the obvious navigation requests
const guessAction = (q) =>
  /\b(go back|previous|last (part|topic)|back up)\b/i.test(q) ? 'previous'
  : /\b(skip|next (part|topic|section)|move on)\b/i.test(q) ? 'next'
  : /\b(start (this|it) (over|again)|restart|from the (start|top))\b/i.test(q) ? 'restart'
  : 'none';

// When there's no AI: a few real lines for the default course, and a placeholder for the others
const FACTS = [
  'In 1958 Frank Rosenblatt built the perceptron, a machine that learned to sort simple pictures by adjusting its weights — the great-grandparent of every neural network!',
  'An artificial neuron just multiplies its inputs by weights, adds them up with a bias, and squishes the result through an activation function.',
  'Backpropagation is the chain rule from calculus, applied layer by layer backwards, to find how much each weight contributed to the error.',
  'Training is like rolling downhill in fog: gradient descent takes small steps in whichever direction makes the loss go down fastest.',
  'Convolutional networks slide small filters across an image, so the same "edge detector" works anywhere in the picture.',
  'The 2017 paper "Attention Is All You Need" introduced the transformer, which lets every word look at every other word at once.',
];

const clean = (out) => out.replace(/^\s*TOPIC:[^|]*\|\s*/i, '').replace(/\s+/g, ' ').trim().slice(0, 360);

export function createLecture(broadcast) {
  let course = courseById(DEFAULT_COURSE);
  let topicIdx = 0; // syllabus topic the next written line is about
  let onTopic = 0; // lines written on it so far
  let pending = null; // course voted in, starting after the current line
  let gen = 0; // bumps on a course change, so lines written for the old course are thrown away

  const asks = []; // raised hands, in order: { user, text }
  let answering = null; // the ask being answered right now
  let answer = null; // its answer, ready to show
  const lastAnswered = new Map(); // user → time
  const asksToday = new Map(); // user → { day, count }
  const history = [];
  let current = null; // { course, topic, topicIdx, text, n, ask? }
  let queued = null;
  let writing = false;
  let showUntil = 0;
  let n = 0;
  let fallback = 0;

  const toHistory = (line) => {
    history.push(line);
    if (history.length > HISTORY) history.shift();
  };

  async function write(students) {
    writing = true;
    const myGen = gen, c = course, ti = topicIdx, k = onTopic;
    // advance the syllabus now, so a prefetched line and the one after it don't share a slot
    if (++onTopic >= LINES_PER_TOPIC) {
      onTopic = 0;
      topicIdx = (topicIdx + 1) % c.syllabus.length;
    }
    try {
      let text;
      if (process.env.DEEPSEEK_API_KEY) {
        try {
          const out = await deepseek([
            { role: 'system', content: system(c) },
            ...history.map((l) => ({ role: 'assistant', content: l.text })),
            { role: 'user', content: `Next line, please. Current topic: "${c.syllabus[ti]}" (line ${k + 1} of about ${LINES_PER_TOPIC} on it — ${k === 0 ? 'introduce the topic' : 'build on what you just said'}). Students in the hall right now: ${students.join(', ')}.` },
          ], 160);
          text = clean(out);
        } catch (e) {
          console.error('lecture:', String(e));
        }
      }
      if (!text) text = c.id === 'ml' ? FACTS[fallback++ % FACTS.length] : `Today in ${c.code} we're looking at ${c.syllabus[ti].toLowerCase()}. (My lecture notes seem to have gone missing — the AI isn't available right now.)`;
      if (myGen === gen) queued = { course: c.id, topic: c.syllabus[ti], topicIdx: ti, text };
    } finally {
      writing = false;
    }
  }

  const hands = () => [...(answering || answer ? [(answering ?? answer).ask.user] : []), ...asks.map((a) => a.user)];
  const sendHands = () => broadcast({ t: 'hands', users: hands() });

  async function answerNext() {
    const ask = asks.shift();
    if (!ask) return;
    answering = { ask };
    const c = course;
    let text, action = 'none', topic = null;
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        const out = JSON.parse(await deepseek([
          { role: 'system', content: system(c) },
          ...history.map((l) => ({ role: 'assistant', content: l.text })),
          { role: 'user', content: ANSWER(ask.user, ask.text, (current?.topicIdx ?? 0) + 1) },
        ], 220, { json: true }));
        text = clean(String(out.text ?? ''));
        if (['next', 'previous', 'restart', 'goto'].includes(out.action)) action = out.action;
        topic = Number.isInteger(out.topic) ? out.topic - 1 : null;
        if (action === 'goto' && !(topic >= 0 && topic < c.syllabus.length)) action = 'none';
      } catch (e) {
        console.error('lecture answer:', String(e));
      }
    } else action = guessAction(ask.text);
    if (!text) text = action === 'none'
      ? `Ooh, a wonderful question, ${ask.user}! Let me ponder that one and we'll come back to it after class.`
      : `Of course, ${ask.user} — let's ${action === 'next' ? 'move on' : action === 'previous' ? 'go back a step' : 'take that part again'}!`;
    answer = { text, ask, action, topic, gen };
    answering = null;
  }

  const show = (line, now, extra = 0) => {
    current = { ...line, n: ++n };
    showUntil = now + showFor(current.text) + extra;
    broadcast({ t: 'lecture', ...current });
  };

  return {
    current: () => current,
    course: () => course.id,
    pending: () => pending?.id ?? null,
    hands,

    // Students voted for another course: switch once the current line has had its time
    setCourse(id) {
      const c = courseById(id);
      if (c && c !== course) pending = c;
      else if (c === course) pending = null;
    },

    // A student raises their hand → null, or a reason it can't be asked (phrased for the player)
    ask(user, raw) {
      const text = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, ASK_MAX);
      if (!text) return 'Type your question first.';
      if (hands().includes(user)) return 'Your hand is already up — the professor will get to you!';
      if (asks.length >= ASK_QUEUE) return 'Lots of hands up already — try again in a moment.';
      if (Date.now() - (lastAnswered.get(user) ?? 0) < ASK_COOLDOWN_MS) return 'Let someone else have a turn first.';
      const day = new Date().toDateString();
      const used = asksToday.get(user)?.day === day ? asksToday.get(user).count : 0;
      if (used >= ASK_DAILY) return "That's plenty of questions for today — come back tomorrow!";
      asksToday.set(user, { day, count: used + 1 });
      asks.push({ user, text });
      sendHands();
      return null;
    },

    // Lower your hand (only while still waiting in the queue)
    cancel(user) {
      const i = asks.findIndex((a) => a.user === user);
      if (i >= 0) {
        asks.splice(i, 1);
        sendHands();
      }
    },

    // Call about once a second with the names of the slimes in the hall.
    tick(students) {
      if (!students.length) return; // nobody listening: pause (and spend nothing)
      const now = Date.now();
      if (now < showUntil) {
        if (!queued && !writing && !pending && now >= showUntil - PREFETCH_MS) write(students);
        if (!answering && !answer && asks.length) answerNext();
        return;
      }
      // the current line is done: a course change first, then questions, then the lecture
      if (pending) {
        course = pending;
        pending = null;
        gen++;
        topicIdx = onTopic = 0;
        queued = null;
        history.length = 0;
        show({ course: course.id, topic: course.syllabus[0], topicIdx: 0, text: `Alright, class — you voted! Let's switch to ${course.code}: ${course.name}. We'll begin with ${course.syllabus[0].toLowerCase()}.` }, now, -3000);
        broadcast({ t: 'course-changed' });
        return;
      }
      if (!answering && !answer && asks.length) answerNext();
      if (answer) {
        const { ask, action } = answer;
        let ti = current?.topicIdx ?? 0;
        if (action !== 'none' && answer.gen === gen) {
          // steer the syllabus: the next line introduces the chosen topic
          const len = course.syllabus.length;
          ti = action === 'goto' ? answer.topic : (ti + (action === 'next' ? 1 : action === 'previous' ? -1 : 0) + len) % len;
          topicIdx = ti;
          onTopic = 0;
          gen++; // a line already being written for the old topic is dropped
          queued = null;
        }
        toHistory({ text: `(answering ${ask.user}'s question "${ask.text}") ${answer.text}` });
        show({ course: course.id, topic: course.syllabus[ti], topicIdx: ti, text: answer.text, ask }, now, 2000); // a little longer: people read the question too
        answer = null;
        lastAnswered.set(ask.user, now);
        sendHands();
        return;
      }
      if (queued) {
        toHistory(queued);
        show(queued, now);
        queued = null;
      } else if (!writing) write(students);
    },
  };
}
