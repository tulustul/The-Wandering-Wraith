import { Vector2 } from "../../vector";
import { GRID_SIZE } from "./constants";
import { getIndexOfCell } from "./helpers";

export function lineToPointColision(
  lineStart: Vector2,
  lineEnd: Vector2,
  point: Vector2,
) {
  // get distance from the point to the two ends of the line
  const d1 = lineStart.distanceTo(point);
  const d2 = lineEnd.distanceTo(point);

  // get the length of the line
  const lineLen = lineStart.distanceTo(lineEnd);

  // since floats are so minutely accurate, add
  // a little buffer zone that will give collision
  const buffer = 0.1; // higher # = less accurate

  // if the two distances are equal to the line's
  // length, the point is on the line!
  // note we use the buffer here to give a range,
  // rather than one #
  return d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer;
}

export abstract class Shape {
  abstract getCells(): IterableIterator<number>;
  checkColisionWithLine(line: LineShape): [Vector2, Vector2] | null {
    return null;
  }
  checkColisionWithCircle(circle: CircleShape): [Vector2, Vector2] | null {
    return null;
  }
}

export class PointShape extends Shape {
  constructor(public pos: Vector2) {
    super();
  }

  *getCells() {
    yield getIndexOfCell(
      Math.floor(this.pos.x / GRID_SIZE),
      Math.floor(this.pos.y / GRID_SIZE),
    );
  }
}

export class CircleShape extends Shape {
  constructor(public pos: Vector2, public radius: number) {
    super();
  }

  *getCells() {
    const minX = Math.floor((this.pos.x - this.radius) / GRID_SIZE);
    const maxX = Math.floor((this.pos.x + this.radius - 1) / GRID_SIZE);

    const minY = Math.floor((this.pos.y - this.radius) / GRID_SIZE);
    const maxY = Math.floor((this.pos.y + this.radius - 1) / GRID_SIZE);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        yield getIndexOfCell(x, y);
      }
    }
  }

  checkColisionWithLine(line: LineShape): [Vector2, Vector2] | null {
    const length = line.start_.distanceTo(line.end_);
    const dot =
      ((this.pos.x - line.start_.x) * (line.end_.x - line.start_.x) +
        (this.pos.y - line.start_.y) * (line.end_.y - line.start_.y)) /
      Math.pow(length, 2);

    const closestPoint = new Vector2(
      line.start_.x + dot * (line.end_.x - line.start_.x),
      line.start_.y + dot * (line.end_.y - line.start_.y),
    );

    const onSegment = lineToPointColision(
      line.start_,
      line.end_,
      closestPoint,
    );
    if (!onSegment) {
      return null;
    }

    const penetration = this.getPenetration(closestPoint);
    if (!penetration) {
      return null;
    }

    return [penetration, closestPoint];
  }

  checkColisionWithCircle(circle: CircleShape): [Vector2, Vector2] | null {
    const d = this.pos.distanceTo(circle.pos);
    const radiusSum = this.radius + circle.radius;
    if (d > radiusSum) {
      return null;
    }

    const penetration = this.pos
      .copy()
      .sub_(circle.pos)
      .mul(1 - d / radiusSum);

    const closestPoint = circle.pos.copy().add_(
      penetration
        .copy()
        .normalize_()
        .mul(circle.radius),
    );

    return [penetration, closestPoint];
  }

  getPenetration(p: Vector2) {
    const penetration = this.radius - this.pos.distanceTo(p);
    if (penetration > 0) {
      const angle = this.pos.directionTo(p);
      return new Vector2(0, 1).mul(-penetration).rotate_(angle);
    }
    return null;
  }
}

export class LineShape extends Shape {
  constructor(public start_: Vector2, public end_: Vector2) {
    super();
  }

  *getCells() {
    const minX = Math.floor(Math.min(this.start_.x, this.end_.x) / GRID_SIZE);
    const maxX = Math.floor(
      Math.max(this.start_.x, this.end_.x - 1) / GRID_SIZE,
    );

    const minY = Math.floor(Math.min(this.start_.y, this.end_.y) / GRID_SIZE);
    const maxY = Math.floor(
      Math.max(this.start_.y, this.end_.y - 1) / GRID_SIZE,
    );

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        yield getIndexOfCell(x, y);
      }
    }
  }
}
