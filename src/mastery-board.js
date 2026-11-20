// Docs: docs/social/lecture-tutor.md
// The Most Mastered leaderboards (questions answered correctly in Tutor Byte's quizzes, all time; server/tutor.js), one
// light-blue sheet pinned to a wall: the course's board on top (only when there's a course), every course together under
// it. Drawn in the tutoring room (src/tutor.js) and the lecture hall (src/hall.js).
import { circle } from './util.js';
import { text } from './village.js';

const FONT = "Fredoka, 'Trebuchet MS', sans-serif";

// (x, y) the sheet's top-left, w its width; course a COURSES row or undefined; top / topCourse [[name, n]] rows
export function drawMasteryBoard(ctx, x, y, w, course, top = [], topCourse = []) {
  const sections = [
    ...(course ? [{ title: 'Most Mastered', sub: `${course.code ?? course.name}, all time`, rows: topCourse ?? [] }] : []),
    { title: course ? 'All Courses' : 'Most Mastered', sub: 'all courses, all time', rows: top ?? [] },
  ];
  const tall = (sec) => 42 + Math.max(1, sec.rows.length) * 17;
  const h = sections.reduce((a, sec) => a + tall(sec), 8);
  ctx.save();
  ctx.translate(x + w / 2, y);
  ctx.rotate(0.02);
  ctx.fillStyle = '#e8f0ff';
  ctx.fillRect(-w / 2, 0, w, h);
  ctx.fillStyle = '#3c6ad0';
  circle(ctx, 0, 4, 4); // pin
  let at = 0;
  sections.forEach((sec, k) => {
    if (k) {
      ctx.fillStyle = '#c3d2f0';
      ctx.fillRect(-w / 2 + 10, at + 2, w - 20, 1.5);
    }
    text(ctx, sec.title, 0, at + 18, 13, '#2c4f9e');
    let sub = sec.sub;
    ctx.font = `700 9px ${FONT}`;
    while (sub.length > 4 && ctx.measureText(sub).width > w - 16) sub = sub.slice(0, -2) + '…';
    text(ctx, sub, 0, at + 31, 9, '#7a8bb3');
    if (!sec.rows.length) text(ctx, 'no one yet', 0, at + 50, 11, '#7a8bb3');
    sec.rows.forEach(([name, n], i) => {
      const ry = at + 50 + i * 17;
      ctx.font = `700 11px ${FONT}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillStyle = i === 0 ? '#d08a1a' : i < 3 ? '#3c6ad0' : '#3a3550';
      let label = `${i + 1}. ${name}`;
      while (label.length > 4 && ctx.measureText(label).width > w - 48) label = label.slice(0, -2) + '…';
      ctx.fillText(label, -w / 2 + 8, ry);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#2f8f5f';
      ctx.fillText(String(n), w / 2 - 8, ry);
    });
    at += tall(sec);
  });
  ctx.restore();
}
