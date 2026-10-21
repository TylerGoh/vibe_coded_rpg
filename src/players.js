// Docs: docs/places/houses.md
// Who's online (P, or the Players button): everyone on the server, where they are, and an Invite button
// to have them over to your house, and a Message button that opens a private chat with them (src/chat.js). Inviting works from any town (TOWNS: Slimeville,
// Icefang Hamlet…) or your own house, and only for slimes standing in a town (the server checks too). Also the card that pops up when someone
// invites you: Go over takes you straight into their house (server/house.js). And an Accuse button: accuse them of
// botting, for fun (tap twice: it asks first; docs/social/accuse.md, server/accuse.js).
import { paletteFor } from './slime.js';
import { audio } from './audio.js';
import { VILLAGE, roomDef, isHouse, townOf } from './shared/sim.js';

export class Players {
  constructor({ net, houses, send, self, onOpenChange }) {
    this.net = net;
    this.houses = houses;
    this.send = send;
    this.self = self; // () → { name, hue, lvl }: you
    this.me = () => self().name;
    this.onOpenChange = onOpenChange;
    this.el = document.getElementById('players');
    this.list = document.getElementById('players-list');
    this.help = document.getElementById('players-help');
    this.count = document.getElementById('players-n');
    document.getElementById('players-close').onclick = () => this.close();
    this.card = document.getElementById('invite');
    this.cardText = document.getElementById('invite-text');
    this.goButton = document.getElementById('invite-go');
    this.goButton.onclick = () => this.answer(true);
    document.getElementById('invite-no').onclick = () => this.answer(false);
    this.invites = []; // [{ name, until }] newest last
    this.timer = null;
    this.sent = new Map(); // player id → when we invited them (the button says Invited for a bit)
    this.sure = new Map(); // player id → when Accuse was first tapped (it says Sure? for a bit)
    this.onMessage = null; // (name) → open a private chat with them (main.js)
  }

  get isOpen() {
    return !this.el.hidden;
  }
  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }
  open() {
    this.el.hidden = false;
    this.render();
    clearInterval(this.timer);
    this.timer = setInterval(() => this.render(), 500); // people move around while it's open
    this.onOpenChange(true);
  }
  close() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    clearInterval(this.timer);
    this.onOpenChange(false);
  }

  // The room a player is in, from the newest snapshot (ours from prediction)
  roomOf(id) {
    if (id === this.net.id) return this.net.me.room;
    return this.net.snaps.at(-1)?.players.get(id)?.room;
  }
  // "in the village", "at home", "at tyler's house", "in the Wildwood"…
  place(id, room) {
    if (room === undefined) return '';
    if (isHouse(room)) {
      const home = id === this.net.id ? this.net.me.home : this.net.roster.get(id)?.home;
      if (room === home) return 'at home';
      const owner = this.houses.ownerOf(room) ?? [...this.net.roster.values()].find((r) => r.home === room)?.name ?? (room === this.net.me.home ? this.me() : null);
      return owner ? `at ${owner === this.me() ? 'your' : `${owner}'s`} house` : 'at a friend\'s house';
    }
    if (room === VILLAGE) return 'in the village';
    return `in ${roomDef(room)?.name ?? 'somewhere'}`;
  }

  render() {
    const myRoom = this.net.me.room, myHome = this.net.me.home;
    const canInvite = townOf(myRoom) >= 0 || (isHouse(myRoom) && myRoom === myHome);
    this.help.textContent = canInvite
      ? 'Invite slimes who are in a town over to your house.'
      : 'Go to a town (or your house) to invite slimes over. They need to be in a town too.';
    const rows = [[this.net.id, this.self()], ...[...this.net.roster].filter(([id]) => id !== this.net.id).sort((a, b) => a[1].name.localeCompare(b[1].name))];
    this.count.textContent = `· ${rows.length}`;
    this.list.replaceChildren();
    for (const [id, r] of rows) {
      const isMe = id === this.net.id, room = this.roomOf(id);
      const row = document.createElement('div');
      row.className = 'pl-row' + (isMe ? ' me' : '');
      const dot = document.createElement('span');
      dot.className = 'pl-dot';
      const pal = paletteFor(r.hue ?? 148);
      dot.style.background = `linear-gradient(${pal.top}, ${pal.bottom})`;
      dot.style.borderColor = pal.line;
      const name = document.createElement('b');
      name.textContent = isMe ? `${r.name} (you)` : r.name;
      const lvl = r.lvl;
      const info = document.createElement('span');
      info.className = 'pl-where';
      info.textContent = `${lvl ? `Lv ${lvl} · ` : ''}${this.place(id, room)}`;
      row.append(dot, name, info);
      if (!isMe) {
        const msg = document.createElement('button');
        msg.type = 'button';
        msg.className = 'pl-msg';
        msg.textContent = 'Message';
        msg.onclick = () => this.onMessage?.(r.name);
        row.append(msg);
        const b = document.createElement('button');
        b.type = 'button';
        const here = isHouse(myRoom) && room === myRoom, sent = performance.now() - (this.sent.get(id) ?? -1e9) < 4000;
        b.textContent = here ? 'Visiting you' : sent ? 'Invited' : 'Invite';
        b.disabled = here || sent || !canInvite || townOf(room) < 0;
        if (!here && townOf(room) < 0) b.title = 'They need to be in a town';
        b.onclick = () => {
          this.send({ t: 'invite', to: id });
          this.sent.set(id, performance.now());
          this.render();
          audio.sfx('coin', { vol: 0.5 });
        };
        row.append(b);
        const acc = document.createElement('button');
        acc.type = 'button';
        acc.className = 'pl-accuse';
        const asking = performance.now() - (this.sure.get(id) ?? -1e9) < 3000;
        acc.textContent = asking ? 'Sure?' : 'Accuse';
        acc.title = 'Accuse them of botting: if they don\'t deny it in 5 min, you get 20% of their EXP for a while';
        acc.onclick = () => {
          if (!asking) this.sure.set(id, performance.now());
          else {
            this.sure.delete(id);
            this.send({ t: 'accuse', to: id });
            audio.sfx('bossWarn', { vol: 0.4 });
          }
          this.render();
        };
        row.append(acc);
      }
      this.list.append(row);
    }
  }

  // ← {t:'invite', from, name, ms}
  receive(m) {
    this.invites = this.invites.filter((i) => i.name !== m.name);
    this.invites.push({ name: m.name, until: performance.now() + m.ms });
    audio.sfx('skillUp', { vol: 0.7 });
    this.showCard();
  }
  answer(yes) {
    const inv = this.invites.pop();
    if (!inv) return;
    this.send({ t: 'visit', host: inv.name, no: !yes || undefined });
    this.showCard();
  }
  // the newest open invite, if any (called every frame: invites expire, and you might walk into a building)
  showCard() {
    const now = performance.now();
    this.invites = this.invites.filter((i) => i.until > now);
    const inv = this.invites.at(-1);
    this.card.hidden = !inv;
    if (!inv) return;
    const inVillage = townOf(this.net.me.room) >= 0; // (any town)
    const text = `${inv.name} invited you over to their house!`;
    if (this.cardText.textContent !== text) this.cardText.textContent = text;
    this.goButton.disabled = !inVillage;
    const label = inVillage ? 'Go over' : 'Go back to a town to go';
    if (this.goButton.textContent !== label) this.goButton.textContent = label;
  }
}
