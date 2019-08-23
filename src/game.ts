import { Renderer } from "./renderer/renderer";
import { Control } from "./control";
import { Camera } from "./camera";

import { EntityEngine } from "./systems/ecs";
import { AgentSystem } from "./systems/agent";
import { PlayerSystem, PlayerComponent } from "./systems/player";
import { Vector2 } from "./vector";
import { TerrainSystem, TerrainSegmentComponent } from "./systems/terrain";
import { PhysicsSystem } from "./systems/physics/physics";

import { loadLevel } from "./loader";
import { FoliageSystem } from "./systems/foliage";
import { BallSystem } from "./systems/ball";

interface Notification {
  text: string;
  timestamp: number;
}

export class Game {
  paused = true;

  gameCompleted = false;

  isPlayerDead = false;

  isLoading = true;

  isStarted = false;

  notification: Notification;

  engine = new EntityEngine(this);

  camera = new Camera(this.canvas);

  control = new Control(this);

  renderer = new Renderer(this);

  constructor(public canvas: HTMLCanvasElement) {
    this.renderer.updateSize();

    this.control.init();

    // just let the logic flow
    this.engine.worldWidth = 1;
    this.engine.worldHeight = 1;
  }

  async start() {
    this.gameCompleted = false;
    this.isLoading = true;
    this.isPlayerDead = false;
    this.engine.clear();

    this.engine.register(new AgentSystem());
    this.engine.register(new PlayerSystem());
    this.engine.register(new PhysicsSystem());
    this.engine.register(new TerrainSystem());
    this.engine.register(new FoliageSystem());
    this.engine.register(new BallSystem());
    this.engine.init();

    this.initStage();

    this.isStarted = true;

    this.renderer.init();

    await this.renderer.systemsRenderer.prerender();

    this.isLoading = false;
    this.paused = false;
    document.getElementsByTagName("div")[0].remove();
  }

  initStage() {
    const player = new PlayerComponent(this.engine, new Vector2(1200, 950));
    this.camera.connectWithAgent(player.agent);

    loadLevel(this.engine, "a");
    this.engine.getSystem<FoliageSystem>(FoliageSystem).spawnFoliage();
  }
}
