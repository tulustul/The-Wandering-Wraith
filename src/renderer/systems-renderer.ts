import { Layer } from "./layer";
import { Renderer } from "./renderer";

import { AgentSystem } from "../systems/agent";
import { TerrainSystem } from "../systems/terrain";
import { CircleShape } from "../systems/physics/shapes";

export class SystemsRenderer {
  terrainLayer = new Layer("terrain", this.renderer, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  movingPropsLayer = new Layer("movingProps", this.renderer, {
    clear: true,
  });

  activeLayer: Layer;

  constructor(private renderer: Renderer) {}

  get context() {
    return this.renderer.context;
  }

  get engine() {
    return this.renderer.game.engine;
  }

  renderTerrain() {
    this.context.strokeStyle = "#ffffff";
    this.context.globalCompositeOperation = "source-over";

    for (const terrainSegment of this.engine.getSystem<TerrainSystem>(
      TerrainSystem,
    ).entities) {
      this.context.beginPath();
      this.context.moveTo(terrainSegment.start.x, terrainSegment.start.y);
      this.context.lineTo(terrainSegment.end.x, terrainSegment.end.y);
      this.context.stroke();
      this.context.closePath();
    }
  }

  renderAgents() {
    this.context.strokeStyle = "#ffffff";
    this.context.globalCompositeOperation = "source-over";

    for (const agent of this.engine.getSystem<AgentSystem>(AgentSystem)
      .entities) {
      this.context.save();
      this.context.translate(
        agent.physicalEntity.pos.x,
        agent.physicalEntity.pos.y,
      );

      this.context.rotate(agent.rot);
      this.context.beginPath();
      this.context.arc(
        0,
        0,
        (agent.physicalEntity.shape as CircleShape).radius,
        0,
        2 * Math.PI,
      );
      this.context.stroke();

      this.context.restore();
    }
  }

  render() {
    this.terrainLayer.activate();
    this.renderTerrain();

    this.movingPropsLayer.activate();
    this.renderAgents();
  }
}
