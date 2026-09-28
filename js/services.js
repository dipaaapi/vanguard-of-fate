import { Sound } from "./audio.js";
import { getLang } from "./i18n.js";

// ==================== NPC SERVICE MENU ====================
// A short list of choices shown after talking to a service NPC (Captain Ronald, the dwarves of the
// Ashfall village, …). Pick with the mouse, 1–9 or ↑/↓ + Enter; Esc closes. The game is paused while open.
//   menu.show(title, [{ label, hint?, disabled?, onPick }])

export class ServiceMenu {
  constructor(root) {
    this.el = root;
    this.open = false;
    this.options = [];
    this.index = 0;
  }

  show(title, options) {
    this.title = title;
    this.options = options;
    this.index = Math.max(0, options.findIndex((o) => !o.disabled));
    this.open = true;
    this.openedAt = performance.now();   // ignore keys briefly, so the Enter that ended the dialogue cannot pick an option
    this.el.classList.add("open");
    this.render();
    if (Sound.playSelectMove) Sound.playSelectMove();
  }

  close() {
    this.open = false;
    this.el.classList.remove("open");
  }

  pick(i) {
    const o = this.options[i];
    if (!o || o.disabled) return;
    this.close();
    if (Sound.playSelectConfirm) Sound.playSelectConfirm();
    o.onPick();
  }

  render() {
    const fil = getLang() === "fil";
    this.el.innerHTML = "";
    const h = document.createElement("h3");
    h.textContent = this.title;
    this.el.appendChild(h);
    this.options.forEach((o, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.tabIndex = -1;
      b.className = "svc-opt" + (i === this.index ? " sel" : "") + (o.disabled ? " off" : "");
      b.innerHTML = `<kbd>${i + 1}</kbd><span></span>`;
      b.lastChild.textContent = o.label;
      if (o.hint) {
        const s = document.createElement("small");
        s.textContent = o.hint;
        b.appendChild(s);
      }
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("mouseenter", () => { if (!o.disabled) { this.index = i; this.highlight(); } });
      b.addEventListener("click", () => this.pick(i));
      this.el.appendChild(b);
    });
    const foot = document.createElement("div");
    foot.className = "svc-foot";
    foot.textContent = fil ? "1–9 / Enter pumili · Esc isara" : "1–9 / Enter choose · Esc close";
    this.el.appendChild(foot);
  }

  highlight() {
    this.el.querySelectorAll(".svc-opt").forEach((b, i) => b.classList.toggle("sel", i === this.index));
  }

  move(dir) {
    const n = this.options.length;
    for (let k = 1; k <= n; k++) {
      const i = (this.index + dir * k + n) % n;
      if (!this.options[i].disabled) { this.index = i; break; }
    }
    this.highlight();
    if (Sound.playSelectMove) Sound.playSelectMove();
  }

  handleInput(e) {
    const c = e.code;
    e.preventDefault();
    if (performance.now() - this.openedAt < 250) return;
    if (c === "Escape") this.close();
    else if (c === "ArrowUp" || c === "KeyW") this.move(-1);
    else if (c === "ArrowDown" || c === "KeyS") this.move(1);
    else if ((c === "Enter" || c === "Space" || c === "KeyE") && !e.repeat) this.pick(this.index);
    else if (/^Digit[1-9]$/.test(c)) this.pick(Number(c.slice(5)) - 1);
  }
}
