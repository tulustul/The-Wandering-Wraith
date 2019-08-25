export class SpriteRenderer {
  ctx!: CanvasRenderingContext2D;
  private canvas_!: HTMLCanvasElement;
  constructor() {
    this.canvas_ = document.createElement("canvas");
    this.ctx = this.canvas_.getContext("2d")!;
  }

  setSize(width: number, height: number) {
    this.canvas_.width = width;
    this.canvas_.height = height;
  }

  async render(
    renderFn: (ctx: CanvasRenderingContext2D) => void,
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      renderFn(this.ctx);
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = this.canvas_.toDataURL();
      this.reset_();
    });
  }

  private reset_() {
    this.ctx.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
  }
}
