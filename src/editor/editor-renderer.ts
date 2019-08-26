import { Editor } from "./editor";
import { Vector2 } from "../vector";
import { MoveCommand, LineCommand, BezierCommand } from "./level.interface";

export class EditorRenderer {
  ctx: CanvasRenderingContext2D;

  constructor(private editor: Editor) {}

  render(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;

    if (this.editor.drawColisionHelpers) {
      this.drawColisionHelpers();
    }

    if (this.editor.drawPlantsHelpers) {
      this.drawPlantsHelpers();
    }

    this.drawPaths();
    this.drawControlPoints();
    this.drawAreaSelection();
  }

  private get engine() {
    return this.editor.engine;
  }

  private get systemsRenderer() {
    return this.engine.renderer.systemsRenderer;
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
    for (const pathCommand of this.editor.level.pathCommands) {
      switch (pathCommand.type) {
        case "moveTo":
          to = (pathCommand as MoveCommand).absTo;
          this.drawPoint(ctx, to, "blue");
          break;
        case "lineTo":
          to = (pathCommand as LineCommand).absTo;
          this.drawPoint(ctx, to, "darkorange");
          break;
        case "bezierTo":
          to = (pathCommand as BezierCommand).absTo;
          const c1 = (pathCommand as BezierCommand).absC1;
          const c2 = (pathCommand as BezierCommand).absC2;
          this.drawPoint(ctx, to, "darkorange");
          this.drawPoint(ctx, c1, "red");
          this.drawPoint(ctx, c2, "red");
          ctx.beginPath();
          ctx.moveTo(c1.x, c1.y);
          ctx.lineTo(to.x, to.y);
          ctx.lineTo(c2.x, c2.y);
          ctx.stroke();
          break;
        case "close":
          ctx.closePath();
          break;
      }
    }
  }

  private drawPaths() {
    const ctx = this.systemsRenderer.ctx;
    let to: Vector2;
    ctx.fillStyle = "orange";
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 2;
    for (const pathCommand of this.editor.level.pathCommands) {
      switch (pathCommand.type) {
        case "moveTo":
          to = (pathCommand as MoveCommand).absTo;
          ctx.beginPath();
          ctx.moveTo(to.x, to.y);
          break;
        case "lineTo":
          to = (pathCommand as LineCommand).absTo;
          ctx.lineTo(to.x, to.y);
          break;
        case "bezierTo":
          to = (pathCommand as BezierCommand).absTo;
          const c1 = (pathCommand as BezierCommand).absC1;
          const c2 = (pathCommand as BezierCommand).absC2;
          ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, to.x, to.y);
          break;
        case "close":
          ctx.closePath();
          ctx.fill();
          break;
      }
    }
  }

  private drawPoint(ctx: CanvasRenderingContext2D, p: Vector2, fill: string) {
    ctx.fillStyle = fill;
    if (this.editor.manipulator.selectedPoints.has(p)) {
      ctx.fillStyle = "red";
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
}
