import { EntityEngine } from "./systems/ecs";
import { Vector2 } from "./vector";
import { TerrainSegmentComponent } from "./systems/terrain";
import { generateBezierSegments } from "./bezier";

// m - move to, (x y)+
// l - line to, (x y)+
// c - cubic bezier, (x1 y1 x2 y2 x y)+
// v - vertical line, y+
// z - close path
const commands = "mlcvhz";

export function loadLevel(engine: EntityEngine, level: string) {
  const svg = document.getElementById(level)! as any;
  const height = svg["viewBox"].baseVal.height;
  const paths = svg.querySelectorAll("path");
  for (const path of paths) {
    const d = path.getAttribute("d")!;
    for (const [start, end] of new PathParser(d, height).parse()) {
      console.log(start, end);
      new TerrainSegmentComponent(engine, { start, end });
    }
  }
}

class PathParser {
  private pos: Vector2;
  private index = 0;

  constructor(private d: string, height: number) {
    this.pos = new Vector2(0, height);
  }

  *parse(): IterableIterator<[Vector2, Vector2]> {
    let command!: string;
    let c = this.next();
    while (c) {
      if (commands.includes(c)) {
        command = c;
        c = this.next();
        continue;
      }
      if (c === " ") {
        c = this.next();
        continue;
      }
      switch (command) {
        case "m":
          this.pos.add(this.parseVector());
          command = "l";
          break;
        case "l":
          yield [this.pos.copy(), this.pos.add(this.parseVector()).copy()];
          break;
        case "v":
          const y = this.parseNumber();
          const start = this.pos.copy();
          this.pos.y += y;
          yield [start, this.pos.copy()];
          break;
        case "h":
          const x = this.parseNumber();
          const start2 = this.pos.copy();
          this.pos.x += x;
          yield [start2, this.pos.copy()];
          break;
        case "c":
          yield* generateBezierSegments(
            [
              this.pos.copy(),
              this.pos.copy().add(this.parseVector()),
              this.pos.copy().add(this.parseVector()),
              this.pos.add(this.parseVector()).copy(),
            ],
            0.1,
          );
          break;
      }
      c = this.d[this.index - 1];
    }
  }

  private parseVector() {
    return new Vector2(this.parseNumber(), this.parseNumber());
  }

  private parseNumber() {
    let number = this.d[this.index - 1];
    let c = this.next();
    while ((c >= "0" && c <= "9") || c == ".") {
      number += c;
      c = this.next();
    }
    return parseFloat(number);
  }

  private next() {
    return this.d[this.index++];
  }
}
