import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { Vector2 } from "../vector";
import { BARRIER_MASK } from "../colisions-masks";
import {
  DynamicPhysicalEntityDefinition,
  DynamicPhysicalEntity,
} from "./physics/physics.interface";
import { PhysicsSystem } from "./physics/physics";
import { CircleShape } from "./physics/shapes";

interface BallOptions {
  vel: Vector2;
  pos: Vector2;
  radius: number;
}

export class BallComponent extends Entity {
  vel: Vector2;
  pos: Vector2;
  radius: number;
  physicalEntity: DynamicPhysicalEntity;

  onHit: () => void;

  constructor(public engine: EntityEngine, options: BallOptions) {
    super();
    if (options) {
      Object.assign(this, options);
    }

    this.engine.getSystem(BallSystem).add(this);

    const physics = this.engine.getSystem<PhysicsSystem>(PhysicsSystem);

    this.physicalEntity = physics.addDynamic({
      parent: this,
      receiveMask: BARRIER_MASK,
      hitMask: BARRIER_MASK,
      shape: new CircleShape(this.pos, this.radius),
      bounciness: 0.9,
      pos: this.pos,
      friction: 0.03,
      vel: this.vel,
      weight: this.radius * this.radius,
    });
  }

  destroy() {
    this.engine
      .getSystem<PhysicsSystem>(PhysicsSystem)
      .remove(this.physicalEntity);
    super.destroy();
  }
}

export class BallSystem extends EntitySystem<BallComponent> {
  update() {}
}
