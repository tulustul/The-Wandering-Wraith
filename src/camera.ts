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
    const w = this.engine.canvas_.width;
    const h = this.engine.canvas_.height;
    const [maxX, maxY, x, y] = [
      this.engine.level_.size_.x - w,
      this.engine.level_.size_.y - h,
      this.target.x - w / 2,
      this.target.y - h / 1.5,
    ];
    this.pos.x = Math.min(Math.max(0, x), maxX);
    this.pos.y = Math.min(Math.max(0, y), maxY);
  }
}
