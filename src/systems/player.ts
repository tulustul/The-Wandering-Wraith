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

  ACCELERATION = 0.7;

  currentStep = 0;

  lastStepTime = 0;

  lastBall = 0;

  lastEyeLook = 0;

  maxSpeed = 4;

  body: DynamicBody;

  direction: "l" | "r" = "r";

  lastJumpTime = 0;

  dashed = false;

  stretch = new Vector2(1, 1);

  isRunning = false;

  animation: AgentAnimation = {
    headOffset: 0,
    lArmRot: 0,
    rArmRot: 0,
    lLegRot: 0,
    rLegRot: 0,
    eyesScale: 1,
    eyesOffset: 0,
  };

  constructor(public engine: Engine, pos: Vector2) {
    this.body = engine.physics.addDynamic({
      shape: new CircleShape(pos, 10),
      parent: this,
      receiveMask: PLAYER_MASK,
      hitMask: GROUND_MASK,
      pos: pos,
      friction: 0.4,
      vel: new Vector2(0, 0),
    });
  }

  moveToDirection(direction: number) {
    this.isRunning = !!this.body.contactPoints.length;
    let accScalar = this.ACCELERATION;
    if (!this.body.contactPoints.length) {
      accScalar /= 3;
    }
    const acc = new Vector2(0, accScalar).rotate(direction);
    this.updateVelocity(acc);
    if (direction < Math.PI) {
      this.direction = "r";
    } else {
      this.direction = "l";
    }
  }

  jump() {
    for (const point of this.body.contactPoints) {
      if (point.y - this.body.pos.y > 5) {
        this.body.vel.y = -6;
        this.lastJumpTime = this.engine.time;
        this.dashed = false;
        return;
      }
    }
    if (!this.dashed && this.engine.time - this.lastJumpTime > 300) {
      this.body.vel.y = -6;
      this.dashed = true;
    }
  }

  blink() {
    this.engine.animations.animate(
      new SinusAnimation(Math.PI / 2, Math.PI * 2.5, 200),
      value => (this.animation.eyesScale = (value + 1) / 2),
    );
  }

  private updateVelocity(acc: Vector2) {
    if (Math.abs(this.body.vel.x + acc.x) < this.maxSpeed) {
      this.body.vel.x += acc.x;
    }
    this.body.vel.y += acc.y;
  }

  updateControls() {
    this.isRunning = false;
    const control = this.engine.control;
    if (control.keys.get("Space")) {
      this.jump();
    }
    if (control.keys.get("ArrowLeft")) {
      this.moveToDirection(Math.PI * 0.5);
    }
    if (control.keys.get("ArrowRight")) {
      this.moveToDirection(Math.PI * 1.5);
    }
  }

  updateAnimation() {
    this.animation.lLegRot = 0;
    this.animation.rLegRot = 0;
    this.animation.lArmRot = -1;
    this.animation.rArmRot = 1;
    if (this.isRunning) {
      this.animation.lLegRot = Math.sin(this.engine.time / 30) / 2;
      this.animation.rLegRot = Math.cos(this.engine.time / 30) / 2;
      this.animation.lArmRot = 0.5;
    }

    if (this.engine.time - this.lastEyeLook > 100) {
      this.lastEyeLook = this.engine.time;
      if (this.body.vel.y > 1) {
        this.animation.eyesOffset = 4;
      } else if (this.body.vel.y < -1) {
        this.animation.eyesOffset = -6;
      } else {
        this.animation.eyesOffset = 0;
      }
    }

    if (!this.body.contactPoints.length && Math.abs(this.body.vel.y) > 0.3) {
      this.animation.lArmRot = -1.5 + Math.sin(this.engine.time / 50) / 3;
      this.animation.rArmRot = 1.5 + Math.cos(this.engine.time / 50) / 3;
      this.animation.lLegRot = 0.3;
      this.animation.rLegRot = -0.3;
    } else {
      this.animation.lArmRot = -0.7 + Math.sin(this.engine.time / 200) / 10;
      this.animation.rArmRot = 0.7 - Math.sin(this.engine.time / 200) / 10;
    }

    this.animation.headOffset = Math.sin(this.engine.time / 200) - 2;

    if (Math.random() > 0.99) {
      this.blink();
    }
  }

  makeStep() {
    if (this.engine.time - this.lastStepTime > this.STEPS_RATE) {
      if (this.body.vel.length() > 0.5) {
        this.lastStepTime = this.engine.time;
        this.currentStep = (this.currentStep + 1) % 2;
        // this.engine.sound.play("collectA");
      }
    }
  }

  update() {
    this.updateControls();
    this.updateAnimation();
  }
}
