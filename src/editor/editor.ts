import { Engine } from "../engine";
import { EditorRenderer } from "./editor-renderer";
import { Manipulator } from "./manipulator";
import { EditorUI } from "./editor-ui";
import { Vector2 } from "../vector";
import { EditorObjects } from "./objects";

export type EditorMode = "edit" | "play";

export class Editor {
  initialized = false;

  drawColisionHelpers = false;

  drawPlantsHelpers = false;

  mode: EditorMode = "edit";

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

    this.setMode("edit");

    document.getElementsByTagName("canvas")[0].classList.add("with-cursor");

    const renderer = this.engine.renderer;
    this.originalRenderFn = renderer.render;
    renderer.render = () => {
      this.originalRenderFn.bind(renderer)();
      this.editorRenderer.render(renderer.ctx);
    };

    this.initialized = true;
  }

  destroy() {
    this.setMode("play");
    this.engine.renderer.render = this.originalRenderFn;
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
      let speed = 10;
      if (this.engine.control_.keys_.get("ShiftLeft")) {
        speed = 30;
      }
      if (this.engine.control_.keys_.get("KeyW")) {
        pos.y -= speed;
        this.manipulator.move(new Vector2(0, -speed));
      }
      if (this.engine.control_.keys_.get("KeyS")) {
        pos.y += speed;
        this.manipulator.move(new Vector2(0, speed));
      }
      if (this.engine.control_.keys_.get("KeyA")) {
        pos.x -= speed;
        this.manipulator.move(new Vector2(-speed, 0));
      }
      if (this.engine.control_.keys_.get("KeyD")) {
        pos.x += speed;
        this.manipulator.move(new Vector2(speed, 0));
      }
    }
  }
}
