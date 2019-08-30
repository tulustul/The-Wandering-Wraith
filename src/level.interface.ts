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

export interface LevelObject {
  type: string;
  pos: Vector2;
}

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Level {
  size: Vector2;
  pathCommands: PathCommand[];
  platforms: Platform[];

  editorPathCommands?: PathCommand[];
  pointToCommandMap?: Map<Vector2, PathCommand>;
  objects?: LevelObject[];
}
