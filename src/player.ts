import { Engine } from "./engine";
import { Vector2 } from "./vector";
import { SinusAnimation } from "./animations";
import { assets } from "./assets";
import { PlayerPhysics, MotionMode } from "./physics/player-physics";
import { PickableType } from "./level.interface";
import { loadSave } from "./saves";
import { DynamicBody } from "./physics/physics";

import "./ZzFX.micro";
import { lerp } from "./utils";

export declare var zzfx: any;

interface AgentAnimation {
  headOffset: number;
  lArmRot: number;
  rArmRot: number;
  lLegRot: number;
  rLegRot: number;
  eyesScale: number;
  eyesOffset: number;
  scale_: number;
}

export class Player {
  STEPS_RATE = 90;

  lastStepTime = 0;

  lastEyeLook = 0;

  body_: DynamicBody;

  stretch = new Vector2(1, 1);

  isDead = true;

  animation_: AgentAnimation = {
    headOffset: 0,
    lArmRot: -1,
    rArmRot: 1,
    lLegRot: 0,
    rLegRot: 0,
    eyesScale: 1,
    eyesOffset: -15,
    scale_: 1,
  };

  physics: PlayerPhysics;

  isRunning = false;

  targetScale = 1;

  constructor(public engine: Engine, pos: Vector2) {
    this.createBody(pos);
    this.physics = new PlayerPhysics(engine.physics, this);
  }

  blink_() {
    this.engine.animations.animate_(
      new SinusAnimation(Math.PI / 2, Math.PI * 2.5, 200),
      value => (this.animation_.eyesScale = (value + 1) / 2),
    );
  }

  updateControls() {
    if (this.isDead) {
      return;
    }
    const control = this.engine.control_;
    if (control.keys_.get("Space")) {
      this.physics.jump();
    }
    if (this.physics.mode_ !== MotionMode.climbing) {
      if (control.keys_.get("ArrowLeft")) {
        this.physics.moveToDirection(-1);
      }
      if (control.keys_.get("ArrowRight")) {
        this.physics.moveToDirection(1);
      }
    }
  }

  updateAnimation() {
    this.animation_.lLegRot = 0;
    this.animation_.rLegRot = 0;
    this.animation_.lArmRot = -1;
    this.animation_.rArmRot = 1;

    if (Math.abs(this.animation_.scale_ - this.targetScale) < 0.05) {
      this.targetScale = 1;
    }
    this.animation_.scale_ = lerp(
      this.animation_.scale_,
      this.targetScale,
      0.3,
    );

    if (this.isRunning) {
      this.animation_.lLegRot = Math.sin(this.engine.time_ / 30) / 2;
      this.animation_.rLegRot = Math.cos(this.engine.time_ / 30) / 2;
    }

    if (this.physics.mode_ === MotionMode.climbing) {
      this.animation_.lLegRot = -0.6;
      this.animation_.rLegRot = -0.7;
      this.animation_.lArmRot = -1.3;
      this.animation_.rArmRot = -0.7;
    }

    if (this.engine.time_ - this.lastEyeLook > 100) {
      this.lastEyeLook = this.engine.time_;
      if (this.body_.vel.y > 1) {
        this.animation_.eyesOffset = -11;
      } else if (this.body_.vel.y < -1) {
        this.animation_.eyesOffset = -21;
      } else {
        this.animation_.eyesOffset = -15;
      }
    }

    if (this.physics.mode_ === MotionMode.falling) {
      this.targetScale = 1 + Math.abs(this.body_.vel.y / 17);
      if (this.body_.vel.y > 0.3) {
        this.animation_.lArmRot = -1.5 + Math.sin(this.engine.time_ / 50) / 3;
        this.animation_.rArmRot = 1.5 + Math.cos(this.engine.time_ / 50) / 3;
        this.animation_.lLegRot = 0.3;
        this.animation_.rLegRot = -0.3;
      } else {
        this.animation_.lArmRot =
          -0.7 + Math.sin(this.engine.time_ / 200) / 10;
        this.animation_.rArmRot = 0.7 - Math.sin(this.engine.time_ / 200) / 10;
      }
    }

    this.animation_.headOffset = Math.sin(this.engine.time_ / 200) - 2;

    if (Math.random() > 0.99) {
      this.blink_();
    }
  }

  makeStep() {
    if (this.engine.time_ - this.lastStepTime > this.STEPS_RATE) {
      this.lastStepTime = this.engine.time_;
      if (this.body_.contactPoints.length > 0) {
        zzfx(...assets.sounds.walk);
      }
    }
  }

  update_() {
    this.isRunning = false;
    this.updateControls();
    this.physics.update_();
    this.checkPickables();
    this.updateAnimation();
  }

  checkPickables() {
    const pickables = this.engine.level_.pickables;
    for (const [index, pickable] of pickables.entries()) {
      if (
        !pickable.collected &&
        pickable.pos.distanceTo(this.body_.pos) < pickable.radius
      ) {
        pickable.collected = true;
        switch (pickable.type) {
          case PickableType.crystal:
            const save = this.engine.currentSave;
            if (!save.crystals[save.level_]) {
              save.crystals[save.level_] = [];
            }
            save.crystals[save.level_].push(index);
            zzfx(...assets.sounds.collect);
            break;
          case PickableType.gravityCrystal:
            this.physics.enterAntigravity();
            setTimeout(() => (pickable.collected = false), 5000);
            zzfx(...assets.sounds.collect);
            break;
          case PickableType.bubble:
            this.physics.enterBubble(pickable);
            break;
        }
      }
    }
  }

  die() {
    this.isDead = true;

    localStorage.setItem(
      "tul_d",
      ((parseInt(localStorage.getItem("tul_d")!) || 0) + 1).toString(),
    ); // increment deaths counter

    this.engine.particles.emit({
      count: 250,
      direction_: new Vector2(5, 0),
      lifetime: 150,
      pos: this.body_.pos,
    });

    zzfx(...assets.sounds.dead);

    setTimeout(() => {
      // this.engine.respawnPlayer();
      this.engine.load_(loadSave());
    }, 1000);
  }

  createBody(pos: Vector2) {
    this.isDead = false;
    this.body_ = {
      radius: 10,
      pos: pos,
      oldPos: pos.copy(),
      vel: new Vector2(),
      contactPoints: [],
    };
  }
}