import { Engine } from "../engine";

import { Vector2 } from "../vector";
import { TREE_GROUND_MASK } from "../colisions-masks";
import { Random } from "../random";
import { TreeDefinition } from "../trees";
import { assets } from "../assets";

interface Foliage {
  pos: Vector2;
  definition: TreeDefinition;
  isForeground: boolean;
}

export class FoliageSystem {
  entities: Foliage[];
  async spawnFoliage(engine: Engine) {
    this.entities = [];
    const r = new Random(1);

    for (const treeDefinition of assets.trees) {
      let x = 500;
      while (x < engine.worldWidth) {
        x += (r.next() % treeDefinition.density) + 20;
        const pos = engine.physics.castRay(
          new Vector2(x, 0),
          new Vector2(x, engine.worldHeight),
          TREE_GROUND_MASK,
          5,
        );
        if (pos) {
          const img = treeDefinition.frames[0];
          const isForeground = Math.random() > 0.5;
          this.entities.push({
            pos: pos.add(
              new Vector2(
                img.width / -2,
                -img.height + (isForeground ? 20 : 0),
              ),
            ),
            definition: treeDefinition,
            isForeground,
          });
        }
      }
    }
  }
}
