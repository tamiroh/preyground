import {
  randomSigned,
  torusDistance,
  type Size,
} from "./math";

export type Steering = {
  x: number;
  y: number;
};

const COLLISION_AVOIDANCE_DISTANCE = 14;
const COLLISION_AVOIDANCE_STRENGTH = 3.4;
const FULL_TURN_RADIANS = Math.PI * 2;
const STEERING_RESPONSE = 5;
const UNIT_VECTOR_FALLBACK_LENGTH = 1;

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

  public wrap(worldSize: Size): void {
    this.x = (this.x + worldSize.width) % worldSize.width;
    this.y = (this.y + worldSize.height) % worldSize.height;
  }

  public distanceTo(other: Animal, worldSize: Size): number {
    return torusDistance(this.x, this.y, other.x, other.y, worldSize);
  }

  protected applySteering(steering: Steering, speed: number, dt: number, worldSize: Size): void {
    this.vx += steering.x * dt * STEERING_RESPONSE;
    this.vy += steering.y * dt * STEERING_RESPONSE;
    const length = Math.hypot(this.vx, this.vy) || UNIT_VECTOR_FALLBACK_LENGTH;
    this.vx /= length;
    this.vy /= length;
    this.x += this.vx * speed * dt;
    this.y += this.vy * speed * dt;
    this.wrap(worldSize);
  }

  protected randomSteering(range: number): Steering {
    return {
      x: randomSigned(range),
      y: randomSigned(range),
    };
  }

  protected potentialFrom(sources: readonly Animal[], radius: number, strength: number, worldSize: Size): Steering {
    const steering = { x: 0, y: 0 };

    for (const source of sources) {
      if (source.id === this.id) {
        continue;
      }

      const distance = this.distanceTo(source, worldSize);
      if (distance > 0 && distance < radius) {
        const direction = this.directionTo(source, worldSize);
        const force = (1 - distance / radius) * strength;
        steering.x += direction.x * force;
        steering.y += direction.y * force;
      }
    }

    return steering;
  }

  private directionTo(other: Animal, worldSize: Size): Steering {
    let dx = other.x - this.x;
    let dy = other.y - this.y;
    if (Math.abs(dx) > worldSize.width / 2) dx -= Math.sign(dx) * worldSize.width;
    if (Math.abs(dy) > worldSize.height / 2) dy -= Math.sign(dy) * worldSize.height;
    const length = Math.hypot(dx, dy) || UNIT_VECTOR_FALLBACK_LENGTH;
    return { x: dx / length, y: dy / length };
  }
}

export class Prey extends Animal {
  private static readonly ESCAPE_STRENGTH = 2.8;
  private static readonly INITIAL_ENERGY = 5;
  private static readonly SENSE = 92;
  private static readonly SPEED = 42;
  private static readonly WANDER_RANGE = 0.35;

  public static create(id: number, worldSize: Size, x?: number, y?: number): Prey {
    const angle = Math.random() * FULL_TURN_RADIANS;
    return new Prey(
      id,
      x ?? Math.random() * worldSize.width,
      y ?? Math.random() * worldSize.height,
      Math.cos(angle),
      Math.sin(angle),
      Prey.INITIAL_ENERGY,
    );
  }

  private constructor(id: number, x: number, y: number, vx: number, vy: number, energy: number) {
    super(id, x, y, vx, vy, energy);
  }

  public move(predatorsInView: readonly Predator[], neighbors: readonly Animal[], dt: number, worldSize: Size): void {
    const steering = this.randomSteering(Prey.WANDER_RANGE);
    const avoidance = this.potentialFrom(neighbors, COLLISION_AVOIDANCE_DISTANCE, -COLLISION_AVOIDANCE_STRENGTH, worldSize);
    const escape = this.potentialFrom(predatorsInView, Prey.SENSE, -Prey.ESCAPE_STRENGTH, worldSize);
    steering.x += avoidance.x;
    steering.y += avoidance.y;
    steering.x += escape.x;
    steering.y += escape.y;
    this.applySteering(steering, Prey.SPEED, dt, worldSize);
  }
}

export class Predator extends Animal {
  private static readonly CHASE_STRENGTH = 2.6;
  private static readonly INITIAL_ENERGY_RANGE = 8;
  private static readonly MIN_INITIAL_ENERGY = 18;
  private static readonly SENSE = 145;
  private static readonly SPEED = 58;
  private static readonly WANDER_RANGE = 0.25;

  public static create(id: number, worldSize: Size, x?: number, y?: number): Predator {
    const angle = Math.random() * FULL_TURN_RADIANS;
    return new Predator(
      id,
      x ?? Math.random() * worldSize.width,
      y ?? Math.random() * worldSize.height,
      Math.cos(angle),
      Math.sin(angle),
      Predator.MIN_INITIAL_ENERGY + Math.random() * Predator.INITIAL_ENERGY_RANGE,
    );
  }

  private constructor(id: number, x: number, y: number, vx: number, vy: number, energy: number) {
    super(id, x, y, vx, vy, energy);
  }

  public move(preyInView: readonly Prey[], neighbors: readonly Animal[], dt: number, worldSize: Size): void {
    const steering = this.randomSteering(Predator.WANDER_RANGE);
    const avoidance = this.potentialFrom(neighbors, COLLISION_AVOIDANCE_DISTANCE, -COLLISION_AVOIDANCE_STRENGTH, worldSize);
    const chase = this.potentialFrom(preyInView, Predator.SENSE, Predator.CHASE_STRENGTH, worldSize);
    steering.x += avoidance.x;
    steering.y += avoidance.y;
    steering.x += chase.x;
    steering.y += chase.y;
    this.applySteering(steering, Predator.SPEED, dt, worldSize);
  }
}
