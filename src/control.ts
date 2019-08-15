import { Vector2 } from "./vector";

import { PlayerSystem } from "./systems/player";
import { Game } from "./game";

export class Control {
  keys = new Map<string, boolean>();

  mouseButtons = new Map<number, boolean>();

  mousePos = new Vector2();

  rot = 0;

  constructor(private game: Game) {}

  init() {
    window.addEventListener("keydown", event => {
      this.keys.set(event.code, true);

      if (event.key === "Escape") {
        if (this.game.isStarted) {
          this.game.paused = !this.game.paused;
        }
      }

      if (!this.game.paused) {
        const playerSystem = this.game.engine.getSystem<PlayerSystem>(
          PlayerSystem,
        );

        if (!playerSystem.player) {
          return;
        }
      }
    });

    window.addEventListener("keyup", event => {
      this.keys.set(event.code, false);
    });
  }
}
