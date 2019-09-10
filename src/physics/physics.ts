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
  receiver_: StaticBody;
  point: Vector2;
  penetration: Vector2;
}

export class PhysicsSystem {
  grid: Map<number, StaticBody[]> = new Map();

  staticBodies: StaticBody[] = [];

  addStatic(body: StaticBody) {
    this.staticBodies.push(body);
    for (const cell of getLineCells(body.start_, body.end_)) {
      if (!this.grid.has(cell)) {
        this.grid.set(cell, [body]);
      } else {
        this.grid.get(cell)!.push(body);
      }
    }
    return body;
  }

  clear_() {
    this.staticBodies = [];
    this.grid.clear();
  }

  *checkHitterColisions(
    hitter: DynamicBody,
  ): IterableIterator<StaticBodyColision> {
    hitter.contactPoints = [];
    const checked = new Set<StaticBody>();
    for (const cell of getCircleCells(hitter.pos, hitter.radius)) {
      for (const receiver of this.grid.get(cell) || []) {
        if (!checked.has(receiver)) {
          checked.add(receiver);
          const result = checkCircleLineColision(
            hitter.pos,
            hitter.radius,
            receiver.start_,
            receiver.end_,
          );
          if (result) {
            yield {
              receiver_: receiver,
              penetration: result[0],
              point: result[1],
            };
          }
        }
      }
    }
  }

  /** Casting rays supports only casting ray from top to bottom */
  castRay(start_: Vector2, end_: Vector2): Vector2 | null {
    const cells = getLineCells(start_, end_);

    const intersections: Vector2[] = [];
    for (const cell of cells) {
      if (this.grid.has(cell)) {
        for (const body of this.grid.get(cell)!) {
          const intersection = lineToLineColision(
            start_,
            end_,
            body.start_,
            body.end_,
          );
          if (intersection) {
            intersections.push(intersection);
          }
        }
      }
    }

    if (intersections.length) {
      return intersections.sort((p1, p2) => p1.y - p2.y)[0];
    }

    return null;
  }
}
