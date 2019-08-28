import { Vector2 } from "./vector";

export enum PathCommandType {
  move,
  line,
  bezier,
  close,
}

export interface PathCommand {
  type: PathCommandType;
  points?: Vector2[];
}

export interface Level {
  size: Vector2;
  pathCommands: PathCommand[];

  // #if process.env.NODE_ENV === 'development'
  pointToCommandMap?: Map<Vector2, PathCommand>;
  // #endif
}
