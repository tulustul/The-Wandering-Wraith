import {
  Body,
  Colision,
  DynamicBody,
  DynamicBodyDefinition,
  StaticBody,
} from "./physics.interface";
import { LineShape, CircleShape } from "./shapes";
import { Vector2 } from "../../vector";

type ColisionGrid = Map<number, Body[]>;

// type ColisionCallback = (colision: Colision) => void;

export class PhysicsSystem {
  staticGrid: ColisionGrid = new Map();

  dynamicGrid: ColisionGrid = new Map();

  staticBodies: StaticBody[] = [];

  dynamicBodies: DynamicBody[] = [];

  // listeners = new Map<Function, ColisionCallback[]>();

  addStatic(body: StaticBody) {
    this.staticBodies.push(body);
    this.putToGrid(this.staticGrid, body);
    return body;
  }

  addDynamic(body: DynamicBodyDefinition) {
    const newBody: DynamicBody = {
      ...body,
      contactPoints: [],
    };
    this.dynamicBodies.push(newBody);
    this.putToGrid(this.dynamicGrid, body);
    return newBody;
  }

  remove(body: Body) {
    let index = this.dynamicBodies.indexOf(body as DynamicBody);
    if (index !== -1) {
      this.dynamicBodies.splice(index, 1);
    }

    index = this.staticBodies.indexOf(body as StaticBody);
    if (index !== -1) {
      this.staticBodies.splice(index, 1);
    }
    this.staticGrid.clear();
    for (const staticBody of this.staticBodies) {
      this.putToGrid(this.staticGrid, staticBody);
    }
  }

  clear() {
    this.staticGrid.clear();
    this.dynamicGrid.clear();
    this.dynamicBodies = [];
  }

  update() {
    this.updatePosAndVel();
    const colisions = this.checkColisions();
    this.resolveColisions(colisions);
  }

  // listenColisions(hitterClass: Function, callback: ColisionCallback) {
  //   if (!this.listeners.has(hitterClass)) {
  //     this.listeners.set(hitterClass, []);
  //   }
  //   this.listeners.get(hitterClass)!.push(callback);
  // }

  castRay(from: Vector2, to: Vector2, hitMask: number, presision: number) {
    /**
     * That's a highly ineffective algorithm but simple. We make a range of
     * circle shapes between `from` and `to` and check which is the first to
     * collide with something.
     */
    const step = new Vector2(0, 1).rotate(from.directionTo(to)).mul(presision);
    const stepsCount = Math.ceil(from.distanceTo(to) / step.length());
    const currentPos = from.copy();
    const hitter: DynamicBody = {
      pos: currentPos,
      shape: new CircleShape(currentPos, presision / 2),
      hitMask,
      receiveMask: 0,
      friction: 0,
      vel: new Vector2(0, 0),
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

  applyImpulse(body: DynamicBody, impulse: Vector2) {
    body.vel.add(impulse.copy());
  }

  private updatePosAndVel() {
    for (const body of this.dynamicBodies) {
      let willSeparate = true;
      for (const point of body.contactPoints) {
        const velAngle = body.vel.angleTo(point.copy().sub(body.pos));
        willSeparate = willSeparate && velAngle > Math.PI / 2;
      }

      if (!willSeparate) {
        const posAngle = body.contactPoints[0]
          .copy()
          .sub(body.pos)
          .rotate(Math.PI / 2)
          .angle();

        const friction =
          Math.min(body.friction, body.vel.length()) * Math.sin(posAngle);

        const frictionForce = body.vel
          .copy()
          .normalize()
          .mul(-friction);
        body.vel.add(frictionForce);
      }

      body.pos.add(body.vel);
      body.vel.y += 0.3;

      /* 
      Limit the speed to the diameter of circle. 
      This way we avoid tunelling through terrain in high speeds.
      **/
      const radius = (body.shape as CircleShape).radius;
      const speed = Math.min(body.vel.length(), radius);
      body.vel = body.vel.normalize().mul(speed);
    }
  }

  private *checkColisions(): IterableIterator<Colision> {
    for (const [index, hitter] of this.dynamicBodies.entries()) {
      yield* this.checkHitterColisions(hitter, index + 1);
    }
  }

  private *checkHitterColisions(
    hitter: DynamicBody,
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

    for (let i = startIndex; i < this.dynamicBodies.length; i++) {
      const receiver = this.dynamicBodies[i];
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
    hitter: DynamicBody,
    receiver: Body,
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
      // if (colision.receiver.shape instanceof CircleShape) {
      //   const receiver = colision.receiver as DynamicPhysicalEntity;
      //   receiver.contactPoints.push(colision.point);
      //   const relativeVel = receiver.vel.copy().add(colision.hitter.vel);
      //   const normal = colision.penetration.copy().normalize();
      //   const j =
      //     relativeVel.length() *
      //     (1 / receiver.weight + 1 / colision.hitter.weight);
      //   receiver.vel.add(normal.copy().mul(-j / receiver.weight));
      //   colision.hitter.vel.add(normal.copy().mul(j / colision.hitter.weight));
      // } else {
      colision.hitter.vel.add(colision.penetration);
      // }
    }
  }

  private putToGrid(grid: ColisionGrid, body: Body) {
    for (const cell of body.shape.getCells()) {
      this.addToGrid(grid, cell, body);
    }
  }

  private addToGrid(grid: ColisionGrid, cell: number, body: Body) {
    if (!grid.has(cell)) {
      grid.set(cell, [body]);
    } else {
      grid.get(cell)!.push(body);
    }
  }
}
