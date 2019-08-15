import { Renderer } from "./renderer/renderer";
import { Control } from "./control";
import { Camera } from "./camera";

import { EntityEngine } from "./systems/ecs";
import { AgentSystem } from "./systems/agent";
import { PlayerSystem, PlayerComponent } from "./systems/player";
import { Vector2 } from "./vector";
import { TerrainSystem, TerrainSegmentComponent } from "./systems/terrain";
import { PhysicsSystem } from "./systems/physics/physics";

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
    this.engine.worldWidth = 1000;
    this.engine.worldHeight = 1000;
    this.start();
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
    this.engine.init();

    this.initStage();

    this.isStarted = true;

    this.renderer.init();
    this.isLoading = false;
    this.paused = false;
  }

  initStage() {
    const player = new PlayerComponent(this.engine, new Vector2(400, 0));
    if (player) {
      this.camera.connectWithAgent(player.agent);
    }

    new TerrainSegmentComponent(this.engine, {
      start: new Vector2(0, 100),
      end: new Vector2(500, 100),
    });

    new TerrainSegmentComponent(this.engine, {
      start: new Vector2(500, 100),
      end: new Vector2(1000, 300),
    });

    new TerrainSegmentComponent(this.engine, {
      start: new Vector2(500, 20),
      end: new Vector2(1300, 300),
    });

    new TerrainSegmentComponent(this.engine, {
      start: new Vector2(500, 400),
      end: new Vector2(1000, 700),
    });

    new TerrainSegmentComponent(this.engine, {
      start: new Vector2(1000, 700),
      end: new Vector2(1500, 400),
    });
  }
}
