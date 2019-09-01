import { Vector2 } from "../../vector";

export interface Body {
  receiveMask: number;
  parent?: any;
  isDeadly: boolean;
}

export interface StaticBody extends Body {
  start_: Vector2;
  end_: Vector2;
}

export interface DynamicBodyDefinition extends Body {
  pos: Vector2;
  vel: Vector2;
  friction: number;
  hitMask: number;
  radius: number;
  onCollide?: () => void;
}

export interface DynamicBody extends DynamicBodyDefinition {
  oldPos: Vector2;
  contactPoints: Vector2[];
}

export interface StaticBodyColision {
  hitter: DynamicBody;
  receiver: StaticBody;
  point: Vector2;
  penetration: Vector2;
}
