export function lerp(p1: number, p2: number, t: number) {
  return (1 - t) * p1 + t * p2;
}
