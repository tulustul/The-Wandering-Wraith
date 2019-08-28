import { Vector2 } from "../vector";
import { Editor } from "./editor";
import { PathCommand, PathCommandType } from "../level.interface";

export type ObjectType = "shape";

export class EditorObjects {
  constructor(private editor: Editor) {}

  place(type: ObjectType, pos: Vector2) {
    switch (type) {
      case "shape":
        this.createShape(pos);
    }
  }

  private createShape(pos: Vector2) {
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
