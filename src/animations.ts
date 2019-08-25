interface Animation {
  update_(time: number): number | null;
}

type AnimationCallback = (value: number) => void;

export class SinusAnimation implements Animation {
  private startTime_!: number;

  constructor(
    private from_: number,
    private to: number,
    private duration_: number,
  ) {}

  update_(time: number) {
    if (!this.startTime_) {
      this.startTime_ = time;
    }
    const t = time - this.startTime_;
    const step = (this.to - this.from_) / this.duration_;
    const radians = this.from_ + t * step;
    if (radians > this.to) {
      return null;
    }
    const value = Math.sin(radians);
    return value;
  }
}

export class AnimationsManager {
  animations = new Map<Animation, AnimationCallback>();
  animate_(animation: Animation, fn: AnimationCallback) {
    this.animations.set(animation, fn);
  }
  update_(time: number) {
    for (const [animation, fn] of this.animations.entries()) {
      const value = animation.update_(time);
      if (value !== null) {
        fn(value);
      } else {
        this.animations.delete(animation);
      }
    }
  }
}
