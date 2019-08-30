import { Engine } from "./engine";
import { Vector2 } from "./vector";
import { generateBezierSegments } from "./bezier";
import { GROUND_MASK, TREE_GROUND_MASK, GRASS_MASK } from "./colisions-masks";
import { LineShape } from "./systems/physics/shapes";
import { LEVELS } from "./levels";
import {
  PathCommandType,
  PathCommand,
  LevelObject,
  Platform,
} from "./level.interface";

// m - move to, (x y)
// l - line to, (x y)+
// c - cubic bezier, (x1 y1 x2 y2 x y)+
// z - close path
const commands = "mlczp";

export function loadLevel(engine: Engine, level: number) {
  const levelDef = LEVELS[level];
  new LevelParser(engine, levelDef).parse_();
}

export class LevelParser {
  private pos: Vector2;
  private index = 0;

  constructor(private engine: Engine, private d: string) {}

  parse_() {
    this.next();
    const pathCommands: PathCommand[] = [];
    const platforms: Platform[] = [];
    this.engine.level = {
      size: this.parseVector(),
      pathCommands,
      platforms,
    };

    // #if process.env.NODE_ENV === 'development'
    const editorPathCommands: PathCommand[] = [];
    this.engine.level.editorPathCommands = editorPathCommands;

    const pointsMap = new Map<Vector2, PathCommand>();
    this.engine.level.pointToCommandMap = pointsMap;

    const objects: LevelObject[] = [];
    this.engine.level.objects = objects;
    // #endif

    let command = "m";
    let firstPoint: Vector2 | null = null;
    let c = this.d[this.index - 1];
    while (c) {
      if (commands.includes(c)) {
        command = c;
        if (command === "z") {
          pathCommands.push({ type: PathCommandType.close });
          this.addStatic(this.pos, firstPoint!);
          // #if process.env.NODE_ENV === 'development'
          editorPathCommands.push(pathCommands[pathCommands.length - 1]);
          // #endif
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
          pathCommands.push({
            type: PathCommandType.move,
            points: [firstPoint],
          });
          // #if process.env.NODE_ENV === 'development'
          pointsMap.set(firstPoint, pathCommands[pathCommands.length - 1]);
          editorPathCommands.push(pathCommands[pathCommands.length - 1]);
          // #endif
          command = "l";
          break;
        case "l":
          points = [this.pos.copy(), this.pos.add_(this.parseVector()).copy()];
          pathCommands.push({
            type: PathCommandType.line,
            points: [points[1]],
          });
          this.addStatic(points[0], points[1], GRASS_MASK | TREE_GROUND_MASK);
          // #if process.env.NODE_ENV === 'development'
          pointsMap.set(points[1], pathCommands[pathCommands.length - 1]);
          editorPathCommands.push(pathCommands[pathCommands.length - 1]);
          // #endif
          break;
        case "c":
          const oldPos = this.pos.copy();
          points = [
            this.pos.copy().add_(this.parseVector()),
            this.pos.copy().add_(this.parseVector()),
            this.pos.add_(this.parseVector()).copy(),
          ];
          pathCommands.push({
            type: PathCommandType.bezier,
            points: points,
          });
          const interpolatedPoints = generateBezierSegments(
            [oldPos].concat(points),
            0.1,
          );
          for (const [p1, p2] of interpolatedPoints) {
            this.addStatic(p1, p2, GRASS_MASK | TREE_GROUND_MASK);
          }
          // #if process.env.NODE_ENV === 'development'
          for (const p of points) {
            pointsMap.set(p, pathCommands[pathCommands.length - 1]);
          }
          editorPathCommands.push(pathCommands[pathCommands.length - 1]);
          // #endif
          break;
        case "p":
          this.index++;
          const pos = this.parseVector();
          const sizes: { [key: string]: [number, number] } = {
            P: [15, 5],
            h: [40, 10],
            H: [80, 10],
            v: [10, 40],
            V: [10, 80],
          };
          const [w, h] = sizes[c];
          platforms.push({
            x: pos.x - w,
            y: pos.y - h,
            w: sizes[c][0] * 2,
            h: sizes[c][1] * 2,
          });
          this.generatePlatform(pos, w, h);
          // #if process.env.NODE_ENV === 'development'
          const types: { [key: string]: string } = {
            P: "platform",
            h: "hPlatform1",
            H: "hPlatform2",
            v: "vPlatform1",
            V: "vPlatform2",
          };
          objects.push({ type: types[c], pos });
          pointsMap.set(pos, objects[objects.length - 1] as any);
          // #endif
          break;
      }
      c = this.d[this.index - 1];
    }
  }

  private generatePlatform(pos: Vector2, w: number, h: number) {
    const [a, b, c, d] = [
      pos.copy().add_(new Vector2(-w, -h)),
      pos.copy().add_(new Vector2(w, -h)),
      pos.copy().add_(new Vector2(w, h)),
      pos.copy().add_(new Vector2(-w, h)),
    ];

    const mask = w > 50 ? GRASS_MASK : 0;
    this.addStatic(a, b, mask);
    this.addStatic(b, c, mask);
    this.addStatic(c, d, mask);
    this.addStatic(d, a, mask);
  }

  private parseVector() {
    return new Vector2(this.parseNumber(), this.parseNumber());
  }

  private parseNumber() {
    let number = this.d[this.index - 1];
    let c = this.next();
    while (c >= "0" && c <= "9") {
      number += c;
      c = this.next();
    }
    return parseFloat(number) * 10;
  }

  private next() {
    return this.d[this.index++];
  }

  private addStatic(from_: Vector2, to_: Vector2, mask = 0) {
    this.engine.physics.addStatic({
      shape_: new LineShape(from_, to_),
      receiveMask: GROUND_MASK | mask,
      pos: new Vector2(0, 0),
    });
  }
}
