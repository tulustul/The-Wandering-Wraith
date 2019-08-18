import { Layer } from "./layer";
import { Renderer } from "./renderer";

import { AgentSystem } from "../systems/agent";
import { CircleShape } from "../systems/physics/shapes";
import { FoliageSystem } from "../systems/foliage";
import { PhysicsSystem } from "../systems/physics/physics";
import { TerrainSystem } from "../systems/terrain";

function svgToImg() {
  const svg = document.querySelector("svg")!;
  const xml = new XMLSerializer().serializeToString(svg);

  const svg64 = btoa(xml);
  const b64Start = "data:image/svg+xml;base64,";
  const image64 = b64Start + svg64;

  const img = new Image();
  img.src = image64;

  return img;
}

const terrainImg = svgToImg();

export class SystemsRenderer {
  terrainLayer = new Layer("terrain", this.renderer, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  movingPropsLayer = new Layer("movingProps", this.renderer, {
    clear: true,
  });

  skyLayer = new Layer("background", this.renderer, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  hills1 = new Layer("hills1", this.renderer, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  hills2 = new Layer("hills2", this.renderer, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  hills3 = new Layer("hills3", this.renderer, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  foliageLayer = new Layer("trees", this.renderer, {
    followPlayer: true,
    clear: true,
  });

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

    this.context.drawImage(terrainImg, 0, 0);

    // debug below:
    // Toggle terrain colision helpers
    this.context.strokeStyle = "#ff0";
    this.context.lineWidth = 2;
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
    this.context.fillStyle = "#222";
    this.context.globalCompositeOperation = "source-over";

    for (const agent of this.engine.getSystem<AgentSystem>(AgentSystem)
      .entities) {
      this.context.save();
      this.context.translate(
        agent.physicalEntity.pos.x,
        agent.physicalEntity.pos.y,
      );
      const radius = (agent.physicalEntity.shape as CircleShape).radius;
      this.context.beginPath();
      this.context.arc(0, 0, radius, 0, 2 * Math.PI);
      this.context.fill();
      this.context.closePath();
    }
    this.context.restore();

    // DEBUG
    this.context.fillStyle = "#f00";
    this.context.strokeStyle = "#f00";
    for (const entity of this.engine.getSystem<PhysicsSystem>(PhysicsSystem)
      .dynamicEntities) {
      this.context.save();
      this.context.beginPath();
      this.context.moveTo(entity.pos.x, entity.pos.y);
      this.context.lineTo(
        entity.pos.x + entity.vel.x * 2,
        entity.pos.y + entity.vel.y * 2,
      );
      this.context.closePath();

      this.context.stroke();
      for (const point of entity.contactPoints) {
        this.context.beginPath();
        this.context.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        this.context.fill();
        this.context.closePath();
      }
      this.context.restore();
    }
    this.context.closePath();
  }

  renderSky() {
    const canvas = this.renderer.activeLayer.canvas;
    var grd = this.context.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, "#a8dfff");
    grd.addColorStop(0.7, "#111");

    this.context.fillStyle = grd;
    this.context.fillRect(0, 0, canvas.width, canvas.height);

    // const treeImg = generateTree(8, 0.5, 65, 3);
    // this.context.drawImage(treeImg, 530, 200);
  }

  renderHills(
    colorHigh: string,
    colorLow: string,
    x1: number,
    x2: number,
    x3: number,
    y1: number,
    y2: number,
    y3: number,
  ) {
    const canvas = this.renderer.activeLayer.canvas;

    var grd = this.context.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, colorHigh);
    grd.addColorStop(1, colorLow);

    this.context.fillStyle = grd;
    this.context.beginPath();
    this.context.moveTo(0, 0);
    for (let x = 0; x <= canvas.width; x++) {
      this.context.lineTo(
        x,
        Math.sin(x / x1) * y1 +
          Math.sin(x / x2) * y2 +
          Math.sin(x / x3) * y3 +
          canvas.height / 4,
      );
    }
    this.context.lineTo(canvas.width, canvas.height);
    this.context.lineTo(0, canvas.height);
    this.context.closePath();
    this.context.fill();
  }

  renderFoliage() {
    for (const foliage of this.engine.getSystem<FoliageSystem>(FoliageSystem)
      .entities) {
      const framesCount = foliage.definition.frames.length;
      let frame = Math.abs(
        (Math.round(this.engine.time / 50 + foliage.pos.x) %
          (framesCount * 2)) -
          framesCount,
      );
      if (frame === framesCount) {
        frame = framesCount - 1;
      }
      this.context.drawImage(
        foliage.definition.frames[frame],
        foliage.pos.x,
        foliage.pos.y,
      );
    }
  }

  prerender() {
    this.skyLayer.activate();
    this.renderSky();

    this.terrainLayer.activate();
    this.renderTerrain();

    this.hills1.activate();
    this.renderHills("#ccecff", "#2d3438", 163, 139, 111, 200, 150, 79);

    this.hills2.activate();
    this.renderHills("#a6ddff", "#1e282e", 197, 211, 380, 140, 35, 80);

    this.hills3.activate();
    this.renderHills("#104263", "#061824", 260, 311, 290, 111, 98, 64);
  }

  render() {
    this.movingPropsLayer.activate();
    this.renderAgents();

    this.foliageLayer.activate();
    this.renderFoliage();
  }
}
