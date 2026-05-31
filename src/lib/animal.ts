import {
  randomSigned,
  torusDistance,
} from "./math";

export type Steering = {
  x: number;
  y: number;
};

const COLLISION_AVOIDANCE_DISTANCE = 14;
const COLLISION_AVOIDANCE_STRENGTH = 3.4;

export abstract class Animal {
  public age: number = 0;

  protected constructor(
    readonly id: number,
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
    public energy: number,
  ) {}

  public wrap(width: number, height: number): void {
    this.x = (this.x + width) % width;
    this.y = (this.y + height) % height;
  }

  public distanceTo(other: Animal, width: number, height: number): number {
    return torusDistance(this.x, this.y, other.x, other.y, width, height);
  }

  protected applySteering(steering: Steering, speed: number, dt: number, width: number, height: number): void {
    this.vx += steering.x * dt * 5;
    this.vy += steering.y * dt * 5;
    const length = Math.hypot(this.vx, this.vy) || 1;
    this.vx /= length;
    this.vy /= length;
    this.x += this.vx * speed * dt;
    this.y += this.vy * speed * dt;
    this.wrap(width, height);
  }

  protected randomSteering(range: number): Steering {
    return {
      x: randomSigned(range),
      y: randomSigned(range),
    };
  }

  protected potentialFrom(sources: readonly Animal[], radius: number, strength: number, width: number, height: number): Steering {
    const steering = { x: 0, y: 0 };

    for (const source of sources) {
      if (source.id === this.id) {
        continue;
      }

      const distance = this.distanceTo(source, width, height);
      if (distance > 0 && distance < radius) {
        const direction = this.directionTo(source, width, height);
        const force = (1 - distance / radius) * strength;
        steering.x += direction.x * force;
        steering.y += direction.y * force;
      }
    }

    return steering;
  }

  private directionTo(other: Animal, width: number, height: number): Steering {
    let dx = other.x - this.x;
    let dy = other.y - this.y;
    if (Math.abs(dx) > width / 2) dx -= Math.sign(dx) * width;
    if (Math.abs(dy) > height / 2) dy -= Math.sign(dy) * height;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }
}

export class Prey extends Animal {
  private static readonly ESCAPE_STRENGTH = 2.8;
  private static readonly SENSE = 92;
  private static readonly SPEED = 42;
  private static readonly WANDER_RANGE = 0.35;

  public static create(id: number, width: number, height: number, x?: number, y?: number): Prey {
    const angle = Math.random() * Math.PI * 2;
    return new Prey(
      id,
      x ?? Math.random() * width,
      y ?? Math.random() * height,
      Math.cos(angle),
      Math.sin(angle),
      5,
    );
  }

  private constructor(id: number, x: number, y: number, vx: number, vy: number, energy: number) {
    super(id, x, y, vx, vy, energy);
  }

  public move(predatorsInView: readonly Predator[], neighbors: readonly Animal[], dt: number, width: number, height: number): void {
    const steering = this.randomSteering(Prey.WANDER_RANGE);
    const avoidance = this.potentialFrom(neighbors, COLLISION_AVOIDANCE_DISTANCE, -COLLISION_AVOIDANCE_STRENGTH, width, height);
    const escape = this.potentialFrom(predatorsInView, Prey.SENSE, -Prey.ESCAPE_STRENGTH, width, height);
    steering.x += avoidance.x;
    steering.y += avoidance.y;
    steering.x += escape.x;
    steering.y += escape.y;
    this.applySteering(steering, Prey.SPEED, dt, width, height);
  }
}

export class Predator extends Animal {
  private static readonly CHASE_STRENGTH = 2.6;
  private static readonly SENSE = 145;
  private static readonly SPEED = 58;
  private static readonly WANDER_RANGE = 0.25;

  public static create(id: number, width: number, height: number, x?: number, y?: number): Predator {
    const angle = Math.random() * Math.PI * 2;
    return new Predator(
      id,
      x ?? Math.random() * width,
      y ?? Math.random() * height,
      Math.cos(angle),
      Math.sin(angle),
      18 + Math.random() * 8,
    );
  }

  private constructor(id: number, x: number, y: number, vx: number, vy: number, energy: number) {
    super(id, x, y, vx, vy, energy);
  }

  public move(preyInView: readonly Prey[], neighbors: readonly Animal[], dt: number, width: number, height: number): void {
    const steering = this.randomSteering(Predator.WANDER_RANGE);
    const avoidance = this.potentialFrom(neighbors, COLLISION_AVOIDANCE_DISTANCE, -COLLISION_AVOIDANCE_STRENGTH, width, height);
    const chase = this.potentialFrom(preyInView, Predator.SENSE, Predator.CHASE_STRENGTH, width, height);
    steering.x += avoidance.x;
    steering.y += avoidance.y;
    steering.x += chase.x;
    steering.y += chase.y;
    this.applySteering(steering, Predator.SPEED, dt, width, height);
  }
}
