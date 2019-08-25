import { prepareAssets } from "./assets";
import { Game } from "./game";

let cumulativeTime = 0;
const timeStep = 1000 / 60;

let game: Game;

async function init() {
  await prepareAssets();

  const canvas = document.getElementsByTagName("canvas")[0];

  game = new Game(canvas);
  game.start();

  requestAnimationFrame(tick);

  // window.addEventListener("visibilitychange", () => {
  //   game.paused = true;
  // });

  window.addEventListener("resize", () => game.engine.renderer.updateSize());
}

function tick(timestamp: number) {
  const timeDiff = timestamp - cumulativeTime;
  const steps = Math.floor(timeDiff / timeStep);
  cumulativeTime += steps * timeStep;

  if (!game.paused) {
    for (let i = 0; i < steps; i++) {
      game.engine.update(timeStep);
    }
  }
  game.engine.camera.update();
  game.engine.renderer.render();
  requestAnimationFrame(tick);
}

init();
