import { Vector2 } from "../vector";
import { Editor } from "./editor";
import {
  BezierCommand,
  PathCommand,
  MoveCommand,
  LineCommand,
} from "./level.interface";
import { TREE_GROUND_MASK } from "../colisions-masks";
import { Listeners } from "./listeners";
import { ObjectType } from "./objects";

export class Manipulator {
  focusedPoint: Vector2 | null;

  selectedPoints = new Set<Vector2>();

  selectionArea: [Vector2, Vector2] | null = null;

  objectToAdd: ObjectType | "" = "";

  private isMousePressed = false;

  private listeners = new Listeners();

  constructor(public editor: Editor) {
    this.listeners.listen(window, "keydown", (event: KeyboardEvent) => {
      if (this.selectedPoints.size === 1) {
        const pathCommand = this.editor.level.pointToCommandMap.get(
          Array.from(this.selectedPoints)[0],
        )!;
        if (event.key === "c") {
          this.cutAfterPoint(pathCommand);
        }
        if (event.key === "v") {
          this.togglePointBetweenBezierAndLine(pathCommand);
        }
      }

      if (event.key === "Delete") {
        for (const point of this.selectedPoints) {
          const pathCommand = this.editor.level.pointToCommandMap.get(point)!;
          this.deletePoint(pathCommand);
        }
      }
    });

    const canvas = this.editor.engine.canvas_;

    this.listeners.listen(canvas, "mousedown", (event: MouseEvent) => {
      const pos = this.mousePosToWorldPos(new Vector2(event.x, event.y));

      if (this.objectToAdd !== "") {
        this.editor.editorObjects.place(this.objectToAdd, pos);
        this.objectToAdd = "";
        this.editor.ui.clearObjectType();
        return;
      }
      this.isMousePressed = true;
      this.selectionArea = null;
      if (this.focusedPoint) {
        if (!this.selectedPoints.has(this.focusedPoint)) {
          this.selectedPoints.clear();
          this.selectedPoints.add(this.focusedPoint);
        }
      } else {
        this.selectedPoints.clear();
        this.selectionArea = [pos, pos.copy()];
      }
    });

    this.listeners.listen(canvas, "mouseup", () => {
      this.isMousePressed = false;
      if (this.selectionArea) {
        const [f, t] = this.selectionArea;
        const [from, to] = [
          new Vector2(Math.min(f.x, t.x), Math.min(f.y, t.y)),
          new Vector2(Math.max(f.x, t.x), Math.max(f.y, t.y)),
        ];
        this.selectedPoints.clear();
        for (const p of this.editor.level.pointToCommandMap.keys()) {
          if (p.x > from.x && p.y > from.y && p.x < to.x && p.y < to.y) {
            this.selectedPoints.add(p);
          }
        }
        this.selectionArea = null;
      }
    });

    this.listeners.listen(canvas, "mousemove", (event: MouseEvent) => {
      this.focusedPoint = null;

      const diff = this.scalePosToWorld(
        new Vector2(event.movementX, event.movementY),
      ).mul(0.8); // no idea why 0.8 is needed :(

      this.move(diff);

      if (this.selectionArea) {
        const pos = this.mousePosToWorldPos(new Vector2(event.x, event.y));
        this.selectionArea[1] = pos;
      }

      const pointerPos = this.mousePosToWorldPos(
        new Vector2(event.x, event.y),
      );
      for (const p of this.editor.level.pointToCommandMap.keys()) {
        if (p.distanceTo(pointerPos) < 5) {
          this.focusedPoint = p;
        }
      }
    });
  }

  destroy() {
    this.listeners.clear();
  }

  move(v: Vector2) {
    if (this.isMousePressed) {
      for (const point of this.selectedPoints) {
        point.add_(v);
        const pathCommand = this.editor.level.pointToCommandMap.get(point)!;
        if (
          this.selectedPoints.size === 1 &&
          pathCommand.type === "bezierTo" &&
          point === (pathCommand as BezierCommand).to
        ) {
          (pathCommand as BezierCommand).c1.add_(v);
          (pathCommand as BezierCommand).c2.add_(v);
        }
      }
    }
  }

  private cutAfterPoint(pathCommand: PathCommand) {
    const index = this.editor.level.pathCommands.indexOf(pathCommand);
    if (index !== -1) {
      const nextPathCommand = this.editor.level.pathCommands[index + 1];
      if (
        nextPathCommand.type === "lineTo" ||
        nextPathCommand.type === "bezierTo"
      ) {
        const from = (pathCommand as MoveCommand).to;
        const to = (nextPathCommand as MoveCommand).to;
        const diff = from.copy().sub_(to);
        const newPoint = from.copy().add_(diff.mul(-0.5));
        const newCommand: LineCommand = {
          type: "lineTo",
          to: newPoint,
          isDeadly: false,
          mask: TREE_GROUND_MASK,
        };
        this.editor.level.pathCommands.splice(index + 1, 0, newCommand);
        this.editor.level.pointToCommandMap.set(newPoint, newCommand);
      }
    }
  }

  private deletePoint(pathCommand: PathCommand) {
    const index = this.editor.level.pathCommands.indexOf(pathCommand);
    if (index !== -1) {
      this.editor.level.pathCommands.splice(index, 1);
    }
  }

  private togglePointBetweenBezierAndLine(pathCommand: PathCommand) {
    if (pathCommand.type === "lineTo") {
      pathCommand.type = "bezierTo";
      const bezier = pathCommand as BezierCommand;
      const diff = new Vector2(10, 10);
      bezier.c1 = bezier.to.copy().add_(diff);
      bezier.c2 = bezier.to.copy().sub_(diff);
      this.editor.level.pointToCommandMap.set(bezier.c1, bezier);
      this.editor.level.pointToCommandMap.set(bezier.c2, bezier);
    } else if (pathCommand.type === "bezierTo") {
      pathCommand.type = "lineTo";
    }
  }

  private mousePosToWorldPos(p: Vector2) {
    p = this.scalePosToWorld(p);
    const pos = this.editor.engine.camera.pos.copy().mul(-1);
    return new Vector2(pos.x + p.x, pos.y + p.y);
  }

  private scalePosToWorld(p: Vector2) {
    const canvas = this.editor.engine.canvas_;
    const scale = canvas.width / canvas.clientWidth;
    return new Vector2(p.x * scale, p.y * scale);
  }
}
