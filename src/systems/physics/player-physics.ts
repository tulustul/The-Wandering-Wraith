import { PhysicsSystem } from "./physics";
import { Player } from "../player";
import { getCircleCells, checkCircleLineColision } from "./shapes";
import { StaticBody } from "./physics.interface";
import { Vector2 } from "../../vector";
import { assets } from "../../assets";
import { playSound } from "../../sound";
import { Pickable } from "../../level.interface";

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

  maxSpeed = 3.5;

  climbingThreshold = 4;

  lastJumpTime = 0;

  fallingTime = 0;

  dashed = false;

  climbContact: number | null;

  mode: MotionMode = MotionMode.running;

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

    this.updateMode();

    this.body_.oldPos = this.body_.pos.copy();
    if (this.mode === MotionMode.running) {
      this.body_.pos.x += this.body_.vel.x;
      const rayResult = this.physics.castRay(
        new Vector2(this.body_.pos.x, this.body_.pos.y - 20),
        new Vector2(this.body_.pos.x, this.body_.pos.y + 20),
      );
      if (rayResult) {
        this.body_.pos.y = rayResult.y - this.body_.radius + 1;
      }
      if (!this.player.isRunning) {
        this.body_.vel.x *= 0.7;
      }
      this.body_.vel.y = 0;
    }

    if (this.mode === MotionMode.falling) {
      this.body_.vel.y += 0.3;
      this.body_.vel.x *= 0.94;
      this.body_.pos.add_(this.body_.vel);
    }

    if (this.mode === MotionMode.climbing) {
      this.body_.vel.zero();
    }

    if (this.mode === MotionMode.bubbling) {
      this.body_.pos.add_(this.body_.vel);

      playSound([
        [
          0.06,
          0.1,
          // 0,
          Math.sin(this.body_.vel.y / 5) * 200 + 100,
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
        direction: new Vector2(3, 0),
        lifetime: 50,
        lifetimeSpread: 10,
        pos: this.body_.pos,
        speedSpread: 0.6,
        spread: Math.PI,
      });
    }

    /*
      Limit the speed to the diameter of circle.
      This way we avoid tunelling through terrain in high speeds.
    **/
    const radius = this.body_.radius;
    const speed = Math.min(this.body_.vel.length_(), radius);
    this.body_.vel = this.body_.vel.normalize_().mul(speed);

    if (this.mode !== MotionMode.climbing) {
      const colisions = Array.from(
        this.physics.checkHitterColisions(this.body_),
      );

      if (this.mode === MotionMode.bubbling && colisions.length) {
        this.endBubbling();
      }

      for (const colision of colisions) {
        const dy = colision.point.y - this.body_.pos.y;
        if (dy <= this.climbingThreshold) {
          colision.hitter.pos.sub_(colision.penetration);
        }

        if (this.mode === MotionMode.falling) {
          const d = colision.hitter.pos.copy().sub_(colision.hitter.oldPos);
          const v = colision.hitter.vel;

          colision.hitter.vel.x = Math.abs(v.x) < Math.abs(d.x) ? v.x : d.x;
          colision.hitter.vel.y = Math.abs(v.y) < Math.abs(d.y) ? v.y : d.y;
        }
      }
    }
  }

  private updateMode() {
    this.climbContact = null;

    if (this.mode === MotionMode.bubbling) {
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
        this.mode = MotionMode.running;
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
        if (this.mode !== MotionMode.climbing) {
          this.lastJumpTime = this.player.engine.time_;
        }
        this.mode = MotionMode.climbing;
        return;
      }
    }

    if (this.mode !== MotionMode.falling) {
      this.fallingTime = this.player.engine.time_;
      this.mode = MotionMode.falling;
    }
  }

  moveToDirection(direction: number) {
    if (this.mode === MotionMode.bubbling) {
      this.body_.vel.rotate_(direction / 13);
      return;
    }

    this.player.isRunning = this.mode === MotionMode.running;
    let accScalar = 0.3;
    if (this.mode === MotionMode.running) {
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
      this.mode === MotionMode.running ||
      this.mode === MotionMode.climbing ||
      // be more forgiving to players by allowing them to jump after slipping
      // on platforms/slopes
      (this.mode === MotionMode.falling &&
        this.player.engine.time_ - this.fallingTime < 150)
    ) {
      if (this.player.engine.time_ - this.lastJumpTime > 151) {
        this.body_.vel.y = -5;
        if (this.mode === MotionMode.climbing) {
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
      this.mode === MotionMode.falling &&
      !this.dashed &&
      this.player.engine.time_ - this.lastJumpTime > 300
    ) {
      this.body_.vel.y = -6;
      this.dashed = true;
      playSound(assets.sounds.dash);
    }

    if (
      this.mode === MotionMode.bubbling &&
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
    if (this.mode === MotionMode.bubbling) {
      this.endBubbling();
    } else {
      this.body_.vel = new Vector2(0, -7);
    }
    this.mode = MotionMode.bubbling;
    this.bubble = bubble;
    this.bubbleTime = this.player.engine.time_;
    this.body_.pos.x = bubble.pos.x;
    this.body_.pos.y = bubble.pos.y;
    this.lastJumpTime = this.player.engine.time_;
    playSound(assets.sounds.bubbleStart);
  }

  endBubbling() {
    this.mode = MotionMode.falling;
    this.dashed = false;
    this.lastJumpTime = this.player.engine.time_;
    this.player.engine.particles.emit({
      count: 250,
      direction: new Vector2(8, 0),
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
