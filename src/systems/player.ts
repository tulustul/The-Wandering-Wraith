import { Engine } from "../engine";
import { Vector2 } from "../vector";
import { GROUND_MASK, PLAYER_MASK } from "../colisions-masks";
import { DynamicBody } from "./physics/physics.interface";
import { CircleShape } from "./physics/shapes";
import { SinusAnimation } from "../animations";

interface AgentAnimation {
  headOffset: number;
  lArmRot: number;
  rArmRot: number;
  lLegRot: number;
  rLegRot: number;
  eyesScale: number;
  eyesOffset: number;
}

export class Player {
  STEPS_RATE = 270;

  ACCELERATION = 3.7;

  JUMP_ACCELERATION = 0.3;

  currentStep = 0;

  lastStepTime = 0;

  lastBall = 0;

  lastEyeLook = 0;

  maxSpeed = 4;

  body_: DynamicBody;

  direction_: "l" | "r" = "r";

  lastJumpTime = 0;

  dashed = false;

  stretch = new Vector2(1, 1);

  isRunning = false;

  animation_: AgentAnimation = {
    headOffset: 0,
    lArmRot: 0,
    rArmRot: 0,
    lLegRot: 0,
    rLegRot: 0,
    eyesScale: 1,
    eyesOffset: 0,
  };

  constructor(public engine: Engine, pos: Vector2) {
    this.body_ = engine.physics.addDynamic({
      shape_: new CircleShape(pos, 10),
      parent: this,
      receiveMask: PLAYER_MASK,
      hitMask: GROUND_MASK,
      pos: pos,
      friction: 0.7,
      vel: new Vector2(0, 0),
    });
  }

  moveToDirection(direction: number) {
    this.isRunning = !!this.body_.contactPoints.length;
    let accScalar = this.ACCELERATION;
    if (!this.body_.contactPoints.length) {
      accScalar = this.JUMP_ACCELERATION;
    }
    const acc = new Vector2(0, accScalar).rotate_(direction);
    this.updateVelocity(acc);
    if (direction < Math.PI) {
      this.direction_ = "r";
    } else {
      this.direction_ = "l";
    }
  }

  jump() {
    for (const point of this.body_.contactPoints) {
      if (point.y - this.body_.pos.y > 5) {
        this.body_.vel.y = -6;
        this.lastJumpTime = this.engine.time_;
        this.dashed = false;
        return;
      }
    }
    if (!this.dashed && this.engine.time_ - this.lastJumpTime > 300) {
      this.body_.vel.y = -6;
      this.dashed = true;
    }
  }

  blink() {
    this.engine.animations.animate_(
      new SinusAnimation(Math.PI / 2, Math.PI * 2.5, 200),
      value => (this.animation_.eyesScale = (value + 1) / 2),
    );
  }

  private updateVelocity(acc: Vector2) {
    if (Math.abs(this.body_.vel.x + acc.x) < this.maxSpeed) {
      this.body_.vel.x += acc.x;
    }
    this.body_.vel.y += acc.y;
  }

  updateControls() {
    this.isRunning = false;
    const control = this.engine.control_;
    if (control.keys_.get("Space")) {
      this.jump();
    }
    if (control.keys_.get("ArrowLeft")) {
      this.moveToDirection(Math.PI * 0.5);
    }
    if (control.keys_.get("ArrowRight")) {
      this.moveToDirection(Math.PI * 1.5);
    }
  }

  updateAnimation() {
    this.animation_.lLegRot = 0;
    this.animation_.rLegRot = 0;
    this.animation_.lArmRot = -1;
    this.animation_.rArmRot = 1;
    if (this.isRunning) {
      this.animation_.lLegRot = Math.sin(this.engine.time_ / 30) / 2;
      this.animation_.rLegRot = Math.cos(this.engine.time_ / 30) / 2;
      this.animation_.lArmRot = 0.5;
    }

    if (this.engine.time_ - this.lastEyeLook > 100) {
      this.lastEyeLook = this.engine.time_;
      if (this.body_.vel.y > 1) {
        this.animation_.eyesOffset = 4;
      } else if (this.body_.vel.y < -1) {
        this.animation_.eyesOffset = -6;
      } else {
        this.animation_.eyesOffset = 0;
      }
    }

    if (!this.body_.contactPoints.length && Math.abs(this.body_.vel.y) > 0.3) {
      this.animation_.lArmRot = -1.5 + Math.sin(this.engine.time_ / 50) / 3;
      this.animation_.rArmRot = 1.5 + Math.cos(this.engine.time_ / 50) / 3;
      this.animation_.lLegRot = 0.3;
      this.animation_.rLegRot = -0.3;
    } else {
      this.animation_.lArmRot = -0.7 + Math.sin(this.engine.time_ / 200) / 10;
      this.animation_.rArmRot = 0.7 - Math.sin(this.engine.time_ / 200) / 10;
    }

    this.animation_.headOffset = Math.sin(this.engine.time_ / 200) - 2;

    if (Math.random() > 0.99) {
      this.blink();
    }
  }

  makeStep() {
    if (this.engine.time_ - this.lastStepTime > this.STEPS_RATE) {
      if (this.body_.vel.length_() > 0.5) {
        this.lastStepTime = this.engine.time_;
        this.currentStep = (this.currentStep + 1) % 2;
        // this.engine.sound.play("collectA");
      }
    }
  }

  update_() {
    this.updateControls();
    this.updateAnimation();
  }
}
