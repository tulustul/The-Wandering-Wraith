interface Animation {
  update(time: number): number | null;
}

type AnimationCallback = (value: number) => void;

export class SinusAnimation implements Animation {
  private startTime!: number;

  constructor(
    private from: number,
    private to: number,
    private duration: number,
  ) {}

  update(time: number) {
    if (!this.startTime) {
      this.startTime = time;
    }
    const t = time - this.startTime;
    const step = (this.to - this.from) / this.duration;
    const radians = this.from + t * step;
    if (radians > this.to) {
      return null;
    }
    const value = Math.sin(radians);
    return value;
  }
}

export class AnimationsManager {
  animations = new Map<Animation, AnimationCallback>();
  animate(animation: Animation, fn: AnimationCallback) {
    this.animations.set(animation, fn);
  }
  update(time: number) {
    for (const [animation, fn] of this.animations.entries()) {
      const value = animation.update(time);
      if (value !== null) {
        fn(value);
      } else {
        this.animations.delete(animation);
      }
    }
  }
}
