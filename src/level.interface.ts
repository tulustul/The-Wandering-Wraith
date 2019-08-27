import { Vector2 } from "./vector";

export enum PathCommandType {
  move,
  line,
  bezier,
  close,
}

export interface PathSegment {
  type: PathCommandType;
  points?: Vector2[];
}

export interface Level {
  pathCommands: PathSegment[];
}
