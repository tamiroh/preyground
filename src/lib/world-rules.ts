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
    new MovementRule(),
    new PredationRule(),
    new PredatorStarvationRule(),
    new PreyReproductionRule(),
    new PredatorReproductionRule(),
  ];
}

class MovementRule implements WorldRule {
  public update(world: World, dt: number): void {
    for (const prey of world.prey) {
      prey.age += dt;
      prey.move(world.predators, dt, world.width, world.height);
    }

    for (const predator of world.predators) {
      predator.age += dt;
      predator.move(world.pending.livingPrey, dt, world.width, world.height);
    }
  }
}

class PredationRule implements WorldRule {
  public update(world: World): void {
    for (const predator of world.predators) {
      const target = this.nearestEdiblePrey(predator, world.pending.livingPrey, world.width, world.height);
      if (target) {
        world.queuePreyDeath(target);
        predator.energy += 9;
        world.eatenCount += 1;
      }
    }
  }

  private nearestEdiblePrey(predator: Predator, prey: readonly Prey[], width: number, height: number): Prey | null {
    let target: Prey | null = null;
    let targetDistance = EAT_DISTANCE;
    for (const candidate of prey) {
      const distance = predator.distanceTo(candidate, width, height);
      if (distance < targetDistance) {
        target = candidate;
        targetDistance = distance;
      }
    }
    return target;
  }
}

class PredatorStarvationRule implements WorldRule {
  public update(world: World, dt: number, params: WorldRuleParams): void {
    for (const predator of world.predators) {
      predator.energy -= dt;
      if (predator.energy <= 0 || predator.age > params.predatorHunger * 2.4) {
        world.queuePredatorDeath(predator);
      }
    }
  }
}

class PreyReproductionRule implements WorldRule {
  public update(world: World, dt: number, params: WorldRuleParams): void {
    for (const prey of world.prey) {
      if (Math.random() < params.preyBirthRate * dt) {
        world.queuePreySpawn(prey.x + randomSigned(12), prey.y + randomSigned(12));
      }
    }
  }
}

class PredatorReproductionRule implements WorldRule {
  public update(world: World, _dt: number, params: WorldRuleParams): void {
    for (const predator of world.predators) {
      if (predator.energy > params.predatorHunger) {
        predator.energy *= 0.52;
        world.queuePredatorSpawn(predator.x + randomSigned(10), predator.y + randomSigned(10));
      }
    }
  }
}
