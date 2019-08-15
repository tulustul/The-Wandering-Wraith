import { Renderer } from "./renderer";
import { Layer } from "./layer";

type BlendMode =
  | "source-over"
  | "destination-in"
  | "multiply"
  | "overlay"
  | "lighten";

interface CompositorEntry {
  source?: string;
  target?: string;
  blendMode?: BlendMode;
  offset?: boolean;
}

// missing fields just repeat from the last entry
const COMPOSITOR_ENTRIES: CompositorEntry[] = [
  {
    target: "movingProps",
    source: "terrain",
    blendMode: "lighten",
    offset: false,
  },
  {
    target: "base",
    source: "movingProps",
    blendMode: "lighten",
    offset: false,
  },
];

export class Compositor {
  constructor(private renderer: Renderer) {}

  layers: { [key: string]: Layer } = {};

  get camera() {
    return this.renderer.game.camera;
  }

  get canvas() {
    return this.renderer.game.canvas;
  }

  init() {
    for (const layer of Object.values(this.layers)) {
      layer.init();
    }
  }

  compose() {
    const entry: CompositorEntry = {};

    for (const nextEntry of COMPOSITOR_ENTRIES) {
      if (nextEntry.target === "base") {
        this.layers.base.activate();
      }

      Object.assign(entry, nextEntry);

      const target = this.layers[entry.target as string];
      const source = this.layers[entry.source as string];

      target.context.globalCompositeOperation = entry.blendMode as BlendMode;

      if (entry.offset) {
        this.drawLayerWithCameraOffset(target, source);
      } else {
        target.context.drawImage(source.canvas, 0, 0);
      }
    }
  }

  drawLayerWithCameraOffset(target: Layer, source: Layer) {
    target.context.drawImage(
      source.canvas,
      -this.camera.pos.x,
      -this.camera.pos.y,
      this.canvas.width,
      this.canvas.height,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
  }
}
