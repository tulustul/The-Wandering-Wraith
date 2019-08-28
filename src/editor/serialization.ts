import { Vector2 } from "../vector";
import { Level, PathCommandType } from "../level.interface";

export class LevelSerializer {
  serialize(level: Level): string {
    const tokens: string[] = [this.serializeVector(level.size)];

    let localPos = new Vector2();
    let to: Vector2;
    for (const pathCommand of level.editorPathCommands!) {
      switch (pathCommand.type) {
        case PathCommandType.move:
          localPos = pathCommand.points![0];
          tokens.push("m" + this.serializeVector(localPos));
          break;
        case PathCommandType.line:
          to = pathCommand.points![0].copy();
          tokens.push("l" + this.serializeVector(to.copy().sub_(localPos)));
          localPos = to.copy();
          break;
        case PathCommandType.bezier:
          const [c1, c2, to_] = pathCommand.points!;

          tokens.push("c" + this.serializeVector(c1.copy().sub_(localPos)));
          tokens.push(this.serializeVector(c2.copy().sub_(localPos)));
          tokens.push(this.serializeVector(to_.copy().sub_(localPos)));
          localPos = to_.copy();
          break;
        case PathCommandType.close:
          tokens.push("z");
      }
    }

    for (const o of level.objects!) {
      switch (o.type) {
        case "platform":
          tokens.push("pP");
          tokens.push(this.serializeVector(o.pos));
          break;
        case "hPlatform1":
          tokens.push("ph");
          tokens.push(this.serializeVector(o.pos));
          break;
        case "hPlatform2":
          tokens.push("pH");
          tokens.push(this.serializeVector(o.pos));
          break;
        case "vPlatform1":
          tokens.push("pv");
          tokens.push(this.serializeVector(o.pos));
          break;
        case "vPlatform2":
          tokens.push("pV");
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

  private serializeVector(v: Vector2) {
    const x = (v.x / 10).toFixed(0);
    const y = (v.y / 10).toFixed(0);
    const sep = y[0] === "-" ? "" : " ";
    return x + sep + y;
  }
}
