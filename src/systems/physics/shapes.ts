import { Vector2 } from "../../vector";
import { GRID_SIZE } from "./constants";
import { getIndexOfCell } from "./helpers";

function lineToPointColision(
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
    const length = line.start.distanceTo(line.end);
    const dot =
      ((this.pos.x - line.start.x) * (line.end.x - line.start.x) +
        (this.pos.y - line.start.y) * (line.end.y - line.start.y)) /
      Math.pow(length, 2);

    const closestPoint = new Vector2(
      line.start.x + dot * (line.end.x - line.start.x),
      line.start.y + dot * (line.end.y - line.start.y),
    );

    const onSegment = lineToPointColision(line.start, line.end, closestPoint);
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
      .sub(circle.pos)
      .mul(1 - d / radiusSum);

    const closestPoint = circle.pos.copy().add(
      penetration
        .copy()
        .normalize()
        .mul(circle.radius),
    );

    return [penetration, closestPoint];
  }

  getPenetration(p: Vector2) {
    const penetration = this.radius - this.pos.distanceTo(p);
    if (penetration > 0) {
      const angle = this.pos.directionTo(p);
      return new Vector2(0, 1).mul(-penetration).rotate(angle);
    }
    return null;
  }
}

export class LineShape extends Shape {
  constructor(public start: Vector2, public end: Vector2) {
    super();
  }

  *getCells() {
    const minX = Math.floor(Math.min(this.start.x, this.end.x) / GRID_SIZE);
    const maxX = Math.floor(
      Math.max(this.start.x, this.end.x - 1) / GRID_SIZE,
    );

    const minY = Math.floor(Math.min(this.start.y, this.end.y) / GRID_SIZE);
    const maxY = Math.floor(
      Math.max(this.start.y, this.end.y - 1) / GRID_SIZE,
    );

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        yield getIndexOfCell(x, y);
      }
    }
  }
}
