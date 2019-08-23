import { Vector2 } from "./vector";
import { Random } from "./random";
import { SpriteRenderer } from "./renderer/sprite-renderer";

export interface TreeDefinition {
  frames: HTMLImageElement[];
  density: number; // lower - more
}

export function generateTree(
  ctx: CanvasRenderingContext2D,
  size: number,
  depth: number,
  angle: number,
  segmentLength: number,
  seed: number,
  time: number,
) {
  const r = new Random(seed);

  var grd = ctx.createLinearGradient(0, 0, 0, size);
  grd.addColorStop(0.5, "#222");
  grd.addColorStop(1, "#000");

  ctx.strokeStyle = grd;
  drawTree(
    r,
    ctx,
    new Vector2(size / 2, size),
    depth,
    angle,
    0,
    segmentLength,
    time,
    1 / Math.pow(depth, 1.5),
  );
}

function drawTree(
  r: Random,
  ctx: CanvasRenderingContext2D,
  pos: Vector2,
  depth: number,
  angle: number,
  totalAngle: number,
  segmentLength: number,
  time: number,
  animationPower: number,
) {
  const windDirection = Math.PI / 2;
  const angleDiff = windDirection - totalAngle;
  totalAngle += ((angleDiff * 1.1 * Math.sin(time)) / depth) * animationPower;

  const d = new Vector2(0, -1).rotate(totalAngle).mul(segmentLength);
  const newPos = pos.copy().add(d);

  ctx.beginPath();
  ctx.lineWidth = Math.pow(depth, 1);
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(newPos.x, newPos.y);
  ctx.stroke();
  ctx.closePath();

  if (depth >= 1) {
    drawTree(
      r,
      ctx,
      newPos,
      depth - 1,
      angle * (1 + (r.nextFloat() - 0.5) / 3),
      totalAngle + angle,
      segmentLength * Math.min(r.nextFloat() + 0.4, 0.8),
      time,
      animationPower,
    );
    drawTree(
      r,
      ctx,
      newPos,
      depth - 1,
      angle * (1 + (r.nextFloat() - 0.5) / 3),
      totalAngle - angle,
      segmentLength * Math.min(r.nextFloat() + 0.4, 0.8),
      time,
      animationPower,
    );
  }
}

export async function animateTree(
  spritesRenderer: SpriteRenderer,
  depth: number,
  angle: number,
  segmentLength: number,
  seed: number,
): Promise<HTMLImageElement[]> {
  const frames: HTMLImageElement[] = [];
  const size = (depth * segmentLength) / 1.5;
  spritesRenderer.setSize(size, size);
  const framesCount = 30;
  const step = Math.PI / framesCount;
  let time = Math.PI / 2;
  for (let i = 0; i < framesCount; i++) {
    time = time += step;
    frames.push(
      await spritesRenderer.render(ctx =>
        generateTree(ctx, size, depth, angle, segmentLength, seed, time),
      ),
    );
  }
  return frames;
}
