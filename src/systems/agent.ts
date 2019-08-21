import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { Vector2 } from "../vector";
import { BARRIER_MASK } from "../colisions-masks";
import {
  DynamicPhysicalEntityDefinition,
  DynamicPhysicalEntity,
} from "./physics/physics.interface";
import { PhysicsSystem } from "./physics/physics";
import { CircleShape } from "./physics/shapes";
import { SinusAnimation } from "../animations";

export interface AgentOptions {
  maxHealth?: number;
  colisionMask: number;
}

interface AgentAnimation {
  headOffset: number;
  lArmRot: number;
  rArmRot: number;
  lLegRot: number;
  rLegRot: number;
  eyesScale: number;
}

export class AgentComponent extends Entity {
  maxSpeed = 4;

  ACCELERATION = 0.7;

  physicalEntity: DynamicPhysicalEntity;

  direction: "l" | "r" = "r";

  lastJumpTime = 0;

  dashed = false;

  stretch = new Vector2(1, 1);

  animation: AgentAnimation = {
    headOffset: 0,
    lArmRot: 0,
    rArmRot: 0,
    lLegRot: 0,
    rLegRot: 0,
    eyesScale: 1,
  };

  onHit: () => void;

  constructor(
    public engine: EntityEngine,
    pos: Vector2,
    options: AgentOptions,
  ) {
    super();
    if (options) {
      Object.assign(this, options);
    }

    this.engine.getSystem(AgentSystem).add(this);

    const physics = this.engine.getSystem<PhysicsSystem>(PhysicsSystem);

    this.physicalEntity = physics.addDynamic({
      shape: new CircleShape(pos, 10),
      parent: this,
      receiveMask: options.colisionMask,
      hitMask: BARRIER_MASK,
      bounciness: 0,
      pos: pos,
      friction: 0.4,
      vel: new Vector2(0, 0),
      weight: 100,
    });
  }

  destroy() {
    this.engine
      .getSystem<PhysicsSystem>(PhysicsSystem)
      .remove(this.physicalEntity);
    super.destroy();
  }

  moveToDirection(direction: number) {
    let accScalar = this.ACCELERATION;
    if (!this.physicalEntity.contactPoints.length) {
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
    for (const point of this.physicalEntity.contactPoints) {
      if (point.y - this.physicalEntity.pos.y > 5) {
        this.physicalEntity.vel.y = -6;
        this.lastJumpTime = this.engine.time;
        this.dashed = false;
        return;
      }
    }
    if (!this.dashed && this.engine.time - this.lastJumpTime > 300) {
      const control = this.engine.game.control;
      if (control.keys.get("ArrowLeft")) {
        this.physicalEntity.vel.x = -6;
        this.physicalEntity.vel.y = -2;
      } else if (control.keys.get("ArrowRight")) {
        this.physicalEntity.vel.x = 6;
        this.physicalEntity.vel.y = -2;
      } else {
        this.physicalEntity.vel.y = -6;
      }
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
    if (Math.abs(this.physicalEntity.vel.x + acc.x) < this.maxSpeed) {
      this.physicalEntity.vel.x += acc.x;
    }
    this.physicalEntity.vel.y += acc.y;
  }
}

export class AgentSystem extends EntitySystem<AgentComponent> {
  update() {
    for (const agent of this.entities) {
      if (Math.random() > 0.99) {
        agent.blink();
      }
      agent.animation.headOffset = Math.sin(this.engine.time / 200);
    }
  }
}
