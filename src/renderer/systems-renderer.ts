import { Layer } from "./layer";
import { assets } from "../assets";
import { Engine } from "../engine";

export class SystemsRenderer {
  terrainLayer = new Layer("terrain", this.engine, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  movingPropsLayer = new Layer("movingProps", this.engine, {
    clear: true,
  });

  skyLayer = new Layer("background", this.engine, {
    renderWholeWorld: false,
    followPlayer: false,
  });

  hills1 = new Layer("hills1", this.engine, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  hills2 = new Layer("hills2", this.engine, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  hills3 = new Layer("hills3", this.engine, {
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
  });

  foliageBackgroundLayer = new Layer("foliageBackground", this.engine, {
    followPlayer: true,
    clear: true,
  });

  foliageForegroundLayer = new Layer("foliageForeground", this.engine, {
    followPlayer: true,
    clear: true,
  });

  constructor(private engine: Engine) {}

  get context() {
    return this.engine.renderer.context;
  }

  // get renderer() {
  //   return this.engine.renderer;
  // }

  renderTerrain() {
    this.context.strokeStyle = "#ffffff";
    this.context.globalCompositeOperation = "source-over";
    this.context.drawImage(assets.terrain, 0, 0);
  }

  renderPlayer() {
    this.context.fillStyle = "#222";
    this.context.globalCompositeOperation = "source-over";

    const player = this.engine.player;

    this.context.save();

    this.context.translate(player.body.pos.x, player.body.pos.y - 1);
    if (player.direction === "r") {
      this.context.scale(-1, 1);
    }
    this.context.rotate(player.body.vel.angle());
    this.context.scale(1, 1 + Math.abs(player.body.vel.y / 20));
    this.context.rotate(-player.body.vel.angle());

    // legs
    this.context.save();
    this.context.translate(-3, 3);
    this.context.rotate(player.animation.lLegRot);
    this.context.drawImage(assets.limb, 0, 0, 5, 10);
    this.context.restore();

    this.context.save();
    this.context.translate(1, 3);
    this.context.rotate(player.animation.rLegRot);
    this.context.drawImage(assets.limb, 0, 0, 5, 10);
    this.context.restore();

    this.context.drawImage(assets.torso, -20, -23, 40, 40);

    this.context.save();
    this.context.translate(0, player.animation.headOffset);

    // arms
    this.context.save();
    this.context.translate(-3, 0);
    this.context.rotate(player.animation.rArmRot);
    this.context.scale(0.8, 0.8);
    this.context.drawImage(assets.limb, 0, 0, 5, 10);
    this.context.restore();

    this.context.save();
    this.context.translate(3, 3);
    this.context.rotate(player.animation.lArmRot);
    this.context.scale(0.8, 0.8);
    this.context.drawImage(assets.limb, 0, 0, 5, 10);
    this.context.restore();

    //head
    this.context.scale(0.9, 0.9);
    this.context.drawImage(assets.head, -20, -20, 40, 40);

    // eyes
    this.context.translate(0, player.animation.eyesOffset);
    this.context.scale(1, player.animation.eyesScale);
    this.context.drawImage(assets.eyes, -3, -10, 10, 10);
    this.context.restore();

    this.context.restore();
  }

  renderSky() {
    const canvas = this.engine.renderer.activeLayer.canvas;
    var grd = this.context.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, "#333");
    grd.addColorStop(1, "#111");
    this.context.fillStyle = grd;
    this.context.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = this.context.createRadialGradient(
      100,
      100,
      10,
      100,
      100,
      300,
    );
    gradient.addColorStop(0, "#ccc");
    gradient.addColorStop(0.03, "#ccc");
    gradient.addColorStop(0.04, "#555");
    gradient.addColorStop(1, "transparent");
    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, canvas.width, canvas.height);
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
    const canvas = this.engine.renderer.activeLayer.canvas;

    var grd = this.context.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, colorHigh);
    grd.addColorStop(0.3, colorLow);

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

  renderFoliage(isForeGround: boolean) {
    const minX =
      this.engine.player.body.pos.x - this.engine.canvas.width / 2 - 300;
    const maxX =
      this.engine.player.body.pos.x + this.engine.canvas.width / 2 + 300;

    for (let x = minX; x < maxX; x += this.engine.foliage.GRID_SIZE) {
      const cell = Math.floor(x / this.engine.foliage.GRID_SIZE);
      for (const foliage of this.engine.foliage.entities[cell] || []) {
        if (foliage.isForeground !== isForeGround) {
          continue;
        }

        const framesCount = foliage.definition.frames.length;
        let frame = Math.abs(
          (Math.round(this.engine.time / 50 + foliage.pos.x) %
            (framesCount * 2)) -
            framesCount,
        );
        if (frame === framesCount) {
          frame = framesCount - 1;
        }
        const image = foliage.definition.frames[frame];
        this.context.drawImage(
          image,
          foliage.pos.x - image.width / 3,
          foliage.pos.y - image.height + 5,
        );
      }
    }
  }

  prerender() {
    this.skyLayer.activate();
    this.renderSky();

    this.terrainLayer.activate();
    this.renderTerrain();

    this.hills1.activate();
    this.renderHills("#1a1a1a", "#111", 150, 139, 111, 200, 150, 79);

    this.hills2.activate();
    this.renderHills("#1c1c1c", "#111", 197, 211, 380, 140, 35, 80);

    this.hills3.activate();
    this.renderHills("#161616", "#111", 260, 311, 290, 111, 98, 64);
  }

  render() {
    this.movingPropsLayer.activate();
    this.renderPlayer();

    this.foliageBackgroundLayer.activate();
    this.renderFoliage(false);

    this.foliageForegroundLayer.activate();
    this.renderFoliage(true);
  }
}
