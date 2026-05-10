export function randomSigned(range: number): number {
  return (Math.random() - 0.5) * 2 * range;
}
