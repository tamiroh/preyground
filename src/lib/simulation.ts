import type { Animal } from "./animal";
import {
  createDefaultRules,
  type WorldRule,
} from "./world-rules";
import { World } from "./world";

export type SimulationParams = {
  preyBirthRate: number;
  predatorHunger: number;
};

export type SimulationStats = {
  elapsed: number;
  preyCount: number;
  predatorCount: number;
  eatenCount: number;
};

export class PredatorPreySimulation {
  private readonly world: World;
  private readonly rules: WorldRule[];

  public constructor(width: number, height: number, rules: WorldRule[] = createDefaultRules()) {
    this.world = new World(width, height);
    this.rules = rules;
    this.reset();
  }

  public resize(width: number, height: number): void {
    this.world.resize(width, height);
  }

  public reset(): void {
    this.world.reset();
  }

  public step(dt: number, params: SimulationParams): void {
    this.world.beginStep();
    for (const rule of this.rules) {
      rule.update(this.world, dt, params);
    }
    this.world.elapsed += dt;
  }

  public getAnimals(): readonly Animal[] {
    return this.world.getAnimals();
  }

  public getStats(): SimulationStats {
    return this.world.getStats();
  }
}
