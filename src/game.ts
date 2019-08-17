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
    this.engine.worldWidth = 10000;
    this.engine.worldHeight = 10000;
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
    const player = new PlayerComponent(this.engine, new Vector2(600, 800));
    if (player) {
      this.camera.connectWithAgent(player.agent);
    }

    // new TerrainSegmentComponent(this.engine, {
    //   start: new Vector2(0, 100),
    //   end: new Vector2(350, 100),
    // });

    // new TerrainSegmentComponent(this.engine, {
    //   start: new Vector2(350, 100),
    //   end: new Vector2(1000, 300),
    // });

    // new TerrainSegmentComponent(this.engine, {
    //   start: new Vector2(500, 20),
    //   end: new Vector2(1300, 300),
    // });

    // new TerrainSegmentComponent(this.engine, {
    //   start: new Vector2(500, 400),
    //   end: new Vector2(1000, 700),
    // });

    // new TerrainSegmentComponent(this.engine, {
    //   start: new Vector2(1000, 700),
    //   end: new Vector2(1500, 400),
    // });

    loadLevel(this.engine, "level1");
    // const controlPoints = [
    //   // new Vector2(0, 100),
    //   // new Vector2(110, 33),
    //   // new Vector2(35, 28),
    //   // new Vector2(500, 400),
    //   // new Vector2(1000, 800),
    //   // new Vector2(900, 200),
    //   new Vector2(4.5357142, 141.27381),
    //   new Vector2(5.078121, 26.72695),
    //   new Vector2(37.8560728, 29.68483),
    //   new Vector2(56.6964278, 0),
    //   // new Vector2(11.88866, -17.37252),
    //   // new Vector2(51.513218, -30.05188),
    //   // new Vector2(60.789318, 1.60362),
    //   // new Vector2(17.86746, 36.54652),
    //   // new Vector2(32.19476, 50.24981),
    //   // new Vector2(55.43605, 3.52035),
    //   // new Vector2(7.21628, -18.97614),
    //   // new Vector2(26.64963, -5.87993),
    //   // new Vector2(26.64963, -5.8799),
    // ];
    // const points = getCurvePoints(controlPoints, 0.1);

    // for (let i = 0; i < points.length - 1; i++) {
    //   new TerrainSegmentComponent(this.engine, {
    //     start: points[i],
    //     end: points[i + 1],
    //   });
    // }
  }
}
