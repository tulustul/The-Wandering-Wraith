import { Vector2 } from "./vector";
import { Engine } from "./engine";
import { lerp } from "./utils";

export class Camera {
  pos = new Vector2();

  constructor(private engine: Engine) {}

  update_() {
    const w = this.engine.canvas_.width;
    const h = this.engine.canvas_.height;

    const target = this.engine.player.body_.pos;

    const [maxX, maxY, x, y] = [
      this.engine.level_.size_.x - w,
      this.engine.level_.size_.y - h,
      target.x - w / 2,
      this.moveAtAxis(this.pos.y, target.y - h / 1.7, -5, 50),
    ];
    this.pos.x = Math.min(Math.max(0, x), maxX);
    this.pos.y = Math.min(Math.max(0, y), maxY);
  }

  private moveAtAxis(
    current: number,
    target: number,
    lowerLimit: number,
    upperLimit: number,
  ) {
    const d = current - target;
    if (d < lowerLimit || d > upperLimit) {
      return lerp(
        current,
        target + (d < lowerLimit ? lowerLimit : upperLimit),
        0.12,
      );
    }
    return current;
  }
}
