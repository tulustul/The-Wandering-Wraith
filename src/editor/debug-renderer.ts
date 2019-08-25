export function drawColisionHelpers() {
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
}

export function drawPlantsHelpers() {
  this.context.fillStyle = "green";
  for (const cell of this.engine.foliage.entities) {
    for (const foliage of cell) {
      this.context.beginPath();
      this.context.arc(foliage.pos.x, foliage.pos.y, 2, 0, 2 * Math.PI);
      this.context.fill();
      this.context.closePath();
    }
  }
}
