import { Game } from "./game";

export class Menu {
  el = document.getElementById("m")!;
  optionsEl = document.getElementById("o")!;
  continueEl = document.getElementById("c")!;
  newGameEl = document.getElementById("n")!;

  constructor(game: Game) {
    this.continueEl.addEventListener("click", () => game.togglePause());
    this.newGameEl.addEventListener("click", () => game.startNewGame());
  }

  show() {
    this.el.classList.remove("h", "r");
    this.optionsEl.classList.remove("h");
  }

  hide() {
    this.el.classList.add("h");
    setTimeout(() => this.el.classList.add("r"), 300);
  }
}
