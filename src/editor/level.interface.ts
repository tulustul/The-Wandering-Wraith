import { Vector2 } from "../vector";

export interface PathSegment {
  mask: number;
  isDeadly: boolean;
}

export interface PathCommand {
  type:
    | "moveTo"
    | "lineTo"
    | "bezierTo"
    | "close"
    | "tinyPlatform"
    | "mediumPlatform"
    | "longPlatform";
}

export interface MoveCommand extends PathCommand {
  type: "moveTo" | "lineTo" | "bezierTo";
  to: Vector2;
}

export interface LineCommand extends MoveCommand, PathSegment {
  type: "lineTo";
  to: Vector2;
}

export interface BezierCommand extends MoveCommand, PathSegment {
  type: "bezierTo";
  from: Vector2;
  to: Vector2;
  c1: Vector2;
  c2: Vector2;
}

export interface CloseCommand extends PathCommand {
  type: "close";
}

export interface Level {
  size: Vector2;
  pathCommands: PathCommand[];
  pointToCommandMap: Map<Vector2, PathCommand>;
}
