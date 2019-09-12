import { PhysicsSystem } from "./physics";
import { Player } from "../player";
import { Vector2 } from "../vector";
import { Pickable } from "../level.interface";

import "../ZzFX.micro";

export declare const zzfx: any;

export const enum MotionMode {
  running,
  falling,
  climbing,
  bubbling,
}

export class PlayerPhysics {
  direction_: "l" | "r" = "r";

  maxSpeed = 3.5;

  climbingThreshold = 4;

  lastJumpTime = 0;

  fallingTime = 0;

  dashed = false;

  climbContact: number | null;

  mode_: MotionMode = MotionMode.running;

  bubble: Pickable | null;

  bubbleTime = 0;

  lastBubbleFlySoundTime = 0;

  gravity = 0.25;

  antigravityTime = 0;

  hitTime = 0;

  constructor(private physics: PhysicsSystem, private player: Player) {}

  update_() {
    if (this.player.isDead) {
      return;
    }

    const body_ = this.player.body_;

    this.updateMode();

    if (
      this.antigravityTime &&
      this.player.engine.time_ - this.antigravityTime > 3500
    ) {
      this.gravity = 0.25;
      this.player.body_.pos.y += 20;
      this.antigravityTime = 0;
    }

    body_.oldPos = body_.pos.copy();
    if (this.mode_ === MotionMode.running) {
      body_.pos.x += body_.vel.x;
      const rayResult = this.physics.castRay(
        new Vector2(
          body_.pos.x,
          body_.pos.y - 20 * (this.gravity > 0 ? 1 : -1),
        ),
        new Vector2(
          body_.pos.x,
          body_.pos.y + 20 * (this.gravity > 0 ? 1 : -1),
        ),
      );
      if (rayResult) {
        body_.pos.y = rayResult.y - body_.radius * (this.gravity > 0 ? 1 : -1);
      }
      if (
        !this.player.isRunning ||
        (this.player.body_.vel.x > 0 ? "r" : "l") !== this.direction_
      ) {
        body_.vel.x *= 0.5;
      }
      body_.vel.y = 0;
    }

    if (this.mode_ === MotionMode.falling) {
      body_.vel.y += this.gravity;
      body_.vel.x *= 0.94;
      body_.pos.add_(body_.vel);

      this.player.targetScale = 1 + Math.abs(body_.vel.y / 17);
    }

    if (this.mode_ === MotionMode.climbing) {
      body_.vel.zero();
    }

    if (this.mode_ === MotionMode.bubbling) {
      body_.pos.add_(body_.vel);

      zzfx(
        0.06,
        0.1,
        Math.sin(body_.vel.y / 5) * 200 + 100,
        0.15,
        0.51,
        5,
        2,
        0,
        0.09,
      );

      this.player.engine.particles.emit({
        count: 3,
        direction_: new Vector2(3, 0),
        lifetime: 120,
        pos: body_.pos,
      });
    }

    /*
      Limit the speed to the diameter of circle.
      This way we avoid tunelling through terrain in high speeds.
    **/
    const speed = Math.min(body_.vel.length_(), body_.radius);
    body_.vel = body_.vel.normalize_().mul(speed);

    if (this.mode_ !== MotionMode.climbing) {
      const colisions = Array.from(this.physics.checkHitterColisions(body_));

      if (colisions.length) {
        if (
          this.mode_ === MotionMode.falling &&
          this.player.engine.time_ - this.fallingTime > 150
        ) {
          if (this.player.engine.time_ - this.hitTime > 150) {
            zzfx(1, 0.1, 304, 0.2, 0.01, 0, 0.3, 0, 0.5);
          }
          this.hitTime = this.player.engine.time_;

          this.player.targetScale = Math.min(
            1,
            1 / Math.abs(body_.vel.y) / 8 + 0.7,
          );
        }
        if (this.mode_ === MotionMode.bubbling) {
          this.leaveBubbling();
        }
      }

      for (const colision of colisions) {
        body_.contactPoints.push(colision.point);

        if (colision.receiver_.isDeadly) {
          this.player.die();
        }

        const dy = colision.point.y - body_.pos.y;
        if (
          this.gravity > 0
            ? dy <= this.climbingThreshold
            : dy >= -this.climbingThreshold
        ) {
          body_.pos.sub_(colision.penetration);
        }

        if (this.mode_ === MotionMode.falling) {
          const d = body_.pos.copy().sub_(body_.oldPos);
          const v = body_.vel;

          body_.vel.x = Math.abs(v.x) < Math.abs(d.x) ? v.x : d.x;
          body_.vel.y = Math.abs(v.y) < Math.abs(d.y) ? v.y : d.y;
        }
      }
    }
    body_.pos.x = Math.max(0, body_.pos.x);

    if (body_.pos.y > this.player.engine.level_.size_.y) {
      this.player.die();
    }
  }

  private updateMode() {
    this.climbContact = null;

    if (this.mode_ === MotionMode.bubbling) {
      if (this.player.engine.time_ - this.bubbleTime > 1700) {
        this.leaveBubbling();
      } else {
        return;
      }
    }

    for (const point of this.player.body_.contactPoints) {
      const dy =
        (point.y - this.player.body_.pos.y) * (this.gravity > 0 ? 1 : -1);
      const dx = point.x - this.player.body_.pos.x;
      if (dy > this.climbingThreshold) {
        this.mode_ = MotionMode.running;
        return;
      } else if (Math.abs(dy) <= this.climbingThreshold) {
        this.climbContact = dx;
      }
    }

    if (this.climbContact) {
      const keys_ = this.player.engine.control_.keys_;
      if (
        (this.climbContact < 0 && keys_.get("ArrowLeft")) ||
        (this.climbContact > 0 && keys_.get("ArrowRight"))
      ) {
        if (this.mode_ !== MotionMode.climbing) {
          this.lastJumpTime = this.player.engine.time_;
        }
        this.mode_ = MotionMode.climbing;
        this.dashed = false;
        return;
      }
    }

    if (this.mode_ !== MotionMode.falling) {
      this.fallingTime = this.player.engine.time_;
      this.mode_ = MotionMode.falling;
      this.dashed = false;
    }
  }

  moveToDirection(direction: number) {
    if (this.mode_ === MotionMode.bubbling) {
      this.player.body_.vel.rotate_(direction / 13);
      return;
    }

    this.player.isRunning = this.mode_ === MotionMode.running;
    let accScalar = 0.3;
    if (this.mode_ === MotionMode.running) {
      accScalar = 0.2;
    }

    const acc = direction * accScalar;

    if (Math.abs(this.player.body_.vel.x + acc) < this.maxSpeed) {
      this.player.body_.vel.x += acc;
    }

    this.direction_ = direction < 0 ? "l" : "r";
    this.player.makeStep();
  }

  jump() {
    if (
      this.mode_ === MotionMode.running ||
      this.mode_ === MotionMode.climbing ||
      // be more forgiving to players by allowing them to jump after slipping
      // on platforms/slopes
      (this.mode_ === MotionMode.falling &&
        this.player.engine.time_ - this.fallingTime < 150)
    ) {
      if (this.player.engine.time_ - this.lastJumpTime > 151) {
        this.player.body_.vel.y = 5;
        if (this.mode_ === MotionMode.climbing) {
          this.player.body_.vel.x = -this.climbContact! / 3;
          this.player.body_.vel.y = 5;
        }
        this.player.body_.vel.y *= this.gravity > 0 ? -1 : 1;
        this.player.body_.contactPoints = [];
        this.lastJumpTime = this.player.engine.time_;
        this.dashed = false;
        zzfx(0.6, 1, 150, 0.15, 0.47, 4.2, 1.4, 1, 0.25);
        return;
      }
    }

    if (
      this.mode_ === MotionMode.falling &&
      !this.dashed &&
      this.player.engine.time_ - this.lastJumpTime > 300
    ) {
      this.player.body_.vel.y = 5 * (this.gravity > 0 ? -1 : 1);
      this.dashed = true;
      zzfx(0.6, 1, 200, 0.1, 0.47, 4.2, 1.4, 1, 0.15);
    }

    if (
      this.mode_ === MotionMode.bubbling &&
      this.player.engine.time_ - this.lastJumpTime > 150
    ) {
      this.leaveBubbling();
    }
  }

  enterBubble(bubble: Pickable) {
    if (this.mode_ === MotionMode.bubbling) {
      this.leaveBubbling();
    } else {
      this.player.body_.vel = new Vector2(0, -5);
      this.player.body_.pos.x = bubble.pos.x;
      this.player.body_.pos.y = bubble.pos.y;
    }
    this.mode_ = MotionMode.bubbling;
    this.bubble = bubble;
    this.bubbleTime = this.player.engine.time_;
    this.lastJumpTime = this.player.engine.time_;
  }

  leaveBubbling() {
    this.mode_ = MotionMode.falling;
    this.dashed = false;
    this.lastJumpTime = this.player.engine.time_;
    this.player.engine.particles.emit({
      count: 250,
      direction_: new Vector2(8, 0),
      lifetime: 80,
      pos: this.player.body_.pos
        .copy()
        .add_(this.player.body_.vel.copy().mul(9)),
    });
    const bubble = this.bubble!;
    this.bubble = null;
    zzfx(1, 0.1, 428, 0.2, 0.31, 0, 0.2, 5.1, 0.42);
    setTimeout(() => (bubble.collected = false), 1000);
  }

  enterAntigravity() {
    this.gravity = -0.25;
    this.dashed = false;
    this.antigravityTime = this.player.engine.time_;
  }
}
