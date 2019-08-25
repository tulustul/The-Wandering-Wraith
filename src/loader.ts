import { Engine } from "./engine";
import { Vector2 } from "./vector";
import { generateBezierSegments } from "./bezier";
import { GROUND_MASK, TREE_GROUND_MASK } from "./colisions-masks";
import { LineShape } from "./systems/physics/shapes";

// M - move to, (x y)
// l - line to, (x y)+
// c - cubic bezier, (x1 y1 x2 y2 x y)+
// V - vertical line, y
// H - vertical line, y
// z - close path
const commands = "mMlLcvVhHz";

export function loadLevel(engine: Engine, level: string) {
  const svg = document.getElementById(level) as any;

  engine.worldWidth = svg.viewBox.baseVal.width;
  engine.worldHeight = svg.viewBox.baseVal.height;

  const paths = svg.querySelectorAll("path");
  for (const path of paths) {
    const d = path.getAttribute("d")!;
    const clazz = path.getAttribute("class")!;
    let receiveMask = GROUND_MASK;
    if (clazz === "t") {
      receiveMask |= TREE_GROUND_MASK;
    }
    for (const [start, end] of new PathParser(d).parse()) {
      engine.physics.addStatic({
        shape: new LineShape(start, end),
        receiveMask,
        pos: new Vector2(0, 0),
      });
    }
  }
}

class PathParser {
  private pos: Vector2;
  private index = 0;

  constructor(private d: string) {}

  *parse(): IterableIterator<[Vector2, Vector2]> {
    let command!: string;
    let c = this.next();
    let firstPoint: Vector2 | null = null;
    while (c) {
      if (commands.includes(c)) {
        command = c;
        if (command === "z") {
          yield [this.pos, firstPoint!];
        }
        c = this.next();
        continue;
      }
      if (c === " ") {
        c = this.next();
        continue;
      }
      let start: Vector2 | null = null;
      let x, y: number;
      switch (command) {
        case "M":
          this.pos = this.parseVector();
          firstPoint = this.pos.copy();
          command = "l";
          break;
        case "l":
          yield [this.pos.copy(), this.pos.add(this.parseVector()).copy()];
          break;
        case "L":
          start = this.pos.copy();
          this.pos = this.parseVector();
          yield [start, this.pos.copy()];
          break;
        case "v":
          y = this.parseNumber();
          start = this.pos.copy();
          this.pos.y += y;
          yield [start, this.pos.copy()];
          break;
        case "V":
          y = this.parseNumber();
          start = this.pos.copy();
          this.pos.y = y;
          yield [start, this.pos.copy()];
          break;
        case "h":
          x = this.parseNumber();
          start = this.pos.copy();
          this.pos.x += x;
          yield [start, this.pos.copy()];
          break;
        case "H":
          x = this.parseNumber();
          start = this.pos.copy();
          this.pos.x = x;
          yield [start, this.pos.copy()];
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
