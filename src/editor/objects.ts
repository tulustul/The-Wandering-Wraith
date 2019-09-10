import { Vector2 } from "../vector";
import { Editor } from "./editor";
import {
  PathCommand,
  PathCommandType,
  LevelObject,
  PickableType,
} from "../level.interface";
import { stringify } from "querystring";

export type ObjectType =
  | "polygon"
  | "platform"
  | "platformH1"
  | "platformH2"
  | "platformV1"
  | "platformV2"
  | "platformB1"
  | "platformB2"
  | "savepoint"
  | "crystal"
  | "gravityCrystal"
  | "bubble";

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
      case "platformB1":
      case "platformB2":
        const platform: LevelObject = { type, pos, isDeadly: false };
        this.editor.engine.level_.objects!.push(platform);
        this.pointsMap.set(pos, platform as any);
        break;
      case "savepoint":
        const savepoint: LevelObject = {
          type,
          pos,
          isDeadly: false,
        };
        this.editor.engine.level_.savepoints.push(pos.x);
        this.editor.engine.level_.objects!.push(savepoint);
        this.pointsMap.set(pos, savepoint as any);
        break;
      case "crystal":
      case "gravityCrystal":
      case "bubble":
        const typeMap = new Map<string, PickableType>([
          ["crystal", PickableType.crystal],
          ["gravityCrystal", PickableType.gravityCrystal],
          ["bubble", PickableType.bubble],
        ]);
        const pickable: LevelObject = {
          type,
          pos,
          isDeadly: false,
        };
        this.editor.engine.level_.pickables.push({
          type: typeMap.get(type)!,
          collected: false,
          pos,
          radius: 25,
        });
        this.editor.engine.level_.objects!.push(pickable);
        this.pointsMap.set(pos, pickable as any);
        break;
    }
  }

  private createPolygon(pos: Vector2) {
    const commands = this.editor.engine.level_.pathCommands;

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
    return this.editor.engine.level_.pointToCommandMap!;
  }
}
