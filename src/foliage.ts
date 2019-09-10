import { Engine } from "./engine";

import { Vector2 } from "./vector";
import { Random } from "./random";
import { PlantDefinition } from "./plants";
import { assets } from "./assets";
import { lineToPointColision, getLineCells } from "./physics/shapes";
import { StaticBody } from "./physics/physics";
import { TREE_GROUND_MASK } from "./colisions-masks";

interface Foliage {
  pos: Vector2;
  definition: PlantDefinition;
  isForeground: boolean;
}

export class FoliageSystem {
  GRID_SIZE = 100;
  entities_: Foliage[][];

  async spawnFoliage(engine: Engine) {
    this.entities_ = [];
    for (let x = 0; x <= engine.level_.size_.x * 2; x += this.GRID_SIZE) {
      this.entities_.push([]);
    }

    const r = new Random(engine.currentSave.level_ + 2);

    for (const treeDefinition of assets.plants) {
      let x = r.nextFloat() * treeDefinition.spread;
      while (x < engine.level_.size_.x) {
        x +=
          treeDefinition.spread +
          treeDefinition.spread * (r.nextFloat() - 0.5);
        const cell = this.entities_[Math.floor(x / this.GRID_SIZE)];
        const positions = this.findGround(engine, x, treeDefinition.mask_);
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
    let requiredSpace = hitMask === TREE_GROUND_MASK ? 200 : 30;

    const cells = getLineCells(
      new Vector2(x, -1000),
      new Vector2(x, engine.level_.size_.y),
    );

    const linesToCheck = new Set<[Vector2, Vector2, boolean]>();
    const grid = engine.physics.grid;
    const checked = new Set<StaticBody>();
    for (const cell of cells) {
      if (grid.has(cell)) {
        for (const body of grid.get(cell)!) {
          if (!checked.has(body)) {
            checked.add(body);
            linesToCheck.add([
              body.start_,
              body.end_,
              !!(body.receiveMask & hitMask),
            ]);
          }
        }
      }
    }

    let narrowChecks: [Vector2, Vector2, Vector2, number, boolean][] = [];
    for (const [start_, end_, shouldGenerate] of linesToCheck) {
      const d = end_.copy().sub_(start_);
      if (!d.x) {
        continue;
      }
      const slope = d.y / d.x;

      const b = start_.y - slope * start_.x;
      const crossPoint = new Vector2(x, slope * x + b);
      narrowChecks.push([start_, end_, crossPoint, slope, shouldGenerate]);
    }

    narrowChecks.sort((checkA, checkB) => checkA[2].y - checkB[2].y);

    let add = true;
    let previousY = 0;
    for (const [
      start_,
      end_,
      crossPoint,
      slope,
      shouldGenerate,
    ] of narrowChecks) {
      if (lineToPointColision(start_, end_, crossPoint)) {
        if (
          shouldGenerate &&
          crossPoint.y - previousY > requiredSpace &&
          Math.abs(slope) < 1.5 &&
          add
        ) {
          yield crossPoint;
        }
        previousY = crossPoint.y;
        add = !add;
      }
    }
  }
}
