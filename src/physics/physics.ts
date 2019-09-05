import { Vector2 } from "../vector";
import {
  getCircleCells,
  checkCircleLineColision,
  getLineCells,
  lineToLineColision,
} from "./shapes";

export interface StaticBody {
  start_: Vector2;
  end_: Vector2;
  isDeadly: boolean;
  receiveMask: number;
}

export interface DynamicBody {
  radius: number;
  oldPos: Vector2;
  contactPoints: Vector2[];
  pos: Vector2;
  vel: Vector2;
}

export interface StaticBodyColision {
  hitter: DynamicBody;
  receiver_: StaticBody;
  point: Vector2;
  penetration: Vector2;
}

export class PhysicsSystem {
  staticGrid: Map<number, StaticBody[]> = new Map();

  staticBodies: StaticBody[] = [];

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

  clear_() {
    this.staticBodies = [];
    this.staticGrid.clear();
  }

  *checkHitterColisions(
    hitter: DynamicBody,
  ): IterableIterator<StaticBodyColision> {
    hitter.contactPoints = [];
    const checked = new Set<StaticBody>();
    for (const cell of getCircleCells(hitter.pos, hitter.radius)) {
      for (const receiver of this.staticGrid.get(cell) || []) {
        if (!checked.has(receiver)) {
          checked.add(receiver);
          const result = checkCircleLineColision(
            hitter.pos,
            hitter.radius,
            receiver.start_,
            receiver.end_,
            hitter.vel,
          );
          if (result) {
            yield {
              receiver_: receiver,
              hitter,
              penetration: result[0],
              point: result[1],
            };
          }
        }
      }
    }
  }

  castRay(start_: Vector2, end_: Vector2) {
    const cells = getLineCells(start_, end_);

    for (const cell of cells) {
      if (this.staticGrid.has(cell)) {
        for (const body of this.staticGrid.get(cell)!) {
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
