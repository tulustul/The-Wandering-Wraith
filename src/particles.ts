import { Vector2 } from "./vector";
import { Engine } from "./engine";

interface Particle {
  bornAt: number;
  lifetime: number;
  pos: Vector2;
  vel: Vector2;
}

interface EmitOptions {
  pos: Vector2;
  direction: Vector2;
  count: number;
  spread: number;
  speedSpread: number;
  lifetime: number;
  lifetimeSpread: number;
}

export class ParticlesSystem {
  particles: Particle[] = [];

  constructor(private engine: Engine) {}

  update_() {
    for (const particle of this.particles) {
      particle.pos.add_(particle.vel);
      particle.vel.y += 0.08;
      if (this.engine.time_ > particle.bornAt + particle.lifetime) {
        const index = this.particles.indexOf(particle);
        this.particles.splice(index, 1);
      }
    }
  }

  emit(emitOptions: EmitOptions) {
    for (let i = 0; i < emitOptions.count; i++) {
      const vel = emitOptions.direction
        .copy()
        .rotate_((Math.random() - 0.5) * emitOptions.spread)
        .mul((Math.random() + 0.5) * emitOptions.speedSpread);

      const particle: Particle = {
        bornAt: this.engine.time_,
        pos: emitOptions.pos.copy(),
        vel,
        lifetime:
          emitOptions.lifetime *
          (Math.random() + 0.5) *
          emitOptions.lifetimeSpread,
      };

      this.particles.push(particle);
    }
  }
}
