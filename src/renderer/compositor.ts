import { Layer } from "./layer";
import { Engine } from "../engine";

type BlendMode =
  | "source-over"
  | "destination-in"
  | "multiply"
  | "overlay"
  | "lighten";

interface CompositorEntry {
  source_?: string;
  target_?: string;
  blendMode?: BlendMode;
  offset_?: boolean;
  offsetScale?: number;
}

// missing fields just repeat from the last entry
const COMPOSITOR_ENTRIES: CompositorEntry[] = [
  {
    target_: "base",
    source_: "background",
    blendMode: "source-over",
    offset_: false,
    offsetScale: 0.3,
  },
  {
    target_: "base",
    source_: "hills1",
    blendMode: "source-over",
    offset_: true,
    offsetScale: 0.1,
  },
  {
    target_: "base",
    source_: "hills2",
    blendMode: "source-over",
    offset_: true,
    offsetScale: 0.15,
  },
  {
    target_: "base",
    source_: "hills3",
    blendMode: "source-over",
    offset_: true,
    offsetScale: 0.2,
  },
  {
    target_: "base",
    source_: "foliageBackground",
    blendMode: "source-over",
    offset_: false,
  },
  {
    target_: "base",
    source_: "terrain",
    blendMode: "source-over",
    offset_: true,
  },
  {
    target_: "base",
    source_: "movingProps",
    blendMode: "source-over",
    offset_: false,
  },
  {
    target_: "base",
    source_: "foliageForeground",
    blendMode: "source-over",
    offset_: false,
  },
];

export class Compositor {
  constructor(private engine: Engine) {}

  layers: { [key: string]: Layer } = {};

  get canvas_() {
    return this.engine.canvas_;
  }

  init() {
    for (const layer of Object.values(this.layers)) {
      layer.init();
    }
  }

  compose() {
    let entry: CompositorEntry = {};

    for (const nextEntry of COMPOSITOR_ENTRIES) {
      if (nextEntry.target_ === "base") {
        this.layers["base"].activate();
      }

      entry = { ...entry, ...nextEntry };

      const target = this.layers[entry.target_ as string];
      const source = this.layers[entry.source_ as string];

      target.ctx.globalCompositeOperation = entry.blendMode as BlendMode;

      const offsetScale = nextEntry.offsetScale || 1;

      if (entry.offset_) {
        this.drawLayerWithCameraOffset(target, source, offsetScale);
      } else {
        target.ctx.drawImage(source.canvas_, 0, 0);
      }
    }
  }

  drawLayerWithCameraOffset(
    target: Layer,
    source: Layer,
    offsetScale: number,
  ) {
    target.ctx.drawImage(
      source.canvas_,
      -this.engine.camera.pos.x * offsetScale,
      -this.engine.camera.pos.y * offsetScale,
      this.canvas_.width,
      this.canvas_.height,
      0,
      0,
      this.canvas_.width,
      this.canvas_.height,
    );
    target.ctx.restore();
  }
}
