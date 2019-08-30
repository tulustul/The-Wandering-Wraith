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

export class PhysicsSystem {
  staticGrid: ColisionGrid = new Map();

  dynamicGrid: ColisionGrid = new Map();

  staticBodies: StaticBody[] = [];

  dynamicBodies: DynamicBody[] = [];

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

  remove_(body: Body) {
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

  clear_() {
    this.staticGrid.clear();
    this.dynamicGrid.clear();
    this.dynamicBodies = [];
  }

  update_() {
    this.updatePosAndVel();
    const colisions = this.checkColisions();
    this.resolveColisions(colisions);
  }

  applyImpulse(body: DynamicBody, impulse: Vector2) {
    body.vel.add_(impulse.copy());
  }

  private updatePosAndVel() {
    for (const body of this.dynamicBodies) {
      let willSeparate = true;
      for (const point of body.contactPoints) {
        const velAngle = body.vel.angleTo(point.copy().sub_(body.pos));
        willSeparate = willSeparate && velAngle > Math.PI / 2;
      }

      if (!willSeparate) {
        const posAngle = body.contactPoints[0]
          .copy()
          .sub_(body.pos)
          .rotate_(Math.PI / 2)
          .angle_();
        const friction =
          Math.min(body.friction, body.vel.length_()) * Math.sin(posAngle);
        const frictionForce = body.vel
          .copy()
          .normalize_()
          .mul(-friction);
        body.vel.add_(frictionForce);
      } else {
        // air friction
        body.vel.x *= 0.95;
      }

      body.pos.add_(body.vel);
      body.vel.y += 0.3;

      /* 
      Limit the speed to the diameter of circle. 
      This way we avoid tunelling through terrain in high speeds.
      **/
      const radius = (body.shape_ as CircleShape).radius;
      const speed = Math.min(body.vel.length_(), radius);
      body.vel = body.vel.normalize_().mul(speed);
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
    for (const cell of hitter.shape_.getCells()) {
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
    if (receiver.shape_ instanceof LineShape) {
      result = hitter.shape_.checkColisionWithLine(receiver.shape_);
    } else {
      result = hitter.shape_.checkColisionWithCircle(
        receiver.shape_ as CircleShape,
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
      colision.hitter.pos.add_(colision.penetration);

      // colision.hitter.vel.add_(colision.penetration);
      if (colision.hitter.vel.x ^ colision.penetration.x) {
        // colision.hitter.vel.x += colision.penetration.x
        colision.hitter.vel.x = 0;
      }

      // if (colision.hitter.vel.y ^ colision.penetration.y) {
      //   colision.hitter.vel.y = 0.3;
      // }
      colision.hitter.vel.y += colision.penetration.y;

      // const v = colision.hitter.vel
      //   .copy()
      //   .normalize_()
      //   .directionTo(colision.penetration.copy().normalize_());
      // colision.hitter.vel.mul(Math.cos(v * 2));

      colision.hitter.contactPoints.push(colision.point);
    }
  }

  private putToGrid(grid: ColisionGrid, body: Body) {
    for (const cell of body.shape_.getCells()) {
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
