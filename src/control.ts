import { Game } from "./game";

export class Control {
  keys = new Map<string, boolean>();

  constructor(private game: Game) {}

  init() {
    window.addEventListener("keydown", event => {
      this.keys.set(event.code, true);

      if (event.key === "Escape") {
        if (this.game.isStarted) {
          this.game.paused = !this.game.paused;
        }
      }
    });

    window.addEventListener("keyup", event => {
      this.keys.set(event.code, false);
    });
  }
}
