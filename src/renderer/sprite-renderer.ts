export class SpriteRenderer {
  ctx!: CanvasRenderingContext2D;
  private canvas!: HTMLCanvasElement;
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d")!;
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  async render(
    renderFn: (ctx: CanvasRenderingContext2D) => void,
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      renderFn(this.ctx);
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = this.canvas.toDataURL();
      this.reset();
    });
  }

  private reset() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
