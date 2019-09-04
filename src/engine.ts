import { Game } from "./game";
import { AnimationsManager } from "./animations";
import { PhysicsSystem } from "./systems/physics/physics";
import { FoliageSystem } from "./systems/foliage";
import { ParticlesSystem } from "./particles";
import { Player } from "./systems/player";
import { Vector2 } from "./vector";
import { Control } from "./control";
import { Renderer } from "./renderer/renderer";
import { Camera } from "./camera";
import { Level } from "./level.interface";
import { Save, save } from "./saves";
import { loadLevel } from "./loader";

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

  level: Level = {
    size: new Vector2(),
    pathCommands: [],
    platforms: [],
    savepoints: [],
    pickables: [],
  };

  currentSave: Save;

  // #if process.env.NODE_ENV === 'development'
  editor = new Editor(this);
  // #endif

  constructor(public game: Game, public canvas_: HTMLCanvasElement) {
    this.renderer.updateSize();
    this.control_.init();
  }

  load(save: Save) {
    this.physics.clear_();

    this.currentSave = save;
    loadLevel(this, save.level);
    this.respawnPlayer();
    this.renderer.init();
    this.foliage.spawnFoliage(this);
  }

  respawnPlayer() {
    const save = this.currentSave;
    const pos = this.physics.castRay(
      new Vector2(save.pos.x, save.pos.y - 100),
      new Vector2(save.pos.x, this.level.size.y),
    );
    save.pos.y = pos!.y - 10;
    this.player = new Player(this, new Vector2(save.pos.x, save.pos.y));
  }

  save() {
    this.currentSave.pos = this.player.body_.pos.copy();
    save(this.currentSave);
  }

  update_(timeStep: number) {
    this.time_ += timeStep;
    this.animations.update_(this.time_);
    this.player.update_();
    this.particles.update_();

    const playerPos = this.player.body_.pos;
    for (const savepoint of this.level.savepoints) {
      if (savepoint > this.currentSave.pos.x && playerPos.x > savepoint) {
        this.save();
      }
    }

    if (playerPos.x > this.level.size.x + 10) {
      this.currentSave.level++;
      this.currentSave.pos = new Vector2(150, 0);
      save(this.currentSave);
      this.load(this.currentSave);
    }
  }
}
