import { Game } from "./game";
import { MenuMode } from "./menu";

export class Control {
  keys_ = new Map<string, boolean>();

  constructor(private game: Game) {}

  init() {
    window.addEventListener("keydown", event => {
      this.keys_.set(event.code, true);

      if (event.key === "Escape") {
        if (this.game.menu.mode === MenuMode.stats) {
          this.game.menu.showCredits();
        } else if (this.game.menu.mode === MenuMode.credits) {
          this.game.startNewGame();
        } else {
          this.game.togglePause();
        }
      }
    });

    window.addEventListener("keyup", event => {
      this.keys_.set(event.code, false);
    });
  }
}
