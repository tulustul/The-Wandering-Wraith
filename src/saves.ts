import { Vector2 } from "./vector";

export interface Save {
  level_: number;
  pos: { x: number; y: number } | null;

  // maps a level id to an array of collected crystals ids
  crystals: { [key: number]: number[] };
}

export function loadSave(): Save {
  // JSON.parse returns null when provided with null
  return (
    JSON.parse(localStorage.getItem("tww_s")!) || {
      level_: 0,
      pos: null,
      crystals: {},
    }
  );
}

export function save_(save: Save) {
  localStorage.setItem("tww_s", JSON.stringify(save));
}

export function clearSave() {
  localStorage.removeItem("tww_s");
}
