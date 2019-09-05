import { PhysicsSystem } from "./physics";
import { Player } from "../player";
import { Vector2 } from "../vector";
import { assets } from "../assets";
import { playSound } from "../sound";
import { Pickable } from "../level.interface";

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

  constructor(private physics: PhysicsSystem, private player: Player) {}

  get body_() {
    return this.player.body_;
  }

  update_() {
    if (this.player.isDead) {
      return;
    }

    const body_ = this.body_;

    this.updateMode();

    body_.oldPos = body_.pos.copy();
    if (this.mode_ === MotionMode.running) {
      body_.pos.x += body_.vel.x;
      const rayResult = this.physics.castRay(
        new Vector2(body_.pos.x, body_.pos.y - 20),
        new Vector2(body_.pos.x, body_.pos.y + 20),
      );
      if (rayResult) {
        body_.pos.y = rayResult.y - body_.radius + 1;
      }
      if (!this.player.isRunning) {
        body_.vel.x *= 0.7;
      }
      body_.vel.y = 0;
    }

    if (this.mode_ === MotionMode.falling) {
      body_.vel.y += 0.3;
      body_.vel.x *= 0.94;
      body_.pos.add_(body_.vel);
    }

    if (this.mode_ === MotionMode.climbing) {
      body_.vel.zero();
    }

    if (this.mode_ === MotionMode.bubbling) {
      body_.pos.add_(body_.vel);

      playSound([
        [
          0.06,
          0.1,
          Math.sin(body_.vel.y / 5) * 200 + 100,
          0.15,
          0.51,
          5,
          2,
          0,
          0.09,
        ],
      ]);

      this.player.engine.particles.emit({
        count: 2,
        direction_: new Vector2(3, 0),
        lifetime: 50,
        lifetimeSpread: 10,
        pos: body_.pos,
        speedSpread: 0.6,
        spread: Math.PI,
      });
    }

    /*
      Limit the speed to the diameter of circle.
      This way we avoid tunelling through terrain in high speeds.
    **/
    const radius = body_.radius;
    const speed = Math.min(body_.vel.length_(), radius);
    body_.vel = body_.vel.normalize_().mul(speed);

    if (this.mode_ !== MotionMode.climbing) {
      const colisions = Array.from(this.physics.checkHitterColisions(body_));

      if (this.mode_ === MotionMode.bubbling && colisions.length) {
        this.endBubbling();
      }

      for (const colision of colisions) {
        body_.contactPoints.push(colision.point);

        if (colision.receiver_.isDeadly) {
          this.player.die();
        }

        const dy = colision.point.y - body_.pos.y;
        if (dy <= this.climbingThreshold) {
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
  }

  private updateMode() {
    this.climbContact = null;

    if (this.mode_ === MotionMode.bubbling) {
      if (this.player.engine.time_ - this.bubbleTime > 2000) {
        this.endBubbling();
      } else {
        return;
      }
    }

    for (const point of this.body_.contactPoints) {
      const dy = point.y - this.body_.pos.y;
      const dx = point.x - this.body_.pos.x;
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
        return;
      }
    }

    if (this.mode_ !== MotionMode.falling) {
      this.fallingTime = this.player.engine.time_;
      this.mode_ = MotionMode.falling;
    }
  }

  moveToDirection(direction: number) {
    if (this.mode_ === MotionMode.bubbling) {
      this.body_.vel.rotate_(direction / 10);
      return;
    }

    this.player.isRunning = this.mode_ === MotionMode.running;
    let accScalar = 0.3;
    if (this.mode_ === MotionMode.running) {
      accScalar = 0.3;
    }
    const acc = new Vector2(direction * accScalar, 0);
    this.updateVelocity(acc);
    this.direction_ = direction < 0 ? "l" : "r";
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
      this.mode_ === MotionMode.running ||
      this.mode_ === MotionMode.climbing ||
      // be more forgiving to players by allowing them to jump after slipping
      // on platforms/slopes
      (this.mode_ === MotionMode.falling &&
        this.player.engine.time_ - this.fallingTime < 150)
    ) {
      if (this.player.engine.time_ - this.lastJumpTime > 151) {
        this.body_.vel.y = -5;
        if (this.mode_ === MotionMode.climbing) {
          this.body_.vel.x = -this.climbContact! / 3;
          this.body_.vel.y = -6;
        }
        this.body_.contactPoints = [];
        this.lastJumpTime = this.player.engine.time_;
        this.dashed = false;
        playSound(assets.sounds.jump);
        return;
      }
    }

    if (
      this.mode_ === MotionMode.falling &&
      !this.dashed &&
      this.player.engine.time_ - this.lastJumpTime > 300
    ) {
      this.body_.vel.y = -6;
      this.dashed = true;
      playSound(assets.sounds.dash);
    }

    if (
      this.mode_ === MotionMode.bubbling &&
      this.player.engine.time_ - this.lastJumpTime > 150
    ) {
      this.endBubbling();
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

  enterBubble(bubble: Pickable) {
    if (this.mode_ === MotionMode.bubbling) {
      this.endBubbling();
    } else {
      this.body_.vel = new Vector2(0, -7);
      this.body_.pos.x = bubble.pos.x;
      this.body_.pos.y = bubble.pos.y;
    }
    this.mode_ = MotionMode.bubbling;
    this.bubble = bubble;
    this.bubbleTime = this.player.engine.time_;
    this.lastJumpTime = this.player.engine.time_;
  }

  endBubbling() {
    this.mode_ = MotionMode.falling;
    this.dashed = false;
    this.lastJumpTime = this.player.engine.time_;
    this.player.engine.particles.emit({
      count: 250,
      direction_: new Vector2(8, 0),
      lifetime: 150,
      lifetimeSpread: 5,
      pos: this.body_.pos,
      speedSpread: 0.3,
      spread: Math.PI * 2,
    });
    const bubble = this.bubble!;
    this.bubble = null;
    playSound(assets.sounds.bubbleEnd);
    setTimeout(() => (bubble.collected = false), 1000);
  }
}
