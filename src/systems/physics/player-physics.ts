import { PhysicsSystem } from "./physics";
import { Player } from "../player";
import { getCircleCells, checkCircleLineColision } from "./shapes";
import { StaticBody } from "./physics.interface";
import { Vector2 } from "../../vector";
import { assets } from "../../assets";
import { playSound } from "../../sound";

export enum MotionMode {
  running,
  falling,
  climbing,
  bubbling, // todo
  rocketBubbling, // todo
  jetpacking, // todo
}

export class PlayerPhysics {
  direction_: "l" | "r" = "r";

  maxSpeed = 4;

  lastJumpTime = 0;

  dashed = false;

  climbContact: number | null;

  mode: MotionMode = MotionMode.running;

  // currentSegment: StaticBody | null;

  constructor(private physics: PhysicsSystem, private player: Player) {}

  get body_() {
    return this.player.body_;
  }

  update_() {
    if (this.player.isDead) {
      return;
    }

    this.updateMode();
    console.log(this.mode);

    this.body_.oldPos = this.body_.pos.copy();
    if (this.mode === MotionMode.running) {
      this.body_.pos.x += this.body_.vel.x;
      const rayResult = this.physics.castRay(
        new Vector2(this.body_.pos.x, this.body_.pos.y - 20),
        new Vector2(this.body_.pos.x, this.body_.pos.y + 20),
      );
      if (rayResult) {
        this.body_.pos.y = rayResult.y - this.body_.radius;
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

    // this.currentSegment = this.findNewSegment();

    if (this.mode === MotionMode.falling) {
      this.body_.vel.y += 0.3;
      this.body_.vel.x *= 0.94;
      this.body_.pos.add_(this.body_.vel);
    }

    if (this.mode === MotionMode.climbing) {
      this.body_.vel.zero();
    }

    /*
      Limit the speed to the diameter of circle.
      This way we avoid tunelling through terrain in high speeds.
    **/
    const radius = this.body_.radius;
    const speed = Math.min(this.body_.vel.length_(), radius);
    this.body_.vel = this.body_.vel.normalize_().mul(speed);

    const colisions = Array.from(
      this.physics.checkHitterColisions(this.body_),
    );

    if (this.mode === MotionMode.falling) {
      for (const colision of colisions) {
        colision.hitter.pos.sub_(colision.penetration);

        const d = colision.hitter.pos.copy().sub_(colision.hitter.oldPos);
        const v = colision.hitter.vel;

        colision.hitter.vel.x = Math.abs(v.x) < Math.abs(d.x) ? v.x : d.x;
        colision.hitter.vel.y = Math.abs(v.y) < Math.abs(d.y) ? v.y : d.y;
      }
    }
  }

  private updateMode() {
    this.climbContact = null;

    for (const point of this.body_.contactPoints) {
      const dy = point.y - this.body_.pos.y;
      const dx = point.x - this.body_.pos.x;
      if (dy > 4) {
        this.mode = MotionMode.running;
        return;
      } else if (Math.abs(dy) < 1) {
        this.climbContact = dx;
      }
    }

    if (this.climbContact) {
      const keys_ = this.player.engine.control_.keys_;
      if (
        (this.climbContact < 0 && keys_.get("ArrowLeft")) ||
        (this.climbContact > 0 && keys_.get("ArrowRight"))
      ) {
        this.mode = MotionMode.climbing;
        return;
      }
    }

    this.mode = MotionMode.falling;
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
      this.mode === MotionMode.running ||
      this.mode === MotionMode.climbing
    ) {
      if (this.player.engine.time_ - this.lastJumpTime > 200) {
        // this.currentSegment = null;
        this.body_.vel.y = -5;
        if (this.climbContact) {
          this.body_.vel.x = -this.climbContact / 3;
          this.body_.vel.y = -7;
        }
        // this.body_.pos.y -= 5;
        this.body_.contactPoints = [];
        this.lastJumpTime = this.player.engine.time_;
        this.dashed = false;
        playSound(assets.sounds.jump);
        return;
      }
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
