import { Vector2 } from "./vector";
import { ObjectType } from "./editor/objects";

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

export interface Platform extends CanBeDeadly {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Crystal {
  collected: boolean;
  pos: Vector2;
}

export interface Level {
  size: Vector2;
  pathCommands: PathCommand[];
  platforms: Platform[];
  savepoints: number[];
  crystals: Crystal[];

  // Below are properties present only in development build.
  // Needed for editor to work.

  // TODO Should be more general then PathCommand
  pointToCommandMap?: Map<Vector2, PathCommand>;

  objects?: LevelObject[];
}

// Development only interface needed for editor.
export interface LevelObject extends CanBeDeadly {
  type: ObjectType;
  pos: Vector2;
}
