import { Layer } from "./layer";
import { SystemsRenderer } from "./systems-renderer";
import { Compositor } from "./compositor";

import { Engine } from "../engine";

const VIEWPORT_HEIGHT = 350;

export class Renderer {
  context: CanvasRenderingContext2D;

  baseLayer: Layer;

  systemsRenderer: SystemsRenderer;

  compositor: Compositor;

  activeLayer: Layer;

  constructor(public engine: Engine) {}

  init() {
    this.compositor = new Compositor(this.engine);

    this.systemsRenderer = new SystemsRenderer(this.engine);

    this.baseLayer = new Layer("base", this.engine, {
      followPlayer: false,
      clear: false,
      canvas: this.engine.canvas,
    });

    this.compositor.init();
  }

  render() {
    this.systemsRenderer.render();
    this.compositor.compose();
  }

  updateSize() {
    const width = (window.innerWidth / window.innerHeight) * VIEWPORT_HEIGHT;

    this.engine.canvas.width = Math.floor(width);
    this.engine.canvas.height = VIEWPORT_HEIGHT;

    if (this.compositor) {
      for (const layer of Object.values(this.compositor.layers)) {
        layer.updateSize(false);
      }
    }
    if (this.systemsRenderer) {
      this.systemsRenderer.prerender();
    }
  }
}
