import { Engine } from "./engine";
import { loadLevel } from "./loader";
import { LineShape } from "./systems/physics/shapes";
import { Vector2 } from "./vector";
import { GROUND_MASK } from "./colisions-masks";

export class Game {
  paused_ = true;

  isStarted = false;

  engine!: Engine;

  constructor(public canvas: HTMLCanvasElement) {
    this.engine = new Engine(this, canvas);
  }

  start() {
    loadLevel(this.engine, 0);
    this.engine.foliage.spawnFoliage(this.engine);

    this.engine.init();
    this.isStarted = true;

    this.paused_ = false;
    document.getElementsByTagName("div")[0].remove();

    // this.engine.physics.addStatic({
    //   shape_: new LineShape(new Vector2(1100, 910), new Vector2(1300, 910)),
    //   receiveMask: GROUND_MASK,
    //   pos: new Vector2(0, 0),
    //   isDeadly: false,
    // });
    // this.engine.physics.addStatic({
    //   shape_: new LineShape(new Vector2(1200, 910), new Vector2(1200, 850)),
    //   receiveMask: GROUND_MASK,
    //   pos: new Vector2(0, 0),
    //   isDeadly: false,
    // });
  }
}
