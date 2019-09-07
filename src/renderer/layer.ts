import { Engine } from "../engine";

export interface LayerOptions {
  canvas_?: HTMLCanvasElement;
  renderWholeWorld?: boolean;
  clear_?: boolean;
  offset_?: boolean;
  offsetScale?: number;
}

export class Layer {
  static layers: Layer[] = [];

  renderWholeWorld = false;

  clear_ = false;

  offset_ = false;

  offsetScale = 1;

  canvas_!: HTMLCanvasElement;

  ctx!: CanvasRenderingContext2D;

  constructor(private engine: Engine, options: LayerOptions = {}) {
    Layer.layers.push(this);
    Object.assign(this, options);

    if (!this.canvas_) {
      this.canvas_ = document.createElement("canvas");
    }

    this.ctx = this.canvas_.getContext("2d") as CanvasRenderingContext2D;
  }

  updateSize() {
    if (this.renderWholeWorld) {
      this.canvas_.width = this.engine.level_.size_.x;
      this.canvas_.height =
        this.offsetScale === 1
          ? this.engine.level_.size_.y
          : this.engine.canvas_.height;
    } else {
      this.canvas_.width = this.engine.canvas_.width;
      this.canvas_.height = this.engine.canvas_.height;
    }
    this.clearCanvas();
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
  }

  activate() {
    const renderer = this.engine.renderer;

    renderer.activeLayer = this;
    renderer.ctx = this.ctx;

    if (this.clear_) {
      this.clearCanvas();
    }
  }
}
