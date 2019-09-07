import { Game } from "./game";
import { Save } from "./saves";

export const enum MenuMode {
  menu,
  stats,
  credits,
}

export class Menu {
  tintEl = document.getElementsByTagName("t")[0];
  optionsEl = document.getElementById("o")!;

  continueEl = document.getElementById("c")!;
  newGameEl = document.getElementById("n")!;

  finishScreenEl = document.getElementById("f")!;
  crystalsEl = document.getElementById("p")!;
  deathsEl = document.getElementById("d")!;

  creditsEl = document.getElementById("r")!;

  mode: MenuMode = MenuMode.menu;

  constructor(game: Game) {
    this.continueEl.addEventListener("click", () => game.togglePause());
    this.newGameEl.addEventListener("click", () => game.startNewGame());
  }

  private showTint() {
    this.tintEl.classList.remove("r");
    this.optionsEl.classList.add("r");
    this.finishScreenEl.classList.add("r");
    this.creditsEl.classList.add("r");
  }

  show() {
    this.showTint();
    this.optionsEl.classList.remove("r");
  }

  hide() {
    this.tintEl.classList.add("r");
    setTimeout(() => this.tintEl.classList.add("r"), 300);
  }

  finish(save: Save) {
    this.showTint();
    this.mode = MenuMode.stats;
    this.finishScreenEl.classList.remove("r");
    this.crystalsEl.innerText = Object.values(save.crystals)
      .reduce<number>((acc, c) => acc + c.length, 0)
      .toString();
    this.deathsEl.innerText = localStorage.getItem("tul_d") || "0";
  }

  showCredits() {
    this.mode = MenuMode.credits;
    this.finishScreenEl.classList.add("r");
    this.creditsEl.classList.remove("r");
  }
}
