export function randomSigned(range: number): number {
  return (Math.random() - 0.5) * 2 * range;
}

export function torusDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  height: number,
): number {
  const dx = Math.min(Math.abs(x1 - x2), width - Math.abs(x1 - x2));
  const dy = Math.min(Math.abs(y1 - y2), height - Math.abs(y1 - y2));
  return Math.hypot(dx, dy);
}
