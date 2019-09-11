import { Engine } from "./engine";
import { loadSave, clearSave } from "./saves";
import { Menu, MenuMode } from "./menu";

export class Game {
  stopped_ = true;

  engine!: Engine;

  menu: Menu;

  constructor(canvas_: HTMLCanvasElement) {
    this.engine = new Engine(this, canvas_);
    this.menu = new Menu(this);
  }

  start() {
    this.engine.load_(loadSave());
  }

  togglePause() {
    this.stopped_ = !this.stopped_;
    this.stopped_ ? this.menu.show() : this.menu.hide();
  }

  startNewGame() {
    this.menu.mode = MenuMode.menu;
    localStorage.removeItem("tww_d"); // clear deaths count
    localStorage.removeItem("tww_t"); // clear stopwatch
    this.engine.gameTime = 0;
    clearSave();
    this.start();
    this.stopped_ = false;
    this.menu.hide();
  }
}
