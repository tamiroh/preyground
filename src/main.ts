import {
  CanvasRenderer,
  type ChartPoint,
  type PopulationHistory,
} from "./lib/renderer.ts";
import "./style.css";
import type { Size } from "./lib/math.ts";
import { SimulationUi } from "./lib/ui.ts";
import { World } from "./lib/world.ts";

const FIXED_DT = 1 / 60;

const appElement = requireElement<HTMLElement>("#app");

const renderer = new CanvasRenderer(appElement);
const ui = new SimulationUi(appElement);
const world = new World(measure());

function measure(): Size {
  return {
    width: appElement.clientWidth,
    height: appElement.clientHeight,
  };
}

function requireElement<E extends Element>(selector: string): E {
  const element = document.querySelector<E>(selector);
  if (!element) {
    throw new Error(`Element ${selector} was not found.`);
  }
  return element;
}

let running = true;
let populationChartVisible = false;
let preyHistory: ChartPoint[] = [];
let predatorHistory: ChartPoint[] = [];
let lastRecordedTime = -1;

function resize(): void {
  const worldSize = measure();
  renderer.resize(worldSize);
  world.resize(worldSize);
}

function tick(): void {
  requestAnimationFrame(tick);
  if (running) {
    const speed = ui.getSpeed();
    const params = ui.getParams();
    for (let i = 0; i < speed; i += 1) {
      world.step(FIXED_DT, params);
    }
  }
  const stats = world.stats;
  recordPopulationHistory(stats.elapsed, stats.preyCount, stats.predatorCount);
  ui.updateStats(stats);
  renderer.render(world.animals, world.grass, populationChartVisible ? getPopulationHistory() : null);
}

function recordPopulationHistory(time: number, preyCount: number, predatorCount: number): void {
  if (time === lastRecordedTime) {
    return;
  }
  lastRecordedTime = time;
  preyHistory.push({ time, value: preyCount });
  predatorHistory.push({ time, value: predatorCount });
}

function getPopulationHistory(): PopulationHistory {
  return {
    prey: preyHistory,
    predators: predatorHistory,
  };
}

ui.onToggleRun(() => {
  running = !running;
  ui.setRunning(running);
});

ui.onReset(() => {
  world.reset();
  preyHistory = [];
  predatorHistory = [];
  lastRecordedTime = -1;
});

ui.onTogglePopulationChart(() => {
  populationChartVisible = !populationChartVisible;
  ui.setPopulationChartVisible(populationChartVisible);
});

window.addEventListener("resize", resize);

resize();
world.reset();
ui.setRunning(running);
ui.setPopulationChartVisible(populationChartVisible);
requestAnimationFrame(tick);
