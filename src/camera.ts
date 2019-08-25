import { Vector2 } from "./vector";
import { Engine } from "./engine";

export class Camera {
  target: Vector2;

  pos = new Vector2();

  constructor(private engine: Engine) {}

  bindToTarget(target: Vector2) {
    this.target = target;
  }

  update() {
    this.pos.x = -this.target.x + this.engine.canvas.width / 2;
    this.pos.y = -this.target.y + this.engine.canvas.height / 1.3;
  }
}
