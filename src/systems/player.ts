import { Engine } from "../engine";
import { Vector2 } from "../vector";
import { GROUND_MASK, PLAYER_MASK } from "../colisions-masks";
import { DynamicBody } from "./physics/physics.interface";
import { SinusAnimation } from "../animations";
import { playSound } from "../sound";
import { assets } from "../assets";
import { PlayerPhysics, MotionMode } from "./physics/player-physics";
import { PickableType } from "../level.interface";

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
  STEPS_RATE = 90;

  currentStep = 0;

  lastStepTime = 0;

  lastEyeLook = 0;

  body_: DynamicBody;

  stretch = new Vector2(1, 1);

  isDead = true;

  animation_: AgentAnimation = {
    headOffset: 0,
    lArmRot: 0,
    rArmRot: 0,
    lLegRot: 0,
    rLegRot: 0,
    eyesScale: 1,
    eyesOffset: 0,
  };

  physics: PlayerPhysics;

  isRunning = false;

  constructor(public engine: Engine, pos: Vector2) {
    this.createBody(pos);
    this.physics = new PlayerPhysics(engine.physics, this);
  }

  blink() {
    this.engine.animations.animate_(
      new SinusAnimation(Math.PI / 2, Math.PI * 2.5, 200),
      value => (this.animation_.eyesScale = (value + 1) / 2),
    );
  }

  updateControls() {
    const control = this.engine.control_;
    if (control.keys_.get("Space")) {
      this.physics.jump();
    }
    if (this.physics.mode !== MotionMode.climbing) {
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

    if (this.isRunning) {
      this.animation_.lLegRot = Math.sin(this.engine.time_ / 30) / 2;
      this.animation_.rLegRot = Math.cos(this.engine.time_ / 30) / 2;
      // this.animation_.lArmRot = -0.5;
    }

    if (this.physics.mode === MotionMode.climbing) {
      this.animation_.lLegRot = -0.6;
      this.animation_.rLegRot = -0.7;
      this.animation_.lArmRot = -1.3;
      this.animation_.rArmRot = -0.7;
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

    if (this.physics.mode === MotionMode.falling) {
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
      this.blink();
    }
  }

  makeStep() {
    if (this.engine.time_ - this.lastStepTime > this.STEPS_RATE) {
      if (this.body_.vel.length_() > 1) {
        this.lastStepTime = this.engine.time_;
        this.currentStep = (this.currentStep + 1) % 2;
        if (this.body_.contactPoints.length > 0) {
          playSound(assets.sounds.walk);
        }
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
    const pickables = this.engine.level.pickables;
    for (const [index, pickable] of pickables.entries()) {
      if (
        !pickable.collected &&
        pickable.pos.distanceTo(this.body_.pos) < 20
      ) {
        pickable.collected = true;
        switch (pickable.type) {
          case PickableType.crystal:
            const save = this.engine.currentSave;
            if (!save.crystals[save.level]) {
              save.crystals[save.level] = [];
            }
            save.crystals[save.level].push(index);
            playSound(assets.sounds.collect);
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
    this.engine.particles.emit({
      count: 250,
      direction: new Vector2(5, 0),
      lifetime: 150,
      lifetimeSpread: 5,
      pos: this.body_.pos,
      speedSpread: 0.3,
      spread: Math.PI * 2,
    });

    this.engine.physics.remove_(this.body_);

    playSound(assets.sounds.dead);

    setTimeout(() => {
      this.engine.respawnPlayer();
    }, 1000);
  }

  createBody(pos: Vector2) {
    this.isDead = false;
    this.body_ = this.engine.physics.addDynamic({
      radius: 10,
      parent: this,
      receiveMask: PLAYER_MASK,
      hitMask: GROUND_MASK,
      pos: pos,
      friction: 0.45,
      vel: new Vector2(0, 0),
      isDeadly: false,
      onCollide: () => this.die(),
    });
    this.engine.camera.bindToTarget(this.body_.pos);
  }
}
