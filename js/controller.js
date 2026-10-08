import { SkillSlots } from "./skillslots.js";

export class InputController {
  constructor() {
    this.keys = {};
    this.padParty = { previous: false, next: false, interact: false };
    this.setupListeners();
  }

  setupListeners() {
    SkillSlots.onChange(() => this.clearAll());   // no skill stays held across a rearrangement
    // J/K/L follow the skill slots on the bottom tray (drag and drop), so a key reads as its slot's ability
    window.addEventListener("keydown", (e) => {
      this.keys[SkillSlots.logical(e.code)] = true;
      if (e.code === "Space") e.preventDefault();
    });

    window.addEventListener("keyup", (e) => {
      this.keys[SkillSlots.logical(e.code)] = false;
    });

    window.addEventListener("blur", () => {
      this.clearAll();
    });
  }

  isDown(code) {
    if (this.keys[code]) return true;
    const pad = this.gamepad();
    if (!pad) return false;
    const button = (i) => Boolean(pad.buttons[i]?.pressed || pad.buttons[i]?.value > 0.55);
    const x = pad.axes[0] || 0, y = pad.axes[1] || 0;
    if (code === "KeyW" || code === "ArrowUp") return y < -0.28 || button(12);
    if (code === "KeyS" || code === "ArrowDown") return y > 0.28 || button(13);
    if (code === "KeyA" || code === "ArrowLeft") return x < -0.28 || button(14);
    if (code === "KeyD" || code === "ArrowRight") return x > 0.28 || button(15);
    if (code === "KeyJ") return button(0);
    if (code === "KeyK") return button(2);
    if (code === "KeyL") return button(3);
    if (code === "Space") return button(7);
    return false;
  }

  gamepad() {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    return pads ? Array.from(pads).find((pad) => pad?.connected) || null : null;
  }

  consumePartySwitch() {
    const pad = this.gamepad();
    const down = (i) => Boolean(pad?.buttons[i]?.pressed || pad?.buttons[i]?.value > 0.55);
    const previous = down(4), next = down(5);
    const direction = next && !this.padParty.next ? 1 : previous && !this.padParty.previous ? -1 : 0;
    this.padParty = { ...this.padParty, previous, next };
    return direction;
  }

  consumeInteract() {
    const pad = this.gamepad();
    const pressed = Boolean(pad?.buttons[1]?.pressed || pad?.buttons[1]?.value > 0.55);
    const trigger = pressed && !this.padParty.interact;
    this.padParty = { ...this.padParty, interact: pressed };
    return trigger;
  }

  clearAll() {
    for (const k in this.keys) {
      this.keys[k] = false;
    }
  }

  getMovementVector() {
    let mx = 0;
    let my = 0;

    if (this.isDown("KeyW") || this.isDown("ArrowUp"))    my -= 1;
    if (this.isDown("KeyS") || this.isDown("ArrowDown"))  my += 1;
    if (this.isDown("KeyA") || this.isDown("ArrowLeft"))  mx -= 1;
    if (this.isDown("KeyD") || this.isDown("ArrowRight")) mx += 1;

    return { mx, my, isMoving: mx !== 0 || my !== 0 };
  }

  isSprinting() {
    return this.isDown("Space");
  }

  getActionTriggers() {
    return {
      attack: this.isDown("KeyJ"),
      skill: this.isDown("KeyK")
    };
  }
}
