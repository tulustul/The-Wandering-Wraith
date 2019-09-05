/**
 * Taken from https://gist.github.com/blixt/f17b47c62508be59987b
 *
 * Creates a pseudo-random value generator. The seed must be an integer.
 *
 * Uses an optimized version of the Park-Miller PRNG.
 * http://www.firstpr.com.au/dsp/rand31/
 */
export class Random {
  private seed_: number;
  constructor(seed_: number) {
    this.seed_ = seed_ % 2147483647;
    if (this.seed_ <= 0) this.seed_ += 2147483646;
  }

  /**
   * Returns a pseudo-random value between 1 and 2^32 - 2.
   */
  next_() {
    return (this.seed_ = (this.seed_ * 16807) % 2147483647);
  }

  /**
   * Returns a pseudo-random floating point number in range [0, 1).
   */
  nextFloat() {
    // We know that result of next() will be 1 to 2147483646 (inclusive).
    return (this.next_() - 1) / 2147483646;
  }

  nextVariation() {
    return this.nextFloat() - 0.5;
  }
}
