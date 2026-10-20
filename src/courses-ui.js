// Docs: docs/social/lecture-tutor.md
// The course menu (press C, or the Courses button) for the lecture hall and the tutoring room. Every
// course shows its vote count; picking one votes for it. The server switches course once a majority of
// the students in the room agree (server/vote.js).
import { COURSES, BREAK } from './shared/courses.js';

export class CourseMenu {
  constructor({ send, onOpenChange }) {
    this.send = send;
    this.onOpenChange = onOpenChange;
    this.el = document.getElementById('courses');
    this.list = document.getElementById('courses-list');
    this.title = document.getElementById('courses-title');
    this.state = { current: null, pending: null, votes: {} };
    this.myVote = null;
    this.withBreak = false;
    document.getElementById('courses-close').onclick = () => this.close();
  }

  get isOpen() {
    return !this.el.hidden;
  }

  // forTutor: the tutoring room's menu, which also offers a break
  open(forTutor) {
    this.withBreak = forTutor;
    this.title.textContent = forTutor ? 'What should Tutor Byte quiz you on?' : 'Vote for the next course';
    this.el.hidden = false;
    this.render();
    this.onOpenChange(true);
  }

  close() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.onOpenChange(false);
  }

  // A {t:'courses'} update for the room you're in
  receive(m) {
    if (m.current !== this.state.current) this.myVote = null; // a new course started: votes were cleared
    this.state = m;
    if (this.isOpen) this.render();
  }

  vote(id) {
    this.myVote = id;
    this.send({ t: 'vote', course: id });
    this.render();
  }

  render() {
    const { current, pending, votes } = this.state;
    this.list.replaceChildren();
    const options = [...COURSES.map((c) => ({ id: c.id, code: c.code, name: c.name, blurb: c.blurb }))];
    if (this.withBreak) options.push({ id: BREAK, code: 'BREAK', name: 'Take a break', blurb: 'Pause the quiz for a bit.' });
    for (const o of options) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'course';
      if (o.id === current) b.classList.add('now');
      if (o.id === this.myVote) b.classList.add('mine');
      const tag = o.id === current ? 'Now' : o.id === pending ? 'Up next' : votes[o.id] ? `${votes[o.id]} vote${votes[o.id] > 1 ? 's' : ''}` : '';
      b.innerHTML = '<span class="code"></span><span class="name"></span><span class="blurb"></span><span class="tag"></span>';
      b.querySelector('.code').textContent = o.code;
      b.querySelector('.name').textContent = o.name;
      b.querySelector('.blurb').textContent = o.blurb;
      b.querySelector('.tag').textContent = tag;
      b.onclick = () => this.vote(o.id);
      this.list.append(b);
    }
  }
}
