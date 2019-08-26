import { Editor, EditorMode } from "./editor";
import { EDITOR_STYLES, EDITOR_HTML } from "./layout";
import { LevelSerializer } from "./serialization";

export class EditorUI {
  constructor(private editor: Editor) {
    this.renderHtml();

    document
      .getElementById("draw-colision-helpers")!
      .addEventListener("change", event => {
        this.editor.drawColisionHelpers = (event.target as HTMLInputElement).checked;
      });

    document
      .getElementById("draw-plants-helpers")!
      .addEventListener("change", event => {
        this.editor.drawPlantsHelpers = (event.target as HTMLInputElement).checked;
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
        const levelString = new LevelSerializer().serialize(this.editor.level);
        const textarea = document.getElementById(
          "level-string",
        ) as HTMLTextAreaElement;
        textarea.value = levelString;
      });

    document.getElementById("close-editor")!.addEventListener("click", () => {
      document.getElementById("editor-css")!.remove();
      document.getElementById("editor")!.remove();
      this.editor.destroy();
    });

    document.querySelectorAll("[name=mode]").forEach(modeInput =>
      modeInput.addEventListener("change", event => {
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

  renderHtml() {
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
