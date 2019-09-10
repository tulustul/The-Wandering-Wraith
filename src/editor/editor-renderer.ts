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
      this.engine.renderer.renderTerrain();
      this.engine.renderer.renderPlatforms();
      this.engine.renderer.renderSpikes();
    }

    this.engine.renderer.baseLayer.activate();

    const pos = this.engine.camera.pos;
    this.ctx.save();
    this.ctx.translate(-pos.x, -pos.y);

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

    this.renderLevelBoundaries();

    this.ctx.restore();
  }

  private get engine() {
    return this.editor.engine;
  }

  private drawColisionHelpers() {
    this.ctx.strokeStyle = "#ff0";
    this.ctx.lineWidth = 2;
    for (const body of this.engine.physics.staticBodies) {
      this.ctx.beginPath();
      this.ctx.moveTo(body.start_.x, body.start_.y);
      this.ctx.lineTo(body.end_.x, body.end_.y);
      this.ctx.stroke();
      this.ctx.closePath();
    }

    this.ctx.fillStyle = "#f00";
    this.ctx.strokeStyle = "#f00";

    const body = this.engine.player.body_;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(body.pos.x, body.pos.y);
    this.ctx.lineTo(body.pos.x + body.vel.x * 2, body.pos.y + body.vel.y * 2);
    this.ctx.closePath();
    this.ctx.stroke();

    for (const point of body.contactPoints) {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.closePath();
    }

    this.ctx.fillStyle = "#f005";
    this.ctx.beginPath();
    this.ctx.arc(body.pos.x, body.pos.y, 10, 0, Math.PI * 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
    this.ctx.closePath();
  }

  private drawPlantsHelpers() {
    this.ctx.fillStyle = "green";
    const minX = this.engine.camera.pos.x;
    const maxX = this.engine.camera.pos.x + this.engine.canvas_.width;
    for (let x = minX; x < maxX; x += this.engine.foliage.GRID_SIZE) {
      const cell = Math.floor(x / this.engine.foliage.GRID_SIZE);
      for (const foliage of this.engine.foliage.entities_[cell] || []) {
        this.ctx.fillRect(foliage.pos.x - 1, foliage.pos.y - 1, 2, 2);
      }
    }
  }
  private drawControlPoints() {
    const ctx = this.ctx;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "red";
    let to: Vector2;
    let lastPoint: Vector2;
    for (const pathCommand of this.editor.engine.level_.pathCommands!) {
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

    for (const o of this.editor.engine.level_.objects!) {
      this.drawPoint(ctx, o.pos, "blue");
    }
  }

  private drawPaths() {
    let to: Vector2;
    this.ctx.strokeStyle = "yellow";
    this.ctx.fillStyle = "transparent";
    for (const pathCommand of this.engine.level_.pathCommands) {
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
      platformH1: [40, 10],
      platformH2: [80, 10],
      platformV1: [10, 40],
      platformV2: [10, 80],
      platformB1: [40, 40],
      platformB2: [60, 60],
    };

    for (const o of this.editor.engine.level_.objects!) {
      const size = sizes[o.type];
      switch (o.type) {
        case "platform":
        case "platformH1":
        case "platformH2":
        case "platformV1":
        case "platformV2":
        case "platformB1":
        case "platformB2":
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
          this.ctx.lineTo(o.pos.x, this.editor.engine.level_.size_.y);
          this.ctx.closePath();
          this.ctx.stroke();
          break;
        case "crystal":
          this.ctx.fillStyle = "#f005";
          this.ctx.fillRect(o.pos.x - 10, o.pos.y - 10, 20, 20);
          break;
        case "gravityCrystal":
          this.ctx.fillStyle = "#f055";
          this.ctx.fillRect(o.pos.x - 10, o.pos.y - 10, 20, 20);
          break;
        case "bubble":
          this.ctx.fillStyle = "#f0f5";
          this.ctx.fillRect(o.pos.x - 25, o.pos.y - 25, 50, 50);
          break;
      }
    }
  }

  private renderLevelBoundaries() {
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "blue";
    this.ctx.beginPath();
    this.ctx.rect(
      0,
      0,
      this.engine.level_.size_.x,
      this.engine.level_.size_.y,
    );
    this.ctx.closePath();
    this.ctx.stroke();
  }
}
