import { Vector2 } from "../../vector";
import { GRID_SIZE } from "./constants";
import { getIndexOfCell } from "./helpers";

export function lineToPointColision(
  lineStart: Vector2,
  lineEnd: Vector2,
  point: Vector2,
) {
  const d1 = lineStart.distanceTo(point);
  const d2 = lineEnd.distanceTo(point);

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

export function* getCircleCells(pos: Vector2, r: number) {
  const minX = Math.floor((pos.x - r) / GRID_SIZE);
  const maxX = Math.floor((pos.x + r - 1) / GRID_SIZE);

  const minY = Math.floor((pos.y - r) / GRID_SIZE);
  const maxY = Math.floor((pos.y + r - 1) / GRID_SIZE);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      yield getIndexOfCell(x, y);
    }
  }
}

export function lineToLineColision(
  a1: Vector2,
  a2: Vector2,
  b1: Vector2,
  b2: Vector2,
) {
  // calculate the distance to intersection point
  const uA =
    ((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) /
    ((b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y));
  const uB =
    ((a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)) /
    ((b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y));

  // if uA and uB are between 0-1, lines are colliding
  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    return new Vector2(a1.x + uA * (a2.x - a1.x), a1.y + uA * (a2.y - a1.y));
  }
  return null;
}

export function* getLineCells(start_: Vector2, end_: Vector2) {
  const minX = Math.floor(Math.min(start_.x, end_.x) / GRID_SIZE);
  const maxX = Math.floor(Math.max(start_.x, end_.x - 1) / GRID_SIZE);

  const minY = Math.floor(Math.min(start_.y, end_.y) / GRID_SIZE);
  const maxY = Math.floor(Math.max(start_.y, end_.y - 1) / GRID_SIZE);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      yield getIndexOfCell(x, y);
    }
  }
}

export function checkCircleLineColision(
  cPos: Vector2,
  r: number,
  lineStart: Vector2,
  lineEnd: Vector2,
  vel: Vector2,
): [Vector2, Vector2] | null {
  const length = lineStart.distanceTo(lineEnd);
  const dot =
    ((cPos.x - lineStart.x) * (lineEnd.x - lineStart.x) +
      (cPos.y - lineStart.y) * (lineEnd.y - lineStart.y)) /
    Math.pow(length, 2);

  const closestPoint = new Vector2(
    lineStart.x + dot * (lineEnd.x - lineStart.x),
    lineStart.y + dot * (lineEnd.y - lineStart.y),
  );

  const onSegment = lineToPointColision(lineStart, lineEnd, closestPoint);
  if (!onSegment) {
    return null;
  }

  const penetrationDistance = r - cPos.distanceTo(closestPoint);
  if (penetrationDistance < 0) {
    return null;
  }

  // console.log("is-colision");

  const angle = cPos.directionTo(closestPoint);
  const penetrationVec = new Vector2(0, 1)
    .mul(penetrationDistance)
    .rotate_(angle);

  // fix tunneling when circle center passed the line.
  // console.log(
  //   penetrationVec
  //     .copy()
  //     .normalize_()
  //     .angleTo(vel.copy().normalize_()),
  // );
  // console.log(penetrationVec.copy().normalize_(), vel.copy().normalize_());
  if (
    Math.abs(
      penetrationVec
        .copy()
        .normalize_()
        .angleTo(vel.copy().normalize_()),
    ) >
    Math.PI / 2
  ) {
    penetrationVec.mul(-1);
    penetrationVec.normalize_().mul(penetrationDistance - r * 2);
    // console.log("tunneling prevetion", penetrationVec);
  }

  return [penetrationVec, closestPoint];
}

export function checkCircleCircleColision(
  pos1: Vector2,
  r1: number,
  pos2: Vector2,
  r2: number,
): boolean {
  const d = pos1.distanceTo(pos2);
  const radiusSum = r1 + r2;
  return d > radiusSum;
}

export function getCirclePenetration(cPos: Vector2, r: number, p: Vector2) {}
