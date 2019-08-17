import { Vector2 } from "./vector";

export function generateTree(
  depth: number,
  angle: number,
  segmentLength: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.height = 300;
  canvas.width = 300;

  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "#333";
  drawTree(ctx, new Vector2(150, 300), depth, angle, 0, segmentLength);

  return canvas;
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  pos: Vector2,
  depth: number,
  angle: number,
  totalAngle: number,
  segmentLength: number,
) {
  const d = new Vector2(0, -1).rotate(totalAngle).mul(segmentLength);
  const newPos = pos.copy().add(d);

  ctx.beginPath();
  ctx.lineWidth = Math.pow(depth, 1.2);
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(newPos.x, newPos.y);
  ctx.stroke();
  ctx.closePath();

  if (depth >= 1) {
    drawTree(
      ctx,
      newPos,
      depth - 1,
      angle * (1 + (Math.random() - 0.5) / 3),
      totalAngle + angle,
      segmentLength * Math.min(Math.random() + 0.4, 0.8),
    );
    drawTree(
      ctx,
      newPos,
      depth - 1,
      angle * (1 + (Math.random() - 0.5) / 3),
      totalAngle - angle,
      segmentLength * Math.min(Math.random() + 0.4, 0.8),
    );
  }
}
