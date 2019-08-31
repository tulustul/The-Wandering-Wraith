import { Vector2 } from "./vector";

export enum PathCommandType {
  move,
  line,
  bezier,
  close,
}

export interface CanBeDeadly {
  isDeadly: boolean;
}

export interface PathCommand extends CanBeDeadly {
  type: PathCommandType;
  points?: Vector2[];
}

export interface LevelObject extends CanBeDeadly {
  type: string;
  pos: Vector2;
}

export interface Platform extends CanBeDeadly {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Level {
  size: Vector2;
  pathCommands: PathCommand[];
  platforms: Platform[];
  savepoints: number[];

  editorPathCommands?: PathCommand[];
  pointToCommandMap?: Map<Vector2, PathCommand>;
  objects?: LevelObject[];
}
