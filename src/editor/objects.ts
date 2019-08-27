import { Vector2 } from "../vector";
import { Editor } from "./editor";
import { MoveCommand, LineCommand, CloseCommand } from "./level.interface";

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
    const commands = this.editor.level.pathCommands;

    let to = pos.copy();
    let command = { type: "moveTo", to } as MoveCommand;
    commands.push(command);
    this.editor.level.pointToCommandMap.set(to, command);

    to = new Vector2(50, 0).add_(pos);
    command = { type: "lineTo", to } as LineCommand;
    commands.push(command);
    this.editor.level.pointToCommandMap.set(to, command);

    to = new Vector2(50, 50).add_(pos);
    command = { type: "lineTo", to } as LineCommand;
    commands.push(command);
    this.editor.level.pointToCommandMap.set(to, command);

    to = new Vector2(0, 50).add_(pos);
    command = { type: "lineTo", to } as LineCommand;
    commands.push(command);
    this.editor.level.pointToCommandMap.set(to, command);

    commands.push({ type: "close" } as CloseCommand);
  }
}
