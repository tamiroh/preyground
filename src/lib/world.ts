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
  killedPreyCount: number;
  killedPredatorCount: number;
};

export type WorldSize = {
  width: number;
  height: number;
};

export type Grass = {
  id: number;
  x: number;
  y: number;
};

const INITIAL_PREY = 90;
const INITIAL_PREDATORS = 16;
const INITIAL_GRASS = 220;

export class World {
  private worldWidth: number;
  private worldHeight: number;
  private readonly rules: readonly WorldRule[];
  private preyAnimals: Prey[] = [];
  private predatorAnimals: Predator[] = [];
  private grasses: Grass[] = [];
  private elapsed = 0;
  private nextId = 1;
  private nextGrassId = 1;
  private killedPreyCount = 0;
  private killedPredatorCount = 0;

  public constructor(
    width: number,
    height: number,
    rules: readonly WorldRule[] = createDefaultRules(),
  ) {
    this.worldWidth = width;
    this.worldHeight = height;
    this.rules = rules;
  }

  public resize(width: number, height: number): void {
    this.worldWidth = width;
    this.worldHeight = height;
    for (const animal of this.animals) {
      animal.wrap(this.worldWidth, this.worldHeight);
    }
    for (const grass of this.grasses) {
      grass.x = (grass.x + this.worldWidth) % this.worldWidth;
      grass.y = (grass.y + this.worldHeight) % this.worldHeight;
    }
  }

  public reset(): void {
    this.preyAnimals = [];
    this.predatorAnimals = [];
    this.grasses = [];
    this.nextId = 1;
    this.nextGrassId = 1;
    this.elapsed = 0;
    this.killedPreyCount = 0;
    this.killedPredatorCount = 0;
    for (let i = 0; i < INITIAL_GRASS; i += 1) {
      this.grasses.push(this.createGrass());
    }
    for (let i = 0; i < INITIAL_PREY; i += 1) {
      this.preyAnimals.push(this.createPrey());
    }
    for (let i = 0; i < INITIAL_PREDATORS; i += 1) {
      this.predatorAnimals.push(this.createPredator());
    }
  }

  public step(dt: number, params: WorldRuleParams): void {
    for (const rule of this.rules) {
      rule.update(this, dt, params);
    }
    this.elapsed += dt;
  }

  public get animals(): readonly Animal[] {
    return [...this.preyAnimals, ...this.predatorAnimals];
  }

  public get prey(): readonly Prey[] {
    return this.preyAnimals;
  }

  public get predators(): readonly Predator[] {
    return this.predatorAnimals;
  }

  public get grass(): readonly Readonly<Grass>[] {
    return this.grasses;
  }

  public get size(): WorldSize {
    return {
      width: this.worldWidth,
      height: this.worldHeight,
    };
  }

  public get stats(): WorldStats {
    return {
      elapsed: this.elapsed,
      preyCount: this.preyAnimals.length,
      predatorCount: this.predatorAnimals.length,
      killedPreyCount: this.killedPreyCount,
      killedPredatorCount: this.killedPredatorCount,
    };
  }

  public spawnPrey(x: number, y: number): void {
    this.preyAnimals.push(this.createPrey(x, y));
  }

  public spawnPredator(x: number, y: number): void {
    this.predatorAnimals.push(this.createPredator(x, y));
  }

  public spawnGrass(): void {
    this.grasses.push(this.createGrass());
  }

  public eatGrass(grass: Readonly<Grass>): boolean {
    const previousGrassCount = this.grasses.length;

    this.grasses = this.grasses.filter((candidate) => candidate.id !== grass.id);

    return previousGrassCount > this.grasses.length;
  }

  public killPrey(prey: Prey): boolean {
    const previousPreyCount = this.preyAnimals.length;

    this.preyAnimals = this.preyAnimals.filter((animal) => animal.id !== prey.id);

    const killedPreyCount = previousPreyCount - this.preyAnimals.length;
    this.killedPreyCount += killedPreyCount;

    return killedPreyCount > 0;
  }

  public killPredator(predator: Predator): boolean {
    const previousPredatorCount = this.predatorAnimals.length;

    this.predatorAnimals = this.predatorAnimals.filter((animal) => animal.id !== predator.id);

    const killedPredatorCount = previousPredatorCount - this.predatorAnimals.length;
    this.killedPredatorCount += killedPredatorCount;

    return killedPredatorCount > 0;
  }

  private createPrey(x = Math.random() * this.worldWidth, y = Math.random() * this.worldHeight): Prey {
    return Prey.create(this.nextId++, this.worldWidth, this.worldHeight, x, y);
  }

  private createPredator(x = Math.random() * this.worldWidth, y = Math.random() * this.worldHeight): Predator {
    return Predator.create(this.nextId++, this.worldWidth, this.worldHeight, x, y);
  }

  private createGrass(): Grass {
    return {
      id: this.nextGrassId++,
      x: Math.random() * this.worldWidth,
      y: Math.random() * this.worldHeight,
    };
  }
}
