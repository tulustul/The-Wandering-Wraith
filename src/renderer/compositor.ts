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
  offsetScale?: number;
}

// missing fields just repeat from the last entry
const COMPOSITOR_ENTRIES: CompositorEntry[] = [
  {
    target: "base",
    source: "background",
    blendMode: "source-over",
    offset: true,
    offsetScale: 0.3,
  },
  {
    target: "base",
    source: "hills1",
    blendMode: "source-over",
    offset: true,
    offsetScale: 0.1,
  },
  {
    target: "base",
    source: "hills2",
    blendMode: "source-over",
    offset: true,
    offsetScale: 0.15,
  },
  {
    target: "base",
    source: "hills3",
    blendMode: "source-over",
    offset: true,
    offsetScale: 0.2,
  },
  {
    target: "base",
    source: "terrain",
    blendMode: "source-over",
    offset: true,
  },
  {
    target: "base",
    source: "trees",
    blendMode: "source-over",
    offset: false,
  },
  {
    target: "base",
    source: "movingProps",
    blendMode: "source-over",
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

      const offsetScale = nextEntry.offsetScale || 1;

      if (entry.offset) {
        this.drawLayerWithCameraOffset(target, source, offsetScale);
      } else {
        target.context.drawImage(source.canvas, 0, 0);
      }
    }
  }

  drawLayerWithCameraOffset(
    target: Layer,
    source: Layer,
    offsetScale: number,
  ) {
    target.context.drawImage(
      source.canvas,
      -this.camera.pos.x * offsetScale,
      -this.camera.pos.y * offsetScale,
      this.canvas.width,
      this.canvas.height,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
    target.context.restore();
  }
}
