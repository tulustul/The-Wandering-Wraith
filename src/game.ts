import { Engine } from "./engine";
import { loadSave, clearSave } from "./saves";
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
