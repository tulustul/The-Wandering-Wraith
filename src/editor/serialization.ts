import { Vector2 } from "../vector";
import { Level, PathCommandType, CanBeDeadly } from "../level.interface";

const COMMAND_MAP = {
  [PathCommandType.move]: "m",
  [PathCommandType.line]: "l",
  [PathCommandType.bezier]: "c",
  [PathCommandType.close]: "c",
};

export class LevelSerializer {
  serialize(level: Level): string {
    const tokens: string[] = [
      this.serializeVector(level.size_),
      this.serializeNumber(level.startingPos),
    ];

    let localPos = new Vector2();
    let to: Vector2;
    let lastCommand = "m";
    let isDeadly = false;
    for (const pathCommand of level.pathCommands!) {
      const command = COMMAND_MAP[pathCommand.type];
      if (pathCommand.isDeadly !== isDeadly) {
        tokens.push("d");
        isDeadly = pathCommand.isDeadly;
      }
      if (lastCommand !== command) {
        tokens.push(command);
        lastCommand = command;
      }
      switch (pathCommand.type) {
        case PathCommandType.move:
          localPos = pathCommand.points![0];
          tokens.push(this.serializeVector(localPos));
          break;
        case PathCommandType.line:
          to = pathCommand.points![0].copy();
          tokens.push(this.serializeVector(to.copy().sub_(localPos)));
          localPos = to.copy();
          break;
        case PathCommandType.bezier:
          const [c1, c2, to_] = pathCommand.points!;

          tokens.push(this.serializeVector(c1.copy().sub_(localPos)));
          tokens.push(this.serializeVector(c2.copy().sub_(localPos)));
          tokens.push(this.serializeVector(to_.copy().sub_(localPos)));
          localPos = to_.copy();
          break;
        case PathCommandType.close:
          tokens.push("z");
      }
    }

    const objects = level.objects!.sort((a, b) =>
      a.type.localeCompare(b.type),
    );
    let serializingPlatforms = false;
    for (const o of objects) {
      if (o.isDeadly != isDeadly) {
        tokens.push("d");
        isDeadly = o.isDeadly;
      }
      if (o.type.startsWith("platform") && !serializingPlatforms) {
        serializingPlatforms = true;
        tokens.push("p");
      }
      switch (o.type) {
        case "platform":
          tokens.push("P");
          tokens.push(this.serializeVector(o.pos));
          break;
        case "platformH1":
          tokens.push("h");
          tokens.push(this.serializeVector(o.pos));
          break;
        case "platformH2":
          tokens.push("H");
          tokens.push(this.serializeVector(o.pos));
          break;
        case "platformV1":
          tokens.push("v");
          tokens.push(this.serializeVector(o.pos));
          break;
        case "platformV2":
          tokens.push("V");
          tokens.push(this.serializeVector(o.pos));
          break;
        case "platformB1":
          tokens.push("b");
          tokens.push(this.serializeVector(o.pos));
          break;
        case "platformB2":
          tokens.push("M");
          tokens.push(this.serializeVector(o.pos));
          break;
        case "savepoint":
          tokens.push("s");
          tokens.push(this.serializeNumber(o.pos.x));
          break;
        case "crystal":
          tokens.push("C");
          tokens.push(this.serializeVector(o.pos));
          break;
        case "gravityCrystal":
          tokens.push("G");
          tokens.push(this.serializeVector(o.pos));
          break;
        case "bubble":
          tokens.push("B");
          tokens.push(this.serializeVector(o.pos));
          break;
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

  private serializeNumber(x: number) {
    return (x / 10).toFixed(0);
  }

  private serializeVector(v: Vector2) {
    const x = this.serializeNumber(v.x);
    const y = this.serializeNumber(v.y);
    const sep = y[0] === "-" ? "" : " ";
    return x + sep + y;
  }
}
