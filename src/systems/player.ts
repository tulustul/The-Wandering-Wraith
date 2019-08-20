import { AgentComponent } from "./agent";
import { EntitySystem, EntityEngine, Entity } from "./ecs";
import { Vector2 } from "../vector";
import { PLAYER_MASK } from "../colisions-masks";
import { BallComponent } from "./ball";

export class PlayerComponent extends Entity {
  agent: AgentComponent;

  constructor(public engine: EntityEngine, pos: Vector2) {
    super();
    this.agent = new AgentComponent(this.engine, pos, {
      colisionMask: PLAYER_MASK,
    });
    this.agent.parent = this;
    engine.getSystem(PlayerSystem).add(this);
  }

  destroy() {
    super.destroy();
    this.agent.destroy();
  }
}

export class PlayerSystem extends EntitySystem<PlayerComponent> {
  STEPS_RATE = 270;

  currentStep = 0;

  lastStepTime = 0;

  player: PlayerComponent | null;

  lastBall = 0;

  constructor() {
    super();
  }

  add(entity: PlayerComponent) {
    super.add(entity);
    this.player = entity;
  }

  remove(entity: PlayerComponent) {
    super.remove(entity);
    this.player = null;
    this.engine.game.isPlayerDead = true;
  }

  update() {
    for (const player of this.entities) {
      this.updateControls(player);
      this.makeStep(player);
    }
  }

  updateControls(player: PlayerComponent) {
    const control = this.engine.game.control;
    if (control.keys.get("KeyW")) {
      player.agent.moveToDirection(Math.PI);
    }
    if (control.keys.get("Space")) {
      player.agent.jump();
    }
    if (control.keys.get("ArrowLeft")) {
      player.agent.moveToDirection(Math.PI * 0.5);
    }
    if (control.keys.get("ArrowDown")) {
      player.agent.moveToDirection(0);
    }
    if (control.keys.get("ArrowRight")) {
      player.agent.moveToDirection(Math.PI * 1.5);
    }
    if (control.keys.get("KeyQ")) {
      if (this.engine.time - this.lastBall > 300) {
        this.lastBall = this.engine.time;
        const direction = player.agent.direction === "l" ? 1 : -1;
        new BallComponent(this.engine, {
          pos: player.agent.physicalEntity.pos
            .copy()
            .add(new Vector2(20 * direction, -20)),
          radius: Math.random() * 15 + 3,
          vel: new Vector2(3 * direction, -3),
        });
      }
    }
  }

  makeStep(player: PlayerComponent) {
    if (this.engine.time - this.lastStepTime > this.STEPS_RATE) {
      if (player.agent.physicalEntity.vel.length() > 0.5) {
        this.lastStepTime = this.engine.time;
        this.currentStep = (this.currentStep + 1) % 2;
        // this.engine.sound.play('collectA');
      }
    }
  }
}
