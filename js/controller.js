import { SkillSlots } from "./skillslots.js";

export class InputController {
  constructor() {
    this.keys = {};
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
    return Boolean(this.keys[code]);
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