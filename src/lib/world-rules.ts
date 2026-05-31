import type { Predator, Prey } from "./animal";
import {
  randomSigned,
  torusDistance,
} from "./math";
import type { Grass, World } from "./world";

const EAT_DISTANCE = 8;
const PREDATOR_ENERGY_PER_PREY = 9;
const GRAZE_DISTANCE = 10;
const GRASS_REGROW_RATE = 5.5;
const MAX_GRASS_COUNT = 260;
const PREY_ENERGY_DECAY_RATE = 0.42;
const PREY_ENERGY_PER_GRASS = 7;
const PREY_MAX_ENERGY = 9;

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
    const size = world.size;
    const animals = world.animals;

    for (const prey of world.prey) {
      prey.move(world.predators, animals, dt, size.width, size.height);
    }

    for (const predator of world.predators) {
      predator.move(world.prey, animals, dt, size.width, size.height);
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
    const size = world.size;

    for (const prey of world.prey) {
      const grass = this.nearestEdibleGrass(prey, world.grass, size.width, size.height);
      if (grass && world.eatGrass(grass)) {
        prey.energy = Math.min(PREY_MAX_ENERGY, prey.energy + PREY_ENERGY_PER_GRASS);
      }
    }
  }

  private nearestEdibleGrass(
    prey: Prey,
    grasses: readonly Readonly<Grass>[],
    width: number,
    height: number,
  ): Readonly<Grass> | null {
    let targetGrass: Readonly<Grass> | null = null;
    let targetDistance = GRAZE_DISTANCE;

    for (const grass of grasses) {
      const distance = torusDistance(prey.x, prey.y, grass.x, grass.y, width, height);
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
      if (prey.energy <= 0) {
        world.killPrey(prey);
      }
    }
  }
}

class PredationRule implements WorldRule {
  public update(world: World): void {
    const size = world.size;

    for (const predator of world.predators) {
      const targetPrey = this.nearestEdiblePrey(predator, world.prey, size.width, size.height);
      if (targetPrey) {
        if (world.killPrey(targetPrey)) {
          predator.energy += PREDATOR_ENERGY_PER_PREY;
        }
      }
    }
  }

  private nearestEdiblePrey(predator: Predator, prey: readonly Prey[], width: number, height: number): Prey | null {
    let targetPrey: Prey | null = null;
    let targetDistance = EAT_DISTANCE;
    for (const candidate of prey) {
      const distance = predator.distanceTo(candidate, width, height);
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
      if (predator.energy <= 0) {
        world.killPredator(predator);
      }
    }
  }
}

class PredatorMaxAgeRule implements WorldRule {
  public update(world: World, _dt: number, params: WorldRuleParams): void {
    for (const predator of [...world.predators]) {
      if (predator.age > params.predatorHunger * 2.4) {
        world.killPredator(predator);
      }
    }
  }
}

class PreyReproductionRule implements WorldRule {
  public update(world: World, dt: number, params: WorldRuleParams): void {
    for (const prey of [...world.prey]) {
      if (Math.random() < params.preyBirthRate * dt) {
        world.spawnPrey(prey.x + randomSigned(12), prey.y + randomSigned(12));
      }
    }
  }
}

class PredatorReproductionRule implements WorldRule {
  public update(world: World, _dt: number, params: WorldRuleParams): void {
    for (const predator of [...world.predators]) {
      if (predator.energy > params.predatorHunger) {
        predator.energy *= 0.52;
        world.spawnPredator(predator.x + randomSigned(10), predator.y + randomSigned(10));
      }
    }
  }
}
