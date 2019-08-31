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

  player = new Player(this, new Vector2(800, 950));

  level: Level = { size: new Vector2(), pathCommands: [], platforms: [] };

  // #if process.env.NODE_ENV === 'development'
  editor = new Editor(this);
  // #endif

  constructor(public game: Game, public canvas_: HTMLCanvasElement) {
    this.renderer.updateSize();
    this.control_.init();
  }

  init() {
    this.renderer.init();
    // this.camera.bindToTarget(this.player.body_.pos);
  }

  update_(timeStep: number) {
    this.time_ += timeStep;
    this.animations.update_(this.time_);
    this.player.update_();
    this.physics.update_();
    this.particles.update_();
  }
}
