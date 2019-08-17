import { Renderer } from "./renderer";

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
    private renderer: Renderer,
    options: LayerOptions = {},
  ) {
    Object.assign(this, options);

    renderer.compositor.layers[name] = this;

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
        this.canvas.width = this.renderer.game.engine.worldWidth;
        this.canvas.height = this.renderer.game.engine.worldHeight;
      }
    } else {
      this.canvas.width = this.renderer.game.canvas.width;
      this.canvas.height = this.renderer.game.canvas.height;
    }
    this.clearCanvas();
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  activate() {
    if (this.renderer.activeLayer) {
      this.renderer.activeLayer.context.restore();
    }

    this.renderer.activeLayer = this;
    this.renderer.context = this.context;

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
        this.renderer.game.camera.pos.x,
        this.renderer.game.camera.pos.y,
      );
    }
  }
}
