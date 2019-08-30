import { Layer } from "./layer";
import { assets } from "../assets";
import { Engine } from "../engine";
import { PathCommandType } from "../level.interface";
import { Vector2 } from "../vector";

export class SystemsRenderer {
  terrainLayer = new Layer("terrain", this.engine, {
    renderWholeWorld: true,
    followPlayer: false,
    clear_: false,
  });

  movingPropsLayer = new Layer("movingProps", this.engine, {
    clear_: true,
  });

  skyLayer = new Layer("background", this.engine, {
    renderWholeWorld: false,
    followPlayer: false,
  });

  hills1 = new Layer("hills1", this.engine, {
    renderWholeWorld: true,
    followPlayer: false,
    clear_: false,
  });

  hills2 = new Layer("hills2", this.engine, {
    renderWholeWorld: true,
    followPlayer: false,
    clear_: false,
  });

  hills3 = new Layer("hills3", this.engine, {
    renderWholeWorld: true,
    followPlayer: false,
    clear_: false,
  });

  foliageBackgroundLayer = new Layer("foliageBackground", this.engine, {
    followPlayer: true,
    clear_: true,
  });

  foliageForegroundLayer = new Layer("foliageForeground", this.engine, {
    followPlayer: true,
    clear_: true,
  });

  constructor(private engine: Engine) {}

  get ctx() {
    return this.engine.renderer.ctx;
  }

  renderTerrain() {
    let to: Vector2;
    this.ctx.fillStyle = "#000";
    this.ctx.strokeStyle = "#111";
    this.ctx.lineWidth = 5;
    for (const pathCommand of this.engine.level.pathCommands) {
      switch (pathCommand.type) {
        case PathCommandType.move:
          to = pathCommand.points![0];
          this.ctx.beginPath();
          this.ctx.moveTo(to.x, to.y);
          break;
        case PathCommandType.line:
          to = pathCommand.points![0];
          this.ctx.lineTo(to.x, to.y);
          break;
        case PathCommandType.bezier:
          const [c1, c2, to_] = pathCommand.points!;
          this.ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, to_.x, to_.y);
          break;
        case PathCommandType.close:
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          break;
      }
    }
  }

  renderPlatforms() {
    this.ctx.strokeStyle = "#000";
    this.ctx.lineWidth = 1;
    for (const p of this.engine.level.platforms) {
      var grd = this.ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
      grd.addColorStop(0, "#333");
      grd.addColorStop(1, "#000");
      this.ctx.fillStyle = grd;
      this.ctx.rect(p.x, p.y, p.w, p.h);
      this.ctx.fill();
      this.ctx.stroke();
    }
  }

  renderPlayer() {
    const ctx = this.ctx;

    const player = this.engine.player;

    ctx.save();

    ctx.translate(player.body_.pos.x, player.body_.pos.y - 1);
    if (player.direction_ === "r") {
      ctx.scale(-1, 1);
    }
    ctx.rotate(player.body_.vel.angle_());
    ctx.scale(1, 1 + Math.abs(player.body_.vel.y / 20));
    ctx.rotate(-player.body_.vel.angle_());

    // legs
    ctx.save();
    ctx.translate(-3, 3);
    ctx.rotate(player.animation_.lLegRot);
    ctx.drawImage(assets.limb, 0, 0, 5, 10);
    ctx.restore();

    ctx.save();
    ctx.translate(1, 3);
    ctx.rotate(player.animation_.rLegRot);
    ctx.drawImage(assets.limb, 0, 0, 5, 10);
    ctx.restore();

    ctx.drawImage(assets.torso, -20, -23, 40, 40);

    ctx.save();
    ctx.translate(0, player.animation_.headOffset);

    // arms
    ctx.save();
    ctx.translate(-3, 0);
    ctx.rotate(player.animation_.rArmRot);
    ctx.scale(0.8, 0.8);
    ctx.drawImage(assets.limb, 0, 0, 5, 10);
    ctx.restore();

    ctx.save();
    ctx.translate(3, 3);
    ctx.rotate(player.animation_.lArmRot);
    ctx.scale(0.8, 0.8);
    ctx.drawImage(assets.limb, 0, 0, 5, 10);
    ctx.restore();

    //head
    ctx.scale(0.9, 0.9);
    ctx.drawImage(assets.head_, -20, -20, 40, 40);

    // eyes
    ctx.translate(0, player.animation_.eyesOffset);
    ctx.scale(1, player.animation_.eyesScale);
    ctx.drawImage(assets.eyes, -3, -10, 10, 10);
    ctx.restore();

    ctx.restore();
  }

  renderSky() {
    const canvas = this.engine.renderer.activeLayer.canvas_;
    var grd = this.ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, "#333");
    grd.addColorStop(1, "#111");
    this.ctx.fillStyle = grd;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = this.ctx.createRadialGradient(
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
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    const canvas = this.engine.renderer.activeLayer.canvas_;

    var grd = this.ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, colorHigh);
    grd.addColorStop(0.3, colorLow);

    this.ctx.fillStyle = grd;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    for (let x = 0; x <= canvas.width; x++) {
      this.ctx.lineTo(
        x,
        Math.sin(x / x1) * y1 +
          Math.sin(x / x2) * y2 +
          Math.sin(x / x3) * y3 +
          canvas.height / 4,
      );
    }
    this.ctx.lineTo(canvas.width, canvas.height);
    this.ctx.lineTo(0, canvas.height);
    this.ctx.closePath();
    this.ctx.fill();
  }

  renderFoliage(isForeGround: boolean) {
    const minX =
      this.engine.player.body_.pos.x - this.engine.canvas_.width / 2 - 300;
    const maxX =
      this.engine.player.body_.pos.x + this.engine.canvas_.width / 2 + 300;

    for (let x = minX; x < maxX; x += this.engine.foliage.GRID_SIZE) {
      const cell = Math.floor(x / this.engine.foliage.GRID_SIZE);
      for (const foliage of this.engine.foliage.entities_[cell] || []) {
        if (foliage.isForeground !== isForeGround) {
          continue;
        }

        const framesCount = foliage.definition.frames.length;
        let frame = Math.abs(
          (Math.round(this.engine.time_ / 50 + foliage.pos.x) %
            (framesCount * 2)) -
            framesCount,
        );
        if (frame === framesCount) {
          frame = framesCount - 1;
        }
        const image = foliage.definition.frames[frame];
        this.ctx.drawImage(
          image,
          foliage.pos.x - image.width / 2,
          foliage.pos.y - image.height + 5,
        );
      }
    }
  }

  prerender() {
    this.skyLayer.activate();
    this.renderSky();

    this.terrainLayer.activate();
    this.renderPlatforms();
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
