import { Vector2 } from "../vector";
import { Editor } from "./editor";
import { PathCommand, PathCommandType } from "../level.interface";

export type ObjectType =
  | "polygon"
  | "platform"
  | "platformH1"
  | "platformH2"
  | "platformV1"
  | "platformV2"
  | "savepoint";

export class EditorObjects {
  constructor(private editor: Editor) {}

  place(type: ObjectType, pos: Vector2) {
    switch (type) {
      case "polygon":
        this.createPolygon(pos);
        break;
      case "platform":
      case "platformH1":
      case "platformH2":
      case "platformV1":
      case "platformV2":
        const platform = { type, pos, isDeadly: false };
        this.editor.engine.level.objects!.push(platform);
        this.pointsMap.set(pos, platform as any);
        break;
      case "savepoint":
        const savepoint = {
          type,
          pos,
          isDeadly: false,
        };
        this.editor.engine.level.savepoints.push(pos.x);
        this.editor.engine.level.objects!.push(savepoint);
        this.pointsMap.set(pos, savepoint as any);
        break;
    }
  }

  private createPolygon(pos: Vector2) {
    const commands = this.editor.engine.level.pathCommands;

    let to = pos.copy();
    let command: PathCommand = {
      type: PathCommandType.move,
      points: [to],
      isDeadly: false,
    };
    commands.push(command);
    this.pointsMap.set(to, command);

    to = new Vector2(50, 0).add_(pos);
    command = { type: PathCommandType.line, points: [to], isDeadly: false };
    commands.push(command);
    this.pointsMap.set(to, command);

    to = new Vector2(50, 50).add_(pos);
    command = { type: PathCommandType.line, points: [to], isDeadly: false };
    commands.push(command);
    this.pointsMap.set(to, command);

    to = new Vector2(0, 50).add_(pos);
    command = { type: PathCommandType.line, points: [to], isDeadly: false };
    commands.push(command);
    this.pointsMap.set(to, command);

    commands.push({ type: PathCommandType.close, isDeadly: false });
  }

  get pointsMap() {
    return this.editor.engine.level.pointToCommandMap!;
  }
}
