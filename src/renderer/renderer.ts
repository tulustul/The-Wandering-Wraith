import { Layer } from "./layer";
import { SystemsRenderer } from "./systems-renderer";
import { Compositor } from "./compositor";

import { Engine } from "../engine";

const VIEWPORT_HEIGHT = 350;

export class Renderer {
  ctx: CanvasRenderingContext2D;

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
      clear_: false,
      canvas_: this.engine.canvas_,
    });

    this.compositor.init();
  }

  render() {
    this.systemsRenderer.render();
    this.compositor.compose();
  }

  updateSize() {
    const width = (window.innerWidth / window.innerHeight) * VIEWPORT_HEIGHT;

    this.engine.canvas_.width = Math.floor(width);
    this.engine.canvas_.height = VIEWPORT_HEIGHT;

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
