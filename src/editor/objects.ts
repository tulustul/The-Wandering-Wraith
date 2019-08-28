import { Vector2 } from "../vector";
import { Editor } from "./editor";
import { PathCommand, PathCommandType } from "../level.interface";

export type ObjectType =
  | "polygon"
  | "platform"
  | "hPlatform1"
  | "hPlatform2"
  | "vPlatform1"
  | "vPlatform2";

export class EditorObjects {
  constructor(private editor: Editor) {}

  place(type: ObjectType, pos: Vector2) {
    switch (type) {
      case "polygon":
        this.createPolygon(pos);
        break;
      case "platform":
      case "hPlatform1":
      case "hPlatform2":
      case "vPlatform1":
      case "vPlatform2":
        const platform = { type, pos };
        this.editor.engine.level.objects!.push(platform);
        this.pointsMap.set(pos, platform as any);
        break;
    }
  }

  private createPolygon(pos: Vector2) {
    const commands = this.editor.engine.level.pathCommands;

    let to = pos.copy();
    let command = { type: PathCommandType.move, points: [to] } as PathCommand;
    commands.push(command);
    this.pointsMap.set(to, command);

    to = new Vector2(50, 0).add_(pos);
    command = { type: PathCommandType.line, points: [to] } as PathCommand;
    commands.push(command);
    this.pointsMap.set(to, command);

    to = new Vector2(50, 50).add_(pos);
    command = { type: PathCommandType.line, points: [to] } as PathCommand;
    commands.push(command);
    this.pointsMap.set(to, command);

    to = new Vector2(0, 50).add_(pos);
    command = { type: PathCommandType.line, points: [to] } as PathCommand;
    commands.push(command);
    this.pointsMap.set(to, command);

    commands.push({ type: PathCommandType.close } as PathCommand);
  }

  get pointsMap() {
    return this.editor.engine.level.pointToCommandMap!;
  }
}
