import { Layer } from "./layer";
import { SystemsRenderer } from "./systems-renderer";
import { Compositor } from "./compositor";

import { Game } from "../game";

const VIEWPORT_HEIGHT = 800;

export class Renderer {
  context: CanvasRenderingContext2D;

  baseLayer: Layer;

  systemsRenderer: SystemsRenderer;

  compositor: Compositor;

  activeLayer: Layer;

  constructor(public game: Game) {}

  init() {
    this.compositor = new Compositor(this);

    this.systemsRenderer = new SystemsRenderer(this);

    this.baseLayer = new Layer("base", this, {
      followPlayer: false,
      fill: "black",
      canvas: this.game.canvas,
    });

    this.compositor.init();
  }

  render() {
    this.systemsRenderer.render();

    this.compositor.compose();
  }

  updateSize() {
    const width = (window.innerWidth / window.innerHeight) * VIEWPORT_HEIGHT;

    this.game.canvas.width = Math.floor(width);
    this.game.canvas.height = VIEWPORT_HEIGHT;

    if (this.compositor) {
      for (const layer of Object.values(this.compositor.layers)) {
        layer.updateSize(false);
      }
    }
  }
}
