export class InputController {
  constructor() {
    this.keys = {};
    this.isMouseDown = false;
    this.mouseWorldX = 0;
    this.mouseWorldY = 0;
    this.mouseScreenX = 0;
    this.mouseScreenY = 0;
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      if (["Space", "ShiftLeft", "ShiftRight", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener("mousedown", (e) => {
      if (e.button === 0) this.isMouseDown = true;
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.isMouseDown = false;
    });

    window.addEventListener("mousemove", (e) => {
      const canvas = document.getElementById("gameCanvas");
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = 426 / rect.width;
      const scaleY = 240 / rect.height;
      this.mouseScreenX = (e.clientX - rect.left) * scaleX;
      this.mouseScreenY = (e.clientY - rect.top) * scaleY;
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
    this.isMouseDown = false;
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
    return this.isDown("ShiftLeft") || this.isDown("ShiftRight");
  }

  isDashing() {
    return this.isDown("Space");
  }

  isAttacking() {
    return this.isMouseDown || this.isDown("KeyJ");
  }

  isSkill1() {
    return this.isDown("Digit1") || this.isDown("KeyK");
  }

  isSkill2() {
    return this.isDown("Digit2") || this.isDown("KeyL");
  }

  isSkill3() {
    return this.isDown("Digit3") || this.isDown("KeyU");
  }
}
