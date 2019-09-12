import { Vector2 } from "./vector";
import { Random } from "./random";
import { SpriteRenderer } from "./renderer/sprite-renderer";

export interface PlantDefinition {
  frames_: HTMLImageElement[];
  spread: number;
  mask_: number;
}

export function generateGrass(
  ctx: CanvasRenderingContext2D,
  size: number,
  seed: number,
  time: number,
) {
  const r = new Random(seed);

  const grd = ctx.createLinearGradient(0, 0, 0, 50);
  grd.addColorStop(0, "#111");
  grd.addColorStop(1, "#000");

  ctx.strokeStyle = grd;

  ctx.lineWidth = 0.2;
  for (let i = 0; i < 10; i++) {
    let pos = new Vector2((r.next_() % 10) + 20, 50);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    let angle = (r.nextFloat() + 0.5) / 10;
    let totalAngle = 0;
    const length = (r.nextFloat() + 1) * size;
    for (let j = 0; j < 10; j++) {
      const d = new Vector2(0, -1).rotate_(totalAngle).mul(length);
      pos = pos.copy().add_(d);
      ctx.lineTo(pos.x, pos.y);
      totalAngle += angle + Math.sin(time) / 30;
    }
    ctx.stroke();
    ctx.closePath();
  }
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

  const grd = ctx.createLinearGradient(0, 0, 0, size);
  grd.addColorStop(0.5, "#151515");
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
  totalAngle +=
    ((1 + angleDiff * 1.2 * (Math.sin(time) + 2)) / depth) * animationPower;

  const d = new Vector2(0, -1).rotate_(totalAngle).mul(segmentLength);
  const newPos = pos.copy().add_(d);

  ctx.beginPath();
  ctx.lineWidth = Math.pow(depth, 0.9);
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
  const size = (depth * segmentLength) / 1.5;
  spritesRenderer.setSize(size, size);

  return renderFrames(spritesRenderer, 30, (ctx, time) =>
    generateTree(ctx, size, depth, angle, segmentLength, seed, time),
  );
}

export function animateGrass(
  spritesRenderer: SpriteRenderer,
  size: number,
  seed: number,
): Promise<HTMLImageElement[]> {
  spritesRenderer.setSize(50, 50);

  return renderFrames(spritesRenderer, 15, (ctx, time) =>
    generateGrass(ctx, size, seed, time),
  );
}

async function renderFrames(
  spritesRenderer: SpriteRenderer,
  framesCount: number,
  renderFn: (ctx: CanvasRenderingContext2D, time: number) => void,
) {
  const frames: HTMLImageElement[] = [];
  const step = Math.PI / framesCount;
  let time = Math.PI / 2;
  for (let i = 0; i < framesCount; i++) {
    time = time += step;
    frames.push(await spritesRenderer.render(ctx => renderFn(ctx, time)));
  }
  return frames;
}
