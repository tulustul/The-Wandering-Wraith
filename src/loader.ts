import { Engine } from "./engine";
import { Vector2 } from "./vector";
import { generateBezierSegments } from "./bezier";
import { GROUND_MASK, TREE_GROUND_MASK, GRASS_MASK } from "./colisions-masks";
import { LEVELS } from "./levels";
import {
  PathCommandType,
  PathCommand,
  LevelObject,
  Platform,
  Pickable,
  PickableType,
} from "./level.interface";
import { ObjectType } from "./editor/objects";

// m - move to, (x y)
// l - line to, (x y)+
// c - cubic bezier, (x1 y1 x2 y2 x y)+
// z - close path
// p - platform (x, y)
// d - toggling is deadly flag
// s - savepoint (x)
// C - crystal (x,y)
// G - gravity crystal (x,y)
// B - bubble (x,y)
const commands = "mlczpdsCGB";

export function loadLevel(engine: Engine, level: number) {
  const levelDef = LEVELS[level];
  new LevelParser(engine, levelDef).parse_();
}

export class LevelParser {
  private pos: Vector2;
  private index_ = 0;

  constructor(private engine: Engine, private d: string) {}

  parse_() {
    this.next();
    const pathCommands: PathCommand[] = [];
    const platforms: Platform[] = [];
    const savepoints: number[] = [];
    const pickables: Pickable[] = [];
    this.engine.level_ = {
      size_: this.parseVector(),
      startingPos: this.parseNumber(),
      pathCommands,
      platforms,
      savepoints,
      pickables: pickables,
    };

    // #if process.env.NODE_ENV === 'development'
    const pointsMap = new Map<Vector2, PathCommand>();
    this.engine.level_.pointToCommandMap = pointsMap;

    const objects: LevelObject[] = [];
    this.engine.level_.objects = objects;
    // #endif

    let command = "m";
    let firstPoint: Vector2 | null = null;
    let c = this.d[this.index_ - 1];
    let isDeadly = false;
    while (c) {
      if (commands.includes(c)) {
        if (c === "d") {
          isDeadly = !isDeadly;
          c = this.next();
          continue;
        }
        command = c;
        if (command === "z") {
          pathCommands.push({ type: PathCommandType.close, isDeadly: false });
          this.addStatic(this.pos, firstPoint!, isDeadly);
        }
        c = this.next();
        continue;
      }
      if (c === " ") {
        c = this.next();
        continue;
      }
      let points: Vector2[] = [];
      let pos: Vector2;
      switch (command) {
        case "m":
          this.pos = this.parseVector();
          firstPoint = this.pos.copy();
          pathCommands.push({
            type: PathCommandType.move,
            points: [firstPoint],
            isDeadly,
          });
          // #if process.env.NODE_ENV === 'development'
          pointsMap.set(firstPoint, pathCommands[pathCommands.length - 1]);
          // #endif
          command = "l";
          break;
        case "l":
          points = [this.pos.copy(), this.pos.add_(this.parseVector()).copy()];
          pathCommands.push({
            type: PathCommandType.line,
            points: [points[1]],
            isDeadly,
          });
          this.addStatic(
            points[0],
            points[1],
            isDeadly,
            GRASS_MASK | TREE_GROUND_MASK,
          );
          // #if process.env.NODE_ENV === 'development'
          pointsMap.set(points[1], pathCommands[pathCommands.length - 1]);
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
            isDeadly,
          });
          const interpolatedPoints = generateBezierSegments(
            [oldPos].concat(points),
            0.1,
          );
          for (const [p1, p2] of interpolatedPoints) {
            this.addStatic(p1, p2, isDeadly, GRASS_MASK | TREE_GROUND_MASK);
          }
          // #if process.env.NODE_ENV === 'development'
          for (const p of points) {
            pointsMap.set(p, pathCommands[pathCommands.length - 1]);
          }
          // #endif
          break;
        case "p":
          this.index_++;
          pos = this.parseVector();
          const sizes = new Map<string, [number, number]>([
            ["P", [15, 5]],
            ["h", [40, 10]],
            ["H", [80, 10]],
            ["v", [10, 40]],
            ["V", [10, 80]],
            ["b", [40, 40]],
            ["M", [60, 60]],
          ]);
          const [w, h] = sizes.get(c)!;
          platforms.push({
            x: pos.x - w,
            y: pos.y - h,
            w: w * 2,
            h: h * 2,
            isDeadly,
          });
          this.generatePlatform(pos, w, h, isDeadly);
          // #if process.env.NODE_ENV === 'development'
          const types: { [key: string]: string } = {
            P: "platform",
            h: "platformH1",
            H: "platformH2",
            v: "platformV1",
            V: "platformV2",
            b: "platformB1",
            M: "platformB2",
          };
          const platformObject: LevelObject = {
            type: types[c] as ObjectType,
            pos,
            isDeadly,
          };
          objects.push(platformObject);
          pointsMap.set(pos, platformObject as any);
          // #endif
          break;
        case "s":
          const savepoint = this.parseNumber();
          savepoints.push(savepoint);
          // #if process.env.NODE_ENV === 'development'
          const savepointPos = new Vector2(
            savepoint,
            this.engine.level_.size_.y / 2,
          );
          const save: LevelObject = {
            type: "savepoint",
            pos: savepointPos,
            isDeadly: false,
          };
          objects.push(save);
          pointsMap.set(savepointPos, save as any);
          // #endif
          break;
        case "C":
          pos = this.parseVector();
          const collectedCrystals =
            this.engine.currentSave.crystals[this.engine.currentSave.level_] ||
            [];
          pickables.push({
            pos,
            type: PickableType.crystal,
            collected: collectedCrystals.includes(pickables.length),
            radius: 20,
          });
          // #if process.env.NODE_ENV === 'development'
          const crystalObject: LevelObject = {
            isDeadly: false,
            type: "crystal",
            pos,
          };
          objects.push(crystalObject);
          pointsMap.set(pos, crystalObject as any);
          // #endif
          break;
        case "G":
          pos = this.parseVector();
          pickables.push({
            pos,
            type: PickableType.gravityCrystal,
            collected: false,
            radius: 25,
          });
          // #if process.env.NODE_ENV === 'development'
          const gravityCrystalObject: LevelObject = {
            isDeadly: false,
            type: "gravityCrystal",
            pos,
          };
          objects.push(gravityCrystalObject);
          pointsMap.set(pos, gravityCrystalObject as any);
          // #endif
          break;
        case "B":
          pos = this.parseVector();
          pickables.push({
            pos,
            type: PickableType.bubble,
            collected: false,
            radius: 25,
          });
          // #if process.env.NODE_ENV === 'development'
          const bubbleObject: LevelObject = {
            isDeadly: false,
            type: "bubble",
            pos,
          };
          objects.push(bubbleObject);
          pointsMap.set(pos, bubbleObject as any);
          // #endif
          break;
      }
      c = this.d[this.index_ - 1];
    }
  }

  private generatePlatform(
    pos: Vector2,
    w: number,
    h: number,
    isDeadly: boolean,
  ) {
    const [a, b, c, d] = [
      pos.copy().add_(new Vector2(-w, -h)),
      pos.copy().add_(new Vector2(w, -h)),
      pos.copy().add_(new Vector2(w, h)),
      pos.copy().add_(new Vector2(-w, h)),
    ];

    const mask = w > 30 ? GRASS_MASK : 0;
    this.addStatic(a, b, isDeadly, mask);
    this.addStatic(b, c, isDeadly, mask);
    this.addStatic(c, d, isDeadly, mask);
    this.addStatic(d, a, isDeadly, mask);
  }

  private parseVector() {
    return new Vector2(this.parseNumber(), this.parseNumber());
  }

  private parseNumber() {
    let number = this.d[this.index_ - 1];
    let c = this.next();
    while (c >= "0" && c <= "9") {
      number += c;
      c = this.next();
    }
    return parseFloat(number) * 10;
  }

  private next() {
    return this.d[this.index_++];
  }

  private addStatic(
    start_: Vector2,
    end_: Vector2,
    isDeadly: boolean,
    mask = 0,
  ) {
    if (isDeadly) {
      mask = 0;
    }
    this.engine.physics.addStatic({
      start_,
      end_,
      receiveMask: GROUND_MASK | mask,
      isDeadly,
    });
  }
}
