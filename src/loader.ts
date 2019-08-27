import { Engine } from "./engine";
import { Vector2 } from "./vector";
import { generateBezierSegments } from "./bezier";
import { GROUND_MASK, TREE_GROUND_MASK, PLAYER_MASK } from "./colisions-masks";
import { LineShape } from "./systems/physics/shapes";
import { LEVELS } from "./levels";
import { threadId } from "worker_threads";
import { PathCommandType } from "./level.interface";

// m - move to, (x y)
// l - line to, (x y)+
// c - cubic bezier, (x1 y1 x2 y2 x y)+
// z - close path
const commands = "mlcz";

export function loadLevel(engine: Engine, level: number) {
  const levelDef = LEVELS[level];
  engine.level = { pathCommands: [] };
  new PathParser(engine, levelDef).parse_();
}

class PathParser {
  private pos: Vector2;
  private index = 0;

  constructor(private engine: Engine, private d: string) {}

  parse_() {
    this.next();
    this.engine.worldWidth = this.parseNumber();
    this.engine.worldHeight = this.parseNumber();

    let command!: string;
    let firstPoint: Vector2 | null = null;
    let c = this.d[this.index - 1];
    while (c) {
      if (commands.includes(c)) {
        command = c;
        if (command === "z") {
          this.engine.level.pathCommands.push({ type: PathCommandType.close });
          this.addStatic(this.pos, firstPoint!);
        }
        c = this.next();
        continue;
      }
      if (c === " ") {
        c = this.next();
        continue;
      }
      let points: Vector2[] = [];
      switch (command) {
        case "m":
          this.pos = this.parseVector();
          firstPoint = this.pos.copy();
          this.engine.level.pathCommands.push({
            type: PathCommandType.move,
            points: [firstPoint],
          });
          command = "l";
          break;
        case "l":
          points = [this.pos.copy(), this.pos.add_(this.parseVector()).copy()];
          this.engine.level.pathCommands.push({
            type: PathCommandType.line,
            points: [points[1]],
          });
          this.addStatic(points[0], points[1]);
          break;
        case "c":
          const oldPos = this.pos.copy();
          points = [
            this.pos.copy().add_(this.parseVector()),
            this.pos.copy().add_(this.parseVector()),
            this.pos.add_(this.parseVector()).copy(),
          ];
          this.engine.level.pathCommands.push({
            type: PathCommandType.bezier,
            points: points,
          });
          const interpolatedPoints = generateBezierSegments(
            [oldPos].concat(points),
            0.1,
          );
          for (const [p1, p2] of interpolatedPoints) {
            this.addStatic(p1, p2);
          }
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

  private addStatic(from_: Vector2, to_: Vector2) {
    this.engine.physics.addStatic({
      shape_: new LineShape(from_, to_),
      receiveMask: TREE_GROUND_MASK | GROUND_MASK,
      pos: new Vector2(0, 0),
    });
  }
}
