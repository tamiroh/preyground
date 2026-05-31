import { World } from "../src/lib/world.ts";
import type { WorldRuleParams } from "../src/lib/world-rules.ts";

type CliOptions = WorldRuleParams & {
  reportEvery: number;
  speed: number;
  untilTime: number;
};

type PartialCliOptions = Partial<CliOptions>;

const WORLD_SIZE = {
  width: 1280,
  height: 720,
};

const FIXED_DT = 1 / 60;
const TABLE_COLUMNS = [
  { key: "time", label: "time", width: 7 },
  { key: "prey", label: "prey", width: 7 },
  { key: "predators", label: "predators", width: 11 },
  { key: "grass", label: "grass", width: 7 },
  { key: "killedPrey", label: "killedPrey", width: 12 },
  { key: "killedPredators", label: "killedPredators", width: 16 },
] as const;

type TableRow = Record<(typeof TABLE_COLUMNS)[number]["key"], string | number>;

const options = parseOptions(process.argv.slice(2));
runSimulation(options);

function parseOptions(args: string[]): CliOptions {
  const options: PartialCliOptions = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === "--prey-birth-rate" && next) {
      options.preyBirthRate = Number(next);
      index += 1;
    } else if (arg === "--predator-hunger" && next) {
      options.predatorHunger = Number(next);
      index += 1;
    } else if (arg === "--until-time" && next) {
      options.untilTime = Number(next);
      index += 1;
    } else if (arg === "--speed" && next) {
      options.speed = Number(next);
      index += 1;
    } else if (arg === "--report-every" && next) {
      options.reportEvery = Number(next);
      index += 1;
    }
  }
  assertCompleteOptions(options);
  return options;
}

function assertCompleteOptions(options: PartialCliOptions): asserts options is CliOptions {
  const missingOptions = [
    ["preyBirthRate", "--prey-birth-rate"],
    ["predatorHunger", "--predator-hunger"],
    ["reportEvery", "--report-every"],
    ["speed", "--speed"],
    ["untilTime", "--until-time"],
  ].filter(([key]) => options[key as keyof CliOptions] === undefined);

  if (missingOptions.length > 0) {
    console.error(`Missing required options: ${missingOptions.map(([, flag]) => flag).join(", ")}`);
    console.error("Usage: npm run cli -- --until-time 180 --speed 8 --report-every 1 --prey-birth-rate 0.025 --predator-hunger 22");
    process.exit(1);
  }
}

function runSimulation(options: CliOptions): void {
  const world = new World(WORLD_SIZE);
  world.reset();
  printHeader(options);
  printStats(world);

  let nextReportTime = options.reportEvery;
  while (world.stats.elapsed < options.untilTime) {
    for (let speedStep = 0; speedStep < options.speed; speedStep += 1) {
      world.step(FIXED_DT, options);
    }

    if (world.stats.elapsed >= nextReportTime || world.stats.elapsed >= options.untilTime) {
      printStats(world);
      nextReportTime += options.reportEvery;
    }
  }
}

function printHeader(options: CliOptions): void {
  console.log([
    `preyBirthRate=${options.preyBirthRate}`,
    `predatorHunger=${options.predatorHunger}`,
    `speed=${options.speed}`,
    `untilTime=${options.untilTime}`,
  ].join("  "));
  console.log(formatRow({
    time: "time",
    prey: "prey",
    predators: "predators",
    grass: "grass",
    killedPrey: "killedPrey",
    killedPredators: "killedPredators",
  }));
}

function printStats(world: World): void {
  const stats = world.stats;
  console.log(formatRow({
    time: stats.elapsed.toFixed(0),
    prey: stats.preyCount,
    predators: stats.predatorCount,
    grass: world.grass.length,
    killedPrey: stats.killedPreyCount,
    killedPredators: stats.killedPredatorCount,
  }));
}

function formatRow(row: TableRow): string {
  return TABLE_COLUMNS
    .map((column) => String(row[column.key]).padStart(column.width))
    .join("  ");
}
