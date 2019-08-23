import { Engine } from "./engine";
import { loadLevel } from "./loader";

export class Game {
  paused = true;

  isStarted = false;

  engine!: Engine;

  constructor(public canvas: HTMLCanvasElement) {
    this.engine = new Engine(this, canvas);
  }

  start() {
    loadLevel(this.engine, "a");
    this.engine.foliage.spawnFoliage(this.engine);

    this.engine.init();
    this.isStarted = true;

    this.paused = false;
    document.getElementsByTagName("div")[0].remove();
  }
}
