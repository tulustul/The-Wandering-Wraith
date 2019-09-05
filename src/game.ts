import { Engine } from "./engine";
import { loadSave, clearSave } from "./saves";
import { Menu } from "./menu";

export class Game {
  paused_ = true;

  engine!: Engine;

  menu: Menu;

  constructor(canvas_: HTMLCanvasElement) {
    this.engine = new Engine(this, canvas_);
    this.menu = new Menu(this);
  }

  start() {
    this.engine.load_(loadSave());

    setTimeout(() => {
      this.paused_ = false;
      this.menu.hide();
    }, 100);
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
