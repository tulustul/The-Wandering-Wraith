import { EntitySystem, EntityEngine, Entity } from "./ecs";

import { Vector2 } from "../vector";
import { BARRIER_MASK } from "../colisions-masks";
import { PhysicsSystem } from "./physics/physics";
import { Random } from "../random";
import { treeDefinitions, TreeDefinition } from "../trees";

interface FoliageOptions {
  pos: Vector2;
  definition: TreeDefinition;
}

export class FoliageComponent extends Entity {
  pos!: Vector2;
  definition!: TreeDefinition;
  constructor(options: FoliageOptions) {
    super();
    Object.assign(this, options);
  }
}

export class FoliageSystem extends EntitySystem<FoliageComponent> {
  update() {}

  spawnFoliage() {
    const r = new Random(1);
    const physics = this.engine.getSystem<PhysicsSystem>(PhysicsSystem);

    for (const treeDefinition of treeDefinitions) {
      let x = 0;
      while (x < this.engine.worldWidth) {
        x += (r.next() % treeDefinition.density) + 20;
        const pos = physics.castRay(
          new Vector2(x, 0),
          new Vector2(x, this.engine.worldHeight),
          BARRIER_MASK,
          5,
        );
        if (pos) {
          const img = treeDefinition.frames[0];
          this.add(
            new FoliageComponent({
              pos: pos.add(new Vector2(img.width / -2, -img.height + 20)),
              definition: treeDefinition,
            }),
          );
        }
      }
    }
  }
}
