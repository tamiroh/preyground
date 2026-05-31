import type { Predator, Prey } from "./animal.ts";
import {
  randomSigned,
  torusDistance,
} from "./math.ts";
import type { Grass, World, WorldSize } from "./world.ts";

const EAT_DISTANCE = 8;
const PREDATOR_ENERGY_PER_PREY = 9;
const GRAZE_DISTANCE = 10;
const GRASS_REGROW_RATE = 5.5;
const MAX_GRASS_COUNT = 260;
const PREY_ENERGY_DECAY_RATE = 0.42;
const PREY_ENERGY_PER_GRASS = 7;
const PREY_MAX_ENERGY = 9;
const PREY_SPAWN_OFFSET_RANGE = 12;
const STARVATION_ENERGY_THRESHOLD = 0;
const PREDATOR_MAX_AGE_FACTOR = 2.4;
const PREDATOR_REPRODUCTION_ENERGY_RETAINED = 0.52;
const PREDATOR_SPAWN_OFFSET_RANGE = 10;

export type WorldRuleParams = {
  preyBirthRate: number;
  predatorHunger: number;
};

export interface WorldRule {
  update(world: World, dt: number, params: WorldRuleParams): void;
}

export function createDefaultRules(): WorldRule[] {
  return [
    new AgingRule(),
    new GrassRegrowthRule(),
    new MovementRule(),
    new PreyEnergyDecayRule(),
    new PreyGrazingRule(),
    new PreyStarvationRule(),
    new PredationRule(),
    new PredatorEnergyDecayRule(),
    new PredatorStarvationRule(),
    new PredatorMaxAgeRule(),
    new PreyReproductionRule(),
    new PredatorReproductionRule(),
  ];
}

class AgingRule implements WorldRule {
  public update(world: World, dt: number): void {
    for (const animal of world.animals) {
      animal.age += dt;
    }
  }
}

class GrassRegrowthRule implements WorldRule {
  public update(world: World, dt: number): void {
    if (world.grass.length < MAX_GRASS_COUNT && Math.random() < GRASS_REGROW_RATE * dt) {
      world.spawnGrass();
    }
  }
}

class MovementRule implements WorldRule {
  public update(world: World, dt: number): void {
    const worldSize = world.size;
    const animals = world.animals;

    for (const prey of world.prey) {
      prey.move(world.predators, animals, dt, worldSize);
    }

    for (const predator of world.predators) {
      predator.move(world.prey, animals, dt, worldSize);
    }
  }
}

class PreyEnergyDecayRule implements WorldRule {
  public update(world: World, dt: number): void {
    for (const prey of world.prey) {
      prey.energy -= PREY_ENERGY_DECAY_RATE * dt;
    }
  }
}

class PreyGrazingRule implements WorldRule {
  public update(world: World): void {
    const worldSize = world.size;

    for (const prey of world.prey) {
      const grass = this.nearestEdibleGrass(prey, world.grass, worldSize);
      if (grass && world.eatGrass(grass)) {
        prey.energy = Math.min(PREY_MAX_ENERGY, prey.energy + PREY_ENERGY_PER_GRASS);
      }
    }
  }

  private nearestEdibleGrass(
    prey: Prey,
    grasses: readonly Readonly<Grass>[],
    worldSize: WorldSize,
  ): Readonly<Grass> | null {
    let targetGrass: Readonly<Grass> | null = null;
    let targetDistance = GRAZE_DISTANCE;

    for (const grass of grasses) {
      const distance = torusDistance(prey.x, prey.y, grass.x, grass.y, worldSize);
      if (distance < targetDistance) {
        targetGrass = grass;
        targetDistance = distance;
      }
    }

    return targetGrass;
  }
}

class PreyStarvationRule implements WorldRule {
  public update(world: World): void {
    for (const prey of [...world.prey]) {
      if (prey.energy <= STARVATION_ENERGY_THRESHOLD) {
        world.killPrey(prey);
      }
    }
  }
}

class PredationRule implements WorldRule {
  public update(world: World): void {
    const worldSize = world.size;

    for (const predator of world.predators) {
      const targetPrey = this.nearestEdiblePrey(predator, world.prey, worldSize);
      if (targetPrey) {
        if (world.killPrey(targetPrey)) {
          predator.energy += PREDATOR_ENERGY_PER_PREY;
        }
      }
    }
  }

  private nearestEdiblePrey(predator: Predator, prey: readonly Prey[], worldSize: WorldSize): Prey | null {
    let targetPrey: Prey | null = null;
    let targetDistance = EAT_DISTANCE;
    for (const candidate of prey) {
      const distance = predator.distanceTo(candidate, worldSize);
      if (distance < targetDistance) {
        targetPrey = candidate;
        targetDistance = distance;
      }
    }
    return targetPrey;
  }
}

class PredatorEnergyDecayRule implements WorldRule {
  public update(world: World, dt: number): void {
    for (const predator of world.predators) {
      predator.energy -= dt;
    }
  }
}

class PredatorStarvationRule implements WorldRule {
  public update(world: World): void {
    for (const predator of [...world.predators]) {
      if (predator.energy <= STARVATION_ENERGY_THRESHOLD) {
        world.killPredator(predator);
      }
    }
  }
}

class PredatorMaxAgeRule implements WorldRule {
  public update(world: World, _dt: number, params: WorldRuleParams): void {
    for (const predator of [...world.predators]) {
      if (predator.age > params.predatorHunger * PREDATOR_MAX_AGE_FACTOR) {
        world.killPredator(predator);
      }
    }
  }
}

class PreyReproductionRule implements WorldRule {
  public update(world: World, dt: number, params: WorldRuleParams): void {
    for (const prey of [...world.prey]) {
      if (Math.random() < params.preyBirthRate * dt) {
        world.spawnPrey(prey.x + randomSigned(PREY_SPAWN_OFFSET_RANGE), prey.y + randomSigned(PREY_SPAWN_OFFSET_RANGE));
      }
    }
  }
}

class PredatorReproductionRule implements WorldRule {
  public update(world: World, _dt: number, params: WorldRuleParams): void {
    for (const predator of [...world.predators]) {
      if (predator.energy > params.predatorHunger) {
        predator.energy *= PREDATOR_REPRODUCTION_ENERGY_RETAINED;
        world.spawnPredator(
          predator.x + randomSigned(PREDATOR_SPAWN_OFFSET_RANGE),
          predator.y + randomSigned(PREDATOR_SPAWN_OFFSET_RANGE),
        );
      }
    }
  }
}
