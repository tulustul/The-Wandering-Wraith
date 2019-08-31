import { Game } from "./game";

export class Control {
  keys_ = new Map<string, boolean>();

  constructor(private game: Game) {}

  init() {
    window.addEventListener("keydown", event => {
      this.keys_.set(event.code, true);

      if (event.key === "Escape") {
        this.game.togglePause();
      }
    });

    window.addEventListener("keyup", event => {
      this.keys_.set(event.code, false);
    });
  }
}
