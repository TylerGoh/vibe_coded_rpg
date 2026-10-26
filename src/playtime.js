// Docs: docs/ui/playtime.md
// The Play time page of the Esc menu: how long you've played in all, and each of the last days as a bar.
// Asks the server when it opens ({t:'playtime'}, server/rpg.js playtime) and draws the answer.

const DAYS_SHOWN = 14;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 3 h 25 min · 12 min · 0 min
export function hm(ms) {
  const min = Math.floor(ms / 60_000);
  const h = Math.floor(min / 60);
  return h ? `${h} h ${min % 60} min` : `${min} min`;
}
// 'YYYY-MM-DD' → a Date at noon that day (no time zone surprises), and the day before / after
const dateOf = (d) => new Date(`${d}T12:00:00`);
const isoOf = (t) => `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;

export class PlayTime {
  constructor(root) {
    this.root = root;
    this.summary = root.querySelector('#pt-summary');
    this.list = root.querySelector('#pt-days');
  }
  // the page opened: show "loading" until the server answers
  loading() {
    this.summary.textContent = 'Counting…';
    this.list.replaceChildren();
  }
  // m: {played, active, today, days: [[date, played, active]]} (ms; dates in the server's time zone)
  show(m) {
    const byDay = new Map(m.days.map(([d, p, a]) => [d, [p, a]]));
    const [todayP = 0] = byDay.get(m.today) ?? [];
    const week = [];
    for (let i = 0, t = dateOf(m.today); i < DAYS_SHOWN; i++, t.setDate(t.getDate() - 1)) week.push(isoOf(t));
    const last7 = week.slice(0, 7).reduce((n, d) => n + (byDay.get(d)?.[0] ?? 0), 0);
    this.summary.replaceChildren(
      stat('Today', hm(todayP)),
      stat('Last 7 days', hm(last7)),
      stat('All time', hm(m.played), `${hm(m.active)} of it active`),
    );
    const most = Math.max(60_000, ...week.map((d) => byDay.get(d)?.[0] ?? 0));
    this.list.replaceChildren(...week.map((d) => {
      const [p = 0, a = 0] = byDay.get(d) ?? [];
      const t = dateOf(d);
      const row = document.createElement('div');
      row.className = 'pt-day' + (d === m.today ? ' today' : '');
      const label = document.createElement('span');
      label.textContent = d === m.today ? 'Today' : `${WEEKDAYS[t.getDay()]} ${t.getDate()} ${MONTHS[t.getMonth()]}`;
      const bar = document.createElement('span');
      bar.className = 'pt-bar';
      const fill = document.createElement('i');
      fill.style.width = `${(p / most) * 100}%`;
      const act = document.createElement('b');
      act.style.width = `${(a / most) * 100}%`;
      bar.append(fill, act);
      const val = document.createElement('span');
      val.textContent = p ? hm(p) : '–';
      row.append(label, bar, val);
      return row;
    }));
  }
}

function stat(name, value, sub) {
  const box = document.createElement('div');
  box.className = 'pt-stat';
  const v = document.createElement('b');
  v.textContent = value;
  const n = document.createElement('span');
  n.textContent = name;
  box.append(v, n);
  if (sub) {
    const s = document.createElement('small');
    s.textContent = sub;
    box.append(s);
  }
  return box;
}
