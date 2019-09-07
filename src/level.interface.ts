import { Vector2 } from "./vector";
import { ObjectType } from "./editor/objects";

export const enum PickableType {
  crystal,
  gravityCrystal,
  bubble,
}

export const enum PathCommandType {
  move,
  line,
  bezier,
  close,
}

export interface CanBeDeadly {
  isDeadly: boolean;
}

export interface Pickable {
  type: PickableType;
  pos: Vector2;
  collected: boolean;
  radius: number;
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

export interface Level {
  size_: Vector2;
  startingPos: number; // y coordinate
  pathCommands: PathCommand[];
  platforms: Platform[];
  savepoints: number[];
  pickables: Pickable[];

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
