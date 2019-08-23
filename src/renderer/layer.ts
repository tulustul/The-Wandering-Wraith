import { Engine } from "../engine";

export interface LayerOptions {
  canvas?: HTMLCanvasElement;
  renderWholeWorld?: boolean;
  followPlayer?: boolean;
  fill?: string;
  clear?: boolean;
}

export class Layer {
  options: LayerOptions;

  followPlayer = true;

  fill: string | null = null;

  renderWholeWorld = false;

  clear = true;

  canvas!: HTMLCanvasElement;

  context!: CanvasRenderingContext2D;

  constructor(
    name: string,
    private engine: Engine,
    options: LayerOptions = {},
  ) {
    Object.assign(this, options);

    engine.renderer.compositor.layers[name] = this;

    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
    }

    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  init() {
    this.updateSize();
    this.clearCanvas();
  }

  updateSize(force = true) {
    if (this.renderWholeWorld) {
      if (force) {
        this.canvas.width = this.engine.worldWidth;
        this.canvas.height = this.engine.worldHeight;
      }
    } else {
      this.canvas.width = this.engine.canvas.width;
      this.canvas.height = this.engine.canvas.height;
    }
    this.clearCanvas();
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  activate() {
    const renderer = this.engine.renderer;
    if (renderer.activeLayer) {
      renderer.activeLayer.context.restore();
    }

    renderer.activeLayer = this;
    renderer.context = this.context;

    if (this.clear) {
      this.clearCanvas();
    }

    if (this.fill) {
      this.context.fillStyle = this.fill;
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    if (this.followPlayer) {
      this.context.save();
      this.context.translate(
        -this.engine.player.body.pos.x + this.canvas.width / 2,
        -this.engine.player.body.pos.y + this.canvas.height / 1.3,
      );
    }
  }
}
