import { Vector2 } from "../../vector";
import { Shape } from "./shapes";

export interface PhysicalEntityDefinition {
  pos: Vector2;
  shape: Shape;
  receiveMask: number;
  parent?: any;
}

export interface DynamicPhysicalEntityDefinition
  extends PhysicalEntityDefinition {
  vel: Vector2;
  friction: number;
  weight: number;
  bounciness: number;
  hitMask: number;
}

export interface Colision {
  hitter: DynamicPhysicalEntity;
  receiver: PhysicalEntityDefinition;
  point: Vector2;
  penetration: Vector2;
}

export interface DynamicPhysicalEntity
  extends DynamicPhysicalEntityDefinition {
  contactPoints: Vector2[];
}
