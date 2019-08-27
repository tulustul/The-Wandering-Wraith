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
    this.next();
    const size = this.deserializeVector();
    const level: Level = {
      size,
      pathCommands: [],
      pointToCommandMap: pointsMap,
    };

    let command!: string;
    let c = this.levelString[this.index - 1];
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
      let to: Vector2;
      switch (command) {
        case "m":
          this.pos = this.deserializeVector();
          to = this.pos.copy();
          pointsMap.set(to, {
            type: "moveTo",
            to,
          } as MoveCommand);
          level.pathCommands.push(pointsMap.get(to)!);
          command = "l";
          break;
        case "l":
          relTo = this.deserializeVector();
          to = this.pos.add_(relTo).copy();
          pointsMap.set(to, {
            type: "lineTo",
            to,
            isDeadly: false,
            mask: TREE_GROUND_MASK,
          } as LineCommand);
          level.pathCommands.push(pointsMap.get(to)!);
          break;
        case "c":
          const relC1 = this.deserializeVector();
          const c1 = this.pos.copy().add_(relC1);
          const relC2 = this.deserializeVector();
          const c2 = this.pos.copy().add_(relC2);
          relTo = this.deserializeVector();
          to = this.pos.add_(relTo).copy();
          const bezierCommand = {
            type: "bezierTo",
            from: new Vector2(),
            to,
            c1,
            c2,
            isDeadly: false,
            mask: TREE_GROUND_MASK,
          } as BezierCommand;
          pointsMap.set(to, bezierCommand);
          pointsMap.set(c1, bezierCommand);
          pointsMap.set(c2, bezierCommand);
          level.pathCommands.push(bezierCommand);
          break;
      }
      c = this.levelString[this.index - 1];
    }
    return level;
  }

  serialize(level: Level): string {
    const tokens: string[] = [this.serializeVector(level.size)];

    let localPos = new Vector2();
    let to: Vector2;
    for (const pathCommand of level.pathCommands) {
      switch (pathCommand.type) {
        case "moveTo":
          localPos = (pathCommand as MoveCommand).to;
          tokens.push("m" + this.serializeVector(localPos));
          break;
        case "lineTo":
          to = (pathCommand as LineCommand).to.copy();
          tokens.push("l" + this.serializeVector(to.copy().sub_(localPos)));
          localPos = to.copy();
          break;
        case "bezierTo":
          let c1 = (pathCommand as BezierCommand).c1.copy();
          let c2 = (pathCommand as BezierCommand).c2.copy();
          to = (pathCommand as BezierCommand).to.copy();

          localPos = to.copy();
          tokens.push("c" + this.serializeVector(c1.sub_(localPos)));
          tokens.push(this.serializeVector(c2.sub_(localPos)));
          tokens.push(this.serializeVector(to.copy().sub_(localPos)));
          break;
        case "close":
          tokens.push("z");
      }
    }

    for (let i = 0; i < tokens.length - 1; i++) {
      if (
        this.isLastCharADigit(tokens[i]) &&
        this.isFirstCharADigit(tokens[i + 1])
      ) {
        tokens[i] += " ";
      }
    }
    return tokens.join("");
  }

  private isLastCharADigit(s: string) {
    const c = s[s.length - 1];
    return c >= "0" && c <= "9";
  }

  private isFirstCharADigit(s: string) {
    const c = s[0];
    return c >= "0" && c <= "9";
  }

  private deserializeVector() {
    return new Vector2(this.deserializeNumber(), this.deserializeNumber());
  }

  private serializeVector(v: Vector2) {
    const x = v.x.toFixed(0);
    const y = v.y.toFixed(0);
    const sep = y[0] === "-" ? "" : " ";
    return x + sep + y;
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
