import {
  Body,
  DynamicBody,
  DynamicBodyDefinition,
  StaticBody,
  StaticBodyColision,
} from "./physics.interface";
import { Vector2 } from "../../vector";
import {
  getCircleCells,
  checkCircleLineColision,
  getLineCells,
  checkCircleCircleColision,
  lineToLineColision,
} from "./shapes";

export class PhysicsSystem {
  staticGrid: Map<number, StaticBody[]> = new Map();

  staticBodies: StaticBody[] = [];

  dynamicBodies: DynamicBody[] = [];

  addStatic(body: StaticBody) {
    this.staticBodies.push(body);
    for (const cell of getLineCells(body.start_, body.end_)) {
      if (!this.staticGrid.has(cell)) {
        this.staticGrid.set(cell, [body]);
      } else {
        this.staticGrid.get(cell)!.push(body);
      }
    }
    return body;
  }

  addDynamic(body: DynamicBodyDefinition) {
    const newBody: DynamicBody = {
      ...body,
      oldPos: body.pos.copy(),
      contactPoints: [],
    };
    this.dynamicBodies.push(newBody);
    return newBody;
  }

  remove_(body: DynamicBody) {
    let index = this.dynamicBodies.indexOf(body as DynamicBody);
    if (index !== -1) {
      this.dynamicBodies.splice(index, 1);
    }
  }

  clear_() {
    this.staticBodies = [];
    this.staticGrid.clear();

    this.dynamicBodies = [];
  }

  // update_() {
  //   this.updatePosAndVel();
  //   const colisions = this.checkColisions();
  //   this.resolveColisions(colisions);
  // }

  private updatePosAndVel() {
    // for (const body of this.dynamicBodies) {
    //   body.oldPos = body.pos.copy();
    //   let willSeparate = true;
    //   for (const point of body.contactPoints) {
    //     const velAngle = body.vel.angleTo(point.copy().sub_(body.pos));
    //     willSeparate = willSeparate && velAngle > Math.PI / 2;
    //   }
    //   if (!willSeparate) {
    //     const posAngle =
    //       body.contactPoints[0]
    //         .copy()
    //         .sub_(body.pos)
    //         .angle_() +
    //       Math.PI / 2;
    //     const friction =
    //       Math.min(body.friction, body.vel.length_()) * Math.sin(posAngle);
    //     const frictionForce = body.vel
    //       .copy()
    //       .normalize_()
    //       .mul(-friction);
    //     body.vel.add_(frictionForce);
    //   } else {
    //     // air friction
    //     body.vel.x *= 0.94;
    //   }
    //   body.pos.add_(body.vel);
    //   /*
    //   Limit the speed to the diameter of circle.
    //   This way we avoid tunelling through terrain in high speeds.
    //   **/
    //   const radius = body.radius;
    //   const speed = Math.min(body.vel.length_(), radius);
    //   body.vel = body.vel.normalize_().mul(speed);
    // }
  }

  private *checkColisions(): IterableIterator<StaticBodyColision> {
    // for (const [index, hitter] of this.dynamicBodies.entries()) {
    //   yield* this.checkHitterColisions(hitter, index + 1);
    // }
  }

  *checkHitterColisions(
    hitter: DynamicBody,
    // startIndex: number,
  ): IterableIterator<StaticBodyColision> {
    hitter.contactPoints = [];
    for (const cell of getCircleCells(hitter.pos, hitter.radius)) {
      if (this.staticGrid.has(cell)) {
        for (const receiver of this.staticGrid.get(cell)!) {
          if (receiver.receiveMask & hitter.hitMask) {
            const colision = this.checkNarrowColision(hitter, receiver);
            if (colision) {
              this.resolveColision(colision);
              yield colision;
            }
          }
        }
      }
    }

    // Dynamic to dynamic colisions. Here we are using brute force on every
    // pair of objects. The result is simply true of false without any colision
    // data.
    // for (let i = startIndex; i < this.dynamicBodies.length; i++) {
    //   const receiver = this.dynamicBodies[i];
    //   if (receiver !== hitter) {
    //     if (receiver.receiveMask & hitter.hitMask) {
    //       if (
    //         checkCircleCircleColision(
    //           hitter.pos,
    //           hitter.radius,
    //           receiver.pos,
    //           receiver.radius,
    //         )
    //       ) {
    //         if (hitter.onCollide) {
    //           hitter.onCollide();
    //         }
    //         if (receiver.onCollide) {
    //           receiver.onCollide();
    //         }
    //       }
    //     }
    //   }
    // }
  }

  private checkNarrowColision(
    hitter: DynamicBody,
    receiver: StaticBody,
  ): StaticBodyColision | null {
    const result = checkCircleLineColision(
      hitter.pos,
      hitter.radius,
      receiver.start_,
      receiver.end_,
      hitter.vel,
    );
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

  private resolveColision(colision: StaticBodyColision) {
    if (colision.receiver.isDeadly) {
      if (colision.hitter.onCollide) {
        colision.hitter.onCollide();
      }
    }

    //   if (colision.hitter.pos.y - colision.point.y > -4) {
    //     colision.hitter.pos.sub_(colision.penetration);

    //     const d = colision.hitter.pos.copy().sub_(colision.hitter.oldPos);
    //     const v = colision.hitter.vel;

    //     colision.hitter.vel.x = Math.abs(v.x) < Math.abs(d.x) ? v.x : d.x;
    //     colision.hitter.vel.y = Math.abs(v.y) < Math.abs(d.y) ? v.y : d.y;
    //   }

    colision.hitter.contactPoints.push(colision.point);
  }

  castRay(start_: Vector2, end_: Vector2) {
    const cells = getLineCells(start_, end_);

    // const linesToCheck = new Set<[Vector2, Vector2]>();
    for (const cell of cells) {
      if (this.staticGrid.has(cell)) {
        for (const body of this.staticGrid.get(cell)!) {
          // if (body.receiveMask & hitMask) {
          // linesToCheck.add([body.start_, body.end_]);
          // }
          const intersection = lineToLineColision(
            start_,
            end_,
            body.start_,
            body.end_,
          );
          if (intersection) {
            return intersection;
          }
        }
      }
    }
    return null;
  }
}
