import { Engine } from "../engine";
import { drawPlantsHelpers, drawColisionHelpers } from "./debug-renderer";
import { Vector2 } from "../vector";
import { LevelSerializer } from "./serialization";
import { LEVELS } from "../levels";
import {
  Level,
  MoveCommand,
  LineCommand,
  BezierCommand,
  PathCommand,
} from "./level.interface";
import { TREE_GROUND_MASK } from "../colisions-masks";

const styles = `
body {
  display: flex;
  background-color: #555;
} 

canvas.with-cursor {
  cursor: initial;
}

#editor {
  display: flex;
  flex-direction: column;
  padding: 10px;
  color: white;
  min-width: 300px;
  background-color: #333;
}

.line {
  display: flex;
}

.stack {
  display: flex;
  flex-direction: column;
}

#content {
  flex: 1;
}

#output-wrapper {
  display: flex;
  flex-direction: column;
}
`;

const html = `
<h3>Editor</h3>

<div id="content">
  <div class="stack">
    <label>
      <input id="draw-colision-helpers" type="checkbox">
      Draw colision helpers
    </label>

    <label>
      <input id="draw-plants-helpers" type="checkbox">
      Draw plants helpers
    </label>
  </div>

  <button id="toggle-pause">Toggle pause</button>
  <button id="clear-plants">Clear plants</button>
  <button id="spawn-plants">Spawn plants</button>
  <button id="get-player-position">Get player position</button>
  <button id="move-player">Move player</button>

  <div class="line">
    <label><input type="radio" name="mode" value="edit">Edit</label>
    <label><input type="radio" name="mode" value="draw">Draw</label>
    <label><input type="radio" name="mode" value="place">Place</label>
    <label><input type="radio" name="mode" value="play">Play</label>
  </div>
</div>

<label id="output-wrapper">
  <button id="generate-level-string">Generate level string</button>
  Level string
  <textarea id="level-string" rows="5"></textarea>
  <button id="close-editor">Close editor</button>
  </label>
`;

type EditorMode = "edit" | "draw" | "place" | "play";

export class Editor {
  drawColisionHelpers = false;

  drawPlantsHelpers = false;

  mousePos: Vector2 | null;

  initialized = false;

  mode: EditorMode = "edit";

  level: Level;

  focusedPoint: Vector2 | null;

  selectedPoint: Vector2 | null;

  originalRenderFn: () => void;

  constructor(private engine: Engine) {
    window.addEventListener("keydown", event => {
      if (event.key === "e" && !this.initialized) {
        this.init();
      }
      if (this.selectedPoint) {
        const pathCommand = this.level.pointToCommandMap.get(
          this.selectedPoint,
        )!;
        if (event.key === "c") {
          this.cutAfterPoint(pathCommand);
        }
        if (event.key === "Delete") {
          this.deletePoint(pathCommand);
        }
        if (event.key === "v") {
          this.togglePointBetweenBezierAndLine(pathCommand);
        }
      }
    });
  }

  init() {
    setInterval(() => this.updateControls(), 17);

    this.level = new LevelSerializer().deserialize(LEVELS[0]);

    this.renderHtml();
    this.setMode("edit");

    document
      .getElementById("draw-colision-helpers")!
      .addEventListener("change", event => {
        this.drawColisionHelpers = (event.target as HTMLInputElement).checked;
      });

    document
      .getElementById("draw-plants-helpers")!
      .addEventListener("change", event => {
        this.drawPlantsHelpers = (event.target as HTMLInputElement).checked;
      });

    document.getElementById("toggle-pause")!.addEventListener("click", () => {
      this.engine.game.paused_ = !this.engine.game.paused_;
    });

    document.getElementById("clear-plants")!.addEventListener("click", () => {
      this.engine.foliage.entities_ = [];
    });

    document.getElementById("spawn-plants")!.addEventListener("click", () => {
      this.engine.foliage.spawnFoliage(this.engine);
    });

    document.getElementById("move-player")!.addEventListener("click", () => {
      this.engine.player.body_.pos.x = this.engine.camera.target.x;
      this.engine.player.body_.pos.y = this.engine.camera.target.y - 150;
    });

    document
      .getElementById("get-player-position")!
      .addEventListener("click", () => {
        console.log(this.engine.player.body_.pos);
      });

    document
      .getElementById("generate-level-string")!
      .addEventListener("click", () => {
        const levelString = new LevelSerializer().serialize(this.level);
        const textarea = document.getElementById(
          "level-string",
        ) as HTMLTextAreaElement;
        textarea.value = levelString;
      });

    document.getElementById("close-editor")!.addEventListener("click", () => {
      this.setMode("play");
      document.getElementById("editor-css")!.remove();
      document.getElementById("editor")!.remove();
      this.engine.renderer.systemsRenderer.render = this.originalRenderFn;
      this.initialized = false;
    });

    document.querySelectorAll("[name=mode]").forEach(modeInput =>
      modeInput.addEventListener("change", event => {
        const input = event.target as HTMLInputElement;
        if (input.checked) {
          this.setMode(input.value as EditorMode);
        }
      }),
    );

    document.getElementsByTagName("canvas")[0].classList.add("with-cursor");

    this.engine.canvas_.addEventListener("mousedown", event => {
      if (this.focusedPoint) {
        this.selectedPoint = this.focusedPoint;
      }
    });

    this.engine.canvas_.addEventListener("mouseup", () => {
      this.selectedPoint = null;
    });

    this.engine.canvas_.addEventListener("mousemove", event => {
      this.focusedPoint = null;

      if (this.selectedPoint) {
        const newPos = this.mousePosToWorldPos(new Vector2(event.x, event.y));
        const diff = newPos.copy().sub_(this.selectedPoint);
        this.selectedPoint.add_(diff);
        const pathCommand = this.level.pointToCommandMap.get(
          this.selectedPoint,
        )!;
        if (
          pathCommand.type === "bezierTo" &&
          this.selectedPoint === (pathCommand as BezierCommand).absTo
        ) {
          (pathCommand as BezierCommand).absC1.add_(diff);
          (pathCommand as BezierCommand).absC2.add_(diff);
        }
      }

      const pointerPos = this.mousePosToWorldPos(
        new Vector2(event.x, event.y),
      );
      for (const p of this.level.pointToCommandMap.keys()) {
        if (p.distanceTo(pointerPos) < 5) {
          this.focusedPoint = p;
        }
      }
    });

    const systemsRenderer = this.engine.renderer.systemsRenderer;
    this.originalRenderFn = systemsRenderer.render;
    systemsRenderer.render = () => {
      this.originalRenderFn.bind(systemsRenderer)();
      this.render();
    };

    this.initialized = true;
  }

  renderHtml() {
    const stylesEl = document.createElement("style") as any;
    stylesEl.id = "editor-css";
    stylesEl.type = "text/css";
    stylesEl.append(document.createTextNode(styles));
    document.head.append(stylesEl);

    const editorEl = document.createElement("div");
    editorEl.id = "editor";
    editorEl.innerHTML = html;
    document.body.append(editorEl);
  }

  setMode(mode: EditorMode) {
    this.mode = mode;

    const editInput = document.querySelector(
      `[name=mode][value=${mode}]`,
    )! as HTMLInputElement;
    editInput.checked = true;

    this.engine.camera.bindToTarget(this.engine.player.body_.pos.copy());

    switch (this.mode) {
      case "play":
        this.engine.camera.bindToTarget(this.engine.player.body_.pos);
        break;
    }
  }

  updateControls() {
    if (this.initialized && this.mode !== "play") {
      const pos = this.engine.camera.target;
      if (this.engine.control_.keys_.get("KeyW")) {
        pos.y -= 10;
      }
      if (this.engine.control_.keys_.get("KeyS")) {
        pos.y += 10;
      }
      if (this.engine.control_.keys_.get("KeyA")) {
        pos.x -= 10;
      }
      if (this.engine.control_.keys_.get("KeyD")) {
        pos.x += 10;
      }
    }
  }

  render() {
    const systemsRenderer = this.engine.renderer.systemsRenderer;

    if (this.drawColisionHelpers) {
      drawColisionHelpers.bind(systemsRenderer)();
    }

    if (this.drawPlantsHelpers) {
      drawPlantsHelpers.bind(systemsRenderer)();
    }

    const ctx = systemsRenderer.ctx;

    let to: Vector2;
    ctx.fillStyle = "orange";
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 2;

    for (const pathCommand of this.level.pathCommands) {
      switch (pathCommand.type) {
        case "moveTo":
          to = (pathCommand as MoveCommand).absTo;
          ctx.beginPath();
          ctx.moveTo(to.x, to.y);
          break;
        case "lineTo":
          to = (pathCommand as LineCommand).absTo;
          ctx.lineTo(to.x, to.y);
          break;
        case "bezierTo":
          const from = (pathCommand as BezierCommand).relFrom;
          to = (pathCommand as BezierCommand).absTo;
          const c1 = (pathCommand as BezierCommand).absC1;
          const c2 = (pathCommand as BezierCommand).absC2;
          // for (const p of generateBezierSegments([from, to, c1, c2], 0.1)) {
          //   ctx.lineTo(p[1].x, p[1].y);
          // }
          ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, to.x, to.y);
          break;
        case "close":
          ctx.closePath();
          ctx.fill();
          break;
      }
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = "red";
    for (const pathCommand of this.level.pathCommands) {
      switch (pathCommand.type) {
        case "moveTo":
          to = (pathCommand as MoveCommand).absTo;
          this.drawPoint(ctx, to, "blue");
          break;
        case "lineTo":
          to = (pathCommand as LineCommand).absTo;
          this.drawPoint(ctx, to, "darkorange");
          break;
        case "bezierTo":
          to = (pathCommand as BezierCommand).absTo;
          const c1 = (pathCommand as BezierCommand).absC1;
          const c2 = (pathCommand as BezierCommand).absC2;
          this.drawPoint(ctx, to, "darkorange");
          this.drawPoint(ctx, c1, "red");
          this.drawPoint(ctx, c2, "red");
          ctx.beginPath();
          ctx.moveTo(c1.x, c1.y);
          ctx.lineTo(to.x, to.y);
          ctx.lineTo(c2.x, c2.y);
          ctx.stroke();
          break;
        case "close":
          ctx.closePath();
          break;
      }
    }
  }

  private drawPoint(ctx: CanvasRenderingContext2D, p: Vector2, fill: string) {
    ctx.fillStyle = fill;
    if (p === this.focusedPoint) {
      ctx.fillStyle = "yellow";
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }

  private mousePosToWorldPos(p: Vector2) {
    const canvas = this.engine.canvas_;
    const scale = canvas.width / canvas.clientWidth;
    const pos = this.engine.camera.pos.copy().mul(-1);
    return new Vector2(pos.x + p.x * scale, pos.y + p.y * scale);
  }

  cutAfterPoint(pathCommand: PathCommand) {
    const index = this.level.pathCommands.indexOf(pathCommand);
    if (index !== -1) {
      const nextPathCommand = this.level.pathCommands[index + 1];
      if (
        nextPathCommand.type === "lineTo" ||
        nextPathCommand.type === "bezierTo"
      ) {
        const from = (pathCommand as MoveCommand).absTo;
        const to = (nextPathCommand as MoveCommand).absTo;
        const diff = from.copy().sub_(to);
        const newPoint = from.copy().add_(diff.mul(0.5));
        const newCommand: LineCommand = {
          type: "lineTo",
          absTo: newPoint,
          isDeadly: false,
          mask: TREE_GROUND_MASK,
          relTo: new Vector2(),
        };
        this.level.pathCommands.splice(index, 0, newCommand);
        this.level.pointToCommandMap.set(newPoint, newCommand);
      }
    }
  }

  deletePoint(pathCommand: PathCommand) {
    const index = this.level.pathCommands.indexOf(pathCommand);
    if (index !== -1) {
      this.level.pathCommands.splice(index, 1);
    }
  }

  togglePointBetweenBezierAndLine(pathCommand: PathCommand) {
    if (pathCommand.type === "lineTo") {
      pathCommand.type = "bezierTo";
      const bezier = pathCommand as BezierCommand;
      const diff = new Vector2(10, 10);
      bezier.absC1 = bezier.absTo.copy().add_(diff);
      bezier.absC2 = bezier.absTo.copy().sub_(diff);
      this.level.pointToCommandMap.set(bezier.absC1, bezier);
      this.level.pointToCommandMap.set(bezier.absC2, bezier);
    } else if (pathCommand.type === "bezierTo") {
      pathCommand.type = "lineTo";
    }
  }
}
