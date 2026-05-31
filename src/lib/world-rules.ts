import type { Predator, Prey } from "./animal";
import { randomSigned } from "./math";
import type { World } from "./world";

const EAT_DISTANCE = 8;

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
    new MovementRule(),
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
    for (const animal of world.getAnimals()) {
      animal.age += dt;
    }
  }
}

class MovementRule implements WorldRule {
  public update(world: World, dt: number): void {
    for (const prey of world.prey) {
      prey.move(world.predators, dt, world.width, world.height);
    }

    for (const predator of world.predators) {
      predator.move(world.prey, dt, world.width, world.height);
    }
  }
}

class PredationRule implements WorldRule {
  public update(world: World): void {
    for (const predator of world.predators) {
      const targetPrey = this.nearestEdiblePrey(predator, world.prey, world.width, world.height);
      if (targetPrey) {
        world.killPrey(targetPrey);
        predator.energy += 9;
        world.eatenCount += 1;
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
