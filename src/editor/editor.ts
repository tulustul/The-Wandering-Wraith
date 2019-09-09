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
  originalCameraUpdateFn: () => void;

  editorRenderer = new EditorRenderer(this);

  editorObjects = new EditorObjects(this);

  manipulator: Manipulator;

  ui: EditorUI;

  controlsInterval: number;

  constructor(public engine: Engine) {
    this.originalCameraUpdateFn = this.engine.camera.update_;

    window.addEventListener("keydown", event => {
      if (event.key === "e" && !this.initialized) {
        this.init();
      }

      if (event.key === "p") {
        this.engine.game.stopped_ = !this.engine.game.stopped_;
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

    switch (this.mode) {
      case "play":
        this.engine.camera.update_ = () =>
          this.originalCameraUpdateFn.bind(this.engine.camera)();
        break;
      case "edit":
        this.engine.camera.update_ = () =>
          cameraUpdate.bind(this.engine.camera)();
        break;
    }
  }

  updateControls() {
    if (this.initialized && this.mode !== "play") {
      const pos = this.engine.camera.pos;
      let speed = 10;
      if (this.engine.control_.keys_.get("ShiftLeft")) {
        speed = 30;
      }
      if (this.engine.control_.keys_.get("AltLeft")) {
        speed = 1;
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

function cameraUpdate() {}
