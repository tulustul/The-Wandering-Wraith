import { Engine } from "../engine";

import { Vector2 } from "../vector";
import { Random } from "../random";
import { PlantDefinition } from "../plants";
import { assets } from "../assets";
import { LineShape, lineToPointColision } from "./physics/shapes";

interface Foliage {
  pos: Vector2;
  definition: PlantDefinition;
  isForeground: boolean;
}

export class FoliageSystem {
  GRID_SIZE = 700;
  entities_: Foliage[][];

  async spawnFoliage(engine: Engine) {
    this.entities_ = [];
    for (let x = 0; x <= engine.level.size.x; x += this.GRID_SIZE) {
      this.entities_.push([]);
    }
    const r = new Random(engine.currentSave.level);

    for (const treeDefinition of assets.plants) {
      let x = 500 + r.nextFloat() * treeDefinition.spread;
      while (x < engine.level.size.x - 500) {
        x +=
          treeDefinition.spread +
          treeDefinition.spread * (r.nextFloat() - 0.5);
        const cell = this.entities_[Math.floor(x / this.GRID_SIZE)];
        const positions = this.findGround(engine, x, treeDefinition.mask);
        for (const pos of positions) {
          if (pos) {
            const isForeground = r.nextFloat() > 0.8;
            cell.push({
              pos: pos.add_(
                new Vector2(0, (isForeground ? 5 : 0) + r.nextFloat() * 5),
              ),
              definition: treeDefinition,
              isForeground,
            });
          }
        }
      }
    }
  }

  *findGround(engine: Engine, x: number, hitMask: number) {
    const cells = new LineShape(
      new Vector2(x, 0),
      new Vector2(x, engine.level.size.y),
    ).getCells();

    const linesToCheck = new Set<LineShape>();
    const grid = engine.physics.staticGrid;
    for (const cell of cells) {
      if (grid.has(cell)) {
        for (const body of grid.get(cell)!) {
          if (body.receiveMask & hitMask) {
            linesToCheck.add(body.shape_ as LineShape);
          }
        }
      }
    }

    let narrowChecks: [LineShape, Vector2, number][] = [];
    for (const line of linesToCheck) {
      const d = line.end_.copy().sub_(line.start_);
      const slope = d.y / d.x;

      const b = line.start_.y - slope * line.start_.x;
      const crossPoint = new Vector2(x, slope * x + b);
      narrowChecks.push([line, crossPoint, slope]);
    }

    narrowChecks.sort((checkA, checkB) => checkA[1].y - checkB[1].y);

    let add = false;
    for (const [line, crossPoint, slope] of narrowChecks) {
      if (lineToPointColision(line.start_, line.end_, crossPoint)) {
        add = !add;
        if (Math.abs(slope) < 1.5 && add) {
          yield crossPoint;
        }
      }
    }
  }
}
