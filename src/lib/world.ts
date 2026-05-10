import {
  INITIAL_PREDATORS,
  INITIAL_PREY,
} from "./config";
import {
  Animal,
  Predator,
  Prey,
} from "./animal";
import type { SimulationStats } from "./simulation";

type PendingWorldChanges = {
  preyToSpawn: Prey[];
  predatorsToSpawn: Predator[];
  preyToKill: Set<number>;
  predatorsToKill: Set<number>;
};

export class World {
  public prey: Prey[] = [];
  public predators: Predator[] = [];
  public elapsed = 0;
  public eatenCount = 0;

  private nextId = 1;
  private pending: PendingWorldChanges = createEmptyPendingChanges();

  public constructor(
    public width: number,
    public height: number,
  ) {}

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    for (const animal of this.getAnimals()) {
      animal.wrap(this.width, this.height);
    }
  }

  public reset(): void {
    this.prey = [];
    this.predators = [];
    this.pending = createEmptyPendingChanges();
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

  public beginStep(): void {
    this.pending = createEmptyPendingChanges();
  }

  public getAnimals(): readonly Animal[] {
    return [...this.prey, ...this.predators];
  }

  public getStats(): SimulationStats {
    return {
      elapsed: this.elapsed,
      preyCount: this.prey.length,
      predatorCount: this.predators.length,
      eatenCount: this.eatenCount,
    };
  }

  public get livingPrey(): readonly Prey[] {
    return this.prey.filter((animal) => !this.pending.preyToKill.has(animal.id));
  }

  public get totalPreyAfterBirths(): number {
    return this.prey.length + this.pending.preyToSpawn.length;
  }

  public get totalPredatorsAfterBirths(): number {
    return this.predators.length + this.pending.predatorsToSpawn.length;
  }

  public spawnPrey(x: number, y: number): void {
    this.pending.preyToSpawn.push(this.createPrey(x, y));
  }

  public spawnPredator(x: number, y: number): void {
    this.pending.predatorsToSpawn.push(this.createPredator(x, y));
  }

  public killPrey(prey: Prey): void {
    this.pending.preyToKill.add(prey.id);
  }

  public killPredator(predator: Predator): void {
    this.pending.predatorsToKill.add(predator.id);
  }

  public commitPendingChanges(): void {
    this.prey = this.prey.filter((animal) => !this.pending.preyToKill.has(animal.id));
    this.predators = this.predators.filter((animal) => !this.pending.predatorsToKill.has(animal.id));
    this.prey.push(...this.pending.preyToSpawn);
    this.predators.push(...this.pending.predatorsToSpawn);
  }

  private createPrey(x = Math.random() * this.width, y = Math.random() * this.height): Prey {
    return Prey.create(this.nextId++, this.width, this.height, x, y);
  }

  private createPredator(x = Math.random() * this.width, y = Math.random() * this.height): Predator {
    return Predator.create(this.nextId++, this.width, this.height, x, y);
  }
}

function createEmptyPendingChanges(): PendingWorldChanges {
  return {
    preyToSpawn: [],
    predatorsToSpawn: [],
    preyToKill: new Set<number>(),
    predatorsToKill: new Set<number>(),
  };
}
