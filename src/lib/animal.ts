import { randomSigned } from "./math";

export type Steering = {
  x: number;
  y: number;
};

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
    const dx = Math.min(Math.abs(this.x - other.x), width - Math.abs(this.x - other.x));
    const dy = Math.min(Math.abs(this.y - other.y), height - Math.abs(this.y - other.y));
    return Math.hypot(dx, dy);
  }

  protected nearest<T extends Animal>(candidates: readonly T[], maxDistance: number, width: number, height: number): T | null {
    let best: T | null = null;
    let bestDistance = maxDistance;
    for (const candidate of candidates) {
      const currentDistance = this.distanceTo(candidate, width, height);
      if (currentDistance < bestDistance) {
        best = candidate;
        bestDistance = currentDistance;
      }
    }
    return best;
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

  protected steerToward(other: Animal, strength: number, width: number, height: number): Steering {
    const direction = this.directionTo(other, width, height);
    return {
      x: direction.x * strength,
      y: direction.y * strength,
    };
  }

  protected steerAwayFrom(other: Animal, strength: number, width: number, height: number): Steering {
    const direction = other.directionTo(this, width, height);
    return {
      x: direction.x * strength,
      y: direction.y * strength,
    };
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
      1,
    );
  }

  private constructor(id: number, x: number, y: number, vx: number, vy: number, energy: number) {
    super(id, x, y, vx, vy, energy);
  }

  private nearestThreat(predators: readonly Predator[], width: number, height: number): Predator | null {
    return this.nearest(predators, Prey.SENSE, width, height);
  }

  public move(predatorsInView: readonly Predator[], dt: number, width: number, height: number): void {
    const threat = this.nearestThreat(predatorsInView, width, height);
    const steering = this.randomSteering(Prey.WANDER_RANGE);
    if (threat) {
      const escape = this.steerAwayFrom(threat, Prey.ESCAPE_STRENGTH, width, height);
      steering.x += escape.x;
      steering.y += escape.y;
    }
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

  private nearestPrey(prey: readonly Prey[], width: number, height: number): Prey | null {
    return this.nearest(prey, Predator.SENSE, width, height);
  }

  public move(preyInView: readonly Prey[], dt: number, width: number, height: number): Prey | null {
    const target = this.nearestPrey(preyInView, width, height);
    const steering = this.randomSteering(Predator.WANDER_RANGE);
    if (target) {
      const chase = this.steerToward(target, Predator.CHASE_STRENGTH, width, height);
      steering.x += chase.x;
      steering.y += chase.y;
    }
    this.applySteering(steering, Predator.SPEED, dt, width, height);
    return target;
  }
}
