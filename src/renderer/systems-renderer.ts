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
    renderWholeWorld: true,
    followPlayer: false,
    clear: false,
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

    // for (const bodyPart of Object.values(player.bodyParts)) {
    //   this.context.save();
    //   this.context.translate(bodyPart.offset.x, bodyPart.offset.y);
    //   this.context.rotate(bodyPart.rot || 0);
    //   this.context.scale(bodyPart.scale || 1, bodyPart.scale || 1);
    //   const image = bodyPart.image;
    //   this.context.drawImage(image, 0, 0, image.width, image.height);
    //   this.context.restore();
    // }
    // this.context.restore();

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

  // renderBalls() {
  //   this.context.fillStyle = "#222";
  //   for (const ball of this.engine.getSystem<BallSystem>(BallSystem)
  //     .entities) {
  //     this.context.beginPath();
  //     this.context.arc(ball.pos.x, ball.pos.y, ball.radius, 0, 2 * Math.PI);
  //     this.context.fill();
  //     this.context.closePath();
  //   }
  // }

  renderSky() {
    const canvas = this.engine.renderer.activeLayer.canvas;
    var grd = this.context.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, "#a8dfff");
    grd.addColorStop(0.7, "#111");

    this.context.fillStyle = grd;
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

  renderFoliage(isForeGround: boolean) {
    const minX =
      this.engine.player.body.pos.x - this.engine.canvas.width / 2 - 300;
    const maxX =
      this.engine.player.body.pos.x + this.engine.canvas.width / 2 + 300;

    for (let x = minX; x < maxX; x += this.engine.foliage.GRID_SIZE) {
      const cell = Math.floor(x / this.engine.foliage.GRID_SIZE);
      for (const foliage of this.engine.foliage.entities[cell]) {
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
    this.renderHills("#ccecff", "#2d3438", 163, 139, 111, 200, 150, 79);

    this.hills2.activate();
    this.renderHills("#a6ddff", "#1e282e", 197, 211, 380, 140, 35, 80);

    this.hills3.activate();
    this.renderHills("#104263", "#061824", 260, 311, 290, 111, 98, 64);
  }

  renderDebugHelpers() {
    // DEBUG
    this.context.fillStyle = "#f00";
    this.context.strokeStyle = "#f00";
    for (const entity of this.engine.physics.dynamicBodies) {
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

    this.context.strokeStyle = "#ff0";
    this.context.lineWidth = 2;
    for (const body of this.engine.physics.staticBodies) {
      this.context.beginPath();
      this.context.moveTo(body.shape.start.x, body.shape.start.y);
      this.context.lineTo(body.shape.end.x, body.shape.end.y);
      this.context.stroke();
      this.context.closePath();
    }

    for (const cell of this.engine.foliage.entities) {
      for (const foliage of cell) {
        this.context.fillStyle = "green";
        this.context.beginPath();
        this.context.arc(foliage.pos.x, foliage.pos.y, 2, 0, 2 * Math.PI);
        this.context.fill();
        this.context.closePath();
      }
    }
  }

  render() {
    this.movingPropsLayer.activate();
    this.renderPlayer();
    // this.renderDebugHelpers();

    this.foliageBackgroundLayer.activate();
    this.renderFoliage(false);

    this.foliageForegroundLayer.activate();
    this.renderFoliage(true);
  }
}
