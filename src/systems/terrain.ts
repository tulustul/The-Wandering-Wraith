import { EntitySystem, EntityEngine, Entity } from "./ecs";

import { Vector2 } from "../vector";
import { BARRIER_MASK } from "../colisions-masks";
import { PhysicalEntity } from "./physics/physics.interface";
import { PhysicsSystem } from "./physics/physics";
import { LineShape } from "./physics/shapes";

interface TerrainOptions {
  start: Vector2;
  end: Vector2;
}

export class TerrainSegmentComponent extends Entity {
  physicalEnity!: PhysicalEntity;

  start!: Vector2;
  end!: Vector2;

  constructor(private engine: EntityEngine, options: TerrainOptions) {
    super();

    Object.assign(this, options);

    this.physicalEnity = this.engine
      .getSystem<PhysicsSystem>(PhysicsSystem)
      .addStatic({
        shape: new LineShape(options.start, options.end),
        parent: this,
        receiveMask: BARRIER_MASK,
        pos: new Vector2(0, 0),
      });

    engine.getSystem(TerrainSystem).add(this);
  }
}

export class TerrainSystem extends EntitySystem<TerrainSegmentComponent> {
  update() {}
}
