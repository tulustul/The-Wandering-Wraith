import { Engine } from "../engine";

export interface LayerOptions {
  canvas_?: HTMLCanvasElement;
  renderWholeWorld?: boolean;
  followPlayer?: boolean;
  fill_?: string;
  clear_?: boolean;
}

export class Layer {
  options: LayerOptions;

  followPlayer = true;

  fill_: string | null = null;

  renderWholeWorld = false;

  clear_ = true;

  canvas_!: HTMLCanvasElement;

  ctx!: CanvasRenderingContext2D;

  constructor(
    name: string,
    private engine: Engine,
    options: LayerOptions = {},
  ) {
    Object.assign(this, options);

    engine.renderer.compositor.layers[name] = this;

    if (!this.canvas_) {
      this.canvas_ = document.createElement("canvas");
    }

    this.ctx = this.canvas_.getContext("2d") as CanvasRenderingContext2D;
  }

  init() {
    this.updateSize();
    this.clearCanvas();
  }

  updateSize(force = true) {
    if (this.renderWholeWorld) {
      if (force) {
        this.canvas_.width = this.engine.level.size.x;
        this.canvas_.height = this.engine.level.size.y;
      }
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
    if (renderer.activeLayer) {
      renderer.activeLayer.ctx.restore();
    }

    renderer.activeLayer = this;
    renderer.ctx = this.ctx;

    if (this.clear_) {
      this.clearCanvas();
    }

    if (this.fill_) {
      this.ctx.fillStyle = this.fill_;
      this.ctx.fillRect(0, 0, this.canvas_.width, this.canvas_.height);
    }

    if (this.followPlayer) {
      this.ctx.save();
      this.ctx.translate(this.engine.camera.pos.x, this.engine.camera.pos.y);
    }
  }
}
