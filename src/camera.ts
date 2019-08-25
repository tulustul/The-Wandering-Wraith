import { Vector2 } from "./vector";
import { Engine } from "./engine";

export class Camera {
  target: Vector2;

  pos = new Vector2();

  constructor(private engine: Engine) {}

  bindToTarget(target: Vector2) {
    this.target = target;
  }

  update_() {
    this.pos.x = -this.target.x + this.engine.canvas_.width / 2;
    this.pos.y = -this.target.y + this.engine.canvas_.height / 1.3;
  }
}
