import { prepareAssets } from "./assets";
import { Game } from "./game";
import { playMusic } from "./music";

let cumulativeTime = 0;
const timeStep = 1000 / 60;

let game: Game;

async function init() {
  await prepareAssets();

  const canvas = document.getElementsByTagName("canvas")[0];

  game = new Game(canvas);
  game.start();

  requestAnimationFrame(tick);

  window.addEventListener("resize", () => game.engine.renderer.updateSize());
}

export function tick(timestamp: number) {
  const timeDiff = timestamp - cumulativeTime;
  const steps = Math.floor(timeDiff / timeStep);
  cumulativeTime += steps * timeStep;

  for (let i = 0; i < steps; i++) {
    game.engine.update_(timeStep);
  }
  game.engine.camera.update_();
  game.engine.renderer.render();
  requestAnimationFrame(tick);
  playMusic(cumulativeTime);
}

init();
