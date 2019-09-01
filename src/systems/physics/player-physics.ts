import { PhysicsSystem } from "./physics";
import { Player } from "../player";
import { getCircleCells, checkCircleLineColision } from "./shapes";
import { StaticBody } from "./physics.interface";
import { Vector2 } from "../../vector";
import { assets } from "../../assets";
import { playSound } from "../../sound";

export class PlayerPhysics {
  direction_: "l" | "r" = "r";

  maxSpeed = 4;

  lastJumpTime = 0;

  dashed = false;

  // currentSegment: StaticBody | null;

  constructor(private physics: PhysicsSystem, private player: Player) {}

  get body_() {
    return this.player.body_;
  }

  update_() {
    if (this.player.isDead) {
      return;
    }
    this.body_.oldPos = this.body_.pos.copy();
    if (this.haveGround) {
      this.body_.pos.x += this.body_.vel.x;
      const rayResult = this.physics.castRay(
        new Vector2(this.body_.pos.x, this.body_.pos.y - 20),
        new Vector2(this.body_.pos.x, this.body_.pos.y + 60),
      );
      if (rayResult) {
        this.body_.pos.y = rayResult.y - this.body_.radius + 1;
      }
      // let newY = this.getSegmentValueAt(this.body_.pos.x);
      // if (newY === null) {
      //   this.currentSegment = this.findNewSegment();
      //   newY = this.getSegmentValueAt(this.body_.pos.x);
      // }
      // if (newY !== null) {
      //   this.body_.pos.y = newY;
      // }
      if (!this.player.isRunning) {
        this.body_.vel.x *= 0.7;
      }
      this.body_.vel.y = 0;
    }

    if (this.body_.contactPoints.length === 0) {
      this.body_.vel.y += 0.3;
      this.body_.vel.x *= 0.94;
      this.body_.pos.add_(this.body_.vel);
    }
    // this.currentSegment = this.findNewSegment();
    /*
      Limit the speed to the diameter of circle.
      This way we avoid tunelling through terrain in high speeds.
      **/
    const radius = this.body_.radius;
    const speed = Math.min(this.body_.vel.length_(), radius);
    this.body_.vel = this.body_.vel.normalize_().mul(speed);
  }

  // private getSegmentValueAt(x: number): number | null {
  //   if (!this.currentSegment) {
  //     return null;
  //   }
  //   const [s, e] = [this.currentSegment.start_, this.currentSegment.end_];
  //   if (x < s.x || x > e.x) {
  //     return null;
  //   }
  //   const a = (s.y - e.y) / (s.x - e.x);
  //   const b = s.y - a * s.x;
  //   return a * x + b - this.player.body_.radius;
  // }

  // private findNewSegment() {
  //   for (const cell of getCircleCells(this.body_.pos, this.body_.radius)) {
  //     if (this.physics.staticGrid.has(cell)) {
  //       for (const receiver of this.physics.staticGrid.get(cell)!) {
  //         const isColision = checkCircleLineColision(
  //           this.body_.pos,
  //           this.body_.radius,
  //           receiver.start_,
  //           receiver.end_,
  //           this.body_.vel,
  //         );

  //         if (
  //           isColision &&
  //           this.body_.pos.x >= receiver.start_.x &&
  //           this.body_.pos.x <= receiver.end_.x
  //         ) {
  //           return receiver;
  //         }
  //       }
  //     }
  //   }
  //   return null;
  // }

  moveToDirection(direction: number) {
    this.player.isRunning = this.body_.contactPoints.length > 0;
    let accScalar = 0.3;
    if (this.body_.contactPoints.length > 0) {
      accScalar = 0.6;
    }
    const acc = new Vector2(0, accScalar).rotate_(direction);
    this.updateVelocity(acc);
    if (direction < Math.PI) {
      this.direction_ = "r";
    } else {
      this.direction_ = "l";
    }
    this.player.makeStep();
  }

  private updateVelocity(acc: Vector2) {
    if (Math.abs(this.body_.vel.x + acc.x) < this.maxSpeed) {
      this.body_.vel.x += acc.x;
    }
    this.body_.vel.y += acc.y;
  }

  jump() {
    if (
      this.player.engine.time_ - this.lastJumpTime > 200 &&
      this.haveGround
    ) {
      // this.currentSegment = null;
      this.body_.vel.y = -5;
      this.body_.pos.y -= 5;
      this.body_.contactPoints = [];
      this.lastJumpTime = this.player.engine.time_;
      this.dashed = false;
      playSound(assets.sounds.jump);
      return;
    }
    if (!this.dashed && this.player.engine.time_ - this.lastJumpTime > 300) {
      this.body_.vel.y = -6;
      this.dashed = true;
      playSound(assets.sounds.dash);
    }
  }

  get haveGround() {
    for (const point of this.body_.contactPoints) {
      if (point.y - this.body_.pos.y > 4) {
        return true;
      }
    }
    return false;
  }
}
