import { Engine } from "./engine";
import { loadLevel } from "./loader";
import { LineShape } from "./systems/physics/shapes";
import { Vector2 } from "./vector";
import { GROUND_MASK } from "./colisions-masks";
import { Save, loadSave, clearSave } from "./saves";
import { Menu } from "./menu";

export class Game {
  paused_ = true;

  engine!: Engine;

  menu: Menu;

  constructor(public canvas: HTMLCanvasElement) {
    this.engine = new Engine(this, canvas);
    this.menu = new Menu(this);
  }

  start() {
    this.engine.load(loadSave());

    setTimeout(() => {
      this.paused_ = false;
      this.menu.hide();
    }, 100);

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

  togglePause() {
    this.paused_ = !this.paused_;
    this.paused_ ? this.menu.show() : this.menu.hide();
  }

  startNewGame() {
    clearSave();
    this.start();
  }
}
