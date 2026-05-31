export type Size = Readonly<{
  width: number;
  height: number;
}>;

export function randomSigned(range: number): number {
  return (Math.random() - 0.5) * 2 * range;
}

export function torusDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size: Size,
): number {
  const dx = Math.min(Math.abs(x1 - x2), size.width - Math.abs(x1 - x2));
  const dy = Math.min(Math.abs(y1 - y2), size.height - Math.abs(y1 - y2));
  return Math.hypot(dx, dy);
}
