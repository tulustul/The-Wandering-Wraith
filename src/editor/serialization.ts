import {
  Level,
  LineCommand,
  MoveCommand,
  BezierCommand,
  CloseCommand,
  PathCommand,
} from "./level.interface";
import { Vector2 } from "../vector";
import { TREE_GROUND_MASK } from "../colisions-masks";

export class LevelSerializer {
  private pos: Vector2;
  private index = 0;
  private levelString: string;

  // m - move to, (x y)
  // l - line to, (x y)+
  // c - cubic bezier, (x1 y1 x2 y2 x y)+
  // z - close path
  private commands = "mlcz";

  deserialize(levelString: string): Level {
    this.levelString = levelString;

    const pointsMap = new Map<Vector2, PathCommand>();
    const level: Level = { pathCommands: [], pointToCommandMap: pointsMap };

    let command!: string;
    let c = this.next();
    while (c) {
      if (this.commands.includes(c)) {
        command = c;
        if (command === "z") {
          level.pathCommands.push({
            type: "close",
          } as CloseCommand);
        }
        c = this.next();
        continue;
      }

      if (c === " ") {
        c = this.next();
        continue;
      }

      let relTo: Vector2;
      let absTo: Vector2;
      switch (command) {
        case "m":
          this.pos = this.deserializeVector();
          absTo = this.pos.copy();
          pointsMap.set(absTo, {
            type: "moveTo",
            absTo,
          } as MoveCommand);
          level.pathCommands.push(pointsMap.get(absTo)!);
          command = "l";
          break;
        case "l":
          relTo = this.deserializeVector();
          absTo = this.pos.add_(relTo).copy();
          pointsMap.set(absTo, {
            type: "lineTo",
            relTo,
            absTo,
            isDeadly: false,
            mask: TREE_GROUND_MASK,
          } as LineCommand);
          level.pathCommands.push(pointsMap.get(absTo)!);
          break;
        case "c":
          relTo = this.deserializeVector();
          absTo = this.pos.add_(relTo).copy();
          const relC1 = this.deserializeVector();
          const absC1 = this.pos.add_(relC1).copy();
          const relC2 = this.deserializeVector();
          const absC2 = this.pos.add_(relC2).copy();
          const bezierCommand = {
            type: "bezierTo",
            relFrom: new Vector2(),
            relTo,
            absTo,
            relC1,
            absC1,
            relC2,
            absC2,
            isDeadly: false,
            mask: TREE_GROUND_MASK,
          } as BezierCommand;
          pointsMap.set(absTo, bezierCommand);
          pointsMap.set(absC1, bezierCommand);
          ``;
          pointsMap.set(absC2, bezierCommand);
          level.pathCommands.push(bezierCommand);
          break;
      }
      c = this.levelString[this.index - 1];
    }
    return level;
  }

  serialize(level: Level): string {
    const tokens: string[] = [];

    for (const pathCommand of level.pathCommands) {
      switch (pathCommand.type) {
        case "moveTo":
          tokens.push(
            "m" + this.serializeVector((pathCommand as MoveCommand).absTo),
          );
          break;
        case "lineTo":
          tokens.push(
            "l" + this.serializeVector((pathCommand as LineCommand).relTo),
          );
          break;
        case "bezierTo":
          tokens.push(
            "c" + this.serializeVector((pathCommand as BezierCommand).relTo),
          );
          tokens.push(
            this.serializeVector((pathCommand as BezierCommand).relC1),
          );
          tokens.push(
            this.serializeVector((pathCommand as BezierCommand).relC2),
          );
          break;
        case "close":
          tokens.push("z");
      }
    }

    return tokens.join("");
  }

  private deserializeVector() {
    return new Vector2(this.deserializeNumber(), this.deserializeNumber());
  }

  private serializeVector(v: Vector2) {
    const x = v.x.toFixed(1);
    const y = v.y.toFixed(1);
    const sep = y[0] === "-" ? "" : " ";
    return " " + x + sep + y;
  }

  private deserializeNumber() {
    let number = this.levelString[this.index - 1];
    let c = this.next();
    while ((c >= "0" && c <= "9") || c == ".") {
      number += c;
      c = this.next();
    }
    return parseFloat(number);
  }

  private next() {
    return this.levelString[this.index++];
  }
}
