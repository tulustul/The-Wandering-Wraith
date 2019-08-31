import { Editor, EditorMode } from "./editor";
import { EDITOR_STYLES, EDITOR_HTML } from "./layout";
import { LevelSerializer } from "./serialization";
import { Listeners } from "./listeners";
import { LevelParser } from "../loader";
import { CanBeDeadly } from "../level.interface";

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

    this.hideDeadlyToggle();

    this.listeners.listen("draw-colision-helpers", "change", event => {
      this.editor.drawColisionHelpers = (event.target as HTMLInputElement).checked;
    });

    this.listeners.listen("draw-plants-helpers", "change", event => {
      this.editor.drawPlantsHelpers = (event.target as HTMLInputElement).checked;
    });

    this.listeners.listen("toggle-pause", "click", () => {
      this.engine.game.paused_ = !this.engine.game.paused_;
    });

    this.listeners.listen("clear-plants", "click", () => {
      this.engine.foliage.entities_ = [];
    });

    this.listeners.listen("spawn-plants", "click", () => {
      this.engine.foliage.spawnFoliage(this.engine);
    });

    this.listeners.listen("move-player", "click", () => {
      this.engine.player.body_.pos.x = this.engine.camera.target.x;
      this.engine.player.body_.pos.y = this.engine.camera.target.y - 150;
    });

    this.listeners.listen("get-player-position", "click", () => {
      console.log(this.engine.player.body_.pos);
    });

    this.listeners.listen("deadly-input", "change", event => {
      for (const p of this.editor.manipulator.selectedPoints) {
        const object = this.editor.engine.level.pointToCommandMap!.get(p);
        if (object) {
          object.isDeadly = (event.target as HTMLInputElement).checked;
        }
      }
    });

    this.listeners.listen("regenerate-level", "click", () => {
      this.engine.physics.staticBodies = [];
      this.engine.physics.staticGrid.clear();
      const level = new LevelSerializer().serialize(this.engine.level);
      new LevelParser(this.engine, level).parse_();
    });

    this.listeners.listen("generate-level-string", "click", () => {
      const levelString = new LevelSerializer().serialize(
        this.editor.engine.level,
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
  }
}
