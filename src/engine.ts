import { Game } from "./game";
import { AnimationsManager } from "./animations";
import { PhysicsSystem } from "./physics/physics";
import { FoliageSystem } from "./foliage";
import { ParticlesSystem } from "./particles";
import { Player } from "./player";
import { Vector2 } from "./vector";
import { Control } from "./control";
import { Renderer } from "./renderer/renderer";
import { Camera } from "./camera";
import { Level } from "./level.interface";
import { Save, save as save_, loadSave } from "./saves";
import { loadLevel } from "./loader";
import { LEVELS } from "./levels";

// #if process.env.NODE_ENV === 'development'
import { Editor } from "./editor/editor";
// #endif

export class Engine {
  time_ = 0;

  animations = new AnimationsManager();

  physics = new PhysicsSystem();

  foliage = new FoliageSystem();

  particles = new ParticlesSystem(this);

  control_ = new Control(this.game);

  renderer = new Renderer(this);

  camera = new Camera(this);

  player: Player;

  level_: Level;

  currentSave: Save;

  levelTransitionEnter = 0;

  levelTransitionLeave = 0;

  // #if process.env.NODE_ENV === 'development'
  editor = new Editor(this);
  // #endif

  constructor(public game: Game, public canvas_: HTMLCanvasElement) {
    this.control_.init();
  }

  load_(save: Save) {
    this.physics.clear_();

    this.currentSave = save;
    loadLevel(this, save.level_);
    if (!save.pos) {
      save.pos = new Vector2(150, this.level_.startingPos);
    }
    this.respawnPlayer();
    this.renderer.init();
    this.foliage.spawnFoliage(this);
  }

  respawnPlayer() {
    const save = this.currentSave;
    const pos = this.physics.castRay(
      new Vector2(save.pos!.x, save.pos!.y),
      new Vector2(save.pos!.x, this.level_.size_.y),
    );
    save.pos!.y = pos!.y - 10;
    this.player = new Player(this, new Vector2(save.pos!.x, save.pos!.y));
  }

  save_() {
    this.currentSave.pos = this.player.body_.pos.copy();
    save_(this.currentSave);
  }

  update_(timeStep: number) {
    this.time_ += timeStep;
    this.particles.update_();

    if (this.levelTransitionLeave) {
      return;
    }

    this.player.update_();
    this.animations.update_(this.time_);

    if (this.game.stopped_) {
      return;
    }

    const playerPos = this.player.body_.pos;
    for (const savepoint of this.level_.savepoints) {
      if (savepoint > this.currentSave.pos!.x && playerPos.x > savepoint) {
        this.save_();
      }
    }

    if (playerPos.x > this.level_.size_.x + 10) {
      if (this.currentSave.level_ === LEVELS.length - 1) {
        this.game.menu.finish(this.currentSave);
        this.game.stopped_ = true;
        return;
      }
      this.levelTransitionLeave = this.time_;
      setTimeout(() => {
        this.levelTransitionLeave = 0;

        this.currentSave.level_++;
        this.currentSave.pos = null;
        save_(this.currentSave);
        this.load_(this.currentSave);

        this.levelTransitionEnter = this.time_;
        setTimeout(() => {
          this.levelTransitionEnter = 0;
        }, 1100);
      }, 1100);
    }
  }
}
