import { Vector2 } from "./vector";

export interface Save {
  level: number;
  pos: { x: number; y: number };

  // maps a level id to an array of collected crystals ids
  crystals: { [key: number]: number[] };
}

export function loadSave(): Save {
  // JSON.parse returns null when provided with null
  return (
    JSON.parse(localStorage.getItem("tul_s")!) || {
      level: 0,
      pos: new Vector2(150, 200),
      crystals: {},
    }
  );
}

export function save(save: Save) {
  localStorage.setItem("tul_s", JSON.stringify(save));
}

export function clearSave() {
  localStorage.removeItem("tul_s");
}
