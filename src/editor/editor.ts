import { Engine } from "../engine";
import { EditorRenderer } from "./editor-renderer";
import { LevelSerializer } from "./serialization";
import { LEVELS } from "../levels";
import { Level } from "./level.interface";
import { Manipulator } from "./manipulator";
import { EditorUI } from "./editor-ui";
import { Vector2 } from "../vector";
import { EditorObjects } from "./objects";

export type EditorMode = "edit" | "draw" | "place" | "play";

export class Editor {
  initialized = false;

  drawColisionHelpers = false;

  drawPlantsHelpers = false;

  mode: EditorMode = "edit";

  level: Level;

  originalRenderFn: () => void;

  editorRenderer = new EditorRenderer(this);

  editorObjects = new EditorObjects(this);

  manipulator: Manipulator;

  ui: EditorUI;

  controlsInterval: number;

  constructor(public engine: Engine) {
    window.addEventListener("keydown", event => {
      if (event.key === "e" && !this.initialized) {
        this.init();
      }
    });
  }

  init() {
    this.manipulator = new Manipulator(this);
    this.ui = new EditorUI(this);
    this.controlsInterval = window.setInterval(
      () => this.updateControls(),
      17,
    );

    this.level = new LevelSerializer().deserialize(LEVELS[0]);

    this.setMode("edit");

    document.getElementsByTagName("canvas")[0].classList.add("with-cursor");

    const systemsRenderer = this.engine.renderer.systemsRenderer;
    this.originalRenderFn = systemsRenderer.render;
    systemsRenderer.render = () => {
      this.originalRenderFn.bind(systemsRenderer)();
      this.editorRenderer.render(systemsRenderer.ctx);
    };

    this.initialized = true;
  }

  destroy() {
    this.setMode("play");
    this.engine.renderer.systemsRenderer.render = this.originalRenderFn;
    this.manipulator.destroy();
    this.initialized = false;
    window.clearInterval(this.controlsInterval);
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
        this.manipulator.move(new Vector2(0, -10));
      }
      if (this.engine.control_.keys_.get("KeyS")) {
        pos.y += 10;
        this.manipulator.move(new Vector2(0, 10));
      }
      if (this.engine.control_.keys_.get("KeyA")) {
        pos.x -= 10;
        this.manipulator.move(new Vector2(-10, 0));
      }
      if (this.engine.control_.keys_.get("KeyD")) {
        pos.x += 10;
        this.manipulator.move(new Vector2(10, 0));
      }
    }
  }
}
