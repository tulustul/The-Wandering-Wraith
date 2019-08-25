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
  absTo: Vector2;
}

export interface LineCommand extends MoveCommand, PathSegment {
  type: "lineTo";
  absTo: Vector2;
  relTo: Vector2;
}

export interface BezierCommand extends MoveCommand, PathSegment {
  type: "bezierTo";
  relFrom: Vector2;
  absTo: Vector2;
  relTo: Vector2;
  absC1: Vector2;
  relC1: Vector2;
  absC2: Vector2;
  relC2: Vector2;
}

export interface CloseCommand extends PathCommand {
  type: "close";
}

export interface Level {
  pathCommands: PathCommand[];
  pointToCommandMap: Map<Vector2, PathCommand>;
}
