import { Editor } from "./editor";
import { Vector2 } from "../vector";
import { PathCommandType } from "../level.interface";

export class EditorRenderer {
  ctx: CanvasRenderingContext2D;

  constructor(private editor: Editor) {}

  render(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;

    if (Math.round(this.engine.time_) % 500 === 0) {
      this.engine.renderer.terrainLayer.activate();
      this.engine.renderer.terrainLayer.clearCanvas();
      this.engine.renderer.renderTerrain();
      this.engine.renderer.renderPlatforms();
      this.engine.renderer.renderSpikes();
    }

    this.engine.renderer.baseLayer.activate();

    const pos = this.engine.camera.pos;
    this.ctx.save();
    this.ctx.translate(pos.x, pos.y);

    this.drawPaths();

    if (this.editor.drawColisionHelpers) {
      this.drawColisionHelpers();
    }

    if (this.editor.drawPlantsHelpers) {
      this.drawPlantsHelpers();
    }

    this.drawObjects();
    this.drawControlPoints();
    this.drawAreaSelection();

    this.ctx.restore();
  }

  private get engine() {
    return this.editor.engine;
  }

  private drawColisionHelpers() {
    this.ctx.fillStyle = "#f00";
    this.ctx.strokeStyle = "#f00";
    for (const entity of this.engine.physics.dynamicBodies) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(entity.pos.x, entity.pos.y);
      this.ctx.lineTo(
        entity.pos.x + entity.vel.x * 2,
        entity.pos.y + entity.vel.y * 2,
      );
      this.ctx.closePath();

      this.ctx.stroke();
      for (const point of entity.contactPoints) {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();
      }
      this.ctx.restore();
    }
    this.ctx.closePath();

    this.ctx.strokeStyle = "#ff0";
    this.ctx.lineWidth = 2;
    for (const body of this.engine.physics.staticBodies) {
      this.ctx.beginPath();
      this.ctx.moveTo(body.shape_.start_.x, body.shape_.start_.y);
      this.ctx.lineTo(body.shape_.end_.x, body.shape_.end_.y);
      this.ctx.stroke();
      this.ctx.closePath();
    }
  }

  private drawPlantsHelpers() {
    this.ctx.fillStyle = "green";
    for (const cell of this.engine.foliage.entities_) {
      for (const foliage of cell) {
        this.ctx.beginPath();
        this.ctx.arc(foliage.pos.x, foliage.pos.y, 2, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();
      }
    }
  }
  private drawControlPoints() {
    const ctx = this.ctx;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "red";
    let to: Vector2;
    let lastPoint: Vector2;
    for (const pathCommand of this.editor.engine.level.editorPathCommands!) {
      switch (pathCommand.type) {
        case PathCommandType.move:
          to = pathCommand.points![0];
          this.drawPoint(ctx, to, "blue");
          lastPoint = to;
          break;
        case PathCommandType.line:
          to = pathCommand.points![0];
          this.drawPoint(ctx, to, "darkorange");
          lastPoint = to;
          break;
        case PathCommandType.bezier:
          const [c1, c2, to_] = pathCommand.points!;
          this.drawPoint(ctx, c1, "red");
          this.drawPoint(ctx, c2, "red");
          this.drawPoint(ctx, to_, "darkorange");
          ctx.beginPath();
          ctx.moveTo(lastPoint!.x, lastPoint!.y);
          ctx.lineTo(c1.x, c1.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(to_.x, to_.y);
          ctx.lineTo(c2.x, c2.y);
          ctx.stroke();
          lastPoint = to_;
          break;
        case PathCommandType.close:
          ctx.closePath();
          ctx.stroke();
          break;
      }
    }

    for (const o of this.editor.engine.level.objects!) {
      this.drawPoint(ctx, o.pos, "blue");
    }
  }

  private drawPaths() {
    let to: Vector2;
    this.ctx.strokeStyle = "yellow";
    this.ctx.fillStyle = "transparent";
    for (const pathCommand of this.engine.level.pathCommands) {
      switch (pathCommand.type) {
        case PathCommandType.move:
          to = pathCommand.points![0];
          this.ctx.beginPath();
          this.ctx.moveTo(to.x, to.y);
          break;
        case PathCommandType.line:
          to = pathCommand.points![0];
          this.ctx.lineTo(to.x, to.y);
          break;
        case PathCommandType.bezier:
          const [c1, c2, to_] = pathCommand.points!;
          this.ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, to_.x, to_.y);
          break;
        case PathCommandType.close:
          this.ctx.closePath();
          this.ctx.stroke();
          break;
      }
    }
  }

  private drawPoint(ctx: CanvasRenderingContext2D, p: Vector2, fill: string) {
    ctx.fillStyle = fill;
    if (this.editor.manipulator.selectedPoints.has(p)) {
      ctx.fillStyle = "green";
    }
    if (p === this.editor.manipulator.focusedPoint) {
      ctx.fillStyle = "yellow";
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }

  private drawAreaSelection() {
    if (this.editor.manipulator.selectionArea) {
      this.ctx.fillStyle = "#fff2";
      const [from, to] = this.editor.manipulator.selectionArea;
      const relTo = to.copy().sub_(from);
      this.ctx.rect(from.x, from.y, relTo.x, relTo.y);
      this.ctx.fill();
    }
  }

  private drawObjects() {
    const sizes: { [key: string]: [number, number] } = {
      platform: [15, 5],
      hPlatform1: [40, 10],
      hPlatform2: [80, 10],
      vPlatform1: [10, 40],
      vPlatform2: [10, 80],
    };

    for (const o of this.editor.engine.level.objects!) {
      const size = sizes[o.type];
      switch (o.type) {
        case "platform":
        case "hPlatform1":
        case "hPlatform2":
        case "vPlatform1":
        case "vPlatform2":
          this.ctx.fillStyle = "#ff02";
          this.ctx.fillRect(
            o.pos.x - size[0],
            o.pos.y - size[1],
            size[0] * 2,
            size[1] * 2,
          );
          break;
        case "savepoint":
          this.ctx.lineWidth = 1;
          this.ctx.strokeStyle = "blue";
          this.ctx.beginPath();
          this.ctx.moveTo(o.pos.x, 0);
          this.ctx.lineTo(o.pos.x, this.editor.engine.level.size.y);
          this.ctx.closePath();
          this.ctx.stroke();
          break;
      }
    }
  }
}
