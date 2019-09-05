import { Vector2 } from "./vector";
import { Engine } from "./engine";
import { MotionMode } from "./physics/player-physics";

export class Camera {
  target: Vector2;

  pos = new Vector2();

  constructor(private engine: Engine) {}

  update_() {
    const w = this.engine.canvas_.width;
    const h = this.engine.canvas_.height;

    const target = this.engine.player.body_.pos;

    const [maxX, maxY, x, y] = [
      this.engine.level_.size_.x - w,
      this.engine.level_.size_.y - h,
      this.moveAtAxis(this.pos.x, target.x - w / 2, -30, 30),
      this.moveAtAxis(this.pos.y, target.y - h / 1.7, -5, 90),
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
      return this.lerp(
        current,
        target + (d < lowerLimit ? lowerLimit : upperLimit),
        0.12,
      );
    }
    return current;
  }

  private lerp(p1: number, p2: number, t: number) {
    return p1 + t * (p2 - p1);
  }
}
