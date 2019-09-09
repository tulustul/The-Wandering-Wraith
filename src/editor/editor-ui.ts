import { Editor, EditorMode } from "./editor";
import { EDITOR_STYLES, EDITOR_HTML } from "./layout";
import { LevelSerializer } from "./serialization";
import { Listeners } from "./listeners";
import { LevelParser } from "../loader";
import { CanBeDeadly } from "../level.interface";
import { LEVELS } from "../levels";
import { Vector2 } from "../vector";

export class EditorUI {
  private listeners = new Listeners();

  deadlyInputLabel: HTMLLabelElement;
  deadlyInput: HTMLInputElement;

  constructor(private editor: Editor) {
    this.renderHtml();

    this.deadlyInputLabel = document.getElementById(
      "deadly-input-label",
    )! as HTMLLabelElement;
    this.deadlyInput = document.getElementById(
      "deadly-input",
    )! as HTMLInputElement;

    (document.getElementById(
      "level",
    ) as HTMLSelectElement).value = this.engine.currentSave.level_.toString();

    this.hideDeadlyToggle();

    this.listeners.listen("draw-colision-helpers", "change", event => {
      this.editor.drawColisionHelpers = (event.target as HTMLInputElement).checked;
    });

    this.listeners.listen("draw-plants-helpers", "change", event => {
      this.editor.drawPlantsHelpers = (event.target as HTMLInputElement).checked;
    });

    this.listeners.listen("toggle-pause", "click", () => {
      this.engine.game.stopped_ = !this.engine.game.stopped_;
    });

    this.listeners.listen("save-game", "click", () => {
      this.engine.save_();
    });

    this.listeners.listen("clear-plants", "click", () => {
      this.engine.foliage.entities_ = [];
    });

    this.listeners.listen("spawn-plants", "click", () => {
      this.engine.foliage.spawnFoliage(this.engine);
    });

    this.listeners.listen("move-player", "click", () => {
      this.engine.player.body_.pos.x =
        this.engine.camera.pos.x + this.engine.canvas_.width / 2;
      this.engine.player.body_.pos.y =
        this.engine.camera.pos.y + this.engine.canvas_.height / 2 - 150;
    });

    this.listeners.listen("get-player-position", "click", () => {
      console.log(this.engine.player.body_.pos);
    });

    this.listeners.listen("deadly-input", "change", event => {
      for (const p of this.editor.manipulator.selectedPoints) {
        const object = this.editor.engine.level_.pointToCommandMap!.get(p);
        if (object) {
          object.isDeadly = (event.target as HTMLInputElement).checked;
        }
      }
    });

    this.listeners.listen("regenerate-level", "click", () => {
      this.engine.physics.staticBodies = [];
      this.engine.physics.grid.clear();
      const level = new LevelSerializer().serialize(this.engine.level_);
      new LevelParser(this.engine, level).parse_();
    });

    this.listeners.listen("generate-level-string", "click", () => {
      const levelString = new LevelSerializer().serialize(
        this.editor.engine.level_,
      );
      const textarea = document.getElementById(
        "level-string",
      ) as HTMLTextAreaElement;
      textarea.value = levelString;
    });

    this.listeners.listen("object-type", "change", event => {
      const objectToAdd = (event.target! as HTMLSelectElement).value;
      this.editor.manipulator.objectToAdd = objectToAdd as any;
    });

    this.listeners.listen("level", "change", event => {
      const level = parseInt((event.target! as HTMLSelectElement).value);
      this.editor.engine.load_({
        level_: level,
        pos: null,
        crystals: {},
      });

      // Resetting mode will rebind the camera to editor mode
      this.editor.setMode(this.editor.mode);
    });

    this.listeners.listen("close-editor", "click", () => {
      this.editor.destroy();
      this.listeners.clear();
      document.getElementById("editor-css")!.remove();
      document.getElementById("editor")!.remove();
    });

    document.querySelectorAll("[name=mode]").forEach(modeInput =>
      this.listeners.listen(modeInput, "change", event => {
        const input = event.target as HTMLInputElement;
        if (input.checked) {
          this.editor.setMode(input.value as EditorMode);
        }
      }),
    );
  }

  get engine() {
    return this.editor.engine;
  }

  clearObjectType() {
    const select = document.getElementById("object-type") as HTMLSelectElement;
    select.value = "";
  }

  showDeadlyToggle(object: CanBeDeadly) {
    this.deadlyInput.checked = object.isDeadly;
    this.deadlyInputLabel.classList.remove("hidden");
  }

  hideDeadlyToggle() {
    this.deadlyInputLabel.classList.add("hidden");
  }

  private renderHtml() {
    const stylesEl = document.createElement("style") as any;
    stylesEl.id = "editor-css";
    stylesEl.type = "text/css";
    stylesEl.append(document.createTextNode(EDITOR_STYLES));
    document.head.append(stylesEl);

    const editorEl = document.createElement("div");
    editorEl.id = "editor";
    editorEl.innerHTML = EDITOR_HTML;
    document.body.append(editorEl);

    this.renderLevelOptions();
  }

  renderLevelOptions() {
    const levelEl = document.getElementById("level") as HTMLSelectElement;
    for (let i = 0; i < LEVELS.length; i++) {
      const option = document.createElement("option");
      option.value = i.toString();
      option.innerText = i.toString();
      levelEl.append(option);
    }
  }
}
