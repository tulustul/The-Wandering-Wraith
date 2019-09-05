import { Vector2 } from "../vector";
import { Editor } from "./editor";
import { Listeners } from "./listeners";
import { ObjectType } from "./objects";
import { PathCommandType, PathCommand, CanBeDeadly } from "../level.interface";

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
        const pathCommand = this.pointsMap!.get(
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
          const object = this.pointsMap!.get(point)!;
          this.deleteObject(object);
        }
      }
    });

    const canvas = this.editor.engine.canvas_;

    this.listeners.listen(canvas, "mousedown", (event: MouseEvent) => {
      const pos = this.mousePosToWorldPos(new Vector2(event.x, event.y));

      if (this.objectToAdd !== "") {
        this.editor.editorObjects.place(this.objectToAdd, pos.copy());
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
        for (const p of this.pointsMap!.keys()) {
          if (p.x > from.x && p.y > from.y && p.x < to.x && p.y < to.y) {
            this.selectedPoints.add(p);
          }
        }
        this.selectionArea = null;
      }
      if (this.selectedPoints.size === 1) {
        const p = Array.from(this.selectedPoints)[0];
        const object = this.editor.engine.level_.pointToCommandMap!.get(p);
        this.editor.ui.showDeadlyToggle(object as CanBeDeadly);
      } else {
        this.editor.ui.hideDeadlyToggle();
      }
    });

    this.listeners.listen(canvas, "mousemove", (event: MouseEvent) => {
      this.focusedPoint = null;

      const diff = this.scalePosToWorld(
        new Vector2(event.movementX, event.movementY),
      );

      this.move(diff);

      if (this.selectionArea) {
        const pos = this.mousePosToWorldPos(new Vector2(event.x, event.y));
        this.selectionArea[1] = pos;
      }

      const pointerPos = this.mousePosToWorldPos(
        new Vector2(event.x, event.y),
      );
      for (const p of this.pointsMap!.keys()) {
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
        const pathCommand = this.pointsMap!.get(point)!;
        if (
          this.selectedPoints.size === 1 &&
          pathCommand.type === PathCommandType.bezier &&
          point === pathCommand.points![2]
        ) {
          pathCommand.points![0].add_(v);
          pathCommand.points![1].add_(v);
        }
      }
    }
  }

  private cutAfterPoint(pathCommand: PathCommand) {
    const index = this.pathCommands.indexOf(pathCommand);
    if (index !== -1) {
      const nextPathCommand = this.pathCommands[index + 1];
      if (
        nextPathCommand.type === PathCommandType.line ||
        nextPathCommand.type === PathCommandType.bezier
      ) {
        const from = pathCommand.points![0];
        const to = nextPathCommand.points![0];
        const diff = from.copy().sub_(to);
        const newPoint = from.copy().add_(diff.mul(-0.5));
        const newCommand: PathCommand = {
          type: PathCommandType.line,
          points: [newPoint],
          isDeadly: pathCommand.isDeadly,
        };
        this.pathCommands.splice(index + 1, 0, newCommand);
        this.pointsMap!.set(newPoint, newCommand);
      }
    }
  }

  private deleteObject(object: any) {
    let index = this.pathCommands.indexOf(object);
    if (index !== -1) {
      this.pathCommands.splice(index, 1);
    }

    index = this.pathCommands.indexOf(object);
    if (index !== -1) {
      this.pathCommands.splice(index, 1);
    }

    index = this.objects.indexOf(object);
    if (index !== -1) {
      this.objects.splice(index, 1);
    }
  }

  private togglePointBetweenBezierAndLine(pathCommand: PathCommand) {
    if (pathCommand.type === PathCommandType.line) {
      pathCommand.type = PathCommandType.bezier;
      const diff = new Vector2(10, 10);
      const to = pathCommand.points![0];
      pathCommand.points = [to.copy().add_(diff), to.copy().sub_(diff), to];
      this.pointsMap.set(pathCommand.points[0], pathCommand);
      this.pointsMap.set(pathCommand.points[1], pathCommand);
    } else if (pathCommand.type === PathCommandType.bezier) {
      pathCommand.type = PathCommandType.line;
    }
  }

  private mousePosToWorldPos(p: Vector2) {
    p = this.scalePosToWorld(p);
    const pos = this.editor.engine.camera.pos;
    return new Vector2(pos.x + p.x, pos.y + p.y);
  }

  private scalePosToWorld(p: Vector2) {
    const canvas = this.editor.engine.canvas_;
    const scale = canvas.width / canvas.clientWidth;
    return new Vector2(p.x * scale, p.y * scale);
  }

  get level() {
    return this.editor.engine.level_;
  }

  get pointsMap() {
    return this.level.pointToCommandMap!;
  }

  get pathCommands() {
    return this.level.pathCommands;
  }

  get objects() {
    return this.level.objects!;
  }
}
