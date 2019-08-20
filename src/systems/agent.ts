import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { Vector2 } from "../vector";
import { BARRIER_MASK } from "../colisions-masks";
import {
  DynamicPhysicalEntityDefinition,
  DynamicPhysicalEntity,
} from "./physics/physics.interface";
import { PhysicsSystem } from "./physics/physics";
import { CircleShape } from "./physics/shapes";

export interface AgentOptions {
  maxHealth?: number;
  colisionMask: number;
}

export class AgentComponent extends Entity {
  maxSpeed = 4;

  ACCELERATION = 0.6;

  physicalEntity: DynamicPhysicalEntity;

  direction: "l" | "r" = "r";

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
    // const impulse = new Vector2(
    //   0,
    //   this.ACCELERATION * this.physicalEntity.weight,
    // ).rotate(direction);
    // this.engine
    //   .getSystem<PhysicsSystem>(PhysicsSystem)
    //   .applyImpulse(this.physicalEntity, impulse);

    const acc = new Vector2(0, this.ACCELERATION).rotate(direction);
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
        this.physicalEntity.vel.y += -8;
        break;
      }
    }
  }

  private updateVelocity(acc: Vector2) {
    const speed = this.maxSpeed;
    this.physicalEntity.vel.x = Math.min(
      speed,
      Math.max(-speed, this.physicalEntity.vel.x + acc.x),
    );
    this.physicalEntity.vel.y = Math.min(
      speed,
      Math.max(-speed, this.physicalEntity.vel.y + acc.y),
    );
  }
}

export class AgentSystem extends EntitySystem<AgentComponent> {
  update() {}
}
