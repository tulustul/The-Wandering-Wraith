import { EntitySystem } from "../ecs";
import {
  PhysicalEntityDefinition,
  DynamicPhysicalEntityDefinition,
  Colision,
  DynamicPhysicalEntity,
} from "./physics.interface";
import { LineShape, CircleShape } from "./shapes";
import { Vector2 } from "../../vector";

type ColisionGrid = Map<number, PhysicalEntityDefinition[]>;

type ColisionCallback = (colision: Colision) => void;

export class PhysicsSystem extends EntitySystem<PhysicalEntityDefinition> {
  staticGrid: ColisionGrid = new Map();

  dynamicGrid: ColisionGrid = new Map();

  staticEntities: PhysicalEntityDefinition[] = [];

  dynamicEntities: DynamicPhysicalEntity[] = [];

  listeners = new Map<Function, ColisionCallback[]>();

  constructor() {
    super();
  }

  addStatic(entity: PhysicalEntityDefinition) {
    this.staticEntities.push(entity);
    this.putToGrid(this.staticGrid, entity);
    return entity;
  }

  addDynamic(entity: DynamicPhysicalEntityDefinition) {
    const newEntity: DynamicPhysicalEntity = {
      ...entity,
      contactPoints: [],
    };
    this.dynamicEntities.push(newEntity);
    this.putToGrid(this.dynamicGrid, entity);
    return newEntity;
  }

  remove(entity: PhysicalEntityDefinition) {
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

  castRay(from: Vector2, to: Vector2, hitMask: number, presision: number) {
    /**
     * That's a highly ineffective algorithm but simple. We make a range of
     * circle shapes between `from` and `to` and check which is the first to
     * collide with something.
     */
    const step = new Vector2(0, 1).rotate(from.directionTo(to)).mul(presision);
    const stepsCount = Math.ceil(from.distanceTo(to) / step.length());
    const currentPos = from.copy();
    const hitter: DynamicPhysicalEntity = {
      pos: currentPos,
      shape: new CircleShape(currentPos, presision / 2),
      hitMask,
      receiveMask: 0,
      bounciness: 0,
      friction: 0,
      vel: new Vector2(0, 0),
      weight: 1,
      contactPoints: [],
    };

    for (let i = 0; i < stepsCount; i++) {
      const colision = this.checkHitterColisions(hitter, 0).next().value;
      if (colision) {
        colision.hitter.pos.add(colision.penetration);
        return colision.hitter.pos.copy();
      }
      hitter.pos.add(step);
    }
    return null;
  }

  applyImpulse(entity: DynamicPhysicalEntity, impulse: Vector2) {
    entity.vel.add(impulse.copy().mul(1 / entity.weight));
  }

  private updatePosAndVel() {
    for (const entity of this.dynamicEntities) {
      let willSeparate = true;
      for (const point of entity.contactPoints) {
        const velAngle = entity.vel.angleTo(point.copy().sub(entity.pos));
        willSeparate = willSeparate && velAngle > Math.PI / 2;
      }

      if (!willSeparate) {
        const posAngle = entity.contactPoints[0]
          .copy()
          .sub(entity.pos)
          .rotate(Math.PI / 2)
          .angle();

        const friction =
          Math.min(entity.friction, entity.vel.length()) * Math.sin(posAngle);

        const frictionForce = entity.vel
          .copy()
          .normalize()
          .mul(-friction);
        entity.vel.add(frictionForce);
      }

      entity.pos.add(entity.vel);
      entity.vel.y += 0.3;

      /* 
      Limit the speed to the diameter of circle. 
      This way we avoid tunelling through terrain in high speeds.
      **/
      const radius = (entity.shape as CircleShape).radius;
      const speed = Math.min(entity.vel.length(), radius);
      entity.vel = entity.vel.normalize().mul(speed);
    }
  }

  private *checkColisions(): IterableIterator<Colision> {
    // this.dynamicGrid.clear();
    // for (const entity of this.dynamicEntities) {
    //   this.putToGrid(this.dynamicGrid, entity);
    // }

    for (const [index, hitter] of this.dynamicEntities.entries()) {
      yield* this.checkHitterColisions(hitter, index + 1);
    }
  }

  private *checkHitterColisions(
    hitter: DynamicPhysicalEntity,
    startIndex: number,
  ): IterableIterator<Colision> {
    hitter.contactPoints = [];
    for (const cell of hitter.shape.getCells()) {
      if (this.staticGrid.has(cell)) {
        for (const receiver of this.staticGrid.get(cell)!) {
          if (receiver.receiveMask & hitter.hitMask) {
            const colision = this.checkNarrowColision(hitter, receiver);
            if (colision) {
              yield colision;
            }
          }
        }
      }
    }

    for (let i = startIndex; i < this.dynamicEntities.length; i++) {
      const receiver = this.dynamicEntities[i];
      if (receiver !== hitter) {
        if (receiver.receiveMask & hitter.hitMask) {
          const colision = this.checkNarrowColision(hitter, receiver);
          if (colision) {
            yield colision;
          }
        }
      }
    }
  }

  private checkNarrowColision(
    hitter: DynamicPhysicalEntity,
    receiver: PhysicalEntityDefinition,
  ): Colision | null {
    let result: [Vector2, Vector2] | null;
    if (receiver.shape instanceof LineShape) {
      result = hitter.shape.checkColisionWithLine(receiver.shape);
    } else {
      result = hitter.shape.checkColisionWithCircle(
        receiver.shape as CircleShape,
      );
    }
    if (result) {
      return {
        receiver,
        hitter,
        penetration: result[0],
        point: result[1],
      };
    }
    return null;
  }

  private resolveColisions(colisions: IterableIterator<Colision>) {
    for (const colision of colisions) {
      colision.hitter.pos.add(colision.penetration);
      colision.hitter.contactPoints.push(colision.point);
      if (colision.receiver.shape instanceof CircleShape) {
        const receiver = colision.receiver as DynamicPhysicalEntity;
        receiver.contactPoints.push(colision.point);
        const relativeVel = receiver.vel.copy().add(colision.hitter.vel);
        const normal = colision.penetration.copy().normalize();
        const j =
          relativeVel.length() *
          (1 / receiver.weight + 1 / colision.hitter.weight);
        receiver.vel.add(normal.copy().mul(-j / receiver.weight));
        colision.hitter.vel.add(normal.copy().mul(j / colision.hitter.weight));
      } else {
        colision.hitter.vel.add(colision.penetration);
      }
    }
  }

  private putToGrid(grid: ColisionGrid, entity: PhysicalEntityDefinition) {
    for (const cell of entity.shape.getCells()) {
      this.addToGrid(grid, cell, entity);
    }
  }

  private addToGrid(
    grid: ColisionGrid,
    cell: number,
    entity: PhysicalEntityDefinition,
  ) {
    if (!grid.has(cell)) {
      grid.set(cell, [entity]);
    } else {
      grid.get(cell)!.push(entity);
    }
  }
}
