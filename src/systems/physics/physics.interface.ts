import { Vector2 } from "../../vector";
import { Shape } from "./shapes";

export interface PhysicalEntity {
  pos: Vector2;
  shape: Shape;
  receiveMask: number;
  parent?: any;
}

export interface DynamicPhysicalEntity extends PhysicalEntity {
  vel: Vector2;
  friction: number;
  weight: number;
  bounciness: number;
  hitMask: number;
}

export interface Colision {
  hitter: DynamicPhysicalEntity;
  receiver: PhysicalEntity;
  force: Vector2;
}
