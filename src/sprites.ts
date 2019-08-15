export interface SpriteMetadata {
  x: number;
  y: number;
  w: number;
  h: number;
}

type SpriteMap = {[key: string]: SpriteMetadata};

export const SPRITES_MAP: SpriteMap = {
  stone: {x: 0, y: 0, w: 20, h: 20},
  wood: {x: 0, y: 40, w: 20, h: 20},
  tiles: {x: 40, y: 40, w: 20, h: 20},
  carpetBorder: {x: 60, y: 22, w: 20, h: 3},
  carpet: {x: 60, y: 25, w: 20, h: 20},
  tableBorder: {x: 60, y: 45, w: 20, h: 2},
  table: {x: 60, y: 47, w: 47, h: 20},
  wall: {x: 0, y: 20, w: 20, h: 20},
  body: {x: 20, y: 0, w: 17, h: 10},
  armsFisting: {x: 20, y: 10, w: 16, h: 12},
  armsFree: {x: 34, y: 60, w: 16, h: 6},
  armsGrabbing: {x: 34, y: 66, w: 16, h: 9},
  corpse: {x: 42, y: 0, w: 35, h: 21},
  door: {x: 20, y: 40, w: 20, h: 20},
  light: {x: 20, y: 30, w: 5, h: 10},
  lightBroken: {x: 25, y: 30, w: 5, h: 10},
  chair: {x: 41, y: 22, w: 19, h: 16},
  hidden: {x: 30, y: 24, w: 9, h: 4},
  visible: {x: 30, y: 28, w: 9, h: 5},
  reload: {x: 30, y: 33, w: 7, h: 4},
  pickablePistol: {x: 0, y: 60, w: 16, h: 7},
  pickableMG: {x: 0, y: 67, w: 16, h: 7},
  pickableMinigun: {x: 0, y: 73, w: 16, h: 7},
  gunPistol: {x: 16, y: 60, w: 6, h: 15},
  gunMG: {x: 22, y: 60, w: 6, h: 15},
  gunMinigun: {x: 28, y: 60, w: 6, h: 15},
}
