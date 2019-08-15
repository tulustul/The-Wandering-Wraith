import { EntitySystem } from "../ecs";
import {
  PhysicalEntity,
  DynamicPhysicalEntity,
  Colision,
} from "./physics.interface";
import { LineShape } from "./shapes";

type ColisionGrid = Map<number, PhysicalEntity[]>;

type ColisionCallback = (colision: Colision) => void;

export class PhysicsSystem extends EntitySystem<PhysicalEntity> {
  staticGrid: ColisionGrid = new Map();

  dynamicGrid: ColisionGrid = new Map();

  staticEntities: PhysicalEntity[] = [];

  dynamicEntities: DynamicPhysicalEntity[] = [];

  listeners = new Map<Function, ColisionCallback[]>();

  constructor() {
    super();
  }

  addStatic(entity: PhysicalEntity) {
    this.staticEntities.push(entity);
    this.putToGrid(this.staticGrid, entity);
    return entity;
  }

  addDynamic(entity: DynamicPhysicalEntity) {
    this.dynamicEntities.push(entity);
    this.putToGrid(this.dynamicGrid, entity);
    return entity;
  }

  remove(entity: PhysicalEntity) {
    let index = this.dynamicEntities.indexOf(entity as DynamicPhysicalEntity);
    if (index !== -1) {
      this.dynamicEntities.splice(index, 1);
    }

    index = this.staticEntities.indexOf(entity);
    if (index !== -1) {
      this.staticEntities.splice(index, 1);
    }
    this.staticGrid.clear();
    for (const staticEntity of this.staticEntities) {
      this.putToGrid(this.staticGrid, staticEntity);
    }
  }

  clear() {
    this.staticGrid.clear();
    this.dynamicGrid.clear();
    this.dynamicEntities = [];
  }

  update() {
    this.updatePosAndVel();
    const colisions = this.checkColisions();
    this.resolveColisions(colisions);
  }

  listenColisions(hitterClass: Function, callback: ColisionCallback) {
    if (!this.listeners.has(hitterClass)) {
      this.listeners.set(hitterClass, []);
    }
    this.listeners.get(hitterClass)!.push(callback);
  }

  private updatePosAndVel() {
    for (const entity of this.dynamicEntities) {
      entity.pos.add(entity.vel);

      entity.vel.x /= entity.friction;
      entity.vel.y /= entity.friction;

      entity.vel.y += 0.3;
    }
  }

  private *broadPhase(): IterableIterator<
    [DynamicPhysicalEntity, PhysicalEntity]
  > {
    for (const hitter of this.dynamicEntities) {
      for (const cell of hitter.shape.getCells()) {
        if (this.staticGrid.has(cell)) {
          for (const receiver of this.staticGrid.get(cell)!) {
            if (receiver.receiveMask & hitter.hitMask) {
              yield [hitter, receiver];
            }
          }
        }
        if (this.dynamicGrid.has(cell)) {
          for (const receiver of this.dynamicGrid.get(cell)!) {
            if (receiver !== hitter) {
              if (receiver.receiveMask & hitter.hitMask) {
                yield [hitter, receiver];
              }
            }
          }
        }
      }
    }
  }

  private *checkColisions(): IterableIterator<Colision> {
    this.dynamicGrid.clear();
    for (const entity of this.dynamicEntities) {
      this.putToGrid(this.dynamicGrid, entity);
    }

    const pairsToCheck = this.broadPhase();
    yield* this.narrowPhase(pairsToCheck);
  }

  private *narrowPhase(
    pairsToCheck: IterableIterator<[DynamicPhysicalEntity, PhysicalEntity]>,
  ) {
    for (const [hitter, receiver] of pairsToCheck) {
      const colision = this.checkColision(hitter, receiver);
      if (colision) {
        yield colision;
      }
    }
  }

  private checkColision(
    hitter: DynamicPhysicalEntity,
    receiver: PhysicalEntity,
  ): Colision | null {
    if (receiver.shape instanceof LineShape) {
      const penetration = hitter.shape.checkColisionWithLine(receiver.shape);
      if (penetration) {
        return {
          receiver,
          hitter,
          force: penetration,
        };
      }
    }
    return null;
  }

  private resolveColisions(colisions: IterableIterator<Colision>) {
    for (const colision of colisions) {
      colision.hitter.pos.add(colision.force);
      colision.hitter.vel.add(colision.force.mul(colision.hitter.bounciness));
    }
  }

  private putToGrid(grid: ColisionGrid, entity: PhysicalEntity) {
    for (const cell of entity.shape.getCells()) {
      this.addToGrid(grid, cell, entity);
    }
  }

  private addToGrid(grid: ColisionGrid, cell: number, entity: PhysicalEntity) {
    if (!grid.has(cell)) {
      grid.set(cell, [entity]);
    } else {
      grid.get(cell)!.push(entity);
    }
  }
}
