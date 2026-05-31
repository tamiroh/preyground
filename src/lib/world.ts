import {
  Animal,
  Predator,
  Prey,
} from "./animal";
import type {
  WorldRule,
  WorldRuleParams,
} from "./world-rules";
import { createDefaultRules } from "./world-rules";

export type WorldStats = {
  elapsed: number;
  preyCount: number;
  predatorCount: number;
  eatenCount: number;
};

const INITIAL_PREY = 90;
const INITIAL_PREDATORS = 16;

export class World {
  public prey: Prey[] = [];
  public predators: Predator[] = [];
  public elapsed = 0;
  public eatenCount = 0;

  private nextId = 1;

  public constructor(
    public width: number,
    public height: number,
    private readonly rules: readonly WorldRule[] = createDefaultRules(),
  ) {}

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    for (const animal of this.animals) {
      animal.wrap(this.width, this.height);
    }
  }

  public reset(): void {
    this.prey = [];
    this.predators = [];
    this.nextId = 1;
    this.elapsed = 0;
    this.eatenCount = 0;
    for (let i = 0; i < INITIAL_PREY; i += 1) {
      this.prey.push(this.createPrey());
    }
    for (let i = 0; i < INITIAL_PREDATORS; i += 1) {
      this.predators.push(this.createPredator());
    }
  }

  public step(dt: number, params: WorldRuleParams): void {
    for (const rule of this.rules) {
      rule.update(this, dt, params);
    }
    this.elapsed += dt;
  }

  public get animals(): readonly Animal[] {
    return [...this.prey, ...this.predators];
  }

  public getStats(): WorldStats {
    return {
      elapsed: this.elapsed,
      preyCount: this.prey.length,
      predatorCount: this.predators.length,
      eatenCount: this.eatenCount,
    };
  }

  public spawnPrey(x: number, y: number): void {
    this.prey.push(this.createPrey(x, y));
  }

  public spawnPredator(x: number, y: number): void {
    this.predators.push(this.createPredator(x, y));
  }

  public killPrey(prey: Prey): void {
    this.prey = this.prey.filter((animal) => animal.id !== prey.id);
  }

  public killPredator(predator: Predator): void {
    this.predators = this.predators.filter((animal) => animal.id !== predator.id);
  }

  private createPrey(x = Math.random() * this.width, y = Math.random() * this.height): Prey {
    return Prey.create(this.nextId++, this.width, this.height, x, y);
  }

  private createPredator(x = Math.random() * this.width, y = Math.random() * this.height): Predator {
    return Predator.create(this.nextId++, this.width, this.height, x, y);
  }
}
